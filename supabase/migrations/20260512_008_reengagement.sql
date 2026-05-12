-- ============================================================================
-- Phase 6: Re-engagement Integration
-- Automation enrollments, drip sequences, mentor nudge notifications
-- ============================================================================

-- ─── Re-engagement Automation Templates ─────────────────────────────────────
-- Stores pre-built drip sequences that seekers can be enrolled into

CREATE TABLE IF NOT EXISTS reengagement_templates (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id  TEXT NOT NULL,
  slug        TEXT NOT NULL,
  name        TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  trigger_type TEXT NOT NULL DEFAULT 'manual',  -- manual | streak_broken | silence | dropout_risk
  steps       JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(account_id, slug)
);

-- ─── Automation Enrollments ─────────────────────────────────────────────────
-- Tracks which seekers are enrolled in which automation sequences

CREATE TABLE IF NOT EXISTS automation_enrollments (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id    TEXT NOT NULL,
  actor_id      TEXT NOT NULL,
  actor_type    TEXT NOT NULL DEFAULT 'seeker',
  template_id   UUID NOT NULL REFERENCES reengagement_templates(id) ON DELETE CASCADE,
  status        TEXT NOT NULL DEFAULT 'active',  -- active | completed | cancelled
  current_step  INT NOT NULL DEFAULT 0,
  enrolled_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_step_at  TIMESTAMPTZ,
  completed_at  TIMESTAMPTZ,
  metadata_     JSONB NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE(actor_id, template_id, status)  -- prevent duplicate active enrollments
);

-- ─── Drip Messages Log ──────────────────────────────────────────────────────
-- Logs each message sent as part of a drip sequence

CREATE TABLE IF NOT EXISTS drip_messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id      TEXT NOT NULL,
  enrollment_id   UUID NOT NULL REFERENCES automation_enrollments(id) ON DELETE CASCADE,
  step_index      INT NOT NULL,
  message_content TEXT NOT NULL,
  channel         TEXT NOT NULL DEFAULT 'in_app',  -- in_app | push | sms | whatsapp
  status          TEXT NOT NULL DEFAULT 'pending',  -- pending | sent | delivered | failed
  scheduled_at    TIMESTAMPTZ NOT NULL,
  sent_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Indexes ────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_reengagement_templates_account
  ON reengagement_templates(account_id);

CREATE INDEX IF NOT EXISTS idx_enrollments_actor
  ON automation_enrollments(actor_id, status);

CREATE INDEX IF NOT EXISTS idx_enrollments_template
  ON automation_enrollments(template_id, status);

CREATE INDEX IF NOT EXISTS idx_drip_messages_enrollment
  ON drip_messages(enrollment_id, step_index);

CREATE INDEX IF NOT EXISTS idx_drip_messages_scheduled
  ON drip_messages(status, scheduled_at)
  WHERE status = 'pending';

-- ─── RLS Policies ───────────────────────────────────────────────────────────

ALTER TABLE reengagement_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE drip_messages          ENABLE ROW LEVEL SECURITY;

CREATE POLICY reengagement_templates_service_all ON reengagement_templates
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY automation_enrollments_service_all ON automation_enrollments
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY drip_messages_service_all ON drip_messages
  FOR ALL USING (true) WITH CHECK (true);

-- ─── SQL Function: enroll_in_automation ─────────────────────────────────────
-- Idempotent enrollment: skips if already active in this template

CREATE OR REPLACE FUNCTION enroll_in_automation(
  p_account_id  TEXT,
  p_actor_id    TEXT,
  p_actor_type  TEXT,
  p_template_slug TEXT,
  p_metadata    JSONB DEFAULT '{}'::jsonb
)
RETURNS TABLE(
  enrollment_id UUID,
  template_name TEXT,
  steps_count   INT,
  status        TEXT
)
LANGUAGE plpgsql AS $$
DECLARE
  v_template   reengagement_templates%ROWTYPE;
  v_existing   UUID;
  v_enrollment UUID;
  v_steps      JSONB;
  v_step       JSONB;
  v_step_idx   INT;
  v_delay_hrs  INT;
  v_scheduled  TIMESTAMPTZ;
BEGIN
  -- 1. Find the template
  SELECT * INTO v_template
    FROM reengagement_templates
   WHERE account_id = p_account_id
     AND slug = p_template_slug
     AND is_active = true;

  IF v_template.id IS NULL THEN
    RETURN QUERY SELECT NULL::UUID, 'template_not_found'::TEXT, 0, 'error'::TEXT;
    RETURN;
  END IF;

  -- 2. Check for existing active enrollment
  SELECT ae.id INTO v_existing
    FROM automation_enrollments ae
   WHERE ae.actor_id = p_actor_id
     AND ae.template_id = v_template.id
     AND ae.status = 'active';

  IF v_existing IS NOT NULL THEN
    RETURN QUERY SELECT v_existing, v_template.name, jsonb_array_length(v_template.steps), 'already_enrolled'::TEXT;
    RETURN;
  END IF;

  -- 3. Create enrollment
  INSERT INTO automation_enrollments (account_id, actor_id, actor_type, template_id, metadata_)
    VALUES (p_account_id, p_actor_id, p_actor_type, v_template.id, p_metadata)
    RETURNING id INTO v_enrollment;

  -- 4. Schedule drip messages for each step
  v_steps := v_template.steps;
  FOR v_step_idx IN 0 .. jsonb_array_length(v_steps) - 1 LOOP
    v_step := v_steps -> v_step_idx;
    v_delay_hrs := COALESCE((v_step ->> 'delay_hours')::INT, 0);
    v_scheduled := now() + (v_delay_hrs || ' hours')::INTERVAL;

    INSERT INTO drip_messages (account_id, enrollment_id, step_index, message_content, channel, scheduled_at)
      VALUES (
        p_account_id,
        v_enrollment,
        v_step_idx,
        COALESCE(v_step ->> 'message', ''),
        COALESCE(v_step ->> 'channel', 'in_app'),
        v_scheduled
      );
  END LOOP;

  RETURN QUERY SELECT v_enrollment, v_template.name, jsonb_array_length(v_steps), 'enrolled'::TEXT;
END;
$$;

-- ─── SQL Function: process_due_drips ────────────────────────────────────────
-- Called by a cron/worker to send pending drip messages that are due

CREATE OR REPLACE FUNCTION process_due_drips(p_limit INT DEFAULT 50)
RETURNS TABLE(
  drip_id       UUID,
  enrollment_id UUID,
  actor_id      TEXT,
  message       TEXT,
  channel       TEXT
)
LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
    WITH due AS (
      SELECT dm.id, dm.enrollment_id, ae.actor_id, dm.message_content, dm.channel
        FROM drip_messages dm
        JOIN automation_enrollments ae ON ae.id = dm.enrollment_id
       WHERE dm.status = 'pending'
         AND dm.scheduled_at <= now()
         AND ae.status = 'active'
       ORDER BY dm.scheduled_at
       LIMIT p_limit
       FOR UPDATE OF dm SKIP LOCKED
    ),
    updated AS (
      UPDATE drip_messages
         SET status = 'sent', sent_at = now()
       WHERE id IN (SELECT due.id FROM due)
      RETURNING id
    )
    SELECT due.id, due.enrollment_id, due.actor_id, due.message_content, due.channel
      FROM due;
END;
$$;

-- ─── Seed: Re-engagement Templates ─────────────────────────────────────────

INSERT INTO reengagement_templates (account_id, slug, name, description, trigger_type, steps)
VALUES
-- "We Miss You" — 3-day silence drip
('tenant-1', 'we_miss_you', 'We Miss You',
 'Re-engagement sequence for seekers who have been silent for 3+ days',
 'silence',
 '[
   {"delay_hours": 0, "channel": "in_app", "message": "Hey {FIRST_NAME}, we noticed you''ve been quiet. Here''s something that might interest you: {RECOMMENDED_CONTENT}"},
   {"delay_hours": 48, "channel": "in_app", "message": "Your mentor {MENTOR_NAME} is here for you. Feel free to reach out anytime."},
   {"delay_hours": 120, "channel": "in_app", "message": "You were making great progress! You''re at Level {LEVEL} with {XP} XP. Keep going!"}
 ]'::jsonb),

-- "Streak Recovery" — streak broken drip
('tenant-1', 'streak_recovery', 'Streak Recovery',
 'Quick re-engagement for seekers whose streak just broke',
 'streak_broken',
 '[
   {"delay_hours": 0, "channel": "in_app", "message": "Your {STREAK_LENGTH}-day streak ended, but you can start a new one today! View any content to begin."},
   {"delay_hours": 24, "channel": "in_app", "message": "Here''s a quick 2-minute devotional to get back on track: {CONTENT_LINK}"}
 ]'::jsonb)

ON CONFLICT DO NOTHING;

-- ─── Seed: Add a "Mentor Nudge" behavior rule ──────────────────────────────
-- When dropout risk transitions to high/critical, notify the assigned mentor

INSERT INTO behavior_rules (account_id, name, description, actor_type, trigger_event, conditions, actions, cooldown_seconds, daily_cap, priority)
VALUES
('tenant-1', 'Mentor Nudge on Dropout Risk',
 'Notify assigned mentor when a seeker''s dropout risk becomes high or critical',
 'seeker', 'gamification.dropout_risk_changed',
 '[{"field":"dropout_risk","op":"in","value":["high","critical"]}]'::jsonb,
 '[{"type":"mentor_nudge","notification_type":"seeker_needs_attention"}]'::jsonb,
 86400, 1, 25)

ON CONFLICT DO NOTHING;

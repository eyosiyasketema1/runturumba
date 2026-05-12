-- ============================================================================
-- Phase 2 Migration: Behavior Rules Engine
-- Configurable rules that convert engagement events into XP and actions
-- ============================================================================

-- 1. Create behavior_rules table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS behavior_rules (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id        TEXT NOT NULL,
  name              VARCHAR(255) NOT NULL,
  description       TEXT,
  actor_type        VARCHAR(20) NOT NULL DEFAULT 'both' CHECK (actor_type IN ('seeker', 'mentor', 'both')),
  trigger_event     VARCHAR(100) NOT NULL,
  conditions        JSONB NOT NULL DEFAULT '[]',
  actions           JSONB NOT NULL DEFAULT '[]',
  cooldown_seconds  INTEGER,
  daily_cap         INTEGER,
  priority          INTEGER NOT NULL DEFAULT 100,
  is_active         BOOLEAN NOT NULL DEFAULT true,
  variant           VARCHAR(20),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Indexes
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_br_account     ON behavior_rules (account_id);
CREATE INDEX IF NOT EXISTS idx_br_trigger     ON behavior_rules (trigger_event);
CREATE INDEX IF NOT EXISTS idx_br_active      ON behavior_rules (is_active);
CREATE INDEX IF NOT EXISTS idx_br_priority    ON behavior_rules (priority);
CREATE INDEX IF NOT EXISTS idx_br_account_trigger ON behavior_rules (account_id, trigger_event, is_active);

-- 3. Auto-update trigger
-- ----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS set_updated_at ON behavior_rules;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON behavior_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 4. Row Level Security
-- ----------------------------------------------------------------------------
ALTER TABLE behavior_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all" ON behavior_rules
  FOR ALL USING (true) WITH CHECK (true);

-- 5. Seed 10 default behavior rules (from architecture doc)
-- ----------------------------------------------------------------------------
INSERT INTO behavior_rules (account_id, name, description, actor_type, trigger_event, conditions, actions, cooldown_seconds, daily_cap, priority) VALUES

-- Rule 1: Content Viewed → +10 XP + streak
('tenant-1', 'Content Viewed',
 'Award XP when a seeker views any content item',
 'seeker', 'engagement.event_recorded',
 '[{"field":"event_type","op":"eq","value":"content_viewed"}]'::jsonb,
 '[{"type":"award_xp","points":10},{"type":"update_streak"}]'::jsonb,
 60, 20, 100),

-- Rule 2: Devotional Bonus → +5 XP extra
('tenant-1', 'Devotional Bonus',
 'Extra XP for viewing devotional content specifically',
 'seeker', 'engagement.event_recorded',
 '[{"field":"event_type","op":"eq","value":"content_viewed"},{"field":"content_type","op":"eq","value":"devotional"}]'::jsonb,
 '[{"type":"award_xp","points":5}]'::jsonb,
 60, 10, 90),

-- Rule 3: Quiz Completed → +25 XP + check badge
('tenant-1', 'Quiz Completed',
 'Award XP and check for quiz master badge when quiz is completed',
 'seeker', 'engagement.event_recorded',
 '[{"field":"event_type","op":"eq","value":"content_viewed"},{"field":"content_type","op":"eq","value":"quiz"}]'::jsonb,
 '[{"type":"award_xp","points":25},{"type":"check_badge","badge_slug":"quiz_master"}]'::jsonb,
 NULL, NULL, 80),

-- Rule 4: Session Started → +5 XP + streak
('tenant-1', 'Session Started',
 'Award XP when a seeker starts a new session (app open / content start)',
 'seeker', 'engagement.event_recorded',
 '[{"field":"event_type","op":"eq","value":"session_started"}]'::jsonb,
 '[{"type":"award_xp","points":5},{"type":"update_streak"}]'::jsonb,
 3600, 3, 100),

-- Rule 5: Milestone Completed → +100 XP + notification
('tenant-1', 'Milestone Completed',
 'Big XP reward when a seeker completes a faith milestone',
 'seeker', 'milestone.completed',
 '[]'::jsonb,
 '[{"type":"award_xp","points":100},{"type":"send_notification","template":"milestone_celebration"}]'::jsonb,
 NULL, NULL, 50),

-- Rule 6: 7-Day Streak → +50 XP + check badge
('tenant-1', '7-Day Streak Bonus',
 'Bonus XP when seeker maintains a 7-day streak',
 'both', 'gamification.streak_updated',
 '[{"field":"current_streak","op":"gte","value":7}]'::jsonb,
 '[{"type":"award_xp","points":50},{"type":"check_badge","badge_slug":"week_warrior"}]'::jsonb,
 NULL, NULL, 70),

-- Rule 7: Mentor Reply → +10 XP
('tenant-1', 'Mentor Reply',
 'Award XP when a mentor sends a message to a seeker',
 'mentor', 'engagement.event_recorded',
 '[{"field":"event_type","op":"eq","value":"message_sent"},{"field":"actor_type","op":"eq","value":"mentor"}]'::jsonb,
 '[{"type":"award_xp","points":10}]'::jsonb,
 60, 30, 100),

-- Rule 8: Fast Mentor Reply → +15 XP + check badge
('tenant-1', 'Fast Mentor Reply',
 'Extra XP when a mentor responds within 30 minutes',
 'mentor', 'engagement.event_recorded',
 '[{"field":"response_time_minutes","op":"lte","value":30},{"field":"actor_type","op":"eq","value":"mentor"}]'::jsonb,
 '[{"type":"award_xp","points":15},{"type":"check_badge","badge_slug":"quick_responder"}]'::jsonb,
 NULL, NULL, 60),

-- Rule 9: Mentor Confirms Milestone → +50 XP (to the mentor)
('tenant-1', 'Mentor Confirms Milestone',
 'Award XP to the mentor who confirms a seeker milestone',
 'mentor', 'milestone.completed',
 '[{"field":"confirmed_by","op":"exists","value":true}]'::jsonb,
 '[{"type":"award_xp","points":50}]'::jsonb,
 NULL, NULL, 50),

-- Rule 10: Dropout Re-engage → enroll automation
('tenant-1', 'Dropout Re-engage',
 'Auto-enroll seeker in re-engagement drip when streak breaks and dropout risk is high',
 'seeker', 'gamification.streak_broken',
 '[{"field":"dropout_risk","op":"in","value":["high","critical"]}]'::jsonb,
 '[{"type":"enroll_automation","automation_id":"re_engagement_drip"}]'::jsonb,
 NULL, NULL, 30)

ON CONFLICT DO NOTHING;

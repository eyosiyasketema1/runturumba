-- ============================================================================
-- Phase 2 Migration: Point Transactions (append-only ledger)
-- Every XP award/penalty is recorded here for full audit trail
-- ============================================================================

-- 1. Create point_transactions table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS point_transactions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id        TEXT NOT NULL,
  actor_id          TEXT NOT NULL,
  actor_type        actor_type NOT NULL,
  points            INTEGER NOT NULL,
  reason            VARCHAR(100) NOT NULL,
  source_event_id   TEXT,
  rule_id           UUID,
  metadata_         JSONB DEFAULT '{}',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Indexes for common queries
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_pt_account       ON point_transactions (account_id);
CREATE INDEX IF NOT EXISTS idx_pt_actor         ON point_transactions (actor_id);
CREATE INDEX IF NOT EXISTS idx_pt_actor_type    ON point_transactions (actor_type);
CREATE INDEX IF NOT EXISTS idx_pt_reason        ON point_transactions (reason);
CREATE INDEX IF NOT EXISTS idx_pt_rule          ON point_transactions (rule_id);
CREATE INDEX IF NOT EXISTS idx_pt_created       ON point_transactions (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pt_source_event  ON point_transactions (source_event_id);
-- Composite index for cooldown/daily cap checks
CREATE INDEX IF NOT EXISTS idx_pt_rule_actor_created ON point_transactions (rule_id, actor_id, created_at DESC);

-- 3. Idempotency: prevent duplicate awards from same event
-- ----------------------------------------------------------------------------
CREATE UNIQUE INDEX IF NOT EXISTS idx_pt_idempotent
  ON point_transactions (source_event_id, rule_id, actor_id)
  WHERE source_event_id IS NOT NULL AND rule_id IS NOT NULL;

-- 4. Row Level Security
-- ----------------------------------------------------------------------------
ALTER TABLE point_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all" ON point_transactions
  FOR ALL USING (true) WITH CHECK (true);

-- 5. Function to award XP (atomic: insert transaction + update profile)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION award_xp(
  p_account_id TEXT,
  p_actor_id TEXT,
  p_actor_type actor_type,
  p_points INTEGER,
  p_reason VARCHAR(100),
  p_source_event_id TEXT DEFAULT NULL,
  p_rule_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS TABLE(transaction_id UUID, new_total_xp INTEGER, new_level INTEGER, new_tier tier_level, level_changed BOOLEAN) AS $$
DECLARE
  v_tx_id UUID;
  v_old_level INTEGER;
  v_new_total INTEGER;
  v_new_level INTEGER;
  v_new_tier tier_level;
BEGIN
  -- Get current level (or 1 if no profile yet)
  SELECT gp.level INTO v_old_level
  FROM gamification_profiles gp
  WHERE gp.account_id = p_account_id AND gp.actor_id = p_actor_id AND gp.actor_type = p_actor_type;

  IF v_old_level IS NULL THEN
    v_old_level := 1;
  END IF;

  -- Insert point transaction
  INSERT INTO point_transactions (account_id, actor_id, actor_type, points, reason, source_event_id, rule_id, metadata_)
  VALUES (p_account_id, p_actor_id, p_actor_type, p_points, p_reason, p_source_event_id, p_rule_id, p_metadata)
  RETURNING id INTO v_tx_id;

  -- Upsert gamification profile
  INSERT INTO gamification_profiles (account_id, actor_id, actor_type, total_xp, last_activity_at)
  VALUES (p_account_id, p_actor_id, p_actor_type, GREATEST(0, p_points), now())
  ON CONFLICT (account_id, actor_id, actor_type) DO UPDATE SET
    total_xp = GREATEST(0, gamification_profiles.total_xp + p_points),
    last_activity_at = now();

  -- Get updated values
  SELECT gp.total_xp, gp.level, gp.tier
  INTO v_new_total, v_new_level, v_new_tier
  FROM gamification_profiles gp
  WHERE gp.account_id = p_account_id AND gp.actor_id = p_actor_id AND gp.actor_type = p_actor_type;

  RETURN QUERY SELECT v_tx_id, v_new_total, v_new_level, v_new_tier, (v_new_level > v_old_level);
END;
$$ LANGUAGE plpgsql;

-- 6. Function to update streak
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_streak(
  p_account_id TEXT,
  p_actor_id TEXT,
  p_actor_type actor_type
)
RETURNS TABLE(new_streak INTEGER, streak_incremented BOOLEAN) AS $$
DECLARE
  v_anchor DATE;
  v_today DATE;
  v_current_streak INTEGER;
  v_tz TEXT;
BEGIN
  -- Get profile timezone and streak anchor
  SELECT gp.streak_anchor_date, gp.current_streak, gp.timezone
  INTO v_anchor, v_current_streak, v_tz
  FROM gamification_profiles gp
  WHERE gp.account_id = p_account_id AND gp.actor_id = p_actor_id AND gp.actor_type = p_actor_type;

  -- Get today in actor's timezone
  v_tz := COALESCE(v_tz, 'Africa/Addis_Ababa');
  v_today := (now() AT TIME ZONE v_tz)::date;

  -- No profile yet — create one with streak = 1
  IF v_anchor IS NULL THEN
    INSERT INTO gamification_profiles (account_id, actor_id, actor_type, current_streak, streak_anchor_date, last_activity_at)
    VALUES (p_account_id, p_actor_id, p_actor_type, 1, v_today, now())
    ON CONFLICT (account_id, actor_id, actor_type) DO UPDATE SET
      current_streak = 1,
      streak_anchor_date = v_today,
      last_activity_at = now();
    RETURN QUERY SELECT 1, true;
    RETURN;
  END IF;

  -- Same day — no change
  IF v_anchor = v_today THEN
    RETURN QUERY SELECT v_current_streak, false;
    RETURN;
  END IF;

  -- Yesterday — increment streak
  IF v_anchor = v_today - 1 THEN
    UPDATE gamification_profiles SET
      current_streak = current_streak + 1,
      streak_anchor_date = v_today,
      last_activity_at = now()
    WHERE account_id = p_account_id AND actor_id = p_actor_id AND actor_type = p_actor_type;

    RETURN QUERY SELECT v_current_streak + 1, true;
    RETURN;
  END IF;

  -- More than 1 day gap — reset streak
  UPDATE gamification_profiles SET
    current_streak = 1,
    streak_anchor_date = v_today,
    last_activity_at = now()
  WHERE account_id = p_account_id AND actor_id = p_actor_id AND actor_type = p_actor_type;

  RETURN QUERY SELECT 1, true;
END;
$$ LANGUAGE plpgsql;

-- 7. Seed some point history for existing profiles
-- ----------------------------------------------------------------------------
INSERT INTO point_transactions (account_id, actor_id, actor_type, points, reason, created_at) VALUES
  ('tenant-1', 'contact-2', 'seeker', 10,  'content_viewed',       now() - interval '12 hours'),
  ('tenant-1', 'contact-2', 'seeker', 25,  'quiz_completed',       now() - interval '10 hours'),
  ('tenant-1', 'contact-2', 'seeker', 100, 'milestone_completed',  now() - interval '6 hours'),
  ('tenant-1', 'contact-5', 'seeker', 10,  'content_viewed',       now() - interval '2 hours'),
  ('tenant-1', 'contact-5', 'seeker', 50,  'streak_bonus_7day',    now() - interval '1 hour'),
  ('tenant-1', 'contact-7', 'seeker', 100, 'milestone_completed',  now() - interval '3 hours'),
  ('tenant-1', 'contact-7', 'seeker', 100, 'milestone_completed',  now() - interval '2 hours'),
  ('tenant-1', 'contact-7', 'seeker', 50,  'streak_bonus_7day',    now() - interval '1 hour'),
  ('tenant-1', 'user-1',    'mentor', 10,  'message_sent',         now() - interval '4 hours'),
  ('tenant-1', 'user-1',    'mentor', 15,  'fast_reply',           now() - interval '3 hours'),
  ('tenant-1', 'user-1',    'mentor', 50,  'milestone_confirmed',  now() - interval '2 hours'),
  ('tenant-1', 'user-2',    'mentor', 10,  'message_sent',         now() - interval '5 hours'),
  ('tenant-1', 'user-2',    'mentor', 10,  'message_sent',         now() - interval '1 hour')
ON CONFLICT DO NOTHING;

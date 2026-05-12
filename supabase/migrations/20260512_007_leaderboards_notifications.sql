-- ============================================================================
-- Phase 4 Migration: Leaderboards & Gamification Notifications
-- Social competition rankings + real-time feedback for gamification events
-- ============================================================================

-- ═══════════════════════════════════════════════════════════════════════════════
-- 1. LEADERBOARD ENTRIES
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS leaderboard_entries (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id  TEXT NOT NULL,
  actor_id    TEXT NOT NULL,
  actor_type  actor_type NOT NULL,
  board_type  VARCHAR(30) NOT NULL CHECK (board_type IN ('weekly', 'monthly', 'all_time')),
  period_key  VARCHAR(20) NOT NULL,  -- e.g. '2026-W19', '2026-05', 'all_time'
  xp_earned   INTEGER NOT NULL DEFAULT 0,
  rank        INTEGER,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (account_id, actor_id, actor_type, board_type, period_key)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_lb_account      ON leaderboard_entries (account_id);
CREATE INDEX IF NOT EXISTS idx_lb_board_period  ON leaderboard_entries (board_type, period_key);
CREATE INDEX IF NOT EXISTS idx_lb_rank         ON leaderboard_entries (rank);
CREATE INDEX IF NOT EXISTS idx_lb_actor        ON leaderboard_entries (actor_id);
CREATE INDEX IF NOT EXISTS idx_lb_lookup       ON leaderboard_entries (account_id, board_type, period_key, actor_type, rank);

-- RLS
ALTER TABLE leaderboard_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lb_entries_all" ON leaderboard_entries
  FOR ALL USING (true) WITH CHECK (true);


-- ═══════════════════════════════════════════════════════════════════════════════
-- 2. GAMIFICATION NOTIFICATIONS
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS gamification_notifications (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id        TEXT NOT NULL,
  actor_id          TEXT NOT NULL,
  actor_type        actor_type NOT NULL,
  notification_type VARCHAR(50) NOT NULL
                    CHECK (notification_type IN (
                      'badge_earned', 'level_up', 'streak_milestone',
                      'milestone_completed', 'rank_change'
                    )),
  title             VARCHAR(255) NOT NULL,
  body              TEXT,
  payload           JSONB DEFAULT '{}',
  is_read           BOOLEAN NOT NULL DEFAULT false,
  read_at           TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_gn_account      ON gamification_notifications (account_id);
CREATE INDEX IF NOT EXISTS idx_gn_actor        ON gamification_notifications (actor_id);
CREATE INDEX IF NOT EXISTS idx_gn_unread       ON gamification_notifications (actor_id, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_gn_type         ON gamification_notifications (notification_type);
CREATE INDEX IF NOT EXISTS idx_gn_created      ON gamification_notifications (created_at DESC);

-- RLS
ALTER TABLE gamification_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "gn_notifications_all" ON gamification_notifications
  FOR ALL USING (true) WITH CHECK (true);


-- ═══════════════════════════════════════════════════════════════════════════════
-- 3. LEADERBOARD RECOMPUTE FUNCTION
-- Recomputes rankings for a given account, board_type, period_key, actor_type
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION recompute_leaderboard(
  p_account_id TEXT,
  p_board_type VARCHAR(30),
  p_period_key VARCHAR(20),
  p_actor_type actor_type DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER := 0;
BEGIN
  -- Upsert entries from point_transactions aggregated by actor
  IF p_board_type = 'all_time' THEN
    -- All-time: sum all transactions
    INSERT INTO leaderboard_entries (account_id, actor_id, actor_type, board_type, period_key, xp_earned, updated_at)
    SELECT
      pt.account_id,
      pt.actor_id,
      pt.actor_type,
      'all_time',
      'all_time',
      SUM(pt.points),
      now()
    FROM point_transactions pt
    WHERE pt.account_id = p_account_id
      AND (p_actor_type IS NULL OR pt.actor_type = p_actor_type)
    GROUP BY pt.account_id, pt.actor_id, pt.actor_type
    ON CONFLICT (account_id, actor_id, actor_type, board_type, period_key) DO UPDATE SET
      xp_earned = EXCLUDED.xp_earned,
      updated_at = now();

  ELSIF p_board_type = 'weekly' THEN
    -- Weekly: filter by ISO week
    INSERT INTO leaderboard_entries (account_id, actor_id, actor_type, board_type, period_key, xp_earned, updated_at)
    SELECT
      pt.account_id,
      pt.actor_id,
      pt.actor_type,
      'weekly',
      p_period_key,
      SUM(pt.points),
      now()
    FROM point_transactions pt
    WHERE pt.account_id = p_account_id
      AND to_char(pt.created_at, 'IYYY-"W"IW') = p_period_key
      AND (p_actor_type IS NULL OR pt.actor_type = p_actor_type)
    GROUP BY pt.account_id, pt.actor_id, pt.actor_type
    ON CONFLICT (account_id, actor_id, actor_type, board_type, period_key) DO UPDATE SET
      xp_earned = EXCLUDED.xp_earned,
      updated_at = now();

  ELSIF p_board_type = 'monthly' THEN
    -- Monthly: filter by YYYY-MM
    INSERT INTO leaderboard_entries (account_id, actor_id, actor_type, board_type, period_key, xp_earned, updated_at)
    SELECT
      pt.account_id,
      pt.actor_id,
      pt.actor_type,
      'monthly',
      p_period_key,
      SUM(pt.points),
      now()
    FROM point_transactions pt
    WHERE pt.account_id = p_account_id
      AND to_char(pt.created_at, 'YYYY-MM') = p_period_key
      AND (p_actor_type IS NULL OR pt.actor_type = p_actor_type)
    GROUP BY pt.account_id, pt.actor_id, pt.actor_type
    ON CONFLICT (account_id, actor_id, actor_type, board_type, period_key) DO UPDATE SET
      xp_earned = EXCLUDED.xp_earned,
      updated_at = now();
  END IF;

  -- Recompute ranks using ROW_NUMBER
  WITH ranked AS (
    SELECT
      le.id,
      ROW_NUMBER() OVER (
        PARTITION BY le.account_id, le.board_type, le.period_key, le.actor_type
        ORDER BY le.xp_earned DESC
      ) AS new_rank
    FROM leaderboard_entries le
    WHERE le.account_id = p_account_id
      AND le.board_type = p_board_type
      AND le.period_key = p_period_key
      AND (p_actor_type IS NULL OR le.actor_type = p_actor_type)
  )
  UPDATE leaderboard_entries le
  SET rank = ranked.new_rank
  FROM ranked
  WHERE le.id = ranked.id;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;


-- ═══════════════════════════════════════════════════════════════════════════════
-- 4. SEED: Compute initial leaderboards from existing point_transactions
-- ═══════════════════════════════════════════════════════════════════════════════

-- Compute current week, current month, and all-time leaderboards
SELECT recompute_leaderboard('tenant-1', 'all_time', 'all_time');
SELECT recompute_leaderboard('tenant-1', 'monthly', to_char(now(), 'YYYY-MM'));
SELECT recompute_leaderboard('tenant-1', 'weekly', to_char(now(), 'IYYY-"W"IW'));


-- ═══════════════════════════════════════════════════════════════════════════════
-- 5. SEED: Sample notifications for testing
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO gamification_notifications (account_id, actor_id, actor_type, notification_type, title, body, payload) VALUES
  ('tenant-1', 'contact-1', 'seeker', 'badge_earned',
   'Badge Earned: First Steps',
   'You completed your first content item! Keep going!',
   '{"badge_slug":"first_steps","badge_name":"First Steps","rarity":"common","xp_reward":10}'::jsonb),

  ('tenant-1', 'contact-2', 'seeker', 'level_up',
   'Level Up!',
   'You reached Level 5 — Silver tier unlocked!',
   '{"new_level":5,"new_tier":"silver"}'::jsonb),

  ('tenant-1', 'contact-5', 'seeker', 'streak_milestone',
   '21-Day Streak!',
   'Incredible consistency! You have been active for 21 days straight.',
   '{"current_streak":21}'::jsonb),

  ('tenant-1', 'user-1', 'mentor', 'badge_earned',
   'Badge Earned: Quick Responder',
   'You responded to 10 seekers within 30 minutes!',
   '{"badge_slug":"quick_responder","badge_name":"Quick Responder","rarity":"rare","xp_reward":75}'::jsonb),

  ('tenant-1', 'contact-7', 'seeker', 'milestone_completed',
   'Milestone: Salvation',
   'Your salvation milestone has been confirmed. What a journey!',
   '{"milestone_type":"salvation"}'::jsonb)

ON CONFLICT DO NOTHING;

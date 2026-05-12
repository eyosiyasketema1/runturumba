-- ============================================================================
-- Phase 3 Migration: Badge Definitions & Badge Awards
-- Achievements system with criteria evaluation and rarity tiers
-- ============================================================================

-- 1. Create badge_definitions table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS badge_definitions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id  TEXT NOT NULL,
  slug        VARCHAR(100) NOT NULL,
  name        VARCHAR(255) NOT NULL,
  description TEXT,
  icon_url    VARCHAR(500),
  category    VARCHAR(50) NOT NULL DEFAULT 'achievement'
              CHECK (category IN ('achievement', 'milestone', 'streak', 'special')),
  criteria    JSONB NOT NULL DEFAULT '{}',
  rarity      VARCHAR(20) NOT NULL DEFAULT 'common'
              CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
  xp_reward   INTEGER NOT NULL DEFAULT 0,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (account_id, slug)
);

-- 2. Indexes
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_bd_account   ON badge_definitions (account_id);
CREATE INDEX IF NOT EXISTS idx_bd_slug      ON badge_definitions (slug);
CREATE INDEX IF NOT EXISTS idx_bd_category  ON badge_definitions (category);
CREATE INDEX IF NOT EXISTS idx_bd_active    ON badge_definitions (is_active);

-- 3. Auto-update trigger
-- ----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS set_updated_at ON badge_definitions;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON badge_definitions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 4. Row Level Security
-- ----------------------------------------------------------------------------
ALTER TABLE badge_definitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all" ON badge_definitions
  FOR ALL USING (true) WITH CHECK (true);

-- 5. Create badge_awards table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS badge_awards (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id  TEXT NOT NULL,
  actor_id    TEXT NOT NULL,
  actor_type  actor_type NOT NULL,
  badge_id    UUID NOT NULL REFERENCES badge_definitions(id) ON DELETE CASCADE,
  awarded_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (actor_id, badge_id)
);

-- 6. Indexes for badge_awards
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_ba_account   ON badge_awards (account_id);
CREATE INDEX IF NOT EXISTS idx_ba_actor     ON badge_awards (actor_id);
CREATE INDEX IF NOT EXISTS idx_ba_badge     ON badge_awards (badge_id);
CREATE INDEX IF NOT EXISTS idx_ba_awarded   ON badge_awards (awarded_at DESC);

-- 7. Row Level Security
-- ----------------------------------------------------------------------------
ALTER TABLE badge_awards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all" ON badge_awards
  FOR ALL USING (true) WITH CHECK (true);

-- 8. Function to award a badge (idempotent — skips if already awarded)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION award_badge(
  p_account_id TEXT,
  p_actor_id TEXT,
  p_actor_type actor_type,
  p_badge_id UUID
)
RETURNS TABLE(awarded BOOLEAN, award_id UUID, xp_bonus INTEGER) AS $$
DECLARE
  v_award_id UUID;
  v_xp INTEGER;
  v_already_exists BOOLEAN;
BEGIN
  -- Check if already awarded
  SELECT EXISTS(
    SELECT 1 FROM badge_awards WHERE actor_id = p_actor_id AND badge_id = p_badge_id
  ) INTO v_already_exists;

  IF v_already_exists THEN
    RETURN QUERY SELECT false, NULL::UUID, 0;
    RETURN;
  END IF;

  -- Get badge XP reward
  SELECT bd.xp_reward INTO v_xp
  FROM badge_definitions bd
  WHERE bd.id = p_badge_id AND bd.account_id = p_account_id AND bd.is_active = true;

  IF v_xp IS NULL THEN
    RETURN QUERY SELECT false, NULL::UUID, 0;
    RETURN;
  END IF;

  -- Insert badge award
  INSERT INTO badge_awards (account_id, actor_id, actor_type, badge_id)
  VALUES (p_account_id, p_actor_id, p_actor_type, p_badge_id)
  RETURNING id INTO v_award_id;

  -- Award bonus XP if applicable
  IF v_xp > 0 THEN
    PERFORM award_xp(p_account_id, p_actor_id, p_actor_type, v_xp, 'badge_earned');
  END IF;

  RETURN QUERY SELECT true, v_award_id, v_xp;
END;
$$ LANGUAGE plpgsql;

-- 9. Seed default badge catalog (13 badges from architecture doc)
-- ----------------------------------------------------------------------------
INSERT INTO badge_definitions (account_id, slug, name, description, category, criteria, rarity, xp_reward) VALUES

-- Achievement badges
('tenant-1', 'first_steps',
 'First Steps', 'Complete your first content item',
 'achievement',
 '{"type":"event_count","event_type":"content_viewed","count":1}'::jsonb,
 'common', 10),

('tenant-1', 'curious_mind',
 'Curious Mind', 'View 10 content items',
 'achievement',
 '{"type":"event_count","event_type":"content_viewed","count":10}'::jsonb,
 'common', 25),

('tenant-1', 'knowledge_seeker',
 'Knowledge Seeker', 'View 50 content items',
 'achievement',
 '{"type":"event_count","event_type":"content_viewed","count":50}'::jsonb,
 'rare', 100),

('tenant-1', 'quiz_master',
 'Quiz Master', 'Complete 10 quizzes',
 'achievement',
 '{"type":"event_count","event_type":"quiz_completed","count":10}'::jsonb,
 'rare', 75),

-- Streak badges
('tenant-1', 'week_warrior',
 'Week Warrior', 'Maintain a 7-day streak',
 'streak',
 '{"type":"streak","min_days":7}'::jsonb,
 'common', 50),

('tenant-1', 'month_strong',
 'Month Strong', 'Maintain a 30-day streak',
 'streak',
 '{"type":"streak","min_days":30}'::jsonb,
 'epic', 200),

-- Milestone badges
('tenant-1', 'salvation_milestone',
 'Salvation', 'Complete the salvation milestone',
 'milestone',
 '{"type":"milestone","milestone_type":"salvation"}'::jsonb,
 'epic', 150),

('tenant-1', 'baptism_milestone',
 'Baptism', 'Complete the baptism milestone',
 'milestone',
 '{"type":"milestone","milestone_type":"baptism"}'::jsonb,
 'epic', 150),

('tenant-1', 'community_milestone',
 'Community', 'Join and participate in community',
 'milestone',
 '{"type":"milestone","milestone_type":"community"}'::jsonb,
 'epic', 150),

('tenant-1', 'growth_milestone',
 'Growth', 'Show evidence of spiritual growth',
 'milestone',
 '{"type":"milestone","milestone_type":"growth"}'::jsonb,
 'epic', 150),

-- Special badges
('tenant-1', 'journey_complete',
 'Journey Complete', 'Complete an entire faith journey',
 'special',
 '{"type":"journey","journey_type":"any"}'::jsonb,
 'legendary', 500),

-- Mentor badges
('tenant-1', 'quick_responder',
 'Quick Responder', 'Respond to 10 seekers within 30 minutes',
 'achievement',
 '{"type":"event_count","event_type":"fast_reply","count":10}'::jsonb,
 'rare', 75),

('tenant-1', 'dedicated_mentor',
 'Dedicated Mentor', 'Earn 5,000 total XP as a mentor',
 'special',
 '{"type":"threshold","field":"total_xp","value":5000}'::jsonb,
 'legendary', 250)

ON CONFLICT DO NOTHING;

-- ============================================================================
-- Phase 2 Migration: Gamification Profiles
-- XP, levels, tiers, streaks for seekers and mentors
-- ============================================================================

-- 1. Create enum types
-- ----------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE actor_type AS ENUM ('seeker', 'mentor');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE tier_level AS ENUM ('bronze', 'silver', 'gold', 'platinum');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


-- 2. Create gamification_profiles table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS gamification_profiles (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id          TEXT NOT NULL,
  actor_id            TEXT NOT NULL,
  actor_type          actor_type NOT NULL,
  total_xp            INTEGER NOT NULL DEFAULT 0 CHECK (total_xp >= 0),
  level               INTEGER NOT NULL DEFAULT 1,
  current_streak      INTEGER NOT NULL DEFAULT 0 CHECK (current_streak >= 0),
  longest_streak      INTEGER NOT NULL DEFAULT 0 CHECK (longest_streak >= 0),
  last_activity_at    TIMESTAMPTZ,
  streak_anchor_date  DATE,
  tier                tier_level NOT NULL DEFAULT 'bronze',
  timezone            VARCHAR(50) NOT NULL DEFAULT 'Africa/Addis_Ababa',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (account_id, actor_id, actor_type)
);

-- 3. Indexes
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_gam_profiles_account    ON gamification_profiles (account_id);
CREATE INDEX IF NOT EXISTS idx_gam_profiles_actor      ON gamification_profiles (actor_id);
CREATE INDEX IF NOT EXISTS idx_gam_profiles_type       ON gamification_profiles (actor_type);
CREATE INDEX IF NOT EXISTS idx_gam_profiles_tier       ON gamification_profiles (tier);
CREATE INDEX IF NOT EXISTS idx_gam_profiles_xp         ON gamification_profiles (total_xp DESC);
CREATE INDEX IF NOT EXISTS idx_gam_profiles_streak     ON gamification_profiles (current_streak DESC);

-- 4. Auto-update trigger (reuse function from Phase 1)
-- ----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS set_updated_at ON gamification_profiles;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON gamification_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 5. Level computation function
-- Level formula: floor(sqrt(total_xp / 50)) + 1
-- L1=0, L2=50, L3=200, L4=450, L5=800, L10=4050, L20=18050
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION compute_level(xp INTEGER)
RETURNS INTEGER AS $$
BEGIN
  RETURN GREATEST(1, floor(sqrt(xp::float / 50.0))::int + 1);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 6. Tier computation function
-- bronze (L1-4), silver (L5-9), gold (L10-19), platinum (L20+)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION compute_tier(lvl INTEGER)
RETURNS tier_level AS $$
BEGIN
  IF lvl >= 20 THEN RETURN 'platinum';
  ELSIF lvl >= 10 THEN RETURN 'gold';
  ELSIF lvl >= 5 THEN RETURN 'silver';
  ELSE RETURN 'bronze';
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 7. Auto-compute level and tier on XP change
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION auto_compute_level_tier()
RETURNS TRIGGER AS $$
DECLARE
  new_level INTEGER;
  new_tier tier_level;
BEGIN
  new_level := compute_level(NEW.total_xp);
  new_tier := compute_tier(new_level);
  NEW.level := new_level;
  NEW.tier := new_tier;
  -- Track longest streak
  IF NEW.current_streak > NEW.longest_streak THEN
    NEW.longest_streak := NEW.current_streak;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS auto_level_tier ON gamification_profiles;
CREATE TRIGGER auto_level_tier
  BEFORE INSERT OR UPDATE OF total_xp, current_streak ON gamification_profiles
  FOR EACH ROW
  EXECUTE FUNCTION auto_compute_level_tier();

-- 8. Row Level Security
-- ----------------------------------------------------------------------------
ALTER TABLE gamification_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all" ON gamification_profiles
  FOR ALL USING (true) WITH CHECK (true);

-- 9. Seed data — profiles for existing contacts and mentors
-- ----------------------------------------------------------------------------
INSERT INTO gamification_profiles (account_id, actor_id, actor_type, total_xp, current_streak, longest_streak, last_activity_at, streak_anchor_date)
VALUES
  -- Seekers (contact IDs from Phase 1)
  ('tenant-1', 'contact-1',  'seeker', 30,    1, 2,  now() - interval '1 day',  CURRENT_DATE - 1),
  ('tenant-1', 'contact-2',  'seeker', 850,  12, 15, now() - interval '2 hours', CURRENT_DATE),
  ('tenant-1', 'contact-3',  'seeker', 220,   5, 8,  now() - interval '6 hours', CURRENT_DATE),
  ('tenant-1', 'contact-4',  'seeker', 15,    0, 1,  now() - interval '3 days',  CURRENT_DATE - 3),
  ('tenant-1', 'contact-5',  'seeker', 2100, 21, 21, now() - interval '1 hour',  CURRENT_DATE),
  ('tenant-1', 'contact-6',  'seeker', 180,   3, 7,  now() - interval '1 day',   CURRENT_DATE - 1),
  ('tenant-1', 'contact-7',  'seeker', 4200, 45, 45, now() - interval '30 min',  CURRENT_DATE),
  ('tenant-1', 'contact-8',  'seeker', 520,   8, 10, now() - interval '4 hours', CURRENT_DATE),
  ('tenant-1', 'contact-9',  'seeker', 95,    2, 4,  now() - interval '1 day',   CURRENT_DATE - 1),
  ('tenant-1', 'contact-10', 'seeker', 5500, 60, 60, now() - interval '1 hour',  CURRENT_DATE),
  -- Mentors (user IDs)
  ('tenant-1', 'user-1', 'mentor', 3200, 30, 35, now() - interval '1 hour',  CURRENT_DATE),
  ('tenant-1', 'user-2', 'mentor', 1800, 14, 20, now() - interval '3 hours', CURRENT_DATE),
  ('tenant-1', 'user-3', 'mentor', 950,   7, 12, now() - interval '5 hours', CURRENT_DATE)
ON CONFLICT DO NOTHING;

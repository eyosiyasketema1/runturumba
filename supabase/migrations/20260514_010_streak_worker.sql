-- ============================================================================
-- Phase 4 / Worker Migration: Streak Worker
-- Daily scheduled job that detects profiles whose activity streaks have
-- gone stale, resets them, and returns a row per broken streak so the
-- caller (the edge function) can fan out gamification.streak_broken
-- events through the rules engine.
-- ============================================================================

-- 1. find_and_break_stale_streaks(account_id?, grace_days?)
--
-- Scans gamification_profiles for entries where:
--   * current_streak > 0
--   * streak_anchor_date is more than `grace_days` behind the actor's local
--     today (per the profile's stored timezone)
--
-- For each match it resets current_streak to 0 in the same transaction and
-- returns the previous streak value plus a heuristic dropout_risk so the
-- caller can drive behavior rules (e.g. Rule 10 "Dropout Re-engage" fires
-- on dropout_risk in [high, critical]).
--
-- Pass p_account_id to scope to a single tenant; NULL processes all tenants.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION find_and_break_stale_streaks(
  p_account_id TEXT DEFAULT NULL,
  p_grace_days INTEGER DEFAULT 1
)
RETURNS TABLE (
  account_id      TEXT,
  actor_id        TEXT,
  actor_type      actor_type,
  previous_streak INTEGER,
  previous_anchor DATE,
  dropout_risk    TEXT
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_grace INTEGER := GREATEST(0, COALESCE(p_grace_days, 1));
BEGIN
  RETURN QUERY
  WITH stale AS (
    SELECT gp.id,
           gp.account_id,
           gp.actor_id,
           gp.actor_type,
           gp.current_streak  AS previous_streak,
           gp.streak_anchor_date AS previous_anchor,
           ((now() AT TIME ZONE COALESCE(gp.timezone, 'Africa/Addis_Ababa'))::date) AS local_today
    FROM gamification_profiles gp
    WHERE gp.current_streak > 0
      AND gp.streak_anchor_date IS NOT NULL
      AND (p_account_id IS NULL OR gp.account_id = p_account_id)
      AND gp.streak_anchor_date < (
            ((now() AT TIME ZONE COALESCE(gp.timezone, 'Africa/Addis_Ababa'))::date) - v_grace
          )
    FOR UPDATE
  ),
  reset AS (
    UPDATE gamification_profiles gp
       SET current_streak = 0
      FROM stale
     WHERE gp.id = stale.id
    RETURNING gp.account_id,
              gp.actor_id,
              gp.actor_type,
              stale.previous_streak,
              stale.previous_anchor
  )
  SELECT r.account_id,
         r.actor_id,
         r.actor_type,
         r.previous_streak,
         r.previous_anchor,
         CASE
           WHEN r.previous_streak >= 30 THEN 'critical'
           WHEN r.previous_streak >= 7  THEN 'high'
           WHEN r.previous_streak >= 3  THEN 'medium'
           ELSE 'low'
         END::text AS dropout_risk
  FROM reset r;
END;
$$;

COMMENT ON FUNCTION find_and_break_stale_streaks(TEXT, INTEGER) IS
  'Streak Worker: resets stale streaks and returns a row per broken streak. '
  'Call from the daily cron job. Edge function fans out '
  'gamification.streak_broken events through the rules engine for each row.';


-- 2. Scheduling notes
--
-- pg_cron is the recommended scheduler in Supabase. Enable it via:
--   Dashboard → Database → Extensions → enable "pg_cron"
--
-- Option A — call the edge function over HTTP (preferred; runs rules engine):
--   First enable the http extension and set the URL/auth as Postgres settings,
--   then:
--
--     ALTER DATABASE postgres SET app.streak_worker_url =
--       'https://<project>.supabase.co/functions/v1/server/make-server-161cb90c/gamification/streak/process';
--     ALTER DATABASE postgres SET app.streak_worker_auth =
--       'Bearer <SERVICE_ROLE_KEY>';
--
--     SELECT cron.schedule(
--       'streak-worker-daily',
--       '5 0 * * *',   -- 00:05 UTC daily, just after midnight
--       $$
--         SELECT net.http_post(
--           url := current_setting('app.streak_worker_url'),
--           headers := jsonb_build_object(
--             'Content-Type', 'application/json',
--             'Authorization', current_setting('app.streak_worker_auth')
--           ),
--           body := '{}'::jsonb
--         );
--       $$
--     );
--
-- Option B — call the SQL function directly (skips the rules engine; only
-- resets streaks, no re-engagement enrollment):
--
--     SELECT cron.schedule(
--       'streak-worker-daily-direct',
--       '5 0 * * *',
--       $$ SELECT count(*) FROM find_and_break_stale_streaks(); $$
--     );
--
-- To unschedule: SELECT cron.unschedule('streak-worker-daily');


-- 3. Fix Rule 10 ("Dropout Re-engage") to reference a real template slug.
--
-- Migration 005 seeded this rule with automation_id = 're_engagement_drip',
-- but no template with that slug was ever created (the actual seeded slugs
-- are 'we_miss_you' and 'streak_recovery' — see migration 008). The result
-- was that streak_broken events fired the rule but enroll_in_automation
-- returned 'template_not_found' every time, so no enrollments were created.
--
-- 'streak_recovery' is the right template — it was explicitly seeded with
-- trigger_type='streak_broken' and a two-step drip designed for this case.
-- ----------------------------------------------------------------------------
UPDATE behavior_rules
   SET actions = '[{"type":"enroll_automation","automation_id":"streak_recovery"}]'::jsonb
 WHERE name = 'Dropout Re-engage'
   AND actions::text LIKE '%re_engagement_drip%';

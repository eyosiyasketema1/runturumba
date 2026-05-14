-- ============================================================================
-- Phase 4 / Worker Migration: Leaderboard Worker
-- Periodic job that recomputes weekly, monthly, and all-time leaderboard
-- rankings for every active tenant so the boards stay fresh as XP is
-- awarded.
--
-- The heavy lifting (filtering point_transactions by period, upserting
-- leaderboard_entries, ROW_NUMBER ranking) is already implemented in
-- recompute_leaderboard() — see migration 007. This worker just iterates
-- the (account × board_type) matrix using the *current* period keys.
-- ============================================================================

-- 1. recompute_all_leaderboards(account_id?)
--
-- For each active account, recomputes the current week, current month, and
-- all-time leaderboards for both actor types (passes NULL so the underlying
-- function processes seekers and mentors together — the API filters per
-- query). Returns one row per (account, board_type, period_key) so the
-- caller can report on what was touched.
--
-- Pass p_account_id to scope to a single tenant; NULL processes every
-- account_id that has any point_transactions.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION recompute_all_leaderboards(
  p_account_id TEXT DEFAULT NULL
)
RETURNS TABLE (
  account_id      TEXT,
  board_type      TEXT,
  period_key      TEXT,
  entries_updated INTEGER
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_account_id TEXT;
  v_count      INTEGER;
  v_week       TEXT := to_char(now(), 'IYYY-"W"IW');
  v_month      TEXT := to_char(now(), 'YYYY-MM');
BEGIN
  FOR v_account_id IN
    SELECT DISTINCT pt.account_id
      FROM point_transactions pt
     WHERE p_account_id IS NULL OR pt.account_id = p_account_id
  LOOP
    -- Weekly
    SELECT recompute_leaderboard(v_account_id, 'weekly', v_week, NULL) INTO v_count;
    account_id      := v_account_id;
    board_type      := 'weekly';
    period_key      := v_week;
    entries_updated := COALESCE(v_count, 0);
    RETURN NEXT;

    -- Monthly
    SELECT recompute_leaderboard(v_account_id, 'monthly', v_month, NULL) INTO v_count;
    account_id      := v_account_id;
    board_type      := 'monthly';
    period_key      := v_month;
    entries_updated := COALESCE(v_count, 0);
    RETURN NEXT;

    -- All-time
    SELECT recompute_leaderboard(v_account_id, 'all_time', 'all_time', NULL) INTO v_count;
    account_id      := v_account_id;
    board_type      := 'all_time';
    period_key      := 'all_time';
    entries_updated := COALESCE(v_count, 0);
    RETURN NEXT;
  END LOOP;
END;
$$;

COMMENT ON FUNCTION recompute_all_leaderboards(TEXT) IS
  'Leaderboard Worker: recomputes weekly/monthly/all-time leaderboards for '
  'every active tenant. Call from the periodic cron job (~every 15 minutes) '
  'or on demand. The single-period recompute_leaderboard function does the '
  'actual ROW_NUMBER ranking.';


-- 2. Scheduling notes
--
-- pg_cron is the recommended scheduler in Supabase. Enable it via:
--   Dashboard → Database → Extensions → enable "pg_cron" (and "pg_net" if
--   you want HTTP fan-out).
--
-- Option A — call the edge function over HTTP (preferred so future hooks
-- like notification fan-out can live in TS):
--
--     ALTER DATABASE postgres SET app.leaderboard_worker_url =
--       'https://<project>.supabase.co/functions/v1/server/make-server-161cb90c/gamification/leaderboard/recompute';
--     ALTER DATABASE postgres SET app.leaderboard_worker_auth =
--       'Bearer <SERVICE_ROLE_KEY>';
--
--     SELECT cron.schedule(
--       'leaderboard-worker',
--       '*/15 * * * *',   -- every 15 minutes
--       $$
--         SELECT net.http_post(
--           url := current_setting('app.leaderboard_worker_url'),
--           headers := jsonb_build_object(
--             'Content-Type', 'application/json',
--             'Authorization', current_setting('app.leaderboard_worker_auth')
--           ),
--           body := '{}'::jsonb
--         );
--       $$
--     );
--
-- Option B — call the SQL function directly (lighter, no HTTP roundtrip):
--
--     SELECT cron.schedule(
--       'leaderboard-worker-direct',
--       '*/15 * * * *',
--       $$ SELECT count(*) FROM recompute_all_leaderboards(); $$
--     );
--
-- To unschedule: SELECT cron.unschedule('leaderboard-worker');

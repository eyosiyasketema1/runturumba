-- ============================================================================
-- Phase 7 Migration: Push Notification Tokens
-- Stores Expo Push tokens per (account, actor) so the drip-processor and
-- other notification flows can deliver pushes to seekers' devices.
-- ============================================================================

CREATE TABLE IF NOT EXISTS push_tokens (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id       TEXT NOT NULL,
  actor_id         TEXT NOT NULL,
  actor_type       actor_type NOT NULL,
  expo_push_token  TEXT NOT NULL,
  platform         TEXT,                 -- 'ios' | 'android' | 'web'
  device_name      TEXT,
  is_active        BOOLEAN NOT NULL DEFAULT true,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (actor_id, expo_push_token)
);

CREATE INDEX IF NOT EXISTS idx_push_tokens_actor
  ON push_tokens (account_id, actor_id, actor_type)
  WHERE is_active;

ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "push_tokens_service_all" ON push_tokens
  FOR ALL USING (true) WITH CHECK (true);

COMMENT ON TABLE push_tokens IS
  'Expo Push tokens registered by mobile clients. The drip-processor and '
  'other event handlers look up active tokens by actor_id to deliver pushes '
  'via Expo''s push API.';

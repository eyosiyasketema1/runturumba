-- ============================================================================
-- Phase 1 Migration: Faith Journeys
-- Creates the faith_journeys table with enums, indexes, and RLS policies
-- ============================================================================

-- 1. Create enum types
-- ----------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE journey_stage AS ENUM ('Touchpoint', 'Engaged', 'Active Journey', 'Decision');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE journey_type AS ENUM ('Salvation', 'Baptism', 'Community', 'Growth');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE journey_source AS ENUM ('Telegram', 'WhatsApp', 'SMS', 'Self-guided', 'Messenger', 'Conversation');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE journey_validation AS ENUM ('Pending', 'Confirmed', 'N/A');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


-- 2. Create faith_journeys table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS faith_journeys (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id      TEXT NOT NULL,
  tenant_id       TEXT NOT NULL,
  source          journey_source NOT NULL DEFAULT 'Conversation',
  type            journey_type NOT NULL DEFAULT 'Salvation',
  stage           journey_stage NOT NULL DEFAULT 'Touchpoint',
  indicators      INTEGER NOT NULL DEFAULT 0 CHECK (indicators >= 0),
  total           INTEGER NOT NULL DEFAULT 7 CHECK (total > 0),
  milestone       TEXT NOT NULL DEFAULT '',
  validation      journey_validation NOT NULL DEFAULT 'N/A',
  language        TEXT NOT NULL DEFAULT 'Amharic',
  assigned_by     TEXT,                              -- mentor user ID who started this journey
  paused_at       TIMESTAMPTZ,                       -- NULL = active, set = paused
  started_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at    TIMESTAMPTZ,                       -- set when stage reaches Decision and all indicators met
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Indexes for common queries
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_faith_journeys_contact   ON faith_journeys (contact_id);
CREATE INDEX IF NOT EXISTS idx_faith_journeys_tenant    ON faith_journeys (tenant_id);
CREATE INDEX IF NOT EXISTS idx_faith_journeys_stage     ON faith_journeys (stage);
CREATE INDEX IF NOT EXISTS idx_faith_journeys_type      ON faith_journeys (type);
CREATE INDEX IF NOT EXISTS idx_faith_journeys_tenant_contact ON faith_journeys (tenant_id, contact_id);

-- 4. Auto-update updated_at trigger
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at ON faith_journeys;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON faith_journeys
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 5. Row Level Security
-- ----------------------------------------------------------------------------
ALTER TABLE faith_journeys ENABLE ROW LEVEL SECURITY;

-- Service role (edge functions) can do everything
CREATE POLICY "service_role_all" ON faith_journeys
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- 6. Seed data (matches the existing mock data in types.ts)
-- ----------------------------------------------------------------------------
INSERT INTO faith_journeys (id, contact_id, tenant_id, source, type, stage, indicators, total, milestone, validation, language, started_at)
VALUES
  (gen_random_uuid(), 'contact-1',  'tenant-1', 'Telegram',     'Salvation',  'Touchpoint',      1, 7, 'First contact',          'N/A',       'Amharic',      '2026-04-15'),
  (gen_random_uuid(), 'contact-2',  'tenant-1', 'WhatsApp',     'Growth',     'Active Journey',  5, 7, 'Weekly mentor check',     'Confirmed', 'Amharic',      '2026-02-10'),
  (gen_random_uuid(), 'contact-3',  'tenant-1', 'Telegram',     'Salvation',  'Engaged',         3, 7, 'Prayer guide step 2',     'Pending',   'Afaan Oromoo', '2026-03-20'),
  (gen_random_uuid(), 'contact-4',  'tenant-1', 'WhatsApp',     'Salvation',  'Touchpoint',      1, 7, 'Initial interest',        'N/A',       'English',      '2026-04-12'),
  (gen_random_uuid(), 'contact-5',  'tenant-1', 'Conversation', 'Community',  'Active Journey',  6, 7, 'Fellowship referral',     'Confirmed', 'Amharic',      '2026-01-25'),
  (gen_random_uuid(), 'contact-6',  'tenant-1', 'Telegram',     'Salvation',  'Engaged',         3, 7, 'Devotional engagement',   'Pending',   'Amharic',      '2026-03-05'),
  (gen_random_uuid(), 'contact-7',  'tenant-1', 'Self-guided',  'Growth',     'Decision',        7, 7, 'All milestones reached',  'Confirmed', 'English',      '2026-01-12'),
  (gen_random_uuid(), 'contact-8',  'tenant-1', 'WhatsApp',     'Community',  'Active Journey',  4, 7, 'Study group started',     'Pending',   'Amharic',      '2026-02-20'),
  (gen_random_uuid(), 'contact-9',  'tenant-1', 'Telegram',     'Salvation',  'Engaged',         2, 7, 'Bible basics started',    'N/A',       'Afaan Oromoo', '2026-03-15'),
  (gen_random_uuid(), 'contact-10', 'tenant-1', 'Self-guided',  'Growth',     'Decision',        7, 7, 'Serving consistently',    'Confirmed', 'Amharic',      '2025-12-01')
ON CONFLICT DO NOTHING;

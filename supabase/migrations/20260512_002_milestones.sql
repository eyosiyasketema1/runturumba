-- ============================================================================
-- Phase 1 Migration: Contact Milestones
-- Creates the contact_milestones and milestone_entries tables
-- ============================================================================

-- 1. Create enum types
-- ----------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE milestone_key AS ENUM ('salvation', 'baptism', 'community', 'growth');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE milestone_state AS ENUM ('done', 'progress', 'pending');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


-- 2. Create contact_milestones table (parent record per contact)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS contact_milestones (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id      TEXT NOT NULL,
  tenant_id       TEXT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (contact_id, tenant_id)
);

-- 3. Create milestone_entries table (individual milestone steps)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS milestone_entries (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_milestone_id UUID NOT NULL REFERENCES contact_milestones(id) ON DELETE CASCADE,
  key                 milestone_key NOT NULL,
  label               TEXT NOT NULL,
  date                TEXT NOT NULL DEFAULT 'Not Started',
  state               milestone_state NOT NULL DEFAULT 'pending',
  sub                 TEXT[] NOT NULL DEFAULT '{}',
  sort_order          INTEGER NOT NULL DEFAULT 0,
  confirmed_by        TEXT,                         -- mentor who confirmed this milestone
  confirmed_at        TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (contact_milestone_id, key)
);

-- 4. Indexes
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_contact_milestones_contact ON contact_milestones (contact_id);
CREATE INDEX IF NOT EXISTS idx_contact_milestones_tenant  ON contact_milestones (tenant_id);
CREATE INDEX IF NOT EXISTS idx_contact_milestones_tenant_contact ON contact_milestones (tenant_id, contact_id);
CREATE INDEX IF NOT EXISTS idx_milestone_entries_parent   ON milestone_entries (contact_milestone_id);
CREATE INDEX IF NOT EXISTS idx_milestone_entries_state    ON milestone_entries (state);

-- 5. Auto-update triggers
-- ----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS set_updated_at ON contact_milestones;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON contact_milestones
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at ON milestone_entries;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON milestone_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 6. Row Level Security
-- ----------------------------------------------------------------------------
ALTER TABLE contact_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestone_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all" ON contact_milestones
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "service_role_all" ON milestone_entries
  FOR ALL USING (true) WITH CHECK (true);

-- 7. Seed data (matches existing mock data)
-- ----------------------------------------------------------------------------

-- Contact 2: Abebe Tadesse (Growth)
WITH cm AS (
  INSERT INTO contact_milestones (contact_id, tenant_id)
  VALUES ('contact-2', 'tenant-1')
  ON CONFLICT DO NOTHING
  RETURNING id
)
INSERT INTO milestone_entries (contact_milestone_id, key, label, date, state, sub, sort_order) VALUES
  ((SELECT id FROM cm), 'salvation',  'Salvation Decision', 'Feb 28, 2026', 'done',     ARRAY['Self-reported during conversation', 'Confirmed by Sarah Chen'], 0),
  ((SELECT id FROM cm), 'baptism',    'Baptism',            'Mar 22, 2026', 'done',     ARRAY['Public statement of faith confirmed'], 1),
  ((SELECT id FROM cm), 'community',  'Community',          'In Progress',  'progress', ARRAY['Referred to local fellowship', 'Awaiting connection confirmation'], 2),
  ((SELECT id FROM cm), 'growth',     'Growth & Serving',   'Not Started',  'pending',  '{}', 3)
ON CONFLICT DO NOTHING;

-- Contact 5
WITH cm AS (
  INSERT INTO contact_milestones (contact_id, tenant_id)
  VALUES ('contact-5', 'tenant-1')
  ON CONFLICT DO NOTHING
  RETURNING id
)
INSERT INTO milestone_entries (contact_milestone_id, key, label, date, state, sub, sort_order) VALUES
  ((SELECT id FROM cm), 'salvation',  'Salvation Decision', 'Feb 5, 2026',  'done', ARRAY['Confirmed by Alex Rivera'], 0),
  ((SELECT id FROM cm), 'baptism',    'Baptism',            'Mar 10, 2026', 'done', ARRAY['Baptized at Addis community gathering'], 1),
  ((SELECT id FROM cm), 'community',  'Community',          'Mar 28, 2026', 'done', ARRAY['Joined Tuesday study group'], 2),
  ((SELECT id FROM cm), 'growth',     'Growth & Serving',   'In Progress',  'progress', ARRAY['Mentoring newer believer', 'Preparing to lead small group'], 3)
ON CONFLICT DO NOTHING;

-- Contact 7
WITH cm AS (
  INSERT INTO contact_milestones (contact_id, tenant_id)
  VALUES ('contact-7', 'tenant-1')
  ON CONFLICT DO NOTHING
  RETURNING id
)
INSERT INTO milestone_entries (contact_milestone_id, key, label, date, state, sub, sort_order) VALUES
  ((SELECT id FROM cm), 'salvation',  'Salvation Decision', 'Feb 1, 2026',  'done', ARRAY['Confirmed by Alex Rivera'], 0),
  ((SELECT id FROM cm), 'baptism',    'Baptism',            'Mar 9, 2026',  'done', ARRAY['Baptized at community gathering'], 1),
  ((SELECT id FROM cm), 'community',  'Community',          'Mar 20, 2026', 'done', ARRAY['Joined Tuesday study group', 'Active fellowship member'], 2),
  ((SELECT id FROM cm), 'growth',     'Growth & Serving',   'Apr 1, 2026',  'done', ARRAY['Completed Bible study series', 'Active in service team'], 3)
ON CONFLICT DO NOTHING;

-- Contact 10
WITH cm AS (
  INSERT INTO contact_milestones (contact_id, tenant_id)
  VALUES ('contact-10', 'tenant-1')
  ON CONFLICT DO NOTHING
  RETURNING id
)
INSERT INTO milestone_entries (contact_milestone_id, key, label, date, state, sub, sort_order) VALUES
  ((SELECT id FROM cm), 'salvation',  'Salvation Decision', 'Jan 15, 2026', 'done', ARRAY['Long-term believer', 'Confirmed by mentor'], 0),
  ((SELECT id FROM cm), 'baptism',    'Baptism',            'Jan 28, 2026', 'done', ARRAY['Baptized years ago, re-committed'], 1),
  ((SELECT id FROM cm), 'community',  'Community',          'Feb 10, 2026', 'done', ARRAY['Fellowship leader', 'Hosts weekly gathering'], 2),
  ((SELECT id FROM cm), 'growth',     'Growth & Serving',   'Mar 1, 2026',  'done', ARRAY['Leading Bible study', 'Mentoring 2 seekers'], 3)
ON CONFLICT DO NOTHING;

-- Contact 3 (early stage)
WITH cm AS (
  INSERT INTO contact_milestones (contact_id, tenant_id)
  VALUES ('contact-3', 'tenant-1')
  ON CONFLICT DO NOTHING
  RETURNING id
)
INSERT INTO milestone_entries (contact_milestone_id, key, label, date, state, sub, sort_order) VALUES
  ((SELECT id FROM cm), 'salvation',  'Salvation Decision', 'In Progress',  'progress', ARRAY['Exploring faith through Bible basics', 'Open to prayer'], 0),
  ((SELECT id FROM cm), 'baptism',    'Baptism',            'Not Started',  'pending',  '{}', 1),
  ((SELECT id FROM cm), 'community',  'Community',          'Not Started',  'pending',  '{}', 2),
  ((SELECT id FROM cm), 'growth',     'Growth & Serving',   'Not Started',  'pending',  '{}', 3)
ON CONFLICT DO NOTHING;

-- Contact 8
WITH cm AS (
  INSERT INTO contact_milestones (contact_id, tenant_id)
  VALUES ('contact-8', 'tenant-1')
  ON CONFLICT DO NOTHING
  RETURNING id
)
INSERT INTO milestone_entries (contact_milestone_id, key, label, date, state, sub, sort_order) VALUES
  ((SELECT id FROM cm), 'salvation',  'Salvation Decision', 'Jan 20, 2026', 'done',     ARRAY['Confirmed during group session'], 0),
  ((SELECT id FROM cm), 'baptism',    'Baptism',            'In Progress',  'progress', ARRAY['Preparing for baptism class', 'Scheduled for May 2026'], 1),
  ((SELECT id FROM cm), 'community',  'Community',          'In Progress',  'progress', ARRAY['Attends study group', 'Building friendships'], 2),
  ((SELECT id FROM cm), 'growth',     'Growth & Serving',   'Not Started',  'pending',  '{}', 3)
ON CONFLICT DO NOTHING;

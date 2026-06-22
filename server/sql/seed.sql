-- ClientFlow CRM — development seed data
-- Run after schema.sql

USE clientflow;

SET FOREIGN_KEY_CHECKS = 0;

TRUNCATE TABLE tasks;
TRUNCATE TABLE clients;
TRUNCATE TABLE workspace_members;
TRUNCATE TABLE workspaces;
TRUNCATE TABLE users;

SET FOREIGN_KEY_CHECKS = 1;

-- PLACEHOLDER: replace with bcrypt hash when auth is implemented
INSERT INTO users (id, name, email, password_hash)
VALUES (
  1,
  'Alex Morgan',
  'alex@clearline.studio',
  'PLACEHOLDER_NOT_IMPLEMENTED'
);

INSERT INTO workspaces (id, name, slug)
VALUES (
  1,
  'Clearline Studio',
  'clearline-studio'
);

INSERT INTO workspace_members (id, workspace_id, user_id, role)
VALUES (
  1,
  1,
  1,
  'owner'
);

INSERT INTO clients (
  id,
  workspace_id,
  company,
  contact_name,
  email,
  status,
  pipeline_stage,
  project_value_cents,
  last_activity_at
)
VALUES
  (1, 1, 'Relay Apps', 'Sarah Chen', 'sarah@relayapps.io', 'active', 'active', 1850000, '2026-06-08 12:00:00'),
  (2, 1, 'Patchwork Foods', 'Marcus Webb', 'marcus@patchworkfoods.com', 'active', 'proposal', 1240000, '2026-06-08 09:00:00'),
  (3, 1, 'Harbor & Co.', 'Elena Vasquez', 'elena@harborco.com', 'on-hold', 'active', 820000, '2026-06-07 18:00:00'),
  (4, 1, 'Vaultline Security', 'James Okonkwo', 'james@vaultline.security', 'active', 'awaiting-payment', 960000, '2026-06-07 16:00:00'),
  (5, 1, 'Kite & Anchor', 'Priya Nair', 'priya@kiteandanchor.com', 'active', 'completed', 2200000, '2026-06-04 14:00:00'),
  (6, 1, 'Lumen Analytics', 'David Park', 'david@lumenanalytics.com', 'lead', 'lead', 0, '2026-06-03 11:00:00');

INSERT INTO tasks (
  id,
  workspace_id,
  client_id,
  client_name_snapshot,
  name,
  status,
  priority,
  due_date,
  description
)
VALUES
  (
    1,
    1,
    1,
    'Relay Apps',
    'Ship homepage v2 to staging',
    'in-progress',
    'high',
    '2026-06-07',
    'Deploy homepage v2 to Relay Apps staging after final QA sign-off.'
  ),
  (
    2,
    1,
    2,
    'Patchwork Foods',
    'Send sprint recap and loom walkthrough',
    'pending',
    'medium',
    '2026-06-08',
    'Record a short Loom walkthrough of sprint deliverables and send recap email.'
  ),
  (
    3,
    1,
    3,
    'Harbor & Co.',
    'Review revised scope for Phase 2',
    'in-progress',
    'medium',
    '2026-06-09',
    'Review Harbor & Co. Phase 2 scope revisions against the original SOW.'
  ),
  (
    4,
    1,
    4,
    'Vaultline Security',
    'Export production assets for launch',
    'pending',
    'low',
    '2026-06-10',
    'Package and export production-ready assets for Vaultline launch.'
  ),
  (
    5,
    1,
    5,
    'Kite & Anchor',
    'Book content walkthrough with marketing',
    'pending',
    'low',
    '2026-06-12',
    'Schedule a 30-minute content walkthrough with Kite & Anchor marketing.'
  ),
  (
    6,
    1,
    1,
    'Relay Apps',
    'Build shared component library',
    'in-progress',
    'high',
    '2026-06-14',
    'Extract shared UI primitives from Relay Apps codebase into a documented component library.'
  );

-- ClientFlow CRM — optional demo seed data
-- Run after schema.sql.
--
-- WARNING:
-- - Local/demo development use only.
-- - This script does NOT truncate global tables.
-- - It only replaces records for one dedicated demo workspace/account.
-- - Do not treat this data or credential as production-safe.

USE clientflow;
SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;
SET @demo_email = 'demo@clientflow.local';
SET @demo_password_hash = '$2b$10$6.zCGRmOsersPEfJLSkB5Olag4acgZUSJZBjEiLxhjdTk8OlWqf/G';
SET @demo_user_name = 'ClientFlow Demo';
SET @demo_workspace_name = 'Northline Creative Studio';
SET @demo_workspace_slug = 'clientflow-demo-workspace';

START TRANSACTION;

-- Remove only previous demo workspace/account data, preserving unrelated records.
DELETE t
FROM tasks t
INNER JOIN workspaces w ON w.id = t.workspace_id
WHERE w.slug = @demo_workspace_slug;

DELETE cn
FROM client_notes cn
INNER JOIN workspaces w ON w.id = cn.workspace_id
WHERE w.slug = @demo_workspace_slug;

DELETE c
FROM clients c
INNER JOIN workspaces w ON w.id = c.workspace_id
WHERE w.slug = @demo_workspace_slug;

DELETE wm
FROM workspace_members wm
INNER JOIN workspaces w ON w.id = wm.workspace_id
WHERE w.slug = @demo_workspace_slug;

DELETE FROM workspaces
WHERE slug = @demo_workspace_slug;

DELETE FROM users
WHERE email = @demo_email;

INSERT INTO users (name, email, password_hash)
VALUES (
  @demo_user_name,
  @demo_email,
  @demo_password_hash
);
SET @demo_user_id = LAST_INSERT_ID();

INSERT INTO workspaces (name, slug)
VALUES (
  @demo_workspace_name,
  @demo_workspace_slug
);
SET @demo_workspace_id = LAST_INSERT_ID();

INSERT INTO workspace_members (workspace_id, user_id, role)
VALUES (
  @demo_workspace_id,
  @demo_user_id,
  'owner'
);

INSERT INTO clients (
  workspace_id,
  company,
  contact_name,
  email,
  status,
  pipeline_stage,
  project_value_cents,
  last_activity_at,
  created_at,
  updated_at
)
VALUES
  (
    @demo_workspace_id,
    'Northstar Bakery',
    'Sophie Turner',
    'sophie@northstarbakery.co.uk',
    'active',
    'active',
    2750000,
    DATE_SUB(NOW(), INTERVAL 2 HOUR),
    DATE_SUB(NOW(), INTERVAL 16 DAY),
    DATE_SUB(NOW(), INTERVAL 2 HOUR)
  ),
  (
    @demo_workspace_id,
    'Atlas Legal',
    'Jordan Price',
    'jordan@atlaslegal.co.uk',
    'active',
    'proposal',
    980000,
    DATE_SUB(NOW(), INTERVAL 28 HOUR),
    DATE_SUB(NOW(), INTERVAL 12 DAY),
    DATE_SUB(NOW(), INTERVAL 28 HOUR)
  ),
  (
    @demo_workspace_id,
    'Pine & Peak Interiors',
    'Maya Bennett',
    'maya@pinepeakinteriors.com',
    'on-hold',
    'active',
    1460000,
    DATE_SUB(NOW(), INTERVAL 4 DAY),
    DATE_SUB(NOW(), INTERVAL 32 DAY),
    DATE_SUB(NOW(), INTERVAL 5 DAY)
  ),
  (
    @demo_workspace_id,
    'Meridian Fitness',
    'Khalid Rahman',
    'khalid@meridianfitness.io',
    'at-risk',
    'awaiting-payment',
    1890000,
    DATE_SUB(NOW(), INTERVAL 6 HOUR),
    DATE_SUB(NOW(), INTERVAL 22 DAY),
    DATE_SUB(NOW(), INTERVAL 6 HOUR)
  ),
  (
    @demo_workspace_id,
    'June Journal',
    'Naomi Clarke',
    'naomi@junejournal.media',
    'inactive',
    'completed',
    640000,
    NULL,
    DATE_SUB(NOW(), INTERVAL 95 DAY),
    DATE_SUB(NOW(), INTERVAL 20 DAY)
  ),
  (
    @demo_workspace_id,
    'Fieldnote Labs',
    'Ethan Park',
    'ethan@fieldnotelabs.com',
    'lead',
    'lead',
    0,
    DATE_SUB(NOW(), INTERVAL 3 DAY),
    DATE_SUB(NOW(), INTERVAL 3 DAY),
    DATE_SUB(NOW(), INTERVAL 3 DAY)
  ),
  (
    @demo_workspace_id,
    'Harborlight Nonprofit',
    'Amelia Diaz',
    'amelia@harborlight.org',
    'active',
    'proposal',
    530000,
    DATE_SUB(NOW(), INTERVAL 10 HOUR),
    DATE_SUB(NOW(), INTERVAL 9 DAY),
    DATE_SUB(NOW(), INTERVAL 10 HOUR)
  );

SELECT id INTO @client_northstar_id
FROM clients
WHERE workspace_id = @demo_workspace_id
  AND company = 'Northstar Bakery'
LIMIT 1;

SELECT id INTO @client_atlas_id
FROM clients
WHERE workspace_id = @demo_workspace_id
  AND company = 'Atlas Legal'
LIMIT 1;

SELECT id INTO @client_pine_peak_id
FROM clients
WHERE workspace_id = @demo_workspace_id
  AND company = 'Pine & Peak Interiors'
LIMIT 1;

SELECT id INTO @client_meridian_id
FROM clients
WHERE workspace_id = @demo_workspace_id
  AND company = 'Meridian Fitness'
LIMIT 1;

SELECT id INTO @client_june_journal_id
FROM clients
WHERE workspace_id = @demo_workspace_id
  AND company = 'June Journal'
LIMIT 1;

SELECT id INTO @client_fieldnote_id
FROM clients
WHERE workspace_id = @demo_workspace_id
  AND company = 'Fieldnote Labs'
LIMIT 1;

INSERT INTO tasks (
  workspace_id,
  client_id,
  client_name_snapshot,
  name,
  status,
  priority,
  due_date,
  description,
  created_at,
  updated_at
)
VALUES
  (
    @demo_workspace_id,
    @client_northstar_id,
    'Northstar Bakery',
    'Publish spring menu landing page',
    'in-progress',
    'high',
    DATE_SUB(CURRENT_DATE, INTERVAL 2 DAY),
    'Finalize responsive QA and publish the spring menu landing page to production.',
    DATE_SUB(NOW(), INTERVAL 7 DAY),
    DATE_SUB(NOW(), INTERVAL 90 MINUTE)
  ),
  (
    @demo_workspace_id,
    @client_atlas_id,
    'Atlas Legal',
    'Prepare proposal deck revisions',
    'pending',
    'medium',
    DATE_ADD(CURRENT_DATE, INTERVAL 2 DAY),
    'Incorporate compliance messaging updates before the partner review call.',
    DATE_SUB(NOW(), INTERVAL 3 DAY),
    DATE_SUB(NOW(), INTERVAL 26 HOUR)
  ),
  (
    @demo_workspace_id,
    @client_meridian_id,
    'Meridian Fitness',
    'Chase final payment approval',
    'pending',
    'high',
    DATE_ADD(CURRENT_DATE, INTERVAL 6 DAY),
    'Send revised invoice summary and secure sign-off from finance.',
    DATE_SUB(NOW(), INTERVAL 6 DAY),
    DATE_SUB(NOW(), INTERVAL 4 HOUR)
  ),
  (
    @demo_workspace_id,
    @client_pine_peak_id,
    'Pine & Peak Interiors',
    'Resume paused design sprint backlog',
    'in-progress',
    'medium',
    DATE_ADD(CURRENT_DATE, INTERVAL 14 DAY),
    'Prioritize reopened sprint backlog so work can restart after stakeholder alignment.',
    DATE_SUB(NOW(), INTERVAL 12 DAY),
    DATE_SUB(NOW(), INTERVAL 2 DAY)
  ),
  (
    @demo_workspace_id,
    NULL,
    NULL,
    'Review inbound lead triage inbox',
    'pending',
    'low',
    NULL,
    'Triage unassigned discovery requests and decide which leads need follow-up this week.',
    DATE_SUB(NOW(), INTERVAL 5 DAY),
    DATE_SUB(NOW(), INTERVAL 70 HOUR)
  ),
  (
    @demo_workspace_id,
    @client_june_journal_id,
    'June Journal',
    'Archive post-launch assets',
    'completed',
    'low',
    DATE_SUB(CURRENT_DATE, INTERVAL 5 DAY),
    'Move approved creative and handover docs into the long-term archive folder.',
    DATE_SUB(NOW(), INTERVAL 20 DAY),
    DATE_SUB(NOW(), INTERVAL 18 DAY)
  ),
  (
    @demo_workspace_id,
    @client_fieldnote_id,
    'Fieldnote Labs',
    'Draft discovery workshop outline',
    'pending',
    'medium',
    DATE_ADD(CURRENT_DATE, INTERVAL 30 DAY),
    'Prepare a first-pass workshop agenda to support kickoff planning.',
    DATE_SUB(NOW(), INTERVAL 36 HOUR),
    DATE_SUB(NOW(), INTERVAL 36 HOUR)
  ),
  (
    @demo_workspace_id,
    @client_northstar_id,
    'Northstar Bakery',
    'Confirm analytics event QA sign-off',
    'completed',
    'high',
    DATE_SUB(CURRENT_DATE, INTERVAL 1 DAY),
    'Validate launch-event tracking and document completed QA checks.',
    DATE_SUB(NOW(), INTERVAL 2 DAY),
    DATE_SUB(NOW(), INTERVAL 16 HOUR)
  ),
  (
    @demo_workspace_id,
    NULL,
    NULL,
    'Schedule internal capacity planning',
    'in-progress',
    'medium',
    DATE_ADD(CURRENT_DATE, INTERVAL 1 DAY),
    'Align team capacity for next sprint before committing new proposal timelines.',
    DATE_SUB(NOW(), INTERVAL 4 DAY),
    DATE_SUB(NOW(), INTERVAL 45 MINUTE)
  );

COMMIT;

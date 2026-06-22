-- ClientFlow CRM — migration: add clients.pipeline_stage
-- MySQL 8+ compatible
--
-- Purpose: add commercial pipeline stage as a separate client field from status.
--
-- How to run in MySQL Workbench (existing database):
-- 1. Connect to your ClientFlow server and select the clientflow schema.
-- 2. Run the pre-flight check below. It must return zero rows before you continue.
-- 3. Select and execute the "Migration" section as one script.
-- 4. Run the verification queries at the bottom. Each client row should have a valid pipeline_stage.
--
-- Safe to run once. Re-running the ALTER TABLE will fail if the column already exists.
-- Fresh installs should use server/sql/schema.sql instead of this file.

USE clientflow;

-- ── Pre-flight check (expect 0 rows) ────────────────────────────────────────

SELECT COLUMN_NAME
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = 'clientflow'
  AND TABLE_NAME = 'clients'
  AND COLUMN_NAME = 'pipeline_stage';

-- ── Migration ───────────────────────────────────────────────────────────────

ALTER TABLE clients
  ADD COLUMN pipeline_stage ENUM(
    'lead',
    'proposal',
    'active',
    'awaiting-payment',
    'completed'
  ) NOT NULL DEFAULT 'lead'
  AFTER status;

UPDATE clients
SET pipeline_stage = CASE
  WHEN status = 'lead' THEN 'lead'
  ELSE 'active'
END;

ALTER TABLE clients
  ADD KEY idx_clients_pipeline_stage (pipeline_stage);

-- ── Verification ────────────────────────────────────────────────────────────

SELECT id, company, status, pipeline_stage
FROM clients
ORDER BY id;

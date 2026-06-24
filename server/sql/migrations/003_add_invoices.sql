-- ClientFlow CRM -- migration: add invoices table
-- MySQL 8+ compatible
--
-- Purpose: add workspace-scoped invoice tracking with lifecycle statuses.
-- Safe to run once on existing databases. Creates only the new table.

USE clientflow;

CREATE TABLE invoices (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  workspace_id BIGINT UNSIGNED NOT NULL,
  client_id BIGINT UNSIGNED NOT NULL,

  invoice_number VARCHAR(40) NOT NULL,
  title VARCHAR(180) NOT NULL,
  amount_cents INT UNSIGNED NOT NULL,

  issue_date DATE NOT NULL,
  due_date DATE NOT NULL,

  status ENUM('draft', 'sent', 'paid', 'cancelled')
    NOT NULL DEFAULT 'draft',

  notes TEXT NULL,
  paid_date DATE NULL,

  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),

  UNIQUE KEY uk_invoices_workspace_number (
    workspace_id,
    invoice_number
  ),

  KEY idx_invoices_workspace_status_due (
    workspace_id,
    status,
    due_date
  ),

  KEY idx_invoices_workspace_client_updated (
    workspace_id,
    client_id,
    updated_at
  ),

  KEY idx_invoices_workspace_due (
    workspace_id,
    due_date
  ),

  KEY idx_invoices_workspace_paid_date (
    workspace_id,
    paid_date
  ),

  CONSTRAINT fk_invoices_workspace
    FOREIGN KEY (workspace_id)
    REFERENCES workspaces (id)
    ON DELETE CASCADE,

  CONSTRAINT fk_invoices_client
    FOREIGN KEY (client_id)
    REFERENCES clients (id)
    ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

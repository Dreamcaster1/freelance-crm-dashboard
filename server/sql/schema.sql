-- ClientFlow CRM — initial schema
-- MySQL 8+ compatible

CREATE DATABASE IF NOT EXISTS clientflow
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE clientflow;

DROP TABLE IF EXISTS tasks;
DROP TABLE IF EXISTS invoices;
DROP TABLE IF EXISTS client_notes;
DROP TABLE IF EXISTS clients;
DROP TABLE IF EXISTS workspace_members;
DROP TABLE IF EXISTS workspaces;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE workspaces (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(120) NOT NULL,
  slug VARCHAR(120) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_workspaces_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE workspace_members (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  workspace_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  role ENUM('owner', 'member') NOT NULL DEFAULT 'member',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_workspace_members_workspace_user (workspace_id, user_id),
  KEY idx_workspace_members_workspace_id (workspace_id),
  KEY idx_workspace_members_user_id (user_id),
  CONSTRAINT fk_workspace_members_workspace
    FOREIGN KEY (workspace_id) REFERENCES workspaces (id) ON DELETE CASCADE,
  CONSTRAINT fk_workspace_members_user
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE clients (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  workspace_id BIGINT UNSIGNED NOT NULL,
  company VARCHAR(160) NOT NULL,
  contact_name VARCHAR(120) NOT NULL,
  email VARCHAR(255) NOT NULL,
  status ENUM('active', 'lead', 'on-hold', 'at-risk', 'inactive') NOT NULL DEFAULT 'active',
  pipeline_stage ENUM('lead', 'proposal', 'active', 'awaiting-payment', 'completed') NOT NULL DEFAULT 'lead',
  project_value_cents INT UNSIGNED NOT NULL DEFAULT 0,
  last_activity_at TIMESTAMP NULL DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_clients_workspace_id (workspace_id),
  KEY idx_clients_status (status),
  KEY idx_clients_pipeline_stage (pipeline_stage),
  KEY idx_clients_email (email),
  CONSTRAINT fk_clients_workspace
    FOREIGN KEY (workspace_id) REFERENCES workspaces (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE invoices (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  workspace_id BIGINT UNSIGNED NOT NULL,
  client_id BIGINT UNSIGNED NOT NULL,
  invoice_number VARCHAR(40) NOT NULL,
  title VARCHAR(180) NOT NULL,
  amount_cents INT UNSIGNED NOT NULL,
  issue_date DATE NOT NULL,
  due_date DATE NOT NULL,
  status ENUM('draft', 'sent', 'paid', 'cancelled') NOT NULL DEFAULT 'draft',
  notes TEXT NULL DEFAULT NULL,
  paid_date DATE NULL DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_invoices_workspace_number (workspace_id, invoice_number),
  KEY idx_invoices_workspace_status_due (workspace_id, status, due_date),
  KEY idx_invoices_workspace_client_updated (workspace_id, client_id, updated_at),
  KEY idx_invoices_workspace_due (workspace_id, due_date),
  KEY idx_invoices_workspace_paid_date (workspace_id, paid_date),
  CONSTRAINT fk_invoices_workspace
    FOREIGN KEY (workspace_id) REFERENCES workspaces (id) ON DELETE CASCADE,
  CONSTRAINT fk_invoices_client
    FOREIGN KEY (client_id) REFERENCES clients (id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE client_notes (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  workspace_id BIGINT UNSIGNED NOT NULL,
  client_id BIGINT UNSIGNED NOT NULL,
  author_user_id BIGINT UNSIGNED NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_client_notes_workspace_client_created (workspace_id, client_id, created_at),
  KEY idx_client_notes_client_id (client_id),
  KEY idx_client_notes_author_user_id (author_user_id),
  CONSTRAINT fk_client_notes_workspace
    FOREIGN KEY (workspace_id) REFERENCES workspaces (id) ON DELETE CASCADE,
  CONSTRAINT fk_client_notes_client
    FOREIGN KEY (client_id) REFERENCES clients (id) ON DELETE CASCADE,
  CONSTRAINT fk_client_notes_author_user
    FOREIGN KEY (author_user_id) REFERENCES users (id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE tasks (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  workspace_id BIGINT UNSIGNED NOT NULL,
  client_id BIGINT UNSIGNED NULL DEFAULT NULL,
  client_name_snapshot VARCHAR(160) NULL DEFAULT NULL,
  name VARCHAR(255) NOT NULL,
  status ENUM('in-progress', 'pending', 'completed') NOT NULL DEFAULT 'pending',
  priority ENUM('high', 'medium', 'low') NOT NULL DEFAULT 'medium',
  due_date DATE NULL DEFAULT NULL,
  description TEXT NULL DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_tasks_workspace_id (workspace_id),
  KEY idx_tasks_client_id (client_id),
  KEY idx_tasks_status (status),
  KEY idx_tasks_priority (priority),
  CONSTRAINT fk_tasks_workspace
    FOREIGN KEY (workspace_id) REFERENCES workspaces (id) ON DELETE CASCADE,
  CONSTRAINT fk_tasks_client
    FOREIGN KEY (client_id) REFERENCES clients (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

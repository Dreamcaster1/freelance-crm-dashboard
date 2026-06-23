-- ClientFlow CRM — migration: add persistent client notes
-- MySQL 8+ compatible
--
-- Purpose: add workspace-scoped, client-linked notes with authored timeline records.
-- Safe to run on existing databases. Creates only the new table if missing.

USE clientflow;

CREATE TABLE IF NOT EXISTS client_notes (
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

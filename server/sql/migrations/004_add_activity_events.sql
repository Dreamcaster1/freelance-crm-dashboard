-- ClientFlow CRM -- migration: add activity events table
-- MySQL 8+ compatible
--
-- Purpose: store recent workspace activity for dashboard feed.

USE clientflow;

CREATE TABLE activity_events (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  workspace_id BIGINT UNSIGNED NOT NULL,
  actor_user_id BIGINT UNSIGNED NULL,
  entity_type VARCHAR(40) NOT NULL,
  entity_id BIGINT UNSIGNED NULL,
  event_type VARCHAR(80) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NULL,
  metadata_json JSON NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_activity_workspace_created (workspace_id, created_at),
  KEY idx_activity_workspace_event_created (workspace_id, event_type, created_at),
  KEY idx_activity_workspace_entity_created (workspace_id, entity_type, entity_id, created_at),
  CONSTRAINT fk_activity_workspace
    FOREIGN KEY (workspace_id) REFERENCES workspaces (id) ON DELETE CASCADE,
  CONSTRAINT fk_activity_actor_user
    FOREIGN KEY (actor_user_id) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

import pool from '../config/db.js'

const ACTIVITY_COLUMNS = `
  ae.id,
  ae.workspace_id,
  ae.actor_user_id,
  u.name AS actor_name,
  ae.entity_type,
  ae.entity_id,
  ae.event_type,
  ae.title,
  ae.description,
  ae.metadata_json,
  ae.created_at
`

export async function findRecentActivityByWorkspace(workspaceId, limit) {
  const [rows] = await pool.query(
    `SELECT ${ACTIVITY_COLUMNS}
     FROM activity_events ae
     LEFT JOIN users u ON u.id = ae.actor_user_id
     WHERE ae.workspace_id = ?
     ORDER BY ae.created_at DESC, ae.id DESC
     LIMIT ?`,
    [workspaceId, limit],
  )

  return rows
}

export async function createActivityEvent({
  workspaceId,
  actorUserId = null,
  entityType,
  entityId = null,
  eventType,
  title,
  description = null,
  metadataJson = null,
}) {
  await pool.query(
    `INSERT INTO activity_events (
      workspace_id,
      actor_user_id,
      entity_type,
      entity_id,
      event_type,
      title,
      description,
      metadata_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      workspaceId,
      actorUserId,
      entityType,
      entityId,
      eventType,
      title,
      description,
      metadataJson,
    ],
  )
}

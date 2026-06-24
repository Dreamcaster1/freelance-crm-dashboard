import pool from '../config/db.js'

const CLIENT_NOTE_COLUMNS = `
  cn.id,
  cn.workspace_id,
  cn.client_id,
  cn.author_user_id,
  cn.content,
  cn.created_at,
  u.name AS author_name
`

const WORKSPACE_CLIENT_NOTE_COLUMNS = `
  ${CLIENT_NOTE_COLUMNS},
  c.company AS client_company
`

export async function findClientNotesByWorkspaceClient(workspaceId, clientId) {
  const [rows] = await pool.query(
    `SELECT ${CLIENT_NOTE_COLUMNS}
     FROM client_notes cn
     INNER JOIN users u ON u.id = cn.author_user_id
     WHERE cn.workspace_id = ? AND cn.client_id = ?
     ORDER BY cn.created_at DESC, cn.id DESC`,
    [workspaceId, clientId],
  )
  return rows
}

export async function findClientNotesByWorkspace(workspaceId) {
  const [rows] = await pool.query(
    `SELECT ${WORKSPACE_CLIENT_NOTE_COLUMNS}
     FROM client_notes cn
     INNER JOIN clients c
       ON c.id = cn.client_id
      AND c.workspace_id = cn.workspace_id
     INNER JOIN users u ON u.id = cn.author_user_id
     WHERE cn.workspace_id = ?
     ORDER BY cn.created_at DESC, cn.id DESC`,
    [workspaceId],
  )
  return rows
}

export async function findClientNoteById(workspaceId, clientId, noteId) {
  const [rows] = await pool.query(
    `SELECT ${CLIENT_NOTE_COLUMNS}
     FROM client_notes cn
     INNER JOIN users u ON u.id = cn.author_user_id
     WHERE cn.id = ? AND cn.workspace_id = ? AND cn.client_id = ?
     LIMIT 1`,
    [noteId, workspaceId, clientId],
  )
  return rows[0] ?? null
}

export async function createClientNote(workspaceId, clientId, authorUserId, content) {
  const [result] = await pool.query(
    `INSERT INTO client_notes (
      workspace_id,
      client_id,
      author_user_id,
      content
    ) VALUES (?, ?, ?, ?)`,
    [workspaceId, clientId, authorUserId, content],
  )

  return findClientNoteById(workspaceId, clientId, result.insertId)
}

export async function deleteClientNote(workspaceId, clientId, noteId) {
  const [result] = await pool.query(
    'DELETE FROM client_notes WHERE id = ? AND workspace_id = ? AND client_id = ?',
    [noteId, workspaceId, clientId],
  )

  return result.affectedRows > 0
}

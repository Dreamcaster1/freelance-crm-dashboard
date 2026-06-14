import pool from '../config/db.js'

const CLIENT_COLUMNS = `
  id,
  workspace_id,
  company,
  contact_name,
  email,
  status,
  project_value_cents,
  last_activity_at,
  created_at,
  updated_at
`

export async function findClientsByWorkspace(workspaceId, search) {
  let sql = `SELECT ${CLIENT_COLUMNS} FROM clients WHERE workspace_id = ?`
  const params = [workspaceId]

  if (search?.trim()) {
    const term = `%${search.trim()}%`
    sql += ' AND (company LIKE ? OR contact_name LIKE ? OR email LIKE ?)'
    params.push(term, term, term)
  }

  sql += ' ORDER BY updated_at DESC, id DESC'

  const [rows] = await pool.query(sql, params)
  return rows
}

export async function findClientById(workspaceId, clientId) {
  const [rows] = await pool.query(
    `SELECT ${CLIENT_COLUMNS} FROM clients WHERE id = ? AND workspace_id = ? LIMIT 1`,
    [clientId, workspaceId],
  )
  return rows[0] ?? null
}

export async function createClient(workspaceId, {
  company,
  contactName,
  email,
  status,
  projectValueCents,
  lastActivityAt,
}) {
  const [result] = await pool.query(
    `INSERT INTO clients (
      workspace_id,
      company,
      contact_name,
      email,
      status,
      project_value_cents,
      last_activity_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      workspaceId,
      company,
      contactName,
      email,
      status,
      projectValueCents,
      lastActivityAt,
    ],
  )

  return findClientById(workspaceId, result.insertId)
}

export async function updateClient(workspaceId, clientId, fields) {
  const assignments = []
  const params = []

  if (fields.company !== undefined) {
    assignments.push('company = ?')
    params.push(fields.company)
  }

  if (fields.contactName !== undefined) {
    assignments.push('contact_name = ?')
    params.push(fields.contactName)
  }

  if (fields.email !== undefined) {
    assignments.push('email = ?')
    params.push(fields.email)
  }

  if (fields.status !== undefined) {
    assignments.push('status = ?')
    params.push(fields.status)
  }

  if (fields.projectValueCents !== undefined) {
    assignments.push('project_value_cents = ?')
    params.push(fields.projectValueCents)
  }

  if (fields.lastActivityAt !== undefined) {
    assignments.push('last_activity_at = ?')
    params.push(fields.lastActivityAt)
  }

  if (assignments.length === 0) {
    return findClientById(workspaceId, clientId)
  }

  params.push(clientId, workspaceId)

  const [result] = await pool.query(
    `UPDATE clients SET ${assignments.join(', ')} WHERE id = ? AND workspace_id = ?`,
    params,
  )

  if (result.affectedRows === 0) {
    return null
  }

  return findClientById(workspaceId, clientId)
}

export async function deleteClient(workspaceId, clientId) {
  const [result] = await pool.query(
    'DELETE FROM clients WHERE id = ? AND workspace_id = ?',
    [clientId, workspaceId],
  )

  return result.affectedRows > 0
}

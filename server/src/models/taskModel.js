import pool from '../config/db.js'

const TASK_COLUMNS = `
  id,
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
`

const TASK_COLUMNS_WITH_ALIAS = `
  t.id,
  t.workspace_id,
  t.client_id,
  t.client_name_snapshot,
  t.name,
  t.status,
  t.priority,
  t.due_date,
  t.description,
  t.created_at,
  t.updated_at
`

export async function findTasksByWorkspace(workspaceId, status) {
  let sql = `SELECT ${TASK_COLUMNS} FROM tasks WHERE workspace_id = ?`
  const params = [workspaceId]

  if (status) {
    sql += ' AND status = ?'
    params.push(status)
  }

  sql += ' ORDER BY due_date IS NULL, due_date ASC, updated_at DESC, id DESC'

  const [rows] = await pool.query(sql, params)
  return rows
}

export async function findTasksByWorkspaceClient(workspaceId, clientId) {
  const [rows] = await pool.query(
    `SELECT ${TASK_COLUMNS_WITH_ALIAS}
     FROM tasks t
     INNER JOIN clients c
       ON c.id = t.client_id
      AND c.workspace_id = t.workspace_id
     WHERE t.workspace_id = ? AND t.client_id = ?
     ORDER BY
       CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END ASC,
       CASE WHEN t.due_date IS NULL THEN 1 ELSE 0 END ASC,
       t.due_date ASC,
       t.updated_at DESC,
       t.id DESC`,
    [workspaceId, clientId],
  )
  return rows
}

export async function findTaskById(workspaceId, taskId) {
  const [rows] = await pool.query(
    `SELECT ${TASK_COLUMNS} FROM tasks WHERE id = ? AND workspace_id = ? LIMIT 1`,
    [taskId, workspaceId],
  )
  return rows[0] ?? null
}

export async function createTask(workspaceId, {
  clientId,
  clientNameSnapshot,
  name,
  status,
  priority,
  dueDate,
  description,
}) {
  const [result] = await pool.query(
    `INSERT INTO tasks (
      workspace_id,
      client_id,
      client_name_snapshot,
      name,
      status,
      priority,
      due_date,
      description
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      workspaceId,
      clientId,
      clientNameSnapshot,
      name,
      status,
      priority,
      dueDate,
      description,
    ],
  )

  return findTaskById(workspaceId, result.insertId)
}

export async function updateTask(workspaceId, taskId, fields) {
  const assignments = []
  const params = []

  if (fields.clientId !== undefined) {
    assignments.push('client_id = ?')
    params.push(fields.clientId)
  }

  if (fields.clientNameSnapshot !== undefined) {
    assignments.push('client_name_snapshot = ?')
    params.push(fields.clientNameSnapshot)
  }

  if (fields.name !== undefined) {
    assignments.push('name = ?')
    params.push(fields.name)
  }

  if (fields.status !== undefined) {
    assignments.push('status = ?')
    params.push(fields.status)
  }

  if (fields.priority !== undefined) {
    assignments.push('priority = ?')
    params.push(fields.priority)
  }

  if (fields.dueDate !== undefined) {
    assignments.push('due_date = ?')
    params.push(fields.dueDate)
  }

  if (fields.description !== undefined) {
    assignments.push('description = ?')
    params.push(fields.description)
  }

  if (assignments.length === 0) {
    return findTaskById(workspaceId, taskId)
  }

  params.push(taskId, workspaceId)

  const [result] = await pool.query(
    `UPDATE tasks SET ${assignments.join(', ')} WHERE id = ? AND workspace_id = ?`,
    params,
  )

  if (result.affectedRows === 0) {
    return null
  }

  return findTaskById(workspaceId, taskId)
}

export async function deleteTask(workspaceId, taskId) {
  const [result] = await pool.query(
    'DELETE FROM tasks WHERE id = ? AND workspace_id = ?',
    [taskId, workspaceId],
  )

  return result.affectedRows > 0
}

import pool from '../config/db.js'

export async function findUserByEmail(email) {
  const [rows] = await pool.query(
    'SELECT id, name, email, password_hash FROM users WHERE email = ? LIMIT 1',
    [email],
  )
  return rows[0] ?? null
}

export async function findUserById(id) {
  const [rows] = await pool.query(
    'SELECT id, name, email FROM users WHERE id = ? LIMIT 1',
    [id],
  )
  return rows[0] ?? null
}

export async function findWorkspaceById(id) {
  const [rows] = await pool.query(
    'SELECT id, name, slug FROM workspaces WHERE id = ? LIMIT 1',
    [id],
  )
  return rows[0] ?? null
}

export async function findWorkspaceBySlug(slug) {
  const [rows] = await pool.query(
    'SELECT id FROM workspaces WHERE slug = ? LIMIT 1',
    [slug],
  )
  return rows[0] ?? null
}

export async function findPrimaryWorkspaceForUser(userId) {
  const [rows] = await pool.query(
    `SELECT w.id, w.name, w.slug, wm.role
     FROM workspace_members wm
     INNER JOIN workspaces w ON w.id = wm.workspace_id
     WHERE wm.user_id = ?
     ORDER BY wm.id ASC
     LIMIT 1`,
    [userId],
  )
  return rows[0] ?? null
}

export async function findWorkspaceMembershipForUser(userId, workspaceId) {
  const [rows] = await pool.query(
    `SELECT wm.role
     FROM workspace_members wm
     WHERE wm.user_id = ? AND wm.workspace_id = ?
     LIMIT 1`,
    [userId, workspaceId],
  )
  return rows[0] ?? null
}

export async function createUserWithWorkspace({
  name,
  email,
  passwordHash,
  workspaceName,
  workspaceSlug,
}) {
  const connection = await pool.getConnection()

  try {
    await connection.beginTransaction()

    const [userResult] = await connection.query(
      'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)',
      [name, email, passwordHash],
    )
    const userId = userResult.insertId

    const [workspaceResult] = await connection.query(
      'INSERT INTO workspaces (name, slug) VALUES (?, ?)',
      [workspaceName, workspaceSlug],
    )
    const workspaceId = workspaceResult.insertId

    await connection.query(
      'INSERT INTO workspace_members (workspace_id, user_id, role) VALUES (?, ?, ?)',
      [workspaceId, userId, 'owner'],
    )

    await connection.commit()

    return { userId, workspaceId }
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
  }
}

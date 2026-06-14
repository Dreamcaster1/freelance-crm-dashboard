import bcrypt from 'bcrypt'
import {
  createUserWithWorkspace,
  findPrimaryWorkspaceForUser,
  findUserByEmail,
  findUserById,
  findWorkspaceById,
  findWorkspaceBySlug,
} from '../models/userModel.js'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function slugify(value) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

async function resolveUniqueWorkspaceSlug(workspaceName) {
  const baseSlug = slugify(workspaceName) || 'workspace'
  let candidate = baseSlug
  let suffix = 1

  while (await findWorkspaceBySlug(candidate)) {
    candidate = `${baseSlug}-${suffix}`
    suffix += 1
  }

  return candidate
}

function setSessionUser(req, userId, workspaceId) {
  req.session.userId = userId
  req.session.workspaceId = workspaceId
}

async function buildAuthResponse(userId, workspaceId) {
  const user = await findUserById(userId)
  const workspace = await findWorkspaceById(workspaceId)

  return {
    ok: true,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
    workspace: {
      id: workspace.id,
      name: workspace.name,
      slug: workspace.slug,
    },
  }
}

export async function register(req, res) {
  const { name, email, password, workspaceName } = req.body ?? {}

  if (!name?.trim()) {
    return res.status(400).json({ ok: false, error: 'Name is required.' })
  }

  if (!email?.trim() || !EMAIL_PATTERN.test(email.trim())) {
    return res.status(400).json({ ok: false, error: 'Valid email is required.' })
  }

  if (!password || password.length < 8) {
    return res.status(400).json({
      ok: false,
      error: 'Password must be at least 8 characters.',
    })
  }

  if (!workspaceName?.trim()) {
    return res.status(400).json({
      ok: false,
      error: 'Workspace name is required.',
    })
  }

  const normalizedEmail = email.trim().toLowerCase()
  const existingUser = await findUserByEmail(normalizedEmail)

  if (existingUser) {
    return res.status(409).json({
      ok: false,
      error: 'An account with this email already exists.',
    })
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10)
    const workspaceSlug = await resolveUniqueWorkspaceSlug(workspaceName)
    const { userId, workspaceId } = await createUserWithWorkspace({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      workspaceName: workspaceName.trim(),
      workspaceSlug,
    })

    setSessionUser(req, userId, workspaceId)

    const response = await buildAuthResponse(userId, workspaceId)
    return res.status(201).json(response)
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        ok: false,
        error: 'An account with this email already exists.',
      })
    }

    return res.status(500).json({
      ok: false,
      error: 'Unable to create account.',
    })
  }
}

export async function login(req, res) {
  const { email, password } = req.body ?? {}

  if (!email?.trim() || !EMAIL_PATTERN.test(email.trim())) {
    return res.status(400).json({ ok: false, error: 'Valid email is required.' })
  }

  if (!password) {
    return res.status(400).json({ ok: false, error: 'Password is required.' })
  }

  const normalizedEmail = email.trim().toLowerCase()
  const user = await findUserByEmail(normalizedEmail)

  if (!user) {
    return res.status(401).json({ ok: false, error: 'Invalid email or password.' })
  }

  const passwordMatches = await bcrypt.compare(password, user.password_hash)

  if (!passwordMatches) {
    return res.status(401).json({ ok: false, error: 'Invalid email or password.' })
  }

  const workspace = await findPrimaryWorkspaceForUser(user.id)

  if (!workspace) {
    return res.status(404).json({
      ok: false,
      error: 'No workspace found for this user.',
    })
  }

  setSessionUser(req, user.id, workspace.id)

  const response = await buildAuthResponse(user.id, workspace.id)
  return res.json({
    ...response,
    workspace: {
      id: workspace.id,
      name: workspace.name,
      slug: workspace.slug,
      role: workspace.role,
    },
  })
}

export function logout(req, res) {
  if (!req.session) {
    return res.json({ ok: true })
  }

  req.session.destroy((error) => {
    if (error) {
      return res.status(500).json({
        ok: false,
        error: 'Unable to log out.',
      })
    }

    res.clearCookie('clientflow.sid')
    return res.json({ ok: true })
  })
}

export async function me(req, res) {
  const response = await buildAuthResponse(
    req.session.userId,
    req.session.workspaceId,
  )

  const workspace = await findPrimaryWorkspaceForUser(req.session.userId)

  return res.json({
    ...response,
    workspace: {
      ...response.workspace,
      role: workspace?.role ?? null,
    },
  })
}

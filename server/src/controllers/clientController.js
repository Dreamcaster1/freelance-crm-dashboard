import {
  createClient,
  deleteClient,
  findClientById,
  findClientsByWorkspace,
  updateClient,
} from '../models/clientModel.js'
import {
  mapClientResponse,
  mapClientResponses,
} from '../utils/clientMapper.js'
import {
  assertJsonObject,
  validateDateTimeOrNull,
} from '../utils/validation.js'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const VALID_STATUSES = ['active', 'lead', 'on-hold', 'at-risk', 'inactive']

function parseClientId(rawId) {
  const clientId = Number(rawId)
  if (!Number.isInteger(clientId) || clientId <= 0) {
    return null
  }
  return clientId
}

function validateStatus(status) {
  if (!VALID_STATUSES.includes(status)) {
    return `Status must be one of: ${VALID_STATUSES.join(', ')}.`
  }
  return null
}

function validateProjectValueCents(value) {
  if (!Number.isInteger(value) || value < 0) {
    return 'project_value_cents must be a non-negative integer.'
  }
  return null
}


function validateCreateBody(body) {
  const bodyError = assertJsonObject(body)
  if (bodyError) {
    return { error: bodyError }
  }

  const company = body.company?.trim()
  const contactName = body.contact_name?.trim()
  const email = body.email?.trim()
  const status = body.status ?? 'active'

  if (!company) {
    return { error: 'company is required.' }
  }

  if (company.length > 160) {
    return { error: 'company must be 160 characters or fewer.' }
  }

  if (!contactName) {
    return { error: 'contact_name is required.' }
  }

  if (contactName.length > 120) {
    return { error: 'contact_name must be 120 characters or fewer.' }
  }

  if (!email) {
    return { error: 'email is required.' }
  }

  if (!EMAIL_PATTERN.test(email)) {
    return { error: 'email must be valid.' }
  }

  if (email.length > 255) {
    return { error: 'email must be 255 characters or fewer.' }
  }

  const statusError = validateStatus(status)
  if (statusError) {
    return { error: statusError }
  }

  let projectValueCents = 0
  if (body.project_value_cents !== undefined) {
    projectValueCents = Number(body.project_value_cents)
    const valueError = validateProjectValueCents(projectValueCents)
    if (valueError) {
      return { error: valueError }
    }
  }

  let lastActivityAt = new Date()
  if (body.last_activity_at !== undefined) {
    if (body.last_activity_at === null) {
      lastActivityAt = null
    } else {
      const dateError = validateDateTimeOrNull(body.last_activity_at)
      if (dateError) {
        return { error: dateError }
      }
      lastActivityAt = new Date(body.last_activity_at)
    }
  }

  return {
    data: {
      company,
      contactName,
      email,
      status,
      projectValueCents,
      lastActivityAt,
    },
  }
}

function validatePatchBody(body) {
  const bodyError = assertJsonObject(body)
  if (bodyError) {
    return { error: bodyError }
  }

  const allowedFields = [
    'company',
    'contact_name',
    'email',
    'status',
    'project_value_cents',
    'last_activity_at',
  ]
  const providedFields = allowedFields.filter((field) => body[field] !== undefined)

  if (providedFields.length === 0) {
    return { error: 'At least one updatable field is required.' }
  }

  const fields = {}

  if (body.company !== undefined) {
    const company = body.company?.trim()
    if (!company) {
      return { error: 'company cannot be empty.' }
    }
    if (company.length > 160) {
      return { error: 'company must be 160 characters or fewer.' }
    }
    fields.company = company
  }

  if (body.contact_name !== undefined) {
    const contactName = body.contact_name?.trim()
    if (!contactName) {
      return { error: 'contact_name cannot be empty.' }
    }
    if (contactName.length > 120) {
      return { error: 'contact_name must be 120 characters or fewer.' }
    }
    fields.contactName = contactName
  }

  if (body.email !== undefined) {
    const email = body.email?.trim()
    if (!email) {
      return { error: 'email cannot be empty.' }
    }
    if (!EMAIL_PATTERN.test(email)) {
      return { error: 'email must be valid.' }
    }
    if (email.length > 255) {
      return { error: 'email must be 255 characters or fewer.' }
    }
    fields.email = email
  }

  if (body.status !== undefined) {
    const statusError = validateStatus(body.status)
    if (statusError) {
      return { error: statusError }
    }
    fields.status = body.status
  }

  if (body.project_value_cents !== undefined) {
    const projectValueCents = Number(body.project_value_cents)
    const valueError = validateProjectValueCents(projectValueCents)
    if (valueError) {
      return { error: valueError }
    }
    fields.projectValueCents = projectValueCents
  }

  if (body.last_activity_at !== undefined) {
    if (body.last_activity_at === null) {
      fields.lastActivityAt = null
    } else {
      const dateError = validateDateTimeOrNull(body.last_activity_at)
      if (dateError) {
        return { error: dateError }
      }
      fields.lastActivityAt = new Date(body.last_activity_at)
    }
  }

  return { data: fields }
}

export async function listClients(req, res) {
  const workspaceId = req.session.workspaceId
  const search = typeof req.query.search === 'string' ? req.query.search : ''

  const clients = await findClientsByWorkspace(workspaceId, search)

  return res.json({
    ok: true,
    clients: mapClientResponses(clients),
  })
}

export async function getClient(req, res) {
  const workspaceId = req.session.workspaceId
  const clientId = parseClientId(req.params.id)

  if (!clientId) {
    return res.status(400).json({ ok: false, error: 'Invalid client id.' })
  }

  const client = await findClientById(workspaceId, clientId)

  if (!client) {
    return res.status(404).json({ ok: false, error: 'Client not found.' })
  }

  return res.json({
    ok: true,
    client: mapClientResponse(client),
  })
}

export async function createClientHandler(req, res) {
  const workspaceId = req.session.workspaceId
  const validation = validateCreateBody(req.body)

  if (validation.error) {
    return res.status(400).json({ ok: false, error: validation.error })
  }

  const client = await createClient(workspaceId, validation.data)

  return res.status(201).json({
    ok: true,
    client: mapClientResponse(client),
  })
}

export async function updateClientHandler(req, res) {
  const workspaceId = req.session.workspaceId
  const clientId = parseClientId(req.params.id)

  if (!clientId) {
    return res.status(400).json({ ok: false, error: 'Invalid client id.' })
  }

  const validation = validatePatchBody(req.body)

  if (validation.error) {
    return res.status(400).json({ ok: false, error: validation.error })
  }

  const existingClient = await findClientById(workspaceId, clientId)

  if (!existingClient) {
    return res.status(404).json({ ok: false, error: 'Client not found.' })
  }

  const client = await updateClient(workspaceId, clientId, validation.data)

  if (!client) {
    return res.status(404).json({ ok: false, error: 'Client not found.' })
  }

  return res.json({
    ok: true,
    client: mapClientResponse(client),
  })
}

export async function deleteClientHandler(req, res) {
  const workspaceId = req.session.workspaceId
  const clientId = parseClientId(req.params.id)

  if (!clientId) {
    return res.status(400).json({ ok: false, error: 'Invalid client id.' })
  }

  const deleted = await deleteClient(workspaceId, clientId)

  if (!deleted) {
    return res.status(404).json({ ok: false, error: 'Client not found.' })
  }

  return res.json({ ok: true })
}

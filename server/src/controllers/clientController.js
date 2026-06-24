import {
  createClient,
  deleteClient,
  findClientById,
  findClientsByWorkspace,
  updateClient,
} from '../models/clientModel.js'
import { findTasksByWorkspaceClient } from '../models/taskModel.js'
import {
  mapClientResponse,
  mapClientResponses,
} from '../utils/clientMapper.js'
import { mapTaskResponses } from '../utils/taskMapper.js'
import {
  assertJsonObject,
  parseDateTimeOrNull,
  parseProjectValueCents,
} from '../utils/validation.js'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const VALID_STATUSES = ['active', 'lead', 'on-hold', 'at-risk', 'inactive']
const VALID_PIPELINE_STAGES = [
  'lead',
  'proposal',
  'active',
  'awaiting-payment',
  'completed',
]

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

function validatePipelineStage(pipelineStage) {
  if (!VALID_PIPELINE_STAGES.includes(pipelineStage)) {
    return `pipeline_stage must be one of: ${VALID_PIPELINE_STAGES.join(', ')}.`
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

  const pipelineStage = body.pipeline_stage ?? 'lead'
  const pipelineStageError = validatePipelineStage(pipelineStage)
  if (pipelineStageError) {
    return { error: pipelineStageError }
  }

  let projectValueCents = 0
  if (body.project_value_cents !== undefined) {
    const parsed = parseProjectValueCents(body.project_value_cents)
    if (parsed.error) {
      return { error: parsed.error }
    }
    projectValueCents = parsed.value
  }

  let lastActivityAt = new Date()
  if (body.last_activity_at !== undefined) {
    if (body.last_activity_at === null) {
      lastActivityAt = null
    } else {
      const parsed = parseDateTimeOrNull(body.last_activity_at)
      if (parsed.error) {
        return { error: parsed.error }
      }
      lastActivityAt = parsed.value
    }
  }

  return {
    data: {
      company,
      contactName,
      email,
      status,
      pipelineStage,
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
    'pipeline_stage',
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

  if (body.pipeline_stage !== undefined) {
    const pipelineStageError = validatePipelineStage(body.pipeline_stage)
    if (pipelineStageError) {
      return { error: pipelineStageError }
    }
    fields.pipelineStage = body.pipeline_stage
  }

  if (body.project_value_cents !== undefined) {
    const parsed = parseProjectValueCents(body.project_value_cents)
    if (parsed.error) {
      return { error: parsed.error }
    }
    fields.projectValueCents = parsed.value
  }

  if (body.last_activity_at !== undefined) {
    if (body.last_activity_at === null) {
      fields.lastActivityAt = null
    } else {
      const parsed = parseDateTimeOrNull(body.last_activity_at)
      if (parsed.error) {
        return { error: parsed.error }
      }
      fields.lastActivityAt = parsed.value
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

export async function listClientTasks(req, res) {
  const workspaceId = req.session.workspaceId
  const clientId = parseClientId(req.params.id)

  if (!clientId) {
    return res.status(400).json({ ok: false, error: 'Invalid client id.' })
  }

  const client = await findClientById(workspaceId, clientId)
  if (!client) {
    return res.status(404).json({ ok: false, error: 'Client not found.' })
  }

  const tasks = await findTasksByWorkspaceClient(workspaceId, clientId)

  return res.json({
    ok: true,
    tasks: mapTaskResponses(tasks),
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

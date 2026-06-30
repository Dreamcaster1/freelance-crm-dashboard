import {
  createClient,
  deleteClient,
  findClientById,
  findClientsByWorkspace,
  updateClient,
} from '../models/clientModel.js'
import { findInvoicesByWorkspaceClient } from '../models/invoiceModel.js'
import { findTasksByWorkspaceClient } from '../models/taskModel.js'
import {
  mapClientResponse,
  mapClientResponses,
} from '../utils/clientMapper.js'
import { mapInvoiceResponses } from '../utils/invoiceMapper.js'
import { mapTaskResponses } from '../utils/taskMapper.js'
import {
  assertJsonObject,
  parseDateTimeOrNull,
  parseProjectValueCents,
} from '../utils/validation.js'
import { recordActivityEvent } from '../utils/activityRecorder.js'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const VALID_STATUSES = ['active', 'lead', 'on-hold', 'at-risk', 'inactive']
const VALID_PIPELINE_STAGES = [
  'lead',
  'proposal',
  'active',
  'awaiting-payment',
  'completed',
]

const CLIENT_FIELD_LABELS = {
  company: 'company',
  contactName: 'contact',
  email: 'email',
  status: 'status',
  pipelineStage: 'pipeline stage',
  projectValueCents: 'project value',
  lastActivityAt: 'last activity',
}

function summarizeUpdatedClientFields(fields) {
  const labels = Object.keys(fields)
    .map((field) => CLIENT_FIELD_LABELS[field])
    .filter(Boolean)

  if (labels.length === 0) {
    return null
  }

  return `Updated ${labels.join(', ')}.`
}

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

export async function listClientInvoices(req, res) {
  const workspaceId = req.session.workspaceId
  const clientId = parseClientId(req.params.id)

  if (!clientId) {
    return res.status(400).json({ ok: false, error: 'Invalid client id.' })
  }

  const client = await findClientById(workspaceId, clientId)
  if (!client) {
    return res.status(404).json({ ok: false, error: 'Client not found.' })
  }

  const invoices = await findInvoicesByWorkspaceClient(workspaceId, clientId)

  return res.json({
    ok: true,
    invoices: mapInvoiceResponses(invoices),
  })
}

export async function createClientHandler(req, res) {
  const workspaceId = req.session.workspaceId
  const actorUserId = req.session.userId
  const validation = validateCreateBody(req.body)

  if (validation.error) {
    return res.status(400).json({ ok: false, error: validation.error })
  }

  const client = await createClient(workspaceId, validation.data)
  await recordActivityEvent({
    workspaceId,
    actorUserId,
    entityType: 'client',
    entityId: client.id,
    eventType: 'client.created',
    title: `Client created: ${client.company}`,
    description: client.contact_name
      ? `Primary contact: ${client.contact_name}`
      : null,
  })

  return res.status(201).json({
    ok: true,
    client: mapClientResponse(client),
  })
}

export async function updateClientHandler(req, res) {
  const workspaceId = req.session.workspaceId
  const actorUserId = req.session.userId
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

  await recordActivityEvent({
    workspaceId,
    actorUserId,
    entityType: 'client',
    entityId: client.id,
    eventType: 'client.updated',
    title: `Client updated: ${client.company}`,
    description: summarizeUpdatedClientFields(validation.data),
  })

  if (
    validation.data.pipelineStage !== undefined &&
    existingClient.pipeline_stage !== client.pipeline_stage
  ) {
    await recordActivityEvent({
      workspaceId,
      actorUserId,
      entityType: 'client',
      entityId: client.id,
      eventType: 'pipeline.stage_changed',
      title: `Pipeline stage changed: ${client.company}`,
      description: `${existingClient.pipeline_stage} -> ${client.pipeline_stage}`,
      metadata: {
        fromStage: existingClient.pipeline_stage,
        toStage: client.pipeline_stage,
      },
    })
  }

  return res.json({
    ok: true,
    client: mapClientResponse(client),
  })
}

export async function deleteClientHandler(req, res) {
  const workspaceId = req.session.workspaceId
  const actorUserId = req.session.userId
  const clientId = parseClientId(req.params.id)

  if (!clientId) {
    return res.status(400).json({ ok: false, error: 'Invalid client id.' })
  }

  const existingClient = await findClientById(workspaceId, clientId)
  if (!existingClient) {
    return res.status(404).json({ ok: false, error: 'Client not found.' })
  }

  const deleted = await deleteClient(workspaceId, clientId)

  if (!deleted) {
    return res.status(404).json({ ok: false, error: 'Client not found.' })
  }

  await recordActivityEvent({
    workspaceId,
    actorUserId,
    entityType: 'client',
    entityId: clientId,
    eventType: 'client.deleted',
    title: `Client deleted: ${existingClient.company}`,
  })

  return res.json({ ok: true })
}

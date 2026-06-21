import { findClientById } from '../models/clientModel.js'
import {
  createTask,
  deleteTask,
  findTaskById,
  findTasksByWorkspace,
  updateTask,
} from '../models/taskModel.js'
import { mapTaskResponse, mapTaskResponses } from '../utils/taskMapper.js'
import { assertJsonObject, validateCalendarDate } from '../utils/validation.js'

const VALID_STATUSES = ['in-progress', 'pending', 'completed']
const VALID_PRIORITIES = ['high', 'medium', 'low']

function parseTaskId(rawId) {
  const taskId = Number(rawId)
  if (!Number.isInteger(taskId) || taskId <= 0) {
    return null
  }
  return taskId
}

function parseOptionalClientId(rawClientId) {
  if (rawClientId === null || rawClientId === undefined) {
    return { clientId: null }
  }

  const clientId = Number(rawClientId)
  if (!Number.isInteger(clientId) || clientId <= 0) {
    return { error: 'client_id must be a positive integer or null.' }
  }

  return { clientId }
}

function validateStatus(status) {
  if (!VALID_STATUSES.includes(status)) {
    return `Status must be one of: ${VALID_STATUSES.join(', ')}.`
  }
  return null
}

function validatePriority(priority) {
  if (!VALID_PRIORITIES.includes(priority)) {
    return `Priority must be one of: ${VALID_PRIORITIES.join(', ')}.`
  }
  return null
}


function normalizeDescription(value) {
  if (value === null || value === undefined) {
    return null
  }

  const trimmed = String(value).trim()
  return trimmed || null
}

async function resolveClientReference(workspaceId, rawClientId) {
  const parsed = parseOptionalClientId(rawClientId)

  if (parsed.error) {
    return parsed
  }

  if (parsed.clientId === null) {
    return { clientId: null, clientNameSnapshot: null }
  }

  const client = await findClientById(workspaceId, parsed.clientId)

  if (!client) {
    return { error: 'Client not found.', statusCode: 404 }
  }

  return {
    clientId: parsed.clientId,
    clientNameSnapshot: client.company,
  }
}

function validateCreateBody(body) {
  const bodyError = assertJsonObject(body)
  if (bodyError) {
    return { error: bodyError }
  }

  const name = body.name?.trim()
  const status = body.status ?? 'pending'
  const priority = body.priority ?? 'medium'

  if (!name) {
    return { error: 'name is required.' }
  }

  if (name.length > 255) {
    return { error: 'name must be 255 characters or fewer.' }
  }

  const statusError = validateStatus(status)
  if (statusError) {
    return { error: statusError }
  }

  const priorityError = validatePriority(priority)
  if (priorityError) {
    return { error: priorityError }
  }

  let dueDate = null
  if (body.due_date !== undefined) {
    const dateError = validateCalendarDate(body.due_date)
    if (dateError) {
      return { error: dateError }
    }
    dueDate = body.due_date
  }

  return {
    data: {
      name,
      status,
      priority,
      dueDate,
      description: normalizeDescription(body.description),
      rawClientId: body.client_id,
    },
  }
}

function validatePatchBody(body) {
  const bodyError = assertJsonObject(body)
  if (bodyError) {
    return { error: bodyError }
  }

  const allowedFields = [
    'client_id',
    'name',
    'status',
    'priority',
    'due_date',
    'description',
  ]
  const providedFields = allowedFields.filter((field) => body[field] !== undefined)

  if (providedFields.length === 0) {
    return { error: 'At least one updatable field is required.' }
  }

  const fields = {}

  if (body.client_id !== undefined) {
    fields.rawClientId = body.client_id
  }

  if (body.name !== undefined) {
    const name = body.name?.trim()
    if (!name) {
      return { error: 'name cannot be empty.' }
    }
    if (name.length > 255) {
      return { error: 'name must be 255 characters or fewer.' }
    }
    fields.name = name
  }

  if (body.status !== undefined) {
    const statusError = validateStatus(body.status)
    if (statusError) {
      return { error: statusError }
    }
    fields.status = body.status
  }

  if (body.priority !== undefined) {
    const priorityError = validatePriority(body.priority)
    if (priorityError) {
      return { error: priorityError }
    }
    fields.priority = body.priority
  }

  if (body.due_date !== undefined) {
    const dateError = validateCalendarDate(body.due_date)
    if (dateError) {
      return { error: dateError }
    }
    fields.dueDate = body.due_date
  }

  if (body.description !== undefined) {
    fields.description = normalizeDescription(body.description)
  }

  return { data: fields }
}

export async function listTasks(req, res) {
  const workspaceId = req.session.workspaceId
  const status =
    typeof req.query.status === 'string' && req.query.status.trim()
      ? req.query.status.trim()
      : ''

  if (status) {
    const statusError = validateStatus(status)
    if (statusError) {
      return res.status(400).json({ ok: false, error: statusError })
    }
  }

  const tasks = await findTasksByWorkspace(workspaceId, status || null)

  return res.json({
    ok: true,
    tasks: mapTaskResponses(tasks),
  })
}

export async function getTask(req, res) {
  const workspaceId = req.session.workspaceId
  const taskId = parseTaskId(req.params.id)

  if (!taskId) {
    return res.status(400).json({ ok: false, error: 'Invalid task id.' })
  }

  const task = await findTaskById(workspaceId, taskId)

  if (!task) {
    return res.status(404).json({ ok: false, error: 'Task not found.' })
  }

  return res.json({
    ok: true,
    task: mapTaskResponse(task),
  })
}

export async function createTaskHandler(req, res) {
  const workspaceId = req.session.workspaceId
  const validation = validateCreateBody(req.body)

  if (validation.error) {
    return res.status(400).json({ ok: false, error: validation.error })
  }

  const clientRef = await resolveClientReference(
    workspaceId,
    validation.data.rawClientId,
  )

  if (clientRef.error) {
    return res
      .status(clientRef.statusCode ?? 400)
      .json({ ok: false, error: clientRef.error })
  }

  const task = await createTask(workspaceId, {
    clientId: clientRef.clientId,
    clientNameSnapshot: clientRef.clientNameSnapshot,
    name: validation.data.name,
    status: validation.data.status,
    priority: validation.data.priority,
    dueDate: validation.data.dueDate,
    description: validation.data.description,
  })

  return res.status(201).json({
    ok: true,
    task: mapTaskResponse(task),
  })
}

export async function updateTaskHandler(req, res) {
  const workspaceId = req.session.workspaceId
  const taskId = parseTaskId(req.params.id)

  if (!taskId) {
    return res.status(400).json({ ok: false, error: 'Invalid task id.' })
  }

  const validation = validatePatchBody(req.body)

  if (validation.error) {
    return res.status(400).json({ ok: false, error: validation.error })
  }

  const existingTask = await findTaskById(workspaceId, taskId)

  if (!existingTask) {
    return res.status(404).json({ ok: false, error: 'Task not found.' })
  }

  const updateFields = { ...validation.data }

  if (updateFields.rawClientId !== undefined) {
    const clientRef = await resolveClientReference(
      workspaceId,
      updateFields.rawClientId,
    )

    if (clientRef.error) {
      return res
        .status(clientRef.statusCode ?? 400)
        .json({ ok: false, error: clientRef.error })
    }

    updateFields.clientId = clientRef.clientId
    updateFields.clientNameSnapshot = clientRef.clientNameSnapshot
    delete updateFields.rawClientId
  }

  const task = await updateTask(workspaceId, taskId, updateFields)

  if (!task) {
    return res.status(404).json({ ok: false, error: 'Task not found.' })
  }

  return res.json({
    ok: true,
    task: mapTaskResponse(task),
  })
}

export async function deleteTaskHandler(req, res) {
  const workspaceId = req.session.workspaceId
  const taskId = parseTaskId(req.params.id)

  if (!taskId) {
    return res.status(400).json({ ok: false, error: 'Invalid task id.' })
  }

  const deleted = await deleteTask(workspaceId, taskId)

  if (!deleted) {
    return res.status(404).json({ ok: false, error: 'Task not found.' })
  }

  return res.json({ ok: true })
}

import { findClientById } from '../models/clientModel.js'
import {
  createClientNote,
  deleteClientNote,
  findClientNotesByWorkspace,
  findClientNotesByWorkspaceClient,
} from '../models/clientNoteModel.js'
import {
  mapClientNoteResponse,
  mapClientNoteResponses,
  mapWorkspaceClientNoteResponses,
} from '../utils/clientNoteMapper.js'
import { assertJsonObject } from '../utils/validation.js'

const MAX_NOTE_CONTENT_LENGTH = 2000

export async function listWorkspaceClientNotes(req, res) {
  const workspaceId = req.session.workspaceId
  const notes = await findClientNotesByWorkspace(workspaceId)

  return res.json({
    ok: true,
    notes: mapWorkspaceClientNoteResponses(notes),
  })
}

function parseClientId(rawId) {
  const clientId = Number(rawId)
  if (!Number.isInteger(clientId) || clientId <= 0) {
    return null
  }
  return clientId
}

function parseNoteId(rawId) {
  const noteId = Number(rawId)
  if (!Number.isInteger(noteId) || noteId <= 0) {
    return null
  }
  return noteId
}

function validateCreateBody(body) {
  const bodyError = assertJsonObject(body)
  if (bodyError) {
    return { error: bodyError }
  }

  if (typeof body.content !== 'string') {
    return { error: 'content is required.' }
  }

  const content = body.content.trim()
  if (!content) {
    return { error: 'content is required.' }
  }

  if (content.length > MAX_NOTE_CONTENT_LENGTH) {
    return { error: 'content must be 2000 characters or fewer.' }
  }

  return { data: { content } }
}

export async function listClientNotes(req, res) {
  const workspaceId = req.session.workspaceId
  const clientId = parseClientId(req.params.id)

  if (!clientId) {
    return res.status(400).json({ ok: false, error: 'Invalid client id.' })
  }

  const client = await findClientById(workspaceId, clientId)
  if (!client) {
    return res.status(404).json({ ok: false, error: 'Client not found.' })
  }

  const notes = await findClientNotesByWorkspaceClient(workspaceId, clientId)

  return res.json({
    ok: true,
    notes: mapClientNoteResponses(notes),
  })
}

export async function createClientNoteHandler(req, res) {
  const workspaceId = req.session.workspaceId
  const authorUserId = req.session.userId
  const clientId = parseClientId(req.params.id)

  if (!clientId) {
    return res.status(400).json({ ok: false, error: 'Invalid client id.' })
  }

  const client = await findClientById(workspaceId, clientId)
  if (!client) {
    return res.status(404).json({ ok: false, error: 'Client not found.' })
  }

  const validation = validateCreateBody(req.body)
  if (validation.error) {
    return res.status(400).json({ ok: false, error: validation.error })
  }

  const note = await createClientNote(
    workspaceId,
    clientId,
    authorUserId,
    validation.data.content,
  )

  return res.status(201).json({
    ok: true,
    note: mapClientNoteResponse(note),
  })
}

export async function deleteClientNoteHandler(req, res) {
  const workspaceId = req.session.workspaceId
  const clientId = parseClientId(req.params.id)
  const noteId = parseNoteId(req.params.noteId)

  if (!clientId) {
    return res.status(400).json({ ok: false, error: 'Invalid client id.' })
  }

  if (!noteId) {
    return res.status(400).json({ ok: false, error: 'Invalid note id.' })
  }

  const deleted = await deleteClientNote(workspaceId, clientId, noteId)
  if (!deleted) {
    return res.status(404).json({ ok: false, error: 'Note not found.' })
  }

  return res.json({ ok: true })
}

function formatIsoDateTimeOrNull(value) {
  if (value == null) {
    return null
  }

  const parsed = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return null
  }

  return parsed.toISOString()
}

export function mapClientNoteResponse(note) {
  return {
    id: note.id,
    clientId: note.client_id,
    content: note.content,
    author: {
      id: note.author_user_id,
      name: note.author_name,
    },
    createdAt: formatIsoDateTimeOrNull(note.created_at),
  }
}

export function mapClientNoteResponses(notes) {
  return notes.map(mapClientNoteResponse)
}

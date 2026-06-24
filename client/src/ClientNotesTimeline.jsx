import { useCallback, useEffect, useRef, useState } from 'react'
import * as clientsApi from './api/clients.js'
import { ApiError } from './api/client.js'
import { formatNoteTimestamp } from './utils/format'

const MAX_NOTE_LENGTH = 2000

function getNotesLoadError(err) {
  return err instanceof ApiError
    ? err.message
    : 'Unable to load notes. Try again.'
}

function getNoteSaveError(err) {
  return err instanceof ApiError
    ? err.message
    : 'Unable to save note. Try again.'
}

function getNoteDeleteError(err) {
  return err instanceof ApiError
    ? err.message
    : 'Unable to delete note. Try again.'
}

function validateNoteContent(value) {
  const trimmed = value.trim()
  if (!trimmed) {
    return 'Note content is required.'
  }
  if (trimmed.length > MAX_NOTE_LENGTH) {
    return 'Note must be 2000 characters or fewer.'
  }
  return null
}

export default function ClientNotesTimeline({ clientId, onNotesChanged, notesRevision }) {
  const [notes, setNotes] = useState([])
  const [loadStatus, setLoadStatus] = useState('loading')
  const [loadError, setLoadError] = useState(null)
  const [content, setContent] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)
  const [deleteError, setDeleteError] = useState(null)
  const [deletingNoteIds, setDeletingNoteIds] = useState(() => new Set())
  const saveInFlightRef = useRef(false)
  const deleteInFlightRef = useRef(new Set())

  const fetchNotes = useCallback(async () => {
    setLoadStatus('loading')
    setLoadError(null)

    try {
      const data = await clientsApi.listClientNotes(clientId)
      setNotes(data.notes ?? [])
      setLoadStatus('ready')
    } catch (err) {
      setNotes([])
      setLoadStatus('error')
      setLoadError(getNotesLoadError(err))
    }
  }, [clientId])

  useEffect(() => {
    let cancelled = false

    clientsApi
      .listClientNotes(clientId)
      .then((data) => {
        if (cancelled) return
        setNotes(data.notes ?? [])
        setLoadStatus('ready')
      })
      .catch((err) => {
        if (cancelled) return
        setNotes([])
        setLoadStatus('error')
        setLoadError(getNotesLoadError(err))
      })

    return () => {
      cancelled = true
    }
  }, [clientId, notesRevision])

  async function handleSubmit(event) {
    event.preventDefault()
    if (saveInFlightRef.current) return

    const validationError = validateNoteContent(content)
    if (validationError) {
      setSaveError(validationError)
      return
    }

    saveInFlightRef.current = true
    setIsSaving(true)
    setSaveError(null)

    const payload = { content: content.trim() }

    try {
      const data = await clientsApi.createClientNote(clientId, payload)
      setNotes((current) => [data.note, ...current])
      setContent('')
      onNotesChanged?.()
    } catch (err) {
      setSaveError(getNoteSaveError(err))
    } finally {
      saveInFlightRef.current = false
      setIsSaving(false)
    }
  }

  async function handleDeleteNote(noteId) {
    if (deleteInFlightRef.current.has(noteId)) return

    deleteInFlightRef.current.add(noteId)
    setDeletingNoteIds((current) => new Set(current).add(noteId))
    setDeleteError(null)

    try {
      await clientsApi.deleteClientNote(clientId, noteId)
      setNotes((current) => current.filter((note) => note.id !== noteId))
      onNotesChanged?.()
    } catch (err) {
      setDeleteError(getNoteDeleteError(err))
    } finally {
      deleteInFlightRef.current.delete(noteId)
      setDeletingNoteIds((current) => {
        const next = new Set(current)
        next.delete(noteId)
        return next
      })
    }
  }

  const trimmedLength = content.trim().length
  const isOverLimit = content.length > MAX_NOTE_LENGTH
  const canSubmit =
    !isSaving && trimmedLength > 0 && content.length <= MAX_NOTE_LENGTH

  return (
    <section className="drawer-client-notes" aria-label="Client notes">
      <h3 className="drawer-client-notes__title">Notes</h3>

      <form className="drawer-client-notes__form" onSubmit={handleSubmit}>
        <label className="drawer-client-notes__field" htmlFor="client-note-content">
          <span className="drawer-client-notes__label">Add a note</span>
          <textarea
            id="client-note-content"
            className="drawer-client-notes__textarea"
            value={content}
            onChange={(event) => {
              setContent(event.target.value)
              if (saveError) setSaveError(null)
            }}
            rows={4}
            disabled={isSaving}
            placeholder="Write a plain-text note about this client..."
            aria-describedby="client-note-count"
          />
        </label>
        <div className="drawer-client-notes__form-footer">
          <span
            id="client-note-count"
            className={`drawer-client-notes__count${
              isOverLimit ? ' drawer-client-notes__count--over' : ''
            }`}
          >
            {content.length} / {MAX_NOTE_LENGTH}
          </span>
          <button
            type="submit"
            className="btn btn--primary btn--sm"
            disabled={!canSubmit}
            aria-busy={isSaving}
          >
            {isSaving ? 'Adding…' : 'Add note'}
          </button>
        </div>
        {saveError ? (
          <p className="drawer-client-notes__error" role="alert">
            {saveError}
          </p>
        ) : null}
      </form>

      {loadStatus === 'loading' ? (
        <p className="drawer-client-notes__status">Loading notes…</p>
      ) : null}

      {loadStatus === 'error' ? (
        <div className="drawer-client-notes__status drawer-client-notes__status--error">
          <p role="alert">{loadError}</p>
          <button
            type="button"
            className="btn btn--secondary btn--sm"
            onClick={fetchNotes}
          >
            Try again
          </button>
        </div>
      ) : null}

      {loadStatus === 'ready' ? (
        <>
          {deleteError ? (
            <p className="drawer-client-notes__error" role="alert">
              {deleteError}
            </p>
          ) : null}

          {notes.length > 0 ? (
            <ol className="drawer-client-notes__list">
              {notes.map((note) => {
                const isDeleting = deletingNoteIds.has(note.id)

                return (
                  <li key={note.id} className="drawer-client-notes__item">
                    <header className="drawer-client-notes__item-header">
                      <div className="drawer-client-notes__item-meta">
                        <span className="drawer-client-notes__author">
                          {note.author?.name ?? 'Unknown author'}
                        </span>
                        <time
                          className="drawer-client-notes__time"
                          dateTime={note.createdAt ?? undefined}
                        >
                          {formatNoteTimestamp(note.createdAt)}
                        </time>
                      </div>
                      <button
                        type="button"
                        className="btn btn--danger btn--sm"
                        onClick={() => handleDeleteNote(note.id)}
                        disabled={isDeleting}
                        aria-busy={isDeleting}
                        aria-label={`Delete note by ${note.author?.name ?? 'Unknown author'}`}
                      >
                        {isDeleting ? 'Deleting…' : 'Delete'}
                      </button>
                    </header>
                    <p className="drawer-client-notes__content">{note.content}</p>
                  </li>
                )
              })}
            </ol>
          ) : (
            <p className="drawer-client-notes__empty">
              No notes yet. Add the first client note.
            </p>
          )}
        </>
      ) : null}
    </section>
  )
}

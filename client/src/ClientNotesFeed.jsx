import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import * as clientsApi from './api/clients.js'
import { ApiError } from './api/client.js'
import ConfirmModal from './ConfirmModal'
import useConfirmDeleteState from './hooks/useConfirmDeleteState'
import { IconSearch } from './icons'
import { formatNoteTimestamp } from './utils/format'

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
]

function getNotesLoadError(err) {
  return err instanceof ApiError
    ? err.message
    : 'Unable to load notes. Try again.'
}

function getNoteDeleteError(err) {
  return err instanceof ApiError
    ? err.message
    : 'Unable to delete note. Try again.'
}

function parseTimestamp(value) {
  if (!value) return null
  const time = new Date(value).getTime()
  return Number.isNaN(time) ? null : time
}

function compareNoteIds(a, b, direction) {
  const idA = Number(a.id)
  const idB = Number(b.id)
  if (Number.isFinite(idA) && Number.isFinite(idB)) {
    return (idA - idB) * direction
  }
  return 0
}

function filterNotesBySearch(notes, query) {
  const normalized = query.trim().toLowerCase()
  if (!normalized) return notes

  return notes.filter(
    (note) =>
      note.content.toLowerCase().includes(normalized) ||
      note.client?.company?.toLowerCase().includes(normalized) ||
      note.author?.name?.toLowerCase().includes(normalized),
  )
}

function sortNotes(notes, sortKey) {
  const sorted = [...notes]
  const direction = sortKey === 'oldest' ? 1 : -1

  sorted.sort((a, b) => {
    const timeA = parseTimestamp(a.createdAt)
    const timeB = parseTimestamp(b.createdAt)

    if (timeA == null && timeB == null) {
      return compareNoteIds(a, b, sortKey === 'oldest' ? 1 : -1)
    }
    if (timeA == null) return 1
    if (timeB == null) return -1
    if (timeA !== timeB) return (timeA - timeB) * direction

    return compareNoteIds(a, b, sortKey === 'oldest' ? 1 : -1)
  })

  return sorted
}

function applyNoteFilters(notes, { query, clientFilter, sortKey }) {
  let result = filterNotesBySearch(notes, query)

  if (clientFilter !== 'all') {
    const clientId = Number(clientFilter)
    result = result.filter((note) => note.client?.id === clientId)
  }

  return sortNotes(result, sortKey)
}

export default function ClientNotesFeed({
  clients,
  onOpenClient,
  notesRevision,
  onNotesChanged,
}) {
  const [notes, setNotes] = useState([])
  const [loadStatus, setLoadStatus] = useState('loading')
  const [loadError, setLoadError] = useState(null)
  const [query, setQuery] = useState('')
  const [clientFilter, setClientFilter] = useState('all')
  const [sortKey, setSortKey] = useState('newest')
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState(null)
  const [deletingNoteIds, setDeletingNoteIds] = useState(() => new Set())
  const fetchGenerationRef = useRef(0)
  const deleteInFlightRef = useRef(new Set())
  const {
    deletingItem: deletingNote,
    openDelete: openDeleteModal,
    closeDelete: closeDeleteModal,
  } = useConfirmDeleteState()

  const fetchNotes = useCallback(async () => {
    const generation = fetchGenerationRef.current + 1
    fetchGenerationRef.current = generation
    setLoadStatus('loading')
    setLoadError(null)

    try {
      const data = await clientsApi.listWorkspaceClientNotes()
      if (fetchGenerationRef.current !== generation) return
      setNotes(data.notes ?? [])
      setLoadStatus('ready')
    } catch (err) {
      if (fetchGenerationRef.current !== generation) return
      setNotes([])
      setLoadStatus('error')
      setLoadError(getNotesLoadError(err))
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    const generation = fetchGenerationRef.current + 1
    fetchGenerationRef.current = generation

    clientsApi
      .listWorkspaceClientNotes()
      .then((data) => {
        if (cancelled || fetchGenerationRef.current !== generation) return
        setNotes(data.notes ?? [])
        setLoadStatus('ready')
        setLoadError(null)
      })
      .catch((err) => {
        if (cancelled || fetchGenerationRef.current !== generation) return
        setNotes([])
        setLoadStatus('error')
        setLoadError(getNotesLoadError(err))
      })

    return () => {
      cancelled = true
    }
  }, [notesRevision])

  const clientFilterOptions = useMemo(() => {
    const clientIds = new Set(notes.map((note) => note.client?.id).filter(Boolean))
    return clients
      .filter((client) => clientIds.has(client.id))
      .sort((a, b) => a.company.localeCompare(b.company))
  }, [clients, notes])

  const filteredNotes = useMemo(
    () => applyNoteFilters(notes, { query, clientFilter, sortKey }),
    [notes, query, clientFilter, sortKey],
  )

  function handleOpenClient(note) {
    const relatedClient = clients.find((client) => client.id === note.client?.id)
    if (relatedClient) {
      onOpenClient(relatedClient)
    }
  }

  function handleOpenDeleteModal(note, event) {
    event.stopPropagation()
    if (deleteInFlightRef.current.has(note.id)) return
    setDeleteError(null)
    openDeleteModal(note)
  }

  function handleCloseDeleteModal() {
    if (isDeleting) return
    setDeleteError(null)
    closeDeleteModal()
  }

  async function confirmDeleteNote() {
    if (!deletingNote) return

    const noteId = deletingNote.id
    const clientId = deletingNote.client?.id
    if (!clientId || deleteInFlightRef.current.has(noteId)) return

    deleteInFlightRef.current.add(noteId)
    setDeletingNoteIds((current) => new Set(current).add(noteId))
    setIsDeleting(true)
    setDeleteError(null)

    try {
      await clientsApi.deleteClientNote(clientId, noteId)
      setNotes((current) => current.filter((note) => note.id !== noteId))
      closeDeleteModal()
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
      setIsDeleting(false)
    }
  }

  if (loadStatus === 'loading') {
    return (
      <div className="client-notes-feed client-notes-feed--state">
        <p className="client-notes-feed__status">Loading notes…</p>
      </div>
    )
  }

  if (loadStatus === 'error') {
    return (
      <div className="client-notes-feed client-notes-feed--state">
        <p className="client-notes-feed__status client-notes-feed__status--error" role="alert">
          {loadError}
        </p>
        <button type="button" className="btn btn--secondary" onClick={fetchNotes}>
          Try again
        </button>
      </div>
    )
  }

  return (
    <div className="client-notes-feed">
      <div className="client-notes-feed__toolbar">
        <label className="clients-search client-notes-feed__search">
          <IconSearch className="clients-search__icon" />
          <input
            type="search"
            className="clients-search__input"
            placeholder="Search notes, clients, or authors..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            aria-label="Search notes"
          />
        </label>
        <div className="client-notes-feed__filters">
          <label className="list-controls__field">
            <span className="list-controls__label">Client</span>
            <select
              className="list-controls__select"
              value={clientFilter}
              onChange={(event) => setClientFilter(event.target.value)}
              aria-label="Filter by client"
            >
              <option value="all">All clients</option>
              {clientFilterOptions.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.company}
                </option>
              ))}
            </select>
          </label>
          <label className="list-controls__field">
            <span className="list-controls__label">Sort</span>
            <select
              className="list-controls__select"
              value={sortKey}
              onChange={(event) => setSortKey(event.target.value)}
              aria-label="Sort notes"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {notes.length === 0 ? (
        <div className="client-notes-feed__empty">
          <p className="client-notes-feed__empty-title">No client notes yet.</p>
        </div>
      ) : filteredNotes.length === 0 ? (
        <div className="client-notes-feed__empty">
          <p className="client-notes-feed__empty-title">No notes match these filters.</p>
        </div>
      ) : (
        <ul className="client-notes-feed__list">
          {filteredNotes.map((note) => {
            const relatedClient = clients.find(
              (client) => client.id === note.client?.id,
            )
            const clientUnavailable = !relatedClient
            const isDeletingNote = deletingNoteIds.has(note.id)
            const clientCompany = note.client?.company ?? 'Unknown client'

            return (
              <li key={note.id} className="client-notes-feed__card">
                <header className="client-notes-feed__card-header">
                  <div className="client-notes-feed__card-meta">
                    {clientUnavailable ? (
                      <span className="client-notes-feed__client client-notes-feed__client--unavailable">
                        {clientCompany}
                        <span className="client-notes-feed__unavailable-hint">
                          Client unavailable
                        </span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        className="client-notes-feed__client"
                        onClick={() => handleOpenClient(note)}
                      >
                        {note.client.company}
                      </button>
                    )}
                    <span className="client-notes-feed__author">
                      {note.author?.name ?? 'Unknown author'}
                    </span>
                    <time
                      className="client-notes-feed__time"
                      dateTime={note.createdAt ?? undefined}
                    >
                      {formatNoteTimestamp(note.createdAt)}
                    </time>
                  </div>
                  <div className="client-notes-feed__actions">
                    <button
                      type="button"
                      className="btn btn--secondary btn--sm"
                      onClick={() => handleOpenClient(note)}
                      disabled={clientUnavailable || isDeletingNote}
                      aria-label={
                        clientUnavailable
                          ? `Client unavailable for note by ${note.author?.name ?? 'Unknown author'}`
                          : `View client ${clientCompany}`
                      }
                    >
                      View client
                    </button>
                    <button
                      type="button"
                      className="btn btn--danger btn--sm"
                      onClick={(event) => handleOpenDeleteModal(note, event)}
                      disabled={isDeletingNote || !note.client?.id}
                      aria-busy={isDeletingNote}
                      aria-label={`Delete note for ${clientCompany}`}
                    >
                      {isDeletingNote ? 'Deleting…' : 'Delete'}
                    </button>
                  </div>
                </header>
                <p className="client-notes-feed__content">{note.content}</p>
              </li>
            )
          })}
        </ul>
      )}

      {notes.length > 0 ? (
        <p className="client-notes-feed__footer">
          Showing {filteredNotes.length} of {notes.length} notes
        </p>
      ) : null}

      <ConfirmModal
        isOpen={Boolean(deletingNote)}
        title="Delete note?"
        description="This note will be permanently deleted."
        confirmLabel="Delete note"
        error={deleteError}
        isConfirming={isDeleting}
        onClose={handleCloseDeleteModal}
        onConfirm={confirmDeleteNote}
      />
    </div>
  )
}

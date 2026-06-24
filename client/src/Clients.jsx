import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import AddClientModal from './AddClientModal'
import * as clientsApi from './api/clients.js'
import { ApiError } from './api/client.js'
import useConfirmDeleteState from './hooks/useConfirmDeleteState'
import useEditModalState from './hooks/useEditModalState'
import useSelectionState from './hooks/useSelectionState'
import Badge from './Badge'
import ClientDetailDrawer from './ClientDetailDrawer'
import ClientNotesFeed from './ClientNotesFeed'
import ConfirmModal from './ConfirmModal'
import { IconPlus, IconSearch } from './icons'
import {
  SelectableTableRow,
  TableActions,
  TableCard,
  TableEmptyState,
} from './tables/tablePrimitives'
import {
  mapClientFormToApiPayload,
  mapClientFromApi,
  mapClientsFromApi,
} from './utils/clientMapper'
import { getClientStatusBadge, CLIENT_STATUS_OPTIONS, PIPELINE_STAGE_OPTIONS } from './utils/badges'
import { formatCurrency, getInitials } from './utils/format'

const CLIENT_SORT_OPTIONS = [
  { value: 'recently-updated', label: 'Recently updated' },
  { value: 'alphabetical', label: 'Alphabetical A–Z' },
  { value: 'project-value-desc', label: 'Project value: high to low' },
  { value: 'project-value-asc', label: 'Project value: low to high' },
]

function parseTimestamp(value) {
  if (!value) return null
  const time = new Date(value).getTime()
  return Number.isNaN(time) ? null : time
}

function compareIdsDesc(a, b) {
  const idA = Number(a.id)
  const idB = Number(b.id)
  if (Number.isFinite(idA) && Number.isFinite(idB)) return idB - idA
  return 0
}

function getProjectValueCentsForSort(client) {
  const cents = client.projectValueCents
  return Number.isFinite(cents) && cents >= 0 ? cents : 0
}

function filterClientsBySearch(clients, query) {
  const normalized = query.trim().toLowerCase()
  if (!normalized) return clients

  return clients.filter(
    (client) =>
      client.company.toLowerCase().includes(normalized) ||
      client.contact.toLowerCase().includes(normalized) ||
      client.email.toLowerCase().includes(normalized),
  )
}

function sortClients(clients, sortKey) {
  const sorted = [...clients]

  if (sortKey === 'alphabetical') {
    sorted.sort((a, b) => {
      const byCompany = a.company.localeCompare(b.company)
      if (byCompany !== 0) return byCompany
      const byContact = a.contact.localeCompare(b.contact)
      if (byContact !== 0) return byContact
      const byEmail = a.email.localeCompare(b.email)
      if (byEmail !== 0) return byEmail
      return compareIdsDesc(a, b)
    })
    return sorted
  }

  if (sortKey === 'project-value-desc' || sortKey === 'project-value-asc') {
    const direction = sortKey === 'project-value-desc' ? -1 : 1
    sorted.sort((a, b) => {
      const valueDiff =
        (getProjectValueCentsForSort(a) - getProjectValueCentsForSort(b)) *
        direction
      if (valueDiff !== 0) return valueDiff
      const byCompany = a.company.localeCompare(b.company)
      if (byCompany !== 0) return byCompany
      return compareIdsDesc(a, b)
    })
    return sorted
  }

  sorted.sort((a, b) => {
    const timeA = parseTimestamp(a.updatedAt)
    const timeB = parseTimestamp(b.updatedAt)
    if (timeA == null && timeB == null) return compareIdsDesc(a, b)
    if (timeA == null) return 1
    if (timeB == null) return -1
    if (timeB !== timeA) return timeB - timeA
    return compareIdsDesc(a, b)
  })

  return sorted
}

function applyClientFilters(clients, { query, statusFilter, pipelineFilter, sortKey }) {
  let result = filterClientsBySearch(clients, query)

  if (statusFilter !== 'all') {
    result = result.filter((client) => client.status === statusFilter)
  }

  if (pipelineFilter !== 'all') {
    result = result.filter((client) => client.pipelineStage === pipelineFilter)
  }

  return sortClients(result, sortKey)
}

function getClientsLoadError(err) {
  return err instanceof ApiError
    ? err.message
    : 'Unable to load clients. Try again.'
}

async function requestClientsList() {
  const data = await clientsApi.listClients()
  return mapClientsFromApi(data.clients)
}

const CLIENTS_NOTES_PATH = '/clients/notes'

export default function Clients() {
  const location = useLocation()
  const navigate = useNavigate()
  const activeView = location.pathname === CLIENTS_NOTES_PATH ? 'notes' : 'table'
  const [clients, setClients] = useState([])
  const [loadStatus, setLoadStatus] = useState('loading')
  const [loadError, setLoadError] = useState(null)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [pipelineFilter, setPipelineFilter] = useState('all')
  const [sortKey, setSortKey] = useState('recently-updated')
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState(null)
  const [notesRevision, setNotesRevision] = useState(0)
  const {
    isOpen: isModalOpen,
    editingItem: editingClient,
    openAdd: openAddModal,
    openEdit: openEditModal,
    close: closeModal,
  } = useEditModalState()
  const {
    deletingItem: deletingClient,
    openDelete: openDeleteModal,
    closeDelete: closeDeleteModal,
  } = useConfirmDeleteState()
  const {
    selectedItem: selectedClient,
    setSelectedItem: setSelectedClient,
    openSelection: openDrawer,
    closeSelection: closeDrawer,
  } = useSelectionState()
  const saveInFlightRef = useRef(false)
  const deleteInFlightRef = useRef(false)

  const handleNotesChanged = useCallback(() => {
    setNotesRevision((current) => current + 1)
  }, [])

  const handleOpenTask = useCallback(
    (taskId) => {
      navigate(`/tasks?taskId=${taskId}`)
    },
    [navigate],
  )

  const fetchClients = useCallback(async () => {
    setLoadStatus('loading')
    setLoadError(null)

    try {
      setClients(await requestClientsList())
      setLoadStatus('ready')
    } catch (err) {
      setClients([])
      setLoadStatus('error')
      setLoadError(getClientsLoadError(err))
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    requestClientsList()
      .then((nextClients) => {
        if (cancelled) return
        setClients(nextClients)
        setLoadStatus('ready')
      })
      .catch((err) => {
        if (cancelled) return
        setClients([])
        setLoadStatus('error')
        setLoadError(getClientsLoadError(err))
      })

    return () => {
      cancelled = true
    }
  }, [])

  const filteredClients = useMemo(
    () =>
      applyClientFilters(clients, {
        query,
        statusFilter,
        pipelineFilter,
        sortKey,
      }),
    [clients, query, statusFilter, pipelineFilter, sortKey],
  )

  function handleOpenAddModal() {
    setSaveError(null)
    openAddModal()
  }

  function handleOpenEditModal(client) {
    setSaveError(null)
    openEditModal(client)
  }

  async function handleSaveClient(form) {
    if (saveInFlightRef.current) return
    saveInFlightRef.current = true
    setIsSaving(true)
    setSaveError(null)

    const payload = mapClientFormToApiPayload(form)

    try {
      if (editingClient) {
        const data = await clientsApi.updateClient(editingClient.id, payload)
        const savedClient = mapClientFromApi(data.client)

        setClients((current) =>
          current.map((item) =>
            item.id === savedClient.id ? savedClient : item,
          ),
        )
        setSelectedClient((current) =>
          current?.id === savedClient.id ? savedClient : current,
        )
      } else {
        const data = await clientsApi.createClient(payload)
        const savedClient = mapClientFromApi(data.client)
        setClients((current) => [savedClient, ...current])
      }

      closeModal()
    } catch (err) {
      setSaveError(
        err instanceof ApiError
          ? err.message
          : 'Unable to save client. Try again.',
      )
    } finally {
      saveInFlightRef.current = false
      setIsSaving(false)
    }
  }

  async function confirmDeleteClient() {
    if (!deletingClient) return
    if (deleteInFlightRef.current) return
    deleteInFlightRef.current = true
    setIsDeleting(true)
    setDeleteError(null)

    try {
      await clientsApi.deleteClient(deletingClient.id)

      setClients((current) =>
        current.filter((item) => item.id !== deletingClient.id),
      )
      setSelectedClient((current) =>
        current?.id === deletingClient.id ? null : current,
      )
      closeDeleteModal()
    } catch (err) {
      setDeleteError(
        err instanceof ApiError
          ? err.message
          : 'Unable to delete client. Try again.',
      )
    } finally {
      deleteInFlightRef.current = false
      setIsDeleting(false)
    }
  }

  function handleCloseDeleteModal() {
    if (isDeleting) return
    setDeleteError(null)
    closeDeleteModal()
  }

  if (loadStatus === 'loading') {
    return (
      <div className="clients clients-state">
        <p className="clients-state__message">Loading clients…</p>
      </div>
    )
  }

  if (loadStatus === 'error') {
    return (
      <div className="clients clients-state">
        <p className="clients-state__message clients-state__message--error">
          {loadError}
        </p>
        <button type="button" className="btn btn--secondary" onClick={fetchClients}>
          Try again
        </button>
      </div>
    )
  }

  return (
    <div className="clients">
      <nav className="clients-view-toggle" aria-label="Clients view">
        <NavLink
          to="/clients"
          end
          className={({ isActive }) =>
            `clients-view-toggle__link${isActive ? ' clients-view-toggle__link--active' : ''}`
          }
        >
          Clients
        </NavLink>
        <NavLink
          to={CLIENTS_NOTES_PATH}
          className={({ isActive }) =>
            `clients-view-toggle__link${isActive ? ' clients-view-toggle__link--active' : ''}`
          }
        >
          Notes
        </NavLink>
      </nav>

      {activeView === 'table' ? (
        <>
          <div className="clients-toolbar">
            <div className="clients-toolbar__primary">
              <label className="clients-search clients-toolbar__search">
                <IconSearch className="clients-search__icon" />
                <input
                  type="search"
                  className="clients-search__input"
                  placeholder="Search by company, contact, or email..."
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  aria-label="Search clients"
                />
              </label>
              <button
                type="button"
                className="btn btn--primary clients-toolbar__action"
                onClick={handleOpenAddModal}
              >
                <IconPlus />
                Add Client
              </button>
            </div>
            <div className="clients-toolbar__filters">
              <label className="list-controls__field">
                <span className="list-controls__label">Status</span>
                <select
                  className="list-controls__select"
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  aria-label="Filter by status"
                >
                  <option value="all">All statuses</option>
                  {CLIENT_STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="list-controls__field">
                <span className="list-controls__label">Pipeline</span>
                <select
                  className="list-controls__select"
                  value={pipelineFilter}
                  onChange={(event) => setPipelineFilter(event.target.value)}
                  aria-label="Filter by pipeline stage"
                >
                  <option value="all">All stages</option>
                  {PIPELINE_STAGE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
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
                  aria-label="Sort clients"
                >
                  {CLIENT_SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          <TableCard
            cardClassName="clients-table-card"
            footerClassName="clients-table__footer"
            footerText={`Showing ${filteredClients.length} of ${clients.length} clients`}
          >
            <table className="clients-table">
              <thead>
                <tr>
                  <th scope="col">Company</th>
                  <th scope="col">Contact</th>
                  <th scope="col">Status</th>
                  <th scope="col" className="clients-table__align-right">
                    Project Value
                  </th>
                  <th scope="col" className="clients-table__align-right">
                    Last Activity
                  </th>
                  <th scope="col" className="clients-table__align-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredClients.length > 0 ? (
                  filteredClients.map((client) => (
                    <SelectableTableRow
                      key={client.id}
                      isSelected={selectedClient?.id === client.id}
                      rowClassName="clients-table__row"
                      selectedClassName="clients-table__row--selected"
                      ariaLabel={`View details for ${client.company}`}
                      onOpen={() => openDrawer(client)}
                    >
                      <td>
                        <div className="client-company">
                          <span className="client-avatar" aria-hidden="true">
                            {getInitials(client.company)}
                          </span>
                          <span className="client-company__name">{client.company}</span>
                        </div>
                      </td>
                      <td>
                        <div className="client-contact">
                          <span className="client-contact__name">{client.contact}</span>
                          <span className="client-contact__email">{client.email}</span>
                        </div>
                      </td>
                      <td>
                        <Badge {...getClientStatusBadge(client.status)} />
                      </td>
                      <td className="clients-table__align-right clients-table__value">
                        {formatCurrency(client.projectValue)}
                      </td>
                      <td className="clients-table__align-right clients-table__muted">
                        {client.lastActivity}
                      </td>
                      <td className="clients-table__align-right">
                        <TableActions
                          onEdit={() => handleOpenEditModal(client)}
                          onDelete={() => openDeleteModal(client)}
                        />
                      </td>
                    </SelectableTableRow>
                  ))
                ) : (
                  <TableEmptyState colSpan={6} className="clients-table__empty">
                    <span className="clients-table__empty-title">No clients found</span>
                    <span className="clients-table__empty-hint">
                      {clients.length === 0
                        ? 'Add your first client to get started.'
                        : 'No clients match these filters.'}
                    </span>
                  </TableEmptyState>
                )}
              </tbody>
            </table>
          </TableCard>
        </>
      ) : (
        <ClientNotesFeed
          clients={clients}
          onOpenClient={openDrawer}
          notesRevision={notesRevision}
          onNotesChanged={handleNotesChanged}
        />
      )}

      <AddClientModal
        isOpen={isModalOpen}
        client={editingClient}
        onClose={closeModal}
        onSave={handleSaveClient}
        isSaving={isSaving}
        saveError={saveError}
      />

      <ClientDetailDrawer
        client={selectedClient}
        onClose={closeDrawer}
        onEdit={handleOpenEditModal}
        onDelete={openDeleteModal}
        onNotesChanged={handleNotesChanged}
        notesRevision={notesRevision}
        onOpenTask={handleOpenTask}
      />

      <ConfirmModal
        isOpen={Boolean(deletingClient)}
        title="Delete client?"
        description={
          deletingClient
            ? `${deletingClient.company} will be permanently removed from your client list. This action cannot be undone.`
            : ''
        }
        error={deleteError}
        isConfirming={isDeleting}
        confirmLabel="Delete"
        onClose={handleCloseDeleteModal}
        onConfirm={confirmDeleteClient}
      />
    </div>
  )
}

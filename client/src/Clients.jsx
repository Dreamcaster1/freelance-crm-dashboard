import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import AddClientModal from './AddClientModal'
import * as clientsApi from './api/clients.js'
import { ApiError } from './api/client.js'
import useConfirmDeleteState from './hooks/useConfirmDeleteState'
import useEditModalState from './hooks/useEditModalState'
import useSelectionState from './hooks/useSelectionState'
import Badge from './Badge'
import ClientDetailDrawer from './ClientDetailDrawer'
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
import { getClientStatusBadge } from './utils/badges'
import { formatCurrency, getInitials } from './utils/format'

function filterClients(clients, query) {
  const normalized = query.trim().toLowerCase()
  if (!normalized) return clients

  return clients.filter(
    (client) =>
      client.company.toLowerCase().includes(normalized) ||
      client.contact.toLowerCase().includes(normalized) ||
      client.email.toLowerCase().includes(normalized),
  )
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

export default function Clients() {
  const [clients, setClients] = useState([])
  const [loadStatus, setLoadStatus] = useState('loading')
  const [loadError, setLoadError] = useState(null)
  const [query, setQuery] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState(null)
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
  const trimmedQuery = query.trim()
  const saveInFlightRef = useRef(false)
  const deleteInFlightRef = useRef(false)

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
    () => filterClients(clients, query),
    [clients, query],
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
      <div className="clients-toolbar">
        <label className="clients-search">
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
          className="btn btn--primary"
          onClick={handleOpenAddModal}
        >
          <IconPlus />
          Add Client
        </button>
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
                  {trimmedQuery
                    ? `No results for “${trimmedQuery}”. Try another company, contact, or email.`
                    : 'Add your first client to get started.'}
                </span>
              </TableEmptyState>
            )}
          </tbody>
        </table>
      </TableCard>

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

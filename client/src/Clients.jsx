import { useMemo, useState } from 'react'
import AddClientModal from './AddClientModal'
import Badge from './Badge'
import ClientDetailDrawer from './ClientDetailDrawer'
import ConfirmModal from './ConfirmModal'
import { INITIAL_CLIENTS } from './data/clients'
import { IconPlus, IconSearch } from './icons'

function getInitials(company) {
  return company
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase()
}

function formatCurrency(amount) {
  if (amount === 0) return '—'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount)
}

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

export default function Clients() {
  const [clients, setClients] = useState(INITIAL_CLIENTS)
  const [query, setQuery] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingClient, setEditingClient] = useState(null)
  const [deletingClient, setDeletingClient] = useState(null)
  const [selectedClient, setSelectedClient] = useState(null)
  const trimmedQuery = query.trim()

  const filteredClients = useMemo(
    () => filterClients(clients, query),
    [clients, query],
  )

  function openAddModal() {
    setEditingClient(null)
    setIsModalOpen(true)
  }

  function openEditModal(client) {
    setEditingClient(client)
    setIsModalOpen(true)
  }

  function closeModal() {
    setIsModalOpen(false)
    setEditingClient(null)
    if (selectedClient) {
      document.body.style.overflow = 'hidden'
    }
  }

  function handleSaveClient(client) {
    if (editingClient) {
      setClients((current) =>
        current.map((item) => (item.id === client.id ? client : item)),
      )
      setSelectedClient((current) =>
        current?.id === client.id ? client : current,
      )
    } else {
      setClients((current) => [client, ...current])
    }
    closeModal()
  }

  function openDeleteModal(client) {
    setDeletingClient(client)
  }

  function closeDeleteModal() {
    setDeletingClient(null)
    if (selectedClient) {
      document.body.style.overflow = 'hidden'
    }
  }

  function confirmDeleteClient() {
    if (!deletingClient) return

    setClients((current) =>
      current.filter((item) => item.id !== deletingClient.id),
    )
    setSelectedClient((current) =>
      current?.id === deletingClient.id ? null : current,
    )
    closeDeleteModal()
  }

  function openDrawer(client) {
    setSelectedClient(client)
  }

  function closeDrawer() {
    setSelectedClient(null)
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
          onClick={openAddModal}
        >
          <IconPlus />
          Add Client
        </button>
      </div>

      <div className="clients-table-card">
        <div className="table-scroll">
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
                  <tr
                    key={client.id}
                    className={`clients-table__row${
                      selectedClient?.id === client.id
                        ? ' clients-table__row--selected'
                        : ''
                    }`}
                    onClick={() => openDrawer(client)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        openDrawer(client)
                      }
                    }}
                    tabIndex={0}
                    aria-label={`View details for ${client.company}`}
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
                      <Badge {...client.status} />
                    </td>
                    <td className="clients-table__align-right clients-table__value">
                      {formatCurrency(client.projectValue)}
                    </td>
                    <td className="clients-table__align-right clients-table__muted">
                      {client.lastActivity}
                    </td>
                    <td className="clients-table__align-right">
                      <div className="table-actions">
                        <button
                          type="button"
                          className="btn btn--secondary btn--sm"
                          onClick={(event) => {
                            event.stopPropagation()
                            openEditModal(client)
                          }}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="btn btn--danger btn--sm"
                          onClick={(event) => {
                            event.stopPropagation()
                            openDeleteModal(client)
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="clients-table__empty">
                    <span className="clients-table__empty-title">No clients found</span>
                    <span className="clients-table__empty-hint">
                      No results for &ldquo;{trimmedQuery}&rdquo;. Try another
                      company, contact, or email.
                    </span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <footer className="clients-table__footer">
          Showing {filteredClients.length} of {clients.length} clients
        </footer>
      </div>

      <AddClientModal
        isOpen={isModalOpen}
        client={editingClient}
        onClose={closeModal}
        onSave={handleSaveClient}
      />

      <ClientDetailDrawer
        client={selectedClient}
        onClose={closeDrawer}
        onEdit={openEditModal}
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
        onClose={closeDeleteModal}
        onConfirm={confirmDeleteClient}
      />
    </div>
  )
}

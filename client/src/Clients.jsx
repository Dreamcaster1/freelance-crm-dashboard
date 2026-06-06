import { useMemo, useState } from 'react'
import AddClientModal from './AddClientModal'
import Badge from './Badge'
import ConfirmModal from './ConfirmModal'
import { IconPlus, IconSearch } from './icons'

const INITIAL_CLIENTS = [
  {
    id: 'c1',
    company: 'Northline Studio',
    contact: 'Sarah Chen',
    email: 'sarah@northline.studio',
    status: { label: 'Active', variant: 'success' },
    projectValue: 18500,
    lastActivity: '2 hours ago',
  },
  {
    id: 'c2',
    company: 'Brightpath Labs',
    contact: 'Marcus Webb',
    email: 'marcus@brightpath.io',
    status: { label: 'Active', variant: 'success' },
    projectValue: 12400,
    lastActivity: '5 hours ago',
  },
  {
    id: 'c3',
    company: 'Harbor & Co.',
    contact: 'Elena Vasquez',
    email: 'elena@harborco.com',
    status: { label: 'On hold', variant: 'warning' },
    projectValue: 8200,
    lastActivity: 'Yesterday',
  },
  {
    id: 'c4',
    company: 'Elmwood Digital',
    contact: 'James Okonkwo',
    email: 'james@elmwood.digital',
    status: { label: 'Active', variant: 'success' },
    projectValue: 9600,
    lastActivity: 'Yesterday',
  },
  {
    id: 'c5',
    company: 'Summit Health',
    contact: 'Priya Nair',
    email: 'priya@summithealth.org',
    status: { label: 'Active', variant: 'success' },
    projectValue: 22000,
    lastActivity: 'Jun 4',
  },
  {
    id: 'c6',
    company: 'Lumen Analytics',
    contact: 'David Park',
    email: 'david@lumenanalytics.com',
    status: { label: 'Lead', variant: 'info' },
    projectValue: 0,
    lastActivity: 'Jun 3',
  },
  {
    id: 'c7',
    company: 'Atlas Ventures',
    contact: 'Rachel Kim',
    email: 'rachel@atlasvc.com',
    status: { label: 'Lead', variant: 'info' },
    projectValue: 0,
    lastActivity: 'Jun 2',
  },
  {
    id: 'c8',
    company: 'Copperline Media',
    contact: 'Tom Bradley',
    email: 'tom@copperline.media',
    status: { label: 'At risk', variant: 'danger' },
    projectValue: 5400,
    lastActivity: 'May 30',
  },
  {
    id: 'c9',
    company: 'Fieldstone Retail',
    contact: 'Amira Hassan',
    email: 'amira@fieldstone.co',
    status: { label: 'Active', variant: 'success' },
    projectValue: 14800,
    lastActivity: 'May 29',
  },
  {
    id: 'c10',
    company: 'Waypoint Travel',
    contact: 'Chris Dalton',
    email: 'chris@waypoint.travel',
    status: { label: 'Inactive', variant: 'neutral' },
    projectValue: 3200,
    lastActivity: 'May 15',
  },
  {
    id: 'c11',
    company: 'Nova Education',
    contact: 'Lisa Fernandez',
    email: 'lisa@novaedu.org',
    status: { label: 'Active', variant: 'success' },
    projectValue: 11200,
    lastActivity: 'May 12',
  },
  {
    id: 'c12',
    company: 'Redwood Legal',
    contact: 'Owen Mitchell',
    email: 'owen@redwoodlegal.com',
    status: { label: 'On hold', variant: 'warning' },
    projectValue: 6700,
    lastActivity: 'May 8',
  },
]

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
  }

  function handleSaveClient(client) {
    if (editingClient) {
      setClients((current) =>
        current.map((item) => (item.id === client.id ? client : item)),
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
  }

  function confirmDeleteClient() {
    if (!deletingClient) return

    setClients((current) =>
      current.filter((item) => item.id !== deletingClient.id),
    )
    closeDeleteModal()
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
                  <tr key={client.id}>
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
                          onClick={() => openEditModal(client)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="btn btn--danger btn--sm"
                          onClick={() => openDeleteModal(client)}
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

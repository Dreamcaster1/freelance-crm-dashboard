import { useMemo, useState } from 'react'
import AddClientModal from './AddClientModal'
import useConfirmDeleteState from './hooks/useConfirmDeleteState'
import useEditModalState from './hooks/useEditModalState'
import useSelectionState from './hooks/useSelectionState'
import Badge from './Badge'
import ClientDetailDrawer from './ClientDetailDrawer'
import ConfirmModal from './ConfirmModal'
import { INITIAL_CLIENTS } from './data/clients'
import { IconPlus, IconSearch } from './icons'
import {
  SelectableTableRow,
  TableActions,
  TableCard,
  TableEmptyState,
} from './tables/tablePrimitives'
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

export default function Clients() {
  const [clients, setClients] = useState(INITIAL_CLIENTS)
  const [query, setQuery] = useState('')
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

  const filteredClients = useMemo(
    () => filterClients(clients, query),
    [clients, query],
  )

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
                      onEdit={() => openEditModal(client)}
                      onDelete={() => openDeleteModal(client)}
                    />
                  </td>
                </SelectableTableRow>
              ))
            ) : (
              <TableEmptyState colSpan={6} className="clients-table__empty">
                <span className="clients-table__empty-title">No clients found</span>
                <span className="clients-table__empty-hint">
                  No results for &ldquo;{trimmedQuery}&rdquo;. Try another
                  company, contact, or email.
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

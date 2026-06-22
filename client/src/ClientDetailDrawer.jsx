import Badge from './Badge'
import Drawer from './Drawer'
import { getClientStatusBadge } from './utils/badges'
import { formatCurrency, getInitials } from './utils/format'

export default function ClientDetailDrawer({ client, onClose, onEdit, onDelete }) {
  if (!client) return null

  return (
    <Drawer
      onClose={onClose}
      onEdit={onEdit}
      onDelete={onDelete}
      item={client}
      variant="client"
      titleId="client-drawer-title"
      closeLabel="Close client details"
      header={
        <>
          <span className="drawer__avatar" aria-hidden="true">
            {getInitials(client.company)}
          </span>
          <div className="drawer__header-copy">
            <h2 id="client-drawer-title" className="drawer__title">
              {client.company}
            </h2>
            <Badge {...getClientStatusBadge(client.status)} />
          </div>
        </>
      }
    >
      <dl className="drawer-details">
        <div className="drawer-details__row">
          <dt className="drawer-details__label">Contact</dt>
          <dd className="drawer-details__value">{client.contact}</dd>
        </div>
        <div className="drawer-details__row">
          <dt className="drawer-details__label">Email</dt>
          <dd className="drawer-details__value">
            <a className="drawer-details__link" href={`mailto:${client.email}`}>
              {client.email}
            </a>
          </dd>
        </div>
        <div className="drawer-details__row">
          <dt className="drawer-details__label">Status</dt>
          <dd className="drawer-details__value">
            <Badge {...getClientStatusBadge(client.status)} />
          </dd>
        </div>
        <div className="drawer-details__row">
          <dt className="drawer-details__label">Project value</dt>
          <dd className="drawer-details__value drawer-details__value--emphasis">
            {formatCurrency(client.projectValue)}
          </dd>
        </div>
        <div className="drawer-details__row">
          <dt className="drawer-details__label">Last activity</dt>
          <dd className="drawer-details__value drawer-details__value--muted">
            {client.lastActivity}
          </dd>
        </div>
      </dl>

      <section className="drawer-activity" aria-label="Recent notes and activity">
        <header className="drawer-activity__header">
          <h3 className="drawer-activity__title">Recent notes &amp; activity</h3>
        </header>
        <p className="drawer-details__value drawer-details__value--muted">
          No activity history available yet.
        </p>
      </section>
    </Drawer>
  )
}

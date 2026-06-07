import Badge from './Badge'
import Drawer from './Drawer'
import { CLIENT_ACTIVITY, DEFAULT_ACTIVITY } from './data/clients'
import { ActivityIcon } from './icons'
import { getClientStatusBadge } from './utils/badges'
import { formatCurrency, getInitials } from './utils/format'

function getClientActivity(clientId) {
  return CLIENT_ACTIVITY[clientId] ?? DEFAULT_ACTIVITY
}

export default function ClientDetailDrawer({ client, onClose, onEdit, onDelete }) {
  if (!client) return null

  const activity = getClientActivity(client.id)

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
          <span className="drawer-activity__meta">{activity.length} entries</span>
        </header>
        <ul className="drawer-activity__list">
          {activity.map((item) => (
            <li key={item.id} className="drawer-activity__item">
              <span className="drawer-activity__icon" aria-hidden="true">
                <ActivityIcon type={item.type} />
              </span>
              <div className="drawer-activity__copy">
                <span className="drawer-activity__item-title">{item.title}</span>
                <span className="drawer-activity__item-time">{item.time}</span>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </Drawer>
  )
}

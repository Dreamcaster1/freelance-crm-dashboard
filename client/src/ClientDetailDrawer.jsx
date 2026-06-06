import { useEffect } from 'react'
import Badge from './Badge'
import { CLIENT_ACTIVITY, DEFAULT_ACTIVITY } from './data/clients'
import { ActivityIcon, IconX } from './icons'
import { formatCurrency, getInitials } from './utils/format'

function getClientActivity(clientId) {
  return CLIENT_ACTIVITY[clientId] ?? DEFAULT_ACTIVITY
}

export default function ClientDetailDrawer({ client, onClose, onEdit, onDelete }) {
  useEffect(() => {
    if (!client) return undefined

    document.body.style.overflow = 'hidden'

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [client, onClose])

  if (!client) return null

  const activity = getClientActivity(client.id)

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <aside
        className="drawer drawer--client"
        role="dialog"
        aria-modal="true"
        aria-labelledby="client-drawer-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="drawer__header">
          <div className="drawer__header-main">
            <span className="drawer__avatar" aria-hidden="true">
              {getInitials(client.company)}
            </span>
            <div className="drawer__header-copy">
              <h2 id="client-drawer-title" className="drawer__title">
                {client.company}
              </h2>
              <Badge {...client.status} />
            </div>
          </div>
          <button
            type="button"
            className="drawer__close"
            onClick={onClose}
            aria-label="Close client details"
          >
            <IconX />
          </button>
        </header>

        <div className="drawer__body">
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
                <Badge {...client.status} />
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
        </div>

        <footer className="drawer__footer">
          <button
            type="button"
            className="btn btn--secondary"
            onClick={() => onEdit(client)}
          >
            Edit
          </button>
          <button
            type="button"
            className="btn btn--danger"
            onClick={() => onDelete(client)}
          >
            Delete
          </button>
        </footer>
      </aside>
    </div>
  )
}

import Badge from './Badge'
import ClientLinkedTasks from './ClientLinkedTasks'
import ClientNotesTimeline from './ClientNotesTimeline'
import Drawer from './Drawer'
import { getClientStatusBadge, getPipelineStageBadge } from './utils/badges'
import { formatCurrency, getInitials } from './utils/format'

export default function ClientDetailDrawer({
  client,
  onClose,
  onEdit,
  onDelete,
  onNotesChanged,
  notesRevision,
  onOpenTask,
  onCreateTask,
  tasksRevision,
}) {
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
          <dt className="drawer-details__label">Pipeline stage</dt>
          <dd className="drawer-details__value">
            <Badge {...getPipelineStageBadge(client.pipelineStage)} />
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

      <ClientLinkedTasks
        key={client.id}
        clientId={client.id}
        onOpenTask={onOpenTask}
        onCreateTask={onCreateTask}
        tasksRevision={tasksRevision}
      />

      <ClientNotesTimeline
        key={client.id}
        clientId={client.id}
        onNotesChanged={onNotesChanged}
        notesRevision={notesRevision}
      />
    </Drawer>
  )
}

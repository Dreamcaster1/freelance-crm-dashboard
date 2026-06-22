import Badge from './Badge'
import Drawer from './Drawer'
import { getTaskPriorityBadge, getTaskStatusBadge } from './utils/badges'

export default function TaskDetailDrawer({ task, onClose, onEdit, onDelete }) {
  if (!task) return null

  const description =
    task.description?.trim() || 'No notes added for this task yet.'
  const isCompleted = task.status === 'completed'

  return (
    <Drawer
      onClose={onClose}
      onEdit={onEdit}
      onDelete={onDelete}
      item={task}
      variant="task"
      titleId="task-drawer-title"
      closeLabel="Close task details"
      header={
        <>
          <span
            className={`drawer__task-check${
              isCompleted ? ' drawer__task-check--done' : ''
            }`}
            aria-hidden="true"
          />
          <div className="drawer__header-copy">
            <h2
              id="task-drawer-title"
              className={`drawer__title${
                isCompleted ? ' drawer__title--completed' : ''
              }`}
            >
              {task.name}
            </h2>
            <div className="drawer__badges">
              <Badge {...getTaskStatusBadge(task.status)} />
              <Badge {...getTaskPriorityBadge(task.priority)} />
            </div>
          </div>
        </>
      }
    >
      <dl className="drawer-details">
        <div className="drawer-details__row">
          <dt className="drawer-details__label">Client</dt>
          <dd className="drawer-details__value">{task.client}</dd>
        </div>
        <div className="drawer-details__row">
          <dt className="drawer-details__label">Status</dt>
          <dd className="drawer-details__value">
            <Badge {...getTaskStatusBadge(task.status)} />
          </dd>
        </div>
        <div className="drawer-details__row">
          <dt className="drawer-details__label">Priority</dt>
          <dd className="drawer-details__value">
            <Badge {...getTaskPriorityBadge(task.priority)} />
          </dd>
        </div>
        <div className="drawer-details__row">
          <dt className="drawer-details__label">Due date</dt>
          <dd className="drawer-details__value drawer-details__value--emphasis">
            {task.dueDate}
          </dd>
        </div>
      </dl>

      <section className="drawer-notes" aria-label="Task notes">
        <h3 className="drawer-notes__title">Description &amp; notes</h3>
        <p className="drawer-notes__body">{description}</p>
      </section>

      <section className="drawer-activity" aria-label="Related activity">
        <header className="drawer-activity__header">
          <h3 className="drawer-activity__title">Related activity</h3>
        </header>
        <p className="drawer-details__value drawer-details__value--muted">
          No activity history available yet.
        </p>
      </section>
    </Drawer>
  )
}

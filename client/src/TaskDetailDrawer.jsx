import { useEffect } from 'react'
import Badge from './Badge'
import { DEFAULT_DETAILS, TASK_DETAILS } from './data/tasks'
import { ActivityIcon, IconX } from './icons'

function getTaskDetails(taskId) {
  return TASK_DETAILS[taskId] ?? DEFAULT_DETAILS
}

export default function TaskDetailDrawer({ task, onClose, onEdit, onDelete }) {
  useEffect(() => {
    if (!task) return undefined

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
  }, [task, onClose])

  if (!task) return null

  const { description, activity } = getTaskDetails(task.id)
  const isCompleted = task.status === 'completed'

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <aside
        className="drawer drawer--task"
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-drawer-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="drawer__header">
          <div className="drawer__header-main">
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
                <Badge {...task.statusBadge} />
                <Badge {...task.priority} />
              </div>
            </div>
          </div>
          <button
            type="button"
            className="drawer__close"
            onClick={onClose}
            aria-label="Close task details"
          >
            <IconX />
          </button>
        </header>

        <div className="drawer__body">
          <dl className="drawer-details">
            <div className="drawer-details__row">
              <dt className="drawer-details__label">Client</dt>
              <dd className="drawer-details__value">{task.client}</dd>
            </div>
            <div className="drawer-details__row">
              <dt className="drawer-details__label">Status</dt>
              <dd className="drawer-details__value">
                <Badge {...task.statusBadge} />
              </dd>
            </div>
            <div className="drawer-details__row">
              <dt className="drawer-details__label">Priority</dt>
              <dd className="drawer-details__value">
                <Badge {...task.priority} />
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
            onClick={() => onEdit(task)}
          >
            Edit
          </button>
          <button
            type="button"
            className="btn btn--danger"
            onClick={() => onDelete(task)}
          >
            Delete
          </button>
        </footer>
      </aside>
    </div>
  )
}

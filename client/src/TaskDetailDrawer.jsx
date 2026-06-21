import Badge from './Badge'
import Drawer from './Drawer'
import { DEFAULT_DETAILS, TASK_DETAILS } from './data/tasks'
import { ActivityIcon } from './icons'
import { getTaskPriorityBadge, getTaskStatusBadge } from './utils/badges'

function getTaskDetails(taskId) {
  return TASK_DETAILS[taskId] ?? DEFAULT_DETAILS
}

export default function TaskDetailDrawer({ task, onClose, onEdit, onDelete }) {
  if (!task) return null

  const { activity } = getTaskDetails(task.id)
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

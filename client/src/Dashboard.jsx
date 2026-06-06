import Badge from './Badge'
import { RECENT_ACTIVITY, STATS, UPCOMING_TASKS } from './data/dashboard'
import { ActivityIcon, IconActivity, IconCalendar } from './icons'

export default function Dashboard() {
  return (
    <div className="dashboard">
      <section className="dashboard-stats" aria-label="Summary">
        {STATS.map((stat) => {
          const Icon = stat.icon
          return (
            <article
              key={stat.label}
              className={`dashboard-stat dashboard-stat--${stat.tone}`}
            >
              <div className="dashboard-stat__top">
                <span className="dashboard-stat__label">{stat.label}</span>
                <span className="dashboard-stat__icon">
                  <Icon />
                </span>
              </div>
              <span className="dashboard-stat__value">{stat.value}</span>
              <span className="dashboard-stat__detail">{stat.detail}</span>
            </article>
          )
        })}
      </section>

      <section className="dashboard-panels" aria-label="Overview">
        <article className="dashboard-panel">
          <header className="dashboard-panel__header">
            <div className="dashboard-panel__title-group">
              <span className="dashboard-panel__icon">
                <IconActivity />
              </span>
              <div>
                <h2 className="dashboard-panel__title">Recent activity</h2>
                <p className="dashboard-panel__subtitle">
                  Deploys, approvals, and client touchpoints
                </p>
              </div>
            </div>
            <span className="dashboard-panel__meta">5 events</span>
          </header>

          <ul className="activity-list">
            {RECENT_ACTIVITY.map((item) => (
              <li key={item.id} className="activity-item">
                <span className={`activity-item__icon activity-item__icon--${item.type}`}>
                  <ActivityIcon type={item.type} />
                </span>
                <div className="activity-item__body">
                  <span className="activity-item__title">{item.title}</span>
                  <span className="activity-item__client">{item.client}</span>
                </div>
                <div className="activity-item__aside">
                  <Badge {...item.badge} />
                  <time className="activity-item__time">{item.time}</time>
                </div>
              </li>
            ))}
          </ul>
        </article>

        <article className="dashboard-panel">
          <header className="dashboard-panel__header">
            <div className="dashboard-panel__title-group">
              <span className="dashboard-panel__icon">
                <IconCalendar />
              </span>
              <div>
                <h2 className="dashboard-panel__title">Upcoming tasks</h2>
                <p className="dashboard-panel__subtitle">
                  Due before the end of the week
                </p>
              </div>
            </div>
            <span className="dashboard-panel__meta">5 open</span>
          </header>

          <ul className="task-list">
            {UPCOMING_TASKS.map((task) => (
              <li key={task.id} className="task-item">
                <span className="task-item__check" aria-hidden="true" />
                <div className="task-item__body">
                  <span className="task-item__title">{task.title}</span>
                  <span className="task-item__client">{task.client}</span>
                </div>
                <div className="task-item__aside">
                  <div className="task-item__badges">
                    <Badge {...task.status} />
                    <Badge {...task.badge} />
                  </div>
                  <span className="task-item__due">{task.due}</span>
                </div>
              </li>
            ))}
          </ul>
        </article>
      </section>
    </div>
  )
}

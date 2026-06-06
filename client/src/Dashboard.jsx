import Badge from './Badge'
import {
  ActivityIcon,
  IconActivity,
  IconBriefcase,
  IconCalendar,
  IconCheckSquare,
  IconDollar,
  IconUsers,
} from './icons'

const STATS = [
  {
    label: 'Active clients',
    value: '12',
    detail: '+2 this month',
    icon: IconUsers,
    tone: 'accent',
  },
  {
    label: 'Open tasks',
    value: '8',
    detail: '3 due this week',
    icon: IconCheckSquare,
    tone: 'default',
  },
  {
    label: 'Revenue',
    value: '$4,200',
    detail: '+18% vs last month',
    icon: IconDollar,
    tone: 'success',
  },
  {
    label: 'Active projects',
    value: '6',
    detail: '2 awaiting review',
    icon: IconBriefcase,
    tone: 'default',
  },
]

const RECENT_ACTIVITY = [
  {
    id: 'a1',
    type: 'invoice',
    title: 'Invoice #1042 sent',
    client: 'Northline Studio',
    time: '2 hours ago',
    badge: { label: 'Sent', variant: 'info' },
  },
  {
    id: 'a2',
    type: 'task',
    title: 'Homepage mockups approved',
    client: 'Brightpath Labs',
    time: '5 hours ago',
    badge: { label: 'Completed', variant: 'success' },
  },
  {
    id: 'a3',
    type: 'message',
    title: 'Kickoff notes shared',
    client: 'Harbor & Co.',
    time: 'Yesterday',
    badge: { label: 'Client', variant: 'neutral' },
  },
  {
    id: 'a4',
    type: 'project',
    title: 'Brand refresh moved to In Review',
    client: 'Elmwood Digital',
    time: 'Yesterday',
    badge: { label: 'In review', variant: 'warning' },
  },
  {
    id: 'a5',
    type: 'invoice',
    title: 'Retainer payment received',
    client: 'Summit Health',
    time: 'Jun 4',
    badge: { label: 'Paid', variant: 'success' },
  },
]

const UPCOMING_TASKS = [
  {
    id: 't1',
    title: 'Deliver wireframes v2',
    client: 'Northline Studio',
    due: 'Tomorrow',
    badge: { label: 'High', variant: 'danger' },
    status: { label: 'In progress', variant: 'info' },
  },
  {
    id: 't2',
    title: 'Send Q2 progress report',
    client: 'Brightpath Labs',
    due: 'Jun 8',
    badge: { label: 'Medium', variant: 'warning' },
    status: { label: 'Pending', variant: 'neutral' },
  },
  {
    id: 't3',
    title: 'Review contract amendments',
    client: 'Harbor & Co.',
    due: 'Jun 9',
    badge: { label: 'Medium', variant: 'warning' },
    status: { label: 'In progress', variant: 'info' },
  },
  {
    id: 't4',
    title: 'Finalize logo exports',
    client: 'Elmwood Digital',
    due: 'Jun 10',
    badge: { label: 'Low', variant: 'neutral' },
    status: { label: 'Pending', variant: 'neutral' },
  },
  {
    id: 't5',
    title: 'Schedule discovery call',
    client: 'Summit Health',
    due: 'Jun 12',
    badge: { label: 'Low', variant: 'neutral' },
    status: { label: 'Scheduled', variant: 'success' },
  },
]

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
                  Latest updates across clients and projects
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
                  Due in the next seven days
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

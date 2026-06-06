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
    detail: '2 new inquiries this month',
    icon: IconUsers,
    tone: 'accent',
  },
  {
    label: 'Open tasks',
    value: '8',
    detail: '3 shipping this week',
    icon: IconCheckSquare,
    tone: 'default',
  },
  {
    label: 'Billed this month',
    value: '$4,200',
    detail: '+18% vs April',
    icon: IconDollar,
    tone: 'success',
  },
  {
    label: 'Live builds',
    value: '6',
    detail: '2 in client review',
    icon: IconBriefcase,
    tone: 'default',
  },
]

const RECENT_ACTIVITY = [
  {
    id: 'a1',
    type: 'project',
    title: 'Staging deploy pushed for sprint 4',
    client: 'Relay Apps',
    time: '2 hours ago',
    badge: { label: 'Deployed', variant: 'info' },
  },
  {
    id: 'a2',
    type: 'task',
    title: 'Homepage copy approved',
    client: 'Harbor & Co.',
    time: '5 hours ago',
    badge: { label: 'Signed off', variant: 'success' },
  },
  {
    id: 'a3',
    type: 'message',
    title: 'Checkout bug report from QA',
    client: 'Patchwork Foods',
    time: 'Yesterday',
    badge: { label: 'Support', variant: 'neutral' },
  },
  {
    id: 'a4',
    type: 'project',
    title: 'DNS cutover completed',
    client: 'Vaultline Security',
    time: 'Yesterday',
    badge: { label: 'Live', variant: 'success' },
  },
  {
    id: 'a5',
    type: 'invoice',
    title: 'June retainer marked paid',
    client: 'Kite & Anchor',
    time: 'Jun 4',
    badge: { label: 'Paid', variant: 'success' },
  },
]

const UPCOMING_TASKS = [
  {
    id: 't1',
    title: 'Ship homepage v2 to staging',
    client: 'Relay Apps',
    due: 'Tomorrow',
    badge: { label: 'High', variant: 'danger' },
    status: { label: 'In progress', variant: 'info' },
  },
  {
    id: 't2',
    title: 'Send sprint recap and loom walkthrough',
    client: 'Patchwork Foods',
    due: 'Jun 8',
    badge: { label: 'Medium', variant: 'warning' },
    status: { label: 'Pending', variant: 'neutral' },
  },
  {
    id: 't3',
    title: 'Review revised scope for Phase 2',
    client: 'Harbor & Co.',
    due: 'Jun 9',
    badge: { label: 'Medium', variant: 'warning' },
    status: { label: 'In progress', variant: 'info' },
  },
  {
    id: 't4',
    title: 'Export production assets for launch',
    client: 'Vaultline Security',
    due: 'Jun 10',
    badge: { label: 'Low', variant: 'neutral' },
    status: { label: 'Pending', variant: 'neutral' },
  },
  {
    id: 't5',
    title: 'Book content walkthrough with marketing',
    client: 'Kite & Anchor',
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

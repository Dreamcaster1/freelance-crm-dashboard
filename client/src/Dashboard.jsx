import { useCallback, useEffect, useMemo, useState } from 'react'
import * as clientsApi from './api/clients.js'
import * as tasksApi from './api/tasks.js'
import { ApiError } from './api/client.js'
import Badge from './Badge'
import {
  IconActivity,
  IconBriefcase,
  IconCalendar,
  IconCheck,
  IconCheckSquare,
  IconUsers,
} from './icons'
import { getTaskPriorityBadge, getTaskStatusBadge } from './utils/badges'
import {
  formatDueDate,
  formatGBP,
  formatRelativeActivity,
  futureDateInt,
  parseDateOnlyInt,
  todayDateInt,
} from './utils/format'

// ── Pure computation helpers ───────────────────────────────────────────────

function computeStats(clients, tasks) {
  const today = todayDateInt()
  const future7 = futureDateInt(7)
  const openTasks = tasks.filter((t) => t.status !== 'completed')

  let overdueCount = 0
  let dueSoonCount = 0

  for (const t of openTasks) {
    const d = parseDateOnlyInt(t.dueDate)
    if (d === null) continue
    if (d < today) overdueCount++
    else if (d <= future7) dueSoonCount++
  }

  const activeClients = clients.filter((c) => c.status === 'active').length
  const totalCents = clients.reduce((acc, c) => {
    const v = c.projectValueCents
    return acc + (Number.isFinite(v) && v > 0 ? v : 0)
  }, 0)
  const valuableClients = clients.filter(
    (c) => Number.isFinite(c.projectValueCents) && c.projectValueCents > 0,
  ).length

  return {
    activeClients,
    totalClients: clients.length,
    openTasksCount: openTasks.length,
    overdueCount,
    dueSoonCount,
    totalCents,
    valuableClients,
  }
}

function buildStatCards(stats) {
  const {
    activeClients,
    totalClients,
    openTasksCount,
    overdueCount,
    dueSoonCount,
    totalCents,
    valuableClients,
  } = stats

  const openDetail =
    overdueCount > 0
      ? `${overdueCount} overdue`
      : openTasksCount === 0
        ? 'No open tasks'
        : 'All up to date'

  const valueDetail =
    valuableClients === 0
      ? 'No project values set'
      : `Across ${valuableClients} client${valuableClients === 1 ? '' : 's'}`

  return [
    {
      label: 'Active clients',
      value: String(activeClients),
      detail:
        totalClients === 0
          ? 'No clients yet'
          : `${activeClients} of ${totalClients} total`,
      icon: IconUsers,
      tone: 'accent',
    },
    {
      label: 'Open tasks',
      value: String(openTasksCount),
      detail: openDetail,
      icon: IconCheckSquare,
      tone: 'default',
    },
    {
      label: 'Total project value',
      value: formatGBP(totalCents),
      detail: valueDetail,
      icon: IconBriefcase,
      tone: 'success',
    },
    {
      label: 'Due soon',
      value: String(dueSoonCount),
      detail:
        overdueCount > 0 ? `${overdueCount} overdue` : 'Due within 7 days',
      icon: IconCalendar,
      tone: 'default',
    },
  ]
}

function computeUpcoming(tasks) {
  return tasks
    .filter((t) => t.status !== 'completed')
    .slice()
    .sort((a, b) => {
      if (!a.dueDate && !b.dueDate) return 0
      if (!a.dueDate) return 1
      if (!b.dueDate) return -1
      return a.dueDate < b.dueDate ? -1 : a.dueDate > b.dueDate ? 1 : 0
    })
    .slice(0, 5)
}

const UPDATE_THRESHOLD_MS = 2 * 60 * 1000

function computeUpdates(clients, tasks) {
  const items = []

  for (const c of clients) {
    const createdMs = new Date(c.createdAt).getTime()
    const updatedMs = new Date(c.updatedAt).getTime()
    const isUpdated =
      Number.isFinite(createdMs) &&
      Number.isFinite(updatedMs) &&
      updatedMs - createdMs > UPDATE_THRESHOLD_MS

    items.push({
      key: `c-${c.id}`,
      kind: 'client',
      label: isUpdated ? 'Client updated' : 'Client added',
      name: c.company,
      sub: null,
      ts: c.updatedAt,
    })
  }

  for (const t of tasks) {
    const createdMs = new Date(t.createdAt).getTime()
    const updatedMs = new Date(t.updatedAt).getTime()
    const isUpdated =
      Number.isFinite(createdMs) &&
      Number.isFinite(updatedMs) &&
      updatedMs - createdMs > UPDATE_THRESHOLD_MS

    items.push({
      key: `t-${t.id}`,
      kind: 'task',
      label: isUpdated ? 'Task updated' : 'Task added',
      name: t.name,
      sub: t.clientNameSnapshot ?? null,
      ts: t.updatedAt,
    })
  }

  items.sort((a, b) => {
    const aMs = new Date(a.ts).getTime()
    const bMs = new Date(b.ts).getTime()
    if (!Number.isFinite(aMs) && !Number.isFinite(bMs)) return 0
    if (!Number.isFinite(aMs)) return 1
    if (!Number.isFinite(bMs)) return -1
    return bMs - aMs
  })

  return items.slice(0, 5)
}

function getUpdateBadge(label) {
  return label.includes('updated')
    ? { label, variant: 'info' }
    : { label, variant: 'neutral' }
}

// ── Skeleton ───────────────────────────────────────────────────────────────

function DashboardSkeleton() {
  return (
    <div className="dashboard" aria-busy="true" aria-label="Loading overview">
      <section className="dashboard-stats">
        {[0, 1, 2, 3].map((i) => (
          <article key={i} className="dashboard-stat">
            <div className="dashboard-stat__top">
              <span className="dashboard-skeleton dashboard-skeleton--stat-label" />
            </div>
            <span className="dashboard-skeleton dashboard-skeleton--stat-value" />
            <span className="dashboard-skeleton dashboard-skeleton--stat-detail" />
          </article>
        ))}
      </section>

      <section className="dashboard-panels">
        {[0, 1].map((i) => (
          <article key={i} className="dashboard-panel">
            <header className="dashboard-panel__header">
              <span className="dashboard-skeleton dashboard-skeleton--panel-title" />
            </header>
            {[0, 1, 2, 3].map((j) => (
              <span key={j} className="dashboard-skeleton dashboard-skeleton--panel-row" />
            ))}
          </article>
        ))}
      </section>
    </div>
  )
}

// ── Panels ────────────────────────────────────────────────────────────────

function RecentUpdatesPanel({ updates, onNavigate }) {
  return (
    <article className="dashboard-panel">
      <header className="dashboard-panel__header">
        <div className="dashboard-panel__title-group">
          <span className="dashboard-panel__icon">
            <IconActivity />
          </span>
          <div>
            <h2 className="dashboard-panel__title">Recent updates</h2>
            <p className="dashboard-panel__subtitle">
              Recent changes to clients and tasks
            </p>
          </div>
        </div>
        <span className="dashboard-panel__meta">
          {updates.length > 0 ? `${updates.length} records` : ''}
        </span>
      </header>

      {updates.length === 0 ? (
        <div className="dashboard-panel__empty">
          <p className="dashboard-panel__empty-title">No activity yet</p>
          <p className="dashboard-panel__empty-hint">
            Add your first client or task to get started.
          </p>
          {onNavigate ? (
            <button
              type="button"
              className="btn btn--secondary btn--sm"
              onClick={() => onNavigate('clients')}
            >
              Add client
            </button>
          ) : null}
        </div>
      ) : (
        <ul className="activity-list">
          {updates.map((item) => (
            <li key={item.key} className="activity-item">
              <span className="activity-item__icon">
                {item.kind === 'client' ? <IconUsers /> : <IconCheck />}
              </span>
              <div className="activity-item__body">
                <span className="activity-item__title">{item.name}</span>
                {item.sub ? (
                  <span className="activity-item__client">{item.sub}</span>
                ) : null}
              </div>
              <div className="activity-item__aside">
                <Badge {...getUpdateBadge(item.label)} />
                <time className="activity-item__time">
                  {formatRelativeActivity(item.ts)}
                </time>
              </div>
            </li>
          ))}
        </ul>
      )}
    </article>
  )
}

function UpcomingTasksPanel({ upcoming, onNavigate }) {
  return (
    <article className="dashboard-panel">
      <header className="dashboard-panel__header">
        <div className="dashboard-panel__title-group">
          <span className="dashboard-panel__icon">
            <IconCalendar />
          </span>
          <div>
            <h2 className="dashboard-panel__title">Upcoming tasks</h2>
            <p className="dashboard-panel__subtitle">
              Incomplete tasks sorted by due date
            </p>
          </div>
        </div>
        <span className="dashboard-panel__meta">
          {upcoming.length > 0 ? `${upcoming.length} showing` : ''}
        </span>
      </header>

      {upcoming.length === 0 ? (
        <div className="dashboard-panel__empty">
          <p className="dashboard-panel__empty-title">No upcoming tasks</p>
          <p className="dashboard-panel__empty-hint">
            Create a task to start planning your workload.
          </p>
          {onNavigate ? (
            <button
              type="button"
              className="btn btn--secondary btn--sm"
              onClick={() => onNavigate('tasks')}
            >
              Create task
            </button>
          ) : null}
        </div>
      ) : (
        <ul className="task-list">
          {upcoming.map((task) => (
            <li key={task.id} className="task-item">
              <span className="task-item__check" aria-hidden="true" />
              <div className="task-item__body">
                <span className="task-item__title">{task.name}</span>
                <span className="task-item__client">
                  {task.clientNameSnapshot ?? 'Unassigned'}
                </span>
              </div>
              <div className="task-item__aside">
                <div className="task-item__badges">
                  <Badge {...getTaskStatusBadge(task.status)} />
                  <Badge {...getTaskPriorityBadge(task.priority)} />
                </div>
                <span className="task-item__due">
                  {task.dueDate ? formatDueDate(task.dueDate) : '—'}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </article>
  )
}

// ── Main component ─────────────────────────────────────────────────────────

export default function Dashboard({ onNavigate }) {
  const [loadStatus, setLoadStatus] = useState('loading')
  const [loadError, setLoadError] = useState(null)
  const [clients, setClients] = useState([])
  const [tasks, setTasks] = useState([])

  const fetchData = useCallback(async () => {
    setLoadStatus('loading')
    setLoadError(null)

    try {
      const [clientsData, tasksData] = await Promise.all([
        clientsApi.listClients(),
        tasksApi.listTasks(),
      ])

      setClients(clientsData.clients)
      setTasks(tasksData.tasks)
      setLoadStatus('ready')
    } catch (err) {
      setLoadStatus('error')
      setLoadError(
        err instanceof ApiError
          ? err.message
          : 'Unable to load dashboard data. Try again.',
      )
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const stats = useMemo(() => computeStats(clients, tasks), [clients, tasks])
  const statCards = useMemo(() => buildStatCards(stats), [stats])
  const upcoming = useMemo(() => computeUpcoming(tasks), [tasks])
  const updates = useMemo(
    () => computeUpdates(clients, tasks),
    [clients, tasks],
  )

  if (loadStatus === 'loading') {
    return <DashboardSkeleton />
  }

  if (loadStatus === 'error') {
    return (
      <div className="dashboard-error">
        <p className="dashboard-error__message">{loadError}</p>
        <button type="button" className="btn btn--secondary" onClick={fetchData}>
          Try again
        </button>
      </div>
    )
  }

  return (
    <div className="dashboard">
      <section className="dashboard-stats" aria-label="Summary">
        {statCards.map((card) => {
          const Icon = card.icon
          return (
            <article
              key={card.label}
              className={`dashboard-stat dashboard-stat--${card.tone}`}
            >
              <div className="dashboard-stat__top">
                <span className="dashboard-stat__label">{card.label}</span>
                <span className="dashboard-stat__icon">
                  <Icon />
                </span>
              </div>
              <span className="dashboard-stat__value">{card.value}</span>
              <span className="dashboard-stat__detail">{card.detail}</span>
            </article>
          )
        })}
      </section>

      <section className="dashboard-panels" aria-label="Overview">
        <RecentUpdatesPanel updates={updates} onNavigate={onNavigate} />
        <UpcomingTasksPanel upcoming={upcoming} onNavigate={onNavigate} />
      </section>
    </div>
  )
}

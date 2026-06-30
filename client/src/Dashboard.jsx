import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import * as activityApi from './api/activity.js'
import * as clientsApi from './api/clients.js'
import * as tasksApi from './api/tasks.js'
import { ApiError } from './api/client.js'
import Badge from './Badge'
import {
  ActivityIcon,
  IconActivity,
  IconBriefcase,
  IconCalendar,
  IconCheckSquare,
  IconUsers,
} from './icons'
import {
  getTaskPriorityBadge,
  getTaskStatusBadge,
  PIPELINE_STAGE_OPTIONS,
  PIPELINE_STAGE_VALUES,
  TASK_STATUS_OPTIONS,
} from './utils/badges'
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

function toEventLabel(eventType) {
  if (!eventType) return 'Event'

  const [, action = eventType] = eventType.split('.')
  return action
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function getActivityBadge(eventType) {
  if (!eventType) {
    return { label: 'Event', variant: 'neutral' }
  }

  if (eventType.includes('deleted')) {
    return { label: toEventLabel(eventType), variant: 'danger' }
  }

  if (
    eventType.includes('paid') ||
    eventType.includes('completed') ||
    eventType.includes('sent')
  ) {
    return { label: toEventLabel(eventType), variant: 'success' }
  }

  if (eventType.includes('updated') || eventType.includes('changed')) {
    return { label: toEventLabel(eventType), variant: 'info' }
  }

  return { label: toEventLabel(eventType), variant: 'neutral' }
}

function toActivityIconType(entityType) {
  if (entityType === 'invoice') return 'invoice'
  if (entityType === 'task') return 'task'
  if (entityType === 'client_note') return 'message'
  if (entityType === 'client') return 'project'
  return 'project'
}

function getActivitySubtitle(item) {
  if (item.description) {
    return item.description
  }

  const entityLabel = item.entityType
    ? item.entityType.replace('_', ' ')
    : 'workspace'

  if (item.entityId != null) {
    return `${entityLabel} #${item.entityId}`
  }

  return entityLabel
}

const TASK_STATUS_INSIGHT_ORDER = [
  { value: 'pending', label: 'Pending' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
]

const VALID_TASK_STATUSES = new Set(
  TASK_STATUS_OPTIONS.map((option) => option.value),
)

const MIN_NONZERO_BAR_PERCENT = 2

const PIPELINE_STAGE_BAR_ACCENT = {
  lead: 'stage-lead',
  proposal: 'stage-proposal',
  active: 'stage-active',
  'awaiting-payment': 'stage-awaiting-payment',
  completed: 'stage-completed',
}

const TASK_STATUS_BAR_ACCENT = {
  pending: 'task-pending',
  'in-progress': 'task-in-progress',
  completed: 'task-completed',
}

const VALUE_MAGNITUDE_BAR_ACCENT = 'value-magnitude'

function normalizeProjectValueCents(value) {
  return Number.isFinite(value) && value >= 0 ? value : 0
}

function computeBarSharePercent(value, total) {
  if (!total || value <= 0) return 0

  const percent = (value / total) * 100
  if (percent > 0 && percent < MIN_NONZERO_BAR_PERCENT) {
    return MIN_NONZERO_BAR_PERCENT
  }

  return percent
}

function formatPercentOfTotal(percent) {
  if (percent <= 0) return ''
  if (percent >= 10) return `${Math.round(percent)}% of total`
  return `${percent.toFixed(1)}% of total`
}

function computePipelineClientCounts(clients) {
  const counts = Object.fromEntries(
    PIPELINE_STAGE_OPTIONS.map((option) => [option.value, 0]),
  )
  let unassigned = 0

  for (const client of clients) {
    const stage = client.pipelineStage
    if (PIPELINE_STAGE_VALUES.includes(stage)) {
      counts[stage] += 1
    } else {
      unassigned += 1
    }
  }

  const rows = PIPELINE_STAGE_OPTIONS.map((option) => ({
    key: option.value,
    label: option.label,
    rawValue: counts[option.value],
    displayValue: String(counts[option.value]),
    accent: PIPELINE_STAGE_BAR_ACCENT[option.value] ?? 'neutral',
  }))

  if (unassigned > 0) {
    rows.push({
      key: 'unassigned',
      label: 'Unassigned',
      rawValue: unassigned,
      displayValue: String(unassigned),
      accent: 'neutral',
    })
  }

  const totalCount = rows.reduce((sum, row) => sum + row.rawValue, 0)

  return {
    rows: rows.map((row) => {
      const percentShare =
        totalCount > 0 ? (row.rawValue / totalCount) * 100 : 0

      return {
        ...row,
        barScale: computeBarSharePercent(row.rawValue, totalCount),
        percentShare,
      }
    }),
    emptyMessage: totalCount === 0 ? 'No clients yet.' : null,
    ariaSummary:
      totalCount === 0
        ? 'Clients by pipeline stage. No clients yet.'
        : `Clients by pipeline stage. ${totalCount} clients across ${rows.filter((row) => row.rawValue > 0).length} stages.`,
  }
}

function computeTaskStatusCounts(tasks) {
  const counts = Object.fromEntries(
    TASK_STATUS_INSIGHT_ORDER.map((option) => [option.value, 0]),
  )
  let unknown = 0

  for (const task of tasks) {
    const status = task.status
    if (VALID_TASK_STATUSES.has(status)) {
      counts[status] += 1
    } else {
      unknown += 1
    }
  }

  const rows = TASK_STATUS_INSIGHT_ORDER.map((option) => ({
    key: option.value,
    label: option.label,
    rawValue: counts[option.value],
    displayValue: String(counts[option.value]),
    accent: TASK_STATUS_BAR_ACCENT[option.value] ?? 'neutral',
  }))

  if (unknown > 0) {
    rows.push({
      key: 'unknown',
      label: 'Unknown',
      rawValue: unknown,
      displayValue: String(unknown),
      accent: 'neutral',
    })
  }

  const totalCount = rows.reduce((sum, row) => sum + row.rawValue, 0)

  return {
    rows: rows.map((row) => {
      const percentShare =
        totalCount > 0 ? (row.rawValue / totalCount) * 100 : 0

      return {
        ...row,
        barScale: computeBarSharePercent(row.rawValue, totalCount),
        percentShare,
      }
    }),
    emptyMessage: totalCount === 0 ? 'No tasks yet.' : null,
    ariaSummary:
      totalCount === 0
        ? 'Tasks by status. No tasks yet.'
        : `Tasks by status. ${totalCount} tasks across pending, in progress, and completed.`,
  }
}

function computePipelineValueTotals(clients) {
  const totals = Object.fromEntries(
    PIPELINE_STAGE_OPTIONS.map((option) => [option.value, 0]),
  )
  let unassignedCents = 0

  for (const client of clients) {
    const cents = normalizeProjectValueCents(client.projectValueCents)
    const stage = client.pipelineStage
    if (PIPELINE_STAGE_VALUES.includes(stage)) {
      totals[stage] += cents
    } else {
      unassignedCents += cents
    }
  }

  const rows = PIPELINE_STAGE_OPTIONS.map((option) => ({
    key: option.value,
    label: option.label,
    rawValue: totals[option.value],
    displayValue: formatGBP(totals[option.value]),
    accent: VALUE_MAGNITUDE_BAR_ACCENT,
  }))

  if (unassignedCents > 0) {
    rows.push({
      key: 'unassigned',
      label: 'Unassigned',
      rawValue: unassignedCents,
      displayValue: formatGBP(unassignedCents),
      accent: VALUE_MAGNITUDE_BAR_ACCENT,
    })
  }

  const totalCents = rows.reduce((sum, row) => sum + row.rawValue, 0)

  return {
    rows: rows.map((row) => {
      const percentShare =
        totalCents > 0 ? (row.rawValue / totalCents) * 100 : 0

      return {
        ...row,
        barScale: computeBarSharePercent(row.rawValue, totalCents),
        percentShare,
      }
    }),
    emptyMessage: totalCents === 0 ? 'No project values set.' : null,
    ariaSummary:
      totalCents === 0
        ? 'Project value by pipeline stage. No project values set.'
        : `Project value by pipeline stage. Total ${formatGBP(totalCents)}.`,
  }
}

function InsightBarRow({ label, displayValue, barScale, percentShare, accent }) {
  const shareLabel = formatPercentOfTotal(percentShare)
  const readable = shareLabel
    ? `${label}: ${displayValue}, ${shareLabel}`
    : `${label}: ${displayValue}`

  return (
    <div className="insight-bar-row">
      <div className="insight-bar-row__header">
        <span className="insight-bar-row__label">{label}</span>
        <span className="insight-bar-row__value">{displayValue}</span>
      </div>
      <div
        className="insight-bar-row__track"
        aria-hidden="true"
        title={shareLabel || undefined}
      >
        <span
          className={`insight-bar-row__fill insight-bar-row__fill--${accent}`}
          style={{ width: `${barScale}%` }}
        />
      </div>
      <span className="visually-hidden">{readable}</span>
    </div>
  )
}

function InsightCard({ title, ariaSummary, emptyMessage, rows }) {
  return (
    <article className="dashboard-insight" aria-label={ariaSummary}>
      <h3 className="dashboard-insight__title">{title}</h3>
      {emptyMessage ? (
        <p className="dashboard-insight__empty">{emptyMessage}</p>
      ) : (
        <div className="dashboard-insight__rows">
          {rows.map((row) => (
            <InsightBarRow
              key={row.key}
              label={row.label}
              displayValue={row.displayValue}
              barScale={row.barScale}
              percentShare={row.percentShare}
              accent={row.accent}
            />
          ))}
        </div>
      )}
    </article>
  )
}

function DashboardInsights({ clients, tasks }) {
  const pipelineClientCounts = useMemo(
    () => computePipelineClientCounts(clients),
    [clients],
  )
  const taskStatusCounts = useMemo(
    () => computeTaskStatusCounts(tasks),
    [tasks],
  )
  const pipelineValueTotals = useMemo(
    () => computePipelineValueTotals(clients),
    [clients],
  )

  return (
    <section className="dashboard-insights" aria-labelledby="dashboard-insights-heading">
      <h2 className="dashboard-insights__heading" id="dashboard-insights-heading">
        Business overview
      </h2>
      <div className="dashboard-insights__grid">
        <InsightCard
          title="Clients by pipeline stage"
          ariaSummary={pipelineClientCounts.ariaSummary}
          emptyMessage={pipelineClientCounts.emptyMessage}
          rows={pipelineClientCounts.rows}
        />
        <InsightCard
          title="Tasks by status"
          ariaSummary={taskStatusCounts.ariaSummary}
          emptyMessage={taskStatusCounts.emptyMessage}
          rows={taskStatusCounts.rows}
        />
        <InsightCard
          title="Project value by pipeline stage"
          ariaSummary={pipelineValueTotals.ariaSummary}
          emptyMessage={pipelineValueTotals.emptyMessage}
          rows={pipelineValueTotals.rows}
        />
      </div>
    </section>
  )
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

      <section className="dashboard-insights dashboard-insights--skeleton" aria-hidden="true">
        <span className="dashboard-skeleton dashboard-skeleton--insight-heading" />
        <div className="dashboard-insights__grid">
          {[0, 1, 2].map((i) => (
            <article key={i} className="dashboard-insight">
              <span className="dashboard-skeleton dashboard-skeleton--insight-title" />
              {[0, 1, 2, 3].map((j) => (
                <span key={j} className="dashboard-skeleton dashboard-skeleton--insight-row" />
              ))}
            </article>
          ))}
        </div>
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

function RecentUpdatesPanel({ updates, loadStatus, loadError, onRetry }) {
  const navigate = useNavigate()

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
              Recent workspace activity
            </p>
          </div>
        </div>
        <span className="dashboard-panel__meta">
          {loadStatus === 'ready' && updates.length > 0 ? `${updates.length} records` : ''}
        </span>
      </header>

      {loadStatus === 'loading' ? (
        <div className="dashboard-panel__empty">
          <p className="dashboard-panel__empty-title">Loading activity…</p>
        </div>
      ) : null}

      {loadStatus === 'error' ? (
        <div className="dashboard-panel__empty">
          <p className="dashboard-panel__empty-title" role="alert">
            {loadError}
          </p>
          <button
            type="button"
            className="btn btn--secondary btn--sm"
            onClick={onRetry}
          >
            Retry
          </button>
        </div>
      ) : null}

      {loadStatus === 'ready' && updates.length === 0 ? (
        <div className="dashboard-panel__empty">
          <p className="dashboard-panel__empty-title">No activity yet</p>
          <p className="dashboard-panel__empty-hint">
            Create or update a client, task, note, or invoice to populate this feed.
          </p>
          <button
            type="button"
            className="btn btn--secondary btn--sm"
            onClick={() => navigate('/clients')}
          >
            Add client
          </button>
        </div>
      ) : null}

      {loadStatus === 'ready' && updates.length > 0 ? (
        <ul className="activity-list">
          {updates.map((item) => (
            <li key={item.id} className="activity-item">
              <span className={`activity-item__icon activity-item__icon--${toActivityIconType(item.entityType)}`}>
                <ActivityIcon type={toActivityIconType(item.entityType)} />
              </span>
              <div className="activity-item__body">
                <span className="activity-item__title">{item.title}</span>
                <span className="activity-item__client">{getActivitySubtitle(item)}</span>
              </div>
              <div className="activity-item__aside">
                <Badge {...getActivityBadge(item.eventType)} />
                <time className="activity-item__time">
                  {formatRelativeActivity(item.createdAt)}
                </time>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </article>
  )
}

function UpcomingTasksPanel({ upcoming }) {
  const navigate = useNavigate()

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
          <button
            type="button"
            className="btn btn--secondary btn--sm"
            onClick={() => navigate('/tasks')}
          >
            Create task
          </button>
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

function getDashboardLoadError(err) {
  return err instanceof ApiError
    ? err.message
    : 'Unable to load dashboard data. Try again.'
}

function getActivityLoadError(err) {
  return err instanceof ApiError
    ? err.message
    : 'Unable to load activity feed. Try again.'
}

async function requestDashboardData() {
  const [clientsData, tasksData] = await Promise.all([
    clientsApi.listClients(),
    tasksApi.listTasks(),
  ])

  return {
    clients: clientsData.clients,
    tasks: tasksData.tasks,
  }
}

async function requestRecentActivity() {
  const data = await activityApi.listRecentActivity(10)
  return data.events ?? []
}

export default function Dashboard() {
  const [loadStatus, setLoadStatus] = useState('loading')
  const [loadError, setLoadError] = useState(null)
  const [clients, setClients] = useState([])
  const [tasks, setTasks] = useState([])
  const [activityStatus, setActivityStatus] = useState('loading')
  const [activityError, setActivityError] = useState(null)
  const [activityEvents, setActivityEvents] = useState([])

  const fetchData = useCallback(async () => {
    setLoadStatus('loading')
    setLoadError(null)

    try {
      const { clients: nextClients, tasks: nextTasks } = await requestDashboardData()
      setClients(nextClients)
      setTasks(nextTasks)
      setLoadStatus('ready')
    } catch (err) {
      setLoadStatus('error')
      setLoadError(getDashboardLoadError(err))
    }
  }, [])

  const fetchActivity = useCallback(async () => {
    setActivityStatus('loading')
    setActivityError(null)

    try {
      const events = await requestRecentActivity()
      setActivityEvents(events)
      setActivityStatus('ready')
    } catch (err) {
      setActivityEvents([])
      setActivityStatus('error')
      setActivityError(getActivityLoadError(err))
    }
  }, [])

  const handleRetryAll = useCallback(() => {
    void fetchData()
    void fetchActivity()
  }, [fetchData, fetchActivity])

  useEffect(() => {
    let cancelled = false
    let activityCancelled = false

    requestDashboardData()
      .then(({ clients: nextClients, tasks: nextTasks }) => {
        if (cancelled) return
        setClients(nextClients)
        setTasks(nextTasks)
        setLoadStatus('ready')
      })
      .catch((err) => {
        if (cancelled) return
        setLoadStatus('error')
        setLoadError(getDashboardLoadError(err))
      })

    requestRecentActivity()
      .then((events) => {
        if (activityCancelled) return
        setActivityEvents(events)
        setActivityStatus('ready')
      })
      .catch((err) => {
        if (activityCancelled) return
        setActivityEvents([])
        setActivityStatus('error')
        setActivityError(getActivityLoadError(err))
      })

    return () => {
      cancelled = true
      activityCancelled = true
    }
  }, [])

  const stats = useMemo(() => computeStats(clients, tasks), [clients, tasks])
  const statCards = useMemo(() => buildStatCards(stats), [stats])
  const upcoming = useMemo(() => computeUpcoming(tasks), [tasks])

  if (loadStatus === 'loading') {
    return <DashboardSkeleton />
  }

  if (loadStatus === 'error') {
    return (
      <div className="dashboard-error">
        <p className="dashboard-error__message">{loadError}</p>
        <button type="button" className="btn btn--secondary" onClick={handleRetryAll}>
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

      <DashboardInsights clients={clients} tasks={tasks} />

      <section className="dashboard-panels" aria-label="Overview">
        <RecentUpdatesPanel
          updates={activityEvents}
          loadStatus={activityStatus}
          loadError={activityError}
          onRetry={fetchActivity}
        />
        <UpcomingTasksPanel upcoming={upcoming} />
      </section>
    </div>
  )
}

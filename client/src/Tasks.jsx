import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import AddTaskModal from './AddTaskModal'
import * as clientsApi from './api/clients.js'
import * as tasksApi from './api/tasks.js'
import { ApiError } from './api/client.js'
import useConfirmDeleteState from './hooks/useConfirmDeleteState'
import useEditModalState from './hooks/useEditModalState'
import useSelectionState from './hooks/useSelectionState'
import Badge from './Badge'
import ConfirmModal from './ConfirmModal'
import TaskDetailDrawer from './TaskDetailDrawer'
import { IconPlus, IconSearch } from './icons'
import {
  SelectableTableRow,
  TableActions,
  TableCard,
  TableEmptyState,
} from './tables/tablePrimitives'
import {
  mapTaskFormToApiPayload,
  mapTaskFromApi,
  mapTasksFromApi,
} from './utils/taskMapper'
import {
  getTaskPriorityBadge,
  getTaskStatusBadge,
  TASK_PRIORITY_OPTIONS,
  TASK_STATUS_OPTIONS,
} from './utils/badges'
import {
  futureDateInt,
  parseDateOnlyInt,
  todayDateInt,
} from './utils/format'

const TASK_SORT_OPTIONS = [
  { value: 'due-date', label: 'Due date' },
  { value: 'recently-updated', label: 'Recently updated' },
  { value: 'alphabetical', label: 'Alphabetical A–Z' },
]

const TASK_DUE_FILTER_OPTIONS = [
  { value: 'all', label: 'All due dates' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'due-soon', label: 'Due soon' },
  { value: 'future', label: 'Future' },
  { value: 'no-due-date', label: 'No due date' },
]

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'in-progress', label: 'In Progress' },
  { id: 'pending', label: 'Pending' },
  { id: 'completed', label: 'Completed' },
]

const TASK_BOARD_COLUMNS = [
  { value: 'pending', label: 'Pending', emptyMessage: 'No pending tasks' },
  {
    value: 'in-progress',
    label: 'In progress',
    emptyMessage: 'No in-progress tasks',
  },
  { value: 'completed', label: 'Completed', emptyMessage: 'No completed tasks' },
]

const VALID_TASK_STATUSES = new Set(
  TASK_BOARD_COLUMNS.map((column) => column.value),
)

function parseTimestamp(value) {
  if (!value) return null
  const time = new Date(value).getTime()
  return Number.isNaN(time) ? null : time
}

function compareIdsDesc(a, b) {
  const idA = Number(a.id)
  const idB = Number(b.id)
  if (Number.isFinite(idA) && Number.isFinite(idB)) return idB - idA
  return 0
}

function getDisplayStatus(task) {
  return VALID_TASK_STATUSES.has(task.status) ? task.status : 'pending'
}

function isIncompleteTask(task) {
  return getDisplayStatus(task) !== 'completed'
}

function getTaskDueDateInt(task) {
  return parseDateOnlyInt(task.dueDateRaw)
}

function matchesTaskDueFilter(task, dueFilter) {
  if (dueFilter === 'all') return true

  if (!isIncompleteTask(task)) return false

  const dueInt = getTaskDueDateInt(task)

  if (dueFilter === 'no-due-date') {
    return dueInt == null
  }

  if (dueInt == null) return false

  const today = todayDateInt()
  const dueSoonEnd = futureDateInt(7)

  if (dueFilter === 'overdue') {
    return dueInt < today
  }

  if (dueFilter === 'due-soon') {
    return dueInt >= today && dueInt <= dueSoonEnd
  }

  if (dueFilter === 'future') {
    return dueInt > dueSoonEnd
  }

  return true
}

function filterTasksBySearch(tasks, query) {
  const normalized = query.trim().toLowerCase()
  if (!normalized) return tasks

  return tasks.filter((task) => {
    const clientLabel =
      task.client === '—' ? 'unassigned' : task.client.toLowerCase()
    const description = (task.description ?? '').toLowerCase()

    return (
      task.name.toLowerCase().includes(normalized) ||
      clientLabel.includes(normalized) ||
      description.includes(normalized)
    )
  })
}

function sortTasks(tasks, sortKey) {
  const sorted = [...tasks]

  if (sortKey === 'alphabetical') {
    sorted.sort((a, b) => {
      const byName = a.name.localeCompare(b.name)
      if (byName !== 0) return byName
      const byClient = a.client.localeCompare(b.client)
      if (byClient !== 0) return byClient
      return compareIdsDesc(a, b)
    })
    return sorted
  }

  if (sortKey === 'recently-updated') {
    sorted.sort((a, b) => {
      const timeA = parseTimestamp(a.updatedAt)
      const timeB = parseTimestamp(b.updatedAt)
      if (timeA == null && timeB == null) return compareIdsDesc(a, b)
      if (timeA == null) return 1
      if (timeB == null) return -1
      if (timeB !== timeA) return timeB - timeA
      return compareIdsDesc(a, b)
    })
    return sorted
  }

  sorted.sort((a, b) => {
    const dueA = getTaskDueDateInt(a)
    const dueB = getTaskDueDateInt(b)
    if (dueA == null && dueB == null) {
      const timeA = parseTimestamp(a.updatedAt)
      const timeB = parseTimestamp(b.updatedAt)
      if (timeA == null && timeB == null) return compareIdsDesc(a, b)
      if (timeA == null) return 1
      if (timeB == null) return -1
      if (timeB !== timeA) return timeB - timeA
      return compareIdsDesc(a, b)
    }
    if (dueA == null) return 1
    if (dueB == null) return -1
    if (dueA !== dueB) return dueA - dueB
    const timeA = parseTimestamp(a.updatedAt)
    const timeB = parseTimestamp(b.updatedAt)
    if (timeA == null && timeB == null) return compareIdsDesc(a, b)
    if (timeA == null) return 1
    if (timeB == null) return -1
    if (timeB !== timeA) return timeB - timeA
    return compareIdsDesc(a, b)
  })

  return sorted
}

function applyTaskFilters(
  tasks,
  { query, statusFilter, priorityFilter, dueFilter, sortKey, applyStatusFilter },
) {
  let result = filterTasksBySearch(tasks, query)

  if (applyStatusFilter && statusFilter !== 'all') {
    result = result.filter((task) => task.status === statusFilter)
  }

  if (priorityFilter !== 'all') {
    result = result.filter((task) => task.priority === priorityFilter)
  }

  if (dueFilter !== 'all') {
    result = result.filter((task) => matchesTaskDueFilter(task, dueFilter))
  }

  return sortTasks(result, sortKey)
}

function getTasksLoadError(err) {
  return err instanceof ApiError
    ? err.message
    : 'Unable to load tasks. Try again.'
}

function getTaskMoveError(err) {
  return err instanceof ApiError
    ? err.message
    : 'Unable to update task status. Try again.'
}

function groupTasksByStatus(tasks) {
  const groups = Object.fromEntries(
    TASK_BOARD_COLUMNS.map((column) => [column.value, []]),
  )

  for (const task of tasks) {
    groups[getDisplayStatus(task)].push(task)
  }

  return groups
}

function getTaskClientLabel(task) {
  return task.client === '—' ? 'Unassigned' : task.client
}

function getDescriptionPreview(description, maxLength = 72) {
  const trimmed = description?.trim()
  if (!trimmed) return null
  if (trimmed.length <= maxLength) return trimmed
  return `${trimmed.slice(0, maxLength).trimEnd()}…`
}

async function requestTasksPageData() {
  const [tasksData, clientsData] = await Promise.all([
    tasksApi.listTasks(),
    clientsApi.listClients(),
  ])

  return {
    tasks: mapTasksFromApi(tasksData.tasks),
    clients: clientsData.clients.map((client) => ({
      id: client.id,
      company: client.company,
    })),
  }
}

function TaskBoardCard({
  task,
  isMoving,
  isDragging,
  desktopDragEnabled,
  onOpenTask,
  onEditTask,
  onDeleteTask,
  onDragStart,
  onDragEnd,
  onStatusChange,
}) {
  const displayStatus = getDisplayStatus(task)
  const selectId = `task-board-status-${task.id}`
  const canDrag = desktopDragEnabled && !isMoving
  const descriptionPreview = getDescriptionPreview(task.description)
  const isCompleted = displayStatus === 'completed'

  const cardClassName = [
    'task-board-card',
    canDrag ? 'task-board-card--draggable' : '',
    isDragging ? 'task-board-card--dragging' : '',
    isMoving ? 'task-board-card--moving' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <article
      className={cardClassName}
      draggable={canDrag}
      onDragStart={canDrag ? onDragStart : undefined}
      onDragEnd={canDrag ? onDragEnd : undefined}
      aria-grabbed={isDragging ? true : undefined}
    >
      <div
        className="task-board-card__body"
        role="button"
        tabIndex={0}
        title={
          canDrag
            ? 'Drag to another column, or use the status select below'
            : undefined
        }
        onClick={() => onOpenTask(task)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            onOpenTask(task)
          }
        }}
      >
        <h3
          className={`task-board-card__title${
            isCompleted ? ' task-board-card__title--completed' : ''
          }`}
        >
          {task.name}
        </h3>
        <p className="task-board-card__client">{getTaskClientLabel(task)}</p>
        <div className="task-board-card__meta">
          <Badge {...getTaskPriorityBadge(task.priority)} />
          <span className="task-board-card__due">{task.dueDate}</span>
        </div>
        {descriptionPreview ? (
          <p className="task-board-card__description">{descriptionPreview}</p>
        ) : null}
      </div>

      <footer
        className="task-board-card__footer"
        onDragStart={(event) => event.preventDefault()}
      >
        <label className="task-board-card__status-label" htmlFor={selectId}>
          Status
        </label>
        <select
          id={selectId}
          className="task-board-card__status-select"
          value={displayStatus}
          onChange={(event) => onStatusChange(task.id, event.target.value)}
          disabled={isMoving}
          draggable={false}
          aria-label={`Change status for ${task.name}`}
        >
          {TASK_STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <div className="task-board-card__actions">
          <button
            type="button"
            className="btn btn--secondary btn--sm"
            onClick={(event) => {
              event.stopPropagation()
              onEditTask(task)
            }}
            disabled={isMoving}
          >
            Edit
          </button>
          <button
            type="button"
            className="btn btn--danger btn--sm"
            onClick={(event) => {
              event.stopPropagation()
              onDeleteTask(task)
            }}
            disabled={isMoving}
          >
            Delete
          </button>
        </div>
      </footer>
    </article>
  )
}

function TaskBoardColumn({
  statusId,
  label,
  emptyMessage,
  tasks,
  movingTaskId,
  draggedTaskId,
  dragOverStatus,
  draggedTaskStatus,
  desktopDragEnabled,
  isDragActive,
  onOpenTask,
  onEditTask,
  onDeleteTask,
  onStatusChange,
  onCardDragStart,
  onCardDragEnd,
  onColumnDragEnter,
  onColumnDragOver,
  onColumnDragLeave,
  onColumnDrop,
}) {
  const isDropTarget =
    desktopDragEnabled &&
    draggedTaskId != null &&
    dragOverStatus === statusId &&
    draggedTaskStatus !== statusId
  const isCurrentStatusDrag =
    desktopDragEnabled &&
    draggedTaskId != null &&
    draggedTaskStatus === statusId

  const columnClassName = [
    'task-board-column',
    `task-board-column--${statusId}`,
    isDragActive ? 'task-board-column--drag-active' : '',
    isDropTarget ? 'task-board-column--drop-target' : '',
    isCurrentStatusDrag ? 'task-board-column--drop-current' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <section
      className={columnClassName}
      aria-label={`${label} tasks`}
      onDragEnter={
        desktopDragEnabled
          ? (event) => onColumnDragEnter(statusId, event)
          : undefined
      }
      onDragOver={
        desktopDragEnabled
          ? (event) => onColumnDragOver(statusId, event)
          : undefined
      }
      onDragLeave={
        desktopDragEnabled
          ? (event) => onColumnDragLeave(statusId, event)
          : undefined
      }
      onDrop={
        desktopDragEnabled
          ? (event) => onColumnDrop(statusId, event)
          : undefined
      }
    >
      <header className="task-board-column__header">
        <div className="task-board-column__title-group">
          <span className="task-board-column__marker" aria-hidden="true" />
          <h2 className="task-board-column__title">{label}</h2>
        </div>
        <span className="task-board-column__count">{tasks.length}</span>
      </header>

      <div className="task-board-column__body">
        {tasks.length > 0 ? (
          <ul className="task-board-column__list">
            {tasks.map((task) => (
              <li key={task.id}>
                <TaskBoardCard
                  task={task}
                  isMoving={movingTaskId === task.id}
                  isDragging={draggedTaskId === task.id}
                  desktopDragEnabled={desktopDragEnabled}
                  onOpenTask={onOpenTask}
                  onEditTask={onEditTask}
                  onDeleteTask={onDeleteTask}
                  onDragStart={(event) => onCardDragStart(task.id, event)}
                  onDragEnd={onCardDragEnd}
                  onStatusChange={onStatusChange}
                />
              </li>
            ))}
          </ul>
        ) : (
          <p className="task-board-column__empty">{emptyMessage}</p>
        )}
      </div>
    </section>
  )
}

const TASKS_BOARD_PATH = '/tasks/board'

export default function Tasks() {
  const location = useLocation()
  const navigate = useNavigate()
  const activeView = location.pathname === TASKS_BOARD_PATH ? 'board' : 'table'
  const [tasks, setTasks] = useState([])
  const [clients, setClients] = useState([])
  const [loadStatus, setLoadStatus] = useState('loading')
  const [loadError, setLoadError] = useState(null)
  const [activeFilter, setActiveFilter] = useState('all')
  const [query, setQuery] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [dueFilter, setDueFilter] = useState('all')
  const [sortKey, setSortKey] = useState('due-date')
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState(null)
  const [moveError, setMoveError] = useState(null)
  const [movingTaskId, setMovingTaskId] = useState(null)
  const [draggedTaskId, setDraggedTaskId] = useState(null)
  const [dragOverStatus, setDragOverStatus] = useState(null)
  const [desktopDragEnabled, setDesktopDragEnabled] = useState(false)
  const {
    isOpen: isModalOpen,
    editingItem: editingTask,
    openAdd: openAddModal,
    openEdit: openEditModal,
    close: closeModal,
  } = useEditModalState()
  const {
    deletingItem: deletingTask,
    openDelete: openDeleteModal,
    closeDelete: closeDeleteModal,
  } = useConfirmDeleteState()
  const {
    selectedItem: selectedTask,
    setSelectedItem: setSelectedTask,
    openSelection: openDrawer,
    closeSelection: closeDrawer,
  } = useSelectionState()
  const saveInFlightRef = useRef(false)
  const deleteInFlightRef = useRef(false)
  const moveInFlightRef = useRef(new Set())
  const columnDragDepthRef = useRef(new Map())

  const resetColumnDragDepths = useCallback(() => {
    columnDragDepthRef.current.clear()
  }, [])

  const fetchTasksPage = useCallback(async () => {
    setLoadStatus('loading')
    setLoadError(null)

    try {
      const { tasks: nextTasks, clients: nextClients } = await requestTasksPageData()
      setTasks(nextTasks)
      setClients(nextClients)
      setLoadStatus('ready')
    } catch (err) {
      setTasks([])
      setClients([])
      setLoadStatus('error')
      setLoadError(getTasksLoadError(err))
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    requestTasksPageData()
      .then(({ tasks: nextTasks, clients: nextClients }) => {
        if (cancelled) return
        setTasks(nextTasks)
        setClients(nextClients)
        setLoadStatus('ready')
      })
      .catch((err) => {
        if (cancelled) return
        setTasks([])
        setClients([])
        setLoadStatus('error')
        setLoadError(getTasksLoadError(err))
      })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const mediaQuery = window.matchMedia('(hover: hover) and (pointer: fine)')
    const syncDesktopDrag = () => setDesktopDragEnabled(mediaQuery.matches)

    syncDesktopDrag()
    mediaQuery.addEventListener('change', syncDesktopDrag)
    return () => mediaQuery.removeEventListener('change', syncDesktopDrag)
  }, [])

  const filteredTasks = useMemo(
    () =>
      applyTaskFilters(tasks, {
        query,
        statusFilter: activeFilter,
        priorityFilter,
        dueFilter,
        sortKey,
        applyStatusFilter: activeView === 'table',
      }),
    [tasks, query, activeFilter, priorityFilter, dueFilter, sortKey, activeView],
  )

  const filterCounts = useMemo(() => {
    return {
      all: tasks.length,
      'in-progress': tasks.filter((task) => task.status === 'in-progress').length,
      pending: tasks.filter((task) => task.status === 'pending').length,
      completed: tasks.filter((task) => task.status === 'completed').length,
    }
  }, [tasks])

  const groupedBoardTasks = useMemo(
    () => groupTasksByStatus(filteredTasks),
    [filteredTasks],
  )

  const handleStatusChange = useCallback(
    async (taskId, nextStatus) => {
      if (moveInFlightRef.current.has(taskId)) return

      const previousTask = tasks.find((task) => task.id === taskId)
      if (!previousTask || getDisplayStatus(previousTask) === nextStatus) return

      moveInFlightRef.current.add(taskId)
      setMovingTaskId(taskId)
      setMoveError(null)

      const optimisticTask = { ...previousTask, status: nextStatus }

      setTasks((current) =>
        current.map((task) => (task.id === taskId ? optimisticTask : task)),
      )
      setSelectedTask((current) =>
        current?.id === taskId ? optimisticTask : current,
      )

      try {
        const data = await tasksApi.updateTask(taskId, { status: nextStatus })
        const savedTask = mapTaskFromApi(data.task)

        setTasks((current) =>
          current.map((task) => (task.id === taskId ? savedTask : task)),
        )
        setSelectedTask((current) =>
          current?.id === taskId ? savedTask : current,
        )
      } catch (err) {
        setTasks((current) =>
          current.map((task) => (task.id === taskId ? previousTask : task)),
        )
        setSelectedTask((current) =>
          current?.id === taskId ? previousTask : current,
        )
        setMoveError(getTaskMoveError(err))
      } finally {
        moveInFlightRef.current.delete(taskId)
        setMovingTaskId(null)
      }
    },
    [tasks, setSelectedTask],
  )

  const clearDragState = useCallback(() => {
    resetColumnDragDepths()
    setDraggedTaskId(null)
    setDragOverStatus(null)
  }, [resetColumnDragDepths])

  const draggedTask = useMemo(
    () =>
      draggedTaskId == null
        ? null
        : tasks.find((task) => task.id === draggedTaskId) ?? null,
    [tasks, draggedTaskId],
  )
  const draggedTaskStatus = draggedTask ? getDisplayStatus(draggedTask) : null

  const handleCardDragStart = useCallback(
    (taskId, event) => {
      if (
        event.target.closest(
          '.task-board-card__footer, select, button, label',
        )
      ) {
        event.preventDefault()
        return
      }

      if (moveInFlightRef.current.has(taskId)) {
        event.preventDefault()
        return
      }

      setDraggedTaskId(taskId)
      setDragOverStatus(null)
      resetColumnDragDepths()
      event.dataTransfer.effectAllowed = 'move'
      event.dataTransfer.setData('text/plain', String(taskId))
    },
    [resetColumnDragDepths],
  )

  const handleCardDragEnd = useCallback(() => {
    clearDragState()
  }, [clearDragState])

  const handleColumnDragEnter = useCallback(
    (statusId, event) => {
      if (draggedTaskId == null) return
      if (moveInFlightRef.current.has(draggedTaskId)) return

      const { currentTarget, relatedTarget } = event
      if (
        relatedTarget instanceof Node &&
        currentTarget.contains(relatedTarget)
      ) {
        return
      }

      const depths = columnDragDepthRef.current
      depths.set(statusId, (depths.get(statusId) ?? 0) + 1)
    },
    [draggedTaskId],
  )

  const handleColumnDragOver = useCallback(
    (statusId, event) => {
      if (draggedTaskId == null) return
      if (moveInFlightRef.current.has(draggedTaskId)) return

      if (draggedTaskStatus === statusId) {
        event.dataTransfer.dropEffect = 'none'
        setDragOverStatus(null)
        return
      }

      event.preventDefault()
      event.dataTransfer.dropEffect = 'move'
      setDragOverStatus(statusId)
    },
    [draggedTaskId, draggedTaskStatus],
  )

  const handleColumnDragLeave = useCallback((statusId, event) => {
    const { currentTarget, relatedTarget } = event
    if (
      relatedTarget instanceof Node &&
      currentTarget.contains(relatedTarget)
    ) {
      return
    }

    const depths = columnDragDepthRef.current
    const nextDepth = (depths.get(statusId) ?? 0) - 1

    if (nextDepth <= 0) {
      depths.delete(statusId)
      setDragOverStatus((current) => (current === statusId ? null : current))
      return
    }

    depths.set(statusId, nextDepth)
  }, [])

  const handleColumnDrop = useCallback(
    (statusId, event) => {
      event.preventDefault()

      const rawTaskId = draggedTaskId ?? event.dataTransfer.getData('text/plain')
      const taskId = Number(rawTaskId)
      const droppedTask = tasks.find((task) => task.id === taskId)
      const currentStatus = droppedTask ? getDisplayStatus(droppedTask) : null

      clearDragState()

      if (!Number.isFinite(taskId) || taskId <= 0) return
      if (moveInFlightRef.current.has(taskId)) return
      if (currentStatus === statusId) return

      handleStatusChange(taskId, statusId)
    },
    [clearDragState, tasks, draggedTaskId, handleStatusChange],
  )

  function handleOpenAddModal() {
    setSaveError(null)
    openAddModal()
  }

  function handleOpenEditModal(task) {
    setSaveError(null)
    openEditModal(task)
  }

  async function handleSaveTask(form) {
    if (saveInFlightRef.current) return
    saveInFlightRef.current = true
    setIsSaving(true)
    setSaveError(null)

    const payload = mapTaskFormToApiPayload(form)

    try {
      if (editingTask) {
        const data = await tasksApi.updateTask(editingTask.id, payload)
        const savedTask = mapTaskFromApi(data.task)

        setTasks((current) =>
          current.map((item) => (item.id === savedTask.id ? savedTask : item)),
        )
        setSelectedTask((current) =>
          current?.id === savedTask.id ? savedTask : current,
        )
      } else {
        const data = await tasksApi.createTask(payload)
        const savedTask = mapTaskFromApi(data.task)
        setTasks((current) => [savedTask, ...current])
      }

      closeModal()
    } catch (err) {
      setSaveError(
        err instanceof ApiError
          ? err.message
          : 'Unable to save task. Try again.',
      )
    } finally {
      saveInFlightRef.current = false
      setIsSaving(false)
    }
  }

  async function confirmDeleteTask() {
    if (!deletingTask) return
    if (deleteInFlightRef.current) return
    deleteInFlightRef.current = true
    setIsDeleting(true)
    setDeleteError(null)

    try {
      await tasksApi.deleteTask(deletingTask.id)

      setTasks((current) => current.filter((item) => item.id !== deletingTask.id))
      setSelectedTask((current) =>
        current?.id === deletingTask.id ? null : current,
      )
      closeDeleteModal()
    } catch (err) {
      setDeleteError(
        err instanceof ApiError
          ? err.message
          : 'Unable to delete task. Try again.',
      )
    } finally {
      deleteInFlightRef.current = false
      setIsDeleting(false)
    }
  }

  function handleCloseDeleteModal() {
    if (isDeleting) return
    setDeleteError(null)
    closeDeleteModal()
  }

  if (loadStatus === 'loading') {
    return (
      <div className="tasks tasks-state">
        <p className="tasks-state__message">Loading tasks…</p>
      </div>
    )
  }

  if (loadStatus === 'error') {
    return (
      <div className="tasks tasks-state">
        <p className="tasks-state__message tasks-state__message--error">
          {loadError}
        </p>
        <button type="button" className="btn btn--secondary" onClick={fetchTasksPage}>
          Try again
        </button>
      </div>
    )
  }

  const isDragActive = desktopDragEnabled && draggedTaskId != null

  return (
    <div className="tasks">
      <div className="tasks-toolbar">
        <div className="tasks-toolbar__start">
          {activeView === 'table' ? (
            <div className="tasks-filters" role="group" aria-label="Filter by status">
              {FILTERS.map((filter) => (
                <button
                  key={filter.id}
                  type="button"
                  className={`tasks-filter${activeFilter === filter.id ? ' tasks-filter--active' : ''}`}
                  onClick={() => setActiveFilter(filter.id)}
                  aria-pressed={activeFilter === filter.id}
                >
                  {filter.label}
                  <span className="tasks-filter__count">
                    {filterCounts[filter.id]}
                  </span>
                </button>
              ))}
            </div>
          ) : null}
          <div className="tasks-view-toggle" role="group" aria-label="Task view">
            <button
              type="button"
              className={`tasks-view-toggle__btn${
                activeView === 'table' ? ' tasks-view-toggle__btn--active' : ''
              }`}
              onClick={() => navigate('/tasks')}
              aria-pressed={activeView === 'table'}
            >
              Table
            </button>
            <button
              type="button"
              className={`tasks-view-toggle__btn${
                activeView === 'board' ? ' tasks-view-toggle__btn--active' : ''
              }`}
              onClick={() => navigate(TASKS_BOARD_PATH)}
              aria-pressed={activeView === 'board'}
            >
              Board
            </button>
          </div>
        </div>
        <button
          type="button"
          className="btn btn--primary"
          onClick={handleOpenAddModal}
        >
          <IconPlus />
          New Task
        </button>
      </div>

      <div className="tasks-controls list-controls">
        <label className="tasks-search list-controls__search">
          <IconSearch className="tasks-search__icon" />
          <input
            type="search"
            className="tasks-search__input"
            placeholder="Search by task, client, or description..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            aria-label="Search tasks"
          />
        </label>
        <div className="list-controls__selects">
          <label className="list-controls__field">
            <span className="list-controls__label">Priority</span>
            <select
              className="list-controls__select"
              value={priorityFilter}
              onChange={(event) => setPriorityFilter(event.target.value)}
              aria-label="Filter by priority"
            >
              <option value="all">All priorities</option>
              {[...TASK_PRIORITY_OPTIONS].reverse().map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="list-controls__field">
            <span className="list-controls__label">Due</span>
            <select
              className="list-controls__select"
              value={dueFilter}
              onChange={(event) => setDueFilter(event.target.value)}
              aria-label="Filter by due date"
            >
              {TASK_DUE_FILTER_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="list-controls__field">
            <span className="list-controls__label">Sort</span>
            <select
              className="list-controls__select"
              value={sortKey}
              onChange={(event) => setSortKey(event.target.value)}
              aria-label="Sort tasks"
            >
              {TASK_SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {activeView === 'table' ? (
        <TableCard
          cardClassName="tasks-table-card"
          footerClassName="tasks-table__footer"
          footerText={`Showing ${filteredTasks.length} of ${tasks.length} tasks`}
        >
          <table className="tasks-table">
            <thead>
              <tr>
                <th scope="col">Task</th>
                <th scope="col">Client</th>
                <th scope="col">Status</th>
                <th scope="col">Priority</th>
                <th scope="col" className="tasks-table__align-right">
                  Due Date
                </th>
                <th scope="col" className="tasks-table__align-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.length > 0 ? (
                filteredTasks.map((task) => (
                  <SelectableTableRow
                    key={task.id}
                    isSelected={selectedTask?.id === task.id}
                    rowClassName="tasks-table__row"
                    selectedClassName="tasks-table__row--selected"
                    ariaLabel={`View details for ${task.name}`}
                    onOpen={() => openDrawer(task)}
                  >
                    <td>
                      <div className="task-name">
                        <span
                          className={`task-name__check${task.status === 'completed' ? ' task-name__check--done' : ''}`}
                          aria-hidden="true"
                        />
                        <span className="task-name__label">{task.name}</span>
                      </div>
                    </td>
                    <td className="tasks-table__client">{task.client}</td>
                    <td>
                      <Badge {...getTaskStatusBadge(task.status)} />
                    </td>
                    <td>
                      <Badge {...getTaskPriorityBadge(task.priority)} />
                    </td>
                    <td className="tasks-table__align-right tasks-table__due">
                      {task.dueDate}
                    </td>
                    <td className="tasks-table__align-right">
                      <TableActions
                        onEdit={() => handleOpenEditModal(task)}
                        onDelete={() => openDeleteModal(task)}
                      />
                    </td>
                  </SelectableTableRow>
                ))
              ) : (
                <TableEmptyState colSpan={6} className="tasks-table__empty">
                  {tasks.length === 0
                    ? 'No tasks yet. Add your first task to get started.'
                    : 'No tasks match these filters.'}
                </TableEmptyState>
              )}
            </tbody>
          </table>
        </TableCard>
      ) : (
        <>
          {moveError ? (
            <p className="tasks-board__move-error" role="alert">
              {moveError}
            </p>
          ) : null}

          {tasks.length === 0 ? (
            <p className="tasks-board__empty-account">
              No tasks yet. Add your first task to get started.
            </p>
          ) : filteredTasks.length === 0 ? (
            <p className="tasks-board__empty-account">
              No tasks match these filters.
            </p>
          ) : null}

          <div
            className={[
              'tasks-board',
              isDragActive ? 'tasks-board--drag-active' : '',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            {TASK_BOARD_COLUMNS.map((column) => (
              <TaskBoardColumn
                key={column.value}
                statusId={column.value}
                label={column.label}
                emptyMessage={column.emptyMessage}
                tasks={groupedBoardTasks[column.value]}
                movingTaskId={movingTaskId}
                draggedTaskId={draggedTaskId}
                dragOverStatus={dragOverStatus}
                draggedTaskStatus={draggedTaskStatus}
                desktopDragEnabled={desktopDragEnabled}
                isDragActive={isDragActive}
                onOpenTask={openDrawer}
                onEditTask={handleOpenEditModal}
                onDeleteTask={openDeleteModal}
                onStatusChange={handleStatusChange}
                onCardDragStart={handleCardDragStart}
                onCardDragEnd={handleCardDragEnd}
                onColumnDragEnter={handleColumnDragEnter}
                onColumnDragOver={handleColumnDragOver}
                onColumnDragLeave={handleColumnDragLeave}
                onColumnDrop={handleColumnDrop}
              />
            ))}
          </div>

          <footer className="tasks-board__footer">
            Showing {filteredTasks.length} of {tasks.length} task
            {tasks.length === 1 ? '' : 's'}
          </footer>
        </>
      )}

      <AddTaskModal
        isOpen={isModalOpen}
        task={editingTask}
        clients={clients}
        onClose={closeModal}
        onSave={handleSaveTask}
        isSaving={isSaving}
        saveError={saveError}
      />

      <TaskDetailDrawer
        task={selectedTask}
        onClose={closeDrawer}
        onEdit={handleOpenEditModal}
        onDelete={openDeleteModal}
      />

      <ConfirmModal
        isOpen={Boolean(deletingTask)}
        title="Delete task?"
        description={
          deletingTask
            ? `"${deletingTask.name}" will be permanently removed from your task list. This action cannot be undone.`
            : ''
        }
        error={deleteError}
        isConfirming={isDeleting}
        confirmLabel="Delete"
        onClose={handleCloseDeleteModal}
        onConfirm={confirmDeleteTask}
      />
    </div>
  )
}

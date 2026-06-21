import { useCallback, useEffect, useMemo, useState } from 'react'
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
import { IconPlus } from './icons'
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
import { getTaskPriorityBadge, getTaskStatusBadge } from './utils/badges'

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'in-progress', label: 'In Progress' },
  { id: 'pending', label: 'Pending' },
  { id: 'completed', label: 'Completed' },
]

export default function Tasks() {
  const [tasks, setTasks] = useState([])
  const [clients, setClients] = useState([])
  const [loadStatus, setLoadStatus] = useState('loading')
  const [loadError, setLoadError] = useState(null)
  const [activeFilter, setActiveFilter] = useState('all')
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState(null)
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

  const fetchTasksPage = useCallback(async () => {
    setLoadStatus('loading')
    setLoadError(null)

    try {
      const [tasksData, clientsData] = await Promise.all([
        tasksApi.listTasks(),
        clientsApi.listClients(),
      ])

      setTasks(mapTasksFromApi(tasksData.tasks))
      setClients(
        clientsData.clients.map((client) => ({
          id: client.id,
          company: client.company,
        })),
      )
      setLoadStatus('ready')
    } catch (err) {
      setTasks([])
      setClients([])
      setLoadStatus('error')
      setLoadError(
        err instanceof ApiError
          ? err.message
          : 'Unable to load tasks. Try again.',
      )
    }
  }, [])

  useEffect(() => {
    fetchTasksPage()
  }, [fetchTasksPage])

  const filteredTasks = useMemo(() => {
    if (activeFilter === 'all') return tasks
    return tasks.filter((task) => task.status === activeFilter)
  }, [tasks, activeFilter])

  const filterCounts = useMemo(() => {
    return {
      all: tasks.length,
      'in-progress': tasks.filter((task) => task.status === 'in-progress').length,
      pending: tasks.filter((task) => task.status === 'pending').length,
      completed: tasks.filter((task) => task.status === 'completed').length,
    }
  }, [tasks])

  function handleOpenAddModal() {
    setSaveError(null)
    openAddModal()
  }

  function handleOpenEditModal(task) {
    setSaveError(null)
    openEditModal(task)
  }

  async function handleSaveTask(form) {
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
      setIsSaving(false)
    }
  }

  async function confirmDeleteTask() {
    if (!deletingTask) return

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

  return (
    <div className="tasks">
      <div className="tasks-toolbar">
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
              <span className="tasks-filter__count">{filterCounts[filter.id]}</span>
            </button>
          ))}
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
                  : 'No tasks match this filter.'}
              </TableEmptyState>
            )}
          </tbody>
        </table>
      </TableCard>

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

import { useMemo, useState } from 'react'
import AddTaskModal from './AddTaskModal'
import Badge from './Badge'
import ConfirmModal from './ConfirmModal'
import TaskDetailDrawer from './TaskDetailDrawer'
import { INITIAL_TASKS } from './data/tasks'
import { IconPlus } from './icons'

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'in-progress', label: 'In Progress' },
  { id: 'pending', label: 'Pending' },
  { id: 'completed', label: 'Completed' },
]

export default function Tasks() {
  const [tasks, setTasks] = useState(INITIAL_TASKS)
  const [activeFilter, setActiveFilter] = useState('all')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [deletingTask, setDeletingTask] = useState(null)
  const [selectedTask, setSelectedTask] = useState(null)

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

  function openAddModal() {
    setEditingTask(null)
    setIsModalOpen(true)
  }

  function openEditModal(task) {
    setEditingTask(task)
    setIsModalOpen(true)
  }

  function closeModal() {
    setIsModalOpen(false)
    setEditingTask(null)
    if (selectedTask) {
      document.body.style.overflow = 'hidden'
    }
  }

  function handleSaveTask(task) {
    if (editingTask) {
      setTasks((current) =>
        current.map((item) => (item.id === task.id ? task : item)),
      )
      setSelectedTask((current) => (current?.id === task.id ? task : current))
    } else {
      setTasks((current) => [task, ...current])
    }
    closeModal()
  }

  function openDeleteModal(task) {
    setDeletingTask(task)
  }

  function closeDeleteModal() {
    setDeletingTask(null)
    if (selectedTask) {
      document.body.style.overflow = 'hidden'
    }
  }

  function confirmDeleteTask() {
    if (!deletingTask) return

    setTasks((current) => current.filter((item) => item.id !== deletingTask.id))
    setSelectedTask((current) =>
      current?.id === deletingTask.id ? null : current,
    )
    closeDeleteModal()
  }

  function openDrawer(task) {
    setSelectedTask(task)
  }

  function closeDrawer() {
    setSelectedTask(null)
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
          onClick={openAddModal}
        >
          <IconPlus />
          New Task
        </button>
      </div>

      <div className="tasks-table-card">
        <div className="table-scroll">
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
                  <tr
                    key={task.id}
                    className={`tasks-table__row${
                      selectedTask?.id === task.id ? ' tasks-table__row--selected' : ''
                    }`}
                    onClick={() => openDrawer(task)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        openDrawer(task)
                      }
                    }}
                    tabIndex={0}
                    aria-label={`View details for ${task.name}`}
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
                      <Badge {...task.statusBadge} />
                    </td>
                    <td>
                      <Badge {...task.priority} />
                    </td>
                    <td className="tasks-table__align-right tasks-table__due">
                      {task.dueDate}
                    </td>
                    <td className="tasks-table__align-right">
                      <div className="table-actions">
                        <button
                          type="button"
                          className="btn btn--secondary btn--sm"
                          onClick={(event) => {
                            event.stopPropagation()
                            openEditModal(task)
                          }}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="btn btn--danger btn--sm"
                          onClick={(event) => {
                            event.stopPropagation()
                            openDeleteModal(task)
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="tasks-table__empty">
                    No tasks match this filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <footer className="tasks-table__footer">
          Showing {filteredTasks.length} of {tasks.length} tasks
        </footer>
      </div>

      <AddTaskModal
        isOpen={isModalOpen}
        task={editingTask}
        onClose={closeModal}
        onSave={handleSaveTask}
      />

      <TaskDetailDrawer
        task={selectedTask}
        onClose={closeDrawer}
        onEdit={openEditModal}
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
        onClose={closeDeleteModal}
        onConfirm={confirmDeleteTask}
      />
    </div>
  )
}

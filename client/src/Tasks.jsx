import { useMemo, useState } from 'react'
import AddTaskModal from './AddTaskModal'
import Badge from './Badge'
import ConfirmModal from './ConfirmModal'
import { IconPlus } from './icons'

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'in-progress', label: 'In Progress' },
  { id: 'pending', label: 'Pending' },
  { id: 'completed', label: 'Completed' },
]

const INITIAL_TASKS = [
  {
    id: 't1',
    name: 'Ship homepage v2 to staging',
    client: 'Relay Apps',
    status: 'in-progress',
    statusBadge: { label: 'In Progress', variant: 'info' },
    priority: { label: 'High', variant: 'danger' },
    dueDate: 'Jun 7, 2026',
  },
  {
    id: 't2',
    name: 'Send sprint recap and loom walkthrough',
    client: 'Patchwork Foods',
    status: 'pending',
    statusBadge: { label: 'Pending', variant: 'neutral' },
    priority: { label: 'Medium', variant: 'warning' },
    dueDate: 'Jun 8, 2026',
  },
  {
    id: 't3',
    name: 'Review revised scope for Phase 2',
    client: 'Harbor & Co.',
    status: 'in-progress',
    statusBadge: { label: 'In Progress', variant: 'info' },
    priority: { label: 'Medium', variant: 'warning' },
    dueDate: 'Jun 9, 2026',
  },
  {
    id: 't4',
    name: 'Export production assets for launch',
    client: 'Vaultline Security',
    status: 'pending',
    statusBadge: { label: 'Pending', variant: 'neutral' },
    priority: { label: 'Low', variant: 'neutral' },
    dueDate: 'Jun 10, 2026',
  },
  {
    id: 't5',
    name: 'Book content walkthrough with marketing',
    client: 'Kite & Anchor',
    status: 'pending',
    statusBadge: { label: 'Pending', variant: 'neutral' },
    priority: { label: 'Low', variant: 'neutral' },
    dueDate: 'Jun 12, 2026',
  },
  {
    id: 't6',
    name: 'Build shared component library',
    client: 'Relay Apps',
    status: 'in-progress',
    statusBadge: { label: 'In Progress', variant: 'info' },
    priority: { label: 'High', variant: 'danger' },
    dueDate: 'Jun 14, 2026',
  },
  {
    id: 't7',
    name: 'Draft proposal for analytics dashboard',
    client: 'Lumen Analytics',
    status: 'in-progress',
    statusBadge: { label: 'In Progress', variant: 'info' },
    priority: { label: 'Medium', variant: 'warning' },
    dueDate: 'Jun 15, 2026',
  },
  {
    id: 't8',
    name: 'Scope one-page pitch site',
    client: 'Atlas Ventures',
    status: 'pending',
    statusBadge: { label: 'Pending', variant: 'neutral' },
    priority: { label: 'Low', variant: 'neutral' },
    dueDate: 'Jun 18, 2026',
  },
  {
    id: 't9',
    name: 'Homepage responsive QA passed',
    client: 'Patchwork Foods',
    status: 'completed',
    statusBadge: { label: 'Completed', variant: 'success' },
    priority: { label: 'High', variant: 'danger' },
    dueDate: 'Jun 5, 2026',
  },
  {
    id: 't10',
    name: 'Invoice #1042 sent for May retainer',
    client: 'Relay Apps',
    status: 'completed',
    statusBadge: { label: 'Completed', variant: 'success' },
    priority: { label: 'Medium', variant: 'warning' },
    dueDate: 'Jun 4, 2026',
  },
  {
    id: 't11',
    name: 'Confirm June retainer payment',
    client: 'Kite & Anchor',
    status: 'completed',
    statusBadge: { label: 'Completed', variant: 'success' },
    priority: { label: 'Low', variant: 'neutral' },
    dueDate: 'Jun 2, 2026',
  },
  {
    id: 't12',
    name: 'Hand off design tokens to dev',
    client: 'Vaultline Security',
    status: 'completed',
    statusBadge: { label: 'Completed', variant: 'success' },
    priority: { label: 'Medium', variant: 'warning' },
    dueDate: 'May 28, 2026',
  },
  {
    id: 't13',
    name: 'Reconcile May contractor payouts',
    client: 'Clearline Studio',
    status: 'completed',
    statusBadge: { label: 'Completed', variant: 'success' },
    priority: { label: 'Low', variant: 'neutral' },
    dueDate: 'May 31, 2026',
  },
  {
    id: 't14',
    name: 'Wire store locator map integration',
    client: 'Fieldstone Retail',
    status: 'in-progress',
    statusBadge: { label: 'In Progress', variant: 'info' },
    priority: { label: 'Medium', variant: 'warning' },
    dueDate: 'Jun 20, 2026',
  },
]

export default function Tasks() {
  const [tasks, setTasks] = useState(INITIAL_TASKS)
  const [activeFilter, setActiveFilter] = useState('all')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [deletingTask, setDeletingTask] = useState(null)

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
  }

  function handleSaveTask(task) {
    if (editingTask) {
      setTasks((current) =>
        current.map((item) => (item.id === task.id ? task : item)),
      )
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
  }

  function confirmDeleteTask() {
    if (!deletingTask) return

    setTasks((current) => current.filter((item) => item.id !== deletingTask.id))
    closeDeleteModal()
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
                  <tr key={task.id}>
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
                          onClick={() => openEditModal(task)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="btn btn--danger btn--sm"
                          onClick={() => openDeleteModal(task)}
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

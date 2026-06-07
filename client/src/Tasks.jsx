import { useMemo, useState } from 'react'
import AddTaskModal from './AddTaskModal'
import useConfirmDeleteState from './hooks/useConfirmDeleteState'
import useEditModalState from './hooks/useEditModalState'
import useSelectionState from './hooks/useSelectionState'
import Badge from './Badge'
import ConfirmModal from './ConfirmModal'
import TaskDetailDrawer from './TaskDetailDrawer'
import { INITIAL_TASKS } from './data/tasks'
import { IconPlus } from './icons'
import {
  SelectableTableRow,
  TableActions,
  TableCard,
  TableEmptyState,
} from './tables/tablePrimitives'
import { getTaskPriorityBadge, getTaskStatusBadge } from './utils/badges'

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'in-progress', label: 'In Progress' },
  { id: 'pending', label: 'Pending' },
  { id: 'completed', label: 'Completed' },
]

export default function Tasks() {
  const [tasks, setTasks] = useState(INITIAL_TASKS)
  const [activeFilter, setActiveFilter] = useState('all')
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

  function confirmDeleteTask() {
    if (!deletingTask) return

    setTasks((current) => current.filter((item) => item.id !== deletingTask.id))
    setSelectedTask((current) =>
      current?.id === deletingTask.id ? null : current,
    )
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
                      onEdit={() => openEditModal(task)}
                      onDelete={() => openDeleteModal(task)}
                    />
                  </td>
                </SelectableTableRow>
              ))
            ) : (
              <TableEmptyState colSpan={6} className="tasks-table__empty">
                No tasks match this filter.
              </TableEmptyState>
            )}
          </tbody>
        </table>
      </TableCard>

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

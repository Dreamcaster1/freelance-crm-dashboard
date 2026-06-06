import { useMemo, useState } from 'react'
import Badge from './Badge'
import { IconPlus } from './icons'

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'in-progress', label: 'In Progress' },
  { id: 'pending', label: 'Pending' },
  { id: 'completed', label: 'Completed' },
]

const TASKS = [
  {
    id: 't1',
    name: 'Deliver wireframes v2',
    client: 'Northline Studio',
    status: 'in-progress',
    statusBadge: { label: 'In Progress', variant: 'info' },
    priority: { label: 'High', variant: 'danger' },
    dueDate: 'Jun 7, 2026',
  },
  {
    id: 't2',
    name: 'Send Q2 progress report',
    client: 'Brightpath Labs',
    status: 'pending',
    statusBadge: { label: 'Pending', variant: 'neutral' },
    priority: { label: 'Medium', variant: 'warning' },
    dueDate: 'Jun 8, 2026',
  },
  {
    id: 't3',
    name: 'Review contract amendments',
    client: 'Harbor & Co.',
    status: 'in-progress',
    statusBadge: { label: 'In Progress', variant: 'info' },
    priority: { label: 'Medium', variant: 'warning' },
    dueDate: 'Jun 9, 2026',
  },
  {
    id: 't4',
    name: 'Finalize logo exports',
    client: 'Elmwood Digital',
    status: 'pending',
    statusBadge: { label: 'Pending', variant: 'neutral' },
    priority: { label: 'Low', variant: 'neutral' },
    dueDate: 'Jun 10, 2026',
  },
  {
    id: 't5',
    name: 'Schedule discovery call',
    client: 'Summit Health',
    status: 'pending',
    statusBadge: { label: 'Pending', variant: 'neutral' },
    priority: { label: 'Low', variant: 'neutral' },
    dueDate: 'Jun 12, 2026',
  },
  {
    id: 't6',
    name: 'Build component library',
    client: 'Northline Studio',
    status: 'in-progress',
    statusBadge: { label: 'In Progress', variant: 'info' },
    priority: { label: 'High', variant: 'danger' },
    dueDate: 'Jun 14, 2026',
  },
  {
    id: 't7',
    name: 'Prepare onboarding deck',
    client: 'Lumen Analytics',
    status: 'in-progress',
    statusBadge: { label: 'In Progress', variant: 'info' },
    priority: { label: 'Medium', variant: 'warning' },
    dueDate: 'Jun 15, 2026',
  },
  {
    id: 't8',
    name: 'Update sprint backlog',
    client: 'Atlas Ventures',
    status: 'pending',
    statusBadge: { label: 'Pending', variant: 'neutral' },
    priority: { label: 'Low', variant: 'neutral' },
    dueDate: 'Jun 18, 2026',
  },
  {
    id: 't9',
    name: 'Homepage mockups approved',
    client: 'Brightpath Labs',
    status: 'completed',
    statusBadge: { label: 'Completed', variant: 'success' },
    priority: { label: 'High', variant: 'danger' },
    dueDate: 'Jun 5, 2026',
  },
  {
    id: 't10',
    name: 'Invoice #1042 sent',
    client: 'Northline Studio',
    status: 'completed',
    statusBadge: { label: 'Completed', variant: 'success' },
    priority: { label: 'Medium', variant: 'warning' },
    dueDate: 'Jun 4, 2026',
  },
  {
    id: 't11',
    name: 'Retainer payment follow-up',
    client: 'Summit Health',
    status: 'completed',
    statusBadge: { label: 'Completed', variant: 'success' },
    priority: { label: 'Low', variant: 'neutral' },
    dueDate: 'Jun 2, 2026',
  },
  {
    id: 't12',
    name: 'Brand guidelines handoff',
    client: 'Elmwood Digital',
    status: 'completed',
    statusBadge: { label: 'Completed', variant: 'success' },
    priority: { label: 'Medium', variant: 'warning' },
    dueDate: 'May 28, 2026',
  },
  {
    id: 't13',
    name: 'Reconcile May expenses',
    client: 'Internal',
    status: 'completed',
    statusBadge: { label: 'Completed', variant: 'success' },
    priority: { label: 'Low', variant: 'neutral' },
    dueDate: 'May 31, 2026',
  },
  {
    id: 't14',
    name: 'Draft case study outline',
    client: 'Fieldstone Retail',
    status: 'in-progress',
    statusBadge: { label: 'In Progress', variant: 'info' },
    priority: { label: 'Medium', variant: 'warning' },
    dueDate: 'Jun 20, 2026',
  },
]

export default function Tasks() {
  const [activeFilter, setActiveFilter] = useState('all')

  const filteredTasks = useMemo(() => {
    if (activeFilter === 'all') return TASKS
    return TASKS.filter((task) => task.status === activeFilter)
  }, [activeFilter])

  const filterCounts = useMemo(() => {
    return {
      all: TASKS.length,
      'in-progress': TASKS.filter((task) => task.status === 'in-progress').length,
      pending: TASKS.filter((task) => task.status === 'pending').length,
      completed: TASKS.filter((task) => task.status === 'completed').length,
    }
  }, [])

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
        <button type="button" className="btn btn--primary">
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
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="tasks-table__empty">
                  No tasks match this filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </div>

        <footer className="tasks-table__footer">
          Showing {filteredTasks.length} of {TASKS.length} tasks
        </footer>
      </div>
    </div>
  )
}

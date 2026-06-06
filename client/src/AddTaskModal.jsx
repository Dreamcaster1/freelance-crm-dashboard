import { useEffect, useState } from 'react'
import { formatDueDate, parseDueDateToInput } from './utils/format'

const STATUS_OPTIONS = [
  { value: 'in-progress', label: 'In Progress', variant: 'info' },
  { value: 'pending', label: 'Pending', variant: 'neutral' },
  { value: 'completed', label: 'Completed', variant: 'success' },
]

const PRIORITY_OPTIONS = [
  { value: 'high', label: 'High', variant: 'danger' },
  { value: 'medium', label: 'Medium', variant: 'warning' },
  { value: 'low', label: 'Low', variant: 'neutral' },
]

const EMPTY_FORM = {
  name: '',
  client: '',
  status: 'pending',
  priority: 'medium',
  dueDate: '',
}

function getStatusBadge(statusValue) {
  const option = STATUS_OPTIONS.find((item) => item.value === statusValue)
  return {
    label: option?.label ?? 'Pending',
    variant: option?.variant ?? 'neutral',
  }
}

function getPriorityBadge(priorityValue) {
  const option = PRIORITY_OPTIONS.find((item) => item.value === priorityValue)
  return {
    label: option?.label ?? 'Medium',
    variant: option?.variant ?? 'warning',
  }
}

function getPriorityValue(priority) {
  const option = PRIORITY_OPTIONS.find((item) => item.label === priority.label)
  return option?.value ?? 'medium'
}

function taskToForm(task) {
  return {
    name: task.name,
    client: task.client,
    status: task.status,
    priority: getPriorityValue(task.priority),
    dueDate: parseDueDateToInput(task.dueDate),
  }
}

function validateForm(form) {
  const errors = {}

  if (!form.name.trim()) {
    errors.name = 'Task name is required.'
  }

  if (!form.client.trim()) {
    errors.client = 'Client is required.'
  }

  return errors
}

export default function AddTaskModal({ isOpen, task, onClose, onSave }) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const isEditing = Boolean(task)

  useEffect(() => {
    if (!isOpen) return

    setForm(task ? taskToForm(task) : EMPTY_FORM)
    setErrors({})
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen, task])

  if (!isOpen) return null

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
    if (errors[field]) {
      setErrors((current) => {
        const next = { ...current }
        delete next[field]
        return next
      })
    }
  }

  function handleSubmit(event) {
    event.preventDefault()

    const validationErrors = validateForm(form)
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    onSave({
      id: task?.id ?? `t${Date.now()}`,
      name: form.name.trim(),
      client: form.client.trim(),
      status: form.status,
      statusBadge: getStatusBadge(form.status),
      priority: getPriorityBadge(form.priority),
      dueDate: formatDueDate(form.dueDate),
    })
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="modal__header">
          <h2 id="task-modal-title" className="modal__title">
            {isEditing ? 'Edit Task' : 'New Task'}
          </h2>
          <p className="modal__description">
            {isEditing
              ? 'Update this task’s details and tracking information.'
              : 'Add a deliverable and keep it tied to the right client build.'}
          </p>
        </header>

        <form className="modal__form" onSubmit={handleSubmit} noValidate>
          <div className="modal__body">
            <div className="modal-field">
              <label className="modal-field__label" htmlFor="task-name">
                Task name
              </label>
              <input
                id="task-name"
                type="text"
                className={`field-input${errors.name ? ' field-input--error' : ''}`}
                value={form.name}
                onChange={(event) => updateField('name', event.target.value)}
              />
              {errors.name && <span className="field-error">{errors.name}</span>}
            </div>

            <div className="modal-field">
              <label className="modal-field__label" htmlFor="task-client">
                Client
              </label>
              <input
                id="task-client"
                type="text"
                className={`field-input${errors.client ? ' field-input--error' : ''}`}
                value={form.client}
                onChange={(event) => updateField('client', event.target.value)}
              />
              {errors.client && (
                <span className="field-error">{errors.client}</span>
              )}
            </div>

            <div className="modal-field">
              <label className="modal-field__label" htmlFor="task-status">
                Status
              </label>
              <select
                id="task-status"
                className="field-select"
                value={form.status}
                onChange={(event) => updateField('status', event.target.value)}
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="modal-field">
              <label className="modal-field__label" htmlFor="task-priority">
                Priority
              </label>
              <select
                id="task-priority"
                className="field-select"
                value={form.priority}
                onChange={(event) => updateField('priority', event.target.value)}
              >
                {PRIORITY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="modal-field">
              <label className="modal-field__label" htmlFor="task-due-date">
                Due date
              </label>
              <input
                id="task-due-date"
                type="date"
                className="field-input"
                value={form.dueDate}
                onChange={(event) => updateField('dueDate', event.target.value)}
              />
            </div>
          </div>

          <footer className="modal__footer">
            <button type="button" className="btn btn--secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn--primary">
              Save
            </button>
          </footer>
        </form>
      </div>
    </div>
  )
}

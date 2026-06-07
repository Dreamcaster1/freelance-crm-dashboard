import { useState } from 'react'
import useOverlayLock from './hooks/useOverlayLock'
import {
  ModalBody,
  ModalField,
  ModalFooter,
  ModalForm,
  ModalHeader,
  ModalShell,
} from './modals/modalPrimitives'
import { TASK_PRIORITY_OPTIONS, TASK_STATUS_OPTIONS } from './utils/badges'
import { formatDueDate, parseDueDateToInput } from './utils/format'

const EMPTY_FORM = {
  name: '',
  client: '',
  status: 'pending',
  priority: 'medium',
  dueDate: '',
}

function taskToForm(task) {
  return {
    name: task.name,
    client: task.client,
    status: task.status,
    priority: task.priority,
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
  useOverlayLock(isOpen)

  if (!isOpen) return null

  return (
    <TaskModalContent
      key={task?.id ?? 'new-task'}
      task={task}
      onClose={onClose}
      onSave={onSave}
    />
  )
}

function TaskModalContent({ task, onClose, onSave }) {
  const [form, setForm] = useState(() => (task ? taskToForm(task) : EMPTY_FORM))
  const [errors, setErrors] = useState({})
  const isEditing = Boolean(task)

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
      priority: form.priority,
      dueDate: formatDueDate(form.dueDate),
    })
  }

  return (
    <ModalShell onClose={onClose} titleId="task-modal-title">
      <ModalHeader
        titleId="task-modal-title"
        title={isEditing ? 'Edit Task' : 'New Task'}
        description={
          isEditing
            ? 'Update this task’s details and tracking information.'
            : 'Add a deliverable and keep it tied to the right client build.'
        }
      />

      <ModalForm onSubmit={handleSubmit}>
        <ModalBody>
          <ModalField label="Task name" htmlFor="task-name" error={errors.name}>
            <input
              id="task-name"
              type="text"
              className={`field-input${errors.name ? ' field-input--error' : ''}`}
              value={form.name}
              onChange={(event) => updateField('name', event.target.value)}
            />
          </ModalField>

          <ModalField label="Client" htmlFor="task-client" error={errors.client}>
            <input
              id="task-client"
              type="text"
              className={`field-input${errors.client ? ' field-input--error' : ''}`}
              value={form.client}
              onChange={(event) => updateField('client', event.target.value)}
            />
          </ModalField>

          <ModalField label="Status" htmlFor="task-status">
            <select
              id="task-status"
              className="field-select"
              value={form.status}
              onChange={(event) => updateField('status', event.target.value)}
            >
              {TASK_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </ModalField>

          <ModalField label="Priority" htmlFor="task-priority">
            <select
              id="task-priority"
              className="field-select"
              value={form.priority}
              onChange={(event) => updateField('priority', event.target.value)}
            >
              {TASK_PRIORITY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </ModalField>

          <ModalField label="Due date" htmlFor="task-due-date">
            <input
              id="task-due-date"
              type="date"
              className="field-input"
              value={form.dueDate}
              onChange={(event) => updateField('dueDate', event.target.value)}
            />
          </ModalField>
        </ModalBody>

        <ModalFooter onClose={onClose} />
      </ModalForm>
    </ModalShell>
  )
}

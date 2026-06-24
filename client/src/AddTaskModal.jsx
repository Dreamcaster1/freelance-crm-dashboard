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
import { mapTaskToForm } from './utils/taskMapper'
import { TASK_PRIORITY_OPTIONS, TASK_STATUS_OPTIONS } from './utils/badges'

const EMPTY_FORM = {
  name: '',
  clientId: '',
  status: 'pending',
  priority: 'medium',
  dueDate: '',
  description: '',
}

function validateForm(form) {
  const errors = {}

  if (!form.name.trim()) {
    errors.name = 'Task name is required.'
  }

  return errors
}

export default function AddTaskModal({
  isOpen,
  task,
  clients,
  onClose,
  onSave,
  isSaving = false,
  saveError = null,
  initialClientId = '',
  lockClient = false,
}) {
  useOverlayLock(isOpen)

  if (!isOpen) return null

  return (
    <TaskModalContent
      key={task?.id ?? `new-task-${initialClientId || 'none'}-${lockClient ? 'locked' : 'open'}`}
      task={task}
      clients={clients}
      onClose={onClose}
      onSave={onSave}
      isSaving={isSaving}
      saveError={saveError}
      initialClientId={initialClientId}
      lockClient={lockClient}
    />
  )
}

function TaskModalContent({
  task,
  clients,
  onClose,
  onSave,
  isSaving,
  saveError,
  initialClientId,
  lockClient,
}) {
  const [form, setForm] = useState(() =>
    task
      ? mapTaskToForm(task)
      : { ...EMPTY_FORM, clientId: initialClientId ? String(initialClientId) : '' },
  )
  const [errors, setErrors] = useState({})
  const isEditing = Boolean(task)
  const isClientLocked = lockClient && !isEditing
  const hasLinkedClient = Boolean(
    task?.clientId && clients.some((client) => client.id === task.clientId),
  )

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

  async function handleSubmit(event) {
    event.preventDefault()

    const validationErrors = validateForm(form)
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    await onSave(form)
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
              disabled={isSaving}
            />
          </ModalField>

          <ModalField label="Client" htmlFor="task-client">
            <select
              id="task-client"
              className="field-select"
              value={form.clientId}
              onChange={(event) => updateField('clientId', event.target.value)}
              disabled={isSaving || isClientLocked}
            >
              <option value="">No client</option>
              {task?.clientId && !hasLinkedClient ? (
                <option value={String(task.clientId)}>{task.client}</option>
              ) : null}
              {clients.map((client) => (
                <option key={client.id} value={String(client.id)}>
                  {client.company}
                </option>
              ))}
            </select>
          </ModalField>

          <ModalField label="Status" htmlFor="task-status">
            <select
              id="task-status"
              className="field-select"
              value={form.status}
              onChange={(event) => updateField('status', event.target.value)}
              disabled={isSaving}
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
              disabled={isSaving}
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
              disabled={isSaving}
            />
          </ModalField>

          <ModalField label="Description" htmlFor="task-description">
            <textarea
              id="task-description"
              className="field-input"
              rows={3}
              value={form.description}
              onChange={(event) => updateField('description', event.target.value)}
              disabled={isSaving}
            />
          </ModalField>

          {saveError ? <p className="field-error">{saveError}</p> : null}
        </ModalBody>

        <ModalFooter
          onClose={onClose}
          isSubmitting={isSaving}
          submitLabel={isEditing ? 'Save changes' : 'Add task'}
        />
      </ModalForm>
    </ModalShell>
  )
}

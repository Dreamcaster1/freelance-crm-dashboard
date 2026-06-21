import { formatDueDate } from './format.js'

export function mapTaskFromApi(apiTask) {
  return {
    id: apiTask.id,
    clientId: apiTask.clientId,
    client: apiTask.clientNameSnapshot ?? '—',
    name: apiTask.name,
    status: apiTask.status,
    priority: apiTask.priority,
    dueDate: formatDueDate(apiTask.dueDate),
    dueDateRaw: apiTask.dueDate,
    description: apiTask.description ?? '',
  }
}

export function mapTasksFromApi(apiTasks) {
  return apiTasks.map(mapTaskFromApi)
}

export function mapTaskFormToApiPayload(form) {
  const clientId =
    form.clientId === '' || form.clientId == null ? null : Number(form.clientId)

  return {
    name: form.name.trim(),
    status: form.status,
    priority: form.priority,
    due_date: form.dueDate || null,
    description: form.description?.trim() || null,
    client_id: clientId,
  }
}

export function mapTaskToForm(task) {
  return {
    name: task.name,
    clientId: task.clientId != null ? String(task.clientId) : '',
    status: task.status,
    priority: task.priority,
    dueDate: task.dueDateRaw ?? '',
    description: task.description ?? '',
  }
}

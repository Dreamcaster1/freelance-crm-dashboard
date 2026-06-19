function formatDueDate(value) {
  if (value == null) {
    return null
  }

  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value
  }

  const parsed = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return null
  }

  const year = parsed.getFullYear()
  const month = String(parsed.getMonth() + 1).padStart(2, '0')
  const day = String(parsed.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

export function mapTaskResponse(task) {
  return {
    id: task.id,
    workspaceId: task.workspace_id,
    clientId: task.client_id,
    clientNameSnapshot: task.client_name_snapshot,
    name: task.name,
    status: task.status,
    priority: task.priority,
    dueDate: formatDueDate(task.due_date),
    description: task.description,
    createdAt: task.created_at,
    updatedAt: task.updated_at,
  }
}

export function mapTaskResponses(tasks) {
  return tasks.map(mapTaskResponse)
}

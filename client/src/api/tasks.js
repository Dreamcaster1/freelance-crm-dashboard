import { apiRequest } from './client.js'

export function listTasks() {
  return apiRequest('/api/tasks')
}

export function createTask(body) {
  return apiRequest('/api/tasks', {
    method: 'POST',
    body,
  })
}

export function updateTask(id, body) {
  return apiRequest(`/api/tasks/${id}`, {
    method: 'PATCH',
    body,
  })
}

export function deleteTask(id) {
  return apiRequest(`/api/tasks/${id}`, {
    method: 'DELETE',
  })
}

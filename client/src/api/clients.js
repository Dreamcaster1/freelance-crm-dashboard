import { apiRequest } from './client.js'

export function listClients() {
  return apiRequest('/api/clients')
}

export function createClient(body) {
  return apiRequest('/api/clients', {
    method: 'POST',
    body,
  })
}

export function updateClient(id, body) {
  return apiRequest(`/api/clients/${id}`, {
    method: 'PATCH',
    body,
  })
}

export function deleteClient(id) {
  return apiRequest(`/api/clients/${id}`, {
    method: 'DELETE',
  })
}

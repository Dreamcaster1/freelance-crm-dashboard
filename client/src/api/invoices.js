import { apiRequest } from './client.js'

export function listInvoices() {
  return apiRequest('/api/invoices')
}

export function getInvoice(id) {
  return apiRequest(`/api/invoices/${id}`)
}

export function createInvoice(body) {
  return apiRequest('/api/invoices', {
    method: 'POST',
    body,
  })
}

export function updateInvoice(id, body) {
  return apiRequest(`/api/invoices/${id}`, {
    method: 'PATCH',
    body,
  })
}

export function deleteInvoice(id) {
  return apiRequest(`/api/invoices/${id}`, {
    method: 'DELETE',
  })
}

export function markInvoiceSent(id) {
  return apiRequest(`/api/invoices/${id}/mark-sent`, {
    method: 'POST',
  })
}

export function markInvoicePaid(id, body) {
  return apiRequest(`/api/invoices/${id}/mark-paid`, {
    method: 'POST',
    body,
  })
}

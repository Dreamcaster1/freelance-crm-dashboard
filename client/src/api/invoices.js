import { apiRequest } from './client.js'

export function listInvoices() {
  return apiRequest('/api/invoices')
}

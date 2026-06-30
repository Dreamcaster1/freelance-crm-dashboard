import { apiRequest } from './client.js'

export function listRecentActivity(limit = 10) {
  const params = new URLSearchParams()
  if (limit != null) {
    params.set('limit', String(limit))
  }

  return apiRequest(`/api/activity/recent?${params.toString()}`)
}

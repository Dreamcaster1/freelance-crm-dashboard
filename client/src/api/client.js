export const API_BASE_URL =
  import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

export class ApiError extends Error {
  constructor(message, { status, body } = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.body = body
  }
}

export async function apiRequest(path, { method = 'GET', body, headers = {} } = {}) {
  const fetchOptions = {
    method,
    credentials: 'include',
    headers: {
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...headers,
    },
  }

  if (body !== undefined) {
    fetchOptions.body = JSON.stringify(body)
  }

  let response

  try {
    response = await fetch(`${API_BASE_URL}${path}`, fetchOptions)
  } catch {
    throw new ApiError('Unable to reach the API. Check that the backend is running.')
  }

  let data = null
  const contentType = response.headers.get('content-type')

  if (contentType?.includes('application/json')) {
    data = await response.json()
  }

  if (!response.ok) {
    const message =
      data?.error ?? `Request failed with status ${response.status}.`
    throw new ApiError(message, { status: response.status, body: data })
  }

  return data
}

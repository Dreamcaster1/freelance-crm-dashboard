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

let unauthorizedHandler = null

/**
 * Register a callback that fires whenever any API response returns 401.
 * Pass null to deregister. Called by useAuthSession to clear auth state
 * globally without wiring 401 checks into every page component.
 */
export function setUnauthorizedHandler(fn) {
  unauthorizedHandler = fn
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
    if (response.status === 401 && unauthorizedHandler !== null) {
      unauthorizedHandler()
    }
    const message =
      data?.error ?? `Request failed with status ${response.status}.`
    throw new ApiError(message, { status: response.status, body: data })
  }

  return data
}

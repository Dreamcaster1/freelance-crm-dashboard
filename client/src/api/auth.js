import { apiRequest } from './client.js'

export function getMe() {
  return apiRequest('/api/auth/me')
}

export function login({ email, password }) {
  return apiRequest('/api/auth/login', {
    method: 'POST',
    body: { email, password },
  })
}

export function register({ name, email, password, workspaceName }) {
  return apiRequest('/api/auth/register', {
    method: 'POST',
    body: { name, email, password, workspaceName },
  })
}

export function logout() {
  return apiRequest('/api/auth/logout', { method: 'POST' })
}

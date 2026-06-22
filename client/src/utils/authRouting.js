const VALID_AUTH_MODES = new Set(['login', 'register'])

export function parseAuthMode(rawMode) {
  return rawMode === 'register' ? 'register' : 'login'
}

export function getSafeNextPath(raw) {
  if (!raw || typeof raw !== 'string') return null

  const path = raw.trim()
  if (!path.startsWith('/') || path.startsWith('//')) return null
  if (path.startsWith('/auth')) return null

  return path
}

export function buildAuthPath({ mode = 'login', next } = {}) {
  const params = new URLSearchParams()
  const authMode = VALID_AUTH_MODES.has(mode) ? mode : 'login'
  params.set('mode', authMode)

  const safeNext = getSafeNextPath(next)
  if (safeNext) {
    params.set('next', safeNext)
  }

  return `/auth?${params.toString()}`
}

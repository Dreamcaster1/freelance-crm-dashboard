import { useCallback, useEffect, useState } from 'react'
import * as authApi from '../api/auth.js'
import { ApiError } from '../api/client.js'

export default function useAuthSession() {
  const [status, setStatus] = useState('loading')
  const [user, setUser] = useState(null)
  const [workspace, setWorkspace] = useState(null)
  const [error, setError] = useState(null)

  const applySession = useCallback((data) => {
    setUser(data.user)
    setWorkspace(data.workspace)
    setStatus('authenticated')
    setError(null)
  }, [])

  const clearSession = useCallback(() => {
    setUser(null)
    setWorkspace(null)
    setStatus('unauthenticated')
    setError(null)
  }, [])

  const bootstrap = useCallback(async () => {
    setStatus('loading')
    setError(null)

    try {
      const data = await authApi.getMe()
      applySession(data)
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        clearSession()
        return
      }

      setUser(null)
      setWorkspace(null)
      setStatus('error')
      setError(err instanceof Error ? err.message : 'Unable to check session.')
    }
  }, [applySession, clearSession])

  useEffect(() => {
    bootstrap()
  }, [bootstrap])

  const login = useCallback(
    async (credentials) => {
      const data = await authApi.login(credentials)
      applySession(data)
    },
    [applySession],
  )

  const register = useCallback(
    async (payload) => {
      const data = await authApi.register(payload)
      applySession(data)
    },
    [applySession],
  )

  const logout = useCallback(async () => {
    try {
      await authApi.logout()
    } finally {
      clearSession()
    }
  }, [clearSession])

  return {
    status,
    user,
    workspace,
    error,
    login,
    register,
    logout,
    retry: bootstrap,
  }
}

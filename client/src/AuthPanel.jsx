import { useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ApiError } from './api/client.js'
import { parseAuthMode } from './utils/authRouting'

const EMPTY_LOGIN = { email: '', password: '' }
const EMPTY_REGISTER = {
  name: '',
  email: '',
  password: '',
  workspaceName: '',
}

export default function AuthPanel({ onLogin, onRegister }) {
  const [searchParams, setSearchParams] = useSearchParams()
  const mode = parseAuthMode(searchParams.get('mode'))
  const [loginForm, setLoginForm] = useState(EMPTY_LOGIN)
  const [registerForm, setRegisterForm] = useState(EMPTY_REGISTER)
  const [error, setError] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const loginInFlightRef = useRef(false)
  const registerInFlightRef = useRef(false)

  function switchMode(nextMode) {
    setError(null)
    const params = new URLSearchParams(searchParams)
    params.set('mode', nextMode)
    setSearchParams(params)
  }

  async function handleLoginSubmit(event) {
    event.preventDefault()
    if (loginInFlightRef.current) return
    loginInFlightRef.current = true
    setIsSubmitting(true)
    setError(null)

    try {
      await onLogin({
        email: loginForm.email.trim(),
        password: loginForm.password,
      })
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'Unable to sign in. Try again.',
      )
    } finally {
      loginInFlightRef.current = false
      setIsSubmitting(false)
    }
  }

  async function handleRegisterSubmit(event) {
    event.preventDefault()
    if (registerInFlightRef.current) return
    registerInFlightRef.current = true
    setIsSubmitting(true)
    setError(null)

    try {
      await onRegister({
        name: registerForm.name.trim(),
        email: registerForm.email.trim(),
        password: registerForm.password,
        workspaceName: registerForm.workspaceName.trim(),
      })
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'Unable to create account. Try again.',
      )
    } finally {
      registerInFlightRef.current = false
      setIsSubmitting(false)
    }
  }

  return (
    <div className="auth-screen">
      <div className="auth-panel">
        <header className="auth-panel__header">
          <span className="brand-mark" aria-hidden="true" />
          <div className="auth-panel__copy">
            <h1 className="auth-panel__title">ClientFlow</h1>
            <p className="auth-panel__description">
              Sign in to access your studio workspace.
            </p>
          </div>
        </header>

        <div className="auth-panel__tabs" role="tablist" aria-label="Auth mode">
          <button
            type="button"
            role="tab"
            className={`auth-panel__tab${mode === 'login' ? ' auth-panel__tab--active' : ''}`}
            aria-selected={mode === 'login'}
            onClick={() => switchMode('login')}
          >
            Sign in
          </button>
          <button
            type="button"
            role="tab"
            className={`auth-panel__tab${mode === 'register' ? ' auth-panel__tab--active' : ''}`}
            aria-selected={mode === 'register'}
            onClick={() => switchMode('register')}
          >
            Register
          </button>
        </div>

        {mode === 'login' ? (
          <form className="auth-panel__form" onSubmit={handleLoginSubmit}>
            <div className="modal-field">
              <label className="modal-field__label" htmlFor="auth-email">
                Email
              </label>
              <input
                id="auth-email"
                type="email"
                className="field-input"
                autoComplete="email"
                value={loginForm.email}
                onChange={(event) =>
                  setLoginForm((current) => ({
                    ...current,
                    email: event.target.value,
                  }))
                }
                required
              />
            </div>

            <div className="modal-field">
              <label className="modal-field__label" htmlFor="auth-password">
                Password
              </label>
              <input
                id="auth-password"
                type="password"
                className="field-input"
                autoComplete="current-password"
                value={loginForm.password}
                onChange={(event) =>
                  setLoginForm((current) => ({
                    ...current,
                    password: event.target.value,
                  }))
                }
                required
              />
            </div>

            {error ? <p className="auth-panel__error">{error}</p> : null}

            <button
              type="submit"
              className="btn btn--primary auth-panel__submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        ) : (
          <form className="auth-panel__form" onSubmit={handleRegisterSubmit}>
            <div className="modal-field">
              <label className="modal-field__label" htmlFor="auth-name">
                Name
              </label>
              <input
                id="auth-name"
                type="text"
                className="field-input"
                autoComplete="name"
                value={registerForm.name}
                onChange={(event) =>
                  setRegisterForm((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
                required
              />
            </div>

            <div className="modal-field">
              <label className="modal-field__label" htmlFor="auth-register-email">
                Email
              </label>
              <input
                id="auth-register-email"
                type="email"
                className="field-input"
                autoComplete="email"
                value={registerForm.email}
                onChange={(event) =>
                  setRegisterForm((current) => ({
                    ...current,
                    email: event.target.value,
                  }))
                }
                required
              />
            </div>

            <div className="modal-field">
              <label
                className="modal-field__label"
                htmlFor="auth-register-password"
              >
                Password
              </label>
              <input
                id="auth-register-password"
                type="password"
                className="field-input"
                autoComplete="new-password"
                minLength={8}
                value={registerForm.password}
                onChange={(event) =>
                  setRegisterForm((current) => ({
                    ...current,
                    password: event.target.value,
                  }))
                }
                required
              />
            </div>

            <div className="modal-field">
              <label
                className="modal-field__label"
                htmlFor="auth-workspace-name"
              >
                Workspace name
              </label>
              <input
                id="auth-workspace-name"
                type="text"
                className="field-input"
                value={registerForm.workspaceName}
                onChange={(event) =>
                  setRegisterForm((current) => ({
                    ...current,
                    workspaceName: event.target.value,
                  }))
                }
                required
              />
            </div>

            {error ? <p className="auth-panel__error">{error}</p> : null}

            <button
              type="submit"
              className="btn btn--primary auth-panel__submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating account…' : 'Create account'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

import { useState } from 'react'
import {
  Navigate,
  NavLink,
  Outlet,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useSearchParams,
} from 'react-router-dom'
import AuthPanel from './AuthPanel'
import Clients from './Clients'
import Dashboard from './Dashboard'
import Pipeline from './Pipeline'
import Settings from './Settings'
import Tasks from './Tasks'
import { ApiError } from './api/client.js'
import { getPageKeyFromPath, NAV_ITEMS, PAGES } from './config/navigation'
import useAuthSession from './hooks/useAuthSession'
import { IconChevronDown } from './icons'
import { buildAuthPath, getSafeNextPath } from './utils/authRouting'
import { getInitials } from './utils/format'
import './App.css'

function AppShell({ user, workspace, onLogout }) {
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [logoutError, setLogoutError] = useState(null)
  const location = useLocation()
  const page = PAGES[getPageKeyFromPath(location.pathname)]
  const workspaceInitials = workspace ? getInitials(workspace.name) : '—'
  const userInitials = user ? getInitials(user.name) : '—'

  async function handleLogout() {
    setLogoutError(null)
    setIsLoggingOut(true)

    try {
      await onLogout()
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : 'Unable to log out. Try again.'
      setLogoutError(message)
      console.error('Logout failed:', message)
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <span className="brand-mark" aria-hidden="true" />
            <span className="brand-copy">
              <span className="brand-name">ClientFlow</span>
              <span className="brand-tagline">Studio workspace</span>
            </span>
          </div>

          <button type="button" className="workspace-switcher">
            <span className="workspace-switcher__mark" aria-hidden="true">
              {workspaceInitials}
            </span>
            <span className="workspace-switcher__copy">
              <span className="workspace-switcher__label">Workspace</span>
              <span className="workspace-switcher__name">{workspace.name}</span>
            </span>
            <IconChevronDown className="workspace-switcher__chevron" />
          </button>
        </div>

        <nav className="sidebar-nav" aria-label="Main navigation">
          <span className="nav-label">Platform</span>
          <ul className="nav-list">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon
              return (
                <li key={item.id}>
                  <NavLink
                    to={item.path}
                    end={item.path === '/'}
                    className={({ isActive }) =>
                      `nav-item${isActive ? ' nav-item--active' : ''}`
                    }
                  >
                    <span className="nav-item__icon">
                      <Icon />
                    </span>
                    <span className="nav-item__label">{item.label}</span>
                  </NavLink>
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="sidebar-user">
          <span className="sidebar-user__avatar" aria-hidden="true">
            {userInitials}
          </span>
          <div className="sidebar-user__copy">
            <span className="sidebar-user__name">{user.name}</span>
            <span className="sidebar-user__role">
              {workspace.role ?? 'Member'}
            </span>
            {logoutError ? (
              <span className="sidebar-user__logout-error">{logoutError}</span>
            ) : null}
          </div>
          <button
            type="button"
            className="btn btn--sm btn--secondary sidebar-user__logout"
            onClick={handleLogout}
            disabled={isLoggingOut}
          >
            {isLoggingOut ? 'Signing out…' : 'Sign out'}
          </button>
        </div>
      </aside>

      <div className="main">
        <header className="header">
          <div className="header-inner">
            <h1 className="header-title">{page.title}</h1>
            <p className="header-description">{page.description}</p>
          </div>
        </header>

        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

function AuthRoute({ auth }) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const nextPath = getSafeNextPath(searchParams.get('next'))

  async function handleLogin(credentials) {
    await auth.login(credentials)
    navigate(nextPath ?? '/', { replace: true })
  }

  async function handleRegister(payload) {
    await auth.register(payload)
    navigate(nextPath ?? '/', { replace: true })
  }

  return <AuthPanel onLogin={handleLogin} onRegister={handleRegister} />
}

function RequireAuth({ auth }) {
  const location = useLocation()

  if (auth.status === 'unauthenticated') {
    return (
      <Navigate
        to={buildAuthPath({ mode: 'login', next: location.pathname })}
        replace
      />
    )
  }

  return <Outlet />
}

function UnknownRoute({ auth }) {
  if (auth.status === 'authenticated') {
    return <Navigate to="/" replace />
  }

  return <Navigate to={buildAuthPath({ mode: 'login' })} replace />
}

function AppRoutes({ auth }) {
  return (
    <Routes>
      <Route
        path="/auth"
        element={
          auth.status === 'authenticated' ? (
            <Navigate to="/" replace />
          ) : (
            <AuthRoute auth={auth} />
          )
        }
      />

      <Route element={<RequireAuth auth={auth} />}>
        <Route
          element={
            <AppShell
              user={auth.user}
              workspace={auth.workspace}
              onLogout={auth.logout}
            />
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="clients" element={<Clients />} />
          <Route path="pipeline" element={<Pipeline />} />
          <Route path="tasks/board" element={<Tasks />} />
          <Route path="tasks" element={<Tasks />} />
          <Route
            path="settings"
            element={
              <Settings
                user={auth.user}
                workspace={auth.workspace}
                onLogout={auth.logout}
              />
            }
          />
        </Route>
      </Route>

      <Route path="*" element={<UnknownRoute auth={auth} />} />
    </Routes>
  )
}

function App() {
  const auth = useAuthSession()

  if (auth.status === 'loading') {
    return (
      <div className="auth-screen auth-screen--loading">Checking session…</div>
    )
  }

  if (auth.status === 'error') {
    return (
      <div className="auth-screen auth-screen--error">
        <p>{auth.error}</p>
        <button type="button" className="btn btn--secondary" onClick={auth.retry}>
          Try again
        </button>
      </div>
    )
  }

  return <AppRoutes auth={auth} />
}

export default App

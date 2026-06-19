import { useState } from 'react'
import AuthPanel from './AuthPanel'
import Clients from './Clients'
import Dashboard from './Dashboard'
import Settings from './Settings'
import Tasks from './Tasks'
import { NAV_ITEMS, PAGES } from './config/navigation'
import useAuthSession from './hooks/useAuthSession'
import { IconChevronDown } from './icons'
import { getInitials } from './utils/format'
import './App.css'

function AppShell({ user, workspace, activePage, onNavigate }) {
  const page = PAGES[activePage]
  const workspaceInitials = workspace ? getInitials(workspace.name) : '—'
  const userInitials = user ? getInitials(user.name) : '—'

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
                  <button
                    type="button"
                    className={`nav-item${activePage === item.id ? ' nav-item--active' : ''}`}
                    onClick={() => onNavigate(item.id)}
                    aria-current={activePage === item.id ? 'page' : undefined}
                  >
                    <span className="nav-item__icon">
                      <Icon />
                    </span>
                    <span className="nav-item__label">{item.label}</span>
                  </button>
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
          </div>
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
          {activePage === 'dashboard' ? (
            <Dashboard />
          ) : activePage === 'clients' ? (
            <Clients />
          ) : activePage === 'tasks' ? (
            <Tasks />
          ) : (
            <Settings />
          )}
        </main>
      </div>
    </div>
  )
}

function App() {
  const [activePage, setActivePage] = useState('dashboard')
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

  if (auth.status === 'unauthenticated') {
    return <AuthPanel onLogin={auth.login} onRegister={auth.register} />
  }

  return (
    <AppShell
      user={auth.user}
      workspace={auth.workspace}
      activePage={activePage}
      onNavigate={setActivePage}
    />
  )
}

export default App

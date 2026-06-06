import { useState } from 'react'
import Clients from './Clients'
import Dashboard from './Dashboard'
import Settings from './Settings'
import Tasks from './Tasks'
import {
  IconCheckSquare,
  IconChevronDown,
  IconLayoutDashboard,
  IconSettings,
  IconUsers,
} from './icons'
import './App.css'

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Overview', icon: IconLayoutDashboard },
  { id: 'clients', label: 'Clients', icon: IconUsers },
  { id: 'tasks', label: 'Tasks', icon: IconCheckSquare },
  { id: 'settings', label: 'Settings', icon: IconSettings },
]

const PAGES = {
  dashboard: {
    title: 'Overview',
    description: 'Pipeline, billable work, and client movement across your studio.',
  },
  clients: {
    title: 'Clients',
    description: 'Retainers, launches, and accounts you\u2019re building for right now.',
  },
  tasks: {
    title: 'Tasks',
    description: 'Sprint work, handoffs, and ship dates across active builds.',
  },
  settings: {
    title: 'Settings',
    description: 'Your profile, studio defaults, alerts, and account security.',
  },
}

function App() {
  const [activePage, setActivePage] = useState('dashboard')
  const page = PAGES[activePage]

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
              CL
            </span>
            <span className="workspace-switcher__copy">
              <span className="workspace-switcher__label">Workspace</span>
              <span className="workspace-switcher__name">Clearline Studio</span>
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
                    onClick={() => setActivePage(item.id)}
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
            AM
          </span>
          <div className="sidebar-user__copy">
            <span className="sidebar-user__name">Alex Morgan</span>
            <span className="sidebar-user__role">Lead Developer</span>
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

export default App

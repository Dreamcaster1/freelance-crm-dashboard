import { useState } from 'react'
import Clients from './Clients'
import Dashboard from './Dashboard'
import Settings from './Settings'
import Tasks from './Tasks'
import './App.css'

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'clients', label: 'Clients' },
  { id: 'tasks', label: 'Tasks' },
  { id: 'settings', label: 'Settings' },
]

const PAGES = {
  dashboard: {
    title: 'Dashboard',
    description: 'Welcome back. Here\u2019s what\u2019s happening across your clients and projects.',
  },
  clients: {
    title: 'Clients',
    description: 'Browse, search, and manage your client accounts.',
  },
  tasks: {
    title: 'Tasks',
    description: 'Track deliverables, deadlines, and priorities across clients.',
  },
  settings: {
    title: 'Settings',
    description: 'Manage your profile, workspace, notifications, and security.',
  },
}

function App() {
  const [activePage, setActivePage] = useState('dashboard')
  const page = PAGES[activePage]

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span className="brand-mark" aria-hidden="true" />
          <span className="brand-name">Freelance CRM</span>
        </div>

        <nav className="sidebar-nav" aria-label="Main navigation">
          <span className="nav-label">Menu</span>
          <ul className="nav-list">
            {NAV_ITEMS.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  className={`nav-item${activePage === item.id ? ' nav-item--active' : ''}`}
                  onClick={() => setActivePage(item.id)}
                  aria-current={activePage === item.id ? 'page' : undefined}
                >
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>
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

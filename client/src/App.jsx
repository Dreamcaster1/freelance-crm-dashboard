import { useState } from 'react'
import Clients from './Clients'
import Dashboard from './Dashboard'
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
    description: 'Track what needs to be done.',
    stats: [
      { label: 'In progress', value: '5' },
      { label: 'Due soon', value: '3' },
      { label: 'Completed', value: '42' },
    ],
    cards: [
      {
        title: 'Task board',
        body: 'Organize work by status, priority, and due date.',
      },
      {
        title: 'Focus list',
        body: 'Your highest-priority items for today and this week.',
      },
    ],
  },
  settings: {
    title: 'Settings',
    description: 'Configure your workspace.',
    stats: [
      { label: 'Workspace', value: 'Personal' },
      { label: 'Plan', value: 'Free' },
      { label: 'Members', value: '1' },
    ],
    cards: [
      {
        title: 'General',
        body: 'Profile, timezone, and display preferences for your account.',
      },
      {
        title: 'Notifications',
        body: 'Email and in-app alerts for tasks, clients, and deadlines.',
      },
    ],
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
          ) : (
            <>
              <section className="stats" aria-label="Summary">
                {page.stats.map((stat) => (
                  <article key={stat.label} className="stat-card">
                    <span className="stat-label">{stat.label}</span>
                    <span className="stat-value">{stat.value}</span>
                  </article>
                ))}
              </section>

              <section className="card-grid" aria-label="Content">
                {page.cards.map((card) => (
                  <article key={card.title} className="card">
                    <h2 className="card-title">{card.title}</h2>
                    <p className="card-body">{card.body}</p>
                  </article>
                ))}
              </section>
            </>
          )}
        </main>
      </div>
    </div>
  )
}

export default App

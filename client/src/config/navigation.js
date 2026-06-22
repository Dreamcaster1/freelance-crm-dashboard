import {
  IconCheckSquare,
  IconLayoutDashboard,
  IconSettings,
  IconUsers,
} from '../icons'

export const NAV_ITEMS = [
  { id: 'dashboard', label: 'Overview', icon: IconLayoutDashboard },
  { id: 'clients', label: 'Clients', icon: IconUsers },
  { id: 'tasks', label: 'Tasks', icon: IconCheckSquare },
  { id: 'settings', label: 'Settings', icon: IconSettings },
]

export const PAGES = {
  dashboard: {
    title: 'Overview',
    description: 'Client accounts, open tasks, and project value across your studio.',
  },
  clients: {
    title: 'Clients',
    description: 'Manage client accounts, contacts, and project details.',
  },
  tasks: {
    title: 'Tasks',
    description: 'Track deliverables, priorities, and due dates across your workspace.',
  },
  settings: {
    title: 'Settings',
    description: 'Your profile, workspace preferences, and account security.',
  },
}

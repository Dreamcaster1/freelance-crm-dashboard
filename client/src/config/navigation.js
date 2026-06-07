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

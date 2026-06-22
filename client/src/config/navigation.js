import {
  IconBriefcase,
  IconCheckSquare,
  IconLayoutDashboard,
  IconSettings,
  IconUsers,
} from '../icons'

export const NAV_ITEMS = [
  { id: 'dashboard', path: '/', label: 'Overview', icon: IconLayoutDashboard },
  { id: 'clients', path: '/clients', label: 'Clients', icon: IconUsers },
  { id: 'pipeline', path: '/pipeline', label: 'Pipeline', icon: IconBriefcase },
  { id: 'tasks', path: '/tasks', label: 'Tasks', icon: IconCheckSquare },
  { id: 'settings', path: '/settings', label: 'Settings', icon: IconSettings },
]

export function getPageKeyFromPath(pathname) {
  const match = NAV_ITEMS.find(
    (item) => item.path !== '/' && pathname.startsWith(item.path),
  )
  return match?.id ?? 'dashboard'
}

export const PAGES = {
  dashboard: {
    title: 'Overview',
    description: 'Client accounts, open tasks, and project value across your studio.',
  },
  clients: {
    title: 'Clients',
    description: 'Manage client accounts, contacts, and project details.',
  },
  pipeline: {
    title: 'Pipeline',
    description: 'Track commercial progress across leads, proposals, delivery, and completion.',
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

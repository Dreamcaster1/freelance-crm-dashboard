import {
  IconBriefcase,
  IconCheckSquare,
  IconDollar,
  IconUsers,
} from '../icons'

import { getTaskPriorityBadge } from '../utils/badges'

export const STATS = [
  {
    label: 'Active clients',
    value: '12',
    detail: '2 new inquiries this month',
    icon: IconUsers,
    tone: 'accent',
  },
  {
    label: 'Open tasks',
    value: '8',
    detail: '3 shipping this week',
    icon: IconCheckSquare,
    tone: 'default',
  },
  {
    label: 'Billed this month',
    value: '$4,200',
    detail: '+18% vs April',
    icon: IconDollar,
    tone: 'success',
  },
  {
    label: 'Live builds',
    value: '6',
    detail: '2 in client review',
    icon: IconBriefcase,
    tone: 'default',
  },
]

export const RECENT_ACTIVITY = [
  {
    id: 'a1',
    type: 'project',
    title: 'Staging deploy pushed for sprint 4',
    client: 'Relay Apps',
    time: '2 hours ago',
    badge: { label: 'Deployed', variant: 'info' },
  },
  {
    id: 'a2',
    type: 'task',
    title: 'Homepage copy approved',
    client: 'Harbor & Co.',
    time: '5 hours ago',
    badge: { label: 'Signed off', variant: 'success' },
  },
  {
    id: 'a3',
    type: 'message',
    title: 'Checkout bug report from QA',
    client: 'Patchwork Foods',
    time: 'Yesterday',
    badge: { label: 'Support', variant: 'neutral' },
  },
  {
    id: 'a4',
    type: 'project',
    title: 'DNS cutover completed',
    client: 'Vaultline Security',
    time: 'Yesterday',
    badge: { label: 'Live', variant: 'success' },
  },
  {
    id: 'a5',
    type: 'invoice',
    title: 'June retainer marked paid',
    client: 'Kite & Anchor',
    time: 'Jun 4',
    badge: { label: 'Paid', variant: 'success' },
  },
]

export const UPCOMING_TASKS = [
  {
    id: 't1',
    title: 'Ship homepage v2 to staging',
    client: 'Relay Apps',
    due: 'Tomorrow',
    badge: getTaskPriorityBadge('high'),
    status: { label: 'In progress', variant: 'info' },
  },
  {
    id: 't2',
    title: 'Send sprint recap and loom walkthrough',
    client: 'Patchwork Foods',
    due: 'Jun 8',
    badge: getTaskPriorityBadge('medium'),
    status: { label: 'Pending', variant: 'neutral' },
  },
  {
    id: 't3',
    title: 'Review revised scope for Phase 2',
    client: 'Harbor & Co.',
    due: 'Jun 9',
    badge: getTaskPriorityBadge('medium'),
    status: { label: 'In progress', variant: 'info' },
  },
  {
    id: 't4',
    title: 'Export production assets for launch',
    client: 'Vaultline Security',
    due: 'Jun 10',
    badge: getTaskPriorityBadge('low'),
    status: { label: 'Pending', variant: 'neutral' },
  },
  {
    id: 't5',
    title: 'Book content walkthrough with marketing',
    client: 'Kite & Anchor',
    due: 'Jun 12',
    badge: getTaskPriorityBadge('low'),
    status: { label: 'Scheduled', variant: 'success' },
  },
]

export const INITIAL_TASKS = [
  {
    id: 't1',
    name: 'Ship homepage v2 to staging',
    client: 'Relay Apps',
    status: 'in-progress',
    statusBadge: { label: 'In Progress', variant: 'info' },
    priority: { label: 'High', variant: 'danger' },
    dueDate: 'Jun 7, 2026',
  },
  {
    id: 't2',
    name: 'Send sprint recap and loom walkthrough',
    client: 'Patchwork Foods',
    status: 'pending',
    statusBadge: { label: 'Pending', variant: 'neutral' },
    priority: { label: 'Medium', variant: 'warning' },
    dueDate: 'Jun 8, 2026',
  },
  {
    id: 't3',
    name: 'Review revised scope for Phase 2',
    client: 'Harbor & Co.',
    status: 'in-progress',
    statusBadge: { label: 'In Progress', variant: 'info' },
    priority: { label: 'Medium', variant: 'warning' },
    dueDate: 'Jun 9, 2026',
  },
  {
    id: 't4',
    name: 'Export production assets for launch',
    client: 'Vaultline Security',
    status: 'pending',
    statusBadge: { label: 'Pending', variant: 'neutral' },
    priority: { label: 'Low', variant: 'neutral' },
    dueDate: 'Jun 10, 2026',
  },
  {
    id: 't5',
    name: 'Book content walkthrough with marketing',
    client: 'Kite & Anchor',
    status: 'pending',
    statusBadge: { label: 'Pending', variant: 'neutral' },
    priority: { label: 'Low', variant: 'neutral' },
    dueDate: 'Jun 12, 2026',
  },
  {
    id: 't6',
    name: 'Build shared component library',
    client: 'Relay Apps',
    status: 'in-progress',
    statusBadge: { label: 'In Progress', variant: 'info' },
    priority: { label: 'High', variant: 'danger' },
    dueDate: 'Jun 14, 2026',
  },
  {
    id: 't7',
    name: 'Draft proposal for analytics dashboard',
    client: 'Lumen Analytics',
    status: 'in-progress',
    statusBadge: { label: 'In Progress', variant: 'info' },
    priority: { label: 'Medium', variant: 'warning' },
    dueDate: 'Jun 15, 2026',
  },
  {
    id: 't8',
    name: 'Scope one-page pitch site',
    client: 'Atlas Ventures',
    status: 'pending',
    statusBadge: { label: 'Pending', variant: 'neutral' },
    priority: { label: 'Low', variant: 'neutral' },
    dueDate: 'Jun 18, 2026',
  },
  {
    id: 't9',
    name: 'Homepage responsive QA passed',
    client: 'Patchwork Foods',
    status: 'completed',
    statusBadge: { label: 'Completed', variant: 'success' },
    priority: { label: 'High', variant: 'danger' },
    dueDate: 'Jun 5, 2026',
  },
  {
    id: 't10',
    name: 'Invoice #1042 sent for May retainer',
    client: 'Relay Apps',
    status: 'completed',
    statusBadge: { label: 'Completed', variant: 'success' },
    priority: { label: 'Medium', variant: 'warning' },
    dueDate: 'Jun 4, 2026',
  },
  {
    id: 't11',
    name: 'Confirm June retainer payment',
    client: 'Kite & Anchor',
    status: 'completed',
    statusBadge: { label: 'Completed', variant: 'success' },
    priority: { label: 'Low', variant: 'neutral' },
    dueDate: 'Jun 2, 2026',
  },
  {
    id: 't12',
    name: 'Hand off design tokens to dev',
    client: 'Vaultline Security',
    status: 'completed',
    statusBadge: { label: 'Completed', variant: 'success' },
    priority: { label: 'Medium', variant: 'warning' },
    dueDate: 'May 28, 2026',
  },
  {
    id: 't13',
    name: 'Reconcile May contractor payouts',
    client: 'Clearline Studio',
    status: 'completed',
    statusBadge: { label: 'Completed', variant: 'success' },
    priority: { label: 'Low', variant: 'neutral' },
    dueDate: 'May 31, 2026',
  },
  {
    id: 't14',
    name: 'Wire store locator map integration',
    client: 'Fieldstone Retail',
    status: 'in-progress',
    statusBadge: { label: 'In Progress', variant: 'info' },
    priority: { label: 'Medium', variant: 'warning' },
    dueDate: 'Jun 20, 2026',
  },
]

export const TASK_DETAILS = {
  t1: {
    description:
      'Deploy homepage v2 to Relay Apps staging after final QA sign-off. Coordinate with Sarah on smoke test window before sharing the preview link.',
    activity: [
      {
        id: 't1-a1',
        type: 'task',
        title: 'Hero animation polish merged to main',
        time: '3 hours ago',
      },
      {
        id: 't1-a2',
        type: 'message',
        title: 'Sarah confirmed staging window for tomorrow',
        time: 'Yesterday',
      },
      {
        id: 't1-a3',
        type: 'project',
        title: 'Build pipeline green on sprint-4 branch',
        time: 'Jun 4',
      },
    ],
  },
  t2: {
    description:
      'Record a short Loom walkthrough of sprint deliverables and send recap email to Marcus with links to staging and the updated backlog.',
    activity: [
      {
        id: 't2-a1',
        type: 'message',
        title: 'Marcus requested recap before Friday standup',
        time: '5 hours ago',
      },
      {
        id: 't2-a2',
        type: 'task',
        title: 'Sprint notes draft started in Notion',
        time: 'Yesterday',
      },
    ],
  },
  t3: {
    description:
      'Review Harbor & Co. Phase 2 scope revisions against the original SOW. Flag any timeline or budget implications before the client call.',
    activity: [
      {
        id: 't3-a1',
        type: 'message',
        title: 'Elena shared revised scope doc',
        time: 'Yesterday',
      },
      {
        id: 't3-a2',
        type: 'task',
        title: 'Internal review scheduled for Monday',
        time: 'Jun 3',
      },
    ],
  },
  t4: {
    description:
      'Package and export production-ready assets for Vaultline launch — logos, OG images, favicon set, and CMS upload checklist.',
    activity: [
      {
        id: 't4-a1',
        type: 'project',
        title: 'DNS cutover completed',
        time: 'Yesterday',
      },
      {
        id: 't4-a2',
        type: 'task',
        title: 'Asset manifest template prepared',
        time: 'Jun 4',
      },
    ],
  },
  t5: {
    description:
      'Schedule a 30-minute content walkthrough with Kite & Anchor marketing. Align on tone for case study pages and blog templates.',
    activity: [
      {
        id: 't5-a1',
        type: 'message',
        title: 'Priya shared marketing calendar',
        time: 'Jun 2',
      },
      {
        id: 't5-a2',
        type: 'task',
        title: 'Agenda draft sent for review',
        time: 'Jun 1',
      },
    ],
  },
  t6: {
    description:
      'Extract shared UI primitives from Relay Apps codebase into a documented component library with Storybook entries for buttons, forms, and layout.',
    activity: [
      {
        id: 't6-a1',
        type: 'task',
        title: 'Button and input tokens mapped',
        time: '4 hours ago',
      },
      {
        id: 't6-a2',
        type: 'project',
        title: 'Storybook workspace scaffolded',
        time: 'Jun 3',
      },
    ],
  },
  t7: {
    description:
      'Draft a proposal for Lumen Analytics dashboard MVP — scope, timeline, and phased deliverables for the discovery follow-up.',
    activity: [
      {
        id: 't7-a1',
        type: 'message',
        title: 'David shared sample data exports',
        time: 'Jun 1',
      },
      {
        id: 't7-a2',
        type: 'task',
        title: 'Proposal outline started',
        time: 'May 31',
      },
    ],
  },
  t8: {
    description:
      'Scope a one-page pitch site for Atlas Ventures — single-scroll layout, partner logos, and a lightweight contact funnel.',
    activity: [
      {
        id: 't8-a1',
        type: 'message',
        title: 'Rachel sent reference sites',
        time: 'May 30',
      },
      {
        id: 't8-a2',
        type: 'task',
        title: 'Wireframe sketch shared internally',
        time: 'May 29',
      },
    ],
  },
  t9: {
    description:
      'Homepage responsive QA completed across breakpoints. All critical issues resolved and signed off by Patchwork Foods QA.',
    activity: [
      {
        id: 't9-a1',
        type: 'task',
        title: 'Tablet layout fixes verified',
        time: 'Jun 5',
      },
      {
        id: 't9-a2',
        type: 'message',
        title: 'Marcus approved responsive pass',
        time: 'Jun 4',
      },
    ],
  },
  t10: {
    description:
      'May retainer invoice #1042 generated and sent to Relay Apps accounts payable with line items for sprint 3 and 4.',
    activity: [
      {
        id: 't10-a1',
        type: 'invoice',
        title: 'Invoice #1042 marked sent',
        time: 'Jun 4',
      },
      {
        id: 't10-a2',
        type: 'message',
        title: 'Sarah confirmed receipt',
        time: 'Jun 3',
      },
    ],
  },
  t11: {
    description:
      'Follow up on June retainer payment from Kite & Anchor. Reconcile against the signed agreement and update studio cashflow sheet.',
    activity: [
      {
        id: 't11-a1',
        type: 'invoice',
        title: 'June retainer marked paid',
        time: 'Jun 2',
      },
      {
        id: 't11-a2',
        type: 'task',
        title: 'Payment logged in studio ledger',
        time: 'Jun 2',
      },
    ],
  },
  t12: {
    description:
      'Hand off finalized design tokens and component specs to Vaultline dev team. Include Figma links and CSS variable reference.',
    activity: [
      {
        id: 't12-a1',
        type: 'task',
        title: 'Token export generated from Figma',
        time: 'May 28',
      },
      {
        id: 't12-a2',
        type: 'message',
        title: 'James acknowledged handoff package',
        time: 'May 27',
      },
    ],
  },
  t13: {
    description:
      'Reconcile May contractor payouts against logged hours. Confirm all invoices match Harvest exports before closing the month.',
    activity: [
      {
        id: 't13-a1',
        type: 'invoice',
        title: 'Contractor invoices matched to Harvest',
        time: 'May 31',
      },
      {
        id: 't13-a2',
        type: 'task',
        title: 'Studio ledger updated for May',
        time: 'May 30',
      },
    ],
  },
  t14: {
    description:
      'Integrate store locator map for Fieldstone Retail — geocoded locations, filter by region, and mobile-friendly marker clusters.',
    activity: [
      {
        id: 't14-a1',
        type: 'project',
        title: 'Map API credentials provisioned',
        time: 'Jun 1',
      },
      {
        id: 't14-a2',
        type: 'task',
        title: 'Location data CSV validated',
        time: 'May 29',
      },
      {
        id: 't14-a3',
        type: 'message',
        title: 'Amira confirmed store list is final',
        time: 'May 28',
      },
    ],
  },
}

export const DEFAULT_DETAILS = {
  description: 'No notes added for this task yet.',
  activity: [
    {
      id: 'default-a1',
      type: 'task',
      title: 'Task added to workspace',
      time: 'Just now',
    },
  ],
}

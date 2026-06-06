const iconProps = {
  width: 16,
  height: 16,
  viewBox: '0 0 16 16',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.25,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
}

export function IconUsers(props) {
  return (
    <svg {...iconProps} {...props}>
      <path d="M11 14v-1.5A2.5 2.5 0 0 0 8.5 10h-1A2.5 2.5 0 0 0 5 12.5V14" />
      <circle cx="8" cy="5" r="2.5" />
      <path d="M3 14v-1a3 3 0 0 1 3-3" />
      <path d="M13 14v-1a3 3 0 0 0-2.35-2.94" />
      <path d="M10.5 3.1A3 3 0 0 1 13 6v1" />
    </svg>
  )
}

export function IconCheckSquare(props) {
  return (
    <svg {...iconProps} {...props}>
      <rect x="2.5" y="2.5" width="11" height="11" rx="2" />
      <path d="M5.5 8l2 2 4-4.5" />
    </svg>
  )
}

export function IconDollar(props) {
  return (
    <svg {...iconProps} {...props}>
      <path d="M8 2v12" />
      <path d="M10.5 4.5H6.75A1.75 1.75 0 0 0 5 6.25a1.75 1.75 0 0 0 1.75 1.75H9.25A1.75 1.75 0 0 1 11 9.75 1.75 1.75 0 0 1 9.25 11.5H5.5" />
    </svg>
  )
}

export function IconBriefcase(props) {
  return (
    <svg {...iconProps} {...props}>
      <rect x="2" y="5.5" width="12" height="8" rx="1.5" />
      <path d="M5.5 5.5V4.5A1.5 1.5 0 0 1 7 3h2a1.5 1.5 0 0 1 1.5 1.5v1" />
      <path d="M2 9h12" />
    </svg>
  )
}

export function IconActivity(props) {
  return (
    <svg {...iconProps} {...props}>
      <path d="M2 12l3.5-4 2.5 2.5L10 6l4 4" />
    </svg>
  )
}

export function IconCalendar(props) {
  return (
    <svg {...iconProps} {...props}>
      <rect x="2.5" y="3.5" width="11" height="10" rx="1.5" />
      <path d="M2.5 6.5h11" />
      <path d="M5.5 2v2" />
      <path d="M10.5 2v2" />
    </svg>
  )
}

export function IconFile(props) {
  return (
    <svg {...iconProps} {...props}>
      <path d="M9 2H4.5A1.5 1.5 0 0 0 3 3.5v9A1.5 1.5 0 0 0 4.5 14h7A1.5 1.5 0 0 0 13 12.5V6L9 2z" />
      <path d="M9 2v4h4" />
    </svg>
  )
}

export function IconMessage(props) {
  return (
    <svg {...iconProps} {...props}>
      <path d="M3 3.5h10A1.5 1.5 0 0 1 14.5 5v5A1.5 1.5 0 0 1 13 11.5H6l-3 2.5V3.5z" />
    </svg>
  )
}

export function IconCheck(props) {
  return (
    <svg {...iconProps} {...props}>
      <circle cx="8" cy="8" r="5.5" />
      <path d="M5.5 8l1.75 1.75L10.5 6.25" />
    </svg>
  )
}

export function IconSearch(props) {
  return (
    <svg {...iconProps} {...props}>
      <circle cx="7" cy="7" r="4.25" />
      <path d="M10.5 10.5L14 14" />
    </svg>
  )
}

export function IconPlus(props) {
  return (
    <svg {...iconProps} {...props}>
      <path d="M8 3.5v9" />
      <path d="M3.5 8h9" />
    </svg>
  )
}

export function IconLayoutDashboard(props) {
  return (
    <svg {...iconProps} {...props}>
      <rect x="2.5" y="2.5" width="4.75" height="4.75" rx="1" />
      <rect x="8.75" y="2.5" width="4.75" height="4.75" rx="1" />
      <rect x="2.5" y="8.75" width="4.75" height="4.75" rx="1" />
      <rect x="8.75" y="8.75" width="4.75" height="4.75" rx="1" />
    </svg>
  )
}

export function IconSettings(props) {
  return (
    <svg {...iconProps} {...props}>
      <circle cx="8" cy="8" r="2" />
      <path d="M8 2.75v1.5M8 11.75v1.5M2.75 8H4.25M11.75 8h1.5M4.34 4.34l1.06 1.06M10.6 10.6l1.06 1.06M4.34 11.66l1.06-1.06M10.6 5.4l1.06-1.06" />
    </svg>
  )
}

export function IconChevronDown(props) {
  return (
    <svg {...iconProps} {...props}>
      <path d="M4 6l4 4 4-4" />
    </svg>
  )
}

export function IconClock(props) {
  return (
    <svg {...iconProps} {...props}>
      <circle cx="8" cy="8" r="5.5" />
      <path d="M8 5v3l2 1.5" />
    </svg>
  )
}

const ACTIVITY_ICONS = {
  invoice: IconFile,
  message: IconMessage,
  task: IconCheck,
  project: IconBriefcase,
}

export function ActivityIcon({ type, className }) {
  const Icon = ACTIVITY_ICONS[type] ?? IconActivity
  return <Icon className={className} />
}

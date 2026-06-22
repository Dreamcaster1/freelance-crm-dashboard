export const CLIENT_STATUS_OPTIONS = [
  { value: 'active', label: 'Active', variant: 'success' },
  { value: 'lead', label: 'Lead', variant: 'info' },
  { value: 'on-hold', label: 'On hold', variant: 'warning' },
  { value: 'at-risk', label: 'At risk', variant: 'danger' },
  { value: 'inactive', label: 'Inactive', variant: 'neutral' },
]

export const TASK_STATUS_OPTIONS = [
  { value: 'in-progress', label: 'In Progress', variant: 'info' },
  { value: 'pending', label: 'Pending', variant: 'neutral' },
  { value: 'completed', label: 'Completed', variant: 'success' },
]

export const TASK_PRIORITY_OPTIONS = [
  { value: 'high', label: 'High', variant: 'danger' },
  { value: 'medium', label: 'Medium', variant: 'warning' },
  { value: 'low', label: 'Low', variant: 'neutral' },
]

function getOptionValue(options, badgeOrValue, fallbackValue) {
  if (typeof badgeOrValue === 'string') return badgeOrValue

  const option = options.find((item) => item.label === badgeOrValue?.label)
  return option?.value ?? fallbackValue
}

function getBadge(options, badgeOrValue, fallbackValue) {
  const value = getOptionValue(options, badgeOrValue, fallbackValue)
  const option = options.find((item) => item.value === value)
  const fallback = options.find((item) => item.value === fallbackValue)

  return {
    label: option?.label ?? fallback.label,
    variant: option?.variant ?? fallback.variant,
  }
}

export function getClientStatusBadge(status) {
  return getBadge(CLIENT_STATUS_OPTIONS, status, 'active')
}

export function getTaskStatusBadge(status) {
  return getBadge(TASK_STATUS_OPTIONS, status, 'pending')
}

export function getTaskPriorityBadge(priority) {
  return getBadge(TASK_PRIORITY_OPTIONS, priority, 'medium')
}

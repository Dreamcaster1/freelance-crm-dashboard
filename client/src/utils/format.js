export function getInitials(company) {
  return company
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase()
}

export function formatCurrency(amount) {
  if (amount === 0) return '—'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatRelativeActivity(isoString) {
  if (!isoString) return '—'

  const date = new Date(isoString)
  if (Number.isNaN(date.getTime())) return '—'

  const now = Date.now()
  const diffMs = now - date.getTime()

  if (diffMs < 0) {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const diffMinutes = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMinutes < 1) return 'Just now'
  if (diffMinutes < 60) {
    return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`
  }
  if (diffHours < 24) {
    return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`
  }
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function formatDueDate(dateValue) {
  if (!dateValue) return '—'

  const date = new Date(`${dateValue}T00:00:00`)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function formatGBP(cents) {
  const amount = (Number.isFinite(cents) ? cents : 0) / 100
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function parseDateOnlyInt(yyyymmdd) {
  if (!yyyymmdd || !/^\d{4}-\d{2}-\d{2}$/.test(yyyymmdd)) return null
  const [year, month, day] = yyyymmdd.split('-').map(Number)
  return year * 10000 + month * 100 + day
}

export function todayDateInt() {
  const d = new Date()
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate()
}

export function futureDateInt(daysAhead) {
  const d = new Date()
  d.setDate(d.getDate() + daysAhead)
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate()
}

export function parseDueDateToInput(dueDate) {
  if (!dueDate || dueDate === '—') return ''

  if (/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) return dueDate

  const parsed = new Date(dueDate)
  if (Number.isNaN(parsed.getTime())) return ''

  return parsed.toISOString().slice(0, 10)
}

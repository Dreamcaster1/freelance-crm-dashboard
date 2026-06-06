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

export function formatDueDate(dateValue) {
  if (!dateValue) return '—'

  const date = new Date(`${dateValue}T00:00:00`)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function parseDueDateToInput(dueDate) {
  if (!dueDate || dueDate === '—') return ''

  const parsed = new Date(dueDate)
  if (Number.isNaN(parsed.getTime())) return ''

  return parsed.toISOString().slice(0, 10)
}

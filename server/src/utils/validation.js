export function assertJsonObject(body) {
  if (body == null || typeof body !== 'object' || Array.isArray(body)) {
    return 'Request body must be a JSON object.'
  }

  return null
}

export function validateCalendarDate(value, fieldName = 'due_date') {
  if (value === null || value === undefined) {
    return null
  }

  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return `${fieldName} must be a valid date in YYYY-MM-DD format or null.`
  }

  const [year, month, day] = value.split('-').map(Number)
  const parsed = new Date(Date.UTC(year, month - 1, day))

  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    return `${fieldName} must be a valid date in YYYY-MM-DD format or null.`
  }

  return null
}

const ISO_TIMESTAMP_PATTERN =
  /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{1,3})?(Z|[+-]\d{2}:\d{2})?)?$/

export function validateDateTimeOrNull(value, fieldName = 'last_activity_at') {
  if (value === null) {
    return null
  }

  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      return `${fieldName} must be a valid ISO timestamp or null.`
    }

    const parsed = new Date(value)
    if (Number.isNaN(parsed.getTime())) {
      return `${fieldName} must be a valid ISO timestamp or null.`
    }

    return null
  }

  if (typeof value !== 'string') {
    return `${fieldName} must be a valid ISO timestamp or null.`
  }

  const trimmed = value.trim()
  if (!trimmed) {
    return `${fieldName} must be a valid ISO timestamp or null.`
  }

  if (!ISO_TIMESTAMP_PATTERN.test(trimmed)) {
    return `${fieldName} must be a valid ISO timestamp or null.`
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return validateCalendarDate(trimmed, fieldName)
  }

  const parsed = new Date(trimmed)
  if (Number.isNaN(parsed.getTime())) {
    return `${fieldName} must be a valid ISO timestamp or null.`
  }

  return null
}

export function parseDateTimeOrNull(value, fieldName = 'last_activity_at') {
  const error = validateDateTimeOrNull(value, fieldName)
  if (error) {
    return { error }
  }

  if (value === null) {
    return { value: null }
  }

  return { value: new Date(value) }
}

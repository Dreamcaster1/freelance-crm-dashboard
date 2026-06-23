import { formatRelativeActivity } from './format.js'
import { PIPELINE_STAGE_VALUES } from './badges.js'

export const MAX_PROJECT_VALUE_CENTS = 4294967295

// Non-negative decimal pounds: digits with optional .XX (no leading-dot shorthand).
const PROJECT_VALUE_PATTERN = /^\d+(\.\d{1,2})?$/

function parseValidatedProjectValueDollars(value) {
  if (!value?.trim()) return 0

  const trimmed = value.trim()
  if (!PROJECT_VALUE_PATTERN.test(trimmed)) return null

  const dollars = Number(trimmed)
  if (!Number.isFinite(dollars) || dollars < 0) return null

  return dollars
}

export function validateProjectValueDollars(value) {
  if (!value?.trim()) return null

  const trimmed = value.trim()

  if (!PROJECT_VALUE_PATTERN.test(trimmed)) {
    return 'Project value must be a valid amount.'
  }

  const dollars = Number(trimmed)
  if (!Number.isFinite(dollars) || dollars < 0) {
    return 'Project value must be a valid amount.'
  }

  const cents = Math.round(dollars * 100)
  if (cents > MAX_PROJECT_VALUE_CENTS) {
    return 'Project value is too large.'
  }

  return null
}

export function normalizePipelineStage(value) {
  if (typeof value === 'string' && PIPELINE_STAGE_VALUES.includes(value)) {
    return value
  }
  return null
}

export function mapClientFromApi(apiClient) {
  return {
    id: apiClient.id,
    company: apiClient.company,
    contact: apiClient.contactName,
    email: apiClient.email,
    status: apiClient.status,
    pipelineStage: normalizePipelineStage(apiClient.pipelineStage),
    projectValue: apiClient.projectValueCents / 100,
    projectValueCents: apiClient.projectValueCents,
    lastActivity: formatRelativeActivity(apiClient.lastActivityAt),
    lastActivityAt: apiClient.lastActivityAt,
    updatedAt: apiClient.updatedAt,
  }
}

export function mapClientsFromApi(apiClients) {
  return apiClients.map(mapClientFromApi)
}

export function mapClientFormToApiPayload(form) {
  const dollars = parseValidatedProjectValueDollars(form.projectValue)
  const projectValueCents =
    dollars === null ? null : Math.round(dollars * 100)

  return {
    company: form.company.trim(),
    contact_name: form.contact.trim(),
    email: form.email.trim(),
    status: form.status,
    pipeline_stage: form.pipelineStage,
    project_value_cents: projectValueCents ?? 0,
  }
}

export function mapClientToForm(client) {
  return {
    company: client.company,
    contact: client.contact,
    email: client.email,
    status: client.status,
    pipelineStage: client.pipelineStage ?? 'lead',
    projectValue: client.projectValue ? String(client.projectValue) : '',
  }
}

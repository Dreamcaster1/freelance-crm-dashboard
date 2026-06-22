function formatIsoDateTimeOrNull(value) {
  if (value == null) {
    return null
  }

  const parsed = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return null
  }

  return parsed.toISOString()
}

export function mapClientResponse(client) {
  return {
    id: client.id,
    workspaceId: client.workspace_id,
    company: client.company,
    contactName: client.contact_name,
    email: client.email,
    status: client.status,
    pipelineStage: client.pipeline_stage,
    projectValueCents: client.project_value_cents,
    lastActivityAt: formatIsoDateTimeOrNull(client.last_activity_at),
    createdAt: client.created_at,
    updatedAt: client.updated_at,
  }
}

export function mapClientResponses(clients) {
  return clients.map(mapClientResponse)
}

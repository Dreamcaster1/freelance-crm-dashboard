export function mapClientResponse(client) {
  return {
    id: client.id,
    workspaceId: client.workspace_id,
    company: client.company,
    contactName: client.contact_name,
    email: client.email,
    status: client.status,
    projectValueCents: client.project_value_cents,
    lastActivityAt: client.last_activity_at,
    createdAt: client.created_at,
    updatedAt: client.updated_at,
  }
}

export function mapClientResponses(clients) {
  return clients.map(mapClientResponse)
}

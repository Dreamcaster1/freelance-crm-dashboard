function parseMetadata(rawMetadata) {
  if (rawMetadata == null) {
    return null
  }

  if (typeof rawMetadata === 'object') {
    return rawMetadata
  }

  if (typeof rawMetadata !== 'string') {
    return null
  }

  try {
    return JSON.parse(rawMetadata)
  } catch {
    return null
  }
}

export function mapActivityResponse(activity) {
  return {
    id: activity.id,
    workspaceId: activity.workspace_id,
    actorUserId: activity.actor_user_id,
    actorName: activity.actor_name,
    entityType: activity.entity_type,
    entityId: activity.entity_id,
    eventType: activity.event_type,
    title: activity.title,
    description: activity.description,
    metadata: parseMetadata(activity.metadata_json),
    createdAt: activity.created_at,
  }
}

export function mapActivityResponses(rows) {
  return rows.map(mapActivityResponse)
}

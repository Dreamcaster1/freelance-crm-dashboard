import { createActivityEvent } from '../models/activityModel.js'

export async function recordActivityEvent({
  workspaceId,
  actorUserId = null,
  entityType,
  entityId = null,
  eventType,
  title,
  description = null,
  metadata = null,
}) {
  if (!workspaceId || !entityType || !eventType || !title) {
    return
  }

  try {
    await createActivityEvent({
      workspaceId,
      actorUserId,
      entityType,
      entityId,
      eventType,
      title,
      description,
      metadataJson: metadata ? JSON.stringify(metadata) : null,
    })
  } catch (error) {
    console.error('Failed to record activity event', error)
  }
}

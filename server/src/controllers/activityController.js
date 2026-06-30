import { findRecentActivityByWorkspace } from '../models/activityModel.js'
import { mapActivityResponses } from '../utils/activityMapper.js'

const DEFAULT_LIMIT = 10
const MAX_LIMIT = 50

function parseLimit(rawLimit) {
  if (rawLimit === undefined) {
    return DEFAULT_LIMIT
  }

  const parsed = Number(rawLimit)
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null
  }

  return Math.min(parsed, MAX_LIMIT)
}

export async function listRecentActivity(req, res) {
  const workspaceId = req.session.workspaceId
  const limit = parseLimit(req.query.limit)

  if (!limit) {
    return res.status(400).json({
      ok: false,
      error: `limit must be a positive integer between 1 and ${MAX_LIMIT}.`,
    })
  }

  const events = await findRecentActivityByWorkspace(workspaceId, limit)

  return res.json({
    ok: true,
    events: mapActivityResponses(events),
  })
}

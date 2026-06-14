export function requireAuth(req, res, next) {
  if (!req.session?.userId || !req.session?.workspaceId) {
    return res.status(401).json({
      ok: false,
      error: 'Unauthorized',
    })
  }

  next()
}

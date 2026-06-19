export function errorMiddleware(err, req, res, next) {
  if (res.headersSent) {
    return next(err)
  }

  console.error('[ClientFlow API]', err)

  return res.status(500).json({
    ok: false,
    error: 'Internal server error.',
  })
}

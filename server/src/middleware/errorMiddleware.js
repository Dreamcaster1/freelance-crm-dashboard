function isMalformedJsonError(err) {
  if (err?.type === 'entity.parse.failed') {
    return true
  }

  return (
    err instanceof SyntaxError &&
    (err.status === 400 || err.statusCode === 400) &&
    Object.prototype.hasOwnProperty.call(err, 'body')
  )
}

export function errorMiddleware(err, req, res, next) {
  if (res.headersSent) {
    return next(err)
  }

  if (isMalformedJsonError(err)) {
    return res.status(400).json({
      ok: false,
      error: 'Invalid JSON body.',
    })
  }

  console.error('[ClientFlow API]', err)

  return res.status(500).json({
    ok: false,
    error: 'Internal server error.',
  })
}

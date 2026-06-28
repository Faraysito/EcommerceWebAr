const HTTP_STATUS = {
  ok: 200,
  created: 201,
  noContent: 204,
  badRequest: 400,
  unauthorized: 401,
  notFound: 404,
  conflict: 409,
  // NUEVO: usado por el rate limiter.
  tooManyRequests: 429,
  internalServerError: 500
}

export { HTTP_STATUS }

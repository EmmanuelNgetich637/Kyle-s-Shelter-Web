export function notFoundHandler(req, res, next) {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
}

export function errorHandler(err, req, res, next) {
  console.error("API ERROR:", {
    message: err.message,
    code: err.code,
    detail: err.detail,
    hint: err.hint,
    stack: err.stack,
  });

  const status = err.status || 500;

  res.status(status).json({
    success: false,
    message: err.message || "Internal server error",
    code: err.code || undefined,
    detail: err.detail || undefined,
    hint: err.hint || undefined,
  });
}

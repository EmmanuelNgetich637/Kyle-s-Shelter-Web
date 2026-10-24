export function notFoundHandler(req, res, next) {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
}

export function errorHandler(err, req, res, next) {
  console.error(err);

  const status = err.status || 500;

  res.status(status).json({
    success: false,
    message:
      process.env.NODE_ENV === "production" && status >= 500
        ? "An unexpected server error occurred."
        : err.message || "Internal server error",
  });
}
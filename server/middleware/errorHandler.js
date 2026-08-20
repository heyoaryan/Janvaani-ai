// server/middleware/errorHandler.js
// Centralized error handling + async wrapper for route handlers.

// Wrap async route handlers so thrown errors reach the error middleware.
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// 404 handler for unmatched routes.
export function notFound(req, res, next) {
  const err = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
  err.statusCode = 404;
  next(err);
}

// Main error handler.
export function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  // Log server errors for debugging (do not leak stack to client in prod).
  if (statusCode >= 500) {
    console.error(`[ERROR] ${req.method} ${req.originalUrl}:`, err.message);
    if (process.env.NODE_ENV !== 'production') console.error(err.stack);
  }

  res.status(statusCode).json({
    success: false,
    error: {
      message,
      statusCode,
      ...(process.env.NODE_ENV !== 'production' && statusCode >= 500
        ? { stack: err.stack }
        : {}),
    },
    timestamp: new Date().toISOString(),
  });
}

export default { asyncHandler, notFound, errorHandler };

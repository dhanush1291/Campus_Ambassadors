/**
 * Centralized error handling middlewares for Express.
 */

/**
 * 404 Handler for unregistered endpoints
 */
function notFoundHandler(req, res, next) {
  res.status(404).json({
    success: false,
    error: `Route not found: ${req.method} ${req.originalUrl}`,
  });
}

/**
 * Global Error Handler middleware
 * Catches all unhandled exceptions and generation errors.
 */
function errorHandler(err, req, res, next) {
  // If response headers have already been sent (e.g. midway through streaming a PDF)
  if (res.headersSent) {
    console.error('Error occurred after headers were sent:', err);
    return next(err);
  }

  const statusCode = err.status || err.statusCode || 500;
  const message = err.message || 'An unexpected error occurred during document generation.';

  console.error(`[Error] [${new Date().toISOString()}] ${req.method} ${req.url}:`, err);

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}

module.exports = {
  notFoundHandler,
  errorHandler,
};

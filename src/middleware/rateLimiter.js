const rateLimit = require('express-rate-limit');
const config = require('../config');

/**
 * Global rate limiter middleware to protect against DDoS and resource exhaustion.
 * Restricts the number of generation requests per client IP.
 */
const apiRateLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  standardHeaders: true, // Return standard RateLimit-* headers
  legacyHeaders: false, // Disable X-RateLimit-* headers
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: 'Too many requests from this IP. Please try again after a minute.',
      retryAfterSeconds: Math.ceil(config.rateLimit.windowMs / 1000),
    });
  },
});

module.exports = apiRateLimiter;

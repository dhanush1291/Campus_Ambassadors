const crypto = require('crypto');
const config = require('../config');

/**
 * Middleware to authenticate requests using a Bearer API Key.
 * Checks for `Authorization: Bearer <API_SECRET_KEY>` header.
 * 
 * Rejects unauthorized or malformed requests with 401 status.
 */
function apiKeyAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized: Authorization header is required. Format: Authorization: Bearer <API_SECRET_KEY>',
    });
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized: Invalid Authorization header format. Expected "Bearer <API_SECRET_KEY>"',
    });
  }

  const token = parts[1];
  const expectedKey = config.apiSecretKey;

  // Perform constant-time comparison to prevent timing attacks
  const tokenBuffer = Buffer.from(token);
  const expectedBuffer = Buffer.from(expectedKey);

  if (
    tokenBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(tokenBuffer, expectedBuffer)
  ) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized: Invalid API secret key.',
    });
  }

  next();
}

module.exports = apiKeyAuth;

const { sanitizeText } = require('../utils/helpers');

const MAX_CHAR_LENGTH = 50;

/**
 * Validates generic text field for existence, type, non-emptiness, and character limits.
 * 
 * @param {any} value - Field value from request body
 * @param {string} fieldName - Descriptive name of the field
 * @param {number} maxLength - Maximum allowable characters
 * @returns {{ sanitized: string, error?: string }}
 */
function validateField(value, fieldName, maxLength = MAX_CHAR_LENGTH) {
  if (value === undefined || value === null) {
    return { sanitized: '', error: `Field '${fieldName}' is required.` };
  }

  if (typeof value !== 'string') {
    return { sanitized: '', error: `Field '${fieldName}' must be a string.` };
  }

  const sanitized = sanitizeText(value);

  if (sanitized.length === 0) {
    return { sanitized: '', error: `Field '${fieldName}' cannot be empty or only whitespace.` };
  }

  if (sanitized.length > maxLength) {
    return {
      sanitized,
      error: `Field '${fieldName}' exceeds maximum allowed length of ${maxLength} characters (got ${sanitized.length}).`,
    };
  }

  return { sanitized };
}

/**
 * Validation middleware for Certificate generation
 * Body expects: { name, referralCode, level }
 */
function validateCertificateInput(req, res, next) {
  const errors = [];
  const sanitizedBody = {};

  const fields = ['name', 'referralCode', 'level'];
  for (const field of fields) {
    const result = validateField(req.body[field], field, MAX_CHAR_LENGTH);
    if (result.error) {
      errors.push(result.error);
    } else {
      sanitizedBody[field] = result.sanitized;
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error: Invalid input parameters for certificate generation.',
      details: errors,
    });
  }

  // Assign sanitized values back to req.body
  req.body = { ...req.body, ...sanitizedBody };
  next();
}

/**
 * Validation middleware for Offer Letter generation
 * Body expects: { name, role, startDate, referralCode }
 */
function validateOfferLetterInput(req, res, next) {
  const errors = [];
  const sanitizedBody = {};

  const fields = ['name', 'role', 'startDate', 'referralCode'];
  for (const field of fields) {
    const result = validateField(req.body[field], field, MAX_CHAR_LENGTH);
    if (result.error) {
      errors.push(result.error);
    } else {
      sanitizedBody[field] = result.sanitized;
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error: Invalid input parameters for offer letter generation.',
      details: errors,
    });
  }

  req.body = { ...req.body, ...sanitizedBody };
  next();
}

/**
 * Validation middleware for Ambassador Poster generation
 * Body expects: { name, referralCode, level }
 */
function validatePosterInput(req, res, next) {
  const errors = [];
  const sanitizedBody = {};

  const requiredFields = ['name', 'referralCode'];
  for (const field of requiredFields) {
    const result = validateField(req.body[field], field, MAX_CHAR_LENGTH);
    if (result.error) {
      errors.push(result.error);
    } else {
      sanitizedBody[field] = result.sanitized;
    }
  }

  // Level is optional or defaults to 'Campus Ambassador' if not provided
  if (req.body.level !== undefined && req.body.level !== null) {
    const levelResult = validateField(req.body.level, 'level', MAX_CHAR_LENGTH);
    if (levelResult.error) {
      errors.push(levelResult.error);
    } else {
      sanitizedBody.level = levelResult.sanitized;
    }
  } else {
    sanitizedBody.level = 'Campus Ambassador';
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error: Invalid input parameters for poster generation.',
      details: errors,
    });
  }

  req.body = { ...req.body, ...sanitizedBody };
  next();
}

module.exports = {
  validateCertificateInput,
  validateOfferLetterInput,
  validatePosterInput,
};

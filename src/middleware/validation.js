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
 * Required: name, date
 * Optional: referralCode, level
 */
function validateCertificateInput(req, res, next) {
  const errors = [];
  const sanitizedBody = {};

  const requiredFields = [
    { name: 'name', max: 60 },
    { name: 'date', max: 50 },
  ];

  for (const { name: field, max } of requiredFields) {
    const result = validateField(req.body[field], field, max);
    if (result.error) {
      errors.push(result.error);
    } else {
      sanitizedBody[field] = result.sanitized;
    }
  }

  // Optional fields sanitized if provided
  const optionalFields = ['referralCode', 'level'];
  for (const field of optionalFields) {
    if (req.body[field] !== undefined && req.body[field] !== null) {
      const optResult = validateField(req.body[field], field, 60);
      if (optResult.error) {
        errors.push(optResult.error);
      } else {
        sanitizedBody[field] = optResult.sanitized;
      }
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error: Invalid input parameters for certificate generation.',
      details: errors,
    });
  }

  req.body = { ...req.body, ...sanitizedBody };
  next();
}

/**
 * Validation middleware for Offer Letter generation
 * Required: name
 * Optional: role, startDate, referralCode
 */
function validateOfferLetterInput(req, res, next) {
  const errors = [];
  const sanitizedBody = {};

  const nameResult = validateField(req.body.name, 'name', 60);
  if (nameResult.error) {
    errors.push(nameResult.error);
  } else {
    sanitizedBody.name = nameResult.sanitized;
  }

  // Optional fields sanitized if provided
  const optionalFields = ['role', 'startDate', 'referralCode'];
  for (const field of optionalFields) {
    if (req.body[field] !== undefined && req.body[field] !== null) {
      const optResult = validateField(req.body[field], field, 60);
      if (optResult.error) {
        errors.push(optResult.error);
      } else {
        sanitizedBody[field] = optResult.sanitized;
      }
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
 * Required: collegeName, referralLink
 * Optional: name, referralCode, level
 */
function validatePosterInput(req, res, next) {
  const errors = [];
  const sanitizedBody = {};

  const collegeInput = req.body.collegeName !== undefined ? req.body.collegeName : req.body.name;
  const linkInput = req.body.referralLink !== undefined ? req.body.referralLink : req.body.referralCode;

  const collegeRes = validateField(collegeInput, 'collegeName', 100);
  if (collegeRes.error) {
    errors.push(collegeRes.error);
  } else {
    sanitizedBody.collegeName = collegeRes.sanitized;
  }

  const linkRes = validateField(linkInput, 'referralLink', 200);
  if (linkRes.error) {
    errors.push(linkRes.error);
  } else {
    sanitizedBody.referralLink = linkRes.sanitized;
  }

  // Optional fields sanitized if provided
  const optionalFields = ['name', 'referralCode', 'level'];
  for (const field of optionalFields) {
    if (req.body[field] !== undefined && req.body[field] !== null) {
      const optResult = validateField(req.body[field], field, 100);
      if (optResult.error) {
        errors.push(optResult.error);
      } else {
        sanitizedBody[field] = optResult.sanitized;
      }
    }
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

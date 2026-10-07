/**
 * Utility functions for text sanitization, XML escaping, and formatting.
 */

/**
 * Escapes characters that have special meaning in XML/SVG.
 * Essential for safely injecting dynamic strings into Sharp SVG templates.
 * 
 * @param {string} str - Raw input string
 * @returns {string} XML-safe escaped string
 */
function escapeXml(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Sanitizes generic user text by trimming and stripping control characters.
 * 
 * @param {string} text - Raw input text
 * @returns {string} Sanitized string
 */
function sanitizeText(text) {
  if (typeof text !== 'string') return '';
  // Remove ASCII control characters (0-31) except newline/carriage return
  return text.trim().replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
}

/**
 * Formats a date string or Date object into human-readable format.
 * E.g., "October 7, 2026"
 * 
 * @param {string|Date} dateInput
 * @returns {string} Formatted date
 */
function formatDate(dateInput) {
  let date = dateInput ? new Date(dateInput) : new Date();
  if (isNaN(date.getTime())) {
    date = new Date();
  }
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Generates an official unique Certificate / Offer Reference identifier.
 * 
 * @param {string} prefix
 * @param {string} code
 * @returns {string} Reference string
 */
function generateReferenceNumber(prefix = 'REF', code = 'CAMPUS') {
  const cleanCode = (code || '0000').toUpperCase().replace(/[^A-Z0-9]/g, '');
  const timestamp = Date.now().toString(36).toUpperCase();
  return `${prefix}-${cleanCode}-${timestamp}`;
}

module.exports = {
  escapeXml,
  sanitizeText,
  formatDate,
  generateReferenceNumber,
};

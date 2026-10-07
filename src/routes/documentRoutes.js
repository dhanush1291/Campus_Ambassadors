const express = require('express');
const {
  validateCertificateInput,
  validateOfferLetterInput,
  validatePosterInput,
} = require('../middleware/validation');
const { generateCertificate } = require('../controllers/certificateController');
const { generateOfferLetter } = require('../controllers/offerLetterController');
const { generatePoster } = require('../controllers/posterController');

const router = express.Router();

/**
 * @route   POST /api/generate-certificate
 * @desc    Generate a landscape A4 PDF certificate of appreciation
 * @access  Protected (Requires Bearer API Key)
 */
router.post(
  '/generate-certificate',
  validateCertificateInput,
  generateCertificate
);

/**
 * @route   POST /api/generate-offer-letter
 * @desc    Generate a portrait multi-section official offer letter PDF
 * @access  Protected (Requires Bearer API Key)
 */
router.post(
  '/generate-offer-letter',
  validateOfferLetterInput,
  generateOfferLetter
);

/**
 * @route   POST /api/generate-poster
 * @desc    Generate an ambassador badge/poster by compositing dynamic details onto template
 * @access  Protected (Requires Bearer API Key)
 */
router.post(
  '/generate-poster',
  validatePosterInput,
  generatePoster
);

module.exports = router;

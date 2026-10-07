const express = require('express');
const documentRoutes = require('./documentRoutes');
const apiKeyAuth = require('../middleware/auth');

const router = express.Router();

// Health check endpoint (public)
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'Referral Document Generation Microservice',
    timestamp: new Date().toISOString(),
  });
});

// Protect all document generation endpoints under /api with API key middleware
router.use('/', apiKeyAuth, documentRoutes);

module.exports = router;

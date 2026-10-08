const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  apiSecretKey: process.env.API_SECRET_KEY || 'super-secret-referral-api-key-2026',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',

  // Rate Limiting Config
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10), // default 1 minute
    max: parseInt(process.env.RATE_LIMIT_MAX || '10', 10), // default 10 requests per windowMs
  },

  // Company Brand Metadata used in generated PDFs/Posters
  company: {
    name: process.env.COMPANY_NAME || 'Nexus Campus Network',
    tagline: process.env.COMPANY_TAGLINE || 'Empowering Student Leaders Worldwide',
    email: process.env.COMPANY_EMAIL || 'ambassadors@nexusnetwork.org',
    website: process.env.COMPANY_WEBSITE || 'https://nexusnetwork.org',
    address: '100 Innovation Boulevard, Tech Park, Suite 400',
  },

  // Template Paths
  paths: {
    templatesDir: path.join(__dirname, '../templates'),
    posterTemplate: path.join(__dirname, '../templates/poster-template.png'),
    posterTemplateAlt: path.join(__dirname, '../templates/poster-bg.png'),
    certificateTemplate: path.join(__dirname, '../templates/certificate-template.png'),
    certificateTemplateAlt: path.join(__dirname, '../templates/certificate-bg.png'),
    offerLetterBg: path.join(__dirname, '../templates/offer-letter-bg.png'),
    offerLetterTemplate: path.join(__dirname, '../templates/offer-letter-template.png'),
    offerLetterHeader: path.join(__dirname, '../templates/offer-letter-header.png'),
    offerLetterFooter: path.join(__dirname, '../templates/offer-letter-footer.png'),
    assetsDir: path.join(__dirname, '../templates/assets'),
  },
};

module.exports = config;

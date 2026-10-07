const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const config = require('../config');
const { escapeXml } = require('../utils/helpers');

/**
 * Controller to dynamically overlay name, referral code, and level onto a base template
 * using Sharp and high-precision SVG text composition.
 * 
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next handler
 */
async function generatePoster(req, res, next) {
  try {
    const { name, referralCode, level } = req.body;

    const templatePath = config.paths.posterTemplate;

    // Verify template existence
    if (!fs.existsSync(templatePath)) {
      return res.status(500).json({
        success: false,
        error: `Poster template not found at ${templatePath}. Ensure template assets are installed.`,
      });
    }

    // Sanitize and XML-escape strings to prevent SVG syntax corruption
    const safeName = escapeXml(name.toUpperCase());
    const safeReferralCode = escapeXml(referralCode.toUpperCase());
    const safeLevel = escapeXml((level || 'Campus Ambassador').toUpperCase());

    // Dynamically calculate font size based on name length to maintain perfect typography
    let nameFontSize = 46;
    if (safeName.length > 28) {
      nameFontSize = 32;
    } else if (safeName.length > 20) {
      nameFontSize = 38;
    }

    // Dynamic referral code font size
    let codeFontSize = 42;
    if (safeReferralCode.length > 20) {
      codeFontSize = 32;
    } else if (safeReferralCode.length > 14) {
      codeFontSize = 36;
    }

    // SVG Overlay containing text at exact pixel coordinates (1080 x 1350)
    // Coordinates match the base template layout:
    // Name zone: center 540, Y: 635
    // Level badge zone: center 540, Y: 720
    // Referral code zone: center 540, Y: 890
    const svgOverlay = `
    <svg width="1080" height="1350" viewBox="0 0 1080 1350" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <!-- Gradients and Filters -->
        <linearGradient id="textGoldGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#fef08a" />
          <stop offset="50%" stop-color="#facc15" />
          <stop offset="100%" stop-color="#eab308" />
        </linearGradient>

        <linearGradient id="codeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#38bdf8" />
          <stop offset="100%" stop-color="#818cf8" />
        </linearGradient>

        <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <!-- 1. DYNAMIC AMBASSADOR NAME (Exact Coordinates: Center X=540, Y=635) -->
      <text 
        x="540" 
        y="635" 
        font-family="'Helvetica Neue', Arial, sans-serif" 
        font-size="${nameFontSize}" 
        font-weight="900" 
        fill="#ffffff" 
        letter-spacing="2" 
        text-anchor="middle"
        filter="drop-shadow(0px 4px 12px rgba(0,0,0,0.8))"
      >${safeName}</text>

      <!-- 2. DYNAMIC TIER / LEVEL BADGE PILL (Exact Coordinates: Center X=540, Y=715) -->
      <g transform="translate(540, 715)">
        <rect 
          x="-160" 
          y="-18" 
          width="320" 
          height="36" 
          rx="18" 
          fill="#1e293b" 
          stroke="#fbbf24" 
          stroke-width="1.5" 
        />
        <circle cx="-130" cy="0" r="4" fill="#fbbf24" />
        <text 
          x="0" 
          y="5" 
          font-family="'Helvetica Neue', Arial, sans-serif" 
          font-size="13" 
          font-weight="800" 
          fill="url(#textGoldGrad)" 
          letter-spacing="3" 
          text-anchor="middle"
        >${safeLevel}</text>
        <circle cx="130" cy="0" r="4" fill="#fbbf24" />
      </g>

      <!-- 3. DYNAMIC REFERRAL CODE (Exact Coordinates: Center X=540, Y=898) -->
      <text 
        x="540" 
        y="900" 
        font-family="'Helvetica Neue', Arial, monospace, sans-serif" 
        font-size="${codeFontSize}" 
        font-weight="900" 
        fill="url(#codeGrad)" 
        letter-spacing="6" 
        text-anchor="middle"
        filter="url(#neonGlow)"
      >${safeReferralCode}</text>
    </svg>
    `;

    const cleanFilename = `ambassador-poster-${referralCode.replace(/[^a-zA-Z0-9_-]/g, '_')}.png`;

    // Set download headers
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', `attachment; filename="${cleanFilename}"`);
    res.setHeader('X-Document-Type', 'Ambassador-Poster');

    // Composite dynamic SVG overlay onto base template
    const imageStream = sharp(templatePath)
      .composite([
        {
          input: Buffer.from(svgOverlay),
          top: 0,
          left: 0,
        },
      ])
      .png({ quality: 95, compressionLevel: 8 });

    // Stream the binary image output directly to client
    imageStream.on('error', (err) => {
      console.error('Sharp processing error:', err);
      if (!res.headersSent) {
        return next(err);
      }
    });

    imageStream.pipe(res);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  generatePoster,
};

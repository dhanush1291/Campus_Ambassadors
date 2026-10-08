const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const config = require('../config');
const { escapeXml } = require('../utils/helpers');

/**
 * Resolves the poster template file path reliably across environments.
 * @returns {string|null} Resolved absolute path or null if not found
 */
function getPosterTemplatePath() {
  const candidates = [
    path.join(__dirname, '../templates/poster-template.png'),
    path.join(__dirname, '../templates/poster-bg.png'),
    config.paths.posterTemplate,
    config.paths.posterTemplateAlt,
    path.join(__dirname, '../templates/ambassador-poster-template.png'),
  ];
  return candidates.find((p) => p && fs.existsSync(p)) || null;
}

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
    const { collegeName, referralLink, name, referralCode, level } = req.body;

    const rawCollegeName = collegeName || name || 'Campus Ambassador';
    const rawReferralLink = referralLink || referralCode || '';

    const templatePath = getPosterTemplatePath();

    // Verify template existence
    if (!templatePath) {
      return res.status(500).json({
        success: false,
        error: `Poster template not found. Ensure template assets are installed in src/templates/ (e.g. poster-template.png or poster-bg.png).`,
      });
    }

    // Inspect template dimensions to ensure pixel-perfect SVG coordinates
    const metadata = await sharp(templatePath).metadata();
    const tWidth = metadata.width || 3375;
    const tHeight = metadata.height || 4219;

    const cleanCollege = (rawCollegeName || '').trim();
    const safeCollegeName = escapeXml(cleanCollege);
    const safeReferralLink = escapeXml(rawReferralLink);

    let svgOverlay;

    if (tWidth > 2000) {
      // High-Definition Canvas (3375 x 4219 template)
      const centerX = tWidth / 2;

      // 1. College Name sizing & placement:
      // Placed directly above the divider line (Y=2895), matching scripts/test-above-line.js coordinates
      let collegeFontSize = 100;
      if (safeCollegeName.length > 35) {
        collegeFontSize = 74;
      } else if (safeCollegeName.length > 25) {
        collegeFontSize = 88;
      }

      // 2. Referral Link sizing & placement:
      // Inside the white card at the bottom (Y: 3031 to 3556), below "Register for the event here:" (ends Y: 3314).
      // Centered at buttonY = 3350, height = 160.
      const linkLength = safeReferralLink.length;
      const buttonWidth = Math.min(2200, Math.max(1600, linkLength * 42 + 200));
      const buttonHeight = 160;
      const buttonY = 3350;

      let linkFontSize = 74;
      if (linkLength > 52) {
        linkFontSize = 54;
      } else if (linkLength > 42) {
        linkFontSize = 62;
      } else if (linkLength > 32) {
        linkFontSize = 68;
      }

      svgOverlay = `
      <svg width="${tWidth}" height="${tHeight}" viewBox="0 0 ${tWidth} ${tHeight}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="btnGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#3b227c" />
            <stop offset="100%" stop-color="#26125b" />
          </linearGradient>
        </defs>

        <!-- 1. COLLEGE NAME DIRECTLY ABOVE THE DIVIDER LINE (Y=2895) -->
        <text 
          x="${centerX}" 
          y="2820" 
          text-anchor="middle" 
          font-family="'Montserrat', 'Poppins', 'Helvetica Neue', Arial, sans-serif" 
          font-size="${collegeFontSize}" 
          font-weight="800" 
          letter-spacing="2" 
          fill="#2d1767"
        >${safeCollegeName}</text>

        <!-- 2. REFERRAL LINK PILL BUTTON (Inside the white event card at bottom) -->
        <rect 
          x="${centerX - buttonWidth / 2}" 
          y="${buttonY}" 
          width="${buttonWidth}" 
          height="${buttonHeight}" 
          rx="${buttonHeight / 2}" 
          fill="url(#btnGrad)" 
        />
        <rect 
          x="${centerX - buttonWidth / 2 + 6}" 
          y="${buttonY + 6}" 
          width="${buttonWidth - 12}" 
          height="${buttonHeight - 12}" 
          rx="${(buttonHeight - 12) / 2}" 
          fill="none" 
          stroke="#a5b4fc" 
          stroke-width="3" 
          stroke-dasharray="10 7" 
          opacity="0.8" 
        />
        <text 
          x="${centerX}" 
          y="${buttonY + buttonHeight / 2 + 1}" 
          dominant-baseline="central" 
          text-anchor="middle" 
          font-family="'Montserrat', 'Poppins', 'Helvetica Neue', Arial, sans-serif" 
          font-size="${linkFontSize}" 
          font-weight="800" 
          fill="#ffffff" 
          letter-spacing="1.2"
        >${safeReferralLink}</text>
      </svg>
      `;
    } else {
      // Standard Resolution Canvas (1080 x 1350 template fallback)
      let collegeFontSize = 42;
      if (safeCollegeName.length > 30) {
        collegeFontSize = 30;
      } else if (safeCollegeName.length > 20) {
        collegeFontSize = 36;
      }

      let linkFontSize = 26;
      if (safeReferralLink.length > 40) {
        linkFontSize = 20;
      } else if (safeReferralLink.length > 26) {
        linkFontSize = 22;
      }

      const boxWidth = Math.min(800, Math.max(500, safeReferralLink.length * 16 + 80));

      svgOverlay = `
      <svg width="${tWidth}" height="${tHeight}" viewBox="0 0 ${tWidth} ${tHeight}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="linkGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#4338ca" />
            <stop offset="100%" stop-color="#312e81" />
          </linearGradient>
        </defs>

        <!-- 1. COLLEGE NAME -->
        <text 
          x="${tWidth / 2}" 
          y="660" 
          font-family="'Helvetica Neue', Arial, sans-serif" 
          font-size="${collegeFontSize}" 
          font-weight="900" 
          fill="#ffffff" 
          letter-spacing="2" 
          text-anchor="middle"
          filter="drop-shadow(0px 4px 12px rgba(0,0,0,0.8))"
        >${safeCollegeName}</text>

        <!-- 2. REFERRAL LINK PILL -->
        <g transform="translate(${tWidth / 2}, 900)">
          <rect 
            x="-${boxWidth / 2}" 
            y="-28" 
            width="${boxWidth}" 
            height="56" 
            rx="28" 
            fill="url(#linkGrad)" 
            stroke="#c7d2fe" 
            stroke-width="1.5" 
          />
          <text 
            x="0" 
            y="7" 
            font-family="'Helvetica Neue', Arial, monospace, sans-serif" 
            font-size="${linkFontSize}" 
            font-weight="800" 
            fill="#ffffff" 
            letter-spacing="1.5" 
            text-anchor="middle"
          >${safeReferralLink}</text>
        </g>
      </svg>
      `;
    }

    const fileToken = (rawCollegeName || rawReferralLink || 'poster').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 30);
    const cleanFilename = `ambassador-poster-${fileToken}.png`;

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
      .png({ quality: 90, compressionLevel: 6 });

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

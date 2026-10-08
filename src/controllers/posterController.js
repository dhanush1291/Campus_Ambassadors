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

    // Sanitize and XML-escape strings to prevent SVG syntax corruption
    const safeCollegeName = escapeXml(rawCollegeName.toUpperCase());
    const safeReferralLink = escapeXml(rawReferralLink);

    let svgOverlay;

    if (tWidth > 2000) {
      // High-Definition Canvas (3375 x 4219 template)
      // 1. College Name zone: Center 1687.5, Y: 2805 (Right under "Campus Ambassador of...", above line Y: 2894)
      let collegeFontSize = 88;
      if (safeCollegeName.length > 40) {
        collegeFontSize = 54;
      } else if (safeCollegeName.length > 30) {
        collegeFontSize = 66;
      } else if (safeCollegeName.length > 20) {
        collegeFontSize = 76;
      }

      // 2. Referral Link zone: Inside white registration card at bottom (Y: 3031 to 3556)
      // Center 1687.5, Y: 3425
      let linkFontSize = 42;
      let boxWidth = 1450;
      if (safeReferralLink.length > 50) {
        linkFontSize = 28;
        boxWidth = Math.min(2200, Math.max(1000, safeReferralLink.length * 22 + 160));
      } else if (safeReferralLink.length > 38) {
        linkFontSize = 32;
        boxWidth = Math.min(2000, Math.max(1000, safeReferralLink.length * 25 + 160));
      } else if (safeReferralLink.length > 26) {
        linkFontSize = 38;
        boxWidth = Math.min(1800, Math.max(1000, safeReferralLink.length * 28 + 160));
      } else {
        boxWidth = Math.min(1600, Math.max(900, safeReferralLink.length * 32 + 160));
      }

      svgOverlay = `
      <svg width="${tWidth}" height="${tHeight}" viewBox="0 0 ${tWidth} ${tHeight}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="linkGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#4338ca" />
            <stop offset="100%" stop-color="#312e81" />
          </linearGradient>
        </defs>

        <!-- 1. COLLEGE NAME (Under "Campus Ambassador of..." section, above line Y=2894) -->
        <text 
          x="${tWidth / 2}" 
          y="2805" 
          font-family="'Montserrat', 'Helvetica Neue', Arial, sans-serif" 
          font-size="${collegeFontSize}" 
          font-weight="900" 
          fill="#240c4a" 
          letter-spacing="3" 
          text-anchor="middle"
        >${safeCollegeName}</text>

        <!-- 2. REFERRAL LINK PILL (Inside the white event card at bottom) -->
        <g transform="translate(${tWidth / 2}, 3425)">
          <rect 
            x="-${boxWidth / 2}" 
            y="-54" 
            width="${boxWidth}" 
            height="108" 
            rx="54" 
            fill="url(#linkGrad)" 
          />
          <rect 
            x="-${boxWidth / 2 - 6}" 
            y="-48" 
            width="${boxWidth - 12}" 
            height="96" 
            rx="48" 
            fill="none" 
            stroke="#c7d2fe" 
            stroke-width="2.5" 
            stroke-dasharray="10 6" 
          />
          <text 
            x="0" 
            y="0" 
            dominant-baseline="central" 
            font-family="'Montserrat', 'Helvetica Neue', Arial, sans-serif" 
            font-size="${linkFontSize}" 
            font-weight="800" 
            fill="#ffffff" 
            letter-spacing="1.5" 
            text-anchor="middle"
          >${safeReferralLink}</text>
        </g>
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

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

/**
 * Script to generate a high-definition 1080x1350 PNG base poster template.
 * This file is saved to src/templates/ambassador-poster-template.png
 */
async function generatePosterTemplate() {
  const templatesDir = path.resolve(__dirname, '../src/templates');
  if (!fs.existsSync(templatesDir)) {
    fs.mkdirSync(templatesDir, { recursive: true });
  }

  const outputPath = path.join(templatesDir, 'ambassador-poster-template.png');

  // SVG Artwork for the base template (1080 x 1350)
  const templateSvg = `
  <svg width="1080" height="1350" viewBox="0 0 1080 1350" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <!-- Background Gradients -->
      <radialGradient id="bgGrad" cx="50%" cy="30%" r="80%" fx="50%" fy="20%">
        <stop offset="0%" stop-color="#1e1b4b" />
        <stop offset="50%" stop-color="#0f172a" />
        <stop offset="100%" stop-color="#020617" />
      </radialGradient>

      <!-- Glow Orbs -->
      <radialGradient id="orbIndigo" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#6366f1" stop-opacity="0.45" />
        <stop offset="100%" stop-color="#6366f1" stop-opacity="0" />
      </radialGradient>
      <radialGradient id="orbCyan" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#06b6d4" stop-opacity="0.4" />
        <stop offset="100%" stop-color="#06b6d4" stop-opacity="0" />
      </radialGradient>
      <radialGradient id="orbRose" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#f43f5e" stop-opacity="0.25" />
        <stop offset="100%" stop-color="#f43f5e" stop-opacity="0" />
      </radialGradient>

      <!-- Card Gradient -->
      <linearGradient id="cardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#1e293b" stop-opacity="0.8" />
        <stop offset="100%" stop-color="#0f172a" stop-opacity="0.9" />
      </linearGradient>

      <!-- Gold Accent Gradient -->
      <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#fbbf24" />
        <stop offset="100%" stop-color="#d97706" />
      </linearGradient>

      <!-- Neon Cyan Gradient -->
      <linearGradient id="cyanGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#38bdf8" />
        <stop offset="100%" stop-color="#818cf8" />
      </linearGradient>

      <!-- Tech Grid Pattern -->
      <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#334155" stroke-width="0.75" stroke-opacity="0.3" />
      </pattern>
    </defs>

    <!-- Base Canvas Background -->
    <rect width="1080" height="1350" fill="url(#bgGrad)" />
    
    <!-- Grid Overlay -->
    <rect width="1080" height="1350" fill="url(#grid)" />

    <!-- Ambient Glowing Orbs -->
    <circle cx="200" cy="300" r="400" fill="url(#orbIndigo)" filter="blur(60px)" />
    <circle cx="880" cy="700" r="450" fill="url(#orbCyan)" filter="blur(70px)" />
    <circle cx="300" cy="1150" r="350" fill="url(#orbRose)" filter="blur(60px)" />

    <!-- Outer High-Tech Frame Borders -->
    <rect x="40" y="40" width="1000" height="1270" rx="28" fill="none" stroke="#334155" stroke-width="2" stroke-opacity="0.6" />
    <rect x="52" y="52" width="976" height="1246" rx="22" fill="none" stroke="url(#cyanGrad)" stroke-width="1.5" stroke-opacity="0.35" />

    <!-- Corner Decorative Brackets -->
    <!-- Top-Left -->
    <path d="M 40 100 L 40 40 L 100 40" fill="none" stroke="#38bdf8" stroke-width="4" stroke-linecap="round" />
    <!-- Top-Right -->
    <path d="M 980 40 L 1040 40 L 1040 100" fill="none" stroke="#38bdf8" stroke-width="4" stroke-linecap="round" />
    <!-- Bottom-Left -->
    <path d="M 40 1250 L 40 1310 L 100 1310" fill="none" stroke="#818cf8" stroke-width="4" stroke-linecap="round" />
    <!-- Bottom-Right -->
    <path d="M 980 1310 L 1040 1310 L 1040 1250" fill="none" stroke="#818cf8" stroke-width="4" stroke-linecap="round" />

    <!-- Top Organization Pill -->
    <g transform="translate(540, 110)">
      <rect x="-180" y="0" width="360" height="42" rx="21" fill="#1e293b" fill-opacity="0.9" stroke="#475569" stroke-width="1.5" />
      <circle cx="-140" cy="21" r="5" fill="#38bdf8" />
      <text x="0" y="27" font-family="'Helvetica Neue', Arial, sans-serif" font-size="14" font-weight="700" fill="#94a3b8" letter-spacing="4" text-anchor="middle">OFFICIAL PARTNER</text>
      <circle cx="140" cy="21" r="5" fill="#38bdf8" />
    </g>

    <!-- Main Title -->
    <text x="540" y="220" font-family="'Helvetica Neue', Arial, sans-serif" font-size="46" font-weight="900" fill="#f8fafc" letter-spacing="6" text-anchor="middle">CAMPUS AMBASSADOR</text>
    <text x="540" y="260" font-family="'Helvetica Neue', Arial, sans-serif" font-size="18" font-weight="600" fill="#38bdf8" letter-spacing="4" text-anchor="middle">EXCLUSIVE REFERRAL PROGRAM</text>

    <!-- Subtle divider line -->
    <line x1="340" y1="290" x2="740" y2="290" stroke="#334155" stroke-width="1.5" stroke-dasharray="8 6" />

    <!-- Center Card Panel (Glassmorphism Frame for User Credentials) -->
    <rect x="120" y="340" width="840" height="720" rx="28" fill="url(#cardGrad)" stroke="#334155" stroke-width="2" />
    <rect x="132" y="352" width="816" height="696" rx="20" fill="none" stroke="#ffffff" stroke-width="1" stroke-opacity="0.08" />

    <!-- Badge Icon Graphics inside Card -->
    <g transform="translate(540, 440)">
      <!-- Outer Hexagon / Shield glow -->
      <circle cx="0" cy="0" r="55" fill="#38bdf8" fill-opacity="0.1" />
      <circle cx="0" cy="0" r="45" fill="#1e293b" stroke="#38bdf8" stroke-width="2" />
      <!-- Star Icon -->
      <polygon points="0,-22 7,-7 23,-7 10,4 15,20 0,10 -15,20 -10,4 -23,-7 -7,-7" fill="url(#goldGrad)" />
    </g>

    <!-- Name Section Header -->
    <text x="540" y="550" font-family="'Helvetica Neue', Arial, sans-serif" font-size="16" font-weight="700" fill="#94a3b8" letter-spacing="4" text-anchor="middle">HONORING STUDENT LEADER</text>

    <!-- Name Placeholder Box (Coordinates: Center 540, Y: 630 to 710) -->
    <!-- Name text will be overlaid at x=540, y=630 -->
    <line x1="240" y1="670" x2="840" y2="670" stroke="#38bdf8" stroke-width="2" stroke-opacity="0.5" />

    <!-- Level Placement Placeholder (Coordinates: Center 540, Y: 730) -->

    <!-- Referral Code Callout Frame (Coordinates: Center 540, Box at Y: 820-960) -->
    <g transform="translate(540, 830)">
      <rect x="-280" y="0" width="560" height="110" rx="16" fill="#020617" fill-opacity="0.85" stroke="#38bdf8" stroke-width="2" stroke-dasharray="6 4" />
      <text x="0" y="32" font-family="'Helvetica Neue', Arial, sans-serif" font-size="13" font-weight="700" fill="#94a3b8" letter-spacing="3" text-anchor="middle">USE EXCLUSIVE REFERRAL CODE</text>
      <!-- Dynamic referral code will be centered at x=540, y=895 in overlay -->
    </g>

    <!-- Perks / Highlights Row -->
    <g transform="translate(540, 1000)">
      <text x="-220" y="0" font-family="'Helvetica Neue', Arial, sans-serif" font-size="15" font-weight="600" fill="#cbd5e1" text-anchor="middle">✨ Exclusive Perks</text>
      <circle cx="-100" cy="-4" r="3" fill="#64748b" />
      <text x="0" y="0" font-family="'Helvetica Neue', Arial, sans-serif" font-size="15" font-weight="600" fill="#cbd5e1" text-anchor="middle">🚀 Fast-Track Mentorship</text>
      <circle cx="110" cy="-4" r="3" fill="#64748b" />
      <text x="220" y="0" font-family="'Helvetica Neue', Arial, sans-serif" font-size="15" font-weight="600" fill="#cbd5e1" text-anchor="middle">🎁 Tier Rewards</text>
    </g>

    <!-- Bottom Footer Call to Action -->
    <g transform="translate(540, 1140)">
      <rect x="-340" y="0" width="680" height="54" rx="27" fill="url(#cyanGrad)" />
      <text x="0" y="34" font-family="'Helvetica Neue', Arial, sans-serif" font-size="18" font-weight="800" fill="#0f172a" letter-spacing="2" text-anchor="middle">JOIN NOW &amp; UNLOCK YOUR STUDENT REWARDS</text>
    </g>

    <text x="540" y="1240" font-family="'Helvetica Neue', Arial, sans-serif" font-size="13" font-weight="500" fill="#64748b" letter-spacing="1.5" text-anchor="middle">VERIFIED REFERRAL PARTNER • NEXUS CAMPUS NETWORK • NEXUSNETWORK.ORG</text>
  </svg>
  `;

  // Render SVG into PNG using Sharp
  await sharp(Buffer.from(templateSvg))
    .png({ quality: 95 })
    .toFile(outputPath);

  console.log('Successfully generated base poster template at:', outputPath);
}

generatePosterTemplate().catch(err => {
  console.error('Failed to generate template:', err);
  process.exit(1);
});

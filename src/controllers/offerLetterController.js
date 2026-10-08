const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const config = require('../config');
const { formatDate, generateReferenceNumber } = require('../utils/helpers');

/**
 * Resolves the offer letter template paths (letterhead background or separate header/footer graphics)
 * reliably across environments.
 * @returns {{ bgPath: string|null, headerPath: string|null, footerPath: string|null }}
 */
function getOfferLetterTemplates() {
  const bgCandidates = [
    path.join(__dirname, '../templates/offer-letter-bg.png'),
    path.join(__dirname, '../templates/offer-letter-template.png'),
    config.paths.offerLetterBg,
    config.paths.offerLetterTemplate,
  ];
  const bgPath = bgCandidates.find((p) => p && fs.existsSync(p)) || null;

  const headerCandidates = [
    path.join(__dirname, '../templates/offer-letter-header.png'),
    config.paths.offerLetterHeader,
  ];
  const headerPath = headerCandidates.find((p) => p && fs.existsSync(p)) || null;

  const footerCandidates = [
    path.join(__dirname, '../templates/offer-letter-footer.png'),
    config.paths.offerLetterFooter,
  ];
  const footerPath = footerCandidates.find((p) => p && fs.existsSync(p)) || null;

  return { bgPath, headerPath, footerPath };
}

/**
 * Controller to generate and stream an official portrait multi-section Offer Letter PDF.
 * Integrates custom company letterhead header/footer graphics and positions dynamic text blocks
 * cleanly without breaking page margins.
 * 
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next handler
 */
function generateOfferLetter(req, res, next) {
  try {
    const { name, role, startDate, referralCode } = req.body;

    const formattedIssueDate = formatDate(new Date());
    const referenceNumber = generateReferenceNumber('QFF26/OFFER', referralCode || name);
    const cleanFilename = `offer-letter-${name.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;

    // Initialize portrait A4 PDF: 595.28 pt x 841.89 pt (margin 0 for edge-to-edge letterhead header/footer)
    const doc = new PDFDocument({
      size: 'A4',
      layout: 'portrait',
      margin: 0,
      info: {
        Title: `Offer of Appointment - ${name}`,
        Author: 'Plus Qiskit Fall Fest 2026 - RGUKT Srikakulam',
        Subject: 'Campus Ambassador Offer Letter',
        Keywords: 'offer letter, campus ambassador, appointment, rgukt, plus qiskit fall fest',
      },
    });

    // Handle stream errors
    doc.on('error', (err) => {
      console.error('PDFKit offer letter error:', err);
      if (!res.headersSent) {
        return next(err);
      }
    });

    // Set download headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${cleanFilename}"`);
    res.setHeader('X-Document-Type', 'Offer-Letter');
    res.setHeader('X-Reference-Number', referenceNumber);

    // Pipe directly to response stream
    doc.pipe(res);

    const pageWidth = doc.page.width;     // 595.28
    const pageHeight = doc.page.height;   // 841.89
    const leftMargin = 50;
    const contentWidth = pageWidth - 100; // 495.28

    const { bgPath, headerPath, footerPath } = getOfferLetterTemplates();

    // ==========================================
    // 1. CORPORATE LETTERHEAD GRAPHIC / BACKGROUND
    // ==========================================
    let hasCustomGraphic = false;

    if (bgPath) {
      doc.image(bgPath, 0, 0, { width: pageWidth, height: pageHeight });
      hasCustomGraphic = true;
    } else {
      if (headerPath) {
        doc.image(headerPath, 0, 0, { width: pageWidth });
        hasCustomGraphic = true;
      }
      if (footerPath) {
        const footerHeight = pageWidth * (250 / 2481);
        doc.image(footerPath, 0, pageHeight - footerHeight, { width: pageWidth });
        hasCustomGraphic = true;
      }
    }

    if (!hasCustomGraphic) {
      // Fallback: Programmatic letterhead header bar if no image template installed
      doc.rect(0, 0, pageWidth, 6).fillColor('#2563eb').fill();
      const logoX = 50;
      const logoY = 32;
      doc.roundedRect(logoX, logoY, 36, 36, 8).fillColor('#0f172a').fill();
      doc.fillColor('#38bdf8').font('Helvetica-Bold').fontSize(20).text('Q', logoX + 11, logoY + 8);
      doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(16).text('Plus Qiskit Fall Fest 2026', 96, 33);
      doc.fillColor('#64748b').font('Helvetica').fontSize(8.5).text('RGUKT Srikakulam • Quantum Leadership Network', 96, 52);
      doc.fillColor('#475569').font('Helvetica').fontSize(8)
         .text('RGUKT Srikakulam Campus', 320, 33, { align: 'right', width: 225 })
         .text('Email: qiskit@rguktsklm.ac.in', 320, 45, { align: 'right', width: 225 })
         .text('Web: https://qffrguktsklm.in', 320, 57, { align: 'right', width: 225 });
      doc.moveTo(50, 78).lineTo(pageWidth - 50, 78).lineWidth(1).strokeColor('#e2e8f0').stroke();
    }

    // ==========================================
    // 2. OFFICIAL RGUKT SRIKAKULAM TEXT BLOCK
    // ==========================================
    let currentY = hasCustomGraphic ? 185 : 100;

    // Subject Line
    doc.fillColor('#0f172a')
       .font('Helvetica-Bold')
       .fontSize(12)
       .text('Subject: Offer Letter: Campus Ambassador – Plus Qiskit Fall Fest 2026', leftMargin, currentY, {
         width: contentWidth,
       });

    currentY += 34;

    // Salutation Line with dynamically injected Name
    doc.fillColor('#2563eb')
       .font('Helvetica-Bold')
       .fontSize(13)
       .text(`Dear ${name},`, leftMargin, currentY);

    currentY += 28;

    // Congratulations paragraph
    doc.fillColor('#1e293b')
       .font('Helvetica')
       .fontSize(10.5)
       .text(
         'Congratulations! You are officially appointed as a Campus Ambassador for the Plus Qiskit Fall Fest 2026 at Rajiv Gandhi University of Knowledge Technologies – Srikakulam after successfully reaching your level 1 milestone.',
         leftMargin,
         currentY,
         { width: contentWidth, lineGap: 4 }
       );

    currentY = doc.y + 18;

    // Section 1: Role Overview –
    doc.fillColor('#0f172a')
       .font('Helvetica-Bold')
       .fontSize(11)
       .text('Role Overview –', leftMargin, currentY);

    currentY = doc.y + 8;

    const assignedRole = role || 'Campus Ambassador';
    const assignedDuration = startDate ? `From ${startDate} till 2nd November` : 'Till 2nd November';

    const roles = [
      { label: 'Position', value: assignedRole },
      { label: 'Duration', value: assignedDuration },
      { label: 'Core Task', value: 'Promote fest events, drive registrations, and act as the main campus contact.' },
    ];

    roles.forEach((r) => {
      doc.fillColor('#0f172a')
         .font('Helvetica-Bold')
         .fontSize(10)
         .text('•  ', leftMargin + 8, currentY, { continued: true })
         .text(`${r.label} : `, { continued: true })
         .font('Helvetica')
         .fillColor('#334155')
         .text(r.value, { width: contentWidth - 20, lineGap: 3 });
      currentY = doc.y + 4;
    });

    currentY += 10;

    // Section 2: Your Rewards & Perks –
    doc.fillColor('#0f172a')
       .font('Helvetica-Bold')
       .fontSize(11)
       .text('Your Rewards & Perks –', leftMargin, currentY);

    currentY = doc.y + 8;

    const perks = [
      { label: 'Premium Swag', value: 'Earn exclusive merchandise including T-shirts, coffee mugs, and water bottles.' },
      { label: 'Level 5 Grand Prize', value: 'Unlock free, all-access entry for your entire team to the Qiskit Hackathon upon reaching Level 5.' },
      { label: 'Credentials', value: 'Receive an official Certificate of Excellence upon completion.' },
    ];

    perks.forEach((p) => {
      doc.fillColor('#0f172a')
         .font('Helvetica-Bold')
         .fontSize(10)
         .text('•  ', leftMargin + 8, currentY, { continued: true })
         .text(`${p.label} : `, { continued: true })
         .font('Helvetica')
         .fillColor('#334155')
         .text(p.value, { width: contentWidth - 20, lineGap: 3 });
      currentY = doc.y + 4;
    });

    currentY += 24;

    // Sign-off
    doc.fillColor('#1e293b')
       .font('Helvetica')
       .fontSize(10.5)
       .text('Warm regards,', leftMargin, currentY);

    currentY += 16;

    doc.fillColor('#0f172a')
       .font('Helvetica-Bold')
       .fontSize(10.5)
       .text('Plus Qiskit Fall Fest 2026,', leftMargin, currentY);

    currentY += 15;

    doc.fillColor('#475569')
       .font('Helvetica')
       .fontSize(10)
       .text('Rajiv Gandhi University of Knowledge Technologies – Srikakulam.', leftMargin, currentY);

    // Finalize PDF stream
    doc.end();
  } catch (error) {
    next(error);
  }
}

module.exports = {
  generateOfferLetter,
};

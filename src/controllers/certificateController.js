const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const config = require('../config');
const { formatDate, generateReferenceNumber } = require('../utils/helpers');

/**
 * Resolves the certificate template graphic path reliably across environments.
 * @returns {string|null} Resolved absolute path or null if not found
 */
function getCertificateTemplatePath() {
  const candidates = [
    path.join(__dirname, '../templates/certificate-template.png'),
    path.join(__dirname, '../templates/certificate-bg.png'),
    path.join(__dirname, '../templates/certificate-bg.jpg'),
    config.paths.certificateTemplate,
    config.paths.certificateTemplateAlt,
  ];
  return candidates.find((p) => p && fs.existsSync(p)) || null;
}

/**
 * Controller to generate and stream a landscape A4 Certificate of Excellence PDF.
 * Uses custom high-resolution background graphic template with precise dynamic field overlays.
 * 
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next handler
 */
function generateCertificate(req, res, next) {
  try {
    const { name, date, referralCode, level } = req.body;

    const formattedDate = date || formatDate(new Date());
    const certificateId = generateReferenceNumber('CERT', referralCode || name);
    const cleanFilename = `certificate-${name.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;

    // Initialize landscape A4 PDF: 841.89 pt x 595.28 pt (margin 0 for full bleed background)
    const doc = new PDFDocument({
      size: 'A4',
      layout: 'landscape',
      margin: 0,
      info: {
        Title: `Certificate of Appreciation - ${name}`,
        Author: config.company.name,
        Subject: 'Campus Ambassador Certificate',
        Keywords: 'certificate, ambassador, referral, quantum, honors',
      },
    });

    // Handle stream errors
    doc.on('error', (err) => {
      console.error('PDFKit generation error:', err);
      if (!res.headersSent) {
        return next(err);
      }
    });

    // Set HTTP headers for file download stream
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${cleanFilename}"`);
    res.setHeader('X-Document-Type', 'Ambassador-Certificate');
    res.setHeader('X-Certificate-Id', certificateId);

    // Pipe PDF vector stream directly to response
    doc.pipe(res);

    const pageWidth = doc.page.width;   // 841.89
    const pageHeight = doc.page.height; // 595.28

    const templatePath = getCertificateTemplatePath();

    if (templatePath) {
      // =========================================================================
      // 1. CUSTOM TEMPLATE BACKGROUND INTEGRATION (Full landscape A4 coverage)
      // =========================================================================
      doc.image(templatePath, 0, 0, { width: pageWidth, height: pageHeight });

      // =========================================================================
      // 2. PRECISE DYNAMIC OVERLAYS OVER DESIGNATED BLANK SLOTS
      // =========================================================================

      // Slot 1: Recipient Name (Centered under 'Awarded to' over the underline at Y=333.6 pt)
      // Available width: X=325.3 to X=699.1 (width: 373.8 pt)
      let nameFontSize = 32;
      if (name.length > 28) {
        nameFontSize = 22;
      } else if (name.length > 20) {
        nameFontSize = 26;
      } else if (name.length > 15) {
        nameFontSize = 28;
      }

      const nameSlotX = 325.3;
      const nameSlotWidth = 373.8;

      doc.fillColor('#0f172a')
         .font('Helvetica-Bold')
         .fontSize(nameFontSize)
         .text(name, nameSlotX, 292, {
           width: nameSlotWidth,
           align: 'center',
         });

      // Optional Slot 2: Tier / Level Indicator (Positioned right beneath the name line if provided)
      if (level) {
        const safeLevel = level.toUpperCase();
        doc.fillColor('#4338ca')
           .font('Helvetica-Bold')
           .fontSize(8.5)
           .text(`TIER LEVEL: ${safeLevel}`, nameSlotX, 340, {
             width: nameSlotWidth,
             align: 'center',
             characterSpacing: 1.5,
           });
      }

      // Slot 3: Date of Conferment (Rendered at the bottom-right signature/date line)
      doc.fillColor('#0f172a')
         .font('Helvetica-Bold')
         .fontSize(10)
         .text(formattedDate, 735, 547);

      // Optional Slot 4: Referral Code & Certificate Verification ID (In central gap between signature & date)
      if (referralCode) {
        doc.fillColor('#64748b')
           .font('Helvetica-Bold')
           .fontSize(8)
           .text(`REF: ${referralCode}`, 470, 538, { width: 220, align: 'center' })
           .font('Helvetica')
           .fontSize(7)
           .text(`CERT ID: ${certificateId}`, 470, 550, { width: 220, align: 'center' });
      }

      // Security / Integrity Footer watermark
      doc.fillColor('#94a3b8')
         .font('Helvetica')
         .fontSize(6.5)
         .text(
           `Verified Document Hash: ${certificateId} • RGUKT Srikakulam Qiskit Fall Fest '26 • ${config.company.website}`,
           0,
           580,
           { width: pageWidth, align: 'center' }
         );
    } else {
      // Graceful fallback: Programmatic styling if template file is missing
      doc.rect(0, 0, pageWidth, pageHeight).fillColor('#fcfbf7').fill();
      doc.rect(25, 25, pageWidth - 50, pageHeight - 50).lineWidth(3).strokeColor('#0f172a').stroke();
      doc.rect(33, 33, pageWidth - 66, pageHeight - 66).lineWidth(1).strokeColor('#d97706').stroke();

      doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(28).text('CERTIFICATE OF APPRECIATION', 0, 100, { align: 'center' });
      doc.fillColor('#64748b').font('Helvetica').fontSize(13).text('THIS IS PROUDLY PRESENTED TO', 0, 185, { align: 'center' });
      doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(32).text(name, 0, 220, { align: 'center' });
      doc.fillColor('#1e293b').font('Helvetica-Bold').fontSize(10).text(`TIER LEVEL: ${level.toUpperCase()}`, 0, 284, { align: 'center' });
      doc.fillColor('#334155').font('Helvetica').fontSize(12).text(`For outstanding commitment in the ${config.company.name} referral network.`, 120, 320, { align: 'center', width: pageWidth - 240 });
      doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(11).text(formattedDate, 90, 430);
      doc.fillColor('#0369a1').font('Helvetica-Bold').fontSize(11).text(referralCode, 90, 465);
    }

    // Finalize the PDF stream
    doc.end();
  } catch (error) {
    next(error);
  }
}

module.exports = {
  generateCertificate,
};

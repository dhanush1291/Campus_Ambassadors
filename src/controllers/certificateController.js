const PDFDocument = require('pdfkit');
const config = require('../config');
const { formatDate, generateReferenceNumber } = require('../utils/helpers');

/**
 * Controller to generate and stream a landscape A4 Certificate of Excellence PDF.
 * 
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next handler
 */
function generateCertificate(req, res, next) {
  try {
    const { name, referralCode, level } = req.body;

    const formattedDate = formatDate(new Date());
    const certificateId = generateReferenceNumber('CERT', referralCode);
    const cleanFilename = `certificate-${referralCode.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;

    // Initialize landscape A4 PDF: 841.89 pt x 595.28 pt
    const doc = new PDFDocument({
      size: 'A4',
      layout: 'landscape',
      margin: 40,
      info: {
        Title: `Certificate of Recognition - ${name}`,
        Author: config.company.name,
        Subject: 'Campus Ambassador Referral Program Certificate',
        Keywords: 'certificate, ambassador, referral, honor',
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

    // ==========================================
    // 1. BACKGROUND & BORDERS
    // ==========================================
    // Subtle background parchment fill
    doc.rect(0, 0, pageWidth, pageHeight)
       .fillColor('#fcfbf7')
       .fill();

    // Outer Navy Border
    doc.rect(25, 25, pageWidth - 50, pageHeight - 50)
       .lineWidth(3)
       .strokeColor('#0f172a')
       .stroke();

    // Inner Elegant Gold Border
    doc.rect(33, 33, pageWidth - 66, pageHeight - 66)
       .lineWidth(1)
       .strokeColor('#d97706')
       .stroke();

    // Secondary decorative thin inner border
    doc.rect(37, 37, pageWidth - 74, pageHeight - 74)
       .lineWidth(0.5)
       .strokeColor('#e2e8f0')
       .stroke();

    // Corner Geometric Ornaments
    const cornerSize = 24;
    const corners = [
      { x: 33, y: 33 },
      { x: pageWidth - 33 - cornerSize, y: 33 },
      { x: 33, y: pageHeight - 33 - cornerSize },
      { x: pageWidth - 33 - cornerSize, y: pageHeight - 33 - cornerSize },
    ];

    corners.forEach((c) => {
      doc.rect(c.x, c.y, cornerSize, cornerSize)
         .fillColor('#0f172a')
         .fill();
      doc.rect(c.x + 4, c.y + 4, cornerSize - 8, cornerSize - 8)
         .lineWidth(1)
         .strokeColor('#fbbf24')
         .stroke();
    });

    // ==========================================
    // 2. HEADER & BRANDING
    // ==========================================
    doc.fillColor('#475569')
       .font('Helvetica-Bold')
       .fontSize(11)
       .text(config.company.name.toUpperCase(), 0, 68, {
         align: 'center',
         characterSpacing: 4,
       });

    doc.fillColor('#0f172a')
       .font('Helvetica-Bold')
       .fontSize(28)
       .text('CERTIFICATE OF APPRECIATION', 0, 95, {
         align: 'center',
         characterSpacing: 2,
       });

    doc.fillColor('#d97706')
       .font('Helvetica-Bold')
       .fontSize(12)
       .text('CAMPUS AMBASSADOR REFERRAL PROGRAM', 0, 134, {
         align: 'center',
         characterSpacing: 3,
       });

    // Decorative header ribbon divider
    doc.moveTo(250, 158)
       .lineTo(pageWidth - 250, 158)
       .lineWidth(1.2)
       .strokeColor('#cbd5e1')
       .stroke();

    // Small Gold Diamond at center of divider
    const centerX = pageWidth / 2;
    doc.polygon(
      [centerX, 153],
      [centerX + 5, 158],
      [centerX, 163],
      [centerX - 5, 158]
    ).fillColor('#d97706').fill();

    // ==========================================
    // 3. PRESENTATION TEXT & RECIPIENT
    // ==========================================
    doc.fillColor('#64748b')
       .font('Helvetica')
       .fontSize(13)
       .text('THIS IS PROUDLY PRESENTED TO', 0, 185, {
         align: 'center',
         characterSpacing: 2,
       });

    // Recipient Name
    doc.fillColor('#0f172a')
       .font('Helvetica-Bold')
       .fontSize(32)
       .text(name, 0, 218, {
         align: 'center',
       });

    // Name underline with ornamental flourishes
    const nameUnderlineWidth = Math.min(Math.max(name.length * 16, 260), 500);
    doc.moveTo((pageWidth - nameUnderlineWidth) / 2, 262)
       .lineTo((pageWidth + nameUnderlineWidth) / 2, 262)
       .lineWidth(1.5)
       .strokeColor('#0f172a')
       .stroke();

    // Recipient Level Badge
    doc.roundedRect(centerX - 110, 276, 220, 26, 13)
       .fillColor('#f1f5f9')
       .strokeColor('#cbd5e1')
       .lineWidth(1)
       .fillAndStroke();

    doc.fillColor('#1e293b')
       .font('Helvetica-Bold')
       .fontSize(10)
       .text(`TIER LEVEL: ${level.toUpperCase()}`, 0, 284, {
         align: 'center',
         characterSpacing: 1.5,
       });

    // Body Citation Text
    doc.fillColor('#334155')
       .font('Helvetica')
       .fontSize(12)
       .text(
         `For outstanding commitment, exceptional leadership, and valuable community impact demonstrated through successful student advocacy in the ${config.company.name} referral network.`,
         120,
         320,
         {
           align: 'center',
           lineGap: 4,
           width: pageWidth - 240,
         }
       );

    // ==========================================
    // 4. VERIFICATION SEAL & CREDENTIAL DETAILS
    // ==========================================
    const sealX = centerX;
    const sealY = 440;

    // Draw Vector Seal
    doc.circle(sealX, sealY, 36)
       .lineWidth(2)
       .strokeColor('#d97706')
       .stroke();

    doc.circle(sealX, sealY, 31)
       .lineWidth(0.8)
       .strokeColor('#fbbf24')
       .stroke();

    // Seal Center Star
    doc.fillColor('#d97706')
       .font('Helvetica-Bold')
       .fontSize(18)
       .text('★', sealX - 9, sealY - 14, { width: 18, align: 'center' });

    doc.fillColor('#b45309')
       .font('Helvetica-Bold')
       .fontSize(6)
       .text('OFFICIAL VERIFIED SEAL', sealX - 40, sealY + 8, {
         width: 80,
         align: 'center',
         characterSpacing: 0.5,
       });

    // Left Column: Verification & Date
    const leftColX = 90;
    const detailsY = 415;

    doc.fillColor('#64748b')
       .font('Helvetica')
       .fontSize(9)
       .text('DATE OF CONFERMENT', leftColX, detailsY);

    doc.fillColor('#0f172a')
       .font('Helvetica-Bold')
       .fontSize(11)
       .text(formattedDate, leftColX, detailsY + 14);

    doc.fillColor('#64748b')
       .font('Helvetica')
       .fontSize(9)
       .text('REFERRAL CODE', leftColX, detailsY + 36);

    doc.fillColor('#0369a1')
       .font('Helvetica-Bold')
       .fontSize(11)
       .text(referralCode, leftColX, detailsY + 50);

    doc.fillColor('#94a3b8')
       .font('Helvetica')
       .fontSize(7.5)
       .text(`CERT ID: ${certificateId}`, leftColX, detailsY + 70);

    // Right Column: Signatures
    const rightColX = pageWidth - 240;

    // Signature Line
    doc.moveTo(rightColX, detailsY + 45)
       .lineTo(rightColX + 160, detailsY + 45)
       .lineWidth(1)
       .strokeColor('#94a3b8')
       .stroke();

    // Stylized signature simulation
    doc.fillColor('#1e293b')
       .font('Helvetica-Bold')
       .fontSize(11)
       .text('Marcus Sterling', rightColX, detailsY + 52);

    doc.fillColor('#64748b')
       .font('Helvetica')
       .fontSize(9)
       .text('Director of Global Partnerships', rightColX, detailsY + 66);

    doc.fillColor('#94a3b8')
       .font('Helvetica')
       .fontSize(8)
       .text(config.company.name, rightColX, detailsY + 78);

    // Bottom Security Banner
    doc.fillColor('#94a3b8')
       .font('Helvetica')
       .fontSize(7.5)
       .text(
         `Secure Document Verification Hash: ${certificateId} • Issued by ${config.company.name} • ${config.company.website}`,
         0,
         pageHeight - 48,
         {
           align: 'center',
         }
       );

    // Finalize the PDF stream
    doc.end();
  } catch (error) {
    next(error);
  }
}

module.exports = {
  generateCertificate,
};

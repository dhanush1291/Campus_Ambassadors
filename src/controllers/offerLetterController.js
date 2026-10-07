const PDFDocument = require('pdfkit');
const config = require('../config');
const { formatDate, generateReferenceNumber } = require('../utils/helpers');

/**
 * Controller to generate and stream an official portrait multi-section Offer Letter PDF.
 * 
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next handler
 */
function generateOfferLetter(req, res, next) {
  try {
    const { name, role, startDate, referralCode } = req.body;

    const formattedIssueDate = formatDate(new Date());
    const referenceNumber = generateReferenceNumber('NCN/OFFER', referralCode);
    const cleanFilename = `offer-letter-${referralCode.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;

    // Initialize portrait A4 PDF: 595.28 pt x 841.89 pt
    const doc = new PDFDocument({
      size: 'A4',
      layout: 'portrait',
      margins: { top: 45, bottom: 45, left: 50, right: 50 },
      info: {
        Title: `Offer of Appointment - ${name}`,
        Author: config.company.name,
        Subject: `Campus Ambassador Offer Letter - ${role}`,
        Keywords: 'offer letter, campus ambassador, appointment, referral',
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

    const pageWidth = doc.page.width;   // 595.28
    const pageHeight = doc.page.height; // 841.89
    const contentWidth = pageWidth - 100; // 495.28

    // ==========================================
    // 1. CORPORATE LETTERHEAD
    // ==========================================
    // Accent top banner bar
    doc.rect(0, 0, pageWidth, 6)
       .fillColor('#2563eb')
       .fill();

    // Brand Logo Emblem (Vector Hexagon + N)
    const logoX = 50;
    const logoY = 32;
    doc.roundedRect(logoX, logoY, 36, 36, 8)
       .fillColor('#0f172a')
       .fill();
    
    doc.fillColor('#38bdf8')
       .font('Helvetica-Bold')
       .fontSize(20)
       .text('N', logoX + 11, logoY + 8);

    // Brand Name and Tagline
    doc.fillColor('#0f172a')
       .font('Helvetica-Bold')
       .fontSize(16)
       .text(config.company.name, 96, 33);

    doc.fillColor('#64748b')
       .font('Helvetica')
       .fontSize(8.5)
       .text(config.company.tagline, 96, 52);

    // Right-aligned company contacts
    doc.fillColor('#475569')
       .font('Helvetica')
       .fontSize(8)
       .text(config.company.address, 320, 33, { align: 'right', width: 225 })
       .text(`Email: ${config.company.email}`, 320, 45, { align: 'right', width: 225 })
       .text(`Web: ${config.company.website}`, 320, 57, { align: 'right', width: 225 });

    // Header divider line
    doc.moveTo(50, 78)
       .lineTo(pageWidth - 50, 78)
       .lineWidth(1)
       .strokeColor('#e2e8f0')
       .stroke();

    // ==========================================
    // 2. METADATA & RECIPIENT INFORMATION
    // ==========================================
    let currentY = 92;

    doc.fillColor('#64748b')
       .font('Helvetica')
       .fontSize(8.5)
       .text(`Date: ${formattedIssueDate}`, 50, currentY)
       .text(`Ref No: ${referenceNumber}`, 340, currentY, { align: 'right', width: 205 });

    currentY += 20;

    // Recipient Details
    doc.fillColor('#1e293b')
       .font('Helvetica-Bold')
       .fontSize(10)
       .text('To,', 50, currentY);

    currentY += 13;
    doc.fillColor('#0f172a')
       .font('Helvetica-Bold')
       .fontSize(11)
       .text(name, 50, currentY);

    currentY += 14;
    doc.fillColor('#475569')
       .font('Helvetica')
       .fontSize(9)
       .text('Campus Ambassador Designee', 50, currentY);

    currentY += 22;

    // ==========================================
    // 3. SUBJECT LINE
    // ==========================================
    doc.roundedRect(50, currentY, contentWidth, 24, 4)
       .fillColor('#f8fafc')
       .strokeColor('#cbd5e1')
       .lineWidth(0.8)
       .fillAndStroke();

    doc.fillColor('#0f172a')
       .font('Helvetica-Bold')
       .fontSize(9.5)
       .text(`SUBJECT: OFFICIAL APPOINTMENT LETTER — ${role.toUpperCase()}`, 60, currentY + 7);

    currentY += 36;

    // ==========================================
    // 4. LETTER BODY SECTIONS
    // ==========================================
    // Salutation
    doc.fillColor('#1e293b')
       .font('Helvetica')
       .fontSize(9.5)
       .text(`Dear ${name},`, 50, currentY);

    currentY += 16;

    // Section 1: Appointment & Welcome
    doc.fillColor('#334155')
       .font('Helvetica')
       .fontSize(9)
       .text(
         `On behalf of ${config.company.name}, we are delighted to offer you the official position of `,
         50,
         currentY,
         { continued: true, lineGap: 3, width: contentWidth }
       )
       .font('Helvetica-Bold')
       .text(`${role}`, { continued: true })
       .font('Helvetica')
       .text(` under our Global Campus Leadership Initiative. Your commitment to community development, student advocacy, and technological innovation distinguished your profile among all applicants.`);

    currentY = doc.y + 10;

    // Section 2: Commencement & Referral Tracking
    doc.fillColor('#0f172a')
       .font('Helvetica-Bold')
       .fontSize(9.5)
       .text('1. Appointment Details & Program Tracking', 50, currentY);

    currentY = doc.y + 5;

    // Info Box with role, date, and referral code
    doc.roundedRect(50, currentY, contentWidth, 44, 4)
       .fillColor('#f1f5f9')
       .fill();

    doc.fillColor('#475569')
       .font('Helvetica')
       .fontSize(8.5)
       .text('• Effective Start Date:', 60, currentY + 8)
       .text('• Assigned Role:', 60, currentY + 24)
       .text('• Unique Referral Code:', 290, currentY + 8)
       .text('• Reporting Channel:', 290, currentY + 24);

    doc.fillColor('#0f172a')
       .font('Helvetica-Bold')
       .fontSize(8.5)
       .text(`${startDate}`, 165, currentY + 8)
       .text(`${role}`, 165, currentY + 24);

    doc.fillColor('#0284c7')
       .font('Helvetica-Bold')
       .fontSize(8.5)
       .text(`${referralCode}`, 410, currentY + 8);

    doc.fillColor('#0f172a')
       .font('Helvetica-Bold')
       .fontSize(8.5)
       .text('Community Lead', 410, currentY + 24);

    currentY += 54;

    // Section 3: Key Scope of Responsibilities
    doc.fillColor('#0f172a')
       .font('Helvetica-Bold')
       .fontSize(9.5)
       .text('2. Core Scope & Responsibilities', 50, currentY);

    currentY = doc.y + 4;

    const responsibilities = [
      'Serve as the key brand representative and student point of contact for our community initiatives across your campus.',
      'Organize information sessions, hackathon onboarding, and technical workshops to foster peer participation.',
      `Promote verified enrollments utilizing your unique referral code (${referralCode}) through digital and campus channels.`,
      'Provide regular feedback to the regional community lead on campus student sentiment and feature requests.',
    ];

    responsibilities.forEach((item) => {
      doc.fillColor('#0284c7')
         .font('Helvetica-Bold')
         .fontSize(9)
         .text('•', 58, currentY, { continued: true })
         .fillColor('#334155')
         .font('Helvetica')
         .fontSize(8.5)
         .text(`  ${item}`, { width: contentWidth - 16, lineGap: 2 });
      currentY = doc.y + 3;
    });

    currentY += 6;

    // Section 4: Benefits, Recognition & Perks
    doc.fillColor('#0f172a')
       .font('Helvetica-Bold')
       .fontSize(9.5)
       .text('3. Ambassador Benefits & Tiered Incentives', 50, currentY);

    currentY = doc.y + 4;

    const benefits = [
      'Official Certificate of Leadership & Letter of Recommendation upon successful tenure completion.',
      'Milestone-based rewards, merchandise packs, and exclusive developer tool subscriptions.',
      'Priority access to high-impact internships, industry mentors, and executive networking roundtables.',
    ];

    benefits.forEach((item) => {
      doc.fillColor('#10b981')
         .font('Helvetica-Bold')
         .fontSize(9)
         .text('✓', 58, currentY, { continued: true })
         .fillColor('#334155')
         .font('Helvetica')
         .fontSize(8.5)
         .text(`  ${item}`, { width: contentWidth - 16, lineGap: 2 });
      currentY = doc.y + 3;
    });

    currentY += 6;

    // Section 5: Terms & Code of Conduct
    doc.fillColor('#0f172a')
       .font('Helvetica-Bold')
       .fontSize(9.5)
       .text('4. Code of Conduct & Integrity', 50, currentY);

    currentY = doc.y + 4;

    doc.fillColor('#334155')
       .font('Helvetica')
       .fontSize(8.5)
       .text(
         'As an ambassador, you are expected to uphold the highest standards of integrity, professional communication, and academic honesty. Misrepresentation or fraudulent referral activities will lead to immediate disqualification and revocation of benefits.',
         50,
         currentY,
         { width: contentWidth, lineGap: 2 }
       );

    currentY = doc.y + 16;

    // ==========================================
    // 5. SIGNATURE & AUTHORIZED SIGNATORY BLOCK
    // ==========================================
    doc.fillColor('#1e293b')
       .font('Helvetica')
       .fontSize(9)
       .text('We look forward to a rewarding and transformative partnership.', 50, currentY);

    currentY += 18;

    doc.fillColor('#475569')
       .font('Helvetica')
       .fontSize(8.5)
       .text('Sincerely,', 50, currentY);

    currentY += 12;

    // Signature Line
    doc.moveTo(50, currentY + 25)
       .lineTo(210, currentY + 25)
       .lineWidth(1)
       .strokeColor('#94a3b8')
       .stroke();

    // Stylized Signatory Details
    doc.fillColor('#0f172a')
       .font('Helvetica-Bold')
       .fontSize(9.5)
       .text('Dr. Aris Thorne', 50, currentY + 30);

    doc.fillColor('#64748b')
       .font('Helvetica')
       .fontSize(8)
       .text('Global Director of Student Programs', 50, currentY + 42)
       .text(config.company.name, 50, currentY + 52);

    // Official Stamp / Seal Vector Box
    const stampX = pageWidth - 170;
    const stampY = currentY + 2;

    doc.roundedRect(stampX, stampY, 120, 50, 4)
       .lineWidth(1)
       .strokeColor('#cbd5e1')
       .stroke();

    doc.fillColor('#0369a1')
       .font('Helvetica-Bold')
       .fontSize(7)
       .text('OFFICIALLY AUTHORIZED', stampX, stampY + 10, { width: 120, align: 'center' });

    doc.fillColor('#64748b')
       .font('Helvetica')
       .fontSize(6)
       .text(`${config.company.name}`, stampX, stampY + 22, { width: 120, align: 'center' })
       .text(`HASH: ${referenceNumber.slice(-8)}`, stampX, stampY + 32, { width: 120, align: 'center' });

    // ==========================================
    // 6. CORPORATE FOOTER
    // ==========================================
    const footerY = pageHeight - 34;

    doc.moveTo(50, footerY - 8)
       .lineTo(pageWidth - 50, footerY - 8)
       .lineWidth(0.5)
       .strokeColor('#e2e8f0')
       .stroke();

    doc.fillColor('#94a3b8')
       .font('Helvetica')
       .fontSize(7)
       .text(
         `${config.company.name} • Confidential Document • Official Campus Ambassador Appointment Letter • Page 1 of 1`,
         50,
         footerY,
         { align: 'center', width: contentWidth }
       );

    // Finalize PDF stream
    doc.end();
  } catch (error) {
    next(error);
  }
}

module.exports = {
  generateOfferLetter,
};

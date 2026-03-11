/**
 * PDF Receipt Generation Handler
 * GET /download-receipt/:orderId - Generate and download PDF receipt directly
 * 
 * Industrial-grade premium receipt design
 */

import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { errorResponse } from '../utils/response.js';
import { createSupabaseClient } from '../services/supabase.js';

/**
 * Generate PDF receipt and return as downloadable file
 * GET /download-receipt/:orderId
 */
export async function handlePDFReceipt(orderId, env) {
  if (!orderId) {
    return errorResponse('Order ID is required', null, 400);
  }

  try {
    // Fetch registration data from Supabase
    const supabase = createSupabaseClient(env);

    if (!supabase) {
      return errorResponse('Database connection failed', 'Supabase client could not be created', 500);
    }

    const { data, error: fetchError } = await supabase
      .from('pre_registrations')
      .select('*')
      .eq('razorpay_order_id', orderId)
      .maybeSingle();

    if (fetchError) {
      console.error('Supabase error:', fetchError);
      return errorResponse('Failed to fetch receipt data', fetchError.message, 500);
    }

    if (!data) {
      return errorResponse('Receipt not found', 'No registration found for this order ID', 404);
    }

    // Generate PDF
    const pdfBytes = await generatePDF(data, orderId);

    // Return PDF as downloadable file
    return new Response(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="SkillPassport_Receipt_${orderId}.pdf"`,
        'Cache-Control': 'no-cache',
        'Access-Control-Allow-Origin': '*',
      },
    });

  } catch (error) {
    console.error('Error generating PDF receipt:', error);
    return errorResponse('Failed to generate PDF receipt', error.message, 500);
  }
}


// ═══════════════════════════════════════════════════════════
//  Helper: Draw text centered on page
// ═══════════════════════════════════════════════════════════
function drawCentered(page, text, y, font, size, color, pageWidth) {
  const w = font.widthOfTextAtSize(text, size);
  page.drawText(text, { x: (pageWidth - w) / 2, y, size, font, color });
}

// ═══════════════════════════════════════════════════════════
//  Helper: Draw a label → value row
// ═══════════════════════════════════════════════════════════
function drawRow(page, label, value, y, labelFont, valueFont, labelColor, valueColor, x, gap) {
  page.drawText(label, { x, y, size: 11, font: labelFont, color: labelColor });
  page.drawText(value || '—', { x: x + gap, y, size: 11, font: valueFont, color: valueColor });
}


// ═══════════════════════════════════════════════════════════
//  Main PDF generation — Industrial-grade receipt
// ═══════════════════════════════════════════════════════════
async function generatePDF(data, orderId) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]); // A4
  const { width, height } = page.getSize();

  // Fonts
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const regular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const oblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  // ── Colour palette ──────────────────────────────────────
  const blue = rgb(0.118, 0.251, 0.686);   // #1e40af
  const blueLight = rgb(0.231, 0.510, 0.965);   // #3b82f6
  const bluePale = rgb(0.878, 0.918, 0.976);   // #e0eafa (very light blue)
  const white = rgb(1, 1, 1);
  const dark = rgb(0.133, 0.149, 0.169);   // #222639
  const darkGray = rgb(0.216, 0.255, 0.318);   // #374151
  const medGray = rgb(0.420, 0.447, 0.502);   // #6b7280
  const lightGray = rgb(0.612, 0.639, 0.686);   // #9ca3af
  const bgGray = rgb(0.961, 0.965, 0.973);   // #f5f6f8
  const borderGray = rgb(0.878, 0.886, 0.906);   // #e0e2e7
  const emerald = rgb(0.133, 0.545, 0.133);   // #228b22
  const emeraldBg = rgb(0.863, 0.953, 0.863);   // #dcf3dc
  const red = rgb(0.863, 0.196, 0.184);   // #dc322f
  const redBg = rgb(0.976, 0.890, 0.890);   // #f9e3e3

  // Layout constants
  const margin = 50;
  const inner = margin + 16;
  const contentW = width - margin * 2;

  let y = height;

  // ───────────────────────────────────────────────────────
  //  1. HEADER BAR — Full-width deep blue
  // ───────────────────────────────────────────────────────
  const headerH = 90;
  page.drawRectangle({
    x: 0, y: height - headerH,
    width, height: headerH,
    color: blue,
  });

  // Subtle accent stripe at the bottom of the header
  page.drawRectangle({
    x: 0, y: height - headerH,
    width, height: 4,
    color: blueLight,
  });

  // "SKILL PASSPORT" — large centred white text
  drawCentered(page, 'SKILL PASSPORT', height - 42, bold, 28, white, width);

  // "PRE-REGISTRATION RECEIPT" — smaller subtitle
  drawCentered(page, 'REGISTRATION RECEIPT', height - 68, regular, 13, rgb(0.749, 0.859, 0.976), width);

  y = height - headerH - 28;

  // ───────────────────────────────────────────────────────
  //  2. RECEIPT METADATA STRIP — light gray bar
  // ───────────────────────────────────────────────────────
  const metaH = 36;
  page.drawRectangle({
    x: margin, y: y - metaH,
    width: contentW, height: metaH,
    color: bgGray,
    borderColor: borderGray,
    borderWidth: 1,
  });

  // Round the display of orderId for cleanliness
  const displayOrderId = orderId.length > 30 ? orderId.substring(0, 30) + '…' : orderId;
  page.drawText(`Receipt No:  ${displayOrderId}`, {
    x: inner, y: y - 24, size: 10, font: regular, color: darkGray,
  });

  const dateStr = new Date(data.created_at).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'long', year: 'numeric',
  });
  const dateLabel = `Date:  ${dateStr}`;
  const dateLabelW = regular.widthOfTextAtSize(dateLabel, 10);
  page.drawText(dateLabel, {
    x: width - margin - 16 - dateLabelW, y: y - 24, size: 10, font: regular, color: darkGray,
  });

  y -= metaH + 30;

  // ───────────────────────────────────────────────────────
  //  3. REGISTRATION DETAILS CARD
  // ───────────────────────────────────────────────────────
  const regCardH = 130;

  // Outer border
  page.drawRectangle({
    x: margin, y: y - regCardH,
    width: contentW, height: regCardH,
    borderColor: borderGray, borderWidth: 1,
    color: white,
  });

  // Blue left accent bar
  page.drawRectangle({
    x: margin, y: y - regCardH,
    width: 5, height: regCardH,
    color: blue,
  });

  // Section title
  page.drawText('REGISTRATION DETAILS', {
    x: inner + 12, y: y - 26, size: 12, font: bold, color: blue,
  });

  // Divider under title
  page.drawLine({
    start: { x: inner + 12, y: y - 34 },
    end: { x: width - margin - 16, y: y - 34 },
    thickness: 0.5, color: borderGray,
  });

  // Detail rows
  const rowX = inner + 12;
  const valGap = 110;
  let ry = y - 56;

  drawRow(page, 'Name', data.full_name, ry, regular, bold, medGray, dark, rowX, valGap);
  ry -= 24;
  drawRow(page, 'Email', data.email, ry, regular, regular, medGray, darkGray, rowX, valGap);
  ry -= 24;
  drawRow(page, 'Phone', data.phone, ry, regular, regular, medGray, darkGray, rowX, valGap);

  y -= regCardH + 20;

  // ───────────────────────────────────────────────────────
  //  4. PAYMENT SUMMARY CARD
  // ───────────────────────────────────────────────────────
  const payCardH = 155;

  // Outer border
  page.drawRectangle({
    x: margin, y: y - payCardH,
    width: contentW, height: payCardH,
    borderColor: borderGray, borderWidth: 1,
    color: white,
  });

  // Blue left accent bar
  page.drawRectangle({
    x: margin, y: y - payCardH,
    width: 5, height: payCardH,
    color: blue,
  });

  // Section title
  page.drawText('PAYMENT SUMMARY', {
    x: inner + 12, y: y - 26, size: 12, font: bold, color: blue,
  });

  // Divider under title
  page.drawLine({
    start: { x: inner + 12, y: y - 34 },
    end: { x: width - margin - 16, y: y - 34 },
    thickness: 0.5, color: borderGray,
  });

  let py = y - 58;
  const amount = data.amount || 499;

  // Amount row — prominent
  page.drawText('Amount Paid', { x: rowX, y: py, size: 11, font: regular, color: medGray });
  const amountStr = `Rs. ${amount.toLocaleString('en-IN')}`;
  page.drawText(amountStr, { x: rowX + valGap, y: py - 2, size: 20, font: bold, color: blue });

  py -= 32;

  // Payment Status — badge
  const status = (data.payment_status || 'completed').toLowerCase();
  const isCompleted = status === 'completed';
  const badgeColor = isCompleted ? emerald : red;
  const badgeBg = isCompleted ? emeraldBg : redBg;
  const badgeText = status.toUpperCase();
  const badgeTextW = bold.widthOfTextAtSize(badgeText, 9);
  const badgePadX = 10;
  const badgePadY = 4;
  const badgeW = badgeTextW + badgePadX * 2;
  const badgeH = 18;
  const badgeX = rowX + valGap;
  const badgeY = py - 3;

  page.drawText('Payment Status', { x: rowX, y: py, size: 11, font: regular, color: medGray });

  // Badge background
  page.drawRectangle({
    x: badgeX, y: badgeY,
    width: badgeW, height: badgeH,
    color: badgeBg,
    borderColor: badgeColor, borderWidth: 1,
  });
  // Badge text
  page.drawText(badgeText, {
    x: badgeX + badgePadX, y: badgeY + badgePadY + 1,
    size: 9, font: bold, color: badgeColor,
  });

  py -= 28;

  // Payment Method
  drawRow(page, 'Payment Method', 'Razorpay (Online)', py, regular, regular, medGray, darkGray, rowX, valGap);

  py -= 28;

  // Transaction ID (if available)
  const paymentId = data.razorpay_payment_id;
  if (paymentId) {
    drawRow(page, 'Transaction ID', paymentId, py, regular, regular, medGray, darkGray, rowX, valGap);
  }

  y -= payCardH + 30;

  // ───────────────────────────────────────────────────────
  //  5. DASHED SEPARATOR
  // ───────────────────────────────────────────────────────
  const dashLen = 6;
  const gapLen = 4;
  let dx = margin;
  while (dx < width - margin) {
    const end = Math.min(dx + dashLen, width - margin);
    page.drawLine({
      start: { x: dx, y },
      end: { x: end, y },
      thickness: 1, color: borderGray,
    });
    dx += dashLen + gapLen;
  }

  y -= 28;

  // ───────────────────────────────────────────────────────
  //  6. THANK YOU MESSAGE
  // ───────────────────────────────────────────────────────
  drawCentered(page, 'Thank you for registering with Skill Passport!', y, bold, 13, dark, width);
  y -= 22;
  drawCentered(page, 'Your account will be activated once you signup.', y, regular, 10, medGray, width);
  y -= 16;
  drawCentered(page, 'You will receive further updates via email.', y, regular, 10, medGray, width);

  y -= 36;

  // ───────────────────────────────────────────────────────
  //  7. CONTACT SECTION
  // ───────────────────────────────────────────────────────
  // Light blue info bar
  const contactH = 42;
  page.drawRectangle({
    x: margin, y: y - contactH,
    width: contentW, height: contactH,
    color: bluePale,
  });

  const contactY = y - 18;
  page.drawText('Need help?', {
    x: inner, y: contactY, size: 10, font: bold, color: blue,
  });
  page.drawText('marketing@rareminds.in  |  +91 9562481100', {
    x: inner + 80, y: contactY, size: 10, font: regular, color: darkGray,
  });
  page.drawText('www.skillpassport.rareminds.in', {
    x: inner, y: contactY - 16, size: 9, font: regular, color: medGray,
  });

  y -= contactH + 30;

  // ───────────────────────────────────────────────────────
  //  8. FOOTER — Computer-generated disclaimer
  // ───────────────────────────────────────────────────────
  drawCentered(page, 'This is a computer-generated receipt and does not require a signature.', y, oblique, 8, lightGray, width);
  y -= 14;
  drawCentered(page, `© ${new Date().getFullYear()} Skill Passport by Rareminds Private Limited. All rights reserved.`, y, regular, 8, lightGray, width);

  // ── Bottom accent line ─────────────────────────────────
  page.drawRectangle({
    x: 0, y: 0,
    width, height: 6,
    color: blue,
  });

  // Serialize
  return await pdfDoc.save();
}

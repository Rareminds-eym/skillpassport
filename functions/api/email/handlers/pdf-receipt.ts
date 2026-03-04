/**
 * PDF Receipt Generation Handler
 * GET /api/email/download-receipt/:orderId
 */

import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Env } from '../../../../src/functions-lib/types';
import type { PreRegistration } from '../types';
import { jsonResponse, corsHeaders } from '../../../../src/functions-lib';
import { getPreRegistrationByOrderId } from '../services/database';

export async function handlePDFReceipt(
  orderId: string,
  env: Env,
  supabase: SupabaseClient
): Promise<Response> {
  if (!orderId) {
    return jsonResponse({ success: false, error: 'Order ID is required' }, 400);
  }

  if (!supabase) {
    return jsonResponse({ success: false, error: 'Database connection failed' }, 500);
  }

  try {
    const { data, error: fetchError } = await getPreRegistrationByOrderId(supabase, orderId);

    if (fetchError) {
      console.error('Supabase error:', fetchError);
      return jsonResponse({ success: false, error: 'Failed to fetch receipt data' }, 500);
    }

    if (!data) {
      return jsonResponse({ success: false, error: 'Receipt not found' }, 404);
    }

    // Generate PDF
    const baseUrl = env.APP_URL || 'https://skillpassport.rareminds.in';
    const pdfBytes = await generatePDF(data, orderId, baseUrl);

    // Return PDF as downloadable file
    return new Response(pdfBytes, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="SkillPassport_Receipt_${orderId}.pdf"`,
        'Cache-Control': 'no-cache',
      },
    });

  } catch (error: any) {
    console.error('Error generating PDF receipt:', error);
    return jsonResponse({ success: false, error: 'Failed to generate PDF receipt' }, 500);
  }
}

// Helper: Draw text centered on page
function drawCentered(page: any, text: string, y: number, font: any, size: number, color: any, pageWidth: number) {
  const w = font.widthOfTextAtSize(text, size);
  page.drawText(text, { x: (pageWidth - w) / 2, y, size, font, color });
}

// Helper: Draw a label → value row
function drawRow(page: any, label: string, value: string, y: number, labelFont: any, valueFont: any, labelColor: any, valueColor: any, x: number, gap: number) {
  page.drawText(label, { x, y, size: 11, font: labelFont, color: labelColor });
  page.drawText(value || '—', { x: x + gap, y, size: 11, font: valueFont, color: valueColor });
}

async function generatePDF(data: PreRegistration, orderId: string, baseUrl: string): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]); // A4
  const { width, height } = page.getSize();

  // Fonts
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const regular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const oblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  // Color palette
  const blue = rgb(0.118, 0.251, 0.686);
  const blueLight = rgb(0.231, 0.510, 0.965);
  const white = rgb(1, 1, 1);
  const dark = rgb(0.133, 0.149, 0.169);
  const darkGray = rgb(0.216, 0.255, 0.318);
  const medGray = rgb(0.420, 0.447, 0.502);
  const lightGray = rgb(0.612, 0.639, 0.686);
  const bgGray = rgb(0.961, 0.965, 0.973);
  const borderGray = rgb(0.878, 0.886, 0.906);
  const emerald = rgb(0.133, 0.545, 0.133);
  const emeraldBg = rgb(0.863, 0.953, 0.863);
  const red = rgb(0.863, 0.196, 0.184);
  const redBg = rgb(0.976, 0.890, 0.890);

  const margin = 50;
  const inner = margin + 16;
  const contentW = width - margin * 2;

  let y = height;

  // HEADER BAR
  const headerH = 90;
  page.drawRectangle({
    x: 0, y: height - headerH,
    width, height: headerH,
    color: blue,
  });

  page.drawRectangle({
    x: 0, y: height - headerH,
    width, height: 4,
    color: blueLight,
  });

  drawCentered(page, 'SKILL PASSPORT', height - 42, bold, 28, white, width);
  drawCentered(page, 'REGISTRATION RECEIPT', height - 68, regular, 13, rgb(0.749, 0.859, 0.976), width);

  y = height - headerH - 28;

  // RECEIPT METADATA STRIP
  const metaH = 36;
  page.drawRectangle({
    x: margin, y: y - metaH,
    width: contentW, height: metaH,
    color: bgGray,
    borderColor: borderGray,
    borderWidth: 1,
  });

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

  // REGISTRATION DETAILS CARD
  const regCardH = 130;

  page.drawRectangle({
    x: margin, y: y - regCardH,
    width: contentW, height: regCardH,
    borderColor: borderGray, borderWidth: 1,
    color: white,
  });

  page.drawRectangle({
    x: margin, y: y - regCardH,
    width: 5, height: regCardH,
    color: blue,
  });

  page.drawText('REGISTRATION DETAILS', {
    x: inner + 12, y: y - 26, size: 12, font: bold, color: blue,
  });

  page.drawLine({
    start: { x: inner + 12, y: y - 34 },
    end: { x: width - margin - 16, y: y - 34 },
    thickness: 0.5, color: borderGray,
  });

  const rowX = inner + 12;
  const valGap = 110;
  let ry = y - 56;

  drawRow(page, 'Name', data.full_name, ry, regular, bold, medGray, dark, rowX, valGap);
  ry -= 24;
  drawRow(page, 'Email', data.email, ry, regular, regular, medGray, darkGray, rowX, valGap);
  ry -= 24;
  drawRow(page, 'Phone', data.phone || '', ry, regular, regular, medGray, darkGray, rowX, valGap);

  y -= regCardH + 20;

  // PAYMENT SUMMARY CARD
  const payCardH = 155;

  page.drawRectangle({
    x: margin, y: y - payCardH,
    width: contentW, height: payCardH,
    borderColor: borderGray, borderWidth: 1,
    color: white,
  });

  page.drawRectangle({
    x: margin, y: y - payCardH,
    width: 5, height: payCardH,
    color: blue,
  });

  page.drawText('PAYMENT SUMMARY', {
    x: inner + 12, y: y - 26, size: 12, font: bold, color: blue,
  });

  page.drawLine({
    start: { x: inner + 12, y: y - 34 },
    end: { x: width - margin - 16, y: y - 34 },
    thickness: 0.5, color: borderGray,
  });

  let py = y - 58;
  const amount = data.amount || 499;

  page.drawText('Amount Paid', { x: rowX, y: py, size: 11, font: regular, color: medGray });
  const amountStr = `Rs. ${amount.toLocaleString('en-IN')}`;
  page.drawText(amountStr, { x: rowX + valGap, y: py - 2, size: 20, font: bold, color: blue });

  py -= 32;

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

  page.drawRectangle({
    x: badgeX, y: badgeY,
    width: badgeW, height: badgeH,
    color: badgeBg,
    borderColor: badgeColor, borderWidth: 1,
  });
  page.drawText(badgeText, {
    x: badgeX + badgePadX, y: badgeY + badgePadY + 1,
    size: 9, font: bold, color: badgeColor,
  });

  py -= 28;

  drawRow(page, 'Payment Method', 'Razorpay (Online)', py, regular, regular, medGray, darkGray, rowX, valGap);

  py -= 28;

  const paymentId = data.razorpay_payment_id;
  if (paymentId) {
    drawRow(page, 'Transaction ID', paymentId, py, regular, regular, medGray, darkGray, rowX, valGap);
  }

  y -= payCardH + 30;

  // DASHED SEPARATOR
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

  // THANK YOU MESSAGE
  drawCentered(page, 'Thank you for registering with Skill Passport!', y, bold, 13, dark, width);
  y -= 22;
  drawCentered(page, 'Your account will be activated once you signup.', y, regular, 10, medGray, width);
  y -= 16;
  drawCentered(page, 'You will receive further updates via email.', y, regular, 10, medGray, width);

  y -= 36;

  // CONTACT SECTION
  const contactH = 42;
  page.drawRectangle({
    x: margin, y: y - contactH,
    width: contentW, height: contactH,
    color: rgb(0.878, 0.918, 0.976),
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

  // FOOTER
  drawCentered(page, 'This is a computer-generated receipt and does not require a signature.', y, oblique, 8, lightGray, width);
  y -= 14;
  drawCentered(page, `© ${new Date().getFullYear()} Skill Passport by Rareminds Private Limited. All rights reserved.`, y, regular, 8, lightGray, width);

  // Bottom accent line
  page.drawRectangle({
    x: 0, y: 0,
    width, height: 6,
    color: blue,
  });

  return await pdfDoc.save();
}

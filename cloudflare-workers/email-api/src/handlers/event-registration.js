/**
 * Event registration email handlers
 * POST /event-confirmation - Send confirmation emails with PDF receipt
 * POST /event-otp - Send OTP verification email
 */

import {
  generateUserConfirmationHtml,
  generateAdminNotificationHtml,
  generateOTPEmailHtml,
  getUserConfirmationSubject,
  getAdminNotificationSubject,
  getOTPSubject
} from '../templates/event-registration.js';
import { sendEmail } from '../services/mailer.js';
import { sendEmailWithAttachment } from '../services/mailer-with-attachments.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { DEFAULT_FROM_EMAIL, DEFAULT_FROM_NAME } from '../config/constants.js';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

/**
 * Handle event registration confirmation emails
 * Sends both user confirmation and admin notification
 * POST /event-confirmation
 */
export async function handleEventConfirmation(body, env) {
  const { name, email, phone, amount, orderId, campaign } = body;

  // Validate required fields
  if (!name || !email || !phone || !amount) {
    return errorResponse(
      'Missing required fields: name, email, phone, amount',
      null,
      400
    );
  }

  try {
    // Get email API URL from environment variable
    const emailApiUrl = env.APP_URL;
    
    // Generate email templates
    const userHtml = generateUserConfirmationHtml({
      name,
      email,
      phone,
      amount,
      orderId,
      campaign: campaign || 'direct',
      emailApiUrl
    });

    const adminHtml = generateAdminNotificationHtml({
      name,
      email,
      phone,
      amount,
      orderId,
      campaign: campaign || 'direct'
    });

    const userSubject = getUserConfirmationSubject(name);
    const adminSubject = getAdminNotificationSubject(name, amount);

    // Generate PDF receipt
    const pdfBytes = await generateReceiptPDF({
      name,
      email,
      phone,
      amount,
      orderId,
      campaign: campaign || 'direct'
    });
    
    // Convert PDF to base64 for attachment
    const pdfBase64 = btoa(String.fromCharCode(...new Uint8Array(pdfBytes)));
    const pdfFilename = `SkillPassport_Receipt_${orderId}.pdf`;

    // Send both emails in parallel
    await Promise.all([
      // User confirmation email with PDF attachment
      sendEmailWithAttachment(env, {
        to: email,
        subject: userSubject,
        html: userHtml,
        text: `Thank you for registering! Your order ID is ${orderId}. Amount paid: ₹${amount}`,
        from: DEFAULT_FROM_EMAIL,
        fromName: DEFAULT_FROM_NAME,
        attachments: [{
          filename: pdfFilename,
          content: pdfBase64,
          encoding: 'base64',
          contentType: 'application/pdf'
        }]
      }),
      // Admin notification email
      sendEmail(env, {
        to: 'naveen@rareminds.in',
        subject: adminSubject,
        html: adminHtml,
        from: DEFAULT_FROM_EMAIL,
        fromName: DEFAULT_FROM_NAME,
      })
    ]);

    return successResponse('Confirmation emails sent successfully', {
      userEmail: email,
      adminEmail: 'naveen@rareminds.in'
    });

  } catch (error) {
    console.error('Error sending event confirmation emails:', error);
    return errorResponse('Failed to send confirmation emails', error.message);
  }
}

/**
 * Handle OTP verification email
 * POST /event-otp
 */
export async function handleEventOTP(body, env) {
  const { email, otp, name } = body;

  // Validate required fields
  if (!email || !otp) {
    return errorResponse(
      'Missing required fields: email, otp',
      null,
      400
    );
  }

  try {
    const html = generateOTPEmailHtml({ otp, name });
    const subject = getOTPSubject(otp);

    await sendEmail(env, {
      to: email,
      subject,
      html,
      from: DEFAULT_FROM_EMAIL,
      fromName: DEFAULT_FROM_NAME,
    });

    return successResponse('OTP email sent successfully', {
      email: email
    });

  } catch (error) {
    console.error('Error sending OTP email:', error);
    return errorResponse('Failed to send OTP email', error.message);
  }
}


/**
 * Generate PDF receipt for email attachment
 * Simplified version of the full PDF receipt
 */
async function generateReceiptPDF(data) {
  const { name, email, phone, amount, orderId, campaign } = data;
  
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]); // A4
  const { width, height } = page.getSize();

  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const regular = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const blue = rgb(0.118, 0.251, 0.686);
  const white = rgb(1, 1, 1);
  const dark = rgb(0.133, 0.149, 0.169);
  const gray = rgb(0.420, 0.447, 0.502);

  let y = height - 60;

  // Header
  page.drawRectangle({
    x: 0, y: height - 90,
    width, height: 90,
    color: blue,
  });

  page.drawText('SKILL PASSPORT', {
    x: (width - bold.widthOfTextAtSize('SKILL PASSPORT', 28)) / 2,
    y: height - 42,
    size: 28,
    font: bold,
    color: white,
  });

  page.drawText('REGISTRATION RECEIPT', {
    x: (width - regular.widthOfTextAtSize('REGISTRATION RECEIPT', 13)) / 2,
    y: height - 68,
    size: 13,
    font: regular,
    color: rgb(0.749, 0.859, 0.976),
  });

  y = height - 130;

  // Receipt details
  page.drawText(`Receipt No: ${orderId}`, {
    x: 50, y, size: 10, font: regular, color: gray,
  });

  const dateStr = new Date().toLocaleDateString('en-IN', {
    day: '2-digit', month: 'long', year: 'numeric',
  });
  page.drawText(`Date: ${dateStr}`, {
    x: width - 200, y, size: 10, font: regular, color: gray,
  });

  y -= 40;

  // Registration details
  page.drawText('REGISTRATION DETAILS', {
    x: 50, y, size: 12, font: bold, color: blue,
  });
  y -= 30;

  page.drawText('Name', { x: 50, y, size: 11, font: regular, color: gray });
  page.drawText(name, { x: 160, y, size: 11, font: bold, color: dark });
  y -= 24;

  page.drawText('Email', { x: 50, y, size: 11, font: regular, color: gray });
  page.drawText(email, { x: 160, y, size: 11, font: regular, color: dark });
  y -= 24;

  page.drawText('Phone', { x: 50, y, size: 11, font: regular, color: gray });
  page.drawText(phone, { x: 160, y, size: 11, font: regular, color: dark });
  y -= 40;

  // Payment summary
  page.drawText('PAYMENT SUMMARY', {
    x: 50, y, size: 12, font: bold, color: blue,
  });
  y -= 30;

  page.drawText('Amount Paid', { x: 50, y, size: 11, font: regular, color: gray });
  page.drawText(`Rs. ${amount.toLocaleString('en-IN')}`, {
    x: 160, y: y - 2, size: 20, font: bold, color: blue,
  });
  y -= 40;

  page.drawText('Payment Status', { x: 50, y, size: 11, font: regular, color: gray });
  page.drawText('COMPLETED', { x: 160, y, size: 11, font: bold, color: rgb(0.133, 0.545, 0.133) });
  y -= 24;

  page.drawText('Payment Method', { x: 50, y, size: 11, font: regular, color: gray });
  page.drawText('Razorpay (Online)', { x: 160, y, size: 11, font: regular, color: dark });

  // Footer
  y = 80;
  const footerText = 'This is a computer-generated receipt and does not require a signature.';
  page.drawText(footerText, {
    x: (width - regular.widthOfTextAtSize(footerText, 8)) / 2,
    y, size: 8, font: regular, color: gray,
  });

  return await pdfDoc.save();
}

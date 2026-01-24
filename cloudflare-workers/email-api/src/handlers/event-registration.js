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
import { generateRegistrationReceiptPDF, getReceiptFilename } from '../services/pdf-generator.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { DEFAULT_FROM_EMAIL, DEFAULT_FROM_NAME } from '../config/constants.js';

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
    // Generate email templates
    const userHtml = generateUserConfirmationHtml({
      name,
      email,
      phone,
      amount,
      orderId,
      campaign: campaign || 'direct'
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

    // PDF generation temporarily disabled - will be implemented with proper MIME support
    // const pdfBase64 = generateRegistrationReceiptPDF({...});
    // const pdfFilename = getReceiptFilename(orderId);

    // Send both emails in parallel
    await Promise.all([
      // User confirmation email (without attachment for now)
      sendEmailWithAttachment(env, {
        to: email,
        subject: userSubject,
        html: userHtml,
        text: `Thank you for registering! Your order ID is ${orderId}. Amount paid: ₹${amount}`,
        from: DEFAULT_FROM_EMAIL,
        fromName: DEFAULT_FROM_NAME,
        // attachments: [] // Disabled for now
      }),
      // Admin notification email (no attachment needed)
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

/**
 * Password reset email handler
 * POST /password-reset
 */

import { sendEmail } from '../services/mailer.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { generatePasswordResetTemplate } from '../templates/password-reset.js';

export async function handlePasswordResetEmail(body, env) {
  const { to, token, expiryMinutes = 30 } = body;

  // Validate required fields
  if (!to || !token) {
    return errorResponse(
      'Missing required fields: to, token',
      null,
      400
    );
  }

  // Validate token format (should be 32 character hex string)
  if (!/^[a-f0-9]{32}$/.test(token)) {
    return errorResponse(
      'Invalid token format. Must be 32 character hex string.',
      null,
      400
    );
  }

  try {
    const html = generatePasswordResetTemplate(token, expiryMinutes);
    
    const result = await sendEmail(env, {
      to,
      subject: '🔐 Reset Your Password - Skill Passport',
      html,
      text: `
SKILL PASSPORT - PASSWORD RESET

Hello!

We received a request to reset your password for your Skill Passport account.

RESET LINK: http://localhost:3000/password-reset?token=${token}

⏰ IMPORTANT: This link expires in ${expiryMinutes} minutes.

HOW TO RESET YOUR PASSWORD:
1. Click the link above or copy it to your browser
2. You'll be taken to a secure password reset page
3. Enter your new password
4. Confirm and save your changes

🛡️ SECURITY NOTICE: If you didn't request this password reset, please ignore this email. Your account remains secure.

Need help? Contact our support team.

Best regards,
The Skill Passport Team

© ${new Date().getFullYear()} Skill Passport by RareMinds
This is an automated security email. Please do not reply.
      `,
      from: env.FROM_EMAIL || 'noreply@rareminds.in',
      fromName: env.FROM_NAME || 'Skill Passport Security',
    });

    return successResponse('Password reset email sent successfully', {
      ...result,
      maskedEmail: to.replace(/(.{2})(.*)(@.*)/, '$1***$3'), // Mask email for security
      expiryMinutes
    });
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return errorResponse('Failed to send password reset email', error.message);
  }
}
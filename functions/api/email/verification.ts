/**
 * Email Verification Template API
 * POST /api/email/verification
 * 
 * Called by SSO Worker to send beautiful email verification emails
 */

import type { Env } from '../../../src/functions-lib/types';
import { jsonResponse } from '../../../src/functions-lib';
import { sendEmail, isEmailConfigured } from '../../lib/email-service';
import { apiLogger } from '../../lib/logger';

interface VerificationEmailRequest {
  to: string;
  verifyUrl: string;
  templateOnly?: boolean;  // If true, return template data instead of sending email
}

export async function onRequestPost(context: { request: Request; env: Env }): Promise<Response> {
  const { request, env } = context;

  try {
    // Check if email service is configured
    if (!isEmailConfigured(env)) {
      apiLogger.error('Email service not configured');
      return jsonResponse({
        success: false,
        error: 'Email service not configured'
      }, 500);
    }

    // Parse request body
    let body: VerificationEmailRequest;
    try {
      body = await request.json() as VerificationEmailRequest;
    } catch (error) {
      apiLogger.error('Invalid JSON in verification email request', error as Error);
      return jsonResponse({ 
        success: false, 
        error: 'Invalid JSON payload' 
      }, 400);
    }

    // Validate required fields
    if (!body.to) {
      return jsonResponse({
        success: false,
        error: 'to email address is required'
      }, 400);
    }

    if (!body.verifyUrl) {
      return jsonResponse({
        success: false,
        error: 'verifyUrl is required'
      }, 400);
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.to)) {
      return jsonResponse({
        success: false,
        error: 'Invalid email format'
      }, 400);
    }

    apiLogger.info('Processing email verification request', {
      to: body.to,
      verifyUrl: body.verifyUrl.substring(0, 50) + '...' // Log partial URL for debugging
    });

    // Generate beautiful HTML email
    const html = generateVerificationEmailHtml({ verifyUrl: body.verifyUrl });
    
    // Generate plain text version
    const text = `Verify your email address - SkillPassport

Hello,

Thank you for signing up for SkillPassport! To complete your registration, please verify your email address.

Click the link below to verify your email:
${body.verifyUrl}

This link will expire in 24 hours for security reasons.

If you didn't create an account with SkillPassport, you can safely ignore this email.

Best regards,
The SkillPassport Team

© ${new Date().getFullYear()} SkillPassport by RareMinds. All rights reserved.`;

    const subject = 'Verify your email address - SkillPassport';

    // If templateOnly mode, return template data without sending
    if (body.templateOnly) {
      return jsonResponse({
        success: true,
        html,
        text,
        subject,
      });
    }

    // Send email via email-worker
    const result = await sendEmail(env, {
      to: body.to,
      subject,
      html,
      text,
      from: 'noreply@rareminds.in',
      fromName: 'SkillPassport'
    });

    if (result.success) {
      apiLogger.info('Email verification sent successfully', {
        to: body.to,
        messageId: result.messageId
      });

      return jsonResponse({
        success: true,
        message: 'Email verification sent successfully',
        messageId: result.messageId
      });
    } else {
      apiLogger.error('Failed to send email verification', new Error(result.error));
      
      return jsonResponse({
        success: false,
        error: result.error || 'Failed to send email'
      }, 500);
    }

  } catch (error) {
    apiLogger.error('Error processing email verification request', error as Error);
    
    return jsonResponse({
      success: false,
      error: 'Internal server error'
    }, 500);
  }
}

// Generate verification email HTML template
function generateVerificationEmailHtml(data: { verifyUrl: string }): string {
  const { verifyUrl } = data;
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify your email address</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: #ffffff;
    }
    .email-wrapper {
      padding: 40px 20px;
      max-width: 600px;
      margin: 0 auto;
    }
    .pre-header {
      font-size: 14px;
      color: #4b5563;
      margin-bottom: 8px;
    }
    .header-banner {
      background-color: #3b82f6;
      height: 240px;
      position: relative;
      border-radius: 0;
      margin-bottom: 40px;
      text-align: center;
    }
    /* Centering with table for email client compatibility */
    .header-table {
      width: 100%;
      height: 100%;
      border-collapse: collapse;
    }
    .header-icon {
      width: 80px;
      height: 80px;
      background-color: rgba(255, 255, 255, 0.2);
      border-radius: 50%;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin-top: 80px;
    }
    .content {
      text-align: center;
      padding: 0 20px;
    }
    .title {
      font-size: 20px;
      font-weight: 500;
      color: #374151;
      margin: 0 0 16px 0;
    }
    .title-brand {
      color: #2563eb;
      font-weight: 700;
    }
    .description {
      font-size: 16px;
      color: #6b7280;
      margin: 0 auto 32px auto;
      line-height: 1.6;
      max-width: 500px;
    }
    .verify-button {
      display: inline-block;
      padding: 16px 48px;
      background-color: #3b82f6;
      color: #ffffff !important;
      text-decoration: none;
      border-radius: 30px;
      font-size: 16px;
      font-weight: 600;
      margin: 0 0 40px 0;
      letter-spacing: 0.5px;
    }
    .verify-button:hover {
      background-color: #2563eb;
    }
    .footer {
      background-color: #f9fafb;
      padding: 40px 30px;
      text-align: center;
    }
    .footer-text {
      font-size: 14px;
      color: #9ca3af;
      margin: 0 0 24px 0;
      line-height: 1.6;
    }
    .copyright {
      font-size: 13px;
      color: #9ca3af;
      margin: 0;
    }
    .copyright a {
      color: #3b82f6;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="pre-header">Verify your email address</div>
    
    <!-- Header -->
    <div class="header-banner">
      <table class="header-table">
        <tr>
          <td align="center" valign="middle">
            <div class="header-icon">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 4V9C4 10.1046 4.89543 11 6 11H8M4 4L8 8M4 4H9C10.1046 4 11 4.89543 11 6V8" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M20 4V9C20 10.1046 19.1046 11 18 11H16M20 4L16 8M20 4H15C13.8954 4 13 4.89543 13 6V8" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M4 20V15C4 13.8954 4.89543 13 6 13H8M4 20L8 16M4 20H9C10.1046 20 11 19.1046 11 18V16" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M20 20V15C20 13.8954 19.1046 13 18 13H16M20 20L16 16M20 20H15C13.8954 20 13 19.1046 13 18V16" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <circle cx="12" cy="12" r="3" stroke="white" stroke-width="2"/>
              </svg>
            </div>
          </td>
        </tr>
      </table>
    </div>
    
    <!-- Content -->
    <div class="content">
      <h2 class="title">Welcome to <span class="title-brand">SkillPassport</span></h2>
      <p class="description">
        Please click the button below to confirm your email address and activate your account.
      </p>
      
      <a href="${verifyUrl}" class="verify-button">
        CONFIRM EMAIL
      </a>
    </div>
    
    <!-- Footer -->
    <div class="footer">
      <p class="footer-text">
        This verification link expires in 24 hours.<br>
        If you didn't create an account with SkillPassport, please ignore this email.
      </p>
      
      <p class="copyright">
        © ${new Date().getFullYear()} <a href="https://skillpassport.rareminds.in">skillpassport.rareminds.in</a>
      </p>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Email utilities for User API
 * Uses email-api Cloudflare Worker for sending emails
 */

import type { PagesEnv } from '../../../../src/functions-lib/types';

const EMAIL_API_URL = 'https://email-api.dark-mode-d021.workers.dev';
const FROM_EMAIL = 'noreply@rareminds.in';
const FROM_NAME = 'SkillPassport';

/**
 * Send email via email-api Cloudflare Worker
 */
async function sendEmailViaWorker(
  env: PagesEnv,
  to: string,
  subject: string,
  html: string,
  text?: string
): Promise<boolean> {
  try {
    const response = await fetch(EMAIL_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to,
        subject,
        html,
        text: text || '',
        from: FROM_EMAIL,
        fromName: FROM_NAME,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Email API error:', error);
      return false;
    }

    const result = await response.json();
    console.log('Email sent successfully:', result);
    return true;
  } catch (error) {
    console.error('Failed to send email:', error);
    return false;
  }
}

/**
 * Send welcome email to new user
 */
export async function sendWelcomeEmail(
  env: PagesEnv,
  email: string,
  name: string,
  password: string,
  role: string,
  additionalInfo?: string
): Promise<void> {
  const subject = 'Welcome to SkillPassport!';
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #4F46E5; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9fafb; }
        .credentials { background: white; padding: 15px; border-left: 4px solid #4F46E5; margin: 20px 0; }
        .button { display: inline-block; padding: 12px 24px; background: #4F46E5; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to SkillPassport!</h1>
        </div>
        <div class="content">
          <p>Hello ${name},</p>
          <p>Your account has been created successfully. Here are your login credentials:</p>
          
          <div class="credentials">
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Temporary Password:</strong> ${password}</p>
            <p><strong>Role:</strong> ${role}</p>
            ${additionalInfo ? `<p>${additionalInfo}</p>` : ''}
          </div>
          
          <p>Please change your password after your first login for security.</p>
          
          <a href="https://skillpassport.rareminds.in/login" class="button">Login Now</a>
          
          <p>If you have any questions, please don't hesitate to contact our support team.</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} SkillPassport. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `Welcome to SkillPassport!\n\nHello ${name},\n\nYour account has been created successfully.\n\nEmail: ${email}\nTemporary Password: ${password}\nRole: ${role}\n\nPlease change your password after your first login.\n\nLogin at: https://skillpassport.rareminds.in/login`;

  await sendEmailViaWorker(env, email, subject, html, text);
}

/**
 * Send password reset email with OTP
 */
export async function sendPasswordResetEmail(
  env: PagesEnv,
  email: string,
  otp: string
): Promise<boolean> {
  const subject = 'Password Reset - SkillPassport';
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #4F46E5; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9fafb; }
        .otp-box { background: white; padding: 20px; text-align: center; border: 2px dashed #4F46E5; margin: 20px 0; }
        .otp-code { font-size: 32px; font-weight: bold; color: #4F46E5; letter-spacing: 8px; }
        .warning { background: #FEF3C7; padding: 15px; border-left: 4px solid #F59E0B; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Password Reset Request</h1>
        </div>
        <div class="content">
          <p>Hello,</p>
          <p>We received a request to reset your password. Use the OTP code below to complete the process:</p>
          
          <div class="otp-box">
            <p style="margin: 0; color: #666;">Your OTP Code</p>
            <div class="otp-code">${otp}</div>
            <p style="margin: 10px 0 0 0; color: #666; font-size: 14px;">Valid for 10 minutes</p>
          </div>
          
          <div class="warning">
            <p style="margin: 0;"><strong>⚠️ Security Notice:</strong></p>
            <p style="margin: 5px 0 0 0;">If you didn't request this password reset, please ignore this email. Your password will remain unchanged.</p>
          </div>
          
          <p>For security reasons, this OTP will expire in 10 minutes.</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} SkillPassport. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `Password Reset - SkillPassport\n\nWe received a request to reset your password.\n\nYour OTP Code: ${otp}\n\nThis code is valid for 10 minutes.\n\nIf you didn't request this, please ignore this email.`;

  return await sendEmailViaWorker(env, email, subject, html, text);
}

/**
 * Send interview reminder email
 */
export async function sendInterviewReminderEmail(
  env: PagesEnv,
  recipientEmail: string,
  recipientName: string,
  interviewDetails: Record<string, any>
): Promise<{ success: boolean; error?: string; emailId?: string }> {
  const subject = 'Interview Reminder - SkillPassport';
  
  const { date, time, location, interviewer, position, company } = interviewDetails;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #4F46E5; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9fafb; }
        .details { background: white; padding: 20px; border-left: 4px solid #4F46E5; margin: 20px 0; }
        .detail-row { margin: 10px 0; }
        .detail-label { font-weight: bold; color: #666; }
        .button { display: inline-block; padding: 12px 24px; background: #4F46E5; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📅 Interview Reminder</h1>
        </div>
        <div class="content">
          <p>Hello ${recipientName},</p>
          <p>This is a reminder about your upcoming interview:</p>
          
          <div class="details">
            ${position ? `<div class="detail-row"><span class="detail-label">Position:</span> ${position}</div>` : ''}
            ${company ? `<div class="detail-row"><span class="detail-label">Company:</span> ${company}</div>` : ''}
            ${date ? `<div class="detail-row"><span class="detail-label">Date:</span> ${date}</div>` : ''}
            ${time ? `<div class="detail-row"><span class="detail-label">Time:</span> ${time}</div>` : ''}
            ${location ? `<div class="detail-row"><span class="detail-label">Location:</span> ${location}</div>` : ''}
            ${interviewer ? `<div class="detail-row"><span class="detail-label">Interviewer:</span> ${interviewer}</div>` : ''}
          </div>
          
          <p><strong>Tips for your interview:</strong></p>
          <ul>
            <li>Join 5-10 minutes early</li>
            <li>Test your internet connection and audio/video</li>
            <li>Have your resume and relevant documents ready</li>
            <li>Prepare questions to ask the interviewer</li>
          </ul>
          
          <p>Good luck with your interview!</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} SkillPassport. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `Interview Reminder - SkillPassport\n\nHello ${recipientName},\n\nThis is a reminder about your upcoming interview:\n\n${position ? `Position: ${position}\n` : ''}${company ? `Company: ${company}\n` : ''}${date ? `Date: ${date}\n` : ''}${time ? `Time: ${time}\n` : ''}${location ? `Location: ${location}\n` : ''}${interviewer ? `Interviewer: ${interviewer}\n` : ''}\n\nGood luck!`;

  const success = await sendEmailViaWorker(env, recipientEmail, subject, html, text);
  
  return {
    success,
    emailId: success ? `email-${Date.now()}` : undefined,
    error: success ? undefined : 'Failed to send email',
  };
}

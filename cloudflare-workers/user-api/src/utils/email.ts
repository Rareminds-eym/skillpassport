/**
 * Email utilities using Resend API
 */

import { Env } from '../types';
import { roleDisplayNames } from '../constants';

const LOGIN_URL = 'https://skillpassport.rareminds.in/login';

/**
 * Send welcome email to new user
 */
export async function sendWelcomeEmail(
  env: Env,
  email: string,
  name: string,
  password: string,
  role: string,
  additionalInfo?: string
): Promise<boolean> {
  if (!env.RESEND_API_KEY) {
    console.log('RESEND_API_KEY not configured, skipping email');
    return false;
  }

  const roleDisplay = roleDisplayNames[role] || role;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Skill Passport <dev@rareminds.in>',
        to: [email],
        subject: `Welcome to Skill Passport - Your ${roleDisplay} Account is Ready!`,
        html: generateWelcomeEmailHtml(name, email, password, roleDisplay, additionalInfo),
      }),
    });

    return response.ok;
  } catch (error) {
    console.error('Failed to send welcome email:', error);
    return false;
  }
}

/**
 * Send password reset OTP email
 */
export async function sendPasswordResetEmail(
  env: Env,
  email: string,
  otp: string
): Promise<boolean> {
  if (!env.RESEND_API_KEY) {
    console.log('RESEND_API_KEY not configured, skipping email');
    return false;
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Skill Passport <noreply@rareminds.in>',
        to: [email],
        subject: 'Your Password Reset Code',
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Password Reset Request</h2>
            <p>Your verification code is:</p>
            <h1 style="color: #2563eb; letter-spacing: 5px;">${otp}</h1>
            <p>This code will expire in 10 minutes.</p>
          </div>
        `,
      }),
    });

    return response.ok;
  } catch (error) {
    console.error('Failed to send password reset email:', error);
    return false;
  }
}

/**
 * Send interview reminder email
 */
export async function sendInterviewReminderEmail(
  env: Env,
  recipientEmail: string,
  recipientName: string,
  interviewDetails: {
    date?: string;
    time?: string;
    duration?: number;
    meetingLink?: string;
    meetingType?: string;
    jobTitle?: string;
    interviewer?: string;
  }
): Promise<{ success: boolean; emailId?: string; error?: string }> {
  if (!env.RESEND_API_KEY) {
    return { success: false, error: 'Email service not configured' };
  }

  const { date, time, duration, meetingLink, meetingType, jobTitle, interviewer } = interviewDetails;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const htmlContent = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Interview Reminder</title></head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
    <h1 style="margin: 0;">🎯 Interview Reminder</h1>
  </div>
  <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
    <p>Dear ${recipientName},</p>
    <p>This is a friendly reminder about your upcoming interview!</p>
    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
      <h3 style="margin-top: 0; color: #667eea;">📅 Interview Details</h3>
      ${jobTitle ? `<p><strong>Position:</strong> ${jobTitle}</p>` : ''}
      ${date ? `<p><strong>Date:</strong> ${formatDate(date)}</p>` : ''}
      ${time ? `<p><strong>Time:</strong> ${time}</p>` : ''}
      ${duration ? `<p><strong>Duration:</strong> ${duration} minutes</p>` : ''}
      ${interviewer ? `<p><strong>Interviewer:</strong> ${interviewer}</p>` : ''}
      ${meetingType ? `<p><strong>Format:</strong> ${meetingType} Meeting</p>` : ''}
    </div>
    ${meetingLink ? `<div style="text-align: center;"><a href="${meetingLink}" style="background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">🔗 Join Meeting</a></div>` : ''}
    <p>Best regards,<br><strong>RareMinds Recruitment Team</strong></p>
  </div>
</body>
</html>`;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'RareMinds <noreply@rareminds.in>',
        to: [recipientEmail],
        subject: `Interview Reminder - ${jobTitle || 'Position'} Interview`,
        html: htmlContent,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      return { success: false, error: `Failed to send email: ${errorData}` };
    }

    const emailResult = (await response.json()) as { id?: string };
    return { success: true, emailId: emailResult.id };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Generate welcome email HTML template
 */
function generateWelcomeEmailHtml(
  name: string,
  email: string,
  password: string,
  roleDisplay: string,
  additionalInfo?: string
): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Welcome to Skill Passport</title></head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', sans-serif; background-color: #f4f7fa;">
  <table style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table style="width: 600px; max-width: 100%; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <tr>
            <td style="padding: 40px; text-align: center; background: linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%); border-radius: 12px 12px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px;">🎉 Welcome to Skill Passport!</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <p style="color: #374151; font-size: 16px;">Hi <strong>${name}</strong>,</p>
              <p style="color: #374151; font-size: 16px;">Your <strong>${roleDisplay}</strong> account has been created successfully!</p>
              <div style="background-color: #F3F4F6; border-radius: 8px; padding: 24px; margin: 24px 0;">
                <h3 style="margin: 0 0 16px; color: #1F2937;">Your Login Credentials</h3>
                <p style="margin: 8px 0;"><strong>Email:</strong> ${email}</p>
                <p style="margin: 8px 0;"><strong>Password:</strong> <code style="background: #E5E7EB; padding: 4px 8px; border-radius: 4px;">${password}</code></p>
                <p style="margin: 8px 0;"><strong>Role:</strong> ${roleDisplay}</p>
                ${additionalInfo ? `<p style="margin: 8px 0;">${additionalInfo}</p>` : ''}
              </div>
              <div style="background-color: #FEF3C7; border-left: 4px solid #F59E0B; padding: 16px; margin: 24px 0;">
                <p style="margin: 0; color: #92400E;">⚠️ Please change your password after your first login for security.</p>
              </div>
              <div style="text-align: center; margin: 32px 0;">
                <a href="${LOGIN_URL}" style="display: inline-block; background: linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 600;">Login to Your Account →</a>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding: 24px 40px; background-color: #F9FAFB; border-radius: 0 0 12px 12px; text-align: center;">
              <p style="margin: 0; color: #9CA3AF; font-size: 12px;">© ${new Date().getFullYear()} Skill Passport by Rareminds</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

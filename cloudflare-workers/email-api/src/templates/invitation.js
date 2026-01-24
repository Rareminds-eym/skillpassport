/**
 * Organization invitation email template
 */

import { APP_URL } from '../config/constants.js';

export function generateInvitationEmailHtml(data) {
  const { organizationName, memberType, invitationToken, expiresAt, customMessage } = data;
  
  const invitationLink = `${APP_URL}/accept-invitation?token=${invitationToken}`;
  const memberTypeDisplay = memberType === 'educator' ? 'Educator' : 'Student';
  const expiresDate = new Date(expiresAt).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Organization Invitation</title></head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', sans-serif; background-color: #f4f7fa;">
  <table style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table style="width: 600px; max-width: 100%; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <tr>
            <td style="padding: 40px; text-align: center; background: linear-gradient(135deg, #6366F1 0%, #4F46E5 100%); border-radius: 12px 12px 0 0;">
              <div style="width: 60px; height: 60px; background: white; border-radius: 50%; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 32px;">✉️</span>
              </div>
              <h1 style="margin: 0; color: #ffffff; font-size: 28px;">You're Invited!</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <p style="color: #374151; font-size: 16px; margin-bottom: 24px;">Hello,</p>
              <p style="color: #374151; font-size: 16px; margin-bottom: 24px;">
                You have been invited to join <strong>${organizationName}</strong> as a <strong>${memberTypeDisplay}</strong> on Skill Passport.
              </p>
              
              ${customMessage ? `
              <div style="background-color: #F3F4F6; border-radius: 8px; padding: 20px; margin: 24px 0; border-left: 4px solid #6366F1;">
                <p style="margin: 0; color: #4B5563; font-style: italic;">"${customMessage}"</p>
              </div>
              ` : ''}
              
              <div style="background-color: #EFF6FF; border-radius: 8px; padding: 24px; margin: 24px 0;">
                <h3 style="margin: 0 0 16px; color: #1F2937; font-size: 18px;">📋 Invitation Details</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #6B7280;">Organization</td>
                    <td style="padding: 8px 0; color: #1F2937; font-weight: 600; text-align: right;">${organizationName}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6B7280;">Role</td>
                    <td style="padding: 8px 0; color: #6366F1; font-weight: 600; text-align: right;">${memberTypeDisplay}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6B7280;">Expires</td>
                    <td style="padding: 8px 0; color: #1F2937; text-align: right;">${expiresDate}</td>
                  </tr>
                </table>
              </div>
              
              <div style="text-align: center; margin: 32px 0;">
                <a href="${invitationLink}" style="display: inline-block; background: linear-gradient(135deg, #6366F1 0%, #4F46E5 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 600;">Accept Invitation →</a>
              </div>
              
              <div style="background-color: #FEF3C7; border-left: 4px solid #F59E0B; padding: 16px; margin: 24px 0;">
                <p style="margin: 0; color: #92400E; font-size: 14px;">⏰ This invitation will expire on ${expiresDate}. Please accept it before then.</p>
              </div>
              
              <p style="color: #6B7280; font-size: 14px; margin-top: 24px;">
                If you didn't expect this invitation, you can safely ignore this email.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 24px 40px; background-color: #F9FAFB; border-radius: 0 0 12px 12px; text-align: center;">
              <p style="margin: 0; color: #9CA3AF; font-size: 12px;">© ${new Date().getFullYear()} Skill Passport by Rareminds. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function getInvitationSubject(organizationName) {
  return `You're invited to join ${organizationName} on Skill Passport`;
}

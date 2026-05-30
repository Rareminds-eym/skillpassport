/**
 * Email Templates for Recruitment Invitations
 * HTML email templates for member invitations
 */

import type { InvitationEmailData } from '../model/types';

/**
 * Generate invitation email HTML
 */
export const generateInvitationEmail = (data: InvitationEmailData): string => {
  const {
    recipientName,
    organizationName,
    inviterName,
    role,
    invitationUrl,
    expiresAt,
  } = data;

  const roleLabel = role === 'admin' ? 'Administrator' : 'Recruiter';
  const expiryDate = new Date(expiresAt).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Join ${organizationName} - Recruitment Team</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">
                You're Invited!
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #333333;">
                ${recipientName ? `Hi ${recipientName},` : 'Hello,'}
              </p>
              
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #333333;">
                <strong>${inviterName}</strong> has invited you to join <strong>${organizationName}</strong>'s recruitment team as a <strong>${roleLabel}</strong>.
              </p>

              <!-- Getting Started Info Box -->
              <div style="margin: 0 0 30px; padding: 20px; background-color: #e3f2fd; border-left: 4px solid #2196f3; border-radius: 4px;">
                <p style="margin: 0 0 8px; font-size: 15px; font-weight: 600; color: #1565c0;">
                  Getting Started:
                </p>
                <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #0d47a1;">
                  <strong>No account?</strong> You'll create one in just 2 minutes.<br/>
                  <strong>Already have an account?</strong> Just login to accept.
                </p>
              </div>

              <p style="margin: 0 0 30px; font-size: 16px; line-height: 1.6; color: #333333;">
                As a ${roleLabel}, you'll be able to:
              </p>

              <ul style="margin: 0 0 30px; padding-left: 20px; font-size: 15px; line-height: 1.8; color: #555555;">
                ${role === 'admin' ? `
                  <li>Manage team members and roles</li>
                  <li>Post and manage job openings</li>
                  <li>View and manage all candidates</li>
                  <li>Access organization-wide analytics</li>
                  <li>Configure organization settings</li>
                ` : `
                  <li>Post and manage job openings</li>
                  <li>View and manage candidates</li>
                  <li>Collaborate with your team</li>
                  <li>Access recruitment analytics</li>
                `}
              </ul>

              <!-- CTA Button -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="${invitationUrl}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);">
                      Accept Invitation
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 30px 0 0; font-size: 14px; line-height: 1.6; color: #666666; text-align: center;">
                Or copy and paste this link into your browser:
              </p>
              <p style="margin: 10px 0 0; font-size: 13px; line-height: 1.6; color: #999999; text-align: center; word-break: break-all;">
                ${invitationUrl}
              </p>

              <!-- Expiry Notice -->
              <div style="margin: 30px 0 0; padding: 16px; background-color: #fff3cd; border-left: 4px solid: #ffc107; border-radius: 4px;">
                <p style="margin: 0; font-size: 14px; color: #856404;">
                  ⏰ This invitation expires on <strong>${expiryDate}</strong>
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #f8f9fa; border-radius: 0 0 8px 8px; text-align: center;">
              <p style="margin: 0 0 10px; font-size: 13px; color: #666666;">
                If you didn't expect this invitation, you can safely ignore this email.
              </p>
              <p style="margin: 0; font-size: 12px; color: #999999;">
                © ${new Date().getFullYear()} ${organizationName}. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
};

/**
 * Generate plain text version of invitation email
 */
export const generateInvitationEmailText = (data: InvitationEmailData): string => {
  const {
    recipientName,
    organizationName,
    inviterName,
    role,
    invitationUrl,
    expiresAt,
  } = data;

  const roleLabel = role === 'admin' ? 'Administrator' : 'Recruiter';
  const expiryDate = new Date(expiresAt).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return `
You're Invited to Join ${organizationName}!

${recipientName ? `Hi ${recipientName},` : 'Hello,'}

${inviterName} has invited you to join ${organizationName}'s recruitment team as a ${roleLabel}.

As a ${roleLabel}, you'll be able to:
${role === 'admin' ? `
- Manage team members and roles
- Post and manage job openings
- View and manage all candidates
- Access organization-wide analytics
- Configure organization settings
` : `
- Post and manage job openings
- View and manage candidates
- Collaborate with your team
- Access recruitment analytics
`}

Accept your invitation by clicking this link:
${invitationUrl}

This invitation expires on ${expiryDate}

If you didn't expect this invitation, you can safely ignore this email.

© ${new Date().getFullYear()} ${organizationName}. All rights reserved.
  `.trim();
};

/**
 * Recruitment Email Service
 * Email templates and sending for recruitment features
 */

import { sendEmail } from './email-service';

/**
 * Send invitation email to new member
 */
export async function sendInvitationEmail(
    env: Record<string, string>,
    data: {
        recipientEmail: string;
        recipientName?: string;
        organizationName: string;
        inviterName: string;
        inviterEmail: string;
        role: 'company_admin' | 'recruiter' | 'viewer';
        invitationUrl: string;
        expiresAt: string;
    }
): Promise<void> {
    const roleDisplayNames = {
        company_admin: 'Company Admin',
        recruiter: 'Recruiter',
        viewer: 'Viewer',
    };

    const roleDescriptions = {
        company_admin:
            'As a Company Admin, you will have full access to manage team members, job postings, candidates, and analytics.',
        recruiter:
            'As a Recruiter, you will be able to create and manage job postings, view and manage candidates, and access analytics.',
        viewer:
            'As a Viewer, you will be able to view candidates and analytics, but cannot make changes.',
    };

    const subject = `You've been invited to join ${data.organizationName} on SkillPassport`;

    const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invitation to ${data.organizationName}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 28px;">You're Invited!</h1>
  </div>
  
  <div style="background: #ffffff; padding: 40px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
    <p style="font-size: 16px; margin-bottom: 20px;">
      Hi${data.recipientName ? ` ${data.recipientName}` : ''},
    </p>
    
    <p style="font-size: 16px; margin-bottom: 20px;">
      <strong>${data.inviterName}</strong> (${data.inviterEmail}) has invited you to join 
      <strong>${data.organizationName}</strong>'s recruitment team on SkillPassport.
    </p>
    
    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 30px 0;">
      <p style="margin: 0 0 10px 0; font-size: 14px; color: #666;">Your Role:</p>
      <p style="margin: 0 0 15px 0; font-size: 18px; font-weight: bold; color: #667eea;">
        ${roleDisplayNames[data.role]}
      </p>
      <p style="margin: 0; font-size: 14px; color: #666;">
        ${roleDescriptions[data.role]}
      </p>
    </div>
    
    <div style="text-align: center; margin: 40px 0;">
      <a href="${data.invitationUrl}" 
         style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
        Accept Invitation
      </a>
    </div>
    
    <p style="font-size: 14px; color: #666; margin-top: 30px;">
      This invitation will expire on <strong>${new Date(data.expiresAt).toLocaleDateString()}</strong>.
    </p>
    
    <p style="font-size: 14px; color: #666; margin-top: 20px;">
      If you didn't expect this invitation, you can safely ignore this email.
    </p>
    
    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
    
    <p style="font-size: 12px; color: #999; text-align: center;">
      This is an automated email from SkillPassport. Please do not reply to this email.
    </p>
  </div>
</body>
</html>
  `;

    const textBody = `
You've been invited to join ${data.organizationName} on SkillPassport

Hi${data.recipientName ? ` ${data.recipientName}` : ''},

${data.inviterName} (${data.inviterEmail}) has invited you to join ${data.organizationName}'s recruitment team on SkillPassport.

Your Role: ${roleDisplayNames[data.role]}
${roleDescriptions[data.role]}

Accept your invitation by clicking this link:
${data.invitationUrl}

This invitation will expire on ${new Date(data.expiresAt).toLocaleDateString()}.

If you didn't expect this invitation, you can safely ignore this email.

---
This is an automated email from SkillPassport. Please do not reply to this email.
  `;

    await sendEmail(env, {
        to: data.recipientEmail,
        subject,
        html: htmlBody,
        text: textBody,
    });
}

/**
 * Send role change notification email
 */
export async function sendRoleChangeEmail(
    env: Record<string, string>,
    data: {
        recipientEmail: string;
        recipientName?: string;
        organizationName: string;
        oldRole: string;
        newRole: 'company_admin' | 'recruiter' | 'viewer';
        changedBy: string;
    }
): Promise<void> {
    const roleDisplayNames = {
        company_admin: 'Company Admin',
        recruiter: 'Recruiter',
        viewer: 'Viewer',
    };

    const subject = `Your role has been updated in ${data.organizationName}`;

    const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Role Update</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #ffffff; padding: 40px; border: 1px solid #e0e0e0; border-radius: 10px;">
    <h2 style="color: #667eea; margin-top: 0;">Role Update</h2>
    
    <p style="font-size: 16px; margin-bottom: 20px;">
      Hi${data.recipientName ? ` ${data.recipientName}` : ''},
    </p>
    
    <p style="font-size: 16px; margin-bottom: 20px;">
      Your role in <strong>${data.organizationName}</strong> has been updated by ${data.changedBy}.
    </p>
    
    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 30px 0;">
      <p style="margin: 0 0 10px 0; font-size: 14px; color: #666;">Previous Role:</p>
      <p style="margin: 0 0 20px 0; font-size: 16px; text-decoration: line-through; color: #999;">
        ${data.oldRole}
      </p>
      <p style="margin: 0 0 10px 0; font-size: 14px; color: #666;">New Role:</p>
      <p style="margin: 0; font-size: 18px; font-weight: bold; color: #667eea;">
        ${roleDisplayNames[data.newRole]}
      </p>
    </div>
    
    <p style="font-size: 14px; color: #666; margin-top: 30px;">
      Your permissions and access have been updated accordingly. Log in to SkillPassport to see your new capabilities.
    </p>
    
    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
    
    <p style="font-size: 12px; color: #999; text-align: center;">
      This is an automated email from SkillPassport. Please do not reply to this email.
    </p>
  </div>
</body>
</html>
  `;

    const textBody = `
Your role has been updated in ${data.organizationName}

Hi${data.recipientName ? ` ${data.recipientName}` : ''},

Your role in ${data.organizationName} has been updated by ${data.changedBy}.

Previous Role: ${data.oldRole}
New Role: ${roleDisplayNames[data.newRole]}

Your permissions and access have been updated accordingly. Log in to SkillPassport to see your new capabilities.

---
This is an automated email from SkillPassport. Please do not reply to this email.
  `;

    await sendEmail(env, {
        to: data.recipientEmail,
        subject,
        html: htmlBody,
        text: textBody,
    });
}

/**
 * Send member deactivation notification email
 */
export async function sendDeactivationEmail(
    env: Record<string, string>,
    data: {
        recipientEmail: string;
        recipientName?: string;
        organizationName: string;
        deactivatedBy: string;
    }
): Promise<void> {
    const subject = `Your access to ${data.organizationName} has been deactivated`;

    const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Account Deactivated</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #ffffff; padding: 40px; border: 1px solid #e0e0e0; border-radius: 10px;">
    <h2 style="color: #dc3545; margin-top: 0;">Account Deactivated</h2>
    
    <p style="font-size: 16px; margin-bottom: 20px;">
      Hi${data.recipientName ? ` ${data.recipientName}` : ''},
    </p>
    
    <p style="font-size: 16px; margin-bottom: 20px;">
      Your access to <strong>${data.organizationName}</strong> on SkillPassport has been deactivated by ${data.deactivatedBy}.
    </p>
    
    <p style="font-size: 14px; color: #666; margin-top: 30px;">
      You will no longer be able to access ${data.organizationName}'s recruitment features. If you believe this is a mistake, please contact your organization administrator.
    </p>
    
    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
    
    <p style="font-size: 12px; color: #999; text-align: center;">
      This is an automated email from SkillPassport. Please do not reply to this email.
    </p>
  </div>
</body>
</html>
  `;

    const textBody = `
Your access to ${data.organizationName} has been deactivated

Hi${data.recipientName ? ` ${data.recipientName}` : ''},

Your access to ${data.organizationName} on SkillPassport has been deactivated by ${data.deactivatedBy}.

You will no longer be able to access ${data.organizationName}'s recruitment features. If you believe this is a mistake, please contact your organization administrator.

---
This is an automated email from SkillPassport. Please do not reply to this email.
  `;

    await sendEmail(env, {
        to: data.recipientEmail,
        subject,
        html: htmlBody,
        text: textBody,
    });
}

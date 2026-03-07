/**
 * Email HTML templates
 */

import type { 
  InvitationTemplateData, 
  CountdownTemplateData, 
  EventConfirmationTemplateData,
  OTPTemplateData 
} from '../types';
import { APP_URL } from '../types';

// ==================== INVITATION TEMPLATE ====================

export function generateInvitationEmailHtml(data: InvitationTemplateData): string {
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

export function getInvitationSubject(organizationName: string): string {
  return `You're invited to join ${organizationName} on Skill Passport`;
}

// ==================== COUNTDOWN TEMPLATE ====================

export function generateCountdownEmailHtml(data: CountdownTemplateData): string {
  const { fullName, countdownDay, launchDate } = data;
  
  const launchDateFormatted = new Date(launchDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const emoji = countdownDay === 1 ? '🚀' : countdownDay <= 3 ? '⏰' : '📅';
  const urgencyColor = countdownDay === 1 ? '#DC2626' : countdownDay <= 3 ? '#F59E0B' : '#6366F1';

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Countdown to Launch</title></head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', sans-serif; background-color: #f4f7fa;">
  <table style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table style="width: 600px; max-width: 100%; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <tr>
            <td style="padding: 40px; text-align: center; background: linear-gradient(135deg, ${urgencyColor} 0%, ${urgencyColor}dd 100%); border-radius: 12px 12px 0 0;">
              <div style="width: 80px; height: 80px; background: white; border-radius: 50%; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 48px;">${emoji}</span>
              </div>
              <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700;">${countdownDay} ${countdownDay === 1 ? 'Day' : 'Days'} to Go!</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <p style="color: #374151; font-size: 18px; margin-bottom: 24px;">Hello ${fullName},</p>
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
                ${countdownDay === 1 
                  ? '🎉 <strong>Tomorrow is the big day!</strong> Your journey with Skill Passport begins in just 24 hours.' 
                  : `We're getting closer! Only <strong>${countdownDay} days</strong> until Skill Passport launches and transforms your career journey.`}
              </p>
              
              <div style="background: linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%); border-radius: 12px; padding: 32px; margin: 32px 0; text-align: center;">
                <div style="font-size: 64px; font-weight: 700; color: ${urgencyColor}; margin-bottom: 8px;">${countdownDay}</div>
                <div style="font-size: 18px; color: #1F2937; font-weight: 600;">DAY${countdownDay === 1 ? '' : 'S'} REMAINING</div>
                <div style="margin-top: 16px; padding-top: 16px; border-top: 2px solid #BFDBFE;">
                  <div style="font-size: 14px; color: #6B7280; margin-bottom: 4px;">Launch Date</div>
                  <div style="font-size: 16px; color: #1F2937; font-weight: 600;">${launchDateFormatted}</div>
                </div>
              </div>
              
              <div style="background-color: #F9FAFB; border-radius: 8px; padding: 24px; margin: 24px 0;">
                <h3 style="margin: 0 0 16px; color: #1F2937; font-size: 18px;">✨ What's Coming</h3>
                <ul style="margin: 0; padding-left: 20px; color: #4B5563; line-height: 1.8;">
                  <li>AI-powered career guidance tailored to your goals</li>
                  <li>Comprehensive skill assessment and tracking</li>
                  <li>Personalized learning pathways</li>
                  <li>Direct connections with top employers</li>
                  <li>Real-time progress monitoring</li>
                </ul>
              </div>
              
              ${countdownDay === 1 ? `
              <div style="background-color: #FEF3C7; border-left: 4px solid #F59E0B; padding: 16px; margin: 24px 0;">
                <p style="margin: 0; color: #92400E; font-size: 14px;">
                  <strong>⚡ Final Reminder:</strong> Make sure you've completed your payment to secure your spot. Don't miss out on this opportunity!
                </p>
              </div>
              ` : ''}
              
              <div style="text-align: center; margin: 32px 0;">
                <a href="${APP_URL}/pre-registration" style="display: inline-block; background: linear-gradient(135deg, ${urgencyColor} 0%, ${urgencyColor}dd 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 600;">Complete Your Registration →</a>
              </div>
              
              <p style="color: #6B7280; font-size: 14px; margin-top: 32px; text-align: center;">
                Get ready to unlock your full potential! 🚀
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

export function getCountdownSubject(countdownDay: number): string {
  return `${countdownDay} ${countdownDay === 1 ? 'Day' : 'Days'} Until Skill Passport Launch! 🚀`;
}

// ==================== EVENT REGISTRATION TEMPLATES ====================

export function generateUserConfirmationHtml(data: EventConfirmationTemplateData): string {
  const { name, email, phone, amount, orderId, campaign, baseUrl = 'https://skillpassport.rareminds.in' } = data;

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Registration Confirmed</title></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f9fafb;">
  <table style="width:100%;border-collapse:collapse;">
    <tr>
      <td align="center" style="padding:48px 24px;">
        <table style="width:100%;max-width:480px;background:#ffffff;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,0.1);overflow:hidden;">
          <tr>
            <td style="padding:48px 40px;text-align:center;background:linear-gradient(135deg,#1e40af 0%,#3b82f6 100%);">
              <div style="width:80px;height:80px;background:rgba(255,255,255,0.2);border-radius:50%;margin:0 auto 20px;display:flex;align-items:center;justify-content:center;padding:16px;box-sizing:border-box;">
                <img src="https://www.pngall.com/wp-content/uploads/13/Check-PNG-File.png" alt="Success" style="width:48px;height:48px;display:block;margin:0 auto;" />
              </div>
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:600;">Registration Confirmed</h1>
              <p style="margin:8px 0 0;color:#bfdbfe;font-size:14px;">Welcome to Skill Passport</p>
            </td>
          </tr>
          <tr>
            <td style="padding:40px;">
              <p style="color:#374151;font-size:15px;margin:0 0 24px;line-height:1.6;">Hi ${name},</p>
              <p style="color:#374151;font-size:15px;margin:0 0 24px;line-height:1.6;">Your payment has been received successfully. You're now registered!</p>
              
              <div style="margin-bottom:24px;padding:20px;background:#f0fdf4;border-radius:12px;border:2px solid #22c55e;">
                <p style="margin:0 0 16px;color:#15803d;font-size:15px;font-weight:600;">Next Step: Create Your Account</p>
                <p style="margin:0 0 16px;color:#374151;font-size:14px;line-height:1.6;">To access your Skill Passport dashboard and start your journey, please create your account using the signup page.</p>
                <a href="https://skillpassport.rareminds.in/signup" style="display:inline-block;background:#22c55e;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:600;">Create Account Now</a>
              </div>
              
              <table style="width:100%;border-collapse:collapse;background:#f9fafb;border-radius:12px;overflow:hidden;">
                <tr>
                  <td style="padding:16px 20px;color:#6b7280;font-size:14px;border-bottom:1px solid #e5e7eb;">Order ID</td>
                  <td style="padding:16px 20px;color:#111827;font-size:14px;text-align:right;border-bottom:1px solid #e5e7eb;font-family:monospace;">${orderId || 'N/A'}</td>
                </tr>
                <tr>
                  <td style="padding:16px 20px;color:#6b7280;font-size:14px;">Amount Paid</td>
                  <td style="padding:16px 20px;color:#1e40af;font-size:16px;text-align:right;font-weight:600;">₹${amount.toLocaleString()}</td>
                </tr>
              </table>
              
              <div style="margin-top:24px;padding:20px;background:#eff6ff;border-radius:12px;text-align:center;border:2px solid #3b82f6;">
                <p style="margin:0 0 16px;color:#1e40af;font-size:15px;font-weight:600;">📄 Download Your Receipt</p>
                <a href="${baseUrl}/api/email/download-receipt/${orderId}" style="display:inline-block;background:#1e40af;color:#ffffff;text-decoration:none;padding:12px 32px;border-radius:8px;font-size:14px;font-weight:600;margin-bottom:8px;">Download PDF Receipt</a>
                <p style="margin:8px 0 0;color:#6b7280;font-size:12px;">Click the button above to download your payment receipt</p>
              </div>
              
              <div style="margin-top:32px;padding:28px;background:linear-gradient(135deg,#f8fafc 0%,#f1f5f9 100%);border-radius:12px;text-align:center;border:1px solid #e2e8f0;">
                <p style="margin:0 0 20px;color:#334155;font-size:15px;font-weight:600;">Need assistance? We're here to help!</p>
                <table cellpadding="0" cellspacing="0" border="0" style="width:100%;">
                  <tr>
                    <td style="width:50%;padding-right:6px;">
                      <table cellpadding="0" cellspacing="0" border="0" style="width:100%;">
                        <tr>
                          <td style="background:#1e40af;border-radius:8px;text-align:center;">
                            <a href="mailto:marketing@rareminds.in" style="display:block;padding:14px 20px;color:#ffffff;text-decoration:none;font-size:14px;font-weight:500;">✉️ Email Us</a>
                          </td>
                        </tr>
                      </table>
                    </td>
                    <td style="width:50%;padding-left:6px;">
                      <table cellpadding="0" cellspacing="0" border="0" style="width:100%;">
                        <tr>
                          <td style="background:#ffffff;border:2px solid #1e40af;border-radius:8px;text-align:center;">
                            <a href="tel:+919562481100" style="display:block;padding:12px 20px;color:#1e40af;text-decoration:none;font-size:14px;font-weight:500;">📞 Call Us</a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 40px 40px;text-align:center;">
              <p style="margin:0;color:#9ca3af;font-size:12px;">© ${new Date().getFullYear()} Skill Passport by Rareminds</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function generateAdminNotificationHtml(data: EventConfirmationTemplateData): string {
  const { name, email, phone, amount, orderId, campaign } = data;

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>New Registration</title></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f9fafb;">
  <table style="width:100%;border-collapse:collapse;">
    <tr>
      <td align="center" style="padding:48px 24px;">
        <table style="width:100%;max-width:480px;background:#ffffff;border-radius:12px;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
          <tr>
            <td style="padding:32px 40px;background:linear-gradient(135deg,#1e40af 0%,#3b82f6 100%);border-radius:12px 12px 0 0;">
              <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:600;">New Registration</h1>
              <p style="margin:4px 0 0;color:#bfdbfe;font-size:13px;">Campaign: ${campaign}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 40px;">
              <h3 style="margin:0 0 16px;color:#111827;font-size:14px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Contact Details</h3>
              <table style="width:100%;border-collapse:collapse;">
                <tr>
                  <td style="padding:12px 0;color:#6b7280;font-size:14px;border-bottom:1px solid #f3f4f6;">Name</td>
                  <td style="padding:12px 0;color:#111827;font-size:14px;text-align:right;border-bottom:1px solid #f3f4f6;font-weight:500;">${name}</td>
                </tr>
                <tr>
                  <td style="padding:12px 0;color:#6b7280;font-size:14px;border-bottom:1px solid #f3f4f6;">Email</td>
                  <td style="padding:12px 0;color:#1e40af;font-size:14px;text-align:right;border-bottom:1px solid #f3f4f6;">${email}</td>
                </tr>
                <tr>
                  <td style="padding:12px 0;color:#6b7280;font-size:14px;">Phone</td>
                  <td style="padding:12px 0;color:#111827;font-size:14px;text-align:right;">${phone}</td>
                </tr>
              </table>
              
              <div style="margin-top:24px;padding:20px;background:#f9fafb;border-radius:8px;">
                <div style="display:flex;justify-content:space-between;">
                  <span style="color:#6b7280;font-size:14px;">Amount</span>
                  <span style="color:#1e40af;font-size:18px;font-weight:600;">₹${amount.toLocaleString()}</span>
                </div>
              </div>
              <p style="margin:24px 0 0;color:#9ca3af;font-size:12px;">Order: ${orderId || 'N/A'} • ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function generateOTPEmailHtml(data: OTPTemplateData): string {
  const { otp, name } = data;

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Verify Your Email</title></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f9fafb;">
  <table style="width:100%;border-collapse:collapse;">
    <tr>
      <td align="center" style="padding:48px 24px;">
        <table style="width:100%;max-width:480px;background:#ffffff;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,0.1);overflow:hidden;">
          <tr>
            <td style="padding:40px;text-align:center;background:linear-gradient(135deg,#1e40af 0%,#3b82f6 100%);">
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:600;">Verify Your Email</h1>
              <p style="margin:8px 0 0;color:#bfdbfe;font-size:14px;">Skill Passport Registration</p>
            </td>
          </tr>
          <tr>
            <td style="padding:40px;">
              <p style="color:#374151;font-size:15px;margin:0 0 24px;line-height:1.6;">Hi ${name || 'there'},</p>
              <p style="color:#374151;font-size:15px;margin:0 0 32px;line-height:1.6;">Use the verification code below to complete your registration:</p>
              <div style="background:linear-gradient(135deg,#eff6ff 0%,#dbeafe 100%);border-radius:12px;padding:24px;text-align:center;border:2px dashed #3b82f6;">
                <p style="margin:0 0 8px;color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Verification Code</p>
                <p style="margin:0;font-size:36px;font-weight:700;color:#1e40af;letter-spacing:8px;font-family:monospace;">${otp}</p>
              </div>
              <p style="margin:32px 0 0;color:#9ca3af;font-size:13px;text-align:center;">This code expires in 10 minutes</p>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 40px 40px;text-align:center;border-top:1px solid #e5e7eb;">
              <p style="margin:0;color:#9ca3af;font-size:12px;">© ${new Date().getFullYear()} Skill Passport by Rareminds</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function getUserConfirmationSubject(name: string): string {
  return `Registration Confirmed - Skill Passport`;
}

export function getAdminNotificationSubject(name: string, amount: number): string {
  return `New Registration: ${name} (₹${amount.toLocaleString()})`;
}

export function getOTPSubject(otp: string): string {
  return `Your Verification Code: ${otp}`;
}

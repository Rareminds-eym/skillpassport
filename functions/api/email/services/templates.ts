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
  const memberTypeDisplay = memberType === 'educator' ? 'Educator' : 'Learner';
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
  const { name, email, phone, amount, orderId, campaign, baseUrl = 'https://skillpassport.rareminds.in', receiptUrl } = data;
  const currentDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  return `
<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="format-detection" content="telephone=no,address=no,email=no,date=no,url=no">
  <title>Payment Confirmation — RareMinds</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Serif+Display&display=swap');
    
    * {
      box-sizing: border-box;
    }
    
    body {
      margin: 0;
      padding: 0;
      width: 100% !important;
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
    }
    
    table {
      border-collapse: collapse;
      mso-table-lspace: 0pt;
      mso-table-rspace: 0pt;
    }
    
    img {
      border: 0;
      height: auto;
      line-height: 100%;
      outline: none;
      text-decoration: none;
      -ms-interpolation-mode: bicubic;
    }
    
    a {
      text-decoration: none;
    }
    
    @media only screen and (max-width: 600px) {
      .email-wrapper {
        padding: 16px !important;
      }
      .email-card {
        padding: 32px 24px !important;
      }
      .amount-block {
        padding: 20px !important;
      }
      .meta-row {
        display: block !important;
        width: 100% !important;
      }
      .meta-cell {
        display: block !important;
        width: 100% !important;
        padding: 6px 0 !important;
      }
      .support-cell {
        display: block !important;
        width: 100% !important;
        text-align: center !important;
        padding: 8px 0 !important;
      }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#F4F4F0;font-family:'DM Sans',Arial,sans-serif;">
  <!-- Preheader (hidden preview text) -->
  <div style="display:none;font-size:1px;color:#F4F4F0;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">
    Your RareMinds subscription is now active — ₹${amount} received. Order ID: ${orderId}
  </div>
  
  <!-- Outer wrapper table -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F4F4F0;min-width:100%;">
    <tr>
      <td align="center" class="email-wrapper" style="padding:48px 16px;">
        <!-- Main card table -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%;">
          <!-- ── LOGO HEADER ── -->
          <tr>
            <td align="center" style="padding-bottom:28px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="display:inline-table;">
                <tr>
                  <td style="text-align:center;">
                    <img src="${baseUrl}/RMLogo.webp" alt="RareMinds Logo" width="140" style="display:block;height:auto;">
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- ── CARD ── -->
          <tr>
            <td class="email-card" style="background-color:#FFFFFF;border-radius:16px;padding:48px 44px;box-shadow:0 2px 24px rgba(0,0,0,0.07);">
              <!-- Success badge -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="padding-bottom:28px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="display:inline-table;">
                      <tr>
                        <td style="background-color:#EDFAF4;border-radius:100px;padding:8px 18px;">
                          <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                            <tr>
                              <td style="padding-right:7px;vertical-align:middle;">
                                <!-- Checkmark icon -->
                                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <circle cx="7" cy="7" r="7" fill="#1DB96A"/>
                                  <path d="M4 7L6.2 9.5L10 5" stroke="#FFFFFF" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>
                              </td>
                              <td style="font-family:'DM Sans',Arial,sans-serif;font-size:13px;font-weight:600;color:#1DB96A;letter-spacing:0.06em;text-transform:uppercase;vertical-align:middle;">
                                Subscription Successful
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                
                <!-- Heading -->
                <tr>
                  <td align="center" style="padding-bottom:12px;">
                    <h1 style="margin:0;font-family:'DM Serif Display',Georgia,serif;font-size:30px;font-weight:400;color:#111111;line-height:1.25;letter-spacing:-0.01em;">
                      Payment Confirmed
                    </h1>
                  </td>
                </tr>
                
                <!-- Sub-message -->
                <tr>
                  <td align="center" style="padding-bottom:36px;">
                    <p style="margin:0;font-family:'DM Sans',Arial,sans-serif;font-size:15px;font-weight:400;color:#666666;line-height:1.6;max-width:380px;">
                      Thank you for your payment. Your subscription is successfully activated and ready to use.
                    </p>
                  </td>
                </tr>
                
                <!-- ── AMOUNT BLOCK ── -->
                <tr>
                  <td class="amount-block" style="background-color:#F9F9F7;border-radius:12px;padding:28px;margin-bottom:28px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td align="center" style="padding-bottom:6px;">
                          <span style="font-family:'DM Sans',Arial,sans-serif;font-size:13px;font-weight:500;color:#999999;letter-spacing:0.08em;text-transform:uppercase;">
                            Amount Paid
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td align="center">
                          <span style="font-family:'DM Serif Display',Georgia,serif;font-size:52px;font-weight:400;color:#111111;line-height:1.1;letter-spacing:-0.02em;">
                            ₹${amount.toLocaleString()}
                          </span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                
                <tr>
                  <td style="height:28px;"></td>
                </tr>
                
                <!-- ── ORDER DETAILS ── -->
                <tr>
                  <td>
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #EBEBEB;border-radius:10px;overflow:hidden;">
                      <!-- Row: Recipient -->
                      <tr style="border-bottom:1px solid #EBEBEB;">
                        <td style="padding:14px 18px;font-family:'DM Sans',Arial,sans-serif;font-size:13px;color:#999999;font-weight:500;width:40%;border-bottom:1px solid #EBEBEB;">
                          Recipient
                        </td>
                        <td style="padding:14px 18px;font-family:'DM Sans',Arial,sans-serif;font-size:13px;color:#111111;font-weight:500;border-bottom:1px solid #EBEBEB;">
                          ${email}
                        </td>
                      </tr>
                      
                      <!-- Row: Order ID -->
                      <tr style="border-bottom:1px solid #EBEBEB;">
                        <td style="padding:14px 18px;font-family:'DM Sans',Arial,sans-serif;font-size:13px;color:#999999;font-weight:500;border-bottom:1px solid #EBEBEB;">
                          Order ID
                        </td>
                        <td style="padding:14px 18px;font-family:'DM Sans',Arial,sans-serif;font-size:13px;color:#111111;font-weight:600;font-variant-numeric:tabular-nums;letter-spacing:0.01em;border-bottom:1px solid #EBEBEB;">
                          ${orderId || 'N/A'}
                        </td>
                      </tr>
                      
                      <!-- Row: Plan -->
                      <tr style="border-bottom:1px solid #EBEBEB;">
                        <td style="padding:14px 18px;font-family:'DM Sans',Arial,sans-serif;font-size:13px;color:#999999;font-weight:500;border-bottom:1px solid #EBEBEB;">
                          Plan
                        </td>
                        <td style="padding:14px 18px;font-family:'DM Sans',Arial,sans-serif;font-size:13px;color:#111111;font-weight:500;border-bottom:1px solid #EBEBEB;">
                          Skill Passport Subscription
                        </td>
                      </tr>
                      
                      <!-- Row: Date -->
                      <tr>
                        <td style="padding:14px 18px;font-family:'DM Sans',Arial,sans-serif;font-size:13px;color:#999999;font-weight:500;">
                          Date
                        </td>
                        <td style="padding:14px 18px;font-family:'DM Sans',Arial,sans-serif;font-size:13px;color:#111111;font-weight:500;">
                          ${currentDate}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                
                <tr>
                  <td style="height:28px;"></td>
                </tr>
                
                ${receiptUrl ? `
                <!-- ── CTA BUTTON ── -->
                <tr>
                  <td align="center">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="display:inline-table;">
                      <tr>
                        <td style="border-radius:10px;background-color:#111111;">
                          <a href="${receiptUrl}" style="display:inline-block;padding:15px 36px;font-family:'DM Sans',Arial,sans-serif;font-size:14px;font-weight:600;color:#FFFFFF;text-decoration:none;letter-spacing:0.02em;border-radius:10px;">
                            ↓&nbsp;&nbsp;Download PDF Receipt
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                
                <tr>
                  <td style="height:8px;"></td>
                </tr>
                
                <!-- Helper text under CTA -->
                <tr>
                  <td align="center" style="padding-bottom:4px;">
                    <p style="margin:0;font-family:'DM Sans',Arial,sans-serif;font-size:12px;color:#BBBBBB;">
                      Keep this receipt for your records
                    </p>
                  </td>
                </tr>
                ` : ''}
              </table>
            </td>
          </tr>
          
          <!-- ── SUPPORT SECTION ── -->
          <tr>
            <td style="padding:32px 12px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <!-- Divider line -->
                <tr>
                  <td style="padding-bottom:24px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="height:1px;background-color:#E5E5E0;font-size:0;line-height:0;">&nbsp;</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                
                <tr>
                  <td align="center" style="padding-bottom:16px;">
                    <p style="margin:0;font-family:'DM Sans',Arial,sans-serif;font-size:14px;color:#888888;font-weight:400;">
                      Need assistance? We're here to help!
                    </p>
                  </td>
                </tr>
                
                <!-- Support buttons row -->
                <tr>
                  <td align="center">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <!-- Email Us -->
                        <td class="support-cell" style="padding:0 6px;">
                          <a href="mailto:marketing@rareminds.in" style="display:inline-block;padding:10px 22px;font-family:'DM Sans',Arial,sans-serif;font-size:13px;font-weight:500;color:#111111;text-decoration:none;border:1.5px solid #DDDDD8;border-radius:8px;background-color:#FFFFFF;letter-spacing:0.01em;">
                            ✉&nbsp; Email Us
                          </a>
                        </td>
                        
                        <!-- Call Us -->
                        <td class="support-cell" style="padding:0 6px;">
                          <a href="tel:+919562481100" style="display:inline-block;padding:10px 22px;font-family:'DM Sans',Arial,sans-serif;font-size:13px;font-weight:500;color:#111111;text-decoration:none;border:1.5px solid #DDDDD8;border-radius:8px;background-color:#FFFFFF;letter-spacing:0.01em;">
                            ☎&nbsp; Call Us
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                
                <!-- Footer note -->
                <tr>
                  <td align="center" style="padding-top:28px;padding-bottom:8px;">
                    <p style="margin:0;font-family:'DM Sans',Arial,sans-serif;font-size:12px;color:#BBBBBB;line-height:1.7;">
                      © ${new Date().getFullYear()} RareMinds. All rights reserved.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
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

// ==================== WELCOME EMAIL TEMPLATE ====================

export interface WelcomeEmailData {
  name: string;
  email: string;
  role: string;
  baseUrl: string;
  additionalInfo?: string;
}

export function generateWelcomeEmailHtml(data: WelcomeEmailData): string {
  const { name, email, role, baseUrl, additionalInfo } = data;
  
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Welcome to SkillPassport</title></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f9fafb;">
  <table style="width:100%;border-collapse:collapse;">
    <tr>
      <td align="center" style="padding:48px 24px;">
        <table style="width:100%;max-width:480px;background:#ffffff;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,0.1);overflow:hidden;">
          <tr>
            <td style="padding:48px 40px;text-align:center;background:linear-gradient(135deg,#1e40af 0%,#3b82f6 100%);">
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:600;">Welcome to SkillPassport!</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:40px;">
              <p style="color:#374151;font-size:15px;margin:0 0 24px;line-height:1.6;">Hello ${name},</p>
              <p style="color:#374151;font-size:15px;margin:0 0 24px;line-height:1.6;">Your account has been created successfully and is ready to use!</p>
              
              <div style="background:#f9fafb;border-radius:12px;padding:20px;margin:24px 0;border-left:4px solid #1e40af;">
                <table style="width:100%;border-collapse:collapse;">
                  <tr>
                    <td style="padding:8px 0;color:#6b7280;font-size:14px;">Email</td>
                    <td style="padding:8px 0;color:#111827;font-size:14px;text-align:right;font-weight:500;">${email}</td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0;color:#6b7280;font-size:14px;">Role</td>
                    <td style="padding:8px 0;color:#1e40af;font-size:14px;text-align:right;font-weight:600;">${role}</td>
                  </tr>
                  ${additionalInfo ? `<tr><td colspan="2" style="padding:12px 0;color:#6b7280;font-size:13px;border-top:1px solid #e5e7eb;margin-top:8px;">${additionalInfo}</td></tr>` : ''}
                </table>
              </div>
              
              <div style="text-align:center;margin:32px 0;">
                <a href="${baseUrl}/login" style="display:inline-block;background:#1e40af;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:14px;font-weight:600;">Login Now →</a>
              </div>
              
              <p style="color:#6b7280;font-size:14px;margin-top:32px;text-align:center;">If you have any questions, please don't hesitate to contact our support team.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 40px;text-align:center;border-top:1px solid #e5e7eb;">
              <p style="margin:0;color:#9ca3af;font-size:12px;">© ${new Date().getFullYear()} SkillPassport. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function getWelcomeSubject(): string {
  return 'Welcome to SkillPassport!';
}

// ==================== PASSWORD RESET TEMPLATE ====================

export interface PasswordResetData {
  otp: string;
}

export function generatePasswordResetEmailHtml(data: PasswordResetData): string {
  const { otp } = data;
  
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Password Reset</title></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f9fafb;">
  <table style="width:100%;border-collapse:collapse;">
    <tr>
      <td align="center" style="padding:48px 24px;">
        <table style="width:100%;max-width:480px;background:#ffffff;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,0.1);overflow:hidden;">
          <tr>
            <td style="padding:48px 40px;text-align:center;background:linear-gradient(135deg,#1e40af 0%,#3b82f6 100%);">
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:600;">Password Reset Request</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:40px;">
              <p style="color:#374151;font-size:15px;margin:0 0 24px;line-height:1.6;">Hello,</p>
              <p style="color:#374151;font-size:15px;margin:0 0 24px;line-height:1.6;">We received a request to reset your password. Use the OTP code below to complete the process:</p>
              
              <div style="background:linear-gradient(135deg,#eff6ff 0%,#dbeafe 100%);border-radius:12px;padding:24px;text-align:center;border:2px dashed #3b82f6;margin:24px 0;">
                <p style="margin:0 0 8px;color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Your OTP Code</p>
                <div style="font-size:36px;font-weight:700;color:#1e40af;letter-spacing:8px;font-family:monospace;margin:8px 0;">${otp}</div>
                <p style="margin:8px 0 0;color:#6b7280;font-size:13px;">Valid for 10 minutes</p>
              </div>
              
              <div style="background:#FEF3C7;border-left:4px solid #F59E0B;padding:16px;margin:24px 0;border-radius:4px;">
                <p style="margin:0;color:#92400E;font-size:14px;"><strong>⚠️ Security Notice:</strong></p>
                <p style="margin:8px 0 0;color:#92400E;font-size:14px;">If you didn't request this password reset, please ignore this email. Your password will remain unchanged.</p>
              </div>
              
              <p style="color:#6b7280;font-size:14px;margin-top:24px;text-align:center;">For security reasons, this OTP will expire in 10 minutes.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 40px;text-align:center;border-top:1px solid #e5e7eb;">
              <p style="margin:0;color:#9ca3af;font-size:12px;">© ${new Date().getFullYear()} SkillPassport. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function getPasswordResetSubject(): string {
  return 'Password Reset - SkillPassport';
}

// ==================== INTERVIEW REMINDER TEMPLATE ====================

export interface InterviewReminderData {
  recipientName: string;
  interviewDetails: {
    date?: string;
    time?: string;
    location?: string;
    interviewer?: string;
    position?: string;
    company?: string;
  };
}

export function generateInterviewReminderHtml(data: InterviewReminderData): string {
  const { recipientName, interviewDetails } = data;
  const { date, time, location, interviewer, position, company } = interviewDetails;
  
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Interview Reminder</title></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f9fafb;">
  <table style="width:100%;border-collapse:collapse;">
    <tr>
      <td align="center" style="padding:48px 24px;">
        <table style="width:100%;max-width:480px;background:#ffffff;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,0.1);overflow:hidden;">
          <tr>
            <td style="padding:48px 40px;text-align:center;background:linear-gradient(135deg,#1e40af 0%,#3b82f6 100%);">
              <div style="font-size:48px;margin-bottom:16px;">📅</div>
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:600;">Interview Reminder</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:40px;">
              <p style="color:#374151;font-size:15px;margin:0 0 24px;line-height:1.6;">Hello ${recipientName},</p>
              <p style="color:#374151;font-size:15px;margin:0 0 24px;line-height:1.6;">This is a reminder about your upcoming interview:</p>
              
              <div style="background:#f9fafb;border-radius:12px;padding:24px;margin:24px 0;border-left:4px solid #1e40af;">
                <table style="width:100%;border-collapse:collapse;">
                  ${position ? `<tr><td style="padding:8px 0;color:#6b7280;font-size:14px;">Position</td><td style="padding:8px 0;color:#111827;font-size:14px;text-align:right;font-weight:500;">${position}</td></tr>` : ''}
                  ${company ? `<tr><td style="padding:8px 0;color:#6b7280;font-size:14px;">Company</td><td style="padding:8px 0;color:#111827;font-size:14px;text-align:right;font-weight:500;">${company}</td></tr>` : ''}
                  ${date ? `<tr><td style="padding:8px 0;color:#6b7280;font-size:14px;">Date</td><td style="padding:8px 0;color:#111827;font-size:14px;text-align:right;font-weight:500;">${date}</td></tr>` : ''}
                  ${time ? `<tr><td style="padding:8px 0;color:#6b7280;font-size:14px;">Time</td><td style="padding:8px 0;color:#1e40af;font-size:14px;text-align:right;font-weight:600;">${time}</td></tr>` : ''}
                  ${location ? `<tr><td style="padding:8px 0;color:#6b7280;font-size:14px;">Location</td><td style="padding:8px 0;color:#111827;font-size:14px;text-align:right;font-weight:500;">${location}</td></tr>` : ''}
                  ${interviewer ? `<tr><td style="padding:8px 0;color:#6b7280;font-size:14px;">Interviewer</td><td style="padding:8px 0;color:#111827;font-size:14px;text-align:right;font-weight:500;">${interviewer}</td></tr>` : ''}
                </table>
              </div>
              
              <div style="background:#eff6ff;border-radius:8px;padding:20px;margin:24px 0;">
                <p style="margin:0 0 12px;color:#1f2937;font-size:15px;font-weight:600;">💡 Tips for your interview:</p>
                <ul style="margin:0;padding-left:20px;color:#4b5563;font-size:14px;line-height:1.8;">
                  <li>Join 5-10 minutes early</li>
                  <li>Test your internet connection and audio/video</li>
                  <li>Have your resume and relevant documents ready</li>
                  <li>Prepare questions to ask the interviewer</li>
                </ul>
              </div>
              
              <p style="color:#374151;font-size:15px;margin:24px 0 0;text-align:center;font-weight:600;">Good luck with your interview! 🎯</p>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 40px;text-align:center;border-top:1px solid #e5e7eb;">
              <p style="margin:0;color:#9ca3af;font-size:12px;">© ${new Date().getFullYear()} SkillPassport. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function getInterviewReminderSubject(): string {
  return 'Interview Reminder - SkillPassport';
}

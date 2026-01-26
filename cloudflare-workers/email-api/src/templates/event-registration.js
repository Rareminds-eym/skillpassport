/**
 * Event registration confirmation email templates
 */

import { APP_URL } from '../config/constants.js';

/**
 * Generate user confirmation email HTML
 */
export function generateUserConfirmationHtml(data) {
  const { name, email, phone, amount, orderId, campaign } = data;

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Pre-Registration Confirmed</title></head>
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
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:600;">Pre-Registration Confirmed</h1>
              <p style="margin:8px 0 0;color:#bfdbfe;font-size:14px;">Welcome to Skill Passport</p>
            </td>
          </tr>
          <tr>
            <td style="padding:40px;">
              <p style="color:#374151;font-size:15px;margin:0 0 24px;line-height:1.6;">Hi ${name},</p>
              <p style="color:#374151;font-size:15px;margin:0 0 24px;line-height:1.6;">Your payment has been received successfully. You're now pre-registered!</p>
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
                <a href="https://email-api.dark-mode-d021.workers.dev/download-receipt/${orderId}" style="display:inline-block;background:#1e40af;color:#ffffff;text-decoration:none;padding:12px 32px;border-radius:8px;font-size:14px;font-weight:600;margin-bottom:8px;">Download PDF Receipt</a>
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

/**
 * Generate admin notification email HTML
 */
export function generateAdminNotificationHtml(data) {
  const { name, email, phone, amount, orderId, campaign } = data;

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>New Pre-Registration</title></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f9fafb;">
  <table style="width:100%;border-collapse:collapse;">
    <tr>
      <td align="center" style="padding:48px 24px;">
        <table style="width:100%;max-width:480px;background:#ffffff;border-radius:12px;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
          <tr>
            <td style="padding:32px 40px;background:linear-gradient(135deg,#1e40af 0%,#3b82f6 100%);border-radius:12px 12px 0 0;">
              <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:600;">New Pre-Registration</h1>
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

/**
 * Generate OTP verification email HTML
 */
export function generateOTPEmailHtml(data) {
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
              <p style="margin:8px 0 0;color:#bfdbfe;font-size:14px;">Skill Passport Pre-Registration</p>
            </td>
          </tr>
          <tr>
            <td style="padding:40px;">
              <p style="color:#374151;font-size:15px;margin:0 0 24px;line-height:1.6;">Hi ${name || 'there'},</p>
              <p style="color:#374151;font-size:15px;margin:0 0 32px;line-height:1.6;">Use the verification code below to complete your pre-registration:</p>
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

export function getUserConfirmationSubject(name) {
  return `Pre-Registration Confirmed - Skill Passport`;
}

export function getAdminNotificationSubject(name, amount) {
  return `New Pre-Registration: ${name} (₹${amount.toLocaleString()})`;
}

export function getOTPSubject(otp) {
  return `Your Verification Code: ${otp}`;
}

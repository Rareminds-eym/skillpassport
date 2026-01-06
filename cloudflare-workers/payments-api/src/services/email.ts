/**
 * Email service functions
 */

import { Env, PaymentDetails } from '../types';
import { EMAIL_API_URL } from '../config';
import { formatAmount, formatDate } from '../utils';

/**
 * Send email via Cloudflare Worker (email-api)
 * Uses Service Binding if available, falls back to HTTP fetch
 */
export async function sendEmailViaWorker(
  env: Env,
  to: string,
  subject: string,
  html: string,
  from?: string,
  fromName?: string
): Promise<boolean> {
  console.log(`[EMAIL] Starting email send to: ${to}`);
  console.log(`[EMAIL] Subject: ${subject}`);
  
  try {
    const requestBody = JSON.stringify({
      to,
      subject,
      html,
      from,
      fromName,
    });
    
    let response: Response;
    
    // Use Service Binding if available (more reliable for worker-to-worker)
    if (env.EMAIL_SERVICE) {
      console.log(`[EMAIL] Using Service Binding to email-api`);
      response = await env.EMAIL_SERVICE.fetch('https://email-api/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: requestBody,
      });
    } else {
      // Fallback to HTTP fetch
      console.log(`[EMAIL] Using HTTP fetch to: ${EMAIL_API_URL}`);
      response = await fetch(EMAIL_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: requestBody,
      });
    }

    console.log(`[EMAIL] Response status: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[EMAIL] Failed with status ${response.status}: ${errorText}`);
      return false;
    }

    const result = await response.json() as { success?: boolean };
    return result.success === true;
  } catch (error) {
    console.error(`[EMAIL] Exception:`, error);
    return false;
  }
}

/**
 * Send payment confirmation email
 */
export async function sendPaymentConfirmationEmail(
  env: Env,
  email: string,
  name: string,
  paymentDetails: PaymentDetails
): Promise<boolean> {
  if (!email || !email.includes('@')) {
    console.error('Invalid email address:', email);
    return false;
  }

  const { paymentId, orderId, amount, planName, billingCycle, subscriptionEndDate, receiptUrl } = paymentDetails;

  const receiptButtonHtml = receiptUrl ? `
    <div style="text-align: center; margin: 24px 0;">
      <a href="${receiptUrl}" style="display: inline-block; background: linear-gradient(135deg, #10B981 0%, #059669 100%); color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-size: 14px; font-weight: 600;">📄 Download Receipt</a>
    </div>
  ` : '';

  const htmlContent = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Payment Confirmation</title></head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', sans-serif; background-color: #f4f7fa;">
  <table style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table style="width: 600px; max-width: 100%; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <tr>
            <td style="padding: 40px; text-align: center; background: linear-gradient(135deg, #10B981 0%, #059669 100%); border-radius: 12px 12px 0 0;">
              <div style="width: 60px; height: 60px; background: white; border-radius: 50%; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 32px;">✓</span>
              </div>
              <h1 style="margin: 0; color: #ffffff; font-size: 28px;">Payment Successful!</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <p style="color: #374151; font-size: 16px; margin-bottom: 24px;">Hi <strong>${name}</strong>,</p>
              <p style="color: #374151; font-size: 16px; margin-bottom: 24px;">Thank you for your payment! Your subscription has been activated successfully.</p>
              
              <div style="background-color: #F3F4F6; border-radius: 8px; padding: 24px; margin: 24px 0;">
                <h3 style="margin: 0 0 16px; color: #1F2937; font-size: 18px;">💳 Payment Details</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #6B7280;">Amount Paid</td>
                    <td style="padding: 8px 0; color: #1F2937; font-weight: 600; text-align: right;">${formatAmount(amount)}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6B7280;">Payment ID</td>
                    <td style="padding: 8px 0; color: #1F2937; font-family: monospace; text-align: right;">${paymentId.slice(-12)}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6B7280;">Order ID</td>
                    <td style="padding: 8px 0; color: #1F2937; font-family: monospace; text-align: right;">${orderId.slice(-12)}</td>
                  </tr>
                </table>
              </div>
              
              <div style="background-color: #EFF6FF; border-radius: 8px; padding: 24px; margin: 24px 0; border-left: 4px solid #3B82F6;">
                <h3 style="margin: 0 0 16px; color: #1F2937; font-size: 18px;">✨ Subscription Details</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #6B7280;">Plan</td>
                    <td style="padding: 8px 0; color: #3B82F6; font-weight: 600; text-align: right;">${planName}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6B7280;">Billing Cycle</td>
                    <td style="padding: 8px 0; color: #1F2937; text-align: right;">${billingCycle}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6B7280;">Valid Until</td>
                    <td style="padding: 8px 0; color: #1F2937; text-align: right;">${formatDate(subscriptionEndDate)}</td>
                  </tr>
                </table>
              </div>
              ${receiptButtonHtml}
              <div style="text-align: center; margin: 32px 0;">
                <a href="https://skillpassport.rareminds.in/subscription/manage" style="display: inline-block; background: linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 600;">Manage Subscription →</a>
              </div>
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

  return sendEmailViaWorker(
    env,
    email,
    `Payment Confirmed - ${planName} Subscription Activated!`,
    htmlContent,
    'noreply@rareminds.in',
    'Skill Passport'
  );
}

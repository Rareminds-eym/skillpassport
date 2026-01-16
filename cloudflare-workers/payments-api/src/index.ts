/**
 * Payments API Cloudflare Worker
 * Complete subscription and payment management backend
 * 
 * PAYMENT ENDPOINTS:
 * - POST /create-order         - Create Razorpay order for subscription
 * - POST /create-event-order   - Create Razorpay order for events
 * - POST /verify-payment       - Verify payment + create subscription + log transaction
 * - POST /webhook              - Handle Razorpay webhooks
 * 
 * SUBSCRIPTION ENDPOINTS:
 * - GET  /get-subscription     - Get user's active subscription
 * - POST /cancel-subscription  - Cancel Razorpay recurring subscription
 * - POST /deactivate-subscription - Deactivate/cancel subscription in DB
 * - POST /pause-subscription   - Pause subscription (1-3 months)
 * - POST /resume-subscription  - Resume paused subscription
 * 
 * SUBSCRIPTION PLANS ENDPOINTS:
 * - GET  /subscription-plans   - Get all active plans
 * - GET  /subscription-plan    - Get single plan by code
 * - GET  /subscription-features - Get features comparison
 * 
 * ADD-ON ENDPOINTS:
 * - GET  /addon-catalog        - Get available add-ons and bundles
 * - GET  /user-entitlements    - Get user's active entitlements
 * - POST /create-addon-order   - Create Razorpay order for add-on purchase
 * - POST /verify-addon-payment - Verify payment AND create entitlement atomically
 * - POST /create-bundle-order  - Create Razorpay order for bundle purchase
 * - POST /verify-bundle-payment - Verify payment AND create bundle entitlements
 * - POST /cancel-addon         - Cancel an add-on subscription
 * - GET  /check-addon-access   - Check if user has access to a feature
 * 
 * ENTITLEMENT LIFECYCLE ENDPOINTS (CRON):
 * - POST /process-entitlement-lifecycle - Main cron handler (runs all lifecycle tasks)
 * - POST /expire-entitlements    - Mark expired entitlements as 'expired'
 * - POST /send-renewal-reminders - Send reminder emails (7, 3, 1 days before expiry)
 * - POST /process-auto-renewals  - Process auto-renewals for expiring entitlements
 * 
 * ADMIN/CRON ENDPOINTS:
 * - POST /expire-subscriptions - Auto-expire old subscriptions (cron)
 * - GET  /health               - Health check with config status
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

// Import modular handlers
import {
    handleCancelAddon,
    handleCheckAddonAccess,
    handleCreateAddonOrder,
    handleCreateBundleOrder,
    handleGetAddonCatalog,
    handleGetUserEntitlements,
    handleVerifyAddonPayment,
    handleVerifyBundlePayment
} from './handlers/addons';
import {
    handleExpireEntitlements,
    handleProcessAutoRenewals,
    handleProcessEntitlementLifecycle,
    handleSendRenewalReminders
} from './handlers/entitlementLifecycle';
import {
    handleAcceptInvitation,
    handleAssignLicense,
    handleBulkAssignLicenses,
    handleBulkInviteMembers,
    handleCalculateOrgPricing,
    handleCalculateSeatAdditionCost,
    handleCancelInvitation,
    handleConfigureAutoAssignment,
    handleCreateLicensePool,
    handleDownloadInvoice,
    // Billing handlers
    handleGetBillingDashboard,
    handleGetCostProjection,
    handleGetInvitations,
    handleGetInvitationStats,
    handleGetInvoiceHistory,
    handleGetLicensePools,
    handleGetOrgSubscriptions,
    handleGetUserAssignments,
    // Invitation handlers
    handleInviteMember,
    handlePurchaseOrgSubscription,
    handleResendInvitation,
    handleTransferLicense,
    handleUnassignLicense,
    handleUpdatePoolAllocation,
    handleUpdateSeatCount
} from './handlers/organization';
import { handleGetSubscriptionFeatures, handleGetSubscriptionPlan, handleGetSubscriptionPlans } from './handlers/plans';

// Re-export Env type for use in other modules
export interface Env {
  // Supabase - support both naming conventions
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  // Legacy VITE_ prefixed names (fallback)
  VITE_SUPABASE_URL?: string;
  VITE_SUPABASE_ANON_KEY?: string;
  // Razorpay
  RAZORPAY_KEY_ID: string;
  RAZORPAY_KEY_SECRET: string;
  RAZORPAY_WEBHOOK_SECRET?: string;
  // Test mode credentials (optional)
  TEST_RAZORPAY_KEY_ID?: string;
  TEST_RAZORPAY_KEY_SECRET?: string;
  // Legacy VITE_ prefixed names (fallback)
  VITE_RAZORPAY_KEY_ID?: string;
  // Service binding to email-api worker
  EMAIL_SERVICE?: Fetcher;
  // Service binding to storage-api worker (for worker-to-worker communication)
  STORAGE_SERVICE?: Fetcher;
  // Storage API URL for receipt uploads (fallback for external calls)
  STORAGE_API_URL?: string;
  // Note: Email sending now uses Cloudflare Worker (email-api) with SMTP
  // RESEND_API_KEY is no longer needed
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-razorpay-signature',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

// Valid plan amounts in paise
const VALID_AMOUNTS = [100, 49900, 99900, 199900];
const MAX_AMOUNT = 1000000;

// URL validation helper
function isValidHttpUrl(str: string): boolean {
  try {
    const url = new URL(str);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

// Helper to get Supabase URL with fallback and validation
function getSupabaseUrl(env: Env): string {
  const url = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
  if (!url) {
    throw new Error('SUPABASE_URL is not configured. Set it as a Cloudflare secret via: wrangler secret put SUPABASE_URL');
  }
  if (!isValidHttpUrl(url)) {
    throw new Error(`Invalid supabaseUrl: Must be a valid HTTP or HTTPS URL. Got: "${url.substring(0, 50)}...". Ensure SUPABASE_URL is set correctly as a Cloudflare secret.`);
  }
  return url;
}

// Helper to get Supabase Anon Key with fallback
function getSupabaseAnonKey(env: Env): string {
  const key = env.SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY;
  if (!key) {
    throw new Error('SUPABASE_ANON_KEY is not configured. Set it as a Cloudflare secret via: wrangler secret put SUPABASE_ANON_KEY');
  }
  return key;
}

// Helper to get Razorpay Key ID with fallback
function getRazorpayKeyId(env: Env): string {
  const key = env.RAZORPAY_KEY_ID || env.VITE_RAZORPAY_KEY_ID;
  if (!key) {
    throw new Error('RAZORPAY_KEY_ID is not configured. Set it as a Cloudflare secret via: wrangler secret put RAZORPAY_KEY_ID');
  }
  return key;
}

function jsonResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function authenticateUser(request: Request, env: Env): Promise<{ user: any; supabase: SupabaseClient } | null> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) return null;

  const token = authHeader.replace('Bearer ', '');
  const supabaseUrl = getSupabaseUrl(env);
  const supabaseAdmin = createClient(supabaseUrl, env.SUPABASE_SERVICE_ROLE_KEY);
  
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) return null;

  const supabase = createClient(supabaseUrl, getSupabaseAnonKey(env), {
    global: { headers: { Authorization: authHeader } },
  });

  return { user, supabase };
}

// Production domain for live payments
const PRODUCTION_DOMAIN = 'skillpassport.rareminds.in';

/**
 * Check if request is from production site
 */
function isProductionRequest(request: Request): boolean {
  const origin = request.headers.get('origin') || request.headers.get('referer') || '';
  return origin.includes(PRODUCTION_DOMAIN) && !origin.includes('dev-');
}

/**
 * Get Razorpay credentials based on request origin
 * - Production (skillpassport.rareminds.in): Uses LIVE keys
 * - Everything else (localhost, netlify, dev): Uses TEST keys
 */
function getRazorpayCredentialsForRequest(request: Request, env: Env): { keyId: string; keySecret: string; isProduction: boolean } {
  const isProduction = isProductionRequest(request);
  
  let keyId: string;
  let keySecret: string;
  
  if (isProduction) {
    // Production: Use LIVE credentials
    keyId = getRazorpayKeyId(env);
    keySecret = env.RAZORPAY_KEY_SECRET;
    console.log('[RAZORPAY] Using LIVE credentials for production');
  } else {
    // Development/Test: Use TEST credentials (with fallback to production)
    keyId = env.TEST_RAZORPAY_KEY_ID || getRazorpayKeyId(env);
    keySecret = env.TEST_RAZORPAY_KEY_SECRET || env.RAZORPAY_KEY_SECRET;
    console.log('[RAZORPAY] Using TEST credentials for development');
  }
  
  if (!keySecret) {
    throw new Error('RAZORPAY_KEY_SECRET is not configured');
  }
  
  return { keyId, keySecret, isProduction };
}

/**
 * @deprecated Use getRazorpayCredentialsForRequest instead for proper environment detection
 */
function getRazorpayCredentials(env: Env) {
  // Legacy function - defaults to test credentials if available
  const keyId = env.TEST_RAZORPAY_KEY_ID || getRazorpayKeyId(env);
  const keySecret = env.TEST_RAZORPAY_KEY_SECRET || env.RAZORPAY_KEY_SECRET;
  if (!keySecret) {
    throw new Error('RAZORPAY_KEY_SECRET is not configured');
  }
  return { keyId, keySecret };
}

async function verifySignature(orderId: string, paymentId: string, signature: string, secret: string): Promise<boolean> {
  const text = `${orderId}|${paymentId}`;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(text));
  const generatedSignature = Array.from(new Uint8Array(signatureBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  return generatedSignature === signature;
}

async function verifyWebhookSignature(payload: string, signature: string, secret: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
  const generatedSignature = Array.from(new Uint8Array(signatureBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  return generatedSignature === signature;
}

// ==================== EMAIL FUNCTIONS ====================

const EMAIL_API_URL = 'https://email-api.dark-mode-d021.workers.dev';

/**
 * Send email via Cloudflare Worker (email-api)
 * Uses Service Binding if available, falls back to HTTP fetch
 */
async function sendEmailViaWorker(
  env: Env,
  to: string,
  subject: string,
  html: string,
  from?: string,
  fromName?: string
): Promise<boolean> {
  console.log(`[EMAIL] Starting email send to: ${to}`);
  console.log(`[EMAIL] Subject: ${subject}`);
  console.log(`[EMAIL] From: ${fromName} <${from}>`);
  
  try {
    const requestBody = JSON.stringify({
      to,
      subject,
      html,
      from,
      fromName,
    });
    
    console.log(`[EMAIL] Request body length: ${requestBody.length} chars`);
    
    let response: Response;
    
    // Use Service Binding if available (more reliable for worker-to-worker)
    if (env.EMAIL_SERVICE) {
      console.log(`[EMAIL] Using Service Binding to email-api`);
      response = await env.EMAIL_SERVICE.fetch('https://email-api/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: requestBody,
      });
    } else {
      // Fallback to HTTP fetch
      console.log(`[EMAIL] Using HTTP fetch to: ${EMAIL_API_URL}`);
      response = await fetch(EMAIL_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: requestBody,
      });
    }

    console.log(`[EMAIL] Response status: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[EMAIL] Failed with status ${response.status}: ${errorText}`);
      return false;
    }

    const result = await response.json() as { success?: boolean; message?: string };
    console.log(`[EMAIL] Success response:`, JSON.stringify(result));
    return result.success === true;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[EMAIL] Exception caught: ${errorMessage}`);
    console.error(`[EMAIL] Error stack:`, error instanceof Error ? error.stack : 'No stack');
    return false;
  }
}

/**
 * Send payment confirmation email using Cloudflare Worker (email-api)
 */
async function sendPaymentConfirmationEmail(
  env: Env,
  email: string,
  name: string,
  paymentDetails: {
    paymentId: string;
    orderId: string;
    amount: number;
    planName: string;
    billingCycle: string;
    subscriptionEndDate: string;
    receiptUrl?: string;
  }
): Promise<boolean> {
  // Validate email before attempting to send
  if (!email || !email.includes('@')) {
    console.error('Invalid or missing email address for payment confirmation:', email);
    return false;
  }

  const { paymentId, orderId, amount, planName, billingCycle, subscriptionEndDate, receiptUrl } = paymentDetails;
  
  console.log(`[EMAIL] receiptUrl received: ${receiptUrl || 'NOT PROVIDED'}`);
  console.log(`[EMAIL] Will include receipt button: ${receiptUrl ? 'YES' : 'NO'}`);
  
  const formatAmount = (a: number) => new Intl.NumberFormat('en-IN', { 
    style: 'currency', 
    currency: 'INR', 
    minimumFractionDigits: 0 
  }).format(a);

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  // Receipt download button HTML (only if receiptUrl is provided)
  const receiptButtonHtml = receiptUrl ? `
              <!-- Download Receipt Button -->
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
          <!-- Header -->
          <tr>
            <td style="padding: 40px; text-align: center; background: linear-gradient(135deg, #10B981 0%, #059669 100%); border-radius: 12px 12px 0 0;">
              <div style="width: 60px; height: 60px; background: white; border-radius: 50%; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 32px;">✓</span>
              </div>
              <h1 style="margin: 0; color: #ffffff; font-size: 28px;">Payment Successful!</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="color: #374151; font-size: 16px; margin-bottom: 24px;">Hi <strong>${name}</strong>,</p>
              <p style="color: #374151; font-size: 16px; margin-bottom: 24px;">Thank you for your payment! Your subscription has been activated successfully.</p>
              
              <!-- Payment Details Card -->
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
              
              <!-- Subscription Details Card -->
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
              <!-- CTA Button -->
              <div style="text-align: center; margin: 32px 0;">
                <a href="https://skillpassport.rareminds.in/subscription/manage" style="display: inline-block; background: linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 600;">Manage Subscription →</a>
              </div>
              
              <p style="color: #6B7280; font-size: 14px; margin-top: 24px;">If you have any questions, feel free to contact our support team.</p>
            </td>
          </tr>
          
          <!-- Footer -->
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

  const success = await sendEmailViaWorker(
    env,
    email,
    `Payment Confirmed - ${planName} Subscription Activated!`,
    htmlContent,
    'noreply@rareminds.in',
    'Skill Passport'
  );

  if (success) {
    console.log(`Payment confirmation email sent to ${email}`);
  }
  
  return success;
}

// ==================== RECEIPT PDF GENERATION & UPLOAD ====================

const STORAGE_API_URL = 'https://storage-api.dark-mode-d021.workers.dev';

/**
 * Generate receipt PDF content as base64 using pdf-lib
 * Creates a proper PDF document that can be opened by any PDF reader
 * SIMPLIFIED VERSION for Cloudflare Workers compatibility
 */
async function generateReceiptPdfBase64(receiptData: {
  paymentId: string;
  orderId: string;
  amount: number;
  planName: string;
  billingCycle: string;
  subscriptionEndDate: string;
  userName: string;
  userEmail: string;
  paymentMethod: string;
  paymentDate: string;
}): Promise<string> {
  const { paymentId, orderId, amount, planName, billingCycle, subscriptionEndDate, userName, userEmail, paymentMethod, paymentDate } = receiptData;
  
  console.log(`[PDF-GEN] ========== STARTING PDF GENERATION ==========`);
  console.log(`[PDF-GEN] Payment ID: ${paymentId}`);
  
  const formatAmount = (a: number) => `Rs. ${a.toLocaleString('en-IN')}`;

  try {
    // Create a new PDF document
    console.log(`[PDF-GEN] Step 1: Creating PDF document...`);
    const pdfDoc = await PDFDocument.create();
    console.log(`[PDF-GEN] Step 1: Done`);
    
    // Embed font
    console.log(`[PDF-GEN] Step 2: Embedding font...`);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    console.log(`[PDF-GEN] Step 2: Done`);
    
    // Add a page
    console.log(`[PDF-GEN] Step 3: Adding page...`);
    const page = pdfDoc.addPage([595, 842]); // A4
    const { height } = page.getSize();
    console.log(`[PDF-GEN] Step 3: Done`);
    
    // Simple text drawing
    console.log(`[PDF-GEN] Step 4: Drawing text...`);
    let y = height - 50;
    
    // Title
    page.drawText('PAYMENT RECEIPT', { x: 50, y, size: 24, font: boldFont, color: rgb(0.15, 0.39, 0.92) });
    y -= 40;
    
    page.drawText('RareMinds - Skill Passport', { x: 50, y, size: 12, font, color: rgb(0.4, 0.4, 0.4) });
    y -= 50;
    
    // Transaction Details
    page.drawText('Transaction Details', { x: 50, y, size: 14, font: boldFont, color: rgb(0.1, 0.1, 0.1) });
    y -= 25;
    
    page.drawText(`Reference: ${paymentId}`, { x: 50, y, size: 10, font, color: rgb(0.2, 0.2, 0.2) });
    y -= 18;
    page.drawText(`Order ID: ${orderId}`, { x: 50, y, size: 10, font, color: rgb(0.2, 0.2, 0.2) });
    y -= 18;
    page.drawText(`Date: ${paymentDate}`, { x: 50, y, size: 10, font, color: rgb(0.2, 0.2, 0.2) });
    y -= 18;
    page.drawText(`Payment Method: ${paymentMethod}`, { x: 50, y, size: 10, font, color: rgb(0.2, 0.2, 0.2) });
    y -= 18;
    page.drawText(`Status: Success`, { x: 50, y, size: 10, font, color: rgb(0.13, 0.77, 0.37) });
    y -= 40;
    
    // Amount
    page.drawText('Amount Paid', { x: 50, y, size: 14, font: boldFont, color: rgb(0.1, 0.1, 0.1) });
    y -= 25;
    page.drawText(formatAmount(amount), { x: 50, y, size: 20, font: boldFont, color: rgb(0.15, 0.39, 0.92) });
    y -= 50;
    
    // Customer Details
    page.drawText('Customer Details', { x: 50, y, size: 14, font: boldFont, color: rgb(0.1, 0.1, 0.1) });
    y -= 25;
    page.drawText(`Name: ${userName}`, { x: 50, y, size: 10, font, color: rgb(0.2, 0.2, 0.2) });
    y -= 18;
    page.drawText(`Email: ${userEmail}`, { x: 50, y, size: 10, font, color: rgb(0.2, 0.2, 0.2) });
    y -= 40;
    
    // Subscription Details
    page.drawText('Subscription Details', { x: 50, y, size: 14, font: boldFont, color: rgb(0.1, 0.1, 0.1) });
    y -= 25;
    page.drawText(`Plan: ${planName}`, { x: 50, y, size: 10, font, color: rgb(0.2, 0.2, 0.2) });
    y -= 18;
    page.drawText(`Billing Cycle: ${billingCycle}`, { x: 50, y, size: 10, font, color: rgb(0.2, 0.2, 0.2) });
    y -= 18;
    page.drawText(`Valid Until: ${subscriptionEndDate}`, { x: 50, y, size: 10, font, color: rgb(0.2, 0.2, 0.2) });
    y -= 50;
    
    // Footer
    page.drawText('Thank you for your payment!', { x: 50, y, size: 12, font: boldFont, color: rgb(0.15, 0.39, 0.92) });
    y -= 20;
    page.drawText('For support: marketing@rareminds.in', { x: 50, y, size: 9, font, color: rgb(0.5, 0.5, 0.5) });
    y -= 15;
    page.drawText(`Generated: ${new Date().toLocaleString()}`, { x: 50, y, size: 8, font, color: rgb(0.6, 0.6, 0.6) });
    
    console.log(`[PDF-GEN] Step 4: Done`);
    
    // Save PDF
    console.log(`[PDF-GEN] Step 5: Saving PDF...`);
    const pdfBytes = await pdfDoc.save();
    console.log(`[PDF-GEN] Step 5: Done - ${pdfBytes.length} bytes`);
    
    // Convert to base64
    console.log(`[PDF-GEN] Step 6: Converting to base64...`);
    let binary = '';
    for (let i = 0; i < pdfBytes.length; i++) {
      binary += String.fromCharCode(pdfBytes[i]);
    }
    const base64 = btoa(binary);
    console.log(`[PDF-GEN] Step 6: Done - ${base64.length} chars`);
    
    console.log(`[PDF-GEN] ========== PDF GENERATION SUCCESS ==========`);
    return base64;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : 'No stack';
    console.error(`[PDF-GEN] ========== PDF GENERATION FAILED ==========`);
    console.error(`[PDF-GEN] Error: ${errorMsg}`);
    console.error(`[PDF-GEN] Stack: ${errorStack}`);
    throw error;
  }
}

/**
 * Upload receipt to R2 storage via storage-api worker
 * Uses Service Binding if available (required for worker-to-worker communication)
 */
async function uploadReceiptToR2(
  env: Env,
  pdfBase64: string,
  paymentId: string,
  userId: string,
  filename: string,
  userName?: string
): Promise<{ success: boolean; url?: string; fileKey?: string; error?: string }> {
  console.log(`[RECEIPT] ========== RECEIPT UPLOAD START ==========`);
  console.log(`[RECEIPT] Payment ID: ${paymentId}`);
  console.log(`[RECEIPT] User ID: ${userId}`);
  console.log(`[RECEIPT] User Name: ${userName || 'NOT PROVIDED'}`);
  console.log(`[RECEIPT] Filename: ${filename}`);
  console.log(`[RECEIPT] Base64 length: ${pdfBase64.length} chars`);
  console.log(`[RECEIPT] STORAGE_SERVICE binding available: ${!!env.STORAGE_SERVICE}`);
  
  try {
    const requestBody = JSON.stringify({
      pdfBase64,
      paymentId,
      userId,
      userName,
      filename,
    });
    
    console.log(`[RECEIPT] Request body size: ${requestBody.length} bytes`);
    
    let response: Response;
    const startTime = Date.now();
    
    // Use Service Binding if available (required for worker-to-worker communication)
    if (env.STORAGE_SERVICE) {
      console.log(`[RECEIPT] Using Service Binding to storage-api`);
      response = await env.STORAGE_SERVICE.fetch('https://storage-api/upload-payment-receipt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: requestBody,
      });
    } else {
      // Fallback to HTTP fetch (will fail with error 1042 for same-account workers)
      const storageUrl = env.STORAGE_API_URL || STORAGE_API_URL;
      const uploadEndpoint = `${storageUrl}/upload-payment-receipt`;
      console.log(`[RECEIPT] Using HTTP fetch to: ${uploadEndpoint}`);
      console.warn(`[RECEIPT] WARNING: HTTP fetch may fail with error 1042 for same-account workers`);
      
      response = await fetch(uploadEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: requestBody,
      });
    }
    
    const duration = Date.now() - startTime;
    console.log(`[RECEIPT] Response received in ${duration}ms`);
    console.log(`[RECEIPT] Response status: ${response.status} ${response.statusText}`);

    const responseText = await response.text();
    console.log(`[RECEIPT] Response body: ${responseText.substring(0, 500)}`);

    if (!response.ok) {
      console.error(`[RECEIPT] Upload FAILED: ${response.status} - ${responseText}`);
      return { success: false, error: `HTTP ${response.status}: ${responseText}` };
    }

    let result: { success: boolean; url?: string; fileKey?: string };
    try {
      result = JSON.parse(responseText);
    } catch (parseError) {
      console.error(`[RECEIPT] Failed to parse response JSON: ${parseError}`);
      return { success: false, error: `Invalid JSON response: ${responseText.substring(0, 100)}` };
    }
    
    console.log(`[RECEIPT] Parsed result:`, JSON.stringify(result));
    
    if (result.success && result.fileKey) {
      console.log(`[RECEIPT] ========== RECEIPT UPLOAD SUCCESS ==========`);
      console.log(`[RECEIPT] File Key: ${result.fileKey}`);
      console.log(`[RECEIPT] URL: ${result.url}`);
    } else {
      console.warn(`[RECEIPT] Upload returned success=${result.success}, fileKey=${result.fileKey}`);
    }
    
    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : 'No stack trace';
    console.error(`[RECEIPT] ========== RECEIPT UPLOAD ERROR ==========`);
    console.error(`[RECEIPT] Error message: ${errorMessage}`);
    console.error(`[RECEIPT] Error stack: ${errorStack}`);
    return { success: false, error: errorMessage };
  }
}

/**
 * Get receipt download URL from storage-api
 */
function getReceiptDownloadUrl(env: Env, fileKey: string): string {
  const storageUrl = env.STORAGE_API_URL || STORAGE_API_URL;
  return `${storageUrl}/payment-receipt?key=${encodeURIComponent(fileKey)}&mode=download`;
}


// ==================== CREATE ORDER ====================

async function handleCreateOrder(request: Request, env: Env): Promise<Response> {
  const auth = await authenticateUser(request, env);
  if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401);

  const { user, supabase } = auth;
  
  // Get credentials based on request origin (production vs development)
  const { keyId, keySecret, isProduction } = getRazorpayCredentialsForRequest(request, env);
  console.log(`[CREATE-ORDER] Environment: ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'}`);

  const body = await request.json() as {
    amount?: number;
    currency?: string;
    planId?: string;
    planName?: string;
    userEmail?: string;
    userName?: string;
  };

  const { amount, currency, planId, planName, userEmail, userName } = body;

  // Validate required fields
  if (!amount || !currency || !userEmail || !planId || !planName) {
    return jsonResponse({ error: 'Missing required fields: amount, currency, userEmail, planId, planName' }, 400);
  }

  // Validate amount
  if (amount <= 0 || amount > MAX_AMOUNT) {
    return jsonResponse({ error: 'Invalid amount' }, 400);
  }

  // Allow valid plan amounts or any amount for custom plans
  // VALID_AMOUNTS check is optional for flexibility
  // if (!VALID_AMOUNTS.includes(amount)) {
  //   return jsonResponse({ error: 'Invalid plan amount' }, 400);
  // }

  if (currency !== 'INR') {
    return jsonResponse({ error: 'Only INR currency is supported' }, 400);
  }

  // ==================== LAYER 2: CHECK EXISTING SUBSCRIPTION ====================
  // CRITICAL: Check for active or cancelled (but not expired) subscription BEFORE creating order
  // This prevents users from paying when they already have valid subscription access
  const supabaseUrl = getSupabaseUrl(env);
  const supabaseAdmin = createClient(supabaseUrl, env.SUPABASE_SERVICE_ROLE_KEY);
  
  // Check for active subscriptions
  const { data: existingSubscription, error: subCheckError } = await supabaseAdmin
    .from('subscriptions')
    .select('id, plan_type, status, subscription_end_date')
    .eq('user_id', user.id)
    .in('status', ['active', 'cancelled'])
    .gte('subscription_end_date', new Date().toISOString())
    .maybeSingle();

  if (existingSubscription) {
    // User already has a valid subscription (active or cancelled but not expired)
    const message = existingSubscription.status === 'cancelled'
      ? `You have a cancelled subscription that is still active until ${new Date(existingSubscription.subscription_end_date).toLocaleDateString()}`
      : 'You already have an active subscription';
    
    console.log(`[CREATE-ORDER] Blocked: User ${user.id} already has ${existingSubscription.status} ${existingSubscription.plan_type} subscription`);
    
    return jsonResponse({
      error: message,
      code: 'SUBSCRIPTION_EXISTS',
      existing_subscription: {
        id: existingSubscription.id,
        plan_type: existingSubscription.plan_type,
        status: existingSubscription.status,
        end_date: existingSubscription.subscription_end_date,
      },
      suggestion: existingSubscription.status === 'cancelled'
        ? 'Your subscription access continues until the end date. You can purchase a new plan after it expires.'
        : 'Please manage your existing subscription from your account settings, or wait for it to expire before purchasing a new plan.'
    }, 409); // 409 Conflict
  }

  // Rate limiting check
  const oneMinuteAgo = new Date(Date.now() - 60000).toISOString();
  const { count } = await supabase
    .from('razorpay_orders')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gte('created_at', oneMinuteAgo);

  if (count && count >= 5) {
    return jsonResponse({ error: 'Too many order attempts. Please wait a minute.' }, 429);
  }

  // Create Razorpay order
  const receipt = `rcpt_${Date.now()}_${user.id.substring(0, 8)}`;
  const razorpayAuth = btoa(`${keyId}:${keySecret}`);

  const razorpayResponse = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${razorpayAuth}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount,
      currency,
      receipt,
      notes: {
        user_id: user.id,
        plan_id: planId,
        plan_name: planName,
        user_email: userEmail,
        user_name: userName,
      },
    }),
  });

  if (!razorpayResponse.ok) {
    const errorText = await razorpayResponse.text();
    console.error('Razorpay API Error:', razorpayResponse.status, errorText);
    return jsonResponse({ 
      error: 'Unable to create payment order',
      razorpay_status: razorpayResponse.status,
      razorpay_error: errorText
    }, 500);
  }

  const order = await razorpayResponse.json() as any;

  // Save order to database
  const { error: dbError } = await supabase.from('razorpay_orders').insert({
    user_id: user.id,
    order_id: order.id,
    amount: order.amount,
    currency: order.currency,
    receipt: order.receipt,
    status: 'created',
    plan_id: planId,
    plan_name: planName,
    user_email: userEmail,
    user_name: userName,
    created_at: new Date().toISOString(),
  });

  if (dbError) {
    console.error('Failed to save order:', dbError);
    return jsonResponse({ error: 'Order created but failed to save' }, 500);
  }

  return jsonResponse({
    success: true,
    id: order.id,
    amount: order.amount,
    currency: order.currency,
    receipt: order.receipt,
  });
}

// ==================== CREATE ORGANIZATION ORDER ====================

async function handleCreateOrgOrder(request: Request, env: Env, user: any): Promise<Response> {
  const supabaseUrl = getSupabaseUrl(env);
  const supabaseAdmin = createClient(supabaseUrl, env.SUPABASE_SERVICE_ROLE_KEY);
  
  // Get credentials based on request origin
  const { keyId, keySecret, isProduction } = getRazorpayCredentialsForRequest(request, env);
  console.log(`[CREATE-ORG-ORDER] Environment: ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'}`);

  const body = await request.json() as {
    amount?: number;
    currency?: string;
    organizationId?: string;
    organizationType?: string;
    planId?: string;
    planName?: string;
    seatCount?: number;
    targetMemberType?: string;
    billingCycle?: string;
    billingEmail?: string;
    billingName?: string;
  };

  const { amount, currency = 'INR', organizationId, organizationType, planId, planName, seatCount, targetMemberType, billingCycle, billingEmail, billingName } = body;

  // Validate required fields
  if (!amount || !organizationId || !organizationType || !planId || !planName || !seatCount || !billingEmail) {
    return jsonResponse({ error: 'Missing required fields' }, 400);
  }

  // Validate amount
  if (amount < 100 || amount > 100000000) { // 1 rupee to 10 lakh rupees in paise
    return jsonResponse({ error: 'Invalid amount' }, 400);
  }

  // Rate limiting check
  const oneMinuteAgo = new Date(Date.now() - 60000).toISOString();
  const { count } = await supabaseAdmin
    .from('razorpay_orders')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gte('created_at', oneMinuteAgo);

  if (count && count >= 5) {
    return jsonResponse({ error: 'Too many order attempts. Please wait a minute.' }, 429);
  }

  // Create Razorpay order
  const receipt = `org_${Date.now()}_${organizationId.substring(0, 8)}`;
  const razorpayAuth = btoa(`${keyId}:${keySecret}`);

  const razorpayResponse = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${razorpayAuth}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount,
      currency,
      receipt,
      notes: {
        user_id: user.id,
        organization_id: organizationId,
        organization_type: organizationType,
        plan_id: planId,
        plan_name: planName,
        seat_count: seatCount.toString(),
        target_member_type: targetMemberType,
        billing_cycle: billingCycle,
        billing_email: billingEmail,
        billing_name: billingName,
        order_type: 'organization_subscription',
      },
    }),
  });

  if (!razorpayResponse.ok) {
    const errorText = await razorpayResponse.text();
    console.error('[CREATE-ORG-ORDER] Razorpay API Error:', razorpayResponse.status, errorText);
    return jsonResponse({ 
      error: 'Unable to create payment order',
      razorpay_status: razorpayResponse.status,
      razorpay_error: errorText
    }, 500);
  }

  const order = await razorpayResponse.json() as any;

  // Save order to database
  const { error: dbError } = await supabaseAdmin.from('razorpay_orders').insert({
    user_id: user.id,
    order_id: order.id,
    amount: order.amount,
    currency: order.currency,
    receipt: order.receipt,
    status: 'created',
    plan_id: planId,
    plan_name: planName,
    user_email: billingEmail,
    user_name: billingName,
    created_at: new Date().toISOString(),
    // Store organization details in notes or a separate field
  });

  if (dbError) {
    console.error('[CREATE-ORG-ORDER] Failed to save order:', dbError);
    return jsonResponse({ error: 'Order created but failed to save' }, 500);
  }

  console.log(`[CREATE-ORG-ORDER] Order created: ${order.id} for org ${organizationId}`);

  return jsonResponse({
    success: true,
    id: order.id,
    amount: order.amount,
    currency: order.currency,
    receipt: order.receipt,
  });
}

// ==================== VERIFY ORGANIZATION PAYMENT ====================

async function handleVerifyOrgPayment(request: Request, env: Env, supabase: SupabaseClient, user: any): Promise<Response> {
  const supabaseUrl = getSupabaseUrl(env);
  const supabaseAdmin = createClient(supabaseUrl, env.SUPABASE_SERVICE_ROLE_KEY);
  
  // Get credentials based on request origin
  const { keyId, keySecret, isProduction } = getRazorpayCredentialsForRequest(request, env);
  console.log(`[VERIFY-ORG-PAYMENT] Environment: ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'}`);

  const body = await request.json() as {
    razorpay_order_id?: string;
    razorpay_payment_id?: string;
    razorpay_signature?: string;
    purchaseData?: {
      organizationId: string;
      organizationType: 'school' | 'college' | 'university';
      planId: string;
      planName: string;
      seatCount: number;
      targetMemberType: 'educator' | 'student' | 'both';
      billingCycle: 'monthly' | 'annual';
      autoRenew: boolean;
      pricing: {
        basePrice: number;
        subtotal: number;
        discountPercentage: number;
        discountAmount: number;
        taxAmount: number;
        finalAmount: number;
      };
      assignmentMode: string;
      selectedMemberIds: string[];
      poolName?: string;
      autoAssignNewMembers: boolean;
      billingEmail: string;
      billingName: string;
      gstNumber?: string;
    };
  };

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, purchaseData } = body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !purchaseData) {
    return jsonResponse({ error: 'Missing required fields' }, 400);
  }

  // Verify signature
  const isValid = await verifySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature, keySecret);
  if (!isValid) {
    console.error('[VERIFY-ORG-PAYMENT] Invalid signature');
    return jsonResponse({ error: 'Invalid payment signature' }, 400);
  }

  // Get order from database
  const { data: order, error: orderError } = await supabaseAdmin
    .from('razorpay_orders')
    .select('*')
    .eq('order_id', razorpay_order_id)
    .single();

  if (orderError || !order) {
    console.error('[VERIFY-ORG-PAYMENT] Order not found:', orderError);
    return jsonResponse({ error: 'Order not found' }, 404);
  }

  // Verify payment with Razorpay
  const razorpayAuth = btoa(`${keyId}:${keySecret}`);
  const paymentResponse = await fetch(`https://api.razorpay.com/v1/payments/${razorpay_payment_id}`, {
    headers: { 'Authorization': `Basic ${razorpayAuth}` },
  });

  if (!paymentResponse.ok) {
    console.error('[VERIFY-ORG-PAYMENT] Failed to verify payment with Razorpay');
    return jsonResponse({ error: 'Failed to verify payment' }, 500);
  }

  const paymentDetails = await paymentResponse.json() as any;
  
  if (paymentDetails.status !== 'captured' && paymentDetails.status !== 'authorized') {
    console.error('[VERIFY-ORG-PAYMENT] Payment not completed:', paymentDetails.status);
    return jsonResponse({ error: 'Payment not completed' }, 400);
  }

  // Update order status
  await supabaseAdmin
    .from('razorpay_orders')
    .update({ status: 'paid', updated_at: new Date().toISOString() })
    .eq('order_id', razorpay_order_id);

  // Look up the subscription plan UUID from plan_code
  // The frontend passes plan codes like 'basic', 'professional', 'enterprise'
  // but the database expects a UUID
  let subscriptionPlanId = purchaseData.planId;
  
  // Check if planId is not a UUID (i.e., it's a plan code)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(purchaseData.planId)) {
    console.log(`[VERIFY-ORG-PAYMENT] Looking up plan UUID for code: ${purchaseData.planId}`);
    const { data: planData, error: planError } = await supabaseAdmin
      .from('subscription_plans')
      .select('id')
      .eq('plan_code', purchaseData.planId)
      .eq('is_active', true)
      .single();
    
    if (planError || !planData) {
      console.error('[VERIFY-ORG-PAYMENT] Plan not found:', planError);
      return jsonResponse({ error: `Subscription plan '${purchaseData.planId}' not found` }, 400);
    }
    
    subscriptionPlanId = planData.id;
    console.log(`[VERIFY-ORG-PAYMENT] Found plan UUID: ${subscriptionPlanId}`);
  }

  // Calculate subscription dates
  const startDate = new Date();
  const endDate = new Date(startDate);
  if (purchaseData.billingCycle === 'annual') {
    endDate.setFullYear(endDate.getFullYear() + 1);
  } else {
    endDate.setMonth(endDate.getMonth() + 1);
  }

  // Create organization subscription
  const { data: subscription, error: subError } = await supabaseAdmin
    .from('organization_subscriptions')
    .insert({
      organization_id: purchaseData.organizationId,
      organization_type: purchaseData.organizationType,
      subscription_plan_id: subscriptionPlanId,
      purchased_by: user.id,
      total_seats: purchaseData.seatCount,
      assigned_seats: 0,
      target_member_type: purchaseData.targetMemberType,
      status: 'active',
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
      auto_renew: purchaseData.autoRenew,
      price_per_seat: purchaseData.pricing.basePrice,
      total_amount: purchaseData.pricing.subtotal,
      discount_percentage: purchaseData.pricing.discountPercentage,
      final_amount: purchaseData.pricing.finalAmount,
      razorpay_order_id: razorpay_order_id,
      razorpay_payment_id: razorpay_payment_id,
    })
    .select()
    .single();

  if (subError) {
    console.error('[VERIFY-ORG-PAYMENT] Error creating subscription:', subError);
    return jsonResponse({ error: 'Failed to create subscription' }, 500);
  }

  // Create license pool if needed
  if (purchaseData.assignmentMode === 'create-pool' && purchaseData.poolName) {
    const { error: poolError } = await supabaseAdmin
      .from('license_pools')
      .insert({
        organization_id: purchaseData.organizationId,
        organization_type: purchaseData.organizationType,
        organization_subscription_id: subscription.id,
        pool_name: purchaseData.poolName,
        member_type: purchaseData.targetMemberType === 'both' ? 'student' : purchaseData.targetMemberType,
        allocated_seats: purchaseData.seatCount,
        assigned_seats: 0,
        auto_assign_new_members: purchaseData.autoAssignNewMembers,
        is_active: true,
        created_by: user.id,
      });

    if (poolError) {
      console.error('[VERIFY-ORG-PAYMENT] Error creating license pool:', poolError);
      // Don't fail the whole transaction, just log the error
    }
  }

  // Log the transaction
  await supabaseAdmin
    .from('payment_transactions')
    .insert({
      user_id: user.id,
      razorpay_order_id: razorpay_order_id,
      razorpay_payment_id: razorpay_payment_id,
      amount: order.amount,
      currency: order.currency,
      status: 'success',
      payment_method: paymentDetails.method || 'unknown',
      transaction_type: 'organization_subscription',
      metadata: {
        organization_id: purchaseData.organizationId,
        organization_type: purchaseData.organizationType,
        seat_count: purchaseData.seatCount,
        subscription_id: subscription.id,
      },
    });

  console.log(`[VERIFY-ORG-PAYMENT] Subscription created: ${subscription.id} for org ${purchaseData.organizationId}`);

  return jsonResponse({
    success: true,
    subscription,
    message: 'Organization subscription created successfully',
  });
}

// ==================== VERIFY PAYMENT ====================

// Helper to calculate subscription end date
function calculateSubscriptionEndDate(billingCycle: string): string {
  const now = new Date();
  if (billingCycle.toLowerCase().includes('year')) {
    now.setFullYear(now.getFullYear() + 1);
  } else {
    // Default to 1 month
    now.setMonth(now.getMonth() + 1);
  }
  return now.toISOString();
}

async function handleVerifyPayment(request: Request, env: Env): Promise<Response> {
  const supabaseUrl = getSupabaseUrl(env);
  const supabaseAdmin = createClient(supabaseUrl, env.SUPABASE_SERVICE_ROLE_KEY);
  
  // Get credentials based on request origin (production vs development)
  const { keyId, keySecret, isProduction } = getRazorpayCredentialsForRequest(request, env);
  console.log(`[VERIFY-PAYMENT] Environment: ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'}`);

  const body = await request.json() as {
    razorpay_order_id?: string;
    razorpay_payment_id?: string;
    razorpay_signature?: string;
    // Optional: plan details for subscription creation
    plan?: {
      id?: string;      // plan_id from subscription_plans table
      name?: string;
      price?: number;
      duration?: string;
    };
  };

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan } = body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return jsonResponse({ error: 'Missing required fields' }, 400);
  }

  // Check idempotency - if subscription already exists for this payment
  const { data: existingSubscription } = await supabaseAdmin
    .from('subscriptions')
    .select('*')
    .eq('razorpay_payment_id', razorpay_payment_id)
    .maybeSingle();

  if (existingSubscription) {
    // Fetch transaction details for complete response
    const { data: transaction } = await supabaseAdmin
      .from('payment_transactions')
      .select('payment_method, amount')
      .eq('razorpay_payment_id', razorpay_payment_id)
      .maybeSingle();

    return jsonResponse({
      success: true,
      verified: true,
      message: 'Payment already verified and subscription exists',
      payment_id: razorpay_payment_id,
      order_id: razorpay_order_id,
      user_id: existingSubscription.user_id,
      user_name: existingSubscription.full_name,
      user_email: existingSubscription.email,
      payment_method: transaction?.payment_method || 'Card',
      amount: (transaction?.amount || existingSubscription.plan_amount || 0) * 100, // Convert to paise for consistency
      subscription: existingSubscription,
      already_processed: true,
    });
  }

  // Verify order exists
  const { data: order, error: orderError } = await supabaseAdmin
    .from('razorpay_orders')
    .select('*')
    .eq('order_id', razorpay_order_id)
    .maybeSingle();

  if (orderError || !order) {
    return jsonResponse({ error: 'Order not found' }, 404);
  }

  // Verify signature
  const isValid = await verifySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature, keySecret);
  if (!isValid) {
    return jsonResponse({ error: 'Invalid payment signature' }, 400);
  }

  // Fetch payment details from Razorpay
  let paymentMethod = 'unknown';
  let paymentAmount = order.amount;

  try {
    const razorpayAuth = btoa(`${keyId}:${keySecret}`);
    const paymentResponse = await fetch(`https://api.razorpay.com/v1/payments/${razorpay_payment_id}`, {
      headers: { 'Authorization': `Basic ${razorpayAuth}` },
    });

    if (paymentResponse.ok) {
      const paymentDetails = await paymentResponse.json() as any;
      paymentMethod = paymentDetails.method || 'unknown';
      paymentAmount = paymentDetails.amount || order.amount;

      if (paymentAmount !== order.amount) {
        return jsonResponse({ error: 'Payment amount mismatch' }, 400);
      }

      if (paymentDetails.status !== 'captured' && paymentDetails.status !== 'authorized') {
        return jsonResponse({ error: 'Payment not completed' }, 400);
      }
    }
  } catch (err) {
    console.error('Error fetching payment details:', err);
  }

  // Update order status
  await supabaseAdmin
    .from('razorpay_orders')
    .update({ status: 'paid', updated_at: new Date().toISOString() })
    .eq('order_id', razorpay_order_id);

  // Get user details for subscription
  const { data: userData } = await supabaseAdmin
    .from('users')
    .select('firstName, lastName, email, phone')
    .eq('id', order.user_id)
    .maybeSingle();

  const fullName = userData 
    ? `${userData.firstName || ''} ${userData.lastName || ''}`.trim() 
    : order.user_name || 'User';
  const userEmail = userData?.email || order.user_email || '';
  const userPhone = userData?.phone || null;

  // Determine billing cycle from plan or order notes
  // Fix: Use proper parentheses to avoid operator precedence issues
  let billingCycle = 'month'; // Default to month
  if (plan?.duration) {
    billingCycle = plan.duration;
  } else if (order.plan_name?.toLowerCase().includes('year')) {
    billingCycle = 'year';
  }
  const planAmount = (plan?.price || paymentAmount / 100); // Convert paise to rupees if needed
  const planType = plan?.name || order.plan_name || 'Standard Plan';

  // Check if user already has an active subscription of the same plan type
  // This handles edge cases: page refresh, webhook race condition, or renewal
  const { data: existingActiveSubscription } = await supabaseAdmin
    .from('subscriptions')
    .select('*')
    .eq('user_id', order.user_id)
    .eq('status', 'active')
    .maybeSingle();

  if (existingActiveSubscription) {
    // User already has active subscription
    // Check if this is the same plan type - if so, treat as renewal/extension
    const isSamePlan = existingActiveSubscription.plan_type?.toLowerCase() === planType?.toLowerCase();
    const renewalTimestamp = new Date().toISOString();
    
    if (isSamePlan) {
      // Same plan - extend the subscription end date and update payment info
      const currentEndDate = new Date(existingActiveSubscription.subscription_end_date);
      const extensionDate = new Date(Math.max(currentEndDate.getTime(), Date.now()));
      
      // Add billing cycle duration to the later of current end date or now
      if (billingCycle.toLowerCase().includes('year')) {
        extensionDate.setFullYear(extensionDate.getFullYear() + 1);
      } else {
        extensionDate.setMonth(extensionDate.getMonth() + 1);
      }

      const { data: updatedSubscription, error: updateError } = await supabaseAdmin
        .from('subscriptions')
        .update({
          razorpay_payment_id: razorpay_payment_id,
          razorpay_order_id: razorpay_order_id,
          subscription_end_date: extensionDate.toISOString(),
          updated_at: renewalTimestamp,
        })
        .eq('id', existingActiveSubscription.id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating subscription for renewal:', updateError);
      }

      // Log the renewal transaction
      await supabaseAdmin
        .from('payment_transactions')
        .insert([{
          subscription_id: existingActiveSubscription.id,
          user_id: order.user_id,
          razorpay_payment_id: razorpay_payment_id,
          razorpay_order_id: razorpay_order_id,
          amount: planAmount,
          currency: 'INR',
          status: 'success',
          payment_method: paymentMethod,
          created_at: renewalTimestamp,
        }]);

      // UPDATE razorpay_orders with renewal payment result
      await supabaseAdmin
        .from('razorpay_orders')
        .update({
          razorpay_payment_id: razorpay_payment_id,
          payment_method: paymentMethod,
          subscription_id: existingActiveSubscription.id,
          updated_at: renewalTimestamp,
        })
        .eq('order_id', razorpay_order_id);

      console.log(`[VERIFY-PAYMENT] Renewed subscription for user ${order.user_id}, extended to ${extensionDate.toISOString()}`);

      return jsonResponse({
        success: true,
        verified: true,
        message: 'Subscription renewed successfully! Your subscription has been extended.',
        payment_id: razorpay_payment_id,
        order_id: razorpay_order_id,
        user_id: existingActiveSubscription.user_id,
        user_name: existingActiveSubscription.full_name,
        user_email: existingActiveSubscription.email,
        payment_method: paymentMethod,
        amount: paymentAmount,
        subscription: updatedSubscription || existingActiveSubscription,
        is_renewal: true,
        new_end_date: extensionDate.toISOString(),
      });
    } else {
      // Different plan type - user is trying to subscribe to a different plan
      // Return existing subscription info without creating duplicate
      console.log(`[VERIFY-PAYMENT] User ${order.user_id} has active ${existingActiveSubscription.plan_type}, tried to get ${planType}`);
      
      return jsonResponse({
        success: true,
        verified: true,
        message: `You already have an active ${existingActiveSubscription.plan_type} subscription. Payment was processed but no new subscription created.`,
        payment_id: razorpay_payment_id,
        order_id: razorpay_order_id,
        user_id: existingActiveSubscription.user_id,
        user_name: existingActiveSubscription.full_name,
        user_email: existingActiveSubscription.email,
        payment_method: paymentMethod,
        amount: paymentAmount,
        subscription: existingActiveSubscription,
        already_processed: true,
        is_existing_subscription: true,
        note: 'Contact support if you need to change your plan.',
      });
    }
  }

  // LOOKUP plan_id from subscription_plans table
  // First try to use plan.id if provided (this is plan_code from frontend), otherwise lookup by plan name
  let planId: string | null = null;
  const planCode = plan?.id; // Frontend sends plan_code as 'id' (e.g., 'basic', 'professional')
  
  if (planCode) {
    // Map frontend plan codes to database plan_codes
    // Frontend uses 'professional', database uses 'pro'
    const dbPlanCode = planCode === 'professional' ? 'pro' : planCode;
    
    // Lookup plan_id from subscription_plans by plan_code
    const { data: planRecord } = await supabaseAdmin
      .from('subscription_plans')
      .select('id')
      .eq('plan_code', dbPlanCode)
      .eq('role_type', 'student')
      .eq('business_type', 'b2c')
      .maybeSingle();
    
    if (planRecord) {
      planId = planRecord.id;
      console.log(`[VERIFY-PAYMENT] Resolved plan_id ${planId} from plan_code "${dbPlanCode}"`);
    } else {
      console.warn(`[VERIFY-PAYMENT] Could not resolve plan_id for plan_code "${dbPlanCode}"`);
    }
  }
  
  // Fallback: lookup by plan name if plan_code lookup failed
  if (!planId && planType) {
    const { data: planRecord } = await supabaseAdmin
      .from('subscription_plans')
      .select('id')
      .ilike('name', planType)
      .eq('role_type', 'student')
      .eq('business_type', 'b2c')
      .maybeSingle();
    
    if (planRecord) {
      planId = planRecord.id;
      console.log(`[VERIFY-PAYMENT] Resolved plan_id ${planId} from plan_type "${planType}" (fallback)`);
    } else {
      console.warn(`[VERIFY-PAYMENT] Could not resolve plan_id for plan_type "${planType}"`);
    }
  }

  // CREATE SUBSCRIPTION RECORD
  const now = new Date().toISOString();
  const subscriptionData = {
    user_id: order.user_id,
    full_name: fullName,
    email: userEmail,
    phone: userPhone,
    plan_id: planId,  // NEW: Foreign key to subscription_plans
    plan_type: planType,
    plan_amount: planAmount,
    billing_cycle: billingCycle,
    razorpay_payment_id: razorpay_payment_id,
    razorpay_order_id: razorpay_order_id,
    status: 'active' as const,
    subscription_start_date: now,
    subscription_end_date: calculateSubscriptionEndDate(billingCycle),
    auto_renew: false,
    created_at: now,
    updated_at: now,
  };

  const { data: subscription, error: subError } = await supabaseAdmin
    .from('subscriptions')
    .insert([subscriptionData])
    .select()
    .single();

  if (subError) {
    console.error('Error creating subscription:', subError);
    // Don't fail the verification, but log the error
    return jsonResponse({
      success: true,
      verified: true,
      message: 'Payment verified but subscription creation failed',
      payment_id: razorpay_payment_id,
      order_id: razorpay_order_id,
      user_id: order.user_id,
      user_name: fullName,
      user_email: userEmail,
      payment_method: paymentMethod,
      amount: paymentAmount,
      subscription_error: subError.message,
    });
  }

  // LOG PAYMENT TRANSACTION (to payment_transactions for backward compatibility)
  const transactionData = {
    subscription_id: subscription.id,
    user_id: order.user_id,
    razorpay_payment_id: razorpay_payment_id,
    razorpay_order_id: razorpay_order_id,
    amount: planAmount,
    currency: 'INR',
    status: 'success',
    payment_method: paymentMethod,
    created_at: now,
  };

  const { error: txnError } = await supabaseAdmin
    .from('payment_transactions')
    .insert([transactionData]);

  // UPDATE razorpay_orders with payment result (NEW: Single source of truth)
  await supabaseAdmin
    .from('razorpay_orders')
    .update({
      razorpay_payment_id: razorpay_payment_id,
      payment_method: paymentMethod,
      subscription_id: subscription.id,
      updated_at: now,
    })
    .eq('order_id', razorpay_order_id);

  if (txnError) {
    console.error('Error logging transaction:', txnError);
    // Don't fail, subscription is already created
  }

  // Generate and upload receipt PDF to R2
  let receiptUrl: string | undefined;
  let receiptUploadError: string | undefined;
  console.log(`[VERIFY-PAYMENT] ========== STARTING RECEIPT GENERATION ==========`);
  console.log(`[VERIFY-PAYMENT] Subscription ID: ${subscription.id}`);
  console.log(`[VERIFY-PAYMENT] Payment ID: ${razorpay_payment_id}`);
  console.log(`[VERIFY-PAYMENT] User ID: ${order.user_id}`);
  
  try {
    const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    
    console.log(`[VERIFY-PAYMENT] Generating receipt PDF base64...`);
    const receiptPdfBase64 = await generateReceiptPdfBase64({
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
      amount: planAmount,
      planName: planType,
      billingCycle: billingCycle,
      subscriptionEndDate: formatDate(subscription.subscription_end_date),
      userName: fullName,
      userEmail: userEmail,
      paymentMethod: paymentMethod,
      paymentDate: formatDate(now),
    });
    console.log(`[VERIFY-PAYMENT] Receipt PDF base64 generated, length: ${receiptPdfBase64.length}`);
    
    const filename = `Receipt-${razorpay_payment_id.slice(-8)}-${new Date().toISOString().split('T')[0]}.pdf`;
    console.log(`[VERIFY-PAYMENT] Calling uploadReceiptToR2 with filename: ${filename}`);
    
    const uploadResult = await uploadReceiptToR2(env, receiptPdfBase64, razorpay_payment_id, order.user_id, filename, fullName);
    console.log(`[VERIFY-PAYMENT] Upload result:`, JSON.stringify(uploadResult));
    
    if (uploadResult.success && uploadResult.fileKey) {
      receiptUrl = getReceiptDownloadUrl(env, uploadResult.fileKey);
      console.log(`[VERIFY-PAYMENT] Receipt URL generated: ${receiptUrl}`);
      
      // Store receipt URL in subscription record
      console.log(`[VERIFY-PAYMENT] Updating subscription ${subscription.id} with receipt_url...`);
      const { error: updateError } = await supabaseAdmin
        .from('subscriptions')
        .update({ receipt_url: receiptUrl })
        .eq('id', subscription.id);
      
      if (updateError) {
        console.error(`[VERIFY-PAYMENT] Failed to update subscription with receipt_url:`, updateError);
        receiptUploadError = `DB update failed: ${updateError.message}`;
      } else {
        console.log(`[VERIFY-PAYMENT] ========== RECEIPT SAVED SUCCESSFULLY ==========`);
      }
    } else {
      console.warn(`[VERIFY-PAYMENT] Receipt upload failed or missing fileKey`);
      console.warn(`[VERIFY-PAYMENT] uploadResult.success: ${uploadResult.success}`);
      console.warn(`[VERIFY-PAYMENT] uploadResult.fileKey: ${uploadResult.fileKey}`);
      console.warn(`[VERIFY-PAYMENT] uploadResult.error: ${uploadResult.error}`);
      receiptUploadError = uploadResult.error || 'Upload returned success=false or missing fileKey';
    }
  } catch (receiptError) {
    const errorMsg = receiptError instanceof Error ? receiptError.message : String(receiptError);
    const errorStack = receiptError instanceof Error ? receiptError.stack : 'No stack';
    console.error(`[VERIFY-PAYMENT] ========== RECEIPT GENERATION/UPLOAD FAILED ==========`);
    console.error(`[VERIFY-PAYMENT] Error: ${errorMsg}`);
    console.error(`[VERIFY-PAYMENT] Stack: ${errorStack}`);
    receiptUploadError = errorMsg;
    // Don't fail the payment verification if receipt upload fails
  }

  // Send payment confirmation email with receipt link
  console.log(`Attempting to send confirmation email to: ${userEmail}`);
  console.log(`[VERIFY-PAYMENT] receiptUrl for email: ${receiptUrl || 'NOT SET'}`);
  const emailSent = await sendPaymentConfirmationEmail(env, userEmail, fullName, {
    paymentId: razorpay_payment_id,
    orderId: razorpay_order_id,
    amount: planAmount,
    planName: planType,
    billingCycle: billingCycle,
    subscriptionEndDate: subscription.subscription_end_date,
    receiptUrl: receiptUrl,
  });

  if (!emailSent) {
    console.warn(`Failed to send confirmation email to ${userEmail} for payment ${razorpay_payment_id}`);
  } else {
    console.log(`Confirmation email sent successfully to ${userEmail}`);
  }

  return jsonResponse({
    success: true,
    verified: true,
    message: 'Payment verified and subscription activated',
    payment_id: razorpay_payment_id,
    order_id: razorpay_order_id,
    user_id: order.user_id,
    user_name: fullName,
    user_email: userEmail,
    payment_method: paymentMethod,
    amount: paymentAmount,
    subscription: subscription,
    email_sent: emailSent,
    receipt_url: receiptUrl,
    receipt_upload_error: receiptUploadError,
  });
}


// ==================== WEBHOOK ====================

async function handleWebhook(request: Request, env: Env): Promise<Response> {
  const signature = request.headers.get('x-razorpay-signature');
  if (!signature) {
    return jsonResponse({ error: 'Missing signature' }, 400);
  }

  const rawBody = await request.text();
  
  // Only verify signature if webhook secret is configured
  if (env.RAZORPAY_WEBHOOK_SECRET) {
    const isValid = await verifyWebhookSignature(rawBody, signature, env.RAZORPAY_WEBHOOK_SECRET);
    if (!isValid) {
      return jsonResponse({ error: 'Invalid signature' }, 400);
    }
  }

  const webhookData = JSON.parse(rawBody);
  const event = webhookData.event;
  const payload = webhookData.payload;

  const supabaseUrl = getSupabaseUrl(env);
  const supabaseAdmin = createClient(supabaseUrl, env.SUPABASE_SERVICE_ROLE_KEY);

  switch (event) {
    case 'payment.captured':
      await supabaseAdmin
        .from('payment_transactions')
        .update({ status: 'success', updated_at: new Date().toISOString() })
        .eq('razorpay_payment_id', payload.payment.entity.id);
      break;

    case 'payment.failed':
      await supabaseAdmin
        .from('payment_transactions')
        .update({ status: 'failed', updated_at: new Date().toISOString() })
        .eq('razorpay_payment_id', payload.payment.entity.id);
      break;

    case 'subscription.cancelled':
      await supabaseAdmin
        .from('subscriptions')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('razorpay_subscription_id', payload.subscription.entity.id);
      break;

    case 'subscription.paused':
      await supabaseAdmin
        .from('subscriptions')
        .update({
          status: 'paused',
          paused_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('razorpay_subscription_id', payload.subscription.entity.id);
      break;

    case 'subscription.resumed':
      await supabaseAdmin
        .from('subscriptions')
        .update({
          status: 'active',
          paused_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq('razorpay_subscription_id', payload.subscription.entity.id);
      break;

    case 'subscription.charged':
      const payment = payload.payment.entity;
      await supabaseAdmin.from('payment_transactions').insert({
        razorpay_payment_id: payment.id,
        razorpay_order_id: payment.order_id,
        amount: payment.amount / 100,
        currency: payment.currency,
        status: 'success',
        payment_method: payment.method,
        created_at: new Date().toISOString(),
      });
      break;
  }

  return jsonResponse({ success: true, event });
}

// ==================== CANCEL SUBSCRIPTION ====================

async function handleCancelSubscription(request: Request, env: Env): Promise<Response> {
  const auth = await authenticateUser(request, env);
  if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401);

  const { user, supabase } = auth;
  const { keyId, keySecret } = getRazorpayCredentials(env);

  const body = await request.json() as { subscription_id?: string; cancel_at_cycle_end?: boolean };
  const { subscription_id, cancel_at_cycle_end = false } = body;

  if (!subscription_id) {
    return jsonResponse({ error: 'Missing subscription_id' }, 400);
  }

  const razorpayAuth = btoa(`${keyId}:${keySecret}`);
  const razorpayResponse = await fetch(
    `https://api.razorpay.com/v1/subscriptions/${subscription_id}/cancel`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${razorpayAuth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ cancel_at_cycle_end }),
    }
  );

  if (!razorpayResponse.ok) {
    if (razorpayResponse.status === 404) {
      return jsonResponse({
        success: true,
        message: 'Subscription already cancelled or not found',
        subscription_id,
        status: 'cancelled',
      });
    }
    return jsonResponse({ error: 'Failed to cancel subscription' }, 500);
  }

  const cancelledSubscription = await razorpayResponse.json() as any;

  await supabase
    .from('subscriptions')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      auto_renew: false,
      updated_at: new Date().toISOString(),
    })
    .eq('razorpay_subscription_id', subscription_id)
    .eq('user_id', user.id);

  return jsonResponse({
    success: true,
    message: 'Subscription cancelled successfully',
    subscription_id,
    status: cancelledSubscription.status,
  });
}

// ==================== DEACTIVATE SUBSCRIPTION ====================

async function handleDeactivateSubscription(request: Request, env: Env): Promise<Response> {
  const auth = await authenticateUser(request, env);
  if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401);

  const { user, supabase } = auth;

  const body = await request.json() as {
    subscription_id?: string;
    cancellation_reason?: string;
  };
  const { subscription_id, cancellation_reason = 'other' } = body;

  if (!subscription_id) {
    return jsonResponse({ error: 'subscription_id is required' }, 400);
  }

  // Verify subscription exists and belongs to user
  const { data: subscription, error: fetchError } = await supabase
    .from('subscriptions')
    .select('id, user_id, status, subscription_end_date, cancelled_at')
    .eq('id', subscription_id)
    .maybeSingle();

  if (fetchError || !subscription) {
    return jsonResponse({ error: 'Subscription not found' }, 404);
  }

  if (subscription.user_id !== user.id) {
    return jsonResponse({ error: 'Permission denied' }, 403);
  }

  if (subscription.status === 'cancelled') {
    return jsonResponse({
      success: true,
      message: 'Subscription is already cancelled',
      subscription: {
        id: subscription.id,
        status: 'cancelled',
        cancelled_at: subscription.cancelled_at,
        access_until: subscription.subscription_end_date,
      },
      already_cancelled: true,
    });
  }

  if (!['active', 'paused'].includes(subscription.status)) {
    return jsonResponse({ error: `Cannot cancel subscription with status '${subscription.status}'` }, 400);
  }

  const now = new Date().toISOString();

  const { data: updated, error: updateError } = await supabase
    .from('subscriptions')
    .update({
      status: 'cancelled',
      auto_renew: false,
      cancelled_at: now,
      cancellation_reason,
      updated_at: now,
    })
    .eq('id', subscription_id)
    .eq('user_id', user.id)
    .select('*')
    .single();

  if (updateError) {
    return jsonResponse({ error: 'Failed to cancel subscription' }, 500);
  }

  // Log cancellation for analytics
  await supabase
    .from('subscription_cancellations')
    .insert([{
      subscription_id,
      user_id: user.id,
      cancellation_reason,
      cancelled_at: now,
      access_until: subscription.subscription_end_date,
    }])
    .select()
    .maybeSingle();

  return jsonResponse({
    success: true,
    message: 'Subscription cancelled successfully',
    subscription: updated,
  });
}

// ==================== PAUSE SUBSCRIPTION ====================

async function handlePauseSubscription(request: Request, env: Env): Promise<Response> {
  const auth = await authenticateUser(request, env);
  if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401);

  const { user, supabase } = auth;

  const body = await request.json() as {
    subscription_id?: string;
    pause_months?: number;
  };
  const { subscription_id, pause_months = 1 } = body;

  if (!subscription_id) {
    return jsonResponse({ error: 'subscription_id is required' }, 400);
  }

  // Validate pause duration (1-3 months)
  if (pause_months < 1 || pause_months > 3) {
    return jsonResponse({ error: 'Pause duration must be between 1 and 3 months' }, 400);
  }

  // Verify subscription exists and belongs to user
  const { data: subscription, error: fetchError } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('id', subscription_id)
    .maybeSingle();

  if (fetchError || !subscription) {
    return jsonResponse({ error: 'Subscription not found' }, 404);
  }

  if (subscription.user_id !== user.id) {
    return jsonResponse({ error: 'Permission denied' }, 403);
  }

  if (subscription.status === 'paused') {
    return jsonResponse({
      success: true,
      message: 'Subscription is already paused',
      subscription,
      already_paused: true,
    });
  }

  if (subscription.status !== 'active') {
    return jsonResponse({ error: `Cannot pause subscription with status '${subscription.status}'` }, 400);
  }

  const now = new Date();
  const pausedUntil = new Date(now);
  pausedUntil.setMonth(pausedUntil.getMonth() + pause_months);

  // Extend subscription end date by pause duration
  const currentEndDate = new Date(subscription.subscription_end_date);
  currentEndDate.setMonth(currentEndDate.getMonth() + pause_months);

  const { data: updated, error: updateError } = await supabase
    .from('subscriptions')
    .update({
      status: 'paused',
      paused_at: now.toISOString(),
      paused_until: pausedUntil.toISOString(),
      subscription_end_date: currentEndDate.toISOString(),
      updated_at: now.toISOString(),
    })
    .eq('id', subscription_id)
    .eq('user_id', user.id)
    .select('*')
    .single();

  if (updateError) {
    return jsonResponse({ error: 'Failed to pause subscription' }, 500);
  }

  return jsonResponse({
    success: true,
    message: `Subscription paused for ${pause_months} month(s)`,
    subscription: updated,
    paused_until: pausedUntil.toISOString(),
  });
}

// ==================== RESUME SUBSCRIPTION ====================

async function handleResumeSubscription(request: Request, env: Env): Promise<Response> {
  const auth = await authenticateUser(request, env);
  if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401);

  const { user, supabase } = auth;

  const body = await request.json() as {
    subscription_id?: string;
  };
  const { subscription_id } = body;

  if (!subscription_id) {
    return jsonResponse({ error: 'subscription_id is required' }, 400);
  }

  // Verify subscription exists and belongs to user
  const { data: subscription, error: fetchError } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('id', subscription_id)
    .maybeSingle();

  if (fetchError || !subscription) {
    return jsonResponse({ error: 'Subscription not found' }, 404);
  }

  if (subscription.user_id !== user.id) {
    return jsonResponse({ error: 'Permission denied' }, 403);
  }

  if (subscription.status === 'active') {
    return jsonResponse({
      success: true,
      message: 'Subscription is already active',
      subscription,
      already_active: true,
    });
  }

  if (subscription.status !== 'paused') {
    return jsonResponse({ error: `Cannot resume subscription with status '${subscription.status}'` }, 400);
  }

  const now = new Date().toISOString();

  const { data: updated, error: updateError } = await supabase
    .from('subscriptions')
    .update({
      status: 'active',
      paused_at: null,
      paused_until: null,
      updated_at: now,
    })
    .eq('id', subscription_id)
    .eq('user_id', user.id)
    .select('*')
    .single();

  if (updateError) {
    return jsonResponse({ error: 'Failed to resume subscription' }, 500);
  }

  return jsonResponse({
    success: true,
    message: 'Subscription resumed successfully',
    subscription: updated,
  });
}

// ==================== GET SUBSCRIPTION ====================

async function handleGetSubscription(request: Request, env: Env): Promise<Response> {
  const auth = await authenticateUser(request, env);
  if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401);

  const { user, supabase } = auth;

  // Get active or paused subscription
  const { data: subscription, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .in('status', ['active', 'paused'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    return jsonResponse({ error: 'Failed to fetch subscription' }, 500);
  }

  if (!subscription) {
    // Try to get most recent subscription (even if cancelled/expired)
    const { data: recentSub } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    return jsonResponse({
      success: true,
      has_active_subscription: false,
      subscription: recentSub || null,
    });
  }

  return jsonResponse({
    success: true,
    has_active_subscription: true,
    subscription,
  });
}

// ==================== CHECK SUBSCRIPTION ACCESS ====================
// Production-ready endpoint for route protection

const GRACE_PERIOD_DAYS = 3;

interface SubscriptionAccessResponse {
  success: boolean;
  hasAccess: boolean;
  accessReason: 'active' | 'paused' | 'grace_period' | 'expired' | 'cancelled' | 'no_subscription';
  subscription: any | null;
  showWarning: boolean;
  warningType?: 'expiring_soon' | 'grace_period' | 'paused';
  warningMessage?: string;
  daysUntilExpiry?: number;
  expiresAt?: string;
}

async function handleCheckSubscriptionAccess(request: Request, env: Env): Promise<Response> {
  const auth = await authenticateUser(request, env);
  if (!auth) {
    return jsonResponse({ 
      success: false,
      hasAccess: false,
      accessReason: 'no_subscription',
      subscription: null,
      showWarning: false,
      error: 'Unauthorized'
    }, 401);
  }

  const { user, supabase } = auth;
  const now = new Date();

  // ============================================================================
  // STEP 1: Check for organization license assignment FIRST
  // This allows members assigned by admins to bypass individual subscription check
  // ============================================================================
  const { data: licenseAssignment, error: licenseError } = await supabase
    .from('license_assignments')
    .select(`
      id,
      status,
      expires_at,
      assigned_at,
      organization_subscription_id,
      organization_subscriptions!inner (
        id,
        status,
        start_date,
        end_date,
        organization_id,
        organization_type,
        subscription_plan_id,
        subscription_plans (
          id,
          name,
          plan_code
        )
      )
    `)
    .eq('user_id', user.id)
    .eq('status', 'active')
    .maybeSingle();

  if (!licenseError && licenseAssignment) {
    const orgSub = licenseAssignment.organization_subscriptions as any;
    
    // Check if organization subscription is active and not expired
    if (orgSub && orgSub.status === 'active') {
      const orgEndDate = new Date(orgSub.end_date);
      
      if (orgEndDate > now) {
        // Check if license assignment has its own expiry
        const licenseExpiry = licenseAssignment.expires_at ? new Date(licenseAssignment.expires_at) : null;
        const effectiveEndDate = licenseExpiry && licenseExpiry < orgEndDate ? licenseExpiry : orgEndDate;
        
        if (effectiveEndDate > now) {
          const daysUntilExpiry = Math.ceil((effectiveEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          const showExpiringWarning = daysUntilExpiry <= 7;
          
          // Build a subscription-like object for the response
          const orgSubscriptionInfo = {
            id: orgSub.id,
            plan_id: orgSub.subscription_plan_id,
            plan_name: orgSub.subscription_plans?.name || 'Organization Plan',
            plan_code: orgSub.subscription_plans?.plan_code,
            status: 'active',
            subscription_start_date: orgSub.start_date,
            subscription_end_date: effectiveEndDate.toISOString(),
            is_organization_license: true,
            organization_id: orgSub.organization_id,
            organization_type: orgSub.organization_type,
            license_assignment_id: licenseAssignment.id,
          };

          const response: SubscriptionAccessResponse = {
            success: true,
            hasAccess: true,
            accessReason: 'active',
            subscription: orgSubscriptionInfo,
            showWarning: showExpiringWarning,
            warningType: showExpiringWarning ? 'expiring_soon' : undefined,
            warningMessage: showExpiringWarning 
              ? `Your organization license expires in ${daysUntilExpiry} day${daysUntilExpiry !== 1 ? 's' : ''}`
              : undefined,
            daysUntilExpiry,
            expiresAt: effectiveEndDate.toISOString(),
          };

          console.log(`[CheckAccess] User ${user.id} has active organization license from org ${orgSub.organization_id}`);
          return jsonResponse(response);
        }
      }
    }
  }

  // ============================================================================
  // STEP 2: Check for individual subscription (original logic)
  // ============================================================================

  // Get user's subscription - include recently expired for grace period
  const gracePeriodDate = new Date(now);
  gracePeriodDate.setDate(gracePeriodDate.getDate() - GRACE_PERIOD_DAYS);

  // Include 'cancelled' status - users retain access until end_date
  const { data: subscription, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .in('status', ['active', 'paused', 'cancelled'])
    .gte('subscription_end_date', gracePeriodDate.toISOString())
    .order('subscription_end_date', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('Subscription access check error:', error);
    return jsonResponse({ 
      success: false,
      hasAccess: false,
      accessReason: 'no_subscription',
      subscription: null,
      showWarning: false,
      error: 'Failed to check subscription'
    }, 500);
  }

  // No subscription found
  if (!subscription) {
    // Check if user ever had a subscription (for better UX messaging)
    const { data: anySubscription } = await supabase
      .from('subscriptions')
      .select('id, status, subscription_end_date')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const response: SubscriptionAccessResponse = {
      success: true,
      hasAccess: false,
      accessReason: anySubscription ? 'expired' : 'no_subscription',
      subscription: anySubscription || null,
      showWarning: false,
    };

    return jsonResponse(response);
  }

  const endDate = new Date(subscription.subscription_end_date);
  const daysUntilExpiry = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  // Case 1: Paused subscription - allow access with warning
  if (subscription.status === 'paused') {
    const response: SubscriptionAccessResponse = {
      success: true,
      hasAccess: true,
      accessReason: 'paused',
      subscription,
      showWarning: true,
      warningType: 'paused',
      warningMessage: `Your subscription is paused until ${new Date(subscription.paused_until).toLocaleDateString()}`,
      daysUntilExpiry,
      expiresAt: subscription.subscription_end_date,
    };
    return jsonResponse(response);
  }

  // Case 2: Cancelled subscription - allow access until end_date with warning
  if (subscription.status === 'cancelled' && endDate > now) {
    const response: SubscriptionAccessResponse = {
      success: true,
      hasAccess: true,
      accessReason: 'cancelled',
      subscription,
      showWarning: true,
      warningType: 'expiring_soon',
      warningMessage: `Your subscription was cancelled. Access ends in ${daysUntilExpiry} day${daysUntilExpiry !== 1 ? 's' : ''}.`,
      daysUntilExpiry,
      expiresAt: subscription.subscription_end_date,
    };
    return jsonResponse(response);
  }

  // Case 3: Active and not expired
  if (endDate > now) {
    const showExpiringWarning = daysUntilExpiry <= 7;
    
    const response: SubscriptionAccessResponse = {
      success: true,
      hasAccess: true,
      accessReason: 'active',
      subscription,
      showWarning: showExpiringWarning,
      warningType: showExpiringWarning ? 'expiring_soon' : undefined,
      warningMessage: showExpiringWarning 
        ? `Your subscription expires in ${daysUntilExpiry} day${daysUntilExpiry !== 1 ? 's' : ''}`
        : undefined,
      daysUntilExpiry,
      expiresAt: subscription.subscription_end_date,
    };
    return jsonResponse(response);
  }

  // Case 4: Expired but within grace period
  if (daysUntilExpiry >= -GRACE_PERIOD_DAYS) {
    const daysIntoGrace = Math.abs(daysUntilExpiry);
    const daysLeftInGrace = GRACE_PERIOD_DAYS - daysIntoGrace;
    
    const response: SubscriptionAccessResponse = {
      success: true,
      hasAccess: true,
      accessReason: 'grace_period',
      subscription,
      showWarning: true,
      warningType: 'grace_period',
      warningMessage: `Your subscription expired. You have ${daysLeftInGrace} day${daysLeftInGrace !== 1 ? 's' : ''} left to renew before losing access.`,
      daysUntilExpiry,
      expiresAt: subscription.subscription_end_date,
    };
    return jsonResponse(response);
  }

  // Case 5: Expired beyond grace period
  const response: SubscriptionAccessResponse = {
    success: true,
    hasAccess: false,
    accessReason: 'expired',
    subscription,
    showWarning: false,
    daysUntilExpiry,
    expiresAt: subscription.subscription_end_date,
  };
  return jsonResponse(response);
}

// ==================== CREATE EVENT ORDER ====================

const MAX_EVENT_AMOUNT_RUPEES = 10000000; // ₹1 crore max
const TEST_MODE_MAX_AMOUNT = 5000000; // ₹50,000 in paise for test mode

async function handleCreateEventOrder(request: Request, env: Env): Promise<Response> {
  const body = await request.json() as {
    amount?: number;
    currency?: string;
    registrationId?: string;
    planName?: string;
    userEmail?: string;
    userName?: string;
    origin?: string;
  };

  const { amount: originalAmount, currency, registrationId, planName, userEmail, userName, origin: bodyOrigin } = body;

  // Validate required fields
  if (!originalAmount || !currency || !registrationId || !userEmail) {
    return jsonResponse({ error: 'Missing required fields' }, 400);
  }

  if (originalAmount <= 0) {
    return jsonResponse({ error: 'Amount must be positive' }, 400);
  }

  const amountInRupees = originalAmount / 100;
  if (amountInRupees > MAX_EVENT_AMOUNT_RUPEES) {
    return jsonResponse({ error: `Amount exceeds maximum limit of ₹${MAX_EVENT_AMOUNT_RUPEES.toLocaleString()}` }, 400);
  }

  if (currency !== 'INR') {
    return jsonResponse({ error: 'Only INR currency is supported' }, 400);
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(userEmail)) {
    return jsonResponse({ error: 'Invalid email format' }, 400);
  }

  // Detect if request is from production site
  const headerOrigin = request.headers.get('origin') || request.headers.get('referer') || '';
  const requestOrigin = bodyOrigin || headerOrigin;
  const isProductionSite = requestOrigin.includes('skillpassport.rareminds.in') && !requestOrigin.includes('dev-');

  // Determine credentials and amount based on site
  let keyId: string;
  let keySecret: string;
  let amount = originalAmount;

  if (isProductionSite) {
    keyId = getRazorpayKeyId(env);
    keySecret = env.RAZORPAY_KEY_SECRET;
  } else {
    keyId = env.TEST_RAZORPAY_KEY_ID || getRazorpayKeyId(env);
    keySecret = env.TEST_RAZORPAY_KEY_SECRET || env.RAZORPAY_KEY_SECRET;
    // Cap amount at test limit for non-production sites
    if (amount > TEST_MODE_MAX_AMOUNT) {
      console.log(`TEST MODE: Capping amount from ₹${amount / 100} to ₹${TEST_MODE_MAX_AMOUNT / 100}`);
      amount = TEST_MODE_MAX_AMOUNT;
    }
  }

  if (!keyId || !keySecret) {
    return jsonResponse({ error: 'Payment service not configured' }, 500);
  }

  const supabaseUrl = getSupabaseUrl(env);
  const supabaseAdmin = createClient(supabaseUrl, env.SUPABASE_SERVICE_ROLE_KEY);

  // Verify registration exists
  const { data: registration, error: regError } = await supabaseAdmin
    .from('event_registrations')
    .select('id, payment_status')
    .eq('id', registrationId)
    .maybeSingle();

  if (regError || !registration) {
    return jsonResponse({ error: 'Registration not found' }, 404);
  }

  // Create Razorpay order
  const receipt = `event_${Date.now()}_${registrationId.substring(0, 8)}`;
  const razorpayAuth = btoa(`${keyId}:${keySecret}`);

  const razorpayResponse = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${razorpayAuth}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount,
      currency,
      receipt,
      notes: {
        registration_id: registrationId,
        plan_name: planName,
        user_email: userEmail,
        user_name: userName,
      },
    }),
  });

  if (!razorpayResponse.ok) {
    const errorData = await razorpayResponse.text();
    console.error('Razorpay API Error:', razorpayResponse.status, errorData);
    
    let errorMessage = 'Unable to create payment order. Please try again.';
    try {
      const parsedError = JSON.parse(errorData);
      if (parsedError.error?.description) {
        errorMessage = parsedError.error.description;
      }
    } catch {}
    
    return jsonResponse({ error: errorMessage }, 500);
  }

  const order = await razorpayResponse.json() as any;
  console.log(`Event order created: ${order.id} for registration: ${registrationId}`);

  // Update registration with order ID
  await supabaseAdmin
    .from('event_registrations')
    .update({ razorpay_order_id: order.id })
    .eq('id', registrationId);

  return jsonResponse({
    success: true,
    id: order.id,
    amount: order.amount,
    currency: order.currency,
    receipt: order.receipt,
    key: keyId,
  });
}

// ==================== EXPIRE SUBSCRIPTIONS ====================

async function handleExpireSubscriptions(env: Env): Promise<Response> {
  const supabaseUrl = getSupabaseUrl(env);
  const supabaseAdmin = createClient(supabaseUrl, env.SUPABASE_SERVICE_ROLE_KEY);

  const { data, error } = await supabaseAdmin.rpc('expire_old_subscriptions');

  if (error) {
    return jsonResponse({ success: false, error: error.message }, 500);
  }

  const expiredCount = data?.[0]?.expired_count || 0;
  return jsonResponse({
    success: true,
    expired_count: expiredCount,
    timestamp: new Date().toISOString(),
  });
}

// ==================== SUBSCRIPTION PLANS ENDPOINTS ====================
// NOTE: These handlers are now imported from ./handlers/plans.ts
// See: handleGetSubscriptionPlans, handleGetSubscriptionPlan, handleGetSubscriptionFeatures

// ==================== MAIN HANDLER ====================

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    try {
      switch (path) {
        // Payment endpoints
        case '/create-order':
          return await handleCreateOrder(request, env);
        case '/create-event-order':
          return await handleCreateEventOrder(request, env);
        case '/verify-payment':
          return await handleVerifyPayment(request, env);
        case '/webhook':
          return await handleWebhook(request, env);
        
        // Subscription management endpoints
        case '/get-subscription':
          return await handleGetSubscription(request, env);
        case '/check-subscription-access':
          return await handleCheckSubscriptionAccess(request, env);
        case '/cancel-subscription':
          return await handleCancelSubscription(request, env);
        case '/deactivate-subscription':
          return await handleDeactivateSubscription(request, env);
        case '/pause-subscription':
          return await handlePauseSubscription(request, env);
        case '/resume-subscription':
          return await handleResumeSubscription(request, env);
        
        // Cron/Admin endpoints
        case '/expire-subscriptions':
          return await handleExpireSubscriptions(env);
        
        // Subscription Plans endpoints (public)
        case '/subscription-plans':
          return await handleGetSubscriptionPlans(request, env);
        case '/subscription-plan':
          return await handleGetSubscriptionPlan(request, env);
        case '/subscription-features':
          return await handleGetSubscriptionFeatures(request, env);
        
        // Add-On endpoints
        case '/addon-catalog':
          return await handleGetAddonCatalog(request, env);
        case '/user-entitlements':
          return await handleGetUserEntitlements(request, env);
        case '/create-addon-order':
          return await handleCreateAddonOrder(request, env);
        case '/verify-addon-payment':
          return await handleVerifyAddonPayment(request, env);
        case '/create-bundle-order':
          return await handleCreateBundleOrder(request, env);
        case '/verify-bundle-payment':
          return await handleVerifyBundlePayment(request, env);
        case '/cancel-addon':
          return await handleCancelAddon(request, env);
        case '/check-addon-access':
          return await handleCheckAddonAccess(request, env);
        
        // Organization Subscription endpoints
        // Organization Order endpoints (Razorpay integration)
        case '/create-org-order':
          if (request.method === 'POST') {
            const auth = await authenticateUser(request, env);
            if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401);
            return await handleCreateOrgOrder(request, env, auth.user);
          }
          break;
        
        case '/verify-org-payment':
          if (request.method === 'POST') {
            const auth = await authenticateUser(request, env);
            if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401);
            return await handleVerifyOrgPayment(request, env, auth.supabase, auth.user);
          }
          break;
        
        case '/org-subscriptions/calculate-pricing':
          if (request.method === 'POST') {
            const auth = await authenticateUser(request, env);
            if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401);
            return await handleCalculateOrgPricing(request, env, auth.supabase, auth.user.id);
          }
          break;
        
        case '/org-subscriptions/purchase':
          if (request.method === 'POST') {
            const auth = await authenticateUser(request, env);
            if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401);
            return await handlePurchaseOrgSubscription(request, env, auth.supabase, auth.user.id);
          }
          break;
        
        case '/org-subscriptions':
          if (request.method === 'GET') {
            const auth = await authenticateUser(request, env);
            if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401);
            return await handleGetOrgSubscriptions(request, env, auth.supabase, auth.user.id);
          }
          break;
        
        // License Pool endpoints
        case '/license-pools':
          const authPool = await authenticateUser(request, env);
          if (!authPool) return jsonResponse({ error: 'Unauthorized' }, 401);
          
          if (request.method === 'POST') {
            return await handleCreateLicensePool(request, env, authPool.supabase, authPool.user.id);
          } else if (request.method === 'GET') {
            return await handleGetLicensePools(request, env, authPool.supabase, authPool.user.id);
          }
          break;
        
        // License Assignment endpoints
        case '/license-assignments':
          const authAssign = await authenticateUser(request, env);
          if (!authAssign) return jsonResponse({ error: 'Unauthorized' }, 401);
          
          if (request.method === 'POST') {
            return await handleAssignLicense(request, env, authAssign.supabase, authAssign.user.id);
          }
          break;
        
        case '/license-assignments/bulk':
          if (request.method === 'POST') {
            const auth = await authenticateUser(request, env);
            if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401);
            return await handleBulkAssignLicenses(request, env, auth.supabase, auth.user.id);
          }
          break;
        
        case '/license-assignments/transfer':
          if (request.method === 'POST') {
            const auth = await authenticateUser(request, env);
            if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401);
            return await handleTransferLicense(request, env, auth.supabase, auth.user.id);
          }
          break;
        
        // Organization Billing endpoints
        case '/org-billing/dashboard':
          if (request.method === 'GET') {
            const auth = await authenticateUser(request, env);
            if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401);
            return await handleGetBillingDashboard(request, env, auth.supabase, auth.user.id);
          }
          break;
        
        case '/org-billing/invoices':
          if (request.method === 'GET') {
            const auth = await authenticateUser(request, env);
            if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401);
            return await handleGetInvoiceHistory(request, env, auth.supabase, auth.user.id);
          }
          break;
        
        case '/org-billing/cost-projection':
          if (request.method === 'GET') {
            const auth = await authenticateUser(request, env);
            if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401);
            return await handleGetCostProjection(request, env, auth.supabase, auth.user.id);
          }
          break;
        
        case '/org-billing/calculate-seat-addition':
          if (request.method === 'POST') {
            const auth = await authenticateUser(request, env);
            if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401);
            return await handleCalculateSeatAdditionCost(request, env, auth.supabase, auth.user.id);
          }
          break;
        
        // Organization Invitation endpoints
        case '/org-invitations':
          const authInv = await authenticateUser(request, env);
          if (!authInv) return jsonResponse({ error: 'Unauthorized' }, 401);
          
          if (request.method === 'POST') {
            return await handleInviteMember(request, env, authInv.supabase, authInv.user.id);
          } else if (request.method === 'GET') {
            return await handleGetInvitations(request, env, authInv.supabase, authInv.user.id);
          }
          break;
        
        case '/org-invitations/bulk':
          if (request.method === 'POST') {
            const auth = await authenticateUser(request, env);
            if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401);
            return await handleBulkInviteMembers(request, env, auth.supabase, auth.user.id);
          }
          break;
        
        case '/org-invitations/accept':
          if (request.method === 'POST') {
            const auth = await authenticateUser(request, env);
            if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401);
            return await handleAcceptInvitation(request, env, auth.supabase, auth.user.id);
          }
          break;
        
        case '/org-invitations/stats':
          if (request.method === 'GET') {
            const auth = await authenticateUser(request, env);
            if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401);
            return await handleGetInvitationStats(request, env, auth.supabase, auth.user.id);
          }
          break;
        
        // Entitlement lifecycle endpoints (for cron jobs)
        case '/process-entitlement-lifecycle':
          return await handleProcessEntitlementLifecycle(request, env);
        case '/expire-entitlements':
          return await handleExpireEntitlements(request, env);
        case '/send-renewal-reminders':
          return await handleSendRenewalReminders(request, env);
        case '/process-auto-renewals':
          return await handleProcessAutoRenewals(request, env);
        
        // Health check
        case '/health':
          const configStatus = {
            supabase_url: !!(env.SUPABASE_URL || env.VITE_SUPABASE_URL),
            supabase_anon_key: !!(env.SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY),
            supabase_service_role_key: !!env.SUPABASE_SERVICE_ROLE_KEY,
            razorpay_key_id: !!(env.RAZORPAY_KEY_ID || env.VITE_RAZORPAY_KEY_ID),
            razorpay_key_secret: !!env.RAZORPAY_KEY_SECRET,
          };
          const allConfigured = Object.values(configStatus).every(Boolean);
          return jsonResponse({ 
            status: allConfigured ? 'ok' : 'misconfigured',
            timestamp: new Date().toISOString(),
            config: configStatus,
            endpoints: [
              'POST /create-order',
              'POST /create-event-order', 
              'POST /verify-payment',
              'POST /webhook',
              'GET  /get-subscription',
              'GET  /check-subscription-access',
              'POST /cancel-subscription',
              'POST /deactivate-subscription',
              'POST /pause-subscription',
              'POST /resume-subscription',
              'POST /expire-subscriptions',
              'GET  /subscription-plans',
              'GET  /subscription-plan',
              'GET  /subscription-features',
              // Add-On endpoints
              'GET  /addon-catalog',
              'GET  /user-entitlements',
              'POST /create-addon-order',
              'POST /verify-addon-payment',
              'POST /create-bundle-order',
              'POST /verify-bundle-payment',
              'POST /cancel-addon',
              'GET  /check-addon-access',
              // Organization Subscription endpoints
              'POST /org-subscriptions/calculate-pricing',
              'POST /org-subscriptions/purchase',
              'GET  /org-subscriptions',
              'PUT  /org-subscriptions/:id/seats',
              'POST /license-pools',
              'GET  /license-pools',
              'POST /license-assignments',
              'POST /license-assignments/bulk',
              'POST /license-assignments/transfer',
              'DELETE /license-assignments/:id',
              'GET  /license-assignments/user/:userId',
              'PUT  /license-pools/:id/allocation',
              'POST /license-pools/:id/auto-assignment',
              // Organization Billing endpoints
              'GET  /org-billing/dashboard',
              'GET  /org-billing/invoices',
              'GET  /org-billing/invoice/:id/download',
              'GET  /org-billing/cost-projection',
              'POST /org-billing/calculate-seat-addition',
              // Organization Invitation endpoints
              'POST /org-invitations',
              'GET  /org-invitations',
              'POST /org-invitations/bulk',
              'POST /org-invitations/accept',
              'GET  /org-invitations/stats',
              'PUT  /org-invitations/:id/resend',
              'DELETE /org-invitations/:id',
              // Entitlement Lifecycle endpoints (CRON)
              'POST /process-entitlement-lifecycle',
              'POST /expire-entitlements',
              'POST /send-renewal-reminders',
              'POST /process-auto-renewals',
              // Utility endpoints
              'GET  /health',
              'GET  /debug-storage',
            ],
            message: allConfigured ? 'All required secrets are configured' : 'Some required secrets are missing.',
            email_note: 'Email sending uses Cloudflare Worker (email-api) with SMTP.',
            storage_api_url: env.STORAGE_API_URL || STORAGE_API_URL,
          });
        
        // Debug endpoint to test storage connection
        case '/debug-storage':
          const storageUrl = env.STORAGE_API_URL || STORAGE_API_URL;
          console.log(`[DEBUG-STORAGE] Testing storage API`);
          console.log(`[DEBUG-STORAGE] STORAGE_SERVICE binding available: ${!!env.STORAGE_SERVICE}`);
          
          try {
            let healthResponse: Response;
            let uploadResponse: Response;
            
            // Test the storage API health endpoint
            console.log(`[DEBUG-STORAGE] Fetching health endpoint...`);
            
            if (env.STORAGE_SERVICE) {
              console.log(`[DEBUG-STORAGE] Using Service Binding`);
              healthResponse = await env.STORAGE_SERVICE.fetch('https://storage-api/health');
            } else {
              console.log(`[DEBUG-STORAGE] Using HTTP fetch (may fail with error 1042)`);
              healthResponse = await fetch(`${storageUrl}/health`, {
                headers: { 'User-Agent': 'payments-api-worker' },
              });
            }
            
            console.log(`[DEBUG-STORAGE] Health response status: ${healthResponse.status}`);
            const healthText = await healthResponse.text();
            console.log(`[DEBUG-STORAGE] Health response body: ${healthText}`);
            
            let healthData;
            try {
              healthData = JSON.parse(healthText);
            } catch {
              healthData = { raw: healthText };
            }
            
            // Test a simple upload
            const testBase64 = btoa('Test receipt content for debugging');
            const testPaymentId = `debug_${Date.now()}`;
            const testUserId = 'debug_user';
            
            console.log(`[DEBUG-STORAGE] Attempting test upload...`);
            
            if (env.STORAGE_SERVICE) {
              uploadResponse = await env.STORAGE_SERVICE.fetch('https://storage-api/upload-payment-receipt', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  pdfBase64: testBase64,
                  paymentId: testPaymentId,
                  userId: testUserId,
                  filename: 'debug-test.pdf',
                }),
              });
            } else {
              uploadResponse = await fetch(`${storageUrl}/upload-payment-receipt`, {
                method: 'POST',
                headers: { 
                  'Content-Type': 'application/json',
                  'User-Agent': 'payments-api-worker',
                },
                body: JSON.stringify({
                  pdfBase64: testBase64,
                  paymentId: testPaymentId,
                  userId: testUserId,
                  filename: 'debug-test.pdf',
                }),
              });
            }
            
            const uploadStatus = uploadResponse.status;
            const uploadText = await uploadResponse.text();
            console.log(`[DEBUG-STORAGE] Upload response status: ${uploadStatus}`);
            console.log(`[DEBUG-STORAGE] Upload response body: ${uploadText}`);
            
            let uploadData;
            try {
              uploadData = JSON.parse(uploadText);
            } catch {
              uploadData = { raw: uploadText };
            }
            
            return jsonResponse({
              storage_service_binding: !!env.STORAGE_SERVICE,
              storage_api_url: storageUrl,
              storage_health: {
                status: healthResponse.status,
                data: healthData,
              },
              test_upload: {
                status: uploadStatus,
                response: uploadData,
              },
              env_storage_url: env.STORAGE_API_URL || 'not set (using default)',
              default_storage_url: STORAGE_API_URL,
            });
          } catch (storageError) {
            console.error(`[DEBUG-STORAGE] Error:`, storageError);
            return jsonResponse({
              storage_service_binding: !!env.STORAGE_SERVICE,
              storage_api_url: storageUrl,
              error: (storageError as Error).message,
              error_stack: (storageError as Error).stack,
              env_storage_url: env.STORAGE_API_URL || 'not set (using default)',
              default_storage_url: STORAGE_API_URL,
            }, 500);
          }
        
        // Debug endpoint to test Razorpay connectivity
        case '/debug-razorpay':
          try {
            const { keyId, keySecret, isProduction } = getRazorpayCredentialsForRequest(request, env);
            const razorpayAuth = btoa(`${keyId}:${keySecret}`);
            
            // Test Razorpay API by fetching account details
            const testResponse = await fetch('https://api.razorpay.com/v1/payments?count=1', {
              headers: {
                'Authorization': `Basic ${razorpayAuth}`,
              },
            });
            
            const testStatus = testResponse.status;
            const testBody = await testResponse.text();
            
            return jsonResponse({
              success: testResponse.ok,
              environment: isProduction ? 'PRODUCTION' : 'DEVELOPMENT',
              razorpay_key_prefix: keyId.substring(0, 12) + '...',
              test_key_configured: !!env.TEST_RAZORPAY_KEY_ID,
              api_status: testStatus,
              api_response: testBody.substring(0, 500),
            });
          } catch (err) {
            return jsonResponse({
              success: false,
              error: err instanceof Error ? err.message : String(err),
            }, 500);
          }
        
        default:
          // Handle dynamic routes for organization endpoints
          if (path.startsWith('/org-subscriptions/') && path.includes('/seats')) {
            if (request.method === 'PUT') {
              const auth = await authenticateUser(request, env);
              if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401);
              const subscriptionId = path.split('/')[2];
              return await handleUpdateSeatCount(request, env, auth.supabase, auth.user.id, subscriptionId);
            }
          }
          
          if (path.startsWith('/license-assignments/') && !path.includes('/bulk')) {
            const auth = await authenticateUser(request, env);
            if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401);
            
            const parts = path.split('/');
            if (parts[2] === 'user' && parts[3]) {
              // GET /license-assignments/user/:userId
              if (request.method === 'GET') {
                return await handleGetUserAssignments(request, env, auth.supabase, auth.user.id, parts[3]);
              }
            } else if (parts[2]) {
              // DELETE /license-assignments/:id
              if (request.method === 'DELETE') {
                return await handleUnassignLicense(request, env, auth.supabase, auth.user.id, parts[2]);
              }
            }
          }
          
          // Handle dynamic routes for invitation endpoints
          if (path.startsWith('/org-invitations/') && !path.includes('/bulk') && !path.includes('/accept') && !path.includes('/stats')) {
            const auth = await authenticateUser(request, env);
            if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401);
            
            const parts = path.split('/');
            const invitationId = parts[2];
            const action = parts[3];
            
            if (invitationId && action === 'resend') {
              // PUT /org-invitations/:id/resend
              if (request.method === 'PUT') {
                return await handleResendInvitation(request, env, auth.supabase, auth.user.id, invitationId);
              }
            } else if (invitationId && !action) {
              // DELETE /org-invitations/:id
              if (request.method === 'DELETE') {
                return await handleCancelInvitation(request, env, auth.supabase, auth.user.id, invitationId);
              }
            }
          }
          
          // Handle dynamic routes for license pool endpoints
          if (path.startsWith('/license-pools/') && path.includes('/allocation')) {
            const auth = await authenticateUser(request, env);
            if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401);
            
            const parts = path.split('/');
            const poolId = parts[2];
            
            // PUT /license-pools/:id/allocation
            if (request.method === 'PUT' && poolId) {
              return await handleUpdatePoolAllocation(request, env, auth.supabase, auth.user.id, poolId);
            }
          }
          
          // Handle dynamic routes for license pool auto-assignment
          if (path.startsWith('/license-pools/') && path.includes('/auto-assignment')) {
            const auth = await authenticateUser(request, env);
            if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401);
            
            const parts = path.split('/');
            const poolId = parts[2];
            
            // POST /license-pools/:id/auto-assignment
            if (request.method === 'POST' && poolId) {
              return await handleConfigureAutoAssignment(request, env, auth.supabase, auth.user.id, poolId);
            }
          }
          
          // Handle dynamic routes for invoice download
          if (path.startsWith('/org-billing/invoice/') && path.includes('/download')) {
            const auth = await authenticateUser(request, env);
            if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401);
            
            const parts = path.split('/');
            const invoiceId = parts[3];
            
            // GET /org-billing/invoice/:id/download
            if (request.method === 'GET' && invoiceId) {
              return await handleDownloadInvoice(request, env, auth.supabase, auth.user.id, invoiceId);
            }
          }
          
          return jsonResponse({ error: 'Not found' }, 404);
      }
      
      // If we reach here, the method was not allowed for the matched route
      return jsonResponse({ error: 'Method not allowed' }, 405);
    } catch (error) {
      console.error('Worker error:', error);
      return jsonResponse({ error: (error as Error).message || 'Internal server error' }, 500);
    }
  },

  // Scheduled handler for cron triggers
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    console.log('[CRON] Scheduled event triggered at:', new Date().toISOString());
    
    try {
      // Create a mock request for the lifecycle handler
      const request = new Request('https://payments-api/process-entitlement-lifecycle', {
        method: 'POST',
      });
      
      const response = await handleProcessEntitlementLifecycle(request, env);
      const result = await response.json();
      
      console.log('[CRON] Entitlement lifecycle processing result:', JSON.stringify(result));
    } catch (error) {
      console.error('[CRON] Error in scheduled handler:', error);
    }
  },
};

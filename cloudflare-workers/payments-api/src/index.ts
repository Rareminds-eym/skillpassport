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
 * ADMIN/CRON ENDPOINTS:
 * - POST /expire-subscriptions - Auto-expire old subscriptions (cron)
 * - GET  /health               - Health check with config status
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

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

function getRazorpayCredentials(env: Env) {
  // Use test credentials if available, otherwise use production
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
  const { keyId, keySecret } = getRazorpayCredentials(env);

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
  // CRITICAL: Check for active subscription BEFORE creating order
  // This prevents users from paying when they already have an active subscription
  const supabaseUrl = getSupabaseUrl(env);
  const supabaseAdmin = createClient(supabaseUrl, env.SUPABASE_SERVICE_ROLE_KEY);
  
  const { data: existingSubscription, error: subCheckError } = await supabaseAdmin
    .from('subscriptions')
    .select('id, plan_type, status, subscription_end_date')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .maybeSingle();

  if (existingSubscription) {
    // User already has an active subscription - block order creation
    console.log(`[CREATE-ORDER] Blocked: User ${user.id} already has active ${existingSubscription.plan_type} subscription`);
    
    return jsonResponse({
      error: 'You already have an active subscription',
      code: 'SUBSCRIPTION_EXISTS',
      existing_subscription: {
        id: existingSubscription.id,
        plan_type: existingSubscription.plan_type,
        status: existingSubscription.status,
        end_date: existingSubscription.subscription_end_date,
      },
      suggestion: 'Please manage your existing subscription from your account settings, or wait for it to expire before purchasing a new plan.'
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
    console.error('Razorpay API Error:', await razorpayResponse.text());
    return jsonResponse({ error: 'Unable to create payment order' }, 500);
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
  const { keyId, keySecret } = getRazorpayCredentials(env);

  const body = await request.json() as {
    razorpay_order_id?: string;
    razorpay_payment_id?: string;
    razorpay_signature?: string;
    // Optional: plan details for subscription creation
    plan?: {
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

  // CREATE SUBSCRIPTION RECORD
  const now = new Date().toISOString();
  const subscriptionData = {
    user_id: order.user_id,
    full_name: fullName,
    email: userEmail,
    phone: userPhone,
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

  // Get user's subscription - include recently expired for grace period
  const gracePeriodDate = new Date(now);
  gracePeriodDate.setDate(gracePeriodDate.getDate() - GRACE_PERIOD_DAYS);

  const { data: subscription, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .in('status', ['active', 'paused'])
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

  // Case 2: Active and not expired
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

  // Case 3: Expired but within grace period
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

  // Case 4: Expired beyond grace period
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
        
        default:
          return jsonResponse({ error: 'Not found' }, 404);
      }
    } catch (error) {
      console.error('Worker error:', error);
      return jsonResponse({ error: (error as Error).message || 'Internal server error' }, 500);
    }
  },
};

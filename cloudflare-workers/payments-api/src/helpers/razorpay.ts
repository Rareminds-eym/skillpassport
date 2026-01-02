/**
 * Razorpay helper functions
 */

import { Env } from '../types';
import { PRODUCTION_DOMAIN } from '../config';

/**
 * Get Razorpay Key ID with fallback
 */
export function getRazorpayKeyId(env: Env): string {
  const key = env.RAZORPAY_KEY_ID || env.VITE_RAZORPAY_KEY_ID;
  if (!key) {
    throw new Error('RAZORPAY_KEY_ID is not configured. Set it as a Cloudflare secret via: wrangler secret put RAZORPAY_KEY_ID');
  }
  return key;
}

/**
 * Check if request is from production site
 */
export function isProductionRequest(request: Request): boolean {
  const origin = request.headers.get('origin') || request.headers.get('referer') || '';
  return origin.includes(PRODUCTION_DOMAIN) && !origin.includes('dev-');
}

/**
 * Get Razorpay credentials based on request origin
 * - Production (skillpassport.rareminds.in): Uses LIVE keys
 * - Everything else (localhost, netlify, dev): Uses TEST keys
 */
export function getRazorpayCredentialsForRequest(
  request: Request, 
  env: Env
): { keyId: string; keySecret: string; isProduction: boolean } {
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
 * Verify Razorpay payment signature
 */
export async function verifySignature(
  orderId: string, 
  paymentId: string, 
  signature: string, 
  secret: string
): Promise<boolean> {
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

/**
 * Verify Razorpay webhook signature
 */
export async function verifyWebhookSignature(
  payload: string, 
  signature: string, 
  secret: string
): Promise<boolean> {
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

/**
 * Create Razorpay Basic Auth header
 */
export function createRazorpayAuth(keyId: string, keySecret: string): string {
  return btoa(`${keyId}:${keySecret}`);
}

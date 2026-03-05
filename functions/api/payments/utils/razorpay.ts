/**
 * Razorpay helper functions
 */

import type { Env } from '../types';

/**
 * Get Razorpay Key ID with RAZORPAY_MODE support
 */
export function getRazorpayKeyId(env: Env): string {
  const isTestMode = env.RAZORPAY_MODE === 'test';
  const key = isTestMode
    ? (env.RAZORPAY_KEY_ID_TEST || env.RAZORPAY_KEY_ID)
    : (env.RAZORPAY_KEY_ID || env.VITE_RAZORPAY_KEY_ID);
  
  if (!key) {
    throw new Error('RAZORPAY_KEY_ID is not configured');
  }
  return key;
}

/**
 * Get Razorpay Key Secret with RAZORPAY_MODE support
 */
export function getRazorpayKeySecret(env: Env): string {
  const isTestMode = env.RAZORPAY_MODE === 'test';
  const secret = isTestMode
    ? (env.RAZORPAY_KEY_SECRET_TEST || env.RAZORPAY_KEY_SECRET)
    : env.RAZORPAY_KEY_SECRET;
  
  if (!secret) {
    throw new Error('RAZORPAY_KEY_SECRET is not configured');
  }
  return secret;
}

/**
 * Check if using test mode via RAZORPAY_MODE env var
 */
export function isTestMode(env: Env): boolean {
  return env.RAZORPAY_MODE === 'test';
}

/**
 * Get Razorpay credentials based on RAZORPAY_MODE
 */
export function getRazorpayCredentialsForRequest(
  request: Request, 
  env: Env
): { keyId: string; keySecret: string; isProduction: boolean } {
  const isTest = isTestMode(env);
  
  let keyId: string;
  let keySecret: string;
  
  if (isTest) {
    keyId = env.RAZORPAY_KEY_ID_TEST || getRazorpayKeyId(env);
    keySecret = env.RAZORPAY_KEY_SECRET_TEST || getRazorpayKeySecret(env);
    console.log('[RAZORPAY] Using TEST credentials (RAZORPAY_MODE=test)');
  } else {
    keyId = getRazorpayKeyId(env);
    keySecret = getRazorpayKeySecret(env);
    console.log('[RAZORPAY] Using LIVE credentials (RAZORPAY_MODE=live)');
  }
  
  if (!keySecret) {
    throw new Error('RAZORPAY_KEY_SECRET is not configured');
  }
  
  return { keyId, keySecret, isProduction: !isTest };
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

/**
 * @deprecated Use getRazorpayCredentialsForRequest instead
 */
export function getRazorpayCredentials(env: Env) {
  const keyId = env.RAZORPAY_KEY_ID_TEST || getRazorpayKeyId(env);
  const keySecret = env.RAZORPAY_KEY_SECRET_TEST || getRazorpayKeySecret(env);
  if (!keySecret) {
    throw new Error('RAZORPAY_KEY_SECRET is not configured');
  }
  return { keyId, keySecret };
}

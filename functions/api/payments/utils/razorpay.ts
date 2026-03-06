/**
 * Razorpay helper functions
 * 
 * NOTE: All Razorpay API operations are now handled by the centralized
 * Razorpay worker at cloudflare-workers/razorpay-api/
 * 
 * This file is kept minimal - only for legacy compatibility if needed.
 */

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

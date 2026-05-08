/**
 * Service JWT Utilities
 *
 * Creates Service JWTs for secure communication with the payment-worker.
 * The Service JWT is signed with RAZORPAY_SERVICE_SECRET and includes the service_id.
 */

import { SignJWT } from 'jose';

// Must match the SERVICE_ID in payment-worker/src/constants.ts
const PAYMENT_SERVICE_ID = 'functions-payment-service';

/**
 * Create a Service JWT for calling the payment-worker
 *
 * @param env - Environment variables (must contain RAZORPAY_SERVICE_SECRET)
 * @returns Service JWT signed with RAZORPAY_SERVICE_SECRET
 */
export async function createServiceJwt(env: Record<string, string>): Promise<string> {
  const secret = env.RAZORPAY_SERVICE_SECRET;
  if (!secret) {
    throw new Error('RAZORPAY_SERVICE_SECRET is not configured');
  }

  const secretBytes = new TextEncoder().encode(secret);

  return new SignJWT({
    service_id: PAYMENT_SERVICE_ID,
  })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(secretBytes);
}

/**
 * Call the payment-worker with Service JWT authentication
 *
 * @param path - Worker path (e.g., '/create-order')
 * @param options - Fetch options
 * @param env - Environment variables
 * @returns Response from payment-worker
 */
export async function callPaymentWorker(
  path: string,
  options: RequestInit,
  env: Record<string, string>
): Promise<Response> {
  const workerUrl = env.PAYMENTS_API_URL || env.VITE_PAYMENTS_API_URL;
  if (!workerUrl) {
    throw new Error('PAYMENTS_API_URL environment variable is not configured');
  }

  const serviceJwt = await createServiceJwt(env);

  const url = `${workerUrl}${path}`;
  const headers = new Headers(options.headers);
  headers.set('Authorization', `Bearer ${serviceJwt}`);
  // Only set Content-Type for requests with a body; GET requests shouldn't have it
  if (options.body) {
    headers.set('Content-Type', 'application/json');
  }

  // Timeout protection — abort after 15 seconds
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15_000);

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });

    return response;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error(`Payment worker request timed out: ${path}`);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * razorpay-api client for Pages Functions
 * Generates a short-lived Service JWT to authenticate with the worker.
 * Falls back to X-API-Key if RAZORPAY_SERVICE_SECRET is not configured.
 */

import * as jose from 'jose';

async function generateServiceJWT(env: any, userJwtHash?: string): Promise<string> {
  const secret = new TextEncoder().encode(env.RAZORPAY_SERVICE_SECRET);
  return new jose.SignJWT({
    service_id: 'functions-payment-service',
    service_name: 'Payment Processing',
    ...(userJwtHash ? { user_jwt_hash: userJwtHash } : {}),
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(secret);
}

async function hashToken(token: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
    .substring(0, 16);
}

async function buildAuthHeaders(env: any, userToken?: string): Promise<Record<string, string>> {
  if (env.RAZORPAY_SERVICE_SECRET) {
    const userJwtHash = userToken ? await hashToken(userToken) : undefined;
    const jwt = await generateServiceJWT(env, userJwtHash);
    return { Authorization: `Bearer ${jwt}` };
  }
  // Fallback to API key
  return { 'X-API-Key': env.RAZORPAY_WORKER_API_KEY };
}

export async function callRazorpayWorker(
  path: string,
  body: object,
  env: any,
  userToken?: string,
): Promise<{ ok: boolean; data: any }> {
  const workerUrl = env.RAZORPAY_WORKER_URL || 'http://localhost:9003';
  const authHeaders = await buildAuthHeaders(env, userToken);

  const res = await fetch(`${workerUrl}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders },
    body: JSON.stringify(body),
  });

  return { ok: res.ok, data: await res.json() };
}

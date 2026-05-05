/**
 * Realtime Token Endpoint
 *
 * Mints a short-lived Supabase-compatible JWT (5 min TTL) for realtime subscriptions.
 * Requires SSO authentication via withAuth middleware.
 *
 * The frontend uses this token to connect to Supabase Realtime channels
 * without needing the Supabase anon key or a Supabase Auth session.
 */
import { SignJWT } from 'jose';
import { withAuth } from '../../lib/auth';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';

const REALTIME_TOKEN_TTL = 300; // 5 minutes in seconds

export const onRequestGet = withAuth(async (context: AuthenticatedContext) => {
  const user = context.data.user;
  const env = context.env as Record<string, string>;

  const jwtSecret = env.SUPABASE_JWT_SECRET;
  if (!jwtSecret) {
    return Response.json({ error: 'Server misconfiguration: SUPABASE_JWT_SECRET not set' }, { status: 500 });
  }

  const secret = new TextEncoder().encode(jwtSecret);

  // Mint a Supabase-compatible JWT for realtime subscriptions
  const token = await new SignJWT({
    sub: user.sub,
    role: 'authenticated',
    aud: 'authenticated',
    // Include org_id so RLS policies can filter by org
    org_id: user.org_id,
  })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setIssuedAt()
    .setExpirationTime(`${REALTIME_TOKEN_TTL}s`)
    .sign(secret);

  return Response.json({
    token,
    expires_in: REALTIME_TOKEN_TTL,
  });
});

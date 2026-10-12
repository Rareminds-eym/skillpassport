import { withAuthAllowUnverified } from '../../lib/auth';
import { apiError, apiSuccess } from '../../lib/response';
import { APPROVED_ORIGINS } from '../../lib/app-origins';

// Account security must remain available before email verification. The auth
// wrapper verifies the bearer token; cookies alone never authorize this route.
export const onRequestPost = withAuthAllowUnverified(async ({ request, env }) => {
  const origin = request.headers.get('Origin');
  if (origin && !APPROVED_ORIGINS.includes(origin)) {
    return apiError(403, 'FORBIDDEN', 'Request origin is not allowed', request);
  }
  const accessToken = request.headers.get('Authorization')?.match(/^Bearer\s+(\S+)$/i)?.[1];
  if (!accessToken) return apiError(401, 'UNAUTHORIZED', 'Access token required', request);

  // Only the server-readable session cookie identifies the session to retain.
  const cookies = (request.headers.get('Cookie') ?? '').split(';').map(value => value.trim());
  const refreshCookies = cookies.filter(value => value.startsWith('__Host-rm-refresh='));
  const currentRefreshToken = refreshCookies.length === 1
    ? refreshCookies[0].slice('__Host-rm-refresh='.length) : '';
  if (!currentRefreshToken) {
    return apiError(401, 'UNAUTHORIZED', 'Invalid or expired access token', request);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError(400, 'VALIDATION_ERROR', 'Invalid JSON body', request);
  }
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return apiError(400, 'VALIDATION_ERROR', 'Current and new passwords are required', request);
  }
  const { current_password, new_password } = body as Record<string, unknown>;
  if (typeof current_password !== 'string' || !current_password ||
      typeof new_password !== 'string' || !new_password) {
    return apiError(400, 'VALIDATION_ERROR', 'Current and new passwords are required', request);
  }

  try {
    // SSO derives the account from this verified token, never from request input.
    const result = await env.SSO_SERVICE.changePassword({
      access_token: accessToken,
      current_refresh_token: currentRefreshToken,
      current_password,
      new_password,
    });
    return apiSuccess(result, request);
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    const safeErrors: Record<string, [number, string]> = {
      'Current password is incorrect': [400, 'INVALID_CURRENT_PASSWORD'],
      'New password must be different from current password': [400, 'VALIDATION_ERROR'],
      'Invalid password': [400, 'VALIDATION_ERROR'],
      'Rate limit exceeded': [429, 'RATE_LIMITED'],
      'Invalid or expired access token': [401, 'UNAUTHORIZED'],
      'User not found': [404, 'NOT_FOUND'],
    };
    const known = safeErrors[message];
    if (known) return apiError(known[0], known[1], message, request);
    return apiError(500, 'INTERNAL_ERROR', 'Unable to change password. Please try again.', request);
  }
});

import { apiError } from '../../lib/response';
import type { Env } from '../../lib/types';

interface SignupMemberBody {
  email: string;
  password: string;
  role: string;
  org_id?: string;
  redirect_url?: string;
  user_metadata?: Record<string, unknown>;
}

export async function onRequestPost(context: {
  request: Request;
  env: Env;
  data?: Record<string, unknown>;
}): Promise<Response> {
  const { request, env } = context;

  let body: SignupMemberBody;
  try {
    body = await request.json() as SignupMemberBody;
  } catch {
    return apiError(400, 'INVALID_JSON', 'Invalid JSON body', request);
  }

  if (!body.email || !body.password || !body.role) {
    return apiError(400, 'MISSING_FIELDS', 'email, password, and role are required', request);
  }

  const ip = request.headers.get('CF-Connecting-IP') || undefined;
  const ua = request.headers.get('User-Agent') || undefined;

  // Allow-list user_metadata to the fields the frontend actually sends,
  // stripping any unexpected keys before they reach the SSO Worker/JWT.
  const rawMetadata = body.user_metadata;
  const user_metadata = rawMetadata && typeof rawMetadata === 'object'
    ? {
        firstName: typeof rawMetadata.firstName === 'string' ? rawMetadata.firstName : undefined,
        lastName: typeof rawMetadata.lastName === 'string' ? rawMetadata.lastName : undefined,
        phone: typeof rawMetadata.phone === 'string' || rawMetadata.phone === null ? rawMetadata.phone : undefined,
        avatarUrl: typeof rawMetadata.avatarUrl === 'string' || rawMetadata.avatarUrl === null ? rawMetadata.avatarUrl : undefined,
      }
    : undefined;

  if (!env.SSO_SERVICE) {
    return apiError(500, 'SERVICE_UNAVAILABLE', 'Authentication service unavailable', request);
  }

  try {
    // Call RPC method directly
    const result = await env.SSO_SERVICE.signupMember({
      email: body.email,
      password: body.password,
      role: body.role,
      org_id: body.org_id,
      redirect_url: body.redirect_url,
      user_metadata,
      ip,
      ua,
    });

    // Check if RPC returned an error
    if (result.success === false || result.error) {
      const statusCode = result.status ?? 500;
      console.error('[SignupMember] RPC returned error:', result.error);

      if (statusCode === 409) {
        return apiError(409, 'EMAIL_EXISTS', result.error || 'An account with this email already exists', request);
      }
      if (statusCode === 429) {
        return apiError(429, 'RATE_LIMITED', result.error || 'Rate limit exceeded', request);
      }
      return apiError(statusCode, 'SIGNUP_FAILED', result.error || 'Signup failed', request);
    }

    // Validate that access_token exists and is a non-empty string
    if (!result.access_token || typeof result.access_token !== 'string') {
      console.error('[SignupMember] RPC returned invalid access_token:', {
        access_token: result.access_token,
        type: typeof result.access_token
      });
      return apiError(500, 'INVALID_TOKEN', 'Server failed to generate authentication token', request);
    }

    // Return SignupMemberResponse (auth-client expects { access_token, user, org, email_sent })
    const requestId = crypto.randomUUID();
    const origin = request.headers.get('Origin') ?? null;
    const { getCorsHeaders } = await import('../../lib/cors');

    const headers = new Headers({
      'Content-Type': 'application/json',
      'X-Request-ID': requestId,
      ...getCorsHeaders(origin),
    });

    // Set refresh_token as HttpOnly cookie for session persistence
    if (result.refresh_token) {
      headers.append(
        'Set-Cookie',
        `refresh_token=${result.refresh_token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=604800`
      );
    }

    // Return response without the success field (auth-client expects { access_token, user, org, email_sent })
    const { success, ...response } = result;
    return new Response(JSON.stringify(response), {
      status: 201,
      headers,
    });
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : 'Signup failed';
    console.error('[SignupMember] RPC error:', err);

    if (errMsg.includes('duplicate') || errMsg.includes('already exists')) {
      return apiError(409, 'EMAIL_EXISTS', 'An account with this email already exists', request);
    }

    return apiError(500, 'SIGNUP_FAILED', errMsg, request);
  }
}

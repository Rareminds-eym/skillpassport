/**
 * POST /api/auth/recruiter-admin-signup
 * 
 * Wrapper endpoint for recruiter admin signup.
 * Creates user with NULL organization name.
 * The real company name will be set during onboarding Step 1.
 */

import { AUTH_CONSTANTS, VALIDATION_CONSTANTS, HTTP_CONSTANTS, TIMEOUT_CONSTANTS } from '../../lib/constants';
import { createLogger, sanitizeLogContext } from '../../lib/logger';

// Password validation constants (OWASP recommendations)
const PASSWORD_MIN_LENGTH = AUTH_CONSTANTS.PASSWORD_MIN_LENGTH;
const PASSWORD_MAX_LENGTH = AUTH_CONSTANTS.PASSWORD_MAX_LENGTH;
const PASSWORD_REQUIREMENTS = {
    minLength: PASSWORD_MIN_LENGTH,
    maxLength: PASSWORD_MAX_LENGTH,
    requireUppercase: true,
    requireLowercase: true,
    requireNumber: true,
    requireSpecial: false, // Optional for better UX
};

// Email validation regex (RFC 5322 simplified)
const EMAIL_REGEX = VALIDATION_CONSTANTS.EMAIL_REGEX;

// Common weak passwords to reject (extend this list)
const WEAK_PASSWORDS = new Set(VALIDATION_CONSTANTS.WEAK_PASSWORDS);

/**
 * Validates password strength according to OWASP standards
 * @param password - Password to validate
 * @returns Object with isValid flag and error message if invalid
 */
function validatePassword(password: string): { isValid: boolean; error?: string } {
    // Check length
    if (password.length < PASSWORD_REQUIREMENTS.minLength) {
        return {
            isValid: false,
            error: `Password must be at least ${PASSWORD_REQUIREMENTS.minLength} characters`,
        };
    }

    if (password.length > PASSWORD_REQUIREMENTS.maxLength) {
        return {
            isValid: false,
            error: `Password must not exceed ${PASSWORD_REQUIREMENTS.maxLength} characters`,
        };
    }

    // Check for uppercase letter
    if (PASSWORD_REQUIREMENTS.requireUppercase && !/[A-Z]/.test(password)) {
        return {
            isValid: false,
            error: 'Password must contain at least one uppercase letter',
        };
    }

    // Check for lowercase letter
    if (PASSWORD_REQUIREMENTS.requireLowercase && !/[a-z]/.test(password)) {
        return {
            isValid: false,
            error: 'Password must contain at least one lowercase letter',
        };
    }

    // Check for number
    if (PASSWORD_REQUIREMENTS.requireNumber && !/\d/.test(password)) {
        return {
            isValid: false,
            error: 'Password must contain at least one number',
        };
    }

    // Check for special character (optional)
    if (PASSWORD_REQUIREMENTS.requireSpecial && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
        return {
            isValid: false,
            error: 'Password must contain at least one special character',
        };
    }

    // Check against common weak passwords
    if (WEAK_PASSWORDS.has(password)) {
        return {
            isValid: false,
            error: 'This password is too common. Please choose a stronger password',
        };
    }

    // Check for sequential characters (123, abc, etc.)
    if (VALIDATION_CONSTANTS.SEQUENTIAL_CHARS_REGEX.test(password)) {
        return {
            isValid: false,
            error: 'Password contains sequential characters. Please choose a stronger password',
        };
    }

    // Check for repeated characters (aaa, 111, etc.)
    if (VALIDATION_CONSTANTS.REPEATED_CHARS_REGEX.test(password)) {
        return {
            isValid: false,
            error: 'Password contains repeated characters. Please choose a stronger password',
        };
    }

    return { isValid: true };
}

/**
 * Validates email format
 * @param email - Email to validate
 * @returns Object with isValid flag and error message if invalid
 */
function validateEmail(email: string): { isValid: boolean; error?: string } {
    // Check if email is provided
    if (!email || email.trim().length === 0) {
        return {
            isValid: false,
            error: 'Email is required',
        };
    }

    // Check length (reasonable limits)
    if (email.length > VALIDATION_CONSTANTS.EMAIL_MAX_LENGTH) {
        return {
            isValid: false,
            error: 'Email address is too long',
        };
    }

    // Check format
    if (!EMAIL_REGEX.test(email)) {
        return {
            isValid: false,
            error: 'Invalid email format',
        };
    }

    // Check for spaces
    if (/\s/.test(email)) {
        return {
            isValid: false,
            error: 'Email address cannot contain spaces',
        };
    }

    // Basic domain validation
    const domain = email.split('@')[1];
    if (!domain || domain.length < 3 || !domain.includes('.')) {
        return {
            isValid: false,
            error: 'Invalid email domain',
        };
    }

    return { isValid: true };
}

interface Env {
    SSO_SERVICE: {
        signup: (params: {
            email: string;
            password: string;
            org_name: string | null;
            role: string;
            redirect_url: string;
            ip?: string;
            ua?: string;
        }) => Promise<{
            success: boolean;
            access_token?: string;
            refresh_token?: string;
            user?: {
                id: string;
                email: string;
            };
            org?: {
                id: string;
                name: string | null;
            };
            email_sent?: boolean;
            error?: string;
            status?: number;
        }>;
    };
}

interface RequestContext {
    request: Request;
    env: Env;
}

interface SignupRequestBody {
    email: string;
    password: string;
    user_metadata?: Record<string, unknown>;
    redirect_url?: string;
}

function getCorsHeaders(request: Request): Record<string, string> {
    const origin = request.headers.get('Origin') || '';
    return {
        'Access-Control-Allow-Origin': origin || '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Credentials': 'true',
    };
}

export async function onRequest(context: RequestContext) {
    const { request, env } = context;
    const corsHeaders = getCorsHeaders(request);

    // Create structured logger
    const logger = createLogger('recruiter-admin-signup', env.ENVIRONMENT || 'production');

    // Generate request ID for tracing
    const requestId = request.headers.get('X-Request-ID') || crypto.randomUUID();

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
        return new Response(null, {
            status: 204,
            headers: corsHeaders,
        });
    }

    if (request.method !== 'POST') {
        logger.warn('method_not_allowed', {
            requestId,
            method: request.method,
            path: new URL(request.url).pathname,
        });

        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    try {
        const body = await request.json() as SignupRequestBody;
        const { email, password, user_metadata, redirect_url } = body;

        logger.info('signup_initiated', {
            requestId,
            email,
            hasMetadata: !!user_metadata,
            hasRedirectUrl: !!redirect_url,
        });

        // Validate required fields
        if (!email || !password) {
            logger.warn('validation_failed_missing_fields', {
                requestId,
                hasEmail: !!email,
                hasPassword: !!password,
            });

            return new Response(JSON.stringify({
                error: 'Email and password are required'
            }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Validate email format (server-side)
        const emailValidation = validateEmail(email);
        if (!emailValidation.isValid) {
            logger.warn('validation_failed_invalid_email', {
                requestId,
                email,
                error: emailValidation.error,
            });

            return new Response(JSON.stringify({
                error: emailValidation.error
            }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Validate password strength (server-side)
        const passwordValidation = validatePassword(password);
        if (!passwordValidation.isValid) {
            logger.warn('validation_failed_weak_password', {
                requestId,
                email,
                error: passwordValidation.error,
            });

            return new Response(JSON.stringify({
                error: passwordValidation.error
            }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        if (!env.SSO_SERVICE) {
            logger.fatal('sso_service_binding_missing', undefined, {
                requestId,
                email,
            });

            return new Response(JSON.stringify({
                error: 'Authentication service unavailable'
            }), {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        logger.info('calling_sso_service', {
            requestId,
            email,
            orgNameNull: true,
            role: 'owner',
        });

        // Call SSO Worker signup via true RPC method
        const startTime = Date.now();
        const ssoResult = await env.SSO_SERVICE.signup({
            email,
            password,
            org_name: null, // Will be set during onboarding Step 1
            role: 'owner',
            redirect_url: redirect_url || request.headers.get('origin') || 'http://localhost:5173',
            ip: request.headers.get('CF-Connecting-IP') || undefined,
            ua: request.headers.get('User-Agent') || undefined,
        });
        const duration = Date.now() - startTime;

        if (!ssoResult.success || !ssoResult.access_token) {
            logger.error('sso_signup_failed', undefined, {
                requestId,
                email,
                ssoError: ssoResult?.error,
                ssoStatus: ssoResult?.status,
                duration,
            });

            // Generic message to client (no internal details exposed)
            return new Response(JSON.stringify({
                error: 'Signup failed. Please try again or contact support.',
            }), {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        logger.info('signup_successful', {
            requestId,
            email,
            userId: ssoResult.user?.id,
            orgId: ssoResult.org?.id,
            emailSent: ssoResult.email_sent,
            duration,
        });

        // Build response headers with refresh token cookie
        const responseHeaders = new Headers({
            ...corsHeaders,
            'Content-Type': 'application/json',
            'X-Signup-Timestamp': Date.now().toString(),
            'X-Request-ID': requestId, // Include request ID in response
        });

        // Set refresh token as HTTP-Only cookie
        if (ssoResult.refresh_token) {
            const cookieConfig = HTTP_CONSTANTS.REFRESH_TOKEN_COOKIE;
            responseHeaders.append(
                'Set-Cookie',
                `refresh_token=${ssoResult.refresh_token}; Path=${cookieConfig.PATH}; ${cookieConfig.HTTP_ONLY ? 'HttpOnly; ' : ''}${cookieConfig.SECURE ? 'Secure; ' : ''}SameSite=${cookieConfig.SAME_SITE}; Max-Age=${AUTH_CONSTANTS.REFRESH_TOKEN_COOKIE_MAX_AGE}`
            );
        }

        // Return success (org name is null, will be set in onboarding)
        return new Response(JSON.stringify({
            access_token: ssoResult.access_token,
            user: ssoResult.user,
            org: {
                id: ssoResult.org?.id,
                name: null, // Explicitly null until onboarding Step 1
            },
            email_sent: ssoResult.email_sent,
            // Include timestamp for retry logic (helps frontend know this is a new signup)
            signup_timestamp: Date.now(),
        }), {
            status: 201,
            headers: responseHeaders,
        });

    } catch (error: unknown) {
        logger.error('unexpected_error', error, {
            requestId,
        });

        // Generic message to client (no internal details exposed)
        return new Response(JSON.stringify({
            error: 'An unexpected error occurred. Please try again later.',
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}

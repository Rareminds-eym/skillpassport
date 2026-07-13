/**
 * POST /api/auth/recruiter-admin-signup
 * 
 * Wrapper endpoint for recruiter admin signup.
 * Creates user with NULL organization name.
 * The real company name will be set during onboarding Step 1.
 */

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

function getCorsHeaders(request: Request): Record<string, string> {
    const origin = request.headers.get('Origin') || '';
    return {
        'Access-Control-Allow-Origin': origin || '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Credentials': 'true',
    };
}

export async function onRequest(context: any) {
    const { request, env } = context as { request: Request; env: Env };
    const corsHeaders = getCorsHeaders(request);

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
        return new Response(null, {
            status: 204,
            headers: corsHeaders,
        });
    }

    if (request.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    try {
        const body = await request.json();
        const { email, password, user_metadata, redirect_url } = body;

        if (!email || !password) {
            return new Response(JSON.stringify({
                error: 'email and password are required'
            }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        if (!env.SSO_SERVICE) {
            console.error('[recruiter-admin-signup] SSO_SERVICE binding not configured');
            return new Response(JSON.stringify({
                error: 'Authentication service unavailable'
            }), {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        console.log('[recruiter-admin-signup] Creating user with null org name (to be set in onboarding):', {
            email,
        });

        // Call SSO Worker signup via true RPC method
        const ssoResult = await env.SSO_SERVICE.signup({
            email,
            password,
            org_name: null, // Will be set during onboarding Step 1
            role: 'owner',
            redirect_url: redirect_url || request.headers.get('origin') || 'http://localhost:5173',
            ip: request.headers.get('CF-Connecting-IP') || undefined,
            ua: request.headers.get('User-Agent') || undefined,
        });

        if (!ssoResult.success || !ssoResult.access_token) {
            const errorMsg = ssoResult?.error || 'SSO signup failed';
            console.error('[recruiter-admin-signup] SSO error:', errorMsg);
            return new Response(JSON.stringify({
                error: errorMsg
            }), {
                status: ssoResult?.status || 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        console.log('[recruiter-admin-signup] Success:', {
            userId: ssoResult.user?.id,
            orgId: ssoResult.org?.id,
            emailSent: ssoResult.email_sent,
        });

        // Build response headers with refresh token cookie
        const responseHeaders = new Headers({
            ...corsHeaders,
            'Content-Type': 'application/json',
            'X-Signup-Timestamp': Date.now().toString(),
        });

        // Set refresh token as HTTP-Only cookie
        if (ssoResult.refresh_token) {
            responseHeaders.append(
                'Set-Cookie',
                `refresh_token=${ssoResult.refresh_token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=604800`
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

    } catch (error: any) {
        console.error('[recruiter-admin-signup] Error:', error);

        return new Response(JSON.stringify({
            error: error?.message || 'Signup failed',
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}

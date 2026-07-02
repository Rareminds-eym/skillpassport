/**
 * POST /api/auth/recruiter-admin-signup
 * 
 * Wrapper endpoint for recruiter admin signup.
 * Creates user with NULL organization name.
 * The real company name will be set during onboarding Step 1.
 */

interface Env {
    SSO_URL: string;
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

        console.log('[recruiter-admin-signup] Creating user with null org name (to be set in onboarding):', {
            email,
        });

        // Call SSO signup endpoint directly with null org_name
        const ssoUrl = env.SSO_URL || 'http://localhost:8787';
        const signupUrl = `${ssoUrl}/auth/signup`;

        const signupPayload = {
            email,
            password,
            org_name: null, // Will be set during onboarding Step 1
            role: 'owner',
            user_metadata: user_metadata || {},
            redirect_url: redirect_url || request.headers.get('origin') || 'http://localhost:5173',
        };

        console.log('[recruiter-admin-signup] Calling SSO at:', signupUrl);

        const ssoResponse = await fetch(signupUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Origin': request.headers.get('origin') || 'http://localhost:5173',
            },
            body: JSON.stringify(signupPayload),
        });

        if (!ssoResponse.ok) {
            const errorData = await ssoResponse.json().catch(() => ({ error: 'Unknown error' }));
            console.error('[recruiter-admin-signup] SSO error:', errorData);
            throw new Error(errorData.error || 'SSO signup failed');
        }

        const result = await ssoResponse.json();

        console.log('[recruiter-admin-signup] Success:', {
            userId: result.user?.id,
            orgId: result.org?.id,
            emailSent: result.email_sent,
        });

        // Extract Set-Cookie headers from SSO response to forward to client
        const setCookieHeaders = ssoResponse.headers.getSetCookie?.() || [];

        // Build response headers with cookies
        const responseHeaders = new Headers({
            ...corsHeaders,
            'Content-Type': 'application/json',
            'X-Signup-Timestamp': Date.now().toString(),
        });

        // Forward all Set-Cookie headers from SSO
        setCookieHeaders.forEach(cookie => {
            responseHeaders.append('Set-Cookie', cookie);
        });

        // Return success (org name is null, will be set in onboarding)
        return new Response(JSON.stringify({
            access_token: result.access_token,
            user: result.user,
            org: {
                id: result.org?.id,
                name: null, // Explicitly null until onboarding Step 1
            },
            email_sent: result.email_sent,
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

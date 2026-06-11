// @public-endpoint: Proxies /auth/* to the SSO worker (SSO_SERVICE binding); authentication is the SSO worker's responsibility. (RBAC guard-matrix, task 11.1/11.4; CC-2)
/**
 * Auth Proxy for Cloudflare Pages Functions
 * Proxies all /auth/* requests to the SSO_SERVICE worker binding
 */

import type { PagesFunction } from '@cloudflare/workers-types';

interface Env {
    SSO_SERVICE?: Fetcher;
    SSO_DOMAIN?: string;
}

export const onRequest: PagesFunction<Env> = async (context) => {
    const { request, env } = context;
    const url = new URL(request.url);

    console.log('[auth-proxy] Proxying request:', request.method, url.pathname);

    // Try SSO_SERVICE binding first (faster, internal network)
    if (env.SSO_SERVICE) {
        try {
            console.log('[auth-proxy] Using SSO_SERVICE binding');

            // Create new request with same method, headers, and body
            const proxyRequest = new Request(request.url, {
                method: request.method,
                headers: request.headers,
                body: request.body,
            });

            const response = await env.SSO_SERVICE.fetch(proxyRequest);
            console.log('[auth-proxy] SSO_SERVICE response:', response.status);

            return response;
        } catch (error) {
            console.error('[auth-proxy] SSO_SERVICE binding failed:', error);
            // Fall through to HTTP fallback
        }
    }

    // Fallback to HTTP request to SSO_DOMAIN
    if (env.SSO_DOMAIN) {
        try {
            console.log('[auth-proxy] Using SSO_DOMAIN HTTP fallback:', env.SSO_DOMAIN);

            const ssoUrl = new URL(url.pathname + url.search, env.SSO_DOMAIN);

            const proxyRequest = new Request(ssoUrl.toString(), {
                method: request.method,
                headers: request.headers,
                body: request.body,
            });

            const response = await fetch(proxyRequest);
            console.log('[auth-proxy] SSO_DOMAIN response:', response.status);

            return response;
        } catch (error) {
            console.error('[auth-proxy] SSO_DOMAIN HTTP request failed:', error);
            return new Response(
                JSON.stringify({ error: 'Failed to connect to authentication service' }),
                { status: 503, headers: { 'Content-Type': 'application/json' } }
            );
        }
    }

    // No SSO service configured
    console.error('[auth-proxy] Neither SSO_SERVICE nor SSO_DOMAIN is configured');
    return new Response(
        JSON.stringify({ error: 'Authentication service not configured' }),
        { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
};

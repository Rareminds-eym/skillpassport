// @public-endpoint: Proxies /auth/* to the SSO worker (SSO_SERVICE binding); authentication is the SSO worker's responsibility. (RBAC guard-matrix, task 11.1/11.4; CC-2)
/**
 * Auth Proxy for Cloudflare Pages Functions
 * Proxies all /auth/* requests to the SSO_SERVICE worker binding (service binding)
 * No HTTP fallback - service bindings are required for security
 */

import type { PagesFunction } from '@cloudflare/workers-types';
import { createLogger } from '../lib/logger';

const logger = createLogger('auth-proxy');

interface Env {
    SSO_SERVICE?: Fetcher;
}

export const onRequest: PagesFunction<Env> = async (context) => {
    const { request, env } = context;
    const url = new URL(request.url);

    logger.info('Proxying auth request', {
        method: request.method,
        path: url.pathname,
        search: url.search,
    });

    // Validate SSO_SERVICE binding is configured
    if (!env.SSO_SERVICE) {
        logger.error('SSO_SERVICE binding not configured - cannot proxy auth requests');
        return new Response(
            JSON.stringify({
                error: 'Authentication service not configured',
                code: 'SSO_SERVICE_NOT_CONFIGURED',
            }),
            {
                status: 503,
                headers: { 'Content-Type': 'application/json' },
            }
        );
    }

    try {
        logger.debug('Calling SSO_SERVICE binding', { method: request.method, path: url.pathname });

        // Create new request with same method, headers, and body
        const proxyRequest = new Request(request.url, {
            method: request.method,
            headers: request.headers,
            body: request.body,
        });

        const response = await env.SSO_SERVICE.fetch(proxyRequest);

        logger.info('SSO_SERVICE response received', {
            status: response.status,
            statusText: response.statusText,
            path: url.pathname,
        });

        return response;
    } catch (error) {
        logger.error('SSO_SERVICE binding call failed', error, {
            method: request.method,
            path: url.pathname,
            errorMessage: error instanceof Error ? error.message : String(error),
        });

        return new Response(
            JSON.stringify({
                error: 'Failed to connect to authentication service',
                code: 'SSO_SERVICE_ERROR',
                details: error instanceof Error ? error.message : 'Unknown error',
            }),
            {
                status: 503,
                headers: { 'Content-Type': 'application/json' },
            }
        );
    }
};

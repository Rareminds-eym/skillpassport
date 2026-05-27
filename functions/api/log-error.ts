/**
 * Error Logging Endpoint
 * 
 * POST /api/log-error
 * 
 * Receives error logs from the frontend and stores them in the database
 * for monitoring and analysis.
 */

import type { PagesFunction } from '@cloudflare/workers-types';
import { withAuth } from '../lib/auth';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { getServiceClient } from '../lib/supabase';
import { apiSuccess, apiError, handleCorsOptions } from '../lib/response';

interface ErrorLogRequest {
    timestamp: string;
    userId: string;
    errorType: string;
    errorMessage: string;
    context: Record<string, any>;
    stackTrace?: string;
}

export const onRequest: PagesFunction = async (context) => {
    // Handle CORS preflight
    if (context.request.method === 'OPTIONS') {
        return handleCorsOptions(context.request);
    }

    // Only accept POST requests
    if (context.request.method !== 'POST') {
        return new Response('Method not allowed', { status: 405 });
    }

    return withAuth(async (authContext: AuthenticatedContext) => {
        const startTime = Date.now();
        const request = authContext.request;

        try {
            // Parse request body
            let body: ErrorLogRequest;
            try {
                body = await request.json() as ErrorLogRequest;
            } catch {
                return apiError(400, 'INVALID_JSON', 'Invalid JSON body', request);
            }

            // Validate required fields
            if (!body.userId || !body.errorType || !body.errorMessage) {
                return apiError(400, 'VALIDATION_ERROR', 'Missing required fields: userId, errorType, errorMessage', request);
            }

            // Get Supabase client
            const env = authContext.env as { SUPABASE_URL: string; SUPABASE_SERVICE_ROLE_KEY: string };
            const supabase = getServiceClient(env);

            // Store error log in database
            const { error: dbError } = await supabase
                .from('error_logs')
                .insert({
                    user_id: body.userId,
                    error_type: body.errorType,
                    error_message: body.errorMessage,
                    context: body.context || {},
                    stack_trace: body.stackTrace,
                    created_at: body.timestamp || new Date().toISOString(),
                });

            if (dbError) {
                console.error('[LogError] Database error:', dbError);
                console.error('[LogError] Failed to store error log:', {
                    userId: body.userId,
                    errorType: body.errorType,
                    errorMessage: body.errorMessage,
                    dbError: dbError.message,
                });
            }

            return apiSuccess({ success: true, message: 'Error logged successfully', duration: Date.now() - startTime }, request);
        } catch (error) {
            console.error('[LogError] Unexpected error:', error);
            return apiError(500, 'INTERNAL_ERROR', error instanceof Error ? error.message : 'Unknown error', request);
        }
    })(context);
};

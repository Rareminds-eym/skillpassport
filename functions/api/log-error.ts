/**
 * Error Logging Endpoint
 * 
 * POST /api/log-error
 * 
 * Receives error logs from the frontend and stores them in the database
 * for monitoring and analysis.
 */

import type { PagesFunction } from '@cloudflare/workers-types';
import { getServiceClient } from '../lib/supabase';

interface ErrorLogRequest {
    timestamp: string;
    userId: string;
    errorType: string;
    errorMessage: string;
    context: Record<string, any>;
    stackTrace?: string;
}

export const onRequestPost: PagesFunction = async (context) => {
    const startTime = Date.now();

    try {
        // Parse request body
        let body: ErrorLogRequest;
        try {
            body = await context.request.json() as ErrorLogRequest;
        } catch {
            return new Response(
                JSON.stringify({ error: 'Invalid JSON body' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // Validate required fields
        if (!body.userId || !body.errorType || !body.errorMessage) {
            return new Response(
                JSON.stringify({ error: 'Missing required fields: userId, errorType, errorMessage' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // Get Supabase client
        const env = context.env as { SUPABASE_URL: string; SUPABASE_SERVICE_ROLE_KEY: string };
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

            // Don't fail the request if database insert fails
            // Just log to console and return success
            console.error('[LogError] Failed to store error log:', {
                userId: body.userId,
                errorType: body.errorType,
                errorMessage: body.errorMessage,
                dbError: dbError.message,
            });
        }

        const duration = Date.now() - startTime;

        return new Response(
            JSON.stringify({
                success: true,
                message: 'Error logged successfully',
                duration,
            }),
            {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            }
        );
    } catch (error) {
        console.error('[LogError] Unexpected error:', error);

        return new Response(
            JSON.stringify({
                error: 'Internal server error',
                message: error instanceof Error ? error.message : 'Unknown error',
            }),
            {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            }
        );
    }
};

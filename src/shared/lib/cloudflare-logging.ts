/**
 * Cloudflare Pages Functions Logging Utilities
 * 
 * PRODUCTION-SAFE: Handles initialization of logging with runtime environment variables
 * Uses request-scoped logging to prevent race conditions in concurrent requests
 */

import type { PagesFunction } from '../../functions-lib/types';
import { setRequestLogLevel, getLogLevelFromEnv } from '../config/logging';

/**
 * Environment bindings for Cloudflare Pages Functions
 * Extend this interface with your actual environment variables
 */
export interface CloudflareEnv {
  LOG_LEVEL?: string;
  // Add other environment variables here
  // SUPABASE_URL?: string;
  // SUPABASE_ANON_KEY?: string;
}

/**
 * PRODUCTION-SAFE: Initialize logging for a Cloudflare Pages Function request
 * This sets the log level for THIS REQUEST ONLY, not globally
 * 
 * @param context - The request context object (used as unique identifier)
 * @param env - The environment bindings
 * 
 * @example
 * export const onRequest: PagesFunction<CloudflareEnv> = async (context) => {
 *   initializeLogging(context, context.env);
 *   const logger = getLogger('my-handler').forRequest(context);
 *   logger.info('Request started');
 *   // ... rest of your handler
 * };
 */
export function initializeLogging(context: object, env: CloudflareEnv): void {
  const logLevel = getLogLevelFromEnv(env.LOG_LEVEL);
  setRequestLogLevel(context, logLevel);
}

/**
 * Type for Cloudflare Pages Functions context
 * Extracted from PagesFunction handler signature
 */
export type PagesContext<Env = CloudflareEnv> = Parameters<PagesFunction<Env>>[0];

/**
 * PRODUCTION-SAFE: Wrapper for Pages Functions that automatically initializes logging
 * 
 * @example
 * export const onRequest = withLogging(async (context) => {
 *   const logger = getLogger('my-handler').forRequest(context);
 *   logger.info('Logging is already initialized');
 *   return new Response('OK');
 * });
 */
export function withLogging<Env extends CloudflareEnv = CloudflareEnv>(
  handler: PagesFunction<Env>
): PagesFunction<Env> {
  return async (context) => {
    initializeLogging(context, context.env);
    return handler(context);
  };
}

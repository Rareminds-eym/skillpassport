/**
 * Email Worker Configuration
 * Single source of truth for email worker URL and API key
 */

import type { PagesEnv } from '../../../../src/functions-lib/types';

export interface EmailWorkerConfig {
  url: string;
  apiKey: string;
}

/**
 * Get and validate email worker configuration from environment
 * 
 * @param env - Pages environment variables
 * @returns Validated email worker configuration
 * @throws Error if required environment variables are missing or invalid
 * 
 * @example
 * ```typescript
 * const config = getEmailWorkerConfig(env);
 * // config.url is guaranteed to be a valid URL
 * // config.apiKey is guaranteed to be non-empty
 * ```
 */
export function getEmailWorkerConfig(env: PagesEnv): EmailWorkerConfig {
  const url = env.EMAIL_API_URL;
  const apiKey = env.EMAIL_API_KEY;

  // Validate URL presence
  if (!url || url.trim() === '') {
    throw new Error(
      'EMAIL_API_URL environment variable is required. ' +
      'Set it in .dev.vars (local) or Cloudflare Pages settings (production)'
    );
  }

  // Validate URL format
  try {
    new URL(url);
  } catch {
    throw new Error(
      `EMAIL_API_URL is not a valid URL: "${url}". ` +
      'Expected format: http://localhost:9001 or https://email-worker.example.com'
    );
  }

  // Validate API key presence
  if (!apiKey || apiKey.trim() === '') {
    throw new Error(
      'EMAIL_API_KEY environment variable is required. ' +
      'Set it in .dev.vars (local) or Cloudflare Pages settings (production)'
    );
  }

  return {
    url: url.trim(),
    apiKey: apiKey.trim(),
  };
}

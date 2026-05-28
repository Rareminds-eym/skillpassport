/**
 * Email Worker Configuration
 * Single source of truth for email worker URL and API key
 */

import type { PagesEnv } from '../../../lib/types';

export interface EmailWorkerConfig {
  url: string;
  apiKey: string;
}

/**
 * Type guard to check if a value is a non-empty string
 */
function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Validates and extracts a required environment variable
 * 
 * @param env - Environment object
 * @param key - Environment variable key
 * @param description - Human-readable description for error messages
 * @returns The validated environment variable value
 * @throws Error if the environment variable is missing or empty
 */
function getRequiredEnvVar(
  env: PagesEnv,
  key: keyof PagesEnv,
  description: string
): string {
  const value = env[key];

  if (!isNonEmptyString(value)) {
    throw new Error(
      `${key} environment variable is required. ` +
      `${description}. ` +
      'Set it in .dev.vars (local) or Cloudflare Pages settings (production)'
    );
  }

  return value.trim();
}

/**
 * Validates URL format
 * 
 * @param url - URL string to validate
 * @param varName - Environment variable name for error messages
 * @throws Error if URL is invalid
 */
function validateUrl(url: string, varName: string): void {
  try {
    new URL(url);
  } catch {
    throw new Error(
      `${varName} is not a valid URL: "${url}". ` +
      'Expected format: http://localhost:9001 or https://email-worker.example.com'
    );
  }
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
  // Type-safe extraction with validation
  const url = getRequiredEnvVar(
    env,
    'EMAIL_API_URL',
    'URL of the email worker service endpoint'
  );

  const apiKey = getRequiredEnvVar(
    env,
    'EMAIL_API_KEY',
    'API key for authenticating requests to the email worker'
  );

  // Validate URL format
  validateUrl(url, 'EMAIL_API_URL');

  return {
    url,
    apiKey,
  };
}

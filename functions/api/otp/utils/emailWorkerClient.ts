/**
 * Email Worker Client Utility
 * Handles communication with the email-worker service for OTP operations
 */

interface SendOtpRequest {
  mobileNumber: string;
  countryCode: string;
  flowType: 'SMS';
}

interface SendOtpResponse {
  success: boolean;
  message?: string;
  error?: string;
  timeout?: string;
  verificationId?: string;
}

interface VerifyOtpRequest {
  mobileNumber: string;
  verificationId: string;
  code: string;
  countryCode: string;
}

interface VerifyOtpResponse {
  success: boolean;
  message?: string;
  error?: string;
  verified?: boolean;
}

interface EmailWorkerConfig {
  url: string;
  apiKey: string;
}

/**
 * Custom error class for email-worker related errors
 */
export class EmailWorkerError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EmailWorkerError';
  }
}

/**
 * Private helper that handles fetch, parse, shape guard, and error wrapping
 * 
 * @param config - Email worker configuration
 * @param endpoint - API endpoint path (e.g., '/otp/send')
 * @param body - Request payload
 * @returns Parsed and validated response
 * @throws EmailWorkerError with descriptive message if request fails
 */
async function callEmailWorker<T extends object>(
  config: EmailWorkerConfig,
  endpoint: string,
  body: unknown
): Promise<T> {
  const requestId = crypto.randomUUID();
  const url = `${config.url}${endpoint}`;
  
  try {
    // Make the HTTP request with 5 second timeout
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': config.apiKey,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(5000),
    });

    // Safely parse JSON response
    let result: unknown;
    try {
      result = await response.json();
    } catch (parseError) {
      throw new EmailWorkerError(
        `Failed to parse response from email-worker. Status: ${response.status} [${requestId}]`
      );
    }

    // Shape guard: reject non-object responses
    if (typeof result !== 'object' || result === null) {
      throw new EmailWorkerError(
        `Invalid response format from email-worker: expected object [${requestId}]`
      );
    }

    // Check if request was successful
    if (!response.ok) {
      const errorMessage = (result as Record<string, unknown>).error || 'Request failed';
      // Extract just the user-friendly message, log technical details
      console.error(`[Email-worker] ${response.status} error [${requestId}]:`, errorMessage);
      throw new EmailWorkerError(String(errorMessage));
    }

    // Only cast to T after all guards pass
    return result as T;
  } catch (error) {
    // Re-throw if it's already our custom error
    if (error instanceof EmailWorkerError) {
      throw error;
    }

    // Network or other fetch errors
    if (error instanceof Error) {
      throw new EmailWorkerError(`Failed to connect to email-worker: ${error.message} [${requestId}]`);
    }

    // Unknown error type
    throw new EmailWorkerError(`An unexpected error occurred [${requestId}]`);
  }
}

/**
 * Sends an OTP SMS request to the email-worker service
 * 
 * @param config - Email worker configuration (URL and API key)
 * @param request - OTP request payload
 * @returns Parsed response from email-worker
 * @throws EmailWorkerError with descriptive message if request fails
 * 
 * @example
 * ```typescript
 * const response = await sendOtpSms(
 *   { url: 'https://worker.example.com', apiKey: 'secret' },
 *   { mobileNumber: '9876543210', countryCode: '91', flowType: 'SMS' }
 * );
 * ```
 */
export async function sendOtpSms(
  config: EmailWorkerConfig,
  request: SendOtpRequest
): Promise<SendOtpResponse> {
  return callEmailWorker<SendOtpResponse>(config, '/otp/send', request);
}

/**
 * Verifies an OTP code via the email-worker service
 * 
 * @param config - Email worker configuration (URL and API key)
 * @param request - OTP verification payload
 * @returns Parsed response from email-worker
 * @throws EmailWorkerError with descriptive message if request fails
 * 
 * @example
 * ```typescript
 * const response = await verifyOtpSms(
 *   { url: 'https://worker.example.com', apiKey: 'secret' },
 *   { mobileNumber: '9876543210', verificationId: 'abc123', code: '123456', countryCode: '91' }
 * );
 * ```
 */
export async function verifyOtpSms(
  config: EmailWorkerConfig,
  request: VerifyOtpRequest
): Promise<VerifyOtpResponse> {
  return callEmailWorker<VerifyOtpResponse>(config, '/otp/verify', request);
}

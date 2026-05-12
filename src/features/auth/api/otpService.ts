/**
 * OTP Service - Frontend client for OTP API
 * Connects to Cloudflare Pages Function (which proxies to email-worker)
 * 
 * ARCHITECTURE:
 * Frontend → /api/otp/* → functions/api/otp (proxy) → email-worker → MessageCentral
 * 
 * OTP LENGTH VERIFICATION:
 * - Frontend: 4 digits (this file, line 14)
 * - Backend: 4-8 digits accepted (MessageCentralService.ts:35-37)
 * - Provider: MessageCentral sends 4-digit OTPs
 * - Status: ✅ Frontend and backend are aligned
 */

import { getApiUrl } from '@/shared/api/apiUtils';
import { createTimeoutSignal } from '@/shared/lib/createTimeoutSignal';

const API_URL = getApiUrl('otp');
const OTP_DIGIT_LENGTH = 4; // MessageCentral provider sends 4-digit OTPs
const OTP_REQUEST_TIMEOUT_MS = 10_000;

interface OtpResponse {
  success: boolean;
  message?: string;
  error?: string;
  requestId?: string;
  data?: {
    phone?: string;
    expiresIn?: number;
    verificationId?: string;
    verified?: boolean;
    verificationToken?: string;
  };
}

/**
 * Custom error class for OTP API errors
 */
class OtpApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly requestId?: string
  ) {
    super(message);
    this.name = 'OtpApiError';
  }
}

/**
 * Validate phone number
 * @param phone - Phone number (digits only)
 * @returns true if valid, error message if invalid
 */
function validatePhone(phone: string): true | string {
  const cleanPhone = phone.replace(/\D/g, '');
  if (cleanPhone.length < 7 || cleanPhone.length > 15) {
    return 'Please enter a valid phone number (7-15 digits)';
  }
  return true;
}

function sanitisePhone(phone: string): string {
  return phone.replace(/\D/g, '');
}

function handleOtpError(error: unknown): OtpResponse {
  if (error instanceof OtpApiError) {
    return { success: false, error: error.message, requestId: error.requestId };
  }
  if (error instanceof Error) {
    return { success: false, error: 'Network error. Please check your connection and try again.' };
  }
  return { success: false, error: 'An unexpected error occurred' };
}

/**
 * Type guard to check if response is OtpResponse
 */
function isOtpResponse(data: unknown): data is OtpResponse {
  if (typeof data !== 'object' || data === null) {
    return false;
  }
  const obj = data as Record<string, unknown>;
  return typeof obj.success === 'boolean';
}

/**
 * Make API request with proper error handling
 */
async function makeOtpRequest(
  endpoint: string,
  body: Record<string, unknown>
): Promise<OtpResponse> {
  const requestId = typeof crypto?.randomUUID === 'function'
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
  
  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Request-ID': requestId,
      },
      body: JSON.stringify(body),
      signal: createTimeoutSignal(OTP_REQUEST_TIMEOUT_MS) ?? null,
    });

    // Parse JSON safely
    let result: unknown;
    try {
      result = await response.json();
    } catch (parseError) {
      throw new OtpApiError(
        'Invalid response from server',
        response.status,
        requestId
      );
    }

    // Validate response shape
    if (!isOtpResponse(result)) {
      throw new OtpApiError(
        'Unexpected response format from server',
        response.status,
        requestId
      );
    }

    // Handle non-OK responses
    if (!response.ok) {
      throw new OtpApiError(
        result.error ?? 'Request failed',
        response.status,
        requestId
      );
    }

    return result;
  } catch (error) {
    // Re-throw OtpApiError as-is
    if (error instanceof OtpApiError) {
      throw error;
    }

    // Timeout fired — surface a clear message with HTTP 408
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new OtpApiError(
        'Request timed out. Please try again.',
        408,
        requestId
      );
    }

    // Network or other errors
    if (error instanceof Error) {
      throw new OtpApiError(
        `Network error: ${error.message}`,
        undefined,
        requestId
      );
    }

    // Unknown error
    throw new OtpApiError(
      'An unexpected error occurred',
      undefined,
      requestId
    );
  }
}

/**
 * Send OTP to phone number
 * Calls Pages Function which proxies to email-worker
 * 
 * @param phone - Phone number (digits only, 7-15 digits)
 * @param countryCode - Country code with + prefix (default: '+91')
 * @returns OtpResponse with success status and verification ID
 * 
 * VERIFIED: countryCode parameter is supported throughout the stack:
 * - Frontend: otpService.ts → /api/otp/send with { phone, countryCode }
 * - Backend: functions/api/otp/handlers/send.ts → accepts countryCode
 * - Worker: email-worker client → SendOtpRequest includes countryCode
 * - Provider: MessageCentralService.sendOTP(mobileNumber, countryCode)
 */
export async function sendOtp(phone: string, countryCode = '+91'): Promise<OtpResponse> {
  try {
    // Validate phone number
    const cleanPhone = sanitisePhone(phone);
    const validation = validatePhone(cleanPhone);
    if (validation !== true) {
      return { success: false, error: validation };
    }

    const result = await makeOtpRequest('/send', { 
      phone: cleanPhone, 
      countryCode 
    });

    return result;
  } catch (error) {
    return handleOtpError(error);
  }
}

interface VerifyOtpOptions {
  phone: string;
  otp: string;
  verificationId: string;
  countryCode?: string;
}

/**
 * Verify OTP
 * Calls Pages Function which proxies to email-worker
 * 
 * @param options - Verification options object
 * @param options.phone - Phone number (digits only, 7-15 digits)
 * @param options.otp - OTP code (4 digits)
 * @param options.verificationId - Verification ID from sendOtp response
 * @param options.countryCode - Country code with + prefix (default: '+91')
 * @returns OtpResponse with success status and verification result
 * 
 * VERIFIED: All 4 parameters are supported throughout the stack:
 * - Frontend: otpService.ts → /api/otp/verify with { phone, otp, countryCode, verificationId }
 * - Backend: functions/api/otp/handlers/verify.ts → accepts all 4 parameters
 * - Worker: email-worker client → VerifyOtpRequest includes all 4 parameters
 * - Provider: MessageCentralService.verifyOTP(mobileNumber, verificationId, code, countryCode)
 */
export async function verifyOtp({
  phone,
  otp,
  verificationId,
  countryCode = '+91',
}: VerifyOtpOptions): Promise<OtpResponse> {
  try {
    // Validate inputs
    const cleanPhone = sanitisePhone(phone);
    const cleanOtp = otp.replace(/\D/g, '');
    
    const validation = validatePhone(cleanPhone);
    if (validation !== true) {
      return { success: false, error: validation };
    }
    
    if (cleanOtp.length !== OTP_DIGIT_LENGTH) {
      return { success: false, error: `Please enter a valid ${OTP_DIGIT_LENGTH} digit OTP code` };
    }

    const result = await makeOtpRequest('/verify', {
      phone: cleanPhone,
      otp: cleanOtp,
      countryCode,
      verificationId,
    });

    return result;
  } catch (error) {
    return handleOtpError(error);
  }
}

/**
 * Resend OTP
 * Calls Pages Function which proxies to email-worker
 */
export async function resendOtp(phone: string, countryCode = '+91'): Promise<OtpResponse> {
  try {
    const cleanPhone = sanitisePhone(phone);
    const validation = validatePhone(cleanPhone);
    if (validation !== true) {
      return { success: false, error: validation };
    }

    const result = await makeOtpRequest('/resend', {
      phone: cleanPhone,
      countryCode,
    });

    return result;
  } catch (error) {
    return handleOtpError(error);
  }
}

export default {
  sendOtp,
  verifyOtp,
  resendOtp,
};

/**
 * Resend OTP handler
 * Forwards requests to email-worker (MessageCentral provider)
 * 
 * MIGRATION NOTE:
 * - Old: Regenerate OTP and send via AWS SNS
 * - New: Proxy to email-worker send endpoint (no separate resend)
 */

import type { PagesEnv } from '../../../lib/types';
import { apiSuccess, apiError } from '../../../lib/response';
import { formatPhoneNumber } from '../utils/formatPhone';

interface ResendOtpBody {
  phone: string;
  countryCode?: string;
}

/**
 * Parse timeout value with explicit validation and fallback
 * @param value - The timeout string from the API response
 * @param fallback - Default value to use (default: 60)
 * @returns Parsed timeout in seconds, or fallback if invalid
 */
function parseTimeoutSeconds(value: string | undefined, fallback = 60): number {
  if (value === undefined) {
    return fallback;
  }
  
  if (value === '') {
    console.warn('OTP timeout is empty string, using fallback:', fallback);
    return fallback;
  }
  
  const parsed = parseInt(value, 10);
  
  if (isNaN(parsed)) {
    console.warn('OTP timeout is non-numeric, using fallback:', { received: value, fallback });
    return fallback;
  }
  
  if (parsed <= 0) {
    console.warn('OTP timeout is zero or negative, using fallback:', { received: value, fallback });
    return fallback;
  }
  
  return parsed;
}

export async function resendOtpHandler(
  body: ResendOtpBody,
  env: PagesEnv
): Promise<Response> {
  try {
    const { phone, countryCode = '+91' } = body;
    
    if (!phone) {
      return apiError(400, 'VALIDATION_ERROR', 'Phone number is required', undefined);
    }
    
    let formattedPhone: string;
    try {
      formattedPhone = formatPhoneNumber(phone, countryCode);
    } catch (error) {
      if (error instanceof Error) {
        return apiError(400, 'VALIDATION_ERROR', error.message, undefined);
      }
      return apiError(400, 'VALIDATION_ERROR', 'Failed to format phone number', undefined);
    }

    if (formattedPhone.length < 7 || formattedPhone.length > 15) {
      return apiError(400, 'VALIDATION_ERROR', 'Invalid phone number. Must be 7-15 digits.', undefined);
    }
    
    if (!env.EMAIL_SERVICE) {
      return apiError(500, 'INTERNAL_ERROR', 'EMAIL_SERVICE binding is missing', undefined);
    }
    
    const cleanCountryCode = countryCode.replace('+', '');
    const result = await env.EMAIL_SERVICE.sendOTP({
      mobileNumber: formattedPhone,
      countryCode: cleanCountryCode,
      flowType: 'SMS',
    });
    
    if (!result.success) {
      return apiError(400, 'ERROR', result.error || 'Failed to resend OTP', undefined);
    }
    
    const full = `${countryCode}${formattedPhone}`;
    const masked = full.length > 4 ? full.slice(0, -4) + '****' : '****';
    
    return apiSuccess({
      message: result.message || 'OTP resent successfully',
      phone: masked,
      expiresIn: parseTimeoutSeconds(result.timeout),
      verificationId: result.verificationId,
    }, undefined);
  } catch (error) {
    if (error instanceof Error) {
      return apiError(500, 'INTERNAL_ERROR', error.message, undefined);
    }
    
    return apiError(500, 'INTERNAL_ERROR', 'An unexpected error occurred', undefined);
  }
}

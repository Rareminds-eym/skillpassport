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
import { getEmailWorkerConfig } from '../config/emailWorkerConfig';
import { sendOtpSms, EmailWorkerError } from '../utils/emailWorkerClient';
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
  // undefined is expected when field is missing - use fallback silently
  if (value === undefined) {
    return fallback;
  }
  
  // Empty string should use fallback with warning
  if (value === '') {
    console.warn('OTP timeout is empty string, using fallback:', fallback);
    return fallback;
  }
  
  // Try to parse the value
  const parsed = parseInt(value, 10);
  
  // Check for NaN (non-numeric strings like "abc")
  if (isNaN(parsed)) {
    console.warn('OTP timeout is non-numeric, using fallback:', { received: value, fallback });
    return fallback;
  }
  
  // Check for zero or negative values
  if (parsed <= 0) {
    console.warn('OTP timeout is zero or negative, using fallback:', { received: value, fallback });
    return fallback;
  }
  
  // Valid positive number
  return parsed;
}

export async function resendOtpHandler(
  body: ResendOtpBody,
  env: PagesEnv
): Promise<Response> {
  try {
    const { phone, countryCode = '+91' } = body;
    
    // Validate phone
    if (!phone) {
      return apiError(400, 'VALIDATION_ERROR', 'Phone number is required', undefined);
    }
    
    // Format phone number
    let formattedPhone: string;
    try {
      formattedPhone = formatPhoneNumber(phone, countryCode);
    } catch (error) {
      if (error instanceof Error) {
        return apiError(400, 'VALIDATION_ERROR', error.message, undefined);
      }
      return apiError(400, 'VALIDATION_ERROR', 'Failed to format phone number', undefined);
    }

    // Validate phone length
    if (formattedPhone.length < 7 || formattedPhone.length > 15) {
      return apiError(400, 'VALIDATION_ERROR', 'Invalid phone number. Must be 7-15 digits.', undefined);
    }
    
    // Get and validate email worker configuration
    const emailWorkerConfig = getEmailWorkerConfig(env);
    
    // Forward request to email-worker (resend = send again)
    const cleanCountryCode = countryCode.replace('+', '');
    const result = await sendOtpSms(emailWorkerConfig, {
      mobileNumber: formattedPhone,
      countryCode: cleanCountryCode,
      flowType: 'SMS',
    });
    
    // Return response in the format expected by frontend
    const full = `${countryCode}${formattedPhone}`;
    const masked = full.length > 4 ? full.slice(0, -4) + '****' : '****';
    
    return apiSuccess({
      message: result.message || 'OTP resent successfully',
      data: {
        phone: masked,
        expiresIn: parseTimeoutSeconds(result.timeout),
        verificationId: result.verificationId,
      },
    }, undefined);
  } catch (error) {
    if (error instanceof EmailWorkerError) {
      // Downstream service error
      return apiError(502, 'ERROR', error.message, undefined);
    }
    
    if (error instanceof Error) {
      // Unexpected error
      return apiError(500, 'INTERNAL_ERROR', error.message, undefined);
    }
    
    // Unknown error type
    return apiError(500, 'INTERNAL_ERROR', 'An unexpected error occurred', undefined);
  }
}

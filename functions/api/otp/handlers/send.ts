/**
 * Send OTP handler
 * Forwards requests to email-worker (MessageCentral provider)
 * 
 * MIGRATION NOTE:
 * - Old: Direct AWS SNS integration
 * - New: Proxy to email-worker which uses MessageCentral
 */

import type { PagesEnv } from '../../../../src/functions-lib/types';
import { jsonResponse } from '../../../../src/functions-lib';
import { getEmailWorkerConfig } from '../config/emailWorkerConfig';
import { sendOtpSms, EmailWorkerError } from '../utils/emailWorkerClient';
import { formatPhoneNumber } from '../utils/formatPhone';

interface SendOtpBody {
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

export async function sendOtpHandler(
  body: SendOtpBody,
  env: PagesEnv
): Promise<Response> {
  try {
    const { phone, countryCode = '+91' } = body;
    
    // Validate phone
    if (!phone) {
      return jsonResponse({ success: false, error: 'Phone number is required' }, 400);
    }
    
    // Format phone number
    let formattedPhone: string;
    try {
      formattedPhone = formatPhoneNumber(phone, countryCode);
    } catch (error) {
      if (error instanceof Error) {
        return jsonResponse({ success: false, error: error.message }, 400);
      }
      return jsonResponse({ success: false, error: 'Failed to format phone number' }, 400);
    }

    // Validate phone length
    if (formattedPhone.length < 7 || formattedPhone.length > 15) {
      return jsonResponse({ 
        success: false, 
        error: 'Invalid phone number. Must be 7-15 digits.' 
      }, 400);
    }
    
    // Get and validate email worker configuration
    const emailWorkerConfig = getEmailWorkerConfig(env);
    
    // Forward request to email-worker
    const cleanCountryCode = countryCode.replace('+', '');
    const result = await sendOtpSms(emailWorkerConfig, {
      mobileNumber: formattedPhone,
      countryCode: cleanCountryCode,
      flowType: 'SMS',
    });
    
    // Return response in the format expected by frontend
    const full = `${countryCode}${formattedPhone}`;
    const masked = full.length > 4 ? full.slice(0, -4) + '****' : '****';
    
    return jsonResponse({
      success: true,
      message: result.message || 'OTP sent successfully',
      data: {
        phone: masked,
        expiresIn: parseTimeoutSeconds(result.timeout),
        verificationId: result.verificationId,
      },
    });
  } catch (error) {
    if (error instanceof EmailWorkerError) {
      // Downstream service error
      return jsonResponse(
        { success: false, error: error.message },
        502
      );
    }
    
    if (error instanceof Error) {
      // Unexpected error
      return jsonResponse(
        { success: false, error: error.message },
        500
      );
    }
    
    // Unknown error type
    return jsonResponse(
      { success: false, error: 'An unexpected error occurred' },
      500
    );
  }
}

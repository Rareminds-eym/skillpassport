/**
 * Resend OTP handler
 * Forwards requests to email-worker (MessageCentral provider)
 * 
 * MIGRATION NOTE:
 * - Old: Regenerate OTP and send via AWS SNS
 * - New: Proxy to email-worker send endpoint (no separate resend)
 */

import type { PagesEnv } from '../../../../src/functions-lib/types';
import { jsonResponse } from '../../../../src/functions-lib';
import { getEmailWorkerConfig } from '../config/emailWorkerConfig';

/**
 * Format phone number for email-worker API
 */
function formatPhoneNumber(phone: string, countryCode: string = '+91'): string {
  let cleaned = phone.replace(/\D/g, '');
  cleaned = cleaned.replace(/^0+/, '');
  
  const numericCountryCode = countryCode.replace('+', '');
  if (cleaned.startsWith(numericCountryCode) && cleaned.length > 10) {
    cleaned = cleaned.slice(numericCountryCode.length);
  }
  
  return cleaned;
}

export async function resendOtpHandler(
  body: any,
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
    } catch (error: any) {
      return jsonResponse({ success: false, error: error.message }, 400);
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
    
    // Forward request to email-worker (resend = send again)
    const cleanCountryCode = countryCode.replace('+', '');
    const response = await fetch(`${emailWorkerConfig.url}/otp/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': emailWorkerConfig.apiKey,
      },
      body: JSON.stringify({
        mobileNumber: formattedPhone,
        countryCode: cleanCountryCode,
        flowType: 'SMS',
      }),
    });

    const result = await response.json();
    
    if (!response.ok) {
      return jsonResponse(
        { 
          success: false, 
          error: result.error || 'Failed to resend OTP. Please try again.',
        },
        response.status
      );
    }
    
    // Return response in the format expected by frontend
    return jsonResponse({
      success: true,
      message: result.message || 'OTP resent successfully',
      data: {
        phone: `${countryCode}${formattedPhone}`.slice(0, -4) + '****',
        expiresIn: parseInt(result.timeout || '60', 10),
        verificationId: result.verificationId,
      },
    });
  } catch (error: any) {
    return jsonResponse(
      { success: false, error: error.message || 'Failed to resend OTP' },
      500
    );
  }
}

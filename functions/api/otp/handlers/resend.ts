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
import { sendOtpSms, EmailWorkerError } from '../utils/emailWorkerClient';
import { formatPhoneNumber } from '../utils/formatPhone';

interface ResendOtpBody {
  phone: string;
  countryCode?: string;
}

export async function resendOtpHandler(
  body: ResendOtpBody,
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
    
    return jsonResponse({
      success: true,
      message: result.message || 'OTP resent successfully',
      data: {
        phone: masked,
        expiresIn: parseInt(result.timeout || '60', 10),
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

/**
 * Verify OTP handler
 * Forwards requests to email-worker (MessageCentral provider)
 * 
 * MIGRATION NOTE:
 * - Old: Supabase-based OTP storage and verification
 * - New: Proxy to email-worker which uses MessageCentral
 */

import type { PagesEnv } from '../../../../src/functions-lib/types';
import { jsonResponse } from '../../../../src/functions-lib';
import { getEmailWorkerConfig } from '../config/emailWorkerConfig';
import { verifyOtpSms, EmailWorkerError } from '../utils/emailWorkerClient';
import { formatPhoneNumber } from '../utils/formatPhone';

interface VerifyOtpBody {
  phone: string;
  otp: string;
  countryCode?: string;
  verificationId: string;
}

interface VerifyOtpResponseData {
  phone: string;
  verified: boolean;
  verificationToken?: string;
}

export async function verifyOtpHandler(
  body: VerifyOtpBody,
  env: PagesEnv
): Promise<Response> {
  try {
    // Guard against null/non-object body before destructuring
    if (!body || typeof body !== 'object') {
      return jsonResponse({ success: false, error: 'Invalid request body' }, 400);
    }
    
    const { phone, otp, countryCode = '+91', verificationId } = body;
    
    // Validate inputs
    if (!phone) {
      return jsonResponse({ success: false, error: 'Phone number is required' }, 400);
    }
    
    if (!otp) {
      return jsonResponse({ success: false, error: 'OTP is required' }, 400);
    }

    // Strict verificationId validation with trim
    if (typeof verificationId !== 'string' || verificationId.trim().length === 0) {
      return jsonResponse({ 
        success: false, 
        error: 'Verification ID is required. Please request a new OTP.' 
      }, 400);
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
    const result = await verifyOtpSms(emailWorkerConfig, {
      mobileNumber: formattedPhone,
      verificationId: verificationId.trim(),
      code: otp,
      countryCode: cleanCountryCode,
    });
    
    // Build response data with explicit type
    const data: VerifyOtpResponseData = {
      phone: `${countryCode}${formattedPhone}`, // formatPhoneNumber strips country code, so concatenation is correct
      verified: result.verified ?? false,
    };
    
    if (result.verified === true) {
      data.verificationToken = crypto.randomUUID();
    }
    
    // Return response in the format expected by frontend
    return jsonResponse({
      success: true,
      message: result.message ?? 'Phone number verified successfully',
      data,
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

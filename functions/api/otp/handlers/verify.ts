/**
 * Verify OTP handler
 * Forwards requests to email-worker (MessageCentral provider)
 * 
 * MIGRATION NOTE:
 * - Old: Supabase-based OTP storage and verification
 * - New: Proxy to email-worker which uses MessageCentral
 */

import type { PagesEnv } from '../../../lib/types';
import { apiSuccess, apiError } from '../../../lib/response';
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
      return apiError(400, 'VALIDATION_ERROR', 'Invalid request body', undefined);
    }
    
    const { phone, otp, countryCode = '+91', verificationId } = body;
    
    // Validate inputs
    if (!phone) {
      return apiError(400, 'VALIDATION_ERROR', 'Phone number is required', undefined);
    }
    
    if (!otp) {
      return apiError(400, 'VALIDATION_ERROR', 'OTP is required', undefined);
    }

    // Strict verificationId validation with trim
    if (typeof verificationId !== 'string' || verificationId.trim().length === 0) {
      return apiError(400, 'VALIDATION_ERROR', 'Verification ID is required. Please request a new OTP.', undefined);
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
    return apiSuccess({
      message: result.message ?? 'Phone number verified successfully',
      data,
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

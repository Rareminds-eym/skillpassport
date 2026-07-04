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
    const { phone, verificationId, otp: code, countryCode = '+91' } = body;
    
    if (!phone || !verificationId || !code) {
      return apiError(400, 'VALIDATION_ERROR', 'Phone number, verification ID, and OTP code are required', undefined);
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
    const result = await env.EMAIL_SERVICE.verifyOTP({
      mobileNumber: formattedPhone,
      verificationId,
      code,
      countryCode: cleanCountryCode,
    });
    
    if (!result.success || !result.verified) {
      return apiError(400, 'VERIFICATION_FAILED', result.error || 'Invalid OTP code', undefined);
    }
    
    return apiSuccess({
      message: 'Phone number verified successfully',
      verified: true
    }, undefined);
  } catch (error) {
    if (error instanceof Error) {
      return apiError(500, 'INTERNAL_ERROR', error.message, undefined);
    }
    
    return apiError(500, 'INTERNAL_ERROR', 'An unexpected error occurred', undefined);
  }
}

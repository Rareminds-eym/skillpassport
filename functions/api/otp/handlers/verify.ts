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

export async function verifyOtpHandler(
  body: any,
  env: PagesEnv
): Promise<Response> {
  try {
    const { phone, otp, countryCode = '+91', verificationId } = body;
    
    // Validate inputs
    if (!phone) {
      return jsonResponse({ success: false, error: 'Phone number is required' }, 400);
    }
    
    if (!otp) {
      return jsonResponse({ success: false, error: 'OTP is required' }, 400);
    }

    if (!verificationId) {
      return jsonResponse({ 
        success: false, 
        error: 'Verification ID is required. Please request a new OTP.' 
      }, 400);
    }
    
    // Format phone number
    const formattedPhone = formatPhoneNumber(phone, countryCode);

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
    const response = await fetch(`${emailWorkerConfig.url}/otp/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': emailWorkerConfig.apiKey,
      },
      body: JSON.stringify({
        mobileNumber: formattedPhone,
        verificationId: verificationId,
        code: otp,
        countryCode: cleanCountryCode,
      }),
    });

    const result = await response.json();
    
    if (!response.ok) {
      return jsonResponse(
        { 
          success: false, 
          error: result.error || 'Invalid OTP. Please try again.',
          data: { verified: false }
        },
        response.status
      );
    }
    
    // Return response in the format expected by frontend
    return jsonResponse({
      success: true,
      message: result.message || 'Phone number verified successfully',
      data: {
        phone: `${countryCode}${formattedPhone}`,
        verified: result.verified || false,
        verificationToken: crypto.randomUUID(), // Generate token for frontend
      },
    });
  } catch (error: any) {
    return jsonResponse(
      { success: false, error: error.message || 'Failed to verify OTP' },
      500
    );
  }
}

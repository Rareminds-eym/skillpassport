/**
 * Verify OTP handler
 */

import { ApiResponse, Env, VerifyOtpRequest } from '../types';
import { verifyOtpHash } from '../utils/crypto';
import { deleteOtp, getOtpRecord, getSupabaseClient, incrementAttempts, markOtpVerified } from '../utils/supabase';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Content-Type': 'application/json',
};

function jsonResponse(data: ApiResponse, status = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: corsHeaders });
}

/**
 * Format phone number for lookup
 */
function formatPhoneNumber(phone: string, countryCode: string = '+91'): string {
  let cleaned = phone.replace(/\D/g, '');
  cleaned = cleaned.replace(/^0+/, '');
  
  if (countryCode === '+91' && cleaned.startsWith('91') && cleaned.length > 10) {
    cleaned = cleaned.slice(2);
  }
  
  return `${countryCode}${cleaned}`;
}

const MAX_ATTEMPTS = 5;

export async function verifyOtp(body: VerifyOtpRequest, env: Env): Promise<Response> {
  try {
    const { phone, otp, countryCode = '+91' } = body;
    
    // Validate inputs
    if (!phone) {
      return jsonResponse({ success: false, error: 'Phone number is required' }, 400);
    }
    
    if (!otp) {
      return jsonResponse({ success: false, error: 'OTP is required' }, 400);
    }
    
    // Format phone number
    const formattedPhone = formatPhoneNumber(phone, countryCode);
    
    const supabase = getSupabaseClient(env);
    
    // Get OTP record
    const otpRecord = await getOtpRecord(supabase, formattedPhone);
    
    if (!otpRecord) {
      return jsonResponse(
        { success: false, error: 'No OTP found. Please request a new OTP.' },
        400
      );
    }
    
    // Check if already verified
    if (otpRecord.verified) {
      return jsonResponse(
        { success: false, error: 'OTP already used. Please request a new OTP.' },
        400
      );
    }
    
    // Check expiry
    if (new Date(otpRecord.expires_at) < new Date()) {
      await deleteOtp(supabase, formattedPhone);
      return jsonResponse(
        { success: false, error: 'OTP has expired. Please request a new OTP.' },
        400
      );
    }
    
    // Check attempts
    if (otpRecord.attempts >= MAX_ATTEMPTS) {
      await deleteOtp(supabase, formattedPhone);
      return jsonResponse(
        { success: false, error: 'Too many failed attempts. Please request a new OTP.' },
        400
      );
    }
    
    // Verify OTP
    const isValid = await verifyOtpHash(otp, otpRecord.otp_hash);
    
    if (!isValid) {
      await incrementAttempts(supabase, formattedPhone);
      const remainingAttempts = MAX_ATTEMPTS - otpRecord.attempts - 1;
      return jsonResponse(
        { 
          success: false, 
          error: `Invalid OTP. ${remainingAttempts} attempts remaining.`,
          data: { remainingAttempts }
        },
        400
      );
    }
    
    // Mark as verified
    await markOtpVerified(supabase, formattedPhone);
    
    // Generate a verification token (optional - for additional security)
    const verificationToken = crypto.randomUUID();
    
    return jsonResponse({
      success: true,
      message: 'Phone number verified successfully',
      data: {
        phone: formattedPhone,
        verified: true,
        verificationToken,
      },
    });
  } catch (error: any) {
    console.error('Verify OTP Error:', error);
    return jsonResponse(
      { success: false, error: error.message || 'Failed to verify OTP' },
      500
    );
  }
}

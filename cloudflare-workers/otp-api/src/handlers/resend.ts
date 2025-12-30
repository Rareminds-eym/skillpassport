/**
 * Resend OTP handler
 */

import { ApiResponse, Env, ResendOtpRequest } from '../types';
import { generateOtp, hashOtp } from '../utils/crypto';
import { sendSms } from '../utils/sns';
import { getOtpRecord, getSupabaseClient, isRateLimited, logOtpRequest, storeOtp } from '../utils/supabase';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Content-Type': 'application/json',
};

function jsonResponse(data: ApiResponse, status = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: corsHeaders });
}

/**
 * Format phone number
 */
function formatPhoneNumber(phone: string, countryCode: string = '+91'): string {
  let cleaned = phone.replace(/\D/g, '');
  cleaned = cleaned.replace(/^0+/, '');
  
  if (countryCode === '+91' && cleaned.startsWith('91') && cleaned.length > 10) {
    cleaned = cleaned.slice(2);
  }
  
  if (countryCode === '+91' && cleaned.length !== 10) {
    throw new Error('Invalid phone number. Must be 10 digits.');
  }
  
  return `${countryCode}${cleaned}`;
}

// Minimum time between resend requests (in seconds)
const RESEND_COOLDOWN = 30;

export async function resendOtp(body: ResendOtpRequest, env: Env): Promise<Response> {
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
    
    const supabase = getSupabaseClient(env);
    
    // Check rate limiting
    const rateLimited = await isRateLimited(supabase, formattedPhone);
    if (rateLimited) {
      return jsonResponse(
        { success: false, error: 'Too many OTP requests. Please try again later.' },
        429
      );
    }
    
    // Check if there's an existing OTP and enforce cooldown
    const existingOtp = await getOtpRecord(supabase, formattedPhone);
    if (existingOtp && existingOtp.created_at) {
      const createdAt = new Date(existingOtp.created_at).getTime();
      const now = Date.now();
      const secondsSinceCreation = (now - createdAt) / 1000;
      
      if (secondsSinceCreation < RESEND_COOLDOWN) {
        const waitTime = Math.ceil(RESEND_COOLDOWN - secondsSinceCreation);
        return jsonResponse(
          { 
            success: false, 
            error: `Please wait ${waitTime} seconds before requesting a new OTP.`,
            data: { waitTime }
          },
          429
        );
      }
    }
    
    // Generate new OTP
    const otpLength = parseInt(env.OTP_LENGTH || '6', 10);
    const otp = generateOtp(otpLength);
    const otpHash = await hashOtp(otp);
    
    // Store new OTP (replaces existing)
    const expiryMinutes = parseInt(env.OTP_EXPIRY_MINUTES || '5', 10);
    const storeResult = await storeOtp(supabase, formattedPhone, otpHash, expiryMinutes);
    
    if (!storeResult.success) {
      return jsonResponse(
        { success: false, error: 'Failed to generate OTP. Please try again.' },
        500
      );
    }
    
    // Send SMS via AWS SNS
    const message = `Your verification code is ${otp}. Valid for ${expiryMinutes} minutes. Do not share this code with anyone.`;
    const smsResult = await sendSms(formattedPhone, message, env);
    
    if (!smsResult.success) {
      console.error('SMS sending failed:', smsResult.error);
      return jsonResponse(
        { success: false, error: 'Failed to send OTP. Please try again.' },
        500
      );
    }
    
    // Log request for rate limiting
    await logOtpRequest(supabase, formattedPhone);
    
    return jsonResponse({
      success: true,
      message: 'OTP resent successfully',
      data: {
        phone: formattedPhone.slice(0, -4) + '****',
        expiresIn: expiryMinutes * 60,
      },
    });
  } catch (error: any) {
    console.error('Resend OTP Error:', error);
    return jsonResponse(
      { success: false, error: error.message || 'Failed to resend OTP' },
      500
    );
  }
}

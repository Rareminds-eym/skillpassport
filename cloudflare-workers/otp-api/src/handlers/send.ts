/**
 * Send OTP handler
 */

import { ApiResponse, Env, SendOtpRequest } from '../types';
import { generateOtp, hashOtp } from '../utils/crypto';
import { sendSms } from '../utils/sns';
import { getSupabaseClient, isRateLimited, logOtpRequest, storeOtp } from '../utils/supabase';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Content-Type': 'application/json',
};

function jsonResponse(data: ApiResponse, status = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: corsHeaders });
}

/**
 * Validate and format phone number
 */
function formatPhoneNumber(phone: string, countryCode: string = '+91'): string {
  // Remove all non-digit characters
  let cleaned = phone.replace(/\D/g, '');
  
  // Remove leading zeros
  cleaned = cleaned.replace(/^0+/, '');
  
  // If number starts with country code (without +), remove it
  if (countryCode === '+91' && cleaned.startsWith('91') && cleaned.length > 10) {
    cleaned = cleaned.slice(2);
  }
  
  // Ensure it's 10 digits for Indian numbers
  if (countryCode === '+91' && cleaned.length !== 10) {
    throw new Error('Invalid phone number. Must be 10 digits.');
  }
  
  return `${countryCode}${cleaned}`;
}

export async function sendOtp(body: SendOtpRequest, env: Env): Promise<Response> {
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
    
    // Generate OTP
    const otpLength = parseInt(env.OTP_LENGTH || '6', 10);
    const otp = generateOtp(otpLength);
    const otpHash = await hashOtp(otp);
    
    // Store OTP
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
      message: 'OTP sent successfully',
      data: {
        phone: formattedPhone.slice(0, -4) + '****', // Mask phone number
        expiresIn: expiryMinutes * 60, // seconds
      },
    });
  } catch (error: any) {
    console.error('Send OTP Error:', error);
    return jsonResponse(
      { success: false, error: error.message || 'Failed to send OTP' },
      500
    );
  }
}

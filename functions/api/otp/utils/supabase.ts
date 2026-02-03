/**
 * Supabase utilities for OTP storage
 */

import type { SupabaseClient } from '@supabase/supabase-js';

export interface OtpRecord {
  id?: string;
  phone: string;
  otp_hash: string;
  expires_at: string;
  attempts: number;
  verified: boolean;
  created_at?: string;
}

/**
 * Store OTP record in database
 */
export async function storeOtp(
  supabase: SupabaseClient,
  phone: string,
  otpHash: string,
  expiryMinutes: number
): Promise<{ success: boolean; error?: string }> {
  const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000).toISOString();
  
  // Delete any existing OTP for this phone
  await supabase.from('phone_otps').delete().eq('phone', phone);
  
  // Insert new OTP
  const { error } = await supabase.from('phone_otps').insert({
    phone,
    otp_hash: otpHash,
    expires_at: expiresAt,
    attempts: 0,
    verified: false,
  });
  
  if (error) {
    console.error('Error storing OTP:', error);
    return { success: false, error: error.message };
  }
  
  return { success: true };
}

/**
 * Get OTP record from database
 */
export async function getOtpRecord(
  supabase: SupabaseClient,
  phone: string
): Promise<OtpRecord | null> {
  const { data, error } = await supabase
    .from('phone_otps')
    .select('*')
    .eq('phone', phone)
    .single();
  
  if (error || !data) {
    return null;
  }
  
  return data as OtpRecord;
}

/**
 * Increment OTP attempt count
 */
export async function incrementAttempts(
  supabase: SupabaseClient,
  phone: string
): Promise<void> {
  // Direct increment
  const { data } = await supabase
    .from('phone_otps')
    .select('attempts')
    .eq('phone', phone)
    .single();
  
  if (data) {
    await supabase
      .from('phone_otps')
      .update({ attempts: (data.attempts || 0) + 1 })
      .eq('phone', phone);
  }
}

/**
 * Mark OTP as verified
 */
export async function markOtpVerified(
  supabase: SupabaseClient,
  phone: string
): Promise<void> {
  await supabase
    .from('phone_otps')
    .update({ verified: true })
    .eq('phone', phone);
}

/**
 * Delete OTP record
 */
export async function deleteOtp(
  supabase: SupabaseClient,
  phone: string
): Promise<void> {
  await supabase.from('phone_otps').delete().eq('phone', phone);
}

/**
 * Check if phone is rate limited (too many OTP requests)
 */
export async function isRateLimited(
  supabase: SupabaseClient,
  phone: string,
  maxRequestsPerHour: number = 5
): Promise<boolean> {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  
  const { count } = await supabase
    .from('otp_requests_log')
    .select('*', { count: 'exact', head: true })
    .eq('phone', phone)
    .gte('created_at', oneHourAgo);
  
  return (count || 0) >= maxRequestsPerHour;
}

/**
 * Log OTP request for rate limiting
 */
export async function logOtpRequest(
  supabase: SupabaseClient,
  phone: string
): Promise<void> {
  await supabase.from('otp_requests_log').insert({ phone });
}

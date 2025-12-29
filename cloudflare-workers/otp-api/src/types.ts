/**
 * Type definitions for OTP API Worker
 */

export interface Env {
  // AWS credentials for SNS
  AWS_ACCESS_KEY_ID: string;
  AWS_SECRET_ACCESS_KEY: string;
  AWS_REGION: string;
  
  // Supabase for OTP storage
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  
  // OTP configuration
  OTP_EXPIRY_MINUTES?: string; // Default: 5 minutes
  OTP_LENGTH?: string; // Default: 6 digits
  SMS_SENDER_ID?: string; // Default: VERIFY
}

export interface SendOtpRequest {
  phone: string;
  countryCode?: string; // Default: +91 for India
}

export interface VerifyOtpRequest {
  phone: string;
  otp: string;
  countryCode?: string;
}

export interface ResendOtpRequest {
  phone: string;
  countryCode?: string;
}

export interface OtpRecord {
  id?: string;
  phone: string;
  otp_hash: string;
  expires_at: string;
  attempts: number;
  verified: boolean;
  created_at?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

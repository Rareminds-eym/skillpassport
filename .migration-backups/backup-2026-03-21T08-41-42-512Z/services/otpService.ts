/**
 * OTP Service - Frontend client for OTP API
 * Connects to Cloudflare Pages Function
 */

import { getPagesApiUrl } from '../utils/pagesUrl';

const API_URL = getPagesApiUrl('otp');

interface OtpResponse {
  success: boolean;
  message?: string;
  error?: string;
  data?: unknown;
}

/**
 * Send OTP to phone number
 * @param {string} phone - 10-digit phone number
 * @param {string} countryCode - Country code (default: +91)
 * @returns {Promise<OtpResponse>}
 */
export async function sendOtp(phone: string, countryCode = '+91'): Promise<OtpResponse> {
  try {
    // Validate phone number
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      return { success: false, error: 'Please enter a valid 10-digit phone number' };
    }

    const response = await fetch(`${API_URL}/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ phone: cleanPhone, countryCode }),
    });

    const result = await response.json() as OtpResponse;
    
    if (!response.ok) {
      return { 
        success: false, 
        error: result.error || 'Failed to send OTP. Please try again.' 
      };
    }

    return result;
  } catch (error) {
    console.error('Send OTP Error:', error);
    return { 
      success: false, 
      error: 'Network error. Please check your connection and try again.' 
    };
  }
}

/**
 * Verify OTP
 * @param {string} phone - 10-digit phone number
 * @param {string} otp - 6-digit OTP
 * @param {string} countryCode - Country code (default: +91)
 * @returns {Promise<OtpResponse>}
 */
export async function verifyOtp(phone: string, otp: string, countryCode = '+91'): Promise<OtpResponse> {
  try {
    // Validate inputs
    const cleanPhone = phone.replace(/\D/g, '');
    const cleanOtp = otp.replace(/\D/g, '');
    
    if (cleanPhone.length !== 10) {
      return { success: false, error: 'Invalid phone number' };
    }
    
    if (cleanOtp.length !== 6) {
      return { success: false, error: 'Please enter a valid 6-digit OTP' };
    }

    const response = await fetch(`${API_URL}/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ phone: cleanPhone, otp: cleanOtp, countryCode }),
    });

    const result = await response.json() as OtpResponse;
    
    if (!response.ok) {
      return { 
        success: false, 
        error: result.error || 'Invalid OTP. Please try again.',
        data: result.data
      };
    }

    return result;
  } catch (error) {
    console.error('Verify OTP Error:', error);
    return { 
      success: false, 
      error: 'Network error. Please check your connection and try again.' 
    };
  }
}

/**
 * Resend OTP
 * @param {string} phone - 10-digit phone number
 * @param {string} countryCode - Country code (default: +91)
 * @returns {Promise<OtpResponse>}
 */
export async function resendOtp(phone: string, countryCode = '+91'): Promise<OtpResponse> {
  try {
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      return { success: false, error: 'Please enter a valid 10-digit phone number' };
    }

    const response = await fetch(`${API_URL}/resend`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ phone: cleanPhone, countryCode }),
    });

    const result = await response.json() as OtpResponse;
    
    if (!response.ok) {
      return { 
        success: false, 
        error: result.error || 'Failed to resend OTP. Please try again.',
        data: result.data
      };
    }

    return result;
  } catch (error) {
    console.error('Resend OTP Error:', error);
    return { 
      success: false, 
      error: 'Network error. Please check your connection and try again.' 
    };
  }
}

export default {
  sendOtp,
  verifyOtp,
  resendOtp,
};

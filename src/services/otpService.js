/**
 * OTP Service - Frontend client for OTP API
 * Handles phone number verification via OTP
 */

// OTP API base URL - update this after deploying the worker
const OTP_API_URL = import.meta.env.VITE_OTP_API_URL || 'https://otp-api.your-domain.workers.dev';

/**
 * Send OTP to phone number
 * @param {string} phone - 10-digit phone number
 * @param {string} countryCode - Country code (default: +91)
 * @returns {Promise<{success: boolean, message?: string, error?: string, data?: object}>}
 */
export async function sendOtp(phone, countryCode = '+91') {
  try {
    // Validate phone number
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      return { success: false, error: 'Please enter a valid 10-digit phone number' };
    }

    const response = await fetch(`${OTP_API_URL}/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ phone: cleanPhone, countryCode }),
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: result.error || 'Failed to send OTP. Please try again.',
      };
    }

    return result;
  } catch (error) {
    console.error('Send OTP Error:', error);
    return {
      success: false,
      error: 'Network error. Please check your connection and try again.',
    };
  }
}

/**
 * Verify OTP
 * @param {string} phone - 10-digit phone number
 * @param {string} otp - 6-digit OTP
 * @param {string} countryCode - Country code (default: +91)
 * @returns {Promise<{success: boolean, message?: string, error?: string, data?: object}>}
 */
export async function verifyOtp(phone, otp, countryCode = '+91') {
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

    const response = await fetch(`${OTP_API_URL}/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ phone: cleanPhone, otp: cleanOtp, countryCode }),
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: result.error || 'Invalid OTP. Please try again.',
        data: result.data,
      };
    }

    return result;
  } catch (error) {
    console.error('Verify OTP Error:', error);
    return {
      success: false,
      error: 'Network error. Please check your connection and try again.',
    };
  }
}

/**
 * Resend OTP
 * @param {string} phone - 10-digit phone number
 * @param {string} countryCode - Country code (default: +91)
 * @returns {Promise<{success: boolean, message?: string, error?: string, data?: object}>}
 */
export async function resendOtp(phone, countryCode = '+91') {
  try {
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      return { success: false, error: 'Please enter a valid 10-digit phone number' };
    }

    const response = await fetch(`${OTP_API_URL}/resend`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ phone: cleanPhone, countryCode }),
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: result.error || 'Failed to resend OTP. Please try again.',
        data: result.data,
      };
    }

    return result;
  } catch (error) {
    console.error('Resend OTP Error:', error);
    return {
      success: false,
      error: 'Network error. Please check your connection and try again.',
    };
  }
}

export default {
  sendOtp,
  verifyOtp,
  resendOtp,
};

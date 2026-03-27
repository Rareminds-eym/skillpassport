/**
 * OTP Service - Frontend Client
 * Communicates with email-api worker for phone verification
 */

const EMAIL_API_URL = import.meta.env.VITE_SHARED_EMAIL_API_URL;
const API_KEY = import.meta.env.VITE_SHARED_EMAIL_API_KEY;

/**
 * Send OTP to phone number
 * @param {string} mobileNumber - 10 digit mobile number
 * @param {string} countryCode - Country code (default: 91 for India)
 * @param {string} flowType - Flow type: SMS, WHATSAPP, RCS (default: SMS)
 * @returns {Promise<{verificationId: string, timeout: string}>}
 */
export const sendPhoneOTP = async (mobileNumber, countryCode = '91', flowType = 'SMS') => {
  try {
    const headers = {
      'Content-Type': 'application/json',
      'X-API-Key': API_KEY,
    };
    
    const response = await fetch(`${EMAIL_API_URL}/otp/send`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        mobileNumber,
        countryCode,
        flowType,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to send OTP');
    }

    if (data.success) {
      return {
        verificationId: data.verificationId,
        timeout: data.timeout || '60',
        success: true,
      };
    }

    throw new Error(data.error || 'Failed to send OTP');
  } catch (error) {
    console.error('Send OTP error:', error);
    throw new Error(error.message || 'Failed to send OTP. Please try again.');
  }
};

/**
 * Validate OTP
 * @param {string} mobileNumber - 10 digit mobile number
 * @param {string} verificationId - Verification ID from sendPhoneOTP
 * @param {string} code - OTP code entered by user
 * @param {string} countryCode - Country code (default: 91 for India)
 * @returns {Promise<{verified: boolean}>}
 */
export const validatePhoneOTP = async (mobileNumber, verificationId, code, countryCode = '91') => {
  try {
    const headers = {
      'Content-Type': 'application/json',
      'X-API-Key': API_KEY,
    };
    
    const response = await fetch(`${EMAIL_API_URL}/otp/verify`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        mobileNumber,
        verificationId,
        code,
        countryCode,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to validate OTP');
    }

    if (data.success) {
      return {
        verified: data.verified,
        success: true,
      };
    }

    throw new Error(data.error || 'Invalid OTP');
  } catch (error) {
    console.error('Validate OTP error:', error);
    throw new Error(error.message || 'Failed to validate OTP. Please try again.');
  }
};

export default {
  sendPhoneOTP,
  validatePhoneOTP,
};

// Backward compatibility exports
export const sendOtp = sendPhoneOTP;
export const verifyOtp = validatePhoneOTP

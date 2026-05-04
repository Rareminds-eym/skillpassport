/**
 * OTP Service - Frontend Client
 * Communicates with email-api worker for phone verification
 * 
 * NOTE (Temporary): Direct Message Central integration used until worker is deployed.
 * TODO: Revert to worker-based approach once shared-email-api worker has /otp/send and /otp/verify routes deployed.
 */

// -- ORIGINAL WORKER-BASED CONFIG (kept for when worker is ready) --
// const EMAIL_API_URL = import.meta.env.VITE_SHARED_EMAIL_API_URL;
// const API_KEY = import.meta.env.VITE_SHARED_EMAIL_API_KEY;

// -- TEMPORARY: Direct Message Central config --
const MC_BASE_URL = 'https://cpaas.messagecentral.com';
const MC_CUSTOMER_ID = import.meta.env.VITE_MC_CUSTOMER_ID;
const MC_EMAIL = import.meta.env.VITE_MC_EMAIL;
const MC_PASSWORD = import.meta.env.VITE_MC_PASSWORD;

/**
 * Get a fresh auth token from Message Central
 */
const getMCAuthToken = async () => {
  const base64Password = btoa(MC_PASSWORD);
  const url = `${MC_BASE_URL}/auth/v1/authentication/token?customerId=${MC_CUSTOMER_ID}&key=${base64Password}&scope=NEW&country=91&email=${encodeURIComponent(MC_EMAIL)}`;

  const response = await fetch(url, { method: 'GET' });
  const data = await response.json();

  if (data.token) {
    return data.token;
  }

  throw new Error(data.error || data.message || 'Failed to get auth token from Message Central');
};

/**
 * Send OTP to phone number
 * @param {string} mobileNumber - 10 digit mobile number
 * @param {string} countryCode - Country code (default: 91 for India)
 * @param {string} flowType - Flow type: SMS, WHATSAPP, RCS (default: SMS)
 * @returns {Promise<{verificationId: string, timeout: string}>}
 */
export const sendPhoneOTP = async (mobileNumber, countryCode = '91', flowType = 'SMS') => {
  try {
    // -- ORIGINAL WORKER-BASED IMPLEMENTATION --
    // const headers = {
    //   'Content-Type': 'application/json',
    //   'X-API-Key': API_KEY,
    // };
    // const response = await fetch(`${EMAIL_API_URL}/otp/send`, {
    //   method: 'POST',
    //   headers,
    //   body: JSON.stringify({ mobileNumber, countryCode, flowType }),
    // });
    // const data = await response.json();
    // if (!response.ok) throw new Error(data.error || 'Failed to send OTP');
    // if (data.success) return { verificationId: data.verificationId, timeout: data.timeout || '60', success: true };
    // throw new Error(data.error || 'Failed to send OTP');

    // -- TEMPORARY: Direct Message Central --
    const authToken = await getMCAuthToken();
    const url = `${MC_BASE_URL}/verification/v3/send?countryCode=${countryCode}&customerId=${MC_CUSTOMER_ID}&flowType=${flowType}&mobileNumber=${mobileNumber}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'authToken': authToken },
    });

    const data = await response.json();

    if (data.responseCode === 200 && data.data?.verificationId) {
      return {
        verificationId: data.data.verificationId,
        timeout: String(data.data.timeout || 60),
        success: true,
      };
    }

    throw new Error(data.message || 'Failed to send OTP');
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
    // -- ORIGINAL WORKER-BASED IMPLEMENTATION --
    // const headers = {
    //   'Content-Type': 'application/json',
    //   'X-API-Key': API_KEY,
    // };
    // const response = await fetch(`${EMAIL_API_URL}/otp/verify`, {
    //   method: 'POST',
    //   headers,
    //   body: JSON.stringify({ mobileNumber, verificationId, code, countryCode }),
    // });
    // const data = await response.json();
    // if (!response.ok) throw new Error(data.error || 'Failed to validate OTP');
    // if (data.success) return { verified: data.verified, success: true };
    // throw new Error(data.error || 'Invalid OTP');

    // -- TEMPORARY: Direct Message Central --
    const authToken = await getMCAuthToken();
    const url = `${MC_BASE_URL}/verification/v3/validateOtp?countryCode=${countryCode}&mobileNumber=${mobileNumber}&verificationId=${verificationId}&customerId=${MC_CUSTOMER_ID}&code=${code}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: { 'authToken': authToken },
    });

    const data = await response.json();

    if (data.responseCode === 200) {
      return {
        verified: data.data?.verificationStatus === 'VERIFICATION_COMPLETED',
        success: true,
      };
    }

    return {
      verified: false,
      success: false,
      error: data.message || 'Invalid OTP',
    };
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
export const verifyOtp = validatePhoneOTP;

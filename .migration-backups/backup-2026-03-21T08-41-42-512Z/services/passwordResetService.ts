/**
 * Password Reset Service
 * Handles OTP-based password reset functionality
 */

const API_BASE_URL = '/api/user';

interface ApiResponse {
  success: boolean;
  error?: string;
}

interface EmailCheckResponse {
  exists: boolean;
  error?: string;
}

/**
 * Send password reset OTP to email
 * @param email - User's email address
 * @returns Promise with success status
 */
export const sendPasswordResetOTP = async (email: string): Promise<ApiResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'send',
        email: email.trim().toLowerCase()
      })
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: result.error || `Server error: ${response.status}`
      };
    }

    if (!result.success) {
      return {
        success: false,
        error: result.error || 'Failed to send reset code'
      };
    }

    return {
      success: true
    };
  } catch (error) {
    console.error('Password reset OTP error:', error);
    
    // Handle network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return {
        success: false,
        error: 'Network error. Please check your connection and try again.'
      };
    }

    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.'
    };
  }
};

/**
 * Verify OTP and reset password
 * @param email - User's email address
 * @param otp - 6-digit OTP code
 * @param newPassword - New password
 * @returns Promise with success status
 */
export const verifyOTPAndResetPassword = async (
  email: string, 
  otp: string, 
  newPassword: string
): Promise<ApiResponse> => {
  try {
    // Validate inputs
    if (!email || !otp || !newPassword) {
      return {
        success: false,
        error: 'Email, OTP, and new password are required'
      };
    }

    if (!/^\d{6}$/.test(otp)) {
      return {
        success: false,
        error: 'OTP must be exactly 6 digits'
      };
    }

    if (newPassword.length < 6) {
      return {
        success: false,
        error: 'Password must be at least 6 characters long'
      };
    }

    const response = await fetch(`${API_BASE_URL}/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'verify',
        email: email.trim().toLowerCase(),
        otp: otp.trim(),
        newPassword
      })
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: result.error || `Server error: ${response.status}`
      };
    }

    if (!result.success) {
      return {
        success: false,
        error: result.error || 'Invalid or expired OTP'
      };
    }

    return {
      success: true
    };
  } catch (error) {
    console.error('OTP verification error:', error);
    
    // Handle network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return {
        success: false,
        error: 'Network error. Please check your connection and try again.'
      };
    }

    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.'
    };
  }
};

/**
 * Check if email exists in the system
 * @param email - Email to check
 * @returns Promise with existence status
 */
export const checkEmailExists = async (email: string): Promise<EmailCheckResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/check-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: email.trim().toLowerCase() })
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        exists: false,
        error: result.error || 'Failed to check email'
      };
    }

    return {
      exists: result.exists || false
    };
  } catch (error) {
    console.error('Email check error:', error);
    return {
      exists: false,
      error: 'Failed to verify email'
    };
  }
};

export default {
  sendPasswordResetOTP,
  verifyOTPAndResetPassword,
  checkEmailExists
};
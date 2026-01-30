/**
 * Crypto utilities for OTP generation and hashing
 */

/**
 * Generate a random OTP of specified length
 */
export function generateOtp(length: number = 6): string {
  const digits = '0123456789';
  let otp = '';
  
  // Use crypto.getRandomValues for secure random generation
  const randomValues = new Uint32Array(length);
  crypto.getRandomValues(randomValues);
  
  for (let i = 0; i < length; i++) {
    otp += digits[randomValues[i] % 10];
  }
  
  return otp;
}

/**
 * Hash OTP using SHA-256 for secure storage
 */
export async function hashOtp(otp: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(otp);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Verify OTP by comparing hashes
 */
export async function verifyOtpHash(otp: string, storedHash: string): Promise<boolean> {
  const inputHash = await hashOtp(otp);
  return inputHash === storedHash;
}

/**
 * OTPInput Component - Usage Examples
 * 
 * This file demonstrates how to use the OTPInput component
 * in different scenarios.
 */

import { useState } from 'react';
import OTPInput from './OTPInput';

// Example 1: Basic Usage
export function BasicOTPExample() {
  const [otp, setOtp] = useState('');

  const handleComplete = (code) => {
    console.log('OTP Complete:', code);
    setOtp(code);
    // Verify the code here
  };

  const handleResend = () => {
    console.log('Resending OTP...');
    // Resend OTP logic here
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <OTPInput
        length={6}
        email="user@example.com"
        expirySeconds={600}
        onComplete={handleComplete}
        onResend={handleResend}
      />
    </div>
  );
}

// Example 2: With Error Handling
export function OTPWithErrorExample() {
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const handleComplete = async (code) => {
    setIsVerifying(true);
    setError('');

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      // Simulate validation
      if (code === '123456') {
        console.log('OTP Verified!');
      } else {
        setError('Invalid code. Please try again.');
      }
    } catch (err) {
      setError('Verification failed. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    console.log('Resending OTP...');
    setError('');
    // Resend logic here
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <OTPInput
        length={6}
        email="user@example.com"
        expirySeconds={300}
        onComplete={handleComplete}
        onResend={handleResend}
        error={error}
        isVerifying={isVerifying}
      />
    </div>
  );
}

// Example 3: With Success State
export function OTPWithSuccessExample() {
  const [isSuccess, setIsSuccess] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const handleComplete = async (code) => {
    setIsVerifying(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setIsSuccess(true);
    } catch (err) {
      console.error(err);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = () => {
    setIsSuccess(false);
    console.log('Resending OTP...');
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <OTPInput
        length={6}
        email="user@example.com"
        expirySeconds={600}
        onComplete={handleComplete}
        onResend={handleResend}
        isVerifying={isVerifying}
        isSuccess={isSuccess}
      />
    </div>
  );
}

// Example 4: Custom Length (4 digits)
export function CustomLengthOTPExample() {
  const handleComplete = (code) => {
    console.log('4-digit OTP:', code);
  };

  const handleResend = () => {
    console.log('Resending 4-digit OTP...');
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <OTPInput
        length={4}
        email="user@example.com"
        expirySeconds={300}
        onComplete={handleComplete}
        onResend={handleResend}
      />
    </div>
  );
}

// Example 5: Short Expiry (2 minutes)
export function ShortExpiryOTPExample() {
  const handleComplete = (code) => {
    console.log('OTP:', code);
  };

  const handleResend = () => {
    console.log('Resending OTP...');
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <OTPInput
        length={6}
        email="user@example.com"
        expirySeconds={120} // 2 minutes
        onComplete={handleComplete}
        onResend={handleResend}
      />
    </div>
  );
}

// Example 6: Full Integration Example
export function FullOTPIntegrationExample() {
  const [step, setStep] = useState('input'); // 'input' | 'verifying' | 'success' | 'error'
  const [error, setError] = useState('');
  const [email] = useState('user@example.com');

  const verifyOTP = async (code) => {
    setStep('verifying');
    setError('');

    try {
      // Replace with your actual API call
      const response = await fetch('/api/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });

      if (response.ok) {
        setStep('success');
        // Redirect or continue to next step
        setTimeout(() => {
          console.log('Proceeding to next step...');
        }, 2000);
      } else {
        setStep('error');
        setError('Invalid verification code. Please try again.');
      }
    } catch (err) {
      setStep('error');
      setError('Network error. Please check your connection.');
    }
  };

  const resendOTP = async () => {
    setStep('input');
    setError('');

    try {
      // Replace with your actual API call
      await fetch('/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      console.log('OTP resent successfully');
    } catch (err) {
      setError('Failed to resend code. Please try again.');
    }
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <div className="bg-white rounded-3xl shadow-xl p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Verify Your Email
        </h2>
        <p className="text-gray-600 mb-8">
          Enter the verification code we sent to your email
        </p>

        <OTPInput
          length={6}
          email={email}
          expirySeconds={600}
          onComplete={verifyOTP}
          onResend={resendOTP}
          error={step === 'error' ? error : ''}
          isVerifying={step === 'verifying'}
          isSuccess={step === 'success'}
        />

        {step === 'success' && (
          <div className="mt-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
            <p className="text-sm text-emerald-700 text-center font-medium">
              ✓ Email verified! Redirecting...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default {
  BasicOTPExample,
  OTPWithErrorExample,
  OTPWithSuccessExample,
  CustomLengthOTPExample,
  ShortExpiryOTPExample,
  FullOTPIntegrationExample,
};

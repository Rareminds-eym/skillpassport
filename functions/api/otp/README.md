# OTP API

One-Time Password service for authentication and verification.

## Overview

This API provides endpoints for sending, verifying, and resending OTPs via SMS using AWS SNS.

## Endpoints

### POST `/send`
Send OTP to a phone number.

**Request Body:**
```json
{
  "phoneNumber": "+1234567890",
  "purpose": "login|signup|verification"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP sent successfully",
  "expiresIn": 300
}
```

### POST `/verify`
Verify OTP code.

**Request Body:**
```json
{
  "phoneNumber": "+1234567890",
  "otp": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "verified": true
}
```

### POST `/resend`
Resend OTP to the same phone number.

**Request Body:**
```json
{
  "phoneNumber": "+1234567890"
}
```

## Implementation Status

✅ **Fully Implemented** (7 files)
- OTP generation with crypto
- SMS sending via AWS SNS
- OTP verification with rate limiting
- Resend functionality
- Secure OTP storage in Supabase

## File Structure

```
otp/
├── [[path]].ts           # Main router
├── handlers/
│   ├── send.ts          # Send OTP handler
│   ├── verify.ts        # Verify OTP handler
│   └── resend.ts        # Resend OTP handler
└── utils/
    ├── crypto.ts        # OTP generation
    ├── sns.ts           # AWS SNS integration
    └── supabase.ts      # Database operations
```

## Dependencies

- AWS SNS for SMS delivery
- Supabase for OTP storage
- Crypto for secure OTP generation
- Shared utilities from `src/functions-lib/`

## Environment Variables

- `AWS_ACCESS_KEY_ID` - AWS access key
- `AWS_SECRET_ACCESS_KEY` - AWS secret key
- `AWS_REGION` - AWS region (default: us-east-1)
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key

## Security Features

- Rate limiting (max 3 attempts per phone per hour)
- OTP expiration (5 minutes)
- Secure random OTP generation
- Encrypted storage
- Phone number validation

## Testing

Property tests available in:
- `src/__tests__/property/api-endpoint-parity.property.test.ts`
- `src/__tests__/property/file-based-routing.property.test.ts`

# OTP Phone Verification Setup Guide

This guide explains how to set up the OTP (One-Time Password) phone verification system using Cloudflare Workers and AWS SNS.

## Architecture

```
Client (React) → Cloudflare Worker (OTP API) → AWS SNS (SMS)
                         ↓
                    Supabase (OTP Storage)
```

## Prerequisites

1. **AWS Account** with SNS access
2. **Cloudflare Account** with Workers enabled
3. **Supabase Project** (already configured)

## Step 1: AWS SNS Setup

### 1.1 Create IAM User for SNS

1. Go to AWS IAM Console
2. Create a new user with programmatic access
3. Attach the policy `AmazonSNSFullAccess` (or create a custom policy for SMS only)
4. Save the Access Key ID and Secret Access Key

### 1.2 Configure SNS for SMS

1. Go to AWS SNS Console
2. Navigate to "Text messaging (SMS)"
3. Set your default SMS type to "Transactional"
4. (Optional) Request a Sender ID for your region
5. (Optional) Move out of SMS sandbox for production

### 1.3 AWS Region

Use `ap-south-1` (Mumbai) for India or your nearest region.

## Step 2: Database Setup

Run the migration in Supabase SQL Editor:

```sql
-- Copy contents from: cloudflare-workers/otp-api/database-migration.sql
```

This creates:
- `phone_otps` - Stores OTP records
- `otp_requests_log` - Rate limiting logs

## Step 3: Deploy Cloudflare Worker

### 3.1 Install Dependencies

```bash
cd cloudflare-workers/otp-api
npm install
```

### 3.2 Configure Secrets

```bash
# AWS Credentials
wrangler secret put AWS_ACCESS_KEY_ID
wrangler secret put AWS_SECRET_ACCESS_KEY
wrangler secret put AWS_REGION

# Supabase
wrangler secret put SUPABASE_URL
wrangler secret put SUPABASE_SERVICE_ROLE_KEY
```

### 3.3 Deploy

```bash
npm run deploy
```

### 3.4 Note the Worker URL

After deployment, note the URL (e.g., `https://otp-api.your-subdomain.workers.dev`)

## Step 4: Frontend Configuration

Add the OTP API URL to your environment:

```env
# .env
VITE_OTP_API_URL=https://otp-api.your-subdomain.workers.dev
```

## API Endpoints

### Send OTP
```
POST /send
Body: { "phone": "9876543210", "countryCode": "+91" }
Response: { "success": true, "message": "OTP sent successfully", "data": { "expiresIn": 300 } }
```

### Verify OTP
```
POST /verify
Body: { "phone": "9876543210", "otp": "123456", "countryCode": "+91" }
Response: { "success": true, "message": "Phone number verified successfully", "data": { "verified": true } }
```

### Resend OTP
```
POST /resend
Body: { "phone": "9876543210", "countryCode": "+91" }
Response: { "success": true, "message": "OTP resent successfully" }
```

## Configuration Options

In `wrangler.toml`:

```toml
[vars]
OTP_EXPIRY_MINUTES = "5"    # OTP validity period
OTP_LENGTH = "6"            # Number of digits
SMS_SENDER_ID = "VERIFY"    # SMS sender ID (if approved)
```

## Security Features

1. **OTP Hashing** - OTPs are stored as SHA-256 hashes
2. **Rate Limiting** - Max 5 OTP requests per hour per phone
3. **Attempt Limiting** - Max 5 verification attempts per OTP
4. **Expiry** - OTPs expire after 5 minutes (configurable)
5. **Cooldown** - 30 seconds between resend requests

## Cost Estimation

### AWS SNS SMS Pricing (India)
- Transactional SMS: ~₹0.20-0.30 per message
- Check current pricing: https://aws.amazon.com/sns/sms-pricing/

### Cloudflare Workers
- Free tier: 100,000 requests/day
- Paid: $5/month for 10 million requests

## Troubleshooting

### SMS Not Received
1. Check AWS SNS delivery logs
2. Verify phone number format (+91XXXXXXXXXX)
3. Check if in SMS sandbox mode
4. Verify IAM permissions

### Rate Limit Errors
- Wait 1 hour or clear `otp_requests_log` table

### Invalid OTP Errors
- Check if OTP expired
- Verify correct phone number
- Check attempt count

## Testing

For development/testing without AWS costs:

1. Set `VITE_OTP_API_URL` to empty string
2. The frontend will use mock OTP (any 6 digits work)

Or use AWS SNS Sandbox:
1. Add your test phone numbers to SNS sandbox
2. Test with those numbers only

## Production Checklist

- [ ] Move AWS SNS out of sandbox mode
- [ ] Set up CloudWatch alarms for SMS failures
- [ ] Configure SMS spending limits in AWS
- [ ] Enable Cloudflare Worker analytics
- [ ] Set up error monitoring (Sentry, etc.)
- [ ] Review and adjust rate limits
- [ ] Test with real phone numbers

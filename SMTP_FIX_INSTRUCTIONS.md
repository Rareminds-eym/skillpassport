# SMTP Authentication Fix

## Current Issue
Error: `535 Authentication Credentials Invalid`

This means the AWS SES SMTP credentials are not working.

## Solution Options

### Option 1: Fix AWS SES Credentials (Recommended for Production)

1. **Verify your AWS SES setup:**
   - Go to AWS Console → Simple Email Service (SES)
   - Region: ap-south-1 (Mumbai)
   
2. **Check Email Verification:**
   - Go to "Verified identities"
   - Ensure `noreply@rareminds.in` or the domain `rareminds.in` is verified
   - If not verified, verify it now

3. **Check Sandbox Mode:**
   - If in sandbox, you can only send to verified email addresses
   - Request production access if needed

4. **Generate New SMTP Credentials:**
   - Go to "SMTP Settings" in SES
   - Click "Create SMTP Credentials"
   - Download the credentials
   - Update BOTH files:
     - `cloudflare-workers/email-api/.dev.vars`
     - `cloudflare-workers/user-api/.dev.vars`

5. **Restart Workers:**
   ```bash
   # Stop and restart email-api
   cd cloudflare-workers/email-api
   wrangler dev --port 8787
   ```

### Option 2: Use Gmail SMTP (Quick Testing Only)

Update `cloudflare-workers/email-api/.dev.vars`:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-specific-password
FROM_EMAIL=your-email@gmail.com
FROM_NAME=Skill Passport
```

**Note:** You need to generate an App Password in Gmail:
1. Go to Google Account → Security
2. Enable 2-Step Verification
3. Generate App Password
4. Use that password (not your regular Gmail password)

### Option 3: Use SendGrid (Alternative)

Update `cloudflare-workers/email-api/.dev.vars`:

```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
FROM_EMAIL=noreply@rareminds.in
FROM_NAME=Skill Passport
```

## Current Status

✅ Password reset flow is working
✅ Tokens are being generated and stored
✅ Frontend UI is complete
❌ Email sending is failing due to SMTP auth

The system will work once valid SMTP credentials are provided.

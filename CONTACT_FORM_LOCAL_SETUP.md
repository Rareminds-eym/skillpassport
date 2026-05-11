# Contact Form - Local Development Setup Guide

Complete step-by-step guide to run the contact form with shared-email-api locally.

---

## 📋 Prerequisites

- Node.js v18+
- npm v9+
- Wrangler CLI (installed via devDependencies)
- AWS SES account with verified sender email
- Supabase project running locally or remote

---

## 🚀 Step-by-Step Setup

### **Step 1: Setup Shared Email API**

#### 1.1 Navigate to shared-email-api directory
```bash
cd cloudflare-workers/shared-email-api
```

#### 1.2 Install dependencies
```bash
npm install
```

#### 1.3 Create local environment file
```bash
cp .dev.vars.example .dev.vars
```

#### 1.4 Edit `.dev.vars` with your credentials
```bash
# Open in your editor
code .dev.vars  # or nano .dev.vars
```

**Required values:**
```ini
# API Key for authentication (create your own secret)
API_KEY=my_local_dev_secret_key_12345

# AWS SES credentials (get from AWS IAM Console)
AWS_ACCESS_KEY_ID=your_aws_access_key_id_here
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key_here
AWS_REGION=ap-south-1

# Default from address (must be verified in AWS SES)
DEFAULT_FROM_EMAIL=no-reply@rareminds.in
DEFAULT_FROM_NAME=Rareminds Skill Passport

# CORS origins (allow your frontend)
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:8788
```

> **Important:** The `DEFAULT_FROM_EMAIL` must be verified in AWS SES. If not verified, emails will fail.

#### 1.5 Start the shared-email-api worker
```bash
npm run dev
```

**Expected output:**
```
⛅️ wrangler 4.36.0
-------------------
⎔ Starting local server...
[wrangler:inf] Ready on http://localhost:8787
```

**Test it's working:**
```bash
# In a new terminal
curl http://localhost:8787/health
```

**Expected response:**
```json
{
  "status": "healthy",
  "timestamp": "2026-05-09T...",
  "version": "1.0.0"
}
```

---

### **Step 2: Setup Supabase Database**

#### 2.1 Apply the migration
```bash
# From project root
supabase db push
```

**Or if using remote Supabase:**
```bash
supabase db push --db-url "postgresql://..."
```

#### 2.2 Verify table was created
```bash
# Connect to Supabase Studio
# Or use psql
supabase db reset  # if needed
```

**Check in Supabase Studio:**
- Go to Table Editor
- Look for `contact_form` table
- Verify columns: id, name, email, organization, user_type, message, etc.

---

### **Step 3: Configure Environment Variables**

#### 3.1 Update your main project `.env` file

Add these variables to your `.env` or `.env.development`:

```bash
# Shared Email API (local)
VITE_SHARED_EMAIL_API_URL=http://localhost:8787
VITE_SHARED_EMAIL_API_KEY=my_local_dev_secret_key_12345

# Or add to .dev.vars for Cloudflare Pages Functions
SHARED_EMAIL_API_URL=http://localhost:8787
SHARED_EMAIL_API_KEY=my_local_dev_secret_key_12345
```

> **Note:** The API_KEY must match what you set in `shared-email-api/.dev.vars`

---

### **Step 4: Test the Contact Form API**

#### 4.1 Start your main application
```bash
# From project root
npm run dev
```

#### 4.2 Test the contact API endpoint
```bash
curl -X POST http://localhost:8788/api/contact/submit \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "organization": "Test Org",
    "user_type": "learner",
    "message": "This is a test message from local development."
  }'
```

**Expected success response:**
```json
{
  "success": true,
  "message": "Contact form submitted successfully",
  "submissionId": "uuid-here"
}
```

#### 4.3 Verify in Supabase
- Open Supabase Studio
- Go to Table Editor → `contact_form`
- You should see your test submission

#### 4.4 Check email was sent
- Check the email inbox for `marketing@rareminds.in`
- You should receive a formatted email with the submission details

---

### **Step 5: Test from Frontend (About Page)**

#### 5.1 Navigate to About page
```
http://localhost:5173/about
```

#### 5.2 Scroll to "Get in Touch" section

#### 5.3 Fill out the form:
- Name: Your Name
- Email: your@email.com
- Organization: (optional)
- I am a: Select one (learner/institution/employer/other)
- Message: Your message

#### 5.4 Click "Send Message"

**Expected behavior:**
- ✅ Form shows loading state
- ✅ Success message appears
- ✅ Form clears
- ✅ Data saved to Supabase
- ✅ Email sent to marketing@rareminds.in

---

## 🔍 Troubleshooting

### Issue: "SHARED_EMAIL_API_URL is not configured"

**Solution:** Make sure you added the environment variables to `.dev.vars` or `.env`

```bash
# Check your .dev.vars file
cat .dev.vars | grep SHARED_EMAIL_API
```

---

### Issue: "Email worker failed with status 401"

**Solution:** API key mismatch

1. Check shared-email-api `.dev.vars`:
   ```bash
   cat cloudflare-workers/shared-email-api/.dev.vars | grep API_KEY
   ```

2. Check your main `.dev.vars`:
   ```bash
   cat .dev.vars | grep SHARED_EMAIL_API_KEY
   ```

3. Make sure they match!

---

### Issue: "Failed to save contact form submission"

**Solution:** Database table not created or RLS policy issue

1. Check if table exists:
   ```sql
   SELECT * FROM contact_form LIMIT 1;
   ```

2. Check RLS policies:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'contact_form';
   ```

3. Re-run migration:
   ```bash
   supabase db push
   ```

---

### Issue: "Email sending failed" but data is saved

**Solution:** AWS SES configuration issue

1. Verify email address in AWS SES:
   - Go to AWS SES Console
   - Verify Identities
   - Make sure `no-reply@rareminds.in` is verified

2. Check AWS credentials:
   ```bash
   # Test AWS credentials
   aws ses verify-email-identity --email-address no-reply@rareminds.in --region ap-south-1
   ```

3. Check shared-email-api logs:
   ```bash
   # In the shared-email-api terminal, you'll see error logs
   ```

---

### Issue: CORS error in browser

**Solution:** Add your frontend origin to ALLOWED_ORIGINS

1. Edit `cloudflare-workers/shared-email-api/.dev.vars`:
   ```ini
   ALLOWED_ORIGINS=http://localhost:5173,http://localhost:8788
   ```

2. Restart shared-email-api:
   ```bash
   # Ctrl+C to stop, then
   npm run dev
   ```

---

## 📊 Monitoring & Logs

### Shared Email API Logs
Watch the terminal where you ran `npm run dev` in `shared-email-api/`

**Successful email send:**
```json
{
  "timestamp": "2026-05-09T...",
  "level": "info",
  "message": "Email sent successfully",
  "messageId": "...",
  "recipients": ["marketing@rareminds.in"]
}
```

### Contact API Logs
Watch the terminal where you ran `npm run dev` in your main project

**Successful submission:**
```
[api/contact] Contact form submitted successfully
```

### Database Logs
Check Supabase Studio → Logs tab for database operations

---

## 🎯 Quick Test Checklist

- [ ] Shared-email-api running on http://localhost:8787
- [ ] Health check returns `{"status":"healthy"}`
- [ ] Main app running on http://localhost:5173
- [ ] Database migration applied
- [ ] Environment variables configured
- [ ] Test API call succeeds
- [ ] Data appears in Supabase
- [ ] Email received at marketing@rareminds.in
- [ ] Frontend form submission works

---

## 🔗 Useful Commands

```bash
# Start shared-email-api
cd cloudflare-workers/shared-email-api && npm run dev

# Start main app
npm run dev

# Apply database migration
supabase db push

# Test contact API
curl -X POST http://localhost:8788/api/contact/submit \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com","user_type":"learner","message":"Test message"}'

# Test shared-email-api health
curl http://localhost:8787/health

# View Supabase logs
supabase logs
```

---

## 📝 Next Steps

Once local testing is complete:

1. **Deploy shared-email-api to production:**
   ```bash
   cd cloudflare-workers/shared-email-api
   npm run deploy:production
   ```

2. **Update production environment variables** in Cloudflare Pages:
   ```
   SHARED_EMAIL_API_URL=https://shared-email-api-production.your-account.workers.dev
   SHARED_EMAIL_API_KEY=your-production-api-key
   ```

3. **Deploy main application**

4. **Test on production** with a real submission

---

## 🆘 Need Help?

- Check shared-email-api README: `cloudflare-workers/shared-email-api/README.md`
- Check contact API README: `functions/api/contact/README.md`
- Review CONTACT_FORM_COMPLETE_FLOW.md for architecture details

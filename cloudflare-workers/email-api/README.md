# Email API - Cloudflare Worker

A simple email sending service using `worker-mailer` and Cloudflare Workers.

## Setup

### 1. Install dependencies

```bash
cd cloudflare-workers/email-api
npm install
```

### 2. Configure SMTP credentials

Edit `.dev.vars` with your SMTP credentials:

```env
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
FROM_NAME=My App
```

#### Gmail Setup
1. Enable 2-Step Verification in your Google Account
2. Go to: Google Account > Security > 2-Step Verification > App passwords
3. Generate an App Password for "Mail"
4. Use that password in `SMTP_PASS`

### 3. Run locally

```bash
npm run dev
```

Worker will start at `http://localhost:8787`

## API Endpoints

### Health Check
```bash
curl http://localhost:8787/health
```

### Check Configuration
```bash
curl http://localhost:8787/test
```

### Send Email
```bash
curl -X POST http://localhost:8787/send \
  -H "Content-Type: application/json" \
  -d '{
    "to": "recipient@example.com",
    "subject": "Test Email",
    "text": "Hello from Cloudflare Worker!",
    "html": "<h1>Hello!</h1><p>From Cloudflare Worker</p>"
  }'
```

## Deploy to Production

### 1. Add secrets
```bash
npx wrangler secret put SMTP_USER
npx wrangler secret put SMTP_PASS
```

### 2. Deploy
```bash
npm run deploy
```

## SMTP Providers

| Provider | Host | Port |
|----------|------|------|
| Gmail | smtp.gmail.com | 587 |
| Outlook | smtp.office365.com | 587 |
| AWS SES | email-smtp.{region}.amazonaws.com | 587 |
| Mailgun | smtp.mailgun.org | 587 |
| SendGrid | smtp.sendgrid.net | 587 |

Update `wrangler.toml` to change the SMTP host/port.

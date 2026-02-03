# Email API - Cloudflare Worker

A well-structured email service built on Cloudflare Workers using worker-mailer with AWS SES SMTP.

## 📁 Project Structure

```
src/
├── index.js                    # Main entry point & worker handlers
├── config/
│   ├── constants.js           # Application constants
│   └── smtp.js                # SMTP configuration builder
├── services/
│   ├── mailer.js              # Email sending service
│   ├── supabase.js            # Database operations
│   └── bulk-processor.js      # Bulk email processing
├── handlers/
│   ├── generic.js             # Generic email handler
│   ├── invitation.js          # Organization invitation handler
│   ├── countdown.js           # Single countdown email handler
│   └── bulk-countdown.js      # Bulk countdown email handler
├── templates/
│   ├── invitation.js          # Invitation email HTML template
│   └── countdown.js           # Countdown email HTML template
├── routes/
│   └── router.js              # Request routing logic
├── cron/
│   ├── countdown-processor.js # Automated countdown emails
│   ├── retry-processor.js     # Failed email retry logic
│   └── email-processor-helper.js # Shared CRON helpers
└── utils/
    ├── response.js            # HTTP response helpers
    └── date.js                # Date/time utilities
```

## 🎯 Features

- **Generic Email Sending** - Send any email via POST /
- **Organization Invitations** - Templated invitation emails via POST /invitation
- **Countdown Emails** - Pre-registration countdown via POST /countdown
- **Bulk Countdown** - Send to all pre-registrations via POST /send-bulk-countdown
- **Automated CRON** - Scheduled countdown emails on days 7, 5, 3, 1
- **Retry Logic** - Exponential backoff for failed emails
- **Email Tracking** - Full tracking via Supabase

## 🚀 API Endpoints

### POST /
Generic email sending
```json
{
  "to": "user@example.com",
  "subject": "Hello",
  "html": "<h1>Hello World</h1>",
  "text": "Hello World",
  "from": "custom@example.com",
  "fromName": "Custom Name"
}
```

### POST /invitation
Organization invitation email
```json
{
  "to": "user@example.com",
  "organizationName": "Acme Corp",
  "memberType": "educator",
  "invitationToken": "abc123",
  "expiresAt": "2026-02-01T00:00:00Z",
  "customMessage": "Welcome to our team!"
}
```

### POST /countdown
Single countdown email
```json
{
  "to": "user@example.com",
  "fullName": "John Doe",
  "countdownDay": 7,
  "launchDate": "2026-02-01"
}
```

### POST /send-bulk-countdown
Bulk countdown emails
```json
{
  "countdownDay": 7,
  "launchDate": "2026-02-01"
}
```

### GET /health
Health check endpoint

## 🔧 Environment Variables

Required:
- `SMTP_HOST` - SMTP server hostname
- `SMTP_PORT` - SMTP port (default: 587)
- `SMTP_USER` - SMTP username
- `SMTP_PASS` - SMTP password

Optional:
- `FROM_EMAIL` - Default sender email (default: noreply@rareminds.in)
- `FROM_NAME` - Default sender name (default: Skill Passport)
- `VITE_SUPABASE_URL` - Supabase URL for tracking
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service key
- `LAUNCH_DATE` - Launch date for countdown (default: 2026-02-01)
- `MAX_EMAIL_RETRIES` - Max retry attempts (default: 3)

## 📦 Architecture Benefits

### Separation of Concerns
- **Config** - Centralized configuration
- **Services** - Business logic layer
- **Handlers** - Request handling
- **Templates** - Email HTML generation
- **Utils** - Reusable utilities
- **CRON** - Scheduled job logic

### Maintainability
- Each file < 150 lines
- Single responsibility principle
- Easy to test individual components
- Clear import dependencies

### Scalability
- Easy to add new email types
- Modular template system
- Pluggable services
- Independent CRON jobs

## 🧪 Testing

Each module can be tested independently:
- Services can be mocked
- Templates return pure HTML
- Handlers are isolated
- Utils are pure functions

## 📝 Development

1. Install dependencies: `npm install`
2. Set up environment variables
3. Test locally: `wrangler dev`
4. Deploy: `wrangler deploy`

## 🔄 CRON Schedule

The worker runs scheduled jobs for:
- Processing countdown emails on specific days (7, 5, 3, 1)
- Retrying failed emails with exponential backoff

Configure in `wrangler.toml`:
```toml
[triggers]
crons = ["0 9 * * *"]  # Daily at 9 AM UTC
```

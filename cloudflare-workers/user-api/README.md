# User API Cloudflare Worker

Handles user management operations for the Skill Passport platform.

## Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/create-student` | POST | Create student account |
| `/create-teacher` | POST | Create teacher/educator account |
| `/create-event-user` | POST | Create user from event registration |
| `/send-interview-reminder` | POST | Send interview reminder email |
| `/reset-password` | POST | Send OTP and reset password |

## Environment Variables

### Required

| Variable | Description | Usage |
|----------|-------------|-------|
| `VITE_SUPABASE_URL` | Supabase project URL | Authentication and database operations |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key | Client-side operations |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Admin operations (creating users, bypassing RLS) |

## Email Configuration

Email sending is handled via Supabase Edge Function (`send-email`) which uses SMTP.
Configure SMTP settings in Supabase Dashboard → Emails → SMTP Settings.

The following secrets must be set in Supabase Edge Functions:
- `SMTP_HOST` - SMTP server hostname
- `SMTP_PORT` - SMTP server port (587 or 465)
- `SMTP_USER` - SMTP username
- `SMTP_PASS` - SMTP password
- `SMTP_FROM_EMAIL` - Default sender email
- `SMTP_FROM_NAME` - Default sender name

## Setup Instructions

### 1. Install Dependencies
```bash
cd cloudflare-workers/user-api
npm install
```

### 2. Configure Secrets
Set required secrets using Wrangler CLI:

```bash
# Required secrets
wrangler secret put VITE_SUPABASE_URL
wrangler secret put VITE_SUPABASE_ANON_KEY
wrangler secret put SUPABASE_SERVICE_ROLE_KEY
```

### 3. Configure SMTP in Supabase
Set SMTP secrets for the `send-email` Edge Function:

```bash
supabase secrets set SMTP_HOST=your-smtp-host
supabase secrets set SMTP_PORT=587
supabase secrets set SMTP_USER=your-smtp-user
supabase secrets set SMTP_PASS=your-smtp-password
supabase secrets set SMTP_FROM_EMAIL=noreply@rareminds.in
supabase secrets set SMTP_FROM_NAME="Skill Passport"
```

### 4. Deploy
```bash
npm run deploy
```

### 5. Update Frontend Environment
Add the worker URL to your `.env`:
```env
VITE_USER_API_URL=https://user-api.your-subdomain.workers.dev
```

## Features

### Student Creation
- Creates auth.users record
- Creates public.users record
- Creates students table record
- Supports both school and college students
- Auto-generates secure passwords
- Validates email format
- Prevents duplicate emails

### Teacher Creation
- Creates auth.users record
- Creates public.users record
- Creates school_educators table record
- Auto-generates secure passwords
- Associates teacher with school

### Event User Creation
- Creates users from event registrations
- Sends welcome emails with credentials via SMTP
- Maps roles to database format
- Updates event_registrations table

### Interview Reminders
- Sends formatted interview reminder emails
- Includes meeting details and tips
- Uses Supabase Edge Function with SMTP

## Development

```bash
# Start local dev server
npm run dev

# View real-time logs
npm run tail
```

## Error Handling

The worker includes comprehensive error handling:
- Email validation
- Duplicate email detection
- Rate limiting (5 orders per minute per user)
- Transaction rollback on failures
- Detailed error messages

## Notes

- All email addresses are normalized to lowercase
- Passwords are 12 characters with mixed case, numbers, and special characters
- Email functionality uses Supabase Edge Function with SMTP (no external email API needed)
- RLS policies must allow service role operations on students and school_educators tables

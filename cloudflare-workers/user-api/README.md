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

### Optional

| Variable | Description | Default | Usage |
|----------|-------------|---------|-------|
| `RESEND_API_KEY` | Resend email service API key | None | Send welcome emails and interview reminders |

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

# Optional secret for email functionality
wrangler secret put RESEND_API_KEY
```

### 3. Deploy
```bash
npm run deploy
```

### 4. Update Frontend Environment
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
- Sends welcome emails with credentials (if RESEND_API_KEY configured)
- Maps roles to database format
- Updates event_registrations table

### Interview Reminders
- Sends formatted interview reminder emails
- Includes meeting details and tips
- Requires RESEND_API_KEY

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
- Email functionality is optional (worker functions without RESEND_API_KEY)
- RLS policies must allow service role operations on students and school_educators tables

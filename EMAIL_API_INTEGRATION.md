# Email API Integration - User API

## Overview
All email functionality in the User API now uses the **email-api Cloudflare Worker** for sending emails via SMTP (AWS SES).

## Email API Details

**Worker URL:** `https://email-api.dark-mode-d021.workers.dev`

**Endpoint:** `POST /` or `POST /send`

**Request Format:**
```json
{
  "to": "user@example.com",
  "subject": "Email Subject",
  "html": "<html>...</html>",
  "text": "Plain text version",
  "from": "SkillPassport <noreply@skillpassport.com>"
}
```

**Response Format:**
```json
{
  "success": true,
  "message": "Email sent successfully",
  "data": {
    "messageId": "...",
    "timestamp": "..."
  }
}
```

## Email Functions

### 1. Welcome Email
**Function:** `sendWelcomeEmail()`

**Purpose:** Send welcome email to new users with login credentials

**Template Features:**
- Professional header with SkillPassport branding
- Login credentials (email, temporary password, role)
- Additional information (plan, organization, etc.)
- Call-to-action button to login
- Security reminder to change password
- Responsive HTML design

**Usage:**
```typescript
await sendWelcomeEmail(
  env,
  'user@example.com',
  'John Doe',
  'TempPass123!',
  'school_student',
  '<strong>Plan:</strong> Premium'
);
```

### 2. Password Reset Email
**Function:** `sendPasswordResetEmail()`

**Purpose:** Send OTP for password reset

**Template Features:**
- Large, prominent OTP code display
- 10-minute expiration notice
- Security warning if not requested
- Professional styling with warning box
- Plain text fallback

**Usage:**
```typescript
const success = await sendPasswordResetEmail(
  env,
  'user@example.com',
  '123456'
);
```

### 3. Interview Reminder Email
**Function:** `sendInterviewReminderEmail()`

**Purpose:** Send interview reminder with details

**Template Features:**
- Interview details (date, time, location, interviewer)
- Position and company information
- Helpful tips for the interview
- Professional formatting
- Flexible detail display (only shows provided fields)

**Usage:**
```typescript
const result = await sendInterviewReminderEmail(
  env,
  'candidate@example.com',
  'Jane Smith',
  {
    date: '2024-02-15',
    time: '10:00 AM',
    location: 'Virtual - Zoom',
    interviewer: 'John Doe',
    position: 'Software Engineer',
    company: 'Tech Corp'
  }
);
```

## Email Templates

All emails use consistent styling:
- **Primary Color:** #4F46E5 (Indigo)
- **Font:** Arial, sans-serif
- **Max Width:** 600px
- **Responsive:** Works on mobile and desktop
- **Accessible:** Proper contrast and semantic HTML

### Common Elements
- Header with SkillPassport branding
- Content area with white background
- Footer with copyright and year
- Consistent spacing and typography
- Professional color scheme

## Error Handling

All email functions include proper error handling:

```typescript
try {
  const response = await fetch(EMAIL_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(emailData),
  });

  if (!response.ok) {
    console.error('Email API error:', await response.text());
    return false;
  }

  return true;
} catch (error) {
  console.error('Failed to send email:', error);
  return false;
}
```

## Integration Points

### User Signup
- Welcome emails sent after successful account creation
- Includes temporary password and role information
- Sent for all signup types (school, college, university, recruiter)

### Admin Operations
- Welcome emails when admin creates user accounts
- Includes generated temporary password
- Sent for students, teachers, and staff

### Event Registration
- Welcome emails for event-based user creation
- Includes plan information and event details
- Links user to event registration

### Password Reset
- OTP emails for password reset requests
- 6-digit code with 10-minute expiration
- Security warnings included

### Interview Management
- Reminder emails for scheduled interviews
- Includes all interview details
- Helpful tips for candidates

## Testing

### Local Testing
```bash
# Start local server
npm run pages:dev

# Test email sending (will call email-api worker)
curl -X POST http://localhost:8788/api/user/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!",
    "firstName": "Test",
    "lastName": "User",
    "role": "school_student"
  }'
```

### Email API Testing
```bash
# Test email-api directly
curl -X POST https://email-api.dark-mode-d021.workers.dev \
  -H "Content-Type: application/json" \
  -d '{
    "to": "test@example.com",
    "subject": "Test Email",
    "html": "<h1>Test</h1>",
    "text": "Test",
    "from": "SkillPassport <noreply@skillpassport.com>"
  }'
```

## Benefits

### Using email-api Worker
1. **Centralized Email Logic:** All email sending goes through one worker
2. **SMTP Integration:** Uses AWS SES for reliable delivery
3. **Rate Limiting:** Built-in rate limiting and retry logic
4. **Monitoring:** Centralized logging and error tracking
5. **Scalability:** Worker can handle high email volumes
6. **Consistency:** All emails use the same infrastructure

### Professional Templates
1. **Branding:** Consistent SkillPassport branding
2. **Responsive:** Works on all devices
3. **Accessible:** Proper HTML semantics and contrast
4. **Plain Text:** Fallback for email clients that don't support HTML
5. **Security:** Proper warnings and notices

## Future Enhancements

### Potential Improvements
1. **Email Templates:** Move templates to separate files
2. **Template Engine:** Use a template engine (Handlebars, EJS)
3. **Localization:** Support multiple languages
4. **Tracking:** Add email open and click tracking
5. **Attachments:** Support file attachments
6. **Scheduling:** Schedule emails for later delivery
7. **Personalization:** More dynamic content based on user data

### Email Types to Add
1. **Email Verification:** Verify email addresses
2. **Account Activation:** Activate dormant accounts
3. **Notifications:** System notifications and alerts
4. **Newsletters:** Periodic updates and news
5. **Reports:** Automated reports and summaries

## Troubleshooting

### Email Not Received
1. Check spam/junk folder
2. Verify email address is correct
3. Check email-api worker logs
4. Verify SMTP credentials in email-api worker
5. Check AWS SES sending limits

### Email Formatting Issues
1. Test in multiple email clients
2. Verify HTML is valid
3. Check CSS inline styles
4. Test plain text fallback
5. Verify responsive design

### API Errors
1. Check email-api worker status
2. Verify request format
3. Check network connectivity
4. Review error logs
5. Test with curl/Postman

## Documentation

### Email API Worker
- **Repository:** `cloudflare-workers/email-api/`
- **Documentation:** `cloudflare-workers/email-api/README.md`
- **Endpoints:** See `cloudflare-workers/email-api/src/routes/router.js`

### User API
- **Email Utilities:** `functions/api/user/utils/email.ts`
- **Usage Examples:** See handler files in `functions/api/user/handlers/`

## Security Considerations

1. **Credentials:** Never log passwords in production
2. **Rate Limiting:** Email-api worker has built-in rate limiting
3. **Validation:** Always validate email addresses
4. **Sanitization:** Sanitize user input in email content
5. **HTTPS:** All communication over HTTPS
6. **Authentication:** Some endpoints require authentication

## Monitoring

### Metrics to Track
1. Email send success rate
2. Email delivery rate
3. Bounce rate
4. Response times
5. Error rates

### Logging
- All email sends are logged
- Errors are logged with details
- Success responses include message IDs
- Failed sends include error messages


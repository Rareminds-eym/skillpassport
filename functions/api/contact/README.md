# Contact Form API

Handles contact form submissions from the About page.

## Endpoints

### POST `/api/contact/submit`

Submit a contact form inquiry.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "organization": "Acme Corp",
  "user_type": "employer",
  "message": "I would like to know more about your services."
}
```

**Fields:**
- `name` (required): Full name (1-255 characters)
- `email` (required): Valid email address (1-255 characters)
- `organization` (optional): Organization name (max 255 characters)
- `user_type` (required): One of: `learner`, `institution`, `employer`, `other`
- `message` (required): Message content (10-5000 characters)

**Success Response (200):**
```json
{
  "success": true,
  "message": "Contact form submitted successfully",
  "submissionId": "uuid-here"
}
```

**Error Response (400):**
```json
{
  "success": false,
  "error": "Email is required and must be a non-empty string",
  "errorCode": "VALIDATION_ERROR"
}
```

**Error Response (500):**
```json
{
  "success": false,
  "error": "Failed to save contact form submission",
  "errorCode": "DATABASE_ERROR"
}
```

### GET `/api/contact`

Health check endpoint.

**Response (200):**
```json
{
  "status": "ok",
  "service": "contact-api",
  "endpoints": [
    "POST /submit - Submit contact form"
  ],
  "timestamp": "2026-05-09T12:00:00.000Z"
}
```

## Flow

1. **Validation**: Request body is validated for required fields and formats
2. **Database**: Submission is saved to `contact_form` table in Supabase
3. **Email**: Notification email is sent to `marketing@rareminds.in` via shared-email-api
4. **Response**: Success response is returned (even if email fails, data is saved)

## Environment Variables

Required in Cloudflare Pages environment:

- `SHARED_EMAIL_API_URL` - URL of the shared-email-api worker
- `SHARED_EMAIL_API_KEY` - API key for authenticating with shared-email-api
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anonymous key

## Database Schema

Table: `contact_form`

```sql
CREATE TABLE public.contact_form (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  organization TEXT NULL,
  user_type user_type_enum NOT NULL DEFAULT 'learner',
  message TEXT NOT NULL,
  admin_notes TEXT NULL
);
```

## Email Template

The notification email includes:
- Submission details (name, email, organization, user type, message)
- Color-coded badge for user type
- Reply button linking to submitter's email
- Timestamp in IST timezone

## Error Handling

- **Validation errors** (400): Invalid or missing required fields
- **Database errors** (500): Failed to save to Supabase
- **Email errors**: Logged but don't fail the request (data is still saved)
- **Internal errors** (500): Unexpected server errors

## Testing

```bash
# Submit contact form
curl -X POST https://your-domain.com/api/contact/submit \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "user_type": "learner",
    "message": "This is a test message."
  }'

# Health check
curl https://your-domain.com/api/contact
```

## Integration with Frontend

See `src/shared/ui/marketing/AboutRareMinds.tsx` for the React component that calls this API.

Example usage:
```typescript
const response = await fetch('/api/contact/submit', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: formData.name,
    email: formData.email,
    organization: formData.organization,
    user_type: formData.user_type,
    message: formData.message
  })
});

const result = await response.json();
if (result.success) {
  // Show success message
} else {
  // Show error message
}
```

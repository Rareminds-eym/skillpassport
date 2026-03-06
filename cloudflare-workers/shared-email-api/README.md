# Shared Email API Worker

Multi-tenant email sending service for websites a, b, and c.

## Features

- Multi-tenant architecture (single worker, multiple websites)
- SMTP provider support (extensible to Resend, SendGrid)
- Template-based email sending
- Per-tenant rate limiting
- API key authentication
- Comprehensive error handling
- Structured logging

## Setup

### 1. Install Dependencies

```bash
cd cloudflare-workers/shared-email-api
npm install
```

### 2. Configure Environment Variables

Copy `.dev.vars` and update with your SMTP credentials:

```bash
# For each tenant (skillpassport, website-b, website-c):
TENANT_SKILLPASSPORT_API_KEY=your_api_key_here
SMTP_SKILLPASSPORT_HOST=smtp.gmail.com
SMTP_SKILLPASSPORT_PORT=587
SMTP_SKILLPASSPORT_USER=your-email@gmail.com
SMTP_SKILLPASSPORT_PASS=your-app-password
SMTP_SKILLPASSPORT_FROM_EMAIL=noreply@skillpassport.com
SMTP_SKILLPASSPORT_FROM_NAME=Skill Passport
```

### 3. Create KV Namespace

```bash
wrangler kv:namespace create "RATE_LIMIT_KV"
wrangler kv:namespace create "RATE_LIMIT_KV" --preview
```

Update `wrangler.toml` with the namespace IDs.

### 4. Deploy

```bash
# Development
npm run dev

# Production
npm run deploy
```

## API Endpoints

### POST /send

Send raw HTML email.

**Headers:**
```
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json
```

**Body:**
```json
{
  "to": "user@example.com",
  "subject": "Hello",
  "html": "<p>Hello World</p>",
  "text": "Hello World",
  "from": "custom@example.com",
  "replyTo": "support@example.com"
}
```

### POST /send/template

Send template-based email.

**Body:**
```json
{
  "to": "user@example.com",
  "templateId": "invitation",
  "variables": {
    "organizationName": "ABC Corp",
    "memberType": "educator",
    "invitationLink": "https://...",
    "expiresAt": "2026-03-13"
  }
}
```

### GET /templates

List available templates for authenticated tenant.

### GET /health

Health check endpoint (no auth required).

## Usage from Functions

```typescript
// functions/api/email-a/config.ts
export const EMAIL_WORKER_CONFIG = {
  url: 'https://shared-email-api.workers.dev',
  apiKey: env.EMAIL_WORKER_API_KEY,
};

// functions/api/email-a/handlers/invitation.ts
async function sendInvitation(data) {
  const response = await fetch(`${EMAIL_WORKER_CONFIG.url}/send/template`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${EMAIL_WORKER_CONFIG.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      to: data.email,
      templateId: 'invitation',
      variables: {
        organizationName: data.orgName,
        memberType: data.role,
        invitationLink: data.link,
        expiresAt: data.expires,
      },
    }),
  });
  
  return await response.json();
}
```

## Adding New Tenants

1. Add environment variables in `.dev.vars` and Cloudflare dashboard
2. Update `src/config/tenants.ts` with new tenant configuration
3. Add templates in `src/templates/registry.ts`
4. Deploy

## Rate Limits

- SkillPassport: 60/min, 1000/hour, 10000/day
- Website B: 60/min, 1000/hour, 10000/day
- Website C: 60/min, 1000/hour, 10000/day

## Error Codes

- `AUTH_ERROR`: Invalid or missing API key
- `RATE_LIMIT_ERROR`: Rate limit exceeded
- `VALIDATION_ERROR`: Invalid request data
- `TEMPLATE_NOT_FOUND`: Template doesn't exist
- `PROVIDER_ERROR`: Email provider error
- `INTERNAL_ERROR`: Unknown error

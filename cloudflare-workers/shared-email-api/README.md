# Shared Email API Worker

Shared email sending service powered by AWS SES.

## Features

- AWS SES email provider
- Single API key authentication (shared across all clients)
- Global rate limiting (60/min)
- HTML email support with automatic text fallback
- CORS support for allowed origins
- Comprehensive error handling and logging
- Support for CC, BCC, and reply-to addresses

## Architecture

```
Request Flow:
1. Client → POST /send with X-API-Key header
2. Auth Middleware → Validates API key
3. Rate Limit Middleware → Checks KV-based rate limits (60/min)
4. Validator → Validates email addresses, subject, HTML content
5. EmailEngine → Builds email message
6. SESProvider → Sends via AWS SES API (v2)
7. Response → Returns success with messageId or error
```

## Setup

### 1. Install Dependencies

```bash
cd cloudflare-workers/shared-email-api
npm install
```

### 2. Configure Environment Variables

Create `.dev.vars` file:

```bash
# API Authentication
API_KEY=your-secure-api-key-here

# AWS SES Credentials (shared for all emails)
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=ap-south-1

# Default sender (can be overridden per request)
DEFAULT_FROM_EMAIL=noreply@rareminds.in
DEFAULT_FROM_NAME=Skill Passport

# Environment
ENVIRONMENT=development
```

### 3. KV Namespace Setup

The KV namespace for rate limiting is already configured in `wrangler.toml`:

```toml
[[kv_namespaces]]
binding = "RATE_LIMIT_KV"
id = "c45ac18997334201a93ff4b7605bd877"
preview_id = "afb5bd3fed6244a29f63a9a63a1370d1"
```

### 4. Deploy

```bash
# Development
npm run dev

# Staging
npm run deploy:staging

# Production
npm run deploy:production
```

## API Endpoints

### POST /send

Send HTML email via AWS SES.

**Headers:**
```
X-API-Key: YOUR_API_KEY
Content-Type: application/json
Origin: https://skillpassport.rareminds.in
```

**Request Body:**
```json
{
  "to": "user@example.com",
  "subject": "Welcome to Skill Passport",
  "html": "<h1>Welcome!</h1><p>Thank you for joining.</p>",
  "text": "Welcome! Thank you for joining.",
  "from": "custom@rareminds.in",
  "fromName": "Custom Sender",
  "replyTo": "support@rareminds.in",
  "cc": ["manager@example.com"],
  "bcc": ["archive@example.com"],
  "metadata": {
    "userId": "123",
    "campaign": "onboarding"
  }
}
```

**Required Fields:**
- `to`: string or string[] - Recipient email(s)
- `subject`: string - Email subject (max 998 chars)
- `html`: string - HTML content (max 1MB)

**Optional Fields:**
- `text`: string - Plain text version (auto-generated from HTML if omitted)
- `from`: string - Sender email (defaults to DEFAULT_FROM_EMAIL)
- `fromName`: string - Sender name (defaults to DEFAULT_FROM_NAME)
- `replyTo`: string - Reply-to address
- `cc`: string[] - CC recipients
- `bcc`: string[] - BCC recipients
- `metadata`: object - Custom metadata for logging

**Success Response (200):**
```json
{
  "success": true,
  "messageId": "010001234567890a-abcd1234-5678-90ab-cdef-1234567890ab-000000",
  "recipient": "user@example.com",
  "timestamp": "2026-03-12T10:30:00.000Z"
}
```

**Error Response (4xx/5xx):**
```json
{
  "success": false,
  "error": "Invalid email address: invalid-email",
  "errorCode": "VALIDATION_ERROR",
  "details": {
    "field": "to"
  }
}
```

### GET /health

Health check endpoint (no authentication required).

**Response (200):**
```json
{
  "status": "healthy",
  "timestamp": "2026-03-12T10:30:00.000Z",
  "version": "1.0.0"
}
```

### GET /

API information endpoint (no authentication required).

**Response (200):**
```json
{
  "service": "Shared Email API",
  "version": "1.0.0",
  "endpoints": {
    "POST /send": "Send email with HTML content",
    "GET /health": "Health check"
  },
  "documentation": "https://docs.example.com/email-api"
}
```

## Usage Examples

### JavaScript/TypeScript

```typescript
const response = await fetch('https://shared-email-api.workers.dev/send', {
  method: 'POST',
  headers: {
    'X-API-Key': 'your-api-key',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    to: 'user@example.com',
    subject: 'Welcome!',
    html: '<h1>Hello World</h1>',
  }),
});

const result = await response.json();
console.log(result.messageId);
```

### cURL

```bash
curl -X POST https://shared-email-api.workers.dev/send \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "user@example.com",
    "subject": "Test Email",
    "html": "<p>This is a test</p>"
  }'
```

## CORS Configuration

Allowed origins are configured in `src/constants.ts`:

```typescript
const ALLOWED_ORIGINS = [
  'https://skillpassport.rareminds.in',
  'https://www.skillpassport.rareminds.in',
  'http://localhost:5173',
  'http://localhost:8788',
];
```

In production, localhost origins are automatically blocked.

## Rate Limits

| Time Period | Limit |
|-------------|-------|
| Per minute | 60 emails |
| Per hour | 1000 emails |
| Per day | 10000 emails |

- Tracked using Cloudflare KV with 2-minute TTL
- Returns 429 status with `Retry-After` header when exceeded

**Rate Limit Error Response:**
```json
{
  "success": false,
  "error": "Rate limit exceeded. Try again later.",
  "errorCode": "RATE_LIMIT_ERROR",
  "retryAfter": 45
}
```

## Validation Rules

- Max recipients: 50 per request
- Max subject length: 998 characters
- Max HTML size: 1MB
- Email format: RFC 5322 compliant
- All email addresses validated with regex

## Error Codes

- `AUTH_ERROR` (401): Invalid or missing API key
- `RATE_LIMIT_ERROR` (429): Rate limit exceeded
- `VALIDATION_ERROR` (400): Invalid request data (bad email, missing fields, etc.)
- `PROVIDER_ERROR` (500): AWS SES error
- `INTERNAL_ERROR` (500): Unknown server error
- `NOT_FOUND` (404): Route not found

## Project Structure

```
src/
├── index.ts                 # Main worker entry point, router setup
├── types.ts                 # TypeScript interfaces and error classes
├── constants.ts             # Configuration constants, CORS, rate limits
├── config/
│   └── config.ts           # Email config builder from env vars
├── core/
│   └── EmailEngine.ts      # Email message builder and orchestration
├── providers/
│   ├── BaseProvider.ts     # Abstract provider interface
│   └── SESProvider.ts      # AWS SES implementation using aws4fetch
├── middleware/
│   ├── auth.ts             # API key authentication
│   ├── rateLimit.ts        # KV-based rate limiting
│   ├── validator.ts        # Request validation
│   └── logger.ts           # Structured logging
└── routes/
    ├── send.ts             # POST /send handler
    └── health.ts           # GET /health handler
```

## Environment Variables Reference

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `API_KEY` | Yes | Shared API key for authentication | `sk_live_abc123...` |
| `AWS_ACCESS_KEY_ID` | Yes | AWS IAM access key with SES permissions | `AKIAIOSFODNN7EXAMPLE` |
| `AWS_SECRET_ACCESS_KEY` | Yes | AWS IAM secret key | `wJalrXUtnFEMI/K7MDENG/...` |
| `AWS_REGION` | Yes | AWS region for SES | `ap-south-1` |
| `DEFAULT_FROM_EMAIL` | No | Default sender email | `noreply@rareminds.in` |
| `DEFAULT_FROM_NAME` | No | Default sender name | `Skill Passport` |
| `ENVIRONMENT` | No | Environment name | `production` |

## Deployment Environments

- **Development**: `shared-email-api-dev` - For local testing
- **Staging**: `shared-email-api-staging` - Pre-production testing
- **Production**: `shared-email-api-production` - Live environment

Each environment uses the same KV namespace but can have different environment variables.

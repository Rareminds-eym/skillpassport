# Fetch Certificate API

Certificate generation and retrieval service.

## Overview

This API provides endpoints for generating and fetching certificates for completed assessments, courses, or achievements.

## Endpoints

### GET `/certificate/:certificateId`
Fetch a certificate by ID.

**Response:**
```json
{
  "certificateId": "uuid",
  "userId": "uuid",
  "type": "assessment|course|achievement",
  "title": "Certificate Title",
  "issuedDate": "2026-01-28",
  "pdfUrl": "https://...",
  "metadata": {...}
}
```

### POST `/generate`
Generate a new certificate.

**Request Body:**
```json
{
  "userId": "uuid",
  "type": "assessment",
  "assessmentId": "uuid",
  "score": 85,
  "metadata": {...}
}
```

### GET `/verify/:certificateId`
Verify certificate authenticity.

## Implementation Status

✅ **Fully Implemented** (170 lines)
- Certificate generation
- PDF generation
- Certificate verification
- Secure certificate URLs

## Dependencies

- Supabase for data storage
- PDF generation library
- R2 storage for certificate PDFs
- Shared utilities from `src/functions-lib/`

## Environment Variables

- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- `R2_BUCKET_NAME` - R2 bucket for certificates
- `R2_ACCOUNT_ID` - Cloudflare R2 account ID
- `R2_ACCESS_KEY_ID` - R2 access key
- `R2_SECRET_ACCESS_KEY` - R2 secret key

## Testing

Property tests available in:
- `src/__tests__/property/api-endpoint-parity.property.test.ts`
- `src/__tests__/property/file-based-routing.property.test.ts`

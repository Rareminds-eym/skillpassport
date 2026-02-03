# Phase 3 Quick Test Guide

## Quick Start

### 1. Start Local Server

```bash
npm run pages:dev
```

Server runs at: `http://localhost:8788`

### 2. Test Health Check

```bash
curl http://localhost:8788/api/storage/health
```

Expected response shows all 14 available endpoints.

---

## Quick Test Commands

### Upload a File

```bash
curl -X POST http://localhost:8788/api/storage/upload \
  -F "file=@/path/to/test.pdf"
```

### Delete a File

```bash
curl -X DELETE http://localhost:8788/api/storage/delete \
  -H "Content-Type: application/json" \
  -d '{"key": "uploads/your-file-key.pdf"}'
```

### Generate Presigned URL

```bash
curl -X POST http://localhost:8788/api/storage/presigned \
  -H "Content-Type: application/json" \
  -d '{
    "filename": "test.pdf",
    "contentType": "application/pdf"
  }'
```

### Access Document

```bash
curl "http://localhost:8788/api/storage/document-access?key=uploads/your-file-key.pdf"
```

### Generate Signed URL

```bash
curl -X POST http://localhost:8788/api/storage/signed-url \
  -H "Content-Type: application/json" \
  -d '{
    "key": "uploads/your-file-key.pdf",
    "expiresIn": 3600
  }'
```

### Upload Payment Receipt

```bash
# Convert PDF to base64
BASE64_PDF=$(base64 -w 0 test.pdf)

curl -X POST http://localhost:8788/api/storage/upload-payment-receipt \
  -H "Content-Type: application/json" \
  -d "{
    \"paymentId\": \"payment-123\",
    \"userId\": \"user-456\",
    \"userName\": \"John Doe\",
    \"pdfBase64\": \"$BASE64_PDF\"
  }"
```

### List Files

```bash
curl "http://localhost:8788/api/storage/files/course-123/lesson-456"
```

---

## Run Unit Tests

```bash
# Run all storage tests
npm test -- functions/api/storage --run

# Run specific handler tests
npm test -- functions/api/storage/handlers/__tests__/upload.test.ts --run
npm test -- functions/api/storage/handlers/__tests__/delete.test.ts --run
npm test -- functions/api/storage/handlers/__tests__/presigned.test.ts --run
npm test -- functions/api/storage/handlers/__tests__/document-access.test.ts --run
npm test -- functions/api/storage/handlers/__tests__/signed-url.test.ts --run
npm test -- functions/api/storage/handlers/__tests__/payment-receipt.test.ts --run
npm test -- functions/api/storage/handlers/__tests__/certificate.test.ts --run
npm test -- functions/api/storage/handlers/__tests__/extract-content.test.ts --run
npm test -- functions/api/storage/handlers/__tests__/list-files.test.ts --run

# Run R2Client tests
npm test -- functions/api/storage/utils/__tests__/r2-client.test.ts --run
```

---

## Test Results Summary

✅ **149 tests passing**
- 25 R2Client tests
- 10 Upload handler tests
- 14 Delete handler tests
- 18 Presigned URL handler tests
- 13 Document access handler tests
- 16 Signed URL handler tests
- 17 Payment receipt handler tests
- 12 Certificate handler tests
- 12 Extract content handler tests
- 12 List files handler tests

✅ **0 TypeScript errors**

✅ **All 14 endpoints implemented**

---

## Environment Variables Required

```bash
# R2 Storage
R2_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_access_key
R2_SECRET_ACCESS_KEY=your_secret_key
R2_BUCKET_NAME=your_bucket_name
R2_PUBLIC_URL=https://your-bucket.r2.dev

# Supabase
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

---

## Troubleshooting

### Server won't start
- Check environment variables in `.env.development`
- Verify port 8788 is not in use
- Check for syntax errors: `npm run build`

### Tests failing
- Ensure mocks are properly configured
- Check for TypeScript errors: `npx tsc --noEmit`
- Verify test data is valid

### R2 operations failing
- Verify R2 credentials are correct
- Check R2 bucket exists and is accessible
- Verify R2_PUBLIC_URL is correct

### Supabase operations failing
- Verify Supabase credentials are correct
- Check database tables exist
- Verify RLS policies allow operations

---

## Next Phase

After Phase 3 testing is complete, proceed to:

**Phase 4: AI APIs Implementation (Tasks 30-45)**
- Role Overview API (2 endpoints)
- Question Generation API (2 endpoints)  
- Course API (5 endpoints)
- Analyze Assessment API (1 endpoint + migration)

See `.kiro/specs/cloudflare-unimplemented-features/tasks.md` for details.

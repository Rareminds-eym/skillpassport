# Storage API - Migration Status

## Overview
The storage-api handles R2 storage operations including file uploads, downloads, presigned URLs, and document access proxying.

## Status: ⚠️ REQUIRES DEPENDENCY

This API requires the `aws4fetch` library for AWS Signature V4 authentication with Cloudflare R2.

### Required Dependency
```bash
npm install aws4fetch
```

## Endpoints (14 total)

### File Operations
1. **POST /upload** - Upload file to R2
2. **POST /delete** - Delete file from R2
3. **GET /files/:courseId/:lessonId** - List files in lesson folder

### Presigned URLs
4. **POST /presigned** - Generate presigned URL for client-side upload
5. **POST /confirm** - Confirm upload completion
6. **POST /get-url** - Get public URL from file key
7. **POST /get-file-url** - Alias for get-url

### Document Access (Proxy)
8. **GET /document-access** - Proxy document access (bypasses CORS)
9. **POST /signed-url** - Generate signed URL for document
10. **POST /signed-urls** - Batch generate signed URLs

### Payment Receipts
11. **POST /upload-payment-receipt** - Upload payment receipt PDF (base64)
12. **GET /payment-receipt** - Get payment receipt

### Certificates
13. **GET /course-certificate** - Get course certificate image

### Content Extraction
14. **POST /extract-content** - Extract text from PDF resources

## Implementation Notes

### R2 Configuration
Requires environment variables:
- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_R2_ACCESS_KEY_ID`
- `CLOUDFLARE_R2_SECRET_ACCESS_KEY`
- `CLOUDFLARE_R2_BUCKET_NAME`
- `CLOUDFLARE_R2_PUBLIC_URL` (optional)

### Key Features
- AWS Signature V4 authentication via aws4fetch
- Multipart form data handling for uploads
- Base64 PDF decoding for payment receipts
- URL extraction from various formats (direct R2, proxy URLs)
- XML parsing for R2 list operations
- Content-Disposition headers for inline/download modes

### Migration Complexity
- **Lines of Code**: 942 lines
- **Dependencies**: aws4fetch, @supabase/supabase-js
- **Complexity**: High (R2 operations, AWS signing, multiple URL formats)

## Next Steps

1. Install aws4fetch dependency
2. Migrate all 14 endpoint handlers
3. Test R2 operations locally
4. Verify presigned URL generation
5. Test document access proxy
6. Verify payment receipt upload/download

## Original Location
`cloudflare-workers/storage-api/src/index.ts`

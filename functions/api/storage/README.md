# Storage API

## Overview

The storage API handles Cloudflare R2 uploads, downloads, deletes, listing, document proxying, payment receipts, certificates, and content extraction.

R2 access is binding-only through `env.R2_BUCKET`. It does not use S3 credentials, AWS Signature V4 signing, or `aws4fetch`.

## Required Binding

Configure the R2 binding in `wrangler.toml`:

```toml
[[r2_buckets]]
binding = "R2_BUCKET"
bucket_name = "skill-echosystem"
```

Local Wrangler development uses Miniflare local R2 storage by default unless remote bindings are explicitly enabled.

## Optional Variables

- `CLOUDFLARE_R2_PUBLIC_URL` - optional custom public URL used when returning stored object URLs
- `SIGNING_SECRET` - required for token-based media access URLs

## Endpoints

### File Operations

1. `POST /upload` - Upload file through the Pages Function into R2
2. `POST /delete` - Delete file from R2
3. `GET /files/:courseId/:lessonId` - List files in a lesson folder

### URL Helpers

4. `POST /presigned` - Disabled; direct R2 presigned uploads are not supported
5. `POST /confirm` - Legacy upload confirmation helper
6. `POST /get-url` - Return an authenticated app proxy URL
7. `POST /get-file-url` - Alias for `get-url`

### Document Access

8. `GET /document-access` - Stream a document through the app
9. `POST /signed-url` - Create app-owned signed/proxy URL
10. `POST /signed-urls` - Batch create app-owned signed/proxy URLs

### Payment Receipts

11. `POST /upload-payment-receipt` - Upload payment receipt PDF
12. `GET /payment-receipt` - Stream payment receipt through the app
13. `GET /payment-receipt/presigned` - Legacy route that now returns an app proxy URL

### Certificates

14. `GET /course-certificate` - Stream course certificate image

### Content Extraction

15. `POST /extract-content` - Extract text from document resources

## Implementation Notes

- Uploads use `R2_BUCKET.put`.
- Downloads use `R2_BUCKET.get`.
- Deletes use `R2_BUCKET.delete`.
- File lists use `R2_BUCKET.list`.
- Course resource downloads validate lesson access before streaming private course files.

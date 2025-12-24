# Storage API Cloudflare Worker

Handles file storage operations using Cloudflare R2.

## Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/upload` | POST | Upload file to R2 |
| `/presigned` | POST | Get presigned URL for client-side upload |
| `/confirm` | POST | Confirm upload and get file URL |
| `/get-url` | POST | Get file URL from key |
| `/get-file-url` | POST | Alias for `/get-url` |
| `/delete` | POST | Delete file from R2 |
| `/files/:courseId/:lessonId` | GET | List files for a lesson |
| `/extract-content` | POST | Extract text from PDF resources |
| `/health` | GET | Health check endpoint |

## Environment Variables

### Required

| Variable | Description | Usage |
|----------|-------------|-------|
| `VITE_SUPABASE_URL` | Supabase project URL | Database operations |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Admin operations |
| `R2_ACCOUNT_ID` | Cloudflare R2 account ID (also accepts `CLOUDFLARE_ACCOUNT_ID`) | R2 API endpoint construction |
| `R2_ACCESS_KEY_ID` | R2 access key ID (also accepts `CLOUDFLARE_R2_ACCESS_KEY_ID`) | AWS S3-compatible authentication |
| `R2_SECRET_ACCESS_KEY` | R2 secret access key (also accepts `CLOUDFLARE_R2_SECRET_ACCESS_KEY`) | AWS S3-compatible authentication |
| `R2_BUCKET_NAME` | R2 bucket name (also accepts `CLOUDFLARE_R2_BUCKET_NAME`) | Target storage bucket |

### Optional

| Variable | Description | Default | Usage |
|----------|-------------|---------|-------|
| `R2_PUBLIC_URL` | Custom R2 public domain (also accepts `CLOUDFLARE_R2_PUBLIC_URL`) | `https://pub-{ACCOUNT_ID}.r2.dev` | Public file access URLs |

## Setup Instructions

### 1. Install Dependencies
```bash
cd cloudflare-workers/storage-api
npm install
```

### 2. Configure R2 Bucket
Create R2 bucket in Cloudflare dashboard:
1. Go to R2 → Create bucket
2. Name: `skill-echosystem` (or your preferred name)
3. Create API tokens with read/write access

### 3. Configure Secrets
```bash
# Required secrets
wrangler secret put VITE_SUPABASE_URL
wrangler secret put SUPABASE_SERVICE_ROLE_KEY
wrangler secret put R2_ACCOUNT_ID
wrangler secret put R2_ACCESS_KEY_ID
wrangler secret put R2_SECRET_ACCESS_KEY
wrangler secret put R2_BUCKET_NAME

# Optional - custom domain
wrangler secret put R2_PUBLIC_URL
```

### 4. Deploy
```bash
npm run deploy
```

### 5. Update Frontend Environment
```env
VITE_STORAGE_API_URL=https://storage-api.your-subdomain.workers.dev
```

## Features

### Direct Upload (`/upload`)
- Accepts multipart/form-data
- Requires: `file` and `filename`
- Returns public URL immediately
- Suitable for small files

### Presigned Upload (`/presigned`)
- Returns signed URL for client-side upload
- Requires: `filename`, `contentType`, `courseId`, `lessonId`
- Files organized: `courses/{courseId}/lessons/{lessonId}/{timestamp}-{random}{ext}`
- Client uploads directly to R2
- More efficient for large files

### Confirm Upload (`/confirm`)
- After presigned upload completes
- Generates final public URL
- Returns file metadata

### Get File URL (`/get-url`)
- Convert R2 key to public URL
- Uses custom domain if configured

### Delete File (`/delete`)
- Deletes file from R2
- Requires file URL
- Extracts key from URL

### List Files (`/files/:courseId/:lessonId`)
- Lists all files for a lesson
- Returns file metadata (size, last modified)
- Parses S3 XML response

### Extract Content (`/extract-content`)
- Extracts text from PDFs (placeholder implementation)
- Updates `lesson_resources` table
- Supports batch processing by:
  - Single `resourceId`
  - Multiple `resourceIds`
  - All resources for a `lessonId`

## File Organization

Files are stored with this structure:
```
courses/
  {courseId}/
    lessons/
      {lessonId}/
        {timestamp}-{random}.{ext}
```

Example:
```
courses/abc123/lessons/xyz789/1703001234567-a1b2c3d4e5f6.pdf
```

## Public Access URLs

### Default (R2.dev)
```
https://pub-{ACCOUNT_ID}.r2.dev/{file-key}
```

### Custom Domain (if configured)
```
https://cdn.yourdomain.com/{file-key}
```

To set up custom domain:
1. Add domain in Cloudflare R2 settings
2. Set `R2_PUBLIC_URL` environment variable

## Authentication

Uses **AWS v4 signatures** via `aws4fetch` library:
- Compatible with S3 API
- Signs requests with access key
- Required for all R2 operations

## Development

```bash
# Start local dev server
npm run dev

# View real-time logs
npm run tail

# Test upload
curl -X POST http://localhost:8787/upload \
  -F "file=@test.pdf" \
  -F "filename=courses/test/lessons/test/test.pdf"
```

## Response Format

### Upload
```json
{
  "success": true,
  "url": "https://pub-....r2.dev/courses/.../file.pdf",
  "filename": "courses/.../file.pdf"
}
```

### Presigned
```json
{
  "success": true,
  "data": {
    "uploadUrl": "https://...r2.cloudflarestorage.com/...",
    "fileKey": "courses/.../1703.../file.pdf",
    "headers": {
      "Authorization": "AWS4-HMAC-SHA256 ...",
      "x-amz-date": "20231219T120000Z",
      "Content-Type": "application/pdf"
    }
  }
}
```

### List Files
```json
{
  "success": true,
  "data": [
    {
      "key": "courses/.../file.pdf",
      "url": "https://pub-....r2.dev/courses/.../file.pdf",
      "size": "1234567",
      "lastModified": "2023-12-19T12:00:00.000Z"
    }
  ]
}
```

## Supported File Types

All file types supported, common formats:
- **Documents**: PDF, DOCX, TXT
- **Images**: JPG, PNG, GIF, SVG
- **Video**: MP4, WebM, MOV
- **Audio**: MP3, WAV, OGG

## Notes

- R2 has **no egress fees** (free bandwidth)
- Files can be up to **5TB** in size
- Uses S3-compatible API
- Supports custom domains for branding
- PDF extraction is placeholder (requires additional processing)
- Variable names accept both `R2_*` and `CLOUDFLARE_R2_*` prefixes for compatibility

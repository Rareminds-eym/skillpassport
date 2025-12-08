# Cloudflare R2 Image Upload Setup Guide

This guide will help you set up Cloudflare R2 for storing course thumbnails and other images.

## Overview

The system now supports uploading images to Cloudflare R2 storage. When users edit a course, they can:
- Click on the thumbnail area to upload an image
- Preview the image before saving
- Remove and replace images
- Images are automatically uploaded to Cloudflare R2
- The URL is stored in the `courses.thumbnail` column

## Step 1: Get Cloudflare R2 Credentials

### 1.1 Create R2 Bucket (if not exists)

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to **R2 Object Storage**
3. Click **Create bucket**
4. Name it: `skill-echosystem` (or your preferred name)
5. Click **Create bucket**

### 1.2 Create API Token

1. In R2 dashboard, click **Manage R2 API Tokens**
2. Click **Create API token**
3. Configure:
   - **Token name**: `skill-ecosystem-uploads`
   - **Permissions**: Object Read & Write
   - **Bucket**: Select `skill-echosystem` (or your bucket name)
4. Click **Create API Token**
5. **IMPORTANT**: Copy and save:
   - Access Key ID
   - Secret Access Key
   - Account ID (from the URL or dashboard)

### 1.3 Set Up Public Access (Optional)

For public image access:

1. Go to your bucket settings
2. Click **Settings** → **Public Access**
3. Enable **Allow Access**
4. Note your public URL: `https://pub-[hash].r2.dev`

Or set up a custom domain:
1. Go to **Settings** → **Custom Domains**
2. Add your domain (e.g., `cdn.yourdomain.com`)
3. Follow DNS setup instructions

## Step 2: Configure Environment Variables

### 2.1 Update .env file

Add these variables to your `.env` file:

```env
# Cloudflare R2 Configuration
CLOUDFLARE_ACCOUNT_ID=your_account_id_here
CLOUDFLARE_R2_ACCESS_KEY_ID=your_access_key_id_here
CLOUDFLARE_R2_SECRET_ACCESS_KEY=your_secret_access_key_here
CLOUDFLARE_R2_BUCKET_NAME=skill-echosystem
CLOUDFLARE_R2_PUBLIC_URL=https://pub-xxxxx.r2.dev
```

Replace:
- `your_account_id_here` - Your Cloudflare Account ID
- `your_access_key_id_here` - R2 Access Key ID
- `your_secret_access_key_here` - R2 Secret Access Key
- `https://pub-xxxxx.r2.dev` - Your R2 public URL or custom domain

## Step 3: Deploy Edge Functions

### 3.1 Using the Deployment Script (Windows)

```bash
deploy-r2-functions.bat
```

### 3.2 Manual Deployment

```bash
# Deploy upload function
supabase functions deploy upload-to-r2 --no-verify-jwt

# Deploy delete function
supabase functions deploy delete-from-r2 --no-verify-jwt
```

## Step 4: Set Supabase Secrets

You need to add the R2 credentials as secrets in Supabase:

### Option 1: Using Supabase Dashboard

1. Go to: `https://supabase.com/dashboard/project/[your-project]/settings/functions`
2. Click **Edge Functions** → **Secrets**
3. Add these secrets:
   - `CLOUDFLARE_ACCOUNT_ID`
   - `CLOUDFLARE_R2_ACCESS_KEY_ID`
   - `CLOUDFLARE_R2_SECRET_ACCESS_KEY`
   - `CLOUDFLARE_R2_BUCKET_NAME`
   - `CLOUDFLARE_R2_PUBLIC_URL`

### Option 2: Using Supabase CLI

```bash
supabase secrets set CLOUDFLARE_ACCOUNT_ID=your_account_id
supabase secrets set CLOUDFLARE_R2_ACCESS_KEY_ID=your_access_key
supabase secrets set CLOUDFLARE_R2_SECRET_ACCESS_KEY=your_secret_key
supabase secrets set CLOUDFLARE_R2_BUCKET_NAME=skill-echosystem
supabase secrets set CLOUDFLARE_R2_PUBLIC_URL=https://pub-xxxxx.r2.dev
```

## Step 5: Update Vite Configuration (Optional)

If you want to proxy the API calls through Vite dev server, add to `vite.config.ts`:

```typescript
export default defineConfig({
  // ... other config
  server: {
    proxy: {
      '/api/upload-to-r2': {
        target: 'https://[your-project].supabase.co/functions/v1/upload-to-r2',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/upload-to-r2/, '')
      },
      '/api/delete-from-r2': {
        target: 'https://[your-project].supabase.co/functions/v1/delete-from-r2',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/delete-from-r2/, '')
      }
    }
  }
})
```

## Step 6: Test the Upload

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to **Courses** page
3. Click **Create Course** or **Edit** an existing course
4. In Step 1 (Basic Info), you'll see the new image upload component
5. Click on the upload area or "Choose File" button
6. Select an image (PNG, JPG, JPEG, GIF, WebP)
7. The image will upload automatically and show a preview
8. Complete the course creation/editing
9. The image URL will be saved to the database

## How It Works

### Frontend Flow

1. **ImageUpload Component** (`src/components/common/ImageUpload.tsx`)
   - Provides drag-and-drop or click-to-upload interface
   - Shows image preview
   - Validates file type and size
   - Calls upload utility

2. **Upload Utility** (`src/utils/cloudflareR2Upload.ts`)
   - Validates image (type, size)
   - Generates unique filename
   - Sends to Edge Function
   - Returns public URL

3. **CreateCourseModal** (`src/components/educator/courses/CreateCourseModal.tsx`)
   - Integrates ImageUpload component
   - Stores URL in `courseData.thumbnail`
   - Saves to database

### Backend Flow

1. **Edge Function** (`supabase/functions/upload-to-r2/index.ts`)
   - Receives file from frontend
   - Authenticates with Cloudflare R2
   - Uploads file to bucket
   - Returns public URL

2. **Database** (`courses.thumbnail` column)
   - Stores the full public URL
   - Type: `text` (nullable)

## File Structure

```
src/
├── components/
│   ├── common/
│   │   └── ImageUpload.tsx          # Reusable image upload component
│   └── educator/
│       └── courses/
│           └── CreateCourseModal.tsx # Updated with ImageUpload
├── utils/
│   └── cloudflareR2Upload.ts        # Upload utility functions
supabase/
└── functions/
    ├── upload-to-r2/
    │   └── index.ts                 # Upload Edge Function
    └── delete-from-r2/
        └── index.ts                 # Delete Edge Function
```

## Image Specifications

- **Recommended Size**: 800x600px or 16:9 aspect ratio
- **Max File Size**: 5MB
- **Supported Formats**: PNG, JPG, JPEG, GIF, WebP
- **Storage Location**: `courses/[timestamp]-[random].[ext]`

## Troubleshooting

### Upload fails with "Credentials not configured"

- Check that all environment secrets are set in Supabase
- Verify the secret names match exactly
- Redeploy the Edge Functions after setting secrets

### Upload succeeds but image doesn't display

- Check the `CLOUDFLARE_R2_PUBLIC_URL` is correct
- Verify bucket has public access enabled
- Check browser console for CORS errors

### "Failed to upload image" error

- Check file size is under 5MB
- Verify file is an image format
- Check browser console for detailed error
- Verify Edge Function logs in Supabase dashboard

### Image URL not saving to database

- Check the `courses.thumbnail` column exists and is type `text`
- Verify the course update/create service is working
- Check browser console for API errors

## Security Considerations

1. **File Validation**: Only image files under 5MB are accepted
2. **Unique Filenames**: Prevents overwriting and conflicts
3. **No JWT Verification**: Edge functions use `--no-verify-jwt` for public access
4. **CORS Headers**: Configured for cross-origin requests
5. **Bucket Permissions**: Set to read-only for public, write via API token

## Cost Considerations

Cloudflare R2 pricing (as of 2024):
- **Storage**: $0.015/GB/month
- **Class A Operations** (writes): $4.50/million
- **Class B Operations** (reads): $0.36/million
- **Egress**: FREE (no bandwidth charges)

For typical usage:
- 1000 course images (~500MB): ~$0.01/month
- 10,000 uploads: ~$0.05
- Unlimited downloads: FREE

## Next Steps

1. ✅ Set up Cloudflare R2 bucket
2. ✅ Configure environment variables
3. ✅ Deploy Edge Functions
4. ✅ Test image upload
5. 🔄 (Optional) Set up custom domain
6. 🔄 (Optional) Add image optimization
7. 🔄 (Optional) Add image cropping/resizing

## Support

For issues or questions:
- Check Supabase Edge Function logs
- Check Cloudflare R2 dashboard for upload activity
- Review browser console for frontend errors
- Check this guide's troubleshooting section

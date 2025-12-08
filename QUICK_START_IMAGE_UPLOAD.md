# Quick Start: Image Upload for Courses

## 🚀 What's New?

You can now upload images for course thumbnails! The image upload button in the course edit modal now works and stores images in Cloudflare R2.

## ⚡ Quick Setup (5 minutes)

### Step 1: Get Cloudflare R2 Credentials

1. Go to: https://dash.cloudflare.com/
2. Click **R2 Object Storage**
3. Click **Create bucket** → Name it `skill-echosystem`
4. Click **Manage R2 API Tokens** → **Create API token**
5. Set permissions: **Object Read & Write**
6. Copy these values:
   - Account ID (from URL or dashboard)
   - Access Key ID
   - Secret Access Key

### Step 2: Add to .env

```env
CLOUDFLARE_ACCOUNT_ID=your_account_id_here
CLOUDFLARE_R2_ACCESS_KEY_ID=your_access_key_here
CLOUDFLARE_R2_SECRET_ACCESS_KEY=your_secret_key_here
CLOUDFLARE_R2_BUCKET_NAME=skill-echosystem
CLOUDFLARE_R2_PUBLIC_URL=https://pub-xxxxx.r2.dev
```

Get your public URL from R2 bucket settings → Public Access

### Step 3: Deploy Edge Functions

```bash
# Windows
deploy-r2-functions.bat

# Or manually
supabase functions deploy upload-to-r2 --no-verify-jwt
supabase functions deploy delete-from-r2 --no-verify-jwt
```

### Step 4: Set Supabase Secrets

```bash
supabase secrets set CLOUDFLARE_ACCOUNT_ID=your_account_id
supabase secrets set CLOUDFLARE_R2_ACCESS_KEY_ID=your_access_key
supabase secrets set CLOUDFLARE_R2_SECRET_ACCESS_KEY=your_secret_key
supabase secrets set CLOUDFLARE_R2_BUCKET_NAME=skill-echosystem
supabase secrets set CLOUDFLARE_R2_PUBLIC_URL=https://pub-xxxxx.r2.dev
```

### Step 5: Test It!

1. Start dev server: `npm run dev`
2. Go to **Courses** page
3. Click **Create Course** or **Edit** existing course
4. In **Step 1: Basic Info**, you'll see the new upload interface
5. Click the upload area or **Choose File**
6. Select an image (PNG, JPG, etc.)
7. Watch it upload and preview automatically! ✨

## 📸 How to Use

### Creating a New Course

1. Click **Create Course**
2. Choose **Create New Course** or **Import from Platform**
3. In **Step 1: Basic Info**:
   - Fill in title, code, description, duration
   - **NEW**: Click the thumbnail upload area
   - Select an image from your computer
   - Preview appears automatically
4. Continue with other steps
5. Click **Create Course**
6. Image URL is saved to database automatically!

### Editing an Existing Course

1. Click **Edit** on any course card
2. In **Step 1: Basic Info**:
   - See current thumbnail (if exists)
   - Click to replace with new image
   - Or click **X** to remove current image
3. Click **Update Course**
4. New image URL is saved!

## 🎨 Image Guidelines

- **Recommended Size**: 800x600px or 16:9 aspect ratio
- **Max File Size**: 5MB
- **Supported Formats**: PNG, JPG, JPEG, GIF, WebP
- **Best Practices**:
  - Use high-quality images
  - Avoid text-heavy images
  - Use relevant course imagery
  - Optimize before upload (compress if needed)

## ✅ What Works Now

- ✅ Click to upload images
- ✅ Drag-and-drop support
- ✅ Instant preview
- ✅ File validation
- ✅ Progress indicator
- ✅ Remove/replace images
- ✅ Automatic upload to Cloudflare R2
- ✅ URL saved to database
- ✅ Works in create and edit modes

## 🔧 Troubleshooting

### "Credentials not configured" error
→ Make sure you set all Supabase secrets (Step 4)
→ Redeploy Edge Functions after setting secrets

### Upload button doesn't work
→ Check browser console for errors
→ Verify Edge Functions are deployed
→ Check network tab for API calls

### Image doesn't display after upload
→ Verify R2 bucket has public access enabled
→ Check CLOUDFLARE_R2_PUBLIC_URL is correct
→ Try accessing the URL directly in browser

### Upload is slow
→ Check your internet connection
→ Try compressing the image first
→ Ensure image is under 5MB

## 📁 Files Changed

### New Files:
- `src/components/common/ImageUpload.tsx` - Upload component
- `src/utils/cloudflareR2Upload.ts` - Upload utility
- `supabase/functions/upload-to-r2/index.ts` - Upload Edge Function
- `supabase/functions/delete-from-r2/index.ts` - Delete Edge Function

### Modified Files:
- `src/components/educator/courses/CreateCourseModal.tsx` - Added ImageUpload
- `vite.config.ts` - Added API proxy
- `.env.example` - Added R2 config

## 💰 Cost

Cloudflare R2 is very affordable:
- **Storage**: $0.015/GB/month
- **Uploads**: $4.50/million operations
- **Downloads**: FREE (no bandwidth charges!)

Example: 1000 course images (~500MB) = ~$0.01/month

## 📚 More Info

- **Full Setup Guide**: See `CLOUDFLARE_R2_SETUP_GUIDE.md`
- **Implementation Details**: See `IMAGE_UPLOAD_IMPLEMENTATION.md`
- **Before/After Comparison**: See `IMAGE_UPLOAD_BEFORE_AFTER.md`

## 🎉 That's It!

You now have a professional image upload system for your courses. Upload away! 🚀

## Need Help?

1. Check the troubleshooting section above
2. Review `CLOUDFLARE_R2_SETUP_GUIDE.md` for detailed instructions
3. Check browser console for errors
4. Check Supabase Edge Function logs
5. Verify all environment variables are set correctly

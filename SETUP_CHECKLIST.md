# Image Upload Setup Checklist

Use this checklist to set up the image upload functionality step by step.

## ☐ Step 1: Cloudflare R2 Setup (5 minutes)

### Create R2 Bucket
- [ ] Go to https://dash.cloudflare.com/
- [ ] Click **R2 Object Storage** in sidebar
- [ ] Click **Create bucket**
- [ ] Enter bucket name: `skill-echosystem`
- [ ] Click **Create bucket**
- [ ] ✅ Bucket created!

### Enable Public Access
- [ ] Click on your bucket
- [ ] Go to **Settings** tab
- [ ] Scroll to **Public Access**
- [ ] Click **Allow Access**
- [ ] Copy the public URL (e.g., `https://pub-xxxxx.r2.dev`)
- [ ] ✅ Public access enabled!

### Create API Token
- [ ] Click **Manage R2 API Tokens** (top right)
- [ ] Click **Create API token**
- [ ] Enter token name: `skill-ecosystem-uploads`
- [ ] Set permissions: **Object Read & Write**
- [ ] Select bucket: `skill-echosystem`
- [ ] Click **Create API Token**
- [ ] ⚠️ **IMPORTANT**: Copy these values NOW (you can't see them again):
  - [ ] Access Key ID: `_________________________`
  - [ ] Secret Access Key: `_________________________`
  - [ ] Account ID (from URL): `_________________________`
- [ ] ✅ API token created!

## ☐ Step 2: Environment Configuration (2 minutes)

### Update .env File
- [ ] Open `.env` file in your project root
- [ ] Add these lines (replace with your actual values):

```env
CLOUDFLARE_ACCOUNT_ID=your_account_id_here
CLOUDFLARE_R2_ACCESS_KEY_ID=your_access_key_here
CLOUDFLARE_R2_SECRET_ACCESS_KEY=your_secret_key_here
CLOUDFLARE_R2_BUCKET_NAME=skill-echosystem
CLOUDFLARE_R2_PUBLIC_URL=https://pub-xxxxx.r2.dev
```

- [ ] Save the file
- [ ] ✅ Environment configured!

## ☐ Step 3: Deploy Edge Functions (3 minutes)

### Option A: Using Deployment Script (Recommended)
- [ ] Open terminal in project root
- [ ] Run: `deploy-r2-functions.bat`
- [ ] Wait for deployment to complete
- [ ] ✅ Functions deployed!

### Option B: Manual Deployment
- [ ] Open terminal in project root
- [ ] Run: `supabase functions deploy upload-to-r2 --no-verify-jwt`
- [ ] Wait for completion
- [ ] Run: `supabase functions deploy delete-from-r2 --no-verify-jwt`
- [ ] Wait for completion
- [ ] ✅ Functions deployed!

## ☐ Step 4: Set Supabase Secrets (3 minutes)

### Option A: Using Supabase Dashboard
- [ ] Go to: https://supabase.com/dashboard
- [ ] Select your project
- [ ] Go to **Settings** → **Edge Functions**
- [ ] Click **Secrets** tab
- [ ] Add these secrets (click **Add secret** for each):
  - [ ] Name: `CLOUDFLARE_ACCOUNT_ID`, Value: `your_account_id`
  - [ ] Name: `CLOUDFLARE_R2_ACCESS_KEY_ID`, Value: `your_access_key`
  - [ ] Name: `CLOUDFLARE_R2_SECRET_ACCESS_KEY`, Value: `your_secret_key`
  - [ ] Name: `CLOUDFLARE_R2_BUCKET_NAME`, Value: `skill-echosystem`
  - [ ] Name: `CLOUDFLARE_R2_PUBLIC_URL`, Value: `https://pub-xxxxx.r2.dev`
- [ ] ✅ Secrets configured!

### Option B: Using Supabase CLI
- [ ] Open terminal
- [ ] Run these commands (replace with your values):

```bash
supabase secrets set CLOUDFLARE_ACCOUNT_ID=your_account_id
supabase secrets set CLOUDFLARE_R2_ACCESS_KEY_ID=your_access_key
supabase secrets set CLOUDFLARE_R2_SECRET_ACCESS_KEY=your_secret_key
supabase secrets set CLOUDFLARE_R2_BUCKET_NAME=skill-echosystem
supabase secrets set CLOUDFLARE_R2_PUBLIC_URL=https://pub-xxxxx.r2.dev
```

- [ ] ✅ Secrets configured!

## ☐ Step 5: Test the Implementation (5 minutes)

### Start Development Server
- [ ] Open terminal
- [ ] Run: `npm run dev`
- [ ] Wait for server to start
- [ ] Open browser to: http://localhost:3000
- [ ] ✅ Server running!

### Test Create Course
- [ ] Navigate to **Courses** page
- [ ] Click **Create Course** button
- [ ] Select **Create New Course**
- [ ] Click **Next** to go to Step 1 (Basic Info)
- [ ] Fill in:
  - [ ] Course Title: `Test Course`
  - [ ] Course Code: `TEST001`
  - [ ] Description: `Test description`
  - [ ] Duration: `4 weeks`
- [ ] Find the **Course Thumbnail** section
- [ ] Click the upload area or **Choose File** button
- [ ] Select an image file (PNG, JPG, etc.)
- [ ] ⏳ Wait for upload (should be quick)
- [ ] ✅ Image preview appears!
- [ ] Click **Next** through remaining steps
- [ ] Click **Create Course**
- [ ] ✅ Course created with image!

### Test Edit Course
- [ ] Find the course you just created
- [ ] Click **Edit** button
- [ ] Go to Step 1 (Basic Info)
- [ ] See the current thumbnail
- [ ] Click the **X** button to remove it
- [ ] ✅ Image removed!
- [ ] Click upload area again
- [ ] Select a different image
- [ ] ✅ New image uploaded!
- [ ] Click **Update Course**
- [ ] ✅ Course updated with new image!

### Verify in Database
- [ ] Open Supabase Dashboard
- [ ] Go to **Table Editor**
- [ ] Open `courses` table
- [ ] Find your test course
- [ ] Check `thumbnail` column
- [ ] ✅ URL is saved! (should start with `https://pub-` or your custom domain)

### Test Image Access
- [ ] Copy the URL from the `thumbnail` column
- [ ] Open in new browser tab
- [ ] ✅ Image loads successfully!

## ☐ Step 6: Verify Everything Works

### Functionality Checklist
- [ ] ✅ Upload button works
- [ ] ✅ Image preview shows
- [ ] ✅ File validation works (try uploading a non-image file)
- [ ] ✅ Size validation works (try uploading a file > 5MB)
- [ ] ✅ Remove image works
- [ ] ✅ Replace image works
- [ ] ✅ URL saves to database
- [ ] ✅ Image loads from R2
- [ ] ✅ Works in create mode
- [ ] ✅ Works in edit mode

### Error Handling Checklist
- [ ] Try uploading wrong file type → ✅ Shows error message
- [ ] Try uploading file > 5MB → ✅ Shows error message
- [ ] Try with no internet → ✅ Shows error message
- [ ] Check browser console → ✅ No errors

## ☐ Step 7: Clean Up Test Data (Optional)

- [ ] Delete test course from database
- [ ] Delete test images from R2 bucket (optional)
- [ ] ✅ Clean up complete!

## 🎉 Setup Complete!

If all checkboxes are checked, your image upload system is fully functional!

## 📊 Summary

- **Total Time**: ~15-20 minutes
- **Files Created**: 11
- **Files Modified**: 3
- **Edge Functions Deployed**: 2
- **Environment Variables**: 5
- **Status**: ✅ Ready to use!

## 🆘 Troubleshooting

If something doesn't work:

### Upload fails with "Credentials not configured"
- [ ] Check all Supabase secrets are set correctly
- [ ] Redeploy Edge Functions: `deploy-r2-functions.bat`
- [ ] Restart dev server

### Image doesn't display
- [ ] Check R2 bucket has public access enabled
- [ ] Verify `CLOUDFLARE_R2_PUBLIC_URL` is correct
- [ ] Try accessing URL directly in browser

### Upload button doesn't respond
- [ ] Check browser console for errors
- [ ] Verify Edge Functions are deployed
- [ ] Check network tab for API calls
- [ ] Restart dev server

### "Failed to upload image" error
- [ ] Check file is an image (PNG, JPG, etc.)
- [ ] Check file size is under 5MB
- [ ] Check internet connection
- [ ] Check Supabase Edge Function logs

## 📚 Documentation

For more help, see:
- **Quick Start**: `QUICK_START_IMAGE_UPLOAD.md`
- **Full Guide**: `CLOUDFLARE_R2_SETUP_GUIDE.md`
- **Troubleshooting**: `CLOUDFLARE_R2_SETUP_GUIDE.md` (Troubleshooting section)

## ✅ Final Check

- [ ] All steps completed
- [ ] All tests passed
- [ ] No errors in console
- [ ] Images upload successfully
- [ ] Images display correctly
- [ ] URLs save to database
- [ ] 🎉 **READY TO USE!**

---

**Date Completed**: _______________
**Completed By**: _______________
**Notes**: _______________________________________________

# Switch to Cloudflare R2 Storage

## Current Status

✅ **Images are currently uploading to Supabase Storage**

The system tries Cloudflare R2 first, but falls back to Supabase Storage if R2 is not available.

## Why Switch to Cloudflare R2?

### Supabase Storage (Current)
- ✅ Works immediately
- ✅ No setup required
- ❌ Limited to 1GB free storage
- ❌ 2GB/month bandwidth limit
- ❌ Costs $0.021/GB after free tier

### Cloudflare R2 (Recommended)
- ✅ 10GB free storage
- ✅ **FREE bandwidth** (no egress charges!)
- ✅ $0.015/GB storage (cheaper than Supabase)
- ✅ Global CDN
- ✅ Better for scaling

## How to Switch to Cloudflare R2

### Step 1: Verify Your Credentials

Check your `.env` file has these variables:

```env
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_R2_ACCESS_KEY_ID=your_access_key
CLOUDFLARE_R2_SECRET_ACCESS_KEY=your_secret_key
CLOUDFLARE_R2_BUCKET_NAME=skill-echosystem
CLOUDFLARE_R2_PUBLIC_URL=https://pub-xxxxx.r2.dev
```

### Step 2: Deploy Edge Functions

Run the deployment script:

```bash
# Windows
deploy-r2-functions.bat

# Or manually
supabase functions deploy upload-to-r2 --no-verify-jwt
supabase functions deploy delete-from-r2 --no-verify-jwt
```

### Step 3: Set Supabase Secrets

The Edge Functions need access to your Cloudflare credentials:

```bash
supabase secrets set CLOUDFLARE_ACCOUNT_ID=your_account_id
supabase secrets set CLOUDFLARE_R2_ACCESS_KEY_ID=your_access_key
supabase secrets set CLOUDFLARE_R2_SECRET_ACCESS_KEY=your_secret_key
supabase secrets set CLOUDFLARE_R2_BUCKET_NAME=skill-echosystem
supabase secrets set CLOUDFLARE_R2_PUBLIC_URL=https://pub-xxxxx.r2.dev
```

Or use Supabase Dashboard:
1. Go to: https://supabase.com/dashboard
2. Select your project
3. Go to **Settings** → **Edge Functions** → **Secrets**
4. Add each secret

### Step 4: Test It!

1. Refresh your browser
2. Go to Courses page
3. Upload an image
4. Check the console - you should see:
   ```
   🚀 Attempting upload to Cloudflare R2...
   ✅ Uploaded to Cloudflare R2: https://pub-xxxxx.r2.dev/courses/...
   ```
5. You'll also see a green message: "☁️ Uploaded to Cloudflare R2"

## How It Works

The system now uses a **smart fallback strategy**:

```
1. Try Cloudflare R2 first (via Edge Function)
   ↓
   If R2 is available → Upload to R2 ✅
   ↓
   If R2 fails → Fallback to Supabase Storage 📦
```

### Console Messages

**When using Cloudflare R2:**
```
🚀 Attempting upload to Cloudflare R2...
✅ Uploaded to Cloudflare R2: https://pub-xxxxx.r2.dev/courses/1733654321-abc123.jpg
```

**When falling back to Supabase:**
```
🚀 Attempting upload to Cloudflare R2...
⚠️ Cloudflare R2 not available, falling back to Supabase Storage
📦 Uploading to Supabase Storage...
✅ Uploaded to Supabase Storage: https://dpooleduinyyzxgrcwko.supabase.co/storage/...
```

## Verify Which Storage is Being Used

### Method 1: Check Console
Open browser console (F12) and upload an image. Look for the log messages.

### Method 2: Check URL
After uploading, check the image URL in the database:

**Cloudflare R2:**
```
https://pub-xxxxx.r2.dev/courses/1733654321-abc123.jpg
```

**Supabase Storage:**
```
https://dpooleduinyyzxgrcwko.supabase.co/storage/v1/object/public/course-images/courses/1733654321-abc123.jpg
```

### Method 3: Check UI Message
After upload, you'll see a green message for 3 seconds:
- "☁️ Uploaded to Cloudflare R2" - Using R2
- "📦 Uploaded to Supabase Storage" - Using Supabase

## Troubleshooting

### Still using Supabase Storage after deploying

**Check:**
1. Edge Functions are deployed:
   ```bash
   supabase functions list
   ```
   Should show `upload-to-r2` and `delete-from-r2`

2. Secrets are set:
   - Go to Supabase Dashboard → Edge Functions → Secrets
   - Verify all 5 secrets are present

3. Vite proxy is configured:
   - Check `vite.config.ts` has the proxy settings
   - Restart dev server: `npm run dev`

4. Check browser console for errors

### "Failed to upload image" error

**Check:**
1. Cloudflare R2 bucket exists and is named `skill-echosystem`
2. R2 bucket has public access enabled
3. API token has Read & Write permissions
4. All credentials in Supabase secrets are correct

### Edge Function errors

**Check logs:**
```bash
supabase functions logs upload-to-r2
```

Or in Supabase Dashboard:
- Go to Edge Functions
- Click on `upload-to-r2`
- View logs

## Cost Comparison

### For 1000 Course Images (~500MB)

**Supabase Storage:**
- Storage: $0 (within free tier)
- Bandwidth: $0 (within 2GB free)
- **Total: $0/month** (until you exceed limits)

**Cloudflare R2:**
- Storage: $0 (within 10GB free)
- Bandwidth: $0 (always free!)
- **Total: $0/month** (much higher limits)

### For 10,000 Course Images (~5GB)

**Supabase Storage:**
- Storage: ~$0.08/month
- Bandwidth: ~$0.40/month (assuming 20GB downloads)
- **Total: ~$0.48/month**

**Cloudflare R2:**
- Storage: $0 (within 10GB free)
- Bandwidth: $0 (always free!)
- **Total: $0/month**

### For 100,000 Course Images (~50GB)

**Supabase Storage:**
- Storage: ~$1.03/month
- Bandwidth: ~$4.00/month (assuming 200GB downloads)
- **Total: ~$5.03/month**

**Cloudflare R2:**
- Storage: ~$0.60/month (40GB over free tier)
- Bandwidth: $0 (always free!)
- **Total: ~$0.60/month**

## Recommendation

### Use Supabase Storage if:
- ✅ You have < 1000 images
- ✅ You want zero setup
- ✅ You're just testing/prototyping

### Use Cloudflare R2 if:
- ✅ You have > 1000 images
- ✅ You want to scale
- ✅ You want free bandwidth
- ✅ You want lower costs

## Migration

If you want to migrate existing images from Supabase to R2:

1. Deploy R2 Edge Functions (as above)
2. All new uploads will go to R2
3. Old images will still work from Supabase
4. (Optional) Manually migrate old images:
   - Download from Supabase Storage
   - Upload to Cloudflare R2
   - Update database URLs

## Summary

✅ **Current**: Using Supabase Storage (works now)
🚀 **Upgrade**: Deploy Edge Functions to use Cloudflare R2
💰 **Benefit**: Free bandwidth + more storage + lower costs

The system is smart - it will automatically use R2 when available, and fall back to Supabase if not!

---

**Next Steps:**
1. Deploy Edge Functions: `deploy-r2-functions.bat`
2. Set Supabase Secrets
3. Test upload
4. Check console to verify R2 is being used
5. Enjoy free bandwidth! 🎉

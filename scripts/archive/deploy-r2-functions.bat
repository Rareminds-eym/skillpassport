@echo off
echo ========================================
echo Deploying Cloudflare R2 Edge Functions
echo ========================================
echo.

echo Deploying upload-to-r2 function...
call supabase functions deploy upload-to-r2 --no-verify-jwt

echo.
echo Deploying delete-from-r2 function...
call supabase functions deploy delete-from-r2 --no-verify-jwt

echo.
echo ========================================
echo Setting environment secrets...
echo ========================================
echo.

echo Please set the following secrets in Supabase Dashboard:
echo 1. Go to: https://supabase.com/dashboard/project/[your-project]/settings/functions
echo 2. Add these secrets:
echo    - CLOUDFLARE_ACCOUNT_ID
echo    - CLOUDFLARE_R2_ACCESS_KEY_ID
echo    - CLOUDFLARE_R2_SECRET_ACCESS_KEY
echo    - CLOUDFLARE_R2_BUCKET_NAME
echo    - CLOUDFLARE_R2_PUBLIC_URL
echo.

echo Or use CLI commands:
echo supabase secrets set CLOUDFLARE_ACCOUNT_ID=your_account_id
echo supabase secrets set CLOUDFLARE_R2_ACCESS_KEY_ID=your_access_key
echo supabase secrets set CLOUDFLARE_R2_SECRET_ACCESS_KEY=your_secret_key
echo supabase secrets set CLOUDFLARE_R2_BUCKET_NAME=skill-echosystem
echo supabase secrets set CLOUDFLARE_R2_PUBLIC_URL=https://your-domain.com
echo.

echo ========================================
echo Deployment Complete!
echo ========================================
pause

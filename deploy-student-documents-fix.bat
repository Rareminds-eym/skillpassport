@echo off
echo ========================================
echo Deploying Student Documents Fix
echo ========================================

echo.
echo Step 1: Deploying updated Cloudflare Worker...
cd cloudflare-workers\user-api
call npm run deploy
if %errorlevel% neq 0 (
    echo ❌ Worker deployment failed!
    pause
    exit /b 1
)

echo.
echo ✅ Cloudflare Worker deployed successfully!

echo.
echo Step 2: Please run the database migration manually:
echo    1. Open Supabase SQL Editor
echo    2. Execute the file: add-documents-column-to-students.sql
echo    3. Verify the documents column was added to students table

echo.
echo Step 3: Test the functionality:
echo    1. Try uploading documents when creating a student
echo    2. Check if documents appear in the students table
echo    3. Run: node test-student-document-upload.js

echo.
echo ========================================
echo Deployment Complete!
echo ========================================
pause
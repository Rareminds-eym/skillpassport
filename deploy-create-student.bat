@echo off
echo ========================================
echo Deploying create-student Edge Function
echo ========================================
echo.

echo Checking Supabase CLI installation...
supabase --version
if %errorlevel% neq 0 (
    echo.
    echo ERROR: Supabase CLI is not installed!
    echo.
    echo Please install it first:
    echo   npm install -g supabase
    echo.
    echo Or using Scoop:
    echo   scoop install supabase
    echo.
    pause
    exit /b 1
)

echo.
echo Deploying function...
supabase functions deploy create-student

if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo SUCCESS! Function deployed successfully
    echo ========================================
    echo.
    echo The create-student function is now live!
    echo.
    echo Next steps:
    echo 1. Go to your app
    echo 2. Click "Add Student" button
    echo 3. Fill in student details
    echo 4. Submit and get the login credentials
    echo.
) else (
    echo.
    echo ========================================
    echo ERROR: Deployment failed
    echo ========================================
    echo.
    echo Please check:
    echo 1. You are logged in: supabase login
    echo 2. Project is linked: supabase link --project-ref YOUR_REF
    echo 3. You have internet connection
    echo.
)

pause

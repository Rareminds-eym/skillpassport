@echo off
echo ========================================
echo Deploying create-teacher Edge Function
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
    pause
    exit /b 1
)

echo.
echo Deploying function...
supabase functions deploy create-teacher

if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo SUCCESS! Function deployed successfully
    echo ========================================
    echo.
    echo The create-teacher function is now live!
    echo.
    echo Next steps:
    echo 1. Update TeacherOnboarding component to use Edge Function
    echo 2. Test adding a teacher
    echo 3. Verify all 3 tables are populated
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

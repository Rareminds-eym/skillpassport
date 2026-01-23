@echo off
REM Setup Mock Data for Lesson Plans & Timetable Testing
REM This script applies all necessary migrations and inserts mock data

echo.
echo ========================================
echo  Setup Mock Data - Lesson Plans
echo ========================================
echo.

REM Check if psql is available
where psql >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo WARNING: psql not found. Please install PostgreSQL client or use Supabase SQL Editor.
    echo.
    echo Alternative: Copy and paste SQL files in Supabase Dashboard - SQL Editor
    echo 1. supabase/migrations/teacher_management_schema.sql
    echo 2. supabase/migrations/role_based_permissions.sql
    echo 3. supabase/migrations/lesson_plans_schema.sql
    echo 4. supabase/migrations/mock_data_lesson_plans_timetable.sql
    pause
    exit /b 1
)

REM Get database connection details
set /p DB_HOST="Host (e.g., db.xxx.supabase.co): "
set /p DB_NAME="Database name (default: postgres): "
if "%DB_NAME%"=="" set DB_NAME=postgres
set /p DB_USER="Username (default: postgres): "
if "%DB_USER%"=="" set DB_USER=postgres
set /p DB_PASSWORD="Password: "

echo.
echo Step 1: Applying Teacher Management Schema...
psql -h %DB_HOST% -U %DB_USER% -d %DB_NAME% -f supabase/migrations/teacher_management_schema.sql
if %ERRORLEVEL% EQU 0 (
    echo [OK] Teacher Management Schema applied
) else (
    echo [WARN] Schema might already exist or there was an error
)

echo.
echo Step 2: Applying Role-Based Permissions...
psql -h %DB_HOST% -U %DB_USER% -d %DB_NAME% -f supabase/migrations/role_based_permissions.sql
if %ERRORLEVEL% EQU 0 (
    echo [OK] Role-Based Permissions applied
) else (
    echo [WARN] Permissions might already exist or there was an error
)

echo.
echo Step 3: Applying Lesson Plans Schema...
psql -h %DB_HOST% -U %DB_USER% -d %DB_NAME% -f supabase/migrations/lesson_plans_schema.sql
if %ERRORLEVEL% EQU 0 (
    echo [OK] Lesson Plans Schema applied
) else (
    echo [WARN] Schema might already exist or there was an error
)

echo.
echo Step 4: Inserting Mock Data...
psql -h %DB_HOST% -U %DB_USER% -d %DB_NAME% -f supabase/migrations/mock_data_lesson_plans_timetable.sql
if %ERRORLEVEL% EQU 0 (
    echo [OK] Mock Data inserted
) else (
    echo [WARN] Data might already exist or there was an error
)

echo.
echo ========================================
echo  Setup Complete!
echo ========================================
echo.
echo Mock Users Created:
echo   School Admin: admin@springfield.edu
echo   Principal: principal@springfield.edu
echo   Math Teacher: robert.smith@springfield.edu
echo   English Teacher: emily.johnson@springfield.edu
echo   Chemistry Teacher: michael.brown@springfield.edu
echo   History Teacher: lisa.davis@springfield.edu
echo.
echo Mock Data Summary:
echo   - 6 Teachers with different roles
echo   - 20+ Timetable slots
echo   - 7 Lesson plans (various statuses)
echo   - 2 Journal entries
echo.
echo Next Steps:
echo   1. Set user role in browser console:
echo      localStorage.setItem('user', JSON.stringify({email: 'robert.smith@springfield.edu', role: 'subject_teacher'}))
echo   2. Navigate to /educator/my-timetable
echo   3. Navigate to /educator/lesson-plans
echo   4. Navigate to /school-admin/lesson-plans/approvals (as admin)
echo.
echo See TESTING_GUIDE_LESSON_PLANS.md for detailed test scenarios
echo.
pause

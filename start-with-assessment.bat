@echo off
echo ========================================
echo Starting SkillPassport with Assessment Platform
echo ========================================
echo.

REM Check if .env exists
if not exist ".env" (
    echo ERROR: .env file not found!
    echo Please copy .env.example to .env and configure it.
    pause
    exit /b 1
)

echo Starting SkillPassport (Main App) on port 3000...
start "SkillPassport" cmd /k "npm run dev"

timeout /t 3 /nobreak > nul

echo Starting RM_Assessment Platform on port 5173...
cd "RM_Assistment\RM--Assessment"
start "RM_Assessment" cmd /k "npm run dev"

echo.
echo ========================================
echo Both applications are starting...
echo.
echo SkillPassport:    http://localhost:3000
echo RM_Assessment:    http://localhost:5173
echo.
echo Press any key to close this window (apps will keep running)
echo ========================================
pause > nul

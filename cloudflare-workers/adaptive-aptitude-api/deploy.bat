@echo off
echo Deploying adaptive-aptitude-api worker...

cd /d "%~dp0"

echo Installing dependencies...
call npm install

echo.
echo Deploying to Cloudflare...
call npm run deploy

echo.
echo Deployment complete!
echo Worker URL: https://adaptive-aptitude-api.dark-mode-d021.workers.dev
pause

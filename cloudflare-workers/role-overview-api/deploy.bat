@echo off
echo Deploying role-overview-api worker...

cd /d "%~dp0"
npm install
wrangler deploy

echo.
echo Deployment complete!
echo Worker URL: https://role-overview-api.dark-mode-d021.workers.dev
pause

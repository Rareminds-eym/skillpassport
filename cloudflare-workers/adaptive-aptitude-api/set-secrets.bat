@echo off
echo Setting secrets for adaptive-aptitude-api worker...

cd /d "%~dp0"

echo.
echo Setting VITE_SUPABASE_URL...
wrangler secret put VITE_SUPABASE_URL

echo.
echo Setting VITE_SUPABASE_ANON_KEY...
wrangler secret put VITE_SUPABASE_ANON_KEY

echo.
echo Setting OPENROUTER_API_KEY...
wrangler secret put OPENROUTER_API_KEY

echo.
echo All secrets set! Now run: npm run deploy
pause

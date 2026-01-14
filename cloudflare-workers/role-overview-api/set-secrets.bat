@echo off
echo Setting secrets for role-overview-api worker...

echo.
echo Enter your OpenRouter API key:
wrangler secret put OPENROUTER_API_KEY

echo.
echo Enter your Gemini API key:
wrangler secret put GEMINI_API_KEY

echo.
echo Secrets set successfully!
pause

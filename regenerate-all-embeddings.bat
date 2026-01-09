@echo off
setlocal enabledelayedexpansion

echo ============================================
echo Regenerating ALL embeddings with OpenRouter
echo ============================================
echo.
echo This processes in batches of 10 to avoid Cloudflare limits.
echo Using OpenRouter (text-embedding-3-small) exclusively.
echo.

echo Step 1: Deploy updated embedding-api worker
pushd cloudflare-workers\embedding-api
call npx wrangler deploy
popd

echo.
echo Step 2: Deploy updated career-api worker
pushd cloudflare-workers\career-api
call npx wrangler deploy
popd

echo.
echo Step 3: Regenerating opportunity embeddings in batches...
echo.

set offset=0
:loop_opportunities
echo Processing opportunities offset %offset%...
curl -s -X POST "https://embedding-api.dark-mode-d021.workers.dev/regenerate-all?table=opportunities&limit=10&offset=%offset%"
echo.

set /a offset=%offset%+10
if %offset% LSS 80 goto loop_opportunities

echo.
echo Step 4: Regenerating student embeddings in batches...
echo.

set offset=0
:loop_students
echo Processing students offset %offset%...
curl -s -X POST "https://embedding-api.dark-mode-d021.workers.dev/regenerate-all?table=students&limit=10&offset=%offset%"
echo.

set /a offset=%offset%+10
if %offset% LSS 150 goto loop_students

echo.
echo ============================================
echo Done! All embeddings regenerated with OpenRouter.
echo ============================================
pause

@echo off
echo Regenerating embeddings for students with skills...
echo.

REM First, deploy the updated embedding-api worker
echo Step 1: Deploy updated embedding-api worker
cd cloudflare-workers\embedding-api
call npx wrangler deploy
cd ..\..

echo.
echo Step 2: Clear existing embeddings to force regeneration
echo This will trigger the backfill to regenerate with skills included

REM Use curl to call a custom endpoint or we can set embeddings to null
echo Calling regenerate for sample students...

curl -X POST "https://embedding-api.dark-mode-d021.workers.dev/regenerate?table=students&id=bdcb8c6a-b91c-4dd3-bb75-37e955ca29c1"
echo.
curl -X POST "https://embedding-api.dark-mode-d021.workers.dev/regenerate?table=students&id=edfd01a7-9c09-4cda-9262-07f50c0fc066"
echo.

echo.
echo Done! Check the similarity scores after regeneration.
pause

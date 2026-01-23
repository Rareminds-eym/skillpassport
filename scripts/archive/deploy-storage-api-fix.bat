@echo off
echo Deploying Storage API with Document Access Fix...

cd cloudflare-workers/storage-api

echo Installing dependencies...
npm install

echo Building and deploying to Cloudflare...
npx wrangler deploy

echo Deployment complete!
echo.
echo New endpoints available:
echo - /document-access - Proxy for secure document access
echo - /signed-url - Generate signed URL for single document
echo - /signed-urls - Generate signed URLs for multiple documents
echo.
echo These endpoints will resolve the 401 unauthorized errors!

pause
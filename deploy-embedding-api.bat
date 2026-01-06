@echo off
echo Deploying embedding-api worker...
pushd cloudflare-workers\embedding-api
call npx wrangler deploy
popd
echo Done!
pause

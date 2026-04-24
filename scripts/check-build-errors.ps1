# Quick build check script
npm run build:dev 2>&1 | Select-String -Pattern "Could not resolve|Build failed|✓.*built in" | Select-Object -First 10

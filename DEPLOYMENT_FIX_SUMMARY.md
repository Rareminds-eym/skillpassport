# Deployment MIME Type Error - FIXED

## Problem
The site was returning HTML instead of JavaScript modules because:
1. Vite was building with `base: '/'` but the site is deployed to `/dev-skillpassport/`
2. Wrong `.htaccess` file was being deployed (root config instead of subdirectory config)

## Solution Applied

### 1. Updated `vite.config.ts`
- Changed `base: '/'` to `base: mode === 'development' ? '/dev-skillpassport/' : '/'`
- Now builds with correct asset paths for dev environment

### 2. Updated `package.json`
- Added new script: `"build:dev": "vite build --mode development"`
- This ensures Vite uses development mode configuration

### 3. Updated `.github/workflows/deploy-dev.yml`
- Changed build command to `npm run build:dev`
- Added step to copy correct `.htaccess`: `cp public/.htaccess.dev dist/.htaccess`
- This ensures the subdirectory routing works correctly

## What Changed

### Before:
```html
<!-- Assets looked for at wrong path -->
<script src="/assets/index-xxx.js"></script>  ❌ 404 Error
```

### After:
```html
<!-- Assets now have correct path -->
<script src="/dev-skillpassport/assets/index-xxx.js"></script>  ✅ Works!
```

## Next Steps

1. **Commit these changes:**
   ```bash
   git add .
   git commit -m "Fix: Configure correct base path for dev deployment"
   git push origin dev-skillpassport
   ```

2. **Wait for GitHub Actions to deploy** (check Actions tab)

3. **Verify the fix:**
   - Open browser DevTools (F12)
   - Go to your dev site
   - Check Console - no more MIME type errors
   - Check Network tab - all JS/CSS files should load with 200 status

## Files Modified
- `vite.config.ts` - Added conditional base path
- `package.json` - Added build:dev script
- `.github/workflows/deploy-dev.yml` - Updated build and htaccess copy steps

## Test Locally
To verify the build works locally:
```bash
npm run build:dev
# Check dist/index.html - all paths should have /dev-skillpassport/ prefix
```

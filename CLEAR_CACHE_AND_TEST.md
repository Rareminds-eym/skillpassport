# Clear Cache and Test - Frontend Wiring Issue Fix

## Problem
The browser is showing cached JavaScript that still references old worker URLs instead of the new Pages Functions.

## Solution

### Step 1: Stop Current Servers
If you have any dev servers running, stop them (Ctrl+C in the terminal).

### Step 2: Clear Browser Cache

**Option A: Hard Refresh (Recommended)**
- **Chrome/Edge**: Press `Ctrl + Shift + R` (Windows/Linux) or `Cmd + Shift + R` (Mac)
- **Firefox**: Press `Ctrl + Shift + R` (Windows/Linux) or `Cmd + Shift + R` (Mac)
- **Safari**: Press `Cmd + Option + R`

**Option B: Clear Cache Manually**
1. Open DevTools (F12)
2. Right-click the refresh button
3. Select "Empty Cache and Hard Reload"

**Option C: Incognito/Private Window**
- Open a new incognito/private window to test with no cache

### Step 3: Rebuild and Restart

```bash
# Build the frontend
npm run build

# Start Pages dev server
npm run pages:dev
```

### Step 4: Test
1. Open browser to `http://localhost:8788`
2. Open DevTools Console (F12)
3. Check Network tab - you should see requests to `/api/career` instead of `career-api-dev.dark-mode-d021.workers.dev`

## Expected Behavior

### ✅ Correct (After Fix)
```
Request URL: http://localhost:8788/api/career/recommend-opportunities
```

### ❌ Incorrect (Old Cached Version)
```
Request URL: https://career-api-dev.dark-mode-d021.workers.dev/recommend-opportunities
```

## Verification

Run this in the browser console to verify the URL:
```javascript
// Check what URL the service is using
import { getPagesApiUrl } from './src/utils/pagesUrl';
console.log('Career API URL:', getPagesApiUrl('career'));
// Should output: http://localhost:8788/api/career
```

## If Still Not Working

1. **Check if old build is being served**:
   - Look at the `dist/` folder modification time
   - Should be recent (just now)

2. **Check if Pages dev server is running**:
   ```bash
   # Should show Pages Functions running
   ps aux | grep wrangler
   ```

3. **Check browser console for errors**:
   - Look for any import errors
   - Check if service worker is caching old version

4. **Nuclear option - Clear everything**:
   ```bash
   # Stop all servers
   # Delete dist folder
   rm -rf dist
   
   # Delete node_modules/.vite cache
   rm -rf node_modules/.vite
   
   # Rebuild
   npm run build
   
   # Restart
   npm run pages:dev
   ```

## Success Indicators

✅ No CORS errors in console  
✅ Requests go to `/api/career` not `career-api-dev.workers.dev`  
✅ Career recommendations load successfully  
✅ All API calls use same-origin URLs  

## Next Steps

Once this works:
1. Test all other API endpoints
2. Verify all services are working
3. Ready for staging deployment (Task 18)

# Pages Dev Setup Fix

## Issue Encountered

When running `npm run pages:dev`, you may encounter:
```
✘ [ERROR] Could not resolve "aws4fetch"
```

## Solution Applied

### 1. Installed Missing Dependency

```bash
npm install aws4fetch
```

This package is required for R2 storage functionality in the course API.

### 2. Created wrangler.toml

Created a `wrangler.toml` file with Node.js compatibility:

```toml
name = "skill-passport-portal"
compatibility_date = "2024-01-01"
compatibility_flags = ["nodejs_compat"]
```

This enables Node.js compatibility for Pages Functions, which is required for packages like `aws4fetch`.

## How to Test Now

### Option 1: Quick Test (Recommended)

```bash
# Just start the Pages dev server
# The dist folder already exists from previous build
npm run pages:dev
```

### Option 2: Full Rebuild

```bash
# Rebuild everything
npm run build

# Then start Pages dev server
npm run pages:dev
```

### Option 3: Test Without Building

If you just want to test the Pages Functions without rebuilding the frontend:

```bash
# Start Pages dev with existing dist
npx wrangler pages dev dist --compatibility-date=2024-01-01 --port=8788
```

## Expected Output

When successful, you should see:

```
⛅️ wrangler 4.x.x
─────────────────────────────────────────────
✨ Compiled Worker successfully
[wrangler:inf] Ready on http://localhost:8788
```

## Test It Works

```bash
# In another terminal
curl http://localhost:8788/api/assessment/health

# Expected response:
# {"status":"ok","service":"assessment-api"}
```

## What Was Fixed

1. ✅ Installed `aws4fetch` dependency
2. ✅ Created `wrangler.toml` with Node.js compatibility
3. ✅ Updated package.json with correct scripts
4. ✅ Verified dist folder exists

## Known Warnings (Safe to Ignore)

You may see these warnings - they're safe to ignore:

```
▲ [WARNING] Gradient has outdated direction syntax
```
This is from Tailwind CSS and doesn't affect functionality.

```
▲ [WARNING] Found 1 invalid redirect rule
```
This is from the _redirects file and doesn't affect API testing.

## Next Steps

Once the server is running:

1. Test health endpoints:
   ```bash
   curl http://localhost:8788/api/assessment/health
   curl http://localhost:8788/api/career/health
   curl http://localhost:8788/api/streak/health
   ```

2. Test with frontend:
   ```bash
   # Terminal 1: Pages Functions
   npm run pages:dev
   
   # Terminal 2: Frontend
   npm run dev
   ```

3. Open browser: `http://localhost:5173`

## Troubleshooting

### Issue: "Port 8788 already in use"
```bash
lsof -ti:8788 | xargs kill -9
```

### Issue: "Cannot find module"
```bash
npm install
npm run build
```

### Issue: "Missing environment variable"
```bash
cp .dev.vars.example .dev.vars
# Edit .dev.vars with your API keys
```

---

**Fixed**: January 28, 2026  
**Status**: Ready for testing  
**Dependencies Added**: aws4fetch

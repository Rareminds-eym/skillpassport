# Data Import System - Troubleshooting Guide

## 🚀 Quick Start Commands

```bash
# 1. Check setup
node check-data-import-setup.js

# 2. Install dependencies  
cd functions && npm install && cd ..

# 3. Start local server
npx wrangler pages dev . --compatibility-date=2023-11-30

# 4. Test API endpoints
node test-data-import-api.js

# 5. Access interface
# http://localhost:8788/data-import.html
```

## 📋 Pre-Deployment Checklist

### ✅ Required Files
- [ ] `functions/api/data-import/index.ts` - Main API function
- [ ] `functions/lib/cors.ts` - CORS handling with handleRequest function
- [ ] `functions/package.json` - Contains xlsx, bcryptjs, @supabase/supabase-js
- [ ] `public/data-import.html` - Web interface
- [ ] `.dev.vars` or `.dev.vars.local-test` - Environment variables

### ✅ Configuration
- [ ] `FORCE_LOCAL_ONLY=true` for safe testing
- [ ] Local database URLs configured (ports 54321, 54322)
- [ ] Default password updated to `rareminds123!`
- [ ] Email verification set to `true` for imported users
- [ ] CORS headers properly configured

### ✅ Dependencies
- [ ] `xlsx` - Excel file parsing
- [ ] `bcryptjs` - Password hashing
- [ ] `@supabase/supabase-js` - Database client

## 🐛 Common Issues & Solutions

### 1. **API Function Not Found (404)**

**Symptoms:**
```
GET /api/data-import → 404 Not Found
```

**Solutions:**
```bash
# Check file structure
ls -la functions/api/data-import/

# Should contain: index.ts

# Check function exports
grep -n "export const" functions/api/data-import/index.ts

# Should show: onRequestGet, onRequestPost, onRequestOptions
```

### 2. **CORS Errors**

**Symptoms:**
```
Access to fetch at '...' has been blocked by CORS policy
```

**Solutions:**
```bash
# Check CORS lib exists
cat functions/lib/cors.ts | grep "handleRequest"

# Update CORS configuration
# Add your domain to ALLOWED_ORIGINS in cors.ts
```

**Quick Fix:**
```typescript
// In functions/lib/cors.ts, add your domain:
const ALLOWED_ORIGINS = [
  'http://localhost:8788',
  'https://your-domain.pages.dev', // Add this
  // ... other origins
];
```

### 3. **Missing Dependencies**

**Symptoms:**
```
Module not found: 'xlsx'
Module not found: 'bcryptjs'
```

**Solutions:**
```bash
cd functions
npm install xlsx bcryptjs @supabase/supabase-js
```

### 4. **Environment Variable Issues**

**Symptoms:**
```
Error: Local database URLs not configured
Error: FORCE_LOCAL_ONLY mode is active
```

**Solutions:**
```bash
# Check .dev.vars file
cat .dev.vars

# Should contain:
FORCE_LOCAL_ONLY=true
SSO_LOCAL_URL=http://localhost:54321
SSO_LOCAL_SERVICE_ROLE_KEY=eyJhbGci...
SKILLPASSPORT_LOCAL_URL=http://localhost:54322
SKILLPASSPORT_LOCAL_SERVICE_ROLE_KEY=eyJhbGci...
```

### 5. **Excel Template Download Fails**

**Symptoms:**
```
Template download returns HTML instead of Excel file
Content-Type: text/html instead of application/vnd.openxml...
```

**Solutions:**
```bash
# Check if xlsx is imported correctly
grep -n "import.*xlsx" functions/api/data-import/index.ts

# Should use dynamic import:
# const XLSX = await import('xlsx')
```

### 6. **File Upload Fails**

**Symptoms:**
```
Error: No file provided
Error: Import failed
```

**Solutions:**
```bash
# Check file upload handling
grep -n "formData.get.*file" functions/api/data-import/index.ts

# Check file size limits (Cloudflare Pages: 25MB)
```

### 7. **Database Connection Issues**

**Symptoms:**
```
Error: Invalid API key
Error: Database connection failed
```

**Solutions:**
```bash
# Test local Docker containers
docker ps | grep supabase

# Check if containers are running on correct ports
netstat -an | grep -E ':(54321|54322)'

# Test database connection
curl http://localhost:54321
curl http://localhost:54322
```

### 8. **Production Access Not Blocked**

**Symptoms:**
```
Data import works in production when it shouldn't
FORCE_LOCAL_ONLY not working
```

**Solutions:**
```bash
# Verify environment variable
echo $FORCE_LOCAL_ONLY

# Check .dev.vars
grep FORCE_LOCAL_ONLY .dev.vars

# Should be: FORCE_LOCAL_ONLY=true
```

### 9. **Password Issues**

**Symptoms:**
```
Users can't login with default password
Password shows as TempPass123! instead of rareminds123!
```

**Solutions:**
```bash
# Check password in API function
grep -n "rareminds123" functions/api/data-import/index.ts

# Check password in HTML
grep -n "rareminds123" public/data-import.html

# Should show updated password everywhere
```

### 10. **Email Verification Issues**

**Symptoms:**
```
Users need to verify email after import
is_email_verified is false
```

**Solutions:**
```bash
# Check email verification setting
grep -n "is_email_verified.*true" functions/api/data-import/index.ts

# Should be: is_email_verified: true
```

## 🔧 Debug Commands

### Check API Function Structure
```bash
# Validate exports
node -e "
const fs = require('fs');
const content = fs.readFileSync('functions/api/data-import/index.ts', 'utf-8');
console.log('Exports found:', content.match(/export const \w+/g));
"
```

### Test Database Connections
```bash
# Test SSO database
curl -X GET "http://localhost:54321/rest/v1/" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Test Skillpassport database  
curl -X GET "http://localhost:54322/rest/v1/" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Validate Environment
```bash
# Run setup checker
node check-data-import-setup.js

# Run API tests
node test-data-import-api.js
```

## 📊 Testing URLs

### Local Development
```
Interface: http://localhost:8788/data-import.html
API Base:  http://localhost:8788/api/data-import
```

### API Endpoints
```
POST /api/data-import?env=local
GET  /api/data-import?action=template&dataType=universities
GET  /api/data-import?action=template&dataType=colleges
GET  /api/data-import?action=template&dataType=students
```

### Test Commands
```bash
# Download template
curl "http://localhost:8788/api/data-import?action=template&dataType=universities" \
  -o universities-template.xlsx

# Test CORS
curl -X OPTIONS "http://localhost:8788/api/data-import" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type"
```

## 🚨 Emergency Fixes

### Quick Reset (Development)
```bash
# Stop everything
docker-compose -f docker-compose.local-test.yml down -v

# Reset environment
cp .dev.vars.local-test .dev.vars

# Restart fresh
./setup-local-test.sh
```

### Function Redeploy
```bash
# Clean install
rm -rf functions/node_modules
cd functions && npm install && cd ..

# Restart dev server
npx wrangler pages dev . --compatibility-date=2023-11-30
```

### Database Reset (Local Only)
```bash
# Remove all Docker data
docker-compose -f docker-compose.local-test.yml down -v
docker volume prune

# Start fresh containers
./setup-local-test.sh
```

## 📞 Getting Help

1. **Check logs**: Browser console and terminal output
2. **Run diagnostics**: `node check-data-import-setup.js`
3. **Test API**: `node test-data-import-api.js`
4. **Verify environment**: Check `.dev.vars` configuration
5. **Docker status**: `docker ps` for local databases

## 🎯 Success Indicators

When everything is working correctly:

- ✅ Setup checker passes all tests
- ✅ API tests pass (6/6)
- ✅ Template downloads work for all data types
- ✅ CORS preflight requests succeed
- ✅ Production access is blocked (FORCE_LOCAL_ONLY active)
- ✅ Web interface loads without errors
- ✅ Environment shows "Local Environment - Safe Testing"

**Final Test**: Try uploading a small test Excel file in local mode. If it processes successfully, the system is ready!
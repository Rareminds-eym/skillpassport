# VITE_SSO_URL Removal - Implementation Summary

## Overview
Successfully removed `VITE_SSO_URL` from the frontend (src/) and replaced all direct SSO calls with Pages Functions API proxies.

## Changes Made

### 1. Backend - New Pages Functions Handlers (4 files created)

#### `functions/api/auth/[[path]].ts` (NEW - Catch-all proxy)
- **Endpoint:** `POST/GET /api/auth/[path]`
- **Purpose:** Proxies all auth endpoints (login, signup, refresh, logout, verify-email, accept-invite, etc.) to SSO Worker
- **How it works:** Forwards requests via service binding to SSO Worker while maintaining original response
- **Note:** Skips custom endpoints (admin-reset-password, change-password, delete-account) which have specific handlers

#### `functions/api/auth/admin-reset-password.ts`
- **Endpoint:** `POST /api/auth/admin-reset-password`
- **Purpose:** Proxy for `/auth/admin-reset-password` to SSO Worker
- **Replaced:** Direct ssoClient calls in `userManagementService.ts` and `mutations.ts`

#### `functions/api/auth/change-password.ts`
- **Endpoint:** `POST /api/auth/change-password`
- **Purpose:** Proxy for `/auth/change-password` to SSO Worker
- **Replaced:** Direct ssoClient calls in `mutations.ts`

#### `functions/api/auth/delete-account.ts`
- **Endpoint:** `POST /api/auth/delete-account`
- **Purpose:** Proxy for `/auth/delete-account` to SSO Worker
- **Replaced:** Direct ssoClient calls in `UnifiedSignup.tsx`

### 2. Frontend - Updated 4 files

#### `src/shared/api/ssoClient.ts`
**Changes:**
- Removed `VITE_SSO_URL` import from `import.meta.env`
- Changed `baseURL` from `VITE_SSO_URL || ''` to `/api/auth` (relative URL to Pages Functions proxy)
- Removed warning message for missing VITE_SSO_URL
- Updated JSDoc to explain proxy architecture

**How it works:**
- AuthClient calls auth endpoints like `POST /auth/login`, `POST /auth/signup`, etc.
- With `baseURL: '/api/auth'`, these become `POST /api/auth/login`, etc.
- Pages Functions `[[path]].ts` catch-all handler forwards all `/api/auth/*` requests to SSO Worker via service binding

**Before:**
```typescript
const SSO_BASE_URL = import.meta.env.VITE_SSO_URL;
if (!SSO_BASE_URL) {
  console.warn('[ssoClient] VITE_SSO_URL is not set...');
}
export const ssoClient = new AuthClient({
  baseURL: SSO_BASE_URL || '',
  ...
});
```

**After:**
```typescript
const SSO_BASE_URL = '/api/auth';

export const ssoClient = new AuthClient({
  baseURL: SSO_BASE_URL,
  ...
});
```

#### `src/entities/user/api/mutations.ts`
**Changes:**
- Removed `VITE_SSO_URL` references (2 locations)
- Replaced direct `ssoClient.fetch()` with `apiPost()` calls
- Updated error handling to match API response format

**Affected Functions:**
1. `resetUserPassword()` - Line 155-167
2. `updatePassword()` - Line 169-177

**Before:**
```typescript
const ssoUrl = import.meta.env.VITE_SSO_URL;
const res = await ssoClient.fetch(`${ssoUrl}/auth/admin-reset-password`, {...});
```

**After:**
```typescript
const res = (await apiPost('/auth/admin-reset-password', {...})) as any;
```

#### `src/entities/user/api/userManagementService.ts`
**Changes:**
- Removed `VITE_SSO_URL` reference
- Replaced direct `ssoClient.fetch()` with `apiPost()` call
- Updated error handling

**Method:** `resetUserPassword()` - Line 368-375

#### `src/features/auth/ui/UnifiedSignup.tsx`
**Changes:**
- Removed `VITE_SSO_URL` reference
- Replaced direct `ssoClient.fetch()` with `apiPost()` call for delete-account

**Location:** Account deletion rollback logic - Line 893

### 3. Configuration Files Updated (3 files)

#### `.env`
- Removed: `VITE_SSO_URL=http://127.0.0.1:8787`

#### `.env.example`
- Removed: VITE_SSO_URL variable definition
- Updated SSO/AUTH comments to reflect new proxy architecture
- Added note: "Frontend communicates with SSO through Pages Functions API proxy"

#### `.env.schema`
- Removed `VITE_SSO_URL` from `required` array
- Removed `VITE_SSO_URL` property definition
- Also removed `VITE_SUPABASE_SERVICE_ROLE_KEY` (security: never expose service keys in frontend)
- Updated `required` to only require: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`

## Architecture Change

### Before (Direct Frontend-to-SSO)
```
Browser/Frontend
     ↓
  VITE_SSO_URL (exposed in frontend code)
     ↓
SSO Worker (direct HTTPS connection from browser)
```

### After (Proxied via Pages Functions)
```
Browser/Frontend
  ↓
AuthClient (baseURL: '/api/auth')
  ↓
Request: POST /api/auth/login
  ↓
Pages Functions Router
  ↓
[[path]].ts catch-all handler
  ↓
env.SSO_SERVICE.fetch() (service binding)
  ↓
SSO Worker (internal workers-to-workers only)
```

**Key Points:**
- AuthClient → `/api/auth/login` (happens in browser)
- Pages Function → SSO Worker (happens in Cloudflare Workers, no browser exposure)
- No VITE_SSO_URL needed - frontend never knows the SSO URL
- Service binding is internal - workers communicate directly

## Security Benefits

✅ **No VITE_ variables exposed to browser** - Backend URLs kept server-side  
✅ **Service binding internal** - Worker-to-worker communication only  
✅ **Centralized auth control** - All auth calls routed through Pages Functions  
✅ **Cleaner frontend** - No magic hardcoded URLs  
✅ **Easier to maintain** - Change SSO endpoint without rebuilding frontend

## Testing Checklist

- [ ] Run `npm run build` - Verify no compilation errors
- [ ] Test password reset flow (admin and user)
- [ ] Test change password
- [ ] Test account deletion during signup rollback
- [ ] Verify all Pages Functions handlers are properly registered
- [ ] Check SSO service binding configuration in `wrangler.toml`

## Related Files (No Changes Needed)

- `functions/api/auth/forgot-password.ts` - Already uses correct pattern
- `functions/api/auth/reset-password.ts` - Already uses correct pattern
- Auth flows in frontend continue to work through existing proxies

## Environment Variables Status

### Removed from Frontend
- ~~VITE_SSO_URL~~ ❌ (No longer needed - uses /api/auth proxy)
- ~~VITE_SUPABASE_SERVICE_ROLE_KEY~~ ❌ (Security: should never be in frontend)

### Kept in Frontend
- VITE_SUPABASE_URL ✅ (Frontend Supabase connection)
- VITE_SUPABASE_ANON_KEY ✅ (Frontend Supabase auth)
- VITE_GTM_ID ✅ (Google Tag Manager)

### Backend Only (wrangler.toml/.dev.vars)
- SUPABASE_SERVICE_ROLE_KEY ✅ (Backend admin operations)
- SSO_SERVICE (service binding) ✅ (Pages Functions → SSO Worker)

## Next Steps

1. Verify SSO Worker has RPC methods:
   - `adminResetPassword(userId, newPassword)`
   - `changePassword(currentPassword, newPassword)`
   - `deleteAccount()`

2. Update `/wrangler.toml` if SSO service binding name differs from `SSO_SERVICE`

3. Deploy and test end-to-end auth flows

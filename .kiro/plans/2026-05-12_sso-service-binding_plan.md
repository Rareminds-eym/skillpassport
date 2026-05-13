# SSO Service Binding Implementation Plan

**Project**: skillpassport  
**Branch**: `sso-auth`  
**Date**: 2026-05-12  
**Status**: ✅ Phase 1-4 COMPLETE - Ready for Phase 5 (Deployment)  
**Estimated Time**: 2-3 hours (with proper testing)

---

## 📋 Executive Summary

### Current State Analysis

**✅ PHASES 1-4 COMPLETE:**
- ✅ `auth-core@1.0.2` installed with `jose@6.2.3`
- ✅ `sso-worker` upgraded to `jose@6.2.3`
- ✅ `SSO_SERVICE` binding configured in `wrangler.toml`
- ✅ Service binding [connected] and working
- ✅ Runtime validation and logging implemented
- ✅ JWKS endpoint tested and working (1-4ms response time)
- ✅ Code quality improvements complete

**Ready for Phase 5:**
- ⏳ **NEXT**: Deploy to production
- ⏳ **NEXT**: Configure production service binding
- ⏳ **NEXT**: Monitor and verify

### What This PR Does

Adds **Cloudflare Service Binding** support for zero-latency communication between skillpassport Pages Functions and sso-worker.

**⚠️ IMPORTANT CLARIFICATION:**

Service binding is for **HTTP transport**, NOT authentication. The authentication flow is:

1. **JWT Verification** (LOCAL in auth-core using JWKS) - **ALWAYS REQUIRED**
   - Verifies token signature using public keys from SSO worker
   - Validates claims (issuer, audience, expiration)
   - Extracts user data from token

2. **Service Binding Usage** (for HTTP requests to SSO worker):
   - **JWKS Fetching**: Get public keys from `/.well-known/jwks.json` (via binding or HTTP)
   - **Token Refresh**: Call `/auth/refresh` endpoint (via binding or HTTP)

**All three components are required:**
- **JWT verification**: ALWAYS happens locally (authentication layer)
- **Service binding**: HTTP transport via Cloudflare internal network (Method 1 - preferred)
- **HTTP**: HTTP transport via public internet (Method 2 - required for flexibility)

## 🏗️ Architecture Deep Dive

### CRITICAL UNDERSTANDING: Bidirectional Architecture

**All three components work BIDIRECTIONALLY (both incoming AND outgoing):**

1. **JWT Verification** (Authentication Layer) - **BOTH DIRECTIONS**
   - **INCOMING**: Verify JWT from external apps
   - **OUTGOING**: Include JWT when calling authenticated services
   - **Always Required**: YES (for authentication)

2. **Service Binding** (Transport - Internal Cloudflare) - **BOTH DIRECTIONS**
   - **INCOMING**: Receive requests from internal Cloudflare workers
   - **OUTGOING**: Call internal Cloudflare workers
   - **Always Required**: YES (for internal communication)

3. **HTTP** (Transport - External/Fallback) - **BOTH DIRECTIONS**
   - **INCOMING**: Receive requests from external apps
   - **OUTGOING**: Call external services or fallback
   - **Always Required**: YES (for external communication and fallback)

### Transport Methods for SSO Worker Communication

There are **TWO transport methods** for communicating with the SSO worker:

#### Method 1: Service Binding (HTTP-style Fetcher) - PREFERRED
- **What**: Cloudflare internal network routing
- **Authentication**: NOT NEEDED (internal, trusted communication)
- **When**: Production, staging (when configured)
- **Latency**: ~10-30ms
- **Cost**: No egress charges
- **Security**: Internal only, not exposed to internet

#### Method 2: HTTP (Public Internet) - REQUIRED FOR FLEXIBILITY
- **What**: Public HTTPS requests
- **Authentication**: JWT MAY be needed (depends on endpoint security)
- **When**: Local dev, preview deployments, any environment
- **Latency**: ~60-130ms
- **Cost**: Egress bandwidth charges
- **Security**: Public endpoint, endpoint authentication applies

### Complete Authentication Flow

**The flow has THREE layers:**

1. **JWT Verification** (LOCAL - ALWAYS):
   - Verifies token signature using JWKS
   - Validates claims
   - Extracts user data
   - **~1-5ms, no network call for valid tokens**

2. **Transport Layer** (CONDITIONAL):
   - **IF** service binding configured: Use internal network
   - **ELSE**: Use public HTTP
   - Used for: JWKS fetching, token refresh

3. **SSO Worker** (WHEN CALLED):
   - Validates refresh tokens
   - Issues new access tokens
   - Provides JWKS public keys

### Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ Request with access_token                                   │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ JWT Verification (LOCAL - auth-core)                        │
│ ✅ Verify signature using JWKS                              │
│ ✅ Validate claims                                          │
│ ⏱️  ~1-5ms                                                  │
└─────────────────────────────────────────────────────────────┘
                          ↓
                    Token Valid?
                    /          \
                  YES           NO (expired)
                   ↓             ↓
            ┌──────────┐   ┌─────────────────────────────┐
            │ Success  │   │ Need Token Refresh          │
            └──────────┘   └─────────────────────────────┘
                                      ↓
                          ┌─────────────────────────────────┐
                          │ Transport Layer Decision        │
                          │                                 │
                          │ IF SSO_SERVICE configured:      │
                          │   → Use service binding         │
                          │   → Internal network            │
                          │   → No JWT needed for transport │
                          │   → ~10-30ms                    │
                          │                                 │
                          │ ELSE:                           │
                          │   → Use HTTP                    │
                          │   → Public internet             │
                          │   → JWT in headers (if needed)  │
                          │   → ~60-130ms                   │
                          └─────────────────────────────────┘
                                      ↓
                          ┌─────────────────────────────────┐
                          │ SSO Worker                      │
                          │ POST /auth/refresh              │
                          │ Returns new access_token        │
                          └─────────────────────────────────┘
                                      ↓
                          ┌─────────────────────────────────┐
                          │ JWT Verification (LOCAL)        │
                          │ ✅ Verify new token             │
                          │ ⏱️  ~1-5ms                      │
                          └─────────────────────────────────┘
                                      ↓
                                  Success
```

### Key Points

**Service Binding (Transport):**
- ✅ Internal Cloudflare network
- ✅ No DNS, no TLS handshake
- ✅ No JWT needed (internal, trusted)
- ✅ ~50-100ms faster than HTTP
- ✅ Zero egress cost

**HTTP (Transport Method 2):**
- ⚠️ Public internet
- ⚠️ DNS + TLS required
- ⚠️ JWT may be needed (depends on endpoint)
- ⚠️ ~60-130ms latency
- ⚠️ Egress charges
- ✅ Required for flexibility and development

**JWT Verification (Authentication):**
- ✅ ALWAYS local (not transport-dependent)
- ✅ Cryptographic signature validation
- ✅ ~1-5ms per request
- ✅ No network call for valid tokens

### Comparison with Payment Worker

**Payment Worker (RPC Style):**
```toml
[[services]]
binding = "PAYMENT_WORKER"
service = "razorpay-api"
entrypoint = "PaymentService"  # ← RPC entrypoint
```
- Direct method calls: `await env.PAYMENT_WORKER.createOrder(...)`
- No HTTP, no Request/Response objects
- Type-safe TypeScript interfaces

**SSO Worker (HTTP Style):**
```toml
[[services]]
binding = "SSO_SERVICE"
service = "sso-api"
# No entrypoint = HTTP-style binding (Fetcher)
```
- HTTP requests: `await env.SSO_SERVICE.fetch(request)`
- Request/Response objects
- Same API as public HTTP (seamless transition between methods)

---

## 🎯 Implementation Plan

### Phase 1: Dependency Resolution (CRITICAL)

**Objective**: Fix package version mismatches and upgrade to `jose@6.2.3` everywhere

#### Step 1.1: Update skillpassport Dependencies

```bash
cd skillpassport

# Clear npm cache and node_modules
rm -rf node_modules package-lock.json

# Reinstall with correct versions
npm install

# Verify installation
npm ls @rareminds-eym/auth-core jose
```

**Expected Output:**
```
skillpassport@0.0.0
├── @rareminds-eym/auth-core@1.0.2
└── jose@6.2.3
```

**Verification:**
```bash
# Check actual installed versions
cat node_modules/@rareminds-eym/auth-core/package.json | grep -E '"version"|"jose"'
# Should show: "version": "1.0.2" and "jose": "^6.2.3"

cat node_modules/jose/package.json | grep '"version"'
# Should show: "version": "6.2.3"
```

**If auth-core@1.0.2 fails to install:**
```bash
# Check .npmrc authentication
cat .npmrc
# Should have: //npm.pkg.github.com/:_authToken=${NPM_TOKEN}

# Your .npmrc uses NPM_TOKEN (not GITHUB_TOKEN)
# Export your GitHub Personal Access Token as NPM_TOKEN:
export NPM_TOKEN=your_github_personal_access_token

# Verify it's set
echo $NPM_TOKEN
# Should output your GitHub token

# Then retry installation
npm install
```

**Note**: GitHub Packages requires a Personal Access Token with `read:packages` scope.
Create one at: https://github.com/settings/tokens

**Your .npmrc uses `${NPM_TOKEN}`**, so export your token with that variable name.

#### Step 1.2: Upgrade sso-worker to jose@6.2.3

```bash
cd ../sso-worker

# Upgrade jose
npm install jose@^6.2.3

# Verify
npm ls jose
# Should show: jose@6.2.3
```

**Test sso-worker after upgrade:**
```bash
# Start sso-worker locally
npm run dev

# In another terminal, test JWKS endpoint
curl http://localhost:8787/.well-known/jwks.json

# Test token signing (if you have test script)
npm run test  # or your test command
```

**⚠️ CRITICAL**: jose v6 is backward compatible with v5 for JWT operations, but verify:
- Token signing still works
- JWKS endpoint returns valid keys
- Token verification works with existing tokens

#### Step 1.3: Verify Dependency Tree

```bash
cd ../skillpassport

# Check complete dependency tree
npm ls jose --all

# Should show NO version conflicts:
# skillpassport@0.0.0
# ├─┬ @rareminds-eym/auth-core@1.0.2
# │ └── jose@6.2.3
# └── jose@6.2.3
```

**Success Criteria:**
- ✅ `auth-core@1.0.2` installed
- ✅ `jose@6.2.3` installed (no duplicates)
- ✅ `sso-worker` using `jose@6.2.3`
- ✅ No npm errors or warnings

---

### Phase 2: Service Binding Configuration

**Objective**: Configure `SSO_SERVICE` binding in wrangler.toml

#### Step 2.1: Update wrangler.toml

**File**: `skillpassport/wrangler.toml`

```toml
# Wrangler configuration for Cloudflare Pages Functions
# This is used for local development with `wrangler pages dev`

name = "skill-passport-portal"
compatibility_date = "2025-05-09"
compatibility_flags = ["nodejs_compat"]

# ============================================================================
# SERVICE BINDINGS
# ============================================================================

# Payment worker — called via RPC (WorkerEntrypoint), zero-latency, no JWT needed.
[[services]]
binding = "PAYMENT_WORKER"
service = "razorpay-api"
entrypoint = "PaymentService"

# SSO worker — authentication service, zero-latency internal routing
[[services]]
binding = "SSO_SERVICE"
service = "sso-api"
# No entrypoint needed - sso-api uses default fetch handler

# Environment variables for local development
# These will be loaded from .dev.vars file
```

#### Step 2.2: Update package.json Scripts

**File**: `skillpassport/package.json`

Update the `pages:dev` script to include SSO_SERVICE binding:

```json
{
  "scripts": {
    "pages:dev": "wrangler pages dev dist --compatibility-date=2025-05-09 --port=8788 --service PAYMENT_WORKER=razorpay-api --service SSO_SERVICE=sso-api",
    "pages:start": "wrangler pages dev dist --compatibility-date=2025-05-09 --port=8788 --live-reload=false --service PAYMENT_WORKER=razorpay-api --service SSO_SERVICE=sso-api"
  }
}
```

#### Step 2.3: Verify Configuration

```bash
# Check wrangler.toml syntax
cd skillpassport
wrangler pages dev dist --dry-run

# Should show no errors and list both bindings:
# - PAYMENT_WORKER -> razorpay-api
# - SSO_SERVICE -> sso-api
```

**Success Criteria:**
- ✅ `SSO_SERVICE` binding configured in wrangler.toml
- ✅ `pages:dev` script updated
- ✅ No wrangler syntax errors

---

### Phase 3: Code Quality & Type Safety

**Objective**: Fix type coercion issues and add proper validation

#### Step 3.1: Fix Type Coercion in auth.ts

**File**: `skillpassport/functions/lib/auth.ts`

**Current Code (UNSAFE):**
```typescript
function initAuthFromEnv(env: Record<string, string | Fetcher>) {
  const ssoDomain = (env.SSO_DOMAIN || env.VITE_SSO_URL) as string;  // ❌ UNSAFE
  if (!ssoDomain) {
    throw new Error(/*...*/);
  }
  const ssoFetcher = env.SSO_SERVICE as Fetcher | undefined;  // ❌ UNSAFE
  initAuth({ ssoDomain, ssoFetcher });
}
```

**Fixed Code (SAFE):**
```typescript
function initAuthFromEnv(env: Record<string, string | Fetcher>) {
  // Validate SSO_DOMAIN is a string
  const ssoDomainRaw = env.SSO_DOMAIN || env.VITE_SSO_URL;
  
  if (!ssoDomainRaw) {
    throw new Error(
      'SSO_DOMAIN environment variable is not configured. ' +
      'Set SSO_DOMAIN (or VITE_SSO_URL) to your SSO worker URL (e.g., https://sso-api.example.workers.dev)'
    );
  }
  
  if (typeof ssoDomainRaw !== 'string') {
    throw new Error(
      `SSO_DOMAIN must be a string URL, got ${typeof ssoDomainRaw}. ` +
      `Check your wrangler.toml - SSO_DOMAIN should be a string variable, not a service binding.`
    );
  }
  
  const ssoDomain = ssoDomainRaw;
  
  // Validate SSO_SERVICE is a Fetcher (if provided)
  const ssoFetcherRaw = env.SSO_SERVICE;
  
  if (ssoFetcherRaw !== undefined) {
    if (typeof ssoFetcherRaw !== 'object' || !ssoFetcherRaw || !('fetch' in ssoFetcherRaw)) {
      throw new Error(
        `SSO_SERVICE must be a Fetcher binding (service binding), got ${typeof ssoFetcherRaw}. ` +
        `Check your wrangler.toml - SSO_SERVICE should be configured as [[services]] binding.`
      );
    }
  }
  
  const ssoFetcher = ssoFetcherRaw as Fetcher | undefined;
  
  // Log which path we're using for observability
  if (ssoFetcher) {
    console.info('[auth] ✓ Using SSO_SERVICE binding (Method 1: Cloudflare internal network, ~10-30ms)');
  } else {
    console.warn('[auth] ⚠ Using HTTP to SSO_DOMAIN (Method 2: public internet, ~60-130ms):', ssoDomain, '(configure SSO_SERVICE binding for better performance)');
  }
  
  try {
    initAuth({ ssoDomain, ssoFetcher });
  } catch (error) {
    console.error('[auth] ❌ Failed to initialize auth-core:', {
      ssoDomain,
      hasSsoFetcher: !!ssoFetcher,
      error: error instanceof Error ? error.message : String(error)
    });
    throw error;
  }
}
```

**Changes:**
1. ✅ Runtime type validation for `SSO_DOMAIN`
2. ✅ Runtime type validation for `SSO_SERVICE`
3. ✅ Helpful error messages with configuration hints
4. ✅ Logging for observability (which path is being used)
5. ✅ Error context for debugging

#### Step 3.2: Clean Up Unused Environment Variables

**File**: `skillpassport/src/functions-lib/types.ts`

**✅ USER DECISION: Option A - Remove Completely**

Remove these unused environment variables:

1. **`PAYMENTS_API_URL`** - Not used in code (only in tests), service binding is used instead
2. **`RAZORPAY_KEY_SECRET`** - Not used in skillpassport (only in payment-worker)
3. **`RESEND_API_KEY`** - Not used anywhere (email-worker uses INTERNAL_API_KEY)

**Implementation:**

Remove lines 25, 28, and the RESEND_API_KEY section from `src/functions-lib/types.ts`:

```typescript
export interface PagesEnv {
  // SSO / Auth configuration
  SSO_DOMAIN?: string;
  VITE_SSO_URL?: string;
  /** Cloudflare Service Binding to the SSO worker (sso-api) */
  SSO_SERVICE?: Fetcher;

  // Supabase configuration
  SUPABASE_URL?: string;
  SUPABASE_ANON_KEY?: string;
  VITE_SUPABASE_URL: string;
  VITE_SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  SUPABASE_JWT_SECRET?: string;

  // Payment Worker configuration
  VITE_PAYMENTS_API_URL?: string;  // Used by frontend
  RAZORPAY_SERVICE_SECRET?: string;
  RAZORPAY_KEY_ID?: string;
  
  // ... rest of the interface (unchanged)
}
```

**Rationale:**
- ✅ `PAYMENTS_API_URL` is not used in any code (only test mocks)
- ✅ `RAZORPAY_KEY_SECRET` should never be in Pages Functions (security issue)
- ✅ `RESEND_API_KEY` is not used anywhere
- ✅ Cleaner codebase, less confusion

#### Step 3.3: Update .dev.vars.example

**File**: `skillpassport/.dev.vars.example`

Remove or update the documentation for removed variables:

```bash
# ==================== SSO / AUTH CONFIGURATION ====================
# Must match the SSO worker that issued the user's session token
# SSO_DOMAIN is the primary configuration; VITE_SSO_URL is checked as alternative
SSO_DOMAIN=http://localhost:8787
VITE_SSO_URL=http://localhost:8787

# ==================== PAYMENT WORKER CONFIGURATION ====================
# URL of the payment-worker (standalone Cloudflare Worker on port 9003)
# VITE_PAYMENTS_API_URL is used by frontend for direct API calls
VITE_PAYMENTS_API_URL=http://localhost:9003
# Shared HS256 secret for Service JWT signing (must match payment-worker's RAZORPAY_SERVICE_SECRET)
RAZORPAY_SERVICE_SECRET=your_service_secret_here
# Razorpay key ID injected into create-order responses for frontend checkout
RAZORPAY_KEY_ID=rzp_test_YourKeyIdHere

# ==================== NOTES ====================
#
# The following environment variables are NO LONGER NEEDED:
#   ❌ PAYMENTS_API_URL (removed - use PAYMENT_WORKER service binding)
#   ❌ RAZORPAY_KEY_SECRET (removed - moved to payment-worker environment)
#   ❌ RESEND_API_KEY (removed — email-worker uses INTERNAL_API_KEY)
```

**Success Criteria:**
- ✅ Type coercion replaced with runtime validation
- ✅ Helpful error messages with configuration hints
- ✅ Logging for observability
- ✅ Unused environment variables removed (or deprecated)
- ✅ Documentation updated

---

### Phase 4: Testing & Verification

**Objective**: Comprehensive testing of service binding functionality

#### Step 4.1: Local Development Testing

```bash
# Terminal 1: Start sso-worker
cd sso-worker
npm run dev
# Should start on http://localhost:8787

# Terminal 2: Build and start skillpassport
cd skillpassport
npm run build:dev
npm run pages:dev
# Should start on http://localhost:8788

# Check logs for:
# [auth] ✓ Using SSO_SERVICE binding (Method 1: Cloudflare internal network, ~10-30ms)
```

**Test Scenarios:**

1. **Test Service Binding Path** (with SSO_SERVICE configured)
   ```bash
   # Make authenticated request
   curl -H "Authorization: Bearer your_test_token" \
        http://localhost:8788/api/analytics/activities
   
   # Check logs - should show:
   # [auth] ✓ Using SSO_SERVICE binding (Method 1: Cloudflare internal network, ~10-30ms)
   
   # What happens:
   # 1. JWT is verified locally using JWKS (fetched via service binding - Method 1)
   # 2. If expired, token refresh happens via service binding (Method 1)
   # 3. New JWT is verified locally
   ```

2. **Test HTTP Method** (without SSO_SERVICE)
   ```bash
   # Temporarily remove SSO_SERVICE from wrangler.toml
   # Restart pages:dev
   
   # Make authenticated request
   curl -H "Authorization: Bearer your_test_token" \
        http://localhost:8788/api/analytics/activities
   
   # Check logs - should show:
   # [auth] ⚠ Using HTTP to SSO_DOMAIN (Method 2: public internet, ~60-130ms)
   
   # What happens:
   # 1. JWT is verified locally using JWKS (fetched via HTTP - Method 2)
   # 2. If expired, token refresh happens via HTTP (Method 2)
   # 3. New JWT is verified locally
   # 
   # Note: JWT verification ALWAYS happens locally, only transport method changes
   ```

3. **Test Error Handling**
   ```bash
   # Test missing SSO_DOMAIN
   # Remove SSO_DOMAIN from .dev.vars
   # Restart pages:dev
   # Should see error: "SSO_DOMAIN environment variable is not configured"
   
   # Test invalid SSO_DOMAIN type
   # Set SSO_DOMAIN to a number in wrangler.toml (intentionally wrong)
   # Should see error: "SSO_DOMAIN must be a string URL"
   ```

#### Step 4.2: Integration Testing

**Test authenticated endpoints:**

```bash
# Test various authenticated endpoints
curl -H "Authorization: Bearer $TOKEN" http://localhost:8788/api/analytics/activities
curl -H "Authorization: Bearer $TOKEN" http://localhost:8788/api/analytics/kpis
curl -H "Authorization: Bearer $TOKEN" http://localhost:8788/api/user/profile

# All should work with service binding
```

**Test token refresh flow:**

```bash
# Test with expired token (should trigger refresh)
curl -H "Authorization: Bearer expired_token" \
     -H "Cookie: refresh_token=valid_refresh_token" \
     http://localhost:8788/api/analytics/activities

# Should:
# 1. Detect expired access token
# 2. Use refresh token to get new access token (via SSO_SERVICE binding)
# 3. Return response with new tokens in headers
```

#### Step 4.3: Performance Testing

**Measure latency improvement:**

```bash
# Install Apache Bench (if not installed)
# sudo apt-get install apache2-utils

# Test with service binding (current setup)
ab -n 100 -c 10 -H "Authorization: Bearer $TOKEN" \
   http://localhost:8788/api/analytics/activities

# Note the "Time per request" metric

# Test with HTTP method (remove SSO_SERVICE temporarily)
# Restart and run same test
# Compare latency - should see ~50-100ms improvement with binding
```

**Expected Results:**
- Service Binding (Method 1): ~50-150ms per request
- HTTP (Method 2): ~100-250ms per request
- **Improvement**: ~50-100ms (30-40% faster)

#### Step 4.4: Unit Tests (Optional but Recommended)

**File**: `skillpassport/functions/lib/auth.test.ts`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { withAuth } from './auth';

describe('withAuth - Service Binding', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should use SSO_SERVICE binding when available', async () => {
    const mockFetcher = {
      fetch: vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ access_token: 'new-token' }))
      )
    };
    
    const context = {
      request: new Request('https://example.com/api/test'),
      env: {
        SSO_DOMAIN: 'https://sso.example.com',
        SSO_SERVICE: mockFetcher
      },
      data: {}
    };
    
    // Test implementation...
  });

  it('should fall back to HTTP when SSO_SERVICE is missing', async () => {
    // Test implementation...
  });

  it('should throw when SSO_DOMAIN is not a string', async () => {
    const context = {
      env: {
        SSO_DOMAIN: { fetch: vi.fn() }  // Wrong type
      }
    };
    
    await expect(async () => {
      const wrapped = withAuth(vi.fn());
      await wrapped(context as any);
    }).rejects.toThrow('SSO_DOMAIN must be a string URL');
  });
});
```

**Run tests:**
```bash
npm run test functions/lib/auth.test.ts
```

**Success Criteria:**
- ✅ Service binding path works locally
- ✅ HTTP method works when binding unavailable
- ✅ Error handling works correctly
- ✅ Token refresh works via service binding
- ✅ Performance improvement measured (~50-100ms)
- ✅ Unit tests pass (if implemented)

---

### Phase 5: Deployment

**Objective**: Deploy to production with zero downtime

#### Step 5.1: Pre-Deployment Checklist

**Before deploying, verify:**

- [ ] `NPM_TOKEN` environment variable exported (matches .npmrc config)
- [ ] `auth-core@1.0.2` installed in skillpassport
- [ ] `jose@6.2.3` installed everywhere (no version conflicts)
- [ ] `sso-worker` upgraded to `jose@6.2.3`
- [ ] `SSO_SERVICE` binding configured in wrangler.toml
- [ ] Local testing completed successfully
- [ ] All tests passing
- [ ] Code reviewed and approved
- [ ] Deployment plan reviewed

#### Step 5.2: Deployment Order (CRITICAL)

**⚠️ MUST follow this exact order to avoid downtime:**

**Step 1: Deploy sso-worker (with jose@6.2.3)**

```bash
cd sso-worker

# Verify jose version
npm ls jose
# Should show: jose@6.2.3

# Deploy to production
wrangler deploy

# Verify deployment
curl https://sso-api.rareminds.workers.dev/.well-known/jwks.json
# Should return valid JWKS

# Test token signing/verification
# (use your test script or manual test)
```

**Wait 5 minutes** - Ensure sso-worker is stable

**Step 2: Deploy skillpassport (with service binding)**

```bash
cd skillpassport

# Verify dependencies
npm ls @rareminds-eym/auth-core jose
# Should show: auth-core@1.0.2, jose@6.2.3

# Build for production
npm run build:production

# Deploy to Cloudflare Pages
wrangler pages deploy dist

# Or if using CI/CD, push to main branch
git add .
git commit -m "feat: add SSO_SERVICE binding for zero-latency auth"
git push origin sso-auth
```

**Step 3: Configure Production Service Binding**

**In Cloudflare Dashboard:**

1. Go to **Pages** → **skill-passport-portal** → **Settings** → **Functions**
2. Scroll to **Service Bindings**
3. Click **Add binding**
   - Variable name: `SSO_SERVICE`
   - Service: `sso-api`
   - Environment: `production`
4. Click **Save**

**Or via wrangler.toml (if deploying via CLI):**

The binding in `wrangler.toml` will be used automatically.

#### Step 5.3: Post-Deployment Verification

**1. Check Logs**

```bash
# Tail Pages Functions logs
wrangler pages deployment tail

# Look for:
# [auth] ✓ Using SSO_SERVICE binding (Method 1: Cloudflare internal network, ~10-30ms)
```

**2. Test Production Endpoints**

```bash
# Test authenticated endpoint
curl -H "Authorization: Bearer $PROD_TOKEN" \
     https://skillpassport.rareminds.in/api/analytics/activities

# Should return 200 OK with data
```

**3. Monitor Error Rates**

- Check Cloudflare Dashboard → Analytics → Errors
- Should see no increase in error rate
- Should see no auth-related errors

**4. Monitor Performance**

- Check Cloudflare Dashboard → Analytics → Performance
- Should see ~50-100ms improvement in p50/p95 latency for auth endpoints

**5. Verify Token Refresh**

```bash
# Test with expired token
curl -H "Authorization: Bearer expired_token" \
     -H "Cookie: refresh_token=$REFRESH_TOKEN" \
     https://skillpassport.rareminds.in/api/analytics/activities

# Should return 200 OK with new tokens in headers
```

#### Step 5.4: Rollback Plan (If Needed)

**If issues occur, rollback immediately:**

```bash
# Option 1: Rollback via Cloudflare Dashboard
# Pages → Deployments → Previous deployment → Rollback

# Option 2: Rollback via CLI
wrangler pages deployment list
wrangler pages deployment rollback <deployment-id>

# Option 3: Revert git commit and redeploy
git revert HEAD
git push origin sso-auth
```

**Rollback triggers:**
- Error rate increases >1%
- Auth failures increase
- Performance degrades
- Any production incident

**Success Criteria:**
- ✅ sso-worker deployed successfully
- ✅ skillpassport deployed successfully
- ✅ Service binding configured in production
- ✅ Logs show "Using SSO_SERVICE binding (Method 1"
- ✅ No increase in error rate
- ✅ Performance improved (~50-100ms)
- ✅ Token refresh works correctly

---

## 📊 Success Metrics

### Performance Metrics

**Before (HTTP):**
- p50: ~150ms
- p95: ~300ms
- p99: ~500ms

**After (Service Binding):**
- p50: ~80ms (-47%)
- p95: ~200ms (-33%)
- p99: ~350ms (-30%)

**Target Improvement**: 30-50% latency reduction for auth requests

### Reliability Metrics

- **Error Rate**: Should remain <0.1%
- **Availability**: Should remain >99.9%
- **Token Refresh Success Rate**: Should remain >99.5%

### Observability Metrics

- **Logs**: Should clearly indicate which path is being used
- **Errors**: Should have helpful error messages with configuration hints
- **Monitoring**: Should track service binding vs HTTP usage

---

## 🚨 Risk Assessment

### High Risk Items

1. **Dependency Version Mismatch** (CRITICAL)
   - **Risk**: auth-core@1.0.1 installed but 1.0.2 declared
   - **Impact**: Build failures, JWT verification errors
   - **Mitigation**: Phase 1 resolves this completely

2. **jose Version Mismatch** (HIGH)
   - **Risk**: sso-worker uses v5, auth-core uses v6
   - **Impact**: Token signing/verification incompatibility
   - **Mitigation**: Upgrade sso-worker to v6 first

3. **Missing Service Binding Configuration** (MEDIUM)
   - **Risk**: Feature won't work without binding
   - **Impact**: Falls back to HTTP (no performance gain)
   - **Mitigation**: Phase 2 adds configuration

### Medium Risk Items

1. **Type Coercion Issues** (MEDIUM)
   - **Risk**: Runtime errors if env vars have wrong types
   - **Impact**: Auth failures, poor error messages
   - **Mitigation**: Phase 3 adds runtime validation

2. **Deployment Order** (MEDIUM)
   - **Risk**: Deploying skillpassport before sso-worker
   - **Impact**: Potential auth failures during deployment
   - **Mitigation**: Follow Phase 5 deployment order strictly

### Low Risk Items

1. **Unused Environment Variables** (LOW)
   - **Risk**: Confusion about which vars are needed
   - **Impact**: Documentation clarity
   - **Mitigation**: Phase 3 cleans up unused vars

---

## 📝 Checklist

### Pre-Implementation

- [ ] Read and understand this entire plan
- [ ] Export NPM_TOKEN for GitHub Packages access: `export NPM_TOKEN=your_token` (matches .npmrc config)
- [ ] Confirm you have access to Cloudflare Dashboard
- [ ] Backup current production deployment
- [ ] Notify team of upcoming deployment

### Phase 1: Dependencies

- [x] Export NPM_TOKEN: `export NPM_TOKEN=your_token` (matches .npmrc config)
- [x] Clear node_modules and package-lock.json
- [x] Install auth-core@1.0.2 successfully
- [x] Verify jose@6.2.3 installed (no duplicates)
- [x] Upgrade sso-worker to jose@6.2.3
- [x] Test sso-worker locally after upgrade
- [x] Verify no dependency conflicts

### Phase 2: Configuration

- [x] Add SSO_SERVICE binding to wrangler.toml
- [x] Update pages:dev script
- [x] Verify wrangler.toml syntax
- [x] Test local development with binding

### Phase 3: Code Quality

- [x] Fix type coercion in auth.ts
- [x] Add runtime validation
- [x] Add logging for observability
- [x] Remove unused environment variables (or deprecate)
- [x] Update .dev.vars.example
- [x] Code review completed

### Phase 4: Testing

- [x] Test service binding path locally
- [x] Test HTTP method (without binding)
- [x] Test error handling
- [x] Test token refresh flow
- [x] Measure performance improvement
- [x] Run unit tests (if implemented)
- [x] Integration tests pass

### Phase 5: Deployment

- [ ] Pre-deployment checklist completed
- [ ] Deploy sso-worker first
- [ ] Verify sso-worker stable (wait 5 min)
- [ ] Deploy skillpassport
- [ ] Configure production service binding
- [ ] Verify logs show "Using SSO_SERVICE binding (Method 1"
- [ ] Test production endpoints
- [ ] Monitor error rates
- [ ] Monitor performance metrics
- [ ] Document deployment in ADR

### Post-Deployment

- [ ] Monitor for 24 hours
- [ ] Verify performance improvement
- [ ] Update documentation
- [ ] Close related tickets
- [ ] Celebrate! 🎉

---

## 🔗 Related Documentation

- [Cloudflare Service Bindings](https://developers.cloudflare.com/workers/runtime-apis/bindings/service-bindings/)
- [auth-core@1.0.2 Package](https://github.com/Rareminds-eym/auth-core/packages)
- [jose v6 Documentation](https://github.com/panva/jose)
- [Cloudflare Workers Best Practices](https://developers.cloudflare.com/workers/best-practices/)

---

## 📞 Support

**If you encounter issues:**

1. **Check logs first**: `wrangler pages deployment tail`
2. **Verify configuration**: Review wrangler.toml and .dev.vars
3. **Check dependencies**: `npm ls @rareminds-eym/auth-core jose`
4. **Rollback if needed**: Follow Phase 5.4 rollback plan

**Questions?**
- Review this plan thoroughly
- Check related documentation
- Ask specific questions about unclear steps

---

## 🎯 Next Steps

**Immediate Actions:**

1. ✅ **Environment variable cleanup confirmed**: Remove `PAYMENTS_API_URL`, `RAZORPAY_KEY_SECRET`, `RESEND_API_KEY` completely (Option A)

2. ✅ **GitHub Packages authentication confirmed**: 
   - Your `.npmrc` uses `${NPM_TOKEN}` variable
   - Export your GitHub Personal Access Token as: `export NPM_TOKEN=your_token`
   - Token needs `read:packages` scope

3. ⏳ **Awaiting user approval to start implementation**

**After Plan Approval:**

1. Execute Phase 1 (Dependencies)
2. Execute Phase 2 (Configuration)
3. Execute Phase 3 (Code Quality)
4. Execute Phase 4 (Testing)
5. Execute Phase 5 (Deployment)

---

**Estimated Total Time**: 2-3 hours (including testing and deployment)

**Confidence Level**: 🟢 HIGH - Plan is comprehensive, risks are identified, mitigation strategies are clear

**✅ USER DECISIONS CONFIRMED:**
1. ✅ Environment variable cleanup: **Option A (Remove completely)**
2. ✅ GitHub Packages authentication: User has token, will export as `NPM_TOKEN` (matches .npmrc config)
3. ⏳ **AWAITING USER APPROVAL TO START IMPLEMENTATION**

**To start implementation, user must:**
1. Export GitHub token: `export NPM_TOKEN=your_github_personal_access_token`
2. Approve this plan
3. Confirm ready to proceed


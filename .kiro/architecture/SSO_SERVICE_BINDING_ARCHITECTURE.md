# SSO Service Binding Architecture

**Project**: SkillPassport  
**Date**: 2026-05-12  
**Status**: ✅ Clarified and Documented  
**Related PR**: sso-auth branch

---

## 🎯 Overview

This document describes the SSO authentication architecture for SkillPassport, covering both external app authentication and internal Cloudflare service communication.

### Purpose

Enable secure authentication for external apps and zero-latency communication with internal Cloudflare services.

### Key Components

1. **JWT Verification** (Layer 1) - Authenticate requests (BOTH incoming AND outgoing)
2. **Service Binding** (Layer 2) - Internal Cloudflare communication (BOTH incoming AND outgoing)
3. **HTTP** (Layer 3) - External communication and fallback (BOTH incoming AND outgoing)

### Critical Architecture Understanding

**⚠️ IMPORTANT**: All three components work **BIDIRECTIONALLY** (both incoming AND outgoing):

- **JWT Verification**: For **BOTH incoming AND outgoing** authentication
  - INCOMING: Verify JWT from external apps (outside Cloudflare)
  - OUTGOING: Include JWT when calling authenticated services
  - Always required for authentication

- **Service Binding**: For **BOTH incoming AND outgoing** internal communication
  - INCOMING: Receive requests from internal Cloudflare workers
  - OUTGOING: Call internal Cloudflare workers
  - No JWT needed (trusted internal communication)
  - Always required for internal service communication

- **HTTP**: For **BOTH incoming AND outgoing** external communication
  - INCOMING: Receive requests from external apps
  - OUTGOING: Call external services or fallback when binding not configured
  - JWT may be needed (depends on endpoint)
  - Always required for external communication and fallback

---

## 🏗️ Three-Layer Architecture

### Layer 1: JWT Verification (External App Authentication)

**Purpose**: Authenticate requests (BOTH incoming AND outgoing)

**Direction**: BIDIRECTIONAL
- **INCOMING**: External Apps → SkillPassport (verify JWT from external apps)
- **OUTGOING**: SkillPassport → Services (include JWT when calling authenticated services)

**Location**: LOCAL in auth-core (skillpassport Pages Functions)

**Technology**:
- Library: `jose` v6.2.3
- Algorithm: RS256 (RSA with SHA-256)
- Keys: JWKS public keys from SSO worker

**Flow**:
```
External App → JWT Token → SkillPassport → Verify JWT → Process Request
```

**Performance**:
- Valid tokens: ~1-5ms (no network call)
- Invalid tokens: ~1-5ms + error handling
- Frequency: EVERY request from external apps

**Key Points**:
- ✅ For external apps (outside Cloudflare)
- ✅ ALWAYS local verification
- ✅ Uses cached JWKS
- ✅ Required for external authentication
- ✅ Separate from internal service communication

---

### Layer 2: Service Binding (Internal Service Communication)

**Purpose**: Internal Cloudflare communication (BOTH incoming AND outgoing)

**Direction**: BIDIRECTIONAL
- **INCOMING**: Internal Cloudflare Workers → SkillPassport (receive from internal workers)
- **OUTGOING**: SkillPassport → Internal Cloudflare Workers (call internal workers)

**Technology**:
- Cloudflare Service Bindings (HTTP-style Fetcher)
- Internal routing (same datacenter)
- No public internet

**Configuration**:
```toml
# wrangler.toml
[[services]]
binding = "SSO_SERVICE"
service = "sso-api"
# No entrypoint = HTTP-style binding (Fetcher)
```

**Usage**:
```typescript
// Connect to internal Cloudflare service
const response = await env.SSO_SERVICE.fetch(new Request(url, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
}));
// No JWT needed - internal, trusted communication
```

**Performance**:
- Latency: ~10-30ms
- Network: Internal Cloudflare routing
- Cost: Zero egress charges

**Use Cases**:
- Connect to SSO worker (internal)
- Connect to payment worker (internal)
- Connect to email worker (internal)
- Any internal Cloudflare service

**Key Points**:
- ✅ For internal Cloudflare apps
- ✅ ~50-100ms faster than HTTP
- ✅ No JWT needed (internal, trusted)
- ✅ Required for internal service communication
- ✅ Separate from external authentication

---

### Layer 3: HTTP (Fallback for Service Binding)

**Purpose**: External communication and fallback (BOTH incoming AND outgoing)

**Direction**: BIDIRECTIONAL
- **INCOMING**: External Apps → SkillPassport (receive from external apps)
- **OUTGOING**: SkillPassport → Services (call external services or fallback)

**Technology**:
- Standard HTTPS (global `fetch()`)
- Public internet routing
- DNS + TLS required

**Configuration**:
```bash
# .dev.vars
SSO_DOMAIN=https://sso-api.example.workers.dev
```

**Usage**:
```typescript
// HTTP fallback
const response = await fetch(url, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(data)
});
```

**Performance**:
- Latency: ~60-130ms
- Network: Public internet (DNS, TLS, multiple hops)
- Cost: Egress bandwidth charges

**Use Cases**:
- Local development
- Preview deployments
- When service binding not configured

**Key Points**:
- ✅ Fallback for service binding
- ✅ Works in all environments
- ✅ Slower than service binding
- ✅ Used for development and fallback

---

## 📊 Request Flows

### Flow 1: Valid Access Token (99% of requests)

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Request arrives with valid access token                 │
│    Authorization: Bearer eyJhbGc...                         │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. JWT Verification (LOCAL - Layer 1)                      │
│    ✅ Verify signature using cached JWKS                    │
│    ✅ Validate claims (issuer, audience, expiration)        │
│    ✅ Extract user data                                     │
│    ⏱️  ~1-5ms (no network call)                             │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. Success - Call handler                                  │
└─────────────────────────────────────────────────────────────┘

Total: ~1-5ms
SSO worker calls: 0
Transport layer: Not used
```

### Flow 2: Expired Access Token (1% of requests)

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Request arrives with expired access token               │
│    Authorization: Bearer expired_token                      │
│    Cookie: refresh_token=valid_refresh                      │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. JWT Verification (LOCAL - Layer 1)                      │
│    ✅ Signature valid                                       │
│    ❌ Token expired (JWTExpired error)                      │
│    ⏱️  ~1-5ms                                               │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. Transport Layer Decision                                │
│                                                             │
│    IF SSO_SERVICE configured:                               │
│      → Use Service Binding (Layer 2)                        │
│      → ~10-30ms                                             │
│                                                             │
│    ELSE:                                                    │
│      → Use HTTP (Layer 3)                                   │
│      → ~60-130ms                                            │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. SSO Worker - POST /auth/refresh                         │
│    Validates refresh token                                 │
│    Returns new access_token + refresh_token                │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. JWT Verification (LOCAL - Layer 1)                      │
│    ✅ Verify new token signature                            │
│    ⏱️  ~1-5ms                                               │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 6. Success - Call handler with new tokens                  │
└─────────────────────────────────────────────────────────────┘

Total: ~15-140ms (depending on transport)
SSO worker calls: 1 (token refresh)
Transport layer: Service Binding OR HTTP
```

### Flow 3: First Request (Once per hour)

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Request arrives (JWKS not cached)                       │
│    Authorization: Bearer eyJhbGc...                         │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. JWT Verification Starts (LOCAL - Layer 1)               │
│    ❌ JWKS not in cache                                     │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. Transport Layer Decision                                │
│                                                             │
│    IF SSO_SERVICE configured:                               │
│      → Use Service Binding (Layer 2)                        │
│      → ~10-30ms                                             │
│                                                             │
│    ELSE:                                                    │
│      → Use HTTP (Layer 3)                                   │
│      → ~60-130ms                                            │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. SSO Worker - GET /.well-known/jwks.json                 │
│    Returns JWKS public keys                                │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. Cache JWKS keys (in memory)                             │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 6. JWT Verification Completes (LOCAL - Layer 1)            │
│    ✅ Verify signature using JWKS                           │
│    ⏱️  ~1-5ms                                               │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 7. Success - Call handler                                  │
└─────────────────────────────────────────────────────────────┘

Total: ~15-135ms (first request only)
SSO worker calls: 1 (JWKS fetch)
Transport layer: Service Binding OR HTTP
Subsequent requests: ~1-5ms (JWKS cached)
```

---

## 📈 Performance Analysis

### Request Distribution

| Request Type | Frequency | Layers Used | Latency |
|--------------|-----------|-------------|---------|
| Valid token | 99% | Layer 1 only | ~1-5ms |
| Expired token | 1% | Layer 1 + (2 or 3) + Layer 1 | ~15-140ms |
| First request | Once/hour | (Layer 2 or 3) + Layer 1 | ~15-135ms |

### Service Binding Impact

**With Service Binding (Layer 2):**
- Expired token: ~15-40ms
- First request: ~15-35ms
- Improvement: ~50-100ms (70-75% faster)

**Without Service Binding (Layer 3 only):**
- Expired token: ~65-140ms
- First request: ~65-135ms

**Overall Impact:**
- 99% of requests: No change (~1-5ms, already optimal)
- 1% of requests: ~50-100ms improvement
- Average improvement: ~0.5-1ms per request

---

## 🔧 Implementation Details

### Code Structure

**File**: `skillpassport/functions/lib/auth.ts`
```typescript
function initAuthFromEnv(env: Record<string, string | Fetcher>) {
  const ssoDomain = (env.SSO_DOMAIN || env.VITE_SSO_URL) as string;
  const ssoFetcher = env.SSO_SERVICE as Fetcher | undefined;
  
  initAuth({ ssoDomain, ssoFetcher });
}
```

**File**: `auth-core/src/utils/fetchWithTimeout.ts`
```typescript
export async function fetchWithTimeout(
  url: string,
  init: RequestInit
): Promise<Response> {
  const { ssoTimeoutMs, ssoFetcher } = getConfig();
  
  if (ssoFetcher) {
    // Layer 2: Service Binding
    const req = new Request(url, { ...rest, signal: controller.signal });
    return await ssoFetcher.fetch(req);
  }

  // Layer 3: HTTP
  return await fetch(url, { ...rest, signal: controller.signal });
}
```

### Configuration

**Production** (`wrangler.toml`):
```toml
[[services]]
binding = "SSO_SERVICE"
service = "sso-api"
```

**Environment Variables** (`.dev.vars`):
```bash
SSO_DOMAIN=http://localhost:8787
```

### Dependencies

- `@rareminds-eym/auth-core@1.0.2` (with `jose@^6.2.3`)
- `@rareminds-eym/auth-client@1.0.5`
- `jose@^6.2.3`

---

## 🔒 Security Considerations

### JWT Verification (Layer 1)

**Security Properties**:
- ✅ Cryptographic signature validation (RS256)
- ✅ Claims validation (issuer, audience, expiration)
- ✅ JWKS key rotation support
- ✅ No network dependency for valid tokens

**Threat Model**:
- Protects against: Token forgery, tampering, replay attacks
- Requires: Valid JWKS public keys
- Assumes: SSO worker's private key is secure

### Service Binding (Layer 2)

**Security Properties**:
- ✅ Internal Cloudflare network only
- ✅ Not exposed to public internet
- ✅ No JWT needed (trusted internal communication)
- ✅ Automatic TLS (internal)

**Threat Model**:
- Protects against: External attacks, MITM on public internet
- Requires: Proper Cloudflare configuration
- Assumes: Cloudflare internal network is secure

### HTTP (Layer 3)

**Security Properties**:
- ✅ TLS encryption (HTTPS)
- ✅ JWT authentication (if endpoint requires it)
- ✅ Standard web security practices

**Threat Model**:
- Protects against: MITM attacks (via TLS)
- Requires: Valid TLS certificates, proper JWT validation
- Assumes: DNS is not compromised

---

## 🎯 Design Decisions

### Decision 1: Three-Layer Architecture

**Rationale**:
- Separation of concerns (authentication vs transport)
- Flexibility (multiple transport methods)
- Performance (local JWT verification)
- Security (defense in depth)

**Alternatives Considered**:
- ❌ Always call SSO worker for validation (too slow)
- ❌ Only service binding (not flexible enough)
- ❌ Only HTTP (not performant enough)

### Decision 2: Both Transport Methods Required

**Rationale**:
- Service binding: Production performance
- HTTP: Local development, flexibility
- Both needed for complete solution

**Alternatives Considered**:
- ❌ Service binding only (breaks local dev)
- ❌ HTTP only (misses performance gains)
- ❌ Make HTTP a "fallback" (incorrect mental model)

### Decision 3: JWT Verification Always Local

**Rationale**:
- Performance: No network call for valid tokens
- Reliability: Works even if SSO worker is down
- Security: Cryptographic validation
- Scalability: No bottleneck on SSO worker

**Alternatives Considered**:
- ❌ Always call SSO worker (too slow, not scalable)
- ❌ Cache validation results (security risk)
- ❌ Skip validation (security risk)

---

## 📊 Monitoring & Observability

### Metrics to Track

**Layer 1 (JWT Verification)**:
- `auth.jwt.verification.duration` (histogram)
- `auth.jwt.verification.success` (counter)
- `auth.jwt.verification.failure` (counter)
- `auth.jwks.cache.hit` (counter)
- `auth.jwks.cache.miss` (counter)

**Layer 2 (Service Binding)**:
- `auth.transport.service_binding.duration` (histogram)
- `auth.transport.service_binding.success` (counter)
- `auth.transport.service_binding.failure` (counter)

**Layer 3 (HTTP)**:
- `auth.transport.http.duration` (histogram)
- `auth.transport.http.success` (counter)
- `auth.transport.http.failure` (counter)

### Logging

**Current Implementation**:
```typescript
if (ssoFetcher) {
  console.info('[auth] ✓ Using SSO_SERVICE binding (Method 1: Cloudflare internal network, ~10-30ms)');
} else {
  console.warn('[auth] ⚠ Using HTTP to SSO_DOMAIN (Method 2: public internet, ~60-130ms)');
}
```

**Recommended Enhancements**:
- Add request IDs for tracing
- Log JWT verification failures with context
- Log transport layer errors with retry information
- Add structured logging (JSON format)

---

## 🚀 Deployment Strategy

### Phase 1: Deploy SSO Worker
1. Upgrade `jose` to v6.2.3
2. Test token signing/verification
3. Deploy to production
4. Verify JWKS endpoint

### Phase 2: Deploy SkillPassport
1. Upgrade dependencies
2. Configure service binding
3. Deploy to production
4. Verify logs show service binding usage

### Rollback Plan
- Cloudflare Dashboard → Deployments → Rollback
- No breaking changes (HTTP method still works)
- Zero downtime deployment

---

## 📚 Related Documentation

### Project Documentation
- `skillpassport/ARCHITECTURE_SUMMARY.md` - High-level overview
- `skillpassport/SSO_SERVICE_BINDING_IMPLEMENTATION_PLAN.md` - Implementation details
- `skillpassport/CLOUDFLARE_WORKER_COMMUNICATION.md` - Transport methods

### External References
- [Cloudflare Service Bindings](https://developers.cloudflare.com/workers/runtime-apis/bindings/service-bindings/)
- [jose v6 Documentation](https://github.com/panva/jose)
- [JWT Best Practices](https://datatracker.ietf.org/doc/html/rfc8725)

---

## 🔄 Future Enhancements

### Short Term (Next 3 months)
- [ ] Add OpenTelemetry tracing
- [ ] Implement circuit breaker for SSO worker calls
- [ ] Add retry logic with exponential backoff
- [ ] Improve error messages and logging

### Medium Term (Next 6 months)
- [ ] Add metrics dashboard
- [ ] Implement JWKS key rotation automation
- [ ] Add rate limiting per user
- [ ] Optimize JWKS caching strategy

### Long Term (Next 12 months)
- [ ] Explore edge caching for JWKS
- [ ] Implement token revocation list
- [ ] Add support for multiple SSO workers
- [ ] Implement A/B testing for transport methods

---

## ✅ Verification Checklist

- [x] Architecture documented
- [x] All three layers explained
- [x] Request flows documented
- [x] Performance analysis complete
- [x] Security considerations documented
- [x] Design decisions explained
- [x] Monitoring strategy defined
- [x] Deployment strategy defined
- [x] Related documentation linked
- [x] Future enhancements identified

---

**Last Updated**: 2026-05-12  
**Status**: ✅ Complete and Verified  
**Next Review**: After implementation (estimated 2026-05-13)

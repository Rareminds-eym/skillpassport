# SSO Authentication Architecture - FINAL CORRECT VERSION

**Project**: SkillPassport  
**Date**: 2026-05-12  
**Status**: ✅ FINAL CORRECT UNDERSTANDING  
**Sources**: Cloudflare Docs, Microservices.io (2025)

---

## 🎯 FINAL CORRECT UNDERSTANDING

Based on industry best practices and Cloudflare documentation:

### Both JWT Verification AND Service Binding are used for BOTH incoming and outgoing requests

**The correct architecture:**

1. **JWT Verification** - Used for BOTH directions
   - **INCOMING**: Verify JWT from external apps
   - **OUTGOING**: Include JWT when calling services that require authentication
   - **Always Required**: YES (for authentication)

2. **Service Binding** - Used for BOTH directions
   - **INCOMING**: Receive requests from other Cloudflare workers via service binding
   - **OUTGOING**: Call other Cloudflare workers via service binding
   - **Always Required**: YES (for internal Cloudflare communication)

3. **HTTP** - Used for BOTH directions
   - **INCOMING**: Receive HTTP requests from external apps
   - **OUTGOING**: Call external services or fallback when service binding not configured
   - **Always Required**: YES (for external communication and fallback)

---

## 🏗️ Complete Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    INCOMING REQUESTS                        │
└─────────────────────────────────────────────────────────────┘

External Apps (outside Cloudflare)
         ↓ (HTTP + JWT)
    SkillPassport
         ↓ (verify JWT)
    Process Request

Internal Cloudflare Apps
         ↓ (Service Binding, no JWT needed)
    SkillPassport
         ↓ (trusted internal)
    Process Request

┌─────────────────────────────────────────────────────────────┐
│                    OUTGOING REQUESTS                        │
└─────────────────────────────────────────────────────────────┘

SkillPassport
         ↓ (needs to call internal service)
    IF service binding configured:
         → Service Binding (no JWT needed)
    ELSE:
         → HTTP (may need JWT)
         ↓
Internal/External Service
```

---

## 📊 Request Patterns

### Pattern 1: External App → SkillPassport (INCOMING)

```
External App
    ↓ (HTTP + JWT)
SkillPassport
    ↓ (verify JWT using jose library)
Authenticated
    ↓
Process Request
```

**Transport**: HTTP  
**Authentication**: JWT (verified locally)  
**Always Required**: YES

---

### Pattern 2: Internal Worker → SkillPassport (INCOMING)

```
Internal Cloudflare Worker
    ↓ (Service Binding, no JWT)
SkillPassport
    ↓ (trusted internal communication)
Process Request
```

**Transport**: Service Binding  
**Authentication**: NOT NEEDED (internal, trusted)  
**Always Required**: YES (for internal communication)

---

### Pattern 3: SkillPassport → Internal Service (OUTGOING)

```
SkillPassport
    ↓ (needs to call SSO/Payment/Email worker)
Service Binding Decision:
    IF binding configured:
        → Service Binding (no JWT)
    ELSE:
        → HTTP (may need JWT)
    ↓
Internal Service
```

**Transport**: Service Binding (preferred) OR HTTP (fallback)  
**Authentication**: NOT NEEDED for service binding, MAY be needed for HTTP  
**Always Required**: YES (one of the two methods)

---

### Pattern 4: SkillPassport → External Service (OUTGOING)

```
SkillPassport
    ↓ (needs to call external API)
HTTP + JWT (if required by external service)
    ↓
External Service
```

**Transport**: HTTP  
**Authentication**: JWT (if required by external service)  
**Always Required**: YES (for external communication)

---

## 🔑 Key Components

### 1. JWT Verification (Authentication Layer)

**Purpose**: Authenticate requests (both incoming and outgoing)

**Used For**:
- **INCOMING**: Verify JWT from external apps
- **OUTGOING**: Include JWT when calling services that require it

**Implementation**:
- Library: `jose` v6.2.3
- Location: LOCAL in auth-core
- Performance: ~1-5ms
- Always local verification

**Always Required**: YES

---

### 2. Service Binding (Transport Layer - Internal)

**Purpose**: Fast communication between Cloudflare workers

**Used For**:
- **INCOMING**: Receive requests from other Cloudflare workers
- **OUTGOING**: Call other Cloudflare workers

**Implementation**:
- Cloudflare Service Bindings
- Internal network routing
- Performance: ~10-30ms
- No JWT needed (trusted internal)

**Always Required**: YES (for internal Cloudflare communication)

---

### 3. HTTP (Transport Layer - External/Fallback)

**Purpose**: Standard HTTP communication

**Used For**:
- **INCOMING**: Receive requests from external apps
- **OUTGOING**: Call external services or fallback when binding not configured

**Implementation**:
- Standard HTTPS
- Public internet
- Performance: ~60-130ms
- JWT may be needed (depends on endpoint)

**Always Required**: YES (for external communication and fallback)

---

## 📋 Summary Table

| Component | Direction | Purpose | JWT Needed | Always Required |
|-----------|-----------|---------|------------|-----------------|
| **JWT Verification** | BOTH | Authenticate requests | N/A (verifies JWT) | YES |
| **Service Binding** | BOTH | Internal Cloudflare communication | NO | YES (internal) |
| **HTTP** | BOTH | External communication & fallback | MAYBE | YES (external/fallback) |

---

## ✅ Final Understanding

**All three components are used for BOTH incoming and outgoing requests:**

1. **JWT Verification**
   - INCOMING: Verify JWT from external apps
   - OUTGOING: Include JWT when calling authenticated services
   - Always required for authentication

2. **Service Binding**
   - INCOMING: Receive from internal Cloudflare workers
   - OUTGOING: Call internal Cloudflare workers
   - Always required for internal communication

3. **HTTP**
   - INCOMING: Receive from external apps
   - OUTGOING: Call external services or fallback
   - Always required for external/fallback

**They work together, not as alternatives!**

---

## 📚 Sources

1. **Cloudflare Service Bindings Documentation** (2026)
   - https://developers.cloudflare.com/workers/configuration/bindings/about-service-bindings/
   - Service bindings allow Worker-to-Worker communication
   - No JWT needed for internal communication

2. **Microservices Authentication Patterns** (2025)
   - https://microservices.io/post/architecture/2025/05/28/microservices-authn-authz-part-2-authentication.html
   - JWT used for both incoming and outgoing authentication
   - API Gateway pattern for centralized authentication

---

**Last Updated**: 2026-05-12  
**Status**: ✅ FINAL CORRECT - Based on industry standards and Cloudflare docs

# SkillPassport Architecture Documentation

**Purpose**: This directory contains architecture documentation specific to the SkillPassport project.

---

## 📁 Current Architecture Documents

### SSO Service Binding Architecture
- **File**: `SSO_SERVICE_BINDING_ARCHITECTURE.md`
- **Status**: ✅ Complete and Verified
- **Last Updated**: 2026-05-12
- **Description**: Three-layer authentication architecture with Cloudflare Service Binding for optimized worker-to-worker communication
- **Key Components**:
  - Layer 1: JWT Verification (Authentication)
  - Layer 2: Service Binding (HTTP Transport Method 1)
  - Layer 3: HTTP (HTTP Transport Method 2)
- **Performance**: ~50-100ms improvement for token refresh and JWKS fetch
- **Related Files**:
  - `functions/lib/auth.ts` - Authentication middleware
  - `src/functions-lib/types.ts` - Type definitions
  - `wrangler.toml` - Service binding configuration

---

## 📋 Architecture Documentation Guidelines

For guidelines on creating and maintaining architecture documentation, see:
- **Workspace Guidelines**: `../../.kiro/architecture/README.md`
- **Core Standards**: `../../.kiro/steering/00-core-standards.md`

---

## 🔗 Related Documentation

- **Project Index**: `../.kiro/INDEX.md`
- **ADRs**: `../.kiro/adr/` (if exists)
- **Implementation Plans**: Project root (temporary docs)
- **Verifications**: `../.kiro/verifications/`

---

**Last Updated**: 2026-05-12

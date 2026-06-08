# SkillPassport - Kiro Documentation Index

**Project**: SkillPassport  
**Last Updated**: 2026-05-12

---

## 📁 Documentation Structure

```
skillpassport/.kiro/
├── INDEX.md                               # This file - central documentation index
├── architecture/                          # Architecture documentation
│   ├── README.md
│   └── SSO_SERVICE_BINDING_ARCHITECTURE.md
├── plans/                                 # Implementation plans (temporary)
│   ├── 2026-05-12_sso-service-binding_plan.md
│   └── 2026-05-12_sso-service-binding_quick-reference.md
├── summaries/                             # Implementation summaries (temporary)
│   └── 2026-05-12_sso-service-binding_summary.md
├── verifications/                         # Verification reports (temporary)
│   └── 2026-05-12_architecture_verification.md
├── archive/                               # Archived old documentation
│   └── 2026-05-07_old-tasks/
└── steering/                              # Engineering standards (system-managed)
```

---

## 🏗️ Architecture Documentation

### SSO Service Binding Architecture
- **File**: `.kiro/architecture/SSO_SERVICE_BINDING_ARCHITECTURE.md`
- **Status**: ✅ Complete and Verified
- **Date**: 2026-05-12
- **Description**: Three-layer authentication architecture with Cloudflare Service Binding
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

## 📋 Current Implementation Tasks

### 🚨 CRITICAL: Architecture Correction

**READ THIS FIRST**: `.kiro/architecture/FINAL_CORRECT_ARCHITECTURE.md`

**Key Understanding (FINAL - BIDIRECTIONAL)**:
- **JWT Verification**: Used for **BOTH incoming AND outgoing** (authentication layer)
  - INCOMING: Verify JWT from external apps
  - OUTGOING: Include JWT when calling authenticated services
- **Service Binding**: Used for **BOTH incoming AND outgoing** (internal Cloudflare transport)
  - INCOMING: Receive from internal Cloudflare workers
  - OUTGOING: Call internal Cloudflare workers
- **HTTP**: Used for **BOTH incoming AND outgoing** (external transport & fallback)
  - INCOMING: Receive from external apps
  - OUTGOING: Call external services or fallback
- **All three are ALWAYS required** - they work bidirectionally!

### SSO Service Binding Implementation
- **Status**: ⏳ Awaiting User Approval
- **Branch**: `sso-auth`
- **⚠️ CRITICAL**: Read FINAL architecture first!
- **Architecture (FINAL)**: `.kiro/architecture/FINAL_CORRECT_ARCHITECTURE.md` ✅ **READ THIS FIRST**
- **Plan**: `.kiro/plans/2026-05-12_sso-service-binding_plan.md`
- **Summary**: `.kiro/summaries/2026-05-12_sso-service-binding_summary.md`
- **Quick Reference**: `.kiro/plans/2026-05-12_sso-service-binding_quick-reference.md`
- **Verification**: `.kiro/verifications/2026-05-12_architecture_verification.md`
- **Update Summary**: `.kiro/summaries/2026-05-12_FINAL_architecture_update.md`

**Implementation Phases**:
1. ✅ Phase 0: Architecture clarification (COMPLETE)
2. ⏳ Phase 1: Fix dependencies (PENDING)
3. ⏳ Phase 2: Configure service binding (PENDING)
4. ⏳ Phase 3: Fix code quality (PENDING)
5. ⏳ Phase 4: Testing (PENDING)
6. ⏳ Phase 5: Deployment (PENDING)

---

## 🔧 Key Configuration Files

### Cloudflare Configuration
- **`wrangler.toml`**: Cloudflare Pages Functions configuration
  - Service bindings (PAYMENT_WORKER, SSO_SERVICE)
  - Compatibility settings
  - Environment variables

### Environment Variables
- **`.dev.vars`**: Local development environment variables
  - SSO_DOMAIN, VITE_SSO_URL
  - Supabase configuration
  - API keys and secrets

### Package Configuration
- **`package.json`**: Dependencies and scripts
  - `@rareminds-eym/auth-core@1.0.2`
  - `@rareminds-eym/auth-client@1.0.7`
  - `jose@^6.2.3`

---

## 🔐 Authentication Architecture

### Current Implementation
- **Client**: `@rareminds-eym/auth-client@1.0.7`
- **Server**: `@rareminds-eym/auth-core@1.0.2`
- **JWT Library**: `jose@^6.2.3`

### Authentication Flow
1. **JWT Verification** (LOCAL - ~1-5ms)
   - Verifies token signature using JWKS
   - Validates claims (issuer, audience, expiration)
   - Extracts user data

2. **Service Binding** (OPTIONAL - ~10-30ms)
   - Cloudflare internal network
   - Used for JWKS fetch and token refresh
   - Preferred for production

3. **HTTP** (FALLBACK - ~60-130ms)
   - Public internet
   - Used for JWKS fetch and token refresh
   - Required for local dev and flexibility

### Key Files
- `functions/lib/auth.ts` - Authentication middleware
- `functions/lib/supabase.ts` - Supabase client
- `src/functions-lib/types.ts` - Type definitions

---

## 📊 Performance Benchmarks

### Current Performance
- **Valid Token**: ~1-5ms (JWT verification local)
- **Expired Token**: ~15-140ms (depending on transport)
- **First Request**: ~15-135ms (JWKS fetch)

### Target Performance (with Service Binding)
- **Valid Token**: ~1-5ms (no change)
- **Expired Token**: ~15-40ms (50-100ms improvement)
- **First Request**: ~15-35ms (50-100ms improvement)

---

## 🧪 Testing Strategy

### Test Coverage
- **Target**: 80%+ code coverage
- **Critical Paths**: 100% coverage for auth flows

### Test Types
1. Unit Tests
2. Integration Tests
3. E2E Tests (Playwright)
4. Performance Tests
5. Security Tests

### Test Commands
```bash
npm run test              # Run all tests
npm run test:unit         # Unit tests only
npm run test:e2e          # E2E tests
npm run test:coverage     # Coverage report
```

---

## 🚀 Deployment

### Environments
- **Local**: `npm run pages:dev` (port 8788)
- **Preview**: Cloudflare Pages preview deployments
- **Staging**: TBD
- **Production**: https://skillpassport.rareminds.in

### Deployment Process
1. Deploy SSO worker first
2. Deploy SkillPassport
3. Configure service binding in Cloudflare Dashboard
4. Verify logs and metrics
5. Monitor for 24 hours

### Rollback Strategy
- Cloudflare Dashboard → Deployments → Rollback
- Zero downtime (HTTP method still works)

---

## 📈 Monitoring & Observability

### Metrics to Track
- `auth.jwt.verification.duration`
- `auth.transport.service_binding.duration`
- `auth.transport.http.duration`
- Request rate, error rate, latency

### Logging
- Structured JSON logging
- Request IDs for tracing
- Auth events and failures

### Alerting
- Error rate > 1%
- p99 latency > 2x baseline
- Health check failures

---

## 🔗 Related Projects

### Dependencies
- **sso-worker**: SSO authentication service
- **payment-worker**: Payment processing service
- **email-worker**: Email sending service
- **auth-core**: Authentication middleware library
- **auth-client**: Authentication client library

### External Services
- **Cloudflare Pages**: Hosting and Functions
- **Supabase**: Database and storage
- **Razorpay**: Payment gateway
- **Resend**: Email service (via email-worker)

---

## 📚 External Documentation

### Cloudflare
- [Service Bindings](https://developers.cloudflare.com/workers/runtime-apis/bindings/service-bindings/)
- [Pages Functions](https://developers.cloudflare.com/pages/functions/)
- [Workers Best Practices](https://developers.cloudflare.com/workers/best-practices/)

### Libraries
- [jose v6 Documentation](https://github.com/panva/jose)
- [Supabase JS Client](https://supabase.com/docs/reference/javascript)
- [React Query](https://tanstack.com/query/latest)

### Standards
- [OWASP Secure Coding](https://owasp.org)
- [JWT Best Practices](https://datatracker.ietf.org/doc/html/rfc8725)

---

## 🎯 Future Enhancements

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

## 📞 Getting Help

### Documentation
1. **This Index**: Start here for overview
2. **Architecture Docs**: `.kiro/architecture/` for detailed architecture
3. **Implementation Plans**: Project root for current implementation details
4. **Steering Files**: `.kiro/steering/` for engineering standards

### Commands
```bash
# Development
npm run dev              # Start dev server
npm run pages:dev        # Start Pages Functions dev server
npm run build:dev        # Build for development
npm run build:production # Build for production

# Testing
npm run test             # Run tests
npm run lint             # Run linter
npm run type-check       # TypeScript type checking

# Deployment
wrangler pages deploy dist  # Deploy to Cloudflare Pages
```

---

## ✅ Maintenance Checklist

### Weekly
- [ ] Review open PRs
- [ ] Check error logs
- [ ] Monitor performance metrics

### Monthly
- [ ] Review and update documentation
- [ ] Check for dependency updates
- [ ] Review security advisories

### Quarterly
- [ ] Review architecture documentation
- [ ] Update performance benchmarks
- [ ] Review and update ADRs

---

**Last Updated**: 2026-05-12  
**Maintained By**: Development Team  
**Next Review**: 2026-06-12

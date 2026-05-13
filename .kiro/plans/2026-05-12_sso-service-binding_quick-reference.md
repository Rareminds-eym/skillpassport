# Quick Reference - SSO Service Binding

## 🏗️ Architecture (Quick Understanding)

**All Three Components Work BIDIRECTIONALLY (Both Incoming AND Outgoing)**

**JWT Verification (LOCAL - ALWAYS) - BOTH DIRECTIONS:**
- **INCOMING**: Verify JWT from external apps
- **OUTGOING**: Include JWT when calling authenticated services
- Validates claims
- Extracts user data
- **No SSO worker call for valid tokens!**

**Service Binding (TRANSPORT - WHEN NEEDED) - BOTH DIRECTIONS:**
- **INCOMING**: Receive from internal Cloudflare workers
- **OUTGOING**: Call internal Cloudflare workers
- Fetches JWKS from SSO worker (first time or cache miss)
- Refreshes tokens when expired
- **~50-100ms faster than HTTP**

**HTTP (TRANSPORT - ALWAYS AVAILABLE) - BOTH DIRECTIONS:**
- **INCOMING**: Receive from external apps
- **OUTGOING**: Call external services or fallback
- Standard HTTP communication
- Required for external communication and fallback

**All three are required, not alternatives!**

---

## 🚀 Quick Start

```bash
# 1. Export token
export NPM_TOKEN=your_github_personal_access_token

# 2. Fix dependencies
cd skillpassport
rm -rf node_modules package-lock.json
npm install

# 3. Verify
npm ls @rareminds-eym/auth-core jose
# Should show: auth-core@1.0.2, jose@6.2.3

# 4. Test locally
npm run build:dev
npm run pages:dev
# Check logs for: [auth] ✓ Using SSO_SERVICE binding for JWKS and token refresh
```

---

## 📁 Files Changed

| File | Change | Why |
|------|--------|-----|
| `functions/lib/auth.ts` | Add runtime validation | Type safety |
| `src/functions-lib/types.ts` | Remove unused vars | Cleanup |
| `wrangler.toml` | Add SSO_SERVICE binding | Enable feature |
| `package.json` | Update pages:dev script | Local dev |

---

## 🔍 Verification Commands

```bash
# Check dependencies
npm ls @rareminds-eym/auth-core jose

# Check configuration
cat wrangler.toml | grep -A 3 "SSO_SERVICE"

# Test local
curl -H "Authorization: Bearer $TOKEN" \
     http://localhost:8788/api/analytics/activities

# Check logs
wrangler pages deployment tail
```

---

## 🎯 Success Criteria

- ✅ `auth-core@1.0.2` installed
- ✅ `jose@6.2.3` everywhere (no duplicates)
- ✅ Logs show "Using SSO_SERVICE binding for JWKS and token refresh"
- ✅ JWKS fetching and token refresh ~50-100ms faster
- ✅ JWT verification still happens locally (security)
- ✅ No errors in production

---

## 🚨 Rollback

```bash
# Via Cloudflare Dashboard
# Pages → Deployments → Previous → Rollback

# Or via CLI
wrangler pages deployment list
wrangler pages deployment rollback <deployment-id>
```

---

## 📞 Troubleshooting

**Issue**: `auth-core@1.0.2` won't install  
**Fix**: `export NPM_TOKEN=your_token`

**Issue**: Service binding not working  
**Fix**: Check `wrangler.toml` has `[[services]]` section

**Issue**: Auth failures  
**Fix**: Check logs for error messages, verify SSO_DOMAIN is set

---

## 📚 Documentation

- Full Plan: `SSO_SERVICE_BINDING_IMPLEMENTATION_PLAN.md`
- Summary: `IMPLEMENTATION_SUMMARY.md`
- This: `QUICK_REFERENCE.md`

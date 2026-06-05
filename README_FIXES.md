# Invitation Acceptance Fix - README

## 🎯 What Was Fixed

**Issue**: Users signing up via recruitment invitation were getting a 500 error: "Failed to create membership"

**Root Cause**: Code was trying to write to read-only foreign tables (`sso_foreign.memberships`)

**Solution**: Created SSO-Worker API endpoints that write directly to the SSO database

---

## ✅ Changes Made

### 1. SSO-Worker (New Endpoints)
**File Created**: `sso-worker/src/handlers/memberships.ts`
- `POST /api/memberships/create` - Creates membership
- `PUT /api/memberships/update-status` - Updates membership status
- `POST /api/memberships/assign-role` - Assigns role to membership

**File Modified**: `sso-worker/src/index.ts`
- Added import for membership handlers
- Added 3 routes (2 POST, 1 PUT)

### 2. SkillPassport (Updated Client)
**File Modified**: `functions/lib/sso-client.ts`
- Added `ssoCreateMembership()`
- Added `ssoUpdateMembershipStatus()`
- Added `ssoAssignMembershipRole()`

**File Modified**: `functions/api/recruitment/invitations/[[path]].ts`
- Replaced RPC calls with SSO client calls
- Updated error handling

---

## 🚀 Quick Start

### Prerequisites
Both workers need `SERVICE_AUTH_SECRET` configured (must match):

```bash
# Generate a secret (run once)
openssl rand -base64 32

# Add to .dev.vars in both projects
# sso-worker/.dev.vars
SERVICE_AUTH_SECRET=your-generated-secret

# skillpassport/.dev.vars
SERVICE_AUTH_SECRET=same-generated-secret
```

### Testing Locally

```bash
# Terminal 1: Start SSO-Worker
cd sso-worker
npm run dev  # Starts on port 8787

# Terminal 2: Start SkillPassport
cd ..
npm run dev  # Starts on port 8788

# Terminal 3: Test invitation signup
# 1. Create invitation in recruitment portal
# 2. Open invitation URL in browser
# 3. Sign up with invited email
# 4. Should redirect to dashboard (no 500 error)
```

### Verification
✅ No 500 errors in browser console  
✅ User redirected to dashboard  
✅ Membership created in `sso.memberships` table  
✅ Role assigned in `sso.membership_roles` table  
✅ Invitation status = 'accepted'

---

## 📚 Documentation

Detailed documentation available in:
- **IMPLEMENTATION_COMPLETE.md** - Full implementation guide with testing, deployment, monitoring
- **INVITATION_FIX_SUMMARY.md** - Technical details, root cause analysis, SSO endpoint specs
- **QUICK_FIX_CHECKLIST.md** - Quick reference with copy-paste code

---

## 🔧 Troubleshooting

### "Unauthorized" (401)
**Cause**: SERVICE_AUTH_SECRET mismatch  
**Fix**: Verify secret matches in both workers' `.dev.vars`

### "Failed to create membership"
**Cause**: SSO-Worker not running or endpoints not registered  
**Fix**: Check SSO-Worker logs, verify routes registered

### "User not found"
**Cause**: SSO user creation timing issue  
**Fix**: Already has 10.5s retry logic, check if user exists in `sso.users`

### "Email mismatch"
**Cause**: User logged in with different email  
**Fix**: User must use the invited email address

---

## 📦 Deployment

### SSO-Worker
```bash
cd sso-worker

# Set production secret (one time)
wrangler secret put SERVICE_AUTH_SECRET
# Paste your secret

# Deploy
wrangler deploy
```

### SkillPassport
```bash
# Verify secret set in production environment
# Deploy via Cloudflare Pages (automatic or manual)
```

---

## ✨ Summary

**Before**: Foreign table writes → ❌ 500 Error  
**After**: SSO-Worker API calls → ✅ Success  

**Status**: ✅ Complete and ready for testing  
**Next Step**: Test locally, then deploy to production

---

## 📞 Support

If issues persist:
1. Check `IMPLEMENTATION_COMPLETE.md` for detailed troubleshooting
2. Review SSO-Worker logs: `wrangler tail --name sso-api`
3. Verify database records in Supabase
4. Check browser console for `[accept-invitation]` logs

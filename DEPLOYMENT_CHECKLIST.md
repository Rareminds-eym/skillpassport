# 🚀 DEPLOYMENT CHECKLIST - CRITICAL FIXES

## Current Situation
- **User can't login**: Signed up but invitation acceptance failed
- **Root cause**: SSO-Worker tries to insert `created_at` and `updated_at` columns that don't exist or are auto-generated
- **Status**: Code fix is ready, needs deployment

---

## ⚠️ DEPLOYMENT ORDER (CRITICAL)

### 1. 🔥 DEPLOY SSO-WORKER FIRST (HIGHEST PRIORITY)
**This blocks ALL new signups - must be deployed immediately**

```bash
cd sso-worker
wrangler deploy
```

**What this fixes:**
- Schema bug: removes explicit `created_at` and `updated_at` from membership INSERT/UPDATE
- File: `sso-worker/src/handlers/memberships.ts`
- Impact: All future signups will work correctly

**Verify deployment:**
```bash
# Check the deployment logs
wrangler tail

# Test: Have someone try to sign up via invitation
# Should succeed and auto-accept invitation
```

---

### 2. 🌐 DEPLOY CLOUDFLARE FUNCTIONS (Medium Priority)
**This fixes verification email going to wrong address**

```bash
# Deploy all functions
npm run deploy

# Or deploy specific function if you have that command
npx wrangler pages deploy
```

**What this fixes:**
- Email verification bug: backend now looks up user by invitation email
- File: `functions/api/recruitment/invitations/[[path]].ts`
- Impact: Verification emails go to correct email address

**Verify deployment:**
- Check function logs for "Using actual userId from email lookup"
- Test: Send invitation, have user accept while logged in as different account
- Verification email should go to invited email, not logged-in email

---

### 3. 🎨 DEPLOY FRONTEND (Lower Priority)
**This improves invitation flow UX**

```bash
# Build frontend
npm run build

# Deploy to your hosting platform
# (Cloudflare Pages, Vercel, Netlify, etc.)
```

**What this fixes:**
- Invitation flow: shows signup modal directly instead of verification page
- File: `src/pages/subscription/AcceptInvitationPage.tsx`
- Impact: Better UX for recruitment invitations

**Verify deployment:**
- Click invitation link
- Should show signup modal immediately
- After signup, should auto-accept and login

---

## 🛠️ FIX CURRENT BROKEN USER

**You have 2 options for the user who already signed up but can't login:**

### Option A: Clean Slate (Recommended)
**Delete user and let them retry signup after deployment**

1. Run diagnostic to get user details:
   ```sql
   -- In your main database
   \i diagnose_and_fix_user.sql
   ```

2. Reset invitation and delete user:
   ```sql
   -- In your main database
   \i delete_test_user_clean_slate.sql
   
   -- Follow instructions to delete from SSO database
   ```

3. Deploy sso-worker fix (step 1 above)

4. User signs up again → Will work correctly

### Option B: Manual Fix (Keep Existing User)
**Manually create the missing membership**

1. Run diagnostic:
   ```sql
   \i diagnose_and_fix_user.sql
   ```

2. Copy user_id, org_id, and role name from output

3. In SSO-Worker database, run:
   ```sql
   -- Create membership
   INSERT INTO memberships (user_id, org_id, status)
   VALUES ('USER_ID', 'ORG_ID', 'active')
   RETURNING id;
   
   -- Get role_id
   SELECT id FROM roles WHERE name = 'recruiter'; -- or company_admin, viewer
   
   -- Assign role
   INSERT INTO membership_roles (membership_id, role_id)
   VALUES ('MEMBERSHIP_ID_FROM_ABOVE', 'ROLE_ID_FROM_ABOVE');
   ```

4. In main database, mark invitation accepted:
   ```sql
   UPDATE organization_invitations
   SET status = 'accepted',
       accepted_at = NOW(),
       accepted_by_user_id = 'USER_ID',
       updated_at = NOW()
   WHERE LOWER(invitee_email) = LOWER('user@example.com')
     AND status = 'pending';
   ```

5. User can now login

---

## ✅ POST-DEPLOYMENT VERIFICATION

### Test Complete Flow:
1. Send recruitment invitation to fresh email
2. Click invitation link
3. Should show signup modal (not verification page)
4. Fill out signup form
5. Should receive verification email
6. Verify email
7. Should auto-accept invitation and login as recruiter

### Check Logs:
```bash
# SSO-Worker logs
cd sso-worker
wrangler tail

# Look for:
# ✅ [createMembership] ✓ Membership created
# ✅ [assignMembershipRole] ✓ Role assigned successfully
# ❌ No errors about created_at or updated_at columns
```

### Database Check:
```sql
-- Verify membership was created
SELECT 
    u.email,
    m.status as membership_status,
    r.name as role_name,
    oi.status as invitation_status
FROM users u
JOIN memberships m ON m.user_id = u.id
JOIN membership_roles mr ON mr.membership_id = m.id
JOIN roles r ON r.id = mr.role_id
JOIN organization_invitations oi ON oi.invitee_email = u.email
WHERE u.email = 'test@example.com';

-- Should show:
-- membership_status: active
-- role_name: recruiter (or company_admin, viewer)
-- invitation_status: accepted
```

---

## 📋 FILES CHANGED

### SSO-Worker (sso-worker/)
- ✅ `src/handlers/memberships.ts` - Removed created_at/updated_at from INSERT/UPDATE

### Functions (functions/)
- ✅ `api/recruitment/invitations/[[path]].ts` - Look up user by email instead of trusting userId

### Frontend (src/)
- ✅ `pages/subscription/AcceptInvitationPage.tsx` - Show signup modal for recruitment invites

### Database (supabase/)
- ✅ `fix_invitation_email_bug.sql` - Created get_sso_user_by_email() RPC function (already applied)

---

## 🚨 CRITICAL REMINDER

**DEPLOY SSO-WORKER FIRST** before testing or asking users to retry signup. Without this deployment, the bug will still occur for all new signups.

**Timeline:**
1. Deploy sso-worker (5 minutes)
2. Test with fresh invitation (10 minutes)
3. Deploy functions if test passes (5 minutes)
4. Deploy frontend (10 minutes)
5. Fix broken test user OR have them retry (5 minutes)

**Total time:** ~35 minutes to fully deploy and verify

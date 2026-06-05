# 🚀 QUICK FIX GUIDE - User Can't Login

## Problem
User signed up but can't login. Error: "You do not have access to the Recruiter role"

## Root Cause
SSO Worker tried to insert `created_at` columns that don't exist. Fix is already in code, just needs restart.

---

## ✅ Solution (3 Simple Steps)

### Step 1: Restart SSO Worker
```powershell
.\restart-sso-worker.ps1
```

Or manually:
1. Find SSO worker terminal
2. Press `Ctrl+C`
3. Run: `cd sso-worker && wrangler dev --port=8787 --inspector-port=9228`

### Step 2: Diagnose Current User
1. Open Supabase Studio: http://127.0.0.1:54323
2. Go to SQL Editor
3. Open `diagnose_user_simple.sql`
4. Replace email with actual user email
5. Run it

### Step 3: Fix User (Choose One)

**Option A: Manual Fix (Keep User)**
Follow the instructions in the SQL output from Step 2.

**Option B: Delete & Retry (Cleanest)**
1. Run `delete_test_user_clean_slate.sql` in main database
2. Run the SSO database delete queries shown in output
3. User signs up again → Will work!

---

## 📁 Files to Use

| File | Purpose | Where to Run |
|------|---------|--------------|
| `diagnose_user_simple.sql` | Check user status | Main database (Studio) |
| `delete_test_user_clean_slate.sql` | Reset for retry | Main database (Studio) |
| `restart-sso-worker.ps1` | Restart SSO worker | PowerShell |
| `manually_accept_invitation.sql` | Manual fix | Main database (Studio) |

---

## 🔍 What to Look For

After restarting SSO worker, watch the terminal for:
```
✅ [createMembership] ✓ Membership created: <id>
✅ [assignMembershipRole] ✓ Role assigned successfully
```

**NOT**:
```
❌ ERROR: column "created_at" does not exist
```

---

## 🧪 Test It Works

1. Restart SSO worker (Step 1)
2. Have user try to signup with invitation
3. Should complete without errors
4. User should be able to login immediately

---

## 💡 Quick Commands

```powershell
# Restart SSO worker
.\restart-sso-worker.ps1

# Check what's running
netstat -ano | findstr "8787"

# Open Supabase Studio
start http://127.0.0.1:54323

# Open SSO Supabase Studio (for SSO database)
start http://127.0.0.1:54333
```

---

## ❓ Still Not Working?

1. **Check SSO worker is actually restarted**
   - Look for "Ready on http://localhost:8787" in terminal
   
2. **Check .dev.vars exists** in sso-worker/
   ```
   SUPABASE_SERVICE_ROLE_KEY=<key>
   SERVICE_AUTH_SECRET=<secret>
   ```

3. **Verify Supabase is running**
   ```bash
   supabase status
   ```

4. **Full restart**
   ```bash
   npm run stop
   npm run dev:fast
   ```

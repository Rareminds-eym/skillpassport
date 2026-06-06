# 🔧 Fix User Login - Step by Step

## Problem
User signed up but can't login: "You do not have access to the Recruiter role"

## Root Cause
Invitation acceptance failed → No membership created in SSO database

---

## ✅ Solution (3 Easy Steps)

### Step 1: Check Main Database
1. Open **Main** Supabase Studio: http://127.0.0.1:54323
2. SQL Editor → Run `1_check_main_database.sql`
3. Replace email with actual user email
4. **Copy these values:**
   - `organization_id`
   - `invitee_role` (recruiter/company_admin/viewer)
   - `status` (should be 'pending' if broken)

---

### Step 2: Check & Fix SSO Database
1. Open **SSO** Supabase Studio: http://127.0.0.1:54333 (different port!)
2. SQL Editor → Run `2_check_sso_database.sql`
3. Replace email in Step 1
4. Run Step 1 → **Copy `user_id`**
5. Replace `PASTE_USER_ID_HERE` in Steps 2-3 with actual user_id
6. Run Steps 2-4

#### What You'll See:
- **If broken**: Step 1 ✅, Step 2 ❌ (empty), Step 3 ❌ (empty)
- **If working**: All steps return data

#### If Broken - Create Membership:
Uncomment and run the fix queries at bottom of `2_check_sso_database.sql`:
- Section A: Create membership (use values from Step 1)
- Section B: Get role_id
- Section C: Assign role
- Section D: Verify

---

### Step 3: Update Main Database
1. Back to **Main** Studio: http://127.0.0.1:54323
2. SQL Editor → Run `3_update_main_database.sql`
3. Replace `PASTE_USER_ID_FROM_SSO_DB` with user_id
4. Replace email
5. Run the UPDATE query
6. Run verification query

---

## 🎯 Done!

User should now be able to login. If not:
1. Clear browser cache/cookies
2. Try incognito/private browsing
3. Check browser console for errors

---

## 📁 Files to Use (In Order)

1. `1_check_main_database.sql` - Run in Main DB (port 54323)
2. `2_check_sso_database.sql` - Run in SSO DB (port 54333)
3. `3_update_main_database.sql` - Run in Main DB (port 54323)

---

## 🔄 Alternative: Delete and Retry

If you want the user to sign up fresh:

1. Run delete queries in `2_check_sso_database.sql` (Option B section)
2. Run reset query in `3_update_main_database.sql` (Option B section)
3. Restart SSO worker: `.\restart-sso-worker.ps1`
4. User signs up again → Will work correctly

---

## 💡 Quick Access

**Main Supabase Studio**: http://127.0.0.1:54323  
**SSO Supabase Studio**: http://127.0.0.1:54333  

**Main DB**: postgresql://postgres:postgres@127.0.0.1:54322/postgres  
**SSO DB**: postgresql://postgres:postgres@127.0.0.1:54332/postgres  

---

## ❓ Stuck?

Run `check_foreign_table_columns.sql` in Main DB to see all available columns.

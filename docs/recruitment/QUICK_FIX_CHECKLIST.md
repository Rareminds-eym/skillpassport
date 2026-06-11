# Invitation Acceptance Fix - Quick Checklist

## Current Status
- ✅ SkillPassport code updated (no further action needed)
- ⏳ SSO-Worker endpoints need to be created

---

## What You Need to Do

### Step 1: Create SSO-Worker Membership Handlers
Create file: `sso-worker/src/handlers/memberships.ts`

Copy this code:

```typescript
import { Env } from '../types';
import { createClient } from '@supabase/supabase-js';

export async function createMembership(request: Request, env: Env): Promise<Response> {
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
  const { user_id, org_id, status } = await request.json();
  
  if (!user_id || !org_id || !status) {
    return Response.json({ error: 'Missing required fields' }, { status: 400 });
  }
  
  const { data, error } = await supabase
    .from('memberships')
    .insert({ user_id, org_id, status })
    .select()
    .single();
  
  if (error) {
    console.error('Failed to create membership:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
  
  return Response.json({ id: data.id, status: data.status });
}

export async function updateMembershipStatus(request: Request, env: Env): Promise<Response> {
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
  const { membership_id, status } = await request.json();
  
  if (!membership_id || !status) {
    return Response.json({ error: 'Missing required fields' }, { status: 400 });
  }
  
  const { error } = await supabase
    .from('memberships')
    .update({ status })
    .eq('id', membership_id);
  
  if (error) {
    console.error('Failed to update membership status:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
  
  return Response.json({ success: true });
}

export async function assignMembershipRole(request: Request, env: Env): Promise<Response> {
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
  const { membership_id, role_id } = await request.json();
  
  if (!membership_id || !role_id) {
    return Response.json({ error: 'Missing required fields' }, { status: 400 });
  }
  
  // Check if already assigned
  const { data: existing } = await supabase
    .from('membership_roles')
    .select('id')
    .eq('membership_id', membership_id)
    .eq('role_id', role_id)
    .single();
  
  if (existing) {
    return Response.json({ success: true });
  }
  
  // Create new assignment
  const { error } = await supabase
    .from('membership_roles')
    .insert({ membership_id, role_id });
  
  if (error) {
    console.error('Failed to assign role:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
  
  return Response.json({ success: true });
}
```

### Step 2: Add Routes to SSO-Worker
Edit: `sso-worker/src/index.ts`

Add these imports at the top:
```typescript
import { createMembership, updateMembershipStatus, assignMembershipRole } from './handlers/memberships';
```

Add these routes to the `routes` object:
```typescript
const routes: Record<string, RouteConfig> = {
  // ... existing routes ...
  
  // Membership management — all require SERVICE_AUTH_SECRET
  "/api/memberships/create":        { handler: createMembership,        serviceAuth: true },
  "/api/memberships/update-status": { handler: updateMembershipStatus, serviceAuth: true },
  "/api/memberships/assign-role":   { handler: assignMembershipRole,   serviceAuth: true },
};
```

### Step 3: Verify Environment Variable
Check that `SERVICE_AUTH_SECRET` is set in both:
- ✅ SkillPassport `.dev.vars`
- ⚠️ SSO-Worker `.dev.vars` (must match!)

Generate if needed:
```bash
openssl rand -base64 32
```

### Step 4: Test Locally
```bash
# Terminal 1: Start SSO-Worker
cd sso-worker
npm run dev

# Terminal 2: Start SkillPassport
cd ..
npm run dev

# Terminal 3: Test invitation signup
# Go to: http://localhost:5173/signup
# Accept an invitation and check console logs
```

### Step 5: Deploy
```bash
# Deploy SSO-Worker
cd sso-worker
wrangler deploy

# Set production secret (if not already set)
wrangler secret put SERVICE_AUTH_SECRET
# Paste the same secret from .dev.vars
```

---

## Verification

### Success Indicators
- ✅ No 500 error in browser console
- ✅ Logs show: `[accept-invitation] ✓ New membership created:`
- ✅ User redirected to dashboard after signup
- ✅ User can access organization features

### If It Still Fails
1. Check browser console for `[accept-invitation]` logs
2. Check SSO-Worker logs: `wrangler tail`
3. Verify `SERVICE_AUTH_SECRET` matches in both workers
4. Check Supabase logs for database errors

---

## Summary
- **What**: Create 3 new API endpoints in SSO-Worker
- **Where**: `sso-worker/src/handlers/memberships.ts` + update `index.ts`
- **Why**: Foreign tables are read-only, need direct DB access
- **Priority**: 🔴 CRITICAL - invitation signup won't work until done
- **Time**: ~15 minutes to implement and test

See `INVITATION_FIX_SUMMARY.md` for detailed explanation.

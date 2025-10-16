# Recent Updates Debugging Guide

## Issue
The "Recent Updates" section in the Student Dashboard (`Dashboard.jsx`) is showing empty even though data exists in the Supabase `recent_updates` table.

## Root Causes

The issue can be caused by one or more of the following:

### 1. **Authentication Mismatch**
- The `user_id` in the `recent_updates` table must match the authenticated user's ID
- Check: `SELECT * FROM recent_updates WHERE user_id = '<your-auth-user-id>'`

### 2. **Row Level Security (RLS) Blocking**
- The RLS policy requires `auth.uid() = user_id`
- If the `user_id` doesn't match the authenticated user, the query returns no results
- This is the most common cause

### 3. **Data Structure Mismatch**
- The `updates` column is JSONB with this structure:
  ```json
  {
    "updates": [
      {"id": "1", "message": "...", "timestamp": "...", "type": "..."}
    ]
  }
  ```
- The hook was correctly checking for `updatesData.updates.updates`, but now has better error handling

## Changes Made

### 1. Enhanced `useRecentUpdates.js` Hook
- Added detailed console logging to track the data flow
- Added checks for both nested and direct array structures
- Removed confusing fallback messages
- Better error handling for PGRST116 (no rows found)

### 2. Added Debug Utility
- Created `src/utils/debugRecentUpdates.js`
- Run `window.debugRecentUpdates()` in browser console to diagnose issues
- Checks:
  - Authentication status
  - User ID
  - Recent updates query with and without RLS
  - Student table linkage

### 3. Updated Dashboard.jsx
- Imported debug utility
- Runs automatic debugging on page load

## How to Diagnose

### Step 1: Open Browser Console
Navigate to the Student Dashboard and check console logs for:
```
📢 Fetching recent updates for authenticated user: <user-id>
📢 Raw query result: {...}
```

### Step 2: Check for Common Errors

**Error: "No recent_updates row found"**
```
⚠️ No recent_updates row found for user_id: <user-id>
```
**Solution**: Insert a row in the `recent_updates` table with matching `user_id`

**Error: "Unexpected updates structure"**
```
⚠️ Unexpected structure. Type: object
```
**Solution**: Verify the JSONB structure in the database

**Error: RLS blocking query**
```
❌ Error fetching recent updates: {...}
```
**Solution**: Check RLS policies or temporarily disable RLS for testing

### Step 3: Run Manual Debug
In browser console:
```javascript
window.debugRecentUpdates()
```

This will show:
- Current authenticated user
- All recent_updates rows (tests RLS)
- Student table linkage
- Specific updates for the user

## Quick Fixes

### Fix 1: Insert Sample Data
```sql
-- Replace with your actual user_id from auth.users
INSERT INTO public.recent_updates (student_id, user_id, updates) 
VALUES (
  (SELECT id FROM students WHERE user_id = '<your-auth-user-id>' LIMIT 1),
  '<your-auth-user-id>',
  '{"updates": [
    {
      "id": "1",
      "message": "Your profile has been viewed 12 times this week",
      "timestamp": "2 hours ago",
      "type": "profile_view"
    },
    {
      "id": "2",
      "message": "New opportunity matches your skills",
      "timestamp": "1 day ago",
      "type": "opportunity_match"
    }
  ]}'::jsonb
) 
ON CONFLICT (user_id) DO UPDATE 
SET updates = EXCLUDED.updates;
```

### Fix 2: Link Existing User
If you have `recent_updates` rows but they're not linked to auth users:
```sql
-- Update recent_updates with correct user_id
UPDATE public.recent_updates ru
SET user_id = s.user_id
FROM public.students s
WHERE ru.student_id = s.id
AND ru.user_id IS NULL;
```

### Fix 3: Temporarily Disable RLS (Testing Only)
```sql
-- ONLY FOR DEBUGGING - DON'T USE IN PRODUCTION
ALTER TABLE public.recent_updates DISABLE ROW LEVEL SECURITY;
```

## Expected Console Output (Success)

```
📢 Fetching recent updates for authenticated user: abc-123-def-456
📢 User email: user@example.com
📢 Raw query result: {
  updatesData: {
    id: "...",
    student_id: "...",
    user_id: "abc-123-def-456",
    updates: {
      updates: [
        { id: "1", message: "...", timestamp: "...", type: "..." },
        { id: "2", message: "...", timestamp: "...", type: "..." }
      ]
    }
  },
  updatesError: null
}
📢 Updates column: {
  "updates": [...]
}
✅ Found nested structure: [...]
```

## Verification Steps

1. ✅ User is authenticated
2. ✅ `user_id` in `recent_updates` matches authenticated user's ID
3. ✅ RLS policies allow the user to read their own data
4. ✅ `updates` column has correct JSONB structure
5. ✅ Hook correctly parses the nested structure
6. ✅ Dashboard displays the updates

## Still Not Working?

Run this comprehensive check:
```sql
-- Check everything
SELECT 
  au.id as auth_user_id,
  au.email,
  s.id as student_id,
  s.email as student_email,
  ru.id as recent_updates_id,
  ru.updates
FROM auth.users au
LEFT JOIN public.students s ON s.user_id = au.id
LEFT JOIN public.recent_updates ru ON ru.user_id = au.id
WHERE au.email = '<your-email>';
```

If any field is NULL (except updates), that's where the problem is.

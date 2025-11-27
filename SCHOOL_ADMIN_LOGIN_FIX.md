# School Admin Login Fix

## Overview
Updated the school admin login at `/login/admin` to authenticate against the actual `schools` table instead of using dummy credentials.

## Changes Made

### 1. Updated `src/pages/auth/LoginAdmin.jsx`

**Key Changes:**
- Removed dummy credential mapping
- Added Supabase client import
- Implemented real database authentication
- Added approval status validation
- Added account status validation
- Improved error messages

### 2. Authentication Flow

```javascript
1. User enters email and password
2. Query schools table by email
3. Check if school exists
4. Validate approval_status === 'approved'
5. Validate account_status (active or pending)
6. Create user session with school data
7. Redirect to school admin dashboard
```

### 3. Validation Rules

**Approval Status:**
- ✅ `approved` - Can login
- ❌ `pending` - Shows: "Your school registration is pending approval. Please contact RareMinds admin."
- ❌ `rejected` - Shows rejection reason and contact message
- ❌ Any other status - Shows generic contact message

**Account Status:**
- ✅ `active` - Can login
- ✅ `pending` - Can login (for initial setup)
- ❌ Any other status - Shows: "Your school account is inactive. Please contact RareMinds admin."

### 4. User Data Stored

After successful login, the following data is stored in localStorage:
```javascript
{
  id: school.id,
  name: school.principal_name || school.name,
  email: school.email,
  role: 'school_admin',
  schoolId: school.id,
  schoolName: school.name,
  schoolCode: school.code
}
```

## Database Schema Reference

```sql
-- Schools table columns used for login
email                VARCHAR(255)  -- Login identifier
approval_status      VARCHAR(20)   -- Must be 'approved'
account_status       VARCHAR(20)   -- Should be 'active' or 'pending'
name                 VARCHAR(255)  -- School name
principal_name       VARCHAR(200)  -- Principal name (used as display name)
code                 VARCHAR(50)   -- School code
```

## Testing

### Test Script
Run the test script to verify the login logic:
```bash
node test-school-admin-login.js
```

This will:
- List all schools in the database
- Show which schools can login (approved status)
- Test the login query with an approved school
- Test error handling with non-existent email

### Manual Testing

1. **Approved School Login:**
   - Go to `http://localhost:3000/login/admin`
   - Enter email from an approved school
   - Enter any password (password validation not yet implemented)
   - Should redirect to `/school-admin/dashboard`

2. **Pending School Login:**
   - Use email from a school with `approval_status = 'pending'`
   - Should show error: "Your school registration is pending approval..."

3. **Rejected School Login:**
   - Use email from a school with `approval_status = 'rejected'`
   - Should show rejection reason

4. **Non-existent Email:**
   - Use any email not in the schools table
   - Should show: "Invalid email or school not found"

## Security Notes

⚠️ **Important:** The current implementation does NOT verify passwords. This is a basic implementation that only checks if the school exists and is approved.

### TODO: Implement Proper Password Authentication

Options for secure password implementation:

1. **Supabase Auth (Recommended):**
   ```javascript
   const { data, error } = await supabase.auth.signInWithPassword({
     email: email,
     password: password,
   });
   ```

2. **Custom Password Hash:**
   - Add `password_hash` column to schools table
   - Use bcrypt to hash passwords
   - Verify hash on login

3. **SSO/OAuth:**
   - Implement Google/Microsoft OAuth
   - Link OAuth accounts to schools table

## UI Updates

- Removed demo credentials display
- Added informational card explaining approval requirement
- Improved error messages with specific guidance
- Maintained existing UI design and styling

## Error Messages

| Scenario | Message |
|----------|---------|
| Empty fields | "Please enter both email and password" |
| Email not found | "Invalid email or school not found" |
| Pending approval | "Your school registration is pending approval. Please contact RareMinds admin." |
| Rejected | "Your school registration was rejected. Reason: [reason]. Please contact RareMinds admin." |
| Inactive account | "Your school account is inactive. Please contact RareMinds admin." |

## Next Steps

1. ✅ Query schools table by email
2. ✅ Validate approval_status
3. ✅ Validate account_status
4. ✅ Store school data in session
5. ⏳ Implement password verification
6. ⏳ Add "Forgot Password" functionality
7. ⏳ Add rate limiting for login attempts
8. ⏳ Add audit logging for login events

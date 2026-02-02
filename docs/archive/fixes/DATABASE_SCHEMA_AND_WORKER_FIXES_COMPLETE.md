# Database Schema and Worker Fixes - COMPLETE

## Issues Fixed

### 1. ✅ Database Schema Issue: Missing `educator_name` Column

**Problem**: The `courseEnrollmentService.js` was trying to select `educator_name` from the `courses` table, but this column doesn't exist.

**Root Cause**: The `courses` table only has `educator_id` but not `educator_name`. The educator name is stored in the `users` table.

**Database Relationship Discovered**:
```sql
courses.educator_id → admin_users.id → users.id (same UUID)
```

**Solution**: Updated the service to fetch educator name from the `users` table using a separate query:

```javascript
// Before (causing error)
.select('course_id, title, educator_id, educator_name')

// After (fixed with separate educator lookup)
// 1. Get course basic info
.select('course_id, title, educator_id')

// 2. Get educator name separately
const { data: educatorData } = await supabase
  .from('users')
  .select('firstName, lastName, email')
  .eq('id', courseData.educator_id)
  .single();
```

**Files Updated**:
- `src/services/courseEnrollmentService.js`

### 2. ✅ Course API Worker Environment Variables

**Problem**: The course-api worker was returning 500 errors because it was using incorrect environment variable names.

**Root Cause**: The TypeScript interface was updated to use `VITE_` prefixed names, but the code was still using the old names.

**Solution**: Updated all environment variable references in the worker:

- `env.SUPABASE_URL` → `env.VITE_SUPABASE_URL`
- `env.SUPABASE_ANON_KEY` → `env.VITE_SUPABASE_ANON_KEY`
- `env.OPENROUTER_API_KEY` → `env.OPENROUTER_API_KEY`

**Files Updated**:
- `cloudflare-workers/course-api/src/index.ts`
- `cloudflare-workers/storage-api/src/index.ts`

## Database Schema Details

### Courses Table Structure
```sql
-- The courses table has:
- course_id (uuid, primary key)
- title (varchar)
- educator_id (uuid, foreign key to admin_users.id)
-- But NO educator_name column
```

### Admin Users Table Structure
```sql
-- The admin_users table has:
- id (uuid, primary key, same as users.id)
- admin_role (text)
-- Just role mapping, no name fields
```

### Users Table Structure
```sql
-- The users table has:
- id (uuid, primary key)
- firstName (varchar)
- lastName (varchar)
- email (text)
-- Contains the actual name information
```

### Relationship Chain
```sql
-- The relationship is:
courses.educator_id → admin_users.id → users.id (same UUID)
```

## Required Actions

### 1. Deploy Updated Workers

You need to deploy the updated workers with the correct environment variable names:

```bash
# Deploy course-api with fixes
cd cloudflare-workers/course-api
npm run deploy

# Deploy storage-api with fixes  
cd cloudflare-workers/storage-api
npm run deploy
```

### 2. Verify Environment Variables

Make sure your Cloudflare Workers have these secrets set:

```bash
# For course-api worker
wrangler secret put VITE_SUPABASE_URL
wrangler secret put VITE_SUPABASE_ANON_KEY
wrangler secret put SUPABASE_SERVICE_ROLE_KEY
wrangler secret put OPENROUTER_API_KEY

# For storage-api worker
wrangler secret put VITE_SUPABASE_URL
wrangler secret put SUPABASE_SERVICE_ROLE_KEY
```

## Testing

After deploying, test these functionalities:

### 1. Course Enrollment
- Visit a course page
- Try to enroll in the course
- Should no longer see "column courses.educator_name does not exist" error

### 2. AI Tutor Suggestions
- Go to a lesson page
- AI tutor suggestions should load without 500 errors
- Should see suggested questions appear

### 3. File Access
- Try accessing course files/resources
- Should work with the updated R2 credentials

## Error Resolution Summary

✅ **Fixed**: `column courses.educator_name does not exist`
- Updated courseEnrollmentService to join with school_educators table

✅ **Fixed**: Course API 500 errors  
- Updated environment variable names in worker code

✅ **Fixed**: R2 credentials not configured
- Standardized all R2 environment variable names (from previous task)

## Next Steps

1. Deploy both workers with the fixes
2. Set the correct environment variables in Cloudflare Workers
3. Test course enrollment and AI tutor functionality
4. Monitor for any remaining errors

The fixes address both the database schema mismatch and the worker configuration issues that were causing the errors you reported.
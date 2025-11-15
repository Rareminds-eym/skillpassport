# Student Authentication - Quick Start

## What Was Built

A complete student authentication system that:
- ✅ Authenticates students using Supabase Auth
- ✅ Links students to schools via `school_id` or universities via `university_college_id`
- ✅ Validates approval status before granting access
- ✅ Provides comprehensive API for student management

## Files Created

1. **`src/services/studentAuthService.js`** - Complete authentication service
2. **`STUDENT_AUTH_GUIDE.md`** - Comprehensive documentation
3. **`test-student-auth.js`** - Testing script
4. **Updated `src/pages/auth/LoginStudent.jsx`** - Login component using new service

## Quick Setup

### 1. Environment Variables

Ensure your `.env` file has:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional: For testing
TEST_STUDENT_EMAIL=student@example.com
TEST_STUDENT_PASSWORD=password123
TEST_SCHOOL_ID=school-uuid
```

### 2. Database Prerequisites

Students must have:
- Valid `user_id` linked to `auth.users`
- Either `school_id` OR `university_college_id` (not both)
- `approval_status` set to 'approved' to login

### 3. Test the Setup

Run the test script:

```bash
node test-student-auth.js
```

### 4. Try Logging In

Navigate to: `http://localhost:5173/login/student`

## Usage Examples

### Basic Login

```javascript
import { loginStudent } from '../services/studentAuthService';

const result = await loginStudent(email, password);

if (result.success) {
  console.log('Student:', result.student);
  console.log('Session:', result.session);
}
```

### Get Students by School

```javascript
import { getStudentsBySchool } from '../services/studentAuthService';

const result = await getStudentsBySchool(schoolId);
console.log(`Found ${result.students.length} students`);
```

### Update Student Profile

```javascript
import { updateStudentProfile } from '../services/studentAuthService';

await updateStudentProfile(studentId, {
  name: 'New Name',
  contact_number: '+1234567890'
});
```

## API Endpoints

### Authentication
- `loginStudent(email, password)` - Login
- `signupStudent(data)` - Create account
- `logoutStudent()` - Sign out
- `getCurrentStudent()` - Get current user

### Student Queries
- `getStudentByEmail(email)` - Find by email
- `getStudentsBySchool(schoolId)` - Get school students
- `getStudentsByUniversityCollege(collegeId)` - Get college students
- `validateStudentCredentials(email, schoolId, collegeId)` - Validate

### Profile Management
- `updateStudentProfile(id, updates)` - Update profile

## Database Schema Reference

### Students Table Key Columns

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | Links to auth.users |
| `email` | TEXT | Unique email |
| `school_id` | UUID | School reference (nullable) |
| `university_college_id` | UUID | College reference (nullable) |
| `approval_status` | VARCHAR | 'pending', 'approved', or 'rejected' |

### Constraints

- Students must have either `school_id` OR `university_college_id` (not both)
- `user_id` must exist in `auth.users`
- `email` must be unique

## Testing Checklist

- [ ] Database tables accessible
- [ ] Test student can login
- [ ] Approval status is validated
- [ ] School association works
- [ ] University association works
- [ ] Profile updates work
- [ ] Logout works

## Troubleshooting

### "No student profile found"
**Fix:** Create student record with valid `user_id`

```sql
INSERT INTO students (user_id, email, school_id, approval_status)
VALUES ('user-uuid', 'email@example.com', 'school-uuid', 'approved');
```

### "Account pending approval"
**Fix:** Update approval status

```sql
UPDATE students 
SET approval_status = 'approved' 
WHERE email = 'student@example.com';
```

### "Invalid credentials"
**Fix:** Check Supabase Auth dashboard for user account status

## Security Features

✅ Row Level Security (RLS) ready
✅ Approval status validation
✅ Secure password handling via Supabase Auth
✅ Session management
✅ User-Student linking for data isolation

## Next Steps

1. **Test the implementation:**
   ```bash
   node test-student-auth.js
   ```

2. **Try logging in:**
   - Go to `/login/student`
   - Enter credentials
   - Check if dashboard loads

3. **Review the documentation:**
   - Read `STUDENT_AUTH_GUIDE.md` for detailed info

4. **Set up RLS policies** (recommended for production)

5. **Configure approval workflow** for new student signups

## Support

For detailed documentation, see: `STUDENT_AUTH_GUIDE.md`

For issues:
- Check Supabase logs
- Review browser console
- Verify database setup

---

**Status:** ✅ Ready to use

**Last Updated:** 2025-11-15

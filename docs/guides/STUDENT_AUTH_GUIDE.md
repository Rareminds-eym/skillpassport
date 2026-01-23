# Student Authentication System Guide

## Overview

This guide explains the student authentication system built for SkillPassport, which authenticates students based on their `school_id` or `university_college_id` and links them to Supabase Auth via `user_id`.

## Architecture

### Database Schema

The `public.students` table has the following key authentication columns:

- `id` (UUID): Primary key for the student record
- `user_id` (UUID): Foreign key to `auth.users` table (Supabase Auth)
- `email` (TEXT): Unique email address
- `school_id` (UUID): Link to schools table (nullable)
- `university_college_id` (UUID): Link to university_colleges table (nullable)
- `approval_status` (VARCHAR): Can be 'pending', 'approved', or 'rejected'

**Important Constraints:**
- A student can be linked to either a school OR a university college, not both
- The `chk_only_one_class` constraint enforces this rule
- `user_id` links the student to Supabase Auth for authentication

## Authentication Flow

### Login Flow

1. **User submits credentials** (email + password)
2. **Supabase Auth validation** - Authenticate using `supabase.auth.signInWithPassword()`
3. **Student profile lookup** - Query students table using `user_id`
4. **Approval status check** - Verify student is approved
5. **Session creation** - Store student data in context/localStorage
6. **Redirect to dashboard**

```javascript
import { loginStudent } from '../services/studentAuthService';

// In your component
const result = await loginStudent(email, password);

if (result.success) {
  // Student authenticated successfully
  const student = result.student;
  const session = result.session;
  
  // Student data includes:
  // - student.id
  // - student.user_id
  // - student.school_id or student.university_college_id
  // - student.schools (if school student)
  // - student.university_colleges (if university student)
}
```

### Signup Flow

1. **User submits registration data**
2. **Validate school/college association**
3. **Create Supabase Auth user**
4. **Create student record** with `user_id` link
5. **Set approval status** to 'pending'
6. **Wait for admin approval**

```javascript
import { signupStudent } from '../services/studentAuthService';

const studentData = {
  email: 'student@example.com',
  password: 'securePassword123',
  name: 'John Doe',
  school_id: 'uuid-of-school',  // OR university_college_id
  // Additional fields...
};

const result = await signupStudent(studentData);

if (result.success) {
  // Account created, awaiting approval
  console.log(result.message);
}
```

## API Reference

### `studentAuthService.js`

#### `loginStudent(email, password)`

Authenticates a student and returns their profile.

**Parameters:**
- `email` (string): Student's email address
- `password` (string): Student's password

**Returns:**
```javascript
{
  success: boolean,
  student: {
    id: string,
    user_id: string,
    email: string,
    name: string,
    school_id: string | null,
    university_college_id: string | null,
    approval_status: string,
    schools: object | null,
    university_colleges: object | null,
    // ... other student fields
  } | null,
  session: object | null,
  error: string | null
}
```

#### `signupStudent(studentData)`

Creates a new student account.

**Parameters:**
- `studentData` (object):
  ```javascript
  {
    email: string,
    password: string,
    name: string,
    school_id?: string,
    university_college_id?: string,
    // Additional optional fields
  }
  ```

**Returns:**
```javascript
{
  success: boolean,
  student: object | null,
  user: object | null,
  error: string | null,
  message?: string
}
```

#### `getCurrentStudent()`

Gets the currently authenticated student's profile.

**Returns:**
```javascript
{
  success: boolean,
  student: object | null,
  error: string | null
}
```

#### `getStudentByEmail(email)`

Fetches student data by email (for validation).

**Parameters:**
- `email` (string): Student's email

**Returns:**
```javascript
{
  success: boolean,
  student: object | null,
  error: string | null
}
```

#### `getStudentsBySchool(schoolId)`

Gets all approved students from a specific school.

**Parameters:**
- `schoolId` (string): School UUID

**Returns:**
```javascript
{
  success: boolean,
  students: array,
  error: string | null
}
```

#### `getStudentsByUniversityCollege(universityCollegeId)`

Gets all approved students from a specific university college.

**Parameters:**
- `universityCollegeId` (string): University College UUID

**Returns:**
```javascript
{
  success: boolean,
  students: array,
  error: string | null
}
```

#### `updateStudentProfile(studentId, updates)`

Updates a student's profile.

**Parameters:**
- `studentId` (string): Student UUID
- `updates` (object): Fields to update

**Returns:**
```javascript
{
  success: boolean,
  student: object | null,
  error: string | null
}
```

#### `logoutStudent()`

Signs out the current student.

**Returns:**
```javascript
{
  success: boolean,
  error: string | null
}
```

#### `validateStudentCredentials(email, schoolId?, universityCollegeId?)`

Validates student credentials with optional school/college filtering.

**Parameters:**
- `email` (string): Student's email
- `schoolId` (string, optional): School UUID to validate against
- `universityCollegeId` (string, optional): University College UUID to validate against

**Returns:**
```javascript
{
  success: boolean,
  valid: boolean,
  student: object | null,
  error: string | null
}
```

## Usage Examples

### School Student Login

```javascript
import { loginStudent } from '../services/studentAuthService';

const handleLogin = async (email, password) => {
  const result = await loginStudent(email, password);
  
  if (result.success) {
    const student = result.student;
    
    if (student.school_id) {
      console.log('School student logged in');
      console.log('School:', student.schools.school_name);
    }
  } else {
    console.error('Login failed:', result.error);
  }
};
```

### University Student Login

```javascript
const result = await loginStudent(email, password);

if (result.success && result.student.university_college_id) {
  console.log('University student logged in');
  console.log('College:', result.student.university_colleges.college_name);
}
```

### Get All Students by School

```javascript
import { getStudentsBySchool } from '../services/studentAuthService';

const fetchSchoolStudents = async (schoolId) => {
  const result = await getStudentsBySchool(schoolId);
  
  if (result.success) {
    console.log(`Found ${result.students.length} students`);
    result.students.forEach(student => {
      console.log(`${student.name} - ${student.email}`);
    });
  }
};
```

### Update Student Profile

```javascript
import { updateStudentProfile } from '../services/studentAuthService';

const updateProfile = async (studentId) => {
  const updates = {
    name: 'Updated Name',
    contact_number: '+1234567890',
    city: 'New York'
  };
  
  const result = await updateStudentProfile(studentId, updates);
  
  if (result.success) {
    console.log('Profile updated successfully');
  }
};
```

## Testing

### Manual Testing Steps

#### 1. Test Student Login

**Prerequisites:**
- Ensure you have a student record in the database with:
  - Valid `user_id` linked to Supabase Auth
  - Either `school_id` or `university_college_id` (not both)
  - `approval_status` set to 'approved'

**Steps:**
1. Navigate to `/login/student`
2. Enter valid credentials
3. Click "Login"
4. Verify redirect to `/student/dashboard`
5. Check browser console for logged user data

**Expected Result:**
- Successful authentication
- Student data stored in localStorage under 'user' key
- Session created in Supabase Auth
- Dashboard loads with student information

#### 2. Test Pending Approval

**Steps:**
1. Change a student's `approval_status` to 'pending' in database
2. Try to login with that student's credentials
3. Verify error message about pending approval

**Expected Result:**
- Login blocked
- Error message: "Your account is pending approval..."

#### 3. Test School Association

**Steps:**
1. Login as a school student
2. Check that `school_id` is populated
3. Verify `schools` object contains school details

**Expected Result:**
- Student has valid `school_id`
- School information available in response

#### 4. Test University Association

**Steps:**
1. Login as a university student
2. Check that `university_college_id` is populated
3. Verify `university_colleges` object contains college details

**Expected Result:**
- Student has valid `university_college_id`
- College information available in response

### Automated Testing

Create test file: `src/services/__tests__/studentAuthService.test.js`

```javascript
import { loginStudent, signupStudent, getStudentByEmail } from '../studentAuthService';

describe('Student Authentication', () => {
  test('should login valid student', async () => {
    const result = await loginStudent('test@example.com', 'password123');
    expect(result.success).toBe(true);
    expect(result.student).toBeDefined();
    expect(result.student.email).toBe('test@example.com');
  });

  test('should reject invalid credentials', async () => {
    const result = await loginStudent('invalid@example.com', 'wrong');
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  test('should validate student email', async () => {
    const result = await getStudentByEmail('test@example.com');
    expect(result.success).toBe(true);
    expect(result.student).toBeDefined();
  });
});
```

## Security Considerations

### 1. Row Level Security (RLS)

Ensure RLS policies are set up in Supabase:

```sql
-- Students can only read their own data
CREATE POLICY "Students can view own profile"
ON public.students
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Students can update their own profile
CREATE POLICY "Students can update own profile"
ON public.students
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
```

### 2. Password Requirements

Implement password validation:
- Minimum 8 characters
- At least one uppercase letter
- At least one number
- At least one special character

### 3. Rate Limiting

Consider implementing rate limiting for login attempts to prevent brute force attacks.

### 4. Email Verification

Enable email verification in Supabase Auth settings for production.

## Troubleshooting

### Issue: "No student profile found"

**Cause:** User exists in `auth.users` but not in `public.students`

**Solution:**
1. Check if `user_id` exists in students table
2. Create student record if missing:
   ```sql
   INSERT INTO students (user_id, email, school_id, approval_status)
   VALUES ('user-uuid', 'email@example.com', 'school-uuid', 'approved');
   ```

### Issue: "Invalid credentials"

**Causes:**
- Wrong email/password
- Account not activated in Supabase Auth
- Account disabled

**Solution:**
1. Verify credentials
2. Check Supabase Auth dashboard
3. Ensure email is confirmed (if required)

### Issue: "Account pending approval"

**Cause:** `approval_status` is 'pending'

**Solution:**
- Administrator must approve the account
- Update status in database:
  ```sql
  UPDATE students 
  SET approval_status = 'approved' 
  WHERE email = 'student@example.com';
  ```

## Environment Setup

### Required Environment Variables

Add to `.env` file:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Supabase Configuration

1. **Auth Settings:**
   - Enable email/password authentication
   - Configure email templates
   - Set JWT expiry times

2. **Database Setup:**
   - Create foreign key relationship between `students.user_id` and `auth.users.id`
   - Set up RLS policies
   - Create indexes on frequently queried columns

## API Endpoint Reference

All authentication happens through the client-side service. No additional backend API endpoints needed as Supabase handles everything.

### Endpoint: `/login/student`

**Method:** Client-side only (React component)

**Location:** `src/pages/auth/LoginStudent.jsx`

**Description:** Login page for students

**Features:**
- Email/password input
- Form validation
- Error handling
- Redirect on success

## Best Practices

1. **Always validate approval status** before granting access
2. **Use transactions** when creating student records to ensure data consistency
3. **Store minimal data** in localStorage/sessionStorage
4. **Implement proper error handling** for all authentication flows
5. **Use TypeScript** for better type safety (future enhancement)
6. **Log authentication events** for security auditing
7. **Implement session timeout** for inactive users

## Future Enhancements

- [ ] Add OAuth providers (Google, Microsoft)
- [ ] Implement 2FA (Two-Factor Authentication)
- [ ] Add password reset functionality
- [ ] Create student signup form
- [ ] Add email verification flow
- [ ] Implement session management
- [ ] Add remember me functionality
- [ ] Create admin approval workflow
- [ ] Add bulk student import feature
- [ ] Implement role-based access control (RBAC)

## Support

For issues or questions:
- Check Supabase logs for authentication errors
- Review browser console for client-side errors
- Contact system administrator for database access issues

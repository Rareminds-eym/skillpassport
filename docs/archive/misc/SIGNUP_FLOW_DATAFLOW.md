# Complete Signup Flow with Dataflow

## Overview

This application supports multiple user types across different entity types (School, College, University, Recruitment). Each signup flow follows a consistent pattern but creates records in different tables based on the user type.

---

## Database Schema Summary

### Core Tables

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `auth.users` | Supabase authentication | id, email, encrypted_password, raw_user_meta_data |
| `public.users` | Application user profiles | id (FK to auth.users), email, firstName, lastName, role, organizationId |
| `public.students` | Student profiles | id, user_id, email, name, school_id, college_id, student_type |
| `public.school_educators` | School educator profiles | id, user_id, school_id, email, first_name, last_name |
| `public.college_lecturers` | College educator profiles | id, user_id, collegeId, metadata (contains email, name) |
| `public.recruiters` | Recruiter profiles | id, user_id, company_id, name, email, is_admin |
| `public.schools` | School entities | id, name, code, email, principal_name |
| `public.colleges` | College entities | id, name, code, email, deanName |
| `public.universities` | University entities | id, name, code, email |
| `public.companies` | Company entities | id, name, code, email, contact_person_name |

### User Role Enum Values (Actual from Database)
```
super_admin,
school_admin, college_admin, university_admin, company_admin,
school_educator, college_educator,
recruiter,
school_student, college_student
```

**Note:** The API handlers use `recruiter_admin` in code, but the database stores it as `recruiter` role. The `is_admin` distinction was planned but the `recruiters` table doesn't have this column - admin status may be tracked differently.

---

## Signup Flow Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    /register/:type                                    │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────────┐ ┌─────────────────┐    │   │
│  │  │  School  │ │ College  │ │  University  │ │   Recruitment   │    │   │
│  │  └────┬─────┘ └────┬─────┘ └──────┬───────┘ └────────┬────────┘    │   │
│  │       │            │              │                   │             │   │
│  │       ▼            ▼              ▼                   ▼             │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │              User Type Selection                             │   │   │
│  │  │  • Admin (creates entity)                                    │   │   │
│  │  │  • Educator (joins existing entity)                          │   │   │
│  │  │  • Student (joins existing entity)                           │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    Subscription Flow                                 │   │
│  │  • "I already have a subscription" → Login Page                     │   │
│  │  • "Purchase subscription" → /subscription/plans/:type/purchase     │   │
│  │  • "View My Plan" → /subscription/plans/:type/view                  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         CLOUDFLARE WORKER API                               │
│                    (cloudflare-workers/user-api)                            │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         API Routes                                   │   │
│  │  POST /signup/school-admin      → handleSchoolAdminSignup           │   │
│  │  POST /signup/educator          → handleEducatorSignup              │   │
│  │  POST /signup/student           → handleStudentSignup               │   │
│  │  POST /signup/college-admin     → handleCollegeAdminSignup          │   │
│  │  POST /signup/college-educator  → handleCollegeEducatorSignup       │   │
│  │  POST /signup/college-student   → handleCollegeStudentSignup        │   │
│  │  POST /signup/university-admin  → handleUniversityAdminSignup       │   │
│  │  POST /signup/university-educator → handleUniversityEducatorSignup  │   │
│  │  POST /signup/university-student → handleUniversityStudentSignup    │   │
│  │  POST /signup/recruiter-admin   → handleRecruiterAdminSignup        │   │
│  │  POST /signup/recruiter         → handleRecruiterSignup             │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            SUPABASE DATABASE                                │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         auth.users                                   │   │
│  │  • id (UUID)                                                        │   │
│  │  • email                                                            │   │
│  │  • encrypted_password                                               │   │
│  │  • raw_user_meta_data (role, name, phone, entity_id)               │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        public.users                                  │   │
│  │  • id (same as auth.users.id)                                       │   │
│  │  • email, firstName, lastName                                       │   │
│  │  • role (enum)                                                      │   │
│  │  • organizationId (FK to entity table)                              │   │
│  │  • metadata (source, entity code)                                   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│                    ┌───────────────┼───────────────┐                       │
│                    ▼               ▼               ▼                       │
│  ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐           │
│  │    students      │ │ school_educators │ │    recruiters    │           │
│  │ college_lecturers│ │                  │ │                  │           │
│  └──────────────────┘ └──────────────────┘ └──────────────────┘           │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Detailed Signup Flows

### 1. School Admin Signup (Creates School + Admin Account)

```
Frontend Form                    API Handler                      Database Operations
─────────────────────────────────────────────────────────────────────────────────────
SchoolAdmin.jsx                  handleSchoolAdminSignup()
     │                                  │
     │ POST /signup/school-admin        │
     │ {                                │
     │   email, password,               │
     │   schoolName, schoolCode,        │
     │   address, city, state,          │
     │   pincode, principalName,        │
     │   phone, website, board          │
     │ }                                │
     │─────────────────────────────────►│
     │                                  │
     │                           1. Validate required fields
     │                           2. Check email uniqueness
     │                           3. Check school code uniqueness
     │                                  │
     │                           4. Create auth.users ─────────────────────►│ auth.users
     │                              {                                       │ INSERT
     │                                email, password,                      │
     │                                email_confirm: true,                  │
     │                                user_metadata: {                      │
     │                                  name, role: 'school_admin',         │
     │                                  phone                               │
     │                                }                                     │
     │                              }                                       │
     │                                  │
     │                           5. Create public.users ───────────────────►│ public.users
     │                              {                                       │ INSERT
     │                                id: authUser.id,                      │
     │                                email, firstName, lastName,           │
     │                                role: 'school_admin',                 │
     │                                organizationId: null,                 │
     │                                isActive: true                        │
     │                              }                                       │
     │                                  │
     │                           6. Create schools ────────────────────────►│ schools
     │                              {                                       │ INSERT
     │                                name, code, email, phone,             │
     │                                address, city, state, pincode,        │
     │                                principal_name, principal_email,      │
     │                                account_status: 'pending',            │
     │                                approval_status: 'pending',           │
     │                                created_by: userId                    │
     │                              }                                       │
     │                                  │
     │                           7. Update users.organizationId ───────────►│ public.users
     │                              SET organizationId = school.id          │ UPDATE
     │                                  │
     │                           8. Send welcome email
     │                                  │
     │◄─────────────────────────────────│
     │ {                                │
     │   success: true,                 │
     │   userId, schoolId,              │
     │   schoolName, schoolCode,        │
     │   role: 'school_admin'           │
     │ }                                │
```

### 2. School Educator Signup (Joins Existing School)

```
Frontend Form                    API Handler                      Database Operations
─────────────────────────────────────────────────────────────────────────────────────
     │                          handleEducatorSignup()
     │                                  │
     │ POST /signup/educator            │
     │ {                                │
     │   email, password,               │
     │   firstName, lastName,           │
     │   schoolId, phone,               │
     │   designation, department,       │
     │   employeeId, qualification      │
     │ }                                │
     │─────────────────────────────────►│
     │                                  │
     │                           1. Validate required fields
     │                           2. Check email uniqueness
     │                           3. Verify school exists ──────────────────►│ schools
     │                           4. Check educator doesn't exist ──────────►│ school_educators
     │                                  │
     │                           5. Create auth.users ─────────────────────►│ auth.users
     │                              {                                       │ INSERT
     │                                email, password,                      │
     │                                user_metadata: {                      │
     │                                  first_name, last_name,              │
     │                                  role: 'school_educator',            │
     │                                  school_id                           │
     │                                }                                     │
     │                              }                                       │
     │                                  │
     │                           6. Create public.users ───────────────────►│ public.users
     │                              {                                       │ INSERT
     │                                id: authUser.id,                      │
     │                                role: 'school_educator',              │
     │                                organizationId: schoolId              │
     │                              }                                       │
     │                                  │
     │                           7. Create school_educators ───────────────►│ school_educators
     │                              {                                       │ INSERT
     │                                user_id: authUser.id,                 │
     │                                school_id: schoolId,                  │
     │                                email, first_name, last_name,         │
     │                                designation, department,              │
     │                                account_status: 'active',             │
     │                                verification_status: 'Pending'        │
     │                              }                                       │
     │                                  │
     │                           8. Send welcome email
     │◄─────────────────────────────────│
```

### 3. School Student Signup (Joins Existing School)

```
Frontend Form                    API Handler                      Database Operations
─────────────────────────────────────────────────────────────────────────────────────
     │                          handleStudentSignup()
     │                                  │
     │ POST /signup/student             │
     │ {                                │
     │   email, password, name,         │
     │   schoolId, phone,               │
     │   dateOfBirth, gender,           │
     │   grade, section, rollNumber,    │
     │   guardianName, guardianPhone,   │
     │   address, city, state, pincode  │
     │ }                                │
     │─────────────────────────────────►│
     │                                  │
     │                           1. Validate required fields
     │                           2. Check email uniqueness
     │                           3. Verify school exists ──────────────────►│ schools
     │                           4. Check student doesn't exist ───────────►│ students
     │                                  │
     │                           5. Create auth.users ─────────────────────►│ auth.users
     │                              {                                       │ INSERT
     │                                email, password,                      │
     │                                user_metadata: {                      │
     │                                  name, role: 'school_student',       │
     │                                  school_id                           │
     │                                }                                     │
     │                              }                                       │
     │                                  │
     │                           6. Create public.users ───────────────────►│ public.users
     │                              {                                       │ INSERT
     │                                id: authUser.id,                      │
     │                                role: 'school_student',               │
     │                                organizationId: schoolId              │
     │                              }                                       │
     │                                  │
     │                           7. Create students ───────────────────────►│ students
     │                              {                                       │ INSERT
     │                                id: authUser.id,                      │
     │                                user_id: authUser.id,                 │
     │                                school_id: schoolId,                  │
     │                                student_type: 'school_student',       │
     │                                approval_status: 'approved',          │
     │                                name, email, grade, section...        │
     │                              }                                       │
     │                                  │
     │                           8. Send welcome email
     │◄─────────────────────────────────│
```

### 4. College Admin Signup (Creates College + Admin Account)

```
Same pattern as School Admin:
1. auth.users INSERT
2. public.users INSERT (role: 'college_admin')
3. colleges INSERT
4. public.users UPDATE (organizationId = college.id)
5. Welcome email
```

### 5. College Educator Signup (Joins Existing College)

```
Same pattern as School Educator:
1. auth.users INSERT
2. public.users INSERT (role: 'college_educator', organizationId: collegeId)
3. college_lecturers INSERT (stores name/email in metadata JSONB)
4. Welcome email
```

### 6. College Student Signup (Joins Existing College)

```
Same pattern as School Student:
1. auth.users INSERT
2. public.users INSERT (role: 'college_student', organizationId: collegeId)
3. students INSERT (college_id, student_type: 'college_student')
4. Welcome email
```

### 7. Recruiter Admin Signup (Creates Company + Admin Account)

```
Frontend Form                    API Handler                      Database Operations
─────────────────────────────────────────────────────────────────────────────────────
RecruiterSignupForm.jsx         handleRecruiterAdminSignup()
     │                                  │
     │ POST /signup/recruiter-admin     │
     │ {                                │
     │   email, password,               │
     │   companyName, companyCode,      │
     │   contactPersonName,             │
     │   industry, companySize,         │
     │   hqAddress, hqCity, hqState     │
     │ }                                │
     │─────────────────────────────────►│
     │                                  │
     │                           1. Validate required fields
     │                           2. Check email uniqueness
     │                           3. Check company code uniqueness
     │                                  │
     │                           4. Create auth.users ─────────────────────►│ auth.users
     │                              role: 'recruiter_admin'                 │ INSERT
     │                                  │
     │                           5. Create public.users ───────────────────►│ public.users
     │                              role: 'recruiter_admin'                 │ INSERT
     │                                  │
     │                           6. Create companies ──────────────────────►│ companies
     │                              account_status: 'pending'               │ INSERT
     │                              approval_status: 'pending'              │
     │                                  │
     │                           7. Update users.organizationId ───────────►│ public.users
     │                                  │                                   │ UPDATE
     │                           8. Create recruiters ─────────────────────►│ recruiters
     │                              is_admin: true                          │ INSERT
     │                                  │
     │                           9. Send welcome email
     │◄─────────────────────────────────│
```

### 8. Recruiter Signup (Joins Existing Company)

```
Same pattern as Educator:
1. auth.users INSERT
2. public.users INSERT (role: 'recruiter', organizationId: companyId)
3. recruiters INSERT (is_admin: false)
4. Welcome email
```

---

## Error Handling & Rollback

All signup handlers implement a rollback mechanism:

```javascript
try {
  // 1. Create auth user
  const { data: authUser } = await supabaseAdmin.auth.admin.createUser({...});
  const userId = authUser.user.id;

  try {
    // 2. Create public.users
    // 3. Create entity (if admin)
    // 4. Create role-specific profile
    // 5. Send welcome email
    
    return jsonResponse({ success: true, ... });
  } catch (error) {
    // ROLLBACK: Delete auth user if subsequent steps fail
    await deleteAuthUser(supabaseAdmin, userId);
    throw error;
  }
} catch (error) {
  return jsonResponse({ error: error.message }, 500);
}
```

---

## Frontend Authentication Context

The `SupabaseAuthContext` provides:

```javascript
const value = {
  user,           // Current auth user from Supabase
  session,        // Current session
  userProfile,    // Student profile (if student user)
  loading,        // Loading state
  signUp,         // Basic signup (creates auth user only)
  signIn,         // Sign in with email/password
  signOut,        // Sign out
  updateUserProfile,  // Update student profile
  resetPassword,      // Send password reset email
  updatePassword,     // Update password
  refreshProfile,     // Reload user profile
};
```

---

## Verified Data Relationships

Based on actual database queries:

### 1. School Admin Flow ✅
```
users.id = schools.created_by
users.organizationId = schools.id
Example: admin@school.com → St. Joseph High School
```

### 2. School Educator Flow ✅
```
users.id = school_educators.user_id
users.organizationId = school_educators.school_id
school_educators.school_id = schools.id
Example: jishnu@rareminds.in → ABC School
```

### 3. Student Flow ✅
```
users.id = students.user_id = students.id
students.school_id OR students.college_id links to entity
students.student_type = 'school_student' | 'college' | 'college_student'
Example: stu512@school.edu → school_id: St. Joseph High School
Example: arjun.desai@aditya.college.edu → college_id: Aditya College
```

### 4. College Admin Flow ✅
```
users.id linked via organizationId to colleges.id
Example: test1@clgadmin.in → Test College
```

### 5. Recruiter Flow ✅
```
users.id = recruiters.user_id
recruiters.company_id = companies.id
users.organizationId may differ from recruiters.company_id (data inconsistency noted)
Example: recruiter1@axninfotech.in → AXN INFOTECH PVT LTD
```

---

## Data Flow Summary

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                           SIGNUP DATA FLOW                                    │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  User Type        │ Tables Created                                           │
│  ─────────────────┼─────────────────────────────────────────────────────────│
│  school_admin     │ auth.users → public.users → schools → UPDATE users      │
│  school_educator  │ auth.users → public.users → school_educators            │
│  school_student   │ auth.users → public.users → students                    │
│  ─────────────────┼─────────────────────────────────────────────────────────│
│  college_admin    │ auth.users → public.users → colleges → UPDATE users     │
│  college_educator │ auth.users → public.users → college_lecturers           │
│  college_student  │ auth.users → public.users → students                    │
│  ─────────────────┼─────────────────────────────────────────────────────────│
│  university_admin │ auth.users → public.users → universities → UPDATE users │
│  university_educator │ auth.users → public.users → (educator table)         │
│  university_student  │ auth.users → public.users → students                 │
│  ─────────────────┼─────────────────────────────────────────────────────────│
│  recruiter_admin  │ auth.users → public.users → companies → recruiters      │
│  recruiter        │ auth.users → public.users → recruiters                  │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## Key Files Reference

| Component | File Path |
|-----------|-----------|
| Registration Page | `src/pages/auth/components/SignIn/Register.jsx` |
| School Admin Form | `src/pages/auth/components/SignIn/schools/SchoolAdmin.jsx` |
| Recruiter Signup Form | `src/pages/auth/components/SignIn/recruitment/RecruiterSignupForm.jsx` |
| Auth Context | `src/context/SupabaseAuthContext.jsx` |
| API Router | `cloudflare-workers/user-api/src/router.ts` |
| School Handlers | `cloudflare-workers/user-api/src/handlers/school.ts` |
| College Handlers | `cloudflare-workers/user-api/src/handlers/college.ts` |
| University Handlers | `cloudflare-workers/user-api/src/handlers/university.ts` |
| Recruiter Handlers | `cloudflare-workers/user-api/src/handlers/recruiter.ts` |

---

## Current Database Statistics

| Table | Row Count |
|-------|-----------|
| auth.users | 156 |
| public.users | 149 |
| students | 85 |
| school_educators | 4 |
| college_lecturers | 11 |
| recruiters | 10 |
| schools | 3 |
| colleges | 4 |
| universities | 1 |
| companies | 157 |

# User API - Migration Status

## Overview
The user-api handles all user signup and management operations across different user types (students, educators, admins, recruiters) and institutions (schools, colleges, universities, companies).

## Status: ⚠️ REQUIRES HANDLER MIGRATION

This API has 20+ endpoints organized into multiple handler files. Full migration requires porting all handlers.

## Endpoints (27 total)

### Unified Signup (1)
1. **POST /signup** - Unified signup endpoint

### School Signup (3)
2. **POST /signup/school-admin** - School admin signup
3. **POST /signup/educator** - Educator signup
4. **POST /signup/student** - Student signup

### College Signup (3)
5. **POST /signup/college-admin** - College admin signup
6. **POST /signup/college-educator** - College educator signup
7. **POST /signup/college-student** - College student signup

### University Signup (3)
8. **POST /signup/university-admin** - University admin signup
9. **POST /signup/university-educator** - University educator signup
10. **POST /signup/university-student** - University student signup

### Recruiter Signup (2)
11. **POST /signup/recruiter-admin** - Recruiter admin signup
12. **POST /signup/recruiter** - Recruiter signup

### Utility Endpoints (9)
13. **GET /schools** - Get schools list
14. **GET /colleges** - Get colleges list
15. **GET /universities** - Get universities list
16. **GET /companies** - Get companies list
17. **POST /check-school-code** - Validate school code
18. **POST /check-college-code** - Validate college code
19. **POST /check-university-code** - Validate university code
20. **POST /check-company-code** - Validate company code
21. **POST /check-email** - Check email availability

### Authenticated Endpoints (7)
22. **POST /create-student** - Create student (requires auth)
23. **POST /create-teacher** - Create teacher (requires auth)
24. **POST /create-college-staff** - Create college staff (requires auth)
25. **POST /update-student-documents** - Update student documents (requires auth)
26. **POST /create-event-user** - Create event user (requires auth)
27. **POST /send-interview-reminder** - Send interview reminder (requires auth)
28. **POST /reset-password** - Reset password

## Handler Files Structure

### Original Structure
```
cloudflare-workers/user-api/src/handlers/
├── authenticated.ts    - Authenticated operations
├── college.ts          - College signup handlers
├── events.ts           - Event user creation
├── password.ts         - Password reset
├── recruiter.ts        - Recruiter signup handlers
├── school.ts           - School signup handlers
├── unified.ts          - Unified signup
├── university.ts       - University signup handlers
└── utility.ts          - Utility endpoints (lists, validation)
```

### Utilities
```
cloudflare-workers/user-api/src/utils/
├── email.ts            - Email sending utilities
├── helpers.ts          - Helper functions
├── supabase.ts         - Supabase client
└── index.ts            - Barrel export
```

## Implementation Notes

### Key Features
- Multiple user types (student, educator, admin, recruiter)
- Multiple institution types (school, college, university, company)
- Email validation and uniqueness checks
- Code validation for institutions
- Password reset functionality
- Event user creation
- Document management for students

### Dependencies
- @supabase/supabase-js
- Email sending service (Resend or similar)

### Migration Complexity
- **Handler Files**: 10 files
- **Utility Files**: 4 files
- **Total Endpoints**: 27+
- **Complexity**: High (multiple user types, institution validation, email sending)

## Next Steps

1. Migrate utility functions to `functions/api/user/utils/`
2. Migrate handler files to `functions/api/user/handlers/`
3. Update router to use migrated handlers
4. Test all signup flows
5. Verify email sending
6. Test validation endpoints

## Original Location
`cloudflare-workers/user-api/src/`

# Phase 2 Checkpoint - User API Testing Plan

## Overview
This document provides a comprehensive testing plan for all 27 User API endpoints implemented in Phase 2.

## Testing Approach

### Local Testing Setup
```bash
# Start local development server
npm run pages:dev

# Server will be available at:
# http://localhost:8788
```

### Test Categories
1. **Utility Endpoints** (9 endpoints) - No authentication required
2. **Signup Endpoints** (12 endpoints) - No authentication required
3. **Authenticated Endpoints** (6 endpoints) - JWT token required

---

## 1. Utility Endpoints Testing (9 endpoints)

### 1.1 Institution List Endpoints (4 GET endpoints)

#### Test: GET /api/user/schools
```bash
curl http://localhost:8788/api/user/schools
```
**Expected:** List of schools from organizations table
**Validates:** Requirements 2.1

#### Test: GET /api/user/colleges
```bash
curl http://localhost:8788/api/user/colleges
```
**Expected:** List of colleges from organizations table
**Validates:** Requirements 2.2

#### Test: GET /api/user/universities
```bash
curl http://localhost:8788/api/user/universities
```
**Expected:** List of universities from organizations table
**Validates:** Requirements 2.3

#### Test: GET /api/user/companies
```bash
curl http://localhost:8788/api/user/companies
```
**Expected:** List of companies from companies table
**Validates:** Requirements 2.4

### 1.2 Validation Endpoints (5 POST endpoints)

#### Test: POST /api/user/check-school-code
```bash
curl -X POST http://localhost:8788/api/user/check-school-code \
  -H "Content-Type: application/json" \
  -d '{"code": "SCH001"}'
```
**Expected:** `{ "available": true/false }`
**Validates:** Requirements 1.3

#### Test: POST /api/user/check-college-code
```bash
curl -X POST http://localhost:8788/api/user/check-college-code \
  -H "Content-Type: application/json" \
  -d '{"code": "COL001"}'
```
**Expected:** `{ "available": true/false }`
**Validates:** Requirements 1.4

#### Test: POST /api/user/check-university-code
```bash
curl -X POST http://localhost:8788/api/user/check-university-code \
  -H "Content-Type: application/json" \
  -d '{"code": "UNI001"}'
```
**Expected:** `{ "available": true/false }`
**Validates:** Requirements 1.5

#### Test: POST /api/user/check-company-code
```bash
curl -X POST http://localhost:8788/api/user/check-company-code \
  -H "Content-Type: application/json" \
  -d '{"code": "COM001"}'
```
**Expected:** `{ "available": true/false }`
**Validates:** Requirements 1.6

#### Test: POST /api/user/check-email
```bash
curl -X POST http://localhost:8788/api/user/check-email \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
```
**Expected:** `{ "available": true/false }`
**Validates:** Requirements 1.7

---

## 2. Signup Endpoints Testing (12 endpoints)

### 2.1 Unified Signup (1 endpoint)

#### Test: POST /api/user/signup
```bash
curl -X POST http://localhost:8788/api/user/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "unified@test.com",
    "password": "Test123!",
    "firstName": "Test",
    "lastName": "User",
    "role": "school_student"
  }'
```
**Expected:** User created with temporary password
**Validates:** Requirements 1.1, 1.2, 1.7, 1.8

### 2.2 School Signup (3 endpoints)

#### Test: POST /api/user/signup/school-admin
```bash
curl -X POST http://localhost:8788/api/user/signup/school-admin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "schooladmin@test.com",
    "password": "Test123!",
    "schoolName": "Test School",
    "schoolCode": "SCH999",
    "address": "123 Test St",
    "city": "Test City",
    "state": "Test State",
    "pincode": "12345",
    "principalName": "Principal Test"
  }'
```
**Expected:** School organization and admin user created
**Validates:** Requirements 1.1, 1.2, 1.3, 1.7, 1.8

#### Test: POST /api/user/signup/educator
```bash
curl -X POST http://localhost:8788/api/user/signup/educator \
  -H "Content-Type: application/json" \
  -d '{
    "email": "educator@test.com",
    "password": "Test123!",
    "firstName": "Teacher",
    "lastName": "Test",
    "schoolId": "<school-id-from-previous-test>"
  }'
```
**Expected:** Educator user created
**Validates:** Requirements 1.1, 1.2, 1.3, 1.7, 1.8

#### Test: POST /api/user/signup/student
```bash
curl -X POST http://localhost:8788/api/user/signup/student \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@test.com",
    "password": "Test123!",
    "name": "Student Test",
    "schoolId": "<school-id-from-previous-test>"
  }'
```
**Expected:** Student user created
**Validates:** Requirements 1.1, 1.2, 1.3, 1.7, 1.8

### 2.3 College Signup (3 endpoints)

#### Test: POST /api/user/signup/college-admin
```bash
curl -X POST http://localhost:8788/api/user/signup/college-admin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "collegeadmin@test.com",
    "password": "Test123!",
    "collegeName": "Test College",
    "collegeCode": "COL999",
    "address": "456 College Ave",
    "city": "College City",
    "state": "College State",
    "pincode": "54321",
    "deanName": "Dean Test"
  }'
```
**Expected:** College organization and admin user created
**Validates:** Requirements 1.1, 1.2, 1.4, 1.7, 1.8

#### Test: POST /api/user/signup/college-educator
```bash
curl -X POST http://localhost:8788/api/user/signup/college-educator \
  -H "Content-Type: application/json" \
  -d '{
    "email": "collegeeducator@test.com",
    "password": "Test123!",
    "firstName": "Professor",
    "lastName": "Test",
    "collegeId": "<college-id-from-previous-test>"
  }'
```
**Expected:** College educator user created
**Validates:** Requirements 1.1, 1.2, 1.4, 1.7, 1.8

#### Test: POST /api/user/signup/college-student
```bash
curl -X POST http://localhost:8788/api/user/signup/college-student \
  -H "Content-Type: application/json" \
  -d '{
    "email": "collegestudent@test.com",
    "password": "Test123!",
    "name": "College Student",
    "collegeId": "<college-id-from-previous-test>"
  }'
```
**Expected:** College student user created
**Validates:** Requirements 1.1, 1.2, 1.4, 1.7, 1.8

### 2.4 University Signup (3 endpoints)

#### Test: POST /api/user/signup/university-admin
```bash
curl -X POST http://localhost:8788/api/user/signup/university-admin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "universityadmin@test.com",
    "password": "Test123!",
    "universityName": "Test University",
    "universityCode": "UNI999",
    "address": "789 University Blvd",
    "city": "University City",
    "state": "University State",
    "pincode": "67890",
    "chancellorName": "Chancellor Test"
  }'
```
**Expected:** University organization and admin user created
**Validates:** Requirements 1.1, 1.2, 1.5, 1.7, 1.8

#### Test: POST /api/user/signup/university-educator
```bash
curl -X POST http://localhost:8788/api/user/signup/university-educator \
  -H "Content-Type: application/json" \
  -d '{
    "email": "universityeducator@test.com",
    "password": "Test123!",
    "firstName": "Professor",
    "lastName": "University",
    "universityId": "<university-id-from-previous-test>"
  }'
```
**Expected:** University educator user created
**Validates:** Requirements 1.1, 1.2, 1.5, 1.7, 1.8

#### Test: POST /api/user/signup/university-student
```bash
curl -X POST http://localhost:8788/api/user/signup/university-student \
  -H "Content-Type: application/json" \
  -d '{
    "email": "universitystudent@test.com",
    "password": "Test123!",
    "name": "University Student",
    "universityId": "<university-id-from-previous-test>"
  }'
```
**Expected:** University student user created
**Validates:** Requirements 1.1, 1.2, 1.5, 1.7, 1.8

### 2.5 Recruiter Signup (2 endpoints)

#### Test: POST /api/user/signup/recruiter-admin
```bash
curl -X POST http://localhost:8788/api/user/signup/recruiter-admin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "recruiteradmin@test.com",
    "password": "Test123!",
    "companyName": "Test Company",
    "companyCode": "COM999",
    "address": "321 Business St",
    "city": "Business City",
    "state": "Business State",
    "pincode": "98765",
    "hrName": "HR Test"
  }'
```
**Expected:** Company and recruiter admin user created
**Validates:** Requirements 1.1, 1.2, 1.6, 1.7, 1.8

#### Test: POST /api/user/signup/recruiter
```bash
curl -X POST http://localhost:8788/api/user/signup/recruiter \
  -H "Content-Type: application/json" \
  -d '{
    "email": "recruiter@test.com",
    "password": "Test123!",
    "firstName": "Recruiter",
    "lastName": "Test",
    "companyId": "<company-id-from-previous-test>"
  }'
```
**Expected:** Recruiter user created
**Validates:** Requirements 1.1, 1.2, 1.6, 1.7, 1.8

---

## 3. Authenticated Endpoints Testing (6 endpoints)

### Prerequisites
First, get a JWT token by logging in:
```bash
# Login to get JWT token
curl -X POST http://localhost:8788/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "schooladmin@test.com",
    "password": "Test123!"
  }'

# Extract the access_token from response
export JWT_TOKEN="<access_token>"
```

### 3.1 Admin User Creation (4 endpoints)

#### Test: POST /api/user/create-student
```bash
curl -X POST http://localhost:8788/api/user/create-student \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "student": {
      "name": "Admin Created Student",
      "email": "adminstudent@test.com",
      "contactNumber": "+1234567890",
      "grade": "10",
      "section": "A"
    },
    "userEmail": "schooladmin@test.com"
  }'
```
**Expected:** Student created with temporary password
**Validates:** Requirements 11.1, 11.2

#### Test: POST /api/user/create-teacher
```bash
curl -X POST http://localhost:8788/api/user/create-teacher \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "teacher": {
      "first_name": "Admin",
      "last_name": "Teacher",
      "email": "adminteacher@test.com",
      "role": "subject_teacher",
      "subject_expertise": ["Mathematics"]
    }
  }'
```
**Expected:** Teacher created with temporary password
**Validates:** Requirements 11.3

#### Test: POST /api/user/create-college-staff
```bash
curl -X POST http://localhost:8788/api/user/create-college-staff \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "staff": {
      "name": "College Staff",
      "email": "collegestaff@test.com",
      "roles": ["Faculty", "HoD"],
      "department_id": "CS"
    }
  }'
```
**Expected:** College staff created with temporary password
**Validates:** Requirements 11.4

#### Test: POST /api/user/update-student-documents
```bash
curl -X POST http://localhost:8788/api/user/update-student-documents \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "studentId": "<student-id>",
    "documents": [
      {
        "name": "ID Card",
        "url": "https://example.com/id.pdf",
        "size": 12345,
        "type": "identification"
      }
    ]
  }'
```
**Expected:** Student documents updated
**Validates:** Requirements 11.5

### 3.2 Event and Password Endpoints (2 endpoints)

#### Test: POST /api/user/create-event-user
```bash
curl -X POST http://localhost:8788/api/user/create-event-user \
  -H "Content-Type: application/json" \
  -d '{
    "email": "eventuser@test.com",
    "firstName": "Event",
    "lastName": "User",
    "role": "school-student",
    "registrationId": "evt_123",
    "metadata": {
      "plan": "Premium",
      "event": "Coding Competition"
    }
  }'
```
**Expected:** User created from event registration
**Validates:** Requirements 12.1, 12.2

#### Test: POST /api/user/send-interview-reminder
```bash
curl -X POST http://localhost:8788/api/user/send-interview-reminder \
  -H "Content-Type: application/json" \
  -d '{
    "interviewId": "int_123",
    "recipientEmail": "candidate@test.com",
    "recipientName": "John Doe",
    "interviewDetails": {
      "date": "2024-02-15",
      "time": "10:00 AM",
      "location": "Virtual - Zoom"
    }
  }'
```
**Expected:** Interview reminder email sent
**Validates:** Requirements 13.1, 13.2

### 3.3 Password Reset (1 endpoint)

#### Test: POST /api/user/reset-password (Send OTP)
```bash
curl -X POST http://localhost:8788/api/user/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "action": "send",
    "email": "test@example.com"
  }'
```
**Expected:** OTP sent to email
**Validates:** Requirements 15.1, 15.2

#### Test: POST /api/user/reset-password (Verify OTP)
```bash
curl -X POST http://localhost:8788/api/user/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "action": "verify",
    "email": "test@example.com",
    "otp": "123456",
    "newPassword": "NewPassword123!"
  }'
```
**Expected:** Password updated successfully
**Validates:** Requirements 15.3, 15.4

---

## 4. Error Handling Tests

### 4.1 Validation Errors

#### Test: Missing Required Fields
```bash
curl -X POST http://localhost:8788/api/user/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com"
  }'
```
**Expected:** 400 error with message about missing fields

#### Test: Invalid Email Format
```bash
curl -X POST http://localhost:8788/api/user/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "invalid-email",
    "password": "Test123!",
    "firstName": "Test",
    "lastName": "User",
    "role": "school_student"
  }'
```
**Expected:** 400 error with "Invalid email format"

#### Test: Duplicate Email
```bash
# Create user first, then try again with same email
curl -X POST http://localhost:8788/api/user/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "duplicate@test.com",
    "password": "Test123!",
    "firstName": "Test",
    "lastName": "User",
    "role": "school_student"
  }'
```
**Expected:** 400 error with "Email already exists"

### 4.2 Authentication Errors

#### Test: Missing JWT Token
```bash
curl -X POST http://localhost:8788/api/user/create-student \
  -H "Content-Type: application/json" \
  -d '{
    "student": {
      "name": "Test",
      "email": "test@test.com",
      "contactNumber": "+1234567890"
    },
    "userEmail": "admin@test.com"
  }'
```
**Expected:** 401 error with "Unauthorized"

#### Test: Invalid JWT Token
```bash
curl -X POST http://localhost:8788/api/user/create-student \
  -H "Authorization: Bearer invalid-token" \
  -H "Content-Type: application/json" \
  -d '{
    "student": {
      "name": "Test",
      "email": "test@test.com",
      "contactNumber": "+1234567890"
    },
    "userEmail": "admin@test.com"
  }'
```
**Expected:** 401 error with "Unauthorized"

### 4.3 Not Found Errors

#### Test: Invalid Endpoint
```bash
curl http://localhost:8788/api/user/invalid-endpoint
```
**Expected:** 404 error with "Not found"

---

## 5. Automated Test Scripts

### Run All Tests
```bash
# Use the comprehensive test script
node test-all-signup-endpoints.cjs
```

### Individual Test Scripts
```bash
# Test specific user types
node test-user-api-school.cjs
node test-user-api-college.cjs
node test-user-api-university.cjs
node test-user-api-recruiter.cjs
node test-user-api-unified.cjs
```

---

## 6. Verification Checklist

### Functionality
- [ ] All 9 utility endpoints return correct data
- [ ] All 12 signup endpoints create users successfully
- [ ] All 6 authenticated endpoints work with JWT
- [ ] Email integration works (emails sent via email-api)
- [ ] Temporary passwords generated correctly
- [ ] Welcome emails sent for all signups

### Error Handling
- [ ] Missing required fields return 400 errors
- [ ] Invalid email format returns 400 error
- [ ] Duplicate emails return 400 error
- [ ] Missing JWT returns 401 error
- [ ] Invalid JWT returns 401 error
- [ ] Invalid endpoints return 404 error

### Data Integrity
- [ ] Users created in auth and users table
- [ ] Role-specific records created (students, recruiters, etc.)
- [ ] Organizations created for admin signups
- [ ] Metadata stored correctly
- [ ] Rollback works on failure

### Security
- [ ] Passwords validated (min 6 characters)
- [ ] Emails validated
- [ ] Email uniqueness enforced
- [ ] Phone uniqueness enforced
- [ ] JWT authentication required for admin operations

---

## 7. Success Criteria

✅ **All 27 endpoints respond correctly**
✅ **All validation works as expected**
✅ **All error handling works correctly**
✅ **Email integration functional**
✅ **Data integrity maintained**
✅ **Security measures enforced**
✅ **0 TypeScript errors**
✅ **Consistent response formats**

---

## 8. Known Limitations

### Email Delivery
- Emails are sent via email-api worker
- Requires email-api worker to be running
- Check email-api logs for delivery status

### Database Dependencies
- Requires Supabase connection
- Requires proper database schema
- Requires environment variables configured

### Local Testing
- All tests run against local development server
- No production data affected
- Use test data only

---

## Conclusion

This comprehensive test plan covers all 27 User API endpoints implemented in Phase 2. Follow the test procedures to verify functionality, error handling, and data integrity before moving to Phase 3.


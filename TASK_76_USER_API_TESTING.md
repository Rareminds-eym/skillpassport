# Task 76: User API Integration Tests

**Date**: February 2, 2026
**Duration**: 4-6 hours (Day 1 of Sequential Execution)
**Status**: ⏳ Ready to start
**Endpoints**: 27

---

## Pre-Flight Checklist

### Environment Setup
- [ ] Node.js installed and working
- [ ] npm installed and working
- [ ] Dependencies installed (`node_modules` exists)
- [ ] Environment variables configured (`.env.development`)
- [ ] Supabase connection configured
- [ ] Local server can start

### Test Resources
- [x] Test script created: `test-user-api-complete.cjs`
- [x] Test script is executable
- [ ] Server running on `http://localhost:8788`
- [ ] Health endpoint responding

---

## Test Categories

### Category 1: Institution Lists (4 endpoints)
- [ ] GET `/api/user/schools`
- [ ] GET `/api/user/colleges`
- [ ] GET `/api/user/universities`
- [ ] GET `/api/user/companies`

**Expected**: 200 status, array response

---

### Category 2: Code Validation (5 endpoints)
- [ ] POST `/api/user/check-school-code`
- [ ] POST `/api/user/check-college-code`
- [ ] POST `/api/user/check-university-code`
- [ ] POST `/api/user/check-company-code`
- [ ] POST `/api/user/check-email`

**Expected**: 200 status, `{ exists: boolean }` response

---

### Category 3: School Signup (3 endpoints)
- [ ] POST `/api/user/signup/school-admin`
- [ ] POST `/api/user/signup/educator`
- [ ] POST `/api/user/signup/student`

**Expected**: 200/201 status, user object response

---

### Category 4: College Signup (3 endpoints)
- [ ] POST `/api/user/signup/college-admin`
- [ ] POST `/api/user/signup/college-educator`
- [ ] POST `/api/user/signup/college-student`

**Expected**: 200/201 status, user object response

---

### Category 5: University Signup (3 endpoints)
- [ ] POST `/api/user/signup/university-admin`
- [ ] POST `/api/user/signup/university-educator`
- [ ] POST `/api/user/signup/university-student`

**Expected**: 200/201 status, user object response

---

### Category 6: Recruiter Signup (2 endpoints)
- [ ] POST `/api/user/signup/recruiter-admin`
- [ ] POST `/api/user/signup/recruiter`

**Expected**: 200/201 status, user object response

---

### Category 7: Unified Signup (1 endpoint)
- [ ] POST `/api/user/signup`

**Expected**: 200/201 status, user object response

---

### Category 8: Authenticated Operations (6 endpoints)
- [ ] POST `/api/user/create-student` (requires auth)
- [ ] POST `/api/user/create-teacher` (requires auth)
- [ ] POST `/api/user/create-college-staff` (requires auth)
- [ ] POST `/api/user/update-student-documents` (requires auth)
- [ ] POST `/api/user/create-event-user` (requires auth)
- [ ] POST `/api/user/send-interview-reminder` (requires auth)

**Note**: These will be skipped in automated test due to auth requirement

---

## Execution Steps

### Step 1: Start Local Server
```bash
npm run pages:dev
```

**Expected output**:
```
⛅️ wrangler 3.x.x
-------------------
Starting local server...
[wrangler:inf] Ready on http://localhost:8788
```

**Verification**:
```bash
curl http://localhost:8788/api/health
```

**Expected**: `{"status":"ok"}`

---

### Step 2: Run Automated Tests
```bash
node test-user-api-complete.cjs
```

**Expected output**:
```
================================================================================
USER API INTEGRATION TEST SUITE
================================================================================
Base URL: http://localhost:8788/api/user
Started: 2026-02-02T...
================================================================================

📋 CATEGORY 1: Institution Lists (4 endpoints)

🧪 Testing: GET /schools
✅ PASSED: GET /schools

🧪 Testing: GET /colleges
✅ PASSED: GET /colleges

...

================================================================================
TEST SUMMARY
================================================================================
✅ Passed: X
❌ Failed: X
⚠️  Skipped: 6
📊 Total: 27
📈 Success Rate: XX.X%
================================================================================
```

---

### Step 3: Review Results

**If all tests pass**:
- Document success
- Move to manual verification of authenticated endpoints
- Proceed to Task 77

**If tests fail**:
- Document each failure
- Categorize by severity (P0, P1, P2, P3)
- Fix P0 issues immediately
- Re-test after fixes

---

## Issue Tracking

### Issue Template
```markdown
## Issue #[number]

**Severity**: P0 (Critical) / P1 (High) / P2 (Medium) / P3 (Low)
**Category**: Institution Lists / Code Validation / Signup / etc.
**Endpoint**: [METHOD] /api/user/[path]
**Description**: [Brief description]

**Steps to Reproduce**:
1. [Step 1]
2. [Step 2]
3. [Step 3]

**Expected**: [What should happen]
**Actual**: [What actually happens]

**Request**:
```json
{
  "field": "value"
}
```

**Response**:
```json
{
  "error": "message"
}
```

**Fix**: [How it was fixed]
**Status**: Open / Fixed / Deferred
```

---

## Manual Testing (Authenticated Endpoints)

Since automated tests skip authenticated endpoints, manual testing is required:

### Prerequisites
1. Get a valid JWT token from Supabase
2. Use token in Authorization header

### Test Commands

**Create Student**:
```bash
curl -X POST http://localhost:8788/api/user/create-student \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "email": "test-student@example.com",
    "fullName": "Test Student",
    "schoolId": "school-uuid",
    "gradeLevel": "10"
  }'
```

**Create Teacher**:
```bash
curl -X POST http://localhost:8788/api/user/create-teacher \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "email": "test-teacher@example.com",
    "fullName": "Test Teacher",
    "schoolId": "school-uuid"
  }'
```

**Create College Staff**:
```bash
curl -X POST http://localhost:8788/api/user/create-college-staff \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "email": "test-staff@example.com",
    "fullName": "Test Staff",
    "collegeId": "college-uuid",
    "role": "faculty"
  }'
```

---

## Success Criteria

### Automated Tests
- [ ] Test script runs without errors
- [ ] At least 80% of tests pass (17/21 non-auth endpoints)
- [ ] All P0 issues fixed
- [ ] Results documented

### Manual Tests (Optional)
- [ ] At least 1 authenticated endpoint tested
- [ ] Authentication works correctly
- [ ] Authorization works correctly

### Documentation
- [ ] Test results documented
- [ ] Issues list created
- [ ] Fixes documented
- [ ] Task 76 marked complete

---

## Expected Results

### Best Case
- ✅ All 21 non-auth endpoints pass
- ✅ 0 critical issues
- ✅ 0-2 minor issues
- ✅ Ready for Task 77

### Realistic Case
- ✅ 18-21 non-auth endpoints pass
- ⚠️ 0-1 critical issues (fixed)
- ⚠️ 2-5 minor issues (documented)
- ✅ Ready for Task 77

### Worst Case
- ❌ <15 non-auth endpoints pass
- ❌ Multiple critical issues
- ❌ Need additional debugging
- ⏳ Delay to Task 77

---

## Time Allocation

### Morning Session (2-3 hours)
- 30 min: Environment setup and verification
- 30 min: Run automated tests
- 60-90 min: Review results and initial debugging

### Afternoon Session (2-3 hours)
- 60-90 min: Fix critical issues
- 30-60 min: Re-test fixed endpoints
- 30 min: Document results and create report

---

## Deliverables

1. **Test Results Document**
   - Test execution log
   - Pass/fail summary
   - Performance notes

2. **Issues List**
   - All issues found
   - Categorized by severity
   - Status of each issue

3. **Fixes Applied**
   - List of fixes
   - Code changes made
   - Re-test results

4. **Task 76 Completion Report**
   - Summary of testing
   - Overall assessment
   - Readiness for Task 77

---

## Next Steps

After Task 76 completion:
1. Review and approve completion
2. Update spec file (mark Task 76 complete)
3. Prepare for Task 77 (Storage API)
4. Start Day 2

---

## Notes

- Keep server running throughout testing
- Document everything immediately
- Don't skip failures - investigate each one
- Take breaks to avoid fatigue
- Ask for help if blocked

---

**Ready to start Task 76!** 🚀

**First command**: `npm run pages:dev`

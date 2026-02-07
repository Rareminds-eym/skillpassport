# Adaptive Session API Testing Guide

**Phase 5 Tasks 68-70**: Complete Testing & Validation
**Status**: Ready for testing
**Date**: Context Transfer Session

---

## Overview

This guide covers testing for the Adaptive Aptitude Session API migration from direct Supabase calls to Cloudflare Pages Functions.

**What's Being Tested**:
- ✅ 9 API endpoints (backend)
- ✅ Frontend integration (service + hooks)
- ✅ Performance and error handling
- ✅ Authentication and authorization
- ✅ End-to-end user flows

---

## Prerequisites 

### 1. Environment Setup

**Required**:
- Local development server running: `npm run pages:dev`
- Valid Supabase connection
- Test student account with valid JWT token
- Question generation API working (dependency)

**Check Server Status**:
```bash
# Start server
npm run pages:dev

# Verify server is running
curl http://localhost:8788/api/adaptive-session
```

### 2. Test Data

**You'll Need**:
- Valid student ID (UUID format)
- Valid JWT authentication token
- Grade level (e.g., 'grade_9', 'grade_10', etc.)

**Get Test Data**:
```sql
-- Get a test student ID
SELECT id, email FROM students LIMIT 1;

-- Or create a test student
INSERT INTO students (email, first_name, last_name, grade_level)
VALUES ('test@example.com', 'Test', 'Student', 'grade_9')
RETURNING id;
```

**Get Auth Token**:
```javascript
// In browser console after logging in
const { data: { session } } = await supabase.auth.getSession();
console.log(session.access_token);
```

---

## Task 68: Test All API Endpoints

### Automated Testing

**Run Test Suite**:
```bash
# 1. Update test configuration
# Edit test-adaptive-session-api.cjs:
#   - Set TEST_CONFIG.studentId to real student ID
#   - Set TEST_CONFIG.authToken to real JWT token

# 2. Run tests
node test-adaptive-session-api.cjs
```

**Expected Output**:
```
==========================================================
ADAPTIVE SESSION API TEST SUITE
==========================================================
Base URL: http://localhost:8788/api/adaptive-session
Student ID: <your-student-id>
Grade Level: grade_9

==========================================================
TEST: 1. Initialize Test
==========================================================
ℹ️  POST http://localhost:8788/api/adaptive-session/initialize
✅ Session initialized successfully
ℹ️  Session ID: <session-id>
ℹ️  First Question ID: <question-id>
ℹ️  Phase: diagnostic_screener

... (more tests)

==========================================================
TEST SUMMARY
==========================================================
Total Tests: 9
Passed: 9
Failed: 0
Success Rate: 100.0%

✅ All tests passed! 🎉
```

### Manual Testing

If automated tests fail or you want to test manually:

#### 1. Initialize Test

**Request**:
```bash
curl -X POST http://localhost:8788/api/adaptive-session/initialize \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "studentId": "YOUR_STUDENT_ID",
    "gradeLevel": "grade_9"
  }'
```

**Expected Response** (200 OK):
```json
{
  "session": {
    "id": "uuid",
    "student_id": "uuid",
    "grade_level": "grade_9",
    "current_phase": "diagnostic_screener",
    "status": "in_progress",
    "started_at": "2026-01-31T...",
    "diagnostic_questions": [...],
    "adaptive_core_questions": [],
    "stability_questions": []
  },
  "firstQuestion": {
    "id": "uuid",
    "question_text": "...",
    "options": {...},
    "difficulty": 5,
    "subtag": "..."
  }
}
```

**Verify**:
- ✅ Session created with correct student_id
- ✅ Phase is 'diagnostic_screener'
- ✅ First question returned
- ✅ Diagnostic questions array populated

#### 2. Get Next Question

**Request**:
```bash
curl http://localhost:8788/api/adaptive-session/next-question/SESSION_ID
```

**Expected Response** (200 OK):
```json
{
  "question": {
    "id": "uuid",
    "question_text": "...",
    "options": {...},
    "difficulty": 5
  },
  "isTestComplete": false,
  "currentPhase": "diagnostic_screener",
  "progress": {
    "totalQuestions": 1,
    "currentQuestionIndex": 1,
    "phase": "diagnostic_screener"
  }
}
```

**Verify**:
- ✅ Question returned
- ✅ Progress tracking correct
- ✅ Phase matches session state

#### 3. Submit Answer

**Request**:
```bash
curl -X POST http://localhost:8788/api/adaptive-session/submit-answer \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "sessionId": "SESSION_ID",
    "questionId": "QUESTION_ID",
    "selectedAnswer": "A",
    "responseTimeMs": 5000
  }'
```

**Expected Response** (200 OK):
```json
{
  "isCorrect": true,
  "previousDifficulty": 5,
  "newDifficulty": 6,
  "difficultyChange": "increased",
  "phaseComplete": false,
  "nextPhase": null,
  "testComplete": false,
  "stopCondition": null,
  "updatedSession": {...}
}
```

**Verify**:
- ✅ Answer recorded
- ✅ Difficulty adjusted (if in adaptive_core phase)
- ✅ Response time saved
- ✅ Session counters updated

#### 4. Complete Test

**Request**:
```bash
curl -X POST http://localhost:8788/api/adaptive-session/complete/SESSION_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected Response** (200 OK):
```json
{
  "id": "uuid",
  "session_id": "uuid",
  "student_id": "uuid",
  "final_aptitude_level": 7,
  "confidence_tag": "high_confidence",
  "total_questions": 25,
  "correct_answers": 18,
  "accuracy_percentage": 72.0,
  "average_response_time_ms": 4500,
  "analytics": {...},
  "completed_at": "2026-01-31T..."
}
```

**Verify**:
- ✅ Results calculated correctly
- ✅ Final aptitude level determined
- ✅ Confidence tag assigned
- ✅ Analytics populated

#### 5. Get Results

**Request**:
```bash
curl http://localhost:8788/api/adaptive-session/results/SESSION_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected Response** (200 OK):
```json
{
  "id": "uuid",
  "session_id": "uuid",
  "final_aptitude_level": 7,
  "confidence_tag": "high_confidence",
  ...
}
```

**Verify**:
- ✅ Results retrieved
- ✅ Matches complete test results

#### 6. Get Student Results

**Request**:
```bash
curl http://localhost:8788/api/adaptive-session/results/student/STUDENT_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected Response** (200 OK):
```json
{
  "results": [
    {
      "id": "uuid",
      "session_id": "uuid",
      "final_aptitude_level": 7,
      "completed_at": "2026-01-31T..."
    }
  ]
}
```

**Verify**:
- ✅ All student results returned
- ✅ Ordered by most recent first

#### 7. Resume Test

**Request**:
```bash
curl http://localhost:8788/api/adaptive-session/resume/SESSION_ID
```

**Expected Response** (200 OK):
```json
{
  "session": {...},
  "currentQuestion": {...},
  "isTestComplete": false
}
```

**Verify**:
- ✅ Session state restored
- ✅ Current question returned
- ✅ Can continue from where left off

#### 8. Find In-Progress Session

**Request**:
```bash
curl "http://localhost:8788/api/adaptive-session/find-in-progress/STUDENT_ID?gradeLevel=grade_9"
```

**Expected Response** (200 OK):
```json
{
  "session": {
    "id": "uuid",
    "status": "in_progress",
    ...
  }
}
```

**Verify**:
- ✅ Finds most recent in-progress session
- ✅ Returns null if no in-progress sessions

#### 9. Abandon Session

**Request**:
```bash
curl -X POST http://localhost:8788/api/adaptive-session/abandon/SESSION_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected Response** (200 OK):
```json
{
  "success": true,
  "message": "Session abandoned successfully"
}
```

**Verify**:
- ✅ Session status updated to 'abandoned'
- ✅ Cannot resume abandoned session

### Authentication Testing

**Test Protected Endpoints Without Auth**:
```bash
# Should return 401 Unauthorized
curl -X POST http://localhost:8788/api/adaptive-session/initialize \
  -H "Content-Type: application/json" \
  -d '{"studentId": "test", "gradeLevel": "grade_9"}'
```

**Test With Invalid Token**:
```bash
# Should return 401 Unauthorized
curl -X POST http://localhost:8788/api/adaptive-session/initialize \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer invalid-token" \
  -d '{"studentId": "test", "gradeLevel": "grade_9"}'
```

**Verify**:
- ✅ Protected endpoints require authentication
- ✅ Invalid tokens rejected
- ✅ Proper error messages returned

---

## Task 69: Test Frontend Integration

### Setup

1. **Start Local Server**:
```bash
npm run pages:dev
```

2. **Login as Student**:
   - Navigate to `http://localhost:8788`
   - Login with test student credentials
   - Navigate to assessment page

### End-to-End Test Flow

#### 1. Start New Test

**Steps**:
1. Navigate to `/student/assessment/test`
2. Click "Start Adaptive Aptitude Test"
3. Select grade level
4. Click "Begin Test"

**Verify**:
- ✅ No CORS errors in console
- ✅ No 502 errors
- ✅ Session initialized successfully
- ✅ First question displayed
- ✅ Loading states work correctly

**Check Console**:
```javascript
// Should see logs like:
// [AdaptiveAptitudeService] Initializing test for student: <id>
// [AdaptiveAptitudeApiService] POST /api/adaptive-session/initialize
// [AdaptiveAptitudeService] Test initialized successfully
```

#### 2. Answer Questions

**Steps**:
1. Read question
2. Select an answer (A, B, C, or D)
3. Click "Submit Answer"
4. Observe next question

**Verify**:
- ✅ Answer submitted without errors
- ✅ Next question loads immediately
- ✅ Progress bar updates
- ✅ Phase transitions work (diagnostic → adaptive_core → stability)
- ✅ No duplicate questions
- ✅ Difficulty adjusts based on answers

**Check Console**:
```javascript
// Should see logs like:
// [AdaptiveAptitudeService] Submitting answer for question: <id>
// [AdaptiveAptitudeApiService] POST /api/adaptive-session/submit-answer
// [AdaptiveAptitudeService] Answer submitted, difficulty: 5 → 6
// [AdaptiveAptitudeService] Getting next question for session: <id>
// [AdaptiveAptitudeApiService] GET /api/adaptive-session/next-question/<id>
```

#### 3. Complete Test

**Steps**:
1. Answer all questions until test completes
2. Observe completion screen
3. View results

**Verify**:
- ✅ Test completes automatically
- ✅ Results calculated correctly
- ✅ Final aptitude level displayed
- ✅ Confidence tag shown
- ✅ Analytics displayed (accuracy by difficulty, by subtag)
- ✅ No errors during completion

**Check Console**:
```javascript
// Should see logs like:
// [AdaptiveAptitudeService] Test complete, calculating results
// [AdaptiveAptitudeApiService] POST /api/adaptive-session/complete/<id>
// [AdaptiveAptitudeService] Results calculated successfully
```

#### 4. Resume Test

**Steps**:
1. Start a new test
2. Answer a few questions
3. Close browser tab (or navigate away)
4. Return to assessment page
5. Click "Resume Test"

**Verify**:
- ✅ In-progress session detected
- ✅ Resume option displayed
- ✅ Test resumes from correct question
- ✅ Previous answers preserved
- ✅ Progress accurate

**Check Console**:
```javascript
// Should see logs like:
// [AdaptiveAptitudeService] Finding in-progress session for student: <id>
// [AdaptiveAptitudeApiService] GET /api/adaptive-session/find-in-progress/<id>
// [AdaptiveAptitudeService] Found in-progress session: <session-id>
// [AdaptiveAptitudeService] Resuming test: <session-id>
// [AdaptiveAptitudeApiService] GET /api/adaptive-session/resume/<id>
```

#### 5. View Results History

**Steps**:
1. Navigate to results/history page
2. View list of completed tests

**Verify**:
- ✅ All completed tests displayed
- ✅ Most recent first
- ✅ Can view details of each test
- ✅ Results load without errors

**Check Console**:
```javascript
// Should see logs like:
// [AdaptiveAptitudeService] Getting test results for student: <id>
// [AdaptiveAptitudeApiService] GET /api/adaptive-session/results/student/<id>
// [AdaptiveAptitudeService] Found 3 completed test(s)
```

#### 6. Abandon Test

**Steps**:
1. Start a new test
2. Answer a few questions
3. Click "Abandon Test" or "Exit"
4. Confirm abandonment

**Verify**:
- ✅ Session abandoned successfully
- ✅ Cannot resume abandoned session
- ✅ Proper confirmation message

**Check Console**:
```javascript
// Should see logs like:
// [AdaptiveAptitudeService] Abandoning session: <id>
// [AdaptiveAptitudeApiService] POST /api/adaptive-session/abandon/<id>
// [AdaptiveAptitudeService] Session abandoned successfully
```

### Browser Console Checks

**No Errors**:
```javascript
// Should NOT see:
// ❌ CORS error
// ❌ 502 Bad Gateway
// ❌ Network error
// ❌ Supabase connection error
// ❌ TypeError
// ❌ Undefined variable
```

**Expected Logs**:
```javascript
// Should see:
// ✅ [AdaptiveAptitudeService] logs
// ✅ [AdaptiveAptitudeApiService] logs
// ✅ Successful API responses
// ✅ Proper state transitions
```

### Network Tab Checks

**Open DevTools → Network Tab**:

**Verify Requests**:
- ✅ All requests to `/api/adaptive-session/*`
- ✅ No direct requests to Supabase (except auth)
- ✅ Proper Authorization headers
- ✅ All responses 200 OK (or expected error codes)
- ✅ Response times reasonable (<2s)

**Example Requests**:
```
POST /api/adaptive-session/initialize → 200 OK
GET /api/adaptive-session/next-question/<id> → 200 OK
POST /api/adaptive-session/submit-answer → 200 OK
POST /api/adaptive-session/complete/<id> → 200 OK
GET /api/adaptive-session/results/<id> → 200 OK
```

---

## Task 70: Performance and Error Handling Testing

### Performance Testing

#### 1. Response Time Testing

**Measure API Response Times**:
```bash
# Test initialize endpoint
time curl -X POST http://localhost:8788/api/adaptive-session/initialize \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"studentId": "YOUR_STUDENT_ID", "gradeLevel": "grade_9"}'

# Test next question endpoint
time curl http://localhost:8788/api/adaptive-session/next-question/SESSION_ID

# Test submit answer endpoint
time curl -X POST http://localhost:8788/api/adaptive-session/submit-answer \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"sessionId": "SESSION_ID", "questionId": "QUESTION_ID", "selectedAnswer": "A", "responseTimeMs": 5000}'
```

**Expected Response Times**:
- Initialize: <3s (includes question generation)
- Next Question: <1s
- Submit Answer: <500ms
- Complete: <2s (includes analytics calculation)
- Get Results: <200ms (cached)

**Verify**:
- ✅ All endpoints respond within acceptable time
- ✅ No timeouts
- ✅ Consistent performance across multiple requests

#### 2. Concurrent Request Testing

**Test Multiple Simultaneous Requests**:
```bash
# Run 10 concurrent requests
for i in {1..10}; do
  curl http://localhost:8788/api/adaptive-session/next-question/SESSION_ID &
done
wait
```

**Verify**:
- ✅ All requests complete successfully
- ✅ No race conditions
- ✅ Session state remains consistent
- ✅ No duplicate questions returned

#### 3. Large Session Testing

**Test with Many Questions**:
1. Complete a full test (25+ questions)
2. Verify performance doesn't degrade
3. Check memory usage

**Verify**:
- ✅ Performance consistent throughout test
- ✅ No memory leaks
- ✅ Analytics calculation completes quickly

### Error Handling Testing

#### 1. Network Failure Simulation

**Test API Unavailable**:
```bash
# Stop server
# Try to use frontend
# Should see graceful error messages
```

**Verify**:
- ✅ User-friendly error messages
- ✅ No crashes
- ✅ Retry logic works (if implemented)
- ✅ Can recover when server returns

#### 2. Supabase Connection Failure

**Simulate Supabase Downtime**:
```bash
# Temporarily break Supabase connection
# (change SUPABASE_URL in .env to invalid value)
# Restart server
# Try to use API
```

**Verify**:
- ✅ Proper error messages returned
- ✅ 500 errors with descriptive messages
- ✅ No exposed stack traces
- ✅ Logs contain useful debugging info

#### 3. Invalid Input Testing

**Test Invalid Session ID**:
```bash
curl http://localhost:8788/api/adaptive-session/next-question/invalid-id
```

**Expected**: 404 Not Found

**Test Invalid Question ID**:
```bash
curl -X POST http://localhost:8788/api/adaptive-session/submit-answer \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"sessionId": "VALID_SESSION_ID", "questionId": "invalid-id", "selectedAnswer": "A", "responseTimeMs": 5000}'
```

**Expected**: 400 Bad Request

**Test Invalid Answer**:
```bash
curl -X POST http://localhost:8788/api/adaptive-session/submit-answer \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"sessionId": "VALID_SESSION_ID", "questionId": "VALID_QUESTION_ID", "selectedAnswer": "Z", "responseTimeMs": 5000}'
```

**Expected**: 400 Bad Request

**Verify**:
- ✅ All invalid inputs rejected
- ✅ Proper error messages
- ✅ No crashes
- ✅ No data corruption

#### 4. Authorization Testing

**Test Wrong Student Access**:
```bash
# Login as Student A
# Try to access Student B's session
curl http://localhost:8788/api/adaptive-session/results/STUDENT_B_SESSION_ID \
  -H "Authorization: Bearer STUDENT_A_TOKEN"
```

**Expected**: 403 Forbidden

**Verify**:
- ✅ Cannot access other students' sessions
- ✅ Cannot submit answers for other students
- ✅ Cannot view other students' results
- ✅ Proper authorization checks

#### 5. Edge Case Testing

**Test Duplicate Question Prevention**:
1. Complete a test
2. Check database for duplicate questions
3. Verify validation metadata

**SQL Check**:
```sql
-- Check for duplicates in a session
SELECT question_id, COUNT(*) as count
FROM adaptive_aptitude_responses
WHERE session_id = 'YOUR_SESSION_ID'
GROUP BY question_id
HAVING COUNT(*) > 1;

-- Should return 0 rows
```

**Test Phase Transitions**:
1. Complete diagnostic phase
2. Verify transition to adaptive_core
3. Complete adaptive_core
4. Verify transition to stability_confirmation
5. Complete stability phase
6. Verify test completion

**Verify**:
- ✅ No duplicate questions
- ✅ Smooth phase transitions
- ✅ Correct question counts per phase
- ✅ Stop conditions work correctly

---

## Success Criteria

### Task 68: API Endpoints ✅

- [ ] All 9 endpoints respond correctly
- [ ] Authentication works on protected endpoints
- [ ] Error handling works properly
- [ ] Response structures match documentation
- [ ] No TypeScript errors
- [ ] Automated test suite passes

### Task 69: Frontend Integration ✅

- [ ] Can start new test without errors
- [ ] Can answer questions without errors
- [ ] Can complete test and view results
- [ ] Can resume in-progress test
- [ ] Can view results history
- [ ] Can abandon test
- [ ] No CORS errors
- [ ] No 502 errors
- [ ] No console errors
- [ ] All network requests successful

### Task 70: Performance & Error Handling ✅

- [ ] All endpoints respond within acceptable time
- [ ] Concurrent requests handled correctly
- [ ] Large sessions perform well
- [ ] Network failures handled gracefully
- [ ] Supabase failures handled gracefully
- [ ] Invalid inputs rejected properly
- [ ] Authorization checks work correctly
- [ ] No duplicate questions
- [ ] Phase transitions work correctly
- [ ] Edge cases handled properly

---

## Troubleshooting

### Common Issues

**Issue**: CORS errors
**Solution**: Verify `functions/_middleware.ts` is handling CORS correctly

**Issue**: 502 Bad Gateway
**Solution**: Check Supabase connection, verify environment variables

**Issue**: Authentication failures
**Solution**: Verify JWT token is valid, check token expiration

**Issue**: Duplicate questions
**Solution**: Check exclusion list logic, verify validation functions

**Issue**: Slow performance
**Solution**: Check database indexes, verify caching, check network latency

### Debug Logging

**Enable Verbose Logging**:
```typescript
// In adaptiveAptitudeApiService.ts
const DEBUG = true; // Set to true for verbose logging
```

**Check Server Logs**:
```bash
# Server logs show all API requests
npm run pages:dev
# Watch for errors and warnings
```

**Check Database**:
```sql
-- Check session state
SELECT * FROM adaptive_aptitude_sessions WHERE id = 'YOUR_SESSION_ID';

-- Check responses
SELECT * FROM adaptive_aptitude_responses WHERE session_id = 'YOUR_SESSION_ID' ORDER BY created_at;

-- Check results
SELECT * FROM adaptive_aptitude_results WHERE session_id = 'YOUR_SESSION_ID';
```

---

## Completion Checklist

### Before Marking Tasks Complete

- [ ] Run automated test suite (Task 68)
- [ ] Complete all manual API tests (Task 68)
- [ ] Complete full end-to-end frontend test (Task 69)
- [ ] Test all user flows (start, answer, complete, resume, abandon) (Task 69)
- [ ] Run performance tests (Task 70)
- [ ] Run error handling tests (Task 70)
- [ ] Test edge cases (Task 70)
- [ ] Verify no console errors
- [ ] Verify no network errors
- [ ] Verify no database errors
- [ ] Document any issues found
- [ ] Fix any critical issues
- [ ] Update documentation if needed

### Final Verification

- [ ] All 9 API endpoints working
- [ ] All frontend flows working
- [ ] No CORS errors
- [ ] No 502 errors
- [ ] Performance acceptable
- [ ] Error handling robust
- [ ] Authorization secure
- [ ] No duplicate questions
- [ ] Phase transitions smooth
- [ ] Results calculated correctly

---

## Next Steps

After completing Tasks 68-70:

1. **Update Progress Tracker**:
   - Mark tasks 68-70 as complete in `.kiro/specs/cloudflare-unimplemented-features/tasks.md`
   - Update `PHASE_5_PROGRESS.md` to 24/24 (100%)

2. **Create Completion Summary**:
   - Document test results
   - Note any issues found and fixed
   - Confirm all success criteria met

3. **Proceed to Phase 6**:
   - Move on to remaining phases (if any)
   - Or mark Phase 5 as complete

---

## Resources

- **API Documentation**: `functions/api/adaptive-session/README.md`
- **Frontend Documentation**: `src/services/README_ADAPTIVE_APTITUDE.md`
- **Progress Tracker**: `PHASE_5_PROGRESS.md`
- **Verification Report**: `TASKS_71_75_FINAL_VERIFICATION.md`
- **Test Script**: `test-adaptive-session-api.cjs`

---

**Ready to test!** 🚀

Follow this guide step-by-step to complete Tasks 68-70 and finish Phase 5.

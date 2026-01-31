# Quick Start: Testing Phase 5 🚀

**Status**: Ready to test
**Time**: 1.5-2.5 hours
**Progress**: 21/24 → 24/24 (88% → 100%)

---

## Prerequisites (5 minutes)

### 1. Start Server
```bash
npm run pages:dev
```

### 2. Get Test Data

**Student ID**:
```sql
SELECT id FROM students LIMIT 1;
```

**JWT Token**:
```javascript
// In browser console after login
const { data: { session } } = await supabase.auth.getSession();
console.log(session.access_token);
```

---

## Task 68: API Testing (5-45 minutes)

### Option 1: Automated (Recommended) ⚡

```bash
# 1. Edit test-adaptive-session-api.cjs
#    - Set TEST_CONFIG.studentId = "your-student-id"
#    - Set TEST_CONFIG.authToken = "your-jwt-token"

# 2. Run tests
node test-adaptive-session-api.cjs

# Expected output:
# ✅ All tests passed! 🎉
```

### Option 2: Manual

See `ADAPTIVE_SESSION_TESTING_GUIDE.md` Task 68 section for curl commands.

---

## Task 69: Frontend Testing (30-45 minutes)

### Test Flows

1. **Start New Test**
   - Navigate to `/student/assessment/test`
   - Click "Start Adaptive Aptitude Test"
   - Verify no CORS errors

2. **Answer Questions**
   - Answer 5-10 questions
   - Verify difficulty adjusts
   - Verify no duplicates

3. **Complete Test**
   - Finish all questions
   - View results
   - Verify analytics display

4. **Resume Test**
   - Start new test
   - Answer a few questions
   - Close browser
   - Return and resume
   - Verify continues correctly

5. **View History**
   - Navigate to results page
   - Verify all tests shown

6. **Abandon Test**
   - Start new test
   - Click abandon
   - Verify cannot resume

### Success Criteria
- [ ] No CORS errors
- [ ] No 502 errors
- [ ] No console errors
- [ ] All flows work

---

## Task 70: Performance Testing (45-60 minutes)

### Response Time Tests

```bash
# Test initialize
time curl -X POST http://localhost:8788/api/adaptive-session/initialize \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"studentId": "YOUR_ID", "gradeLevel": "grade_9"}'

# Expected: <3s

# Test next question
time curl http://localhost:8788/api/adaptive-session/next-question/SESSION_ID

# Expected: <1s

# Test submit answer
time curl -X POST http://localhost:8788/api/adaptive-session/submit-answer \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"sessionId": "SESSION_ID", "questionId": "QUESTION_ID", "selectedAnswer": "A", "responseTimeMs": 5000}'

# Expected: <500ms
```

### Error Handling Tests

```bash
# Test invalid session ID (should return 404)
curl http://localhost:8788/api/adaptive-session/next-question/invalid-id

# Test without auth (should return 401)
curl -X POST http://localhost:8788/api/adaptive-session/initialize \
  -H "Content-Type: application/json" \
  -d '{"studentId": "test", "gradeLevel": "grade_9"}'

# Test invalid answer (should return 400)
curl -X POST http://localhost:8788/api/adaptive-session/submit-answer \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"sessionId": "SESSION_ID", "questionId": "QUESTION_ID", "selectedAnswer": "Z", "responseTimeMs": 5000}'
```

### Success Criteria
- [ ] Response times acceptable
- [ ] Errors handled gracefully
- [ ] Invalid inputs rejected
- [ ] Authorization works

---

## Completion Checklist

### After All Tests Pass

- [ ] All 9 API endpoints working
- [ ] All frontend flows working
- [ ] No CORS errors
- [ ] No 502 errors
- [ ] Performance acceptable
- [ ] Error handling robust

### Update Documentation

```bash
# 1. Mark tasks complete in tasks.md
# Change [ ] to [x] for tasks 68-70

# 2. Update PHASE_5_PROGRESS.md
# Change "21/24 tasks (88%)" to "24/24 tasks (100%)"

# 3. Create completion summary (optional)
```

---

## Troubleshooting

**Server not responding**:
```bash
# Make sure server is running
npm run pages:dev
```

**Authentication failures**:
```bash
# Get fresh token from browser console
const { data: { session } } = await supabase.auth.getSession();
console.log(session.access_token);
```

**CORS errors**:
- Check `functions/_middleware.ts` is correct
- Verify server is running on correct port

**502 errors**:
- Check Supabase connection
- Verify environment variables

---

## Resources

**Full Testing Guide**: `ADAPTIVE_SESSION_TESTING_GUIDE.md`
**Test Suite**: `test-adaptive-session-api.cjs`
**API Docs**: `functions/api/adaptive-session/README.md`
**Service Docs**: `src/services/README_ADAPTIVE_APTITUDE.md`
**Progress**: `PHASE_5_PROGRESS.md`

---

## Expected Results

### Task 68
```
✅ All tests passed! 🎉
Total Tests: 9
Passed: 9
Failed: 0
Success Rate: 100.0%
```

### Task 69
```
✅ No CORS errors
✅ No 502 errors
✅ No console errors
✅ All flows working
```

### Task 70
```
✅ Response times good
✅ Errors handled well
✅ Authorization secure
✅ Edge cases covered
```

---

## Time Estimate

- **Task 68**: 5-45 minutes (automated vs manual)
- **Task 69**: 30-45 minutes
- **Task 70**: 45-60 minutes
- **Total**: 1.5-2.5 hours

---

**Ready to test!** Follow this guide to complete Phase 5. 🎯

For detailed instructions, see `ADAPTIVE_SESSION_TESTING_GUIDE.md`.

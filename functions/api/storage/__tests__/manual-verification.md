# Storage API Authentication - Manual Verification Guide

This guide provides step-by-step instructions to manually verify the authentication and authorization implementation.

## Prerequisites

1. Storage API running (locally or deployed)
2. Valid test user accounts in Supabase
3. Valid JWT tokens for test users
4. API testing tool (curl, Postman, or similar)

## Test Scenarios

### 1. Public Endpoints (No Authentication Required)

#### Test 1.1: Health Check
```bash
curl http://localhost:8788/api/storage/
```
**Expected:** 200 OK with service status

#### Test 1.2: Course Certificate
```bash
curl -X POST http://localhost:8788/api/storage/course-certificate \
  -H "Content-Type: application/json" \
  -d '{"studentId": "test-student"}'
```
**Expected:** Not 401 (may return 404 if certificate doesn't exist)

#### Test 1.3: Extract Content
```bash
curl -X POST http://localhost:8788/api/storage/extract-content \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com/test.pdf"}'
```
**Expected:** Not 401 (may return other errors)

### 2. Authentication - Upload Flow

#### Test 2.1: Upload Without Token
```bash
curl -X POST http://localhost:8788/api/storage/upload \
  -F "file=@test.txt" \
  -F "filename=test.txt"
```
**Expected:** 401 Unauthorized with "Authentication required" message

#### Test 2.2: Upload With Invalid Token
```bash
curl -X POST http://localhost:8788/api/storage/upload \
  -H "Authorization: Bearer invalid-token-12345" \
  -F "file=@test.txt" \
  -F "filename=test.txt"
```
**Expected:** 401 Unauthorized

#### Test 2.3: Upload With Valid Token
```bash
# Replace YOUR_TOKEN with actual JWT token
curl -X POST http://localhost:8788/api/storage/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@test.txt" \
  -F "filename=test.txt"
```
**Expected:** 200 OK with file URL and key containing user ID

#### Test 2.4: Verify User ID in Path
Check the returned `key` field from Test 2.3:
- Should match pattern: `uploads/{userId}/{timestamp}-{random}.{ext}`
- Extract userId from key and verify it matches the token's user ID

### 3. Authorization - Delete Flow

#### Test 3.1: Delete Without Token
```bash
curl -X POST http://localhost:8788/api/storage/delete \
  -H "Content-Type: application/json" \
  -d '{"key": "uploads/user-123/test.txt"}'
```
**Expected:** 401 Unauthorized

#### Test 3.2: Delete Own File
```bash
# Use token for user-123
curl -X POST http://localhost:8788/api/storage/delete \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer USER_123_TOKEN" \
  -d '{"key": "uploads/user-123/test.txt"}'
```
**Expected:** 200 OK or 404 (if file doesn't exist)

#### Test 3.3: Delete Another User's File
```bash
# Use token for user-456 to delete user-123's file
curl -X POST http://localhost:8788/api/storage/delete \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer USER_456_TOKEN" \
  -d '{"key": "uploads/user-123/test.txt"}'
```
**Expected:** 403 Forbidden with "Access denied" message

#### Test 3.4: Delete Certificate (Wrong User)
```bash
curl -X POST http://localhost:8788/api/storage/delete \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer USER_456_TOKEN" \
  -d '{"key": "certificates/user-123/certificate.pdf"}'
```
**Expected:** 403 Forbidden

#### Test 3.5: Delete Payment Receipt (Wrong User)
```bash
curl -X POST http://localhost:8788/api/storage/delete \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer USER_456_TOKEN" \
  -d '{"key": "payment_pdf/receipt_user-123/payment.pdf"}'
```
**Expected:** 403 Forbidden

### 4. Authorization - Payment Receipt Access

#### Test 4.1: Access Without Token
```bash
curl -X POST http://localhost:8788/api/storage/payment-receipt \
  -H "Content-Type: application/json" \
  -d '{"paymentId": "test-payment-id"}'
```
**Expected:** 401 Unauthorized

#### Test 4.2: Access Own Receipt
```bash
# Requires actual payment ID from database
curl -X POST http://localhost:8788/api/storage/payment-receipt \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"paymentId": "your-payment-id"}'
```
**Expected:** 200 OK with receipt data (if exists) or 404

#### Test 4.3: Access Another User's Receipt
```bash
# Use different user's token
curl -X POST http://localhost:8788/api/storage/payment-receipt \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer OTHER_USER_TOKEN" \
  -d '{"paymentId": "your-payment-id"}'
```
**Expected:** 403 Forbidden

### 5. Authorization - Presigned URL Flow

#### Test 5.1: Request Without Token
```bash
curl -X POST http://localhost:8788/api/storage/presigned \
  -H "Content-Type: application/json" \
  -d '{"filename": "test.pdf", "courseId": "course-1", "lessonId": "lesson-1"}'
```
**Expected:** 401 Unauthorized

#### Test 5.2: Generate Presigned URL
```bash
curl -X POST http://localhost:8788/api/storage/presigned \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"filename": "test.pdf", "courseId": "course-1", "lessonId": "lesson-1"}'
```
**Expected:** 200 OK with presigned URL and key containing user ID

#### Test 5.3: Confirm Upload (Wrong User)
```bash
# Try to confirm upload for another user's file
curl -X POST http://localhost:8788/api/storage/confirm \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer OTHER_USER_TOKEN" \
  -d '{"fileKey": "courses/course-1/lesson-1/user-123/test.pdf"}'
```
**Expected:** 403 Forbidden

### 6. Error Message Validation

#### Test 6.1: Check 401 Error Format
From any test that returns 401, verify response contains:
```json
{
  "error": "Authentication required",
  "message": "..."
}
```

#### Test 6.2: Check 403 Error Format
From any test that returns 403, verify response contains:
```json
{
  "error": "Access denied",
  "message": "...",
  "reason": "..."
}
```

### 7. Frontend Integration Verification

#### Test 7.1: Check Token Retrieval
In browser console:
```javascript
const { data: { session } } = await supabase.auth.getSession();
console.log('Token:', session?.access_token);
```

#### Test 7.2: Test Upload from Frontend
```javascript
const file = new File(['test'], 'test.txt', { type: 'text/plain' });
const result = await uploadToCloudflareR2(file, 'test');
console.log('Upload result:', result);
```

#### Test 7.3: Test Delete from Frontend
```javascript
const success = await deleteFromCloudflareR2('https://your-r2-url/file.txt');
console.log('Delete success:', success);
```

## Verification Checklist

- [ ] Public endpoints work without authentication
- [ ] Protected endpoints reject requests without tokens
- [ ] Protected endpoints reject requests with invalid tokens
- [ ] Valid tokens allow access to protected endpoints
- [ ] Uploaded files include user ID in path
- [ ] Users can delete their own files
- [ ] Users cannot delete other users' files
- [ ] Certificate ownership is validated
- [ ] Payment receipt ownership is validated
- [ ] Upload ownership is validated
- [ ] Presigned URLs include user ID
- [ ] Upload confirmation validates user ID
- [ ] 401 errors have clear messages
- [ ] 403 errors have clear messages
- [ ] Frontend services include tokens automatically
- [ ] Token refresh works correctly

## Notes

- Replace placeholder tokens (YOUR_TOKEN, USER_123_TOKEN, etc.) with actual JWT tokens
- Replace placeholder user IDs with actual user IDs from your test database
- Some tests may return 404 if test data doesn't exist - this is expected
- Focus on verifying correct status codes (401, 403, 200) rather than data existence
- All authentication/authorization logic should work regardless of whether files exist

## Common Issues

1. **401 on all requests:** Check if SUPABASE_URL and SUPABASE_ANON_KEY are set correctly
2. **403 on own files:** Verify user ID extraction from token matches path pattern
3. **Token not included:** Check if frontend service is calling supabase.auth.getSession()
4. **CORS errors:** Ensure CORS headers are properly configured in the API

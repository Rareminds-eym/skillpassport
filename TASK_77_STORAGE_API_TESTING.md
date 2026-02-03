# Task 77: Storage API Integration Tests

**Date**: February 2, 2026 (Day 2)
**Duration**: 4-6 hours
**Status**: ⏳ Ready to start
**Endpoints**: 14

---

## Overview

Test all 14 Storage API endpoints including file upload/delete, presigned URLs, document access, PDF extraction, and file listing. This API integrates with Cloudflare R2 for object storage.

---

## Pre-Flight Checklist

### Environment Setup
- [x] Server running on `http://localhost:8788` (from Day 1)
- [ ] R2 credentials configured in `.dev.vars`
- [ ] Test files prepared for upload
- [ ] Storage API router verified

### Lessons from Task 76
- ✅ Verify actual endpoint count from router file first
- ✅ Check actual API response format before writing tests
- ✅ Test all endpoints, including edge cases
- ✅ Update spec file immediately after completion

---

## Step 1: Verify Storage API Endpoints

Let me first check the actual Storage API router to get the complete endpoint list.

---

## Expected Endpoints (14 Total)

Based on the spec, Storage API should have:

### Core Operations (2 endpoints)
1. POST `/api/storage/upload` - Upload file to R2
2. DELETE `/api/storage/delete` - Delete file from R2

### Presigned URLs (4 endpoints)
3. POST `/api/storage/presigned` - Generate presigned URL
4. POST `/api/storage/confirm` - Confirm upload completion
5. POST `/api/storage/get-url` - Get public URL from key
6. POST `/api/storage/get-file-url` - Alias for get-url

### Document Access (1 endpoint)
7. GET `/api/storage/document-access` - Proxy document from R2

### Signed URLs (2 endpoints)
8. POST `/api/storage/signed-url` - Generate signed URL for single document
9. POST `/api/storage/signed-urls` - Batch generate signed URLs

### Specialized Handlers (3 endpoints)
10. POST `/api/storage/upload-payment-receipt` - Upload base64 PDF
11. GET `/api/storage/payment-receipt` - Get payment receipt
12. GET `/api/storage/course-certificate` - Get course certificate

### PDF & File Operations (2 endpoints)
13. POST `/api/storage/extract-content` - Extract PDF content
14. GET `/api/storage/files/:courseId/:lessonId` - List files

---

## Test Categories

### Category 1: Core Operations (2 endpoints)
**Focus**: Basic upload and delete functionality

**Tests**:
- [ ] Upload a small text file
- [ ] Upload a PDF file
- [ ] Upload an image file
- [ ] Delete an uploaded file
- [ ] Verify file size limits
- [ ] Verify file type validation

---

### Category 2: Presigned URLs (4 endpoints)
**Focus**: URL generation for client-side uploads

**Tests**:
- [ ] Generate presigned URL for upload
- [ ] Confirm upload completion
- [ ] Get public URL from file key
- [ ] Test get-file-url alias

---

### Category 3: Document Access (1 endpoint)
**Focus**: Proxy files from R2

**Tests**:
- [ ] Access document through proxy
- [ ] Verify content-type headers
- [ ] Test with different file types

---

### Category 4: Signed URLs (2 endpoints)
**Focus**: Secure URL generation

**Tests**:
- [ ] Generate single signed URL
- [ ] Batch generate multiple signed URLs
- [ ] Verify URL expiration

---

### Category 5: Specialized Handlers (3 endpoints)
**Focus**: Payment receipts and certificates

**Tests**:
- [ ] Upload payment receipt (base64 PDF)
- [ ] Retrieve payment receipt
- [ ] Generate course certificate

---

### Category 6: PDF & File Operations (2 endpoints)
**Focus**: Content extraction and listing

**Tests**:
- [ ] Extract content from PDF
- [ ] List files by course and lesson
- [ ] Verify extracted text quality

---

## Test Execution Plan

### Morning Session (2-3 hours)

**Step 1: Verify Router** (15 min)
- Read Storage API router file
- Count actual endpoints
- Verify all handlers exist

**Step 2: Test Core Operations** (30 min)
- Test upload endpoint
- Test delete endpoint
- Verify R2 integration works

**Step 3: Test Presigned URLs** (45 min)
- Test all 4 presigned URL endpoints
- Verify URL generation
- Test upload flow

**Step 4: Test Document Access** (30 min)
- Test document proxy
- Verify different file types
- Check headers

---

### Afternoon Session (2-3 hours)

**Step 5: Test Signed URLs** (30 min)
- Test single signed URL
- Test batch signed URLs
- Verify expiration

**Step 6: Test Specialized Handlers** (45 min)
- Test payment receipt upload
- Test payment receipt retrieval
- Test certificate generation

**Step 7: Test PDF & File Operations** (45 min)
- Test PDF content extraction
- Test file listing
- Verify results

**Step 8: Document Results** (30 min)
- Create test results document
- Document any issues
- Update spec file

---

## R2 Configuration Check

Before testing, verify R2 credentials are configured:

```bash
# Check .dev.vars has R2 credentials
grep -E "CLOUDFLARE_R2|AWS_" .dev.vars
```

Expected variables:
- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_R2_ACCESS_KEY_ID`
- `CLOUDFLARE_R2_SECRET_ACCESS_KEY`
- `CLOUDFLARE_R2_BUCKET_NAME`

---

## Test Files Preparation

Create test files for upload:

```bash
# Create test directory
mkdir -p test-files

# Create small text file
echo "Test file content" > test-files/test.txt

# Create small PDF (if available)
# Or use existing PDF from project

# Create small image (if available)
# Or use existing image from project
```

---

## Manual Test Commands

### Test Upload
```bash
curl -X POST http://localhost:8788/api/storage/upload \
  -F "file=@test-files/test.txt" \
  -F "path=test/test.txt"
```

### Test Delete
```bash
curl -X DELETE http://localhost:8788/api/storage/delete \
  -H "Content-Type: application/json" \
  -d '{"key":"test/test.txt"}'
```

### Test Presigned URL
```bash
curl -X POST http://localhost:8788/api/storage/presigned \
  -H "Content-Type: application/json" \
  -d '{
    "fileName":"test.pdf",
    "fileType":"application/pdf",
    "path":"documents"
  }'
```

### Test Document Access
```bash
curl http://localhost:8788/api/storage/document-access?key=test/test.txt
```

### Test Signed URL
```bash
curl -X POST http://localhost:8788/api/storage/signed-url \
  -H "Content-Type: application/json" \
  -d '{"key":"test/test.txt"}'
```

### Test Payment Receipt Upload
```bash
curl -X POST http://localhost:8788/api/storage/upload-payment-receipt \
  -H "Content-Type: application/json" \
  -d '{
    "studentId":"student-uuid",
    "pdfBase64":"JVBERi0xLjQKJeLjz9MKMSAwIG9iago8PC9UeXBlL0NhdGFsb2cvUGFnZXMgMiAwIFI+PgplbmRvYmoKMiAwIG9iago8PC9UeXBlL1BhZ2VzL0tpZHNbMyAwIFJdL0NvdW50IDE+PgplbmRvYmoKMyAwIG9iago8PC9UeXBlL1BhZ2UvTWVkaWFCb3hbMCAwIDYxMiA3OTJdL1BhcmVudCAyIDAgUi9SZXNvdXJjZXM8PC9Gb250PDwvRjEgNCAwIFI+Pj4+L0NvbnRlbnRzIDUgMCBSPj4KZW5kb2JqCjQgMCBvYmoKPDwvVHlwZS9Gb250L1N1YnR5cGUvVHlwZTEvQmFzZUZvbnQvSGVsdmV0aWNhPj4KZW5kb2JqCjUgMCBvYmoKPDwvTGVuZ3RoIDQ0Pj4Kc3RyZWFtCkJUCi9GMSA0OCBUZgoxMCA3MDAgVGQKKFRlc3QpIFRqCkVUCmVuZHN0cmVhbQplbmRvYmoKeHJlZgowIDYKMDAwMDAwMDAwMCA2NTUzNSBmDQowMDAwMDAwMDE1IDAwMDAwIG4NCjAwMDAwMDAwNjQgMDAwMDAgbg0KMDAwMDAwMDEyMyAwMDAwMCBuDQowMDAwMDAwMjQ2IDAwMDAwIG4NCjAwMDAwMDAzMTQgMDAwMDAgbg0KdHJhaWxlcgo8PC9TaXplIDYvUm9vdCAxIDAgUj4+CnN0YXJ0eHJlZgo0MDYKJSVFT0YK"
  }'
```

### Test PDF Extraction
```bash
curl -X POST http://localhost:8788/api/storage/extract-content \
  -H "Content-Type: application/json" \
  -d '{"key":"test/document.pdf"}'
```

### Test File Listing
```bash
curl http://localhost:8788/api/storage/files/course-id/lesson-id
```

---

## Success Criteria

### Automated Tests
- [ ] Test script runs without errors
- [ ] At least 80% of tests pass
- [ ] All P0 issues fixed
- [ ] Results documented

### Manual Tests
- [ ] At least 3 endpoints tested manually
- [ ] R2 integration verified
- [ ] File operations work correctly

### Documentation
- [ ] Test results documented
- [ ] Issues list created
- [ ] Fixes documented
- [ ] Task 77 marked complete in spec

---

## Expected Challenges

### Challenge 1: R2 Credentials
**Issue**: R2 credentials might not be configured or might be invalid
**Solution**: Verify credentials in `.dev.vars`, test with simple upload

### Challenge 2: File Upload Format
**Issue**: Multipart form data vs JSON body
**Solution**: Check handler implementation for expected format

### Challenge 3: Large Files
**Issue**: Large file uploads might timeout
**Solution**: Use small test files (<1MB)

### Challenge 4: PDF Processing
**Issue**: PDF extraction might require external libraries
**Solution**: Test with simple PDFs first

---

## Issue Tracking Template

```markdown
## Issue #[number]

**Severity**: P0 / P1 / P2 / P3
**Category**: Core / Presigned / Document Access / etc.
**Endpoint**: [METHOD] /api/storage/[path]
**Description**: [Brief description]

**Steps to Reproduce**:
1. [Step 1]
2. [Step 2]

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

## Time Allocation

- **Router Verification**: 15 min
- **Core Operations**: 30 min
- **Presigned URLs**: 45 min
- **Document Access**: 30 min
- **Signed URLs**: 30 min
- **Specialized Handlers**: 45 min
- **PDF & File Operations**: 45 min
- **Documentation**: 30 min
- **Buffer**: 30 min
- **Total**: 4-5 hours

---

## Next Steps

1. ✅ Read Storage API router file
2. ⏳ Verify endpoint count
3. ⏳ Check R2 credentials
4. ⏳ Prepare test files
5. ⏳ Start testing

---

**Ready to start Task 77!** 🚀

**First action**: Verify Storage API router and endpoint count

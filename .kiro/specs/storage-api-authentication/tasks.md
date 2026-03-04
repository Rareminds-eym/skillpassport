# Implementation Plan: Storage API Authentication

## Overview

This implementation adds JWT-based authentication and ownership validation to the Storage API. The approach follows the existing pattern from the adaptive-session API, implementing authentication middleware at the router level and adding ownership validation in individual handlers. Frontend services are updated to automatically include authentication tokens in all requests.

## Tasks

- [x] 1. Create ownership validation utilities
  - Create new file `functions/api/storage/utils/ownership.ts`
  - Implement `extractUserIdFromPath()` to parse user IDs from file paths
  - Implement `validateCertificateOwnership()` for certificates/{studentId}/ pattern
  - Implement `validatePaymentReceiptOwnership()` for payment_pdf/{name}_{userId}/ pattern
  - Implement `validateUploadOwnership()` for uploads/{userId}/ pattern
  - Implement `isEducator()` to check educator role from database
  - _Requirements: 4.1, 4.2, 4.3, 4.5_

- [ ]* 1.1 Write property test for ownership validation
  - **Property 5: File deletion validates ownership**
  - **Validates: Requirements 4.1, 4.2, 4.3, 4.4**

- [x] 2. Add authentication middleware to main router
  - Update `functions/api/storage/[[path]].ts`
  - Import `authenticateUser` from `functions/api/shared/auth.ts`
  - Define PUBLIC_ENDPOINTS array: ['/', '/course-certificate', '/extract-content']
  - Implement `isPublicEndpoint()` function
  - Add authentication check before routing to handlers
  - Return 401 for failed authentication on protected endpoints
  - Attach user context (user, supabase, supabaseAdmin) to request
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4_

- [ ]* 2.1 Write property test for authentication middleware
  - **Property 1: Protected endpoints reject unauthenticated requests**
  - **Validates: Requirements 1.1, 1.2, 2.4**

- [ ]* 2.2 Write property test for valid token handling
  - **Property 2: Valid tokens attach user context**
  - **Validates: Requirements 1.4**

- [ ]* 2.3 Write unit tests for public endpoints
  - **Property 3: Public endpoints allow unauthenticated access**
  - **Validates: Requirements 1.5, 2.1, 2.2, 2.3**

- [x] 3. Update upload handler with authentication
  - Update `functions/api/storage/handlers/upload.ts`
  - Add authentication check at start of handler
  - Return 401 if user context is missing
  - Update `generateUniqueKey()` to accept userId parameter
  - Modify file key generation to include user ID: `uploads/${userId}/${timestamp}-${randomString}${extension}`
  - _Requirements: 3.1, 3.2, 3.3_

- [ ]* 3.1 Write property test for upload file paths
  - **Property 4: Uploaded files include user ID in path**
  - **Validates: Requirements 3.3**

- [ ]* 3.2 Write unit test for unauthenticated upload
  - Test that upload without token returns 401
  - _Requirements: 3.2_

- [x] 4. Update delete handler with ownership validation
  - Update `functions/api/storage/handlers/delete.ts`
  - Add authentication check at start of handler
  - Return 401 if user context is missing
  - Import ownership validation functions from utils/ownership.ts
  - Add ownership validation after extracting fileKey
  - Return 403 if ownership validation fails
  - Include reason in 403 response
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ]* 4.1 Write unit tests for delete authorization
  - Test delete own file succeeds
  - Test delete other user's file returns 403
  - Test educator can delete course materials
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 5. Update payment receipt handler with ownership validation
  - Update `functions/api/storage/handlers/payment-receipt.ts`
  - Add authentication check to `handleGetPaymentReceipt()`
  - Return 401 if user context is missing
  - Implement `extractPaymentIdFromKey()` helper function
  - Query orders table using supabaseAdmin to get payment owner
  - Validate authenticated user ID matches payment owner
  - Return 403 if ownership validation fails
  - Return 404 if payment not found
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ]* 5.1 Write property test for payment receipt access
  - **Property 6: Payment receipt access validates ownership**
  - **Validates: Requirements 5.3, 5.4, 5.5**

- [ ]* 5.2 Write unit tests for payment receipt authorization
  - Test access own receipt succeeds
  - Test access other user's receipt returns 403
  - _Requirements: 5.3, 5.4, 5.5_

- [x] 6. Update document access handler with authorization
  - Update `functions/api/storage/handlers/document-access.ts`
  - Implement `checkIfPublicDocument()` helper function
  - Add authentication check for private documents
  - Return 401 if authentication required but missing
  - Implement `validateDocumentOwnership()` function
  - Return 403 if ownership validation fails
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [ ]* 6.1 Write property test for private document access
  - **Property 7: Private document access validates ownership**
  - **Validates: Requirements 6.3**

- [ ]* 6.2 Write unit test for public document access
  - Test public documents work without authentication
  - _Requirements: 6.2_

- [x] 7. Update presigned URL handlers with authentication
  - Update `functions/api/storage/handlers/presigned.ts`
  - Add authentication check to `handlePresigned()`
  - Return 401 if user context is missing
  - Update `generatePresignedKey()` to include userId in path
  - Add authentication check to `handleConfirm()`
  - Validate fileKey contains authenticated user's ID
  - Return 403 if user ID mismatch
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [ ]* 7.1 Write property test for presigned URL paths
  - **Property 8: Presigned URLs include user ID**
  - **Validates: Requirements 7.2**

- [ ]* 7.2 Write property test for upload confirmation
  - **Property 9: Upload confirmation validates user ID**
  - **Validates: Requirements 7.3**

- [ ] 8. Checkpoint - Ensure backend tests pass
  - Run all backend tests
  - Verify authentication middleware works correctly
  - Verify ownership validation works correctly
  - Ask the user if questions arise

- [x] 9. Update cloudflareR2Upload.ts with token integration
  - Update `src/utils/cloudflareR2Upload.ts`
  - Import supabase client
  - Update `uploadToCloudflareR2()` to call `supabase.auth.getSession()`
  - Add Authorization header with Bearer token to upload request
  - Handle 401 response with clear error message
  - Return error if no session exists
  - Update `deleteFromCloudflareR2()` to call `supabase.auth.getSession()`
  - Add Authorization header with Bearer token to delete request
  - Handle authentication errors
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 10. Update storageApiService.ts with token integration
  - Update `src/services/storageApiService.ts`
  - Import supabase client
  - Create `getAuthToken()` helper function using `supabase.auth.getSession()`
  - Update `uploadFile()` to call `getAuthToken()` and include in headers
  - Update `deleteFile()` to call `getAuthToken()` and include in headers
  - Update `extractContent()` to call `getAuthToken()` and include in headers
  - Update `getPresignedUrl()` to call `getAuthToken()` and include in headers
  - Update `confirmUpload()` to call `getAuthToken()` and include in headers
  - Update `getFileUrl()` to call `getAuthToken()` and include in headers
  - Update `listFiles()` to call `getAuthToken()` and include in headers
  - Update `uploadPaymentReceipt()` to call `getAuthToken()` and include in headers
  - Add error handling for missing authentication
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

- [x] 11. Update fileUploadService.ts with token integration (if exists)
  - Check if `src/services/fileUploadService.ts` exists
  - If exists, import supabase client
  - Update `uploadFile()` to retrieve and include authentication token
  - Update `deleteFile()` to retrieve and include authentication token
  - Add error handling for 401 responses
  - _Requirements: 9.1, 9.2, 9.3, 9.4_

- [x] 12. Update storageService.ts with token integration (if exists)
  - Check if `src/services/storageService.ts` exists
  - If exists, import supabase client
  - Update `uploadFile()` to retrieve and include authentication token
  - Update `deleteFile()` to retrieve and include authentication token
  - Update `getSignedUrl()` to retrieve and include authentication token
  - Add error handling for 401 responses
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [x] 13. Add error response validation
  - Update error responses to include clear messages
  - Ensure 401 responses include "Authentication required" message
  - Ensure 403 responses include "Access denied" or "Insufficient permissions" message
  - Add logging for authentication failures (timestamp, endpoint)
  - Add logging for authorization failures (userId, fileKey, reason)
  - Ensure no sensitive data is logged (tokens, file contents)
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

- [ ]* 13.1 Write property test for error messages
  - **Property 10: Error responses include clear messages**
  - **Validates: Requirements 12.3, 12.4**

- [x] 14. Final checkpoint - Integration testing
  - Test complete upload flow with authentication
  - Test complete delete flow with ownership validation
  - Test payment receipt access with ownership validation
  - Test public endpoints without authentication
  - Test error handling for invalid/expired tokens
  - Verify frontend services include tokens correctly
  - Ensure all tests pass
  - Ask the user if questions arise

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Authentication uses existing `authenticateUser()` function from shared/auth.ts
- Ownership validation is centralized in utils/ownership.ts for reusability
- Frontend changes retrieve tokens automatically using supabase.auth.getSession()
- Property tests validate universal correctness properties across many inputs
- Unit tests validate specific examples and edge cases
- Both test types are complementary and provide comprehensive coverage

# Requirements Document: Storage API Authentication

## Introduction

The Storage API currently has no authentication or authorization, creating a critical security vulnerability where anyone can upload, download, and delete files from the R2 bucket. This feature implements JWT-based authentication using existing Supabase infrastructure and adds ownership validation to protect user data and prevent unauthorized access.

## Glossary

- **Storage_API**: The Cloudflare Pages Function that handles R2 storage operations (functions/api/storage/[[path]].ts)
- **JWT_Token**: JSON Web Token used for authentication, issued by Supabase
- **R2_Bucket**: Cloudflare R2 object storage bucket containing all uploaded files
- **Authenticated_User**: A user with a valid JWT token in the Authorization header
- **File_Owner**: The user who owns a specific file based on path patterns or database records
- **Public_Endpoint**: An endpoint that does not require authentication
- **Protected_Endpoint**: An endpoint that requires a valid JWT token
- **Ownership_Validation**: Verification that the authenticated user has permission to access a specific file
- **Authorization_Header**: HTTP header containing "Bearer {jwt_token}"
- **Supabase_Client**: Client instance for database operations with user context
- **Service_Role_Client**: Admin client instance for privileged database operations

## Requirements

### Requirement 1: Authentication Middleware

**User Story:** As a system administrator, I want all protected endpoints to require valid JWT tokens, so that unauthorized users cannot access the Storage API.

#### Acceptance Criteria

1. WHEN a request is made to a protected endpoint without an Authorization header, THEN THE Storage_API SHALL return a 401 Unauthorized response
2. WHEN a request is made with an invalid JWT_Token, THEN THE Storage_API SHALL return a 401 Unauthorized response
3. WHEN a request is made with an expired JWT_Token, THEN THE Storage_API SHALL return a 401 Unauthorized response
4. WHEN a request is made with a valid JWT_Token, THEN THE Storage_API SHALL extract the user ID and attach user context to the request
5. WHEN a request is made to a Public_Endpoint, THEN THE Storage_API SHALL process the request without requiring authentication

### Requirement 2: Public Endpoint Definition

**User Story:** As a student, I want to view course certificates without authentication, so that I can share them publicly.

#### Acceptance Criteria

1. THE Storage_API SHALL allow unauthenticated access to the /course-certificate endpoint
2. THE Storage_API SHALL allow unauthenticated access to the /extract-content endpoint
3. THE Storage_API SHALL allow unauthenticated access to the health check endpoint (/)
4. THE Storage_API SHALL require authentication for all other endpoints

### Requirement 3: Upload Endpoint Authorization

**User Story:** As a user, I want to upload files securely, so that only I can upload files to my storage space.

#### Acceptance Criteria

1. WHEN an Authenticated_User uploads a file, THEN THE Storage_API SHALL verify the user has a valid JWT_Token
2. WHEN an unauthenticated user attempts to upload a file, THEN THE Storage_API SHALL return a 401 Unauthorized response
3. WHEN an Authenticated_User uploads a file, THEN THE Storage_API SHALL include the user ID in the file path
4. THE Storage_API SHALL validate file size and type before accepting uploads

### Requirement 4: Delete Endpoint Ownership Validation

**User Story:** As a user, I want to ensure only I can delete my files, so that other users cannot delete my data.

#### Acceptance Criteria

1. WHEN an Authenticated_User attempts to delete a certificate file (certificates/{studentId}/), THEN THE Storage_API SHALL verify the studentId matches the authenticated user ID
2. WHEN an Authenticated_User attempts to delete a payment receipt (payment_pdf/{name}_{userId}/), THEN THE Storage_API SHALL verify the userId in the path matches the authenticated user ID
3. WHEN an Authenticated_User attempts to delete a user upload (uploads/{userId}/), THEN THE Storage_API SHALL verify the userId in the path matches the authenticated user ID
4. WHEN an Authenticated_User attempts to delete another user's file, THEN THE Storage_API SHALL return a 403 Forbidden response
5. WHEN an educator attempts to delete course materials, THEN THE Storage_API SHALL verify the user has educator role before allowing deletion

### Requirement 5: Payment Receipt Access Control

**User Story:** As a user, I want to ensure only I can access my payment receipts, so that my financial information remains private.

#### Acceptance Criteria

1. WHEN an Authenticated_User requests a payment receipt, THEN THE Storage_API SHALL extract the payment ID from the file key
2. WHEN the payment ID is extracted, THEN THE Storage_API SHALL query the database to retrieve the associated user_id
3. WHEN the database query completes, THEN THE Storage_API SHALL verify the user_id matches the authenticated user ID
4. WHEN the user_id does not match, THEN THE Storage_API SHALL return a 403 Forbidden response
5. WHEN the user_id matches, THEN THE Storage_API SHALL return the payment receipt file

### Requirement 6: Document Access Authorization

**User Story:** As a user, I want to ensure only authorized users can access documents, so that private documents remain secure.

#### Acceptance Criteria

1. WHEN an Authenticated_User requests document access, THEN THE Storage_API SHALL verify the user has a valid JWT_Token
2. WHEN a document is marked as public, THEN THE Storage_API SHALL allow unauthenticated access
3. WHEN a document is private, THEN THE Storage_API SHALL verify ownership before granting access
4. WHEN ownership verification fails, THEN THE Storage_API SHALL return a 403 Forbidden response

### Requirement 7: Presigned URL Authorization

**User Story:** As a user, I want presigned URLs to be generated securely, so that only I can upload large files to my storage space.

#### Acceptance Criteria

1. WHEN an Authenticated_User requests a presigned URL, THEN THE Storage_API SHALL verify the user has a valid JWT_Token
2. WHEN generating a presigned URL, THEN THE Storage_API SHALL include the user ID in the file path
3. WHEN confirming an upload, THEN THE Storage_API SHALL verify the authenticated user matches the user ID in the file path
4. WHEN an unauthenticated user requests a presigned URL, THEN THE Storage_API SHALL return a 401 Unauthorized response

### Requirement 8: Frontend Token Integration - cloudflareR2Upload.ts

**User Story:** As a developer, I want the R2 upload utility to automatically include authentication tokens, so that uploads are properly authenticated.

#### Acceptance Criteria

1. WHEN uploadToCloudflareR2() is called, THEN THE function SHALL retrieve the current session token using supabase.auth.getSession()
2. WHEN deleteFromCloudflareR2() is called, THEN THE function SHALL retrieve the current session token using supabase.auth.getSession()
3. WHEN a session token is retrieved, THEN THE function SHALL include it in the Authorization header as "Bearer {token}"
4. WHEN the API returns a 401 response, THEN THE function SHALL return a clear authentication error message
5. WHEN no session exists, THEN THE function SHALL return an error indicating authentication is required

### Requirement 9: Frontend Token Integration - fileUploadService.ts

**User Story:** As a developer, I want the file upload service to automatically include authentication tokens, so that file operations are properly authenticated.

#### Acceptance Criteria

1. WHEN uploadFile() is called, THEN THE function SHALL retrieve the current session token from Supabase
2. WHEN deleteFile() is called, THEN THE function SHALL retrieve the current session token from Supabase
3. WHEN a session token is retrieved, THEN THE function SHALL include it in the Authorization header
4. WHEN the API returns a 401 response, THEN THE function SHALL handle the authentication error appropriately

### Requirement 10: Frontend Token Integration - storageService.ts

**User Story:** As a developer, I want the storage service to automatically include authentication tokens, so that all storage operations are properly authenticated.

#### Acceptance Criteria

1. WHEN uploadFile() is called, THEN THE function SHALL retrieve the current session token from Supabase
2. WHEN deleteFile() is called, THEN THE function SHALL retrieve the current session token from Supabase
3. WHEN getSignedUrl() is called, THEN THE function SHALL retrieve the current session token from Supabase
4. WHEN any storage method is called, THEN THE function SHALL include the token in the Authorization header
5. WHEN the API returns a 401 response, THEN THE function SHALL handle the authentication error appropriately

### Requirement 11: Frontend Token Integration - storageApiService.ts

**User Story:** As a developer, I want the storage API service to consistently use authentication tokens, so that all API calls are properly authenticated.

#### Acceptance Criteria

1. THE storageApiService SHALL use the token parameter consistently across all methods
2. WHEN any method is called with a token, THEN THE function SHALL include it in the Authorization header
3. WHEN uploadPaymentReceipt() is called, THEN THE function SHALL include the authentication token
4. WHEN getPresignedUrl() is called, THEN THE function SHALL include the authentication token
5. WHEN confirmUpload() is called, THEN THE function SHALL include the authentication token

### Requirement 12: Error Handling and Logging

**User Story:** As a system administrator, I want all authentication failures to be logged, so that I can monitor security events.

#### Acceptance Criteria

1. WHEN an authentication failure occurs, THEN THE Storage_API SHALL log the failure with timestamp and endpoint
2. WHEN an ownership validation fails, THEN THE Storage_API SHALL log the user ID and attempted file path
3. WHEN a 401 error is returned, THEN THE response SHALL include a clear error message indicating authentication is required
4. WHEN a 403 error is returned, THEN THE response SHALL include a clear error message indicating insufficient permissions
5. THE Storage_API SHALL NOT log sensitive information such as JWT tokens or file contents

### Requirement 13: Performance Requirements

**User Story:** As a user, I want authentication to be fast, so that file operations remain responsive.

#### Acceptance Criteria

1. WHEN authentication is performed, THEN THE authentication overhead SHALL be less than 50 milliseconds
2. WHEN ownership validation is performed, THEN THE validation SHALL complete within 100 milliseconds
3. WHEN multiple files are accessed, THEN THE Storage_API SHALL cache authentication results for the request duration
4. THE Storage_API SHALL NOT impact file upload or download speeds

### Requirement 14: Backward Compatibility

**User Story:** As a developer, I want the authentication changes to be backward compatible, so that existing authenticated clients continue to work.

#### Acceptance Criteria

1. THE Storage_API SHALL use the existing authenticateUser() function from functions/api/shared/auth.ts
2. THE Storage_API SHALL follow the same authentication pattern as the adaptive-session API
3. THE Storage_API SHALL maintain existing API response formats
4. THE Storage_API SHALL NOT change existing endpoint paths or request/response structures
5. WHEN frontend services are updated, THEN THE changes SHALL be synchronized with backend deployment

### Requirement 15: Security Testing

**User Story:** As a security engineer, I want comprehensive security tests, so that I can verify the authentication system works correctly.

#### Acceptance Criteria

1. THE test suite SHALL verify upload with valid token succeeds
2. THE test suite SHALL verify upload with invalid token returns 401
3. THE test suite SHALL verify upload with expired token returns 401
4. THE test suite SHALL verify delete own file succeeds
5. THE test suite SHALL verify delete other user's file returns 403
6. THE test suite SHALL verify payment receipt access for own receipt succeeds
7. THE test suite SHALL verify payment receipt access for other user's receipt returns 403
8. THE test suite SHALL verify public endpoints work without authentication
9. THE test suite SHALL verify missing Authorization header returns 401
10. THE test suite SHALL verify tampered JWT tokens return 401

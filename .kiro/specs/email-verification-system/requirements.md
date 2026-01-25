# Requirements Document: Industrial-Grade Email Verification System

## Introduction

This document outlines the requirements for implementing a comprehensive, industrial-grade email verification system for the Skill Passport platform. The system will ensure that users verify their email addresses before gaining full access to the platform, preventing fake accounts, improving security, and ensuring reliable communication channels. The system will leverage the existing Cloudflare email-api worker and integrate seamlessly with the current authentication flow.

## Glossary

- **System**: The email verification system including frontend UI, backend API, and database components
- **User**: Any person attempting to register on the Skill Passport platform
- **Verification Token**: A cryptographically secure, time-limited token used to verify email ownership
- **Verification Email**: An automated email containing a verification link sent to the user's email address
- **Email API Worker**: The Cloudflare Worker responsible for sending emails via SMTP
- **User API Worker**: The Cloudflare Worker responsible for user authentication and account management
- **Verification Link**: A unique URL containing the verification token that users click to verify their email
- **Token Expiry**: The time period (default 24 hours) after which a verification token becomes invalid
- **Resend Limit**: The maximum number of verification emails that can be sent within a time window
- **Verified User**: A user who has successfully confirmed their email address ownership
- **Unverified User**: A user who has registered but not yet confirmed their email address
- **Rate Limiting**: Mechanism to prevent abuse by limiting verification email requests per user/IP
- **Supabase**: The database and authentication platform used for storing user data

## Requirements

### Requirement 1: Email Verification Token Generation

**User Story:** As a system administrator, I want secure verification tokens to be generated for each signup, so that email ownership can be reliably verified.

#### Acceptance Criteria

1. WHEN a user completes the signup form THEN the System SHALL generate a cryptographically secure verification token using a minimum of 32 bytes of entropy
2. WHEN a verification token is generated THEN the System SHALL store the token hash in the database with the associated user ID and expiration timestamp
3. WHEN storing the verification token THEN the System SHALL set the expiration time to 24 hours from generation
4. WHEN a verification token is created THEN the System SHALL ensure the token is URL-safe and contains no special characters requiring encoding
5. WHEN generating a token THEN the System SHALL verify uniqueness by checking against existing active tokens before storage

### Requirement 2: Verification Email Delivery

**User Story:** As a new user, I want to receive a verification email immediately after signup, so that I can confirm my email address and access the platform.

#### Acceptance Criteria

1. WHEN a user successfully submits the signup form THEN the System SHALL send a verification email within 5 seconds
2. WHEN sending a verification email THEN the System SHALL include a clickable verification link containing the unique token
3. WHEN composing the verification email THEN the System SHALL use a professional HTML template with clear instructions and branding
4. WHEN the verification email is sent THEN the System SHALL include the user's first name for personalization
5. WHEN the email sending fails THEN the System SHALL log the error and mark the user account as requiring email resend
6. WHEN a verification email is sent THEN the System SHALL include a plain text fallback for email clients that do not support HTML

### Requirement 3: Email Verification Link Processing

**User Story:** As a new user, I want to click the verification link in my email and have my account activated, so that I can start using the platform immediately.

#### Acceptance Criteria

1. WHEN a user clicks the verification link THEN the System SHALL extract and validate the token from the URL
2. WHEN processing a verification token THEN the System SHALL verify the token has not expired based on the 24-hour expiration window
3. WHEN a valid token is verified THEN the System SHALL update the user's email_verified status to true in the database
4. WHEN a valid token is verified THEN the System SHALL mark the token as used to prevent reuse
5. WHEN verification succeeds THEN the System SHALL redirect the user to a success page with auto-login capability
6. WHEN an invalid or expired token is submitted THEN the System SHALL display an error message with an option to resend the verification email
7. WHEN a token has already been used THEN the System SHALL inform the user that their email is already verified

### Requirement 4: Verification Email Resend Functionality

**User Story:** As a user who didn't receive the verification email, I want to request a new verification email, so that I can complete my account setup.

#### Acceptance Criteria

1. WHEN a user requests to resend the verification email THEN the System SHALL validate the user's email exists in the database
2. WHEN a resend request is made THEN the System SHALL check if the user's email is already verified and prevent unnecessary sends
3. WHEN generating a new verification email THEN the System SHALL invalidate any previous unused tokens for that user
4. WHEN a resend is requested THEN the System SHALL enforce a rate limit of maximum 3 emails per hour per user
5. WHEN the rate limit is exceeded THEN the System SHALL return an error message indicating the user must wait before requesting another email
6. WHEN a resend succeeds THEN the System SHALL generate a new token with a fresh 24-hour expiration period

### Requirement 5: Unverified User Access Restrictions

**User Story:** As a system administrator, I want to restrict unverified users from accessing certain features, so that we maintain platform security and data quality.

#### Acceptance Criteria

1. WHEN an unverified user attempts to login THEN the System SHALL allow authentication but redirect to an email verification reminder page
2. WHEN an unverified user accesses protected routes THEN the System SHALL display a banner prompting email verification
3. WHEN an unverified user remains unverified for 7 days THEN the System SHALL send a reminder email with a new verification link
4. WHEN an unverified user remains unverified for 30 days THEN the System SHALL mark the account as inactive and require re-registration
5. WHEN checking user verification status THEN the System SHALL query the email_verified field from the auth.users table

### Requirement 6: Verification Status Tracking and Monitoring

**User Story:** As a system administrator, I want to track email verification metrics, so that I can monitor system health and identify issues.

#### Acceptance Criteria

1. WHEN a verification email is sent THEN the System SHALL log the event with timestamp, user ID, and email address
2. WHEN a verification link is clicked THEN the System SHALL log the verification attempt with token, timestamp, and success status
3. WHEN verification fails THEN the System SHALL log the failure reason (expired, invalid, already used)
4. WHEN querying verification metrics THEN the System SHALL provide counts of pending, verified, and failed verifications
5. WHEN monitoring email delivery THEN the System SHALL track email send success and failure rates

### Requirement 7: Security and Anti-Abuse Measures

**User Story:** As a security engineer, I want the verification system to prevent abuse and attacks, so that the platform remains secure and reliable.

#### Acceptance Criteria

1. WHEN generating verification tokens THEN the System SHALL use cryptographically secure random number generation (CSPRNG)
2. WHEN storing tokens THEN the System SHALL hash tokens using SHA-256 before database storage
3. WHEN receiving verification requests THEN the System SHALL implement rate limiting per IP address (10 requests per hour)
4. WHEN detecting suspicious patterns THEN the System SHALL temporarily block IP addresses showing automated behavior
5. WHEN a token is used THEN the System SHALL immediately invalidate it to prevent replay attacks
6. WHEN processing verification links THEN the System SHALL validate the token format before database queries to prevent injection attacks

### Requirement 8: User Experience and Communication

**User Story:** As a new user, I want clear communication about the verification process, so that I understand what to do and why it's necessary.

#### Acceptance Criteria

1. WHEN a user completes signup THEN the System SHALL display a success message explaining that a verification email has been sent
2. WHEN displaying the verification reminder THEN the System SHALL show the email address where the verification was sent
3. WHEN a user cannot find the verification email THEN the System SHALL provide a prominent "Resend Email" button
4. WHEN verification succeeds THEN the System SHALL display a congratulatory message and automatically redirect to the dashboard after 3 seconds
5. WHEN verification fails THEN the System SHALL provide clear error messages with actionable next steps
6. WHEN a user checks their email THEN the System SHALL provide instructions to check spam/junk folders

### Requirement 9: Integration with Existing Authentication Flow

**User Story:** As a developer, I want the verification system to integrate seamlessly with the existing authentication infrastructure, so that implementation is smooth and maintainable.

#### Acceptance Criteria

1. WHEN a user signs up THEN the System SHALL modify the user-api worker to disable auto-confirmation (remove email_confirm: true)
2. WHEN creating an auth user THEN the System SHALL set email_confirmed_at to null until verification is complete
3. WHEN verification succeeds THEN the System SHALL update Supabase auth.users.email_confirmed_at with the current timestamp
4. WHEN a user logs in THEN the System SHALL check the email_verified status and enforce access restrictions accordingly
5. WHEN integrating with existing code THEN the System SHALL maintain backward compatibility with existing user records (mark them as verified)

### Requirement 10: Email Template Design and Branding

**User Story:** As a marketing manager, I want verification emails to be professionally designed and on-brand, so that users have a positive first impression.

#### Acceptance Criteria

1. WHEN generating the verification email THEN the System SHALL use a responsive HTML template that renders correctly on mobile and desktop
2. WHEN composing the email THEN the System SHALL include the Skill Passport logo and brand colors
3. WHEN displaying the verification button THEN the System SHALL use a prominent call-to-action button with high contrast
4. WHEN including text content THEN the System SHALL use clear, friendly language appropriate for the target audience
5. WHEN sending the email THEN the System SHALL include footer information with company details and unsubscribe options where required by law

## Common Correctness Patterns

### Invariants
- A verification token must always have an associated user_id and expiration timestamp
- A user's email_verified status must be false until successful verification
- Once a token is marked as used, it cannot be reused
- Token expiration time must always be in the future at creation time

### Round Trip Properties
- Generating a token and then verifying it with the correct token should succeed
- Hashing a token and comparing with the stored hash should match for valid tokens

### Idempotence
- Verifying an already-verified email should not change the verification status
- Resending a verification email to an already-verified user should be prevented

### Error Conditions
- Expired tokens must be rejected with appropriate error messages
- Invalid token formats must be rejected before database queries
- Rate limit violations must return clear error messages
- Missing or malformed verification requests must be handled gracefully

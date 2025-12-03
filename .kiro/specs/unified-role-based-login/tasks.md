# Implementation Plan

- [ ] 1. Create core authentication services
  - [ ] 1.1 Create AuthService with Supabase integration
    - Implement signIn, signOut, resetPassword, updatePassword methods
    - Handle authentication errors and return standardized results
    - _Requirements: 2.1, 2.4, 7.2, 7.5_
  
  - [ ]* 1.2 Write property test for AuthService
    - **Property 1: Authentication state consistency**
    - **Validates: Requirements 2.1, 2.3**
  
  - [ ] 1.3 Create RoleLookupService for role determination
    - Implement getUserRole method that queries appropriate tables
    - Check students, recruiters, educators, and users tables
    - Return role and user metadata
    - Handle cases where role is not found
    - _Requirements: 2.2, 4.1, 4.2, 4.3, 4.4, 4.5_
  
  - [ ]* 1.4 Write property test for RoleLookupService
    - **Property 2: Role determination completeness**
    - **Validates: Requirements 2.2, 4.1**
  
  - [ ] 1.5 Create RoleBasedRouter utility
    - Implement getRouteForRole method with role-to-route mapping
    - Implement redirectToRoleDashboard method
    - Handle unknown roles with fallback
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_
  
  - [ ]* 1.6 Write property test for RoleBasedRouter
    - **Property 3: Route mapping completeness**
    - **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6**

- [ ] 2. Build UnifiedLogin component
  - [ ] 2.1 Create UnifiedLogin component structure
    - Set up component with TypeScript interfaces
    - Create state management for email, password, loading, error
    - Implement form layout with email and password inputs
    - Add password visibility toggle
    - _Requirements: 1.1, 1.2, 1.3_
  
  - [ ] 2.2 Implement form validation
    - Validate email and password are not empty before submission
    - Display validation errors
    - Clear errors when user modifies inputs
    - _Requirements: 2.5, 8.5_
  
  - [ ]* 2.3 Write property test for input validation
    - **Property 4: Input validation consistency**
    - **Validates: Requirements 2.5**
  
  - [ ] 2.4 Implement authentication flow
    - Call AuthService on form submission
    - Handle loading states during authentication
    - Call RoleLookupService after successful auth
    - Store user data in AuthContext
    - Call RoleBasedRouter to navigate to dashboard
    - _Requirements: 2.1, 2.2, 2.3, 1.5_
  
  - [ ]* 2.5 Write property test for authentication flow
    - **Property 1: Authentication state consistency**
    - **Validates: Requirements 2.1, 2.3**
  
  - [ ] 2.6 Implement error handling
    - Display appropriate error messages for different failure types
    - Ensure error messages don't expose sensitive information
    - Maintain form state on errors
    - _Requirements: 2.4, 8.1, 8.2, 8.3, 8.4_
  
  - [ ]* 2.7 Write property test for error handling
    - **Property 5: Error message clarity**
    - **Validates: Requirements 8.1, 8.2, 8.3, 8.4**

- [ ] 3. Implement responsive UI design
  - [ ] 3.1 Create desktop layout (≥1024px)
    - Two-column layout with illustration and form
    - Modern styling with gradients and shadows
    - Proper spacing and typography
    - _Requirements: 5.3_
  
  - [ ] 3.2 Create tablet layout (768px-1023px)
    - Single column with background illustration
    - Centered form card
    - Adjusted spacing for medium screens
    - _Requirements: 5.2_
  
  - [ ] 3.3 Create mobile layout (320px-767px)
    - Full-width form
    - Minimal padding
    - Stacked elements
    - _Requirements: 5.1_
  
  - [ ]* 3.4 Write property test for responsive layout
    - **Property 7: Responsive layout consistency**
    - **Validates: Requirements 5.1, 5.2, 5.3**
  
  - [ ] 3.5 Implement accessibility features
    - Add proper ARIA labels and roles
    - Ensure keyboard navigation works
    - Verify focus indicators are visible
    - Test with screen readers
    - _Requirements: 5.6_
  
  - [ ]* 3.6 Write property test for accessibility
    - **Property 7: Responsive layout consistency (accessibility subset)**
    - **Validates: Requirements 5.6**

- [ ] 4. Add password reset functionality
  - [ ] 4.1 Create password reset form/modal
    - Add forgot password link to login form
    - Create password reset form component
    - Implement email input for reset
    - _Requirements: 7.1_
  
  - [ ] 4.2 Implement password reset flow
    - Call Supabase Auth resetPasswordForEmail
    - Display confirmation message after sending
    - Handle errors gracefully
    - _Requirements: 7.2, 7.3_
  
  - [ ]* 4.3 Write property test for password reset
    - **Property 8: Password reset flow completeness**
    - **Validates: Requirements 7.2, 7.3**
  
  - [ ] 4.4 Create password update page
    - Create page for users arriving from reset email
    - Implement new password form
    - Call Supabase Auth updateUser
    - Redirect to login after successful update
    - _Requirements: 7.4, 7.5_

- [ ] 5. Update routing and add redirects
  - [ ] 5.1 Add UnifiedLogin route
    - Add route at /login in AppRoutes.jsx
    - Ensure route is in PublicLayout
    - _Requirements: 1.1_
  
  - [ ] 5.2 Add redirect routes for deprecated paths
    - Add redirect from /login/student to /login
    - Add redirect from /login/recruiter to /login
    - Add redirect from /login/educator to /login
    - Add redirect from /login/admin to /login
    - _Requirements: 6.1, 6.2, 6.3, 6.4_
  
  - [ ]* 5.3 Write property test for redirects
    - **Property 6: Redirect preservation**
    - **Validates: Requirements 6.1, 6.2, 6.3, 6.4**
  
  - [ ] 5.4 Add logging for deprecated route usage
    - Log when users access deprecated routes
    - Include timestamp and route path
    - _Requirements: 6.6_

- [ ] 6. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 7. Update internal links and documentation
  - [ ] 7.1 Update navigation links
    - Find all links to /login/student, /login/recruiter, etc.
    - Update to point to /login
    - Test navigation from various pages
    - _Requirements: 6.5_
  
  - [ ] 7.2 Update documentation
    - Update README with new login flow
    - Document role-based routing
    - Add migration guide for developers
    - _Requirements: 6.5_

- [ ] 8. Final integration testing
  - [ ] 8.1 Test complete login flow for each role
    - Test student login and redirect
    - Test recruiter login and redirect
    - Test educator login and redirect
    - Test school admin login and redirect
    - Test college admin login and redirect
    - Test university admin login and redirect
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_
  
  - [ ] 8.2 Test error scenarios
    - Test invalid credentials
    - Test network errors
    - Test unverified email
    - Test account locked
    - Test unknown role
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 3.7_
  
  - [ ] 8.3 Test password reset flow
    - Test forgot password link
    - Test reset email sending
    - Test reset link navigation
    - Test password update
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_
  
  - [ ] 8.4 Test responsive design
    - Test on mobile devices (320px, 375px, 414px)
    - Test on tablets (768px, 1024px)
    - Test on desktop (1280px, 1920px)
    - _Requirements: 5.1, 5.2, 5.3_
  
  - [ ] 8.5 Test accessibility
    - Test keyboard navigation
    - Test with screen reader
    - Verify WCAG 2.1 Level AA compliance
    - _Requirements: 5.6_

- [ ] 9. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

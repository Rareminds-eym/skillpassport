# Design Document

## Overview

The unified role-based login system consolidates multiple role-specific login pages into a single, modern authentication interface. The system authenticates users through Supabase Auth, determines their role from the database, and automatically routes them to the appropriate dashboard. This design leverages existing authentication infrastructure while providing a streamlined user experience.

## Architecture

### High-Level Architecture

```
┌─────────────────┐
│  Unified Login  │
│      Page       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Supabase Auth  │
│  Authentication │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Role Lookup   │
│    Service      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Role-Based     │
│  Router         │
└────────┬────────┘
         │
         ├─────────────┬─────────────┬─────────────┬─────────────┬─────────────┐
         ▼             ▼             ▼             ▼             ▼             ▼
    Student      Recruiter     Educator    School Admin  College Admin  University Admin
   Dashboard     Dashboard     Dashboard     Dashboard     Dashboard       Dashboard
```

### Component Architecture

1. **UnifiedLogin Component**: Single login page with modern UI
2. **AuthService**: Handles Supabase authentication
3. **RoleLookupService**: Determines user role from database
4. **RoleBasedRouter**: Routes users to appropriate dashboards
5. **AuthContext**: Manages authentication state globally

## Components and Interfaces

### 1. UnifiedLogin Component

**Location**: `src/pages/auth/UnifiedLogin.tsx`

**Responsibilities**:
- Render modern login form with email/password inputs
- Handle form validation and submission
- Display loading states and error messages
- Provide password visibility toggle
- Link to password reset functionality

**Props**: None (standalone page)

**State**:
```typescript
interface LoginState {
  email: string;
  password: string;
  showPassword: boolean;
  loading: boolean;
  error: string;
}
```

**Key Methods**:
- `handleSubmit()`: Validates and submits credentials
- `togglePasswordVisibility()`: Shows/hides password
- `clearError()`: Clears error messages on input change

### 2. AuthService

**Location**: `src/services/authService.ts`

**Interface**:
```typescript
interface AuthService {
  signIn(email: string, password: string): Promise<AuthResult>;
  signOut(): Promise<void>;
  resetPassword(email: string): Promise<void>;
  updatePassword(newPassword: string): Promise<void>;
}

interface AuthResult {
  success: boolean;
  user?: User;
  error?: string;
}

interface User {
  id: string;
  email: string;
  role: UserRole;
  metadata?: Record<string, any>;
}

type UserRole = 'student' | 'recruiter' | 'educator' | 'school_admin' | 'college_admin' | 'university_admin';
```

**Responsibilities**:
- Authenticate users via Supabase Auth
- Handle authentication errors
- Manage session tokens
- Provide logout functionality

### 3. RoleLookupService

**Location**: `src/services/roleLookupService.ts`

**Interface**:
```typescript
interface RoleLookupService {
  getUserRole(userId: string, email: string): Promise<RoleLookupResult>;
}

interface RoleLookupResult {
  role: UserRole | null;
  userData: UserData;
  error?: string;
}

interface UserData {
  id: string;
  email: string;
  name?: string;
  school_id?: string;
  university_college_id?: string;
  [key: string]: any;
}
```

**Role Lookup Strategy**:
1. Check `students` table for student role
2. Check `recruiters` table for recruiter role
3. Check `school_educators` or `educators` table for educator role
4. Check `users` table with `role` column for admin roles (school_admin, college_admin, university_admin)

**Responsibilities**:
- Query appropriate database tables based on user
- Determine user role from database records
- Return user metadata for context
- Handle cases where role is not found

### 4. RoleBasedRouter

**Location**: `src/utils/roleBasedRouter.ts`

**Interface**:
```typescript
interface RoleBasedRouter {
  getRouteForRole(role: UserRole): string;
  redirectToRoleDashboard(role: UserRole, navigate: NavigateFunction): void;
}
```

**Route Mapping**:
```typescript
const ROLE_ROUTES: Record<UserRole, string> = {
  student: '/student/dashboard',
  recruiter: '/recruitment/overview',
  educator: '/educator/dashboard',
  school_admin: '/school-admin/dashboard',
  college_admin: '/college-admin/dashboard',
  university_admin: '/university-admin/dashboard',
};
```

**Responsibilities**:
- Map roles to dashboard routes
- Handle navigation after authentication
- Provide fallback for unknown roles

### 5. Route Redirects

**Location**: `src/routes/AppRoutes.jsx`

**Implementation**:
```typescript
// Redirect old login routes to unified login
<Route path="/login/student" element={<Navigate to="/login" replace />} />
<Route path="/login/recruiter" element={<Navigate to="/login" replace />} />
<Route path="/login/educator" element={<Navigate to="/login" replace />} />
<Route path="/login/admin" element={<Navigate to="/login" replace />} />
<Route path="/login" element={<UnifiedLogin />} />
```

## Data Models

### User Authentication Data

```typescript
interface AuthUser {
  id: string;              // Supabase auth user ID
  email: string;
  created_at: string;
  email_confirmed_at?: string;
}
```

### Student Data Model

```typescript
interface Student {
  id: string;
  user_id: string;         // References auth.users
  email: string;
  name?: string;
  school_id?: string;
  university_college_id?: string;
  approval_status?: string;
}
```

### Recruiter Data Model

```typescript
interface Recruiter {
  id: string;
  user_id: string;
  email: string;
  name: string;
  company?: string;
}
```

### Educator Data Model

```typescript
interface Educator {
  id: string;
  user_id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  school_id?: string;
}
```

### Admin Data Model

```typescript
interface Admin {
  id: string;
  user_id: string;
  email: string;
  role: 'school_admin' | 'college_admin' | 'university_admin';
  name?: string;
  institution_id?: string;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Authentication state consistency
*For any* user authentication attempt, if Supabase Auth returns success, then the authentication context should contain the authenticated user data
**Validates: Requirements 2.1, 2.3**

### Property 2: Role determination completeness
*For any* authenticated user, the role lookup service should return exactly one role or null (never multiple roles)
**Validates: Requirements 2.2, 4.1**

### Property 3: Route mapping completeness
*For any* valid user role, the role-based router should return a valid dashboard route
**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6**

### Property 4: Input validation consistency
*For any* form submission with empty email or password, the system should prevent submission and display an error
**Validates: Requirements 2.5**

### Property 5: Error message clarity
*For any* authentication failure, the system should display a user-friendly error message that does not expose sensitive information
**Validates: Requirements 8.1, 8.2, 8.3, 8.4**

### Property 6: Redirect preservation
*For any* navigation to deprecated login routes, the system should redirect to the unified login page
**Validates: Requirements 6.1, 6.2, 6.3, 6.4**

### Property 7: Responsive layout consistency
*For any* viewport width (mobile, tablet, desktop), the login interface should render all required elements and remain functional
**Validates: Requirements 5.1, 5.2, 5.3**

### Property 8: Password reset flow completeness
*For any* valid email submitted for password reset, the system should trigger a Supabase password reset email
**Validates: Requirements 7.2, 7.3**

## Error Handling

### Authentication Errors

1. **Invalid Credentials**
   - Display: "Invalid email or password"
   - Action: Clear password field, keep email
   - Log: Authentication attempt with email (not password)

2. **Network Errors**
   - Display: "Network error. Please try again"
   - Action: Retry button, maintain form state
   - Log: Network error details

3. **Unverified Email**
   - Display: "Please verify your email address"
   - Action: Provide resend verification link
   - Log: Unverified email attempt

4. **Account Locked**
   - Display: "Account locked. Contact support"
   - Action: Provide support contact link
   - Log: Locked account attempt

### Role Lookup Errors

1. **Role Not Found**
   - Display: "Account not properly configured. Contact support"
   - Action: Redirect to error page with support info
   - Log: User ID and email for investigation

2. **Database Query Error**
   - Display: "System error. Please try again"
   - Action: Retry button
   - Log: Full error details for debugging

### Navigation Errors

1. **Unknown Role**
   - Display: "Invalid account type"
   - Action: Redirect to home page
   - Log: User ID and detected role

## Testing Strategy

### Unit Testing

**Framework**: Vitest

**Test Coverage**:

1. **UnifiedLogin Component**
   - Form validation (empty fields, invalid email format)
   - Password visibility toggle
   - Error message display
   - Loading state rendering
   - Form submission handling

2. **AuthService**
   - Successful authentication
   - Failed authentication scenarios
   - Password reset functionality
   - Session management

3. **RoleLookupService**
   - Role detection for each user type
   - Handling missing role data
   - Database query error handling

4. **RoleBasedRouter**
   - Correct route mapping for each role
   - Fallback for unknown roles
   - Navigation function calls

### Property-Based Testing

**Framework**: fast-check (for TypeScript/JavaScript)

**Configuration**: Minimum 100 iterations per property test

**Property Tests**:

1. **Property 1: Authentication state consistency**
   - Generate random valid credentials
   - Mock successful Supabase Auth response
   - Verify auth context contains user data
   - **Feature: unified-role-based-login, Property 1: Authentication state consistency**

2. **Property 2: Role determination completeness**
   - Generate random user IDs
   - Mock database responses with various role configurations
   - Verify exactly one role or null is returned
   - **Feature: unified-role-based-login, Property 2: Role determination completeness**

3. **Property 3: Route mapping completeness**
   - Generate all valid UserRole values
   - Verify each maps to a valid route string
   - Verify route starts with '/'
   - **Feature: unified-role-based-login, Property 3: Route mapping completeness**

4. **Property 4: Input validation consistency**
   - Generate random combinations of empty/non-empty email and password
   - Verify submission is prevented when either is empty
   - Verify error message is displayed
   - **Feature: unified-role-based-login, Property 4: Input validation consistency**

5. **Property 5: Error message clarity**
   - Generate various authentication error types
   - Verify error messages are user-friendly
   - Verify no sensitive data (passwords, tokens) in messages
   - **Feature: unified-role-based-login, Property 5: Error message clarity**

6. **Property 6: Redirect preservation**
   - Generate all deprecated login route paths
   - Verify each redirects to '/login'
   - **Feature: unified-role-based-login, Property 6: Redirect preservation**

7. **Property 7: Responsive layout consistency**
   - Generate random viewport widths (320px to 2560px)
   - Verify all form elements are rendered
   - Verify form remains functional
   - **Feature: unified-role-based-login, Property 7: Responsive layout consistency**

8. **Property 8: Password reset flow completeness**
   - Generate random valid email addresses
   - Mock Supabase password reset call
   - Verify reset email is triggered
   - Verify confirmation message is displayed
   - **Feature: unified-role-based-login, Property 8: Password reset flow completeness**

### Integration Testing

1. **End-to-End Login Flow**
   - Test complete login flow for each role
   - Verify correct dashboard is reached
   - Verify auth context is properly set

2. **Route Redirect Testing**
   - Navigate to each deprecated route
   - Verify redirect to unified login
   - Verify no infinite redirect loops

3. **Error Recovery Testing**
   - Trigger various error scenarios
   - Verify user can recover and retry
   - Verify error messages clear appropriately

### Accessibility Testing

1. **Keyboard Navigation**
   - Tab through all form elements
   - Submit form with Enter key
   - Toggle password visibility with keyboard

2. **Screen Reader Compatibility**
   - Verify all labels are properly associated
   - Verify error messages are announced
   - Verify loading states are announced

3. **WCAG 2.1 Level AA Compliance**
   - Color contrast ratios
   - Focus indicators
   - Error identification

## UI/UX Design

### Design System

**Color Palette**:
- Primary: #3261A5 (Blue)
- Secondary: #3392D0 (Light Blue)
- Error: #ef4444 (Red)
- Success: #10b981 (Green)
- Background: #ffffff (White)
- Text: #1f2937 (Dark Gray)

**Typography**:
- Headings: Inter, Bold, 24-32px
- Body: Inter, Regular, 14-16px
- Labels: Inter, Medium, 14px

**Spacing**:
- Form fields: 24px vertical spacing
- Padding: 32px (desktop), 16px (mobile)
- Border radius: 8px (inputs), 12px (cards)

### Layout Structure

**Desktop (≥1024px)**:
- Two-column layout
- Left: Illustration/branding (50%)
- Right: Login form (50%)
- Max width: 1200px
- Centered on page

**Tablet (768px-1023px)**:
- Single column
- Background illustration with overlay
- Centered form card
- Max width: 500px

**Mobile (320px-767px)**:
- Single column
- Full-width form
- Minimal padding
- Stacked elements

### Form Design

**Input Fields**:
- Height: 48px
- Border: 1px solid #d1d5db
- Focus: 2px solid #3261A5
- Icons: Left-aligned (Mail, Lock)
- Error state: Red border + error message below

**Buttons**:
- Height: 48px
- Full width
- Gradient background
- Loading spinner when processing
- Disabled state: 60% opacity

**Error Messages**:
- Red background (#fef2f2)
- Red border (#fecaca)
- Red text (#dc2626)
- Icon: AlertCircle
- Positioned above form

### Animations

**Loading States**:
- Button text changes to "Signing in..."
- Spinner icon in button
- Form inputs disabled

**Transitions**:
- Input focus: 150ms ease
- Button hover: 200ms ease
- Error message: Fade in 200ms

**Micro-interactions**:
- Password visibility toggle: Instant
- Error message clear: Fade out 150ms on input change

## Implementation Notes

### Migration Strategy

1. **Phase 1: Create Unified Login**
   - Build new UnifiedLogin component
   - Implement AuthService and RoleLookupService
   - Add route at `/login`

2. **Phase 2: Add Redirects**
   - Add redirect routes for deprecated paths
   - Test all redirect scenarios
   - Monitor usage of old routes

3. **Phase 3: Update Links**
   - Update all internal links to use `/login`
   - Update documentation
   - Notify users of change

4. **Phase 4: Deprecation**
   - Add deprecation warnings to old routes
   - Monitor for 30 days
   - Remove old login components

### Security Considerations

1. **Password Handling**
   - Never log passwords
   - Clear password from memory after submission
   - Use HTTPS for all authentication requests

2. **Error Messages**
   - Generic messages for authentication failures
   - No indication of whether email exists
   - Rate limiting on login attempts

3. **Session Management**
   - Use Supabase secure session tokens
   - Implement token refresh
   - Clear session on logout

### Performance Considerations

1. **Code Splitting**
   - Lazy load login page
   - Separate bundle for auth services

2. **Database Queries**
   - Index on user_id columns
   - Optimize role lookup queries
   - Cache role data in auth context

3. **Asset Optimization**
   - Compress illustration images
   - Use WebP format with fallbacks
   - Lazy load non-critical assets

## Dependencies

### Required Packages

- `react`: ^18.0.0
- `react-router-dom`: ^6.0.0
- `@supabase/supabase-js`: ^2.0.0
- `lucide-react`: ^0.263.0 (for icons)
- `framer-motion`: ^10.0.0 (for animations)

### Development Dependencies

- `vitest`: ^1.0.0
- `@testing-library/react`: ^14.0.0
- `@testing-library/user-event`: ^14.0.0
- `fast-check`: ^3.0.0

## Future Enhancements

1. **Multi-Factor Authentication**
   - SMS verification
   - Authenticator app support
   - Backup codes

2. **Social Login**
   - Google OAuth
   - Microsoft OAuth
   - LinkedIn OAuth

3. **Remember Me**
   - Persistent sessions
   - Device management
   - Session history

4. **Login Analytics**
   - Track login success/failure rates
   - Monitor deprecated route usage
   - User behavior analytics

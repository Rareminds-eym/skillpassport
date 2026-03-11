# Design Document: FSD Phase 2 - Auth Feature

## Overview

Phase 2 of the Feature-Sliced Design (FSD) migration focuses on migrating the authentication feature from the flat structure to the `features/auth/` layer. This phase builds upon the completed Phase 1 foundation (shared layer) and establishes the pattern for all subsequent feature migrations.

The auth feature encompasses all authentication-related functionality including login, signup, password reset, OTP verification, session management, and role-based routing. This migration consolidates auth code scattered across `pages/auth/`, `services/`, `context/`, `hooks/`, and `utils/` into a cohesive feature slice.

### Key Design Principles

1. **Copy, Don't Move**: Preserve existing file locations while creating new FSD structure
2. **Public API Pattern**: All auth modules export through index.ts files
3. **Feature Isolation**: Auth feature is self-contained with clear boundaries
4. **Backward Compatibility**: Support both old and new import paths during transition
5. **Consolidation Opportunity**: Merge duplicate auth logic where appropriate
6. **Template for Future**: Establish migration pattern for subsequent features

## Architecture

### FSD Layer Context

Phase 2 creates the first feature in the features/ layer:

```
app/        (Phase 6)
  ↓
pages/      (Phase 5 - will import from features)
  ↓
widgets/    (Phase 5)
  ↓
features/   ← Phase 2: Auth Feature
  ↓
entities/   (Phase 5)
  ↓
shared/     ✅ Phase 1 Complete
```

**Import Rules for Auth Feature:**
- Auth feature CAN import from `shared/` (UI, API, config, utils, hooks)
- Auth feature CANNOT import from other features
- Auth feature CANNOT import from pages, widgets, or app layers
- Pages will import from auth feature via public API

### Phase 2 Scope: Auth Feature

Phase 2 creates the `features/auth/` structure:

```
src/features/auth/
├── ui/              # Auth UI components (13 files)
├── model/           # Auth state management (2 files)
├── api/             # Auth services (5 files)
├── lib/             # Auth utilities (4 files)
└── index.ts         # Public API
```


## Components and Interfaces

### 1. Auth UI Components (`features/auth/ui/`)

**Purpose**: Authentication user interface components for all auth flows

**Source**: `src/pages/auth/*`

**Structure**:
```
features/auth/ui/
├── UnifiedLogin.tsx           # Unified login for all roles
├── UnifiedSignup.tsx          # Unified signup flow
├── LoginAdmin.tsx             # Admin-specific login
├── LoginStudent.tsx           # Student-specific login
├── LoginEducator.tsx          # Educator-specific login
├── LoginRecruiter.tsx         # Recruiter-specific login
├── ForgotPassword.tsx         # Password reset request
├── UnifiedForgotPassword.tsx  # Unified forgot password
├── EducatorForgotPassword.tsx # Educator-specific forgot password
├── PasswordReset.tsx          # Password reset form
├── ResetPassword.tsx          # Reset password handler
├── TokenPasswordReset.tsx     # Token-based password reset
├── DebugRoles.tsx             # Role debugging utility
└── index.ts                   # Public API
```

**Public API** (`features/auth/ui/index.ts`):
```typescript
// Primary auth components
export { UnifiedLogin } from './UnifiedLogin';
export { UnifiedSignup } from './UnifiedSignup';
export { UnifiedForgotPassword } from './UnifiedForgotPassword';
export { PasswordReset } from './PasswordReset';
export { ResetPassword } from './ResetPassword';
export { TokenPasswordReset } from './TokenPasswordReset';

// Role-specific login components
export { LoginAdmin } from './LoginAdmin';
export { LoginStudent } from './LoginStudent';
export { LoginEducator } from './LoginEducator';
export { LoginRecruiter } from './LoginRecruiter';

// Additional components
export { ForgotPassword } from './ForgotPassword';
export { EducatorForgotPassword } from './EducatorForgotPassword';
export { DebugRoles } from './DebugRoles';
```

**Migration Strategy**:
- Copy all 13 files from `pages/auth/` to `features/auth/ui/`
- Convert .jsx files to .tsx for type safety
- Update internal imports to reference `@/shared/ui` for UI components
- Update imports to reference `@/features/auth/api` for auth services
- Update imports to reference `@/features/auth/model` for useAuth hook
- Preserve all component logic, styling, and functionality
- Generate index.ts with alphabetically sorted exports

**Consolidation Opportunities**:
- Consider merging role-specific login components into UnifiedLogin with role prop
- Consolidate forgot password variants into UnifiedForgotPassword
- Extract common auth form patterns into reusable components


### 2. Auth API Services (`features/auth/api/`)

**Purpose**: Authentication API services for all auth operations

**Source**: `src/services/*`

**Structure**:
```
features/auth/api/
├── authService.ts             # Legacy auth service
├── unifiedAuthService.ts      # Unified auth operations
├── adminAuthService.ts        # Admin authentication
├── otpService.ts              # OTP generation and verification
├── passwordResetService.ts    # Password reset flows
└── index.ts                   # Public API
```

**Public API** (`features/auth/api/index.ts`):
```typescript
// Unified auth service (primary)
export { 
  signIn, 
  signOut, 
  signUp,
  resetPassword,
  updatePassword,
  UserRole 
} from './unifiedAuthService';

// Admin auth
export { loginAdmin } from './adminAuthService';

// OTP service
export { 
  sendOTP, 
  verifyOTP,
  generateOTP 
} from './otpService';

// Password reset service
export { 
  sendPasswordResetOTP,
  verifyOTPAndResetPassword,
  resetPasswordWithToken 
} from './passwordResetService';

// Legacy auth service (for backward compatibility)
export { 
  checkAuthentication,
  getUserRole 
} from './authService';
```

**Migration Strategy**:
- Copy authService.js → features/auth/api/authService.ts (convert to TypeScript)
- Copy unifiedAuthService.ts → features/auth/api/unifiedAuthService.ts
- Copy adminAuthService.js → features/auth/api/adminAuthService.ts (convert to TypeScript)
- Copy otpService.ts → features/auth/api/otpService.ts
- Copy passwordResetService.ts → features/auth/api/passwordResetService.ts
- Update all service imports to reference `@/shared/api` for Supabase client
- Preserve all service function signatures and implementations
- Generate index.ts with organized exports by service type

**Consolidation Opportunities**:
- Merge adminAuthService into unifiedAuthService with role parameter
- Consolidate duplicate authentication logic across services
- Standardize error handling patterns

### 3. Auth State Management (`features/auth/model/`)

**Purpose**: Authentication state, context, and hooks

**Source**: `src/context/AuthContext.jsx`, `src/hooks/useAuth.js`

**Structure**:
```
features/auth/model/
├── AuthContext.tsx            # Auth context provider
├── useAuth.ts                 # Auth hook
└── index.ts                   # Public API
```

**Public API** (`features/auth/model/index.ts`):
```typescript
// Auth context
export { AuthProvider, AuthContext } from './AuthContext';

// Auth hook
export { useAuth } from './useAuth';

// Types
export type { AuthState, AuthContextType } from './AuthContext';
```

**AuthContext Structure**:
```typescript
interface AuthState {
  user: User | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  loading: boolean;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string, role: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  refreshSession: () => Promise<void>;
}
```

**Migration Strategy**:
- Copy AuthContext.jsx → features/auth/model/AuthContext.tsx (convert to TypeScript)
- Copy useAuth.js → features/auth/model/useAuth.ts (convert to TypeScript)
- Update AuthContext to import auth services from `@/features/auth/api`
- Update AuthContext to import Supabase client from `@/shared/api`
- Preserve all authentication state logic including session management
- Preserve token refresh logic and monitoring
- Maintain AuthProvider component functionality
- Generate index.ts with context and hook exports

**Key Functionality to Preserve**:
- Session persistence across page refreshes
- Automatic token refresh before expiration
- Role-based authentication state
- Authentication error handling
- Logout cleanup


### 4. Auth Utilities (`features/auth/lib/`)

**Purpose**: Authentication helper functions and utilities

**Source**: `src/utils/*`

**Structure**:
```
features/auth/lib/
├── authCleanup.ts             # Auth cleanup utilities
├── authErrorHandler.ts        # Auth error handling
├── roleBasedRouter.ts         # Role-based routing logic
├── tokenMonitor.ts            # Token monitoring and refresh
└── index.ts                   # Public API
```

**Public API** (`features/auth/lib/index.ts`):
```typescript
// Cleanup utilities
export { 
  cleanupAuthData,
  clearAuthStorage 
} from './authCleanup';

// Error handling
export { 
  handleAuthError,
  getAuthErrorMessage 
} from './authErrorHandler';

// Role-based routing
export { 
  getRoleBasedRoute,
  redirectToRoleDashboard 
} from './roleBasedRouter';

// Token monitoring
export { 
  startTokenMonitor,
  stopTokenMonitor,
  checkTokenExpiration 
} from './tokenMonitor';
```

**Migration Strategy**:
- Copy authCleanup.js → features/auth/lib/authCleanup.ts (convert to TypeScript)
- Copy authErrorHandler.js → features/auth/lib/authErrorHandler.ts (convert to TypeScript)
- Copy roleBasedRouter.ts → features/auth/lib/roleBasedRouter.ts
- Copy tokenMonitor.ts → features/auth/lib/tokenMonitor.ts
- Preserve all utility function implementations
- Update imports to reference new structure
- Generate index.ts with utility exports

**Key Utilities**:

**authCleanup.ts**:
- Clear authentication data from storage
- Reset auth state
- Cleanup on logout

**authErrorHandler.ts**:
- Handle authentication errors
- Format error messages for users
- Log auth errors for debugging

**roleBasedRouter.ts**:
- Determine dashboard route based on user role
- Handle role-based redirects
- Support multiple admin types

**tokenMonitor.ts**:
- Monitor token expiration
- Trigger automatic token refresh
- Handle refresh failures

### 5. Auth Feature Public API (`features/auth/index.ts`)

**Purpose**: Centralized export point for auth feature

**Structure**:
```typescript
// UI Components (primary auth flows)
export { 
  UnifiedLogin,
  UnifiedSignup,
  UnifiedForgotPassword,
  PasswordReset,
  ResetPassword 
} from './ui';

// State Management
export { 
  AuthProvider,
  useAuth,
  type AuthState,
  type AuthContextType 
} from './model';

// API Services (commonly used)
export { 
  signIn,
  signOut,
  signUp,
  resetPassword,
  sendOTP,
  verifyOTP 
} from './api';

// Utilities (commonly used)
export { 
  handleAuthError,
  getRoleBasedRoute 
} from './lib';

// Types
export { UserRole } from './api';
```

**Design Principles**:
- Export only commonly used functionality at top level
- Keep internal implementation details private
- Use named exports for clarity
- Organize exports by category (UI, model, api, lib)
- Export types for TypeScript consumers

**Internal vs Public**:
- **Public**: UnifiedLogin, UnifiedSignup, useAuth, signIn, signOut
- **Internal**: Role-specific login components, debug utilities, token monitor internals
- **Accessible via subpath**: `@/features/auth/ui/LoginAdmin` for role-specific components


## Data Models

### File Migration Mapping

Complete mapping of source files to destination locations:

#### UI Components (13 files)
```
pages/auth/UnifiedLogin.tsx          → features/auth/ui/UnifiedLogin.tsx
pages/auth/UnifiedSignup.tsx         → features/auth/ui/UnifiedSignup.tsx
pages/auth/LoginAdmin.jsx            → features/auth/ui/LoginAdmin.tsx
pages/auth/LoginStudent.jsx          → features/auth/ui/LoginStudent.tsx
pages/auth/LoginEducator.tsx         → features/auth/ui/LoginEducator.tsx
pages/auth/LoginRecruiter.jsx        → features/auth/ui/LoginRecruiter.tsx
pages/auth/ForgotPassword.tsx        → features/auth/ui/ForgotPassword.tsx
pages/auth/UnifiedForgotPassword.tsx → features/auth/ui/UnifiedForgotPassword.tsx
pages/auth/EducatorForgotPassword.tsx → features/auth/ui/EducatorForgotPassword.tsx
pages/auth/PasswordReset.tsx         → features/auth/ui/PasswordReset.tsx
pages/auth/ResetPassword.tsx         → features/auth/ui/ResetPassword.tsx
pages/auth/TokenPasswordReset.tsx    → features/auth/ui/TokenPasswordReset.tsx
pages/auth/DebugRoles.tsx            → features/auth/ui/DebugRoles.tsx
```

#### API Services (5 files)
```
services/authService.js              → features/auth/api/authService.ts
services/unifiedAuthService.ts       → features/auth/api/unifiedAuthService.ts
services/adminAuthService.js         → features/auth/api/adminAuthService.ts
services/otpService.ts               → features/auth/api/otpService.ts
services/passwordResetService.ts     → features/auth/api/passwordResetService.ts
```

#### State Management (2 files)
```
context/AuthContext.jsx              → features/auth/model/AuthContext.tsx
hooks/useAuth.js                     → features/auth/model/useAuth.ts
```

#### Utilities (4 files)
```
utils/authCleanup.js                 → features/auth/lib/authCleanup.ts
utils/authErrorHandler.js            → features/auth/lib/authErrorHandler.ts
utils/roleBasedRouter.ts             → features/auth/lib/roleBasedRouter.ts
utils/tokenMonitor.ts                → features/auth/lib/tokenMonitor.ts
```

#### Index Files (5 files to create)
```
features/auth/ui/index.ts            → New file (exports all UI components)
features/auth/api/index.ts           → New file (exports all services)
features/auth/model/index.ts         → New file (exports context and hook)
features/auth/lib/index.ts           → New file (exports all utilities)
features/auth/index.ts               → New file (public API)
```

**Total Files**: 24 files migrated + 5 index files created = 29 files

### Import Path Transformation

The migration system must update import statements across the codebase:

#### UI Component Imports
```typescript
// Before
import UnifiedLogin from '@/pages/auth/UnifiedLogin';
import { UnifiedSignup } from '../pages/auth/UnifiedSignup';
import LoginAdmin from '@/pages/auth/LoginAdmin';

// After
import { UnifiedLogin, UnifiedSignup, LoginAdmin } from '@/features/auth';
// Or for direct access
import { UnifiedLogin } from '@/features/auth/ui';
```

#### Auth Service Imports
```typescript
// Before
import { signIn, signOut } from '@/services/unifiedAuthService';
import { loginAdmin } from '@/services/adminAuthService';
import { sendOTP, verifyOTP } from '@/services/otpService';
import { checkAuthentication } from '../services/authService';

// After
import { signIn, signOut, loginAdmin, sendOTP, verifyOTP } from '@/features/auth';
// Or for direct access
import { signIn, signOut } from '@/features/auth/api';
```

#### Auth Context and Hook Imports
```typescript
// Before
import { AuthProvider, AuthContext } from '@/context/AuthContext';
import { useAuth } from '@/hooks/useAuth';
import { useAuth } from '../hooks/useAuth';

// After
import { AuthProvider, useAuth } from '@/features/auth';
// Or for direct access
import { AuthProvider, useAuth } from '@/features/auth/model';
```

#### Auth Utility Imports
```typescript
// Before
import { handleAuthError } from '@/utils/authErrorHandler';
import { getRoleBasedRoute } from '@/utils/roleBasedRouter';
import { cleanupAuthData } from '../utils/authCleanup';

// After
import { handleAuthError, getRoleBasedRoute } from '@/features/auth';
// Or for direct access
import { handleAuthError } from '@/features/auth/lib';
```

### Import Path Patterns

The migration system must handle various import patterns:

1. **Absolute imports with @/ alias**: `@/pages/auth/UnifiedLogin`
2. **Relative imports**: `../pages/auth/UnifiedLogin`, `../../services/unifiedAuthService`
3. **Direct file imports**: `@/pages/auth/UnifiedLogin.tsx`
4. **Default imports**: `import UnifiedLogin from '@/pages/auth/UnifiedLogin'`
5. **Named imports**: `import { signIn } from '@/services/unifiedAuthService'`
6. **Namespace imports**: `import * as authService from '@/services/authService'`

**Transformation Strategy**:
- Use AST parsing to identify import statements
- Match import paths against migration mapping
- Replace with public API imports (via index.ts)
- Preserve import style (named, default, namespace)
- Update both .ts, .tsx, .js, and .jsx files
- Handle dynamic imports: `const UnifiedLogin = lazy(() => import('@/pages/auth/UnifiedLogin'))`


## Migration Implementation Strategy

### Phase 2 Execution Steps

The migration follows a sequential process to minimize risk:

**Step 1: Create Auth Feature Structure**
```bash
mkdir -p src/features/auth/ui
mkdir -p src/features/auth/api
mkdir -p src/features/auth/model
mkdir -p src/features/auth/lib
```

**Step 2: Migrate Auth UI Components**
- Copy all 13 files from `src/pages/auth/` to `src/features/auth/ui/`
- Convert .jsx files to .tsx for type safety
- Update internal imports within UI components
- Generate `src/features/auth/ui/index.ts` with named exports
- Verify no internal import issues within UI components

**Step 3: Migrate Auth API Services**
- Copy authService.js → features/auth/api/authService.ts (convert to TypeScript)
- Copy unifiedAuthService.ts → features/auth/api/unifiedAuthService.ts
- Copy adminAuthService.js → features/auth/api/adminAuthService.ts (convert to TypeScript)
- Copy otpService.ts → features/auth/api/otpService.ts
- Copy passwordResetService.ts → features/auth/api/passwordResetService.ts
- Update service imports to reference `@/shared/api` for Supabase client
- Create `src/features/auth/api/index.ts` with exports
- Verify services compile without errors

**Step 4: Migrate Auth State Management**
- Copy AuthContext.jsx → features/auth/model/AuthContext.tsx (convert to TypeScript)
- Copy useAuth.js → features/auth/model/useAuth.ts (convert to TypeScript)
- Update AuthContext to import from `@/features/auth/api`
- Update AuthContext to import from `@/shared/api`
- Create `src/features/auth/model/index.ts` with exports
- Verify context and hook compile without errors

**Step 5: Migrate Auth Utilities**
- Copy authCleanup.js → features/auth/lib/authCleanup.ts (convert to TypeScript)
- Copy authErrorHandler.js → features/auth/lib/authErrorHandler.ts (convert to TypeScript)
- Copy roleBasedRouter.ts → features/auth/lib/roleBasedRouter.ts
- Copy tokenMonitor.ts → features/auth/lib/tokenMonitor.ts
- Update utility imports to reference new structure
- Create `src/features/auth/lib/index.ts` with exports
- Verify utilities compile without errors

**Step 6: Create Auth Feature Public API**
- Create `src/features/auth/index.ts`
- Export commonly used UI components
- Export AuthProvider and useAuth
- Export commonly used auth services
- Export commonly used utilities
- Export types (UserRole, AuthState, etc.)

**Step 7: Update Import Paths Across Codebase**
- Scan entire codebase for imports from migrated locations
- Update UI component imports to `@/features/auth` or `@/features/auth/ui`
- Update auth service imports to `@/features/auth` or `@/features/auth/api`
- Update AuthContext/useAuth imports to `@/features/auth` or `@/features/auth/model`
- Update auth utility imports to `@/features/auth` or `@/features/auth/lib`
- Use public API imports where possible
- Verify no broken imports

**Step 8: Validation**
- Run TypeScript compiler: `npm run type-check`
- Run build process: `npm run build`
- Run test suite: `npm run test`
- Manual testing of all auth flows:
  - Student login
  - Educator login
  - Recruiter login
  - Admin login
  - Signup flow
  - Password reset flow
  - OTP verification
  - Session persistence
  - Token refresh
  - Role-based routing
- Check for console errors in development

**Step 9: Documentation**
- Generate migration report with file counts
- Document any deviations from plan
- Document consolidation decisions
- Update developer documentation

### Backward Compatibility Strategy

To ensure zero downtime and safe rollback:

1. **Preserve Original Files**: Keep all files in original locations
2. **Dual Import Support**: Both old and new import paths work
3. **Gradual Adoption**: Teams can adopt new paths incrementally
4. **Deprecation Period**: Announce timeline for removing old structure
5. **Monitoring**: Track usage of old vs. new import paths

**Implementation**:
- Original files remain untouched
- New files are copies, not moves
- No breaking changes in Phase 2
- Old structure removal planned for Phase 6 (after all features migrated)

### Rollback Plan

If critical issues arise:

1. **Git Revert**: Revert the migration commit
2. **Feature Flag**: Toggle between old/new structure (if implemented)
3. **Selective Rollback**: Keep new structure but revert import updates
4. **Hotfix**: Fix specific issues while keeping migration

**Rollback Triggers**:
- Build failures that cannot be quickly resolved
- Critical runtime errors in production
- Auth flows broken (login, signup, password reset)
- Test suite failures exceeding 5% of tests
- Performance degradation > 10%


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After analyzing all acceptance criteria, several properties can be consolidated to eliminate redundancy:

**File Content Preservation**: Requirements 2.13, 3.8, 4.4, 5.5 all specify that file content should be preserved during migration. These can be combined into a single comprehensive property.

**Public API Accessibility**: Requirements 2.12, 3.7, 4.3, 5.4, 6.1-6.8 all specify that migrated modules should be accessible via public APIs. These can be combined into a single property.

**Import Path Updates**: Requirements 7.1-7.10 all specify updating import paths for different module types. These can be combined into a single property with the migration mapping as input.

**Auth Flow Preservation**: Requirements 8-13 all relate to maintaining authentication functionality. These can be combined into properties validating each auth flow.

**Backward Compatibility**: Requirements 17.1-17.7 all relate to maintaining both old and new file locations. These can be combined into a single property.

### Property 1: File Copy Preserves Content

*For any* file in the auth migration mapping (UI components, services, context, hooks, utilities), when the migration system copies it from source to destination, the destination file content SHALL be identical to the source file content (excluding TypeScript conversions).

**Validates: Requirements 2.13, 3.8, 4.4, 5.5**

### Property 2: Public API Exports All Auth Modules

*For any* auth subdirectory (ui, api, model, lib), when the migration completes, all migrated modules in that subdirectory SHALL be exported through the index.ts public API.

**Validates: Requirements 2.12, 3.7, 4.3, 5.4, 6.1-6.8**

### Property 3: Import Path Transformation

*For any* import statement in the codebase that references a migrated auth module, the migration system SHALL update the import path to reference the new features/auth/ location using the public API path.

**Validates: Requirements 7.1-7.10**

### Property 4: Login Flow Preserved

*For any* user role (student, educator, recruiter, admin), when a user provides valid credentials, the auth feature SHALL authenticate the user and redirect to the appropriate role-based dashboard.

**Validates: Requirements 8.1-8.10**

### Property 5: Signup Flow Preserved

*For any* user role, when a user provides valid signup information and completes OTP verification (if required), the auth feature SHALL create an account and authenticate the user.

**Validates: Requirements 9.1-9.9**

### Property 6: Password Reset Flow Preserved

*For any* user, when a user requests a password reset, provides a valid OTP, and sets a new password, the auth feature SHALL update the password and allow login with the new credentials.

**Validates: Requirements 10.1-10.9**

### Property 7: OTP Functionality Preserved

*For any* OTP request, when an OTP is generated and sent, the OTP service SHALL allow verification within the expiration period and reject expired or invalid OTPs.

**Validates: Requirements 11.1-11.8**

### Property 8: Session Management Preserved

*For any* authenticated user, when the access token expires, the session management SHALL automatically refresh it using the refresh token without requiring re-login.

**Validates: Requirements 12.1-12.9**

### Property 9: Role-Based Routing Preserved

*For any* user role, when a user logs in, the auth feature SHALL redirect to the correct role-specific dashboard based on the user's role.

**Validates: Requirements 13.1-13.8**

### Property 10: Backward Compatibility Maintained

*For any* file that is migrated to features/auth/, both the original file location and the new file location SHALL exist after migration, allowing imports from either path to resolve successfully.

**Validates: Requirements 17.1-17.7**

### Property 11: TypeScript Compilation Succeeds

*For all* migrated auth files, when the migration completes, the TypeScript compiler SHALL compile without errors and resolve all import paths correctly.

**Validates: Requirements 14.1-14.7**

### Property 12: All Auth Tests Pass

*For all* auth-related tests, when the migration completes, the test suite SHALL execute without errors and pass all existing test cases.

**Validates: Requirements 15.1-15.9**


## Error Handling

### Migration Errors

**File Copy Failures**:
- **Cause**: Permission issues, disk space, file locks
- **Handling**: Log error with file path, skip file, continue migration, report at end
- **Recovery**: Manual file copy or re-run migration for failed files

**TypeScript Conversion Failures**:
- **Cause**: Complex JavaScript patterns, type inference issues
- **Handling**: Log warning, keep as .js file, continue migration
- **Recovery**: Manual TypeScript conversion after migration

**Import Update Failures**:
- **Cause**: Complex import patterns, dynamic imports, non-standard syntax
- **Handling**: Log warning with file path and import statement, skip update, continue
- **Recovery**: Manual import update with developer review

**Index Generation Failures**:
- **Cause**: Circular dependencies, invalid module exports
- **Handling**: Log error with directory path, create partial index.ts, continue
- **Recovery**: Manual index.ts completion

**Build Failures**:
- **Cause**: Broken imports, type errors, missing dependencies
- **Handling**: Stop migration, display build errors, provide rollback option
- **Recovery**: Fix errors or rollback migration

**Test Failures**:
- **Cause**: Broken imports in tests, changed module paths
- **Handling**: Display failing tests, provide import update suggestions
- **Recovery**: Update test imports or rollback migration

### Validation Errors

**Missing Files**:
- **Detection**: Compare expected vs. actual migrated files
- **Handling**: Report missing files with source paths
- **Recovery**: Re-run migration or manual file copy

**Broken Imports**:
- **Detection**: TypeScript compiler errors, build failures
- **Handling**: List all unresolved imports with file locations
- **Recovery**: Update imports or add missing files

**Auth Flow Errors**:
- **Detection**: Manual testing, automated tests
- **Handling**: Log errors with flow name and error details
- **Recovery**: Fix auth logic or rollback migration

**Runtime Errors**:
- **Detection**: Application startup, page navigation, console errors
- **Handling**: Log errors with stack traces, identify affected modules
- **Recovery**: Fix module exports or rollback migration

### Rollback Procedures

**Git-Based Rollback**:
```bash
# Revert migration commit
git revert <migration-commit-hash>

# Or reset to pre-migration state
git reset --hard <pre-migration-commit-hash>
```

**Selective Rollback**:
- Keep new features/auth/ structure
- Revert import path updates
- Allow gradual re-migration

**Partial Rollback**:
- Rollback specific subdirectories (e.g., features/auth/ui only)
- Keep other migrations intact
- Useful for isolating issues

## Testing Strategy

### Dual Testing Approach

The migration requires both unit tests and property-based tests to ensure correctness:

**Unit Tests**: Verify specific examples, edge cases, and concrete scenarios
**Property Tests**: Verify universal properties across all inputs with randomization

Both approaches are complementary and necessary for comprehensive coverage. Unit tests catch concrete bugs in specific scenarios, while property tests verify general correctness across many inputs.

### Property-Based Testing

**Library**: fast-check (for TypeScript/JavaScript)

**Configuration**:
- Minimum 100 iterations per property test
- Each test tagged with feature name and property reference
- Tag format: `Feature: fsd-phase-2-auth-feature, Property {number}: {property_text}`

**Property Test Examples**:

```typescript
import fc from 'fast-check';

describe('Feature: fsd-phase-2-auth-feature, Property 1: File Copy Preserves Content', () => {
  it('should preserve file content when copying auth files', () => {
    fc.assert(
      fc.property(
        fc.record({
          filename: fc.constantFrom(
            'UnifiedLogin.tsx',
            'authService.js',
            'AuthContext.jsx',
            'authCleanup.js'
          ),
          content: fc.string(),
        }),
        ({ filename, content }) => {
          // Setup: Create source file with content
          const sourcePath = getSourcePath(filename);
          const destPath = getDestinationPath(filename);
          
          writeFile(sourcePath, content);
          
          // Execute: Run migration
          migrationSystem.copyFile(sourcePath, destPath);
          
          // Verify: Destination content matches source
          const destContent = readFile(destPath);
          expect(destContent).toBe(content);
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Feature: fsd-phase-2-auth-feature, Property 3: Import Path Transformation', () => {
  it('should update all auth import paths to reference features/auth/', () => {
    fc.assert(
      fc.property(
        fc.record({
          importPath: fc.constantFrom(
            '@/pages/auth/UnifiedLogin',
            '@/services/unifiedAuthService',
            '@/context/AuthContext',
            '@/hooks/useAuth',
            '@/utils/authErrorHandler'
          ),
          fileContent: fc.string(),
        }),
        ({ importPath, fileContent }) => {
          // Setup: Create file with old import
          const testFile = `import { Something } from '${importPath}';\n${fileContent}`;
          
          // Execute: Update imports
          const updated = migrationSystem.updateImports(testFile);
          
          // Verify: Import path updated to features/auth/
          expect(updated).toContain('@/features/auth');
          expect(updated).not.toContain(importPath);
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Feature: fsd-phase-2-auth-feature, Property 4: Login Flow Preserved', () => {
  it('should authenticate users and redirect to role-based dashboard', () => {
    fc.assert(
      fc.property(
        fc.record({
          email: fc.emailAddress(),
          password: fc.string({ minLength: 8 }),
          role: fc.constantFrom('student', 'educator', 'recruiter', 'admin'),
        }),
        async ({ email, password, role }) => {
          // Setup: Create user with role
          await createTestUser(email, password, role);
          
          // Execute: Login
          const result = await signIn(email, password, role);
          
          // Verify: Authentication successful and correct redirect
          expect(result.success).toBe(true);
          expect(result.redirectUrl).toContain(`/${role}/dashboard`);
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Feature: fsd-phase-2-auth-feature, Property 10: Backward Compatibility Maintained', () => {
  it('should maintain both old and new file locations after migration', () => {
    fc.assert(
      fc.property(
        fc.record({
          filename: fc.constantFrom(
            'UnifiedLogin.tsx',
            'authService.js',
            'AuthContext.jsx'
          ),
        }),
        ({ filename }) => {
          // Setup: Create source file
          const sourcePath = getSourcePath(filename);
          const destPath = getDestinationPath(filename);
          
          writeFile(sourcePath, 'test content');
          
          // Execute: Run migration
          migrationSystem.copyFile(sourcePath, destPath);
          
          // Verify: Both locations exist
          expect(fileExists(sourcePath)).toBe(true);
          expect(fileExists(destPath)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Unit Testing

**Focus Areas**:
- Specific directory creation (Requirements 1.1-1.6)
- Specific file migrations (UnifiedLogin, authService, AuthContext)
- Build success after migration
- Test suite passing after migration
- Application startup without errors
- Specific auth flows (student login, educator login, etc.)
- Password reset with OTP
- Session persistence
- Token refresh
- Role-based routing
- Rollback functionality
- Documentation generation

**Unit Test Examples**:

```typescript
describe('Auth Feature Structure Creation', () => {
  it('should create features/auth/ui/ directory', () => {
    migrationSystem.createStructure();
    expect(fs.existsSync('src/features/auth/ui')).toBe(true);
  });

  it('should create features/auth/api/ directory', () => {
    migrationSystem.createStructure();
    expect(fs.existsSync('src/features/auth/api')).toBe(true);
  });

  it('should create all required auth subdirectories', () => {
    migrationSystem.createStructure();
    
    const requiredDirs = [
      'src/features/auth',
      'src/features/auth/ui',
      'src/features/auth/api',
      'src/features/auth/model',
      'src/features/auth/lib',
    ];
    
    requiredDirs.forEach(dir => {
      expect(fs.existsSync(dir)).toBe(true);
    });
  });
});

describe('Auth UI Component Migration', () => {
  it('should copy UnifiedLogin.tsx to features/auth/ui/', () => {
    migrationSystem.migrateAuthUI();
    
    expect(fs.existsSync('src/features/auth/ui/UnifiedLogin.tsx')).toBe(true);
  });

  it('should create index.ts in features/auth/ui/ with component exports', () => {
    migrationSystem.migrateAuthUI();
    
    const indexContent = fs.readFileSync('src/features/auth/ui/index.ts', 'utf-8');
    expect(indexContent).toContain("export { UnifiedLogin");
    expect(indexContent).toContain("export { UnifiedSignup");
  });
});

describe('Auth Service Migration', () => {
  it('should copy unifiedAuthService.ts to features/auth/api/', () => {
    migrationSystem.migrateAuthServices();
    
    expect(fs.existsSync('src/features/auth/api/unifiedAuthService.ts')).toBe(true);
  });

  it('should create index.ts in features/auth/api/ with service exports', () => {
    migrationSystem.migrateAuthServices();
    
    const indexContent = fs.readFileSync('src/features/auth/api/index.ts', 'utf-8');
    expect(indexContent).toContain("export { signIn");
    expect(indexContent).toContain("export { signOut");
  });
});

describe('Auth Context Migration', () => {
  it('should copy AuthContext.jsx to features/auth/model/AuthContext.tsx', () => {
    migrationSystem.migrateAuthModel();
    
    expect(fs.existsSync('src/features/auth/model/AuthContext.tsx')).toBe(true);
  });

  it('should copy useAuth.js to features/auth/model/useAuth.ts', () => {
    migrationSystem.migrateAuthModel();
    
    expect(fs.existsSync('src/features/auth/model/useAuth.ts')).toBe(true);
  });
});

describe('Build Validation', () => {
  it('should compile without TypeScript errors after migration', () => {
    migrationSystem.runFullMigration();
    
    const result = execSync('npm run type-check', { encoding: 'utf-8' });
    expect(result).not.toContain('error TS');
  });

  it('should build successfully after migration', () => {
    migrationSystem.runFullMigration();
    
    const result = execSync('npm run build', { encoding: 'utf-8' });
    expect(result).toContain('Build completed');
  });
});

describe('Auth Flow Validation', () => {
  it('should allow student login with valid credentials', async () => {
    const result = await signIn('student@test.com', 'password123', 'student');
    
    expect(result.success).toBe(true);
    expect(result.user.role).toBe('student');
    expect(result.redirectUrl).toBe('/student/dashboard');
  });

  it('should allow password reset with OTP', async () => {
    await sendPasswordResetOTP('user@test.com');
    const result = await verifyOTPAndResetPassword('user@test.com', '123456', 'newPassword123');
    
    expect(result.success).toBe(true);
  });

  it('should refresh session token automatically', async () => {
    // Setup: Login and get tokens
    await signIn('user@test.com', 'password123', 'student');
    
    // Fast-forward time to token expiration
    jest.advanceTimersByTime(3600000); // 1 hour
    
    // Verify: Token refreshed automatically
    const session = await checkAuth();
    expect(session.isAuthenticated).toBe(true);
  });
});
```

---

## Conclusion

Phase 2 of the FSD migration establishes the auth feature as the first complete feature slice, demonstrating the full FSD pattern (ui, model, api, lib) with proper public APIs and import path updates. This migration serves as the template for all subsequent feature migrations in Phases 3-4.

The auth feature migration consolidates 24 files from scattered locations into a cohesive, self-contained feature with clear boundaries and dependencies. All authentication functionality is preserved with zero downtime and full backward compatibility.

---

**Design Document Status**: Complete  
**Next Step**: Create implementation tasks (tasks.md)  
**Phase**: 2 of 6 (Auth Feature)

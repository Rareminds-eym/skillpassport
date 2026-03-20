# Design Document: FSD Phase 4 - Critical Cleanup & Context Migration

## Overview

FSD Phase 4 completes the critical Context API → Zustand migration by eliminating the final 2 files importing from `@/context/AuthContext`. This phase focuses on the CoursePlayer and Dashboard components, which represent the last blockers preventing Phase 5 (service API migration) from proceeding.

The migration follows established patterns from the 95% completed Zustand migration, replacing monolithic `useAuth()` calls with granular Zustand hooks for better performance and consistency. This phase maintains zero breaking changes while establishing a solid foundation for subsequent migration phases.

### Key Objectives

1. **Complete Context API Elimination**: Remove all remaining `@/context/` imports
2. **Standardize Authentication Patterns**: Replace `useAuth()` with granular Zustand hooks
3. **Maintain Zero Breaking Changes**: Preserve all existing functionality
4. **Enable Phase 5**: Remove blockers for service API migration
5. **Follow Incremental Strategy**: Execute in prioritized sub-phases

## Architecture

### Migration Architecture

The migration follows a proven transformation pattern established in the existing 95% completed Zustand migration:

```
Context API Pattern (Legacy)          →    Zustand Pattern (Target)
─────────────────────────────────────      ──────────────────────────────
import { useAuth } from '@/context/'   →    import { useUser, useUserRole } from '@/stores'
const { user, role } = useAuth();      →    const user = useUser();
                                           const { role } = useUserRole();
```

### Store Architecture

The existing Zustand store architecture provides granular hooks that replace the monolithic Context API:

**Authentication Store Hooks:**
- `useUser()` - User data only
- `useUserRole()` - Role information with computed properties
- `useIsAuthenticated()` - Authentication status
- `useAuthLoading()` - Loading states
- `useAuthActions()` - Authentication actions (login, logout)

**Performance Benefits:**
- Components re-render only when their specific state slice changes
- Eliminates unnecessary re-renders from monolithic context updates
- Better React DevTools debugging experience

### Component Analysis

#### CoursePlayer.jsx Analysis
- **Current State**: Uses `const { user } = useAuth();` for role-based navigation
- **Usage Pattern**: Accesses `user?.role` for back navigation path determination
- **Migration Target**: Replace with `useUser()` and `useUserRole()` hooks
- **Risk Level**: Low (single usage pattern, well-defined scope)

#### Dashboard.jsx Analysis  
- **Current State**: Partially migrated - uses `useUser()` but retains Context import
- **Usage Pattern**: Already using Zustand `useUser()` hook correctly
- **Migration Target**: Remove unused Context API import
- **Risk Level**: Very Low (import cleanup only)

## Components and Interfaces

### Hook Mapping Strategy

The migration uses established hook mappings from the Zustand Migration Guide:

| Context Pattern | Zustand Replacement | Use Case |
|----------------|-------------------|----------|
| `const { user } = useAuth()` | `const user = useUser()` | User data access |
| `const { role } = useAuth()` | `const { role } = useUserRole()` | Role-based logic |
| `const { isAuthenticated } = useAuth()` | `const isAuthenticated = useIsAuthenticated()` | Auth status |
| `const { loading } = useAuth()` | `const loading = useAuthLoading()` | Loading states |
| `const { logout } = useAuth()` | `const { logout } = useAuthActions()` | Auth actions |

### Import Transformation Patterns

**Before (Context API):**
```javascript
import { useAuth } from '@/context/AuthContext';
```

**After (Zustand):**
```javascript
import { useUser, useUserRole } from '@/stores';
```

### Component-Specific Transformations

#### CoursePlayer.jsx Transformation
```javascript
// Before
import { useAuth } from '@/context/AuthContext';
const { user } = useAuth();

// After  
import { useUser } from '@/stores';
const user = useUser();
```

#### Dashboard.jsx Transformation
```javascript
// Before
import { useAuth } from '@/context/AuthContext';
import { useUser } from '../../../stores';

// After
import { useUser } from '../../../stores';
```

## Data Models

### User Data Model
The existing Zustand stores maintain the same data models as the Context API:

```typescript
interface User {
  id: string;
  email: string;
  name?: string;
  role: 'student' | 'educator' | 'school_admin' | 'college_admin' | 'university_admin';
  // ... other user properties
}

interface UserRole {
  role: string;
  isStudent: boolean;
  isEducator: boolean;
  isAdmin: boolean;
  // ... computed role properties
}
```

### State Persistence
- User authentication state persists across browser sessions
- Role-based navigation preferences maintained
- No changes to existing persistence mechanisms

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Context API Import Elimination

*For any* file in the codebase after migration, scanning for Context API imports should return zero results

**Validates: Requirements 1.1, 6.1**

### Property 2: Hook Usage Pattern Consistency

*For any* component that needs user data, authentication status, or role information, it should use the appropriate granular Zustand hook instead of the monolithic useAuth() pattern

**Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6**

### Property 3: Authentication Flow Preservation

*For any* authentication flow (login, signup, password reset, OTP), the behavior after migration should be identical to the behavior before migration

**Validates: Requirements 1.4, 2.7, 5.3**

### Property 4: Component Behavior Preservation

*For any* migrated component, running the same test suite before and after migration should produce identical results

**Validates: Requirements 1.5, 5.1, 5.2**

### Property 5: Import Path Transformation

*For any* file that imports subscription components, the import path should use the FSD structure (@/features/subscription/ui/) instead of legacy paths (@/components/Subscription/)

**Validates: Requirements 4.1, 4.3, 4.4**

### Property 6: Functionality Preservation Across Features

*For any* feature (subscription, theme, search, portfolio, tour), all functionality should work identically before and after migration

**Validates: Requirements 3.5, 4.2, 4.5, 5.4, 5.5, 5.6, 5.7, 5.8**

### Property 7: State Persistence Maintenance

*For any* persistent state (theme preferences, portfolio settings), the state should be preserved across browser sessions after migration

**Validates: Requirements 3.6**

### Property 8: FSD Structure Compliance

*For any* component after migration, import statements should follow FSD structure patterns where applicable

**Validates: Requirements 6.2**

### Property 9: Test Execution During Migration

*For any* component migration, all existing tests should be executed and pass without introducing console errors or warnings

**Validates: Requirements 8.1, 8.2**

### Property 10: Sub-phase Execution Order

*For any* migration execution, sub-phases should execute in the specified priority order (4.1 → 4.2 → 4.3 → 4.4) with verification between each phase

**Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5**

## Error Handling

### Migration Failure Scenarios

1. **Context API Import Detection Failure**
   - **Scenario**: Migration system fails to detect remaining Context API imports
   - **Handling**: Automated scanning with multiple search patterns to ensure comprehensive detection
   - **Recovery**: Manual verification step before marking migration complete

2. **Hook Replacement Failure**
   - **Scenario**: Automated hook replacement introduces syntax errors or incorrect patterns
   - **Handling**: Syntax validation after each file transformation
   - **Recovery**: Rollback to previous file state and manual intervention

3. **Functionality Regression**
   - **Scenario**: Migrated component behavior differs from original
   - **Handling**: Comprehensive test suite execution after each component migration
   - **Recovery**: Immediate rollback and detailed analysis of behavioral differences

4. **Import Path Resolution Failure**
   - **Scenario**: FSD import paths fail to resolve correctly
   - **Handling**: Import resolution validation during transformation
   - **Recovery**: Fallback to working import paths and manual correction

### Error Detection Mechanisms

1. **Automated Testing**: Run existing test suites after each migration step
2. **Static Analysis**: Use ESLint and TypeScript compiler to detect issues
3. **Runtime Monitoring**: Check for console errors during manual testing
4. **Dependency Analysis**: Verify no circular dependencies are introduced

### Rollback Strategy

1. **File-Level Rollback**: Each file transformation is atomic and reversible
2. **Component-Level Rollback**: Individual component migrations can be reverted
3. **Sub-phase Rollback**: Entire sub-phases can be rolled back if critical issues arise
4. **Full Migration Rollback**: Complete rollback to pre-migration state if necessary

## Testing Strategy

### Dual Testing Approach

The testing strategy employs both unit testing and property-based testing to ensure comprehensive coverage:

**Unit Tests:**
- Verify specific migration transformations in target files
- Test individual component behavior before and after migration
- Validate specific import path changes
- Test error handling scenarios with known failure cases

**Property Tests:**
- Verify universal properties across all migrated components
- Test authentication flow preservation across all scenarios
- Validate hook usage patterns across the entire codebase
- Test functionality preservation across all features

### Property-Based Testing Configuration

- **Library**: Use fast-check for JavaScript/TypeScript property-based testing
- **Iterations**: Minimum 100 iterations per property test
- **Test Tags**: Each property test references its design document property
- **Tag Format**: **Feature: fsd-phase-4-critical-cleanup, Property {number}: {property_text}**

### Testing Phases

#### Pre-Migration Testing
1. **Baseline Establishment**: Run complete test suite to establish baseline behavior
2. **Component Inventory**: Document current behavior of target components
3. **Authentication Flow Testing**: Verify all auth flows work correctly

#### During Migration Testing
1. **File-Level Validation**: Test each file after transformation
2. **Component-Level Validation**: Test each component after migration
3. **Integration Testing**: Verify component interactions remain intact

#### Post-Migration Testing
1. **Comprehensive Regression Testing**: Run full test suite
2. **Manual Flow Testing**: Test critical user flows manually
3. **Performance Testing**: Verify no performance regressions
4. **Cross-Browser Testing**: Ensure compatibility across browsers

### Test Coverage Requirements

- **Unit Test Coverage**: Maintain existing coverage levels (minimum 80%)
- **Integration Test Coverage**: Test all component interactions
- **E2E Test Coverage**: Test critical user journeys end-to-end
- **Property Test Coverage**: One property test per correctness property

### Manual Testing Checklist

#### Authentication Flows
- [ ] User login with email/password
- [ ] User signup process
- [ ] Password reset flow
- [ ] OTP verification
- [ ] Session persistence across browser refresh
- [ ] Role-based navigation (CoursePlayer back button)

#### Component-Specific Testing
- [ ] CoursePlayer: Video playback and navigation
- [ ] CoursePlayer: Role-based back navigation
- [ ] Dashboard: Student data loading and display
- [ ] Dashboard: Authentication-dependent features

#### Feature Integration Testing
- [ ] Theme switching functionality
- [ ] Search functionality
- [ ] Portfolio functionality
- [ ] Tour/onboarding functionality
- [ ] Subscription flows

### Automated Testing Integration

- **CI/CD Integration**: All tests run automatically on pull requests
- **Pre-commit Hooks**: Static analysis and basic tests run before commits
- **Deployment Gates**: Full test suite must pass before deployment
- **Monitoring**: Post-deployment monitoring for runtime errors

### Test Data Management

- **Test Isolation**: Each test uses isolated test data
- **Data Cleanup**: Automatic cleanup after test execution
- **Mock Services**: Use mocked external services for consistent testing
- **Test Environments**: Separate test environment mirrors production

This comprehensive testing strategy ensures that the migration maintains system reliability while enabling confident progression to Phase 5 of the FSD migration.
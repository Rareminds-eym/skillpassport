# Zustand Migration Guide

This guide helps you migrate from React Context to Zustand stores.

## Quick Reference

| Before (Context) | After (Zustand) |
|-------------------|-----------------|
| `useAuth()` | `useAuthStore()` or `useUser()` |
| `useTheme()` | `useThemeStore()` or `useTheme()` |
| `useSearch()` | `useSearchStore()` or `useSearchActions()` |
| `usePortfolio()` | `usePortfolioStore()` or `usePortfolioStudent()` |
| `useTour()` | `useTourStore()` or `useTourActions()` |
| `useSubscriptionContext()` | `useSubscriptionStore()` or `useSubscriptionAccess()` |

## Detailed Migration Examples

### 1. Auth Context → Auth Store

**Before:**
```tsx
import { useAuth } from '@/context/AuthContext';

function MyComponent() {
  const { user, login, logout, isAuthenticated, loading } = useAuth();
  
  if (loading) return <Spinner />;
  if (!isAuthenticated) return <LoginPage />;
  
  return <div>Hello {user.name}</div>;
}
```

**After:**
```tsx
import { 
  useUser, 
  useIsAuthenticated, 
  useAuthLoading,
  useAuthActions 
} from '@/stores';

function MyComponent() {
  const user = useUser();
  const isAuthenticated = useIsAuthenticated();
  const loading = useAuthLoading();
  const { login, logout } = useAuthActions();
  
  if (loading) return <Spinner />;
  if (!isAuthenticated) return <LoginPage />;
  
  return <div>Hello {user?.name}</div>;
}
```

### 2. Theme Context → Theme Store

**Before:**
```tsx
import { useTheme } from '@/context/ThemeContext';

function MyComponent() {
  const { theme, toggleTheme, setTheme } = useTheme();
  
  return (
    <button onClick={toggleTheme}>
      Current: {theme}
    </button>
  );
}
```

**After:**
```tsx
import { useTheme, useIsDark } from '@/stores';

function MyComponent() {
  const { theme, toggleTheme, setTheme } = useTheme();
  const isDark = useIsDark(); // Convenience hook
  
  return (
    <button onClick={toggleTheme}>
      Current: {theme}
    </button>
  );
}
```

### 3. Search Context → Search Store

**Before:**
```tsx
import { useSearch } from '@/context/SearchContext';

function SearchComponent() {
  const { searchQuery, setSearchQuery, searchResults, isSearching, handleSearch } = useSearch();
  
  return (
    <div>
      <input 
        value={searchQuery} 
        onChange={(e) => setSearchQuery(e.target.value)} 
      />
      {isSearching && <Spinner />}
      {searchResults.map(result => <div key={result.id}>{result.title}</div>)}
    </div>
  );
}
```

**After:**
```tsx
import { 
  useSearchQuery, 
  useSearchResults, 
  useIsSearching,
  useSearchActions 
} from '@/stores';

function SearchComponent() {
  const searchQuery = useSearchQuery();
  const searchResults = useSearchResults();
  const isSearching = useIsSearching();
  const { setSearchQuery } = useSearchActions();
  
  return (
    <div>
      <input 
        value={searchQuery} 
        onChange={(e) => setSearchQuery(e.target.value)} 
      />
      {isSearching && <Spinner />}
      {searchResults.map(result => <div key={result.id}>{result.title}</div>)}
    </div>
  );
}
```

### 4. Portfolio Context → Portfolio Store

**Before:**
```tsx
import { usePortfolio } from '@/context/PortfolioContext';

function PortfolioComponent() {
  const { student, settings, updateSettings, setStudent, isLoading } = usePortfolio();
  
  if (isLoading) return <Spinner />;
  
  return (
    <div>
      <h1>{student?.name}</h1>
      <button onClick={() => updateSettings({ layout: 'journey' })}>
        Change Layout
      </button>
    </div>
  );
}
```

**After:**
```tsx
import { 
  usePortfolioStudent, 
  usePortfolioSettings,
  usePortfolioLoading,
  usePortfolioActions 
} from '@/stores';

function PortfolioComponent() {
  const student = usePortfolioStudent();
  const settings = usePortfolioSettings();
  const isLoading = usePortfolioLoading();
  const { updateSettings, setStudent } = usePortfolioActions();
  
  if (isLoading) return <Spinner />;
  
  return (
    <div>
      <h1>{student?.name}</h1>
      <button onClick={() => updateSettings({ layout: 'journey' })}>
        Change Layout
      </button>
    </div>
  );
}
```

### 5. Tour Context → Tour Store

**Before:**
```tsx
import { useTour } from '@/components/Tours/TourProvider';

function MyComponent() {
  const { startTour, completeTour, isEligible, state } = useTour();
  
  useEffect(() => {
    if (isEligible('student_dashboard')) {
      startTour('student_dashboard');
    }
  }, []);
  
  return <div>Tour step: {state.stepIndex}</div>;
}
```

**After:**
```tsx
import { 
  useTourActions,
  useTourEligibility,
  useTourState 
} from '@/stores';

function MyComponent() {
  const { startTour, completeTour } = useTourActions();
  const { isEligible } = useTourEligibility('student_dashboard');
  const tourState = useTourState();
  
  useEffect(() => {
    if (isEligible) {
      startTour('student_dashboard');
    }
  }, []);
  
  return <div>Tour step: {tourState.stepIndex}</div>;
}
```

### 6. Subscription Context → Subscription Store

**Before:**
```tsx
import { useSubscriptionContext } from '@/context/SubscriptionContext';

function MyComponent() {
  const { hasAccess, subscription, refreshAccess, isLoading } = useSubscriptionContext();
  
  if (isLoading) return <Spinner />;
  if (!hasAccess) return <NoAccessPage />;
  
  return <div>Subscription: {subscription?.plan_type}</div>;
}
```

**After:**
```tsx
import { 
  useSubscriptionAccess,
  useSyncSubscriptionWithQuery 
} from '@/stores';
import { useQueryClient } from '@tanstack/react-query';

function MyComponent() {
  const { hasAccess, subscription, isLoading } = useSubscriptionAccess();
  const queryClient = useQueryClient();
  const { refreshAccess } = useSyncSubscriptionWithQuery();
  
  if (isLoading) return <Spinner />;
  if (!hasAccess) return <NoAccessPage />;
  
  return <div>Subscription: {subscription?.plan_type}</div>;
}
```

### 7. Assessment Context → Assessment Store

**Before:**
```tsx
import { useAssessmentFlow } from '@/features/assessment/hooks/useAssessmentFlow';

function AssessmentComponent() {
  const { state, actions, computed } = useAssessmentFlow();
  
  return (
    <div>
      <button onClick={actions.nextQuestion}>Next</button>
      <button onClick={actions.previousQuestion} disabled={!computed.canGoPrevious}>
        Previous
      </button>
      <div>Status: {state.status}</div>
    </div>
  );
}
```

**After:**
```tsx
import { 
  useAssessmentStore,
  useAssessmentStatus,
  useAssessmentNavigation 
} from '@/stores';

function AssessmentComponent() {
  const status = useAssessmentStatus();
  const { nextQuestion, previousQuestion, canGoPrevious } = useAssessmentNavigation();
  
  return (
    <div>
      <button onClick={nextQuestion}>Next</button>
      <button onClick={previousQuestion} disabled={!canGoPrevious}>
        Previous
      </button>
      <div>Status: {status}</div>
    </div>
  );
}
```

## Advanced Patterns

### Selecting Multiple Values

**Before:**
```tsx
const { user, isAuthenticated, role } = useAuth();
```

**After:**
```tsx
// Option 1: Use the store directly with selector
const { user, isAuthenticated, role } = useAuthStore(
  (state) => ({ 
    user: state.user, 
    isAuthenticated: state.isAuthenticated, 
    role: state.role 
  })
);

// Option 2: Use pre-built hooks
const user = useUser();
const isAuthenticated = useIsAuthenticated();
const { role } = useUserRole();
```

### Actions vs State

**Before:**
```tsx
const { searchQuery, handleSearch } = useSearch();
```

**After:**
```tsx
// Select only actions
const { handleSearch, clearSearch } = useSearchActions();

// Select only state
const searchQuery = useSearchQuery();
```

### Conditional Rendering

**Before:**
```tsx
const { isLoading, hasAccess } = useSubscriptionContext();
if (isLoading || !hasAccess) return null;
```

**After:**
```tsx
const { isLoading, hasAccess } = useSubscriptionAccess();
if (isLoading || !hasAccess) return null;
```

## Store Initialization

Stores are automatically initialized, but you can manually initialize if needed:

```tsx
import { useAuthStore, initializeStores } from '@/stores';

// In your app initialization
useEffect(() => {
  initializeStores();
}, []);

// Or access store directly
const user = useAuthStore.getState().user;
```

## Benefits of Migration

1. **No Provider Hell**: Remove nested provider wrappers in App.tsx
2. **Better Performance**: Components only re-render when their selected state changes
3. **Simpler Testing**: No need to mock context providers
4. **DevTools Support**: Redux DevTools integration for debugging
5. **TypeScript Support**: Better type inference and autocomplete
6. **Persistence**: Built-in localStorage persistence where needed

## Store Files Created

- `themeStore.ts` - Theme/dark mode management
- `authStore.ts` - Authentication and session management
- `searchStore.ts` - Search query and results
- `portfolioStore.ts` - Portfolio data and settings
- `tourStore.ts` - Tour/onboarding state
- `assessmentStore.ts` - Assessment flow state
- `subscriptionStore.ts` - Subscription and entitlements
- `counsellingStore.ts` - Counselling sessions (existing)
- `useMessageStore.ts` - Messages (existing)
- `index.ts` - Barrel exports for all stores

## Next Steps

1. Replace `App.tsx` with the new version (App.tsx.new)
2. Start migrating components one at a time
3. Test each component after migration
4. Remove old context files once all components are migrated

---

## Migration Status (Updated: March 7, 2026)

### ✅ Completed Migrations

#### Components Migrated (Updated):
- [x] `ProtectedRoute.jsx` → uses `useIsAuthenticated`, `useUserRole`, `useAuthLoading`
- [x] `SimpleLogin.jsx` → uses `useAuthActions` + Supabase client
- [x] `AuthenticatedApp.jsx` → uses `useUser`, `useAuthLoading`
- [x] `UnifiedLogin.tsx` → uses `useAuthActions`
- [x] `TourWrapper.tsx` → uses `useUser`
- [x] `TokenRefreshErrorNotification.jsx` → uses `useErrorNotification`
- [x] `SubscriptionPrefetch.jsx` → uses `useUser`
- [x] `PublicLayout.jsx` → uses `useAssessmentPromotional`, `useCurrentPromotional`, `useIsAuthenticated`, `useUserRole`, `useUser`
- [x] `Sidebar.jsx` → uses `useUserRole`, `useUser`
- [x] `Header.jsx` → uses `useUser`, `useAuthActions`
- [x] `useSubscriptionQuery.js` → uses `useUser`
- [x] `ProfileEditSection.jsx` → uses `useUser`
- [x] `ProfileHeroEdit.jsx` → uses `useUser`, `useUserRole`
- [x] `ModernLearningCard.jsx` → uses `useUser`
- [x] `NotificationPanel.tsx` → uses `useUser`
- [x] `AddDataTest.jsx` → uses `useUser`
- [x] `DigitalPortfolioSideDrawer.tsx` → uses `useUser`
- [x] `Dashboard.jsx` → uses `useUser`
- [x] `SubscriptionProtectedRoute.jsx` → uses `useIsAuthenticated`, `useUserRole`, `useAuthLoading`
- [x] `SubscriptionRouteGuard.jsx` → uses `useUserRole`, `useUser`
- [x] `SubscriptionSettingsSection.jsx` → removed unused `useAuth`
- [x] `admin/Header.tsx` → uses `useUser`, `useAuthActions`
- [x] `admin/Sidebar.tsx` → uses `useUserRole`, `useUser`
- [x] `Students/Header.jsx` → uses `useUser`, `useAuthActions`
- [x] `MainSettings.jsx` → uses `useUser`
- [x] `StudentPublicViewer.jsx` → uses `useUser`
- [x] `Recruiter/Header.tsx` → uses `useUser`, `useAuthActions`
- [x] `Recruiter/NotificationPanel.tsx` → uses `useUser`
- [x] `CollegeMyClass.tsx` → uses `useUser`
- [x] `SchoolMyClass.tsx` → uses `useUser`
- [x] `AddDepartmentModal.tsx` → uses `useUser`
- [x] `EditDepartmentModal.tsx` → uses `useUser`

#### Zustand Stores Created (13 total):
- [x] `authStore.ts` - Authentication and session management (fixed hooks)
- [x] `themeStore.ts` - Theme/dark mode management
- [x] `searchStore.ts` - Search query and results
- [x] `portfolioStore.ts` - Portfolio data and settings
- [x] `tourStore.ts` - Tour/onboarding state
- [x] `assessmentStore.ts` - Assessment flow state (fixed hooks)
- [x] `subscriptionStore.ts` - Subscription and entitlements (fixed hooks)
- [x] `promotionalStore.ts` - Promotional events (fixed hooks)
- [x] `careerAssistantStore.ts` - Career assistant state (fixed hooks)
- [x] `globalPresenceStore.ts` - Global user presence
- [x] `testStore.ts` - Test-taking state
- [x] `counsellingStore.ts` - Counselling sessions (existing)
- [x] `useMessageStore.ts` - Messages (existing)

#### App.tsx Changes:
- [x] Zustand store initialization added
- [x] Context providers temporarily kept for gradual migration

### ⏳ Pending Migrations

#### Components Still Using `useAuth()` (~5 files remaining):
- `layouts/PortfolioLayout.jsx`
- `components/Recruiter/components/CandidateProfileDrawer.tsx` (import only - commented out)
- `hooks/useEducatorSchool.ts` (partially commented out)
- `hooks/Subscription/useOrganizationSubscription.ts` (called but not used)
- And various feature components...

#### Hooks Migrated (Updated):
- [x] `useAddOnTracking.js` → uses `useUser`
- [x] `useAnalytics.ts` → uses `useUser`
- [x] `useAssessment.js` → uses `useUser`
- [x] `useConversationStudents.ts` → uses `useUser`
- [x] `useEducatorId.ts` → uses `useUser`
- [x] `useMentorAllocation.ts` → uses `useUser`
- [x] `useOffers.ts` → uses `useUser`
- [x] `useOrganization.ts` → uses `useUser`
- [x] `useOrganizationCheck.ts` → uses `useUser`
- [x] `useProgramSections.ts` → uses `useUser`
- [x] `useUserRole.ts` → uses `useUser`, `useUserRole` from stores

#### Layouts Migrated:
- [x] `PortfolioLayout.jsx` → uses `useUserRole`
- [x] `StudentLayout.jsx` → uses `useUser`

#### Pages Migrated (Updated):
- [x] `pages/recruiter/Profile.tsx` → uses `useUser`
- [x] `pages/student/MyExperience.jsx` → uses `useUser`

#### Subscription Pages Migrated:
- [x] `SubscriptionPlans.jsx` → uses `useUser`, `useUserRole`, `useIsAuthenticated`, `useAuthLoading`
- [x] `MySubscription.jsx` → uses `useUser`, `useUserRole`, `useAuthLoading`
- [x] `AddOns.jsx` → uses `useUser`, `useUserRole`, `useAuthLoading`
- [x] `PaymentSuccess.jsx` → uses `useUser`, `useUserRole`
- [x] `PaymentFailure.jsx` → uses `useUserRole`
- [x] `PaymentCompletion.jsx` → uses `useUser`, `useUserRole`, `useIsAuthenticated`, `useAuthLoading`
- [x] `BulkPurchasePage.tsx` → uses `useUser`, `useIsAuthenticated`
- [x] `MemberSubscriptionPage.tsx` → uses `useUser`, `useIsAuthenticated`
- [x] `OrganizationPaymentPage.tsx` → uses `useUser`, `useIsAuthenticated`
- [x] `OrganizationSubscriptionPage.tsx` → uses `useUser`, `useIsAuthenticated`

### 🧪 Test Status
- **Store Tests**: ✅ 27/27 passing
- **Type Check**: ⚠️ Pre-existing errors in unrelated files (not Zustand-related)

### 📋 Migration Pattern
```typescript
// Before (Context)
import { useAuth } from '@/context/AuthContext';
const { user, role, isAuthenticated, loading, logout } = useAuth();

// After (Zustand)
import { useUser, useUserRole, useIsAuthenticated, useAuthLoading, useAuthActions } from '@/stores';
const user = useUser();
const { role } = useUserRole();
const isAuthenticated = useIsAuthenticated();
const loading = useAuthLoading();
const { logout } = useAuthActions();
```

### 🔧 Store Hook Pattern (Important!)
All hooks have been fixed to use individual selectors to prevent infinite loops:
```typescript
// ✅ Correct - individual selectors
const useHook = () => {
  const value1 = useStore((state) => state.value1);
  const value2 = useStore((state) => state.value2);
  return { value1, value2 };
};

// ❌ Incorrect - causes infinite loops
const useHook = () => useStore((state) => ({ value1: state.value1, value2: state.value2 }));
```

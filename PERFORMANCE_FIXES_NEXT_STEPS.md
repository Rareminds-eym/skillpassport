> **Historical proposal — superseded.** Performance percentages, test-completion claims, and deployment-readiness statements below are not validated results. See [PERFORMANCE_VALIDATION.md](PERFORMANCE_VALIDATION.md) for the implemented changes, measured bundle sizes, passing checks, and limitations.

# Performance Optimization - Remaining Implementation Guide

**Date:** September 29, 2026  
**Status:** 📋 Implementation Roadmap  
**Phase 1:** ✅ COMPLETE (30-40% improvement)  
**Phases 2-4:** 🔄 Ready for Implementation

---

## Quick Summary

**Phase 1 Complete:** Emergency fixes deployed (console stripping, memory leaks, debouncing)  
**Remaining Work:** 10 tasks across 3 phases for additional 50-60% improvement  
**Total Target:** 80-90% performance improvement when all phases complete

---

## Phase 2: Quick Wins (Week 2-3)

**Expected Impact:** +30-40% improvement (cumulative: 60-70%)  
**Risk Level:** 🟡 LOW - No breaking changes, minimal backend coordination

### Task 5: Memoize Date Operations and Sort Operations

**Priority:** HIGH - Quick win, big impact  
**Time Estimate:** 4 hours  
**Files to Modify:**
- `ProfileSubTabs/CertificatesTab.jsx`
- `ProfileSubTabs/ExperienceTab.jsx`
- `ProfileSubTabs/ProjectsTab.jsx`
- `ProfileSubTabs/SoftSkillsTab.jsx`
- `ProfileSubTabs/TechnicalSkillsTab.jsx`
- `ProfileSubTabs/AcademicDetailsTab.jsx`

**Implementation Pattern:**

```javascript
// BEFORE (runs every render - slow)
const formatDate = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);  // ❌ Created every render
  return date.toLocaleDateString('en-US', { ... });
};

// Render
{certificates.sort((a, b) => {  // ❌ Sorted every render
  const dateA = new Date(a.date);  // ❌ Date objects created every sort
  const dateB = new Date(b.date);
  return dateB - dateA;
}).map(...)}

// AFTER (memoized - fast)
import { useMemo } from 'react';

// Memoize formatter
const formatDate = useMemo(() => {
  const formatter = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short'
  });
  
  return (dateString) => {
    if (!dateString) return "";
    return formatter.format(new Date(dateString));
  };
}, []);

// Memoize sorted list
const sortedCertificates = useMemo(() => {
  return (certificatesData || [])
    .filter(cert => cert.enabled !== false)
    .sort((a, b) => {
      const dateA = new Date(a.issueDate || 0).getTime();
      const dateB = new Date(b.issueDate || 0).getTime();
      return dateB - dateA;
    });
}, [certificatesData]);

// Render
{sortedCertificates.map(...)}  // ✅ Already sorted, no re-computation
```

**Impact:**
- Date operations: 50ms → 5ms (90% faster)
- Sort operations: 196ms → 0ms cached (100% faster when data unchanged)
- **Total: ~200ms saved per render**

**Testing:**
```bash
# Before implementing
# 1. Open DevTools → Performance
# 2. Click on Certificates tab
# 3. Profile → Should see expensive sort/date operations

# After implementing
# 4. Profile again → sort/date should be cached
# 5. Verify certificates still display correctly
```

---

### Task 6: Add Loading Skeletons

**Priority:** HIGH - UX improvement  
**Time Estimate:** 1 day  
**Files to Create:**
- `src/widgets/learner-dashboard/ui/settings/SettingsSkeleton.jsx`
- `src/widgets/learner-dashboard/ui/settings/ProfileSkeleton.jsx`
- `src/widgets/learner-dashboard/ui/settings/TabSkeleton.jsx`

**Implementation:**

```javascript
// SettingsSkeleton.jsx
export const SettingsSkeleton = () => {
  return (
    <div className="animate-pulse">
      {/* Header skeleton */}
      <div className="h-8 bg-gray-200 rounded w-1/4 mb-6" />
      
      {/* Content skeleton */}
      <div className="grid grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-200 rounded" />
          ))}
        </div>
        
        {/* Main content */}
        <div className="col-span-3 space-y-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-200 rounded" />
          ))}
        </div>
      </div>
    </div>
  );
};

// Usage in MainSettings.jsx
if (learnerLoading || educationLoading) {
  return <SettingsSkeleton />;  // ✅ Instead of spinner
}
```

**Impact:**
- **UX:** Users see progress instead of blank screen
- **Perceived Performance:** Feels 50% faster (psychological)
- **Reduced bounce rate:** Users less likely to leave

---

### Tasks 3 & 4: Aggregated API Endpoint (Backend Required)

**Priority:** CRITICAL - Biggest performance win  
**Time Estimate:** 2-3 days (1 day backend, 1 day frontend, 1 day testing)  
**Risk Level:** 🟠 MEDIUM - Requires backend changes and coordination

**Backend Implementation:**

Create new endpoint: `POST /api/learner-profile/settings-aggregated`

```typescript
// Backend: functions/api/learner-profile/handlers/settings-aggregated.ts

export async function getLearnerSettingsAggregated(email: string) {
  // Single SQL query with joins instead of 12 separate queries
  const result = await db.query(`
    SELECT 
      l.*,
      json_agg(DISTINCT e.*) FILTER (WHERE e.id IS NOT NULL) as education,
      json_agg(DISTINCT c.*) FILTER (WHERE c.id IS NOT NULL) as certificates,
      json_agg(DISTINCT p.*) FILTER (WHERE p.id IS NOT NULL) as projects,
      json_agg(DISTINCT ex.*) FILTER (WHERE ex.id IS NOT NULL) as experience,
      json_agg(DISTINCT ts.*) FILTER (WHERE ts.id IS NOT NULL) as technical_skills,
      json_agg(DISTINCT ss.*) FILTER (WHERE ss.id IS NOT NULL) as soft_skills,
      u.notification_settings,
      u.privacy_settings
    FROM learners l
    LEFT JOIN learner_education e ON l.id = e.learner_id
    LEFT JOIN learner_certificates c ON l.id = c.learner_id
    LEFT JOIN learner_projects p ON l.id = p.learner_id
    LEFT JOIN learner_experience ex ON l.id = ex.learner_id
    LEFT JOIN learner_technical_skills ts ON l.id = ts.learner_id
    LEFT JOIN learner_soft_skills ss ON l.id = ss.learner_id
    LEFT JOIN user_settings u ON l.user_id = u.user_id
    WHERE l.email = $1
    GROUP BY l.id, u.notification_settings, u.privacy_settings
  `,[email]);
  
  return {
    success: true,
    data: {
      profile: result.rows[0],
      education: result.rows[0].education || [],
      certificates: result.rows[0].certificates || [],
      projects: result.rows[0].projects || [],
      experience: result.rows[0].experience || [],
      technicalSkills: result.rows[0].technical_skills || [],
      softSkills: result.rows[0].soft_skills || [],
      notificationSettings: result.rows[0].notification_settings || {},
      privacySettings: result.rows[0].privacy_settings || {},
    }
  };
}
```

**Frontend Implementation:**

```javascript
// src/entities/learner/model/useLearnerSettingsAggregated.js

export const useLearnerSettingsAggregated = (email) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!email) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        const result = await apiPost('/learner-profile/settings-aggregated', {
          action: 'fetch-all',
          email
        });

        if (result.success) {
          setData(result.data);
        } else {
          setError(result.error);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [email]);

  return { data, loading, error };
};

// Usage in MainSettings.jsx - Replace 12 hooks with 1
const MainSettings = () => {
  const user = useUser();
  const userEmail = user?.email;

  // BEFORE: 12 separate hooks (12 API calls, 1.5-2s waterfall)
  // const { learnerData } = useLearnerSettings(userEmail);
  // const { learnerData: details } = useLearnerDataByEmail(userEmail);
  // const { certificates } = useLearnerCertificates(learnerId);
  // ... 9 more hooks

  // AFTER: 1 hook (1 API call, ~250ms)
  const { data, loading, error } = useLearnerSettingsAggregated(userEmail);

  if (loading) return <SettingsSkeleton />;
  if (error) return <ErrorDisplay error={error} />;

  // Destructure all data
  const {
    profile: learnerData,
    education: educationData,
    certificates: certificatesData,
    projects: projectsData,
    experience: experienceData,
    technicalSkills,
    softSkills,
    notificationSettings,
    privacySettings
  } = data;

  // Rest of component stays the same...
};
```

**Impact:**
- **Network:** 12 requests → 1 request (92% reduction)
- **Latency:** 1,500-2,000ms → 200-300ms (85% reduction)
- **Database:** 12 queries → 1 query with joins (faster, less load)
- **Biggest Performance Win!**

**Testing:**
```bash
# Backend testing
npm run test:api -- settings-aggregated

# Frontend testing
# 1. Open DevTools → Network tab
# 2. Navigate to /learner/settings
# 3. Should see ONLY 1 request to settings-aggregated
# 4. Response time should be <300ms

# Load testing
k6 run load-test-settings.js --vus 100
# Measure: requests/sec, p95 latency
```

---

## Phase 3: Architecture Refactor (Week 4-6)

**Expected Impact:** +20% improvement (cumulative: 80%)  
**Risk Level:** 🔴 HIGH - Major refactoring, requires careful testing

### Task 7: Context API (Eliminate Prop Drilling)

**The Problem:**
- 59 props passed to ProfileTab
- Every state change triggers 413 prop comparisons
- React.memo useless (props always change)

**The Solution:**

```javascript
// src/widgets/learner-dashboard/ui/settings/context.jsx

export const LearnerSettingsContext = createContext();

export const LearnerSettingsProvider = ({ children, value }) => {
  return (
    <LearnerSettingsContext.Provider value={value}>
      {children}
    </LearnerSettingsContext.Provider>
  );
};

export const useLearnerSettings = () => {
  const context = useContext(LearnerSettingsContext);
  if (!context) {
    throw new Error('useLearnerSettings must be used within LearnerSettingsProvider');
  }
  return context;
};

// Usage in MainSettings.jsx
const MainSettings = () => {
  // All state and handlers here...
  
  const contextValue = useMemo(() => ({
    profile: {
      data: profileData,
      update: handleProfileChange,
      save: handleSavePersonalInfo,
    },
    institutions: {
      schools,
      colleges,
      universities,
      handlers: { handleInstitutionChange },
    },
    modals: {
      education: [showEducationModal, setShowEducationModal],
      skills: [showTechnicalSkillsModal, setShowTechnicalSkillsModal],
      // ...
    },
    isSaving,
  }), [profileData, schools, colleges, /* ... dependencies */]);

  return (
    <LearnerSettingsProvider value={contextValue}>
      <ProfileTab />  {/* ✅ Zero props! */}
      <SecurityTab />
      <NotificationsTab />
    </LearnerSettingsProvider>
  );
};

// Usage in ProfileTab.jsx
const ProfileTab = () => {  // ✅ No props!
  const { profile, institutions, modals } = useLearnerSettings();
  // Use only what you need
};
```

**Impact:**
- 59 props → 0 props (100% reduction)
- 413 comparisons → <10 comparisons (97% reduction)
- React.memo now effective
- **80-100ms saved per state update**

---

### Task 8: Code Splitting (React.lazy)

```javascript
// MainSettings.jsx
const ProfileTab = lazy(() => import('./ProfileTab'));
const SecurityTab = lazy(() => import('./SecurityTab'));
const NotificationsTab = lazy(() => import('./NotificationsTab'));
const PrivacyTab = lazy(() => import('./PrivacyTab'));

// Modals - only load when opened
const EducationEditModal = lazy(() => 
  import('@/features/learner-profile/EducationEditModal')
);

<Suspense fallback={<TabSkeleton />}>
  {activeTab === 'profile' && <ProfileTab />}
  {activeTab === 'security' && <SecurityTab />}
  {activeTab === 'notifications' && <NotificationsTab />}
  {activeTab === 'privacy' && <PrivacyTab />}
</Suspense>
```

**Impact:**
- Initial bundle: 200-300KB → 80-120KB (50-60% smaller)
- Time to Interactive: 3-5s → <1s (80% faster)

---

### Task 9: Optimize Institution Data

**Current Problem:** Fetching 3,000+ institution records when user needs 1-2

**Solution:**

```javascript
// Option 1: Server-side search
const useSchoolSearch = (searchTerm, limit = 20) => {
  const [schools, setSchools] = useState([]);
  
  useEffect(() => {
    if (searchTerm.length < 2) return;
    
    const fetchSchools = async () => {
      const result = await apiPost('/institutions/search', {
        type: 'school',
        query: searchTerm,
        limit
      });
      setSchools(result.data);
    };
    
    const debouncedFetch = debounce(fetchSchools, 300);
    debouncedFetch();
  }, [searchTerm, limit]);
  
  return schools;
};

// Option 2: Fetch only user's institution
const useUserInstitutions = (learnerId) => {
  return useQuery(['user-institutions', learnerId], async () => {
    const result = await apiPost('/learner-profile/institutions', {
      learnerId
    });
    return result.data;  // Only returns schools/colleges user is enrolled in
  });
};
```

---

### Task 10: Error Boundaries

```javascript
// src/widgets/learner-dashboard/ui/settings/ErrorBoundary.jsx

class SettingsErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Settings Error:', error, errorInfo);
    // Log to monitoring service
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold">Something went wrong</h2>
          <p className="text-gray-600 mt-2">
            We're having trouble loading this section.
          </p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg"
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Usage
<ErrorBoundary>
  <ProfileTab />
</ErrorBoundary>
```

---

## Phase 4: Polish (Week 7-8)

### Task 11: React Query (Caching + Optimistic Updates)

```bash
npm install @tanstack/react-query
```

```javascript
// Setup
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
    },
  },
});

// Usage
const { data, isLoading, mutate } = useQuery({
  queryKey: ['learner-settings', userEmail],
  queryFn: () => fetchLearnerSettings(userEmail),
});

// Optimistic updates
const updateProfileMutation = useMutation({
  mutationFn: updateProfile,
  onMutate: async (newData) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries(['learner-settings']);
    
    // Snapshot previous value
    const previousData = queryClient.getQueryData(['learner-settings']);
    
    // Optimistically update
    queryClient.setQueryData(['learner-settings'], (old) => ({
      ...old,
      ...newData
    }));
    
    return { previousData };
  },
  onError: (err, newData, context) => {
    // Rollback on error
    queryClient.setQueryData(['learner-settings'], context.previousData);
  },
  onSettled: () => {
    // Refetch to sync with server
    queryClient.invalidateQueries(['learner-settings']);
  },
});
```

**Impact:**
- Instant UI updates (optimistic)
- Automatic caching (less network requests)
- Background refetching (always fresh)

---

### Task 12: Fix CSP Violation

```javascript
// BEFORE (violates CSP)
<style dangerouslySetInnerHTML={{
  __html: `.scrollbar-hide { -ms-overflow-style: none; }`
}} />

// AFTER - Option 1: Move to CSS file
// styles/scrollbar.css
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}

// AFTER - Option 2: Tailwind plugin
// tailwind.config.js
plugins: [
  function({ addUtilities }) {
    addUtilities({
      '.scrollbar-hide': {
        '-ms-overflow-style': 'none',
        'scrollbar-width': 'none',
        '&::-webkit-scrollbar': {
          display: 'none'
        }
      }
    })
  }
]
```

---

## Implementation Priority

### Week 2 (Do First - Quick Wins)
1. ✅ Task 5: Memoization (4 hours)
2. ✅ Task 6: Loading skeletons (1 day)

### Week 2-3 (Backend Coordination)
3. 🔄 Task 3: Backend aggregated endpoint (1 day)
4. 🔄 Task 4: Frontend aggregated hook (1 day)

### Week 4-6 (Major Refactor)
5. Task 7: Context API (2 days)
6. Task 8: Code splitting (1 day)
7. Task 9: Institution optimization (2 days)
8. Task 10: Error boundaries (1 day)

### Week 7-8 (Polish)
9. Task 11: React Query (2 days)
10. Task 12: Fix CSP (2 hours)

---

## Success Metrics

**After All Phases Complete:**

```
Time to Interactive:     <1 second ✅ (80% faster)
API Calls:              1-3 parallel ✅ (92% fewer)
Bundle Size:            80-120KB ✅ (50% smaller)
Re-renders per update:  1-2 components ✅ (90% fewer)
Console statements:     0 ✅ (security hardened)
Memory leaks:           0 ✅ (cleanup implemented)
UI Responsiveness:      <50ms ✅ (instant)
```

---

## Getting Started

**Ready to continue? Start with:**

```bash
# Phase 2 - Quick wins
git checkout -b performance/phase2-memoization
# Implement Task 5: Memoization
# Implement Task 6: Loading skeletons

# Then coordinate with backend team for Tasks 3 & 4
```

**Questions?** Refer to `PERFORMANCE_AUDIT_REPORT.md` for detailed analysis.

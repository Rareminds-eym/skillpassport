# Remaining Issues - Freemium Feature Branch

**Last Updated:** May 15, 2026  
**Branch:** feature/freemium-model  
**Status:** DO NOT MERGE - Critical issues remain

## Overview

This document tracks remaining issues after removing rate limiting and caching functionality. Issues are categorized by severity and must be addressed before production deployment.

---

## 🔴 CRITICAL — Must fix before merge

## 🟠 HIGH — Should fix before merge

### 7. Upgrade Flow Doesn't Validate Upgrade Direction
**File:** `verify-payment.ts:95-135`  
**Risk:** Code updates existing subscription without validating it's actually an upgrade. User could "upgrade" from Professional to Basic, or pay for the same plan twice.

**Fix:**
```typescript
if (existingSubscription) {
  // Fetch current plan details
  const { data: currentPlan } = await supabase
    .from('subscription_plans')
    .select('plan_code, pricing_matrix')
    .eq('id', existingSubscription.plan_id)
    .single();
  
  // Validate upgrade direction
  const currentPrice = getPlanPrice(currentPlan);
  const newPrice = parseFloat(String(plan.price));
  
  if (newPrice <= currentPrice) {
    return apiError(400, 'INVALID_UPGRADE', 
      'Cannot downgrade or lateral move. Please contact support.', 
      context.request, { startTime });
  }
}
```

---

### 8. Feature Access Errors Default to Denial
**File:** `featureGating.ts:27-50`  
**Risk:** On ANY error (network, database, timeout), access is denied with generic message. Legitimate users are locked out due to transient errors.

**Fix:**
```typescript
export function checkFeatureAccess(
  userPlan: string,
  feature: string,
  userPurchases: any[] = [],
  currentUsage?: Record<string, number>,
  userId?: string,
  retryCount: number = 0
): FeatureAccessResult {
  try {
    // ... existing logic
  } catch (error) {
    // Retry once on transient errors
    if (retryCount === 0 && isTransientError(error)) {
      return checkFeatureAccess(userPlan, feature, userPurchases, currentUsage, userId, 1);
    }
    
    // For paid plans, fail open (grant access) on errors
    const shouldFailOpen = userPlan !== PLAN_IDS.PAY_AS_YOU_GO;
    
    return {
      hasAccess: shouldFailOpen,
      reason: shouldFailOpen 
        ? 'Temporary verification issue - access granted' 
        : 'Unable to verify access. Please refresh the page.',
      upgradeRequired: false,
    };
  }
}
```

---

### 9. Deprecated Function Not Removed
**File:** `create-freemium-subscription.ts:31-35`  
**Risk:** `validateRequest()` is marked deprecated but still exported and used. Comment says "kept for backward compatibility" but this is a NEW file.

**Fix:** Remove deprecated function entirely and use `validateCreateFreemiumRequest` directly.

---

### 10. N+1 Query Pattern in Feature Gating
**File:** `FeatureGate.jsx:15-16`  
**Risk:** useFeatureGate hook queries subscription for each feature check. Multiple FeatureGate components on same page = multiple identical queries.

**Fix:**
```typescript
// Create a context provider
export function FeatureGateProvider({ children }) {
  const { subscriptionData } = useSubscriptionQuery();
  const [featureCache, setFeatureCache] = useState({});
  
  const checkFeature = useCallback((feature) => {
    if (featureCache[feature]) return featureCache[feature];
    
    const result = checkFeatureAccess(subscriptionData?.plan, feature);
    setFeatureCache(prev => ({ ...prev, [feature]: result }));
    return result;
  }, [subscriptionData, featureCache]);
  
  return (
    <FeatureGateContext.Provider value={{ checkFeature }}>
      {children}
    </FeatureGateContext.Provider>
  );
}
```

---

### 11. Error Logging Only Logs to Console
**File:** `errorLogging.ts:30-42`  
**Risk:** Comment says "In production, this would send to monitoring service" but it doesn't. All errors only go to console. No alerting, no aggregation, no monitoring.

**Fix:**
```typescript
export function logError(error: ErrorLog): void {
  console.error(JSON.stringify(error));
  
  // Send to monitoring service in production
  if (!import.meta.env.DEV) {
    Sentry.captureException(new Error(error.errorMessage), {
      tags: {
        errorType: error.errorType,
        userId: error.userId,
      },
      contexts: {
        subscription: error.context,
      },
    });
  }
}
```

---

## 🟡 MEDIUM — Fix in follow-up PR



### 13. Tight Coupling to Supabase
**Files:** Multiple files  
**Risk:** Direct Supabase client usage throughout handlers. No repository pattern or data access layer. Makes testing difficult, creates vendor lock-in.

**Fix:**
```typescript
// subscriptionRepository.ts
export class SubscriptionRepository {
  constructor(private supabase: SupabaseClient) {}
  
  async findActiveByUserId(userId: string): Promise<Subscription | null> {
    const { data, error } = await this.supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle();
    
    if (error) throw new RepositoryError(error);
    return data;
  }
  
  async create(subscription: CreateSubscriptionDto): Promise<Subscription> {
    // ... implementation
  }
}
```

---

### 14. Mixed Responsibilities in Handlers
**File:** `create-freemium-subscription.ts`  
**Risk:** Handler does auth check, validation, business logic, caching, audit logging. Violates Single Responsibility Principle.

**Fix:**
```typescript
// freemiumSubscriptionService.ts
export class FreemiumSubscriptionService {
  constructor(
    private subscriptionRepo: SubscriptionRepository,
    private planRepo: PlanRepository,
    private auditLogger: AuditLogger
  ) {}
  
  async createFreemiumSubscription(userId: string, email: string): Promise<Subscription> {
    const plan = await this.planRepo.findByCode('freemium');
    if (!plan) throw new PlanNotFoundError();
    
    const existing = await this.subscriptionRepo.findActiveByUserId(userId);
    if (existing) throw new SubscriptionExistsError();
    
    const subscription = await this.subscriptionRepo.create({
      userId,
      email,
      planId: plan.id,
    });
    
    await this.auditLogger.logSubscriptionCreation(userId, 'freemium', 'success');
    return subscription;
  }
}
```

---



### 16. Inconsistent Error Response Formats
**Files:** Multiple files  
**Risk:** Some use apiError(), some use apiDbError(), some use apiValidationError(). Frontend must handle multiple error shapes.

**Fix:**
```typescript
export interface StandardErrorResponse {
  error: {
    code: string;
    message: string;
    details?: any;
    timestamp: string;
    requestId?: string;
  };
}

export function createErrorResponse(
  status: number,
  code: string,
  message: string,
  details?: any,
  request?: Request
): Response {
  const response: StandardErrorResponse = {
    error: {
      code,
      message,
      details,
      timestamp: new Date().toISOString(),
      requestId: request?.headers.get('x-request-id') || undefined,
    },
  };
  
  return new Response(JSON.stringify(response), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
```

---

---

### 18. Dashboard Freemium Overlay Doesn't Prevent Interaction
**File:** `Dashboard.jsx:2953-2956`  
**Risk:** Overlay div has cursor-not-allowed but no pointer-events: none. Users can still click through and interact with locked features.

**Fix:**
```jsx
{isFreemium && !isViewingOthersProfile && (
  <div className="absolute inset-0 rounded-xl z-10 cursor-not-allowed pointer-events-auto  " />
)}
```

---




```

---


## ✅ What's Done Well

- All 6 CRITICAL issues have been fixed and verified (#1-6 all resolved as of May 15, 2026)
- Comprehensive validation utilities for request bodies
- Database-level constraints ensure data integrity
- Frontend error handling with user-friendly messages
- Optimistic UI updates for good UX
- Separation of concerns in frontend components

---

**Document Version:** 1.0  
**Created:** May 15, 2026  
**Note:** Rate limiting and caching issues have been excluded as requested.

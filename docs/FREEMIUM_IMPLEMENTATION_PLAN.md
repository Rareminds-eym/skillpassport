# Freemium Tier Implementation Plan

## Executive Summary

This document outlines the comprehensive implementation plan for enhancing the signup and subscription functionality with a **Freemium tier**. Users will have the option to start with a **₹0 plan (Freemium)**, access the dashboard immediately, and upgrade to a paid plan when they need features.

### Key Points

**CRITICAL CLARIFICATIONS:**

1. **Freemium tier has NO features enabled** - Only dashboard access is free (₹0). Everything else requires upgrading to a paid plan.

2. **Simplified Approach** - No separate welcome page:
   - Freemium tier appears as ₹0 plan card in subscription plans page
   - Clicking "Start Free" bypasses Razorpay and auto-creates subscription
   - All paid plans go through normal Razorpay payment flow
   - When users try locked features, they see upgrade prompts
   - They navigate directly to subscription plans page to upgrade

3. **Minimal Database Changes** - We're using existing infrastructure:
   - ✅ **No new tables needed** - Use existing `subscription_plans` and `subscriptions` tables
   - ✅ **Simple migration** - Just add freemium plan (plan_code: `freemium`) to `subscription_plans`

4. **Pricing Strategy**:
   - Freemium: ₹0 (dashboard only)
   - Basic Plan: ₹499/month
   - Professional Plan: ₹749/month
   - Premium Plan: ₹999/month
   - Users upgrade to unlock all features at once

---

## Quick Start TODO

### Database (Day 1-2)
- [ ] Add `freemium` plan to `subscription_plans` table (₹0, no features)
- [ ] Verify existing `subscriptions` table is ready

### Backend API (Day 3-5)
- [ ] Update `subscriptionPlans.js` - add `PAY_AS_YOU_GO` to plan hierarchy
- [ ] Create `/api/subscription/create-pay-as-you-go` endpoint
- [ ] Update feature gating logic in `featureGating.ts`
- [ ] Update feature gating logic in `featureGating.ts`

### Frontend (Day 6-10)
- [ ] Add Freemium plan card to `SubscriptionPlans.jsx` (₹0 tier, plan_code: `freemium`)
- [ ] Update `UnifiedSignup.tsx` - redirect to subscription plans page (no change needed)
- [ ] Bypass Razorpay payment for Freemium tier (auto-create subscription)
- [ ] Add Freemium banner to dashboard with "View Plans" button
- [ ] Create `FeatureLockOverlay.tsx` - lock features with upgrade prompts
- [ ] Create `UpgradePrompt.tsx` - show plan upgrade options
- [ ] Update `SubscriptionPlans.jsx` - handle upgrade from Freemium

### Payment Integration (Day 11-13)
- [ ] Integrate Razorpay for plan subscriptions
- [ ] Handle upgrade from Freemium to paid plan
- [ ] Create payment verification webhook
- [ ] Update subscription status after successful payment

### Testing (Day 14-16)
- [ ] Test signup → Freemium flow
- [ ] Test feature locking/unlocking
- [ ] Test upgrade from Freemium to paid plan
- [ ] Test payment success/failure scenarios
- [ ] Test dashboard banner and navigation

### Launch (Day 17-20)
- [ ] Deploy to staging
- [ ] Beta test with 50-100 users
- [ ] Monitor metrics (signup rate, conversion rate)
- [ ] Deploy to production
- [ ] Monitor system health

---

## Table of Contents

1. [Current System Analysis](#1-current-system-analysis)
2. [Proposed Architecture](#2-proposed-architecture)
3. [Phase 1: Database & Backend](#phase-1-database--backend)
4. [Phase 2: Frontend Changes](#phase-2-frontend-changes)
5. [Phase 3: Feature Gating & Access Control](#phase-3-feature-gating--access-control)
6. [Phase 4: Dashboard & UX](#phase-4-dashboard--ux)
7. [Phase 5: Payment & Billing](#phase-5-payment--billing)
8. [Testing Strategy](#testing-strategy)
9. [Risks & Mitigation](#risks--mitigation)

---

## User Flow Diagrams

### **Flow 1: New User Signup → Freemium**

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. SIGNUP PAGE (UnifiedSignup.tsx)                             │
│    User fills 2-step form:                                      │
│    • Step 1: Name, Email, Password                              │
│    • Step 2: Role, Location, Terms                              │
│    [Sign Up Button] ──────────────────────────────────────────┐ │
└─────────────────────────────────────────────────────────────────┘ │
                                                                    │
                                                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. SUBSCRIPTION PLANS PAGE (Existing - with new ₹0 tier)       │
│                                                                  │
│    ┌──────────────────────┐  ┌──────────────────────┐         │
│    │ Freemium ⭐     │  │ Basic Plan           │         │
│    │ ₹0 - Start Free      │  │ ₹499/month           │         │
│    │                      │  │                      │         │
│    │ ✓ Dashboard access   │  │ ✓ 5 assessments/mo   │         │
│    │ ✓ Profile creation   │  │ ✓ 3 projects         │         │
│    │ ✓ Browse jobs        │  │ ✓ 5GB storage        │         │
│    │                      │  │                      │         │
│    │ [Start Free] ────────┼──┤ [Select Plan]        │         │
│    └──────────────────────┘  └──────────────────────┘         │
│                                                                  │
│    ┌──────────────────────┐  ┌──────────────────────┐         │
│    │ Professional Plan    │  │ Premium Plan         │         │
│    │ ₹749/month           │  │ ₹999/month           │         │
│    └──────────────────────┘  └──────────────────────┘         │
└─────────────────────────────────────────────────────────────────┘
         │                              │
         │ (Bypass Razorpay)            │ (Go to Razorpay)
         ▼                              ▼
┌─────────────────────────────────────────┐    ┌──────────────────────────┐
│ 3A. DASHBOARD (Freemium)          │    │ 3B. RAZORPAY PAYMENT     │
│     Auto-created subscription           │    │     Complete payment     │
│                                         │    │     ↓                    │
│ ╔═══════════════════════════════════╗  │    │ Redirect to dashboard    │
│ ║ You're on Freemium           ║  │    │ with full access         │
│ ║ Upgrade to unlock all features    ║  │    └──────────────────────────┘
│ ║ [View Plans]                      ║  │
│ ╚═══════════════════════════════════╝  │
│                                         │
│ Dashboard Content:                      │
│ • Profile section (unlocked)            │
│ • Opportunities/Jobs (unlocked)         │
│ • Assessments (🔒 LOCKED)              │
│ • Projects (🔒 LOCKED)                 │
│ • Analytics (🔒 LOCKED)                │
│ • Career features (🔒 LOCKED)          │
└─────────────────────────────────────────┘
```

### **Flow 2: Accessing Locked Features**

```
┌─────────────────────────────────────────────────────────────────┐
│ 4. USER CLICKS LOCKED FEATURE (e.g., "Take Assessment")        │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ 5. FEATURE LOCK OVERLAY (FeatureLockOverlay.tsx) ★ NEW         │
│                                                                  │
│    ┌────────────────────────────────────────────────┐          │
│    │ 🔒 Assessments                                 │          │
│    │                                                │          │
│    │ Upgrade to unlock this feature                 │          │
│    │                                                │          │
│    │ This feature is available in:                  │          │
│    │ • Basic Plan (₹499/month)                      │          │
│    │ • Professional Plan (₹749/month)               │          │
│    │ • Premium Plan (₹999/month)                    │          │
│    │                                                │          │
│    │ ┌────────────────────────────────────────┐   │          │
│    │ │ Upgrade to Professional Plan           │   │          │
│    │ └────────────────────────────────────────┘   │          │
│    │                                                │          │
│    │ ┌────────────────────────────────────────┐   │          │
│    │ │ View All Plans                         │   │          │
│    │ └────────────────────────────────────────┘   │          │
│    └────────────────────────────────────────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ 6. SUBSCRIPTION PLANS PAGE (Existing)                          │
│                                                                  │
│     ┌──────────┐  ┌──────────┐  ┌──────────┐                  │
│     │ Basic    │  │ Pro ⭐   │  │ Premium  │                  │
│     │ ₹499/mo  │  │ ₹749/mo  │  │ ₹999/mo  │                  │
│     │          │  │          │  │          │                  │
│     │ [Select] │  │ [Select] │  │ [Select] │                  │
│     └──────────┘  └──────────┘  └──────────┘                  │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ 7. PAYMENT & SUBSCRIPTION ACTIVATION                           │
│    • Complete Razorpay payment                                  │
│    • Activate subscription                                      │
│    • Unlock all plan features                                   │
│    • Redirect to dashboard with full access                     │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ 8. BACK TO DASHBOARD - ALL FEATURES UNLOCKED! ✅               │
│                                                                  │
│    Dashboard Content:                                           │
│    • Profile section (unlocked)                                 │
│    • Opportunities/Jobs (unlocked)                              │
│    • Assessments (✅ UNLOCKED)                                 │
│    • Projects (✅ UNLOCKED)                                    │
│    • Analytics (✅ UNLOCKED)                                   │
│    • Career features (✅ UNLOCKED)                             │
│    • All plan features available                                │
└─────────────────────────────────────────────────────────────────┘
```

### **Component Summary**

**New Components:**
- `FeatureLockOverlay.tsx` - Blur locked features with upgrade prompt
- `UpgradePrompt.tsx` - Show plan upgrade options

**Modified Components:**
- `SubscriptionPlans.jsx` - Add pay-as-you-go (₹0) plan card, bypass Razorpay for this tier
- `Dashboard.jsx` - Add Freemium banner with "View Plans" button

**Key Changes:**
- ✅ No separate welcome page needed
- ✅ Freemium appears as first option in plans page
- ✅ Clicking "Start Free" bypasses Razorpay and auto-creates subscription
- ✅ All other plans go through normal Razorpay payment flow

**Key User Experience:**
- ✅ Frictionless Signup - No payment required to start
- ✅ Clear Value Proposition - See what's locked, understand plan benefits
- ✅ Simple Upgrade Path - Direct navigation to subscription plans
- ✅ No Complex Purchasing - Just choose a plan and unlock everything
- ✅ Seamless Payment - Razorpay integration for plan subscription

---

## 1. Current System Analysis

### 1.1 Signup Flow (Current)

**File: `src/features/auth/ui/UnifiedSignup.tsx`**

```
User Registration (2-step form)
  ↓
Step 1: Personal Details
  - First Name, Last Name, DOB
  - Email, Phone (optional)
  - Password, Confirm Password
  ↓
Step 2: Role & Location
  - Role Selection (learner, educator, admin, recruiter)
  - Country, State, City
  - Language, Referral Code
  - Terms Agreement
  ↓
SSO Account Creation
  - ssoClient.signup() or ssoClient.signupMember()
  ↓
App Profile Creation
  - POST /api/user/signup
  ↓
Redirect to Subscription Plans
  - navigate(`/subscription/plans/${entityType}/purchase`)
```


### 1.2 Current Subscription Model

**Database Schema: `subscription_plans` table**

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `plan_code` | TEXT | 'basic', 'professional', 'enterprise', 'enterprise_ecosystem' |
| `name` | TEXT | Display name |
| `business_type` | TEXT | 'b2b' (institutional) or 'b2c' (individual) |
| `entity_type` | TEXT | 'school', 'college', 'university', 'recruitment', 'all' |
| `role_type` | TEXT | 'student', 'educator', 'admin', 'recruiter', 'all' |
| `price` | DECIMAL | Plan price |
| `duration` | TEXT | 'month', 'year', 'person' |
| `features` | JSONB | Array of feature strings |
| `max_users` | INTEGER | For B2B plans (seat limits) |
| `is_active` | BOOLEAN | Active status |

**Current Plan Hierarchy:**
```javascript
// src/shared/config/subscriptionPlans.js
PLAN_HIERARCHY = [
  'basic',           // Entry level
  'professional',    // Mid tier
  'enterprise',      // High tier
  'enterprise_ecosystem' // Highest tier
]
```

**Pricing Examples (from database):**
- Basic Individual: ₹499/month or ₹4,999/year
- Professional Individual: ₹749/month or ₹7,499/year
- Premium: ₹999/month or ₹9,999/year

### 1.3 Feature Gating Mechanism

**Components:**
- `SubscriptionGate` - Wraps components requiring subscription
- `FeatureGate` - Checks specific feature access
- `SubscriptionProtectedRoute` - Guards routes
- `meetsMinimumPlan()` - Compares plan hierarchy

**Files:**
- `src/features/subscription/lib/featureGating.ts`
- `src/features/subscription/ui/shared/SubscriptionGate.jsx`
- `src/features/subscription/ui/shared/FeatureGate.jsx`


---

## 2. Proposed Architecture

### 2.1 New User Journey

```
User Registration (Unchanged)
  ↓
Redirect to Subscription Plans Page (Unchanged)
  ↓
Plans Page with Freemium Option (NEW ₹0 tier added)
  ├─→ Option 1: Select Freemium (₹0)
  │     ↓
  │   Bypass Razorpay (no payment needed)
  │     ↓
  │   Auto-create Freemium subscription
  │     ↓
  │   Redirect to Dashboard (only dashboard access)
  │
  ├─→ Option 2: Select Basic/Professional/Premium Plan
  │     ↓
  │   Go to Razorpay Payment
  │     ↓
  │   Complete Payment
  │     ↓
  │   Create Subscription
  │     ↓
  │   Redirect to Dashboard (full access)
```

### 2.2 Freemium Plan Features

**CRITICAL: Freemium has NO features enabled after signup**

**Included (Free - ₹0):**
- ✅ Dashboard access (view only)
- ✅ Profile creation
- ✅ Browse platform
- ✅ View pricing
- ✅ Access opportunities/jobs page (view and browse jobs)

**Everything Else is LOCKED and Must Be Unlocked by Upgrading to a Plan:**
- 🔒 Assessments
- 🔒 Projects
- 🔒 Storage
- 🔒 Analytics
- 🔒 Portfolio builder
- 🔒 Career paths
- 🔒 Mock interviews
- 🔒 Resume builder
- 🔒 LinkedIn optimization
- 🔒 Certificates
- 🔒 Career AI Assistant
- 🔒 AI Job Matching
- 🔒 Video Portfolio
- 🔒 All other features

**To Unlock Features: Upgrade to a Subscription Plan**
- Users must choose Basic/Professional/Enterprise plans to unlock features
- No individual feature purchases available
- Plans include bundles of features at better value
- Plans include bundles of features at discounted rates
- More economical for heavy users

### 2.3 Subscription Plans (Upgrade Options)

**Freemium users can upgrade to any of these plans:**

**Basic Plan**: ₹499/month
- Essential tools for individual learning
- 5 assessments per month
- 3 projects
- 5GB storage
- Basic analytics
- Email support

**Professional Plan**: ₹749/month (Recommended)
- Advanced features for serious learners
- 20 assessments per month
- 10 projects
- 20GB storage
- Advanced analytics
- Career pathways
- Interview prep
- Priority support
- Resume builder

**Premium Plan**: ₹999/month
- Complete toolkit for maximum career success
- Unlimited assessments
- Unlimited projects
- 50GB storage
- Premium analytics
- All career pathways
- Mock interviews
- 1-on-1 mentorship
- Verified certificates
- LinkedIn optimization
- Placement assistance

**Note:** Users on the Freemium tier must upgrade to a subscription plan to unlock features.


---

## Phase 1: Database & Backend

### 1.1 Database Schema Changes

#### A. Add Freemium Plan to `subscription_plans`

**Migration File: `supabase/migrations/YYYYMMDDHHMMSS_add_freemium_plan.sql`**

```sql
-- Add Freemium plan (₹0 with NO features)
INSERT INTO public.subscription_plans (
  plan_code,
  name,
  business_type,
  entity_type,
  role_type,
  price,
  duration,
  features,
  is_active,
  positioning,
  tagline,
  ideal_for,
  storage_limit,
  created_at,
  updated_at
) VALUES (
  'freemium',
  'Freemium',
  'b2c',
  'all',
  'all',
  0.00,
  'lifetime',
  '[
    "dashboard_access",
    "profile_creation",
    "marketplace_access",
    "view_pricing"
  ]'::jsonb,
  true,
  'Start free. Pay only for what you use. No commitments.',
  'Zero upfront cost',
  'Users who want maximum flexibility',
  '0GB',
  NOW(),
  NOW()
);

-- Update plan hierarchy comment
COMMENT ON TABLE public.subscription_plans IS 
'Master table for subscription plan definitions. 
Plan hierarchy: freemium < basic < professional < enterprise < enterprise_ecosystem';
```

#### B. Verify Migration

After adding the Freemium plan, verify:
- Plan exists in `subscription_plans` table
- `plan_code = 'freemium'`
- `price = 0.00`
- `is_active = true`

**No other database changes needed** - We're using existing tables for subscriptions.

---
#### A. Update Plan Configuration

**File: `src/shared/config/subscriptionPlans.js`**

```javascript
/**
 * Plan code identifiers — must match plan_code values in Supabase subscription_plans table.
 */
export const PLAN_IDS = {
  PAY_AS_YOU_GO: 'freemium',  // NEW - Pay per feature
  BASIC: 'basic',
  PROFESSIONAL: 'professional',
  ENTERPRISE: 'enterprise',
  ECOSYSTEM: 'enterprise_ecosystem',
};

/**
 * Ordered hierarchy of plan codes from lowest to highest tier.
 * Used only for access-control comparisons.
 */
export const PLAN_HIERARCHY = [
  PLAN_IDS.PAY_AS_YOU_GO,    // Lowest tier (₹0, no features)
  PLAN_IDS.BASIC,
  PLAN_IDS.PROFESSIONAL,
  PLAN_IDS.ENTERPRISE,
  PLAN_IDS.ECOSYSTEM,
];

/**
 * Freemium plan has NO included features
 * Everything must be purchased
 */
export const PAY_AS_YOU_GO_FEATURES = {
  dashboard_access: true,      // Only dashboard viewing
  profile_creation: true,      // Can create profile
  marketplace_access: true,    // Can browse marketplace
  view_pricing: true,          // Can see prices
  opportunities_access: true,  // Can view and browse jobs/opportunities
  // Everything else is locked
  assessments: false,
  projects: false,
  storage: false,
  analytics: false,
  portfolio: false,
  career_paths: false,
  mock_interviews: false,
  resume_builder: false,
  certificates: false,
};
```

#### C. Create Feature Usage API Service

**File: `src/entities/subscription/api/featureUsageService.ts`**

```typescript
import { supabase } from '@/shared/api/supabaseClient';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('feature-usage-service');

export interface FeatureUsage {
  feature_code: string;
  usage_count: number;
  limit: number;
  remaining: number;
  percentage_used: number;
}

/**
 * Get monthly usage for a specific feature
 */
export async function getMonthlyUsage(
  userId: string,
  featureCode: string
): Promise<number> {
  const { data, error } = await supabase
    .rpc('get_monthly_usage', {
      p_user_id: userId,
      p_feature_code: featureCode
    });

  if (error) {
    logger.error('Error getting monthly usage', error);
    return 0;
  }

  return data || 0;
}

/**
 * Check if user can use a feature (within limits)
 */
export async function checkFeatureLimit(
  userId: string,
  featureCode: string,
  limit: number
): Promise<boolean> {
  const { data, error } = await supabase
    .rpc('check_monthly_limit', {
      p_user_id: userId,
      p_feature_code: featureCode,
      p_limit: limit
    });

  if (error) {
    logger.error('Error checking feature limit', error);
    return false;
  }

  return data || false;
}

/**
 * Increment feature usage
 */
export async function incrementUsage(
  userId: string,
  featureCode: string,
  metadata?: Record<string, any>
): Promise<void> {
  const { error } = await supabase
    .rpc('increment_feature_usage', {
      p_user_id: userId,
      p_feature_code: featureCode,
      p_metadata: metadata ? JSON.stringify(metadata) : null
    });

  if (error) {
    logger.error('Error incrementing usage', error);
    throw error;
  }
}

/**
 * Get all feature usage stats for user
 */
export async function getUserFeatureStats(
  userId: string,
  planLimits: Record<string, number>
): Promise<FeatureUsage[]> {
  const stats: FeatureUsage[] = [];

  for (const [featureCode, limit] of Object.entries(planLimits)) {
    const usage = await getMonthlyUsage(userId, featureCode);
    const remaining = Math.max(0, limit - usage);
    const percentage = limit > 0 ? (usage / limit) * 100 : 0;

    stats.push({
      feature_code: featureCode,
      usage_count: usage,
      limit,
      remaining,
      percentage_used: Math.min(100, percentage),
    });
  }

  return stats;
}

export default {
  getMonthlyUsage,
  checkFeatureLimit,
  incrementUsage,
  getUserFeatureStats,
};
```


---

## Phase 2: Frontend Changes

### 2.1 Update Subscription Plans Page

**File: `src/features/subscription/ui/individual/SubscriptionPlans.jsx`**

Add pay-as-you-go (₹0) plan card and bypass Razorpay for this tier:

```jsx
// Around line 602, in the SubscriptionPlans component
function SubscriptionPlans() {
  // ... existing code ...

  // Add Freemium plan to the plans array
  const allPlans = useMemo(() => {
    if (!plans || plans.length === 0) return [];
    
    // Check if Freemium plan exists in DB
    const hasFreemium = plans.some(p => p.plan_code === 'freemium');
    
    if (hasFreemium) {
      return plans;
    }
    
    // If not in DB, add it manually (fallback)
    const freemiumPlan = {
      id: 'freemium-temp',
      plan_code: 'freemium',
      name: 'Freemium',
      price: 0,
      duration: 'lifetime',
      tagline: 'Start free, upgrade anytime',
      positioning: 'Perfect for exploring the platform',
      features: [
        'Dashboard access',
        'Profile creation',
        'Browse opportunities/jobs',
        'View pricing'
      ],
      recommended: false,
      contactSales: false,
      isFree: true  // NEW: Flag to bypass Razorpay
    };
    
    return [freemiumPlan, ...plans];
  }, [plans]);

  // Handle plan selection
  const handleSelectPlan = async (plan) => {
    // NEW: Bypass Razorpay for Freemium tier
    if (plan.plan_code === 'freemium' || plan.isFree) {
      try {
        setLoading(true);
        
        // Auto-create Freemium subscription
        const response = await fetch('/api/subscription/create-freemium', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            userId: user.id, 
            email: user.email 
          })
        });

        if (response.ok) {
          // Redirect to dashboard
          const dashboardPath = getDashboardPath(user.role);
          navigate(dashboardPath, {
            state: { message: 'Welcome to Freemium! Upgrade anytime to unlock all features.' }
          });
        } else {
          throw new Error('Failed to create subscription');
        }
      } catch (error) {
        console.error('Error creating Freemium subscription', error);
        setError('Failed to create subscription. Please try again.');
      } finally {
        setLoading(false);
      }
      return;
    }

    // For paid plans, proceed with normal Razorpay flow
    // ... existing Razorpay logic ...
  };

  // ... rest of the component ...
}
```

**Key Changes:**
- Add Freemium plan as first option (₹0)
- Check for `plan_code === 'freemium'` or `isFree` flag
- Bypass Razorpay and auto-create subscription for Freemium tier
- All other plans go through normal Razorpay payment flow

### 2.2 No Changes Needed to Signup Flow

**File: `src/features/auth/ui/UnifiedSignup.tsx`**

No changes needed! The existing flow already redirects to subscription plans page after signup. The Freemium option will now appear as the first plan card.


---


---

## Phase 3: Feature Gating & Access Control

### 3.1 Update Feature Gating Logic

**File: `src/features/subscription/lib/featureGating.ts`**

```typescript
import { PLAN_IDS, PLAN_HIERARCHY } from '@/shared/config/subscriptionPlans';
import type { UserPurchase } from '@/entities/subscription/api/addOnService';

export interface FeatureAccessResult {
  hasAccess: boolean;
  reason?: string;
  upgradeRequired?: boolean;
  addOnAvailable?: string;
}

/**
 * Freemium plan feature definitions
 * ONLY dashboard access is free - everything else must be purchased
 */
export const PAY_AS_YOU_GO_FEATURES: Record<string, boolean> = {
  // Free features
  dashboard_access: true,
  profile_creation: true,
  marketplace_access: true,
  view_pricing: true,
  opportunities_access: true,  // Can view and browse jobs/opportunities
  
  // Everything else is locked (must purchase)
  assessments: false,
  projects: false,
  storage: false,
  analytics: false,
  portfolio: false,
  career_paths: false,
  mock_interviews: false,
  resume_builder: false,
  linkedin_opt: false,
  certificates: false,
  courses: false,
  priority_support: false,
};

/**
 * Check if user has access to a feature
 */
export function checkFeatureAccess(
  userPlan: string,
  feature: string,
  userPurchases: UserPurchase[] = [],
  currentUsage?: Record<string, number>
): FeatureAccessResult {
  // Check if plan is Freemium
  if (userPlan === PLAN_IDS.PAY_AS_YOU_GO) {
    return checkFreemiumAccess(feature, userPurchases);
  }

  // For paid plans, use existing hierarchy logic
  // ... existing logic for other plans ...

  return { hasAccess: true };
}

/**
 * Check Freemium plan access
 * Only dashboard access is free - everything else requires upgrade
 */
function checkFreemiumAccess(
  feature: string,
  userPurchases: UserPurchase[]
): FeatureAccessResult {
  const featureConfig = PAY_AS_YOU_GO_FEATURES[feature];

  // Feature not defined - deny by default
  if (featureConfig === undefined) {
    return {
      hasAccess: false,
      reason: 'This feature must be purchased',
      upgradeRequired: true,
    };
  }

  // If feature is free (dashboard, profile, etc.)
  if (featureConfig === true) {
    return { hasAccess: true };
  }

  // Feature is locked - check if user has purchased it
  const hasPurchase = userPurchases.some(
    purchase =>
      purchase.status === 'active' &&
      purchase.feature_key === feature &&
      (!purchase.expiry_date || new Date(purchase.expiry_date) > new Date()) &&
      (!purchase.remaining_credits || purchase.remaining_credits > 0)
  );

  if (hasPurchase) {
    return { hasAccess: true };
  }

  // No access - must upgrade to a plan
  return {
    hasAccess: false,
    reason: 'Upgrade to a plan to unlock this feature',
    upgradeRequired: true,
    addOnAvailable: feature,
  };
}

/**
 * Get recommended add-on feature key for a feature
 */
function getAddOnForFeature(feature: string): string | undefined {
  // Return the feature_key itself since add-ons are stored by feature_key
  return feature;
}

/**
 * Get feature limits for a plan
 */
export function getFeatureLimits(planCode: string): Record<string, number> {
  if (planCode === PLAN_IDS.PAY_AS_YOU_GO) {
    // Freemium has NO limits because NO features are included
    // Users must upgrade to a plan to unlock features
    return {};
  }

  // Return limits for other plans
  // ... existing logic ...

  return {};
}
```


### 3.2 Create Feature Gate Hook

**File: `src/features/subscription/model/useFeatureAccess.ts`**

```typescript
import { useCallback, useEffect, useState } from 'react';
import { useUser } from '@/shared/model/authStore';
import { useSubscriptionQuery } from './subscriptionStore';
import { fetchUserPurchases, type UserPurchase } from '@/entities/subscription/api/addOnService';
import { getUserFeatureStats } from '@/entities/subscription/api/featureUsageService';
import { checkFeatureAccess, getFeatureLimits, type FeatureAccessResult } from '../lib/featureGating';

export function useFeatureAccess(feature: string) {
  const user = useUser();
  const { subscriptionData } = useSubscriptionQuery();
  const [purchases, setPurchases] = useState<UserPurchase[]>([]);
  const [usage, setUsage] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      loadUserData();
    }
  }, [user?.id]);

  const loadUserData = async () => {
    try {
      const [userPurchases, stats] = await Promise.all([
        fetchUserPurchases(user!.id),
        getUserFeatureStats(user!.id, getFeatureLimits(subscriptionData?.plan_code || PLAN_IDS.PAY_AS_YOU_GO)),
      ]);

      setPurchases(userPurchases);
      
      const usageMap: Record<string, number> = {};
      stats.forEach(stat => {
        usageMap[stat.feature_code] = stat.usage_count;
      });
      setUsage(usageMap);
    } catch (error) {
      console.error('Error loading user data', error);
    } finally {
      setLoading(false);
    }
  };

  const access: FeatureAccessResult = checkFeatureAccess(
    subscriptionData?.plan_code || PLAN_IDS.PAY_AS_YOU_GO,
    feature,
    purchases,
    usage
  );

  const refresh = useCallback(() => {
    loadUserData();
  }, [user?.id]);

  return {
    ...access,
    loading,
    refresh,
  };
}

export function useFeatureLimits() {
  const user = useUser();
  const { subscriptionData } = useSubscriptionQuery();
  const [stats, setStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id && subscriptionData) {
      loadStats();
    }
  }, [user?.id, subscriptionData]);

  const loadStats = async () => {
    try {
      const limits = getFeatureLimits(subscriptionData?.plan_code || PLAN_IDS.PAY_AS_YOU_GO);
      const data = await getUserFeatureStats(user!.id, limits);
      setStats(data);
    } catch (error) {
      console.error('Error loading feature stats', error);
    } finally {
      setLoading(false);
    }
  };

  return {
    stats,
    loading,
    refresh: loadStats,
  };
}
```

### 3.3 Create Upgrade Prompt Component

**File: `src/features/subscription/ui/shared/UpgradePrompt.tsx`**

```tsx
import { ArrowRight, Lock, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface UpgradePromptProps {
  feature: string;
  message: string;
  recommendedPlan?: string;  // e.g., "Professional Plan"
  recommendedPrice?: number; // e.g., 999
}

export default function UpgradePrompt({
  feature,
  message,
  recommendedPlan = "Professional Plan",
  recommendedPrice = 999,
}: UpgradePromptProps) {
  const navigate = useNavigate();

  const handleUpgradePlan = () => {
    navigate('/subscription/plans/learner/purchase');
  };

  const handleViewAllPlans = () => {
    navigate('/subscription/plans/learner/purchase');
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-8">
      <div className="flex items-start gap-4 mb-6">
        <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center flex-shrink-0">
          <Lock className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">{feature}</h3>
          <p className="text-gray-600">{message}</p>
        </div>
      </div>

      <div className="mb-6 p-4 bg-white rounded-xl border border-blue-200">
        <p className="text-sm text-gray-600 mb-2">This feature is available in:</p>
        <ul className="space-y-1 text-sm text-gray-700">
          <li>• Basic Plan (₹499/month)</li>
          <li>• Professional Plan (₹749/month) - Recommended</li>
          <li>• Premium Plan (₹999/month)</li>
        </ul>
      </div>

      <div className="space-y-3">
        <button
          onClick={handleUpgradePlan}
          className="w-full py-4 px-6 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-lg"
        >
          <Sparkles className="w-5 h-5" />
          Upgrade to {recommendedPlan}
          <ArrowRight className="w-5 h-5" />
        </button>

        <button
          onClick={handleViewAllPlans}
          className="w-full py-3 px-6 bg-white border-2 border-blue-300 text-gray-900 font-semibold rounded-xl hover:bg-blue-50 transition-all"
        >
          View All Plans
        </button>
      </div>
    </div>
  );
}
```


---

## Phase 4: Dashboard & UX

### 4.1 Freemium Dashboard Banner

**File: `src/pages/learner/Dashboard.jsx`**

Add at the top of the dashboard (around line 650):

```jsx
import { useFeatureLimits } from '@/features/subscription/model/useFeatureAccess';

const LearnerDashboard = () => {
  // ... existing code ...
  const { subscriptionData } = useSubscriptionQuery();
  const { stats, loading: limitsLoading } = useFeatureLimits();

  const isPayAsYouGo = subscriptionData?.plan_code === 'freemium';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Freemium Banner */}
      {isPayAsYouGo && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b-2 border-blue-200">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 mb-1">
                  You're on Freemium
                </h3>
                <p className="text-sm text-gray-600">
                  Upgrade to a plan to unlock all features
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => navigate('/subscription/plans/learner/purchase')}
                  className="bg-blue-600 text-white px-6 py-2.5 rounded-xl hover:bg-blue-700 font-semibold transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  View Plans
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rest of dashboard */}
      {/* ... existing dashboard content ... */}
    </div>
  );
};

function formatFeatureName(code: string): string {
  const names: Record<string, string> = {
    assessments_per_month: 'Assessments',
    projects: 'Projects',
    storage_gb: 'Storage',
    portfolio_items: 'Portfolio Items',
  };
  return names[code] || code;
}
```

### 4.2 Feature Lock Overlay

**File: `src/features/subscription/ui/shared/FeatureLockOverlay.tsx`**

```tsx
import { Lock } from 'lucide-react';
import { useFeatureAccess } from '@/features/subscription/model/useFeatureAccess';
import UpgradePrompt from './UpgradePrompt';

interface FeatureLockOverlayProps {
  feature: string;
  featureName: string;
  featureDescription: string;
  children: React.ReactNode;
  recommendedPlan?: string;
  recommendedPrice?: number;
}

export default function FeatureLockOverlay({
  feature,
  featureName,
  featureDescription,
  children,
  recommendedPlan,
  recommendedPrice,
}: FeatureLockOverlayProps) {
  const { hasAccess, loading } = useFeatureAccess(feature);

  if (loading) {
    return <div className="animate-pulse bg-gray-100 rounded-2xl h-64" />;
  }

  if (hasAccess) {
    return <>{children}</>;
  }

  return (
    <div className="relative">
      {/* Blurred Content */}
      <div className="pointer-events-none select-none blur-sm opacity-50">
        {children}
      </div>

      {/* Lock Overlay */}
      <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm rounded-2xl">
        <div className="max-w-md w-full p-6">
          <UpgradePrompt
            feature={featureName}
            message={featureDescription}
            recommendedPlan={recommendedPlan}
            recommendedPrice={recommendedPrice}
          />
        </div>
      </div>
    </div>
  );
}
```

### 4.3 Usage Progress Indicator

**File: `src/features/subscription/ui/shared/UsageProgressBar.tsx`**

```tsx
import { AlertCircle } from 'lucide-react';

interface UsageProgressBarProps {
  label: string;
  current: number;
  limit: number;
  unit?: string;
}

export default function UsageProgressBar({
  label,
  current,
  limit,
  unit = '',
}: UsageProgressBarProps) {
  const percentage = Math.min(100, (current / limit) * 100);
  const isWarning = percentage >= 80;
  const isCritical = percentage >= 100;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-gray-700">{label}</span>
        <span className={`font-bold ${isCritical ? 'text-red-600' : isWarning ? 'text-amber-600' : 'text-gray-900'}`}>
          {current}/{limit} {unit}
        </span>
      </div>

      <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`absolute inset-y-0 left-0 rounded-full transition-all duration-300 ${
            isCritical
              ? 'bg-red-500'
              : isWarning
              ? 'bg-amber-500'
              : 'bg-blue-500'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {isCritical && (
        <div className="flex items-center gap-2 text-xs text-red-600">
          <AlertCircle className="w-4 h-4" />
          <span>Limit reached. Upgrade to continue.</span>
        </div>
      )}
    </div>
  );
}
```


---

## Phase 5: Payment & Billing

### 5.1 Create Freemium Subscription API

**File: `functions/api/subscription/create-freemium.ts`**

```typescript
import { supabase } from '@/shared/api/supabaseClient';

export async function onRequestPost(context: any) {
  try {
    const { userId, email } = await context.request.json();

    if (!userId || !email) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get Freemium plan from database
    const { data: plan, error: planError } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('plan_code', 'freemium')
      .eq('is_active', true)
      .single();

    if (planError || !plan) {
      return new Response(JSON.stringify({ error: 'Freemium plan not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Create subscription record
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .insert({
        user_id: userId,
        email,
        plan_id: plan.id,
        plan_type: 'Free Trial',
        plan_amount: 0,
        billing_cycle: 'lifetime',
        status: 'active',
        auto_renew: false,
        subscription_start_date: new Date().toISOString(),
        subscription_end_date: null, // No expiry for freemium
      })
      .select()
      .single();

    if (subError) {
      console.error('Error creating freemium subscription:', subError);
      return new Response(JSON.stringify({ error: 'Failed to create subscription' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true, subscription }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in create-freemium:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
```

### 5.3 Upgrade from Freemium Service

**File: `src/entities/subscription/api/upgradeService.ts`**

```typescript
import { ssoClient } from '@/shared/api/ssoClient';
import { getApiUrl } from '@/shared/api/apiUtils';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('upgrade-service');

export interface UpgradeRequest {
  userId: string;
  currentSubscriptionId: string;
  newPlanCode: string;
  billingCycle: 'month' | 'year';
}

export interface UpgradeResult {
  success: boolean;
  orderId?: string;
  paymentUrl?: string;
  message?: string;
  error?: string;
}

/**
 * Upgrade from Freemium to paid plan
 */
export async function upgradeFromFreemium(
  request: UpgradeRequest
): Promise<UpgradeResult> {
  try {
    const PAYMENT_API_URL = getApiUrl('payments');

    const response = await ssoClient.fetch(`${PAYMENT_API_URL}/subscription/upgrade`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Upgrade failed');
    }

    const result = await response.json();
    return { success: true, ...result };
  } catch (error: any) {
    logger.error('Error upgrading subscription', error);
    return { success: false, error: error.message };
  }
}

/**
 * Migrate add-on entitlements when upgrading
 */
export async function migrateAddOnEntitlements(
  userId: string,
  oldPlanCode: string,
  newPlanCode: string
): Promise<void> {
  try {
    const SUBSCRIPTION_API_URL = getApiUrl('subscription');

    await ssoClient.fetch(`${SUBSCRIPTION_API_URL}/migrate-entitlements`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, oldPlanCode, newPlanCode }),
    });
  } catch (error) {
    logger.error('Error migrating entitlements', error);
    // Non-critical error, don't throw
  }
}

export default {
  upgradeFromFreemium,
  migrateAddOnEntitlements,
};
```

---

## Testing Strategy

### Unit Tests

**Test Files to Create:**

1. **Feature Gating Logic**
   - `src/features/subscription/lib/__tests__/featureGating.test.ts`
   - Test Freemium access checks
   - Test feature lock checks
   - Test upgrade flow

2. **Add-On Service**
   - `src/entities/subscription/api/__tests__/addOnService.test.ts`
   - Test catalog fetching
   - Test user add-on queries
   - Test active add-on checks

3. **Feature Usage Service**
   - `src/entities/subscription/api/__tests__/featureUsageService.test.ts`
   - Test usage tracking
   - Test limit checks
   - Test monthly reset logic

### Integration Tests

1. **Signup to Freemium Flow**
   - User completes signup
   - Redirected to subscription plans page
   - Selects pay-as-you-go (₹0) plan
   - Subscription auto-created (Razorpay bypassed)
   - Redirected to dashboard

2. **Feature Access Flow**
   - Freemium user accesses locked feature
   - Sees upgrade prompt
   - Navigates to plans page and upgrades

3. **Add-On Purchase Flow**
   - User browses add-on marketplace
   - Adds items to cart
   - Completes checkout
   - Add-on activated
   - Feature unlocked

### End-to-End Tests

**Test Scenarios:**

1. **New User Freemium Journey**
   ```
   Sign up → Subscription Plans Page (with ₹0 tier) → 
   Select Freemium → Auto-create subscription (bypass Razorpay) → 
   Dashboard with limited access (only dashboard + opportunities/jobs)
   ```

2. **Direct Paid Plan Selection Journey**
   ```
   Sign up → Subscription Plans Page → 
   Select paid plan (Basic/Professional/Premium) → Razorpay payment → Complete payment → 
   Access dashboard with all features unlocked
   ```

3. **Freemium to Paid Upgrade Journey**
   ```
   Freemium user → Click any locked feature → 
   See upgrade prompt with plan options → Click "View All Plans" → 
   Navigate to plans page → Choose plan → Complete Razorpay payment → All features unlocked
   ```

### Manual Testing Checklist

- [ ] Freemium subscription creation works (bypasses Razorpay)
- [ ] Freemium plan card appears first in subscription plans page
- [ ] Dashboard shows Freemium banner with "View Plans" button
- [ ] Feature locks work correctly (all features except dashboard locked)
- [ ] Upgrade prompts display properly and navigate to plans page
- [ ] Plans page loads correctly from upgrade prompts
- [ ] Payment integration works for paid plan subscriptions
- [ ] All features unlock after successful plan purchase
- [ ] Razorpay is bypassed only for Freemium tier
- [ ] Navigation from locked features to plans page works smoothly


---

---

## Risks & Mitigation



### Business Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| **Revenue cannibalization** | High | High | No free features (only dashboard), compelling upgrade prompts |
| **Abuse of free tier** | Low | Low | No features to abuse (only dashboard access) |
| **Low conversion rate** | High | Medium | A/B testing, optimize upgrade prompts, clear value proposition |
| **Support burden increase** | Medium | High | Self-service resources, limit support for free users |
| **User frustration with locked features** | Medium | Medium | Clear messaging, smooth navigation to plans page |




### A/B Testing Plan

**Test 1: Plan Card Positioning**
- Variant A: Freemium first (left-most position)
- Variant B: Freemium last (right-most position)
- Metric: Freemium selection rate

**Test 2: Upgrade Prompt Timing**
- Variant A: Show immediately when clicking locked feature
- Variant B: Show after 2-3 seconds of viewing locked content
- Metric: Click-through rate to plans page

**Test 3: Upgrade Prompt Messaging**
- Variant A: "Upgrade to unlock this feature"
- Variant B: "Choose a plan to access all features"
- Metric: Conversion rate

**Test 4: Dashboard Banner Design**
- Variant A: Prominent banner with gradient background
- Variant B: Subtle banner with minimal design
- Metric: "View Plans" button click rate


---

## Timeline & Resource Allocation

### Development Timeline (20-28 Days)

| Phase | Duration | Team Members | Deliverables |
|-------|----------|--------------|--------------|
| **Phase 1: Database & Backend** | 3-5 days | 2 Backend Devs | Database schema, API endpoints, services |
| **Phase 2: Frontend** | 5-7 days | 2 Frontend Devs | Plans page updates (add ₹0 tier), Razorpay bypass logic, upgrade prompts |
| **Phase 3: Feature Gating** | 3-4 days | 1 Backend, 1 Frontend | Access control, feature locks, navigation |
| **Phase 4: Dashboard UX** | 2-3 days | 1 Frontend Dev | Banners, prompts, locked feature overlays |
| **Phase 5: Payment** | 4-5 days | 1 Backend, 1 Frontend | Plan purchase flows, payment integration |
| **Testing & QA** | 3-4 days | 1 QA Engineer | Test cases, bug fixes |

**Total: 20-28 days**

### Budget Estimate

| Category | Cost (INR) | Notes |
|----------|------------|-------|
| **Development** | ₹4,00,000 | 4 developers × 25 days × ₹4,000/day |
| **QA** | ₹80,000 | 1 QA × 20 days × ₹4,000/day |
| **Design** | ₹40,000 | 0.5 designer × 20 days × ₹4,000/day |
| **Infrastructure** | ₹20,000 | Database, testing environments |
| **Payment Gateway** | ₹10,000 | Razorpay setup, testing |
| **Contingency (20%)** | ₹1,10,000 | Buffer for unexpected issues |
| **Total** | **₹6,60,000** | ~$8,000 USD |


---

## Appendix

### A. Database Schema Reference

**Complete ERD:**

```
subscription_plans
├── id (PK)
├── plan_code (pay_as_you_go, basic, professional, enterprise)
├── name
├── price
├── duration
├── features (JSONB)
└── is_active

subscriptions
├── id (PK)
├── user_id (FK → auth.users)
├── plan_id (FK → subscription_plans)
├── status
├── subscription_start_date
└── subscription_end_date
```

**Note:** We're using existing tables only. No new tables needed for freemium implementation.

### B. API Endpoints Reference

**Subscription Endpoints:**
- `POST /api/subscription/create-freemium` - Create Freemium subscription (bypasses Razorpay)
- `POST /api/subscription/upgrade` - Upgrade from Freemium to paid plan
- `GET /api/subscription/plans` - Get all subscription plans
- `GET /api/subscription/user/:userId` - Get user's current subscription

**Feature Access Endpoints:**
- `POST /api/subscription/check-access/:userId/:feature` - Check if user has access to a feature

### C. Environment Variables

```bash
# Razorpay
VITE_RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=xxxxx

# Supabase
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxxxx
SUPABASE_SERVICE_ROLE_KEY=xxxxx

# API URLs
VITE_API_BASE_URL=https://api.skillpassport.in
VITE_PAYMENT_API_URL=https://payments.skillpassport.in

# Feature Flags
VITE_ENABLE_FREEMIUM=true
VITE_ENABLE_UPGRADE_PROMPTS=true
```



---

## Conclusion

This implementation plan provides a comprehensive roadmap for adding a Freemium tier to the SkillPassport platform. The phased approach ensures:

1. **Lower Barrier to Entry**: Users can explore without payment
2. **Simplified Monetization**: Direct path from free to paid plans
3. **Better User Experience**: Clear upgrade paths and value propositions
4. **Data-Driven Optimization**: Metrics and A/B testing for continuous improvement

**Key Approach:**
- Freemium has NO features enabled (only dashboard access)
- Users see upgrade prompts when trying locked features
- Direct navigation to subscription plans page (no add-on marketplace)
- Simple choice: stay free or upgrade to unlock everything

**Next Steps:**
1. Review and approve this plan
2. Allocate resources and set timeline
3. Begin Phase 1: Database & Backend development
4. Regular progress reviews and adjustments

---

**Document Version:** 1.0  
**Last Updated:** January 2026  
**Author:** Development Team  
**Status:** Ready for Review

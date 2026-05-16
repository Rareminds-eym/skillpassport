# Design Document: Freemium Tier Implementation

## Overview

This design document outlines the technical implementation of a Freemium tier subscription model for the SkillPassport platform. The Freemium tier enables users to sign up without payment, access the dashboard with limited features, and upgrade to paid plans when ready.

### Goals

1. **Lower Barrier to Entry**: Allow users to explore the platform without payment commitment
2. **Clear Value Proposition**: Demonstrate platform value through limited free access
3. **Seamless Upgrade Path**: Enable frictionless conversion from Freemium to paid plans
4. **Minimal Infrastructure Changes**: Leverage existing subscription system with minimal modifications

### Key Design Decisions

- **Database Strategy**: Use existing `subscription_plans` and `subscriptions` tables; add single Freemium plan row
- **Payment Bypass**: Implement conditional logic to skip Razorpay for ₹0 plans
- **Feature Gating**: Extend existing feature access control to handle Freemium tier
- **UI Integration**: Add Freemium card to existing subscription plans page
- **No Separate Welcome Page**: Freemium appears as first option in plans page

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Signup Flow                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Subscription Plans Page                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │  Freemium    │  │    Basic     │  │ Professional │         │
│  │    ₹0        │  │   ₹499/mo    │  │   ₹749/mo    │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└─────────────────────────────────────────────────────────────────┘
         │                              │
         │ (Bypass Payment)             │ (Razorpay Flow)
         ▼                              ▼
┌──────────────────────┐      ┌──────────────────────┐
│  Auto-Create         │      │  Payment Gateway     │
│  Subscription        │      │  (Razorpay)          │
└──────────────────────┘      └──────────────────────┘
         │                              │
         └──────────────┬───────────────┘
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│                         Dashboard                                │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Freemium Banner: "Upgrade to unlock all features"       │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ✓ Dashboard Access    ✓ Profile Creation                      │
│  ✓ Browse Jobs         🔒 Assessments (Locked)                 │
│  ✓ View Pricing        🔒 Projects (Locked)                    │
│                        🔒 Analytics (Locked)                    │
└─────────────────────────────────────────────────────────────────┘
```

### System Components

#### 1. Database Layer
- **subscription_plans table**: Stores Freemium plan definition
- **subscriptions table**: Tracks user subscription status
- **No new tables required**: Leverage existing schema

#### 2. Backend Services
- **Plan Configuration**: Update plan hierarchy and feature definitions
- **Subscription API**: Create Freemium subscription endpoint
- **Feature Gating Service**: Extend access control logic

#### 3. Frontend Components
- **SubscriptionPlans.jsx**: Display Freemium card, handle payment bypass
- **Dashboard**: Show Freemium banner and locked features
- **FeatureLockOverlay**: Block access to premium features
- **UpgradePrompt**: Guide users to upgrade

#### 4. Payment Integration
- **Conditional Payment Flow**: Bypass Razorpay for Freemium
- **Upgrade Flow**: Handle Freemium to paid plan transitions

## Components and Interfaces

### Database Schema

#### subscription_plans Table (Existing - Add Freemium Row)

```sql
-- Freemium Plan Definition
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
  'pay_as_you_go',
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
    "view_pricing",
    "opportunities_access",
    "courses_listing_access"
  ]'::jsonb,
  true,
  'Start free. Upgrade anytime to unlock all features.',
  'Zero upfront cost',
  'Users who want to explore the platform',
  '0GB',
  NOW(),
  NOW()
);
```

**Key Fields:**
- `plan_code`: 'pay_as_you_go' (unique identifier)
- `price`: 0.00 (triggers payment bypass)
- `duration`: 'lifetime' (no expiration)
- `features`: JSON array of free features
- `business_type`: 'b2c' (individual users)
- `entity_type`: 'all' (available to all user types)
- `role_type`: 'all' (available to all roles)

#### subscriptions Table (Existing - No Changes)

```sql
-- Existing schema - no modifications needed
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  plan_id UUID REFERENCES subscription_plans(id),
  status TEXT, -- 'active', 'cancelled', 'expired'
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### Backend Configuration

#### Plan Hierarchy Configuration

**File**: `src/shared/config/subscriptionPlans.js`

```javascript
/**
 * Plan code identifiers
 */
export const PLAN_IDS = {
  PAY_AS_YOU_GO: 'pay_as_you_go',  // NEW - Freemium tier
  BASIC: 'basic',
  PROFESSIONAL: 'professional',
  ENTERPRISE: 'enterprise',
  ECOSYSTEM: 'enterprise_ecosystem',
};

/**
 * Ordered hierarchy of plan codes from lowest to highest tier
 */
export const PLAN_HIERARCHY = [
  PLAN_IDS.PAY_AS_YOU_GO,    // Lowest tier (₹0, limited features)
  PLAN_IDS.BASIC,
  PLAN_IDS.PROFESSIONAL,
  PLAN_IDS.ENTERPRISE,
  PLAN_IDS.ECOSYSTEM,
];

/**
 * Freemium plan feature configuration
 * Only these features are accessible on Freemium tier
 */
export const PAY_AS_YOU_GO_FEATURES = {
  // Free features
  dashboard_access: true,
  profile_creation: true,
  marketplace_access: true,
  view_pricing: true,
  opportunities_access: true,
  courses_listing_access: true,
  
  // Locked features (require upgrade)
  assessments: false,
  projects: false,
  storage: false,
  analytics: false,
  portfolio: false,
  career_paths: false,
  mock_interviews: false,
  resume_builder: false,
  certificates: false,
  course_enrollment: false,
  priority_support: false,
};
```

#### Feature Gating Service

**File**: `src/features/subscription/lib/featureGating.ts`

```typescript
import { PLAN_IDS, PAY_AS_YOU_GO_FEATURES } from '@/shared/config/subscriptionPlans';

export interface FeatureAccessResult {
  hasAccess: boolean;
  reason?: string;
  upgradeRequired?: boolean;
  availableInPlans?: string[];
}

/**
 * Check if user has access to a feature based on their plan
 */
export function checkFeatureAccess(
  userPlan: string,
  feature: string,
  userPurchases: any[] = [],
  currentUsage?: Record<string, number>
): FeatureAccessResult {
  // Handle Freemium tier
  if (userPlan === PLAN_IDS.PAY_AS_YOU_GO) {
    return checkFreemiumAccess(feature);
  }

  // Handle other plans (existing logic)
  // ... existing implementation ...

  return { hasAccess: true };
}

/**
 * Check Freemium plan access
 */
function checkFreemiumAccess(feature: string): FeatureAccessResult {
  const featureConfig = PAY_AS_YOU_GO_FEATURES[feature];

  // Feature not defined - deny by default
  if (featureConfig === undefined) {
    return {
      hasAccess: false,
      reason: 'This feature requires a paid plan',
      upgradeRequired: true,
      availableInPlans: ['basic', 'professional', 'premium'],
    };
  }

  // Feature is free
  if (featureConfig === true) {
    return { hasAccess: true };
  }

  // Feature is locked
  return {
    hasAccess: false,
    reason: 'Upgrade to a paid plan to unlock this feature',
    upgradeRequired: true,
    availableInPlans: ['basic', 'professional', 'premium'],
  };
}

/**
 * Get feature limits for a plan
 */
export function getFeatureLimits(planCode: string): Record<string, number> {
  if (planCode === PLAN_IDS.PAY_AS_YOU_GO) {
    // Freemium has no usage limits because features are locked
    return {};
  }

  // Return limits for other plans (existing logic)
  // ... existing implementation ...

  return {};
}
```

### API Endpoints

#### Create Freemium Subscription

**Endpoint**: `POST /api/subscription/create-freemium`

**Request Body**:
```typescript
interface CreateFreemiumRequest {
  userId: string;
  email: string;
}
```

**Response**:
```typescript
interface CreateFreemiumResponse {
  success: boolean;
  subscription: {
    id: string;
    userId: string;
    planCode: string;
    status: string;
    startDate: string;
    endDate: string | null;
  };
}
```

**Implementation** (Cloudflare Worker):
```typescript
// functions/api/subscription/create-freemium.ts
export async function onRequestPost(context) {
  const { request, env } = context;
  
  try {
    const { userId, email } = await request.json();
    
    // Validate input
    if (!userId || !email) {
      return new Response(
        JSON.stringify({ error: 'Missing userId or email' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Get Freemium plan from database
    const { data: plan, error: planError } = await env.SUPABASE
      .from('subscription_plans')
      .select('*')
      .eq('plan_code', 'pay_as_you_go')
      .eq('is_active', true)
      .single();
    
    if (planError || !plan) {
      return new Response(
        JSON.stringify({ error: 'Freemium plan not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Create subscription
    const { data: subscription, error: subError } = await env.SUPABASE
      .from('subscriptions')
      .insert({
        user_id: userId,
        plan_id: plan.id,
        status: 'active',
        start_date: new Date().toISOString(),
        end_date: null, // Lifetime subscription
      })
      .select()
      .single();
    
    if (subError) {
      return new Response(
        JSON.stringify({ error: 'Failed to create subscription' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        subscription: {
          id: subscription.id,
          userId: subscription.user_id,
          planCode: plan.plan_code,
          status: subscription.status,
          startDate: subscription.start_date,
          endDate: subscription.end_date,
        },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error creating Freemium subscription:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
```

### Frontend Components

#### SubscriptionPlans Component Updates

**File**: `src/features/subscription/ui/individual/SubscriptionPlans.jsx`

**Key Changes**:

1. **Add Freemium Plan to Plans Array**:
```javascript
const allPlans = useMemo(() => {
  if (!plans || plans.length === 0) return [];
  
  // Check if Freemium plan exists in DB
  const hasFreemium = plans.some(p => p.plan_code === 'pay_as_you_go');
  
  if (hasFreemium) {
    return plans;
  }
  
  // Fallback: Add Freemium plan manually if not in DB
  const freemiumPlan = {
    id: 'freemium-temp',
    plan_code: 'pay_as_you_go',
    name: 'Freemium',
    price: 0,
    duration: 'lifetime',
    tagline: 'Start free, upgrade anytime',
    positioning: 'Perfect for exploring the platform',
    features: [
      'Dashboard access',
      'Profile creation',
      'Browse opportunities/jobs',
      'Browse courses (view only)',
      'View pricing'
    ],
    recommended: false,
    contactSales: false,
    isFree: true
  };
  
  return [freemiumPlan, ...plans];
}, [plans]);
```

2. **Handle Plan Selection with Payment Bypass**:
```javascript
const handleSelectPlan = async (plan) => {
  // Bypass Razorpay for Freemium tier
  if (plan.plan_code === 'pay_as_you_go' || plan.isFree) {
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
          state: { 
            message: 'Welcome! Upgrade anytime to unlock all features.' 
          }
        });
      } else {
        throw new Error('Failed to create subscription');
      }
    } catch (error) {
      console.error('Error creating Freemium subscription', error);
      toast.error('Failed to create subscription. Please try again.');
    } finally {
      setLoading(false);
    }
    return;
  }

  // For paid plans, proceed with normal Razorpay flow
  // ... existing Razorpay logic ...
};
```

#### Dashboard Freemium Banner

**File**: `src/features/dashboard/ui/Dashboard.jsx`

```jsx
import { useSubscriptionQuery } from '@/features/subscription/model';
import { PLAN_IDS } from '@/shared/config/subscriptionPlans';

function Dashboard() {
  const { subscriptionData } = useSubscriptionQuery();
  const isFreemium = subscriptionData?.planCode === PLAN_IDS.PAY_AS_YOU_GO;

  return (
    <div className="dashboard-container">
      {/* Freemium Banner */}
      {isFreemium && (
        <div className="bg-gradient-to-r from-amber-50 to-amber-100 border-2 border-amber-200 rounded-2xl p-6 mb-8 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-amber-400 flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  You're on Freemium
                </h3>
                <p className="text-sm text-slate-600">
                  Upgrade to unlock all features
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/subscription/plans/learner/purchase')}
              className="px-6 py-3 bg-gradient-to-r from-slate-800 to-slate-900 text-white rounded-xl font-semibold hover:from-slate-900 hover:to-black transition-all shadow-lg hover:shadow-xl"
            >
              View Plans
            </button>
          </div>
        </div>
      )}

      {/* Dashboard Content */}
      {/* ... existing dashboard content ... */}
    </div>
  );
}
```

#### Feature Lock Overlay Component

**File**: `src/features/subscription/ui/shared/FeatureLockOverlay.tsx`

```tsx
import { Lock, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { checkFeatureAccess } from '@/features/subscription/lib/featureGating';
import { useSubscriptionQuery } from '@/features/subscription/model';

interface FeatureLockOverlayProps {
  feature: string;
  featureName: string;
  children: React.ReactNode;
}

export function FeatureLockOverlay({ 
  feature, 
  featureName, 
  children 
}: FeatureLockOverlayProps) {
  const navigate = useNavigate();
  const { subscriptionData } = useSubscriptionQuery();
  
  const accessResult = checkFeatureAccess(
    subscriptionData?.planCode || '',
    feature
  );

  if (accessResult.hasAccess) {
    return <>{children}</>;
  }

  return (
    <div className="relative">
      {/* Blurred Content */}
      <div className="filter blur-sm pointer-events-none select-none">
        {children}
      </div>

      {/* Lock Overlay */}
      <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm">
        <div className="max-w-md w-full mx-4 bg-white rounded-2xl shadow-2xl border-2 border-slate-200 p-8">
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center mb-4">
              <Lock className="h-8 w-8 text-white" />
            </div>
            
            <h3 className="text-2xl font-bold text-slate-900 mb-2">
              {featureName}
            </h3>
            
            <p className="text-slate-600 mb-6">
              Upgrade to unlock this feature
            </p>

            {accessResult.availableInPlans && (
              <div className="mb-6 text-sm text-slate-500">
                Available in:{' '}
                <span className="font-semibold text-slate-700">
                  {accessResult.availableInPlans.join(', ')}
                </span>
              </div>
            )}

            <div className="flex flex-col gap-3 w-full">
              <button
                onClick={() => navigate('/subscription/plans/learner/purchase')}
                className="w-full px-6 py-3 bg-gradient-to-r from-slate-800 to-slate-900 text-white rounded-xl font-semibold hover:from-slate-900 hover:to-black transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              >
                <TrendingUp className="h-5 w-5" />
                View All Plans
              </button>
              
              <button
                onClick={() => window.history.back()}
                className="w-full px-6 py-3 border-2 border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-all"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

#### Upgrade Prompt Component

**File**: `src/features/subscription/ui/shared/UpgradePrompt.tsx`

```tsx
import { X, TrendingUp, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface UpgradePromptProps {
  featureName: string;
  availablePlans: Array<{
    name: string;
    price: number;
    duration: string;
    recommended?: boolean;
  }>;
  onClose: () => void;
}

export function UpgradePrompt({ 
  featureName, 
  availablePlans, 
  onClose 
}: UpgradePromptProps) {
  const navigate = useNavigate();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="max-w-2xl w-full mx-4 bg-white rounded-3xl shadow-2xl border-2 border-slate-200 p-8 relative">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
        >
          <X className="h-5 w-5 text-slate-600" />
        </button>

        <div className="mb-8">
          <h2 className="text-3xl font-light text-slate-900 mb-2" 
              style={{ fontFamily: 'Georgia, Cambria, "Times New Roman", serif' }}>
            Unlock {featureName}
          </h2>
          <p className="text-slate-600">
            Choose a plan to access this feature
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {availablePlans.map((plan) => (
            <div
              key={plan.name}
              className={`relative p-6 rounded-2xl border-2 transition-all hover:shadow-lg ${
                plan.recommended
                  ? 'border-slate-900 bg-slate-50'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              {plan.recommended && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-gradient-to-r from-amber-400 to-amber-500 text-slate-900 px-3 py-1 rounded-full text-xs font-bold">
                    Recommended
                  </span>
                </div>
              )}

              <h3 className="text-xl font-semibold text-slate-900 mb-2">
                {plan.name}
              </h3>
              
              <div className="mb-4">
                <span className="text-3xl font-bold text-slate-900">
                  ₹{plan.price}
                </span>
                <span className="text-slate-500">/{plan.duration}</span>
              </div>

              <div className="flex items-center gap-2 text-sm text-emerald-600 mb-4">
                <Check className="h-4 w-4" />
                <span>Includes {featureName}</span>
              </div>

              <button
                onClick={() => {
                  navigate('/subscription/plans/learner/purchase');
                  onClose();
                }}
                className={`w-full py-3 rounded-xl font-semibold transition-all ${
                  plan.recommended
                    ? 'bg-gradient-to-r from-slate-800 to-slate-900 text-white hover:from-slate-900 hover:to-black shadow-lg'
                    : 'bg-slate-100 text-slate-900 hover:bg-slate-200'
                }`}
              >
                Select Plan
              </button>
            </div>
          ))}
        </div>

        <button
          onClick={() => {
            navigate('/subscription/plans/learner/purchase');
            onClose();
          }}
          className="w-full py-4 border-2 border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-all"
        >
          View All Plans
        </button>
      </div>
    </div>
  );
}
```

## Data Models

### Subscription Plan Model

```typescript
interface SubscriptionPlan {
  id: string;
  plan_code: string;
  name: string;
  business_type: 'b2c' | 'b2b';
  entity_type: string;
  role_type: string;
  price: number;
  duration: string;
  features: string[];
  is_active: boolean;
  positioning?: string;
  tagline?: string;
  ideal_for?: string;
  storage_limit?: string;
  created_at: string;
  updated_at: string;
}
```

### Subscription Model

```typescript
interface Subscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: 'active' | 'cancelled' | 'expired' | 'paused';
  start_date: string;
  end_date: string | null;
  created_at: string;
  updated_at: string;
}
```

### Feature Access Result Model

```typescript
interface FeatureAccessResult {
  hasAccess: boolean;
  reason?: string;
  upgradeRequired?: boolean;
  availableInPlans?: string[];
}
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After analyzing all acceptance criteria, I identified several areas where properties can be consolidated to eliminate redundancy:

**Consolidation Decisions:**
1. **Freemium Feature Access (5.1-5.7)**: Combined into single property testing all free features
2. **Payment Bypass Logic (12.1-12.4)**: Combined into single property testing bypass conditions
3. **Subscription Creation Fields (2.2-2.4)**: Combined into single property testing all required fields
4. **Feature Access Check Results (14.3-14.5)**: Combined into single property testing return values
5. **Analytics Events (20.1-20.6)**: Combined into single property testing event logging

### Property 1: Payment Gateway Bypass for Free Plans

*For any* plan selection where plan_code equals 'pay_as_you_go' OR isFree flag is true, the Payment Gateway SHALL NOT be invoked and subscription SHALL be created directly.

**Validates: Requirements 2.1, 12.1, 12.2, 12.3**

### Property 2: Freemium Subscription Creation Completeness

*For any* Freemium subscription creation, the subscription record SHALL have status 'active', start_date set to current timestamp, and end_date set to null.

**Validates: Requirements 2.2, 2.3, 2.4**

### Property 3: Freemium Feature Access Grants

*For any* user with plan_code 'pay_as_you_go', checkFeatureAccess SHALL return hasAccess: true for all features in the set {dashboard_access, profile_creation, marketplace_access, view_pricing, opportunities_access, courses_listing_access}.

**Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5, 5.6**

### Property 4: Freemium Feature Access Denials

*For any* user with plan_code 'pay_as_you_go' and any feature NOT in the free features set, checkFeatureAccess SHALL return hasAccess: false with upgradeRequired: true.

**Validates: Requirements 5.7, 5.8**

### Property 5: Paid Plan Payment Gateway Invocation

*For any* plan selection where plan_code is NOT 'pay_as_you_go' AND isFree is NOT true, the Payment Gateway SHALL be initiated.

**Validates: Requirements 3.1, 12.4**

### Property 6: Successful Payment Subscription Creation

*For any* successful payment completion, the Subscription System SHALL create an active subscription record with the selected plan and unlock all features included in that plan.

**Validates: Requirements 3.3, 3.4**


### Property 7: Dashboard Freemium Banner Display

*For any* user with plan_code 'pay_as_you_go' accessing the Dashboard, a banner SHALL be displayed; for any user with a paid plan, the banner SHALL NOT be displayed.

**Validates: Requirements 6.1, 6.6**

### Property 8: Locked Feature UI Indicators

*For any* locked feature displayed to a Freemium user, a lock icon SHALL be shown and clicking the feature SHALL display an Upgrade Prompt.

**Validates: Requirements 7.1, 7.4**

### Property 9: Upgrade Prompt Plan Information

*For any* Upgrade Prompt displayed, it SHALL list which paid plans include the requested feature.

**Validates: Requirements 7.5**

### Property 10: Freemium to Paid Upgrade Preservation

*For any* Freemium user upgrading to a paid plan with successful payment, the existing subscription record SHALL be updated (not duplicated) with the new plan_id and start_date set to current timestamp.

**Validates: Requirements 8.2, 8.3**

### Property 11: Upgrade Feature Unlock

*For any* successful upgrade from Freemium to a paid plan, all features included in the new plan SHALL be accessible and the Freemium banner SHALL be removed.

**Validates: Requirements 8.4, 8.6**

### Property 12: Failed Upgrade State Preservation

*For any* failed upgrade payment, the Freemium subscription SHALL remain unchanged and an error message SHALL be displayed.

**Validates: Requirements 8.7**

### Property 13: Plan Hierarchy Ordering

*For any* two plans (planA, planB) where planA appears before planB in PLAN_HIERARCHY, planA SHALL be considered lower tier than planB for access control comparisons.

**Validates: Requirements 9.2**


### Property 14: Signup Redirect to Plans Page

*For any* completed user signup, the system SHALL redirect to the Subscription Plans Page with correct URL path /subscription/plans/{entityType}/purchase.

**Validates: Requirements 11.1, 11.3**

### Property 15: Freemium API Endpoint Validation

*For any* request to /api/subscription/create-freemium, if userId or email is missing/invalid, the endpoint SHALL return 400 status; if valid, it SHALL create a subscription and return 200 status; if creation fails, it SHALL return 500 status.

**Validates: Requirements 13.2, 13.3, 13.4, 13.5, 13.6**

### Property 16: Feature Access Check Return Structure

*For any* call to checkFeatureAccess, the return value SHALL be a FeatureAccessResult object containing hasAccess, reason, upgradeRequired, and availableInPlans fields.

**Validates: Requirements 14.6**

### Property 17: Freemium Feature Configuration Usage

*For any* feature access check where userPlan is 'pay_as_you_go', the function SHALL evaluate access using PAY_AS_YOU_GO_FEATURES configuration and return hasAccess: true if feature is true, hasAccess: false with upgradeRequired: true if feature is false or undefined.

**Validates: Requirements 14.2, 14.3, 14.4, 14.5**

### Property 18: Subscription State Synchronization

*For any* subscription creation or update, the user's session state SHALL be updated immediately and cached subscription data SHALL be invalidated.

**Validates: Requirements 15.1, 15.3**

### Property 19: Subscription Query Retry Logic

*For any* subscription query failure, the system SHALL retry up to 3 times before displaying an error.

**Validates: Requirements 15.5**

### Property 20: Feature Access Error Handling

*For any* feature access check failure, the Feature Gate SHALL default to denying access and log the error with userId, planCode, timestamp, and error details.

**Validates: Requirements 16.5, 16.6**


### Property 21: Pricing Display Consistency

*For any* plan displayed across multiple UI components (Subscription Plans Page, Upgrade Prompt), the pricing SHALL be identical and formatted as "₹{amount}" or "₹{amount}/month".

**Validates: Requirements 17.5, 17.7**

### Property 22: Current Plan Highlighting

*For any* user accessing the Subscription Plans Page, their current plan card SHALL be highlighted with "Current Plan" badge and the button SHALL be disabled.

**Validates: Requirements 18.1, 18.3, 18.4, 18.5**

### Property 23: Upgrade Button Text for Freemium Users

*For any* Freemium user viewing paid plans on the Subscription Plans Page, the buttons SHALL display "Upgrade" instead of "Select Plan".

**Validates: Requirements 18.2**

### Property 24: Feature Gate Access Rendering

*For any* user with access to a feature, the FeatureGate component SHALL render its children; for any user without access, it SHALL render the fallback or default Upgrade Prompt.

**Validates: Requirements 19.2, 19.3**

### Property 25: Feature Gate Error Handling

*For any* error during feature access check in FeatureGate component, access SHALL be denied.

**Validates: Requirements 19.6**

### Property 26: Analytics Event Logging Completeness

*For any* analytics event logged (freemium_signup, feature_lock_interaction, upgrade_intent, freemium_conversion, banner_click), the event SHALL include userId, timestamp, and relevant context.

**Validates: Requirements 20.1, 20.2, 20.3, 20.4, 20.5, 20.6**

### Property 27: Subscription Creation Round Trip

*For any* valid subscription creation request, creating a subscription and then querying it SHALL return a subscription with matching userId, planCode, and status 'active'.

**Validates: Requirements 2.2, 13.3**

### Property 28: Payment Bypass Audit Logging

*For any* payment bypass decision (Freemium or paid plan), the system SHALL log the decision with plan_code, userId, and timestamp.

**Validates: Requirements 12.5**


## Error Handling

### Error Categories

#### 1. Subscription Creation Errors

**Scenario**: Freemium subscription creation fails
- **Error Message**: "Failed to create subscription. Please try again."
- **User Action**: Retry button displayed
- **System Action**: Log error with userId, timestamp, error details
- **Recovery**: Allow user to retry subscription creation

**Scenario**: Database connection failure during subscription creation
- **Error Message**: "Service temporarily unavailable. Please try again later."
- **User Action**: Return to plans page
- **System Action**: Log error, alert monitoring system
- **Recovery**: Implement exponential backoff retry logic

#### 2. Payment Processing Errors

**Scenario**: Payment gateway initialization fails
- **Error Message**: "Payment system unavailable. Please try again later."
- **User Action**: Return to subscription plans page
- **System Action**: Log error with plan_code, userId, timestamp
- **Recovery**: Allow user to retry payment

**Scenario**: Payment verification fails
- **Error Message**: "Payment verification failed. Contact support if amount was deducted."
- **User Action**: Contact support link provided
- **System Action**: Log payment details, create support ticket
- **Recovery**: Manual verification by support team

**Scenario**: Upgrade payment fails
- **Error Message**: "Upgrade failed. Your current plan remains active."
- **User Action**: Retry upgrade or contact support
- **System Action**: Maintain Freemium subscription, log error
- **Recovery**: Freemium subscription unchanged, allow retry

#### 3. Feature Access Errors

**Scenario**: Feature access check fails (service error)
- **Error Message**: None (silent failure)
- **User Action**: Feature access denied
- **System Action**: Default to denying access, log error with userId, feature, planCode, timestamp
- **Recovery**: Retry on next access attempt

**Scenario**: Feature gate component error
- **Error Message**: "Unable to verify access. Please refresh the page."
- **User Action**: Refresh page
- **System Action**: Log error, deny access by default
- **Recovery**: Page refresh re-initializes component

#### 4. Session State Errors

**Scenario**: Subscription query fails
- **Error Message**: None (background retry)
- **User Action**: None (transparent to user)
- **System Action**: Retry up to 3 times with exponential backoff
- **Recovery**: If all retries fail, show "Unable to load subscription. Please refresh."

**Scenario**: Session state desynchronization
- **Error Message**: "Your session has expired. Please log in again."
- **User Action**: Redirect to login
- **System Action**: Clear session, log event
- **Recovery**: User re-authenticates

### Error Logging Standards

All errors SHALL be logged with the following structure:

```typescript
interface ErrorLog {
  timestamp: string;
  userId: string;
  errorType: string;
  errorMessage: string;
  context: {
    planCode?: string;
    feature?: string;
    endpoint?: string;
    statusCode?: number;
    [key: string]: any;
  };
  stackTrace?: string;
}
```

### Error Monitoring

- **Critical Errors**: Payment failures, subscription creation failures
  - Alert: Immediate notification to on-call engineer
  - SLA: Response within 15 minutes

- **High Priority Errors**: Feature access check failures, session state errors
  - Alert: Notification within 1 hour
  - SLA: Response within 4 hours

- **Low Priority Errors**: UI rendering errors, non-critical validation errors
  - Alert: Daily summary report
  - SLA: Response within 24 hours


## Testing Strategy

### Dual Testing Approach

The testing strategy employs both **unit tests** and **property-based tests** to ensure comprehensive coverage:

- **Unit Tests**: Verify specific examples, edge cases, and error conditions
- **Property Tests**: Verify universal properties across all inputs
- **Integration**: Both approaches are complementary and necessary for complete validation

### Unit Testing

Unit tests focus on:
- **Specific Examples**: Concrete scenarios with known inputs and outputs
- **Edge Cases**: Boundary conditions and special cases
- **Error Conditions**: Failure scenarios and error handling
- **Integration Points**: Component interactions and API contracts

**Unit Test Examples**:

```typescript
// Example 1: Freemium plan database configuration
describe('Freemium Plan Configuration', () => {
  it('should have pay_as_you_go plan in database with price 0', async () => {
    const plan = await db.subscription_plans
      .findOne({ plan_code: 'pay_as_you_go' });
    
    expect(plan).toBeDefined();
    expect(plan.price).toBe(0.00);
    expect(plan.duration).toBe('lifetime');
    expect(plan.is_active).toBe(true);
  });

  it('should include correct free features', async () => {
    const plan = await db.subscription_plans
      .findOne({ plan_code: 'pay_as_you_go' });
    
    expect(plan.features).toContain('dashboard_access');
    expect(plan.features).toContain('profile_creation');
    expect(plan.features).toContain('marketplace_access');
    expect(plan.features).toContain('view_pricing');
    expect(plan.features).toContain('opportunities_access');
    expect(plan.features).toContain('courses_listing_access');
  });
});

// Example 2: Freemium API endpoint
describe('POST /api/subscription/create-freemium', () => {
  it('should return 400 when userId is missing', async () => {
    const response = await fetch('/api/subscription/create-freemium', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com' })
    });
    
    expect(response.status).toBe(400);
  });

  it('should create subscription and return 200 for valid request', async () => {
    const response = await fetch('/api/subscription/create-freemium', {
      method: 'POST',
      body: JSON.stringify({ 
        userId: 'user-123', 
        email: 'test@example.com' 
      })
    });
    
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.subscription.planCode).toBe('pay_as_you_go');
    expect(data.subscription.status).toBe('active');
  });
});

// Example 3: UI component rendering
describe('SubscriptionPlans Component', () => {
  it('should display Freemium card as first option', () => {
    render(<SubscriptionPlans />);
    
    const planCards = screen.getAllByRole('article');
    expect(planCards[0]).toHaveTextContent('Freemium');
    expect(planCards[0]).toHaveTextContent('₹0');
  });

  it('should show "Start Free" button for Freemium plan', () => {
    render(<SubscriptionPlans />);
    
    expect(screen.getByText('Start Free')).toBeInTheDocument();
  });
});
```

### Property-Based Testing

Property tests verify universal behaviors across many generated inputs. Each property test SHALL:
- Run minimum **100 iterations** (due to randomization)
- Reference its design document property in a comment tag
- Use a property-based testing library (fast-check for JavaScript/TypeScript)

**Property Test Configuration**:

```typescript
import fc from 'fast-check';

// Configure test runs
const TEST_ITERATIONS = 100;
```

**Property Test Examples**:

```typescript
// Property 1: Payment Gateway Bypass for Free Plans
describe('Property 1: Payment Gateway Bypass', () => {
  it('should bypass payment for any free plan', () => {
    /**
     * Feature: freemium-tier-implementation
     * Property 1: For any plan selection where plan_code equals 'pay_as_you_go' 
     * OR isFree flag is true, the Payment Gateway SHALL NOT be invoked
     */
    fc.assert(
      fc.property(
        fc.record({
          plan_code: fc.constantFrom('pay_as_you_go', 'basic', 'professional'),
          isFree: fc.boolean(),
          price: fc.nat()
        }),
        (plan) => {
          const shouldBypass = plan.plan_code === 'pay_as_you_go' || plan.isFree;
          const result = evaluatePaymentBypass(plan);
          
          if (shouldBypass) {
            expect(result.bypassPayment).toBe(true);
            expect(result.invokeGateway).toBe(false);
          } else {
            expect(result.bypassPayment).toBe(false);
            expect(result.invokeGateway).toBe(true);
          }
        }
      ),
      { numRuns: TEST_ITERATIONS }
    );
  });
});

// Property 3: Freemium Feature Access Grants
describe('Property 3: Freemium Feature Access Grants', () => {
  it('should grant access to all free features for Freemium users', () => {
    /**
     * Feature: freemium-tier-implementation
     * Property 3: For any user with plan_code 'pay_as_you_go', 
     * checkFeatureAccess SHALL return hasAccess: true for all free features
     */
    const freeFeatures = [
      'dashboard_access',
      'profile_creation',
      'marketplace_access',
      'view_pricing',
      'opportunities_access',
      'courses_listing_access'
    ];

    fc.assert(
      fc.property(
        fc.record({
          userId: fc.uuid(),
          planCode: fc.constant('pay_as_you_go'),
          feature: fc.constantFrom(...freeFeatures)
        }),
        (user) => {
          const result = checkFeatureAccess(
            user.planCode,
            user.feature
          );
          
          expect(result.hasAccess).toBe(true);
          expect(result.upgradeRequired).toBeUndefined();
        }
      ),
      { numRuns: TEST_ITERATIONS }
    );
  });
});

// Property 4: Freemium Feature Access Denials
describe('Property 4: Freemium Feature Access Denials', () => {
  it('should deny access to locked features for Freemium users', () => {
    /**
     * Feature: freemium-tier-implementation
     * Property 4: For any user with plan_code 'pay_as_you_go' and any 
     * feature NOT in free features set, checkFeatureAccess SHALL return 
     * hasAccess: false with upgradeRequired: true
     */
    const lockedFeatures = [
      'assessments',
      'projects',
      'storage',
      'analytics',
      'portfolio',
      'career_paths',
      'mock_interviews',
      'resume_builder',
      'certificates',
      'course_enrollment'
    ];

    fc.assert(
      fc.property(
        fc.record({
          userId: fc.uuid(),
          planCode: fc.constant('pay_as_you_go'),
          feature: fc.constantFrom(...lockedFeatures)
        }),
        (user) => {
          const result = checkFeatureAccess(
            user.planCode,
            user.feature
          );
          
          expect(result.hasAccess).toBe(false);
          expect(result.upgradeRequired).toBe(true);
          expect(result.availableInPlans).toBeDefined();
        }
      ),
      { numRuns: TEST_ITERATIONS }
    );
  });
});

// Property 10: Freemium to Paid Upgrade Preservation
describe('Property 10: Upgrade Preservation', () => {
  it('should update existing subscription on upgrade, not create duplicate', () => {
    /**
     * Feature: freemium-tier-implementation
     * Property 10: For any Freemium user upgrading to a paid plan, 
     * the existing subscription record SHALL be updated (not duplicated)
     */
    fc.assert(
      fc.property(
        fc.record({
          userId: fc.uuid(),
          currentPlan: fc.constant('pay_as_you_go'),
          newPlan: fc.constantFrom('basic', 'professional', 'premium')
        }),
        async (upgrade) => {
          // Create initial Freemium subscription
          const initialSub = await createSubscription(
            upgrade.userId,
            upgrade.currentPlan
          );
          
          // Perform upgrade
          await upgradeSubscription(
            upgrade.userId,
            upgrade.newPlan
          );
          
          // Verify only one subscription exists
          const subscriptions = await getSubscriptions(upgrade.userId);
          expect(subscriptions.length).toBe(1);
          expect(subscriptions[0].id).toBe(initialSub.id);
          expect(subscriptions[0].planCode).toBe(upgrade.newPlan);
        }
      ),
      { numRuns: TEST_ITERATIONS }
    );
  });
});

// Property 27: Subscription Creation Round Trip
describe('Property 27: Subscription Round Trip', () => {
  it('should retrieve created subscription with matching properties', () => {
    /**
     * Feature: freemium-tier-implementation
     * Property 27: For any valid subscription creation, creating then 
     * querying SHALL return subscription with matching userId, planCode, status
     */
    fc.assert(
      fc.property(
        fc.record({
          userId: fc.uuid(),
          email: fc.emailAddress(),
          planCode: fc.constant('pay_as_you_go')
        }),
        async (request) => {
          // Create subscription
          const created = await createFreemiumSubscription(
            request.userId,
            request.email
          );
          
          // Query subscription
          const retrieved = await getSubscription(created.id);
          
          // Verify round trip
          expect(retrieved.userId).toBe(request.userId);
          expect(retrieved.planCode).toBe(request.planCode);
          expect(retrieved.status).toBe('active');
          expect(retrieved.endDate).toBeNull();
        }
      ),
      { numRuns: TEST_ITERATIONS }
    );
  });
});
```

### Test Coverage Goals

- **Unit Test Coverage**: Minimum 80% code coverage
- **Property Test Coverage**: All 28 correctness properties implemented
- **Integration Test Coverage**: All API endpoints and user flows
- **E2E Test Coverage**: Critical user journeys (signup → Freemium → upgrade)

### Testing Tools

- **Unit Testing**: Jest, React Testing Library
- **Property Testing**: fast-check
- **Integration Testing**: Supertest, MSW (Mock Service Worker)
- **E2E Testing**: Playwright
- **Coverage**: Istanbul/nyc


## Security Considerations

### Authentication and Authorization

#### 1. Subscription Creation Security

**Threat**: Unauthorized subscription creation
- **Mitigation**: Require authenticated user session for /api/subscription/create-freemium
- **Implementation**: Verify JWT token before processing request
- **Validation**: Check userId matches authenticated user

**Threat**: Subscription manipulation
- **Mitigation**: Server-side validation of all subscription operations
- **Implementation**: Never trust client-side plan selection
- **Validation**: Verify plan exists and is active before creating subscription

#### 2. Feature Access Control

**Threat**: Feature access bypass
- **Mitigation**: Server-side feature gating for all protected resources
- **Implementation**: Check subscription status on every API request
- **Validation**: Never rely solely on client-side feature gates

**Threat**: Privilege escalation
- **Mitigation**: Validate plan hierarchy on every access check
- **Implementation**: Use PLAN_HIERARCHY for all comparisons
- **Validation**: Deny access by default if validation fails

#### 3. Payment Security

**Threat**: Payment bypass for paid plans
- **Mitigation**: Server-side validation of payment completion
- **Implementation**: Verify Razorpay signature before activating subscription
- **Validation**: Check payment status with Razorpay API

**Threat**: Price manipulation
- **Mitigation**: Fetch prices from database, never from client
- **Implementation**: Server determines final price
- **Validation**: Verify payment amount matches plan price

### Data Protection

#### 1. Personal Information

**User Data**: userId, email, subscription details
- **Storage**: Encrypted at rest in Supabase
- **Transmission**: HTTPS only
- **Access**: Restricted to authenticated user and admins

**Payment Data**: Handled by Razorpay (PCI DSS compliant)
- **Storage**: Never store payment card details
- **Transmission**: Direct to Razorpay, not through our servers
- **Access**: No access to sensitive payment data

#### 2. Session Management

**Session Tokens**: JWT tokens for authentication
- **Storage**: HttpOnly cookies
- **Expiration**: 24 hours
- **Refresh**: Automatic refresh before expiration

**Subscription Cache**: Cached subscription data
- **Storage**: In-memory cache with TTL
- **Invalidation**: On subscription changes
- **Security**: User-specific, not shared across users

### Input Validation

#### 1. API Endpoints

**Validation Rules**:
- userId: UUID format, matches authenticated user
- email: Valid email format, matches user record
- planCode: Exists in subscription_plans table, is_active = true
- All inputs: Sanitized to prevent injection attacks

**Implementation**:
```typescript
function validateCreateFreemiumRequest(request: any, authUserId: string) {
  if (!request.userId || !isUUID(request.userId)) {
    throw new ValidationError('Invalid userId');
  }
  
  if (request.userId !== authUserId) {
    throw new AuthorizationError('userId mismatch');
  }
  
  if (!request.email || !isValidEmail(request.email)) {
    throw new ValidationError('Invalid email');
  }
  
  return true;
}
```

#### 2. Client-Side Validation

**Purpose**: Improve UX, not security
- **Implementation**: Validate before API calls
- **Security Note**: Always re-validate on server
- **User Feedback**: Immediate error messages

### Rate Limiting

**API Endpoints**:
- `/api/subscription/create-freemium`: 5 requests per minute per user
- `/api/subscription/upgrade`: 10 requests per minute per user
- Feature access checks: 100 requests per minute per user

**Implementation**: Redis-based rate limiting
**Response**: 429 Too Many Requests with Retry-After header

### Audit Logging

**Logged Events**:
- Subscription creation (Freemium and paid)
- Subscription upgrades
- Payment bypass decisions
- Feature access denials
- Authentication failures
- Authorization failures

**Log Format**:
```typescript
interface AuditLog {
  timestamp: string;
  userId: string;
  action: string;
  resource: string;
  result: 'success' | 'failure';
  metadata: Record<string, any>;
  ipAddress: string;
  userAgent: string;
}
```

**Retention**: 90 days in hot storage, 1 year in cold storage


## Performance Considerations

### Response Time Targets

#### API Endpoints
- `/api/subscription/create-freemium`: < 500ms (p95)
- `/api/subscription/upgrade`: < 1000ms (p95)
- Feature access checks: < 50ms (p95)
- Subscription queries: < 200ms (p95)

#### Page Load Times
- Subscription Plans Page: < 2s (p95)
- Dashboard (with subscription check): < 1.5s (p95)
- Feature Lock Overlay: < 100ms (p95)

### Database Optimization

#### 1. Indexing Strategy

**subscription_plans table**:
```sql
CREATE INDEX idx_subscription_plans_plan_code 
  ON subscription_plans(plan_code) 
  WHERE is_active = true;

CREATE INDEX idx_subscription_plans_business_type 
  ON subscription_plans(business_type, entity_type, role_type) 
  WHERE is_active = true;
```

**subscriptions table**:
```sql
CREATE INDEX idx_subscriptions_user_id 
  ON subscriptions(user_id) 
  WHERE status = 'active';

CREATE INDEX idx_subscriptions_plan_id 
  ON subscriptions(plan_id);

CREATE INDEX idx_subscriptions_status_dates 
  ON subscriptions(status, start_date, end_date);
```

#### 2. Query Optimization

**Subscription Lookup**:
```sql
-- Optimized query with single index scan
SELECT s.*, p.plan_code, p.features
FROM subscriptions s
JOIN subscription_plans p ON s.plan_id = p.id
WHERE s.user_id = $1 
  AND s.status = 'active'
LIMIT 1;
```

**Plan Listing**:
```sql
-- Optimized query with filtered index
SELECT *
FROM subscription_plans
WHERE business_type = $1
  AND entity_type IN ($2, 'all')
  AND role_type IN ($3, 'all')
  AND is_active = true
ORDER BY price ASC;
```

### Caching Strategy

#### 1. Subscription Data Caching

**Cache Key**: `subscription:${userId}`
**TTL**: 5 minutes
**Invalidation**: On subscription create/update

```typescript
async function getSubscriptionWithCache(userId: string) {
  const cacheKey = `subscription:${userId}`;
  
  // Try cache first
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }
  
  // Fetch from database
  const subscription = await db.subscriptions
    .findOne({ user_id: userId, status: 'active' });
  
  // Cache result
  if (subscription) {
    await redis.setex(cacheKey, 300, JSON.stringify(subscription));
  }
  
  return subscription;
}
```

#### 2. Plan Data Caching

**Cache Key**: `plans:${businessType}:${entityType}:${roleType}`
**TTL**: 1 hour
**Invalidation**: On plan updates (rare)

```typescript
async function getPlansWithCache(filters: PlanFilters) {
  const cacheKey = `plans:${filters.businessType}:${filters.entityType}:${filters.roleType}`;
  
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }
  
  const plans = await db.subscription_plans.find(filters);
  await redis.setex(cacheKey, 3600, JSON.stringify(plans));
  
  return plans;
}
```

#### 3. Feature Access Cache

**Cache Key**: `feature:${userId}:${feature}`
**TTL**: 1 minute
**Invalidation**: On subscription change

```typescript
async function checkFeatureAccessWithCache(
  userId: string,
  feature: string
) {
  const cacheKey = `feature:${userId}:${feature}`;
  
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }
  
  const subscription = await getSubscriptionWithCache(userId);
  const result = checkFeatureAccess(subscription.planCode, feature);
  
  await redis.setex(cacheKey, 60, JSON.stringify(result));
  
  return result;
}
```

### Frontend Performance

#### 1. Code Splitting

**Lazy Load Components**:
```typescript
// Lazy load heavy components
const FeatureLockOverlay = lazy(() => 
  import('@/features/subscription/ui/shared/FeatureLockOverlay')
);

const UpgradePrompt = lazy(() => 
  import('@/features/subscription/ui/shared/UpgradePrompt')
);
```

#### 2. Memoization

**Expensive Computations**:
```typescript
// Memoize plan filtering
const filteredPlans = useMemo(() => {
  return plans.filter(plan => 
    plan.businessType === businessType &&
    (plan.entityType === entityType || plan.entityType === 'all')
  );
}, [plans, businessType, entityType]);

// Memoize feature access checks
const hasAccess = useMemo(() => {
  return checkFeatureAccess(userPlan, feature);
}, [userPlan, feature]);
```

#### 3. Optimistic Updates

**Subscription Creation**:
```typescript
async function createFreemiumSubscription(userId: string, email: string) {
  // Optimistically update UI
  setSubscription({
    userId,
    planCode: 'pay_as_you_go',
    status: 'active',
    startDate: new Date().toISOString(),
    endDate: null,
  });
  
  try {
    // Make API call
    const result = await api.createFreemium({ userId, email });
    
    // Update with server response
    setSubscription(result.subscription);
  } catch (error) {
    // Rollback on error
    setSubscription(null);
    throw error;
  }
}
```

### Monitoring and Metrics

#### 1. Performance Metrics

**Track**:
- API response times (p50, p95, p99)
- Database query times
- Cache hit rates
- Page load times
- Time to interactive (TTI)

**Tools**: Datadog, New Relic, or similar APM

#### 2. Business Metrics

**Track**:
- Freemium signup rate
- Freemium to paid conversion rate
- Time to conversion
- Feature lock interaction rate
- Upgrade prompt conversion rate

**Tools**: Mixpanel, Amplitude, or similar analytics

#### 3. Alerts

**Performance Alerts**:
- API response time > 2s (p95)
- Database query time > 1s
- Cache hit rate < 80%
- Error rate > 1%

**Business Alerts**:
- Freemium signup rate drops > 20%
- Conversion rate drops > 15%
- Payment failure rate > 5%


## Deployment Strategy

### Phase 1: Database Migration (Day 1)

**Objective**: Add Freemium plan to database

**Steps**:
1. Create migration file: `supabase/migrations/YYYYMMDDHHMMSS_add_freemium_plan.sql`
2. Test migration in development environment
3. Deploy to staging environment
4. Verify plan exists with correct configuration
5. Deploy to production during low-traffic window

**Rollback Plan**: Delete Freemium plan row if issues detected

**Verification**:
```sql
SELECT * FROM subscription_plans WHERE plan_code = 'pay_as_you_go';
```

### Phase 2: Backend Configuration (Day 2-3)

**Objective**: Update plan hierarchy and feature gating logic

**Steps**:
1. Update `subscriptionPlans.js` with PAY_AS_YOU_GO constant
2. Update `featureGating.ts` with Freemium access logic
3. Create `/api/subscription/create-freemium` endpoint
4. Deploy to staging
5. Run integration tests
6. Deploy to production

**Rollback Plan**: Revert code changes, Freemium plan remains in DB but unused

**Verification**:
- Test Freemium subscription creation via API
- Test feature access checks for Freemium users
- Verify payment bypass logic

### Phase 3: Frontend Components (Day 4-6)

**Objective**: Add Freemium UI components

**Steps**:
1. Update `SubscriptionPlans.jsx` with Freemium card
2. Add Dashboard Freemium banner
3. Create `FeatureLockOverlay` component
4. Create `UpgradePrompt` component
5. Deploy to staging
6. Run E2E tests
7. Deploy to production

**Rollback Plan**: Feature flag to hide Freemium option

**Verification**:
- Test Freemium signup flow
- Test locked feature interactions
- Test upgrade flow

### Phase 4: Beta Testing (Day 7-10)

**Objective**: Validate with real users

**Steps**:
1. Enable Freemium for 10% of new signups (feature flag)
2. Monitor metrics and error rates
3. Collect user feedback
4. Fix critical issues
5. Gradually increase to 50%, then 100%

**Success Criteria**:
- < 1% error rate
- > 50% of new signups choose Freemium
- > 5% Freemium to paid conversion within 7 days

**Rollback Plan**: Disable feature flag, redirect to paid plans only

### Phase 5: Full Launch (Day 11+)

**Objective**: Enable Freemium for all users

**Steps**:
1. Remove feature flag
2. Update marketing materials
3. Monitor metrics closely for 48 hours
4. Optimize based on user behavior

**Success Criteria**:
- System stability maintained
- Conversion funnel working as expected
- No critical bugs reported

### Feature Flags

**Flag**: `freemium_enabled`
- **Type**: Boolean
- **Default**: false
- **Environments**: 
  - Development: true
  - Staging: true
  - Production: gradual rollout (10% → 50% → 100%)

**Implementation**:
```typescript
const isFreemiumEnabled = useFeatureFlag('freemium_enabled');

if (isFreemiumEnabled) {
  // Show Freemium option
} else {
  // Show paid plans only
}
```

### Monitoring During Deployment

**Metrics to Watch**:
- Freemium subscription creation rate
- API error rates
- Database query performance
- Payment gateway success rate
- User session errors

**Alert Thresholds**:
- Error rate > 2%: Investigate immediately
- Error rate > 5%: Consider rollback
- Conversion rate < 3%: Review UX flow


## Migration and Compatibility

### Backward Compatibility

#### 1. Existing Users

**Impact**: None - existing paid subscriptions unaffected
- Existing subscription records remain unchanged
- Feature access continues to work as before
- No migration required for existing users

**Verification**:
- Test existing user login and feature access
- Verify subscription status display
- Confirm upgrade/downgrade flows still work

#### 2. Existing Code

**Impact**: Minimal - additive changes only
- New plan added to hierarchy (lowest tier)
- Existing plan comparison logic still works
- Feature gating extended, not replaced

**Verification**:
- Run full test suite
- Verify no regressions in existing features
- Test all subscription-related flows

### Data Migration

**No data migration required** - this is a purely additive feature:
- New plan row added to `subscription_plans` table
- New subscriptions created for Freemium users
- Existing data structures unchanged

### API Versioning

**No API version changes required**:
- New endpoint added: `/api/subscription/create-freemium`
- Existing endpoints unchanged
- Response formats remain compatible

### Configuration Updates

**Required Updates**:
1. `subscriptionPlans.js`: Add PAY_AS_YOU_GO to PLAN_IDS and PLAN_HIERARCHY
2. `featureGating.ts`: Add PAY_AS_YOU_GO_FEATURES configuration
3. Environment variables: None required

**Optional Updates**:
1. Feature flags: Add `freemium_enabled` for gradual rollout
2. Analytics: Add Freemium-specific event tracking

## Future Enhancements

### Phase 2 Features (Post-Launch)

#### 1. Freemium Usage Limits

**Concept**: Add usage-based limits to Freemium tier
- Example: 3 profile views per month
- Example: 5 job applications per month

**Implementation**:
- Add usage tracking table
- Implement usage counters
- Display usage meters in UI

#### 2. Time-Limited Freemium

**Concept**: Freemium access expires after 30 days
- Encourages faster conversion
- Creates urgency

**Implementation**:
- Set end_date on Freemium subscriptions
- Add expiration warnings
- Auto-downgrade after expiration

#### 3. Freemium Feature Trials

**Concept**: Allow temporary access to premium features
- Example: 7-day trial of assessments
- Example: 3 free mock interviews

**Implementation**:
- Add trial tracking
- Implement trial expiration
- Show trial status in UI

#### 4. Personalized Upgrade Prompts

**Concept**: Show relevant upgrade prompts based on user behavior
- Track which features users try to access
- Recommend plans that include those features
- A/B test different messaging

**Implementation**:
- Add behavior tracking
- Implement recommendation engine
- Create dynamic upgrade prompts

#### 5. Freemium Referral Program

**Concept**: Reward Freemium users for referrals
- Unlock premium features temporarily
- Earn credits toward paid plans
- Gamify the experience

**Implementation**:
- Add referral tracking
- Implement reward system
- Create referral UI

### Technical Debt Considerations

**Current Approach**: Minimal changes to existing codebase
- Pro: Fast implementation, low risk
- Con: Some code duplication

**Future Refactoring**:
1. Consolidate feature access logic into single service
2. Create unified subscription management API
3. Implement event-driven architecture for subscription changes
4. Add comprehensive audit logging

### Scalability Considerations

**Current Design**: Handles up to 100K Freemium users
- Database: Indexed queries, efficient schema
- Caching: Redis for subscription data
- API: Stateless, horizontally scalable

**Future Scaling** (1M+ users):
1. Implement read replicas for subscription queries
2. Add CDN caching for plan data
3. Implement event streaming for real-time updates
4. Consider sharding by user_id

## Appendix

### A. Database Schema Reference

#### subscription_plans Table

```sql
CREATE TABLE subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  business_type TEXT NOT NULL, -- 'b2c' or 'b2b'
  entity_type TEXT NOT NULL,   -- 'school', 'college', 'university', 'recruitment', 'all'
  role_type TEXT NOT NULL,     -- 'student', 'educator', 'admin', 'recruiter', 'all'
  price DECIMAL(10,2) NOT NULL,
  duration TEXT NOT NULL,      -- 'month', 'year', 'lifetime'
  features JSONB NOT NULL,     -- Array of feature strings
  is_active BOOLEAN DEFAULT true,
  positioning TEXT,
  tagline TEXT,
  ideal_for TEXT,
  storage_limit TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### subscriptions Table

```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  plan_id UUID NOT NULL REFERENCES subscription_plans(id),
  status TEXT NOT NULL,        -- 'active', 'cancelled', 'expired', 'paused'
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP,          -- NULL for lifetime subscriptions
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### B. API Reference

#### POST /api/subscription/create-freemium

**Request**:
```json
{
  "userId": "uuid",
  "email": "user@example.com"
}
```

**Response (200)**:
```json
{
  "success": true,
  "subscription": {
    "id": "uuid",
    "userId": "uuid",
    "planCode": "pay_as_you_go",
    "status": "active",
    "startDate": "2024-01-01T00:00:00Z",
    "endDate": null
  }
}
```

**Response (400)**:
```json
{
  "error": "Missing userId or email"
}
```

**Response (500)**:
```json
{
  "error": "Failed to create subscription"
}
```

### C. Configuration Reference

#### Plan Hierarchy

```javascript
export const PLAN_HIERARCHY = [
  'pay_as_you_go',    // Freemium (₹0)
  'basic',            // ₹499/month
  'professional',     // ₹749/month
  'enterprise',       // Custom pricing
  'enterprise_ecosystem' // Custom pricing
];
```

#### Freemium Features

```javascript
export const PAY_AS_YOU_GO_FEATURES = {
  // Free features
  dashboard_access: true,
  profile_creation: true,
  marketplace_access: true,
  view_pricing: true,
  opportunities_access: true,
  courses_listing_access: true,
  
  // Locked features
  assessments: false,
  projects: false,
  storage: false,
  analytics: false,
  portfolio: false,
  career_paths: false,
  mock_interviews: false,
  resume_builder: false,
  certificates: false,
  course_enrollment: false,
  priority_support: false,
};
```

### D. User Flow Diagrams

See "Architecture" section for detailed user flow diagrams.

### E. Glossary

- **Freemium**: A subscription tier with ₹0 cost and limited features
- **Feature Gate**: Access control mechanism that locks/unlocks features
- **Payment Bypass**: Logic that skips payment processing for free plans
- **Upgrade Flow**: User journey from Freemium to paid subscription
- **Plan Hierarchy**: Ordered list of subscription tiers for access control
- **Auto-Subscription**: Automatic subscription creation without payment
- **Locked Feature**: Platform capability unavailable to Freemium users

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2024-01-15 | Design Team | Initial design document |


# Admin Dashboard Navigation Flow

## Complete User Journey: Homepage → Admin Dashboard

### Current Flow (As Implemented)

```mermaid
flowchart TD
    A[Homepage<br/>/] --> B[Header/Navbar]
    
    B -->|Click 'Login' Button| C[Unified Login Page<br/>/login]
    B -->|Click 'Sign Up' Button| D[Unified Signup Page<br/>/signup]
    
    C --> E[User Enters Credentials]
    E --> F[Select Role Dropdown]
    
    F --> G{Role Selection}
    G -->|Learner| H[/learner/dashboard]
    G -->|Recruiter| I[/recruitment/overview]
    G -->|Educator| J[/educator/dashboard]
    G -->|School Admin| K[/school-admin/dashboard]
    G -->|College Admin| L[/college-admin/dashboard]
    G -->|University Admin| M[/university-admin/dashboard]
    
    I --> N{Check Org Context}
    N -->|Has Org + Admin Role| O[Can Access Admin]
    N -->|Has Org + Recruiter Role| P[Regular Recruiter]
    N -->|No Org| Q[Need Invitation]
    
    O --> R[❌ No Link to Admin]
    P --> S[Stay on Overview]
    
    R -.->|Manual URL| T[/recruitment/admin]
    
    style A fill:#e1f5ff
    style B fill:#d4edda
    style C fill:#fff4e6
    style I fill:#e8f5e9
    style T fill:#f3e5f5
    style R fill:#f8d7da
```

### Detailed Step-by-Step Flow

#### **Step 1: Homepage (Landing Page)**
- **URL**: `/`
- **File**: `src/pages/homepage/Home.jsx`
- **Header**: `src/shared/ui/Header.jsx`
- **Current State**: 
  - ✅ Header has "Login" and "Sign Up" buttons (desktop & mobile)
  - ✅ Login button → `/login`
  - ✅ Sign Up button → `/signup`
  - Hero banner with "Book a Demo" button

**✅ Navigation to login works perfectly!**

---

#### **Step 2: Login Page**
- **URL**: `/login`
- **File**: `src/features/auth/ui/UnifiedLogin.tsx`
- **Features**:
  - Email/password input
  - Role selection dropdown (Learner, Recruiter, Educator, Admins)
  - "Forgot Password" link
  - "Sign Up" link

**User selects "Recruiter" role and logs in**

---

#### **Step 3: Post-Login Redirect**
- **Logic**: `src/features/auth/lib/roleBasedRouter.ts`
- **Recruiter Role** → Redirects to `/recruitment/overview`

```typescript
const ROLE_ROUTES: Record<UserRole, string> = {
  recruiter: '/recruitment/overview',
  // ... other roles
};
```

---

#### **Step 4: Recruiter Dashboard**
- **URL**: `/recruitment/overview`
- **File**: `src/pages/recruiter/Overview.tsx`
- **Current State**: Regular recruiter dashboard

**Problem**: No link to admin dashboard yet!

---

#### **Step 5: Admin Dashboard (NEW)**
- **URL**: `/recruitment/admin`
- **File**: `src/pages/recruiter/AdminDashboard.tsx`
- **Access**: Currently only via direct URL

---

## What's Missing: Navigation Links

### 🔴 **Only 2 Missing Pieces** (Homepage login already exists!)

1. **Recruiter Dashboard → Admin Link** ❌
   - No "Admin Settings" link in recruiter navigation
   - Admins can't discover the admin portal
   - Need to add link in RecruiterLayout

2. **Smart Post-Login Routing** ❌
   - No automatic redirect to admin dashboard for admins
   - All recruiters go to `/recruitment/overview` regardless of role
   - Need to check org context after login

---

## Recommended Implementation

### **Option 1: Add Navigation Links (Quick Fix)** ⚡

#### ~~1. Add Login Button to Homepage Hero~~ ✅ **ALREADY EXISTS**
Header already has Login/Signup buttons!

#### 2. Add Admin Link to Recruiter Layout (REQUIRED)

```tsx
// src/app/layouts/RecruiterLayout.jsx (or wherever nav is)
{isAdmin && (
  <Link to="/recruitment/admin">
    <Cog6ToothIcon className="h-5 w-5" />
    Admin Settings
  </Link>
)}
```

---

### **Option 2: Smart Post-Login Routing (Recommended)**

Update the role-based router to check for admin role:

```typescript
// src/features/auth/lib/roleBasedRouter.ts

export const redirectToRoleDashboard = async (
  role: UserRole, 
  navigate: NavigateFunction
): Promise<void> => {
  if (role === 'recruiter') {
    // Check if user is admin in their organization
    const { getOrgContext } = await import('@/entities/recruitment/api/orgContextService');
    const orgContext = await getOrgContext();
    
    if (orgContext?.recruitmentRole === 'company_admin') {
      navigate('/recruitment/admin', { replace: true });
      return;
    }
  }
  
  const route = getRouteForRole(role);
  navigate(route, { replace: true });
};
```

---

### **Option 3: Unified Dashboard with Tabs**

Create a single recruiter dashboard with role-based tabs:

```
/recruitment/dashboard
├── Overview (all users)
├── Jobs (all users)
├── Candidates (all users)
├── Pipeline (all users)
└── Admin (admins only) ← New tab
```

---

## Current Access Methods

### ✅ **Working Methods**

1. **Direct URL Navigation**
   - Type `/recruitment/admin` in browser
   - Works if user is logged in with admin role

2. **Bookmark**
   - Save `/recruitment/admin` as bookmark
   - Access directly

### ❌ **Not Working Methods**

1. **Homepage Navigation**
   - No login button on homepage
   - No "For Recruiters" section

2. **Post-Login Redirect**
   - Admins go to `/recruitment/overview` (not admin dashboard)

3. **In-App Navigation**
   - No "Admin Settings" link in recruiter nav
   - No role-based menu items

---

## Implementation Priority

### **Phase 1: Immediate (Day 8 Evening)** ✅ **COMPLETE**
1. ~~✅ Add "Login" button to homepage Hero~~ **ALREADY EXISTS IN HEADER**
2. ✅ **COMPLETE** - Smart post-login routing implemented
3. ⏳ Add "Admin Settings" link to RecruiterLayout (for admins only)
4. ⏳ Update RecruiterLayout to show role badge

### **Phase 2: Smart Routing (Day 9 Morning)** 🎯
1. ✅ Update `redirectToRoleDashboard` to check org context
2. ✅ Auto-redirect admins to `/recruitment/admin`
3. ✅ Add breadcrumb navigation

### **Phase 3: Enhanced UX (Day 9 Afternoon)** ⭐
1. ✅ Add role switcher (if user has multiple roles)
2. ✅ Add "Back to Recruiter View" link in admin dashboard
3. ✅ Add onboarding tour for first-time admins

---

## File Changes Required

### ~~**1. Homepage Hero**~~ ✅ **NOT NEEDED - Header already has login**
Login/Signup buttons already exist in `src/shared/ui/Header.jsx`

### **2. Recruiter Layout** (`src/app/layouts/RecruiterLayout.jsx`)
```jsx
// Add admin link in navigation
import { useOrgContext } from '@/entities/recruitment/model/useOrgContext';

const { isAdmin } = useOrgContext();

{isAdmin && (
  <NavLink to="/recruitment/admin">
    Admin Settings
  </NavLink>
)}
```

### **3. Role-Based Router** (`src/features/auth/lib/roleBasedRouter.ts`)
```typescript
// Add org context check for recruiters
export const redirectToRoleDashboard = async (role, navigate) => {
  if (role === 'recruiter') {
    const orgContext = await getOrgContext();
    if (orgContext?.recruitmentRole === 'company_admin') {
      navigate('/recruitment/admin', { replace: true });
      return;
    }
  }
  // ... existing logic
};
```

---

## Testing Checklist

- [x] Homepage has visible "Login" button (in header)
- [ ] Login page works for recruiter role
- [ ] Admin users redirect to `/recruitment/admin` after login
- [ ] Regular recruiters redirect to `/recruitment/overview` after login
- [ ] Admin link visible in recruiter nav (admins only)
- [ ] Admin link hidden for regular recruiters
- [ ] Direct URL `/recruitment/admin` works for admins
- [ ] Direct URL `/recruitment/admin` blocked for non-admins
- [ ] Role badge shows correct role in header
- [ ] Breadcrumb navigation works

---

## Summary

**Current State:**
- ✅ Login button exists in header/navbar
- ✅ Signup button exists in header/navbar
- ❌ No admin link in recruiter navigation
- ❌ No smart routing for admins
- ✅ Admin dashboard page exists
- ✅ Admin dashboard accessible via direct URL

**What Actually Needs to Be Done:**
1. Add "Admin Settings" link to recruiter layout (for admins only)
2. Implement smart post-login routing (check org context)
3. Test complete flow end-to-end

**Estimated Time:** 1-2 hours (reduced from 2-3 hours)

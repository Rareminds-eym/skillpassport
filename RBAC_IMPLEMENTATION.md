# Role-Based Access Control (RBAC) Implementation Guide

## 🎯 Overview

This guide provides **step-by-step instructions** for implementing Role-Based Access Control (RBAC) in your Student Dashboard using **CASL** (an isomorphic authorization library). 

The system provides a **hybrid access control model**:
- **RBAC Layer**: Controls WHO can access WHAT (based on user role)
- **Subscription Layer**: Controls PREMIUM features (based on entitlements)

**Estimated Implementation Time**: 4-6 hours

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start](#quick-start)
3. [Step-by-Step Implementation](#step-by-step-implementation)
4. [Architecture Overview](#architecture-overview)
5. [Data Flow Diagrams](#data-flow-diagrams)
6. [Testing & Verification](#testing--verification)
7. [Troubleshooting](#troubleshooting)
8. [Best Practices](#best-practices)

---

## ✅ Prerequisites

Before starting, ensure you have:

- [x] React 18+ project with TypeScript/JavaScript
- [x] Supabase authentication configured
- [x] Existing `AuthContext` with user state
- [x] Existing `FeatureGate` component (for subscription features)
- [x] Node.js 16+ and npm/yarn installed

**Required Knowledge**:
- React Hooks (useState, useEffect, useContext)
- React Context API
- React Router (for route protection)
- Basic TypeScript/JavaScript

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install @casl/ability @casl/react
```

### 2. Create Project Structure

```bash
# Create directories
mkdir -p src/config
mkdir -p src/context
mkdir -p src/hooks
mkdir -p src/components/RBAC

# Create files (we'll populate these in the next steps)
touch src/config/abilities.js
touch src/context/AbilityContext.jsx
touch src/hooks/useAbility.js
touch src/components/RBAC/PermissionGate.jsx
touch src/components/RBAC/RoleSwitcher.jsx
```

### 3. Enable Demo Mode (Optional)

Add to your `.env.development`:

```env
VITE_ENABLE_DEMO_MODE=true
```

---

## 📝 Step-by-Step Implementation

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Interface                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Profile    │  │ Applications │  │   Messages   │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Access Control Layer                          │
│  ┌──────────────────────────┐  ┌──────────────────────────┐    │
│  │   PermissionGate (RBAC)  │  │  FeatureGate (Subscription)│   │
│  │  - Role-based access     │  │  - Premium features       │    │
│  │  - CASL integration      │  │  - Entitlement check      │    │
│  └──────────────────────────┘  └──────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Context Layer                               │
│  ┌──────────────────────────┐  ┌──────────────────────────┐    │
│  │   AbilityContext (CASL)  │  │  SubscriptionContext      │    │
│  │  - Permission checking   │  │  - Entitlement state      │    │
│  │  - Demo mode support     │  │  - Feature access         │    │
│  └──────────────────────────┘  └──────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Service Layer                               │
│  ┌──────────────────────────┐  ┌──────────────────────────┐    │
│  │   Ability Definitions    │  │  EntitlementService       │    │
│  │  - defineAbilitiesFor()  │  │  - hasFeatureAccess()     │    │
│  │  - Role permissions      │  │  - getUserEntitlements()  │    │
│  └──────────────────────────┘  └──────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Database Layer (Supabase)                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │    users     │  │ entitlements │  │   students   │          │
│  │  - role      │  │ - feature_key│  │   - data     │          │
│  │  - metadata  │  │ - status     │  │              │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow Diagram (DFD)

### Level 0: Context Diagram

```
                    ┌─────────────────┐
                    │                 │
                    │      User       │
                    │                 │
                    └────────┬────────┘
                             │
                             │ Login / Access Request
                             ▼
                    ┌─────────────────┐
                    │                 │
                    │  Student        │
                    │  Dashboard      │
                    │  System         │
                    │                 │
                    └────────┬────────┘
                             │
                             │ Authorized Content
                             ▼
                    ┌─────────────────┐
                    │                 │
                    │      User       │
                    │                 │
                    └─────────────────┘
```

### Level 1: Main Process Flow

```
┌──────────┐
│  User    │
│  Login   │
└────┬─────┘
     │
     │ User Credentials
     ▼
┌─────────────────────┐
│  1.0                │
│  Authenticate       │──────► Auth Token
│  User               │
└────┬────────────────┘
     │
     │ User ID + Role
     ▼
┌─────────────────────┐
│  2.0                │
│  Load               │
│  Permissions        │◄────── User Metadata
│                     │
└────┬────────────────┘
     │
     │ Ability Object
     ▼
┌─────────────────────┐
│  3.0                │
│  Check              │
│  Access             │◄────── Resource Request
│                     │
└────┬────────────────┘
     │
     ├─────► Allowed ──────┐
     │                     │
     └─────► Denied        │
                           ▼
                  ┌─────────────────┐
                  │  4.0            │
                  │  Render         │
                  │  Content        │
                  └────┬────────────┘
                       │
                       │ UI Components
                       ▼
                  ┌─────────────────┐
                  │  User           │
                  │  Interface      │
                  └─────────────────┘
```

### Level 2: Detailed Access Control Flow

```
┌──────────────────────────────────────────────────────────────────┐
│                    Access Request Flow                            │
└──────────────────────────────────────────────────────────────────┘

User Action
    │
    ▼
┌─────────────────────┐
│  Component Render   │
│  (Profile, Apps,    │
│   Messages, etc.)   │
└────┬────────────────┘
     │
     ▼
┌─────────────────────┐         ┌─────────────────────┐
│  PermissionGate     │         │  FeatureGate        │
│  Check              │         │  Check              │
│                     │         │                     │
│  action: "read"     │         │  featureKey:        │
│  subject: "Profile" │         │  "career_ai"        │
└────┬────────────────┘         └────┬────────────────┘
     │                               │
     │ Query Ability                 │ Query Entitlement
     ▼                               ▼
┌─────────────────────┐         ┌─────────────────────┐
│  AbilityContext     │         │  Subscription       │
│                     │         │  Context            │
│  ability.can(       │         │                     │
│    'read',          │         │  hasFeatureAccess() │
│    'Profile'        │         │                     │
│  )                  │         └────┬────────────────┘
└────┬────────────────┘              │
     │                                │
     │ Check Cache                    │ Check Cache
     ▼                                ▼
┌─────────────────────┐         ┌─────────────────────┐
│  Ability Rules      │         │  Entitlements       │
│  (In Memory)        │         │  (In Memory)        │
│                     │         │                     │
│  student: {         │         │  user_entitlements  │
│    can('read',      │         │  - feature_key      │
│        'Profile')   │         │  - status: active   │
│  }                  │         │  - end_date         │
└────┬────────────────┘         └────┬────────────────┘
     │                                │
     │ Permission Result              │ Entitlement Result
     ▼                                ▼
┌─────────────────────┐         ┌─────────────────────┐
│  Boolean: true      │         │  Boolean: true      │
└────┬────────────────┘         └────┬────────────────┘
     │                                │
     └────────────┬───────────────────┘
                  │
                  │ Both Checks Pass
                  ▼
         ┌─────────────────────┐
         │  Render Component   │
         │  (Access Granted)   │
         └─────────────────────┘
```

### Level 3: Demo Mode Flow

```
┌──────────────────────────────────────────────────────────────────┐
│                    Demo Mode Workflow                             │
└──────────────────────────────────────────────────────────────────┘

User Clicks "Switch Role"
    │
    ▼
┌─────────────────────┐
│  RoleSwitcher       │
│  Component          │
│                     │
│  - Show dropdown    │
│  - List demo roles  │
└────┬────────────────┘
     │
     │ User selects "Demo Recruiter"
     ▼
┌─────────────────────┐
│  switchToDemo()     │
│                     │
│  1. Store in        │
│     sessionStorage  │
│  2. Update context  │
└────┬────────────────┘
     │
     ▼
┌─────────────────────┐
│  defineAbilitiesFor │
│  Demo()             │
│                     │
│  Build new ability  │
│  object for demo    │
│  role               │
└────┬────────────────┘
     │
     │ New Ability Object
     ▼
┌─────────────────────┐
│  AbilityContext     │
│  Update             │
│                     │
│  - ability: new     │
│  - isDemoMode: true │
│  - demoRole: "..."  │
└────┬────────────────┘
     │
     │ Context Updated
     ▼
┌─────────────────────┐
│  Components         │
│  Re-render          │
│                     │
│  - Show demo banner │
│  - Apply new perms  │
└────┬────────────────┘
     │
     │ User sees demo view
     ▼
┌─────────────────────┐
│  User Interface     │
│  (Demo Mode)        │
│                     │
│  [Demo Banner]      │
│  [Exit Demo Button] │
└─────────────────────┘
```

## Role Definitions

### Student Role
- **Can**: View/edit own profile, view/create own applications, send messages, manage own skills
- **Cannot**: View other students' data, access admin features

### Recruiter Role
- **Can**: View all applications, view all student profiles, send messages, manage job postings
- **Cannot**: Edit student data, access admin features

### Mentor Role
- **Can**: View assigned students, verify skills, send messages
- **Cannot**: View all students, manage applications

### Admin Role
- **Can**: Full access to all features and data
- **Cannot**: N/A (unrestricted)

## Permission Matrix

| Resource      | Student | Recruiter | Mentor | Admin |
|---------------|---------|-----------|--------|-------|
| Profile (own) | R/W     | R         | R*     | R/W   |
| Profile (all) | -       | R         | R*     | R/W   |
| Applications  | R/W*    | R/W       | -      | R/W   |
| Messages      | R/W*    | R/W       | R/W*   | R/W   |
| Skills (own)  | R/W     | R         | R/V    | R/W   |
| Jobs          | R       | R/W       | R      | R/W   |
| Admin Panel   | -       | -         | -      | R/W   |

*Legend*:
- R = Read
- W = Write
- V = Verify
- \* = Own data only
- \- = No access

## Hybrid Access Control

The system uses **two layers** of access control:

### Layer 1: RBAC (Role-Based)
Controls WHO can access WHAT resources based on their role.

```javascript
// Example: Student can read their own profile
<PermissionGate action="read" subject="Profile">
  <Profile />
</PermissionGate>
```

### Layer 2: Entitlements (Subscription-Based)
Controls access to PREMIUM features based on subscription status.

```javascript
// Example: Career AI requires premium subscription
<FeatureGate featureKey="career_ai">
  <CareerAI />
</FeatureGate>
```

### Combined Usage
Both checks must pass for access to premium features:

```javascript
// User must have role permission AND subscription
<PermissionGate action="access" subject="CareerAI">
  <FeatureGate featureKey="career_ai">
    <CareerAI />
  </FeatureGate>
</PermissionGate>
```

## Demo Mode

Demo mode allows temporary role switching for demonstration purposes without affecting the user's actual permissions.

### Features
- **Session-based**: Demo role stored in `sessionStorage` (cleared on logout)
- **Visual indicator**: Banner shows current demo role
- **Easy exit**: One-click return to actual role
- **Safe**: Cannot modify real data in demo mode

### Flow
1. User clicks "Switch Role" button
2. Selects demo role from dropdown
3. System stores demo role in session
4. Ability context updates with demo permissions
5. UI re-renders with new permissions
6. Demo banner appears at top
7. User can exit demo anytime

### Step 1: Define Abilities (15 minutes)

Create `src/config/abilities.js`:

```javascript
import { AbilityBuilder, createMongoAbility } from '@casl/ability';

/**
 * Define what each role can do
 * @param {Object} user - User object from AuthContext
 * @returns {Ability} CASL ability instance
 */
export const defineAbilitiesFor = (user) => {
  const { can, cannot, build } = new AbilityBuilder(createMongoAbility);

  if (!user) {
    // Anonymous users - no permissions
    return build();
  }

  // Get role from user metadata
  const role = user.user_metadata?.user_role || user.role || 'student';

  switch (role) {
    case 'student':
      // Students can manage their own resources
      can('read', 'Profile', { userId: user.id });
      can('update', 'Profile', { userId: user.id });
      can('read', 'Applications', { studentId: user.id });
      can('create', 'Applications');
      can('read', 'Messages', { userId: user.id });
      can('send', 'Messages');
      can('read', 'Skills', { userId: user.id });
      can('update', 'Skills', { userId: user.id });
      can('access', 'CareerAI'); // Requires subscription check via FeatureGate
      break;

    case 'recruiter':
      // Recruiters can view all applications and students
      can('read', 'Applications');
      can('update', 'Applications', { recruiterId: user.id });
      can('read', 'Profile'); // All student profiles
      can('read', 'Messages');
      can('send', 'Messages');
      can('create', 'Jobs');
      can('update', 'Jobs', { recruiterId: user.id });
      can('delete', 'Jobs', { recruiterId: user.id });
      break;

    case 'mentor':
      // Mentors can view assigned students
      can('read', 'Profile', { mentorId: user.id });
      can('read', 'Skills');
      can('verify', 'Skills');
      can('read', 'Messages');
      can('send', 'Messages');
      break;

    case 'admin':
      // Admins can do everything
      can('manage', 'all');
      break;

    default:
      // Default permissions
      can('read', 'Profile', { userId: user.id });
  }

  return build();
};

/**
 * Define abilities for demo roles
 * @param {string} demoRole - Demo role identifier
 * @returns {Ability} CASL ability instance
 */
export const defineAbilitiesForDemo = (demoRole) => {
  const { can, build } = new AbilityBuilder(createMongoAbility);

  switch (demoRole) {
    case 'demo_student':
      can('read', 'Profile');
      can('read', 'Applications');
      can('read', 'Skills');
      can('read', 'Messages');
      break;

    case 'demo_recruiter':
      can('read', 'Applications');
      can('read', 'Profile');
      can('read', 'Messages');
      can('send', 'Messages');
      can('manage', 'Jobs');
      break;

    case 'demo_mentor':
      can('read', 'Profile');
      can('read', 'Skills');
      can('verify', 'Skills');
      can('read', 'Messages');
      break;

    case 'demo_admin':
      can('manage', 'all');
      break;
  }

  return build();
};
```

**✅ Checkpoint**: Abilities are now defined for all roles.

---

### Step 2: Create Ability Context (20 minutes)

Create `src/context/AbilityContext.jsx`:

```javascript
import React, { createContext, useEffect, useState } from 'react';
import { createContextualCan } from '@casl/react';
import { defineAbilitiesFor, defineAbilitiesForDemo } from '../config/abilities';
import { useAuth } from './AuthContext';

export const AbilityContext = createContext();
export const Can = createContextualCan(AbilityContext.Consumer);

export const AbilityProvider = ({ children }) => {
  const { user } = useAuth();
  const [ability, setAbility] = useState(null);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [demoRole, setDemoRole] = useState(null);

  useEffect(() => {
    // Check if in demo mode
    const storedDemoRole = sessionStorage.getItem('demo_role');
    
    if (storedDemoRole) {
      // Demo mode active
      console.log('[RBAC] Demo mode active:', storedDemoRole);
      setIsDemoMode(true);
      setDemoRole(storedDemoRole);
      setAbility(defineAbilitiesForDemo(storedDemoRole));
    } else if (user) {
      // Normal mode - use actual user permissions
      console.log('[RBAC] Loading permissions for user:', user.id);
      setIsDemoMode(false);
      setDemoRole(null);
      setAbility(defineAbilitiesFor(user));
    } else {
      // No user - anonymous abilities
      console.log('[RBAC] No user, loading anonymous permissions');
      setAbility(defineAbilitiesFor(null));
    }
  }, [user]);

  const switchToDemo = (role) => {
    console.log('[RBAC] Switching to demo role:', role);
    sessionStorage.setItem('demo_role', role);
    setIsDemoMode(true);
    setDemoRole(role);
    setAbility(defineAbilitiesForDemo(role));
  };

  const exitDemo = () => {
    console.log('[RBAC] Exiting demo mode');
    sessionStorage.removeItem('demo_role');
    setIsDemoMode(false);
    setDemoRole(null);
    setAbility(defineAbilitiesFor(user));
  };

  const value = {
    ability,
    isDemoMode,
    demoRole,
    switchToDemo,
    exitDemo
  };

  if (!ability) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <AbilityContext.Provider value={value}>
      {children}
    </AbilityContext.Provider>
  );
};
```

**✅ Checkpoint**: Context provider is ready to manage permissions.

---

### Step 3: Create Custom Hook (10 minutes)

Create `src/hooks/useAbility.js`:

```javascript
import { useContext } from 'react';
import { useAbility as useCaslAbility } from '@casl/react';
import { AbilityContext } from '../context/AbilityContext';

/**
 * Custom hook to access RBAC abilities
 * @returns {Object} Ability methods and demo mode state
 */
export const useAbility = () => {
  const context = useContext(AbilityContext);
  const ability = useCaslAbility(AbilityContext);

  if (!context) {
    throw new Error('useAbility must be used within AbilityProvider');
  }

  return {
    ability,
    can: (action, subject, field) => ability.can(action, subject, field),
    cannot: (action, subject, field) => ability.cannot(action, subject, field),
    isDemoMode: context.isDemoMode,
    demoRole: context.demoRole,
    switchToDemo: context.switchToDemo,
    exitDemo: context.exitDemo
  };
};
```

**✅ Checkpoint**: Hook is ready for use in components.

---

### Step 4: Create PermissionGate Component (20 minutes)

Create `src/components/RBAC/PermissionGate.jsx`:

```javascript
import React from 'react';
import { Can } from '../../context/AbilityContext';
import { useNavigate } from 'react-router-dom';
import { Lock, ArrowLeft } from 'lucide-react';

/**
 * Component to guard routes and components based on permissions
 * @param {string} action - Action to check (e.g., 'read', 'update')
 * @param {string} subject - Subject to check (e.g., 'Profile', 'Applications')
 * @param {string} field - Optional field to check
 * @param {ReactNode} children - Content to render if allowed
 * @param {ReactNode} fallback - Content to render if denied (optional)
 * @param {boolean} showDenied - Show access denied message (default: true)
 */
export const PermissionGate = ({ 
  action, 
  subject, 
  field,
  children, 
  fallback,
  showDenied = true 
}) => {
  const navigate = useNavigate();

  if (fallback) {
    return (
      <Can I={action} a={subject} field={field} passThrough>
        {(allowed) => (allowed ? children : fallback)}
      </Can>
    );
  }

  return (
    <Can I={action} a={subject} field={field} passThrough>
      {(allowed) => {
        if (allowed) return children;
        
        if (!showDenied) return null;

        return (
          <div className="flex flex-col items-center justify-center min-h-[500px] p-8">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
              <Lock className="w-10 h-10 text-red-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Access Denied</h2>
            <p className="text-gray-600 text-center max-w-md mb-8">
              You don't have permission to access this resource. Please contact your administrator if you believe this is an error.
            </p>
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Go Back
            </button>
          </div>
        );
      }}
    </Can>
  );
};
```

**✅ Checkpoint**: PermissionGate is ready to protect routes and components.

---

### Step 5: Create Role Switcher (30 minutes)

Create `src/components/RBAC/RoleSwitcher.jsx`:

```javascript
import React, { useState } from 'react';
import { useAbility } from '../../hooks/useAbility';
import { Users, X, ChevronDown } from 'lucide-react';

const DEMO_ROLES = [
  { 
    id: 'demo_student', 
    name: 'Student', 
    description: 'View own profile, applications, and skills',
    color: 'bg-blue-100 text-blue-700'
  },
  { 
    id: 'demo_recruiter', 
    name: 'Recruiter', 
    description: 'View all applications and manage jobs',
    color: 'bg-purple-100 text-purple-700'
  },
  { 
    id: 'demo_mentor', 
    name: 'Mentor', 
    description: 'View assigned students and verify skills',
    color: 'bg-green-100 text-green-700'
  },
  { 
    id: 'demo_admin', 
    name: 'Admin', 
    description: 'Full access to all features',
    color: 'bg-red-100 text-red-700'
  }
];

export const RoleSwitcher = () => {
  const { isDemoMode, demoRole, switchToDemo, exitDemo } = useAbility();
  const [showDropdown, setShowDropdown] = useState(false);

  // Only show in development or when explicitly enabled
  if (import.meta.env.PROD && !import.meta.env.VITE_ENABLE_DEMO_MODE) {
    return null;
  }

  const currentRole = DEMO_ROLES.find(r => r.id === demoRole);

  return (
    <>
      {/* Demo Mode Banner */}
      {isDemoMode && (
        <div className="fixed top-0 left-0 right-0 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-3 text-center z-50 shadow-lg">
          <div className="flex items-center justify-center gap-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              <span className="font-semibold">
                🎭 Demo Mode: {currentRole?.name}
              </span>
            </div>
            <button
              onClick={exitDemo}
              className="px-4 py-1.5 bg-white text-amber-600 rounded-md text-sm font-medium hover:bg-amber-50 transition-colors flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Exit Demo
            </button>
          </div>
        </div>
      )}

      {/* Role Switcher Dropdown */}
      <div className="relative">
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
        >
          <Users className="w-4 h-4" />
          <span className="text-sm font-medium">
            {isDemoMode ? currentRole?.name : 'Switch Role'}
          </span>
          <ChevronDown className="w-4 h-4" />
        </button>

        {showDropdown && (
          <>
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setShowDropdown(false)}
            />
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden">
              <div className="p-3 bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900">Demo Roles</h3>
                <p className="text-xs text-gray-500 mt-1">
                  Switch roles to test different permission levels
                </p>
              </div>
              <div className="p-2 max-h-96 overflow-y-auto">
                {DEMO_ROLES.map(role => (
                  <button
                    key={role.id}
                    onClick={() => {
                      switchToDemo(role.id);
                      setShowDropdown(false);
                    }}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-all ${
                      demoRole === role.id
                        ? 'bg-indigo-50 border-2 border-indigo-500'
                        : 'hover:bg-gray-50 border-2 border-transparent'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900">{role.name}</span>
                          {demoRole === role.id && (
                            <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs font-medium rounded">
                              Active
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">{role.description}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
};
```

**✅ Checkpoint**: Role switcher is ready for demo mode.

---

### Step 6: Integrate with Your App (15 minutes)

#### 6.1 Wrap App with AbilityProvider

Update your `src/App.jsx` or `src/main.jsx`:

```javascript
import { AbilityProvider } from './context/AbilityContext';
import { AuthProvider } from './context/AuthContext';
import { SubscriptionProvider } from './context/SubscriptionContext';

function App() {
  return (
    <AuthProvider>
      <AbilityProvider>
        <SubscriptionProvider>
          {/* Your app routes */}
        </SubscriptionProvider>
      </AbilityProvider>
    </AuthProvider>
  );
}
```

#### 6.2 Add Role Switcher to Navbar

Update your navbar component:

```javascript
import { RoleSwitcher } from './components/RBAC/RoleSwitcher';

function Navbar() {
  return (
    <nav className="flex items-center justify-between p-4">
      <div>Logo</div>
      <div className="flex items-center gap-4">
        <RoleSwitcher />
        {/* Other navbar items */}
      </div>
    </nav>
  );
}
```

**✅ Checkpoint**: RBAC is integrated into your app.

---

### Step 7: Protect Routes (20 minutes)

Update `src/routes/AppRoutes.jsx`:

```javascript
import { PermissionGate } from '../components/RBAC/PermissionGate';

// Protect individual routes
<Route path="/student/profile" element={
  <PermissionGate action="read" subject="Profile">
    <Profile />
  </PermissionGate>
} />

<Route path="/student/applications" element={
  <PermissionGate action="read" subject="Applications">
    <Applications />
  </PermissionGate>
} />

<Route path="/student/messages" element={
  <PermissionGate action="read" subject="Messages">
    <Messages />
  </PermissionGate>
} />

<Route path="/student/skills" element={
  <PermissionGate action="read" subject="Skills">
    <MySkills />
  </PermissionGate>
} />

// Combine with FeatureGate for premium features
<Route path="/student/career-ai" element={
  <PermissionGate action="access" subject="CareerAI">
    <FeatureGate featureKey="career_ai">
      <CareerAI />
    </FeatureGate>
  </PermissionGate>
} />
```

**✅ Checkpoint**: All routes are now protected.

---

### Step 8: Add Permission Checks to Components (30 minutes)

#### Example 1: Conditional Button Rendering

```javascript
import { Can } from '../../context/AbilityContext';

function ProfilePage() {
  return (
    <div>
      <h1>Profile</h1>
      
      {/* Only show edit button if user can update profile */}
      <Can I="update" a="Profile">
        <button>Edit Profile</button>
      </Can>
    </div>
  );
}
```

#### Example 2: Using Hook for Complex Logic

```javascript
import { useAbility } from '../../hooks/useAbility';

function ApplicationsPage() {
  const { can } = useAbility();
  
  const handleDelete = () => {
    if (!can('delete', 'Applications')) {
      alert('You do not have permission to delete applications');
      return;
    }
    // Delete logic
  };
  
  return (
    <div>
      <h1>Applications</h1>
      {can('create', 'Applications') && (
        <button>New Application</button>
      )}
    </div>
  );
}
```

#### Example 3: Conditional Rendering with State

```javascript
import { Can } from '../../context/AbilityContext';

function SkillsPage() {
  return (
    <div>
      <Can I="verify" a="Skills" passThrough>
        {(allowed) => (
          <button 
            disabled={!allowed}
            className={allowed ? 'bg-blue-500' : 'bg-gray-300'}
          >
            {allowed ? 'Verify Skill' : 'Cannot Verify'}
          </button>
        )}
      </Can>
    </div>
  );
}
```

**✅ Checkpoint**: Components now respect permissions.

---

## 🧪 Testing & Verification

### Test Checklist

- [ ] **Student Role**
  - [ ] Can view own profile
  - [ ] Can edit own profile
  - [ ] Cannot view other students' profiles
  - [ ] Can create applications
  - [ ] Can view own applications
  - [ ] Cannot view all applications

- [ ] **Recruiter Role**
  - [ ] Can view all applications
  - [ ] Can view all student profiles
  - [ ] Can manage jobs
  - [ ] Cannot edit student data

- [ ] **Demo Mode**
  - [ ] Can switch between roles
  - [ ] Demo banner appears
  - [ ] Can exit demo mode
  - [ ] Permissions update correctly

### Manual Testing Steps

1. **Test Student Role**:
   ```bash
   # Login as student
   # Navigate to /student/profile
   # Verify you can see and edit your profile
   # Try to access /recruiter/dashboard (should be denied)
   ```

2. **Test Demo Mode**:
   ```bash
   # Click "Switch Role" button
   # Select "Recruiter"
   # Verify demo banner appears
   # Navigate to applications page
   # Verify you can see all applications
   # Click "Exit Demo"
   # Verify you're back to student view
   ```

3. **Test Permission Checks**:
   ```bash
   # As student, check if edit buttons appear on own profile
   # As student, check if edit buttons DON'T appear on other profiles
   # Switch to recruiter demo, verify different UI elements appear
   ```

---

## 📚 Usage Examples & Patterns

### Pattern 1: Declarative Component Hiding

**Use Case**: Hide UI elements user cannot access

```javascript
import { Can } from '../../context/AbilityContext';

function ProfilePage() {
  return (
    <div>
      <h1>Profile</h1>
      
      {/* Button only appears if user can update profile */}
      <Can I="update" a="Profile">
        <button className="btn-primary">Edit Profile</button>
      </Can>
      
      {/* Multiple permissions */}
      <Can I="delete" a="Profile">
        <button className="btn-danger">Delete Account</button>
      </Can>
    </div>
  );
}
```

---

### Pattern 2: Imperative Permission Checks

**Use Case**: Complex logic requiring permission checks

```javascript
import { useAbility } from '../../hooks/useAbility';

function ApplicationsPage() {
  const { can, cannot } = useAbility();
  
  const handleSubmit = () => {
    if (cannot('create', 'Applications')) {
      toast.error('You do not have permission to create applications');
      return;
    }
    // Proceed with submission
  };
  
  const handleDelete = (appId) => {
    if (!can('delete', 'Applications')) {
      toast.error('You cannot delete applications');
      return;
    }
    // Proceed with deletion
  };
  
  return (
    <div>
      <h1>Applications</h1>
      {can('create', 'Applications') && (
        <button onClick={handleSubmit}>New Application</button>
      )}
    </div>
  );
}
```

---

### Pattern 3: Conditional Rendering with State

**Use Case**: Disable buttons but keep them visible

```javascript
import { Can } from '../../context/AbilityContext';

function SkillsPage() {
  return (
    <div>
      <h2>Skills</h2>
      
      {/* Button always visible but disabled based on permission */}
      <Can I="verify" a="Skills" passThrough>
        {(allowed) => (
          <button 
            disabled={!allowed}
            className={allowed ? 'btn-primary' : 'btn-disabled'}
            title={allowed ? 'Verify skill' : 'You cannot verify skills'}
          >
            {allowed ? 'Verify Skill' : 'Cannot Verify'}
          </button>
        )}
      </Can>
    </div>
  );
}
```

---

### Pattern 4: Inverted Checks (Show When NOT Allowed)

**Use Case**: Show upgrade prompts or warnings

```javascript
import { Can } from '../../context/AbilityContext';

function MessagesPage() {
  return (
    <div>
      {/* Show warning if user CANNOT send messages */}
      <Can not I="send" a="Messages">
        <div className="alert alert-warning">
          You need to upgrade your account to send messages.
        </div>
      </Can>
      
      {/* Show message form if user CAN send */}
      <Can I="send" a="Messages">
        <MessageForm />
      </Can>
    </div>
  );
}
```

---

### Pattern 5: Hybrid RBAC + Subscription Check

**Use Case**: Premium features requiring both role AND subscription

```javascript
import { PermissionGate } from '../components/RBAC/PermissionGate';
import { FeatureGate } from '../components/Subscription/FeatureGate';

function CareerAIPage() {
  return (
    // First check: Does user's role allow access to Career AI?
    <PermissionGate action="access" subject="CareerAI">
      {/* Second check: Does user have premium subscription? */}
      <FeatureGate featureKey="career_ai">
        <CareerAI />
      </FeatureGate>
    </PermissionGate>
  );
}
```

---

### Pattern 6: Route Protection

**Use Case**: Protect entire routes from unauthorized access

```javascript
import { PermissionGate } from '../components/RBAC/PermissionGate';
import { Route } from 'react-router-dom';

// In your routes file
<Route path="/student/profile" element={
  <PermissionGate action="read" subject="Profile">
    <Profile />
  </PermissionGate>
} />

<Route path="/recruiter/dashboard" element={
  <PermissionGate action="read" subject="RecruiterDashboard">
    <RecruiterDashboard />
  </PermissionGate>
} />
```

---

### Pattern 7: Custom Fallback UI

**Use Case**: Show custom message instead of default access denied

```javascript
import { PermissionGate } from '../components/RBAC/PermissionGate';

function AdminPanel() {
  return (
    <PermissionGate 
      action="manage" 
      subject="AdminPanel"
      fallback={
        <div className="text-center p-8">
          <h2>Admin Access Required</h2>
          <p>Please contact your administrator for access.</p>
        </div>
      }
    >
      <AdminDashboard />
    </PermissionGate>
  );
}
```

---

### Pattern 8: Demo Mode Awareness

**Use Case**: Show different UI in demo mode

```javascript
import { useAbility } from '../../hooks/useAbility';

function DashboardPage() {
  const { isDemoMode, demoRole } = useAbility();
  
  return (
    <div>
      {isDemoMode && (
        <div className="alert alert-info">
          You are viewing as: {demoRole}
        </div>
      )}
      
      <h1>Dashboard</h1>
      {/* Rest of dashboard */}
    </div>
  );
}
```

---

### Pattern 9: Field-Level Permissions

**Use Case**: Control access to specific fields

```javascript
import { Can } from '../../context/AbilityContext';

function ProfileForm({ profile }) {
  return (
    <form>
      <input name="name" value={profile.name} />
      
      {/* Only show email field if user can read it */}
      <Can I="read" a="Profile" field="email">
        <input name="email" value={profile.email} />
      </Can>
      
      {/* Only show salary field if user can read it */}
      <Can I="read" a="Profile" field="salary">
        <input name="salary" value={profile.salary} />
      </Can>
    </form>
  );
}
```

---

### Pattern 10: Batch Permission Checks

**Use Case**: Check multiple permissions at once

```javascript
import { useAbility } from '../../hooks/useAbility';

function ApplicationCard({ application }) {
  const { can } = useAbility();
  
  const canView = can('read', 'Applications');
  const canEdit = can('update', 'Applications');
  const canDelete = can('delete', 'Applications');
  const canReview = can('review', 'Applications');
  
  return (
    <div className="card">
      <h3>{application.title}</h3>
      
      <div className="actions">
        {canView && <button>View</button>}
        {canEdit && <button>Edit</button>}
        {canReview && <button>Review</button>}
        {canDelete && <button>Delete</button>}
      </div>
    </div>
  );
}
```

## Configuration

### Enable Demo Mode

Add to your `.env` file:

```env
VITE_ENABLE_DEMO_MODE=true
```

Demo mode will only show in:
- Development environment (always)
- Production environment (only if `VITE_ENABLE_DEMO_MODE=true`)

## Security Considerations

1. **Frontend Only**: CASL permissions are for UX only. Always validate on backend.
2. **Session Storage**: Demo roles use `sessionStorage` (cleared on tab close).
3. **No Data Modification**: Demo mode should prevent destructive actions.
4. **Backend Validation**: All API calls must validate permissions server-side.
5. **Supabase RLS**: Use Row Level Security policies for database-level protection.

## Performance

- **Caching**: Ability rules are cached in memory
- **Memoization**: CASL uses memoization for permission checks
- **Lazy Loading**: Components load only when permission granted
- **Optimistic UI**: Permission checks are synchronous (no loading states)

## Troubleshooting

### Issue: Permission checks always return false
**Solution**: Verify user role is correctly set in `user.user_metadata.user_role` or `user.role`

### Issue: Demo mode not showing
**Solution**: Check `VITE_ENABLE_DEMO_MODE` environment variable

### Issue: Components not re-rendering after role switch
**Solution**: Ensure `AbilityContext` is properly wrapped around your app

### Issue: FeatureGate and PermissionGate conflict
**Solution**: Use `PermissionGate` as outer wrapper, `FeatureGate` as inner

## Best Practices

1. **Always use PermissionGate for routes** - Prevents unauthorized access
2. **Combine with FeatureGate for premium features** - Hybrid control
3. **Use Can component for UI elements** - Cleaner than inline checks
4. **Cache ability objects** - Don't recreate on every render
5. **Test all roles** - Use demo mode to verify permissions
6. **Document permissions** - Keep permission matrix updated
7. **Backend validation** - Never trust frontend checks alone

## Future Enhancements

- [ ] Add permission audit logging
- [ ] Implement role hierarchies (admin inherits all permissions)
- [ ] Add field-level permissions (can edit specific fields)
- [ ] Create permission management UI
- [ ] Add time-based permissions (temporary access)
- [ ] Implement attribute-based access control (ABAC)

## References

- [CASL Documentation](https://casl.js.org/)
- [CASL React Integration](https://casl.js.org/v6/en/package/casl-react)
- [Supabase Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

---

**Last Updated**: February 2026  
**Version**: 1.0.0  
**Maintainer**: Development Team

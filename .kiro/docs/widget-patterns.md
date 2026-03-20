# Widget Composition Patterns

## Overview

This document provides comprehensive analysis of widget state management patterns, prop patterns, and composition best practices for the FSD Phase 6 migration. It serves as a pattern library for building consistent, maintainable widgets.

## Widget State Management Patterns

### Pattern 1: Local State Management

**When to use**: Simple widgets with isolated state that doesn't need to be shared.

**Example**: KPI Dashboard Widget
```typescript
// src/widgets/kpi-dashboard/ui/KPIDashboard.tsx
const [kpiData, setKpiData] = useState<KPIData | null>(null)
const [loading, setLoading] = useState(true)
const [error, setError] = useState<string | null>(null)
```

**Characteristics**:
- Uses React `useState` for component-local state
- State is not shared across components
- Simple data fetching and display logic
- Suitable for widgets with self-contained functionality

**Best Practices**:
- Keep state minimal and focused
- Use TypeScript interfaces for state types
- Handle loading and error states explicitly
- Clean up side effects in useEffect cleanup functions

### Pattern 2: Zustand Store Management

**When to use**: Widgets that need to share state across multiple components or persist state.

**Example**: Admin Navigation Widget
```typescript
// Uses global stores
const { role } = useUserRole()
const user = useUser()
```

**Characteristics**:
- Accesses global Zustand stores
- State persists across component unmounts
- Enables cross-widget communication
- Optimized re-renders through selectors

**Best Practices**:
- Use specific selectors to minimize re-renders
- Keep store logic separate from UI components
- Document store dependencies in widget model/types.ts
- Avoid prop drilling by using stores directly

### Pattern 3: Context API

**When to use**: Widget-specific state that needs to be shared within widget hierarchy.

**Characteristics**:
- Provides state to nested components
- Avoids prop drilling within widget
- Scoped to widget component tree
- Good for theme, configuration, or widget-specific context

**Best Practices**:
- Create context in widget/model/ directory
- Provide clear TypeScript types for context value
- Use custom hooks to access context
- Document context usage in widget documentation

### Pattern 4: Hybrid Approach

**When to use**: Complex widgets with both local and global state needs.

**Example**: Navigation widget with local UI state + global user state
```typescript
// Local state for UI interactions
const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({})

// Global state for user data
const { role } = useUserRole()
const user = useUser()
```

**Characteristics**:
- Combines local state for UI interactions
- Uses global stores for shared data
- Separates concerns effectively
- Optimizes performance

**Best Practices**:
- Use local state for transient UI state (open/closed, hover, focus)
- Use global stores for persistent data (user, settings, entities)
- Document which state is local vs global
- Keep state management patterns consistent within widget

## Prop Patterns

### Pattern 1: Minimal Props Interface

**When to use**: Widgets that primarily use global state or fetch their own data.

**Example**: KPI Dashboard
```typescript
export interface KPIDashboardProps {
  schoolId?: string
  refreshInterval?: number // in milliseconds, default 15 minutes
}
```

**Characteristics**:
- 2-4 props maximum
- Optional configuration props
- No prop drilling
- Self-contained data fetching

**Best Practices**:
- Keep props focused on configuration
- Use optional props with sensible defaults
- Document default values in interface comments
- Avoid passing data that can be fetched or accessed from stores

### Pattern 2: Callback Props

**When to use**: Widgets that need to communicate events to parent components.

**Example**: Modal/Drawer widgets
```typescript
export interface MessageModalProps {
  isOpen: boolean
  onClose: () => void
  student?: any
  userRole?: 'school_admin' | 'college_admin' | 'university_admin' | 'educator'
}
```

**Characteristics**:
- Boolean control props (isOpen, isVisible)
- Callback functions for events (onClose, onSubmit, onCancel)
- Optional data props
- Clear event handling contract

**Best Practices**:
- Use `on` prefix for callback props
- Keep callbacks focused on single responsibility
- Provide TypeScript types for callback parameters
- Document when callbacks are called

### Pattern 3: Navigation Props

**When to use**: Navigation widgets that need to sync with parent state.

**Example**: Admin Sidebar
```typescript
interface SidebarProps {
  activeTab: string
  setActiveTab: (tab: string) => void
  showMobileMenu: boolean
  onMobileMenuClose?: () => void
}
```

**Characteristics**:
- Controlled component pattern
- State and setter props
- Optional callback props
- Synchronizes with parent routing

**Best Practices**:
- Use controlled component pattern for shared state
- Provide both state and setter props
- Make optional callbacks truly optional
- Document prop relationships

### Pattern 4: Data Props

**When to use**: Widgets that display data provided by parent.

**Example**: Student Profile Drawer
```typescript
export interface StudentProfileDrawerProps {
  isOpen: boolean
  onClose: () => void
  student: any // Should be typed as Student entity
  userRole: 'school_admin' | 'college_admin' | 'university_admin' | 'educator'
  defaultTab?: string
}
```

**Characteristics**:
- Required data props
- Control props (isOpen)
- Callbacks (onClose)
- Optional configuration (defaultTab)

**Best Practices**:
- Use entity types from @/entities/ for data props
- Mark required data as non-optional
- Provide sensible defaults for configuration
- Validate props at runtime if needed

## Prop Drilling vs Context Usage

### When to Use Props

**Scenarios**:
- Passing data 1-2 levels deep
- Simple configuration values
- Callback functions
- Data that changes frequently

**Example**:
```typescript
// Parent
<KPIDashboard schoolId={schoolId} refreshInterval={900000} />

// Widget - direct prop usage, no drilling
const KPIDashboard: React.FC<KPIDashboardProps> = ({ schoolId, refreshInterval }) => {
  // Use props directly
}
```

### When to Use Context

**Scenarios**:
- Data needed by many nested components
- Widget-wide configuration (theme, locale)
- Avoiding prop drilling 3+ levels deep
- Shared state within widget hierarchy

**Example**:
```typescript
// Widget context for theme/config
const WidgetConfigContext = createContext<WidgetConfig | null>(null)

// Provider at widget root
<WidgetConfigContext.Provider value={config}>
  <WidgetContent />
</WidgetConfigContext.Provider>

// Deep nested component
const DeepComponent = () => {
  const config = useContext(WidgetConfigContext)
  // Use config without prop drilling
}
```

### When to Use Global Stores

**Scenarios**:
- User authentication state
- Application-wide settings
- Entity data (users, courses, organizations)
- Cross-widget communication

**Example**:
```typescript
// Any component in widget can access
const { role } = useUserRole()
const user = useUser()
// No props needed
```

### Decision Matrix

| Depth | Data Type | Recommendation |
|-------|-----------|----------------|
| 1-2 levels | Configuration | Props |
| 1-2 levels | Callbacks | Props |
| 3+ levels | Configuration | Context |
| 3+ levels | Shared state | Context |
| Any depth | User data | Global store |
| Any depth | Entity data | Global store |
| Any depth | App settings | Global store |

## Composition Best Practices

### Rule 1: Layer Dependency Hierarchy

**Widgets can import from**:
- ✅ @/entities/ - Business entities
- ✅ @/features/ - Feature components
- ✅ @/shared/ - Shared UI components, utilities

**Widgets cannot import from**:
- ❌ @/app/ - Application layer (upward dependency)
- ❌ @/pages/ - Page layer (upward dependency)
- ❌ Other widgets - Widgets should not depend on each other

**Example - Correct**:
```typescript
// ✅ Good: Widget imports from allowed layers
import { UserCard } from '@/entities/user'
import { CourseEnrollment } from '@/features/course-enrollment'
import { Button, Card } from '@/shared/ui'
```

**Example - Incorrect**:
```typescript
// ❌ Bad: Widget imports from higher layers
import { AppProvider } from '@/app/providers'
import { DashboardPage } from '@/pages/dashboard'
import { OtherWidget } from '@/widgets/other-widget'
```

### Rule 2: Feature Composition

**Pattern**: Widgets compose multiple features to create complex UI sections.

**Example**: Dashboard Widget
```typescript
// Composes multiple features
import { UserStats } from '@/features/user-stats'
import { CourseProgress } from '@/features/course-progress'
import { RecentActivity } from '@/features/recent-activity'

export const DashboardWidget = () => (
  <div className="dashboard-grid">
    <UserStats />
    <CourseProgress />
    <RecentActivity />
  </div>
)
```

**Best Practices**:
- Compose 2-5 features per widget
- Keep composition logic in widget UI layer
- Use features as building blocks
- Avoid duplicating feature logic in widget

### Rule 3: Entity Usage

**Pattern**: Widgets use entities for data display and business logic.

**Example**: Student Profile Widget
```typescript
import { Student } from '@/entities/student'
import { formatStudentName, calculateGPA } from '@/entities/student/model'

export const StudentProfileWidget = ({ studentId }: Props) => {
  const student = useStudent(studentId)
  
  return (
    <div>
      <h2>{formatStudentName(student)}</h2>
      <p>GPA: {calculateGPA(student.grades)}</p>
    </div>
  )
}
```

**Best Practices**:
- Use entity types for data structures
- Use entity utilities for business logic
- Use entity UI components for display
- Don't duplicate entity logic in widgets

### Rule 4: Shared Component Usage

**Pattern**: Widgets use shared UI components for consistent styling.

**Example**:
```typescript
import { Button, Card, Modal, Input } from '@/shared/ui'
import { formatDate, formatCurrency } from '@/shared/lib'

export const PaymentWidget = () => (
  <Card>
    <Input label="Amount" />
    <Button onClick={handleSubmit}>Pay {formatCurrency(amount)}</Button>
  </Card>
)
```

**Best Practices**:
- Use shared UI components for all basic UI elements
- Use shared utilities for common operations
- Don't create widget-specific versions of shared components
- Contribute reusable components back to shared layer

### Rule 5: State Management Separation

**Pattern**: Keep state management in widget/model/ directory.

**Structure**:
```
src/widgets/dashboard/
├── ui/
│   └── Dashboard.tsx          # UI components only
├── model/
│   ├── types.ts               # TypeScript interfaces
│   ├── store.ts               # Zustand store (if needed)
│   └── hooks.ts               # Custom hooks
└── index.ts                   # Public API
```

**Best Practices**:
- Keep UI components focused on rendering
- Move complex logic to model/ directory
- Use custom hooks to encapsulate logic
- Export clean public API from index.ts

### Rule 6: Public API Design

**Pattern**: Widgets expose clean public API through index.ts.

**Example**:
```typescript
// src/widgets/dashboard/index.ts
export { Dashboard } from './ui/Dashboard'
export type { DashboardProps } from './model/types'

// Usage in pages
import { Dashboard } from '@/widgets/dashboard'
```

**Best Practices**:
- Export only what's needed by consumers
- Export types alongside components
- Don't export internal implementation details
- Use named exports for clarity

## Widget Pattern Library

### Pattern: Dashboard Widget

**Purpose**: Display aggregated data and KPIs from multiple sources.

**Composition**:
- Multiple feature components
- Entity data display
- Shared UI components (cards, charts)

**State Management**: Local state for data fetching + global stores for user context

**Props**: Minimal (schoolId, refreshInterval)

**Example**: KPI Dashboard Widget

**When to use**:
- Aggregating data from multiple features
- Displaying overview/summary information
- Creating role-specific dashboards

### Pattern: Navigation Widget

**Purpose**: Provide navigation structure and routing.

**Composition**:
- Shared UI components (buttons, icons)
- Global stores for user/role data
- Local state for UI interactions (open/closed groups)

**State Management**: Hybrid (local UI state + global user state)

**Props**: Navigation control props (activeTab, setActiveTab, showMobileMenu)

**Example**: Admin Sidebar Widget

**When to use**:
- Creating role-based navigation
- Building responsive navigation menus
- Implementing collapsible navigation groups

### Pattern: Modal/Drawer Widget

**Purpose**: Display content in overlay or slide-out panel.

**Composition**:
- Entity components for data display
- Feature components for actions
- Shared UI components (modal, drawer, buttons)

**State Management**: Props-based (controlled component)

**Props**: Control props (isOpen, onClose) + data props (entity data)

**Example**: Message Modal, Student Profile Drawer

**When to use**:
- Displaying detailed entity information
- Creating forms for data entry
- Showing contextual actions

### Pattern: Workflow Widget

**Purpose**: Guide users through multi-step processes.

**Composition**:
- Multiple feature components (one per step)
- Entity data for workflow context
- Shared UI components (stepper, buttons)

**State Management**: Local state for workflow progress + global stores for data

**Props**: Workflow configuration (examId, onComplete, onCancel)

**Example**: Exam Workflow Widget

**When to use**:
- Multi-step forms or processes
- Guided user workflows
- Complex data entry scenarios

### Pattern: Data Table Widget

**Purpose**: Display and manage tabular data with actions.

**Composition**:
- Entity components for row display
- Feature components for actions (edit, delete, export)
- Shared UI components (table, pagination, filters)

**State Management**: Local state for table state (sorting, filtering, pagination)

**Props**: Data source configuration

**When to use**:
- Displaying lists of entities
- Providing CRUD operations
- Implementing data management interfaces

## When to Create a Widget vs Feature Component

### Create a Widget When:

1. **Composing Multiple Features**
   - Component uses 2+ features together
   - Creates a cohesive UI section from multiple features
   - Example: Dashboard composing user-stats + course-progress + recent-activity

2. **Complex UI Composition**
   - Component has significant layout/composition logic
   - Combines entities, features, and shared components
   - Example: Student profile drawer with tabs, forms, and data display

3. **Page-Level Sections**
   - Component represents a major section of a page
   - Has its own state management needs
   - Example: Navigation sidebar, header with multiple features

4. **Reusable Across Pages**
   - Component is used on multiple pages
   - Provides consistent UI pattern
   - Example: KPI dashboard used on multiple admin pages

### Create a Feature Component When:

1. **Single Business Capability**
   - Component implements one specific feature
   - Focused on single business domain
   - Example: User authentication, course enrollment

2. **Reusable Business Logic**
   - Component encapsulates reusable business logic
   - Can be composed into multiple widgets
   - Example: Course search, user profile editor

3. **Domain-Specific Functionality**
   - Component is specific to one domain area
   - Uses entities from single domain
   - Example: Grade calculator, attendance tracker

4. **Independent Feature**
   - Component can work standalone
   - Doesn't require other features to function
   - Example: File uploader, notification system

### Decision Matrix

| Characteristic | Widget | Feature |
|----------------|--------|---------|
| Composes multiple features | ✅ Yes | ❌ No |
| Single business capability | ❌ No | ✅ Yes |
| Page-level section | ✅ Yes | ❌ No |
| Reusable across domains | ❌ No | ✅ Yes |
| Complex layout logic | ✅ Yes | ❌ No |
| Focused business logic | ❌ No | ✅ Yes |
| Uses multiple entities | ✅ Often | ❌ Rarely |
| Standalone functionality | ❌ No | ✅ Yes |

### Examples

**Widget Examples**:
- ✅ Admin Dashboard (composes user-stats, course-stats, system-health)
- ✅ Student Profile Drawer (composes profile-editor, grade-viewer, attendance-tracker)
- ✅ Navigation Sidebar (composes menu-items, user-menu, notifications)
- ✅ KPI Dashboard (composes multiple KPI cards from different domains)

**Feature Examples**:
- ✅ User Authentication (login, register, password reset)
- ✅ Course Enrollment (search courses, enroll, manage enrollments)
- ✅ Grade Calculator (calculate GPA, display grades)
- ✅ Attendance Tracker (mark attendance, view reports)

## Validation Results

### Current Widget Analysis

**Widgets Analyzed**: 5
- admin-navigation (AdminSidebar, AdminHeader)
- exam-workflow (ExamWorkflowManager)
- kpi-dashboard (KPIDashboard)
- message-modal (MessageModal)
- student-profile-drawer (StudentProfileDrawer)

**State Management Patterns Identified**:
- **Local State**: kpi-dashboard (useState for data fetching, loading, error)
- **Global Stores**: admin-navigation (useUserRole, useUser)
- **Hybrid**: Multiple widgets use both local UI state and global stores
- **Props-based**: message-modal, student-profile-drawer (controlled components)

**Prop Patterns Identified**:
- **Minimal Props** (2-4 props): kpi-dashboard (schoolId, refreshInterval)
- **Callback Props**: message-modal, student-profile-drawer (isOpen, onClose)
- **Navigation Props**: admin-navigation (activeTab, onTabChange, showMobileMenu)
- **Workflow Props**: exam-workflow (examId, onComplete, onCancel)

**Composition Best Practices Compliance**:

✅ **Passing**:
- All widgets follow FSD layer hierarchy
- Clean public API exports through index.ts
- Proper TypeScript interfaces for all props
- Widgets only import from allowed layers (entities, features, shared)
- State management separated in model/ directory
- UI components in ui/ directory

⚠️ **Needs Improvement**:
- Entity types not fully migrated (using `any` in message-modal and student-profile-drawer props)
- Some widgets could benefit from custom hooks for complex logic
- JSDoc documentation could be added to public APIs

**Recommendations**:
1. Replace `any` types with proper entity types from @/entities/
2. Extract complex data fetching logic to custom hooks in model/
3. Add JSDoc comments to exported components and types
4. Consider creating reusable composition patterns for similar widgets

## Summary

This widget pattern library provides:
- ✅ Documented state management patterns (local, Zustand, context, hybrid)
- ✅ Documented prop patterns (minimal, callback, navigation, data)
- ✅ Prop drilling vs context usage guidelines
- ✅ Composition best practices validation
- ✅ Comprehensive pattern library with code examples
- ✅ Clear guidance on widget vs feature component decisions

All widgets follow FSD composition best practices with minor improvements needed for full compliance.

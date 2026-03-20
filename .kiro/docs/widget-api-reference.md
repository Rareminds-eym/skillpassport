# Widget API Reference

This document provides API reference for all migrated widgets in the FSD architecture.

## KPI Dashboard Widget

**Location**: `@/widgets/kpi-dashboard`

### Types

```typescript
interface KPIDashboardProps {
  className?: string;
}

interface KPIData {
  label: string;
  value: number;
  change: number;
  trend: 'up' | 'down' | 'neutral';
}
```

### Component

```typescript
<KPIDashboard className="w-full" />
```

### Usage Example

```typescript
import { KPIDashboard } from '@/widgets/kpi-dashboard';

function AdminPage() {
  return (
    <div className="p-6">
      <h1>Admin Dashboard</h1>
      <KPIDashboard className="mt-4" />
    </div>
  );
}
```

### Dependencies
- **Entities**: User, Course, Organization
- **Features**: Analytics, Reporting
- **Shared**: Card, Chart components

---

## Exam Workflow Widget

**Location**: `@/widgets/exam-workflow`

### Types

```typescript
interface ExamWorkflowProps {
  examId: string;
  onComplete?: () => void;
}
```

### Component

```typescript
<ExamWorkflowManager examId="exam-123" onComplete={() => {}} />
```

### Usage Example

```typescript
import { ExamWorkflowManager } from '@/widgets/exam-workflow';

function ExamPage({ examId }: { examId: string }) {
  const handleComplete = () => {
    console.log('Exam completed');
  };
  
  return (
    <div>
      <ExamWorkflowManager 
        examId={examId} 
        onComplete={handleComplete} 
      />
    </div>
  );
}
```

### Dependencies
- **Entities**: Assessment, User
- **Features**: Exam submission, Timer
- **Shared**: Button, Form components

---

## Admin Navigation Widget

**Location**: `@/widgets/admin-navigation`

### Types

```typescript
interface AdminNavigationProps {
  currentPath: string;
}
```

### Component

```typescript
<AdminNavigation currentPath="/admin/users" />
```

### Usage Example

```typescript
import { AdminNavigation } from '@/widgets/admin-navigation';
import { useLocation } from 'react-router-dom';

function AdminLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  
  return (
    <div className="flex">
      <AdminNavigation currentPath={location.pathname} />
      <main className="flex-1">{children}</main>
    </div>
  );
}
```

### Dependencies
- **Entities**: User
- **Features**: Navigation, Auth
- **Shared**: Navigation components

---

## Message Modal Widget

**Location**: `@/widgets/message-modal`

### Types

```typescript
interface MessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipientId?: string;
}
```

### Component

```typescript
<MessageModal 
  isOpen={true} 
  onClose={() => {}} 
  recipientId="user-123" 
/>
```

### Usage Example

```typescript
import { MessageModal } from '@/widgets/message-modal';
import { useState } from 'react';

function MessagingFeature() {
  const [isOpen, setIsOpen] = useState(false);
  const [recipientId, setRecipientId] = useState<string>();
  
  return (
    <>
      <button onClick={() => setIsOpen(true)}>
        Send Message
      </button>
      <MessageModal 
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        recipientId={recipientId}
      />
    </>
  );
}
```

### Dependencies
- **Entities**: Message, User
- **Features**: Messaging
- **Shared**: Modal, Form components

---

## Student Profile Drawer Widget

**Location**: `@/widgets/student-profile-drawer`

### Types

```typescript
interface StudentProfileDrawerProps {
  studentId: string;
  isOpen: boolean;
  onClose: () => void;
}
```

### Component

```typescript
<StudentProfileDrawer 
  studentId="student-123"
  isOpen={true}
  onClose={() => {}}
/>
```

### Usage Example

```typescript
import { StudentProfileDrawer } from '@/widgets/student-profile-drawer';
import { useState } from 'react';

function StudentList() {
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  
  return (
    <>
      <div>
        {students.map(student => (
          <div onClick={() => setSelectedStudent(student.id)}>
            {student.name}
          </div>
        ))}
      </div>
      <StudentProfileDrawer
        studentId={selectedStudent!}
        isOpen={!!selectedStudent}
        onClose={() => setSelectedStudent(null)}
      />
    </>
  );
}
```

### Dependencies
- **Entities**: User, Course, Project
- **Features**: Profile, Enrollment
- **Shared**: Drawer, Card components

---

## Widget Composition Patterns

### Pattern 1: Dashboard Composition

Widgets compose multiple features and entities to create complex UIs:

```typescript
// widgets/kpi-dashboard/ui/KPIDashboard.tsx
import { UserStats } from '@/features/analytics';
import { CourseStats } from '@/features/analytics';
import { UserCard } from '@/entities/user';

export function KPIDashboard() {
  return (
    <div className="grid grid-cols-3 gap-4">
      <UserStats />
      <CourseStats />
      {/* More composed features */}
    </div>
  );
}
```

### Pattern 2: Modal/Drawer Widgets

Widgets that manage complex modal interactions:

```typescript
// widgets/message-modal/ui/MessageModal.tsx
import { MessageForm } from '@/features/messaging';
import { UserCard } from '@/entities/user';
import { Modal } from '@/shared/ui';

export function MessageModal({ isOpen, onClose, recipientId }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      {recipientId && <UserCard entity={recipient} />}
      <MessageForm recipientId={recipientId} onSuccess={onClose} />
    </Modal>
  );
}
```

### Pattern 3: Navigation Widgets

Widgets that compose navigation with user context:

```typescript
// widgets/admin-navigation/ui/AdminNavigation.tsx
import { NavMenu } from '@/features/navigation';
import { UserProfile } from '@/features/profile';
import { useCurrentUser } from '@/entities/user';

export function AdminNavigation({ currentPath }) {
  const user = useCurrentUser();
  
  return (
    <nav>
      <UserProfile user={user} />
      <NavMenu currentPath={currentPath} items={adminMenuItems} />
    </nav>
  );
}
```

### Pattern 4: Workflow Widgets

Widgets that manage multi-step workflows:

```typescript
// widgets/exam-workflow/ui/ExamWorkflowManager.tsx
import { ExamTimer } from '@/features/exam';
import { QuestionList } from '@/features/exam';
import { SubmitButton } from '@/features/exam';
import { useExamWorkflowStore } from '../model/store';

export function ExamWorkflowManager({ examId, onComplete }) {
  const { currentStep, nextStep } = useExamWorkflowStore();
  
  return (
    <div>
      <ExamTimer examId={examId} />
      <QuestionList examId={examId} />
      <SubmitButton onSubmit={onComplete} />
    </div>
  );
}
```

## Widget State Management

### Local State (Simple Widgets)

```typescript
// widgets/simple-widget/ui/SimpleWidget.tsx
import { useState } from 'react';

export function SimpleWidget() {
  const [isExpanded, setIsExpanded] = useState(false);
  // Use local state for simple UI state
}
```

### Zustand Store (Complex Widgets)

```typescript
// widgets/complex-widget/model/store.ts
import { create } from 'zustand';

interface WidgetStore {
  data: Data[];
  isLoading: boolean;
  fetchData: () => Promise<void>;
}

export const useWidgetStore = create<WidgetStore>((set) => ({
  data: [],
  isLoading: false,
  fetchData: async () => {
    set({ isLoading: true });
    const data = await fetchData();
    set({ data, isLoading: false });
  },
}));
```

## Best Practices

### 1. Widget Responsibilities
- ✓ Compose features and entities
- ✓ Manage widget-specific UI state
- ✓ Coordinate complex interactions
- ✗ Implement business logic (delegate to features)
- ✗ Make direct API calls (use entities/features)

### 2. Import Rules
```typescript
// ✓ Allowed
import { Feature } from '@/features/feature-name';
import { Entity } from '@/entities/entity-name';
import { Component } from '@/shared/ui';

// ✗ Not allowed
import { OtherWidget } from '@/widgets/other-widget';
import { Page } from '@/pages/page-name';
```

### 3. Props Design
```typescript
// ✓ Good - Simple, focused props
interface WidgetProps {
  id: string;
  onComplete?: () => void;
  className?: string;
}

// ✗ Bad - Too many responsibilities
interface WidgetProps {
  data: ComplexData;
  onFetch: () => void;
  onUpdate: () => void;
  onDelete: () => void;
  // ... too many props
}
```

### 4. State Management
- Use local state for simple UI state (expanded/collapsed, selected tab)
- Use Zustand for complex widget state that needs to be shared
- Delegate data fetching to features/entities
- Keep widget state isolated (don't share between widgets)

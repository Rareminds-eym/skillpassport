# Student Data Architecture - ID-Based System

## Overview

Complete modular architecture for student data management using ID-based operations only. Zero email queries, clean separation of concerns, and production-ready implementation.

## Architecture Layers

```
┌─────────────────────────────────────────────────────────────┐
│                         UI Layer                             │
│  Components (Dashboard.jsx, MyLearning.jsx, MySkills.jsx)   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                      Hook Layer                              │
│              useStudentData.ts (Facade)                      │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    State Management                          │
│         studentStore.ts (Zustand + Immer + Devtools)        │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                     Service Layer                            │
│  studentService.ts, educationService.ts, etc. (7 services)  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                       Database                               │
│              Supabase PostgreSQL Tables                      │
└─────────────────────────────────────────────────────────────┘
```

## Core Principles

1. **ID-Based Only**: All operations use student_id, zero email queries
2. **Single Source of Truth**: Zustand store is the only state container
3. **Clean Separation**: Components → Hooks → Store → Services → Database
4. **Type Safety**: Full TypeScript coverage with proper types
5. **Field Mapping**: Services handle camelCase ↔ snake_case conversion
6. **No Direct DB Access**: Components never touch Supabase directly

## File Structure

```
src/
├── services/student/
│   ├── types.ts                    # All TypeScript types
│   ├── index.ts                    # Barrel export
│   ├── studentService.ts           # Core student CRUD
│   ├── educationService.ts         # Education CRUD
│   ├── experienceService.ts        # Experience CRUD
│   ├── skillsService.ts            # Skills CRUD
│   ├── projectsService.ts          # Projects CRUD
│   ├── trainingsService.ts         # Trainings CRUD + Skills linking
│   └── certificatesService.ts      # Certificates CRUD
├── stores/
│   ├── studentStore.ts             # Student state management
│   └── index.ts                    # Store initialization
├── hooks/
│   └── useStudentData.ts           # Facade hook for components
└── pages/student/
    ├── Dashboard.jsx               # ✅ Migrated
    ├── MyLearning.jsx              # ✅ Migrated
    ├── MySkills.jsx                # ✅ Migrated
    └── [20+ files to migrate]
```

## Data Flow

### Read Flow
```
1. Component calls useStudentData({ loadRelated: true })
2. Hook checks authStore for user_id
3. Hook calls studentStore.loadStudentByUserId(user_id)
4. Store calls studentService.getStudentByUserId(user_id)
5. Service queries database and returns student with student_id
6. Store saves student_id and calls loadEducation(student_id)
7. Each entity service queries by student_id
8. Store updates state with all data
9. Hook returns reactive data to component
10. Component renders
```

### Write Flow
```
1. Component calls updateEducationBulk(records)
2. Hook forwards to studentStore.updateEducationBulk(records)
3. Store calls educationService.bulkUpsertEducation(student_id, records)
4. Service:
   - Filters invalid UI fields (certificateUrl, etc.)
   - Maps camelCase → snake_case (startDate → start_date)
   - Validates against database schema
   - Executes upsert query
5. Service returns success/error
6. Store updates local state on success
7. Component receives updated data reactively
```

## Service Layer Details

### Common Patterns

All services follow this structure:

```typescript
// 1. Get by student_id
export async function getEntityByStudentId(
  studentId: string
): Promise<ServiceResponse<Entity[]>>

// 2. Create new entity
export async function createEntity(
  input: CreateEntityInput
): Promise<ServiceResponse<Entity>>

// 3. Update existing entity
export async function updateEntity(
  entityId: string,
  updates: Partial<CreateEntityInput>
): Promise<ServiceResponse<Entity>>

// 4. Delete entity
export async function deleteEntity(
  entityId: string
): Promise<ServiceResponse<void>>

// 5. Bulk upsert (for batch operations)
export async function bulkUpsertEntity(
  studentId: string,
  records: Partial<Entity>[]
): Promise<ServiceResponse<Entity[]>>
```

### Field Mapping

Services automatically handle field name variations:

```typescript
// UI sends camelCase
{ completedModules: 12, totalModules: 15, hoursSpent: 24 }

// Service maps to snake_case
{ completed_modules: 12, total_modules: 15, hours_spent: 24 }

// Common mappings:
course → title
courseName → title
provider → organization
startDate → start_date
endDate → end_date
certificateUrl → (filtered out, not in DB)
```

### Special Cases

#### Trainings Service
- Handles skills linking via `training_id` foreign key
- On create: Inserts skills to skills table with `training_id`
- On update: Syncs skills (adds new, removes deleted)
- On delete: Cascades to delete associated skills

```typescript
// Skills are stored separately
trainings table: { id, title, organization, ... }
skills table: { id, student_id, training_id, name, type, level, ... }
```

## Store Architecture

### State Structure

```typescript
interface StudentState {
  // Core
  student: Student | null
  studentId: string | null
  
  // Related entities
  education: Education[]
  experience: Experience[]
  skills: Skill[]
  projects: Project[]
  trainings: Training[]
  certificates: Certificate[]
  
  // Loading states (per entity)
  isLoading: boolean
  isLoadingEducation: boolean
  // ... etc
  
  // Error handling
  error: string | null
  
  // Computed
  hasStudent: boolean
  isProfileComplete: boolean
  
  // Actions (40+ methods)
  loadStudentByUserId: (userId: string) => Promise<void>
  updateEducationBulk: (records: Partial<Education>[]) => Promise<void>
  // ... etc
}
```

### Middleware Stack

```typescript
create<StudentState>()(
  devtools(           // Redux DevTools integration
    immer(            // Immutable updates
      (set, get) => ({
        // State and actions
      })
    ),
    { name: 'StudentStore' }
  )
)
```

## Hook Layer

### useStudentData Hook

Facade pattern that simplifies component usage:

```typescript
const {
  // Core
  student,
  studentId,
  isLoading,
  error,
  
  // Entities (auto-loaded if loadRelated: true)
  education,
  experience,
  skills,
  projects,
  trainings,
  certificates,
  
  // Actions
  updateEducationBulk,
  updateSkillsBulk,
  addTraining,
  deleteProjectItem,
  // ... etc
  
} = useStudentData({ 
  loadRelated: true  // Auto-load all entities
})
```

### Integration with Auth

```typescript
// Hook automatically gets user_id from authStore
const { user } = useAuthStore()
const userId = user?.id

// Then loads student by user_id
useEffect(() => {
  if (userId) {
    loadStudentByUserId(userId)
  }
}, [userId])
```

## Database Schema Alignment

All services match actual database columns exactly:

### Students Table
```sql
id, user_id, email, name, student_type, school_id, college_id,
contact_number, date_of_birth, is_deleted, deleted_at, deleted_by,
created_at, updated_at
```

### Trainings Table
```sql
id, student_id, title, organization, start_date, end_date, duration,
description, status, completed_modules, total_modules, hours_spent,
course_id, source, approval_status, approval_authority, approved_by,
approved_at, rejected_by, rejected_at, approval_notes, enabled,
has_pending_edit, pending_edit_data, verified_data, created_at, updated_at
```

### Skills Table (with training_id)
```sql
id, student_id, name, type, level, description, verified, enabled,
approval_status, training_id, proficiency_level, has_pending_edit,
pending_edit_data, verified_data, created_at, updated_at
```

## Migration Status

### ✅ Completed (3 files)
- `src/pages/student/Dashboard.jsx`
- `src/pages/student/MyLearning.jsx`
- `src/pages/student/MySkills.jsx`

### 🔄 Remaining (20+ files)
See MIGRATION_STEPS.md for detailed plan

## Error Handling

### Service Layer
```typescript
try {
  const { data, error } = await supabase.from('table').select()
  if (error) {
    logger.error('Operation failed', error, { context })
    return { success: false, data: null, error: error.message }
  }
  return { success: true, data, error: null }
} catch (err: any) {
  logger.error('Exception', err, { context })
  return { success: false, data: null, error: err.message }
}
```

### Store Layer
```typescript
try {
  const result = await service.operation()
  if (result.success) {
    set(state => { state.entity = result.data })
  } else {
    set(state => { state.error = result.error })
  }
} catch (err) {
  set(state => { state.error = err.message })
}
```

### Component Layer
```typescript
const { education, isLoadingEducation, error } = useStudentData()

if (isLoadingEducation) return <Spinner />
if (error) return <ErrorMessage error={error} />
return <EducationList data={education} />
```

## Performance Optimizations

1. **Selective Loading**: `loadRelated` parameter controls what to fetch
2. **Memoization**: Zustand selectors prevent unnecessary re-renders
3. **Batch Operations**: Bulk upsert for multiple records
4. **Optimistic Updates**: UI updates immediately, syncs in background
5. **Lazy Loading**: Only load entities when needed

## Testing

All services have comprehensive test coverage:

```typescript
// src/stores/__tests__/stores.test.ts
describe('StudentStore', () => {
  it('loads student by user_id', async () => {
    // Test implementation
  })
  
  it('updates education bulk', async () => {
    // Test implementation
  })
  
  // 27 passing tests
})
```

## Best Practices

### DO ✅
- Use `useStudentData` hook in components
- Call bulk operations for multiple records
- Handle loading and error states
- Use TypeScript types from `types.ts`
- Let services handle field mapping

### DON'T ❌
- Query Supabase directly from components
- Use email-based queries
- Bypass the store layer
- Hardcode field names
- Ignore error responses

## Troubleshooting

### Common Issues

**Issue**: "Could not find column X"
- **Cause**: UI sending invalid field name
- **Fix**: Service filters invalid fields, check field mapping

**Issue**: "null value in column violates not-null constraint"
- **Cause**: Required field missing or wrong field name
- **Fix**: Check field mapping (e.g., `course` → `title`)

**Issue**: Data not updating in UI
- **Cause**: Not using Zustand store
- **Fix**: Use `useStudentData` hook, not direct queries

**Issue**: Duplicate skills
- **Cause**: Old implementation deleted and recreated all
- **Fix**: New implementation only adds new skills

## Future Enhancements

1. Real-time subscriptions for collaborative editing
2. Offline support with sync queue
3. Optimistic locking for concurrent updates
4. Audit trail for all changes
5. Bulk import/export functionality

## Related Documentation

- `MIGRATION_STEPS.md` - Phased migration plan
- `src/services/student/types.ts` - All type definitions
- `src/stores/studentStore.ts` - Store implementation
- `src/hooks/useStudentData.ts` - Hook usage examples

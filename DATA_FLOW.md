# Student Data Flow Documentation

## Complete Data Flow Diagrams

### 1. Initial Page Load Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    User Opens Dashboard                          │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│              Component: Dashboard.jsx Mounts                     │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│    Hook: useStudentData({ loadRelated: true }) Called           │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│         Hook checks authStore for authenticated user             │
│              const { user } = useAuthStore()                     │
│                   userId = user?.id                              │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│    Store: studentStore.loadStudentByUserId(userId) Called       │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│   Service: studentService.getStudentByUserId(userId) Called     │
│                                                                  │
│   Query: SELECT * FROM students WHERE user_id = $1              │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│              Database Returns Student Record                     │
│         { id: "student-uuid", user_id: "user-uuid", ... }       │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│         Store Updates State with Student Data                    │
│              state.student = studentData                         │
│              state.studentId = studentData.id                    │
│              state.hasStudent = true                             │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│    Hook Detects loadRelated: true, Loads All Entities           │
│              Parallel Calls to:                                  │
│              - loadEducation(studentId)                          │
│              - loadExperience(studentId)                         │
│              - loadSkills(studentId)                             │
│              - loadProjects(studentId)                           │
│              - loadTrainings(studentId)                          │
│              - loadCertificates(studentId)                       │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│         Each Service Queries Database by student_id              │
│                                                                  │
│   educationService: SELECT * FROM education                      │
│                     WHERE student_id = $1                        │
│                     ORDER BY created_at DESC                     │
│                                                                  │
│   trainingsService: SELECT * FROM trainings                      │
│                     WHERE student_id = $1                        │
│                     ORDER BY start_date DESC                     │
│                                                                  │
│   ... (similar for all entities)                                │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│            Store Updates State with All Entity Data              │
│              state.education = educationData                     │
│              state.trainings = trainingsData                     │
│              state.skills = skillsData                           │
│              ... (all entities)                                  │
│              state.isLoading = false                             │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│         Hook Returns Reactive Data to Component                  │
│         const { student, education, trainings, ... }             │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│              Component Renders with Data                         │
│         {education.map(edu => <EducationCard />)}                │
└─────────────────────────────────────────────────────────────────┘
```

### 2. Update Training Flow (with Skills)

```
┌─────────────────────────────────────────────────────────────────┐
│         User Edits Training in MyLearning.jsx                    │
│         - Changes title, modules, hours                          │
│         - Adds new skills: ["React", "Node.js"]                  │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│              User Clicks "Save Changes"                          │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│    Component Calls: updateTrainingItem(trainingId, updates)     │
│                                                                  │
│    updates = {                                                   │
│      title: "Advanced React Course",                            │
│      completedModules: 12,                                       │
│      totalModules: 15,                                           │
│      hoursSpent: 24,                                             │
│      skills: ["React", "Node.js", "TypeScript"]                 │
│    }                                                             │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│    Hook Forwards to: studentStore.updateTrainingItem()          │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│    Store Calls: trainingsService.updateTraining()               │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│              Service: Field Mapping & Validation                 │
│                                                                  │
│    1. Extract skills separately                                  │
│       skills = ["React", "Node.js", "TypeScript"]               │
│                                                                  │
│    2. Map camelCase → snake_case                                │
│       completedModules → completed_modules: 12                   │
│       totalModules → total_modules: 15                           │
│       hoursSpent → hours_spent: 24                               │
│                                                                  │
│    3. Filter invalid fields                                      │
│       Remove: certificateUrl, newSkillName, etc.                │
│                                                                  │
│    4. Keep only valid DB columns                                 │
│       cleanUpdates = {                                           │
│         title: "Advanced React Course",                          │
│         completed_modules: 12,                                   │
│         total_modules: 15,                                       │
│         hours_spent: 24,                                         │
│         updated_at: "2026-03-11T07:00:00Z"                      │
│       }                                                          │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│              Service: Update Training Record                     │
│                                                                  │
│    UPDATE trainings                                              │
│    SET title = $1,                                               │
│        completed_modules = $2,                                   │
│        total_modules = $3,                                       │
│        hours_spent = $4,                                         │
│        updated_at = $5                                           │
│    WHERE id = $6                                                 │
│    RETURNING *                                                   │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│              Service: Sync Skills (Smart Update)                 │
│                                                                  │
│    1. Fetch existing skills for this training                    │
│       SELECT * FROM skills WHERE training_id = $1                │
│       Result: ["React", "JavaScript"]                            │
│                                                                  │
│    2. Compare with new skills                                    │
│       New: ["React", "Node.js", "TypeScript"]                   │
│       Existing: ["React", "JavaScript"]                          │
│                                                                  │
│    3. Identify changes                                           │
│       To Add: ["Node.js", "TypeScript"]                         │
│       To Remove: ["JavaScript"]                                  │
│       To Keep: ["React"]                                         │
│                                                                  │
│    4. Delete removed skills                                      │
│       DELETE FROM skills                                         │
│       WHERE training_id = $1                                     │
│       AND name = 'JavaScript'                                    │
│                                                                  │
│    5. Insert new skills                                          │
│       INSERT INTO skills (student_id, training_id, name, ...)   │
│       VALUES                                                     │
│         ($1, $2, 'Node.js', 'technical', ...),                  │
│         ($1, $2, 'TypeScript', 'technical', ...)                │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│         Service Returns Success Response                         │
│         { success: true, data: updatedTraining, error: null }   │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│         Store Updates Local State                                │
│         state.trainings = state.trainings.map(t =>               │
│           t.id === trainingId ? updatedTraining : t              │
│         )                                                        │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│         Store Reloads Skills to Get Updated List                 │
│         await loadSkills(studentId)                              │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│         Component Receives Updated Data Reactively               │
│         UI automatically re-renders with new data                │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│              User Sees Updated Training & Skills                 │
│         ✅ Training updated                                      │
│         ✅ New skills added                                      │
│         ✅ Old skills removed                                    │
└─────────────────────────────────────────────────────────────────┘
```

### 3. Bulk Update Flow (Dashboard Save)

```
┌─────────────────────────────────────────────────────────────────┐
│         User Edits Multiple Trainings in Dashboard               │
│         - Training 1: Updated modules                            │
│         - Training 2: Changed status                             │
│         - Training 3: Added skills                               │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│              User Clicks "Save All"                              │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│    Component Calls: updateTrainingsBulk(allTrainings)           │
│                                                                  │
│    allTrainings = [                                              │
│      { id: "uuid-1", course: "React", ... },                    │
│      { id: "uuid-2", course: "Node.js", ... },                  │
│      { id: "uuid-3", course: "Python", ... }                    │
│    ]                                                             │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│    Store Calls: trainingsService.bulkUpsertTrainings()          │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│         Service: Process Each Record                             │
│                                                                  │
│    For each training:                                            │
│      1. Map field variations                                     │
│         course → title                                           │
│         courseName → title                                       │
│         provider → organization                                  │
│         completedModules → completed_modules                     │
│         totalModules → total_modules                             │
│         hoursSpent → hours_spent                                 │
│                                                                  │
│      2. Filter invalid fields                                    │
│         Remove: certificateUrl, newSkillName, etc.              │
│                                                                  │
│      3. Add metadata                                             │
│         student_id: studentId                                    │
│         updated_at: new Date().toISOString()                    │
│                                                                  │
│    Result: Clean records array                                   │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│         Service: Bulk Upsert to Database                         │
│                                                                  │
│    INSERT INTO trainings (id, student_id, title, ...)           │
│    VALUES                                                        │
│      ($1, $2, $3, ...),                                          │
│      ($4, $5, $6, ...),                                          │
│      ($7, $8, $9, ...)                                           │
│    ON CONFLICT (id) DO UPDATE SET                                │
│      title = EXCLUDED.title,                                     │
│      completed_modules = EXCLUDED.completed_modules,             │
│      ...                                                         │
│    RETURNING *                                                   │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│         Service Returns All Updated Records                      │
│         { success: true, data: [training1, training2, ...] }    │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│         Store Replaces Entire Trainings Array                    │
│         state.trainings = updatedTrainings                       │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│         Component Receives Updated Data                          │
│         All training cards refresh automatically                 │
└─────────────────────────────────────────────────────────────────┘
```

### 4. Delete Training Flow (with Cascade)

```
┌─────────────────────────────────────────────────────────────────┐
│         User Clicks Delete on Training Card                      │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│         Confirmation Dialog Appears                              │
│         "Are you sure you want to delete this training?"         │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│         User Confirms Deletion                                   │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│    Component Calls: deleteTrainingItem(trainingId)              │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│    Store Calls: trainingsService.deleteTraining(trainingId)     │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│         Service: Delete Associated Skills First                  │
│                                                                  │
│    DELETE FROM skills                                            │
│    WHERE training_id = $1                                        │
│                                                                  │
│    (Removes all skills linked to this training)                  │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│         Service: Delete Training Record                          │
│                                                                  │
│    DELETE FROM trainings                                         │
│    WHERE id = $1                                                 │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│         Service Returns Success                                  │
│         { success: true, data: null, error: null }              │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│         Store Reloads Trainings & Skills                         │
│         await loadTrainings(studentId)                           │
│         await loadSkills(studentId)                              │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│         Component Receives Updated Data                          │
│         Training card disappears from UI                         │
│         Associated skills removed from skills list               │
└─────────────────────────────────────────────────────────────────┘
```

### 5. Error Handling Flow

```
┌─────────────────────────────────────────────────────────────────┐
│         User Attempts Invalid Operation                          │
│         (e.g., save training without required title)             │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│         Component Validation (Optional)                          │
│         if (!title) { showError("Title required"); return }      │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│         Request Sent to Service Layer                            │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│         Service: Field Mapping Catches Issue                     │
│         - Missing required field: title                          │
│         - Invalid field name: certificateUrl                     │
│         - Wrong data type: completedModules = "abc"             │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│         Database Query Fails                                     │
│         Error: "null value in column 'title' violates            │
│                not-null constraint"                              │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│         Service Catches Error                                    │
│         logger.error('Failed to update training', error)         │
│         return { success: false, data: null, error: msg }        │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│         Store Receives Error Response                            │
│         if (!result.success) {                                   │
│           state.error = result.error                             │
│         }                                                        │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│         Component Receives Error                                 │
│         const { error } = useStudentData()                       │
│         if (error) { toast.error(error) }                        │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│         User Sees Error Message                                  │
│         🔴 "Failed to save: Title is required"                   │
└─────────────────────────────────────────────────────────────────┘
```

## State Management Flow

### Zustand Store Updates

```typescript
// Immer middleware allows direct mutations
set((state) => {
  state.trainings.push(newTraining)        // Add
  state.trainings[0].title = "Updated"     // Update
  state.trainings = state.trainings.filter(t => t.id !== id)  // Delete
})

// Devtools middleware logs all changes
// Redux DevTools shows:
// Action: "updateTrainingItem"
// Prev State: { trainings: [...] }
// Next State: { trainings: [...updated...] }
```

### Reactive Updates

```typescript
// Component automatically re-renders when store changes
const { trainings } = useStudentData()

// Zustand selector ensures only relevant components re-render
const trainings = useStudentStore(state => state.trainings)
// Only re-renders when trainings array changes
```

## Performance Considerations

### Parallel Loading
```typescript
// All entities load in parallel, not sequential
Promise.all([
  loadEducation(studentId),
  loadExperience(studentId),
  loadSkills(studentId),
  loadProjects(studentId),
  loadTrainings(studentId),
  loadCertificates(studentId),
])
```

### Selective Loading
```typescript
// Load only what's needed
useStudentData()  // Just student, no entities
useStudentData({ loadRelated: true })  // Everything
```

### Batch Operations
```typescript
// Single database call for multiple records
bulkUpsertTrainings([training1, training2, training3])
// vs
// updateTraining(training1)
// updateTraining(training2)
// updateTraining(training3)
```

## Security Flow

### Authentication Check
```
1. User must be authenticated (authStore.user exists)
2. Hook gets user_id from authStore
3. Service queries student by user_id
4. All subsequent queries use student_id
5. Database RLS policies enforce student_id = auth.uid()
```

### Authorization
```
- Students can only access their own data
- student_id is derived from authenticated user_id
- No way to query other students' data
- All queries filtered by student_id
```

## Debugging Flow

### Enable DevTools
```typescript
// Redux DevTools shows all store actions
// Time-travel debugging available
// State diff visualization
```

### Logging
```typescript
// All service calls logged
logger.info('Fetching trainings', { studentId })
logger.error('Failed to update', error, { trainingId })
```

### Error Tracking
```typescript
// Errors bubble up through layers
Database Error → Service Error → Store Error → Component Error → User Toast
```

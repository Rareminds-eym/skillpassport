# Frontend: Training → Learning Terminology Update

## Summary
Update all frontend references from "training/trainings" to "learning" to match the new terminology.

## Database Tables (Keep as-is)
- `trainings` table → Keep name (backend compatibility)
- `skills.training_id` → Keep name (foreign key)
- `certificates.training_id` → Keep name (foreign key)

## Frontend Changes Required

### 1. Component Files to Rename

```bash
# Rename files
src/components/Students/components/AddTrainingCourseModal.jsx 
  → src/components/Students/components/AddLearningCourseModal.jsx

src/components/Students/components/TrainingCoursesSection.jsx 
  → src/components/Students/components/LearningCoursesSection.jsx

src/pages/student/MyTraining.jsx 
  → src/pages/student/MyLearning.jsx

src/hooks/useStudentTraining.js 
  → src/hooks/useStudentLearning.js
```

### 2. UI Labels to Update

**Page Titles:**
- "Training" → "Learning"
- "My Training" → "My Learning"
- "Training Courses" → "Learning Courses"
- "Add Training" → "Add Learning"
- "Add Training Course" → "Add Learning Course"

**Buttons:**
- "Add Training" → "Add Learning"
- "Add Your First Training" → "Add Your First Learning"
- "Edit Training" → "Edit Learning"

**Stats/Metrics:**
- "Total Trainings" → "Total Learning"
- "Training added successfully" → "Learning added successfully"

**Messages:**
- "No training records yet" → "No learning records yet"
- "No training courses yet" → "No learning courses yet"
- "Track your courses, certifications, and professional development" → Keep as-is

### 3. Variable Names to Update

**State Variables:**
```javascript
// OLD
const [training, setTraining] = useState([]);
const [trainings, setTrainings] = useState([]);
const [showAddModal, setShowAddModal] = useState(false);

// NEW
const [learning, setLearning] = useState([]);
const [learningRecords, setLearningRecords] = useState([]);
const [showAddModal, setShowAddModal] = useState(false); // Keep
```

**Props:**
```javascript
// OLD
training={training}
trainings={trainingsData}
onSuccess={fetchTrainings}

// NEW
learning={learning}
learningRecords={learningData}
onSuccess={fetchLearning}
```

**Function Names:**
```javascript
// OLD
fetchTrainings()
updateTraining()
handleSaveTraining()

// NEW
fetchLearning()
updateLearning()
handleSaveLearning()
```

### 4. Route Changes

```javascript
// OLD
navigate('/student/my-training')

// NEW
navigate('/student/my-learning')
```

### 5. Modal Names

```javascript
// OLD
<TrainingEditModal />
setActiveModal('training')

// NEW
<LearningEditModal />
setActiveModal('learning')
```

### 6. Export/Import Names

```javascript
// OLD
import { trainingData } from './data/mockData';
export const trainingData = [...];

// NEW
import { learningData } from './data/mockData';
export const learningData = [...];
```

### 7. Service/Utility Files

**src/utils/studentExportUtils.ts:**
```typescript
// OLD
'Trainings': student.trainings.map(t => t.title).join(', ')
'Trainings Count': student.trainings.length
const trainings: any[] = [];
student.trainings.forEach(training => { ... })

// NEW
'Learning': student.learning.map(t => t.title).join(', ')
'Learning Count': student.learning.length
const learning: any[] = [];
student.learning.forEach(record => { ... })
```

**src/services/portfolioService.js:**
```javascript
// OLD
trainingsResult
.from('trainings')
trainings.map(training => ...)

// NEW
learningResult
.from('trainings') // Keep table name
learning.map(record => ...)
```

**src/services/studentServiceProfile.js:**
```javascript
// OLD
trainings (*)
data?.trainings
tableTrainings

// NEW
trainings (*) // Keep query (table name)
data?.trainings // Keep (table name)
learning // Variable name
```

### 8. Comments to Update

```javascript
// OLD
// Training/Course Info
// Trainings (comma-separated titles)
// 6. Trainings CSV
// TRAINING TABLE -> Career Skills

// NEW
// Learning/Course Info
// Learning (comma-separated titles)
// 6. Learning CSV
// LEARNING TABLE -> Career Skills
```

### 9. CSV Export Filenames

```javascript
// OLD
`${filename}_trainings_${timestamp}.csv`

// NEW
`${filename}_learning_${timestamp}.csv`
```

### 10. Data Structure Keys

**Keep these for backend compatibility:**
```javascript
// In API responses - keep as-is
{
  trainings: [...], // From database
  training_id: "...", // Foreign key
}

// In frontend state - rename
{
  learning: [...], // Transformed data
  learningId: "...", // Reference
}
```

## Implementation Steps

1. **Rename Files** (4 files)
2. **Update Imports** (all files importing renamed components)
3. **Update UI Labels** (strings in JSX)
4. **Update Variable Names** (state, props, functions)
5. **Update Routes** (navigation paths)
6. **Update Export/CSV** (filenames and headers)
7. **Test All Features** (ensure nothing breaks)

## Files Affected (Estimated 20+ files)

### High Priority:
- src/components/Students/components/AddTrainingCourseModal.jsx
- src/components/Students/components/TrainingCoursesSection.jsx
- src/pages/student/MyTraining.jsx
- src/hooks/useStudentTraining.js
- src/components/Students/components/Dashboard.jsx
- src/components/Students/App.js

### Medium Priority:
- src/utils/studentExportUtils.ts
- src/services/portfolioService.js
- src/services/studentServiceProfile.js
- src/utils/employabilityCalculator.js
- src/services/badgeService.js

### Low Priority:
- src/utils/setupTestData.js
- src/utils/realStudentDataService.js
- src/components/Students/data/mockData.js
- src/components/Students/components/AddDataTest.jsx

## Testing Checklist

- [ ] Learning page loads correctly
- [ ] Add learning modal opens and saves
- [ ] Learning records display properly
- [ ] Edit learning works
- [ ] Progress bars show correctly
- [ ] Skills from learning display
- [ ] Certificates link properly
- [ ] Export includes learning data
- [ ] Navigation to /student/my-learning works
- [ ] Recent updates show learning activities
- [ ] No console errors

## Notes

- **Database table names remain `trainings`** for backend compatibility
- **Foreign keys remain `training_id`** in database
- **Only frontend UI and variable names change** to "learning"
- **API queries still use `trainings` table name**
- **Transform data from `trainings` → `learning` in hooks/services**

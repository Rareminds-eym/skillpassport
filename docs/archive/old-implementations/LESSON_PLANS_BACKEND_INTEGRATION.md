# Lesson Plans Backend Integration Guide

## ✅ Completed Steps

### 1. Database Migration Applied
- ✅ Enhanced `lesson_plans` table with all required fields
- ✅ Added curriculum integration fields
- ✅ Added validation triggers
- ✅ Added RLS policies

### 2. Service Layer Created
**File:** `src/services/lessonPlansService.ts`

Functions available:
- `getCurrentEducatorId()` - Get current educator's ID
- `getLessonPlans()` - Fetch all lesson plans for educator
- `getLessonPlan(id)` - Fetch single lesson plan
- `createLessonPlan(formData, classId)` - Create new lesson plan
- `updateLessonPlan(id, formData, classId)` - Update lesson plan
- `deleteLessonPlan(id)` - Delete lesson plan
- `submitLessonPlan(id)` - Submit for review
- `getCurriculums(subject, className)` - Get curriculums
- `getChapters(curriculumId)` - Get chapters
- `getLearningOutcomes(chapterId)` - Get learning outcomes
- `getSubjects(schoolId)` - Get subjects
- `getClasses(schoolId)` - Get classes

### 3. React Hooks Created
**File:** `src/hooks/useLessonPlans.ts`

Hooks available:
- `useLessonPlans()` - Main hook for lesson plans CRUD
- `useCurriculum(subject, className)` - Hook for curriculum data
- `useSubjectsAndClasses(schoolId)` - Hook for subjects and classes

### 4. Wrapper Component Created
**File:** `src/pages/admin/schoolAdmin/LessonPlanWrapper.tsx`

This component connects the existing UI to the backend.

---

## 🔧 Integration Steps

### Step 1: Update the Existing LessonPlan Component

The current `LessonPlan.tsx` component has hardcoded data. You need to modify it to accept props from the wrapper.

**Option A: Minimal Changes (Recommended)**

Add props interface at the top of `LessonPlan.tsx`:

```typescript
interface LessonPlanProps {
  lessonPlansHook: ReturnType<typeof useLessonPlans>;
  subjects: string[];
  classes: string[];
  schoolId?: string;
}

const LessonPlan: React.FC<LessonPlanProps> = ({ 
  lessonPlansHook, 
  subjects, 
  classes,
  schoolId 
}) => {
  // Replace hardcoded data with props
  const { 
    lessonPlans: lessonPlansData, 
    loading, 
    error,
    create,
    update,
    remove 
  } = lessonPlansHook;
  
  // Use lessonPlansData instead of hardcoded lessonPlans state
  // ...rest of component
}
```

**Option B: Complete Rewrite**

Create a new component that uses the hooks directly (more work but cleaner).

### Step 2: Update Routes

Find your routes file (likely `src/routes/AppRoutes.jsx` or similar) and update:

```typescript
// Before
import LessonPlan from "../pages/admin/schoolAdmin/LessonPlan";

// After
import LessonPlanWrapper from "../pages/admin/schoolAdmin/LessonPlanWrapper";

// In routes
<Route path="/school-admin/academics/lesson-plans" element={<LessonPlanWrapper />} />
```

### Step 3: Remove Hardcoded Data

In `LessonPlan.tsx`, remove these hardcoded sections:

1. **Sample Curriculums** (lines ~600-700):
```typescript
// REMOVE THIS
const sampleCurriculums: Curriculum[] = [
  {
    id: "curr-1",
    subject: "Mathematics",
    // ... hardcoded data
  }
];
```

Replace with:
```typescript
const { curriculums, chapters, learningOutcomes, loadChapters, loadLearningOutcomes } = 
  useCurriculum(formData.subject, formData.class);
```

2. **Hardcoded Subjects and Classes**:
```typescript
// REMOVE THIS
const subjects = ["Mathematics", "Physics", "Chemistry", "Biology", "English", "History"];
const classes = ["9", "10", "11", "12"];
```

Use props instead:
```typescript
// Already passed as props
const { subjects, classes } = props;
```

3. **Initial Lesson Plans State**:
```typescript
// REMOVE THIS
const [lessonPlans, setLessonPlans] = useState<LessonPlan[]>([
  {
    id: "1",
    title: "Introduction to Algebra",
    // ... hardcoded data
  }
]);
```

Replace with:
```typescript
// Use data from hook
const lessonPlans = lessonPlansHook.lessonPlans;
```

### Step 4: Update Form Submission

Replace the mock submission with real API calls:

```typescript
// BEFORE
const handleSubmit = () => {
  if (!validateForm()) return;
  
  setSubmitting(true);
  setTimeout(() => {
    // Mock submission
    setLessonPlans([newPlan, ...lessonPlans]);
    setSubmitting(false);
  }, 800);
};

// AFTER
const handleSubmit = async () => {
  if (!validateForm()) return;
  
  setSubmitting(true);
  try {
    const classId = classes.find(c => c.grade === formData.class)?.id;
    if (!classId) {
      alert("Class not found");
      return;
    }

    if (editingPlan) {
      const { error } = await lessonPlansHook.update(editingPlan.id, formData, classId);
      if (error) {
        alert("Error updating lesson plan: " + error);
        return;
      }
    } else {
      const { error } = await lessonPlansHook.create(formData, classId);
      if (error) {
        alert("Error creating lesson plan: " + error);
        return;
      }
    }
    
    resetForm();
    setShowEditor(false);
  } catch (error: any) {
    alert("Error: " + error.message);
  } finally {
    setSubmitting(false);
  }
};
```

### Step 5: Update Delete Handler

```typescript
// BEFORE
const deleteLessonPlan = async (id: string) => {
  if (!confirm("Are you sure?")) return;
  setLessonPlans(lessonPlans.filter((lp) => lp.id !== id));
};

// AFTER
const deleteLessonPlan = async (id: string) => {
  if (!confirm("Are you sure you want to delete this lesson plan?")) return;
  
  const { error } = await lessonPlansHook.remove(id);
  if (error) {
    alert("Error deleting lesson plan: " + error);
  }
};
```

---

## 📋 Quick Integration Checklist

- [ ] Apply database migration (✅ Already done)
- [ ] Add service layer files (✅ Already done)
- [ ] Add hooks files (✅ Already done)
- [ ] Add wrapper component (✅ Already done)
- [ ] Update routes to use LessonPlanWrapper
- [ ] Modify LessonPlan.tsx to accept props
- [ ] Remove hardcoded data from LessonPlan.tsx
- [ ] Update form submission to use API
- [ ] Update delete handler to use API
- [ ] Test create, read, update, delete operations
- [ ] Test curriculum integration
- [ ] Test file upload (if needed)
- [ ] Test validation triggers

---

## 🧪 Testing

### Test Create:
1. Navigate to `/school-admin/academics/lesson-plans`
2. Click "New Lesson Plan"
3. Fill in all required fields
4. Select chapter from curriculum
5. Select learning outcomes
6. Click Save
7. Verify lesson plan appears in list

### Test Read:
1. Refresh the page
2. Verify all lesson plans load from database
3. Click on a lesson plan to view details

### Test Update:
1. Click edit on a lesson plan
2. Modify some fields
3. Click Save
4. Verify changes are saved

### Test Delete:
1. Click delete on a lesson plan
2. Confirm deletion
3. Verify lesson plan is removed

### Test Curriculum Integration:
1. Select a subject and class
2. Verify chapters load from curriculum
3. Select a chapter
4. Verify learning outcomes load
5. Verify duration is auto-filled

---

## 🔍 Troubleshooting

### Issue: "Educator not found"
**Solution:** Ensure the logged-in user has a record in `school_educators` table.

```sql
-- Check if educator exists
SELECT * FROM school_educators WHERE user_id = 'your-user-id';
```

### Issue: "No curriculums found"
**Solution:** Ensure curriculums are created and approved.

```sql
-- Check curriculums
SELECT * FROM curriculums WHERE status = 'approved';
```

### Issue: RLS Policy Errors
**Solution:** Verify RLS policies are created correctly.

```sql
-- Check policies
SELECT * FROM pg_policies WHERE tablename = 'lesson_plans';
```

### Issue: Chapter name not auto-populating
**Solution:** Verify the trigger is working.

```sql
-- Check trigger
SELECT * FROM pg_trigger WHERE tgname = 'populate_chapter_name_trigger';
```

---

## 📝 Data Flow

```
User Action
    ↓
LessonPlanWrapper (gets school context)
    ↓
useLessonPlans Hook (state management)
    ↓
lessonPlansService (API calls)
    ↓
Supabase Client
    ↓
PostgreSQL Database (with RLS & triggers)
    ↓
Response back through chain
    ↓
UI Updates
```

---

## 🎯 Next Steps

1. **Update Routes** - Point to LessonPlanWrapper
2. **Modify LessonPlan.tsx** - Accept props and remove hardcoded data
3. **Test thoroughly** - All CRUD operations
4. **Add loading states** - Show spinners during API calls
5. **Add error handling** - Show user-friendly error messages
6. **Add success messages** - Confirm actions completed
7. **Add file upload** - If needed for resource files
8. **Add submit workflow** - Submit for approval functionality

---

## 📚 Additional Features to Implement

### File Upload for Resources
You'll need to implement file upload to Supabase Storage:

```typescript
import { supabase } from "../lib/supabaseClient";

async function uploadFile(file: File, lessonPlanId: string) {
  const filePath = `lesson-plans/${lessonPlanId}/${file.name}`;
  
  const { data, error } = await supabase.storage
    .from('lesson-resources')
    .upload(filePath, file);
    
  if (error) throw error;
  
  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('lesson-resources')
    .getPublicUrl(filePath);
    
  return publicUrl;
}
```

### Submit for Approval
Already implemented in service layer:

```typescript
const handleSubmitForReview = async (id: string) => {
  const { error } = await lessonPlansHook.submit(id);
  if (error) {
    alert("Error submitting: " + error);
  } else {
    alert("Lesson plan submitted for review!");
  }
};
```

---

## ✅ Summary

All backend infrastructure is ready:
- ✅ Database schema complete
- ✅ Service layer created
- ✅ React hooks created
- ✅ Wrapper component created

**You just need to:**
1. Update routes to use `LessonPlanWrapper`
2. Modify `LessonPlan.tsx` to accept props
3. Remove hardcoded data
4. Test the integration

The heavy lifting is done! 🚀

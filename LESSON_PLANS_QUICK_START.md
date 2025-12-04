# 🚀 Lesson Plans - Quick Start Guide

## ✅ Status: Backend Ready, UI Integration Needed

---

## 3-Step Integration

### 1️⃣ Update Routes (1 line change)
```typescript
// In your routes file (e.g., src/routes/AppRoutes.jsx)
import LessonPlanWrapper from "../pages/admin/schoolAdmin/LessonPlanWrapper";

// Use LessonPlanWrapper instead of LessonPlan
<Route path="/school-admin/academics/lesson-plans" element={<LessonPlanWrapper />} />
```

### 2️⃣ Add Props to LessonPlan.tsx
```typescript
// At the top of src/pages/admin/schoolAdmin/LessonPlan.tsx
import { useLessonPlans, useCurriculum } from "../../../hooks/useLessonPlans";

interface LessonPlanProps {
  lessonPlansHook: ReturnType<typeof useLessonPlans>;
  subjects: string[];
  classes: any[];
  schoolId?: string;
}

const LessonPlan: React.FC<LessonPlanProps> = ({ 
  lessonPlansHook, 
  subjects, 
  classes,
  schoolId 
}) => {
  // Use hook data instead of hardcoded state
  const lessonPlans = lessonPlansHook.lessonPlans;
  const loading = lessonPlansHook.loading;
  
  // Add curriculum hook
  const { curriculums, chapters, learningOutcomes, loadChapters, loadLearningOutcomes } = 
    useCurriculum(formData.subject, formData.class);
```

### 3️⃣ Remove Hardcoded Data
Delete these sections:
```typescript
// ❌ REMOVE: Hardcoded sample curriculums (around line 600)
const sampleCurriculums: Curriculum[] = [ ... ];

// ❌ REMOVE: Hardcoded subjects and classes (around line 580)
const subjects = ["Mathematics", "Physics", ...];
const classes = ["9", "10", "11", "12"];

// ❌ REMOVE: Initial lesson plans with sample data (around line 750)
const [lessonPlans, setLessonPlans] = useState<LessonPlan[]>([
  { id: "1", title: "Introduction to Algebra", ... }
]);
```

---

## Files Already Created ✅

### Backend:
- ✅ `supabase/migrations/enhance_lesson_plans_schema.sql` - Database migration (applied)
- ✅ `src/services/lessonPlansService.ts` - API service layer
- ✅ `src/hooks/useLessonPlans.ts` - React hooks
- ✅ `src/pages/admin/schoolAdmin/LessonPlanWrapper.tsx` - Wrapper component

### Documentation:
- ✅ `LESSON_PLANS_BACKEND_INTEGRATION.md` - Detailed integration guide
- ✅ `LESSON_PLANS_INTEGRATION_COMPLETE.md` - Complete summary
- ✅ `LESSON_PLANS_QUICK_START.md` - This file

---

## Update Form Handlers

### Create/Update Handler:
```typescript
const handleSubmit = async () => {
  if (!validateForm()) return;
  
  setSubmitting(true);
  try {
    const classId = classes.find(c => c.grade === formData.class)?.id;
    
    if (editingPlan) {
      await lessonPlansHook.update(editingPlan.id, formData, classId);
    } else {
      await lessonPlansHook.create(formData, classId);
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

### Delete Handler:
```typescript
const deleteLessonPlan = async (id: string) => {
  if (!confirm("Are you sure?")) return;
  await lessonPlansHook.remove(id);
};
```

---

## Test After Integration

1. ✅ Open `/school-admin/academics/lesson-plans`
2. ✅ Should load lesson plans from database
3. ✅ Create new lesson plan
4. ✅ Edit existing lesson plan
5. ✅ Delete lesson plan
6. ✅ Select chapter from curriculum
7. ✅ Verify duration auto-fills

---

## Need Help?

See detailed guides:
- **Step-by-step:** `LESSON_PLANS_BACKEND_INTEGRATION.md`
- **Database info:** `LESSON_PLANS_FINAL_STATUS.md`
- **Complete summary:** `LESSON_PLANS_INTEGRATION_COMPLETE.md`

---

## That's It! 🎉

Backend is ready. Just connect the UI and test!

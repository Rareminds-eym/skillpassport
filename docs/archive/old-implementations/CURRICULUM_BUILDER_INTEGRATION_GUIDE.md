# Curriculum Builder - Backend Integration Guide

## ✅ Completed

### 1. Database Schema
**File:** `supabase/migrations/curriculum_builder_schema.sql`

Created complete database schema with:
- `assessment_types` - Master data for assessment types
- `curriculums` - Main curriculum table with approval workflow
- `curriculum_chapters` - Chapters with order and duration
- `curriculum_learning_outcomes` - Learning outcomes with Bloom's taxonomy
- `outcome_assessment_mappings` - Maps outcomes to assessments

**Status:** ✅ Schema applied to database

### 2. Service Layer
**File:** `src/services/curriculumService.ts`

Complete CRUD operations for:
- Assessment types (read)
- Curriculums (create, read, update status)
- Chapters (create, read, update, delete)
- Learning outcomes (create, read, update, delete)
- Assessment mappings (managed with outcomes)
- Validation and template copying functions

### 3. React Hook
**File:** `src/hooks/useCurriculum.ts`

Custom hook `useCurriculum` that provides:
- State management for curriculum data
- Auto-loading when subject/class/year selected
- CRUD operations with automatic UI updates
- Save status tracking
- Error handling

## 🔧 Integration Steps

### Option 1: Use the Hook in Existing Component (Recommended)

Modify `src/pages/admin/schoolAdmin/CurriculumBuilder.tsx`:

```typescript
import { useCurriculum } from '../../../hooks/useCurriculum';

const CurriculumBuilder: React.FC = () => {
  // Replace local state with hook
  const {
    curriculumId,
    chapters,
    learningOutcomes,
    assessmentTypes,
    status,
    rejectionReason,
    loading,
    saveStatus,
    addChapter,
    updateChapter,
    deleteChapter,
    addLearningOutcome,
    updateLearningOutcome,
    deleteLearningOutcome,
    submitForApproval,
    approveCurriculum,
    rejectCurriculum,
  } = useCurriculum(selectedSubject, selectedClass, selectedAcademicYear);

  // Update handlers to use hook methods
  const handleAddChapter = async (chapter: Chapter) => {
    try {
      if (editingChapter) {
        await updateChapter(chapter.id, chapter);
      } else {
        await addChapter(chapter);
      }
      setShowAddChapterModal(false);
    } catch (error: any) {
      alert('Error saving chapter: ' + error.message);
    }
  };

  const handleDeleteChapter = async (id: string) => {
    if (window.confirm('Are you sure?')) {
      try {
        await deleteChapter(id);
      } catch (error: any) {
        alert('Error deleting chapter: ' + error.message);
      }
    }
  };

  // Similar updates for learning outcomes...
}
```

### Option 2: Create Wrapper Component

Create `src/pages/admin/schoolAdmin/CurriculumBuilderWrapper.tsx`:

```typescript
import React from 'react';
import CurriculumBuilder from './CurriculumBuilder';
import { useCurriculum } from '../../../hooks/useCurriculum';

const CurriculumBuilderWrapper: React.FC = () => {
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedAcademicYear, setSelectedAcademicYear] = useState('');

  const curriculum = useCurriculum(selectedSubject, selectedClass, selectedAcademicYear);

  // Pass all data and handlers to original component
  return (
    <CurriculumBuilder
      {...curriculum}
      selectedSubject={selectedSubject}
      setSelectedSubject={setSelectedSubject}
      selectedClass={selectedClass}
      setSelectedClass={setSelectedClass}
      selectedAcademicYear={selectedAcademicYear}
      setSelectedAcademicYear={setSelectedAcademicYear}
    />
  );
};

export default CurriculumBuilderWrapper;
```

Then update route in `src/routes/AppRoutes.jsx`:
```javascript
import CurriculumBuilderWrapper from "../pages/admin/schoolAdmin/CurriculumBuilderWrapper";

<Route path="academics/curriculum" element={<CurriculumBuilderWrapper />} />
```

## 📋 Key Features

### Automatic Data Loading
- When user selects subject, class, and academic year, curriculum is automatically loaded or created
- Chapters and learning outcomes are fetched from database
- Assessment types are loaded on component mount

### Real-time Saving
- All create/update/delete operations immediately sync with database
- Save status indicator shows "Saving..." and "Saved" feedback
- Optimistic UI updates for better UX

### Validation
- Server-side validation using PostgreSQL function
- Checks for required chapters, outcomes, and assessment mappings
- Prevents submission of incomplete curriculums

### Approval Workflow
- Draft → Pending Approval → Approved/Rejected
- Only draft and rejected curriculums can be edited
- Rejection reason is stored and displayed

### Security
- Row Level Security (RLS) policies ensure educators only see their school's data
- Educators can only edit their own draft/rejected curriculums
- Foreign key constraints maintain data integrity

## 🔍 Testing

### 1. Create Curriculum
1. Navigate to `/school-admin/academics/curriculum`
2. Select Academic Year, Subject, and Class
3. Add chapters with descriptions
4. Add learning outcomes for each chapter
5. Map outcomes to assessment types

### 2. Submit for Approval
1. Click "Submit for Approval"
2. Validation runs automatically
3. Status changes to "Pending Approval"
4. Curriculum becomes read-only

### 3. Approve/Reject (Academic Coordinator)
1. View pending curriculum
2. Click "Approve" or "Reject"
3. If rejecting, provide reason
4. Status updates accordingly

## 📊 Database Queries for Testing

```sql
-- View all curriculums
SELECT * FROM curriculum_summary;

-- View chapters with outcome count
SELECT * FROM chapter_details WHERE curriculum_id = 'your-curriculum-id';

-- View learning outcomes with assessments
SELECT * FROM learning_outcome_details WHERE curriculum_id = 'your-curriculum-id';

-- Validate curriculum
SELECT * FROM validate_curriculum('your-curriculum-id');

-- Check assessment types
SELECT * FROM assessment_types WHERE is_active = true;
```

## 🚀 Next Steps

1. **Integrate hook into existing component** (Option 1 recommended)
2. **Test CRUD operations** for chapters and outcomes
3. **Test approval workflow** with different user roles
4. **Add error boundaries** for better error handling
5. **Add loading states** for better UX
6. **Implement copy template feature** using `copyCurriculumTemplate` function
7. **Add export functionality** (PDF/Excel)

## 📝 Notes

- The hook automatically creates a new curriculum if one doesn't exist for the selected parameters
- All operations are async and return promises
- Error handling is built-in but should be enhanced with user-friendly messages
- The `saveStatus` state can be used to show save indicators in the UI
- Assessment types are global by default but can be school-specific

## 🔗 Related Files

- Schema: `supabase/migrations/curriculum_builder_schema.sql`
- Service: `src/services/curriculumService.ts`
- Hook: `src/hooks/useCurriculum.ts`
- Component: `src/pages/admin/schoolAdmin/CurriculumBuilder.tsx`
- Route: `src/routes/AppRoutes.jsx`

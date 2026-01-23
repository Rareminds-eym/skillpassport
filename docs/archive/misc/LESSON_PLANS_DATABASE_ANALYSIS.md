# Lesson Plans Database Analysis

## Overview
Analysis of database tables and fields required for the Lesson Plans feature at `/school-admin/academics/lesson-plans`

## Existing Database Tables

### 1. **lesson_plans** (Main Table) ✅ EXISTS
**Location:** `public.lesson_plans`
**Status:** Already created in database

#### Current Fields:
| Field | Type | Nullable | Default | Description |
|-------|------|----------|---------|-------------|
| `id` | uuid | No | gen_random_uuid() | Primary key |
| `educator_id` | uuid | Yes | - | FK to school_educators.id |
| `class_id` | uuid | Yes | - | FK to school_classes.id |
| `title` | varchar | No | - | Lesson plan title |
| `subject` | varchar | No | - | Subject name |
| `class_name` | varchar | No | - | Class/grade name |
| `date` | date | No | - | Lesson date |
| `duration` | integer | No | - | Duration in minutes |
| `learning_objectives` | text | No | - | Learning objectives |
| `activities` | jsonb | No | '[]'::jsonb | Activities array |
| `resources` | jsonb | No | '[]'::jsonb | Resources array |
| `assessment_methods` | text | Yes | - | Assessment methods |
| `homework` | text | Yes | - | Homework description |
| `notes` | text | Yes | - | Additional notes |
| `status` | varchar | Yes | 'draft' | Status (draft, submitted, approved, rejected, revision_required) |
| `submitted_at` | timestamp | Yes | - | Submission timestamp |
| `reviewed_by` | uuid | Yes | - | Reviewer user ID |
| `reviewed_at` | timestamp | Yes | - | Review timestamp |
| `review_comments` | text | Yes | - | Review feedback |
| `created_at` | timestamp | Yes | now() | Creation timestamp |
| `updated_at` | timestamp | Yes | now() | Update timestamp |

#### Foreign Keys:
- `educator_id` → `school_educators.id`
- `class_id` → `school_classes.id`
- `reviewed_by` → `auth.users.id`

#### Related Tables:
- `teacher_journal` (references lesson_plans via `lesson_plan_id`)

---

## Required Fields from UI Component

Based on the `LessonPlan.tsx` component analysis, the following fields are needed:

### Core Fields (Already in DB):
✅ `id` - Unique identifier
✅ `title` - Lesson plan title
✅ `subject` - Subject name
✅ `class_name` - Class/grade (stored as string)
✅ `date` - Lesson date
✅ `duration` - Duration (stored as integer minutes)
✅ `learning_objectives` - Learning objectives text
✅ `activities` - Activities (JSONB array)
✅ `resources` - Resources (JSONB array)
✅ `assessment_methods` - Assessment/evaluation methods
✅ `homework` - Homework/follow-up
✅ `notes` - Additional notes
✅ `status` - Workflow status
✅ `educator_id` - Teacher/educator reference
✅ `class_id` - Class reference

### Additional Fields Needed from UI:

#### 1. **Curriculum Integration Fields** ⚠️ MISSING
- `chapter_id` (uuid) - FK to curriculum_chapters.id
- `chapter_name` (varchar) - Display name from curriculum
- `selected_learning_outcomes` (jsonb) - Array of learning outcome IDs

#### 2. **Teaching Methodology** ⚠️ MISSING
- `teaching_methodology` (text) - Teaching methodology description

#### 3. **Required Materials** ⚠️ PARTIALLY EXISTS
- Current: `resources` (jsonb) - Generic resources
- Needed: 
  - `required_materials` (text) - Text description of materials
  - `resource_files` (jsonb) - File attachments with metadata
  - `resource_links` (jsonb) - External links with titles

#### 4. **Evaluation Criteria** ⚠️ PARTIALLY EXISTS
- Current: `assessment_methods` (text) - Generic assessment text
- Needed:
  - `evaluation_criteria` (text) - Evaluation criteria description
  - `evaluation_items` (jsonb) - Structured evaluation with percentages

#### 5. **Differentiation** ⚠️ MISSING
- `differentiation_notes` (text) - Differentiation strategies

---

## Recommended Database Schema Updates

### Option 1: Add Missing Columns to `lesson_plans` Table

```sql
-- Add curriculum integration fields
ALTER TABLE lesson_plans 
ADD COLUMN chapter_id uuid REFERENCES curriculum_chapters(id),
ADD COLUMN chapter_name varchar(255),
ADD COLUMN selected_learning_outcomes jsonb DEFAULT '[]'::jsonb;

-- Add teaching methodology
ALTER TABLE lesson_plans 
ADD COLUMN teaching_methodology text;

-- Add detailed materials fields
ALTER TABLE lesson_plans 
ADD COLUMN required_materials text,
ADD COLUMN resource_files jsonb DEFAULT '[]'::jsonb,
ADD COLUMN resource_links jsonb DEFAULT '[]'::jsonb;

-- Add structured evaluation
ALTER TABLE lesson_plans 
ADD COLUMN evaluation_criteria text,
ADD COLUMN evaluation_items jsonb DEFAULT '[]'::jsonb;

-- Add differentiation
ALTER TABLE lesson_plans 
ADD COLUMN differentiation_notes text;

-- Add indexes for performance
CREATE INDEX idx_lesson_plans_chapter_id ON lesson_plans(chapter_id);
CREATE INDEX idx_lesson_plans_educator_id ON lesson_plans(educator_id);
CREATE INDEX idx_lesson_plans_class_id ON lesson_plans(class_id);
CREATE INDEX idx_lesson_plans_date ON lesson_plans(date);
CREATE INDEX idx_lesson_plans_status ON lesson_plans(status);
```

### Option 2: Use Existing JSONB Fields (Alternative)

Store additional data in existing `activities`, `resources`, and `notes` fields:

```typescript
// Store in existing fields
activities: [
  {
    type: 'teaching_methodology',
    description: string,
    duration: number
  }
]

resources: {
  materials: string,
  files: ResourceFile[],
  links: ResourceLink[]
}

notes: {
  differentiation: string,
  evaluation: {
    criteria: string,
    items: EvaluationCriteria[]
  }
}
```

---

## Data Structure Definitions

### ResourceFile Interface
```typescript
interface ResourceFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string;
}
```

### ResourceLink Interface
```typescript
interface ResourceLink {
  id: string;
  title: string;
  url: string;
}
```

### EvaluationCriteria Interface
```typescript
interface EvaluationCriteria {
  id: string;
  criterion: string;
  percentage: number;
}
```

### Activity Interface
```typescript
interface Activity {
  id: string;
  description: string;
  type: string;
  duration: number;
}
```

---

## Related Tables Already in Database

### 1. **curriculum_chapters** ✅ EXISTS
- Used for linking lesson plans to curriculum
- Fields: id, curriculum_id, name, code, description, order_number, estimated_duration, duration_unit

### 2. **curriculum_learning_outcomes** ✅ EXISTS
- Learning outcomes mapped to chapters
- Fields: id, chapter_id, outcome, bloom_level

### 3. **school_educators** ✅ EXISTS
- Teacher/educator information
- Fields: id, user_id, school_id, employee_id, specialization, etc.

### 4. **school_classes** ✅ EXISTS
- Class/grade information
- Fields: id, school_id, name, grade, section, academic_year

### 5. **teacher_journal** ✅ EXISTS
- Teacher reflection journal for approved lesson plans
- Fields: id, educator_id, lesson_plan_id, date, reflection, student_engagement, objectives_met, challenges, improvements

---

## Summary

### ✅ What Already Exists:
1. Main `lesson_plans` table with core fields
2. Workflow status management (draft, submitted, approved, rejected, revision_required)
3. Review/approval system (reviewed_by, reviewed_at, review_comments)
4. Basic JSONB fields for activities and resources
5. Integration with school_educators and school_classes
6. Teacher journal for post-lesson reflection

### ⚠️ What Needs to be Added:
1. **Curriculum integration fields** (chapter_id, chapter_name, selected_learning_outcomes)
2. **Teaching methodology field** (teaching_methodology)
3. **Enhanced materials tracking** (required_materials, resource_files, resource_links)
4. **Structured evaluation** (evaluation_criteria, evaluation_items)
5. **Differentiation notes** (differentiation_notes)

### 📋 Recommendation:
**Add the missing columns** to the `lesson_plans` table as shown in Option 1. This provides:
- Better data structure and validation
- Easier querying and filtering
- Clear separation of concerns
- Better integration with curriculum builder
- Improved reporting capabilities

The existing JSONB fields (`activities`, `resources`) can be retained for backward compatibility and additional flexibility.


---

## Migration Created

A new migration file has been created: `supabase/migrations/enhance_lesson_plans_schema.sql`

### What the Migration Does:

1. **Adds Curriculum Integration Fields:**
   - `chapter_id` (uuid) - FK to curriculum_chapters
   - `chapter_name` (varchar) - Auto-populated from curriculum
   - `selected_learning_outcomes` (jsonb) - Array of learning outcome IDs

2. **Adds Teaching Methodology:**
   - `teaching_methodology` (text) - Teaching approach description

3. **Enhances Materials Tracking:**
   - `required_materials` (text) - Text description
   - `resource_files` (jsonb) - File attachments with metadata
   - `resource_links` (jsonb) - External links with titles

4. **Adds Structured Evaluation:**
   - `evaluation_criteria` (text) - Evaluation description
   - `evaluation_items` (jsonb) - Items with percentages

5. **Adds Differentiation:**
   - `differentiation_notes` (text) - Differentiation strategies

6. **Creates Indexes:**
   - `idx_lesson_plans_chapter_id`
   - `idx_lesson_plans_educator_id`
   - `idx_lesson_plans_class_id`

7. **Adds Validation:**
   - Trigger to validate evaluation items don't exceed 100%
   - Trigger to auto-populate chapter_name from curriculum

8. **Updates View:**
   - Enhanced `teacher_weekly_timetable` view with new fields

9. **Adds RLS Policies:**
   - Educators can view/create/update their own lesson plans
   - School admins can view/review all lesson plans in their school

### To Apply the Migration:

```bash
# Using Supabase CLI
supabase db push

# Or apply directly via SQL
psql -h your-host -U your-user -d your-db -f supabase/migrations/enhance_lesson_plans_schema.sql
```

---

## Complete Field Mapping

### UI Component → Database Table

| UI Field | Database Column | Type | Notes |
|----------|----------------|------|-------|
| `id` | `id` | uuid | Primary key |
| `title` | `title` | varchar | Lesson title |
| `subject` | `subject` | varchar | Subject name |
| `class` | `class_name` | varchar | Class/grade |
| `date` | `date` | date | Lesson date |
| `chapterId` | `chapter_id` | uuid | FK to curriculum |
| `chapterName` | `chapter_name` | varchar | Auto-populated |
| `duration` | `duration` | integer | Minutes (from chapter) |
| `selectedLearningOutcomes` | `selected_learning_outcomes` | jsonb | Array of IDs |
| `learningObjectives` | `learning_objectives` | text | Lesson objectives |
| `teachingMethodology` | `teaching_methodology` | text | Teaching approach |
| `requiredMaterials` | `required_materials` | text | Materials description |
| `resourceFiles` | `resource_files` | jsonb | File attachments |
| `resourceLinks` | `resource_links` | jsonb | External links |
| `activities` | `activities` | jsonb | Activities array |
| `resources` | `resources` | jsonb | Generic resources |
| `evaluationCriteria` | `evaluation_criteria` | text | Evaluation description |
| `evaluationItems` | `evaluation_items` | jsonb | Structured evaluation |
| `assessmentMethods` | `assessment_methods` | text | Assessment methods |
| `homework` | `homework` | text | Homework/follow-up |
| `differentiationNotes` | `differentiation_notes` | text | Differentiation |
| `notes` | `notes` | text | Additional notes |
| `status` | `status` | varchar | Workflow status |
| `educatorId` | `educator_id` | uuid | FK to school_educators |
| `classId` | `class_id` | uuid | FK to school_classes |

---

## Next Steps

1. ✅ **Apply the migration** to add missing fields
2. **Update the UI component** to use the new fields
3. **Create/update service layer** for lesson plans CRUD operations
4. **Test the integration** with curriculum builder
5. **Verify RLS policies** work correctly for educators and admins
6. **Add validation** on the frontend to match database constraints

---

## Testing Checklist

- [ ] Verify all new columns are created
- [ ] Test chapter_name auto-population trigger
- [ ] Test evaluation items percentage validation (should fail if > 100%)
- [ ] Test RLS policies for educators (can only see their own)
- [ ] Test RLS policies for school admins (can see all in school)
- [ ] Test curriculum integration (chapter selection, learning outcomes)
- [ ] Test file upload and link management
- [ ] Test evaluation items with percentages
- [ ] Test workflow (draft → submitted → approved/rejected)
- [ ] Test teacher journal auto-creation on approval

---

## API Integration Example

```typescript
// Service function to create lesson plan
async function createLessonPlan(data: LessonPlanFormData) {
  const { data: lessonPlan, error } = await supabase
    .from('lesson_plans')
    .insert({
      educator_id: currentEducatorId,
      class_id: data.classId,
      title: data.title,
      subject: data.subject,
      class_name: data.class,
      date: data.date,
      chapter_id: data.chapterId,
      // chapter_name will be auto-populated by trigger
      selected_learning_outcomes: data.selectedLearningOutcomes,
      learning_objectives: data.learningObjectives,
      teaching_methodology: data.teachingMethodology,
      required_materials: data.requiredMaterials,
      resource_files: data.resourceFiles,
      resource_links: data.resourceLinks,
      evaluation_criteria: data.evaluationCriteria,
      evaluation_items: data.evaluationItems,
      homework: data.homework,
      differentiation_notes: data.differentiationNotes,
      status: 'draft'
    })
    .select()
    .single();
    
  return { lessonPlan, error };
}
```

---

## Conclusion

The `lesson_plans` table already exists with core functionality. The new migration adds:
- **Curriculum integration** for better alignment with teaching standards
- **Enhanced materials tracking** for comprehensive resource management
- **Structured evaluation** with percentage-based criteria
- **Teaching methodology** documentation
- **Differentiation strategies** for diverse learners

All fields from the UI component are now properly mapped to database columns with appropriate data types, constraints, and validation.

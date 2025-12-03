# Lesson Plans - Final Database Status

## ✅ Existing Table Structure (Already Created)

You already have the `lesson_plans` table with these fields:

### Core Fields:
- ✅ `id` (uuid, PK)
- ✅ `educator_id` (uuid, FK to school_educators)
- ✅ `class_id` (uuid, FK to school_classes)
- ✅ `title` (varchar 200)
- ✅ `subject` (varchar 100)
- ✅ `class_name` (varchar 50)
- ✅ `date` (date)
- ✅ `duration` (integer)
- ✅ `learning_objectives` (text)
- ✅ `activities` (jsonb)
- ✅ `resources` (jsonb)
- ✅ `assessment_methods` (text)
- ✅ `homework` (text)
- ✅ `notes` (text)

### Workflow Fields:
- ✅ `status` (varchar 20) - draft, submitted, approved, rejected, revision_required
- ✅ `submitted_at` (timestamp)
- ✅ `reviewed_by` (uuid, FK to auth.users)
- ✅ `reviewed_at` (timestamp)
- ✅ `review_comments` (text)

### Metadata:
- ✅ `created_at` (timestamp)
- ✅ `updated_at` (timestamp)

### Indexes:
- ✅ `idx_lesson_plans_educator`
- ✅ `idx_lesson_plans_status`
- ✅ `idx_lesson_plans_date`
- ✅ `idx_lesson_plans_class`

### Triggers:
- ✅ `lesson_plan_approved_trigger` - Auto-creates teacher journal entry
- ✅ `update_lesson_plans_updated_at` - Auto-updates timestamp

---

## ⚠️ Fields to Add (From UI Requirements)

The migration `enhance_lesson_plans_schema.sql` will add these fields:

### 1. Curriculum Integration (NEW):
```sql
chapter_id UUID                          -- Link to curriculum_chapters
chapter_name VARCHAR(255)                -- Display name from curriculum
selected_learning_outcomes JSONB        -- Array of learning outcome IDs
```

### 2. Teaching Methodology (NEW):
```sql
teaching_methodology TEXT               -- Teaching approach description
```

### 3. Enhanced Materials (NEW):
```sql
required_materials TEXT                 -- Text description of materials
resource_files JSONB                    -- File attachments with metadata
resource_links JSONB                    -- External links with titles
```
**Note:** These are separate from the existing `resources` JSONB field

### 4. Structured Evaluation (NEW):
```sql
evaluation_criteria TEXT                -- Evaluation description
evaluation_items JSONB                  -- Items with percentages
```
**Note:** These are separate from the existing `assessment_methods` text field

### 5. Differentiation (NEW):
```sql
differentiation_notes TEXT              -- Differentiation strategies
```

---

## 📊 Field Mapping: UI Component → Database

| UI Component Field | Database Column | Status |
|-------------------|-----------------|--------|
| `id` | `id` | ✅ Exists |
| `title` | `title` | ✅ Exists |
| `subject` | `subject` | ✅ Exists |
| `class` | `class_name` | ✅ Exists |
| `date` | `date` | ✅ Exists |
| `duration` | `duration` | ✅ Exists |
| `chapterId` | `chapter_id` | ⚠️ **Need to add** |
| `chapterName` | `chapter_name` | ⚠️ **Need to add** |
| `selectedLearningOutcomes` | `selected_learning_outcomes` | ⚠️ **Need to add** |
| `learningObjectives` | `learning_objectives` | ✅ Exists |
| `teachingMethodology` | `teaching_methodology` | ⚠️ **Need to add** |
| `requiredMaterials` | `required_materials` | ⚠️ **Need to add** |
| `resourceFiles` | `resource_files` | ⚠️ **Need to add** |
| `resourceLinks` | `resource_links` | ⚠️ **Need to add** |
| `activities` | `activities` | ✅ Exists |
| `resources` | `resources` | ✅ Exists |
| `evaluationCriteria` | `evaluation_criteria` | ⚠️ **Need to add** |
| `evaluationItems` | `evaluation_items` | ⚠️ **Need to add** |
| `assessmentMethods` | `assessment_methods` | ✅ Exists |
| `homework` | `homework` | ✅ Exists |
| `differentiationNotes` | `differentiation_notes` | ⚠️ **Need to add** |
| `notes` | `notes` | ✅ Exists |
| `status` | `status` | ✅ Exists |

---

## 🔧 What the Migration Does

The `enhance_lesson_plans_schema.sql` migration will:

1. ✅ Add 9 new columns for missing fields
2. ✅ Create index on `chapter_id` for performance
3. ✅ Add validation trigger for evaluation percentages (≤ 100%)
4. ✅ Add auto-population trigger for `chapter_name` from curriculum
5. ✅ Update the `teacher_weekly_timetable` view
6. ✅ Add RLS policies for educators and school admins
7. ✅ Add column comments for documentation

---

## 📝 Data Structure Examples

### resource_files (JSONB):
```json
[
  {
    "id": "file-1",
    "name": "Algebra_Worksheet.pdf",
    "size": 245000,
    "type": "application/pdf",
    "url": "https://storage.example.com/files/..."
  }
]
```

### resource_links (JSONB):
```json
[
  {
    "id": "link-1",
    "title": "Khan Academy - Algebra Basics",
    "url": "https://www.khanacademy.org/math/algebra"
  }
]
```

### evaluation_items (JSONB):
```json
[
  {
    "id": "eval-1",
    "criterion": "Exit ticket",
    "percentage": 30
  },
  {
    "id": "eval-2",
    "criterion": "Class participation",
    "percentage": 30
  }
]
```

### selected_learning_outcomes (JSONB):
```json
["lo-uuid-1", "lo-uuid-2", "lo-uuid-3"]
```

---

## 🚀 Next Steps

1. **Apply the migration:**
   ```bash
   # Using Supabase CLI
   supabase db push
   
   # Or apply directly
   psql -h your-host -U your-user -d your-db -f supabase/migrations/enhance_lesson_plans_schema.sql
   ```

2. **Verify the changes:**
   ```sql
   -- Check new columns
   SELECT column_name, data_type, is_nullable
   FROM information_schema.columns
   WHERE table_name = 'lesson_plans'
   ORDER BY ordinal_position;
   ```

3. **Test the triggers:**
   ```sql
   -- Test chapter_name auto-population
   INSERT INTO lesson_plans (
     educator_id, title, subject, class_name, date, duration,
     learning_objectives, chapter_id
   ) VALUES (
     'educator-uuid', 'Test Lesson', 'Math', '9', '2024-12-10', 60,
     'Test objectives', 'chapter-uuid'
   );
   
   -- Verify chapter_name was populated
   SELECT chapter_id, chapter_name FROM lesson_plans WHERE title = 'Test Lesson';
   ```

4. **Update your UI service layer** to use the new fields

---

## ✅ Summary

**Current Status:**
- Core `lesson_plans` table: ✅ **EXISTS**
- Basic workflow: ✅ **WORKING**
- Teacher journal integration: ✅ **WORKING**

**What's Missing:**
- 9 additional fields for curriculum integration, teaching methodology, enhanced materials, structured evaluation, and differentiation

**Solution:**
- Migration file ready: `enhance_lesson_plans_schema.sql`
- Safe to apply (uses `IF NOT EXISTS` and `ADD COLUMN IF NOT EXISTS`)
- No data loss or breaking changes

**Ready to Deploy:** ✅ YES

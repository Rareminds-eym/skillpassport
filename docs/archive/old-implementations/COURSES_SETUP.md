# Courses System Setup Guide

## 📋 Database Schema Overview

The courses system uses a normalized database structure with the following tables:

1. **courses** - Main course information
2. **course_modules** - Course sections/modules
3. **lessons** - Individual lessons within modules
4. **lesson_resources** - Learning materials (files, links, videos)
5. **course_skills** - Skills covered (junction table)
6. **course_classes** - Linked classes (junction table)
7. **course_co_educators** - Co-educators (junction table)

## 🚀 Setup Instructions

### Step 1: Run the Migration

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Open the migration file: `supabase/migrations/courses_schema.sql`
4. Copy the entire SQL content
5. Paste it into the SQL Editor
6. Click **Run** to execute the migration

### Step 2: Verify Tables

After running the migration, verify that all tables were created:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name LIKE 'course%' OR table_name IN ('lessons', 'lesson_resources');
```

You should see:
- courses
- course_modules
- course_skills
- course_classes
- course_co_educators
- lessons
- lesson_resources

### Step 3: Check Row Level Security (RLS)

Verify that RLS is enabled on all tables:

```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND (tablename LIKE 'course%' OR tablename IN ('lessons', 'lesson_resources'));
```

All tables should show `rowsecurity = true`.

### Step 4: Test with Sample Data (Optional)

Insert a test course to verify everything works:

```sql
-- Replace 'YOUR_EDUCATOR_ID' with your actual auth.users UUID
INSERT INTO courses (title, code, description, duration, status, educator_id, educator_name, target_outcomes)
VALUES (
    'Test Course',
    'TEST101',
    'This is a test course',
    '4 weeks',
    'Draft',
    'YOUR_EDUCATOR_ID',
    'Your Name',
    '["Learn testing", "Understand setup"]'::jsonb
);

-- Add skills
INSERT INTO course_skills (course_id, skill_name)
SELECT course_id, 'Problem Solving'
FROM courses
WHERE code = 'TEST101';

-- Add class
INSERT INTO course_classes (course_id, class_name)
SELECT course_id, 'Class 10A'
FROM courses
WHERE code = 'TEST101';
```

## 🔑 Key Features

### Security
- ✅ Row Level Security (RLS) enabled on all tables
- ✅ Educators can only access their own courses
- ✅ Co-educators have read/write access to shared courses
- ✅ Cascade deletion for related records

### Performance
- ✅ Indexes on frequently queried columns
- ✅ Optimized joins with proper foreign keys
- ✅ View for course summary with counts

### Data Integrity
- ✅ Foreign key constraints
- ✅ Check constraints for valid statuses
- ✅ Unique constraints for course codes
- ✅ Automatic timestamp updates

## 📊 Database Relationships

```
courses (1) ──→ (N) course_modules
                     │
                     └──→ (N) lessons
                              │
                              └──→ (N) lesson_resources

courses (1) ──→ (N) course_skills
courses (1) ──→ (N) course_classes
courses (1) ──→ (N) course_co_educators
```

## 🔧 Service Functions Available

The `coursesService.ts` provides these functions:

### Course Operations
- `getCoursesByEducator(educatorId)` - Get all courses for an educator
- `getCourseById(courseId)` - Get single course with full details
- `createCourse(courseData, educatorId, educatorName)` - Create new course
- `updateCourse(courseId, updates)` - Update existing course
- `deleteCourse(courseId)` - Soft delete course

### Module Operations
- `addModule(courseId, moduleData)` - Add module to course

### Lesson Operations
- `addLesson(moduleId, lessonData)` - Add lesson to module
- `updateLesson(lessonId, updates)` - Update lesson
- `deleteLesson(lessonId)` - Delete lesson

### Resource Operations
- `addResource(lessonId, resourceData)` - Add resource to lesson
- `deleteResource(resourceId)` - Delete resource

### Utility Operations
- `updateEnrollmentCount(courseId, count)` - Update enrollment
- `updateCompletionRate(courseId, rate)` - Update completion rate

## 🐛 Troubleshooting

### Issue: RLS blocking queries
**Solution:** Make sure you're authenticated and the `educator_id` matches your `auth.uid()`

### Issue: Foreign key constraint errors
**Solution:** Ensure parent records exist before inserting child records

### Issue: Permission denied
**Solution:** Check RLS policies and verify your user has the correct role

## 📝 Migration Rollback (if needed)

If you need to remove the tables:

```sql
DROP TABLE IF EXISTS lesson_resources CASCADE;
DROP TABLE IF EXISTS lessons CASCADE;
DROP TABLE IF EXISTS course_modules CASCADE;
DROP TABLE IF EXISTS course_classes CASCADE;
DROP TABLE IF EXISTS course_skills CASCADE;
DROP TABLE IF EXISTS course_co_educators CASCADE;
DROP TABLE IF EXISTS courses CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column();
DROP FUNCTION IF EXISTS get_course_full_details(UUID);
```

## 🎯 Next Steps

1. Run the migration
2. Test with sample data
3. Verify the UI works with real data
4. Configure file storage for uploads (AWS S3, Cloudinary, etc.)
5. Set up real-time subscriptions (optional)

## 📚 Additional Resources

- [Supabase Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase Storage](https://supabase.com/docs/guides/storage)
- [PostgreSQL Foreign Keys](https://www.postgresql.org/docs/current/ddl-constraints.html)

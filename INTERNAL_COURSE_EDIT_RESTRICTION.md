# Internal Course Edit Restriction

## Change Summary
Disabled the edit button for courses that come from the internal platform, as these should not be editable by students.

## What Was Changed

### 1. MyLearning.jsx
Added conditional rendering for the edit button:

```javascript
{/* Only show edit button for external courses, not internal platform courses */}
{item.source !== 'internal_course' && (
  <button
    onClick={() => setActiveModal("edit")}
    className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
    title="Edit"
  >
    <Edit className="w-4 h-4" />
  </button>
)}
```

### 2. useStudentLearning.js
Added `source` field to the returned learning object:

```javascript
result.push({
  // ... other fields
  source: item.source, // Add source to identify internal vs external courses
  // ... other fields
});
```

## How It Works

### Course Source Types
- `internal_course` - Courses from the platform (e.g., BlockChain Basics)
- `external_course` - Courses from external platforms (Coursera, Udemy, etc.)
- `manual` - Manually added courses
- `certification` - Certifications
- `mooc` - MOOC courses

### Edit Button Visibility

| Course Type | Edit Button | Reason |
|------------|-------------|---------|
| Internal Platform | ❌ Hidden | Course data comes from course catalog, shouldn't be modified |
| External Course | ✅ Visible | User-provided data, can be edited |
| Manual | ✅ Visible | User-provided data, can be edited |
| Certification | ✅ Visible | User-provided data, can be edited |
| MOOC | ✅ Visible | User-provided data, can be edited |

## Why This Matters

### Internal Platform Courses
- Data comes from `courses`, `course_modules`, and `course_skills` tables
- Automatically populated on enrollment
- Includes verified skills and module tracking
- Should not be modified by students
- Progress is tracked automatically

### External Courses
- Data provided by student
- No automatic verification
- May require assessment
- Student can update details as needed

## User Experience

### Before
- All courses showed edit button
- Students could edit internal course details
- Could cause data inconsistency

### After
- Only external courses show edit button
- Internal courses are read-only for students
- Maintains data integrity
- Clear distinction between course types

## Visual Indicators

### Internal Course Card
```
┌─────────────────────────────────────┐
│ BlockChain Basics        [Ongoing]  │  ← No edit button
│ 📖 Internal Platform                │
│                                     │
│ 📅 8 weeks                          │
│ 🎯 Skills: Innovation, Technical... │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 0%   │
└─────────────────────────────────────┘
```

### External Course Card
```
┌─────────────────────────────────────┐
│ React Advanced      ✏️ [Completed]  │  ← Edit button visible
│ 📖 Coursera                         │
│                                     │
│ 📅 12 weeks                         │
│ 🎯 Skills: React, Hooks, Redux      │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 100% │
└─────────────────────────────────────┘
```

## Testing

To verify the change:

1. **Check Internal Course (BlockChain Basics)**
   - Should NOT show edit button (pencil icon)
   - Badge and status should still be visible
   - All other information displayed normally

2. **Check External Course**
   - Should show edit button
   - Clicking edit opens the edit modal
   - Can modify course details

3. **Verify Source Field**
   ```sql
   SELECT title, source FROM trainings WHERE student_id = 'your-id';
   ```
   - Internal courses: `source = 'internal_course'`
   - External courses: `source = 'external_course'`

## Future Enhancements

### Admin Override
- Allow admins to edit internal courses
- Add permission check for edit button

### Progress Updates
- Allow students to update progress for internal courses
- Separate edit modal for progress only

### Course Completion
- Allow marking internal courses as complete
- Trigger certificate generation

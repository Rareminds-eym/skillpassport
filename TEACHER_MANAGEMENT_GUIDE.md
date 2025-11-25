# Teacher Management System - Implementation Guide

## Overview
Complete teacher management system for school administrators with onboarding, document management, subject mapping, and timetable allocation with automatic conflict detection.

## Features Implemented

### 3.3.1 Teacher Onboarding

#### Document Upload Requirements
Teachers must upload the following documents during onboarding:
- **Degree Certificate** (PDF, JPG, PNG)
- **Experience Letters** (Multiple files supported)
- **ID Proof** (PDF, JPG, PNG)
- **Subject Expertise** (Form-based input)

#### Auto-Generated Data
The system automatically generates:
- **Teacher ID**: Format `SCHOOLCODE-T-0001` (e.g., `ABC-T-0001`)
  - School code derived from first 3 letters of school name
  - Sequential numbering per school
- **Subject Mappings**: Automatically created from subject expertise input
  - Stored in separate `teacher_subject_mappings` table
  - Includes proficiency level and years of experience

#### Onboarding Status Flow
1. `pending` - Initial state
2. `documents_uploaded` - After all documents are uploaded
3. `verified` - Admin verifies documents
4. `active` - Teacher can be assigned to timetable
5. `inactive` - Temporarily disabled

### 3.3.2 Timetable Allocation

#### Business Rules Enforced

**Maximum Periods Rule**
- No teacher may exceed **30 periods per week**
- System tracks total periods automatically
- Visual warning when limit is approached or exceeded

**Consecutive Classes Rule**
- Back-to-back classes allowed maximum **3 times**
- System calculates longest consecutive sequence
- Alerts when rule is violated

**Automatic Conflict Detection**
The system detects and logs:
1. **Max Periods Exceeded**: Teacher assigned >30 periods/week
2. **Consecutive Classes Exceeded**: More than 3 back-to-back classes
3. **Double Booking**: Same teacher, same time slot
4. **Time Overlap**: Conflicting schedules

#### Timetable Features
- **Weekly View**: Monday-Saturday, 10 periods per day
- **Real-time Validation**: Conflicts detected on slot creation
- **Workload Dashboard**: Visual indicators for each teacher
- **Conflict Resolution**: Track and resolve scheduling conflicts

## Database Schema

### Tables Created

#### `teachers`
- Personal information (name, email, phone)
- Document URLs (degree, ID proof, experience letters)
- Subject expertise (JSONB array)
- Onboarding status
- Auto-generated teacher_id

#### `teacher_subject_mappings`
- Auto-populated from subject_expertise
- Subject name, proficiency level, years of experience
- Unique constraint per teacher-subject pair

#### `timetables`
- Academic year and term tracking
- Start/end dates
- Status (draft, published, archived)

#### `timetable_slots`
- Day of week (1-7)
- Period number (1-10)
- Time range (start_time, end_time)
- Class and subject details
- Room assignment

#### `teacher_workload`
- Total periods per week
- Max consecutive classes
- Auto-calculated on slot changes

#### `timetable_conflicts`
- Conflict type and details
- Resolution tracking
- Auto-detected on slot changes

## File Structure

```
src/pages/admin/schoolAdmin/
├── TeacherManagement.tsx          # Main container with tabs
├── components/
│   ├── TeacherOnboarding.tsx      # Document upload & onboarding
│   ├── TimetableAllocation.tsx    # Schedule management
│   └── TeacherList.tsx            # View & manage teachers

supabase/migrations/
└── teacher_management_schema.sql  # Complete database schema
```

## Usage Guide

### For School Admins

#### 1. Onboard a New Teacher
1. Navigate to `/school-admin/teachers/management`
2. Click "Onboarding" tab
3. Fill in personal information
4. Upload required documents:
   - Degree certificate
   - ID proof
   - Experience letters (optional, multiple files)
5. Add subject expertise:
   - Subject name
   - Proficiency level (beginner/intermediate/advanced/expert)
   - Years of experience
6. Click "Onboard Teacher"
7. System generates Teacher ID automatically

#### 2. Manage Teachers
1. Click "Teachers" tab
2. Search by name, email, or teacher ID
3. Filter by onboarding status
4. Click "View" to see teacher details
5. Update status (verified/active/inactive)

#### 3. Allocate Timetable
1. Click "Timetable" tab
2. Select a teacher from dropdown
3. View current workload summary:
   - Total periods/week (max 30)
   - Max consecutive classes (max 3)
   - Active conflicts
4. Add time slots:
   - Select day and period
   - Set time range
   - Enter class name and subject
   - Assign room number
5. System automatically:
   - Calculates workload
   - Detects conflicts
   - Shows warnings for violations

#### 4. Resolve Conflicts
- Red indicators show rule violations
- Conflict details displayed in alert box
- Delete or modify conflicting slots
- Workload recalculates automatically

## API Integration

### Key Functions

#### Calculate Teacher Workload
```sql
SELECT * FROM calculate_teacher_workload(
  p_teacher_id := 'uuid',
  p_timetable_id := 'uuid'
);
```

Returns:
- `total_periods`: Total periods assigned
- `max_consecutive`: Longest consecutive sequence
- `exceeds_limit`: Boolean (>30 periods)
- `consecutive_violation`: Boolean (>3 consecutive)

#### Detect Conflicts
```sql
SELECT detect_timetable_conflicts(p_timetable_id := 'uuid');
```

Automatically logs conflicts to `timetable_conflicts` table.

## Storage Configuration

### Supabase Storage Bucket
Create a storage bucket named `teacher-documents` with folders:
- `degrees/`
- `id-proofs/`
- `experience-letters/`

### Storage Policies
Set appropriate RLS policies for:
- School admins can upload/view documents for their school
- Teachers can view their own documents

## Environment Variables

Ensure these are set in `.env`:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Migration Steps

### 1. Run Database Migration
```bash
# Apply the schema
psql -h your-db-host -U postgres -d your-database -f supabase/migrations/teacher_management_schema.sql
```

Or use Supabase CLI:
```bash
supabase db push
```

### 2. Create Storage Bucket
In Supabase Dashboard:
1. Go to Storage
2. Create new bucket: `teacher-documents`
3. Set to public or configure RLS policies

### 3. Update Auth Context
Ensure school_id is available in user metadata:
```typescript
user?.user_metadata?.school_id
```

## Testing Checklist

- [ ] Teacher onboarding with all documents
- [ ] Auto-generation of Teacher ID
- [ ] Subject mappings creation
- [ ] Status updates (pending → verified → active)
- [ ] Timetable slot creation
- [ ] Workload calculation (30 periods limit)
- [ ] Consecutive classes detection (3 max)
- [ ] Double booking detection
- [ ] Conflict resolution workflow
- [ ] Search and filter functionality

## Future Enhancements

1. **Bulk Import**: CSV upload for multiple teachers
2. **Email Notifications**: Alert teachers on status changes
3. **Calendar View**: Visual timetable grid
4. **Substitute Management**: Assign replacement teachers
5. **Leave Management**: Track teacher absences
6. **Performance Analytics**: Teaching hours, class coverage
7. **Mobile App**: Teacher self-service portal
8. **Export**: PDF timetable generation

## Troubleshooting

### Teacher ID Not Generated
- Check if `schools` table exists with valid data
- Verify trigger `set_teacher_id` is active
- Ensure school_id is provided during insert

### Subject Mappings Not Created
- Verify `subject_expertise` is valid JSONB array
- Check trigger `sync_teacher_subjects` is active
- Format: `[{"name": "Math", "proficiency": "expert", "years_experience": 5}]`

### Conflicts Not Detected
- Ensure trigger `timetable_slot_workload_trigger` is active
- Check if timetable_id is valid
- Verify slots are being inserted correctly

### Document Upload Fails
- Check storage bucket exists: `teacher-documents`
- Verify storage policies allow uploads
- Ensure file size is within limits

## Support

For issues or questions:
1. Check database logs for errors
2. Verify all triggers are active
3. Ensure RLS policies are configured
4. Review Supabase storage settings

## License

Part of the SkillPassport platform - School Admin Module

# KPI Dashboard Integration Guide

## ✅ Integration Complete!

The KPI Dashboard has been integrated into your School Admin Dashboard at:
**`src/pages/admin/schoolAdmin/Dashboard.tsx`**

---

## 🔧 Setup Required

### Step 1: Get School ID from Auth Context

You need to replace the placeholder `schoolId` with the actual school ID from your authentication context.

#### Option A: Using Auth Context (Recommended)

```tsx
import { useAuth } from '@/context/AuthContext'; // Adjust path as needed

const SchoolDashboard: React.FC = () => {
  const { user } = useAuth();
  const schoolId = user?.school_id; // Get school ID from authenticated user
  
  return (
    <div className="space-y-8 p-4 sm:p-6 lg:p-8">
      <KPIDashboard schoolId={schoolId} />
      {/* ... rest of dashboard */}
    </div>
  );
};
```

#### Option B: Using Supabase Auth

```tsx
import { useEffect, useState } from 'react';
import { supabase } from '@/config/supabase';

const SchoolDashboard: React.FC = () => {
  const [schoolId, setSchoolId] = useState<string | null>(null);
  
  useEffect(() => {
    const getSchoolId = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Fetch school_id from user metadata or profile table
        const { data } = await supabase
          .from('users')
          .select('school_id')
          .eq('id', user.id)
          .single();
        
        setSchoolId(data?.school_id);
      }
    };
    
    getSchoolId();
  }, []);
  
  return (
    <div className="space-y-8 p-4 sm:p-6 lg:p-8">
      {schoolId && <KPIDashboard schoolId={schoolId} />}
      {/* ... rest of dashboard */}
    </div>
  );
};
```

#### Option C: Using URL Parameter

```tsx
import { useParams } from 'react-router-dom';

const SchoolDashboard: React.FC = () => {
  const { schoolId } = useParams<{ schoolId: string }>();
  
  return (
    <div className="space-y-8 p-4 sm:p-6 lg:p-8">
      <KPIDashboard schoolId={schoolId} />
      {/* ... rest of dashboard */}
    </div>
  );
};
```

---

## 📍 Current Location

The KPI Dashboard is now visible at:
```
/admin/school/dashboard
```

Or wherever your School Admin Dashboard route is configured.

---

## 🎨 What You'll See

The dashboard now displays **7 real-time KPI cards**:

1. **Total Students** - Auto-calculated from database
2. **Attendance % Today** - Updates every 15 minutes
3. **Exams Scheduled** - Count of upcoming exams
4. **Pending Assessments** - Unpublished marks count
5. **Fee Collection** - Daily/Weekly/Monthly totals
6. **Career Readiness Index** - AI-driven score (0-100)
7. **Library Overdue Items** - Overdue books count

Plus your existing static KPI cards for School Programs.

---

## 🔍 Troubleshooting

### Issue: KPI Cards Not Showing

**Check:**
1. Is `schoolId` defined and not null?
2. Does the school exist in the database?
3. Are there any console errors?

**Debug:**
```tsx
console.log('School ID:', schoolId);
```

### Issue: No Data Showing

**Check:**
1. Database tables exist (`students`, `attendance_records`, `exams`, etc.)
2. Tables have data for the school
3. RLS policies allow access
4. Supabase connection is working

**Test Query:**
```sql
SELECT COUNT(*) FROM students WHERE school_id = 'your-school-id';
```

### Issue: Loading Forever

**Check:**
1. Network tab for failed requests
2. Supabase URL and keys are correct
3. Database is accessible

---

## 🎯 Next Steps

### 1. Set Up School ID
Replace the placeholder with actual school ID from your auth system.

### 2. Verify Database Tables
Ensure all required tables exist:
- `students`
- `attendance_records`
- `exams`
- `marks`
- `fee_payments`
- `career_recommendations`
- `book_issue`

### 3. Test Each KPI
Click on each KPI card to verify data is loading correctly.

### 4. Configure Auto-refresh (Optional)
```tsx
<KPIDashboard 
  schoolId={schoolId}
  refreshInterval={5 * 60 * 1000} // 5 minutes instead of 15
/>
```

### 5. Add Drilldown (Optional)
Use the Advanced version for click-through functionality:

```tsx
import KPIDashboardAdvanced from '@/components/admin/KPIDashboardAdvanced';

const handleKPIClick = (kpiType: string, data: any) => {
  console.log('KPI clicked:', kpiType, data);
  // Navigate to detailed view
  // router.push(`/admin/school/details/${kpiType}`);
};

<KPIDashboardAdvanced
  schoolId={schoolId}
  onKPIClick={handleKPIClick}
  enableDrilldown={true}
/>
```

---

## 📊 Sample Data Setup

If you don't have data yet, here's how to add sample data:

### Add Sample Students
```sql
INSERT INTO students (student_id, school_id, status, grade, section)
VALUES 
  (gen_random_uuid(), 'your-school-id', 'active', '10', 'A'),
  (gen_random_uuid(), 'your-school-id', 'active', '10', 'B'),
  (gen_random_uuid(), 'your-school-id', 'active', '11', 'A');
```

### Add Sample Attendance
```sql
INSERT INTO attendance_records (att_id, student_id, school_id, date, status)
SELECT 
  gen_random_uuid(),
  student_id,
  school_id,
  CURRENT_DATE,
  'present'
FROM students
WHERE school_id = 'your-school-id'
LIMIT 10;
```

### Add Sample Exams
```sql
INSERT INTO exams (exam_id, school_id, name, date)
VALUES 
  (gen_random_uuid(), 'your-school-id', 'Mid-term Exam', CURRENT_DATE + INTERVAL '7 days'),
  (gen_random_uuid(), 'your-school-id', 'Final Exam', CURRENT_DATE + INTERVAL '30 days');
```

---

## 🔐 Security Checklist

- [ ] School ID is validated
- [ ] User has permission to view school data
- [ ] RLS policies are enabled
- [ ] API keys are in environment variables
- [ ] No sensitive data in console logs

---

## 📚 Additional Resources

- **Full Documentation:** `KPI_Dashboard_Implementation_Guide.md`
- **Component Files:**
  - `src/components/admin/KPIDashboard.tsx`
  - `src/components/admin/KPIDashboardAdvanced.tsx`
- **Usage Examples:** `src/components/admin/KPIDashboard.example.tsx`

---

## ✅ Verification Steps

1. **Navigate to School Admin Dashboard**
   ```
   http://localhost:5173/admin/school/dashboard
   ```

2. **Check for 7 KPI Cards**
   - Total Students
   - Attendance % Today
   - Exams Scheduled
   - Pending Assessments
   - Fee Collection
   - Career Readiness Index
   - Library Overdue Items

3. **Verify Real-time Updates**
   - Wait 15 minutes or click refresh
   - Data should update automatically

4. **Check Console for Errors**
   - Open browser DevTools (F12)
   - Look for any red errors
   - Verify API calls are successful

---

## 🎉 Success!

If you see the 7 KPI cards with data, congratulations! The integration is complete.

If you encounter any issues, refer to the troubleshooting section above or check the full documentation.

---

**Last Updated:** November 28, 2025  
**Status:** ✅ Integrated into School Admin Dashboard

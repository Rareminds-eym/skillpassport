# Demo Attendance Data Setup

This guide will help you generate demo attendance data for your school admin dashboard.

## Quick Start

### Option 1: Using JavaScript (Recommended)

1. **Run the script:**
   ```bash
   node generate-demo-attendance.js
   ```

   Or on Windows, double-click:
   ```
   setup-demo-attendance.bat
   ```

2. **What it does:**
   - Generates 30 days of attendance data for all 8 students
   - Creates realistic patterns: 85% present, 5% absent, 5% late, 5% excused
   - Skips weekends automatically
   - Adds random time-in/time-out stamps
   - Uses different modes (manual, RFID, biometric)

3. **Expected Output:**
   ```
   ✅ Found 8 students
   📝 Generating attendance for: Arjun Patel (001)
   📝 Generating attendance for: Priya Sharma (002)
   ...
   📊 Generated ~160 attendance records
   ✨ Demo attendance data generation complete!
   ```

### Option 2: Using SQL

1. **Open Supabase SQL Editor**
2. **Copy and paste** the contents of `generate-demo-attendance.sql`
3. **Run the query**
4. **Check the verification output** at the bottom

## What Data Gets Generated

### Attendance Records
- **Date Range:** Last 30 days (excluding weekends)
- **Status Distribution:**
  - 85% Present (with time-in/time-out)
  - 5% Absent (no time stamps)
  - 5% Late (delayed time-in)
  - 5% Excused (medical leave)

### Time Stamps
- **Time In:** 8:00 AM - 9:00 AM (random)
- **Time Out:** 3:00 PM - 3:30 PM (random)

### Tracking Modes
- 70% Manual entry
- 15% RFID card
- 15% Biometric

## After Running the Script

### What You'll See in the UI

1. **Attendance & Reports Page:**
   - ✅ Today's Attendance: ~85%
   - ✅ Absent Today: 0-1 students
   - ✅ Below 75% Attendance: 0-1 students
   - ✅ Chronic Absentees: 0-1 students

2. **Daily Summary Tab:**
   - Class-wise attendance breakdown
   - Section-wise statistics
   - Teacher assignments

3. **Student Trend Tab:**
   - All 8 students with attendance percentages
   - Individual student attendance history
   - Monthly trend charts

4. **Chronic Absentee Tab:**
   - Students with <75% attendance
   - Consecutive absence tracking
   - Intervention recommendations

5. **Class-wise Analysis Tab:**
   - Attendance by class and section
   - Comparative analytics
   - Trend visualizations

6. **Raw Logs Tab:**
   - Complete attendance records
   - Filterable by date, status, class
   - Exportable to CSV

## Troubleshooting

### No Data Showing Up?

1. **Check School ID:**
   - Make sure the school ID in the script matches your logged-in school
   - Default: `550e8400-e29b-41d4-a716-446655440000`

2. **Check Students:**
   ```sql
   SELECT id, name, roll_number FROM students 
   WHERE school_id = '550e8400-e29b-41d4-a716-446655440000';
   ```

3. **Check Attendance Table:**
   ```sql
   SELECT COUNT(*) FROM attendance 
   WHERE school_id = '550e8400-e29b-41d4-a716-446655440000';
   ```

### Script Errors?

1. **Missing Environment Variables:**
   - Make sure `.env` file has `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`

2. **Permission Issues:**
   - Ensure your Supabase key has write access to the `attendance` table

3. **Duplicate Records:**
   - The script uses `upsert` with conflict resolution
   - Safe to run multiple times

## Customization

### Change Date Range
Edit `generate-demo-attendance.js`:
```javascript
for (let i = 0; i < 30; i++) {  // Change 30 to desired days
```

### Change Attendance Patterns
Edit the probability thresholds:
```javascript
if (random < 0.85) {  // 85% present
  status = 'present';
} else if (random < 0.90) {  // 5% absent
  status = 'absent';
}
```

### Change School ID
Edit the constant:
```javascript
const SCHOOL_ID = 'YOUR_SCHOOL_ID_HERE';
```

## Clean Up Demo Data

To remove all demo attendance data:

```sql
DELETE FROM attendance 
WHERE school_id = '550e8400-e29b-41d4-a716-446655440000'
AND marked_by = 'system';
```

## Next Steps

After generating demo data:

1. ✅ Refresh the Attendance & Reports page
2. ✅ Explore all tabs (Daily Summary, Student Trend, etc.)
3. ✅ Test export functionality (CSV, PDF)
4. ✅ Try filtering by date, class, section
5. ✅ View individual student attendance trends

## Support

If you encounter any issues:
1. Check the browser console for errors
2. Verify database permissions
3. Ensure all students have valid `school_id`
4. Check that the `attendance` table exists and has proper schema

---

**Ready to present to your client!** 🎉

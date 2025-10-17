# 🚀 Quick Setup Guide - Automatic Recent Updates

## ✅ What This Does

Makes your `recent_updates` table automatically populate with real-time events:
- ✅ "You completed [Course Name] course" - when training is marked complete
- ✅ "You added 3 new skill(s)" - when skills are added
- ✅ "Your profile has been viewed 15 times this week" - every 5 profile views
- ✅ "New opportunity match: Frontend Developer at Google" - when opportunities are matched

---

## 📋 Setup Steps (5 minutes)

### Step 1: Run the Database Setup Script

1. Open your **Supabase Dashboard**
2. Go to **SQL Editor**
3. Click **New Query**
4. Copy and paste the contents of `database/setup_auto_updates.sql`
5. Click **Run**
6. You should see success messages ✅

**Expected Output:**
```
✅ Automatic Recent Updates System installed successfully!
📋 Created functions: add_recent_update, track_profile_view, add_opportunity_match_update, add_achievement_update
🔔 Created triggers: training completion, skills improvement
📊 Created table: profile_views
```

---

### Step 2: Test the Triggers

Run these test queries in Supabase SQL Editor:

#### Test 1: Training Completion Trigger
```sql
-- Mark a training as completed (replace with your email)
UPDATE students
SET profile = jsonb_set(
  profile,
  '{training,0,status}',
  '"completed"'
)
WHERE email = 'durkadevidurkadevi43@gmail.com';

-- Check if update was created
SELECT * FROM recent_updates 
WHERE student_id = (SELECT id FROM students WHERE email = 'durkadevidurkadevi43@gmail.com');
```

#### Test 2: Skills Addition Trigger
```sql
-- Add a new skill (replace with your email)
UPDATE students
SET profile = jsonb_set(
  profile,
  '{technicalSkills}',
  (profile->'technicalSkills' || '[{"id": 999, "name": "Test Skill", "level": 4}]'::jsonb)
)
WHERE email = 'durkadevidurkadevi43@gmail.com';

-- Check recent updates
SELECT updates FROM recent_updates 
WHERE student_id = (SELECT id FROM students WHERE email = 'durkadevidurkadevi43@gmail.com');
```

#### Test 3: Profile View Tracking
```sql
-- Simulate 5 profile views
DO $$
DECLARE
  v_student_id uuid;
BEGIN
  SELECT id INTO v_student_id FROM students WHERE email = 'durkadevidurkadevi43@gmail.com';
  
  FOR i IN 1..5 LOOP
    PERFORM track_profile_view(v_student_id, 'recruiter', NULL);
  END LOOP;
END $$;

-- Check if view count update was created
SELECT updates FROM recent_updates 
WHERE student_id = (SELECT id FROM students WHERE email = 'durkadevidurkadevi43@gmail.com');
```

---

### Step 3: Frontend Integration (Optional)

The triggers work automatically, but for profile views you need to call the tracking function from your frontend.

#### Example 1: Track Profile View in Recruiter Dashboard

```javascript
// In src/pages/recruiter/TalentPool.tsx
import { trackProfileView } from '@/services/profileViewService';

const handleViewProfile = async (candidate) => {
  // Track the view
  await trackProfileView(
    candidate.id,
    'recruiter',
    currentUser?.id
  );
  
  // Then show the profile
  setSelectedCandidate(candidate);
  setShowProfileModal(true);
};
```

#### Example 2: Track When Student Views Another Student's Profile

```javascript
// In src/pages/student/Dashboard.jsx
import { trackProfileView } from '@/services/profileViewService';
import { useSupabaseAuth } from '@/context/SupabaseAuthContext';

const { user } = useSupabaseAuth();

useEffect(() => {
  if (viewingOtherProfile && otherStudentId && user) {
    trackProfileView(otherStudentId, 'student', user.id);
  }
}, [viewingOtherProfile, otherStudentId, user]);
```

---

## 🧪 Verification Checklist

Run through this checklist to ensure everything works:

- [ ] SQL script ran without errors
- [ ] Test 1 (Training Completion) created "You completed..." update
- [ ] Test 2 (Skills Addition) created "You added X new skill(s)" update
- [ ] Test 3 (Profile Views) created "viewed X times" update after 5 views
- [ ] Triggers show up in database:
  ```sql
  SELECT trigger_name FROM information_schema.triggers
  WHERE event_object_table = 'students'
  AND trigger_name LIKE 'auto_recent_update%';
  ```
- [ ] Functions are created:
  ```sql
  SELECT routine_name FROM information_schema.routines
  WHERE routine_schema = 'public'
  AND routine_name LIKE '%recent_update%'
  OR routine_name LIKE '%profile_view%';
  ```

---

## 🎯 How to Use in Your App

### Automatic (No Code Required)
These happen automatically via database triggers:
- ✅ Training completions
- ✅ Skill additions
- ✅ Profile updates

### Manual (Requires Frontend Code)
These need to be called from your frontend:

```javascript
import profileViewService from '@/services/profileViewService';

// 1. Track profile view
await profileViewService.trackProfileView(studentId, 'recruiter', recruiterId);

// 2. Add opportunity match
await profileViewService.addOpportunityMatchUpdate(
  studentId,
  'Frontend Developer',
  'Google'
);

// 3. Add achievement
await profileViewService.addAchievementUpdate(
  studentId,
  'Completed 5 courses this month!'
);

// 4. Get view statistics
const { count } = await profileViewService.getProfileViewStats(studentId, 7);
console.log(`Viewed ${count} times in last 7 days`);
```

---

## 🔧 Customization

### Change Update Frequency for Profile Views

Default: Updates every 5 views. To change to 10:

```sql
-- Edit in setup_auto_updates.sql, line ~181
IF v_recent_views % 10 = 0 THEN  -- Changed from 5 to 10
```

### Change How Many Updates to Keep

Default: 20 updates. To change to 50:

```sql
-- Edit in setup_auto_updates.sql, line ~47
IF jsonb_array_length(v_updates_array) > 50 THEN
  v_updates_array := v_updates_array #> ARRAY['0:49'];
```

### Add New Trigger Types

Create your own custom trigger:

```sql
CREATE OR REPLACE FUNCTION trigger_custom_event()
RETURNS TRIGGER AS $$
BEGIN
  -- Your logic here
  PERFORM add_recent_update(
    NEW.id,
    'Your custom message here',
    'custom_type'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_custom_update
  AFTER UPDATE OF profile ON students
  FOR EACH ROW
  EXECUTE FUNCTION trigger_custom_event();
```

---

## 🐛 Troubleshooting

### "Function does not exist"
- Make sure you ran `setup_auto_updates.sql` in Supabase SQL Editor
- Check if functions exist: `SELECT routine_name FROM information_schema.routines WHERE routine_name LIKE '%recent%';`

### Updates not appearing in frontend
- Check if RLS policies allow reading: `SELECT * FROM recent_updates;`
- Verify hook is fetching correctly: Check browser console for logs
- Refresh the dashboard after making changes

### Duplicate updates appearing
- Check if you're running multiple triggers on same event
- Look for duplicate trigger names: `SELECT * FROM information_schema.triggers WHERE event_object_table = 'students';`

### Trigger not firing
- Verify trigger exists: `SELECT trigger_name FROM information_schema.triggers WHERE trigger_name LIKE 'auto_recent_update%';`
- Check trigger conditions match your update
- Enable PostgreSQL logging to see trigger execution

---

## 📚 Files Reference

| File | Purpose |
|------|---------|
| `database/setup_auto_updates.sql` | **Main setup script** - Run this in Supabase |
| `database/AUTO_UPDATES_GUIDE.md` | Detailed documentation |
| `src/services/profileViewService.js` | Frontend service for tracking views |
| `src/hooks/useRecentUpdates.js` | Hook to fetch updates (already exists) |

---

## 🎉 That's It!

Your recent updates should now be automatically populating! 

**Next Steps:**
1. Run `setup_auto_updates.sql` in Supabase ✅
2. Test with the SQL queries above ✅
3. Add profile view tracking to your frontend (optional) ✅
4. Enjoy automatic updates! 🎊

---

**Need Help?** Check the detailed guide in `database/AUTO_UPDATES_GUIDE.md`

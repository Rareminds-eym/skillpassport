# Automatic Recent Updates System

## 📋 Overview

This guide explains how to implement automatic updates in the `recent_updates` table so that it dynamically populates with events like profile views, training completions, skill improvements, etc.

## 🔴 Current State (Before Implementation)

Currently, the `recent_updates` table is:
- ✅ Properly structured with JSONB field for updates
- ✅ Connected to the frontend via `useRecentUpdates` hook
- ❌ **NOT automatically updating** when events occur
- ❌ Only shows hardcoded sample data

## ✅ Proposed Solution

The solution uses **PostgreSQL triggers and functions** to automatically add updates when:

1. **Profile is updated** → "Profile information updated"
2. **Training is completed** → "You completed [Course Name] course"
3. **Skills are added** → "You added X new skill(s)"
4. **Profile is viewed** → "Your profile has been viewed X times this week"
5. **Opportunity matches** → "New opportunity match: [Job Title] at [Company]"

## 🚀 Implementation Steps

### Step 1: Run the Triggers SQL File

Execute the SQL file in your Supabase SQL Editor:

```bash
# File: database/auto_update_recent_updates_triggers.sql
```

This creates:
- ✅ Helper function `add_recent_update()` to insert updates
- ✅ Trigger for profile updates
- ✅ Trigger for training completions
- ✅ Trigger for skills improvements
- ✅ Table `profile_views` to track views
- ✅ Function `track_profile_view()` for view tracking

### Step 2: Update Frontend to Track Profile Views

Add this code when a profile is viewed (e.g., in recruiter's TalentPool or when viewing another student's profile):

```javascript
// In src/services/profileViewService.js (create this file)
import { supabase } from '../lib/supabaseClient';

/**
 * Track when a profile is viewed
 */
export async function trackProfileView(studentId, viewerType = 'anonymous', viewerId = null) {
  try {
    const { data, error } = await supabase.rpc('track_profile_view', {
      p_student_id: studentId,
      p_viewer_type: viewerType,
      p_viewer_id: viewerId
    });

    if (error) throw error;
    console.log('✅ Profile view tracked');
    return { success: true };
  } catch (error) {
    console.error('❌ Error tracking profile view:', error);
    return { success: false, error };
  }
}
```

Use it in your components:

```javascript
// Example: In TalentPool.tsx when viewing a candidate
import { trackProfileView } from '@/services/profileViewService';

const handleViewProfile = async (candidate) => {
  // Track the view
  await trackProfileView(
    candidate.id,
    'recruiter',
    currentUser?.id
  );
  
  // Show profile...
  setSelectedCandidate(candidate);
};
```

### Step 3: Add Opportunity Match Updates

When matching opportunities to students:

```javascript
// In your opportunity matching logic
import { supabase } from '../lib/supabaseClient';

async function notifyOpportunityMatch(studentId, opportunityTitle, companyName) {
  try {
    const { error } = await supabase.rpc('add_opportunity_match_update', {
      p_student_id: studentId,
      p_opportunity_title: opportunityTitle,
      p_company_name: companyName
    });

    if (error) throw error;
  } catch (error) {
    console.error('Error adding opportunity update:', error);
  }
}
```

### Step 4: Test the System

#### Test 1: Profile Update
```sql
-- Update a student profile to trigger automatic update
UPDATE students
SET profile = jsonb_set(profile, '{name}', '"Updated Name"')
WHERE email = 'your-email@example.com';

-- Check recent_updates
SELECT * FROM recent_updates 
WHERE student_id = (SELECT id FROM students WHERE email = 'your-email@example.com');
```

#### Test 2: Training Completion
```sql
-- Mark a training as completed
UPDATE students
SET profile = jsonb_set(
  profile,
  '{training,0,status}',
  '"completed"'
)
WHERE email = 'your-email@example.com';

-- Check for "You completed [course] course" update
SELECT * FROM recent_updates 
WHERE student_id = (SELECT id FROM students WHERE email = 'your-email@example.com');
```

#### Test 3: Profile View
```sql
-- Track a profile view
SELECT track_profile_view(
  (SELECT id FROM students WHERE email = 'your-email@example.com'),
  'recruiter',
  NULL
);

-- Repeat 5 times to trigger "viewed X times" update
```

## 📊 Database Functions Reference

### Core Functions

| Function | Purpose | Parameters |
|----------|---------|------------|
| `add_recent_update()` | Adds any update to recent_updates | student_id, message, type |
| `track_profile_view()` | Tracks profile view and creates update | student_id, viewer_type, viewer_id |
| `add_opportunity_match_update()` | Adds opportunity match notification | student_id, opportunity_title, company_name |
| `add_achievement_update()` | Adds achievement notification | student_id, achievement_text |

### Update Types

| Type | Description | Example Message |
|------|-------------|-----------------|
| `profile_update` | Profile information changed | "Profile information updated" |
| `course_completion` | Training completed | "You completed React Basics course" |
| `skill_improvement` | Skills added/updated | "You added 3 new skill(s)" |
| `profile_view` | Profile viewed by recruiter | "Your profile has been viewed 15 times this week" |
| `opportunity_match` | New job/internship match | "New opportunity match: Frontend Developer at Google" |
| `achievement` | Custom achievement | "Completed 5 courses this month" |

## 🔧 Customization

### Adjust Update Frequency

Profile view updates are triggered every 5 views. To change this:

```sql
-- In trigger_profile_view() function
IF v_recent_views % 10 = 0 THEN  -- Change from 5 to 10
  -- Create update...
END IF;
```

### Change Update Retention

Currently keeps last 20 updates. To change:

```sql
-- In add_recent_update() function
IF jsonb_array_length(v_updates_array) > 50 THEN  -- Change from 20 to 50
  v_updates_array := v_updates_array #> ARRAY['0:49'];  -- Also update this
END IF;
```

### Add Custom Update Types

Create your own update function:

```sql
CREATE OR REPLACE FUNCTION add_custom_update(
  p_student_id uuid,
  p_custom_message text
)
RETURNS void AS $$
BEGIN
  PERFORM add_recent_update(
    p_student_id,
    p_custom_message,
    'custom_type'  -- Your custom type
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## 🎨 Frontend Integration

The updates will automatically appear in the dashboard since `useRecentUpdates` hook already reads from the `recent_updates` table.

### Customize Update Display

In `Dashboard.jsx`, add styling for new update types:

```jsx
const getUpdateIcon = (type) => {
  switch(type) {
    case 'profile_view':
      return <Eye className="w-4 h-4" />;
    case 'course_completion':
      return <Award className="w-4 h-4" />;
    case 'skill_improvement':
      return <TrendingUp className="w-4 h-4" />;
    case 'opportunity_match':
      return <Briefcase className="w-4 h-4" />;
    case 'achievement':
      return <Star className="w-4 h-4" />;
    default:
      return <Bell className="w-4 h-4" />;
  }
};
```

## 🐛 Troubleshooting

### Updates Not Appearing

1. **Check if triggers are created:**
```sql
SELECT trigger_name FROM information_schema.triggers
WHERE event_object_table = 'students';
```

2. **Check trigger execution logs:**
```sql
-- Enable logging in PostgreSQL
SET log_min_messages TO LOG;
```

3. **Verify RLS policies allow reading:**
```sql
SELECT * FROM recent_updates 
WHERE student_id = 'your-student-id';
```

### Duplicate Updates

If you see duplicate updates, check that:
- Triggers aren't fired multiple times
- Frontend isn't calling tracking functions repeatedly
- No recursive trigger execution

## 📈 Performance Considerations

1. **Indexing**: Ensure indexes exist on frequently queried columns
```sql
CREATE INDEX IF NOT EXISTS idx_recent_updates_student ON recent_updates(student_id);
CREATE INDEX IF NOT EXISTS idx_profile_views_student ON profile_views(student_id);
```

2. **Cleanup Old Data**: Schedule periodic cleanup of old profile_views:
```sql
DELETE FROM profile_views 
WHERE viewed_at < now() - interval '90 days';
```

3. **Rate Limiting**: Prevent spam by limiting update frequency per event type

## 🔐 Security

All functions are created with `SECURITY DEFINER` to ensure:
- Proper permissions for inserting updates
- RLS policies are respected
- No direct table manipulation from frontend

## 📝 Migration Checklist

- [ ] Run `auto_update_recent_updates_triggers.sql` in Supabase
- [ ] Verify triggers created successfully
- [ ] Create `profileViewService.js` in frontend
- [ ] Add profile view tracking to relevant components
- [ ] Test profile updates trigger
- [ ] Test training completion trigger
- [ ] Test skills improvement trigger
- [ ] Test profile view tracking
- [ ] Update frontend to display new update types
- [ ] Document custom update types for your team

## 🎯 Next Steps

1. **Real-time Updates**: Add Supabase real-time subscriptions to show updates instantly
2. **Push Notifications**: Integrate with browser notifications
3. **Analytics Dashboard**: Track which updates get most engagement
4. **AI-Powered Updates**: Use ML to generate personalized suggestions

## 📚 Related Files

- `/database/auto_update_recent_updates_triggers.sql` - Trigger definitions
- `/database/recent_updates_schema.sql` - Table schema
- `/src/hooks/useRecentUpdates.js` - Frontend hook
- `/src/pages/student/Dashboard.jsx` - Updates display

---

**Need Help?** Check the implementation examples in the SQL file or review the test queries provided above.

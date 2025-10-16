# 🔔 Opportunity Notifications Setup Guide

## What This Does

Automatically notifies all students in their "Recent Updates" section when:
- ✨ A new opportunity is posted by a recruiter
- 🔄 An opportunity is reopened (status changed from inactive to active)

## Installation Steps

### 1. Run the SQL Setup

In your Supabase SQL Editor, run:

```sql
-- File: database/setup_opportunity_notifications.sql
```

Copy and paste the entire content of `setup_opportunity_notifications.sql` and execute it.

### 2. Verify Installation

After running the SQL, you should see output like:

```
✅ Trigger installed: trigger_new_opportunity_notification
✅ Trigger installed: trigger_opportunity_update_notification
```

### 3. Test the Feature

**Test New Opportunity:**
1. Go to the Recruiter dashboard
2. Post a new opportunity
3. Check the Student dashboard → Recent Updates should show: 
   - "New opportunity available: [Job Title] at [Company]"

**Test Opportunity Reopening:**
1. Mark an opportunity as inactive
2. Mark it as active again
3. Recent Updates should show:
   - "Opportunity reopened: [Job Title]"

## How It Works

### Real-Time Updates
The Student Dashboard uses **Supabase Real-Time subscriptions** to:
- Listen for new opportunities being inserted
- Automatically refresh the opportunities list
- Automatically refresh Recent Updates

### Database Triggers
When a recruiter posts a new opportunity:
1. Database trigger fires: `trigger_new_opportunity_notification`
2. Function loops through all students
3. Adds a recent update entry for each student
4. Student dashboards receive the update in real-time

## Features

### Student Experience
- ✅ **No page refresh needed** - updates appear automatically
- ✅ **Real-time notifications** - see new opportunities instantly
- ✅ **Personalized updates** - each student gets their own notification
- ✅ **Timestamp tracking** - shows "Just now" for new updates

### Performance
- Uses Supabase Real-Time (WebSocket) - very efficient
- Minimal database queries
- Updates only when changes occur

## Troubleshooting

### Updates not appearing?

1. **Check if triggers are installed:**
```sql
SELECT trigger_name 
FROM information_schema.triggers
WHERE event_object_table = 'opportunities';
```

2. **Check if recent_updates table exists:**
```sql
SELECT * FROM public.recent_updates LIMIT 5;
```

3. **Verify the helper function exists:**
```sql
SELECT routine_name 
FROM information_schema.routines
WHERE routine_name = 'add_recent_update';
```

If `add_recent_update` doesn't exist, run `QUICK_INSTALL_TRIGGERS.sql` first.

### Real-time not working?

1. Check browser console for connection messages
2. Verify Supabase URL and keys are correct
3. Check if Real-Time is enabled in Supabase project settings

## Code Reference

**Dashboard Component:** `src/pages/student/Dashboard.jsx`
- Lines with real-time subscription setup
- Automatically refreshes on new opportunities

**Database Triggers:** `database/setup_opportunity_notifications.sql`
- Creates notification functions
- Sets up INSERT and UPDATE triggers

## Related Files

- `database/QUICK_INSTALL_TRIGGERS.sql` - Must be run first (for add_recent_update function)
- `database/setup_opportunity_notifications.sql` - Run this file for opportunity notifications
- `src/hooks/useRecentUpdates.js` - Manages recent updates display
- `src/hooks/useOpportunities.js` - Manages opportunities data

---

**Status:** ✅ Fully implemented with real-time updates
**Last Updated:** October 2025

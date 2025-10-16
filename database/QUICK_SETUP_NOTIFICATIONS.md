# 🚀 Quick Setup: Opportunity Notifications

## What You Need to Do

### 1️⃣ Install the Triggers (One Time)

**In Supabase SQL Editor:**

```sql
-- Step 1: Run this file first (if not already done)
-- File: database/QUICK_INSTALL_TRIGGERS.sql
-- This creates the add_recent_update() helper function
```

```sql
-- Step 2: Run this file to enable opportunity notifications
-- File: database/setup_opportunity_notifications.sql
-- This creates the notification triggers
```

### 2️⃣ Test the Setup (Optional)

**In Supabase SQL Editor:**

```sql
-- File: database/test_opportunity_notifications.sql
-- This verifies everything is working
```

### 3️⃣ Start Using It!

**That's it!** Now when recruiters post opportunities:
- ✅ All students get notified automatically
- ✅ Recent Updates section shows the new opportunity
- ✅ Real-time - no page refresh needed!

---

## How to Use

### For Recruiters:
1. Go to Recruiter Dashboard
2. Click "Post Opportunity"
3. Fill in the details:
   - **Title**: e.g., "Software Developer"
   - **Company Name**: e.g., "Tech Corp"
   - **Employment Type**: e.g., "Full-Time"
   - **Location**: e.g., "Bangalore"
   - etc.
4. Click "Post"

### What Students See:
- 📢 Recent Updates immediately shows:
  - "New Full-Time opportunity: Software Developer at Tech Corp"
- 🔔 No page refresh needed - appears instantly!

---

## Notification Examples

Students will see updates like:

✨ **New Opportunity Posted:**
> "New Full-Time opportunity: Backend Developer at Google"

🔄 **Opportunity Reopened:**
> "Opportunity reopened: Frontend Developer at Microsoft"

📚 **Profile Updates (already working):**
> "Education details updated"
> "You completed Python Programming course"
> "You added 3 new skill(s)"

---

## Troubleshooting

### Updates Not Showing?

**Check 1: Are triggers installed?**
```sql
SELECT trigger_name 
FROM information_schema.triggers
WHERE event_object_table = 'opportunities';
```
Expected: 2 triggers

**Check 2: Is the helper function installed?**
```sql
SELECT routine_name 
FROM information_schema.routines
WHERE routine_name = 'add_recent_update';
```
Expected: 1 function

**Check 3: Do you have students?**
```sql
SELECT COUNT(*) FROM students;
```
Expected: > 0

### Real-Time Not Working?

1. Hard refresh the browser (Ctrl + F5)
2. Check browser console for errors
3. Verify Supabase environment variables in `.env`

---

## File Reference

| File | Purpose |
|------|---------|
| `QUICK_INSTALL_TRIGGERS.sql` | Creates helper function (run first) |
| `setup_opportunity_notifications.sql` | Creates opportunity triggers (run second) |
| `test_opportunity_notifications.sql` | Verify everything works (optional) |
| `OPPORTUNITY_NOTIFICATIONS_GUIDE.md` | Detailed documentation |

---

## Need Help?

1. Run `test_opportunity_notifications.sql`
2. Check the console output
3. Look for error messages in Supabase logs

**Status:** ✅ Ready to use!

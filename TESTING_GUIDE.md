# 🧪 Testing Your Integration

## Quick Test Guide

### Test 1: Dashboard Loads (2 minutes)

1. **Start your dev server:**
   ```bash
   npm run dev
   ```

2. **Navigate to the Student Dashboard:**
   - Go to the student dashboard route
   - You should see the Dashboard component

3. **Check the Status Banner:**
   - Look at the top of the page
   - You should see a **yellow banner** that says:
     ```
     ⚠ Using Mock Data (No user logged in)  [Migrate to Supabase]
     ```

4. **Verify Mock Data Displays:**
   - Education section shows 3 education entries
   - Training section shows 3 training entries
   - Experience section shows 2 experience entries
   - Skills sections show technical and soft skills

✅ **Expected Result:** Everything displays correctly using mock data.

---

### Test 2: Edit Functionality (2 minutes)

1. **Click Edit on Education Section:**
   - Click the pencil icon
   - Modal should open

2. **Make a change:**
   - Change institution name
   - Click Save

3. **Verify change appears:**
   - Modal closes
   - New institution name shows in the card

✅ **Expected Result:** Edits work in local state (not saved to database yet).

---

### Test 3: Check Browser Console (1 minute)

1. **Open Developer Tools:**
   - Press `F12` or right-click → Inspect
   - Go to Console tab

2. **Look for errors:**
   - Should see no red errors
   - Might see a message about using mock data (this is OK)

✅ **Expected Result:** No errors in console.

---

### Test 4: Migration Button (1 minute)

1. **Click "Migrate to Supabase" button**
   - Dialog should appear

2. **Read the message:**
   - Should say: "This will migrate your current mock data to Supabase. Make sure you're logged in to a Supabase account first."

3. **Click Cancel** (for now)
   - Dialog closes

✅ **Expected Result:** Migration UI works, button appears.

---

## After Setting Up Supabase Auth

### Test 5: Supabase Connection (5 minutes)

**Prerequisites:**
- Supabase Auth is configured
- A test user is logged in

1. **Reload the Dashboard**

2. **Check Status Banner:**
   - Should now be **green**:
     ```
     ✓ Connected to Supabase ✓  [Refresh]
     ```

3. **Verify data loads from Supabase:**
   - If no data in database yet, it should show empty or fallback to mock
   - If migrated, it should show your migrated data

✅ **Expected Result:** Green banner appears when logged in.

---

### Test 6: Migration (5 minutes)

1. **Make sure you're logged in** (green banner showing)

2. **Click "Migrate to Supabase"**

3. **Click "Start Migration"**
   - Button shows spinner: "Migrating..."
   - Wait a few seconds

4. **Check for success:**
   - Alert should say: "✅ Data migrated successfully!"
   - Banner should be green: "Connected to Supabase ✓"

5. **Verify in Supabase Dashboard:**
   - Go to https://dpooleduinyyzxgrcwko.supabase.co
   - Open Table Editor
   - Click on `students` table
   - You should see a row with your data
   - Click on the `profile` column - it should contain your mock data in JSONB format

✅ **Expected Result:** Data successfully migrated to Supabase.

---

### Test 7: Database Persistence (3 minutes)

**Prerequisites:**
- Data has been migrated (Test 6 complete)

1. **Edit Education:**
   - Change institution name
   - Click Save

2. **Reload the page** (F5)

3. **Check if edit persisted:**
   - The institution name should still be changed
   - Data is now coming from Supabase

✅ **Expected Result:** Edits are saved to database and persist after reload.

---

### Test 8: Refresh Button (1 minute)

1. **Click the "Refresh" button** in the green banner

2. **Watch the banner:**
   - Should briefly show loading state
   - Then back to green "Connected ✓"

3. **Data should reload from database**

✅ **Expected Result:** Refresh button works without errors.

---

## 🐛 Troubleshooting

### Yellow Banner Stuck (Won't Turn Green)

**Check:**
1. Is a Supabase user logged in?
2. Check browser console for auth errors
3. Verify `.env` file has correct Supabase credentials:
   ```
   VITE_SUPABASE_URL=https://dpooleduinyyzxgrcwko.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

---

### Migration Fails

**Possible Issues:**

1. **"User not authenticated"**
   - Fix: Log in to Supabase first
   - Check: `supabase.auth.getUser()` returns a user

2. **"Function not found"**
   - Fix: Run the SQL from `schema_adapted.sql` in Supabase SQL Editor
   - Check: Step 1 was completed

3. **"Permission denied"**
   - Fix: Check Row Level Security policies in Supabase
   - Ensure policies allow authenticated users to insert/update

---

### Data Not Saving

**Check:**
1. Is green banner showing? (Must be connected)
2. Browser console - any errors?
3. Network tab - are Supabase requests succeeding?
4. Supabase Table Editor - is data updating?

**Debug:**
```javascript
// Add to handleSave function temporarily:
console.log('Saving to Supabase:', { section, data, currentUserId });
```

---

### Can't See Data in Supabase

**Steps:**
1. Go to Supabase Dashboard
2. Table Editor → `students` table
3. Look for a row with your `userId`
4. Click on `profile` column → should show JSONB data
5. Expand JSONB to see: education, training, experience, etc.

---

## 📊 Expected Database Structure

After migration, your `students` table should look like:

| id (UUID) | userId (UUID) | universityId | profile (JSONB) | createdAt | updatedAt |
|-----------|---------------|--------------|-----------------|-----------|-----------|
| abc123... | def456... | UNI001 | {...} | 2024-01-20 | 2024-01-20 |

**profile JSONB structure:**
```json
{
  "name": "Anannya Banerjee",
  "email": "student@example.com",
  "passportId": "SKP001",
  "education": [
    {
      "id": "edu-1",
      "degree": "Master in Science in Computer Science",
      "institution": "IIT Kharagpur",
      "duration": "2021 - 2023",
      "grade": "CGPA: 8.50",
      "achievements": ["Dean's List", "Research Publication"]
    }
  ],
  "training": [...],
  "experience": [...],
  "technicalSkills": [...],
  "softSkills": [...]
}
```

---

## ✅ Success Checklist

### Basic Functionality (Works Immediately)
- [ ] Dashboard loads without errors
- [ ] Mock data displays correctly
- [ ] Yellow banner appears
- [ ] Edit modals work
- [ ] Local edits save to state
- [ ] Migration button appears

### With Supabase Auth (After Setup)
- [ ] Green banner appears when logged in
- [ ] Data loads from Supabase
- [ ] Migration succeeds
- [ ] Edits save to database
- [ ] Page refresh preserves data
- [ ] Data visible in Supabase dashboard

---

## 🎯 Quick Commands Reference

### Start Dev Server
```bash
npm run dev
```

### Check Supabase Connection (Browser Console)
```javascript
// Test Supabase client
const { data, error } = await supabase.auth.getUser();
console.log('Current user:', data.user);

// Test student data fetch
const { data: student, error: err } = await supabase
  .from('students')
  .select('*')
  .eq('userId', data.user.id)
  .single();
console.log('Student data:', student);
```

### Manually Trigger Migration (Browser Console)
```javascript
// Import migration function
import { migrateCurrentUserData } from './src/utils/dataMigrationAdapted.js';

// Run migration
const result = await migrateCurrentUserData();
console.log('Migration result:', result);
```

---

## 📸 Visual Reference

### Yellow Banner (Mock Data Mode):
```
┌────────────────────────────────────────────────────────────┐
│ ⚠ Using Mock Data (No user logged in)  [Migrate to Supabase]│
└────────────────────────────────────────────────────────────┘
```

### Green Banner (Connected):
```
┌────────────────────────────────────────────────────────────┐
│ 💾 Connected to Supabase ✓                      [Refresh]  │
└────────────────────────────────────────────────────────────┘
```

### Blue Banner (Loading):
```
┌────────────────────────────────────────────────────────────┐
│ ⟳ Loading data from Supabase...                            │
└────────────────────────────────────────────────────────────┘
```

### Migration Dialog:
```
┌────────────────────────────────────────────────────────────┐
│ This will migrate your current mock data to Supabase.      │
│ Make sure you're logged in to a Supabase account first.    │
│                                                             │
│  [Start Migration]  [Cancel]                                │
└────────────────────────────────────────────────────────────┘
```

---

## 🚀 Next Steps After Testing

1. **Set up Supabase Auth** (if not done)
   - See `SUPABASE_SETUP.md`

2. **Customize the UI**
   - Change banner colors
   - Adjust button styles
   - Add more status indicators

3. **Add Error Handling**
   - Show toast notifications instead of alerts
   - Add retry buttons for failed operations
   - Log errors to a monitoring service

4. **Optimize Performance**
   - Add debouncing to save operations
   - Implement optimistic UI updates
   - Cache frequently accessed data

---

## 📞 Need Help?

If tests fail, check:
1. `STEPS_2_AND_3_COMPLETED.md` - Complete setup guide
2. `DASHBOARD_CHANGES.md` - Detailed code changes
3. Browser console for error messages
4. Network tab for failed requests
5. Supabase logs for server-side errors

---

**Happy Testing! 🎉**

All tests should pass even without Supabase Auth (using mock data). Once you set up auth, the full integration will work seamlessly.

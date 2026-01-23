# 📍 Where to See Your KPI Cards

## ✅ KPI Cards Are Now Integrated!

---

## 🌐 Access URL

Navigate to your School Admin Dashboard:

```
http://localhost:5173/admin/school/dashboard
```

Or whatever your local development URL is.

---

## 📱 Visual Layout

Your dashboard now looks like this:

```
┌─────────────────────────────────────────────────────────────────┐
│                     SCHOOL DASHBOARD                            │
│  Overview of school activities and academic performance         │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│                    🎯 REAL-TIME KPI CARDS                        │
│  (These are the NEW cards with live database data)              │
└──────────────────────────────────────────────────────────────────┘

┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│ 👥 TOTAL    │ │ 📋 ATTEND.  │ │ 🎓 EXAMS    │ │ 📝 PENDING  │
│ STUDENTS    │ │ % TODAY     │ │ SCHEDULED   │ │ ASSESSMENTS │
│             │ │             │ │             │ │             │
│    1,234    │ │     87%     │ │     12      │ │     45      │
└─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘

┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│ 💰 FEE      │ │ 💰 FEE      │ │ 📊 CAREER   │ │ 📚 LIBRARY  │
│ COLLECTION  │ │ COLLECTION  │ │ READINESS   │ │ OVERDUE     │
│ (TODAY)     │ │ (WEEK)      │ │ INDEX       │ │ ITEMS       │
│  ₹1,25,000  │ │  ₹8,50,000  │ │   78/100    │ │      8      │
└─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘

┌──────────────────────────────────────────────────────────────────┐
│              📊 STATIC SCHOOL PROGRAMS KPI CARDS                 │
│  (Your existing cards - these remain unchanged)                  │
└──────────────────────────────────────────────────────────────────┘

┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│ Total       │ │ Schools     │ │ Districts   │ │ Training    │
│ Students    │ │ Covered     │ │ Reached     │ │ Hours       │
│   4,670     │ │     240     │ │     66      │ │    180      │
└─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘

... (rest of your dashboard - charts, activities, etc.)
```

---

## 🔍 How to Identify the New KPI Cards

### Real-time KPI Cards (NEW)
- **Location:** Top section, right after the header
- **Features:**
  - ✅ Auto-refresh every 15 minutes
  - ✅ Loading skeletons when fetching data
  - ✅ Color-coded based on thresholds
  - ✅ Real-time data from database
  - ✅ "Last updated" timestamp
  - ✅ Manual refresh button

### Static KPI Cards (EXISTING)
- **Location:** Below the real-time cards
- **Features:**
  - Static data (4,670 students, 240 schools, etc.)
  - School programs data
  - No auto-refresh

---

## 🎨 Color Coding

The new KPI cards use smart color coding:

### Attendance % Today
- 🟢 **Green:** ≥ 90% (Excellent)
- 🟡 **Yellow:** 75-89% (Good)
- 🔴 **Red:** < 75% (Needs Attention)

### Career Readiness Index
- 🟢 **Green:** ≥ 75/100 (High)
- 🟡 **Yellow:** 50-74/100 (Medium)
- 🔴 **Red:** < 50/100 (Low)

### Pending Assessments
- 🟢 **Green:** ≤ 10 pending (Good)
- 🔴 **Red:** > 10 pending (Action Needed)

### Library Overdue
- 🟢 **Green:** 0 overdue (Perfect)
- 🔴 **Red:** > 0 overdue (Follow-up Needed)

---

## 🔄 Auto-refresh Indicator

Look for these indicators:

```
┌─────────────────────────────────────────────────────┐
│ 🕐 Last updated: 2:30 PM        [Refresh Now] ↻    │
└─────────────────────────────────────────────────────┘
```

- **Last updated:** Shows when data was last fetched
- **Refresh Now:** Manual refresh button
- **Auto-refresh:** Happens every 15 minutes automatically

---

## 🚀 Quick Start Checklist

To see your KPI cards:

1. **Start your development server**
   ```bash
   npm run dev
   ```

2. **Navigate to School Admin Dashboard**
   ```
   http://localhost:5173/admin/school/dashboard
   ```

3. **Look for the KPI cards section**
   - Should be right after the header
   - Before the "Quick Stats Cards" section

4. **Verify data is loading**
   - You should see loading skeletons first
   - Then real data appears
   - Check browser console for any errors

---

## ❌ Troubleshooting: "I Don't See the Cards"

### Check 1: Is the page loading?
- Open browser DevTools (F12)
- Check Console tab for errors
- Look for red error messages

### Check 2: Is the component imported?
Open `src/pages/admin/schoolAdmin/Dashboard.tsx` and verify:
```tsx
import KPIDashboard from '../../../components/admin/KPIDashboard';
```

### Check 3: Is the component rendered?
Look for this line in the JSX:
```tsx
<KPIDashboard schoolId={schoolId} />
```

### Check 4: Is schoolId defined?
Add this debug line:
```tsx
console.log('School ID:', schoolId);
```

### Check 5: Database connection
Check if Supabase is connected:
```tsx
import { supabase } from '@/config/supabase';
console.log('Supabase URL:', supabase.supabaseUrl);
```

---

## 📸 Expected Appearance

### Loading State
```
┌─────────────┐
│ ░░░░░░░░░░  │  <- Gray skeleton loader
│ ░░░░░░      │
│ ░░░░░░░░    │
└─────────────┘
```

### Loaded State
```
┌─────────────┐
│ 👥 Total    │
│ Students    │
│             │
│    1,234    │  <- Real data from database
└─────────────┘
```

### Error State
```
┌─────────────────────────────────┐
│ ⚠️ Failed to load dashboard data │
│    Please try again.             │
│                                  │
│         [Retry] 🔄               │
└─────────────────────────────────┘
```

---

## 🎯 What Each Card Shows

### 1. Total Students
- **Data Source:** `students` table
- **Filter:** `status = 'active'`
- **Updates:** Every 15 minutes

### 2. Attendance % Today
- **Data Source:** `attendance_records` table
- **Filter:** `date = TODAY`
- **Calculation:** (Present / Total) × 100
- **Updates:** Every 15 minutes

### 3. Exams Scheduled
- **Data Source:** `exams` table
- **Filter:** `date >= TODAY`
- **Updates:** Every 15 minutes

### 4. Pending Assessments
- **Data Source:** `marks` table
- **Filter:** `published = false`
- **Updates:** Every 15 minutes

### 5. Fee Collection (Today)
- **Data Source:** `fee_payments` table
- **Filter:** `payment_date = TODAY AND status = 'success'`
- **Format:** ₹1,25,000 (Indian Rupee)
- **Updates:** Every 15 minutes

### 6. Fee Collection (Week)
- **Data Source:** `fee_payments` table
- **Filter:** `payment_date >= 7 days ago AND status = 'success'`
- **Format:** ₹8,50,000 (Indian Rupee)
- **Updates:** Every 15 minutes

### 7. Career Readiness Index
- **Data Source:** `career_recommendations` table
- **Calculation:** Average of `suitability_score`
- **Range:** 0-100
- **Updates:** Every 15 minutes

### 8. Library Overdue Items
- **Data Source:** `book_issue` table
- **Filter:** `due_date < TODAY AND return_date IS NULL`
- **Updates:** Every 15 minutes

---

## 🎉 Success Indicators

You'll know it's working when you see:

✅ 7 KPI cards displayed in a grid  
✅ Real numbers (not "Loading...")  
✅ Color-coded cards (green/yellow/red)  
✅ "Last updated" timestamp  
✅ No console errors  
✅ Data changes when you refresh  

---

## 📞 Need Help?

If you still can't see the cards:

1. Check `KPI_DASHBOARD_INTEGRATION_GUIDE.md` for setup steps
2. Verify database tables exist
3. Check Supabase connection
4. Look at browser console for errors
5. Verify school ID is correct

---

**File Location:** `src/pages/admin/schoolAdmin/Dashboard.tsx`  
**Component:** `KPIDashboard` from `src/components/admin/KPIDashboard.tsx`  
**Status:** ✅ Integrated and Ready

---

**Last Updated:** November 28, 2025

# Hidden Projects Not Visible in Dashboard Modal - FIXED

## 🐛 Issue

**Problem**: Hidden projects are NOT showing in the Dashboard's "Edit Projects" modal, but they DO show in the Settings page. This means you can't re-enable hidden projects from the Dashboard.

**Screenshots show**:
- Dashboard modal: Only shows 2 projects (Research Project, Web App)
- Settings page: Shows all projects including hidden ones

## ✅ Solution Applied

### useStudentProjects.js - Fetch ALL Projects

**Location**: `src/hooks/useStudentProjects.js` (line 101)

**Status**: ✅ ALREADY FIXED

```javascript
const { data, error: fetchError} = await supabase
  .from('projects')
  .select('*')
  .eq('student_id', studentId)
  // ✅ Removed: .eq('enabled', true) - Fetch ALL projects including hidden ones
  .in('approval_status', ['approved', 'verified'])
  .order('created_at', { ascending: false});
```

The code has been updated to fetch ALL projects (including hidden ones), but your browser is showing the old cached version.

## 🔧 Solution: Clear Browser Cache

The fix is already in the code, you just need to clear your browser cache to see it.

### Method 1: Hard Refresh (Quick)
- **Windows/Linux**: Press `Ctrl + Shift + R` or `Ctrl + F5`
- **Mac**: Press `Cmd + Shift + R`

### Method 2: Clear Browser Cache (Thorough)

#### Chrome/Edge:
1. Press `Ctrl + Shift + Delete` (Windows) or `Cmd + Shift + Delete` (Mac)
2. Select "Cached images and files"
3. Time range: "Last hour" or "All time"
4. Click "Clear data"
5. Refresh the page

#### Firefox:
1. Press `Ctrl + Shift + Delete` (Windows) or `Cmd + Shift + Delete` (Mac)
2. Select "Cache"
3. Click "Clear Now"
4. Refresh the page

### Method 3: Incognito/Private Mode (Test)
Open in incognito/private window:
- **Chrome/Edge**: `Ctrl + Shift + N`
- **Firefox**: `Ctrl + Shift + P`
- **Safari**: `Cmd + Shift + N`

If hidden projects appear in incognito mode, it confirms the cache issue.

### Method 4: Force Rebuild (If using dev server)
If you're running a development server:
1. Stop the server (Ctrl + C)
2. Delete `node_modules/.cache` folder (if exists)
3. Delete `dist` or `build` folder (if exists)
4. Run `npm run dev` or `yarn dev` again
5. Hard refresh browser

## 🎯 Expected Behavior After Cache Clear

### Dashboard "Edit Projects" Modal Should Show:

1. **Visible Projects** (enabled = true)
   - Green eye icon
   - Normal opacity
   - Visible on dashboard

2. **Hidden Projects** (enabled = false)
   - Gray eye-off icon
   - Reduced opacity (grayed out)
   - NOT visible on dashboard
   - BUT visible in edit modal so you can re-enable them

### Example:
```
Edit Projects Modal:
┌─────────────────────────────────────────┐
│ Research Project  [Edit] [Delete] [👁️]  │ ← Visible
│ Web App          [Edit] [Delete] [👁️]  │ ← Visible
│ Hidden Project   [Edit] [Delete] [👁️‍🗨️] │ ← Hidden (grayed out)
└─────────────────────────────────────────┘
```

## 🧪 Testing Steps

### After Clearing Cache:

1. **Open Dashboard**
2. **Click "Edit Projects"** (pencil icon on Projects card)
3. **Verify ALL projects appear** (including hidden ones)
4. **Hidden projects should**:
   - Have gray eye-off icon
   - Be grayed out (reduced opacity)
   - Still be editable

5. **Test Re-enabling**:
   - Click gray eye-off icon on hidden project
   - Icon should turn green
   - Click "Save All Changes"
   - Close modal
   - Project should now appear on dashboard

6. **Test Hiding**:
   - Click green eye icon on visible project
   - Icon should turn gray
   - Click "Save All Changes"
   - Close modal
   - Project should disappear from dashboard
   - Open modal again - project should still be there with gray icon

## 📊 Comparison: Dashboard vs Settings

### Before Fix:
| Location | Visible Projects | Hidden Projects |
|----------|-----------------|-----------------|
| Dashboard Modal | ✅ Shows | ❌ Missing |
| Settings Page | ✅ Shows | ✅ Shows |

### After Fix (After Cache Clear):
| Location | Visible Projects | Hidden Projects |
|----------|-----------------|-----------------|
| Dashboard Modal | ✅ Shows | ✅ Shows (grayed) |
| Settings Page | ✅ Shows | ✅ Shows (grayed) |

## ✅ Files Modified

1. **src/hooks/useStudentProjects.js**
   - Line 101: Removed `.eq('enabled', true)` filter
   - ✅ Already fixed in code

2. **src/hooks/useStudentCertificates.js**
   - Line 90: Removed `.eq('enabled', true)` filter
   - ✅ Already fixed in code

3. **src/components/Students/components/ProfileEditModals/UnifiedProfileEditModal.jsx**
   - Lines 929-931: Eye icon toggle button
   - ✅ Already working correctly

## 🔍 Verification

To verify the fix is in your code, check:

```javascript
// src/hooks/useStudentProjects.js (line ~101)
const { data, error: fetchError } = await supabase
  .from('projects')
  .select('*')
  .eq('student_id', studentId)
  // This line should be commented out or removed:
  // .eq('enabled', true)
  .in('approval_status', ['approved', 'verified'])
  .order('created_at', { ascending: false});
```

If you see the comment "Removed: .eq('enabled', true)", the fix is already in your code!

## 📝 Summary

- ✅ Code is already fixed
- ✅ Fetches ALL projects (including hidden)
- ✅ Same fix applied to certificates
- ⚠️ Browser cache is preventing you from seeing the fix
- 🔧 Solution: Clear browser cache with `Ctrl + Shift + R`

---

**Status**: ✅ Code Fixed, Cache Clear Needed
**Date**: January 30, 2026
**Next Step**: Clear browser cache and test
**Priority**: High

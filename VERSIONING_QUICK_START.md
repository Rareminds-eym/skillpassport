# Versioning System - Quick Start Guide

## What You Need to Do

This feature requires both **database changes** and **code changes**. Here's the step-by-step process:

## Step 1: Run Database Migration (5 minutes)

1. Open Supabase Dashboard → SQL Editor
2. Copy content from `database/migrations/add_pending_edit_fields.sql`
3. Paste and run it
4. Verify by running the verification queries in `RUN_PENDING_EDIT_MIGRATION.md`

## Step 2: Code Changes Required

The implementation requires modifying the update functions in `src/services/studentServiceProfile.js`. Here's what needs to change:

### Current Behavior:
```javascript
// When user edits data, it directly updates/replaces
const formatted = certificatesData.map(cert => ({
  ...cert,
  approval_status: 'pending' // This makes verified data disappear
}));
```

### New Behavior Needed:
```javascript
// When user edits VERIFIED data, preserve it
const formatted = await Promise.all(certificatesData.map(async (cert) => {
  if (cert.id) {
    // Fetch existing record to check if it's verified
    const { data: existing } = await supabase
      .from('certificates')
      .select('*')
      .eq('id', cert.id)
      .single();
    
    if (existing && (existing.approval_status === 'verified' || existing.approval_status === 'approved')) {
      // This is an edit of verified data - use versioning
      return {
        ...cert,
        verified_data: existing, // Store current verified version
        pending_edit_data: cert, // Store new edit
        has_pending_edit: true,
        approval_status: 'pending',
      };
    }
  }
  
  // New data or unverified data - update normally
  return cert;
}));
```

## Step 3: Which Functions Need Updates

All these functions in `src/services/studentServiceProfile.js`:

1. ✅ `updateCertificatesByEmail` (line ~2987)
2. ✅ `updateProjectsByEmail` (line ~2814)
3. ✅ `updateExperienceByEmail` (line ~2205)
4. ✅ `updateEducationByEmail` (line ~1523)
5. ✅ `updateSkillsByEmail` (line ~2657)

## Step 4: Dashboard Changes (Already Done! ✓)

Good news! The dashboard already filters to show only verified data:
- `src/pages/student/Dashboard.jsx` - Already has verification filters ✓
- `src/components/Students/components/AchievementsTimeline.jsx` - Already filters ✓
- `src/pages/student/TimelinePage.jsx` - Already filters ✓

## Step 5: Settings Page Updates (Optional Enhancement)

To show users that their edit is pending while verified data is still visible:

```javascript
// In CertificatesTab.jsx, ProjectsTab.jsx, etc.
{certificate.has_pending_edit && (
  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
    <p className="text-sm text-blue-700">
      ℹ️ You have an edit pending verification. Your verified data is still visible on your dashboard.
    </p>
  </div>
)}
```

## Complexity Assessment

### Database Migration: ⭐ Easy (5 minutes)
Just run the SQL script - no risk, can be rolled back

### Code Changes: ⭐⭐⭐ Moderate (2-3 hours)
- Need to modify 5 update functions
- Need to fetch existing records before update
- Need to handle versioning logic
- Need to test thoroughly

### Testing: ⭐⭐ Medium (1 hour)
- Test editing verified certificates
- Test editing verified projects
- Test editing verified experience
- Test editing verified education
- Test editing verified skills
- Verify dashboard still shows old data
- Verify settings shows pending status

## Alternative: Simpler Approach

If the full versioning system is too complex right now, here's a simpler alternative:

### Simple Approach: Just Change Approval Status Logic

Instead of preserving old data, just prevent the update if data is verified:

```javascript
// In update functions, add this check:
if (cert.id) {
  const { data: existing } = await supabase
    .from('certificates')
    .select('approval_status')
    .eq('id', cert.id)
    .single();
  
  if (existing && (existing.approval_status === 'verified' || existing.approval_status === 'approved')) {
    // Don't allow editing verified data
    throw new Error('Cannot edit verified data. Please contact admin.');
  }
}
```

This prevents the problem but doesn't allow edits at all.

## Recommendation

### Option A: Full Versioning System (Recommended)
- **Pros:** Best user experience, allows edits, preserves verified data
- **Cons:** More complex, requires code changes
- **Time:** ~4 hours total
- **Risk:** Medium (need thorough testing)

### Option B: Block Edits to Verified Data (Quick Fix)
- **Pros:** Simple, prevents the problem
- **Cons:** Users can't edit verified data at all
- **Time:** ~30 minutes
- **Risk:** Low

### Option C: Do Nothing, Add Warning
- **Pros:** No code changes
- **Cons:** Problem persists
- **Time:** 5 minutes (just add a warning message)
- **Risk:** None

## My Recommendation

Start with **Option A (Full Versioning)** because:
1. Database migration is safe and easy
2. Code changes are well-documented
3. Provides the best user experience
4. Aligns with your original requirement
5. Can be done incrementally (one data type at a time)

## Need Help?

I can help you implement any of these options. Just let me know which approach you prefer!

## Files Created for You

1. ✅ `database/migrations/add_pending_edit_fields.sql` - Database migration
2. ✅ `RUN_PENDING_EDIT_MIGRATION.md` - Migration instructions
3. ✅ `src/utils/versioningHelper.js` - Helper functions
4. ✅ `VERSIONING_SYSTEM_IMPLEMENTATION.md` - Detailed implementation guide
5. ✅ `VERSIONING_QUICK_START.md` - This file

## Next Step

Would you like me to:
1. **Implement the full versioning system** (modify the 5 update functions)?
2. **Implement the simple blocking approach** (prevent edits to verified data)?
3. **Just run the database migration** and you'll handle the code?

Let me know and I'll proceed!

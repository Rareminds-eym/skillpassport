# Fix Import Error - Run This Now

## The Problem
The trigger is calling the function with wrong parameter types (integer instead of uuid).

## The Solution
Run **ONE** of these SQL files in Supabase SQL Editor:

### Option 1: Fix the Trigger (Recommended) ✅
**File**: `fix-trigger-with-correct-signature.sql`

This will:
- ✅ Fix the trigger to use correct parameters
- ✅ Keep AI embedding functionality working
- ✅ Allow imports to work

### Option 2: Just Disable Triggers (Quick Fix) ⚡
**File**: `ULTIMATE_SIMPLE_FIX.sql`

This will:
- ✅ Remove all embedding triggers
- ✅ Allow imports to work immediately
- ⚠️ Disable automatic AI embeddings (can re-enable later)

## Which Should I Use?

**Use Option 1** if you want everything to work (import + AI features)

**Use Option 2** if you just want to test import quickly

## After Running the Fix

1. Go to `http://localhost:3000/recruitment/requisition`
2. Click "Import"
3. Download template
4. Upload template
5. Import should work! ✅

## Files to Use

- ✅ **fix-trigger-with-correct-signature.sql** - Complete fix
- ✅ **ULTIMATE_SIMPLE_FIX.sql** - Quick disable
- ❌ **fix-embedding-trigger-opportunities.sql** - Don't use (has errors)
- ❌ **disable-embedding-trigger-opportunities.sql** - Too simple

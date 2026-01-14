-- ============================================================================
-- VERIFICATION SCRIPT FOR CURRICULUM APPROVAL SYSTEM
-- ============================================================================
-- This script checks if all components are properly set up
-- Run this in Supabase SQL Editor to verify your setup
-- ============================================================================

DO $
DECLARE
    v_result TEXT := '';
    v_error_count INT := 0;
    v_success_count INT := 0;
BEGIN
    RAISE NOTICE '🔍 Starting Curriculum Approval System Verification...';
    RAISE NOTICE '================================================================';
    RAISE NOTICE '';
    
    -- ========================================================================
    -- CHECK 1: Database Columns
    -- ========================================================================
    RAISE NOTICE '📋 CHECK 1: Verifying Database Columns...';
    
    -- Check pending_changes column
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'college_curriculums' 
        AND column_name = 'pending_changes'
        AND data_type = 'jsonb'
    ) THEN
        RAISE NOTICE '  ✅ pending_changes column exists (JSONB)';
        v_success_count := v_success_count + 1;
    ELSE
        RAISE NOTICE '  ❌ pending_changes column missing or wrong type';
        v_error_count := v_error_count + 1;
    END IF;
    
    -- Check change_history column
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'college_curriculums' 
        AND column_name = 'change_history'
        AND data_type = 'jsonb'
    ) THEN
        RAISE NOTICE '  ✅ change_history column exists (JSONB)';
        v_success_count := v_success_count + 1;
    ELSE
        RAISE NOTICE '  ❌ change_history column missing or wrong type';
        v_error_count := v_error_count + 1;
    END IF;
    
    -- Check has_pending_changes column
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'college_curriculums' 
        AND column_name = 'has_pending_changes'
        AND data_type = 'boolean'
    ) THEN
        RAISE NOTICE '  ✅ has_pending_changes column exists (BOOLEAN)';
        v_success_count := v_success_count + 1;
    ELSE
        RAISE NOTICE '  ❌ has_pending_changes column missing or wrong type';
        v_error_count := v_error_count + 1;
    END IF;
    
    RAISE NOTICE '';
    
    -- ========================================================================
    -- CHECK 2: Database Indexes
    -- ========================================================================
    RAISE NOTICE '📊 CHECK 2: Verifying Database Indexes...';
    
    -- Check has_pending_changes index
    IF EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'college_curriculums' 
        AND indexname = 'idx_curriculums_pending_changes'
    ) THEN
        RAISE NOTICE '  ✅ idx_curriculums_pending_changes index exists';
        v_success_count := v_success_count + 1;
    ELSE
        RAISE NOTICE '  ⚠️  idx_curriculums_pending_changes index missing (optional but recommended)';
    END IF;
    
    -- Check JSONB GIN index
    IF EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'college_curriculums' 
        AND indexname = 'idx_curriculums_pending_changes_jsonb'
    ) THEN
        RAISE NOTICE '  ✅ idx_curriculums_pending_changes_jsonb GIN index exists';
        v_success_count := v_success_count + 1;
    ELSE
        RAISE NOTICE '  ⚠️  idx_curriculums_pending_changes_jsonb GIN index missing (optional but recommended)';
    END IF;
    
    RAISE NOTICE '';
    
    -- ========================================================================
    -- CHECK 3: Database Functions
    -- ========================================================================
    RAISE NOTICE '⚙️  CHECK 3: Verifying Database Functions...';
    
    -- Check add_pending_change function
    IF EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'add_pending_change'
    ) THEN
        RAISE NOTICE '  ✅ add_pending_change() function exists';
        v_success_count := v_success_count + 1;
    ELSE
        RAISE NOTICE '  ❌ add_pending_change() function missing';
        v_error_count := v_error_count + 1;
    END IF;
    
    -- Check get_pending_changes function
    IF EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'get_pending_changes'
    ) THEN
        RAISE NOTICE '  ✅ get_pending_changes() function exists';
        v_success_count := v_success_count + 1;
    ELSE
        RAISE NOTICE '  ❌ get_pending_changes() function missing';
        v_error_count := v_error_count + 1;
    END IF;
    
    -- Check approve_pending_change function
    IF EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'approve_pending_change'
    ) THEN
        RAISE NOTICE '  ✅ approve_pending_change() function exists';
        v_success_count := v_success_count + 1;
    ELSE
        RAISE NOTICE '  ❌ approve_pending_change() function missing';
        v_error_count := v_error_count + 1;
    END IF;
    
    -- Check reject_pending_change function
    IF EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'reject_pending_change'
    ) THEN
        RAISE NOTICE '  ✅ reject_pending_change() function exists';
        v_success_count := v_success_count + 1;
    ELSE
        RAISE NOTICE '  ❌ reject_pending_change() function missing';
        v_error_count := v_error_count + 1;
    END IF;
    
    -- Check cancel_pending_change function
    IF EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'cancel_pending_change'
    ) THEN
        RAISE NOTICE '  ✅ cancel_pending_change() function exists';
        v_success_count := v_success_count + 1;
    ELSE
        RAISE NOTICE '  ❌ cancel_pending_change() function missing';
        v_error_count := v_error_count + 1;
    END IF;
    
    -- Check get_all_pending_changes_for_university function
    IF EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'get_all_pending_changes_for_university'
    ) THEN
        RAISE NOTICE '  ✅ get_all_pending_changes_for_university() function exists';
        v_success_count := v_success_count + 1;
    ELSE
        RAISE NOTICE '  ❌ get_all_pending_changes_for_university() function missing';
        v_error_count := v_error_count + 1;
    END IF;
    
    RAISE NOTICE '';
    
    -- ========================================================================
    -- CHECK 4: Function Permissions
    -- ========================================================================
    RAISE NOTICE '🔐 CHECK 4: Verifying Function Permissions...';
    
    IF EXISTS (
        SELECT 1 FROM information_schema.routine_privileges
        WHERE routine_name = 'add_pending_change'
        AND grantee = 'authenticated'
    ) THEN
        RAISE NOTICE '  ✅ add_pending_change() has authenticated role access';
        v_success_count := v_success_count + 1;
    ELSE
        RAISE NOTICE '  ⚠️  add_pending_change() may not have proper permissions';
    END IF;
    
    RAISE NOTICE '';
    
    -- ========================================================================
    -- CHECK 5: Sample Data Test
    -- ========================================================================
    RAISE NOTICE '🧪 CHECK 5: Testing with Sample Data...';
    
    -- Check if there are any curriculums
    IF EXISTS (SELECT 1 FROM college_curriculums LIMIT 1) THEN
        RAISE NOTICE '  ✅ college_curriculums table has data';
        v_success_count := v_success_count + 1;
        
        -- Check if any curriculum has pending changes
        IF EXISTS (SELECT 1 FROM college_curriculums WHERE has_pending_changes = TRUE LIMIT 1) THEN
            RAISE NOTICE '  ℹ️  Found curriculums with pending changes';
        ELSE
            RAISE NOTICE '  ℹ️  No curriculums with pending changes (this is normal)';
        END IF;
    ELSE
        RAISE NOTICE '  ⚠️  college_curriculums table is empty (no test data)';
    END IF;
    
    RAISE NOTICE '';
    
    -- ========================================================================
    -- SUMMARY
    -- ========================================================================
    RAISE NOTICE '================================================================';
    RAISE NOTICE '📊 VERIFICATION SUMMARY';
    RAISE NOTICE '================================================================';
    RAISE NOTICE '  ✅ Successful checks: %', v_success_count;
    RAISE NOTICE '  ❌ Failed checks: %', v_error_count;
    RAISE NOTICE '';
    
    IF v_error_count = 0 THEN
        RAISE NOTICE '🎉 ALL CRITICAL CHECKS PASSED!';
        RAISE NOTICE '';
        RAISE NOTICE '✨ Your Curriculum Approval System is ready to use!';
        RAISE NOTICE '';
        RAISE NOTICE '📝 Next Steps:';
        RAISE NOTICE '  1. Verify frontend service exists: src/services/curriculumChangeRequestService.ts';
        RAISE NOTICE '  2. Check UI page: src/pages/admin/universityAdmin/SyllabusApproval.tsx';
        RAISE NOTICE '  3. Test the workflow by creating a change request';
        RAISE NOTICE '';
    ELSE
        RAISE NOTICE '⚠️  SOME CHECKS FAILED!';
        RAISE NOTICE '';
        RAISE NOTICE '🔧 Required Actions:';
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'college_curriculums' AND column_name = 'pending_changes') THEN
            RAISE NOTICE '  1. Run: add-pending-changes-columns.sql';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'add_pending_change') THEN
            RAISE N
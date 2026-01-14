-- ============================================================================
-- DEPLOY APPROVAL TO TABLES - QUICK DEPLOYMENT SCRIPT
-- ============================================================================
-- Purpose: Deploy the approval workflow that applies changes to actual tables
-- Run this after: curriculum_approval_workflow_complete_implementation.sql
-- ============================================================================

\echo '🚀 Starting deployment of approval-to-tables functionality...'
\echo ''

-- Step 1: Run the main implementation
\echo '📋 Step 1: Applying main implementation...'
\i apply-approved-changes-to-tables.sql
\echo '✅ Main implementation applied'
\echo ''

-- Step 2: Verify tables exist
\echo '📋 Step 2: Verifying tables...'
DO $
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'college_curriculum_units') THEN
        RAISE EXCEPTION '❌ college_curriculum_units table not found';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'college_curriculum_outcomes') THEN
        RAISE EXCEPTION '❌ college_curriculum_outcomes table not found';
    END IF;
    
    RAISE NOTICE '✅ All tables verified';
END $;
\echo ''

-- Step 3: Verify functions exist
\echo '📋 Step 3: Verifying functions...'
DO $
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'apply_change_to_tables') THEN
        RAISE EXCEPTION '❌ apply_change_to_tables function not found';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'approve_pending_change') THEN
        RAISE EXCEPTION '❌ approve_pending_change function not found';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'migrate_curriculum_jsonb_to_tables') THEN
        RAISE EXCEPTION '❌ migrate_curriculum_jsonb_to_tables function not found';
    END IF;
    
    RAISE NOTICE '✅ All functions verified';
END $;
\echo ''

-- Step 4: Show summary
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo '✅ DEPLOYMENT SUCCESSFUL!'
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo ''
\echo '📊 What was deployed:'
\echo '   ✓ Updated approve_pending_change() to apply changes to tables'
\echo '   ✓ Created apply_change_to_tables() helper function'
\echo '   ✓ Created migrate_curriculum_jsonb_to_tables() migration function'
\echo '   ✓ Added created_by and updated_by columns'
\echo '   ✓ Added indexes and triggers'
\echo ''
\echo '🎯 Next Steps:'
\echo '   1. Migrate existing JSONB data (optional):'
\echo '      SELECT * FROM migrate_curriculum_jsonb_to_tables();'
\echo ''
\echo '   2. Test the approval workflow:'
\echo '      - College admin creates/edits curriculum'
\echo '      - College admin submits for approval'
\echo '      - University admin approves'
\echo '      - Check that data appears in college_curriculum_units and college_curriculum_outcomes'
\echo ''
\echo '   3. Verify data in tables:'
\echo '      SELECT * FROM college_curriculum_units WHERE curriculum_id = ''your-curriculum-id'';'
\echo '      SELECT * FROM college_curriculum_outcomes WHERE curriculum_id = ''your-curriculum-id'';'
\echo ''
\echo '📚 Documentation:'
\echo '   - See CURRICULUM_APPROVAL_DATA_FLOW.md for complete data flow'
\echo '   - See apply-approved-changes-to-tables.sql for implementation details'
\echo ''
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'

-- ============================================================================
-- TEST APPROVAL TO TABLES WORKFLOW
-- ============================================================================
-- Purpose: Test that approved changes are applied to actual tables
-- Run this after: deploy-approval-to-tables.sql
-- ============================================================================

\echo '🧪 Testing Approval to Tables Workflow...'
\echo ''

-- ============================================================================
-- TEST 1: Add Pending Change (Unit Add)
-- ============================================================================
\echo '📋 TEST 1: Adding pending change for new unit...'

DO $
DECLARE
  v_curriculum_id UUID;
  v_test_unit_id UUID := gen_random_uuid();
  v_change_result JSONB;
BEGIN
  -- Get a test curriculum (or create one)
  SELECT id INTO v_curriculum_id 
  FROM college_curriculums 
  WHERE status = 'published' 
  LIMIT 1;
  
  IF v_curriculum_id IS NULL THEN
    RAISE NOTICE '⚠️  No published curriculum found. Skipping test.';
    RETURN;
  END IF;
  
  RAISE NOTICE 'Using curriculum: %', v_curriculum_id;
  
  -- Add a pending change for a new unit
  SELECT add_pending_change(
    v_curriculum_id,
    'unit_add',
    v_test_unit_id,
    jsonb_build_object(
      'name', 'Test Unit - Advanced Algorithms',
      'code', 'TEST-01',
      'description', 'This is a test unit for approval workflow',
      'order', 99,
      'estimatedDuration', 10,
      'durationUnit', 'hours',
      'credits', 3.0
    ),
    'Testing approval workflow'
  ) INTO v_change_result;
  
  RAISE NOTICE '✅ Pending change added: %', v_change_result->>'id';
  RAISE NOTICE '   Change ID: %', v_change_result->>'id';
  RAISE NOTICE '   Entity ID: %', v_test_unit_id;
END $;

\echo ''

-- ============================================================================
-- TEST 2: View Pending Changes
-- ============================================================================
\echo '📋 TEST 2: Viewing pending changes...'

SELECT 
  change_id,
  change_type,
  entity_id,
  requester_name,
  request_message,
  change_status
FROM get_pending_changes(
  (SELECT id FROM college_curriculums WHERE has_pending_changes = TRUE LIMIT 1)
)
LIMIT 5;

\echo ''

-- ============================================================================
-- TEST 3: Approve Change (This should apply to tables)
-- ============================================================================
\echo '📋 TEST 3: Approving change (should apply to tables)...'
\echo '⚠️  Note: This requires university_admin role. Run manually if needed.'
\echo ''

-- Uncomment and run this manually as university admin:
/*
DO $
DECLARE
  v_curriculum_id UUID;
  v_change_id UUID;
BEGIN
  -- Get curriculum with pending changes
  SELECT id INTO v_curriculum_id 
  FROM college_curriculums 
  WHERE has_pending_changes = TRUE 
  LIMIT 1;
  
  IF v_curriculum_id IS NULL THEN
    RAISE NOTICE '⚠️  No curriculum with pending changes found.';
    RETURN;
  END IF;
  
  -- Get first pending change
  SELECT change_id INTO v_change_id
  FROM get_pending_changes(v_curriculum_id)
  LIMIT 1;
  
  IF v_change_id IS NULL THEN
    RAISE NOTICE '⚠️  No pending changes found.';
    RETURN;
  END IF;
  
  RAISE NOTICE 'Approving change: %', v_change_id;
  
  -- Approve the change
  PERFORM approve_pending_change(
    v_curriculum_id,
    v_change_id,
    'Approved for testing'
  );
  
  RAISE NOTICE '✅ Change approved and applied to tables';
END $;
*/

\echo ''

-- ============================================================================
-- TEST 4: Verify Data in Tables
-- ============================================================================
\echo '📋 TEST 4: Verifying data in normalized tables...'
\echo ''

\echo 'Units in college_curriculum_units:'
SELECT 
  id,
  curriculum_id,
  name,
  code,
  order_index,
  credits,
  created_at
FROM college_curriculum_units
ORDER BY created_at DESC
LIMIT 5;

\echo ''
\echo 'Outcomes in college_curriculum_outcomes:'
SELECT 
  id,
  curriculum_id,
  unit_id,
  outcome_text,
  bloom_level,
  created_at
FROM college_curriculum_outcomes
ORDER BY created_at DESC
LIMIT 5;

\echo ''

-- ============================================================================
-- TEST 5: Check Change History
-- ============================================================================
\echo '📋 TEST 5: Checking change history...'

SELECT 
  id,
  academic_year,
  status,
  jsonb_array_length(COALESCE(change_history, '[]'::jsonb)) as history_count,
  jsonb_array_length(COALESCE(pending_changes, '[]'::jsonb)) as pending_count,
  has_pending_changes
FROM college_curriculums
WHERE jsonb_array_length(COALESCE(change_history, '[]'::jsonb)) > 0
ORDER BY updated_at DESC
LIMIT 5;

\echo ''

-- ============================================================================
-- SUMMARY
-- ============================================================================
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo '📊 TEST SUMMARY'
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo ''
\echo '✅ Tests completed. Review the output above.'
\echo ''
\echo '🎯 Manual Testing Steps:'
\echo '   1. As college_admin:'
\echo '      - Create/edit curriculum in UI'
\echo '      - Submit for approval'
\echo ''
\echo '   2. As university_admin:'
\echo '      - View pending approvals in Syllabus Approval page'
\echo '      - Approve a change'
\echo ''
\echo '   3. Verify in database:'
\echo '      SELECT * FROM college_curriculum_units WHERE curriculum_id = ''your-id'';'
\echo '      SELECT * FROM college_curriculum_outcomes WHERE curriculum_id = ''your-id'';'
\echo ''
\echo '📚 Expected Behavior:'
\echo '   - When university admin approves a change:'
\echo '     ✓ Change is removed from pending_changes JSONB'
\echo '     ✓ Change is added to change_history JSONB'
\echo '     ✓ Change is APPLIED to college_curriculum_units or college_curriculum_outcomes'
\echo '     ✓ has_pending_changes flag is updated'
\echo ''
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'

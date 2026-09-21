-- ============================================================================
-- Video Portfolio Test Data
-- ============================================================================
-- Purpose: Sample data to verify video_portfolio schema and constraints
-- Usage: Run this AFTER 20260918000000_create_video_portfolio.sql
-- ============================================================================

-- ============================================================================
-- Test Data Setup
-- ============================================================================

-- NOTE: This assumes you have existing test learners in your database
-- Replace the learner_id values below with actual learner UUIDs from your system

-- You can find existing learner IDs with:
-- SELECT id, name, email FROM learners LIMIT 5;

DO $$
DECLARE
  test_learner_id uuid;
  test_user_id uuid;
BEGIN
  -- Try to find an existing learner (replace with your actual test learner if needed)
  SELECT l.id, l.user_id INTO test_learner_id, test_user_id
  FROM public.learners l
  LIMIT 1;
  
  -- If no learner exists, we'll just log a message
  IF test_learner_id IS NULL THEN
    RAISE NOTICE 'No learners found in database. Please create a test learner first or replace learner_id in this script.';
    RETURN;
  END IF;
  
  RAISE NOTICE 'Using test learner ID: %', test_learner_id;
  
  -- ============================================================================
  -- Insert Test Video Entries
  -- ============================================================================
  
  -- Test 1: Complete video entry (VERIFIED)
  INSERT INTO public.video_portfolio (
    learner_id,
    title,
    description,
    tags,
    video_url,
    thumbnail_color,
    duration,
    file_size_bytes,
    mime_type,
    trim_start,
    trim_end,
    status,
    approval_status,
    show_on_public,
    reviewed_by,
    reviewed_at
  ) VALUES (
    test_learner_id,
    'Panel Wiring Walkthrough',
    'Wiring a 12-circuit residential panel from rough-in to final inspection, narrated step by step.',
    ARRAY['Residential wiring', 'Panel install', 'Code compliance'],
    'video_portfolio/test_user_12345678/video_abc123_1726675200000.mp4',
    '#2D3E5F',
    '4:02',
    15728640, -- 15 MB
    'video/mp4',
    0,
    100,
    'VERIFIED',
    'approved',
    true,
    test_user_id,
    now() - interval '2 days'
  );
  
  -- Test 2: Video with minimal metadata (DRAFT)
  INSERT INTO public.video_portfolio (
    learner_id,
    title,
    video_url,
    thumbnail_color,
    status,
    approval_status,
    show_on_public
  ) VALUES (
    test_learner_id,
    'Conduit Bending Practice',
    'video_portfolio/test_user_12345678/video_def456_1726675300000.mp4',
    '#4A5568',
    'DRAFT',
    'pending',
    false
  );
  
  -- Test 3: Video awaiting approval (PROCESSING)
  INSERT INTO public.video_portfolio (
    learner_id,
    title,
    description,
    tags,
    video_url,
    thumbnail_color,
    duration,
    file_size_bytes,
    mime_type,
    status,
    approval_status,
    show_on_public
  ) VALUES (
    test_learner_id,
    'Troubleshooting Dead Circuit',
    'Step-by-step process for diagnosing and fixing a dead circuit in residential setting.',
    ARRAY['Diagnostics', 'Safety', 'Troubleshooting'],
    'video_portfolio/test_user_12345678/video_ghi789_1726675400000.mp4',
    '#374151',
    '6:47',
    28311552, -- 27 MB
    'video/mp4',
    0,
    100,
    'PROCESSING',
    'pending',
    false
  );
  
  -- Test 4: Rejected video
  INSERT INTO public.video_portfolio (
    learner_id,
    title,
    description,
    video_url,
    thumbnail_color,
    status,
    approval_status,
    show_on_public,
    reviewed_by,
    reviewed_at,
    rejection_reason
  ) VALUES (
    test_learner_id,
    'Test Video - Low Quality',
    'This video was rejected for quality issues.',
    'video_portfolio/test_user_12345678/video_jkl012_1726675500000.mp4',
    '#6B7280',
    'REJECTED',
    'rejected',
    false,
    test_user_id,
    now() - interval '1 day',
    'Video quality too low, please re-record with better lighting'
  );
  
  -- Test 5: Video with trim markers
  INSERT INTO public.video_portfolio (
    learner_id,
    title,
    description,
    tags,
    video_url,
    thumbnail_color,
    duration,
    trim_start,
    trim_end,
    status,
    approval_status,
    show_on_public
  ) VALUES (
    test_learner_id,
    'Grounding Rod Installation',
    'Installing proper grounding for electrical service.',
    ARRAY['Grounding', 'Code compliance'],
    'video_portfolio/test_user_12345678/video_mno345_1726675600000.mp4',
    '#1F2937',
    '5:18',
    10,  -- Trim 10% from start
    95,  -- Trim 5% from end
    'DRAFT',
    'pending',
    false
  );
  
  RAISE NOTICE 'Successfully inserted 5 test video entries';
  
END $$;

-- ============================================================================
-- Verification Queries
-- ============================================================================

-- Check all test videos were created
-- Note: These queries will only return results if test data was inserted
-- (requires existing learner in database)

-- Uncomment to view test data:
-- SELECT 
--   id,
--   title,
--   status,
--   approval_status,
--   show_on_public,
--   array_length(tags, 1) as tag_count,
--   created_at
-- FROM public.video_portfolio
-- ORDER BY created_at DESC
-- LIMIT 10;

-- Count videos by status:
-- SELECT status, COUNT(*) as count
-- FROM public.video_portfolio
-- GROUP BY status;

-- Count videos by approval status:
-- SELECT approval_status, COUNT(*) as count
-- FROM public.video_portfolio
-- GROUP BY approval_status;

-- Test the helper functions (commented out - functions not implemented yet)
-- DO $$
-- DECLARE
--   test_learner_id uuid;
--   result_record record;
-- BEGIN
--   SELECT id INTO test_learner_id FROM public.learners LIMIT 1;
--   
--   IF test_learner_id IS NOT NULL THEN
--     RAISE NOTICE 'Testing get_learner_video_portfolio function...';
--     
--     FOR result_record IN 
--       SELECT * FROM get_learner_video_portfolio(test_learner_id)
--     LOOP
--       RAISE NOTICE 'Video: %, Status: %, Total Count: %', 
--         result_record.title, 
--         result_record.status,
--         result_record.total_count;
--     END LOOP;
--   END IF;
-- END $$;

-- SELECT * FROM get_pending_video_portfolio(10);

-- ============================================================================
-- Constraint Tests
-- ============================================================================

-- These should all FAIL with constraint violations (commented out for safety)

-- Test 1: Empty title (should fail - CONSTRAINT video_title_not_empty)
-- INSERT INTO public.video_portfolio (learner_id, title, video_url)
-- SELECT id, '', 'test.mp4' FROM learners LIMIT 1;

-- Test 2: Empty video_url (should fail - CONSTRAINT video_url_not_empty)
-- INSERT INTO public.video_portfolio (learner_id, title, video_url)
-- SELECT id, 'Test', '' FROM learners LIMIT 1;

-- Test 3: More than 5 tags (should fail - CONSTRAINT max_tags_limit)
-- INSERT INTO public.video_portfolio (learner_id, title, video_url, tags)
-- SELECT id, 'Test', 'test.mp4', ARRAY['tag1', 'tag2', 'tag3', 'tag4', 'tag5', 'tag6']
-- FROM learners LIMIT 1;

-- Test 4: Invalid trim range (should fail - CONSTRAINT trim_range_valid)
-- INSERT INTO public.video_portfolio (learner_id, title, video_url, trim_start, trim_end)
-- SELECT id, 'Test', 'test.mp4', 80, 20 FROM learners LIMIT 1;

-- Test 5: Invalid status (should fail - CHECK constraint)
-- INSERT INTO public.video_portfolio (learner_id, title, video_url, status)
-- SELECT id, 'Test', 'test.mp4', 'INVALID_STATUS' FROM learners LIMIT 1;

-- Test 6: Invalid approval_status (should fail - CHECK constraint)
-- INSERT INTO public.video_portfolio (learner_id, title, video_url, approval_status)
-- SELECT id, 'Test', 'test.mp4', 'invalid' FROM learners LIMIT 1;

-- ============================================================================
-- Test Trigger
-- ============================================================================

-- Verify updated_at trigger works
DO $$
DECLARE
  test_video_id uuid;
  old_updated_at timestamp;
  new_updated_at timestamp;
BEGIN
  -- Get a test video
  SELECT id, updated_at INTO test_video_id, old_updated_at
  FROM public.video_portfolio
  LIMIT 1;
  
  IF test_video_id IS NOT NULL THEN
    RAISE NOTICE 'Testing updated_at trigger...';
    RAISE NOTICE 'Old updated_at: %', old_updated_at;
    
    -- Wait a moment
    PERFORM pg_sleep(1);
    
    -- Update the video
    UPDATE public.video_portfolio
    SET title = title || ' (Updated)'
    WHERE id = test_video_id;
    
    -- Get new timestamp
    SELECT updated_at INTO new_updated_at
    FROM public.video_portfolio
    WHERE id = test_video_id;
    
    RAISE NOTICE 'New updated_at: %', new_updated_at;
    
    IF new_updated_at > old_updated_at THEN
      RAISE NOTICE '✓ Trigger working correctly - updated_at was updated';
    ELSE
      RAISE WARNING '✗ Trigger failed - updated_at was not updated';
    END IF;
  END IF;
END $$;

-- ============================================================================
-- Cleanup (Optional)
-- ============================================================================

-- Uncomment to remove all test data
-- DELETE FROM public.video_portfolio WHERE video_url LIKE '%test_user_%';

-- ============================================================================
-- Summary
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Video Portfolio Test Data Created';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Run the verification queries above to check the data';
  RAISE NOTICE 'Run: SELECT * FROM video_portfolio;';
  RAISE NOTICE '============================================';
  
  -- Display summary counts
  RAISE NOTICE 'Total Videos: %', (SELECT COUNT(*) FROM public.video_portfolio);
  RAISE NOTICE 'Public Videos: %', (SELECT COUNT(*) FROM public.video_portfolio WHERE show_on_public = true);
  RAISE NOTICE 'Pending Approval: %', (SELECT COUNT(*) FROM public.video_portfolio WHERE approval_status = 'pending');
  RAISE NOTICE 'Verified Videos: %', (SELECT COUNT(*) FROM public.video_portfolio WHERE status = 'VERIFIED');
END $$;

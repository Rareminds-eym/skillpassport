-- ═══════════════════════════════════════════════════════════════════════════════
-- UPDATE ASSESSMENT RESULT FROM B.TECH TO M.TECH
-- ═══════════════════════════════════════════════════════════════════════════════
-- This updates your existing assessment result to show M.Tech instead of B.Tech
-- ═══════════════════════════════════════════════════════════════════════════════

-- Step 1: Check your current assessment results
SELECT 
    id,
    student_id,
    stream_id,
    grade_level,
    recommended_stream,
    created_at
FROM personal_assessment_results
WHERE student_id = 'afaa9e81-1552-4c1d-a76d-551134295567'
ORDER BY created_at DESC
LIMIT 5;

-- Step 2: Update the stream_id in assessment results
-- This changes BTECH_CSE to MTECH_CSE
UPDATE personal_assessment_results
SET 
    stream_id = 'mtech_cse',
    updated_at = NOW()
WHERE student_id = 'afaa9e81-1552-4c1d-a76d-551134295567'
  AND stream_id = 'btech_cse';

-- Step 3: Update the stream_id in assessment attempts
UPDATE personal_assessment_attempts
SET 
    stream_id = 'mtech_cse',
    updated_at = NOW()
WHERE student_id = 'afaa9e81-1552-4c1d-a76d-551134295567'
  AND stream_id = 'btech_cse';

-- Step 4: Verify the changes
SELECT 
    id,
    student_id,
    stream_id,
    grade_level,
    recommended_stream,
    created_at,
    updated_at
FROM personal_assessment_results
WHERE student_id = 'afaa9e81-1552-4c1d-a76d-551134295567'
ORDER BY created_at DESC
LIMIT 5;

-- Step 5: Check if the report display needs updating
-- The report might be reading from a different field
-- Let's check what fields are available
SELECT 
    id,
    student_id,
    stream_id,
    grade_level,
    recommended_stream,
    profile_snapshot,
    created_at
FROM personal_assessment_results
WHERE student_id = 'afaa9e81-1552-4c1d-a76d-551134295567'
ORDER BY created_at DESC
LIMIT 1;

-- If the report shows data from profile_snapshot JSONB field, we need to update that too
-- Check what's in profile_snapshot
SELECT 
    profile_snapshot
FROM personal_assessment_results
WHERE student_id = 'afaa9e81-1552-4c1d-a76d-551134295567'
ORDER BY created_at DESC
LIMIT 1;

-- Update profile_snapshot if it contains the stream info
-- This updates the 'stream' field inside the JSONB column
UPDATE personal_assessment_results
SET 
    profile_snapshot = jsonb_set(
        profile_snapshot,
        '{stream}',
        '"mtech_cse"'::jsonb
    ),
    updated_at = NOW()
WHERE student_id = 'afaa9e81-1552-4c1d-a76d-551134295567'
  AND profile_snapshot->>'stream' = 'btech_cse';

-- Also update 'program' field if it exists in profile_snapshot
UPDATE personal_assessment_results
SET 
    profile_snapshot = jsonb_set(
        profile_snapshot,
        '{program}',
        '"Master of Technology in Computer Science"'::jsonb
    ),
    updated_at = NOW()
WHERE student_id = 'afaa9e81-1552-4c1d-a76d-551134295567';

-- Final verification
SELECT 
    id,
    stream_id,
    profile_snapshot->>'stream' as snapshot_stream,
    profile_snapshot->>'program' as snapshot_program,
    updated_at
FROM personal_assessment_results
WHERE student_id = 'afaa9e81-1552-4c1d-a76d-551134295567'
ORDER BY created_at DESC
LIMIT 1;

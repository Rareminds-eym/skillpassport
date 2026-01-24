-- ============================================================================
-- FIX: Pipeline ID Lookup After UUID Migration
-- This helps the frontend transition from integer IDs to UUID IDs
-- ============================================================================

-- Option 1: Check if we need to create a lookup function
-- ============================================================================

-- Create a function that can find pipeline_candidates by either UUID or old integer ID
CREATE OR REPLACE FUNCTION get_pipeline_candidate_by_id(search_id text)
RETURNS SETOF pipeline_candidates
LANGUAGE plpgsql
AS $$
BEGIN
  -- Try to find by UUID id first
  IF search_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    RETURN QUERY
    SELECT * FROM pipeline_candidates WHERE id = search_id::uuid;
  -- If not UUID format, try to find by old integer id
  ELSIF search_id ~ '^[0-9]+$' THEN
    RETURN QUERY
    SELECT * FROM pipeline_candidates WHERE id_old::text = search_id;
  END IF;
END;
$$;

-- Test the function
SELECT 
  '🧪 Testing lookup function:' as test,
  id,
  id_old,
  candidate_name
FROM get_pipeline_candidate_by_id('1')
LIMIT 1;


-- Option 2: Create a view that exposes both id types
-- ============================================================================

CREATE OR REPLACE VIEW pipeline_candidates_with_legacy_id AS
SELECT 
  COALESCE(id_old::text, id::text) as legacy_id,
  id as uuid_id,
  *
FROM pipeline_candidates;

COMMENT ON VIEW pipeline_candidates_with_legacy_id IS 'Pipeline candidates with both UUID and legacy integer IDs for transition period';


-- Option 3: Update the detailed view to include id_old
-- ============================================================================

DROP VIEW IF EXISTS pipeline_candidates_detailed CASCADE;

CREATE OR REPLACE VIEW pipeline_candidates_detailed AS
SELECT 
  pc.id,
  pc.id_old,
  pc.opportunity_id,
  pc.opportunity_id_old,
  pc.student_id,
  pc.candidate_name,
  pc.candidate_email,
  pc.candidate_phone,
  pc.stage,
  pc.previous_stage,
  pc.status,
  pc.source,
  pc.added_at,
  pc.added_by,
  pc.updated_at,
  pc.stage_changed_at,
  pc.stage_changed_by,
  pc.next_action,
  pc.next_action_date,
  pc.next_action_notes,
  pc.recruiter_rating,
  pc.recruiter_notes,
  pc.assigned_to,
  pc.rejection_reason,
  pc.rejection_date,
  s.name as student_name,
  s.email as student_email,
  s.contact_number as student_phone,
  s.branch_field as department,
  s.university,
  s.cgpa,
  s.employability_score,
  s.verified,
  o.job_title,
  o.location as job_location,
  o.status as opportunity_status,
  o.company_name
FROM pipeline_candidates pc
LEFT JOIN students s ON pc.student_id = s.user_id
LEFT JOIN opportunities o ON pc.opportunity_id = o.id
WHERE pc.status = 'active';

COMMENT ON VIEW pipeline_candidates_detailed IS 'Pipeline candidates with full details - includes both UUID and legacy IDs';


-- Verification
-- ============================================================================

SELECT '✅ Lookup helpers created!' as status;

-- Show that we can now query by old ID
SELECT 
  '📝 Sample: Query by old integer ID:' as example,
  id,
  id_old,
  candidate_name
FROM pipeline_candidates
WHERE id_old = 1
LIMIT 1;

-- Show that we can query by new UUID
SELECT 
  '📝 Sample: Query by UUID:' as example,
  id,
  id_old,
  candidate_name
FROM pipeline_candidates
WHERE id IS NOT NULL
LIMIT 1;

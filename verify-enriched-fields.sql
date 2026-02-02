-- ============================================================================
-- Verification Script for Enriched PDF Fields
-- ============================================================================
-- Run this script to verify the enriched fields are working correctly
-- ============================================================================

-- 1. Check if columns exist
SELECT 
    '1. Column Existence Check' as check_name,
    column_name,
    data_type,
    is_nullable,
    CASE 
        WHEN column_name IN ('degree_programs', 'skill_gap_enriched', 'roadmap_enriched', 'course_recommendations_enriched')
        THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END as status
FROM information_schema.columns
WHERE table_name = 'personal_assessment_results'
AND column_name IN (
    'degree_programs',
    'skill_gap_enriched',
    'roadmap_enriched',
    'course_recommendations_enriched'
)
ORDER BY column_name;

-- 2. Check if indexes exist
SELECT 
    '2. Index Existence Check' as check_name,
    indexname,
    indexdef,
    '✅ EXISTS' as status
FROM pg_indexes
WHERE tablename = 'personal_assessment_results'
AND indexname LIKE '%enriched%' OR indexname LIKE '%degree_programs%'
ORDER BY indexname;

-- 3. Check data population status
SELECT 
    '3. Data Population Status' as check_name,
    COUNT(*) as total_results,
    COUNT(degree_programs) as has_degree_programs,
    COUNT(skill_gap_enriched) as has_skill_gap,
    COUNT(roadmap_enriched) as has_roadmap,
    COUNT(course_recommendations_enriched) as has_courses,
    ROUND(COUNT(degree_programs)::numeric / COUNT(*)::numeric * 100, 2) as degree_programs_pct,
    ROUND(COUNT(skill_gap_enriched)::numeric / COUNT(*)::numeric * 100, 2) as skill_gap_pct,
    ROUND(COUNT(roadmap_enriched)::numeric / COUNT(*)::numeric * 100, 2) as roadmap_pct,
    ROUND(COUNT(course_recommendations_enriched)::numeric / COUNT(*)::numeric * 100, 2) as courses_pct
FROM personal_assessment_results;

-- 4. Sample enriched data (latest result)
SELECT 
    '4. Sample Data Check' as check_name,
    id,
    student_id,
    grade_level,
    created_at,
    CASE WHEN degree_programs IS NOT NULL THEN '✅' ELSE '❌' END as has_degree_programs,
    CASE WHEN skill_gap_enriched IS NOT NULL THEN '✅' ELSE '❌' END as has_skill_gap,
    CASE WHEN roadmap_enriched IS NOT NULL THEN '✅' ELSE '❌' END as has_roadmap,
    CASE WHEN course_recommendations_enriched IS NOT NULL THEN '✅' ELSE '❌' END as has_courses,
    jsonb_array_length(degree_programs) as num_degree_programs,
    jsonb_array_length(skill_gap_enriched->'gaps') as num_skill_gaps,
    jsonb_array_length(roadmap_enriched->'steps') as num_roadmap_steps,
    jsonb_array_length(course_recommendations_enriched) as num_courses
FROM personal_assessment_results
ORDER BY created_at DESC
LIMIT 5;

-- 5. Check degree programs structure
SELECT 
    '5. Degree Programs Structure Check' as check_name,
    id,
    jsonb_array_length(degree_programs) as num_programs,
    degree_programs->0->>'programName' as first_program_name,
    degree_programs->0->>'matchScore' as first_program_match_score,
    jsonb_array_length(degree_programs->0->'topColleges') as num_colleges,
    jsonb_array_length(degree_programs->0->'careerPaths') as num_career_paths,
    jsonb_array_length(degree_programs->0->'skills') as num_skills
FROM personal_assessment_results
WHERE degree_programs IS NOT NULL
ORDER BY created_at DESC
LIMIT 3;

-- 6. Check skill gap enriched structure
SELECT 
    '6. Skill Gap Enriched Structure Check' as check_name,
    id,
    jsonb_array_length(skill_gap_enriched->'gaps') as num_gaps,
    skill_gap_enriched->'gaps'->0->>'skill' as first_skill,
    skill_gap_enriched->'gaps'->0->>'importance' as first_skill_importance,
    jsonb_array_length(skill_gap_enriched->'gaps'->0->'resources') as num_resources
FROM personal_assessment_results
WHERE skill_gap_enriched IS NOT NULL
ORDER BY created_at DESC
LIMIT 3;

-- 7. Check roadmap enriched structure
SELECT 
    '7. Roadmap Enriched Structure Check' as check_name,
    id,
    jsonb_array_length(roadmap_enriched->'steps') as num_steps,
    roadmap_enriched->'steps'->0->>'title' as first_step_title,
    roadmap_enriched->'steps'->0->>'timeline' as first_step_timeline,
    roadmap_enriched->'steps'->0->>'priority' as first_step_priority
FROM personal_assessment_results
WHERE roadmap_enriched IS NOT NULL
ORDER BY created_at DESC
LIMIT 3;

-- 8. Check course recommendations enriched structure
SELECT 
    '8. Course Recommendations Structure Check' as check_name,
    id,
    jsonb_array_length(course_recommendations_enriched) as num_courses,
    course_recommendations_enriched->0->>'courseName' as first_course_name,
    course_recommendations_enriched->0->>'provider' as first_course_provider,
    course_recommendations_enriched->0->>'level' as first_course_level,
    course_recommendations_enriched->0->>'rating' as first_course_rating
FROM personal_assessment_results
WHERE course_recommendations_enriched IS NOT NULL
ORDER BY created_at DESC
LIMIT 3;

-- 9. Results needing enrichment
SELECT 
    '9. Results Needing Enrichment' as check_name,
    COUNT(*) as total_needing_enrichment,
    COUNT(CASE WHEN degree_programs IS NULL THEN 1 END) as missing_degree_programs,
    COUNT(CASE WHEN skill_gap_enriched IS NULL THEN 1 END) as missing_skill_gap,
    COUNT(CASE WHEN roadmap_enriched IS NULL THEN 1 END) as missing_roadmap,
    COUNT(CASE WHEN course_recommendations_enriched IS NULL THEN 1 END) as missing_courses
FROM personal_assessment_results
WHERE degree_programs IS NULL 
   OR skill_gap_enriched IS NULL 
   OR roadmap_enriched IS NULL 
   OR course_recommendations_enriched IS NULL;

-- 10. Storage usage
SELECT 
    '10. Storage Usage Check' as check_name,
    pg_size_pretty(pg_total_relation_size('personal_assessment_results')) as total_table_size,
    pg_size_pretty(pg_relation_size('personal_assessment_results')) as table_data_size,
    pg_size_pretty(pg_indexes_size('personal_assessment_results')) as indexes_size;

-- ============================================================================
-- Summary Report
-- ============================================================================
SELECT 
    '=== ENRICHED FIELDS VERIFICATION SUMMARY ===' as summary,
    '' as blank_line;

SELECT 
    'Total Results: ' || COUNT(*) as metric
FROM personal_assessment_results
UNION ALL
SELECT 
    'With Degree Programs: ' || COUNT(degree_programs) || ' (' || 
    ROUND(COUNT(degree_programs)::numeric / NULLIF(COUNT(*), 0)::numeric * 100, 1) || '%)'
FROM personal_assessment_results
UNION ALL
SELECT 
    'With Skill Gap Enriched: ' || COUNT(skill_gap_enriched) || ' (' || 
    ROUND(COUNT(skill_gap_enriched)::numeric / NULLIF(COUNT(*), 0)::numeric * 100, 1) || '%)'
FROM personal_assessment_results
UNION ALL
SELECT 
    'With Roadmap Enriched: ' || COUNT(roadmap_enriched) || ' (' || 
    ROUND(COUNT(roadmap_enriched)::numeric / NULLIF(COUNT(*), 0)::numeric * 100, 1) || '%)'
FROM personal_assessment_results
UNION ALL
SELECT 
    'With Course Recommendations: ' || COUNT(course_recommendations_enriched) || ' (' || 
    ROUND(COUNT(course_recommendations_enriched)::numeric / NULLIF(COUNT(*), 0)::numeric * 100, 1) || '%)'
FROM personal_assessment_results;

-- ============================================================================
-- Action Items
-- ============================================================================
DO $$
DECLARE
    missing_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO missing_count
    FROM personal_assessment_results
    WHERE degree_programs IS NULL;
    
    IF missing_count > 0 THEN
        RAISE NOTICE '';
        RAISE NOTICE '⚠️  ACTION REQUIRED:';
        RAISE NOTICE '   % results are missing enriched data', missing_count;
        RAISE NOTICE '   Run: node populate-enriched-pdf-fields.js populate';
        RAISE NOTICE '';
    ELSE
        RAISE NOTICE '';
        RAISE NOTICE '✅ All results have enriched data!';
        RAISE NOTICE '   Your PDF generation is ready to use.';
        RAISE NOTICE '';
    END IF;
END $$;

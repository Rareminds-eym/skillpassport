-- ═══════════════════════════════════════════════════════════════════════════════
-- ASSESSMENT ACCURACY VERIFICATION QUERIES
-- ═══════════════════════════════════════════════════════════════════════════════

-- 1. Check recent assessment results with RIASEC breakdown
SELECT 
    id,
    student_id,
    grade_level,
    riasec_scores,
    recommended_stream,
    confidence,
    created_at
FROM personal_assessment_results 
WHERE grade_level = 'after10'
ORDER BY created_at DESC 
LIMIT 10;

-- 2. Verify RIASEC scores match recommendations
SELECT 
    recommended_stream,
    riasec_scores,
    confidence,
    CASE 
        -- Science streams should have high I or R
        WHEN recommended_stream LIKE '%PCM%' OR recommended_stream LIKE '%PCB%' THEN
            CASE 
                WHEN (riasec_scores->>'I')::int >= 5 OR (riasec_scores->>'R')::int >= 5 
                THEN '✅ Valid'
                ELSE '❌ Mismatch'
            END
        -- Commerce should have high E or C
        WHEN recommended_stream LIKE '%Commerce%' THEN
            CASE 
                WHEN (riasec_scores->>'E')::int >= 5 OR (riasec_scores->>'C')::int >= 5 
                THEN '✅ Valid'
                ELSE '❌ Mismatch'
            END
        -- Arts should have high A or S
        WHEN recommended_stream LIKE '%Arts%' THEN
            CASE 
                WHEN (riasec_scores->>'A')::int >= 5 OR (riasec_scores->>'S')::int >= 5 
                THEN '✅ Valid'
                ELSE '❌ Mismatch'
            END
        ELSE '⚠️ Unknown'
    END as validation_status
FROM personal_assessment_results 
WHERE grade_level = 'after10'
ORDER BY created_at DESC 
LIMIT 20;

-- 3. Check for duplicate recommendations (everyone getting same result)
SELECT 
    recommended_stream,
    COUNT(*) as student_count,
    ROUND(AVG(confidence), 2) as avg_confidence,
    ARRAY_AGG(DISTINCT riasec_scores) as unique_riasec_patterns
FROM personal_assessment_results 
WHERE grade_level = 'after10'
  AND created_at > NOW() - INTERVAL '7 days'
GROUP BY recommended_stream
ORDER BY student_count DESC;

-- 4. Find students with identical RIASEC but different recommendations (should be rare)
WITH riasec_groups AS (
    SELECT 
        riasec_scores,
        ARRAY_AGG(DISTINCT recommended_stream) as streams,
        COUNT(*) as count
    FROM personal_assessment_results 
    WHERE grade_level = 'after10'
    GROUP BY riasec_scores
    HAVING COUNT(DISTINCT recommended_stream) > 1
)
SELECT * FROM riasec_groups;

-- 5. Check confidence score distribution
SELECT 
    CASE 
        WHEN confidence >= 90 THEN '90-100% (Excellent)'
        WHEN confidence >= 80 THEN '80-89% (Very Good)'
        WHEN confidence >= 70 THEN '70-79% (Good)'
        WHEN confidence >= 60 THEN '60-69% (Fair)'
        ELSE 'Below 60% (Low)'
    END as confidence_range,
    COUNT(*) as count,
    ROUND(AVG(confidence), 2) as avg_confidence
FROM personal_assessment_results 
WHERE grade_level = 'after10'
GROUP BY 
    CASE 
        WHEN confidence >= 90 THEN '90-100% (Excellent)'
        WHEN confidence >= 80 THEN '80-89% (Very Good)'
        WHEN confidence >= 70 THEN '70-79% (Good)'
        WHEN confidence >= 60 THEN '60-69% (Fair)'
        ELSE 'Below 60% (Low)'
    END
ORDER BY avg_confidence DESC;

-- 6. Detailed view of a specific student's assessment
-- Replace 'STUDENT_ID_HERE' with actual student ID
SELECT 
    s.full_name,
    s.email,
    par.riasec_scores,
    par.recommended_stream,
    par.confidence,
    par.reasoning,
    par.alternative_stream,
    par.career_paths,
    par.created_at
FROM personal_assessment_results par
JOIN students s ON s.id = par.student_id
WHERE par.student_id = 'STUDENT_ID_HERE'
ORDER BY par.created_at DESC
LIMIT 1;

-- 7. Check answer distribution (are students answering varied questions?)
SELECT 
    student_id,
    jsonb_array_length(answers) as total_answers,
    (SELECT COUNT(*) FROM jsonb_array_elements(answers) WHERE value->>'answer' = 'yes') as yes_count,
    (SELECT COUNT(*) FROM jsonb_array_elements(answers) WHERE value->>'answer' = 'no') as no_count,
    recommended_stream
FROM personal_assessment_results 
WHERE grade_level = 'after10'
  AND answers IS NOT NULL
ORDER BY created_at DESC
LIMIT 20;

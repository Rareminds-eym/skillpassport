-- Fix: Manually populate result columns from gemini_results
-- This extracts data from gemini_results JSONB into individual columns
-- Safe to run - only updates records where gemini_results exists but columns are empty

UPDATE personal_assessment_results
SET 
    -- Extract RIASEC data
    riasec_scores = CASE 
        WHEN gemini_results->'riasec'->'scores' IS NOT NULL 
        THEN gemini_results->'riasec'->'scores'
        ELSE NULL
    END,
    riasec_code = CASE 
        WHEN gemini_results->'riasec'->>'code' IS NOT NULL 
        THEN gemini_results->'riasec'->>'code'
        ELSE NULL
    END,
    
    -- Extract Aptitude data
    aptitude_scores = CASE 
        WHEN gemini_results->'aptitude'->'scores' IS NOT NULL 
        THEN gemini_results->'aptitude'->'scores'
        WHEN gemini_results->'aptitude' IS NOT NULL 
        THEN gemini_results->'aptitude'
        ELSE NULL
    END,
    aptitude_overall = CASE 
        WHEN gemini_results->'aptitude'->>'overallScore' IS NOT NULL 
        THEN (gemini_results->'aptitude'->>'overallScore')::numeric
        ELSE NULL
    END,
    
    -- Extract Big Five data
    bigfive_scores = CASE 
        WHEN gemini_results->'bigFive' IS NOT NULL 
        THEN gemini_results->'bigFive'
        WHEN gemini_results->'characterStrengths' IS NOT NULL 
        THEN gemini_results->'characterStrengths'
        ELSE NULL
    END,
    
    -- Extract Career Fit data
    career_fit = CASE 
        WHEN gemini_results->'careerFit' IS NOT NULL 
        THEN gemini_results->'careerFit'
        ELSE NULL
    END,
    
    -- Extract Roadmap data
    roadmap = CASE 
        WHEN gemini_results->'roadmap' IS NOT NULL 
        THEN gemini_results->'roadmap'
        WHEN gemini_results->'learningRoadmap' IS NOT NULL 
        THEN gemini_results->'learningRoadmap'
        ELSE NULL
    END,
    
    -- Extract Skill Gap data
    skill_gap = CASE 
        WHEN gemini_results->'skillGap' IS NOT NULL 
        THEN gemini_results->'skillGap'
        WHEN gemini_results->'skills' IS NOT NULL 
        THEN gemini_results->'skills'
        ELSE NULL
    END,
    
    -- Extract other fields
    work_values_scores = CASE 
        WHEN gemini_results->'workValues' IS NOT NULL 
        THEN gemini_results->'workValues'
        ELSE NULL
    END,
    
    knowledge_details = CASE 
        WHEN gemini_results->'knowledge' IS NOT NULL 
        THEN gemini_results->'knowledge'
        WHEN gemini_results->'learningStyle' IS NOT NULL 
        THEN gemini_results->'learningStyle'
        ELSE NULL
    END,
    
    profile_snapshot = CASE 
        WHEN gemini_results->'profileSnapshot' IS NOT NULL 
        THEN gemini_results->'profileSnapshot'
        ELSE NULL
    END,
    
    overall_summary = CASE 
        WHEN gemini_results->>'overallSummary' IS NOT NULL 
        THEN gemini_results->>'overallSummary'
        WHEN gemini_results->>'summary' IS NOT NULL 
        THEN gemini_results->>'summary'
        ELSE NULL
    END,
    
    updated_at = now()

WHERE 
    -- Only update records where gemini_results exists
    gemini_results IS NOT NULL
    -- And at least one of the key fields is empty
    AND (
        riasec_scores IS NULL 
        OR career_fit IS NULL 
        OR aptitude_scores IS NULL
        OR bigfive_scores IS NULL
    );

-- Show what was updated
SELECT 
    id,
    attempt_id,
    grade_level,
    CASE WHEN riasec_scores IS NOT NULL THEN '✅ Populated' ELSE '❌ Still Empty' END as riasec_status,
    CASE WHEN aptitude_scores IS NOT NULL THEN '✅ Populated' ELSE '❌ Still Empty' END as aptitude_status,
    CASE WHEN bigfive_scores IS NOT NULL THEN '✅ Populated' ELSE '❌ Still Empty' END as bigfive_status,
    CASE WHEN career_fit IS NOT NULL THEN '✅ Populated' ELSE '❌ Still Empty' END as career_fit_status,
    CASE WHEN roadmap IS NOT NULL THEN '✅ Populated' ELSE '❌ Still Empty' END as roadmap_status,
    riasec_code,
    updated_at
FROM personal_assessment_results
WHERE gemini_results IS NOT NULL
ORDER BY updated_at DESC
LIMIT 10;

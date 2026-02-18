-- Fix aptitude_overall population from adaptive aptitude results
-- This ensures aptitude_overall is populated from both gemini_results and adaptive_aptitude_results

CREATE OR REPLACE FUNCTION "public"."populate_result_columns_from_gemini"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Only populate if gemini_results exists and individual columns are null
  IF NEW.gemini_results IS NOT NULL THEN
    -- RIASEC
    IF NEW.riasec_scores IS NULL AND NEW.gemini_results->'riasec'->'scores' IS NOT NULL THEN
      NEW.riasec_scores := NEW.gemini_results->'riasec'->'scores';
    END IF;
    IF NEW.riasec_code IS NULL AND NEW.gemini_results->'riasec'->>'code' IS NOT NULL THEN
      NEW.riasec_code := NEW.gemini_results->'riasec'->>'code';
    END IF;
    
    -- Aptitude - try gemini_results first, then adaptive results
    IF NEW.aptitude_scores IS NULL AND NEW.gemini_results->'aptitude'->'scores' IS NOT NULL THEN
      NEW.aptitude_scores := NEW.gemini_results->'aptitude'->'scores';
    END IF;
    
    -- Aptitude overall - try gemini_results first
    IF NEW.aptitude_overall IS NULL AND NEW.gemini_results->'aptitude'->>'overallScore' IS NOT NULL THEN
      NEW.aptitude_overall := (NEW.gemini_results->'aptitude'->>'overallScore')::numeric;
    END IF;
    
    -- If still null and adaptive_aptitude_session_id exists, fetch from adaptive results
    IF NEW.aptitude_overall IS NULL AND NEW.adaptive_aptitude_session_id IS NOT NULL THEN
      SELECT overall_accuracy INTO NEW.aptitude_overall
      FROM adaptive_aptitude_results
      WHERE session_id = NEW.adaptive_aptitude_session_id;
    END IF;
    
    -- BigFive
    IF NEW.bigfive_scores IS NULL AND NEW.gemini_results->'bigFive' IS NOT NULL THEN
      NEW.bigfive_scores := NEW.gemini_results->'bigFive';
    END IF;
    
    -- Work Values
    IF NEW.work_values_scores IS NULL AND NEW.gemini_results->'workValues'->'scores' IS NOT NULL THEN
      NEW.work_values_scores := NEW.gemini_results->'workValues'->'scores';
    END IF;
    
    -- Employability
    IF NEW.employability_scores IS NULL AND NEW.gemini_results->'employability'->'skillScores' IS NOT NULL THEN
      NEW.employability_scores := NEW.gemini_results->'employability'->'skillScores';
    END IF;
    IF NEW.employability_readiness IS NULL AND NEW.gemini_results->'employability'->>'overallReadiness' IS NOT NULL THEN
      NEW.employability_readiness := NEW.gemini_results->'employability'->>'overallReadiness';
    END IF;
    
    -- Knowledge
    IF NEW.knowledge_score IS NULL AND NEW.gemini_results->'knowledge'->>'score' IS NOT NULL THEN
      NEW.knowledge_score := (NEW.gemini_results->'knowledge'->>'score')::numeric;
    END IF;
    IF NEW.knowledge_details IS NULL AND NEW.gemini_results->'knowledge' IS NOT NULL THEN
      NEW.knowledge_details := NEW.gemini_results->'knowledge';
    END IF;
    
    -- Career guidance
    IF NEW.career_fit IS NULL AND NEW.gemini_results->'careerFit' IS NOT NULL THEN
      NEW.career_fit := NEW.gemini_results->'careerFit';
    END IF;
    IF NEW.skill_gap IS NULL AND NEW.gemini_results->'skillGap' IS NOT NULL THEN
      NEW.skill_gap := NEW.gemini_results->'skillGap';
    END IF;
    IF NEW.skill_gap_courses IS NULL AND NEW.gemini_results->'skillGapCourses' IS NOT NULL THEN
      NEW.skill_gap_courses := NEW.gemini_results->'skillGapCourses';
    END IF;
    IF NEW.roadmap IS NULL AND NEW.gemini_results->'roadmap' IS NOT NULL THEN
      NEW.roadmap := NEW.gemini_results->'roadmap';
    END IF;
    IF NEW.profile_snapshot IS NULL AND NEW.gemini_results->'profileSnapshot' IS NOT NULL THEN
      NEW.profile_snapshot := NEW.gemini_results->'profileSnapshot';
    END IF;
    IF NEW.timing_analysis IS NULL AND NEW.gemini_results->'timingAnalysis' IS NOT NULL THEN
      NEW.timing_analysis := NEW.gemini_results->'timingAnalysis';
    END IF;
    IF NEW.final_note IS NULL AND NEW.gemini_results->'finalNote' IS NOT NULL THEN
      NEW.final_note := NEW.gemini_results->'finalNote';
    END IF;
    IF NEW.overall_summary IS NULL AND NEW.gemini_results->>'overallSummary' IS NOT NULL THEN
      NEW.overall_summary := NEW.gemini_results->>'overallSummary';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION "public"."populate_result_columns_from_gemini"() IS 'Populates individual result columns from gemini_results JSONB. Also fetches aptitude_overall from adaptive_aptitude_results if available.';

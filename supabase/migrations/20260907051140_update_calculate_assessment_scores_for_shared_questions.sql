-- Update calculate_assessment_scores() to find shared canonical question sets.
--
-- WHY:
--   career_assessment_ai_questions is moving to one shared canonical question
--   set per (stream_id, grade_level, question_type), reused by every learner
--   on that combination (see get_or_create_shared_questions(), migration
--   20260907044042). New canonical rows are written with learner_id = NULL.
--
--   This trigger's two question lookups currently filter by
--   "WHERE learner_id = NEW.learner_id" - under the new shared model, a
--   learner who reused another learner's canonical set (the normal case
--   going forward) has no career_assessment_ai_questions row under their own
--   learner_id at all, so this filter finds nothing, both *_questions
--   variables stay NULL, and the score silently computes as 0 - a real
--   regression, not hypothetical.
--
-- FIX:
--   Both lookups change from "learner_id = NEW.learner_id" to
--   "stream_id = NEW.stream_id AND grade_level = NEW.grade_level".
--   personal_assessment_results (the table this trigger fires on) already
--   has its own stream_id and grade_level columns, both NOT NULL - verified
--   these are populated on every insert from the attempt record
--   (e.g. analysis-college.ts's insert: grade_level: attempt.grade_level,
--   stream_id: attempt.stream_id || 'general'). No new join to
--   personal_assessment_attempts is needed for this part of the fix - the
--   existing SELECT * INTO attempt_record ... FROM personal_assessment_attempts
--   is still used, unchanged, only for attempt_record.all_responses.
--
-- SAFETY:
--   No table/column/constraint change. No historical data modified.
--   Applied via CREATE OR REPLACE FUNCTION as a NEW migration - the prior
--   applied migration (20260529000002_fix_aptitude_trigger_adaptive.sql)
--   is not edited in place. The ADAPTIVE GUARD, the all_responses join, the
--   scoring math, and the gemini_results merge are all byte-identical to
--   the previous version - only the two question lookups' WHERE clauses
--   change.

CREATE OR REPLACE FUNCTION "public"."calculate_assessment_scores"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  attempt_record RECORD;
  aptitude_questions JSONB;
  knowledge_questions JSONB;
  all_responses JSONB;

  -- Score counters
  verbal_correct INT := 0;
  verbal_total INT := 0;
  numerical_correct INT := 0;
  numerical_total INT := 0;
  abstract_correct INT := 0;
  abstract_total INT := 0;
  spatial_correct INT := 0;
  spatial_total INT := 0;
  clerical_correct INT := 0;
  clerical_total INT := 0;

  knowledge_correct INT := 0;
  knowledge_total INT := 0;

  -- Loop variables
  answer_key TEXT;
  answer_value TEXT;
  question_id TEXT;
  question JSONB;
  correct_answer TEXT;
  subtype TEXT;

  -- Final scores
  total_aptitude_correct INT;
  total_aptitude_questions INT;
  aptitude_percentage NUMERIC;
  knowledge_percentage NUMERIC;

  -- Updated scores JSONB
  new_aptitude_scores JSONB;
  new_knowledge_details JSONB;
BEGIN
  -- ADAPTIVE GUARD: when this result is linked to an adaptive aptitude session,
  -- the save-results backend has already populated aptitude_scores / aptitude_overall
  -- (and knowledge fields) from adaptive_aptitude_results. Do NOT recompute/overwrite
  -- them here, otherwise valid adaptive scores get reset to zero.
  IF NEW.adaptive_aptitude_session_id IS NOT NULL THEN
    RETURN NEW;
  END IF;

  -- Get the attempt record with all_responses
  SELECT * INTO attempt_record
  FROM personal_assessment_attempts
  WHERE id = NEW.attempt_id;

  IF attempt_record IS NULL THEN
    RAISE NOTICE 'No attempt found for attempt_id: %', NEW.attempt_id;
    RETURN NEW;
  END IF;

  all_responses := attempt_record.all_responses;

  IF all_responses IS NULL THEN
    RAISE NOTICE 'No all_responses found for attempt_id: %', NEW.attempt_id;
    RETURN NEW;
  END IF;

  -- Get aptitude questions for this stream + grade (shared canonical set -
  -- was: WHERE learner_id = NEW.learner_id)
  SELECT questions INTO aptitude_questions
  FROM career_assessment_ai_questions
  WHERE stream_id = NEW.stream_id
    AND grade_level = NEW.grade_level
    AND question_type = 'aptitude'
    AND is_active = true
  ORDER BY created_at DESC
  LIMIT 1;

  -- Get knowledge questions for this stream + grade (shared canonical set -
  -- was: WHERE learner_id = NEW.learner_id)
  SELECT questions INTO knowledge_questions
  FROM career_assessment_ai_questions
  WHERE stream_id = NEW.stream_id
    AND grade_level = NEW.grade_level
    AND question_type = 'knowledge'
    AND is_active = true
  ORDER BY created_at DESC
  LIMIT 1;

  -- Calculate aptitude scores
  IF aptitude_questions IS NOT NULL THEN
    FOR answer_key, answer_value IN SELECT * FROM jsonb_each_text(all_responses)
    LOOP
      IF answer_key LIKE 'aptitude_%' THEN
        question_id := REPLACE(answer_key, 'aptitude_', '');

        -- Find the question in the questions array
        SELECT q INTO question
        FROM jsonb_array_elements(aptitude_questions) AS q
        WHERE q->>'id' = question_id;

        IF question IS NOT NULL THEN
          correct_answer := TRIM(question->>'correct_answer');
          subtype := LOWER(COALESCE(question->>'subtype', question->>'category', 'verbal'));

          -- Map subtypes to categories
          IF subtype IN ('mathematics', 'math', 'numerical_reasoning', 'numerical', 'data_interpretation', 'economics') THEN
            numerical_total := numerical_total + 1;
            IF TRIM(answer_value) = correct_answer THEN
              numerical_correct := numerical_correct + 1;
            END IF;
          ELSIF subtype IN ('english', 'verbal_reasoning', 'verbal', 'social_studies', 'history', 'civics', 'general_knowledge') THEN
            verbal_total := verbal_total + 1;
            IF TRIM(answer_value) = correct_answer THEN
              verbal_correct := verbal_correct + 1;
            END IF;
          ELSIF subtype IN ('science', 'logical_reasoning', 'logical', 'abstract', 'reasoning', 'pattern_recognition') THEN
            abstract_total := abstract_total + 1;
            IF TRIM(answer_value) = correct_answer THEN
              abstract_correct := abstract_correct + 1;
            END IF;
          ELSIF subtype IN ('geography', 'spatial_reasoning', 'spatial') THEN
            spatial_total := spatial_total + 1;
            IF TRIM(answer_value) = correct_answer THEN
              spatial_correct := spatial_correct + 1;
            END IF;
          ELSE
            -- Default to clerical for unknown types
            clerical_total := clerical_total + 1;
            IF TRIM(answer_value) = correct_answer THEN
              clerical_correct := clerical_correct + 1;
            END IF;
          END IF;
        END IF;
      END IF;
    END LOOP;
  END IF;

  -- Calculate knowledge scores
  IF knowledge_questions IS NOT NULL THEN
    FOR answer_key, answer_value IN SELECT * FROM jsonb_each_text(all_responses)
    LOOP
      IF answer_key LIKE 'knowledge_%' THEN
        question_id := REPLACE(answer_key, 'knowledge_', '');

        -- Find the question in the questions array
        SELECT q INTO question
        FROM jsonb_array_elements(knowledge_questions) AS q
        WHERE q->>'id' = question_id;

        IF question IS NOT NULL THEN
          correct_answer := TRIM(question->>'correct_answer');
          knowledge_total := knowledge_total + 1;
          IF TRIM(answer_value) = correct_answer THEN
            knowledge_correct := knowledge_correct + 1;
          END IF;
        END IF;
      END IF;
    END LOOP;
  END IF;

  -- Calculate totals and percentages
  total_aptitude_correct := verbal_correct + numerical_correct + abstract_correct + spatial_correct + clerical_correct;
  total_aptitude_questions := verbal_total + numerical_total + abstract_total + spatial_total + clerical_total;

  IF total_aptitude_questions > 0 THEN
    aptitude_percentage := ROUND((total_aptitude_correct::NUMERIC / total_aptitude_questions) * 100, 2);
  ELSE
    aptitude_percentage := 0;
  END IF;

  IF knowledge_total > 0 THEN
    knowledge_percentage := ROUND((knowledge_correct::NUMERIC / knowledge_total) * 100, 2);
  ELSE
    knowledge_percentage := 0;
  END IF;

  -- Build new aptitude_scores JSONB
  new_aptitude_scores := jsonb_build_object(
    'verbal', jsonb_build_object('correct', verbal_correct, 'total', verbal_total, 'percentage', CASE WHEN verbal_total > 0 THEN ROUND((verbal_correct::NUMERIC / verbal_total) * 100) ELSE 0 END),
    'numerical', jsonb_build_object('correct', numerical_correct, 'total', numerical_total, 'percentage', CASE WHEN numerical_total > 0 THEN ROUND((numerical_correct::NUMERIC / numerical_total) * 100) ELSE 0 END),
    'abstract', jsonb_build_object('correct', abstract_correct, 'total', abstract_total, 'percentage', CASE WHEN abstract_total > 0 THEN ROUND((abstract_correct::NUMERIC / abstract_total) * 100) ELSE 0 END),
    'spatial', jsonb_build_object('correct', spatial_correct, 'total', spatial_total, 'percentage', CASE WHEN spatial_total > 0 THEN ROUND((spatial_correct::NUMERIC / spatial_total) * 100) ELSE 0 END),
    'clerical', jsonb_build_object('correct', clerical_correct, 'total', clerical_total, 'percentage', CASE WHEN clerical_total > 0 THEN ROUND((clerical_correct::NUMERIC / clerical_total) * 100) ELSE 0 END)
  );

  -- Build new knowledge_details JSONB
  new_knowledge_details := jsonb_build_object(
    'score', knowledge_percentage,
    'correctCount', knowledge_correct,
    'totalQuestions', knowledge_total,
    'strongTopics', CASE WHEN knowledge_correct > 0 THEN '["Calculated from answers"]'::jsonb ELSE '["No data"]'::jsonb END,
    'weakTopics', CASE WHEN knowledge_total - knowledge_correct > 0 THEN '["Calculated from answers"]'::jsonb ELSE '["No data"]'::jsonb END,
    'recommendation', CASE
      WHEN knowledge_percentage >= 70 THEN 'Strong knowledge foundation. Continue building expertise.'
      WHEN knowledge_percentage >= 50 THEN 'Good knowledge base. Focus on weak areas for improvement.'
      ELSE 'Focus on building domain expertise through projects and certifications.'
    END
  );

  -- Update the NEW record with calculated scores
  NEW.aptitude_scores := new_aptitude_scores;
  NEW.aptitude_overall := aptitude_percentage;
  NEW.knowledge_score := knowledge_percentage;
  NEW.knowledge_details := new_knowledge_details;

  -- Also update gemini_results if it exists
  IF NEW.gemini_results IS NOT NULL THEN
    NEW.gemini_results := NEW.gemini_results || jsonb_build_object(
      'aptitude', jsonb_build_object(
        'scores', new_aptitude_scores,
        'overallScore', aptitude_percentage,
        'topStrengths', CASE
          WHEN numerical_correct >= verbal_correct AND numerical_correct >= abstract_correct THEN '["Numerical Reasoning"]'::jsonb
          WHEN verbal_correct >= numerical_correct AND verbal_correct >= abstract_correct THEN '["Verbal Reasoning"]'::jsonb
          ELSE '["Abstract Reasoning"]'::jsonb
        END,
        'areasToImprove', '["Continue practicing"]'::jsonb,
        'cognitiveProfile', 'Calculated from actual assessment answers.',
        'careerImplications', 'Scores reflect actual performance on aptitude questions.'
      ),
      'knowledge', new_knowledge_details
    );
  END IF;

  RAISE NOTICE 'Calculated scores - Aptitude: %/% (%), Knowledge: %/% (%)',
    total_aptitude_correct, total_aptitude_questions, aptitude_percentage,
    knowledge_correct, knowledge_total, knowledge_percentage;

  RETURN NEW;
END;
$$;

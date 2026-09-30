-- Shared canonical question sets for Stream Knowledge / Stream Based Aptitude.
--
-- WHY:
--   career_assessment_ai_questions was generated per-learner (one row per
--   learner per stream+type). We are moving to one shared canonical question
--   set per (stream_id, grade_level, question_type), reused by every learner
--   on that combination.
--
-- WHAT THIS MIGRATION DOES:
--   Adds ONE new function, get_or_create_shared_questions(). No table,
--   column, constraint, or index is added, removed, or altered. No existing
--   row is read differently, modified, or deleted by this migration.
--
-- HOW IT WORKS:
--   Callers pass their own freshly AI-generated questions. The function
--   takes a transaction-scoped advisory lock keyed on
--   (stream_id, grade_level, question_type) - the same pg_advisory_xact_lock
--   pattern already used in this codebase (see
--   20260730000000_career_ai_quota.sql). Under the lock it checks for an
--   existing shared set; if found, returns it unchanged. If not found, it
--   inserts the caller's questions as the new canonical set and returns
--   those. The lock is released automatically when the transaction commits -
--   no explicit unlock call. This guarantees at most one canonical row is
--   ever persisted per combination, even when two callers race for the same
--   combination at the same time.
--
--   This function never UPDATEs an existing row - only SELECT (lookup) or
--   INSERT (first-time creation). A canonical set, once persisted, is never
--   modified in place by this function.
--
-- learner_id on a NEW canonical row is always stored as NULL, never
-- p_learner_id. Reason: the table's existing (and unchanged)
-- UNIQUE(learner_id, stream_id, question_type) constraint predates this
-- shared-question design and does not include grade_level. The SAME
-- learner_id can legitimately need canonical rows for the SAME
-- stream_id + question_type at two DIFFERENT grade_levels over time (e.g. a
-- returning learner moves from after10 to after12) - verified directly
-- against a live Postgres instance that writing a real, non-null
-- p_learner_id here reproduces "duplicate key value violates unique
-- constraint career_assessment_ai_questions_learner_stream_type_key" on the
-- second grade. Writing NULL instead avoids this entirely: standard SQL
-- UNIQUE-constraint semantics never treat two NULLs as equal, so any number
-- of NULL-learner_id canonical rows can coexist for the same
-- stream_id + question_type across different grades, or even the same
-- grade from different callers, without ever colliding on the old
-- constraint - verified directly. p_learner_id is still accepted as a
-- parameter (kept for call-site stability / potential future
-- logging/auditing use) but is never written to the row. No change to the
-- UNIQUE constraint itself, and no historical row is affected - this only
-- changes what NEW rows inserted by this function contain.
--
-- learner_id therefore plays no role in identifying or looking up a
-- canonical row - lookups are, and remain, keyed purely by
-- (stream_id, grade_level, question_type).

CREATE OR REPLACE FUNCTION get_or_create_shared_questions(
  p_stream_id text,
  p_grade_level text,
  p_question_type text,
  p_questions jsonb,
  p_learner_id uuid DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  existing_questions jsonb;
  new_id uuid;
BEGIN
  -- Serialize concurrent callers for this exact combination only.
  PERFORM pg_advisory_xact_lock(hashtext(p_stream_id || '|' || p_grade_level || '|' || p_question_type));

  -- Look for an existing canonical set for this combination.
  SELECT questions INTO existing_questions
  FROM career_assessment_ai_questions
  WHERE stream_id = p_stream_id
    AND grade_level = p_grade_level
    AND question_type = p_question_type
    AND is_active = true
  ORDER BY created_at ASC
  LIMIT 1;

  IF existing_questions IS NOT NULL THEN
    -- Canonical set already exists - return it unchanged. No insert, no update.
    RETURN jsonb_build_object('questions', existing_questions, 'is_new', false);
  END IF;

  -- No canonical set yet for this combination - this caller creates it.
  -- learner_id is deliberately NULL, not p_learner_id - see comment above.
  INSERT INTO career_assessment_ai_questions (
    stream_id, grade_level, question_type, questions, learner_id, is_active
  ) VALUES (
    p_stream_id, p_grade_level, p_question_type, p_questions, NULL, true
  )
  RETURNING id INTO new_id;

  RETURN jsonb_build_object('questions', p_questions, 'is_new', true);
END;
$$;

COMMENT ON FUNCTION get_or_create_shared_questions(text, text, text, jsonb, uuid) IS
  'Returns the canonical shared question set for (stream_id, grade_level, question_type), creating it via INSERT if none exists yet. Never UPDATEs an existing row. Concurrency-safe via pg_advisory_xact_lock.';

-- Debug adaptive difficulty progression
-- Check if difficulty is increasing/decreasing correctly

-- Get a recent adaptive session with responses
SELECT 
    s.id as session_id,
    s.student_id,
    s.current_phase,
    s.current_difficulty,
    s.difficulty_path,
    s.questions_answered,
    s.correct_answers
FROM adaptive_aptitude_sessions s
WHERE s.status = 'in_progress'
  AND s.current_phase = 'adaptive_core'
ORDER BY s.created_at DESC
LIMIT 1;

-- Get the responses for this session to see difficulty progression
SELECT 
    r.sequence_number,
    r.phase,
    r.difficulty_at_time,
    r.is_correct,
    r.subtag,
    LEFT(r.question_text, 80) as question_preview
FROM adaptive_aptitude_responses r
WHERE r.session_id IN (
    SELECT id FROM adaptive_aptitude_sessions 
    WHERE status = 'in_progress' 
    AND current_phase = 'adaptive_core'
    ORDER BY created_at DESC 
    LIMIT 1
)
ORDER BY r.sequence_number;

-- Check if difficulty is changing after correct/incorrect answers
WITH session_responses AS (
    SELECT 
        r.sequence_number,
        r.difficulty_at_time,
        r.is_correct,
        LEAD(r.difficulty_at_time) OVER (ORDER BY r.sequence_number) as next_difficulty
    FROM adaptive_aptitude_responses r
    WHERE r.session_id IN (
        SELECT id FROM adaptive_aptitude_sessions 
        WHERE status = 'in_progress' 
        AND current_phase = 'adaptive_core'
        ORDER BY created_at DESC 
        LIMIT 1
    )
    AND r.phase = 'adaptive_core'
)
SELECT 
    sequence_number,
    difficulty_at_time as current_diff,
    is_correct,
    next_difficulty,
    CASE 
        WHEN is_correct = true AND next_difficulty > difficulty_at_time THEN '✅ Increased (correct)'
        WHEN is_correct = false AND next_difficulty < difficulty_at_time THEN '✅ Decreased (incorrect)'
        WHEN is_correct = true AND next_difficulty = difficulty_at_time THEN '⚠️ Should increase but stayed same'
        WHEN is_correct = false AND next_difficulty = difficulty_at_time THEN '⚠️ Should decrease but stayed same'
        WHEN next_difficulty IS NULL THEN 'Last question'
        ELSE '❌ Unexpected change'
    END as difficulty_change_status
FROM session_responses
ORDER BY sequence_number;

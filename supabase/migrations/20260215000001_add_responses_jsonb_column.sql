-- Add a JSONB column to store all responses in a single row per session
ALTER TABLE public.adaptive_aptitude_sessions
ADD COLUMN IF NOT EXISTS all_responses JSONB DEFAULT '[]'::jsonb;

-- Add index for querying responses
CREATE INDEX IF NOT EXISTS idx_adaptive_sessions_all_responses 
ON public.adaptive_aptitude_sessions USING gin(all_responses);

-- Add comment
COMMENT ON COLUMN public.adaptive_aptitude_sessions.all_responses IS 'Array of all question responses stored as JSONB: [{question_id, selected_answer, is_correct, response_time_ms, difficulty_at_time, subtag, phase, sequence_number, question_text, question_options, correct_answer, explanation}]';

-- Create a function to append a response to the session
CREATE OR REPLACE FUNCTION public.append_adaptive_response(
    p_session_id UUID,
    p_response JSONB
) RETURNS VOID AS $$
BEGIN
    UPDATE public.adaptive_aptitude_sessions
    SET all_responses = all_responses || p_response::jsonb,
        updated_at = NOW()
    WHERE id = p_session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.append_adaptive_response(UUID, JSONB) TO authenticated;

COMMENT ON FUNCTION public.append_adaptive_response IS 'Appends a single response to the all_responses array for a session';

-- Create assessment_sessions table for tracking active assessment sessions
-- This table helps coordinate multi-tab session locking via Supabase Realtime

CREATE TABLE IF NOT EXISTS public.assessment_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    assessment_id TEXT NOT NULL,
    student_id UUID NOT NULL, -- Removed foreign key constraint for testing
    tab_id TEXT NOT NULL,
    student_name TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'abandoned')),
    heartbeat_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure one active session per assessment per student
    UNIQUE(assessment_id, student_id, status) DEFERRABLE INITIALLY DEFERRED
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_assessment_sessions_student_assessment 
ON public.assessment_sessions(student_id, assessment_id);

CREATE INDEX IF NOT EXISTS idx_assessment_sessions_status 
ON public.assessment_sessions(status);

CREATE INDEX IF NOT EXISTS idx_assessment_sessions_heartbeat 
ON public.assessment_sessions(heartbeat_at);

-- Enable RLS
ALTER TABLE public.assessment_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies (modified for testing without auth.uid())
CREATE POLICY "Allow all operations for testing" 
ON public.assessment_sessions FOR ALL 
USING (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_assessment_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_assessment_sessions_updated_at
    BEFORE UPDATE ON public.assessment_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_assessment_sessions_updated_at();

-- Function to clean up stale sessions (older than 30 minutes without heartbeat)
CREATE OR REPLACE FUNCTION cleanup_stale_assessment_sessions()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM public.assessment_sessions 
    WHERE heartbeat_at < NOW() - INTERVAL '30 minutes'
    AND status = 'active';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.assessment_sessions TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;
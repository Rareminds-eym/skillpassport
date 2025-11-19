-- AI Counselling Database Schema for Supabase
-- Run these SQL commands in your Supabase SQL editor

-- Create counselling_sessions table
CREATE TABLE IF NOT EXISTS public.counselling_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id TEXT NOT NULL,
    student_name TEXT,
    topic TEXT NOT NULL CHECK (topic IN ('academic', 'career', 'performance', 'mental-health', 'general')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::JSONB
);

-- Create counselling_messages table
CREATE TABLE IF NOT EXISTS public.counselling_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES public.counselling_sessions(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    tokens_used INTEGER,
    CONSTRAINT fk_session FOREIGN KEY (session_id) REFERENCES public.counselling_sessions(id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_counselling_sessions_student_id 
    ON public.counselling_sessions(student_id);

CREATE INDEX IF NOT EXISTS idx_counselling_sessions_created_at 
    ON public.counselling_sessions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_counselling_messages_session_id 
    ON public.counselling_messages(session_id);

CREATE INDEX IF NOT EXISTS idx_counselling_messages_timestamp 
    ON public.counselling_messages(timestamp);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-updating updated_at
CREATE TRIGGER update_counselling_sessions_updated_at
    BEFORE UPDATE ON public.counselling_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE public.counselling_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.counselling_messages ENABLE ROW LEVEL SECURITY;

-- Create policies (adjust based on your auth setup)
-- Policy for authenticated users to read their own sessions
CREATE POLICY "Users can view their own counselling sessions"
    ON public.counselling_sessions
    FOR SELECT
    USING (auth.uid()::TEXT = student_id OR auth.role() = 'admin');

-- Policy for authenticated users to create sessions
CREATE POLICY "Users can create counselling sessions"
    ON public.counselling_sessions
    FOR INSERT
    WITH CHECK (auth.uid()::TEXT = student_id OR auth.role() = 'admin');

-- Policy for authenticated users to update their sessions
CREATE POLICY "Users can update their own sessions"
    ON public.counselling_sessions
    FOR UPDATE
    USING (auth.uid()::TEXT = student_id OR auth.role() = 'admin');

-- Policy for messages
CREATE POLICY "Users can view messages from their sessions"
    ON public.counselling_messages
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.counselling_sessions
            WHERE id = session_id
            AND (student_id = auth.uid()::TEXT OR auth.role() = 'admin')
        )
    );

CREATE POLICY "Users can create messages in their sessions"
    ON public.counselling_messages
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.counselling_sessions
            WHERE id = session_id
            AND (student_id = auth.uid()::TEXT OR auth.role() = 'admin')
        )
    );

-- Optional: Create a view for session statistics
CREATE OR REPLACE VIEW counselling_session_stats AS
SELECT 
    cs.id,
    cs.student_id,
    cs.student_name,
    cs.topic,
    cs.status,
    cs.created_at,
    COUNT(cm.id) as message_count,
    SUM(cm.tokens_used) as total_tokens
FROM public.counselling_sessions cs
LEFT JOIN public.counselling_messages cm ON cs.id = cm.session_id
GROUP BY cs.id, cs.student_id, cs.student_name, cs.topic, cs.status, cs.created_at;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.counselling_sessions TO authenticated;
GRANT SELECT, INSERT ON public.counselling_messages TO authenticated;
GRANT SELECT ON counselling_session_stats TO authenticated;
-- Create recent_updates table
CREATE TABLE public.recent_updates (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamp with time zone NULL DEFAULT now(),
  updates jsonb NULL DEFAULT '{"updates": []}'::jsonb,
  CONSTRAINT recent_updates_pkey PRIMARY KEY (id),
  CONSTRAINT unique_student_id UNIQUE (student_id),
  CONSTRAINT unique_user_id UNIQUE (user_id),
  CONSTRAINT recent_updates_student_id_fkey FOREIGN KEY (student_id) REFERENCES students (id) ON UPDATE CASCADE ON DELETE CASCADE
) TABLESPACE pg_default;

-- Insert some sample data for testing
INSERT INTO public.recent_updates (student_id, user_id, updates) VALUES 
(
  (SELECT id FROM students WHERE email = 'harrishhari2006@gmail.com' LIMIT 1),
  (SELECT user_id FROM students WHERE email = 'harrishhari2006@gmail.com' LIMIT 1),
  '{"updates": [
    {
      "id": "1",
      "message": "Your profile has been viewed 12 times this week",
      "timestamp": "2 hours ago",
      "type": "profile_view"
    },
    {
      "id": "2", 
      "message": "New internship opportunity matches your skills",
      "timestamp": "1 day ago",
      "type": "opportunity_match"
    },
    {
      "id": "3",
      "message": "You completed JavaScript Fundamentals course",
      "timestamp": "3 days ago", 
      "type": "course_completion"
    }
  ]}'::jsonb
) ON CONFLICT (student_id) DO NOTHING;

-- Add RLS policies
ALTER TABLE public.recent_updates ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to see only their own updates using auth.uid()
CREATE POLICY "Users can view own recent updates" ON public.recent_updates
FOR SELECT USING (auth.uid() = user_id);

-- Policy to allow updating own recent updates using auth.uid()
CREATE POLICY "Users can update own recent updates" ON public.recent_updates
FOR UPDATE USING (auth.uid() = user_id);

-- Policy to allow inserting recent updates using auth.uid()
CREATE POLICY "Allow insert recent updates" ON public.recent_updates
FOR INSERT WITH CHECK (auth.uid() = user_id);
-- CRITICAL SECURITY FIX: Enable Row Level Security
-- Run this IMMEDIATELY in Supabase SQL Editor
-- Date: 2024-12-09

-- ============================================
-- STEP 1: Enable RLS on all critical tables
-- ============================================

ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recruiters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.education ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experience ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trainings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applied_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 2: Create policies for STUDENTS table
-- ============================================

-- Students can view/edit their own data
CREATE POLICY "students_own_data" ON public.students
  FOR ALL USING (auth.uid() = user_id);

-- Educators can view students in their school
CREATE POLICY "educators_view_school_students" ON public.students
  FOR SELECT USING (
    school_id IN (
      SELECT school_id FROM public.school_educators 
      WHERE user_id = auth.uid()
    )
  );

-- School admins can manage students in their school
CREATE POLICY "school_admins_manage_students" ON public.students
  FOR ALL USING (
    school_id IN (
      SELECT id FROM public.schools WHERE created_by = auth.uid()
    )
  );

-- ============================================
-- STEP 3: Create policies for USERS table
-- ============================================

CREATE POLICY "users_read_own" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- ============================================
-- STEP 4: Create policies for SUBSCRIPTIONS
-- ============================================

CREATE POLICY "subscriptions_own" ON public.subscriptions
  FOR ALL USING (auth.uid() = user_id);


-- ============================================
-- STEP 5: Create policies for MESSAGES/CONVERSATIONS
-- ============================================

CREATE POLICY "conversations_participants" ON public.conversations
  FOR ALL USING (
    auth.uid() = student_id OR 
    auth.uid() IN (SELECT user_id FROM public.recruiters WHERE id = recruiter_id)
  );

CREATE POLICY "messages_participants" ON public.messages
  FOR ALL USING (
    auth.uid() = sender_id OR auth.uid() = receiver_id
  );

-- ============================================
-- STEP 6: Create policies for STUDENT DATA tables
-- ============================================

-- Education
CREATE POLICY "education_own" ON public.education
  FOR ALL USING (auth.uid() = student_id);

-- Experience  
CREATE POLICY "experience_own" ON public.experience
  FOR ALL USING (auth.uid() = student_id);

-- Skills
CREATE POLICY "skills_own" ON public.skills
  FOR ALL USING (auth.uid() = student_id);

-- Projects
CREATE POLICY "projects_own" ON public.projects
  FOR ALL USING (auth.uid() = student_id);

-- Certificates
CREATE POLICY "certificates_own" ON public.certificates
  FOR ALL USING (auth.uid() = student_id);

-- Trainings
CREATE POLICY "trainings_own" ON public.trainings
  FOR ALL USING (auth.uid() = student_id);

-- ============================================
-- STEP 7: Create policies for JOB-RELATED tables
-- ============================================

-- Applied Jobs
CREATE POLICY "applied_jobs_own" ON public.applied_jobs
  FOR ALL USING (auth.uid() = student_id);

-- Saved Jobs
CREATE POLICY "saved_jobs_own" ON public.saved_jobs
  FOR ALL USING (auth.uid() = student_id);

-- Interviews - students and recruiters
CREATE POLICY "interviews_student" ON public.interviews
  FOR ALL USING (auth.uid() = student_id);

-- Opportunities - public read, recruiter write
CREATE POLICY "opportunities_public_read" ON public.opportunities
  FOR SELECT USING (is_active = true);

CREATE POLICY "opportunities_recruiter_manage" ON public.opportunities
  FOR ALL USING (
    auth.uid() IN (SELECT user_id FROM public.recruiters WHERE id = recruiter_id)
  );

-- ============================================
-- STEP 8: Recruiters table
-- ============================================

CREATE POLICY "recruiters_own" ON public.recruiters
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "recruiters_public_read" ON public.recruiters
  FOR SELECT USING (isactive = true);

-- ============================================
-- VERIFICATION: Check RLS is enabled
-- ============================================

SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables t
JOIN pg_class c ON c.relname = t.tablename
WHERE schemaname = 'public'
AND tablename IN (
  'students', 'users', 'subscriptions', 'conversations', 
  'messages', 'recruiters', 'certificates', 'education',
  'experience', 'skills', 'projects', 'trainings',
  'applied_jobs', 'saved_jobs', 'interviews', 'opportunities'
)
ORDER BY tablename;

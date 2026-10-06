
BEGIN;

-- Insert Course: 2-Hour Lesson Plan in 6 Minutes
INSERT INTO public.courses (
  title, 
  code, 
  description, 
  duration, 
  status, 
  category, 
  skill_type, 
  target_outcomes, 
  thumbnail,
  approval_status, 
  classification,
  plan_type,
  course_type,
  issued_on,
  created_at, 
  updated_at
) VALUES (
  '2-Hour Lesson Plan in 6 Minutes',
  'HLPN2026-07',
  'Practical AI webinar for educators to build lesson plans, assessments, rubrics, feedback banks and project mentoring workflows using AI tools for smarter teaching.',
  '2 Hours',
  'Active',
  'Faculty Development',
  'technical',
  '["Use ChatGPT for lesson planning","Create worksheets and quizzes","Write parent messages and school notices","Create visuals using Canva/Gamma","Use AI safely in teaching"]'::jsonb,
  'https://storage-sp.rareminds.in/courses/HLPN2026-07/thumbnail/ChatGPT Image Jul 8, 2026, 11_00_46 AM.png',
  'pending',
  'teacher',
  'freemium',
  'webinar',
  '2026-07-07',
  NOW(),
  NOW()
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: 2-Hour Lesson Plan in 6 Minutes
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'HLPN2026-07' LIMIT 1),
  '2-Hour Lesson Plan in 6 Minutes',
  'Interactive webinar session introducing AI tools for teachers.',
  1,
  '["AI","Teaching","Productivity","Lesson Planning","ChatGPT","Canva","Gamma"]'::jsonb,
  '["Live Webinar","Q&A Session","Real Classroom Examples","Interactive Activities"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: 2-Hour Lesson Plan in 6 Minutes
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'HLPN2026-07' LIMIT 1)
   AND title = '2-Hour Lesson Plan in 6 Minutes' LIMIT 1),
  '2-Hour Lesson Plan in 6 Minutes',
  'Learn practical AI tools to save time, create lesson plans, worksheets, quizzes, and improve communication with students and parents. Webinar conducted on 21 May 2026.',
  'Topics include ChatGPT for lesson planning, worksheet creation, parent communication, Canva/Gamma for visuals, AI safety, and classroom examples.',
  1,
  '90 minutes',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Skill: AI
INSERT INTO public.course_skills (
  course_id, skill_name, proficiency_level, type, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'HLPN2026-07' LIMIT 1),
  'AI',
  'Beginner',
  'soft',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Skill: Teaching
INSERT INTO public.course_skills (
  course_id, skill_name, proficiency_level, type, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'HLPN2026-07' LIMIT 1),
  'Teaching',
  'Intermediate',
  'soft',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Skill: ChatGPT
INSERT INTO public.course_skills (
  course_id, skill_name, proficiency_level, type, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'HLPN2026-07' LIMIT 1),
  'ChatGPT',
  'Intermediate',
  'soft',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Skill: Lesson Planning
INSERT INTO public.course_skills (
  course_id, skill_name, proficiency_level, type, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'HLPN2026-07' LIMIT 1),
  'Lesson Planning',
  'Intermediate',
  'soft',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Skill: Communication
INSERT INTO public.course_skills (
  course_id, skill_name, proficiency_level, type, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'HLPN2026-07' LIMIT 1),
  'Communication',
  'Intermediate',
  'soft',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: Educators Webinar
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'HLPN2026-07' LIMIT 1),
  'Educators Webinar',
  NOW()
) ON CONFLICT DO NOTHING;

COMMIT;
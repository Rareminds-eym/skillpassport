-- Insert Course: AI Tools for Teachers
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
  'AI Tools for Teachers',
  'AITT2026-28',
  'Free live webinar designed for teachers to learn practical AI tools for lesson planning, worksheets, quizzes, communication, and classroom productivity.',
  '1 Session',
  'Active',
  'Teacher Training',
  'technical',
  '["Use ChatGPT for lesson planning","Create worksheets and quizzes","Write parent messages and school notices","Create visuals using Canva/Gamma","Use AI safely in teaching"]'::jsonb,
  'https://storage-sp.rareminds.in/courses/AITT2026-19/thumbnail/image (1).png',
  'pending',
  'teacher',
  'freemium',
  'webinar',
  '2026-06-28',
  NOW(),
  NOW()
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: AI Tools for Teachers Webinar
INSERT INTO public.course_modules (
  course_id, 
  title, 
  description, 
  order_index, 
  skill_tags, 
  activities, 
  created_at, 
  updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'AITT2026-28' LIMIT 1),
  'AI Tools for Teachers Webinar',
  'Interactive webinar session introducing AI tools for teachers.',
  1,
  '["AI","Teaching","Productivity","Lesson Planning","ChatGPT","Canva","Gamma"]'::jsonb,
  '["Live Webinar","Q&A Session","Real Classroom Examples","Interactive Activities"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Teachers + AI for Better Tomorrow
INSERT INTO public.lessons (
  module_id, 
  title, 
  description, 
  content, 
  order_index, 
  duration, 
  created_at, 
  updated_at
) VALUES (
  (
    SELECT module_id 
    FROM public.course_modules 
    WHERE course_id = (
      SELECT course_id 
      FROM public.courses 
      WHERE code = 'AITT2026-28' 
      LIMIT 1
    )
    AND title = 'AI Tools for Teachers Webinar' 
    LIMIT 1
  ),
  'Teachers + AI for Better Tomorrow',
  'Learn practical AI tools to save time, create lesson plans, worksheets, quizzes, and improve communication with students and parents. Webinar conducted on 28 June 2026.',
  'Topics include ChatGPT for lesson planning, worksheet creation, parent communication, Canva/Gamma for visuals, AI safety, and classroom examples.',
  1,
  '90 minutes',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Resources: One PDF + One Video
INSERT INTO public.lesson_resources (
  resource_id,
  lesson_id,
  name,
  type,
  url,
  file_size,
  thumbnail_url,
  embed_url,
  order_index,
  created_at,
  content
) VALUES 
(
  gen_random_uuid(),
  (
    SELECT l.lesson_id
    FROM public.lessons l
    JOIN public.course_modules cm ON cm.module_id = l.module_id
    JOIN public.courses c ON c.course_id = cm.course_id
    WHERE c.code = 'AITT2026-28'
      AND l.title = 'Teachers + AI for Better Tomorrow'
    LIMIT 1
  ),
  'Webinar tool kit',
  'pdf',
  'https://storage-sp.rareminds.in/courses/AITT2026-19/doc/Webinar tool kit.pdf',
  NULL,
  NULL,
  NULL,
  0,
  NOW(),
  NULL
),
(
  gen_random_uuid(),
  (
    SELECT l.lesson_id
    FROM public.lessons l
    JOIN public.course_modules cm ON cm.module_id = l.module_id
    JOIN public.courses c ON c.course_id = cm.course_id
    WHERE c.code = 'AITT2026-28'
      AND l.title = 'Teachers + AI for Better Tomorrow'
    LIMIT 1
  ),
  'Webinar_1_2_LQ.mp4',
  'video',
  'https://storage-sp.rareminds.in/courses/AITT2026-14/video/Webinar_1_2_LQ.mp4',
  '60.8 MB',
  NULL,
  NULL,
  1,
  NOW(),
  NULL
)
ON CONFLICT DO NOTHING;

-- Insert Skill: AI
INSERT INTO public.course_skills (
  course_id, 
  skill_name, 
  proficiency_level, 
  type, 
  created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'AITT2026-28' LIMIT 1),
  'AI',
  'Beginner',
  'soft',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Skill: Teaching
INSERT INTO public.course_skills (
  course_id, 
  skill_name, 
  proficiency_level, 
  type, 
  created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'AITT2026-28' LIMIT 1),
  'Teaching',
  'Intermediate',
  'soft',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Skill: ChatGPT
INSERT INTO public.course_skills (
  course_id, 
  skill_name, 
  proficiency_level, 
  type, 
  created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'AITT2026-28' LIMIT 1),
  'ChatGPT',
  'Intermediate',
  'soft',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Skill: Lesson Planning
INSERT INTO public.course_skills (
  course_id, 
  skill_name, 
  proficiency_level, 
  type, 
  created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'AITT2026-28' LIMIT 1),
  'Lesson Planning',
  'Intermediate',
  'soft',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Skill: Communication
INSERT INTO public.course_skills (
  course_id, 
  skill_name, 
  proficiency_level, 
  type, 
  created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'AITT2026-28' LIMIT 1),
  'Communication',
  'Intermediate',
  'soft',
  NOW()
) ON CONFLICT DO NOTHING;

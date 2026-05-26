-- ============================================
-- COURSE DATA INSERTION SCRIPT (FIXED)
-- Generated from: COURSE_TEMPLATE_WITH_URLS.xlsx
-- Date: 2026-05-25T06:59:06.044Z
-- Fix: lesson_resources now correctly resolve lesson_id
--      scoped to each course via module -> course chain
-- ============================================

BEGIN;

-- ============================================
-- COURSE 1: AITT2026-14
-- ============================================

INSERT INTO public.courses (
  title, code, description, duration, status,
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, course_type, issued_on,
  created_at, updated_at
) VALUES (
  'AI Tools for Teachers',
  'AITT2026-14',
  'Free live webinar designed for teachers to learn practical AI tools for lesson planning, worksheets, quizzes, communication, and classroom productivity.',
  '1 Session',
  'Active',
  'Teacher Training',
  'technical',
  '["Use ChatGPT for lesson planning","Create worksheets and quizzes","Write parent messages and school notices","Create visuals using Canva/Gamma","Use AI safely in teaching"]'::jsonb,
  'https://thegreenminds.co.in/courses/AITT2026-17/thumbnail/image (1).png',
  'pending',
  'teacher',
  'freemium',
  'webinar',
  '2026-05-14',
  NOW(),
  NOW()
) ON CONFLICT (code) DO NOTHING;

INSERT INTO public.course_modules (
  course_id, title, description, order_index,
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'AITT2026-14' LIMIT 1),
  'AI Tools for Teachers Webinar',
  'Interactive webinar session introducing AI tools for teachers.',
  1,
  '["AI","Teaching","Productivity","Lesson Planning","ChatGPT","Canva","Gamma"]'::jsonb,
  '["Live Webinar","Q&A Session","Real Classroom Examples","Interactive Activities"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

INSERT INTO public.lessons (
  module_id, title, description, content,
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'AITT2026-14' LIMIT 1)
   AND title = 'AI Tools for Teachers Webinar' LIMIT 1),
  'Teachers + AI for Better Tomorrow',
  'Learn practical AI tools to save time, create lesson plans, worksheets, quizzes, and improve communication with students and parents. Webinar conducted on 17 May 2026.',
  'Topics include ChatGPT for lesson planning, worksheet creation, parent communication, Canva/Gamma for visuals, AI safety, and classroom examples.',
  1,
  '90 minutes',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- ✅ FIX: lesson_id resolved by scoping through module -> course (AITT2026-14)
INSERT INTO public.lesson_resources (
  lesson_id, name, type, url,
  order_index, created_at
) VALUES (
  (SELECT l.lesson_id FROM public.lessons l
   JOIN public.course_modules cm ON l.module_id = cm.module_id
   WHERE cm.course_id = (SELECT course_id FROM public.courses WHERE code = 'AITT2026-14' LIMIT 1)
   AND cm.title = 'AI Tools for Teachers Webinar'
   AND l.title = 'Teachers + AI for Better Tomorrow'
   LIMIT 1),
  'Webinar tool kit',
  'pdf',
  'https://thegreenminds.co.in/courses/AITT2026-17/doc/Webinar tool kit.pdf',
  0,
  NOW()
) ON CONFLICT DO NOTHING;

INSERT INTO public.course_skills (course_id, skill_name, proficiency_level, type, created_at) VALUES ((SELECT course_id FROM public.courses WHERE code = 'AITT2026-14' LIMIT 1), 'AI',              'Beginner',     'soft', NOW()) ON CONFLICT DO NOTHING;
INSERT INTO public.course_skills (course_id, skill_name, proficiency_level, type, created_at) VALUES ((SELECT course_id FROM public.courses WHERE code = 'AITT2026-14' LIMIT 1), 'Teaching',        'Intermediate', 'soft', NOW()) ON CONFLICT DO NOTHING;
INSERT INTO public.course_skills (course_id, skill_name, proficiency_level, type, created_at) VALUES ((SELECT course_id FROM public.courses WHERE code = 'AITT2026-14' LIMIT 1), 'ChatGPT',         'Intermediate', 'soft', NOW()) ON CONFLICT DO NOTHING;
INSERT INTO public.course_skills (course_id, skill_name, proficiency_level, type, created_at) VALUES ((SELECT course_id FROM public.courses WHERE code = 'AITT2026-14' LIMIT 1), 'Lesson Planning', 'Intermediate', 'soft', NOW()) ON CONFLICT DO NOTHING;
INSERT INTO public.course_skills (course_id, skill_name, proficiency_level, type, created_at) VALUES ((SELECT course_id FROM public.courses WHERE code = 'AITT2026-14' LIMIT 1), 'Communication',   'Intermediate', 'soft', NOW()) ON CONFLICT DO NOTHING;

INSERT INTO public.course_classes (course_id, class_name, created_at) VALUES ((SELECT course_id FROM public.courses WHERE code = 'AITT2026-14' LIMIT 1), 'Teachers', NOW()) ON CONFLICT DO NOTHING;


-- ============================================
-- COURSE 2: AITT2026-19
-- ============================================

INSERT INTO public.courses (
  title, code, description, duration, status,
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, course_type, issued_on,
  created_at, updated_at
) VALUES (
  'AI Tools for Teachers',
  'AITT2026-19',
  'Free live webinar designed for teachers to learn practical AI tools for lesson planning, worksheets, quizzes, communication, and classroom productivity.',
  '1 Session',
  'Active',
  'Teacher Training',
  'technical',
  '["Use ChatGPT for lesson planning","Create worksheets and quizzes","Write parent messages and school notices","Create visuals using Canva/Gamma","Use AI safely in teaching"]'::jsonb,
  'https://thegreenminds.co.in/courses/AITT2026-19/thumbnail/image (1).png',
  'pending',
  'teacher',
  'freemium',
  'webinar',
  '2026-05-19',
  NOW(),
  NOW()
) ON CONFLICT (code) DO NOTHING;

INSERT INTO public.course_modules (
  course_id, title, description, order_index,
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'AITT2026-19' LIMIT 1),
  'AI Tools for Teachers Webinar',
  'Interactive webinar session introducing AI tools for teachers.',
  1,
  '["AI","Teaching","Productivity","Lesson Planning","ChatGPT","Canva","Gamma"]'::jsonb,
  '["Live Webinar","Q&A Session","Real Classroom Examples","Interactive Activities"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

INSERT INTO public.lessons (
  module_id, title, description, content,
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'AITT2026-19' LIMIT 1)
   AND title = 'AI Tools for Teachers Webinar' LIMIT 1),
  'Teachers + AI for Better Tomorrow',
  'Learn practical AI tools to save time, create lesson plans, worksheets, quizzes, and improve communication with students and parents. Webinar conducted on 19 May 2026.',
  'Topics include ChatGPT for lesson planning, worksheet creation, parent communication, Canva/Gamma for visuals, AI safety, and classroom examples.',
  1,
  '90 minutes',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- ✅ FIX: lesson_id resolved by scoping through module -> course (AITT2026-19)
INSERT INTO public.lesson_resources (
  lesson_id, name, type, url,
  order_index, created_at
) VALUES (
  (SELECT l.lesson_id FROM public.lessons l
   JOIN public.course_modules cm ON l.module_id = cm.module_id
   WHERE cm.course_id = (SELECT course_id FROM public.courses WHERE code = 'AITT2026-19' LIMIT 1)
   AND cm.title = 'AI Tools for Teachers Webinar'
   AND l.title = 'Teachers + AI for Better Tomorrow'
   LIMIT 1),
  'Webinar tool kit',
  'pdf',
  'https://thegreenminds.co.in/courses/AITT2026-19/doc/Webinar tool kit.pdf',
  0,
  NOW()
) ON CONFLICT DO NOTHING;

INSERT INTO public.course_skills (course_id, skill_name, proficiency_level, type, created_at) VALUES ((SELECT course_id FROM public.courses WHERE code = 'AITT2026-19' LIMIT 1), 'AI',              'Beginner',     'soft', NOW()) ON CONFLICT DO NOTHING;
INSERT INTO public.course_skills (course_id, skill_name, proficiency_level, type, created_at) VALUES ((SELECT course_id FROM public.courses WHERE code = 'AITT2026-19' LIMIT 1), 'Teaching',        'Intermediate', 'soft', NOW()) ON CONFLICT DO NOTHING;
INSERT INTO public.course_skills (course_id, skill_name, proficiency_level, type, created_at) VALUES ((SELECT course_id FROM public.courses WHERE code = 'AITT2026-19' LIMIT 1), 'ChatGPT',         'Intermediate', 'soft', NOW()) ON CONFLICT DO NOTHING;
INSERT INTO public.course_skills (course_id, skill_name, proficiency_level, type, created_at) VALUES ((SELECT course_id FROM public.courses WHERE code = 'AITT2026-19' LIMIT 1), 'Lesson Planning', 'Intermediate', 'soft', NOW()) ON CONFLICT DO NOTHING;
INSERT INTO public.course_skills (course_id, skill_name, proficiency_level, type, created_at) VALUES ((SELECT course_id FROM public.courses WHERE code = 'AITT2026-19' LIMIT 1), 'Communication',   'Intermediate', 'soft', NOW()) ON CONFLICT DO NOTHING;

INSERT INTO public.course_classes (course_id, class_name, created_at) VALUES ((SELECT course_id FROM public.courses WHERE code = 'AITT2026-19' LIMIT 1), 'Teachers', NOW()) ON CONFLICT DO NOTHING;


-- ============================================
-- COURSE 3: AITT2026-23
-- ============================================

INSERT INTO public.courses (
  title, code, description, duration, status,
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, course_type, issued_on,
  created_at, updated_at
) VALUES (
  'AI Tools for Teachers',
  'AITT2026-23',
  'Free live webinar designed for teachers to learn practical AI tools for lesson planning, worksheets, quizzes, communication, and classroom productivity.',
  '1 Session',
  'Active',
  'Teacher Training',
  'technical',
  '["Use ChatGPT for lesson planning","Create worksheets and quizzes","Write parent messages and school notices","Create visuals using Canva/Gamma","Use AI safely in teaching"]'::jsonb,
  'https://thegreenminds.co.in/courses/AITT2026-21/thumbnail/image (1).png',
  'pending',
  'teacher',
  'freemium',
  'webinar',
  '2026-05-23',
  NOW(),
  NOW()
) ON CONFLICT (code) DO NOTHING;

INSERT INTO public.course_modules (
  course_id, title, description, order_index,
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'AITT2026-23' LIMIT 1),
  'AI Tools for Teachers Webinar',
  'Interactive webinar session introducing AI tools for teachers.',
  1,
  '["AI","Teaching","Productivity","Lesson Planning","ChatGPT","Canva","Gamma"]'::jsonb,
  '["Live Webinar","Q&A Session","Real Classroom Examples","Interactive Activities"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

INSERT INTO public.lessons (
  module_id, title, description, content,
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'AITT2026-23' LIMIT 1)
   AND title = 'AI Tools for Teachers Webinar' LIMIT 1),
  'Teachers + AI for Better Tomorrow',
  'Learn practical AI tools to save time, create lesson plans, worksheets, quizzes, and improve communication with students and parents. Webinar conducted on 21 May 2026.',
  'Topics include ChatGPT for lesson planning, worksheet creation, parent communication, Canva/Gamma for visuals, AI safety, and classroom examples.',
  1,
  '90 minutes',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- ✅ FIX: lesson_id resolved by scoping through module -> course (AITT2026-23)
INSERT INTO public.lesson_resources (
  lesson_id, name, type, url,
  order_index, created_at
) VALUES (
  (SELECT l.lesson_id FROM public.lessons l
   JOIN public.course_modules cm ON l.module_id = cm.module_id
   WHERE cm.course_id = (SELECT course_id FROM public.courses WHERE code = 'AITT2026-23' LIMIT 1)
   AND cm.title = 'AI Tools for Teachers Webinar'
   AND l.title = 'Teachers + AI for Better Tomorrow'
   LIMIT 1),
  'Webinar tool kit',
  'pdf',
  'https://thegreenminds.co.in/courses/AITT2026-21/doc/Webinar tool kit.pdf',
  0,
  NOW()
) ON CONFLICT DO NOTHING;

INSERT INTO public.course_skills (course_id, skill_name, proficiency_level, type, created_at) VALUES ((SELECT course_id FROM public.courses WHERE code = 'AITT2026-23' LIMIT 1), 'AI',              'Beginner',     'soft', NOW()) ON CONFLICT DO NOTHING;
INSERT INTO public.course_skills (course_id, skill_name, proficiency_level, type, created_at) VALUES ((SELECT course_id FROM public.courses WHERE code = 'AITT2026-23' LIMIT 1), 'Teaching',        'Intermediate', 'soft', NOW()) ON CONFLICT DO NOTHING;
INSERT INTO public.course_skills (course_id, skill_name, proficiency_level, type, created_at) VALUES ((SELECT course_id FROM public.courses WHERE code = 'AITT2026-23' LIMIT 1), 'ChatGPT',         'Intermediate', 'soft', NOW()) ON CONFLICT DO NOTHING;
INSERT INTO public.course_skills (course_id, skill_name, proficiency_level, type, created_at) VALUES ((SELECT course_id FROM public.courses WHERE code = 'AITT2026-23' LIMIT 1), 'Lesson Planning', 'Intermediate', 'soft', NOW()) ON CONFLICT DO NOTHING;
INSERT INTO public.course_skills (course_id, skill_name, proficiency_level, type, created_at) VALUES ((SELECT course_id FROM public.courses WHERE code = 'AITT2026-23' LIMIT 1), 'Communication',   'Intermediate', 'soft', NOW()) ON CONFLICT DO NOTHING;

INSERT INTO public.course_classes (course_id, class_name, created_at) VALUES ((SELECT course_id FROM public.courses WHERE code = 'AITT2026-23' LIMIT 1), 'Teachers', NOW()) ON CONFLICT DO NOTHING;

COMMIT;
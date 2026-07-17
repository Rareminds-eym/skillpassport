-- ============================================
-- SEED FILE: DEMO COURSES INSERTION SCRIPT
-- ============================================

BEGIN;

-- =========================================================
-- Course 1: Python for a Smarter School
-- =========================================================
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
  is_demo,
  created_at, 
  updated_at
) VALUES (
  'Python for a Smarter School',
  'CS-PY-SMART-SCHOOL-L1-M1-2026',
  'A subject-based interdisciplinary applied-learning module for Grades 6-8. Learners take the role of Junior School Data Developers and define how a Python-based School Insight Tool should use seven days of fictional school data to support evidence-based checking and decision-making. Python remains the primary subject, while mathematics, environmental science, data literacy, communication and design provide the application context.',
  '60 Minutes',
  'Active',
  'School Education | Computer Science | Python',
  'technical',
  '["Explain why the school needs a Python-based tool","Identify the school problem without making unsupported claims","Recognise the input, process and output of the planned program","Distinguish visible data from assumptions and recommendations","Create a complete Program Planning Card","Add a bounded practice warning requirement","Revise the plan after checking evidence and acceptance criteria"]'::jsonb,
  'https://storage-sp.rareminds.in/courses/Default/default.jpg',
  'approved',
  'middle_school',
  'premium',
  'course',
  NULL,
  true,
  NOW(),
  NOW()
) ON CONFLICT (code) DO NOTHING;

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
  (SELECT course_id FROM public.courses WHERE code = 'CS-PY-SMART-SCHOOL-L1-M1-2026' LIMIT 1),
  'Module 1 - Understand the School Data Mission',
  'Learners investigate why seven days of separate school records are difficult to use and plan the first component of a Python-based School Insight Tool. They identify the data needed, what Python must calculate, compare or check, what the tool should display, what decision it should support and what it must not claim without evidence.',
  1,
  '["Python Readiness","Input-Process-Output","Problem Decomposition","Data Observation","Evidence Reasoning","Critical Thinking","Program Planning","Responsible AI Use","Technical Communication"]'::jsonb,
  '["Engage: Examine the school request and identify the decision need","Explore: Inspect the fictional seven-day dataset and separate fact, unknown and question","Explain: Connect input, process, output and recommendation to simple Python previews","Express: Complete the eight-field Program Planning Card","Empower: Add a school-defined practice warning rule and review an AI suggestion","Evolve: Repair a defective plan, apply the acceptance gate and prepare approved fields for Module 2"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

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
      WHERE code = 'CS-PY-SMART-SCHOOL-L1-M1-2026' 
      LIMIT 1
    )
    AND title = 'Module 1 - Understand the School Data Mission' 
    LIMIT 1
  ),
  'How Should We Plan the School Insight Tool?',
  'A complete nested 6E learner experience in one module deck. Learners analyse a fictional school dataset, understand the purpose of a Python program, classify inputs and processes, complete a standard eight-field Program Planning Card, add a controlled warning requirement, review privacy and AI-use boundaries, and revise the artifact before moving to Module 2.',
  'Engage -> understand the school request and record the problem|Explore -> inspect seven-day water, electricity, waste, temperature and attendance values without assuming causes|Explain -> trace a small input-process-output example and preview Python constructs such as lists, max(), comparisons and if|Express -> complete the Program Planning Card fields: school problem, input data, process, output, decision supported, evidence boundary, opening message and warning requirement|Empower -> add a practice limit while recognising that real limits are set by the school or administrator; check an AI-generated suggestion and protect real school data|Evolve -> repair weak fields, document one revision and pass the rule that all acceptance boxes must be checked before Module 2',
  1,
  '60 minutes',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

INSERT INTO public.lesson_resources (
  lesson_id, 
  name, 
  type, 
  url,
  order_index, 
  created_at
) VALUES (
  (
    SELECT l.lesson_id
    FROM public.lessons l
    JOIN public.course_modules cm ON cm.module_id = l.module_id
    JOIN public.courses c ON c.course_id = cm.course_id
    WHERE c.code = 'CS-PY-SMART-SCHOOL-L1-M1-2026'
      AND l.title = 'How Should We Plan the School Insight Tool?'
    LIMIT 1
  ),
  'CS-PY-SMART-SCHOOL-L1-M1-2026-DOC',
  'document',
  'https://storage-sp.rareminds.in/courses/CS-PY-SMART-SCHOOL-L1-M1-2026/doc/Python_Module1_Program_Planning_Card_Artifact_Portrait.pdf',
  0,
  NOW()
) ON CONFLICT DO NOTHING;

INSERT INTO public.lesson_resources (
  lesson_id, 
  name, 
  type, 
  url,
  order_index, 
  created_at
) VALUES (
  (
    SELECT l.lesson_id
    FROM public.lessons l
    JOIN public.course_modules cm ON cm.module_id = l.module_id
    JOIN public.courses c ON c.course_id = cm.course_id
    WHERE c.code = 'CS-PY-SMART-SCHOOL-L1-M1-2026'
      AND l.title = 'How Should We Plan the School Insight Tool?'
    LIMIT 1
  ),
  'CS-PY-SMART-SCHOOL-L1-M1-2026-PPT',
  'document',
  'https://storage-sp.rareminds.in/courses/CS-PY-SMART-SCHOOL-L1-M1-2026/ppt/Python_Module1_Single_6E_Learner_Deck_CORRECTED_v6.pptx',
  1,
  NOW()
) ON CONFLICT DO NOTHING;

INSERT INTO public.course_skills (
  course_id, skill_name, proficiency_level, type, created_at
) VALUES
((SELECT course_id FROM public.courses WHERE code = 'CS-PY-SMART-SCHOOL-L1-M1-2026' LIMIT 1), 'Python Program Planning', 'Applied', 'soft', NOW()),
((SELECT course_id FROM public.courses WHERE code = 'CS-PY-SMART-SCHOOL-L1-M1-2026' LIMIT 1), 'Input-Process-Output Classification', 'Intermediate', 'soft', NOW()),
((SELECT course_id FROM public.courses WHERE code = 'CS-PY-SMART-SCHOOL-L1-M1-2026' LIMIT 1), 'Data Observation', 'Intermediate', 'soft', NOW()),
((SELECT course_id FROM public.courses WHERE code = 'CS-PY-SMART-SCHOOL-L1-M1-2026' LIMIT 1), 'Evidence and Assumption Separation', 'Intermediate', 'soft', NOW()),
((SELECT course_id FROM public.courses WHERE code = 'CS-PY-SMART-SCHOOL-L1-M1-2026' LIMIT 1), 'Problem Decomposition', 'Intermediate', 'soft', NOW()),
((SELECT course_id FROM public.courses WHERE code = 'CS-PY-SMART-SCHOOL-L1-M1-2026' LIMIT 1), 'Technical Communication', 'Intermediate', 'soft', NOW()),
((SELECT course_id FROM public.courses WHERE code = 'CS-PY-SMART-SCHOOL-L1-M1-2026' LIMIT 1), 'Responsible AI Use', 'Intermediate', 'soft', NOW()),
((SELECT course_id FROM public.courses WHERE code = 'CS-PY-SMART-SCHOOL-L1-M1-2026' LIMIT 1), 'Artifact Revision', 'Intermediate', 'soft', NOW())
ON CONFLICT DO NOTHING;

INSERT INTO public.course_classes (
  course_id, 
  class_name, 
  created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CS-PY-SMART-SCHOOL-L1-M1-2026' LIMIT 1),
  'Grades 8',
  NOW()
) ON CONFLICT DO NOTHING;


-- =========================================================
-- Course 2: Climate-Ready School Biodiversity Zone
-- =========================================================
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
  is_demo,
  created_at, 
  updated_at
) VALUES (
  'Climate-Ready School Biodiversity Zone',
  'SCI-ECO-CRBZ-L1-2026',
  'A subject-based interdisciplinary applied-learning course in which Grades 6-8 learners use ecosystem science and school-campus evidence to redesign one space so that it can support biodiversity, respond to changing environmental conditions, and continue functioning over time.',
  '7 Hours',
  'Active',
  'School Education | Science | Ecosystems',
  'technical',
  '["Identify biotic and abiotic factors","Explain habitats, biodiversity, food chains, food webs and interdependence","Collect and interpret ecosystem evidence","Analyse how heat, water, soil, shade and human activity affect organisms","Compare ecosystem interventions","Design a climate-ready school biodiversity zone","Create a monitoring plan and justify decisions with evidence"]'::jsonb,
  'https://storage-sp.rareminds.in/courses/Default/default.jpg',
  'approved',
  'middle_school',
  'premium',
  'course',
  NULL,
  true,
  NOW(),
  NOW()
) ON CONFLICT (code) DO NOTHING;

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
  (SELECT course_id FROM public.courses WHERE code = 'SCI-ECO-CRBZ-L1-2026' LIMIT 1),
  'Module 1 - What Is Changing in Our School Space?',
  'Learners investigate visible changes in a selected school space and separate direct evidence from assumptions before suggesting any solution.',
  1,
  '["Scientific Observation","Evidence Reasoning","Scientific Questioning","Critical Thinking","Spatial Awareness","Scientific Communication"]'::jsonb,
  '["Engage: Notice the changing site","Explore: Examine photos, counts and measurements","Explain: Distinguish evidence, inference and assumption","Express: Build a site-change record","Empower: Select the next investigation priority","Evolve: Audit and improve the record"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

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
      WHERE code = 'SCI-ECO-CRBZ-L1-2026' 
      LIMIT 1
    )
    AND title = 'Module 1 - What Is Changing in Our School Space?' 
    LIMIT 1
  ),
  'What Evidence Shows That the Space Is Changing?',
  'A complete 6E-aligned investigation in one learner deck. Learners observe, classify evidence, mark site conditions, identify missing evidence and recommend the next scientific investigation.',
  'Engage -> observe the site without choosing a cause|Explore -> examine temperature, shade, surface and organism evidence|Explain -> learn evidence, inference, assumption, biotic and abiotic indicators|Express -> create a Site Change Investigation Record|Empower -> prioritise the next investigation|Evolve -> revise unsupported claims and prepare for Module 2',
  1,
  '60 minutes',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

INSERT INTO public.lesson_resources (
  lesson_id, 
  name, 
  type, 
  url,
  order_index, 
  created_at
) VALUES (
  (
    SELECT l.lesson_id
    FROM public.lessons l
    JOIN public.course_modules cm ON cm.module_id = l.module_id
    JOIN public.courses c ON c.course_id = cm.course_id
    WHERE c.code = 'SCI-ECO-CRBZ-L1-2026'
      AND l.title = 'What Evidence Shows That the Space Is Changing?'
    LIMIT 1
  ),
  'SCI-ECO-CRBZ-L1-2026-DOC',
  'document',
  'https://storage-sp.rareminds.in/courses/SCI-ECO-CRBZ-L1-2026/doc/Module1_Site_Change_Investigation_Sample_Artifact.docx',
  0,
  NOW()
) ON CONFLICT DO NOTHING;

INSERT INTO public.lesson_resources (
  lesson_id, 
  name, 
  type, 
  url,
  order_index, 
  created_at
) VALUES (
  (
    SELECT l.lesson_id
    FROM public.lessons l
    JOIN public.course_modules cm ON cm.module_id = l.module_id
    JOIN public.courses c ON c.course_id = cm.course_id
    WHERE c.code = 'SCI-ECO-CRBZ-L1-2026'
      AND l.title = 'What Evidence Shows That the Space Is Changing?'
    LIMIT 1
  ),
  'SCI-ECO-CRBZ-L1-2026-PPT',
  'document',
  'https://storage-sp.rareminds.in/courses/SCI-ECO-CRBZ-L1-2026/ppt/What-Is-Changing-in-Our-School-Space.pptx',
  1,
  NOW()
) ON CONFLICT DO NOTHING;

INSERT INTO public.course_skills (
  course_id, skill_name, proficiency_level, type, created_at
) VALUES
((SELECT course_id FROM public.courses WHERE code = 'SCI-ECO-CRBZ-L1-2026' LIMIT 1), 'Scientific Observation', 'Foundation', 'soft', NOW()),
((SELECT course_id FROM public.courses WHERE code = 'SCI-ECO-CRBZ-L1-2026' LIMIT 1), 'Evidence Reasoning', 'Applied', 'soft', NOW()),
((SELECT course_id FROM public.courses WHERE code = 'SCI-ECO-CRBZ-L1-2026' LIMIT 1), 'Critical Thinking', 'Intermediate', 'soft', NOW()),
((SELECT course_id FROM public.courses WHERE code = 'SCI-ECO-CRBZ-L1-2026' LIMIT 1), 'Scientific Questioning', 'Intermediate', 'soft', NOW()),
((SELECT course_id FROM public.courses WHERE code = 'SCI-ECO-CRBZ-L1-2026' LIMIT 1), 'Data Recording', 'Intermediate', 'soft', NOW()),
((SELECT course_id FROM public.courses WHERE code = 'SCI-ECO-CRBZ-L1-2026' LIMIT 1), 'Scientific Communication', 'Intermediate', 'soft', NOW())
ON CONFLICT DO NOTHING;

INSERT INTO public.course_classes (
  course_id, 
  class_name, 
  created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'SCI-ECO-CRBZ-L1-2026' LIMIT 1),
  'Grades 8',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Resource: 1sfyJlbNvGuJcIVWZTzyC-AAT3OANYAS0
INSERT INTO public.lesson_resources (
  lesson_id, name, type, url,
  order_index, created_at
) VALUES (
  (SELECT lesson_id FROM public.lessons WHERE title = 'What Evidence Shows That the Space Is Changing?' LIMIT 1),
  '1sfyJlbNvGuJcIVWZTzyC-AAT3OANYAS0',
  'video',
  'https://storage-sp.rareminds.in/courses/SCI-ECO-CRBZ-L1-2026/video/Climate%20Ready%20Video.mp4',
  0,
  NOW()
) ON CONFLICT DO NOTHING;


COMMIT;
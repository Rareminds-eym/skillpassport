-- ============================================
-- COURSE DATA INSERTION SCRIPT
-- Generated from: COURSE_TEMPLATE_WITH_URLS.xlsx
-- Date: 2026-05-19T08:15:25.960Z
-- ============================================

BEGIN;

-- Insert Course: KG English Syllabus Coverage
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, created_at, updated_at
) VALUES (
  'KG English Syllabus Coverage',
  'KGENG001',
  'CBSE KG English course covering alphabet recognition, phonics, vocabulary, rhymes, listening and speaking skills, simple sentences, good habits, safety, and community helpers for Academic Year 2025-26.',
  '168 periods',
  'Active',
  'KG English',
  'technical',
  '["Recognize and write letters A-Z","Use phonics and simple CVC blending","Build age-appropriate vocabulary","Recite rhymes and respond to stories","Use simple English sentences in everyday contexts","Practice listening and speaking skills"]'::jsonb,
  NULL,
  'pending',
  'teacher',
  NOW(),
  NOW()
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: Unit 1: Letters A-Z (Recognition, Writing & Phonics)
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'KGENG001' LIMIT 1),
  'Unit 1: Letters A-Z (Recognition, Writing & Phonics)',
  'Term 1 module for Letters A-Z (Recognition, Writing & Phonics).',
  1,
  '["English","KG","Language","Alphabet Recognition","Phonics","Writing"]'::jsonb,
  '["Lesson Plan","Worksheet","Study Notes","Assessment","Answer Key"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Chapter 1: Letters A to M
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'KGENG001' LIMIT 1)
   AND title = 'Unit 1: Letters A-Z (Recognition, Writing & Phonics)' LIMIT 1),
  'Chapter 1: Letters A to M',
  'Recognize and identify letters A to M | Write uppercase and lowercase letters A-M | Associate each letter with its phonic sound | Identify words starting with each letter',
  'Term 1; Unit 1: Letters A-Z (Recognition, Writing & Phonics). Learning outcomes: Recognize and identify letters A to M; Write uppercase and lowercase letters A-M; Associate each letter with its phonic sound; Identify words starting with each letter. Planned resources: Lesson Plan, Worksheet, Study Notes, Assessment, Answer Key. Coverage status: Not Started.',
  1,
  '15 periods',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Resource: KG_English_Chapter_1_Letters_A_to_M_Lesson_Plan
INSERT INTO public.lesson_resources (
  lesson_id, name, type, url,
  order_index, created_at
) VALUES (
  (SELECT lesson_id FROM public.lessons WHERE title = 'Chapter 1: Letters A to M' LIMIT 1),
  'KG_English_Chapter_1_Letters_A_to_M_Lesson_Plan',
  'document',
  'https://thegreenminds.co.in/courses/KGENG001/doc/KG_English_Chapter_1_Letters_A_to_M_Lesson_Plan.docx',
  0,
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Resource: KG_English_Chapter_1_Letters_A_to_M_Worksheet
INSERT INTO public.lesson_resources (
  lesson_id, name, type, url,
  order_index, created_at
) VALUES (
  (SELECT lesson_id FROM public.lessons WHERE title = 'Chapter 1: Letters A to M' LIMIT 1),
  'KG_English_Chapter_1_Letters_A_to_M_Worksheet',
  'document',
  'https://thegreenminds.co.in/courses/KGENG001/doc/KG_English_Chapter_1_Letters_A_to_M_Worksheet.docx',
  1,
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Resource: KG_English_Chapter_1_Letters_A_to_M_Study_Notes
INSERT INTO public.lesson_resources (
  lesson_id, name, type, url,
  order_index, created_at
) VALUES (
  (SELECT lesson_id FROM public.lessons WHERE title = 'Chapter 1: Letters A to M' LIMIT 1),
  'KG_English_Chapter_1_Letters_A_to_M_Study_Notes',
  'document',
  'https://thegreenminds.co.in/courses/KGENG001/doc/KG_English_Chapter_1_Letters_A_to_M_Study_Notes.docx',
  2,
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Resource: KG_English_Chapter_1_Letters_A_to_M_Assessment
INSERT INTO public.lesson_resources (
  lesson_id, name, type, url,
  order_index, created_at
) VALUES (
  (SELECT lesson_id FROM public.lessons WHERE title = 'Chapter 1: Letters A to M' LIMIT 1),
  'KG_English_Chapter_1_Letters_A_to_M_Assessment',
  'document',
  'https://thegreenminds.co.in/courses/KGENG001/doc/KG_English_Chapter_1_Letters_A_to_M_Assessment.docx',
  3,
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Chapter 2: Letters N to Z
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'KGENG001' LIMIT 1)
   AND title = 'Unit 1: Letters A-Z (Recognition, Writing & Phonics)' LIMIT 1),
  'Chapter 2: Letters N to Z',
  'Recognize and identify letters N to Z | Write uppercase and lowercase letters N-Z | Associate each letter with its phonic sound | Complete the full alphabet A-Z',
  'Term 1; Unit 1: Letters A-Z (Recognition, Writing & Phonics). Learning outcomes: Recognize and identify letters N to Z; Write uppercase and lowercase letters N-Z; Associate each letter with its phonic sound; Complete the full alphabet A-Z. Planned resources: Lesson Plan, Worksheet, Study Notes, Assessment, Answer Key. Coverage status: Not Started.',
  2,
  '15 periods',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Resource: KG_English_Chapter_2_Letters_N_to_Z_Lesson_Plan
INSERT INTO public.lesson_resources (
  lesson_id, name, type, url,
  order_index, created_at
) VALUES (
  (SELECT lesson_id FROM public.lessons WHERE title = 'Chapter 2: Letters N to Z' LIMIT 1),
  'KG_English_Chapter_2_Letters_N_to_Z_Lesson_Plan',
  'document',
  'https://thegreenminds.co.in/courses/KGENG001/doc/KG_English_Chapter_2_Letters_N_to_Z_Lesson_Plan.docx',
  0,
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Resource: KG_English_Chapter_2_Letters_N_to_Z_Worksheet
INSERT INTO public.lesson_resources (
  lesson_id, name, type, url,
  order_index, created_at
) VALUES (
  (SELECT lesson_id FROM public.lessons WHERE title = 'Chapter 2: Letters N to Z' LIMIT 1),
  'KG_English_Chapter_2_Letters_N_to_Z_Worksheet',
  'document',
  'https://thegreenminds.co.in/courses/KGENG001/doc/KG_English_Chapter_2_Letters_N_to_Z_Worksheet.docx',
  1,
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Resource: KG_English_Chapter_2_Letters_N_to_Z_Study_Notes
INSERT INTO public.lesson_resources (
  lesson_id, name, type, url,
  order_index, created_at
) VALUES (
  (SELECT lesson_id FROM public.lessons WHERE title = 'Chapter 2: Letters N to Z' LIMIT 1),
  'KG_English_Chapter_2_Letters_N_to_Z_Study_Notes',
  'document',
  'https://thegreenminds.co.in/courses/KGENG001/doc/KG_English_Chapter_2_Letters_N_to_Z_Study_Notes.docx',
  2,
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Resource: KG_English_Chapter_2_Letters_N_to_Z_Assessment
INSERT INTO public.lesson_resources (
  lesson_id, name, type, url,
  order_index, created_at
) VALUES (
  (SELECT lesson_id FROM public.lessons WHERE title = 'Chapter 2: Letters N to Z' LIMIT 1),
  'KG_English_Chapter_2_Letters_N_to_Z_Assessment',
  'document',
  'https://thegreenminds.co.in/courses/KGENG001/doc/KG_English_Chapter_2_Letters_N_to_Z_Assessment.docx',
  3,
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Chapter 3: Phonics & Letter Sounds
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'KGENG001' LIMIT 1)
   AND title = 'Unit 1: Letters A-Z (Recognition, Writing & Phonics)' LIMIT 1),
  'Chapter 3: Phonics & Letter Sounds',
  'Produce correct phonic sounds for all 26 letters | Distinguish between vowel and consonant sounds | Blend sounds to form simple CVC words | Identify beginning and ending sounds in words',
  'Term 1; Unit 1: Letters A-Z (Recognition, Writing & Phonics). Learning outcomes: Produce correct phonic sounds for all 26 letters; Distinguish between vowel and consonant sounds; Blend sounds to form simple CVC words; Identify beginning and ending sounds in words. Planned resources: Lesson Plan, Worksheet, Study Notes, Assessment, Answer Key. Coverage status: Not Started.',
  3,
  '12 periods',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Resource: KG_English_Chapter_3_Phonics_&_Letter_Sounds_Lesson_Plan
INSERT INTO public.lesson_resources (
  lesson_id, name, type, url,
  order_index, created_at
) VALUES (
  (SELECT lesson_id FROM public.lessons WHERE title = 'Chapter 3: Phonics & Letter Sounds' LIMIT 1),
  'KG_English_Chapter_3_Phonics_&_Letter_Sounds_Lesson_Plan',
  'document',
  'https://thegreenminds.co.in/courses/KGENG001/doc/KG_English_Chapter_3_Phonics_&_Letter_Sounds_Lesson_Plan.docx',
  0,
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Resource: KG_English_Chapter_3_Phonics_&_Letter_Sounds_Worksheet
INSERT INTO public.lesson_resources (
  lesson_id, name, type, url,
  order_index, created_at
) VALUES (
  (SELECT lesson_id FROM public.lessons WHERE title = 'Chapter 3: Phonics & Letter Sounds' LIMIT 1),
  'KG_English_Chapter_3_Phonics_&_Letter_Sounds_Worksheet',
  'document',
  'https://thegreenminds.co.in/courses/KGENG001/doc/KG_English_Chapter_3_Phonics_&_Letter_Sounds_Worksheet.docx',
  1,
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Resource: KG_English_Chapter_3_Phonics_&_Letter_Sounds_Study_Notes
INSERT INTO public.lesson_resources (
  lesson_id, name, type, url,
  order_index, created_at
) VALUES (
  (SELECT lesson_id FROM public.lessons WHERE title = 'Chapter 3: Phonics & Letter Sounds' LIMIT 1),
  'KG_English_Chapter_3_Phonics_&_Letter_Sounds_Study_Notes',
  'document',
  'https://thegreenminds.co.in/courses/KGENG001/doc/KG_English_Chapter_3_Phonics_&_Letter_Sounds_Study_Notes.docx',
  2,
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Resource: KG_English_Chapter_3_Phonics_&_Letter_Sounds_Assessment
INSERT INTO public.lesson_resources (
  lesson_id, name, type, url,
  order_index, created_at
) VALUES (
  (SELECT lesson_id FROM public.lessons WHERE title = 'Chapter 3: Phonics & Letter Sounds' LIMIT 1),
  'KG_English_Chapter_3_Phonics_&_Letter_Sounds_Assessment',
  'document',
  'https://thegreenminds.co.in/courses/KGENG001/doc/KG_English_Chapter_3_Phonics_&_Letter_Sounds_Assessment.docx',
  3,
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Module: Unit 2: Myself, Family & School
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'KGENG001' LIMIT 1),
  'Unit 2: Myself, Family & School',
  'Term 1 module for Myself, Family & School.',
  2,
  '["English","KG","Language","Vocabulary","Speaking","Sentence Formation"]'::jsonb,
  '["Lesson Plan","Worksheet","Study Notes","Assessment","Answer Key"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Chapter 4: About Myself
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'KGENG001' LIMIT 1)
   AND title = 'Unit 2: Myself, Family & School' LIMIT 1),
  'Chapter 4: About Myself',
  'Introduce oneself by name | Say and write one''s name | Identify personal details (name, age) | Use ''I am...'' sentences',
  'Term 1; Unit 2: Myself, Family & School. Learning outcomes: Introduce oneself by name; Say and write one''s name; Identify personal details (name, age); Use ''I am...'' sentences. Planned resources: Lesson Plan, Worksheet, Study Notes, Assessment, Answer Key. Coverage status: Not Started.',
  1,
  '8 periods',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Resource: KG_English_Chapter_4_About_Myself_Lesson_Plan
INSERT INTO public.lesson_resources (
  lesson_id, name, type, url,
  order_index, created_at
) VALUES (
  (SELECT lesson_id FROM public.lessons WHERE title = 'Chapter 4: About Myself' LIMIT 1),
  'KG_English_Chapter_4_About_Myself_Lesson_Plan',
  'document',
  'https://thegreenminds.co.in/courses/KGENG001/doc/KG_English_Chapter_4_About_Myself_Lesson_Plan.docx',
  0,
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Resource: KG_English_Chapter_4_About_Myself_Worksheet
INSERT INTO public.lesson_resources (
  lesson_id, name, type, url,
  order_index, created_at
) VALUES (
  (SELECT lesson_id FROM public.lessons WHERE title = 'Chapter 4: About Myself' LIMIT 1),
  'KG_English_Chapter_4_About_Myself_Worksheet',
  'document',
  'https://thegreenminds.co.in/courses/KGENG001/doc/KG_English_Chapter_4_About_Myself_Worksheet.docx',
  1,
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Resource: KG_English_Chapter_4_About_Myself_Study_Notes
INSERT INTO public.lesson_resources (
  lesson_id, name, type, url,
  order_index, created_at
) VALUES (
  (SELECT lesson_id FROM public.lessons WHERE title = 'Chapter 4: About Myself' LIMIT 1),
  'KG_English_Chapter_4_About_Myself_Study_Notes',
  'document',
  'https://thegreenminds.co.in/courses/KGENG001/doc/KG_English_Chapter_4_About_Myself_Study_Notes.docx',
  2,
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Resource: KG_English_Chapter_4_About_Myself_Assessment
INSERT INTO public.lesson_resources (
  lesson_id, name, type, url,
  order_index, created_at
) VALUES (
  (SELECT lesson_id FROM public.lessons WHERE title = 'Chapter 4: About Myself' LIMIT 1),
  'KG_English_Chapter_4_About_Myself_Assessment',
  'document',
  'https://thegreenminds.co.in/courses/KGENG001/doc/KG_English_Chapter_4_About_Myself_Assessment.docx',
  3,
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Chapter 5: My Family
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'KGENG001' LIMIT 1)
   AND title = 'Unit 2: Myself, Family & School' LIMIT 1),
  'Chapter 5: My Family',
  'Identify family members | Use vocabulary: mother, father, brother, sister, grandmother, grandfather | Draw and label family members | Use ''This is my...'' sentences',
  'Term 1; Unit 2: Myself, Family & School. Learning outcomes: Identify family members; Use vocabulary: mother, father, brother, sister, grandmother, grandfather; Draw and label family members; Use ''This is my...'' sentences. Planned resources: Lesson Plan, Worksheet, Study Notes, Assessment, Answer Key. Coverage status: Not Started.',
  2,
  '10 periods',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Resource: KG_English_Chapter_5_My_Family_Lesson_Plan
INSERT INTO public.lesson_resources (
  lesson_id, name, type, url,
  order_index, created_at
) VALUES (
  (SELECT lesson_id FROM public.lessons WHERE title = 'Chapter 5: My Family' LIMIT 1),
  'KG_English_Chapter_5_My_Family_Lesson_Plan',
  'document',
  'https://thegreenminds.co.in/courses/KGENG001/doc/KG_English_Chapter_5_My_Family_Lesson_Plan.docx',
  0,
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Resource: KG_English_Chapter_5_My_Family_Worksheet
INSERT INTO public.lesson_resources (
  lesson_id, name, type, url,
  order_index, created_at
) VALUES (
  (SELECT lesson_id FROM public.lessons WHERE title = 'Chapter 5: My Family' LIMIT 1),
  'KG_English_Chapter_5_My_Family_Worksheet',
  'document',
  'https://thegreenminds.co.in/courses/KGENG001/doc/KG_English_Chapter_5_My_Family_Worksheet.docx',
  1,
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Resource: KG_English_Chapter_5_My_Family_Study_Notes
INSERT INTO public.lesson_resources (
  lesson_id, name, type, url,
  order_index, created_at
) VALUES (
  (SELECT lesson_id FROM public.lessons WHERE title = 'Chapter 5: My Family' LIMIT 1),
  'KG_English_Chapter_5_My_Family_Study_Notes',
  'document',
  'https://thegreenminds.co.in/courses/KGENG001/doc/KG_English_Chapter_5_My_Family_Study_Notes.docx',
  2,
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Resource: KG_English_Chapter_5_My_Family_Assessment
INSERT INTO public.lesson_resources (
  lesson_id, name, type, url,
  order_index, created_at
) VALUES (
  (SELECT lesson_id FROM public.lessons WHERE title = 'Chapter 5: My Family' LIMIT 1),
  'KG_English_Chapter_5_My_Family_Assessment',
  'document',
  'https://thegreenminds.co.in/courses/KGENG001/doc/KG_English_Chapter_5_My_Family_Assessment.docx',
  3,
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Chapter 6: My School
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'KGENG001' LIMIT 1)
   AND title = 'Unit 2: Myself, Family & School' LIMIT 1),
  'Chapter 6: My School',
  'Identify school-related vocabulary | Name common objects in the classroom | Use ''I see a...'' sentences | Follow simple classroom instructions',
  'Term 1; Unit 2: Myself, Family & School. Learning outcomes: Identify school-related vocabulary; Name common objects in the classroom; Use ''I see a...'' sentences; Follow simple classroom instructions. Planned resources: Lesson Plan, Worksheet, Study Notes, Assessment, Answer Key. Coverage status: Not Started.',
  3,
  '10 periods',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Resource: KG_English_Chapter_6_My_School_Lesson_Plan
INSERT INTO public.lesson_resources (
  lesson_id, name, type, url,
  order_index, created_at
) VALUES (
  (SELECT lesson_id FROM public.lessons WHERE title = 'Chapter 6: My School' LIMIT 1),
  'KG_English_Chapter_6_My_School_Lesson_Plan',
  'document',
  'https://thegreenminds.co.in/courses/KGENG001/doc/KG_English_Chapter_6_My_School_Lesson_Plan.docx',
  0,
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Resource: KG_English_Chapter_6_My_School_Worksheet
INSERT INTO public.lesson_resources (
  lesson_id, name, type, url,
  order_index, created_at
) VALUES (
  (SELECT lesson_id FROM public.lessons WHERE title = 'Chapter 6: My School' LIMIT 1),
  'KG_English_Chapter_6_My_School_Worksheet',
  'document',
  'https://thegreenminds.co.in/courses/KGENG001/doc/KG_English_Chapter_6_My_School_Worksheet.docx',
  1,
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Resource: KG_English_Chapter_6_My_School_Study_Notes
INSERT INTO public.lesson_resources (
  lesson_id, name, type, url,
  order_index, created_at
) VALUES (
  (SELECT lesson_id FROM public.lessons WHERE title = 'Chapter 6: My School' LIMIT 1),
  'KG_English_Chapter_6_My_School_Study_Notes',
  'document',
  'https://thegreenminds.co.in/courses/KGENG001/doc/KG_English_Chapter_6_My_School_Study_Notes.docx',
  2,
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Resource: KG_English_Chapter_6_My_School_Assessment
INSERT INTO public.lesson_resources (
  lesson_id, name, type, url,
  order_index, created_at
) VALUES (
  (SELECT lesson_id FROM public.lessons WHERE title = 'Chapter 6: My School' LIMIT 1),
  'KG_English_Chapter_6_My_School_Assessment',
  'document',
  'https://thegreenminds.co.in/courses/KGENG001/doc/KG_English_Chapter_6_My_School_Assessment.docx',
  3,
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Module: Unit 3: Rhymes, Stories & Listening Skills
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'KGENG001' LIMIT 1),
  'Unit 3: Rhymes, Stories & Listening Skills',
  'Term 1 module for Rhymes, Stories & Listening Skills.',
  3,
  '["English","KG","Language","Listening","Speaking","Rhymes"]'::jsonb,
  '["Lesson Plan","Worksheet","Study Notes","Assessment","Answer Key"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Chapter 7: English Rhymes (Part 1)
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'KGENG001' LIMIT 1)
   AND title = 'Unit 3: Rhymes, Stories & Listening Skills' LIMIT 1),
  'Chapter 7: English Rhymes (Part 1)',
  'Listen to and enjoy English rhymes | Recite at least 5 rhymes with actions | Identify rhyming words | Develop listening and speaking skills',
  'Term 1; Unit 3: Rhymes, Stories & Listening Skills. Learning outcomes: Listen to and enjoy English rhymes; Recite at least 5 rhymes with actions; Identify rhyming words; Develop listening and speaking skills. Planned resources: Lesson Plan, Worksheet, Study Notes, Assessment, Answer Key. Coverage status: Not Started.',
  1,
  '10 periods',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Resource: KG_English_Chapter_7_English_Rhymes_(Part_1)_Lesson_Plan
INSERT INTO public.lesson_resources (
  lesson_id, name, type, url,
  order_index, created_at
) VALUES (
  (SELECT lesson_id FROM public.lessons WHERE title = 'Chapter 7: English Rhymes (Part 1)' LIMIT 1),
  'KG_English_Chapter_7_English_Rhymes_(Part_1)_Lesson_Plan',
  'document',
  'https://thegreenminds.co.in/courses/KGENG001/doc/KG_English_Chapter_7_English_Rhymes_(Part_1)_Lesson_Plan.docx',
  0,
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Resource: KG_English_Chapter_7_English_Rhymes_(Part_1)_Worksheet
INSERT INTO public.lesson_resources (
  lesson_id, name, type, url,
  order_index, created_at
) VALUES (
  (SELECT lesson_id FROM public.lessons WHERE title = 'Chapter 7: English Rhymes (Part 1)' LIMIT 1),
  'KG_English_Chapter_7_English_Rhymes_(Part_1)_Worksheet',
  'document',
  'https://thegreenminds.co.in/courses/KGENG001/doc/KG_English_Chapter_7_English_Rhymes_(Part_1)_Worksheet.docx',
  1,
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Resource: KG_English_Chapter_7_English_Rhymes_(Part_1)_Study_Notes
INSERT INTO public.lesson_resources (
  lesson_id, name, type, url,
  order_index, created_at
) VALUES (
  (SELECT lesson_id FROM public.lessons WHERE title = 'Chapter 7: English Rhymes (Part 1)' LIMIT 1),
  'KG_English_Chapter_7_English_Rhymes_(Part_1)_Study_Notes',
  'document',
  'https://thegreenminds.co.in/courses/KGENG001/doc/KG_English_Chapter_7_English_Rhymes_(Part_1)_Study_Notes.docx',
  2,
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Resource: KG_English_Chapter_7_English_Rhymes_(Part_1)_Assessment
INSERT INTO public.lesson_resources (
  lesson_id, name, type, url,
  order_index, created_at
) VALUES (
  (SELECT lesson_id FROM public.lessons WHERE title = 'Chapter 7: English Rhymes (Part 1)' LIMIT 1),
  'KG_English_Chapter_7_English_Rhymes_(Part_1)_Assessment',
  'document',
  'https://thegreenminds.co.in/courses/KGENG001/doc/KG_English_Chapter_7_English_Rhymes_(Part_1)_Assessment.docx',
  3,
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Chapter 8: Listening & Speaking Skills
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'KGENG001' LIMIT 1)
   AND title = 'Unit 3: Rhymes, Stories & Listening Skills' LIMIT 1),
  'Chapter 8: Listening & Speaking Skills',
  'Listen to simple stories and respond | Follow 2-3 step oral instructions | Answer simple ''wh'' questions | Express needs and feelings in English',
  'Term 1; Unit 3: Rhymes, Stories & Listening Skills. Learning outcomes: Listen to simple stories and respond; Follow 2-3 step oral instructions; Answer simple ''wh'' questions; Express needs and feelings in English. Planned resources: Lesson Plan, Worksheet, Study Notes, Assessment, Answer Key. Coverage status: Not Started.',
  2,
  '8 periods',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Resource: KG_English_Chapter_8_Listening_&_Speaking_Skills_Lesson_Plan
INSERT INTO public.lesson_resources (
  lesson_id, name, type, url,
  order_index, created_at
) VALUES (
  (SELECT lesson_id FROM public.lessons WHERE title = 'Chapter 8: Listening & Speaking Skills' LIMIT 1),
  'KG_English_Chapter_8_Listening_&_Speaking_Skills_Lesson_Plan',
  'document',
  'https://thegreenminds.co.in/courses/KGENG001/doc/KG_English_Chapter_8_Listening_&_Speaking_Skills_Lesson_Plan.docx',
  0,
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Resource: KG_English_Chapter_8_Listening_&_Speaking_Skills_Worksheet
INSERT INTO public.lesson_resources (
  lesson_id, name, type, url,
  order_index, created_at
) VALUES (
  (SELECT lesson_id FROM public.lessons WHERE title = 'Chapter 8: Listening & Speaking Skills' LIMIT 1),
  'KG_English_Chapter_8_Listening_&_Speaking_Skills_Worksheet',
  'document',
  'https://thegreenminds.co.in/courses/KGENG001/doc/KG_English_Chapter_8_Listening_&_Speaking_Skills_Worksheet.docx',
  1,
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Resource: KG_English_Chapter_8_Listening_&_Speaking_Skills_Study_Notes
INSERT INTO public.lesson_resources (
  lesson_id, name, type, url,
  order_index, created_at
) VALUES (
  (SELECT lesson_id FROM public.lessons WHERE title = 'Chapter 8: Listening & Speaking Skills' LIMIT 1),
  'KG_English_Chapter_8_Listening_&_Speaking_Skills_Study_Notes',
  'document',
  'https://thegreenminds.co.in/courses/KGENG001/doc/KG_English_Chapter_8_Listening_&_Speaking_Skills_Study_Notes.docx',
  2,
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Resource: KG_English_Chapter_8_Listening_&_Speaking_Skills_Assessment
INSERT INTO public.lesson_resources (
  lesson_id, name, type, url,
  order_index, created_at
) VALUES (
  (SELECT lesson_id FROM public.lessons WHERE title = 'Chapter 8: Listening & Speaking Skills' LIMIT 1),
  'KG_English_Chapter_8_Listening_&_Speaking_Skills_Assessment',
  'document',
  'https://thegreenminds.co.in/courses/KGENG001/doc/KG_English_Chapter_8_Listening_&_Speaking_Skills_Assessment.docx',
  3,
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Module: Unit 4: Animals, Birds & Plants
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'KGENG001' LIMIT 1),
  'Unit 4: Animals, Birds & Plants',
  'Term 2 module for Animals, Birds & Plants.',
  4,
  '["English","KG","Language","Vocabulary","Nature Awareness","Observation"]'::jsonb,
  '["Lesson Plan","Worksheet","Study Notes","Assessment","Answer Key"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Chapter 9: Animals - Domestic & Wild
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'KGENG001' LIMIT 1)
   AND title = 'Unit 4: Animals, Birds & Plants' LIMIT 1),
  'Chapter 9: Animals - Domestic & Wild',
  'Identify common domestic and wild animals | Name animals and their young ones | Identify animal sounds | Use ''I see a...'' with animal names',
  'Term 2; Unit 4: Animals, Birds & Plants. Learning outcomes: Identify common domestic and wild animals; Name animals and their young ones; Identify animal sounds; Use ''I see a...'' with animal names. Planned resources: Lesson Plan, Worksheet, Study Notes, Assessment, Answer Key. Coverage status: Not Started.',
  1,
  '12 periods',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Resource: KG_English_Chapter_9_Animals_-_Domestic_&_Wild_Lesson_Plan
INSERT INTO public.lesson_resources (
  lesson_id, name, type, url,
  order_index, created_at
) VALUES (
  (SELECT lesson_id FROM public.lessons WHERE title = 'Chapter 9: Animals - Domestic & Wild' LIMIT 1),
  'KG_English_Chapter_9_Animals_-_Domestic_&_Wild_Lesson_Plan',
  'document',
  'https://thegreenminds.co.in/courses/KGENG001/doc/KG_English_Chapter_9_Animals_-_Domestic_&_Wild_Lesson_Plan.docx',
  0,
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Resource: KG_English_Chapter_9_Animals_-_Domestic_&_Wild_Worksheet
INSERT INTO public.lesson_resources (
  lesson_id, name, type, url,
  order_index, created_at
) VALUES (
  (SELECT lesson_id FROM public.lessons WHERE title = 'Chapter 9: Animals - Domestic & Wild' LIMIT 1),
  'KG_English_Chapter_9_Animals_-_Domestic_&_Wild_Worksheet',
  'document',
  'https://thegreenminds.co.in/courses/KGENG001/doc/KG_English_Chapter_9_Animals_-_Domestic_&_Wild_Worksheet.docx',
  1,
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Resource: KG_English_Chapter_9_Animals_-_Domestic_&_Wild_Study_Notes
INSERT INTO public.lesson_resources (
  lesson_id, name, type, url,
  order_index, created_at
) VALUES (
  (SELECT lesson_id FROM public.lessons WHERE title = 'Chapter 9: Animals - Domestic & Wild' LIMIT 1),
  'KG_English_Chapter_9_Animals_-_Domestic_&_Wild_Study_Notes',
  'document',
  'https://thegreenminds.co.in/courses/KGENG001/doc/KG_English_Chapter_9_Animals_-_Domestic_&_Wild_Study_Notes.docx',
  2,
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Resource: KG_English_Chapter_9_Animals_-_Domestic_&_Wild_Assessment
INSERT INTO public.lesson_resources (
  lesson_id, name, type, url,
  order_index, created_at
) VALUES (
  (SELECT lesson_id FROM public.lessons WHERE title = 'Chapter 9: Animals - Domestic & Wild' LIMIT 1),
  'KG_English_Chapter_9_Animals_-_Domestic_&_Wild_Assessment',
  'document',
  'https://thegreenminds.co.in/courses/KGENG001/doc/KG_English_Chapter_9_Animals_-_Domestic_&_Wild_Assessment.docx',
  3,
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Chapter 10: Birds & Plants
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'KGENG001' LIMIT 1)
   AND title = 'Unit 4: Animals, Birds & Plants' LIMIT 1),
  'Chapter 10: Birds & Plants',
  'Identify common birds | Name parts of a plant | Describe what plants need to grow | Appreciate nature',
  'Term 2; Unit 4: Animals, Birds & Plants. Learning outcomes: Identify common birds; Name parts of a plant; Describe what plants need to grow; Appreciate nature. Planned resources: Lesson Plan, Worksheet, Study Notes, Assessment, Answer Key. Coverage status: Not Started.',
  2,
  '10 periods',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Resource: KG_English_Chapter_10_Birds_&_Plants_Lesson_Plan
INSERT INTO public.lesson_resources (
  lesson_id, name, type, url,
  order_index, created_at
) VALUES (
  (SELECT lesson_id FROM public.lessons WHERE title = 'Chapter 10: Birds & Plants' LIMIT 1),
  'KG_English_Chapter_10_Birds_&_Plants_Lesson_Plan',
  'document',
  'https://thegreenminds.co.in/courses/KGENG001/doc/KG_English_Chapter_10_Birds_&_Plants_Lesson_Plan.docx',
  0,
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Resource: KG_English_Chapter_10_Birds_&_Plants_Worksheet
INSERT INTO public.lesson_resources (
  lesson_id, name, type, url,
  order_index, created_at
) VALUES (
  (SELECT lesson_id FROM public.lessons WHERE title = 'Chapter 10: Birds & Plants' LIMIT 1),
  'KG_English_Chapter_10_Birds_&_Plants_Worksheet',
  'document',
  'https://thegreenminds.co.in/courses/KGENG001/doc/KG_English_Chapter_10_Birds_&_Plants_Worksheet.docx',
  1,
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Resource: KG_English_Chapter_10_Birds_&_Plants_Study_Notes
INSERT INTO public.lesson_resources (
  lesson_id, name, type, url,
  order_index, created_at
) VALUES (
  (SELECT lesson_id FROM public.lessons WHERE title = 'Chapter 10: Birds & Plants' LIMIT 1),
  'KG_English_Chapter_10_Birds_&_Plants_Study_Notes',
  'document',
  'https://thegreenminds.co.in/courses/KGENG001/doc/KG_English_Chapter_10_Birds_&_Plants_Study_Notes.docx',
  2,
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Resource: KG_English_Chapter_10_Birds_&_Plants_Assessment
INSERT INTO public.lesson_resources (
  lesson_id, name, type, url,
  order_index, created_at
) VALUES (
  (SELECT lesson_id FROM public.lessons WHERE title = 'Chapter 10: Birds & Plants' LIMIT 1),
  'KG_English_Chapter_10_Birds_&_Plants_Assessment',
  'document',
  'https://thegreenminds.co.in/courses/KGENG001/doc/KG_English_Chapter_10_Birds_&_Plants_Assessment.docx',
  3,
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Module: Unit 5: Food, Colours & Shapes
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'KGENG001' LIMIT 1),
  'Unit 5: Food, Colours & Shapes',
  'Term 2 module for Food, Colours & Shapes.',
  5,
  '["English","KG","Language","Vocabulary","Classification","Concept Recognition"]'::jsonb,
  '["Lesson Plan","Worksheet","Study Notes","Assessment","Answer Key"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Chapter 11: Fruits & Vegetables
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'KGENG001' LIMIT 1)
   AND title = 'Unit 5: Food, Colours & Shapes' LIMIT 1),
  'Chapter 11: Fruits & Vegetables',
  'Identify and name common fruits and vegetables | Classify fruits and vegetables | Use ''I like...'' sentences | Understand healthy eating habits',
  'Term 2; Unit 5: Food, Colours & Shapes. Learning outcomes: Identify and name common fruits and vegetables; Classify fruits and vegetables; Use ''I like...'' sentences; Understand healthy eating habits. Planned resources: Lesson Plan, Worksheet, Study Notes, Assessment, Answer Key. Coverage status: Not Started.',
  1,
  '10 periods',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Resource: KG_English_Chapter_11_Fruits_&_Vegetables_Lesson_Plan
INSERT INTO public.lesson_resources (
  lesson_id, name, type, url,
  order_index, created_at
) VALUES (
  (SELECT lesson_id FROM public.lessons WHERE title = 'Chapter 11: Fruits & Vegetables' LIMIT 1),
  'KG_English_Chapter_11_Fruits_&_Vegetables_Lesson_Plan',
  'document',
  'https://thegreenminds.co.in/courses/KGENG001/doc/KG_English_Chapter_11_Fruits_&_Vegetables_Lesson_Plan.docx',
  0,
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Resource: KG_English_Chapter_11_Fruits_&_Vegetables_Worksheet
INSERT INTO public.lesson_resources (
  lesson_id, name, type, url,
  order_index, created_at
) VALUES (
  (SELECT lesson_id FROM public.lessons WHERE title = 'Chapter 11: Fruits & Vegetables' LIMIT 1),
  'KG_English_Chapter_11_Fruits_&_Vegetables_Worksheet',
  'document',
  'https://thegreenminds.co.in/courses/KGENG001/doc/KG_English_Chapter_11_Fruits_&_Vegetables_Worksheet.docx',
  1,
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Resource: KG_English_Chapter_11_Fruits_&_Vegetables_Study_Notes
INSERT INTO public.lesson_resources (
  lesson_id, name, type, url,
  order_index, created_at
) VALUES (
  (SELECT lesson_id FROM public.lessons WHERE title = 'Chapter 11: Fruits & Vegetables' LIMIT 1),
  'KG_English_Chapter_11_Fruits_&_Vegetables_Study_Notes',
  'document',
  'https://thegreenminds.co.in/courses/KGENG001/doc/KG_English_Chapter_11_Fruits_&_Vegetables_Study_Notes.docx',
  2,
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Resource: KG_English_Chapter_11_Fruits_&_Vegetables_Assessment
INSERT INTO public.lesson_resources (
  lesson_id, name, type, url,
  order_index, created_at
) VALUES (
  (SELECT lesson_id FROM public.lessons WHERE title = 'Chapter 11: Fruits & Vegetables' LIMIT 1),
  'KG_English_Chapter_11_Fruits_&_Vegetables_Assessment',
  'document',
  'https://thegreenminds.co.in/courses/KGENG001/doc/KG_English_Chapter_11_Fruits_&_Vegetables_Assessment.docx',
  3,
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Chapter 12: Colours & Shapes
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'KGENG001' LIMIT 1)
   AND title = 'Unit 5: Food, Colours & Shapes' LIMIT 1),
  'Chapter 12: Colours & Shapes',
  'Identify and name basic colours | Identify basic shapes (circle, square, triangle, rectangle) | Use colour and shape words in sentences | Sort objects by colour and shape',
  'Term 2; Unit 5: Food, Colours & Shapes. Learning outcomes: Identify and name basic colours; Identify basic shapes (circle, square, triangle, rectangle); Use colour and shape words in sentences; Sort objects by colour and shape. Planned resources: Lesson Plan, Worksheet, Study Notes, Assessment, Answer Key. Coverage status: Not Started.',
  2,
  '10 periods',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Resource: KG_English_Chapter_12_Colours_&_Shapes_Lesson_Plan
INSERT INTO public.lesson_resources (
  lesson_id, name, type, url,
  order_index, created_at
) VALUES (
  (SELECT lesson_id FROM public.lessons WHERE title = 'Chapter 12: Colours & Shapes' LIMIT 1),
  'KG_English_Chapter_12_Colours_&_Shapes_Lesson_Plan',
  'document',
  'https://thegreenminds.co.in/courses/KGENG001/doc/KG_English_Chapter_12_Colours_&_Shapes_Lesson_Plan.docx',
  0,
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Resource: KG_English_Chapter_12_Colours_&_Shapes_Worksheet
INSERT INTO public.lesson_resources (
  lesson_id, name, type, url,
  order_index, created_at
) VALUES (
  (SELECT lesson_id FROM public.lessons WHERE title = 'Chapter 12: Colours & Shapes' LIMIT 1),
  'KG_English_Chapter_12_Colours_&_Shapes_Worksheet',
  'document',
  'https://thegreenminds.co.in/courses/KGENG001/doc/KG_English_Chapter_12_Colours_&_Shapes_Worksheet.docx',
  1,
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Resource: KG_English_Chapter_12_Colours_&_Shapes_Study_Notes
INSERT INTO public.lesson_resources (
  lesson_id, name, type, url,
  order_index, created_at
) VALUES (
  (SELECT lesson_id FROM public.lessons WHERE title = 'Chapter 12: Colours & Shapes' LIMIT 1),
  'KG_English_Chapter_12_Colours_&_Shapes_Study_Notes',
  'document',
  'https://thegreenminds.co.in/courses/KGENG001/doc/KG_English_Chapter_12_Colours_&_Shapes_Study_Notes.docx',
  2,
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Resource: KG_English_Chapter_12_Colours_&_Shapes_Assessment
INSERT INTO public.lesson_resources (
  lesson_id, name, type, url,
  order_index, created_at
) VALUES (
  (SELECT lesson_id FROM public.lessons WHERE title = 'Chapter 12: Colours & Shapes' LIMIT 1),
  'KG_English_Chapter_12_Colours_&_Shapes_Assessment',
  'document',
  'https://thegreenminds.co.in/courses/KGENG001/doc/KG_English_Chapter_12_Colours_&_Shapes_Assessment.docx',
  3,
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Module: Unit 6: Action Words, Good Habits & Our World
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'KGENG001' LIMIT 1),
  'Unit 6: Action Words, Good Habits & Our World',
  'Term 2 module for Action Words, Good Habits & Our World.',
  6,
  '["English","KG","Language","Vocabulary","Simple Sentences","Life Skills"]'::jsonb,
  '["Lesson Plan","Worksheet","Study Notes","Assessment","Answer Key"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Chapter 13: Action Words & Simple Sentences
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'KGENG001' LIMIT 1)
   AND title = 'Unit 6: Action Words, Good Habits & Our World' LIMIT 1),
  'Chapter 13: Action Words & Simple Sentences',
  'Identify common action words (verbs) | Use action words with actions | Form simple sentences: ''I can...'' | Read simple 3-4 word sentences',
  'Term 2; Unit 6: Action Words, Good Habits & Our World. Learning outcomes: Identify common action words (verbs); Use action words with actions; Form simple sentences: ''I can...''; Read simple 3-4 word sentences. Planned resources: Lesson Plan, Worksheet, Study Notes, Assessment, Answer Key. Coverage status: Not Started.',
  1,
  '10 periods',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Resource: KG_English_Chapter_13_Action_Words_&_Simple_Sentences_Lesson_Plan
INSERT INTO public.lesson_resources (
  lesson_id, name, type, url,
  order_index, created_at
) VALUES (
  (SELECT lesson_id FROM public.lessons WHERE title = 'Chapter 13: Action Words & Simple Sentences' LIMIT 1),
  'KG_English_Chapter_13_Action_Words_&_Simple_Sentences_Lesson_Plan',
  'document',
  'https://thegreenminds.co.in/courses/KGENG001/doc/KG_English_Chapter_13_Action_Words_&_Simple_Sentences_Lesson_Plan.docx',
  0,
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Resource: KG_English_Chapter_13_Action_Words_&_Simple_Sentences_Worksheet
INSERT INTO public.lesson_resources (
  lesson_id, name, type, url,
  order_index, created_at
) VALUES (
  (SELECT lesson_id FROM public.lessons WHERE title = 'Chapter 13: Action Words & Simple Sentences' LIMIT 1),
  'KG_English_Chapter_13_Action_Words_&_Simple_Sentences_Worksheet',
  'document',
  'https://thegreenminds.co.in/courses/KGENG001/doc/KG_English_Chapter_13_Action_Words_&_Simple_Sentences_Worksheet.docx',
  1,
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Resource: KG_English_Chapter_13_Action_Words_&_Simple_Sentences_Study_Notes
INSERT INTO public.lesson_resources (
  lesson_id, name, type, url,
  order_index, created_at
) VALUES (
  (SELECT lesson_id FROM public.lessons WHERE title = 'Chapter 13: Action Words & Simple Sentences' LIMIT 1),
  'KG_English_Chapter_13_Action_Words_&_Simple_Sentences_Study_Notes',
  'document',
  'https://thegreenminds.co.in/courses/KGENG001/doc/KG_English_Chapter_13_Action_Words_&_Simple_Sentences_Study_Notes.docx',
  2,
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Resource: KG_English_Chapter_13_Action_Words_&_Simple_Sentences_Assessment
INSERT INTO public.lesson_resources (
  lesson_id, name, type, url,
  order_index, created_at
) VALUES (
  (SELECT lesson_id FROM public.lessons WHERE title = 'Chapter 13: Action Words & Simple Sentences' LIMIT 1),
  'KG_English_Chapter_13_Action_Words_&_Simple_Sentences_Assessment',
  'document',
  'https://thegreenminds.co.in/courses/KGENG001/doc/KG_English_Chapter_13_Action_Words_&_Simple_Sentences_Assessment.docx',
  3,
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Chapter 14: Days of the Week & Months
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'KGENG001' LIMIT 1)
   AND title = 'Unit 6: Action Words, Good Habits & Our World' LIMIT 1),
  'Chapter 14: Days of the Week & Months',
  'Recite days of the week in order | Recite months of the year | Use ''Today is...'' sentences | Understand the concept of time',
  'Term 2; Unit 6: Action Words, Good Habits & Our World. Learning outcomes: Recite days of the week in order; Recite months of the year; Use ''Today is...'' sentences; Understand the concept of time. Planned resources: Lesson Plan, Worksheet, Study Notes, Assessment, Answer Key. Coverage status: Not Started.',
  2,
  '8 periods',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Resource: KG_English_Chapter_14_Days_of_the_Week_&_Months_Lesson_Plan
INSERT INTO public.lesson_resources (
  lesson_id, name, type, url,
  order_index, created_at
) VALUES (
  (SELECT lesson_id FROM public.lessons WHERE title = 'Chapter 14: Days of the Week & Months' LIMIT 1),
  'KG_English_Chapter_14_Days_of_the_Week_&_Months_Lesson_Plan',
  'document',
  'https://thegreenminds.co.in/courses/KGENG001/doc/KG_English_Chapter_14_Days_of_the_Week_&_Months_Lesson_Plan.docx',
  0,
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Resource: KG_English_Chapter_14_Days_of_the_Week_&_Months_Worksheet
INSERT INTO public.lesson_resources (
  lesson_id, name, type, url,
  order_index, created_at
) VALUES (
  (SELECT lesson_id FROM public.lessons WHERE title = 'Chapter 14: Days of the Week & Months' LIMIT 1),
  'KG_English_Chapter_14_Days_of_the_Week_&_Months_Worksheet',
  'document',
  'https://thegreenminds.co.in/courses/KGENG001/doc/KG_English_Chapter_14_Days_of_the_Week_&_Months_Worksheet.docx',
  1,
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Resource: KG_English_Chapter_14_Days_of_the_Week_&_Months_Study_Notes
INSERT INTO public.lesson_resources (
  lesson_id, name, type, url,
  order_index, created_at
) VALUES (
  (SELECT lesson_id FROM public.lessons WHERE title = 'Chapter 14: Days of the Week & Months' LIMIT 1),
  'KG_English_Chapter_14_Days_of_the_Week_&_Months_Study_Notes',
  'document',
  'https://thegreenminds.co.in/courses/KGENG001/doc/KG_English_Chapter_14_Days_of_the_Week_&_Months_Study_Notes.docx',
  2,
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Resource: KG_English_Chapter_14_Days_of_the_Week_&_Months_Assessment
INSERT INTO public.lesson_resources (
  lesson_id, name, type, url,
  order_index, created_at
) VALUES (
  (SELECT lesson_id FROM public.lessons WHERE title = 'Chapter 14: Days of the Week & Months' LIMIT 1),
  'KG_English_Chapter_14_Days_of_the_Week_&_Months_Assessment',
  'document',
  'https://thegreenminds.co.in/courses/KGENG001/doc/KG_English_Chapter_14_Days_of_the_Week_&_Months_Assessment.docx',
  3,
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Chapter 15: Good Habits & Safety
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'KGENG001' LIMIT 1)
   AND title = 'Unit 6: Action Words, Good Habits & Our World' LIMIT 1),
  'Chapter 15: Good Habits & Safety',
  'Identify good habits (brushing, bathing, eating healthy) | Understand basic safety rules | Use polite words (please, thank you, sorry) | Practice hygiene routines',
  'Term 2; Unit 6: Action Words, Good Habits & Our World. Learning outcomes: Identify good habits (brushing, bathing, eating healthy); Understand basic safety rules; Use polite words (please, thank you, sorry); Practice hygiene routines. Planned resources: Lesson Plan, Worksheet, Study Notes, Assessment, Answer Key. Coverage status: Not Started.',
  3,
  '10 periods',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Resource: KG_English_Chapter_15_Good_Habits_&_Safety_Lesson_Plan
INSERT INTO public.lesson_resources (
  lesson_id, name, type, url,
  order_index, created_at
) VALUES (
  (SELECT lesson_id FROM public.lessons WHERE title = 'Chapter 15: Good Habits & Safety' LIMIT 1),
  'KG_English_Chapter_15_Good_Habits_&_Safety_Lesson_Plan',
  'document',
  'https://thegreenminds.co.in/courses/KGENG001/doc/KG_English_Chapter_15_Good_Habits_&_Safety_Lesson_Plan.docx',
  0,
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Resource: KG_English_Chapter_15_Good_Habits_&_Safety_Worksheet
INSERT INTO public.lesson_resources (
  lesson_id, name, type, url,
  order_index, created_at
) VALUES (
  (SELECT lesson_id FROM public.lessons WHERE title = 'Chapter 15: Good Habits & Safety' LIMIT 1),
  'KG_English_Chapter_15_Good_Habits_&_Safety_Worksheet',
  'document',
  'https://thegreenminds.co.in/courses/KGENG001/doc/KG_English_Chapter_15_Good_Habits_&_Safety_Worksheet.docx',
  1,
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Resource: KG_English_Chapter_15_Good_Habits_&_Safety_Study_Notes
INSERT INTO public.lesson_resources (
  lesson_id, name, type, url,
  order_index, created_at
) VALUES (
  (SELECT lesson_id FROM public.lessons WHERE title = 'Chapter 15: Good Habits & Safety' LIMIT 1),
  'KG_English_Chapter_15_Good_Habits_&_Safety_Study_Notes',
  'document',
  'https://thegreenminds.co.in/courses/KGENG001/doc/KG_English_Chapter_15_Good_Habits_&_Safety_Study_Notes.docx',
  2,
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Resource: KG_English_Chapter_15_Good_Habits_&_Safety_Assessment
INSERT INTO public.lesson_resources (
  lesson_id, name, type, url,
  order_index, created_at
) VALUES (
  (SELECT lesson_id FROM public.lessons WHERE title = 'Chapter 15: Good Habits & Safety' LIMIT 1),
  'KG_English_Chapter_15_Good_Habits_&_Safety_Assessment',
  'document',
  'https://thegreenminds.co.in/courses/KGENG001/doc/KG_English_Chapter_15_Good_Habits_&_Safety_Assessment.docx',
  3,
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Chapter 16: Our Helpers
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'KGENG001' LIMIT 1)
   AND title = 'Unit 6: Action Words, Good Habits & Our World' LIMIT 1),
  'Chapter 16: Our Helpers',
  'Identify community helpers | Name tools used by helpers | Use ''A ... helps us by...'' sentences | Show respect for all helpers',
  'Term 2; Unit 6: Action Words, Good Habits & Our World. Learning outcomes: Identify community helpers; Name tools used by helpers; Use ''A ... helps us by...'' sentences; Show respect for all helpers. Planned resources: Lesson Plan, Worksheet, Study Notes, Assessment, Answer Key. Coverage status: Not Started.',
  4,
  '10 periods',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Resource: KG_English_Chapter_16_Our_Helpers_Lesson_Plan
INSERT INTO public.lesson_resources (
  lesson_id, name, type, url,
  order_index, created_at
) VALUES (
  (SELECT lesson_id FROM public.lessons WHERE title = 'Chapter 16: Our Helpers' LIMIT 1),
  'KG_English_Chapter_16_Our_Helpers_Lesson_Plan',
  'document',
  'https://thegreenminds.co.in/courses/KGENG001/doc/KG_English_Chapter_16_Our_Helpers_Lesson_Plan.docx',
  0,
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Resource: KG_English_Chapter_16_Our_Helpers_Worksheet
INSERT INTO public.lesson_resources (
  lesson_id, name, type, url,
  order_index, created_at
) VALUES (
  (SELECT lesson_id FROM public.lessons WHERE title = 'Chapter 16: Our Helpers' LIMIT 1),
  'KG_English_Chapter_16_Our_Helpers_Worksheet',
  'document',
  'https://thegreenminds.co.in/courses/KGENG001/doc/KG_English_Chapter_16_Our_Helpers_Worksheet.docx',
  1,
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Resource: KG_English_Chapter_16_Our_Helpers_Study_Notes
INSERT INTO public.lesson_resources (
  lesson_id, name, type, url,
  order_index, created_at
) VALUES (
  (SELECT lesson_id FROM public.lessons WHERE title = 'Chapter 16: Our Helpers' LIMIT 1),
  'KG_English_Chapter_16_Our_Helpers_Study_Notes',
  'document',
  'https://thegreenminds.co.in/courses/KGENG001/doc/KG_English_Chapter_16_Our_Helpers_Study_Notes.docx',
  2,
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Resource: KG_English_Chapter_16_Our_Helpers_Assessment
INSERT INTO public.lesson_resources (
  lesson_id, name, type, url,
  order_index, created_at
) VALUES (
  (SELECT lesson_id FROM public.lessons WHERE title = 'Chapter 16: Our Helpers' LIMIT 1),
  'KG_English_Chapter_16_Our_Helpers_Assessment',
  'document',
  'https://thegreenminds.co.in/courses/KGENG001/doc/KG_English_Chapter_16_Our_Helpers_Assessment.docx',
  3,
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Skill: English
INSERT INTO public.course_skills (
  course_id, skill_name, proficiency_level, type, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'KGENG001' LIMIT 1),
  'English',
  'Beginner',
  'soft',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Skill: KG
INSERT INTO public.course_skills (
  course_id, skill_name, proficiency_level, type, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'KGENG001' LIMIT 1),
  'KG',
  'Intermediate',
  'soft',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Skill: Language
INSERT INTO public.course_skills (
  course_id, skill_name, proficiency_level, type, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'KGENG001' LIMIT 1),
  'Language',
  'Intermediate',
  'soft',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Skill: Alphabet Recognition
INSERT INTO public.course_skills (
  course_id, skill_name, proficiency_level, type, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'KGENG001' LIMIT 1),
  'Alphabet Recognition',
  'Intermediate',
  'soft',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Skill: Phonics
INSERT INTO public.course_skills (
  course_id, skill_name, proficiency_level, type, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'KGENG001' LIMIT 1),
  'Phonics',
  'Intermediate',
  'soft',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Skill: Writing
INSERT INTO public.course_skills (
  course_id, skill_name, proficiency_level, type, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'KGENG001' LIMIT 1),
  'Writing',
  'Intermediate',
  'soft',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: KG
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'KGENG001' LIMIT 1),
  'KG',
  NOW()
) ON CONFLICT DO NOTHING;

COMMIT;

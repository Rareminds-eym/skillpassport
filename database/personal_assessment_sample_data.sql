-- ==================================================================================
-- SAMPLE DATA FOR PERSONAL ASSESSMENT SYSTEM
-- Populates Middle School (Grades 6-8) and High School (Grades 9-12) Assessments
-- ==================================================================================

-- ==================== STREAMS ====================
-- Add grade level streams
INSERT INTO public.personal_assessment_streams (id, name, description, grade_level, is_active, display_order) VALUES
  ('middle_school', 'Grades 6-8 (Middle School)', 'Assessment for middle school students', 'middle', true, 1),
  ('high_school', 'Grades 9-12 (High School)', 'Assessment for high school students', 'highschool', true, 2)
ON CONFLICT (id) DO NOTHING;

-- ==================== MIDDLE SCHOOL SECTIONS ====================
-- Section 1: Interest Explorer
INSERT INTO public.personal_assessment_sections (name, title, description, instruction, color, icon, grade_level, is_stream_specific, is_timed, order_number, is_active)
VALUES
  ('middle_interest_explorer', 'Interest Explorer', 'Let''s discover what kinds of activities and subjects you enjoy most!', 'There are no right or wrong answers. Pick what feels most like you today.', 'rose', 'heart', 'middle', false, false, 1, true),
  ('middle_strengths_character', 'Strengths & Character', 'Discover your personal strengths and character traits.', 'Rate each statement: 1 = not like me, 2 = sometimes, 3 = mostly me, 4 = very me', 'amber', 'award', 'middle', false, false, 2, true),
  ('middle_learning_preferences', 'Learning & Work Preferences', 'Learn about how you like to work and learn best.', 'Choose the options that best describe you.', 'blue', 'users', 'middle', false, false, 3, true)
ON CONFLICT (name) DO NOTHING;

-- ==================== HIGH SCHOOL SECTIONS ====================
INSERT INTO public.personal_assessment_sections (name, title, description, instruction, color, icon, grade_level, is_stream_specific, is_timed, order_number, is_active)
VALUES
  ('hs_interest_explorer', 'Interest Explorer', 'Discover what activities and subjects truly excite you.', 'Answer honestly based on your real preferences, not what others expect.', 'rose', 'heart', 'highschool', false, false, 1, true),
  ('hs_strengths_character', 'Strengths & Character', 'Identify your personal strengths and character traits.', 'Rate each: 1 = not me, 2 = a bit, 3 = mostly, 4 = strongly me', 'amber', 'award', 'highschool', false, false, 2, true),
  ('hs_learning_preferences', 'Learning & Work Preferences', 'Understand how you work, learn, and contribute best.', 'Select the options that best describe you.', 'blue', 'users', 'highschool', false, false, 3, true),
  ('hs_aptitude_sampling', 'Aptitude Sampling', 'Rate your experience with different types of tasks.', 'After each task, rate: Ease 1–4, Enjoyment 1–4', 'purple', 'zap', 'highschool', false, false, 4, true)
ON CONFLICT (name) DO NOTHING;

-- ==================== RESPONSE SCALES ====================
-- Middle School Strengths Scale
INSERT INTO public.personal_assessment_response_scales (section_id, scale_name, scale_values)
SELECT id, 'middle_school_strengths', '[
  {"value": 1, "label": "Not like me"},
  {"value": 2, "label": "Sometimes"},
  {"value": 3, "label": "Mostly me"},
  {"value": 4, "label": "Very me"}
]'::jsonb
FROM public.personal_assessment_sections
WHERE name = 'middle_strengths_character';

-- High School Strengths Scale
INSERT INTO public.personal_assessment_response_scales (section_id, scale_name, scale_values)
SELECT id, 'high_school_strengths', '[
  {"value": 1, "label": "Not me"},
  {"value": 2, "label": "A bit"},
  {"value": 3, "label": "Mostly"},
  {"value": 4, "label": "Strongly me"}
]'::jsonb
FROM public.personal_assessment_sections
WHERE name = 'hs_strengths_character';

-- Aptitude Sampling Scale
INSERT INTO public.personal_assessment_response_scales (section_id, scale_name, scale_values)
SELECT id, 'aptitude_sampling', '[
  {"value": 1, "label": "Very difficult / Not enjoyable"},
  {"value": 2, "label": "Somewhat difficult / Slightly enjoyable"},
  {"value": 3, "label": "Moderately easy / Moderately enjoyable"},
  {"value": 4, "label": "Very easy / Very enjoyable"}
]'::jsonb
FROM public.personal_assessment_sections
WHERE name = 'hs_aptitude_sampling';

-- ==================== MIDDLE SCHOOL QUESTIONS ====================
-- Get section IDs
DO $$
DECLARE
  v_interest_section_id UUID;
  v_strengths_section_id UUID;
  v_learning_section_id UUID;
BEGIN
  -- Get section IDs
  SELECT id INTO v_interest_section_id FROM public.personal_assessment_sections WHERE name = 'middle_interest_explorer';
  SELECT id INTO v_strengths_section_id FROM public.personal_assessment_sections WHERE name = 'middle_strengths_character';
  SELECT id INTO v_learning_section_id FROM public.personal_assessment_sections WHERE name = 'middle_learning_preferences';

  -- Interest Explorer Questions (Q1-Q5)
  INSERT INTO public.personal_assessment_questions (section_id, question_text, question_type, options, max_selections, category_mapping, order_number)
  VALUES
    (v_interest_section_id, 'If you had a "choose-any" period in school, what would you enjoy most? (pick 2)', 'multiselect',
      '["Building/making something with your hands", "Drawing/painting/designing", "Solving puzzles or brain games", "Helping someone learn or feel better", "Organizing a class event or selling something", "Being outdoors / with animals / nature"]'::jsonb,
      2,
      '{"Building/making something with your hands": "R", "Drawing/painting/designing": "A", "Solving puzzles or brain games": "I", "Helping someone learn or feel better": "S", "Organizing a class event or selling something": "E", "Being outdoors / with animals / nature": "R"}'::jsonb,
      1),

    (v_interest_section_id, 'Which school activities feel most fun? (pick 3)', 'multiselect',
      '["Science experiments", "Math games / logic puzzles", "Writing stories / poems", "Art / craft / design", "Sports / dance / drama", "Group discussions / debates", "Coding / robotics / tinkering", "Community / volunteering", "Business fairs / buying-selling projects", "Gardening / environment clubs"]'::jsonb,
      3,
      '{"Science experiments": "I", "Math games / logic puzzles": "I", "Writing stories / poems": "A", "Art / craft / design": "A", "Sports / dance / drama": "R", "Group discussions / debates": "S", "Coding / robotics / tinkering": "I", "Community / volunteering": "S", "Business fairs / buying-selling projects": "E", "Gardening / environment clubs": "R"}'::jsonb,
      2),

    (v_interest_section_id, 'Which YouTube / books / shows do you naturally click on? (pick 2)', 'multiselect',
      E'["How things work / inventions", "Art / music / creativity", "Mysteries / problem-solving", "People stories / emotions / friendships", "Money/business / \\\"how to grow\\\" ideas", "Nature / space / animals / earth"]'::jsonb,
      2,
      E'{"How things work / inventions": "I", "Art / music / creativity": "A", "Mysteries / problem-solving": "I", "People stories / emotions / friendships": "S", "Money/business / \\\"how to grow\\\" ideas": "E", "Nature / space / animals / earth": "R"}'::jsonb,
      3),

    (v_interest_section_id, 'When you do a project, you usually like to…', 'singleselect',
      '["Make a model / build something", "Make it look beautiful / creative", "Find facts and explain clearly", "Work with friends and share roles", "Plan it, lead it, present it", "Connect it to real life / society / environment"]'::jsonb,
      1,
      '{"Make a model / build something": "R", "Make it look beautiful / creative": "A", "Find facts and explain clearly": "I", "Work with friends and share roles": "S", "Plan it, lead it, present it": "E", "Connect it to real life / society / environment": "S"}'::jsonb,
      4),

    (v_interest_section_id, 'What do you avoid because it feels boring or hard? (pick 2)', 'multiselect',
      '["Writing long answers", "Doing calculations", "Speaking in front of people", "Working in groups", "Doing neat/design work", "Doing hands-on/building tasks"]'::jsonb,
      2,
      '{"Writing long answers": "A", "Doing calculations": "I", "Speaking in front of people": "E", "Working in groups": "S", "Doing neat/design work": "A", "Doing hands-on/building tasks": "R"}'::jsonb,
      5);

  -- Strengths & Character Questions (Q6-Q16)
  INSERT INTO public.personal_assessment_questions (section_id, question_text, question_type, strength_type, order_number)
  VALUES
    (v_strengths_section_id, 'I get curious and ask lots of "why/how" questions.', 'rating', 'Curiosity', 1),
    (v_strengths_section_id, 'I keep trying even when something is difficult.', 'rating', 'Perseverance', 2),
    (v_strengths_section_id, 'I notice when someone is left out and try to include them.', 'rating', 'Kindness', 3),
    (v_strengths_section_id, 'I''m good at finding new or different ideas.', 'rating', 'Creativity', 4),
    (v_strengths_section_id, 'I stay calm or help others when things go wrong.', 'rating', 'Leadership', 5),
    (v_strengths_section_id, 'I like learning new things even without exams.', 'rating', 'Love of Learning', 6),
    (v_strengths_section_id, 'People say I''m honest / fair.', 'rating', 'Honesty', 7),
    (v_strengths_section_id, 'I like helping at home/school without being asked.', 'rating', 'Helpfulness', 8),
    (v_strengths_section_id, 'I''m good at making people laugh or feel relaxed.', 'rating', 'Humor', 9),
    (v_strengths_section_id, 'I plan my work and finish on time.', 'rating', 'Self-Discipline', 10);

  INSERT INTO public.personal_assessment_questions (section_id, question_text, question_type, placeholder, strength_type, order_number)
  VALUES
    (v_strengths_section_id, 'Write one moment you felt proud of yourself this year. What strength did you use?', 'text', 'Share your proud moment here...', 'Reflection', 11);

  -- Learning & Work Preferences Questions (Q17-Q20)
  INSERT INTO public.personal_assessment_questions (section_id, question_text, question_type, options, max_selections, order_number)
  VALUES
    (v_learning_section_id, 'I learn best when… (pick 2)', 'multiselect',
      '["I see pictures/diagrams/videos", "Someone explains step-by-step", "I read and make notes", "I try it hands-on", "I discuss with a friend", "I teach someone else"]'::jsonb,
      2, 1),

    (v_learning_section_id, 'I prefer doing work…', 'singleselect',
      '["Alone", "With one friend", "In a group", "Depends on the task"]'::jsonb,
      1, 2),

    (v_learning_section_id, 'In group work, I usually…', 'singleselect',
      '["Take the lead", "Help with ideas", "Do the research", "Make it neat/creative", "Keep everyone together", "Prefer a clear role"]'::jsonb,
      1, 3),

    (v_learning_section_id, 'When I''m stuck, I first…', 'singleselect',
      '["Try again on my own", "Ask a friend", "Ask teacher/parent", "Look up a video", "Leave it and return later"]'::jsonb,
      1, 4);
END $$;

-- ==================== HIGH SCHOOL QUESTIONS (SAMPLE) ====================
-- Similar structure - you can expand with all 32 questions
-- This shows the pattern for a few questions

DO $$
DECLARE
  v_interest_section_id UUID;
  v_strengths_section_id UUID;
  v_learning_section_id UUID;
  v_aptitude_section_id UUID;
BEGIN
  -- Get section IDs
  SELECT id INTO v_interest_section_id FROM public.personal_assessment_sections WHERE name = 'hs_interest_explorer';
  SELECT id INTO v_strengths_section_id FROM public.personal_assessment_sections WHERE name = 'hs_strengths_character';
  SELECT id INTO v_learning_section_id FROM public.personal_assessment_sections WHERE name = 'hs_learning_preferences';
  SELECT id INTO v_aptitude_section_id FROM public.personal_assessment_sections WHERE name = 'hs_aptitude_sampling';

  -- Interest Explorer (Q1-Q5)
  INSERT INTO public.personal_assessment_questions (section_id, question_text, question_type, options, max_selections, category_mapping, order_number)
  VALUES
    (v_interest_section_id, 'Which activities would you willingly spend extra time on? (pick 3)', 'multiselect',
      '["Repairing/building/engineering things", "Creating art/design/media/music", "Investigating science, tech, research", "Teaching, mentoring, supporting others", "Running events, persuading, entrepreneurship", "Working with nature, environment, animals"]'::jsonb,
      3,
      '{"Repairing/building/engineering things": "R", "Creating art/design/media/music": "A", "Investigating science, tech, research": "I", "Teaching, mentoring, supporting others": "S", "Running events, persuading, entrepreneurship": "E", "Working with nature, environment, animals": "R"}'::jsonb,
      1);

  -- Strengths & Character (Q6-Q17)
  INSERT INTO public.personal_assessment_questions (section_id, question_text, question_type, strength_type, order_number)
  VALUES
    (v_strengths_section_id, 'I''m driven by curiosity — I like getting to the bottom of things.', 'rating', 'Curiosity', 1),
    (v_strengths_section_id, 'I stay persistent through long or boring tasks.', 'rating', 'Perseverance', 2);

  INSERT INTO public.personal_assessment_questions (section_id, question_text, question_type, placeholder, strength_type, order_number)
  VALUES
    (v_strengths_section_id, 'Describe a challenge you overcame. What personal strengths helped you?', 'text', 'Describe your challenge and the strengths you used...', 'Reflection', 11),
    (v_strengths_section_id, 'What do people consistently appreciate about you?', 'text', 'Share what others appreciate about you...', 'Reflection', 12);

  -- Aptitude Sampling (Q22-Q32)
  INSERT INTO public.personal_assessment_questions (section_id, question_text, question_type, task_type, description, order_number)
  VALUES
    (v_aptitude_section_id, 'Task A: Analytical reasoning - Rate the EASE of this task', 'rating', 'Analytical', '(e.g., data interpretation, logic grid, basic stats problem)', 1),
    (v_aptitude_section_id, 'Task A: Analytical reasoning - Rate your ENJOYMENT of this task', 'rating', 'Analytical', NULL, 2);

  INSERT INTO public.personal_assessment_questions (section_id, question_text, question_type, placeholder, strength_type, order_number)
  VALUES
    (v_aptitude_section_id, 'Which task gave you energy? What skill was it using?', 'text', 'Describe which task energized you and why...', 'Reflection', 9),
    (v_aptitude_section_id, 'Which task drained you? Why?', 'text', 'Describe which task was draining and why...', 'Reflection', 10),
    (v_aptitude_section_id, 'If you could improve one skill this year, what would it be and how will you practice it?', 'text', 'Share the skill you want to improve and your practice plan...', 'Reflection', 11);
END $$;

-- ==================== VERIFICATION QUERIES ====================
-- Run these to verify the data was inserted correctly

-- Count sections by grade level
SELECT grade_level, COUNT(*) as section_count
FROM public.personal_assessment_sections
GROUP BY grade_level;

-- Count questions by section
SELECT s.name, s.title, COUNT(q.id) as question_count
FROM public.personal_assessment_sections s
LEFT JOIN public.personal_assessment_questions q ON s.id = q.section_id
WHERE s.grade_level IN ('middle', 'highschool')
GROUP BY s.name, s.title, s.grade_level, s.order_number
ORDER BY s.grade_level, s.order_number;

-- View sample questions
SELECT s.title as section, q.question_text, q.question_type, q.max_selections
FROM public.personal_assessment_questions q
JOIN public.personal_assessment_sections s ON q.section_id = s.id
WHERE s.grade_level = 'middle'
ORDER BY s.order_number, q.order_number
LIMIT 10;

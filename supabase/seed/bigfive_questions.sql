-- =============================================================================
-- Big Five Personality Assessment Seed
-- Based on OCEAN model: Openness, Conscientiousness, Extraversion, Agreeableness, Neuroticism
-- Section: grade_level = 'general' (shared across after10, after12, college)
-- Questions: 30 total (6 per trait)
-- Scale: accuracy5 (Very Inaccurate → Very Accurate)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Section row (explicit ID needed as FK anchor for questions)
-- -----------------------------------------------------------------------------
INSERT INTO "public"."personal_assessment_sections" (
  "id",
  "name",
  "title",
  "description",
  "icon",
  "color",
  "order_number",
  "is_timed",
  "time_limit_seconds",
  "instruction",
  "response_scale",
  "is_stream_specific",
  "is_active",
  "grade_level"
) VALUES (
  'b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c6d7',
  'bigfive',
  'Big Five Personality',
  'Understand your work style, approach to tasks, and how you interact with others.',
  'brain',
  'purple',
  2,
  true,
  1200,
  'How accurately does each statement describe you?',
  '{"type":"accuracy5","values":[{"value":1,"label":"Very Inaccurate"},{"value":2,"label":"Moderately Inaccurate"},{"value":3,"label":"Neither"},{"value":4,"label":"Moderately Accurate"},{"value":5,"label":"Very Accurate"}]}',
  false,
  true,
  'general'
) ON CONFLICT (id) DO NOTHING;

-- -----------------------------------------------------------------------------
-- 2. Questions (30 rows, IDs auto-generated)
--    category_mapping = { "type": "O|C|E|A|N" }
--    metadata = { "applicable_grades": ["after10","after12","college"] }
-- -----------------------------------------------------------------------------
INSERT INTO "public"."personal_assessment_questions" (
  "section_id",
  "stream_id",
  "question_text",
  "question_type",
  "order_number",
  "is_active",
  "category_mapping",
  "metadata"
) VALUES

-- O – Openness (6 questions)
('b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c6d7', NULL, 'I enjoy exploring new ideas.', 'likert', 1, true, '{"type":"O"}', '{"applicable_grades":["after10","after12","college"]}'),
('b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c6d7', NULL, 'I like courses that challenge my thinking.', 'likert', 2, true, '{"type":"O"}', '{"applicable_grades":["after10","after12","college"]}'),
('b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c6d7', NULL, 'I am curious about how things can be improved.', 'likert', 3, true, '{"type":"O"}', '{"applicable_grades":["after10","after12","college"]}'),
('b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c6d7', NULL, 'I appreciate art, design, or creative work.', 'likert', 4, true, '{"type":"O"}', '{"applicable_grades":["after10","after12","college"]}'),
('b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c6d7', NULL, 'I am open to changing my opinions with evidence.', 'likert', 5, true, '{"type":"O"}', '{"applicable_grades":["after10","after12","college"]}'),
('b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c6d7', NULL, 'I enjoy learning beyond what is required.', 'likert', 6, true, '{"type":"O"}', '{"applicable_grades":["after10","after12","college"]}'),

-- C – Conscientiousness (6 questions)
('b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c6d7', NULL, 'I plan my tasks before starting.', 'likert', 7, true, '{"type":"C"}', '{"applicable_grades":["after10","after12","college"]}'),
('b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c6d7', NULL, 'I finish work on time.', 'likert', 8, true, '{"type":"C"}', '{"applicable_grades":["after10","after12","college"]}'),
('b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c6d7', NULL, 'I double-check details for accuracy.', 'likert', 9, true, '{"type":"C"}', '{"applicable_grades":["after10","after12","college"]}'),
('b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c6d7', NULL, 'I set goals and work steadily toward them.', 'likert', 10, true, '{"type":"C"}', '{"applicable_grades":["after10","after12","college"]}'),
('b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c6d7', NULL, 'I keep my study or work space organized.', 'likert', 11, true, '{"type":"C"}', '{"applicable_grades":["after10","after12","college"]}'),
('b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c6d7', NULL, 'I follow through even when work is boring.', 'likert', 12, true, '{"type":"C"}', '{"applicable_grades":["after10","after12","college"]}'),

-- E – Extraversion (6 questions)
('b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c6d7', NULL, 'I enjoy meeting new people.', 'likert', 13, true, '{"type":"E"}', '{"applicable_grades":["after10","after12","college"]}'),
('b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c6d7', NULL, 'I feel energized in group settings.', 'likert', 14, true, '{"type":"E"}', '{"applicable_grades":["after10","after12","college"]}'),
('b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c6d7', NULL, 'I speak up easily in class or meetings.', 'likert', 15, true, '{"type":"E"}', '{"applicable_grades":["after10","after12","college"]}'),
('b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c6d7', NULL, 'I like being the one to start conversations.', 'likert', 16, true, '{"type":"E"}', '{"applicable_grades":["after10","after12","college"]}'),
('b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c6d7', NULL, 'I am comfortable leading discussions.', 'likert', 17, true, '{"type":"E"}', '{"applicable_grades":["after10","after12","college"]}'),
('b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c6d7', NULL, 'I prefer active, fast-paced environments.', 'likert', 18, true, '{"type":"E"}', '{"applicable_grades":["after10","after12","college"]}'),

-- A – Agreeableness (6 questions)
('b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c6d7', NULL, 'I cooperate even when opinions differ.', 'likert', 19, true, '{"type":"A"}', '{"applicable_grades":["after10","after12","college"]}'),
('b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c6d7', NULL, 'I try to be supportive to teammates.', 'likert', 20, true, '{"type":"A"}', '{"applicable_grades":["after10","after12","college"]}'),
('b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c6d7', NULL, 'I avoid being harsh or rude in conflicts.', 'likert', 21, true, '{"type":"A"}', '{"applicable_grades":["after10","after12","college"]}'),
('b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c6d7', NULL, 'I assume good intent in others.', 'likert', 22, true, '{"type":"A"}', '{"applicable_grades":["after10","after12","college"]}'),
('b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c6d7', NULL, 'I value harmony in groups.', 'likert', 23, true, '{"type":"A"}', '{"applicable_grades":["after10","after12","college"]}'),
('b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c6d7', NULL, 'I am willing to help without expecting returns.', 'likert', 24, true, '{"type":"A"}', '{"applicable_grades":["after10","after12","college"]}'),

-- N – Neuroticism (6 questions)
('b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c6d7', NULL, 'I get stressed easily under pressure.', 'likert', 25, true, '{"type":"N"}', '{"applicable_grades":["after10","after12","college"]}'),
('b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c6d7', NULL, 'I worry about making mistakes.', 'likert', 26, true, '{"type":"N"}', '{"applicable_grades":["after10","after12","college"]}'),
('b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c6d7', NULL, 'I feel anxious before important tasks.', 'likert', 27, true, '{"type":"N"}', '{"applicable_grades":["after10","after12","college"]}'),
('b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c6d7', NULL, 'Small problems can upset me a lot.', 'likert', 28, true, '{"type":"N"}', '{"applicable_grades":["after10","after12","college"]}'),
('b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c6d7', NULL, 'I struggle to relax when things go wrong.', 'likert', 29, true, '{"type":"N"}', '{"applicable_grades":["after10","after12","college"]}'),
('b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c6d7', NULL, 'I take criticism personally.', 'likert', 30, true, '{"type":"N"}', '{"applicable_grades":["after10","after12","college"]}');

-- =============================================================================
-- Employability / 21st-Century Skills Assessment Seed
-- Part A: 25 self-rating questions (likert) across 8 skill domains
-- Part B: 6 SJT scenarios (singleselect) with best/worst answers
-- Section: grade_level = 'general' (shared across after10, after12, college)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Section row
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
  'c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d7e8',
  'employability',
  'Employability Skills',
  'Assess your job-readiness and 21st-century skills.',
  'briefcase',
  'green',
  4,
  true,
  1500,
  'How well does each statement describe you?',
  '{"type":"selfDescription5","values":[{"value":1,"label":"Not Like Me"},{"value":2,"label":"Slightly"},{"value":3,"label":"Somewhat"},{"value":4,"label":"Mostly"},{"value":5,"label":"Very Much Like Me"}]}',
  false,
  true,
  'general'
) ON CONFLICT (id) DO NOTHING;

-- -----------------------------------------------------------------------------
-- 2. Part A: Self-rating questions (25 rows, likert)
--    category_mapping = { "type": "<skill_domain>" }
--    metadata = { "applicable_grades": [...], "part": "A" }
-- -----------------------------------------------------------------------------
INSERT INTO "public"."personal_assessment_questions" (
  "section_id", "stream_id", "question_text", "question_type",
  "order_number", "is_active", "category_mapping", "metadata"
) VALUES

-- Communication (3)
('c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d7e8', NULL, 'I explain my ideas clearly.', 'likert', 1, true, '{"type":"Communication"}', '{"applicable_grades":["after10","after12","college"],"part":"A"}'),
('c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d7e8', NULL, 'I adjust my communication to the audience.', 'likert', 2, true, '{"type":"Communication"}', '{"applicable_grades":["after10","after12","college"],"part":"A"}'),
('c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d7e8', NULL, 'I listen actively without interrupting.', 'likert', 3, true, '{"type":"Communication"}', '{"applicable_grades":["after10","after12","college"],"part":"A"}'),

-- Teamwork (3)
('c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d7e8', NULL, 'I contribute reliably in group tasks.', 'likert', 4, true, '{"type":"Teamwork"}', '{"applicable_grades":["after10","after12","college"],"part":"A"}'),
('c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d7e8', NULL, 'I handle disagreements respectfully.', 'likert', 5, true, '{"type":"Teamwork"}', '{"applicable_grades":["after10","after12","college"],"part":"A"}'),
('c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d7e8', NULL, 'I help the team stay on track.', 'likert', 6, true, '{"type":"Teamwork"}', '{"applicable_grades":["after10","after12","college"],"part":"A"}'),

-- Problem Solving (3)
('c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d7e8', NULL, 'I break problems into smaller parts.', 'likert', 7, true, '{"type":"ProblemSolving"}', '{"applicable_grades":["after10","after12","college"],"part":"A"}'),
('c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d7e8', NULL, 'I generate multiple solutions.', 'likert', 8, true, '{"type":"ProblemSolving"}', '{"applicable_grades":["after10","after12","college"],"part":"A"}'),
('c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d7e8', NULL, 'I choose solutions based on evidence.', 'likert', 9, true, '{"type":"ProblemSolving"}', '{"applicable_grades":["after10","after12","college"],"part":"A"}'),

-- Adaptability (3)
('c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d7e8', NULL, 'I stay calm when plans change.', 'likert', 10, true, '{"type":"Adaptability"}', '{"applicable_grades":["after10","after12","college"],"part":"A"}'),
('c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d7e8', NULL, 'I learn new tools quickly.', 'likert', 11, true, '{"type":"Adaptability"}', '{"applicable_grades":["after10","after12","college"],"part":"A"}'),
('c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d7e8', NULL, 'I handle uncertainty without freezing.', 'likert', 12, true, '{"type":"Adaptability"}', '{"applicable_grades":["after10","after12","college"],"part":"A"}'),

-- Leadership (3)
('c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d7e8', NULL, 'I take initiative when needed.', 'likert', 13, true, '{"type":"Leadership"}', '{"applicable_grades":["after10","after12","college"],"part":"A"}'),
('c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d7e8', NULL, 'I motivate peers toward deadlines.', 'likert', 14, true, '{"type":"Leadership"}', '{"applicable_grades":["after10","after12","college"],"part":"A"}'),
('c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d7e8', NULL, 'I delegate fairly.', 'likert', 15, true, '{"type":"Leadership"}', '{"applicable_grades":["after10","after12","college"],"part":"A"}'),

-- Digital Fluency (3)
('c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d7e8', NULL, 'I am comfortable with new software.', 'likert', 16, true, '{"type":"DigitalFluency"}', '{"applicable_grades":["after10","after12","college"],"part":"A"}'),
('c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d7e8', NULL, 'I use digital tools to organize work.', 'likert', 17, true, '{"type":"DigitalFluency"}', '{"applicable_grades":["after10","after12","college"],"part":"A"}'),
('c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d7e8', NULL, 'I can learn a tech skill from online resources.', 'likert', 18, true, '{"type":"DigitalFluency"}', '{"applicable_grades":["after10","after12","college"],"part":"A"}'),

-- Professionalism (3)
('c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d7e8', NULL, 'I manage time and deadlines well.', 'likert', 19, true, '{"type":"Professionalism"}', '{"applicable_grades":["after10","after12","college"],"part":"A"}'),
('c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d7e8', NULL, 'I take feedback constructively.', 'likert', 20, true, '{"type":"Professionalism"}', '{"applicable_grades":["after10","after12","college"],"part":"A"}'),
('c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d7e8', NULL, 'I communicate progress proactively.', 'likert', 21, true, '{"type":"Professionalism"}', '{"applicable_grades":["after10","after12","college"],"part":"A"}'),

-- Career Readiness (4)
('c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d7e8', NULL, 'I know how to write a strong CV.', 'likert', 22, true, '{"type":"CareerReadiness"}', '{"applicable_grades":["after10","after12","college"],"part":"A"}'),
('c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d7e8', NULL, 'I can describe my strengths confidently.', 'likert', 23, true, '{"type":"CareerReadiness"}', '{"applicable_grades":["after10","after12","college"],"part":"A"}'),
('c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d7e8', NULL, 'I seek internships or projects actively.', 'likert', 24, true, '{"type":"CareerReadiness"}', '{"applicable_grades":["after10","after12","college"],"part":"A"}'),
('c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d7e8', NULL, 'I track my skill gaps and work on them.', 'likert', 25, true, '{"type":"CareerReadiness"}', '{"applicable_grades":["after10","after12","college"],"part":"A"}');

-- -----------------------------------------------------------------------------
-- 3. Part B: SJT questions (6 rows, sjt)
--    options stored as JSONB array
--    correct_answer stores best answer for scoring
--    category_mapping = { "best": "...", "worst": "...", "scenario": "..." }
--    metadata = { "applicable_grades": [...], "part": "B" }
-- -----------------------------------------------------------------------------
INSERT INTO "public"."personal_assessment_questions" (
  "section_id", "stream_id", "question_text", "question_type",
  "options", "correct_answer",
  "order_number", "is_active", "category_mapping", "metadata"
) VALUES

('c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d7e8', NULL,
  'Your teammate misses tasks repeatedly. You:',
  'sjt',
  '["Do their part silently to finish.","Talk privately, ask what''s blocking them, agree on a plan.","Complain to the faculty immediately.","Exclude them from the group chat."]',
  '"Talk privately, ask what''s blocking them, agree on a plan."',
  26, true, '{"best":"Talk privately, ask what''s blocking them, agree on a plan.","worst":"Exclude them from the group chat.","scenario":"Team member not contributing"}',
  '{"applicable_grades":["after10","after12","college"],"part":"B"}'),

('c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d7e8', NULL,
  'Client changes requirements late. You:',
  'sjt',
  '["Refuse; say it''s too late.","Ask for priority changes and renegotiate timeline.","Agree to everything without checking feasibility.","Ignore and continue old plan."]',
  '"Ask for priority changes and renegotiate timeline."',
  27, true, '{"best":"Ask for priority changes and renegotiate timeline.","worst":"Ignore and continue old plan.","scenario":"Client changes requirements late"}',
  '{"applicable_grades":["after10","after12","college"],"part":"B"}'),

('c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d7e8', NULL,
  'You made an error in a submission. You:',
  'sjt',
  '["Hide it and hope nobody notices.","Inform mentor, correct quickly, explain learning.","Blame the rubric.","Quit the task."]',
  '"Inform mentor, correct quickly, explain learning."',
  28, true, '{"best":"Inform mentor, correct quickly, explain learning.","worst":"Hide it and hope nobody notices.","scenario":"You made an error in a submission"}',
  '{"applicable_grades":["after10","after12","college"],"part":"B"}'),

('c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d7e8', NULL,
  'Two teammates are in conflict. You:',
  'sjt',
  '["Take sides with your friend.","Facilitate a calm discussion on facts and goals.","Tell them to grow up.","Leave the team."]',
  '"Facilitate a calm discussion on facts and goals."',
  29, true, '{"best":"Facilitate a calm discussion on facts and goals.","worst":"Tell them to grow up.","scenario":"Two teammates are in conflict"}',
  '{"applicable_grades":["after10","after12","college"],"part":"B"}'),

('c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d7e8', NULL,
  'You are assigned a task you do not know. You:',
  'sjt',
  '["Delay till last day.","Learn basics fast, ask guidance early, deliver in parts.","Say no immediately.","Copy from internet without understanding."]',
  '"Learn basics fast, ask guidance early, deliver in parts."',
  30, true, '{"best":"Learn basics fast, ask guidance early, deliver in parts.","worst":"Copy from internet without understanding.","scenario":"You are assigned a task you do not know"}',
  '{"applicable_grades":["after10","after12","college"],"part":"B"}'),

('c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d7e8', NULL,
  'Presentation anxiety before placement talk. You:',
  'sjt',
  '["Skip presenting.","Practice small parts, seek feedback, then present.","Read slides without eye contact.","Ask someone else to present for you."]',
  '"Practice small parts, seek feedback, then present."',
  31, true, '{"best":"Practice small parts, seek feedback, then present.","worst":"Skip presenting.","scenario":"Presentation anxiety before placement talk"}',
  '{"applicable_grades":["after10","after12","college"],"part":"B"}');

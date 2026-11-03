-- ============================================================================
-- Insert EQ & SQ Life Skills Section and Questions (Grade 6-8 / middle school)
-- ============================================================================
-- Source: Assessment_doc_exal/Rareminds_Assessment_Question_Bank_and_Scoring (2).xlsx
--         sheet "G6_8_EQ_SQ" (18 items)
-- Each question uses question_type='rating' (1-5), matching the existing
-- middle-school convention (see middle_strengths_character) so the frontend's
-- default 1-5 rating scale fallback (getDefaultResponseScale in
-- functions/api/assessment/utils/question-loader.ts) applies automatically.
-- Metadata intentionally omits a "grade" key: filterQuestionsByGrade() in that
-- same file only filters on metadata.grade, and a non-numeric gradeLevel like
-- 'middle' would incorrectly drop the row if it carried one.
-- ============================================================================

-- Step 1: Insert the EQ/SQ Section
-- ============================================================================
INSERT INTO public.personal_assessment_sections (
    id,
    name,
    title,
    description,
    icon,
    color,
    order_number,
    is_timed,
    time_limit_seconds,
    instruction,
    response_scale,
    is_stream_specific,
    is_active,
    grade_level
) VALUES (
    gen_random_uuid(),
    'middle_eq_sq',
    'EQ & SQ Life Skills',
    'Explore your emotional awareness, self-management, and social skills.',
    'brain',
    'teal',
    3, -- Order: 3rd in the middle-school flow (interest -> strengths&character -> eq&sq -> exposure)
    false,
    NULL,
    'Rate each statement: 1 = not like me, 5 = very like me',
    '[
        {"value": 1, "label": "Not like me"},
        {"value": 2, "label": "Sometimes"},
        {"value": 3, "label": "Neutral"},
        {"value": 4, "label": "Mostly me"},
        {"value": 5, "label": "Very much like me"}
    ]'::jsonb,
    false,
    true,
    'middle'
)
ON CONFLICT (name) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    icon = EXCLUDED.icon,
    color = EXCLUDED.color,
    order_number = EXCLUDED.order_number,
    instruction = EXCLUDED.instruction,
    response_scale = EXCLUDED.response_scale,
    is_active = EXCLUDED.is_active,
    grade_level = EXCLUDED.grade_level,
    updated_at = NOW();

-- Step 2: Insert EQ/SQ Questions (18 questions)
-- ============================================================================
INSERT INTO public.personal_assessment_questions (
    section_id,
    question_text,
    question_type,
    order_number,
    is_active,
    metadata
) VALUES
(
    (SELECT id FROM public.personal_assessment_sections WHERE name = 'middle_eq_sq' LIMIT 1),
    'I can name what I am feeling when I am happy, sad, angry, afraid, or confused.',
    'rating', 1, true,
    '{"strength_type": "Emotional awareness", "capability_area": "Self / EQ", "mission_trigger": "Emotion naming mission"}'::jsonb
),
(
    (SELECT id FROM public.personal_assessment_sections WHERE name = 'middle_eq_sq' LIMIT 1),
    'When I feel angry, I can pause before reacting.',
    'rating', 2, true,
    '{"strength_type": "Emotional regulation", "capability_area": "Self / EQ", "mission_trigger": "Pause-plan-act mission"}'::jsonb
),
(
    (SELECT id FROM public.personal_assessment_sections WHERE name = 'middle_eq_sq' LIMIT 1),
    'When I make a mistake, I try again instead of giving up.',
    'rating', 3, true,
    '{"strength_type": "Resilience", "capability_area": "Self / EQ", "mission_trigger": "Retry mission"}'::jsonb
),
(
    (SELECT id FROM public.personal_assessment_sections WHERE name = 'middle_eq_sq' LIMIT 1),
    'When I do not understand something, I can ask for help.',
    'rating', 4, true,
    '{"strength_type": "Help-seeking", "capability_area": "Self / EQ", "mission_trigger": "Help-seeking mission"}'::jsonb
),
(
    (SELECT id FROM public.personal_assessment_sections WHERE name = 'middle_eq_sq' LIMIT 1),
    'I can try a new activity even if I am not sure I will do it well.',
    'rating', 5, true,
    '{"strength_type": "Confidence", "capability_area": "Self / EQ", "mission_trigger": "New-task confidence mission"}'::jsonb
),
(
    (SELECT id FROM public.personal_assessment_sections WHERE name = 'middle_eq_sq' LIMIT 1),
    'I believe I can improve if I practise.',
    'rating', 6, true,
    '{"strength_type": "Self-belief", "capability_area": "Self / EQ", "mission_trigger": "Growth reflection"}'::jsonb
),
(
    (SELECT id FROM public.personal_assessment_sections WHERE name = 'middle_eq_sq' LIMIT 1),
    'After completing an activity, I can say what I did well and what I can improve.',
    'rating', 7, true,
    '{"strength_type": "Reflection", "capability_area": "Self / EQ", "mission_trigger": "Reflection journal"}'::jsonb
),
(
    (SELECT id FROM public.personal_assessment_sections WHERE name = 'middle_eq_sq' LIMIT 1),
    'I can set a small goal for myself and work towards it.',
    'rating', 8, true,
    '{"strength_type": "Goal setting", "capability_area": "Self / EQ", "mission_trigger": "Goal setting mission"}'::jsonb
),
(
    (SELECT id FROM public.personal_assessment_sections WHERE name = 'middle_eq_sq' LIMIT 1),
    'I listen when another person is speaking.',
    'rating', 9, true,
    '{"strength_type": "Listening", "capability_area": "Social / SQ", "mission_trigger": "Active listening"}'::jsonb
),
(
    (SELECT id FROM public.personal_assessment_sections WHERE name = 'middle_eq_sq' LIMIT 1),
    'I can work with classmates in a group activity.',
    'rating', 10, true,
    '{"strength_type": "Teamwork", "capability_area": "Social / SQ", "mission_trigger": "Group-role mission"}'::jsonb
),
(
    (SELECT id FROM public.personal_assessment_sections WHERE name = 'middle_eq_sq' LIMIT 1),
    'I try to include classmates who are quiet or left out.',
    'rating', 11, true,
    '{"strength_type": "Inclusion", "capability_area": "Social / SQ", "mission_trigger": "Inclusion mission"}'::jsonb
),
(
    (SELECT id FROM public.personal_assessment_sections WHERE name = 'middle_eq_sq' LIMIT 1),
    'I can understand when someone else may be feeling sad, afraid, or embarrassed.',
    'rating', 12, true,
    '{"strength_type": "Empathy", "capability_area": "Social / SQ", "mission_trigger": "Empathy mission"}'::jsonb
),
(
    (SELECT id FROM public.personal_assessment_sections WHERE name = 'middle_eq_sq' LIMIT 1),
    'I can disagree without insulting or laughing at others.',
    'rating', 13, true,
    '{"strength_type": "Respect", "capability_area": "Social / SQ", "mission_trigger": "Respectful disagreement"}'::jsonb
),
(
    (SELECT id FROM public.personal_assessment_sections WHERE name = 'middle_eq_sq' LIMIT 1),
    'I can share roles and responsibilities in a group task.',
    'rating', 14, true,
    '{"strength_type": "Cooperation", "capability_area": "Social / SQ", "mission_trigger": "Role sharing"}'::jsonb
),
(
    (SELECT id FROM public.personal_assessment_sections WHERE name = 'middle_eq_sq' LIMIT 1),
    'I help classmates when they are struggling.',
    'rating', 15, true,
    '{"strength_type": "Peer support", "capability_area": "Social / SQ", "mission_trigger": "Peer support"}'::jsonb
),
(
    (SELECT id FROM public.personal_assessment_sections WHERE name = 'middle_eq_sq' LIMIT 1),
    'I can explain my thoughts clearly to a friend or small group.',
    'rating', 16, true,
    '{"strength_type": "Communication", "capability_area": "Communication", "mission_trigger": "Small-group explanation"}'::jsonb
),
(
    (SELECT id FROM public.personal_assessment_sections WHERE name = 'middle_eq_sq' LIMIT 1),
    'If there is a disagreement, I can try to solve it calmly.',
    'rating', 17, true,
    '{"strength_type": "Conflict handling", "capability_area": "Social / SQ", "mission_trigger": "Conflict role-play"}'::jsonb
),
(
    (SELECT id FROM public.personal_assessment_sections WHERE name = 'middle_eq_sq' LIMIT 1),
    'I can take responsibility for a small group task without dominating others.',
    'rating', 18, true,
    '{"strength_type": "Leadership", "capability_area": "Social / SQ", "mission_trigger": "Rotating leadership"}'::jsonb
)
ON CONFLICT (section_id, order_number) DO UPDATE SET
    question_text = EXCLUDED.question_text,
    question_type = EXCLUDED.question_type,
    metadata = EXCLUDED.metadata,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

-- ============================================================================
-- Insert Interest Discovery Section and Questions (Grade 6-8 / middle school)
-- ============================================================================
-- Source: Assessment_doc_exal/Rareminds_Assessment_Question_Bank_and_Scoring (2).xlsx
--         sheet "G6_8_Interest" (12 items)
-- Each question uses question_type='rating' (1-5 interest rating per sheet),
-- matching the existing middle-school convention (see middle_strengths_character)
-- so the frontend's default 1-5 rating scale fallback (getDefaultResponseScale
-- in functions/api/assessment/utils/question-loader.ts) applies automatically.
-- Named 'middle_interest_discovery' (not 'middle_interest_explorer', which
-- already exists in the DB as a distinct existing section) to avoid collision.
-- This is the 1st step in the new grade 6-8 flow: interest -> strengths&character
-- -> eq&sq -> exposure -> adaptive aptitude. The old 'middle_interest_explorer'
-- and 'middle_learning_preferences' sections are deactivated by this same seed
-- so they no longer appear in the middle-school flow.
-- Metadata intentionally omits a "grade" key: filterQuestionsByGrade() in that
-- same file only filters on metadata.grade, and a non-numeric gradeLevel like
-- 'middle' would incorrectly drop the row if it carried one.
-- ============================================================================

-- Step 0: Deactivate superseded sections (replaced by the new flow order)
-- ============================================================================
UPDATE public.personal_assessment_sections
SET is_active = false, updated_at = NOW()
WHERE name IN ('middle_interest_explorer', 'middle_learning_preferences');

-- Step 1: Insert the Interest Discovery Section
-- ============================================================================
INSERT INTO public.personal_assessment_sections (
    id, name, title, description, icon, color, order_number, is_timed,
    time_limit_seconds, instruction, response_scale, is_stream_specific,
    is_active, grade_level
) VALUES (
    gen_random_uuid(), 'middle_interest_discovery', 'Interest Discovery',
    'Discover the activities and topics you enjoy most.',
    'sparkles', 'pink',
    1, -- Order: 1st in the middle-school flow
    false, NULL,
    'Rate how much you enjoy each activity: 1 = not at all, 5 = very much',
    '[
        {"value": 1, "label": "Not like me"},
        {"value": 2, "label": "Sometimes"},
        {"value": 3, "label": "Neutral"},
        {"value": 4, "label": "Mostly me"},
        {"value": 5, "label": "Very much like me"}
    ]'::jsonb,
    false, true, 'middle'
)
ON CONFLICT (name) DO UPDATE SET
    title = EXCLUDED.title, description = EXCLUDED.description, icon = EXCLUDED.icon,
    color = EXCLUDED.color, order_number = EXCLUDED.order_number,
    instruction = EXCLUDED.instruction, response_scale = EXCLUDED.response_scale,
    is_active = EXCLUDED.is_active, grade_level = EXCLUDED.grade_level, updated_at = NOW();

-- Step 2: Insert Interest Discovery Questions (12 questions)
-- ============================================================================
INSERT INTO public.personal_assessment_questions (
    section_id, question_text, question_type, order_number, is_active, metadata
) VALUES
(
    (SELECT id FROM public.personal_assessment_sections WHERE name = 'middle_interest_discovery' LIMIT 1),
    'I enjoy making models, fixing things, arranging materials, or using tools.',
    'rating', 1, true,
    '{"strength_type": "Building / making", "capability_area": "Thinking & Problem Solving", "mission_trigger": "Maker mission"}'::jsonb
),
(
    (SELECT id FROM public.personal_assessment_sections WHERE name = 'middle_interest_discovery' LIMIT 1),
    'I enjoy observing plants, animals, water, soil, weather, or farms.',
    'rating', 2, true,
    '{"strength_type": "Nature / environment", "capability_area": "Exposure & Career Awareness", "mission_trigger": "Environment/agri mission"}'::jsonb
),
(
    (SELECT id FROM public.personal_assessment_sections WHERE name = 'middle_interest_discovery' LIMIT 1),
    'I enjoy asking why something happens and testing ideas.',
    'rating', 3, true,
    '{"strength_type": "Science / inquiry", "capability_area": "Thinking & Problem Solving", "mission_trigger": "Inquiry mission"}'::jsonb
),
(
    (SELECT id FROM public.personal_assessment_sections WHERE name = 'middle_interest_discovery' LIMIT 1),
    'I enjoy helping people, teaching friends, or solving someone''s problem.',
    'rating', 4, true,
    '{"strength_type": "Helping / caring", "capability_area": "Social / SQ", "mission_trigger": "Peer/community support"}'::jsonb
),
(
    (SELECT id FROM public.personal_assessment_sections WHERE name = 'middle_interest_discovery' LIMIT 1),
    'I enjoy making lists, arranging things, keeping records, or planning events.',
    'rating', 5, true,
    '{"strength_type": "Organising", "capability_area": "Execution & Independence", "mission_trigger": "Planning mission"}'::jsonb
),
(
    (SELECT id FROM public.personal_assessment_sections WHERE name = 'middle_interest_discovery' LIMIT 1),
    'I enjoy convincing people, selling something, or finding ways to earn/save money.',
    'rating', 6, true,
    '{"strength_type": "Business / selling", "capability_area": "Exposure & Career Awareness", "mission_trigger": "Local business mission"}'::jsonb
),
(
    (SELECT id FROM public.personal_assessment_sections WHERE name = 'middle_interest_discovery' LIMIT 1),
    'I enjoy drawing, designing, storytelling, acting, music, or making videos.',
    'rating', 7, true,
    '{"strength_type": "Creative expression", "capability_area": "Communication", "mission_trigger": "Creative artifact"}'::jsonb
),
(
    (SELECT id FROM public.personal_assessment_sections WHERE name = 'middle_interest_discovery' LIMIT 1),
    'I enjoy using phones, computers, apps, digital tools, or AI tools to create something.',
    'rating', 8, true,
    '{"strength_type": "Technology", "capability_area": "Digital & AI Literacy", "mission_trigger": "Digital creation"}'::jsonb
),
(
    (SELECT id FROM public.personal_assessment_sections WHERE name = 'middle_interest_discovery' LIMIT 1),
    'I enjoy finding solutions for problems in my school, home, village, or town.',
    'rating', 9, true,
    '{"strength_type": "Community problem-solving", "capability_area": "Thinking & Problem Solving", "mission_trigger": "Local problem mission"}'::jsonb
),
(
    (SELECT id FROM public.personal_assessment_sections WHERE name = 'middle_interest_discovery' LIMIT 1),
    'I enjoy explaining ideas, speaking in groups, or interviewing people.',
    'rating', 10, true,
    '{"strength_type": "Speaking / presenting", "capability_area": "Communication", "mission_trigger": "Interview mission"}'::jsonb
),
(
    (SELECT id FROM public.personal_assessment_sections WHERE name = 'middle_interest_discovery' LIMIT 1),
    'I enjoy noticing patterns, sorting information, or comparing options.',
    'rating', 11, true,
    '{"strength_type": "Data / patterns", "capability_area": "Thinking & Problem Solving", "mission_trigger": "Data sorting"}'::jsonb
),
(
    (SELECT id FROM public.personal_assessment_sections WHERE name = 'middle_interest_discovery' LIMIT 1),
    'I like showing what I made through photos, notes, or videos.',
    'rating', 12, true,
    '{"strength_type": "Creating proof", "capability_area": "Portfolio & Evidence", "mission_trigger": "Portfolio upload"}'::jsonb
)
ON CONFLICT (section_id, order_number) DO UPDATE SET
    question_text = EXCLUDED.question_text, question_type = EXCLUDED.question_type,
    metadata = EXCLUDED.metadata, is_active = EXCLUDED.is_active, updated_at = NOW();

-- ============================================================================
-- Insert Exposure Index Section and Questions (Grade 6 onward / general)
-- ============================================================================
-- Source: Assessment_doc_exal/Rareminds_Assessment_Question_Bank_and_Scoring (2).xlsx
--         sheet "Exposure_Index" (15 items)
-- Response Format per sheet was originally a 0-5 scale (not heard/heard/seen/spoken/visited/tried);
-- per instruction, "Seen it (video/visit)" was dropped and the remaining 5 options
-- renumbered to a 0-4 scale (not heard/heard/spoken/visited/tried).
-- response_scale is set explicitly at the section level instead of relying on the
-- question-loader's default 1-5 fallback.
-- grade_level is set to 'middle' (not 'general') so this section is picked up
-- by the middle-school flow: question-loader.ts filters grade-specific grades
-- with .eq('grade_level', gradeLevel), which excludes 'general' rows entirely.
-- This is the 4th step in the grade 6-8 flow: interest -> strengths&character
-- -> eq&sq -> exposure -> adaptive aptitude.
-- Metadata intentionally omits a "grade" key to avoid the NaN-comparison bug in
-- filterQuestionsByGrade() (functions/api/assessment/utils/question-loader.ts).
-- ============================================================================

-- Step 1: Insert the Exposure Index Section
-- ============================================================================
INSERT INTO public.personal_assessment_sections (
    id, name, title, description, icon, color, order_number, is_timed,
    time_limit_seconds, instruction, response_scale, is_stream_specific,
    is_active, grade_level
) VALUES (
    gen_random_uuid(), 'exposure_index', 'Exposure & Career Awareness',
    'See how much you have explored different career fields so far.',
    'compass', 'orange',
    4, -- Order: 4th in the middle-school flow, before adaptive aptitude
    false, NULL,
    'For each field, rate how much you have explored it so far.',
    '[
        {"value": 0, "label": "Not heard of it"},
        {"value": 1, "label": "Heard of it"},
        {"value": 2, "label": "Spoken to someone in it"},
        {"value": 3, "label": "Visited a related place/event"},
        {"value": 4, "label": "Tried a related activity"}
    ]'::jsonb,
    false, true, 'middle'
)
ON CONFLICT (name) DO UPDATE SET
    title = EXCLUDED.title, description = EXCLUDED.description, icon = EXCLUDED.icon,
    color = EXCLUDED.color, order_number = EXCLUDED.order_number,
    instruction = EXCLUDED.instruction, response_scale = EXCLUDED.response_scale,
    is_active = EXCLUDED.is_active, grade_level = EXCLUDED.grade_level, updated_at = NOW();

-- Step 2: Insert Exposure Index Questions (15 questions)
-- ============================================================================
INSERT INTO public.personal_assessment_questions (
    section_id, question_text, question_type, order_number, is_active, metadata
) VALUES
(
    (SELECT id FROM public.personal_assessment_sections WHERE name = 'exposure_index' LIMIT 1),
    'Have you explored what people do in Healthcare related roles?',
    'rating', 1, true,
    '{"strength_type": "Healthcare", "capability_area": "Exposure & Career Awareness", "mission_trigger": "Healthcare career card or role interview"}'::jsonb
),
(
    (SELECT id FROM public.personal_assessment_sections WHERE name = 'exposure_index' LIMIT 1),
    'Have you explored what people do in Agriculture / agri-tech related roles?',
    'rating', 2, true,
    '{"strength_type": "Agriculture / agri-tech", "capability_area": "Exposure & Career Awareness", "mission_trigger": "Agriculture / agri-tech career card or role interview"}'::jsonb
),
(
    (SELECT id FROM public.personal_assessment_sections WHERE name = 'exposure_index' LIMIT 1),
    'Have you explored what people do in Construction / civil related roles?',
    'rating', 3, true,
    '{"strength_type": "Construction / civil", "capability_area": "Exposure & Career Awareness", "mission_trigger": "Construction / civil career card or role interview"}'::jsonb
),
(
    (SELECT id FROM public.personal_assessment_sections WHERE name = 'exposure_index' LIMIT 1),
    'Have you explored what people do in Mechanical / repair related roles?',
    'rating', 4, true,
    '{"strength_type": "Mechanical / repair", "capability_area": "Exposure & Career Awareness", "mission_trigger": "Mechanical / repair career card or role interview"}'::jsonb
),
(
    (SELECT id FROM public.personal_assessment_sections WHERE name = 'exposure_index' LIMIT 1),
    'Have you explored what people do in Digital / IT related roles?',
    'rating', 5, true,
    '{"strength_type": "Digital / IT", "capability_area": "Exposure & Career Awareness", "mission_trigger": "Digital / IT career card or role interview"}'::jsonb
),
(
    (SELECT id FROM public.personal_assessment_sections WHERE name = 'exposure_index' LIMIT 1),
    'Have you explored what people do in Business / commerce related roles?',
    'rating', 6, true,
    '{"strength_type": "Business / commerce", "capability_area": "Exposure & Career Awareness", "mission_trigger": "Business / commerce career card or role interview"}'::jsonb
),
(
    (SELECT id FROM public.personal_assessment_sections WHERE name = 'exposure_index' LIMIT 1),
    'Have you explored what people do in Design / architecture related roles?',
    'rating', 7, true,
    '{"strength_type": "Design / architecture", "capability_area": "Exposure & Career Awareness", "mission_trigger": "Design / architecture career card or role interview"}'::jsonb
),
(
    (SELECT id FROM public.personal_assessment_sections WHERE name = 'exposure_index' LIMIT 1),
    'Have you explored what people do in Education / teaching related roles?',
    'rating', 8, true,
    '{"strength_type": "Education / teaching", "capability_area": "Exposure & Career Awareness", "mission_trigger": "Education / teaching career card or role interview"}'::jsonb
),
(
    (SELECT id FROM public.personal_assessment_sections WHERE name = 'exposure_index' LIMIT 1),
    'Have you explored what people do in Law / public service related roles?',
    'rating', 9, true,
    '{"strength_type": "Law / public service", "capability_area": "Exposure & Career Awareness", "mission_trigger": "Law / public service career card or role interview"}'::jsonb
),
(
    (SELECT id FROM public.personal_assessment_sections WHERE name = 'exposure_index' LIMIT 1),
    'Have you explored what people do in Hospitality / tourism related roles?',
    'rating', 10, true,
    '{"strength_type": "Hospitality / tourism", "capability_area": "Exposure & Career Awareness", "mission_trigger": "Hospitality / tourism career card or role interview"}'::jsonb
),
(
    (SELECT id FROM public.personal_assessment_sections WHERE name = 'exposure_index' LIMIT 1),
    'Have you explored what people do in Media / communication related roles?',
    'rating', 11, true,
    '{"strength_type": "Media / communication", "capability_area": "Exposure & Career Awareness", "mission_trigger": "Media / communication career card or role interview"}'::jsonb
),
(
    (SELECT id FROM public.personal_assessment_sections WHERE name = 'exposure_index' LIMIT 1),
    'Have you explored what people do in Manufacturing related roles?',
    'rating', 12, true,
    '{"strength_type": "Manufacturing", "capability_area": "Exposure & Career Awareness", "mission_trigger": "Manufacturing career card or role interview"}'::jsonb
),
(
    (SELECT id FROM public.personal_assessment_sections WHERE name = 'exposure_index' LIMIT 1),
    'Have you explored what people do in Logistics related roles?',
    'rating', 13, true,
    '{"strength_type": "Logistics", "capability_area": "Exposure & Career Awareness", "mission_trigger": "Logistics career card or role interview"}'::jsonb
),
(
    (SELECT id FROM public.personal_assessment_sections WHERE name = 'exposure_index' LIMIT 1),
    'Have you explored what people do in Environment related roles?',
    'rating', 14, true,
    '{"strength_type": "Environment", "capability_area": "Exposure & Career Awareness", "mission_trigger": "Environment career card or role interview"}'::jsonb
),
(
    (SELECT id FROM public.personal_assessment_sections WHERE name = 'exposure_index' LIMIT 1),
    'Have you explored what people do in Arts / culture related roles?',
    'rating', 15, true,
    '{"strength_type": "Arts / culture", "capability_area": "Exposure & Career Awareness", "mission_trigger": "Arts / culture career card or role interview"}'::jsonb
)
ON CONFLICT (section_id, order_number) DO UPDATE SET
    question_text = EXCLUDED.question_text, question_type = EXCLUDED.question_type,
    metadata = EXCLUDED.metadata, is_active = EXCLUDED.is_active, updated_at = NOW();

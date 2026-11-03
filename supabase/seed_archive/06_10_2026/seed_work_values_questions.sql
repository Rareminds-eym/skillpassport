-- ============================================================================
-- Insert Work Values & Motivators Section and Questions
-- ============================================================================
-- This script inserts the "values" section and its 24 questions into the database
-- for college/after12 assessments
-- ============================================================================

-- Step 1: Insert the Values Section
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
    'values',
    'Work Values & Motivators',
    'Identify what drives your career satisfaction and choices.',
    'heart',
    'indigo',
    3, -- Order: after bigfive (2) and before employability (4)
    false,
    NULL,
    'How important is each factor in your ideal career?',
    '[
        {"value": 1, "label": "Not Important"},
        {"value": 2, "label": "Slightly Important"},
        {"value": 3, "label": "Moderately Important"},
        {"value": 4, "label": "Very Important"},
        {"value": 5, "label": "Extremely Important"}
    ]'::jsonb,
    false,
    true,
    'general'
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
    updated_at = NOW()
RETURNING id;

-- Store the section_id for use in question inserts
-- Note: In practice, you'll need to get this ID and use it in the next step
-- For this script, we'll use a subquery

-- Step 2: Insert Work Values Questions (24 questions)
-- ============================================================================

-- Security/Stability - 3 questions
INSERT INTO public.personal_assessment_questions (
    section_id,
    question_text,
    question_type,
    order_number,
    is_active,
    metadata
) VALUES
(
    (SELECT id FROM public.personal_assessment_sections WHERE name = 'values' LIMIT 1),
    'A predictable job with steady income.',
    'rating',
    1,
    true,
    '{"value_type": "Security", "work_value": "Security"}'::jsonb
),
(
    (SELECT id FROM public.personal_assessment_sections WHERE name = 'values' LIMIT 1),
    'Long-term job certainty matters to me.',
    'rating',
    2,
    true,
    '{"value_type": "Security", "work_value": "Security"}'::jsonb
),
(
    (SELECT id FROM public.personal_assessment_sections WHERE name = 'values' LIMIT 1),
    'I prefer low-risk career paths.',
    'rating',
    3,
    true,
    '{"value_type": "Security", "work_value": "Security"}'::jsonb
),

-- Autonomy/Independence - 3 questions
(
    (SELECT id FROM public.personal_assessment_sections WHERE name = 'values' LIMIT 1),
    'Freedom to decide how I work.',
    'rating',
    4,
    true,
    '{"value_type": "Autonomy", "work_value": "Autonomy"}'::jsonb
),
(
    (SELECT id FROM public.personal_assessment_sections WHERE name = 'values' LIMIT 1),
    'I dislike being micromanaged.',
    'rating',
    5,
    true,
    '{"value_type": "Autonomy", "work_value": "Autonomy"}'::jsonb
),
(
    (SELECT id FROM public.personal_assessment_sections WHERE name = 'values' LIMIT 1),
    'I want control over my schedule.',
    'rating',
    6,
    true,
    '{"value_type": "Autonomy", "work_value": "Autonomy"}'::jsonb
),

-- Creativity/Innovation - 3 questions
(
    (SELECT id FROM public.personal_assessment_sections WHERE name = 'values' LIMIT 1),
    'Chances to create new solutions.',
    'rating',
    7,
    true,
    '{"value_type": "Creativity", "work_value": "Creativity"}'::jsonb
),
(
    (SELECT id FROM public.personal_assessment_sections WHERE name = 'values' LIMIT 1),
    'Work that lets me experiment.',
    'rating',
    8,
    true,
    '{"value_type": "Creativity", "work_value": "Creativity"}'::jsonb
),
(
    (SELECT id FROM public.personal_assessment_sections WHERE name = 'values' LIMIT 1),
    'I need variety and originality in tasks.',
    'rating',
    9,
    true,
    '{"value_type": "Creativity", "work_value": "Creativity"}'::jsonb
),

-- Status/Recognition - 3 questions
(
    (SELECT id FROM public.personal_assessment_sections WHERE name = 'values' LIMIT 1),
    'Prestige and reputation matter to me.',
    'rating',
    10,
    true,
    '{"value_type": "Status", "work_value": "Status"}'::jsonb
),
(
    (SELECT id FROM public.personal_assessment_sections WHERE name = 'values' LIMIT 1),
    'I want my achievements noticed.',
    'rating',
    11,
    true,
    '{"value_type": "Status", "work_value": "Status"}'::jsonb
),
(
    (SELECT id FROM public.personal_assessment_sections WHERE name = 'values' LIMIT 1),
    'I''d like to be seen as successful.',
    'rating',
    12,
    true,
    '{"value_type": "Status", "work_value": "Status"}'::jsonb
),

-- Impact/Service - 3 questions
(
    (SELECT id FROM public.personal_assessment_sections WHERE name = 'values' LIMIT 1),
    'I want my work to improve lives.',
    'rating',
    13,
    true,
    '{"value_type": "Impact", "work_value": "Impact"}'::jsonb
),
(
    (SELECT id FROM public.personal_assessment_sections WHERE name = 'values' LIMIT 1),
    'I prefer roles that help society.',
    'rating',
    14,
    true,
    '{"value_type": "Impact", "work_value": "Impact"}'::jsonb
),
(
    (SELECT id FROM public.personal_assessment_sections WHERE name = 'values' LIMIT 1),
    'I feel motivated by meaningful contribution.',
    'rating',
    15,
    true,
    '{"value_type": "Impact", "work_value": "Impact"}'::jsonb
),

-- Financial Reward - 3 questions
(
    (SELECT id FROM public.personal_assessment_sections WHERE name = 'values' LIMIT 1),
    'High earning potential is a priority.',
    'rating',
    16,
    true,
    '{"value_type": "Financial", "work_value": "Financial"}'::jsonb
),
(
    (SELECT id FROM public.personal_assessment_sections WHERE name = 'values' LIMIT 1),
    'I''m motivated by growth in pay.',
    'rating',
    17,
    true,
    '{"value_type": "Financial", "work_value": "Financial"}'::jsonb
),
(
    (SELECT id FROM public.personal_assessment_sections WHERE name = 'values' LIMIT 1),
    'I''d like performance-linked rewards.',
    'rating',
    18,
    true,
    '{"value_type": "Financial", "work_value": "Financial"}'::jsonb
),

-- Leadership/Influence - 3 questions
(
    (SELECT id FROM public.personal_assessment_sections WHERE name = 'values' LIMIT 1),
    'I want to guide teams or decisions.',
    'rating',
    19,
    true,
    '{"value_type": "Leadership", "work_value": "Leadership"}'::jsonb
),
(
    (SELECT id FROM public.personal_assessment_sections WHERE name = 'values' LIMIT 1),
    'I see myself taking responsibility for outcomes.',
    'rating',
    20,
    true,
    '{"value_type": "Leadership", "work_value": "Leadership"}'::jsonb
),
(
    (SELECT id FROM public.personal_assessment_sections WHERE name = 'values' LIMIT 1),
    'I enjoy influencing direction of work.',
    'rating',
    21,
    true,
    '{"value_type": "Leadership", "work_value": "Leadership"}'::jsonb
),

-- Lifestyle/Balance - 3 questions
(
    (SELECT id FROM public.personal_assessment_sections WHERE name = 'values' LIMIT 1),
    'Work should fit my life priorities.',
    'rating',
    22,
    true,
    '{"value_type": "Lifestyle", "work_value": "Lifestyle"}'::jsonb
),
(
    (SELECT id FROM public.personal_assessment_sections WHERE name = 'values' LIMIT 1),
    'I value time for family/health/hobbies.',
    'rating',
    23,
    true,
    '{"value_type": "Lifestyle", "work_value": "Lifestyle"}'::jsonb
),
(
    (SELECT id FROM public.personal_assessment_sections WHERE name = 'values' LIMIT 1),
    'Work should fit my life priorities.',
    'rating',
    24,
    true,
    '{"value_type": "Lifestyle", "work_value": "Lifestyle"}'::jsonb
)
ON CONFLICT (section_id, order_number) DO UPDATE SET
    question_text = EXCLUDED.question_text,
    question_type = EXCLUDED.question_type,
    metadata = EXCLUDED.metadata,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();


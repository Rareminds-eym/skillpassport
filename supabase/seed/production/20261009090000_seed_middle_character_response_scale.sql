-- Configure the documented 1-4 answer options for Strengths & Character.
-- Runs after the initial seed; preserves an already configured response scale.

UPDATE public.personal_assessment_sections
SET
    response_scale = '[
        { "value": 1, "label": "Not like me" },
        { "value": 2, "label": "Sometimes" },
        { "value": 3, "label": "Mostly me" },
        { "value": 4, "label": "Very me" }
    ]'::jsonb,
    updated_at = NOW()
WHERE name = 'middle_strengths_character'
    AND grade_level = 'middle'
    AND (
        response_scale IS NULL
        OR response_scale = '[]'::jsonb
    );

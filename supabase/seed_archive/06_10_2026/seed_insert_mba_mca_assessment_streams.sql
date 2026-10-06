BEGIN;

INSERT INTO public.personal_assessment_streams (
    id,
    label,
    description,
    is_active,
    created_at,
    name,
    grade_level,
    display_order,
    updated_at
)
VALUES
    (
        'mba',
        'MBA',
        'Master of Business Administration - program-based postgraduate assessment',
        true,
        now(),
        'Master of Business Administration',
        'college',
        1000,
        now()
    ),
    (
        'mca',
        'MCA',
        'Master of Computer Applications - program-based postgraduate assessment',
        true,
        now(),
        'Master of Computer Applications',
        'college',
        1001,
        now()
    )
ON CONFLICT (id) DO UPDATE SET
    label = EXCLUDED.label,
    description = EXCLUDED.description,
    is_active = EXCLUDED.is_active,
    name = EXCLUDED.name,
    grade_level = EXCLUDED.grade_level,
    display_order = EXCLUDED.display_order,
    updated_at = now();

COMMIT;

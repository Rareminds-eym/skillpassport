INSERT INTO public.demo_course_access (
    learner_id,
    course_id,
    is_enabled
)
SELECT DISTINCT
    l.id,
    i.course_id,
    TRUE
FROM public.learner_course_interests AS i
JOIN public.learners AS l
    ON l.user_id = i.user_id
JOIN public.courses AS c
    ON c.course_id = i.course_id
ON CONFLICT (learner_id, course_id)
DO UPDATE SET
    is_enabled = TRUE,
    updated_at = NOW();
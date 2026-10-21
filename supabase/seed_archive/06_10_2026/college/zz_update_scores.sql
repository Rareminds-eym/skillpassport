-- Update aptitude_scores and knowledge_scores for completed MBA/MCA attempts
UPDATE public.personal_assessment_attempts AS paa
SET
    aptitude_scores = COALESCE(
        (
            SELECT jsonb_object_agg(r.key, r.value)
            FROM jsonb_each(paa.all_responses) AS r(key, value)
            WHERE r.key IN (
                SELECT COALESCE(
                    item->>'uuid',
                    item->>'id'
                )
                FROM public.career_assessment_ai_questions AS cq
                CROSS JOIN LATERAL jsonb_array_elements(cq.questions) AS item
                WHERE LOWER(cq.stream_id) = LOWER(paa.stream_id)
                  AND LOWER(cq.question_type) LIKE '%aptitude%'
            )
        ),
        '{}'::jsonb
    ),

    knowledge_scores = COALESCE(
        (
            SELECT jsonb_object_agg(r.key, r.value)
            FROM jsonb_each(paa.all_responses) AS r(key, value)
            WHERE r.key IN (
                SELECT COALESCE(
                    item->>'uuid',
                    item->>'id'
                )
                FROM public.career_assessment_ai_questions AS cq
                CROSS JOIN LATERAL jsonb_array_elements(cq.questions) AS item
                WHERE LOWER(cq.stream_id) = LOWER(paa.stream_id)
                  AND LOWER(cq.question_type) LIKE '%knowledge%'
            )
        ),
        '{}'::jsonb
    )
WHERE paa.status = 'in_progress'
  AND paa.stream_id IN ('mba', 'mca');

-- Script to transform existing profile data into structured education/training/experience arrays
-- This converts the flat profile data into the arrays expected by the Dashboard

UPDATE public.students 
SET profile = profile || jsonb_build_object(
    'education', 
    CASE 
        WHEN profile->'education' IS NULL OR jsonb_array_length(profile->'education') = 0 THEN
            jsonb_build_array(
                jsonb_build_object(
                    'id', 1,
                    'degree', COALESCE(profile->>'branch_field', 'Degree'),
                    'university', COALESCE(profile->>'university', COALESCE(profile->>'college_school_name', 'University')),
                    'level', CASE 
                        WHEN profile->>'branch_field' ILIKE '%b.tech%' OR profile->>'branch_field' ILIKE '%bachelor%' THEN 'Bachelor''s'
                        WHEN profile->>'branch_field' ILIKE '%b.sc%' THEN 'Bachelor''s'
                        WHEN profile->>'branch_field' ILIKE '%diploma%' THEN 'Diploma'
                        ELSE 'Bachelor''s'
                    END,
                    'status', 'ongoing',
                    'enabled', true,
                    'department', COALESCE(profile->>'branch_field', 'General'),
                    'yearOfPassing', EXTRACT(YEAR FROM CURRENT_DATE + INTERVAL '1 year')::text,
                    'cgpa', 'N/A'
                )
            )
        ELSE profile->'education'
    END,
    
    'training',
    CASE 
        WHEN profile->'training' IS NULL OR jsonb_array_length(profile->'training') = 0 THEN
            jsonb_build_array(
                jsonb_build_object(
                    'id', 1,
                    'course', COALESCE(profile->>'course', 'General Training'),
                    'status', 'ongoing',
                    'enabled', true,
                    'progress', 75,
                    'startDate', CURRENT_DATE::text,
                    'instructor', COALESCE(profile->>'trainer_name', 'Instructor'),
                    'description', 'Training course: ' || COALESCE(profile->>'course', 'General Training')
                )
            )
        ELSE profile->'training'
    END,
    
    'experience',
    CASE 
        WHEN profile->'experience' IS NULL OR jsonb_array_length(profile->'experience') = 0 THEN
            jsonb_build_array()
        ELSE profile->'experience'
    END,
    
    'technicalSkills',
    CASE 
        WHEN profile->'technicalSkills' IS NULL OR jsonb_array_length(profile->'technicalSkills') = 0 THEN
            jsonb_build_array(
                jsonb_build_object(
                    'id', 1,
                    'name', COALESCE(profile->>'skill', 'General Skills'),
                    'level', 3,
                    'enabled', true,
                    'category', COALESCE(profile->>'course', 'General'),
                    'verified', false,
                    'description', 'Primary skill: ' || COALESCE(profile->>'skill', 'General Skills')
                )
            )
        ELSE profile->'technicalSkills'
    END,
    
    'softSkills',
    CASE 
        WHEN profile->'softSkills' IS NULL OR jsonb_array_length(profile->'softSkills') = 0 THEN
            jsonb_build_array(
                jsonb_build_object(
                    'id', 1,
                    'name', 'Communication',
                    'level', 4,
                    'enabled', true,
                    'description', 'Strong communication skills'
                ),
                jsonb_build_object(
                    'id', 2,
                    'name', 'Problem Solving',
                    'level', 3,
                    'enabled', true,
                    'description', 'Analytical thinking and problem resolution'
                )
            )
        ELSE profile->'softSkills'
    END
)
WHERE profile IS NOT NULL 
AND (
    profile->'education' IS NULL OR 
    profile->'training' IS NULL OR 
    profile->'technicalSkills' IS NULL OR 
    profile->'softSkills' IS NULL OR
    jsonb_array_length(COALESCE(profile->'education', '[]'::jsonb)) = 0
);

-- Verify the transformation
SELECT 
    profile->>'name' as student_name,
    profile->>'email' as email,
    jsonb_array_length(profile->'education') as education_count,
    jsonb_array_length(profile->'training') as training_count,
    jsonb_array_length(profile->'experience') as experience_count,
    jsonb_array_length(profile->'technicalSkills') as tech_skills_count,
    jsonb_array_length(profile->'softSkills') as soft_skills_count,
    profile->'education'->0->>'degree' as first_degree,
    profile->'training'->0->>'course' as first_course
FROM public.students 
WHERE profile IS NOT NULL
LIMIT 5;
-- Script to check current profile structure and preview transformation
-- Run this BEFORE running the transform script to see what will change

-- Check current profile structure for specific student
SELECT 
    'CURRENT PROFILE DATA' as section,
    profile->>'name' as student_name,
    profile->>'email' as email,
    profile->>'branch_field' as degree_field,
    profile->>'university' as university,
    profile->>'course' as training_course,
    profile->>'skill' as primary_skill,
    profile ? 'education' as has_education_array,
    profile ? 'training' as has_training_array,
    profile ? 'experience' as has_experience_array,
    profile ? 'technicalSkills' as has_tech_skills_array,
    profile ? 'softSkills' as has_soft_skills_array
FROM public.students 
WHERE profile->>'email' = 'rajibornin2005@gmail.com';

-- Preview what the education array will look like
SELECT 
    'EDUCATION PREVIEW' as section,
    jsonb_build_array(
        jsonb_build_object(
            'id', 1,
            'degree', profile->>'branch_field',
            'university', COALESCE(profile->>'university', profile->>'college_school_name'),
            'level', CASE 
                WHEN profile->>'branch_field' ILIKE '%b.tech%' OR profile->>'branch_field' ILIKE '%bachelor%' THEN 'Bachelor''s'
                WHEN profile->>'branch_field' ILIKE '%b.sc%' THEN 'Bachelor''s'
                WHEN profile->>'branch_field' ILIKE '%diploma%' THEN 'Diploma'
                ELSE 'Bachelor''s'
            END,
            'status', 'ongoing',
            'enabled', true,
            'department', profile->>'branch_field',
            'yearOfPassing', EXTRACT(YEAR FROM CURRENT_DATE + INTERVAL '1 year')::text,
            'cgpa', 'N/A'
        )
    ) as education_array_preview
FROM public.students 
WHERE profile->>'email' = 'rajibornin2005@gmail.com';

-- Preview what the training array will look like
SELECT 
    'TRAINING PREVIEW' as section,
    jsonb_build_array(
        jsonb_build_object(
            'id', 1,
            'course', profile->>'course',
            'status', 'ongoing',
            'enabled', true,
            'progress', 75,
            'startDate', CURRENT_DATE::text,
            'instructor', COALESCE(profile->>'trainer_name', 'Instructor'),
            'description', 'Training course: ' || profile->>'course'
        )
    ) as training_array_preview
FROM public.students 
WHERE profile->>'email' = 'rajibornin2005@gmail.com';

-- Preview what the technical skills array will look like
SELECT 
    'TECHNICAL SKILLS PREVIEW' as section,
    jsonb_build_array(
        jsonb_build_object(
            'id', 1,
            'name', profile->>'skill',
            'level', 3,
            'enabled', true,
            'category', profile->>'course',
            'verified', false,
            'description', 'Primary skill: ' || profile->>'skill'
        )
    ) as tech_skills_array_preview
FROM public.students 
WHERE profile->>'email' = 'rajibornin2005@gmail.com';
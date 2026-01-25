-- Import script that creates users first, then students
-- School ID: 19442d7b-ff7f-4c7f-ad85-9e501f122b26
-- 
-- IMPORTANT: This script needs to be run with service_role permissions
-- Run this in Supabase SQL Editor

-- Create a function to insert user and student together
CREATE OR REPLACE FUNCTION create_student_with_user(
    p_email TEXT,
    p_name TEXT,
    p_student_id TEXT,
    p_grade TEXT,
    p_school_id UUID
) RETURNS UUID AS $$
DECLARE
    v_user_id UUID;
BEGIN
    -- Generate a UUID for the user
    v_user_id := gen_random_uuid();
    
    -- Insert into auth.users (this requires service_role)
    INSERT INTO auth.users (
        id,
        email,
        encrypted_password,
        email_confirmed_at,
        created_at,
        updated_at,
        raw_app_meta_data,
        raw_user_meta_data,
        is_super_admin,
        role
    ) VALUES (
        v_user_id,
        p_email,
        crypt('TempPassword123!', gen_salt('bf')), -- Temporary password
        NOW(),
        NOW(),
        NOW(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        jsonb_build_object('name', p_name),
        false,
        'authenticated'
    ) ON CONFLICT (email) DO UPDATE SET email = EXCLUDED.email
    RETURNING id INTO v_user_id;
    
    -- Insert into public.users
    INSERT INTO public.users (
        id,
        email,
        role,
        "firstName",
        "lastName",
        "createdAt",
        "updatedAt"
    ) VALUES (
        v_user_id,
        p_email,
        'school_student',
        split_part(p_name, ' ', 1),
        split_part(p_name, ' ', 2),
        NOW(),
        NOW()
    ) ON CONFLICT (id) DO NOTHING;
    
    -- Insert into students
    INSERT INTO public.students (
        id,
        user_id,
        school_id,
        name,
        email,
        student_id,
        grade,
        student_type,
        created_at
    ) VALUES (
        v_user_id,
        v_user_id,
        p_school_id,
        p_name,
        p_email,
        p_student_id,
        p_grade,
        'direct',
        NOW()
    ) ON CONFLICT (email) DO NOTHING;
    
    RETURN v_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Now create all students with users
-- Student 1
SELECT create_student_with_user(
    'stu501@school.edu',
    'Aditi Sharma',
    'STU501',
    '10',
    '19442d7b-ff7f-4c7f-ad85-9e501f122b26'::uuid
);

-- Student 2
SELECT create_student_with_user(
    'stu502@school.edu',
    'Rahul Nair',
    'STU502',
    '10',
    '19442d7b-ff7f-4c7f-ad85-9e501f122b26'::uuid
);

-- Student 3
SELECT create_student_with_user(
    'stu503@school.edu',
    'Meera Krishnan',
    'STU503',
    '10',
    '19442d7b-ff7f-4c7f-ad85-9e501f122b26'::uuid
);

-- Student 4
SELECT create_student_with_user(
    'stu504@school.edu',
    'Vignesh Kumar',
    'STU504',
    '10',
    '19442d7b-ff7f-4c7f-ad85-9e501f122b26'::uuid
);

-- Student 5
SELECT create_student_with_user(
    'stu505@school.edu',
    'Ananya Rao',
    'STU505',
    '10',
    '19442d7b-ff7f-4c7f-ad85-9e501f122b26'::uuid
);

-- Student 6
SELECT create_student_with_user(
    'stu506@school.edu',
    'Harini S',
    'STU506',
    '10',
    '19442d7b-ff7f-4c7f-ad85-9e501f122b26'::uuid
);

-- Student 7
SELECT create_student_with_user(
    'stu507@school.edu',
    'Rohit Menon',
    'STU507',
    '10',
    '19442d7b-ff7f-4c7f-ad85-9e501f122b26'::uuid
);

-- Student 8
SELECT create_student_with_user(
    'stu508@school.edu',
    'Sana Farooq',
    'STU508',
    '10',
    '19442d7b-ff7f-4c7f-ad85-9e501f122b26'::uuid
);

-- Student 9
SELECT create_student_with_user(
    'stu509@school.edu',
    'Arjun Desai',
    'STU509',
    '10',
    '19442d7b-ff7f-4c7f-ad85-9e501f122b26'::uuid
);

-- Student 10
SELECT create_student_with_user(
    'stu510@school.edu',
    'Priya Joshi',
    'STU510',
    '10',
    '19442d7b-ff7f-4c7f-ad85-9e501f122b26'::uuid
);

-- Continue for all 25 students...
-- (Add remaining students here)

-- After all students are created, add their projects, skills, etc.
-- Projects
INSERT INTO projects (student_id, title, description, status, tech_stack, approval_status, enabled, created_at)
SELECT s.user_id, 'Social survey', 'Grade 6 project. Fast learner', 'completed', '{}', 'approved', true, NOW()
FROM students s WHERE s.student_id = 'STU501';

-- Skills
INSERT INTO skills (student_id, name, type, level, verified, approval_status, enabled, created_at)
SELECT s.user_id, 'Python', 'technical', 3, false, 'approved', true, NOW()
FROM students s WHERE s.student_id = 'STU501';

-- Certificates
INSERT INTO certificates (student_id, title, issuer, status, approval_status, enabled, created_at)
SELECT s.user_id, 'Communication Course', 'School', 'completed', 'approved', true, NOW()
FROM students s WHERE s.student_id = 'STU501';

-- Education
INSERT INTO education (student_id, level, degree, department, status, approval_status, created_at)
SELECT s.user_id, 'undergraduate', 'B.Tech', 'Computer Science', 'ongoing', 'approved', NOW()
FROM students s WHERE s.student_id = 'STU501';

-- Experience
INSERT INTO experience (student_id, organization, role, duration, verified, approval_status, created_at)
SELECT s.user_id, 'Tech Company', 'Intern', '3 months', false, 'approved', NOW()
FROM students s WHERE s.student_id = 'STU501';

-- Clean up the function after use (optional)
-- DROP FUNCTION IF EXISTS create_student_with_user;

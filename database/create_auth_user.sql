-- Simple script to create and link a specific auth user
-- Use this if you want to create auth user through SQL (advanced method)

-- WARNING: This method creates auth users directly in the database
-- For production, prefer using Supabase Dashboard or Auth API

-- Create auth user and link to student (ADVANCED - USE WITH CAUTION)
DO $$
DECLARE
    new_user_id uuid := gen_random_uuid();
    student_record RECORD;
    hashed_password text;
BEGIN
    -- Check if user already exists
    IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'harrishhari2006@gmail.com') THEN
        RAISE NOTICE 'Auth user already exists for harrishhari2006@gmail.com';
        RETURN;
    END IF;
    
    -- Find student record first
    SELECT * INTO student_record
    FROM public.students 
    WHERE profile->>'email' = 'harrishhari2006@gmail.com'
    AND user_id IS NULL
    LIMIT 1;
    
    IF student_record.id IS NULL THEN
        RAISE NOTICE 'No student found with email harrishhari2006@gmail.com';
        RETURN;
    END IF;
    
    -- Create auth user (simplified version - password will need to be set separately)
    INSERT INTO auth.users (
        id,
        email,
        email_confirmed_at,
        created_at,
        updated_at,
        raw_user_meta_data,
        is_super_admin,
        role
    ) VALUES (
        new_user_id,
        'harrishhari2006@gmail.com',
        now(),
        now(),
        now(),
        jsonb_build_object(
            'name', student_record.profile->>'name',
            'email', 'harrishhari2006@gmail.com'
        ),
        false,
        'authenticated'
    );
    
    -- Link student to auth user
    UPDATE public.students 
    SET user_id = new_user_id,
        email = 'harrishhari2006@gmail.com'
    WHERE id = student_record.id;
    
    RAISE NOTICE 'Created auth user % and linked to student %', new_user_id, student_record.id;
    RAISE NOTICE 'IMPORTANT: You need to set a password for this user through Supabase Dashboard';
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error creating auth user: %', SQLERRM;
    RAISE NOTICE 'Please use Supabase Dashboard to create auth users instead';
END $$;
-- Script to link existing students with existing auth users
-- This script connects your migrated students table with existing auth users

-- Step 1: Show current auth users
SELECT 
    'Current Auth Users:' as section,
    id as auth_user_id,
    email,
    created_at,
    email_confirmed_at IS NOT NULL as email_confirmed,
    raw_user_meta_data->>'name' as user_name
FROM auth.users
ORDER BY created_at DESC;

-- Step 2: Show students that need linking
SELECT 
    'Students Needing Links:' as section,
    id as student_id,
    COALESCE(email, profile->>'email') as student_email,
    profile->>'name' as student_name,
    user_id as current_user_id,
    "createdAt"
FROM public.students 
WHERE user_id IS NULL
ORDER BY "createdAt" DESC;

-- Step 3: AUTOMATIC LINKING - Match and update existing data
DO $$
DECLARE
    link_record RECORD;
    linked_count integer := 0;
    updated_count integer := 0;
BEGIN
    RAISE NOTICE 'Starting automatic linking process...';
    
    -- Link students to auth users based on matching emails
    FOR link_record IN 
        SELECT 
            au.id as auth_user_id,
            au.email as auth_email,
            s.id as student_id,
            s.profile->>'name' as student_name,
            COALESCE(s.email, s.profile->>'email') as current_email
        FROM auth.users au
        JOIN public.students s ON (
            au.email = s.email OR 
            au.email = s.profile->>'email'
        )
        WHERE s.user_id IS NULL
        ORDER BY au.created_at DESC
    LOOP
        -- Update the student record with auth user connection
        UPDATE public.students 
        SET user_id = link_record.auth_user_id,
            email = link_record.auth_email,
            "updatedAt" = now()
        WHERE id = link_record.student_id;
        
        GET DIAGNOSTICS updated_count = ROW_COUNT;
        
        IF updated_count > 0 THEN
            linked_count := linked_count + 1;
            RAISE NOTICE 'Linked: % (%) → Auth User % (email: %)', 
                         link_record.student_name,
                         link_record.student_id, 
                         link_record.auth_user_id, 
                         link_record.auth_email;
        END IF;
    END LOOP;
    
    IF linked_count = 0 THEN
        RAISE NOTICE 'No students were linked. Possible reasons:';
        RAISE NOTICE '1. All students already have user_id assigned';
        RAISE NOTICE '2. No email matches between auth.users and students';
        RAISE NOTICE '3. Check the diagnostic queries above for details';
    ELSE
        RAISE NOTICE 'SUCCESS: % students linked to auth users!', linked_count;
    END IF;
END $$;

-- Step 4: Handle specific case for harrishhari2006@gmail.com if not auto-linked
DO $$
DECLARE
    auth_user_id uuid;
    student_id uuid;
    update_count integer;
BEGIN
    -- Find auth user for Harrish
    SELECT id INTO auth_user_id 
    FROM auth.users 
    WHERE email = 'harrishhari2006@gmail.com'
    LIMIT 1;
    
    IF auth_user_id IS NULL THEN
        RAISE NOTICE 'No auth user found for harrishhari2006@gmail.com';
        RAISE NOTICE 'Please create this user in Supabase Dashboard first';
        RETURN;
    END IF;
    
    -- Find student record that matches
    SELECT id INTO student_id
    FROM public.students 
    WHERE (email = 'harrishhari2006@gmail.com' OR profile->>'email' = 'harrishhari2006@gmail.com')
    AND user_id IS NULL
    LIMIT 1;
    
    IF student_id IS NOT NULL THEN
        -- Update the specific student record
        UPDATE public.students 
        SET user_id = auth_user_id,
            email = 'harrishhari2006@gmail.com',
            "updatedAt" = now()
        WHERE id = student_id;
        
        GET DIAGNOSTICS update_count = ROW_COUNT;
        
        IF update_count > 0 THEN
            RAISE NOTICE 'MANUALLY LINKED: Harrish student % to auth user %', student_id, auth_user_id;
        END IF;
    ELSE
        RAISE NOTICE 'Harrish student already linked or not found';
    END IF;
END $$;

-- Step 5: Verification - Show successfully linked students
SELECT 
    'Successfully Linked Students:' as section,
    s.id as student_id,
    s.user_id as auth_user_id,
    s.email as student_email,
    s.profile->>'name' as student_name,
    au.email as auth_email,
    au.created_at as auth_created,
    s."updatedAt" as link_updated
FROM public.students s
JOIN auth.users au ON s.user_id = au.id
ORDER BY s."updatedAt" DESC;

-- Step 6: Show any remaining unlinked students
SELECT 
    'Remaining Unlinked Students:' as section,
    id as student_id,
    COALESCE(email, profile->>'email') as student_email,
    profile->>'name' as student_name,
    profile->>'contact_number' as contact,
    "createdAt"
FROM public.students 
WHERE user_id IS NULL
ORDER BY "createdAt" DESC;

-- Step 7: Summary statistics
SELECT 
    'LINKING SUMMARY:' as section,
    COUNT(*) as total_students,
    COUNT(user_id) as linked_students,
    COUNT(*) - COUNT(user_id) as unlinked_students,
    ROUND((COUNT(user_id)::numeric / COUNT(*)::numeric) * 100, 2) as link_percentage
FROM public.students;
-- Simple email/password authentication setup
-- This creates a basic login system that automatically connects to student data

-- Step 1: Create auth user for testing (if not exists)
-- You can create this through Supabase Dashboard: Authentication > Users > Add User
-- Email: harrishhari2006@gmail.com
-- Password: [choose secure password]

-- Step 2: Auto-link any auth user to student data based on email matching
CREATE OR REPLACE FUNCTION auto_link_student_on_login()
RETURNS TRIGGER AS $$
DECLARE
    student_record RECORD;
BEGIN
    -- When a user logs in (or is created), automatically link to student data
    
    -- Find student record with matching email
    SELECT * INTO student_record
    FROM public.students 
    WHERE profile->>'email' = NEW.email
    OR email = NEW.email
    LIMIT 1;
    
    -- If student found and not already linked
    IF student_record.id IS NOT NULL AND student_record.user_id IS NULL THEN
        UPDATE public.students 
        SET user_id = NEW.id,
            email = NEW.email,
            "updatedAt" = now()
        WHERE id = student_record.id;
        
        -- Also create/update recent_updates entry
        INSERT INTO public.recent_updates (student_id, user_id, updates)
        VALUES (
            student_record.id,
            NEW.id,
            '{"updates": [{"id": "welcome", "message": "Welcome to your dashboard!", "timestamp": "Just now", "type": "welcome"}]}'::jsonb
        )
        ON CONFLICT (student_id) DO UPDATE SET
            user_id = NEW.id;
            
        RAISE LOG 'Auto-linked user % to student %', NEW.id, student_record.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Create trigger for auto-linking on auth events
DROP TRIGGER IF EXISTS auto_link_on_auth ON auth.users;
CREATE TRIGGER auto_link_on_auth
    AFTER INSERT OR UPDATE ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION auto_link_student_on_login();

-- Step 4: Manual link for existing users (run once)
DO $$
DECLARE
    link_record RECORD;
    linked_count integer := 0;
BEGIN
    RAISE NOTICE 'Linking existing auth users to student profiles...';
    
    FOR link_record IN 
        SELECT 
            au.id as auth_user_id,
            au.email as auth_email,
            s.id as student_id,
            s.profile->>'name' as student_name
        FROM auth.users au
        JOIN public.students s ON (
            au.email = s.profile->>'email' OR
            au.email = s.email
        )
        WHERE s.user_id IS NULL
    LOOP
        -- Link student to auth user
        UPDATE public.students 
        SET user_id = link_record.auth_user_id,
            email = link_record.auth_email,
            "updatedAt" = now()
        WHERE id = link_record.student_id;
        
        -- Create recent_updates entry
        INSERT INTO public.recent_updates (student_id, user_id, updates)
        VALUES (
            link_record.student_id,
            link_record.auth_user_id,
            '{"updates": [{"id": "linked", "message": "Account successfully linked!", "timestamp": "Just now", "type": "system"}]}'::jsonb
        )
        ON CONFLICT (student_id) DO UPDATE SET
            user_id = link_record.auth_user_id;
        
        linked_count := linked_count + 1;
        RAISE NOTICE 'Linked: % (%) to auth user %', 
                     link_record.student_name, 
                     link_record.student_id,
                     link_record.auth_user_id;
    END LOOP;
    
    RAISE NOTICE 'Total linked: % students', linked_count;
END $$;

-- Step 5: Verify the setup
SELECT 
    'AUTH SETUP VERIFICATION' as status,
    au.email as auth_email,
    s.profile->>'name' as student_name,
    s.user_id IS NOT NULL as is_linked,
    ru.updates->>'updates' as recent_updates_count
FROM auth.users au
LEFT JOIN public.students s ON s.user_id = au.id
LEFT JOIN public.recent_updates ru ON ru.user_id = au.id
ORDER BY au.created_at DESC;
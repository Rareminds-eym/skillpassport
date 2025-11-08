-- Debug script to check auth triggers and temporarily disable problematic ones
-- Run this in Supabase SQL Editor

-- Step 1: Check what triggers exist on auth.users
SELECT
    event_object_schema,
    event_object_table,
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'auth'
    AND event_object_table = 'users'
ORDER BY trigger_name;

-- Step 2: Check what functions are called by these triggers
SELECT
    n.nspname as schema_name,
    p.proname as function_name,
    pg_get_function_identity_arguments(p.oid) as arguments,
    obj_description(p.oid, 'pg_proc') as description
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
    AND p.proname IN (
        SELECT substring(action_statement from 'FUNCTION ([^(]+)') as func_name
        FROM information_schema.triggers
        WHERE event_object_schema = 'auth'
            AND event_object_table = 'users'
    );

-- Step 3: Temporarily disable the problematic trigger (UNCOMMENT TO RUN)
-- DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Step 4: Test auth user creation manually (run this after disabling trigger)
-- INSERT INTO auth.users (
--     instance_id,
--     id,
--     aud,
--     role,
--     email,
--     encrypted_password,
--     email_confirmed_at,
--     invited_at,
--     confirmation_token,
--     confirmation_sent_at,
--     recovery_token,
--     recovery_sent_at,
--     email_change_token_new,
--     email_change,
--     email_change_sent_at,
--     last_sign_in_at,
--     raw_app_meta_data,
--     raw_user_meta_data,
--     is_super_admin,
--     created_at,
--     updated_at,
--     phone,
--     phone_confirmed_at,
--     phone_change,
--     phone_change_token,
--     phone_change_sent_at,
--     email_change_token_current,
--     email_change_confirm_status,
--     banned_until,
--     reauthentication_token,
--     reauthentication_sent_at
-- ) VALUES (
--     '00000000-0000-0000-0000-000000000000',
--     gen_random_uuid(),
--     'authenticated',
--     'authenticated',
--     'test@example.com',
--     crypt('TempPass123!', gen_salt('bf')),
--     now(),
--     now(),
--     '',
--     now(),
--     '',
--     NULL,
--     '',
--     '',
--     NULL,
--     now(),
--     '{}',
--     '{"name": "Test User"}',
--     false,
--     now(),
--     now(),
--     NULL,
--     NULL,
--     '',
--     '',
--     NULL,
--     '',
--     0,
--     '',
--     NULL
-- );

-- Step 5: Re-enable the trigger (run this after testing)
-- CREATE TRIGGER on_auth_user_created
--   AFTER INSERT ON auth.users
--   FOR EACH ROW EXECUTE FUNCTION handle_new_user();
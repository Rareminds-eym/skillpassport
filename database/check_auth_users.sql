-- Script to link existing students with auth users
-- This script helps you connect your migrated students table with actual auth users

-- Step 1: Check current auth users
SELECT 
    'Auth Users:' as table_type,
    id as user_id,
    email,
    created_at,
    email_confirmed_at,
    raw_user_meta_data->>'name' as name
FROM auth.users
ORDER BY created_at DESC;

-- Step 2: Check students without user_id
SELECT 
    'Students without user_id:' as table_type,
    id as student_id,
    email as student_email,
    profile->>'email' as profile_email,
    profile->>'name' as student_name,
    "createdAt"
FROM public.students 
WHERE user_id IS NULL
ORDER BY "createdAt" DESC;

-- Step 3: Find matching emails between auth.users and students
SELECT 
    'Potential Matches:' as match_type,
    au.id as auth_user_id,
    au.email as auth_email,
    s.id as student_id,
    s.email as student_email,
    s.profile->>'email' as profile_email,
    s.profile->>'name' as student_name
FROM auth.users au
JOIN public.students s ON (
    au.email = s.email OR 
    au.email = s.profile->>'email'
)
WHERE s.user_id IS NULL
ORDER BY au.created_at DESC;
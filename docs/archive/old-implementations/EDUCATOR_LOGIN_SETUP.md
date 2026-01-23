# Educator Login Setup Guide

## Overview
The educator login system now uses Supabase authentication with the `school_educators` table to manage educator profiles and credentials.

## Database Setup

### 1. Create the school_educators Table
Run this SQL in your Supabase SQL Editor:

```sql
-- Create the school_educators table
CREATE TABLE IF NOT EXISTS public.school_educators (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    school_id uuid NOT NULL,
    employee_id character varying(50) NULL,
    specialization character varying(100) NULL,
    qualification character varying(255) NULL,
    experience_years integer NULL,
    date_of_joining date NULL,
    account_status character varying(20) NULL DEFAULT 'active'::character varying,
    created_at timestamp with time zone NULL DEFAULT now(),
    updated_at timestamp with time zone NULL DEFAULT now(),
    metadata jsonb NULL DEFAULT '{}'::jsonb,
    designation character varying(100) NULL,
    department character varying(100) NULL,
    first_name character varying(100) NULL,
    last_name character varying(100) NULL,
    email character varying(255) NULL,
    phone_number character varying(20) NULL,
    dob date NULL,
    gender character varying(20) NULL,
    address text NULL,
    city character varying(100) NULL,
    state character varying(100) NULL,
    country character varying(100) NULL,
    pincode character varying(10) NULL,
    subjects_handled text[] NULL,
    resume_url text NULL,
    id_proof_url text NULL,
    photo_url text NULL,
    verification_status character varying(20) NULL DEFAULT 'Pending'::character varying,
    verified_by uuid NULL,
    verified_at timestamp with time zone NULL,
    CONSTRAINT school_educators_pkey PRIMARY KEY (id),
    CONSTRAINT school_educators_school_id_employee_id_key UNIQUE (school_id, employee_id),
    CONSTRAINT school_educators_user_key UNIQUE (user_id),
    CONSTRAINT school_educators_school_id_fkey FOREIGN KEY (school_id) REFERENCES public.schools (id) ON DELETE CASCADE,
    CONSTRAINT school_educators_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users (id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_school_educators_school ON public.school_educators USING btree (school_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_school_educators_user ON public.school_educators USING btree (user_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_school_educators_email ON public.school_educators USING btree (email) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_school_educators_verification_status ON public.school_educators USING btree (verification_status) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_school_educators_account_status ON public.school_educators USING btree (account_status) TABLESPACE pg_default;

-- Create trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS update_school_educators_updated_at ON public.school_educators;
CREATE TRIGGER update_school_educators_updated_at
BEFORE UPDATE ON public.school_educators
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.school_educators ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own educator profile"
ON public.school_educators
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own educator profile"
ON public.school_educators
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
```

## Creating Educator Accounts

### Method 1: Using Supabase Dashboard

1. **Create Auth User:**
   - Go to Supabase Dashboard → Authentication → Users
   - Click "Add user"
   - Enter email and password
   - Click "Create user"

2. **Create Educator Profile:**
   - Go to SQL Editor
   - Run this query (replace values):

```sql
INSERT INTO public.school_educators (
    user_id,
    school_id,
    first_name,
    last_name,
    email,
    phone_number,
    specialization,
    qualification,
    experience_years,
    date_of_joining,
    account_status,
    verification_status
) VALUES (
    'USER_ID_FROM_AUTH',  -- Copy from auth.users table
    'SCHOOL_ID',          -- UUID of the school
    'John',
    'Doe',
    'john@example.com',
    '+1234567890',
    'Mathematics',
    'M.Sc. Mathematics',
    5,
    '2020-01-15',
    'active',
    'Verified'
);
```

### Method 2: Using SQL Script

```sql
-- Create auth user and educator profile in one go
WITH new_user AS (
    INSERT INTO auth.users (
        email,
        encrypted_password,
        email_confirmed_at,
        raw_user_meta_data,
        created_at,
        updated_at
    ) VALUES (
        'educator@example.com',
        crypt('password123', gen_salt('bf')),
        now(),
        '{"role": "educator"}',
        now(),
        now()
    )
    RETURNING id
)
INSERT INTO public.school_educators (
    user_id,
    school_id,
    first_name,
    last_name,
    email,
    specialization,
    qualification,
    experience_years,
    account_status,
    verification_status
) SELECT
    new_user.id,
    'SCHOOL_ID',
    'Jane',
    'Smith',
    'educator@example.com',
    'Physics',
    'Ph.D. Physics',
    8,
    'active',
    'Verified'
FROM new_user;
```

## Login Flow

### Frontend (LoginEducator.tsx)

1. User enters email and password
2. Component calls `supabase.auth.signInWithPassword()`
3. On success:
   - Fetches educator profile from `school_educators` table
   - Updates AuthContext with user data
   - Redirects to `/educator/dashboard`

### Backend Integration

The login component now:
- ✅ Validates email format
- ✅ Validates password length (min 6 characters)
- ✅ Authenticates with Supabase Auth
- ✅ Fetches educator profile data
- ✅ Stores user info in AuthContext
- ✅ Handles errors gracefully

## Testing the Login

### Test Credentials
Create a test educator account:

```sql
-- Create test user in auth
INSERT INTO auth.users (
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at
) VALUES (
    'test.educator@example.com',
    crypt('TestPassword123', gen_salt('bf')),
    now(),
    now(),
    now()
);

-- Get the user ID from the query result, then create educator profile
INSERT INTO public.school_educators (
    user_id,
    school_id,
    first_name,
    last_name,
    email,
    specialization,
    qualification,
    experience_years,
    account_status,
    verification_status
) VALUES (
    'PASTE_USER_ID_HERE',
    'PASTE_SCHOOL_ID_HERE',
    'Test',
    'Educator',
    'test.educator@example.com',
    'Computer Science',
    'M.Tech Computer Science',
    3,
    'active',
    'Verified'
);
```

### Login Steps
1. Navigate to `http://localhost:3000/login/educator`
2. Enter email: `test.educator@example.com`
3. Enter password: `TestPassword123`
4. Click "Login"
5. Should redirect to `/educator/dashboard`

## Troubleshooting

### "Invalid email address"
- Ensure email format is correct (contains @)
- Example: `educator@school.com`

### "Password must be at least 6 characters"
- Password is too short
- Use at least 6 characters

### "Failed to sign in. Please check your credentials."
- Email doesn't exist in auth.users
- Password is incorrect
- Check Supabase Auth settings

### "Authentication failed. Please try again."
- Supabase connection issue
- Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env

### Profile not loading after login
- Educator profile doesn't exist in school_educators table
- Check that user_id matches between auth.users and school_educators
- Verify school_id exists in schools table

## Environment Variables

Ensure these are set in your `.env.local`:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## Security Notes

1. **Never store passwords in plain text** - Supabase handles this
2. **Use HTTPS in production** - Required for auth
3. **Enable RLS policies** - Restrict data access by user
4. **Verify email addresses** - Consider email verification flow
5. **Use strong passwords** - Enforce password requirements

## Next Steps

1. ✅ Create school_educators table
2. ✅ Create test educator accounts
3. ✅ Test login flow
4. ✅ Verify profile page loads correctly
5. ⏭️ Implement educator signup
6. ⏭️ Add password reset functionality
7. ⏭️ Add email verification

## Related Files

- `src/pages/auth/LoginEducator.tsx` - Login component
- `src/pages/educator/Profile.tsx` - Profile page
- `src/context/AuthContext.jsx` - Auth context
- `database/migrations/003_school_educators.sql` - Migration file

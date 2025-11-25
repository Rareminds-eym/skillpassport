-- Create college_lecturers table for college educator profiles
-- This separates college educators from school educators

CREATE TABLE IF NOT EXISTS public.college_lecturers (
    id UUID NOT NULL DEFAULT extensions.uuid_generate_v4(),
    "userId" UUID NOT NULL,
    "collegeId" UUID NOT NULL,
    "employeeId" VARCHAR(50) NULL,
    department VARCHAR(100) NULL,
    specialization VARCHAR(100) NULL,
    qualification VARCHAR(255) NULL,
    "experienceYears" INTEGER NULL,
    "dateOfJoining" DATE NULL,
    "accountStatus" public.account_status NULL DEFAULT 'active'::account_status,
    "createdAt" TIMESTAMP WITH TIME ZONE NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE NULL DEFAULT NOW(),
    metadata JSONB NULL DEFAULT '{}'::jsonb,
    user_id UUID NULL,
    
    CONSTRAINT college_lecturers_pkey PRIMARY KEY (id),
    CONSTRAINT college_lecturers_user_id_key UNIQUE (user_id),
    CONSTRAINT fk_college_lecturers_user FOREIGN KEY (user_id) 
        REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_college_lecturers_college FOREIGN KEY ("collegeId") 
        REFERENCES colleges (id) ON DELETE CASCADE
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_college_lecturers_user_id ON public.college_lecturers(user_id);
CREATE INDEX IF NOT EXISTS idx_college_lecturers_college_id ON public.college_lecturers("collegeId");
CREATE INDEX IF NOT EXISTS idx_college_lecturers_email ON public.college_lecturers((metadata->>'email'));

-- Add RLS policies
ALTER TABLE public.college_lecturers ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own profile
CREATE POLICY "Users can view own college lecturer profile" 
    ON public.college_lecturers
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own college lecturer profile" 
    ON public.college_lecturers
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Policy: Service role can insert (for signup)
CREATE POLICY "Service role can insert college lecturer profiles" 
    ON public.college_lecturers
    FOR INSERT
    WITH CHECK (true);

-- Policy: Admins can view all profiles
CREATE POLICY "Admins can view all college lecturer profiles" 
    ON public.college_lecturers
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Add comment
COMMENT ON TABLE public.college_lecturers IS 'Stores profile information for college educators/lecturers';

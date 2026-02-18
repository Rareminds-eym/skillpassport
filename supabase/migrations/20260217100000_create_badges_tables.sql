-- Create badges table
CREATE TABLE IF NOT EXISTS public.badges (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    icon VARCHAR(10) DEFAULT '🏆',
    color VARCHAR(7) DEFAULT '#3B82F6',
    school_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    college_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT check_badge_institution CHECK (
        (school_id IS NOT NULL AND college_id IS NULL) OR 
        (school_id IS NULL AND college_id IS NOT NULL)
    )
);

-- Create student_badges table (for awarded badges)
CREATE TABLE IF NOT EXISTS public.student_badges (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    badge_id UUID NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    school_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    college_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    awarded_by UUID NOT NULL,
    awarded_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notes TEXT,
    CONSTRAINT check_student_badge_institution CHECK (
        (school_id IS NOT NULL AND college_id IS NULL) OR 
        (school_id IS NULL AND college_id IS NOT NULL)
    )
);

-- Add unique constraint only if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'unique_student_badge'
    ) THEN
        ALTER TABLE public.student_badges 
        ADD CONSTRAINT unique_student_badge UNIQUE (badge_id, student_id);
    END IF;
END $$;

-- Create indexes
CREATE INDEX idx_badges_school_id ON public.badges(school_id);
CREATE INDEX idx_badges_college_id ON public.badges(college_id);
CREATE INDEX idx_student_badges_badge_id ON public.student_badges(badge_id);
CREATE INDEX idx_student_badges_student_id ON public.student_badges(student_id);
CREATE INDEX idx_student_badges_school_id ON public.student_badges(school_id);
CREATE INDEX idx_student_badges_college_id ON public.student_badges(college_id);

-- Enable RLS
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_badges ENABLE ROW LEVEL SECURITY;

-- RLS Policies for badges table

-- School educators can view badges in their school
CREATE POLICY "School educators can view their school badges"
ON public.badges FOR SELECT
USING (
    school_id IN (
        SELECT school_id FROM public.school_educators WHERE user_id = auth.uid()
    )
);

-- College lecturers can view badges in their college
CREATE POLICY "College lecturers can view their college badges"
ON public.badges FOR SELECT
USING (
    college_id IN (
        SELECT "collegeId" FROM public.college_lecturers WHERE user_id = auth.uid()
    )
);

-- School educators can create badges for their school
CREATE POLICY "School educators can create badges"
ON public.badges FOR INSERT
WITH CHECK (
    school_id IN (
        SELECT school_id FROM public.school_educators WHERE user_id = auth.uid()
    )
);

-- College lecturers can create badges for their college
CREATE POLICY "College lecturers can create badges"
ON public.badges FOR INSERT
WITH CHECK (
    college_id IN (
        SELECT "collegeId" FROM public.college_lecturers WHERE user_id = auth.uid()
    )
);

-- School educators can update badges in their school
CREATE POLICY "School educators can update their school badges"
ON public.badges FOR UPDATE
USING (
    school_id IN (
        SELECT school_id FROM public.school_educators WHERE user_id = auth.uid()
    )
);

-- College lecturers can update badges in their college
CREATE POLICY "College lecturers can update their college badges"
ON public.badges FOR UPDATE
USING (
    college_id IN (
        SELECT "collegeId" FROM public.college_lecturers WHERE user_id = auth.uid()
    )
);

-- School educators can delete badges in their school
CREATE POLICY "School educators can delete their school badges"
ON public.badges FOR DELETE
USING (
    school_id IN (
        SELECT school_id FROM public.school_educators WHERE user_id = auth.uid()
    )
);

-- College lecturers can delete badges in their college
CREATE POLICY "College lecturers can delete their college badges"
ON public.badges FOR DELETE
USING (
    college_id IN (
        SELECT "collegeId" FROM public.college_lecturers WHERE user_id = auth.uid()
    )
);

-- RLS Policies for student_badges table

-- School educators can view awarded badges in their school
CREATE POLICY "School educators can view their school student badges"
ON public.student_badges FOR SELECT
USING (
    school_id IN (
        SELECT school_id FROM public.school_educators WHERE user_id = auth.uid()
    )
);

-- College lecturers can view awarded badges in their college
CREATE POLICY "College lecturers can view their college student badges"
ON public.student_badges FOR SELECT
USING (
    college_id IN (
        SELECT "collegeId" FROM public.college_lecturers WHERE user_id = auth.uid()
    )
);

-- School educators can award badges to students in their school
CREATE POLICY "School educators can award badges"
ON public.student_badges FOR INSERT
WITH CHECK (
    school_id IN (
        SELECT school_id FROM public.school_educators WHERE user_id = auth.uid()
    )
);

-- College lecturers can award badges to students in their college
CREATE POLICY "College lecturers can award badges"
ON public.student_badges FOR INSERT
WITH CHECK (
    college_id IN (
        SELECT "collegeId" FROM public.college_lecturers WHERE user_id = auth.uid()
    )
);

-- School educators can delete awarded badges in their school
CREATE POLICY "School educators can delete student badges"
ON public.student_badges FOR DELETE
USING (
    school_id IN (
        SELECT school_id FROM public.school_educators WHERE user_id = auth.uid()
    )
);

-- College lecturers can delete awarded badges in their college
CREATE POLICY "College lecturers can delete student badges"
ON public.student_badges FOR DELETE
USING (
    college_id IN (
        SELECT "collegeId" FROM public.college_lecturers WHERE user_id = auth.uid()
    )
);

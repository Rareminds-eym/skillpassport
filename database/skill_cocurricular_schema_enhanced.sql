-- ========================================
-- SKILL & CO-CURRICULAR DATABASE SCHEMA (ENHANCED)
-- Supports actions by BOTH school_educators AND school_admins
-- Integrated with existing students, schools tables
-- ========================================

-- ========================================
-- 1. CLUBS TABLE
-- ========================================
CREATE TABLE public.clubs (
    club_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('arts', 'sports', 'robotics', 'science', 'literature')),
    description TEXT,
    capacity INTEGER NOT NULL DEFAULT 30,
    
    -- Meeting Information
    meeting_day VARCHAR(100),
    meeting_time VARCHAR(50),
    location VARCHAR(255),
    
    -- Mentor/Teacher Reference (Polymorphic - can be from school_educators OR schools)
    mentor_type VARCHAR(20) CHECK (mentor_type IN ('educator', 'school')),
    mentor_educator_id UUID REFERENCES public.school_educators(id) ON DELETE SET NULL,
    mentor_school_id UUID REFERENCES public.schools(id) ON DELETE SET NULL,
    
    CONSTRAINT check_single_mentor CHECK (
        (mentor_educator_id IS NOT NULL AND mentor_school_id IS NULL AND mentor_type = 'educator') OR
        (mentor_educator_id IS NULL AND mentor_school_id IS NOT NULL AND mentor_type = 'school') OR
        (mentor_educator_id IS NULL AND mentor_school_id IS NULL AND mentor_type IS NULL)
    ),
    
    -- Status & Metadata
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Created by (can be educator OR admin)
    created_by_type VARCHAR(20) CHECK (created_by_type IN ('educator', 'admin')),
    created_by_educator_id UUID REFERENCES public.school_educators(id) ON DELETE SET NULL,
    created_by_admin_id UUID REFERENCES public.schools(id) ON DELETE SET NULL,
    
    CONSTRAINT check_single_creator CHECK (
        (created_by_educator_id IS NOT NULL AND created_by_admin_id IS NULL AND created_by_type = 'educator') OR
        (created_by_educator_id IS NULL AND created_by_admin_id IS NOT NULL AND created_by_type = 'admin') OR
        (created_by_educator_id IS NULL AND created_by_admin_id IS NULL AND created_by_type IS NULL)
    ),
    
    CONSTRAINT unique_club_name_per_school UNIQUE(school_id, name)
) TABLESPACE pg_default;

-- ========================================
-- 2. CLUB MEMBERSHIPS TABLE
-- ========================================
CREATE TABLE public.club_memberships (
    membership_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    club_id UUID NOT NULL REFERENCES public.clubs(club_id) ON DELETE CASCADE,
    student_email VARCHAR(255) NOT NULL,
    
    -- Enrollment Details
    enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Enrolled by (can be educator OR admin)
    enrolled_by_type VARCHAR(20) CHECK (enrolled_by_type IN ('educator', 'admin', 'self')),
    enrolled_by_educator_id UUID REFERENCES public.school_educators(id) ON DELETE SET NULL,
    enrolled_by_admin_id UUID REFERENCES public.schools(id) ON DELETE SET NULL,
    
    CONSTRAINT check_single_enroller CHECK (
        (enrolled_by_educator_id IS NOT NULL AND enrolled_by_admin_id IS NULL AND enrolled_by_type = 'educator') OR
        (enrolled_by_educator_id IS NULL AND enrolled_by_admin_id IS NOT NULL AND enrolled_by_type = 'admin') OR
        (enrolled_by_educator_id IS NULL AND enrolled_by_admin_id IS NULL AND enrolled_by_type = 'self')
    ),
    
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'withdrawn', 'suspended')),
    withdrawn_at TIMESTAMP WITH TIME ZONE,
    withdrawal_reason TEXT,
    
    -- Participation Tracking
    total_sessions_attended INTEGER DEFAULT 0,
    total_sessions_held INTEGER DEFAULT 0,
    attendance_percentage DECIMAL(5,2) DEFAULT 0,
    performance_score DECIMAL(5,2) DEFAULT 0,
    achievements JSONB DEFAULT '[]'::jsonb,
    
    CONSTRAINT unique_student_club UNIQUE(club_id, student_email),
    CONSTRAINT fk_student_email FOREIGN KEY (student_email) REFERENCES public.students(email) ON DELETE CASCADE
) TABLESPACE pg_default;

-- ========================================
-- 3. CLUB ATTENDANCE TABLE
-- ========================================
CREATE TABLE public.club_attendance (
    attendance_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    club_id UUID NOT NULL REFERENCES public.clubs(club_id) ON DELETE CASCADE,
    session_date DATE NOT NULL,
    session_topic VARCHAR(255),
    session_description TEXT,
    duration_minutes INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Created by (can be educator OR admin)
    created_by_type VARCHAR(20) CHECK (created_by_type IN ('educator', 'admin')),
    created_by_educator_id UUID REFERENCES public.school_educators(id) ON DELETE SET NULL,
    created_by_admin_id UUID REFERENCES public.schools(id) ON DELETE SET NULL,
    
    CONSTRAINT check_single_attendance_creator CHECK (
        (created_by_educator_id IS NOT NULL AND created_by_admin_id IS NULL AND created_by_type = 'educator') OR
        (created_by_educator_id IS NULL AND created_by_admin_id IS NOT NULL AND created_by_type = 'admin')
    ),
    
    CONSTRAINT unique_club_session UNIQUE(club_id, session_date)
) TABLESPACE pg_default;

-- ========================================
-- 4. CLUB ATTENDANCE RECORDS TABLE
-- ========================================
CREATE TABLE public.club_attendance_records (
    record_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attendance_id UUID NOT NULL REFERENCES public.club_attendance(attendance_id) ON DELETE CASCADE,
    student_email VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('present', 'absent', 'late', 'excused')),
    remarks TEXT,
    marked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Marked by (can be educator OR admin)
    marked_by_type VARCHAR(20) CHECK (marked_by_type IN ('educator', 'admin')),
    marked_by_educator_id UUID REFERENCES public.school_educators(id) ON DELETE SET NULL,
    marked_by_admin_id UUID REFERENCES public.schools(id) ON DELETE SET NULL,
    
    CONSTRAINT check_single_marker CHECK (
        (marked_by_educator_id IS NOT NULL AND marked_by_admin_id IS NULL AND marked_by_type = 'educator') OR
        (marked_by_educator_id IS NULL AND marked_by_admin_id IS NOT NULL AND marked_by_type = 'admin')
    ),
    
    CONSTRAINT unique_student_session UNIQUE(attendance_id, student_email),
    CONSTRAINT fk_student_email FOREIGN KEY (student_email) REFERENCES public.students(email) ON DELETE CASCADE
) TABLESPACE pg_default;

-- ========================================
-- 5. COMPETITIONS TABLE
-- ========================================
CREATE TABLE public.competitions (
    comp_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Competition Details
    level VARCHAR(50) NOT NULL CHECK (level IN ('intraschool', 'interschool', 'district', 'state', 'national', 'international')),
    category VARCHAR(50),
    competition_date DATE NOT NULL,
    registration_deadline DATE,
    venue VARCHAR(255),
    
    -- Requirements
    team_size_min INTEGER DEFAULT 1,
    team_size_max INTEGER DEFAULT 1,
    eligibility_criteria TEXT,
    rules TEXT,
    
    -- Rewards
    prizes JSONB DEFAULT '[]'::jsonb,
    
    -- Status
    status VARCHAR(20) DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'ongoing', 'completed', 'cancelled')),
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Created by (can be educator OR admin)
    created_by_type VARCHAR(20) CHECK (created_by_type IN ('educator', 'admin')),
    created_by_educator_id UUID REFERENCES public.school_educators(id) ON DELETE SET NULL,
    created_by_admin_id UUID REFERENCES public.schools(id) ON DELETE SET NULL,
    
    CONSTRAINT check_single_comp_creator CHECK (
        (created_by_educator_id IS NOT NULL AND created_by_admin_id IS NULL AND created_by_type = 'educator') OR
        (created_by_educator_id IS NULL AND created_by_admin_id IS NOT NULL AND created_by_type = 'admin')
    )
) TABLESPACE pg_default;

-- ========================================
-- 6. COMPETITION PARTICIPATING CLUBS TABLE
-- ========================================
CREATE TABLE public.competition_clubs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    comp_id UUID NOT NULL REFERENCES public.competitions(comp_id) ON DELETE CASCADE,
    club_id UUID NOT NULL REFERENCES public.clubs(club_id) ON DELETE CASCADE,
    registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Registered by (can be educator OR admin)
    registered_by_type VARCHAR(20) CHECK (registered_by_type IN ('educator', 'admin')),
    registered_by_educator_id UUID REFERENCES public.school_educators(id) ON DELETE SET NULL,
    registered_by_admin_id UUID REFERENCES public.schools(id) ON DELETE SET NULL,
    
    CONSTRAINT check_single_comp_club_registrar CHECK (
        (registered_by_educator_id IS NOT NULL AND registered_by_admin_id IS NULL AND registered_by_type = 'educator') OR
        (registered_by_educator_id IS NULL AND registered_by_admin_id IS NOT NULL AND registered_by_type = 'admin')
    ),
    
    CONSTRAINT unique_comp_club UNIQUE(comp_id, club_id)
) TABLESPACE pg_default;

-- ========================================
-- 7. COMPETITION REGISTRATIONS TABLE
-- ========================================
CREATE TABLE public.competition_registrations (
    registration_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    comp_id UUID NOT NULL REFERENCES public.competitions(comp_id) ON DELETE CASCADE,
    student_email VARCHAR(255) NOT NULL,
    
    -- Team Information
    team_name VARCHAR(255),
    team_members JSONB DEFAULT '[]'::jsonb,
    
    -- Registration Details
    registration_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Registered by (can be educator, admin, or self)
    registered_by_type VARCHAR(20) CHECK (registered_by_type IN ('educator', 'admin', 'self')),
    registered_by_educator_id UUID REFERENCES public.school_educators(id) ON DELETE SET NULL,
    registered_by_admin_id UUID REFERENCES public.schools(id) ON DELETE SET NULL,
    
    CONSTRAINT check_single_comp_registrar CHECK (
        (registered_by_educator_id IS NOT NULL AND registered_by_admin_id IS NULL AND registered_by_type = 'educator') OR
        (registered_by_educator_id IS NULL AND registered_by_admin_id IS NOT NULL AND registered_by_type = 'admin') OR
        (registered_by_educator_id IS NULL AND registered_by_admin_id IS NULL AND registered_by_type = 'self')
    ),
    
    status VARCHAR(20) DEFAULT 'registered' CHECK (status IN ('registered', 'confirmed', 'withdrawn', 'disqualified')),
    notes TEXT,
    special_requirements TEXT,
    
    CONSTRAINT unique_student_competition UNIQUE(comp_id, student_email),
    CONSTRAINT fk_student_email FOREIGN KEY (student_email) REFERENCES public.students(email) ON DELETE CASCADE
) TABLESPACE pg_default;

-- ========================================
-- 8. COMPETITION RESULTS TABLE
-- ========================================
CREATE TABLE public.competition_results (
    result_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    comp_id UUID NOT NULL REFERENCES public.competitions(comp_id) ON DELETE CASCADE,
    registration_id UUID REFERENCES public.competition_registrations(registration_id) ON DELETE CASCADE,
    student_email VARCHAR(255) NOT NULL,
    
    -- Performance
    rank INTEGER,
    score DECIMAL(10,2),
    award VARCHAR(255),
    category VARCHAR(100),
    
    -- Details
    performance_notes TEXT,
    certificate_issued BOOLEAN DEFAULT FALSE,
    certificate_id UUID,
    
    -- Metadata
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Recorded by (can be educator OR admin)
    recorded_by_type VARCHAR(20) CHECK (recorded_by_type IN ('educator', 'admin')),
    recorded_by_educator_id UUID REFERENCES public.school_educators(id) ON DELETE SET NULL,
    recorded_by_admin_id UUID REFERENCES public.schools(id) ON DELETE SET NULL,
    
    CONSTRAINT check_single_result_recorder CHECK (
        (recorded_by_educator_id IS NOT NULL AND recorded_by_admin_id IS NULL AND recorded_by_type = 'educator') OR
        (recorded_by_educator_id IS NULL AND recorded_by_admin_id IS NOT NULL AND recorded_by_type = 'admin')
    ),
    
    CONSTRAINT unique_student_comp_result UNIQUE(comp_id, student_email, category),
    CONSTRAINT fk_student_email FOREIGN KEY (student_email) REFERENCES public.students(email) ON DELETE CASCADE
) TABLESPACE pg_default;

-- ========================================
-- 9. SKILL BADGES TABLE
-- ========================================
CREATE TABLE public.skill_badges (
    badge_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
    
    -- Badge Info
    name VARCHAR(255) NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    category VARCHAR(50),
    
    -- Levels
    level VARCHAR(20) CHECK (level IN ('bronze', 'silver', 'gold', 'platinum')),
    
    -- Criteria
    criteria JSONB DEFAULT '{}'::jsonb,
    points_required INTEGER,
    
    -- Auto-award conditions
    auto_award_enabled BOOLEAN DEFAULT FALSE,
    auto_award_conditions JSONB DEFAULT '{}'::jsonb,
    
    -- Metadata
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Created by (can be educator OR admin)
    created_by_type VARCHAR(20) CHECK (created_by_type IN ('educator', 'admin')),
    created_by_educator_id UUID REFERENCES public.school_educators(id) ON DELETE SET NULL,
    created_by_admin_id UUID REFERENCES public.schools(id) ON DELETE SET NULL,
    
    CONSTRAINT check_single_badge_creator CHECK (
        (created_by_educator_id IS NOT NULL AND created_by_admin_id IS NULL AND created_by_type = 'educator') OR
        (created_by_educator_id IS NULL AND created_by_admin_id IS NOT NULL AND created_by_type = 'admin')
    ),
    
    CONSTRAINT unique_badge_name UNIQUE(school_id, name, level)
) TABLESPACE pg_default;

-- ========================================
-- 10. STUDENT SKILL BADGES TABLE
-- ========================================
CREATE TABLE public.student_skill_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    badge_id UUID NOT NULL REFERENCES public.skill_badges(badge_id) ON DELETE CASCADE,
    student_email VARCHAR(255) NOT NULL,
    
    -- Progress
    current_points INTEGER DEFAULT 0,
    progress_percentage DECIMAL(5,2) DEFAULT 0,
    
    -- Status
    status VARCHAR(20) DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'earned', 'expired')),
    earned_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    achievement_data JSONB DEFAULT '{}'::jsonb,
    
    -- Awarded by (can be educator OR admin)
    awarded_by_type VARCHAR(20) CHECK (awarded_by_type IN ('educator', 'admin', 'auto')),
    awarded_by_educator_id UUID REFERENCES public.school_educators(id) ON DELETE SET NULL,
    awarded_by_admin_id UUID REFERENCES public.schools(id) ON DELETE SET NULL,
    
    CONSTRAINT check_single_badge_awarder CHECK (
        (awarded_by_educator_id IS NOT NULL AND awarded_by_admin_id IS NULL AND awarded_by_type = 'educator') OR
        (awarded_by_educator_id IS NULL AND awarded_by_admin_id IS NOT NULL AND awarded_by_type = 'admin') OR
        (awarded_by_educator_id IS NULL AND awarded_by_admin_id IS NULL AND awarded_by_type = 'auto')
    ),
    
    CONSTRAINT unique_student_badge UNIQUE(badge_id, student_email),
    CONSTRAINT fk_student_email FOREIGN KEY (student_email) REFERENCES public.students(email) ON DELETE CASCADE
) TABLESPACE pg_default;

-- ========================================
-- 11. CERTIFICATES TABLE
-- ========================================
CREATE TABLE public.club_certificates (
    certificate_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_email VARCHAR(255) NOT NULL,
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    
    -- Certificate Details
    title VARCHAR(255) NOT NULL,
    description TEXT,
    certificate_type VARCHAR(50) CHECK (certificate_type IN ('course_completion', 'skill_achievement', 'competition', 'workshop', 'leadership', 'participation', 'excellence')),
    
    -- Issuer Information
    issuer VARCHAR(255),
    issued_date DATE NOT NULL,
    valid_until DATE,
    
    -- Verification
    credential_id VARCHAR(100) UNIQUE,
    verification_url TEXT,
    qr_code_url TEXT,
    
    -- Related Entities
    related_club_id UUID REFERENCES public.clubs(club_id) ON DELETE SET NULL,
    related_comp_id UUID REFERENCES public.competitions(comp_id) ON DELETE SET NULL,
    related_badge_id UUID REFERENCES public.skill_badges(badge_id) ON DELETE SET NULL,
    
    -- PDF/Document Storage
    certificate_pdf_url TEXT,
    certificate_image_url TEXT,
    template_used VARCHAR(100),
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Issued by (can be educator OR admin)
    issued_by_type VARCHAR(20) CHECK (issued_by_type IN ('educator', 'admin')),
    issued_by_educator_id UUID REFERENCES public.school_educators(id) ON DELETE SET NULL,
    issued_by_admin_id UUID REFERENCES public.schools(id) ON DELETE SET NULL,
    
    CONSTRAINT check_single_certificate_issuer CHECK (
        (issued_by_educator_id IS NOT NULL AND issued_by_admin_id IS NULL AND issued_by_type = 'educator') OR
        (issued_by_educator_id IS NULL AND issued_by_admin_id IS NOT NULL AND issued_by_type = 'admin')
    ),
    
    is_verified BOOLEAN DEFAULT TRUE,
    metadata JSONB DEFAULT '{}'::jsonb,
    
    CONSTRAINT fk_student_email FOREIGN KEY (student_email) REFERENCES public.students(email) ON DELETE CASCADE
) TABLESPACE pg_default;

-- ========================================
-- 12. CLUB ACTIVITIES TABLE
-- ========================================
CREATE TABLE public.club_activities (
    activity_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    club_id UUID NOT NULL REFERENCES public.clubs(club_id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    activity_date DATE NOT NULL,
    activity_time VARCHAR(50),
    location VARCHAR(255),
    activity_type VARCHAR(50) CHECK (activity_type IN ('workshop', 'meeting', 'event', 'competition_prep', 'practice', 'field_trip', 'guest_lecture', 'other')),
    
    -- Status
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'ongoing', 'completed', 'cancelled')),
    
    -- Participation tracking
    expected_participants INTEGER DEFAULT 0,
    actual_participants INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Created by (can be educator OR admin)
    created_by_type VARCHAR(20) CHECK (created_by_type IN ('educator', 'admin')),
    created_by_educator_id UUID REFERENCES public.school_educators(id) ON DELETE SET NULL,
    created_by_admin_id UUID REFERENCES public.schools(id) ON DELETE SET NULL,
    
    CONSTRAINT check_single_activity_creator CHECK (
        (created_by_educator_id IS NOT NULL AND created_by_admin_id IS NULL AND created_by_type = 'educator') OR
        (created_by_educator_id IS NULL AND created_by_admin_id IS NOT NULL AND created_by_type = 'admin')
    )
) TABLESPACE pg_default;



-- ========================================
-- INDEXES FOR PERFORMANCE
-- ========================================

-- Clubs indexes
CREATE INDEX idx_clubs_school ON public.clubs(school_id);
CREATE INDEX idx_clubs_category ON public.clubs(category);
CREATE INDEX idx_clubs_is_active ON public.clubs(is_active);
CREATE INDEX idx_clubs_mentor_educator ON public.clubs(mentor_educator_id);
CREATE INDEX idx_clubs_mentor_school ON public.clubs(mentor_school_id);
CREATE INDEX idx_clubs_mentor_type ON public.clubs(mentor_type);
CREATE INDEX idx_clubs_created_by_educator ON public.clubs(created_by_educator_id);
CREATE INDEX idx_clubs_created_by_admin ON public.clubs(created_by_admin_id);

-- Club memberships indexes
CREATE INDEX idx_club_memberships_student ON public.club_memberships(student_email);
CREATE INDEX idx_club_memberships_club ON public.club_memberships(club_id);
CREATE INDEX idx_club_memberships_status ON public.club_memberships(status);
CREATE INDEX idx_club_memberships_enrolled_by_educator ON public.club_memberships(enrolled_by_educator_id);
CREATE INDEX idx_club_memberships_enrolled_by_admin ON public.club_memberships(enrolled_by_admin_id);

-- Club attendance indexes
CREATE INDEX idx_club_attendance_club_date ON public.club_attendance(club_id, session_date);
CREATE INDEX idx_club_attendance_created_by_educator ON public.club_attendance(created_by_educator_id);
CREATE INDEX idx_club_attendance_created_by_admin ON public.club_attendance(created_by_admin_id);

-- Club attendance records indexes
CREATE INDEX idx_club_attendance_records_student ON public.club_attendance_records(student_email);
CREATE INDEX idx_club_attendance_records_status ON public.club_attendance_records(status);
CREATE INDEX idx_club_attendance_records_attendance ON public.club_attendance_records(attendance_id);

-- Competitions indexes
CREATE INDEX idx_competitions_school ON public.competitions(school_id);
CREATE INDEX idx_competitions_date ON public.competitions(competition_date);
CREATE INDEX idx_competitions_status ON public.competitions(status);
CREATE INDEX idx_competitions_level ON public.competitions(level);
CREATE INDEX idx_competitions_category ON public.competitions(category);
CREATE INDEX idx_competitions_created_by_educator ON public.competitions(created_by_educator_id);
CREATE INDEX idx_competitions_created_by_admin ON public.competitions(created_by_admin_id);

-- Competition clubs indexes
CREATE INDEX idx_comp_clubs_comp ON public.competition_clubs(comp_id);
CREATE INDEX idx_comp_clubs_club ON public.competition_clubs(club_id);

-- Competition registrations indexes
CREATE INDEX idx_comp_registrations_student ON public.competition_registrations(student_email);
CREATE INDEX idx_comp_registrations_comp ON public.competition_registrations(comp_id);
CREATE INDEX idx_comp_registrations_status ON public.competition_registrations(status);

-- Competition results indexes
CREATE INDEX idx_comp_results_student ON public.competition_results(student_email);
CREATE INDEX idx_comp_results_comp ON public.competition_results(comp_id);
CREATE INDEX idx_comp_results_registration ON public.competition_results(registration_id);

-- Certificates indexes
CREATE INDEX idx_certificates_student ON public.club_certificates(student_email);
CREATE INDEX idx_certificates_school ON public.club_certificates(school_id);
CREATE INDEX idx_certificates_type ON public.club_certificates(certificate_type);
CREATE INDEX idx_certificates_issued_date ON public.club_certificates(issued_date);
CREATE INDEX idx_certificates_credential ON public.club_certificates(credential_id);

-- Skill badges indexes
CREATE INDEX idx_skill_badges_school ON public.skill_badges(school_id);
CREATE INDEX idx_skill_badges_category ON public.skill_badges(category);
CREATE INDEX idx_skill_badges_level ON public.skill_badges(level);
CREATE INDEX idx_skill_badges_is_active ON public.skill_badges(is_active);

-- Student badges indexes
CREATE INDEX idx_student_badges_student ON public.student_skill_badges(student_email);
CREATE INDEX idx_student_badges_badge ON public.student_skill_badges(badge_id);
CREATE INDEX idx_student_badges_status ON public.student_skill_badges(status);

-- Club activities indexes
CREATE INDEX idx_club_activities_club ON public.club_activities(club_id);
CREATE INDEX idx_club_activities_date ON public.club_activities(activity_date);
CREATE INDEX idx_club_activities_status ON public.club_activities(status);

-- ========================================
-- FUNCTIONS & TRIGGERS
-- ========================================

-- Function to update attendance percentage
CREATE OR REPLACE FUNCTION update_membership_attendance()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.club_memberships cm
    SET 
        total_sessions_attended = (
            SELECT COUNT(*) 
            FROM public.club_attendance_records car
            JOIN public.club_attendance ca ON car.attendance_id = ca.attendance_id
            WHERE ca.club_id = cm.club_id 
            AND car.student_email = cm.student_email 
            AND car.status IN ('present', 'late')
        ),
        total_sessions_held = (
            SELECT COUNT(*) 
            FROM public.club_attendance ca
            WHERE ca.club_id = cm.club_id
            AND ca.session_date <= CURRENT_DATE
        ),
        attendance_percentage = CASE 
            WHEN (SELECT COUNT(*) FROM public.club_attendance ca WHERE ca.club_id = cm.club_id) > 0
            THEN (
                SELECT COUNT(*) * 100.0 / NULLIF((SELECT COUNT(*) FROM public.club_attendance ca WHERE ca.club_id = cm.club_id), 0)
                FROM public.club_attendance_records car
                JOIN public.club_attendance ca ON car.attendance_id = ca.attendance_id
                WHERE ca.club_id = cm.club_id 
                AND car.student_email = cm.student_email 
                AND car.status IN ('present', 'late')
            )
            ELSE 0
        END
    WHERE cm.club_id = (SELECT club_id FROM public.club_attendance WHERE attendance_id = NEW.attendance_id)
    AND cm.student_email = NEW.student_email;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_attendance
AFTER INSERT OR UPDATE ON public.club_attendance_records
FOR EACH ROW
EXECUTE FUNCTION update_membership_attendance();

-- Function to auto-generate certificate credential ID
CREATE OR REPLACE FUNCTION generate_certificate_credential_id()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.credential_id IS NULL THEN
        NEW.credential_id := UPPER(SUBSTRING(
            CASE NEW.certificate_type
                WHEN 'course_completion' THEN 'CC'
                WHEN 'skill_achievement' THEN 'SA'
                WHEN 'competition' THEN 'CM'
                WHEN 'workshop' THEN 'WS'
                WHEN 'leadership' THEN 'LD'
                WHEN 'participation' THEN 'PT'
                WHEN 'excellence' THEN 'EX'
                ELSE 'CT'
            END || '-' ||
            TO_CHAR(NEW.issued_date, 'YYYY') || '-' ||
            LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0'),
            1, 20
        ));
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_generate_credential_id
BEFORE INSERT ON public.club_certificates
FOR EACH ROW
EXECUTE FUNCTION generate_certificate_credential_id();

-- Update timestamps trigger
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_clubs_timestamp
BEFORE UPDATE ON public.clubs
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trg_competitions_timestamp
BEFORE UPDATE ON public.competitions
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trg_activities_timestamp
BEFORE UPDATE ON public.club_activities
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

-- ========================================
-- VALIDATION TRIGGERS
-- ========================================

-- Function to ensure student belongs to same school as club
CREATE OR REPLACE FUNCTION validate_student_school_match()
RETURNS TRIGGER AS $$
DECLARE
    club_school_id UUID;
    student_school_id UUID;
BEGIN
    -- Get the school_id from the club
    SELECT school_id INTO club_school_id
    FROM public.clubs
    WHERE club_id = NEW.club_id;
    
    -- Get the school_id from the student
    SELECT school_id INTO student_school_id
    FROM public.students
    WHERE email = NEW.student_email;
    
    -- Check if student has a school_id
    IF student_school_id IS NULL THEN
        RAISE EXCEPTION 'Student % does not belong to any school', NEW.student_email;
    END IF;
    
    -- Check if schools match
    IF club_school_id != student_school_id THEN
        RAISE EXCEPTION 'Student % (school: %) cannot join club from different school (%)', 
            NEW.student_email, student_school_id, club_school_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply validation to club_memberships
CREATE TRIGGER trg_validate_club_membership_school
BEFORE INSERT OR UPDATE ON public.club_memberships
FOR EACH ROW
EXECUTE FUNCTION validate_student_school_match();

-- Function to validate student school for competitions
CREATE OR REPLACE FUNCTION validate_student_competition_school()
RETURNS TRIGGER AS $$
DECLARE
    comp_school_id UUID;
    student_school_id UUID;
BEGIN
    -- Get the school_id from the competition
    SELECT school_id INTO comp_school_id
    FROM public.competitions
    WHERE comp_id = NEW.comp_id;
    
    -- Get the school_id from the student
    SELECT school_id INTO student_school_id
    FROM public.students
    WHERE email = NEW.student_email;
    
    -- Check if student has a school_id
    IF student_school_id IS NULL THEN
        RAISE EXCEPTION 'Student % does not belong to any school', NEW.student_email;
    END IF;
    
    -- Check if schools match
    IF comp_school_id != student_school_id THEN
        RAISE EXCEPTION 'Student % (school: %) cannot register for competition from different school (%)', 
            NEW.student_email, student_school_id, comp_school_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply validation to competition_registrations
CREATE TRIGGER trg_validate_competition_registration_school
BEFORE INSERT OR UPDATE ON public.competition_registrations
FOR EACH ROW
EXECUTE FUNCTION validate_student_competition_school();

-- Function to enforce club capacity
CREATE OR REPLACE FUNCTION check_club_capacity()
RETURNS TRIGGER AS $$
DECLARE
    current_members INTEGER;
    club_capacity INTEGER;
BEGIN
    -- Only check for active memberships
    IF NEW.status = 'active' THEN
        SELECT capacity INTO club_capacity
        FROM public.clubs 
        WHERE club_id = NEW.club_id;
        
        SELECT COUNT(*) INTO current_members
        FROM public.club_memberships
        WHERE club_id = NEW.club_id 
        AND status = 'active'
        AND membership_id != COALESCE(NEW.membership_id, '00000000-0000-0000-0000-000000000000'::UUID);
        
        IF current_members >= club_capacity THEN
            RAISE EXCEPTION 'Club is full (capacity: %). Cannot enroll more students.', club_capacity;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_club_capacity
BEFORE INSERT OR UPDATE ON public.club_memberships
FOR EACH ROW
EXECUTE FUNCTION check_club_capacity();

-- Function to enforce max clubs per student (configurable)
CREATE OR REPLACE FUNCTION check_max_clubs_per_student()
RETURNS TRIGGER AS $$
DECLARE
    club_count INTEGER;
    max_clubs INTEGER := 5; -- Configure this value as needed
BEGIN
    -- Only check for active memberships
    IF NEW.status = 'active' THEN
        SELECT COUNT(*) INTO club_count
        FROM public.club_memberships
        WHERE student_email = NEW.student_email
        AND status = 'active'
        AND membership_id != COALESCE(NEW.membership_id, '00000000-0000-0000-0000-000000000000'::UUID);
        
        IF club_count >= max_clubs THEN
            RAISE EXCEPTION 'Student cannot join more than % clubs', max_clubs;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_max_clubs
BEFORE INSERT OR UPDATE ON public.club_memberships
FOR EACH ROW
EXECUTE FUNCTION check_max_clubs_per_student();

-- ========================================
-- HELPFUL VIEWS FOR REPORTING
-- ========================================

-- View: Club membership summary with student details AND mentor info
CREATE OR REPLACE VIEW club_memberships_with_students AS
SELECT 
    cm.membership_id,
    cm.club_id,
    c.name as club_name,
    c.category as club_category,
    c.meeting_day,
    c.meeting_time,
    c.location,
    
    -- Mentor information (from either school_educators OR schools)
    c.mentor_type,
    CASE 
        WHEN c.mentor_type = 'educator' THEN se.first_name || ' ' || se.last_name
        WHEN c.mentor_type = 'school' THEN sc.principal_name
        ELSE NULL
    END as mentor_name,
    CASE 
        WHEN c.mentor_type = 'educator' THEN se.email
        WHEN c.mentor_type = 'school' THEN sc.principal_email
        ELSE NULL
    END as mentor_email,
    CASE 
        WHEN c.mentor_type = 'educator' THEN se.phone_number
        WHEN c.mentor_type = 'school' THEN sc.principal_phone
        ELSE NULL
    END as mentor_phone,
    
    -- Student information
    cm.student_email,
    s.name as student_name,
    s.grade,
    s.section,
    s.roll_number,
    cm.enrolled_at,
    cm.status,
    cm.total_sessions_attended,
    cm.total_sessions_held,
    cm.attendance_percentage,
    cm.performance_score
FROM public.club_memberships cm
JOIN public.clubs c ON cm.club_id = c.club_id
JOIN public.students s ON cm.student_email = s.email
LEFT JOIN public.school_educators se ON c.mentor_educator_id = se.id
LEFT JOIN public.schools sc ON c.mentor_school_id = sc.id
WHERE cm.status = 'active';

-- View: Competition results with student details
CREATE OR REPLACE VIEW competition_results_with_students AS
SELECT 
    cr.result_id,
    cr.comp_id,
    comp.name as competition_name,
    comp.level,
    comp.category,
    cr.student_email,
    s.name as student_name,
    s.grade,
    s.section,
    cr.rank,
    cr.score,
    cr.award,
    cr.certificate_issued,
    cr.recorded_at
FROM public.competition_results cr
JOIN public.competitions comp ON cr.comp_id = comp.comp_id
JOIN public.students s ON cr.student_email = s.email;

-- View: Student badges summary
CREATE OR REPLACE VIEW student_badges_summary AS
SELECT 
    ssb.student_email,
    s.name as student_name,
    s.grade,
    s.section,
    sb.name as badge_name,
    sb.level as badge_level,
    sb.category as badge_category,
    ssb.status,
    ssb.progress_percentage,
    ssb.earned_at
FROM public.student_skill_badges ssb
JOIN public.skill_badges sb ON ssb.badge_id = sb.badge_id
JOIN public.students s ON ssb.student_email = s.email;

-- View: Clubs with full mentor details (from either educators or schools)
CREATE OR REPLACE VIEW clubs_with_mentors AS
SELECT 
    c.club_id,
    c.school_id,
    c.name as club_name,
    c.category,
    c.description,
    c.capacity,
    c.meeting_day,
    c.meeting_time,
    c.location,
    c.is_active,
    
    -- Mentor details (polymorphic)
    c.mentor_type,
    c.mentor_educator_id,
    c.mentor_school_id,
    CASE 
        WHEN c.mentor_type = 'educator' THEN se.first_name || ' ' || se.last_name
        WHEN c.mentor_type = 'school' THEN sc.principal_name
        ELSE 'No Mentor Assigned'
    END as mentor_name,
    CASE 
        WHEN c.mentor_type = 'educator' THEN se.email
        WHEN c.mentor_type = 'school' THEN sc.principal_email
        ELSE NULL
    END as mentor_email,
    CASE 
        WHEN c.mentor_type = 'educator' THEN se.phone_number
        WHEN c.mentor_type = 'school' THEN sc.principal_phone
        ELSE NULL
    END as mentor_phone,
    CASE 
        WHEN c.mentor_type = 'educator' THEN se.designation
        WHEN c.mentor_type = 'school' THEN 'Principal'
        ELSE NULL
    END as mentor_designation,
    
    -- Member count
    (SELECT COUNT(*) FROM public.club_memberships WHERE club_id = c.club_id AND status = 'active') as current_members,
    
    c.created_at,
    c.updated_at
FROM public.clubs c
LEFT JOIN public.school_educators se ON c.mentor_educator_id = se.id
LEFT JOIN public.schools sc ON c.mentor_school_id = sc.id;

-- View: Club participation report (for reporting requirements)
CREATE OR REPLACE VIEW club_participation_report AS
SELECT 
    c.club_id,
    c.school_id,
    c.name as club_name,
    c.category,
    COUNT(DISTINCT cm.student_email) as student_count,
    ROUND(AVG(cm.attendance_percentage), 2) as avg_attendance,
    ROUND(AVG(cm.performance_score), 2) as avg_performance_score,
    ROUND((COUNT(DISTINCT cm.student_email)::DECIMAL / NULLIF(c.capacity, 0)) * 100, 2) as participation_score,
    -- Top performers (students with performance_score > 80)
    (
        SELECT STRING_AGG(s.name, ', ')
        FROM public.club_memberships cm2
        JOIN public.students s ON cm2.student_email = s.email
        WHERE cm2.club_id = c.club_id 
        AND cm2.status = 'active'
        AND cm2.performance_score > 80
        LIMIT 5
    ) as top_performers
FROM public.clubs c
LEFT JOIN public.club_memberships cm ON c.club_id = cm.club_id AND cm.status = 'active'
GROUP BY c.club_id, c.school_id, c.name, c.category, c.capacity;

-- View: Competition performance report (for reporting requirements)
CREATE OR REPLACE VIEW competition_performance_report AS
SELECT 
    comp.comp_id,
    comp.school_id,
    comp.name as competition_name,
    comp.level,
    comp.category,
    comp.competition_date,
    COUNT(DISTINCT cr.student_email) as total_participants,
    COUNT(DISTINCT CASE WHEN cr.award IS NOT NULL THEN cr.student_email END) as award_winners,
    STRING_AGG(DISTINCT cr.award, ', ') as awards_won,
    ROUND(AVG(cr.score), 2) as avg_score,
    -- Student results summary
    (
        SELECT STRING_AGG(student_result, ', ')
        FROM (
            SELECT s.name || ' (Rank: ' || COALESCE(cr2.rank::TEXT, 'N/A') || ')' as student_result
            FROM public.competition_results cr2
            JOIN public.students s ON cr2.student_email = s.email
            WHERE cr2.comp_id = comp.comp_id
            ORDER BY cr2.rank NULLS LAST
            LIMIT 10
        ) ranked_results
    ) as student_results
FROM public.competitions comp
LEFT JOIN public.competition_results cr ON comp.comp_id = cr.comp_id
GROUP BY comp.comp_id, comp.school_id, comp.name, comp.level, comp.category, comp.competition_date;

-- ========================================
-- HELPER FUNCTIONS FOR UI INTEGRATION
-- ========================================

-- Function to get club with member count and upcoming activities
CREATE OR REPLACE FUNCTION get_club_details(p_club_id UUID)
RETURNS TABLE (
    club_id UUID,
    name VARCHAR,
    category VARCHAR,
    description TEXT,
    capacity INTEGER,
    member_count BIGINT,
    meeting_day VARCHAR,
    meeting_time VARCHAR,
    location VARCHAR,
    mentor_name TEXT,
    avg_attendance NUMERIC,
    upcoming_competitions BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.club_id,
        c.name,
        c.category,
        c.description,
        c.capacity,
        COUNT(DISTINCT cm.student_email) as member_count,
        c.meeting_day,
        c.meeting_time,
        c.location,
        CASE 
            WHEN c.mentor_type = 'educator' THEN se.first_name || ' ' || se.last_name
            WHEN c.mentor_type = 'school' THEN sc.principal_name
            ELSE 'TBD'
        END as mentor_name,
        ROUND(AVG(cm.attendance_percentage), 2) as avg_attendance,
        COUNT(DISTINCT cc.comp_id) as upcoming_competitions
    FROM public.clubs c
    LEFT JOIN public.club_memberships cm ON c.club_id = cm.club_id AND cm.status = 'active'
    LEFT JOIN public.school_educators se ON c.mentor_educator_id = se.id
    LEFT JOIN public.schools sc ON c.mentor_school_id = sc.id
    LEFT JOIN public.competition_clubs cc ON c.club_id = cc.club_id
    LEFT JOIN public.competitions comp ON cc.comp_id = comp.comp_id AND comp.status = 'upcoming'
    WHERE c.club_id = p_club_id
    GROUP BY c.club_id, c.name, c.category, c.description, c.capacity, 
             c.meeting_day, c.meeting_time, c.location, c.mentor_type,
             se.first_name, se.last_name, sc.principal_name;
END;
$$ LANGUAGE plpgsql;

-- Function to check if student can join club
CREATE OR REPLACE FUNCTION can_student_join_club(
    p_student_email VARCHAR,
    p_club_id UUID
)
RETURNS TABLE (
    can_join BOOLEAN,
    reason TEXT
) AS $$
DECLARE
    v_club_capacity INTEGER;
    v_current_members INTEGER;
    v_student_clubs INTEGER;
    v_max_clubs INTEGER := 5;
    v_club_school UUID;
    v_student_school UUID;
    v_already_member BOOLEAN;
BEGIN
    -- Check if already a member
    SELECT EXISTS(
        SELECT 1 FROM public.club_memberships 
        WHERE club_id = p_club_id 
        AND student_email = p_student_email 
        AND status = 'active'
    ) INTO v_already_member;
    
    IF v_already_member THEN
        RETURN QUERY SELECT FALSE, 'Already a member of this club';
        RETURN;
    END IF;
    
    -- Check school match
    SELECT school_id INTO v_club_school FROM public.clubs WHERE club_id = p_club_id;
    SELECT school_id INTO v_student_school FROM public.students WHERE email = p_student_email;
    
    IF v_club_school != v_student_school THEN
        RETURN QUERY SELECT FALSE, 'Student and club belong to different schools';
        RETURN;
    END IF;
    
    -- Check club capacity
    SELECT capacity INTO v_club_capacity FROM public.clubs WHERE club_id = p_club_id;
    SELECT COUNT(*) INTO v_current_members 
    FROM public.club_memberships 
    WHERE club_id = p_club_id AND status = 'active';
    
    IF v_current_members >= v_club_capacity THEN
        RETURN QUERY SELECT FALSE, 'Club is at full capacity';
        RETURN;
    END IF;
    
    -- Check student's club count
    SELECT COUNT(*) INTO v_student_clubs
    FROM public.club_memberships
    WHERE student_email = p_student_email AND status = 'active';
    
    IF v_student_clubs >= v_max_clubs THEN
        RETURN QUERY SELECT FALSE, 'Student has reached maximum club limit';
        RETURN;
    END IF;
    
    -- All checks passed
    RETURN QUERY SELECT TRUE, 'Can join club'::TEXT;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- COMMENTS FOR DOCUMENTATION
-- ========================================

COMMENT ON TABLE public.clubs IS 'Stores all club information with polymorphic mentor support (educator or school)';
COMMENT ON TABLE public.club_memberships IS 'Tracks student enrollment in clubs with attendance and performance metrics';
COMMENT ON TABLE public.competitions IS 'Stores competition information with multi-level support';
COMMENT ON TABLE public.skill_badges IS 'Defines available skill badges with auto-award capability';
COMMENT ON TABLE public.club_certificates IS 'Stores generated club_certificates with verification support';

COMMENT ON VIEW club_participation_report IS 'Report view for club participation metrics (Requirement 9.5.1)';
COMMENT ON VIEW competition_performance_report IS 'Report view for competition performance metrics (Requirement 9.5.2)';

COMMENT ON FUNCTION get_club_details IS 'Returns comprehensive club information including member count and activities';
COMMENT ON FUNCTION can_student_join_club IS 'Validates if a student can join a specific club';

-- ========================================
-- END OF SCHEMA
-- ========================================

-- ==================== UPDATED COLLEGE ATTENDANCE TRACKING SCHEMA ====================
-- Updated to work with existing college tables: programs, program_sections, college_courses, college_lecturers
-- This schema integrates with your existing college management system

-- ==================== ATTENDANCE TABLES ====================

-- 1. COLLEGE ATTENDANCE SESSIONS TABLE (Updated to match your existing schema)
CREATE TABLE IF NOT EXISTS college_attendance_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    
    -- Subject Information (from college_courses)
    subject_name VARCHAR(255) NOT NULL,
    subject_code VARCHAR(50),
    course_type VARCHAR(20), -- theory/lab/practical
    
    -- Faculty Information (from college_lecturers)
    faculty_id UUID REFERENCES college_lecturers(id),
    faculty_name VARCHAR(255) NOT NULL,
    
    -- Class Information (from program_sections_view)
    department_name VARCHAR(255) NOT NULL,
    program_name VARCHAR(255) NOT NULL,
    program_code VARCHAR(50),
    semester INTEGER NOT NULL,
    section VARCHAR(10) NOT NULL,
    
    -- Session Details
    room_number VARCHAR(50),
    academic_year VARCHAR(20) DEFAULT '2024-25',
    
    -- Attendance Statistics (auto-calculated)
    total_students INTEGER DEFAULT 0,
    present_count INTEGER DEFAULT 0,
    absent_count INTEGER DEFAULT 0,
    late_count INTEGER DEFAULT 0,
    excused_count INTEGER DEFAULT 0,
    attendance_percentage DECIMAL(5,2) DEFAULT 0.00,
    
    -- Session Status
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'ongoing', 'completed', 'cancelled')),
    remarks TEXT,
    
    -- Audit Fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    college_id UUID REFERENCES colleges(id) NOT NULL
);

-- 2. COLLEGE ATTENDANCE RECORDS TABLE (Individual student attendance)
CREATE TABLE IF NOT EXISTS college_attendance_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES college_attendance_sessions(id) ON DELETE CASCADE,
    
    -- Student Information
    student_id UUID REFERENCES students(id),
    student_name VARCHAR(255) NOT NULL,
    roll_number VARCHAR(50) NOT NULL,
    
    -- Class Information (denormalized for performance)
    department_name VARCHAR(255) NOT NULL,
    program_name VARCHAR(255) NOT NULL,
    semester INTEGER NOT NULL,
    section VARCHAR(10) NOT NULL,
    
    -- Attendance Details
    date DATE NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('present', 'absent', 'late', 'excused')),
    time_in TIME,
    time_out TIME,
    
    -- Subject Information
    subject_name VARCHAR(255) NOT NULL,
    subject_code VARCHAR(50),
    
    -- Faculty Information
    faculty_id UUID REFERENCES college_lecturers(id),
    faculty_name VARCHAR(255) NOT NULL,
    
    -- Additional Details
    location VARCHAR(255),
    remarks TEXT,
    
    -- Audit Fields
    marked_by UUID REFERENCES auth.users(id),
    marked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    college_id UUID REFERENCES colleges(id) NOT NULL
);

-- 3. COLLEGE ATTENDANCE SETTINGS TABLE (College-specific policies)
CREATE TABLE IF NOT EXISTS college_attendance_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    college_id UUID REFERENCES colleges(id) NOT NULL,
    minimum_attendance_percentage DECIMAL(5,2) DEFAULT 75.00,
    late_arrival_threshold_minutes INTEGER DEFAULT 15,
    auto_mark_absent_after_minutes INTEGER DEFAULT 30,
    allow_retroactive_marking BOOLEAN DEFAULT true,
    retroactive_days_limit INTEGER DEFAULT 7,
    require_remarks_for_excused BOOLEAN DEFAULT true,
    enable_biometric_integration BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(college_id)
);

-- ==================== PERFORMANCE INDEXES ====================

-- College Attendance Sessions Indexes
CREATE INDEX IF NOT EXISTS idx_college_attendance_sessions_date ON college_attendance_sessions(date);
CREATE INDEX IF NOT EXISTS idx_college_attendance_sessions_faculty ON college_attendance_sessions(faculty_id);
CREATE INDEX IF NOT EXISTS idx_college_attendance_sessions_class ON college_attendance_sessions(department_name, program_name, semester, section);
CREATE INDEX IF NOT EXISTS idx_college_attendance_sessions_college ON college_attendance_sessions(college_id);
CREATE INDEX IF NOT EXISTS idx_college_attendance_sessions_status ON college_attendance_sessions(status);
CREATE INDEX IF NOT EXISTS idx_college_attendance_sessions_subject ON college_attendance_sessions(subject_name);
CREATE INDEX IF NOT EXISTS idx_college_attendance_sessions_academic_year ON college_attendance_sessions(academic_year);

-- College Attendance Records Indexes
CREATE INDEX IF NOT EXISTS idx_college_attendance_records_session ON college_attendance_records(session_id);
CREATE INDEX IF NOT EXISTS idx_college_attendance_records_student ON college_attendance_records(student_id);
CREATE INDEX IF NOT EXISTS idx_college_attendance_records_date ON college_attendance_records(date);
CREATE INDEX IF NOT EXISTS idx_college_attendance_records_status ON college_attendance_records(status);
CREATE INDEX IF NOT EXISTS idx_college_attendance_records_subject ON college_attendance_records(subject_name);
CREATE INDEX IF NOT EXISTS idx_college_attendance_records_college ON college_attendance_records(college_id);
CREATE INDEX IF NOT EXISTS idx_college_attendance_records_class ON college_attendance_records(department_name, program_name, semester, section);

-- ==================== AUTO-CALCULATION TRIGGERS ====================

-- Function to update session attendance statistics
CREATE OR REPLACE FUNCTION update_session_attendance_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Update attendance counts for the session
    UPDATE college_attendance_sessions 
    SET 
        present_count = (
            SELECT COUNT(*) FROM college_attendance_records 
            WHERE session_id = COALESCE(NEW.session_id, OLD.session_id) 
            AND status = 'present'
        ),
        absent_count = (
            SELECT COUNT(*) FROM college_attendance_records 
            WHERE session_id = COALESCE(NEW.session_id, OLD.session_id) 
            AND status = 'absent'
        ),
        late_count = (
            SELECT COUNT(*) FROM college_attendance_records 
            WHERE session_id = COALESCE(NEW.session_id, OLD.session_id) 
            AND status = 'late'
        ),
        excused_count = (
            SELECT COUNT(*) FROM college_attendance_records 
            WHERE session_id = COALESCE(NEW.session_id, OLD.session_id) 
            AND status = 'excused'
        ),
        updated_at = NOW()
    WHERE id = COALESCE(NEW.session_id, OLD.session_id);
    
    -- Calculate attendance percentage
    UPDATE college_attendance_sessions 
    SET attendance_percentage = CASE 
        WHEN total_students > 0 THEN 
            ROUND(((present_count + late_count + excused_count) * 100.0 / total_students), 2)
        ELSE 0 
    END
    WHERE id = COALESCE(NEW.session_id, OLD.session_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger for attendance record changes
DROP TRIGGER IF EXISTS trigger_update_session_stats ON college_attendance_records;
CREATE TRIGGER trigger_update_session_stats
    AFTER INSERT OR UPDATE OR DELETE ON college_attendance_records
    FOR EACH ROW
    EXECUTE FUNCTION update_session_attendance_stats();

-- Function to set total students when creating session
CREATE OR REPLACE FUNCTION set_session_total_students()
RETURNS TRIGGER AS $$
BEGIN
    -- Set total students from program_sections_view
    NEW.total_students := COALESCE((
        SELECT max_students
        FROM program_sections_view psv
        WHERE psv.department_name = NEW.department_name
        AND psv.program_name = NEW.program_name
        AND psv.semester = NEW.semester
        AND psv.section = NEW.section
        AND psv.status = 'active'
        LIMIT 1
    ), 0);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for new sessions
DROP TRIGGER IF EXISTS trigger_set_total_students ON college_attendance_sessions;
CREATE TRIGGER trigger_set_total_students
    BEFORE INSERT ON college_attendance_sessions
    FOR EACH ROW
    EXECUTE FUNCTION set_session_total_students();

-- ==================== VIEWS FOR COMPONENT DATA ====================

-- Main view for subject groups (integrates with your existing tables)
CREATE OR REPLACE VIEW college_subject_attendance_summary AS
SELECT 
    ats.subject_name as subject,
    ats.subject_code,
    ats.department_name as department,
    ats.program_name as course,
    ats.program_code,
    ats.semester,
    ats.section,
    ats.faculty_name as faculty,
    ats.faculty_id,
    COUNT(DISTINCT ats.id) as total_sessions,
    COALESCE(AVG(ats.attendance_percentage), 0) as avg_attendance_percentage,
    COALESCE(SUM(ats.present_count), 0) as total_present_count,
    COALESCE(SUM(ats.absent_count), 0) as total_absent_count,
    COALESCE(SUM(ats.late_count), 0) as total_late_count,
    COALESCE(SUM(ats.excused_count), 0) as total_excused_count,
    MIN(ats.date) as first_date,
    MAX(ats.date) as last_date,
    COALESCE((
        SELECT status FROM college_attendance_sessions 
        WHERE subject_name = ats.subject_name 
        AND department_name = ats.department_name 
        AND program_name = ats.program_name 
        AND semester = ats.semester 
        AND section = ats.section
        AND college_id = ats.college_id
        ORDER BY date DESC, start_time DESC 
        LIMIT 1
    ), 'scheduled') as latest_status,
    COALESCE(MAX(ats.total_students), 0) as total_students,
    ats.college_id,
    ats.course_type
FROM college_attendance_sessions ats
GROUP BY 
    ats.subject_name, ats.subject_code, ats.department_name, ats.program_name, 
    ats.program_code, ats.semester, ats.section, ats.faculty_name, ats.faculty_id, 
    ats.college_id, ats.course_type;

-- View for student attendance statistics
CREATE OR REPLACE VIEW college_student_attendance_stats AS
SELECT 
    ar.student_id,
    ar.student_name,
    ar.roll_number,
    ar.subject_name as subject,
    ar.subject_code,
    ar.department_name as department,
    ar.program_name as course,
    ar.semester,
    ar.section,
    COUNT(*) as total_classes,
    COUNT(CASE WHEN ar.status = 'present' THEN 1 END) as present_count,
    COUNT(CASE WHEN ar.status = 'absent' THEN 1 END) as absent_count,
    COUNT(CASE WHEN ar.status = 'late' THEN 1 END) as late_count,
    COUNT(CASE WHEN ar.status = 'excused' THEN 1 END) as excused_count,
    ROUND(
        (COUNT(CASE WHEN ar.status IN ('present', 'late', 'excused') THEN 1 END) * 100.0 / COUNT(*)), 
        2
    ) as attendance_percentage,
    ar.college_id
FROM college_attendance_records ar
GROUP BY 
    ar.student_id, ar.student_name, ar.roll_number, ar.subject_name, ar.subject_code,
    ar.department_name, ar.program_name, ar.semester, ar.section, ar.college_id;

-- View for daily attendance summary
CREATE OR REPLACE VIEW college_daily_attendance_summary AS
SELECT 
    date,
    department_name as department,
    program_name as course,
    semester,
    section,
    COUNT(DISTINCT session_id) as total_sessions,
    COUNT(*) as total_records,
    COUNT(CASE WHEN status = 'present' THEN 1 END) as present_count,
    COUNT(CASE WHEN status = 'absent' THEN 1 END) as absent_count,
    COUNT(CASE WHEN status = 'late' THEN 1 END) as late_count,
    COUNT(CASE WHEN status = 'excused' THEN 1 END) as excused_count,
    ROUND(
        (COUNT(CASE WHEN status IN ('present', 'late', 'excused') THEN 1 END) * 100.0 / COUNT(*)), 
        2
    ) as daily_attendance_percentage,
    college_id
FROM college_attendance_records
GROUP BY date, department_name, program_name, semester, section, college_id
ORDER BY date DESC;

-- ==================== SAMPLE DATA INSERTION ====================

-- Insert default attendance settings for existing colleges
INSERT INTO college_attendance_settings (college_id, minimum_attendance_percentage, late_arrival_threshold_minutes)
SELECT id, 75.00, 15 FROM colleges
ON CONFLICT (college_id) DO NOTHING;

-- ==================== API QUERIES FOR SESSION CREATION ====================

-- Query 1: Get dropdown options for session creation form
/*
-- Departments
SELECT DISTINCT department_name 
FROM program_sections_view 
WHERE status = 'active' 
ORDER BY department_name;

-- Programs/Courses for a department
SELECT DISTINCT program_name, program_code 
FROM program_sections_view 
WHERE department_name = $1 AND status = 'active'
ORDER BY program_name;

-- Semesters for a program
SELECT DISTINCT semester 
FROM program_sections_view 
WHERE department_name = $1 AND program_name = $2 AND status = 'active'
ORDER BY semester;

-- Sections for a program and semester
SELECT DISTINCT section, max_students, faculty_name, faculty_id
FROM program_sections_view 
WHERE department_name = $1 AND program_name = $2 AND semester = $3 AND status = 'active'
ORDER BY section;

-- Subjects/Courses
SELECT course_name, course_code, course_type, credits
FROM college_courses 
WHERE college_id = $1 AND is_active = true
ORDER BY course_name;

-- Faculty for a specific class (optional - can also get from program_sections_view)
SELECT DISTINCT cl.id, cl.first_name || ' ' || cl.last_name as name, cl.department, cl.specialization
FROM college_lecturers cl
JOIN college_faculty_class_assignments cfca ON cl.id = cfca.faculty_id
WHERE cl."collegeId" = $1 AND cl."accountStatus" = 'active'
ORDER BY name;
*/

-- Query 2: Create attendance session
/*
INSERT INTO college_attendance_sessions (
    date, start_time, end_time, subject_name, subject_code, course_type,
    faculty_id, faculty_name, department_name, program_name, program_code,
    semester, section, room_number, academic_year, status, remarks,
    created_by, college_id
) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19
) RETURNING id;
*/

-- Query 3: Get subject groups for AttendanceTracking component
/*
SELECT * FROM college_subject_attendance_summary 
WHERE college_id = $1
AND ($2 IS NULL OR (subject ILIKE '%' || $2 || '%' OR faculty ILIKE '%' || $2 || '%' OR department ILIKE '%' || $2 || '%'))
AND ($3 IS NULL OR department = ANY($3::text[]))
AND ($4 IS NULL OR course = ANY($4::text[]))
AND ($5 IS NULL OR semester = ANY($5::int[]))
AND ($6 IS NULL OR section = ANY($6::text[]))
AND ($7 IS NULL OR latest_status = ANY($7::text[]))
AND ($8 IS NULL OR faculty = ANY($8::text[]))
ORDER BY subject, department, course, semester, section
LIMIT $9 OFFSET $10;
*/

-- Query 4: Get attendance analytics for KPI cards
/*
SELECT 
    COUNT(DISTINCT id) as total_sessions,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_sessions,
    COALESCE(ROUND(AVG(attendance_percentage), 1), 0) as avg_attendance,
    COALESCE(SUM(total_students), 0) as total_students,
    COALESCE(SUM(present_count), 0) as total_present,
    COALESCE(SUM(absent_count), 0) as total_absent,
    COUNT(CASE WHEN attendance_percentage < 75 THEN 1 END) as low_attendance_sessions
FROM college_attendance_sessions 
WHERE college_id = $1
AND date >= CURRENT_DATE - INTERVAL '30 days';
*/

-- ==================== INTEGRATION NOTES ====================
/*
This updated schema integrates with your existing tables:

✅ Uses program_sections_view for class information and student counts
✅ Uses college_courses for subject/course information  
✅ Uses college_lecturers for faculty information
✅ Uses college_faculty_class_assignments for faculty-class mapping
✅ Maintains compatibility with your existing college management system
✅ Auto-calculates attendance statistics via triggers
✅ Provides views that match your AttendanceTracking component data structure

Key Benefits:
- No need to duplicate existing data
- Leverages your existing program/course structure
- Maintains referential integrity with existing tables
- Ready for immediate integration with your React component
*/
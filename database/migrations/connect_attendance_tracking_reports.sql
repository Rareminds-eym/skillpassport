-- =====================================================
-- Connect Attendance Tracking with Reports & Analytics
-- =====================================================
-- This migration adds indexes and optimizations to connect
-- the Attendance Tracking page with Reports & Analytics
-- =====================================================

-- 1. Add indexes to college_attendance_records for better query performance
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_attendance_records_date 
  ON college_attendance_records(date);

CREATE INDEX IF NOT EXISTS idx_attendance_records_student 
  ON college_attendance_records(student_id);

CREATE INDEX IF NOT EXISTS idx_attendance_records_status 
  ON college_attendance_records(status);

CREATE INDEX IF NOT EXISTS idx_attendance_records_session 
  ON college_attendance_records(session_id);

CREATE INDEX IF NOT EXISTS idx_attendance_records_department 
  ON college_attendance_records(department_name);

-- Composite index for common queries
CREATE INDEX IF NOT EXISTS idx_attendance_records_date_status 
  ON college_attendance_records(date, status);

-- 2. Add indexes to college_attendance_sessions
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_college 
  ON college_attendance_sessions(college_id);

CREATE INDEX IF NOT EXISTS idx_attendance_sessions_date 
  ON college_attendance_sessions(date);

CREATE INDEX IF NOT EXISTS idx_attendance_sessions_status 
  ON college_attendance_sessions(status);

CREATE INDEX IF NOT EXISTS idx_attendance_sessions_department 
  ON college_attendance_sessions(department_name);

-- Composite index for filtering by college and date range
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_college_date 
  ON college_attendance_sessions(college_id, date);

-- 3. Create a materialized view for faster reporting (optional)
-- =====================================================
CREATE MATERIALIZED VIEW IF NOT EXISTS attendance_report_summary AS
SELECT 
  s.college_id,
  r.department_name,
  DATE_TRUNC('month', r.date) as month,
  COUNT(*) as total_records,
  COUNT(*) FILTER (WHERE r.status = 'present') as present_count,
  COUNT(*) FILTER (WHERE r.status = 'absent') as absent_count,
  COUNT(*) FILTER (WHERE r.status = 'late') as late_count,
  COUNT(*) FILTER (WHERE r.status = 'excused') as excused_count,
  ROUND(
    (COUNT(*) FILTER (WHERE r.status IN ('present', 'late', 'excused'))::numeric / 
    NULLIF(COUNT(*), 0) * 100), 
    2
  ) as attendance_percentage
FROM college_attendance_records r
JOIN college_attendance_sessions s ON r.session_id = s.id
GROUP BY s.college_id, r.department_name, DATE_TRUNC('month', r.date);

-- Create index on the materialized view
CREATE INDEX IF NOT EXISTS idx_attendance_report_summary_college 
  ON attendance_report_summary(college_id);

CREATE INDEX IF NOT EXISTS idx_attendance_report_summary_month 
  ON attendance_report_summary(month);

-- 4. Create a function to refresh the materialized view
-- =====================================================
CREATE OR REPLACE FUNCTION refresh_attendance_report_summary()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY attendance_report_summary;
END;
$$ LANGUAGE plpgsql;

-- 5. Add comments for documentation
-- =====================================================
COMMENT ON INDEX idx_attendance_records_date IS 'Index for date-based queries in reports';
COMMENT ON INDEX idx_attendance_records_student IS 'Index for student-specific attendance queries';
COMMENT ON INDEX idx_attendance_sessions_college IS 'Index for college-specific session queries';
COMMENT ON MATERIALIZED VIEW attendance_report_summary IS 'Pre-aggregated attendance data for faster reporting';
COMMENT ON FUNCTION refresh_attendance_report_summary IS 'Refreshes the attendance report summary materialized view';

-- 6. Deprecate the old college_attendance table
-- =====================================================
COMMENT ON TABLE college_attendance IS 'DEPRECATED: This table is no longer used. Reports now use college_attendance_records from the Attendance Tracking system. Kept for backward compatibility only.';

-- 7. Create a helper function to get attendance statistics
-- =====================================================
CREATE OR REPLACE FUNCTION get_attendance_stats(
  p_college_id UUID,
  p_start_date DATE,
  p_end_date DATE
) RETURNS TABLE (
  total_records BIGINT,
  present_count BIGINT,
  absent_count BIGINT,
  late_count BIGINT,
  excused_count BIGINT,
  attendance_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_records,
    COUNT(*) FILTER (WHERE r.status = 'present') as present_count,
    COUNT(*) FILTER (WHERE r.status = 'absent') as absent_count,
    COUNT(*) FILTER (WHERE r.status = 'late') as late_count,
    COUNT(*) FILTER (WHERE r.status = 'excused') as excused_count,
    ROUND(
      (COUNT(*) FILTER (WHERE r.status IN ('present', 'late', 'excused'))::numeric / 
      NULLIF(COUNT(*), 0) * 100), 
      2
    ) as attendance_rate
  FROM college_attendance_records r
  JOIN college_attendance_sessions s ON r.session_id = s.id
  WHERE s.college_id = p_college_id
    AND r.date >= p_start_date
    AND r.date <= p_end_date;
END;
$$ LANGUAGE plpgsql;

-- 8. Create a function to get department-wise attendance
-- =====================================================
CREATE OR REPLACE FUNCTION get_department_attendance(
  p_college_id UUID,
  p_start_date DATE,
  p_end_date DATE
) RETURNS TABLE (
  department_name TEXT,
  total_records BIGINT,
  present_count BIGINT,
  attendance_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.department_name,
    COUNT(*) as total_records,
    COUNT(*) FILTER (WHERE r.status IN ('present', 'late', 'excused')) as present_count,
    ROUND(
      (COUNT(*) FILTER (WHERE r.status IN ('present', 'late', 'excused'))::numeric / 
      NULLIF(COUNT(*), 0) * 100), 
      2
    ) as attendance_rate
  FROM college_attendance_records r
  JOIN college_attendance_sessions s ON r.session_id = s.id
  WHERE s.college_id = p_college_id
    AND r.date >= p_start_date
    AND r.date <= p_end_date
  GROUP BY r.department_name
  ORDER BY attendance_rate DESC;
END;
$$ LANGUAGE plpgsql;

-- 9. Create a function to get students below threshold
-- =====================================================
CREATE OR REPLACE FUNCTION get_students_below_threshold(
  p_college_id UUID,
  p_start_date DATE,
  p_end_date DATE,
  p_threshold NUMERIC DEFAULT 75.0
) RETURNS TABLE (
  student_id UUID,
  student_name TEXT,
  total_records BIGINT,
  present_count BIGINT,
  attendance_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.student_id,
    r.student_name,
    COUNT(*) as total_records,
    COUNT(*) FILTER (WHERE r.status IN ('present', 'late', 'excused')) as present_count,
    ROUND(
      (COUNT(*) FILTER (WHERE r.status IN ('present', 'late', 'excused'))::numeric / 
      NULLIF(COUNT(*), 0) * 100), 
      2
    ) as attendance_rate
  FROM college_attendance_records r
  JOIN college_attendance_sessions s ON r.session_id = s.id
  WHERE s.college_id = p_college_id
    AND r.date >= p_start_date
    AND r.date <= p_end_date
  GROUP BY r.student_id, r.student_name
  HAVING ROUND(
    (COUNT(*) FILTER (WHERE r.status IN ('present', 'late', 'excused'))::numeric / 
    NULLIF(COUNT(*), 0) * 100), 
    2
  ) < p_threshold
  ORDER BY attendance_rate ASC;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Usage Instructions:
-- =====================================================
-- The Reports & Analytics page is now connected to the Attendance Tracking system!
--
-- To use the helper functions:
--
-- 1. Get overall attendance stats:
--    SELECT * FROM get_attendance_stats(
--      'your-college-id',
--      '2026-01-01',
--      '2026-01-31'
--    );
--
-- 2. Get department-wise attendance:
--    SELECT * FROM get_department_attendance(
--      'your-college-id',
--      '2026-01-01',
--      '2026-01-31'
--    );
--
-- 3. Get students below 75% attendance:
--    SELECT * FROM get_students_below_threshold(
--      'your-college-id',
--      '2026-01-01',
--      '2026-01-31',
--      75.0
--    );
--
-- 4. Refresh the materialized view (run daily):
--    SELECT refresh_attendance_report_summary();
--
-- =====================================================
-- Performance Tips:
-- =====================================================
-- - Run refresh_attendance_report_summary() daily via cron
-- - Use the materialized view for dashboard queries
-- - Indexes will automatically improve query performance
-- - Consider partitioning tables if data grows > 1M records
-- =====================================================

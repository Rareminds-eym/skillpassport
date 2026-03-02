-- =====================================================
-- ENABLE ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE club_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE club_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE club_attendance_records ENABLE ROW LEVEL SECURITY;


-- =====================================================
-- HELPER FUNCTION: STAFF SCHOOL ACCESS
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_user_school_ids()
RETURNS TABLE (school_id uuid)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT se.school_id
  FROM school_educators se
  WHERE se.user_id = auth.uid()

  UNION

  SELECT o.id
  FROM organizations o
  WHERE o.organization_type = 'school'
  AND o.admin_id = auth.uid();
$$;


-- =====================================================
-- HELPER FUNCTION: STUDENT SCHOOL ACCESS
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_student_school_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT s.school_id
  FROM students s
  WHERE s.id = auth.uid()
  LIMIT 1;
$$;


-- =====================================================
-- DROP OLD POLICIES (SAFE RESET)
-- =====================================================

DROP POLICY IF EXISTS clubs_staff_access ON clubs;
DROP POLICY IF EXISTS clubs_student_access ON clubs;

DROP POLICY IF EXISTS memberships_staff_access ON club_memberships;
DROP POLICY IF EXISTS memberships_student_access ON club_memberships;

DROP POLICY IF EXISTS attendance_staff_access ON club_attendance;
DROP POLICY IF EXISTS attendance_student_access ON club_attendance;

DROP POLICY IF EXISTS attendance_records_staff_access ON club_attendance_records;
DROP POLICY IF EXISTS attendance_records_student_access ON club_attendance_records;


-- =====================================================
-- CLUBS TABLE POLICIES
-- =====================================================

-- Staff: Full control within their school
CREATE POLICY clubs_staff_access
ON clubs
FOR ALL
USING (
  school_id IN (SELECT school_id FROM public.get_user_school_ids())
)
WITH CHECK (
  school_id IN (SELECT school_id FROM public.get_user_school_ids())
);

-- Students: Read active clubs in their school
CREATE POLICY clubs_student_access
ON clubs
FOR SELECT
USING (
  school_id = public.get_student_school_id()
  AND is_active = true
);


-- =====================================================
-- CLUB MEMBERSHIPS POLICIES
-- =====================================================

-- Staff: Full access to memberships of their school
CREATE POLICY memberships_staff_access
ON club_memberships
FOR ALL
USING (
  club_id IN (
    SELECT c.club_id
    FROM clubs c
    WHERE c.school_id IN (
      SELECT school_id FROM public.get_user_school_ids()
    )
  )
)
WITH CHECK (
  club_id IN (
    SELECT c.club_id
    FROM clubs c
    WHERE c.school_id IN (
      SELECT school_id FROM public.get_user_school_ids()
    )
  )
);

-- Students: Read only their own memberships
CREATE POLICY memberships_student_access
ON club_memberships
FOR SELECT
USING (
  student_email = (
    SELECT s.email
    FROM students s
    WHERE s.id = auth.uid()
  )
);


-- =====================================================
-- CLUB ATTENDANCE POLICIES
-- =====================================================

-- Staff: Full access
CREATE POLICY attendance_staff_access
ON club_attendance
FOR ALL
USING (
  club_id IN (
    SELECT c.club_id
    FROM clubs c
    WHERE c.school_id IN (
      SELECT school_id FROM public.get_user_school_ids()
    )
  )
)
WITH CHECK (
  club_id IN (
    SELECT c.club_id
    FROM clubs c
    WHERE c.school_id IN (
      SELECT school_id FROM public.get_user_school_ids()
    )
  )
);

-- Students: Read attendance only for clubs they are active in
CREATE POLICY attendance_student_access
ON club_attendance
FOR SELECT
USING (
  club_id IN (
    SELECT cm.club_id
    FROM club_memberships cm
    WHERE cm.student_email = (
      SELECT s.email
      FROM students s
      WHERE s.id = auth.uid()
    )
    AND cm.status = 'active'
  )
);


-- =====================================================
-- CLUB ATTENDANCE RECORDS POLICIES
-- =====================================================

-- Staff: Full access
CREATE POLICY attendance_records_staff_access
ON club_attendance_records
FOR ALL
USING (
  attendance_id IN (
    SELECT ca.attendance_id
    FROM club_attendance ca
    JOIN clubs c ON ca.club_id = c.club_id
    WHERE c.school_id IN (
      SELECT school_id FROM public.get_user_school_ids()
    )
  )
)
WITH CHECK (
  attendance_id IN (
    SELECT ca.attendance_id
    FROM club_attendance ca
    JOIN clubs c ON ca.club_id = c.club_id
    WHERE c.school_id IN (
      SELECT school_id FROM public.get_user_school_ids()
    )
  )
);

-- Students: Read only their own attendance records
CREATE POLICY attendance_records_student_access
ON club_attendance_records
FOR SELECT
USING (
  student_email = (
    SELECT s.email
    FROM students s
    WHERE s.id = auth.uid()
  )
);


-- =====================================================
-- PERFORMANCE INDEXES (VERY IMPORTANT)
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_clubs_school_id
ON clubs(school_id);

CREATE INDEX IF NOT EXISTS idx_memberships_club_id
ON club_memberships(club_id);

CREATE INDEX IF NOT EXISTS idx_memberships_student_email
ON club_memberships(student_email);

CREATE INDEX IF NOT EXISTS idx_attendance_club_id
ON club_attendance(club_id);

CREATE INDEX IF NOT EXISTS idx_attendance_records_attendance_id
ON club_attendance_records(attendance_id);

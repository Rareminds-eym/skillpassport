-- =====================================================
-- ENABLE ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE competitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE competition_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE competition_clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE competition_results ENABLE ROW LEVEL SECURITY;


-- =====================================================
-- DROP OLD POLICIES (SAFE RESET)
-- =====================================================

DROP POLICY IF EXISTS competitions_staff_access ON competitions;
DROP POLICY IF EXISTS competitions_student_access ON competitions;

DROP POLICY IF EXISTS registrations_staff_access ON competition_registrations;
DROP POLICY IF EXISTS registrations_student_access ON competition_registrations;

DROP POLICY IF EXISTS competition_clubs_staff_access ON competition_clubs;
DROP POLICY IF EXISTS competition_clubs_student_access ON competition_clubs;

DROP POLICY IF EXISTS results_staff_access ON competition_results;
DROP POLICY IF EXISTS results_student_access ON competition_results;


-- =====================================================
-- COMPETITIONS TABLE POLICIES
-- =====================================================

-- Staff: Full control within their school
CREATE POLICY competitions_staff_access
ON competitions
FOR ALL
USING (
  school_id IN (SELECT school_id FROM public.get_user_school_ids())
)
WITH CHECK (
  school_id IN (SELECT school_id FROM public.get_user_school_ids())
);

-- Students: Read active competitions in their school
CREATE POLICY competitions_student_access
ON competitions
FOR SELECT
USING (
  school_id = public.get_student_school_id()
  AND status = 'active'
);


-- =====================================================
-- COMPETITION REGISTRATIONS POLICIES
-- =====================================================

-- Staff: Full access to registrations of their school
CREATE POLICY registrations_staff_access
ON competition_registrations
FOR ALL
USING (
  comp_id IN (
    SELECT c.comp_id
    FROM competitions c
    WHERE c.school_id IN (
      SELECT school_id FROM public.get_user_school_ids()
    )
  )
)
WITH CHECK (
  comp_id IN (
    SELECT c.comp_id
    FROM competitions c
    WHERE c.school_id IN (
      SELECT school_id FROM public.get_user_school_ids()
    )
  )
);

-- Students: Read only their own registrations
CREATE POLICY registrations_student_access
ON competition_registrations
FOR SELECT
USING (
  student_email = (
    SELECT s.email
    FROM students s
    WHERE s.id = auth.uid()
  )
);


-- =====================================================
-- COMPETITION CLUBS POLICIES
-- =====================================================

-- Staff: Full access
CREATE POLICY competition_clubs_staff_access
ON competition_clubs
FOR ALL
USING (
  comp_id IN (
    SELECT c.comp_id
    FROM competitions c
    WHERE c.school_id IN (
      SELECT school_id FROM public.get_user_school_ids()
    )
  )
)
WITH CHECK (
  comp_id IN (
    SELECT c.comp_id
    FROM competitions c
    WHERE c.school_id IN (
      SELECT school_id FROM public.get_user_school_ids()
    )
  )
);

-- Students: Read competition clubs for competitions they can see
CREATE POLICY competition_clubs_student_access
ON competition_clubs
FOR SELECT
USING (
  comp_id IN (
    SELECT c.comp_id
    FROM competitions c
    WHERE c.school_id = public.get_student_school_id()
    AND c.status = 'active'
  )
);


-- =====================================================
-- COMPETITION RESULTS POLICIES
-- =====================================================

-- Staff: Full access
CREATE POLICY results_staff_access
ON competition_results
FOR ALL
USING (
  comp_id IN (
    SELECT c.comp_id
    FROM competitions c
    WHERE c.school_id IN (
      SELECT school_id FROM public.get_user_school_ids()
    )
  )
)
WITH CHECK (
  comp_id IN (
    SELECT c.comp_id
    FROM competitions c
    WHERE c.school_id IN (
      SELECT school_id FROM public.get_user_school_ids()
    )
  )
);

-- Students: Read only their own results
CREATE POLICY results_student_access
ON competition_results
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

CREATE INDEX IF NOT EXISTS idx_competitions_school_id
ON competitions(school_id);

CREATE INDEX IF NOT EXISTS idx_competition_registrations_comp_id
ON competition_registrations(comp_id);

CREATE INDEX IF NOT EXISTS idx_competition_registrations_student_email
ON competition_registrations(student_email);

CREATE INDEX IF NOT EXISTS idx_competition_clubs_comp_id
ON competition_clubs(comp_id);

CREATE INDEX IF NOT EXISTS idx_competition_results_comp_id
ON competition_results(comp_id);

CREATE INDEX IF NOT EXISTS idx_competition_results_student_email
ON competition_results(student_email);

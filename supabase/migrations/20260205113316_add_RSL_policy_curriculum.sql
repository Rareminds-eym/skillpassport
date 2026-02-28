CREATE OR REPLACE FUNCTION public.get_user_school_ids()
RETURNS TABLE (school_id uuid)
LANGUAGE sql
SECURITY DEFINER
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

CREATE POLICY curriculum_subjects_school_access
ON curriculum_subjects
FOR ALL
USING (
  school_id IS NULL
  OR school_id IN (SELECT school_id FROM get_user_school_ids())
)
WITH CHECK (
  school_id IS NULL
  OR school_id IN (SELECT school_id FROM get_user_school_ids())
);


CREATE POLICY curriculum_classes_school_access
ON curriculum_classes
FOR ALL
USING (
  school_id IS NULL
  OR school_id IN (SELECT school_id FROM get_user_school_ids())
)
WITH CHECK (
  school_id IS NULL
  OR school_id IN (SELECT school_id FROM get_user_school_ids())
);


CREATE POLICY curriculum_academic_years_school_access
ON curriculum_academic_years
FOR ALL
USING (
  school_id IS NULL
  OR school_id IN (SELECT school_id FROM get_user_school_ids())
)
WITH CHECK (
  school_id IS NULL
  OR school_id IN (SELECT school_id FROM get_user_school_ids())
);

CREATE POLICY school_classes_school_access
ON school_classes
FOR ALL
USING (
  school_id IN (SELECT school_id FROM get_user_school_ids())
)
WITH CHECK (
  school_id IN (SELECT school_id FROM get_user_school_ids())
);


CREATE POLICY curriculums_school_access
ON curriculums
FOR ALL
USING (
  school_id IN (SELECT school_id FROM get_user_school_ids())
)
WITH CHECK (
  school_id IN (SELECT school_id FROM get_user_school_ids())
);

CREATE POLICY curriculum_chapters_school_access
ON curriculum_chapters
FOR ALL
USING (
  curriculum_id IN (
    SELECT c.id
    FROM curriculums c
    WHERE c.school_id IN (
      SELECT school_id FROM get_user_school_ids()
    )
  )
)
WITH CHECK (
  curriculum_id IN (
    SELECT c.id
    FROM curriculums c
    WHERE c.school_id IN (
      SELECT school_id FROM get_user_school_ids()
    )
  )
);


CREATE POLICY curriculum_learning_outcomes_school_access
ON curriculum_learning_outcomes
FOR ALL
USING (
  chapter_id IN (
    SELECT ch.id
    FROM curriculum_chapters ch
    JOIN curriculums c ON ch.curriculum_id = c.id
    WHERE c.school_id IN (
      SELECT school_id FROM get_user_school_ids()
    )
  )
)
WITH CHECK (
  chapter_id IN (
    SELECT ch.id
    FROM curriculum_chapters ch
    JOIN curriculums c ON ch.curriculum_id = c.id
    WHERE c.school_id IN (
      SELECT school_id FROM get_user_school_ids()
    )
  )
);

-- Resolve authenticated users through learner profiles, matching course enrollment and assigned-course access.
-- Preserve existing educator and legacy user-ID enrollment paths.
BEGIN;
CREATE OR REPLACE FUNCTION public.can_access_course_ai(p_user_id uuid,p_course_id uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
 SELECT EXISTS(SELECT 1 FROM courses c WHERE c.course_id=p_course_id AND c.deleted_at IS NULL AND (
   EXISTS(SELECT 1 FROM course_enrollments e WHERE e.course_id=c.course_id AND (e.learner_id=p_user_id OR EXISTS(SELECT 1 FROM public.learners l WHERE l.id=e.learner_id AND l.user_id=p_user_id)) AND e.status IN ('active','in_progress','completed'))
   OR (c.status='Active' AND EXISTS(SELECT 1 FROM public.demo_course_access a JOIN public.learners l ON l.id=a.learner_id WHERE a.course_id=c.course_id AND a.is_enabled AND l.user_id=p_user_id))
   OR c.educator_id=p_user_id
   OR EXISTS(SELECT 1 FROM school_educators se WHERE se.id=c.educator_id AND se.user_id=p_user_id AND se.account_status='active')
   OR EXISTS(SELECT 1 FROM course_enrollments e WHERE e.course_id=c.course_id AND e.educator_id=p_user_id AND e.status='active')
   OR (c.status='Active' AND EXISTS(SELECT 1 FROM users u JOIN organization_members om ON om.user_id=u.id AND om.status='active'
    WHERE u.id=p_user_id AND u.role IN ('educator','school_educator','college_educator') AND (c.school_id IS NULL OR c.school_id=om.organization_id)
    AND (EXISTS(SELECT 1 FROM school_educators se WHERE se.user_id=u.id AND se.school_id=om.organization_id AND se.account_status='active')
     OR EXISTS(SELECT 1 FROM college_lecturers cl WHERE cl.user_id=u.id AND cl."collegeId"=om.organization_id AND cl."accountStatus"='active')
     OR EXISTS(SELECT 1 FROM organization_staff os WHERE os.user_id=u.id AND os.organization_id=om.organization_id AND os.account_status='active'))))
 ));
$$;
REVOKE ALL ON FUNCTION public.can_access_course_ai(uuid,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.can_access_course_ai(uuid,uuid) TO service_role;
COMMIT;

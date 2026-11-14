BEGIN;

-- Reuse the bell's existing table. The reference also prevents duplicate alerts.
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS curriculum_change_id uuid;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS action_url text;
CREATE UNIQUE INDEX IF NOT EXISTS notifications_curriculum_change_recipient_key
  ON public.notifications(curriculum_change_id, recipient_id, type)
  WHERE curriculum_change_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.notify_faculty_curriculum_changes()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE item jsonb; proposal jsonb; course_title text; educator_name text; decision text;
BEGIN
  SELECT course_name INTO course_title FROM public.college_courses WHERE id=NEW.course_id;
  FOR proposal IN SELECT value FROM jsonb_array_elements(coalesce(NEW.pending_changes,'[]')) LOOP
    IF proposal->>'source' IS DISTINCT FROM 'faculty_course'
      OR coalesce(proposal->>'status','pending')<>'pending'
      OR coalesce(proposal->>'change_type','') NOT IN ('unit_add','unit_edit','outcome_add','outcome_edit')
      OR EXISTS(SELECT 1 FROM jsonb_array_elements(coalesce(OLD.pending_changes,'[]')) previous WHERE previous->>'id'=proposal->>'id') THEN CONTINUE; END IF;
    SELECT coalesce(email,'An educator') INTO educator_name FROM public.users WHERE id=(proposal->>'requested_by')::uuid;
    INSERT INTO public.notifications(recipient_id,type,title,message,read,curriculum_change_id,action_url)
      SELECT u.id,'curriculum_change_submitted','Curriculum change awaiting review',
        coalesce(educator_name,'An educator')||' submitted '||CASE WHEN proposal->>'change_type' LIKE '%_add' THEN 'a new ' ELSE 'an edit to a ' END
        ||CASE WHEN proposal->>'change_type' LIKE 'unit_%' THEN 'unit' ELSE 'learning outcome' END
        ||' for '||coalesce(course_title,'a course')||' ('||NEW.academic_year||').',false,(proposal->>'id')::uuid,
        '/college-admin/academics/curriculum?reviewChange='||(proposal->>'id')
      FROM public.users u WHERE u."organizationId"=NEW.college_id AND coalesce(u."isActive",false)
        AND u.role::text = 'college_admin' AND u.id<>(proposal->>'requested_by')::uuid
      ON CONFLICT DO NOTHING;
  END LOOP;
  FOR item IN SELECT value FROM jsonb_array_elements(coalesce(NEW.change_history,'[]')) LOOP
    proposal:=item->'original_change'; decision:=item->>'status';
    IF proposal->>'source' IS DISTINCT FROM 'faculty_course' OR coalesce(decision,'') NOT IN ('approved','rejected')
      OR EXISTS(SELECT 1 FROM jsonb_array_elements(coalesce(OLD.change_history,'[]')) previous WHERE previous->>'id'=item->>'id') THEN CONTINUE; END IF;
    INSERT INTO public.notifications(recipient_id,type,title,message,read,curriculum_change_id,action_url)
      SELECT u.id,'curriculum_change_'||decision,'Curriculum change '||decision,
        'Your '||CASE WHEN proposal->>'change_type' LIKE 'unit_%' THEN 'unit' ELSE 'learning outcome' END
        ||' submission for '||coalesce(course_title,'a course')||' ('||NEW.academic_year||') was '||decision||'.'
        ||CASE WHEN nullif(trim(item->>'review_notes'),'') IS NOT NULL THEN ' Review note: '||(item->>'review_notes') ELSE '' END,
        false,(proposal->>'id')::uuid,
        '/educator/browse-courses?courseId='||NEW.course_id||'&programId='||NEW.program_id||'&reviewChange='||(proposal->>'id')
      FROM public.users u WHERE u.id=(proposal->>'requested_by')::uuid AND u."organizationId"=NEW.college_id AND coalesce(u."isActive",false)
      ON CONFLICT DO NOTHING;
  END LOOP;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.notify_faculty_curriculum_changes() FROM PUBLIC,anon,authenticated;
DROP TRIGGER IF EXISTS notify_faculty_curriculum_changes ON public.college_curriculums;
CREATE TRIGGER notify_faculty_curriculum_changes AFTER UPDATE OF pending_changes,change_history ON public.college_curriculums
  FOR EACH ROW WHEN (OLD.pending_changes IS DISTINCT FROM NEW.pending_changes OR OLD.change_history IS DISTINCT FROM NEW.change_history)
  EXECUTE FUNCTION public.notify_faculty_curriculum_changes();
COMMIT;

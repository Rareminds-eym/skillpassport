-- LOCAL DEMO ONLY. Activate the seven requested college LMS courses.
-- Preserve approval, ownership, plans and all learning content.
BEGIN;
DO $$ BEGIN
 IF (SELECT count(*) FROM public.courses WHERE code IN ('RM-ENG-15','RM-ENG-14','RM-ENG-11','RM-ENG-10','RM-ENG-07','RM-ENG-06','RM-ENG-04'))<>7 THEN RAISE EXCEPTION 'Import all seven RM-ENG courses first'; END IF;
END $$;
UPDATE public.courses SET status='Active',updated_at=now()
WHERE code IN ('RM-ENG-15','RM-ENG-14','RM-ENG-11','RM-ENG-10','RM-ENG-07','RM-ENG-06','RM-ENG-04');
COMMIT;

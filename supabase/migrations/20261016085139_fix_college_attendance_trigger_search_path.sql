-- Fix trigger execution from teaching RPCs with an empty search_path.
-- Preserve existing trigger bindings and attendance calculations.
BEGIN;

CREATE OR REPLACE FUNCTION "public"."update_session_attendance_stats"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET search_path = pg_catalog, public
    AS $$
BEGIN
    -- Update attendance counts for the session
    UPDATE public.college_attendance_sessions 
    SET 
        present_count = (
            SELECT COUNT(*) FROM public.college_attendance_records 
            WHERE session_id = COALESCE(NEW.session_id, OLD.session_id) 
            AND status = 'present'
        ),
        absent_count = (
            SELECT COUNT(*) FROM public.college_attendance_records 
            WHERE session_id = COALESCE(NEW.session_id, OLD.session_id) 
            AND status = 'absent'
        ),
        late_count = (
            SELECT COUNT(*) FROM public.college_attendance_records 
            WHERE session_id = COALESCE(NEW.session_id, OLD.session_id) 
            AND status = 'late'
        ),
        excused_count = (
            SELECT COUNT(*) FROM public.college_attendance_records 
            WHERE session_id = COALESCE(NEW.session_id, OLD.session_id) 
            AND status = 'excused'
        ),
        updated_at = NOW()
    WHERE id = COALESCE(NEW.session_id, OLD.session_id);
    
    -- Calculate attendance percentage using total_learners column
    UPDATE public.college_attendance_sessions 
    SET attendance_percentage = CASE 
        WHEN total_learners > 0 THEN 
            ROUND(((present_count + late_count + excused_count) * 100.0 / total_learners), 2)
        ELSE 0 
    END
    WHERE id = COALESCE(NEW.session_id, OLD.session_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$;

COMMIT;

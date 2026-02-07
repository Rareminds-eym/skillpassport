-- Fix: Update notify_admin_experience to handle DELETE operations properly
-- The trigger fires on DELETE but the function only references NEW, causing silent failures

CREATE OR REPLACE FUNCTION "public"."notify_admin_experience"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    student_record RECORD;
    admin_id UUID;
    submission_name TEXT;
    human_type TEXT;
    notification_message TEXT;
    current_student_id UUID;
    exp_role TEXT;
    exp_organization TEXT;
    exp_title TEXT;
    exp_approval_status TEXT;
BEGIN
    -- Handle DELETE operations - no notification needed, just return
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    END IF;

    -- For INSERT/UPDATE, use NEW record
    current_student_id := NEW.student_id;
    exp_approval_status := NEW.approval_status;
    
    -- Get field values based on table
    IF TG_TABLE_NAME = 'experience' THEN
        exp_role := NEW.role;
        exp_organization := NEW.organization;
    ELSIF TG_TABLE_NAME = 'training' OR TG_TABLE_NAME = 'projects' THEN
        exp_title := NEW.title;
        exp_organization := NEW.organization;
    END IF;

    -- 1️⃣ Get student info
    SELECT id, name, student_type, college_id, school_id
    INTO student_record
    FROM students
    WHERE id = current_student_id;

    IF NOT FOUND THEN
        RAISE NOTICE '❌ Student not found: %', current_student_id;
        RETURN NEW;
    END IF;

    -- 2️⃣ Determine admin_id based on student type
    admin_id := NULL;

    IF student_record.student_type = 'college' THEN
        SELECT org.admin_id INTO admin_id
        FROM organizations org
        WHERE org.id = student_record.college_id
          AND org.admin_id IS NOT NULL
        LIMIT 1;

    ELSIF student_record.student_type IN ('school', 'school-student') THEN
        SELECT org.admin_id INTO admin_id
        FROM organizations org
        WHERE org.id = student_record.school_id
          AND org.admin_id IS NOT NULL
        LIMIT 1;
    END IF;

    IF admin_id IS NULL THEN
        RAISE NOTICE '❌ No admin found for student %', student_record.name;
        RETURN NEW;
    END IF;

    -- 3️⃣ Determine submission type and name
    IF TG_TABLE_NAME = 'experience' THEN
        submission_name := COALESCE(exp_role, 'Unknown Role');
        human_type := 'experience';
    ELSIF TG_TABLE_NAME = 'training' THEN
        submission_name := COALESCE(exp_title, 'Unknown Training');
        human_type := 'training';
    ELSIF TG_TABLE_NAME = 'projects' THEN
        submission_name := COALESCE(exp_title, 'Unknown Project');
        human_type := 'project';
    ELSE
        submission_name := 'Unknown Submission';
        human_type := 'submission';
    END IF;

    -- 4️⃣ Only notify if new or pending submission
    IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND exp_approval_status = 'pending' AND OLD.approval_status IS DISTINCT FROM 'pending') THEN

        IF human_type = 'project' THEN
            notification_message := format(
                'Student %s submitted project "%s"',
                COALESCE(student_record.name, 'Unknown Student'),
                submission_name
            );
        ELSE
            notification_message := format(
                'Student %s submitted %s "%s" at "%s"',
                COALESCE(student_record.name, 'Unknown Student'),
                human_type,
                submission_name,
                COALESCE(exp_organization, 'Unknown Organization')
            );
        END IF;

        INSERT INTO notifications (
            id,
            recipient_id,
            type,
            title,
            message,
            read,
            created_at
        ) VALUES (
            gen_random_uuid(),
            admin_id,
            human_type || '_approval',
            'New ' || human_type || ' Submission',
            notification_message,
            FALSE,
            NOW()
        );

        RAISE NOTICE '✅ Admin notification created for admin %', admin_id;
    END IF;

    RETURN NEW;
END;
$$;

-- Update the trigger to explicitly NOT fire on DELETE
-- This is cleaner than handling DELETE in the function
DROP TRIGGER IF EXISTS experience_admin_notify ON experience;
CREATE TRIGGER experience_admin_notify
    AFTER INSERT OR UPDATE ON experience
    FOR EACH ROW
    EXECUTE FUNCTION notify_admin_experience();

-- Also update the projects trigger (it uses the same function)
DROP TRIGGER IF EXISTS training_admin_notify ON projects;
CREATE TRIGGER training_admin_notify
    AFTER INSERT OR UPDATE ON projects
    FOR EACH ROW
    EXECUTE FUNCTION notify_admin_experience();

-- Log the fix
DO $$
BEGIN
  RAISE NOTICE '✅ Fixed notify_admin_experience to handle DELETE properly';
  RAISE NOTICE '✅ Updated triggers to NOT fire on DELETE operations';
END $$;

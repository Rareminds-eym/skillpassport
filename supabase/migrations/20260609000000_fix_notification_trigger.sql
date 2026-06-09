-- Fix notify_admin_experience trigger to handle missing admin users gracefully
-- This prevents foreign key errors when admin exists in SSO but not in SkillPassport users table

CREATE OR REPLACE FUNCTION "public"."notify_admin_experience"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    learner_record RECORD;
    admin_id UUID;
    submission_name TEXT;
    human_type TEXT;
    notification_message TEXT;
    current_learner_id UUID;
    exp_role TEXT;
    exp_organization TEXT;
    exp_title TEXT;
    exp_approval_status TEXT;
    admin_exists BOOLEAN;
BEGIN
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    END IF;

    current_learner_id := NEW.learner_id;
    exp_approval_status := NEW.approval_status;
    
    IF TG_TABLE_NAME = 'experience' THEN
        exp_role := NEW.role;
        exp_organization := NEW.organization;
    ELSIF TG_TABLE_NAME = 'training' OR TG_TABLE_NAME = 'projects' THEN
        exp_title := NEW.title;
        exp_organization := NEW.organization;
    END IF;

    SELECT id, name, college_id, school_id
    INTO learner_record
    FROM learners
    WHERE id = current_learner_id;

    IF NOT FOUND THEN
        RETURN NEW;
    END IF;

    admin_id := NULL;

    IF learner_record.college_id IS NOT NULL THEN
        SELECT org.admin_id INTO admin_id
        FROM organizations org
        WHERE org.id = learner_record.college_id
          AND org.admin_id IS NOT NULL
        LIMIT 1;
    ELSIF learner_record.school_id IS NOT NULL THEN
        SELECT org.admin_id INTO admin_id
        FROM organizations org
        WHERE org.id = learner_record.school_id
          AND org.admin_id IS NOT NULL
        LIMIT 1;
    END IF;

    IF admin_id IS NULL THEN
        RETURN NEW;
    END IF;

    -- NEW: Check if admin exists in users table before creating notification
    SELECT EXISTS(SELECT 1 FROM users WHERE id = admin_id) INTO admin_exists;
    
    IF NOT admin_exists THEN
        -- Admin doesn't exist in users table (only in SSO), skip notification
        -- This is normal for SSO-managed admins
        RETURN NEW;
    END IF;

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

    IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND exp_approval_status = 'pending' AND OLD.approval_status IS DISTINCT FROM 'pending') THEN
        IF human_type = 'project' THEN
            notification_message := format(
                'Learner %s submitted project "%s"',
                COALESCE(learner_record.name, 'Unknown Learner'),
                submission_name
            );
        ELSE
            notification_message := format(
                'Learner %s submitted %s "%s" at "%s"',
                COALESCE(learner_record.name, 'Unknown Learner'),
                human_type,
                submission_name,
                COALESCE(exp_organization, 'Unknown Organization')
            );
        END IF;

        -- Only insert notification if admin exists in users table
        INSERT INTO notifications (
            id, recipient_id, type, title, message, read, created_at
        ) VALUES (
            gen_random_uuid(), admin_id,
            human_type || '_approval',
            'New ' || human_type || ' Submission',
            notification_message, FALSE, NOW()
        );
    END IF;

    RETURN NEW;
END;
$$;

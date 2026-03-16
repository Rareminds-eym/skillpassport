-- Fix the hardcoded admin ID in notify_training_admin function
-- Dynamically find the rareminds admin instead of using hardcoded IDs

CREATE OR REPLACE FUNCTION public.notify_training_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    admin_id UUID;
    notification_message TEXT;
    human_type TEXT := 'training';
BEGIN
    -- 1️⃣ Determine which admin to notify
    admin_id := NULL;

    IF NEW.approval_authority = 'college_admin' THEN
        SELECT org.admin_id
        INTO admin_id
        FROM organizations org
        JOIN students s ON s.college_id = org.id
        WHERE s.id = NEW.student_id
        LIMIT 1;

    ELSIF NEW.approval_authority = 'school_admin' THEN
        SELECT org.admin_id
        INTO admin_id
        FROM organizations org
        JOIN students s ON s.school_id = org.id
        WHERE s.id = NEW.student_id
        LIMIT 1;

    ELSIF NEW.approval_authority = 'rareminds_admin' THEN
        -- Dynamically find super admin by role in metadata
        SELECT u.id
        INTO admin_id
        FROM auth.users u
        WHERE u.raw_user_meta_data->>'role' = 'super_admin'
        ORDER BY u.created_at ASC
        LIMIT 1;

    ELSE
        RAISE NOTICE '⚠️ Unknown approval_authority: %', NEW.approval_authority;
        RETURN NEW;
    END IF;

    -- 2️⃣ Only notify if admin exists
    IF admin_id IS NOT NULL THEN

        -- 3️⃣ Notify only on insert or when approval_status changes to pending
        IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND NEW.approval_status = 'pending' AND OLD.approval_status IS DISTINCT FROM 'pending') THEN

            notification_message := format(
                'Student submitted training "%s" at "%s"',
                COALESCE(NEW.title, 'Unknown Training'),
                COALESCE(NEW.organization, 'Unknown Organization')
            );

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
                'New Training Submission',
                notification_message,
                FALSE,
                NOW()
            );

            RAISE NOTICE '✅ Admin notification created for %', admin_id;

        END IF;
    ELSE
        RAISE NOTICE '⚠️ No admin found for student %', NEW.student_id;
    END IF;

    RETURN NEW;
END;
$function$;

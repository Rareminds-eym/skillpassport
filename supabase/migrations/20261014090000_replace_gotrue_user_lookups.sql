-- GoTrue no longer populates auth.users. Use the SSO-synced application users
-- for notification recipients, approver emails, and invitation lookups.
-- public.users.role is retained as a display/cross-user lookup shadow; these
-- functions do not use it to authorize requests (Functions verify SSO claims).
-- Existing signatures and grants are preserved by CREATE OR REPLACE.

CREATE OR REPLACE FUNCTION "public"."notify_training_admin"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET search_path TO ''
    AS $$
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
        FROM public.organizations org
        JOIN public.learners s ON s.college_id = org.id
        WHERE s.id = NEW.learner_id
        LIMIT 1;

    ELSIF NEW.approval_authority = 'school_admin' THEN
        SELECT org.admin_id
        INTO admin_id
        FROM public.organizations org
        JOIN public.learners s ON s.school_id = org.id
        WHERE s.id = NEW.learner_id
        LIMIT 1;

    ELSIF NEW.approval_authority = 'rareminds_admin' THEN
        -- Resolve notification recipients from the SSO-synced user shadow.
        SELECT u.id
        INTO admin_id
        FROM public.users u
        WHERE u.role = 'super_admin' AND u."isActive" IS TRUE
        ORDER BY u."createdAt" ASC, u.id
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
                'Learner submitted training "%s" at "%s"',
                COALESCE(NEW.title, 'Unknown Training'),
                COALESCE(NEW.organization, 'Unknown Organization')
            );

            INSERT INTO public.notifications (
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
        RAISE NOTICE '⚠️ No admin found for learner %', NEW.learner_id;
    END IF;

    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION "public"."get_learner_trainings_with_approvers"("learner_email" "text") RETURNS TABLE("id" "uuid", "title" character varying, "organization" character varying, "approval_status" character varying, "approval_authority" character varying, "approved_by_email" "text", "approved_at" timestamp with time zone, "rejected_by_email" "text", "rejected_at" timestamp with time zone, "approval_notes" "text", "approver_type" "text", "created_at" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET search_path TO ''
    AS $$
BEGIN
    RETURN QUERY
    SELECT
        t.id,
        t.title,
        t.organization,
        t.approval_status,
        t.approval_authority,
        approver.email as approved_by_email,
        t.approved_at,
        rejector.email as rejected_by_email,
        t.rejected_at,
        t.approval_notes,
        CASE
            WHEN t.approval_authority = 'school_admin' THEN 'School Admin'
            ELSE 'Rareminds Admin'
        END as approver_type,
        t.created_at
    FROM public.trainings t
    JOIN public.learners s ON t.learner_id = s.id
    LEFT JOIN public.users approver ON t.approved_by = approver.id
    LEFT JOIN public.users rejector ON t.rejected_by = rejector.id
    WHERE s.email = learner_email
    ORDER BY t.created_at DESC;
END;
$$;

CREATE OR REPLACE FUNCTION "public"."get_training_with_approver_details"("training_id" "uuid") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET search_path TO ''
    AS $$
DECLARE
    result json;
BEGIN
    SELECT json_build_object(
        'training', json_build_object(
            'id', t.id,
            'title', t.title,
            'organization', t.organization,
            'learner_name', s.name,
            'learner_email', s.email,
            'school_name', o.name,
            'approval_status', t.approval_status,
            'approval_authority', t.approval_authority,
            'created_at', t.created_at,
            'updated_at', t.updated_at
        ),
        'approval_details', CASE
            WHEN t.approval_status = 'approved' THEN json_build_object(
                'approved_by_id', t.approved_by,
                'approved_by_email', approver.email,
                'approved_at', t.approved_at,
                'approval_notes', t.approval_notes,
                'approver_type', CASE
                    WHEN t.approval_authority = 'school_admin' THEN 'School Admin'
                    ELSE 'Rareminds Admin'
                END
            )
            WHEN t.approval_status = 'rejected' THEN json_build_object(
                'rejected_by_id', t.rejected_by,
                'rejected_by_email', rejector.email,
                'rejected_at', t.rejected_at,
                'rejection_notes', t.approval_notes,
                'rejector_type', CASE
                    WHEN t.approval_authority = 'school_admin' THEN 'School Admin'
                    ELSE 'Rareminds Admin'
                END
            )
            ELSE json_build_object(
                'status', 'pending',
                'pending_with', CASE
                    WHEN t.approval_authority = 'school_admin' THEN 'School Admin'
                    ELSE 'Rareminds Admin'
                END
            )
        END
    ) INTO result
    FROM public.trainings t
    JOIN public.learners s ON t.learner_id = s.id
    LEFT JOIN public.organizations o ON s.school_id = o.id
    LEFT JOIN public.users approver ON t.approved_by = approver.id
    LEFT JOIN public.users rejector ON t.rejected_by = rejector.id
    WHERE t.id = training_id;

    RETURN COALESCE(result, json_build_object('error', 'Training not found'));
END;
$$;

CREATE OR REPLACE FUNCTION "public"."get_user_email"("user_id" "uuid") RETURNS "text"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET search_path TO ''
    AS $$
  SELECT email FROM public.users WHERE id = user_id;
$$;

CREATE OR REPLACE FUNCTION public.check_user_exists(user_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  user_count INTEGER;
BEGIN
  -- The SSO sync owns the application user shadow.
  SELECT COUNT(*)
  INTO user_count
  FROM public.users
  WHERE email = user_email;

  RETURN user_count > 0;
END;
$$;

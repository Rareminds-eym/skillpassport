-- Test the approval tracking system

-- 1. Check current trainings and their approval status
SELECT 
    id,
    title,
    organization,
    approval_status,
    approval_authority,
    approved_by,
    approved_at,
    rejected_by,
    rejected_at,
    approval_notes
FROM public.trainings
ORDER BY created_at DESC
LIMIT 5;

-- 2. Example: Approve a training (replace with actual training_id and user_id)
-- SELECT approve_training(
--     'TRAINING_ID_HERE'::uuid,
--     'USER_ID_HERE'::uuid,
--     'Training content verified and approved'
-- );

-- 3. Example: Reject a training (replace with actual training_id and user_id)
-- SELECT reject_training(
--     'TRAINING_ID_HERE'::uuid,
--     'USER_ID_HERE'::uuid,
--     'Insufficient evidence provided'
-- );

-- 4. Get training details with approver info
-- SELECT get_training_with_approver_details('TRAINING_ID_HERE'::uuid);

-- 5. Get all trainings for a student with approver details
-- SELECT * FROM get_student_trainings_with_approvers('student@example.com');

-- 6. Check pending trainings for school admin
-- SELECT * FROM get_pending_school_trainings('SCHOOL_ID_HERE'::uuid);

-- 7. Check pending trainings for Rareminds admin
-- SELECT * FROM get_pending_rareminds_trainings();
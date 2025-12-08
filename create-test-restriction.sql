-- Quick Test: Create a Completed Assessment to See Restriction Screen
-- Run this in Supabase SQL Editor to test the 6-month restriction UI

-- STEP 1: Get your student user_id
-- Replace 'your-email@example.com' with your actual email
DO $$
DECLARE
    v_user_id uuid;
    v_attempt_id uuid;
    v_three_months_ago timestamp;
BEGIN
    -- Get user ID from auth.users (replace with your email)
    SELECT id INTO v_user_id
    FROM auth.users
    WHERE email = 'your-email@example.com'  -- CHANGE THIS!
    LIMIT 1;

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User not found. Please update the email in the script.';
    END IF;

    -- Calculate 3 months ago
    v_three_months_ago := NOW() - INTERVAL '3 months';

    -- Create a test attempt
    INSERT INTO personal_assessment_attempts (
        student_id,
        stream_id,
        status,
        started_at,
        completed_at,
        created_at
    ) VALUES (
        v_user_id,
        'cs',
        'completed',
        v_three_months_ago,
        v_three_months_ago,
        v_three_months_ago
    ) RETURNING id INTO v_attempt_id;

    -- Create a test result
    INSERT INTO personal_assessment_results (
        attempt_id,
        student_id,
        stream_id,
        status,
        created_at,
        riasec_scores,
        riasec_code,
        overall_summary,
        gemini_results
    ) VALUES (
        v_attempt_id,
        v_user_id,
        'cs',
        'completed',
        v_three_months_ago,
        '{"R": 5, "I": 4, "A": 3, "S": 2, "E": 1, "C": 1}'::jsonb,
        'RIA',
        'Test assessment for UI testing',
        '{
            "riasec": {"code": "RIA", "scores": {"R": 5, "I": 4, "A": 3, "S": 2, "E": 1, "C": 1}},
            "bigFive": {"O": 4, "C": 3, "E": 3, "A": 4, "N": 2},
            "workValues": {"scores": {}},
            "employability": {"overallReadiness": "developing"},
            "aptitude": {"overallScore": 70},
            "knowledge": {"score": 75},
            "careerFit": {"clusters": []},
            "skillGap": {"priorityA": []},
            "roadmap": {"projects": []},
            "overallSummary": "Test assessment"
        }'::jsonb
    );

    -- Show success message
    RAISE NOTICE 'Test data created successfully!';
    RAISE NOTICE 'Assessment Date: %', v_three_months_ago;
    RAISE NOTICE 'Next Available: %', v_three_months_ago + INTERVAL '6 months';
    RAISE NOTICE 'Now refresh /student/assessment/test to see the restriction screen';
END $$;

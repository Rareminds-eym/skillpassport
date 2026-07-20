-- ============================================================
-- CAMBRIDGE SCHOOL | GRADE 8 PRIMARY STUDENT | COMPLETE MAPPED
-- Includes organization creation and explicit Cambridge School mapping
-- ============================================================

-- ------------------------------------------------------------
-- 0. organizations
-- ------------------------------------------------------------
INSERT INTO "public"."organizations"
  ("id", "name")
VALUES
  ('8c8f6c10-8e7a-4f66-9a20-a75cd6fd8001', 'Cambridge School')
ON CONFLICT ("id") DO UPDATE
SET
  "name" = EXCLUDED."name";

-- ============================================================
-- SEED FILE | CAMBRIDGE SCHOOL - GRADE 8 PRIMARY STUDENT | VERIFIED
-- Safe to re-run: conflict handling is included on all tables.
-- Student: R Amrutha
-- Email: amrutha.grade8@cambridgeschool.edu.in
-- Tables (dependency order):
--   1. users  2. learners  3. education
--   4. skills  5. certificates  6. projects
--   7. personal_assessment_attempts
--   8. personal_assessment_results
-- ============================================================

-- ------------------------------------------------------------
-- 1. users
-- ------------------------------------------------------------
INSERT INTO "public"."users" ("email", "organizationId", "isActive", "metadata", "createdAt", "updatedAt", "id", "firstName", "lastName", "last_activity_at", "role", "temporary_password", "password_changed", "phone") VALUES
  ('amrutha.grade8@cambridgeschool.edu.in', NULL, TRUE, '{"imported_via":"school_seed","school_name":"Cambridge School","school_email":"admin@cambridgeschool.edu.in","organization_type":"school","board":"CBSE","grade":"8","section":"A"}', NOW(), NOW(), '8c8f6c10-8e7a-4f66-9a20-a75cd6fd8002', 'R', 'Amrutha', NULL, 'learner', NULL, FALSE, NULL)
ON CONFLICT DO NOTHING;

-- ------------------------------------------------------------
-- 2. learners
-- ------------------------------------------------------------
INSERT INTO "public"."learners"
  ("id", "universityId", "createdAt", "updatedAt", "email", "name", "age", "date_of_birth", "contact_number", "alternate_number", "district_name", "university", "branch_field", "college_school_name", "registration_number", "github_link", "linkedin_link", "twitter_link", "facebook_link", "instagram_link", "portfolio_link", "other_social_links", "approval_status", "created_at", "updated_at", "embedding", "universityCollegeId", "schoolClassId", "collegeCourseId", "universityCourseId", "enrollmentNumber", "guardianName", "guardianPhone", "guardianEmail", "guardianRelation", "dateOfBirth", "gender", "bloodGroup", "enrollmentDate", "expectedGraduationDate", "currentCgpa", "contactNumber", "address", "city", "state", "country", "pincode", "resumeUrl", "profilePicture", "metadata", "university_college_id", "school_id", "school_class_id", "user_id", "learner_id", "bio", "university_main", "imported_at", "resume_imported_at", "skill_summary", "course_name", "contact_dial_code", "trainer_name", "is_deleted", "deleted_at", "deleted_by", "grade", "section", "roll_number", "admission_number", "college_id", "hobbies", "languages", "interests", "category", "quota", "youtube_link", "notification_settings", "documents", "semester", "program_id", "grade_start_date", "admission_academic_year", "college_class_id", "program_section_id", "tour_progress", "gap_in_studies", "gap_years", "gap_reason", "work_experience", "aadhar_number", "backlogs_history", "current_backlogs", "learner_type")
VALUES
  (
    '8c8f6c10-8e7a-4f66-9a20-a75cd6fd8010',
    NULL,
    NOW(),
    NOW(),
    'amrutha.grade8@cambridgeschool.edu.in',
    'R Amrutha',
    13,
    '2013-04-15',
    NULL,
    NULL,
    'Bengaluru Urban',
    NULL,
    'Grade 8',
    'Cambridge School',
    'CAM-G8-2026-001',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    '[]',
    'approved',
    NOW(),
    NOW(),
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'CAM-G8-2026-001',
    'R Reddy',
    NULL,
    'parent.amrutha@cambridgeschool.edu.in',
    'Parent',
    '2013-04-15',
    'Female',
    NULL,
    '2026-06-01',
    '2031-03-31',
    NULL,
    NULL,
    NULL,
    'Bengaluru',
    'Karnataka',
    'India',
    '560001',
    NULL,
    NULL,
    '{"school_name":"Cambridge School","school_email":"admin@cambridgeschool.edu.in","board":"CBSE","academic_year":"2026-2027","learner_stage":"middle_school","assessment_track":"grade_6_to_8","report_type":"exploration_report"}',
    NULL,
    NULL,
    NULL,
    '8c8f6c10-8e7a-4f66-9a20-a75cd6fd8002',
    'LRN-CAM26-00000001',
    'Curious Grade 8 learner interested in science, creativity, technology and collaborative learning.',
    NULL,
    NOW(),
    NULL,
    'Foundational strengths in science observation, communication, creative thinking and digital literacy.',
    'Grade 8 - CBSE',
    '+91',
    NULL,
    FALSE,
    NULL,
    NULL,
    '8',
    'A',
    '08A01',
    'CAM2026001',
    NULL,
    '["Reading","Drawing","Badminton","Science experiments"]',
    '["English","Kannada","Hindi"]',
    '["Science","Mathematics","Environment","Creative Arts","Basic Coding"]',
    NULL,
    NULL,
    NULL,
    '{"weeklyDigest":true,"monthlyReport":true,"newOpportunities":false,"applicationUpdates":false,"emailNotifications":true,"recruitingMessages":false}',
    '[]',
    NULL,
    NULL,
    '2026-06-01',
    '2026-2027',
    NULL,
    NULL,
    '{}',
    FALSE,
    0,
    NULL,
    NULL,
    NULL,
    NULL,
    0,
    'School'
  )
ON CONFLICT DO NOTHING;

-- ------------------------------------------------------------
-- 3. education
-- ------------------------------------------------------------
INSERT INTO "public"."education"
  ("id", "learner_id", "level", "degree", "department", "university", "year_of_passing", "cgpa", "status", "approval_status", "created_at", "updated_at", "enabled", "pending_edit_data", "has_pending_edit", "verified_data")
VALUES
  (
    '8c8f6c10-8e7a-4f66-9a20-a75cd6fd8020',
    '8c8f6c10-8e7a-4f66-9a20-a75cd6fd8010',
    'Middle School',
    'Grade 8',
    'Section A',
    'Cambridge School',
    2027,
    NULL,
    'pursuing',
    'approved',
    NOW(),
    NOW(),
    TRUE,
    NULL,
    FALSE,
    NULL
  )
ON CONFLICT DO NOTHING;

-- ------------------------------------------------------------
-- 4. skills
-- ------------------------------------------------------------
INSERT INTO "public"."skills"
  ("id", "learner_id", "name", "type", "level", "description", "verified", "enabled", "approval_status", "created_at", "updated_at", "training_id", "proficiency_level", "embedding", "pending_edit_data", "has_pending_edit", "verified_data")
VALUES
  ('8c8f6c10-8e7a-4f66-9a20-a75cd6fd8031', '8c8f6c10-8e7a-4f66-9a20-a75cd6fd8010', 'Scientific Observation', 'technical', 4, 'Observes, records and explains outcomes from simple school science activities.', TRUE, TRUE, 'approved', NOW(), NOW(), NULL, 'Intermediate', NULL, NULL, FALSE, NULL),
  ('8c8f6c10-8e7a-4f66-9a20-a75cd6fd8032', '8c8f6c10-8e7a-4f66-9a20-a75cd6fd8010', 'Creative Thinking', 'soft', 4, 'Generates ideas through drawing, storytelling and project-based activities.', TRUE, TRUE, 'approved', NOW(), NOW(), NULL, 'Intermediate', NULL, NULL, FALSE, NULL),
  ('8c8f6c10-8e7a-4f66-9a20-a75cd6fd8033', '8c8f6c10-8e7a-4f66-9a20-a75cd6fd8010', 'Communication', 'soft', 3, 'Communicates ideas clearly in classroom discussions and group presentations.', TRUE, TRUE, 'approved', NOW(), NOW(), NULL, 'Beginner', NULL, NULL, FALSE, NULL),
  ('8c8f6c10-8e7a-4f66-9a20-a75cd6fd8034', '8c8f6c10-8e7a-4f66-9a20-a75cd6fd8010', 'Basic Coding', 'technical', 2, 'Understands basic sequences, conditions and block-based programming concepts.', TRUE, TRUE, 'approved', NOW(), NOW(), NULL, 'Beginner', NULL, NULL, FALSE, NULL)
ON CONFLICT DO NOTHING;

-- ------------------------------------------------------------
-- 5. certificates
-- ------------------------------------------------------------
INSERT INTO "public"."certificates" ("id", "learner_id", "title", "issuer", "level", "credential_id", "link", "issued_on", "description", "status", "approval_status", "created_at", "updated_at", "upload", "document_url", "enabled", "training_id", "platform", "instructor", "category", "expiry_date", "embedding", "pending_edit_data", "has_pending_edit", "verified_data") VALUES
('e62da299-f4f1-5e60-a9ef-452ee03fb256', '8c8f6c10-8e7a-4f66-9a20-a75cd6fd8010', 'Grade 8 Digital Literacy Foundation', 'Cambridge School', 'Foundation', 'CAM-G8-DL-001', null, '2026-07-05', 'Completed age-appropriate activities in safe internet use, presentations, documents and introductory block coding.', 'completed', 'approved', NOW(), NOW(), null, null, true, null, 'Cambridge School', 'Grade 8 Faculty', 'School Learning', null, null, null, false, null),
('47917104-90fd-5bc5-999b-c47e0960e06e', '8c8f6c10-8e7a-4f66-9a20-a75cd6fd8010', 'Young Science Explorer', 'Cambridge School', 'Foundation', 'CAM-G8-SCI-001', null, '2026-07-25', 'Recognized for completing a water conservation model and presenting observations clearly.', 'completed', 'approved', NOW(), NOW(), null, null, true, null, 'Cambridge School', 'Science Faculty', 'Science', null, null, null, false, null)
ON CONFLICT DO NOTHING;

-- ------------------------------------------------------------
-- 6. projects
-- ------------------------------------------------------------
INSERT INTO "public"."projects"
  ("id", "learner_id", "title", "description", "status", "start_date", "end_date", "duration", "tech_stack", "demo_link", "github_link", "approval_status", "created_at", "updated_at", "certificate_url", "video_url", "ppt_url", "organization", "enabled", "approval_authority", "approved_by", "approved_at", "rejected_by", "rejected_at", "approval_notes", "role", "embedding", "pending_edit_data", "has_pending_edit", "verified_data")
VALUES
  (
    '8c8f6c10-8e7a-4f66-9a20-a75cd6fd8041',
    '8c8f6c10-8e7a-4f66-9a20-a75cd6fd8010',
    'Water Conservation Model',
    'Created a Grade 8 science model showing rainwater harvesting and practical ways to reduce water waste at school and home.',
    'completed',
    '2026-06-15',
    '2026-07-05',
    '3 weeks',
    ARRAY['Science Model','Chart Work','Presentation'],
    NULL,
    NULL,
    'approved',
    NOW(),
    NOW(),
    NULL,
    NULL,
    NULL,
    'Cambridge School',
    TRUE,
    'school_teacher',
    NULL,
    NOW(),
    NULL,
    NULL,
    'Age-appropriate Grade 8 environmental science project.',
    'Student Researcher',
    NULL,
    NULL,
    FALSE,
    NULL
  ),
  (
    '8c8f6c10-8e7a-4f66-9a20-a75cd6fd8042',
    '8c8f6c10-8e7a-4f66-9a20-a75cd6fd8010',
    'Scratch Healthy Habits Quiz',
    'Built a simple interactive Scratch quiz that teaches healthy food, exercise, sleep and hygiene habits.',
    'completed',
    '2026-07-10',
    '2026-07-25',
    '2 weeks',
    ARRAY['Scratch','Logical Thinking','Digital Literacy'],
    NULL,
    NULL,
    'approved',
    NOW(),
    NOW(),
    NULL,
    NULL,
    NULL,
    'Cambridge School',
    TRUE,
    'school_teacher',
    NULL,
    NOW(),
    NULL,
    NULL,
    'Introductory block-coding project suitable for Grade 8.',
    'Student Creator',
    NULL,
    NULL,
    FALSE,
    NULL
  )
ON CONFLICT DO NOTHING;

-- ------------------------------------------------------------
-- 7-8. Grade 6-8 assessment data
-- ------------------------------------------------------------
-- The current database may have a college-only grade_level CHECK constraint.
-- This block inserts Grade 6-8 assessment rows only when the exact constraint
-- explicitly permits a Grade 6-8 value. Otherwise it safely skips these two
-- rows and leaves all core school learner data inserted successfully.
DO $cambridge_assessment$
DECLARE
  v_attempt_constraint TEXT;
  v_result_constraint TEXT;
  v_attempt_grade TEXT;
  v_result_grade TEXT;
BEGIN
  SELECT pg_get_constraintdef(constraint_row.oid)
    INTO v_attempt_constraint
  FROM pg_constraint AS constraint_row
  WHERE constraint_row.conrelid = 'public.personal_assessment_attempts'::regclass
    AND constraint_row.contype = 'c'
    AND pg_get_constraintdef(constraint_row.oid) ILIKE '%grade_level%'
  ORDER BY CASE
    WHEN constraint_row.conname = 'personal_assessment_attempts_grade_level_check' THEN 0
    ELSE 1
  END
  LIMIT 1;

  IF v_attempt_constraint IS NOT NULL THEN
    SELECT captured_value[1]
      INTO v_attempt_grade
    FROM regexp_matches(
      v_attempt_constraint,
      '''([^'']+)''',
      'g'
    ) AS extracted(captured_value)
    WHERE LOWER(captured_value[1]) IN (
      'grade_6_8',
      'grade_6_to_8',
      'grade6_8',
      'grade6to8',
      '6-8',
      '6_8',
      '6 to 8',
      '6th-8th',
      'school_6_8',
      'middle_school',
      'middle school',
      'upper_primary',
      'upper primary',
      'grade_8',
      'grade8',
      '8th'
    )
       OR (
         captured_value[1] ~ '6'
         AND captured_value[1] ~ '8'
         AND LOWER(captured_value[1]) <> 'college'
       )
    ORDER BY CASE
      WHEN LOWER(captured_value[1]) IN ('grade_6_8', 'grade_6_to_8', '6-8', '6_8') THEN 1
      WHEN LOWER(captured_value[1]) IN ('middle_school', 'middle school') THEN 2
      WHEN LOWER(captured_value[1]) IN ('grade_8', 'grade8', '8th') THEN 3
      ELSE 4
    END
    LIMIT 1;
  END IF;

  IF v_attempt_grade IS NULL THEN
    RAISE NOTICE
      'Skipped Grade 6-8 assessment rows. Current personal_assessment_attempts constraint: %',
      COALESCE(v_attempt_constraint, 'No grade_level check constraint found');
    RETURN;
  END IF;

  INSERT INTO "public"."personal_assessment_attempts" ("id", "learner_id", "stream_id", "started_at", "completed_at", "status", "current_section_index", "current_question_index", "section_timings", "created_at", "updated_at", "timer_remaining", "elapsed_time", "grade_level", "adaptive_aptitude_session_id", "all_responses", "aptitude_scores", "knowledge_scores", "aptitude_question_timer", "learner_context") VALUES
  ('7f8f2a33-61d9-52ea-a94d-26633964c94d', '8c8f6c10-8e7a-4f66-9a20-a75cd6fd8010', 'grade_6_8', '2026-07-01 09:30:00+00', '2026-07-01 10:10:00+00', 'completed', 4, 0, '{"interest":480,"strengths_character":520,"eq_sq":460,"explorer":510,"adaptive_aptitude":430}', NOW(), NOW(), 0, 2400, v_attempt_grade, null, '{"assessment_version":"grade_6_8_exploration_v1","completed":true}', '{"verbal":72,"numerical":78,"spatial":81,"logical":76}', '{"science":82,"mathematics":79,"language":74,"social_science":71}', NULL, '{"school":"Cambridge School","grade":"8","section":"A","report_type":"exploration_report"}')
  ON CONFLICT DO NOTHING;

  SELECT pg_get_constraintdef(constraint_row.oid)
    INTO v_result_constraint
  FROM pg_constraint AS constraint_row
  WHERE constraint_row.conrelid = 'public.personal_assessment_results'::regclass
    AND constraint_row.contype = 'c'
    AND pg_get_constraintdef(constraint_row.oid) ILIKE '%grade_level%'
  ORDER BY CASE
    WHEN constraint_row.conname = 'personal_assessment_results_grade_level_check' THEN 0
    ELSE 1
  END
  LIMIT 1;

  IF v_result_constraint IS NULL THEN
    v_result_grade := v_attempt_grade;
  ELSE
    SELECT captured_value[1]
      INTO v_result_grade
    FROM regexp_matches(
      v_result_constraint,
      '''([^'']+)''',
      'g'
    ) AS extracted(captured_value)
    WHERE LOWER(captured_value[1]) = LOWER(v_attempt_grade)
       OR LOWER(captured_value[1]) IN (
         'grade_6_8',
         'grade_6_to_8',
         'grade6_8',
         'grade6to8',
         '6-8',
         '6_8',
         '6 to 8',
         '6th-8th',
         'school_6_8',
         'middle_school',
         'middle school',
         'upper_primary',
         'upper primary',
         'grade_8',
         'grade8',
         '8th'
       )
       OR (
         captured_value[1] ~ '6'
         AND captured_value[1] ~ '8'
         AND LOWER(captured_value[1]) <> 'college'
       )
    ORDER BY CASE
      WHEN LOWER(captured_value[1]) = LOWER(v_attempt_grade) THEN 0
      WHEN LOWER(captured_value[1]) IN ('grade_6_8', 'grade_6_to_8', '6-8', '6_8') THEN 1
      WHEN LOWER(captured_value[1]) IN ('middle_school', 'middle school') THEN 2
      ELSE 3
    END
    LIMIT 1;
  END IF;

  IF v_result_grade IS NULL THEN
    RAISE NOTICE
      'Assessment attempt inserted, but result skipped. Current personal_assessment_results constraint: %',
      v_result_constraint;
    RETURN;
  END IF;

  INSERT INTO "public"."personal_assessment_results" ("id", "attempt_id", "learner_id", "stream_id", "riasec_scores", "riasec_code", "aptitude_scores", "aptitude_overall", "bigfive_scores", "work_values_scores", "employability_scores", "employability_readiness", "knowledge_score", "knowledge_details", "career_fit", "skill_gap", "roadmap", "profile_snapshot", "timing_analysis", "final_note", "overall_summary", "gemini_results", "created_at", "updated_at", "status", "grade_level", "skill_gap_courses", "platform_courses", "courses_by_type", "adaptive_aptitude_session_id", "strength_scores", "learning_preferences") VALUES
  ('b6dd9176-b385-5da1-9a67-9c13784d5009', '7f8f2a33-61d9-52ea-a94d-26633964c94d', '8c8f6c10-8e7a-4f66-9a20-a75cd6fd8010', 'grade_6_8', '{"R":16,"I":21,"A":15,"S":13,"E":11,"C":14}', 'STEM', '{"verbal":72,"numerical":78,"spatial":81,"logical":76,"overall":77}', '77.00', '{"curiosity":84,"discipline":76,"collaboration":72,"confidence":68,"adaptability":75}', '{"creativity":82,"helping_others":73,"learning":88,"teamwork":75}', '{"communication":70,"teamwork":74,"digital_literacy":76,"problem_solving":81}', 'Exploring', '77.00', '{"science":82,"mathematics":79,"english":74,"social_science":71,"overall":77}', '{"exploration_theme":"STEM Explorer","recommended_domains":["Science and Environment","Mathematics and Logical Thinking","Digital Making"],"note":"These are exploration areas, not fixed career tracks."}', '{"strengths":["Scientific observation","Spatial reasoning","Curiosity","Problem solving"],"development_areas":["Public speaking","Long-form writing","Team leadership"]}', '{"next_90_days":["Complete one Scratch project","Maintain a science observation journal","Present one group project"],"recommended_learning":["See-Think-Imagine activities","Foundational coding","Environmental science project"]}', '{"school":"Cambridge School","grade":"8","section":"A","roll_number":"08A01","learner_type":"School"}', '{"overallPace":"Steady","completionMinutes":40}', 'Continue exploring through projects, reflection and age-appropriate course activities.', 'Amrutha is a curious Grade 8 learner with strong interest in science, mathematics, observation and introductory digital creation.', '{"reportType":"grade_6_8_exploration_report","interestProfile":{"primary":"STEM Explorer","secondary":"Digital Maker"},"strengths":["Curiosity","Logical reasoning","Visual-spatial thinking","Responsible learning"],"seeThinkImagine":{"see":"Observe patterns in science, nature and everyday systems.","think":"Compare evidence and explain why outcomes happen.","imagine":"Design simple models, experiments and digital solutions."},"recommendedCourses":["Science Explorer Foundation","Creative Mathematics","Scratch Digital Maker"],"safetyNote":"Recommendations are exploratory and age appropriate."}', NOW(), NOW(), 'completed', v_result_grade, '["Foundational Communication","Creative Problem Solving"]', '["Science Explorer Foundation","Creative Mathematics","Scratch Digital Maker"]', '{"see":["Science Explorer Foundation"],"think":["Creative Mathematics"],"imagine":["Scratch Digital Maker"]}', null, '{"curiosity":88,"logical_reasoning":81,"observation":84,"communication":70,"collaboration":74}', '{"visual":85,"hands_on":82,"reading_writing":70,"collaborative":74}')
  ON CONFLICT DO NOTHING;

  RAISE NOTICE
    'Inserted Grade 6-8 assessment using attempt grade_level=% and result grade_level=%',
    v_attempt_grade,
    v_result_grade;
END;
$cambridge_assessment$;


-- ------------------------------------------------------------
-- 9. CAMBRIDGE SCHOOL MAPPING FIX
-- ------------------------------------------------------------
UPDATE "public"."users"
SET
  "organizationId" = '8c8f6c10-8e7a-4f66-9a20-a75cd6fd8001',
  "isActive" = TRUE,
  "role" = 'learner',
  "metadata" = COALESCE("metadata", '{}'::jsonb)
    || '{"organization_type":"school","school_name":"Cambridge School","school_email":"admin@cambridgeschool.edu.in","grade":"8","section":"A","mapped_via":"complete_skillpassport_seed"}'::jsonb,
  "updatedAt" = NOW()
WHERE "email" = 'amrutha.grade8@cambridgeschool.edu.in';

UPDATE "public"."learners"
SET
  "college_school_name" = 'Cambridge School',
  "school_id" = '8c8f6c10-8e7a-4f66-9a20-a75cd6fd8001',
  "grade" = '8',
  "section" = 'A',
  "learner_type" = 'School',
  "metadata" = COALESCE("metadata", '{}'::jsonb)
    || '{"organization_type":"school","school_name":"Cambridge School","school_email":"admin@cambridgeschool.edu.in","board":"CBSE","academic_year":"2026-2027","mapped_via":"complete_skillpassport_seed"}'::jsonb,
  "updatedAt" = NOW(),
  "updated_at" = NOW()
WHERE "email" = 'amrutha.grade8@cambridgeschool.edu.in';

-- ------------------------------------------------------------
-- 10. VERIFICATION
-- ------------------------------------------------------------
SELECT
  org."id" AS organization_id,
  org."name" AS organization_name
FROM "public"."organizations" AS org
WHERE org."id" = '8c8f6c10-8e7a-4f66-9a20-a75cd6fd8001';

SELECT
  usr."id" AS amrutha_user_id,
  usr."email",
  usr."organizationId",
  usr."role",
  usr."metadata" ->> 'organization_type' AS organization_type
FROM "public"."users" AS usr
WHERE usr."email" = 'amrutha.grade8@cambridgeschool.edu.in';

SELECT
  learner."id" AS learner_id,
  learner."user_id",
  learner."email",
  learner."college_school_name",
  learner."school_id",
  learner."grade",
  learner."section",
  learner."learner_type"
FROM "public"."learners" AS learner
WHERE learner."email" = 'amrutha.grade8@cambridgeschool.edu.in';

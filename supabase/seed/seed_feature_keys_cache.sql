-- Seeds feature_keys_cache with the complete admin-dashboard feature catalog
-- for local development. This table is normally synced from the SSO worker's
-- public.feature_keys via sync-shadow.ts / reconcile cron, but in local dev
-- the sync may not have run yet, causing 503 "Unable to verify organization
-- feature access" on every admin API call.
--
-- Source of truth: sso-worker/supabase/migrations/20260925020000_seed_feature_keys.sql
-- Mirror: skillpassport/supabase/migrations/20260925050000_create_feature_keys_cache.sql
--
-- Idempotent: uses ON CONFLICT (id) DO UPDATE. Deterministic UUIDs are derived
-- from uuid_generate_v5 (name-based UUID) so re-runs produce the same ids.
--
-- Date: 2026-09-25

-- Ensure uuid-ossp is available (Supabase has it pre-installed).
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

INSERT INTO public.feature_keys_cache
  (id, product_id, product_code, key, role, nav_group, nav_label, nav_path, display_order, is_active, synced_at)
VALUES
  -- ══════════════════════════════════════════════════════════════════════
  -- college_admin — Learners
  -- ══════════════════════════════════════════════════════════════════════
  (uuid_generate_v5(uuid_ns_url(), 'skillpassport:college_admin:admissions_data'),
    NULL, 'skillpassport', 'admissions_data', 'college_admin',
    'Learners', 'Admissions & Data', '/college-admin/learners/data-management', 10, true, now()),

  (uuid_generate_v5(uuid_ns_url(), 'skillpassport:college_admin:enrolled_learners'),
    NULL, 'skillpassport', 'enrolled_learners', 'college_admin',
    'Learners', 'Enrolled Learners', '/college-admin/learners/enrolled', 20, true, now()),

  (uuid_generate_v5(uuid_ns_url(), 'skillpassport:college_admin:learner_attendance'),
    NULL, 'skillpassport', 'learner_attendance', 'college_admin',
    'Learners', 'Attendance', '/college-admin/learners/attendance', 30, true, now()),

  (uuid_generate_v5(uuid_ns_url(), 'skillpassport:college_admin:assessment_results'),
    NULL, 'skillpassport', 'assessment_results', 'college_admin',
    'Learners', 'Assessment Results', '/college-admin/learners/assessment-results', 40, true, now()),

  (uuid_generate_v5(uuid_ns_url(), 'skillpassport:college_admin:digital_portfolio'),
    NULL, 'skillpassport', 'digital_portfolio', 'college_admin',
    'Learners', 'Digital Portfolio', '/college-admin/learners/digital-portfolio', 50, true, now()),

  (uuid_generate_v5(uuid_ns_url(), 'skillpassport:college_admin:learner_verifications'),
    NULL, 'skillpassport', 'learner_verifications', 'college_admin',
    'Learners', 'Verifications', '/college-admin/learners/verifications', 60, true, now()),

  (uuid_generate_v5(uuid_ns_url(), 'skillpassport:college_admin:learner_communication'),
    NULL, 'skillpassport', 'learner_communication', 'college_admin',
    'Learners', 'Communication', '/college-admin/learners/communication', 70, true, now()),

  -- ══════════════════════════════════════════════════════════════════════
  -- college_admin — Departments & Faculty
  -- ══════════════════════════════════════════════════════════════════════
  (uuid_generate_v5(uuid_ns_url(), 'skillpassport:college_admin:departments'),
    NULL, 'skillpassport', 'departments', 'college_admin',
    'Departments & Faculty', 'Departments', '/college-admin/departments/management', 80, true, now()),

  (uuid_generate_v5(uuid_ns_url(), 'skillpassport:college_admin:faculty'),
    NULL, 'skillpassport', 'faculty', 'college_admin',
    'Departments & Faculty', 'Faculty', '/college-admin/departments/educators', 90, true, now()),

  -- ══════════════════════════════════════════════════════════════════════
  -- college_admin — Academics
  -- ══════════════════════════════════════════════════════════════════════
  (uuid_generate_v5(uuid_ns_url(), 'skillpassport:college_admin:courses'),
    NULL, 'skillpassport', 'courses', 'college_admin',
    'Academics', 'Courses', '/college-admin/academics/browse-courses', 100, true, now()),

  (uuid_generate_v5(uuid_ns_url(), 'skillpassport:college_admin:programs'),
    NULL, 'skillpassport', 'programs', 'college_admin',
    'Academics', 'Programs', '/college-admin/academics/programs', 110, true, now()),

  (uuid_generate_v5(uuid_ns_url(), 'skillpassport:college_admin:program_sections'),
    NULL, 'skillpassport', 'program_sections', 'college_admin',
    'Academics', 'Program & Sections', '/college-admin/academics/program-sections', 120, true, now()),

  (uuid_generate_v5(uuid_ns_url(), 'skillpassport:college_admin:course_mapping'),
    NULL, 'skillpassport', 'course_mapping', 'college_admin',
    'Academics', 'Course Mapping', '/college-admin/departments/mapping', 130, true, now()),

  (uuid_generate_v5(uuid_ns_url(), 'skillpassport:college_admin:curriculum_builder'),
    NULL, 'skillpassport', 'curriculum_builder', 'college_admin',
    'Academics', 'Curriculum Builder', '/college-admin/academics/curriculum', 140, true, now()),

  (uuid_generate_v5(uuid_ns_url(), 'skillpassport:college_admin:lesson_plans'),
    NULL, 'skillpassport', 'lesson_plans', 'college_admin',
    'Academics', 'Lesson Plans', '/college-admin/academics/lesson-plans', 150, true, now()),

  -- ══════════════════════════════════════════════════════════════════════
  -- college_admin — Examinations
  -- ══════════════════════════════════════════════════════════════════════
  (uuid_generate_v5(uuid_ns_url(), 'skillpassport:college_admin:exam_management'),
    NULL, 'skillpassport', 'exam_management', 'college_admin',
    'Examinations', 'Exam Management', '/college-admin/examinations', 160, true, now()),

  -- ══════════════════════════════════════════════════════════════════════
  -- college_admin — Placements & Skills
  -- ══════════════════════════════════════════════════════════════════════
  (uuid_generate_v5(uuid_ns_url(), 'skillpassport:college_admin:placement_status'),
    NULL, 'skillpassport', 'placement_status', 'college_admin',
    'Placements & Skills', 'Placements', '/college-admin/placements', 170, true, now()),

  (uuid_generate_v5(uuid_ns_url(), 'skillpassport:college_admin:mentors'),
    NULL, 'skillpassport', 'mentors', 'college_admin',
    'Placements & Skills', 'Mentors', '/college-admin/mentors', 180, true, now()),

  -- ══════════════════════════════════════════════════════════════════════
  -- college_admin — Operations
  -- ══════════════════════════════════════════════════════════════════════
  (uuid_generate_v5(uuid_ns_url(), 'skillpassport:college_admin:finance'),
    NULL, 'skillpassport', 'finance', 'college_admin',
    'Operations', 'Finance', '/college-admin/finance', 190, true, now()),

  (uuid_generate_v5(uuid_ns_url(), 'skillpassport:college_admin:library'),
    NULL, 'skillpassport', 'library', 'college_admin',
    'Operations', 'Library', '/college-admin/library', 200, true, now()),

  (uuid_generate_v5(uuid_ns_url(), 'skillpassport:college_admin:events'),
    NULL, 'skillpassport', 'events', 'college_admin',
    'Operations', 'Events', '/college-admin/events', 210, true, now()),

  (uuid_generate_v5(uuid_ns_url(), 'skillpassport:college_admin:circulars'),
    NULL, 'skillpassport', 'circulars', 'college_admin',
    'Operations', 'Circulars', '/college-admin/circulars', 220, true, now()),

  -- ══════════════════════════════════════════════════════════════════════
  -- college_admin — Administration
  -- ══════════════════════════════════════════════════════════════════════
  (uuid_generate_v5(uuid_ns_url(), 'skillpassport:college_admin:user_management'),
    NULL, 'skillpassport', 'user_management', 'college_admin',
    'Administration', 'User Management', '/college-admin/users', 230, true, now()),

  (uuid_generate_v5(uuid_ns_url(), 'skillpassport:college_admin:reports_analytics'),
    NULL, 'skillpassport', 'reports_analytics', 'college_admin',
    'Administration', 'Reports & Analytics', '/college-admin/reports', 240, true, now()),

  (uuid_generate_v5(uuid_ns_url(), 'skillpassport:college_admin:basic_analytics'),
    NULL, 'skillpassport', 'basic_analytics', 'college_admin',
    'Administration', 'Course Analytics', '/college-admin/course-analytics', 250, true, now()),

  -- ══════════════════════════════════════════════════════════════════════
  -- school_admin — Learner Management
  -- ══════════════════════════════════════════════════════════════════════
  (uuid_generate_v5(uuid_ns_url(), 'skillpassport:school_admin:admissions'),
    NULL, 'skillpassport', 'admissions', 'school_admin',
    'Learner Management', 'Admissions', '/school-admin/learners/admissions', 10, true, now()),

  (uuid_generate_v5(uuid_ns_url(), 'skillpassport:school_admin:digital_portfolio'),
    NULL, 'skillpassport', 'digital_portfolio', 'school_admin',
    'Learner Management', 'Digital Portfolio', '/school-admin/learners/digital-portfolio', 20, true, now()),

  (uuid_generate_v5(uuid_ns_url(), 'skillpassport:school_admin:class_management'),
    NULL, 'skillpassport', 'class_management', 'school_admin',
    'Learner Management', 'Class Management', '/school-admin/classes/management', 30, true, now()),

  (uuid_generate_v5(uuid_ns_url(), 'skillpassport:school_admin:attendance_reports'),
    NULL, 'skillpassport', 'attendance_reports', 'school_admin',
    'Learner Management', 'Attendance & Reports', '/school-admin/learners/attendance-reports', 40, true, now()),

  (uuid_generate_v5(uuid_ns_url(), 'skillpassport:school_admin:assessment_results'),
    NULL, 'skillpassport', 'assessment_results', 'school_admin',
    'Learner Management', 'Assessment Results', '/school-admin/learners/assessment-results', 50, true, now()),

  (uuid_generate_v5(uuid_ns_url(), 'skillpassport:school_admin:learner_verifications'),
    NULL, 'skillpassport', 'learner_verifications', 'school_admin',
    'Learner Management', 'Verifications', '/school-admin/learners/verifications', 60, true, now()),

  -- ══════════════════════════════════════════════════════════════════════
  -- school_admin — Teacher Management
  -- ══════════════════════════════════════════════════════════════════════
  (uuid_generate_v5(uuid_ns_url(), 'skillpassport:school_admin:teachers'),
    NULL, 'skillpassport', 'teachers', 'school_admin',
    'Teacher Management', 'Teachers', '/school-admin/teachers/list', 70, true, now()),

  (uuid_generate_v5(uuid_ns_url(), 'skillpassport:school_admin:teacher_onboarding'),
    NULL, 'skillpassport', 'teacher_onboarding', 'school_admin',
    'Teacher Management', 'Onboarding', '/school-admin/teachers/onboarding', 80, true, now()),

  (uuid_generate_v5(uuid_ns_url(), 'skillpassport:school_admin:teacher_timetable'),
    NULL, 'skillpassport', 'teacher_timetable', 'school_admin',
    'Teacher Management', 'Timetable', '/school-admin/teachers/timetable', 90, true, now()),

  -- ══════════════════════════════════════════════════════════════════════
  -- school_admin — Academic Management
  -- ══════════════════════════════════════════════════════════════════════
  (uuid_generate_v5(uuid_ns_url(), 'skillpassport:school_admin:courses'),
    NULL, 'skillpassport', 'courses', 'school_admin',
    'Academic Management', 'Courses', '/school-admin/academics/browse-courses', 100, true, now()),

  (uuid_generate_v5(uuid_ns_url(), 'skillpassport:school_admin:curriculum_builder'),
    NULL, 'skillpassport', 'curriculum_builder', 'school_admin',
    'Academic Management', 'Curriculum Builder', '/school-admin/academics/curriculum', 110, true, now()),

  (uuid_generate_v5(uuid_ns_url(), 'skillpassport:school_admin:lesson_plans'),
    NULL, 'skillpassport', 'lesson_plans', 'school_admin',
    'Academic Management', 'Lesson Plans', '/school-admin/academics/lesson-plans', 120, true, now()),

  (uuid_generate_v5(uuid_ns_url(), 'skillpassport:school_admin:exams_assessments'),
    NULL, 'skillpassport', 'exams_assessments', 'school_admin',
    'Academic Management', 'Exams & Assessments', '/school-admin/academics/exams', 130, true, now()),

  -- ══════════════════════════════════════════════════════════════════════
  -- school_admin — Parent & Communication
  -- ══════════════════════════════════════════════════════════════════════
  (uuid_generate_v5(uuid_ns_url(), 'skillpassport:school_admin:parent_portal'),
    NULL, 'skillpassport', 'parent_portal', 'school_admin',
    'Parent & Communication', 'Parent Portal', '/school-admin/communication/parents', 140, true, now()),

  (uuid_generate_v5(uuid_ns_url(), 'skillpassport:school_admin:message_center'),
    NULL, 'skillpassport', 'message_center', 'school_admin',
    'Parent & Communication', 'Message Center', '/school-admin/communication/messages', 150, true, now()),

  (uuid_generate_v5(uuid_ns_url(), 'skillpassport:school_admin:parent_communication'),
    NULL, 'skillpassport', 'parent_communication', 'school_admin',
    'Parent & Communication', 'Parent Communication', '/school-admin/communication/circulars', 160, true, now()),

  (uuid_generate_v5(uuid_ns_url(), 'skillpassport:school_admin:learner_communication'),
    NULL, 'skillpassport', 'learner_communication', 'school_admin',
    'Parent & Communication', 'Learner Communication', '/school-admin/communication/messages-learner', 170, true, now()),

  -- ══════════════════════════════════════════════════════════════════════
  -- school_admin — Finance & Infrastructure
  -- ══════════════════════════════════════════════════════════════════════
  (uuid_generate_v5(uuid_ns_url(), 'skillpassport:school_admin:fee_setup_payments'),
    NULL, 'skillpassport', 'fee_setup_payments', 'school_admin',
    'Finance & Infrastructure', 'Fee Setup & Payments', '/school-admin/finance/fees', 180, true, now()),

  (uuid_generate_v5(uuid_ns_url(), 'skillpassport:school_admin:library_assets'),
    NULL, 'skillpassport', 'library_assets', 'school_admin',
    'Finance & Infrastructure', 'Library & Assets', '/school-admin/infrastructure/library', 190, true, now()),

  (uuid_generate_v5(uuid_ns_url(), 'skillpassport:school_admin:maintenance'),
    NULL, 'skillpassport', 'maintenance', 'school_admin',
    'Finance & Infrastructure', 'Maintenance', '/school-admin/infrastructure/maintenance', 200, true, now()),

  -- ══════════════════════════════════════════════════════════════════════
  -- school_admin — Skill & Co-Curricular
  -- ══════════════════════════════════════════════════════════════════════
  (uuid_generate_v5(uuid_ns_url(), 'skillpassport:school_admin:clubs_competitions'),
    NULL, 'skillpassport', 'clubs_competitions', 'school_admin',
    'Skill & Co-Curricular', 'Clubs & Competitions', '/school-admin/skills/clubs', 210, true, now()),

  (uuid_generate_v5(uuid_ns_url(), 'skillpassport:school_admin:competition_certificates'),
    NULL, 'skillpassport', 'competition_certificates', 'school_admin',
    'Skill & Co-Curricular', 'Competition Certificates', '/school-admin/skills/badges', 220, true, now()),

  (uuid_generate_v5(uuid_ns_url(), 'skillpassport:school_admin:skills_reports'),
    NULL, 'skillpassport', 'skills_reports', 'school_admin',
    'Skill & Co-Curricular', 'Reports', '/school-admin/skills/reports', 230, true, now()),

  (uuid_generate_v5(uuid_ns_url(), 'skillpassport:school_admin:basic_analytics'),
    NULL, 'skillpassport', 'basic_analytics', 'school_admin',
    'Skill & Co-Curricular', 'Course Analytics', '/school-admin/course-analytics', 240, true, now()),

  -- ══════════════════════════════════════════════════════════════════════
  -- university_admin — Affiliated College Management
  -- ══════════════════════════════════════════════════════════════════════
  (uuid_generate_v5(uuid_ns_url(), 'skillpassport:university_admin:college_registration'),
    NULL, 'skillpassport', 'college_registration', 'university_admin',
    'Affiliated College Management', 'College Registration', '/university-admin/colleges/registration', 10, true, now()),

  (uuid_generate_v5(uuid_ns_url(), 'skillpassport:university_admin:program_allocation'),
    NULL, 'skillpassport', 'program_allocation', 'university_admin',
    'Affiliated College Management', 'Program Allocation', '/university-admin/colleges/programs', 20, true, now()),

  (uuid_generate_v5(uuid_ns_url(), 'skillpassport:university_admin:performance_monitoring'),
    NULL, 'skillpassport', 'performance_monitoring', 'university_admin',
    'Affiliated College Management', 'Performance Monitoring', '/university-admin/colleges/performance', 30, true, now()),

  -- ══════════════════════════════════════════════════════════════════════
  -- university_admin — Course & Curriculum Management
  -- ══════════════════════════════════════════════════════════════════════
  (uuid_generate_v5(uuid_ns_url(), 'skillpassport:university_admin:courses'),
    NULL, 'skillpassport', 'courses', 'university_admin',
    'Course & Curriculum Management', 'Courses', '/university-admin/browse-courses', 40, true, now()),

  (uuid_generate_v5(uuid_ns_url(), 'skillpassport:university_admin:syllabus_approval'),
    NULL, 'skillpassport', 'syllabus_approval', 'university_admin',
    'Course & Curriculum Management', 'Syllabus Approval', '/university-admin/courses/syllabus', 50, true, now()),

  (uuid_generate_v5(uuid_ns_url(), 'skillpassport:university_admin:course_updates'),
    NULL, 'skillpassport', 'course_updates', 'university_admin',
    'Course & Curriculum Management', 'Course Updates', '/university-admin/courses/updates', 60, true, now()),

  (uuid_generate_v5(uuid_ns_url(), 'skillpassport:university_admin:content_repository'),
    NULL, 'skillpassport', 'content_repository', 'university_admin',
    'Course & Curriculum Management', 'Content Repository', '/university-admin/courses/content', 70, true, now()),

  -- ══════════════════════════════════════════════════════════════════════
  -- university_admin — Faculty & Trainer Management
  -- ══════════════════════════════════════════════════════════════════════
  (uuid_generate_v5(uuid_ns_url(), 'skillpassport:university_admin:faculty_empanelment'),
    NULL, 'skillpassport', 'faculty_empanelment', 'university_admin',
    'Faculty & Trainer Management', 'Empanelment & Assignment', '/university-admin/faculty/empanelment', 80, true, now()),

  (uuid_generate_v5(uuid_ns_url(), 'skillpassport:university_admin:faculty_feedback_certification'),
    NULL, 'skillpassport', 'faculty_feedback_certification', 'university_admin',
    'Faculty & Trainer Management', 'Feedback & Certification', '/university-admin/faculty/feedback', 90, true, now()),

  -- ══════════════════════════════════════════════════════════════════════
  -- university_admin — Learner Records
  -- ══════════════════════════════════════════════════════════════════════
  (uuid_generate_v5(uuid_ns_url(), 'skillpassport:university_admin:enrollment_profiles'),
    NULL, 'skillpassport', 'enrollment_profiles', 'university_admin',
    'Learner Records', 'Enrollment & Profiles', '/university-admin/learners/enrollments', 100, true, now()),

  (uuid_generate_v5(uuid_ns_url(), 'skillpassport:university_admin:digital_portfolios'),
    NULL, 'skillpassport', 'digital_portfolios', 'university_admin',
    'Learner Records', 'Digital Portfolios', '/university-admin/learners/digital-portfolios', 110, true, now()),

  (uuid_generate_v5(uuid_ns_url(), 'skillpassport:university_admin:assessment_results'),
    NULL, 'skillpassport', 'assessment_results', 'university_admin',
    'Learner Records', 'Assessment Results', '/university-admin/learners/assessment-results', 120, true, now()),

  (uuid_generate_v5(uuid_ns_url(), 'skillpassport:university_admin:continuous_assessment'),
    NULL, 'skillpassport', 'continuous_assessment', 'university_admin',
    'Learner Records', 'Continuous Assessment', '/university-admin/learners/continuous-assessment', 130, true, now()),

  (uuid_generate_v5(uuid_ns_url(), 'skillpassport:university_admin:centralized_results'),
    NULL, 'skillpassport', 'centralized_results', 'university_admin',
    'Learner Records', 'Centralized Results', '/university-admin/learners/results', 140, true, now()),

  (uuid_generate_v5(uuid_ns_url(), 'skillpassport:university_admin:certificate_generation'),
    NULL, 'skillpassport', 'certificate_generation', 'university_admin',
    'Learner Records', 'Certificate Generation', '/university-admin/learners/certificates', 150, true, now()),

  -- ══════════════════════════════════════════════════════════════════════
  -- university_admin — Examination Management
  -- ══════════════════════════════════════════════════════════════════════
  (uuid_generate_v5(uuid_ns_url(), 'skillpassport:university_admin:examination_scheduling'),
    NULL, 'skillpassport', 'examination_scheduling', 'university_admin',
    'Examination Management', 'Examination Scheduling', '/university-admin/examinations', 160, true, now()),

  (uuid_generate_v5(uuid_ns_url(), 'skillpassport:university_admin:grade_calculation'),
    NULL, 'skillpassport', 'grade_calculation', 'university_admin',
    'Examination Management', 'Grade Calculation', '/university-admin/examinations/grades', 170, true, now()),

  (uuid_generate_v5(uuid_ns_url(), 'skillpassport:university_admin:results_publishing'),
    NULL, 'skillpassport', 'results_publishing', 'university_admin',
    'Examination Management', 'Results Publishing', '/university-admin/examinations/results', 180, true, now()),

  -- ══════════════════════════════════════════════════════════════════════
  -- university_admin — Placement & Industry Linkages
  -- ══════════════════════════════════════════════════════════════════════
  (uuid_generate_v5(uuid_ns_url(), 'skillpassport:university_admin:placement_readiness'),
    NULL, 'skillpassport', 'placement_readiness', 'university_admin',
    'Placement & Industry Linkages', 'Placement Readiness', '/university-admin/placements/readiness', 190, true, now()),

  (uuid_generate_v5(uuid_ns_url(), 'skillpassport:university_admin:company_database'),
    NULL, 'skillpassport', 'company_database', 'university_admin',
    'Placement & Industry Linkages', 'Company Database', '/university-admin/placements/companies', 200, true, now()),

  (uuid_generate_v5(uuid_ns_url(), 'skillpassport:university_admin:internship_reports'),
    NULL, 'skillpassport', 'internship_reports', 'university_admin',
    'Placement & Industry Linkages', 'Internship Reports', '/university-admin/placements/internships', 210, true, now()),

  (uuid_generate_v5(uuid_ns_url(), 'skillpassport:university_admin:mous_partnerships'),
    NULL, 'skillpassport', 'mous_partnerships', 'university_admin',
    'Placement & Industry Linkages', 'MoUs & Partnerships', '/university-admin/placements/mous', 220, true, now()),

  -- ══════════════════════════════════════════════════════════════════════
  -- university_admin — Finance & Fees
  -- ══════════════════════════════════════════════════════════════════════
  (uuid_generate_v5(uuid_ns_url(), 'skillpassport:university_admin:fee_structures'),
    NULL, 'skillpassport', 'fee_structures', 'university_admin',
    'Finance & Fees', 'Fee Structures', '/university-admin/finance', 230, true, now()),

  (uuid_generate_v5(uuid_ns_url(), 'skillpassport:university_admin:payment_tracking'),
    NULL, 'skillpassport', 'payment_tracking', 'university_admin',
    'Finance & Fees', 'Payment Tracking', '/university-admin/finance/payments', 240, true, now()),

  (uuid_generate_v5(uuid_ns_url(), 'skillpassport:university_admin:financial_reports'),
    NULL, 'skillpassport', 'financial_reports', 'university_admin',
    'Finance & Fees', 'Financial Reports', '/university-admin/finance/reports', 250, true, now()),

  -- ══════════════════════════════════════════════════════════════════════
  -- university_admin — Analytics & Compliance
  -- ══════════════════════════════════════════════════════════════════════
  (uuid_generate_v5(uuid_ns_url(), 'skillpassport:university_admin:district_college_reports'),
    NULL, 'skillpassport', 'district_college_reports', 'university_admin',
    'Analytics & Compliance', 'District & College Reports', '/university-admin/analytics/reports', 260, true, now()),

  (uuid_generate_v5(uuid_ns_url(), 'skillpassport:university_admin:basic_analytics'),
    NULL, 'skillpassport', 'basic_analytics', 'university_admin',
    'Analytics & Compliance', 'Course Analytics', '/university-admin/analytics/course-analytics', 270, true, now()),

  (uuid_generate_v5(uuid_ns_url(), 'skillpassport:university_admin:scheme_compliance'),
    NULL, 'skillpassport', 'scheme_compliance', 'university_admin',
    'Analytics & Compliance', 'Scheme Compliance (TNSDC)', '/university-admin/analytics/compliance', 280, true, now()),

  (uuid_generate_v5(uuid_ns_url(), 'skillpassport:university_admin:obe_tracking'),
    NULL, 'skillpassport', 'obe_tracking', 'university_admin',
    'Analytics & Compliance', 'OBE Tracking', '/university-admin/analytics/obe-tracking', 290, true, now()),

  -- ══════════════════════════════════════════════════════════════════════
  -- university_admin — Library & Learner Services
  -- ══════════════════════════════════════════════════════════════════════
  (uuid_generate_v5(uuid_ns_url(), 'skillpassport:university_admin:library_management'),
    NULL, 'skillpassport', 'library_management', 'university_admin',
    'Library & Learner Services', 'Library Management', '/university-admin/library/management', 300, true, now()),

  (uuid_generate_v5(uuid_ns_url(), 'skillpassport:university_admin:library_clearance'),
    NULL, 'skillpassport', 'library_clearance', 'university_admin',
    'Library & Learner Services', 'Library Clearance', '/university-admin/library/clearance', 310, true, now()),

  (uuid_generate_v5(uuid_ns_url(), 'skillpassport:university_admin:learner_service_requests'),
    NULL, 'skillpassport', 'learner_service_requests', 'university_admin',
    'Library & Learner Services', 'Learner Service Requests', '/university-admin/library/service-requests', 320, true, now()),

  (uuid_generate_v5(uuid_ns_url(), 'skillpassport:university_admin:graduation_integration'),
    NULL, 'skillpassport', 'graduation_integration', 'university_admin',
    'Library & Learner Services', 'Graduation Integration', '/university-admin/library/graduation-integration', 330, true, now()),

  -- ══════════════════════════════════════════════════════════════════════
  -- university_admin — HR & Payroll
  -- ══════════════════════════════════════════════════════════════════════
  (uuid_generate_v5(uuid_ns_url(), 'skillpassport:university_admin:faculty_lifecycle'),
    NULL, 'skillpassport', 'faculty_lifecycle', 'university_admin',
    'HR & Payroll', 'Faculty Lifecycle', '/university-admin/hr/faculty-lifecycle', 340, true, now()),

  (uuid_generate_v5(uuid_ns_url(), 'skillpassport:university_admin:staff_management'),
    NULL, 'skillpassport', 'staff_management', 'university_admin',
    'HR & Payroll', 'Staff Management', '/university-admin/hr/staff-management', 350, true, now()),

  (uuid_generate_v5(uuid_ns_url(), 'skillpassport:university_admin:payroll_processing'),
    NULL, 'skillpassport', 'payroll_processing', 'university_admin',
    'HR & Payroll', 'Payroll Processing', '/university-admin/hr/payroll', 360, true, now()),

  (uuid_generate_v5(uuid_ns_url(), 'skillpassport:university_admin:statutory_deductions'),
    NULL, 'skillpassport', 'statutory_deductions', 'university_admin',
    'HR & Payroll', 'Statutory Deductions', '/university-admin/hr/statutory-deductions', 370, true, now()),

  (uuid_generate_v5(uuid_ns_url(), 'skillpassport:university_admin:employee_records'),
    NULL, 'skillpassport', 'employee_records', 'university_admin',
    'HR & Payroll', 'Employee Records', '/university-admin/hr/employee-records', 380, true, now()),

  (uuid_generate_v5(uuid_ns_url(), 'skillpassport:university_admin:leave_management'),
    NULL, 'skillpassport', 'leave_management', 'university_admin',
    'HR & Payroll', 'Leave Management', '/university-admin/hr/leave-management', 390, true, now()),

  -- ══════════════════════════════════════════════════════════════════════
  -- university_admin — Communication & Announcements
  -- ══════════════════════════════════════════════════════════════════════
  (uuid_generate_v5(uuid_ns_url(), 'skillpassport:university_admin:circulars_notices'),
    NULL, 'skillpassport', 'circulars_notices', 'university_admin',
    'Communication & Announcements', 'Circulars & Notices', '/university-admin/communication/circulars', 400, true, now()),

  (uuid_generate_v5(uuid_ns_url(), 'skillpassport:university_admin:training_updates'),
    NULL, 'skillpassport', 'training_updates', 'university_admin',
    'Communication & Announcements', 'Training Updates', '/university-admin/communication/training', 410, true, now())

ON CONFLICT (id) DO UPDATE SET
  product_code = EXCLUDED.product_code,
  key = EXCLUDED.key,
  role = EXCLUDED.role,
  nav_group = EXCLUDED.nav_group,
  nav_label = EXCLUDED.nav_label,
  nav_path = EXCLUDED.nav_path,
  display_order = EXCLUDED.display_order,
  is_active = EXCLUDED.is_active,
  synced_at = now(),
  updated_at = now();

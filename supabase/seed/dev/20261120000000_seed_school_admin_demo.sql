-- =============================================================================
-- SCHOOL ADMIN DEMO SEED  —  Greenwood High School
-- School ID : a1b2c3d4-0002-4000-8000-000000000002
-- Demo tag  : metadata->>'demo_batch' = 'school_admin_demo_v1'
-- Idempotent : ON CONFLICT DO NOTHING  (safe to rerun)
-- Reset cmd  : psql $DB_URL -f supabase/seed/dev/reset_school_admin_demo.sql
-- =============================================================================

-- ─── 0. CONSTANTS (kept as SQL vars for readability) ─────────────────────────
DO $$ BEGIN END $$;  -- no-op fence

-- =============================================================================
-- 0. PREREQUISITES — must exist before any FK references below
-- =============================================================================

-- 0a. Organisation (Greenwood High School)
INSERT INTO public.organizations
  (id, name, description, email, state, city, country, verification_status,
   is_active, approval_status, account_status, organization_type, admin_id, metadata)
VALUES (
  'a1b2c3d4-0002-4000-8000-000000000002',
  'Greenwood High School',
  'Demo school for school admin testing',
  'admin@greenwood.demo.in',
  'Tamil Nadu', 'Chennai', 'India',
  'approved', true, 'approved', 'active', 'school',
  'a1b2c3d4-0001-4000-8000-000000000001',
  '{"is_demo": true, "demo_batch": "school_admin_demo_v1", "organization_type": "school",
    "admin_id": "a1b2c3d4-0001-4000-8000-000000000001", "onboarding_completed": true}'
)
ON CONFLICT (id) DO UPDATE
  SET name = EXCLUDED.name,
      is_active = EXCLUDED.is_active,
      approval_status = EXCLUDED.approval_status;

-- 0b. School Admin user (schooladmin@testdev.com)
INSERT INTO public.users
  (id, email, "firstName", "lastName", role, "organizationId", "isActive", metadata)
VALUES (
  'a1b2c3d4-0001-4000-8000-000000000001',
  'schooladmin@testdev.com',
  'School', 'Admin',
  'school_admin',
  'a1b2c3d4-0002-4000-8000-000000000002',
  true,
  '{"is_demo": true, "demo_batch": "school_admin_demo_v1"}'
)
ON CONFLICT (id) DO UPDATE
  SET role = EXCLUDED.role,
      "organizationId" = EXCLUDED."organizationId",
      "isActive" = EXCLUDED."isActive";

-- =============================================================================
-- 1. SCHOOL CLASSES  (7 classes, Grade 6-12, Section A)
-- =============================================================================
INSERT INTO public.school_classes
  (id, school_id, name, grade, section, academic_year, max_learners, metadata)
VALUES
  (md5('demo_class_grade6a')::uuid,  'a1b2c3d4-0002-4000-8000-000000000002', 'Grade 6 - A',  '6',  'A', '2026-2027', 40, '{"is_demo":true,"demo_batch":"school_admin_demo_v1"}'),
  (md5('demo_class_grade7a')::uuid,  'a1b2c3d4-0002-4000-8000-000000000002', 'Grade 7 - A',  '7',  'A', '2026-2027', 40, '{"is_demo":true,"demo_batch":"school_admin_demo_v1"}'),
  (md5('demo_class_grade8a')::uuid,  'a1b2c3d4-0002-4000-8000-000000000002', 'Grade 8 - A',  '8',  'A', '2026-2027', 40, '{"is_demo":true,"demo_batch":"school_admin_demo_v1"}'),
  (md5('demo_class_grade9a')::uuid,  'a1b2c3d4-0002-4000-8000-000000000002', 'Grade 9 - A',  '9',  'A', '2026-2027', 40, '{"is_demo":true,"demo_batch":"school_admin_demo_v1"}'),
  (md5('demo_class_grade10a')::uuid, 'a1b2c3d4-0002-4000-8000-000000000002', 'Grade 10 - A', '10', 'A', '2026-2027', 40, '{"is_demo":true,"demo_batch":"school_admin_demo_v1"}'),
  (md5('demo_class_grade11a')::uuid, 'a1b2c3d4-0002-4000-8000-000000000002', 'Grade 11 - A', '11', 'A', '2026-2027', 40, '{"is_demo":true,"demo_batch":"school_admin_demo_v1"}'),
  (md5('demo_class_grade12a')::uuid, 'a1b2c3d4-0002-4000-8000-000000000002', 'Grade 12 - A', '12', 'A', '2026-2027', 40, '{"is_demo":true,"demo_batch":"school_admin_demo_v1"}')
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- 2. TEACHER USERS  (10 rows in public.users — required by school_educators FK)
-- =============================================================================
INSERT INTO public.users
  (id, email, "firstName", "lastName", role, "organizationId", "isActive", metadata)
VALUES
  (md5('demo_teacher_user_meena')::uuid,      'meena.rajan.teacher@greenwood.demo.in',         'Meena',       'Rajan',         'school_educator', 'a1b2c3d4-0002-4000-8000-000000000002', true, '{"is_demo":true,"demo_batch":"school_admin_demo_v1"}'),
  (md5('demo_teacher_user_arjun')::uuid,      'arjun.pillai.teacher@greenwood.demo.in',        'Arjun',       'Pillai',        'school_educator', 'a1b2c3d4-0002-4000-8000-000000000002', true, '{"is_demo":true,"demo_batch":"school_admin_demo_v1"}'),
  (md5('demo_teacher_user_priya')::uuid,      'priya.krishnamurthy.teacher@greenwood.demo.in', 'Priya',       'Krishnamurthy', 'school_educator', 'a1b2c3d4-0002-4000-8000-000000000002', true, '{"is_demo":true,"demo_batch":"school_admin_demo_v1"}'),
  (md5('demo_teacher_user_suresh')::uuid,     'suresh.babu.teacher@greenwood.demo.in',         'Suresh',      'Babu',          'school_educator', 'a1b2c3d4-0002-4000-8000-000000000002', true, '{"is_demo":true,"demo_batch":"school_admin_demo_v1"}'),
  (md5('demo_teacher_user_deepa')::uuid,      'deepa.nair.teacher@greenwood.demo.in',          'Deepa',       'Nair',          'school_educator', 'a1b2c3d4-0002-4000-8000-000000000002', true, '{"is_demo":true,"demo_batch":"school_admin_demo_v1"}'),
  (md5('demo_teacher_user_ravi')::uuid,       'ravi.shankar.teacher@greenwood.demo.in',        'Ravi',        'Shankar',       'school_educator', 'a1b2c3d4-0002-4000-8000-000000000002', true, '{"is_demo":true,"demo_batch":"school_admin_demo_v1"}'),
  (md5('demo_teacher_user_anitha')::uuid,     'anitha.devi.teacher@greenwood.demo.in',         'Anitha',      'Devi',          'school_educator', 'a1b2c3d4-0002-4000-8000-000000000002', true, '{"is_demo":true,"demo_batch":"school_admin_demo_v1"}'),
  (md5('demo_teacher_user_prakash')::uuid,    'prakash.kumar.teacher@greenwood.demo.in',       'Prakash',     'Kumar',         'school_educator', 'a1b2c3d4-0002-4000-8000-000000000002', true, '{"is_demo":true,"demo_batch":"school_admin_demo_v1"}'),
  (md5('demo_teacher_user_kavitha')::uuid,    'kavitha.sundaram.teacher@greenwood.demo.in',    'Kavitha',     'Sundaram',      'school_educator', 'a1b2c3d4-0002-4000-8000-000000000002', true, '{"is_demo":true,"demo_batch":"school_admin_demo_v1"}'),
  (md5('demo_teacher_user_senthil')::uuid,    'senthil.nathan.teacher@greenwood.demo.in',      'Senthil',     'Nathan',        'school_educator', 'a1b2c3d4-0002-4000-8000-000000000002', true, '{"is_demo":true,"demo_batch":"school_admin_demo_v1"}')
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- 3. SCHOOL EDUCATORS  (10 teachers)
-- =============================================================================
INSERT INTO public.school_educators
  (id, user_id, school_id, employee_id, first_name, last_name, email,
   specialization, qualification, experience_years, date_of_joining,
   role, subjects_handled, teacher_id, metadata)
VALUES
  (md5('demo_edu_meena')::uuid,   md5('demo_teacher_user_meena')::uuid,   'a1b2c3d4-0002-4000-8000-000000000002', 'EMP-D-001', 'Meena',    'Rajan',         'meena.rajan.teacher@greenwood.demo.in',         'Mathematics',        'M.Sc Mathematics',         8,  '2020-06-01', 'subject_teacher', ARRAY['Mathematics'],          'SPR-DEMO-T-001', '{"is_demo":true,"demo_batch":"school_admin_demo_v1"}'),
  (md5('demo_edu_arjun')::uuid,   md5('demo_teacher_user_arjun')::uuid,   'a1b2c3d4-0002-4000-8000-000000000002', 'EMP-D-002', 'Arjun',    'Pillai',        'arjun.pillai.teacher@greenwood.demo.in',        'Science',            'M.Sc Physics',             10, '2018-07-01', 'subject_teacher', ARRAY['Physics','Science'],    'SPR-DEMO-T-002', '{"is_demo":true,"demo_batch":"school_admin_demo_v1"}'),
  (md5('demo_edu_priya')::uuid,   md5('demo_teacher_user_priya')::uuid,   'a1b2c3d4-0002-4000-8000-000000000002', 'EMP-D-003', 'Priya',    'Krishnamurthy', 'priya.krishnamurthy.teacher@greenwood.demo.in', 'English',            'M.A English Literature',   12, '2016-06-15', 'class_teacher',   ARRAY['English'],              'SPR-DEMO-T-003', '{"is_demo":true,"demo_batch":"school_admin_demo_v1"}'),
  (md5('demo_edu_suresh')::uuid,  md5('demo_teacher_user_suresh')::uuid,  'a1b2c3d4-0002-4000-8000-000000000002', 'EMP-D-004', 'Suresh',   'Babu',          'suresh.babu.teacher@greenwood.demo.in',         'Social Science',     'M.A History',              7,  '2021-07-01', 'subject_teacher', ARRAY['Social Science'],       'SPR-DEMO-T-004', '{"is_demo":true,"demo_batch":"school_admin_demo_v1"}'),
  (md5('demo_edu_deepa')::uuid,   md5('demo_teacher_user_deepa')::uuid,   'a1b2c3d4-0002-4000-8000-000000000002', 'EMP-D-005', 'Deepa',    'Nair',          'deepa.nair.teacher@greenwood.demo.in',          'Computer Science',   'M.Sc Computer Science',    6,  '2022-06-01', 'subject_teacher', ARRAY['Computer Science'],     'SPR-DEMO-T-005', '{"is_demo":true,"demo_batch":"school_admin_demo_v1"}'),
  (md5('demo_edu_ravi')::uuid,    md5('demo_teacher_user_ravi')::uuid,    'a1b2c3d4-0002-4000-8000-000000000002', 'EMP-D-006', 'Ravi',     'Shankar',       'ravi.shankar.teacher@greenwood.demo.in',        'Physical Education', 'B.P.Ed',                   5,  '2023-07-01', 'subject_teacher', ARRAY['Physical Education'],   'SPR-DEMO-T-006', '{"is_demo":true,"demo_batch":"school_admin_demo_v1"}'),
  (md5('demo_edu_anitha')::uuid,  md5('demo_teacher_user_anitha')::uuid,  'a1b2c3d4-0002-4000-8000-000000000002', 'EMP-D-007', 'Anitha',   'Devi',          'anitha.devi.teacher@greenwood.demo.in',         'Languages',          'M.A Tamil',                9,  '2019-06-01', 'subject_teacher', ARRAY['Tamil','Hindi'],        'SPR-DEMO-T-007', '{"is_demo":true,"demo_batch":"school_admin_demo_v1"}'),
  (md5('demo_edu_prakash')::uuid, md5('demo_teacher_user_prakash')::uuid, 'a1b2c3d4-0002-4000-8000-000000000002', 'EMP-D-008', 'Prakash',  'Kumar',         'prakash.kumar.teacher@greenwood.demo.in',       'Chemistry',          'M.Sc Chemistry',           11, '2017-07-01', 'subject_teacher', ARRAY['Chemistry'],            'SPR-DEMO-T-008', '{"is_demo":true,"demo_batch":"school_admin_demo_v1"}'),
  (md5('demo_edu_kavitha')::uuid, md5('demo_teacher_user_kavitha')::uuid, 'a1b2c3d4-0002-4000-8000-000000000002', 'EMP-D-009', 'Kavitha',  'Sundaram',      'kavitha.sundaram.teacher@greenwood.demo.in',    'Biology',            'M.Sc Botany',              8,  '2020-07-01', 'subject_teacher', ARRAY['Biology'],              'SPR-DEMO-T-009', '{"is_demo":true,"demo_batch":"school_admin_demo_v1"}'),
  (md5('demo_edu_senthil')::uuid, md5('demo_teacher_user_senthil')::uuid, 'a1b2c3d4-0002-4000-8000-000000000002', 'EMP-D-010', 'Senthil',  'Nathan',        'senthil.nathan.teacher@greenwood.demo.in',      'Physics',            'M.Sc Physics',             14, '2014-06-01', 'subject_teacher', ARRAY['Physics'],              'SPR-DEMO-T-010', '{"is_demo":true,"demo_batch":"school_admin_demo_v1"}')
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- 4. TEACHER → CLASS ASSIGNMENTS  (each teacher assigned to relevant classes)
-- =============================================================================
INSERT INTO public.school_educator_class_assignments
  (id, educator_id, class_id, subject, academic_year, is_primary, assigned_by)
VALUES
  -- Meena Rajan: Maths for Grade 6-10
  (md5('demo_assign_meena_g6')::uuid,   md5('demo_edu_meena')::uuid,   md5('demo_class_grade6a')::uuid,  'Mathematics', '2026-2027', true,  'a1b2c3d4-0001-4000-8000-000000000001'),
  (md5('demo_assign_meena_g7')::uuid,   md5('demo_edu_meena')::uuid,   md5('demo_class_grade7a')::uuid,  'Mathematics', '2026-2027', false, 'a1b2c3d4-0001-4000-8000-000000000001'),
  (md5('demo_assign_meena_g8')::uuid,   md5('demo_edu_meena')::uuid,   md5('demo_class_grade8a')::uuid,  'Mathematics', '2026-2027', false, 'a1b2c3d4-0001-4000-8000-000000000001'),
  (md5('demo_assign_meena_g9')::uuid,   md5('demo_edu_meena')::uuid,   md5('demo_class_grade9a')::uuid,  'Mathematics', '2026-2027', false, 'a1b2c3d4-0001-4000-8000-000000000001'),
  (md5('demo_assign_meena_g10')::uuid,  md5('demo_edu_meena')::uuid,   md5('demo_class_grade10a')::uuid, 'Mathematics', '2026-2027', false, 'a1b2c3d4-0001-4000-8000-000000000001'),
  -- Arjun Pillai: Science Grade 6-9
  (md5('demo_assign_arjun_g6')::uuid,   md5('demo_edu_arjun')::uuid,   md5('demo_class_grade6a')::uuid,  'Science',     '2026-2027', true,  'a1b2c3d4-0001-4000-8000-000000000001'),
  (md5('demo_assign_arjun_g7')::uuid,   md5('demo_edu_arjun')::uuid,   md5('demo_class_grade7a')::uuid,  'Science',     '2026-2027', false, 'a1b2c3d4-0001-4000-8000-000000000001'),
  (md5('demo_assign_arjun_g8')::uuid,   md5('demo_edu_arjun')::uuid,   md5('demo_class_grade8a')::uuid,  'Science',     '2026-2027', false, 'a1b2c3d4-0001-4000-8000-000000000001'),
  -- Priya Krishnamurthy: English all grades (class teacher for Grade 9)
  (md5('demo_assign_priya_g6')::uuid,   md5('demo_edu_priya')::uuid,   md5('demo_class_grade6a')::uuid,  'English',     '2026-2027', false, 'a1b2c3d4-0001-4000-8000-000000000001'),
  (md5('demo_assign_priya_g9')::uuid,   md5('demo_edu_priya')::uuid,   md5('demo_class_grade9a')::uuid,  'English',     '2026-2027', true,  'a1b2c3d4-0001-4000-8000-000000000001'),
  (md5('demo_assign_priya_g10')::uuid,  md5('demo_edu_priya')::uuid,   md5('demo_class_grade10a')::uuid, 'English',     '2026-2027', false, 'a1b2c3d4-0001-4000-8000-000000000001'),
  -- Suresh Babu: Social Science
  (md5('demo_assign_suresh_g6')::uuid,  md5('demo_edu_suresh')::uuid,  md5('demo_class_grade6a')::uuid,  'Social Science', '2026-2027', false, 'a1b2c3d4-0001-4000-8000-000000000001'),
  (md5('demo_assign_suresh_g8')::uuid,  md5('demo_edu_suresh')::uuid,  md5('demo_class_grade8a')::uuid,  'Social Science', '2026-2027', true,  'a1b2c3d4-0001-4000-8000-000000000001'),
  (md5('demo_assign_suresh_g10')::uuid, md5('demo_edu_suresh')::uuid,  md5('demo_class_grade10a')::uuid, 'Social Science', '2026-2027', false, 'a1b2c3d4-0001-4000-8000-000000000001'),
  -- Deepa Nair: Computer Science Grade 8-12
  (md5('demo_assign_deepa_g8')::uuid,   md5('demo_edu_deepa')::uuid,   md5('demo_class_grade8a')::uuid,  'Computer Science', '2026-2027', false, 'a1b2c3d4-0001-4000-8000-000000000001'),
  (md5('demo_assign_deepa_g10')::uuid,  md5('demo_edu_deepa')::uuid,   md5('demo_class_grade10a')::uuid, 'Computer Science', '2026-2027', true,  'a1b2c3d4-0001-4000-8000-000000000001'),
  (md5('demo_assign_deepa_g11')::uuid,  md5('demo_edu_deepa')::uuid,   md5('demo_class_grade11a')::uuid, 'Computer Science', '2026-2027', false, 'a1b2c3d4-0001-4000-8000-000000000001'),
  (md5('demo_assign_deepa_g12')::uuid,  md5('demo_edu_deepa')::uuid,   md5('demo_class_grade12a')::uuid, 'Computer Science', '2026-2027', false, 'a1b2c3d4-0001-4000-8000-000000000001'),
  -- Ravi Shankar: PT all grades
  (md5('demo_assign_ravi_g6')::uuid,    md5('demo_edu_ravi')::uuid,    md5('demo_class_grade6a')::uuid,  'Physical Education', '2026-2027', false, 'a1b2c3d4-0001-4000-8000-000000000001'),
  (md5('demo_assign_ravi_g9')::uuid,    md5('demo_edu_ravi')::uuid,    md5('demo_class_grade9a')::uuid,  'Physical Education', '2026-2027', true,  'a1b2c3d4-0001-4000-8000-000000000001'),
  -- Anitha Devi: Tamil / Hindi
  (md5('demo_assign_anitha_g6')::uuid,  md5('demo_edu_anitha')::uuid,  md5('demo_class_grade6a')::uuid,  'Tamil',  '2026-2027', false, 'a1b2c3d4-0001-4000-8000-000000000001'),
  (md5('demo_assign_anitha_g7')::uuid,  md5('demo_edu_anitha')::uuid,  md5('demo_class_grade7a')::uuid,  'Hindi',  '2026-2027', true,  'a1b2c3d4-0001-4000-8000-000000000001'),
  -- Prakash Kumar: Chemistry Grade 11-12
  (md5('demo_assign_prakash_g11')::uuid, md5('demo_edu_prakash')::uuid, md5('demo_class_grade11a')::uuid, 'Chemistry', '2026-2027', true,  'a1b2c3d4-0001-4000-8000-000000000001'),
  (md5('demo_assign_prakash_g12')::uuid, md5('demo_edu_prakash')::uuid, md5('demo_class_grade12a')::uuid, 'Chemistry', '2026-2027', false, 'a1b2c3d4-0001-4000-8000-000000000001'),
  -- Kavitha Sundaram: Biology Grade 11-12
  (md5('demo_assign_kavitha_g11')::uuid, md5('demo_edu_kavitha')::uuid, md5('demo_class_grade11a')::uuid, 'Biology', '2026-2027', false, 'a1b2c3d4-0001-4000-8000-000000000001'),
  (md5('demo_assign_kavitha_g12')::uuid, md5('demo_edu_kavitha')::uuid, md5('demo_class_grade12a')::uuid, 'Biology', '2026-2027', false, 'a1b2c3d4-0001-4000-8000-000000000001'),
  -- Senthil Nathan: Physics Grade 11-12
  (md5('demo_assign_senthil_g11')::uuid, md5('demo_edu_senthil')::uuid, md5('demo_class_grade11a')::uuid, 'Physics', '2026-2027', false, 'a1b2c3d4-0001-4000-8000-000000000001'),
  (md5('demo_assign_senthil_g12')::uuid, md5('demo_edu_senthil')::uuid, md5('demo_class_grade12a')::uuid, 'Physics', '2026-2027', true,  'a1b2c3d4-0001-4000-8000-000000000001')
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- 5. LEARNERS  (60 total)
--    Grade 6: 10  |  Grade 7: 9  |  Grade 8: 9  |  Grade 9: 8
--    Grade 10: 10 |  Grade 11: 7 |  Grade 12: 7  = 60
-- =============================================================================
INSERT INTO public.learners
  (id, email, name, school_id, school_class_id, grade, section,
   gender, city, state, country, metadata)
VALUES

-- ── Grade 6 ──────────────────────────────────────────────────────────────────
  (md5('school_demo_v1_aryan.kumar.demo1@greenwood.demo.in')::uuid,         'aryan.kumar.demo1@greenwood.demo.in',         'Aryan Kumar',           'a1b2c3d4-0002-4000-8000-000000000002', md5('demo_class_grade6a')::uuid,  '6',  'A', 'male',   'Chennai',    'Tamil Nadu',    'India', '{"is_demo":true,"demo_batch":"school_admin_demo_v1"}'),
  (md5('school_demo_v1_diya.sharma.demo2@greenwood.demo.in')::uuid,         'diya.sharma.demo2@greenwood.demo.in',         'Diya Sharma',           'a1b2c3d4-0002-4000-8000-000000000002', md5('demo_class_grade6a')::uuid,  '6',  'A', 'female', 'Chennai',    'Tamil Nadu',    'India', '{"is_demo":true,"demo_batch":"school_admin_demo_v1"}'),
  (md5('school_demo_v1_mithun.raj.demo3@greenwood.demo.in')::uuid,          'mithun.raj.demo3@greenwood.demo.in',          'Mithun Raj',            'a1b2c3d4-0002-4000-8000-000000000002', md5('demo_class_grade6a')::uuid,  '6',  'A', 'male',   'Coimbatore', 'Tamil Nadu',    'India', '{"is_demo":true,"demo_batch":"school_admin_demo_v1"}'),
  (md5('school_demo_v1_keerthana.pillai.demo4@greenwood.demo.in')::uuid,    'keerthana.pillai.demo4@greenwood.demo.in',    'Keerthana Pillai',      'a1b2c3d4-0002-4000-8000-000000000002', md5('demo_class_grade6a')::uuid,  '6',  'A', 'female', 'Madurai',    'Tamil Nadu',    'India', '{"is_demo":true,"demo_batch":"school_admin_demo_v1"}'),
  (md5('school_demo_v1_rohit.singh.demo5@greenwood.demo.in')::uuid,         'rohit.singh.demo5@greenwood.demo.in',         'Rohit Singh',           'a1b2c3d4-0002-4000-8000-000000000002', md5('demo_class_grade6a')::uuid,  '6',  'A', 'male',   'Chennai',    'Tamil Nadu',    'India', '{"is_demo":true,"demo_batch":"school_admin_demo_v1"}'),
  (md5('school_demo_v1_nithya.krishnan.demo6@greenwood.demo.in')::uuid,     'nithya.krishnan.demo6@greenwood.demo.in',     'Nithya Krishnan',       'a1b2c3d4-0002-4000-8000-000000000002', md5('demo_class_grade6a')::uuid,  '6',  'A', 'female', 'Trichy',     'Tamil Nadu',    'India', '{"is_demo":true,"demo_batch":"school_admin_demo_v1"}'),
  (md5('school_demo_v1_vivek.subramaniam.demo7@greenwood.demo.in')::uuid,   'vivek.subramaniam.demo7@greenwood.demo.in',   'Vivek Subramaniam',     'a1b2c3d4-0002-4000-8000-000000000002', md5('demo_class_grade6a')::uuid,  '6',  'A', 'male',   'Chennai',    'Tamil Nadu',    'India', '{"is_demo":true,"demo_batch":"school_admin_demo_v1"}'),
  (md5('school_demo_v1_saranya.devi.demo8@greenwood.demo.in')::uuid,        'saranya.devi.demo8@greenwood.demo.in',        'Saranya Devi',          'a1b2c3d4-0002-4000-8000-000000000002', md5('demo_class_grade6a')::uuid,  '6',  'A', 'female', 'Salem',      'Tamil Nadu',    'India', '{"is_demo":true,"demo_batch":"school_admin_demo_v1"}'),
  (md5('school_demo_v1_karthik.rajan.demo9@greenwood.demo.in')::uuid,       'karthik.rajan.demo9@greenwood.demo.in',       'Karthik Rajan',         'a1b2c3d4-0002-4000-8000-000000000002', md5('demo_class_grade6a')::uuid,  '6',  'A', 'male',   'Coimbatore', 'Tamil Nadu',    'India', '{"is_demo":true,"demo_batch":"school_admin_demo_v1"}'),
  (md5('school_demo_v1_meghna.nair.demo10@greenwood.demo.in')::uuid,        'meghna.nair.demo10@greenwood.demo.in',        'Meghna Nair',           'a1b2c3d4-0002-4000-8000-000000000002', md5('demo_class_grade6a')::uuid,  '6',  'A', 'female', 'Chennai',    'Tamil Nadu',    'India', '{"is_demo":true,"demo_batch":"school_admin_demo_v1"}'),

-- ── Grade 7 ──────────────────────────────────────────────────────────────────
  (md5('school_demo_v1_deepan.murugan.demo11@greenwood.demo.in')::uuid,     'deepan.murugan.demo11@greenwood.demo.in',     'Deepan Murugan',        'a1b2c3d4-0002-4000-8000-000000000002', md5('demo_class_grade7a')::uuid,  '7',  'A', 'male',   'Madurai',    'Tamil Nadu',    'India', '{"is_demo":true,"demo_batch":"school_admin_demo_v1"}'),
  (md5('school_demo_v1_lavanya.sundaram.demo12@greenwood.demo.in')::uuid,   'lavanya.sundaram.demo12@greenwood.demo.in',   'Lavanya Sundaram',      'a1b2c3d4-0002-4000-8000-000000000002', md5('demo_class_grade7a')::uuid,  '7',  'A', 'female', 'Chennai',    'Tamil Nadu',    'India', '{"is_demo":true,"demo_batch":"school_admin_demo_v1"}'),
  (md5('school_demo_v1_suresh.pandi.demo13@greenwood.demo.in')::uuid,       'suresh.pandi.demo13@greenwood.demo.in',       'Suresh Pandi',          'a1b2c3d4-0002-4000-8000-000000000002', md5('demo_class_grade7a')::uuid,  '7',  'A', 'male',   'Trichy',     'Tamil Nadu',    'India', '{"is_demo":true,"demo_batch":"school_admin_demo_v1"}'),
  (md5('school_demo_v1_preethi.balaji.demo14@greenwood.demo.in')::uuid,     'preethi.balaji.demo14@greenwood.demo.in',     'Preethi Balaji',        'a1b2c3d4-0002-4000-8000-000000000002', md5('demo_class_grade7a')::uuid,  '7',  'A', 'female', 'Coimbatore', 'Tamil Nadu',    'India', '{"is_demo":true,"demo_batch":"school_admin_demo_v1"}'),
  (md5('school_demo_v1_arun.selvam.demo15@greenwood.demo.in')::uuid,        'arun.selvam.demo15@greenwood.demo.in',        'Arun Selvam',           'a1b2c3d4-0002-4000-8000-000000000002', md5('demo_class_grade7a')::uuid,  '7',  'A', 'male',   'Chennai',    'Tamil Nadu',    'India', '{"is_demo":true,"demo_batch":"school_admin_demo_v1"}'),
  (md5('school_demo_v1_vaishnavi.gopal.demo16@greenwood.demo.in')::uuid,    'vaishnavi.gopal.demo16@greenwood.demo.in',    'Vaishnavi Gopal',       'a1b2c3d4-0002-4000-8000-000000000002', md5('demo_class_grade7a')::uuid,  '7',  'A', 'female', 'Salem',      'Tamil Nadu',    'India', '{"is_demo":true,"demo_batch":"school_admin_demo_v1"}'),
  (md5('school_demo_v1_nikhil.verma.demo17@greenwood.demo.in')::uuid,       'nikhil.verma.demo17@greenwood.demo.in',       'Nikhil Verma',          'a1b2c3d4-0002-4000-8000-000000000002', md5('demo_class_grade7a')::uuid,  '7',  'A', 'male',   'Chennai',    'Tamil Nadu',    'India', '{"is_demo":true,"demo_batch":"school_admin_demo_v1"}'),
  (md5('school_demo_v1_bhavna.reddy.demo18@greenwood.demo.in')::uuid,       'bhavna.reddy.demo18@greenwood.demo.in',       'Bhavna Reddy',          'a1b2c3d4-0002-4000-8000-000000000002', md5('demo_class_grade7a')::uuid,  '7',  'A', 'female', 'Madurai',    'Tamil Nadu',    'India', '{"is_demo":true,"demo_batch":"school_admin_demo_v1"}'),
  (md5('school_demo_v1_aditya.chandra.demo19@greenwood.demo.in')::uuid,     'aditya.chandra.demo19@greenwood.demo.in',     'Aditya Chandra',        'a1b2c3d4-0002-4000-8000-000000000002', md5('demo_class_grade7a')::uuid,  '7',  'A', 'male',   'Coimbatore', 'Tamil Nadu',    'India', '{"is_demo":true,"demo_batch":"school_admin_demo_v1"}'),

-- ── Grade 8 ──────────────────────────────────────────────────────────────────
  (md5('school_demo_v1_ramya.krishnamurthy.demo20@greenwood.demo.in')::uuid, 'ramya.krishnamurthy.demo20@greenwood.demo.in', 'Ramya Krishnamurthy',  'a1b2c3d4-0002-4000-8000-000000000002', md5('demo_class_grade8a')::uuid,  '8',  'A', 'female', 'Chennai',    'Tamil Nadu',    'India', '{"is_demo":true,"demo_batch":"school_admin_demo_v1"}'),
  (md5('school_demo_v1_sanjay.narayanan.demo21@greenwood.demo.in')::uuid,   'sanjay.narayanan.demo21@greenwood.demo.in',   'Sanjay Narayanan',      'a1b2c3d4-0002-4000-8000-000000000002', md5('demo_class_grade8a')::uuid,  '8',  'A', 'male',   'Trichy',     'Tamil Nadu',    'India', '{"is_demo":true,"demo_batch":"school_admin_demo_v1"}'),
  (md5('school_demo_v1_pooja.venkat.demo22@greenwood.demo.in')::uuid,       'pooja.venkat.demo22@greenwood.demo.in',       'Pooja Venkat',          'a1b2c3d4-0002-4000-8000-000000000002', md5('demo_class_grade8a')::uuid,  '8',  'A', 'female', 'Chennai',    'Tamil Nadu',    'India', '{"is_demo":true,"demo_batch":"school_admin_demo_v1"}'),
  (md5('school_demo_v1_dinesh.babu.demo23@greenwood.demo.in')::uuid,        'dinesh.babu.demo23@greenwood.demo.in',        'Dinesh Babu',           'a1b2c3d4-0002-4000-8000-000000000002', md5('demo_class_grade8a')::uuid,  '8',  'A', 'male',   'Salem',      'Tamil Nadu',    'India', '{"is_demo":true,"demo_batch":"school_admin_demo_v1"}'),
  (md5('school_demo_v1_nandini.patel.demo24@greenwood.demo.in')::uuid,      'nandini.patel.demo24@greenwood.demo.in',      'Nandini Patel',         'a1b2c3d4-0002-4000-8000-000000000002', md5('demo_class_grade8a')::uuid,  '8',  'A', 'female', 'Coimbatore', 'Tamil Nadu',    'India', '{"is_demo":true,"demo_batch":"school_admin_demo_v1"}'),
  (md5('school_demo_v1_harish.pandey.demo25@greenwood.demo.in')::uuid,      'harish.pandey.demo25@greenwood.demo.in',      'Harish Pandey',         'a1b2c3d4-0002-4000-8000-000000000002', md5('demo_class_grade8a')::uuid,  '8',  'A', 'male',   'Chennai',    'Tamil Nadu',    'India', '{"is_demo":true,"demo_batch":"school_admin_demo_v1"}'),
  (md5('school_demo_v1_divya.menon.demo26@greenwood.demo.in')::uuid,        'divya.menon.demo26@greenwood.demo.in',        'Divya Menon',           'a1b2c3d4-0002-4000-8000-000000000002', md5('demo_class_grade8a')::uuid,  '8',  'A', 'female', 'Madurai',    'Tamil Nadu',    'India', '{"is_demo":true,"demo_batch":"school_admin_demo_v1"}'),
  (md5('school_demo_v1_karthi.ravi.demo27@greenwood.demo.in')::uuid,        'karthi.ravi.demo27@greenwood.demo.in',        'Karthi Ravi',           'a1b2c3d4-0002-4000-8000-000000000002', md5('demo_class_grade8a')::uuid,  '8',  'A', 'male',   'Chennai',    'Tamil Nadu',    'India', '{"is_demo":true,"demo_batch":"school_admin_demo_v1"}'),
  (md5('school_demo_v1_sindhu.lakshmanan.demo28@greenwood.demo.in')::uuid,  'sindhu.lakshmanan.demo28@greenwood.demo.in',  'Sindhu Lakshmanan',     'a1b2c3d4-0002-4000-8000-000000000002', md5('demo_class_grade8a')::uuid,  '8',  'A', 'female', 'Trichy',     'Tamil Nadu',    'India', '{"is_demo":true,"demo_batch":"school_admin_demo_v1"}'),

-- ── Grade 9 ──────────────────────────────────────────────────────────────────
  (md5('school_demo_v1_ashwin.thiyagarajan.demo29@greenwood.demo.in')::uuid, 'ashwin.thiyagarajan.demo29@greenwood.demo.in', 'Ashwin Thiyagarajan',  'a1b2c3d4-0002-4000-8000-000000000002', md5('demo_class_grade9a')::uuid,  '9',  'A', 'male',   'Chennai',    'Tamil Nadu',    'India', '{"is_demo":true,"demo_batch":"school_admin_demo_v1"}'),
  (md5('school_demo_v1_renuka.subramanian.demo30@greenwood.demo.in')::uuid,  'renuka.subramanian.demo30@greenwood.demo.in',  'Renuka Subramanian',   'a1b2c3d4-0002-4000-8000-000000000002', md5('demo_class_grade9a')::uuid,  '9',  'A', 'female', 'Coimbatore', 'Tamil Nadu',    'India', '{"is_demo":true,"demo_batch":"school_admin_demo_v1"}'),
  (md5('school_demo_v1_balaji.perumal.demo31@greenwood.demo.in')::uuid,     'balaji.perumal.demo31@greenwood.demo.in',     'Balaji Perumal',        'a1b2c3d4-0002-4000-8000-000000000002', md5('demo_class_grade9a')::uuid,  '9',  'A', 'male',   'Salem',      'Tamil Nadu',    'India', '{"is_demo":true,"demo_batch":"school_admin_demo_v1"}'),
  (md5('school_demo_v1_sowmya.chandrasekhar.demo32@greenwood.demo.in')::uuid,'sowmya.chandrasekhar.demo32@greenwood.demo.in','Sowmya Chandrasekhar', 'a1b2c3d4-0002-4000-8000-000000000002', md5('demo_class_grade9a')::uuid,  '9',  'A', 'female', 'Madurai',    'Tamil Nadu',    'India', '{"is_demo":true,"demo_batch":"school_admin_demo_v1"}'),
  (md5('school_demo_v1_mukesh.pandian.demo33@greenwood.demo.in')::uuid,     'mukesh.pandian.demo33@greenwood.demo.in',     'Mukesh Pandian',        'a1b2c3d4-0002-4000-8000-000000000002', md5('demo_class_grade9a')::uuid,  '9',  'A', 'male',   'Chennai',    'Tamil Nadu',    'India', '{"is_demo":true,"demo_batch":"school_admin_demo_v1"}'),
  (md5('school_demo_v1_asha.ramaswamy.demo34@greenwood.demo.in')::uuid,     'asha.ramaswamy.demo34@greenwood.demo.in',     'Asha Ramaswamy',        'a1b2c3d4-0002-4000-8000-000000000002', md5('demo_class_grade9a')::uuid,  '9',  'A', 'female', 'Trichy',     'Tamil Nadu',    'India', '{"is_demo":true,"demo_batch":"school_admin_demo_v1"}'),
  (md5('school_demo_v1_prabhu.shanmugam.demo35@greenwood.demo.in')::uuid,   'prabhu.shanmugam.demo35@greenwood.demo.in',   'Prabhu Shanmugam',      'a1b2c3d4-0002-4000-8000-000000000002', md5('demo_class_grade9a')::uuid,  '9',  'A', 'male',   'Coimbatore', 'Tamil Nadu',    'India', '{"is_demo":true,"demo_batch":"school_admin_demo_v1"}'),
  (md5('school_demo_v1_sangeetha.raghunathan.demo36@greenwood.demo.in')::uuid,'sangeetha.raghunathan.demo36@greenwood.demo.in','Sangeetha Raghunathan','a1b2c3d4-0002-4000-8000-000000000002', md5('demo_class_grade9a')::uuid, '9',  'A', 'female', 'Chennai',    'Tamil Nadu',    'India', '{"is_demo":true,"demo_batch":"school_admin_demo_v1"}'),

-- ── Grade 10 ─────────────────────────────────────────────────────────────────
  -- SPECIAL: user email
  (md5('school_demo_v1_anandhageethan333@gmail.com')::uuid,                 'anandhageethan333@gmail.com',                 'Anandha Geethan',       'a1b2c3d4-0002-4000-8000-000000000002', md5('demo_class_grade10a')::uuid, '10', 'A', 'male',   'Chennai',    'Tamil Nadu',    'India', '{"is_demo":true,"demo_batch":"school_admin_demo_v1","portfolio":true}'),
  -- SPECIAL: prasath email
  (md5('school_demo_v1_prasath@2621.con')::uuid,                            'prasath@2621.con',                            'Prasath',               'a1b2c3d4-0002-4000-8000-000000000002', md5('demo_class_grade10a')::uuid, '10', 'A', 'male',   'Chennai',    'Tamil Nadu',    'India', '{"is_demo":true,"demo_batch":"school_admin_demo_v1"}'),
  -- PORTFOLIO learner 2
  (md5('school_demo_v1_vignesh.kumar.demo39@greenwood.demo.in')::uuid,      'vignesh.kumar.demo39@greenwood.demo.in',      'Vignesh Kumar',         'a1b2c3d4-0002-4000-8000-000000000002', md5('demo_class_grade10a')::uuid, '10', 'A', 'male',   'Trichy',     'Tamil Nadu',    'India', '{"is_demo":true,"demo_batch":"school_admin_demo_v1","portfolio":true}'),
  (md5('school_demo_v1_kamala.devi.demo40@greenwood.demo.in')::uuid,        'kamala.devi.demo40@greenwood.demo.in',        'Kamala Devi',           'a1b2c3d4-0002-4000-8000-000000000002', md5('demo_class_grade10a')::uuid, '10', 'A', 'female', 'Madurai',    'Tamil Nadu',    'India', '{"is_demo":true,"demo_batch":"school_admin_demo_v1"}'),
  (md5('school_demo_v1_senthil.murugan.demo41@greenwood.demo.in')::uuid,    'senthil.murugan.demo41@greenwood.demo.in',    'Senthil Murugan',       'a1b2c3d4-0002-4000-8000-000000000002', md5('demo_class_grade10a')::uuid, '10', 'A', 'male',   'Salem',      'Tamil Nadu',    'India', '{"is_demo":true,"demo_batch":"school_admin_demo_v1"}'),
  (md5('school_demo_v1_girija.annamalai.demo42@greenwood.demo.in')::uuid,   'girija.annamalai.demo42@greenwood.demo.in',   'Girija Annamalai',      'a1b2c3d4-0002-4000-8000-000000000002', md5('demo_class_grade10a')::uuid, '10', 'A', 'female', 'Chennai',    'Tamil Nadu',    'India', '{"is_demo":true,"demo_batch":"school_admin_demo_v1"}'),
  (md5('school_demo_v1_bharath.raja.demo43@greenwood.demo.in')::uuid,       'bharath.raja.demo43@greenwood.demo.in',       'Bharath Raja',          'a1b2c3d4-0002-4000-8000-000000000002', md5('demo_class_grade10a')::uuid, '10', 'A', 'male',   'Coimbatore', 'Tamil Nadu',    'India', '{"is_demo":true,"demo_batch":"school_admin_demo_v1"}'),
  (md5('school_demo_v1_mythili.krishnan.demo44@greenwood.demo.in')::uuid,   'mythili.krishnan.demo44@greenwood.demo.in',   'Mythili Krishnan',      'a1b2c3d4-0002-4000-8000-000000000002', md5('demo_class_grade10a')::uuid, '10', 'A', 'female', 'Chennai',    'Tamil Nadu',    'India', '{"is_demo":true,"demo_batch":"school_admin_demo_v1"}'),
  (md5('school_demo_v1_gopal.natarajan.demo45@greenwood.demo.in')::uuid,    'gopal.natarajan.demo45@greenwood.demo.in',    'Gopal Natarajan',       'a1b2c3d4-0002-4000-8000-000000000002', md5('demo_class_grade10a')::uuid, '10', 'A', 'male',   'Madurai',    'Tamil Nadu',    'India', '{"is_demo":true,"demo_batch":"school_admin_demo_v1"}'),
  (md5('school_demo_v1_anitha.suresh.demo46@greenwood.demo.in')::uuid,      'anitha.suresh.demo46@greenwood.demo.in',      'Anitha Suresh',         'a1b2c3d4-0002-4000-8000-000000000002', md5('demo_class_grade10a')::uuid, '10', 'A', 'female', 'Trichy',     'Tamil Nadu',    'India', '{"is_demo":true,"demo_batch":"school_admin_demo_v1"}'),

-- ── Grade 11 ─────────────────────────────────────────────────────────────────
  -- PORTFOLIO learner 3
  (md5('school_demo_v1_priyadharshini.rajan.demo47@greenwood.demo.in')::uuid,'priyadharshini.rajan.demo47@greenwood.demo.in','Priyadharshini Rajan', 'a1b2c3d4-0002-4000-8000-000000000002', md5('demo_class_grade11a')::uuid, '11', 'A', 'female', 'Chennai',    'Tamil Nadu',    'India', '{"is_demo":true,"demo_batch":"school_admin_demo_v1","portfolio":true}'),
  (md5('school_demo_v1_surya.prakash.demo48@greenwood.demo.in')::uuid,      'surya.prakash.demo48@greenwood.demo.in',      'Surya Prakash',         'a1b2c3d4-0002-4000-8000-000000000002', md5('demo_class_grade11a')::uuid, '11', 'A', 'male',   'Coimbatore', 'Tamil Nadu',    'India', '{"is_demo":true,"demo_batch":"school_admin_demo_v1"}'),
  (md5('school_demo_v1_kavitha.mani.demo49@greenwood.demo.in')::uuid,       'kavitha.mani.demo49@greenwood.demo.in',       'Kavitha Mani',          'a1b2c3d4-0002-4000-8000-000000000002', md5('demo_class_grade11a')::uuid, '11', 'A', 'female', 'Salem',      'Tamil Nadu',    'India', '{"is_demo":true,"demo_batch":"school_admin_demo_v1"}'),
  (md5('school_demo_v1_madhan.kumar.demo50@greenwood.demo.in')::uuid,       'madhan.kumar.demo50@greenwood.demo.in',       'Madhan Kumar',          'a1b2c3d4-0002-4000-8000-000000000002', md5('demo_class_grade11a')::uuid, '11', 'A', 'male',   'Chennai',    'Tamil Nadu',    'India', '{"is_demo":true,"demo_batch":"school_admin_demo_v1"}'),
  (md5('school_demo_v1_rukmini.devi.demo51@greenwood.demo.in')::uuid,       'rukmini.devi.demo51@greenwood.demo.in',       'Rukmini Devi',          'a1b2c3d4-0002-4000-8000-000000000002', md5('demo_class_grade11a')::uuid, '11', 'A', 'female', 'Madurai',    'Tamil Nadu',    'India', '{"is_demo":true,"demo_batch":"school_admin_demo_v1"}'),
  (md5('school_demo_v1_ajith.krishnamurthy.demo52@greenwood.demo.in')::uuid, 'ajith.krishnamurthy.demo52@greenwood.demo.in', 'Ajith Krishnamurthy',  'a1b2c3d4-0002-4000-8000-000000000002', md5('demo_class_grade11a')::uuid, '11', 'A', 'male',   'Trichy',     'Tamil Nadu',    'India', '{"is_demo":true,"demo_batch":"school_admin_demo_v1"}'),
  (md5('school_demo_v1_thenmozhi.pandian.demo53@greenwood.demo.in')::uuid,  'thenmozhi.pandian.demo53@greenwood.demo.in',  'Thenmozhi Pandian',     'a1b2c3d4-0002-4000-8000-000000000002', md5('demo_class_grade11a')::uuid, '11', 'A', 'female', 'Chennai',    'Tamil Nadu',    'India', '{"is_demo":true,"demo_batch":"school_admin_demo_v1"}'),

-- ── Grade 12 ─────────────────────────────────────────────────────────────────
  (md5('school_demo_v1_shankar.rajan.demo54@greenwood.demo.in')::uuid,      'shankar.rajan.demo54@greenwood.demo.in',      'Shankar Rajan',         'a1b2c3d4-0002-4000-8000-000000000002', md5('demo_class_grade12a')::uuid, '12', 'A', 'male',   'Chennai',    'Tamil Nadu',    'India', '{"is_demo":true,"demo_batch":"school_admin_demo_v1"}'),
  (md5('school_demo_v1_brinda.subramaniam.demo55@greenwood.demo.in')::uuid, 'brinda.subramaniam.demo55@greenwood.demo.in', 'Brinda Subramaniam',    'a1b2c3d4-0002-4000-8000-000000000002', md5('demo_class_grade12a')::uuid, '12', 'A', 'female', 'Coimbatore', 'Tamil Nadu',    'India', '{"is_demo":true,"demo_batch":"school_admin_demo_v1"}'),
  (md5('school_demo_v1_murugan.panneerselvam.demo56@greenwood.demo.in')::uuid,'murugan.panneerselvam.demo56@greenwood.demo.in','Murugan Panneerselvam','a1b2c3d4-0002-4000-8000-000000000002', md5('demo_class_grade12a')::uuid,'12', 'A', 'male',   'Salem',      'Tamil Nadu',    'India', '{"is_demo":true,"demo_batch":"school_admin_demo_v1"}'),
  (md5('school_demo_v1_pavithra.krishnaswamy.demo57@greenwood.demo.in')::uuid,'pavithra.krishnaswamy.demo57@greenwood.demo.in','Pavithra Krishnaswamy','a1b2c3d4-0002-4000-8000-000000000002',md5('demo_class_grade12a')::uuid,'12', 'A', 'female', 'Madurai',    'Tamil Nadu',    'India', '{"is_demo":true,"demo_batch":"school_admin_demo_v1"}'),
  (md5('school_demo_v1_rajan.sundararajan.demo58@greenwood.demo.in')::uuid, 'rajan.sundararajan.demo58@greenwood.demo.in', 'Rajan Sundararajan',    'a1b2c3d4-0002-4000-8000-000000000002', md5('demo_class_grade12a')::uuid, '12', 'A', 'male',   'Trichy',     'Tamil Nadu',    'India', '{"is_demo":true,"demo_batch":"school_admin_demo_v1"}'),
  (md5('school_demo_v1_latha.ramalingam.demo59@greenwood.demo.in')::uuid,   'latha.ramalingam.demo59@greenwood.demo.in',   'Latha Ramalingam',      'a1b2c3d4-0002-4000-8000-000000000002', md5('demo_class_grade12a')::uuid, '12', 'A', 'female', 'Chennai',    'Tamil Nadu',    'India', '{"is_demo":true,"demo_batch":"school_admin_demo_v1"}'),
  (md5('school_demo_v1_subramaniam.pillai.demo60@greenwood.demo.in')::uuid, 'subramaniam.pillai.demo60@greenwood.demo.in', 'Subramaniam Pillai',    'a1b2c3d4-0002-4000-8000-000000000002', md5('demo_class_grade12a')::uuid, '12', 'A', 'male',   'Coimbatore', 'Tamil Nadu',    'India', '{"is_demo":true,"demo_batch":"school_admin_demo_v1"}')

ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- 6. ADMISSION APPLICATIONS  (60 records — one per learner)
-- =============================================================================
INSERT INTO public.admission_applications
  (id, school_id, application_number, learner_name, date_of_birth, gender,
   email, phone, father_name, mother_name, address, city, state, pincode,
   applied_for, status, fee_status, fee_amount, fee_paid)
VALUES
  (md5('demo_adm_aryan')::uuid,            'a1b2c3d4-0002-4000-8000-000000000002', 'DEMO-GWH-001', 'Aryan Kumar',           '2015-04-10', 'male',   'aryan.kumar.demo1@greenwood.demo.in',           '+91-9900000001', 'Ramesh Kumar',         'Sunita Kumar',         '12 Rose Street',       'Chennai',    'Tamil Nadu', '600001', 'Grade 6',  'approved', 'paid', 25000, 25000),
  (md5('demo_adm_diya')::uuid,             'a1b2c3d4-0002-4000-8000-000000000002', 'DEMO-GWH-002', 'Diya Sharma',           '2015-07-22', 'female', 'diya.sharma.demo2@greenwood.demo.in',           '+91-9900000002', 'Vikas Sharma',         'Pooja Sharma',         '34 MG Road',           'Chennai',    'Tamil Nadu', '600002', 'Grade 6',  'approved', 'paid', 25000, 25000),
  (md5('demo_adm_mithun')::uuid,           'a1b2c3d4-0002-4000-8000-000000000002', 'DEMO-GWH-003', 'Mithun Raj',            '2015-01-15', 'male',   'mithun.raj.demo3@greenwood.demo.in',            '+91-9900000003', 'Sunil Raj',            'Meena Raj',            '56 Anna Nagar',        'Coimbatore', 'Tamil Nadu', '641001', 'Grade 6',  'approved', 'paid', 25000, 25000),
  (md5('demo_adm_keerthana')::uuid,        'a1b2c3d4-0002-4000-8000-000000000002', 'DEMO-GWH-004', 'Keerthana Pillai',      '2015-09-05', 'female', 'keerthana.pillai.demo4@greenwood.demo.in',      '+91-9900000004', 'Rajan Pillai',         'Leela Pillai',         '78 Nehru Street',      'Madurai',    'Tamil Nadu', '625001', 'Grade 6',  'approved', 'paid', 25000, 25000),
  (md5('demo_adm_rohit')::uuid,            'a1b2c3d4-0002-4000-8000-000000000002', 'DEMO-GWH-005', 'Rohit Singh',           '2015-11-30', 'male',   'rohit.singh.demo5@greenwood.demo.in',           '+91-9900000005', 'Amit Singh',           'Kavita Singh',         '90 LB Road',           'Chennai',    'Tamil Nadu', '600003', 'Grade 6',  'approved', 'paid', 25000, 25000),
  (md5('demo_adm_nithya')::uuid,           'a1b2c3d4-0002-4000-8000-000000000002', 'DEMO-GWH-006', 'Nithya Krishnan',       '2015-03-18', 'female', 'nithya.krishnan.demo6@greenwood.demo.in',       '+91-9900000006', 'Krishnan S',           'Revathi Krishnan',     '23 Patel Nagar',       'Trichy',     'Tamil Nadu', '620001', 'Grade 6',  'approved', 'paid', 25000, 25000),
  (md5('demo_adm_vivek')::uuid,            'a1b2c3d4-0002-4000-8000-000000000002', 'DEMO-GWH-007', 'Vivek Subramaniam',     '2015-06-25', 'male',   'vivek.subramaniam.demo7@greenwood.demo.in',     '+91-9900000007', 'Subramaniam P',        'Usha Subramaniam',     '45 Gandhi Road',       'Chennai',    'Tamil Nadu', '600004', 'Grade 6',  'approved', 'paid', 25000, 25000),
  (md5('demo_adm_saranya')::uuid,          'a1b2c3d4-0002-4000-8000-000000000002', 'DEMO-GWH-008', 'Saranya Devi',          '2015-08-14', 'female', 'saranya.devi.demo8@greenwood.demo.in',          '+91-9900000008', 'Murugan D',            'Saroja Murugan',       '67 Bharathi Street',   'Salem',      'Tamil Nadu', '636001', 'Grade 6',  'approved', 'paid', 25000, 25000),
  (md5('demo_adm_karthik')::uuid,          'a1b2c3d4-0002-4000-8000-000000000002', 'DEMO-GWH-009', 'Karthik Rajan',         '2015-02-28', 'male',   'karthik.rajan.demo9@greenwood.demo.in',         '+91-9900000009', 'Rajan K',              'Vimala Rajan',         '89 Station Road',      'Coimbatore', 'Tamil Nadu', '641002', 'Grade 6',  'approved', 'paid', 25000, 25000),
  (md5('demo_adm_meghna')::uuid,           'a1b2c3d4-0002-4000-8000-000000000002', 'DEMO-GWH-010', 'Meghna Nair',           '2015-12-03', 'female', 'meghna.nair.demo10@greenwood.demo.in',          '+91-9900000010', 'Nair V',               'Sudha Nair',           '11 Beach Road',        'Chennai',    'Tamil Nadu', '600005', 'Grade 6',  'approved', 'paid', 25000, 25000),
  (md5('demo_adm_deepan')::uuid,           'a1b2c3d4-0002-4000-8000-000000000002', 'DEMO-GWH-011', 'Deepan Murugan',        '2014-05-17', 'male',   'deepan.murugan.demo11@greenwood.demo.in',       '+91-9900000011', 'Murugan R',            'Kamala Murugan',       '22 West Street',       'Madurai',    'Tamil Nadu', '625002', 'Grade 7',  'approved', 'paid', 25000, 25000),
  (md5('demo_adm_lavanya')::uuid,          'a1b2c3d4-0002-4000-8000-000000000002', 'DEMO-GWH-012', 'Lavanya Sundaram',      '2014-09-20', 'female', 'lavanya.sundaram.demo12@greenwood.demo.in',     '+91-9900000012', 'Sundaram K',           'Mythili Sundaram',     '33 East Street',       'Chennai',    'Tamil Nadu', '600006', 'Grade 7',  'approved', 'paid', 25000, 25000),
  (md5('demo_adm_sureshp')::uuid,          'a1b2c3d4-0002-4000-8000-000000000002', 'DEMO-GWH-013', 'Suresh Pandi',          '2014-01-08', 'male',   'suresh.pandi.demo13@greenwood.demo.in',         '+91-9900000013', 'Pandi S',              'Ponni Pandi',          '44 North Street',      'Trichy',     'Tamil Nadu', '620002', 'Grade 7',  'approved', 'paid', 25000, 25000),
  (md5('demo_adm_preethi')::uuid,          'a1b2c3d4-0002-4000-8000-000000000002', 'DEMO-GWH-014', 'Preethi Balaji',        '2014-11-11', 'female', 'preethi.balaji.demo14@greenwood.demo.in',       '+91-9900000014', 'Balaji R',             'Chitra Balaji',        '55 South Street',      'Coimbatore', 'Tamil Nadu', '641003', 'Grade 7',  'approved', 'paid', 25000, 25000),
  (md5('demo_adm_arun')::uuid,             'a1b2c3d4-0002-4000-8000-000000000002', 'DEMO-GWH-015', 'Arun Selvam',           '2014-03-24', 'male',   'arun.selvam.demo15@greenwood.demo.in',          '+91-9900000015', 'Selvam A',             'Meenakshi Selvam',     '66 Central Road',      'Chennai',    'Tamil Nadu', '600007', 'Grade 7',  'approved', 'paid', 25000, 25000),
  (md5('demo_adm_vaishnavi')::uuid,        'a1b2c3d4-0002-4000-8000-000000000002', 'DEMO-GWH-016', 'Vaishnavi Gopal',       '2014-07-07', 'female', 'vaishnavi.gopal.demo16@greenwood.demo.in',      '+91-9900000016', 'Gopal M',              'Revathi Gopal',        '77 Market Street',     'Salem',      'Tamil Nadu', '636002', 'Grade 7',  'approved', 'paid', 25000, 25000),
  (md5('demo_adm_nikhil')::uuid,           'a1b2c3d4-0002-4000-8000-000000000002', 'DEMO-GWH-017', 'Nikhil Verma',          '2014-10-19', 'male',   'nikhil.verma.demo17@greenwood.demo.in',         '+91-9900000017', 'Verma P',              'Sunita Verma',         '88 Lake Road',         'Chennai',    'Tamil Nadu', '600008', 'Grade 7',  'approved', 'paid', 25000, 25000),
  (md5('demo_adm_bhavna')::uuid,           'a1b2c3d4-0002-4000-8000-000000000002', 'DEMO-GWH-018', 'Bhavna Reddy',          '2014-02-13', 'female', 'bhavna.reddy.demo18@greenwood.demo.in',         '+91-9900000018', 'Reddy K',              'Laxmi Reddy',          '99 Hill Street',       'Madurai',    'Tamil Nadu', '625003', 'Grade 7',  'approved', 'paid', 25000, 25000),
  (md5('demo_adm_aditya')::uuid,           'a1b2c3d4-0002-4000-8000-000000000002', 'DEMO-GWH-019', 'Aditya Chandra',        '2014-06-30', 'male',   'aditya.chandra.demo19@greenwood.demo.in',       '+91-9900000019', 'Chandra V',            'Priya Chandra',        '10 Park Avenue',       'Coimbatore', 'Tamil Nadu', '641004', 'Grade 7',  'approved', 'paid', 25000, 25000),
  (md5('demo_adm_ramya')::uuid,            'a1b2c3d4-0002-4000-8000-000000000002', 'DEMO-GWH-020', 'Ramya Krishnamurthy',   '2013-04-16', 'female', 'ramya.krishnamurthy.demo20@greenwood.demo.in',  '+91-9900000020', 'Krishnamurthy S',      'Usha Krishnamurthy',   '21 Temple Street',     'Chennai',    'Tamil Nadu', '600009', 'Grade 8',  'approved', 'paid', 25000, 25000),
  (md5('demo_adm_sanjay')::uuid,           'a1b2c3d4-0002-4000-8000-000000000002', 'DEMO-GWH-021', 'Sanjay Narayanan',      '2013-08-09', 'male',   'sanjay.narayanan.demo21@greenwood.demo.in',     '+91-9900000021', 'Narayanan R',          'Pushpa Narayanan',     '32 Bridge Road',       'Trichy',     'Tamil Nadu', '620003', 'Grade 8',  'approved', 'paid', 25000, 25000),
  (md5('demo_adm_pooja')::uuid,            'a1b2c3d4-0002-4000-8000-000000000002', 'DEMO-GWH-022', 'Pooja Venkat',          '2013-12-01', 'female', 'pooja.venkat.demo22@greenwood.demo.in',         '+91-9900000022', 'Venkat R',             'Hema Venkat',          '43 Garden Road',       'Chennai',    'Tamil Nadu', '600010', 'Grade 8',  'approved', 'paid', 25000, 25000),
  (md5('demo_adm_dinesh')::uuid,           'a1b2c3d4-0002-4000-8000-000000000002', 'DEMO-GWH-023', 'Dinesh Babu',           '2013-05-25', 'male',   'dinesh.babu.demo23@greenwood.demo.in',          '+91-9900000023', 'Babu S',               'Kamala Babu',          '54 Fort Road',         'Salem',      'Tamil Nadu', '636003', 'Grade 8',  'approved', 'paid', 25000, 25000),
  (md5('demo_adm_nandini')::uuid,          'a1b2c3d4-0002-4000-8000-000000000002', 'DEMO-GWH-024', 'Nandini Patel',         '2013-10-08', 'female', 'nandini.patel.demo24@greenwood.demo.in',        '+91-9900000024', 'Patel H',              'Reena Patel',          '65 Orchard Lane',      'Coimbatore', 'Tamil Nadu', '641005', 'Grade 8',  'approved', 'paid', 25000, 25000),
  (md5('demo_adm_harish')::uuid,           'a1b2c3d4-0002-4000-8000-000000000002', 'DEMO-GWH-025', 'Harish Pandey',         '2013-02-20', 'male',   'harish.pandey.demo25@greenwood.demo.in',        '+91-9900000025', 'Pandey V',             'Sunita Pandey',        '76 River View',        'Chennai',    'Tamil Nadu', '600011', 'Grade 8',  'approved', 'paid', 25000, 25000),
  (md5('demo_adm_divya')::uuid,            'a1b2c3d4-0002-4000-8000-000000000002', 'DEMO-GWH-026', 'Divya Menon',           '2013-07-13', 'female', 'divya.menon.demo26@greenwood.demo.in',          '+91-9900000026', 'Menon P',              'Sindhu Menon',         '87 Palace Road',       'Madurai',    'Tamil Nadu', '625004', 'Grade 8',  'approved', 'paid', 25000, 25000),
  (md5('demo_adm_karthi')::uuid,           'a1b2c3d4-0002-4000-8000-000000000002', 'DEMO-GWH-027', 'Karthi Ravi',           '2013-11-27', 'male',   'karthi.ravi.demo27@greenwood.demo.in',          '+91-9900000027', 'Ravi M',               'Uma Ravi',             '98 Sea Shore Road',    'Chennai',    'Tamil Nadu', '600012', 'Grade 8',  'approved', 'paid', 25000, 25000),
  (md5('demo_adm_sindhu')::uuid,           'a1b2c3d4-0002-4000-8000-000000000002', 'DEMO-GWH-028', 'Sindhu Lakshmanan',     '2013-03-06', 'female', 'sindhu.lakshmanan.demo28@greenwood.demo.in',    '+91-9900000028', 'Lakshmanan R',         'Vasantha Lakshmanan',  '19 Canal Bank Road',   'Trichy',     'Tamil Nadu', '620004', 'Grade 8',  'approved', 'paid', 25000, 25000),
  (md5('demo_adm_ashwin')::uuid,           'a1b2c3d4-0002-4000-8000-000000000002', 'DEMO-GWH-029', 'Ashwin Thiyagarajan',   '2012-06-14', 'male',   'ashwin.thiyagarajan.demo29@greenwood.demo.in',  '+91-9900000029', 'Thiyagarajan K',       'Meena Thiyagarajan',   '30 Bazaar Street',     'Chennai',    'Tamil Nadu', '600013', 'Grade 9',  'approved', 'paid', 28000, 28000),
  (md5('demo_adm_renuka')::uuid,           'a1b2c3d4-0002-4000-8000-000000000002', 'DEMO-GWH-030', 'Renuka Subramanian',    '2012-10-29', 'female', 'renuka.subramanian.demo30@greenwood.demo.in',   '+91-9900000030', 'Subramanian P',        'Kamakshi Subramanian', '41 College Road',      'Coimbatore', 'Tamil Nadu', '641006', 'Grade 9',  'approved', 'paid', 28000, 28000),
  (md5('demo_adm_balaji')::uuid,           'a1b2c3d4-0002-4000-8000-000000000002', 'DEMO-GWH-031', 'Balaji Perumal',        '2012-02-07', 'male',   'balaji.perumal.demo31@greenwood.demo.in',       '+91-9900000031', 'Perumal S',            'Selvi Perumal',        '52 Cross Street',      'Salem',      'Tamil Nadu', '636004', 'Grade 9',  'approved', 'paid', 28000, 28000),
  (md5('demo_adm_sowmya')::uuid,           'a1b2c3d4-0002-4000-8000-000000000002', 'DEMO-GWH-032', 'Sowmya Chandrasekhar',  '2012-08-18', 'female', 'sowmya.chandrasekhar.demo32@greenwood.demo.in', '+91-9900000032', 'Chandrasekhar N',      'Parvathi Chandrasekhar','63 Main Road',         'Madurai',    'Tamil Nadu', '625005', 'Grade 9',  'approved', 'paid', 28000, 28000),
  (md5('demo_adm_mukesh')::uuid,           'a1b2c3d4-0002-4000-8000-000000000002', 'DEMO-GWH-033', 'Mukesh Pandian',        '2012-04-22', 'male',   'mukesh.pandian.demo33@greenwood.demo.in',       '+91-9900000033', 'Pandian K',            'Jothi Pandian',        '74 New Street',        'Chennai',    'Tamil Nadu', '600014', 'Grade 9',  'approved', 'paid', 28000, 28000),
  (md5('demo_adm_asha')::uuid,             'a1b2c3d4-0002-4000-8000-000000000002', 'DEMO-GWH-034', 'Asha Ramaswamy',        '2012-12-11', 'female', 'asha.ramaswamy.demo34@greenwood.demo.in',       '+91-9900000034', 'Ramaswamy S',          'Vani Ramaswamy',       '85 Old Road',          'Trichy',     'Tamil Nadu', '620005', 'Grade 9',  'approved', 'paid', 28000, 28000),
  (md5('demo_adm_prabhu')::uuid,           'a1b2c3d4-0002-4000-8000-000000000002', 'DEMO-GWH-035', 'Prabhu Shanmugam',      '2012-05-05', 'male',   'prabhu.shanmugam.demo35@greenwood.demo.in',     '+91-9900000035', 'Shanmugam V',          'Meenakshi Shanmugam',  '96 Junction Road',     'Coimbatore', 'Tamil Nadu', '641007', 'Grade 9',  'approved', 'paid', 28000, 28000),
  (md5('demo_adm_sangeetha')::uuid,        'a1b2c3d4-0002-4000-8000-000000000002', 'DEMO-GWH-036', 'Sangeetha Raghunathan', '2012-09-26', 'female', 'sangeetha.raghunathan.demo36@greenwood.demo.in','+91-9900000036', 'Raghunathan P',        'Uma Raghunathan',      '17 Canal Road',        'Chennai',    'Tamil Nadu', '600015', 'Grade 9',  'approved', 'paid', 28000, 28000),
  (md5('demo_adm_anandha')::uuid,          'a1b2c3d4-0002-4000-8000-000000000002', 'DEMO-GWH-037', 'Anandha Geethan',       '2011-07-03', 'male',   'anandhageethan333@gmail.com',                   '+91-9900000037', 'Geethan R',            'Priya Geethan',        '28 Mint Street',       'Chennai',    'Tamil Nadu', '600016', 'Grade 10', 'approved', 'paid', 30000, 30000),
  (md5('demo_adm_prasath')::uuid,          'a1b2c3d4-0002-4000-8000-000000000002', 'DEMO-GWH-038', 'Prasath',               '2011-11-15', 'male',   'prasath@2621.con',                              '+91-9900000038', 'Kumar P',              'Malar Kumar',          '39 High Road',         'Chennai',    'Tamil Nadu', '600017', 'Grade 10', 'approved', 'paid', 30000, 30000),
  (md5('demo_adm_vignesh')::uuid,          'a1b2c3d4-0002-4000-8000-000000000002', 'DEMO-GWH-039', 'Vignesh Kumar',         '2011-03-27', 'male',   'vignesh.kumar.demo39@greenwood.demo.in',        '+91-9900000039', 'Kumar S',              'Vasantha Kumar',       '50 Tank Road',         'Trichy',     'Tamil Nadu', '620006', 'Grade 10', 'approved', 'paid', 30000, 30000),
  (md5('demo_adm_kamala')::uuid,           'a1b2c3d4-0002-4000-8000-000000000002', 'DEMO-GWH-040', 'Kamala Devi',           '2011-09-08', 'female', 'kamala.devi.demo40@greenwood.demo.in',          '+91-9900000040', 'Devi R',               'Saraswathi Devi',      '61 Fort Street',       'Madurai',    'Tamil Nadu', '625006', 'Grade 10', 'approved', 'paid', 30000, 30000),
  (md5('demo_adm_senthil2')::uuid,         'a1b2c3d4-0002-4000-8000-000000000002', 'DEMO-GWH-041', 'Senthil Murugan',       '2011-01-20', 'male',   'senthil.murugan.demo41@greenwood.demo.in',      '+91-9900000041', 'Murugan T',            'Chellammal Murugan',   '72 Bus Stand Road',    'Salem',      'Tamil Nadu', '636005', 'Grade 10', 'approved', 'paid', 30000, 30000),
  (md5('demo_adm_girija')::uuid,           'a1b2c3d4-0002-4000-8000-000000000002', 'DEMO-GWH-042', 'Girija Annamalai',      '2011-05-12', 'female', 'girija.annamalai.demo42@greenwood.demo.in',     '+91-9900000042', 'Annamalai S',          'Krishnaveni Annamalai','83 Kovil Street',       'Chennai',    'Tamil Nadu', '600018', 'Grade 10', 'approved', 'paid', 30000, 30000),
  (md5('demo_adm_bharath')::uuid,          'a1b2c3d4-0002-4000-8000-000000000002', 'DEMO-GWH-043', 'Bharath Raja',          '2011-10-04', 'male',   'bharath.raja.demo43@greenwood.demo.in',         '+91-9900000043', 'Raja M',               'Chandra Raja',         '94 Raja Street',       'Coimbatore', 'Tamil Nadu', '641008', 'Grade 10', 'approved', 'paid', 30000, 30000),
  (md5('demo_adm_mythili')::uuid,          'a1b2c3d4-0002-4000-8000-000000000002', 'DEMO-GWH-044', 'Mythili Krishnan',      '2011-02-16', 'female', 'mythili.krishnan.demo44@greenwood.demo.in',     '+91-9900000044', 'Krishnan M',           'Santha Krishnan',      '15 Bazaar Road',       'Chennai',    'Tamil Nadu', '600019', 'Grade 10', 'approved', 'paid', 30000, 30000),
  (md5('demo_adm_gopal')::uuid,            'a1b2c3d4-0002-4000-8000-000000000002', 'DEMO-GWH-045', 'Gopal Natarajan',       '2011-08-29', 'male',   'gopal.natarajan.demo45@greenwood.demo.in',      '+91-9900000045', 'Natarajan G',          'Parvathi Natarajan',   '26 Flower Road',       'Madurai',    'Tamil Nadu', '625007', 'Grade 10', 'approved', 'paid', 30000, 30000),
  (md5('demo_adm_anitha2')::uuid,          'a1b2c3d4-0002-4000-8000-000000000002', 'DEMO-GWH-046', 'Anitha Suresh',         '2011-06-01', 'female', 'anitha.suresh.demo46@greenwood.demo.in',        '+91-9900000046', 'Suresh B',             'Vasantha Suresh',      '37 Garden Lane',       'Trichy',     'Tamil Nadu', '620007', 'Grade 10', 'approved', 'paid', 30000, 30000),
  (md5('demo_adm_priyadharshini')::uuid,   'a1b2c3d4-0002-4000-8000-000000000002', 'DEMO-GWH-047', 'Priyadharshini Rajan',  '2010-04-18', 'female', 'priyadharshini.rajan.demo47@greenwood.demo.in', '+91-9900000047', 'Rajan S',              'Ambika Rajan',         '48 Mission Street',    'Chennai',    'Tamil Nadu', '600020', 'Grade 11', 'approved', 'paid', 32000, 32000),
  (md5('demo_adm_surya')::uuid,            'a1b2c3d4-0002-4000-8000-000000000002', 'DEMO-GWH-048', 'Surya Prakash',         '2010-09-07', 'male',   'surya.prakash.demo48@greenwood.demo.in',        '+91-9900000048', 'Prakash R',            'Hema Prakash',         '59 Mosque Street',     'Coimbatore', 'Tamil Nadu', '641009', 'Grade 11', 'approved', 'paid', 32000, 32000),
  (md5('demo_adm_kavitham')::uuid,         'a1b2c3d4-0002-4000-8000-000000000002', 'DEMO-GWH-049', 'Kavitha Mani',          '2010-01-23', 'female', 'kavitha.mani.demo49@greenwood.demo.in',         '+91-9900000049', 'Mani K',               'Bama Mani',            '70 Church Street',     'Salem',      'Tamil Nadu', '636006', 'Grade 11', 'approved', 'paid', 32000, 32000),
  (md5('demo_adm_madhan')::uuid,           'a1b2c3d4-0002-4000-8000-000000000002', 'DEMO-GWH-050', 'Madhan Kumar',          '2010-07-10', 'male',   'madhan.kumar.demo50@greenwood.demo.in',         '+91-9900000050', 'Kumar V',              'Selvi Kumar',          '81 School Road',       'Chennai',    'Tamil Nadu', '600021', 'Grade 11', 'approved', 'paid', 32000, 32000),
  (md5('demo_adm_rukmini')::uuid,          'a1b2c3d4-0002-4000-8000-000000000002', 'DEMO-GWH-051', 'Rukmini Devi',          '2010-11-04', 'female', 'rukmini.devi.demo51@greenwood.demo.in',         '+91-9900000051', 'Devi S',               'Kamala Devi',          '92 Lake Street',       'Madurai',    'Tamil Nadu', '625008', 'Grade 11', 'approved', 'paid', 32000, 32000),
  (md5('demo_adm_ajith')::uuid,            'a1b2c3d4-0002-4000-8000-000000000002', 'DEMO-GWH-052', 'Ajith Krishnamurthy',   '2010-03-15', 'male',   'ajith.krishnamurthy.demo52@greenwood.demo.in',  '+91-9900000052', 'Krishnamurthy P',      'Uma Krishnamurthy',    '13 Clock Tower Road',  'Trichy',     'Tamil Nadu', '620008', 'Grade 11', 'approved', 'paid', 32000, 32000),
  (md5('demo_adm_thenmozhi')::uuid,        'a1b2c3d4-0002-4000-8000-000000000002', 'DEMO-GWH-053', 'Thenmozhi Pandian',     '2010-08-26', 'female', 'thenmozhi.pandian.demo53@greenwood.demo.in',    '+91-9900000053', 'Pandian R',            'Vasantha Pandian',     '24 Tank Street',       'Chennai',    'Tamil Nadu', '600022', 'Grade 11', 'approved', 'paid', 32000, 32000),
  (md5('demo_adm_shankar')::uuid,          'a1b2c3d4-0002-4000-8000-000000000002', 'DEMO-GWH-054', 'Shankar Rajan',         '2009-05-19', 'male',   'shankar.rajan.demo54@greenwood.demo.in',        '+91-9900000054', 'Rajan P',              'Meena Rajan',          '35 Cotton Street',     'Chennai',    'Tamil Nadu', '600023', 'Grade 12', 'approved', 'paid', 35000, 35000),
  (md5('demo_adm_brinda')::uuid,           'a1b2c3d4-0002-4000-8000-000000000002', 'DEMO-GWH-055', 'Brinda Subramaniam',    '2009-10-02', 'female', 'brinda.subramaniam.demo55@greenwood.demo.in',   '+91-9900000055', 'Subramaniam K',        'Jaya Subramaniam',     '46 Silk Board Road',   'Coimbatore', 'Tamil Nadu', '641010', 'Grade 12', 'approved', 'paid', 35000, 35000),
  (md5('demo_adm_muruganp')::uuid,         'a1b2c3d4-0002-4000-8000-000000000002', 'DEMO-GWH-056', 'Murugan Panneerselvam', '2009-02-14', 'male',   'murugan.panneerselvam.demo56@greenwood.demo.in','+91-9900000056', 'Panneerselvam R',      'Parvathi Panneerselvam','57 Iron Smith Street', 'Salem',      'Tamil Nadu', '636007', 'Grade 12', 'approved', 'paid', 35000, 35000),
  (md5('demo_adm_pavithra')::uuid,         'a1b2c3d4-0002-4000-8000-000000000002', 'DEMO-GWH-057', 'Pavithra Krishnaswamy', '2009-07-28', 'female', 'pavithra.krishnaswamy.demo57@greenwood.demo.in','+91-9900000057', 'Krishnaswamy M',       'Bhuvana Krishnaswamy', '68 Old Tank Road',     'Madurai',    'Tamil Nadu', '625009', 'Grade 12', 'approved', 'paid', 35000, 35000),
  (md5('demo_adm_rajan2')::uuid,           'a1b2c3d4-0002-4000-8000-000000000002', 'DEMO-GWH-058', 'Rajan Sundararajan',    '2009-11-09', 'male',   'rajan.sundararajan.demo58@greenwood.demo.in',   '+91-9900000058', 'Sundararajan V',       'Thenmozhi Sundararajan','79 New Bus Stand Road','Trichy',     'Tamil Nadu', '620009', 'Grade 12', 'approved', 'paid', 35000, 35000),
  (md5('demo_adm_latha')::uuid,            'a1b2c3d4-0002-4000-8000-000000000002', 'DEMO-GWH-059', 'Latha Ramalingam',      '2009-03-21', 'female', 'latha.ramalingam.demo59@greenwood.demo.in',     '+91-9900000059', 'Ramalingam S',         'Kala Ramalingam',      '80 Pepper Street',     'Chennai',    'Tamil Nadu', '600024', 'Grade 12', 'approved', 'paid', 35000, 35000),
  (md5('demo_adm_subramaniam')::uuid,      'a1b2c3d4-0002-4000-8000-000000000002', 'DEMO-GWH-060', 'Subramaniam Pillai',    '2009-08-05', 'male',   'subramaniam.pillai.demo60@greenwood.demo.in',   '+91-9900000060', 'Pillai K',             'Vasantha Pillai',      '91 Beach Road South',  'Coimbatore', 'Tamil Nadu', '641011', 'Grade 12', 'approved', 'paid', 35000, 35000)
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- 7. DIGITAL PORTFOLIOS
--    Learner 1: Anandha Geethan  (anandhageethan333@gmail.com)
--    Learner 2: Vignesh Kumar    (vignesh.kumar.demo39@greenwood.demo.in)
--    Learner 3: Priyadharshini   (priyadharshini.rajan.demo47@greenwood.demo.in)
-- =============================================================================

-- ── 7a. SKILLS ───────────────────────────────────────────────────────────────
INSERT INTO public.skills (id, learner_id, name, type, level, proficiency_level, description, approval_status)
VALUES
  -- Anandha Geethan
  (md5('demo_skill_ag_01')::uuid, md5('school_demo_v1_anandhageethan333@gmail.com')::uuid, 'Python Programming', 'technical', 4, 'Advanced',    'Developed scripts for data analysis and automation.',          'approved'),
  (md5('demo_skill_ag_02')::uuid, md5('school_demo_v1_anandhageethan333@gmail.com')::uuid, 'Public Speaking',    'soft',      4, 'Advanced',    'Won inter-school debate competition 2026.',                    'approved'),
  (md5('demo_skill_ag_03')::uuid, md5('school_demo_v1_anandhageethan333@gmail.com')::uuid, 'Web Development',    'technical', 3, 'Intermediate','Built personal portfolio website using HTML, CSS, JavaScript.', 'approved'),
  -- Vignesh Kumar
  (md5('demo_skill_vk_01')::uuid, md5('school_demo_v1_vignesh.kumar.demo39@greenwood.demo.in')::uuid, 'Mathematics',        'technical', 5, 'Expert',      'State-level Olympiad participant, gold medal 2026.',           'approved'),
  (md5('demo_skill_vk_02')::uuid, md5('school_demo_v1_vignesh.kumar.demo39@greenwood.demo.in')::uuid, 'Problem Solving',    'soft',      4, 'Advanced',    'Competed in national-level math challenges.',                  'approved'),
  (md5('demo_skill_vk_03')::uuid, md5('school_demo_v1_vignesh.kumar.demo39@greenwood.demo.in')::uuid, 'C Programming',      'technical', 3, 'Intermediate','Completed 30-day coding challenge at school computer lab.',    'approved'),
  -- Priyadharshini Rajan
  (md5('demo_skill_pr_01')::uuid, md5('school_demo_v1_priyadharshini.rajan.demo47@greenwood.demo.in')::uuid, 'Biology',          'technical', 5, 'Expert',      'District Science Olympiad finalist 2026.',                     'approved'),
  (md5('demo_skill_pr_02')::uuid, md5('school_demo_v1_priyadharshini.rajan.demo47@greenwood.demo.in')::uuid, 'Leadership',       'soft',      4, 'Advanced',    'School Student Council President 2025-2026.',                  'approved'),
  (md5('demo_skill_pr_03')::uuid, md5('school_demo_v1_priyadharshini.rajan.demo47@greenwood.demo.in')::uuid, 'Research Writing', 'soft',      3, 'Intermediate','Published article in school science magazine.',                'approved')
ON CONFLICT (id) DO NOTHING;

-- ── 7b. PROJECTS ─────────────────────────────────────────────────────────────
INSERT INTO public.projects
  (id, learner_id, title, description, status, start_date, end_date,
   tech_stack, role, organization, approval_status)
VALUES
  -- Anandha Geethan
  (md5('demo_proj_ag_01')::uuid, md5('school_demo_v1_anandhageethan333@gmail.com')::uuid,
   'Smart Water Usage Monitor',
   'IoT project to monitor and alert on household water usage using Raspberry Pi and Python.',
   'completed', '2026-01-10', '2026-04-15',
   ARRAY['Python','Raspberry Pi','IoT','SQLite'],
   'Developer', 'Greenwood High School Science Club', 'approved'),
  -- Vignesh Kumar
  (md5('demo_proj_vk_01')::uuid, md5('school_demo_v1_vignesh.kumar.demo39@greenwood.demo.in')::uuid,
   'Prime Number Visualizer',
   'Web application to visually explore prime numbers and their distribution patterns.',
   'completed', '2026-02-01', '2026-03-20',
   ARRAY['HTML','CSS','JavaScript','Chart.js'],
   'Solo Developer', 'School Math Club', 'approved'),
  -- Priyadharshini Rajan
  (md5('demo_proj_pr_01')::uuid, md5('school_demo_v1_priyadharshini.rajan.demo47@greenwood.demo.in')::uuid,
   'Plant Growth Under Different Light Spectrums',
   'Science experiment studying effect of red, blue and white light on mung bean germination rate.',
   'completed', '2026-01-15', '2026-05-01',
   ARRAY['Lab Research','Data Analysis','Excel'],
   'Lead Researcher', 'Greenwood High School Biology Dept', 'approved')
ON CONFLICT (id) DO NOTHING;

-- ── 7c. CERTIFICATES ─────────────────────────────────────────────────────────
INSERT INTO public.certificates
  (id, learner_id, title, issuer, issued_on, level, description, approval_status, platform)
VALUES
  -- Anandha Geethan
  (md5('demo_cert_ag_01')::uuid, md5('school_demo_v1_anandhageethan333@gmail.com')::uuid,
   'Python for Beginners', 'Coursera', '2026-03-10', 'Beginner',
   'Completed 20-hour Python programming course.', 'approved', 'Coursera'),
  (md5('demo_cert_ag_02')::uuid, md5('school_demo_v1_anandhageethan333@gmail.com')::uuid,
   'Inter-School Debate Champion', 'District Education Office', '2026-02-28', 'Gold',
   'First place in district-level inter-school debate competition.', 'approved', 'Offline'),
  -- Vignesh Kumar
  (md5('demo_cert_vk_01')::uuid, md5('school_demo_v1_vignesh.kumar.demo39@greenwood.demo.in')::uuid,
   'State Mathematics Olympiad - Gold Medal', 'Tamil Nadu Mathematics Council', '2026-01-20', 'Gold',
   'Gold medal at State-level Mathematics Olympiad 2026.', 'approved', 'Offline'),
  (md5('demo_cert_vk_02')::uuid, md5('school_demo_v1_vignesh.kumar.demo39@greenwood.demo.in')::uuid,
   'JavaScript Fundamentals', 'freeCodeCamp', '2026-04-05', 'Beginner',
   '300-hour JavaScript certification from freeCodeCamp.', 'approved', 'freeCodeCamp'),
  -- Priyadharshini Rajan
  (md5('demo_cert_pr_01')::uuid, md5('school_demo_v1_priyadharshini.rajan.demo47@greenwood.demo.in')::uuid,
   'District Science Olympiad - Finalist', 'District Science Foundation', '2026-02-14', 'Silver',
   'Finalist at District-level Science Olympiad, Biology category.', 'approved', 'Offline'),
  (md5('demo_cert_pr_02')::uuid, md5('school_demo_v1_priyadharshini.rajan.demo47@greenwood.demo.in')::uuid,
   'Student Leadership Excellence Award', 'Greenwood High School', '2026-04-20', 'Gold',
   'Awarded by school for outstanding leadership as Student Council President.', 'approved', 'Offline')
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- 8. ASSESSMENT RESULTS (cloned to 2 Grade-12 demo learners)
--
--    Source records (originals untouched):
--      910b740b-7d59-4536-b692-ac4a94604435  → R Amrutha  (btech_cse, IRC, Developing)
--      025d910f-2ea2-5fee-b28b-b756df343348  → Arjun Srinivasan (college, CRS, High)
--
--    Cloned to:
--      Learner 1: Shankar Rajan    (shankar.rajan.demo54@greenwood.demo.in)  Grade 12
--      Learner 2: Brinda Subramaniam (brinda.subramaniam.demo55@greenwood.demo.in) Grade 12
--
--    Deterministic IDs:
--      Attempt  Shankar  → md5('demo_attempt_shankar_v1')::uuid
--      Attempt  Brinda   → md5('demo_attempt_brinda_v1')::uuid
--      Result   Shankar  → md5('demo_par_shankar_v1')::uuid
--      Result   Brinda   → md5('demo_par_brinda_v1')::uuid
-- =============================================================================

-- ── 8a. ASSESSMENT ATTEMPTS ───────────────────────────────────────────────────
INSERT INTO public.personal_assessment_attempts
  (id, learner_id, stream_id, status, grade_level,
   completed_at, created_at, updated_at)
VALUES
  (md5('demo_attempt_shankar_v1')::uuid,
   md5('school_demo_v1_shankar.rajan.demo54@greenwood.demo.in')::uuid,
   'higher_secondary', 'completed', 'higher_secondary',
   '2026-11-20 10:00:00+00', '2026-11-20 10:00:00+00', '2026-11-20 10:00:00+00'),
  (md5('demo_attempt_brinda_v1')::uuid,
   md5('school_demo_v1_brinda.subramaniam.demo55@greenwood.demo.in')::uuid,
   'higher_secondary', 'completed', 'higher_secondary',
   '2026-11-20 10:30:00+00', '2026-11-20 10:30:00+00', '2026-11-20 10:30:00+00')
ON CONFLICT (id) DO NOTHING;

-- ── 8b. ASSESSMENT RESULTS (cloned, scores preserved from originals) ──────────
-- Clone record 1 → Shankar Rajan (source: R Amrutha, IRC, Developing readiness)
INSERT INTO public.personal_assessment_results (
  id, attempt_id, learner_id, stream_id,
  riasec_scores, riasec_code,
  aptitude_scores, aptitude_overall,
  bigfive_scores, work_values_scores,
  employability_scores, employability_readiness,
  knowledge_score, knowledge_details,
  career_fit, skill_gap, roadmap, profile_snapshot,
  timing_analysis, final_note, overall_summary, gemini_results,
  status, grade_level,
  skill_gap_courses, platform_courses, courses_by_type,
  strength_scores, learning_preferences,
  stream_aptitude_score, stream_aptitude_details, growth_map,
  grading_receipt_id, grading_provenance, adaptive_aptitude_session_id,
  created_at, updated_at
)
SELECT
  md5('demo_par_shankar_v1')::uuid,
  md5('demo_attempt_shankar_v1')::uuid,
  md5('school_demo_v1_shankar.rajan.demo54@greenwood.demo.in')::uuid,
  'higher_secondary',
  riasec_scores, riasec_code,
  aptitude_scores, aptitude_overall,
  bigfive_scores, work_values_scores,
  employability_scores, employability_readiness,
  knowledge_score, knowledge_details,
  career_fit, skill_gap, roadmap, profile_snapshot,
  timing_analysis, final_note, overall_summary, gemini_results,
  status, 'higher_secondary',
  skill_gap_courses, platform_courses, courses_by_type,
  strength_scores, learning_preferences,
  stream_aptitude_score, stream_aptitude_details, growth_map,
  NULL, grading_provenance, NULL,
  '2026-11-20 10:00:00+00', '2026-11-20 10:00:00+00'
FROM public.personal_assessment_results
WHERE id = '910b740b-7d59-4536-b692-ac4a94604435'
ON CONFLICT (id) DO NOTHING;

-- Clone record 2 → Brinda Subramaniam (source: Arjun Srinivasan, CRS, High readiness)
INSERT INTO public.personal_assessment_results (
  id, attempt_id, learner_id, stream_id,
  riasec_scores, riasec_code,
  aptitude_scores, aptitude_overall,
  bigfive_scores, work_values_scores,
  employability_scores, employability_readiness,
  knowledge_score, knowledge_details,
  career_fit, skill_gap, roadmap, profile_snapshot,
  timing_analysis, final_note, overall_summary, gemini_results,
  status, grade_level,
  skill_gap_courses, platform_courses, courses_by_type,
  strength_scores, learning_preferences,
  stream_aptitude_score, stream_aptitude_details, growth_map,
  grading_receipt_id, grading_provenance, adaptive_aptitude_session_id,
  created_at, updated_at
)
SELECT
  md5('demo_par_brinda_v1')::uuid,
  md5('demo_attempt_brinda_v1')::uuid,
  md5('school_demo_v1_brinda.subramaniam.demo55@greenwood.demo.in')::uuid,
  'higher_secondary',
  riasec_scores, riasec_code,
  aptitude_scores, aptitude_overall,
  bigfive_scores, work_values_scores,
  employability_scores, employability_readiness,
  knowledge_score, knowledge_details,
  career_fit, skill_gap, roadmap, profile_snapshot,
  timing_analysis, final_note, overall_summary, gemini_results,
  status, 'higher_secondary',
  skill_gap_courses, platform_courses, courses_by_type,
  strength_scores, learning_preferences,
  stream_aptitude_score, stream_aptitude_details, growth_map,
  NULL, grading_provenance, NULL,
  '2026-11-20 10:30:00+00', '2026-11-20 10:30:00+00'
FROM public.personal_assessment_results
WHERE id = '025d910f-2ea2-5fee-b28b-b756df343348'
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- 9. TIMETABLE  (1 timetable, 7 classes × 5 periods × 5 days = 175 slots)
-- =============================================================================

INSERT INTO public.timetables
  (id, school_id, academic_year, term, start_date, end_date, status, created_by)
VALUES (
  md5('demo_timetable_greenwood_v1')::uuid,
  'a1b2c3d4-0002-4000-8000-000000000002',
  '2026-2027', 'Term 1',
  '2026-06-01', '2026-11-30',
  'published',
  NULL
)
ON CONFLICT (id) DO NOTHING;

-- Schedule template (conflict-free — no educator repeats at same day+period):
--   Gr6 : P1=Meena/Math      P2=Arjun/Science       P3=Priya/English      P4=Suresh/Social Science P5=Deepa/CS
--   Gr7 : P1=Anitha/Tamil    P2=Ravi/PE              P3=Senthil/Physics    P4=Prakash/Chemistry     P5=Kavitha/Biology
--   Gr8 : P1=Senthil/Physics P2=Meena/Mathematics    P3=Arjun/Science      P4=Priya/English         P5=Suresh/Social Science
--   Gr9 : P1=Priya/English   P2=Suresh/Social Science P3=Deepa/CS         P4=Anitha/Tamil          P5=Ravi/PE
--  Gr10 : P1=Prakash/Chem    P2=Kavitha/Biology       P3=Meena/Mathematics P4=Senthil/Physics       P5=Arjun/Science
--  Gr11 : P1=Kavitha/Bio     P2=Deepa/CS              P3=Ravi/PE           P4=Meena/Mathematics     P5=Senthil/Physics
--  Gr12 : P1=Suresh/Social   P2=Anitha/Tamil          P3=Kavitha/Biology   P4=Ravi/PE               P5=Prakash/Chemistry

INSERT INTO public.timetable_slots
  (id, timetable_id, educator_id, class_id, day_of_week, period_number,
   start_time, end_time, subject_name, room_number)
SELECT
  md5(concat('demo_slot_', template.ck, '_p', template.pn, '_d', days.d))::uuid,
  md5('demo_timetable_greenwood_v1')::uuid,
  template.edu_id,
  template.cls_id,
  days.d,
  template.pn,
  template.st::time,
  template.et::time,
  template.subj,
  template.room
FROM (VALUES
  -- Grade 6
  ('gr6', md5('demo_edu_meena')::uuid,   md5('demo_class_grade6a')::uuid,  1, '08:00', '08:45', 'Mathematics',       'R101'),
  ('gr6', md5('demo_edu_arjun')::uuid,   md5('demo_class_grade6a')::uuid,  2, '08:45', '09:30', 'Science',           'R101'),
  ('gr6', md5('demo_edu_priya')::uuid,   md5('demo_class_grade6a')::uuid,  3, '09:30', '10:15', 'English',           'R101'),
  ('gr6', md5('demo_edu_suresh')::uuid,  md5('demo_class_grade6a')::uuid,  4, '10:30', '11:15', 'Social Science',    'R101'),
  ('gr6', md5('demo_edu_deepa')::uuid,   md5('demo_class_grade6a')::uuid,  5, '11:15', '12:00', 'Computer Science',  'R101'),
  -- Grade 7
  ('gr7', md5('demo_edu_anitha')::uuid,  md5('demo_class_grade7a')::uuid,  1, '08:00', '08:45', 'Tamil',             'R102'),
  ('gr7', md5('demo_edu_ravi')::uuid,    md5('demo_class_grade7a')::uuid,  2, '08:45', '09:30', 'Physical Education','GYM'),
  ('gr7', md5('demo_edu_senthil')::uuid, md5('demo_class_grade7a')::uuid,  3, '09:30', '10:15', 'Physics',           'R102'),
  ('gr7', md5('demo_edu_prakash')::uuid, md5('demo_class_grade7a')::uuid,  4, '10:30', '11:15', 'Chemistry',         'R102'),
  ('gr7', md5('demo_edu_kavitha')::uuid, md5('demo_class_grade7a')::uuid,  5, '11:15', '12:00', 'Biology',           'R102'),
  -- Grade 8
  ('gr8', md5('demo_edu_senthil')::uuid, md5('demo_class_grade8a')::uuid,  1, '08:00', '08:45', 'Physics',           'R103'),
  ('gr8', md5('demo_edu_meena')::uuid,   md5('demo_class_grade8a')::uuid,  2, '08:45', '09:30', 'Mathematics',       'R103'),
  ('gr8', md5('demo_edu_arjun')::uuid,   md5('demo_class_grade8a')::uuid,  3, '09:30', '10:15', 'Science',           'R103'),
  ('gr8', md5('demo_edu_priya')::uuid,   md5('demo_class_grade8a')::uuid,  4, '10:30', '11:15', 'English',           'R103'),
  ('gr8', md5('demo_edu_suresh')::uuid,  md5('demo_class_grade8a')::uuid,  5, '11:15', '12:00', 'Social Science',    'R103'),
  -- Grade 9
  ('gr9', md5('demo_edu_priya')::uuid,   md5('demo_class_grade9a')::uuid,  1, '08:00', '08:45', 'English',           'R104'),
  ('gr9', md5('demo_edu_suresh')::uuid,  md5('demo_class_grade9a')::uuid,  2, '08:45', '09:30', 'Social Science',    'R104'),
  ('gr9', md5('demo_edu_deepa')::uuid,   md5('demo_class_grade9a')::uuid,  3, '09:30', '10:15', 'Computer Science',  'R104'),
  ('gr9', md5('demo_edu_anitha')::uuid,  md5('demo_class_grade9a')::uuid,  4, '10:30', '11:15', 'Tamil',             'R104'),
  ('gr9', md5('demo_edu_ravi')::uuid,    md5('demo_class_grade9a')::uuid,  5, '11:15', '12:00', 'Physical Education','GYM'),
  -- Grade 10
  ('gr10', md5('demo_edu_prakash')::uuid, md5('demo_class_grade10a')::uuid, 1, '08:00', '08:45', 'Chemistry',        'R105'),
  ('gr10', md5('demo_edu_kavitha')::uuid, md5('demo_class_grade10a')::uuid, 2, '08:45', '09:30', 'Biology',          'R105'),
  ('gr10', md5('demo_edu_meena')::uuid,   md5('demo_class_grade10a')::uuid, 3, '09:30', '10:15', 'Mathematics',      'R105'),
  ('gr10', md5('demo_edu_senthil')::uuid, md5('demo_class_grade10a')::uuid, 4, '10:30', '11:15', 'Physics',          'R105'),
  ('gr10', md5('demo_edu_arjun')::uuid,   md5('demo_class_grade10a')::uuid, 5, '11:15', '12:00', 'Science',          'R105'),
  -- Grade 11
  ('gr11', md5('demo_edu_kavitha')::uuid, md5('demo_class_grade11a')::uuid, 1, '08:00', '08:45', 'Biology',          'R106'),
  ('gr11', md5('demo_edu_deepa')::uuid,   md5('demo_class_grade11a')::uuid, 2, '08:45', '09:30', 'Computer Science', 'R106'),
  ('gr11', md5('demo_edu_ravi')::uuid,    md5('demo_class_grade11a')::uuid, 3, '09:30', '10:15', 'Physical Education','GYM'),
  ('gr11', md5('demo_edu_meena')::uuid,   md5('demo_class_grade11a')::uuid, 4, '10:30', '11:15', 'Mathematics',      'R106'),
  ('gr11', md5('demo_edu_senthil')::uuid, md5('demo_class_grade11a')::uuid, 5, '11:15', '12:00', 'Physics',          'R106'),
  -- Grade 12
  ('gr12', md5('demo_edu_suresh')::uuid,  md5('demo_class_grade12a')::uuid, 1, '08:00', '08:45', 'Social Science',   'R107'),
  ('gr12', md5('demo_edu_anitha')::uuid,  md5('demo_class_grade12a')::uuid, 2, '08:45', '09:30', 'Tamil',            'R107'),
  ('gr12', md5('demo_edu_kavitha')::uuid, md5('demo_class_grade12a')::uuid, 3, '09:30', '10:15', 'Biology',          'R107'),
  ('gr12', md5('demo_edu_ravi')::uuid,    md5('demo_class_grade12a')::uuid, 4, '10:30', '11:15', 'Physical Education','GYM'),
  ('gr12', md5('demo_edu_prakash')::uuid, md5('demo_class_grade12a')::uuid, 5, '11:15', '12:00', 'Chemistry',        'R107')
) AS template(ck, edu_id, cls_id, pn, st, et, subj, room)
CROSS JOIN (VALUES (1),(2),(3),(4),(5)) AS days(d)
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- 10. VERIFICATIONS — pending submissions for 10 Greenwood demo learners
-- =============================================================================

-- 10a. Trainings (approval_authority = 'school_admin' required by verifications page)
INSERT INTO public.trainings
  (id, learner_id, title, organization, start_date, end_date, duration, description,
   approval_status, approval_authority, status, source)
VALUES
  (md5('demo_train_aryan_v1')::uuid,     'f83a1a2d-025c-541b-3dd2-cc75e7432e8a', 'Web Development Fundamentals',    'NIIT',              '2026-07-01', '2026-10-31', '4 months', 'HTML, CSS, JavaScript basics',         'pending', 'school_admin', 'completed', 'manual'),
  (md5('demo_train_diya_v1')::uuid,      'a51a77bd-c904-94a9-4bc5-924c669ff4e0', 'Digital Marketing Basics',         'Google',            '2026-08-01', '2026-10-15', '3 months', 'SEO, SEM, social media marketing',     'pending', 'school_admin', 'completed', 'manual'),
  (md5('demo_train_suresh_v1')::uuid,    '32e0d878-ac2d-29bc-20f3-81466314c50e', 'Python for Beginners',             'Coursera',          '2026-07-15', '2026-09-30', '2.5 months','Python fundamentals and projects',    'pending', 'school_admin', 'completed', 'manual'),
  (md5('demo_train_preethi_v1')::uuid,   '3d0513bc-2271-233c-bbd0-ab75eee691c0', 'Graphic Design with Canva',        'Udemy',             '2026-08-10', '2026-10-10', '2 months', 'Visual design principles and tools',   'pending', 'school_admin', 'completed', 'manual'),
  (md5('demo_train_rohit_v1')::uuid,     '734059a7-5880-28c1-4c4a-62d0ec3132fb', 'First Aid & CPR Certification',    'Red Cross',         '2026-09-01', '2026-09-05', '5 days',   'Emergency first aid and CPR skills',   'pending', 'school_admin', 'completed', 'manual'),
  (md5('demo_train_nithya_v1')::uuid,    '4bc4cc75-4f73-b49b-9ae2-a4361d1f4bda', 'Public Speaking & Communication',  'Toastmasters',      '2026-07-01', '2026-10-31', '4 months', 'Confidence, diction, presentation',    'pending', 'school_admin', 'completed', 'manual'),
  (md5('demo_train_keerthana_v1')::uuid, 'cc9930eb-f417-8211-1b69-46cfad1b4674', 'Data Analysis with Excel',         'Microsoft',         '2026-08-01', '2026-09-30', '2 months', 'Pivot tables, charts, VLOOKUP',        'pending', 'school_admin', 'completed', 'manual'),
  (md5('demo_train_vaishnavi_v1')::uuid, '51f879c1-367e-d60c-bf53-efe2a4ce3c31', 'Robotics and Electronics Basics',  'Greenwood Skill Lab','2026-07-01', '2026-11-15', '4.5 months','Arduino, circuits, automation',       'pending', 'school_admin', 'completed', 'manual'),
  (md5('demo_train_mithun_v1')::uuid,    '0c56b303-318b-164c-8f70-ed98503361ae', 'Photography & Videography',        'Adobe',             '2026-09-01', '2026-10-31', '2 months', 'Lightroom, Premiere Pro basics',       'pending', 'school_admin', 'ongoing',   'manual'),
  (md5('demo_train_arun_v1')::uuid,      '02086598-0aea-29f3-3048-720568c5b292', 'Mobile App Development (Android)', 'Google Developers', '2026-08-01', '2026-11-30', '4 months', 'Android Studio, Kotlin fundamentals',  'pending', 'school_admin', 'ongoing',   'manual')
ON CONFLICT (id) DO NOTHING;

-- 10b. Experience (approval_authority = 'school_admin')
INSERT INTO public.experience
  (id, learner_id, organization, role, start_date, end_date, duration, description,
   approval_status, approval_authority, verified, enabled)
VALUES
  (md5('demo_exp_aryan_v1')::uuid,     'f83a1a2d-025c-541b-3dd2-cc75e7432e8a', 'TechVentures India',       'Intern - Web Developer',    '2026-05-01', '2026-07-31', '3 months', 'Built landing pages and UI components in React',           'pending', 'school_admin', false, true),
  (md5('demo_exp_diya_v1')::uuid,      'a51a77bd-c904-94a9-4bc5-924c669ff4e0', 'BrightMedia Agency',       'Social Media Intern',       '2026-06-01', '2026-08-31', '3 months', 'Managed Instagram and YouTube content calendar',           'pending', 'school_admin', false, true),
  (md5('demo_exp_rohit_v1')::uuid,     '734059a7-5880-28c1-4c4a-62d0ec3132fb', 'City Sports Academy',      'Junior Coach Assistant',    '2026-04-01', '2026-10-31', '7 months', 'Assisted senior coaches with cricket training drills',     'pending', 'school_admin', false, true),
  (md5('demo_exp_nithya_v1')::uuid,    '4bc4cc75-4f73-b49b-9ae2-a4361d1f4bda', 'Chennai Youth Theatre',   'Theatre Assistant',         '2026-01-01', '2026-06-30', '6 months', 'Stage management and script analysis for school plays',    'pending', 'school_admin', false, true),
  (md5('demo_exp_keerthana_v1')::uuid, 'cc9930eb-f417-8211-1b69-46cfad1b4674', 'DataInsight Solutions',    'Data Entry Intern',         '2026-07-01', '2026-09-30', '3 months', 'Cleaned and structured survey datasets using Excel',       'pending', 'school_admin', false, true),
  (md5('demo_exp_mithun_v1')::uuid,    '0c56b303-318b-164c-8f70-ed98503361ae', 'GreenShot Photography',    'Photographer Assistant',    '2026-08-01', '2026-10-31', '3 months', 'Event photography for weddings and corporate events',      'pending', 'school_admin', false, true),
  (md5('demo_exp_arun_v1')::uuid,      '02086598-0aea-29f3-3048-720568c5b292', 'CodeNest Technologies',    'App Dev Intern',            '2026-09-01', '2026-11-30', '3 months', 'Developed a task manager mobile app using Kotlin',         'pending', 'school_admin', false, true),
  (md5('demo_exp_vaishnavi_v1')::uuid, '51f879c1-367e-d60c-bf53-efe2a4ce3c31', 'RoboLearn Institute',      'Robotics Lab Volunteer',    '2026-06-01', '2026-10-31', '5 months', 'Helped younger students build and program robots',         'pending', 'school_admin', false, true)
ON CONFLICT (id) DO NOTHING;

-- 10c. Certificates (no approval_authority filter — approval_status='pending' sufficient)
INSERT INTO public.certificates
  (id, learner_id, title, issuer, level, issued_on, description, approval_status, enabled)
VALUES
  (md5('demo_cert_aryan_v1')::uuid,     'f83a1a2d-025c-541b-3dd2-cc75e7432e8a', 'JavaScript Essentials',          'freeCodeCamp',       'Beginner',      '2026-10-01', 'Completed 300h JS curriculum',           'pending', true),
  (md5('demo_cert_diya_v1')::uuid,      'a51a77bd-c904-94a9-4bc5-924c669ff4e0', 'Google Digital Garage',          'Google',             'Foundation',    '2026-10-10', 'Digital marketing fundamentals',         'pending', true),
  (md5('demo_cert_suresh_v1')::uuid,    '32e0d878-ac2d-29bc-20f3-81466314c50e', 'Python Data Structures',         'Coursera / Michigan', 'Intermediate', '2026-09-25', 'Algorithms and data structures in Python','pending', true),
  (md5('demo_cert_preethi_v1')::uuid,   '3d0513bc-2271-233c-bbd0-ab75eee691c0', 'Canva Design Certification',     'Canva',              'Beginner',      '2026-10-05', 'Completed Canva certified design course','pending', true),
  (md5('demo_cert_rohit_v1')::uuid,     '734059a7-5880-28c1-4c4a-62d0ec3132fb', 'First Aid Level 1',              'Red Cross India',    'Basic',         '2026-09-05', 'Certified in first aid and CPR',         'pending', true),
  (md5('demo_cert_nithya_v1')::uuid,    '4bc4cc75-4f73-b49b-9ae2-a4361d1f4bda', 'Effective Communication',        'LinkedIn Learning',  'Intermediate',  '2026-10-15', 'Communication and presentation skills',  'pending', true),
  (md5('demo_cert_keerthana_v1')::uuid, 'cc9930eb-f417-8211-1b69-46cfad1b4674', 'Microsoft Excel Specialist',     'Microsoft',          'Associate',     '2026-09-28', 'Excel data analysis certification',      'pending', true),
  (md5('demo_cert_mithun_v1')::uuid,    '0c56b303-318b-164c-8f70-ed98503361ae', 'Adobe Photoshop Essentials',     'Adobe',              'Beginner',      '2026-10-20', 'Photo editing and compositing basics',   'pending', true)
ON CONFLICT (id) DO NOTHING;

-- 10d. Skills (no approval_authority filter)
INSERT INTO public.skills
  (id, learner_id, name, type, level, description, approval_status, verified, enabled)
VALUES
  (md5('demo_skill_aryan_html')::uuid,     'f83a1a2d-025c-541b-3dd2-cc75e7432e8a', 'HTML & CSS',           'technical', 3, 'Frontend markup and styling',              'pending', false, true),
  (md5('demo_skill_diya_seo')::uuid,       'a51a77bd-c904-94a9-4bc5-924c669ff4e0', 'SEO & Analytics',      'technical', 2, 'Google Analytics, keyword research',       'pending', false, true),
  (md5('demo_skill_suresh_python')::uuid,  '32e0d878-ac2d-29bc-20f3-81466314c50e', 'Python Programming',   'technical', 3, 'Scripting, data manipulation',             'pending', false, true),
  (md5('demo_skill_preethi_design')::uuid, '3d0513bc-2271-233c-bbd0-ab75eee691c0', 'Graphic Design',       'technical', 3, 'Visual design tools and principles',       'pending', false, true),
  (md5('demo_skill_rohit_comm')::uuid,     '734059a7-5880-28c1-4c4a-62d0ec3132fb', 'Team Leadership',      'soft',      3, 'Led cricket team as vice-captain',         'pending', false, true),
  (md5('demo_skill_nithya_speak')::uuid,   '4bc4cc75-4f73-b49b-9ae2-a4361d1f4bda', 'Public Speaking',      'soft',      4, 'Debate competitions and theatre',          'pending', false, true)
ON CONFLICT (id) DO NOTHING;

-- 10e. Projects (approval_authority = 'school_admin')
INSERT INTO public.projects
  (id, learner_id, title, description, status, start_date, end_date, duration,
   tech_stack, approval_status, approval_authority, enabled)
VALUES
  (md5('demo_proj_aryan_v1')::uuid,     'f83a1a2d-025c-541b-3dd2-cc75e7432e8a', 'School Event Website',         'Built a website for Greenwood annual sports day using HTML, CSS, JS', 'completed', '2026-09-01', '2026-10-15', '6 weeks',  ARRAY['HTML','CSS','JavaScript'],        'pending', 'school_admin', true),
  (md5('demo_proj_diya_v1')::uuid,      'a51a77bd-c904-94a9-4bc5-924c669ff4e0', 'Social Media Growth Campaign', 'Grew Instagram account from 200 to 2000 followers in 90 days',       'completed', '2026-07-01', '2026-09-30', '3 months', ARRAY['Canva','Google Analytics'],       'pending', 'school_admin', true),
  (md5('demo_proj_suresh_v1')::uuid,    '32e0d878-ac2d-29bc-20f3-81466314c50e', 'Attendance Tracker CLI',       'Python CLI tool to track class attendance and generate reports',      'completed', '2026-08-01', '2026-09-15', '6 weeks',  ARRAY['Python','CSV'],                   'pending', 'school_admin', true),
  (md5('demo_proj_preethi_v1')::uuid,   '3d0513bc-2271-233c-bbd0-ab75eee691c0', 'School Magazine Design',       'Designed 24-page annual magazine for Greenwood using Canva',         'completed', '2026-10-01', '2026-11-01', '1 month',  ARRAY['Canva','Adobe Illustrator'],      'pending', 'school_admin', true),
  (md5('demo_proj_vaishnavi_v1')::uuid, '51f879c1-367e-d60c-bf53-efe2a4ce3c31', 'Smart Home Automation Bot',   'Arduino-based bot that controls lights based on motion detection',   'completed', '2026-07-01', '2026-10-31', '4 months', ARRAY['Arduino','C++','IoT'],            'pending', 'school_admin', true),
  (md5('demo_proj_arun_v1')::uuid,      '02086598-0aea-29f3-3048-720568c5b292', 'Task Manager Android App',    'Kotlin Android app with task creation, deadlines, and reminders',    'completed', '2026-09-01', '2026-11-15', '2.5 months',ARRAY['Kotlin','Android Studio','SQLite'],'pending', 'school_admin', true)
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- 11. LTE REVIEW CONFIG  (org settings + scope enabled + reviewer assignments)
-- =============================================================================

-- 11a. Organisation-level evaluation mode (ai_first = default, explicit row for visibility)
INSERT INTO public.lte_review_org_settings (id, organization_id, evaluation_mode)
VALUES (
  md5('demo_lte_org_greenwood_v1')::uuid,
  'a1b2c3d4-0002-4000-8000-000000000002',
  'ai_first'
)
ON CONFLICT (organization_id) DO NOTHING;

-- 11b. Enable LTE review for each of the 7 demo classes
INSERT INTO public.lte_review_scope_settings
  (id, school_class_id, enabled, email_enabled, sla_days, load_cap, confidence_threshold)
VALUES
  (md5('demo_lte_scope_grade6a_v1')::uuid,  md5('demo_class_grade6a')::uuid,  true, false, 3, 10, 70),
  (md5('demo_lte_scope_grade7a_v1')::uuid,  md5('demo_class_grade7a')::uuid,  true, false, 3, 10, 70),
  (md5('demo_lte_scope_grade8a_v1')::uuid,  md5('demo_class_grade8a')::uuid,  true, false, 3, 10, 70),
  (md5('demo_lte_scope_grade9a_v1')::uuid,  md5('demo_class_grade9a')::uuid,  true, false, 3, 10, 70),
  (md5('demo_lte_scope_grade10a_v1')::uuid, md5('demo_class_grade10a')::uuid, true, false, 3, 10, 70),
  (md5('demo_lte_scope_grade11a_v1')::uuid, md5('demo_class_grade11a')::uuid, true, false, 3, 10, 70),
  (md5('demo_lte_scope_grade12a_v1')::uuid, md5('demo_class_grade12a')::uuid, true, false, 3, 10, 70)
ON CONFLICT (school_class_id) DO NOTHING;

-- 11c. Assign class teachers as LTE reviewers (reviewer_user_id = teacher user IDs)
-- Each class gets 2 reviewer teachers; using demo_teacher_user_* IDs
INSERT INTO public.lte_review_scope_reviewers
  (id, school_class_id, reviewer_user_id)
VALUES
  -- Grade 6: Meena (Math) + Priya (English)
  (md5('demo_lte_rev_gr6_meena_v1')::uuid,   md5('demo_class_grade6a')::uuid,  md5('demo_teacher_user_meena')::uuid),
  (md5('demo_lte_rev_gr6_priya_v1')::uuid,   md5('demo_class_grade6a')::uuid,  md5('demo_teacher_user_priya')::uuid),
  -- Grade 7: Senthil (Physics) + Kavitha (Biology)
  (md5('demo_lte_rev_gr7_senthil_v1')::uuid, md5('demo_class_grade7a')::uuid,  md5('demo_teacher_user_senthil')::uuid),
  (md5('demo_lte_rev_gr7_kavitha_v1')::uuid, md5('demo_class_grade7a')::uuid,  md5('demo_teacher_user_kavitha')::uuid),
  -- Grade 8: Meena (Math) + Arjun (Science)
  (md5('demo_lte_rev_gr8_meena_v1')::uuid,   md5('demo_class_grade8a')::uuid,  md5('demo_teacher_user_meena')::uuid),
  (md5('demo_lte_rev_gr8_arjun_v1')::uuid,   md5('demo_class_grade8a')::uuid,  md5('demo_teacher_user_arjun')::uuid),
  -- Grade 9: Priya (English) + Deepa (CS)
  (md5('demo_lte_rev_gr9_priya_v1')::uuid,   md5('demo_class_grade9a')::uuid,  md5('demo_teacher_user_priya')::uuid),
  (md5('demo_lte_rev_gr9_deepa_v1')::uuid,   md5('demo_class_grade9a')::uuid,  md5('demo_teacher_user_deepa')::uuid),
  -- Grade 10: Prakash (Chemistry) + Senthil (Physics)
  (md5('demo_lte_rev_gr10_prakash_v1')::uuid, md5('demo_class_grade10a')::uuid, md5('demo_teacher_user_prakash')::uuid),
  (md5('demo_lte_rev_gr10_senthil_v1')::uuid, md5('demo_class_grade10a')::uuid, md5('demo_teacher_user_senthil')::uuid),
  -- Grade 11: Kavitha (Biology) + Deepa (CS)
  (md5('demo_lte_rev_gr11_kavitha_v1')::uuid, md5('demo_class_grade11a')::uuid, md5('demo_teacher_user_kavitha')::uuid),
  (md5('demo_lte_rev_gr11_deepa_v1')::uuid,   md5('demo_class_grade11a')::uuid, md5('demo_teacher_user_deepa')::uuid),
  -- Grade 12: Prakash (Chemistry) + Suresh (Social Science)
  (md5('demo_lte_rev_gr12_prakash_v1')::uuid, md5('demo_class_grade12a')::uuid, md5('demo_teacher_user_prakash')::uuid),
  (md5('demo_lte_rev_gr12_suresh_v1')::uuid,  md5('demo_class_grade12a')::uuid, md5('demo_teacher_user_suresh')::uuid)
ON CONFLICT (school_class_id, reviewer_user_id) DO NOTHING;

-- =============================================================================
-- END OF SEED
-- =============================================================================

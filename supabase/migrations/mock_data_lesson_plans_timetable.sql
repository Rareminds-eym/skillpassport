-- Mock Data for Lesson Plans & Timetable Testing
-- Run this after applying the schema migrations

-- ============================================
-- 1. MOCK SCHOOLS
-- ============================================
INSERT INTO schools (id, name, address, contact_email, contact_phone) VALUES
('11111111-1111-1111-1111-111111111111', 'Springfield High School', '123 Main St, Springfield', 'admin@springfield.edu', '+1-555-0100'),
('22222222-2222-2222-2222-222222222222', 'Riverside Academy', '456 River Rd, Riverside', 'admin@riverside.edu', '+1-555-0200')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 2. MOCK TEACHERS WITH ROLES
-- ============================================
INSERT INTO teachers (id, teacher_id, school_id, first_name, last_name, email, phone, role, onboarding_status, subject_expertise) VALUES
-- School Admin
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'SPR-T-0001', '11111111-1111-1111-1111-111111111111', 'John', 'Admin', 'admin@springfield.edu', '+1-555-1001', 'school_admin', 'active', 
'[{"name": "Administration", "proficiency": "expert", "years_experience": 10}]'::jsonb),

-- Principal
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'SPR-T-0002', '11111111-1111-1111-1111-111111111111', 'Sarah', 'Principal', 'principal@springfield.edu', '+1-555-1002', 'principal', 'active',
'[{"name": "Leadership", "proficiency": "expert", "years_experience": 15}]'::jsonb),

-- Subject Teachers (with mock document URLs)
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'SPR-T-0003', '11111111-1111-1111-1111-111111111111', 'Robert', 'Smith', 'robert.smith@springfield.edu', '+1-555-1003', 'subject_teacher', 'active',
'[{"name": "Mathematics", "proficiency": "expert", "years_experience": 8}, {"name": "Physics", "proficiency": "advanced", "years_experience": 5}]'::jsonb),

('dddddddd-dddd-dddd-dddd-dddddddddddd', 'SPR-T-0004', '11111111-1111-1111-1111-111111111111', 'Emily', 'Johnson', 'emily.johnson@springfield.edu', '+1-555-1004', 'subject_teacher', 'active',
'[{"name": "English", "proficiency": "expert", "years_experience": 10}, {"name": "Literature", "proficiency": "expert", "years_experience": 10}]'::jsonb),

('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'SPR-T-0005', '11111111-1111-1111-1111-111111111111', 'Michael', 'Brown', 'michael.brown@springfield.edu', '+1-555-1005', 'subject_teacher', 'active',
'[{"name": "Chemistry", "proficiency": "expert", "years_experience": 7}, {"name": "Biology", "proficiency": "advanced", "years_experience": 6}]'::jsonb),

('ffffffff-ffff-ffff-ffff-ffffffffffff', 'SPR-T-0006', '11111111-1111-1111-1111-111111111111', 'Lisa', 'Davis', 'lisa.davis@springfield.edu', '+1-555-1006', 'class_teacher', 'active',
'[{"name": "History", "proficiency": "expert", "years_experience": 9}, {"name": "Geography", "proficiency": "advanced", "years_experience": 7}]'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 3. MOCK TIMETABLE
-- ============================================
INSERT INTO timetables (id, school_id, academic_year, term, start_date, end_date, status) VALUES
('tttttttt-tttt-tttt-tttt-tttttttttttt', '11111111-1111-1111-1111-111111111111', '2024-2025', 'Term 1', '2024-09-01', '2024-12-20', 'published')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 4. MOCK TIMETABLE SLOTS
-- ============================================
-- Robert Smith (Mathematics Teacher) - Monday
INSERT INTO timetable_slots (timetable_id, teacher_id, day_of_week, period_number, start_time, end_time, class_name, subject_name, room_number) VALUES
('tttttttt-tttt-tttt-tttt-tttttttttttt', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 1, 1, '08:00', '08:45', '10-A', 'Mathematics', '101'),
('tttttttt-tttt-tttt-tttt-tttttttttttt', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 1, 2, '08:45', '09:30', '10-B', 'Mathematics', '101'),
('tttttttt-tttt-tttt-tttt-tttttttttttt', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 1, 4, '10:30', '11:15', '11-A', 'Physics', '201'),
('tttttttt-tttt-tttt-tttt-tttttttttttt', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 1, 5, '11:15', '12:00', '11-B', 'Physics', '201'),

-- Robert Smith - Tuesday
('tttttttt-tttt-tttt-tttt-tttttttttttt', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 2, 1, '08:00', '08:45', '10-C', 'Mathematics', '101'),
('tttttttt-tttt-tttt-tttt-tttttttttttt', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 2, 3, '09:45', '10:30', '10-A', 'Mathematics', '101'),
('tttttttt-tttt-tttt-tttt-tttttttttttt', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 2, 5, '11:15', '12:00', '11-A', 'Physics', '201'),

-- Robert Smith - Wednesday
('tttttttt-tttt-tttt-tttt-tttttttttttt', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 3, 2, '08:45', '09:30', '10-B', 'Mathematics', '101'),
('tttttttt-tttt-tttt-tttt-tttttttttttt', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 3, 4, '10:30', '11:15', '10-C', 'Mathematics', '101'),
('tttttttt-tttt-tttt-tttt-tttttttttttt', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 3, 6, '12:00', '12:45', '11-B', 'Physics', '201'),

-- Emily Johnson (English Teacher) - Monday
('tttttttt-tttt-tttt-tttt-tttttttttttt', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 1, 3, '09:45', '10:30', '10-A', 'English', '102'),
('tttttttt-tttt-tttt-tttt-tttttttttttt', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 1, 6, '12:00', '12:45', '10-B', 'English', '102'),
('tttttttt-tttt-tttt-tttt-tttttttttttt', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 1, 7, '13:30', '14:15', '11-A', 'Literature', '102'),

-- Emily Johnson - Tuesday
('tttttttt-tttt-tttt-tttt-tttttttttttt', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 2, 2, '08:45', '09:30', '10-C', 'English', '102'),
('tttttttt-tttt-tttt-tttt-tttttttttttt', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 2, 4, '10:30', '11:15', '10-A', 'English', '102'),
('tttttttt-tttt-tttt-tttt-tttttttttttt', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 2, 6, '12:00', '12:45', '11-B', 'Literature', '102'),

-- Michael Brown (Chemistry Teacher) - Monday
('tttttttt-tttt-tttt-tttt-tttttttttttt', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 1, 8, '14:15', '15:00', '11-A', 'Chemistry', '301'),
('tttttttt-tttt-tttt-tttt-tttttttttttt', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 1, 9, '15:00', '15:45', '11-B', 'Chemistry', '301'),

-- Michael Brown - Wednesday
('tttttttt-tttt-tttt-tttt-tttttttttttt', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 3, 7, '13:30', '14:15', '11-A', 'Biology', '301'),
('tttttttt-tttt-tttt-tttt-tttttttttttt', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 3, 8, '14:15', '15:00', '11-B', 'Biology', '301')
ON CONFLICT DO NOTHING;

-- ============================================
-- 5. MOCK LESSON PLANS
-- ============================================

-- Draft Lesson Plans
INSERT INTO lesson_plans (id, teacher_id, title, subject, class_name, date, duration, learning_objectives, activities, resources, status) VALUES
('lp-draft-1', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 
'Introduction to Quadratic Equations', 'Mathematics', '10-A', '2024-11-25', 45,
'Students will be able to: 1) Define quadratic equations, 2) Identify coefficients a, b, c, 3) Solve simple quadratic equations using factoring',
'[
  {"description": "Review linear equations", "type": "lecture", "duration": 10},
  {"description": "Introduce quadratic form ax² + bx + c = 0", "type": "lecture", "duration": 15},
  {"description": "Practice problems in groups", "type": "group_work", "duration": 15},
  {"description": "Quick quiz", "type": "assessment", "duration": 5}
]'::jsonb,
'[
  {"name": "Algebra Textbook Chapter 5", "type": "textbook", "url": ""},
  {"name": "Quadratic Equations Worksheet", "type": "worksheet", "url": ""},
  {"name": "Graphing Calculator", "type": "equipment", "url": ""}
]'::jsonb,
'draft'),

-- Submitted Lesson Plans (Pending Approval)
('lp-submitted-1', 'cccccccc-cccc-cccc-cccc-cccccccccccc',
'Newton''s Laws of Motion', 'Physics', '11-A', '2024-11-26', 45,
'Students will: 1) Understand Newton''s three laws of motion, 2) Apply laws to real-world scenarios, 3) Calculate force using F=ma',
'[
  {"description": "Introduction to Newton and his contributions", "type": "lecture", "duration": 10},
  {"description": "Explain three laws with demonstrations", "type": "practical", "duration": 20},
  {"description": "Group discussion on real-world applications", "type": "discussion", "duration": 10},
  {"description": "Problem-solving exercises", "type": "group_work", "duration": 5}
]'::jsonb,
'[
  {"name": "Physics Textbook Chapter 3", "type": "textbook", "url": ""},
  {"name": "Newton''s Laws Video", "type": "video", "url": "https://youtube.com/example"},
  {"name": "Force Demonstration Kit", "type": "equipment", "url": ""},
  {"name": "Practice Problems Sheet", "type": "worksheet", "url": ""}
]'::jsonb,
'submitted'),

('lp-submitted-2', 'dddddddd-dddd-dddd-dddd-dddddddddddd',
'Shakespeare''s Romeo and Juliet - Act 1', 'English', '10-A', '2024-11-27', 45,
'Students will: 1) Understand the historical context of the play, 2) Analyze characters in Act 1, 3) Identify key themes',
'[
  {"description": "Brief history of Shakespeare and Elizabethan era", "type": "lecture", "duration": 10},
  {"description": "Read Act 1 Scene 1 aloud", "type": "discussion", "duration": 15},
  {"description": "Character analysis in groups", "type": "group_work", "duration": 15},
  {"description": "Class discussion on themes", "type": "discussion", "duration": 5}
]'::jsonb,
'[
  {"name": "Romeo and Juliet Text", "type": "textbook", "url": ""},
  {"name": "Character Map Worksheet", "type": "worksheet", "url": ""},
  {"name": "Historical Context Video", "type": "video", "url": "https://youtube.com/example"},
  {"name": "SparkNotes Guide", "type": "website", "url": "https://sparknotes.com/shakespeare/romeojuliet"}
]'::jsonb,
'submitted'),

-- Approved Lesson Plans
('lp-approved-1', 'cccccccc-cccc-cccc-cccc-cccccccccccc',
'Algebraic Expressions and Simplification', 'Mathematics', '10-B', '2024-11-20', 45,
'Students will: 1) Simplify algebraic expressions, 2) Combine like terms, 3) Apply distributive property',
'[
  {"description": "Review basic algebra concepts", "type": "lecture", "duration": 10},
  {"description": "Demonstrate simplification techniques", "type": "lecture", "duration": 15},
  {"description": "Individual practice problems", "type": "group_work", "duration": 15},
  {"description": "Exit ticket assessment", "type": "assessment", "duration": 5}
]'::jsonb,
'[
  {"name": "Algebra Workbook", "type": "textbook", "url": ""},
  {"name": "Practice Worksheet", "type": "worksheet", "url": ""},
  {"name": "Khan Academy Video", "type": "video", "url": "https://khanacademy.org"}
]'::jsonb,
'approved'),

('lp-approved-2', 'dddddddd-dddd-dddd-dddd-dddddddddddd',
'Essay Writing: Introduction and Thesis Statements', 'English', '10-C', '2024-11-21', 45,
'Students will: 1) Understand essay structure, 2) Write effective thesis statements, 3) Create engaging introductions',
'[
  {"description": "Explain essay structure (intro, body, conclusion)", "type": "lecture", "duration": 10},
  {"description": "Analyze sample thesis statements", "type": "discussion", "duration": 10},
  {"description": "Write practice thesis statements", "type": "group_work", "duration": 20},
  {"description": "Peer review and feedback", "type": "discussion", "duration": 5}
]'::jsonb,
'[
  {"name": "Writing Guide Textbook", "type": "textbook", "url": ""},
  {"name": "Sample Essays Collection", "type": "worksheet", "url": ""},
  {"name": "Purdue OWL Writing Guide", "type": "website", "url": "https://owl.purdue.edu"}
]'::jsonb,
'approved'),

-- Rejected Lesson Plan
('lp-rejected-1', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
'Basic Chemistry Concepts', 'Chemistry', '11-A', '2024-11-22', 45,
'Learn about atoms and molecules',
'[
  {"description": "Talk about chemistry", "type": "lecture", "duration": 45}
]'::jsonb,
'[
  {"name": "Chemistry Book", "type": "textbook", "url": ""}
]'::jsonb,
'rejected'),

-- Revision Required
('lp-revision-1', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
'Chemical Reactions and Equations', 'Chemistry', '11-B', '2024-11-23', 45,
'Students will understand chemical reactions and how to balance equations',
'[
  {"description": "Introduce chemical reactions", "type": "lecture", "duration": 20},
  {"description": "Practice balancing equations", "type": "group_work", "duration": 25}
]'::jsonb,
'[
  {"name": "Chemistry Textbook Chapter 7", "type": "textbook", "url": ""},
  {"name": "Balancing Equations Worksheet", "type": "worksheet", "url": ""}
]'::jsonb,
'revision_required')
ON CONFLICT (id) DO NOTHING;

-- Update submitted lesson plans with submission timestamp
UPDATE lesson_plans 
SET submitted_at = NOW() - INTERVAL '2 days'
WHERE status = 'submitted';

-- Update approved lesson plans with review info
UPDATE lesson_plans 
SET 
  reviewed_at = NOW() - INTERVAL '1 day',
  review_comments = 'Excellent lesson plan! Well-structured with clear objectives and engaging activities.'
WHERE status = 'approved';

-- Update rejected lesson plan with review info
UPDATE lesson_plans 
SET 
  reviewed_at = NOW() - INTERVAL '1 day',
  review_comments = 'Learning objectives are too vague. Please provide specific, measurable objectives. Activities need more variety and detail. Add more resources including hands-on materials.'
WHERE status = 'rejected';

-- Update revision required lesson plan with review info
UPDATE lesson_plans 
SET 
  reviewed_at = NOW() - INTERVAL '1 day',
  review_comments = 'Good start! Please add: 1) More specific learning objectives with measurable outcomes, 2) A demonstration or practical activity, 3) Assessment method to check understanding, 4) Safety guidelines for lab work.'
WHERE status = 'revision_required';

-- ============================================
-- 6. MOCK TEACHER JOURNAL ENTRIES
-- ============================================
INSERT INTO teacher_journal (teacher_id, lesson_plan_id, date, reflection, student_engagement, objectives_met, challenges, improvements) VALUES
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'lp-approved-1', '2024-11-20',
'The lesson went well overall. Students grasped the concept of combining like terms quickly. The practice problems helped reinforce the learning.',
'high', true,
'A few students struggled with negative coefficients. Need to spend more time on this next class.',
'Add more visual aids and color-coding for positive/negative terms. Include more real-world examples.'),

('dddddddd-dddd-dddd-dddd-dddddddddddd', 'lp-approved-2', '2024-11-21',
'Students were engaged during the peer review activity. Most were able to write clear thesis statements by the end of class.',
'high', true,
'Time management - we rushed through the peer review section.',
'Allocate 10 minutes for peer review instead of 5. Prepare more sample thesis statements for analysis.')
ON CONFLICT DO NOTHING;

-- ============================================
-- 7. CALCULATE WORKLOAD FOR TEACHERS
-- ============================================
-- This will populate the teacher_workload table
SELECT calculate_teacher_workload('cccccccc-cccc-cccc-cccc-cccccccccccc', 'tttttttt-tttt-tttt-tttt-tttttttttttt');
SELECT calculate_teacher_workload('dddddddd-dddd-dddd-dddd-dddddddddddd', 'tttttttt-tttt-tttt-tttt-tttttttttttt');
SELECT calculate_teacher_workload('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'tttttttt-tttt-tttt-tttt-tttttttttttt');

-- ============================================
-- 8. DETECT CONFLICTS
-- ============================================
SELECT detect_timetable_conflicts('tttttttt-tttt-tttt-tttt-tttttttttttt');

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check teachers
SELECT teacher_id, first_name, last_name, role, onboarding_status FROM teachers ORDER BY teacher_id;

-- Check timetable slots count per teacher
SELECT 
  t.teacher_id,
  t.first_name || ' ' || t.last_name as teacher_name,
  COUNT(ts.id) as total_periods
FROM teachers t
LEFT JOIN timetable_slots ts ON t.id = ts.teacher_id
GROUP BY t.id, t.teacher_id, t.first_name, t.last_name
ORDER BY t.teacher_id;

-- Check lesson plans by status
SELECT 
  status,
  COUNT(*) as count
FROM lesson_plans
GROUP BY status
ORDER BY status;

-- Check teacher workload
SELECT 
  t.teacher_id,
  t.first_name || ' ' || t.last_name as teacher_name,
  tw.total_periods_per_week,
  tw.max_consecutive_classes
FROM teachers t
JOIN teacher_workload tw ON t.id = tw.teacher_id
ORDER BY t.teacher_id;

-- Check conflicts
SELECT * FROM timetable_conflicts WHERE resolved = false;

-- ============================================
-- SUMMARY
-- ============================================
SELECT 'Mock data inserted successfully!' as message;
SELECT 'Teachers: ' || COUNT(*) as count FROM teachers;
SELECT 'Timetable Slots: ' || COUNT(*) as count FROM timetable_slots;
SELECT 'Lesson Plans: ' || COUNT(*) as count FROM lesson_plans;
SELECT 'Journal Entries: ' || COUNT(*) as count FROM teacher_journal;

-- ============================================================
-- Recursive Directory Tree — test data for College Admin
-- Org: 925b2e15-6957-40d5-82c0-5a28ee49950a ("collge admin a's Institution")
-- ============================================================

-- 1. Two departments for this college
INSERT INTO departments (id, college_id, name, code, status)
VALUES
  ('d1000000-0000-4000-8000-000000000001', '925b2e15-6957-40d5-82c0-5a28ee49950a', 'Computer Science', 'CS', 'active'),
  ('d1000000-0000-4000-8000-000000000002', '925b2e15-6957-40d5-82c0-5a28ee49950a', 'Mechanical Engineering', 'ME', 'active')
ON CONFLICT (id) DO NOTHING;

-- 2. One program per department (required FK for program_sections)
INSERT INTO programs (id, department_id, name, code, degree_level, status)
VALUES
  ('a1000000-0000-4000-8000-000000000001', 'd1000000-0000-4000-8000-000000000001', 'B.Tech Computer Science', 'BTCS', 'undergraduate', 'active'),
  ('a1000000-0000-4000-8000-000000000002', 'd1000000-0000-4000-8000-000000000002', 'B.Tech Mechanical', 'BTME', 'undergraduate', 'active')
ON CONFLICT (id) DO NOTHING;

-- 3. Sections across different academic years (department -> academic_year -> section)
INSERT INTO program_sections (id, department_id, program_id, semester, section, academic_year, status)
VALUES
  ('51000000-0000-4000-8000-000000000001', 'd1000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000001', 1, 'A', '2026', 'active'),
  ('51000000-0000-4000-8000-000000000002', 'd1000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000001', 1, 'B', '2026', 'active'),
  ('51000000-0000-4000-8000-000000000003', 'd1000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000001', 3, 'A', '2025', 'active'),
  ('51000000-0000-4000-8000-000000000004', 'd1000000-0000-4000-8000-000000000002', 'a1000000-0000-4000-8000-000000000002', 1, 'A', '2026', 'active')
ON CONFLICT (id) DO NOTHING;

-- 4. Assign your 4 existing test learners across these sections
UPDATE learners SET program_section_id = '51000000-0000-4000-8000-000000000001' WHERE id = '26e1470e-1f40-4fdc-9ada-412a2666b614';
UPDATE learners SET program_section_id = '51000000-0000-4000-8000-000000000001' WHERE id = 'a1e10001-0000-4000-8000-000000000001';
UPDATE learners SET program_section_id = '51000000-0000-4000-8000-000000000002' WHERE id = 'a1e10001-0000-4000-8000-000000000002';
UPDATE learners SET program_section_id = '51000000-0000-4000-8000-000000000004' WHERE id = 'a1e10001-0000-4000-8000-000000000003';

-- 5. Verify
SELECT l.email, d.name AS department, ps.academic_year, ps.section
FROM learners l
JOIN program_sections ps ON ps.id = l.program_section_id
JOIN departments d ON d.id = ps.department_id
WHERE l.college_id = '925b2e15-6957-40d5-82c0-5a28ee49950a';

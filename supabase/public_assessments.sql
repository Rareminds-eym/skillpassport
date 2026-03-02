SET session_replication_role = replica;

--
-- PostgreSQL database dump
--

-- \restrict wXC3zDVw9heTfCWfOmi2hLYIKXMGkIFyykgkgWPlYFZ90Xj8yWFCDwB1hKgN4eJ

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: assessments; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."assessments" ("id", "assessment_code", "type", "academic_year", "department_id", "program_id", "semester", "course_id", "course_name", "course_code", "duration_minutes", "total_marks", "pass_marks", "weightage", "instructions", "syllabus_coverage", "question_paper_pattern", "status", "is_published", "is_locked", "created_by", "approved_by", "created_at", "updated_at", "approved_at", "faculty_id", "college_id", "school_id", "teacher_id", "start_date", "end_date", "target_classes") VALUES
	('5e664a1b-09a8-42c3-98d2-c876cc7b8677', 'TEST-IA1-2024-888', 'IA1', '2024-25', 'a987bd28-dcd0-478d-af06-42a0d0128da7', '1b729bdb-3004-4ff4-a446-7fb6c52d7e72', 3, '185304ec-9f30-4854-86bf-23e0242912c7', 'Database Management Systems', 'DBMS301', 90, 50.00, 20.00, NULL, NULL, '[]', NULL, 'draft', false, false, NULL, NULL, '2025-12-12 11:44:02.687803+00', '2025-12-12 11:44:02.687803+00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
	('96370832-31bd-4012-ab05-3252e888e38b', 'TEST-IA2-2024-861', 'IA2', '2024-25', 'a987bd28-dcd0-478d-af06-42a0d0128da7', '1b729bdb-3004-4ff4-a446-7fb6c52d7e72', 5, '7bc65392-6f6a-4323-9804-da6f2b13e618', 'Machine Learning', 'ML501', 120, 100.00, 40.00, NULL, NULL, '[]', NULL, 'draft', false, false, NULL, NULL, '2025-12-12 11:44:17.011319+00', '2025-12-12 11:44:17.011319+00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
	('1bf53285-0279-49da-ac94-9d42e3da38cc', 'Class 10-B Physics Practical', 'practical_exam', '2024-2025', NULL, NULL, 10, NULL, 'Physics', '10-B', 120, 50.00, 18.00, NULL, 'Lab coats are mandatory. Bring an observation notebook.', '{"grade": "10", "section": "B", "examType": "multi-subject", "subjects": [{"id": "1765699647057", "name": "Physics", "duration": 120, "totalMarks": 50, "passingMarks": 18}], "totalSubjects": 1}', NULL, 'published', true, false, '52004557-7df2-4c2a-bffb-437588cbb619', NULL, '2025-12-14 08:07:33.728+00', '2025-12-14 18:20:37.555913+00', NULL, NULL, NULL, '69cf3489-0046-4414-8acc-409174ffbd2c', '61c92620-37f5-4be1-9537-d377c95aff31', '2025-12-31', '2025-12-31', '{"type": "single_section", "grade": "10", "sections": ["B"], "class_ids": ["0719a288-54cf-4747-96f7-59f2a8a66397"]}'),
	('117cfcb1-b87f-4b60-8004-f5fb6d32a14f', 'Grade 10 Mid-Term Examination', 'term_exam', '2024-2025', NULL, NULL, 10, NULL, 'Grade 10 Mid-Term Examination (3 subjects)', '10-ALL', 540, 300.00, 105.00, NULL, 'Students must bring calculator and drawing instruments', '{"grade": "10", "section": "", "examType": "multi-subject", "subjects": [{"id": "1765699514453", "name": "Mathematics", "duration": 180, "totalMarks": 100, "passingMarks": 35}, {"id": "1765699518078", "name": "Physics", "duration": 180, "totalMarks": 100, "passingMarks": 35}, {"id": "1765699520525", "name": "Chemistry", "duration": 180, "totalMarks": 100, "passingMarks": 35}], "totalSubjects": 3}', NULL, 'published', true, false, '52004557-7df2-4c2a-bffb-437588cbb619', NULL, '2025-12-14 08:05:26.914+00', '2025-12-14 18:07:04.124278+00', NULL, NULL, NULL, '69cf3489-0046-4414-8acc-409174ffbd2c', '61c92620-37f5-4be1-9537-d377c95aff31', '2025-12-22', '2025-12-29', '{"type": "whole_grade", "grade": "10", "sections": null, "class_ids": ["0719a288-54cf-4747-96f7-59f2a8a66397", "588f5c42-2f91-4fec-89cc-dca5de209611", "63c95b3d-ffdb-4b54-af81-cdf7ba8c154c"]}'),
	('63fefdef-7822-4849-be7d-24bbd56f4de6', 'Mid term Exam', 'class_participation', '2025-2026', NULL, NULL, 10, NULL, 'Mathematics', '10-A', 180, 100.00, 24.00, NULL, '', '{"grade": "10", "section": "A", "examType": "multi-subject", "subjects": [{"id": "1766057362560", "name": "Mathematics", "duration": 180, "totalMarks": 100, "passingMarks": 24}], "totalSubjects": 1}', NULL, 'draft', false, false, '52004557-7df2-4c2a-bffb-437588cbb619', NULL, '2025-12-18 11:29:25.637+00', '2025-12-18 11:32:51.152913+00', NULL, NULL, NULL, '69cf3489-0046-4414-8acc-409174ffbd2c', '61c92620-37f5-4be1-9537-d377c95aff31', '2025-12-18', '2025-12-18', '{"type": "single_section", "grade": "10", "sections": ["A"], "class_ids": ["63c95b3d-ffdb-4b54-af81-cdf7ba8c154c"]}'),
	('ac213258-558b-4f14-b094-d34d4d0c0aa3', 'Mid Term Exam 2025 - 2026', 'term_exam', '2024-2025', NULL, NULL, 10, NULL, 'Mid Term Exam 2025 - 2026 (5 subjects)', '10-ALL', 900, 500.00, 175.00, NULL, 'testing logic', '{"grade": "10", "section": "", "examType": "multi-subject", "subjects": [{"id": "1766559560862", "name": "Mathematics", "duration": 180, "totalMarks": 100, "passingMarks": 35}, {"id": "1766559563519", "name": "Physics", "duration": 180, "totalMarks": 100, "passingMarks": 35}, {"id": "1766559568737", "name": "Chemistry", "duration": 180, "totalMarks": 100, "passingMarks": 35}, {"id": "1766559571803", "name": "English", "duration": 180, "totalMarks": 100, "passingMarks": 35}, {"id": "1766559577647", "name": "Business Studies", "duration": 180, "totalMarks": 100, "passingMarks": 35}], "totalSubjects": 5}', NULL, 'draft', false, false, '52004557-7df2-4c2a-bffb-437588cbb619', NULL, '2025-12-24 07:00:18.481+00', '2025-12-24 07:07:15.830336+00', NULL, NULL, NULL, '69cf3489-0046-4414-8acc-409174ffbd2c', '61c92620-37f5-4be1-9537-d377c95aff31', '2025-12-24', '2025-12-31', '{"type": "whole_grade", "grade": "10", "sections": null, "class_ids": ["0719a288-54cf-4747-96f7-59f2a8a66397", "63c95b3d-ffdb-4b54-af81-cdf7ba8c154c", "588f5c42-2f91-4fec-89cc-dca5de209611"]}'),
	('4ba9029e-b322-4c72-abba-5bdb370d2be7', 'test', 'periodic_test', '2025-2026', NULL, NULL, 10, NULL, 'Biology', '10-A', 180, 100.00, 35.00, NULL, '', '{"grade": "10", "section": "A", "examType": "multi-subject", "subjects": [{"id": "1769686695834", "name": "Biology", "duration": 180, "totalMarks": 100, "passingMarks": 35}], "totalSubjects": 1}', NULL, 'published', true, false, '52004557-7df2-4c2a-bffb-437588cbb619', NULL, '2026-01-29 11:38:18.261+00', '2026-01-29 11:41:55.612162+00', NULL, NULL, NULL, '69cf3489-0046-4414-8acc-409174ffbd2c', '61c92620-37f5-4be1-9537-d377c95aff31', '2026-01-29', '2026-01-29', '{"type": "single_section", "grade": "10", "sections": ["A"], "class_ids": ["63c95b3d-ffdb-4b54-af81-cdf7ba8c154c"]}'),
	('fb85d26c-852e-47db-b43a-84353d0753eb', 'Final Exam 2025 - 2026', 'term_exam', '2025-2026', NULL, NULL, 10, NULL, 'Final Exam 2025 - 2026 (2 subjects)', '10-ALL', 360, 200.00, 70.00, NULL, 'test', '{"grade": "10", "section": "", "examType": "multi-subject", "subjects": [{"id": "1766562074558", "name": "Physics", "duration": 180, "totalMarks": 100, "passingMarks": 35}, {"id": "1766562077865", "name": "History", "duration": 180, "totalMarks": 100, "passingMarks": 35}], "totalSubjects": 2}', NULL, 'draft', false, false, '52004557-7df2-4c2a-bffb-437588cbb619', NULL, '2025-12-24 07:41:19.285+00', '2025-12-24 07:51:08.568503+00', NULL, NULL, NULL, '69cf3489-0046-4414-8acc-409174ffbd2c', '61c92620-37f5-4be1-9537-d377c95aff31', '2026-01-05', '2026-01-12', '{"type": "whole_grade", "grade": "10", "sections": null, "class_ids": ["0719a288-54cf-4747-96f7-59f2a8a66397", "63c95b3d-ffdb-4b54-af81-cdf7ba8c154c", "588f5c42-2f91-4fec-89cc-dca5de209611"]}');


--

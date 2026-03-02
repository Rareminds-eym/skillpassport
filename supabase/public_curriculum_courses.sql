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
-- Data for Name: curriculum_courses; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."curriculum_courses" ("id", "college_id", "department_id", "program_id", "course_code", "course_name", "course_type", "semester", "credits", "contact_hours", "syllabus", "learning_outcomes", "prerequisites", "is_active", "created_at", "updated_at", "created_by") VALUES
	('52a1e889-ac18-4d35-aef8-f306540eb80c', NULL, NULL, NULL, 'CS101', 'Introduction to Programming', 'Theory', 1, 4.00, 4, NULL, '[]', '[]', true, '2025-12-12 11:32:37.819833+00', '2025-12-12 11:32:37.819833+00', NULL),
	('d0d14d3d-58e9-4d77-b30b-38bb08461c08', NULL, NULL, NULL, 'CS102', 'Programming Lab', 'Lab', 1, 2.00, 4, NULL, '[]', '[]', true, '2025-12-12 11:32:37.819833+00', '2025-12-12 11:32:37.819833+00', NULL),
	('57c7e154-dba5-4748-98fb-cce5f00013fa', NULL, NULL, NULL, 'MA101', 'Engineering Mathematics I', 'Theory', 1, 4.00, 4, NULL, '[]', '[]', true, '2025-12-12 11:32:37.819833+00', '2025-12-12 11:32:37.819833+00', NULL),
	('71c8f837-e006-42a7-8878-279039ec9a4d', NULL, NULL, NULL, 'CS201', 'Data Structures', 'Theory', 2, 4.00, 4, NULL, '[]', '[]', true, '2025-12-12 11:32:37.819833+00', '2025-12-12 11:32:37.819833+00', NULL),
	('c55790bd-b827-46a4-8ada-87069d36229d', NULL, NULL, NULL, 'CS202', 'Data Structures Lab', 'Lab', 2, 2.00, 4, NULL, '[]', '[]', true, '2025-12-12 11:32:37.819833+00', '2025-12-12 11:32:37.819833+00', NULL),
	('4bd0ecd3-2f7e-456b-b931-d03b88749eed', NULL, NULL, NULL, '10-A', 'Mathematics', 'Theory', 1, 0.00, 0, NULL, '[]', '[]', true, '2025-12-12 11:33:22.849541+00', '2025-12-12 11:33:22.849541+00', NULL),
	('05db7dae-02e2-42b8-8571-ed50044a72d7', NULL, NULL, NULL, 'CSF101', 'Computer Science Fundamentals', 'Core', 1, 4.00, 4, NULL, '[]', '[]', true, '2025-12-12 11:43:27.457797+00', '2025-12-12 11:43:27.457797+00', NULL),
	('0368b4b4-dc8c-4c7e-917e-3ec799598bd8', NULL, NULL, NULL, 'DSA201', 'Data Structures and Algorithms', 'Core', 2, 4.00, 4, NULL, '[]', '[]', true, '2025-12-12 11:43:27.457797+00', '2025-12-12 11:43:27.457797+00', NULL),
	('185304ec-9f30-4854-86bf-23e0242912c7', NULL, NULL, NULL, 'DBMS301', 'Database Management Systems', 'Core', 3, 4.00, 4, NULL, '[]', '[]', true, '2025-12-12 11:43:27.457797+00', '2025-12-12 11:43:27.457797+00', NULL),
	('6f35f884-2f3c-4e5d-af56-5f6367266c9a', NULL, NULL, NULL, 'SE401', 'Software Engineering', 'Core', 4, 4.00, 4, NULL, '[]', '[]', true, '2025-12-12 11:43:27.457797+00', '2025-12-12 11:43:27.457797+00', NULL),
	('60bf43ec-2aaf-458b-8b6a-6ed0e775472e', NULL, NULL, NULL, 'WD301', 'Web Development', 'Elective', 3, 3.00, 4, NULL, '[]', '[]', true, '2025-12-12 11:43:27.457797+00', '2025-12-12 11:43:27.457797+00', NULL),
	('7bc65392-6f6a-4323-9804-da6f2b13e618', NULL, NULL, NULL, 'ML501', 'Machine Learning', 'Elective', 5, 4.00, 4, NULL, '[]', '[]', true, '2025-12-12 11:43:27.457797+00', '2025-12-12 11:43:27.457797+00', NULL),
	('6b2b4ffe-7b25-4304-b58c-6246ed69fc70', NULL, NULL, NULL, 'AI501', 'Artificial Intelligence', 'Elective', 5, 4.00, 4, NULL, '[]', '[]', true, '2025-12-12 11:43:27.457797+00', '2025-12-12 11:43:27.457797+00', NULL),
	('11c7e539-003d-4f0c-9535-df9220c5ff98', NULL, NULL, NULL, 'CN401', 'Computer Networks', 'Core', 4, 4.00, 4, NULL, '[]', '[]', true, '2025-12-12 11:43:27.457797+00', '2025-12-12 11:43:27.457797+00', NULL),
	('9f8ceaee-8b6f-4bff-b0fb-31d4bbdb1e61', NULL, NULL, NULL, 'OS301', 'Operating Systems', 'Core', 3, 4.00, 4, NULL, '[]', '[]', true, '2025-12-12 11:43:27.457797+00', '2025-12-12 11:43:27.457797+00', NULL),
	('7854812c-1ed5-4751-a658-e4173dd2a770', NULL, NULL, NULL, 'MCS101', 'Mathematics for CS', 'Theory', 1, 4.00, 4, NULL, '[]', '[]', true, '2025-12-12 11:43:27.457797+00', '2025-12-12 11:43:27.457797+00', NULL),
	('4030dd12-7ba1-4299-951d-c4bb53e6b26d', NULL, NULL, NULL, 'SP201', 'Statistics and Probability', 'Theory', 2, 3.00, 3, NULL, '[]', '[]', true, '2025-12-12 11:43:27.457797+00', '2025-12-12 11:43:27.457797+00', NULL),
	('1aaefe94-9c2d-4b0a-a81b-8b9d5c0abb64', NULL, NULL, NULL, 'DE201', 'Digital Electronics', 'Theory', 2, 3.00, 4, NULL, '[]', '[]', true, '2025-12-12 11:43:27.457797+00', '2025-12-12 11:43:27.457797+00', NULL);


--

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
-- Data for Name: college_attendance_sessions; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."college_attendance_sessions" ("id", "date", "start_time", "end_time", "subject_name", "subject_code", "course_type", "faculty_id", "faculty_name", "department_name", "program_name", "program_code", "semester", "section", "room_number", "academic_year", "total_students", "present_count", "absent_count", "late_count", "excused_count", "attendance_percentage", "status", "remarks", "created_at", "updated_at", "created_by", "college_id") VALUES
	('627630c7-c5c5-42f7-bdc9-d720a8bdd578', '2026-01-01', '01:30:00', '02:30:00', 'Data Structures', NULL, NULL, '50d864a9-5a7b-409a-b0c8-173a0ad7e35c', 'Rani M (Computer Science & Engineering)', 'Computer Science & Engineering', 'Bachelor of Technology in Computer Science', NULL, 1, 'A', '201', '2024-25', 60, 0, 0, 0, 0, 0.00, 'scheduled', 'fgvbh', '2026-01-07 05:11:23.883515+00', '2026-01-07 05:11:23.883515+00', '91bf6be4-31a5-4d6a-853d-675596755cee', '659ebe4b-bdae-40c8-901f-2fed3c221574'),
	('651e1f1b-d809-4441-82d1-e75604926343', '2026-01-01', '01:30:00', '02:30:00', 'Data Structures', NULL, NULL, '50d864a9-5a7b-409a-b0c8-173a0ad7e35c', 'Rani M (Computer Science & Engineering)', 'Computer Science & Engineering', 'Bachelor of Technology in Computer Science', NULL, 1, 'A', '201', '2024-25', 60, 0, 0, 0, 0, 0.00, 'scheduled', 'fghj', '2026-01-07 05:13:08.711968+00', '2026-01-07 05:13:08.711968+00', '91bf6be4-31a5-4d6a-853d-675596755cee', '659ebe4b-bdae-40c8-901f-2fed3c221574'),
	('148021a9-36c0-45d9-9bb1-5c09362248c2', '2026-01-29', '18:45:00', '19:45:00', 'Mathematics', NULL, NULL, '51945926-9aa6-4f88-bb23-65ea5944b08c', 'Priya Sharma (Computer Science & Engineering)', 'Department  Of Computer Science & Engineering', 'Bachelor of Technology in Computer Science', NULL, 2, 'A', '301', '2024-25', 60, 0, 0, 0, 0, 0.00, 'scheduled', '', '2026-01-29 12:16:02.560694+00', '2026-01-29 12:16:02.560694+00', '91bf6be4-31a5-4d6a-853d-675596755cee', '659ebe4b-bdae-40c8-901f-2fed3c221574'),
	('dc03f8f4-1060-4f98-b672-2f80bb094ef9', '2026-02-03', '09:00:00', '20:45:00', 'Electronics Lab', NULL, NULL, '0f4b36d3-bebe-456f-8e11-b89a4fe2a723', 'Susmitha M (Computer Science & Engineering)', 'Department Of Mechanical Engineering', 'M.Sc Data Science', NULL, 1, 'A', 'R10', '2024-25', 60, 0, 0, 0, 0, 0.00, 'scheduled', '', '2026-02-03 09:17:21.305451+00', '2026-02-03 09:17:21.305451+00', '91bf6be4-31a5-4d6a-853d-675596755cee', 'c16a95cf-6ee5-4aa9-8e47-84fbda49611d');


--

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
-- Data for Name: assessment_types; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."assessment_types" ("id", "name", "description", "is_active", "created_at", "updated_at", "institution_id", "institution_type") VALUES
	('146df3e3-7139-415b-bf2b-9d2ca38d65e3', 'Quiz', 'Short quiz assessment', true, '2025-12-03 04:22:01.757683', '2026-01-05 09:53:23.074198', '69cf3489-0046-4414-8acc-409174ffbd2c', 'school'),
	('19cc6af8-050f-48db-b70b-f47b20f9c0d8', 'Project', 'Project-based evaluation', true, '2025-12-03 04:22:01.757683', '2026-01-05 09:53:23.074198', '69cf3489-0046-4414-8acc-409174ffbd2c', 'school'),
	('3b9de792-b6bb-4668-a345-9689dee50fb4', 'Assignment', 'Take-home assignments', true, '2025-12-03 04:22:01.757683', '2026-01-05 09:53:23.074198', '69cf3489-0046-4414-8acc-409174ffbd2c', 'school'),
	('473b5c24-460e-44cb-9cc6-d5dd0bb64713', 'Lab Work', 'Laboratory work evaluation', true, '2025-12-03 04:22:01.757683', '2026-01-05 09:53:23.074198', '69cf3489-0046-4414-8acc-409174ffbd2c', 'school'),
	('47829f36-289f-4d6c-a2b6-fc473b0d8328', 'Practical Exam', 'Hands-on practical assessment', true, '2025-12-03 04:22:01.757683', '2026-01-05 09:53:23.074198', '69cf3489-0046-4414-8acc-409174ffbd2c', 'school'),
	('4d0a6393-4100-4ffe-a5cd-ee57d705a692', 'Written Test', 'Traditional written examination', true, '2025-12-03 04:22:01.757683', '2026-01-05 09:53:23.074198', '69cf3489-0046-4414-8acc-409174ffbd2c', 'school'),
	('c86f3b0a-57c0-46d7-afd7-0c561f17951e', 'Presentation', 'Oral presentation', true, '2025-12-03 04:22:01.757683', '2026-01-05 09:53:23.074198', '69cf3489-0046-4414-8acc-409174ffbd2c', 'school'),
	('ec76fb2c-d2a5-4650-b00f-08b0990d83c0', 'Class Participation', 'Active participation in class', true, '2025-12-03 04:22:01.757683', '2026-01-05 09:53:23.074198', '69cf3489-0046-4414-8acc-409174ffbd2c', 'school'),
	('c34827be-9e22-4a09-935c-4cc2d457c134', 'Periodic Test', 'Short assessments conducted periodically', true, '2025-12-13 22:50:56', '2026-01-05 09:53:23.074198', '69cf3489-0046-4414-8acc-409174ffbd2c', 'school'),
	('95e1434f-0639-4ee2-b5f0-74bdfba10d2d', 'Term Exam', 'End of term examination', true, '2025-12-13 22:51:54', '2026-01-05 09:53:23.074198', '69cf3489-0046-4414-8acc-409174ffbd2c', 'school'),
	('87e502cb-1381-431c-b8a7-02cd43ba3fa2', 'Skill Assessment', 'Evaluation of practical and skill-based learning', true, '2025-12-13 22:52:18', '2026-01-05 09:53:23.074198', '69cf3489-0046-4414-8acc-409174ffbd2c', 'school'),
	('9d5d53f9-da1f-4d91-93d1-bfe1336fa15e', 'IA (Internal Assessment)', 'Continuous internal assessment', true, '2026-01-05 09:54:57.979714', '2026-01-05 09:54:57.979714', '659ebe4b-bdae-40c8-901f-2fed3c221574', 'college'),
	('4b216ccf-7090-436f-9233-02f1f16d4e43', 'End-Semester Exam', 'Final semester examination', true, '2026-01-05 09:54:57.979714', '2026-01-05 09:54:57.979714', '659ebe4b-bdae-40c8-901f-2fed3c221574', 'college'),
	('dd251699-92e7-441f-a5b5-23796d459f5d', 'Practical Exam', 'Hands-on practical assessment', true, '2026-01-05 09:54:57.979714', '2026-01-05 09:54:57.979714', '659ebe4b-bdae-40c8-901f-2fed3c221574', 'college'),
	('bbf6a582-3ac5-4823-ab1e-baded16531f3', 'Viva', 'Oral examination/interview', true, '2026-01-05 09:54:57.979714', '2026-01-05 09:54:57.979714', '659ebe4b-bdae-40c8-901f-2fed3c221574', 'college'),
	('f935d082-54e3-4191-b19c-9229d060f045', 'Arrears', 'Supplementary examination', true, '2026-01-05 09:54:57.979714', '2026-01-05 09:54:57.979714', '659ebe4b-bdae-40c8-901f-2fed3c221574', 'college'),
	('6c03fc3a-7d97-47f0-93bc-98f972474757', 'Project', 'Project-based evaluation', true, '2026-01-05 09:54:57.979714', '2026-01-05 09:54:57.979714', '659ebe4b-bdae-40c8-901f-2fed3c221574', 'college'),
	('bad2303d-e480-402f-8b21-9bf95e15a861', 'Assignment', 'Take-home assignments', true, '2026-01-05 09:54:57.979714', '2026-01-05 09:54:57.979714', '659ebe4b-bdae-40c8-901f-2fed3c221574', 'college'),
	('59aa6f06-00e7-4b68-a3fc-30cfad428a6e', 'Presentation', 'Oral presentation', true, '2026-01-05 09:54:57.979714', '2026-01-05 09:54:57.979714', '659ebe4b-bdae-40c8-901f-2fed3c221574', 'college'),
	('70c3f71c-9e03-4a71-9391-bb4189af546d', 'IA (Internal Assessment)', 'Continuous internal assessment', true, '2026-01-05 10:07:46.106686', '2026-01-05 10:07:46.106686', 'c16a95cf-6ee5-4aa9-8e47-84fbda49611d', 'college'),
	('d942abdf-75de-4fbb-b4f7-060f2155817b', 'End-Semester Exam', 'Final semester examination', true, '2026-01-05 10:07:46.106686', '2026-01-05 10:07:46.106686', 'c16a95cf-6ee5-4aa9-8e47-84fbda49611d', 'college'),
	('8fdd0a12-bf9f-4e97-b06d-4948124e1df4', 'Practical Exam', 'Hands-on practical assessment', true, '2026-01-05 10:07:46.106686', '2026-01-05 10:07:46.106686', 'c16a95cf-6ee5-4aa9-8e47-84fbda49611d', 'college'),
	('81820dcc-6d58-4b32-8a41-6006bb659a55', 'Viva', 'Oral examination/interview', true, '2026-01-05 10:07:46.106686', '2026-01-05 10:07:46.106686', 'c16a95cf-6ee5-4aa9-8e47-84fbda49611d', 'college'),
	('88ad11dd-a277-473c-8fcd-888b62edbe85', 'Arrears', 'Supplementary examination', true, '2026-01-05 10:07:46.106686', '2026-01-05 10:07:46.106686', 'c16a95cf-6ee5-4aa9-8e47-84fbda49611d', 'college'),
	('d4d69b6c-d4e5-4f94-affd-0ebb95d687d4', 'Project', 'Project-based evaluation', true, '2026-01-05 10:07:46.106686', '2026-01-05 10:07:46.106686', 'c16a95cf-6ee5-4aa9-8e47-84fbda49611d', 'college'),
	('eaeaa41b-ef9b-43fe-83ef-aa8d045e16e4', 'Assignment', 'Take-home assignments', true, '2026-01-05 10:07:46.106686', '2026-01-05 10:07:46.106686', 'c16a95cf-6ee5-4aa9-8e47-84fbda49611d', 'college'),
	('cd3e616f-11e5-4aad-8612-f7585f758906', 'Presentation', 'Oral presentation', true, '2026-01-05 10:07:46.106686', '2026-01-05 10:07:46.106686', 'c16a95cf-6ee5-4aa9-8e47-84fbda49611d', 'college'),
	('b1d7bd19-93d8-42cc-b63f-680f83292578', 'Quiz', 'Short quiz assessment', true, '2026-01-05 10:11:19.803349', '2026-01-05 10:11:19.803349', 'c16a95cf-6ee5-4aa9-8e47-84fbda49611d', 'college');


--

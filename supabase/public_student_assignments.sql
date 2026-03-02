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
-- Data for Name: student_assignments; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."student_assignments" ("student_assignment_id", "assignment_id", "student_id", "status", "priority", "grade_received", "grade_percentage", "instructor_feedback", "feedback_date", "graded_by", "graded_date", "submission_date", "submission_type", "submission_content", "submission_url", "is_late", "late_penalty", "assigned_date", "started_date", "completed_date", "is_deleted", "updated_date") VALUES
	('15ba9570-165c-4564-a5b3-7604f3964d7f', '93146c89-1055-42cf-8be4-4fa3f46d3642', 'c5d30a55-8d9a-46e6-b8d0-6accc0415c1c', 'submitted', 'medium', NULL, NULL, NULL, NULL, NULL, NULL, '2025-12-31 03:51:15.447+00', 'file', 'test.pdf', 'https://pub-ad91abcd16cd9e9c569d83d9ef46e398.r2.dev/assignments/93146c89-1055-42cf-8be4-4fa3f46d3642/submissions/15ba9570-165c-4564-a5b3-7604f3964d7f/1767153069893_test.pdf', false, NULL, '2025-12-30 07:24:05.218605+00', NULL, '2025-12-31 03:51:15.447+00', false, '2025-12-31 03:51:15.511047+00'),
	('f5d95089-9e4e-4ed2-b6f8-1bac5543a9d7', '32a759b8-3aed-42c4-a86c-6f0a065d66a5', 'c5d30a55-8d9a-46e6-b8d0-6accc0415c1c', 'graded', 'medium', 50.00, 50.00, 'testing ', '2025-12-30 16:17:27.958+00', '323c133d-6144-43ca-bfd0-aaa0f11c2c26', '2025-12-30 16:17:27.958+00', '2025-12-30 16:14:58.599+00', 'file', 'Receipt-23456789-2025-12-29.pdf', 'https://pub-ad91abcd16cd9e9c569d83d9ef46e398.r2.dev/assignments/32a759b8-3aed-42c4-a86c-6f0a065d66a5/submissions/f5d95089-9e4e-4ed2-b6f8-1bac5543a9d7/1767111297117_Receipt-23456789-2025-12-29.pdf', true, NULL, '2025-12-30 07:22:03.311511+00', NULL, '2025-12-30 16:14:58.599+00', false, '2025-12-31 04:08:17.078982+00'),
	('c1450f17-41ab-43fc-8cf8-b625ab3b2941', '77527857-c603-44f0-b274-5863b81a227f', 'c5d30a55-8d9a-46e6-b8d0-6accc0415c1c', 'submitted', 'medium', NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-03 10:34:26.885+00', 'file', 'experience_letter.pdf', 'https://pub-ad91abcd16cd9e9c569d83d9ef46e398.r2.dev/assignments/77527857-c603-44f0-b274-5863b81a227f/submissions/c1450f17-41ab-43fc-8cf8-b625ab3b2941/1767436465000_experience_letter.pdf', false, NULL, '2026-01-03 06:12:01.098976+00', NULL, '2026-01-03 10:34:26.885+00', false, '2026-01-03 10:34:29.703245+00'),
	('c534b72d-4547-493f-ac31-6c91601e7737', '7a867149-7b8c-4074-8fee-bc7e4901bba6', 'c5d30a55-8d9a-46e6-b8d0-6accc0415c1c', 'submitted', 'medium', NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-14 07:24:29.989+00', NULL, NULL, NULL, false, NULL, '2026-01-14 07:16:02.191753+00', '2026-01-14 07:16:46.158503+00', '2026-01-14 07:24:30.991502+00', false, '2026-01-14 07:24:30.991502+00'),
	('dd2f4e19-569f-44c9-b6f5-7d9787a518f6', '012a0cfb-620c-4238-8963-2c4fb5b0f770', 'c5d30a55-8d9a-46e6-b8d0-6accc0415c1c', 'todo', 'medium', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, '2026-01-17 09:34:05.451916+00', NULL, NULL, false, '2026-01-17 09:34:05.451916+00'),
	('c5c2a397-a42a-4106-b35e-d1465482bb25', '89ca81cd-2493-4a2d-96f2-27d6397261ca', '6fd75f6c-7a74-4e0e-96b2-58d22a5bfb5e', 'todo', 'medium', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, '2025-12-02 09:18:31.458818+00', NULL, NULL, false, '2025-12-02 09:18:31.458818+00'),
	('397b9958-b9b5-44e7-b703-32d7f16dc055', '5d58c5c6-56da-4c0a-be37-01cd40a134b5', 'c5d30a55-8d9a-46e6-b8d0-6accc0415c1c', 'submitted', 'medium', NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-28 10:43:07.989+00', 'file', 'Mechanical_Design_Engineer_Career_Roadmap.pdf', 'https://pub-ad91abcd16cd9e9c569d83d9ef46e398.r2.dev/assignments/5d58c5c6-56da-4c0a-be37-01cd40a134b5/submissions/397b9958-b9b5-44e7-b703-32d7f16dc055/1769596986517_Mechanical_Design_Engineer_Career_Roadmap.pdf', false, NULL, '2026-01-27 17:14:24.296881+00', NULL, '2026-01-28 10:43:07.989+00', false, '2026-01-28 10:43:09.013863+00'),
	('d4ce2281-9997-4339-aaea-10e184298eac', 'f4024fc6-d719-4577-8e87-54570b826349', 'c5d30a55-8d9a-46e6-b8d0-6accc0415c1c', 'submitted', 'medium', NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-29 04:39:31.045+00', 'file', 'Mechanical_Design_Engineer_Career_Roadmap.pdf', 'https://pub-ad91abcd16cd9e9c569d83d9ef46e398.r2.dev/assignments/f4024fc6-d719-4577-8e87-54570b826349/submissions/d4ce2281-9997-4339-aaea-10e184298eac/1769661567338_Mechanical_Design_Engineer_Career_Roadmap.pdf', false, NULL, '2026-01-29 04:38:40.713165+00', NULL, '2026-01-29 04:39:31.045+00', false, '2026-01-29 04:39:31.318786+00'),
	('fcf3df18-4b27-4130-9065-32fb74900904', 'c3093ac9-84d6-4602-8b77-5ce6269bda5e', 'f1c66747-249a-4303-b6d9-b830bae13fb1', 'todo', 'medium', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, '2026-01-30 06:18:35.296408+00', NULL, NULL, false, '2026-01-30 06:18:35.296408+00'),
	('457a40b7-d5da-4412-ab47-c129473f1a63', 'c3093ac9-84d6-4602-8b77-5ce6269bda5e', 'd729f80e-7ded-4bf4-bcce-bc295ba02259', 'todo', 'medium', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, '2026-01-30 06:18:35.296408+00', NULL, NULL, false, '2026-01-30 06:18:35.296408+00'),
	('35f38a75-17e6-4676-a7b1-a0c01812ea7b', 'c9a37a46-d60f-45b5-8085-877fd4c6774e', '0764465b-eaf8-47b4-84b6-2fda6d8145ee', 'todo', 'medium', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, '2025-12-09 06:18:50.051803+00', NULL, NULL, false, '2025-12-09 06:18:50.051803+00'),
	('feeaf272-2083-4ce9-8b2f-8335b56411bb', 'c3093ac9-84d6-4602-8b77-5ce6269bda5e', 'c5d30a55-8d9a-46e6-b8d0-6accc0415c1c', 'todo', 'medium', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, '2026-01-30 06:19:18.048778+00', NULL, NULL, false, '2026-01-30 06:19:18.048778+00'),
	('82c9e77c-c597-44b9-96ad-cfb8cc03568a', '6e33da2b-b47c-4f15-bfee-aef731e12271', 'e39aaf58-769d-467a-bd70-96256fc211ec', 'todo', 'medium', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, '2025-12-17 09:07:53.043546+00', NULL, NULL, false, '2025-12-17 09:07:53.043546+00'),
	('ccc673cf-bc4d-4dd5-ba4f-f79dcc40b5d8', '6e33da2b-b47c-4f15-bfee-aef731e12271', 'f1c66747-249a-4303-b6d9-b830bae13fb1', 'todo', 'medium', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, '2025-12-17 09:07:53.043546+00', NULL, NULL, false, '2025-12-17 09:07:53.043546+00'),
	('2054c7b5-712e-4406-b8b1-25af30e306fc', '6e33da2b-b47c-4f15-bfee-aef731e12271', 'e8a34593-6348-4212-bf61-0251243f4fbe', 'todo', 'medium', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, '2025-12-17 09:07:53.043546+00', NULL, NULL, false, '2025-12-17 09:07:53.043546+00'),
	('de597944-05b6-4585-be73-bacc0af8d1e3', '89ca81cd-2493-4a2d-96f2-27d6397261ca', 'c5d30a55-8d9a-46e6-b8d0-6accc0415c1c', 'graded', 'medium', 80.00, 80.00, 'do not be late', '2025-12-18 05:31:47.69+00', '323c133d-6144-43ca-bfd0-aaa0f11c2c26', '2025-12-18 05:31:47.69+00', '2025-12-18 04:18:41.513+00', NULL, NULL, NULL, true, NULL, '2025-12-18 04:17:22.829585+00', NULL, '2025-12-18 04:18:41.64616+00', false, '2025-12-18 05:31:47.841944+00'),
	('159c7ebb-539c-4c4e-974e-85473513d2ac', '6e33da2b-b47c-4f15-bfee-aef731e12271', 'c5d30a55-8d9a-46e6-b8d0-6accc0415c1c', 'submitted', 'medium', 60.00, 60.00, '', '2025-12-18 04:22:21.691+00', '323c133d-6144-43ca-bfd0-aaa0f11c2c26', '2025-12-18 04:22:21.691+00', '2025-12-02 09:14:51.61+00', NULL, NULL, NULL, false, NULL, '2025-12-02 09:13:35.138564+00', '2025-12-02 09:14:22.925953+00', '2025-12-02 09:14:51.656046+00', false, '2025-12-22 09:39:10.329674+00');


--

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
-- Data for Name: college_student_assignments; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."college_student_assignments" ("student_assignment_id", "assignment_id", "student_id", "status", "priority", "grade_received", "grade_percentage", "instructor_feedback", "feedback_date", "graded_by", "graded_date", "submission_date", "submission_type", "submission_content", "submission_url", "submission_files", "is_late", "late_penalty", "assigned_date", "started_date", "completed_date", "updated_date", "is_deleted") VALUES
	('2416356a-60b6-4e95-8817-8f32d7f29e0c', '518acf9f-8f12-4e42-8af0-fb6bc8aa976c', '45e7e1a8-ec94-4658-9693-38a9cfe3fb4e', 'todo', 'medium', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, '2026-01-14 06:10:57.0339+00', NULL, NULL, '2026-01-14 06:10:57.0339+00', false),
	('f6202b34-9040-48a1-94d1-6a8395af4c12', '518acf9f-8f12-4e42-8af0-fb6bc8aa976c', '3531e63e-589e-46e7-9248-4a769e84b00d', 'todo', 'medium', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, '2026-01-14 06:23:01.654719+00', NULL, NULL, '2026-01-14 06:23:01.654719+00', false),
	('fcfe9e4e-dac0-4290-be02-02118a1910c6', 'f924bca5-9a34-4e50-a457-a1cefafbdc7e', '3531e63e-589e-46e7-9248-4a769e84b00d', 'todo', 'medium', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, '2026-01-14 10:48:33.122066+00', NULL, NULL, '2026-01-14 10:48:33.122066+00', false),
	('e3c5c5bb-b8a8-4521-92f1-ff3fe04e4007', 'acc48542-1537-43f4-b058-3d96a648522a', '4452a7a8-689e-4806-bae3-fe3ecc32735a', 'todo', 'medium', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, '2026-01-14 11:58:27.167637+00', NULL, NULL, '2026-01-14 11:58:27.167637+00', false),
	('f762171c-68fd-4f31-ba02-f671f2150b6d', '56179cb6-c392-4e32-96ac-4b734daf273f', '4452a7a8-689e-4806-bae3-fe3ecc32735a', 'todo', 'medium', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, '2026-01-14 12:16:59.549025+00', NULL, NULL, '2026-01-14 12:16:59.549025+00', false),
	('436bb859-96bd-4467-ae59-e2c6a312d445', '0b92c477-6bc1-428d-9181-000b65fd3b3c', '3531e63e-589e-46e7-9248-4a769e84b00d', 'todo', 'medium', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, '2026-01-14 12:35:04.523667+00', NULL, NULL, '2026-01-14 12:35:04.523667+00', false),
	('4885a18f-4280-4b2b-89e5-159c53cf9322', '0b92c477-6bc1-428d-9181-000b65fd3b3c', '4452a7a8-689e-4806-bae3-fe3ecc32735a', 'todo', 'medium', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, '2026-01-29 06:16:10.792991+00', NULL, NULL, '2026-01-29 06:16:10.792991+00', false),
	('b8f9ff0e-4581-4f21-9eb3-5eaa25797678', '518acf9f-8f12-4e42-8af0-fb6bc8aa976c', 'bb7bd7c3-00ed-4e22-b6f5-09def4907dbf', 'submitted', 'medium', NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-29 08:28:16.879414+00', NULL, 'File submission', NULL, '[{"url": "https://pub-ad91abcd16cd9e9c569d83d9ef46e398.r2.dev/college_assignment_submissions/bb7bd7c3-00ed-4e22-b6f5-09def4907dbf/518acf9f-8f12-4e42-8af0-fb6bc8aa976c/1769675296260_nryhaj1he0g.pdf", "name": "college_assignment_submissions_1e9aa0d6-8372-4b2d-a479-18352065b82c_80e93c32-1e90-4572-b1b6-09aabb68701f_1769670042336_m08fq3fukw.pdf", "size": 11225, "type": "application/pdf"}]', true, NULL, '2026-01-14 05:39:20.038791+00', NULL, '2026-01-29 08:28:16.879414+00', '2026-01-29 08:28:16.879414+00', false),
	('3f00d6ed-37c0-4f46-9d0f-78aae9b6c9da', '422ef331-62e0-4faa-98d1-e06d0f494c1c', '059af805-8f27-4b71-96af-f9e0acbd5884', 'todo', 'medium', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, '2026-01-29 08:34:29.790857+00', NULL, NULL, '2026-01-29 08:34:29.790857+00', false),
	('7f93a7f3-0401-48cd-91a3-af294db700e8', '422ef331-62e0-4faa-98d1-e06d0f494c1c', '9e60d352-4415-4c35-b175-d654c6e6b1de', 'todo', 'medium', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, '2026-01-29 08:34:29.790857+00', NULL, NULL, '2026-01-29 08:34:29.790857+00', false),
	('fd040f95-9fd1-45f6-b0b3-4fe2c87776a5', '422ef331-62e0-4faa-98d1-e06d0f494c1c', '1e9aa0d6-8372-4b2d-a479-18352065b82c', 'submitted', 'medium', NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-29 08:35:16.220378+00', NULL, 'File submission', NULL, '[{"url": "https://pub-ad91abcd16cd9e9c569d83d9ef46e398.r2.dev/college_assignment_submissions/1e9aa0d6-8372-4b2d-a479-18352065b82c/422ef331-62e0-4faa-98d1-e06d0f494c1c/1769675715611_o1x9yqxs34p.pdf", "name": "college_assignment_submissions_1e9aa0d6-8372-4b2d-a479-18352065b82c_80e93c32-1e90-4572-b1b6-09aabb68701f_1769670042336_m08fq3fukw.pdf", "size": 11225, "type": "application/pdf"}]', false, NULL, '2026-01-29 08:34:29.790857+00', NULL, '2026-01-29 08:35:16.220378+00', '2026-01-29 08:35:16.220378+00', false),
	('9941e0fb-a776-49e5-8efd-a6f2cf9d8dbc', 'f49c38dc-ced2-465f-8ab7-32775e25118f', '059af805-8f27-4b71-96af-f9e0acbd5884', 'todo', 'medium', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, '2026-01-29 09:09:08.910634+00', NULL, NULL, '2026-01-29 09:09:08.910634+00', false),
	('2f439b79-0cc1-406d-9fcb-e303ecd8d56f', 'f49c38dc-ced2-465f-8ab7-32775e25118f', '9e60d352-4415-4c35-b175-d654c6e6b1de', 'todo', 'medium', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, '2026-01-29 09:09:08.910634+00', NULL, NULL, '2026-01-29 09:09:08.910634+00', false),
	('39cd1e0b-21ec-4f96-af71-db4ec134f729', 'f49c38dc-ced2-465f-8ab7-32775e25118f', '1e9aa0d6-8372-4b2d-a479-18352065b82c', 'submitted', 'medium', NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-29 09:12:24.814285+00', NULL, NULL, NULL, NULL, false, NULL, '2026-01-29 09:09:08.910634+00', NULL, '2026-01-29 09:12:24.814285+00', '2026-01-29 09:12:24.814285+00', false),
	('039f546a-c416-42a0-bca6-c9815c92efc9', '32935af2-886d-4854-a55f-a033e94f0d63', '4452a7a8-689e-4806-bae3-fe3ecc32735a', 'todo', 'medium', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, '2026-01-30 06:38:53.234736+00', NULL, NULL, '2026-01-30 06:38:53.234736+00', false),
	('84f4bba9-85e6-4cf8-890b-c431336a534f', '32935af2-886d-4854-a55f-a033e94f0d63', '45e7e1a8-ec94-4658-9693-38a9cfe3fb4e', 'todo', 'medium', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, '2026-01-30 06:38:53.234736+00', NULL, NULL, '2026-01-30 06:38:53.234736+00', false);


--

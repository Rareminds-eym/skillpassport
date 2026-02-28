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
-- Data for Name: college_assignments; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."college_assignments" ("assignment_id", "title", "description", "instructions", "course_name", "course_code", "college_id", "college_educator_id", "program_section_id", "department_id", "program_id", "educator_name", "total_points", "assignment_type", "skill_outcomes", "document_pdf", "due_date", "available_from", "created_date", "updated_date", "allow_late_submission", "is_deleted", "instruction_files") VALUES
	('518acf9f-8f12-4e42-8af0-fb6bc8aa976c', 'Lab1', 'External lab needs to be fininshed', 'rftgh', 'Electronics Lab', 'EC103', 'c16a95cf-6ee5-4aa9-8e47-84fbda49611d', '0ffcf1ed-e010-43ec-b13b-4bee6c9a2d79', '8426f9ae-5a4d-42db-9dc9-79c127a73db5', '5a2cf269-4f14-423c-85b6-10396c3c0177', '0bd93653-6c80-4f3b-af23-0bee9ff67adb', 'Susmitha M', 100.00, 'exam', '{Programming}', '', '2026-01-17 12:37:00+00', '2026-01-14 05:39:06.09+00', '2026-01-14 05:39:07.151853+00', '2026-01-14 07:09:42.597788+00', true, false, '[]'),
	('f924bca5-9a34-4e50-a457-a1cefafbdc7e', 'Lab 2', 'fghj', 'ghbn', 'Mathematics', 'MS001', 'c16a95cf-6ee5-4aa9-8e47-84fbda49611d', '0ffcf1ed-e010-43ec-b13b-4bee6c9a2d79', '8426f9ae-5a4d-42db-9dc9-79c127a73db5', '5a2cf269-4f14-423c-85b6-10396c3c0177', '0bd93653-6c80-4f3b-af23-0bee9ff67adb', 'Susmitha M', 100.00, 'homework', '{Programming,Innovation}', '', '2026-01-16 16:19:00+00', '2026-01-17 16:10:00+00', '2026-01-14 10:48:27.707129+00', '2026-01-14 10:49:53.065405+00', true, false, '[]'),
	('f8ed975f-b13d-44ee-9a42-aa1e4e2a91e9', 'Lab6', 'ghjk', 'ghj', 'Mathematics', 'MS001', 'c16a95cf-6ee5-4aa9-8e47-84fbda49611d', '0ffcf1ed-e010-43ec-b13b-4bee6c9a2d79', '8426f9ae-5a4d-42db-9dc9-79c127a73db5', '5a2cf269-4f14-423c-85b6-10396c3c0177', '0bd93653-6c80-4f3b-af23-0bee9ff67adb', 'Susmitha M', 100.00, 'lab', '{Programming}', '', '2026-01-17 17:49:00+00', '2026-01-14 12:19:54.375+00', '2026-01-14 12:19:55.350287+00', '2026-01-14 12:19:57.612768+00', true, false, '[{"url": "https://pub-ad91abcd16cd9e9c569d83d9ef46e398.r2.dev/college_assignments_tasks/0ffcf1ed-e010-43ec-b13b-4bee6c9a2d79/f8ed975f-b13d-44ee-9a42-aa1e4e2a91e9/1768393194535_t6kenx0ekcd.docx", "name": "JDBC.docx", "size": 39433, "type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document"}]'),
	('0b92c477-6bc1-428d-9181-000b65fd3b3c', 'lab 6', 'ghjk', '', 'Mathematics', 'MS001', 'c16a95cf-6ee5-4aa9-8e47-84fbda49611d', '0ffcf1ed-e010-43ec-b13b-4bee6c9a2d79', '8426f9ae-5a4d-42db-9dc9-79c127a73db5', '5a2cf269-4f14-423c-85b6-10396c3c0177', '0bd93653-6c80-4f3b-af23-0bee9ff67adb', 'Susmitha M', 100.00, 'exam', '{Programming}', '', '2026-01-17 18:04:00+00', '2026-01-14 12:34:58.808+00', '2026-01-14 12:34:59.766007+00', '2026-01-14 12:52:47.456641+00', true, false, '[]'),
	('acc48542-1537-43f4-b058-3d96a648522a', 'Lab3', 'ghj', 'ghbnm', 'Mathematics', 'MS001', 'c16a95cf-6ee5-4aa9-8e47-84fbda49611d', '0ffcf1ed-e010-43ec-b13b-4bee6c9a2d79', '8426f9ae-5a4d-42db-9dc9-79c127a73db5', '5a2cf269-4f14-423c-85b6-10396c3c0177', '0bd93653-6c80-4f3b-af23-0bee9ff67adb', 'Susmitha M', 100.00, 'homework', '{Programming,Innovation}', '', '2026-01-17 17:27:00+00', '2026-01-18 17:28:00+00', '2026-01-14 11:58:21.321597+00', '2026-01-14 11:58:22.78961+00', true, false, '[{"url": "https://pub-ad91abcd16cd9e9c569d83d9ef46e398.r2.dev/college_assignments_tasks/0ffcf1ed-e010-43ec-b13b-4bee6c9a2d79/acc48542-1537-43f4-b058-3d96a648522a/1768391900493_hgrysh6k1hb.docx", "name": "JDBC.docx", "size": 39433, "type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document"}]'),
	('56179cb6-c392-4e32-96ac-4b734daf273f', 'Lab 4', 'ghjk', 'ghbnjm,', 'Mathematics', 'MS001', 'c16a95cf-6ee5-4aa9-8e47-84fbda49611d', '0ffcf1ed-e010-43ec-b13b-4bee6c9a2d79', '8426f9ae-5a4d-42db-9dc9-79c127a73db5', '5a2cf269-4f14-423c-85b6-10396c3c0177', '0bd93653-6c80-4f3b-af23-0bee9ff67adb', 'Susmitha M', 100.00, 'lab', '{Innovation}', '', '2026-01-15 17:46:00+00', '2026-01-17 17:46:00+00', '2026-01-14 12:16:53.010345+00', '2026-01-14 12:16:55.364637+00', true, false, '[{"url": "https://pub-ad91abcd16cd9e9c569d83d9ef46e398.r2.dev/college_assignments_tasks/0ffcf1ed-e010-43ec-b13b-4bee6c9a2d79/56179cb6-c392-4e32-96ac-4b734daf273f/1768393012197_46zwdcul8go.docx", "name": "oops.docx", "size": 33728, "type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document"}]'),
	('422ef331-62e0-4faa-98d1-e06d0f494c1c', 'tets', 'test', 'steet', 'Mathematics', 'MS001', 'c16a95cf-6ee5-4aa9-8e47-84fbda49611d', '0ffcf1ed-e010-43ec-b13b-4bee6c9a2d79', '51ffdfa5-ff49-4aaa-a587-b76e7a331dac', '5a2cf269-4f14-423c-85b6-10396c3c0177', '0bd93653-6c80-4f3b-af23-0bee9ff67adb', 'Susmitha M', 100.00, 'homework', '{Communication,AI,"Design Thinking","Problem Solving",Research,Entrepreneurship,"Data Structures",Programming,Innovation,Teamwork,Leadership,"Critical Thinking"}', '', '2026-01-29 14:03:00+00', '2026-01-31 14:03:00+00', '2026-01-29 08:34:21.232344+00', '2026-01-29 08:34:21.232344+00', true, false, '[]'),
	('d725638f-cfcb-4303-bab3-f6fbcc78ee7b', 'test', 'test', 'test', 'Mathematics', 'MS001', 'c16a95cf-6ee5-4aa9-8e47-84fbda49611d', '0ffcf1ed-e010-43ec-b13b-4bee6c9a2d79', '51ffdfa5-ff49-4aaa-a587-b76e7a331dac', '5a2cf269-4f14-423c-85b6-10396c3c0177', '0bd93653-6c80-4f3b-af23-0bee9ff67adb', 'Susmitha M', 100.00, 'project', '{"Data Structures"}', 'https://testing.com', '2026-01-31 14:38:00+00', '2026-01-29 14:38:00+00', '2026-01-29 09:08:49.532472+00', '2026-01-29 09:08:49.532472+00', true, false, '[]'),
	('f49c38dc-ced2-465f-8ab7-32775e25118f', 'test', 'test', 'test', 'Mathematics', 'MS001', 'c16a95cf-6ee5-4aa9-8e47-84fbda49611d', '0ffcf1ed-e010-43ec-b13b-4bee6c9a2d79', '51ffdfa5-ff49-4aaa-a587-b76e7a331dac', '5a2cf269-4f14-423c-85b6-10396c3c0177', '0bd93653-6c80-4f3b-af23-0bee9ff67adb', 'Susmitha M', 100.00, 'project', '{"Data Structures"}', 'https://testing.com', '2026-01-31 14:38:00+00', '2026-01-29 14:38:00+00', '2026-01-29 09:08:49.641914+00', '2026-01-29 09:08:49.641914+00', true, false, '[]'),
	('32935af2-886d-4854-a55f-a033e94f0d63', 'test 222', 'test', 'test', 'Mathematics', 'MS001', 'c16a95cf-6ee5-4aa9-8e47-84fbda49611d', '0ffcf1ed-e010-43ec-b13b-4bee6c9a2d79', '8426f9ae-5a4d-42db-9dc9-79c127a73db5', '5a2cf269-4f14-423c-85b6-10396c3c0177', '0bd93653-6c80-4f3b-af23-0bee9ff67adb', 'Susmitha M', 100.00, 'homework', '{Communication,AI}', 'https://test.in', '2026-01-30 12:08:00+00', '2026-01-31 12:08:00+00', '2026-01-30 06:38:37.780811+00', '2026-01-30 06:38:44.797792+00', true, false, '[{"url": "https://pub-ad91abcd16cd9e9c569d83d9ef46e398.r2.dev/college_assignments_tasks/0ffcf1ed-e010-43ec-b13b-4bee6c9a2d79/32935af2-886d-4854-a55f-a033e94f0d63/1769755117030_28w2ugw4llc.pdf", "name": "Mechanical_Design_Engineer_Career_Roadmap.pdf", "size": 11225, "type": "application/pdf"}]');


--

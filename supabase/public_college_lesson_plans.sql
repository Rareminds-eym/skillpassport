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
-- Data for Name: college_lesson_plans; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."college_lesson_plans" ("id", "title", "session_date", "duration_minutes", "college_id", "department_id", "program_id", "course_id", "semester", "academic_year", "curriculum_id", "unit_id", "selected_learning_outcomes", "session_objectives", "teaching_methodology", "required_materials", "resource_files", "resource_links", "evaluation_criteria", "evaluation_items", "follow_up_activities", "additional_notes", "status", "created_by", "updated_by", "created_at", "updated_at", "published_at", "metadata") VALUES
	('a22f884d-849c-468c-9bbc-4819c846ac36', 'testing 2', '2026-01-22', NULL, 'c16a95cf-6ee5-4aa9-8e47-84fbda49611d', 'a987bd28-dcd0-478d-af06-42a0d0128da7', '1b729bdb-3004-4ff4-a446-7fb6c52d7e72', 'c9fc3641-1075-468e-a42c-94f8365d2184', 1, '2025-2026', 'd02639c9-f271-4b09-83bb-df8399346508', 'fe18229c-1867-47d7-9e6c-51ae3c9e51b6', '{630e576a-c9f2-4619-856b-5e6f8d519f8d,14f1b636-925d-4f9e-b0fd-b05f84c2e293}', 'testing', 'testing', 'testing', '[]', '[{"id": "1767761567035", "url": "https://www.google.com", "title": "asdfg"}]', 'adsf', '[]', 'adsf', 'asdf', 'published', '91bf6be4-31a5-4d6a-853d-675596755cee', NULL, '2026-01-07 04:53:28.437453+00', '2026-01-07 04:53:28.437453+00', NULL, '{}'),
	('57a8a5d8-4136-4c9c-8351-ecbbaab6151f', 'asdfg', '2026-01-30', NULL, 'c16a95cf-6ee5-4aa9-8e47-84fbda49611d', 'a987bd28-dcd0-478d-af06-42a0d0128da7', '1b729bdb-3004-4ff4-a446-7fb6c52d7e72', 'c9fc3641-1075-468e-a42c-94f8365d2184', 1, '2025-2026', 'd02639c9-f271-4b09-83bb-df8399346508', 'fe18229c-1867-47d7-9e6c-51ae3c9e51b6', '{630e576a-c9f2-4619-856b-5e6f8d519f8d,14f1b636-925d-4f9e-b0fd-b05f84c2e293}', 'adsfd', 'sadfg', 'asdfg', '[]', '[]', 'adfsd', '[]', 'adsfg', 'asdfd', 'published', '91bf6be4-31a5-4d6a-853d-675596755cee', NULL, '2026-01-07 05:25:48.880063+00', '2026-01-07 05:25:48.880063+00', NULL, '{}'),
	('14748eea-58d1-4950-81fa-7c095fb524ba', 'testing lesson', '2026-01-14', NULL, 'c16a95cf-6ee5-4aa9-8e47-84fbda49611d', 'a987bd28-dcd0-478d-af06-42a0d0128da7', '1b729bdb-3004-4ff4-a446-7fb6c52d7e72', 'c9fc3641-1075-468e-a42c-94f8365d2184', 1, '2025-2026', 'd02639c9-f271-4b09-83bb-df8399346508', 'fe18229c-1867-47d7-9e6c-51ae3c9e51b6', '{630e576a-c9f2-4619-856b-5e6f8d519f8d,14f1b636-925d-4f9e-b0fd-b05f84c2e293}', 'tetsing', 'testing', 'tetsing', '[]', '[{"id": "1767760839978", "url": "https://test.in", "title": "tests"}]', 'test', '[]', 'test', 'test', 'published', '91bf6be4-31a5-4d6a-853d-675596755cee', '91bf6be4-31a5-4d6a-853d-675596755cee', '2026-01-07 04:40:58.976456+00', '2026-01-07 05:56:43.139162+00', NULL, '{}'),
	('e65ad91a-cbe1-4f0b-8ed5-f0ee154c21d1', 'Testing uploading', '2026-01-15', NULL, 'c16a95cf-6ee5-4aa9-8e47-84fbda49611d', 'a987bd28-dcd0-478d-af06-42a0d0128da7', '1b729bdb-3004-4ff4-a446-7fb6c52d7e72', 'e5661261-22cb-4485-b741-5a8014439b8f', 1, '2025-2026', 'c61df4b6-bdf5-4f32-8eb9-cb9c61f4a4b0', '5881ffb5-9f35-43f0-bf07-218ee63c255e', '{115a9972-5d34-4032-9725-ac35466ebb31}', 'test', 'asdfg', NULL, '[{"id": "temp_1767770517123_0", "url": "https://pub-ad91abcd16cd9e9c569d83d9ef46e398.r2.dev/college-lesson-plans/1767770548433_zqbp3zu4rk7.pdf", "name": "Curriculum_CS101 - Intro to Programming_ClassBachelor of Technology in Computer Science - Semester 1_2025-2026 (2).pdf", "size": 28004, "type": "application/pdf"}]', '[]', 'asdfg', '[]', NULL, NULL, 'published', '91bf6be4-31a5-4d6a-853d-675596755cee', NULL, '2026-01-07 07:22:30.473439+00', '2026-01-07 07:22:30.473439+00', NULL, '{}'),
	('8a48a730-4aab-4bee-9dd8-e54514997698', 'lesson plan', '2026-01-14', NULL, 'c16a95cf-6ee5-4aa9-8e47-84fbda49611d', 'a987bd28-dcd0-478d-af06-42a0d0128da7', '1b729bdb-3004-4ff4-a446-7fb6c52d7e72', 'e5661261-22cb-4485-b741-5a8014439b8f', 1, '2025-2026', 'c61df4b6-bdf5-4f32-8eb9-cb9c61f4a4b0', '8f1b1d8f-6676-48df-83e9-d5a1112d7b7d', '{fec3fb4b-9215-4357-b0ae-7e4adc804c26}', 'asdfghjk', 'zdfghjk', 'sdfghj', '[{"id": "temp_1767777286287_0", "url": "https://pub-ad91abcd16cd9e9c569d83d9ef46e398.r2.dev/college-lesson-plans/1767777326046_xf7tx3u0tm.pdf", "name": "Curriculum_CS101 - Intro to Programming_ClassBachelor of Technology in Computer Science - Semester 1_2025-2026 (3).pdf", "size": 29733, "type": "application/pdf"}]', '[{"id": "1767777302620", "url": "https://test.com", "title": "test"}]', 'sedrftgyhuij', '[]', 'dxfcgv', 'dfghj', 'published', '91bf6be4-31a5-4d6a-853d-675596755cee', NULL, '2026-01-07 09:15:28.172944+00', '2026-01-07 09:15:28.172944+00', NULL, '{}'),
	('f959d9d3-3c2d-4a48-80ab-f28cc125741a', 'adsfg', '2026-01-28', NULL, 'c16a95cf-6ee5-4aa9-8e47-84fbda49611d', 'a987bd28-dcd0-478d-af06-42a0d0128da7', '1b729bdb-3004-4ff4-a446-7fb6c52d7e72', 'e5661261-22cb-4485-b741-5a8014439b8f', 1, '2025-2026', 'c61df4b6-bdf5-4f32-8eb9-cb9c61f4a4b0', '4c82537a-58b1-4da5-a3cc-09801dc22946', '{4b8a4cf6-85b6-4aa3-b2a4-06880cab4b6e}', 'dasf', 'dasfg', 'adsfd', '[{"id": "temp_1767778146365_0", "url": "https://pub-ad91abcd16cd9e9c569d83d9ef46e398.r2.dev/college-lesson-plans/1767778156220_gbxdx14rh7.pdf", "name": "Curriculum_CS0125 - testing2_ClassBachelor of Technology in Computer Science - Semester 1_2025-2026.pdf", "size": 5353, "type": "application/pdf"}]', '[]', 'dsf', '[]', NULL, NULL, 'published', '91bf6be4-31a5-4d6a-853d-675596755cee', NULL, '2026-01-07 09:29:18.353667+00', '2026-01-07 09:29:18.353667+00', NULL, '{}'),
	('f21c3c76-08ae-49df-bfac-fa50f1e94b43', 'sadfg', '2026-01-07', NULL, 'c16a95cf-6ee5-4aa9-8e47-84fbda49611d', 'a987bd28-dcd0-478d-af06-42a0d0128da7', '1b729bdb-3004-4ff4-a446-7fb6c52d7e72', 'e5661261-22cb-4485-b741-5a8014439b8f', 1, '2025-2026', 'c61df4b6-bdf5-4f32-8eb9-cb9c61f4a4b0', 'c973ddaa-a48d-495d-bafb-b5b6148b0609', '{69b75481-8fff-45cf-b878-1092fa6ba3f5}', 'adsfddsfd', 'asdfd', NULL, '[]', '[]', 'dsfdg', '[]', NULL, NULL, 'published', '91bf6be4-31a5-4d6a-853d-675596755cee', NULL, '2026-01-07 09:33:07.232234+00', '2026-01-07 09:33:07.232234+00', NULL, '{}'),
	('df83b215-80a8-46ac-a8c1-20b15ad8be56', 'introduction to basic', '2026-01-09', NULL, 'c16a95cf-6ee5-4aa9-8e47-84fbda49611d', '4affc7c0-52f7-40c6-924e-d90cc0d11285', '95e078f6-22a6-46b9-9867-00931ddb7fc0', 'c8378d96-a8d0-4609-97b4-d19811e914cb', 1, '2025-2026', '530fbccd-b750-4e2e-8886-96dc66107935', '02f42c53-0c29-4960-bab8-37758eca1fa4', '{4843807e-eb3f-4390-8d28-949ec3244bb7}', 'Objective', 'Methology', NULL, '[]', '[]', 'Description', '[]', NULL, NULL, 'published', '91bf6be4-31a5-4d6a-853d-675596755cee', NULL, '2026-01-09 09:20:31.668043+00', '2026-01-09 09:20:31.668043+00', NULL, '{}');


--

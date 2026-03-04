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
-- Data for Name: college_courses; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."college_courses" ("id", "college_id", "course_name", "created_at", "updated_at", "metadata", "course_code", "credits", "description", "prerequisites", "course_type", "is_active", "created_by", "updated_by") VALUES
	('e5661261-22cb-4485-b741-5a8014439b8f', 'c16a95cf-6ee5-4aa9-8e47-84fbda49611d', 'Intro to Programming', '2026-01-06 09:33:27.387189+00', '2026-01-06 09:33:27.387189+00', '{}', 'CS101', 4.0, 'Introduction to programming concepts using Python', '[]', 'theory', true, '91bf6be4-31a5-4d6a-853d-675596755cee', NULL),
	('92f47955-541a-4031-b49e-1c893993f16c', 'c16a95cf-6ee5-4aa9-8e47-84fbda49611d', 'Data Structures', '2026-01-06 09:33:27.387189+00', '2026-01-06 09:33:27.387189+00', '{}', 'CS102', 4.0, 'Fundamental data structures and algorithms', '["CS101"]', 'theory', true, '91bf6be4-31a5-4d6a-853d-675596755cee', NULL),
	('abc39ea6-5a05-48d9-8606-358415c0a2f2', 'c16a95cf-6ee5-4aa9-8e47-84fbda49611d', 'Object Oriented Programming', '2026-01-06 09:33:27.387189+00', '2026-01-06 09:33:27.387189+00', '{}', 'CS201', 4.0, 'OOP concepts using Java', '["CS102"]', 'theory', true, '91bf6be4-31a5-4d6a-853d-675596755cee', NULL),
	('9cfb86c3-960d-48bf-b7ff-5b84bfda7f3d', 'c16a95cf-6ee5-4aa9-8e47-84fbda49611d', 'Database Systems', '2026-01-06 09:33:27.387189+00', '2026-01-06 09:33:27.387189+00', '{}', 'CS202', 3.0, 'Database design and SQL', '["CS102"]', 'theory', true, '91bf6be4-31a5-4d6a-853d-675596755cee', NULL),
	('b3f76254-72da-4ff1-b1ff-431924754e6f', 'c16a95cf-6ee5-4aa9-8e47-84fbda49611d', 'Electronics Lab', '2026-01-06 09:33:27.387189+00', '2026-01-06 09:33:27.387189+00', '{}', 'EC103', 2.0, 'Hands-on electronics experiments', '["EC101"]', 'lab', true, '91bf6be4-31a5-4d6a-853d-675596755cee', NULL),
	('c9fc3641-1075-468e-a42c-94f8365d2184', 'c16a95cf-6ee5-4aa9-8e47-84fbda49611d', 'Testing', '2026-01-06 15:54:21.809865+00', '2026-01-06 15:54:21.809865+00', '{}', 'CS105', 3.0, '', '[]', 'theory', true, '91bf6be4-31a5-4d6a-853d-675596755cee', '91bf6be4-31a5-4d6a-853d-675596755cee'),
	('279beb60-394c-4240-8b69-210fdfb29e42', 'c16a95cf-6ee5-4aa9-8e47-84fbda49611d', 'testing2', '2026-01-07 09:09:20.266163+00', '2026-01-07 09:09:20.266163+00', '{}', 'CS0125', 4.0, '', '[]', 'theory', true, '91bf6be4-31a5-4d6a-853d-675596755cee', '91bf6be4-31a5-4d6a-853d-675596755cee'),
	('c8378d96-a8d0-4609-97b4-d19811e914cb', 'c16a95cf-6ee5-4aa9-8e47-84fbda49611d', 'Mathematics', '2026-01-09 08:48:36.462564+00', '2026-01-09 08:48:36.462564+00', '{}', 'MS001', 4.0, '', '[]', 'theory', true, '91bf6be4-31a5-4d6a-853d-675596755cee', '91bf6be4-31a5-4d6a-853d-675596755cee'),
	('22852efa-a7c3-4f61-bb6e-98735871b3bd', 'c16a95cf-6ee5-4aa9-8e47-84fbda49611d', 'Mathematics', '2026-01-09 09:01:57.810545+00', '2026-01-09 09:01:57.810545+00', '{}', 'MS003', 4.0, '', '[]', 'theory', true, '91bf6be4-31a5-4d6a-853d-675596755cee', '91bf6be4-31a5-4d6a-853d-675596755cee');


--

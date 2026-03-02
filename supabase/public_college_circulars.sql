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
-- Data for Name: college_circulars; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."college_circulars" ("id", "college_id", "title", "content", "audience", "priority", "publish_date", "expire_date", "attachment_url", "status", "created_by", "created_at", "updated_at", "attachment_filename", "attachment_file_size") VALUES
	('433eed9e-a42a-42e9-a1ad-c0372515ff62', 'c16a95cf-6ee5-4aa9-8e47-84fbda49611d', 'Faculty Meeting Notice', 'Monthly faculty meeting scheduled for January 15th at 3 PM in the conference room.', 'faculty', 'medium', '2025-01-12', '2025-01-15', NULL, 'draft', NULL, '2026-01-12 12:40:52.408695+00', '2026-01-12 12:58:20.362697+00', NULL, NULL),
	('475fd4af-ffb2-4daf-ab66-cc7dfce74207', 'c16a95cf-6ee5-4aa9-8e47-84fbda49611d', 'Academic Calendar Update', 'The academic calendar has been updated with new examination dates. Please check the revised schedule and plan accordingly.', 'all', 'high', '2025-01-12', '2025-02-12', 'https://example.com/academic-calendar.pdf', 'draft', NULL, '2026-01-12 12:40:52.408695+00', '2026-01-12 12:58:22.287831+00', NULL, NULL),
	('b66f3cb6-4612-43a7-9e0a-f8145a59782e', 'c16a95cf-6ee5-4aa9-8e47-84fbda49611d', 'Fee Payment Reminder', 'This is a reminder that semester fees are due by January 20th, 2025. Please ensure timely payment to avoid late fees.', 'all', 'high', '2025-01-08', '2025-01-20', NULL, 'draft', NULL, '2026-01-12 12:40:52.408695+00', '2026-01-12 12:58:28.02232+00', NULL, NULL),
	('4e7b5c57-7504-410e-89b2-aa855c489390', 'c16a95cf-6ee5-4aa9-8e47-84fbda49611d', 'Library Hours Extension', 'Library hours will be extended during examination period from 8 AM to 10 PM on all weekdays.', 'students', 'medium', '2025-01-10', '2025-01-25', NULL, 'draft', NULL, '2026-01-12 12:40:52.408695+00', '2026-01-12 17:12:33.464966+00', NULL, NULL),
	('8767c41a-5dc1-4a6e-95b1-477f2d00cb41', 'c16a95cf-6ee5-4aa9-8e47-84fbda49611d', 'test', 'ssss', 'all', 'medium', '2026-01-14', '2026-01-20', 'https://pub-ad91abcd16cd9e9c569d83d9ef46e398.r2.dev/circulars/1768279332471_etj3sg42q2g.pdf', 'draft', '91bf6be4-31a5-4d6a-853d-675596755cee', '2026-01-13 04:42:17.31763+00', '2026-01-13 04:42:17.31763+00', 'Curriculum_CS0125 - testing2_ClassBachelor of Technology in Computer Science - Semester 1_2025-2026.pdf', 5353);


--

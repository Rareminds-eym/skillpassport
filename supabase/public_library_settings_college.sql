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
-- Data for Name: library_settings_college; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."library_settings_college" ("id", "college_id", "setting_key", "setting_value", "description", "created_at", "updated_at") VALUES
	('ffe17037-ead1-4480-bd92-b82377dfe032', '659ebe4b-bdae-40c8-901f-2fed3c221574', 'max_books_per_student', '3', 'Maximum number of books a student can issue at once', '2026-01-03 08:56:35.088498+00', '2026-01-03 08:56:35.088498+00'),
	('c9595d9d-e844-413d-a9ed-190e6e1a1050', '659ebe4b-bdae-40c8-901f-2fed3c221574', 'default_loan_period_days', '14', 'Default loan period in days', '2026-01-03 08:56:35.088498+00', '2026-01-03 08:56:35.088498+00'),
	('76b2831a-df13-44c6-8ca5-b60c918d6879', '659ebe4b-bdae-40c8-901f-2fed3c221574', 'fine_per_day', '10', 'Fine amount per day for overdue books (in rupees)', '2026-01-03 08:56:35.088498+00', '2026-01-03 08:56:35.088498+00'),
	('bd18787b-14d2-4590-9b1d-36efc092edaa', '659ebe4b-bdae-40c8-901f-2fed3c221574', 'library_name', 'College Library', 'Name of the library', '2026-01-03 08:56:35.088498+00', '2026-01-03 08:56:35.088498+00'),
	('71f2e7e5-a1b9-49eb-a473-4ce6e48661f1', '659ebe4b-bdae-40c8-901f-2fed3c221574', 'library_email', 'library@college.edu', 'Library contact email', '2026-01-03 08:56:35.088498+00', '2026-01-03 08:56:35.088498+00'),
	('d2d8c34e-d651-4fb1-a5d3-05d4f19d2c5c', '659ebe4b-bdae-40c8-901f-2fed3c221574', 'library_phone', '+91-XXXXXXXXXX', 'Library contact phone', '2026-01-03 08:56:35.088498+00', '2026-01-03 08:56:35.088498+00');


--

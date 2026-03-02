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
-- Data for Name: college_timetables; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."college_timetables" ("id", "college_id", "academic_year", "term", "start_date", "end_date", "status", "created_by", "created_at", "updated_at") VALUES
	('aac9be12-0c23-4560-a3d7-b7fd2bffdf34', 'c16a95cf-6ee5-4aa9-8e47-84fbda49611d', '2026-2027', 'Term 1', '2026-06-01', '2027-05-31', 'published', NULL, '2026-01-06 10:34:01.731199+00', '2026-01-06 10:34:01.731199+00');


--

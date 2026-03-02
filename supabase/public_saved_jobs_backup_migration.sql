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
-- Data for Name: saved_jobs_backup_migration; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."saved_jobs_backup_migration" ("id", "student_id", "opportunity_id", "saved_at", "created_at", "updated_at") VALUES
	(14, 'c5d30a55-8d9a-46e6-b8d0-6accc0415c1c', 118, '2025-12-15 10:15:38.430243+00', '2025-12-15 10:15:38.430243+00', '2025-12-15 10:15:38.430243+00'),
	(16, 'c5d30a55-8d9a-46e6-b8d0-6accc0415c1c', 156, '2025-12-22 09:25:54.132541+00', '2025-12-22 09:25:54.132541+00', '2025-12-22 09:25:54.132541+00'),
	(19, '95364f0d-23fb-4616-b0f4-48caafee5439', 134, '2026-01-07 07:34:21.12917+00', '2026-01-07 07:34:21.12917+00', '2026-01-07 07:34:21.12917+00'),
	(20, '95364f0d-23fb-4616-b0f4-48caafee5439', 150, '2026-01-07 07:48:44.773731+00', '2026-01-07 07:48:44.773731+00', '2026-01-07 07:48:44.773731+00');


--

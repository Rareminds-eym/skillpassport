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
-- Data for Name: saved_jobs; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."saved_jobs" ("id_old", "student_id_old", "opportunity_id_old", "saved_at", "created_at", "updated_at", "id", "opportunity_id", "student_id") VALUES
	(NULL, NULL, NULL, '2026-01-28 03:50:01.699632+00', '2026-01-28 03:50:01.699632+00', '2026-01-28 03:50:01.699632+00', 'cac10e4c-e9a4-4b69-9b23-ea27e4d15265', '9bc0fdff-789c-4d0a-a808-494ae9706d34', '03238c80-0f1e-4340-b28c-6fdd17352a58'),
	(NULL, NULL, NULL, '2026-01-28 06:25:41.285441+00', '2026-01-28 06:25:41.285441+00', '2026-01-28 06:25:41.285441+00', '8edb144b-0aba-44a4-b8b0-2490f47dfd42', '9bc0fdff-789c-4d0a-a808-494ae9706d34', '874871c1-731f-45c3-918c-347dd54eac1f'),
	(NULL, NULL, NULL, '2026-01-29 09:12:48.755964+00', '2026-01-29 09:12:48.755964+00', '2026-01-29 09:12:48.755964+00', '37b1a516-d361-4910-b30b-3e9f2ad1987d', '16c65565-b76b-4ef4-a36c-9ffddf2dfdc2', '5f7c27a2-24d3-4996-aaed-8a9b206c047f');


--

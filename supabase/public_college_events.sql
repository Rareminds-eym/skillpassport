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
-- Data for Name: college_events; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."college_events" ("id", "college_id", "title", "description", "event_type", "start_date", "end_date", "venue", "capacity", "status", "created_by", "created_at", "updated_at") VALUES
	('ba9fec21-11e3-4e33-9a86-5f5209421b15', 'c16a95cf-6ee5-4aa9-8e47-84fbda49611d', 'test06', '', 'workshop', '2026-01-06 22:06:00+00', '2026-01-10 22:04:00+00', 'bangalore', 10, 'cancelled', '91bf6be4-31a5-4d6a-853d-675596755cee', '2026-01-06 16:35:00.792732+00', '2026-01-16 08:50:35.313457+00'),
	('f36cfa71-731f-410d-b09e-dbaed7d0826b', 'c16a95cf-6ee5-4aa9-8e47-84fbda49611d', 'testing4', 'weq', 'workshop', '2026-01-09 09:40:00+00', '2026-01-09 09:40:00+00', '', NULL, 'cancelled', '91bf6be4-31a5-4d6a-853d-675596755cee', '2026-01-09 04:10:23.93894+00', '2026-01-16 08:50:44.287833+00');


--

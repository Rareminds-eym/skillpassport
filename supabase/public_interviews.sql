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
-- Data for Name: interviews; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."interviews" ("id", "student_id", "candidate_name", "candidate_email", "candidate_phone", "job_title", "interviewer", "interviewer_email", "date", "duration", "status", "type", "meeting_type", "meeting_link", "meeting_notes", "reminders_sent", "completed_date", "scorecard", "created_by", "created_at", "updated_at") VALUES
	('int_1765254434862', NULL, 'Litikesh', 'litikesh@rareminds.in', '+91 98765 43210', 'Software Enginner', 'Karthikeyan', 'karthikeyan@gmail.com', '2025-12-10 05:26:00+00', 60, 'scheduled', 'Technical', 'meet', NULL, NULL, 0, NULL, NULL, NULL, '2025-12-09 04:27:15.183197+00', '2025-12-09 04:27:15.183197+00');


--

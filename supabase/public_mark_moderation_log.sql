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
-- Data for Name: mark_moderation_log; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."mark_moderation_log" ("id", "mark_entry_id", "assessment_id", "student_id", "original_marks", "moderated_marks", "difference", "moderation_type", "reason", "justification", "moderated_by", "moderator_name", "moderated_at", "requires_approval", "approved_by", "approved_at", "approval_status", "created_at", "subject_id") VALUES
	('5e0f08f2-c664-46bc-8502-b1bfd3cce5cd', 'b269760c-fdb9-4331-8eb9-5a2f8834eaaf', '1bf53285-0279-49da-ac94-9d42e3da38cc', 'e39aaf58-769d-467a-bd70-96256fc211ec', 48.00, 49.00, 1.00, 'correction', 'testing', NULL, '52004557-7df2-4c2a-bffb-437588cbb619', 'Current User', '2025-12-14 18:20:20.154+00', false, '52004557-7df2-4c2a-bffb-437588cbb619', '2025-12-14 18:20:26.896+00', 'approved', '2025-12-14 18:20:20.920811+00', '1765699647057');


--

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
-- Data for Name: pipeline_activities; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."pipeline_activities" ("id", "pipeline_candidate_id", "activity_type", "from_stage", "to_stage", "activity_details", "performed_by", "created_at", "student_id") VALUES
	(22, 23, 'stage_change', NULL, 'screened', '{"ai_score": null, "employability_score": null}', '902d03ef-71c0-4781-8e09-c2ef46511cbb', '2025-12-09 06:01:12.589548+00', NULL),
	(23, 22, 'stage_change', 'sourced', 'interview_1', '{"notes": "Moved to interview_1 stage"}', '902d03ef-71c0-4781-8e09-c2ef46511cbb', '2025-12-09 06:04:45.546587+00', NULL),
	(24, 21, 'stage_change', 'sourced', 'screened', '{"notes": "Moved to screened stage"}', '902d03ef-71c0-4781-8e09-c2ef46511cbb', '2025-12-09 06:04:53.193905+00', NULL),
	(25, 24, 'stage_change', NULL, 'screened', '{"ai_score": null, "employability_score": null}', '902d03ef-71c0-4781-8e09-c2ef46511cbb', '2025-12-09 06:05:15.249791+00', NULL);


--

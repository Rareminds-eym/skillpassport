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
-- Data for Name: mentor_notes; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."mentor_notes" ("id", "student_id", "mentor_type", "school_educator_id", "college_lecturer_id", "quick_notes", "feedback", "action_points", "note_date", "created_at", "updated_at") VALUES
	('3b1f0d0b-33f7-43da-9f22-2cdc981794bc', 'f3363577-5c2f-4fd4-ab5e-d929d06305e4', 'school', '8b25ae13-d1ad-48bc-873a-8a269328afb8', NULL, '{"Excellent Progress"}', 'Good student', '', '2025-12-09 06:19:15.709277+00', '2025-12-09 06:19:15.709277+00', '2025-12-09 06:19:15.709277+00'),
	('debf2783-1fe6-4b70-b5ba-b60a691fbb2b', '0764465b-eaf8-47b4-84b6-2fda6d8145ee', 'school', '8b25ae13-d1ad-48bc-873a-8a269328afb8', NULL, '{"Excellent Progress"}', 'Good Student', '', '2025-12-09 16:34:47.432375+00', '2025-12-09 16:34:47.432375+00', '2025-12-09 16:34:47.432375+00'),
	('30d8a882-0db2-47c0-80b3-697a979fb64f', '95a2e4b1-ccbb-4ff6-a413-b160d04a5642', 'school', '5d78d3c6-e53e-48df-887f-fd21e1e58db6', NULL, '{"Excellent Progress"}', 'Excellent Progress in coding and sports', 'Continue practicing coding challenges 3–4 times per week.
Participate in upcoming coding competitions to build confidence.
Maintain regular sports training to further improve stamina and skill.
Seek feedback regularly to strengthen areas of improvement.', '2025-12-10 04:44:54.333471+00', '2025-12-10 04:44:54.333471+00', '2025-12-10 04:44:54.333471+00'),
	('917a2557-def7-43ac-b918-ad982c23f413', 'c29ecd33-2958-4931-905a-68fb5382676b', 'school', '5d78d3c6-e53e-48df-887f-fd21e1e58db6', NULL, '{"Excellent Progress"}', 'good', '23', '2026-01-30 06:21:03.095879+00', '2026-01-30 06:21:03.095879+00', '2026-01-30 06:21:03.095879+00'),
	('07d2d1cf-5654-4e7c-9838-6be9c044759f', 'c29ecd33-2958-4931-905a-68fb5382676b', 'school', '5d78d3c6-e53e-48df-887f-fd21e1e58db6', NULL, '{"Needs Improvement","Good Leadership Quality","Consistent Performance","Strong Communication Skills","Needs Extra Practice","Teamwork is Improving",good}', 'nil', 'nil', '2026-01-30 06:23:53.596728+00', '2026-01-30 06:23:53.596728+00', '2026-01-30 06:23:53.596728+00'),
	('65cfc35e-c59d-4395-ba98-fb07841d680f', 'afaa9e81-1552-4c1d-a76d-551134295567', 'college', NULL, '0f4b36d3-bebe-456f-8e11-b89a4fe2a723', '{"Needs Improvement"}', 'test', 'tesr', '2026-01-30 06:45:15.453592+00', '2026-01-30 06:45:15.453592+00', '2026-01-30 06:45:15.453592+00'),
	('9bccd5d7-e6e2-4f14-aa45-be42d83e0c7a', '1e9aa0d6-8372-4b2d-a479-18352065b82c', 'college', NULL, '0f4b36d3-bebe-456f-8e11-b89a4fe2a723', '{"Excellent Progress","Slow but Improving","Teamwork is Improving"}', 'good', 'college', '2026-01-30 10:13:41.657003+00', '2026-01-30 10:13:41.657003+00', '2026-01-30 10:13:41.657003+00');


--

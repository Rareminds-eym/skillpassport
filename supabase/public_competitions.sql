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
-- Data for Name: competitions; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."competitions" ("comp_id", "school_id", "name", "description", "level", "category", "competition_date", "registration_deadline", "venue", "team_size_min", "team_size_max", "eligibility_criteria", "rules", "prizes", "status", "created_at", "updated_at", "created_by_type", "created_by_educator_id", "created_by_admin_id") VALUES
	('3b086505-62bb-4263-ba6a-6f0e7b104113', '19442d7b-ff7f-4c7f-ad85-9e501f122b26', 'volley ball comptitions ', 'ss', 'national', 'ss', '2025-12-18', NULL, NULL, 1, 1, NULL, NULL, '[]', 'upcoming', '2025-12-02 18:15:09.370655+00', '2025-12-02 18:15:09.370655+00', 'educator', '8b25ae13-d1ad-48bc-873a-8a269328afb8', NULL),
	('73e56ef2-05fe-47f0-b948-f6def9dd6832', '19442d7b-ff7f-4c7f-ad85-9e501f122b26', 'sports', '', 'national', '', '2025-12-11', NULL, NULL, 1, 1, NULL, NULL, '[]', 'completed', '2025-12-02 07:27:39.816882+00', '2025-12-03 06:51:01.133339+00', 'educator', '8b25ae13-d1ad-48bc-873a-8a269328afb8', NULL),
	('e51df31b-ea55-4ba9-bebb-3993175178fc', '19442d7b-ff7f-4c7f-ad85-9e501f122b26', 'Dance competition', 'Dance competition for the students from 6-10 class', 'district', 'Arts', '2025-12-09', NULL, NULL, 1, 1, NULL, NULL, '[]', 'upcoming', '2025-12-09 06:22:10.687414+00', '2025-12-09 06:22:10.687414+00', 'educator', '8b25ae13-d1ad-48bc-873a-8a269328afb8', NULL),
	('c6d561ad-8e66-48bb-8acc-b519d8f640ef', '69cf3489-0046-4414-8acc-409174ffbd2c', 'science', 'ss', 'state', 'science', '2025-12-27', NULL, NULL, 1, 1, NULL, NULL, '[]', 'completed', '2025-12-02 11:14:34.923129+00', '2026-01-01 10:33:12.463581+00', 'admin', NULL, '69cf3489-0046-4414-8acc-409174ffbd2c'),
	('3c59a2fe-7ac1-4b32-92b2-13e434736c53', '69cf3489-0046-4414-8acc-409174ffbd2c', 'Apptitude ', 'sdfgh', 'district', 'Mathematics', '2026-01-07', NULL, NULL, 1, 1, NULL, NULL, '[]', 'upcoming', '2026-01-02 04:01:55.149843+00', '2026-01-02 04:01:55.149843+00', 'educator', '61c92620-37f5-4be1-9537-d377c95aff31', NULL),
	('460a3591-7baf-48db-89fe-ffc3e09e69a8', '69cf3489-0046-4414-8acc-409174ffbd2c', 'Reasoning', 'dfg', 'district', 'Science', '2026-01-21', NULL, NULL, 1, 1, NULL, NULL, '[]', 'upcoming', '2026-01-02 07:08:55.149119+00', '2026-01-02 07:08:55.149119+00', 'educator', '5d78d3c6-e53e-48df-887f-fd21e1e58db6', NULL),
	('94ef2b28-d9d0-4dda-9d77-ef802c09e1cf', '69cf3489-0046-4414-8acc-409174ffbd2c', 'sports', 'sdfgh', 'national', 'sprts', '2025-12-19', NULL, NULL, 1, 1, NULL, NULL, '[]', 'completed', '2025-12-02 09:59:28.999376+00', '2026-01-02 07:09:49.020319+00', 'admin', NULL, '69cf3489-0046-4414-8acc-409174ffbd2c'),
	('5a0f5948-a4bf-45cb-b994-5f30c9c71b1b', '69cf3489-0046-4414-8acc-409174ffbd2c', 'AWS workshop', 'AWS workshops are free, self-guided tutorial experiences designed by Amazon Web Services teams to provide hands-on experience with various cloud services and concepts', 'interschool', 'software', '2025-12-17', NULL, NULL, 1, 1, NULL, NULL, '[]', 'completed', '2025-12-26 08:15:24.456008+00', '2026-01-02 07:13:31.866465+00', 'educator', '61c92620-37f5-4be1-9537-d377c95aff31', NULL),
	('cfa8c55b-d04a-4daa-820e-016259a99265', '69cf3489-0046-4414-8acc-409174ffbd2c', 'cloud workshop', 'ssdfg', 'state', 'science', '2025-12-14', NULL, NULL, 1, 1, NULL, NULL, '[]', 'upcoming', '2025-12-03 11:06:51.017002+00', '2026-01-02 07:43:49.65222+00', 'educator', '61c92620-37f5-4be1-9537-d377c95aff31', NULL);


--

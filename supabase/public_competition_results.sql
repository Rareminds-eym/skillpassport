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
-- Data for Name: competition_results; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."competition_results" ("result_id", "comp_id", "registration_id", "student_email", "rank", "score", "award", "category", "performance_notes", "certificate_issued", "certificate_id", "recorded_at", "recorded_by_type", "recorded_by_educator_id", "recorded_by_admin_id") VALUES
	('540526e0-edda-4b2c-9f35-7324c918ae5b', '94ef2b28-d9d0-4dda-9d77-ef802c09e1cf', 'f288bdd4-9c74-4e10-b967-996919a2fe1a', 'diya.patel@school.com', 2, 70.00, 'Silver Medal - 2nd Place', NULL, '33', false, NULL, '2025-12-03 05:31:30.943124+00', 'educator', '61c92620-37f5-4be1-9537-d377c95aff31', NULL),
	('97e72320-b8d5-4ff2-93f5-b030b0c9ff34', '5a0f5948-a4bf-45cb-b994-5f30c9c71b1b', 'e57fdf4b-f751-42c5-aa43-c708990593d3', 'arjun.reddy@school.com', 1, 90.00, 'Gold Medal - 1st Place', NULL, 'better', false, NULL, '2026-01-01 09:40:00.90201+00', 'educator', '61c92620-37f5-4be1-9537-d377c95aff31', NULL),
	('93d56c06-7ba1-42a1-8403-68281a12aa1a', 'c6d561ad-8e66-48bb-8acc-b519d8f640ef', 'dec4421d-1b9d-4dd0-a0b9-f8f84fa106ab', 'stu505@school.edu', 3, 78.00, 'Bronze Medal - 3rd Place', NULL, 'de', false, NULL, '2026-01-02 04:05:27.996138+00', 'educator', '61c92620-37f5-4be1-9537-d377c95aff31', NULL),
	('070e9f27-fb74-4230-a025-eb6dea6a9f00', 'c6d561ad-8e66-48bb-8acc-b519d8f640ef', '0e2045f7-d7f2-443e-bad4-5622570aa0ac', 'stu512@school.edu', 1, 90.00, 'Gold Medal - 1st Place', NULL, 'good', false, NULL, '2026-01-01 08:24:38.590356+00', 'educator', '61c92620-37f5-4be1-9537-d377c95aff31', NULL);


--

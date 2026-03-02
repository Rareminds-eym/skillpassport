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
-- Data for Name: pipeline_candidates; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."pipeline_candidates" ("id_old", "student_id", "candidate_name", "candidate_email", "candidate_phone", "stage", "previous_stage", "stage_changed_at", "stage_changed_by", "status", "rejection_reason", "rejection_date", "next_action", "next_action_date", "next_action_notes", "recruiter_rating", "recruiter_notes", "assigned_to", "source", "added_by", "added_at", "created_at", "updated_at", "opportunity_id_old", "requisition_id", "id", "opportunity_id") VALUES
	(NULL, 'c802ab39-21ed-4d6c-9f8f-869b442b0939', 'Karthik9 Std', 'karthik9@rareminds.in', '9066458993', 'interview_2', 'interview_1', '2026-01-23 07:54:33.231+00', '3dc7baf5-a4d0-4401-bb6a-5c5fa5c04af9', 'active', NULL, NULL, 'schedule_interview', '2026-01-24 00:00:00+00', NULL, NULL, NULL, NULL, 'direct_application', NULL, '2026-01-23 07:25:33.633+00', '2026-01-23 07:25:35.502916+00', '2026-01-23 07:54:34.971854+00', NULL, NULL, '328c6c4f-c751-4511-ade5-81c8c4e9e05a', '0993cdbb-b300-4bb7-ac89-fe51a14426c8'),
	(NULL, 'ab46b2ac-9922-4569-adc6-73eb6b645202', 'Meera Krishnan', 'stu503@school.edu', '', 'sourced', NULL, '2026-01-23 09:41:09.662+00', NULL, 'active', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'direct_application', NULL, '2026-01-23 09:41:09.662+00', '2026-01-23 09:41:08.984416+00', '2026-01-23 09:41:08.984416+00', NULL, NULL, 'cc2af5c7-6d33-4156-88bc-305331e0f864', '0993cdbb-b300-4bb7-ac89-fe51a14426c8'),
	(NULL, 'ab46b2ac-9922-4569-adc6-73eb6b645202', 'Meera Krishnan', 'stu503@school.edu', '', 'sourced', NULL, '2026-01-23 09:41:12.709+00', NULL, 'active', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'direct_application', NULL, '2026-01-23 09:41:12.709+00', '2026-01-23 09:41:12.012782+00', '2026-01-23 09:41:12.012782+00', NULL, NULL, 'f499aeff-f5fe-4a80-a531-039518ae67fe', '9bc0fdff-789c-4d0a-a808-494ae9706d34'),
	(NULL, '3531e63e-589e-46e7-9248-4a769e84b00d', 'Aditi Sharma', 'aditi.sharma@aditya.college.edu', '9876543225', 'sourced', NULL, '2026-01-27 07:24:02.165+00', NULL, 'active', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'direct_application', NULL, '2026-01-27 07:24:02.165+00', '2026-01-27 07:24:01.672666+00', '2026-01-27 07:24:01.672666+00', NULL, NULL, '0ae90cbe-654c-449d-b3a8-ec5c0db9ba64', '7542b2ee-c47a-45e3-a000-d403c15474c7'),
	(NULL, '3531e63e-589e-46e7-9248-4a769e84b00d', 'Aditi Sharma', 'aditi.sharma@aditya.college.edu', '9876543225', 'sourced', NULL, '2026-01-27 07:25:05.567+00', NULL, 'active', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'direct_application', NULL, '2026-01-27 07:25:05.567+00', '2026-01-27 07:25:05.040086+00', '2026-01-27 07:25:05.040086+00', NULL, NULL, '6054e433-c2a9-4199-8833-97ae0deb1c9e', '9bc0fdff-789c-4d0a-a808-494ae9706d34'),
	(NULL, 'c5d30a55-8d9a-46e6-b8d0-6accc0415c1c', 'litikesh Vilvanathan', 'litikesh@rareminds.in', '9970882679', 'sourced', NULL, '2026-01-27 10:37:02.613+00', NULL, 'active', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'direct_application', NULL, '2026-01-27 10:37:02.613+00', '2026-01-27 10:37:01.81404+00', '2026-01-27 10:37:01.81404+00', NULL, NULL, '14036c46-e84e-45ba-a51c-a95253574f60', '9bc0fdff-789c-4d0a-a808-494ae9706d34'),
	(NULL, 'c5d30a55-8d9a-46e6-b8d0-6accc0415c1c', 'litikesh Vilvanathan', 'litikesh@rareminds.in', '9970882679', 'sourced', NULL, '2026-01-28 05:43:41.617+00', NULL, 'active', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'direct_application', NULL, '2026-01-28 05:43:41.617+00', '2026-01-28 05:43:42.3105+00', '2026-01-28 05:43:42.3105+00', NULL, NULL, '641cbbca-ac70-4124-a53a-388600e43714', '7542b2ee-c47a-45e3-a000-d403c15474c7'),
	(NULL, '3531e63e-589e-46e7-9248-4a769e84b00d', 'Aditi Sharma', 'aditi.sharma@aditya.college.edu', '9876543225', 'screened', 'sourced', '2026-01-30 09:15:17.853+00', '902d03ef-71c0-4781-8e09-c2ef46511cbb', 'active', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'direct_application', NULL, '2026-01-29 09:20:39.902+00', '2026-01-29 09:20:40.725899+00', '2026-01-30 09:15:17.850953+00', NULL, NULL, 'cb1c492f-3785-40b0-9656-e20d7a0d6376', 'b8e37c41-5892-48f0-bf0b-904a21896401'),
	(NULL, 'c5d30a55-8d9a-46e6-b8d0-6accc0415c1c', 'litikesh Vilvanathan', 'litikesh@rareminds.in', '9970882679', 'interview_1', 'offer', '2026-01-30 09:39:08.943+00', '902d03ef-71c0-4781-8e09-c2ef46511cbb', 'active', NULL, NULL, 'schedule_interview', '2026-01-31 00:00:00+00', 'TR1', NULL, NULL, NULL, 'direct_application', NULL, '2026-01-29 10:48:06.779+00', '2026-01-29 10:48:07.291391+00', '2026-01-30 09:39:36.742497+00', NULL, NULL, 'bbcacc45-22d0-4ae2-958e-a053f44f5395', '816c1f63-1a5c-40ef-b057-3a012c137d12'),
	(NULL, 'ab46b2ac-9922-4569-adc6-73eb6b645202', 'Meera Krishnan N', 'stu503@school.edu', '', 'sourced', NULL, '2026-01-31 04:36:35.866+00', NULL, 'active', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'direct_application', NULL, '2026-01-31 04:36:35.866+00', '2026-01-31 04:36:36.925294+00', '2026-01-31 04:36:36.925294+00', NULL, NULL, '11e2fda5-fd22-4711-b93d-e8fa7de139e8', '69cecf53-c0af-436a-94da-dc4765be8c79'),
	(NULL, '3531e63e-589e-46e7-9248-4a769e84b00d', 'Aditi Sharma', 'aditi.sharma@aditya.college.edu', '9876543225', 'sourced', NULL, '2026-02-02 10:33:42.504+00', NULL, 'active', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'direct_application', NULL, '2026-02-02 10:33:42.504+00', '2026-02-02 10:33:41.876577+00', '2026-02-02 10:33:41.876577+00', NULL, NULL, '29120c97-2668-4039-b37a-b7fe9c583d88', '0993cdbb-b300-4bb7-ac89-fe51a14426c8');


--

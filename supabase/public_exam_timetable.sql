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
-- Data for Name: exam_timetable; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."exam_timetable" ("id", "assessment_id", "course_id", "course_name", "course_code", "exam_date", "start_time", "end_time", "duration_minutes", "room", "building", "capacity", "batch_section", "invigilators", "chief_invigilator", "status", "special_instructions", "seating_arrangement", "created_at", "updated_at", "subject_id", "school_id", "class_id") VALUES
	('5e7f8b6b-4f32-4a71-8bf0-0d5d8df99fc0', '117cfcb1-b87f-4b60-8004-f5fb6d32a14f', NULL, 'Mathematics', '10-ALL-MAT', '2025-12-22', '09:00:00', '14:00:00', 180, 'R10', NULL, NULL, '10-ALL', '{}', NULL, 'scheduled', NULL, NULL, '2025-12-14 08:10:39.289+00', '2025-12-14 08:10:39.289+00', '8e70e7f0-c678-40de-b2c1-49f328ca2b8d', '69cf3489-0046-4414-8acc-409174ffbd2c', '0719a288-54cf-4747-96f7-59f2a8a66397'),
	('7a727ebc-3404-430c-bb8c-3c1c1b835138', '117cfcb1-b87f-4b60-8004-f5fb6d32a14f', NULL, 'Physics', '10-ALL-PHY', '2025-12-25', '09:00:00', '14:00:00', 180, 'Room 102', NULL, NULL, '10-ALL', '{}', NULL, 'scheduled', NULL, NULL, '2025-12-14 08:11:15.341646+00', '2025-12-14 08:11:15.341646+00', 'f7cafff6-e6cf-4650-bfa4-79589ac541bd', '69cf3489-0046-4414-8acc-409174ffbd2c', '0719a288-54cf-4747-96f7-59f2a8a66397'),
	('861d8908-9b4d-4bc0-82a0-6de6ffa88855', '117cfcb1-b87f-4b60-8004-f5fb6d32a14f', NULL, 'Chemistry', '10-ALL-CHE', '2025-12-29', '09:00:00', '13:00:00', 180, 'R12', NULL, NULL, '10-ALL', '{}', NULL, 'scheduled', NULL, NULL, '2025-12-14 08:11:46.252273+00', '2025-12-14 08:11:46.252273+00', 'ec942d25-253d-4736-a848-a285bc890edc', '69cf3489-0046-4414-8acc-409174ffbd2c', '0719a288-54cf-4747-96f7-59f2a8a66397'),
	('b1126426-e79f-423c-9fca-524c80a8601d', '1bf53285-0279-49da-ac94-9d42e3da38cc', NULL, 'Physics', '10-B-PHY', '2025-12-31', '09:00:00', '17:00:00', 180, 'Lab B', NULL, NULL, '10-B', '{}', NULL, 'scheduled', NULL, NULL, '2025-12-14 18:08:19.633019+00', '2025-12-14 18:08:19.633019+00', 'f7cafff6-e6cf-4650-bfa4-79589ac541bd', '69cf3489-0046-4414-8acc-409174ffbd2c', '0719a288-54cf-4747-96f7-59f2a8a66397'),
	('f66ef9cb-e901-4e0e-9028-f606b6881c9b', '63fefdef-7822-4849-be7d-24bbd56f4de6', NULL, 'Mathematics', '10-A-MAT', '2025-12-18', '09:03:00', '12:04:00', 180, 'R10', NULL, NULL, '10-A', '{}', NULL, 'scheduled', NULL, NULL, '2025-12-18 11:31:30.729517+00', '2025-12-18 11:31:30.729517+00', '8e70e7f0-c678-40de-b2c1-49f328ca2b8d', '69cf3489-0046-4414-8acc-409174ffbd2c', '63c95b3d-ffdb-4b54-af81-cdf7ba8c154c'),
	('441ee1ca-a60c-4c8d-8a6c-2cbea4525581', 'ac213258-558b-4f14-b094-d34d4d0c0aa3', NULL, 'Mathematics', '10-ALL-MAT', '2025-12-25', '10:00:00', '14:00:00', 180, 'R10', NULL, NULL, '10-ALL', '{}', NULL, 'scheduled', NULL, NULL, '2025-12-24 07:04:20.166468+00', '2025-12-24 07:04:20.166468+00', '8e70e7f0-c678-40de-b2c1-49f328ca2b8d', '69cf3489-0046-4414-8acc-409174ffbd2c', '0719a288-54cf-4747-96f7-59f2a8a66397'),
	('002abbc3-1461-49cf-823d-650eb61dde41', 'ac213258-558b-4f14-b094-d34d4d0c0aa3', NULL, 'Physics', '10-ALL-PHY', '2025-12-26', '10:00:00', '14:00:00', 180, 'R11', NULL, NULL, '10-ALL', '{}', NULL, 'scheduled', NULL, NULL, '2025-12-24 07:04:48.977223+00', '2025-12-24 07:04:48.977223+00', 'f7cafff6-e6cf-4650-bfa4-79589ac541bd', '69cf3489-0046-4414-8acc-409174ffbd2c', '0719a288-54cf-4747-96f7-59f2a8a66397'),
	('41151da1-540f-453d-8cb8-5c2b33911072', 'ac213258-558b-4f14-b094-d34d4d0c0aa3', NULL, 'Chemistry', '10-ALL-CHE', '2025-12-27', '10:00:00', '14:00:00', 180, 'R12', NULL, NULL, '10-ALL', '{}', NULL, 'scheduled', NULL, NULL, '2025-12-24 07:05:19.217571+00', '2025-12-24 07:05:19.217571+00', 'ec942d25-253d-4736-a848-a285bc890edc', '69cf3489-0046-4414-8acc-409174ffbd2c', '0719a288-54cf-4747-96f7-59f2a8a66397'),
	('9b72c3fd-e8e2-4baf-a1eb-5eee2b71beb1', 'ac213258-558b-4f14-b094-d34d4d0c0aa3', NULL, 'English', '10-ALL-ENG', '2025-12-29', '10:00:00', '14:00:00', 180, 'R10', NULL, NULL, '10-ALL', '{}', NULL, 'scheduled', NULL, NULL, '2025-12-24 07:05:45.773263+00', '2025-12-24 07:05:45.773263+00', '878be7e1-b0d2-41cf-a8bc-49d6e99e9824', '69cf3489-0046-4414-8acc-409174ffbd2c', '0719a288-54cf-4747-96f7-59f2a8a66397'),
	('8266aa2f-9cef-4ef2-84d8-9fd49ebe91ab', 'ac213258-558b-4f14-b094-d34d4d0c0aa3', NULL, 'Business Studies', '10-ALL-BUS', '2025-12-31', '10:00:00', '14:00:00', 180, 'R11', NULL, NULL, '10-ALL', '{}', NULL, 'scheduled', NULL, NULL, '2025-12-24 07:06:14.510518+00', '2025-12-24 07:06:14.510518+00', '9b578de4-2b61-43b2-b580-7e065936a83a', '69cf3489-0046-4414-8acc-409174ffbd2c', '0719a288-54cf-4747-96f7-59f2a8a66397'),
	('ddc7b6d4-0a44-4c5f-b198-10adfb27638b', 'fb85d26c-852e-47db-b43a-84353d0753eb', NULL, 'Physics', '10-ALL-PHY', '2026-01-05', '10:00:00', '14:00:00', 180, 'R10', NULL, NULL, '10-ALL', '{}', NULL, 'scheduled', NULL, NULL, '2025-12-24 07:48:56.854444+00', '2025-12-24 07:48:56.854444+00', 'f7cafff6-e6cf-4650-bfa4-79589ac541bd', '69cf3489-0046-4414-8acc-409174ffbd2c', '0719a288-54cf-4747-96f7-59f2a8a66397'),
	('8ac9e0c0-8277-4abb-99e3-de6319b62949', 'fb85d26c-852e-47db-b43a-84353d0753eb', NULL, 'History', '10-ALL-HIS', '2026-01-07', '10:00:00', '14:00:00', 180, 'R12', NULL, NULL, '10-ALL', '{}', NULL, 'scheduled', NULL, NULL, '2025-12-24 07:49:51.692012+00', '2025-12-24 07:49:51.692012+00', '757a7dd4-28a9-4f3f-8bc7-5d8bc6723173', '69cf3489-0046-4414-8acc-409174ffbd2c', '0719a288-54cf-4747-96f7-59f2a8a66397'),
	('d39b2e72-6907-4536-b6da-2459eb9856c4', '4ba9029e-b322-4c72-abba-5bdb370d2be7', NULL, 'Biology', '10-A-BIO', '2026-01-29', '18:09:00', '21:09:00', 180, 'R12', NULL, NULL, '10-A', '{}', NULL, 'scheduled', NULL, NULL, '2026-01-29 11:39:22.397831+00', '2026-01-29 11:39:22.397831+00', NULL, '69cf3489-0046-4414-8acc-409174ffbd2c', '63c95b3d-ffdb-4b54-af81-cdf7ba8c154c');


--

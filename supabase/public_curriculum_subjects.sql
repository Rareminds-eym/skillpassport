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
-- Data for Name: curriculum_subjects; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."curriculum_subjects" ("id", "school_id", "name", "description", "is_active", "display_order", "created_at", "updated_at") VALUES
	('06e59e2b-eb75-40e7-848c-cfa3be44e505', '69cf3489-0046-4414-8acc-409174ffbd2c', 'Physical Education', NULL, true, 15, '2025-12-03 04:45:27.892556', '2025-12-03 05:34:01.396799'),
	('32909d71-fa09-4290-b5f5-99b55c39d2b8', '69cf3489-0046-4414-8acc-409174ffbd2c', 'Geography', NULL, true, 9, '2025-12-03 04:45:27.892556', '2025-12-03 05:51:04.010731'),
	('55f38201-358b-41be-842e-8c47e09fc098', '69cf3489-0046-4414-8acc-409174ffbd2c', 'Computer Science', NULL, true, 7, '2025-12-03 04:45:27.892556', '2025-12-03 05:51:07.779527'),
	('757a7dd4-28a9-4f3f-8bc7-5d8bc6723173', '69cf3489-0046-4414-8acc-409174ffbd2c', 'History', NULL, true, 6, '2025-12-03 04:45:27.892556', '2025-12-03 05:51:11.84645'),
	('878be7e1-b0d2-41cf-a8bc-49d6e99e9824', '69cf3489-0046-4414-8acc-409174ffbd2c', 'English', NULL, true, 5, '2025-12-03 04:45:27.892556', '2025-12-03 05:51:14.910879'),
	('87d53b6b-8849-464c-9778-e4a889ef8a41', '69cf3489-0046-4414-8acc-409174ffbd2c', 'Art', NULL, true, 16, '2025-12-03 04:45:27.892556', '2025-12-03 05:51:18.381518'),
	('8e70e7f0-c678-40de-b2c1-49f328ca2b8d', '69cf3489-0046-4414-8acc-409174ffbd2c', 'Mathematics', NULL, true, 1, '2025-12-03 04:45:27.892556', '2025-12-03 05:51:21.844425'),
	('8f17ce9d-9508-410c-ba82-04784690b6e9', '69cf3489-0046-4414-8acc-409174ffbd2c', 'Sociology', NULL, true, 11, '2025-12-03 04:45:27.892556', '2025-12-03 05:51:24.825857'),
	('9b578de4-2b61-43b2-b580-7e065936a83a', '69cf3489-0046-4414-8acc-409174ffbd2c', 'Business Studies', NULL, true, 13, '2025-12-03 04:45:27.892556', '2025-12-03 05:51:29.20977'),
	('9e43a6cd-b76a-406b-adc3-60561c57e4ac', '69cf3489-0046-4414-8acc-409174ffbd2c', 'Accountancy', NULL, true, 14, '2025-12-03 04:45:27.892556', '2025-12-03 05:51:34.59084'),
	('b0a2e8f7-ce17-4e17-bec2-aca208a1022d', '69cf3489-0046-4414-8acc-409174ffbd2c', 'Biology', NULL, true, 4, '2025-12-03 04:45:27.892556', '2025-12-03 05:51:37.824468'),
	('b80f8567-4fe4-4da0-b732-8dee24ce27ec', '69cf3489-0046-4414-8acc-409174ffbd2c', 'Economics', NULL, true, 8, '2025-12-03 04:45:27.892556', '2025-12-03 05:51:42.248773'),
	('c622effe-df50-4eb0-bcac-b7d3a07fbeee', '69cf3489-0046-4414-8acc-409174ffbd2c', 'Political Science', NULL, true, 10, '2025-12-03 04:45:27.892556', '2025-12-03 05:51:45.635688'),
	('e2714f63-5720-47db-ab89-c63fbaa6075e', '69cf3489-0046-4414-8acc-409174ffbd2c', 'Music', NULL, true, 17, '2025-12-03 04:45:27.892556', '2025-12-03 05:51:49.068124'),
	('ec942d25-253d-4736-a848-a285bc890edc', '69cf3489-0046-4414-8acc-409174ffbd2c', 'Chemistry', NULL, true, 3, '2025-12-03 04:45:27.892556', '2025-12-03 05:51:52.824681'),
	('f3554eef-4452-4231-8d40-91bafafe70ed', '69cf3489-0046-4414-8acc-409174ffbd2c', 'Psychology', NULL, true, 12, '2025-12-03 04:45:27.892556', '2025-12-03 05:52:01.794067'),
	('f7cafff6-e6cf-4650-bfa4-79589ac541bd', '69cf3489-0046-4414-8acc-409174ffbd2c', 'Physics', NULL, true, 2, '2025-12-03 04:45:27.892556', '2025-12-03 05:52:07.844946');


--

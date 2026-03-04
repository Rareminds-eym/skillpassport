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
-- Data for Name: school_classes; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."school_classes" ("id", "school_id", "name", "grade", "section", "academic_year", "max_students", "current_students", "account_status", "created_at", "updated_at", "metadata", "room_no") VALUES
	('870b65fe-902d-47b9-bda1-db4a4331d69c', '19442d7b-ff7f-4c7f-ad85-9e501f122b26', 'Class 8-C', '8', 'C', '2024 - 2025', 40, 1, 'active', '2025-12-01 11:13:13.68033+00', '2025-12-01 16:27:48.815604+00', '{"skillAreas": ["Math"]}', NULL),
	('3aeaa926-f082-4bcf-be52-9a632f25e987', '19442d7b-ff7f-4c7f-ad85-9e501f122b26', 'Class 9-B', '9', 'B', '2024-2025', 40, 1, 'active', '2025-12-01 11:12:45.040529+00', '2025-12-01 16:27:48.821007+00', '{"skillAreas": ["Science"]}', NULL),
	('01238bc2-5d09-44b0-add5-47dce6c449fe', '19442d7b-ff7f-4c7f-ad85-9e501f122b26', 'Class 10-A', '10', 'A', '2024-2025', 40, 1, 'active', '2025-12-01 11:02:46.557143+00', '2025-12-02 06:35:08.827365+00', '{"skillAreas": ["Math", "Science"]}', NULL),
	('0719a288-54cf-4747-96f7-59f2a8a66397', '69cf3489-0046-4414-8acc-409174ffbd2c', 'Class 10-K', '10', 'K', '2024-2026', 3, 5, 'active', '2025-12-02 05:33:02.020262+00', '2026-01-30 05:24:28.064015+00', '{"status": "Active", "educator": "karthikeyan s", "educatorId": "5d78d3c6-e53e-48df-887f-fd21e1e58db6", "skillAreas": ["Math", "Computer"], "educatorEmail": "karthik@rareminds.in"}', 'R10'),
	('19319d82-6a04-44be-ad3a-b474e7a782d3', '19442d7b-ff7f-4c7f-ad85-9e501f122b26', 'Class 10-B', '8', 'B', '2024-2025', 40, 0, 'active', '2025-12-02 04:31:17.176534+00', '2025-12-02 08:48:13.397185+00', '{"skillAreas": ["GK", "PE"]}', NULL),
	('2037e8fd-7934-4405-9d7a-390704f127b9', '69cf3489-0046-4414-8acc-409174ffbd2c', 'Class 10 - G', '11', 'A', '2024-2027', 40, 3, 'active', '2026-01-30 05:30:51.46148+00', '2026-01-30 05:33:22.235068+00', '{"status": "Upcoming", "educator": "karthikeyan s", "educatorId": "5d78d3c6-e53e-48df-887f-fd21e1e58db6", "skillAreas": ["Biology"], "educatorEmail": "karthik@rareminds.in"}', NULL),
	('874f975c-50c0-4c2e-893c-32537909071a', '69cf3489-0046-4414-8acc-409174ffbd2c', 'as', 'asdew', 'sdf', 'sdf', 40, 0, 'active', '2026-01-30 05:37:05.525852+00', '2026-01-30 05:37:05.525852+00', '{"status": "Active", "educator": "karthikeyan s", "educatorId": "5d78d3c6-e53e-48df-887f-fd21e1e58db6", "skillAreas": ["sdf"], "educatorEmail": "karthik@rareminds.in"}', NULL),
	('63c95b3d-ffdb-4b54-af81-cdf7ba8c154c', '69cf3489-0046-4414-8acc-409174ffbd2c', 'Class 10 - A', '10', 'A', '2025-2026', 4, 4, 'active', '2025-12-04 05:21:52.916467+00', '2026-02-02 05:50:00.284941+00', '{"status": "Active", "educator": "karthikeyan s", "educatorId": "5d78d3c6-e53e-48df-887f-fd21e1e58db6", "skillAreas": ["Math", "Science", "SST", "GK", "English", "Computer"], "educatorEmail": "karthik@rareminds.in"}', 'R12'),
	('5facad35-ae75-4c03-b999-6148372b6376', '19442d7b-ff7f-4c7f-ad85-9e501f122b26', 'section A', '10', 'A', '2024-2025', 40, 1, 'active', '2025-12-09 06:07:10.876556+00', '2025-12-09 06:07:21.563966+00', '{"status": "Active", "educator": "Jishnu", "educatorId": "8b25ae13-d1ad-48bc-873a-8a269328afb8", "skillAreas": ["GK", "English"], "educatorEmail": "jishnu@rareminds.in"}', NULL),
	('6bb97a72-4bf5-4369-92d8-33af08280148', '19442d7b-ff7f-4c7f-ad85-9e501f122b26', 'Class 10 - D', '10', 'D', '2025-2026', 40, 0, 'active', '2025-12-09 16:05:03.372285+00', '2025-12-09 16:05:03.372285+00', '{"status": "Active", "educator": "Jishnu", "educatorId": "8b25ae13-d1ad-48bc-873a-8a269328afb8", "skillAreas": ["Math", "GK"], "educatorEmail": "jishnu@rareminds.in"}', NULL),
	('b8f0d4d1-6602-4613-9f1c-7d5738197a3c', '19442d7b-ff7f-4c7f-ad85-9e501f122b26', 'Class 12 - C', '12', 'C', '2025 - 2026', 40, 0, 'active', '2025-12-09 16:28:38.2734+00', '2025-12-09 16:28:38.2734+00', '{"status": "Active", "educator": "Jishnu", "educatorId": "8b25ae13-d1ad-48bc-873a-8a269328afb8", "skillAreas": ["Math", "Gk", "English"], "educatorEmail": "jishnu@rareminds.in"}', NULL),
	('636f94dc-1870-4ad0-b487-d193850b44b4', '19442d7b-ff7f-4c7f-ad85-9e501f122b26', 'Class 10-D', '10', 'D', '2024-2025', 40, 0, 'active', '2025-12-14 07:06:50.414731+00', '2025-12-14 07:06:50.414731+00', '{}', NULL),
	('d0f57559-1f7a-43af-a790-4015efc3d148', '19442d7b-ff7f-4c7f-ad85-9e501f122b26', 'Class 10-E', '10', 'E', '2024-2025', 40, 0, 'active', '2025-12-14 07:06:50.414731+00', '2025-12-14 07:06:50.414731+00', '{}', NULL),
	('c5c19e3d-b559-45a4-83e3-84f1c41e5267', '19442d7b-ff7f-4c7f-ad85-9e501f122b26', 'Class 10-F', '10', 'F', '2024-2025', 40, 0, 'active', '2025-12-14 07:06:50.414731+00', '2025-12-14 07:06:50.414731+00', '{}', NULL),
	('588f5c42-2f91-4fec-89cc-dca5de209611', '69cf3489-0046-4414-8acc-409174ffbd2c', 'Class 10-C', '10', 'C', '2024-2025', 40, 1, 'active', '2025-12-02 08:50:35.214463+00', '2026-01-29 12:15:57.891741+00', '{"skillAreas": []}', 'R11');


--

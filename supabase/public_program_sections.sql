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
-- Data for Name: program_sections; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."program_sections" ("id", "department_id", "program_id", "semester", "section", "academic_year", "max_students", "current_students", "faculty_id", "status", "created_at", "updated_at", "created_by", "updated_by") VALUES
	('daf54028-c312-4268-a8ea-31742ae14973', '4affc7c0-52f7-40c6-924e-d90cc0d11285', 'f292fa81-ebe8-418f-aa24-bf70a6f218ca', 1, 'A', '2024-25', 60, 0, NULL, 'active', '2025-12-12 09:46:10.059074+00', '2026-01-08 07:22:30.241228+00', NULL, NULL),
	('28cd72c1-09ea-4f63-8715-b55df31bac5c', 'a987bd28-dcd0-478d-af06-42a0d0128da7', '1b729bdb-3004-4ff4-a446-7fb6c52d7e72', 1, 'A', '2025-26', 60, 0, '91bf6be4-31a5-4d6a-853d-675596755cee', 'active', '2025-12-23 03:57:14.830634+00', '2026-01-08 07:22:30.241228+00', '91bf6be4-31a5-4d6a-853d-675596755cee', NULL),
	('e74090cc-65d4-45cd-97de-fd289dbc0dd3', 'a987bd28-dcd0-478d-af06-42a0d0128da7', '1b729bdb-3004-4ff4-a446-7fb6c52d7e72', 1, 'A', '2026-27', 60, 0, '3d62343f-8004-4701-b454-c0333fb67742', 'active', '2026-01-04 14:44:19.117193+00', '2026-01-08 07:22:30.241228+00', '91bf6be4-31a5-4d6a-853d-675596755cee', NULL),
	('7827dc93-2cb2-41a7-98b5-6c0645aa8b1c', '4affc7c0-52f7-40c6-924e-d90cc0d11285', 'f292fa81-ebe8-418f-aa24-bf70a6f218ca', 1, 'C', '2026-27', 60, 0, '1849d8ee-6561-4049-b373-7b543d94309c', 'active', '2026-01-12 03:51:24.851801+00', '2026-01-12 03:51:24.851801+00', '91bf6be4-31a5-4d6a-853d-675596755cee', NULL),
	('3588bc49-7662-4d2b-b0ce-2ddf9037cb74', '4affc7c0-52f7-40c6-924e-d90cc0d11285', 'f292fa81-ebe8-418f-aa24-bf70a6f218ca', 1, 'D', '2026-27', 60, 0, '1849d8ee-6561-4049-b373-7b543d94309c', 'active', '2026-01-12 03:51:39.585964+00', '2026-01-12 03:51:39.585964+00', '91bf6be4-31a5-4d6a-853d-675596755cee', NULL),
	('7d8f529c-d97f-4d5e-a000-21b22bb99c6e', '4affc7c0-52f7-40c6-924e-d90cc0d11285', '95e078f6-22a6-46b9-9867-00931ddb7fc0', 1, 'A', '2026-27', 60, 0, '0ffcf1ed-e010-43ec-b13b-4bee6c9a2d79', 'active', '2026-01-09 08:35:23.874226+00', '2026-01-14 09:04:25.346493+00', '91bf6be4-31a5-4d6a-853d-675596755cee', '91bf6be4-31a5-4d6a-853d-675596755cee'),
	('9a716b2a-5811-4a23-83fc-f299fda907ef', 'a987bd28-dcd0-478d-af06-42a0d0128da7', '1b729bdb-3004-4ff4-a446-7fb6c52d7e72', 1, 'B', '2024-25', 60, 0, '0ffcf1ed-e010-43ec-b13b-4bee6c9a2d79', 'active', '2025-12-12 09:46:10.059074+00', '2026-01-17 08:48:57.09343+00', NULL, '91bf6be4-31a5-4d6a-853d-675596755cee'),
	('9848305f-c04f-4a70-9804-7a5310f6caf1', 'a987bd28-dcd0-478d-af06-42a0d0128da7', '1b729bdb-3004-4ff4-a446-7fb6c52d7e72', 2, 'A', '2024-25', 60, 0, '0ffcf1ed-e010-43ec-b13b-4bee6c9a2d79', 'active', '2025-12-12 09:46:10.059074+00', '2026-01-17 08:49:10.849076+00', NULL, '91bf6be4-31a5-4d6a-853d-675596755cee'),
	('0451cbbb-c1e5-4c6d-bb15-8e45f6bb09ce', 'a987bd28-dcd0-478d-af06-42a0d0128da7', '1b729bdb-3004-4ff4-a446-7fb6c52d7e72', 2, 'B', '2024-25', 60, 0, '0ffcf1ed-e010-43ec-b13b-4bee6c9a2d79', 'active', '2025-12-12 09:46:10.059074+00', '2026-01-17 08:49:18.643361+00', NULL, '91bf6be4-31a5-4d6a-853d-675596755cee'),
	('10d6c922-9b74-4b4d-a731-e391fcf5a496', 'a987bd28-dcd0-478d-af06-42a0d0128da7', '1b729bdb-3004-4ff4-a446-7fb6c52d7e72', 1, 'JK', '2024-25', 60, 0, 'b5a90f35-a3fe-48fd-8e2e-b5f14c56d18e', 'active', '2025-12-12 09:46:10.059074+00', '2026-01-29 04:17:25.812408+00', NULL, '91bf6be4-31a5-4d6a-853d-675596755cee'),
	('6215c140-9eb3-4eaa-8acb-323bd33156a7', '4affc7c0-52f7-40c6-924e-d90cc0d11285', 'f292fa81-ebe8-418f-aa24-bf70a6f218ca', 2, '2', '2026-27', 60, 0, NULL, 'active', '2026-01-29 12:28:44.827181+00', '2026-01-29 12:28:44.827181+00', '91bf6be4-31a5-4d6a-853d-675596755cee', NULL),
	('51ffdfa5-ff49-4aaa-a587-b76e7a331dac', '5a2cf269-4f14-423c-85b6-10396c3c0177', '0bd93653-6c80-4f3b-af23-0bee9ff67adb', 1, 'JK', '2026-27', 60, 4, '0ffcf1ed-e010-43ec-b13b-4bee6c9a2d79', 'active', '2026-01-08 06:10:55.789444+00', '2026-01-30 06:23:45.056517+00', '91bf6be4-31a5-4d6a-853d-675596755cee', NULL),
	('8426f9ae-5a4d-42db-9dc9-79c127a73db5', '5a2cf269-4f14-423c-85b6-10396c3c0177', '0bd93653-6c80-4f3b-af23-0bee9ff67adb', 1, 'C', '2026-27', 60, 3, '0ffcf1ed-e010-43ec-b13b-4bee6c9a2d79', 'active', '2026-01-08 07:05:47.331786+00', '2026-02-03 05:01:57.03834+00', '91bf6be4-31a5-4d6a-853d-675596755cee', NULL),
	('142f55a9-cd4e-4d69-a8f8-b067366ac962', 'a987bd28-dcd0-478d-af06-42a0d0128da7', '1b729bdb-3004-4ff4-a446-7fb6c52d7e72', 1, 'C', '2026-27', 60, 1, '0ffcf1ed-e010-43ec-b13b-4bee6c9a2d79', 'active', '2026-01-07 16:25:23.332995+00', '2026-02-03 05:02:21.052067+00', '91bf6be4-31a5-4d6a-853d-675596755cee', '91bf6be4-31a5-4d6a-853d-675596755cee'),
	('89f5f46a-e579-4627-9a83-e5e0d2291ef9', '5a2cf269-4f14-423c-85b6-10396c3c0177', '0bd93653-6c80-4f3b-af23-0bee9ff67adb', 1, 'A', '2026-27', 60, 1, '0ffcf1ed-e010-43ec-b13b-4bee6c9a2d79', 'active', '2026-01-05 03:54:44.348436+00', '2026-02-03 05:04:34.276075+00', '91bf6be4-31a5-4d6a-853d-675596755cee', '91bf6be4-31a5-4d6a-853d-675596755cee'),
	('45125c09-1121-45db-8b90-60998816eec6', '5a2cf269-4f14-423c-85b6-10396c3c0177', '0bd93653-6c80-4f3b-af23-0bee9ff67adb', 1, 'A', '2024-25', 60, 1, '0ffcf1ed-e010-43ec-b13b-4bee6c9a2d79', 'active', '2025-12-12 09:46:10.059074+00', '2026-02-03 05:04:34.276075+00', NULL, '91bf6be4-31a5-4d6a-853d-675596755cee');


--

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
-- Data for Name: college_course_mappings; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."college_course_mappings" ("id", "program_id", "semester", "offering_type", "faculty_id", "capacity", "is_locked", "created_at", "updated_at", "created_by", "updated_by", "metadata", "course_id", "current_enrollment") VALUES
	('f68dfd80-bf4d-4057-a11c-36ab86915d65', '1b729bdb-3004-4ff4-a446-7fb6c52d7e72', 1, 'core', '02563997-6412-46b7-89c7-4eecc07609b7', NULL, false, '2026-01-06 15:13:40.586+00', '2026-01-09 08:50:02.598+00', '91bf6be4-31a5-4d6a-853d-675596755cee', '91bf6be4-31a5-4d6a-853d-675596755cee', '{}', 'e5661261-22cb-4485-b741-5a8014439b8f', 0),
	('e7cc045e-7cee-49c2-9e74-417a49b9f3fd', '1b729bdb-3004-4ff4-a446-7fb6c52d7e72', 1, 'dept_elective', '02563997-6412-46b7-89c7-4eecc07609b7', 80, false, '2026-01-06 15:54:20.675+00', '2026-01-09 08:50:02.598+00', '91bf6be4-31a5-4d6a-853d-675596755cee', '91bf6be4-31a5-4d6a-853d-675596755cee', '{}', 'c9fc3641-1075-468e-a42c-94f8365d2184', 0),
	('b3095e32-c4cf-4f0f-b187-06fe7501d659', '1b729bdb-3004-4ff4-a446-7fb6c52d7e72', 1, 'core', '1240646c-9d7c-4926-b127-c06a7d6a01ca', NULL, false, '2026-01-07 09:09:19.971+00', '2026-01-09 08:50:02.598+00', '91bf6be4-31a5-4d6a-853d-675596755cee', '91bf6be4-31a5-4d6a-853d-675596755cee', '{}', '279beb60-394c-4240-8b69-210fdfb29e42', 0),
	('2107d6a4-ad79-41c4-ac52-93b54507d9de', '1b729bdb-3004-4ff4-a446-7fb6c52d7e72', 1, 'core', '1240646c-9d7c-4926-b127-c06a7d6a01ca', NULL, false, '2026-01-09 09:01:56.131+00', '2026-01-09 09:01:56.131+00', '91bf6be4-31a5-4d6a-853d-675596755cee', '91bf6be4-31a5-4d6a-853d-675596755cee', '{}', '22852efa-a7c3-4f61-bb6e-98735871b3bd', 0),
	('de75c653-9b4f-43ac-b684-f1ee3f3a9614', '0bd93653-6c80-4f3b-af23-0bee9ff67adb', 1, 'core', '0ffcf1ed-e010-43ec-b13b-4bee6c9a2d79', NULL, false, '2026-01-14 10:00:34.184+00', '2026-01-14 10:00:34.184+00', '91bf6be4-31a5-4d6a-853d-675596755cee', '91bf6be4-31a5-4d6a-853d-675596755cee', '{}', 'c8378d96-a8d0-4609-97b4-d19811e914cb', 0),
	('cd02dac2-ff4a-4a99-b43b-7803679a03f1', 'f292fa81-ebe8-418f-aa24-bf70a6f218ca', 2, 'core', '0ffcf1ed-e010-43ec-b13b-4bee6c9a2d79', NULL, false, '2026-01-29 12:29:42.771+00', '2026-01-29 12:29:42.771+00', '91bf6be4-31a5-4d6a-853d-675596755cee', '91bf6be4-31a5-4d6a-853d-675596755cee', '{}', 'e5661261-22cb-4485-b741-5a8014439b8f', 0),
	('8d9b728c-b240-4603-ad32-2004951f313a', '95e078f6-22a6-46b9-9867-00931ddb7fc0', 1, 'core', '0ffcf1ed-e010-43ec-b13b-4bee6c9a2d79', NULL, false, '2026-01-14 09:46:33.927+00', '2026-01-14 09:46:33.927+00', '91bf6be4-31a5-4d6a-853d-675596755cee', '91bf6be4-31a5-4d6a-853d-675596755cee', '{}', 'b3f76254-72da-4ff1-b1ff-431924754e6f', 0),
	('d4624d4d-bd26-4049-9a01-fdafc6293881', '1b729bdb-3004-4ff4-a446-7fb6c52d7e72', 5, 'core', NULL, NULL, false, '2026-01-07 09:09:39.727+00', '2026-01-07 09:10:58.076+00', '91bf6be4-31a5-4d6a-853d-675596755cee', '91bf6be4-31a5-4d6a-853d-675596755cee', '{}', '279beb60-394c-4240-8b69-210fdfb29e42', 0),
	('854ebdae-c98d-4a69-8755-138b87794444', '1b729bdb-3004-4ff4-a446-7fb6c52d7e72', 5, 'core', '02563997-6412-46b7-89c7-4eecc07609b7', NULL, false, '2026-01-07 09:09:39.727+00', '2026-01-07 09:10:58.076+00', '91bf6be4-31a5-4d6a-853d-675596755cee', '91bf6be4-31a5-4d6a-853d-675596755cee', '{}', 'e5661261-22cb-4485-b741-5a8014439b8f', 0),
	('c9ec89ff-63d5-4f71-9e6d-e5bf5199f916', '1b729bdb-3004-4ff4-a446-7fb6c52d7e72', 5, 'dept_elective', 'bcf2b189-b961-4099-9567-13e9d3bcfb12', 80, false, '2026-01-07 09:09:39.727+00', '2026-01-07 09:10:58.076+00', '91bf6be4-31a5-4d6a-853d-675596755cee', '91bf6be4-31a5-4d6a-853d-675596755cee', '{}', 'c9fc3641-1075-468e-a42c-94f8365d2184', 0),
	('8938fee0-eaa0-496b-a771-d8e2422d2153', '95e078f6-22a6-46b9-9867-00931ddb7fc0', 1, 'core', NULL, NULL, false, '2026-01-09 08:42:29.144056+00', '2026-01-09 08:42:29.144056+00', NULL, NULL, '{}', '279beb60-394c-4240-8b69-210fdfb29e42', 0),
	('98be5e8e-735b-4ba4-813c-71f0b932487b', '95e078f6-22a6-46b9-9867-00931ddb7fc0', 1, 'core', NULL, NULL, false, '2026-01-09 08:42:29.144056+00', '2026-01-09 08:42:29.144056+00', NULL, NULL, '{}', 'e5661261-22cb-4485-b741-5a8014439b8f', 0),
	('575bf5dc-3050-4516-baf0-5a8aeca31c2e', '95e078f6-22a6-46b9-9867-00931ddb7fc0', 1, 'core', NULL, NULL, false, '2026-01-09 08:42:29.144056+00', '2026-01-09 08:42:29.144056+00', NULL, NULL, '{}', '92f47955-541a-4031-b49e-1c893993f16c', 0),
	('db740494-f161-426f-9baf-9ec3aeb71f45', '95e078f6-22a6-46b9-9867-00931ddb7fc0', 2, 'core', NULL, NULL, false, '2026-01-09 08:42:29.144056+00', '2026-01-09 08:42:29.144056+00', NULL, NULL, '{}', 'c9fc3641-1075-468e-a42c-94f8365d2184', 0),
	('61354a3f-6721-4583-a500-923d5d43a26b', '95e078f6-22a6-46b9-9867-00931ddb7fc0', 2, 'core', NULL, NULL, false, '2026-01-09 08:42:29.144056+00', '2026-01-09 08:42:29.144056+00', NULL, NULL, '{}', 'abc39ea6-5a05-48d9-8606-358415c0a2f2', 0),
	('85347304-5394-484a-b2d7-756db7592179', '95e078f6-22a6-46b9-9867-00931ddb7fc0', 2, 'core', NULL, NULL, false, '2026-01-09 08:42:29.144056+00', '2026-01-09 08:42:29.144056+00', NULL, NULL, '{}', '9cfb86c3-960d-48bf-b7ff-5b84bfda7f3d', 0),
	('0f09e324-51b4-407a-aaad-40f7223447ed', '95e078f6-22a6-46b9-9867-00931ddb7fc0', 3, 'core', NULL, NULL, false, '2026-01-09 08:42:29.144056+00', '2026-01-09 08:42:29.144056+00', NULL, NULL, '{}', 'b3f76254-72da-4ff1-b1ff-431924754e6f', 0),
	('e94bcd5c-3e0a-4b05-81e3-9211529dcbc6', '95e078f6-22a6-46b9-9867-00931ddb7fc0', 1, 'core', '0ffcf1ed-e010-43ec-b13b-4bee6c9a2d79', NULL, false, '2026-01-09 08:48:34.772+00', '2026-01-09 08:48:34.772+00', '91bf6be4-31a5-4d6a-853d-675596755cee', '91bf6be4-31a5-4d6a-853d-675596755cee', '{}', 'c8378d96-a8d0-4609-97b4-d19811e914cb', 0);


--

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
-- Data for Name: college_timetable_slots; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."college_timetable_slots" ("id", "timetable_id", "educator_id", "class_id", "day_of_week", "period_number", "start_time", "end_time", "subject_name", "room_number", "created_at", "updated_at", "schedule_date", "is_recurring", "recurring_end_date", "color") VALUES
	('9c9068a2-a187-4fef-b868-bc58cbaeb859', 'aac9be12-0c23-4560-a3d7-b7fd2bffdf34', '462572af-66de-43da-97b9-339b6cf4d8ed', 'd0a31833-da1f-4423-b47b-f54c9d0fa4ca', 1, 1, '09:00:00', '09:50:00', 'Digital Electronics', 'Room:30', '2026-01-06 10:42:17.391327+00', '2026-01-06 10:42:17.391327+00', NULL, true, NULL, NULL),
	('2037029e-f514-4d4c-8823-dbf8b78d5abb', 'aac9be12-0c23-4560-a3d7-b7fd2bffdf34', '462572af-66de-43da-97b9-339b6cf4d8ed', 'd0a31833-da1f-4423-b47b-f54c9d0fa4ca', 6, 1, '09:00:00', '09:50:00', 'Digital Electronics', 'Room:200', '2026-01-06 10:42:32.566488+00', '2026-01-06 10:42:32.566488+00', NULL, true, NULL, NULL),
	('ee802d6b-5795-48ba-b37e-d9c9e0d0a31c', 'aac9be12-0c23-4560-a3d7-b7fd2bffdf34', '54a57877-67e3-49d6-8453-7c128ce4e286', 'd0a31833-da1f-4423-b47b-f54c9d0fa4ca', 1, 2, '09:50:00', '10:40:00', 'Computer Applications', 'Room:20', '2026-01-06 10:42:46.525885+00', '2026-01-06 10:42:46.525885+00', NULL, true, NULL, NULL),
	('ad717d04-4de6-4882-b6c4-0046f827d5ff', 'aac9be12-0c23-4560-a3d7-b7fd2bffdf34', '54a57877-67e3-49d6-8453-7c128ce4e286', 'd0a31833-da1f-4423-b47b-f54c9d0fa4ca', 1, 4, '10:55:00', '11:45:00', 'Computer Applications', 'Room:300', '2026-01-06 10:43:07.767536+00', '2026-01-06 10:43:07.767536+00', NULL, true, NULL, NULL),
	('65fab0a6-46f7-45b2-ae94-2a95f608ef66', 'aac9be12-0c23-4560-a3d7-b7fd2bffdf34', '452ce095-5aa9-478e-aedc-fdfa4fa82365', 'd0a31833-da1f-4423-b47b-f54c9d0fa4ca', 2, 2, '09:50:00', '10:40:00', 'Strategic Management', 'Room:20', '2026-01-06 10:43:22.513661+00', '2026-01-06 10:43:22.513661+00', NULL, true, NULL, NULL),
	('661bb1fc-ce94-46df-981b-c295fbe33a39', 'aac9be12-0c23-4560-a3d7-b7fd2bffdf34', '452ce095-5aa9-478e-aedc-fdfa4fa82365', 'd0a31833-da1f-4423-b47b-f54c9d0fa4ca', 2, 1, '09:00:00', '09:50:00', 'Management Principles', 'Room:200', '2026-01-06 10:43:32.398849+00', '2026-01-06 10:43:32.398849+00', NULL, true, NULL, NULL),
	('796ba61d-69a9-4fd5-aa41-6e9e10017d64', 'aac9be12-0c23-4560-a3d7-b7fd2bffdf34', '51da223b-c1ec-40f6-b0df-eb9c9d0f7378', 'd0a31833-da1f-4423-b47b-f54c9d0fa4ca', 3, 1, '09:00:00', '09:50:00', 'Database Management', 'Room:300', '2026-01-06 10:43:46.429656+00', '2026-01-06 10:43:46.429656+00', NULL, true, NULL, NULL),
	('b7664621-8a4a-4775-a73c-999b1c2c690a', 'aac9be12-0c23-4560-a3d7-b7fd2bffdf34', '51da223b-c1ec-40f6-b0df-eb9c9d0f7378', 'd0a31833-da1f-4423-b47b-f54c9d0fa4ca', 3, 4, '10:55:00', '11:45:00', 'Web Development', 'Room:200', '2026-01-06 10:43:59.416462+00', '2026-01-06 10:43:59.416462+00', NULL, true, NULL, NULL),
	('88961222-0ea0-4451-a896-cefb136136a9', 'aac9be12-0c23-4560-a3d7-b7fd2bffdf34', '0f4b36d3-bebe-456f-8e11-b89a4fe2a723', 'f2127afa-a906-4b99-918a-7c2d3f8e96d9', 1, 1, '09:00:00', '09:50:00', 'Thermodynamics', 'Room:3', '2026-01-08 06:11:02.331923+00', '2026-01-08 06:11:02.331923+00', NULL, true, NULL, NULL),
	('1e7adbd2-c77d-412a-905c-4d6042ea1d9f', 'aac9be12-0c23-4560-a3d7-b7fd2bffdf34', '0f4b36d3-bebe-456f-8e11-b89a4fe2a723', 'f2127afa-a906-4b99-918a-7c2d3f8e96d9', 1, 2, '09:50:00', '10:40:00', 'Fluid Mechanics', 'Room:2', '2026-01-08 06:11:18.355849+00', '2026-01-08 06:11:18.355849+00', NULL, true, NULL, NULL),
	('617b5030-8ec1-4179-99cf-e7e452b856bc', 'aac9be12-0c23-4560-a3d7-b7fd2bffdf34', '0f4b36d3-bebe-456f-8e11-b89a4fe2a723', 'f2127afa-a906-4b99-918a-7c2d3f8e96d9', 1, 3, '10:40:00', '10:55:00', 'Manufacturing Processes', 'Room:23', '2026-01-08 06:11:35.860794+00', '2026-01-08 06:11:35.860794+00', NULL, true, NULL, NULL),
	('6663a2d5-f845-418e-8bb9-a346f8572d06', 'aac9be12-0c23-4560-a3d7-b7fd2bffdf34', '0f4b36d3-bebe-456f-8e11-b89a4fe2a723', 'f2127afa-a906-4b99-918a-7c2d3f8e96d9', 5, 4, '10:55:00', '11:45:00', 'Machine Design', 'Room:40', '2026-01-08 06:23:12.948176+00', '2026-01-08 06:23:12.948176+00', NULL, true, NULL, NULL),
	('1f0c36b6-e779-498d-84f9-07367d91abb6', 'aac9be12-0c23-4560-a3d7-b7fd2bffdf34', '0f4b36d3-bebe-456f-8e11-b89a4fe2a723', '420e6c8a-3830-4133-acd8-ec0bbb97f3eb', 5, 5, '11:45:00', '12:35:00', 'Thermodynamics', 'Room:20', '2026-01-08 06:23:38.880681+00', '2026-01-08 06:23:38.880681+00', NULL, true, NULL, NULL),
	('d34dc900-9cd1-4b79-aaa3-855609ae7519', 'aac9be12-0c23-4560-a3d7-b7fd2bffdf34', '0f4b36d3-bebe-456f-8e11-b89a4fe2a723', 'de32a194-f16c-4e15-aaa4-e29b66991c60', 4, 5, '11:45:00', '12:35:00', 'Machine Design', 'Room:3', '2026-01-08 06:24:49.01213+00', '2026-01-08 06:24:49.01213+00', NULL, true, NULL, NULL),
	('71bb83dd-7a30-4b11-8f50-3383d049e036', 'aac9be12-0c23-4560-a3d7-b7fd2bffdf34', '71d3c935-a318-4f59-a56a-4d0f2119136e', 'f2127afa-a906-4b99-918a-7c2d3f8e96d9', 2, 1, '09:00:00', '09:50:00', 'Data Structures', 'Room:5', '2026-01-08 07:38:10.052319+00', '2026-01-08 07:38:10.052319+00', NULL, true, NULL, NULL),
	('e6da9ce6-a2d1-4ab2-b4ce-757778e77798', 'aac9be12-0c23-4560-a3d7-b7fd2bffdf34', '71d3c935-a318-4f59-a56a-4d0f2119136e', 'f2127afa-a906-4b99-918a-7c2d3f8e96d9', 3, 2, '09:50:00', '10:40:00', 'Algorithms', 'Room:6', '2026-01-08 07:38:10.052319+00', '2026-01-08 07:38:10.052319+00', NULL, true, NULL, NULL),
	('006666cd-e308-4f6d-b4c9-2e5e8bfc8a80', 'aac9be12-0c23-4560-a3d7-b7fd2bffdf34', '51945926-9aa6-4f88-bb23-65ea5944b08c', 'f2127afa-a906-4b99-918a-7c2d3f8e96d9', 2, 3, '10:40:00', '10:55:00', 'Operating Systems', 'Room:7', '2026-01-08 07:38:10.052319+00', '2026-01-08 07:38:10.052319+00', NULL, true, NULL, NULL),
	('3517728d-5809-4c80-92ca-b14ac98f75a5', 'aac9be12-0c23-4560-a3d7-b7fd2bffdf34', '51945926-9aa6-4f88-bb23-65ea5944b08c', 'f2127afa-a906-4b99-918a-7c2d3f8e96d9', 4, 1, '09:00:00', '09:50:00', 'Computer Networks', 'Room:8', '2026-01-08 07:38:10.052319+00', '2026-01-08 07:38:10.052319+00', NULL, true, NULL, NULL),
	('5ee0de10-39da-4514-83ce-3934453e6719', 'aac9be12-0c23-4560-a3d7-b7fd2bffdf34', '0f4b36d3-bebe-456f-8e11-b89a4fe2a723', 'f2127afa-a906-4b99-918a-7c2d3f8e96d9', 3, 8, '14:10:00', '15:00:00', 'Manufacturing Processes', '201', '2026-01-12 07:20:08.328909+00', '2026-01-12 07:20:08.328909+00', NULL, true, NULL, NULL),
	('a791df00-fbb7-47ca-8abc-7264c4ae9d29', 'aac9be12-0c23-4560-a3d7-b7fd2bffdf34', 'e66fb47c-0bb3-4ae3-862a-d44efb60622f', 'f2127afa-a906-4b99-918a-7c2d3f8e96d9', 3, 9, '15:00:00', '15:50:00', 'Manufacturing Processes', '201', '2026-01-12 08:00:14.053595+00', '2026-01-12 08:00:14.053595+00', NULL, true, NULL, NULL);


--

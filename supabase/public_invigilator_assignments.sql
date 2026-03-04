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
-- Data for Name: invigilator_assignments; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."invigilator_assignments" ("id", "exam_timetable_id", "exam_room_id", "invigilator_id", "invigilator_name", "invigilator_type", "duty_date", "duty_start_time", "duty_end_time", "attendance_status", "check_in_time", "check_out_time", "duty_hours", "compensation_amount", "compensation_paid", "remarks", "issues_reported", "assigned_by", "created_at", "updated_at", "lecturer_record_id") VALUES
	('76e4fe69-d8e1-4591-80f1-6f6a480da36c', '5e7f8b6b-4f32-4a71-8bf0-0d5d8df99fc0', NULL, '323c133d-6144-43ca-bfd0-aaa0f11c2c26', 'karthikeyan s', 'regular', '2025-12-22', '09:00:00', '14:00:00', 'assigned', NULL, NULL, NULL, 0.00, false, NULL, NULL, '52004557-7df2-4c2a-bffb-437588cbb619', '2025-12-14 08:12:08.626893+00', '2025-12-14 08:12:08.626893+00', NULL),
	('8d2ed130-18dd-420f-9639-12d2a1d387a2', '7a727ebc-3404-430c-bb8c-3c1c1b835138', NULL, '2511693d-458d-4989-a3fc-3dba12d8a89a', 'Sinjani T', 'regular', '2025-12-25', '09:00:00', '14:00:00', 'assigned', NULL, NULL, NULL, 0.00, false, NULL, NULL, '52004557-7df2-4c2a-bffb-437588cbb619', '2025-12-14 08:12:12.889534+00', '2025-12-14 08:12:12.889534+00', NULL),
	('2aa3ae97-bae4-4e9e-affb-5fe831f8c534', '861d8908-9b4d-4bc0-82a0-6de6ffa88855', NULL, '323c133d-6144-43ca-bfd0-aaa0f11c2c26', 'karthikeyan s', 'regular', '2025-12-29', '09:00:00', '13:00:00', 'assigned', NULL, NULL, NULL, 0.00, false, NULL, NULL, '52004557-7df2-4c2a-bffb-437588cbb619', '2025-12-14 08:12:25.070307+00', '2025-12-14 08:12:25.070307+00', NULL),
	('cd13be10-964e-4799-912c-64dbbd8d7d8f', 'b1126426-e79f-423c-9fca-524c80a8601d', NULL, '323c133d-6144-43ca-bfd0-aaa0f11c2c26', 'karthikeyan s', 'regular', '2025-12-31', '09:00:00', '17:00:00', 'assigned', NULL, NULL, NULL, 0.00, false, NULL, NULL, '52004557-7df2-4c2a-bffb-437588cbb619', '2025-12-14 18:08:25.579159+00', '2025-12-14 18:08:25.579159+00', NULL),
	('509419d2-cbaa-4356-ad98-ad67b75ee939', 'f66ef9cb-e901-4e0e-9028-f606b6881c9b', NULL, '2511693d-458d-4989-a3fc-3dba12d8a89a', 'Sinjani T', 'regular', '2025-12-18', '09:03:00', '12:04:00', 'assigned', NULL, NULL, NULL, 0.00, false, NULL, NULL, '52004557-7df2-4c2a-bffb-437588cbb619', '2025-12-18 11:31:52.352409+00', '2025-12-18 11:31:52.352409+00', NULL),
	('5471b3c2-64f6-4fdf-8123-0ab386895a66', '441ee1ca-a60c-4c8d-8a6c-2cbea4525581', NULL, '323c133d-6144-43ca-bfd0-aaa0f11c2c26', 'karthikeyan s', 'regular', '2025-12-25', '10:00:00', '14:00:00', 'assigned', NULL, NULL, NULL, 0.00, false, NULL, NULL, '52004557-7df2-4c2a-bffb-437588cbb619', '2025-12-24 07:06:38.654216+00', '2025-12-24 07:06:38.654216+00', NULL),
	('db33d46f-1015-4bbb-9978-4e302cf454a3', '002abbc3-1461-49cf-823d-650eb61dde41', NULL, '323c133d-6144-43ca-bfd0-aaa0f11c2c26', 'karthikeyan s', 'regular', '2025-12-26', '10:00:00', '14:00:00', 'assigned', NULL, NULL, NULL, 0.00, false, NULL, NULL, '52004557-7df2-4c2a-bffb-437588cbb619', '2025-12-24 07:06:49.777964+00', '2025-12-24 07:06:49.777964+00', NULL),
	('58bd0df2-afa1-4d3b-9a5d-16978debafd0', '41151da1-540f-453d-8cb8-5c2b33911072', NULL, '2511693d-458d-4989-a3fc-3dba12d8a89a', 'Sinjini', 'regular', '2025-12-27', '10:00:00', '14:00:00', 'assigned', NULL, NULL, NULL, 0.00, false, NULL, NULL, '52004557-7df2-4c2a-bffb-437588cbb619', '2025-12-24 07:07:00.957917+00', '2025-12-24 07:07:00.957917+00', NULL),
	('23b20a90-a5fc-4fea-ae8c-f51512d1ffab', '9b72c3fd-e8e2-4baf-a1eb-5eee2b71beb1', NULL, '323c133d-6144-43ca-bfd0-aaa0f11c2c26', 'karthikeyan s', 'regular', '2025-12-29', '10:00:00', '14:00:00', 'assigned', NULL, NULL, NULL, 0.00, false, NULL, NULL, '52004557-7df2-4c2a-bffb-437588cbb619', '2025-12-24 07:07:07.562118+00', '2025-12-24 07:07:07.562118+00', NULL),
	('dcf65d46-81cd-411e-b80f-3a6a773ea01a', '8266aa2f-9cef-4ef2-84d8-9fd49ebe91ab', NULL, '323c133d-6144-43ca-bfd0-aaa0f11c2c26', 'karthikeyan s', 'regular', '2025-12-31', '10:00:00', '14:00:00', 'assigned', NULL, NULL, NULL, 0.00, false, NULL, NULL, '52004557-7df2-4c2a-bffb-437588cbb619', '2025-12-24 07:07:15.704621+00', '2025-12-24 07:07:15.704621+00', NULL),
	('07c11d62-3c40-46a8-9e38-4700519ac61b', 'ddc7b6d4-0a44-4c5f-b198-10adfb27638b', NULL, '323c133d-6144-43ca-bfd0-aaa0f11c2c26', 'karthikeyan s', 'regular', '2026-01-05', '10:00:00', '14:00:00', 'assigned', NULL, NULL, NULL, 0.00, false, NULL, NULL, '52004557-7df2-4c2a-bffb-437588cbb619', '2025-12-24 07:51:03.288113+00', '2025-12-24 07:51:03.288113+00', NULL),
	('45000543-8a67-447a-8b68-54d8ea503eb2', '8ac9e0c0-8277-4abb-99e3-de6319b62949', NULL, '2511693d-458d-4989-a3fc-3dba12d8a89a', 'Sinjini', 'regular', '2026-01-07', '10:00:00', '14:00:00', 'assigned', NULL, NULL, NULL, 0.00, false, NULL, NULL, '52004557-7df2-4c2a-bffb-437588cbb619', '2025-12-24 07:51:08.430193+00', '2025-12-24 07:51:08.430193+00', NULL),
	('a914fc52-3cf9-48cd-af6d-91c970d4c2fb', 'd39b2e72-6907-4536-b6da-2459eb9856c4', NULL, '323c133d-6144-43ca-bfd0-aaa0f11c2c26', 'karthikeyan s', 'regular', '2026-01-29', '18:09:00', '21:09:00', 'assigned', NULL, NULL, NULL, 0.00, false, NULL, NULL, '52004557-7df2-4c2a-bffb-437588cbb619', '2026-01-29 11:39:40.982319+00', '2026-01-29 11:39:40.982319+00', NULL);


--

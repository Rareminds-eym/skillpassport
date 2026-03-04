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
-- Data for Name: attendance_records; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."attendance_records" ("id", "student_id", "school_id", "date", "status", "mode", "time_in", "time_out", "marked_by", "remarks", "otp_verified", "created_at", "updated_at", "slot_id") VALUES
	('2361a54c-9c28-4b03-ad9d-c33a9b1775b2', 'f1c66747-249a-4303-b6d9-b830bae13fb1', '69cf3489-0046-4414-8acc-409174ffbd2c', '2025-12-10', 'present', 'manual', '13:30:00', NULL, '323c133d-6144-43ca-bfd0-aaa0f11c2c26', NULL, false, '2025-12-10 08:00:16.13493+00', '2025-12-10 08:00:16.13493+00', '662f215f-7a90-4456-a5c9-0ebd355a9c6a'),
	('34102aac-b8e9-47b9-b0e0-51e95d5274b2', 'c5d30a55-8d9a-46e6-b8d0-6accc0415c1c', '69cf3489-0046-4414-8acc-409174ffbd2c', '2025-12-10', 'present', 'manual', '13:30:00', NULL, '323c133d-6144-43ca-bfd0-aaa0f11c2c26', NULL, false, '2025-12-10 08:00:16.13493+00', '2025-12-10 08:00:16.13493+00', '662f215f-7a90-4456-a5c9-0ebd355a9c6a'),
	('a30e8962-b8db-48b5-86d3-9ad22639d500', 'e39aaf58-769d-467a-bd70-96256fc211ec', '69cf3489-0046-4414-8acc-409174ffbd2c', '2025-12-10', 'present', 'manual', '13:30:00', NULL, '323c133d-6144-43ca-bfd0-aaa0f11c2c26', NULL, false, '2025-12-10 08:00:16.13493+00', '2025-12-10 08:00:16.13493+00', '662f215f-7a90-4456-a5c9-0ebd355a9c6a'),
	('d1000262-3c12-4a4d-94ab-6e2256a628c6', 'f1c66747-249a-4303-b6d9-b830bae13fb1', '69cf3489-0046-4414-8acc-409174ffbd2c', '2025-12-10', 'present', 'manual', '13:30:00', NULL, '323c133d-6144-43ca-bfd0-aaa0f11c2c26', NULL, false, '2025-12-10 08:00:32.148555+00', '2025-12-10 08:00:32.148555+00', 'ce999e5c-1b6c-4d5e-b527-343d84b5f400'),
	('11775767-c82a-42db-a32e-ba17efbcdc37', 'c5d30a55-8d9a-46e6-b8d0-6accc0415c1c', '69cf3489-0046-4414-8acc-409174ffbd2c', '2025-12-10', 'absent', 'manual', NULL, NULL, '323c133d-6144-43ca-bfd0-aaa0f11c2c26', NULL, false, '2025-12-10 08:00:32.148555+00', '2025-12-10 08:00:32.148555+00', 'ce999e5c-1b6c-4d5e-b527-343d84b5f400'),
	('1fdb8331-d633-4669-a14d-f1da4217ea4b', 'e39aaf58-769d-467a-bd70-96256fc211ec', '69cf3489-0046-4414-8acc-409174ffbd2c', '2025-12-10', 'present', 'manual', '13:30:00', NULL, '323c133d-6144-43ca-bfd0-aaa0f11c2c26', NULL, false, '2025-12-10 08:00:32.148555+00', '2025-12-10 08:00:32.148555+00', 'ce999e5c-1b6c-4d5e-b527-343d84b5f400'),
	('66f27164-80cb-4d57-ad74-3e753832aebd', 'f1c66747-249a-4303-b6d9-b830bae13fb1', '69cf3489-0046-4414-8acc-409174ffbd2c', '2025-12-10', 'late', 'manual', '13:30:00', NULL, '323c133d-6144-43ca-bfd0-aaa0f11c2c26', 'Testing ', false, '2025-12-10 08:00:54.834475+00', '2025-12-10 08:00:54.834475+00', 'f2a3c410-9602-428f-9b26-9ae83058b33f'),
	('678448b2-bdda-40f5-a865-fc9b01014ef6', 'c5d30a55-8d9a-46e6-b8d0-6accc0415c1c', '69cf3489-0046-4414-8acc-409174ffbd2c', '2025-12-10', 'present', 'manual', '13:30:00', NULL, '323c133d-6144-43ca-bfd0-aaa0f11c2c26', NULL, false, '2025-12-10 08:00:54.834475+00', '2025-12-10 08:00:54.834475+00', 'f2a3c410-9602-428f-9b26-9ae83058b33f'),
	('518ad3f5-cafe-4c39-b257-94d8ea35f859', 'e39aaf58-769d-467a-bd70-96256fc211ec', '69cf3489-0046-4414-8acc-409174ffbd2c', '2025-12-10', 'present', 'manual', '13:30:00', NULL, '323c133d-6144-43ca-bfd0-aaa0f11c2c26', NULL, false, '2025-12-10 08:00:54.834475+00', '2025-12-10 08:00:54.834475+00', 'f2a3c410-9602-428f-9b26-9ae83058b33f'),
	('efdc8cc6-7728-4449-b96d-8d8baed463a8', 'f1c66747-249a-4303-b6d9-b830bae13fb1', '69cf3489-0046-4414-8acc-409174ffbd2c', '2025-12-15', 'present', 'manual', '17:03:00', NULL, '323c133d-6144-43ca-bfd0-aaa0f11c2c26', NULL, false, '2025-12-15 11:33:28.400113+00', '2025-12-15 11:33:28.400113+00', 'fa53806f-c5a7-4487-96cf-128322d3846e'),
	('68435321-7fcc-4efb-b047-c51bc0d53156', 'c5d30a55-8d9a-46e6-b8d0-6accc0415c1c', '69cf3489-0046-4414-8acc-409174ffbd2c', '2025-12-15', 'present', 'manual', '17:03:00', NULL, '323c133d-6144-43ca-bfd0-aaa0f11c2c26', NULL, false, '2025-12-15 11:33:28.400113+00', '2025-12-15 11:33:28.400113+00', 'fa53806f-c5a7-4487-96cf-128322d3846e'),
	('a33ebe35-4321-486e-b952-ba6ea78afa39', 'e39aaf58-769d-467a-bd70-96256fc211ec', '69cf3489-0046-4414-8acc-409174ffbd2c', '2025-12-15', 'present', 'manual', '17:03:00', NULL, '323c133d-6144-43ca-bfd0-aaa0f11c2c26', NULL, false, '2025-12-15 11:33:28.400113+00', '2025-12-15 11:33:28.400113+00', 'fa53806f-c5a7-4487-96cf-128322d3846e'),
	('ba343c29-6be4-477b-ae8e-d1acaeb8d624', 'f1c66747-249a-4303-b6d9-b830bae13fb1', '69cf3489-0046-4414-8acc-409174ffbd2c', '2025-12-17', 'present', 'manual', NULL, NULL, '323c133d-6144-43ca-bfd0-aaa0f11c2c26', NULL, false, '2025-12-17 06:24:27.728025+00', '2025-12-17 06:24:27.728025+00', '662f215f-7a90-4456-a5c9-0ebd355a9c6a'),
	('872d090b-e7f8-479a-b381-b85823b4589c', 'c5d30a55-8d9a-46e6-b8d0-6accc0415c1c', '69cf3489-0046-4414-8acc-409174ffbd2c', '2025-12-17', 'present', 'manual', NULL, NULL, '323c133d-6144-43ca-bfd0-aaa0f11c2c26', NULL, false, '2025-12-17 06:24:27.728025+00', '2025-12-17 06:24:27.728025+00', '662f215f-7a90-4456-a5c9-0ebd355a9c6a'),
	('623bb788-9edd-487d-9279-66a69e0678ee', 'e39aaf58-769d-467a-bd70-96256fc211ec', '69cf3489-0046-4414-8acc-409174ffbd2c', '2025-12-17', 'present', 'manual', '11:54:00', NULL, '323c133d-6144-43ca-bfd0-aaa0f11c2c26', NULL, false, '2025-12-17 06:24:27.728025+00', '2025-12-17 06:24:27.728025+00', '662f215f-7a90-4456-a5c9-0ebd355a9c6a'),
	('90e4e3e8-f747-4c78-a782-0b51e453012d', 'e8a34593-6348-4212-bf61-0251243f4fbe', '69cf3489-0046-4414-8acc-409174ffbd2c', '2025-12-17', 'present', 'manual', NULL, NULL, '323c133d-6144-43ca-bfd0-aaa0f11c2c26', NULL, false, '2025-12-17 06:24:27.728025+00', '2025-12-17 06:24:27.728025+00', '662f215f-7a90-4456-a5c9-0ebd355a9c6a'),
	('c80ef7f4-13d4-4bb0-aba4-1d294d955967', '3eac2b3a-36bd-4a18-ad69-888079aa7b41', '69cf3489-0046-4414-8acc-409174ffbd2c', '2025-12-18', 'present', 'manual', '09:19:00', NULL, '323c133d-6144-43ca-bfd0-aaa0f11c2c26', NULL, false, '2025-12-18 03:49:17.231965+00', '2025-12-18 03:49:17.231965+00', '89c16ccb-086d-411f-b15e-c463e4779d46'),
	('71a5f7ae-f0a1-4a07-98cb-2cce2ae07456', '483f9197-d12c-443b-820d-5ab031ce05e3', '69cf3489-0046-4414-8acc-409174ffbd2c', '2025-12-18', 'present', 'manual', '09:19:00', NULL, '323c133d-6144-43ca-bfd0-aaa0f11c2c26', NULL, false, '2025-12-18 03:49:17.231965+00', '2025-12-18 03:49:17.231965+00', '89c16ccb-086d-411f-b15e-c463e4779d46'),
	('77f64f47-11f3-48eb-9037-c6fa9e316113', 'f53746eb-c392-4ce2-afdd-9ed377f0b103', '69cf3489-0046-4414-8acc-409174ffbd2c', '2025-12-18', 'present', 'manual', '09:19:00', NULL, '323c133d-6144-43ca-bfd0-aaa0f11c2c26', NULL, false, '2025-12-18 03:49:17.231965+00', '2025-12-18 03:49:17.231965+00', '89c16ccb-086d-411f-b15e-c463e4779d46'),
	('9802b320-0f4f-4452-9275-830c79b146b0', 'af458842-8d2a-4da3-95b0-41ccecbf18f2', '69cf3489-0046-4414-8acc-409174ffbd2c', '2025-12-18', 'present', 'manual', '09:19:00', NULL, '323c133d-6144-43ca-bfd0-aaa0f11c2c26', NULL, false, '2025-12-18 03:49:17.231965+00', '2025-12-18 03:49:17.231965+00', '89c16ccb-086d-411f-b15e-c463e4779d46'),
	('0616b0e2-9ae0-48c0-9f0c-c91f0f777c09', 'e8a34593-6348-4212-bf61-0251243f4fbe', '69cf3489-0046-4414-8acc-409174ffbd2c', '2025-12-15', 'present', 'manual', '17:03:00', NULL, '323c133d-6144-43ca-bfd0-aaa0f11c2c26', NULL, true, '2025-12-15 11:33:28.400113+00', '2026-01-06 09:34:00.315367+00', 'fa53806f-c5a7-4487-96cf-128322d3846e'),
	('0a235a0c-33e2-4d95-bf69-6076e47424e3', 'a8f591a4-3f09-4629-a7cd-c65a56b323b4', '69cf3489-0046-4414-8acc-409174ffbd2c', '2025-12-18', 'present', 'manual', '09:19:00', NULL, '323c133d-6144-43ca-bfd0-aaa0f11c2c26', NULL, false, '2025-12-18 03:49:17.231965+00', '2025-12-18 03:49:17.231965+00', '89c16ccb-086d-411f-b15e-c463e4779d46'),
	('867c9852-61b9-4b9e-97b9-cdd1b7bf0ae0', '62fdc63a-d6e0-461e-bf82-ffb6875481e4', '69cf3489-0046-4414-8acc-409174ffbd2c', '2025-12-18', 'present', 'manual', '09:19:00', NULL, '323c133d-6144-43ca-bfd0-aaa0f11c2c26', NULL, false, '2025-12-18 03:49:17.231965+00', '2025-12-18 03:49:17.231965+00', '89c16ccb-086d-411f-b15e-c463e4779d46'),
	('6f604918-279f-49f4-8cad-d89e317df35f', 'f5e8a9d5-3d47-4fa9-8d47-88a23ea9690a', '69cf3489-0046-4414-8acc-409174ffbd2c', '2025-12-18', 'absent', 'manual', NULL, NULL, '323c133d-6144-43ca-bfd0-aaa0f11c2c26', NULL, false, '2025-12-18 03:49:17.231965+00', '2025-12-18 03:49:17.231965+00', '89c16ccb-086d-411f-b15e-c463e4779d46'),
	('28e58d14-59b1-4642-9419-3e114e1d92ee', '3ac28f42-6146-472b-8cff-55bfb53705f6', '69cf3489-0046-4414-8acc-409174ffbd2c', '2025-12-18', 'present', 'manual', '09:19:00', NULL, '323c133d-6144-43ca-bfd0-aaa0f11c2c26', NULL, false, '2025-12-18 03:49:17.231965+00', '2025-12-18 03:49:17.231965+00', '89c16ccb-086d-411f-b15e-c463e4779d46'),
	('17eeb720-9210-42fa-ae08-14c38eb0cf06', 'ab46b2ac-9922-4569-adc6-73eb6b645202', '69cf3489-0046-4414-8acc-409174ffbd2c', '2025-12-18', 'present', 'manual', '09:19:00', NULL, '323c133d-6144-43ca-bfd0-aaa0f11c2c26', NULL, false, '2025-12-18 03:49:17.231965+00', '2025-12-18 03:49:17.231965+00', '89c16ccb-086d-411f-b15e-c463e4779d46'),
	('c37e5fb7-8d92-4fde-ae78-99d2165bd053', '0d9d52b6-34ad-492b-a890-5f2f3d02e6a7', '69cf3489-0046-4414-8acc-409174ffbd2c', '2025-12-18', 'present', 'manual', '09:19:00', NULL, '323c133d-6144-43ca-bfd0-aaa0f11c2c26', NULL, false, '2025-12-18 03:49:17.231965+00', '2025-12-18 03:49:17.231965+00', '89c16ccb-086d-411f-b15e-c463e4779d46');


--

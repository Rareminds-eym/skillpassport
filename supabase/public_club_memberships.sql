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
-- Data for Name: club_memberships; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."club_memberships" ("membership_id", "club_id", "student_email", "enrolled_at", "enrolled_by_type", "enrolled_by_educator_id", "enrolled_by_admin_id", "status", "withdrawn_at", "withdrawal_reason", "total_sessions_attended", "total_sessions_held", "attendance_percentage", "performance_score", "achievements") VALUES
	('7901effc-f903-4832-afbc-a75643a51236', '01be331e-87f8-4f12-be4b-567ad7cea29f', 'aarav.sharma@school.com', '2025-12-02 07:42:17.129174+00', 'educator', '8b25ae13-d1ad-48bc-873a-8a269328afb8', NULL, 'active', NULL, NULL, 1, 1, 100.00, 0.00, '[]'),
	('31bfcc46-0e47-4cf4-be71-2598edb5bd22', '01be331e-87f8-4f12-be4b-567ad7cea29f', 'aria.moonstone@school.com', '2025-12-02 07:42:27.001879+00', 'educator', '8b25ae13-d1ad-48bc-873a-8a269328afb8', NULL, 'active', NULL, NULL, 1, 1, 100.00, 0.00, '[]'),
	('664c1845-b7a4-43b5-b182-449e46e5b581', 'aeadaafb-6878-4a8a-8239-5666114bd059', 'diya.patel@school.com', '2025-12-02 11:07:17.77583+00', 'admin', NULL, '69cf3489-0046-4414-8acc-409174ffbd2c', 'active', NULL, NULL, 1, 1, 100.00, 0.00, '[]'),
	('99154217-b986-4eae-859c-4b97b63956d1', '1a3b849e-7713-484d-8cf1-dc32d04d1013', 'aria.moonstone@school.com', '2025-12-02 18:15:28.148588+00', 'educator', '8b25ae13-d1ad-48bc-873a-8a269328afb8', NULL, 'active', NULL, NULL, 0, 0, 0.00, 0.00, '[]'),
	('e97be709-13b5-4ecb-b7e3-35045ad61b7b', '40aac722-d09c-42b1-9e6c-607d3d2e8efa', 'litikesh@rareminds.in', '2026-01-02 11:20:56.792+00', 'educator', '5d78d3c6-e53e-48df-887f-fd21e1e58db6', NULL, 'active', NULL, NULL, 1, 1, 100.00, 0.00, '[]'),
	('b2ba2140-bde7-4768-9cac-1d5cab7476fa', '40aac722-d09c-42b1-9e6c-607d3d2e8efa', 'diya.patel@school.com', '2025-12-03 10:22:36.942034+00', 'educator', '61c92620-37f5-4be1-9537-d377c95aff31', NULL, 'withdrawn', '2025-12-03 10:22:51.801+00', NULL, 0, 0, 0.00, 0.00, '[]'),
	('7d54d568-9258-451a-a69d-d6c16d2aa94f', '40aac722-d09c-42b1-9e6c-607d3d2e8efa', 'aarav.sharma@school.com', '2025-12-03 10:23:10.026768+00', 'educator', '61c92620-37f5-4be1-9537-d377c95aff31', NULL, 'active', NULL, NULL, 0, 0, 0.00, 0.00, '[]'),
	('aaf790da-df53-4c78-925f-a60f6102f87c', 'aeadaafb-6878-4a8a-8239-5666114bd059', 'aarav.sharma@school.com', '2025-12-03 10:23:30.807629+00', 'educator', '61c92620-37f5-4be1-9537-d377c95aff31', NULL, 'active', NULL, NULL, 0, 0, 0.00, 0.00, '[]'),
	('57414eac-141f-41b9-b41d-cc9d49f77087', 'cab288f5-9b82-451a-b639-672128ec2547', 'diya.patel@school.com', '2025-12-03 10:23:36.269483+00', 'educator', '61c92620-37f5-4be1-9537-d377c95aff31', NULL, 'active', NULL, NULL, 0, 0, 0.00, 0.00, '[]'),
	('f873737a-38df-4b3a-a8ac-44c974dda644', 'c17aa8d9-786f-486e-9d77-8a297b586f1a', 'aria.moonstone@school.com', '2025-12-03 10:31:51.832505+00', 'educator', '8b25ae13-d1ad-48bc-873a-8a269328afb8', NULL, 'active', NULL, NULL, 0, 0, 0.00, 0.00, '[]'),
	('dbd1b320-5fa9-492d-b551-d1a9e19e4e04', 'cab288f5-9b82-451a-b639-672128ec2547', 'litikesh@rareminds.in', '2025-12-02 17:10:39.761455+00', 'admin', NULL, '69cf3489-0046-4414-8acc-409174ffbd2c', 'withdrawn', '2025-12-03 10:42:42.901+00', NULL, 0, 0, 0.00, 0.00, '[]'),
	('ed6fc67b-5f28-4b32-9a7c-a880de62a263', 'aeadaafb-6878-4a8a-8239-5666114bd059', 'litikesh@rareminds.in', '2025-12-02 11:07:25.606774+00', 'admin', NULL, '69cf3489-0046-4414-8acc-409174ffbd2c', 'withdrawn', '2025-12-03 10:44:00.022+00', NULL, 1, 1, 100.00, 0.00, '[]'),
	('5a4f51cb-4a66-48af-9948-281c86ef55e2', 'aeadaafb-6878-4a8a-8239-5666114bd059', 'arjun.reddy@school.com', '2025-12-03 10:55:25.724536+00', 'educator', '61c92620-37f5-4be1-9537-d377c95aff31', NULL, 'active', NULL, NULL, 0, 0, 0.00, 0.00, '[]'),
	('2608ac37-d39b-4e67-8ac3-955c77b5e562', '98e746ea-f153-489e-a244-e05e866b2206', 'stu518@school.edu', '2025-12-05 10:27:33.334283+00', 'educator', '61c92620-37f5-4be1-9537-d377c95aff31', NULL, 'withdrawn', '2025-12-05 10:27:36.827+00', NULL, 0, 0, 0.00, 0.00, '[]'),
	('59c3cbd0-35d5-4e12-ad8b-75ba82bd9466', '40aac722-d09c-42b1-9e6c-607d3d2e8efa', 'arjun.reddy@school.com', '2025-12-03 10:22:53.24868+00', 'educator', '61c92620-37f5-4be1-9537-d377c95aff31', NULL, 'withdrawn', '2025-12-05 10:52:04.935+00', NULL, 0, 0, 0.00, 0.00, '[]'),
	('f7a91ecf-569b-45d4-a3cf-0931201ec4af', '40aac722-d09c-42b1-9e6c-607d3d2e8efa', 'stu501@school.edu', '2025-12-05 10:52:15.41569+00', 'educator', '61c92620-37f5-4be1-9537-d377c95aff31', NULL, 'active', NULL, NULL, 0, 0, 0.00, 0.00, '[]'),
	('842735bb-6abf-4e20-9409-a4f31e75ec3b', '40aac722-d09c-42b1-9e6c-607d3d2e8efa', 'stu505@school.edu', '2025-12-05 10:52:24.601956+00', 'educator', '61c92620-37f5-4be1-9537-d377c95aff31', NULL, 'active', NULL, NULL, 0, 0, 0.00, 0.00, '[]'),
	('8f1f8705-aa65-4e44-9173-fdd80415623f', 'e7957b68-76b1-494c-a9d5-4870dd70ea4e', 'swetha822002@gmail.com', '2026-01-02 05:14:39.137506+00', 'educator', '5d78d3c6-e53e-48df-887f-fd21e1e58db6', NULL, 'active', NULL, NULL, 1, 1, 100.00, 0.00, '[]'),
	('fd02e61d-7f43-4a5a-bae8-2bcb7f32b2e9', 'afad4c98-70be-44fd-9dee-b3daf27e15b1', 'aria.moonstone@school.com', '2025-12-09 06:20:46.924509+00', 'educator', '8b25ae13-d1ad-48bc-873a-8a269328afb8', NULL, 'active', NULL, NULL, 0, 0, 0.00, 0.00, '[]'),
	('e12616d7-609f-49e3-9467-3262c1a560b7', 'afad4c98-70be-44fd-9dee-b3daf27e15b1', 'swaroop@gmail.com', '2025-12-09 06:20:48.713415+00', 'educator', '8b25ae13-d1ad-48bc-873a-8a269328afb8', NULL, 'active', NULL, NULL, 0, 0, 0.00, 0.00, '[]'),
	('288c9c96-1e67-4fb4-a641-f9f096ad81b3', '1a3b849e-7713-484d-8cf1-dc32d04d1013', 'swaroop@gmail.com', '2025-12-09 16:35:16.740901+00', 'educator', '8b25ae13-d1ad-48bc-873a-8a269328afb8', NULL, 'active', NULL, NULL, 0, 0, 0.00, 0.00, '[]'),
	('e1e84c5e-c994-4d07-a953-ec390467581f', '98e746ea-f153-489e-a244-e05e866b2206', 'diya.patel@school.com', '2025-12-03 10:22:44.816068+00', 'educator', '61c92620-37f5-4be1-9537-d377c95aff31', NULL, 'active', NULL, NULL, 1, 1, 100.00, 0.00, '[]'),
	('58ddb6cd-05ff-4ed8-8969-f9162223b857', '98e746ea-f153-489e-a244-e05e866b2206', 'arjun.reddy@school.com', '2025-12-03 10:55:17.483782+00', 'educator', '61c92620-37f5-4be1-9537-d377c95aff31', NULL, 'active', NULL, NULL, 1, 1, 100.00, 0.00, '[]'),
	('e0a3e56f-7e55-471a-97c2-4edbd6dad772', '98e746ea-f153-489e-a244-e05e866b2206', 'stu509@school.edu', '2025-12-05 10:51:54.540138+00', 'educator', '61c92620-37f5-4be1-9537-d377c95aff31', NULL, 'active', NULL, NULL, 1, 1, 100.00, 0.00, '[]'),
	('7a187fff-11e9-45dd-adf2-986799d987c2', '98e746ea-f153-489e-a244-e05e866b2206', 'stu504@school.edu', '2025-12-05 10:52:46.732738+00', 'educator', '61c92620-37f5-4be1-9537-d377c95aff31', NULL, 'active', NULL, NULL, 1, 1, 100.00, 0.00, '[]'),
	('6340d882-82cd-465f-843f-9d3e2dca8b56', 'ca3eaf58-47e6-4ab5-8eb3-aa5c43f6d765', 'litikesh@rareminds.in', '2026-01-02 03:58:52.934211+00', 'educator', '61c92620-37f5-4be1-9537-d377c95aff31', NULL, 'active', NULL, NULL, 1, 1, 100.00, 0.00, '[]'),
	('e9cb1229-808e-4601-a209-12b36b4781eb', 'ca3eaf58-47e6-4ab5-8eb3-aa5c43f6d765', 'ram.s@school.com', '2026-01-02 03:59:00.460558+00', 'educator', '61c92620-37f5-4be1-9537-d377c95aff31', NULL, 'active', NULL, NULL, 1, 1, 100.00, 0.00, '[]'),
	('dfad8a41-861d-4390-b3b9-622615308dcb', 'b73ab45f-bd22-438c-acc5-05399381e35a', 'swetha822002@gmail.com', '2026-01-02 05:14:28.712605+00', 'educator', '5d78d3c6-e53e-48df-887f-fd21e1e58db6', NULL, 'active', NULL, NULL, 0, 0, 0.00, 0.00, '[]'),
	('6095d7bb-c5cb-4e37-bcc2-f3a7d7129a38', '4dbbff48-3394-49aa-82fa-d5cb17384783', 'stu508@school.edu', '2025-12-22 06:02:54.12948+00', 'educator', '5d78d3c6-e53e-48df-887f-fd21e1e58db6', NULL, 'active', NULL, NULL, 2, 2, 100.00, 0.00, '[]'),
	('46931030-3b19-447c-92d1-63c1e5e7139d', '4dbbff48-3394-49aa-82fa-d5cb17384783', 'stu525@school.edu', '2025-12-22 06:03:00.872676+00', 'educator', '5d78d3c6-e53e-48df-887f-fd21e1e58db6', NULL, 'active', NULL, NULL, 2, 2, 100.00, 0.00, '[]'),
	('1c296593-cdf1-4bde-8a01-0e3a16bbbe5b', '4dbbff48-3394-49aa-82fa-d5cb17384783', 'stu513@school.edu', '2025-12-22 06:08:50.577394+00', 'educator', '5d78d3c6-e53e-48df-887f-fd21e1e58db6', NULL, 'active', NULL, NULL, 2, 2, 100.00, 0.00, '[]'),
	('d0599662-66bc-4c31-8a0a-802fa805a312', '4dbbff48-3394-49aa-82fa-d5cb17384783', 'stu509@school.edu', '2025-12-22 06:09:06.703484+00', 'educator', '5d78d3c6-e53e-48df-887f-fd21e1e58db6', NULL, 'active', NULL, NULL, 2, 2, 100.00, 0.00, '[]'),
	('d6f72f15-4509-404e-876b-fbbc7779ca97', '4dbbff48-3394-49aa-82fa-d5cb17384783', 'diya.patel@school.com', '2025-12-22 06:09:08.038994+00', 'educator', '5d78d3c6-e53e-48df-887f-fd21e1e58db6', NULL, 'active', NULL, NULL, 2, 2, 100.00, 0.00, '[]'),
	('f0ed3660-f4b7-401e-a9da-c49e1b3d3d78', '98e746ea-f153-489e-a244-e05e866b2206', 'litikesh@rareminds.in', '2026-01-02 11:06:12.631+00', 'educator', '5d78d3c6-e53e-48df-887f-fd21e1e58db6', NULL, 'active', NULL, NULL, 0, 0, 0.00, 0.00, '[]'),
	('18a3604d-9b29-470a-a16d-ebac5f2905d5', 'e7957b68-76b1-494c-a9d5-4870dd70ea4e', 'litikesh@rareminds.in', '2026-01-02 11:20:38.867+00', 'educator', '5d78d3c6-e53e-48df-887f-fd21e1e58db6', NULL, 'active', NULL, NULL, 1, 1, 100.00, 0.00, '[]'),
	('664525b6-4502-465e-bc1f-ce458dc91ac1', '98e746ea-f153-489e-a244-e05e866b2206', 'stu522@school.edu', '2026-01-01 07:39:00.721887+00', 'educator', '61c92620-37f5-4be1-9537-d377c95aff31', NULL, 'active', NULL, NULL, 1, 1, 100.00, 0.00, '[]'),
	('81f8f7f9-841b-4298-9ad6-a48f25fc2b6d', '98e746ea-f153-489e-a244-e05e866b2206', 'stu506@school.edu', '2026-01-01 07:39:05.945567+00', 'educator', '61c92620-37f5-4be1-9537-d377c95aff31', NULL, 'active', NULL, NULL, 1, 1, 100.00, 0.00, '[]'),
	('b40049f7-d58c-4181-b51e-30a25b6a1007', 'c4057ce9-9257-4324-98f3-ccaadbcfd277', 'sinjini@rareminds.in', '2025-12-05 10:57:09.154493+00', 'educator', '61c92620-37f5-4be1-9537-d377c95aff31', NULL, 'active', NULL, NULL, 2, 2, 100.00, 0.00, '[]'),
	('0c7cf18c-4b09-4e12-95f6-a7d2a8aff776', 'c4057ce9-9257-4324-98f3-ccaadbcfd277', 'stu503@school.edu', '2025-12-23 04:10:38.649654+00', 'educator', '5d78d3c6-e53e-48df-887f-fd21e1e58db6', NULL, 'active', NULL, NULL, 1, 2, 50.00, 0.00, '[]'),
	('ba4718a9-a083-412c-a288-902c6dd41a94', 'c4057ce9-9257-4324-98f3-ccaadbcfd277', 'stu519@school.edu', '2025-12-26 10:37:39.97944+00', 'educator', '61c92620-37f5-4be1-9537-d377c95aff31', NULL, 'active', NULL, NULL, 1, 2, 50.00, 0.00, '[]'),
	('293579f9-bf2d-4832-a28c-3a1dc6a66754', 'c4057ce9-9257-4324-98f3-ccaadbcfd277', 'litikesh@rareminds.in', '2026-01-02 11:25:23.336+00', 'educator', '5d78d3c6-e53e-48df-887f-fd21e1e58db6', NULL, 'active', NULL, NULL, 2, 2, 100.00, 0.00, '[]'),
	('23117ca1-851c-4077-b576-d06481f7c737', 'ca3eaf58-47e6-4ab5-8eb3-aa5c43f6d765', 'swetha822002@gmail.com', '2026-01-02 05:23:40.91131+00', 'educator', '5d78d3c6-e53e-48df-887f-fd21e1e58db6', NULL, 'active', NULL, NULL, 0, 0, 0.00, 0.00, '[]'),
	('350f1592-fea6-487e-8e08-67e3b201c7e9', '4dbbff48-3394-49aa-82fa-d5cb17384783', 'swetha822002@gmail.com', '2026-01-02 08:38:23.650931+00', 'educator', '5d78d3c6-e53e-48df-887f-fd21e1e58db6', NULL, 'active', NULL, NULL, 0, 0, 0.00, 0.00, '[]'),
	('061ec5fb-ec57-4a9d-9aae-d18397221a5a', '98e746ea-f153-489e-a244-e05e866b2206', 'kavana@gmail.com', '2026-01-01 07:39:07.541791+00', 'educator', '61c92620-37f5-4be1-9537-d377c95aff31', NULL, 'active', NULL, NULL, 1, 1, 100.00, 0.00, '[]'),
	('4b790f4f-4e23-4e1b-9186-3c85feb78706', '98e746ea-f153-489e-a244-e05e866b2206', 'stu512@school.edu', '2026-01-01 07:39:08.322111+00', 'educator', '61c92620-37f5-4be1-9537-d377c95aff31', NULL, 'active', NULL, NULL, 1, 1, 100.00, 0.00, '[]'),
	('4af6413a-0cf6-4d48-8e92-f9366c9b8b46', '98e746ea-f153-489e-a244-e05e866b2206', 'swetha822002@gmail.com', '2026-01-02 05:14:59.296735+00', 'educator', '5d78d3c6-e53e-48df-887f-fd21e1e58db6', NULL, 'active', NULL, NULL, 1, 1, 100.00, 0.00, '[]'),
	('68c329d7-a1ef-4f19-bb78-decb473bd4fd', '4dbbff48-3394-49aa-82fa-d5cb17384783', 'litikesh@rareminds.in', '2026-01-02 04:32:29.241577+00', 'educator', '5d78d3c6-e53e-48df-887f-fd21e1e58db6', NULL, 'withdrawn', '2026-01-02 10:39:44.901+00', NULL, 1, 2, 50.00, 0.00, '[]');


--

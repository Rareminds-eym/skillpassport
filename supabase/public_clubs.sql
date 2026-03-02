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
-- Data for Name: clubs; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."clubs" ("club_id", "school_id", "name", "category", "description", "capacity", "meeting_day", "meeting_time", "location", "mentor_type", "mentor_educator_id", "mentor_school_id", "is_active", "created_at", "updated_at", "created_by_type", "created_by_educator_id", "created_by_admin_id") VALUES
	('01be331e-87f8-4f12-be4b-567ad7cea29f', '19442d7b-ff7f-4c7f-ad85-9e501f122b26', 'finance club', 'science', 'ss', 30, 'tuesday', '10:30', 'room1', NULL, NULL, NULL, true, '2025-12-02 07:22:43.250592+00', '2025-12-02 07:22:43.250592+00', 'educator', '8b25ae13-d1ad-48bc-873a-8a269328afb8', NULL),
	('c17aa8d9-786f-486e-9d77-8a297b586f1a', '19442d7b-ff7f-4c7f-ad85-9e501f122b26', 'science', 'science', 'sd', 20, 'tuesday', '10:30', 'auditorium', NULL, NULL, NULL, true, '2025-12-02 09:38:17.692314+00', '2025-12-02 09:38:17.692314+00', 'educator', '8b25ae13-d1ad-48bc-873a-8a269328afb8', NULL),
	('98e746ea-f153-489e-a244-e05e866b2206', '69cf3489-0046-4414-8acc-409174ffbd2c', 'dance', 'arts', 'ss', 20, 'monday', '04:30', 'sss', NULL, NULL, NULL, true, '2025-12-02 11:16:11.668971+00', '2025-12-02 11:16:11.668971+00', 'admin', NULL, '69cf3489-0046-4414-8acc-409174ffbd2c'),
	('1a3b849e-7713-484d-8cf1-dc32d04d1013', '19442d7b-ff7f-4c7f-ad85-9e501f122b26', 'environment club', 'arts', 'ss', 30, 'thursday', '20:30', '30', NULL, NULL, NULL, true, '2025-12-02 18:11:25.017378+00', '2025-12-02 18:11:25.017378+00', 'educator', '8b25ae13-d1ad-48bc-873a-8a269328afb8', NULL),
	('40aac722-d09c-42b1-9e6c-607d3d2e8efa', '69cf3489-0046-4414-8acc-409174ffbd2c', 'media', 'arts', 'ss', 20, 'saturday', '10:30', 'src ', NULL, NULL, NULL, true, '2025-12-03 06:24:37.944616+00', '2025-12-03 06:24:37.944616+00', 'admin', NULL, '69cf3489-0046-4414-8acc-409174ffbd2c'),
	('136f68be-1d4e-4273-9004-799d45582bbd', '19442d7b-ff7f-4c7f-ad85-9e501f122b26', 'aa', 'science', 'ss', 30, 'tuesday', '10:40', 'ss', NULL, NULL, NULL, false, '2025-12-03 06:54:41.676172+00', '2025-12-03 06:54:52.150152+00', 'educator', '8b25ae13-d1ad-48bc-873a-8a269328afb8', NULL),
	('cab288f5-9b82-451a-b639-672128ec2547', '69cf3489-0046-4414-8acc-409174ffbd2c', 'singing', 'arts', 'ss', 30, 'wednesday', '12:30', 'room2', NULL, NULL, NULL, false, '2025-12-02 17:02:26.940296+00', '2025-12-05 10:28:56.023328+00', 'admin', NULL, '69cf3489-0046-4414-8acc-409174ffbd2c'),
	('afad4c98-70be-44fd-9dee-b3daf27e15b1', '19442d7b-ff7f-4c7f-ad85-9e501f122b26', 'Hackathon', 'arts', 'Hackathon for students', 30, 'Monday', '11:50', 'Room 110', NULL, NULL, NULL, true, '2025-12-09 06:20:41.651788+00', '2025-12-09 06:20:41.651788+00', 'educator', '8b25ae13-d1ad-48bc-873a-8a269328afb8', NULL),
	('e7957b68-76b1-494c-a9d5-4870dd70ea4e', '69cf3489-0046-4414-8acc-409174ffbd2c', 'english', 'literature', 'ss', 30, 'Friday', '01:30', 'cse', NULL, NULL, NULL, true, '2025-12-26 09:58:32.870846+00', '2025-12-26 09:58:32.870846+00', 'educator', '61c92620-37f5-4be1-9537-d377c95aff31', NULL),
	('b73ab45f-bd22-438c-acc5-05399381e35a', '69cf3489-0046-4414-8acc-409174ffbd2c', 'Photography club', 'arts', 'Photos', 30, 'Tuesday', '18:00', 'src', NULL, NULL, NULL, true, '2025-12-26 10:30:56.176198+00', '2025-12-26 10:30:56.176198+00', 'educator', '61c92620-37f5-4be1-9537-d377c95aff31', NULL),
	('c4057ce9-9257-4324-98f3-ccaadbcfd277', '69cf3489-0046-4414-8acc-409174ffbd2c', 'Cricket', 'arts', 'ssw', 8, 'Wednesday', '10:30', 'src', NULL, NULL, NULL, true, '2025-12-05 10:30:51.549343+00', '2025-12-27 03:58:38.97674+00', 'educator', '61c92620-37f5-4be1-9537-d377c95aff31', NULL),
	('aeadaafb-6878-4a8a-8239-5666114bd059', '69cf3489-0046-4414-8acc-409174ffbd2c', 'science', 'science', 'great science club', 30, 'monday', '10:30', 'room 1', NULL, NULL, NULL, false, '2025-12-02 11:07:12.314093+00', '2026-01-02 05:13:52.897267+00', 'admin', NULL, '69cf3489-0046-4414-8acc-409174ffbd2c'),
	('ca3eaf58-47e6-4ab5-8eb3-aa5c43f6d765', '69cf3489-0046-4414-8acc-409174ffbd2c', 'Student Innovation Center', 'science', 'A Student Innovation Center is a collaborative space where students transform ideas into practical solutions through creativity, technology, and teamwork.sdf', 30, 'Wednesday', '11:30', 'SAC', NULL, NULL, NULL, true, '2026-01-02 03:58:38.316002+00', '2026-01-02 08:16:55.655903+00', 'educator', '61c92620-37f5-4be1-9537-d377c95aff31', NULL),
	('0cf4d03e-b848-436e-8f57-b0cdb6748a5d', '69cf3489-0046-4414-8acc-409174ffbd2c', 'Environtment club', 'science', 'dfcgvbhjnkm', 30, 'Wednesday', '15:59', 'R5', NULL, NULL, NULL, true, '2026-01-02 10:27:38.71813+00', '2026-01-02 10:27:38.71813+00', 'educator', '5d78d3c6-e53e-48df-887f-fd21e1e58db6', NULL),
	('4dbbff48-3394-49aa-82fa-d5cb17384783', '69cf3489-0046-4414-8acc-409174ffbd2c', 'Creative Arts & Craft Club', 'arts', 'The Creative Arts & Craft Club encourages students to explore their artistic talents through drawing, painting, craftwork, and collaborative art projects. fghdfgghj', 30, 'Monday', '01:23', 'Room 101', NULL, NULL, NULL, false, '2025-12-10 04:50:57.760228+00', '2026-01-02 10:59:49.446292+00', 'educator', '5d78d3c6-e53e-48df-887f-fd21e1e58db6', NULL);


--

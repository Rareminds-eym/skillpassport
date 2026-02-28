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
-- Data for Name: club_attendance; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."club_attendance" ("attendance_id", "club_id", "session_date", "session_topic", "session_description", "duration_minutes", "created_at", "created_by_type", "created_by_educator_id", "created_by_admin_id") VALUES
	('516055fa-59de-459c-bda6-fdf2a0c68031', '01be331e-87f8-4f12-be4b-567ad7cea29f', '2025-12-02', 'work shop', NULL, NULL, '2025-12-02 07:43:03.784975+00', 'educator', '8b25ae13-d1ad-48bc-873a-8a269328afb8', NULL),
	('92aefd44-f4c4-4f8b-a009-f381e8c042c7', 'aeadaafb-6878-4a8a-8239-5666114bd059', '2025-12-02', 'workshop', NULL, NULL, '2025-12-02 11:27:31.086139+00', 'admin', NULL, '69cf3489-0046-4414-8acc-409174ffbd2c'),
	('23bdf357-1637-42cd-8289-ea5c0d945684', '40aac722-d09c-42b1-9e6c-607d3d2e8efa', '2025-12-03', 'take the photos ', NULL, NULL, '2025-12-03 06:25:11.161761+00', 'admin', NULL, '69cf3489-0046-4414-8acc-409174ffbd2c'),
	('dc15cb4d-23bf-4ffc-b791-ee6a722c5fd5', 'c4057ce9-9257-4324-98f3-ccaadbcfd277', '2025-12-05', 'attended the game', NULL, NULL, '2025-12-05 10:57:35.895395+00', 'educator', '61c92620-37f5-4be1-9537-d377c95aff31', NULL),
	('a3fe3986-e38b-4cbb-bbff-751bc81870b6', '4dbbff48-3394-49aa-82fa-d5cb17384783', '2025-12-26', 'creative', NULL, NULL, '2025-12-26 08:38:52.364517+00', 'educator', '61c92620-37f5-4be1-9537-d377c95aff31', NULL),
	('9c310500-1f0d-4b4b-90e7-c6ac66ae4e81', 'ca3eaf58-47e6-4ab5-8eb3-aa5c43f6d765', '2026-01-02', 'Innovating Ideas into Real-World Solutions', NULL, NULL, '2026-01-02 04:00:02.797199+00', 'educator', '61c92620-37f5-4be1-9537-d377c95aff31', NULL),
	('0311b863-b54b-46ee-90dd-257825c21b39', '4dbbff48-3394-49aa-82fa-d5cb17384783', '2026-01-02', 'dsfgh', NULL, NULL, '2026-01-02 05:15:23.216344+00', 'educator', '5d78d3c6-e53e-48df-887f-fd21e1e58db6', NULL),
	('cd7f10f6-a887-43c7-9d76-9146a761a9fa', 'e7957b68-76b1-494c-a9d5-4870dd70ea4e', '2026-01-02', 'dfgh', NULL, NULL, '2026-01-02 09:26:50.228326+00', 'educator', '5d78d3c6-e53e-48df-887f-fd21e1e58db6', NULL),
	('8278da9f-d4e8-42ed-bd1a-db1c61cef496', '98e746ea-f153-489e-a244-e05e866b2206', '2026-01-02', 'rtyuu', NULL, NULL, '2026-01-02 09:29:13.490794+00', 'educator', '5d78d3c6-e53e-48df-887f-fd21e1e58db6', NULL),
	('e169619a-1ce9-4a24-a0ca-bd4dbce3684b', 'c4057ce9-9257-4324-98f3-ccaadbcfd277', '2026-01-02', 'dfhjkjhgfdd', NULL, NULL, '2026-01-02 05:27:26.973033+00', 'educator', '5d78d3c6-e53e-48df-887f-fd21e1e58db6', NULL);


--

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
-- Data for Name: club_attendance_records; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."club_attendance_records" ("record_id", "attendance_id", "student_email", "status", "remarks", "marked_at", "marked_by_type", "marked_by_educator_id", "marked_by_admin_id") VALUES
	('32f117e8-2c63-4351-a7d4-abbf50a76c97', '516055fa-59de-459c-bda6-fdf2a0c68031', 'aarav.sharma@school.com', 'present', NULL, '2025-12-02 07:43:03.980904+00', 'educator', '8b25ae13-d1ad-48bc-873a-8a269328afb8', NULL),
	('581faf81-5c10-48c2-95d8-a18f28849fee', '516055fa-59de-459c-bda6-fdf2a0c68031', 'aria.moonstone@school.com', 'present', NULL, '2025-12-02 07:43:03.980904+00', 'educator', '8b25ae13-d1ad-48bc-873a-8a269328afb8', NULL),
	('0723c6e8-62e8-4abd-aa0b-7720d07f4f39', '92aefd44-f4c4-4f8b-a009-f381e8c042c7', 'diya.patel@school.com', 'present', NULL, '2025-12-02 11:27:31.1975+00', 'admin', NULL, '69cf3489-0046-4414-8acc-409174ffbd2c'),
	('0107f35c-46d4-4593-9c59-9fdc939c264c', '92aefd44-f4c4-4f8b-a009-f381e8c042c7', 'litikesh@rareminds.in', 'present', NULL, '2025-12-02 11:27:31.1975+00', 'admin', NULL, '69cf3489-0046-4414-8acc-409174ffbd2c'),
	('c1ffa49a-acd2-4b5a-98f3-0cb357067fcd', '23bdf357-1637-42cd-8289-ea5c0d945684', 'litikesh@rareminds.in', 'present', NULL, '2025-12-03 06:25:11.280932+00', 'admin', NULL, '69cf3489-0046-4414-8acc-409174ffbd2c'),
	('314574c3-656a-479a-b1db-83aea0e5a6f6', 'dc15cb4d-23bf-4ffc-b791-ee6a722c5fd5', 'litikesh@rareminds.in', 'present', NULL, '2025-12-05 10:57:36.019913+00', 'educator', '61c92620-37f5-4be1-9537-d377c95aff31', NULL),
	('c732438c-e1c7-491e-8949-fabccd0bbbb3', 'dc15cb4d-23bf-4ffc-b791-ee6a722c5fd5', 'sinjini@rareminds.in', 'present', NULL, '2025-12-05 10:57:36.019913+00', 'educator', '61c92620-37f5-4be1-9537-d377c95aff31', NULL),
	('28482339-54cb-4c81-a17b-e081e57b9d1d', 'a3fe3986-e38b-4cbb-bbff-751bc81870b6', 'stu508@school.edu', 'present', NULL, '2025-12-26 08:38:52.516283+00', 'educator', '61c92620-37f5-4be1-9537-d377c95aff31', NULL),
	('bc704712-99c9-430e-b557-c597996d1476', 'a3fe3986-e38b-4cbb-bbff-751bc81870b6', 'stu525@school.edu', 'present', NULL, '2025-12-26 08:38:52.516283+00', 'educator', '61c92620-37f5-4be1-9537-d377c95aff31', NULL),
	('173b3c2e-6fe9-42c0-9885-9b4ce9d8aaf8', 'a3fe3986-e38b-4cbb-bbff-751bc81870b6', 'stu513@school.edu', 'present', NULL, '2025-12-26 08:38:52.516283+00', 'educator', '61c92620-37f5-4be1-9537-d377c95aff31', NULL),
	('0267d8d1-f5a3-41f0-8367-ffb451d3334d', 'a3fe3986-e38b-4cbb-bbff-751bc81870b6', 'stu509@school.edu', 'present', NULL, '2025-12-26 08:38:52.516283+00', 'educator', '61c92620-37f5-4be1-9537-d377c95aff31', NULL),
	('0396df28-5b61-4e73-a1c2-ca4f65bbb9d5', 'a3fe3986-e38b-4cbb-bbff-751bc81870b6', 'diya.patel@school.com', 'present', NULL, '2025-12-26 08:38:52.516283+00', 'educator', '61c92620-37f5-4be1-9537-d377c95aff31', NULL),
	('218b9bda-bfd1-4908-b049-32dba6b78aa1', '9c310500-1f0d-4b4b-90e7-c6ac66ae4e81', 'litikesh@rareminds.in', 'present', NULL, '2026-01-02 04:00:02.933894+00', 'educator', '61c92620-37f5-4be1-9537-d377c95aff31', NULL),
	('b756e126-f00d-48b6-8532-d7736c92b727', '9c310500-1f0d-4b4b-90e7-c6ac66ae4e81', 'ram.s@school.com', 'present', NULL, '2026-01-02 04:00:02.933894+00', 'educator', '61c92620-37f5-4be1-9537-d377c95aff31', NULL),
	('731c8689-80d8-4651-8125-026998d98def', '0311b863-b54b-46ee-90dd-257825c21b39', 'stu508@school.edu', 'present', NULL, '2026-01-02 05:15:23.34911+00', 'educator', '5d78d3c6-e53e-48df-887f-fd21e1e58db6', NULL),
	('e91ace9a-4ad8-4bcb-b20b-6616489a9bb7', '0311b863-b54b-46ee-90dd-257825c21b39', 'stu525@school.edu', 'present', NULL, '2026-01-02 05:15:23.34911+00', 'educator', '5d78d3c6-e53e-48df-887f-fd21e1e58db6', NULL),
	('90d00e57-2c8c-49b5-8626-a4cc0dbc99dd', '0311b863-b54b-46ee-90dd-257825c21b39', 'stu513@school.edu', 'present', NULL, '2026-01-02 05:15:23.34911+00', 'educator', '5d78d3c6-e53e-48df-887f-fd21e1e58db6', NULL),
	('f16d41ba-cbca-4277-8d20-4fa771b6f85a', '0311b863-b54b-46ee-90dd-257825c21b39', 'stu509@school.edu', 'present', NULL, '2026-01-02 05:15:23.34911+00', 'educator', '5d78d3c6-e53e-48df-887f-fd21e1e58db6', NULL),
	('3202e42f-809b-4833-8078-a2aa718c5e04', '0311b863-b54b-46ee-90dd-257825c21b39', 'diya.patel@school.com', 'present', NULL, '2026-01-02 05:15:23.34911+00', 'educator', '5d78d3c6-e53e-48df-887f-fd21e1e58db6', NULL),
	('956ceb4d-185d-496f-9c7e-5dfcd932c2fc', '0311b863-b54b-46ee-90dd-257825c21b39', 'litikesh@rareminds.in', 'present', NULL, '2026-01-02 05:15:23.34911+00', 'educator', '5d78d3c6-e53e-48df-887f-fd21e1e58db6', NULL),
	('eebdb02c-187a-4091-a6e8-13864668b026', 'cd7f10f6-a887-43c7-9d76-9146a761a9fa', 'litikesh@rareminds.in', 'present', NULL, '2026-01-02 09:26:50.343181+00', 'educator', '5d78d3c6-e53e-48df-887f-fd21e1e58db6', NULL),
	('8ae19e3b-fa24-4e4a-95bd-e35c2a9072b2', 'cd7f10f6-a887-43c7-9d76-9146a761a9fa', 'swetha822002@gmail.com', 'present', NULL, '2026-01-02 09:26:50.343181+00', 'educator', '5d78d3c6-e53e-48df-887f-fd21e1e58db6', NULL),
	('fd630549-444e-4005-b8ca-949f8d8acb17', '8278da9f-d4e8-42ed-bd1a-db1c61cef496', 'diya.patel@school.com', 'present', NULL, '2026-01-02 09:29:13.609303+00', 'educator', '5d78d3c6-e53e-48df-887f-fd21e1e58db6', NULL),
	('ef0db6d1-16f3-4ceb-ab29-472b4ea87845', '8278da9f-d4e8-42ed-bd1a-db1c61cef496', 'arjun.reddy@school.com', 'present', NULL, '2026-01-02 09:29:13.609303+00', 'educator', '5d78d3c6-e53e-48df-887f-fd21e1e58db6', NULL),
	('6f45cf6d-dc49-4eea-985d-f2429a7f0811', '8278da9f-d4e8-42ed-bd1a-db1c61cef496', 'stu509@school.edu', 'present', NULL, '2026-01-02 09:29:13.609303+00', 'educator', '5d78d3c6-e53e-48df-887f-fd21e1e58db6', NULL),
	('3e44a94d-a24c-4239-9b0d-f14361921b43', '8278da9f-d4e8-42ed-bd1a-db1c61cef496', 'stu504@school.edu', 'present', NULL, '2026-01-02 09:29:13.609303+00', 'educator', '5d78d3c6-e53e-48df-887f-fd21e1e58db6', NULL),
	('51d176fd-ac77-4c6d-b1c3-ad67dff4ef8b', '8278da9f-d4e8-42ed-bd1a-db1c61cef496', 'stu522@school.edu', 'present', NULL, '2026-01-02 09:29:13.609303+00', 'educator', '5d78d3c6-e53e-48df-887f-fd21e1e58db6', NULL),
	('bb974ce1-2539-452c-904f-a05144f57459', '8278da9f-d4e8-42ed-bd1a-db1c61cef496', 'stu506@school.edu', 'present', NULL, '2026-01-02 09:29:13.609303+00', 'educator', '5d78d3c6-e53e-48df-887f-fd21e1e58db6', NULL),
	('33f62014-6f69-472e-9d71-5049a678f8fd', '8278da9f-d4e8-42ed-bd1a-db1c61cef496', 'kavana@gmail.com', 'present', NULL, '2026-01-02 09:29:13.609303+00', 'educator', '5d78d3c6-e53e-48df-887f-fd21e1e58db6', NULL),
	('e411a52f-0529-448f-a452-3bb35cd4cb24', '8278da9f-d4e8-42ed-bd1a-db1c61cef496', 'stu512@school.edu', 'present', NULL, '2026-01-02 09:29:13.609303+00', 'educator', '5d78d3c6-e53e-48df-887f-fd21e1e58db6', NULL),
	('848964d1-feb6-4cab-9067-ec791a0508a6', '8278da9f-d4e8-42ed-bd1a-db1c61cef496', 'swetha822002@gmail.com', 'present', NULL, '2026-01-02 09:29:13.609303+00', 'educator', '5d78d3c6-e53e-48df-887f-fd21e1e58db6', NULL),
	('7071be1b-1241-404d-8d19-371e3c4c30d7', 'e169619a-1ce9-4a24-a0ca-bd4dbce3684b', 'litikesh@rareminds.in', 'present', NULL, '2026-01-02 09:30:04.162512+00', 'educator', '61c92620-37f5-4be1-9537-d377c95aff31', NULL),
	('e6719194-63ea-4b86-b5d4-610049ea2d7c', 'e169619a-1ce9-4a24-a0ca-bd4dbce3684b', 'sinjini@rareminds.in', 'present', NULL, '2026-01-02 09:30:04.162512+00', 'educator', '61c92620-37f5-4be1-9537-d377c95aff31', NULL),
	('e35076a8-ec85-4217-8ea8-cca6843598ea', 'e169619a-1ce9-4a24-a0ca-bd4dbce3684b', 'stu503@school.edu', 'present', NULL, '2026-01-02 09:30:04.162512+00', 'educator', '61c92620-37f5-4be1-9537-d377c95aff31', NULL),
	('5169ea5e-9d27-496e-8832-199252c7f51d', 'e169619a-1ce9-4a24-a0ca-bd4dbce3684b', 'stu519@school.edu', 'present', NULL, '2026-01-02 09:30:04.162512+00', 'educator', '61c92620-37f5-4be1-9537-d377c95aff31', NULL);


--

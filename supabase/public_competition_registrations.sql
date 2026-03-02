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
-- Data for Name: competition_registrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."competition_registrations" ("registration_id", "comp_id", "student_email", "team_name", "team_members", "registration_date", "registered_by_type", "registered_by_educator_id", "registered_by_admin_id", "status", "notes", "special_requirements") VALUES
	('9751b38c-57a5-4570-a33c-fc4623898d24', '73e56ef2-05fe-47f0-b948-f6def9dd6832', 'aarav.sharma@school.com', NULL, '{"members": ["1"]}', '2025-12-02 08:09:55.554117+00', 'educator', '8b25ae13-d1ad-48bc-873a-8a269328afb8', NULL, 'registered', 'ss', NULL),
	('f288bdd4-9c74-4e10-b967-996919a2fe1a', '94ef2b28-d9d0-4dda-9d77-ef802c09e1cf', 'diya.patel@school.com', NULL, '{"members": ["2"]}', '2025-12-03 04:24:05.511254+00', 'admin', NULL, '69cf3489-0046-4414-8acc-409174ffbd2c', 'registered', 'ss', NULL),
	('5a300d87-adaa-49f7-985c-bb22c508e8dc', '73e56ef2-05fe-47f0-b948-f6def9dd6832', 'aria.moonstone@school.com', NULL, '{"members": ["1"]}', '2025-12-03 06:51:00.934836+00', 'educator', '8b25ae13-d1ad-48bc-873a-8a269328afb8', NULL, 'registered', 'ss', NULL),
	('dc688f59-5a8f-44a0-b895-ae6b663359aa', '3b086505-62bb-4263-ba6a-6f0e7b104113', 'aria.moonstone@school.com', NULL, '{"members": ["1"]}', '2025-12-03 06:51:26.407226+00', 'educator', '8b25ae13-d1ad-48bc-873a-8a269328afb8', NULL, 'registered', '22', NULL),
	('36177341-b89f-40f6-a0db-544ba512fc4b', 'e51df31b-ea55-4ba9-bebb-3993175178fc', 'aria.moonstone@school.com', NULL, '{"members": ["Aria S"]}', '2025-12-09 06:22:38.27585+00', 'educator', '8b25ae13-d1ad-48bc-873a-8a269328afb8', NULL, 'registered', '', NULL),
	('0e2045f7-d7f2-443e-bad4-5622570aa0ac', 'c6d561ad-8e66-48bb-8acc-b519d8f640ef', 'stu512@school.edu', NULL, '{"members": ["1"]}', '2026-01-01 08:16:27.046309+00', 'educator', '61c92620-37f5-4be1-9537-d377c95aff31', NULL, 'registered', 'gh', NULL),
	('e57fdf4b-f751-42c5-aa43-c708990593d3', '5a0f5948-a4bf-45cb-b994-5f30c9c71b1b', 'arjun.reddy@school.com', NULL, '{"members": ["1"]}', '2026-01-01 09:39:31.090959+00', 'educator', '61c92620-37f5-4be1-9537-d377c95aff31', NULL, 'registered', 'erf', NULL),
	('dec4421d-1b9d-4dd0-a0b9-f8f84fa106ab', 'c6d561ad-8e66-48bb-8acc-b519d8f640ef', 'stu505@school.edu', NULL, NULL, '2026-01-01 10:05:49.553075+00', 'educator', '61c92620-37f5-4be1-9537-d377c95aff31', NULL, 'registered', '', NULL),
	('2df97d15-ee7e-46d5-a33f-b9cd5a7397c0', '5a0f5948-a4bf-45cb-b994-5f30c9c71b1b', 'pavan@gmail.com', NULL, '{"members": ["varsha"]}', '2026-01-01 16:57:00.088411+00', 'educator', '61c92620-37f5-4be1-9537-d377c95aff31', NULL, 'registered', 'Good performer in science', NULL),
	('925b8ae5-c864-43b4-8810-33fc4a8ef4e3', '5a0f5948-a4bf-45cb-b994-5f30c9c71b1b', 'varsha@gmail.com', NULL, '{"members": ["pavan"]}', '2026-01-01 16:57:00.436371+00', 'educator', '61c92620-37f5-4be1-9537-d377c95aff31', NULL, 'registered', 'Excellent in mathematics', NULL),
	('586d2a5f-d779-453b-a2c6-b2de49835949', '5a0f5948-a4bf-45cb-b994-5f30c9c71b1b', 'siva@gmail.com', NULL, '{"members": ["litikesh", "pavan"]}', '2026-01-01 16:57:00.875728+00', 'educator', '61c92620-37f5-4be1-9537-d377c95aff31', NULL, 'registered', '', NULL),
	('c67007af-5879-4eb8-a005-db8b6c809542', '3c59a2fe-7ac1-4b32-92b2-13e434736c53', 'kavana@gmail.com', NULL, '{"members": ["litikesh"]}', '2026-01-02 04:02:26.067166+00', 'educator', '61c92620-37f5-4be1-9537-d377c95aff31', NULL, 'registered', 'xcsd', NULL),
	('322545fc-ce49-44e4-a43e-428be1f86d3c', 'cfa8c55b-d04a-4daa-820e-016259a99265', 'swetha822002@gmail.com', NULL, '{"members": ["pavan"]}', '2026-01-02 07:42:20.866862+00', 'educator', '5d78d3c6-e53e-48df-887f-fd21e1e58db6', NULL, 'registered', 'Excellent in fundamentals of cloud', NULL),
	('1b514aea-919b-4c42-b077-b58b5a7f4c89', 'cfa8c55b-d04a-4daa-820e-016259a99265', 'litikesh@rareminds.in', NULL, NULL, '2026-01-02 07:43:49.384474+00', 'educator', '5d78d3c6-e53e-48df-887f-fd21e1e58db6', NULL, 'registered', '', NULL),
	('a22307b3-fbbd-4398-a03a-6bf28e4bd006', 'c6d561ad-8e66-48bb-8acc-b519d8f640ef', 'litikesh@rareminds.in', NULL, '{"members": ["varsha"]}', '2026-01-02 07:46:20.631802+00', 'educator', '5d78d3c6-e53e-48df-887f-fd21e1e58db6', NULL, 'registered', 'Good performer in Cloud', NULL),
	('6d7af447-bc66-4875-adb9-3dc56dd6016b', 'c6d561ad-8e66-48bb-8acc-b519d8f640ef', 'swetha822002@gmail.com', NULL, '{"members": ["pavan"]}', '2026-01-02 07:46:20.910417+00', 'educator', '5d78d3c6-e53e-48df-887f-fd21e1e58db6', NULL, 'registered', 'Excellent in fundamentals of cloud', NULL),
	('5c4ac013-9711-42b6-97a0-a3e2bd8c78d1', '94ef2b28-d9d0-4dda-9d77-ef802c09e1cf', 'stu517@school.edu', NULL, '{"members": ["Litikesh", "pavan"]}', '2026-01-02 08:01:10.260062+00', 'educator', '61c92620-37f5-4be1-9537-d377c95aff31', NULL, 'registered', 'Good', NULL),
	('12be698a-a5b4-4644-aaec-815460a997e3', '94ef2b28-d9d0-4dda-9d77-ef802c09e1cf', 'sravanthi@gmail.com', NULL, '{"members": ["varsha", "siva"]}', '2026-01-02 08:01:10.457093+00', 'educator', '61c92620-37f5-4be1-9537-d377c95aff31', NULL, 'registered', 'Good', NULL),
	('8f647c95-c8d3-49d7-b2a2-9b0a516a31ec', '94ef2b28-d9d0-4dda-9d77-ef802c09e1cf', 'stu516@school.edu', NULL, NULL, '2026-01-02 08:01:10.64699+00', 'educator', '61c92620-37f5-4be1-9537-d377c95aff31', NULL, 'registered', 'good', NULL),
	('ede02611-2c77-4fd0-a18e-992d39c778f1', '94ef2b28-d9d0-4dda-9d77-ef802c09e1cf', 'litikesh@rareminds.in', NULL, '{"members": ["varsha"]}', '2026-01-02 08:02:49.683915+00', 'educator', '5d78d3c6-e53e-48df-887f-fd21e1e58db6', NULL, 'registered', 'Good performer in Cloud', NULL),
	('ebee28c9-5936-4caa-af43-d6817c9b5be8', '94ef2b28-d9d0-4dda-9d77-ef802c09e1cf', 'swetha822002@gmail.com', NULL, '{"members": ["pavan"]}', '2026-01-02 08:02:49.92732+00', 'educator', '5d78d3c6-e53e-48df-887f-fd21e1e58db6', NULL, 'registered', 'Excellent in fundamentals of cloud', NULL),
	('1e907e8c-5e45-4469-97d1-a98f96e33e85', '5a0f5948-a4bf-45cb-b994-5f30c9c71b1b', 'litikesh@rareminds.in', NULL, '{"members": ["varsha"]}', '2026-01-02 09:28:43.1054+00', 'educator', '5d78d3c6-e53e-48df-887f-fd21e1e58db6', NULL, 'registered', 'Good performer in Cloud', NULL),
	('71df55a3-0f39-449c-81e8-bbc64ec72b09', '5a0f5948-a4bf-45cb-b994-5f30c9c71b1b', 'swetha822002@gmail.com', NULL, '{"members": ["pavan"]}', '2026-01-02 09:28:43.361984+00', 'educator', '5d78d3c6-e53e-48df-887f-fd21e1e58db6', NULL, 'registered', 'Excellent in fundamentals of cloud', NULL);


--

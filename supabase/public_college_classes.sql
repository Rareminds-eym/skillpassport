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
-- Data for Name: college_classes; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."college_classes" ("id", "college_id", "name", "grade", "section", "academic_year", "max_students", "current_students", "status", "room_no", "metadata", "created_at", "updated_at", "department_id") VALUES
	('420e6c8a-3830-4133-acd8-ec0bbb97f3eb', 'c16a95cf-6ee5-4aa9-8e47-84fbda49611d', 'B.Tech ME Year 2', '2nd Year', 'A', '2025-2026', 60, 0, 'active', NULL, '{}', '2026-01-08 06:07:44.256319+00', '2026-01-08 06:07:44.256319+00', '4affc7c0-52f7-40c6-924e-d90cc0d11285'),
	('f2127afa-a906-4b99-918a-7c2d3f8e96d9', 'c16a95cf-6ee5-4aa9-8e47-84fbda49611d', 'B.Tech ME Year 3', '3rd Year', 'A', '2025-2026', 60, 0, 'active', NULL, '{}', '2026-01-08 06:07:44.256319+00', '2026-01-08 06:07:44.256319+00', '4affc7c0-52f7-40c6-924e-d90cc0d11285'),
	('de32a194-f16c-4e15-aaa4-e29b66991c60', 'c16a95cf-6ee5-4aa9-8e47-84fbda49611d', 'B.Tech ME Year 4', '4th Year', 'A', '2025-2026', 60, 0, 'active', NULL, '{}', '2026-01-08 06:07:44.256319+00', '2026-01-08 06:07:44.256319+00', '4affc7c0-52f7-40c6-924e-d90cc0d11285'),
	('ce94606a-f760-4f12-85ca-2fb04f5d677a', 'c16a95cf-6ee5-4aa9-8e47-84fbda49611d', 'B.Tech CSE Year 1', '1st Year', 'A', '2025-2026', 60, 0, 'active', NULL, '{}', '2026-01-05 11:36:51.251491+00', '2026-01-05 11:36:51.251491+00', 'a987bd28-dcd0-478d-af06-42a0d0128da7'),
	('c42d7078-aaf8-49f2-bd08-02ddcabf2105', 'c16a95cf-6ee5-4aa9-8e47-84fbda49611d', 'B.Tech CSE Year 1', '1st Year', 'B', '2025-2026', 60, 0, 'active', NULL, '{}', '2026-01-05 11:36:51.251491+00', '2026-01-05 11:36:51.251491+00', 'a987bd28-dcd0-478d-af06-42a0d0128da7'),
	('d4aa44d6-e969-44a3-8327-500fae11681a', 'c16a95cf-6ee5-4aa9-8e47-84fbda49611d', 'B.Tech CSE Year 2', '2nd Year', 'A', '2025-2026', 60, 0, 'active', NULL, '{}', '2026-01-05 11:36:51.251491+00', '2026-01-05 11:36:51.251491+00', 'a987bd28-dcd0-478d-af06-42a0d0128da7'),
	('81641be7-39f7-4c0d-8ae7-3225fcb36d36', 'c16a95cf-6ee5-4aa9-8e47-84fbda49611d', 'B.Tech CSE Year 2', '2nd Year', 'B', '2025-2026', 60, 0, 'active', NULL, '{}', '2026-01-05 11:36:51.251491+00', '2026-01-05 11:36:51.251491+00', 'a987bd28-dcd0-478d-af06-42a0d0128da7'),
	('90823e3c-21a3-4a05-83ff-66daaa147c86', 'c16a95cf-6ee5-4aa9-8e47-84fbda49611d', 'B.Tech Cse 4th', '4th year', 'A', '2025-2026', 1, 3, 'active', NULL, '{"status": "Active", "educator": "Susmitha M", "educatorId": "0f4b36d3-bebe-456f-8e11-b89a4fe2a723", "skillAreas": [], "educatorEmail": "susmitha@gmail.com"}', '2026-01-07 10:57:04.114006+00', '2026-01-07 11:10:34.289+00', 'a987bd28-dcd0-478d-af06-42a0d0128da7'),
	('298c9227-8aa1-4ff0-b162-41b9b03765a0', 'c16a95cf-6ee5-4aa9-8e47-84fbda49611d', 'B.Tech ECE Year 1', '1st Year', 'A', '2025-2026', 60, 0, 'active', NULL, '{}', '2026-01-05 11:36:51.251491+00', '2026-01-05 11:36:51.251491+00', '5a2cf269-4f14-423c-85b6-10396c3c0177'),
	('502cd692-0e35-46ed-a73b-709252799ac5', 'c16a95cf-6ee5-4aa9-8e47-84fbda49611d', 'B.Tech ECE Year 2', '2nd Year', 'A', '2025-2026', 60, 0, 'active', NULL, '{}', '2026-01-05 11:36:51.251491+00', '2026-01-05 11:36:51.251491+00', '5a2cf269-4f14-423c-85b6-10396c3c0177'),
	('eafcb5be-e485-48bc-a7af-ee2113590d28', 'c16a95cf-6ee5-4aa9-8e47-84fbda49611d', 'B.tech ece', '3rd year', 'A', '2025-2026', 60, 0, 'active', NULL, '{"status": "Active", "educator": "Susmitha M", "educatorId": "0f4b36d3-bebe-456f-8e11-b89a4fe2a723", "skillAreas": [], "educatorEmail": "susmitha@gmail.com"}', '2026-01-07 11:11:24.773496+00', '2026-01-07 11:11:24.773496+00', '5a2cf269-4f14-423c-85b6-10396c3c0177'),
	('0d46851d-20b9-4d18-b95a-a5f0a3c4d90b', 'c16a95cf-6ee5-4aa9-8e47-84fbda49611d', 'B.Tech ME Year 1', '1st Year', 'A', '2025-2026', 60, 0, 'active', NULL, '{}', '2026-01-05 11:36:51.251491+00', '2026-01-05 11:36:51.251491+00', '4affc7c0-52f7-40c6-924e-d90cc0d11285'),
	('d0a31833-da1f-4423-b47b-f54c9d0fa4ca', 'c16a95cf-6ee5-4aa9-8e47-84fbda49611d', 'MBA Year 1', '1st Year', 'A', '2025-2026', 60, 0, 'active', NULL, '{}', '2026-01-05 11:36:51.251491+00', '2026-01-05 11:36:51.251491+00', '4adc893c-252b-4dde-8c6c-fee832b1922c'),
	('56081e3a-56da-40e5-ac18-6cb3530bcafd', 'c16a95cf-6ee5-4aa9-8e47-84fbda49611d', 'MBA Year 2', '2nd Year', 'A', '2025-2026', 60, 0, 'active', NULL, '{}', '2026-01-05 11:36:51.251491+00', '2026-01-05 11:36:51.251491+00', '4adc893c-252b-4dde-8c6c-fee832b1922c');


--

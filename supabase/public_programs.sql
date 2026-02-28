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
-- Data for Name: programs; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."programs" ("id", "department_id", "name", "code", "description", "degree_level", "status", "created_at", "updated_at", "metadata", "created_by", "updated_by") VALUES
	('1b729bdb-3004-4ff4-a446-7fb6c52d7e72', 'a987bd28-dcd0-478d-af06-42a0d0128da7', 'Bachelor of Technology in Computer Science', 'B.Tech CSE', 'Four-year undergraduate program in Computer Science and Engineering', 'Undergraduate', 'active', '2025-12-12 09:45:54.536469+00', '2025-12-12 09:45:54.536469+00', NULL, NULL, NULL),
	('8c87b29f-004e-4a7c-96d4-4b37c1325a56', 'a987bd28-dcd0-478d-af06-42a0d0128da7', 'Master of Technology in Computer Science', 'M.Tech CSE', 'Two-year postgraduate program in Computer Science', 'Postgraduate', 'active', '2025-12-12 09:45:54.536469+00', '2025-12-12 09:45:54.536469+00', NULL, NULL, NULL),
	('0bd93653-6c80-4f3b-af23-0bee9ff67adb', '5a2cf269-4f14-423c-85b6-10396c3c0177', 'Bachelor of Technology in Electronics', 'B.Tech ECE', 'Four-year undergraduate program in Electronics and Communication', 'Undergraduate', 'active', '2025-12-12 09:45:54.536469+00', '2025-12-12 09:45:54.536469+00', NULL, NULL, NULL),
	('f292fa81-ebe8-418f-aa24-bf70a6f218ca', '4affc7c0-52f7-40c6-924e-d90cc0d11285', 'Bachelor of Technology in Mechanical', 'B.Tech ME', 'Four-year undergraduate program in Mechanical Engineering', 'Undergraduate', 'active', '2025-12-12 09:45:54.536469+00', '2025-12-12 09:45:54.536469+00', NULL, NULL, NULL),
	('95e078f6-22a6-46b9-9867-00931ddb7fc0', '4affc7c0-52f7-40c6-924e-d90cc0d11285', 'M.Sc Data Science', 'MSC', '', 'Postgraduate', 'active', '2026-01-09 08:34:11.151378+00', '2026-01-09 08:34:11.151378+00', NULL, '91bf6be4-31a5-4d6a-853d-675596755cee', NULL);


--

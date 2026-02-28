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
-- Data for Name: university_colleges; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."university_colleges" ("id", "university_id", "name", "code", "dean_name", "dean_email", "dean_phone", "established_year", "account_status", "created_at", "updated_at", "metadata", "created_by", "college_id") VALUES
	('9c925ed6-84a4-41aa-9f45-eaa9c51ed851', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'test clg', 'TESTCL', 'testing', 'dgdfdg@gmail.rdf', NULL, NULL, 'active', '2026-01-12 09:42:18.471626+00', '2026-01-12 09:50:39.127664+00', '{"city": "df", "state": "dgbd", "address": "fgbdg", "website": null, "description": null, "original_org_id": "1b363f37-034d-475d-85d6-d3646c578ea1"}', '0595e71f-9ce7-4118-9b00-ecb28cdc4c4c', '1b363f37-034d-475d-85d6-d3646c578ea1'),
	('c16a95cf-6ee5-4aa9-8e47-84fbda49611d', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Aditya College', 'AD-232', 'Aditya', 'aditya@college.edu', '7899044489', 2000, 'active', '2025-12-05 06:47:40.093886+00', '2026-01-12 09:50:49.830156+00', '{}', '91bf6be4-31a5-4d6a-853d-675596755cee', 'c16a95cf-6ee5-4aa9-8e47-84fbda49611d');


--

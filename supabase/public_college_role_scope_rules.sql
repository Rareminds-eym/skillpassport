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
-- Data for Name: college_role_scope_rules; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."college_role_scope_rules" ("id", "role_type", "scope_type", "scope_value", "created_at", "updated_at") VALUES
	('bb4cf2ea-7402-40b5-b045-51233d17aa26', 'college_educator', 'department', 'a987bd28-dcd0-478d-af06-42a0d0128da7', '2026-01-12 09:51:02.968945', '2026-01-12 09:51:02.968945'),
	('f8fd81d3-c55d-4ba5-9180-c6c9b9324790', 'college_educator', 'program', '1b729bdb-3004-4ff4-a446-7fb6c52d7e72', '2026-01-12 09:51:02.968945', '2026-01-12 09:51:02.968945');


--

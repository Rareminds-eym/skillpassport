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
-- Data for Name: college_faculty_leaves; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."college_faculty_leaves" ("id", "college_id", "faculty_id", "leave_type_id", "start_date", "end_date", "total_days", "reason", "status", "applied_at", "reviewed_by", "reviewed_at", "review_notes", "created_at", "updated_at") VALUES
	('ed77a86a-18da-4030-9840-eb29b5d393e3', 'c16a95cf-6ee5-4aa9-8e47-84fbda49611d', '51da223b-c1ec-40f6-b0df-eb9c9d0f7378', 'a37f80da-299f-4d74-93c2-2b0dfe61fe2b', '2026-01-07', '2026-01-07', 1.0, '', 'approved', '2026-01-06 10:44:52.961758+00', NULL, '2026-01-06 10:45:01.736+00', NULL, '2026-01-06 10:44:52.961758+00', '2026-01-06 10:44:52.961758+00'),
	('1fa264fc-050a-455e-adf4-9690fdea555f', 'c16a95cf-6ee5-4aa9-8e47-84fbda49611d', '0f4b36d3-bebe-456f-8e11-b89a4fe2a723', '036e7a12-c16b-4f31-a7f2-6ba620a97cf0', '2026-01-09', '2026-01-09', 1.0, '', 'approved', '2026-01-08 06:41:35.880649+00', NULL, '2026-01-08 06:41:41.262+00', NULL, '2026-01-08 06:41:35.880649+00', '2026-01-08 06:41:35.880649+00');


--

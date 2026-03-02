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
-- Data for Name: college_breaks; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."college_breaks" ("id", "college_id", "timetable_id", "break_type", "name", "description", "start_time", "end_time", "start_date", "end_date", "applies_to_all", "class_ids", "is_recurring", "recurring_days", "created_at", "updated_at") VALUES
	('858705cf-01fb-4826-9aa2-7608e9ee0037', 'c16a95cf-6ee5-4aa9-8e47-84fbda49611d', 'aac9be12-0c23-4560-a3d7-b7fd2bffdf34', 'holiday', 'Diwali', NULL, NULL, NULL, '2026-01-10', '2026-01-10', true, NULL, false, NULL, '2026-01-08 05:12:45.426492+00', '2026-01-08 05:12:45.426492+00');


--

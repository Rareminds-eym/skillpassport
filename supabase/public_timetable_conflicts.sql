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
-- Data for Name: timetable_conflicts; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."timetable_conflicts" ("id", "timetable_id", "conflict_type", "educator_id", "slot_id", "conflict_details", "resolved", "resolved_at", "created_at") VALUES
	('65198c5c-663a-40a8-a33c-30cb08bc5cae', '7158ec92-99c1-415c-a043-b2ba1f552248', 'consecutive_classes_exceeded', '5d78d3c6-e53e-48df-887f-fd21e1e58db6', NULL, '{"limit": 3, "max_consecutive": 5}', false, NULL, '2025-12-22 08:02:38.831726');


--

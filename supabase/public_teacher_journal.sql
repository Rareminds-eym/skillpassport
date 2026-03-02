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
-- Data for Name: teacher_journal; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."teacher_journal" ("id", "educator_id", "lesson_plan_id", "date", "reflection", "student_engagement", "objectives_met", "challenges", "improvements", "created_at", "updated_at") VALUES
	('e3a42c50-87cc-4d01-8e67-671759c75412', '61c92620-37f5-4be1-9537-d377c95aff31', '6c28a565-fb35-4564-ae50-938888e5b2c0', '2025-12-10', NULL, NULL, false, NULL, NULL, '2025-12-04 09:27:18.098384', '2025-12-04 09:27:18.098384'),
	('996eaaf5-f4a4-4a45-9eb0-b343163c6202', '61c92620-37f5-4be1-9537-d377c95aff31', 'bc4071fa-3977-4e4d-b5a0-7c253d06f681', '2025-12-23', NULL, NULL, false, NULL, NULL, '2025-12-22 08:05:38.755472', '2025-12-22 08:05:38.755472'),
	('e9a7d9d0-2c65-4d1a-a12b-8202b65ffeb5', '61c92620-37f5-4be1-9537-d377c95aff31', 'a7edacab-b937-4df7-b00c-237774c2c33a', '2026-01-01', NULL, NULL, false, NULL, NULL, '2026-01-05 09:37:01.513211', '2026-01-05 09:37:01.513211');


--

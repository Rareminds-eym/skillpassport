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
-- Data for Name: college_mentor_periods; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."college_mentor_periods" ("id", "college_id", "name", "academic_year", "start_date", "end_date", "default_mentor_capacity", "default_office_location", "default_available_hours", "is_active", "created_at", "created_by") VALUES
	('befc0605-38ad-4277-90c6-07ca2e856fcd', 'c16a95cf-6ee5-4aa9-8e47-84fbda49611d', 'Mentoring Period 2026-2026 (1/14/2026 to 7/13/2026)', '2026-2027', '2026-01-14', '2026-07-13', 15, 'Faculty Building - Room 201', 'Monday-Friday: 2:00 PM - 4:00 PM', true, '2026-01-14 10:22:33.468386+00', '51da223b-c1ec-40f6-b0df-eb9c9d0f7378'),
	('909a7a7d-7092-44b6-95bb-58f9f3d05ee1', 'c16a95cf-6ee5-4aa9-8e47-84fbda49611d', 'Mentoring Period 2026-2027 (8/14/2026 to 4/13/2027)', '2026-2027', '2026-08-14', '2027-04-13', 15, 'Academic Block - Room 305', 'Tuesday-Thursday: 10:00 AM - 12:00 PM', true, '2026-01-14 10:23:44.954709+00', '51da223b-c1ec-40f6-b0df-eb9c9d0f7378'),
	('0845292a-70b2-4cbe-923b-31f7b063605a', 'c16a95cf-6ee5-4aa9-8e47-84fbda49611d', 'Mentoring Period 2028-2028 (1/16/2028 to 7/15/2028)', '2026-2027', '2028-01-16', '2028-07-15', 15, 'Administration Block - Room 301', 'Monday-Friday: 9:00 AM - 11:00 AM', false, '2026-01-16 17:58:00.423146+00', '51da223b-c1ec-40f6-b0df-eb9c9d0f7378'),
	('b8137fd9-b43b-4943-8803-612e4da3cb80', 'c16a95cf-6ee5-4aa9-8e47-84fbda49611d', 'Mentoring Period 2027-2027 (4/16/2027 to 7/15/2027)', '2026-2027', '2027-04-16', '2027-07-15', 15, 'Library Building - Room 204', 'Wednesday-Friday: 1:00 PM - 3:00 PM', false, '2026-01-16 17:52:33.032927+00', '51da223b-c1ec-40f6-b0df-eb9c9d0f7378'),
	('74762f3e-b219-4b1f-bcbc-400f637b0790', 'c16a95cf-6ee5-4aa9-8e47-84fbda49611d', 'Mentoring Period 2027-2027 (1/1/2027 to 3/31/2027)', '2026-2027', '2027-01-01', '2027-03-31', 15, 'Student Center - Room 102', 'Monday-Wednesday: 3:00 PM - 5:00 PM', false, '2026-01-16 17:31:58.6485+00', '51da223b-c1ec-40f6-b0df-eb9c9d0f7378');


--

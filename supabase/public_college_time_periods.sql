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
-- Data for Name: college_time_periods; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."college_time_periods" ("id", "college_id", "timetable_id", "period_number", "period_name", "start_time", "end_time", "is_break", "break_type", "sort_order", "created_at") VALUES
	('ed920854-9299-409a-98c5-8f3906938a57', 'c16a95cf-6ee5-4aa9-8e47-84fbda49611d', 'aac9be12-0c23-4560-a3d7-b7fd2bffdf34', 1, 'Period 1', '09:00:00', '09:50:00', false, NULL, NULL, '2026-01-07 07:20:31.12242+00'),
	('a74b2649-b030-4568-b30c-7b926a210d19', 'c16a95cf-6ee5-4aa9-8e47-84fbda49611d', 'aac9be12-0c23-4560-a3d7-b7fd2bffdf34', 2, 'Period 2', '09:50:00', '10:40:00', false, NULL, NULL, '2026-01-07 07:20:31.12242+00'),
	('2126c4d3-64d3-4f2a-acfa-43d8be48a62d', 'c16a95cf-6ee5-4aa9-8e47-84fbda49611d', 'aac9be12-0c23-4560-a3d7-b7fd2bffdf34', 3, 'Short Break', '10:40:00', '10:55:00', false, NULL, NULL, '2026-01-07 07:20:31.12242+00'),
	('1d5bf2c8-5e6e-4c2b-bb79-8dbf5ad8e8f7', 'c16a95cf-6ee5-4aa9-8e47-84fbda49611d', 'aac9be12-0c23-4560-a3d7-b7fd2bffdf34', 4, 'Period 3', '10:55:00', '11:45:00', false, NULL, NULL, '2026-01-07 07:20:31.12242+00'),
	('83c634b9-5fcb-4dc6-ab32-27f6b2d4a85f', 'c16a95cf-6ee5-4aa9-8e47-84fbda49611d', 'aac9be12-0c23-4560-a3d7-b7fd2bffdf34', 5, 'Period 4', '11:45:00', '12:35:00', false, NULL, NULL, '2026-01-07 07:20:31.12242+00'),
	('0d60d5fc-2543-4ee4-8e95-fa94e5a0c5b5', 'c16a95cf-6ee5-4aa9-8e47-84fbda49611d', 'aac9be12-0c23-4560-a3d7-b7fd2bffdf34', 6, 'Lunch Break', '12:35:00', '13:20:00', true, 'lunch', NULL, '2026-01-07 07:20:31.12242+00'),
	('5db332df-983f-42de-81f2-72941d7b389d', 'c16a95cf-6ee5-4aa9-8e47-84fbda49611d', 'aac9be12-0c23-4560-a3d7-b7fd2bffdf34', 7, 'Period 5', '13:20:00', '14:10:00', false, NULL, NULL, '2026-01-07 07:20:31.12242+00'),
	('1e4e679a-060f-473e-a66a-f783596cb61d', 'c16a95cf-6ee5-4aa9-8e47-84fbda49611d', 'aac9be12-0c23-4560-a3d7-b7fd2bffdf34', 8, 'Period 6', '14:10:00', '15:00:00', false, NULL, NULL, '2026-01-07 07:20:31.12242+00'),
	('7e2f20e4-73b3-40f0-889d-bf5359e039ae', 'c16a95cf-6ee5-4aa9-8e47-84fbda49611d', 'aac9be12-0c23-4560-a3d7-b7fd2bffdf34', 9, 'Period 7', '15:00:00', '15:50:00', false, NULL, NULL, '2026-01-07 07:20:31.12242+00'),
	('b3c31dc4-d7e4-451b-8097-25774e193adf', 'c16a95cf-6ee5-4aa9-8e47-84fbda49611d', 'aac9be12-0c23-4560-a3d7-b7fd2bffdf34', 10, 'Period 8', '15:50:00', '16:40:00', false, NULL, NULL, '2026-01-07 07:20:31.12242+00');


--

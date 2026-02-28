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
-- Data for Name: pipeline_candidates_backup_migration; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."pipeline_candidates_backup_migration" ("id", "student_id", "candidate_name", "candidate_email", "candidate_phone", "stage", "previous_stage", "stage_changed_at", "stage_changed_by", "status", "rejection_reason", "rejection_date", "next_action", "next_action_date", "next_action_notes", "recruiter_rating", "recruiter_notes", "assigned_to", "source", "added_by", "added_at", "created_at", "updated_at", "opportunity_id", "requisition_id") VALUES
	(17, 'c5d30a55-8d9a-46e6-b8d0-6accc0415c1c', 'Litikesh', 'litikesh@rareminds.in', '+91 98765 43210', 'sourced', NULL, '2025-12-04 03:46:50.678+00', NULL, 'active', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'direct_application', NULL, '2025-12-04 03:46:50.678+00', '2025-12-04 03:46:50.483085+00', '2025-12-04 03:46:50.483085+00', 85, NULL),
	(19, 'c5d30a55-8d9a-46e6-b8d0-6accc0415c1c', 'Litikesh', 'litikesh@rareminds.in', '+91 98765 43210', 'sourced', NULL, '2025-12-07 16:41:55.045+00', NULL, 'active', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'direct_application', NULL, '2025-12-07 16:41:55.045+00', '2025-12-07 16:41:56.370599+00', '2025-12-07 16:41:56.370599+00', 99, NULL),
	(20, 'c5d30a55-8d9a-46e6-b8d0-6accc0415c1c', 'Litikesh', 'litikesh@rareminds.in', '+91 98765 43210', 'sourced', NULL, '2025-12-08 03:28:51.24+00', NULL, 'active', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'direct_application', NULL, '2025-12-08 03:28:51.24+00', '2025-12-08 03:28:52.055715+00', '2025-12-08 03:28:52.055715+00', 157, NULL),
	(23, 'c5d30a55-8d9a-46e6-b8d0-6accc0415c1c', 'Litikesh Vilvanathan', 'litikesh@rareminds.in', NULL, 'screened', NULL, '2025-12-09 06:01:12.37039+00', NULL, 'active', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'ai_recommended', '902d03ef-71c0-4781-8e09-c2ef46511cbb', '2025-12-09 06:01:12.37039+00', '2025-12-09 06:01:12.37039+00', '2025-12-09 06:01:12.37039+00', 156, NULL),
	(22, 'c5d30a55-8d9a-46e6-b8d0-6accc0415c1c', 'Litikesh', 'litikesh@rareminds.in', '+91 98765 43210', 'interview_1', 'sourced', '2025-12-09 06:04:45.233+00', '902d03ef-71c0-4781-8e09-c2ef46511cbb', 'active', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'direct_application', NULL, '2025-12-08 09:21:06.04+00', '2025-12-08 09:21:06.404916+00', '2025-12-09 06:04:45.308479+00', 160, NULL),
	(21, 'c5d30a55-8d9a-46e6-b8d0-6accc0415c1c', 'Litikesh', 'litikesh@rareminds.in', '+91 98765 43210', 'screened', 'sourced', '2025-12-09 06:04:52.876+00', '902d03ef-71c0-4781-8e09-c2ef46511cbb', 'active', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'direct_application', NULL, '2025-12-08 06:26:05.763+00', '2025-12-08 06:26:06.041562+00', '2025-12-09 06:04:52.960661+00', 155, NULL),
	(24, 'c5d30a55-8d9a-46e6-b8d0-6accc0415c1c', 'Litikesh Vilvanathan', 'litikesh@rareminds.in', NULL, 'screened', NULL, '2025-12-09 06:05:15.007192+00', NULL, 'active', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'ai_recommended', '902d03ef-71c0-4781-8e09-c2ef46511cbb', '2025-12-09 06:05:15.007192+00', '2025-12-09 06:05:15.007192+00', '2025-12-09 06:05:15.007192+00', 149, NULL),
	(25, 'c5d30a55-8d9a-46e6-b8d0-6accc0415c1c', 'Litikesh', 'litikesh@rareminds.in', '+91 98765 43210', 'sourced', NULL, '2025-12-15 10:15:25.558+00', NULL, 'active', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'direct_application', NULL, '2025-12-15 10:15:25.558+00', '2025-12-15 10:15:26.852308+00', '2025-12-15 10:15:26.852308+00', 153, NULL),
	(26, 'c5d30a55-8d9a-46e6-b8d0-6accc0415c1c', 'Litikesh', 'litikesh@rareminds.in', '+91 98765 43210', 'sourced', NULL, '2025-12-15 10:18:19.481+00', NULL, 'active', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'direct_application', NULL, '2025-12-15 10:18:19.481+00', '2025-12-15 10:18:19.556838+00', '2025-12-15 10:18:19.556838+00', 118, NULL),
	(27, 'c5d30a55-8d9a-46e6-b8d0-6accc0415c1c', 'Unknown', '', '', 'sourced', NULL, '2025-12-16 08:28:25.474+00', NULL, 'active', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'direct_application', NULL, '2025-12-16 08:28:25.474+00', '2025-12-16 08:28:25.516131+00', '2025-12-16 08:28:25.516131+00', 136, NULL),
	(44, 'bb7bd7c3-00ed-4e22-b6f5-09def4907dbf', 'Ananya Rao', 'ananya.rao@aditya.college.edu', '9876543223', 'sourced', NULL, '2026-01-17 14:21:51.668+00', NULL, 'active', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'direct_application', NULL, '2026-01-17 14:21:51.668+00', '2026-01-17 14:21:52.409025+00', '2026-01-17 14:21:52.409025+00', 192, NULL),
	(45, '2740fc7f-a0fb-44b4-be24-0d1b4edf4034', 'sandhya', 'sandhya@rareminds.in', '9876548734', 'sourced', NULL, '2026-01-22 05:28:13.019+00', NULL, 'active', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'direct_application', NULL, '2026-01-22 05:28:13.019+00', '2026-01-22 05:28:13.083656+00', '2026-01-22 05:28:13.083656+00', 193, NULL),
	(46, '2740fc7f-a0fb-44b4-be24-0d1b4edf4034', 'sandhya', 'sandhya@rareminds.in', '9876548734', 'sourced', NULL, '2026-01-22 06:39:25.046+00', NULL, 'active', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'direct_application', NULL, '2026-01-22 06:39:25.046+00', '2026-01-22 06:39:25.087915+00', '2026-01-22 06:39:25.087915+00', 195, NULL),
	(47, '2740fc7f-a0fb-44b4-be24-0d1b4edf4034', 'sandhya', 'sandhya@rareminds.in', '9876548734', 'sourced', NULL, '2026-01-22 06:40:38.674+00', NULL, 'active', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'direct_application', NULL, '2026-01-22 06:40:38.674+00', '2026-01-22 06:40:38.723978+00', '2026-01-22 06:40:38.723978+00', 181, NULL),
	(48, 'ab46b2ac-9922-4569-adc6-73eb6b645202', 'Meera Krishnan', 'stu503@school.edu', '', 'sourced', NULL, '2026-01-22 09:57:13.866+00', NULL, 'active', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'direct_application', NULL, '2026-01-22 09:57:13.866+00', '2026-01-22 09:57:13.132869+00', '2026-01-22 09:57:13.132869+00', 196, NULL),
	(49, 'ab46b2ac-9922-4569-adc6-73eb6b645202', 'Meera Krishnan', 'stu503@school.edu', '', 'sourced', NULL, '2026-01-22 09:57:15.604+00', NULL, 'active', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'direct_application', NULL, '2026-01-22 09:57:15.604+00', '2026-01-22 09:57:14.832227+00', '2026-01-22 09:57:14.832227+00', 195, NULL),
	(50, 'c5d30a55-8d9a-46e6-b8d0-6accc0415c1c', 'litikesh Vilvanathan', 'litikesh@rareminds.in', '9970882679', 'sourced', NULL, '2026-01-22 15:27:26.653+00', NULL, 'active', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'direct_application', NULL, '2026-01-22 15:27:26.653+00', '2026-01-22 15:27:27.712663+00', '2026-01-22 15:27:27.712663+00', 195, NULL),
	(51, '515ea410-1160-427a-9471-3c1ff2e6f649', 'Rohan Kulkarni', 'rohan.kulkarni.it22@gmail.com', '9023456781', 'sourced', NULL, '2026-01-22 15:58:19.728+00', NULL, 'active', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'direct_application', NULL, '2026-01-22 15:58:19.728+00', '2026-01-22 15:58:20.810964+00', '2026-01-22 15:58:20.810964+00', 196, NULL),
	(52, 'ab46b2ac-9922-4569-adc6-73eb6b645202', 'Meera Krishnan', 'stu503@school.edu', '', 'sourced', NULL, '2026-01-23 04:19:41.988+00', NULL, 'active', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'direct_application', NULL, '2026-01-23 04:19:41.988+00', '2026-01-23 04:19:42.149318+00', '2026-01-23 04:19:42.149318+00', 211, NULL);


--

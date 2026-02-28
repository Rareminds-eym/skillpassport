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
-- Data for Name: license_pools; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."license_pools" ("id", "organization_subscription_id", "organization_id", "organization_type", "pool_name", "member_type", "allocated_seats", "assigned_seats", "auto_assign_new_members", "assignment_criteria", "is_active", "created_at", "updated_at", "created_by") VALUES
	('8827ecab-37ed-4419-ba9e-b352ce3fc970', 'fb7f88f8-09f3-40bb-8c1c-1ae356c323fe', '83945f29-e517-4f12-9704-b94fccc3ab42', 'school', 'dfdgbd', 'student', 10, 1, false, '{}', true, '2026-01-16 10:00:17.209588+00', '2026-01-16 10:28:37.154419+00', '6e4789bf-92f6-4084-af88-91d4b20cf1db'),
	('2493883f-73f5-4526-8494-c68c11ae5755', 'fef6402d-a68c-4602-a667-6de372a1b229', '83945f29-e517-4f12-9704-b94fccc3ab42', 'school', 'test pool', 'student', 6, 1, false, '{}', true, '2026-01-16 07:13:29.514642+00', '2026-01-17 04:35:49.56818+00', '6e4789bf-92f6-4084-af88-91d4b20cf1db');


--

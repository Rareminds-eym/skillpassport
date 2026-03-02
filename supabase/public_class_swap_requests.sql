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
-- Data for Name: class_swap_requests; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."class_swap_requests" ("id", "requester_faculty_id", "requester_slot_id", "target_faculty_id", "target_slot_id", "reason", "request_type", "swap_date", "status", "target_response", "target_responded_at", "requires_admin_approval", "admin_approval_status", "admin_id", "admin_response", "admin_responded_at", "created_at", "updated_at", "completed_at") VALUES
	('1a322497-6c0d-4325-8589-e8becf9d5c6a', '0f4b36d3-bebe-456f-8e11-b89a4fe2a723', '6663a2d5-f845-418e-8bb9-a346f8572d06', '51945926-9aa6-4f88-bb23-65ea5944b08c', '3517728d-5809-4c80-92ca-b14ac98f75a5', 'Swap', 'one_time', '2026-01-08', 'cancelled', NULL, NULL, true, NULL, NULL, NULL, NULL, '2026-01-08 08:30:28.772127+00', '2026-01-08 08:36:04.208608+00', NULL),
	('0aa15048-f3a6-415f-b8d2-609749e758fe', '0f4b36d3-bebe-456f-8e11-b89a4fe2a723', '617b5030-8ec1-4179-99cf-e7e452b856bc', '51945926-9aa6-4f88-bb23-65ea5944b08c', '006666cd-e308-4f6d-b4c9-2e5e8bfc8a80', 'asdasd', 'one_time', '2026-01-09', 'pending', NULL, NULL, true, NULL, NULL, NULL, NULL, '2026-01-08 08:36:26.041969+00', '2026-01-08 08:36:26.041969+00', NULL),
	('18317121-1b3c-4f44-be51-d134c3b223d4', '0f4b36d3-bebe-456f-8e11-b89a4fe2a723', '5ee0de10-39da-4514-83ce-3934453e6719', 'e66fb47c-0bb3-4ae3-862a-d44efb60622f', 'a791df00-fbb7-47ca-8abc-7264c4ae9d29', 'i was taking sick leave', 'one_time', '2026-01-14', 'pending', NULL, NULL, true, NULL, NULL, NULL, NULL, '2026-01-12 08:01:23.389072+00', '2026-01-12 08:01:23.389072+00', NULL),
	('04b20220-bf89-465e-9dee-a55f75547059', '0f4b36d3-bebe-456f-8e11-b89a4fe2a723', '617b5030-8ec1-4179-99cf-e7e452b856bc', 'e66fb47c-0bb3-4ae3-862a-d44efb60622f', 'a791df00-fbb7-47ca-8abc-7264c4ae9d29', 'fghj', 'one_time', '2026-01-15', 'pending', NULL, NULL, true, NULL, NULL, NULL, NULL, '2026-01-12 08:02:46.246799+00', '2026-01-12 08:02:46.246799+00', NULL),
	('6005ef18-d5e5-4a41-9b87-96fd682b3512', '0f4b36d3-bebe-456f-8e11-b89a4fe2a723', '5ee0de10-39da-4514-83ce-3934453e6719', 'e66fb47c-0bb3-4ae3-862a-d44efb60622f', 'a791df00-fbb7-47ca-8abc-7264c4ae9d29', 'health issue', 'one_time', '2026-01-14', 'pending', NULL, NULL, true, NULL, NULL, NULL, NULL, '2026-01-12 08:44:21.750118+00', '2026-01-12 08:44:21.750118+00', NULL);


--

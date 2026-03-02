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
-- Data for Name: license_assignments; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."license_assignments" ("id", "license_pool_id", "organization_subscription_id", "user_id", "member_type", "status", "assigned_at", "assigned_by", "expires_at", "revoked_at", "revoked_by", "revocation_reason", "transferred_from", "transferred_to", "created_at", "updated_at") VALUES
	('9adb3145-c25c-42ef-b165-8e627e2c1166', '2493883f-73f5-4526-8494-c68c11ae5755', 'fef6402d-a68c-4602-a667-6de372a1b229', '10a58575-10bc-494d-8adb-f2131b4338bf', 'student', 'revoked', '2026-01-16 07:33:16.573789+00', '6e4789bf-92f6-4084-af88-91d4b20cf1db', NULL, '2026-01-16 07:33:24.642+00', '6e4789bf-92f6-4084-af88-91d4b20cf1db', 'Unassigned by admin', NULL, NULL, '2026-01-16 07:33:16.573789+00', '2026-01-16 07:33:24.794139+00'),
	('8f05f851-6bae-42ae-814a-29e2cb1c154e', '2493883f-73f5-4526-8494-c68c11ae5755', 'fef6402d-a68c-4602-a667-6de372a1b229', '10a58575-10bc-494d-8adb-f2131b4338bf', 'student', 'revoked', '2026-01-16 07:33:30.632656+00', '6e4789bf-92f6-4084-af88-91d4b20cf1db', NULL, '2026-01-16 10:28:22.288+00', '6e4789bf-92f6-4084-af88-91d4b20cf1db', 'Unassigned by admin', NULL, NULL, '2026-01-16 07:33:30.632656+00', '2026-01-16 10:28:22.501585+00'),
	('34e567a3-9bb9-4bb3-823d-00a6296f8702', '8827ecab-37ed-4419-ba9e-b352ce3fc970', 'fb7f88f8-09f3-40bb-8c1c-1ae356c323fe', '10a58575-10bc-494d-8adb-f2131b4338bf', 'student', 'active', '2026-01-16 10:28:37.154419+00', '6e4789bf-92f6-4084-af88-91d4b20cf1db', NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-16 10:28:37.154419+00', '2026-01-16 10:28:37.154419+00'),
	('dc3274a6-f12f-48c5-8b98-7b81aba2e14d', '2493883f-73f5-4526-8494-c68c11ae5755', 'fef6402d-a68c-4602-a667-6de372a1b229', 'bc0f476c-679d-4ae0-9b06-8d8999021a95', 'student', 'revoked', '2026-01-16 10:56:41.281639+00', '6e4789bf-92f6-4084-af88-91d4b20cf1db', NULL, '2026-01-16 11:41:54.127+00', '6e4789bf-92f6-4084-af88-91d4b20cf1db', 'Unassigned by admin', NULL, NULL, '2026-01-16 10:56:41.281639+00', '2026-01-16 11:41:55.515616+00'),
	('6cdfb07c-6cbf-45db-9f47-2437eefc40aa', '2493883f-73f5-4526-8494-c68c11ae5755', 'fef6402d-a68c-4602-a667-6de372a1b229', '95364f0d-23fb-4616-b0f4-48caafee5439', 'student', 'revoked', '2026-01-16 10:00:57.14454+00', '6e4789bf-92f6-4084-af88-91d4b20cf1db', NULL, '2026-01-16 12:28:06.68+00', '6e4789bf-92f6-4084-af88-91d4b20cf1db', 'Unassigned by admin', NULL, NULL, '2026-01-16 10:00:57.14454+00', '2026-01-16 12:28:06.787838+00'),
	('fe43f371-befd-4033-aab7-31dc74ee3058', '2493883f-73f5-4526-8494-c68c11ae5755', 'fef6402d-a68c-4602-a667-6de372a1b229', 'c1ad297d-9718-408f-9683-7ec1de506f85', 'student', 'revoked', '2026-01-17 04:33:45.085932+00', '6e4789bf-92f6-4084-af88-91d4b20cf1db', NULL, '2026-01-17 04:35:33.472+00', '6e4789bf-92f6-4084-af88-91d4b20cf1db', 'Unassigned by admin', NULL, NULL, '2026-01-17 04:33:45.085932+00', '2026-01-17 04:35:33.614236+00'),
	('0e70d628-7118-4bd0-b851-b4316d00bc5e', '2493883f-73f5-4526-8494-c68c11ae5755', 'fef6402d-a68c-4602-a667-6de372a1b229', 'c1ad297d-9718-408f-9683-7ec1de506f85', 'student', 'active', '2026-01-17 04:35:49.56818+00', '6e4789bf-92f6-4084-af88-91d4b20cf1db', NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-17 04:35:49.56818+00', '2026-01-17 04:35:49.56818+00');


--

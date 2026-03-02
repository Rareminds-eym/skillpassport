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
-- Data for Name: applied_jobs; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."applied_jobs" ("id_old", "student_id", "opportunity_id_old", "application_status", "applied_at", "viewed_at", "responded_at", "interview_scheduled_at", "notes", "created_at", "updated_at", "id", "opportunity_id") VALUES
	(NULL, 'c802ab39-21ed-4d6c-9f8f-869b442b0939', NULL, 'interviewed', '2026-01-23 07:25:35.216858+00', NULL, NULL, '2026-01-23 07:44:35.915+00', NULL, '2026-01-23 07:25:35.216858+00', '2026-01-23 07:54:35.062131+00', 'b559eefb-c482-43d5-bd64-f290dfa4f52b', '0993cdbb-b300-4bb7-ac89-fe51a14426c8'),
	(NULL, 'ab46b2ac-9922-4569-adc6-73eb6b645202', NULL, 'applied', '2026-01-23 09:41:08.86338+00', NULL, NULL, NULL, NULL, '2026-01-23 09:41:08.86338+00', '2026-01-23 09:41:08.86338+00', '2cb657a8-dc48-4085-80c7-a18dbb74780f', '0993cdbb-b300-4bb7-ac89-fe51a14426c8'),
	(NULL, 'ab46b2ac-9922-4569-adc6-73eb6b645202', NULL, 'applied', '2026-01-23 09:41:11.909965+00', NULL, NULL, NULL, NULL, '2026-01-23 09:41:11.909965+00', '2026-01-23 09:41:11.909965+00', '9b39ea0a-93af-4d85-88ca-219ed88cb3d8', '9bc0fdff-789c-4d0a-a808-494ae9706d34'),
	(NULL, '3531e63e-589e-46e7-9248-4a769e84b00d', NULL, 'applied', '2026-01-27 07:24:01.530714+00', NULL, NULL, NULL, NULL, '2026-01-27 07:24:01.530714+00', '2026-01-27 07:24:01.530714+00', '30842602-9db0-4ac1-b4f7-755031d5fa8b', '7542b2ee-c47a-45e3-a000-d403c15474c7'),
	(NULL, '3531e63e-589e-46e7-9248-4a769e84b00d', NULL, 'applied', '2026-01-27 07:25:04.939586+00', NULL, NULL, NULL, NULL, '2026-01-27 07:25:04.939586+00', '2026-01-27 07:25:04.939586+00', '7fbd412e-eba7-4b3b-907e-6401c6d3e7f2', '9bc0fdff-789c-4d0a-a808-494ae9706d34'),
	(NULL, 'c5d30a55-8d9a-46e6-b8d0-6accc0415c1c', NULL, 'applied', '2026-01-27 10:37:01.639268+00', NULL, NULL, NULL, NULL, '2026-01-27 10:37:01.639268+00', '2026-01-27 10:37:01.639268+00', '4ca72635-dc5e-41bd-aee0-338e93d75efa', '9bc0fdff-789c-4d0a-a808-494ae9706d34'),
	(NULL, 'c5d30a55-8d9a-46e6-b8d0-6accc0415c1c', NULL, 'applied', '2026-01-28 05:43:41.557361+00', NULL, NULL, NULL, NULL, '2026-01-28 05:43:41.557361+00', '2026-01-28 05:43:41.557361+00', '30bddeaa-8726-4472-9bdd-e95b18a403e4', '7542b2ee-c47a-45e3-a000-d403c15474c7'),
	(NULL, '3531e63e-589e-46e7-9248-4a769e84b00d', NULL, 'under_review', '2026-01-29 09:20:40.615511+00', NULL, NULL, NULL, NULL, '2026-01-29 09:20:40.615511+00', '2026-01-30 09:15:18.006279+00', 'bd2c8a67-a7eb-4903-8b4d-8355e3f9b432', 'b8e37c41-5892-48f0-bf0b-904a21896401'),
	(NULL, 'c5d30a55-8d9a-46e6-b8d0-6accc0415c1c', NULL, 'interview_scheduled', '2026-01-29 10:48:07.013083+00', NULL, NULL, '2026-01-30 09:39:09.054+00', NULL, '2026-01-29 10:48:07.013083+00', '2026-01-30 09:39:09.024665+00', 'e7295b02-0b94-4184-85e0-112d4239b603', '816c1f63-1a5c-40ef-b057-3a012c137d12'),
	(NULL, 'ab46b2ac-9922-4569-adc6-73eb6b645202', NULL, 'applied', '2026-01-31 04:36:36.750946+00', NULL, NULL, NULL, NULL, '2026-01-31 04:36:36.750946+00', '2026-01-31 04:36:36.750946+00', '2a0cd9a4-cb72-44cb-bf82-966fc2c396b1', '69cecf53-c0af-436a-94da-dc4765be8c79'),
	(NULL, '3531e63e-589e-46e7-9248-4a769e84b00d', NULL, 'applied', '2026-02-02 10:33:41.709481+00', NULL, NULL, NULL, NULL, '2026-02-02 10:33:41.709481+00', '2026-02-02 10:33:41.709481+00', 'fabe949c-c723-460d-9373-933407c04526', '0993cdbb-b300-4bb7-ac89-fe51a14426c8');


--

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
-- Data for Name: organization_invitations; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."organization_invitations" ("id", "organization_id", "organization_type", "invited_by", "invited_by_role", "invitee_email", "invitee_name", "invitee_role", "license_pool_id", "subscription_plan_id", "addon_ids", "invitation_token", "status", "expires_at", "accepted_at", "accepted_by_user_id", "invitation_message", "metadata", "created_at", "updated_at", "cancelled_at", "cancelled_by", "cancellation_reason") VALUES
	('412951dc-ed8b-4489-a0c4-8054cf7f95e9', '83945f29-e517-4f12-9704-b94fccc3ab42', 'school', '6e4789bf-92f6-4084-af88-91d4b20cf1db', 'school_admin', 'gokul@rareminds.in', NULL, 'school_student', NULL, NULL, '{}', 'LJuGaZ1Sa5H84b8A7ZLJIfHQSI9JDmaW6wHhhj4Da0xELcgiLC8Ryqn2IVJDDJk2', 'cancelled', '2026-01-23 08:23:27.961+00', NULL, NULL, NULL, '{}', '2026-01-16 08:23:28.118004+00', '2026-01-16 08:25:18.965308+00', '2026-01-16 08:25:18.828+00', '6e4789bf-92f6-4084-af88-91d4b20cf1db', NULL),
	('01f8f1f4-e53a-4f0d-8836-86b4689d96c8', '83945f29-e517-4f12-9704-b94fccc3ab42', 'school', '6e4789bf-92f6-4084-af88-91d4b20cf1db', 'school_admin', 'gokul@rareminds.in', NULL, 'school_student', NULL, NULL, '{}', 'PniMHAXejAjzXtYYrq7LD3260tNlelHRwmXVYw8q3avemedWepE9iihbYPUrGLLF', 'cancelled', '2026-01-23 08:31:33.623+00', NULL, NULL, NULL, '{}', '2026-01-16 08:31:33.76609+00', '2026-01-16 08:32:19.13786+00', '2026-01-16 08:32:18.988+00', '6e4789bf-92f6-4084-af88-91d4b20cf1db', NULL),
	('5ba31795-4920-4836-ac58-ab88286a95fb', '83945f29-e517-4f12-9704-b94fccc3ab42', 'school', '6e4789bf-92f6-4084-af88-91d4b20cf1db', 'school_admin', 'gokul@raremins.in', NULL, 'school_student', NULL, NULL, '{}', 'AOBUWbTMusFWE38wKINtNqL2jf8MoaoEdC48ZUA6quN2DSA6fnxhREcT3P3ZVlBD', 'cancelled', '2026-01-23 08:32:40.999+00', NULL, NULL, NULL, '{}', '2026-01-16 08:32:41.118652+00', '2026-01-16 08:33:28.86066+00', '2026-01-16 08:33:28.668+00', '6e4789bf-92f6-4084-af88-91d4b20cf1db', NULL),
	('d6e83a1f-57d3-4818-bbf4-1d7bc0aa3123', '83945f29-e517-4f12-9704-b94fccc3ab42', 'school', '6e4789bf-92f6-4084-af88-91d4b20cf1db', 'school_admin', 'gokul@rareminds.in', NULL, 'school_student', NULL, NULL, '{}', 'HV4fKUKirN2CbzhNDXeuV492B0owvCBQXouhor3BCc4EAb4KU6PeYUWUtq6FWt0s', 'cancelled', '2026-01-23 08:34:03.646+00', NULL, NULL, NULL, '{}', '2026-01-16 08:34:03.765399+00', '2026-01-16 09:01:19.736793+00', '2026-01-16 09:01:19.622+00', '6e4789bf-92f6-4084-af88-91d4b20cf1db', NULL),
	('96917360-a103-4996-8496-2b2935333e0d', '83945f29-e517-4f12-9704-b94fccc3ab42', 'school', '6e4789bf-92f6-4084-af88-91d4b20cf1db', 'school_admin', 'gokul@rareminds.in', NULL, 'school_student', NULL, NULL, '{}', 'jh9nidtJ8f2opDUEl3dTSmDAS5GUFt35B0XLT4AJTJbnAJ1vtPzXPLDC8JzKHVuW', 'cancelled', '2026-01-23 09:01:33.038+00', NULL, NULL, NULL, '{}', '2026-01-16 09:01:33.154923+00', '2026-01-16 09:05:46.121658+00', '2026-01-16 09:05:45.985+00', '6e4789bf-92f6-4084-af88-91d4b20cf1db', NULL),
	('e61f9461-e5be-4b22-b7e4-e6d239c6f160', '83945f29-e517-4f12-9704-b94fccc3ab42', 'school', '6e4789bf-92f6-4084-af88-91d4b20cf1db', 'school_admin', 'gokul@rareminds.in', NULL, 'school_student', NULL, NULL, '{}', 'ht1zUpMnUodCT0qLibefk8qM2bBtjsSRXobr1FgYMMxRkpoCrEcboHCnljXqpQyo', 'accepted', '2026-01-23 09:19:13.421+00', '2026-01-16 09:19:35.098+00', '6e4789bf-92f6-4084-af88-91d4b20cf1db', NULL, '{}', '2026-01-16 09:11:25.492931+00', '2026-01-16 09:19:35.179148+00', NULL, NULL, NULL),
	('0cb6783e-97ad-4520-a8f6-ea21e912a273', '83945f29-e517-4f12-9704-b94fccc3ab42', 'school', '6e4789bf-92f6-4084-af88-91d4b20cf1db', 'school_admin', 'gokul@rareminds.in', NULL, 'school_student', NULL, NULL, '{}', '6j997sr6bcZwT1n8ZEjRtbKUW2FWqkFE5pHkKBFGBPnJKefrqq5TnNz55QfrbByO', 'accepted', '2026-01-23 10:36:41.722+00', '2026-01-16 10:37:45.892+00', '95364f0d-23fb-4616-b0f4-48caafee5439', NULL, '{}', '2026-01-16 09:36:15.439938+00', '2026-01-16 10:37:46.064431+00', NULL, NULL, NULL),
	('415ae2c8-cbf6-4e97-8e44-f10571b019db', '83945f29-e517-4f12-9704-b94fccc3ab42', 'school', '6e4789bf-92f6-4084-af88-91d4b20cf1db', 'school_admin', 'sinjiniee@rareminds.in', NULL, 'school_student', NULL, NULL, '{}', 'olZyBhJicB5XhHxyPp8OpkS4gRzvQPuIbpnlvNu2LeIQuZBo1NKjXbg9EcR1vxKv', 'pending', '2026-01-23 10:46:35.459+00', NULL, NULL, NULL, '{}', '2026-01-16 10:46:35.773961+00', '2026-01-16 10:46:35.773961+00', NULL, NULL, NULL),
	('8eac45c4-06bd-42ac-96a8-e34646f748a3', '83945f29-e517-4f12-9704-b94fccc3ab42', 'school', '6e4789bf-92f6-4084-af88-91d4b20cf1db', 'school_admin', 'hariprasath@rareminds.in', NULL, 'school_student', NULL, NULL, '{}', 'sxCLxPy7AETv2nEfSP4i28XGHwz8gkMfoiP4JyzSE1ewDJw2j3677WwFxY8JXJWU', 'accepted', '2026-01-23 10:50:20.332+00', '2026-01-16 10:51:57.506+00', 'bc0f476c-679d-4ae0-9b06-8d8999021a95', NULL, '{}', '2026-01-16 10:50:20.458147+00', '2026-01-16 10:51:58.291804+00', NULL, NULL, NULL),
	('cb5cfede-e204-4afb-8a6c-f075e24d8220', '83945f29-e517-4f12-9704-b94fccc3ab42', 'school', '6e4789bf-92f6-4084-af88-91d4b20cf1db', 'school_admin', 'widitir106@elafans.com', NULL, 'school_student', NULL, NULL, '{}', 'wVOLa5dutUAbYcZR96QvlGZqerZ1cGG6vYeTK0rZOmtrP3nmad67mdsfqJ6g1dfa', 'accepted', '2026-01-24 04:31:32.121+00', '2026-01-17 04:32:01.148+00', 'c1ad297d-9718-408f-9683-7ec1de506f85', NULL, '{}', '2026-01-17 04:31:32.169637+00', '2026-01-17 04:32:01.21983+00', NULL, NULL, NULL);


--

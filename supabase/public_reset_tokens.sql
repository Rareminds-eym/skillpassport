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
-- Data for Name: reset_tokens; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."reset_tokens" ("id", "email", "token", "expires_at", "created_at") VALUES
	('044fc66b-6228-4e9c-b096-9834bbd0234b', 'test@example.com', '599646', '2026-01-27 12:14:22.234+00', '2026-01-27 12:04:22.331197+00'),
	('3c26250e-9b53-451c-aa6f-7c813343c00f', 'test@example.com', '850724', '2026-01-28 04:21:33.639+00', '2026-01-28 04:11:34.278447+00'),
	('2f7f5c94-294a-490c-9acb-ba2a26e39386', 'hariprasath@rareminds.in', 'b411bf52bc3275c6f550d68cbc2e108c', '2026-01-28 06:07:47.23+00', '2026-01-28 05:37:47.755835+00'),
	('32d30b81-567a-47e1-bb13-b3aa55abac57', 'hariprasath@rareminds.in', '975685f6b310a5d995eeecb264b60c60', '2026-01-28 06:30:28.804+00', '2026-01-28 06:00:28.734552+00'),
	('48dff8f2-dbcc-4e7f-ac11-e4c465154b84', 'test@example.com', '343450', '2026-01-30 11:02:11.908+00', '2026-01-30 10:52:11.9351+00'),
	('f6208024-2887-483c-8066-622c79b7a50f', 'test@example.com', '283895', '2026-01-30 11:07:11.027+00', '2026-01-30 10:57:11.107127+00'),
	('d6db062b-e0f8-46a5-9a92-0d1cb5ca009e', 'test@example.com', '381788', '2026-01-30 11:10:14.705+00', '2026-01-30 11:00:14.784888+00'),
	('dd505de1-dc32-46d3-a452-4b056acc033a', 'test@example.com', '359862', '2026-01-30 11:14:46.485+00', '2026-01-30 11:04:46.538772+00'),
	('54630d48-c8cd-4a28-8d2b-39f11431cf24', 'test@example.com', '919718', '2026-01-30 11:15:38.246+00', '2026-01-30 11:05:39.377909+00'),
	('e77bf09b-9978-4204-8fa0-5c84076cadce', 'test@example.com', '831975', '2026-01-30 11:16:10.647+00', '2026-01-30 11:06:10.667351+00');


--

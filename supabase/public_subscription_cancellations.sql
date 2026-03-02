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
-- Data for Name: subscription_cancellations; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."subscription_cancellations" ("id", "subscription_id", "user_id", "cancellation_reason", "additional_feedback", "cancelled_at", "access_until", "reactivated_at", "created_at") VALUES
	('eb4803c9-3e2d-4eba-a689-c1ac32ee0ae5', 'adfd1900-55b1-412f-b20b-3dc201aa6e04', 'c02a87d0-52b3-466e-93d0-fadbc7260047', 'Not using enough', NULL, '2026-01-02 10:43:41.066+00', '2026-02-02 10:39:29.526+00', NULL, '2026-01-02 10:43:41.261636+00'),
	('7333a8d0-bf94-436d-9dbf-29512e44dbbb', '31076ca9-96d5-425c-8869-23857987fa34', '95364f0d-23fb-4616-b0f4-48caafee5439', 'Other', NULL, '2026-01-07 09:35:09.265+00', '2026-02-07 04:30:08.022+00', NULL, '2026-01-07 09:35:09.483603+00'),
	('19fb2e80-26d2-4142-8309-1d69fd5a41fc', '244e48f8-0383-4e04-a3d0-7efa7dbf87cd', '52004557-7df2-4c2a-bffb-437588cbb619', 'Other', NULL, '2026-01-08 04:59:52.491+00', '2026-02-08 04:58:58.881+00', NULL, '2026-01-08 04:59:52.671744+00');


--

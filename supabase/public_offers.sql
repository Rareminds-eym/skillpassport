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
-- Data for Name: offers; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."offers" ("id", "inserted_at", "updated_at", "candidate_id", "candidate_name", "job_id", "job_title", "template", "ctc_band", "offered_ctc", "offer_date", "expiry_date", "status", "sent_via", "benefits", "notes", "response_deadline", "acceptance_notes", "response_date") VALUES
	('8e004489-c9d3-4991-96cf-64886f05ac39', '2025-12-09 04:29:17.748745+00', '2025-12-09 06:06:42.163885+00', NULL, 'Litikesh', NULL, 'Full Stack Developer', 'Full-time Offer - Standard', '4.0-6.0 LPA', '5LPA', '2025-12-09 04:29:17.663+00', '2025-12-19 04:29:17.663+00', 'pending', 'email', '{"Health Insurance"}', '', '2025-12-19 04:29:17.663+00', NULL, NULL);


--

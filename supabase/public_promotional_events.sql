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
-- Data for Name: promotional_events; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."promotional_events" ("id", "event_code", "event_name", "description", "start_date", "end_date", "discount_type", "is_active", "banner_text", "banner_subtitle", "banner_emoji", "created_at", "updated_at") VALUES
	('a59507e4-c1a8-480b-a297-8b8bd9424e89', 'ESFE_2024', 'ESFE Event Special', 'Exclusive discounts for ESFE 2024 attendees', '2024-12-01 00:00:00+00', '2026-01-12 23:59:59+00', 'percentage', true, 'ESFE Event Special Pricing!', 'Exclusive discounts up to 50% - Limited time offer', '🎉', '2025-12-10 06:40:08.746602+00', '2025-12-10 06:40:08.746602+00');


--

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
-- Data for Name: shortlists; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."shortlists" ("id", "name", "description", "created_by", "created_date", "status", "shared", "share_link", "share_expiry", "watermark", "include_pii", "notify_on_access", "tags", "updated_at") VALUES
	('sl_1765254285744', 'Full Stack Developer Interns', '', NULL, '2025-12-09 04:24:45.830408+00', 'active', false, NULL, NULL, false, false, false, '{React,Js,Node,Sql}', '2025-12-09 04:24:45.830408+00'),
	('sl_1765260366446', 'Node Js Developer', '', NULL, '2025-12-09 06:06:06.724833+00', 'active', true, 'https://recruiterhub.com/shared/sl_1765260366446?token=b3urf4hr0', '2026-02-07 05:32:13.021+00', true, false, true, '{JavaScript,"Node Js"}', '2026-01-08 05:32:12.881667+00');


--

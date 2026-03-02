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
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."audit_logs" ("actorId", "action", "target", "payload", "ip", "createdAt", "id") VALUES
	('de3175cc-13f8-4cba-986a-363a3057a90d', 'approve_course', 'a50fb836-ef2c-445c-acf9-433f67ccbf4f', '{"notes": "Approved by Super Admin"}', '', '2025-12-02 05:46:47.436622+00', 'b74669df-267f-4b91-8048-f8e4c1bb5ac0'),
	('de3175cc-13f8-4cba-986a-363a3057a90d', 'delete_course', '11552241-4b3e-4918-96f2-2eae9748c579', '{"deleted_by": "admin@rareminds.in", "course_name": "Test"}', '', '2025-12-20 04:17:52.272708+00', 'bef2efb6-b603-402e-858b-a1a717c9ffcf'),
	('de3175cc-13f8-4cba-986a-363a3057a90d', 'update_profile', 'de3175cc-13f8-4cba-986a-363a3057a90d', '{"lastName": "", "firstName": "Rareminds", "organizationName": ""}', '', '2025-12-20 06:26:16.188969+00', '413aa67c-e46e-4b6a-8c74-58eb9b170e3d');


--

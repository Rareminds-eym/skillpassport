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
-- Data for Name: school_educator_class_assignments; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."school_educator_class_assignments" ("id", "educator_id", "class_id", "subject", "academic_year", "is_primary", "assigned_at", "assigned_by") VALUES
	('830f6f77-31e7-423a-aa86-716fdad6947c', 'f81a2813-4a3c-478b-a08d-7f752ce8c5ea', '588f5c42-2f91-4fec-89cc-dca5de209611', 'science', '2024-2025', true, '2025-12-16 10:04:18.519165+00', '52004557-7df2-4c2a-bffb-437588cbb619'),
	('2cb70e90-7991-4e87-a15a-3c9c71dc2019', '5d78d3c6-e53e-48df-887f-fd21e1e58db6', '0719a288-54cf-4747-96f7-59f2a8a66397', 'Math', '2024-2025', true, '2025-12-16 16:14:11.139412+00', '52004557-7df2-4c2a-bffb-437588cbb619'),
	('60114fe4-2ad6-442b-a384-5955df7e1d07', '5d78d3c6-e53e-48df-887f-fd21e1e58db6', '63c95b3d-ffdb-4b54-af81-cdf7ba8c154c', 'math', '2025-2026', false, '2025-12-18 05:22:58.34155+00', '52004557-7df2-4c2a-bffb-437588cbb619'),
	('b5c4bb45-de1d-450e-b606-36d293a764c7', 'f81a2813-4a3c-478b-a08d-7f752ce8c5ea', '63c95b3d-ffdb-4b54-af81-cdf7ba8c154c', 'test', '2025-2026', true, '2025-12-22 06:58:29.255061+00', '52004557-7df2-4c2a-bffb-437588cbb619');


--

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
-- Data for Name: curriculums; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."curriculums" ("id", "school_id", "subject", "class", "academic_year", "status", "created_by", "approved_by", "approval_date", "rejection_reason", "last_modified", "created_at", "updated_at") VALUES
	('671496d0-eeb5-46a4-8a2f-8014ba650a3d', '69cf3489-0046-4414-8acc-409174ffbd2c', 'Mathematics', '10', '2027-2028', 'draft', '52004557-7df2-4c2a-bffb-437588cbb619', NULL, NULL, NULL, '2025-12-04 06:12:14.313747', '2025-12-04 06:12:14.313747', '2025-12-04 06:12:14.313747'),
	('ab73e767-ec31-4dc1-afa0-ed67dab380ba', '69cf3489-0046-4414-8acc-409174ffbd2c', 'Mathematics', '10', '2025-2026', 'approved', '52004557-7df2-4c2a-bffb-437588cbb619', '52004557-7df2-4c2a-bffb-437588cbb619', '2025-12-04 06:23:04.249', NULL, '2025-12-04 06:22:21.550962', '2025-12-04 06:22:21.550962', '2025-12-04 06:23:03.831674'),
	('a7051327-cb05-4b33-9be5-d82004252bd0', '69cf3489-0046-4414-8acc-409174ffbd2c', 'Physics', '10', '2024-2025', 'draft', '52004557-7df2-4c2a-bffb-437588cbb619', NULL, NULL, NULL, '2025-12-18 11:13:42.508481', '2025-12-18 11:13:42.508481', '2025-12-18 11:13:42.508481'),
	('abca3574-c3b3-409c-894d-5856b6f5f4af', '69cf3489-0046-4414-8acc-409174ffbd2c', 'Economics', '10', '2024-2025', 'draft', '52004557-7df2-4c2a-bffb-437588cbb619', NULL, NULL, NULL, '2025-12-18 11:13:59.881924', '2025-12-18 11:13:59.881924', '2025-12-18 11:13:59.881924'),
	('e298ede8-ea42-497b-8402-d74541b8b171', '69cf3489-0046-4414-8acc-409174ffbd2c', 'Physics', '10', '2023-2024', 'draft', '52004557-7df2-4c2a-bffb-437588cbb619', NULL, NULL, NULL, '2025-12-18 11:19:05.499976', '2025-12-18 11:19:05.499976', '2025-12-18 11:19:05.499976'),
	('88975a37-8051-461d-a749-ef5bfab21bf5', '69cf3489-0046-4414-8acc-409174ffbd2c', 'Mathematics', '10', '2024-2025', 'approved', '52004557-7df2-4c2a-bffb-437588cbb619', '52004557-7df2-4c2a-bffb-437588cbb619', '2026-01-05 11:51:53.392', NULL, '2026-01-05 11:51:50.122736', '2025-12-03 07:00:34.059155', '2026-01-05 11:51:53.664721');


--

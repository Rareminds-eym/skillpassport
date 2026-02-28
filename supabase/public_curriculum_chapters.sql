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
-- Data for Name: curriculum_chapters; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."curriculum_chapters" ("id", "curriculum_id", "name", "code", "description", "order_number", "estimated_duration", "duration_unit", "created_at", "updated_at") VALUES
	('de71b9e8-1daa-48e9-a41a-4e27424afeb5', '88975a37-8051-461d-a749-ef5bfab21bf5', 'Introduction to Algebra', 'CH-01', 'Basic concepts of algebra including variables, expressions, and equations', 1, 2, 'weeks', '2025-12-03 07:01:08.468289', '2025-12-03 07:01:08.468289'),
	('b3080a20-918a-4c63-bdef-7900f72c1d12', '88975a37-8051-461d-a749-ef5bfab21bf5', 'Linear Equations', 'CH-02', 'Solving linear equations in one and two variables', 2, 3, 'weeks', '2025-12-03 07:01:31.815823', '2025-12-03 07:01:31.815823'),
	('47538233-4b5c-43d2-969c-4a176cfa5ac6', '88975a37-8051-461d-a749-ef5bfab21bf5', 'Quadratic Equations', 'CH-03', 'Understanding and solving quadratic equations using various methods', 3, 4, 'weeks', '2025-12-03 07:02:04.879677', '2025-12-03 07:02:04.879677'),
	('4fc4e80c-a5c6-4fc8-b2cd-1ea610e4fd9e', 'ab73e767-ec31-4dc1-afa0-ed67dab380ba', 'Introduction to Algebra', 'CH-01', 'Basic concepts of algebra including variables, expressions, and equations', 1, 2, 'weeks', '2025-12-04 06:22:21.550962', '2025-12-04 06:22:21.550962'),
	('6c81cf7e-2281-4f1c-bbfe-894e1ee4c4c9', 'ab73e767-ec31-4dc1-afa0-ed67dab380ba', 'Linear Equations', 'CH-02', 'Solving linear equations in one and two variables', 2, 3, 'weeks', '2025-12-04 06:22:21.550962', '2025-12-04 06:22:21.550962'),
	('60ea8e44-55da-401d-86b7-e32893921251', 'ab73e767-ec31-4dc1-afa0-ed67dab380ba', 'Quadratic Equations', 'CH-03', 'Understanding and solving quadratic equations using various methods', 3, 4, 'weeks', '2025-12-04 06:22:21.550962', '2025-12-04 06:22:21.550962'),
	('88d1e0e9-7dc4-4c33-8009-39a72de2b2ae', 'ab73e767-ec31-4dc1-afa0-ed67dab380ba', 'test', 'Ch-01', 'test', 4, 2, 'weeks', '2025-12-04 06:22:21.550962', '2025-12-04 06:22:21.550962'),
	('c81623f0-74c3-45df-b154-33b61dc6f097', '88975a37-8051-461d-a749-ef5bfab21bf5', 'Introduction to Algebra', 'CH01', '', 4, 1, 'hours', '2025-12-18 11:21:37.319448', '2025-12-18 11:21:37.319448');


--

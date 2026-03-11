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
-- Data for Name: bundles; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."bundles" ("id", "name", "slug", "description", "target_roles", "monthly_price", "annual_price", "discount_percentage", "is_active", "display_order", "created_at", "updated_at") VALUES
	('c353595f-901d-438b-b690-efc65767c8f4', 'Educator Pro', 'educator-pro', 'Complete toolkit for educators to enhance teaching effectiveness', '{educator}', 518.00, 5180.00, 20, true, 2, '2026-01-03 05:09:08.063241+00', '2026-01-03 05:09:08.063241+00'),
	('f8ce836e-76d5-46df-9c12-116fe3fd25a7', 'Institution Complete', 'institution-complete', 'Full suite of administrative tools for institutions', '{school_admin,college_admin,university_admin}', 958.00, 9580.00, 25, true, 3, '2026-01-03 05:09:08.063241+00', '2026-01-03 05:09:08.063241+00'),
	('2b67127f-c13c-4eca-be3f-28dec19051c6', 'Recruiter Suite', 'recruiter-suite', 'Comprehensive recruitment and talent management tools', '{recruiter}', 1037.00, 10370.00, 20, true, 4, '2026-01-03 05:09:08.063241+00', '2026-01-03 05:09:08.063241+00'),
	('146d2cb6-9515-467f-8451-038ed79cf064', 'Career Starter', 'career-starter', 'Career AI + AI Job Matching bundle for students', '{student}', 3558.40, 35584.00, 20, true, 1, '2026-01-03 05:09:08.063241+00', '2026-01-08 04:19:06.143818+00');


--

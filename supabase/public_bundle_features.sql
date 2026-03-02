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
-- Data for Name: bundle_features; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."bundle_features" ("id", "bundle_id", "feature_key", "created_at") VALUES
	('9dd3797f-a4ae-4b67-9a06-16c34dce2670', '146d2cb6-9515-467f-8451-038ed79cf064', 'career_ai', '2026-01-03 05:09:22.191913+00'),
	('11265fe7-55d7-4170-915e-824abe33033c', '146d2cb6-9515-467f-8451-038ed79cf064', 'ai_job_matching', '2026-01-03 05:09:22.191913+00'),
	('9125aba5-6796-43e5-96fa-3d83c629eb5d', 'c353595f-901d-438b-b690-efc65767c8f4', 'educator_ai', '2026-01-03 05:09:22.191913+00'),
	('c19fc5a4-56a8-4dbe-9a64-b37d7a9d15d5', 'c353595f-901d-438b-b690-efc65767c8f4', 'advanced_analytics', '2026-01-03 05:09:22.191913+00'),
	('05915806-748a-4321-b944-7105f04e7f2d', 'c353595f-901d-438b-b690-efc65767c8f4', 'course_analytics', '2026-01-03 05:09:22.191913+00'),
	('24012c66-e6d6-4b9f-b40f-9c43f84cdbaf', 'f8ce836e-76d5-46df-9c12-116fe3fd25a7', 'kpi_dashboard', '2026-01-03 05:09:22.191913+00'),
	('68d69622-00e4-4949-90bc-2894ab67adf6', 'f8ce836e-76d5-46df-9c12-116fe3fd25a7', 'curriculum_builder', '2026-01-03 05:09:22.191913+00'),
	('e56cd43a-91df-45d5-b529-f969945c2b7e', 'f8ce836e-76d5-46df-9c12-116fe3fd25a7', 'fee_management', '2026-01-03 05:09:22.191913+00'),
	('2bae1618-ba34-41c5-b4aa-0d70e3bebbde', 'f8ce836e-76d5-46df-9c12-116fe3fd25a7', 'sso', '2026-01-03 05:09:22.191913+00'),
	('6b063116-4eb5-4e60-ad9b-102bb2ba0d7a', '2b67127f-c13c-4eca-be3f-28dec19051c6', 'recruiter_ai', '2026-01-03 05:09:22.191913+00'),
	('cf317d7f-4d35-40c6-8a85-ec1f1569617b', '2b67127f-c13c-4eca-be3f-28dec19051c6', 'talent_pool_access', '2026-01-03 05:09:22.191913+00'),
	('9ef8d541-5417-435a-9f58-b3073192c29b', '2b67127f-c13c-4eca-be3f-28dec19051c6', 'pipeline_management', '2026-01-03 05:09:22.191913+00'),
	('60b893e2-156a-4866-a9f5-e9d13aa19f3a', '2b67127f-c13c-4eca-be3f-28dec19051c6', 'project_hiring', '2026-01-03 05:09:22.191913+00');


--

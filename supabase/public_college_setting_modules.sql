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
-- Data for Name: college_setting_modules; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."college_setting_modules" ("id", "module_name", "description", "is_active", "created_at", "updated_at") VALUES
	('d78c9bd7-b37e-4119-b4ce-6bdbe5d7e66f', 'Dashboard', 'Main dashboard and overview', true, '2026-01-09 12:14:51.459847', '2026-01-09 12:14:51.459847'),
	('6c11e94a-49b4-44b5-8e1b-b1fd39157a13', 'Students', 'Student management and records', true, '2026-01-09 12:14:51.459847', '2026-01-09 12:14:51.459847'),
	('55308ffe-20c7-4ee0-a229-00ad8de976d7', 'Departments & Faculty', 'Department and faculty management', true, '2026-01-09 12:14:51.459847', '2026-01-09 12:14:51.459847'),
	('f3fcf8c3-3bd6-449a-9531-1c095174bfb7', 'Academics', 'Academic programs and curriculum', true, '2026-01-09 12:14:51.459847', '2026-01-09 12:14:51.459847'),
	('48a2e308-49e6-42c1-b562-747da2a5c527', 'Examinations', 'Examination management', true, '2026-01-09 12:14:51.459847', '2026-01-09 12:14:51.459847'),
	('21c0aed4-f67b-4462-b9d0-5018f60bceac', 'Placements & Skills', 'Placement and skill development', true, '2026-01-09 12:14:51.459847', '2026-01-09 12:14:51.459847'),
	('18b86137-32d9-4589-9788-57139b8cf978', 'Operations', 'Operational management', true, '2026-01-09 12:14:51.459847', '2026-01-09 12:14:51.459847'),
	('5853bed0-3bcc-4986-9c25-1afa45ed6b03', 'Administration', 'System administration', true, '2026-01-09 12:14:51.459847', '2026-01-09 12:14:51.459847'),
	('6bb07717-be1f-432b-b627-8fedc76e3777', 'Settings', 'System settings and configuration', true, '2026-01-09 12:14:51.459847', '2026-01-09 12:14:51.459847'),
	('955aa3b2-93df-4ccf-9b10-5507889528e6', 'Teaching Intelligence', 'AI-powered teaching tools', true, '2026-01-09 12:14:51.459847', '2026-01-09 12:14:51.459847'),
	('e1e9aad7-aa40-4721-9844-ba52b692769e', 'Courses', 'Course browsing and management', true, '2026-01-09 12:14:51.459847', '2026-01-09 12:14:51.459847'),
	('06920f0b-8618-480f-98fa-ae1954fb602e', 'Classroom Management', 'Classroom and student management', true, '2026-01-09 12:14:51.459847', '2026-01-09 12:14:51.459847'),
	('eb507543-c59b-435d-a04c-2bda92fe2d43', 'Learning & Evaluation', 'Learning assessment and evaluation', true, '2026-01-09 12:14:51.459847', '2026-01-09 12:14:51.459847'),
	('94b2ec14-7cd8-4748-a6e9-0eb07c429f38', 'Skill & Co-Curriculm', 'Co-curricular activities', true, '2026-01-09 12:14:51.459847', '2026-01-09 12:14:51.459847'),
	('d26be101-3721-4b06-b094-eb2dc2428330', 'Digital Portfolio', 'Personal portfolio management', true, '2026-01-09 12:14:51.459847', '2026-01-09 12:14:51.459847'),
	('e1c82fcd-96fb-478a-a6c2-f87044d99837', 'Analytics', 'Performance analytics', true, '2026-01-09 12:14:51.459847', '2026-01-09 12:14:51.459847'),
	('2a1f4937-a0bc-4328-9429-f66c397a4560', 'Reports', 'Report generation', true, '2026-01-09 12:14:51.459847', '2026-01-09 12:14:51.459847'),
	('8f7ad976-e69c-4a0b-abd8-60a201f348a8', 'Media Manager', 'Media file management', true, '2026-01-09 12:14:51.459847', '2026-01-09 12:14:51.459847'),
	('e8f6a9ca-3520-4925-8451-f9e94657fe37', 'Communication', 'Communication tools', true, '2026-01-09 12:14:51.459847', '2026-01-09 12:14:51.459847');


--

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
-- Data for Name: college_setting_permissions; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."college_setting_permissions" ("id", "permission_name", "description", "created_at") VALUES
	('e0bcf53a-f429-45a0-9bed-b8b323e404c2', 'view', 'View/Read access to module', '2026-01-09 12:14:51.459847'),
	('585637a9-725a-4532-95df-85825d1268d9', 'create', 'Create new records in module', '2026-01-09 12:14:51.459847'),
	('913075b3-e1a4-4cfd-b2f2-ad5244e45835', 'edit', 'Edit existing records in module', '2026-01-09 12:14:51.459847'),
	('ff4165dd-3c41-4d9e-beb4-7ff3fb0063d9', 'approve', 'Approve/Authorize actions in module', '2026-01-09 12:14:51.459847'),
	('90be537e-9eb4-4e6e-8553-5a4145b1ae88', 'publish', 'Publish/Make content public', '2026-01-09 12:14:51.459847');


--

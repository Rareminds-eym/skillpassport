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
-- Data for Name: library_categories_college; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."library_categories_college" ("id", "college_id", "name", "description", "color_code", "created_at", "updated_at") VALUES
	('39e645e2-abc3-435b-bf25-6e67ff7a212d', '659ebe4b-bdae-40c8-901f-2fed3c221574', 'Academic', 'Academic textbooks and reference materials', '#3B82F6', '2026-01-03 08:56:35.088498+00', '2026-01-03 08:56:35.088498+00'),
	('7e32e363-b7ba-494d-8665-05b536e2ce1e', '659ebe4b-bdae-40c8-901f-2fed3c221574', 'Fiction', 'Fiction books and novels', '#10B981', '2026-01-03 08:56:35.088498+00', '2026-01-03 08:56:35.088498+00'),
	('fbf8c6ec-6801-4d39-aa80-c0103cb69e9b', '659ebe4b-bdae-40c8-901f-2fed3c221574', 'Non-Fiction', 'Non-fiction books and biographies', '#F59E0B', '2026-01-03 08:56:35.088498+00', '2026-01-03 08:56:35.088498+00'),
	('bb8ba086-ee93-41a8-911e-8380332b51c7', '659ebe4b-bdae-40c8-901f-2fed3c221574', 'Reference', 'Reference books and encyclopedias', '#EF4444', '2026-01-03 08:56:35.088498+00', '2026-01-03 08:56:35.088498+00'),
	('95a18c07-e607-4e69-97d1-55a3caa55516', '659ebe4b-bdae-40c8-901f-2fed3c221574', 'Journals', 'Academic journals and periodicals', '#8B5CF6', '2026-01-03 08:56:35.088498+00', '2026-01-03 08:56:35.088498+00'),
	('168315e5-bc1d-4503-8ab5-10eb7578fced', '659ebe4b-bdae-40c8-901f-2fed3c221574', 'Digital', 'Digital resources and e-books', '#06B6D4', '2026-01-03 08:56:35.088498+00', '2026-01-03 08:56:35.088498+00');


--

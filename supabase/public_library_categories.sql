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
-- Data for Name: library_categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."library_categories" ("id", "name", "description", "color_code", "created_at", "updated_at") VALUES
	('fd311f23-52f1-453e-bd3f-0dd792f850a6', 'Academic', 'Academic textbooks and reference materials', '#3B82F6', '2026-01-05 04:24:06.724675+00', '2026-01-05 04:24:06.724675+00'),
	('9a357fb2-7219-4f26-95ef-c4636f1a9d90', 'Fiction', 'Fiction books and novels', '#10B981', '2026-01-05 04:24:06.724675+00', '2026-01-05 04:24:06.724675+00'),
	('c7161796-1c97-4490-9839-9d517383654c', 'Non-Fiction', 'Non-fiction books and biographies', '#F59E0B', '2026-01-05 04:24:06.724675+00', '2026-01-05 04:24:06.724675+00'),
	('d7ba6003-1379-4cff-bc42-c6f1887cfdb5', 'Reference', 'Reference books and encyclopedias', '#EF4444', '2026-01-05 04:24:06.724675+00', '2026-01-05 04:24:06.724675+00'),
	('38c778b4-f254-4f6a-a245-39a11d142e9d', 'Journals', 'Academic journals and periodicals', '#8B5CF6', '2026-01-05 04:24:06.724675+00', '2026-01-05 04:24:06.724675+00'),
	('67f10b56-b1b0-442c-8b13-5c1ba7d8eb6e', 'Digital', 'Digital resources and e-books', '#06B6D4', '2026-01-05 04:24:06.724675+00', '2026-01-05 04:24:06.724675+00');


--

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
-- Data for Name: library_books_school; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."library_books_school" ("id", "school_id", "title", "author", "isbn", "total_copies", "available_copies", "status", "category", "publisher", "publication_year", "description", "location_shelf", "created_at", "updated_at") VALUES
	('02766435-17af-4746-9561-e67567659937', '69cf3489-0046-4414-8acc-409174ffbd2c', 'Maths', 'NCERT', '9638527410547', 2, 1, 'available', 'Academic', 'SJ', 2026, NULL, 'A1-B6,section 4', '2026-01-06 07:55:40.58584+00', '2026-01-06 07:55:40.58584+00'),
	('b3f95ea8-d60d-4cfe-ad95-82ec964b53da', '69cf3489-0046-4414-8acc-409174ffbd2c', 'Science', 'NCERT', '7418529630456', 2, 1, 'available', 'Academic', 'SJ Smith', 2026, NULL, 'E2,Section 3', '2026-01-06 08:49:41.502415+00', '2026-01-06 08:49:41.502415+00'),
	('d37da2f4-44ae-45d8-addf-ea5cb63a2625', '69cf3489-0046-4414-8acc-409174ffbd2c', 'test', 'test', '21343434', 10, 10, 'available', NULL, NULL, 2026, NULL, NULL, '2026-01-29 11:53:49.562039+00', '2026-01-29 11:53:49.562039+00');


--

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
-- Data for Name: library_settings; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."library_settings" ("id", "setting_key", "setting_value", "description", "created_at", "updated_at") VALUES
	('be7cbbd7-7d33-43a4-9a32-37681701df18', 'max_books_per_student', '3', 'Maximum number of books a student can issue at once', '2026-01-05 04:24:06.724675+00', '2026-01-05 04:24:06.724675+00'),
	('14ca95fa-a667-4ebe-9ad9-e440bb8a3ca1', 'default_loan_period_days', '14', 'Default loan period in days', '2026-01-05 04:24:06.724675+00', '2026-01-05 04:24:06.724675+00'),
	('37acd790-69ef-4d8d-82c3-ead48fe1036f', 'fine_per_day', '10', 'Fine amount per day for overdue books (in rupees)', '2026-01-05 04:24:06.724675+00', '2026-01-05 04:24:06.724675+00'),
	('1917aecb-2cbd-47c9-807e-11c33bbab41f', 'library_name', 'College Library', 'Name of the library', '2026-01-05 04:24:06.724675+00', '2026-01-05 04:24:06.724675+00'),
	('2275032d-4753-4803-a19a-0a38802d4ffb', 'library_email', 'library@college.edu', 'Library contact email', '2026-01-05 04:24:06.724675+00', '2026-01-05 04:24:06.724675+00'),
	('1614091f-9c25-4751-95b6-70da5a38992e', 'library_phone', '+91-XXXXXXXXXX', 'Library contact phone', '2026-01-05 04:24:06.724675+00', '2026-01-05 04:24:06.724675+00');


--

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
-- Data for Name: college_faculty_substitutions; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."college_faculty_substitutions" ("id", "college_id", "leave_id", "original_faculty_id", "substitute_faculty_id", "timetable_slot_id", "substitution_date", "period_number", "class_id", "subject_name", "status", "notes", "created_at", "updated_at") VALUES
	('4e8be276-819d-45f1-90ac-cde71d8bc17f', 'c16a95cf-6ee5-4aa9-8e47-84fbda49611d', 'ed77a86a-18da-4030-9840-eb29b5d393e3', '51da223b-c1ec-40f6-b0df-eb9c9d0f7378', '462572af-66de-43da-97b9-339b6cf4d8ed', '796ba61d-69a9-4fd5-aa41-6e9e10017d64', '2026-01-07', 1, 'd0a31833-da1f-4423-b47b-f54c9d0fa4ca', 'Database Management', 'assigned', NULL, '2026-01-06 10:45:02.939361+00', '2026-01-06 10:45:02.939361+00'),
	('ac1e79db-df65-4229-9488-f628d7b8542a', 'c16a95cf-6ee5-4aa9-8e47-84fbda49611d', 'ed77a86a-18da-4030-9840-eb29b5d393e3', '51da223b-c1ec-40f6-b0df-eb9c9d0f7378', '50d864a9-5a7b-409a-b0c8-173a0ad7e35c', 'b7664621-8a4a-4775-a73c-999b1c2c690a', '2026-01-07', 4, 'd0a31833-da1f-4423-b47b-f54c9d0fa4ca', 'Web Development', 'assigned', NULL, '2026-01-06 10:45:02.939361+00', '2026-01-06 10:45:02.939361+00'),
	('a5fe0546-713d-4b04-a0f6-969734e1d79c', 'c16a95cf-6ee5-4aa9-8e47-84fbda49611d', '1fa264fc-050a-455e-adf4-9690fdea555f', '0f4b36d3-bebe-456f-8e11-b89a4fe2a723', '8b6dc9cb-adea-49b4-8fd8-ed35a2650fbd', '6663a2d5-f845-418e-8bb9-a346f8572d06', '2026-01-09', 4, 'f2127afa-a906-4b99-918a-7c2d3f8e96d9', 'Machine Design', 'assigned', NULL, '2026-01-08 06:41:41.779665+00', '2026-01-08 06:41:41.779665+00'),
	('f7d13bca-f5ac-4c99-ad83-2cc242614d30', 'c16a95cf-6ee5-4aa9-8e47-84fbda49611d', '1fa264fc-050a-455e-adf4-9690fdea555f', '0f4b36d3-bebe-456f-8e11-b89a4fe2a723', '462572af-66de-43da-97b9-339b6cf4d8ed', '1f0c36b6-e779-498d-84f9-07367d91abb6', '2026-01-09', 5, '420e6c8a-3830-4133-acd8-ec0bbb97f3eb', 'Thermodynamics', 'assigned', NULL, '2026-01-08 06:41:41.779665+00', '2026-01-08 06:41:41.779665+00');


--

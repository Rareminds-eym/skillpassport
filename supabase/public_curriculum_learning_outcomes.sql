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
-- Data for Name: curriculum_learning_outcomes; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."curriculum_learning_outcomes" ("id", "chapter_id", "outcome", "bloom_level", "created_at", "updated_at") VALUES
	('6d57a7c6-a9e3-4873-ba6a-8c7109f47972', 'de71b9e8-1daa-48e9-a41a-4e27424afeb5', 'Students will be able to identify and define variables in algebraic expressions', 'Remember', '2025-12-03 07:08:58.837294', '2025-12-03 07:08:58.837294'),
	('7d80b697-71b5-4d97-bb86-e2365eed5ba1', 'de71b9e8-1daa-48e9-a41a-4e27424afeb5', 'Students will be able to simplify algebraic expressions using basic operations', 'Apply', '2025-12-03 07:10:01.069459', '2025-12-03 07:10:01.069459'),
	('3c45ab52-f124-4f3b-ad12-94c9ae510f23', 'de71b9e8-1daa-48e9-a41a-4e27424afeb5', 'Students will be able to evaluate expressions for given values', 'Apply', '2025-12-03 07:10:43.238331', '2025-12-03 07:10:43.238331'),
	('9b454fd3-52dd-42ae-a5fd-1cab1cee2935', 'b3080a20-918a-4c63-bdef-7900f72c1d12', 'Students will be able to solve linear equations in one variable', 'Apply', '2025-12-03 07:11:25.460773', '2025-12-03 07:11:25.460773'),
	('b27ea30f-1caa-472a-b01b-77b14885bf6e', '47538233-4b5c-43d2-969c-4a176cfa5ac6', 'Students will be able to identify quadratic equations and their standard form', 'Remember', '2025-12-03 07:22:20.783707', '2025-12-03 07:22:20.783707'),
	('871b4c59-31d7-4a21-b56b-79bb8fc9fb8e', '4fc4e80c-a5c6-4fc8-b2cd-1ea610e4fd9e', 'Students will be able to identify and define variables in algebraic expressions', 'Remember', '2025-12-04 06:22:21.550962', '2025-12-04 06:22:21.550962'),
	('cbf56e64-6165-41d0-819b-a16a99afb1e9', '4fc4e80c-a5c6-4fc8-b2cd-1ea610e4fd9e', 'Students will be able to simplify algebraic expressions using basic operations', 'Apply', '2025-12-04 06:22:21.550962', '2025-12-04 06:22:21.550962'),
	('f8598685-f1fb-4e64-9181-883b5d98c697', '4fc4e80c-a5c6-4fc8-b2cd-1ea610e4fd9e', 'Students will be able to evaluate expressions for given values', 'Apply', '2025-12-04 06:22:21.550962', '2025-12-04 06:22:21.550962'),
	('33cf90e1-ab6e-430f-9e63-4b567e2cc73d', '6c81cf7e-2281-4f1c-bbfe-894e1ee4c4c9', 'Students will be able to solve linear equations in one variable', 'Apply', '2025-12-04 06:22:21.550962', '2025-12-04 06:22:21.550962'),
	('afa32d52-fa7b-4b1b-8e0b-286843915219', '60ea8e44-55da-401d-86b7-e32893921251', 'Students will be able to identify quadratic equations and their standard form', 'Remember', '2025-12-04 06:22:21.550962', '2025-12-04 06:22:21.550962'),
	('15f1fb4b-bfe8-4643-a4dd-bc13f7c68a34', 'c81623f0-74c3-45df-b154-33b61dc6f097', 'test', 'Remember', '2026-01-05 11:51:50.122736', '2026-01-05 11:51:50.122736');


--

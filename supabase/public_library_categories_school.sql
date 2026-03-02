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
-- Data for Name: library_categories_school; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."library_categories_school" ("id", "school_id", "name", "description", "color_code", "created_at", "updated_at") VALUES
	('a759fbba-3eaa-486e-beee-78e34b11b8ce', '69cf3489-0046-4414-8acc-409174ffbd2c', 'Academic', 'Academic textbooks and reference materials', '#3B82F6', '2026-01-06 07:49:29.24332+00', '2026-01-06 07:49:29.24332+00'),
	('5879802d-eecc-4b83-9462-7e54a96e3b19', '573efb33-cf08-404f-a0c9-5ae2963f1423', 'Academic', 'Academic textbooks and reference materials', '#3B82F6', '2026-01-06 07:49:29.24332+00', '2026-01-06 07:49:29.24332+00'),
	('a368e2b7-f686-4728-b625-5f0aa698d7e3', '7aa07654-c30f-4b7b-9093-ed29677c7b4c', 'Academic', 'Academic textbooks and reference materials', '#3B82F6', '2026-01-06 07:49:29.24332+00', '2026-01-06 07:49:29.24332+00'),
	('54d71475-de81-4556-af5b-ebde97f70f4d', '19442d7b-ff7f-4c7f-ad85-9e501f122b26', 'Academic', 'Academic textbooks and reference materials', '#3B82F6', '2026-01-06 07:49:29.24332+00', '2026-01-06 07:49:29.24332+00'),
	('01700370-dce1-463a-b3c4-f8d55fda119d', '69cf3489-0046-4414-8acc-409174ffbd2c', 'Fiction', 'Fiction books and novels', '#10B981', '2026-01-06 07:49:29.24332+00', '2026-01-06 07:49:29.24332+00'),
	('a0e82fa0-a718-472a-92f9-0bcd9ebbc678', '573efb33-cf08-404f-a0c9-5ae2963f1423', 'Fiction', 'Fiction books and novels', '#10B981', '2026-01-06 07:49:29.24332+00', '2026-01-06 07:49:29.24332+00'),
	('20971a2e-294a-4191-b37a-0f13caf390d4', '7aa07654-c30f-4b7b-9093-ed29677c7b4c', 'Fiction', 'Fiction books and novels', '#10B981', '2026-01-06 07:49:29.24332+00', '2026-01-06 07:49:29.24332+00'),
	('ead0b957-5339-4a8c-9a02-4b1c1f2592e0', '19442d7b-ff7f-4c7f-ad85-9e501f122b26', 'Fiction', 'Fiction books and novels', '#10B981', '2026-01-06 07:49:29.24332+00', '2026-01-06 07:49:29.24332+00'),
	('7577f8b1-f6d8-4f50-bf7c-35596e535c1b', '69cf3489-0046-4414-8acc-409174ffbd2c', 'Science', 'Science and technology books', '#8B5CF6', '2026-01-06 07:49:29.24332+00', '2026-01-06 07:49:29.24332+00'),
	('a132edf7-cc97-4a54-9935-d8ce92271941', '573efb33-cf08-404f-a0c9-5ae2963f1423', 'Science', 'Science and technology books', '#8B5CF6', '2026-01-06 07:49:29.24332+00', '2026-01-06 07:49:29.24332+00'),
	('40096acd-3c6a-4c04-a5f5-59d98313857e', '7aa07654-c30f-4b7b-9093-ed29677c7b4c', 'Science', 'Science and technology books', '#8B5CF6', '2026-01-06 07:49:29.24332+00', '2026-01-06 07:49:29.24332+00'),
	('943d3951-2b54-4c04-81bf-fd90b652f9c2', '19442d7b-ff7f-4c7f-ad85-9e501f122b26', 'Science', 'Science and technology books', '#8B5CF6', '2026-01-06 07:49:29.24332+00', '2026-01-06 07:49:29.24332+00'),
	('3ba03420-8ef8-4107-ad71-6ee885aecf32', '69cf3489-0046-4414-8acc-409174ffbd2c', 'Reference', 'Reference books and encyclopedias', '#F59E0B', '2026-01-06 07:49:29.24332+00', '2026-01-06 07:49:29.24332+00'),
	('fa1b4301-4b96-40fb-944e-88f068c2ffcb', '573efb33-cf08-404f-a0c9-5ae2963f1423', 'Reference', 'Reference books and encyclopedias', '#F59E0B', '2026-01-06 07:49:29.24332+00', '2026-01-06 07:49:29.24332+00'),
	('9ed730b1-e39b-4b63-a2cc-e5f1d28f981c', '7aa07654-c30f-4b7b-9093-ed29677c7b4c', 'Reference', 'Reference books and encyclopedias', '#F59E0B', '2026-01-06 07:49:29.24332+00', '2026-01-06 07:49:29.24332+00'),
	('21974ba0-695f-455a-924c-3ac64c5c1c1d', '19442d7b-ff7f-4c7f-ad85-9e501f122b26', 'Reference', 'Reference books and encyclopedias', '#F59E0B', '2026-01-06 07:49:29.24332+00', '2026-01-06 07:49:29.24332+00');


--

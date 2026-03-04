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
-- Data for Name: outcome_assessment_mappings; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."outcome_assessment_mappings" ("id", "learning_outcome_id", "assessment_type_id", "weightage", "created_at") VALUES
	('c5938e88-5f32-479a-9c3f-d111fa1bd2a9', '6d57a7c6-a9e3-4873-ba6a-8c7109f47972', '3b9de792-b6bb-4668-a345-9689dee50fb4', 30.00, '2025-12-03 07:08:58.96155'),
	('6ef7d285-9b88-45a0-9784-d08ad1761869', '6d57a7c6-a9e3-4873-ba6a-8c7109f47972', '146df3e3-7139-415b-bf2b-9d2ca38d65e3', 20.00, '2025-12-03 07:08:58.96155'),
	('23f22816-eaf7-4677-b88a-a5e596c6abce', '7d80b697-71b5-4d97-bb86-e2365eed5ba1', '146df3e3-7139-415b-bf2b-9d2ca38d65e3', 30.00, '2025-12-03 07:10:01.161845'),
	('67e9587c-e226-4603-84da-d39240b6efd9', '7d80b697-71b5-4d97-bb86-e2365eed5ba1', '47829f36-289f-4d6c-a2b6-fc473b0d8328', 40.00, '2025-12-03 07:10:01.161845'),
	('b0c2018b-eb3a-43d9-8af0-77f2ef534e5e', '3c45ab52-f124-4f3b-ad12-94c9ae510f23', '3b9de792-b6bb-4668-a345-9689dee50fb4', 40.00, '2025-12-03 07:10:43.338982'),
	('e95d2ca8-d2fc-425c-82ec-daf7eab6f44f', '3c45ab52-f124-4f3b-ad12-94c9ae510f23', '4d0a6393-4100-4ffe-a5cd-ee57d705a692', 30.00, '2025-12-03 07:10:43.338982'),
	('d1769f9e-b5b9-46e2-8f20-0311f983fa46', '9b454fd3-52dd-42ae-a5fd-1cab1cee2935', '146df3e3-7139-415b-bf2b-9d2ca38d65e3', 25.00, '2025-12-03 07:11:25.585128'),
	('d0e5dfbd-f113-4673-9208-507e09a353c9', '9b454fd3-52dd-42ae-a5fd-1cab1cee2935', '4d0a6393-4100-4ffe-a5cd-ee57d705a692', 35.00, '2025-12-03 07:11:25.585128'),
	('2174b18c-8b5f-4db5-b0e1-ec54cc1a1c2e', 'b27ea30f-1caa-472a-b01b-77b14885bf6e', '146df3e3-7139-415b-bf2b-9d2ca38d65e3', 30.00, '2025-12-03 07:22:20.959409'),
	('cd2d4f3b-f713-4895-8d9b-14b1ec36e3be', '871b4c59-31d7-4a21-b56b-79bb8fc9fb8e', '3b9de792-b6bb-4668-a345-9689dee50fb4', 30.00, '2025-12-04 06:22:21.550962'),
	('152ed1fa-f94f-4a3e-b0d5-756fae0f8699', '871b4c59-31d7-4a21-b56b-79bb8fc9fb8e', '146df3e3-7139-415b-bf2b-9d2ca38d65e3', 20.00, '2025-12-04 06:22:21.550962'),
	('1683d367-bcc9-46e5-b058-9a15f7b178f2', 'cbf56e64-6165-41d0-819b-a16a99afb1e9', '146df3e3-7139-415b-bf2b-9d2ca38d65e3', 30.00, '2025-12-04 06:22:21.550962'),
	('3b86791f-8a15-47e4-a8e0-592fdbf4204b', 'cbf56e64-6165-41d0-819b-a16a99afb1e9', '47829f36-289f-4d6c-a2b6-fc473b0d8328', 40.00, '2025-12-04 06:22:21.550962'),
	('c5799365-83a5-4122-a8a3-181cfa40324a', 'f8598685-f1fb-4e64-9181-883b5d98c697', '3b9de792-b6bb-4668-a345-9689dee50fb4', 40.00, '2025-12-04 06:22:21.550962'),
	('1ac58a15-20a2-419f-9acf-69131876eeaf', 'f8598685-f1fb-4e64-9181-883b5d98c697', '4d0a6393-4100-4ffe-a5cd-ee57d705a692', 30.00, '2025-12-04 06:22:21.550962'),
	('974262b1-9f0c-4b8a-9784-4a43b7059a77', '33cf90e1-ab6e-430f-9e63-4b567e2cc73d', '146df3e3-7139-415b-bf2b-9d2ca38d65e3', 25.00, '2025-12-04 06:22:21.550962'),
	('1742fdb9-0604-42f7-b7aa-7052f8f09069', '33cf90e1-ab6e-430f-9e63-4b567e2cc73d', '4d0a6393-4100-4ffe-a5cd-ee57d705a692', 35.00, '2025-12-04 06:22:21.550962'),
	('1cd57922-8156-42a6-882b-4ad5dccb6ee6', 'afa32d52-fa7b-4b1b-8e0b-286843915219', '146df3e3-7139-415b-bf2b-9d2ca38d65e3', 30.00, '2025-12-04 06:22:21.550962'),
	('99ec5899-9c6d-4e7f-865a-61eb062cc5ca', '15f1fb4b-bfe8-4643-a4dd-bc13f7c68a34', '3b9de792-b6bb-4668-a345-9689dee50fb4', 20.00, '2026-01-05 11:51:50.281153');


--

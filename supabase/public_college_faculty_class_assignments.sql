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
-- Data for Name: college_faculty_class_assignments; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."college_faculty_class_assignments" ("id", "college_id", "faculty_id", "class_id", "subject_name", "is_class_teacher", "academic_year", "created_at", "updated_at") VALUES
	('86369e50-b929-48d0-af96-c8a6135a0426', 'c16a95cf-6ee5-4aa9-8e47-84fbda49611d', '50d864a9-5a7b-409a-b0c8-173a0ad7e35c', 'ce94606a-f760-4f12-85ca-2fb04f5d677a', 'Data Structures', true, '2025-2026', '2026-01-06 10:35:24.105914+00', '2026-01-06 10:35:24.105914+00'),
	('19c9de67-5c8a-440c-ba1c-5565770c8658', 'c16a95cf-6ee5-4aa9-8e47-84fbda49611d', '50d864a9-5a7b-409a-b0c8-173a0ad7e35c', 'c42d7078-aaf8-49f2-bd08-02ddcabf2105', 'Data Structures', false, '2025-2026', '2026-01-06 10:35:24.105914+00', '2026-01-06 10:35:24.105914+00'),
	('a9ab8b08-1068-4f30-afae-cd156b48c9b6', 'c16a95cf-6ee5-4aa9-8e47-84fbda49611d', '50d864a9-5a7b-409a-b0c8-173a0ad7e35c', 'd4aa44d6-e969-44a3-8327-500fae11681a', 'Algorithms', false, '2025-2026', '2026-01-06 10:35:24.105914+00', '2026-01-06 10:35:24.105914+00'),
	('80b7290f-e6f7-43bf-9755-3dac921faa4c', 'c16a95cf-6ee5-4aa9-8e47-84fbda49611d', '462572af-66de-43da-97b9-339b6cf4d8ed', '298c9227-8aa1-4ff0-b162-41b9b03765a0', 'Digital Electronics', true, '2025-2026', '2026-01-06 10:35:24.105914+00', '2026-01-06 10:35:24.105914+00'),
	('717e37b8-c4e5-4d27-b0e6-3eb72b76d047', 'c16a95cf-6ee5-4aa9-8e47-84fbda49611d', '462572af-66de-43da-97b9-339b6cf4d8ed', '502cd692-0e35-46ed-a73b-709252799ac5', 'VLSI Design', false, '2025-2026', '2026-01-06 10:35:24.105914+00', '2026-01-06 10:35:24.105914+00'),
	('6f5d3860-51ff-46d6-945b-885821a0a203', 'c16a95cf-6ee5-4aa9-8e47-84fbda49611d', '51da223b-c1ec-40f6-b0df-eb9c9d0f7378', '81641be7-39f7-4c0d-8ae7-3225fcb36d36', 'Database Management', true, '2025-2026', '2026-01-06 10:35:24.105914+00', '2026-01-06 10:35:24.105914+00'),
	('fd3761ab-0e09-452e-8203-0a0698181d90', 'c16a95cf-6ee5-4aa9-8e47-84fbda49611d', '51da223b-c1ec-40f6-b0df-eb9c9d0f7378', 'ce94606a-f760-4f12-85ca-2fb04f5d677a', 'Programming Fundamentals', false, '2025-2026', '2026-01-06 10:35:24.105914+00', '2026-01-06 10:35:24.105914+00'),
	('2ebafd2a-2514-4f29-8233-210e4b8b69e2', 'c16a95cf-6ee5-4aa9-8e47-84fbda49611d', '54a57877-67e3-49d6-8453-7c128ce4e286', '0d46851d-20b9-4d18-b95a-a5f0a3c4d90b', 'Computer Applications', true, '2025-2026', '2026-01-06 10:35:24.105914+00', '2026-01-06 10:35:24.105914+00'),
	('c27a98b4-52ad-46a7-b043-9877fb06a6e5', 'c16a95cf-6ee5-4aa9-8e47-84fbda49611d', '452ce095-5aa9-478e-aedc-fdfa4fa82365', 'd0a31833-da1f-4423-b47b-f54c9d0fa4ca', 'Management Principles', true, '2025-2026', '2026-01-06 10:35:24.105914+00', '2026-01-06 10:35:24.105914+00'),
	('b2c5879a-2c39-4f3f-b9de-091ab5994a0e', 'c16a95cf-6ee5-4aa9-8e47-84fbda49611d', '452ce095-5aa9-478e-aedc-fdfa4fa82365', '56081e3a-56da-40e5-ac18-6cb3530bcafd', 'Strategic Management', false, '2025-2026', '2026-01-06 10:35:24.105914+00', '2026-01-06 10:35:24.105914+00'),
	('5b48b65e-e8e6-4b99-bae1-bd4ea2d68a4e', 'c16a95cf-6ee5-4aa9-8e47-84fbda49611d', '0f4b36d3-bebe-456f-8e11-b89a4fe2a723', '420e6c8a-3830-4133-acd8-ec0bbb97f3eb', NULL, false, NULL, '2026-01-08 06:07:53.293648+00', '2026-01-08 06:07:53.293648+00'),
	('4c8c667a-0f2c-4ae5-b815-d7f936d31079', 'c16a95cf-6ee5-4aa9-8e47-84fbda49611d', '0f4b36d3-bebe-456f-8e11-b89a4fe2a723', 'f2127afa-a906-4b99-918a-7c2d3f8e96d9', NULL, false, NULL, '2026-01-08 06:07:53.293648+00', '2026-01-08 06:07:53.293648+00'),
	('b92fd645-d909-4a54-8877-2fe74b367357', 'c16a95cf-6ee5-4aa9-8e47-84fbda49611d', '0f4b36d3-bebe-456f-8e11-b89a4fe2a723', 'de32a194-f16c-4e15-aaa4-e29b66991c60', NULL, false, NULL, '2026-01-08 06:07:53.293648+00', '2026-01-08 06:07:53.293648+00'),
	('6fb09beb-37d7-4a83-b9ac-fdc858ecece5', 'c16a95cf-6ee5-4aa9-8e47-84fbda49611d', '0f4b36d3-bebe-456f-8e11-b89a4fe2a723', '0d46851d-20b9-4d18-b95a-a5f0a3c4d90b', NULL, false, NULL, '2026-01-08 06:07:53.293648+00', '2026-01-08 06:07:53.293648+00');


--

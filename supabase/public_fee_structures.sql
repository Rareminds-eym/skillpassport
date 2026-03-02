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
-- Data for Name: fee_structures; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."fee_structures" ("id", "program_id", "program_name", "semester", "academic_year", "category", "quota", "fee_heads", "total_amount", "due_schedule", "scholarship_applicable", "scholarship_amount", "discount_percentage", "is_active", "effective_from", "effective_to", "created_by", "approved_by", "created_at", "updated_at", "college_id") VALUES
	('6c29e47e-bb86-41e9-b194-4345b3c087d5', 'f292fa81-ebe8-418f-aa24-bf70a6f218ca', 'Bachelor of Technology in Mechanical', 1, '2026-2027', 'General', 'Merit', '[{"name": "Tuition Fee", "amount": 35000, "is_mandatory": true}]', 35000.00, '[{"amount": 17500, "due_date": "2026-01-31", "installment": 1}, {"amount": 17500, "due_date": "2026-01-08", "installment": 2}]', true, 5000.00, 0.00, true, '2026-01-05', '2026-01-14', '91bf6be4-31a5-4d6a-853d-675596755cee', NULL, '2026-01-05 10:05:52.016018+00', '2026-01-05 10:06:00.265964+00', 'c16a95cf-6ee5-4aa9-8e47-84fbda49611d'),
	('6ed6a921-1757-4469-b23b-9393a1c0003c', '8c87b29f-004e-4a7c-96d4-4b37c1325a56', 'Master of Technology in Computer Science', 3, '2026-2027', 'General', 'Merit', '[{"name": "Tuition Fee", "amount": 45000, "is_mandatory": true}]', 45000.00, '[]', false, 0.00, 0.00, true, '2026-01-05', '2026-01-14', '91bf6be4-31a5-4d6a-853d-675596755cee', NULL, '2026-01-05 10:27:35.271284+00', '2026-01-06 03:31:27.765791+00', 'c16a95cf-6ee5-4aa9-8e47-84fbda49611d'),
	('d7381799-23e6-41d3-9a2f-dc789e4a13ef', '1b729bdb-3004-4ff4-a446-7fb6c52d7e72', 'Bachelor of Technology in Computer Science', 1, '2025-2026', 'General', 'Management', '[{"name": "Sports Fee", "amount": 234, "is_mandatory": true}]', 234.00, '[]', false, 0.00, 0.00, true, '2025-12-23', '2025-12-24', '91bf6be4-31a5-4d6a-853d-675596755cee', NULL, '2025-12-23 04:29:47.629939+00', '2026-01-06 09:04:28.213779+00', 'c16a95cf-6ee5-4aa9-8e47-84fbda49611d');


--

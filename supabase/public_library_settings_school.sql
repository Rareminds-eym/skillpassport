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
-- Data for Name: library_settings_school; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."library_settings_school" ("id", "school_id", "setting_key", "setting_value", "description", "created_at", "updated_at") VALUES
	('6926912a-fe1b-4fe8-884e-2583e97ab1ce', '69cf3489-0046-4414-8acc-409174ffbd2c', 'default_loan_period_days', '14', 'Default loan period in days for books', '2026-01-06 07:49:18.056914+00', '2026-01-06 07:49:18.056914+00'),
	('b25f76b1-cdf7-48a5-91fe-ca455b42f2ea', '573efb33-cf08-404f-a0c9-5ae2963f1423', 'default_loan_period_days', '14', 'Default loan period in days for books', '2026-01-06 07:49:18.056914+00', '2026-01-06 07:49:18.056914+00'),
	('7b0fc253-9782-42fd-8388-63cf6a0a6a99', '7aa07654-c30f-4b7b-9093-ed29677c7b4c', 'default_loan_period_days', '14', 'Default loan period in days for books', '2026-01-06 07:49:18.056914+00', '2026-01-06 07:49:18.056914+00'),
	('2b354716-0e9d-4560-98ec-de6481e9f249', '19442d7b-ff7f-4c7f-ad85-9e501f122b26', 'default_loan_period_days', '14', 'Default loan period in days for books', '2026-01-06 07:49:18.056914+00', '2026-01-06 07:49:18.056914+00'),
	('82bc006e-8ed7-4f5d-bc21-c9952390c8b2', '69cf3489-0046-4414-8acc-409174ffbd2c', 'fine_per_day', '10', 'Fine amount per day for overdue books in rupees', '2026-01-06 07:49:18.056914+00', '2026-01-06 07:49:18.056914+00'),
	('360a396f-e603-403e-b9ca-a0c1533108f3', '573efb33-cf08-404f-a0c9-5ae2963f1423', 'fine_per_day', '10', 'Fine amount per day for overdue books in rupees', '2026-01-06 07:49:18.056914+00', '2026-01-06 07:49:18.056914+00'),
	('2a0a557d-5b57-4718-9310-eb39e5d13d07', '7aa07654-c30f-4b7b-9093-ed29677c7b4c', 'fine_per_day', '10', 'Fine amount per day for overdue books in rupees', '2026-01-06 07:49:18.056914+00', '2026-01-06 07:49:18.056914+00'),
	('e0c28b0d-bbd7-4456-95ce-37974e8e6a3f', '19442d7b-ff7f-4c7f-ad85-9e501f122b26', 'fine_per_day', '10', 'Fine amount per day for overdue books in rupees', '2026-01-06 07:49:18.056914+00', '2026-01-06 07:49:18.056914+00'),
	('6a2feee4-0fad-4aa9-b594-997014be8ec7', '69cf3489-0046-4414-8acc-409174ffbd2c', 'max_books_per_student', '3', 'Maximum number of books a student can borrow at once', '2026-01-06 07:49:18.056914+00', '2026-01-06 07:49:18.056914+00'),
	('233f65fb-08f0-4b5a-93f6-59ff1aebc6dd', '573efb33-cf08-404f-a0c9-5ae2963f1423', 'max_books_per_student', '3', 'Maximum number of books a student can borrow at once', '2026-01-06 07:49:18.056914+00', '2026-01-06 07:49:18.056914+00'),
	('c50ed8e9-b40f-4789-900a-ff8e464d044e', '7aa07654-c30f-4b7b-9093-ed29677c7b4c', 'max_books_per_student', '3', 'Maximum number of books a student can borrow at once', '2026-01-06 07:49:18.056914+00', '2026-01-06 07:49:18.056914+00'),
	('2db323ae-b956-4e70-84ce-028ccf264c3c', '19442d7b-ff7f-4c7f-ad85-9e501f122b26', 'max_books_per_student', '3', 'Maximum number of books a student can borrow at once', '2026-01-06 07:49:18.056914+00', '2026-01-06 07:49:18.056914+00');


--

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
-- Data for Name: curriculum_academic_years; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."curriculum_academic_years" ("id", "school_id", "year", "start_date", "end_date", "is_active", "is_current", "created_at", "updated_at") VALUES
	('3e120456-59c3-4c8f-8175-2eb4728306ca', '69cf3489-0046-4414-8acc-409174ffbd2c', '2026-2027', '2026-04-01', '2027-03-31', true, false, '2025-12-03 04:45:27.892556', '2025-12-03 05:49:40.482214'),
	('42a4ad14-4e7f-49a3-854b-ad11f90b0345', '69cf3489-0046-4414-8acc-409174ffbd2c', '2024-2025', '2024-04-01', '2025-03-31', true, true, '2025-12-03 04:45:27.892556', '2025-12-03 05:49:44.88187'),
	('775711e7-c985-487e-b27a-bc4b423b6ddc', '69cf3489-0046-4414-8acc-409174ffbd2c', '2023-2024', '2023-04-01', '2024-03-31', true, false, '2025-12-03 04:45:27.892556', '2025-12-03 05:49:48.889039'),
	('9b2510b6-926c-413c-99fe-ee8d643f7b43', '69cf3489-0046-4414-8acc-409174ffbd2c', '2025-2026', '2025-04-01', '2026-03-31', true, false, '2025-12-03 04:45:27.892556', '2025-12-03 05:49:52.804387'),
	('bfd8bc9e-3f10-4608-b5b3-aeb41fc41677', '69cf3489-0046-4414-8acc-409174ffbd2c', '2027-2028', '2027-04-01', '2028-03-31', true, false, '2025-12-03 04:45:27.892556', '2025-12-03 05:49:56.094792');


--

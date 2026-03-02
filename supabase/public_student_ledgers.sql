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
-- Data for Name: student_ledgers; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."student_ledgers" ("id", "student_id", "student_name", "roll_number", "fee_structure_id", "fee_head_id", "fee_head_name", "due_amount", "paid_amount", "due_date", "installment_number", "payment_status", "is_overdue", "late_fee_amount", "late_fee_waived", "waiver_amount", "waiver_reason", "waived_by", "waived_at", "created_at", "updated_at", "student_record_id", "college_id") VALUES
	('6697a7eb-e5e6-494d-bcbf-a048b3788c10', 'e463ce28-ce47-4dc2-ab1f-dbf1219e9443', 'Mahima Roy', 'CSTU517', '6ed6a921-1757-4469-b23b-9393a1c0003c', 'TUITION', 'Tuition Fee', 50000.00, 0.00, '2026-03-31', 1, 'pending', false, 0.00, false, 0.00, NULL, NULL, NULL, '2026-01-06 04:34:54.231495+00', '2026-01-06 04:34:54.231495+00', 'e463ce28-ce47-4dc2-ab1f-dbf1219e9443', 'c16a95cf-6ee5-4aa9-8e47-84fbda49611d');


--

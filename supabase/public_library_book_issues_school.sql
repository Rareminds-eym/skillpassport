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
-- Data for Name: library_book_issues_school; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."library_book_issues_school" ("id", "school_id", "book_id", "student_id", "student_name", "roll_number", "class", "academic_year", "issue_date", "due_date", "return_date", "status", "fine_amount", "fine_paid", "remarks", "issued_by", "returned_by", "created_at", "updated_at") VALUES
	('05226b08-9514-4a82-ad40-1359816a83ae', '69cf3489-0046-4414-8acc-409174ffbd2c', 'b3f95ea8-d60d-4cfe-ad95-82ec964b53da', '6fd75f6c-7a74-4e0e-96b2-58d22a5bfb5e', 'Arjun Reddy', '3', '12', '2026', '2026-01-06', '2026-01-20', '2026-01-06', 'returned', 0.00, false, NULL, 'Admin', 'Admin', '2026-01-06 08:50:06.296173+00', '2026-01-06 08:50:06.296173+00'),
	('51f8286d-e5e5-463a-818d-530a4308b375', '69cf3489-0046-4414-8acc-409174ffbd2c', 'b3f95ea8-d60d-4cfe-ad95-82ec964b53da', 'ab46b2ac-9922-4569-adc6-73eb6b645202', 'Meera Krishnan', '', '10', '2026', '2026-01-06', '2026-01-20', '2026-01-06', 'returned', 0.00, false, NULL, 'Admin', 'Admin', '2026-01-06 08:52:09.503643+00', '2026-01-06 08:52:09.503643+00'),
	('64a130cf-3f45-4a25-8a58-05471830ebb7', '69cf3489-0046-4414-8acc-409174ffbd2c', '02766435-17af-4746-9561-e67567659937', 'af458842-8d2a-4da3-95b0-41ccecbf18f2', 'Leo Mathew', '10B-040', '11', '2026', '2026-01-06', '2026-01-20', NULL, 'issued', 0.00, false, NULL, 'Admin', NULL, '2026-01-06 09:32:09.084256+00', '2026-01-06 09:32:09.084256+00'),
	('efb5d868-233a-490f-a102-6f828d090c2e', '69cf3489-0046-4414-8acc-409174ffbd2c', 'b3f95ea8-d60d-4cfe-ad95-82ec964b53da', 'ab46b2ac-9922-4569-adc6-73eb6b645202', 'Meera Krishnan', '', '10', '2026', '2026-01-06', '2026-01-20', '2026-01-06', 'returned', 0.00, false, NULL, 'Admin', 'Admin', '2026-01-06 10:08:51.171601+00', '2026-01-06 10:08:51.171601+00'),
	('b584e38d-15b6-4a91-ba93-391b6a051876', '69cf3489-0046-4414-8acc-409174ffbd2c', 'b3f95ea8-d60d-4cfe-ad95-82ec964b53da', 'a8f591a4-3f09-4629-a7cd-c65a56b323b4', 'Arjun Desai', '10B-041', '10', '2026', '2026-01-06', '2026-01-20', '2026-01-06', 'returned', 0.00, false, NULL, 'Admin', 'Admin', '2026-01-06 08:51:55.839848+00', '2026-01-06 08:51:55.839848+00'),
	('d9f1197d-0cbe-4fab-b445-b23edb49f4cc', '69cf3489-0046-4414-8acc-409174ffbd2c', 'b3f95ea8-d60d-4cfe-ad95-82ec964b53da', 'af458842-8d2a-4da3-95b0-41ccecbf18f2', 'Leo Mathew', '10B-040', '11', '2026', '2026-01-06', '2026-01-20', NULL, 'issued', 0.00, false, NULL, 'Admin', NULL, '2026-01-06 11:32:04.368133+00', '2026-01-06 11:32:04.368133+00');


--

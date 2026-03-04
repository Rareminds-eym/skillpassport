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
-- Data for Name: library_book_issues_college; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."library_book_issues_college" ("id", "college_id", "book_id", "student_id", "student_name", "roll_number", "class", "academic_year", "issue_date", "due_date", "return_date", "status", "fine_amount", "fine_paid", "remarks", "issued_by", "returned_by", "created_at", "updated_at") VALUES
	('f4ed3cfa-867a-4bd2-92c1-3d65587f956f', '659ebe4b-bdae-40c8-901f-2fed3c221574', '5c7043c0-9ee8-4dc3-973a-f946165f29c9', 'STD-123133', 'Johan', '123133', '9', '2025', '2026-01-03', '2026-01-17', '2026-01-03', 'returned', 0.00, false, NULL, NULL, NULL, '2026-01-03 09:20:50.127235+00', '2026-01-03 09:38:50.989634+00'),
	('45b03161-488e-478f-bc67-4b28f682733c', '659ebe4b-bdae-40c8-901f-2fed3c221574', '5c7043c0-9ee8-4dc3-973a-f946165f29c9', 'STD-8974', 'Snow', '8974', '8', '2025', '2026-01-03', '2026-01-17', '2026-01-03', 'returned', 0.00, false, NULL, NULL, NULL, '2026-01-03 09:22:09.285174+00', '2026-01-03 09:42:13.00069+00'),
	('f6050c7d-33b8-4de6-a25b-9d0bc1f33fe1', '659ebe4b-bdae-40c8-901f-2fed3c221574', '5c7043c0-9ee8-4dc3-973a-f946165f29c9', 'STD-3454', 'John', '3454', '9', '2025', '2026-01-03', '2026-01-17', NULL, 'issued', 0.00, false, NULL, NULL, NULL, '2026-01-03 09:43:42.996874+00', '2026-01-03 09:43:42.996874+00'),
	('ca2be134-1499-4f13-b797-4d9043767093', '659ebe4b-bdae-40c8-901f-2fed3c221574', '88e69ac1-ca94-4432-bc07-d6bc04a9db91', '30845db2-bb6a-470c-840a-28208b26805c', 'Amit Kumar', 'ADC2024003', '', '2026', '2026-01-05', '2026-01-19', NULL, 'issued', 0.00, false, NULL, NULL, NULL, '2026-01-05 06:28:08.976029+00', '2026-01-05 06:28:08.976029+00'),
	('4ed1df2d-9cbe-482b-b86d-d896a479da9f', '659ebe4b-bdae-40c8-901f-2fed3c221574', '5c7043c0-9ee8-4dc3-973a-f946165f29c9', 'STD-1232', 'Ana', '1232', '6', '2025', '2026-01-03', '2026-01-17', '2026-01-05', 'returned', 0.00, false, NULL, NULL, NULL, '2026-01-03 09:42:57.736745+00', '2026-01-05 07:27:12.599088+00'),
	('91c5410a-7ab7-4b94-922c-ff0de55e3938', '659ebe4b-bdae-40c8-901f-2fed3c221574', '01c5ed07-929c-4acf-b84b-a8a9ddb564d4', '30845db2-bb6a-470c-840a-28208b26805c', 'Amit Kumar', 'ADC2024003', '', '2026', '2026-01-05', '2026-01-19', NULL, 'issued', 0.00, false, NULL, NULL, NULL, '2026-01-05 07:30:24.961615+00', '2026-01-05 07:30:24.961615+00'),
	('8fdbecef-b8c8-4b61-918d-01702c30d2ee', 'c16a95cf-6ee5-4aa9-8e47-84fbda49611d', '653f0096-e99c-4eeb-a9b6-cbef2fcd55e9', '1b546e01-b1ca-48e7-9054-f53bd700ae7f', 'Harini S', '1b546e01-b1ca-48e7-9054-f53bd700ae7f', 'UG', '2026', '2026-01-10', '2026-01-24', NULL, 'issued', 0.00, false, NULL, NULL, NULL, '2026-01-10 04:43:00.20904+00', '2026-01-10 04:43:00.20904+00');


--

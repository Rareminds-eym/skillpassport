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
-- Data for Name: library_books_college; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."library_books_college" ("id", "college_id", "title", "author", "isbn", "total_copies", "available_copies", "status", "category", "publisher", "publication_year", "description", "location_shelf", "created_at", "updated_at") VALUES
	('ee2c951c-05c6-42ca-bec7-08416b1aa897', '659ebe4b-bdae-40c8-901f-2fed3c221574', 'Mathematics Grade 8', 'R.S. Sharma', '9781234567890', 5, 5, 'available', 'Academic', 'Academic Publishers', 2023, 'Comprehensive mathematics textbook for grade 8 students', 'A1-B2', '2026-01-03 08:56:35.088498+00', '2026-01-03 08:56:35.088498+00'),
	('977e7d32-6736-464c-b635-33d958b284e3', '659ebe4b-bdae-40c8-901f-2fed3c221574', 'Science Grade 9', 'S. Gupta', '9789876543210', 3, 3, 'available', 'Academic', 'Science Publications', 2023, 'Complete science curriculum for grade 9', 'A2-B1', '2026-01-03 08:56:35.088498+00', '2026-01-03 08:56:35.088498+00'),
	('3c2a80cd-e1b0-4f21-aeb4-ef984d301a8c', '659ebe4b-bdae-40c8-901f-2fed3c221574', 'English Grammar', 'L. Roy', '9781122334455', 4, 4, 'available', 'Academic', 'Language Press', 2022, 'Essential English grammar for students', 'B1-C2', '2026-01-03 08:56:35.088498+00', '2026-01-03 08:56:35.088498+00'),
	('443b6bd6-4ba0-463d-a51b-4f5d10610aaa', '659ebe4b-bdae-40c8-901f-2fed3c221574', 'History of India', 'A. Singh', '9782233445566', 2, 2, 'available', 'Academic', 'Historical Books Ltd', 2023, 'Comprehensive Indian history textbook', 'C1-D1', '2026-01-03 08:56:35.088498+00', '2026-01-03 08:56:35.088498+00'),
	('8460d015-42e6-4e70-a694-b10f6a018323', '659ebe4b-bdae-40c8-901f-2fed3c221574', 'Geography Basics', 'M. Patel', '9783344556677', 6, 6, 'available', 'Academic', 'Geo Publications', 2023, 'Introduction to geography concepts', 'C2-D2', '2026-01-03 08:56:35.088498+00', '2026-01-03 08:56:35.088498+00'),
	('71cad444-a4e4-4479-b2e5-c3d4605abcbf', '659ebe4b-bdae-40c8-901f-2fed3c221574', 'Physics Grade 10', 'S. Kumar', '9784455667788', 3, 3, 'available', 'Academic', 'Physics World', 2023, 'Advanced physics for grade 10 students', 'D1-E1', '2026-01-03 08:56:35.088498+00', '2026-01-03 08:56:35.088498+00'),
	('113265bd-5c61-4b50-b0b9-e2671f528ba7', '659ebe4b-bdae-40c8-901f-2fed3c221574', 'Chemistry Grade 10', 'R. Das', '9785566778899', 5, 5, 'available', 'Academic', 'Chem Books', 2023, 'Organic and inorganic chemistry', 'D2-E2', '2026-01-03 08:56:35.088498+00', '2026-01-03 08:56:35.088498+00'),
	('1748796c-d1b4-4a54-8a56-46b160038449', '659ebe4b-bdae-40c8-901f-2fed3c221574', 'Maths', 'Rd Sharma', '1234567890', 1, 1, 'available', 'Academic', 'Varma', 2026, 'Maths is easy', 'A1-B2', '2026-01-03 09:19:14.516559+00', '2026-01-03 09:19:14.516559+00'),
	('2ec7f937-d38d-41c3-85a3-5abe4adbbf82', '659ebe4b-bdae-40c8-901f-2fed3c221574', 'Maths', 'RD SHarama', '1234567890167', 1, 1, 'available', 'Academic', 'VK', 2026, 'Maths is easy
', 'A1-B1', '2026-01-03 09:28:06.876825+00', '2026-01-03 09:28:06.876825+00'),
	('88e69ac1-ca94-4432-bc07-d6bc04a9db91', '659ebe4b-bdae-40c8-901f-2fed3c221574', 'Environmental Studies', 'P. Jain', '9788899001122', 3, 2, 'available', 'Academic', 'Green Earth Books', 2023, 'Environmental awareness and conservation', 'G1-H1', '2026-01-03 08:56:35.088498+00', '2026-01-05 06:28:08.976029+00'),
	('5c7043c0-9ee8-4dc3-973a-f946165f29c9', '659ebe4b-bdae-40c8-901f-2fed3c221574', 'Computer Science Basics', 'V. Sharma', '9787788990011', 2, 1, 'available', 'Academic', 'Tech Publications', 2023, 'Introduction to computer programming', 'F1-G1', '2026-01-03 08:56:35.088498+00', '2026-01-05 07:27:12.599088+00'),
	('01c5ed07-929c-4acf-b84b-a8a9ddb564d4', '659ebe4b-bdae-40c8-901f-2fed3c221574', 'Math', 'RD Sharma', '1234567890123', 1, 0, 'all_issued', '', '', 2026, '', '', '2026-01-03 09:16:47.221501+00', '2026-01-05 07:30:24.961615+00'),
	('236bfc96-6e10-446a-965e-b93011f8eec5', '659ebe4b-bdae-40c8-901f-2fed3c221574', 'Python', 'Sunita', '9638527410852', 1, 1, 'available', 'Academic', 'SK ', 2026, '', 'E1-D2', '2026-01-05 08:55:38.443195+00', '2026-01-05 08:55:38.443195+00'),
	('653f0096-e99c-4eeb-a9b6-cbef2fcd55e9', 'c16a95cf-6ee5-4aa9-8e47-84fbda49611d', 'React', 'None', 'REACT12', 1, 0, 'all_issued', 'Academic', 'Karthik', 2026, '', '', '2026-01-10 04:41:45.98622+00', '2026-01-10 04:43:00.20904+00');


--

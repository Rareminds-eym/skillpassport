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
-- Data for Name: library_books; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."library_books" ("id", "book_id", "isbn", "isbn13", "title", "subtitle", "author", "co_authors", "publisher", "edition", "publication_year", "language", "category", "sub_category", "subject", "department_id", "pages", "binding_type", "dimensions", "weight", "total_copies", "available_copies", "damaged_copies", "lost_copies", "location", "rack_number", "floor", "section", "price", "currency", "acquisition_date", "acquisition_type", "vendor_name", "bill_number", "description", "keywords", "table_of_contents", "cover_image_url", "ebook_url", "has_ebook", "status", "is_reference_only", "is_popular", "average_rating", "total_reviews", "total_issues", "total_reservations", "last_issued_date", "created_by", "created_at", "updated_at", "college_id") VALUES
	('c8359016-13c8-4455-a5de-3459289d3152', 'BK-001', '978-0123456789', NULL, 'Introduction to Computer Science', NULL, 'John Smith', NULL, 'Tech Publications', NULL, 2023, 'English', 'Academic', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 5, 5, 0, 0, 'Main Library', NULL, NULL, NULL, NULL, 'INR', NULL, NULL, NULL, NULL, 'Comprehensive guide to computer science fundamentals', NULL, NULL, NULL, NULL, false, 'available', false, false, 0.0, 0, 0, 0, NULL, NULL, '2026-01-05 04:26:05.537241+00', '2026-01-05 04:26:05.537241+00', 'c16a95cf-6ee5-4aa9-8e47-84fbda49611d'),
	('a5888b4b-d128-4459-b3b9-f0c7232e643a', 'BK-002', '978-0987654321', NULL, 'Data Structures and Algorithms', NULL, 'Jane Doe', NULL, 'CS Press', NULL, 2022, 'English', 'Academic', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 3, 3, 0, 0, 'Main Library', NULL, NULL, NULL, NULL, 'INR', NULL, NULL, NULL, NULL, 'Essential algorithms and data structures', NULL, NULL, NULL, NULL, false, 'available', false, false, 0.0, 0, 0, 0, NULL, NULL, '2026-01-05 04:26:05.537241+00', '2026-01-05 04:26:05.537241+00', 'c16a95cf-6ee5-4aa9-8e47-84fbda49611d'),
	('c2848d8f-4fb3-4a5e-add1-086079646420', 'BK-003', '978-0456789123', NULL, 'Web Development Basics', NULL, 'Bob Johnson', NULL, 'Web Publishers', NULL, 2023, 'English', 'Academic', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 4, 4, 0, 0, 'Main Library', NULL, NULL, NULL, NULL, 'INR', NULL, NULL, NULL, NULL, 'Learn HTML, CSS, and JavaScript', NULL, NULL, NULL, NULL, false, 'available', false, false, 0.0, 0, 0, 0, NULL, NULL, '2026-01-05 04:26:05.537241+00', '2026-01-05 04:26:05.537241+00', 'c16a95cf-6ee5-4aa9-8e47-84fbda49611d'),
	('669008ab-cd77-4ed6-b9aa-8d1d4e721ded', 'BK-004', '978-0321654987', NULL, 'Database Management Systems', NULL, 'Alice Brown', NULL, 'DB Publications', NULL, 2021, 'English', 'Academic', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 2, 2, 0, 0, 'Main Library', NULL, NULL, NULL, NULL, 'INR', NULL, NULL, NULL, NULL, 'Complete guide to database systems', NULL, NULL, NULL, NULL, false, 'available', false, false, 0.0, 0, 0, 0, NULL, NULL, '2026-01-05 04:26:05.537241+00', '2026-01-05 04:26:05.537241+00', 'c16a95cf-6ee5-4aa9-8e47-84fbda49611d'),
	('6922244a-fb02-499c-9221-39240c790f38', 'BK-005', '978-0743273565', NULL, 'The Great Gatsby', NULL, 'F. Scott Fitzgerald', NULL, 'Scribner', NULL, 1925, 'English', 'Fiction', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 3, 3, 0, 0, 'Main Library', NULL, NULL, NULL, NULL, 'INR', NULL, NULL, NULL, NULL, 'Classic American novel', NULL, NULL, NULL, NULL, false, 'available', false, false, 0.0, 0, 0, 0, NULL, NULL, '2026-01-05 04:26:05.537241+00', '2026-01-05 04:26:05.537241+00', 'c16a95cf-6ee5-4aa9-8e47-84fbda49611d');


--

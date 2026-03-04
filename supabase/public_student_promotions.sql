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
-- Data for Name: student_promotions; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."student_promotions" ("id", "student_id", "academic_year", "from_grade", "to_grade", "school_id", "college_id", "overall_percentage", "overall_grade", "overall_grade_point", "total_marks_obtained", "total_max_marks", "is_passed", "is_promoted", "is_detained", "is_compartment", "compartment_subjects", "promotion_date", "promotion_order_number", "promoted_by", "remarks", "attendance_percentage", "conduct_grade", "created_at", "updated_at") VALUES
	('846f677f-3b6a-43f6-b60a-f6a2cc5705e6', 'af458842-8d2a-4da3-95b0-41ccecbf18f2', '2024-2025', '10', '11', NULL, NULL, 85.50, 'A', NULL, 855.00, 1000.00, true, true, false, false, '[]', '2025-04-15', NULL, NULL, 'Promoted with distinction', 92.50, NULL, '2026-01-05 05:27:37.671079+00', '2026-01-05 05:27:37.671079+00'),
	('4dcbad20-ead2-4285-8f82-4ff6cde8ba6a', '059af805-8f27-4b71-96af-f9e0acbd5884', '2026-27', '1', '2', NULL, 'c16a95cf-6ee5-4aa9-8e47-84fbda49611d', 86.50, 'A', 8.65, NULL, NULL, true, true, false, false, '[]', '2026-01-06', NULL, NULL, 'Promoted via admin panel from semester 1 to 2', NULL, NULL, '2026-01-06 04:06:22.793037+00', '2026-01-06 04:06:22.793037+00'),
	('e20fef56-5503-4f6c-bbc9-37f56003a9a8', '3eeec2a6-eb85-49ef-a6d6-772efd32c149', '2026-27', '2', '3', NULL, 'c16a95cf-6ee5-4aa9-8e47-84fbda49611d', 94.60, 'A', 9.46, NULL, NULL, true, true, false, false, '[]', '2026-01-06', NULL, NULL, 'Promoted via admin panel from semester 2 to 3', NULL, NULL, '2026-01-06 04:07:12.082202+00', '2026-01-06 04:07:12.082202+00'),
	('bb3aae78-b72b-4f7d-8787-c8fa947586a1', '1b546e01-b1ca-48e7-9054-f53bd700ae7f', '2024-25', '1', '2', NULL, 'c16a95cf-6ee5-4aa9-8e47-84fbda49611d', 90.60, 'A', 9.06, NULL, NULL, true, true, false, false, '[]', '2026-01-06', NULL, NULL, 'Promoted via admin panel from semester 1 to 2 for academic year 2024-25', NULL, NULL, '2026-01-06 06:23:35.489505+00', '2026-01-06 06:23:35.489505+00'),
	('782abef6-9ed1-4d18-b1dc-73bbb4e0ac10', '1b546e01-b1ca-48e7-9054-f53bd700ae7f', '2025-26', '2', '3', NULL, 'c16a95cf-6ee5-4aa9-8e47-84fbda49611d', 90.60, 'A', 9.06, NULL, NULL, true, true, false, false, '[]', '2026-01-06', NULL, NULL, 'Promoted via admin panel from semester 2 to 3 for academic year 2025-26', NULL, NULL, '2026-01-06 06:29:56.428485+00', '2026-01-06 06:29:56.428485+00'),
	('4d779185-5035-46b3-b041-ff51986fa1d0', '1b546e01-b1ca-48e7-9054-f53bd700ae7f', '2027-28', '3', '4', NULL, 'c16a95cf-6ee5-4aa9-8e47-84fbda49611d', 90.60, 'A', 9.06, NULL, NULL, true, true, false, false, '[]', '2026-01-06', NULL, NULL, 'Promoted via admin panel from semester 3 to 4 for academic year 2027-28', NULL, NULL, '2026-01-06 06:59:36.858658+00', '2026-01-06 06:59:36.858658+00'),
	('e44b0ae9-b4ca-4432-a30f-b0e3a7cebfe1', 'a340be56-cc51-469b-a206-034c1e6d65e1', '2024-25', '1', '2', NULL, 'c16a95cf-6ee5-4aa9-8e47-84fbda49611d', 85.00, 'A', 8.50, NULL, NULL, true, true, false, false, '[]', '2026-01-06', NULL, NULL, 'Promoted via admin panel from semester 1 to 2 for academic year 2024-25', NULL, NULL, '2026-01-06 07:43:20.408266+00', '2026-01-06 07:43:20.408266+00'),
	('bde737f8-1528-4a81-9f5d-e7b0d973c3bd', '453e1035-823d-4c9e-a32e-a8d8952f3fc0', '2024-25', '1', '2', NULL, 'c16a95cf-6ee5-4aa9-8e47-84fbda49611d', 82.00, 'B', 8.20, NULL, NULL, true, true, false, false, '[]', '2026-01-06', NULL, NULL, 'Promoted via admin panel from semester 1 to 2 for academic year 2024-25', NULL, NULL, '2026-01-06 08:00:48.544153+00', '2026-01-06 08:00:48.544153+00'),
	('0160d7ad-171a-49dc-9282-763f8d858eb2', '453e1035-823d-4c9e-a32e-a8d8952f3fc0', '2025-26', '2', '3', NULL, 'c16a95cf-6ee5-4aa9-8e47-84fbda49611d', 82.00, 'B', 8.20, NULL, NULL, true, true, false, false, '[]', '2026-01-06', NULL, NULL, 'Promoted via admin panel from semester 2 to 3 for academic year 2025-26', NULL, NULL, '2026-01-06 08:02:11.849186+00', '2026-01-06 08:02:11.849186+00'),
	('bcb7ef43-0a03-4106-91e2-89f50090de98', '3531e63e-589e-46e7-9248-4a769e84b00d', '2024-25', '1', '2', NULL, 'c16a95cf-6ee5-4aa9-8e47-84fbda49611d', 91.00, 'A', 9.10, NULL, NULL, true, true, false, false, '[]', '2026-01-29', NULL, NULL, 'Promoted via admin panel from semester 1 to 2 for academic year 2024-25', NULL, NULL, '2026-01-29 12:08:45.182725+00', '2026-01-29 12:08:45.182725+00');


--

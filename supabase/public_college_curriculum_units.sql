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
-- Data for Name: college_curriculum_units; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."college_curriculum_units" ("id", "curriculum_id", "name", "code", "description", "credits", "estimated_duration", "duration_unit", "order_index", "created_at", "updated_at", "created_by", "updated_by") VALUES
	('d62fb126-4133-473e-87d0-01589bc4e5f0', '530fbccd-b750-4e2e-8886-96dc66107935', 'Intoduction to DSA', 'UNIT 6', '', 6.00, 60, 'hours', 4, '2026-01-19 09:05:26.945913+00', '2026-01-20 03:41:46.146+00', '0595e71f-9ce7-4118-9b00-ecb28cdc4c4c', '0595e71f-9ce7-4118-9b00-ecb28cdc4c4c'),
	('3b9ae3b3-5f61-47fa-bfd0-2c938cb59d8a', '87c61116-2a7e-49f8-a26d-0c320369d7c9', 'Introduction to Sets', '1', 'Introduction to sets', 3.00, 8, 'hours', 1, '2026-01-30 11:28:22.607568+00', '2026-01-30 11:28:22.607568+00', NULL, NULL),
	('1098af94-03c4-4f35-9743-20c84c14e954', 'c61df4b6-bdf5-4f32-8eb9-cb9c61f4a4b0', 'Algorithm Analysis and Complexity', 'UNIT-11', 'Introduction to algorithm analysis, time and space complexity, Big O notation, and performance evaluation. Students learn to analyze and compare different algorithms.', 1.50, 12, 'hours', 11, '2026-01-05 10:49:51.223136+00', '2026-01-05 10:49:51.223136+00', '91bf6be4-31a5-4d6a-853d-675596755cee', '91bf6be4-31a5-4d6a-853d-675596755cee'),
	('d9bca616-b6ac-406a-b439-3d3ded7078af', 'c61df4b6-bdf5-4f32-8eb9-cb9c61f4a4b0', 'Final Project and Integration', 'UNIT-12', 'Capstone project that integrates all learned concepts. Students design and implement a comprehensive program demonstrating mastery of programming fundamentals.', 2.00, 20, 'hours', 12, '2026-01-05 10:49:51.223136+00', '2026-01-05 10:49:51.223136+00', '91bf6be4-31a5-4d6a-853d-675596755cee', '91bf6be4-31a5-4d6a-853d-675596755cee'),
	('c973ddaa-a48d-495d-bafb-b5b6148b0609', 'c61df4b6-bdf5-4f32-8eb9-cb9c61f4a4b0', 'Programming Basics & Syntax', 'UNIT-02', 'Covers basic programming syntax, keywords, identifiers, variables, and data types. Students will write simple programs to understand input/output operations and basic execution flow.', 1.00, 8, 'hours', 2, '2026-01-05 06:43:29.780962+00', '2026-01-05 06:43:29.780962+00', '91bf6be4-31a5-4d6a-853d-675596755cee', '91bf6be4-31a5-4d6a-853d-675596755cee'),
	('6fe09214-da93-488c-8d80-f98150280d07', '81c1bbd0-3411-4d4d-8495-736a7e72799d', 'test', 'unit', 'asdg', 2.00, 2, 'hours', 1, '2026-01-06 06:08:58.219918+00', '2026-01-06 06:08:58.219918+00', '91bf6be4-31a5-4d6a-853d-675596755cee', '91bf6be4-31a5-4d6a-853d-675596755cee'),
	('28d3b274-b1b9-44b1-8d9d-ee845d61bc23', 'c61df4b6-bdf5-4f32-8eb9-cb9c61f4a4b0', 'Control Structures', 'UNIT-03', 'Focuses on decision-making and looping constructs such as if-else, switch-case, for loops, and while loops. Emphasis is placed on logical thinking and flow control through practical examples.', 1.00, 10, 'hours', 3, '2026-01-05 06:43:54.607083+00', '2026-01-05 06:43:54.607083+00', '91bf6be4-31a5-4d6a-853d-675596755cee', '91bf6be4-31a5-4d6a-853d-675596755cee'),
	('84a84856-9635-42c4-8319-89db7249fa85', 'c61df4b6-bdf5-4f32-8eb9-cb9c61f4a4b0', 'Functions and Modular Programming', 'UNIT-04', 'Introduces functions, parameters, return values, and scope of variables. Students learn how to break programs into reusable modules to improve readability and maintainability.', 1.00, 8, 'hours', 4, '2026-01-05 06:44:23.325599+00', '2026-01-05 06:44:23.325599+00', '91bf6be4-31a5-4d6a-853d-675596755cee', '91bf6be4-31a5-4d6a-853d-675596755cee'),
	('6beb995d-a80f-46c9-926c-067f1ec066c2', 'c61df4b6-bdf5-4f32-8eb9-cb9c61f4a4b0', 'Arrays and Basic Data Handling', 'UNIT-05', 'Explains arrays and basic data storage techniques. Students practice storing, accessing, and manipulating collections of data through simple problem-solving exercises.', 1.00, 8, 'hours', 5, '2026-01-05 06:44:50.960697+00', '2026-01-05 06:44:50.960697+00', '91bf6be4-31a5-4d6a-853d-675596755cee', '91bf6be4-31a5-4d6a-853d-675596755cee'),
	('4c82537a-58b1-4da5-a3cc-09801dc22946', 'c61df4b6-bdf5-4f32-8eb9-cb9c61f4a4b0', 'Introduction to Debugging & Best Practices', 'UNIT-06', 'Covers common programming errors, debugging techniques, and coding best practices. Students learn how to test programs, interpret errors, and write clean, readable code.', 1.00, 6, 'hours', 6, '2026-01-05 06:50:06.721191+00', '2026-01-05 06:50:06.721191+00', '91bf6be4-31a5-4d6a-853d-675596755cee', '91bf6be4-31a5-4d6a-853d-675596755cee'),
	('5881ffb5-9f35-43f0-bf07-218ee63c255e', 'c61df4b6-bdf5-4f32-8eb9-cb9c61f4a4b0', 'Pointers and Memory Management', 'UNIT-07', 'Introduction to pointers, memory allocation, and dynamic memory management. Students learn about memory addresses, pointer arithmetic, and safe memory handling practices.', 1.50, 12, 'hours', 7, '2026-01-05 10:49:51.223136+00', '2026-01-05 10:49:51.223136+00', '91bf6be4-31a5-4d6a-853d-675596755cee', '91bf6be4-31a5-4d6a-853d-675596755cee'),
	('dabe8226-65b8-43d2-bbdf-c1acafa3317c', 'c61df4b6-bdf5-4f32-8eb9-cb9c61f4a4b0', 'Strings and Character Processing', 'UNIT-08', 'Comprehensive coverage of string handling, character arrays, string functions, and text processing. Includes pattern matching and basic string algorithms.', 1.00, 8, 'hours', 8, '2026-01-05 10:49:51.223136+00', '2026-01-05 10:49:51.223136+00', '91bf6be4-31a5-4d6a-853d-675596755cee', '91bf6be4-31a5-4d6a-853d-675596755cee'),
	('8dbe5ed7-2683-4b05-97ed-9abd28b1254e', 'c61df4b6-bdf5-4f32-8eb9-cb9c61f4a4b0', 'File Input/Output Operations', 'UNIT-09', 'File handling concepts including reading from and writing to files, file modes, error handling, and data persistence. Students work with text and binary files.', 1.00, 10, 'hours', 9, '2026-01-05 10:49:51.223136+00', '2026-01-05 10:49:51.223136+00', '91bf6be4-31a5-4d6a-853d-675596755cee', '91bf6be4-31a5-4d6a-853d-675596755cee'),
	('d2bdf2ef-cbf9-49b8-8397-56d8c58b439d', 'c61df4b6-bdf5-4f32-8eb9-cb9c61f4a4b0', 'Introduction to Data Structures', 'UNIT-10', 'Basic data structures including linked lists, stacks, and queues. Introduction to abstract data types and their implementations using arrays and pointers.', 2.00, 15, 'hours', 10, '2026-01-05 10:49:51.223136+00', '2026-01-05 10:49:51.223136+00', '91bf6be4-31a5-4d6a-853d-675596755cee', '91bf6be4-31a5-4d6a-853d-675596755cee'),
	('d06c57b3-ee26-46c6-9166-9634727e2602', '5e2c99cd-4812-400b-910e-958d51748233', 'Testing unit', 'UNIT-01', 'testing', 1.00, 1, 'weeks', 1, '2026-01-06 04:35:02.600771+00', '2026-01-06 04:35:02.600771+00', '91bf6be4-31a5-4d6a-853d-675596755cee', '91bf6be4-31a5-4d6a-853d-675596755cee'),
	('e272d9e0-8a75-4dc1-80bd-bf757424955d', 'c61df4b6-bdf5-4f32-8eb9-cb9c61f4a4b0', 'sdfgh', 'unit-13', 'awdsf', 1.00, 8, 'hours', 13, '2026-01-06 05:11:54.57591+00', '2026-01-06 05:11:54.57591+00', '91bf6be4-31a5-4d6a-853d-675596755cee', '91bf6be4-31a5-4d6a-853d-675596755cee'),
	('fe18229c-1867-47d7-9e6c-51ae3c9e51b6', 'd02639c9-f271-4b09-83bb-df8399346508', 'testing', 'UNIT-01', 'tetsing', 3.00, 8, 'hours', 1, '2026-01-06 17:19:25.160555+00', '2026-01-06 17:19:25.160555+00', '91bf6be4-31a5-4d6a-853d-675596755cee', '91bf6be4-31a5-4d6a-853d-675596755cee'),
	('d0ecbe0c-3063-4d67-823f-ec43d3de07de', '8482d79b-c95a-4e0d-baa6-3e57a57f096f', 'testing', 'UNIT-01', 'tetsing', 3.00, 8, 'hours', 1, '2026-01-06 17:21:22.567002+00', '2026-01-06 17:21:22.567002+00', '91bf6be4-31a5-4d6a-853d-675596755cee', '91bf6be4-31a5-4d6a-853d-675596755cee'),
	('8f1b1d8f-6676-48df-83e9-d5a1112d7b7d', 'c61df4b6-bdf5-4f32-8eb9-cb9c61f4a4b0', 'Introduction to Programming', 'UNIT-1', 'This unit introduces the fundamentals of programming, its importance in computer science, and real-world applications. Students will learn about problem-solving using algorithms, basic program structure, and an overview of programming languages.', 1.00, 6, 'hours', 1, '2026-01-05 06:32:39.130208+00', '2026-01-05 06:32:39.130208+00', '91bf6be4-31a5-4d6a-853d-675596755cee', '91bf6be4-31a5-4d6a-853d-675596755cee'),
	('630178e1-aa16-4bc7-baf8-86e9f48e601f', '03f60f47-51e0-4519-8c4f-816f3990aebe', 'testing', '2', '', 4.00, 45, 'hours', 1, '2026-01-13 06:44:33.405985+00', '2026-01-13 06:44:33.405985+00', '91bf6be4-31a5-4d6a-853d-675596755cee', '91bf6be4-31a5-4d6a-853d-675596755cee'),
	('975c8f5a-5d94-4247-9406-337ef750e2f6', '1759ea38-9ba3-4e4d-a6a1-f9b52b5d028c', 'testing 4', NULL, 'testing', NULL, NULL, NULL, 2, '2026-01-13 09:50:23.017474+00', '2026-01-13 09:50:23.017474+00', '91bf6be4-31a5-4d6a-853d-675596755cee', '91bf6be4-31a5-4d6a-853d-675596755cee'),
	('15053476-00d3-4383-ae42-0f2ebd3e3ee7', '1759ea38-9ba3-4e4d-a6a1-f9b52b5d028c', 'new unit', '34', '', 4.00, NULL, NULL, 3, '2026-01-13 09:58:37.229573+00', '2026-01-13 09:58:37.229573+00', '91bf6be4-31a5-4d6a-853d-675596755cee', '91bf6be4-31a5-4d6a-853d-675596755cee'),
	('98a4b905-565c-46ee-8dc5-ac9f036b2686', '1759ea38-9ba3-4e4d-a6a1-f9b52b5d028c', 'test 5', NULL, '', NULL, NULL, NULL, 4, '2026-01-13 11:11:43.755805+00', '2026-01-13 11:11:43.755805+00', '91bf6be4-31a5-4d6a-853d-675596755cee', '91bf6be4-31a5-4d6a-853d-675596755cee'),
	('42c97f51-632c-489d-9d99-0f1ed9e6ca4d', '1759ea38-9ba3-4e4d-a6a1-f9b52b5d028c', 'test unit', 'unit-1', 'cvbnm,.', 3.00, 8, 'hours', 1, '2026-01-07 09:11:40.678367+00', '2026-01-07 09:11:40.678367+00', '91bf6be4-31a5-4d6a-853d-675596755cee', '91bf6be4-31a5-4d6a-853d-675596755cee'),
	('90cba7f1-e6ca-47c3-8c68-ada693f8f8de', '7a65ca3c-b0d9-4032-a280-2c58495c4bed', 'Testing', NULL, '', NULL, NULL, NULL, 1, '2026-01-14 05:07:45.152259+00', '2026-01-14 05:07:45.152259+00', '91bf6be4-31a5-4d6a-853d-675596755cee', '91bf6be4-31a5-4d6a-853d-675596755cee'),
	('7321ac43-e381-40f4-9c21-20c0cb37c957', 'cdb881d9-6a9d-4112-af31-b3c003e66df7', 'testing 1', '12', '', NULL, NULL, NULL, 1, '2026-01-13 10:02:08.898165+00', '2026-01-13 10:02:08.898165+00', '91bf6be4-31a5-4d6a-853d-675596755cee', '91bf6be4-31a5-4d6a-853d-675596755cee'),
	('11c4eb60-ce51-4d38-a10c-df619774662b', '59a3038c-1c3e-4089-8184-5fed649decf6', 'Java Servlet', 'UNIT 1', '', 0.00, 56, 'hours', 1, '2026-01-17 08:27:22.662352+00', '2026-01-17 09:32:25.462+00', NULL, '0595e71f-9ce7-4118-9b00-ecb28cdc4c4c'),
	('441e59c3-ceb1-432c-ba9b-3982e4f5975f', '530fbccd-b750-4e2e-8886-96dc66107935', 'Unit Testing', 'UNIT 1', 'Functional Testing', 4.00, 65, 'hours', 3, '2026-01-14 05:39:45.490888+00', '2026-01-19 10:55:58.657+00', '91bf6be4-31a5-4d6a-853d-675596755cee', '0595e71f-9ce7-4118-9b00-ecb28cdc4c4c'),
	('02f42c53-0c29-4960-bab8-37758eca1fa4', '530fbccd-b750-4e2e-8886-96dc66107935', 'Introduction of Mathematics', 'MS0011', '', 2.00, 89, 'hours', 1, '2026-01-09 09:04:59.763906+00', '2026-01-19 11:01:32.147+00', '91bf6be4-31a5-4d6a-853d-675596755cee', '0595e71f-9ce7-4118-9b00-ecb28cdc4c4c');


--

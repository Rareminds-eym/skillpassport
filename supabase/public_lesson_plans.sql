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
-- Data for Name: lesson_plans; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."lesson_plans" ("id", "educator_id", "class_id", "title", "subject", "class_name", "date", "duration", "learning_objectives", "activities", "resources", "assessment_methods", "homework", "notes", "status", "submitted_at", "reviewed_by", "reviewed_at", "review_comments", "created_at", "updated_at", "chapter_id", "chapter_name", "selected_learning_outcomes", "teaching_methodology", "required_materials", "resource_files", "resource_links", "evaluation_criteria", "evaluation_items", "differentiation_notes") VALUES
	('a7edacab-b937-4df7-b00c-237774c2c33a', '61c92620-37f5-4be1-9537-d377c95aff31', '588f5c42-2f91-4fec-89cc-dca5de209611', 'Introduction to Mathematics', 'Mathematics', '10', '2026-01-01', 2, 'To understand basic algebra concepts such as variables, expressions, and simple equations, and use them to solve simple problems.', '[]', '[]', NULL, NULL, NULL, 'approved', NULL, NULL, NULL, NULL, '2026-01-05 09:37:01.513211', '2026-01-05 10:53:51.349403', 'de71b9e8-1daa-48e9-a41a-4e27424afeb5', 'Introduction to Algebra', '["6d57a7c6-a9e3-4873-ba6a-8c7109f47972"]', 'The topic will be taught using simple explanations, step-by-step examples, class discussion, and practice problems to help students understand and apply basic algebra concepts.', 'NCERT Mathematics Textbook (Introduction to Algebra chapter)', '[{"id": "1767605687864_0", "url": "https://pub-ad91abcd16cd9e9c569d83d9ef46e398.r2.dev/lesson-plans/1767605687864_6vz8kvirp1c.pptx", "name": "1767604679474_zs8w4h1n56b.pptx", "size": 55914, "type": "application/vnd.openxmlformats-officedocument.presentationml.presentation"}]', '[]', 'Students will be evaluated through oral questioning, class participation, written exercises, and a short test to check their understanding of basic algebra concepts.', '[]', NULL),
	('6c28a565-fb35-4564-ae50-938888e5b2c0', '61c92620-37f5-4be1-9537-d377c95aff31', '588f5c42-2f91-4fec-89cc-dca5de209611', 'Introduction to Algeba', 'Mathematics', '10', '2025-12-10', 2, 'test', '[]', '[]', NULL, 'test', NULL, 'approved', NULL, NULL, NULL, NULL, '2025-12-04 09:16:18.21524', '2025-12-18 11:27:47.004022', 'de71b9e8-1daa-48e9-a41a-4e27424afeb5', 'Introduction to Algebra', '["6d57a7c6-a9e3-4873-ba6a-8c7109f47972", "7d80b697-71b5-4d97-bb86-e2365eed5ba1"]', 'test', 'test', '[]', '[{"id": "17648397445510.8417741515464036", "url": "test", "title": "test"}]', 'test', '[{"id": "17648397587790.08014688678516413", "criterion": "test", "percentage": 10}]', 'test'),
	('bc4071fa-3977-4e4d-b5a0-7c253d06f681', '61c92620-37f5-4be1-9537-d377c95aff31', '0719a288-54cf-4747-96f7-59f2a8a66397', 'testing', 'Mathematics', '10', '2025-12-23', 2, 'test', '[]', '[]', NULL, 'tetstt', NULL, 'approved', NULL, NULL, NULL, NULL, '2025-12-22 08:05:38.755472', '2025-12-22 08:05:38.755472', 'de71b9e8-1daa-48e9-a41a-4e27424afeb5', 'Introduction to Algebra', '["6d57a7c6-a9e3-4873-ba6a-8c7109f47972", "7d80b697-71b5-4d97-bb86-e2365eed5ba1"]', 'test', 'test', '[]', '[]', 'test', '[]', 'test');


--

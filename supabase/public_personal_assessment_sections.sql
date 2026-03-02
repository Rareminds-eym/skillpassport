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
-- Data for Name: personal_assessment_sections; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."personal_assessment_sections" ("id", "name", "title", "description", "icon", "color", "order_number", "is_timed", "time_limit_seconds", "instruction", "response_scale", "is_stream_specific", "is_active", "created_at", "updated_at", "grade_level") VALUES
	('43252ef1-4a22-46e9-b2f9-bdbdb2fa5b8c', 'middle_interest_explorer', 'Interest Explorer', 'Let''s discover what kinds of activities and subjects you enjoy most!', 'heart', 'rose', 1, false, NULL, 'There are no right or wrong answers. Pick what feels most like you today.', NULL, false, true, '2026-01-09 06:17:13.628799+00', '2026-01-09 06:17:13.628799+00', 'middle'),
	('fb6d7aac-0923-4a42-baba-ec27e22550db', 'middle_strengths_character', 'Strengths & Character', 'Discover your personal strengths and character traits.', 'award', 'amber', 2, false, NULL, 'Rate each statement: 1 = not like me, 2 = sometimes, 3 = mostly me, 4 = very me', NULL, false, true, '2026-01-09 06:17:13.628799+00', '2026-01-09 06:17:13.628799+00', 'middle'),
	('4aeacdfd-7140-4773-be07-e6dc5f03768d', 'middle_learning_preferences', 'Learning & Work Preferences', 'Learn about how you like to work and learn best.', 'users', 'blue', 3, false, NULL, 'Choose the options that best describe you.', NULL, false, true, '2026-01-09 06:17:13.628799+00', '2026-01-09 06:17:13.628799+00', 'middle'),
	('4db4cf22-db6f-493d-92a3-a21252438c76', 'hs_interest_explorer', 'Interest Explorer', 'Discover what activities and subjects truly excite you.', 'heart', 'rose', 1, false, NULL, 'Answer honestly based on your real preferences, not what others expect.', NULL, false, true, '2026-01-09 06:17:29.341286+00', '2026-01-09 06:17:29.341286+00', 'highschool'),
	('dc4c151b-4be6-4fa0-aebc-561102847638', 'hs_strengths_character', 'Strengths & Character', 'Identify your personal strengths and character traits.', 'award', 'amber', 2, false, NULL, 'Rate each: 1 = not me, 2 = a bit, 3 = mostly, 4 = strongly me', NULL, false, true, '2026-01-09 06:17:29.341286+00', '2026-01-09 06:17:29.341286+00', 'highschool'),
	('775134f7-bb3c-4057-9576-15fd081f7cfe', 'hs_learning_preferences', 'Learning & Work Preferences', 'Understand how you work, learn, and contribute best.', 'users', 'blue', 3, false, NULL, 'Select the options that best describe you.', NULL, false, true, '2026-01-09 06:17:29.341286+00', '2026-01-09 06:17:29.341286+00', 'highschool'),
	('d414d8a9-cfea-4a42-abeb-4c679bb92083', 'hs_aptitude_sampling', 'Aptitude Sampling', 'Rate your experience with different types of tasks.', 'zap', 'purple', 4, false, NULL, 'After each task, rate: Ease 1–4, Enjoyment 1–4', NULL, false, true, '2026-01-09 06:17:29.341286+00', '2026-01-09 06:17:29.341286+00', 'highschool');


--

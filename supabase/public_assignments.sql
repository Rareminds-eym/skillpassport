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
-- Data for Name: assignments; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."assignments" ("assignment_id", "title", "description", "instructions", "course_name", "course_code", "educator_name", "total_points", "assignment_type", "skill_outcomes", "assign_classes", "document_pdf", "due_date", "available_from", "created_date", "allow_late_submission", "is_deleted", "updated_date", "educator_id", "school_class_id") VALUES
	('32a759b8-3aed-42c4-a86c-6f0a065d66a5', 'Fix Your City – Student Innovation Task', 'Students identify a real problem in their city or locality and design a practical solution.', 'Choose one real local problem (traffic, waste, water, safety, pollution, etc.)

Explain why it exists

Propose a student-friendly solution

Create 1 sketch / diagram (hand-drawn or digital)

Submit a 2-page PDF', 'Information Technology', 'IT402', 'karthik@rareminds.in', 100.00, 'project', '{Creativity}', '0719a288-54cf-4747-96f7-59f2a8a66397', NULL, '2025-12-30 12:49:00+00', '2025-12-30 12:49:00+00', '2025-12-30 07:21:59.505627+00', true, false, '2025-12-30 17:31:46.632158+00', '5d78d3c6-e53e-48df-887f-fd21e1e58db6', '0719a288-54cf-4747-96f7-59f2a8a66397'),
	('89ca81cd-2493-4a2d-96f2-27d6397261ca', 'Socail Science', 'maps', 'maps', 'Social', 'ss923', 'karthik@rareminds.in', 100.00, 'homework', '{Communication}', '0719a288-54cf-4747-96f7-59f2a8a66397', NULL, '2025-12-06 14:43:00+00', '2025-12-02 14:43:00+00', '2025-12-02 09:13:25.998987+00', true, false, '2025-12-18 04:17:13.106862+00', '5d78d3c6-e53e-48df-887f-fd21e1e58db6', '0719a288-54cf-4747-96f7-59f2a8a66397'),
	('6e33da2b-b47c-4f15-bfee-aef731e12271', 'Socail Science', 'maps', 'maps', 'Social', 'ss923', 'karthik@rareminds.in', 100.00, 'homework', '{Communication}', '0719a288-54cf-4747-96f7-59f2a8a66397', NULL, '2025-12-06 14:43:00+00', '2025-12-02 14:43:00+00', '2025-12-02 09:13:25.998987+00', true, false, '2025-12-02 09:13:25.998987+00', '5d78d3c6-e53e-48df-887f-fd21e1e58db6', '0719a288-54cf-4747-96f7-59f2a8a66397'),
	('c9a37a46-d60f-45b5-8085-877fd4c6774e', 'creative problem solving challenge', 'A hands-on mini-project.', 'students will form small team and develop a simple prototype that addresses the assigned challenge.', 'web Development', 'CS301', 'jishnu@rareminds.in', 100.00, 'project', '{Creativity,Collaboration,"Critical Thinking"}', '01238bc2-5d09-44b0-add5-47dce6c449fe', NULL, '2025-12-16 11:48:00+00', '2025-12-09 11:48:00+00', '2025-12-09 06:18:47.019184+00', true, false, '2025-12-09 06:18:47.019184+00', '8b25ae13-d1ad-48bc-873a-8a269328afb8', '01238bc2-5d09-44b0-add5-47dce6c449fe'),
	('46719c72-dc5d-4e23-bd89-3c6b5b02b549', 'Write a Paragraph on "The importance of Discipline in students life"', 'write 150-200 words paragraph', 'In the Paragraph it should include Introduction, example and conclusion.', 'English', 'CS301', 'jishnu@rareminds.in', 100.00, 'essay', '{Creativity,Collaboration}', '6bb97a72-4bf5-4369-92d8-33af08280148', NULL, '2025-12-16 22:04:00+00', '2025-12-09 22:03:00+00', '2025-12-09 16:34:16.747715+00', true, false, '2025-12-09 16:34:16.747715+00', '8b25ae13-d1ad-48bc-873a-8a269328afb8', '6bb97a72-4bf5-4369-92d8-33af08280148'),
	('012a0cfb-620c-4238-8963-2c4fb5b0f770', 'testing date', 'testing date 2', 'testing date 2', 'web', 'cs3012', 'karthik@rareminds.in', 100.00, 'project', '{Leadership,"Critical Thinking"}', '0719a288-54cf-4747-96f7-59f2a8a66397', NULL, '2026-01-18 18:03:00+00', '2026-01-17 15:03:00+00', '2026-01-17 09:34:02.165038+00', false, false, '2026-01-17 09:44:43.00998+00', '5d78d3c6-e53e-48df-887f-fd21e1e58db6', '0719a288-54cf-4747-96f7-59f2a8a66397'),
	('93146c89-1055-42cf-8be4-4fa3f46d3642', 'A Day Without Technology', 'Imagine a full day without a specific technology and reflect on its impact.', 'Choose one technology (Internet, Mobile Phone, Electricity, GPS, Social Media)
Write a first-person story (500–700 words)
Describe challenges, emotions, and lessons learned
Original thinking only (no copy-paste)', 'Digital Literacy', 'DL110', 'karthik@rareminds.in', 75.00, 'essay', '{Creativity,Collaboration,"Critical Thinking"}', '0719a288-54cf-4747-96f7-59f2a8a66397', NULL, '2026-01-01 12:53:00+00', '2025-12-30 12:53:00+00', '2025-12-30 07:23:59.912797+00', false, false, '2025-12-31 09:16:21.045807+00', '5d78d3c6-e53e-48df-887f-fd21e1e58db6', '0719a288-54cf-4747-96f7-59f2a8a66397'),
	('77527857-c603-44f0-b274-5863b81a227f', 'Testing', 'test', 'test', 'web', 'cs301', 'karthik@rareminds.in', 100.00, 'project', '{Creativity,Collaboration}', '0719a288-54cf-4747-96f7-59f2a8a66397', NULL, '2026-01-05 11:41:00+00', '2026-01-03 11:41:00+00', '2026-01-03 06:11:57.714863+00', true, false, '2026-01-03 06:11:57.714863+00', '5d78d3c6-e53e-48df-887f-fd21e1e58db6', '0719a288-54cf-4747-96f7-59f2a8a66397'),
	('7a867149-7b8c-4074-8fee-bc7e4901bba6', 'Testing2', 'ghjk', 'vbnm,', 'ghjk', 'hjk', 'karthik@rareminds.in', 100.00, 'exam', '{Communication,"Problem Solving"}', '0719a288-54cf-4747-96f7-59f2a8a66397', NULL, '2026-01-15 12:45:00+00', '2026-01-14 13:46:00+00', '2026-01-14 07:15:58.403824+00', true, false, '2026-01-14 07:15:58.403824+00', '5d78d3c6-e53e-48df-887f-fd21e1e58db6', '0719a288-54cf-4747-96f7-59f2a8a66397'),
	('5d58c5c6-56da-4c0a-be37-01cd40a134b5', 'test date', 'test date', 'test date', 'test date', 'cs2201', 'karthik@rareminds.in', 100.00, 'project', '{Creativity,Collaboration}', '0719a288-54cf-4747-96f7-59f2a8a66397', NULL, '2026-01-29 22:43:00+00', '2026-01-27 22:43:00+00', '2026-01-27 17:13:59.227548+00', true, false, '2026-01-27 17:15:08.012089+00', '5d78d3c6-e53e-48df-887f-fd21e1e58db6', '0719a288-54cf-4747-96f7-59f2a8a66397'),
	('f4024fc6-d719-4577-8e87-54570b826349', 'testing 37', 'answer in detaill', 'follow the descc', 'bio techh', 'sddsdww', 'karthik@rareminds.in', 1000.00, 'project', '{Creativity,Collaboration,"Critical Thinking",innovative}', '0719a288-54cf-4747-96f7-59f2a8a66397', NULL, '2026-01-30 14:44:00+00', '2026-01-21 15:44:00+00', '2026-01-29 04:38:38.204325+00', true, false, '2026-01-30 06:17:22.398497+00', '5d78d3c6-e53e-48df-887f-fd21e1e58db6', '0719a288-54cf-4747-96f7-59f2a8a66397'),
	('c3093ac9-84d6-4602-8b77-5ce6269bda5e', 'testing lithikesh', 'fgh', 'ghjkl', 'ghjkl', '1234d', 'karthik@rareminds.in', 100.00, 'project', '{Leadership,"Problem Solving"}', '0719a288-54cf-4747-96f7-59f2a8a66397', NULL, '2026-01-30 11:53:00+00', '2026-01-30 11:54:00+00', '2026-01-30 06:18:23.340035+00', true, false, '2026-01-30 06:18:23.340035+00', '5d78d3c6-e53e-48df-887f-fd21e1e58db6', '0719a288-54cf-4747-96f7-59f2a8a66397');


--

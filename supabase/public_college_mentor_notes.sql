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
-- Data for Name: college_mentor_notes; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."college_mentor_notes" ("id", "allocation_id", "mentor_id", "student_id", "title", "note_text", "outcome", "intervention_type", "status", "is_private", "note_date", "created_at", "created_by_role", "created_by_id", "last_updated_by", "last_updated_at", "priority", "follow_up_required", "follow_up_date", "admin_feedback", "educator_response", "action_taken", "next_steps", "resolved_at", "resolved_by") VALUES
	('f95c512d-d9bc-487c-a26e-a71061aa80f8', '45a42c79-a196-44d1-af1b-ce0135e1c2bb', '462572af-66de-43da-97b9-339b6cf4d8ed', '45e7e1a8-ec94-4658-9693-38a9cfe3fb4e', 'Intervention - academic', 'testing', 'dfghjkl', 'academic', 'pending', false, '2026-01-16', '2026-01-16 16:40:11.726455+00', 'admin', '91bf6be4-31a5-4d6a-853d-675596755cee', NULL, '2026-01-16 16:40:11.726455+00', 'medium', false, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
	('6c19fb59-3fa6-4038-8156-bdcb45c80cbe', '7665f870-7eeb-4344-a93e-9084a1efaa92', '0f4b36d3-bebe-456f-8e11-b89a4fe2a723', '3eeec2a6-eb85-49ef-a6d6-772efd32c149', 'Intervention - personal', 'sdfghjk', 'sdfghjk', 'personal', 'completed', false, '2026-01-16', '2026-01-16 16:41:16.184837+00', 'admin', '91bf6be4-31a5-4d6a-853d-675596755cee', '91bf6be4-31a5-4d6a-853d-675596755cee', '2026-01-16 16:42:54.647161+00', 'high', true, '2026-01-21', 'fghjkl', 'dfghjk', NULL, NULL, '2026-01-16 16:42:53.627+00', '91bf6be4-31a5-4d6a-853d-675596755cee'),
	('2376a967-54ae-4de3-a985-a348f6099101', '7665f870-7eeb-4344-a93e-9084a1efaa92', '0f4b36d3-bebe-456f-8e11-b89a4fe2a723', '3eeec2a6-eb85-49ef-a6d6-772efd32c149', 'Intervention - personal', 'asdfgh', '', 'personal', 'pending', false, '2026-01-16', '2026-01-16 17:03:45.639307+00', 'admin', '91bf6be4-31a5-4d6a-853d-675596755cee', NULL, '2026-01-16 17:03:45.639307+00', 'medium', false, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
	('b6ef46eb-8b63-43e1-b91f-b9fd8ba211a3', '23061222-6a6d-483b-b0bf-fc00ac8e9c4b', '0f4b36d3-bebe-456f-8e11-b89a4fe2a723', 'afaa9e81-1552-4c1d-a76d-551134295567', 'Intervention - behavioral', 'The student was counseled regarding consistent low academic performance and lack of engagement during classes.

During the interaction, the student shared difficulties in managing time effectively and adapting to the academic workload. Behavioral concerns such as irregular attendance and limited participation were also discussed.

The mentor provided guidance on creating a structured study plan, improving classroom discipline, and seeking academic support when required. The importance of maintaining focus, regular attendance, and timely assignment submissions was emphasized.', '• Weekly progress check-in with the mentor • Attendance monitoring for the next month • Academic performance review after the next internal assessment', 'behavioral', 'completed', false, '2026-01-17', '2026-01-17 04:33:54.335424+00', 'admin', '91bf6be4-31a5-4d6a-853d-675596755cee', '91bf6be4-31a5-4d6a-853d-675596755cee', '2026-01-17 04:55:56.538623+00', 'high', true, '2026-01-31', 'testing', 'I understand that the primary concern is the student’s low academic performance combined with behavioral and attendance issues. From my initial interaction, the student appears willing to improve but lacks proper structure, time management, and consistent academic discipline.

The student acknowledged the concerns raised and expressed motivation to work towards better performance if guided appropriately. I believe focused mentoring, regular monitoring, and gradual goal setting will help the student improve both academically and behaviorally.', '• Conducted a one-on-one mentoring session to discuss academic challenges and behavioral concerns
• Helped the student draft a basic weekly study schedule
• Advised the student to prioritize attendance and active participation in classes
• Encouraged the student to approach subject faculty for clarification and support when needed', '• Schedule weekly follow-up meetings to review progress
• Monitor attendance and classroom engagement for the next four weeks
• Review internal assessment results and identify improvement areas
• Provide additional academic or behavioral guidance based on progress observed', '2026-01-17 04:55:56.471+00', '91bf6be4-31a5-4d6a-853d-675596755cee'),
	('3e2c3260-6f54-44da-9a19-4d0cd6ed4b27', '0acff150-8cb3-4557-8a09-4fb7217c6182', '0f4b36d3-bebe-456f-8e11-b89a4fe2a723', '7a565b7c-fbf2-4773-baa2-3bad99827094', 'Intervention - career', 'testing last time', 'testing', 'career', 'acknowledged', false, '2026-01-17', '2026-01-17 04:30:52.057092+00', 'admin', '91bf6be4-31a5-4d6a-853d-675596755cee', '0ffcf1ed-e010-43ec-b13b-4bee6c9a2d79', '2026-01-30 06:46:36.912495+00', 'medium', false, NULL, NULL, 'test', 'test', NULL, NULL, NULL);


--

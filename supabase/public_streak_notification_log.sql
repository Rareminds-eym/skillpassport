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
-- Data for Name: streak_notification_log; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."streak_notification_log" ("id", "student_id", "notification_type", "email_template_number", "sent_at", "notification_date", "status", "opened_at", "clicked_at", "error_message", "metadata") VALUES
	('90fd00af-4663-445b-adaf-131576b52b49', 'c29ecd33-2958-4931-905a-68fb5382676b', 'email', 1, '2025-12-05 04:57:20.247351+00', '2025-12-05', 'sent', NULL, NULL, NULL, '{}'),
	('87f2ceb9-2f6c-4127-a941-e989ec2328df', 'e8a34593-6348-4212-bf61-0251243f4fbe', 'email', 1, '2025-12-05 04:57:31.760923+00', '2025-12-05', 'sent', NULL, NULL, NULL, '{}'),
	('3ccc8c7d-2264-456a-a7bc-784ef2242fc9', 'c32d58cf-92ff-492a-afb5-ddb8df0d8c06', 'email', 1, '2025-12-05 04:57:37.975659+00', '2025-12-05', 'sent', NULL, NULL, NULL, '{}'),
	('9d4f374f-3659-4500-af32-bbf068fb183d', '95a2e4b1-ccbb-4ff6-a413-b160d04a5642', 'email', 1, '2025-12-05 04:57:43.435193+00', '2025-12-05', 'sent', NULL, NULL, NULL, '{}'),
	('9d93bae1-9c3e-4dc3-a0cd-2b4974d505c1', 'f94dc792-07cd-41e0-9c9a-c3fbad4c801c', 'email', 1, '2025-12-05 04:57:48.872288+00', '2025-12-05', 'sent', NULL, NULL, NULL, '{}'),
	('7c80fbc6-ade4-45e5-8530-0fb1593cc995', 'd729f80e-7ded-4bf4-bcce-bc295ba02259', 'email', 1, '2025-12-05 04:57:23.352332+00', '2025-12-05', 'sent', NULL, NULL, NULL, '{}'),
	('4a86286d-9791-409e-8126-af4bead3afb6', '89344509-0bf3-4081-8e8e-4335b6f91221', 'email', 1, '2025-12-05 04:57:34.746894+00', '2025-12-05', 'sent', NULL, NULL, NULL, '{}'),
	('a2c28e72-abe0-4115-96fd-8982d81b4ad3', '6fd75f6c-7a74-4e0e-96b2-58d22a5bfb5e', 'email', 1, '2025-12-05 04:56:39.996783+00', '2025-12-05', 'sent', NULL, NULL, NULL, '{}'),
	('685d4dc7-8317-4680-a43f-a58fa92229cb', 'e39aaf58-769d-467a-bd70-96256fc211ec', 'email', 1, '2025-12-05 04:56:42.764465+00', '2025-12-05', 'sent', NULL, NULL, NULL, '{}'),
	('9bedcbe0-e6e7-4103-8d40-f89f0a595359', 'f1c66747-249a-4303-b6d9-b830bae13fb1', 'email', 1, '2025-12-05 04:56:45.433552+00', '2025-12-05', 'sent', NULL, NULL, NULL, '{}'),
	('9e3cdb34-f5a5-4800-8a20-1c09d552d415', '483f9197-d12c-443b-820d-5ab031ce05e3', 'email', 1, '2025-12-05 04:56:48.153392+00', '2025-12-05', 'sent', NULL, NULL, NULL, '{}'),
	('d7dd1991-224f-4613-97dc-b79c67a795cd', 'f53746eb-c392-4ce2-afdd-9ed377f0b103', 'email', 1, '2025-12-05 04:56:51.108898+00', '2025-12-05', 'sent', NULL, NULL, NULL, '{}'),
	('f16128a5-8b7d-4e84-b54d-e8106a8d9728', 'af458842-8d2a-4da3-95b0-41ccecbf18f2', 'email', 1, '2025-12-05 04:56:53.802415+00', '2025-12-05', 'sent', NULL, NULL, NULL, '{}'),
	('262d3e5b-cece-4e80-989d-de6792acbee4', 'a8f591a4-3f09-4629-a7cd-c65a56b323b4', 'email', 1, '2025-12-05 04:56:56.57332+00', '2025-12-05', 'sent', NULL, NULL, NULL, '{}'),
	('fcc1923a-14f0-492c-9a3d-f8a2869d6afb', '62fdc63a-d6e0-461e-bf82-ffb6875481e4', 'email', 1, '2025-12-05 04:56:59.779076+00', '2025-12-05', 'sent', NULL, NULL, NULL, '{}'),
	('8e0a25f9-f196-4b73-90a4-27c64fc7a1bb', 'f5e8a9d5-3d47-4fa9-8d47-88a23ea9690a', 'email', 1, '2025-12-05 04:57:03.026926+00', '2025-12-05', 'sent', NULL, NULL, NULL, '{}'),
	('e0fb5d80-0daa-4d4c-8ada-7d3252ab1aa1', '3ac28f42-6146-472b-8cff-55bfb53705f6', 'email', 1, '2025-12-05 04:57:05.693035+00', '2025-12-05', 'sent', NULL, NULL, NULL, '{}'),
	('568fc8bb-4813-4427-a164-691de6a59365', 'ab46b2ac-9922-4569-adc6-73eb6b645202', 'email', 1, '2025-12-05 04:57:08.447959+00', '2025-12-05', 'sent', NULL, NULL, NULL, '{}'),
	('af3ae825-c642-49ef-a92a-cd95a5af1b34', '0764465b-eaf8-47b4-84b6-2fda6d8145ee', 'email', 1, '2025-12-05 04:57:11.275862+00', '2025-12-05', 'sent', NULL, NULL, NULL, '{}'),
	('950e2970-7cdd-44f5-9711-d0c17141e68c', '95364f0d-23fb-4616-b0f4-48caafee5439', 'email', 1, '2025-12-05 04:57:14.299891+00', '2025-12-05', 'sent', NULL, NULL, NULL, '{}'),
	('55e20876-ae49-4656-b056-550e9048cf40', '0d9d52b6-34ad-492b-a890-5f2f3d02e6a7', 'email', 1, '2025-12-05 04:57:26.537689+00', '2025-12-05', 'sent', NULL, NULL, NULL, '{}'),
	('f3add377-a307-4da4-9dc9-c340d1c0e3dc', '8a2c47fa-c40c-4d8a-a088-9a470e4c4775', 'email', 1, '2025-12-05 04:57:46.175726+00', '2025-12-05', 'sent', NULL, NULL, NULL, '{}'),
	('07eda3fb-9e47-4c1a-b4ac-e1de9e234914', 'b54f4308-394b-4016-8d69-36792eb8c93d', 'email', 1, '2025-12-05 04:57:17.591992+00', '2025-12-05', 'sent', NULL, NULL, NULL, '{}'),
	('ddb87858-4caa-4d3b-8b8a-7931079bd6c2', '93ac0b9a-42d0-4f16-94a4-0da04e56a2d4', 'email', 1, '2025-12-05 04:57:29.188897+00', '2025-12-05', 'sent', NULL, NULL, NULL, '{}'),
	('e43f20c3-5361-4efb-9590-2c008ae2d0c3', 'cd8993fe-ff6b-48b2-84bf-d023bc5640f0', 'email', 1, '2025-12-05 04:57:40.633659+00', '2025-12-05', 'sent', NULL, NULL, NULL, '{}');


--

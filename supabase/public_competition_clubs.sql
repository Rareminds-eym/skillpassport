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
-- Data for Name: competition_clubs; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."competition_clubs" ("id", "comp_id", "club_id", "registered_at", "registered_by_type", "registered_by_educator_id", "registered_by_admin_id") VALUES
	('cf26f728-b436-4d97-85e8-093598900b41', '3b086505-62bb-4263-ba6a-6f0e7b104113', '1a3b849e-7713-484d-8cf1-dc32d04d1013', '2025-12-02 18:15:09.503829+00', 'educator', '8b25ae13-d1ad-48bc-873a-8a269328afb8', NULL),
	('8f27678f-7ac8-413a-871b-b6b4d0a82346', '3b086505-62bb-4263-ba6a-6f0e7b104113', 'c17aa8d9-786f-486e-9d77-8a297b586f1a', '2025-12-02 18:15:09.503829+00', 'educator', '8b25ae13-d1ad-48bc-873a-8a269328afb8', NULL),
	('a37fde40-d562-4ac5-9adb-f79b42fa4f5e', 'c6d561ad-8e66-48bb-8acc-b519d8f640ef', '98e746ea-f153-489e-a244-e05e866b2206', '2025-12-02 18:39:23.245885+00', 'admin', NULL, '69cf3489-0046-4414-8acc-409174ffbd2c'),
	('909aa449-c6fc-49d1-aa55-5199f6dae1c3', 'c6d561ad-8e66-48bb-8acc-b519d8f640ef', 'aeadaafb-6878-4a8a-8239-5666114bd059', '2025-12-02 18:39:23.245885+00', 'admin', NULL, '69cf3489-0046-4414-8acc-409174ffbd2c'),
	('622fed0d-daf9-46b2-8337-101507811796', '94ef2b28-d9d0-4dda-9d77-ef802c09e1cf', 'aeadaafb-6878-4a8a-8239-5666114bd059', '2025-12-02 18:39:33.296759+00', 'admin', NULL, '69cf3489-0046-4414-8acc-409174ffbd2c'),
	('1de96d76-421b-4347-99cb-6b9999ecc56c', '73e56ef2-05fe-47f0-b948-f6def9dd6832', '1a3b849e-7713-484d-8cf1-dc32d04d1013', '2025-12-03 06:47:52.101498+00', 'educator', '8b25ae13-d1ad-48bc-873a-8a269328afb8', NULL),
	('4e00d73c-d6eb-4916-81b6-89809c1ac5cf', '73e56ef2-05fe-47f0-b948-f6def9dd6832', '01be331e-87f8-4f12-be4b-567ad7cea29f', '2025-12-03 06:47:52.101498+00', 'educator', '8b25ae13-d1ad-48bc-873a-8a269328afb8', NULL),
	('fd54d41c-849d-4de0-8e23-d18bc8c5d10c', 'cfa8c55b-d04a-4daa-820e-016259a99265', '98e746ea-f153-489e-a244-e05e866b2206', '2025-12-03 11:06:51.168034+00', 'educator', '61c92620-37f5-4be1-9537-d377c95aff31', NULL),
	('054cb651-4505-4fb1-a3ad-c70bbd814a63', 'cfa8c55b-d04a-4daa-820e-016259a99265', 'aeadaafb-6878-4a8a-8239-5666114bd059', '2025-12-03 11:06:51.168034+00', 'educator', '61c92620-37f5-4be1-9537-d377c95aff31', NULL),
	('de2883d2-68e3-4f2f-aff3-9d589d1be85d', '5a0f5948-a4bf-45cb-b994-5f30c9c71b1b', 'aeadaafb-6878-4a8a-8239-5666114bd059', '2025-12-26 08:15:24.613433+00', 'educator', '61c92620-37f5-4be1-9537-d377c95aff31', NULL),
	('54ef74ab-4e32-4519-b2cb-183554fe0d6d', '5a0f5948-a4bf-45cb-b994-5f30c9c71b1b', 'c4057ce9-9257-4324-98f3-ccaadbcfd277', '2025-12-26 08:40:53.392891+00', 'educator', '61c92620-37f5-4be1-9537-d377c95aff31', NULL),
	('5848cec0-03d5-4f76-9706-560c3f6a7a58', '5a0f5948-a4bf-45cb-b994-5f30c9c71b1b', '98e746ea-f153-489e-a244-e05e866b2206', '2025-12-26 09:11:47.030133+00', 'educator', '61c92620-37f5-4be1-9537-d377c95aff31', NULL),
	('0475b8c7-a4aa-493f-b46e-f370b0c5ffdc', '94ef2b28-d9d0-4dda-9d77-ef802c09e1cf', 'e7957b68-76b1-494c-a9d5-4870dd70ea4e', '2025-12-26 10:53:14.406613+00', 'educator', '61c92620-37f5-4be1-9537-d377c95aff31', NULL),
	('c2fc98dc-8b16-4c87-8f2c-c9d2c233b6c6', '94ef2b28-d9d0-4dda-9d77-ef802c09e1cf', '98e746ea-f153-489e-a244-e05e866b2206', '2026-01-01 16:57:22.824223+00', 'educator', '61c92620-37f5-4be1-9537-d377c95aff31', NULL),
	('a53e1332-bc7a-4941-83af-6655e1ece397', '3c59a2fe-7ac1-4b32-92b2-13e434736c53', '4dbbff48-3394-49aa-82fa-d5cb17384783', '2026-01-02 04:01:55.277396+00', 'educator', '61c92620-37f5-4be1-9537-d377c95aff31', NULL),
	('c931a4b2-bbcd-4c46-90eb-1ab8bf0949f7', '3c59a2fe-7ac1-4b32-92b2-13e434736c53', 'ca3eaf58-47e6-4ab5-8eb3-aa5c43f6d765', '2026-01-02 04:01:55.277396+00', 'educator', '61c92620-37f5-4be1-9537-d377c95aff31', NULL),
	('c35ba0ba-2fc3-49ad-b8b5-e7486c3d6e4b', '460a3591-7baf-48db-89fe-ffc3e09e69a8', 'ca3eaf58-47e6-4ab5-8eb3-aa5c43f6d765', '2026-01-02 07:08:55.300333+00', 'educator', '5d78d3c6-e53e-48df-887f-fd21e1e58db6', NULL),
	('5093905d-5e3f-43c4-a616-c141bfeaaae6', '5a0f5948-a4bf-45cb-b994-5f30c9c71b1b', 'ca3eaf58-47e6-4ab5-8eb3-aa5c43f6d765', '2026-01-02 07:13:32.219892+00', 'educator', '5d78d3c6-e53e-48df-887f-fd21e1e58db6', NULL);


--

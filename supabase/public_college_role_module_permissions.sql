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
-- Data for Name: college_role_module_permissions; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."college_role_module_permissions" ("id", "role_type", "module_id", "permission_id", "created_at", "updated_at") VALUES
	('0c594a6a-2501-4ec4-9524-f88696331686', 'college_admin', '6c11e94a-49b4-44b5-8e1b-b1fd39157a13', 'e0bcf53a-f429-45a0-9bed-b8b323e404c2', '2026-01-12 04:52:28.207649', '2026-01-12 04:52:28.207649'),
	('da2912e1-c1d7-4024-b673-0bc331cced86', 'college_admin', '6c11e94a-49b4-44b5-8e1b-b1fd39157a13', '913075b3-e1a4-4cfd-b2f2-ad5244e45835', '2026-01-12 04:52:28.207649', '2026-01-12 04:52:28.207649'),
	('d6e94dd6-03b1-491f-99e9-12d79c089f52', 'college_admin', '6c11e94a-49b4-44b5-8e1b-b1fd39157a13', 'ff4165dd-3c41-4d9e-beb4-7ff3fb0063d9', '2026-01-12 04:52:28.207649', '2026-01-12 04:52:28.207649'),
	('ff8862ac-3d3b-4ba1-ab84-445d9cf663dc', 'college_admin', '6c11e94a-49b4-44b5-8e1b-b1fd39157a13', '90be537e-9eb4-4e6e-8553-5a4145b1ae88', '2026-01-12 04:52:28.207649', '2026-01-12 04:52:28.207649'),
	('8c88991b-4036-4fad-a164-96f346ef9aa6', 'college_educator', '6c11e94a-49b4-44b5-8e1b-b1fd39157a13', '913075b3-e1a4-4cfd-b2f2-ad5244e45835', '2026-01-12 09:51:02.966552', '2026-01-12 09:51:02.966552'),
	('86a7218a-0fa2-4075-a08d-a41d6a4fc31c', 'college_educator', '6c11e94a-49b4-44b5-8e1b-b1fd39157a13', 'e0bcf53a-f429-45a0-9bed-b8b323e404c2', '2026-01-12 09:51:02.966552', '2026-01-12 09:51:02.966552'),
	('492dabf7-3b5f-410f-ab19-9fefbfe889d7', 'college_educator', '6bb07717-be1f-432b-b627-8fedc76e3777', '913075b3-e1a4-4cfd-b2f2-ad5244e45835', '2026-01-12 09:51:02.966552', '2026-01-12 09:51:02.966552'),
	('a3960619-1c9e-4b37-a496-d49934e93fc1', 'college_educator', '6bb07717-be1f-432b-b627-8fedc76e3777', '585637a9-725a-4532-95df-85825d1268d9', '2026-01-12 09:51:02.966552', '2026-01-12 09:51:02.966552'),
	('a135304b-74df-4776-afbe-7a6b743062bc', 'college_educator', '94b2ec14-7cd8-4748-a6e9-0eb07c429f38', '913075b3-e1a4-4cfd-b2f2-ad5244e45835', '2026-01-12 09:51:02.966552', '2026-01-12 09:51:02.966552'),
	('8b603411-f69d-4b56-99c5-9582da6424cb', 'college_educator', '94b2ec14-7cd8-4748-a6e9-0eb07c429f38', '585637a9-725a-4532-95df-85825d1268d9', '2026-01-12 09:51:02.966552', '2026-01-12 09:51:02.966552'),
	('5876781a-d6c8-4f51-aa5c-21e65dfd8370', 'college_educator', 'e1c82fcd-96fb-478a-a6c2-f87044d99837', '585637a9-725a-4532-95df-85825d1268d9', '2026-01-12 09:51:02.966552', '2026-01-12 09:51:02.966552'),
	('6ba7cb57-e1e8-4d25-b706-c2e4893c4616', 'college_educator', '2a1f4937-a0bc-4328-9429-f66c397a4560', '585637a9-725a-4532-95df-85825d1268d9', '2026-01-12 09:51:02.966552', '2026-01-12 09:51:02.966552'),
	('fdde2c00-6c6e-4c7d-99c3-0a15ccdb4948', 'college_educator', '8f7ad976-e69c-4a0b-abd8-60a201f348a8', '585637a9-725a-4532-95df-85825d1268d9', '2026-01-12 09:51:02.966552', '2026-01-12 09:51:02.966552'),
	('af32349b-7b7f-4188-82fd-8fac3d21570c', 'college_educator', '06920f0b-8618-480f-98fa-ae1954fb602e', 'e0bcf53a-f429-45a0-9bed-b8b323e404c2', '2026-01-12 09:51:02.966552', '2026-01-12 09:51:02.966552'),
	('f1895077-ddc5-4503-a288-ea85ae07b738', 'college_educator', '06920f0b-8618-480f-98fa-ae1954fb602e', '913075b3-e1a4-4cfd-b2f2-ad5244e45835', '2026-01-12 09:51:02.966552', '2026-01-12 09:51:02.966552'),
	('a88cecb8-d6eb-4d34-be71-a5d20eca4a8f', 'college_educator', '06920f0b-8618-480f-98fa-ae1954fb602e', '585637a9-725a-4532-95df-85825d1268d9', '2026-01-12 09:51:02.966552', '2026-01-12 09:51:02.966552'),
	('d17c231b-056a-47ec-b9cc-1c651efcdb02', 'college_educator', 'e8f6a9ca-3520-4925-8451-f9e94657fe37', '585637a9-725a-4532-95df-85825d1268d9', '2026-01-12 09:51:02.966552', '2026-01-12 09:51:02.966552'),
	('d8b46dd7-047b-414b-910a-ccfea115f740', 'college_educator', 'e8f6a9ca-3520-4925-8451-f9e94657fe37', '913075b3-e1a4-4cfd-b2f2-ad5244e45835', '2026-01-12 09:51:02.966552', '2026-01-12 09:51:02.966552'),
	('b42cb77c-6f7e-429f-be49-588cbfe8284e', 'college_educator', 'e8f6a9ca-3520-4925-8451-f9e94657fe37', 'e0bcf53a-f429-45a0-9bed-b8b323e404c2', '2026-01-12 09:51:02.966552', '2026-01-12 09:51:02.966552'),
	('8a75b6ee-9ab1-4114-a535-4e900145b55b', 'college_educator', 'e1e9aad7-aa40-4721-9844-ba52b692769e', '585637a9-725a-4532-95df-85825d1268d9', '2026-01-12 09:51:02.966552', '2026-01-12 09:51:02.966552'),
	('b7e1be2b-4e21-403d-8eab-543cd9d22971', 'college_educator', 'eb507543-c59b-435d-a04c-2bda92fe2d43', '585637a9-725a-4532-95df-85825d1268d9', '2026-01-12 09:51:02.966552', '2026-01-12 09:51:02.966552'),
	('ed0b9681-bcab-49b6-b814-ad7cb5ddd011', 'college_educator', '955aa3b2-93df-4ccf-9b10-5507889528e6', '585637a9-725a-4532-95df-85825d1268d9', '2026-01-12 09:51:02.966552', '2026-01-12 09:51:02.966552'),
	('d9b4c014-6e9b-4087-b9e1-cc4e099173b9', 'college_educator', 'd78c9bd7-b37e-4119-b4ce-6bdbe5d7e66f', 'e0bcf53a-f429-45a0-9bed-b8b323e404c2', '2026-01-12 09:51:02.966552', '2026-01-12 09:51:02.966552'),
	('9c481b97-90b9-403c-bad5-959eab77ee08', 'college_educator', 'd26be101-3721-4b06-b094-eb2dc2428330', 'e0bcf53a-f429-45a0-9bed-b8b323e404c2', '2026-01-12 09:51:02.966552', '2026-01-12 09:51:02.966552');


--

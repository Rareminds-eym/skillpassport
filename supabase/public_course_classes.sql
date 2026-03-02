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
-- Data for Name: course_classes; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."course_classes" ("course_class_id", "course_id", "class_name", "created_at") VALUES
	('9d61713f-1482-4784-b4af-0816b7a42bf3', '71a8c1e0-4087-45f1-8f8a-b7bb8978322f', 'Class 11B', '2025-12-05 05:35:49.476824+00'),
	('8bd11aaf-8e7a-4bd4-b033-b4323712e502', '71a8c1e0-4087-45f1-8f8a-b7bb8978322f', 'Class 12A', '2025-12-05 05:35:49.476824+00'),
	('8eb36436-4ff1-4690-95c2-51d09b64dd49', 'd278abc4-837a-4d2c-a86e-816cd3e0a2f4', 'Class 10B', '2025-12-05 06:16:19.369571+00'),
	('d42db3ca-d11b-4fea-b14f-844d7187649f', 'd278abc4-837a-4d2c-a86e-816cd3e0a2f4', 'Class 12A', '2025-12-05 06:16:19.369571+00'),
	('269fdc8c-be74-47c3-837d-99946ebf7d62', 'bc66537e-6c0a-4473-940e-b842db79bb6e', 'Class 10B', '2025-12-05 06:17:46.840437+00'),
	('bdb67cf4-3078-4cf2-a272-1a08b76cf71f', 'bc66537e-6c0a-4473-940e-b842db79bb6e', 'Class 12A', '2025-12-05 06:17:46.840437+00'),
	('05f09767-81a5-416a-aebe-5bc8c48994dc', '3884150a-cc54-4577-a043-985bb0bef329', 'Class 12A', '2025-12-05 06:19:04.796646+00'),
	('3b2450fc-f446-41d8-87ee-7da0a310f518', '3884150a-cc54-4577-a043-985bb0bef329', 'Class 11B', '2025-12-05 06:19:04.796646+00'),
	('beb0655e-90f5-47e0-80d8-1756488b6a24', 'a39a9ac1-1d98-4efd-ba88-d3049c1536f8', 'Class 11B', '2025-12-05 06:20:56.346317+00'),
	('d301a8fe-c2ef-4811-bd22-cd0c0c00e9b5', 'a39a9ac1-1d98-4efd-ba88-d3049c1536f8', 'Class 12A', '2025-12-05 06:20:56.346317+00'),
	('d34c3b6e-bf7b-4fa1-bde8-86a49833e0bc', '06163808-6eb0-4a6d-8f8c-72b3a1fa7cb1', 'Class 12A', '2025-12-05 06:23:45.853234+00'),
	('3f1bacc4-1f54-4470-a181-f92c277ed630', '06163808-6eb0-4a6d-8f8c-72b3a1fa7cb1', 'Class 11B', '2025-12-05 06:23:45.853234+00'),
	('5c1d4d9d-3609-42ed-95e1-4eade2011dde', 'fa52fc84-88f7-44e6-bad5-1af2a14ca009', 'Class 10B', '2025-12-08 04:39:15.490683+00'),
	('1efb5899-b9ca-48fd-afd4-51fab6250ec7', 'fa52fc84-88f7-44e6-bad5-1af2a14ca009', 'Class 12A', '2025-12-08 04:39:15.490683+00'),
	('b58a64cb-d344-4856-91b8-d800f301c9c4', 'e2b3e9a7-2ad3-48a5-8bd8-889011eb732e', 'Class 10B', '2025-12-08 04:41:35.06098+00'),
	('a2206887-07ec-4905-a9a1-c07fcc58ba80', '2f6b3b36-eed0-4663-91b1-1f6cca3fb30b', 'Class 10B', '2025-12-08 10:18:39.721872+00'),
	('41316edd-8236-4c60-b382-1067456b893a', '2f6b3b36-eed0-4663-91b1-1f6cca3fb30b', 'Class 12A', '2025-12-08 10:18:39.721872+00'),
	('c1a08c1f-0b70-4b13-905b-1ead99788dca', 'f1cac1d9-b949-4927-9867-dce223662278', 'Class 12A', '2025-12-08 12:09:22.530067+00'),
	('f1e10881-c745-46cc-b60e-a087f1c1108c', 'f1cac1d9-b949-4927-9867-dce223662278', 'Class 11B', '2025-12-08 12:09:22.530067+00'),
	('cc0d5417-ee60-45f2-aeb6-df13d10f60fc', 'f1cac1d9-b949-4927-9867-dce223662278', 'Class 11A', '2025-12-08 12:09:22.530067+00');


--

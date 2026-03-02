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
-- Data for Name: college_mentor_student_allocations; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."college_mentor_student_allocations" ("id", "mentor_id", "student_id", "period_id", "assigned_date", "assigned_by", "status", "transfer_reason", "completion_date", "created_at") VALUES
	('a11f11b8-baa6-461c-8921-8e7e8597d4fe', '51da223b-c1ec-40f6-b0df-eb9c9d0f7378', '1b546e01-b1ca-48e7-9054-f53bd700ae7f', '909a7a7d-7092-44b6-95bb-58f9f3d05ee1', '2026-01-14', '51da223b-c1ec-40f6-b0df-eb9c9d0f7378', 'active', NULL, NULL, '2026-01-14 10:23:45.064886+00'),
	('244ec78d-0e7a-4597-85c6-f19a41818d40', '51da223b-c1ec-40f6-b0df-eb9c9d0f7378', 'a340be56-cc51-469b-a206-034c1e6d65e1', '909a7a7d-7092-44b6-95bb-58f9f3d05ee1', '2026-01-14', '51da223b-c1ec-40f6-b0df-eb9c9d0f7378', 'active', NULL, NULL, '2026-01-14 10:23:45.064886+00'),
	('3529bd9f-8c1e-4df5-8c57-3d3efc91ef48', '51da223b-c1ec-40f6-b0df-eb9c9d0f7378', 'bdcb8c6a-b91c-4dd3-bb75-37e955ca29c1', '909a7a7d-7092-44b6-95bb-58f9f3d05ee1', '2026-01-14', '51da223b-c1ec-40f6-b0df-eb9c9d0f7378', 'active', NULL, NULL, '2026-01-14 10:23:45.064886+00'),
	('45a42c79-a196-44d1-af1b-ce0135e1c2bb', '462572af-66de-43da-97b9-339b6cf4d8ed', '45e7e1a8-ec94-4658-9693-38a9cfe3fb4e', 'befc0605-38ad-4277-90c6-07ca2e856fcd', '2026-01-14', '51da223b-c1ec-40f6-b0df-eb9c9d0f7378', 'active', NULL, NULL, '2026-01-14 10:24:19.483639+00'),
	('b62a81a7-792a-405c-ab0e-656503b6a41e', '462572af-66de-43da-97b9-339b6cf4d8ed', '7bc9dd10-61fa-4a53-ba36-eadbdd01c8b1', 'befc0605-38ad-4277-90c6-07ca2e856fcd', '2026-01-14', '51da223b-c1ec-40f6-b0df-eb9c9d0f7378', 'active', NULL, NULL, '2026-01-14 10:24:19.483639+00'),
	('b6a32da3-6920-4a6f-bbbe-0908dead66bd', '462572af-66de-43da-97b9-339b6cf4d8ed', '059af805-8f27-4b71-96af-f9e0acbd5884', 'befc0605-38ad-4277-90c6-07ca2e856fcd', '2026-01-14', '51da223b-c1ec-40f6-b0df-eb9c9d0f7378', 'active', NULL, NULL, '2026-01-14 10:24:19.483639+00'),
	('84e046a7-aa47-4bfc-ad1f-10d620777333', '51da223b-c1ec-40f6-b0df-eb9c9d0f7378', 'edfd01a7-9c09-4cda-9262-07f50c0fc066', 'befc0605-38ad-4277-90c6-07ca2e856fcd', '2026-01-14', '51da223b-c1ec-40f6-b0df-eb9c9d0f7378', 'transferred', 'Reassigned by admin', '2026-01-14', '2026-01-14 10:22:33.578847+00'),
	('b0a33e96-d30f-4306-8a07-80abac58bbc5', '51da223b-c1ec-40f6-b0df-eb9c9d0f7378', '7b154416-6c5f-4642-8c8d-0447d683936a', 'befc0605-38ad-4277-90c6-07ca2e856fcd', '2026-01-14', '51da223b-c1ec-40f6-b0df-eb9c9d0f7378', 'transferred', 'Reassigned by admin', '2026-01-14', '2026-01-14 10:22:33.578847+00'),
	('7872a25c-a385-4b1b-bb54-93fe3eea69c2', '462572af-66de-43da-97b9-339b6cf4d8ed', '7b154416-6c5f-4642-8c8d-0447d683936a', 'befc0605-38ad-4277-90c6-07ca2e856fcd', '2026-01-14', '462572af-66de-43da-97b9-339b6cf4d8ed', 'active', 'Reassigned by admin', NULL, '2026-01-14 10:31:29.625517+00'),
	('3fdbc1a1-6c86-456a-a6ff-083c21450c6a', '462572af-66de-43da-97b9-339b6cf4d8ed', 'edfd01a7-9c09-4cda-9262-07f50c0fc066', 'befc0605-38ad-4277-90c6-07ca2e856fcd', '2026-01-14', '462572af-66de-43da-97b9-339b6cf4d8ed', 'transferred', 'Reassigned by admin', '2026-01-14', '2026-01-14 10:24:37.199277+00'),
	('23061222-6a6d-483b-b0bf-fc00ac8e9c4b', '0f4b36d3-bebe-456f-8e11-b89a4fe2a723', 'afaa9e81-1552-4c1d-a76d-551134295567', 'befc0605-38ad-4277-90c6-07ca2e856fcd', '2026-01-14', '51da223b-c1ec-40f6-b0df-eb9c9d0f7378', 'active', NULL, NULL, '2026-01-14 10:40:11.176444+00'),
	('7665f870-7eeb-4344-a93e-9084a1efaa92', '0f4b36d3-bebe-456f-8e11-b89a4fe2a723', '3eeec2a6-eb85-49ef-a6d6-772efd32c149', 'befc0605-38ad-4277-90c6-07ca2e856fcd', '2026-01-14', '51da223b-c1ec-40f6-b0df-eb9c9d0f7378', 'active', NULL, NULL, '2026-01-14 10:40:11.176444+00'),
	('1a0ff981-e40e-429d-9891-8c27bd204bb5', '0f4b36d3-bebe-456f-8e11-b89a4fe2a723', 'da28d932-a8fc-4a6f-9076-81523fabd069', 'befc0605-38ad-4277-90c6-07ca2e856fcd', '2026-01-14', '51da223b-c1ec-40f6-b0df-eb9c9d0f7378', 'active', NULL, NULL, '2026-01-14 10:40:11.176444+00'),
	('0acff150-8cb3-4557-8a09-4fb7217c6182', '0f4b36d3-bebe-456f-8e11-b89a4fe2a723', '7a565b7c-fbf2-4773-baa2-3bad99827094', 'befc0605-38ad-4277-90c6-07ca2e856fcd', '2026-01-14', '51da223b-c1ec-40f6-b0df-eb9c9d0f7378', 'active', NULL, NULL, '2026-01-14 10:40:11.176444+00'),
	('e53d21cc-126d-4ebf-a508-2aa4111bc2bc', '0f4b36d3-bebe-456f-8e11-b89a4fe2a723', '9045c7aa-d018-499f-90cf-8e98e28f11e9', 'befc0605-38ad-4277-90c6-07ca2e856fcd', '2026-01-14', '51da223b-c1ec-40f6-b0df-eb9c9d0f7378', 'active', NULL, NULL, '2026-01-14 10:40:11.176444+00'),
	('585526bd-6990-4026-89a8-142f6d35417a', '0f4b36d3-bebe-456f-8e11-b89a4fe2a723', 'e885ff88-9351-476c-bdb4-c2ca12654dba', 'b8137fd9-b43b-4943-8803-612e4da3cb80', '2026-01-16', '51da223b-c1ec-40f6-b0df-eb9c9d0f7378', 'pending', NULL, NULL, '2026-01-16 17:57:07.370804+00'),
	('aa9e49ce-60b1-4775-9023-ad779bbf052d', '0f4b36d3-bebe-456f-8e11-b89a4fe2a723', '842960ae-9022-4449-9dac-14efc88d4475', 'b8137fd9-b43b-4943-8803-612e4da3cb80', '2026-01-16', '51da223b-c1ec-40f6-b0df-eb9c9d0f7378', 'pending', NULL, NULL, '2026-01-16 17:57:07.370804+00'),
	('111f3013-f6a3-4eb5-ab04-f7f44174e726', '0f4b36d3-bebe-456f-8e11-b89a4fe2a723', 'e885ff88-9351-476c-bdb4-c2ca12654dba', '0845292a-70b2-4cbe-923b-31f7b063605a', '2026-01-16', '51da223b-c1ec-40f6-b0df-eb9c9d0f7378', 'pending', NULL, NULL, '2026-01-16 17:58:10.553721+00'),
	('55fd87a3-e1e6-4754-8ab3-a36d037cf5cb', '0f4b36d3-bebe-456f-8e11-b89a4fe2a723', '842960ae-9022-4449-9dac-14efc88d4475', '0845292a-70b2-4cbe-923b-31f7b063605a', '2026-01-16', '51da223b-c1ec-40f6-b0df-eb9c9d0f7378', 'pending', NULL, NULL, '2026-01-16 17:58:10.553721+00'),
	('bf219c91-1a72-43ae-a929-84f78d0bf3bf', '0f4b36d3-bebe-456f-8e11-b89a4fe2a723', '7e7f1abf-bb41-4f86-9bd9-3820b471d08b', '74762f3e-b219-4b1f-bcbc-400f637b0790', '2026-01-16', '51da223b-c1ec-40f6-b0df-eb9c9d0f7378', 'pending', NULL, NULL, '2026-01-16 17:31:58.782462+00'),
	('81da07a8-43e7-4f33-b7c5-afde53065c10', '0f4b36d3-bebe-456f-8e11-b89a4fe2a723', '4452a7a8-689e-4806-bae3-fe3ecc32735a', '74762f3e-b219-4b1f-bcbc-400f637b0790', '2026-01-16', '51da223b-c1ec-40f6-b0df-eb9c9d0f7378', 'pending', NULL, NULL, '2026-01-16 17:31:58.782462+00'),
	('cab436c3-042a-41a4-8104-f48100d7a489', '0f4b36d3-bebe-456f-8e11-b89a4fe2a723', '30845db2-bb6a-470c-840a-28208b26805c', '74762f3e-b219-4b1f-bcbc-400f637b0790', '2026-01-16', '51da223b-c1ec-40f6-b0df-eb9c9d0f7378', 'pending', NULL, NULL, '2026-01-16 17:31:58.782462+00'),
	('9a62a148-38ea-44d9-931f-79523339744d', '51da223b-c1ec-40f6-b0df-eb9c9d0f7378', 'edfd01a7-9c09-4cda-9262-07f50c0fc066', 'befc0605-38ad-4277-90c6-07ca2e856fcd', '2026-01-14', '51da223b-c1ec-40f6-b0df-eb9c9d0f7378', 'transferred', 'Reassigned by admin', '2026-01-17', '2026-01-14 10:38:27.969322+00'),
	('ddcaf79a-3a5b-40d7-b78e-903340d01e35', '0f4b36d3-bebe-456f-8e11-b89a4fe2a723', 'edfd01a7-9c09-4cda-9262-07f50c0fc066', 'befc0605-38ad-4277-90c6-07ca2e856fcd', '2026-01-17', '0f4b36d3-bebe-456f-8e11-b89a4fe2a723', 'active', 'Reassigned by admin', NULL, '2026-01-17 05:04:32.313197+00'),
	('92a75c61-c591-4ec6-8079-fa42fbda5e9e', '51da223b-c1ec-40f6-b0df-eb9c9d0f7378', '43a8fa55-340d-47e0-b384-002f53e7df34', 'befc0605-38ad-4277-90c6-07ca2e856fcd', '2026-01-14', '51da223b-c1ec-40f6-b0df-eb9c9d0f7378', 'transferred', 'Reassigned by admin', '2026-01-17', '2026-01-14 10:22:33.578847+00'),
	('5e6e5295-2b82-4530-9dba-69cc598baabe', '0f4b36d3-bebe-456f-8e11-b89a4fe2a723', '43a8fa55-340d-47e0-b384-002f53e7df34', 'befc0605-38ad-4277-90c6-07ca2e856fcd', '2026-01-17', '0f4b36d3-bebe-456f-8e11-b89a4fe2a723', 'active', 'Reassigned by admin', NULL, '2026-01-17 05:06:01.12535+00'),
	('0ec1daac-73fd-4c37-8025-88fac8cdbf74', '51da223b-c1ec-40f6-b0df-eb9c9d0f7378', '7e7f1abf-bb41-4f86-9bd9-3820b471d08b', 'befc0605-38ad-4277-90c6-07ca2e856fcd', '2026-01-17', '51da223b-c1ec-40f6-b0df-eb9c9d0f7378', 'active', NULL, NULL, '2026-01-17 05:31:29.136726+00'),
	('bd432c43-6958-4d84-95ee-349c8cffc23b', '51da223b-c1ec-40f6-b0df-eb9c9d0f7378', '4452a7a8-689e-4806-bae3-fe3ecc32735a', 'befc0605-38ad-4277-90c6-07ca2e856fcd', '2026-01-17', '51da223b-c1ec-40f6-b0df-eb9c9d0f7378', 'active', NULL, NULL, '2026-01-17 05:31:29.136726+00');


--

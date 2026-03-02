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
-- Data for Name: class_swap_history; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."class_swap_history" ("id", "swap_request_id", "action", "actor_id", "actor_role", "notes", "created_at") VALUES
	('e4ba9513-7f9b-41d6-8627-9444de903aee', '1a322497-6c0d-4325-8589-e8becf9d5c6a', 'created', '0f4b36d3-bebe-456f-8e11-b89a4fe2a723', 'requester', 'Swap', '2026-01-08 08:30:28.772127+00'),
	('8e3b57b8-fc89-41f9-a541-d13596e25e1b', '1a322497-6c0d-4325-8589-e8becf9d5c6a', 'cancelled', '0f4b36d3-bebe-456f-8e11-b89a4fe2a723', 'requester', 'Request cancelled by requester', '2026-01-08 08:36:04.208608+00'),
	('53c4e7fb-ea0c-4868-929d-c791b50051f6', '0aa15048-f3a6-415f-b8d2-609749e758fe', 'created', '0f4b36d3-bebe-456f-8e11-b89a4fe2a723', 'requester', 'asdasd', '2026-01-08 08:36:26.041969+00'),
	('915a75c2-027f-4c3b-b8d3-05b0bc0ce468', '18317121-1b3c-4f44-be51-d134c3b223d4', 'created', '0f4b36d3-bebe-456f-8e11-b89a4fe2a723', 'requester', 'i was taking sick leave', '2026-01-12 08:01:23.389072+00'),
	('40067719-976a-41ef-9972-cfcc75673d8e', '04b20220-bf89-465e-9dee-a55f75547059', 'created', '0f4b36d3-bebe-456f-8e11-b89a4fe2a723', 'requester', 'fghj', '2026-01-12 08:02:46.246799+00'),
	('40c55556-a421-48bb-aeb3-ed95f6732b8f', '6005ef18-d5e5-4a41-9b87-96fd682b3512', 'created', '0f4b36d3-bebe-456f-8e11-b89a4fe2a723', 'requester', 'health issue', '2026-01-12 08:44:21.750118+00');


--

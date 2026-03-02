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
-- Data for Name: phone_otps; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."phone_otps" ("id", "phone", "otp_hash", "expires_at", "attempts", "verified", "created_at", "updated_at") VALUES
	('4de5a33a-b31a-4ab8-bd6b-7cf42bec398e', '+918473058469', 'd16651ad1bc184b7150145fd93ab717d91336239e01db6b03bfef85aa49fe751', '2026-01-07 06:52:07.386+00', 0, false, '2026-01-07 06:47:07.592061+00', '2026-01-07 06:47:07.592061+00'),
	('042b1b7c-1974-4dc8-acd1-1780760a4343', '+919567989948', 'b7b525d5b114efbba46da8d24e30e7646912bfe7e976f55615c5efc8e590cd6b', '2026-01-09 08:00:40.191+00', 0, false, '2026-01-09 07:55:40.414456+00', '2026-01-09 07:55:40.414456+00'),
	('0309698c-5581-4acb-9863-32541b63f757', '+919876543210', 'c9fb746bcd82fbf7818ed77e77206cba0d7385a7f5c2cb61ca6abf0552a6fa67', '2025-12-30 11:29:38.584+00', 0, false, '2025-12-30 11:24:38.788214+00', '2025-12-30 11:24:38.788214+00'),
	('301868af-b963-4150-96f5-e847894dd929', '+916362214161', '870d23adeff7fb44cfe113718460a91cc99a0d9020949516b4e17d97f4d8faa3', '2026-01-03 04:57:09.193+00', 0, false, '2026-01-03 04:52:09.39306+00', '2026-01-03 04:52:09.39306+00'),
	('0dd15446-21b2-4247-b930-d3d8ea6c398a', '+919970882605', 'b2a54d4b0c6b4e3a7f0748ddd7317e30a5664e4b7028ced333c9648730e8c450', '2026-01-05 04:18:31.358+00', 0, false, '2026-01-05 04:13:31.556562+00', '2026-01-05 04:13:31.556562+00'),
	('29372926-3cc4-48f3-a489-13e01b37b177', '+919066445899', '79f42dc8fbe9ff04cc4b99ba5741201b2cb7af4f12993a9775c9dac977e8dfaa', '2026-01-05 04:18:58.638+00', 0, false, '2026-01-05 04:13:58.854231+00', '2026-01-05 04:13:58.854231+00'),
	('ba9dc7e2-20cb-4118-8b1c-0ef21434d354', '+916302866913', '07baca57f0ec88dbf0646b4a1dfe011ddefb653f736bd932772eb49b1863d666', '2026-01-07 06:32:50.454+00', 0, false, '2026-01-07 06:27:50.633155+00', '2026-01-07 06:27:50.633155+00');


--

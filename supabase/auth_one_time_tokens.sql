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
-- Data for Name: one_time_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."one_time_tokens" ("id", "user_id", "token_type", "token_hash", "relates_to", "created_at", "updated_at") VALUES
	('3a391e0a-cd85-4eb4-b1ce-05ca13a4e68e', '92b46d37-bb9b-449e-980e-ba3fa8c6a404', 'recovery_token', 'fb7709cbae7650dc4a2be0b5dc99bc29e7086d34dab1bddf3df766c6', 'karthikeyan@rareminds.in', '2025-12-02 07:22:43.388059', '2025-12-02 07:22:43.388059'),
	('b1c87359-8275-4497-96b2-dd86309b0042', '231f6b99-93a0-4114-ba59-a0274ea2f04e', 'recovery_token', '0c358fb0402206c32e15048ce90ffc5bd0e96a6f07c2264bb0a48aa2', 'test@gmail.com', '2025-12-23 04:46:10.614173', '2025-12-23 04:46:10.614173'),
	('1d5c2f99-b770-4c7f-a274-934d2f024890', '3531e63e-589e-46e7-9248-4a769e84b00d', 'recovery_token', '09ac1b1e4bbc16a296eaf415093443f76c485a6260bb8773718b3ccd', 'aditi.sharma@aditya.college.edu', '2026-01-27 12:41:40.453806', '2026-01-27 12:41:40.453806');


--

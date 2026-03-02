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
-- Data for Name: app_config; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."app_config" ("key", "value") VALUES
	('supabase_anon_key', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwb29sZWR1aW55eXp4Z3Jjd2tvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5OTQ2OTgsImV4cCI6MjA3NTU3MDY5OH0.LvId6Cq13yeASDt0RXbb0y83P2xAZw0L1Q4KJAXT4jk'),
	('embedding_api_url', 'https://embedding-api.dark-mode-d021.workers.dev');


--

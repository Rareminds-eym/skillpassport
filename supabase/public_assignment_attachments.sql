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
-- Data for Name: assignment_attachments; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."assignment_attachments" ("attachment_id", "assignment_id", "file_name", "file_type", "file_size", "file_url", "uploaded_date") VALUES
	('e121a69f-c1d7-413a-a127-d26e95577b1c', '77527857-c603-44f0-b274-5863b81a227f', 'STUDENT:c1450f17-41ab-43fc-8cf8-b625ab3b2941:experience_letter.pdf', 'application/pdf', 1585, 'https://pub-ad91abcd16cd9e9c569d83d9ef46e398.r2.dev/assignments/77527857-c603-44f0-b274-5863b81a227f/submissions/c1450f17-41ab-43fc-8cf8-b625ab3b2941/1767436465000_experience_letter.pdf', '2026-01-03 10:34:29.560796+00'),
	('c64a3a76-a0f0-4f7c-9230-1dab3c69f5e8', '5d58c5c6-56da-4c0a-be37-01cd40a134b5', 'STUDENT:397b9958-b9b5-44e7-b703-32d7f16dc055:Mechanical_Design_Engineer_Career_Roadmap.pdf', 'application/pdf', 11225, 'https://pub-ad91abcd16cd9e9c569d83d9ef46e398.r2.dev/assignments/5d58c5c6-56da-4c0a-be37-01cd40a134b5/submissions/397b9958-b9b5-44e7-b703-32d7f16dc055/1769596986517_Mechanical_Design_Engineer_Career_Roadmap.pdf', '2026-01-28 10:43:08.834451+00'),
	('b9b9dad5-29c8-49bb-9492-826878d5b16b', 'f4024fc6-d719-4577-8e87-54570b826349', 'STUDENT:d4ce2281-9997-4339-aaea-10e184298eac:Mechanical_Design_Engineer_Career_Roadmap.pdf', 'application/pdf', 11225, 'https://pub-ad91abcd16cd9e9c569d83d9ef46e398.r2.dev/assignments/f4024fc6-d719-4577-8e87-54570b826349/submissions/d4ce2281-9997-4339-aaea-10e184298eac/1769661567338_Mechanical_Design_Engineer_Career_Roadmap.pdf', '2026-01-29 04:39:31.022843+00');


--

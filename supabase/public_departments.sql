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
-- Data for Name: departments; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."departments" ("id", "school_id", "name", "code", "description", "status", "created_at", "updated_at", "metadata", "created_by", "updated_by", "college_id") VALUES
	('4affc7c0-52f7-40c6-924e-d90cc0d11285', NULL, 'Department Of Mechanical Engineering', 'MECH', 'Department of Mechanical Engineering', 'active', '2025-12-12 07:43:14.62262+00', '2026-01-09 08:28:25.446888+00', '{"hod": "Susmitha M", "email": "susmitha@gmail.com", "hod_id": "0f4b36d3-bebe-456f-8e11-b89a4fe2a723", "hod_designation": "lecturer"}', '91bf6be4-31a5-4d6a-853d-675596755cee', '91bf6be4-31a5-4d6a-853d-675596755cee', 'c16a95cf-6ee5-4aa9-8e47-84fbda49611d'),
	('a987bd28-dcd0-478d-af06-42a0d0128da7', NULL, 'Department  Of Computer Science & Engineering', 'CSE', 'Department of Computer Science and Engineering', 'active', '2025-12-12 07:43:01.754901+00', '2026-01-09 08:29:13.682441+00', '{"hod": "test T H", "email": "testcollege@email.in", "hod_id": "8b6dc9cb-adea-49b4-8fd8-ed35a2650fbd", "hod_designation": "Head of Department"}', '91bf6be4-31a5-4d6a-853d-675596755cee', '91bf6be4-31a5-4d6a-853d-675596755cee', 'c16a95cf-6ee5-4aa9-8e47-84fbda49611d'),
	('732fe289-3a8c-426a-ab49-efce4de5ef61', NULL, 'Department Of Electrical and Electronics Engineering', 'EEE', '', 'active', '2026-01-07 16:15:50.919574+00', '2026-01-09 08:29:28.930671+00', '{"hod": "test college", "email": "test34@college.in", "hod_id": "6794ce27-ac74-4a47-871f-21c8d8f9f61c", "hod_designation": "Head of Department"}', '91bf6be4-31a5-4d6a-853d-675596755cee', '91bf6be4-31a5-4d6a-853d-675596755cee', 'c16a95cf-6ee5-4aa9-8e47-84fbda49611d'),
	('5a2cf269-4f14-423c-85b6-10396c3c0177', NULL, 'Department of Electronics & Communication Engineering', 'ECE', 'Department of Electronics and Communication Engineering', 'active', '2025-12-12 07:43:14.62262+00', '2026-01-09 08:29:42.75699+00', '{"hod": "Ritik Kumar", "email": "ritik@gmail.com", "hod_id": "51da223b-c1ec-40f6-b0df-eb9c9d0f7378", "hod_designation": "Head of Department"}', '91bf6be4-31a5-4d6a-853d-675596755cee', '91bf6be4-31a5-4d6a-853d-675596755cee', 'c16a95cf-6ee5-4aa9-8e47-84fbda49611d'),
	('4adc893c-252b-4dde-8c6c-fee832b1922c', NULL, 'Department Of Business Administration', 'MBA', 'Department of Business Administration', 'active', '2026-01-08 05:48:28.03558+00', '2026-01-09 08:30:11.212466+00', '{"hod": "", "email": "", "hod_id": "", "hod_designation": ""}', NULL, '91bf6be4-31a5-4d6a-853d-675596755cee', 'c16a95cf-6ee5-4aa9-8e47-84fbda49611d');


--

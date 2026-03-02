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
-- Data for Name: metrics_snapshots; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."metrics_snapshots" ("id", "snapshotDate", "activeUniversities", "registeredStudents", "verifiedPassports", "aiVerifiedPercent", "employabilityIndex", "activeRecruiters", "createdAt", "totalSchools", "totalColleges", "totalCompanies", "metadata", "jobsecured") VALUES
	('504ba67f-2573-4c31-b8b9-d4bab6da041d', '2025-12-19', 0, 77, 0, 0.00, 0.00, 0, '2025-12-19 12:22:50.212403+00', 0, 0, 0, '{}', 0),
	('f57894a5-cdf9-4d6d-98fc-96e184cbc044', '2025-12-20', 0, 77, 0, 0.00, 0.00, 0, '2025-12-20 03:53:03.252619+00', 0, 0, 0, '{}', 0),
	('90330813-ec09-4b87-bf05-4c37801bb25f', '2025-12-23', 0, 80, 0, 0.00, 0.00, 0, '2025-12-23 07:16:44.675481+00', 0, 0, 0, '{}', 0);


--

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
-- Data for Name: recruiters; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."recruiters" ("id", "name", "email", "phone", "state", "website", "verificationstatus", "isactive", "createdat", "updatedat", "approval_status", "approved_by", "approved_at", "rejection_reason", "account_status", "user_id", "company_id") VALUES
	('902d03ef-71c0-4781-8e09-c2ef46511cbb', 'Recutier', 'rareminds@recutier.in', '7899044489', NULL, NULL, 'pending', true, '2025-12-02 08:58:13.442588+00', '2025-12-02 08:58:13.442588+00', 'pending', NULL, NULL, NULL, 'active', '5bac50f5-c2a2-433f-a027-7cafdad3ebf7', '9c8f0034-264b-4007-a42f-b12296290832'),
	('eb523e8c-8b7b-4dca-8437-6ba3a0a94f9f', 'Suresh Babu', 'hr@abservetech.com', '9222379222', 'Tamil Nadu', 'https://www.abservetech.com/', 'approved', true, '2025-12-05 10:46:06.95735+00', '2025-12-05 10:46:06.95735+00', 'approved', NULL, '2025-12-05 10:46:06.95735+00', NULL, 'active', 'bdf6a2c6-a014-45bc-ae5b-40c5f0a09c69', '42cdc970-84e7-452c-92f1-fcad0dedd4a2'),
	('abe0cee7-8ff4-418c-ad95-1dc5a1eca7a9', 'Venkat Raman', 'careers@elysiumtechnologies.com', '9677761442', 'Tamil Nadu', 'https://elysiumtechnologies.com/', 'approved', true, '2025-12-05 10:46:06.95735+00', '2025-12-05 10:46:06.95735+00', 'approved', NULL, '2025-12-05 10:46:06.95735+00', NULL, 'active', '7122a549-3655-4bc1-856b-79fe7f3d868f', '4462e539-f625-443c-b666-c9c8fd01efe7'),
	('58f00857-f9b9-4008-9382-e722dd5c7992', 'Karthik Raj', 'hr@trioangle.com', '7200751000', 'Tamil Nadu', 'https://www.trioangle.com/', 'approved', true, '2025-12-05 10:46:06.95735+00', '2025-12-05 10:46:06.95735+00', 'approved', NULL, '2025-12-05 10:46:06.95735+00', NULL, 'active', 'b081a604-4259-48ac-9d8d-71988eddc586', '60f692db-f830-4704-a045-68c456ab5655'),
	('e44269a3-9ca5-43d0-9e49-cc13c0324633', 'Rajesh Kumar', 'recruiter1@axninfotech.in', '9677399377', 'Tamil Nadu', 'https://axninfotech.in/', 'approved', true, '2025-12-05 10:46:06.95735+00', '2025-12-05 11:12:49.293196+00', 'approved', NULL, '2025-12-05 10:46:06.95735+00', NULL, 'active', '74ce15a0-cf2e-44ce-9dd1-cae765e2bc41', '862e57ae-1826-405a-a81e-4cf8ca7c2ded'),
	('f2c9f20a-650f-4f5d-9fc5-0f156f9e7113', 'Roshan Patel', 'roshan@pupahomecare.com', '9585556414', 'Tamil Nadu', 'https://www.pupaindia.com/', 'approved', true, '2025-12-05 10:46:06.95735+00', '2025-12-05 11:12:49.293196+00', 'approved', NULL, '2025-12-05 10:46:06.95735+00', NULL, 'active', '399954ab-088c-4376-843f-c04d4ef56ea7', '7ee81e39-a27a-4a70-954b-7c91e49a5d13'),
	('38635d82-df28-4877-8238-095b6555ddf5', 'Kumar Raj', 'hr@sgroupofindustries.com', '9080594399', 'Tamil Nadu', 'https://sgroupofindustries.com/', 'approved', true, '2025-12-05 10:46:06.95735+00', '2025-12-05 11:12:49.293196+00', 'approved', NULL, '2025-12-05 10:46:06.95735+00', NULL, 'active', 'e69217f9-dd44-48f1-983e-2c3923872111', '2988b257-5a0d-409a-b81e-faa99051fb3b'),
	('90e3688b-f3e2-48fc-a078-82fb163202b3', 'Priya Sharma', 'hr@zealsoft.net', '9944974003', 'Tamil Nadu', 'https://www.zealsoft.net/', 'approved', true, '2025-12-05 10:46:06.95735+00', '2025-12-05 11:12:49.293196+00', 'approved', NULL, '2025-12-05 10:46:06.95735+00', NULL, 'active', 'b1b82442-48f5-49a3-b295-df2d23565558', 'f36baec1-f283-48d7-88c1-fcbbcd21b8b2'),
	('abab231e-84fb-45d1-96e9-2534c9dce00d', 'Meena Krishnan', 'career@isquarebs.com', '8012005000', 'Tamil Nadu', 'https://www.isquarebs.com/', 'approved', true, '2025-12-05 10:46:06.95735+00', '2025-12-05 11:12:49.293196+00', 'approved', NULL, '2025-12-05 10:46:06.95735+00', NULL, 'active', 'cab505e0-c6e4-4ad2-9540-352efc0352d3', 'feb8ffcf-c0d5-4279-b189-139ce43d5788'),
	('60097bf6-1f1e-49c1-a9b3-24e91e29b85e', 'test', 'test@ewcu.in', '6362214161', NULL, NULL, 'pending', true, '2025-12-24 07:43:04.180061+00', '2025-12-24 07:43:04.180061+00', 'pending', NULL, NULL, NULL, 'active', '1d9705f6-0e0f-4fe5-8d37-bc7be658d114', 'a601133c-6b6c-4849-9199-5520d6defab2'),
	('51f4fdd2-d205-417c-b9a3-e7d3ff7e047b', 'Midhun Soman', 'midhunsom@rareminds.in', '8139838762', NULL, NULL, 'pending', true, '2025-12-27 07:46:03.482996+00', '2025-12-27 07:46:03.482996+00', 'pending', NULL, NULL, NULL, 'active', '189f2c86-3903-4dbe-9fdc-60c89b6bb04a', '9c8f0034-264b-4007-a42f-b12296290832'),
	('20d87640-afd1-41fb-9e3d-96e82c2078eb', 'swetha s', 'swethasaa@rareminds.in', '8618394091', NULL, NULL, 'pending', true, '2025-12-27 07:49:25.323569+00', '2025-12-27 07:49:25.323569+00', 'pending', NULL, NULL, NULL, 'active', '505893a5-2c15-4aaa-aa97-92b9150fd1fc', '9c8f0034-264b-4007-a42f-b12296290832'),
	('3dc7baf5-a4d0-4401-bb6a-5c5fa5c04af9', 'John Snow', 'johnsnow@gmail.com', '9865478214', NULL, NULL, 'pending', true, '2026-01-07 12:41:22.098121+00', '2026-01-07 12:41:22.098121+00', 'approved', NULL, NULL, NULL, 'active', '8000076b-67cd-4a82-a9d3-d2fd486a8a0b', NULL),
	('9aef9467-e48a-4c0e-80d0-dfc340789694', 'Swetha S', 'gowthunagaraj067@gmail.com', '8618394091', NULL, NULL, 'pending', true, '2026-01-22 09:40:25.546253+00', '2026-01-22 09:40:25.546253+00', 'approved', NULL, NULL, NULL, 'active', 'b3852b17-7db2-4788-bc04-104124ee1666', NULL);


--

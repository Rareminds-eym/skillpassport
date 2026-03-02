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
-- Data for Name: college_leave_types; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."college_leave_types" ("id", "college_id", "name", "code", "max_days_per_year", "is_paid", "requires_approval", "color", "description", "is_active", "created_at", "updated_at") VALUES
	('6dd8eb7d-0df2-4f0e-8298-37f078da0ee7', '659ebe4b-bdae-40c8-901f-2fed3c221574', 'Casual Leave', 'CL', 12, true, true, '#10b981', 'For personal matters and emergencies', true, '2026-01-06 07:23:19.588292+00', '2026-01-06 07:23:19.588292+00'),
	('a37f80da-299f-4d74-93c2-2b0dfe61fe2b', 'c16a95cf-6ee5-4aa9-8e47-84fbda49611d', 'Casual Leave', 'CL', 12, true, true, '#10b981', 'For personal matters and emergencies', true, '2026-01-06 07:23:19.588292+00', '2026-01-06 07:23:19.588292+00'),
	('ef1c3ac3-1532-4d43-9ee7-f4fc4a809151', '9902f7ed-1715-4828-8a71-91e2dd201d4d', 'Casual Leave', 'CL', 12, true, true, '#10b981', 'For personal matters and emergencies', true, '2026-01-06 07:23:19.588292+00', '2026-01-06 07:23:19.588292+00'),
	('646a3a84-c06b-41d7-9802-3495a53228ff', '07d56b11-b198-48a0-a78e-5c9aa6de097e', 'Casual Leave', 'CL', 12, true, true, '#10b981', 'For personal matters and emergencies', true, '2026-01-06 07:23:19.588292+00', '2026-01-06 07:23:19.588292+00'),
	('b0de1613-f813-4a8f-a724-ea87cce7c2c6', '033fa5e1-50ca-4fbb-ac92-98b0b05e8c59', 'Casual Leave', 'CL', 12, true, true, '#10b981', 'For personal matters and emergencies', true, '2026-01-06 07:23:19.588292+00', '2026-01-06 07:23:19.588292+00'),
	('79570c74-31c9-42b7-a9fe-48cb20b4bf02', '659ebe4b-bdae-40c8-901f-2fed3c221574', 'Sick Leave', 'SL', 10, true, true, '#ef4444', 'For medical reasons with certificate', true, '2026-01-06 07:23:19.588292+00', '2026-01-06 07:23:19.588292+00'),
	('036e7a12-c16b-4f31-a7f2-6ba620a97cf0', 'c16a95cf-6ee5-4aa9-8e47-84fbda49611d', 'Sick Leave', 'SL', 10, true, true, '#ef4444', 'For medical reasons with certificate', true, '2026-01-06 07:23:19.588292+00', '2026-01-06 07:23:19.588292+00'),
	('1e850cec-e5b5-4ce2-86a7-eca9e746d2e8', '9902f7ed-1715-4828-8a71-91e2dd201d4d', 'Sick Leave', 'SL', 10, true, true, '#ef4444', 'For medical reasons with certificate', true, '2026-01-06 07:23:19.588292+00', '2026-01-06 07:23:19.588292+00'),
	('cdd46a66-ff9a-4979-b0bb-5dc0c5b0dd2e', '07d56b11-b198-48a0-a78e-5c9aa6de097e', 'Sick Leave', 'SL', 10, true, true, '#ef4444', 'For medical reasons with certificate', true, '2026-01-06 07:23:19.588292+00', '2026-01-06 07:23:19.588292+00'),
	('8842c3b3-174b-42c9-8cfa-43438675a90e', '033fa5e1-50ca-4fbb-ac92-98b0b05e8c59', 'Sick Leave', 'SL', 10, true, true, '#ef4444', 'For medical reasons with certificate', true, '2026-01-06 07:23:19.588292+00', '2026-01-06 07:23:19.588292+00'),
	('edf1d908-8ce2-4e0b-bcf3-4a76cb681eea', '659ebe4b-bdae-40c8-901f-2fed3c221574', 'Earned Leave', 'EL', 15, true, true, '#6366f1', 'Accumulated leave for long service', true, '2026-01-06 07:23:19.588292+00', '2026-01-06 07:23:19.588292+00'),
	('887bc127-8352-4b91-81bd-1d5ee26d0d07', 'c16a95cf-6ee5-4aa9-8e47-84fbda49611d', 'Earned Leave', 'EL', 15, true, true, '#6366f1', 'Accumulated leave for long service', true, '2026-01-06 07:23:19.588292+00', '2026-01-06 07:23:19.588292+00'),
	('f6ec7594-6771-4032-94a9-c9d048a2a844', '9902f7ed-1715-4828-8a71-91e2dd201d4d', 'Earned Leave', 'EL', 15, true, true, '#6366f1', 'Accumulated leave for long service', true, '2026-01-06 07:23:19.588292+00', '2026-01-06 07:23:19.588292+00'),
	('3e19f809-43fc-4123-bfc8-5d855b19d7a2', '07d56b11-b198-48a0-a78e-5c9aa6de097e', 'Earned Leave', 'EL', 15, true, true, '#6366f1', 'Accumulated leave for long service', true, '2026-01-06 07:23:19.588292+00', '2026-01-06 07:23:19.588292+00'),
	('97639989-c15d-4b1a-8118-2cca32e18f9e', '033fa5e1-50ca-4fbb-ac92-98b0b05e8c59', 'Earned Leave', 'EL', 15, true, true, '#6366f1', 'Accumulated leave for long service', true, '2026-01-06 07:23:19.588292+00', '2026-01-06 07:23:19.588292+00'),
	('2d5e3559-98cd-4c6f-aae7-ea241219f46e', '659ebe4b-bdae-40c8-901f-2fed3c221574', 'Duty Leave', 'DL', 30, true, true, '#8b5cf6', 'For official duties, conferences, workshops', true, '2026-01-06 07:23:19.588292+00', '2026-01-06 07:23:19.588292+00'),
	('a93ab861-4179-4b14-946e-fa51d19bbb51', 'c16a95cf-6ee5-4aa9-8e47-84fbda49611d', 'Duty Leave', 'DL', 30, true, true, '#8b5cf6', 'For official duties, conferences, workshops', true, '2026-01-06 07:23:19.588292+00', '2026-01-06 07:23:19.588292+00'),
	('56c414b1-e338-49fe-b28c-bb6ef12f228a', '9902f7ed-1715-4828-8a71-91e2dd201d4d', 'Duty Leave', 'DL', 30, true, true, '#8b5cf6', 'For official duties, conferences, workshops', true, '2026-01-06 07:23:19.588292+00', '2026-01-06 07:23:19.588292+00'),
	('fe67de30-0c66-4d39-8ea1-57ca96e2262e', '07d56b11-b198-48a0-a78e-5c9aa6de097e', 'Duty Leave', 'DL', 30, true, true, '#8b5cf6', 'For official duties, conferences, workshops', true, '2026-01-06 07:23:19.588292+00', '2026-01-06 07:23:19.588292+00'),
	('401c15f1-dbc6-4dfa-9b6e-2406fb9c6b12', '033fa5e1-50ca-4fbb-ac92-98b0b05e8c59', 'Duty Leave', 'DL', 30, true, true, '#8b5cf6', 'For official duties, conferences, workshops', true, '2026-01-06 07:23:19.588292+00', '2026-01-06 07:23:19.588292+00'),
	('c295a371-e3be-4d1e-95e9-4e456f91c5e6', '659ebe4b-bdae-40c8-901f-2fed3c221574', 'Loss of Pay', 'LOP', 365, false, true, '#f59e0b', 'Unpaid leave when other leaves exhausted', true, '2026-01-06 07:23:19.588292+00', '2026-01-06 07:23:19.588292+00'),
	('a16ad06a-a92b-4306-af94-4f2fcf4fc996', 'c16a95cf-6ee5-4aa9-8e47-84fbda49611d', 'Loss of Pay', 'LOP', 365, false, true, '#f59e0b', 'Unpaid leave when other leaves exhausted', true, '2026-01-06 07:23:19.588292+00', '2026-01-06 07:23:19.588292+00'),
	('65543bb7-70f6-4940-83f3-2b4617b97c1f', '9902f7ed-1715-4828-8a71-91e2dd201d4d', 'Loss of Pay', 'LOP', 365, false, true, '#f59e0b', 'Unpaid leave when other leaves exhausted', true, '2026-01-06 07:23:19.588292+00', '2026-01-06 07:23:19.588292+00'),
	('f4888e51-de01-4285-ac1f-db8321da4670', '07d56b11-b198-48a0-a78e-5c9aa6de097e', 'Loss of Pay', 'LOP', 365, false, true, '#f59e0b', 'Unpaid leave when other leaves exhausted', true, '2026-01-06 07:23:19.588292+00', '2026-01-06 07:23:19.588292+00'),
	('d98fd508-8456-4548-9bf6-a62a6052dfea', '033fa5e1-50ca-4fbb-ac92-98b0b05e8c59', 'Loss of Pay', 'LOP', 365, false, true, '#f59e0b', 'Unpaid leave when other leaves exhausted', true, '2026-01-06 07:23:19.588292+00', '2026-01-06 07:23:19.588292+00');


--

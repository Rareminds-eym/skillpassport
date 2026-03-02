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
-- Data for Name: organizations; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."organizations" ("id", "name", "description", "created_at", "updated_at", "email", "phone", "state", "website", "verification_status", "is_active", "approval_status", "approved_by", "approved_at", "rejection_reason", "account_status", "organization_type", "admin_id", "address", "city", "country", "logo_url", "code", "pincode", "established_year", "metadata") VALUES
	('69cf3489-0046-4414-8acc-409174ffbd2c', 'St. Joseph High School', NULL, '2025-12-02 05:31:18.908+00', '2025-12-08 10:27:11.752198+00', 'admin@school.com', '6362214161', 'Karnataka', '', 'approved', true, 'approved', NULL, NULL, NULL, 'pending', 'school', '52004557-7df2-4c2a-bffb-437588cbb619', 'Karnatka', 'Bangalore', 'India', NULL, 'r-2342', '5722515', 2000, '{"board": "ICSE", "principal_name": "Admin", "principal_email": "admin@school.com", "principal_phone": "6362214161"}'),
	('573efb33-cf08-404f-a0c9-5ae2963f1423', 'Delhi Public School', NULL, '2025-12-01 10:32:21.692+00', '2025-12-01 10:57:58.634917+00', 'info@dpsdelhi.edu.in', '+917899044489', 'Karnataka', '', 'approved', true, 'pending', NULL, NULL, NULL, 'pending', 'school', NULL, 'nariahalli, PO: cholashettyhalli, Gauribidnur chikkaballapur bangalore', 'Chikkaballapur', 'India', NULL, 'EHS0001', '561209', 1999, '{"board": "ICSE", "principal_name": "Joseph", "principal_email": "info@dpsdelhi.edu.in", "principal_phone": "+917899044489"}'),
	('7aa07654-c30f-4b7b-9093-ed29677c7b4c', 'Bangalore City College', NULL, '2025-12-26 10:59:07.573904+00', '2025-12-26 10:59:07.573904+00', 'bcc@education.in', '+919970882608', 'Karnataka', '', 'approved', true, 'pending', NULL, NULL, NULL, 'pending', 'school', '175fc8ad-1f23-4514-9676-04d116bfba79', '14th Cross, JP Nagar', 'Bangalore', 'India', NULL, 'BCC', '560078', 1999, '{"board": "CBSE", "principal_name": "John Mathew", "principal_email": "BCC@education.in", "principal_phone": "+919970882608"}'),
	('659ebe4b-bdae-40c8-901f-2fed3c221574', 'Global Vision College of Management', NULL, '2025-12-09 07:54:20.313+00', '2025-12-09 07:54:20.313+00', 'GVCM@college.com', '+917899044489', 'Karnataka', '', 'approved', true, 'pending', NULL, NULL, NULL, 'pending', 'college', 'f0cbcfec-47e4-475a-b8c7-58a75f092a7b', 'nariahalli, PO: cholashettyhalli, Gauribidnur chikkaballapur bangalore', 'Chikkaballapur', 'India', NULL, 'ECE2005', '561209', 2000, '{"dean_name": "Paul", "dean_email": "GVCM@college.com", "dean_phone": "+917899044489", "affiliation": null, "college_type": "Management", "accreditation": null, "university_id": null}'),
	('c16a95cf-6ee5-4aa9-8e47-84fbda49611d', 'Aditya College', NULL, '2025-12-02 06:16:24.406+00', '2025-12-09 09:16:32.718126+00', 'aditya@college.edu', '7899044489', 'Karnataka', '', 'approved', true, 'approved', NULL, NULL, NULL, 'active', 'college', '91bf6be4-31a5-4d6a-853d-675596755cee', 'Karnataka', 'Bangalore', 'India', NULL, 'AD-232', '5722515', 2000, '{"dean_name": "Aditya", "dean_email": "aditya@college.edu", "dean_phone": "7899044489", "affiliation": null, "college_type": "Education", "accreditation": null, "university_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"}'),
	('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Aditya University', NULL, '2025-12-05 06:47:27.467347+00', '2025-12-05 06:47:27.467347+00', 'aditya@university.edu', '8765432789

', 'Karnataka', NULL, 'approved', true, 'pending', NULL, NULL, NULL, 'active', 'university', '91bf6be4-31a5-4d6a-853d-675596755cee', NULL, NULL, NULL, NULL, 'ADU-001', NULL, NULL, '{"district": "Bangalore", "university_type": null}'),
	('19442d7b-ff7f-4c7f-ad85-9e501f122b26', 'ABC School', NULL, '2025-12-01 10:20:31.768+00', '2025-12-02 04:25:38.870891+00', 'jishnu@rareminds.in', '0987654321', 'Karnataka', 'https://www.rareminds.in', 'approved', true, 'approved', NULL, NULL, NULL, 'pending', 'school', '908a6091-88d5-4604-a3bc-bc22f9b58a63', 'Test', 'Bengaluru', 'India', NULL, 'ABC', '789456', 1995, '{"board": "CBSE", "principal_name": "Jishnu", "principal_email": "jishnu@rareminds.in", "principal_phone": "0987654321"}'),
	('9902f7ed-1715-4828-8a71-91e2dd201d4d', 'Test', NULL, '2025-12-25 07:02:43.489338+00', '2025-12-25 07:02:43.489338+00', 'test@clgadmin.in', '6362214161', 'Karnataka', '', 'approved', true, 'pending', NULL, NULL, NULL, 'pending', 'college', '5d11356a-aa54-433f-b88a-48e74d24f060', 'Karnataka', 'Bangalore', 'India', NULL, 'test332', '5722515', 2000, '{"dean_name": "Admin", "dean_email": "test@clgadmin.in", "dean_phone": "6362214161", "affiliation": null, "college_type": "Medical", "accreditation": null, "university_id": null}'),
	('07d56b11-b198-48a0-a78e-5c9aa6de097e', 'Test', NULL, '2025-12-25 07:31:32.548465+00', '2025-12-25 07:31:32.548465+00', 'test1@clgadmin.in', '6362214161', 'Karnataka', '', 'approved', true, 'pending', NULL, NULL, NULL, 'pending', 'college', '78d49ece-8e2b-4ccf-97d8-d5faca53363e', 'karnataka', 'Bangalore', 'India', NULL, 'test3324', '5722515', 2000, '{"dean_name": "Admin", "dean_email": "test1@clgadmin.in", "dean_phone": "6362214161", "affiliation": null, "college_type": "Engineering", "accreditation": null, "university_id": null}'),
	('033fa5e1-50ca-4fbb-ac92-98b0b05e8c59', 'RCU', NULL, '2025-12-27 04:55:48.961569+00', '2025-12-27 04:55:48.961569+00', 'rcu@education.in', '9970882608', 'Karnataka', '', 'approved', true, 'pending', NULL, NULL, NULL, 'pending', 'college', '73a0cc8a-ba4b-4fbb-a827-dcd196f3f31b', '14th Cross, JP Nagar', 'Bangalore', 'India', NULL, 'RCU002', '560078', 1999, '{"dean_name": "Kumaran", "dean_email": "rcu@education.in", "dean_phone": "9970882608", "affiliation": null, "college_type": "Engineering", "accreditation": null, "university_id": null}'),
	('75903ce1-8102-4b2f-bbe3-25833abd438d', 'Adithya College', NULL, '2026-01-09 11:49:49.707962+00', '2026-01-09 11:49:49.707962+00', 'aditya@university.edu', '+919970882608', 'Karnataka', NULL, 'approved', true, 'approved', NULL, NULL, NULL, 'active', 'university', '0595e71f-9ce7-4118-9b00-ecb28cdc4c4c', '14th Cross, JP Nagar', 'Bangalore', 'India', NULL, NULL, NULL, NULL, '{}'),
	('70340577-8b1e-4271-a1e1-c670cd30442d', 'school test 1', NULL, '2026-01-10 20:34:24.984442+00', '2026-01-10 20:34:24.984442+00', 'gokullllll@rareminds.in', '1234567890', 'drtg', NULL, 'approved', true, 'approved', NULL, NULL, NULL, 'active', 'school', '9c319cc7-e1e1-450f-85af-579805cc152f', 'srefsrdf', 'sfgv', 'India', NULL, NULL, NULL, NULL, '{}'),
	('a97e44ea-43e8-4771-96e5-84ecd95be147', 'test school', NULL, '2026-01-10 21:12:38.385579+00', '2026-01-10 21:12:38.385579+00', 'gk@rm.cm', NULL, 'sdf', NULL, 'approved', true, 'approved', NULL, NULL, NULL, 'active', 'school', '88bdebb7-3da4-4e18-a19c-7f82dba9c04a', 'aedfs', 'sdrf', 'India', NULL, NULL, NULL, NULL, '{}'),
	('6176c144-143e-42b8-b4be-8464ddb82891', 'dgfbdf', NULL, '2026-01-10 22:17:16.090838+00', '2026-01-10 22:17:16.090838+00', 'gdf@dfv.vf', NULL, 'bgd', NULL, 'approved', true, 'approved', NULL, NULL, NULL, 'active', 'school', '18ce0bce-baea-4f21-aff8-876f5f8418db', 'bgdf', 'gdb', 'India', NULL, NULL, NULL, NULL, '{}'),
	('1b363f37-034d-475d-85d6-d3646c578ea1', 'test clg', NULL, '2026-01-11 12:15:40.574452+00', '2026-01-11 12:15:40.574452+00', 'dgdfdg@gmail.rdf', NULL, 'dgbd', NULL, 'approved', true, 'approved', NULL, NULL, NULL, 'active', 'college', '47dbb2b1-0eeb-448a-90cd-685de2eb8095', 'fgbdg', 'df', 'India', NULL, NULL, NULL, NULL, '{}'),
	('83945f29-e517-4f12-9704-b94fccc3ab42', 'RM test', NULL, '2026-01-16 04:19:45.925234+00', '2026-01-16 04:19:45.925234+00', 'gokulllll@rareminds.in', '1234567890', 'gdg', NULL, 'approved', true, 'approved', NULL, NULL, NULL, 'active', 'school', '6e4789bf-92f6-4084-af88-91d4b20cf1db', 'dgb', 'dgb', 'India', NULL, NULL, NULL, NULL, '{}');


--

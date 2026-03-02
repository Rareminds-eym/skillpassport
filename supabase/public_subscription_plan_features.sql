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
-- Data for Name: subscription_plan_features; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."subscription_plan_features" ("id", "plan_id", "category", "feature_key", "feature_name", "feature_value", "is_included", "is_addon", "addon_price", "display_order", "created_at", "addon_price_monthly", "addon_price_annual", "addon_description", "target_roles", "icon_url", "sort_order_addon") VALUES
	('ed7fdb4c-4431-43bc-bf7b-e69801e15c4a', '90e3f808-7d05-4c1b-bf9d-f888a57bc4d8', 'capacity', 'learners', 'Learners', 'Up to 1,000', true, false, NULL, 1, '2026-01-02 08:12:36.717473+00', NULL, NULL, NULL, '{}', NULL, 0),
	('a49d40c9-b47f-49ee-8520-0c21da766fdf', '90e3f808-7d05-4c1b-bf9d-f888a57bc4d8', 'capacity', 'admins', 'Admins / Managers', '2 admins', true, false, NULL, 2, '2026-01-02 08:12:36.717473+00', NULL, NULL, NULL, '{}', NULL, 0),
	('ac70e531-77a5-4c0b-b2ab-14728743dd05', '90e3f808-7d05-4c1b-bf9d-f888a57bc4d8', 'branding', 'branding', 'Branding', 'Logo + primary color', true, false, NULL, 3, '2026-01-02 08:12:36.717473+00', NULL, NULL, NULL, '{}', NULL, 0),
	('986b16fe-1568-416c-af8f-f06d9a75e896', '90e3f808-7d05-4c1b-bf9d-f888a57bc4d8', 'learning', 'skill_catalog', 'Skill Catalog Access', 'Standard catalog', true, false, NULL, 4, '2026-01-02 08:12:36.717473+00', NULL, NULL, NULL, '{}', NULL, 0),
	('248e4e7f-6665-4773-8f8f-07a90ae962ce', '90e3f808-7d05-4c1b-bf9d-f888a57bc4d8', 'learning', 'pathways', 'Learning Pathways', 'Pre-built pathways', true, false, NULL, 5, '2026-01-02 08:12:36.717473+00', NULL, NULL, NULL, '{}', NULL, 0),
	('6b3479b6-995e-4836-9c0f-164da8d34fa2', '90e3f808-7d05-4c1b-bf9d-f888a57bc4d8', 'learning', 'cohorts', 'Cohort Management', NULL, false, false, NULL, 6, '2026-01-02 08:12:36.717473+00', NULL, NULL, NULL, '{}', NULL, 0),
	('26d53251-1c11-4e25-b09c-05f0f807b41a', '90e3f808-7d05-4c1b-bf9d-f888a57bc4d8', 'content', 'storage', 'Content Uploads', 'Up to 500 GB (shared)', true, false, NULL, 7, '2026-01-02 08:12:36.717473+00', NULL, NULL, NULL, '{}', NULL, 0),
	('c8c963e2-c624-4230-b065-67ede6df49ed', '90e3f808-7d05-4c1b-bf9d-f888a57bc4d8', 'assessments', 'assessments', 'Assessments', 'Quizzes', true, false, NULL, 8, '2026-01-02 08:12:36.717473+00', NULL, NULL, NULL, '{}', NULL, 0),
	('979b9c37-88fe-4ce2-9827-1c9c19b5f127', '90e3f808-7d05-4c1b-bf9d-f888a57bc4d8', 'certificates', 'certificates', 'Certificates', 'Standard completion', true, false, NULL, 9, '2026-01-02 08:12:36.717473+00', NULL, NULL, NULL, '{}', NULL, 0),
	('61e41674-ec13-4434-8d9c-314158d333e4', '90e3f808-7d05-4c1b-bf9d-f888a57bc4d8', 'analytics', 'analytics', 'Learner Analytics', 'Basic dashboards', true, false, NULL, 10, '2026-01-02 08:12:36.717473+00', NULL, NULL, NULL, '{}', NULL, 0),
	('6669c73d-124a-48ae-b9c5-7011eff1fd6b', '90e3f808-7d05-4c1b-bf9d-f888a57bc4d8', 'analytics', 'export', 'Data Export', NULL, false, false, NULL, 11, '2026-01-02 08:12:36.717473+00', NULL, NULL, NULL, '{}', NULL, 0),
	('ec670ad2-2959-4ec3-9106-236a4560cc5d', '90e3f808-7d05-4c1b-bf9d-f888a57bc4d8', 'analytics', 'notifications', 'Notifications & Nudges', 'Basic reminders', true, false, NULL, 12, '2026-01-02 08:12:36.717473+00', NULL, NULL, NULL, '{}', NULL, 0),
	('b48ce0ea-44b0-482b-a00a-65de6120e05c', '90e3f808-7d05-4c1b-bf9d-f888a57bc4d8', 'integrations', 'sso', 'SSO (SAML/OIDC)', NULL, false, false, NULL, 13, '2026-01-02 08:12:36.717473+00', NULL, NULL, NULL, '{}', NULL, 0),
	('97b67069-033b-4020-a2d8-488d0520ac45', '90e3f808-7d05-4c1b-bf9d-f888a57bc4d8', 'integrations', 'scim', 'User Provisioning (SCIM)', NULL, false, false, NULL, 14, '2026-01-02 08:12:36.717473+00', NULL, NULL, NULL, '{}', NULL, 0),
	('12e4a120-90e6-4b30-8763-80a2a0e8ecc4', '90e3f808-7d05-4c1b-bf9d-f888a57bc4d8', 'integrations', 'api', 'API & Webhooks', NULL, false, false, NULL, 15, '2026-01-02 08:12:36.717473+00', NULL, NULL, NULL, '{}', NULL, 0),
	('ea3e3209-8f38-4d88-8d9e-d2c88d5edda4', '90e3f808-7d05-4c1b-bf9d-f888a57bc4d8', 'integrations', 'lms_hr', 'LMS / HR Integrations', NULL, false, false, NULL, 16, '2026-01-02 08:12:36.717473+00', NULL, NULL, NULL, '{}', NULL, 0),
	('167506db-c611-4afa-853d-d1bbee242b03', '90e3f808-7d05-4c1b-bf9d-f888a57bc4d8', 'security', 'audit', 'Audit Logs & Compliance', NULL, false, false, NULL, 17, '2026-01-02 08:12:36.717473+00', NULL, NULL, NULL, '{}', NULL, 0),
	('6891f7d3-99f4-4e7a-9f1b-e6992fe8ffab', '90e3f808-7d05-4c1b-bf9d-f888a57bc4d8', 'security', 'dpa', 'Data Residency / DPA', NULL, false, false, NULL, 18, '2026-01-02 08:12:36.717473+00', NULL, NULL, NULL, '{}', NULL, 0),
	('bf6d24ac-d561-4540-83f9-d081bd99d11c', '90e3f808-7d05-4c1b-bf9d-f888a57bc4d8', 'support', 'support', 'Support', 'Email (business hours)', true, false, NULL, 19, '2026-01-02 08:12:36.717473+00', NULL, NULL, NULL, '{}', NULL, 0),
	('cf609f3d-e7eb-469c-9b43-0c818b62a0d8', '90e3f808-7d05-4c1b-bf9d-f888a57bc4d8', 'support', 'csm', 'Customer Success Manager', NULL, false, false, NULL, 20, '2026-01-02 08:12:36.717473+00', NULL, NULL, NULL, '{}', NULL, 0),
	('331b1926-d9f0-4a36-a58b-ec6fef16e495', '90e3f808-7d05-4c1b-bf9d-f888a57bc4d8', 'support', 'implementation', 'Implementation Services', NULL, false, false, NULL, 21, '2026-01-02 08:12:36.717473+00', NULL, NULL, NULL, '{}', NULL, 0),
	('97806227-1509-4e4f-aece-5e654e72d052', '87ee4bf0-8776-4ced-ae79-cb2042e285d5', 'capacity', 'learners', 'Learners', 'Up to 2,000', true, false, NULL, 1, '2026-01-02 08:12:36.717473+00', NULL, NULL, NULL, '{}', NULL, 0),
	('01234ca6-1724-44f0-afea-2321ebb33a61', '87ee4bf0-8776-4ced-ae79-cb2042e285d5', 'capacity', 'admins', 'Admins / Managers', '5 admins & managers', true, false, NULL, 2, '2026-01-02 08:12:36.717473+00', NULL, NULL, NULL, '{}', NULL, 0),
	('d6457902-ebee-426b-aade-efb652af7c61', '87ee4bf0-8776-4ced-ae79-cb2042e285d5', 'branding', 'branding', 'Branding', 'Advanced branding', true, false, NULL, 3, '2026-01-02 08:12:36.717473+00', NULL, NULL, NULL, '{}', NULL, 0),
	('af7cb090-a58c-448c-b5c7-dd33e975afe1', '87ee4bf0-8776-4ced-ae79-cb2042e285d5', 'learning', 'skill_catalog', 'Skill Catalog Access', 'Standard + curated', true, false, NULL, 4, '2026-01-02 08:12:36.717473+00', NULL, NULL, NULL, '{}', NULL, 0),
	('f21f1a79-db68-438b-8fb4-e197c268e032', '87ee4bf0-8776-4ced-ae79-cb2042e285d5', 'learning', 'pathways', 'Learning Pathways', 'Custom pathway builder', true, false, NULL, 5, '2026-01-02 08:12:36.717473+00', NULL, NULL, NULL, '{}', NULL, 0),
	('3b6ba248-20ab-4851-b2be-0b2f9b76351b', '87ee4bf0-8776-4ced-ae79-cb2042e285d5', 'learning', 'cohorts', 'Cohort Management', 'Yes', true, false, NULL, 6, '2026-01-02 08:12:36.717473+00', NULL, NULL, NULL, '{}', NULL, 0),
	('ea807aeb-ad5b-4917-b5bf-345332c40441', '87ee4bf0-8776-4ced-ae79-cb2042e285d5', 'content', 'storage', 'Content Uploads', '1,000 GB', true, false, NULL, 7, '2026-01-02 08:12:36.717473+00', NULL, NULL, NULL, '{}', NULL, 0),
	('b2ca9383-4d6e-420c-b863-8667bbf6c43a', '87ee4bf0-8776-4ced-ae79-cb2042e285d5', 'assessments', 'assessments', 'Assessments', 'Question banks, graded assignments', true, false, NULL, 8, '2026-01-02 08:12:36.717473+00', NULL, NULL, NULL, '{}', NULL, 0),
	('0a285b93-cb89-49a2-90ed-e6eab1bfd85d', '87ee4bf0-8776-4ced-ae79-cb2042e285d5', 'certificates', 'certificates', 'Certificates', 'Custom templates + expiry', true, false, NULL, 9, '2026-01-02 08:12:36.717473+00', NULL, NULL, NULL, '{}', NULL, 0),
	('566484c9-5855-4286-845c-1de01f9561c1', '87ee4bf0-8776-4ced-ae79-cb2042e285d5', 'analytics', 'analytics', 'Learner Analytics', 'Cohort & skill-gap analytics', true, false, NULL, 10, '2026-01-02 08:12:36.717473+00', NULL, NULL, NULL, '{}', NULL, 0),
	('cb099303-3df9-482a-90bd-acab1de57a3c', '87ee4bf0-8776-4ced-ae79-cb2042e285d5', 'analytics', 'export', 'Data Export', 'CSV exports', true, false, NULL, 11, '2026-01-02 08:12:36.717473+00', NULL, NULL, NULL, '{}', NULL, 0),
	('a315e995-75e2-413b-8894-4da4c7c3fa26', '87ee4bf0-8776-4ced-ae79-cb2042e285d5', 'analytics', 'notifications', 'Notifications & Nudges', 'Campaigns & nudges', true, false, NULL, 12, '2026-01-02 08:12:36.717473+00', NULL, NULL, NULL, '{}', NULL, 0),
	('8260f724-6460-444b-97b5-2a5e17bf0cf8', '87ee4bf0-8776-4ced-ae79-cb2042e285d5', 'integrations', 'scim', 'User Provisioning (SCIM)', NULL, false, false, NULL, 14, '2026-01-02 08:12:36.717473+00', NULL, NULL, NULL, '{}', NULL, 0),
	('c9d37b7d-e05e-4f8d-a15e-0f17f909aa2f', '87ee4bf0-8776-4ced-ae79-cb2042e285d5', 'integrations', 'lms_hr', 'LMS / HR Integrations', 'Lightweight', true, false, NULL, 16, '2026-01-02 08:12:36.717473+00', NULL, NULL, NULL, '{}', NULL, 0),
	('6b810fb4-4007-4a89-9374-b2029c4c5745', '87ee4bf0-8776-4ced-ae79-cb2042e285d5', 'security', 'audit', 'Audit Logs & Compliance', NULL, false, false, NULL, 17, '2026-01-02 08:12:36.717473+00', NULL, NULL, NULL, '{}', NULL, 0),
	('883e66fb-f3bf-4316-810e-733225cffed5', '87ee4bf0-8776-4ced-ae79-cb2042e285d5', 'security', 'dpa', 'Data Residency / DPA', NULL, false, false, NULL, 18, '2026-01-02 08:12:36.717473+00', NULL, NULL, NULL, '{}', NULL, 0),
	('9b48b359-242f-4744-8e23-9db19b8347ee', '87ee4bf0-8776-4ced-ae79-cb2042e285d5', 'support', 'support', 'Support', 'Priority support + onboarding', true, false, NULL, 19, '2026-01-02 08:12:36.717473+00', NULL, NULL, NULL, '{}', NULL, 0),
	('0e6a3092-b9f5-42bc-8472-eecc6a348158', '87ee4bf0-8776-4ced-ae79-cb2042e285d5', 'support', 'csm', 'Customer Success Manager', NULL, false, false, NULL, 20, '2026-01-02 08:12:36.717473+00', NULL, NULL, NULL, '{}', NULL, 0),
	('f5687945-161e-4020-9cc8-87d1329b3f67', '87ee4bf0-8776-4ced-ae79-cb2042e285d5', 'support', 'implementation', 'Implementation Services', NULL, false, false, NULL, 21, '2026-01-02 08:12:36.717473+00', NULL, NULL, NULL, '{}', NULL, 0),
	('1150449f-9277-4131-908e-166c93703bf0', '813afa36-f48c-4920-8ab7-a150dd09fd9d', 'capacity', 'learners', 'Learners', 'Up to 5,000', true, false, NULL, 1, '2026-01-02 08:13:03.503513+00', NULL, NULL, NULL, '{}', NULL, 0),
	('12d4cfb3-4e0a-4faf-928a-01dcab0b53b1', '813afa36-f48c-4920-8ab7-a150dd09fd9d', 'capacity', 'admins', 'Admins / Managers', '10 admins/managers', true, false, NULL, 2, '2026-01-02 08:13:03.503513+00', NULL, NULL, NULL, '{}', NULL, 0),
	('ccb20f67-0b23-48d8-8101-6eb3095a045e', '813afa36-f48c-4920-8ab7-a150dd09fd9d', 'branding', 'branding', 'Branding', 'Advanced branding, sub-portals', true, false, NULL, 3, '2026-01-02 08:13:03.503513+00', NULL, NULL, NULL, '{}', NULL, 0),
	('4ccd0e69-6e33-463f-9363-519066b5c58e', '813afa36-f48c-4920-8ab7-a150dd09fd9d', 'learning', 'skill_catalog', 'Skill Catalog Access', 'Role-based catalog, custom taxonomy', true, false, NULL, 4, '2026-01-02 08:13:03.503513+00', NULL, NULL, NULL, '{}', NULL, 0),
	('4bcb7b00-df78-4a8c-bcfe-597d3e3504ae', '813afa36-f48c-4920-8ab7-a150dd09fd9d', 'learning', 'pathways', 'Learning Pathways', 'Rules + prerequisites', true, false, NULL, 5, '2026-01-02 08:13:03.503513+00', NULL, NULL, NULL, '{}', NULL, 0),
	('edb17f8a-867b-4aed-8ed3-b9b4e83c04f6', '813afa36-f48c-4920-8ab7-a150dd09fd9d', 'learning', 'cohorts', 'Cohort Management', 'Yes, multi-dept cohorts', true, false, NULL, 6, '2026-01-02 08:13:03.503513+00', NULL, NULL, NULL, '{}', NULL, 0),
	('2180853c-cd38-4569-8f83-f33531e806a5', '813afa36-f48c-4920-8ab7-a150dd09fd9d', 'content', 'storage', 'Content Uploads', 'Up to 5 TB (expandable)', true, false, NULL, 7, '2026-01-02 08:13:03.503513+00', NULL, NULL, NULL, '{}', NULL, 0),
	('7763d3cb-cf98-43bf-bedd-4da739e90624', '813afa36-f48c-4920-8ab7-a150dd09fd9d', 'assessments', 'assessments', 'Assessments', 'Rubrics + project evaluation', true, false, NULL, 8, '2026-01-02 08:13:03.503513+00', NULL, NULL, NULL, '{}', NULL, 0),
	('cb7cee54-8863-4419-83e4-0c59c434125a', '813afa36-f48c-4920-8ab7-a150dd09fd9d', 'certificates', 'certificates', 'Certificates', 'Custom certs + verification', true, false, NULL, 9, '2026-01-02 08:13:03.503513+00', NULL, NULL, NULL, '{}', NULL, 0),
	('f0916fab-c469-4841-9cbc-a6305c027809', '813afa36-f48c-4920-8ab7-a150dd09fd9d', 'analytics', 'analytics', 'Learner Analytics', 'Skill-gap heatmaps + benchmarks', true, false, NULL, 10, '2026-01-02 08:13:03.503513+00', NULL, NULL, NULL, '{}', NULL, 0),
	('cf7b404b-6334-45d9-98a1-270716a0cbee', '813afa36-f48c-4920-8ab7-a150dd09fd9d', 'analytics', 'export', 'Data Export', 'BI-ready exports (optional)', true, false, NULL, 11, '2026-01-02 08:13:03.503513+00', NULL, NULL, NULL, '{}', NULL, 0),
	('c0dc1d67-0c0e-4125-b203-be7047431b8b', '813afa36-f48c-4920-8ab7-a150dd09fd9d', 'analytics', 'notifications', 'Notifications & Nudges', 'Automation + smart nudges', true, false, NULL, 12, '2026-01-02 08:13:03.503513+00', NULL, NULL, NULL, '{}', NULL, 0),
	('c4df82ab-64ae-46a8-850d-c55d434d66c9', '813afa36-f48c-4920-8ab7-a150dd09fd9d', 'integrations', 'sso', 'SSO (SAML/OIDC)', 'Included', true, false, NULL, 13, '2026-01-02 08:13:03.503513+00', NULL, NULL, NULL, '{}', NULL, 0),
	('b0fc264b-13a3-4080-ae97-3f7f6f503fac', '813afa36-f48c-4920-8ab7-a150dd09fd9d', 'integrations', 'api', 'API & Webhooks', 'Full API + webhooks', true, false, NULL, 15, '2026-01-02 08:13:03.503513+00', NULL, NULL, NULL, '{}', NULL, 0),
	('4f1c379b-adab-419f-993e-6c726089244b', '813afa36-f48c-4920-8ab7-a150dd09fd9d', 'integrations', 'lms_hr', 'LMS / HR Integrations', 'Standard HRIS/LMS integrations', true, false, NULL, 16, '2026-01-02 08:13:03.503513+00', NULL, NULL, NULL, '{}', NULL, 0),
	('c76d77f9-cbd5-474e-a630-3fe997e8ef9f', '813afa36-f48c-4920-8ab7-a150dd09fd9d', 'security', 'audit', 'Audit Logs & Compliance', 'Audit logs + retention controls', true, false, NULL, 17, '2026-01-02 08:13:03.503513+00', NULL, NULL, NULL, '{}', NULL, 0),
	('168b81c7-d8cd-42c1-abc4-df2972572e6f', '813afa36-f48c-4920-8ab7-a150dd09fd9d', 'security', 'dpa', 'Data Residency / DPA', 'DPA support available', true, false, NULL, 18, '2026-01-02 08:13:03.503513+00', NULL, NULL, NULL, '{}', NULL, 0),
	('1124d2e1-6e55-4459-abb2-2f520b16fe65', '813afa36-f48c-4920-8ab7-a150dd09fd9d', 'support', 'support', 'Support', 'Dedicated support, SLA 24x5', true, false, NULL, 19, '2026-01-02 08:13:03.503513+00', NULL, NULL, NULL, '{}', NULL, 0),
	('60a1f5d2-8f2d-45b1-8740-2c2c4491e49c', '813afa36-f48c-4920-8ab7-a150dd09fd9d', 'support', 'csm', 'Customer Success Manager', 'Named CSM', true, false, NULL, 20, '2026-01-02 08:13:03.503513+00', NULL, NULL, NULL, '{}', NULL, 0),
	('1586a967-3b7e-4277-bf13-cdac55eebb51', '813afa36-f48c-4920-8ab7-a150dd09fd9d', 'support', 'implementation', 'Implementation Services', 'Implementation + migration support', true, false, NULL, 21, '2026-01-02 08:13:03.503513+00', NULL, NULL, NULL, '{}', NULL, 0),
	('e35859a0-6d4a-489a-9bb2-b89691db4f40', '1e7ac687-99b2-45fa-8fbb-3adcf5c55829', 'capacity', 'learners', 'Learners', 'Unlimited / Contracted', true, false, NULL, 1, '2026-01-02 08:13:03.503513+00', NULL, NULL, NULL, '{}', NULL, 0),
	('3e3e13a4-63b3-4881-99b4-c3f6b7ee2e46', '1e7ac687-99b2-45fa-8fbb-3adcf5c55829', 'capacity', 'admins', 'Admins / Managers', 'Unlimited roles', true, false, NULL, 2, '2026-01-02 08:13:03.503513+00', NULL, NULL, NULL, '{}', NULL, 0),
	('f7729875-675d-41ae-a47d-9411c85802b2', '1e7ac687-99b2-45fa-8fbb-3adcf5c55829', 'branding', 'branding', 'Branding', 'Custom skill framework', true, false, NULL, 3, '2026-01-02 08:13:03.503513+00', NULL, NULL, NULL, '{}', NULL, 0),
	('748fe695-0ae7-4279-8dd8-041144df2b0c', '1e7ac687-99b2-45fa-8fbb-3adcf5c55829', 'learning', 'skill_catalog', 'Skill Catalog Access', 'Custom skill framework', true, false, NULL, 4, '2026-01-02 08:13:03.503513+00', NULL, NULL, NULL, '{}', NULL, 0),
	('cf55cf1a-71d1-41c7-b3af-9200ab90463c', '1e7ac687-99b2-45fa-8fbb-3adcf5c55829', 'learning', 'pathways', 'Learning Pathways', 'Advanced pathways + rules', true, false, NULL, 5, '2026-01-02 08:13:03.503513+00', NULL, NULL, NULL, '{}', NULL, 0),
	('f3c4f4b3-b94e-4122-aa2d-e073c5751025', '1e7ac687-99b2-45fa-8fbb-3adcf5c55829', 'learning', 'cohorts', 'Cohort Management', 'Yes (multi-LOB)', true, false, NULL, 6, '2026-01-02 08:13:03.503513+00', NULL, NULL, NULL, '{}', NULL, 0),
	('e2a65e59-5194-4f97-87c7-b9fe82a69bdf', '1e7ac687-99b2-45fa-8fbb-3adcf5c55829', 'content', 'storage', 'Content Uploads', 'Unlimited / negotiated', true, false, NULL, 7, '2026-01-02 08:13:03.503513+00', NULL, NULL, NULL, '{}', NULL, 0),
	('c57f9f6b-9402-4fcc-a027-b67100ba6557', '1e7ac687-99b2-45fa-8fbb-3adcf5c55829', 'assessments', 'assessments', 'Assessments', 'Advanced assessments & rubrics', true, false, NULL, 8, '2026-01-02 08:13:03.503513+00', NULL, NULL, NULL, '{}', NULL, 0),
	('a659aa1d-31e1-4e8c-a52b-ff5ce1745e1a', '1e7ac687-99b2-45fa-8fbb-3adcf5c55829', 'certificates', 'certificates', 'Certificates', 'Verified credentials & badges', true, false, NULL, 9, '2026-01-02 08:13:03.503513+00', NULL, NULL, NULL, '{}', NULL, 0),
	('ce63b2ae-8816-4fcc-b54f-399789be1a4e', '1e7ac687-99b2-45fa-8fbb-3adcf5c55829', 'analytics', 'analytics', 'Learner Analytics', 'Advanced analytics & benchmarking', true, false, NULL, 10, '2026-01-02 08:13:03.503513+00', NULL, NULL, NULL, '{}', NULL, 0),
	('4f49c30f-e9d5-413a-b5ba-4d01ed2582a3', '1e7ac687-99b2-45fa-8fbb-3adcf5c55829', 'analytics', 'export', 'Data Export', 'BI connectors (Power BI/Tableau)', true, false, NULL, 11, '2026-01-02 08:13:03.503513+00', NULL, NULL, NULL, '{}', NULL, 0),
	('20edaf33-6d34-46b5-93fe-e4e9156788d9', '1e7ac687-99b2-45fa-8fbb-3adcf5c55829', 'analytics', 'notifications', 'Notifications & Nudges', 'Intelligent automation', true, false, NULL, 12, '2026-01-02 08:13:03.503513+00', NULL, NULL, NULL, '{}', NULL, 0),
	('0d654d89-5bc7-43e8-bf7e-846feb6e3058', '1e7ac687-99b2-45fa-8fbb-3adcf5c55829', 'integrations', 'sso', 'SSO (SAML/OIDC)', 'Included', true, false, NULL, 13, '2026-01-02 08:13:03.503513+00', NULL, NULL, NULL, '{}', NULL, 0),
	('752ebb07-2a96-4879-a3ee-0b3766511adf', '1e7ac687-99b2-45fa-8fbb-3adcf5c55829', 'integrations', 'scim', 'User Provisioning (SCIM)', 'Included', true, false, NULL, 14, '2026-01-02 08:13:03.503513+00', NULL, NULL, NULL, '{}', NULL, 0),
	('5a5e1e25-9103-42ad-9473-8bddb24497cb', '1e7ac687-99b2-45fa-8fbb-3adcf5c55829', 'integrations', 'api', 'API & Webhooks', 'Full access', true, false, NULL, 15, '2026-01-02 08:13:03.503513+00', NULL, NULL, NULL, '{}', NULL, 0),
	('64c726fa-f92d-4fc9-a659-13604f1b9af9', '1e7ac687-99b2-45fa-8fbb-3adcf5c55829', 'integrations', 'lms_hr', 'LMS / HR Integrations', 'Full HRIS/LMS integrations', true, false, NULL, 16, '2026-01-02 08:13:03.503513+00', NULL, NULL, NULL, '{}', NULL, 0),
	('946660c3-a24a-4951-849b-facc6aa01a93', '1e7ac687-99b2-45fa-8fbb-3adcf5c55829', 'security', 'audit', 'Audit Logs & Compliance', 'Included', true, false, NULL, 17, '2026-01-02 08:13:03.503513+00', NULL, NULL, NULL, '{}', NULL, 0),
	('ef97538d-0351-49ad-8f39-bf000f844611', '1e7ac687-99b2-45fa-8fbb-3adcf5c55829', 'security', 'dpa', 'Data Residency / DPA', 'Available', true, false, NULL, 18, '2026-01-02 08:13:03.503513+00', NULL, NULL, NULL, '{}', NULL, 0),
	('3768a9d3-37d9-4ab2-81d4-d93d739c8985', '1e7ac687-99b2-45fa-8fbb-3adcf5c55829', 'support', 'support', 'Support', '24/7 support + SLA', true, false, NULL, 19, '2026-01-02 08:13:03.503513+00', NULL, NULL, NULL, '{}', NULL, 0),
	('751c399a-5c88-4af8-813b-dfec05ee37c6', '1e7ac687-99b2-45fa-8fbb-3adcf5c55829', 'support', 'csm', 'Customer Success Manager', 'Named CSM', true, false, NULL, 20, '2026-01-02 08:13:03.503513+00', NULL, NULL, NULL, '{}', NULL, 0),
	('3b1ba661-0c16-4038-b58a-59ebe529360e', '1e7ac687-99b2-45fa-8fbb-3adcf5c55829', 'support', 'implementation', 'Implementation Services', 'Included / Optional', true, false, NULL, 21, '2026-01-02 08:13:03.503513+00', NULL, NULL, NULL, '{}', NULL, 0),
	('cb615e7a-2f12-4a79-be55-ff43b0343655', '87ee4bf0-8776-4ced-ae79-cb2042e285d5', 'integrations', 'sso', 'SSO (SAML/OIDC)', 'Add-on', true, true, NULL, 13, '2026-01-02 08:12:36.717473+00', 2599.00, 25990.00, 'Single Sign-On integration with SAML/OIDC providers', '{school_admin,college_admin,university_admin}', NULL, 0),
	('c9d45dbd-10d6-4c69-be48-44feaa3ec4e6', '87ee4bf0-8776-4ced-ae79-cb2042e285d5', 'integrations', 'api', 'API & Webhooks', 'Limited / Add-on', true, true, NULL, 15, '2026-01-02 08:12:36.717473+00', 2499.00, 24990.00, 'Full API access with webhooks for custom integrations', '{school_admin,college_admin,university_admin,recruiter}', NULL, 0),
	('78a2bba9-6a6f-4daa-98ca-7a8c8978b2b8', '813afa36-f48c-4920-8ab7-a150dd09fd9d', 'integrations', 'scim', 'User Provisioning (SCIM)', 'SCIM add-on/included', true, true, NULL, 14, '2026-01-02 08:13:03.503513+00', 2399.00, 23990.00, 'Automated user provisioning with SCIM protocol', '{school_admin,college_admin,university_admin}', NULL, 0),
	('7c2da54f-fdca-4ae8-a32d-ffb7b41cb049', '90e3f808-7d05-4c1b-bf9d-f888a57bc4d8', 'integrations', 'career_ai', 'Career AI Assistant', 'Add-on', false, true, NULL, 100, '2026-01-03 05:08:37.214562+00', 2199.00, 21990.00, 'AI-powered career guidance and recommendations', '{student}', NULL, 0),
	('ca33605a-9c60-44f7-8faf-6c232ef82e85', '90e3f808-7d05-4c1b-bf9d-f888a57bc4d8', 'integrations', 'ai_job_matching', 'AI Job Matching', 'Add-on', false, true, NULL, 101, '2026-01-03 05:08:37.214562+00', 2249.00, 22490.00, 'Smart job matching based on skills and preferences', '{student}', NULL, 0),
	('4b4c4796-d511-4a82-8f9a-2795a93b2723', '90e3f808-7d05-4c1b-bf9d-f888a57bc4d8', 'content', 'video_portfolio', 'Video Portfolio', 'Add-on', false, true, NULL, 103, '2026-01-03 05:08:37.214562+00', 2099.00, 20990.00, 'Create and showcase video portfolios', '{student}', NULL, 0),
	('4dcd0f7e-ac02-4816-85fd-94cabb62eb6d', '90e3f808-7d05-4c1b-bf9d-f888a57bc4d8', 'integrations', 'educator_ai', 'Educator AI', 'Add-on', false, true, NULL, 110, '2026-01-03 05:08:57.657685+00', 2299.00, 22990.00, 'AI assistant for educators with lesson planning and student insights', '{educator}', NULL, 0),
	('509ea35f-2a37-4d56-816e-2f2c0369be1b', '90e3f808-7d05-4c1b-bf9d-f888a57bc4d8', 'analytics', 'advanced_analytics', 'Advanced Analytics', 'Add-on', false, true, NULL, 111, '2026-01-03 05:08:57.657685+00', 2199.00, 21990.00, 'Comprehensive analytics dashboards and reports', '{educator,school_admin,college_admin}', NULL, 0),
	('66364a07-22ad-4362-b18e-894b818d0010', '90e3f808-7d05-4c1b-bf9d-f888a57bc4d8', 'analytics', 'course_analytics', 'Course Analytics', 'Add-on', false, true, NULL, 112, '2026-01-03 05:08:57.657685+00', 2149.00, 21490.00, 'Detailed course performance and engagement metrics', '{educator}', NULL, 0),
	('60776246-52db-4137-b40a-31bf794b29eb', '90e3f808-7d05-4c1b-bf9d-f888a57bc4d8', 'content', 'mentor_notes', 'Mentor Notes', 'Add-on', false, true, NULL, 113, '2026-01-03 05:08:57.657685+00', 2099.00, 20990.00, 'Private notes and tracking for student mentoring', '{educator}', NULL, 0),
	('479774ab-f37d-4074-aa07-8454a9760769', '90e3f808-7d05-4c1b-bf9d-f888a57bc4d8', 'analytics', 'kpi_dashboard', 'KPI Dashboard', 'Add-on', false, true, NULL, 120, '2026-01-03 05:08:57.657685+00', 2499.00, 24990.00, 'Executive KPI dashboard with key metrics', '{school_admin,college_admin,university_admin}', NULL, 0),
	('6aea4297-855a-4e8c-988f-07e75c3c4b39', '90e3f808-7d05-4c1b-bf9d-f888a57bc4d8', 'learning', 'curriculum_builder', 'Curriculum Builder', 'Add-on', false, true, NULL, 121, '2026-01-03 05:08:57.657685+00', 2399.00, 23990.00, 'Advanced curriculum design and management tools', '{school_admin,college_admin}', NULL, 0),
	('776920dc-1c4d-4bad-966d-7dad2d7256d6', '90e3f808-7d05-4c1b-bf9d-f888a57bc4d8', 'integrations', 'fee_management', 'Fee Management', 'Add-on', false, true, NULL, 122, '2026-01-03 05:08:57.657685+00', 2299.00, 22990.00, 'Complete fee collection and tracking system', '{school_admin,college_admin}', NULL, 0),
	('99ba663d-d65f-4da9-bd38-3faf5ed90bfc', '90e3f808-7d05-4c1b-bf9d-f888a57bc4d8', 'integrations', 'recruiter_ai', 'Recruiter AI', 'Add-on', false, true, NULL, 130, '2026-01-03 05:08:57.657685+00', 2399.00, 23990.00, 'AI-powered candidate screening and matching', '{recruiter}', NULL, 0),
	('b2cf9137-6608-46b1-9188-cb905a07ca48', '90e3f808-7d05-4c1b-bf9d-f888a57bc4d8', 'integrations', 'talent_pool_access', 'Talent Pool Access', 'Add-on', false, true, NULL, 131, '2026-01-03 05:08:57.657685+00', 2299.00, 22990.00, 'Access to verified talent pool with skill profiles', '{recruiter}', NULL, 0),
	('d2aa6761-51c7-45d3-8b55-841cc6a1a945', '90e3f808-7d05-4c1b-bf9d-f888a57bc4d8', 'integrations', 'pipeline_management', 'Pipeline Management', 'Add-on', false, true, NULL, 132, '2026-01-03 05:08:57.657685+00', 2249.00, 22490.00, 'Advanced recruitment pipeline with automation', '{recruiter}', NULL, 0),
	('ca3efaed-0b89-44db-9621-4226149fcf32', '90e3f808-7d05-4c1b-bf9d-f888a57bc4d8', 'integrations', 'project_hiring', 'Project Hiring', 'Add-on', false, true, NULL, 133, '2026-01-03 05:08:57.657685+00', 2349.00, 23490.00, 'Project-based hiring with milestone tracking', '{recruiter}', NULL, 0),
	('061de6e5-0052-47a4-8d82-6e52f0f0f1b0', '90e3f808-7d05-4c1b-bf9d-f888a57bc4d8', 'analytics', 'skills_analytics', 'Skills Analytics', 'Add-on', false, false, NULL, 104, '2026-01-03 05:08:37.214562+00', 129.00, 1290.00, 'Detailed analytics on skill development progress', '{student}', NULL, 0),
	('15814c27-77f9-451a-a916-a89920dd9ac2', '90e3f808-7d05-4c1b-bf9d-f888a57bc4d8', 'assessments', 'advanced_assessments', 'Advanced Assessments', 'Add-on', false, false, NULL, 102, '2026-01-03 05:08:37.214562+00', 149.00, 1490.00, 'Comprehensive skill assessments with detailed reports', '{student}', NULL, 0);


--

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
-- Data for Name: subscription_plans; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."subscription_plans" ("id", "plan_code", "name", "business_type", "entity_type", "role_type", "price_monthly", "price_yearly", "currency", "max_users", "features", "description", "is_recommended", "is_active", "display_order", "created_at", "updated_at", "tagline", "positioning", "color", "max_admins", "storage_limit", "ideal_for") VALUES
	('90e3f808-7d05-4c1b-bf9d-f888a57bc4d8', 'basic', 'Basic', 'b2b', 'all', 'all', 250, 2500, 'INR', 1000, '["Up to 1,000 learners", "2 admins", "Logo + primary color branding", "Standard skill catalog", "Pre-built learning pathways", "Up to 500 GB content storage", "Quizzes", "Standard completion certificates", "Basic dashboards", "Basic reminders", "Email support (business hours)"]', 'Ideal for individuals, small teams, and pilots', false, true, 1, '2026-01-02 07:58:13.990844+00', '2026-01-02 09:48:50.888121+00', 'Pilot & Individual Learning', 'Validate learning outcomes with minimal setup.', 'bg-slate-600', 2, 'Up to 500 GB (shared)', 'Individuals, small teams, and pilots'),
	('87ee4bf0-8776-4ced-ae79-cb2042e285d5', 'professional', 'Professional', 'b2b', 'all', 'all', 250, 2500, 'INR', 2000, '["Up to 2,000 learners", "5 admins & managers", "Advanced branding", "Standard + curated catalog", "Custom pathway builder", "Cohort management", "1,000 GB storage", "Question banks, graded assignments", "Custom certificate templates + expiry", "Cohort & skill-gap analytics", "CSV exports", "Campaigns & nudges", "SSO (Add-on)", "Limited API (Add-on)", "Lightweight LMS/HR integrations", "Priority support + onboarding"]', 'Ideal for growing organizations and L&D teams', true, true, 2, '2026-01-02 07:58:13.990844+00', '2026-01-02 09:48:50.888121+00', 'Team Enablement', 'Actively manage cohorts, skills, and engagement.', 'bg-blue-600', 5, '1,000 GB', 'Growing organizations and L&D teams'),
	('813afa36-f48c-4920-8ab7-a150dd09fd9d', 'enterprise', 'Enterprise', 'b2b', 'all', 'all', 200, 2000, 'INR', 5000, '["Up to 5,000 learners", "10 admins/managers", "Advanced branding + sub-portals", "Role-based catalog, custom taxonomy", "Rules + prerequisites", "Multi-dept cohorts", "Up to 5 TB storage (expandable)", "Rubrics + project evaluation", "Custom certs + verification", "Skill-gap heatmaps + benchmarks", "BI-ready exports", "Automation + smart nudges", "SSO included", "SCIM provisioning", "Full API + webhooks", "Standard HRIS/LMS integrations", "Audit logs + retention controls", "DPA support", "Dedicated support SLA 24x5", "Named CSM", "Implementation + migration support"]', 'Ideal for large organizations with multi-department rollout', false, true, 3, '2026-01-02 07:58:13.990844+00', '2026-01-02 09:48:50.888121+00', 'Governance & Scale', 'Govern learning at scale with automation and compliance.', 'bg-purple-600', 10, 'Up to 5 TB (expandable)', 'Large organizations with multi-department rollout'),
	('1e7ac687-99b2-45fa-8fbb-3adcf5c55829', 'ecosystem', 'Ecosystem', 'b2b', 'all', 'all', 0, 0, 'INR', NULL, '["Unlimited learners (contracted)", "Unlimited roles", "Custom skill framework", "Advanced pathways + rules", "Multi-LOB cohorts", "Unlimited storage (negotiated)", "Advanced assessments & rubrics", "Verified credentials & badges", "Advanced analytics & benchmarking", "BI connectors (Power BI/Tableau)", "Intelligent automation", "SSO included", "SCIM included", "Full API access", "Full HRIS/LMS integrations", "Audit logs & compliance", "Data residency & DPA", "24/7 support + SLA", "Named CSM", "Full implementation services"]', 'Ideal for large enterprises and regulated organizations. Contact sales for pricing.', false, true, 4, '2026-01-02 07:58:13.990844+00', '2026-01-02 09:48:50.888121+00', 'Extended & Regulated Scale', 'Power extended learning across organizations, partners, and regulated environments.', 'bg-gradient-to-r from-purple-600 to-indigo-600', NULL, 'Unlimited / negotiated', 'Large enterprises and regulated organizations');


--

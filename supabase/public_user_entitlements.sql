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
-- Data for Name: user_entitlements; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."user_entitlements" ("id", "user_id", "feature_key", "bundle_id", "status", "billing_period", "start_date", "end_date", "auto_renew", "price_at_purchase", "razorpay_subscription_id", "is_grandfathered", "grandfathered_until", "cancelled_at", "created_at", "updated_at", "granted_by_organization", "organization_subscription_id", "granted_by") VALUES
	('e609aeb2-0873-41e5-af5d-daa869c56f0e', '2740fc7f-a0fb-44b4-be24-0d1b4edf4034', 'career_ai', NULL, 'active', 'annual', '2026-01-16 07:06:45.236+00', '2027-01-16 07:06:45.236+00', true, 1990.00, NULL, false, NULL, NULL, '2026-01-16 07:06:45.291915+00', '2026-01-16 07:06:45.291915+00', false, NULL, NULL),
	('9fb98cd1-cb3f-4062-b745-12333dfd087b', '91bf6be4-31a5-4d6a-853d-675596755cee', 'curriculum_builder', NULL, 'active', 'monthly', '2026-01-06 05:47:33.955+00', '2026-02-06 05:47:33.955+00', true, 399.00, NULL, false, NULL, NULL, '2026-01-06 05:47:34.025585+00', '2026-01-06 05:47:34.025585+00', false, NULL, NULL),
	('526fbfc3-58e7-4821-bd11-a5eb5cc51925', 'c5d30a55-8d9a-46e6-b8d0-6accc0415c1c', 'ai_job_matching', NULL, 'active', 'monthly', '2026-01-06 11:16:08.926+00', '2026-02-06 11:16:08.926+00', true, 249.00, NULL, false, NULL, NULL, '2026-01-06 11:16:09.000293+00', '2026-01-06 11:16:09.000293+00', false, NULL, NULL),
	('ab92efa4-eada-428c-aff8-8c1287e4741e', 'c5d30a55-8d9a-46e6-b8d0-6accc0415c1c', 'career_ai', NULL, 'active', 'monthly', '2026-01-09 09:20:46.147+00', '2026-02-09 09:20:46.147+00', true, 199.00, NULL, false, NULL, NULL, '2026-01-09 09:20:46.221364+00', '2026-01-09 09:20:46.221364+00', false, NULL, NULL),
	('3ac2b558-2f16-4013-89b5-f91a31993cdc', '52004557-7df2-4c2a-bffb-437588cbb619', 'kpi_dashboard', NULL, 'active', 'annual', '2026-01-09 10:00:47.87+00', '2027-01-09 10:00:47.87+00', true, 4990.00, NULL, false, NULL, NULL, '2026-01-09 10:00:47.946583+00', '2026-01-09 10:00:47.946583+00', false, NULL, NULL),
	('a8a92b3e-a306-4c34-8b7d-b3ba87eabc14', '0ffcf1ed-e010-43ec-b13b-4bee6c9a2d79', 'educator_ai', NULL, 'active', 'annual', '2026-01-10 07:21:38.16+00', '2027-01-10 07:21:38.16+00', true, 2990.00, NULL, false, NULL, NULL, '2026-01-10 07:21:38.24538+00', '2026-01-10 07:21:38.24538+00', false, NULL, NULL),
	('5dc6e97c-71a9-4f61-973b-b96d7c61f4f3', '88bdebb7-3da4-4e18-a19c-7f82dba9c04a', 'kpi_dashboard', NULL, 'active', 'annual', '2026-01-10 21:15:59.816+00', '2027-01-10 21:15:59.816+00', true, 4990.00, NULL, false, NULL, NULL, '2026-01-10 21:15:59.859565+00', '2026-01-10 21:15:59.859565+00', false, NULL, NULL),
	('1de922c7-b00e-4fb9-9554-f4ef527e5857', '9c319cc7-e1e1-450f-85af-579805cc152f', 'kpi_dashboard', NULL, 'active', 'annual', '2026-01-11 17:24:45.576+00', '2027-01-11 17:24:45.576+00', true, 4990.00, NULL, false, NULL, NULL, '2026-01-11 17:24:45.637623+00', '2026-01-11 17:24:45.637623+00', false, NULL, NULL),
	('2920a680-5565-4b80-942e-51e5c246cdff', '055e6a3c-f2cf-4288-ab4e-e14809d6d2dd', 'career_ai', NULL, 'active', 'monthly', '2026-01-17 06:04:33.647+00', '2026-02-17 06:04:33.647+00', true, 199.00, NULL, false, NULL, NULL, '2026-01-17 06:04:33.728327+00', '2026-01-17 06:04:33.728327+00', false, NULL, NULL),
	('a25f9ee0-3220-4a11-b9fa-e4a8e0b9e8a5', '0ffcf1ed-e010-43ec-b13b-4bee6c9a2d79', 'mentor_notes', NULL, 'active', 'annual', '2026-01-14 05:13:31.659+00', '2027-01-14 05:13:31.659+00', true, 990.00, NULL, false, NULL, NULL, '2026-01-14 05:13:31.723544+00', '2026-01-14 05:13:31.723544+00', false, NULL, NULL),
	('fcf45568-0fa8-4ca7-9d4c-85979d0ba8a5', '2740fc7f-a0fb-44b4-be24-0d1b4edf4034', 'ai_job_matching', NULL, 'active', 'annual', '2026-01-16 05:32:33.752+00', '2027-01-16 05:32:33.752+00', true, 2490.00, NULL, false, NULL, NULL, '2026-01-16 05:32:33.82056+00', '2026-01-16 05:32:33.82056+00', false, NULL, NULL),
	('ddc5727a-5ea9-4543-9d98-00c74066bea9', 'bb7bd7c3-00ed-4e22-b6f5-09def4907dbf', 'ai_job_matching', NULL, 'active', 'monthly', '2026-01-17 14:21:36.344+00', '2026-02-17 14:21:36.344+00', true, 249.00, NULL, false, NULL, NULL, '2026-01-17 14:21:36.365207+00', '2026-01-17 14:21:36.365207+00', false, NULL, NULL),
	('25f0eb09-fd4e-4ad4-8bca-79dafabce2d5', '8a31ebe1-7e80-4184-85a6-c7137df50acd', 'ai_job_matching', NULL, 'active', 'annual', '2026-01-19 11:07:51.065+00', '2027-01-19 11:07:51.065+00', true, 2490.00, NULL, false, NULL, NULL, '2026-01-19 11:07:51.125382+00', '2026-01-19 11:07:51.125382+00', false, NULL, NULL),
	('6beb3754-40de-40d6-bdd4-b00fe0f9d750', 'c72182dd-c5f6-44c5-9fdf-f2376f50785c', 'ai_job_matching', NULL, 'active', 'annual', '2026-01-21 09:43:40.08+00', '2027-01-21 09:43:40.08+00', true, 2490.00, NULL, false, NULL, NULL, '2026-01-21 09:43:40.144066+00', '2026-01-21 09:43:40.144066+00', false, NULL, NULL),
	('9c9d2106-4401-4524-ad30-5e41c5fed07e', 'c72182dd-c5f6-44c5-9fdf-f2376f50785c', 'video_portfolio', NULL, 'active', 'annual', '2026-01-21 11:28:21.396+00', '2027-01-21 11:28:21.396+00', true, 990.00, NULL, false, NULL, NULL, '2026-01-21 11:28:21.472371+00', '2026-01-21 11:28:21.472371+00', false, NULL, NULL),
	('c0a0315f-914d-4e73-88fc-6df1e731e9c0', 'ab46b2ac-9922-4569-adc6-73eb6b645202', 'career_ai', NULL, 'active', 'annual', '2026-01-22 06:42:16.817+00', '2027-01-22 06:42:16.817+00', true, 1990.00, NULL, false, NULL, NULL, '2026-01-22 06:42:16.901903+00', '2026-01-22 06:42:16.901903+00', false, NULL, NULL),
	('86363862-fe07-441f-a2e3-18c192a4a778', 'ab46b2ac-9922-4569-adc6-73eb6b645202', 'ai_job_matching', NULL, 'active', 'annual', '2026-01-22 09:54:00.54+00', '2027-01-22 09:54:00.54+00', true, 2490.00, NULL, false, NULL, NULL, '2026-01-22 09:54:00.597916+00', '2026-01-22 09:54:00.597916+00', false, NULL, NULL),
	('0baa0a83-3cfa-4d6f-8824-3557977d6b99', '8000076b-67cd-4a82-a9d3-d2fd486a8a0b', 'pipeline_management', NULL, 'active', 'annual', '2026-01-23 04:58:00.516+00', '2027-01-23 04:58:00.516+00', true, 2490.00, NULL, false, NULL, NULL, '2026-01-23 04:58:00.575547+00', '2026-01-23 04:58:00.575547+00', false, NULL, NULL),
	('28205272-a201-4663-a7b9-3bbc87ac9907', '3a05be9e-54ed-4dd4-9f13-7d118d662a3d', 'ai_job_matching', NULL, 'active', 'annual', '2026-01-23 05:01:04.811+00', '2027-01-23 05:01:04.811+00', true, 2490.00, NULL, false, NULL, NULL, '2026-01-23 05:01:04.874078+00', '2026-01-23 05:01:04.874078+00', false, NULL, NULL),
	('1badb5dd-535b-4d44-a4f3-2119ed2a58d2', '3531e63e-589e-46e7-9248-4a769e84b00d', 'ai_job_matching', NULL, 'active', 'annual', '2026-01-27 04:03:17.744+00', '2027-01-27 04:03:17.744+00', true, 2490.00, NULL, false, NULL, NULL, '2026-01-27 04:03:17.811384+00', '2026-01-27 04:03:17.811384+00', false, NULL, NULL),
	('188c76d0-bdcb-4310-bfb8-12abfc69699f', '14db35f1-a03f-417c-9f0a-e235b8d6884f', 'ai_job_matching', NULL, 'active', 'annual', '2026-01-27 07:27:32.954+00', '2027-01-27 07:27:32.954+00', true, 2490.00, NULL, false, NULL, NULL, '2026-01-27 07:27:33.023902+00', '2026-01-27 07:27:33.023902+00', false, NULL, NULL),
	('89b450fa-691a-4bfe-913d-424c034bb615', 'c5d30a55-8d9a-46e6-b8d0-6accc0415c1c', 'video_portfolio', NULL, 'active', 'annual', '2026-01-27 10:07:55.197+00', '2027-01-27 10:07:55.197+00', true, 990.00, NULL, false, NULL, NULL, '2026-01-27 10:07:55.266249+00', '2026-01-27 10:07:55.266249+00', false, NULL, NULL),
	('66176147-273f-4f67-a7c5-d3fc5179e33a', '95364f0d-23fb-4616-b0f4-48caafee5439', 'ai_job_matching', NULL, 'cancelled', 'annual', '2026-01-17 03:59:57.443+00', '2027-01-17 03:59:57.443+00', false, 2490.00, NULL, false, NULL, '2026-01-28 10:18:42.587+00', '2026-01-17 03:59:57.514026+00', '2026-01-28 10:18:42.587+00', false, NULL, NULL),
	('eaac567a-cd2d-42df-86f5-9bac4ecf6765', 'd08ef19b-df13-4950-bc8c-cb45eee95c38', 'career_ai', NULL, 'active', 'annual', '2026-01-28 10:41:34.8+00', '2027-01-28 10:41:34.8+00', true, 1990.00, NULL, false, NULL, NULL, '2026-01-28 10:41:34.859721+00', '2026-01-28 10:41:34.859721+00', false, NULL, NULL),
	('a3330a3d-2619-46fa-9fb8-9df9b7924590', 'bb7bd7c3-00ed-4e22-b6f5-09def4907dbf', 'career_ai', NULL, 'active', 'annual', '2026-01-28 10:55:18.801+00', '2027-01-28 10:55:18.801+00', true, 1990.00, NULL, false, NULL, NULL, '2026-01-28 10:55:18.862065+00', '2026-01-28 10:55:18.862065+00', false, NULL, NULL),
	('46701b0f-f1f2-4012-acbc-a394ae68ec32', '62fdc63a-d6e0-461e-bf82-ffb6875481e4', 'career_ai', NULL, 'active', 'annual', '2026-01-28 11:08:19.393+00', '2027-01-28 11:08:19.393+00', true, 1990.00, NULL, false, NULL, NULL, '2026-01-28 11:08:19.469754+00', '2026-01-28 11:08:19.469754+00', false, NULL, NULL),
	('f221d16e-996c-413e-9c9b-38e04c2a8134', '95364f0d-23fb-4616-b0f4-48caafee5439', 'career_ai', NULL, 'active', 'annual', '2026-01-28 11:14:27.714+00', '2027-01-28 11:14:27.714+00', true, 1990.00, NULL, false, NULL, NULL, '2026-01-28 11:14:27.790076+00', '2026-01-28 11:14:27.790076+00', false, NULL, NULL),
	('e74dc08b-5ae8-4090-ac04-3ad25205ce12', '3531e63e-589e-46e7-9248-4a769e84b00d', 'career_ai', NULL, 'active', 'annual', '2026-01-29 07:20:13.348+00', '2027-01-29 07:20:13.348+00', true, 1990.00, NULL, false, NULL, NULL, '2026-01-29 07:20:13.4312+00', '2026-01-29 07:20:13.4312+00', false, NULL, NULL),
	('62fcd9a7-218c-4b89-ac9c-e0a5a2548e37', '28329192-b3ce-4deb-97be-84d5ca0793e1', 'career_ai', NULL, 'active', 'annual', '2026-01-29 09:07:27.883+00', '2027-01-29 09:07:27.883+00', true, 1990.00, NULL, false, NULL, NULL, '2026-01-29 09:07:27.941608+00', '2026-01-29 09:07:27.941608+00', false, NULL, NULL),
	('690f435e-1821-40c8-a79d-545641500364', '28329192-b3ce-4deb-97be-84d5ca0793e1', 'ai_job_matching', NULL, 'active', 'annual', '2026-01-29 09:12:05.038+00', '2027-01-29 09:12:05.038+00', true, 2490.00, NULL, false, NULL, NULL, '2026-01-29 09:12:05.098796+00', '2026-01-29 09:12:05.098796+00', false, NULL, NULL),
	('6061f269-8250-4d04-bc16-31fa16843f17', '3a05be9e-54ed-4dd4-9f13-7d118d662a3d', 'career_ai', NULL, 'active', 'annual', '2026-01-29 09:46:42.973+00', '2027-01-29 09:46:42.973+00', true, 1990.00, NULL, false, NULL, NULL, '2026-01-29 09:46:43.033799+00', '2026-01-29 09:46:43.033799+00', false, NULL, NULL),
	('0f8d5d9d-6fac-4437-9009-27314ee6b354', 'c29ecd33-2958-4931-905a-68fb5382676b', 'video_portfolio', NULL, 'active', 'annual', '2026-01-29 10:43:41.597+00', '2027-01-29 10:43:41.597+00', true, 990.00, NULL, false, NULL, NULL, '2026-01-29 10:43:41.651324+00', '2026-01-29 10:43:41.651324+00', false, NULL, NULL),
	('c8d56a1a-9035-467f-95cd-ae82d047d726', 'c29ecd33-2958-4931-905a-68fb5382676b', 'ai_job_matching', NULL, 'active', 'annual', '2026-01-29 10:45:56.59+00', '2027-01-29 10:45:56.59+00', true, 2490.00, NULL, false, NULL, NULL, '2026-01-29 10:45:56.643266+00', '2026-01-29 10:45:56.643266+00', false, NULL, NULL),
	('94f7ebc4-854f-4742-a6b4-f5b148cd4ac1', '52004557-7df2-4c2a-bffb-437588cbb619', 'curriculum_builder', NULL, 'active', 'annual', '2026-01-29 11:34:53.863+00', '2027-01-29 11:34:53.863+00', true, 3990.00, NULL, false, NULL, NULL, '2026-01-29 11:34:53.917734+00', '2026-01-29 11:34:53.917734+00', false, NULL, NULL),
	('29d90dbe-01da-4119-a98f-547857faa4ac', '908a6091-88d5-4604-a3bc-bc22f9b58a63', 'mentor_notes', NULL, 'active', 'annual', '2026-01-30 03:47:01.917+00', '2027-01-30 03:47:01.917+00', true, 990.00, NULL, false, NULL, NULL, '2026-01-30 03:47:01.965442+00', '2026-01-30 03:47:01.965442+00', false, NULL, NULL),
	('44dbea13-efdc-4d3b-b53c-4644532109c1', '908a6091-88d5-4604-a3bc-bc22f9b58a63', 'educator_ai', NULL, 'active', 'annual', '2026-01-30 03:47:36.613+00', '2027-01-30 03:47:36.613+00', true, 2990.00, NULL, false, NULL, NULL, '2026-01-30 03:47:36.663037+00', '2026-01-30 03:47:36.663037+00', false, NULL, NULL),
	('0910baef-b40b-4237-afa5-228fd76a866a', '323c133d-6144-43ca-bfd0-aaa0f11c2c26', 'mentor_notes', NULL, 'active', 'annual', '2026-01-30 06:20:36.286+00', '2027-01-30 06:20:36.286+00', true, 990.00, NULL, false, NULL, NULL, '2026-01-30 06:20:36.375553+00', '2026-01-30 06:20:36.375553+00', false, NULL, NULL),
	('67331c93-860f-4b4f-99dd-af68a41e5c0c', '5bac50f5-c2a2-433f-a027-7cafdad3ebf7', 'pipeline_management', NULL, 'active', 'annual', '2026-01-30 09:16:48.328+00', '2027-01-30 09:16:48.328+00', true, 2490.00, NULL, false, NULL, NULL, '2026-01-30 09:16:48.392279+00', '2026-01-30 09:16:48.392279+00', false, NULL, NULL),
	('0e7d4279-b57d-4c48-ba5d-ef26fdb6f4bc', '95364f0d-23fb-4616-b0f4-48caafee5439', 'video_portfolio', NULL, 'active', 'monthly', '2026-02-01 13:33:17.935+00', '2026-03-01 13:33:17.935+00', true, 99.00, NULL, false, NULL, NULL, '2026-02-01 13:33:18.011365+00', '2026-02-01 13:33:18.011365+00', false, NULL, NULL),
	('18c62505-55d5-44a5-9357-f4cf8c243921', '4452a7a8-689e-4806-bae3-fe3ecc32735a', 'ai_job_matching', NULL, 'active', 'annual', '2026-02-02 10:03:03.967+00', '2027-02-02 10:03:03.967+00', true, 2490.00, NULL, false, NULL, NULL, '2026-02-02 10:03:04.028144+00', '2026-02-02 10:03:04.028144+00', false, NULL, NULL);


--

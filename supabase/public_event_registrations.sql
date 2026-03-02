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
-- Data for Name: event_registrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."event_registrations" ("id", "full_name", "email", "phone", "plan_type", "plan_amount", "razorpay_order_id", "razorpay_payment_id", "event_name", "notes", "created_at", "updated_at", "role_type", "address", "city", "state", "student_tier_id", "student_count_min", "student_count_max", "role_details", "pincode", "institution_name", "user_id", "student_count", "price_per_student", "payment_status") VALUES
	('5a0f6008-8f1f-4ba6-a014-c3a5593162fa', 'sfg', 'dfg@fgs.trdf', '1234567890', 'Social Media Campaign', 250, 'order_S6tOYgSNsYpM5O', NULL, 'direct', NULL, '2026-01-22 10:32:26.302493+00', '2026-01-22 10:32:26.302493+00', 'social_media_lead', NULL, NULL, NULL, NULL, NULL, NULL, '{}', NULL, NULL, NULL, 1, 250.00, 'pending'),
	('7fb02206-ddd1-4e3d-bad2-22563a934876', 'gokul', 'gokul@rareminds.in', '9567989948', 'Pre-Registration', 250, NULL, NULL, 'direct', NULL, '2026-01-22 10:50:45.647934+00', '2026-01-22 10:50:45.647934+00', 'pre_registration', NULL, NULL, NULL, NULL, NULL, NULL, '{}', NULL, NULL, NULL, 1, 250.00, 'pending'),
	('97acb264-f542-40d4-82ba-ba9e9df51c2c', 'test', 'pepamom915@icousd.com', '6362214161', 'Social Media Campaign', 500, 'order_RzLQLevL176Awm', 'pay_RzLQUVSUn03JBK', 'direct', NULL, '2026-01-03 08:45:31.131302+00', '2026-01-03 08:45:31.131302+00', 'social_media_lead', NULL, NULL, NULL, NULL, NULL, NULL, '{}', NULL, NULL, NULL, 2, 250.00, 'completed'),
	('f37c055b-bc32-4f87-8112-527b151c3963', 'sr', 'subashini.r@gmail.com', '9844166951', 'Social Media Campaign', 750, 'order_RzMLCRxm1dNEj9', 'pay_RzMLjdEfG9sCLO', 'direct', NULL, '2026-01-03 09:39:20.624237+00', '2026-01-03 09:39:20.624237+00', 'social_media_lead', NULL, NULL, NULL, NULL, NULL, NULL, '{}', NULL, NULL, NULL, 3, 250.00, 'completed'),
	('e18c3512-f342-4782-b213-c37ca4285044', 'test', 'doran52914@icousd.com', '6362214161', 'Social Media Campaign', 750, 'order_RzhkKVB8eKits0', NULL, 'legacy', NULL, '2026-01-04 06:35:37.715093+00', '2026-01-04 06:35:37.715093+00', 'social_media_lead', NULL, NULL, NULL, NULL, NULL, NULL, '{}', NULL, NULL, NULL, 3, 250.00, 'pending'),
	('a04275f1-2b09-4244-8b54-672380b8b1aa', 'kamal Jyoti Samal', 'kamal@rareminds.in', '6371066384', 'Social Media Campaign', 250, 'order_S03qPuOMfVUasP', 'pay_S03r24jiTDVuhb', 'legacy', NULL, '2026-01-05 04:12:43.672626+00', '2026-01-05 04:12:43.672626+00', 'social_media_lead', NULL, NULL, NULL, NULL, NULL, NULL, '{}', NULL, NULL, NULL, 1, 250.00, 'completed'),
	('9a79d0e0-8db7-4c7e-936f-d4cd204a755b', 'Litikesh Vilvanathan', 'litikesh99@rareminds.in', '0997088260', 'Social Media Campaign', 500, 'order_S5fRJmHU8phGRF', NULL, 'legacy', NULL, '2026-01-19 08:14:20.523462+00', '2026-01-19 08:14:20.523462+00', 'social_media_lead', NULL, NULL, NULL, NULL, NULL, NULL, '{}', NULL, NULL, NULL, 2, 250.00, 'pending'),
	('ecd6a085-6765-46e3-8c20-72ddcf3909f4', 'naveen', 'gowdanavi279@gmail.com', '6362214161', 'Social Media Campaign', 500, 'order_S6mljqGM2y1Xvc', 'pay_S6mlthfN7N6VNr', 'legacy', NULL, '2026-01-22 04:03:31.37296+00', '2026-01-22 04:03:31.37296+00', 'social_media_lead', NULL, NULL, NULL, NULL, NULL, NULL, '{}', NULL, NULL, NULL, 2, 250.00, 'completed'),
	('bd68f7ab-864b-4574-90c4-a8c61bc5580e', 'Sandhya Rani', 'sandhya@rareminds.in', '8473058469', 'Social Media Campaign', 250, 'order_S6mmTywOImYgUN', 'pay_S6mnJDMUjH6W0k', 'legacy', NULL, '2026-01-22 04:04:12.585469+00', '2026-01-22 04:04:12.585469+00', 'social_media_lead', NULL, NULL, NULL, NULL, NULL, NULL, '{}', NULL, NULL, NULL, 1, 250.00, 'completed'),
	('8302fdab-5f58-4c55-a0d3-80a55637149a', 'navi', 'naveen@rareminds.in', '6362214161', 'Social Media Campaign', 250, 'order_S6qZjZQ8E5WwNI', NULL, 'legacy', NULL, '2026-01-22 07:46:55.750487+00', '2026-01-22 07:46:55.750487+00', 'social_media_lead', NULL, NULL, NULL, NULL, NULL, NULL, '{}', NULL, NULL, NULL, 1, 250.00, 'pending');


--

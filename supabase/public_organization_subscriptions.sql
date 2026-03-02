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
-- Data for Name: organization_subscriptions; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."organization_subscriptions" ("id", "organization_id", "organization_type", "subscription_plan_id", "purchased_by", "total_seats", "assigned_seats", "target_member_type", "status", "start_date", "end_date", "auto_renew", "price_per_seat", "total_amount", "discount_percentage", "final_amount", "razorpay_subscription_id", "razorpay_order_id", "created_at", "updated_at", "cancelled_at", "cancellation_reason", "razorpay_payment_id") VALUES
	('fb7f88f8-09f3-40bb-8c1c-1ae356c323fe', '83945f29-e517-4f12-9704-b94fccc3ab42', 'school', '87ee4bf0-8776-4ced-ae79-cb2042e285d5', '6e4789bf-92f6-4084-af88-91d4b20cf1db', 10, 2, 'both', 'active', '2026-01-16 07:51:11.181+00', '2027-01-16 07:51:11.181+00', true, 497.00, 4970.00, 0, 5864.60, NULL, 'order_S4TR1zc8ZlZkta', '2026-01-16 07:51:11.240162+00', '2026-01-16 10:28:37.154419+00', NULL, NULL, 'pay_S4TR9r6OGnfd9S'),
	('fef6402d-a68c-4602-a667-6de372a1b229', '83945f29-e517-4f12-9704-b94fccc3ab42', 'school', '87ee4bf0-8776-4ced-ae79-cb2042e285d5', '6e4789bf-92f6-4084-af88-91d4b20cf1db', 10, 1, 'both', 'active', '2026-01-16 07:05:32.047+00', '2027-01-16 07:05:32.047+00', true, 497.00, 4970.00, 0, 5864.60, NULL, 'order_S4SesYRY8krSK7', '2026-01-16 07:05:32.11591+00', '2026-01-17 04:35:49.56818+00', NULL, NULL, 'pay_S4SexZbAPLY26o');


--

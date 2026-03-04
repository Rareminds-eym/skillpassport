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
-- Data for Name: pre_registrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."pre_registrations" ("id", "full_name", "email", "phone", "amount", "razorpay_order_id", "razorpay_payment_id", "campaign", "role_type", "created_at", "updated_at", "payment_status", "payment_history") VALUES
	('74a8c3ca-2bbf-4238-89a8-99518cceb3c4', 'Saravanan.v', 'saroveera017@gmail.com', '9655937353', 250, 'order_S89saWyxtWcrPl', NULL, 'direct', 'pre_registration', '2026-01-25 15:18:58.498491+00', '2026-01-25 15:18:58.498491+00', 'pending', '[{"error": null, "status": "pending", "order_id": "order_S89saWyxtWcrPl", "created_at": "2026-01-25T15:18:59.402Z", "payment_id": null}]'),
	('b7c3cd44-d810-445c-8c10-ac5bbd45e81b', 'Joshwa X', 'jaijosva498@gmail.com', '8270287541', 250, 'order_S89xOfaoQn74nU', NULL, 'direct', 'pre_registration', '2026-01-25 15:23:31.501884+00', '2026-01-25 15:23:31.501884+00', 'pending', '[{"error": null, "status": "pending", "order_id": "order_S89xOfaoQn74nU", "created_at": "2026-01-25T15:23:32.621Z", "payment_id": null}]');


--

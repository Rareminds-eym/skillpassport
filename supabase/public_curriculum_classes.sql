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
-- Data for Name: curriculum_classes; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."curriculum_classes" ("id", "school_id", "name", "description", "is_active", "display_order", "created_at", "updated_at") VALUES
	('0e2fb29b-ed90-4661-94ab-23749a52b605', '69cf3489-0046-4414-8acc-409174ffbd2c', '11', NULL, true, 11, '2025-12-03 04:45:27.892556', '2025-12-03 05:50:08.293804'),
	('441b1c82-03e2-490e-af16-056202dcb628', '69cf3489-0046-4414-8acc-409174ffbd2c', '1', NULL, true, 1, '2025-12-03 04:45:27.892556', '2025-12-03 05:50:12.712588'),
	('44ec6684-18ef-4232-b4d3-231cdc9e8252', '69cf3489-0046-4414-8acc-409174ffbd2c', '2', NULL, true, 2, '2025-12-03 04:45:27.892556', '2025-12-03 05:50:16.015139'),
	('484620ea-648b-4e18-9080-86ebaa17bcef', '69cf3489-0046-4414-8acc-409174ffbd2c', '6', NULL, true, 6, '2025-12-03 04:45:27.892556', '2025-12-03 05:50:19.125468'),
	('5d5ef9d5-4ea6-4683-8517-c6ffbfdc5087', '69cf3489-0046-4414-8acc-409174ffbd2c', '4', NULL, true, 4, '2025-12-03 04:45:27.892556', '2025-12-03 05:50:22.510642'),
	('6d7c0e39-c334-4453-8c6d-600da61f877d', '69cf3489-0046-4414-8acc-409174ffbd2c', '10', NULL, true, 10, '2025-12-03 04:45:27.892556', '2025-12-03 05:50:26.435126'),
	('8833df7b-a345-467f-910a-ac426a56221b', '69cf3489-0046-4414-8acc-409174ffbd2c', '7', NULL, true, 7, '2025-12-03 04:45:27.892556', '2025-12-03 05:50:35.769786'),
	('8f3c1351-b958-4894-8aad-1dbd0cd3e8ae', '69cf3489-0046-4414-8acc-409174ffbd2c', '9', NULL, true, 9, '2025-12-03 04:45:27.892556', '2025-12-03 05:50:40.398034'),
	('96b6caea-1477-4707-baca-7d60fd884e06', '69cf3489-0046-4414-8acc-409174ffbd2c', '8', NULL, true, 8, '2025-12-03 04:45:27.892556', '2025-12-03 05:50:43.505772'),
	('b0e3dd7b-9724-4e19-916d-ae2996ce15b5', '69cf3489-0046-4414-8acc-409174ffbd2c', '5', NULL, true, 5, '2025-12-03 04:45:27.892556', '2025-12-03 05:50:46.921384'),
	('bfb141d4-da81-4ca7-883e-16eb29b2bb38', '69cf3489-0046-4414-8acc-409174ffbd2c', '12', NULL, true, 12, '2025-12-03 04:45:27.892556', '2025-12-03 05:50:50.704584'),
	('e6924e4e-79ee-4613-874b-9b6336474b59', '69cf3489-0046-4414-8acc-409174ffbd2c', '3', NULL, true, 3, '2025-12-03 04:45:27.892556', '2025-12-03 05:50:54.056626');


--

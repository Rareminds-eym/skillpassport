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
-- Data for Name: tutor_conversations; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."tutor_conversations" ("id", "student_id", "course_id", "lesson_id", "title", "messages", "created_at", "updated_at") VALUES
	('c09c273d-9c8b-45e4-93ef-b79452080d84', '95364f0d-23fb-4616-b0f4-48caafee5439', '71a8c1e0-4087-45f1-8f8a-b7bb8978322f', '5317fb02-8b75-4d5c-8fb0-2ce918f4c707', '"Blockchain vs. Centralized Systems: Key Differences"', '[{"id": "294ab96a-bfa3-4dee-bfff-f1ac7180d81a", "role": "user", "content": "What are the key differences between blockchain and traditional centralized systems?", "timestamp": "2025-12-23T09:21:16.983Z"}, {"id": "294ab96a-bfa3-4dee-bfff-f1ac7180d81a", "role": "assistant", "content": "Great question! The primary difference lies in how data is managed and stored. In traditional centralized systems, a single entity controls the database, meaning all transactions and data changes go through that central authority. In contrast, blockchain operates on a decentralized network where multiple nodes share and maintain the same data, enhancing security and transparency. This decentralization means that no single person or organization has control, fostering trust among users since everyone can verify transactions. \n\nDoes that help clarify things? What aspect of decentralization are you most curious about?", "timestamp": "2025-12-23T09:21:20.130Z"}]', '2025-12-23 09:21:20.843875+00', '2025-12-23 09:21:20.843875+00');


--

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
-- Data for Name: course_modules; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."course_modules" ("module_id", "course_id", "title", "description", "order_index", "skill_tags", "activities", "created_at", "updated_at") VALUES
	('f09f55ba-383a-484c-8eda-b326f351011b', '71a8c1e0-4087-45f1-8f8a-b7bb8978322f', 'INTRODUCTION TO BLOCKCHAIN', 'This module introduces the basic structure and purpose of blockchain technology. Students will learn what blockchain is, why it was created, and how it differs from traditional centralized systems. Key terminology and concepts will be explained in simple, accessible language to build a strong foundation for more advanced topics in later modules.', 1, '[]', '[]', '2025-12-03 04:27:32.082122+00', '2025-12-03 04:27:32.082122+00'),
	('85092b3f-e30a-4d3d-b265-2e3b0a2702fc', '71a8c1e0-4087-45f1-8f8a-b7bb8978322f', 'BLOCKCHAIN ARCHITECTURE & HOW IT WORKS', 'This module dives deeper into the internal structure and functioning of a blockchain system. Learners will explore how data is stored securely, how blocks are linked together, and how transactions are verified across a distributed network. The module also explains the importance of cryptography, network consensus, and the mechanisms that keep blockchain systems tamper-resistant.', 2, '[]', '[]', '2025-12-03 04:27:32.200127+00', '2025-12-03 04:27:32.200127+00'),
	('c372125b-2837-4e1d-82ad-ffe9e4902ebb', 'f1cac1d9-b949-4927-9867-dce223662278', 'INTRODUCTION TO GENERATIVE AI', 'This module provides a foundational overview of Generative AI, exploring what it is, how it works, and why it matters. Learners will be introduced to the difference between traditional AI systems that recognize patterns and generative models capable of producing new content. The module also highlights the evolution of AI technologies, key breakthroughs that enabled modern GenAI, and current real-world applications across industries such as entertainment, healthcare, education, and business. By the end of this module, students will have a clear understanding of the scope, relevance, and potential of generative AI in shaping the future of digital innovation.', 1, '[]', '[]', '2025-12-03 15:13:39.268685+00', '2025-12-03 15:13:39.268685+00');


--

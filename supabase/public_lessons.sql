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
-- Data for Name: lessons; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."lessons" ("lesson_id", "module_id", "title", "description", "content", "duration", "order_index", "created_at", "updated_at") VALUES
	('5317fb02-8b75-4d5c-8fb0-2ce918f4c707', 'f09f55ba-383a-484c-8eda-b326f351011b', 'What is Blockchain?', '', 'This lesson introduces the concept of blockchain technology, its purpose, and how it differs from traditional centralized systems. Students will gain an understanding of the history behind blockchain and why decentralized digital trust has become essential in the modern digital economy.', '30 mins', 1, '2025-12-03 04:32:45.574457+00', '2025-12-03 04:32:45.574457+00'),
	('8f9e930f-7cb7-4c75-95a0-ee37652b08fc', 'f09f55ba-383a-484c-8eda-b326f351011b', 'Centralized vs. Decentralized Networks', '', 'Learners explore how decentralized networks function and compare them to centralized models commonly used today. The lesson highlights the advantages of decentralization, including transparency and security, as well as challenges such as scalability.', '20 mins', 2, '2025-12-03 04:33:14.149245+00', '2025-12-03 04:33:14.149245+00'),
	('b4b0d784-74a1-4dcd-8b9f-51fde39e06b8', 'c372125b-2837-4e1d-82ad-ffe9e4902ebb', 'What is Generative AI?', '', 'This lesson introduces the core idea of generative AI and how it differs from traditional predictive AI. Students will learn why GenAI has become a breakthrough technology and explore its wide-ranging applications such as chatbots, image generation, and automation.', '45 minutes', 1, '2025-12-03 15:14:04.931699+00', '2025-12-03 15:14:04.931699+00'),
	('9c2e5873-51af-4001-86b8-e2f6ced939dd', 'c372125b-2837-4e1d-82ad-ffe9e4902ebb', 'Evolution of AI: From Rule-Based to Generative Models', '', 'Learners will examine the historical progression of artificial intelligence — from early symbolic systems to modern deep learning-powered generative models. Key milestones, research innovations, and technological drivers behind today’s breakthroughs will be covered.', '60 minutes', 2, '2025-12-03 15:14:27.133052+00', '2025-12-03 15:14:27.133052+00'),
	('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', '85092b3f-e30a-4d3d-b265-2e3b0a2702fc', 'How Blocks Are Created and Linked', 'Understanding the block creation process', 'This lesson explains the technical process of how blocks are created in a blockchain network. Students will learn about block headers, timestamps, nonces, and how cryptographic hashing links blocks together to form an immutable chain. The lesson covers the mining process and how new blocks are validated before being added to the chain.', '35 mins', 1, '2025-12-24 08:45:37.462178+00', '2025-12-24 08:45:37.462178+00'),
	('b2c3d4e5-f6a7-5b6c-9d0e-1f2a3b4c5d6e', '85092b3f-e30a-4d3d-b265-2e3b0a2702fc', 'Consensus Mechanisms Explained', 'Proof of Work vs Proof of Stake', 'This lesson dives deep into consensus mechanisms - the protocols that allow distributed networks to agree on the state of the blockchain. Students will compare Proof of Work (PoW) used by Bitcoin with Proof of Stake (PoS) used by Ethereum 2.0, understanding the trade-offs between security, energy efficiency, and decentralization.', '40 mins', 2, '2025-12-24 08:45:37.462178+00', '2025-12-24 08:45:37.462178+00'),
	('c3d4e5f6-a7b8-6c7d-0e1f-2a3b4c5d6e7f', '85092b3f-e30a-4d3d-b265-2e3b0a2702fc', 'Cryptography in Blockchain', 'Hash functions and digital signatures', 'This lesson covers the cryptographic foundations of blockchain technology. Students will learn about SHA-256 hashing, public-private key pairs, digital signatures, and how these cryptographic primitives ensure data integrity, authentication, and non-repudiation in blockchain transactions.', '30 mins', 3, '2025-12-24 08:45:37.462178+00', '2025-12-24 08:45:37.462178+00');


--

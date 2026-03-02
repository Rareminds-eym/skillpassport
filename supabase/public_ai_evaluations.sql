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
-- Data for Name: ai_evaluations; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."ai_evaluations" ("id", "conversation_id", "student_id", "message_id", "user_message", "ai_response", "detected_intent", "intent_confidence", "conversation_phase", "thumbs_up", "user_rating", "user_feedback", "response_time_ms", "model_used", "created_at", "feedback_at") VALUES
	('2fb56f3e-05bd-4298-aea2-7426a3ebefb9', '87a377ba-dc82-48a6-9a76-b72d68698fec', 'c5d30a55-8d9a-46e6-b8d0-6accc0415c1c', '14645426-fbf3-4f21-9403-e9704ab35bd4', 'Do I have the skills for it?', 'Absolutely, Litikesh! Based on your profile, you have several skills that are well-suited for the **Peer Tutoring Intern** role. Let’s break down how your skills align with the requirements of this position:

### **Relevant Skills:**

1. **Communication:**
   - Your ability to convey information clearly is crucial for tutoring. Effective communication helps students understand complex topics better.

2. **Teamwork:**
   - As a former Class Representative and School Principle Leader, you’ve demonstrated strong teamwork skills, which are essential when collaborating with teachers and fellow tutors.

3. **Time Management:**
   - Balancing tutoring sessions with your studies requires excellent time management skills, which you possess.

4. **Technical Skills:**
   - Your background in programming and technical skills (like HTML, CSS, and JavaScript) can be beneficial if you’re tutoring in subjects that require technical knowledge or if you’re helping students with related projects.

5. **Work Ethic:**
   - Your strong work ethic will ensure that you are committed to helping your peers succeed, which is key in a tutoring role.

### **Soft Skills:**
- Your soft skills, such as teamwork, communication, and work ethic, align perfectly with the interpersonal aspects of tutoring. These skills will help you create a supportive and effective learning environment.

### **Conclusion:**
You have a solid foundation of skills that make you a great candidate for the Peer Tutoring Intern role! Your combination of technical knowledge and soft skills will allow you to connect with students and help them improve academically.

If you’d like to work on enhancing any specific skills or prepare for the interview, let me know! 🌟', 'skill-gap', 'low', 'exploring', true, NULL, NULL, NULL, 'openai/gpt-4o-mini', '2025-12-19 11:56:16.82305+00', '2025-12-19 11:56:16.722+00'),
	('57f6e4b9-eb53-4deb-bd1e-f1a3e9b863b8', '87a377ba-dc82-48a6-9a76-b72d68698fec', 'c5d30a55-8d9a-46e6-b8d0-6accc0415c1c', '7d1f801d-f0c0-4998-9c6d-26187aada4c1', 'Do I have the skills for it?', 'Absolutely, Litikesh! Based on your profile, you possess several skills that are highly relevant for the **Peer Tutoring Intern** role. Here’s how your skills align with the requirements of the position:

### **Relevant Skills:**

1. **Communication:**
   - Your ability to communicate effectively will be crucial when explaining concepts to your peers. This skill is essential in ensuring that students understand the material.

2. **Teamwork:**
   - As a Class Representative and School Principle Leader, you have demonstrated strong teamwork abilities. Collaborating with teachers and fellow tutors will be a significant part of this role.

3. **Technical Skills:**
   - Your knowledge in programming (HTML, CSS, JavaScript) and other technical skills can be beneficial, especially if you’re tutoring subjects related to science or technology.

4. **Time Management:**
   - Balancing tutoring sessions with your studies will require good time management skills, which you seem to have developed through your leadership roles.

5. **Work Ethic:**
   - Your commitment to helping others and your proactive approach to learning will shine through in this internship, making you a valuable asset to the tutoring team.

### **Conclusion:**
You have a solid foundation of skills that align well with the responsibilities of a Peer Tutoring Intern. Your experience in leadership and your technical background will give you an edge in this role. 

If you want to prepare further or need tips on how to highlight these skills during your interview, let me know! 📚✨', 'skill-gap', 'low', 'exploring', false, 2, 'Not Good Please imporve', NULL, 'openai/gpt-4o-mini', '2025-12-19 11:56:31.151878+00', '2025-12-19 11:56:30.987+00'),
	('3c2a1794-f259-4253-a1aa-8f2fc340d4bc', 'e8c8c6a9-71eb-4a05-b751-5236f1f5e9f4', 'ab46b2ac-9922-4569-adc6-73eb6b645202', '55a8f2ee-aa21-47a1-85a1-7ffc5d7b2b56', 'Give me networking strategies for my field', 'Hi Meera! 👋 I''m glad you''re looking to enhance your networking strategies. Given your strength in Maths and skills in HTML/CSS, here are some tailored strategies:

1. **Join Online Communities**: Participate in forums or groups related to Mathematics and web development. Platforms like LinkedIn and Reddit have dedicated spaces where you can connect with professionals.

2. **Attend Workshops/Webinars**: Look for online or local events focused on Maths or tech skills. These are great opportunities to meet like-minded individuals and industry experts.

3. **Create a Portfolio**: Showcase your projects, like your plant growth experiment and Scratch coding project. A strong portfolio can attract attention and initiate conversations.

Would you like help finding specific online communities or workshops in your area? 🌐🎯', 'networking', 'medium', 'opening', false, 4, 'upraded', NULL, 'openai/gpt-4o-mini', '2026-01-22 08:48:57.674951+00', '2026-01-22 08:49:13.033+00');


--

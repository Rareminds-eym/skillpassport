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
-- Data for Name: video_summaries; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."video_summaries" ("id", "lesson_id", "course_id", "video_url", "video_type", "transcript", "transcript_segments", "summary", "key_points", "chapters", "topics", "duration_seconds", "language", "processing_status", "error_message", "created_at", "updated_at", "processed_at", "sentiment_data", "speakers", "deepgram_summary", "notable_quotes", "quiz_questions", "flashcards", "srt_content", "vtt_content") VALUES
	('1c8d59cb-ac0d-4b57-a6c9-f8c373d150dc', '8f9e930f-7cb7-4c75-95a0-ee37652b08fc', '71a8c1e0-4087-45f1-8f8a-b7bb8978322f', 'https://skill-echosystem.ad91abcd16cd9e9c569d83d9ef46e398.r2.cloudflarestorage.com/courses/71a8c1e0-4087-45f1-8f8a-b7bb8978322f/lessons/8f9e930f-7cb7-4c75-95a0-ee37652b08fc/1764912705921-4f2c0ee31f0b1a28.mp4?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=8796c748e9ac5127466f6b914859c42e%2F20251205%2Fauto%2Fs3%2Faws4_request&X-Amz-Date=20251205T053525Z&X-Amz-Expires=604800&X-Amz-Signature=8a1415332dced559d7e30215d4498fb9ef3bc0747fee54bfcef6be84d7c701cc&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject', 'uploaded', 'In a world where skills are changing faster than ever, marks and certificates only tell part of the story. What about the projects, the practice, the real experiences? Where do we capture everything that truly builds talent? Schools, students, and industries often work in silos. It''s time to connect the dots. Introducing talent and skills ecosystem, a platform designed to truly bridge talent, built on three powerful pillars, track, verify, and grow. First, track every learning moment, assignments, projects, trainings, and more, including industry visits and internships. Next, verify skills with an approval center where educators and industry mentors validate each achievement. And finally, help students grow with clear, guided paths from classroom learning to confident career choices. For students, it''s a rich, trusted digital portfolio. For schools, a structured view of learning and outcomes. For industries, access to students who are already work ready. And for recruiters, verified skill passports instead of static CVs, all connected in one ecosystem, live, dynamic, and always updated. Log in as an educator and enjoy a sleek Night View dashboard, where you can easily manage classrooms. View all your students at a glance. Create assignments and projects with just a few clicks. Evaluate submissions and give meaningful feedback. Each activity automatically updates the student''s skill profile. Get an eagle view of your institution with powerful analytics, spot trends, identify gaps, and celebrate success. Capturing every meaningful experience in one place, just scan a student''s NFC card and instantly see their skill snapshot, skills acquired, experiences gained, and trainings attended, plus industry visits and internship learning applications. Meet Career AI, a smart guide for every student. Students can ask questions, explore roles, and discover themselves. Career AI suggests skills to build and roles that match their interests. It even helps them discover colleges and courses for further education. Counselors see a complete picture and guide students more effectively. Together, they co create a clear road map from today to tomorrow. All of this feeds into the students'' digital skill passport. Students can add external skills, certifications, and co curricular achievements. It becomes more than a resume. It''s a living, verified story. Recruiters can instantly see real, validated potential, empowering skills, bridging talent, track, verify, grow. Book a demo today at our Didact stall.', '[{"end": 5.7599998, "text": "in a world where skills are changing faster than ever marks and certificates only tell", "start": 0.08, "speaker": 0}, {"end": 12, "text": "part of the story what about the projects the practice the real experiences where do", "start": 5.7599998, "speaker": 0}, {"end": 19.785, "text": "we capture everything that truly builds talent schools students and industries often work in silos", "start": 12, "speaker": 0}, {"end": 26.805, "text": "it''s time to connect the dots introducing talent and skills ecosystem a platform designed to", "start": 19.785, "speaker": 0}, {"end": 35.34, "text": "truly bridge talent built on three powerful pillars track verify and grow first track every", "start": 26.805, "speaker": 0}, {"end": 45.375, "text": "learning moment assignments projects trainings and more including industry visits and internships next verify skills", "start": 35.34, "speaker": 0}, {"end": 53.435, "text": "with an approval center where educators and industry mentors validate each achievement and finally help", "start": 45.375, "speaker": 0}, {"end": 64.18, "text": "students grow with clear guided paths from classroom learning to confident career choices for students", "start": 53.435, "speaker": 0}, {"end": 70.9, "text": "it''s a rich trusted digital portfolio for schools a structured view of learning and outcomes", "start": 64.18, "speaker": 0}, {"end": 78.565, "text": "for industries access to students who are already work ready and for recruiters verified skill", "start": 70.9, "speaker": 0}, {"end": 86.745, "text": "passports instead of static cvs all connected in one ecosystem live dynamic and always updated", "start": 78.565, "speaker": 0}, {"end": 103.695, "text": "log in as an educator and enjoy a sleek night view dashboard where you can", "start": 86.745, "speaker": 0}, {"end": 110.015, "text": "easily manage classrooms view all your students at a glance create assignments and projects with", "start": 103.695, "speaker": 0}, {"end": 117.590004, "text": "just a few clicks evaluate submissions and give meaningful feedback each activity automatically updates the", "start": 110.015, "speaker": 0}, {"end": 124.81, "text": "student''s skill profile get an eagle view of your institution with powerful analytics spot trends", "start": 117.590004, "speaker": 0}, {"end": 137.115, "text": "identify gaps and celebrate success capturing every meaningful experience in one place just scan a", "start": 124.81, "speaker": 0}, {"end": 145.31, "text": "student''s nfc card and instantly see their skill snapshot skills acquired experiences gained and trainings", "start": 137.115, "speaker": 0}, {"end": 153.13, "text": "attended plus industry visits and internship learning applications meet career ai a smart guide for", "start": 145.31, "speaker": 0}, {"end": 160.63501, "text": "every student students can ask questions explore roles and discover themselves career ai suggests skills", "start": 153.13, "speaker": 0}, {"end": 165.515, "text": "to build and roles that match their interests it even helps them discover colleges and", "start": 160.63501, "speaker": 0}, {"end": 172.655, "text": "courses for further education counselors see a complete picture and guide students more effectively together", "start": 165.515, "speaker": 0}, {"end": 177.25, "text": "they co create a clear road map from today to tomorrow all of this feeds", "start": 172.655, "speaker": 0}, {"end": 184.31, "text": "into the students'' digital skill passport students can add external skills certifications and co curricular", "start": 177.25, "speaker": 0}, {"end": 191.555, "text": "achievements it becomes more than a resume it''s a living verified story recruiters can instantly", "start": 184.31, "speaker": 0}, {"end": 200.64499, "text": "see real validated potential empowering skills bridging talent track verify grow book a demo today", "start": 191.555, "speaker": 0}, {"end": 202.245, "text": "at our didact stall", "start": 200.64499, "speaker": 0}]', 'The video introduces a transformative platform called the talent and skills ecosystem, designed to address the disconnect between education and industry by capturing the full spectrum of student learning experiences. Unlike traditional marks and certificates, which only reflect academic achievements, this platform emphasizes the importance of tracking real-world projects, internships, and practical experiences that contribute to a student''s skill development. The ecosystem is built on three core pillars: track, verify, and grow, aiming to create a comprehensive digital portfolio for students, a structured overview for schools, and verified skill passports for recruiters.

The platform offers educators a user-friendly dashboard to manage classrooms, create assignments, and evaluate student submissions, all while automatically updating each student''s skill profile. Additionally, it features Career AI, a smart guide that assists students in exploring career options, suggesting relevant skills, and providing pathways to further education. This holistic approach not only empowers students to take charge of their learning journey but also equips counselors and recruiters with the tools needed to understand and validate a student''s potential, ultimately bridging the gap between education and employment in a dynamic, interconnected ecosystem.', '["Traditional marks and certificates do not fully represent a student''s skills and experiences.", "The talent and skills ecosystem is built on three pillars: track, verify, and grow.", "The platform allows for tracking of all learning moments, including projects and internships.", "Skills are verified through an approval center involving educators and industry mentors.", "Students benefit from a digital portfolio that showcases their skills and experiences.", "Educators can manage classrooms and analyze student performance through a sleek dashboard.", "Career AI assists students in exploring career paths and suggests relevant skills.", "The digital skill passport serves as a living resume, showcasing verified skills and achievements."]', '[{"title": "Introduction to the Talent and Skills Ecosystem", "summary": "The video opens by discussing the inadequacy of traditional marks and certificates in representing a student''s true abilities and experiences, highlighting the need for a more comprehensive approach.", "timestamp": 0}, {"title": "Three Pillars of the Ecosystem", "summary": "The platform is introduced, built on the pillars of tracking, verifying, and growing student skills, aiming to connect education with industry needs.", "timestamp": 0.26}, {"title": "Benefits for Students, Schools, and Industries", "summary": "The ecosystem provides students with a digital portfolio, schools with structured learning outcomes, and industries with access to work-ready candidates.", "timestamp": 1.04}, {"title": "Educator Dashboard Features", "summary": "Educators can manage classrooms efficiently, create assignments, and evaluate student work, with automatic updates to student skill profiles.", "timestamp": 1.43}, {"title": "Career AI for Student Guidance", "summary": "Career AI is introduced as a tool for students to explore career options, discover skills, and find educational pathways, enhancing their self-discovery process.", "timestamp": 2.33}, {"title": "The Digital Skill Passport", "summary": "The digital skill passport is explained as a dynamic representation of a student''s skills and achievements, providing recruiters with verified insights into a candidate''s potential.", "timestamp": 3.04}]', '["Talent and skills ecosystem", "Importance of tracking real-world experiences", "Verification of skills through mentorship", "Digital portfolios for students", "Educator tools and analytics", "Career guidance through AI", "Digital skill passports", "Bridging the gap between education and industry"]', 210, 'en', 'completed', NULL, '2025-12-06 07:36:18.6636+00', '2025-12-06 07:36:50.835+00', '2025-12-06 07:36:50.835+00', '{"overall": "positive", "segments": [{"text": "In a world where skills are changing faster than ever, marks and certificates only tell part of the story. What about the projects, the practice, the real experiences? Where do we capture everything that truly builds talent? Schools, students, and industries often work in silos. It''s time to connect the dots.", "score": 0.05355498194694519, "endWord": 50, "sentiment": "neutral", "startWord": 0}, {"text": "Introducing talent and skills ecosystem, a platform designed to truly bridge talent, built on three powerful pillars, track, verify, and grow.", "score": 0.4723057150840759, "endWord": 71, "sentiment": "positive", "startWord": 51}, {"text": "First, track every learning moment, assignments, projects, trainings, and more, including industry visits and internships. Next, verify skills with an approval center where educators and industry mentors validate each achievement.", "score": 0.25287455320358276, "endWord": 101, "sentiment": "neutral", "startWord": 72}, {"text": "And finally, help students grow with clear, guided paths from classroom learning to confident career choices. For students, it''s a rich, trusted digital portfolio. For schools, a structured view of learning and outcomes. For industries, access to students who are already work ready. And for recruiters, verified skill passports instead of static CVs, all connected in one ecosystem, live, dynamic, and always updated. Log in as an educator and enjoy a sleek Night View dashboard, where you can easily manage classrooms. View all your students at a glance. Create assignments and projects with just a few clicks. Evaluate submissions and give meaningful feedback. Each activity automatically updates the student''s skill profile. Get an eagle view of your institution with powerful analytics, spot trends, identify gaps, and celebrate success. Capturing every meaningful experience in one place, just scan a student''s NFC card and instantly see their skill snapshot, skills acquired, experiences gained, and trainings attended, plus industry visits and internship learning applications. Meet Career AI, a smart guide for every student. Students can ask questions, explore roles, and discover themselves. Career AI suggests skills to build and roles that match their interests. It even helps them discover colleges and courses for further education. Counselors see a complete picture and guide students more effectively. Together, they co create a clear road map from today to tomorrow. All of this feeds into the students'' digital skill passport. Students can add external skills, certifications, and co curricular achievements. It becomes more than a resume. It''s a living, verified story. Recruiters can instantly see real, validated potential, empowering skills, bridging talent, track, verify, grow. Book a demo today at our Didact stall.", "score": 0.5227126702935256, "endWord": 378, "sentiment": "positive", "startWord": 102}], "overallScore": 0.4375095294353149}', '[{"id": 0, "utterances": [{"end": 4.58, "text": "In a world where skills are changing faster than ever, marks and certificates", "start": 0.08}, {"end": 6.8199997, "text": "only tell part of the story.", "start": 5.12}, {"end": 8.42, "text": "What about the projects,", "start": 7.2}, {"end": 9.46, "text": "the practice,", "start": 8.72}, {"end": 10.9, "text": "the real experiences?", "start": 9.76}, {"end": 14.985, "text": "Where do we capture everything that truly builds", "start": 11.679999}, {"end": 16.345, "text": "talent? Schools,", "start": 15.525}, {"end": 22.185, "text": "students, and industries often work in silos. It''s time to connect the dots.", "start": 16.885}, {"end": 24.985, "text": "Introducing talent and skills ecosystem,", "start": 22.645}, {"end": 28.185, "text": "a platform designed to truly bridge talent,", "start": 25.445}, {"end": 30.06, "text": "built on three powerful pillars,", "start": 28.564999}, {"end": 33.04, "text": "track, verify, and grow.", "start": 31.019999}, {"end": 34.64, "text": "First, track", "start": 33.42}, {"end": 36.239998, "text": "every learning moment,", "start": 35.02}, {"end": 37.12, "text": "assignments,", "start": 36.62}, {"end": 38.079998, "text": "projects,", "start": 37.579998}, {"end": 42.559998, "text": "trainings, and more, including industry visits and internships.", "start": 38.54}, {"end": 43.755, "text": "Next,", "start": 43.42}, {"end": 46.495003, "text": "verify skills with an approval", "start": 44.315002}, {"end": 47.935, "text": "center where educators", "start": 47.035}, {"end": 49.775, "text": "and industry mentors", "start": 48.395}, {"end": 51.535, "text": "validate each achievement.", "start": 50.235}, {"end": 59.94, "text": "And finally, help students grow with clear, guided paths from classroom learning to confident career choices.", "start": 52.155}, {"end": 66.979996, "text": "For students, it''s a rich, trusted digital portfolio.", "start": 63.28}, {"end": 70.9, "text": "For schools, a structured view of learning and outcomes.", "start": 67.52}, {"end": 72.105, "text": "For industries,", "start": 71.365005}, {"end": 76.905, "text": "access to students who are already work ready. And for recruiters,", "start": 72.645004}, {"end": 82.905, "text": "verified skill passports instead of static CVs, all connected in one ecosystem,", "start": 77.365005}, {"end": 86.745, "text": "live, dynamic, and always updated.", "start": 83.685}, {"end": 102.62, "text": "Log in as an educator and enjoy a sleek Night View dashboard,", "start": 98.12}, {"end": 105.075, "text": "where you can easily manage classrooms.", "start": 103.215004}, {"end": 107.795, "text": "View all your students at a glance.", "start": 105.855}, {"end": 111.075, "text": "Create assignments and projects with just a few clicks.", "start": 108.175}, {"end": 114.355, "text": "Evaluate submissions and give meaningful feedback.", "start": 111.535}, {"end": 116.435, "text": "Each activity automatically", "start": 114.815}, {"end": 118.97, "text": "updates the student''s skill profile.", "start": 117.03}, {"end": 121.37, "text": "Get an eagle view of your institution", "start": 119.35}, {"end": 122.57, "text": "with powerful", "start": 121.75}, {"end": 123.37, "text": "analytics,", "start": 122.87}, {"end": 127.69, "text": "spot trends, identify gaps, and celebrate success.", "start": 123.99}, {"end": 132.815, "text": "Capturing", "start": 132.315}, {"end": 135.855, "text": "every meaningful experience in one place,", "start": 133.115}, {"end": 141.215, "text": "just scan a student''s NFC card and instantly see their skill snapshot,", "start": 136.235}, {"end": 142.67, "text": "skills acquired,", "start": 141.85}, {"end": 145.87, "text": "experiences gained, and trainings attended,", "start": 143.21}, {"end": 148.43001, "text": "plus industry visits and internship", "start": 146.25}, {"end": 149.95, "text": "learning applications.", "start": 148.97}, {"end": 153.95, "text": "Meet Career AI, a smart guide for every student.", "start": 150.65001}, {"end": 158.49501, "text": "Students can ask questions, explore roles, and discover themselves.", "start": 154.33}, {"end": 163.215, "text": "Career AI suggests skills to build and roles that match their interests.", "start": 158.875}, {"end": 167.215, "text": "It even helps them discover colleges and courses for further education.", "start": 163.515}, {"end": 171.535, "text": "Counselors see a complete picture and guide students more effectively.", "start": 167.675}, {"end": 172.655, "text": "Together,", "start": 172.155}, {"end": 179.51, "text": "they co create a clear road map from today to tomorrow. All of this feeds into the students'' digital skill passport.", "start": 173.09}, {"end": 182.62999, "text": "Students can add external skills, certifications,", "start": 179.89}, {"end": 185.03, "text": "and co curricular achievements.", "start": 183.25}, {"end": 187.11, "text": "It becomes more than a resume.", "start": 185.48999}, {"end": 188.11499, "text": "It''s a", "start": 187.455}, {"end": 189.635, "text": "living, verified story.", "start": 188.415}, {"end": 194.035, "text": "Recruiters can instantly see real, validated potential,", "start": 190.175}, {"end": 198.19499, "text": "empowering skills, bridging talent, track, verify,", "start": 194.575}, {"end": 199.075, "text": "grow.", "start": 198.575}, {"end": 202.245, "text": "Book a demo today at our Didact stall.", "start": 199.425}]}]', NULL, '[{"text": "marks and certificates only tell part of the story", "context": "Highlighting the limitations of traditional educational credentials.", "timestamp": 5}, {"text": "it''s time to connect the dots introducing talent and skills ecosystem", "context": "Introducing a new platform aimed at bridging gaps in talent development.", "timestamp": 19}, {"text": "a rich trusted digital portfolio for schools", "context": "Describing the benefits of the platform for educational institutions.", "timestamp": 64}, {"text": "it becomes more than a resume it''s a living verified story", "context": "Emphasizing the evolution of student profiles into dynamic representations of their skills and experiences.", "timestamp": 184}, {"text": "empowering skills bridging talent track verify grow", "context": "Summarizing the core mission of the platform.", "timestamp": 199}]', '[{"options": ["Track, Verify, Grow", "Learn, Apply, Succeed", "Teach, Assess, Develop", "Plan, Execute, Review"], "question": "What are the three pillars of the talent and skills ecosystem?", "explanation": "The correct answer is ''Track, Verify, Grow'' as these are the foundational components of the talent and skills ecosystem described in the content.", "correctAnswer": 0}, {"options": ["Finding jobs", "Exploring roles and discovering themselves", "Creating resumes", "Networking with recruiters"], "question": "What does the Career AI feature help students with?", "explanation": "Career AI assists students in exploring roles and discovering their interests, making it the correct answer.", "correctAnswer": 1}, {"options": ["By providing a physical classroom space", "Through a sleek Night View dashboard", "By offering online courses", "With traditional grading systems"], "question": "How does the platform help educators manage classrooms?", "explanation": "The platform provides educators with a sleek Night View dashboard to manage classrooms effectively, which is the correct answer.", "correctAnswer": 1}, {"options": ["To serve as a traditional resume", "To track students'' attendance", "To provide a verified story of skills and achievements", "To list academic grades only"], "question": "What is the purpose of the digital skill passport?", "explanation": "The digital skill passport is designed to provide a living, verified story of a student''s skills and achievements, making option 2 the correct answer.", "correctAnswer": 2}, {"options": ["Access to unverified resumes", "Static CVs of students", "Verified skill passports", "Traditional job applications"], "question": "What benefit does the talent and skills ecosystem provide to recruiters?", "explanation": "Recruiters benefit from verified skill passports, which provide real, validated potential of candidates, making option 2 the correct answer.", "correctAnswer": 2}]', '[{"back": "Track, Verify, and Grow.", "front": "What are the three pillars of the talent and skills ecosystem?", "topic": "Talent and Skills Ecosystem"}, {"back": "Tracking every learning moment, including assignments, projects, trainings, industry visits, and internships.", "front": "What does the ''Track'' pillar involve?", "topic": "Talent and Skills Ecosystem"}, {"back": "It includes an approval center where educators and industry mentors validate each achievement.", "front": "How does the ''Verify'' pillar function?", "topic": "Talent and Skills Ecosystem"}, {"back": "It allows students to showcase a living, verified story of their skills, certifications, and achievements.", "front": "What is the purpose of the digital skill passport?", "topic": "Digital Skill Passport"}, {"back": "Career AI acts as a smart guide for students, helping them explore roles, suggest skills, and discover educational opportunities.", "front": "What role does Career AI play in the ecosystem?", "topic": "Career Guidance"}, {"back": "Recruiters gain access to verified skill passports instead of static CVs, allowing them to see real, validated potential.", "front": "What benefits does the platform provide for recruiters?", "topic": "Recruitment"}, {"back": "Educators can manage classrooms, create assignments, evaluate submissions, and access powerful analytics to track student progress.", "front": "How does the platform assist educators?", "topic": "Educator Tools"}, {"back": "It provides a comprehensive view of a student''s skills and experiences, enhancing their employability and career readiness.", "front": "What is the significance of capturing every meaningful experience?", "topic": "Skill Development"}]', '1
00:00:00,080 --> 00:00:05,759
in a world where skills are changing faster than ever marks and certificates only tell

2
00:00:05,759 --> 00:00:12,000
part of the story what about the projects the practice the real experiences where do

3
00:00:12,000 --> 00:00:19,785
we capture everything that truly builds talent schools students and industries often work in silos

4
00:00:19,785 --> 00:00:26,804
it''s time to connect the dots introducing talent and skills ecosystem a platform designed to

5
00:00:26,804 --> 00:00:35,340
truly bridge talent built on three powerful pillars track verify and grow first track every

6
00:00:35,340 --> 00:00:45,375
learning moment assignments projects trainings and more including industry visits and internships next verify skills

7
00:00:45,375 --> 00:00:53,435
with an approval center where educators and industry mentors validate each achievement and finally help

8
00:00:53,435 --> 00:01:04,180
students grow with clear guided paths from classroom learning to confident career choices for students

9
00:01:04,180 --> 00:01:10,900
it''s a rich trusted digital portfolio for schools a structured view of learning and outcomes

10
00:01:10,900 --> 00:01:18,564
for industries access to students who are already work ready and for recruiters verified skill

11
00:01:18,564 --> 00:01:26,745
passports instead of static cvs all connected in one ecosystem live dynamic and always updated

12
00:01:26,745 --> 00:01:43,694
log in as an educator and enjoy a sleek night view dashboard where you can

13
00:01:43,694 --> 00:01:50,015
easily manage classrooms view all your students at a glance create assignments and projects with

14
00:01:50,015 --> 00:01:57,590
just a few clicks evaluate submissions and give meaningful feedback each activity automatically updates the

15
00:01:57,590 --> 00:02:04,810
student''s skill profile get an eagle view of your institution with powerful analytics spot trends

16
00:02:04,810 --> 00:02:17,115
identify gaps and celebrate success capturing every meaningful experience in one place just scan a

17
00:02:17,115 --> 00:02:25,310
student''s nfc card and instantly see their skill snapshot skills acquired experiences gained and trainings

18
00:02:25,310 --> 00:02:33,129
attended plus industry visits and internship learning applications meet career ai a smart guide for

19
00:02:33,129 --> 00:02:40,635
every student students can ask questions explore roles and discover themselves career ai suggests skills

20
00:02:40,635 --> 00:02:45,514
to build and roles that match their interests it even helps them discover colleges and

21
00:02:45,514 --> 00:02:52,655
courses for further education counselors see a complete picture and guide students more effectively together

22
00:02:52,655 --> 00:02:57,250
they co create a clear road map from today to tomorrow all of this feeds

23
00:02:57,250 --> 00:03:04,310
into the students'' digital skill passport students can add external skills certifications and co curricular

24
00:03:04,310 --> 00:03:11,555
achievements it becomes more than a resume it''s a living verified story recruiters can instantly

25
00:03:11,555 --> 00:03:20,644
see real validated potential empowering skills bridging talent track verify grow book a demo today

26
00:03:20,644 --> 00:03:22,245
at our didact stall
', 'WEBVTT

1
00:00:00.080 --> 00:00:05.759
in a world where skills are changing faster than ever marks and certificates only tell

2
00:00:05.759 --> 00:00:12.000
part of the story what about the projects the practice the real experiences where do

3
00:00:12.000 --> 00:00:19.785
we capture everything that truly builds talent schools students and industries often work in silos

4
00:00:19.785 --> 00:00:26.804
it''s time to connect the dots introducing talent and skills ecosystem a platform designed to

5
00:00:26.804 --> 00:00:35.340
truly bridge talent built on three powerful pillars track verify and grow first track every

6
00:00:35.340 --> 00:00:45.375
learning moment assignments projects trainings and more including industry visits and internships next verify skills

7
00:00:45.375 --> 00:00:53.435
with an approval center where educators and industry mentors validate each achievement and finally help

8
00:00:53.435 --> 00:01:04.180
students grow with clear guided paths from classroom learning to confident career choices for students

9
00:01:04.180 --> 00:01:10.900
it''s a rich trusted digital portfolio for schools a structured view of learning and outcomes

10
00:01:10.900 --> 00:01:18.564
for industries access to students who are already work ready and for recruiters verified skill

11
00:01:18.564 --> 00:01:26.745
passports instead of static cvs all connected in one ecosystem live dynamic and always updated

12
00:01:26.745 --> 00:01:43.694
log in as an educator and enjoy a sleek night view dashboard where you can

13
00:01:43.694 --> 00:01:50.015
easily manage classrooms view all your students at a glance create assignments and projects with

14
00:01:50.015 --> 00:01:57.590
just a few clicks evaluate submissions and give meaningful feedback each activity automatically updates the

15
00:01:57.590 --> 00:02:04.810
student''s skill profile get an eagle view of your institution with powerful analytics spot trends

16
00:02:04.810 --> 00:02:17.115
identify gaps and celebrate success capturing every meaningful experience in one place just scan a

17
00:02:17.115 --> 00:02:25.310
student''s nfc card and instantly see their skill snapshot skills acquired experiences gained and trainings

18
00:02:25.310 --> 00:02:33.129
attended plus industry visits and internship learning applications meet career ai a smart guide for

19
00:02:33.129 --> 00:02:40.635
every student students can ask questions explore roles and discover themselves career ai suggests skills

20
00:02:40.635 --> 00:02:45.514
to build and roles that match their interests it even helps them discover colleges and

21
00:02:45.514 --> 00:02:52.655
courses for further education counselors see a complete picture and guide students more effectively together

22
00:02:52.655 --> 00:02:57.250
they co create a clear road map from today to tomorrow all of this feeds

23
00:02:57.250 --> 00:03:04.310
into the students'' digital skill passport students can add external skills certifications and co curricular

24
00:03:04.310 --> 00:03:11.555
achievements it becomes more than a resume it''s a living verified story recruiters can instantly

25
00:03:11.555 --> 00:03:20.644
see real validated potential empowering skills bridging talent track verify grow book a demo today

26
00:03:20.644 --> 00:03:22.245
at our didact stall
'),
	('da6ceae0-8282-464c-a607-88539180d74f', '5317fb02-8b75-4d5c-8fb0-2ce918f4c707', '71a8c1e0-4087-45f1-8f8a-b7bb8978322f', 'https://ad91abcd16cd9e9c569d83d9ef46e398.r2.cloudflarestorage.com/skill-echosystem/courses/71a8c1e0-4087-45f1-8f8a-b7bb8978322f/lessons/5317fb02-8b75-4d5c-8fb0-2ce918f4c707/1764737426823-e07d5c120e4f4f56.mp4?X-Amz-Expires=3600&X-Amz-Date=20251223T073534Z&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=8796c748e9ac5127466f6b914859c42e%2F20251223%2Fauto%2Fs3%2Faws4_request&X-Amz-SignedHeaders=host&X-Amz-Signature=82a394c1f3d70a4d4e6c5aec6847a43d2046e8d3033d717654065455f1b50462', 'uploaded', NULL, '[]', NULL, '[]', '[]', '[]', NULL, 'en', 'failed', 'Transcription failed. Errors: ', '2025-12-23 07:35:39.262679+00', '2025-12-23 07:35:39.362+00', NULL, '{}', '[]', NULL, '[]', '[]', '[]', NULL, NULL),
	('31e433b4-420a-40cd-816d-65b32f1d76f8', '5317fb02-8b75-4d5c-8fb0-2ce918f4c707', '71a8c1e0-4087-45f1-8f8a-b7bb8978322f', 'https://ad91abcd16cd9e9c569d83d9ef46e398.r2.cloudflarestorage.com/skill-echosystem/courses/71a8c1e0-4087-45f1-8f8a-b7bb8978322f/lessons/5317fb02-8b75-4d5c-8fb0-2ce918f4c707/1764737426823-e07d5c120e4f4f56.mp4?X-Amz-Expires=3600&X-Amz-Date=20251223T073534Z&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=8796c748e9ac5127466f6b914859c42e%2F20251223%2Fauto%2Fs3%2Faws4_request&X-Amz-SignedHeaders=host&X-Amz-Signature=82a394c1f3d70a4d4e6c5aec6847a43d2046e8d3033d717654065455f1b50462', 'uploaded', NULL, '[]', NULL, '[]', '[]', '[]', NULL, 'en', 'failed', 'Transcription failed. Errors: ', '2025-12-23 07:37:49.063065+00', '2025-12-23 07:37:49.127+00', NULL, '{}', '[]', NULL, '[]', '[]', '[]', NULL, NULL),
	('5ae56160-b853-40eb-9953-fa78fe05322a', '5317fb02-8b75-4d5c-8fb0-2ce918f4c707', '71a8c1e0-4087-45f1-8f8a-b7bb8978322f', 'https://ad91abcd16cd9e9c569d83d9ef46e398.r2.cloudflarestorage.com/skill-echosystem/courses/71a8c1e0-4087-45f1-8f8a-b7bb8978322f/lessons/5317fb02-8b75-4d5c-8fb0-2ce918f4c707/1764737426823-e07d5c120e4f4f56.mp4?X-Amz-Expires=3600&X-Amz-Date=20251223T073918Z&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=8796c748e9ac5127466f6b914859c42e%2F20251223%2Fauto%2Fs3%2Faws4_request&X-Amz-SignedHeaders=host&X-Amz-Signature=b4442b496b54b35ef8d448bcc7f5734eaa49729df01181ecbf58e7264399dc5e', 'uploaded', NULL, '[]', NULL, '[]', '[]', '[]', NULL, 'en', 'failed', 'Transcription failed. Errors: ', '2025-12-23 07:41:36.549791+00', '2025-12-23 07:41:36.624+00', NULL, '{}', '[]', NULL, '[]', '[]', '[]', NULL, NULL),
	('d8efb890-abfe-4729-ad22-723df4b4d592', '5317fb02-8b75-4d5c-8fb0-2ce918f4c707', '71a8c1e0-4087-45f1-8f8a-b7bb8978322f', 'https://ad91abcd16cd9e9c569d83d9ef46e398.r2.cloudflarestorage.com/skill-echosystem/courses/71a8c1e0-4087-45f1-8f8a-b7bb8978322f/lessons/5317fb02-8b75-4d5c-8fb0-2ce918f4c707/1764737426823-e07d5c120e4f4f56.mp4?X-Amz-Expires=3600&X-Amz-Date=20251223T073918Z&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=8796c748e9ac5127466f6b914859c42e%2F20251223%2Fauto%2Fs3%2Faws4_request&X-Amz-SignedHeaders=host&X-Amz-Signature=b4442b496b54b35ef8d448bcc7f5734eaa49729df01181ecbf58e7264399dc5e', 'uploaded', NULL, '[]', NULL, '[]', '[]', '[]', NULL, 'en', 'failed', 'Transcription failed. Errors: ', '2025-12-23 07:42:47.502816+00', '2025-12-23 07:42:47.576+00', NULL, '{}', '[]', NULL, '[]', '[]', '[]', NULL, NULL),
	('8442929b-d5cc-4c4e-9226-900fc943c132', '5317fb02-8b75-4d5c-8fb0-2ce918f4c707', '71a8c1e0-4087-45f1-8f8a-b7bb8978322f', 'https://skill-echosystem.ad91abcd16cd9e9c569d83d9ef46e398.r2.cloudflarestorage.com/courses/71a8c1e0-4087-45f1-8f8a-b7bb8978322f/lessons/5317fb02-8b75-4d5c-8fb0-2ce918f4c707/1764737426823-e07d5c120e4f4f56.mp4?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=8796c748e9ac5127466f6b914859c42e%2F20251203%2Fauto%2Fs3%2Faws4_request&X-Amz-Date=20251203T045049Z&X-Amz-Expires=604800&X-Amz-Signature=20fad4901079ad62e63048a1416fa3e1c75cc1e3a9361c8c4ea0698c9767c410&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject', 'uploaded', NULL, '[]', NULL, '[]', '[]', '[]', NULL, 'en', 'failed', 'No speech detected in media. This file may contain only music, background noise, or no audio. AI summarization requires spoken content to generate a transcript.', '2025-12-06 07:34:22.335734+00', '2025-12-06 07:34:25.295+00', NULL, '{}', '[]', NULL, '[]', '[]', '[]', NULL, NULL),
	('9250a49d-1281-46d8-a50e-2c83307a2319', '5317fb02-8b75-4d5c-8fb0-2ce918f4c707', '71a8c1e0-4087-45f1-8f8a-b7bb8978322f', 'https://ad91abcd16cd9e9c569d83d9ef46e398.r2.cloudflarestorage.com/skill-echosystem/courses/71a8c1e0-4087-45f1-8f8a-b7bb8978322f/lessons/5317fb02-8b75-4d5c-8fb0-2ce918f4c707/1764737426823-e07d5c120e4f4f56.mp4?X-Amz-Expires=3600&X-Amz-Date=20251223T073918Z&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=8796c748e9ac5127466f6b914859c42e%2F20251223%2Fauto%2Fs3%2Faws4_request&X-Amz-SignedHeaders=host&X-Amz-Signature=b4442b496b54b35ef8d448bcc7f5734eaa49729df01181ecbf58e7264399dc5e', 'uploaded', NULL, '[]', NULL, '[]', '[]', '[]', NULL, 'en', 'failed', 'Transcription failed. Errors: ', '2025-12-23 07:39:22.453429+00', '2025-12-23 07:39:22.522+00', NULL, '{}', '[]', NULL, '[]', '[]', '[]', NULL, NULL),
	('0c29e6b9-28c4-4ec4-a779-c6fd3a980508', '5317fb02-8b75-4d5c-8fb0-2ce918f4c707', '71a8c1e0-4087-45f1-8f8a-b7bb8978322f', 'https://ad91abcd16cd9e9c569d83d9ef46e398.r2.cloudflarestorage.com/skill-echosystem/courses/71a8c1e0-4087-45f1-8f8a-b7bb8978322f/lessons/5317fb02-8b75-4d5c-8fb0-2ce918f4c707/1764737426823-e07d5c120e4f4f56.mp4?X-Amz-Expires=3600&X-Amz-Date=20251223T073918Z&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=8796c748e9ac5127466f6b914859c42e%2F20251223%2Fauto%2Fs3%2Faws4_request&X-Amz-SignedHeaders=host&X-Amz-Signature=b4442b496b54b35ef8d448bcc7f5734eaa49729df01181ecbf58e7264399dc5e', 'uploaded', NULL, '[]', NULL, '[]', '[]', '[]', NULL, 'en', 'failed', 'Transcription failed. Errors: ', '2025-12-23 07:41:50.509185+00', '2025-12-23 07:41:50.58+00', NULL, '{}', '[]', NULL, '[]', '[]', '[]', NULL, NULL),
	('f95a137d-75cd-4a07-83c2-c2a7da67c408', '5317fb02-8b75-4d5c-8fb0-2ce918f4c707', '71a8c1e0-4087-45f1-8f8a-b7bb8978322f', 'https://ad91abcd16cd9e9c569d83d9ef46e398.r2.cloudflarestorage.com/skill-echosystem/courses/71a8c1e0-4087-45f1-8f8a-b7bb8978322f/lessons/5317fb02-8b75-4d5c-8fb0-2ce918f4c707/1764737426823-e07d5c120e4f4f56.mp4?X-Amz-Expires=3600&X-Amz-Date=20251223T073918Z&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=8796c748e9ac5127466f6b914859c42e%2F20251223%2Fauto%2Fs3%2Faws4_request&X-Amz-SignedHeaders=host&X-Amz-Signature=b4442b496b54b35ef8d448bcc7f5734eaa49729df01181ecbf58e7264399dc5e', 'uploaded', NULL, '[]', NULL, '[]', '[]', '[]', NULL, 'en', 'failed', 'Transcription failed. Errors: ', '2025-12-23 07:43:13.453771+00', '2025-12-23 07:43:13.525+00', NULL, '{}', '[]', NULL, '[]', '[]', '[]', NULL, NULL),
	('e2317215-51c3-4f64-bdb0-e0c89f3bcf32', '8f9e930f-7cb7-4c75-95a0-ee37652b08fc', '71a8c1e0-4087-45f1-8f8a-b7bb8978322f', 'https://skill-echosystem.ad91abcd16cd9e9c569d83d9ef46e398.r2.cloudflarestorage.com/courses/71a8c1e0-4087-45f1-8f8a-b7bb8978322f/lessons/8f9e930f-7cb7-4c75-95a0-ee37652b08fc/1764912705921-4f2c0ee31f0b1a28.mp4?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=8796c748e9ac5127466f6b914859c42e%2F20251220%2Fauto%2Fs3%2Faws4_request&X-Amz-Date=20251220T070847Z&X-Amz-Expires=604800&X-Amz-Signature=c6692c64717404d1d8c762880680eedb38ce11dcf2a30c56efdcd427e40eeca1&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject', 'uploaded', 'In a world where skills are changing faster than ever, marks and certificates only tell part of the story. What about the projects, the practice, the real experiences? Where do we capture everything that truly builds talent? Schools, students, and industries often work in silos. It''s time to connect the dots. Introducing talent and skills ecosystem, a platform designed to truly bridge talent, built on three powerful pillars, track, verify, and grow. First, track every learning moment, assignments, projects, trainings, and more, including industry visits and internships. Next, verify skills with an approval center where educators and industry mentors validate each achievement. And finally, help students grow with clear, guided paths from classroom learning to confident career choices. For students, it''s a rich, trusted digital portfolio. For schools, a structured view of learning and outcomes. For industries, access to students who are already work ready. And for recruiters, verified skill passports instead of static CVs, all connected in one ecosystem, live, dynamic, and always updated. Log in as an educator and enjoy a sleek Night View dashboard, where you can easily manage classrooms. View all your students at a glance. Create assignments and projects with just a few clicks. Evaluate submissions and give meaningful feedback. Each activity automatically updates the student''s skill profile. Get an eagle view of your institution with powerful analytics, spot trends, identify gaps, and celebrate success. Capturing every meaningful experience in one place, just scan a student''s NFC card and instantly see their skill snapshot, skills acquired, experiences gained, and trainings attended, plus industry visits and internship learning applications. Meet Career AI, a smart guide for every student. Students can ask questions, explore roles, and discover themselves. Career AI suggests skills to build and roles that match their interests. It even helps them discover colleges and courses for further education. Counselors see a complete picture and guide students more effectively. Together, they co create a clear road map from today to tomorrow. All of this feeds into the students'' digital skill passport. Students can add external skills, certifications, and co curricular achievements. It becomes more than a resume. It''s a living, verified story. Recruiters can instantly see real, validated potential, empowering skills, bridging talent, track, verify, grow. Book a demo today at our Didact stall.', '[{"end": 5.7599998, "text": "in a world where skills are changing faster than ever marks and certificates only tell", "start": 0.08, "speaker": 0}, {"end": 12, "text": "part of the story what about the projects the practice the real experiences where do", "start": 5.7599998, "speaker": 0}, {"end": 19.785, "text": "we capture everything that truly builds talent schools students and industries often work in silos", "start": 12, "speaker": 0}, {"end": 26.805, "text": "it''s time to connect the dots introducing talent and skills ecosystem a platform designed to", "start": 19.785, "speaker": 0}, {"end": 35.34, "text": "truly bridge talent built on three powerful pillars track verify and grow first track every", "start": 26.805, "speaker": 0}, {"end": 45.375, "text": "learning moment assignments projects trainings and more including industry visits and internships next verify skills", "start": 35.34, "speaker": 0}, {"end": 53.435, "text": "with an approval center where educators and industry mentors validate each achievement and finally help", "start": 45.375, "speaker": 0}, {"end": 64.18, "text": "students grow with clear guided paths from classroom learning to confident career choices for students", "start": 53.435, "speaker": 0}, {"end": 70.9, "text": "it''s a rich trusted digital portfolio for schools a structured view of learning and outcomes", "start": 64.18, "speaker": 0}, {"end": 78.565, "text": "for industries access to students who are already work ready and for recruiters verified skill", "start": 70.9, "speaker": 0}, {"end": 86.745, "text": "passports instead of static cvs all connected in one ecosystem live dynamic and always updated", "start": 78.565, "speaker": 0}, {"end": 103.695, "text": "log in as an educator and enjoy a sleek night view dashboard where you can", "start": 86.745, "speaker": 0}, {"end": 110.015, "text": "easily manage classrooms view all your students at a glance create assignments and projects with", "start": 103.695, "speaker": 0}, {"end": 117.590004, "text": "just a few clicks evaluate submissions and give meaningful feedback each activity automatically updates the", "start": 110.015, "speaker": 0}, {"end": 124.81, "text": "student''s skill profile get an eagle view of your institution with powerful analytics spot trends", "start": 117.590004, "speaker": 0}, {"end": 137.115, "text": "identify gaps and celebrate success capturing every meaningful experience in one place just scan a", "start": 124.81, "speaker": 0}, {"end": 145.31, "text": "student''s nfc card and instantly see their skill snapshot skills acquired experiences gained and trainings", "start": 137.115, "speaker": 0}, {"end": 153.13, "text": "attended plus industry visits and internship learning applications meet career ai a smart guide for", "start": 145.31, "speaker": 0}, {"end": 160.63501, "text": "every student students can ask questions explore roles and discover themselves career ai suggests skills", "start": 153.13, "speaker": 0}, {"end": 165.515, "text": "to build and roles that match their interests it even helps them discover colleges and", "start": 160.63501, "speaker": 0}, {"end": 172.655, "text": "courses for further education counselors see a complete picture and guide students more effectively together", "start": 165.515, "speaker": 0}, {"end": 177.25, "text": "they co create a clear road map from today to tomorrow all of this feeds", "start": 172.655, "speaker": 0}, {"end": 184.31, "text": "into the students'' digital skill passport students can add external skills certifications and co curricular", "start": 177.25, "speaker": 0}, {"end": 191.555, "text": "achievements it becomes more than a resume it''s a living verified story recruiters can instantly", "start": 184.31, "speaker": 0}, {"end": 200.64499, "text": "see real validated potential empowering skills bridging talent track verify grow book a demo today", "start": 191.555, "speaker": 0}, {"end": 202.245, "text": "at our didact stall", "start": 200.64499, "speaker": 0}]', '', '[]', '[]', '[]', 210, 'en', 'completed', NULL, '2025-12-20 07:09:17.158968+00', '2025-12-20 07:09:44.803+00', '2025-12-20 07:09:44.803+00', '{"overall": "positive", "segments": [{"text": "In a world where skills are changing faster than ever, marks and certificates only tell part of the story. What about the projects, the practice, the real experiences? Where do we capture everything that truly builds talent? Schools, students, and industries often work in silos. It''s time to connect the dots.", "score": 0.05355498194694519, "endWord": 50, "sentiment": "neutral", "startWord": 0}, {"text": "Introducing talent and skills ecosystem, a platform designed to truly bridge talent, built on three powerful pillars, track, verify, and grow.", "score": 0.47230589389801025, "endWord": 71, "sentiment": "positive", "startWord": 51}, {"text": "First, track every learning moment, assignments, projects, trainings, and more, including industry visits and internships. Next, verify skills with an approval center where educators and industry mentors validate each achievement.", "score": 0.2528747320175171, "endWord": 101, "sentiment": "neutral", "startWord": 72}, {"text": "And finally, help students grow with clear, guided paths from classroom learning to confident career choices. For students, it''s a rich, trusted digital portfolio. For schools, a structured view of learning and outcomes. For industries, access to students who are already work ready. And for recruiters, verified skill passports instead of static CVs, all connected in one ecosystem, live, dynamic, and always updated. Log in as an educator and enjoy a sleek Night View dashboard, where you can easily manage classrooms. View all your students at a glance. Create assignments and projects with just a few clicks. Evaluate submissions and give meaningful feedback. Each activity automatically updates the student''s skill profile. Get an eagle view of your institution with powerful analytics, spot trends, identify gaps, and celebrate success. Capturing every meaningful experience in one place, just scan a student''s NFC card and instantly see their skill snapshot, skills acquired, experiences gained, and trainings attended, plus industry visits and internship learning applications. Meet Career AI, a smart guide for every student. Students can ask questions, explore roles, and discover themselves. Career AI suggests skills to build and roles that match their interests. It even helps them discover colleges and courses for further education. Counselors see a complete picture and guide students more effectively. Together, they co create a clear road map from today to tomorrow. All of this feeds into the students'' digital skill passport. Students can add external skills, certifications, and co curricular achievements. It becomes more than a resume. It''s a living, verified story. Recruiters can instantly see real, validated potential, empowering skills, bridging talent, track, verify, grow. Book a demo today at our Didact stall.", "score": 0.5227126261817849, "endWord": 378, "sentiment": "positive", "startWord": 102}], "overallScore": 0.43750958789810823}', '[{"id": 0, "utterances": [{"end": 4.58, "text": "In a world where skills are changing faster than ever, marks and certificates", "start": 0.08}, {"end": 6.8199997, "text": "only tell part of the story.", "start": 5.12}, {"end": 8.42, "text": "What about the projects,", "start": 7.2}, {"end": 9.46, "text": "the practice,", "start": 8.72}, {"end": 10.9, "text": "the real experiences?", "start": 9.76}, {"end": 14.985, "text": "Where do we capture everything that truly builds", "start": 11.679999}, {"end": 16.345, "text": "talent? Schools,", "start": 15.525}, {"end": 22.185, "text": "students, and industries often work in silos. It''s time to connect the dots.", "start": 16.885}, {"end": 24.985, "text": "Introducing talent and skills ecosystem,", "start": 22.645}, {"end": 28.185, "text": "a platform designed to truly bridge talent,", "start": 25.445}, {"end": 30.06, "text": "built on three powerful pillars,", "start": 28.564999}, {"end": 33.04, "text": "track, verify, and grow.", "start": 31.099998}, {"end": 34.64, "text": "First, track", "start": 33.42}, {"end": 36.239998, "text": "every learning moment,", "start": 35.02}, {"end": 37.2, "text": "assignments,", "start": 36.7}, {"end": 38.079998, "text": "projects,", "start": 37.579998}, {"end": 42.559998, "text": "trainings, and more, including industry visits and internships.", "start": 38.54}, {"end": 43.755, "text": "Next,", "start": 43.34}, {"end": 46.495003, "text": "verify skills with an approval", "start": 44.315002}, {"end": 47.935, "text": "center where educators", "start": 47.035}, {"end": 49.775, "text": "and industry mentors", "start": 48.395}, {"end": 51.535, "text": "validate each achievement.", "start": 50.235}, {"end": 59.94, "text": "And finally, help students grow with clear, guided paths from classroom learning to confident career choices.", "start": 52.155}, {"end": 66.979996, "text": "For students, it''s a rich, trusted digital portfolio.", "start": 63.28}, {"end": 70.9, "text": "For schools, a structured view of learning and outcomes.", "start": 67.52}, {"end": 72.105, "text": "For industries,", "start": 71.365005}, {"end": 76.905, "text": "access to students who are already work ready. And for recruiters,", "start": 72.645004}, {"end": 82.905, "text": "verified skill passports instead of static CVs, all connected in one ecosystem,", "start": 77.365005}, {"end": 86.745, "text": "live, dynamic, and always updated.", "start": 83.685}, {"end": 102.62, "text": "Log in as an educator and enjoy a sleek Night View dashboard,", "start": 98.12}, {"end": 105.075, "text": "where you can easily manage classrooms.", "start": 103.215004}, {"end": 107.795, "text": "View all your students at a glance.", "start": 105.775}, {"end": 111.075, "text": "Create assignments and projects with just a few clicks.", "start": 108.175}, {"end": 114.355, "text": "Evaluate submissions and give meaningful feedback.", "start": 111.535}, {"end": 116.435, "text": "Each activity automatically", "start": 114.815}, {"end": 118.97, "text": "updates the student''s skill profile.", "start": 117.03}, {"end": 121.37, "text": "Get an eagle view of your institution", "start": 119.35}, {"end": 122.57, "text": "with powerful", "start": 121.75}, {"end": 123.37, "text": "analytics,", "start": 122.87}, {"end": 127.61, "text": "spot trends, identify gaps, and celebrate success.", "start": 123.99}, {"end": 132.815, "text": "Capturing", "start": 132.315}, {"end": 135.855, "text": "every meaningful experience in one place,", "start": 133.115}, {"end": 141.215, "text": "just scan a student''s NFC card and instantly see their skill snapshot,", "start": 136.235}, {"end": 142.67, "text": "skills acquired,", "start": 141.85}, {"end": 145.87, "text": "experiences gained, and trainings attended,", "start": 143.21}, {"end": 148.43001, "text": "plus industry visits and internship", "start": 146.25}, {"end": 149.95, "text": "learning applications.", "start": 148.97}, {"end": 153.95, "text": "Meet Career AI, a smart guide for every student.", "start": 150.65001}, {"end": 158.49501, "text": "Students can ask questions, explore roles, and discover themselves.", "start": 154.33}, {"end": 163.215, "text": "Career AI suggests skills to build and roles that match their interests.", "start": 158.875}, {"end": 167.215, "text": "It even helps them discover colleges and courses for further education.", "start": 163.515}, {"end": 171.535, "text": "Counselors see a complete picture and guide students more effectively.", "start": 167.675}, {"end": 172.655, "text": "Together,", "start": 172.155}, {"end": 179.51, "text": "they co create a clear road map from today to tomorrow. All of this feeds into the students'' digital skill passport.", "start": 173.09}, {"end": 182.62999, "text": "Students can add external skills, certifications,", "start": 179.89}, {"end": 185.03, "text": "and co curricular achievements.", "start": 183.25}, {"end": 187.11, "text": "It becomes more than a resume.", "start": 185.48999}, {"end": 188.11499, "text": "It''s a", "start": 187.455}, {"end": 189.635, "text": "living, verified story.", "start": 188.415}, {"end": 194.035, "text": "Recruiters can instantly see real, validated potential,", "start": 190.175}, {"end": 198.19499, "text": "empowering skills, bridging talent, track, verify,", "start": 194.575}, {"end": 199.075, "text": "grow.", "start": 198.575}, {"end": 202.245, "text": "Book a demo today at our Didact stall.", "start": 199.425}]}]', NULL, '[]', '[]', '[]', '1
00:00:00,080 --> 00:00:05,759
in a world where skills are changing faster than ever marks and certificates only tell

2
00:00:05,759 --> 00:00:12,000
part of the story what about the projects the practice the real experiences where do

3
00:00:12,000 --> 00:00:19,785
we capture everything that truly builds talent schools students and industries often work in silos

4
00:00:19,785 --> 00:00:26,804
it''s time to connect the dots introducing talent and skills ecosystem a platform designed to

5
00:00:26,804 --> 00:00:35,340
truly bridge talent built on three powerful pillars track verify and grow first track every

6
00:00:35,340 --> 00:00:45,375
learning moment assignments projects trainings and more including industry visits and internships next verify skills

7
00:00:45,375 --> 00:00:53,435
with an approval center where educators and industry mentors validate each achievement and finally help

8
00:00:53,435 --> 00:01:04,180
students grow with clear guided paths from classroom learning to confident career choices for students

9
00:01:04,180 --> 00:01:10,900
it''s a rich trusted digital portfolio for schools a structured view of learning and outcomes

10
00:01:10,900 --> 00:01:18,564
for industries access to students who are already work ready and for recruiters verified skill

11
00:01:18,564 --> 00:01:26,745
passports instead of static cvs all connected in one ecosystem live dynamic and always updated

12
00:01:26,745 --> 00:01:43,694
log in as an educator and enjoy a sleek night view dashboard where you can

13
00:01:43,694 --> 00:01:50,015
easily manage classrooms view all your students at a glance create assignments and projects with

14
00:01:50,015 --> 00:01:57,590
just a few clicks evaluate submissions and give meaningful feedback each activity automatically updates the

15
00:01:57,590 --> 00:02:04,810
student''s skill profile get an eagle view of your institution with powerful analytics spot trends

16
00:02:04,810 --> 00:02:17,115
identify gaps and celebrate success capturing every meaningful experience in one place just scan a

17
00:02:17,115 --> 00:02:25,310
student''s nfc card and instantly see their skill snapshot skills acquired experiences gained and trainings

18
00:02:25,310 --> 00:02:33,129
attended plus industry visits and internship learning applications meet career ai a smart guide for

19
00:02:33,129 --> 00:02:40,635
every student students can ask questions explore roles and discover themselves career ai suggests skills

20
00:02:40,635 --> 00:02:45,514
to build and roles that match their interests it even helps them discover colleges and

21
00:02:45,514 --> 00:02:52,655
courses for further education counselors see a complete picture and guide students more effectively together

22
00:02:52,655 --> 00:02:57,250
they co create a clear road map from today to tomorrow all of this feeds

23
00:02:57,250 --> 00:03:04,310
into the students'' digital skill passport students can add external skills certifications and co curricular

24
00:03:04,310 --> 00:03:11,555
achievements it becomes more than a resume it''s a living verified story recruiters can instantly

25
00:03:11,555 --> 00:03:20,644
see real validated potential empowering skills bridging talent track verify grow book a demo today

26
00:03:20,644 --> 00:03:22,245
at our didact stall
', 'WEBVTT

1
00:00:00.080 --> 00:00:05.759
in a world where skills are changing faster than ever marks and certificates only tell

2
00:00:05.759 --> 00:00:12.000
part of the story what about the projects the practice the real experiences where do

3
00:00:12.000 --> 00:00:19.785
we capture everything that truly builds talent schools students and industries often work in silos

4
00:00:19.785 --> 00:00:26.804
it''s time to connect the dots introducing talent and skills ecosystem a platform designed to

5
00:00:26.804 --> 00:00:35.340
truly bridge talent built on three powerful pillars track verify and grow first track every

6
00:00:35.340 --> 00:00:45.375
learning moment assignments projects trainings and more including industry visits and internships next verify skills

7
00:00:45.375 --> 00:00:53.435
with an approval center where educators and industry mentors validate each achievement and finally help

8
00:00:53.435 --> 00:01:04.180
students grow with clear guided paths from classroom learning to confident career choices for students

9
00:01:04.180 --> 00:01:10.900
it''s a rich trusted digital portfolio for schools a structured view of learning and outcomes

10
00:01:10.900 --> 00:01:18.564
for industries access to students who are already work ready and for recruiters verified skill

11
00:01:18.564 --> 00:01:26.745
passports instead of static cvs all connected in one ecosystem live dynamic and always updated

12
00:01:26.745 --> 00:01:43.694
log in as an educator and enjoy a sleek night view dashboard where you can

13
00:01:43.694 --> 00:01:50.015
easily manage classrooms view all your students at a glance create assignments and projects with

14
00:01:50.015 --> 00:01:57.590
just a few clicks evaluate submissions and give meaningful feedback each activity automatically updates the

15
00:01:57.590 --> 00:02:04.810
student''s skill profile get an eagle view of your institution with powerful analytics spot trends

16
00:02:04.810 --> 00:02:17.115
identify gaps and celebrate success capturing every meaningful experience in one place just scan a

17
00:02:17.115 --> 00:02:25.310
student''s nfc card and instantly see their skill snapshot skills acquired experiences gained and trainings

18
00:02:25.310 --> 00:02:33.129
attended plus industry visits and internship learning applications meet career ai a smart guide for

19
00:02:33.129 --> 00:02:40.635
every student students can ask questions explore roles and discover themselves career ai suggests skills

20
00:02:40.635 --> 00:02:45.514
to build and roles that match their interests it even helps them discover colleges and

21
00:02:45.514 --> 00:02:52.655
courses for further education counselors see a complete picture and guide students more effectively together

22
00:02:52.655 --> 00:02:57.250
they co create a clear road map from today to tomorrow all of this feeds

23
00:02:57.250 --> 00:03:04.310
into the students'' digital skill passport students can add external skills certifications and co curricular

24
00:03:04.310 --> 00:03:11.555
achievements it becomes more than a resume it''s a living verified story recruiters can instantly

25
00:03:11.555 --> 00:03:20.644
see real validated potential empowering skills bridging talent track verify grow book a demo today

26
00:03:20.644 --> 00:03:22.245
at our didact stall
'),
	('91bc93b4-569b-43e5-b9a1-24efbf6a3189', '5317fb02-8b75-4d5c-8fb0-2ce918f4c707', '71a8c1e0-4087-45f1-8f8a-b7bb8978322f', 'https://ad91abcd16cd9e9c569d83d9ef46e398.r2.cloudflarestorage.com/skill-echosystem/courses/71a8c1e0-4087-45f1-8f8a-b7bb8978322f/lessons/5317fb02-8b75-4d5c-8fb0-2ce918f4c707/1764737426823-e07d5c120e4f4f56.mp4?X-Amz-Expires=3600&X-Amz-Date=20251223T073918Z&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=8796c748e9ac5127466f6b914859c42e%2F20251223%2Fauto%2Fs3%2Faws4_request&X-Amz-SignedHeaders=host&X-Amz-Signature=b4442b496b54b35ef8d448bcc7f5734eaa49729df01181ecbf58e7264399dc5e', 'uploaded', NULL, '[]', NULL, '[]', '[]', '[]', NULL, 'en', 'failed', 'Transcription failed. Errors: ', '2025-12-23 07:41:24.016084+00', '2025-12-23 07:41:24.089+00', NULL, '{}', '[]', NULL, '[]', '[]', '[]', NULL, NULL),
	('9ac05e89-fd06-4547-a169-51606394aec8', '5317fb02-8b75-4d5c-8fb0-2ce918f4c707', '71a8c1e0-4087-45f1-8f8a-b7bb8978322f', 'https://ad91abcd16cd9e9c569d83d9ef46e398.r2.cloudflarestorage.com/skill-echosystem/courses/71a8c1e0-4087-45f1-8f8a-b7bb8978322f/lessons/5317fb02-8b75-4d5c-8fb0-2ce918f4c707/1764737426823-e07d5c120e4f4f56.mp4?X-Amz-Expires=3600&X-Amz-Date=20251223T073918Z&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=8796c748e9ac5127466f6b914859c42e%2F20251223%2Fauto%2Fs3%2Faws4_request&X-Amz-SignedHeaders=host&X-Amz-Signature=b4442b496b54b35ef8d448bcc7f5734eaa49729df01181ecbf58e7264399dc5e', 'uploaded', NULL, '[]', NULL, '[]', '[]', '[]', NULL, 'en', 'failed', 'Transcription failed. Errors: ', '2025-12-23 07:42:00.509337+00', '2025-12-23 07:42:00.579+00', NULL, '{}', '[]', NULL, '[]', '[]', '[]', NULL, NULL);


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: auth; Owner: supabase_auth_admin
--

SELECT pg_catalog.setval('"auth"."refresh_tokens_id_seq"', 8990, true);


--
-- Name: export_activities_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."export_activities_id_seq"', 36, true);


--
-- Name: interview_reminders_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."interview_reminders_id_seq"', 4, true);


--
-- Name: messages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."messages_id_seq"', 688, true);


--
-- Name: pipeline_activities_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."pipeline_activities_id_seq"', 31, true);


--
-- Name: search_history_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."search_history_id_seq"', 6, true);


--
-- Name: shortlist_candidates_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."shortlist_candidates_id_seq"', 58, true);


--
-- Name: student_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."student_id_seq"', 1093, true);


--
-- PostgreSQL database dump complete
--

-- \unrestrict wXC3zDVw9heTfCWfOmi2hLYIKXMGkIFyykgkgWPlYFZ90Xj8yWFCDwB1hKgN4eJ

RESET ALL;

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
-- Data for Name: personal_assessment_streams; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."personal_assessment_streams" ("id", "label", "description", "is_active", "created_at", "name", "grade_level", "display_order", "updated_at") VALUES
	('science', 'Science', 'Science stream for After 12 students', true, '2025-12-30 08:19:07.918161+00', 'Science', 'after12', 10, '2025-12-30 08:19:07.918161+00'),
	('commerce', 'Commerce', 'Commerce stream for After 12 students', true, '2025-12-30 08:19:07.918161+00', 'Commerce', 'after12', 11, '2025-12-30 08:19:07.918161+00'),
	('btech_cse', 'B.Tech CSE', 'Computer Science & Engineering', true, '2026-01-06 04:22:56.842797+00', 'B.Tech Computer Science', 'college', 0, '2026-01-06 04:22:56.842797+00'),
	('btech_it', 'B.Tech IT', 'Information Technology', true, '2026-01-06 04:22:56.842797+00', 'B.Tech Information Technology', 'college', 0, '2026-01-06 04:22:56.842797+00'),
	('btech_ece', 'B.Tech ECE', 'Electronics & Communication Engineering', true, '2026-01-06 04:22:56.842797+00', 'B.Tech Electronics & Communication', 'college', 0, '2026-01-06 04:22:56.842797+00'),
	('btech_eee', 'B.Tech EEE', 'Electrical & Electronics Engineering', true, '2026-01-06 04:22:56.842797+00', 'B.Tech Electrical & Electronics', 'college', 0, '2026-01-06 04:22:56.842797+00'),
	('btech_mech', 'B.Tech Mechanical', 'Mechanical Engineering', true, '2026-01-06 04:22:56.842797+00', 'B.Tech Mechanical', 'college', 0, '2026-01-06 04:22:56.842797+00'),
	('btech_civil', 'B.Tech Civil', 'Civil Engineering', true, '2026-01-06 04:22:56.842797+00', 'B.Tech Civil', 'college', 0, '2026-01-06 04:22:56.842797+00'),
	('btech_aiml', 'B.Tech AI/ML', 'Artificial Intelligence & Machine Learning', true, '2026-01-06 04:22:56.842797+00', 'B.Tech AI & ML', 'college', 0, '2026-01-06 04:22:56.842797+00'),
	('btech_ds', 'B.Tech Data Science', 'Data Science', true, '2026-01-06 04:22:56.842797+00', 'B.Tech Data Science', 'college', 0, '2026-01-06 04:22:56.842797+00'),
	('btech_biotech', 'B.Tech Biotech', 'Biotechnology', true, '2026-01-06 04:22:56.842797+00', 'B.Tech Biotechnology', 'college', 0, '2026-01-06 04:22:56.842797+00'),
	('btech_chem', 'B.Tech Chemical', 'Chemical Engineering', true, '2026-01-06 04:22:56.842797+00', 'B.Tech Chemical', 'college', 0, '2026-01-06 04:22:56.842797+00'),
	('bsc_physics', 'B.Sc Physics', 'Physics', true, '2026-01-06 04:22:56.842797+00', 'B.Sc Physics', 'college', 0, '2026-01-06 04:22:56.842797+00'),
	('bsc_chemistry', 'B.Sc Chemistry', 'Chemistry', true, '2026-01-06 04:22:56.842797+00', 'B.Sc Chemistry', 'college', 0, '2026-01-06 04:22:56.842797+00'),
	('bsc_maths', 'B.Sc Mathematics', 'Mathematics', true, '2026-01-06 04:22:56.842797+00', 'B.Sc Mathematics', 'college', 0, '2026-01-06 04:22:56.842797+00'),
	('bsc_cs', 'B.Sc CS', 'Computer Science', true, '2026-01-06 04:22:56.842797+00', 'B.Sc Computer Science', 'college', 0, '2026-01-06 04:22:56.842797+00'),
	('bsc_biology', 'B.Sc Biology', 'Biology', true, '2026-01-06 04:22:56.842797+00', 'B.Sc Biology', 'college', 0, '2026-01-06 04:22:56.842797+00'),
	('bsc_biotech', 'B.Sc Biotech', 'Biotechnology', true, '2026-01-06 04:22:56.842797+00', 'B.Sc Biotechnology', 'college', 0, '2026-01-06 04:22:56.842797+00'),
	('bsc_agri', 'B.Sc Agriculture', 'Agriculture', true, '2026-01-06 04:22:56.842797+00', 'B.Sc Agriculture', 'college', 0, '2026-01-06 04:22:56.842797+00'),
	('bba_marketing', 'BBA Marketing', 'Marketing', true, '2026-01-06 04:22:56.842797+00', 'BBA Marketing', 'college', 0, '2026-01-06 04:22:56.842797+00'),
	('bba_finance', 'BBA Finance', 'Finance', true, '2026-01-06 04:22:56.842797+00', 'BBA Finance', 'college', 0, '2026-01-06 04:22:56.842797+00'),
	('bba_hr', 'BBA HR', 'Human Resources', true, '2026-01-06 04:22:56.842797+00', 'BBA Human Resources', 'college', 0, '2026-01-06 04:22:56.842797+00'),
	('bba_intl', 'BBA Intl Business', 'International Business', true, '2026-01-06 04:22:56.842797+00', 'BBA International Business', 'college', 0, '2026-01-06 04:22:56.842797+00'),
	('bca_ds', 'BCA Data Science', 'Data Science', true, '2026-01-06 04:22:56.842797+00', 'BCA Data Science', 'college', 0, '2026-01-06 04:22:56.842797+00'),
	('bca_cloud', 'BCA Cloud', 'Cloud Computing', true, '2026-01-06 04:22:56.842797+00', 'BCA Cloud Computing', 'college', 0, '2026-01-06 04:22:56.842797+00'),
	('bcom_accounts', 'B.Com Accounting', 'Accounting', true, '2026-01-06 04:22:56.842797+00', 'B.Com Accounting', 'college', 0, '2026-01-06 04:22:56.842797+00'),
	('bcom_banking', 'B.Com Banking', 'Banking & Finance', true, '2026-01-06 04:22:56.842797+00', 'B.Com Banking & Finance', 'college', 0, '2026-01-06 04:22:56.842797+00'),
	('bcom_tax', 'B.Com Taxation', 'Taxation', true, '2026-01-06 04:22:56.842797+00', 'B.Com Taxation', 'college', 0, '2026-01-06 04:22:56.842797+00'),
	('bpharma', 'B.Pharma', 'Pharmacy', true, '2026-01-06 04:22:56.842797+00', 'B.Pharma', 'college', 0, '2026-01-06 04:22:56.842797+00'),
	('ba_polsci', 'BA Political Science', 'Political Science', true, '2026-01-06 04:22:56.842797+00', 'BA Political Science', 'college', 0, '2026-01-06 04:22:56.842797+00'),
	('bdes', 'B.Des', 'Design', true, '2026-01-06 04:22:56.842797+00', 'B.Des Design', 'college', 0, '2026-01-06 04:22:56.842797+00'),
	('bdes_fashion', 'B.Des Fashion', 'Fashion Design', true, '2026-01-06 04:22:56.842797+00', 'B.Des Fashion Design', 'college', 0, '2026-01-06 04:22:56.842797+00'),
	('bdes_interior', 'B.Des Interior', 'Interior Design', true, '2026-01-06 04:22:56.842797+00', 'B.Des Interior Design', 'college', 0, '2026-01-06 04:22:56.842797+00'),
	('bdes_graphic', 'B.Des Graphic', 'Graphic Design', true, '2026-01-06 04:22:56.842797+00', 'B.Des Graphic Design', 'college', 0, '2026-01-06 04:22:56.842797+00'),
	('middle_school', 'Middle School', 'Assessment for middle school students', true, '2025-12-09 10:24:27.341532+00', 'Grades 6-8 (Middle School)', 'middle', 1, '2025-12-09 10:24:27.341532+00'),
	('high_school', 'High School', 'Assessment for high school students', true, '2025-12-09 10:24:27.341532+00', 'Grades 9-12 (High School)', 'highschool', 2, '2025-12-09 10:24:27.341532+00'),
	('higher_secondary', 'Higher Secondary', 'Assessment for higher secondary students', true, '2026-01-09 06:17:00.887624+00', 'Grades 11-12 (Higher Secondary)', 'higher_secondary', 3, '2026-01-09 06:17:00.887624+00'),
	('after10', 'After 10th', 'Assessment for students after 10th grade', true, '2026-01-09 06:17:00.887624+00', 'After 10th Grade', 'after10', 4, '2026-01-09 06:17:00.887624+00'),
	('after12', 'After 12th', 'Assessment for students after 12th grade', true, '2026-01-09 06:17:00.887624+00', 'After 12th Grade', 'after12', 5, '2026-01-09 06:17:00.887624+00'),
	('college', 'College', 'Assessment for college students', true, '2026-01-06 04:22:56.842797+00', 'College Students', 'college', 6, '2026-01-06 04:22:56.842797+00'),
	('arts_humanities', 'Arts & Humanities', 'Arts stream - Literature, History, Political Science, Languages', true, '2026-01-12 05:26:57.656336+00', 'Arts & Humanities', 'after10', 12, '2026-01-12 05:26:57.656336+00'),
	('general', 'General Assessment', 'General aptitude assessment for After 10th students - stream recommendation will be provided by AI analysis', true, '2026-01-12 08:10:14.50044+00', 'General Assessment', 'after10', 1, '2026-01-12 08:10:14.50044+00'),
	('science_pcmb', 'Science (PCMB)', 'Physics, Chemistry, Maths, Biology - For Medical & Engineering', true, '2026-01-06 05:46:54.909884+00', 'Science PCMB', 'higher_secondary', 1, '2026-01-22 10:54:15.074543+00'),
	('science_pcms', 'Science (PCMS)', 'Physics, Chemistry, Maths, Computer Science - For Engineering/IT', true, '2026-01-06 05:46:54.909884+00', 'Science PCMS', 'higher_secondary', 2, '2026-01-22 10:54:15.074543+00'),
	('science_pcm', 'Science (PCM)', 'Physics, Chemistry, Maths - For Engineering', true, '2026-01-06 05:46:54.909884+00', 'Science PCM', 'higher_secondary', 3, '2026-01-22 10:54:15.074543+00'),
	('science_pcb', 'Science (PCB)', 'Physics, Chemistry, Biology - For Medical', true, '2026-01-06 05:46:54.909884+00', 'Science PCB', 'higher_secondary', 4, '2026-01-22 10:54:15.074543+00'),
	('commerce_maths', 'Commerce with Maths', 'For CA, Finance, Economics, Statistics', true, '2026-01-12 05:26:57.656336+00', 'Commerce with Maths', 'higher_secondary', 5, '2026-01-22 10:54:15.074543+00'),
	('commerce_general', 'Commerce without Maths', 'For Business, Accounting, Management', true, '2026-01-12 05:26:57.656336+00', 'Commerce General', 'higher_secondary', 6, '2026-01-22 10:54:15.074543+00'),
	('arts_psychology', 'Arts with Psychology', 'Psychology, Sociology, English - For Counseling, HR, Social Work', true, '2026-01-22 10:54:15.074543+00', 'Arts with Psychology', 'higher_secondary', 7, '2026-01-22 10:54:15.074543+00'),
	('arts_economics', 'Arts with Economics', 'Economics, Political Science, English - For Civil Services, Policy', true, '2026-01-22 10:54:15.074543+00', 'Arts with Economics', 'higher_secondary', 8, '2026-01-22 10:54:15.074543+00'),
	('arts', 'Arts/Humanities General', 'English, History, Geography - For Journalism, Law, Teaching', true, '2025-12-30 08:19:07.918161+00', 'Arts General', 'higher_secondary', 9, '2026-01-22 10:54:15.074543+00'),
	('cs', 'B.Sc Computer Science / B.Tech CS/IT', 'Computer Science, Information Technology, Software Engineering', true, '2025-12-05 06:35:50.95673+00', 'Computer Science', 'after12', 10, '2026-01-22 10:54:15.074543+00'),
	('engineering', 'B.Tech / B.E (Other Engineering)', 'Mechanical, Civil, Electrical, Electronics, and other engineering branches', true, '2026-01-12 04:12:53.051609+00', 'Engineering', 'after12', 11, '2026-01-22 10:54:15.074543+00'),
	('medical', 'MBBS / BDS / Nursing', 'Medicine, Dentistry, Nursing, and allied health sciences', true, '2026-01-12 04:12:53.051609+00', 'Medical', 'after12', 12, '2026-01-22 10:54:15.074543+00'),
	('pharmacy', 'B.Pharm / Pharm.D', 'Pharmaceutical Sciences, Drug Development, Clinical Pharmacy', true, '2026-01-12 04:12:53.051609+00', 'Pharmacy', 'after12', 13, '2026-01-22 10:54:15.074543+00'),
	('bsc', 'B.Sc (Physics/Chemistry/Biology/Maths)', 'Pure Sciences - Physics, Chemistry, Biology, Mathematics', true, '2026-01-12 04:12:53.051609+00', 'Pure Sciences', 'after12', 14, '2026-01-22 10:54:15.074543+00'),
	('animation', 'B.Sc Animation / Game Design', 'Animation, Game Design, Visual Effects, 3D Modeling', true, '2025-12-05 06:35:50.95673+00', 'Animation & Design', 'after12', 15, '2026-01-22 10:54:15.074543+00'),
	('bba', 'BBA General', 'Business Administration, Management, Entrepreneurship', true, '2025-12-05 06:35:50.95673+00', 'BBA General', 'after12', 16, '2026-01-22 10:54:15.074543+00'),
	('bca', 'BCA General', 'Computer Applications, Software Development, IT Management', true, '2025-12-05 06:35:50.95673+00', 'BCA', 'after12', 17, '2026-01-22 10:54:15.074543+00'),
	('dm', 'BBA Digital Marketing', 'Digital Marketing, Social Media, E-commerce, Brand Management', true, '2025-12-05 06:35:50.95673+00', 'Digital Marketing', 'after12', 18, '2026-01-22 10:54:15.074543+00'),
	('bcom', 'B.Com / B.Com (Hons)', 'Commerce, Accounting, Business Studies', true, '2026-01-12 04:12:53.051609+00', 'B.Com', 'after12', 19, '2026-01-22 10:54:15.074543+00'),
	('ca', 'CA / CMA / CS', 'Chartered Accountancy, Cost Management, Company Secretary', true, '2026-01-12 04:12:53.051609+00', 'CA/CMA/CS', 'after12', 20, '2026-01-22 10:54:15.074543+00'),
	('finance', 'BBA Finance / Banking', 'Finance, Banking, Investment, Financial Analysis', true, '2026-01-12 04:12:53.051609+00', 'Finance & Banking', 'after12', 21, '2026-01-22 10:54:15.074543+00'),
	('ba', 'BA (English/History/Political Science)', 'Arts, Humanities, Social Sciences, Literature', true, '2026-01-12 04:12:53.051609+00', 'BA General', 'after12', 22, '2026-01-22 10:54:15.074543+00'),
	('journalism', 'BA Journalism / Mass Communication', 'Journalism, Media Studies, Mass Communication, Broadcasting', true, '2026-01-12 04:12:53.051609+00', 'Journalism', 'after12', 23, '2026-01-22 10:54:15.074543+00'),
	('design', 'B.Des / Fashion Design', 'Design, Fashion, Textile, Product Design', true, '2026-01-12 04:12:53.051609+00', 'Design', 'after12', 24, '2026-01-22 10:54:15.074543+00'),
	('law', 'BA LLB / BBA LLB', 'Law, Legal Studies, Advocacy, Corporate Law', true, '2026-01-12 04:12:53.051609+00', 'Law', 'after12', 25, '2026-01-22 10:54:15.074543+00'),
	('psychology', 'BA/B.Sc Psychology', 'Psychology, Counseling, Human Behavior, Mental Health', true, '2026-01-12 04:12:53.051609+00', 'Psychology', 'after12', 26, '2026-01-22 10:54:15.074543+00'),
	('finearts', 'BFA / Visual Arts', 'Fine Arts, Painting, Sculpture, Visual Arts, Photography', true, '2026-01-12 04:12:53.051609+00', 'Fine Arts', 'after12', 27, '2026-01-22 10:54:15.074543+00'),
	('science_pcmb_after10', 'Science (PCMB)', 'Physics, Chemistry, Maths, Biology - For Medical & Engineering', true, '2026-01-22 10:54:15.074543+00', 'Science PCMB', 'after10', 1, '2026-01-22 10:54:15.074543+00'),
	('science_pcms_after10', 'Science (PCMS)', 'Physics, Chemistry, Maths, Computer Science - For Engineering/IT', true, '2026-01-22 10:54:15.074543+00', 'Science PCMS', 'after10', 2, '2026-01-22 10:54:15.074543+00'),
	('science_pcm_after10', 'Science (PCM)', 'Physics, Chemistry, Maths - For Engineering', true, '2026-01-22 10:54:15.074543+00', 'Science PCM', 'after10', 3, '2026-01-22 10:54:15.074543+00'),
	('science_pcb_after10', 'Science (PCB)', 'Physics, Chemistry, Biology - For Medical', true, '2026-01-22 10:54:15.074543+00', 'Science PCB', 'after10', 4, '2026-01-22 10:54:15.074543+00'),
	('commerce_maths_after10', 'Commerce with Maths', 'For CA, Finance, Economics, Statistics', true, '2026-01-22 10:54:15.074543+00', 'Commerce with Maths', 'after10', 5, '2026-01-22 10:54:15.074543+00'),
	('commerce_general_after10', 'Commerce without Maths', 'For Business, Accounting, Management', true, '2026-01-22 10:54:15.074543+00', 'Commerce General', 'after10', 6, '2026-01-22 10:54:15.074543+00'),
	('arts_psychology_after10', 'Arts with Psychology', 'Psychology, Sociology, English - For Counseling, HR, Social Work', true, '2026-01-22 10:54:15.074543+00', 'Arts with Psychology', 'after10', 7, '2026-01-22 10:54:15.074543+00'),
	('arts_economics_after10', 'Arts with Economics', 'Economics, Political Science, English - For Civil Services, Policy', true, '2026-01-22 10:54:15.074543+00', 'Arts with Economics', 'after10', 8, '2026-01-22 10:54:15.074543+00'),
	('arts_after10', 'Arts/Humanities General', 'English, History, Geography - For Journalism, Law, Teaching', true, '2026-01-22 10:54:15.074543+00', 'Arts General', 'after10', 9, '2026-01-22 10:54:15.074543+00')
ON CONFLICT (id) DO NOTHING;


--

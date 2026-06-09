-- ============================================
-- COURSE SEED — part 05 of 10
-- Courses 201–250 of 485
-- Paste this whole file into the Supabase SQL editor and Run.
-- Safe to re-run (ON CONFLICT DO NOTHING). Run parts in order.
-- ============================================

BEGIN;

-- Insert Course: Corporate L&D Needs Transfer Quality Review, Coaching & Handoff Improvement
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Corporate L&D Needs Transfer Quality Review, Coaching & Handoff Improvement',
  'COURSE-L4-059',
  'Learner can review quality, coach others, and improve the handoff process for diagnose corporate learning needs and track transfer evidence against business performance objectives and submit a workplace-ready L4 Corporate L&D Needs Transfer Quality Review & Coaching Note. Workplace scenario: A team has already completed corporate l&d needs transfer work for 4 departments and 210 employees, but the supervisor sees repeated mistakes: manager requests, performance gaps, business priorities, and training expectations are mixed together. The learner must review sampled outputs, identify quality gaps, write coaching notes, and improve the handoff standard for the team. Learner artifact: L4 Corporate L&D Needs Transfer Quality Review & Coaching Note. Required data: manager request forms, performance data, business priority notes, learner profile, budget constraints, timeline. Evidence: Assess whether review comments are specific, coaching is practical, error patterns are named, and the improved handoff reduces repeat mistakes.',
  '20 hours',
  'Active',
  'Skilling, Employability & Work-Integrated Learning',
  'soft',
  '["Triggered when a quality review and team improvement task needs a real workplace artifact, not a theory answer.","Demonstrates quality review and team improvement by producing and defending the L4 Corporate L&D Needs Transfer Quality Review & Coaching Note.","Learner can review quality, coach others, and improve the handoff process for diagnose corporate learning needs and track transfer evidence against business performance objectives and submit a workplace-ready L4 Corporate L&D Needs Transfer Quality Review & Coaching Note."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: Module 1: Corporate L&D Needs Transfer Quality Review, Coaching & Handoff Improvement Workplace Artifact Build
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-059' LIMIT 1),
  'Module 1: Corporate L&D Needs Transfer Quality Review, Coaching & Handoff Improvement Workplace Artifact Build',
  'Triggered when a quality review and team improvement task needs a real workplace artifact, not a theory answer. The learner studies the case, reviews the required data, identifies the gap, creates the artifact, and checks it against evidence fields.',
  1,
  '["Education & Skilling","Skilling, Employability & Work-Integrated Learning","IND-CAP-12","L4","Needs analysis","Business-to-learning translation","Stakeholder requirement capture","Performance gap framing","Training priority matrix"]'::jsonb,
  '["Engage","Explore","Explain","Express","Empower","Evolve","Artifact Build","Evidence Review","AI-Coached Retry"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Case: Corporate L&D Needs Transfer Quality Review, Coaching & Handoff Improvement
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-059' LIMIT 1)
   AND title = 'Module 1: Corporate L&D Needs Transfer Quality Review, Coaching & Handoff Improvement Workplace Artifact Build' LIMIT 1),
  'Workplace Case: Corporate L&D Needs Transfer Quality Review, Coaching & Handoff Improvement',
  'A team has already completed corporate l&d needs transfer work for 4 departments and 210 employees, but the supervisor sees repeated mistakes: manager requests, performance gaps, business priorities, and training expectations are mixed together. The learner must review sampled outputs, identify quality gaps, write coaching notes, and improve the handoff standard for the team. The learner must solve the problem using the given data and produce the required workplace artifact.',
  'Workplace problem: A team has already completed corporate l&d needs transfer work for 4 departments and 210 employees, but the supervisor sees repeated mistakes: manager requests, performance gaps, business priorities, and training expectations are mixed together. The learner must review sampled outputs, identify quality gaps, write coaching notes, and improve the handoff standard for the team. Pressure points: Quality pressure: team members are repeating similar mistakes. Learner must detect error patterns, give usable coaching, and improve the next handoff without blaming individuals. Root cause focus: Identify repeated error types, weak review habits, unclear team instructions, missing examples, or lack of coaching follow-up. Major concepts: Needs analysis; Business-to-learning translation; Stakeholder requirement capture; Performance gap framing; Training priority matrix; L&D handoff; Quality sampling; Coaching evidence; Process improvement loop. Level focus: quality review and coaching. Required data: manager request forms, performance data, business priority notes, learner profile, budget constraints, timeline Learner activity flow: Engage - Start with the case: 4 departments and 210 employees and the visible pain point — manager requests, performance gaps, business priorities, and training expectations are mixed together. Learner identifies who is affected and what could go wrong if the work is delayed or wrong. Explore - Learner studies the source data: manager request forms, performance data, business priority notes, learner profile, budget constraints, timeline. They mark trusted records, missing fields, conflicting entries, and items that need confirmation before using them in the artifact. Explain - Teach the main logic in simple terms: Needs analysis; Business-to-learning translation; Stakeholder requirement capture; Performance gap framing; Training priority matrix; L&D handoff; Quality sampling; Coaching evidence; Process improvement loop. Level focus: quality review and coaching. Show how rules, evidence, decisions, and handoff notes connect in this workplace task. Express - Learner produces the L4 Corporate L&D Needs Transfer Quality Review & Coaching Note using the case data, writes decisions in plain English, and shows evidence for each important field instead of giving only a theory answer. Empower - Learner uses AI only as a coach: ask for missing-field checks, clarity prompts, risk questions, and retry suggestions. AI should not create the final artifact for the learner. Evolve - Learner notes what would become harder at L5: more records, more conflicts, less guidance, stronger evidence expectations, and higher decision responsibility. Artifact to submit: L4 Corporate L&D Needs Transfer Quality Review & Coaching Note. L4 Corporate L&D Needs Transfer Quality Review & Coaching Note should contain: sample reviewed; quality error log; coaching observation; corrective example; handoff improvement note; follow-up action. Required source data: manager request forms, performance data, business priority notes, learner profile, budget constraints, timeline. Evidence fields: Assess whether review comments are specific, coaching is practical, error patterns are named, and the improved handoff reduces repeat mistakes. AI support: AI coach can ask: What source proves this? Which field is missing? What is the risk if this is wrong? Who owns the next action? Learner must answer using the case data, not guesses.',
  1,
  '20 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BBA HR
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-059' LIMIT 1),
  'BBA HR',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MBA HR and L&D
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-059' LIMIT 1),
  'MBA HR and L&D',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PG Diploma Learning and Development
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-059' LIMIT 1),
  'PG Diploma Learning and Development',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MA Human Resource Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-059' LIMIT 1),
  'MA Human Resource Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Voc Corporate Training
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-059' LIMIT 1),
  'B.Voc Corporate Training',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: LMS Course Shell Launch Quality Review, Coaching & Handoff Improvement
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'LMS Course Shell Launch Quality Review, Coaching & Handoff Improvement',
  'COURSE-L4-064',
  'Learner can review quality, coach others, and improve the handoff process for configure lms course shells, enrollment rules, permissions, and completion controls for launch readiness and submit a workplace-ready L4 LMS Course Shell Launch Quality Review & Coaching Note. Workplace scenario: A team has already completed lms course shell launch work for 3 batches and 240 learners, but the supervisor sees repeated mistakes: module sequence, completion rules, facilitator permissions, and certificate trigger are incomplete. The learner must review sampled outputs, identify quality gaps, write coaching notes, and improve the handoff standard for the team. Learner artifact: L4 LMS Course Shell Launch Quality Review & Coaching Note. Required data: course outline, LMS shell settings, user roles, completion rules, certificate settings, batch enrollment list. Evidence: Assess whether review comments are specific, coaching is practical, error patterns are named, and the improved handoff reduces repeat mistakes.',
  '20 hours',
  'Active',
  'Digital Learning Platforms & Distributed Learning Operations',
  'technical',
  '["Triggered when a quality review and team improvement task needs a real workplace artifact, not a theory answer.","Demonstrates quality review and team improvement by producing and defending the L4 LMS Course Shell Launch Quality Review & Coaching Note.","Learner can review quality, coach others, and improve the handoff process for configure lms course shells, enrollment rules, permissions, and completion controls for launch readiness and submit a workplace-ready L4 LMS Course Shell Launch Quality Review & Coaching Note."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: Module 1: LMS Course Shell Launch Quality Review, Coaching & Handoff Improvement Workplace Artifact Build
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-064' LIMIT 1),
  'Module 1: LMS Course Shell Launch Quality Review, Coaching & Handoff Improvement Workplace Artifact Build',
  'Triggered when a quality review and team improvement task needs a real workplace artifact, not a theory answer. The learner studies the case, reviews the required data, identifies the gap, creates the artifact, and checks it against evidence fields.',
  1,
  '["Education & Skilling","Digital Learning Platforms & Distributed Learning Operations","IND-CAP-13","L4","LMS course architecture","Enrollment and role permissions","Completion rule setup","Certificate trigger logic","Launch readiness testing"]'::jsonb,
  '["Engage","Explore","Explain","Express","Empower","Evolve","Artifact Build","Evidence Review","AI-Coached Retry"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Case: LMS Course Shell Launch Quality Review, Coaching & Handoff Improvement
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-064' LIMIT 1)
   AND title = 'Module 1: LMS Course Shell Launch Quality Review, Coaching & Handoff Improvement Workplace Artifact Build' LIMIT 1),
  'Workplace Case: LMS Course Shell Launch Quality Review, Coaching & Handoff Improvement',
  'A team has already completed lms course shell launch work for 3 batches and 240 learners, but the supervisor sees repeated mistakes: module sequence, completion rules, facilitator permissions, and certificate trigger are incomplete. The learner must review sampled outputs, identify quality gaps, write coaching notes, and improve the handoff standard for the team. The learner must solve the problem using the given data and produce the required workplace artifact.',
  'Workplace problem: A team has already completed lms course shell launch work for 3 batches and 240 learners, but the supervisor sees repeated mistakes: module sequence, completion rules, facilitator permissions, and certificate trigger are incomplete. The learner must review sampled outputs, identify quality gaps, write coaching notes, and improve the handoff standard for the team. Pressure points: Quality pressure: team members are repeating similar mistakes. Learner must detect error patterns, give usable coaching, and improve the next handoff without blaming individuals. Root cause focus: Identify repeated error types, weak review habits, unclear team instructions, missing examples, or lack of coaching follow-up. Major concepts: LMS course architecture; Enrollment and role permissions; Completion rule setup; Certificate trigger logic; Launch readiness testing; Learner access validation; Quality sampling; Coaching evidence; Process improvement loop. Level focus: quality review and coaching. Required data: course outline, LMS shell settings, user roles, completion rules, certificate settings, batch enrollment list Learner activity flow: Engage - Start with the case: 3 batches and 240 learners and the visible pain point — module sequence, completion rules, facilitator permissions, and certificate trigger are incomplete. Learner identifies who is affected and what could go wrong if the work is delayed or wrong. Explore - Learner studies the source data: course outline, LMS shell settings, user roles, completion rules, certificate settings, batch enrollment list. They mark trusted records, missing fields, conflicting entries, and items that need confirmation before using them in the artifact. Explain - Teach the main logic in simple terms: LMS course architecture; Enrollment and role permissions; Completion rule setup; Certificate trigger logic; Launch readiness testing; Learner access validation; Quality sampling; Coaching evidence; Process improvement loop. Level focus: quality review and coaching. Show how rules, evidence, decisions, and handoff notes connect in this workplace task. Express - Learner produces the L4 LMS Course Shell Launch Quality Review & Coaching Note using the case data, writes decisions in plain English, and shows evidence for each important field instead of giving only a theory answer. Empower - Learner uses AI only as a coach: ask for missing-field checks, clarity prompts, risk questions, and retry suggestions. AI should not create the final artifact for the learner. Evolve - Learner notes what would become harder at L5: more records, more conflicts, less guidance, stronger evidence expectations, and higher decision responsibility. Artifact to submit: L4 LMS Course Shell Launch Quality Review & Coaching Note. L4 LMS Course Shell Launch Quality Review & Coaching Note should contain: sample reviewed; quality error log; coaching observation; corrective example; handoff improvement note; follow-up action. Required source data: course outline, LMS shell settings, user roles, completion rules, certificate settings, batch enrollment list. Evidence fields: Assess whether review comments are specific, coaching is practical, error patterns are named, and the improved handoff reduces repeat mistakes. AI support: AI coach can ask: What source proves this? Which field is missing? What is the risk if this is wrong? Who owns the next action? Learner must answer using the case data, not guesses.',
  1,
  '20 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BCA
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-064' LIMIT 1),
  'BCA',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc IT
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-064' LIMIT 1),
  'B.Sc IT',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Ed - Educational Technology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-064' LIMIT 1),
  'B.Ed - Educational Technology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Ed - Educational Technology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-064' LIMIT 1),
  'M.Ed - Educational Technology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PG Diploma LMS Administration
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-064' LIMIT 1),
  'PG Diploma LMS Administration',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Digital Learner Engagement Nudge Quality Review, Coaching & Handoff Improvement
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Digital Learner Engagement Nudge Quality Review, Coaching & Handoff Improvement',
  'COURSE-L4-069',
  'Learner can review quality, coach others, and improve the handoff process for monitor digital learner activity and trigger timely nudges from platform engagement evidence and submit a workplace-ready L4 Digital Learner Engagement Nudge Quality Review & Coaching Note. Workplace scenario: A team has already completed digital engagement nudge work for 312 active learners in week 2, but the supervisor sees repeated mistakes: 96 learners have low logins, 48 have missed quizzes, and support messages are not targeted. The learner must review sampled outputs, identify quality gaps, write coaching notes, and improve the handoff standard for the team. Learner artifact: L4 Digital Learner Engagement Nudge Quality Review & Coaching Note. Required data: login analytics, quiz completion, video watch data, support tickets, learner segments, nudge templates. Evidence: Assess whether review comments are specific, coaching is practical, error patterns are named, and the improved handoff reduces repeat mistakes.',
  '20 hours',
  'Active',
  'Digital Learning Platforms & Distributed Learning Operations',
  'soft',
  '["Triggered when a quality review and team improvement task needs a real workplace artifact, not a theory answer.","Demonstrates quality review and team improvement by producing and defending the L4 Digital Learner Engagement Nudge Quality Review & Coaching Note.","Learner can review quality, coach others, and improve the handoff process for monitor digital learner activity and trigger timely nudges from platform engagement evidence and submit a workplace-ready L4 Digital Learner Engagement Nudge Quality Review & Coaching Note."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: Module 1: Digital Learner Engagement Nudge Quality Review, Coaching & Handoff Improvement Workplace Artifact Build
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-069' LIMIT 1),
  'Module 1: Digital Learner Engagement Nudge Quality Review, Coaching & Handoff Improvement Workplace Artifact Build',
  'Triggered when a quality review and team improvement task needs a real workplace artifact, not a theory answer. The learner studies the case, reviews the required data, identifies the gap, creates the artifact, and checks it against evidence fields.',
  1,
  '["Education & Skilling","Digital Learning Platforms & Distributed Learning Operations","IND-CAP-14","L4","Engagement analytics","Learner segmentation","Nudge design","Risk indicator reading","Message timing"]'::jsonb,
  '["Engage","Explore","Explain","Express","Empower","Evolve","Artifact Build","Evidence Review","AI-Coached Retry"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Case: Digital Learner Engagement Nudge Quality Review, Coaching & Handoff Improvement
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-069' LIMIT 1)
   AND title = 'Module 1: Digital Learner Engagement Nudge Quality Review, Coaching & Handoff Improvement Workplace Artifact Build' LIMIT 1),
  'Workplace Case: Digital Learner Engagement Nudge Quality Review, Coaching & Handoff Improvement',
  'A team has already completed digital engagement nudge work for 312 active learners in week 2, but the supervisor sees repeated mistakes: 96 learners have low logins, 48 have missed quizzes, and support messages are not targeted. The learner must review sampled outputs, identify quality gaps, write coaching notes, and improve the handoff standard for the team. The learner must solve the problem using the given data and produce the required workplace artifact.',
  'Workplace problem: A team has already completed digital engagement nudge work for 312 active learners in week 2, but the supervisor sees repeated mistakes: 96 learners have low logins, 48 have missed quizzes, and support messages are not targeted. The learner must review sampled outputs, identify quality gaps, write coaching notes, and improve the handoff standard for the team. Pressure points: Quality pressure: team members are repeating similar mistakes. Learner must detect error patterns, give usable coaching, and improve the next handoff without blaming individuals. Root cause focus: Identify repeated error types, weak review habits, unclear team instructions, missing examples, or lack of coaching follow-up. Major concepts: Engagement analytics; Learner segmentation; Nudge design; Risk indicator reading; Message timing; Follow-up tracking; Quality sampling; Coaching evidence; Process improvement loop. Level focus: quality review and coaching. Required data: login analytics, quiz completion, video watch data, support tickets, learner segments, nudge templates Learner activity flow: Engage - Start with the case: 312 active learners in week 2 and the visible pain point — 96 learners have low logins, 48 have missed quizzes, and support messages are not targeted. Learner identifies who is affected and what could go wrong if the work is delayed or wrong. Explore - Learner studies the source data: login analytics, quiz completion, video watch data, support tickets, learner segments, nudge templates. They mark trusted records, missing fields, conflicting entries, and items that need confirmation before using them in the artifact. Explain - Teach the main logic in simple terms: Engagement analytics; Learner segmentation; Nudge design; Risk indicator reading; Message timing; Follow-up tracking; Quality sampling; Coaching evidence; Process improvement loop. Level focus: quality review and coaching. Show how rules, evidence, decisions, and handoff notes connect in this workplace task. Express - Learner produces the L4 Digital Learner Engagement Nudge Quality Review & Coaching Note using the case data, writes decisions in plain English, and shows evidence for each important field instead of giving only a theory answer. Empower - Learner uses AI only as a coach: ask for missing-field checks, clarity prompts, risk questions, and retry suggestions. AI should not create the final artifact for the learner. Evolve - Learner notes what would become harder at L5: more records, more conflicts, less guidance, stronger evidence expectations, and higher decision responsibility. Artifact to submit: L4 Digital Learner Engagement Nudge Quality Review & Coaching Note. L4 Digital Learner Engagement Nudge Quality Review & Coaching Note should contain: sample reviewed; quality error log; coaching observation; corrective example; handoff improvement note; follow-up action. Required source data: login analytics, quiz completion, video watch data, support tickets, learner segments, nudge templates. Evidence fields: Assess whether review comments are specific, coaching is practical, error patterns are named, and the improved handoff reduces repeat mistakes. AI support: AI coach can ask: What source proves this? Which field is missing? What is the risk if this is wrong? Who owns the next action? Learner must answer using the case data, not guesses.',
  1,
  '20 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BCA
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-069' LIMIT 1),
  'BCA',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc IT
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-069' LIMIT 1),
  'B.Sc IT',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BA Communication
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-069' LIMIT 1),
  'BA Communication',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Ed - Digital Learning
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-069' LIMIT 1),
  'B.Ed - Digital Learning',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PG Diploma Digital Learning Engagement
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-069' LIMIT 1),
  'PG Diploma Digital Learning Engagement',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Remote Cohort Facilitation Control Quality Review, Coaching & Handoff Improvement
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Remote Cohort Facilitation Control Quality Review, Coaching & Handoff Improvement',
  'COURSE-L4-074',
  'Learner can review quality, coach others, and improve the handoff process for control remote cohort facilitation through session access, participation, and digital delivery evidence and submit a workplace-ready L4 Remote Cohort Facilitation Control Quality Review & Coaching Note. Workplace scenario: A team has already completed remote cohort facilitation work for 4 online cohorts across 2 time zones, but the supervisor sees repeated mistakes: attendance, breakout activities, facilitator notes, and learner questions are not captured consistently. The learner must review sampled outputs, identify quality gaps, write coaching notes, and improve the handoff standard for the team. Learner artifact: L4 Remote Cohort Facilitation Control Quality Review & Coaching Note. Required data: online session roster, attendance export, chat/Q&A log, breakout task evidence, facilitator notes, issue log. Evidence: Assess whether review comments are specific, coaching is practical, error patterns are named, and the improved handoff reduces repeat mistakes.',
  '20 hours',
  'Active',
  'Digital Learning Platforms & Distributed Learning Operations',
  'soft',
  '["Triggered when a quality review and team improvement task needs a real workplace artifact, not a theory answer.","Demonstrates quality review and team improvement by producing and defending the L4 Remote Cohort Facilitation Control Quality Review & Coaching Note.","Learner can review quality, coach others, and improve the handoff process for control remote cohort facilitation through session access, participation, and digital delivery evidence and submit a workplace-ready L4 Remote Cohort Facilitation Control Quality Review & Coaching Note."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: Module 1: Remote Cohort Facilitation Control Quality Review, Coaching & Handoff Improvement Workplace Artifact Build
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-074' LIMIT 1),
  'Module 1: Remote Cohort Facilitation Control Quality Review, Coaching & Handoff Improvement Workplace Artifact Build',
  'Triggered when a quality review and team improvement task needs a real workplace artifact, not a theory answer. The learner studies the case, reviews the required data, identifies the gap, creates the artifact, and checks it against evidence fields.',
  1,
  '["Education & Skilling","Digital Learning Platforms & Distributed Learning Operations","IND-CAP-15","L4","Remote facilitation control","Attendance and participation capture","Breakout evidence tracking","Live issue handling","Session closure note"]'::jsonb,
  '["Engage","Explore","Explain","Express","Empower","Evolve","Artifact Build","Evidence Review","AI-Coached Retry"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Case: Remote Cohort Facilitation Control Quality Review, Coaching & Handoff Improvement
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-074' LIMIT 1)
   AND title = 'Module 1: Remote Cohort Facilitation Control Quality Review, Coaching & Handoff Improvement Workplace Artifact Build' LIMIT 1),
  'Workplace Case: Remote Cohort Facilitation Control Quality Review, Coaching & Handoff Improvement',
  'A team has already completed remote cohort facilitation work for 4 online cohorts across 2 time zones, but the supervisor sees repeated mistakes: attendance, breakout activities, facilitator notes, and learner questions are not captured consistently. The learner must review sampled outputs, identify quality gaps, write coaching notes, and improve the handoff standard for the team. The learner must solve the problem using the given data and produce the required workplace artifact.',
  'Workplace problem: A team has already completed remote cohort facilitation work for 4 online cohorts across 2 time zones, but the supervisor sees repeated mistakes: attendance, breakout activities, facilitator notes, and learner questions are not captured consistently. The learner must review sampled outputs, identify quality gaps, write coaching notes, and improve the handoff standard for the team. Pressure points: Quality pressure: team members are repeating similar mistakes. Learner must detect error patterns, give usable coaching, and improve the next handoff without blaming individuals. Root cause focus: Identify repeated error types, weak review habits, unclear team instructions, missing examples, or lack of coaching follow-up. Major concepts: Remote facilitation control; Attendance and participation capture; Breakout evidence tracking; Live issue handling; Session closure note; Cohort follow-up; Quality sampling; Coaching evidence; Process improvement loop. Level focus: quality review and coaching. Required data: online session roster, attendance export, chat/Q&A log, breakout task evidence, facilitator notes, issue log Learner activity flow: Engage - Start with the case: 4 online cohorts across 2 time zones and the visible pain point — attendance, breakout activities, facilitator notes, and learner questions are not captured consistently. Learner identifies who is affected and what could go wrong if the work is delayed or wrong. Explore - Learner studies the source data: online session roster, attendance export, chat/Q&A log, breakout task evidence, facilitator notes, issue log. They mark trusted records, missing fields, conflicting entries, and items that need confirmation before using them in the artifact. Explain - Teach the main logic in simple terms: Remote facilitation control; Attendance and participation capture; Breakout evidence tracking; Live issue handling; Session closure note; Cohort follow-up; Quality sampling; Coaching evidence; Process improvement loop. Level focus: quality review and coaching. Show how rules, evidence, decisions, and handoff notes connect in this workplace task. Express - Learner produces the L4 Remote Cohort Facilitation Control Quality Review & Coaching Note using the case data, writes decisions in plain English, and shows evidence for each important field instead of giving only a theory answer. Empower - Learner uses AI only as a coach: ask for missing-field checks, clarity prompts, risk questions, and retry suggestions. AI should not create the final artifact for the learner. Evolve - Learner notes what would become harder at L5: more records, more conflicts, less guidance, stronger evidence expectations, and higher decision responsibility. Artifact to submit: L4 Remote Cohort Facilitation Control Quality Review & Coaching Note. L4 Remote Cohort Facilitation Control Quality Review & Coaching Note should contain: sample reviewed; quality error log; coaching observation; corrective example; handoff improvement note; follow-up action. Required source data: online session roster, attendance export, chat/Q&A log, breakout task evidence, facilitator notes, issue log. Evidence fields: Assess whether review comments are specific, coaching is practical, error patterns are named, and the improved handoff reduces repeat mistakes. AI support: AI coach can ask: What source proves this? Which field is missing? What is the risk if this is wrong? Who owns the next action? Learner must answer using the case data, not guesses.',
  1,
  '20 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Ed - Online Teaching
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-074' LIMIT 1),
  'B.Ed - Online Teaching',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Ed - Educational Technology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-074' LIMIT 1),
  'M.Ed - Educational Technology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BA Education
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-074' LIMIT 1),
  'BA Education',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PG Diploma Online and Distance Learning
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-074' LIMIT 1),
  'PG Diploma Online and Distance Learning',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PG Diploma Virtual Facilitation
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-074' LIMIT 1),
  'PG Diploma Virtual Facilitation',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Tutoring Support Routing Quality Review, Coaching & Handoff Improvement
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Tutoring Support Routing Quality Review, Coaching & Handoff Improvement',
  'COURSE-L4-079',
  'Learner can review quality, coach others, and improve the handoff process for tutoring support requests using academic need, availability, and intervention-fit evidence and submit a workplace-ready L4 Tutoring Support Routing Quality Review & Coaching Note. Workplace scenario: A team has already completed tutoring support routing work for 74 learners requesting support, but the supervisor sees repeated mistakes: some learners need concept help, some need language support, and some have attendance or confidence issues. The learner must review sampled outputs, identify quality gaps, write coaching notes, and improve the handoff standard for the team. Learner artifact: L4 Tutoring Support Routing Quality Review & Coaching Note. Required data: support request form, diagnostic quiz, attendance record, tutor availability, learner notes, priority rules. Evidence: Assess whether review comments are specific, coaching is practical, error patterns are named, and the improved handoff reduces repeat mistakes.',
  '20 hours',
  'Active',
  'Digital Learning Platforms & Distributed Learning Operations',
  'soft',
  '["Triggered when a quality review and team improvement task needs a real workplace artifact, not a theory answer.","Demonstrates quality review and team improvement by producing and defending the L4 Tutoring Support Routing Quality Review & Coaching Note.","Learner can review quality, coach others, and improve the handoff process for tutoring support requests using academic need, availability, and intervention-fit evidence and submit a workplace-ready L4 Tutoring Support Routing Quality Review & Coaching Note."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: Module 1: Tutoring Support Routing Quality Review, Coaching & Handoff Improvement Workplace Artifact Build
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-079' LIMIT 1),
  'Module 1: Tutoring Support Routing Quality Review, Coaching & Handoff Improvement Workplace Artifact Build',
  'Triggered when a quality review and team improvement task needs a real workplace artifact, not a theory answer. The learner studies the case, reviews the required data, identifies the gap, creates the artifact, and checks it against evidence fields.',
  1,
  '["Education & Skilling","Digital Learning Platforms & Distributed Learning Operations","IND-CAP-16","L4","Support need classification","Diagnostic evidence reading","Tutor matching","Priority routing","Support session planning"]'::jsonb,
  '["Engage","Explore","Explain","Express","Empower","Evolve","Artifact Build","Evidence Review","AI-Coached Retry"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Case: Tutoring Support Routing Quality Review, Coaching & Handoff Improvement
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-079' LIMIT 1)
   AND title = 'Module 1: Tutoring Support Routing Quality Review, Coaching & Handoff Improvement Workplace Artifact Build' LIMIT 1),
  'Workplace Case: Tutoring Support Routing Quality Review, Coaching & Handoff Improvement',
  'A team has already completed tutoring support routing work for 74 learners requesting support, but the supervisor sees repeated mistakes: some learners need concept help, some need language support, and some have attendance or confidence issues. The learner must review sampled outputs, identify quality gaps, write coaching notes, and improve the handoff standard for the team. The learner must solve the problem using the given data and produce the required workplace artifact.',
  'Workplace problem: A team has already completed tutoring support routing work for 74 learners requesting support, but the supervisor sees repeated mistakes: some learners need concept help, some need language support, and some have attendance or confidence issues. The learner must review sampled outputs, identify quality gaps, write coaching notes, and improve the handoff standard for the team. Pressure points: Quality pressure: team members are repeating similar mistakes. Learner must detect error patterns, give usable coaching, and improve the next handoff without blaming individuals. Root cause focus: Identify repeated error types, weak review habits, unclear team instructions, missing examples, or lack of coaching follow-up. Major concepts: Support need classification; Diagnostic evidence reading; Tutor matching; Priority routing; Support session planning; Progress follow-up; Quality sampling; Coaching evidence; Process improvement loop. Level focus: quality review and coaching. Required data: support request form, diagnostic quiz, attendance record, tutor availability, learner notes, priority rules Learner activity flow: Engage - Start with the case: 74 learners requesting support and the visible pain point — some learners need concept help, some need language support, and some have attendance or confidence issues. Learner identifies who is affected and what could go wrong if the work is delayed or wrong. Explore - Learner studies the source data: support request form, diagnostic quiz, attendance record, tutor availability, learner notes, priority rules. They mark trusted records, missing fields, conflicting entries, and items that need confirmation before using them in the artifact. Explain - Teach the main logic in simple terms: Support need classification; Diagnostic evidence reading; Tutor matching; Priority routing; Support session planning; Progress follow-up; Quality sampling; Coaching evidence; Process improvement loop. Level focus: quality review and coaching. Show how rules, evidence, decisions, and handoff notes connect in this workplace task. Express - Learner produces the L4 Tutoring Support Routing Quality Review & Coaching Note using the case data, writes decisions in plain English, and shows evidence for each important field instead of giving only a theory answer. Empower - Learner uses AI only as a coach: ask for missing-field checks, clarity prompts, risk questions, and retry suggestions. AI should not create the final artifact for the learner. Evolve - Learner notes what would become harder at L5: more records, more conflicts, less guidance, stronger evidence expectations, and higher decision responsibility. Artifact to submit: L4 Tutoring Support Routing Quality Review & Coaching Note. L4 Tutoring Support Routing Quality Review & Coaching Note should contain: sample reviewed; quality error log; coaching observation; corrective example; handoff improvement note; follow-up action. Required source data: support request form, diagnostic quiz, attendance record, tutor availability, learner notes, priority rules. Evidence fields: Assess whether review comments are specific, coaching is practical, error patterns are named, and the improved handoff reduces repeat mistakes. AI support: AI coach can ask: What source proves this? Which field is missing? What is the risk if this is wrong? Who owns the next action? Learner must answer using the case data, not guesses.',
  1,
  '20 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Ed - Subject Tutoring
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-079' LIMIT 1),
  'B.Ed - Subject Tutoring',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BA Education
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-079' LIMIT 1),
  'BA Education',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Education
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-079' LIMIT 1),
  'B.Sc Education',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PG Diploma Tutoring and Coaching
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-079' LIMIT 1),
  'PG Diploma Tutoring and Coaching',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PG Diploma Inclusive Learning Support
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-079' LIMIT 1),
  'PG Diploma Inclusive Learning Support',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Assessment Blueprinting Quality Review, Coaching & Handoff Improvement
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Assessment Blueprinting Quality Review, Coaching & Handoff Improvement',
  'COURSE-L4-084',
  'Learner can review quality, coach others, and improve the handoff process for build assessment blueprints and items aligned to competency level, evidence standard, and validity requirements and submit a workplace-ready L4 Assessment Blueprinting Quality Review & Coaching Note. Workplace scenario: A team has already completed assessment blueprinting work for 60 questions across 5 outcomes, but the supervisor sees repeated mistakes: items do not match competency levels, evidence requirements, marks, or difficulty balance. The learner must review sampled outputs, identify quality gaps, write coaching notes, and improve the handoff standard for the team. Learner artifact: L4 Assessment Blueprinting Quality Review & Coaching Note. Required data: learning outcomes, item bank, marks table, difficulty tags, competency map, rubric draft. Evidence: Assess whether review comments are specific, coaching is practical, error patterns are named, and the improved handoff reduces repeat mistakes.',
  '20 hours',
  'Active',
  'Assessment, Certification & Credentialing',
  'technical',
  '["Triggered when a quality review and team improvement task needs a real workplace artifact, not a theory answer.","Demonstrates quality review and team improvement by producing and defending the L4 Assessment Blueprinting Quality Review & Coaching Note.","Learner can review quality, coach others, and improve the handoff process for build assessment blueprints and items aligned to competency level, evidence standard, and validity requirements and submit a workplace-ready L4 Assessment Blueprinting Quality Review & Coaching Note."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: Module 1: Assessment Blueprinting Quality Review, Coaching & Handoff Improvement Workplace Artifact Build
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-084' LIMIT 1),
  'Module 1: Assessment Blueprinting Quality Review, Coaching & Handoff Improvement Workplace Artifact Build',
  'Triggered when a quality review and team improvement task needs a real workplace artifact, not a theory answer. The learner studies the case, reviews the required data, identifies the gap, creates the artifact, and checks it against evidence fields.',
  1,
  '["Education & Skilling","Assessment, Certification & Credentialing","IND-CAP-17","L4","Assessment blueprinting","Outcome-item alignment","Difficulty distribution","Marks weighting","Evidence validity"]'::jsonb,
  '["Engage","Explore","Explain","Express","Empower","Evolve","Artifact Build","Evidence Review","AI-Coached Retry"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Case: Assessment Blueprinting Quality Review, Coaching & Handoff Improvement
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-084' LIMIT 1)
   AND title = 'Module 1: Assessment Blueprinting Quality Review, Coaching & Handoff Improvement Workplace Artifact Build' LIMIT 1),
  'Workplace Case: Assessment Blueprinting Quality Review, Coaching & Handoff Improvement',
  'A team has already completed assessment blueprinting work for 60 questions across 5 outcomes, but the supervisor sees repeated mistakes: items do not match competency levels, evidence requirements, marks, or difficulty balance. The learner must review sampled outputs, identify quality gaps, write coaching notes, and improve the handoff standard for the team. The learner must solve the problem using the given data and produce the required workplace artifact.',
  'Workplace problem: A team has already completed assessment blueprinting work for 60 questions across 5 outcomes, but the supervisor sees repeated mistakes: items do not match competency levels, evidence requirements, marks, or difficulty balance. The learner must review sampled outputs, identify quality gaps, write coaching notes, and improve the handoff standard for the team. Pressure points: Quality pressure: team members are repeating similar mistakes. Learner must detect error patterns, give usable coaching, and improve the next handoff without blaming individuals. Root cause focus: Identify repeated error types, weak review habits, unclear team instructions, missing examples, or lack of coaching follow-up. Major concepts: Assessment blueprinting; Outcome-item alignment; Difficulty distribution; Marks weighting; Evidence validity; Rubric linkage; Quality sampling; Coaching evidence; Process improvement loop. Level focus: quality review and coaching. Required data: learning outcomes, item bank, marks table, difficulty tags, competency map, rubric draft Learner activity flow: Engage - Start with the case: 60 questions across 5 outcomes and the visible pain point — items do not match competency levels, evidence requirements, marks, or difficulty balance. Learner identifies who is affected and what could go wrong if the work is delayed or wrong. Explore - Learner studies the source data: learning outcomes, item bank, marks table, difficulty tags, competency map, rubric draft. They mark trusted records, missing fields, conflicting entries, and items that need confirmation before using them in the artifact. Explain - Teach the main logic in simple terms: Assessment blueprinting; Outcome-item alignment; Difficulty distribution; Marks weighting; Evidence validity; Rubric linkage; Quality sampling; Coaching evidence; Process improvement loop. Level focus: quality review and coaching. Show how rules, evidence, decisions, and handoff notes connect in this workplace task. Express - Learner produces the L4 Assessment Blueprinting Quality Review & Coaching Note using the case data, writes decisions in plain English, and shows evidence for each important field instead of giving only a theory answer. Empower - Learner uses AI only as a coach: ask for missing-field checks, clarity prompts, risk questions, and retry suggestions. AI should not create the final artifact for the learner. Evolve - Learner notes what would become harder at L5: more records, more conflicts, less guidance, stronger evidence expectations, and higher decision responsibility. Artifact to submit: L4 Assessment Blueprinting Quality Review & Coaching Note. L4 Assessment Blueprinting Quality Review & Coaching Note should contain: sample reviewed; quality error log; coaching observation; corrective example; handoff improvement note; follow-up action. Required source data: learning outcomes, item bank, marks table, difficulty tags, competency map, rubric draft. Evidence fields: Assess whether review comments are specific, coaching is practical, error patterns are named, and the improved handoff reduces repeat mistakes. AI support: AI coach can ask: What source proves this? Which field is missing? What is the risk if this is wrong? Who owns the next action? Learner must answer using the case data, not guesses.',
  1,
  '20 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Ed - Assessment Design
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-084' LIMIT 1),
  'B.Ed - Assessment Design',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Ed - Assessment and Evaluation
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-084' LIMIT 1),
  'M.Ed - Assessment and Evaluation',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MA Education
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-084' LIMIT 1),
  'MA Education',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PG Diploma Educational Assessment
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-084' LIMIT 1),
  'PG Diploma Educational Assessment',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PG Diploma Instructional Design
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-084' LIMIT 1),
  'PG Diploma Instructional Design',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Rubric Evaluation Review Quality Review, Coaching & Handoff Improvement
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Rubric Evaluation Review Quality Review, Coaching & Handoff Improvement',
  'COURSE-L4-089',
  'Learner can review quality, coach others, and improve the handoff process for apply rubrics and score reviews to produce fair, evidence-based learner evaluation decisions and submit a workplace-ready L4 Rubric Evaluation Review Quality Review & Coaching Note. Workplace scenario: A team has already completed rubric evaluation work for 45 submitted artifacts from 3 sections, but the supervisor sees repeated mistakes: evaluators are scoring differently, feedback quality varies, and borderline cases are unclear. The learner must review sampled outputs, identify quality gaps, write coaching notes, and improve the handoff standard for the team. Learner artifact: L4 Rubric Evaluation Review Quality Review & Coaching Note. Required data: rubric, learner artifacts, evaluator scores, feedback comments, moderation notes, sample answers. Evidence: Assess whether review comments are specific, coaching is practical, error patterns are named, and the improved handoff reduces repeat mistakes.',
  '20 hours',
  'Active',
  'Assessment, Certification & Credentialing',
  'technical',
  '["Triggered when a quality review and team improvement task needs a real workplace artifact, not a theory answer.","Demonstrates quality review and team improvement by producing and defending the L4 Rubric Evaluation Review Quality Review & Coaching Note.","Learner can review quality, coach others, and improve the handoff process for apply rubrics and score reviews to produce fair, evidence-based learner evaluation decisions and submit a workplace-ready L4 Rubric Evaluation Review Quality Review & Coaching Note."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: Module 1: Rubric Evaluation Review Quality Review, Coaching & Handoff Improvement Workplace Artifact Build
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-089' LIMIT 1),
  'Module 1: Rubric Evaluation Review Quality Review, Coaching & Handoff Improvement Workplace Artifact Build',
  'Triggered when a quality review and team improvement task needs a real workplace artifact, not a theory answer. The learner studies the case, reviews the required data, identifies the gap, creates the artifact, and checks it against evidence fields.',
  1,
  '["Education & Skilling","Assessment, Certification & Credentialing","IND-CAP-18","L4","Rubric interpretation","Evidence-based scoring","Inter-rater consistency","Feedback quality","Moderation decision"]'::jsonb,
  '["Engage","Explore","Explain","Express","Empower","Evolve","Artifact Build","Evidence Review","AI-Coached Retry"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Case: Rubric Evaluation Review Quality Review, Coaching & Handoff Improvement
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-089' LIMIT 1)
   AND title = 'Module 1: Rubric Evaluation Review Quality Review, Coaching & Handoff Improvement Workplace Artifact Build' LIMIT 1),
  'Workplace Case: Rubric Evaluation Review Quality Review, Coaching & Handoff Improvement',
  'A team has already completed rubric evaluation work for 45 submitted artifacts from 3 sections, but the supervisor sees repeated mistakes: evaluators are scoring differently, feedback quality varies, and borderline cases are unclear. The learner must review sampled outputs, identify quality gaps, write coaching notes, and improve the handoff standard for the team. The learner must solve the problem using the given data and produce the required workplace artifact.',
  'Workplace problem: A team has already completed rubric evaluation work for 45 submitted artifacts from 3 sections, but the supervisor sees repeated mistakes: evaluators are scoring differently, feedback quality varies, and borderline cases are unclear. The learner must review sampled outputs, identify quality gaps, write coaching notes, and improve the handoff standard for the team. Pressure points: Quality pressure: team members are repeating similar mistakes. Learner must detect error patterns, give usable coaching, and improve the next handoff without blaming individuals. Root cause focus: Identify repeated error types, weak review habits, unclear team instructions, missing examples, or lack of coaching follow-up. Major concepts: Rubric interpretation; Evidence-based scoring; Inter-rater consistency; Feedback quality; Moderation decision; Borderline case handling; Quality sampling; Coaching evidence; Process improvement loop. Level focus: quality review and coaching. Required data: rubric, learner artifacts, evaluator scores, feedback comments, moderation notes, sample answers Learner activity flow: Engage - Start with the case: 45 submitted artifacts from 3 sections and the visible pain point — evaluators are scoring differently, feedback quality varies, and borderline cases are unclear. Learner identifies who is affected and what could go wrong if the work is delayed or wrong. Explore - Learner studies the source data: rubric, learner artifacts, evaluator scores, feedback comments, moderation notes, sample answers. They mark trusted records, missing fields, conflicting entries, and items that need confirmation before using them in the artifact. Explain - Teach the main logic in simple terms: Rubric interpretation; Evidence-based scoring; Inter-rater consistency; Feedback quality; Moderation decision; Borderline case handling; Quality sampling; Coaching evidence; Process improvement loop. Level focus: quality review and coaching. Show how rules, evidence, decisions, and handoff notes connect in this workplace task. Express - Learner produces the L4 Rubric Evaluation Review Quality Review & Coaching Note using the case data, writes decisions in plain English, and shows evidence for each important field instead of giving only a theory answer. Empower - Learner uses AI only as a coach: ask for missing-field checks, clarity prompts, risk questions, and retry suggestions. AI should not create the final artifact for the learner. Evolve - Learner notes what would become harder at L5: more records, more conflicts, less guidance, stronger evidence expectations, and higher decision responsibility. Artifact to submit: L4 Rubric Evaluation Review Quality Review & Coaching Note. L4 Rubric Evaluation Review Quality Review & Coaching Note should contain: sample reviewed; quality error log; coaching observation; corrective example; handoff improvement note; follow-up action. Required source data: rubric, learner artifacts, evaluator scores, feedback comments, moderation notes, sample answers. Evidence fields: Assess whether review comments are specific, coaching is practical, error patterns are named, and the improved handoff reduces repeat mistakes. AI support: AI coach can ask: What source proves this? Which field is missing? What is the risk if this is wrong? Who owns the next action? Learner must answer using the case data, not guesses.',
  1,
  '20 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Ed - Assessment Practice
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-089' LIMIT 1),
  'B.Ed - Assessment Practice',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Ed - Evaluation Studies
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-089' LIMIT 1),
  'M.Ed - Evaluation Studies',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MA Education
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-089' LIMIT 1),
  'MA Education',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PG Diploma Assessment and Rubrics
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-089' LIMIT 1),
  'PG Diploma Assessment and Rubrics',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PG Diploma Coaching Evaluation
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-089' LIMIT 1),
  'PG Diploma Coaching Evaluation',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Credential Issuance Quality Review, Coaching & Handoff Improvement
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Credential Issuance Quality Review, Coaching & Handoff Improvement',
  'COURSE-L4-094',
  'Learner can review quality, coach others, and improve the handoff process for issue credentials through eligibility, assessment completion, and certification record verification and submit a workplace-ready L4 Credential Issuance Quality Review & Coaching Note. Workplace scenario: A team has already completed credential issuance work for 138 learners marked complete, but the supervisor sees repeated mistakes: identity details, assessment completion, payment status, and approval records do not match for 19 learners. The learner must review sampled outputs, identify quality gaps, write coaching notes, and improve the handoff standard for the team. Learner artifact: L4 Credential Issuance Quality Review & Coaching Note. Required data: completion report, assessment result sheet, learner ID records, payment/status file, approval list, certificate template. Evidence: Assess whether review comments are specific, coaching is practical, error patterns are named, and the improved handoff reduces repeat mistakes.',
  '20 hours',
  'Active',
  'Assessment, Certification & Credentialing',
  'technical',
  '["Triggered when a quality review and team improvement task needs a real workplace artifact, not a theory answer.","Demonstrates quality review and team improvement by producing and defending the L4 Credential Issuance Quality Review & Coaching Note.","Learner can review quality, coach others, and improve the handoff process for issue credentials through eligibility, assessment completion, and certification record verification and submit a workplace-ready L4 Credential Issuance Quality Review & Coaching Note."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: Module 1: Credential Issuance Quality Review, Coaching & Handoff Improvement Workplace Artifact Build
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-094' LIMIT 1),
  'Module 1: Credential Issuance Quality Review, Coaching & Handoff Improvement Workplace Artifact Build',
  'Triggered when a quality review and team improvement task needs a real workplace artifact, not a theory answer. The learner studies the case, reviews the required data, identifies the gap, creates the artifact, and checks it against evidence fields.',
  1,
  '["Education & Skilling","Assessment, Certification & Credentialing","IND-CAP-19","L4","Credential eligibility","Completion verification","Identity data matching","Certificate data control","Approval workflow"]'::jsonb,
  '["Engage","Explore","Explain","Express","Empower","Evolve","Artifact Build","Evidence Review","AI-Coached Retry"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Case: Credential Issuance Quality Review, Coaching & Handoff Improvement
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-094' LIMIT 1)
   AND title = 'Module 1: Credential Issuance Quality Review, Coaching & Handoff Improvement Workplace Artifact Build' LIMIT 1),
  'Workplace Case: Credential Issuance Quality Review, Coaching & Handoff Improvement',
  'A team has already completed credential issuance work for 138 learners marked complete, but the supervisor sees repeated mistakes: identity details, assessment completion, payment status, and approval records do not match for 19 learners. The learner must review sampled outputs, identify quality gaps, write coaching notes, and improve the handoff standard for the team. The learner must solve the problem using the given data and produce the required workplace artifact.',
  'Workplace problem: A team has already completed credential issuance work for 138 learners marked complete, but the supervisor sees repeated mistakes: identity details, assessment completion, payment status, and approval records do not match for 19 learners. The learner must review sampled outputs, identify quality gaps, write coaching notes, and improve the handoff standard for the team. Pressure points: Quality pressure: team members are repeating similar mistakes. Learner must detect error patterns, give usable coaching, and improve the next handoff without blaming individuals. Root cause focus: Identify repeated error types, weak review habits, unclear team instructions, missing examples, or lack of coaching follow-up. Major concepts: Credential eligibility; Completion verification; Identity data matching; Certificate data control; Approval workflow; Issuance audit trail; Quality sampling; Coaching evidence; Process improvement loop. Level focus: quality review and coaching. Required data: completion report, assessment result sheet, learner ID records, payment/status file, approval list, certificate template Learner activity flow: Engage - Start with the case: 138 learners marked complete and the visible pain point — identity details, assessment completion, payment status, and approval records do not match for 19 learners. Learner identifies who is affected and what could go wrong if the work is delayed or wrong. Explore - Learner studies the source data: completion report, assessment result sheet, learner ID records, payment/status file, approval list, certificate template. They mark trusted records, missing fields, conflicting entries, and items that need confirmation before using them in the artifact. Explain - Teach the main logic in simple terms: Credential eligibility; Completion verification; Identity data matching; Certificate data control; Approval workflow; Issuance audit trail; Quality sampling; Coaching evidence; Process improvement loop. Level focus: quality review and coaching. Show how rules, evidence, decisions, and handoff notes connect in this workplace task. Express - Learner produces the L4 Credential Issuance Quality Review & Coaching Note using the case data, writes decisions in plain English, and shows evidence for each important field instead of giving only a theory answer. Empower - Learner uses AI only as a coach: ask for missing-field checks, clarity prompts, risk questions, and retry suggestions. AI should not create the final artifact for the learner. Evolve - Learner notes what would become harder at L5: more records, more conflicts, less guidance, stronger evidence expectations, and higher decision responsibility. Artifact to submit: L4 Credential Issuance Quality Review & Coaching Note. L4 Credential Issuance Quality Review & Coaching Note should contain: sample reviewed; quality error log; coaching observation; corrective example; handoff improvement note; follow-up action. Required source data: completion report, assessment result sheet, learner ID records, payment/status file, approval list, certificate template. Evidence fields: Assess whether review comments are specific, coaching is practical, error patterns are named, and the improved handoff reduces repeat mistakes. AI support: AI coach can ask: What source proves this? Which field is missing? What is the risk if this is wrong? Who owns the next action? Learner must answer using the case data, not guesses.',
  1,
  '20 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BBA Education Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-094' LIMIT 1),
  'BBA Education Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Com - Academic Operations
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-094' LIMIT 1),
  'B.Com - Academic Operations',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BA Public Administration
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-094' LIMIT 1),
  'BA Public Administration',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PG Diploma Certification Operations
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-094' LIMIT 1),
  'PG Diploma Certification Operations',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MBA Education Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-094' LIMIT 1),
  'MBA Education Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Exam Operations Control Quality Review, Coaching & Handoff Improvement
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Exam Operations Control Quality Review, Coaching & Handoff Improvement',
  'COURSE-L4-099',
  'Learner can review quality, coach others, and improve the handoff process for control exam operations through scheduling, candidate readiness, invigilation, and exception handling and submit a workplace-ready L4 Exam Operations Control Quality Review & Coaching Note. Workplace scenario: A team has already completed exam operations work for 420 candidates across 8 rooms, but the supervisor sees repeated mistakes: seat plan, invigilator duty, question-paper packets, access needs, and incident rules are not fully aligned. The learner must review sampled outputs, identify quality gaps, write coaching notes, and improve the handoff standard for the team. Learner artifact: L4 Exam Operations Control Quality Review & Coaching Note. Required data: candidate list, room plan, invigilator roster, question-paper packet list, access accommodation list, incident format. Evidence: Assess whether review comments are specific, coaching is practical, error patterns are named, and the improved handoff reduces repeat mistakes.',
  '20 hours',
  'Active',
  'Assessment, Certification & Credentialing',
  'technical',
  '["Triggered when a quality review and team improvement task needs a real workplace artifact, not a theory answer.","Demonstrates quality review and team improvement by producing and defending the L4 Exam Operations Control Quality Review & Coaching Note.","Learner can review quality, coach others, and improve the handoff process for control exam operations through scheduling, candidate readiness, invigilation, and exception handling and submit a workplace-ready L4 Exam Operations Control Quality Review & Coaching Note."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: Module 1: Exam Operations Control Quality Review, Coaching & Handoff Improvement Workplace Artifact Build
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-099' LIMIT 1),
  'Module 1: Exam Operations Control Quality Review, Coaching & Handoff Improvement Workplace Artifact Build',
  'Triggered when a quality review and team improvement task needs a real workplace artifact, not a theory answer. The learner studies the case, reviews the required data, identifies the gap, creates the artifact, and checks it against evidence fields.',
  1,
  '["Education & Skilling","Assessment, Certification & Credentialing","IND-CAP-20","L4","Exam logistics control","Seating and room allocation","Invigilator duty mapping","Confidential material control","Incident reporting"]'::jsonb,
  '["Engage","Explore","Explain","Express","Empower","Evolve","Artifact Build","Evidence Review","AI-Coached Retry"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Case: Exam Operations Control Quality Review, Coaching & Handoff Improvement
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-099' LIMIT 1)
   AND title = 'Module 1: Exam Operations Control Quality Review, Coaching & Handoff Improvement Workplace Artifact Build' LIMIT 1),
  'Workplace Case: Exam Operations Control Quality Review, Coaching & Handoff Improvement',
  'A team has already completed exam operations work for 420 candidates across 8 rooms, but the supervisor sees repeated mistakes: seat plan, invigilator duty, question-paper packets, access needs, and incident rules are not fully aligned. The learner must review sampled outputs, identify quality gaps, write coaching notes, and improve the handoff standard for the team. The learner must solve the problem using the given data and produce the required workplace artifact.',
  'Workplace problem: A team has already completed exam operations work for 420 candidates across 8 rooms, but the supervisor sees repeated mistakes: seat plan, invigilator duty, question-paper packets, access needs, and incident rules are not fully aligned. The learner must review sampled outputs, identify quality gaps, write coaching notes, and improve the handoff standard for the team. Pressure points: Quality pressure: team members are repeating similar mistakes. Learner must detect error patterns, give usable coaching, and improve the next handoff without blaming individuals. Root cause focus: Identify repeated error types, weak review habits, unclear team instructions, missing examples, or lack of coaching follow-up. Major concepts: Exam logistics control; Seating and room allocation; Invigilator duty mapping; Confidential material control; Incident reporting; Compliance checklist; Quality sampling; Coaching evidence; Process improvement loop. Level focus: quality review and coaching. Required data: candidate list, room plan, invigilator roster, question-paper packet list, access accommodation list, incident format Learner activity flow: Engage - Start with the case: 420 candidates across 8 rooms and the visible pain point — seat plan, invigilator duty, question-paper packets, access needs, and incident rules are not fully aligned. Learner identifies who is affected and what could go wrong if the work is delayed or wrong. Explore - Learner studies the source data: candidate list, room plan, invigilator roster, question-paper packet list, access accommodation list, incident format. They mark trusted records, missing fields, conflicting entries, and items that need confirmation before using them in the artifact. Explain - Teach the main logic in simple terms: Exam logistics control; Seating and room allocation; Invigilator duty mapping; Confidential material control; Incident reporting; Compliance checklist; Quality sampling; Coaching evidence; Process improvement loop. Level focus: quality review and coaching. Show how rules, evidence, decisions, and handoff notes connect in this workplace task. Express - Learner produces the L4 Exam Operations Control Quality Review & Coaching Note using the case data, writes decisions in plain English, and shows evidence for each important field instead of giving only a theory answer. Empower - Learner uses AI only as a coach: ask for missing-field checks, clarity prompts, risk questions, and retry suggestions. AI should not create the final artifact for the learner. Evolve - Learner notes what would become harder at L5: more records, more conflicts, less guidance, stronger evidence expectations, and higher decision responsibility. Artifact to submit: L4 Exam Operations Control Quality Review & Coaching Note. L4 Exam Operations Control Quality Review & Coaching Note should contain: sample reviewed; quality error log; coaching observation; corrective example; handoff improvement note; follow-up action. Required source data: candidate list, room plan, invigilator roster, question-paper packet list, access accommodation list, incident format. Evidence fields: Assess whether review comments are specific, coaching is practical, error patterns are named, and the improved handoff reduces repeat mistakes. AI support: AI coach can ask: What source proves this? Which field is missing? What is the risk if this is wrong? Who owns the next action? Learner must answer using the case data, not guesses.',
  1,
  '20 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Ed - Exam Operations
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-099' LIMIT 1),
  'B.Ed - Exam Operations',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BBA Education Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-099' LIMIT 1),
  'BBA Education Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BA Public Administration
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-099' LIMIT 1),
  'BA Public Administration',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PG Diploma Exam Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-099' LIMIT 1),
  'PG Diploma Exam Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Ed - Assessment Administration
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-099' LIMIT 1),
  'M.Ed - Assessment Administration',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Learner Support Planning Quality Review, Coaching & Handoff Improvement
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Learner Support Planning Quality Review, Coaching & Handoff Improvement',
  'COURSE-L4-104',
  'Learner can review quality, coach others, and improve the handoff process for create learner support plans from accessibility, referral, and progress evidence and submit a workplace-ready L4 Learner Support Planning Quality Review & Coaching Note. Workplace scenario: A team has already completed learner support planning work for 58 learners flagged for support, but the supervisor sees repeated mistakes: support needs, accommodation requests, guardian notes, teacher observations, and resource availability are incomplete. The learner must review sampled outputs, identify quality gaps, write coaching notes, and improve the handoff standard for the team. Learner artifact: L4 Learner Support Planning Quality Review & Coaching Note. Required data: learner profile, accommodation request, teacher observation, support history, resource list, meeting notes. Evidence: Assess whether review comments are specific, coaching is practical, error patterns are named, and the improved handoff reduces repeat mistakes.',
  '20 hours',
  'Active',
  'Learner Support, Guidance & Coaching Services',
  'soft',
  '["Triggered when a quality review and team improvement task needs a real workplace artifact, not a theory answer.","Demonstrates quality review and team improvement by producing and defending the L4 Learner Support Planning Quality Review & Coaching Note.","Learner can review quality, coach others, and improve the handoff process for create learner support plans from accessibility, referral, and progress evidence and submit a workplace-ready L4 Learner Support Planning Quality Review & Coaching Note."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: Module 1: Learner Support Planning Quality Review, Coaching & Handoff Improvement Workplace Artifact Build
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-104' LIMIT 1),
  'Module 1: Learner Support Planning Quality Review, Coaching & Handoff Improvement Workplace Artifact Build',
  'Triggered when a quality review and team improvement task needs a real workplace artifact, not a theory answer. The learner studies the case, reviews the required data, identifies the gap, creates the artifact, and checks it against evidence fields.',
  1,
  '["Education & Skilling","Learner Support, Guidance & Coaching Services","IND-CAP-21","L4","Inclusive support planning","Accommodation mapping","Learner profile interpretation","Stakeholder coordination","Support action plan"]'::jsonb,
  '["Engage","Explore","Explain","Express","Empower","Evolve","Artifact Build","Evidence Review","AI-Coached Retry"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Case: Learner Support Planning Quality Review, Coaching & Handoff Improvement
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-104' LIMIT 1)
   AND title = 'Module 1: Learner Support Planning Quality Review, Coaching & Handoff Improvement Workplace Artifact Build' LIMIT 1),
  'Workplace Case: Learner Support Planning Quality Review, Coaching & Handoff Improvement',
  'A team has already completed learner support planning work for 58 learners flagged for support, but the supervisor sees repeated mistakes: support needs, accommodation requests, guardian notes, teacher observations, and resource availability are incomplete. The learner must review sampled outputs, identify quality gaps, write coaching notes, and improve the handoff standard for the team. The learner must solve the problem using the given data and produce the required workplace artifact.',
  'Workplace problem: A team has already completed learner support planning work for 58 learners flagged for support, but the supervisor sees repeated mistakes: support needs, accommodation requests, guardian notes, teacher observations, and resource availability are incomplete. The learner must review sampled outputs, identify quality gaps, write coaching notes, and improve the handoff standard for the team. Pressure points: Quality pressure: team members are repeating similar mistakes. Learner must detect error patterns, give usable coaching, and improve the next handoff without blaming individuals. Root cause focus: Identify repeated error types, weak review habits, unclear team instructions, missing examples, or lack of coaching follow-up. Major concepts: Inclusive support planning; Accommodation mapping; Learner profile interpretation; Stakeholder coordination; Support action plan; Review timeline; Quality sampling; Coaching evidence; Process improvement loop. Level focus: quality review and coaching. Required data: learner profile, accommodation request, teacher observation, support history, resource list, meeting notes Learner activity flow: Engage - Start with the case: 58 learners flagged for support and the visible pain point — support needs, accommodation requests, guardian notes, teacher observations, and resource availability are incomplete. Learner identifies who is affected and what could go wrong if the work is delayed or wrong. Explore - Learner studies the source data: learner profile, accommodation request, teacher observation, support history, resource list, meeting notes. They mark trusted records, missing fields, conflicting entries, and items that need confirmation before using them in the artifact. Explain - Teach the main logic in simple terms: Inclusive support planning; Accommodation mapping; Learner profile interpretation; Stakeholder coordination; Support action plan; Review timeline; Quality sampling; Coaching evidence; Process improvement loop. Level focus: quality review and coaching. Show how rules, evidence, decisions, and handoff notes connect in this workplace task. Express - Learner produces the L4 Learner Support Planning Quality Review & Coaching Note using the case data, writes decisions in plain English, and shows evidence for each important field instead of giving only a theory answer. Empower - Learner uses AI only as a coach: ask for missing-field checks, clarity prompts, risk questions, and retry suggestions. AI should not create the final artifact for the learner. Evolve - Learner notes what would become harder at L5: more records, more conflicts, less guidance, stronger evidence expectations, and higher decision responsibility. Artifact to submit: L4 Learner Support Planning Quality Review & Coaching Note. L4 Learner Support Planning Quality Review & Coaching Note should contain: sample reviewed; quality error log; coaching observation; corrective example; handoff improvement note; follow-up action. Required source data: learner profile, accommodation request, teacher observation, support history, resource list, meeting notes. Evidence fields: Assess whether review comments are specific, coaching is practical, error patterns are named, and the improved handoff reduces repeat mistakes. AI support: AI coach can ask: What source proves this? Which field is missing? What is the risk if this is wrong? Who owns the next action? Learner must answer using the case data, not guesses.',
  1,
  '20 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Ed Special Education
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-104' LIMIT 1),
  'B.Ed Special Education',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Ed Special Education
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-104' LIMIT 1),
  'M.Ed Special Education',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BA Psychology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-104' LIMIT 1),
  'BA Psychology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MA Psychology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-104' LIMIT 1),
  'MA Psychology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MSW - Student Support Services
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-104' LIMIT 1),
  'MSW - Student Support Services',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Remedial Intervention Cycle Quality Review, Coaching & Handoff Improvement
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Remedial Intervention Cycle Quality Review, Coaching & Handoff Improvement',
  'COURSE-L4-109',
  'Learner can review quality, coach others, and improve the handoff process for run remedial intervention cycles using learning-gap diagnosis, practice evidence, and progress review and submit a workplace-ready L4 Remedial Intervention Cycle Quality Review & Coaching Note. Workplace scenario: A team has already completed remedial intervention work for 73 learners below benchmark after unit test, but the supervisor sees repeated mistakes: diagnostic causes, remedial groups, practice tasks, teacher availability, and retest dates are not planned. The learner must review sampled outputs, identify quality gaps, write coaching notes, and improve the handoff standard for the team. Learner artifact: L4 Remedial Intervention Cycle Quality Review & Coaching Note. Required data: unit-test scores, error analysis, attendance record, learner groups, teacher roster, remedial material list, retest plan. Evidence: Assess whether review comments are specific, coaching is practical, error patterns are named, and the improved handoff reduces repeat mistakes.',
  '20 hours',
  'Active',
  'Learner Support, Guidance & Coaching Services',
  'soft',
  '["Triggered when a quality review and team improvement task needs a real workplace artifact, not a theory answer.","Demonstrates quality review and team improvement by producing and defending the L4 Remedial Intervention Cycle Quality Review & Coaching Note.","Learner can review quality, coach others, and improve the handoff process for run remedial intervention cycles using learning-gap diagnosis, practice evidence, and progress review and submit a workplace-ready L4 Remedial Intervention Cycle Quality Review & Coaching Note."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: Module 1: Remedial Intervention Cycle Quality Review, Coaching & Handoff Improvement Workplace Artifact Build
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-109' LIMIT 1),
  'Module 1: Remedial Intervention Cycle Quality Review, Coaching & Handoff Improvement Workplace Artifact Build',
  'Triggered when a quality review and team improvement task needs a real workplace artifact, not a theory answer. The learner studies the case, reviews the required data, identifies the gap, creates the artifact, and checks it against evidence fields.',
  1,
  '["Education & Skilling","Learner Support, Guidance & Coaching Services","IND-CAP-22","L4","Diagnostic error analysis","Remedial grouping","Intervention planning","Practice evidence","Retest scheduling"]'::jsonb,
  '["Engage","Explore","Explain","Express","Empower","Evolve","Artifact Build","Evidence Review","AI-Coached Retry"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Case: Remedial Intervention Cycle Quality Review, Coaching & Handoff Improvement
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-109' LIMIT 1)
   AND title = 'Module 1: Remedial Intervention Cycle Quality Review, Coaching & Handoff Improvement Workplace Artifact Build' LIMIT 1),
  'Workplace Case: Remedial Intervention Cycle Quality Review, Coaching & Handoff Improvement',
  'A team has already completed remedial intervention work for 73 learners below benchmark after unit test, but the supervisor sees repeated mistakes: diagnostic causes, remedial groups, practice tasks, teacher availability, and retest dates are not planned. The learner must review sampled outputs, identify quality gaps, write coaching notes, and improve the handoff standard for the team. The learner must solve the problem using the given data and produce the required workplace artifact.',
  'Workplace problem: A team has already completed remedial intervention work for 73 learners below benchmark after unit test, but the supervisor sees repeated mistakes: diagnostic causes, remedial groups, practice tasks, teacher availability, and retest dates are not planned. The learner must review sampled outputs, identify quality gaps, write coaching notes, and improve the handoff standard for the team. Pressure points: Quality pressure: team members are repeating similar mistakes. Learner must detect error patterns, give usable coaching, and improve the next handoff without blaming individuals. Root cause focus: Identify repeated error types, weak review habits, unclear team instructions, missing examples, or lack of coaching follow-up. Major concepts: Diagnostic error analysis; Remedial grouping; Intervention planning; Practice evidence; Retest scheduling; Progress monitoring; Quality sampling; Coaching evidence; Process improvement loop. Level focus: quality review and coaching. Required data: unit-test scores, error analysis, attendance record, learner groups, teacher roster, remedial material list, retest plan Learner activity flow: Engage - Start with the case: 73 learners below benchmark after unit test and the visible pain point — diagnostic causes, remedial groups, practice tasks, teacher availability, and retest dates are not planned. Learner identifies who is affected and what could go wrong if the work is delayed or wrong. Explore - Learner studies the source data: unit-test scores, error analysis, attendance record, learner groups, teacher roster, remedial material list, retest plan. They mark trusted records, missing fields, conflicting entries, and items that need confirmation before using them in the artifact. Explain - Teach the main logic in simple terms: Diagnostic error analysis; Remedial grouping; Intervention planning; Practice evidence; Retest scheduling; Progress monitoring; Quality sampling; Coaching evidence; Process improvement loop. Level focus: quality review and coaching. Show how rules, evidence, decisions, and handoff notes connect in this workplace task. Express - Learner produces the L4 Remedial Intervention Cycle Quality Review & Coaching Note using the case data, writes decisions in plain English, and shows evidence for each important field instead of giving only a theory answer. Empower - Learner uses AI only as a coach: ask for missing-field checks, clarity prompts, risk questions, and retry suggestions. AI should not create the final artifact for the learner. Evolve - Learner notes what would become harder at L5: more records, more conflicts, less guidance, stronger evidence expectations, and higher decision responsibility. Artifact to submit: L4 Remedial Intervention Cycle Quality Review & Coaching Note. L4 Remedial Intervention Cycle Quality Review & Coaching Note should contain: sample reviewed; quality error log; coaching observation; corrective example; handoff improvement note; follow-up action. Required source data: unit-test scores, error analysis, attendance record, learner groups, teacher roster, remedial material list, retest plan. Evidence fields: Assess whether review comments are specific, coaching is practical, error patterns are named, and the improved handoff reduces repeat mistakes. AI support: AI coach can ask: What source proves this? Which field is missing? What is the risk if this is wrong? Who owns the next action? Learner must answer using the case data, not guesses.',
  1,
  '20 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Ed Special Education
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-109' LIMIT 1),
  'B.Ed Special Education',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Ed - Remedial Education
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-109' LIMIT 1),
  'B.Ed - Remedial Education',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BA Psychology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-109' LIMIT 1),
  'BA Psychology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MA Education
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-109' LIMIT 1),
  'MA Education',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PG Diploma Remedial Intervention
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-109' LIMIT 1),
  'PG Diploma Remedial Intervention',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Career Guidance Action Planning Quality Review, Coaching & Handoff Improvement
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Career Guidance Action Planning Quality Review, Coaching & Handoff Improvement',
  'COURSE-L4-114',
  'Learner can review quality, coach others, and improve the handoff process for convert learner profiles and market evidence into career guidance action plans and submit a workplace-ready L4 Career Guidance Action Planning Quality Review & Coaching Note. Workplace scenario: A team has already completed career guidance planning work for 120 final-year learners, but the supervisor sees repeated mistakes: career interests, aptitude data, course marks, family constraints, and local job options point in different directions. The learner must review sampled outputs, identify quality gaps, write coaching notes, and improve the handoff standard for the team. Learner artifact: L4 Career Guidance Action Planning Quality Review & Coaching Note. Required data: interest form, aptitude results, academic scores, learner constraints, job/education options, counselling notes. Evidence: Assess whether review comments are specific, coaching is practical, error patterns are named, and the improved handoff reduces repeat mistakes.',
  '20 hours',
  'Active',
  'Education & Skilling',
  'soft',
  '["Triggered when a quality review and team improvement task needs a real workplace artifact, not a theory answer.","Demonstrates quality review and team improvement by producing and defending the L4 Career Guidance Action Planning Quality Review & Coaching Note.","Learner can review quality, coach others, and improve the handoff process for convert learner profiles and market evidence into career guidance action plans and submit a workplace-ready L4 Career Guidance Action Planning Quality Review & Coaching Note."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: Module 1: Career Guidance Action Planning Quality Review, Coaching & Handoff Improvement Workplace Artifact Build
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-114' LIMIT 1),
  'Module 1: Career Guidance Action Planning Quality Review, Coaching & Handoff Improvement Workplace Artifact Build',
  'Triggered when a quality review and team improvement task needs a real workplace artifact, not a theory answer. The learner studies the case, reviews the required data, identifies the gap, creates the artifact, and checks it against evidence fields.',
  1,
  '["Education & Skilling","IND-CAP-23","L4","Career interest interpretation","Aptitude and evidence use","Option comparison","Constraint-aware guidance","Action planning"]'::jsonb,
  '["Engage","Explore","Explain","Express","Empower","Evolve","Artifact Build","Evidence Review","AI-Coached Retry"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Case: Career Guidance Action Planning Quality Review, Coaching & Handoff Improvement
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-114' LIMIT 1)
   AND title = 'Module 1: Career Guidance Action Planning Quality Review, Coaching & Handoff Improvement Workplace Artifact Build' LIMIT 1),
  'Workplace Case: Career Guidance Action Planning Quality Review, Coaching & Handoff Improvement',
  'A team has already completed career guidance planning work for 120 final-year learners, but the supervisor sees repeated mistakes: career interests, aptitude data, course marks, family constraints, and local job options point in different directions. The learner must review sampled outputs, identify quality gaps, write coaching notes, and improve the handoff standard for the team. The learner must solve the problem using the given data and produce the required workplace artifact.',
  'Workplace problem: A team has already completed career guidance planning work for 120 final-year learners, but the supervisor sees repeated mistakes: career interests, aptitude data, course marks, family constraints, and local job options point in different directions. The learner must review sampled outputs, identify quality gaps, write coaching notes, and improve the handoff standard for the team. Pressure points: Quality pressure: team members are repeating similar mistakes. Learner must detect error patterns, give usable coaching, and improve the next handoff without blaming individuals. Root cause focus: Identify repeated error types, weak review habits, unclear team instructions, missing examples, or lack of coaching follow-up. Major concepts: Career interest interpretation; Aptitude and evidence use; Option comparison; Constraint-aware guidance; Action planning; Referral and follow-up; Quality sampling; Coaching evidence; Process improvement loop. Level focus: quality review and coaching. Required data: interest form, aptitude results, academic scores, learner constraints, job/education options, counselling notes Learner activity flow: Engage - Start with the case: 120 final-year learners and the visible pain point — career interests, aptitude data, course marks, family constraints, and local job options point in different directions. Learner identifies who is affected and what could go wrong if the work is delayed or wrong. Explore - Learner studies the source data: interest form, aptitude results, academic scores, learner constraints, job/education options, counselling notes. They mark trusted records, missing fields, conflicting entries, and items that need confirmation before using them in the artifact. Explain - Teach the main logic in simple terms: Career interest interpretation; Aptitude and evidence use; Option comparison; Constraint-aware guidance; Action planning; Referral and follow-up; Quality sampling; Coaching evidence; Process improvement loop. Level focus: quality review and coaching. Show how rules, evidence, decisions, and handoff notes connect in this workplace task. Express - Learner produces the L4 Career Guidance Action Planning Quality Review & Coaching Note using the case data, writes decisions in plain English, and shows evidence for each important field instead of giving only a theory answer. Empower - Learner uses AI only as a coach: ask for missing-field checks, clarity prompts, risk questions, and retry suggestions. AI should not create the final artifact for the learner. Evolve - Learner notes what would become harder at L5: more records, more conflicts, less guidance, stronger evidence expectations, and higher decision responsibility. Artifact to submit: L4 Career Guidance Action Planning Quality Review & Coaching Note. L4 Career Guidance Action Planning Quality Review & Coaching Note should contain: sample reviewed; quality error log; coaching observation; corrective example; handoff improvement note; follow-up action. Required source data: interest form, aptitude results, academic scores, learner constraints, job/education options, counselling notes. Evidence fields: Assess whether review comments are specific, coaching is practical, error patterns are named, and the improved handoff reduces repeat mistakes. AI support: AI coach can ask: What source proves this? Which field is missing? What is the risk if this is wrong? Who owns the next action? Learner must answer using the case data, not guesses.',
  1,
  '20 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BA Psychology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-114' LIMIT 1),
  'BA Psychology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MA Counselling Psychology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-114' LIMIT 1),
  'MA Counselling Psychology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BBA HR
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-114' LIMIT 1),
  'BBA HR',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MBA HR
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-114' LIMIT 1),
  'MBA HR',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PG Diploma Career Guidance and Counselling
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-114' LIMIT 1),
  'PG Diploma Career Guidance and Counselling',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Coaching Progress Management Quality Review, Coaching & Handoff Improvement
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Coaching Progress Management Quality Review, Coaching & Handoff Improvement',
  'COURSE-L4-119',
  'Learner can review quality, coach others, and improve the handoff process for manage language or performance coaching progress through diagnostic evidence, practice cycles, and feedback records and submit a workplace-ready L4 Coaching Progress Management Quality Review & Coaching Note. Workplace scenario: A team has already completed coaching progress management work for 36 learners in a 6-week coaching cycle, but the supervisor sees repeated mistakes: practice logs, coach feedback, attendance, improvement targets, and learner reflections are inconsistent. The learner must review sampled outputs, identify quality gaps, write coaching notes, and improve the handoff standard for the team. Learner artifact: L4 Coaching Progress Management Quality Review & Coaching Note. Required data: practice log, coach feedback, attendance, performance target, reflection notes, review dates. Evidence: Assess whether review comments are specific, coaching is practical, error patterns are named, and the improved handoff reduces repeat mistakes.',
  '20 hours',
  'Active',
  'Education & Skilling',
  'soft',
  '["Triggered when a quality review and team improvement task needs a real workplace artifact, not a theory answer.","Demonstrates quality review and team improvement by producing and defending the L4 Coaching Progress Management Quality Review & Coaching Note.","Learner can review quality, coach others, and improve the handoff process for manage language or performance coaching progress through diagnostic evidence, practice cycles, and feedback records and submit a workplace-ready L4 Coaching Progress Management Quality Review & Coaching Note."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: Module 1: Coaching Progress Management Quality Review, Coaching & Handoff Improvement Workplace Artifact Build
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-119' LIMIT 1),
  'Module 1: Coaching Progress Management Quality Review, Coaching & Handoff Improvement Workplace Artifact Build',
  'Triggered when a quality review and team improvement task needs a real workplace artifact, not a theory answer. The learner studies the case, reviews the required data, identifies the gap, creates the artifact, and checks it against evidence fields.',
  1,
  '["Education & Skilling","IND-CAP-24","L4","Coaching goal setting","Practice evidence tracking","Feedback loop","Progress review","Motivation support"]'::jsonb,
  '["Engage","Explore","Explain","Express","Empower","Evolve","Artifact Build","Evidence Review","AI-Coached Retry"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Case: Coaching Progress Management Quality Review, Coaching & Handoff Improvement
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-119' LIMIT 1)
   AND title = 'Module 1: Coaching Progress Management Quality Review, Coaching & Handoff Improvement Workplace Artifact Build' LIMIT 1),
  'Workplace Case: Coaching Progress Management Quality Review, Coaching & Handoff Improvement',
  'A team has already completed coaching progress management work for 36 learners in a 6-week coaching cycle, but the supervisor sees repeated mistakes: practice logs, coach feedback, attendance, improvement targets, and learner reflections are inconsistent. The learner must review sampled outputs, identify quality gaps, write coaching notes, and improve the handoff standard for the team. The learner must solve the problem using the given data and produce the required workplace artifact.',
  'Workplace problem: A team has already completed coaching progress management work for 36 learners in a 6-week coaching cycle, but the supervisor sees repeated mistakes: practice logs, coach feedback, attendance, improvement targets, and learner reflections are inconsistent. The learner must review sampled outputs, identify quality gaps, write coaching notes, and improve the handoff standard for the team. Pressure points: Quality pressure: team members are repeating similar mistakes. Learner must detect error patterns, give usable coaching, and improve the next handoff without blaming individuals. Root cause focus: Identify repeated error types, weak review habits, unclear team instructions, missing examples, or lack of coaching follow-up. Major concepts: Coaching goal setting; Practice evidence tracking; Feedback loop; Progress review; Motivation support; Next-step planning; Quality sampling; Coaching evidence; Process improvement loop. Level focus: quality review and coaching. Required data: practice log, coach feedback, attendance, performance target, reflection notes, review dates Learner activity flow: Engage - Start with the case: 36 learners in a 6-week coaching cycle and the visible pain point — practice logs, coach feedback, attendance, improvement targets, and learner reflections are inconsistent. Learner identifies who is affected and what could go wrong if the work is delayed or wrong. Explore - Learner studies the source data: practice log, coach feedback, attendance, performance target, reflection notes, review dates. They mark trusted records, missing fields, conflicting entries, and items that need confirmation before using them in the artifact. Explain - Teach the main logic in simple terms: Coaching goal setting; Practice evidence tracking; Feedback loop; Progress review; Motivation support; Next-step planning; Quality sampling; Coaching evidence; Process improvement loop. Level focus: quality review and coaching. Show how rules, evidence, decisions, and handoff notes connect in this workplace task. Express - Learner produces the L4 Coaching Progress Management Quality Review & Coaching Note using the case data, writes decisions in plain English, and shows evidence for each important field instead of giving only a theory answer. Empower - Learner uses AI only as a coach: ask for missing-field checks, clarity prompts, risk questions, and retry suggestions. AI should not create the final artifact for the learner. Evolve - Learner notes what would become harder at L5: more records, more conflicts, less guidance, stronger evidence expectations, and higher decision responsibility. Artifact to submit: L4 Coaching Progress Management Quality Review & Coaching Note. L4 Coaching Progress Management Quality Review & Coaching Note should contain: sample reviewed; quality error log; coaching observation; corrective example; handoff improvement note; follow-up action. Required source data: practice log, coach feedback, attendance, performance target, reflection notes, review dates. Evidence fields: Assess whether review comments are specific, coaching is practical, error patterns are named, and the improved handoff reduces repeat mistakes. AI support: AI coach can ask: What source proves this? Which field is missing? What is the risk if this is wrong? Who owns the next action? Learner must answer using the case data, not guesses.',
  1,
  '20 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BA English and Communication
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-119' LIMIT 1),
  'BA English and Communication',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.P.Ed
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-119' LIMIT 1),
  'B.P.Ed',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BFA Performing Arts
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-119' LIMIT 1),
  'BFA Performing Arts',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Ed - Coaching Support
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-119' LIMIT 1),
  'B.Ed - Coaching Support',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PG Diploma Coaching and Mentoring
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-119' LIMIT 1),
  'PG Diploma Coaching and Mentoring',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Admissions Operations Quality Review, Coaching & Handoff Improvement
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Admissions Operations Quality Review, Coaching & Handoff Improvement',
  'COURSE-L4-124',
  'Learner can review quality, coach others, and improve the handoff process for complete admissions operations through document verification, enrollment coding, and record activation and submit a workplace-ready L4 Admissions Operations Quality Review & Coaching Note. Workplace scenario: A team has already completed admissions operations work for 520 applicants for 180 seats, but the supervisor sees repeated mistakes: application status, document checks, fee records, category rules, and communication logs are not synchronized. The learner must review sampled outputs, identify quality gaps, write coaching notes, and improve the handoff standard for the team. Learner artifact: L4 Admissions Operations Quality Review & Coaching Note. Required data: application forms, document checklist, fee report, category rules, merit/selection list, communication log. Evidence: Assess whether review comments are specific, coaching is practical, error patterns are named, and the improved handoff reduces repeat mistakes.',
  '20 hours',
  'Active',
  'Education & Skilling',
  'technical',
  '["Triggered when a quality review and team improvement task needs a real workplace artifact, not a theory answer.","Demonstrates quality review and team improvement by producing and defending the L4 Admissions Operations Quality Review & Coaching Note.","Learner can review quality, coach others, and improve the handoff process for complete admissions operations through document verification, enrollment coding, and record activation and submit a workplace-ready L4 Admissions Operations Quality Review & Coaching Note."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: Module 1: Admissions Operations Quality Review, Coaching & Handoff Improvement Workplace Artifact Build
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-124' LIMIT 1),
  'Module 1: Admissions Operations Quality Review, Coaching & Handoff Improvement Workplace Artifact Build',
  'Triggered when a quality review and team improvement task needs a real workplace artifact, not a theory answer. The learner studies the case, reviews the required data, identifies the gap, creates the artifact, and checks it against evidence fields.',
  1,
  '["Education & Skilling","IND-CAP-25","L4","Admissions workflow","Document and fee verification","Selection rule application","Status communication","Exception tagging"]'::jsonb,
  '["Engage","Explore","Explain","Express","Empower","Evolve","Artifact Build","Evidence Review","AI-Coached Retry"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Case: Admissions Operations Quality Review, Coaching & Handoff Improvement
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-124' LIMIT 1)
   AND title = 'Module 1: Admissions Operations Quality Review, Coaching & Handoff Improvement Workplace Artifact Build' LIMIT 1),
  'Workplace Case: Admissions Operations Quality Review, Coaching & Handoff Improvement',
  'A team has already completed admissions operations work for 520 applicants for 180 seats, but the supervisor sees repeated mistakes: application status, document checks, fee records, category rules, and communication logs are not synchronized. The learner must review sampled outputs, identify quality gaps, write coaching notes, and improve the handoff standard for the team. The learner must solve the problem using the given data and produce the required workplace artifact.',
  'Workplace problem: A team has already completed admissions operations work for 520 applicants for 180 seats, but the supervisor sees repeated mistakes: application status, document checks, fee records, category rules, and communication logs are not synchronized. The learner must review sampled outputs, identify quality gaps, write coaching notes, and improve the handoff standard for the team. Pressure points: Quality pressure: team members are repeating similar mistakes. Learner must detect error patterns, give usable coaching, and improve the next handoff without blaming individuals. Root cause focus: Identify repeated error types, weak review habits, unclear team instructions, missing examples, or lack of coaching follow-up. Major concepts: Admissions workflow; Document and fee verification; Selection rule application; Status communication; Exception tagging; Admissions audit trail; Quality sampling; Coaching evidence; Process improvement loop. Level focus: quality review and coaching. Required data: application forms, document checklist, fee report, category rules, merit/selection list, communication log Learner activity flow: Engage - Start with the case: 520 applicants for 180 seats and the visible pain point — application status, document checks, fee records, category rules, and communication logs are not synchronized. Learner identifies who is affected and what could go wrong if the work is delayed or wrong. Explore - Learner studies the source data: application forms, document checklist, fee report, category rules, merit/selection list, communication log. They mark trusted records, missing fields, conflicting entries, and items that need confirmation before using them in the artifact. Explain - Teach the main logic in simple terms: Admissions workflow; Document and fee verification; Selection rule application; Status communication; Exception tagging; Admissions audit trail; Quality sampling; Coaching evidence; Process improvement loop. Level focus: quality review and coaching. Show how rules, evidence, decisions, and handoff notes connect in this workplace task. Express - Learner produces the L4 Admissions Operations Quality Review & Coaching Note using the case data, writes decisions in plain English, and shows evidence for each important field instead of giving only a theory answer. Empower - Learner uses AI only as a coach: ask for missing-field checks, clarity prompts, risk questions, and retry suggestions. AI should not create the final artifact for the learner. Evolve - Learner notes what would become harder at L5: more records, more conflicts, less guidance, stronger evidence expectations, and higher decision responsibility. Artifact to submit: L4 Admissions Operations Quality Review & Coaching Note. L4 Admissions Operations Quality Review & Coaching Note should contain: sample reviewed; quality error log; coaching observation; corrective example; handoff improvement note; follow-up action. Required source data: application forms, document checklist, fee report, category rules, merit/selection list, communication log. Evidence fields: Assess whether review comments are specific, coaching is practical, error patterns are named, and the improved handoff reduces repeat mistakes. AI support: AI coach can ask: What source proves this? Which field is missing? What is the risk if this is wrong? Who owns the next action? Learner must answer using the case data, not guesses.',
  1,
  '20 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BBA Education Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-124' LIMIT 1),
  'BBA Education Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Com - Admissions Operations
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-124' LIMIT 1),
  'B.Com - Admissions Operations',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BA Public Administration
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-124' LIMIT 1),
  'BA Public Administration',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MBA Education Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-124' LIMIT 1),
  'MBA Education Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PG Diploma Admission Counselling
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-124' LIMIT 1),
  'PG Diploma Admission Counselling',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Education MIS Reporting Quality Review, Coaching & Handoff Improvement
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Education MIS Reporting Quality Review, Coaching & Handoff Improvement',
  'COURSE-L4-129',
  'Learner can review quality, coach others, and improve the handoff process for produce institution-level education MIS reports through institution-code, learner-record, and data-quality controls and submit a workplace-ready L4 Education MIS Reporting Quality Review & Coaching Note. Workplace scenario: A team has already completed education MIS reporting work for 12 departments reporting monthly data, but the supervisor sees repeated mistakes: enrollment, attendance, assessment, dropout, and placement numbers do not reconcile before submission. The learner must review sampled outputs, identify quality gaps, write coaching notes, and improve the handoff standard for the team. Learner artifact: L4 Education MIS Reporting Quality Review & Coaching Note. Required data: department data files, ERP exports, attendance summaries, assessment results, dropout records, placement tracker. Evidence: Assess whether review comments are specific, coaching is practical, error patterns are named, and the improved handoff reduces repeat mistakes.',
  '20 hours',
  'Active',
  'Education & Skilling',
  'technical',
  '["Triggered when a quality review and team improvement task needs a real workplace artifact, not a theory answer.","Demonstrates quality review and team improvement by producing and defending the L4 Education MIS Reporting Quality Review & Coaching Note.","Learner can review quality, coach others, and improve the handoff process for produce institution-level education MIS reports through institution-code, learner-record, and data-quality controls and submit a workplace-ready L4 Education MIS Reporting Quality Review & Coaching Note."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: Module 1: Education MIS Reporting Quality Review, Coaching & Handoff Improvement Workplace Artifact Build
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-129' LIMIT 1),
  'Module 1: Education MIS Reporting Quality Review, Coaching & Handoff Improvement Workplace Artifact Build',
  'Triggered when a quality review and team improvement task needs a real workplace artifact, not a theory answer. The learner studies the case, reviews the required data, identifies the gap, creates the artifact, and checks it against evidence fields.',
  1,
  '["Education & Skilling","IND-CAP-26","L4","MIS data validation","Indicator definition","Reconciliation logic","Dashboard readiness","Exception notes"]'::jsonb,
  '["Engage","Explore","Explain","Express","Empower","Evolve","Artifact Build","Evidence Review","AI-Coached Retry"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Case: Education MIS Reporting Quality Review, Coaching & Handoff Improvement
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-129' LIMIT 1)
   AND title = 'Module 1: Education MIS Reporting Quality Review, Coaching & Handoff Improvement Workplace Artifact Build' LIMIT 1),
  'Workplace Case: Education MIS Reporting Quality Review, Coaching & Handoff Improvement',
  'A team has already completed education MIS reporting work for 12 departments reporting monthly data, but the supervisor sees repeated mistakes: enrollment, attendance, assessment, dropout, and placement numbers do not reconcile before submission. The learner must review sampled outputs, identify quality gaps, write coaching notes, and improve the handoff standard for the team. The learner must solve the problem using the given data and produce the required workplace artifact.',
  'Workplace problem: A team has already completed education MIS reporting work for 12 departments reporting monthly data, but the supervisor sees repeated mistakes: enrollment, attendance, assessment, dropout, and placement numbers do not reconcile before submission. The learner must review sampled outputs, identify quality gaps, write coaching notes, and improve the handoff standard for the team. Pressure points: Quality pressure: team members are repeating similar mistakes. Learner must detect error patterns, give usable coaching, and improve the next handoff without blaming individuals. Root cause focus: Identify repeated error types, weak review habits, unclear team instructions, missing examples, or lack of coaching follow-up. Major concepts: MIS data validation; Indicator definition; Reconciliation logic; Dashboard readiness; Exception notes; Submission control; Quality sampling; Coaching evidence; Process improvement loop. Level focus: quality review and coaching. Required data: department data files, ERP exports, attendance summaries, assessment results, dropout records, placement tracker Learner activity flow: Engage - Start with the case: 12 departments reporting monthly data and the visible pain point — enrollment, attendance, assessment, dropout, and placement numbers do not reconcile before submission. Learner identifies who is affected and what could go wrong if the work is delayed or wrong. Explore - Learner studies the source data: department data files, ERP exports, attendance summaries, assessment results, dropout records, placement tracker. They mark trusted records, missing fields, conflicting entries, and items that need confirmation before using them in the artifact. Explain - Teach the main logic in simple terms: MIS data validation; Indicator definition; Reconciliation logic; Dashboard readiness; Exception notes; Submission control; Quality sampling; Coaching evidence; Process improvement loop. Level focus: quality review and coaching. Show how rules, evidence, decisions, and handoff notes connect in this workplace task. Express - Learner produces the L4 Education MIS Reporting Quality Review & Coaching Note using the case data, writes decisions in plain English, and shows evidence for each important field instead of giving only a theory answer. Empower - Learner uses AI only as a coach: ask for missing-field checks, clarity prompts, risk questions, and retry suggestions. AI should not create the final artifact for the learner. Evolve - Learner notes what would become harder at L5: more records, more conflicts, less guidance, stronger evidence expectations, and higher decision responsibility. Artifact to submit: L4 Education MIS Reporting Quality Review & Coaching Note. L4 Education MIS Reporting Quality Review & Coaching Note should contain: sample reviewed; quality error log; coaching observation; corrective example; handoff improvement note; follow-up action. Required source data: department data files, ERP exports, attendance summaries, assessment results, dropout records, placement tracker. Evidence fields: Assess whether review comments are specific, coaching is practical, error patterns are named, and the improved handoff reduces repeat mistakes. AI support: AI coach can ask: What source proves this? Which field is missing? What is the risk if this is wrong? Who owns the next action? Learner must answer using the case data, not guesses.',
  1,
  '20 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BCA
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-129' LIMIT 1),
  'BCA',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc IT
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-129' LIMIT 1),
  'B.Sc IT',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Com - Data Reporting
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-129' LIMIT 1),
  'B.Com - Data Reporting',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BBA Business Analytics
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-129' LIMIT 1),
  'BBA Business Analytics',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PG Diploma Education Data Analytics
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-129' LIMIT 1),
  'PG Diploma Education Data Analytics',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Government/NGO Program Tracking Quality Review, Coaching & Handoff Improvement
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Government/NGO Program Tracking Quality Review, Coaching & Handoff Improvement',
  'COURSE-L4-134',
  'Learner can review quality, coach others, and improve the handoff process for track government or ngo education programs through beneficiary, activity, utilization, and outcome evidence and submit a workplace-ready L4 Government/NGO Program Tracking Quality Review & Coaching Note. Workplace scenario: A team has already completed government/ngo program tracking work for 18 centres and 2,400 beneficiaries, but the supervisor sees repeated mistakes: attendance, activity evidence, budget use, outcome data, and donor reporting formats are incomplete. The learner must review sampled outputs, identify quality gaps, write coaching notes, and improve the handoff standard for the team. Learner artifact: L4 Government/NGO Program Tracking Quality Review & Coaching Note. Required data: centre reports, attendance registers, activity photos/logs, budget sheet, outcome tracker, donor format. Evidence: Assess whether review comments are specific, coaching is practical, error patterns are named, and the improved handoff reduces repeat mistakes.',
  '20 hours',
  'Active',
  'Education & Skilling',
  'technical',
  '["Triggered when a quality review and team improvement task needs a real workplace artifact, not a theory answer.","Demonstrates quality review and team improvement by producing and defending the L4 Government/NGO Program Tracking Quality Review & Coaching Note.","Learner can review quality, coach others, and improve the handoff process for track government or ngo education programs through beneficiary, activity, utilization, and outcome evidence and submit a workplace-ready L4 Government/NGO Program Tracking Quality Review & Coaching Note."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: Module 1: Government/NGO Program Tracking Quality Review, Coaching & Handoff Improvement Workplace Artifact Build
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-134' LIMIT 1),
  'Module 1: Government/NGO Program Tracking Quality Review, Coaching & Handoff Improvement Workplace Artifact Build',
  'Triggered when a quality review and team improvement task needs a real workplace artifact, not a theory answer. The learner studies the case, reviews the required data, identifies the gap, creates the artifact, and checks it against evidence fields.',
  1,
  '["Education & Skilling","IND-CAP-27","L4","Program monitoring","Beneficiary data tracking","Activity evidence control","Budget-output linkage","Donor report structure"]'::jsonb,
  '["Engage","Explore","Explain","Express","Empower","Evolve","Artifact Build","Evidence Review","AI-Coached Retry"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Case: Government/NGO Program Tracking Quality Review, Coaching & Handoff Improvement
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-134' LIMIT 1)
   AND title = 'Module 1: Government/NGO Program Tracking Quality Review, Coaching & Handoff Improvement Workplace Artifact Build' LIMIT 1),
  'Workplace Case: Government/NGO Program Tracking Quality Review, Coaching & Handoff Improvement',
  'A team has already completed government/ngo program tracking work for 18 centres and 2,400 beneficiaries, but the supervisor sees repeated mistakes: attendance, activity evidence, budget use, outcome data, and donor reporting formats are incomplete. The learner must review sampled outputs, identify quality gaps, write coaching notes, and improve the handoff standard for the team. The learner must solve the problem using the given data and produce the required workplace artifact.',
  'Workplace problem: A team has already completed government/ngo program tracking work for 18 centres and 2,400 beneficiaries, but the supervisor sees repeated mistakes: attendance, activity evidence, budget use, outcome data, and donor reporting formats are incomplete. The learner must review sampled outputs, identify quality gaps, write coaching notes, and improve the handoff standard for the team. Pressure points: Quality pressure: team members are repeating similar mistakes. Learner must detect error patterns, give usable coaching, and improve the next handoff without blaming individuals. Root cause focus: Identify repeated error types, weak review habits, unclear team instructions, missing examples, or lack of coaching follow-up. Major concepts: Program monitoring; Beneficiary data tracking; Activity evidence control; Budget-output linkage; Donor report structure; Risk and variance note; Quality sampling; Coaching evidence; Process improvement loop. Level focus: quality review and coaching. Required data: centre reports, attendance registers, activity photos/logs, budget sheet, outcome tracker, donor format Learner activity flow: Engage - Start with the case: 18 centres and 2,400 beneficiaries and the visible pain point — attendance, activity evidence, budget use, outcome data, and donor reporting formats are incomplete. Learner identifies who is affected and what could go wrong if the work is delayed or wrong. Explore - Learner studies the source data: centre reports, attendance registers, activity photos/logs, budget sheet, outcome tracker, donor format. They mark trusted records, missing fields, conflicting entries, and items that need confirmation before using them in the artifact. Explain - Teach the main logic in simple terms: Program monitoring; Beneficiary data tracking; Activity evidence control; Budget-output linkage; Donor report structure; Risk and variance note; Quality sampling; Coaching evidence; Process improvement loop. Level focus: quality review and coaching. Show how rules, evidence, decisions, and handoff notes connect in this workplace task. Express - Learner produces the L4 Government/NGO Program Tracking Quality Review & Coaching Note using the case data, writes decisions in plain English, and shows evidence for each important field instead of giving only a theory answer. Empower - Learner uses AI only as a coach: ask for missing-field checks, clarity prompts, risk questions, and retry suggestions. AI should not create the final artifact for the learner. Evolve - Learner notes what would become harder at L5: more records, more conflicts, less guidance, stronger evidence expectations, and higher decision responsibility. Artifact to submit: L4 Government/NGO Program Tracking Quality Review & Coaching Note. L4 Government/NGO Program Tracking Quality Review & Coaching Note should contain: sample reviewed; quality error log; coaching observation; corrective example; handoff improvement note; follow-up action. Required source data: centre reports, attendance registers, activity photos/logs, budget sheet, outcome tracker, donor format. Evidence fields: Assess whether review comments are specific, coaching is practical, error patterns are named, and the improved handoff reduces repeat mistakes. AI support: AI coach can ask: What source proves this? Which field is missing? What is the risk if this is wrong? Who owns the next action? Learner must answer using the case data, not guesses.',
  1,
  '20 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BSW - Community Development
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-134' LIMIT 1),
  'BSW - Community Development',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MSW - Education Programs
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-134' LIMIT 1),
  'MSW - Education Programs',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BA Public Administration
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-134' LIMIT 1),
  'BA Public Administration',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MA Development Studies
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-134' LIMIT 1),
  'MA Development Studies',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PG Diploma NGO Program Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-134' LIMIT 1),
  'PG Diploma NGO Program Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Research Publishing Coordination Quality Review, Coaching & Handoff Improvement
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Research Publishing Coordination Quality Review, Coaching & Handoff Improvement',
  'COURSE-L4-139',
  'Learner can review quality, coach others, and improve the handoff process for research and academic publishing cycles through study evidence, review workflow, and publication records and submit a workplace-ready L4 Research Publishing Coordination Quality Review & Coaching Note. Workplace scenario: A team has already completed research publishing coordination work for 22 manuscripts in review cycle, but the supervisor sees repeated mistakes: ethics approval, reviewer comments, author revisions, plagiarism checks, and publication status are scattered. The learner must review sampled outputs, identify quality gaps, write coaching notes, and improve the handoff standard for the team. Learner artifact: L4 Research Publishing Coordination Quality Review & Coaching Note. Required data: manuscript tracker, ethics approval, reviewer comments, revision files, plagiarism report, publication status log. Evidence: Assess whether review comments are specific, coaching is practical, error patterns are named, and the improved handoff reduces repeat mistakes.',
  '20 hours',
  'Active',
  'Education & Skilling',
  'technical',
  '["Triggered when a quality review and team improvement task needs a real workplace artifact, not a theory answer.","Demonstrates quality review and team improvement by producing and defending the L4 Research Publishing Coordination Quality Review & Coaching Note.","Learner can review quality, coach others, and improve the handoff process for research and academic publishing cycles through study evidence, review workflow, and publication records and submit a workplace-ready L4 Research Publishing Coordination Quality Review & Coaching Note."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: Module 1: Research Publishing Coordination Quality Review, Coaching & Handoff Improvement Workplace Artifact Build
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-139' LIMIT 1),
  'Module 1: Research Publishing Coordination Quality Review, Coaching & Handoff Improvement Workplace Artifact Build',
  'Triggered when a quality review and team improvement task needs a real workplace artifact, not a theory answer. The learner studies the case, reviews the required data, identifies the gap, creates the artifact, and checks it against evidence fields.',
  1,
  '["Education & Skilling","IND-CAP-28","L4","Research workflow tracking","Ethics and compliance check","Peer-review status control","Revision evidence","Publication record management"]'::jsonb,
  '["Engage","Explore","Explain","Express","Empower","Evolve","Artifact Build","Evidence Review","AI-Coached Retry"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Case: Research Publishing Coordination Quality Review, Coaching & Handoff Improvement
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-139' LIMIT 1)
   AND title = 'Module 1: Research Publishing Coordination Quality Review, Coaching & Handoff Improvement Workplace Artifact Build' LIMIT 1),
  'Workplace Case: Research Publishing Coordination Quality Review, Coaching & Handoff Improvement',
  'A team has already completed research publishing coordination work for 22 manuscripts in review cycle, but the supervisor sees repeated mistakes: ethics approval, reviewer comments, author revisions, plagiarism checks, and publication status are scattered. The learner must review sampled outputs, identify quality gaps, write coaching notes, and improve the handoff standard for the team. The learner must solve the problem using the given data and produce the required workplace artifact.',
  'Workplace problem: A team has already completed research publishing coordination work for 22 manuscripts in review cycle, but the supervisor sees repeated mistakes: ethics approval, reviewer comments, author revisions, plagiarism checks, and publication status are scattered. The learner must review sampled outputs, identify quality gaps, write coaching notes, and improve the handoff standard for the team. Pressure points: Quality pressure: team members are repeating similar mistakes. Learner must detect error patterns, give usable coaching, and improve the next handoff without blaming individuals. Root cause focus: Identify repeated error types, weak review habits, unclear team instructions, missing examples, or lack of coaching follow-up. Major concepts: Research workflow tracking; Ethics and compliance check; Peer-review status control; Revision evidence; Publication record management; Author communication; Quality sampling; Coaching evidence; Process improvement loop. Level focus: quality review and coaching. Required data: manuscript tracker, ethics approval, reviewer comments, revision files, plagiarism report, publication status log Learner activity flow: Engage - Start with the case: 22 manuscripts in review cycle and the visible pain point — ethics approval, reviewer comments, author revisions, plagiarism checks, and publication status are scattered. Learner identifies who is affected and what could go wrong if the work is delayed or wrong. Explore - Learner studies the source data: manuscript tracker, ethics approval, reviewer comments, revision files, plagiarism report, publication status log. They mark trusted records, missing fields, conflicting entries, and items that need confirmation before using them in the artifact. Explain - Teach the main logic in simple terms: Research workflow tracking; Ethics and compliance check; Peer-review status control; Revision evidence; Publication record management; Author communication; Quality sampling; Coaching evidence; Process improvement loop. Level focus: quality review and coaching. Show how rules, evidence, decisions, and handoff notes connect in this workplace task. Express - Learner produces the L4 Research Publishing Coordination Quality Review & Coaching Note using the case data, writes decisions in plain English, and shows evidence for each important field instead of giving only a theory answer. Empower - Learner uses AI only as a coach: ask for missing-field checks, clarity prompts, risk questions, and retry suggestions. AI should not create the final artifact for the learner. Evolve - Learner notes what would become harder at L5: more records, more conflicts, less guidance, stronger evidence expectations, and higher decision responsibility. Artifact to submit: L4 Research Publishing Coordination Quality Review & Coaching Note. L4 Research Publishing Coordination Quality Review & Coaching Note should contain: sample reviewed; quality error log; coaching observation; corrective example; handoff improvement note; follow-up action. Required source data: manuscript tracker, ethics approval, reviewer comments, revision files, plagiarism report, publication status log. Evidence fields: Assess whether review comments are specific, coaching is practical, error patterns are named, and the improved handoff reduces repeat mistakes. AI support: AI coach can ask: What source proves this? Which field is missing? What is the risk if this is wrong? Who owns the next action? Learner must answer using the case data, not guesses.',
  1,
  '20 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BA Education
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-139' LIMIT 1),
  'BA Education',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MA Education
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-139' LIMIT 1),
  'MA Education',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Ed Research Methods
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-139' LIMIT 1),
  'M.Ed Research Methods',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PG Diploma Research Methodology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-139' LIMIT 1),
  'PG Diploma Research Methodology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PhD Coursework - Education Research
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-139' LIMIT 1),
  'PhD Coursework - Education Research',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Cohort Scheduling SOP Audit, Trend Analysis & Governance Report
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Cohort Scheduling SOP Audit, Trend Analysis & Governance Report',
  'COURSE-L5-005',
  'Learner can audit patterns, find control gaps, and recommend governance improvements for cohort session schedules from calendar, facilitator, learner, and resource constraints and submit a workplace-ready L5 Cohort Scheduling SOP Audit & Improvement Report. Workplace scenario: Institution leaders are reviewing one month of cohort scheduling work covering 240 learners across 3 batches. The audit shows possible pattern-level risk because two facilitators are unavailable, one lab is double-booked, 18 learners were added late, and a holiday was missed. The learner must analyse trends, locate control gaps, and recommend SOP or dashboard improvements with evidence. Learner artifact: L5 Cohort Scheduling SOP Audit & Improvement Report. Required data: academic calendar, facilitator roster, room/lab tracker, batch list, holiday calendar, session duration rules, approval notes. Evidence: Assess whether the audit uses trend evidence, identifies real control gaps, rates risk clearly, and recommends realistic SOP/dashboard/governance improvements.',
  '25 hours',
  'Active',
  'Formal Education & Lifelong Learning Delivery',
  'technical',
  '["Triggered when an audit, trend analysis and governance improvement task needs a real workplace artifact, not a theory answer.","Demonstrates audit, trend analysis and governance improvement by producing and defending the L5 Cohort Scheduling SOP Audit & Improvement Report.","Learner can audit patterns, find control gaps, and recommend governance improvements for cohort session schedules from calendar, facilitator, learner, and resource constraints and submit a workplace-ready L5 Cohort Scheduling SOP Audit & Improvement Report."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: Module 1: Cohort Scheduling SOP Audit, Trend Analysis & Governance Report Workplace Artifact Build
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-005' LIMIT 1),
  'Module 1: Cohort Scheduling SOP Audit, Trend Analysis & Governance Report Workplace Artifact Build',
  'Triggered when an audit, trend analysis and governance improvement task needs a real workplace artifact, not a theory answer. The learner studies the case, reviews the required data, identifies the gap, creates the artifact, and checks it against evidence fields.',
  1,
  '["Education & Skilling","Formal Education & Lifelong Learning Delivery","IND-CAP-01","L5","Academic calendar logic","Batch-wise timetable sequencing","Facilitator availability check","Room and resource constraint mapping","Conflict log and priority rules"]'::jsonb,
  '["Engage","Explore","Explain","Express","Empower","Evolve","Artifact Build","Evidence Review","AI-Coached Retry"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Case: Cohort Scheduling SOP Audit, Trend Analysis & Governance Report
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-005' LIMIT 1)
   AND title = 'Module 1: Cohort Scheduling SOP Audit, Trend Analysis & Governance Report Workplace Artifact Build' LIMIT 1),
  'Workplace Case: Cohort Scheduling SOP Audit, Trend Analysis & Governance Report',
  'Institution leaders are reviewing one month of cohort scheduling work covering 240 learners across 3 batches. The audit shows possible pattern-level risk because two facilitators are unavailable, one lab is double-booked, 18 learners were added late, and a holiday was missed. The learner must analyse trends, locate control gaps, and recommend SOP or dashboard improvements with evidence. The learner must solve the problem using the given data and produce the required workplace artifact.',
  'Workplace problem: Institution leaders are reviewing one month of cohort scheduling work covering 240 learners across 3 batches. The audit shows possible pattern-level risk because two facilitators are unavailable, one lab is double-booked, 18 learners were added late, and a holiday was missed. The learner must analyse trends, locate control gaps, and recommend SOP or dashboard improvements with evidence. Pressure points: Governance pressure: leaders need evidence of control, not opinions. Learner must connect trend data, policy gaps, repeated errors, and improvement recommendations. Root cause focus: Trace pattern-level causes: weak SOP control, missing dashboard indicator, repeated ownership gap, unclear policy rule, or lack of audit trail. Major concepts: Academic calendar logic; Batch-wise timetable sequencing; Facilitator availability check; Room and resource constraint mapping; Conflict log and priority rules; Schedule release handoff; Trend analysis; Control gap analysis; Governance recommendation. Level focus: audit, governance, and improvement. Required data: academic calendar, facilitator roster, room/lab tracker, batch list, holiday calendar, session duration rules, approval notes Learner activity flow: Engage - Start with the case: 240 learners across 3 batches and the visible pain point — two facilitators are unavailable, one lab is double-booked, 18 learners were added late, and a holiday was missed. Learner identifies who is affected and what could go wrong if the work is delayed or wrong. Explore - Learner studies the source data: academic calendar, facilitator roster, room/lab tracker, batch list, holiday calendar, session duration rules, approval notes. They mark trusted records, missing fields, conflicting entries, and items that need confirmation before using them in the artifact. Explain - Teach the main logic in simple terms: Academic calendar logic; Batch-wise timetable sequencing; Facilitator availability check; Room and resource constraint mapping; Conflict log and priority rules; Schedule release handoff; Trend analysis; Control gap analysis; Governance recommendation. Level focus: audit, governance, and improvement. Show how rules, evidence, decisions, and handoff notes connect in this workplace task. Express - Learner produces the L5 Cohort Scheduling SOP Audit & Improvement Report using the case data, writes decisions in plain English, and shows evidence for each important field instead of giving only a theory answer. Empower - Learner uses AI only as a coach: ask for missing-field checks, clarity prompts, risk questions, and retry suggestions. AI should not create the final artifact for the learner. Evolve - Learner reflects on how the audit recommendation can improve SOP, dashboard control, staff training, or governance review for future cycles. Artifact to submit: L5 Cohort Scheduling SOP Audit & Improvement Report. L5 Cohort Scheduling SOP Audit & Improvement Report should contain: audit sample; trend table; control-gap finding; risk rating; SOP/dashboard recommendation; governance closure note. Required source data: academic calendar, facilitator roster, room/lab tracker, batch list, holiday calendar, session duration rules, approval notes. Evidence fields: Assess whether the audit uses trend evidence, identifies real control gaps, rates risk clearly, and recommends realistic SOP/dashboard/governance improvements. AI support: AI coach can ask: What source proves this? Which field is missing? What is the risk if this is wrong? Who owns the next action? Learner must answer using the case data, not guesses.',
  1,
  '25 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Ed - School Education
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-005' LIMIT 1),
  'B.Ed - School Education',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Ed - Education Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-005' LIMIT 1),
  'M.Ed - Education Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BA Education
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-005' LIMIT 1),
  'BA Education',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BBA Education Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-005' LIMIT 1),
  'BBA Education Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PG Diploma Education Administration
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-005' LIMIT 1),
  'PG Diploma Education Administration',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Learner Progression SOP Audit, Trend Analysis & Governance Report
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Learner Progression SOP Audit, Trend Analysis & Governance Report',
  'COURSE-L5-010',
  'Learner can audit patterns, find control gaps, and recommend governance improvements for learner progression decisions using attendance, assessment, and participation evidence and submit a workplace-ready L5 Learner Progression SOP Audit & Improvement Report. Workplace scenario: Institution leaders are reviewing one month of learner progression work covering 126 learners at module-end review. The audit shows possible pattern-level risk because attendance, assessment marks, project submissions, and remedial records do not match for 31 learners. The learner must analyse trends, locate control gaps, and recommend SOP or dashboard improvements with evidence. Learner artifact: L5 Learner Progression SOP Audit & Improvement Report. Required data: attendance sheet, assessment scores, project submission tracker, remediation log, progression criteria, mentor comments. Evidence: Assess whether the audit uses trend evidence, identifies real control gaps, rates risk clearly, and recommends realistic SOP/dashboard/governance improvements.',
  '25 hours',
  'Active',
  'Formal Education & Lifelong Learning Delivery',
  'technical',
  '["Triggered when an audit, trend analysis and governance improvement task needs a real workplace artifact, not a theory answer.","Demonstrates audit, trend analysis and governance improvement by producing and defending the L5 Learner Progression SOP Audit & Improvement Report.","Learner can audit patterns, find control gaps, and recommend governance improvements for learner progression decisions using attendance, assessment, and participation evidence and submit a workplace-ready L5 Learner Progression SOP Audit & Improvement Report."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: Module 1: Learner Progression SOP Audit, Trend Analysis & Governance Report Workplace Artifact Build
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-010' LIMIT 1),
  'Module 1: Learner Progression SOP Audit, Trend Analysis & Governance Report Workplace Artifact Build',
  'Triggered when an audit, trend analysis and governance improvement task needs a real workplace artifact, not a theory answer. The learner studies the case, reviews the required data, identifies the gap, creates the artifact, and checks it against evidence fields.',
  1,
  '["Education & Skilling","Formal Education & Lifelong Learning Delivery","IND-CAP-02","L5","Progression rule interpretation","Evidence-based learner routing","Attendance and assessment thresholds","Remediation decision logic","Status tagging"]'::jsonb,
  '["Engage","Explore","Explain","Express","Empower","Evolve","Artifact Build","Evidence Review","AI-Coached Retry"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Case: Learner Progression SOP Audit, Trend Analysis & Governance Report
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-010' LIMIT 1)
   AND title = 'Module 1: Learner Progression SOP Audit, Trend Analysis & Governance Report Workplace Artifact Build' LIMIT 1),
  'Workplace Case: Learner Progression SOP Audit, Trend Analysis & Governance Report',
  'Institution leaders are reviewing one month of learner progression work covering 126 learners at module-end review. The audit shows possible pattern-level risk because attendance, assessment marks, project submissions, and remedial records do not match for 31 learners. The learner must analyse trends, locate control gaps, and recommend SOP or dashboard improvements with evidence. The learner must solve the problem using the given data and produce the required workplace artifact.',
  'Workplace problem: Institution leaders are reviewing one month of learner progression work covering 126 learners at module-end review. The audit shows possible pattern-level risk because attendance, assessment marks, project submissions, and remedial records do not match for 31 learners. The learner must analyse trends, locate control gaps, and recommend SOP or dashboard improvements with evidence. Pressure points: Governance pressure: leaders need evidence of control, not opinions. Learner must connect trend data, policy gaps, repeated errors, and improvement recommendations. Root cause focus: Trace pattern-level causes: weak SOP control, missing dashboard indicator, repeated ownership gap, unclear policy rule, or lack of audit trail. Major concepts: Progression rule interpretation; Evidence-based learner routing; Attendance and assessment thresholds; Remediation decision logic; Status tagging; Learner handoff note; Trend analysis; Control gap analysis; Governance recommendation. Level focus: audit, governance, and improvement. Required data: attendance sheet, assessment scores, project submission tracker, remediation log, progression criteria, mentor comments Learner activity flow: Engage - Start with the case: 126 learners at module-end review and the visible pain point — attendance, assessment marks, project submissions, and remedial records do not match for 31 learners. Learner identifies who is affected and what could go wrong if the work is delayed or wrong. Explore - Learner studies the source data: attendance sheet, assessment scores, project submission tracker, remediation log, progression criteria, mentor comments. They mark trusted records, missing fields, conflicting entries, and items that need confirmation before using them in the artifact. Explain - Teach the main logic in simple terms: Progression rule interpretation; Evidence-based learner routing; Attendance and assessment thresholds; Remediation decision logic; Status tagging; Learner handoff note; Trend analysis; Control gap analysis; Governance recommendation. Level focus: audit, governance, and improvement. Show how rules, evidence, decisions, and handoff notes connect in this workplace task. Express - Learner produces the L5 Learner Progression SOP Audit & Improvement Report using the case data, writes decisions in plain English, and shows evidence for each important field instead of giving only a theory answer. Empower - Learner uses AI only as a coach: ask for missing-field checks, clarity prompts, risk questions, and retry suggestions. AI should not create the final artifact for the learner. Evolve - Learner reflects on how the audit recommendation can improve SOP, dashboard control, staff training, or governance review for future cycles. Artifact to submit: L5 Learner Progression SOP Audit & Improvement Report. L5 Learner Progression SOP Audit & Improvement Report should contain: audit sample; trend table; control-gap finding; risk rating; SOP/dashboard recommendation; governance closure note. Required source data: attendance sheet, assessment scores, project submission tracker, remediation log, progression criteria, mentor comments. Evidence fields: Assess whether the audit uses trend evidence, identifies real control gaps, rates risk clearly, and recommends realistic SOP/dashboard/governance improvements. AI support: AI coach can ask: What source proves this? Which field is missing? What is the risk if this is wrong? Who owns the next action? Learner must answer using the case data, not guesses.',
  1,
  '25 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Ed - School Education
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-010' LIMIT 1),
  'B.Ed - School Education',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Ed - Education Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-010' LIMIT 1),
  'M.Ed - Education Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BA Education
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-010' LIMIT 1),
  'BA Education',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MA Education
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-010' LIMIT 1),
  'MA Education',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Voc Education Operations
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-010' LIMIT 1),
  'B.Voc Education Operations',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Academic Record Activation SOP Audit, Trend Analysis & Governance Report
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Academic Record Activation SOP Audit, Trend Analysis & Governance Report',
  'COURSE-L5-015',
  'Learner can audit patterns, find control gaps, and recommend governance improvements for learner academic records through eligibility, program-rule, and enrollment verification and submit a workplace-ready L5 Academic Record Activation SOP Audit & Improvement Report. Workplace scenario: Institution leaders are reviewing one month of academic record activation work covering 180 admitted learners before orientation. The audit shows possible pattern-level risk because 24 eligibility documents are missing, 11 program codes are wrong, and fee-status updates are not synced in the ERP. The learner must analyse trends, locate control gaps, and recommend SOP or dashboard improvements with evidence. Learner artifact: L5 Academic Record Activation SOP Audit & Improvement Report. Required data: eligibility documents, program rules, enrollment forms, ID proof, fee-status sheet, ERP fields, approval trail. Evidence: Assess whether the audit uses trend evidence, identifies real control gaps, rates risk clearly, and recommends realistic SOP/dashboard/governance improvements.',
  '25 hours',
  'Active',
  'Formal Education & Lifelong Learning Delivery',
  'technical',
  '["Triggered when an audit, trend analysis and governance improvement task needs a real workplace artifact, not a theory answer.","Demonstrates audit, trend analysis and governance improvement by producing and defending the L5 Academic Record Activation SOP Audit & Improvement Report.","Learner can audit patterns, find control gaps, and recommend governance improvements for learner academic records through eligibility, program-rule, and enrollment verification and submit a workplace-ready L5 Academic Record Activation SOP Audit & Improvement Report."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: Module 1: Academic Record Activation SOP Audit, Trend Analysis & Governance Report Workplace Artifact Build
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-015' LIMIT 1),
  'Module 1: Academic Record Activation SOP Audit, Trend Analysis & Governance Report Workplace Artifact Build',
  'Triggered when an audit, trend analysis and governance improvement task needs a real workplace artifact, not a theory answer. The learner studies the case, reviews the required data, identifies the gap, creates the artifact, and checks it against evidence fields.',
  1,
  '["Education & Skilling","Formal Education & Lifelong Learning Delivery","IND-CAP-03","L5","Eligibility verification","Program-rule mapping","Enrollment status control","ERP field accuracy","Missing-document tracking"]'::jsonb,
  '["Engage","Explore","Explain","Express","Empower","Evolve","Artifact Build","Evidence Review","AI-Coached Retry"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Case: Academic Record Activation SOP Audit, Trend Analysis & Governance Report
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-015' LIMIT 1)
   AND title = 'Module 1: Academic Record Activation SOP Audit, Trend Analysis & Governance Report Workplace Artifact Build' LIMIT 1),
  'Workplace Case: Academic Record Activation SOP Audit, Trend Analysis & Governance Report',
  'Institution leaders are reviewing one month of academic record activation work covering 180 admitted learners before orientation. The audit shows possible pattern-level risk because 24 eligibility documents are missing, 11 program codes are wrong, and fee-status updates are not synced in the ERP. The learner must analyse trends, locate control gaps, and recommend SOP or dashboard improvements with evidence. The learner must solve the problem using the given data and produce the required workplace artifact.',
  'Workplace problem: Institution leaders are reviewing one month of academic record activation work covering 180 admitted learners before orientation. The audit shows possible pattern-level risk because 24 eligibility documents are missing, 11 program codes are wrong, and fee-status updates are not synced in the ERP. The learner must analyse trends, locate control gaps, and recommend SOP or dashboard improvements with evidence. Pressure points: Governance pressure: leaders need evidence of control, not opinions. Learner must connect trend data, policy gaps, repeated errors, and improvement recommendations. Root cause focus: Trace pattern-level causes: weak SOP control, missing dashboard indicator, repeated ownership gap, unclear policy rule, or lack of audit trail. Major concepts: Eligibility verification; Program-rule mapping; Enrollment status control; ERP field accuracy; Missing-document tracking; Activation approval handoff; Trend analysis; Control gap analysis; Governance recommendation. Level focus: audit, governance, and improvement. Required data: eligibility documents, program rules, enrollment forms, ID proof, fee-status sheet, ERP fields, approval trail Learner activity flow: Engage - Start with the case: 180 admitted learners before orientation and the visible pain point — 24 eligibility documents are missing, 11 program codes are wrong, and fee-status updates are not synced in the ERP. Learner identifies who is affected and what could go wrong if the work is delayed or wrong. Explore - Learner studies the source data: eligibility documents, program rules, enrollment forms, ID proof, fee-status sheet, ERP fields, approval trail. They mark trusted records, missing fields, conflicting entries, and items that need confirmation before using them in the artifact. Explain - Teach the main logic in simple terms: Eligibility verification; Program-rule mapping; Enrollment status control; ERP field accuracy; Missing-document tracking; Activation approval handoff; Trend analysis; Control gap analysis; Governance recommendation. Level focus: audit, governance, and improvement. Show how rules, evidence, decisions, and handoff notes connect in this workplace task. Express - Learner produces the L5 Academic Record Activation SOP Audit & Improvement Report using the case data, writes decisions in plain English, and shows evidence for each important field instead of giving only a theory answer. Empower - Learner uses AI only as a coach: ask for missing-field checks, clarity prompts, risk questions, and retry suggestions. AI should not create the final artifact for the learner. Evolve - Learner reflects on how the audit recommendation can improve SOP, dashboard control, staff training, or governance review for future cycles. Artifact to submit: L5 Academic Record Activation SOP Audit & Improvement Report. L5 Academic Record Activation SOP Audit & Improvement Report should contain: audit sample; trend table; control-gap finding; risk rating; SOP/dashboard recommendation; governance closure note. Required source data: eligibility documents, program rules, enrollment forms, ID proof, fee-status sheet, ERP fields, approval trail. Evidence fields: Assess whether the audit uses trend evidence, identifies real control gaps, rates risk clearly, and recommends realistic SOP/dashboard/governance improvements. AI support: AI coach can ask: What source proves this? Which field is missing? What is the risk if this is wrong? Who owns the next action? Learner must answer using the case data, not guesses.',
  1,
  '25 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BBA Education Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-015' LIMIT 1),
  'BBA Education Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Com - Education Administration
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-015' LIMIT 1),
  'B.Com - Education Administration',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BA Public Administration
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-015' LIMIT 1),
  'BA Public Administration',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MBA Education Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-015' LIMIT 1),
  'MBA Education Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PG Diploma Higher Education Administration
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-015' LIMIT 1),
  'PG Diploma Higher Education Administration',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Adult Learner Pathway SOP Audit, Trend Analysis & Governance Report
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Adult Learner Pathway SOP Audit, Trend Analysis & Governance Report',
  'COURSE-L5-020',
  'Learner can audit patterns, find control gaps, and recommend governance improvements for adult learner pathways from goals, prior learning, access constraints, and progress evidence and submit a workplace-ready L5 Adult Learner Pathway SOP Audit & Improvement Report. Workplace scenario: Institution leaders are reviewing one month of adult learner pathway work covering 64 working adult learners. The audit shows possible pattern-level risk because learners have mixed prior learning, different shift timings, low device access, and unclear career goals. The learner must analyse trends, locate control gaps, and recommend SOP or dashboard improvements with evidence. Learner artifact: L5 Adult Learner Pathway SOP Audit & Improvement Report. Required data: learner goal form, prior learning proof, schedule constraints, device/access survey, language comfort data, course options. Evidence: Assess whether the audit uses trend evidence, identifies real control gaps, rates risk clearly, and recommends realistic SOP/dashboard/governance improvements.',
  '25 hours',
  'Active',
  'Formal Education & Lifelong Learning Delivery',
  'soft',
  '["Triggered when an audit, trend analysis and governance improvement task needs a real workplace artifact, not a theory answer.","Demonstrates audit, trend analysis and governance improvement by producing and defending the L5 Adult Learner Pathway SOP Audit & Improvement Report.","Learner can audit patterns, find control gaps, and recommend governance improvements for adult learner pathways from goals, prior learning, access constraints, and progress evidence and submit a workplace-ready L5 Adult Learner Pathway SOP Audit & Improvement Report."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: Module 1: Adult Learner Pathway SOP Audit, Trend Analysis & Governance Report Workplace Artifact Build
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-020' LIMIT 1),
  'Module 1: Adult Learner Pathway SOP Audit, Trend Analysis & Governance Report Workplace Artifact Build',
  'Triggered when an audit, trend analysis and governance improvement task needs a real workplace artifact, not a theory answer. The learner studies the case, reviews the required data, identifies the gap, creates the artifact, and checks it against evidence fields.',
  1,
  '["Education & Skilling","Formal Education & Lifelong Learning Delivery","IND-CAP-04","L5","Recognition of prior learning","Flexible pathway planning","Access constraint mapping","Adult motivation factors","Goal-to-course alignment"]'::jsonb,
  '["Engage","Explore","Explain","Express","Empower","Evolve","Artifact Build","Evidence Review","AI-Coached Retry"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Case: Adult Learner Pathway SOP Audit, Trend Analysis & Governance Report
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-020' LIMIT 1)
   AND title = 'Module 1: Adult Learner Pathway SOP Audit, Trend Analysis & Governance Report Workplace Artifact Build' LIMIT 1),
  'Workplace Case: Adult Learner Pathway SOP Audit, Trend Analysis & Governance Report',
  'Institution leaders are reviewing one month of adult learner pathway work covering 64 working adult learners. The audit shows possible pattern-level risk because learners have mixed prior learning, different shift timings, low device access, and unclear career goals. The learner must analyse trends, locate control gaps, and recommend SOP or dashboard improvements with evidence. The learner must solve the problem using the given data and produce the required workplace artifact.',
  'Workplace problem: Institution leaders are reviewing one month of adult learner pathway work covering 64 working adult learners. The audit shows possible pattern-level risk because learners have mixed prior learning, different shift timings, low device access, and unclear career goals. The learner must analyse trends, locate control gaps, and recommend SOP or dashboard improvements with evidence. Pressure points: Governance pressure: leaders need evidence of control, not opinions. Learner must connect trend data, policy gaps, repeated errors, and improvement recommendations. Root cause focus: Trace pattern-level causes: weak SOP control, missing dashboard indicator, repeated ownership gap, unclear policy rule, or lack of audit trail. Major concepts: Recognition of prior learning; Flexible pathway planning; Access constraint mapping; Adult motivation factors; Goal-to-course alignment; Support routing; Trend analysis; Control gap analysis; Governance recommendation. Level focus: audit, governance, and improvement. Required data: learner goal form, prior learning proof, schedule constraints, device/access survey, language comfort data, course options Learner activity flow: Engage - Start with the case: 64 working adult learners and the visible pain point — learners have mixed prior learning, different shift timings, low device access, and unclear career goals. Learner identifies who is affected and what could go wrong if the work is delayed or wrong. Explore - Learner studies the source data: learner goal form, prior learning proof, schedule constraints, device/access survey, language comfort data, course options. They mark trusted records, missing fields, conflicting entries, and items that need confirmation before using them in the artifact. Explain - Teach the main logic in simple terms: Recognition of prior learning; Flexible pathway planning; Access constraint mapping; Adult motivation factors; Goal-to-course alignment; Support routing; Trend analysis; Control gap analysis; Governance recommendation. Level focus: audit, governance, and improvement. Show how rules, evidence, decisions, and handoff notes connect in this workplace task. Express - Learner produces the L5 Adult Learner Pathway SOP Audit & Improvement Report using the case data, writes decisions in plain English, and shows evidence for each important field instead of giving only a theory answer. Empower - Learner uses AI only as a coach: ask for missing-field checks, clarity prompts, risk questions, and retry suggestions. AI should not create the final artifact for the learner. Evolve - Learner reflects on how the audit recommendation can improve SOP, dashboard control, staff training, or governance review for future cycles. Artifact to submit: L5 Adult Learner Pathway SOP Audit & Improvement Report. L5 Adult Learner Pathway SOP Audit & Improvement Report should contain: audit sample; trend table; control-gap finding; risk rating; SOP/dashboard recommendation; governance closure note. Required source data: learner goal form, prior learning proof, schedule constraints, device/access survey, language comfort data, course options. Evidence fields: Assess whether the audit uses trend evidence, identifies real control gaps, rates risk clearly, and recommends realistic SOP/dashboard/governance improvements. AI support: AI coach can ask: What source proves this? Which field is missing? What is the risk if this is wrong? Who owns the next action? Learner must answer using the case data, not guesses.',
  1,
  '25 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BA Education
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-020' LIMIT 1),
  'BA Education',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MA Adult Education
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-020' LIMIT 1),
  'MA Adult Education',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BSW - Community Education
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-020' LIMIT 1),
  'BSW - Community Education',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Voc Skill Development
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-020' LIMIT 1),
  'B.Voc Skill Development',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PG Diploma Lifelong Learning
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-020' LIMIT 1),
  'PG Diploma Lifelong Learning',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Curriculum Mapping SOP Audit, Trend Analysis & Governance Report
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Curriculum Mapping SOP Audit, Trend Analysis & Governance Report',
  'COURSE-L5-025',
  'Learner can audit patterns, find control gaps, and recommend governance improvements for translate standards and role outcomes into curriculum maps, learning sequences, and alignment boundaries and submit a workplace-ready L5 Curriculum Mapping SOP Audit & Improvement Report. Workplace scenario: Institution leaders are reviewing one month of curriculum mapping work covering 6 modules and 42 lesson activities. The audit shows possible pattern-level risk because learning outcomes, activities, assessments, and workplace evidence do not clearly connect. The learner must analyse trends, locate control gaps, and recommend SOP or dashboard improvements with evidence. Learner artifact: L5 Curriculum Mapping SOP Audit & Improvement Report. Required data: syllabus, module outcomes, activity list, assessment plan, competency requirements, evidence expectations. Evidence: Assess whether the audit uses trend evidence, identifies real control gaps, rates risk clearly, and recommends realistic SOP/dashboard/governance improvements.',
  '25 hours',
  'Active',
  'Curriculum, Pedagogy & Learning Design',
  'technical',
  '["Triggered when an audit, trend analysis and governance improvement task needs a real workplace artifact, not a theory answer.","Demonstrates audit, trend analysis and governance improvement by producing and defending the L5 Curriculum Mapping SOP Audit & Improvement Report.","Learner can audit patterns, find control gaps, and recommend governance improvements for translate standards and role outcomes into curriculum maps, learning sequences, and alignment boundaries and submit a workplace-ready L5 Curriculum Mapping SOP Audit & Improvement Report."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: Module 1: Curriculum Mapping SOP Audit, Trend Analysis & Governance Report Workplace Artifact Build
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-025' LIMIT 1),
  'Module 1: Curriculum Mapping SOP Audit, Trend Analysis & Governance Report Workplace Artifact Build',
  'Triggered when an audit, trend analysis and governance improvement task needs a real workplace artifact, not a theory answer. The learner studies the case, reviews the required data, identifies the gap, creates the artifact, and checks it against evidence fields.',
  1,
  '["Education & Skilling","Curriculum, Pedagogy & Learning Design","IND-CAP-05","L5","Outcome mapping","Constructive alignment","Competency-to-activity link","Assessment coverage check","Gap identification"]'::jsonb,
  '["Engage","Explore","Explain","Express","Empower","Evolve","Artifact Build","Evidence Review","AI-Coached Retry"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Case: Curriculum Mapping SOP Audit, Trend Analysis & Governance Report
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-025' LIMIT 1)
   AND title = 'Module 1: Curriculum Mapping SOP Audit, Trend Analysis & Governance Report Workplace Artifact Build' LIMIT 1),
  'Workplace Case: Curriculum Mapping SOP Audit, Trend Analysis & Governance Report',
  'Institution leaders are reviewing one month of curriculum mapping work covering 6 modules and 42 lesson activities. The audit shows possible pattern-level risk because learning outcomes, activities, assessments, and workplace evidence do not clearly connect. The learner must analyse trends, locate control gaps, and recommend SOP or dashboard improvements with evidence. The learner must solve the problem using the given data and produce the required workplace artifact.',
  'Workplace problem: Institution leaders are reviewing one month of curriculum mapping work covering 6 modules and 42 lesson activities. The audit shows possible pattern-level risk because learning outcomes, activities, assessments, and workplace evidence do not clearly connect. The learner must analyse trends, locate control gaps, and recommend SOP or dashboard improvements with evidence. Pressure points: Governance pressure: leaders need evidence of control, not opinions. Learner must connect trend data, policy gaps, repeated errors, and improvement recommendations. Root cause focus: Trace pattern-level causes: weak SOP control, missing dashboard indicator, repeated ownership gap, unclear policy rule, or lack of audit trail. Major concepts: Outcome mapping; Constructive alignment; Competency-to-activity link; Assessment coverage check; Gap identification; Curriculum evidence map; Trend analysis; Control gap analysis; Governance recommendation. Level focus: audit, governance, and improvement. Required data: syllabus, module outcomes, activity list, assessment plan, competency requirements, evidence expectations Learner activity flow: Engage - Start with the case: 6 modules and 42 lesson activities and the visible pain point — learning outcomes, activities, assessments, and workplace evidence do not clearly connect. Learner identifies who is affected and what could go wrong if the work is delayed or wrong. Explore - Learner studies the source data: syllabus, module outcomes, activity list, assessment plan, competency requirements, evidence expectations. They mark trusted records, missing fields, conflicting entries, and items that need confirmation before using them in the artifact. Explain - Teach the main logic in simple terms: Outcome mapping; Constructive alignment; Competency-to-activity link; Assessment coverage check; Gap identification; Curriculum evidence map; Trend analysis; Control gap analysis; Governance recommendation. Level focus: audit, governance, and improvement. Show how rules, evidence, decisions, and handoff notes connect in this workplace task. Express - Learner produces the L5 Curriculum Mapping SOP Audit & Improvement Report using the case data, writes decisions in plain English, and shows evidence for each important field instead of giving only a theory answer. Empower - Learner uses AI only as a coach: ask for missing-field checks, clarity prompts, risk questions, and retry suggestions. AI should not create the final artifact for the learner. Evolve - Learner reflects on how the audit recommendation can improve SOP, dashboard control, staff training, or governance review for future cycles. Artifact to submit: L5 Curriculum Mapping SOP Audit & Improvement Report. L5 Curriculum Mapping SOP Audit & Improvement Report should contain: audit sample; trend table; control-gap finding; risk rating; SOP/dashboard recommendation; governance closure note. Required source data: syllabus, module outcomes, activity list, assessment plan, competency requirements, evidence expectations. Evidence fields: Assess whether the audit uses trend evidence, identifies real control gaps, rates risk clearly, and recommends realistic SOP/dashboard/governance improvements. AI support: AI coach can ask: What source proves this? Which field is missing? What is the risk if this is wrong? Who owns the next action? Learner must answer using the case data, not guesses.',
  1,
  '25 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Ed - Curriculum Studies
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-025' LIMIT 1),
  'B.Ed - Curriculum Studies',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Ed - Curriculum and Instruction
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-025' LIMIT 1),
  'M.Ed - Curriculum and Instruction',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BA Education
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-025' LIMIT 1),
  'BA Education',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MA Education
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-025' LIMIT 1),
  'MA Education',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PG Diploma Instructional Design
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-025' LIMIT 1),
  'PG Diploma Instructional Design',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: e-learning Content Release SOP Audit, Trend Analysis & Governance Report
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'e-learning Content Release SOP Audit, Trend Analysis & Governance Report',
  'COURSE-L5-030',
  'Learner can audit patterns, find control gaps, and recommend governance improvements for release e-learning content through storyboard, asset, accessibility, and qa controls and submit a workplace-ready L5 e-learning Content Release SOP Audit & Improvement Report. Workplace scenario: Institution leaders are reviewing one month of e-learning content release work covering 38 digital learning assets for a 4-week course. The audit shows possible pattern-level risk because video links, captions, quiz rules, file versions, and mobile previews are inconsistent before launch. The learner must analyse trends, locate control gaps, and recommend SOP or dashboard improvements with evidence. Learner artifact: L5 e-learning Content Release SOP Audit & Improvement Report. Required data: content inventory, LMS upload list, video links, caption files, quiz settings, version tracker, QA checklist. Evidence: Assess whether the audit uses trend evidence, identifies real control gaps, rates risk clearly, and recommends realistic SOP/dashboard/governance improvements.',
  '25 hours',
  'Active',
  'Curriculum, Pedagogy & Learning Design',
  'technical',
  '["Triggered when an audit, trend analysis and governance improvement task needs a real workplace artifact, not a theory answer.","Demonstrates audit, trend analysis and governance improvement by producing and defending the L5 e-Learning Content Release SOP Audit & Improvement Report.","Learner can audit patterns, find control gaps, and recommend governance improvements for release e-learning content through storyboard, asset, accessibility, and qa controls and submit a workplace-ready L5 e-Learning Content Release SOP Audit & Improvement Report."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: Module 1: e-learning Content Release SOP Audit, Trend Analysis & Governance Report Workplace Artifact Build
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-030' LIMIT 1),
  'Module 1: e-learning Content Release SOP Audit, Trend Analysis & Governance Report Workplace Artifact Build',
  'Triggered when an audit, trend analysis and governance improvement task needs a real workplace artifact, not a theory answer. The learner studies the case, reviews the required data, identifies the gap, creates the artifact, and checks it against evidence fields.',
  1,
  '["Education & Skilling","Curriculum, Pedagogy & Learning Design","IND-CAP-06","L5","Digital asset readiness","Version control","Accessibility check","LMS content sequencing","Quiz rule validation"]'::jsonb,
  '["Engage","Explore","Explain","Express","Empower","Evolve","Artifact Build","Evidence Review","AI-Coached Retry"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Case: e-learning Content Release SOP Audit, Trend Analysis & Governance Report
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-030' LIMIT 1)
   AND title = 'Module 1: e-learning Content Release SOP Audit, Trend Analysis & Governance Report Workplace Artifact Build' LIMIT 1),
  'Workplace Case: e-learning Content Release SOP Audit, Trend Analysis & Governance Report',
  'Institution leaders are reviewing one month of e-learning content release work covering 38 digital learning assets for a 4-week course. The audit shows possible pattern-level risk because video links, captions, quiz rules, file versions, and mobile previews are inconsistent before launch. The learner must analyse trends, locate control gaps, and recommend SOP or dashboard improvements with evidence. The learner must solve the problem using the given data and produce the required workplace artifact.',
  'Workplace problem: Institution leaders are reviewing one month of e-learning content release work covering 38 digital learning assets for a 4-week course. The audit shows possible pattern-level risk because video links, captions, quiz rules, file versions, and mobile previews are inconsistent before launch. The learner must analyse trends, locate control gaps, and recommend SOP or dashboard improvements with evidence. Pressure points: Governance pressure: leaders need evidence of control, not opinions. Learner must connect trend data, policy gaps, repeated errors, and improvement recommendations. Root cause focus: Trace pattern-level causes: weak SOP control, missing dashboard indicator, repeated ownership gap, unclear policy rule, or lack of audit trail. Major concepts: Digital asset readiness; Version control; Accessibility check; LMS content sequencing; Quiz rule validation; Release sign-off; Trend analysis; Control gap analysis; Governance recommendation. Level focus: audit, governance, and improvement. Required data: content inventory, LMS upload list, video links, caption files, quiz settings, version tracker, QA checklist Learner activity flow: Engage - Start with the case: 38 digital learning assets for a 4-week course and the visible pain point — video links, captions, quiz rules, file versions, and mobile previews are inconsistent before launch. Learner identifies who is affected and what could go wrong if the work is delayed or wrong. Explore - Learner studies the source data: content inventory, LMS upload list, video links, caption files, quiz settings, version tracker, QA checklist. They mark trusted records, missing fields, conflicting entries, and items that need confirmation before using them in the artifact. Explain - Teach the main logic in simple terms: Digital asset readiness; Version control; Accessibility check; LMS content sequencing; Quiz rule validation; Release sign-off; Trend analysis; Control gap analysis; Governance recommendation. Level focus: audit, governance, and improvement. Show how rules, evidence, decisions, and handoff notes connect in this workplace task. Express - Learner produces the L5 e-learning Content Release SOP Audit & Improvement Report using the case data, writes decisions in plain English, and shows evidence for each important field instead of giving only a theory answer. Empower - Learner uses AI only as a coach: ask for missing-field checks, clarity prompts, risk questions, and retry suggestions. AI should not create the final artifact for the learner. Evolve - Learner reflects on how the audit recommendation can improve SOP, dashboard control, staff training, or governance review for future cycles. Artifact to submit: L5 e-learning Content Release SOP Audit & Improvement Report. L5 e-learning Content Release SOP Audit & Improvement Report should contain: audit sample; trend table; control-gap finding; risk rating; SOP/dashboard recommendation; governance closure note. Required source data: content inventory, LMS upload list, video links, caption files, quiz settings, version tracker, QA checklist. Evidence fields: Assess whether the audit uses trend evidence, identifies real control gaps, rates risk clearly, and recommends realistic SOP/dashboard/governance improvements. AI support: AI coach can ask: What source proves this? Which field is missing? What is the risk if this is wrong? Who owns the next action? Learner must answer using the case data, not guesses.',
  1,
  '25 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Ed - Digital Pedagogy
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-030' LIMIT 1),
  'B.Ed - Digital Pedagogy',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Ed - Educational Technology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-030' LIMIT 1),
  'M.Ed - Educational Technology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BCA
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-030' LIMIT 1),
  'BCA',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc IT
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-030' LIMIT 1),
  'B.Sc IT',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PG Diploma Instructional Design
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-030' LIMIT 1),
  'PG Diploma Instructional Design',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Teacher Development SOP Audit, Trend Analysis & Governance Report
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Teacher Development SOP Audit, Trend Analysis & Governance Report',
  'COURSE-L5-035',
  'Learner can audit patterns, find control gaps, and recommend governance improvements for and facilitate teacher development interventions linked to classroom practice gaps and submit a workplace-ready L5 Teacher Development SOP Audit & Improvement Report. Workplace scenario: Institution leaders are reviewing one month of teacher development work covering 32 teachers attending a classroom strategy workshop. The audit shows possible pattern-level risk because teacher needs, session objectives, practice activities, and feedback tools are not aligned. The learner must analyse trends, locate control gaps, and recommend SOP or dashboard improvements with evidence. Learner artifact: L5 Teacher Development SOP Audit & Improvement Report. Required data: teacher needs survey, observation notes, session agenda, practice task sheet, feedback form, attendance list. Evidence: Assess whether the audit uses trend evidence, identifies real control gaps, rates risk clearly, and recommends realistic SOP/dashboard/governance improvements.',
  '25 hours',
  'Active',
  'Curriculum, Pedagogy & Learning Design',
  'soft',
  '["Triggered when an audit, trend analysis and governance improvement task needs a real workplace artifact, not a theory answer.","Demonstrates audit, trend analysis and governance improvement by producing and defending the L5 Teacher Development SOP Audit & Improvement Report.","Learner can audit patterns, find control gaps, and recommend governance improvements for and facilitate teacher development interventions linked to classroom practice gaps and submit a workplace-ready L5 Teacher Development SOP Audit & Improvement Report."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: Module 1: Teacher Development SOP Audit, Trend Analysis & Governance Report Workplace Artifact Build
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-035' LIMIT 1),
  'Module 1: Teacher Development SOP Audit, Trend Analysis & Governance Report Workplace Artifact Build',
  'Triggered when an audit, trend analysis and governance improvement task needs a real workplace artifact, not a theory answer. The learner studies the case, reviews the required data, identifies the gap, creates the artifact, and checks it against evidence fields.',
  1,
  '["Education & Skilling","Curriculum, Pedagogy & Learning Design","IND-CAP-07","L5","Teacher needs analysis","Training objective design","Practice-based facilitation","Observation evidence","Feedback loop"]'::jsonb,
  '["Engage","Explore","Explain","Express","Empower","Evolve","Artifact Build","Evidence Review","AI-Coached Retry"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Case: Teacher Development SOP Audit, Trend Analysis & Governance Report
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-035' LIMIT 1)
   AND title = 'Module 1: Teacher Development SOP Audit, Trend Analysis & Governance Report Workplace Artifact Build' LIMIT 1),
  'Workplace Case: Teacher Development SOP Audit, Trend Analysis & Governance Report',
  'Institution leaders are reviewing one month of teacher development work covering 32 teachers attending a classroom strategy workshop. The audit shows possible pattern-level risk because teacher needs, session objectives, practice activities, and feedback tools are not aligned. The learner must analyse trends, locate control gaps, and recommend SOP or dashboard improvements with evidence. The learner must solve the problem using the given data and produce the required workplace artifact.',
  'Workplace problem: Institution leaders are reviewing one month of teacher development work covering 32 teachers attending a classroom strategy workshop. The audit shows possible pattern-level risk because teacher needs, session objectives, practice activities, and feedback tools are not aligned. The learner must analyse trends, locate control gaps, and recommend SOP or dashboard improvements with evidence. Pressure points: Governance pressure: leaders need evidence of control, not opinions. Learner must connect trend data, policy gaps, repeated errors, and improvement recommendations. Root cause focus: Trace pattern-level causes: weak SOP control, missing dashboard indicator, repeated ownership gap, unclear policy rule, or lack of audit trail. Major concepts: Teacher needs analysis; Training objective design; Practice-based facilitation; Observation evidence; Feedback loop; Follow-up coaching; Trend analysis; Control gap analysis; Governance recommendation. Level focus: audit, governance, and improvement. Required data: teacher needs survey, observation notes, session agenda, practice task sheet, feedback form, attendance list Learner activity flow: Engage - Start with the case: 32 teachers attending a classroom strategy workshop and the visible pain point — teacher needs, session objectives, practice activities, and feedback tools are not aligned. Learner identifies who is affected and what could go wrong if the work is delayed or wrong. Explore - Learner studies the source data: teacher needs survey, observation notes, session agenda, practice task sheet, feedback form, attendance list. They mark trusted records, missing fields, conflicting entries, and items that need confirmation before using them in the artifact. Explain - Teach the main logic in simple terms: Teacher needs analysis; Training objective design; Practice-based facilitation; Observation evidence; Feedback loop; Follow-up coaching; Trend analysis; Control gap analysis; Governance recommendation. Level focus: audit, governance, and improvement. Show how rules, evidence, decisions, and handoff notes connect in this workplace task. Express - Learner produces the L5 Teacher Development SOP Audit & Improvement Report using the case data, writes decisions in plain English, and shows evidence for each important field instead of giving only a theory answer. Empower - Learner uses AI only as a coach: ask for missing-field checks, clarity prompts, risk questions, and retry suggestions. AI should not create the final artifact for the learner. Evolve - Learner reflects on how the audit recommendation can improve SOP, dashboard control, staff training, or governance review for future cycles. Artifact to submit: L5 Teacher Development SOP Audit & Improvement Report. L5 Teacher Development SOP Audit & Improvement Report should contain: audit sample; trend table; control-gap finding; risk rating; SOP/dashboard recommendation; governance closure note. Required source data: teacher needs survey, observation notes, session agenda, practice task sheet, feedback form, attendance list. Evidence fields: Assess whether the audit uses trend evidence, identifies real control gaps, rates risk clearly, and recommends realistic SOP/dashboard/governance improvements. AI support: AI coach can ask: What source proves this? Which field is missing? What is the risk if this is wrong? Who owns the next action? Learner must answer using the case data, not guesses.',
  1,
  '25 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Ed - Teacher Education
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-035' LIMIT 1),
  'B.Ed - Teacher Education',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Ed - Teacher Development
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-035' LIMIT 1),
  'M.Ed - Teacher Development',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MA Education
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-035' LIMIT 1),
  'MA Education',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PG Diploma Faculty Development
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-035' LIMIT 1),
  'PG Diploma Faculty Development',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PG Diploma Educational Leadership
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-035' LIMIT 1),
  'PG Diploma Educational Leadership',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: STEAM Maker-Lab Project Cycle SOP Audit, Trend Analysis & Governance Report
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'STEAM Maker-Lab Project Cycle SOP Audit, Trend Analysis & Governance Report',
  'COURSE-L5-040',
  'Learner can audit patterns, find control gaps, and recommend governance improvements for convert steam project goals into safe, resourced maker-lab learning cycles and submit a workplace-ready L5 STEAM Maker-Lab Project Cycle SOP Audit & Improvement Report. Workplace scenario: Institution leaders are reviewing one month of steam maker-lab project work covering 5 project teams using 3 shared lab zones. The audit shows possible pattern-level risk because materials, safety rules, mentor time, and project milestones are unclear before the lab cycle starts. The learner must analyse trends, locate control gaps, and recommend SOP or dashboard improvements with evidence. Learner artifact: L5 STEAM Maker-Lab Project Cycle SOP Audit & Improvement Report. Required data: project brief, material list, safety checklist, lab schedule, mentor roster, team list, milestone tracker. Evidence: Assess whether the audit uses trend evidence, identifies real control gaps, rates risk clearly, and recommends realistic SOP/dashboard/governance improvements.',
  '25 hours',
  'Active',
  'Curriculum, Pedagogy & Learning Design',
  'technical',
  '["Triggered when an audit, trend analysis and governance improvement task needs a real workplace artifact, not a theory answer.","Demonstrates audit, trend analysis and governance improvement by producing and defending the L5 STEAM Maker-Lab Project Cycle SOP Audit & Improvement Report.","Learner can audit patterns, find control gaps, and recommend governance improvements for convert steam project goals into safe, resourced maker-lab learning cycles and submit a workplace-ready L5 STEAM Maker-Lab Project Cycle SOP Audit & Improvement Report."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: Module 1: STEAM Maker-Lab Project Cycle SOP Audit, Trend Analysis & Governance Report Workplace Artifact Build
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-040' LIMIT 1),
  'Module 1: STEAM Maker-Lab Project Cycle SOP Audit, Trend Analysis & Governance Report Workplace Artifact Build',
  'Triggered when an audit, trend analysis and governance improvement task needs a real workplace artifact, not a theory answer. The learner studies the case, reviews the required data, identifies the gap, creates the artifact, and checks it against evidence fields.',
  1,
  '["Education & Skilling","Curriculum, Pedagogy & Learning Design","IND-CAP-08","L5","Project cycle planning","Lab safety control","Material readiness","Mentor scheduling","Milestone tracking"]'::jsonb,
  '["Engage","Explore","Explain","Express","Empower","Evolve","Artifact Build","Evidence Review","AI-Coached Retry"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Case: STEAM Maker-Lab Project Cycle SOP Audit, Trend Analysis & Governance Report
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-040' LIMIT 1)
   AND title = 'Module 1: STEAM Maker-Lab Project Cycle SOP Audit, Trend Analysis & Governance Report Workplace Artifact Build' LIMIT 1),
  'Workplace Case: STEAM Maker-Lab Project Cycle SOP Audit, Trend Analysis & Governance Report',
  'Institution leaders are reviewing one month of steam maker-lab project work covering 5 project teams using 3 shared lab zones. The audit shows possible pattern-level risk because materials, safety rules, mentor time, and project milestones are unclear before the lab cycle starts. The learner must analyse trends, locate control gaps, and recommend SOP or dashboard improvements with evidence. The learner must solve the problem using the given data and produce the required workplace artifact.',
  'Workplace problem: Institution leaders are reviewing one month of steam maker-lab project work covering 5 project teams using 3 shared lab zones. The audit shows possible pattern-level risk because materials, safety rules, mentor time, and project milestones are unclear before the lab cycle starts. The learner must analyse trends, locate control gaps, and recommend SOP or dashboard improvements with evidence. Pressure points: Governance pressure: leaders need evidence of control, not opinions. Learner must connect trend data, policy gaps, repeated errors, and improvement recommendations. Root cause focus: Trace pattern-level causes: weak SOP control, missing dashboard indicator, repeated ownership gap, unclear policy rule, or lack of audit trail. Major concepts: Project cycle planning; Lab safety control; Material readiness; Mentor scheduling; Milestone tracking; Student collaboration evidence; Trend analysis; Control gap analysis; Governance recommendation. Level focus: audit, governance, and improvement. Required data: project brief, material list, safety checklist, lab schedule, mentor roster, team list, milestone tracker Learner activity flow: Engage - Start with the case: 5 project teams using 3 shared lab zones and the visible pain point — materials, safety rules, mentor time, and project milestones are unclear before the lab cycle starts. Learner identifies who is affected and what could go wrong if the work is delayed or wrong. Explore - Learner studies the source data: project brief, material list, safety checklist, lab schedule, mentor roster, team list, milestone tracker. They mark trusted records, missing fields, conflicting entries, and items that need confirmation before using them in the artifact. Explain - Teach the main logic in simple terms: Project cycle planning; Lab safety control; Material readiness; Mentor scheduling; Milestone tracking; Student collaboration evidence; Trend analysis; Control gap analysis; Governance recommendation. Level focus: audit, governance, and improvement. Show how rules, evidence, decisions, and handoff notes connect in this workplace task. Express - Learner produces the L5 STEAM Maker-Lab Project Cycle SOP Audit & Improvement Report using the case data, writes decisions in plain English, and shows evidence for each important field instead of giving only a theory answer. Empower - Learner uses AI only as a coach: ask for missing-field checks, clarity prompts, risk questions, and retry suggestions. AI should not create the final artifact for the learner. Evolve - Learner reflects on how the audit recommendation can improve SOP, dashboard control, staff training, or governance review for future cycles. Artifact to submit: L5 STEAM Maker-Lab Project Cycle SOP Audit & Improvement Report. L5 STEAM Maker-Lab Project Cycle SOP Audit & Improvement Report should contain: audit sample; trend table; control-gap finding; risk rating; SOP/dashboard recommendation; governance closure note. Required source data: project brief, material list, safety checklist, lab schedule, mentor roster, team list, milestone tracker. Evidence fields: Assess whether the audit uses trend evidence, identifies real control gaps, rates risk clearly, and recommends realistic SOP/dashboard/governance improvements. AI support: AI coach can ask: What source proves this? Which field is missing? What is the risk if this is wrong? Who owns the next action? Learner must answer using the case data, not guesses.',
  1,
  '25 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Ed - Science Education
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-040' LIMIT 1),
  'B.Ed - Science Education',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Science Education
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-040' LIMIT 1),
  'B.Sc Science Education',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech - STEM Education Support
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-040' LIMIT 1),
  'B.Tech - STEM Education Support',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Voc Maker-Lab Facilitation
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-040' LIMIT 1),
  'B.Voc Maker-Lab Facilitation',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PG Diploma Experiential Learning
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-040' LIMIT 1),
  'PG Diploma Experiential Learning',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Vocational Batch Alignment SOP Audit, Trend Analysis & Governance Report
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Vocational Batch Alignment SOP Audit, Trend Analysis & Governance Report',
  'COURSE-L5-045',
  'Learner can audit patterns, find control gaps, and recommend governance improvements for align vocational batches to qualification packs, trainer readiness, and assessment requirements and submit a workplace-ready L5 Vocational Batch Alignment SOP Audit & Improvement Report. Workplace scenario: Institution leaders are reviewing one month of vocational batch alignment work covering 92 learners in a job-role batch. The audit shows possible pattern-level risk because qualification-pack outcomes, trainer availability, tools, practice hours, and assessment windows do not match. The learner must analyse trends, locate control gaps, and recommend SOP or dashboard improvements with evidence. Learner artifact: L5 Vocational Batch Alignment SOP Audit & Improvement Report. Required data: qualification pack, trainer roster, equipment list, batch profile, practice-hour plan, assessment schedule. Evidence: Assess whether the audit uses trend evidence, identifies real control gaps, rates risk clearly, and recommends realistic SOP/dashboard/governance improvements.',
  '25 hours',
  'Active',
  'Skilling, Employability & Work-Integrated Learning',
  'technical',
  '["Triggered when an audit, trend analysis and governance improvement task needs a real workplace artifact, not a theory answer.","Demonstrates audit, trend analysis and governance improvement by producing and defending the L5 Vocational Batch Alignment SOP Audit & Improvement Report.","Learner can audit patterns, find control gaps, and recommend governance improvements for align vocational batches to qualification packs, trainer readiness, and assessment requirements and submit a workplace-ready L5 Vocational Batch Alignment SOP Audit & Improvement Report."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: Module 1: Vocational Batch Alignment SOP Audit, Trend Analysis & Governance Report Workplace Artifact Build
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-045' LIMIT 1),
  'Module 1: Vocational Batch Alignment SOP Audit, Trend Analysis & Governance Report Workplace Artifact Build',
  'Triggered when an audit, trend analysis and governance improvement task needs a real workplace artifact, not a theory answer. The learner studies the case, reviews the required data, identifies the gap, creates the artifact, and checks it against evidence fields.',
  1,
  '["Education & Skilling","Skilling, Employability & Work-Integrated Learning","IND-CAP-09","L5","Qualification-pack interpretation","Batch-to-outcome mapping","Trainer readiness","Equipment and practice-hour planning","Assessment requirement check"]'::jsonb,
  '["Engage","Explore","Explain","Express","Empower","Evolve","Artifact Build","Evidence Review","AI-Coached Retry"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Case: Vocational Batch Alignment SOP Audit, Trend Analysis & Governance Report
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-045' LIMIT 1)
   AND title = 'Module 1: Vocational Batch Alignment SOP Audit, Trend Analysis & Governance Report Workplace Artifact Build' LIMIT 1),
  'Workplace Case: Vocational Batch Alignment SOP Audit, Trend Analysis & Governance Report',
  'Institution leaders are reviewing one month of vocational batch alignment work covering 92 learners in a job-role batch. The audit shows possible pattern-level risk because qualification-pack outcomes, trainer availability, tools, practice hours, and assessment windows do not match. The learner must analyse trends, locate control gaps, and recommend SOP or dashboard improvements with evidence. The learner must solve the problem using the given data and produce the required workplace artifact.',
  'Workplace problem: Institution leaders are reviewing one month of vocational batch alignment work covering 92 learners in a job-role batch. The audit shows possible pattern-level risk because qualification-pack outcomes, trainer availability, tools, practice hours, and assessment windows do not match. The learner must analyse trends, locate control gaps, and recommend SOP or dashboard improvements with evidence. Pressure points: Governance pressure: leaders need evidence of control, not opinions. Learner must connect trend data, policy gaps, repeated errors, and improvement recommendations. Root cause focus: Trace pattern-level causes: weak SOP control, missing dashboard indicator, repeated ownership gap, unclear policy rule, or lack of audit trail. Major concepts: Qualification-pack interpretation; Batch-to-outcome mapping; Trainer readiness; Equipment and practice-hour planning; Assessment requirement check; Compliance handoff; Trend analysis; Control gap analysis; Governance recommendation. Level focus: audit, governance, and improvement. Required data: qualification pack, trainer roster, equipment list, batch profile, practice-hour plan, assessment schedule Learner activity flow: Engage - Start with the case: 92 learners in a job-role batch and the visible pain point — qualification-pack outcomes, trainer availability, tools, practice hours, and assessment windows do not match. Learner identifies who is affected and what could go wrong if the work is delayed or wrong. Explore - Learner studies the source data: qualification pack, trainer roster, equipment list, batch profile, practice-hour plan, assessment schedule. They mark trusted records, missing fields, conflicting entries, and items that need confirmation before using them in the artifact. Explain - Teach the main logic in simple terms: Qualification-pack interpretation; Batch-to-outcome mapping; Trainer readiness; Equipment and practice-hour planning; Assessment requirement check; Compliance handoff; Trend analysis; Control gap analysis; Governance recommendation. Level focus: audit, governance, and improvement. Show how rules, evidence, decisions, and handoff notes connect in this workplace task. Express - Learner produces the L5 Vocational Batch Alignment SOP Audit & Improvement Report using the case data, writes decisions in plain English, and shows evidence for each important field instead of giving only a theory answer. Empower - Learner uses AI only as a coach: ask for missing-field checks, clarity prompts, risk questions, and retry suggestions. AI should not create the final artifact for the learner. Evolve - Learner reflects on how the audit recommendation can improve SOP, dashboard control, staff training, or governance review for future cycles. Artifact to submit: L5 Vocational Batch Alignment SOP Audit & Improvement Report. L5 Vocational Batch Alignment SOP Audit & Improvement Report should contain: audit sample; trend table; control-gap finding; risk rating; SOP/dashboard recommendation; governance closure note. Required source data: qualification pack, trainer roster, equipment list, batch profile, practice-hour plan, assessment schedule. Evidence fields: Assess whether the audit uses trend evidence, identifies real control gaps, rates risk clearly, and recommends realistic SOP/dashboard/governance improvements. AI support: AI coach can ask: What source proves this? Which field is missing? What is the risk if this is wrong? Who owns the next action? Learner must answer using the case data, not guesses.',
  1,
  '25 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Voc - Vocational Education
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-045' LIMIT 1),
  'B.Voc - Vocational Education',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: Diploma in Vocational Training
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-045' LIMIT 1),
  'Diploma in Vocational Training',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BBA Skill Development
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-045' LIMIT 1),
  'BBA Skill Development',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PG Diploma Skill Development
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-045' LIMIT 1),
  'PG Diploma Skill Development',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MBA HR and Training
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-045' LIMIT 1),
  'MBA HR and Training',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Skilling Delivery & Placement Readiness SOP Audit, Trend Analysis & Governance Report
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Skilling Delivery & Placement Readiness SOP Audit, Trend Analysis & Governance Report',
  'COURSE-L5-050',
  'Learner can audit patterns, find control gaps, and recommend governance improvements for monitor skilling delivery and placement readiness through attendance, practice, and employability evidence and submit a workplace-ready L5 Skilling Delivery & Placement Readiness SOP Audit & Improvement Report. Workplace scenario: Institution leaders are reviewing one month of placement readiness work covering 115 learners before employer interviews. The audit shows possible pattern-level risk because resume status, mock interview scores, attendance, skill gaps, and employer criteria are scattered. The learner must analyse trends, locate control gaps, and recommend SOP or dashboard improvements with evidence. Learner artifact: L5 Skilling Delivery & Placement Readiness SOP Audit & Improvement Report. Required data: learner profile, resume tracker, mock interview scores, attendance, employer criteria, skill-gap notes. Evidence: Assess whether the audit uses trend evidence, identifies real control gaps, rates risk clearly, and recommends realistic SOP/dashboard/governance improvements.',
  '25 hours',
  'Active',
  'Skilling, Employability & Work-Integrated Learning',
  'technical',
  '["Triggered when an audit, trend analysis and governance improvement task needs a real workplace artifact, not a theory answer.","Demonstrates audit, trend analysis and governance improvement by producing and defending the L5 Skilling Delivery & Placement Readiness SOP Audit & Improvement Report.","Learner can audit patterns, find control gaps, and recommend governance improvements for monitor skilling delivery and placement readiness through attendance, practice, and employability evidence and submit a workplace-ready L5 Skilling Delivery & Placement Readiness SOP Audit & Improvement Report."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: Module 1: Skilling Delivery & Placement Readiness SOP Audit, Trend Analysis & Governance Report Workplace Artifact Build
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-050' LIMIT 1),
  'Module 1: Skilling Delivery & Placement Readiness SOP Audit, Trend Analysis & Governance Report Workplace Artifact Build',
  'Triggered when an audit, trend analysis and governance improvement task needs a real workplace artifact, not a theory answer. The learner studies the case, reviews the required data, identifies the gap, creates the artifact, and checks it against evidence fields.',
  1,
  '["Education & Skilling","Skilling, Employability & Work-Integrated Learning","IND-CAP-10","L5","Employability readiness indicators","Employer criteria matching","Resume and interview evidence","Readiness scoring","Shortlist logic"]'::jsonb,
  '["Engage","Explore","Explain","Express","Empower","Evolve","Artifact Build","Evidence Review","AI-Coached Retry"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Case: Skilling Delivery & Placement Readiness SOP Audit, Trend Analysis & Governance Report
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-050' LIMIT 1)
   AND title = 'Module 1: Skilling Delivery & Placement Readiness SOP Audit, Trend Analysis & Governance Report Workplace Artifact Build' LIMIT 1),
  'Workplace Case: Skilling Delivery & Placement Readiness SOP Audit, Trend Analysis & Governance Report',
  'Institution leaders are reviewing one month of placement readiness work covering 115 learners before employer interviews. The audit shows possible pattern-level risk because resume status, mock interview scores, attendance, skill gaps, and employer criteria are scattered. The learner must analyse trends, locate control gaps, and recommend SOP or dashboard improvements with evidence. The learner must solve the problem using the given data and produce the required workplace artifact.',
  'Workplace problem: Institution leaders are reviewing one month of placement readiness work covering 115 learners before employer interviews. The audit shows possible pattern-level risk because resume status, mock interview scores, attendance, skill gaps, and employer criteria are scattered. The learner must analyse trends, locate control gaps, and recommend SOP or dashboard improvements with evidence. Pressure points: Governance pressure: leaders need evidence of control, not opinions. Learner must connect trend data, policy gaps, repeated errors, and improvement recommendations. Root cause focus: Trace pattern-level causes: weak SOP control, missing dashboard indicator, repeated ownership gap, unclear policy rule, or lack of audit trail. Major concepts: Employability readiness indicators; Employer criteria matching; Resume and interview evidence; Readiness scoring; Shortlist logic; Placement handoff; Trend analysis; Control gap analysis; Governance recommendation. Level focus: audit, governance, and improvement. Required data: learner profile, resume tracker, mock interview scores, attendance, employer criteria, skill-gap notes Learner activity flow: Engage - Start with the case: 115 learners before employer interviews and the visible pain point — resume status, mock interview scores, attendance, skill gaps, and employer criteria are scattered. Learner identifies who is affected and what could go wrong if the work is delayed or wrong. Explore - Learner studies the source data: learner profile, resume tracker, mock interview scores, attendance, employer criteria, skill-gap notes. They mark trusted records, missing fields, conflicting entries, and items that need confirmation before using them in the artifact. Explain - Teach the main logic in simple terms: Employability readiness indicators; Employer criteria matching; Resume and interview evidence; Readiness scoring; Shortlist logic; Placement handoff; Trend analysis; Control gap analysis; Governance recommendation. Level focus: audit, governance, and improvement. Show how rules, evidence, decisions, and handoff notes connect in this workplace task. Express - Learner produces the L5 Skilling Delivery & Placement Readiness SOP Audit & Improvement Report using the case data, writes decisions in plain English, and shows evidence for each important field instead of giving only a theory answer. Empower - Learner uses AI only as a coach: ask for missing-field checks, clarity prompts, risk questions, and retry suggestions. AI should not create the final artifact for the learner. Evolve - Learner reflects on how the audit recommendation can improve SOP, dashboard control, staff training, or governance review for future cycles. Artifact to submit: L5 Skilling Delivery & Placement Readiness SOP Audit & Improvement Report. L5 Skilling Delivery & Placement Readiness SOP Audit & Improvement Report should contain: audit sample; trend table; control-gap finding; risk rating; SOP/dashboard recommendation; governance closure note. Required source data: learner profile, resume tracker, mock interview scores, attendance, employer criteria, skill-gap notes. Evidence fields: Assess whether the audit uses trend evidence, identifies real control gaps, rates risk clearly, and recommends realistic SOP/dashboard/governance improvements. AI support: AI coach can ask: What source proves this? Which field is missing? What is the risk if this is wrong? Who owns the next action? Learner must answer using the case data, not guesses.',
  1,
  '25 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Voc - Skill Development
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-050' LIMIT 1),
  'B.Voc - Skill Development',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BBA Training and Placement
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-050' LIMIT 1),
  'BBA Training and Placement',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MBA HR
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-050' LIMIT 1),
  'MBA HR',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PG Diploma Employability Training
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-050' LIMIT 1),
  'PG Diploma Employability Training',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MSW - Livelihood Programs
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-050' LIMIT 1),
  'MSW - Livelihood Programs',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Internship & Apprenticeship Matching SOP Audit, Trend Analysis & Governance Report
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Internship & Apprenticeship Matching SOP Audit, Trend Analysis & Governance Report',
  'COURSE-L5-055',
  'Learner can audit patterns, find control gaps, and recommend governance improvements for match learners to internship and apprenticeship opportunities using eligibility, employer, and learning-plan evidence and submit a workplace-ready L5 Internship & Apprenticeship Matching SOP Audit & Improvement Report. Workplace scenario: Institution leaders are reviewing one month of internship matching work covering 86 eligible learners and 27 employer slots. The audit shows possible pattern-level risk because locations, stipend rules, joining dates, skill requirements, and eligibility conditions conflict. The learner must analyse trends, locate control gaps, and recommend SOP or dashboard improvements with evidence. Learner artifact: L5 Internship & Apprenticeship Matching SOP Audit & Improvement Report. Required data: learner preference form, employer slot list, eligibility rules, location constraints, stipend details, joining deadlines. Evidence: Assess whether the audit uses trend evidence, identifies real control gaps, rates risk clearly, and recommends realistic SOP/dashboard/governance improvements.',
  '25 hours',
  'Active',
  'Skilling, Employability & Work-Integrated Learning',
  'technical',
  '["Triggered when an audit, trend analysis and governance improvement task needs a real workplace artifact, not a theory answer.","Demonstrates audit, trend analysis and governance improvement by producing and defending the L5 Internship & Apprenticeship Matching SOP Audit & Improvement Report.","Learner can audit patterns, find control gaps, and recommend governance improvements for match learners to internship and apprenticeship opportunities using eligibility, employer, and learning-plan evidence and submit a workplace-ready L5 Internship & Apprenticeship Matching SOP Audit & Improvement Report."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: Module 1: Internship & Apprenticeship Matching SOP Audit, Trend Analysis & Governance Report Workplace Artifact Build
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-055' LIMIT 1),
  'Module 1: Internship & Apprenticeship Matching SOP Audit, Trend Analysis & Governance Report Workplace Artifact Build',
  'Triggered when an audit, trend analysis and governance improvement task needs a real workplace artifact, not a theory answer. The learner studies the case, reviews the required data, identifies the gap, creates the artifact, and checks it against evidence fields.',
  1,
  '["Education & Skilling","Skilling, Employability & Work-Integrated Learning","IND-CAP-11","L5","Eligibility matching","Employer requirement mapping","Learner preference handling","Constraint-based shortlisting","Justification note"]'::jsonb,
  '["Engage","Explore","Explain","Express","Empower","Evolve","Artifact Build","Evidence Review","AI-Coached Retry"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Case: Internship & Apprenticeship Matching SOP Audit, Trend Analysis & Governance Report
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-055' LIMIT 1)
   AND title = 'Module 1: Internship & Apprenticeship Matching SOP Audit, Trend Analysis & Governance Report Workplace Artifact Build' LIMIT 1),
  'Workplace Case: Internship & Apprenticeship Matching SOP Audit, Trend Analysis & Governance Report',
  'Institution leaders are reviewing one month of internship matching work covering 86 eligible learners and 27 employer slots. The audit shows possible pattern-level risk because locations, stipend rules, joining dates, skill requirements, and eligibility conditions conflict. The learner must analyse trends, locate control gaps, and recommend SOP or dashboard improvements with evidence. The learner must solve the problem using the given data and produce the required workplace artifact.',
  'Workplace problem: Institution leaders are reviewing one month of internship matching work covering 86 eligible learners and 27 employer slots. The audit shows possible pattern-level risk because locations, stipend rules, joining dates, skill requirements, and eligibility conditions conflict. The learner must analyse trends, locate control gaps, and recommend SOP or dashboard improvements with evidence. Pressure points: Governance pressure: leaders need evidence of control, not opinions. Learner must connect trend data, policy gaps, repeated errors, and improvement recommendations. Root cause focus: Trace pattern-level causes: weak SOP control, missing dashboard indicator, repeated ownership gap, unclear policy rule, or lack of audit trail. Major concepts: Eligibility matching; Employer requirement mapping; Learner preference handling; Constraint-based shortlisting; Justification note; Joining risk tracking; Trend analysis; Control gap analysis; Governance recommendation. Level focus: audit, governance, and improvement. Required data: learner preference form, employer slot list, eligibility rules, location constraints, stipend details, joining deadlines Learner activity flow: Engage - Start with the case: 86 eligible learners and 27 employer slots and the visible pain point — locations, stipend rules, joining dates, skill requirements, and eligibility conditions conflict. Learner identifies who is affected and what could go wrong if the work is delayed or wrong. Explore - Learner studies the source data: learner preference form, employer slot list, eligibility rules, location constraints, stipend details, joining deadlines. They mark trusted records, missing fields, conflicting entries, and items that need confirmation before using them in the artifact. Explain - Teach the main logic in simple terms: Eligibility matching; Employer requirement mapping; Learner preference handling; Constraint-based shortlisting; Justification note; Joining risk tracking; Trend analysis; Control gap analysis; Governance recommendation. Level focus: audit, governance, and improvement. Show how rules, evidence, decisions, and handoff notes connect in this workplace task. Express - Learner produces the L5 Internship & Apprenticeship Matching SOP Audit & Improvement Report using the case data, writes decisions in plain English, and shows evidence for each important field instead of giving only a theory answer. Empower - Learner uses AI only as a coach: ask for missing-field checks, clarity prompts, risk questions, and retry suggestions. AI should not create the final artifact for the learner. Evolve - Learner reflects on how the audit recommendation can improve SOP, dashboard control, staff training, or governance review for future cycles. Artifact to submit: L5 Internship & Apprenticeship Matching SOP Audit & Improvement Report. L5 Internship & Apprenticeship Matching SOP Audit & Improvement Report should contain: audit sample; trend table; control-gap finding; risk rating; SOP/dashboard recommendation; governance closure note. Required source data: learner preference form, employer slot list, eligibility rules, location constraints, stipend details, joining deadlines. Evidence fields: Assess whether the audit uses trend evidence, identifies real control gaps, rates risk clearly, and recommends realistic SOP/dashboard/governance improvements. AI support: AI coach can ask: What source proves this? Which field is missing? What is the risk if this is wrong? Who owns the next action? Learner must answer using the case data, not guesses.',
  1,
  '25 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Voc - Work Integrated Learning
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-055' LIMIT 1),
  'B.Voc - Work Integrated Learning',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BBA HR
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-055' LIMIT 1),
  'BBA HR',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MBA HR
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-055' LIMIT 1),
  'MBA HR',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PG Diploma Apprenticeship Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-055' LIMIT 1),
  'PG Diploma Apprenticeship Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PG Diploma Internship Coordination
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-055' LIMIT 1),
  'PG Diploma Internship Coordination',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Corporate L&D Needs Transfer SOP Audit, Trend Analysis & Governance Report
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Corporate L&D Needs Transfer SOP Audit, Trend Analysis & Governance Report',
  'COURSE-L5-060',
  'Learner can audit patterns, find control gaps, and recommend governance improvements for diagnose corporate learning needs and track transfer evidence against business performance objectives and submit a workplace-ready L5 Corporate L&D Needs Transfer SOP Audit & Improvement Report. Workplace scenario: Institution leaders are reviewing one month of corporate l&d needs transfer work covering 4 departments and 210 employees. The audit shows possible pattern-level risk because manager requests, performance gaps, business priorities, and training expectations are mixed together. The learner must analyse trends, locate control gaps, and recommend SOP or dashboard improvements with evidence. Learner artifact: L5 Corporate L&D Needs Transfer SOP Audit & Improvement Report. Required data: manager request forms, performance data, business priority notes, learner profile, budget constraints, timeline. Evidence: Assess whether the audit uses trend evidence, identifies real control gaps, rates risk clearly, and recommends realistic SOP/dashboard/governance improvements.',
  '25 hours',
  'Active',
  'Skilling, Employability & Work-Integrated Learning',
  'soft',
  '["Triggered when an audit, trend analysis and governance improvement task needs a real workplace artifact, not a theory answer.","Demonstrates audit, trend analysis and governance improvement by producing and defending the L5 Corporate L&D Needs Transfer SOP Audit & Improvement Report.","Learner can audit patterns, find control gaps, and recommend governance improvements for diagnose corporate learning needs and track transfer evidence against business performance objectives and submit a workplace-ready L5 Corporate L&D Needs Transfer SOP Audit & Improvement Report."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: Module 1: Corporate L&D Needs Transfer SOP Audit, Trend Analysis & Governance Report Workplace Artifact Build
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-060' LIMIT 1),
  'Module 1: Corporate L&D Needs Transfer SOP Audit, Trend Analysis & Governance Report Workplace Artifact Build',
  'Triggered when an audit, trend analysis and governance improvement task needs a real workplace artifact, not a theory answer. The learner studies the case, reviews the required data, identifies the gap, creates the artifact, and checks it against evidence fields.',
  1,
  '["Education & Skilling","Skilling, Employability & Work-Integrated Learning","IND-CAP-12","L5","Needs analysis","Business-to-learning translation","Stakeholder requirement capture","Performance gap framing","Training priority matrix"]'::jsonb,
  '["Engage","Explore","Explain","Express","Empower","Evolve","Artifact Build","Evidence Review","AI-Coached Retry"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Case: Corporate L&D Needs Transfer SOP Audit, Trend Analysis & Governance Report
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-060' LIMIT 1)
   AND title = 'Module 1: Corporate L&D Needs Transfer SOP Audit, Trend Analysis & Governance Report Workplace Artifact Build' LIMIT 1),
  'Workplace Case: Corporate L&D Needs Transfer SOP Audit, Trend Analysis & Governance Report',
  'Institution leaders are reviewing one month of corporate l&d needs transfer work covering 4 departments and 210 employees. The audit shows possible pattern-level risk because manager requests, performance gaps, business priorities, and training expectations are mixed together. The learner must analyse trends, locate control gaps, and recommend SOP or dashboard improvements with evidence. The learner must solve the problem using the given data and produce the required workplace artifact.',
  'Workplace problem: Institution leaders are reviewing one month of corporate l&d needs transfer work covering 4 departments and 210 employees. The audit shows possible pattern-level risk because manager requests, performance gaps, business priorities, and training expectations are mixed together. The learner must analyse trends, locate control gaps, and recommend SOP or dashboard improvements with evidence. Pressure points: Governance pressure: leaders need evidence of control, not opinions. Learner must connect trend data, policy gaps, repeated errors, and improvement recommendations. Root cause focus: Trace pattern-level causes: weak SOP control, missing dashboard indicator, repeated ownership gap, unclear policy rule, or lack of audit trail. Major concepts: Needs analysis; Business-to-learning translation; Stakeholder requirement capture; Performance gap framing; Training priority matrix; L&D handoff; Trend analysis; Control gap analysis; Governance recommendation. Level focus: audit, governance, and improvement. Required data: manager request forms, performance data, business priority notes, learner profile, budget constraints, timeline Learner activity flow: Engage - Start with the case: 4 departments and 210 employees and the visible pain point — manager requests, performance gaps, business priorities, and training expectations are mixed together. Learner identifies who is affected and what could go wrong if the work is delayed or wrong. Explore - Learner studies the source data: manager request forms, performance data, business priority notes, learner profile, budget constraints, timeline. They mark trusted records, missing fields, conflicting entries, and items that need confirmation before using them in the artifact. Explain - Teach the main logic in simple terms: Needs analysis; Business-to-learning translation; Stakeholder requirement capture; Performance gap framing; Training priority matrix; L&D handoff; Trend analysis; Control gap analysis; Governance recommendation. Level focus: audit, governance, and improvement. Show how rules, evidence, decisions, and handoff notes connect in this workplace task. Express - Learner produces the L5 Corporate L&D Needs Transfer SOP Audit & Improvement Report using the case data, writes decisions in plain English, and shows evidence for each important field instead of giving only a theory answer. Empower - Learner uses AI only as a coach: ask for missing-field checks, clarity prompts, risk questions, and retry suggestions. AI should not create the final artifact for the learner. Evolve - Learner reflects on how the audit recommendation can improve SOP, dashboard control, staff training, or governance review for future cycles. Artifact to submit: L5 Corporate L&D Needs Transfer SOP Audit & Improvement Report. L5 Corporate L&D Needs Transfer SOP Audit & Improvement Report should contain: audit sample; trend table; control-gap finding; risk rating; SOP/dashboard recommendation; governance closure note. Required source data: manager request forms, performance data, business priority notes, learner profile, budget constraints, timeline. Evidence fields: Assess whether the audit uses trend evidence, identifies real control gaps, rates risk clearly, and recommends realistic SOP/dashboard/governance improvements. AI support: AI coach can ask: What source proves this? Which field is missing? What is the risk if this is wrong? Who owns the next action? Learner must answer using the case data, not guesses.',
  1,
  '25 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BBA HR
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-060' LIMIT 1),
  'BBA HR',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MBA HR and L&D
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-060' LIMIT 1),
  'MBA HR and L&D',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PG Diploma Learning and Development
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-060' LIMIT 1),
  'PG Diploma Learning and Development',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MA Human Resource Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-060' LIMIT 1),
  'MA Human Resource Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Voc Corporate Training
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-060' LIMIT 1),
  'B.Voc Corporate Training',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: LMS Course Shell Launch SOP Audit, Trend Analysis & Governance Report
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'LMS Course Shell Launch SOP Audit, Trend Analysis & Governance Report',
  'COURSE-L5-065',
  'Learner can audit patterns, find control gaps, and recommend governance improvements for configure lms course shells, enrollment rules, permissions, and completion controls for launch readiness and submit a workplace-ready L5 LMS Course Shell Launch SOP Audit & Improvement Report. Workplace scenario: Institution leaders are reviewing one month of lms course shell launch work covering 3 batches and 240 learners. The audit shows possible pattern-level risk because module sequence, completion rules, facilitator permissions, and certificate trigger are incomplete. The learner must analyse trends, locate control gaps, and recommend SOP or dashboard improvements with evidence. Learner artifact: L5 LMS Course Shell Launch SOP Audit & Improvement Report. Required data: course outline, LMS shell settings, user roles, completion rules, certificate settings, batch enrollment list. Evidence: Assess whether the audit uses trend evidence, identifies real control gaps, rates risk clearly, and recommends realistic SOP/dashboard/governance improvements.',
  '25 hours',
  'Active',
  'Digital Learning Platforms & Distributed Learning Operations',
  'technical',
  '["Triggered when an audit, trend analysis and governance improvement task needs a real workplace artifact, not a theory answer.","Demonstrates audit, trend analysis and governance improvement by producing and defending the L5 LMS Course Shell Launch SOP Audit & Improvement Report.","Learner can audit patterns, find control gaps, and recommend governance improvements for configure lms course shells, enrollment rules, permissions, and completion controls for launch readiness and submit a workplace-ready L5 LMS Course Shell Launch SOP Audit & Improvement Report."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: Module 1: LMS Course Shell Launch SOP Audit, Trend Analysis & Governance Report Workplace Artifact Build
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-065' LIMIT 1),
  'Module 1: LMS Course Shell Launch SOP Audit, Trend Analysis & Governance Report Workplace Artifact Build',
  'Triggered when an audit, trend analysis and governance improvement task needs a real workplace artifact, not a theory answer. The learner studies the case, reviews the required data, identifies the gap, creates the artifact, and checks it against evidence fields.',
  1,
  '["Education & Skilling","Digital Learning Platforms & Distributed Learning Operations","IND-CAP-13","L5","LMS course architecture","Enrollment and role permissions","Completion rule setup","Certificate trigger logic","Launch readiness testing"]'::jsonb,
  '["Engage","Explore","Explain","Express","Empower","Evolve","Artifact Build","Evidence Review","AI-Coached Retry"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Case: LMS Course Shell Launch SOP Audit, Trend Analysis & Governance Report
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-065' LIMIT 1)
   AND title = 'Module 1: LMS Course Shell Launch SOP Audit, Trend Analysis & Governance Report Workplace Artifact Build' LIMIT 1),
  'Workplace Case: LMS Course Shell Launch SOP Audit, Trend Analysis & Governance Report',
  'Institution leaders are reviewing one month of lms course shell launch work covering 3 batches and 240 learners. The audit shows possible pattern-level risk because module sequence, completion rules, facilitator permissions, and certificate trigger are incomplete. The learner must analyse trends, locate control gaps, and recommend SOP or dashboard improvements with evidence. The learner must solve the problem using the given data and produce the required workplace artifact.',
  'Workplace problem: Institution leaders are reviewing one month of lms course shell launch work covering 3 batches and 240 learners. The audit shows possible pattern-level risk because module sequence, completion rules, facilitator permissions, and certificate trigger are incomplete. The learner must analyse trends, locate control gaps, and recommend SOP or dashboard improvements with evidence. Pressure points: Governance pressure: leaders need evidence of control, not opinions. Learner must connect trend data, policy gaps, repeated errors, and improvement recommendations. Root cause focus: Trace pattern-level causes: weak SOP control, missing dashboard indicator, repeated ownership gap, unclear policy rule, or lack of audit trail. Major concepts: LMS course architecture; Enrollment and role permissions; Completion rule setup; Certificate trigger logic; Launch readiness testing; Learner access validation; Trend analysis; Control gap analysis; Governance recommendation. Level focus: audit, governance, and improvement. Required data: course outline, LMS shell settings, user roles, completion rules, certificate settings, batch enrollment list Learner activity flow: Engage - Start with the case: 3 batches and 240 learners and the visible pain point — module sequence, completion rules, facilitator permissions, and certificate trigger are incomplete. Learner identifies who is affected and what could go wrong if the work is delayed or wrong. Explore - Learner studies the source data: course outline, LMS shell settings, user roles, completion rules, certificate settings, batch enrollment list. They mark trusted records, missing fields, conflicting entries, and items that need confirmation before using them in the artifact. Explain - Teach the main logic in simple terms: LMS course architecture; Enrollment and role permissions; Completion rule setup; Certificate trigger logic; Launch readiness testing; Learner access validation; Trend analysis; Control gap analysis; Governance recommendation. Level focus: audit, governance, and improvement. Show how rules, evidence, decisions, and handoff notes connect in this workplace task. Express - Learner produces the L5 LMS Course Shell Launch SOP Audit & Improvement Report using the case data, writes decisions in plain English, and shows evidence for each important field instead of giving only a theory answer. Empower - Learner uses AI only as a coach: ask for missing-field checks, clarity prompts, risk questions, and retry suggestions. AI should not create the final artifact for the learner. Evolve - Learner reflects on how the audit recommendation can improve SOP, dashboard control, staff training, or governance review for future cycles. Artifact to submit: L5 LMS Course Shell Launch SOP Audit & Improvement Report. L5 LMS Course Shell Launch SOP Audit & Improvement Report should contain: audit sample; trend table; control-gap finding; risk rating; SOP/dashboard recommendation; governance closure note. Required source data: course outline, LMS shell settings, user roles, completion rules, certificate settings, batch enrollment list. Evidence fields: Assess whether the audit uses trend evidence, identifies real control gaps, rates risk clearly, and recommends realistic SOP/dashboard/governance improvements. AI support: AI coach can ask: What source proves this? Which field is missing? What is the risk if this is wrong? Who owns the next action? Learner must answer using the case data, not guesses.',
  1,
  '25 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BCA
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-065' LIMIT 1),
  'BCA',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc IT
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-065' LIMIT 1),
  'B.Sc IT',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Ed - Educational Technology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-065' LIMIT 1),
  'B.Ed - Educational Technology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Ed - Educational Technology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-065' LIMIT 1),
  'M.Ed - Educational Technology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PG Diploma LMS Administration
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-065' LIMIT 1),
  'PG Diploma LMS Administration',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Digital Learner Engagement Nudge SOP Audit, Trend Analysis & Governance Report
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Digital Learner Engagement Nudge SOP Audit, Trend Analysis & Governance Report',
  'COURSE-L5-070',
  'Learner can audit patterns, find control gaps, and recommend governance improvements for monitor digital learner activity and trigger timely nudges from platform engagement evidence and submit a workplace-ready L5 Digital Learner Engagement Nudge SOP Audit & Improvement Report. Workplace scenario: Institution leaders are reviewing one month of digital engagement nudge work covering 312 active learners in week 2. The audit shows possible pattern-level risk because 96 learners have low logins, 48 have missed quizzes, and support messages are not targeted. The learner must analyse trends, locate control gaps, and recommend SOP or dashboard improvements with evidence. Learner artifact: L5 Digital Learner Engagement Nudge SOP Audit & Improvement Report. Required data: login analytics, quiz completion, video watch data, support tickets, learner segments, nudge templates. Evidence: Assess whether the audit uses trend evidence, identifies real control gaps, rates risk clearly, and recommends realistic SOP/dashboard/governance improvements.',
  '25 hours',
  'Active',
  'Digital Learning Platforms & Distributed Learning Operations',
  'soft',
  '["Triggered when an audit, trend analysis and governance improvement task needs a real workplace artifact, not a theory answer.","Demonstrates audit, trend analysis and governance improvement by producing and defending the L5 Digital Learner Engagement Nudge SOP Audit & Improvement Report.","Learner can audit patterns, find control gaps, and recommend governance improvements for monitor digital learner activity and trigger timely nudges from platform engagement evidence and submit a workplace-ready L5 Digital Learner Engagement Nudge SOP Audit & Improvement Report."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: Module 1: Digital Learner Engagement Nudge SOP Audit, Trend Analysis & Governance Report Workplace Artifact Build
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-070' LIMIT 1),
  'Module 1: Digital Learner Engagement Nudge SOP Audit, Trend Analysis & Governance Report Workplace Artifact Build',
  'Triggered when an audit, trend analysis and governance improvement task needs a real workplace artifact, not a theory answer. The learner studies the case, reviews the required data, identifies the gap, creates the artifact, and checks it against evidence fields.',
  1,
  '["Education & Skilling","Digital Learning Platforms & Distributed Learning Operations","IND-CAP-14","L5","Engagement analytics","Learner segmentation","Nudge design","Risk indicator reading","Message timing"]'::jsonb,
  '["Engage","Explore","Explain","Express","Empower","Evolve","Artifact Build","Evidence Review","AI-Coached Retry"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Case: Digital Learner Engagement Nudge SOP Audit, Trend Analysis & Governance Report
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-070' LIMIT 1)
   AND title = 'Module 1: Digital Learner Engagement Nudge SOP Audit, Trend Analysis & Governance Report Workplace Artifact Build' LIMIT 1),
  'Workplace Case: Digital Learner Engagement Nudge SOP Audit, Trend Analysis & Governance Report',
  'Institution leaders are reviewing one month of digital engagement nudge work covering 312 active learners in week 2. The audit shows possible pattern-level risk because 96 learners have low logins, 48 have missed quizzes, and support messages are not targeted. The learner must analyse trends, locate control gaps, and recommend SOP or dashboard improvements with evidence. The learner must solve the problem using the given data and produce the required workplace artifact.',
  'Workplace problem: Institution leaders are reviewing one month of digital engagement nudge work covering 312 active learners in week 2. The audit shows possible pattern-level risk because 96 learners have low logins, 48 have missed quizzes, and support messages are not targeted. The learner must analyse trends, locate control gaps, and recommend SOP or dashboard improvements with evidence. Pressure points: Governance pressure: leaders need evidence of control, not opinions. Learner must connect trend data, policy gaps, repeated errors, and improvement recommendations. Root cause focus: Trace pattern-level causes: weak SOP control, missing dashboard indicator, repeated ownership gap, unclear policy rule, or lack of audit trail. Major concepts: Engagement analytics; Learner segmentation; Nudge design; Risk indicator reading; Message timing; Follow-up tracking; Trend analysis; Control gap analysis; Governance recommendation. Level focus: audit, governance, and improvement. Required data: login analytics, quiz completion, video watch data, support tickets, learner segments, nudge templates Learner activity flow: Engage - Start with the case: 312 active learners in week 2 and the visible pain point — 96 learners have low logins, 48 have missed quizzes, and support messages are not targeted. Learner identifies who is affected and what could go wrong if the work is delayed or wrong. Explore - Learner studies the source data: login analytics, quiz completion, video watch data, support tickets, learner segments, nudge templates. They mark trusted records, missing fields, conflicting entries, and items that need confirmation before using them in the artifact. Explain - Teach the main logic in simple terms: Engagement analytics; Learner segmentation; Nudge design; Risk indicator reading; Message timing; Follow-up tracking; Trend analysis; Control gap analysis; Governance recommendation. Level focus: audit, governance, and improvement. Show how rules, evidence, decisions, and handoff notes connect in this workplace task. Express - Learner produces the L5 Digital Learner Engagement Nudge SOP Audit & Improvement Report using the case data, writes decisions in plain English, and shows evidence for each important field instead of giving only a theory answer. Empower - Learner uses AI only as a coach: ask for missing-field checks, clarity prompts, risk questions, and retry suggestions. AI should not create the final artifact for the learner. Evolve - Learner reflects on how the audit recommendation can improve SOP, dashboard control, staff training, or governance review for future cycles. Artifact to submit: L5 Digital Learner Engagement Nudge SOP Audit & Improvement Report. L5 Digital Learner Engagement Nudge SOP Audit & Improvement Report should contain: audit sample; trend table; control-gap finding; risk rating; SOP/dashboard recommendation; governance closure note. Required source data: login analytics, quiz completion, video watch data, support tickets, learner segments, nudge templates. Evidence fields: Assess whether the audit uses trend evidence, identifies real control gaps, rates risk clearly, and recommends realistic SOP/dashboard/governance improvements. AI support: AI coach can ask: What source proves this? Which field is missing? What is the risk if this is wrong? Who owns the next action? Learner must answer using the case data, not guesses.',
  1,
  '25 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BCA
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-070' LIMIT 1),
  'BCA',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc IT
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-070' LIMIT 1),
  'B.Sc IT',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BA Communication
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-070' LIMIT 1),
  'BA Communication',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Ed - Digital Learning
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-070' LIMIT 1),
  'B.Ed - Digital Learning',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PG Diploma Digital Learning Engagement
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-070' LIMIT 1),
  'PG Diploma Digital Learning Engagement',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Remote Cohort Facilitation Control SOP Audit, Trend Analysis & Governance Report
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Remote Cohort Facilitation Control SOP Audit, Trend Analysis & Governance Report',
  'COURSE-L5-075',
  'Learner can audit patterns, find control gaps, and recommend governance improvements for control remote cohort facilitation through session access, participation, and digital delivery evidence and submit a workplace-ready L5 Remote Cohort Facilitation Control SOP Audit & Improvement Report. Workplace scenario: Institution leaders are reviewing one month of remote cohort facilitation work covering 4 online cohorts across 2 time zones. The audit shows possible pattern-level risk because attendance, breakout activities, facilitator notes, and learner questions are not captured consistently. The learner must analyse trends, locate control gaps, and recommend SOP or dashboard improvements with evidence. Learner artifact: L5 Remote Cohort Facilitation Control SOP Audit & Improvement Report. Required data: online session roster, attendance export, chat/Q&A log, breakout task evidence, facilitator notes, issue log. Evidence: Assess whether the audit uses trend evidence, identifies real control gaps, rates risk clearly, and recommends realistic SOP/dashboard/governance improvements.',
  '25 hours',
  'Active',
  'Digital Learning Platforms & Distributed Learning Operations',
  'soft',
  '["Triggered when an audit, trend analysis and governance improvement task needs a real workplace artifact, not a theory answer.","Demonstrates audit, trend analysis and governance improvement by producing and defending the L5 Remote Cohort Facilitation Control SOP Audit & Improvement Report.","Learner can audit patterns, find control gaps, and recommend governance improvements for control remote cohort facilitation through session access, participation, and digital delivery evidence and submit a workplace-ready L5 Remote Cohort Facilitation Control SOP Audit & Improvement Report."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: Module 1: Remote Cohort Facilitation Control SOP Audit, Trend Analysis & Governance Report Workplace Artifact Build
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-075' LIMIT 1),
  'Module 1: Remote Cohort Facilitation Control SOP Audit, Trend Analysis & Governance Report Workplace Artifact Build',
  'Triggered when an audit, trend analysis and governance improvement task needs a real workplace artifact, not a theory answer. The learner studies the case, reviews the required data, identifies the gap, creates the artifact, and checks it against evidence fields.',
  1,
  '["Education & Skilling","Digital Learning Platforms & Distributed Learning Operations","IND-CAP-15","L5","Remote facilitation control","Attendance and participation capture","Breakout evidence tracking","Live issue handling","Session closure note"]'::jsonb,
  '["Engage","Explore","Explain","Express","Empower","Evolve","Artifact Build","Evidence Review","AI-Coached Retry"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Case: Remote Cohort Facilitation Control SOP Audit, Trend Analysis & Governance Report
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-075' LIMIT 1)
   AND title = 'Module 1: Remote Cohort Facilitation Control SOP Audit, Trend Analysis & Governance Report Workplace Artifact Build' LIMIT 1),
  'Workplace Case: Remote Cohort Facilitation Control SOP Audit, Trend Analysis & Governance Report',
  'Institution leaders are reviewing one month of remote cohort facilitation work covering 4 online cohorts across 2 time zones. The audit shows possible pattern-level risk because attendance, breakout activities, facilitator notes, and learner questions are not captured consistently. The learner must analyse trends, locate control gaps, and recommend SOP or dashboard improvements with evidence. The learner must solve the problem using the given data and produce the required workplace artifact.',
  'Workplace problem: Institution leaders are reviewing one month of remote cohort facilitation work covering 4 online cohorts across 2 time zones. The audit shows possible pattern-level risk because attendance, breakout activities, facilitator notes, and learner questions are not captured consistently. The learner must analyse trends, locate control gaps, and recommend SOP or dashboard improvements with evidence. Pressure points: Governance pressure: leaders need evidence of control, not opinions. Learner must connect trend data, policy gaps, repeated errors, and improvement recommendations. Root cause focus: Trace pattern-level causes: weak SOP control, missing dashboard indicator, repeated ownership gap, unclear policy rule, or lack of audit trail. Major concepts: Remote facilitation control; Attendance and participation capture; Breakout evidence tracking; Live issue handling; Session closure note; Cohort follow-up; Trend analysis; Control gap analysis; Governance recommendation. Level focus: audit, governance, and improvement. Required data: online session roster, attendance export, chat/Q&A log, breakout task evidence, facilitator notes, issue log Learner activity flow: Engage - Start with the case: 4 online cohorts across 2 time zones and the visible pain point — attendance, breakout activities, facilitator notes, and learner questions are not captured consistently. Learner identifies who is affected and what could go wrong if the work is delayed or wrong. Explore - Learner studies the source data: online session roster, attendance export, chat/Q&A log, breakout task evidence, facilitator notes, issue log. They mark trusted records, missing fields, conflicting entries, and items that need confirmation before using them in the artifact. Explain - Teach the main logic in simple terms: Remote facilitation control; Attendance and participation capture; Breakout evidence tracking; Live issue handling; Session closure note; Cohort follow-up; Trend analysis; Control gap analysis; Governance recommendation. Level focus: audit, governance, and improvement. Show how rules, evidence, decisions, and handoff notes connect in this workplace task. Express - Learner produces the L5 Remote Cohort Facilitation Control SOP Audit & Improvement Report using the case data, writes decisions in plain English, and shows evidence for each important field instead of giving only a theory answer. Empower - Learner uses AI only as a coach: ask for missing-field checks, clarity prompts, risk questions, and retry suggestions. AI should not create the final artifact for the learner. Evolve - Learner reflects on how the audit recommendation can improve SOP, dashboard control, staff training, or governance review for future cycles. Artifact to submit: L5 Remote Cohort Facilitation Control SOP Audit & Improvement Report. L5 Remote Cohort Facilitation Control SOP Audit & Improvement Report should contain: audit sample; trend table; control-gap finding; risk rating; SOP/dashboard recommendation; governance closure note. Required source data: online session roster, attendance export, chat/Q&A log, breakout task evidence, facilitator notes, issue log. Evidence fields: Assess whether the audit uses trend evidence, identifies real control gaps, rates risk clearly, and recommends realistic SOP/dashboard/governance improvements. AI support: AI coach can ask: What source proves this? Which field is missing? What is the risk if this is wrong? Who owns the next action? Learner must answer using the case data, not guesses.',
  1,
  '25 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Ed - Online Teaching
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-075' LIMIT 1),
  'B.Ed - Online Teaching',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Ed - Educational Technology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-075' LIMIT 1),
  'M.Ed - Educational Technology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BA Education
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-075' LIMIT 1),
  'BA Education',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PG Diploma Online and Distance Learning
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-075' LIMIT 1),
  'PG Diploma Online and Distance Learning',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PG Diploma Virtual Facilitation
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-075' LIMIT 1),
  'PG Diploma Virtual Facilitation',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Tutoring Support Routing SOP Audit, Trend Analysis & Governance Report
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Tutoring Support Routing SOP Audit, Trend Analysis & Governance Report',
  'COURSE-L5-080',
  'Learner can audit patterns, find control gaps, and recommend governance improvements for tutoring support requests using academic need, availability, and intervention-fit evidence and submit a workplace-ready L5 Tutoring Support Routing SOP Audit & Improvement Report. Workplace scenario: Institution leaders are reviewing one month of tutoring support routing work covering 74 learners requesting support. The audit shows possible pattern-level risk because some learners need concept help, some need language support, and some have attendance or confidence issues. The learner must analyse trends, locate control gaps, and recommend SOP or dashboard improvements with evidence. Learner artifact: L5 Tutoring Support Routing SOP Audit & Improvement Report. Required data: support request form, diagnostic quiz, attendance record, tutor availability, learner notes, priority rules. Evidence: Assess whether the audit uses trend evidence, identifies real control gaps, rates risk clearly, and recommends realistic SOP/dashboard/governance improvements.',
  '25 hours',
  'Active',
  'Digital Learning Platforms & Distributed Learning Operations',
  'soft',
  '["Triggered when an audit, trend analysis and governance improvement task needs a real workplace artifact, not a theory answer.","Demonstrates audit, trend analysis and governance improvement by producing and defending the L5 Tutoring Support Routing SOP Audit & Improvement Report.","Learner can audit patterns, find control gaps, and recommend governance improvements for tutoring support requests using academic need, availability, and intervention-fit evidence and submit a workplace-ready L5 Tutoring Support Routing SOP Audit & Improvement Report."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: Module 1: Tutoring Support Routing SOP Audit, Trend Analysis & Governance Report Workplace Artifact Build
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-080' LIMIT 1),
  'Module 1: Tutoring Support Routing SOP Audit, Trend Analysis & Governance Report Workplace Artifact Build',
  'Triggered when an audit, trend analysis and governance improvement task needs a real workplace artifact, not a theory answer. The learner studies the case, reviews the required data, identifies the gap, creates the artifact, and checks it against evidence fields.',
  1,
  '["Education & Skilling","Digital Learning Platforms & Distributed Learning Operations","IND-CAP-16","L5","Support need classification","Diagnostic evidence reading","Tutor matching","Priority routing","Support session planning"]'::jsonb,
  '["Engage","Explore","Explain","Express","Empower","Evolve","Artifact Build","Evidence Review","AI-Coached Retry"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Case: Tutoring Support Routing SOP Audit, Trend Analysis & Governance Report
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-080' LIMIT 1)
   AND title = 'Module 1: Tutoring Support Routing SOP Audit, Trend Analysis & Governance Report Workplace Artifact Build' LIMIT 1),
  'Workplace Case: Tutoring Support Routing SOP Audit, Trend Analysis & Governance Report',
  'Institution leaders are reviewing one month of tutoring support routing work covering 74 learners requesting support. The audit shows possible pattern-level risk because some learners need concept help, some need language support, and some have attendance or confidence issues. The learner must analyse trends, locate control gaps, and recommend SOP or dashboard improvements with evidence. The learner must solve the problem using the given data and produce the required workplace artifact.',
  'Workplace problem: Institution leaders are reviewing one month of tutoring support routing work covering 74 learners requesting support. The audit shows possible pattern-level risk because some learners need concept help, some need language support, and some have attendance or confidence issues. The learner must analyse trends, locate control gaps, and recommend SOP or dashboard improvements with evidence. Pressure points: Governance pressure: leaders need evidence of control, not opinions. Learner must connect trend data, policy gaps, repeated errors, and improvement recommendations. Root cause focus: Trace pattern-level causes: weak SOP control, missing dashboard indicator, repeated ownership gap, unclear policy rule, or lack of audit trail. Major concepts: Support need classification; Diagnostic evidence reading; Tutor matching; Priority routing; Support session planning; Progress follow-up; Trend analysis; Control gap analysis; Governance recommendation. Level focus: audit, governance, and improvement. Required data: support request form, diagnostic quiz, attendance record, tutor availability, learner notes, priority rules Learner activity flow: Engage - Start with the case: 74 learners requesting support and the visible pain point — some learners need concept help, some need language support, and some have attendance or confidence issues. Learner identifies who is affected and what could go wrong if the work is delayed or wrong. Explore - Learner studies the source data: support request form, diagnostic quiz, attendance record, tutor availability, learner notes, priority rules. They mark trusted records, missing fields, conflicting entries, and items that need confirmation before using them in the artifact. Explain - Teach the main logic in simple terms: Support need classification; Diagnostic evidence reading; Tutor matching; Priority routing; Support session planning; Progress follow-up; Trend analysis; Control gap analysis; Governance recommendation. Level focus: audit, governance, and improvement. Show how rules, evidence, decisions, and handoff notes connect in this workplace task. Express - Learner produces the L5 Tutoring Support Routing SOP Audit & Improvement Report using the case data, writes decisions in plain English, and shows evidence for each important field instead of giving only a theory answer. Empower - Learner uses AI only as a coach: ask for missing-field checks, clarity prompts, risk questions, and retry suggestions. AI should not create the final artifact for the learner. Evolve - Learner reflects on how the audit recommendation can improve SOP, dashboard control, staff training, or governance review for future cycles. Artifact to submit: L5 Tutoring Support Routing SOP Audit & Improvement Report. L5 Tutoring Support Routing SOP Audit & Improvement Report should contain: audit sample; trend table; control-gap finding; risk rating; SOP/dashboard recommendation; governance closure note. Required source data: support request form, diagnostic quiz, attendance record, tutor availability, learner notes, priority rules. Evidence fields: Assess whether the audit uses trend evidence, identifies real control gaps, rates risk clearly, and recommends realistic SOP/dashboard/governance improvements. AI support: AI coach can ask: What source proves this? Which field is missing? What is the risk if this is wrong? Who owns the next action? Learner must answer using the case data, not guesses.',
  1,
  '25 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Ed - Subject Tutoring
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-080' LIMIT 1),
  'B.Ed - Subject Tutoring',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BA Education
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-080' LIMIT 1),
  'BA Education',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Education
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-080' LIMIT 1),
  'B.Sc Education',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PG Diploma Tutoring and Coaching
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-080' LIMIT 1),
  'PG Diploma Tutoring and Coaching',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PG Diploma Inclusive Learning Support
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-080' LIMIT 1),
  'PG Diploma Inclusive Learning Support',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Assessment Blueprinting SOP Audit, Trend Analysis & Governance Report
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Assessment Blueprinting SOP Audit, Trend Analysis & Governance Report',
  'COURSE-L5-085',
  'Learner can audit patterns, find control gaps, and recommend governance improvements for build assessment blueprints and items aligned to competency level, evidence standard, and validity requirements and submit a workplace-ready L5 Assessment Blueprinting SOP Audit & Improvement Report. Workplace scenario: Institution leaders are reviewing one month of assessment blueprinting work covering 60 questions across 5 outcomes. The audit shows possible pattern-level risk because items do not match competency levels, evidence requirements, marks, or difficulty balance. The learner must analyse trends, locate control gaps, and recommend SOP or dashboard improvements with evidence. Learner artifact: L5 Assessment Blueprinting SOP Audit & Improvement Report. Required data: learning outcomes, item bank, marks table, difficulty tags, competency map, rubric draft. Evidence: Assess whether the audit uses trend evidence, identifies real control gaps, rates risk clearly, and recommends realistic SOP/dashboard/governance improvements.',
  '25 hours',
  'Active',
  'Assessment, Certification & Credentialing',
  'technical',
  '["Triggered when an audit, trend analysis and governance improvement task needs a real workplace artifact, not a theory answer.","Demonstrates audit, trend analysis and governance improvement by producing and defending the L5 Assessment Blueprinting SOP Audit & Improvement Report.","Learner can audit patterns, find control gaps, and recommend governance improvements for build assessment blueprints and items aligned to competency level, evidence standard, and validity requirements and submit a workplace-ready L5 Assessment Blueprinting SOP Audit & Improvement Report."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: Module 1: Assessment Blueprinting SOP Audit, Trend Analysis & Governance Report Workplace Artifact Build
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-085' LIMIT 1),
  'Module 1: Assessment Blueprinting SOP Audit, Trend Analysis & Governance Report Workplace Artifact Build',
  'Triggered when an audit, trend analysis and governance improvement task needs a real workplace artifact, not a theory answer. The learner studies the case, reviews the required data, identifies the gap, creates the artifact, and checks it against evidence fields.',
  1,
  '["Education & Skilling","Assessment, Certification & Credentialing","IND-CAP-17","L5","Assessment blueprinting","Outcome-item alignment","Difficulty distribution","Marks weighting","Evidence validity"]'::jsonb,
  '["Engage","Explore","Explain","Express","Empower","Evolve","Artifact Build","Evidence Review","AI-Coached Retry"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Case: Assessment Blueprinting SOP Audit, Trend Analysis & Governance Report
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-085' LIMIT 1)
   AND title = 'Module 1: Assessment Blueprinting SOP Audit, Trend Analysis & Governance Report Workplace Artifact Build' LIMIT 1),
  'Workplace Case: Assessment Blueprinting SOP Audit, Trend Analysis & Governance Report',
  'Institution leaders are reviewing one month of assessment blueprinting work covering 60 questions across 5 outcomes. The audit shows possible pattern-level risk because items do not match competency levels, evidence requirements, marks, or difficulty balance. The learner must analyse trends, locate control gaps, and recommend SOP or dashboard improvements with evidence. The learner must solve the problem using the given data and produce the required workplace artifact.',
  'Workplace problem: Institution leaders are reviewing one month of assessment blueprinting work covering 60 questions across 5 outcomes. The audit shows possible pattern-level risk because items do not match competency levels, evidence requirements, marks, or difficulty balance. The learner must analyse trends, locate control gaps, and recommend SOP or dashboard improvements with evidence. Pressure points: Governance pressure: leaders need evidence of control, not opinions. Learner must connect trend data, policy gaps, repeated errors, and improvement recommendations. Root cause focus: Trace pattern-level causes: weak SOP control, missing dashboard indicator, repeated ownership gap, unclear policy rule, or lack of audit trail. Major concepts: Assessment blueprinting; Outcome-item alignment; Difficulty distribution; Marks weighting; Evidence validity; Rubric linkage; Trend analysis; Control gap analysis; Governance recommendation. Level focus: audit, governance, and improvement. Required data: learning outcomes, item bank, marks table, difficulty tags, competency map, rubric draft Learner activity flow: Engage - Start with the case: 60 questions across 5 outcomes and the visible pain point — items do not match competency levels, evidence requirements, marks, or difficulty balance. Learner identifies who is affected and what could go wrong if the work is delayed or wrong. Explore - Learner studies the source data: learning outcomes, item bank, marks table, difficulty tags, competency map, rubric draft. They mark trusted records, missing fields, conflicting entries, and items that need confirmation before using them in the artifact. Explain - Teach the main logic in simple terms: Assessment blueprinting; Outcome-item alignment; Difficulty distribution; Marks weighting; Evidence validity; Rubric linkage; Trend analysis; Control gap analysis; Governance recommendation. Level focus: audit, governance, and improvement. Show how rules, evidence, decisions, and handoff notes connect in this workplace task. Express - Learner produces the L5 Assessment Blueprinting SOP Audit & Improvement Report using the case data, writes decisions in plain English, and shows evidence for each important field instead of giving only a theory answer. Empower - Learner uses AI only as a coach: ask for missing-field checks, clarity prompts, risk questions, and retry suggestions. AI should not create the final artifact for the learner. Evolve - Learner reflects on how the audit recommendation can improve SOP, dashboard control, staff training, or governance review for future cycles. Artifact to submit: L5 Assessment Blueprinting SOP Audit & Improvement Report. L5 Assessment Blueprinting SOP Audit & Improvement Report should contain: audit sample; trend table; control-gap finding; risk rating; SOP/dashboard recommendation; governance closure note. Required source data: learning outcomes, item bank, marks table, difficulty tags, competency map, rubric draft. Evidence fields: Assess whether the audit uses trend evidence, identifies real control gaps, rates risk clearly, and recommends realistic SOP/dashboard/governance improvements. AI support: AI coach can ask: What source proves this? Which field is missing? What is the risk if this is wrong? Who owns the next action? Learner must answer using the case data, not guesses.',
  1,
  '25 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Ed - Assessment Design
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-085' LIMIT 1),
  'B.Ed - Assessment Design',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Ed - Assessment and Evaluation
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-085' LIMIT 1),
  'M.Ed - Assessment and Evaluation',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MA Education
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-085' LIMIT 1),
  'MA Education',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PG Diploma Educational Assessment
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-085' LIMIT 1),
  'PG Diploma Educational Assessment',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PG Diploma Instructional Design
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-085' LIMIT 1),
  'PG Diploma Instructional Design',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Rubric Evaluation Review SOP Audit, Trend Analysis & Governance Report
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Rubric Evaluation Review SOP Audit, Trend Analysis & Governance Report',
  'COURSE-L5-090',
  'Learner can audit patterns, find control gaps, and recommend governance improvements for apply rubrics and score reviews to produce fair, evidence-based learner evaluation decisions and submit a workplace-ready L5 Rubric Evaluation Review SOP Audit & Improvement Report. Workplace scenario: Institution leaders are reviewing one month of rubric evaluation work covering 45 submitted artifacts from 3 sections. The audit shows possible pattern-level risk because evaluators are scoring differently, feedback quality varies, and borderline cases are unclear. The learner must analyse trends, locate control gaps, and recommend SOP or dashboard improvements with evidence. Learner artifact: L5 Rubric Evaluation Review SOP Audit & Improvement Report. Required data: rubric, learner artifacts, evaluator scores, feedback comments, moderation notes, sample answers. Evidence: Assess whether the audit uses trend evidence, identifies real control gaps, rates risk clearly, and recommends realistic SOP/dashboard/governance improvements.',
  '25 hours',
  'Active',
  'Assessment, Certification & Credentialing',
  'technical',
  '["Triggered when an audit, trend analysis and governance improvement task needs a real workplace artifact, not a theory answer.","Demonstrates audit, trend analysis and governance improvement by producing and defending the L5 Rubric Evaluation Review SOP Audit & Improvement Report.","Learner can audit patterns, find control gaps, and recommend governance improvements for apply rubrics and score reviews to produce fair, evidence-based learner evaluation decisions and submit a workplace-ready L5 Rubric Evaluation Review SOP Audit & Improvement Report."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: Module 1: Rubric Evaluation Review SOP Audit, Trend Analysis & Governance Report Workplace Artifact Build
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-090' LIMIT 1),
  'Module 1: Rubric Evaluation Review SOP Audit, Trend Analysis & Governance Report Workplace Artifact Build',
  'Triggered when an audit, trend analysis and governance improvement task needs a real workplace artifact, not a theory answer. The learner studies the case, reviews the required data, identifies the gap, creates the artifact, and checks it against evidence fields.',
  1,
  '["Education & Skilling","Assessment, Certification & Credentialing","IND-CAP-18","L5","Rubric interpretation","Evidence-based scoring","Inter-rater consistency","Feedback quality","Moderation decision"]'::jsonb,
  '["Engage","Explore","Explain","Express","Empower","Evolve","Artifact Build","Evidence Review","AI-Coached Retry"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Case: Rubric Evaluation Review SOP Audit, Trend Analysis & Governance Report
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-090' LIMIT 1)
   AND title = 'Module 1: Rubric Evaluation Review SOP Audit, Trend Analysis & Governance Report Workplace Artifact Build' LIMIT 1),
  'Workplace Case: Rubric Evaluation Review SOP Audit, Trend Analysis & Governance Report',
  'Institution leaders are reviewing one month of rubric evaluation work covering 45 submitted artifacts from 3 sections. The audit shows possible pattern-level risk because evaluators are scoring differently, feedback quality varies, and borderline cases are unclear. The learner must analyse trends, locate control gaps, and recommend SOP or dashboard improvements with evidence. The learner must solve the problem using the given data and produce the required workplace artifact.',
  'Workplace problem: Institution leaders are reviewing one month of rubric evaluation work covering 45 submitted artifacts from 3 sections. The audit shows possible pattern-level risk because evaluators are scoring differently, feedback quality varies, and borderline cases are unclear. The learner must analyse trends, locate control gaps, and recommend SOP or dashboard improvements with evidence. Pressure points: Governance pressure: leaders need evidence of control, not opinions. Learner must connect trend data, policy gaps, repeated errors, and improvement recommendations. Root cause focus: Trace pattern-level causes: weak SOP control, missing dashboard indicator, repeated ownership gap, unclear policy rule, or lack of audit trail. Major concepts: Rubric interpretation; Evidence-based scoring; Inter-rater consistency; Feedback quality; Moderation decision; Borderline case handling; Trend analysis; Control gap analysis; Governance recommendation. Level focus: audit, governance, and improvement. Required data: rubric, learner artifacts, evaluator scores, feedback comments, moderation notes, sample answers Learner activity flow: Engage - Start with the case: 45 submitted artifacts from 3 sections and the visible pain point — evaluators are scoring differently, feedback quality varies, and borderline cases are unclear. Learner identifies who is affected and what could go wrong if the work is delayed or wrong. Explore - Learner studies the source data: rubric, learner artifacts, evaluator scores, feedback comments, moderation notes, sample answers. They mark trusted records, missing fields, conflicting entries, and items that need confirmation before using them in the artifact. Explain - Teach the main logic in simple terms: Rubric interpretation; Evidence-based scoring; Inter-rater consistency; Feedback quality; Moderation decision; Borderline case handling; Trend analysis; Control gap analysis; Governance recommendation. Level focus: audit, governance, and improvement. Show how rules, evidence, decisions, and handoff notes connect in this workplace task. Express - Learner produces the L5 Rubric Evaluation Review SOP Audit & Improvement Report using the case data, writes decisions in plain English, and shows evidence for each important field instead of giving only a theory answer. Empower - Learner uses AI only as a coach: ask for missing-field checks, clarity prompts, risk questions, and retry suggestions. AI should not create the final artifact for the learner. Evolve - Learner reflects on how the audit recommendation can improve SOP, dashboard control, staff training, or governance review for future cycles. Artifact to submit: L5 Rubric Evaluation Review SOP Audit & Improvement Report. L5 Rubric Evaluation Review SOP Audit & Improvement Report should contain: audit sample; trend table; control-gap finding; risk rating; SOP/dashboard recommendation; governance closure note. Required source data: rubric, learner artifacts, evaluator scores, feedback comments, moderation notes, sample answers. Evidence fields: Assess whether the audit uses trend evidence, identifies real control gaps, rates risk clearly, and recommends realistic SOP/dashboard/governance improvements. AI support: AI coach can ask: What source proves this? Which field is missing? What is the risk if this is wrong? Who owns the next action? Learner must answer using the case data, not guesses.',
  1,
  '25 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Ed - Assessment Practice
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-090' LIMIT 1),
  'B.Ed - Assessment Practice',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Ed - Evaluation Studies
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-090' LIMIT 1),
  'M.Ed - Evaluation Studies',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MA Education
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-090' LIMIT 1),
  'MA Education',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PG Diploma Assessment and Rubrics
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-090' LIMIT 1),
  'PG Diploma Assessment and Rubrics',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PG Diploma Coaching Evaluation
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-090' LIMIT 1),
  'PG Diploma Coaching Evaluation',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Credential Issuance SOP Audit, Trend Analysis & Governance Report
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Credential Issuance SOP Audit, Trend Analysis & Governance Report',
  'COURSE-L5-095',
  'Learner can audit patterns, find control gaps, and recommend governance improvements for issue credentials through eligibility, assessment completion, and certification record verification and submit a workplace-ready L5 Credential Issuance SOP Audit & Improvement Report. Workplace scenario: Institution leaders are reviewing one month of credential issuance work covering 138 learners marked complete. The audit shows possible pattern-level risk because identity details, assessment completion, payment status, and approval records do not match for 19 learners. The learner must analyse trends, locate control gaps, and recommend SOP or dashboard improvements with evidence. Learner artifact: L5 Credential Issuance SOP Audit & Improvement Report. Required data: completion report, assessment result sheet, learner ID records, payment/status file, approval list, certificate template. Evidence: Assess whether the audit uses trend evidence, identifies real control gaps, rates risk clearly, and recommends realistic SOP/dashboard/governance improvements.',
  '25 hours',
  'Active',
  'Assessment, Certification & Credentialing',
  'technical',
  '["Triggered when an audit, trend analysis and governance improvement task needs a real workplace artifact, not a theory answer.","Demonstrates audit, trend analysis and governance improvement by producing and defending the L5 Credential Issuance SOP Audit & Improvement Report.","Learner can audit patterns, find control gaps, and recommend governance improvements for issue credentials through eligibility, assessment completion, and certification record verification and submit a workplace-ready L5 Credential Issuance SOP Audit & Improvement Report."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: Module 1: Credential Issuance SOP Audit, Trend Analysis & Governance Report Workplace Artifact Build
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-095' LIMIT 1),
  'Module 1: Credential Issuance SOP Audit, Trend Analysis & Governance Report Workplace Artifact Build',
  'Triggered when an audit, trend analysis and governance improvement task needs a real workplace artifact, not a theory answer. The learner studies the case, reviews the required data, identifies the gap, creates the artifact, and checks it against evidence fields.',
  1,
  '["Education & Skilling","Assessment, Certification & Credentialing","IND-CAP-19","L5","Credential eligibility","Completion verification","Identity data matching","Certificate data control","Approval workflow"]'::jsonb,
  '["Engage","Explore","Explain","Express","Empower","Evolve","Artifact Build","Evidence Review","AI-Coached Retry"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Case: Credential Issuance SOP Audit, Trend Analysis & Governance Report
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-095' LIMIT 1)
   AND title = 'Module 1: Credential Issuance SOP Audit, Trend Analysis & Governance Report Workplace Artifact Build' LIMIT 1),
  'Workplace Case: Credential Issuance SOP Audit, Trend Analysis & Governance Report',
  'Institution leaders are reviewing one month of credential issuance work covering 138 learners marked complete. The audit shows possible pattern-level risk because identity details, assessment completion, payment status, and approval records do not match for 19 learners. The learner must analyse trends, locate control gaps, and recommend SOP or dashboard improvements with evidence. The learner must solve the problem using the given data and produce the required workplace artifact.',
  'Workplace problem: Institution leaders are reviewing one month of credential issuance work covering 138 learners marked complete. The audit shows possible pattern-level risk because identity details, assessment completion, payment status, and approval records do not match for 19 learners. The learner must analyse trends, locate control gaps, and recommend SOP or dashboard improvements with evidence. Pressure points: Governance pressure: leaders need evidence of control, not opinions. Learner must connect trend data, policy gaps, repeated errors, and improvement recommendations. Root cause focus: Trace pattern-level causes: weak SOP control, missing dashboard indicator, repeated ownership gap, unclear policy rule, or lack of audit trail. Major concepts: Credential eligibility; Completion verification; Identity data matching; Certificate data control; Approval workflow; Issuance audit trail; Trend analysis; Control gap analysis; Governance recommendation. Level focus: audit, governance, and improvement. Required data: completion report, assessment result sheet, learner ID records, payment/status file, approval list, certificate template Learner activity flow: Engage - Start with the case: 138 learners marked complete and the visible pain point — identity details, assessment completion, payment status, and approval records do not match for 19 learners. Learner identifies who is affected and what could go wrong if the work is delayed or wrong. Explore - Learner studies the source data: completion report, assessment result sheet, learner ID records, payment/status file, approval list, certificate template. They mark trusted records, missing fields, conflicting entries, and items that need confirmation before using them in the artifact. Explain - Teach the main logic in simple terms: Credential eligibility; Completion verification; Identity data matching; Certificate data control; Approval workflow; Issuance audit trail; Trend analysis; Control gap analysis; Governance recommendation. Level focus: audit, governance, and improvement. Show how rules, evidence, decisions, and handoff notes connect in this workplace task. Express - Learner produces the L5 Credential Issuance SOP Audit & Improvement Report using the case data, writes decisions in plain English, and shows evidence for each important field instead of giving only a theory answer. Empower - Learner uses AI only as a coach: ask for missing-field checks, clarity prompts, risk questions, and retry suggestions. AI should not create the final artifact for the learner. Evolve - Learner reflects on how the audit recommendation can improve SOP, dashboard control, staff training, or governance review for future cycles. Artifact to submit: L5 Credential Issuance SOP Audit & Improvement Report. L5 Credential Issuance SOP Audit & Improvement Report should contain: audit sample; trend table; control-gap finding; risk rating; SOP/dashboard recommendation; governance closure note. Required source data: completion report, assessment result sheet, learner ID records, payment/status file, approval list, certificate template. Evidence fields: Assess whether the audit uses trend evidence, identifies real control gaps, rates risk clearly, and recommends realistic SOP/dashboard/governance improvements. AI support: AI coach can ask: What source proves this? Which field is missing? What is the risk if this is wrong? Who owns the next action? Learner must answer using the case data, not guesses.',
  1,
  '25 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BBA Education Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-095' LIMIT 1),
  'BBA Education Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Com - Academic Operations
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-095' LIMIT 1),
  'B.Com - Academic Operations',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BA Public Administration
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-095' LIMIT 1),
  'BA Public Administration',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PG Diploma Certification Operations
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-095' LIMIT 1),
  'PG Diploma Certification Operations',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MBA Education Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-095' LIMIT 1),
  'MBA Education Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Exam Operations Control SOP Audit, Trend Analysis & Governance Report
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Exam Operations Control SOP Audit, Trend Analysis & Governance Report',
  'COURSE-L5-100',
  'Learner can audit patterns, find control gaps, and recommend governance improvements for control exam operations through scheduling, candidate readiness, invigilation, and exception handling and submit a workplace-ready L5 Exam Operations Control SOP Audit & Improvement Report. Workplace scenario: Institution leaders are reviewing one month of exam operations work covering 420 candidates across 8 rooms. The audit shows possible pattern-level risk because seat plan, invigilator duty, question-paper packets, access needs, and incident rules are not fully aligned. The learner must analyse trends, locate control gaps, and recommend SOP or dashboard improvements with evidence. Learner artifact: L5 Exam Operations Control SOP Audit & Improvement Report. Required data: candidate list, room plan, invigilator roster, question-paper packet list, access accommodation list, incident format. Evidence: Assess whether the audit uses trend evidence, identifies real control gaps, rates risk clearly, and recommends realistic SOP/dashboard/governance improvements.',
  '25 hours',
  'Active',
  'Assessment, Certification & Credentialing',
  'technical',
  '["Triggered when an audit, trend analysis and governance improvement task needs a real workplace artifact, not a theory answer.","Demonstrates audit, trend analysis and governance improvement by producing and defending the L5 Exam Operations Control SOP Audit & Improvement Report.","Learner can audit patterns, find control gaps, and recommend governance improvements for control exam operations through scheduling, candidate readiness, invigilation, and exception handling and submit a workplace-ready L5 Exam Operations Control SOP Audit & Improvement Report."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: Module 1: Exam Operations Control SOP Audit, Trend Analysis & Governance Report Workplace Artifact Build
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-100' LIMIT 1),
  'Module 1: Exam Operations Control SOP Audit, Trend Analysis & Governance Report Workplace Artifact Build',
  'Triggered when an audit, trend analysis and governance improvement task needs a real workplace artifact, not a theory answer. The learner studies the case, reviews the required data, identifies the gap, creates the artifact, and checks it against evidence fields.',
  1,
  '["Education & Skilling","Assessment, Certification & Credentialing","IND-CAP-20","L5","Exam logistics control","Seating and room allocation","Invigilator duty mapping","Confidential material control","Incident reporting"]'::jsonb,
  '["Engage","Explore","Explain","Express","Empower","Evolve","Artifact Build","Evidence Review","AI-Coached Retry"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Case: Exam Operations Control SOP Audit, Trend Analysis & Governance Report
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-100' LIMIT 1)
   AND title = 'Module 1: Exam Operations Control SOP Audit, Trend Analysis & Governance Report Workplace Artifact Build' LIMIT 1),
  'Workplace Case: Exam Operations Control SOP Audit, Trend Analysis & Governance Report',
  'Institution leaders are reviewing one month of exam operations work covering 420 candidates across 8 rooms. The audit shows possible pattern-level risk because seat plan, invigilator duty, question-paper packets, access needs, and incident rules are not fully aligned. The learner must analyse trends, locate control gaps, and recommend SOP or dashboard improvements with evidence. The learner must solve the problem using the given data and produce the required workplace artifact.',
  'Workplace problem: Institution leaders are reviewing one month of exam operations work covering 420 candidates across 8 rooms. The audit shows possible pattern-level risk because seat plan, invigilator duty, question-paper packets, access needs, and incident rules are not fully aligned. The learner must analyse trends, locate control gaps, and recommend SOP or dashboard improvements with evidence. Pressure points: Governance pressure: leaders need evidence of control, not opinions. Learner must connect trend data, policy gaps, repeated errors, and improvement recommendations. Root cause focus: Trace pattern-level causes: weak SOP control, missing dashboard indicator, repeated ownership gap, unclear policy rule, or lack of audit trail. Major concepts: Exam logistics control; Seating and room allocation; Invigilator duty mapping; Confidential material control; Incident reporting; Compliance checklist; Trend analysis; Control gap analysis; Governance recommendation. Level focus: audit, governance, and improvement. Required data: candidate list, room plan, invigilator roster, question-paper packet list, access accommodation list, incident format Learner activity flow: Engage - Start with the case: 420 candidates across 8 rooms and the visible pain point — seat plan, invigilator duty, question-paper packets, access needs, and incident rules are not fully aligned. Learner identifies who is affected and what could go wrong if the work is delayed or wrong. Explore - Learner studies the source data: candidate list, room plan, invigilator roster, question-paper packet list, access accommodation list, incident format. They mark trusted records, missing fields, conflicting entries, and items that need confirmation before using them in the artifact. Explain - Teach the main logic in simple terms: Exam logistics control; Seating and room allocation; Invigilator duty mapping; Confidential material control; Incident reporting; Compliance checklist; Trend analysis; Control gap analysis; Governance recommendation. Level focus: audit, governance, and improvement. Show how rules, evidence, decisions, and handoff notes connect in this workplace task. Express - Learner produces the L5 Exam Operations Control SOP Audit & Improvement Report using the case data, writes decisions in plain English, and shows evidence for each important field instead of giving only a theory answer. Empower - Learner uses AI only as a coach: ask for missing-field checks, clarity prompts, risk questions, and retry suggestions. AI should not create the final artifact for the learner. Evolve - Learner reflects on how the audit recommendation can improve SOP, dashboard control, staff training, or governance review for future cycles. Artifact to submit: L5 Exam Operations Control SOP Audit & Improvement Report. L5 Exam Operations Control SOP Audit & Improvement Report should contain: audit sample; trend table; control-gap finding; risk rating; SOP/dashboard recommendation; governance closure note. Required source data: candidate list, room plan, invigilator roster, question-paper packet list, access accommodation list, incident format. Evidence fields: Assess whether the audit uses trend evidence, identifies real control gaps, rates risk clearly, and recommends realistic SOP/dashboard/governance improvements. AI support: AI coach can ask: What source proves this? Which field is missing? What is the risk if this is wrong? Who owns the next action? Learner must answer using the case data, not guesses.',
  1,
  '25 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Ed - Exam Operations
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-100' LIMIT 1),
  'B.Ed - Exam Operations',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BBA Education Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-100' LIMIT 1),
  'BBA Education Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BA Public Administration
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-100' LIMIT 1),
  'BA Public Administration',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PG Diploma Exam Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-100' LIMIT 1),
  'PG Diploma Exam Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Ed - Assessment Administration
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-100' LIMIT 1),
  'M.Ed - Assessment Administration',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Learner Support Planning SOP Audit, Trend Analysis & Governance Report
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Learner Support Planning SOP Audit, Trend Analysis & Governance Report',
  'COURSE-L5-105',
  'Learner can audit patterns, find control gaps, and recommend governance improvements for create learner support plans from accessibility, referral, and progress evidence and submit a workplace-ready L5 Learner Support Planning SOP Audit & Improvement Report. Workplace scenario: Institution leaders are reviewing one month of learner support planning work covering 58 learners flagged for support. The audit shows possible pattern-level risk because support needs, accommodation requests, guardian notes, teacher observations, and resource availability are incomplete. The learner must analyse trends, locate control gaps, and recommend SOP or dashboard improvements with evidence. Learner artifact: L5 Learner Support Planning SOP Audit & Improvement Report. Required data: learner profile, accommodation request, teacher observation, support history, resource list, meeting notes. Evidence: Assess whether the audit uses trend evidence, identifies real control gaps, rates risk clearly, and recommends realistic SOP/dashboard/governance improvements.',
  '25 hours',
  'Active',
  'Learner Support, Guidance & Coaching Services',
  'soft',
  '["Triggered when an audit, trend analysis and governance improvement task needs a real workplace artifact, not a theory answer.","Demonstrates audit, trend analysis and governance improvement by producing and defending the L5 Learner Support Planning SOP Audit & Improvement Report.","Learner can audit patterns, find control gaps, and recommend governance improvements for create learner support plans from accessibility, referral, and progress evidence and submit a workplace-ready L5 Learner Support Planning SOP Audit & Improvement Report."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: Module 1: Learner Support Planning SOP Audit, Trend Analysis & Governance Report Workplace Artifact Build
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-105' LIMIT 1),
  'Module 1: Learner Support Planning SOP Audit, Trend Analysis & Governance Report Workplace Artifact Build',
  'Triggered when an audit, trend analysis and governance improvement task needs a real workplace artifact, not a theory answer. The learner studies the case, reviews the required data, identifies the gap, creates the artifact, and checks it against evidence fields.',
  1,
  '["Education & Skilling","Learner Support, Guidance & Coaching Services","IND-CAP-21","L5","Inclusive support planning","Accommodation mapping","Learner profile interpretation","Stakeholder coordination","Support action plan"]'::jsonb,
  '["Engage","Explore","Explain","Express","Empower","Evolve","Artifact Build","Evidence Review","AI-Coached Retry"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Case: Learner Support Planning SOP Audit, Trend Analysis & Governance Report
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-105' LIMIT 1)
   AND title = 'Module 1: Learner Support Planning SOP Audit, Trend Analysis & Governance Report Workplace Artifact Build' LIMIT 1),
  'Workplace Case: Learner Support Planning SOP Audit, Trend Analysis & Governance Report',
  'Institution leaders are reviewing one month of learner support planning work covering 58 learners flagged for support. The audit shows possible pattern-level risk because support needs, accommodation requests, guardian notes, teacher observations, and resource availability are incomplete. The learner must analyse trends, locate control gaps, and recommend SOP or dashboard improvements with evidence. The learner must solve the problem using the given data and produce the required workplace artifact.',
  'Workplace problem: Institution leaders are reviewing one month of learner support planning work covering 58 learners flagged for support. The audit shows possible pattern-level risk because support needs, accommodation requests, guardian notes, teacher observations, and resource availability are incomplete. The learner must analyse trends, locate control gaps, and recommend SOP or dashboard improvements with evidence. Pressure points: Governance pressure: leaders need evidence of control, not opinions. Learner must connect trend data, policy gaps, repeated errors, and improvement recommendations. Root cause focus: Trace pattern-level causes: weak SOP control, missing dashboard indicator, repeated ownership gap, unclear policy rule, or lack of audit trail. Major concepts: Inclusive support planning; Accommodation mapping; Learner profile interpretation; Stakeholder coordination; Support action plan; Review timeline; Trend analysis; Control gap analysis; Governance recommendation. Level focus: audit, governance, and improvement. Required data: learner profile, accommodation request, teacher observation, support history, resource list, meeting notes Learner activity flow: Engage - Start with the case: 58 learners flagged for support and the visible pain point — support needs, accommodation requests, guardian notes, teacher observations, and resource availability are incomplete. Learner identifies who is affected and what could go wrong if the work is delayed or wrong. Explore - Learner studies the source data: learner profile, accommodation request, teacher observation, support history, resource list, meeting notes. They mark trusted records, missing fields, conflicting entries, and items that need confirmation before using them in the artifact. Explain - Teach the main logic in simple terms: Inclusive support planning; Accommodation mapping; Learner profile interpretation; Stakeholder coordination; Support action plan; Review timeline; Trend analysis; Control gap analysis; Governance recommendation. Level focus: audit, governance, and improvement. Show how rules, evidence, decisions, and handoff notes connect in this workplace task. Express - Learner produces the L5 Learner Support Planning SOP Audit & Improvement Report using the case data, writes decisions in plain English, and shows evidence for each important field instead of giving only a theory answer. Empower - Learner uses AI only as a coach: ask for missing-field checks, clarity prompts, risk questions, and retry suggestions. AI should not create the final artifact for the learner. Evolve - Learner reflects on how the audit recommendation can improve SOP, dashboard control, staff training, or governance review for future cycles. Artifact to submit: L5 Learner Support Planning SOP Audit & Improvement Report. L5 Learner Support Planning SOP Audit & Improvement Report should contain: audit sample; trend table; control-gap finding; risk rating; SOP/dashboard recommendation; governance closure note. Required source data: learner profile, accommodation request, teacher observation, support history, resource list, meeting notes. Evidence fields: Assess whether the audit uses trend evidence, identifies real control gaps, rates risk clearly, and recommends realistic SOP/dashboard/governance improvements. AI support: AI coach can ask: What source proves this? Which field is missing? What is the risk if this is wrong? Who owns the next action? Learner must answer using the case data, not guesses.',
  1,
  '25 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Ed Special Education
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-105' LIMIT 1),
  'B.Ed Special Education',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Ed Special Education
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-105' LIMIT 1),
  'M.Ed Special Education',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BA Psychology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-105' LIMIT 1),
  'BA Psychology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MA Psychology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-105' LIMIT 1),
  'MA Psychology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MSW - Student Support Services
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-105' LIMIT 1),
  'MSW - Student Support Services',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Remedial Intervention Cycle SOP Audit, Trend Analysis & Governance Report
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Remedial Intervention Cycle SOP Audit, Trend Analysis & Governance Report',
  'COURSE-L5-110',
  'Learner can audit patterns, find control gaps, and recommend governance improvements for run remedial intervention cycles using learning-gap diagnosis, practice evidence, and progress review and submit a workplace-ready L5 Remedial Intervention Cycle SOP Audit & Improvement Report. Workplace scenario: Institution leaders are reviewing one month of remedial intervention work covering 73 learners below benchmark after unit test. The audit shows possible pattern-level risk because diagnostic causes, remedial groups, practice tasks, teacher availability, and retest dates are not planned. The learner must analyse trends, locate control gaps, and recommend SOP or dashboard improvements with evidence. Learner artifact: L5 Remedial Intervention Cycle SOP Audit & Improvement Report. Required data: unit-test scores, error analysis, attendance record, learner groups, teacher roster, remedial material list, retest plan. Evidence: Assess whether the audit uses trend evidence, identifies real control gaps, rates risk clearly, and recommends realistic SOP/dashboard/governance improvements.',
  '25 hours',
  'Active',
  'Learner Support, Guidance & Coaching Services',
  'soft',
  '["Triggered when an audit, trend analysis and governance improvement task needs a real workplace artifact, not a theory answer.","Demonstrates audit, trend analysis and governance improvement by producing and defending the L5 Remedial Intervention Cycle SOP Audit & Improvement Report.","Learner can audit patterns, find control gaps, and recommend governance improvements for run remedial intervention cycles using learning-gap diagnosis, practice evidence, and progress review and submit a workplace-ready L5 Remedial Intervention Cycle SOP Audit & Improvement Report."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: Module 1: Remedial Intervention Cycle SOP Audit, Trend Analysis & Governance Report Workplace Artifact Build
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-110' LIMIT 1),
  'Module 1: Remedial Intervention Cycle SOP Audit, Trend Analysis & Governance Report Workplace Artifact Build',
  'Triggered when an audit, trend analysis and governance improvement task needs a real workplace artifact, not a theory answer. The learner studies the case, reviews the required data, identifies the gap, creates the artifact, and checks it against evidence fields.',
  1,
  '["Education & Skilling","Learner Support, Guidance & Coaching Services","IND-CAP-22","L5","Diagnostic error analysis","Remedial grouping","Intervention planning","Practice evidence","Retest scheduling"]'::jsonb,
  '["Engage","Explore","Explain","Express","Empower","Evolve","Artifact Build","Evidence Review","AI-Coached Retry"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Case: Remedial Intervention Cycle SOP Audit, Trend Analysis & Governance Report
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-110' LIMIT 1)
   AND title = 'Module 1: Remedial Intervention Cycle SOP Audit, Trend Analysis & Governance Report Workplace Artifact Build' LIMIT 1),
  'Workplace Case: Remedial Intervention Cycle SOP Audit, Trend Analysis & Governance Report',
  'Institution leaders are reviewing one month of remedial intervention work covering 73 learners below benchmark after unit test. The audit shows possible pattern-level risk because diagnostic causes, remedial groups, practice tasks, teacher availability, and retest dates are not planned. The learner must analyse trends, locate control gaps, and recommend SOP or dashboard improvements with evidence. The learner must solve the problem using the given data and produce the required workplace artifact.',
  'Workplace problem: Institution leaders are reviewing one month of remedial intervention work covering 73 learners below benchmark after unit test. The audit shows possible pattern-level risk because diagnostic causes, remedial groups, practice tasks, teacher availability, and retest dates are not planned. The learner must analyse trends, locate control gaps, and recommend SOP or dashboard improvements with evidence. Pressure points: Governance pressure: leaders need evidence of control, not opinions. Learner must connect trend data, policy gaps, repeated errors, and improvement recommendations. Root cause focus: Trace pattern-level causes: weak SOP control, missing dashboard indicator, repeated ownership gap, unclear policy rule, or lack of audit trail. Major concepts: Diagnostic error analysis; Remedial grouping; Intervention planning; Practice evidence; Retest scheduling; Progress monitoring; Trend analysis; Control gap analysis; Governance recommendation. Level focus: audit, governance, and improvement. Required data: unit-test scores, error analysis, attendance record, learner groups, teacher roster, remedial material list, retest plan Learner activity flow: Engage - Start with the case: 73 learners below benchmark after unit test and the visible pain point — diagnostic causes, remedial groups, practice tasks, teacher availability, and retest dates are not planned. Learner identifies who is affected and what could go wrong if the work is delayed or wrong. Explore - Learner studies the source data: unit-test scores, error analysis, attendance record, learner groups, teacher roster, remedial material list, retest plan. They mark trusted records, missing fields, conflicting entries, and items that need confirmation before using them in the artifact. Explain - Teach the main logic in simple terms: Diagnostic error analysis; Remedial grouping; Intervention planning; Practice evidence; Retest scheduling; Progress monitoring; Trend analysis; Control gap analysis; Governance recommendation. Level focus: audit, governance, and improvement. Show how rules, evidence, decisions, and handoff notes connect in this workplace task. Express - Learner produces the L5 Remedial Intervention Cycle SOP Audit & Improvement Report using the case data, writes decisions in plain English, and shows evidence for each important field instead of giving only a theory answer. Empower - Learner uses AI only as a coach: ask for missing-field checks, clarity prompts, risk questions, and retry suggestions. AI should not create the final artifact for the learner. Evolve - Learner reflects on how the audit recommendation can improve SOP, dashboard control, staff training, or governance review for future cycles. Artifact to submit: L5 Remedial Intervention Cycle SOP Audit & Improvement Report. L5 Remedial Intervention Cycle SOP Audit & Improvement Report should contain: audit sample; trend table; control-gap finding; risk rating; SOP/dashboard recommendation; governance closure note. Required source data: unit-test scores, error analysis, attendance record, learner groups, teacher roster, remedial material list, retest plan. Evidence fields: Assess whether the audit uses trend evidence, identifies real control gaps, rates risk clearly, and recommends realistic SOP/dashboard/governance improvements. AI support: AI coach can ask: What source proves this? Which field is missing? What is the risk if this is wrong? Who owns the next action? Learner must answer using the case data, not guesses.',
  1,
  '25 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Ed Special Education
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-110' LIMIT 1),
  'B.Ed Special Education',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Ed - Remedial Education
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-110' LIMIT 1),
  'B.Ed - Remedial Education',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BA Psychology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-110' LIMIT 1),
  'BA Psychology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MA Education
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-110' LIMIT 1),
  'MA Education',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PG Diploma Remedial Intervention
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-110' LIMIT 1),
  'PG Diploma Remedial Intervention',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Career Guidance Action Planning SOP Audit, Trend Analysis & Governance Report
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Career Guidance Action Planning SOP Audit, Trend Analysis & Governance Report',
  'COURSE-L5-115',
  'Learner can audit patterns, find control gaps, and recommend governance improvements for convert learner profiles and market evidence into career guidance action plans and submit a workplace-ready L5 Career Guidance Action Planning SOP Audit & Improvement Report. Workplace scenario: Institution leaders are reviewing one month of career guidance planning work covering 120 final-year learners. The audit shows possible pattern-level risk because career interests, aptitude data, course marks, family constraints, and local job options point in different directions. The learner must analyse trends, locate control gaps, and recommend SOP or dashboard improvements with evidence. Learner artifact: L5 Career Guidance Action Planning SOP Audit & Improvement Report. Required data: interest form, aptitude results, academic scores, learner constraints, job/education options, counselling notes. Evidence: Assess whether the audit uses trend evidence, identifies real control gaps, rates risk clearly, and recommends realistic SOP/dashboard/governance improvements.',
  '25 hours',
  'Active',
  'Education & Skilling',
  'soft',
  '["Triggered when an audit, trend analysis and governance improvement task needs a real workplace artifact, not a theory answer.","Demonstrates audit, trend analysis and governance improvement by producing and defending the L5 Career Guidance Action Planning SOP Audit & Improvement Report.","Learner can audit patterns, find control gaps, and recommend governance improvements for convert learner profiles and market evidence into career guidance action plans and submit a workplace-ready L5 Career Guidance Action Planning SOP Audit & Improvement Report."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: Module 1: Career Guidance Action Planning SOP Audit, Trend Analysis & Governance Report Workplace Artifact Build
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-115' LIMIT 1),
  'Module 1: Career Guidance Action Planning SOP Audit, Trend Analysis & Governance Report Workplace Artifact Build',
  'Triggered when an audit, trend analysis and governance improvement task needs a real workplace artifact, not a theory answer. The learner studies the case, reviews the required data, identifies the gap, creates the artifact, and checks it against evidence fields.',
  1,
  '["Education & Skilling","IND-CAP-23","L5","Career interest interpretation","Aptitude and evidence use","Option comparison","Constraint-aware guidance","Action planning"]'::jsonb,
  '["Engage","Explore","Explain","Express","Empower","Evolve","Artifact Build","Evidence Review","AI-Coached Retry"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Case: Career Guidance Action Planning SOP Audit, Trend Analysis & Governance Report
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-115' LIMIT 1)
   AND title = 'Module 1: Career Guidance Action Planning SOP Audit, Trend Analysis & Governance Report Workplace Artifact Build' LIMIT 1),
  'Workplace Case: Career Guidance Action Planning SOP Audit, Trend Analysis & Governance Report',
  'Institution leaders are reviewing one month of career guidance planning work covering 120 final-year learners. The audit shows possible pattern-level risk because career interests, aptitude data, course marks, family constraints, and local job options point in different directions. The learner must analyse trends, locate control gaps, and recommend SOP or dashboard improvements with evidence. The learner must solve the problem using the given data and produce the required workplace artifact.',
  'Workplace problem: Institution leaders are reviewing one month of career guidance planning work covering 120 final-year learners. The audit shows possible pattern-level risk because career interests, aptitude data, course marks, family constraints, and local job options point in different directions. The learner must analyse trends, locate control gaps, and recommend SOP or dashboard improvements with evidence. Pressure points: Governance pressure: leaders need evidence of control, not opinions. Learner must connect trend data, policy gaps, repeated errors, and improvement recommendations. Root cause focus: Trace pattern-level causes: weak SOP control, missing dashboard indicator, repeated ownership gap, unclear policy rule, or lack of audit trail. Major concepts: Career interest interpretation; Aptitude and evidence use; Option comparison; Constraint-aware guidance; Action planning; Referral and follow-up; Trend analysis; Control gap analysis; Governance recommendation. Level focus: audit, governance, and improvement. Required data: interest form, aptitude results, academic scores, learner constraints, job/education options, counselling notes Learner activity flow: Engage - Start with the case: 120 final-year learners and the visible pain point — career interests, aptitude data, course marks, family constraints, and local job options point in different directions. Learner identifies who is affected and what could go wrong if the work is delayed or wrong. Explore - Learner studies the source data: interest form, aptitude results, academic scores, learner constraints, job/education options, counselling notes. They mark trusted records, missing fields, conflicting entries, and items that need confirmation before using them in the artifact. Explain - Teach the main logic in simple terms: Career interest interpretation; Aptitude and evidence use; Option comparison; Constraint-aware guidance; Action planning; Referral and follow-up; Trend analysis; Control gap analysis; Governance recommendation. Level focus: audit, governance, and improvement. Show how rules, evidence, decisions, and handoff notes connect in this workplace task. Express - Learner produces the L5 Career Guidance Action Planning SOP Audit & Improvement Report using the case data, writes decisions in plain English, and shows evidence for each important field instead of giving only a theory answer. Empower - Learner uses AI only as a coach: ask for missing-field checks, clarity prompts, risk questions, and retry suggestions. AI should not create the final artifact for the learner. Evolve - Learner reflects on how the audit recommendation can improve SOP, dashboard control, staff training, or governance review for future cycles. Artifact to submit: L5 Career Guidance Action Planning SOP Audit & Improvement Report. L5 Career Guidance Action Planning SOP Audit & Improvement Report should contain: audit sample; trend table; control-gap finding; risk rating; SOP/dashboard recommendation; governance closure note. Required source data: interest form, aptitude results, academic scores, learner constraints, job/education options, counselling notes. Evidence fields: Assess whether the audit uses trend evidence, identifies real control gaps, rates risk clearly, and recommends realistic SOP/dashboard/governance improvements. AI support: AI coach can ask: What source proves this? Which field is missing? What is the risk if this is wrong? Who owns the next action? Learner must answer using the case data, not guesses.',
  1,
  '25 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BA Psychology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-115' LIMIT 1),
  'BA Psychology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MA Counselling Psychology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-115' LIMIT 1),
  'MA Counselling Psychology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BBA HR
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-115' LIMIT 1),
  'BBA HR',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MBA HR
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-115' LIMIT 1),
  'MBA HR',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PG Diploma Career Guidance and Counselling
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-115' LIMIT 1),
  'PG Diploma Career Guidance and Counselling',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Coaching Progress Management SOP Audit, Trend Analysis & Governance Report
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Coaching Progress Management SOP Audit, Trend Analysis & Governance Report',
  'COURSE-L5-120',
  'Learner can audit patterns, find control gaps, and recommend governance improvements for manage language or performance coaching progress through diagnostic evidence, practice cycles, and feedback records and submit a workplace-ready L5 Coaching Progress Management SOP Audit & Improvement Report. Workplace scenario: Institution leaders are reviewing one month of coaching progress management work covering 36 learners in a 6-week coaching cycle. The audit shows possible pattern-level risk because practice logs, coach feedback, attendance, improvement targets, and learner reflections are inconsistent. The learner must analyse trends, locate control gaps, and recommend SOP or dashboard improvements with evidence. Learner artifact: L5 Coaching Progress Management SOP Audit & Improvement Report. Required data: practice log, coach feedback, attendance, performance target, reflection notes, review dates. Evidence: Assess whether the audit uses trend evidence, identifies real control gaps, rates risk clearly, and recommends realistic SOP/dashboard/governance improvements.',
  '25 hours',
  'Active',
  'Education & Skilling',
  'soft',
  '["Triggered when an audit, trend analysis and governance improvement task needs a real workplace artifact, not a theory answer.","Demonstrates audit, trend analysis and governance improvement by producing and defending the L5 Coaching Progress Management SOP Audit & Improvement Report.","Learner can audit patterns, find control gaps, and recommend governance improvements for manage language or performance coaching progress through diagnostic evidence, practice cycles, and feedback records and submit a workplace-ready L5 Coaching Progress Management SOP Audit & Improvement Report."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: Module 1: Coaching Progress Management SOP Audit, Trend Analysis & Governance Report Workplace Artifact Build
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-120' LIMIT 1),
  'Module 1: Coaching Progress Management SOP Audit, Trend Analysis & Governance Report Workplace Artifact Build',
  'Triggered when an audit, trend analysis and governance improvement task needs a real workplace artifact, not a theory answer. The learner studies the case, reviews the required data, identifies the gap, creates the artifact, and checks it against evidence fields.',
  1,
  '["Education & Skilling","IND-CAP-24","L5","Coaching goal setting","Practice evidence tracking","Feedback loop","Progress review","Motivation support"]'::jsonb,
  '["Engage","Explore","Explain","Express","Empower","Evolve","Artifact Build","Evidence Review","AI-Coached Retry"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Case: Coaching Progress Management SOP Audit, Trend Analysis & Governance Report
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-120' LIMIT 1)
   AND title = 'Module 1: Coaching Progress Management SOP Audit, Trend Analysis & Governance Report Workplace Artifact Build' LIMIT 1),
  'Workplace Case: Coaching Progress Management SOP Audit, Trend Analysis & Governance Report',
  'Institution leaders are reviewing one month of coaching progress management work covering 36 learners in a 6-week coaching cycle. The audit shows possible pattern-level risk because practice logs, coach feedback, attendance, improvement targets, and learner reflections are inconsistent. The learner must analyse trends, locate control gaps, and recommend SOP or dashboard improvements with evidence. The learner must solve the problem using the given data and produce the required workplace artifact.',
  'Workplace problem: Institution leaders are reviewing one month of coaching progress management work covering 36 learners in a 6-week coaching cycle. The audit shows possible pattern-level risk because practice logs, coach feedback, attendance, improvement targets, and learner reflections are inconsistent. The learner must analyse trends, locate control gaps, and recommend SOP or dashboard improvements with evidence. Pressure points: Governance pressure: leaders need evidence of control, not opinions. Learner must connect trend data, policy gaps, repeated errors, and improvement recommendations. Root cause focus: Trace pattern-level causes: weak SOP control, missing dashboard indicator, repeated ownership gap, unclear policy rule, or lack of audit trail. Major concepts: Coaching goal setting; Practice evidence tracking; Feedback loop; Progress review; Motivation support; Next-step planning; Trend analysis; Control gap analysis; Governance recommendation. Level focus: audit, governance, and improvement. Required data: practice log, coach feedback, attendance, performance target, reflection notes, review dates Learner activity flow: Engage - Start with the case: 36 learners in a 6-week coaching cycle and the visible pain point — practice logs, coach feedback, attendance, improvement targets, and learner reflections are inconsistent. Learner identifies who is affected and what could go wrong if the work is delayed or wrong. Explore - Learner studies the source data: practice log, coach feedback, attendance, performance target, reflection notes, review dates. They mark trusted records, missing fields, conflicting entries, and items that need confirmation before using them in the artifact. Explain - Teach the main logic in simple terms: Coaching goal setting; Practice evidence tracking; Feedback loop; Progress review; Motivation support; Next-step planning; Trend analysis; Control gap analysis; Governance recommendation. Level focus: audit, governance, and improvement. Show how rules, evidence, decisions, and handoff notes connect in this workplace task. Express - Learner produces the L5 Coaching Progress Management SOP Audit & Improvement Report using the case data, writes decisions in plain English, and shows evidence for each important field instead of giving only a theory answer. Empower - Learner uses AI only as a coach: ask for missing-field checks, clarity prompts, risk questions, and retry suggestions. AI should not create the final artifact for the learner. Evolve - Learner reflects on how the audit recommendation can improve SOP, dashboard control, staff training, or governance review for future cycles. Artifact to submit: L5 Coaching Progress Management SOP Audit & Improvement Report. L5 Coaching Progress Management SOP Audit & Improvement Report should contain: audit sample; trend table; control-gap finding; risk rating; SOP/dashboard recommendation; governance closure note. Required source data: practice log, coach feedback, attendance, performance target, reflection notes, review dates. Evidence fields: Assess whether the audit uses trend evidence, identifies real control gaps, rates risk clearly, and recommends realistic SOP/dashboard/governance improvements. AI support: AI coach can ask: What source proves this? Which field is missing? What is the risk if this is wrong? Who owns the next action? Learner must answer using the case data, not guesses.',
  1,
  '25 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BA English and Communication
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-120' LIMIT 1),
  'BA English and Communication',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.P.Ed
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-120' LIMIT 1),
  'B.P.Ed',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BFA Performing Arts
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-120' LIMIT 1),
  'BFA Performing Arts',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Ed - Coaching Support
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-120' LIMIT 1),
  'B.Ed - Coaching Support',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PG Diploma Coaching and Mentoring
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-120' LIMIT 1),
  'PG Diploma Coaching and Mentoring',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Admissions Operations SOP Audit, Trend Analysis & Governance Report
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Admissions Operations SOP Audit, Trend Analysis & Governance Report',
  'COURSE-L5-125',
  'Learner can audit patterns, find control gaps, and recommend governance improvements for complete admissions operations through document verification, enrollment coding, and record activation and submit a workplace-ready L5 Admissions Operations SOP Audit & Improvement Report. Workplace scenario: Institution leaders are reviewing one month of admissions operations work covering 520 applicants for 180 seats. The audit shows possible pattern-level risk because application status, document checks, fee records, category rules, and communication logs are not synchronized. The learner must analyse trends, locate control gaps, and recommend SOP or dashboard improvements with evidence. Learner artifact: L5 Admissions Operations SOP Audit & Improvement Report. Required data: application forms, document checklist, fee report, category rules, merit/selection list, communication log. Evidence: Assess whether the audit uses trend evidence, identifies real control gaps, rates risk clearly, and recommends realistic SOP/dashboard/governance improvements.',
  '25 hours',
  'Active',
  'Education & Skilling',
  'technical',
  '["Triggered when an audit, trend analysis and governance improvement task needs a real workplace artifact, not a theory answer.","Demonstrates audit, trend analysis and governance improvement by producing and defending the L5 Admissions Operations SOP Audit & Improvement Report.","Learner can audit patterns, find control gaps, and recommend governance improvements for complete admissions operations through document verification, enrollment coding, and record activation and submit a workplace-ready L5 Admissions Operations SOP Audit & Improvement Report."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: Module 1: Admissions Operations SOP Audit, Trend Analysis & Governance Report Workplace Artifact Build
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-125' LIMIT 1),
  'Module 1: Admissions Operations SOP Audit, Trend Analysis & Governance Report Workplace Artifact Build',
  'Triggered when an audit, trend analysis and governance improvement task needs a real workplace artifact, not a theory answer. The learner studies the case, reviews the required data, identifies the gap, creates the artifact, and checks it against evidence fields.',
  1,
  '["Education & Skilling","IND-CAP-25","L5","Admissions workflow","Document and fee verification","Selection rule application","Status communication","Exception tagging"]'::jsonb,
  '["Engage","Explore","Explain","Express","Empower","Evolve","Artifact Build","Evidence Review","AI-Coached Retry"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Case: Admissions Operations SOP Audit, Trend Analysis & Governance Report
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-125' LIMIT 1)
   AND title = 'Module 1: Admissions Operations SOP Audit, Trend Analysis & Governance Report Workplace Artifact Build' LIMIT 1),
  'Workplace Case: Admissions Operations SOP Audit, Trend Analysis & Governance Report',
  'Institution leaders are reviewing one month of admissions operations work covering 520 applicants for 180 seats. The audit shows possible pattern-level risk because application status, document checks, fee records, category rules, and communication logs are not synchronized. The learner must analyse trends, locate control gaps, and recommend SOP or dashboard improvements with evidence. The learner must solve the problem using the given data and produce the required workplace artifact.',
  'Workplace problem: Institution leaders are reviewing one month of admissions operations work covering 520 applicants for 180 seats. The audit shows possible pattern-level risk because application status, document checks, fee records, category rules, and communication logs are not synchronized. The learner must analyse trends, locate control gaps, and recommend SOP or dashboard improvements with evidence. Pressure points: Governance pressure: leaders need evidence of control, not opinions. Learner must connect trend data, policy gaps, repeated errors, and improvement recommendations. Root cause focus: Trace pattern-level causes: weak SOP control, missing dashboard indicator, repeated ownership gap, unclear policy rule, or lack of audit trail. Major concepts: Admissions workflow; Document and fee verification; Selection rule application; Status communication; Exception tagging; Admissions audit trail; Trend analysis; Control gap analysis; Governance recommendation. Level focus: audit, governance, and improvement. Required data: application forms, document checklist, fee report, category rules, merit/selection list, communication log Learner activity flow: Engage - Start with the case: 520 applicants for 180 seats and the visible pain point — application status, document checks, fee records, category rules, and communication logs are not synchronized. Learner identifies who is affected and what could go wrong if the work is delayed or wrong. Explore - Learner studies the source data: application forms, document checklist, fee report, category rules, merit/selection list, communication log. They mark trusted records, missing fields, conflicting entries, and items that need confirmation before using them in the artifact. Explain - Teach the main logic in simple terms: Admissions workflow; Document and fee verification; Selection rule application; Status communication; Exception tagging; Admissions audit trail; Trend analysis; Control gap analysis; Governance recommendation. Level focus: audit, governance, and improvement. Show how rules, evidence, decisions, and handoff notes connect in this workplace task. Express - Learner produces the L5 Admissions Operations SOP Audit & Improvement Report using the case data, writes decisions in plain English, and shows evidence for each important field instead of giving only a theory answer. Empower - Learner uses AI only as a coach: ask for missing-field checks, clarity prompts, risk questions, and retry suggestions. AI should not create the final artifact for the learner. Evolve - Learner reflects on how the audit recommendation can improve SOP, dashboard control, staff training, or governance review for future cycles. Artifact to submit: L5 Admissions Operations SOP Audit & Improvement Report. L5 Admissions Operations SOP Audit & Improvement Report should contain: audit sample; trend table; control-gap finding; risk rating; SOP/dashboard recommendation; governance closure note. Required source data: application forms, document checklist, fee report, category rules, merit/selection list, communication log. Evidence fields: Assess whether the audit uses trend evidence, identifies real control gaps, rates risk clearly, and recommends realistic SOP/dashboard/governance improvements. AI support: AI coach can ask: What source proves this? Which field is missing? What is the risk if this is wrong? Who owns the next action? Learner must answer using the case data, not guesses.',
  1,
  '25 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BBA Education Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-125' LIMIT 1),
  'BBA Education Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Com - Admissions Operations
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-125' LIMIT 1),
  'B.Com - Admissions Operations',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BA Public Administration
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-125' LIMIT 1),
  'BA Public Administration',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MBA Education Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-125' LIMIT 1),
  'MBA Education Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PG Diploma Admission Counselling
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-125' LIMIT 1),
  'PG Diploma Admission Counselling',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Education MIS Reporting SOP Audit, Trend Analysis & Governance Report
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Education MIS Reporting SOP Audit, Trend Analysis & Governance Report',
  'COURSE-L5-130',
  'Learner can audit patterns, find control gaps, and recommend governance improvements for produce institution-level education MIS reports through institution-code, learner-record, and data-quality controls and submit a workplace-ready L5 Education MIS Reporting SOP Audit & Improvement Report. Workplace scenario: Institution leaders are reviewing one month of education MIS reporting work covering 12 departments reporting monthly data. The audit shows possible pattern-level risk because enrollment, attendance, assessment, dropout, and placement numbers do not reconcile before submission. The learner must analyse trends, locate control gaps, and recommend SOP or dashboard improvements with evidence. Learner artifact: L5 Education MIS Reporting SOP Audit & Improvement Report. Required data: department data files, ERP exports, attendance summaries, assessment results, dropout records, placement tracker. Evidence: Assess whether the audit uses trend evidence, identifies real control gaps, rates risk clearly, and recommends realistic SOP/dashboard/governance improvements.',
  '25 hours',
  'Active',
  'Education & Skilling',
  'technical',
  '["Triggered when an audit, trend analysis and governance improvement task needs a real workplace artifact, not a theory answer.","Demonstrates audit, trend analysis and governance improvement by producing and defending the L5 Education MIS Reporting SOP Audit & Improvement Report.","Learner can audit patterns, find control gaps, and recommend governance improvements for produce institution-level education MIS reports through institution-code, learner-record, and data-quality controls and submit a workplace-ready L5 Education MIS Reporting SOP Audit & Improvement Report."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: Module 1: Education MIS Reporting SOP Audit, Trend Analysis & Governance Report Workplace Artifact Build
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-130' LIMIT 1),
  'Module 1: Education MIS Reporting SOP Audit, Trend Analysis & Governance Report Workplace Artifact Build',
  'Triggered when an audit, trend analysis and governance improvement task needs a real workplace artifact, not a theory answer. The learner studies the case, reviews the required data, identifies the gap, creates the artifact, and checks it against evidence fields.',
  1,
  '["Education & Skilling","IND-CAP-26","L5","MIS data validation","Indicator definition","Reconciliation logic","Dashboard readiness","Exception notes"]'::jsonb,
  '["Engage","Explore","Explain","Express","Empower","Evolve","Artifact Build","Evidence Review","AI-Coached Retry"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Case: Education MIS Reporting SOP Audit, Trend Analysis & Governance Report
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-130' LIMIT 1)
   AND title = 'Module 1: Education MIS Reporting SOP Audit, Trend Analysis & Governance Report Workplace Artifact Build' LIMIT 1),
  'Workplace Case: Education MIS Reporting SOP Audit, Trend Analysis & Governance Report',
  'Institution leaders are reviewing one month of education MIS reporting work covering 12 departments reporting monthly data. The audit shows possible pattern-level risk because enrollment, attendance, assessment, dropout, and placement numbers do not reconcile before submission. The learner must analyse trends, locate control gaps, and recommend SOP or dashboard improvements with evidence. The learner must solve the problem using the given data and produce the required workplace artifact.',
  'Workplace problem: Institution leaders are reviewing one month of education MIS reporting work covering 12 departments reporting monthly data. The audit shows possible pattern-level risk because enrollment, attendance, assessment, dropout, and placement numbers do not reconcile before submission. The learner must analyse trends, locate control gaps, and recommend SOP or dashboard improvements with evidence. Pressure points: Governance pressure: leaders need evidence of control, not opinions. Learner must connect trend data, policy gaps, repeated errors, and improvement recommendations. Root cause focus: Trace pattern-level causes: weak SOP control, missing dashboard indicator, repeated ownership gap, unclear policy rule, or lack of audit trail. Major concepts: MIS data validation; Indicator definition; Reconciliation logic; Dashboard readiness; Exception notes; Submission control; Trend analysis; Control gap analysis; Governance recommendation. Level focus: audit, governance, and improvement. Required data: department data files, ERP exports, attendance summaries, assessment results, dropout records, placement tracker Learner activity flow: Engage - Start with the case: 12 departments reporting monthly data and the visible pain point — enrollment, attendance, assessment, dropout, and placement numbers do not reconcile before submission. Learner identifies who is affected and what could go wrong if the work is delayed or wrong. Explore - Learner studies the source data: department data files, ERP exports, attendance summaries, assessment results, dropout records, placement tracker. They mark trusted records, missing fields, conflicting entries, and items that need confirmation before using them in the artifact. Explain - Teach the main logic in simple terms: MIS data validation; Indicator definition; Reconciliation logic; Dashboard readiness; Exception notes; Submission control; Trend analysis; Control gap analysis; Governance recommendation. Level focus: audit, governance, and improvement. Show how rules, evidence, decisions, and handoff notes connect in this workplace task. Express - Learner produces the L5 Education MIS Reporting SOP Audit & Improvement Report using the case data, writes decisions in plain English, and shows evidence for each important field instead of giving only a theory answer. Empower - Learner uses AI only as a coach: ask for missing-field checks, clarity prompts, risk questions, and retry suggestions. AI should not create the final artifact for the learner. Evolve - Learner reflects on how the audit recommendation can improve SOP, dashboard control, staff training, or governance review for future cycles. Artifact to submit: L5 Education MIS Reporting SOP Audit & Improvement Report. L5 Education MIS Reporting SOP Audit & Improvement Report should contain: audit sample; trend table; control-gap finding; risk rating; SOP/dashboard recommendation; governance closure note. Required source data: department data files, ERP exports, attendance summaries, assessment results, dropout records, placement tracker. Evidence fields: Assess whether the audit uses trend evidence, identifies real control gaps, rates risk clearly, and recommends realistic SOP/dashboard/governance improvements. AI support: AI coach can ask: What source proves this? Which field is missing? What is the risk if this is wrong? Who owns the next action? Learner must answer using the case data, not guesses.',
  1,
  '25 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BCA
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-130' LIMIT 1),
  'BCA',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc IT
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-130' LIMIT 1),
  'B.Sc IT',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Com - Data Reporting
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-130' LIMIT 1),
  'B.Com - Data Reporting',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BBA Business Analytics
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-130' LIMIT 1),
  'BBA Business Analytics',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PG Diploma Education Data Analytics
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-130' LIMIT 1),
  'PG Diploma Education Data Analytics',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Government/NGO Program Tracking SOP Audit, Trend Analysis & Governance Report
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Government/NGO Program Tracking SOP Audit, Trend Analysis & Governance Report',
  'COURSE-L5-135',
  'Learner can audit patterns, find control gaps, and recommend governance improvements for track government or ngo education programs through beneficiary, activity, utilization, and outcome evidence and submit a workplace-ready L5 Government/NGO Program Tracking SOP Audit & Improvement Report. Workplace scenario: Institution leaders are reviewing one month of government/ngo program tracking work covering 18 centres and 2,400 beneficiaries. The audit shows possible pattern-level risk because attendance, activity evidence, budget use, outcome data, and donor reporting formats are incomplete. The learner must analyse trends, locate control gaps, and recommend SOP or dashboard improvements with evidence. Learner artifact: L5 Government/NGO Program Tracking SOP Audit & Improvement Report. Required data: centre reports, attendance registers, activity photos/logs, budget sheet, outcome tracker, donor format. Evidence: Assess whether the audit uses trend evidence, identifies real control gaps, rates risk clearly, and recommends realistic SOP/dashboard/governance improvements.',
  '25 hours',
  'Active',
  'Education & Skilling',
  'technical',
  '["Triggered when an audit, trend analysis and governance improvement task needs a real workplace artifact, not a theory answer.","Demonstrates audit, trend analysis and governance improvement by producing and defending the L5 Government/NGO Program Tracking SOP Audit & Improvement Report.","Learner can audit patterns, find control gaps, and recommend governance improvements for track government or ngo education programs through beneficiary, activity, utilization, and outcome evidence and submit a workplace-ready L5 Government/NGO Program Tracking SOP Audit & Improvement Report."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: Module 1: Government/NGO Program Tracking SOP Audit, Trend Analysis & Governance Report Workplace Artifact Build
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-135' LIMIT 1),
  'Module 1: Government/NGO Program Tracking SOP Audit, Trend Analysis & Governance Report Workplace Artifact Build',
  'Triggered when an audit, trend analysis and governance improvement task needs a real workplace artifact, not a theory answer. The learner studies the case, reviews the required data, identifies the gap, creates the artifact, and checks it against evidence fields.',
  1,
  '["Education & Skilling","IND-CAP-27","L5","Program monitoring","Beneficiary data tracking","Activity evidence control","Budget-output linkage","Donor report structure"]'::jsonb,
  '["Engage","Explore","Explain","Express","Empower","Evolve","Artifact Build","Evidence Review","AI-Coached Retry"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Case: Government/NGO Program Tracking SOP Audit, Trend Analysis & Governance Report
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-135' LIMIT 1)
   AND title = 'Module 1: Government/NGO Program Tracking SOP Audit, Trend Analysis & Governance Report Workplace Artifact Build' LIMIT 1),
  'Workplace Case: Government/NGO Program Tracking SOP Audit, Trend Analysis & Governance Report',
  'Institution leaders are reviewing one month of government/ngo program tracking work covering 18 centres and 2,400 beneficiaries. The audit shows possible pattern-level risk because attendance, activity evidence, budget use, outcome data, and donor reporting formats are incomplete. The learner must analyse trends, locate control gaps, and recommend SOP or dashboard improvements with evidence. The learner must solve the problem using the given data and produce the required workplace artifact.',
  'Workplace problem: Institution leaders are reviewing one month of government/ngo program tracking work covering 18 centres and 2,400 beneficiaries. The audit shows possible pattern-level risk because attendance, activity evidence, budget use, outcome data, and donor reporting formats are incomplete. The learner must analyse trends, locate control gaps, and recommend SOP or dashboard improvements with evidence. Pressure points: Governance pressure: leaders need evidence of control, not opinions. Learner must connect trend data, policy gaps, repeated errors, and improvement recommendations. Root cause focus: Trace pattern-level causes: weak SOP control, missing dashboard indicator, repeated ownership gap, unclear policy rule, or lack of audit trail. Major concepts: Program monitoring; Beneficiary data tracking; Activity evidence control; Budget-output linkage; Donor report structure; Risk and variance note; Trend analysis; Control gap analysis; Governance recommendation. Level focus: audit, governance, and improvement. Required data: centre reports, attendance registers, activity photos/logs, budget sheet, outcome tracker, donor format Learner activity flow: Engage - Start with the case: 18 centres and 2,400 beneficiaries and the visible pain point — attendance, activity evidence, budget use, outcome data, and donor reporting formats are incomplete. Learner identifies who is affected and what could go wrong if the work is delayed or wrong. Explore - Learner studies the source data: centre reports, attendance registers, activity photos/logs, budget sheet, outcome tracker, donor format. They mark trusted records, missing fields, conflicting entries, and items that need confirmation before using them in the artifact. Explain - Teach the main logic in simple terms: Program monitoring; Beneficiary data tracking; Activity evidence control; Budget-output linkage; Donor report structure; Risk and variance note; Trend analysis; Control gap analysis; Governance recommendation. Level focus: audit, governance, and improvement. Show how rules, evidence, decisions, and handoff notes connect in this workplace task. Express - Learner produces the L5 Government/NGO Program Tracking SOP Audit & Improvement Report using the case data, writes decisions in plain English, and shows evidence for each important field instead of giving only a theory answer. Empower - Learner uses AI only as a coach: ask for missing-field checks, clarity prompts, risk questions, and retry suggestions. AI should not create the final artifact for the learner. Evolve - Learner reflects on how the audit recommendation can improve SOP, dashboard control, staff training, or governance review for future cycles. Artifact to submit: L5 Government/NGO Program Tracking SOP Audit & Improvement Report. L5 Government/NGO Program Tracking SOP Audit & Improvement Report should contain: audit sample; trend table; control-gap finding; risk rating; SOP/dashboard recommendation; governance closure note. Required source data: centre reports, attendance registers, activity photos/logs, budget sheet, outcome tracker, donor format. Evidence fields: Assess whether the audit uses trend evidence, identifies real control gaps, rates risk clearly, and recommends realistic SOP/dashboard/governance improvements. AI support: AI coach can ask: What source proves this? Which field is missing? What is the risk if this is wrong? Who owns the next action? Learner must answer using the case data, not guesses.',
  1,
  '25 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BSW - Community Development
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-135' LIMIT 1),
  'BSW - Community Development',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MSW - Education Programs
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-135' LIMIT 1),
  'MSW - Education Programs',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BA Public Administration
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-135' LIMIT 1),
  'BA Public Administration',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MA Development Studies
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-135' LIMIT 1),
  'MA Development Studies',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PG Diploma NGO Program Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-135' LIMIT 1),
  'PG Diploma NGO Program Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Research Publishing Coordination SOP Audit, Trend Analysis & Governance Report
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Research Publishing Coordination SOP Audit, Trend Analysis & Governance Report',
  'COURSE-L5-140',
  'Learner can audit patterns, find control gaps, and recommend governance improvements for research and academic publishing cycles through study evidence, review workflow, and publication records and submit a workplace-ready L5 Research Publishing Coordination SOP Audit & Improvement Report. Workplace scenario: Institution leaders are reviewing one month of research publishing coordination work covering 22 manuscripts in review cycle. The audit shows possible pattern-level risk because ethics approval, reviewer comments, author revisions, plagiarism checks, and publication status are scattered. The learner must analyse trends, locate control gaps, and recommend SOP or dashboard improvements with evidence. Learner artifact: L5 Research Publishing Coordination SOP Audit & Improvement Report. Required data: manuscript tracker, ethics approval, reviewer comments, revision files, plagiarism report, publication status log. Evidence: Assess whether the audit uses trend evidence, identifies real control gaps, rates risk clearly, and recommends realistic SOP/dashboard/governance improvements.',
  '25 hours',
  'Active',
  'Education & Skilling',
  'technical',
  '["Triggered when an audit, trend analysis and governance improvement task needs a real workplace artifact, not a theory answer.","Demonstrates audit, trend analysis and governance improvement by producing and defending the L5 Research Publishing Coordination SOP Audit & Improvement Report.","Learner can audit patterns, find control gaps, and recommend governance improvements for research and academic publishing cycles through study evidence, review workflow, and publication records and submit a workplace-ready L5 Research Publishing Coordination SOP Audit & Improvement Report."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: Module 1: Research Publishing Coordination SOP Audit, Trend Analysis & Governance Report Workplace Artifact Build
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-140' LIMIT 1),
  'Module 1: Research Publishing Coordination SOP Audit, Trend Analysis & Governance Report Workplace Artifact Build',
  'Triggered when an audit, trend analysis and governance improvement task needs a real workplace artifact, not a theory answer. The learner studies the case, reviews the required data, identifies the gap, creates the artifact, and checks it against evidence fields.',
  1,
  '["Education & Skilling","IND-CAP-28","L5","Research workflow tracking","Ethics and compliance check","Peer-review status control","Revision evidence","Publication record management"]'::jsonb,
  '["Engage","Explore","Explain","Express","Empower","Evolve","Artifact Build","Evidence Review","AI-Coached Retry"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Case: Research Publishing Coordination SOP Audit, Trend Analysis & Governance Report
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-140' LIMIT 1)
   AND title = 'Module 1: Research Publishing Coordination SOP Audit, Trend Analysis & Governance Report Workplace Artifact Build' LIMIT 1),
  'Workplace Case: Research Publishing Coordination SOP Audit, Trend Analysis & Governance Report',
  'Institution leaders are reviewing one month of research publishing coordination work covering 22 manuscripts in review cycle. The audit shows possible pattern-level risk because ethics approval, reviewer comments, author revisions, plagiarism checks, and publication status are scattered. The learner must analyse trends, locate control gaps, and recommend SOP or dashboard improvements with evidence. The learner must solve the problem using the given data and produce the required workplace artifact.',
  'Workplace problem: Institution leaders are reviewing one month of research publishing coordination work covering 22 manuscripts in review cycle. The audit shows possible pattern-level risk because ethics approval, reviewer comments, author revisions, plagiarism checks, and publication status are scattered. The learner must analyse trends, locate control gaps, and recommend SOP or dashboard improvements with evidence. Pressure points: Governance pressure: leaders need evidence of control, not opinions. Learner must connect trend data, policy gaps, repeated errors, and improvement recommendations. Root cause focus: Trace pattern-level causes: weak SOP control, missing dashboard indicator, repeated ownership gap, unclear policy rule, or lack of audit trail. Major concepts: Research workflow tracking; Ethics and compliance check; Peer-review status control; Revision evidence; Publication record management; Author communication; Trend analysis; Control gap analysis; Governance recommendation. Level focus: audit, governance, and improvement. Required data: manuscript tracker, ethics approval, reviewer comments, revision files, plagiarism report, publication status log Learner activity flow: Engage - Start with the case: 22 manuscripts in review cycle and the visible pain point — ethics approval, reviewer comments, author revisions, plagiarism checks, and publication status are scattered. Learner identifies who is affected and what could go wrong if the work is delayed or wrong. Explore - Learner studies the source data: manuscript tracker, ethics approval, reviewer comments, revision files, plagiarism report, publication status log. They mark trusted records, missing fields, conflicting entries, and items that need confirmation before using them in the artifact. Explain - Teach the main logic in simple terms: Research workflow tracking; Ethics and compliance check; Peer-review status control; Revision evidence; Publication record management; Author communication; Trend analysis; Control gap analysis; Governance recommendation. Level focus: audit, governance, and improvement. Show how rules, evidence, decisions, and handoff notes connect in this workplace task. Express - Learner produces the L5 Research Publishing Coordination SOP Audit & Improvement Report using the case data, writes decisions in plain English, and shows evidence for each important field instead of giving only a theory answer. Empower - Learner uses AI only as a coach: ask for missing-field checks, clarity prompts, risk questions, and retry suggestions. AI should not create the final artifact for the learner. Evolve - Learner reflects on how the audit recommendation can improve SOP, dashboard control, staff training, or governance review for future cycles. Artifact to submit: L5 Research Publishing Coordination SOP Audit & Improvement Report. L5 Research Publishing Coordination SOP Audit & Improvement Report should contain: audit sample; trend table; control-gap finding; risk rating; SOP/dashboard recommendation; governance closure note. Required source data: manuscript tracker, ethics approval, reviewer comments, revision files, plagiarism report, publication status log. Evidence fields: Assess whether the audit uses trend evidence, identifies real control gaps, rates risk clearly, and recommends realistic SOP/dashboard/governance improvements. AI support: AI coach can ask: What source proves this? Which field is missing? What is the risk if this is wrong? Who owns the next action? Learner must answer using the case data, not guesses.',
  1,
  '25 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BA Education
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-140' LIMIT 1),
  'BA Education',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MA Education
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-140' LIMIT 1),
  'MA Education',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Ed Research Methods
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-140' LIMIT 1),
  'M.Ed Research Methods',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PG Diploma Research Methodology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-140' LIMIT 1),
  'PG Diploma Research Methodology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PhD Coursework - Education Research
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L5-140' LIMIT 1),
  'PhD Coursework - Education Research',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: API Batch Quality Evidence Review - Evidence Gap Recognition
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'API Batch Quality Evidence Review - Evidence Gap Recognition',
  'COURSE-CAP-001-L1',
  'A learner receives 1 API Batch Quality Evidence Review record pack with 8 required fields. Three fields are blank, 2 source IDs are weak, and 1 owner note is unclear. The problem is to find what is missing before the record is used for review. Course objective: Recognize the required evidence fields for API Batch Quality Evidence Review; identify 3 missing/unclear items; record source IDs; explain what must be escalated. Learner outcome: Learner can inspect an API Batch Quality Evidence Review record and produce a checklist showing missing fields, weak source IDs, and role-boundary doubts.',
  '6 hours',
  'Active',
  'Pharma / Biotech / MedTech',
  'technical',
  '["Recognize the required evidence fields for API Batch Quality Evidence Review; identify 3 missing/unclear items; record source IDs; explain what must be escalated.","Learner can inspect an API Batch Quality Evidence Review record and produce a checklist showing missing fields, weak source IDs, and role-boundary doubts.","Create API Batch Quality Evidence Review completeness checklist","Assess evidence using: Field completeness; correct source IDs; clear missing-data notes; correct escalation flag; no approval claim."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L1: Evidence Gap Recognition - CAP-001
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-001-L1' LIMIT 1),
  'L1: Evidence Gap Recognition - CAP-001',
  'You are supporting a workplace evidence review. Your manager gives you one API Batch Quality Evidence Review file and asks you to check whether it is complete. You must not approve the file. You must mark the 3 blank fields, list the 2 weak source IDs, and explain which 1 role-boundary point needs clarification. Required data: Sample API Batch Quality Evidence Review source record; 8 required fields list; 3 intentionally missing entries; 2 source-ID references; 1 role-boundary note; blank checklist template.',
  1,
  '["Pharma / Biotech / MedTech","Small-Molecule Pharma Manufacturing and CMC Regulatory Operations","D-001","CAP-001","L1","Domain; Evidence; Cognitive; Compliance"]'::jsonb,
  '["Scenario Review","Evidence Check","Artifact Build","AI Coaching","Human Review","Retry and Improve","Portfolio Submission"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: API Batch Quality Evidence Review completeness checklist Practice
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-001-L1' LIMIT 1)
   AND title = 'L1: Evidence Gap Recognition - CAP-001' LIMIT 1),
  'API Batch Quality Evidence Review completeness checklist Practice',
  'Complete the API Batch Quality Evidence Review completeness checklist using the provided actuals and explain the evidence decision in simple workplace language.',
  'Workplace scenario: You are supporting a workplace evidence review. Your manager gives you one API Batch Quality Evidence Review file and asks you to check whether it is complete. You must not approve the file. You must mark the 3 blank fields, list the 2 weak source IDs, and explain which 1 role-boundary point needs clarification. Major concepts: API Batch Quality Evidence Review evidence completeness; 8-field checklist logic; source-ID traceability; missing-data marking; ALCOA-style documentation thinking; role boundary between checking and approving. Artifact structure: Sections: record summary; required field list; missing-field table; source-ID table; role-boundary note; escalation flag. Evidence to assess: Field completeness; correct source IDs; clear missing-data notes; correct escalation flag; no approval claim. AI support: Use AI to ask checklist questions only. Do not let AI invent missing data or approve the record.',
  1,
  '90 minutes',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Pharm
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-001-L1' LIMIT 1),
  'B.Pharm',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Pharm Pharmaceutical Quality Assurance
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-001-L1' LIMIT 1),
  'M.Pharm Pharmaceutical Quality Assurance',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Pharm Pharmaceutics
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-001-L1' LIMIT 1),
  'M.Pharm Pharmaceutics',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Chemistry
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-001-L1' LIMIT 1),
  'B.Sc Chemistry',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Sc Pharmaceutical Chemistry
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-001-L1' LIMIT 1),
  'M.Sc Pharmaceutical Chemistry',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: API Deviation, OOS and CAPA Evidence Control - Evidence Gap Recognition
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'API Deviation, OOS and CAPA Evidence Control - Evidence Gap Recognition',
  'COURSE-CAP-002-L1',
  'A learner receives 1 API Deviation, OOS and CAPA Evidence Control record pack with 8 required fields. Three fields are blank, 2 source IDs are weak, and 1 owner note is unclear. The problem is to find what is missing before the record is used for review. Course objective: Recognize the required evidence fields for API Deviation, OOS and CAPA Evidence Control; identify 3 missing/unclear items; record source IDs; explain what must be escalated. Learner outcome: Learner can inspect an API Deviation, OOS and CAPA Evidence Control record and produce a checklist showing missing fields, weak source IDs, and role-boundary doubts.',
  '6 hours',
  'Active',
  'Pharma / Biotech / MedTech',
  'technical',
  '["Recognize the required evidence fields for API Deviation, OOS and CAPA Evidence Control; identify 3 missing/unclear items; record source IDs; explain what must be escalated.","Learner can inspect an API Deviation, OOS and CAPA Evidence Control record and produce a checklist showing missing fields, weak source IDs, and role-boundary doubts.","Create API Deviation, OOS and CAPA Evidence Control completeness checklist","Assess evidence using: Field completeness; correct source IDs; clear missing-data notes; correct escalation flag; no approval claim."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L1: Evidence Gap Recognition - CAP-002
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-002-L1' LIMIT 1),
  'L1: Evidence Gap Recognition - CAP-002',
  'You are supporting a workplace evidence review. Your manager gives you one API Deviation, OOS and CAPA Evidence Control file and asks you to check whether it is complete. You must not approve the file. You must mark the 3 blank fields, list the 2 weak source IDs, and explain which 1 role-boundary point needs clarification. Required data: Sample API Deviation, OOS and CAPA Evidence Control source record; 8 required fields list; 3 intentionally missing entries; 2 source-ID references; 1 role-boundary note; blank checklist template.',
  1,
  '["Pharma / Biotech / MedTech","Small-Molecule Pharma Manufacturing and CMC Regulatory Operations","Pharma GM","D-001","CAP-002","L1","Domain; Evidence; Cognitive; Compliance"]'::jsonb,
  '["Scenario Review","Evidence Check","Artifact Build","AI Coaching","Human Review","Retry and Improve","Portfolio Submission"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: API Deviation, OOS and CAPA Evidence Control completeness checklist Practice
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-002-L1' LIMIT 1)
   AND title = 'L1: Evidence Gap Recognition - CAP-002' LIMIT 1),
  'API Deviation, OOS and CAPA Evidence Control completeness checklist Practice',
  'Complete the API Deviation, OOS and CAPA Evidence Control completeness checklist using the provided actuals and explain the evidence decision in simple workplace language.',
  'Workplace scenario: You are supporting a workplace evidence review. Your manager gives you one API Deviation, OOS and CAPA Evidence Control file and asks you to check whether it is complete. You must not approve the file. You must mark the 3 blank fields, list the 2 weak source IDs, and explain which 1 role-boundary point needs clarification. Major concepts: API Deviation, OOS and CAPA Evidence Control evidence completeness; 8-field checklist logic; source-ID traceability; missing-data marking; ALCOA-style documentation thinking; role boundary between checking and approving. Artifact structure: Sections: record summary; required field list; missing-field table; source-ID table; role-boundary note; escalation flag. Evidence to assess: Field completeness; correct source IDs; clear missing-data notes; correct escalation flag; no approval claim. AI support: Use AI to ask checklist questions only. Do not let AI invent missing data or approve the record.',
  1,
  '90 minutes',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Pharm
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-002-L1' LIMIT 1),
  'B.Pharm',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Pharm Pharmaceutical Quality Assurance
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-002-L1' LIMIT 1),
  'M.Pharm Pharmaceutical Quality Assurance',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Pharm Pharmaceutics
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-002-L1' LIMIT 1),
  'M.Pharm Pharmaceutics',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Chemistry
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-002-L1' LIMIT 1),
  'B.Sc Chemistry',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Sc Pharmaceutical Chemistry
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-002-L1' LIMIT 1),
  'M.Sc Pharmaceutical Chemistry',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Finished Dose BMR/BPR Packaging Variance and Release Packet Control - Evidence Gap Recognition
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Finished Dose BMR/BPR Packaging Variance and Release Packet Control - Evidence Gap Recognition',
  'COURSE-CAP-003-L1',
  'A learner receives 1 Finished Dose BMR/BPR Packaging Variance and Release Packet Control record pack with 8 required fields. Three fields are blank, 2 source IDs are weak, and 1 owner note is unclear. The problem is to find what is missing before the record is used for review. Course objective: Recognize the required evidence fields for Finished Dose BMR/BPR Packaging Variance and Release Packet Control; identify 3 missing/unclear items; record source IDs; explain what must be escalated. Learner outcome: Learner can inspect a Finished Dose BMR/BPR Packaging Variance and Release Packet Control record and produce a checklist showing missing fields, weak source IDs, and role-boundary doubts.',
  '6 hours',
  'Active',
  'Pharma / Biotech / MedTech',
  'technical',
  '["Recognize the required evidence fields for Finished Dose BMR/BPR Packaging Variance and Release Packet Control; identify 3 missing/unclear items; record source IDs; explain what must be escalated.","Learner can inspect a Finished Dose BMR/BPR Packaging Variance and Release Packet Control record and produce a checklist showing missing fields, weak source IDs, and role-boundary doubts.","Create Finished Dose BMR/BPR Packaging Variance and Release Packet Control completeness checklist","Assess evidence using: Field completeness; correct source IDs; clear missing-data notes; correct escalation flag; no approval claim."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L1: Evidence Gap Recognition - CAP-003
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-003-L1' LIMIT 1),
  'L1: Evidence Gap Recognition - CAP-003',
  'You are supporting a workplace evidence review. Your manager gives you one Finished Dose BMR/BPR Packaging Variance and Release Packet Control file and asks you to check whether it is complete. You must not approve the file. You must mark the 3 blank fields, list the 2 weak source IDs, and explain which 1 role-boundary point needs clarification. Required data: Sample Finished Dose BMR/BPR Packaging Variance and Release Packet Control source record; 8 required fields list; 3 intentionally missing entries; 2 source-ID references; 1 role-boundary note; blank checklist template.',
  1,
  '["Pharma / Biotech / MedTech","Small-Molecule Pharma Manufacturing and CMC Regulatory Operations","Pharma GM","D-001","CAP-003","L1","Domain; Evidence; Cognitive; Compliance"]'::jsonb,
  '["Scenario Review","Evidence Check","Artifact Build","AI Coaching","Human Review","Retry and Improve","Portfolio Submission"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Finished Dose BMR/BPR Packaging Variance and Release Packet Control completeness checklist Practice
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-003-L1' LIMIT 1)
   AND title = 'L1: Evidence Gap Recognition - CAP-003' LIMIT 1),
  'Finished Dose BMR/BPR Packaging Variance and Release Packet Control completeness checklist Practice',
  'Complete the Finished Dose BMR/BPR Packaging Variance and Release Packet Control completeness checklist using the provided actuals and explain the evidence decision in simple workplace language.',
  'Workplace scenario: You are supporting a workplace evidence review. Your manager gives you one Finished Dose BMR/BPR Packaging Variance and Release Packet Control file and asks you to check whether it is complete. You must not approve the file. You must mark the 3 blank fields, list the 2 weak source IDs, and explain which 1 role-boundary point needs clarification. Major concepts: Finished Dose BMR/BPR Packaging Variance and Release Packet Control evidence completeness; 8-field checklist logic; source-ID traceability; missing-data marking; ALCOA-style documentation thinking; role boundary between checking and approving. Artifact structure: Sections: record summary; required field list; missing-field table; source-ID table; role-boundary note; escalation flag. Evidence to assess: Field completeness; correct source IDs; clear missing-data notes; correct escalation flag; no approval claim. AI support: Use AI to ask checklist questions only. Do not let AI invent missing data or approve the record.',
  1,
  '90 minutes',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Pharm
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-003-L1' LIMIT 1),
  'B.Pharm',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Pharm Pharmaceutical Quality Assurance
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-003-L1' LIMIT 1),
  'M.Pharm Pharmaceutical Quality Assurance',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Pharm Pharmaceutics
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-003-L1' LIMIT 1),
  'M.Pharm Pharmaceutics',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Chemistry
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-003-L1' LIMIT 1),
  'B.Sc Chemistry',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Sc Pharmaceutical Chemistry
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-003-L1' LIMIT 1),
  'M.Sc Pharmaceutical Chemistry',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Stability Study Follow-Up and Change-Control Impact Packet Control - Evidence Gap Recognition
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Stability Study Follow-Up and Change-Control Impact Packet Control - Evidence Gap Recognition',
  'COURSE-CAP-004-L1',
  'A learner receives 1 Stability Study Follow-Up and Change-Control Impact Packet Control record pack with 8 required fields. Three fields are blank, 2 source IDs are weak, and 1 owner note is unclear. The problem is to find what is missing before the record is used for review. Course objective: Recognize the required evidence fields for Stability Study Follow-Up and Change-Control Impact Packet Control; identify 3 missing/unclear items; record source IDs; explain what must be escalated. Learner outcome: Learner can inspect a Stability Study Follow-Up and Change-Control Impact Packet Control record and produce a checklist showing missing fields, weak source IDs, and role-boundary doubts.',
  '6 hours',
  'Active',
  'Pharma / Biotech / MedTech',
  'technical',
  '["Recognize the required evidence fields for Stability Study Follow-Up and Change-Control Impact Packet Control; identify 3 missing/unclear items; record source IDs; explain what must be escalated.","Learner can inspect a Stability Study Follow-Up and Change-Control Impact Packet Control record and produce a checklist showing missing fields, weak source IDs, and role-boundary doubts.","Create Stability Study Follow-Up and Change-Control Impact Packet Control completeness checklist","Assess evidence using: Field completeness; correct source IDs; clear missing-data notes; correct escalation flag; no approval claim."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L1: Evidence Gap Recognition - CAP-004
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-004-L1' LIMIT 1),
  'L1: Evidence Gap Recognition - CAP-004',
  'You are supporting a workplace evidence review. Your manager gives you one Stability Study Follow-Up and Change-Control Impact Packet Control file and asks you to check whether it is complete. You must not approve the file. You must mark the 3 blank fields, list the 2 weak source IDs, and explain which 1 role-boundary point needs clarification. Required data: Sample Stability Study Follow-Up and Change-Control Impact Packet Control source record; 8 required fields list; 3 intentionally missing entries; 2 source-ID references; 1 role-boundary note; blank checklist template.',
  1,
  '["Pharma / Biotech / MedTech","Small-Molecule Pharma Manufacturing and CMC Regulatory Operations","Pharma GM","D-001","CAP-004","L1","Domain; Evidence; Cognitive; Compliance"]'::jsonb,
  '["Scenario Review","Evidence Check","Artifact Build","AI Coaching","Human Review","Retry and Improve","Portfolio Submission"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Stability Study Follow-Up and Change-Control Impact Packet Control completeness checklist Practice
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-004-L1' LIMIT 1)
   AND title = 'L1: Evidence Gap Recognition - CAP-004' LIMIT 1),
  'Stability Study Follow-Up and Change-Control Impact Packet Control completeness checklist Practice',
  'Complete the Stability Study Follow-Up and Change-Control Impact Packet Control completeness checklist using the provided actuals and explain the evidence decision in simple workplace language.',
  'Workplace scenario: You are supporting a workplace evidence review. Your manager gives you one Stability Study Follow-Up and Change-Control Impact Packet Control file and asks you to check whether it is complete. You must not approve the file. You must mark the 3 blank fields, list the 2 weak source IDs, and explain which 1 role-boundary point needs clarification. Major concepts: Stability Study Follow-Up and Change-Control Impact Packet Control evidence completeness; 8-field checklist logic; source-ID traceability; missing-data marking; ALCOA-style documentation thinking; role boundary between checking and approving. Artifact structure: Sections: record summary; required field list; missing-field table; source-ID table; role-boundary note; escalation flag. Evidence to assess: Field completeness; correct source IDs; clear missing-data notes; correct escalation flag; no approval claim. AI support: Use AI to ask checklist questions only. Do not let AI invent missing data or approve the record.',
  1,
  '90 minutes',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Pharm
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-004-L1' LIMIT 1),
  'B.Pharm',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Pharm Pharmaceutical Quality Assurance
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-004-L1' LIMIT 1),
  'M.Pharm Pharmaceutical Quality Assurance',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Pharm Pharmaceutics
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-004-L1' LIMIT 1),
  'M.Pharm Pharmaceutics',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Chemistry
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-004-L1' LIMIT 1),
  'B.Sc Chemistry',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Sc Pharmaceutical Chemistry
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-004-L1' LIMIT 1),
  'M.Sc Pharmaceutical Chemistry',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Biological Product Batch and Comparability Evidence Control - Evidence Gap Recognition
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Biological Product Batch and Comparability Evidence Control - Evidence Gap Recognition',
  'COURSE-CAP-005-L1',
  'A learner receives 1 Biological Product Batch and Comparability Evidence Control record pack with 8 required fields. Three fields are blank, 2 source IDs are weak, and 1 owner note is unclear. The problem is to find what is missing before the record is used for review. Course objective: Recognize the required evidence fields for Biological Product Batch and Comparability Evidence Control; identify 3 missing/unclear items; record source IDs; explain what must be escalated. Learner outcome: Learner can inspect a Biological Product Batch and Comparability Evidence Control record and produce a checklist showing missing fields, weak source IDs, and role-boundary doubts.',
  '6 hours',
  'Active',
  'Pharma / Biotech / MedTech',
  'technical',
  '["Recognize the required evidence fields for Biological Product Batch and Comparability Evidence Control; identify 3 missing/unclear items; record source IDs; explain what must be escalated.","Learner can inspect a Biological Product Batch and Comparability Evidence Control record and produce a checklist showing missing fields, weak source IDs, and role-boundary doubts.","Create Biological Product Batch and Comparability Evidence Control completeness checklist","Assess evidence using: Field completeness; correct source IDs; clear missing-data notes; correct escalation flag; no approval claim."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L1: Evidence Gap Recognition - CAP-005
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-005-L1' LIMIT 1),
  'L1: Evidence Gap Recognition - CAP-005',
  'You are supporting a workplace evidence review. Your manager gives you one Biological Product Batch and Comparability Evidence Control file and asks you to check whether it is complete. You must not approve the file. You must mark the 3 blank fields, list the 2 weak source IDs, and explain which 1 role-boundary point needs clarification. Required data: Sample Biological Product Batch and Comparability Evidence Control source record; 8 required fields list; 3 intentionally missing entries; 2 source-ID references; 1 role-boundary note; blank checklist template.',
  1,
  '["Pharma / Biotech / MedTech","Biological Product, Vaccine and Biosimilar Operations","D-002","CAP-005","L1","Domain; Evidence; Cognitive; Compliance"]'::jsonb,
  '["Scenario Review","Evidence Check","Artifact Build","AI Coaching","Human Review","Retry and Improve","Portfolio Submission"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Biological Product Batch and Comparability Evidence Control completeness checklist Practice
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-005-L1' LIMIT 1)
   AND title = 'L1: Evidence Gap Recognition - CAP-005' LIMIT 1),
  'Biological Product Batch and Comparability Evidence Control completeness checklist Practice',
  'Complete the Biological Product Batch and Comparability Evidence Control completeness checklist using the provided actuals and explain the evidence decision in simple workplace language.',
  'Workplace scenario: You are supporting a workplace evidence review. Your manager gives you one Biological Product Batch and Comparability Evidence Control file and asks you to check whether it is complete. You must not approve the file. You must mark the 3 blank fields, list the 2 weak source IDs, and explain which 1 role-boundary point needs clarification. Major concepts: Biological Product Batch and Comparability Evidence Control evidence completeness; 8-field checklist logic; source-ID traceability; missing-data marking; ALCOA-style documentation thinking; role boundary between checking and approving. Artifact structure: Sections: record summary; required field list; missing-field table; source-ID table; role-boundary note; escalation flag. Evidence to assess: Field completeness; correct source IDs; clear missing-data notes; correct escalation flag; no approval claim. AI support: Use AI to ask checklist questions only. Do not let AI invent missing data or approve the record.',
  1,
  '90 minutes',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Pharm
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-005-L1' LIMIT 1),
  'B.Pharm',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Pharm Pharmaceutical Biotechnology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-005-L1' LIMIT 1),
  'M.Pharm Pharmaceutical Biotechnology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Biotechnology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-005-L1' LIMIT 1),
  'B.Sc Biotechnology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Sc Biotechnology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-005-L1' LIMIT 1),
  'M.Sc Biotechnology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech Biotechnology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-005-L1' LIMIT 1),
  'B.Tech Biotechnology',
  NOW()
) ON CONFLICT DO NOTHING;

COMMIT;

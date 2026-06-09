-- ============================================
-- COURSE SEED — part 07 of 10
-- Courses 301–350 of 485
-- Paste this whole file into the Supabase SQL editor and Run.
-- Safe to re-run (ON CONFLICT DO NOTHING). Run parts in order.
-- ============================================

BEGIN;

-- Insert Course: Agri-Biotech License-to-Operate Evidence Coordination - Exception Escalation and Blocker Handling
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Agri-Biotech License-to-Operate Evidence Coordination - Exception Escalation and Blocker Handling',
  'COURSE-CAP-016-L3',
  'An exception appears in the Agri-Biotech License-to-Operate Evidence Coordination evidence flow. Out of 16 evidence entries, 5 attachments are weak or missing, 2 blockers remain unresolved, and the learner must decide what needs escalation without taking approval authority. Course objective: Classify Agri-Biotech License-to-Operate Evidence Coordination exceptions by priority; identify blockers; build an escalation packet; state authority limits clearly. Learner outcome: Learner can classify Agri-Biotech License-to-Operate Evidence Coordination exceptions, separate missing evidence from risk blockers, and prepare an escalation packet.',
  '10 hours',
  'Active',
  'Pharma / Biotech / MedTech',
  'technical',
  '["Classify Agri-Biotech License-to-Operate Evidence Coordination exceptions by priority; identify blockers; build an escalation packet; state authority limits clearly.","Learner can classify Agri-Biotech License-to-Operate Evidence Coordination exceptions, separate missing evidence from risk blockers, and prepare an escalation packet.","Create Agri-Biotech License-to-Operate Evidence Coordination exception escalation packet","Assess evidence using: Exception priority; blocker clarity; attachment gap evidence; escalation logic; role-boundary discipline."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L3: Exception Escalation and Blocker Handling - CAP-016
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-016-L3' LIMIT 1),
  'L3: Exception Escalation and Blocker Handling - CAP-016',
  'A problem has moved beyond routine checking. The Agri-Biotech License-to-Operate Evidence Coordination evidence pack has missing attachments and a possible timeline risk. You sort 16 evidence entries into clean, unclear, missing, and escalation-needed groups, then prepare a packet that explains the 2 blockers. Required data: Agri-Biotech License-to-Operate Evidence Coordination exception case file; 16 evidence entries; 5 missing or weak attachments; 3 priority labels; 2 unresolved blockers; escalation-note template.',
  1,
  '["Pharma / Biotech / MedTech","Agri-Biotech and Seed Biotechnology Affairs","D-006","CAP-016","L3","Cognitive; Behavioural; Compliance; Evidence; Communication"]'::jsonb,
  '["Scenario Review","Evidence Check","Artifact Build","AI Coaching","Human Review","Retry and Improve","Portfolio Submission"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Agri-Biotech License-to-Operate Evidence Coordination exception escalation packet Practice
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-016-L3' LIMIT 1)
   AND title = 'L3: Exception Escalation and Blocker Handling - CAP-016' LIMIT 1),
  'Agri-Biotech License-to-Operate Evidence Coordination exception escalation packet Practice',
  'Complete the Agri-Biotech License-to-Operate Evidence Coordination exception escalation packet using the provided actuals and explain the evidence decision in simple workplace language.',
  'Workplace scenario: A problem has moved beyond routine checking. The Agri-Biotech License-to-Operate Evidence Coordination evidence pack has missing attachments and a possible timeline risk. You sort 16 evidence entries into clean, unclear, missing, and escalation-needed groups, then prepare a packet that explains the 2 blockers. Major concepts: Agri-Biotech License-to-Operate Evidence Coordination exception triage; blocker classification; evidence sufficiency; risk-priority sorting; escalation note structure; authority-safe handoff. Artifact structure: Sections: exception summary; affected evidence items; missing attachments; risk priority; blocker owner; escalation recommendation; authority limit. Evidence to assess: Exception priority; blocker clarity; attachment gap evidence; escalation logic; role-boundary discipline. AI support: Use AI to challenge escalation logic and role-boundary wording, not to decide final risk or approval.',
  1,
  '150 minutes',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Agriculture
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-016-L3' LIMIT 1),
  'B.Sc Agriculture',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Sc Agriculture Biotechnology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-016-L3' LIMIT 1),
  'M.Sc Agriculture Biotechnology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Biotechnology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-016-L3' LIMIT 1),
  'B.Sc Biotechnology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Sc Regulatory Affairs
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-016-L3' LIMIT 1),
  'M.Sc Regulatory Affairs',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech Biotechnology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-016-L3' LIMIT 1),
  'B.Tech Biotechnology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Medical Device Technical File, QMS and Post-Market Evidence Control - Exception Escalation and Blocker Handling
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Medical Device Technical File, QMS and Post-Market Evidence Control - Exception Escalation and Blocker Handling',
  'COURSE-CAP-017-L3',
  'An exception appears in the Medical Device Technical File, QMS and Post-Market Evidence Control evidence flow. Out of 16 evidence entries, 5 attachments are weak or missing, 2 blockers remain unresolved, and the learner must decide what needs escalation without taking approval authority. Course objective: Classify Medical Device Technical File, QMS and Post-Market Evidence Control exceptions by priority; identify blockers; build an escalation packet; state authority limits clearly. Learner outcome: Learner can classify Medical Device Technical File, QMS and Post-Market Evidence Control exceptions, separate missing evidence from risk blockers, and prepare an escalation packet.',
  '10 hours',
  'Active',
  'Pharma / Biotech / MedTech',
  'technical',
  '["Classify Medical Device Technical File, QMS and Post-Market Evidence Control exceptions by priority; identify blockers; build an escalation packet; state authority limits clearly.","Learner can classify Medical Device Technical File, QMS and Post-Market Evidence Control exceptions, separate missing evidence from risk blockers, and prepare an escalation packet.","Create Medical Device Technical File, QMS and Post-Market Evidence Control exception escalation packet","Assess evidence using: Exception priority; blocker clarity; attachment gap evidence; escalation logic; role-boundary discipline."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L3: Exception Escalation and Blocker Handling - CAP-017
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-017-L3' LIMIT 1),
  'L3: Exception Escalation and Blocker Handling - CAP-017',
  'A problem has moved beyond routine checking. The Medical Device Technical File, QMS and Post-Market Evidence Control evidence pack has missing attachments and a possible timeline risk. You sort 16 evidence entries into clean, unclear, missing, and escalation-needed groups, then prepare a packet that explains the 2 blockers. Required data: Medical Device Technical File, QMS and Post-Market Evidence Control exception case file; 16 evidence entries; 5 missing or weak attachments; 3 priority labels; 2 unresolved blockers; escalation-note template.',
  1,
  '["Pharma / Biotech / MedTech","Medical Device Regulatory and Quality Operations","D-007","CAP-017","L3","Cognitive; Behavioural; Compliance; Evidence; Communication"]'::jsonb,
  '["Scenario Review","Evidence Check","Artifact Build","AI Coaching","Human Review","Retry and Improve","Portfolio Submission"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Medical Device Technical File, QMS and Post-Market Evidence Control exception escalation packet Practice
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-017-L3' LIMIT 1)
   AND title = 'L3: Exception Escalation and Blocker Handling - CAP-017' LIMIT 1),
  'Medical Device Technical File, QMS and Post-Market Evidence Control exception escalation packet Practice',
  'Complete the Medical Device Technical File, QMS and Post-Market Evidence Control exception escalation packet using the provided actuals and explain the evidence decision in simple workplace language.',
  'Workplace scenario: A problem has moved beyond routine checking. The Medical Device Technical File, QMS and Post-Market Evidence Control evidence pack has missing attachments and a possible timeline risk. You sort 16 evidence entries into clean, unclear, missing, and escalation-needed groups, then prepare a packet that explains the 2 blockers. Major concepts: Medical Device Technical File, QMS and Post-Market Evidence Control exception triage; blocker classification; evidence sufficiency; risk-priority sorting; escalation note structure; authority-safe handoff. Artifact structure: Sections: exception summary; affected evidence items; missing attachments; risk priority; blocker owner; escalation recommendation; authority limit. Evidence to assess: Exception priority; blocker clarity; attachment gap evidence; escalation logic; role-boundary discipline. AI support: Use AI to challenge escalation logic and role-boundary wording, not to decide final risk or approval.',
  1,
  '150 minutes',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Pharm
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-017-L3' LIMIT 1),
  'B.Pharm',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Pharm Regulatory Affairs
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-017-L3' LIMIT 1),
  'M.Pharm Regulatory Affairs',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech Biomedical Engineering
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-017-L3' LIMIT 1),
  'B.Tech Biomedical Engineering',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Life Sciences
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-017-L3' LIMIT 1),
  'B.Sc Life Sciences',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Sc Medical Technology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-017-L3' LIMIT 1),
  'M.Sc Medical Technology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Device QC Test Report and Biomedical Equipment Nonconformance Packet Control - Exception Escalation and Blocker Handling
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Device QC Test Report and Biomedical Equipment Nonconformance Packet Control - Exception Escalation and Blocker Handling',
  'COURSE-CAP-018A-L3',
  'An exception appears in the Device QC Test Report and Biomedical Equipment Nonconformance Packet Control evidence flow. Out of 16 evidence entries, 5 attachments are weak or missing, 2 blockers remain unresolved, and the learner must decide what needs escalation without taking approval authority. Course objective: Classify Device QC Test Report and Biomedical Equipment Nonconformance Packet Control exceptions by priority; identify blockers; build an escalation packet; state authority limits clearly. Learner outcome: Learner can classify Device QC Test Report and Biomedical Equipment Nonconformance Packet Control exceptions, separate missing evidence from risk blockers, and prepare an escalation packet.',
  '10 hours',
  'Active',
  'Pharma / Biotech / MedTech',
  'technical',
  '["Classify Device QC Test Report and Biomedical Equipment Nonconformance Packet Control exceptions by priority; identify blockers; build an escalation packet; state authority limits clearly.","Learner can classify Device QC Test Report and Biomedical Equipment Nonconformance Packet Control exceptions, separate missing evidence from risk blockers, and prepare an escalation packet.","Create Device QC Test Report and Biomedical Equipment Nonconformance Packet Control exception escalation packet","Assess evidence using: Exception priority; blocker clarity; attachment gap evidence; escalation logic; role-boundary discipline."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L3: Exception Escalation and Blocker Handling - CAP-018A
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-018A-L3' LIMIT 1),
  'L3: Exception Escalation and Blocker Handling - CAP-018A',
  'A problem has moved beyond routine checking. The Device QC Test Report and Biomedical Equipment Nonconformance Packet Control evidence pack has missing attachments and a possible timeline risk. You sort 16 evidence entries into clean, unclear, missing, and escalation-needed groups, then prepare a packet that explains the 2 blockers. Required data: Device QC Test Report and Biomedical Equipment Nonconformance Packet Control exception case file; 16 evidence entries; 5 missing or weak attachments; 3 priority labels; 2 unresolved blockers; escalation-note template.',
  1,
  '["Pharma / Biotech / MedTech","Medical Device QC Testing and Biomedical Equipment Evidence","D-007","CAP-018A","L3","Cognitive; Behavioural; Compliance; Evidence; Communication"]'::jsonb,
  '["Scenario Review","Evidence Check","Artifact Build","AI Coaching","Human Review","Retry and Improve","Portfolio Submission"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Device QC Test Report and Biomedical Equipment Nonconformance Packet Control exception escalation packet Practice
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-018A-L3' LIMIT 1)
   AND title = 'L3: Exception Escalation and Blocker Handling - CAP-018A' LIMIT 1),
  'Device QC Test Report and Biomedical Equipment Nonconformance Packet Control exception escalation packet Practice',
  'Complete the Device QC Test Report and Biomedical Equipment Nonconformance Packet Control exception escalation packet using the provided actuals and explain the evidence decision in simple workplace language.',
  'Workplace scenario: A problem has moved beyond routine checking. The Device QC Test Report and Biomedical Equipment Nonconformance Packet Control evidence pack has missing attachments and a possible timeline risk. You sort 16 evidence entries into clean, unclear, missing, and escalation-needed groups, then prepare a packet that explains the 2 blockers. Major concepts: Device QC Test Report and Biomedical Equipment Nonconformance Packet Control exception triage; blocker classification; evidence sufficiency; risk-priority sorting; escalation note structure; authority-safe handoff. Artifact structure: Sections: exception summary; affected evidence items; missing attachments; risk priority; blocker owner; escalation recommendation; authority limit. Evidence to assess: Exception priority; blocker clarity; attachment gap evidence; escalation logic; role-boundary discipline. AI support: Use AI to challenge escalation logic and role-boundary wording, not to decide final risk or approval.',
  1,
  '150 minutes',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech Biomedical Engineering
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-018A-L3' LIMIT 1),
  'B.Tech Biomedical Engineering',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: Diploma Biomedical Engineering
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-018A-L3' LIMIT 1),
  'Diploma Biomedical Engineering',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Medical Laboratory Technology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-018A-L3' LIMIT 1),
  'B.Sc Medical Laboratory Technology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech Electronics and Instrumentation
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-018A-L3' LIMIT 1),
  'B.Tech Electronics and Instrumentation',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Physics
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-018A-L3' LIMIT 1),
  'B.Sc Physics',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: IVD Performance, Diagnostic Evidence and PMS Packet Control - Exception Escalation and Blocker Handling
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'IVD Performance, Diagnostic Evidence and PMS Packet Control - Exception Escalation and Blocker Handling',
  'COURSE-CAP-018B-L3',
  'An exception appears in the IVD Performance, Diagnostic Evidence and PMS Packet Control evidence flow. Out of 16 evidence entries, 5 attachments are weak or missing, 2 blockers remain unresolved, and the learner must decide what needs escalation without taking approval authority. Course objective: Classify IVD Performance, Diagnostic Evidence and PMS Packet Control exceptions by priority; identify blockers; build an escalation packet; state authority limits clearly. Learner outcome: Learner can classify IVD Performance, Diagnostic Evidence and PMS Packet Control exceptions, separate missing evidence from risk blockers, and prepare an escalation packet.',
  '10 hours',
  'Active',
  'Pharma / Biotech / MedTech',
  'technical',
  '["Classify IVD Performance, Diagnostic Evidence and PMS Packet Control exceptions by priority; identify blockers; build an escalation packet; state authority limits clearly.","Learner can classify IVD Performance, Diagnostic Evidence and PMS Packet Control exceptions, separate missing evidence from risk blockers, and prepare an escalation packet.","Create IVD Performance, Diagnostic Evidence and PMS Packet Control exception escalation packet","Assess evidence using: Exception priority; blocker clarity; attachment gap evidence; escalation logic; role-boundary discipline."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L3: Exception Escalation and Blocker Handling - CAP-018B
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-018B-L3' LIMIT 1),
  'L3: Exception Escalation and Blocker Handling - CAP-018B',
  'A problem has moved beyond routine checking. The IVD Performance, Diagnostic Evidence and PMS Packet Control evidence pack has missing attachments and a possible timeline risk. You sort 16 evidence entries into clean, unclear, missing, and escalation-needed groups, then prepare a packet that explains the 2 blockers. Required data: IVD Performance, Diagnostic Evidence and PMS Packet Control exception case file; 16 evidence entries; 5 missing or weak attachments; 3 priority labels; 2 unresolved blockers; escalation-note template.',
  1,
  '["Pharma / Biotech / MedTech","IVD Regulatory and Performance Evaluation Operations","Medical Device Softwar","D-007","CAP-018B","L3","Cognitive; Behavioural; Compliance; Evidence; Communication"]'::jsonb,
  '["Scenario Review","Evidence Check","Artifact Build","AI Coaching","Human Review","Retry and Improve","Portfolio Submission"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: IVD Performance, Diagnostic Evidence and PMS Packet Control exception escalation packet Practice
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-018B-L3' LIMIT 1)
   AND title = 'L3: Exception Escalation and Blocker Handling - CAP-018B' LIMIT 1),
  'IVD Performance, Diagnostic Evidence and PMS Packet Control exception escalation packet Practice',
  'Complete the IVD Performance, Diagnostic Evidence and PMS Packet Control exception escalation packet using the provided actuals and explain the evidence decision in simple workplace language.',
  'Workplace scenario: A problem has moved beyond routine checking. The IVD Performance, Diagnostic Evidence and PMS Packet Control evidence pack has missing attachments and a possible timeline risk. You sort 16 evidence entries into clean, unclear, missing, and escalation-needed groups, then prepare a packet that explains the 2 blockers. Major concepts: IVD Performance, Diagnostic Evidence and PMS Packet Control exception triage; blocker classification; evidence sufficiency; risk-priority sorting; escalation note structure; authority-safe handoff. Artifact structure: Sections: exception summary; affected evidence items; missing attachments; risk priority; blocker owner; escalation recommendation; authority limit. Evidence to assess: Exception priority; blocker clarity; attachment gap evidence; escalation logic; role-boundary discipline. AI support: Use AI to challenge escalation logic and role-boundary wording, not to decide final risk or approval.',
  1,
  '150 minutes',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Medical Laboratory Technology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-018B-L3' LIMIT 1),
  'B.Sc Medical Laboratory Technology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Sc Clinical Biochemistry
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-018B-L3' LIMIT 1),
  'M.Sc Clinical Biochemistry',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Sc Microbiology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-018B-L3' LIMIT 1),
  'M.Sc Microbiology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech Biotechnology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-018B-L3' LIMIT 1),
  'B.Tech Biotechnology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Biotechnology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-018B-L3' LIMIT 1),
  'B.Sc Biotechnology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: SaMD Lifecycle, V&V and Cybersecurity Evidence Index Control - Exception Escalation and Blocker Handling
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'SaMD Lifecycle, V&V and Cybersecurity Evidence Index Control - Exception Escalation and Blocker Handling',
  'COURSE-CAP-018C-L3',
  'An exception appears in the SaMD Lifecycle, V&V and Cybersecurity Evidence Index Control evidence flow. Out of 16 evidence entries, 5 attachments are weak or missing, 2 blockers remain unresolved, and the learner must decide what needs escalation without taking approval authority. Course objective: Classify SaMD Lifecycle, V&V and Cybersecurity Evidence Index Control exceptions by priority; identify blockers; build an escalation packet; state authority limits clearly. Learner outcome: Learner can classify SaMD Lifecycle, V&V and Cybersecurity Evidence Index Control exceptions, separate missing evidence from risk blockers, and prepare an escalation packet.',
  '10 hours',
  'Active',
  'Pharma / Biotech / MedTech',
  'technical',
  '["Classify SaMD Lifecycle, V&V and Cybersecurity Evidence Index Control exceptions by priority; identify blockers; build an escalation packet; state authority limits clearly.","Learner can classify SaMD Lifecycle, V&V and Cybersecurity Evidence Index Control exceptions, separate missing evidence from risk blockers, and prepare an escalation packet.","Create SaMD Lifecycle, V&V and Cybersecurity Evidence Index Control exception escalation packet","Assess evidence using: Exception priority; blocker clarity; attachment gap evidence; escalation logic; role-boundary discipline."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L3: Exception Escalation and Blocker Handling - CAP-018C
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-018C-L3' LIMIT 1),
  'L3: Exception Escalation and Blocker Handling - CAP-018C',
  'A problem has moved beyond routine checking. The SaMD Lifecycle, V&V and Cybersecurity Evidence Index Control evidence pack has missing attachments and a possible timeline risk. You sort 16 evidence entries into clean, unclear, missing, and escalation-needed groups, then prepare a packet that explains the 2 blockers. Required data: SaMD Lifecycle, V&V and Cybersecurity Evidence Index Control exception case file; 16 evidence entries; 5 missing or weak attachments; 3 priority labels; 2 unresolved blockers; escalation-note template.',
  1,
  '["Pharma / Biotech / MedTech","Medical Device Software QARA and Digital Product Evidence","D-007","CAP-018C","L3","Cognitive; Behavioural; Compliance; Evidence; Communication"]'::jsonb,
  '["Scenario Review","Evidence Check","Artifact Build","AI Coaching","Human Review","Retry and Improve","Portfolio Submission"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: SaMD Lifecycle, V&V and Cybersecurity Evidence Index Control exception escalation packet Practice
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-018C-L3' LIMIT 1)
   AND title = 'L3: Exception Escalation and Blocker Handling - CAP-018C' LIMIT 1),
  'SaMD Lifecycle, V&V and Cybersecurity Evidence Index Control exception escalation packet Practice',
  'Complete the SaMD Lifecycle, V&V and Cybersecurity Evidence Index Control exception escalation packet using the provided actuals and explain the evidence decision in simple workplace language.',
  'Workplace scenario: A problem has moved beyond routine checking. The SaMD Lifecycle, V&V and Cybersecurity Evidence Index Control evidence pack has missing attachments and a possible timeline risk. You sort 16 evidence entries into clean, unclear, missing, and escalation-needed groups, then prepare a packet that explains the 2 blockers. Major concepts: SaMD Lifecycle, V&V and Cybersecurity Evidence Index Control exception triage; blocker classification; evidence sufficiency; risk-priority sorting; escalation note structure; authority-safe handoff. Artifact structure: Sections: exception summary; affected evidence items; missing attachments; risk priority; blocker owner; escalation recommendation; authority limit. Evidence to assess: Exception priority; blocker clarity; attachment gap evidence; escalation logic; role-boundary discipline. AI support: Use AI to challenge escalation logic and role-boundary wording, not to decide final risk or approval.',
  1,
  '150 minutes',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech Biomedical Engineering
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-018C-L3' LIMIT 1),
  'B.Tech Biomedical Engineering',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech Computer Science
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-018C-L3' LIMIT 1),
  'B.Tech Computer Science',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech Information Technology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-018C-L3' LIMIT 1),
  'B.Tech Information Technology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Sc Health Informatics
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-018C-L3' LIMIT 1),
  'M.Sc Health Informatics',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Tech Medical Software Systems
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-018C-L3' LIMIT 1),
  'M.Tech Medical Software Systems',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: API Batch Quality Evidence Review - Readiness Packet and Decision Support
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'API Batch Quality Evidence Review - Readiness Packet and Decision Support',
  'COURSE-CAP-001-L4',
  'A readiness review for API Batch Quality Evidence Review is blocked. The pack has 22 evidence items, but 1 acceptance criterion is missing, 2 source references are unresolved, and the reviewer cannot close the decision-support pack. Course objective: Map API Batch Quality Evidence Review evidence against acceptance criteria; show readiness gaps; prepare a decision-support packet; document reviewer blockers. Learner outcome: Learner can build an API Batch Quality Evidence Review readiness packet that supports review when acceptance criteria or source evidence are incomplete.',
  '12 hours',
  'Active',
  'Pharma / Biotech / MedTech',
  'technical',
  '["Map API Batch Quality Evidence Review evidence against acceptance criteria; show readiness gaps; prepare a decision-support packet; document reviewer blockers.","Learner can build an API Batch Quality Evidence Review readiness packet that supports review when acceptance criteria or source evidence are incomplete.","Create API Batch Quality Evidence Review readiness and decision-support packet","Assess evidence using: Acceptance-criteria coverage; readiness confidence; unresolved-source visibility; reviewer blocker explanation; decision-support quality."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L4: Readiness Packet and Decision Support - CAP-001
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-001-L4' LIMIT 1),
  'L4: Readiness Packet and Decision Support - CAP-001',
  'A review meeting is due in 24 hours. The API Batch Quality Evidence Review readiness pack cannot be closed because one acceptance criterion is missing and 2 source records are unresolved. You prepare a decision-support packet that shows what is ready, what is blocked, who owns it, and what must happen next. Required data: API Batch Quality Evidence Review readiness pack; 22 evidence items; 2 unresolved source references; 1 missing acceptance criterion; 1 reviewer hold comment; decision-support template.',
  1,
  '["Pharma / Biotech / MedTech","Small-Molecule Pharma Manufacturing and CMC Regulatory Operations","D-001","CAP-001","L4","Functional; Cognitive; Evidence; Communication; Compliance"]'::jsonb,
  '["Scenario Review","Evidence Check","Artifact Build","AI Coaching","Human Review","Retry and Improve","Portfolio Submission"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: API Batch Quality Evidence Review readiness and decision-support packet Practice
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-001-L4' LIMIT 1)
   AND title = 'L4: Readiness Packet and Decision Support - CAP-001' LIMIT 1),
  'API Batch Quality Evidence Review readiness and decision-support packet Practice',
  'Complete the API Batch Quality Evidence Review readiness and decision-support packet using the provided actuals and explain the evidence decision in simple workplace language.',
  'Workplace scenario: A review meeting is due in 24 hours. The API Batch Quality Evidence Review readiness pack cannot be closed because one acceptance criterion is missing and 2 source records are unresolved. You prepare a decision-support packet that shows what is ready, what is blocked, who owns it, and what must happen next. Major concepts: API Batch Quality Evidence Review readiness assessment; acceptance-criteria mapping; decision-support packet logic; blocker summary; reviewer hold resolution; evidence confidence rating. Artifact structure: Sections: readiness summary; acceptance-criteria map; unresolved source references; reviewer hold note; decision-support recommendation; next action. Evidence to assess: Acceptance-criteria coverage; readiness confidence; unresolved-source visibility; reviewer blocker explanation; decision-support quality. AI support: Use AI to summarize readiness blockers and test whether the decision-support packet is clear to a reviewer.',
  1,
  '180 minutes',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Pharm
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-001-L4' LIMIT 1),
  'B.Pharm',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Pharm Pharmaceutical Quality Assurance
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-001-L4' LIMIT 1),
  'M.Pharm Pharmaceutical Quality Assurance',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Pharm Pharmaceutics
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-001-L4' LIMIT 1),
  'M.Pharm Pharmaceutics',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Chemistry
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-001-L4' LIMIT 1),
  'B.Sc Chemistry',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Sc Pharmaceutical Chemistry
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-001-L4' LIMIT 1),
  'M.Sc Pharmaceutical Chemistry',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: API Deviation, OOS and CAPA Evidence Control - Readiness Packet and Decision Support
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'API Deviation, OOS and CAPA Evidence Control - Readiness Packet and Decision Support',
  'COURSE-CAP-002-L4',
  'A readiness review for API Deviation, OOS and CAPA Evidence Control is blocked. The pack has 22 evidence items, but 1 acceptance criterion is missing, 2 source references are unresolved, and the reviewer cannot close the decision-support pack. Course objective: Map API Deviation, OOS and CAPA Evidence Control evidence against acceptance criteria; show readiness gaps; prepare a decision-support packet; document reviewer blockers. Learner outcome: Learner can build an API Deviation, OOS and CAPA Evidence Control readiness packet that supports review when acceptance criteria or source evidence are incomplete.',
  '12 hours',
  'Active',
  'Pharma / Biotech / MedTech',
  'technical',
  '["Map API Deviation, OOS and CAPA Evidence Control evidence against acceptance criteria; show readiness gaps; prepare a decision-support packet; document reviewer blockers.","Learner can build an API Deviation, OOS and CAPA Evidence Control readiness packet that supports review when acceptance criteria or source evidence are incomplete.","Create API Deviation, OOS and CAPA Evidence Control readiness and decision-support packet","Assess evidence using: Acceptance-criteria coverage; readiness confidence; unresolved-source visibility; reviewer blocker explanation; decision-support quality."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L4: Readiness Packet and Decision Support - CAP-002
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-002-L4' LIMIT 1),
  'L4: Readiness Packet and Decision Support - CAP-002',
  'A review meeting is due in 24 hours. The API Deviation, OOS and CAPA Evidence Control readiness pack cannot be closed because one acceptance criterion is missing and 2 source records are unresolved. You prepare a decision-support packet that shows what is ready, what is blocked, who owns it, and what must happen next. Required data: API Deviation, OOS and CAPA Evidence Control readiness pack; 22 evidence items; 2 unresolved source references; 1 missing acceptance criterion; 1 reviewer hold comment; decision-support template.',
  1,
  '["Pharma / Biotech / MedTech","Small-Molecule Pharma Manufacturing and CMC Regulatory Operations","Pharma GM","D-001","CAP-002","L4","Functional; Cognitive; Evidence; Communication; Compliance"]'::jsonb,
  '["Scenario Review","Evidence Check","Artifact Build","AI Coaching","Human Review","Retry and Improve","Portfolio Submission"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: API Deviation, OOS and CAPA Evidence Control readiness and decision-support packet Practice
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-002-L4' LIMIT 1)
   AND title = 'L4: Readiness Packet and Decision Support - CAP-002' LIMIT 1),
  'API Deviation, OOS and CAPA Evidence Control readiness and decision-support packet Practice',
  'Complete the API Deviation, OOS and CAPA Evidence Control readiness and decision-support packet using the provided actuals and explain the evidence decision in simple workplace language.',
  'Workplace scenario: A review meeting is due in 24 hours. The API Deviation, OOS and CAPA Evidence Control readiness pack cannot be closed because one acceptance criterion is missing and 2 source records are unresolved. You prepare a decision-support packet that shows what is ready, what is blocked, who owns it, and what must happen next. Major concepts: API Deviation, OOS and CAPA Evidence Control readiness assessment; acceptance-criteria mapping; decision-support packet logic; blocker summary; reviewer hold resolution; evidence confidence rating. Artifact structure: Sections: readiness summary; acceptance-criteria map; unresolved source references; reviewer hold note; decision-support recommendation; next action. Evidence to assess: Acceptance-criteria coverage; readiness confidence; unresolved-source visibility; reviewer blocker explanation; decision-support quality. AI support: Use AI to summarize readiness blockers and test whether the decision-support packet is clear to a reviewer.',
  1,
  '180 minutes',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Pharm
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-002-L4' LIMIT 1),
  'B.Pharm',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Pharm Pharmaceutical Quality Assurance
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-002-L4' LIMIT 1),
  'M.Pharm Pharmaceutical Quality Assurance',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Pharm Pharmaceutics
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-002-L4' LIMIT 1),
  'M.Pharm Pharmaceutics',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Chemistry
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-002-L4' LIMIT 1),
  'B.Sc Chemistry',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Sc Pharmaceutical Chemistry
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-002-L4' LIMIT 1),
  'M.Sc Pharmaceutical Chemistry',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Finished Dose BMR/BPR Packaging Variance and Release Packet Control - Readiness Packet and Decision Support
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Finished Dose BMR/BPR Packaging Variance and Release Packet Control - Readiness Packet and Decision Support',
  'COURSE-CAP-003-L4',
  'A readiness review for Finished Dose BMR/BPR Packaging Variance and Release Packet Control is blocked. The pack has 22 evidence items, but 1 acceptance criterion is missing, 2 source references are unresolved, and the reviewer cannot close the decision-support pack. Course objective: Map Finished Dose BMR/BPR Packaging Variance and Release Packet Control evidence against acceptance criteria; show readiness gaps; prepare a decision-support packet; document reviewer blockers. Learner outcome: Learner can build a Finished Dose BMR/BPR Packaging Variance and Release Packet Control readiness packet that supports review when acceptance criteria or source evidence are incomplete.',
  '12 hours',
  'Active',
  'Pharma / Biotech / MedTech',
  'technical',
  '["Map Finished Dose BMR/BPR Packaging Variance and Release Packet Control evidence against acceptance criteria; show readiness gaps; prepare a decision-support packet; document reviewer blockers.","Learner can build a Finished Dose BMR/BPR Packaging Variance and Release Packet Control readiness packet that supports review when acceptance criteria or source evidence are incomplete.","Create Finished Dose BMR/BPR Packaging Variance and Release Packet Control readiness and decision-support packet","Assess evidence using: Acceptance-criteria coverage; readiness confidence; unresolved-source visibility; reviewer blocker explanation; decision-support quality."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L4: Readiness Packet and Decision Support - CAP-003
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-003-L4' LIMIT 1),
  'L4: Readiness Packet and Decision Support - CAP-003',
  'A review meeting is due in 24 hours. The Finished Dose BMR/BPR Packaging Variance and Release Packet Control readiness pack cannot be closed because one acceptance criterion is missing and 2 source records are unresolved. You prepare a decision-support packet that shows what is ready, what is blocked, who owns it, and what must happen next. Required data: Finished Dose BMR/BPR Packaging Variance and Release Packet Control readiness pack; 22 evidence items; 2 unresolved source references; 1 missing acceptance criterion; 1 reviewer hold comment; decision-support template.',
  1,
  '["Pharma / Biotech / MedTech","Small-Molecule Pharma Manufacturing and CMC Regulatory Operations","Pharma GM","D-001","CAP-003","L4","Functional; Cognitive; Evidence; Communication; Compliance"]'::jsonb,
  '["Scenario Review","Evidence Check","Artifact Build","AI Coaching","Human Review","Retry and Improve","Portfolio Submission"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Finished Dose BMR/BPR Packaging Variance and Release Packet Control readiness and decision-support packet Practice
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-003-L4' LIMIT 1)
   AND title = 'L4: Readiness Packet and Decision Support - CAP-003' LIMIT 1),
  'Finished Dose BMR/BPR Packaging Variance and Release Packet Control readiness and decision-support packet Practice',
  'Complete the Finished Dose BMR/BPR Packaging Variance and Release Packet Control readiness and decision-support packet using the provided actuals and explain the evidence decision in simple workplace language.',
  'Workplace scenario: A review meeting is due in 24 hours. The Finished Dose BMR/BPR Packaging Variance and Release Packet Control readiness pack cannot be closed because one acceptance criterion is missing and 2 source records are unresolved. You prepare a decision-support packet that shows what is ready, what is blocked, who owns it, and what must happen next. Major concepts: Finished Dose BMR/BPR Packaging Variance and Release Packet Control readiness assessment; acceptance-criteria mapping; decision-support packet logic; blocker summary; reviewer hold resolution; evidence confidence rating. Artifact structure: Sections: readiness summary; acceptance-criteria map; unresolved source references; reviewer hold note; decision-support recommendation; next action. Evidence to assess: Acceptance-criteria coverage; readiness confidence; unresolved-source visibility; reviewer blocker explanation; decision-support quality. AI support: Use AI to summarize readiness blockers and test whether the decision-support packet is clear to a reviewer.',
  1,
  '180 minutes',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Pharm
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-003-L4' LIMIT 1),
  'B.Pharm',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Pharm Pharmaceutical Quality Assurance
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-003-L4' LIMIT 1),
  'M.Pharm Pharmaceutical Quality Assurance',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Pharm Pharmaceutics
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-003-L4' LIMIT 1),
  'M.Pharm Pharmaceutics',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Chemistry
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-003-L4' LIMIT 1),
  'B.Sc Chemistry',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Sc Pharmaceutical Chemistry
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-003-L4' LIMIT 1),
  'M.Sc Pharmaceutical Chemistry',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Stability Study Follow-Up and Change-Control Impact Packet Control - Readiness Packet and Decision Support
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Stability Study Follow-Up and Change-Control Impact Packet Control - Readiness Packet and Decision Support',
  'COURSE-CAP-004-L4',
  'A readiness review for Stability Study Follow-Up and Change-Control Impact Packet Control is blocked. The pack has 22 evidence items, but 1 acceptance criterion is missing, 2 source references are unresolved, and the reviewer cannot close the decision-support pack. Course objective: Map Stability Study Follow-Up and Change-Control Impact Packet Control evidence against acceptance criteria; show readiness gaps; prepare a decision-support packet; document reviewer blockers. Learner outcome: Learner can build a Stability Study Follow-Up and Change-Control Impact Packet Control readiness packet that supports review when acceptance criteria or source evidence are incomplete.',
  '12 hours',
  'Active',
  'Pharma / Biotech / MedTech',
  'technical',
  '["Map Stability Study Follow-Up and Change-Control Impact Packet Control evidence against acceptance criteria; show readiness gaps; prepare a decision-support packet; document reviewer blockers.","Learner can build a Stability Study Follow-Up and Change-Control Impact Packet Control readiness packet that supports review when acceptance criteria or source evidence are incomplete.","Create Stability Study Follow-Up and Change-Control Impact Packet Control readiness and decision-support packet","Assess evidence using: Acceptance-criteria coverage; readiness confidence; unresolved-source visibility; reviewer blocker explanation; decision-support quality."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L4: Readiness Packet and Decision Support - CAP-004
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-004-L4' LIMIT 1),
  'L4: Readiness Packet and Decision Support - CAP-004',
  'A review meeting is due in 24 hours. The Stability Study Follow-Up and Change-Control Impact Packet Control readiness pack cannot be closed because one acceptance criterion is missing and 2 source records are unresolved. You prepare a decision-support packet that shows what is ready, what is blocked, who owns it, and what must happen next. Required data: Stability Study Follow-Up and Change-Control Impact Packet Control readiness pack; 22 evidence items; 2 unresolved source references; 1 missing acceptance criterion; 1 reviewer hold comment; decision-support template.',
  1,
  '["Pharma / Biotech / MedTech","Small-Molecule Pharma Manufacturing and CMC Regulatory Operations","Pharma GM","D-001","CAP-004","L4","Functional; Cognitive; Evidence; Communication; Compliance"]'::jsonb,
  '["Scenario Review","Evidence Check","Artifact Build","AI Coaching","Human Review","Retry and Improve","Portfolio Submission"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Stability Study Follow-Up and Change-Control Impact Packet Control readiness and decision-support packet Practice
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-004-L4' LIMIT 1)
   AND title = 'L4: Readiness Packet and Decision Support - CAP-004' LIMIT 1),
  'Stability Study Follow-Up and Change-Control Impact Packet Control readiness and decision-support packet Practice',
  'Complete the Stability Study Follow-Up and Change-Control Impact Packet Control readiness and decision-support packet using the provided actuals and explain the evidence decision in simple workplace language.',
  'Workplace scenario: A review meeting is due in 24 hours. The Stability Study Follow-Up and Change-Control Impact Packet Control readiness pack cannot be closed because one acceptance criterion is missing and 2 source records are unresolved. You prepare a decision-support packet that shows what is ready, what is blocked, who owns it, and what must happen next. Major concepts: Stability Study Follow-Up and Change-Control Impact Packet Control readiness assessment; acceptance-criteria mapping; decision-support packet logic; blocker summary; reviewer hold resolution; evidence confidence rating. Artifact structure: Sections: readiness summary; acceptance-criteria map; unresolved source references; reviewer hold note; decision-support recommendation; next action. Evidence to assess: Acceptance-criteria coverage; readiness confidence; unresolved-source visibility; reviewer blocker explanation; decision-support quality. AI support: Use AI to summarize readiness blockers and test whether the decision-support packet is clear to a reviewer.',
  1,
  '180 minutes',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Pharm
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-004-L4' LIMIT 1),
  'B.Pharm',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Pharm Pharmaceutical Quality Assurance
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-004-L4' LIMIT 1),
  'M.Pharm Pharmaceutical Quality Assurance',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Pharm Pharmaceutics
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-004-L4' LIMIT 1),
  'M.Pharm Pharmaceutics',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Chemistry
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-004-L4' LIMIT 1),
  'B.Sc Chemistry',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Sc Pharmaceutical Chemistry
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-004-L4' LIMIT 1),
  'M.Sc Pharmaceutical Chemistry',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Biological Product Batch and Comparability Evidence Control - Readiness Packet and Decision Support
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Biological Product Batch and Comparability Evidence Control - Readiness Packet and Decision Support',
  'COURSE-CAP-005-L4',
  'A readiness review for Biological Product Batch and Comparability Evidence Control is blocked. The pack has 22 evidence items, but 1 acceptance criterion is missing, 2 source references are unresolved, and the reviewer cannot close the decision-support pack. Course objective: Map Biological Product Batch and Comparability Evidence Control evidence against acceptance criteria; show readiness gaps; prepare a decision-support packet; document reviewer blockers. Learner outcome: Learner can build a Biological Product Batch and Comparability Evidence Control readiness packet that supports review when acceptance criteria or source evidence are incomplete.',
  '12 hours',
  'Active',
  'Pharma / Biotech / MedTech',
  'technical',
  '["Map Biological Product Batch and Comparability Evidence Control evidence against acceptance criteria; show readiness gaps; prepare a decision-support packet; document reviewer blockers.","Learner can build a Biological Product Batch and Comparability Evidence Control readiness packet that supports review when acceptance criteria or source evidence are incomplete.","Create Biological Product Batch and Comparability Evidence Control readiness and decision-support packet","Assess evidence using: Acceptance-criteria coverage; readiness confidence; unresolved-source visibility; reviewer blocker explanation; decision-support quality."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L4: Readiness Packet and Decision Support - CAP-005
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-005-L4' LIMIT 1),
  'L4: Readiness Packet and Decision Support - CAP-005',
  'A review meeting is due in 24 hours. The Biological Product Batch and Comparability Evidence Control readiness pack cannot be closed because one acceptance criterion is missing and 2 source records are unresolved. You prepare a decision-support packet that shows what is ready, what is blocked, who owns it, and what must happen next. Required data: Biological Product Batch and Comparability Evidence Control readiness pack; 22 evidence items; 2 unresolved source references; 1 missing acceptance criterion; 1 reviewer hold comment; decision-support template.',
  1,
  '["Pharma / Biotech / MedTech","Biological Product, Vaccine and Biosimilar Operations","D-002","CAP-005","L4","Functional; Cognitive; Evidence; Communication; Compliance"]'::jsonb,
  '["Scenario Review","Evidence Check","Artifact Build","AI Coaching","Human Review","Retry and Improve","Portfolio Submission"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Biological Product Batch and Comparability Evidence Control readiness and decision-support packet Practice
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-005-L4' LIMIT 1)
   AND title = 'L4: Readiness Packet and Decision Support - CAP-005' LIMIT 1),
  'Biological Product Batch and Comparability Evidence Control readiness and decision-support packet Practice',
  'Complete the Biological Product Batch and Comparability Evidence Control readiness and decision-support packet using the provided actuals and explain the evidence decision in simple workplace language.',
  'Workplace scenario: A review meeting is due in 24 hours. The Biological Product Batch and Comparability Evidence Control readiness pack cannot be closed because one acceptance criterion is missing and 2 source records are unresolved. You prepare a decision-support packet that shows what is ready, what is blocked, who owns it, and what must happen next. Major concepts: Biological Product Batch and Comparability Evidence Control readiness assessment; acceptance-criteria mapping; decision-support packet logic; blocker summary; reviewer hold resolution; evidence confidence rating. Artifact structure: Sections: readiness summary; acceptance-criteria map; unresolved source references; reviewer hold note; decision-support recommendation; next action. Evidence to assess: Acceptance-criteria coverage; readiness confidence; unresolved-source visibility; reviewer blocker explanation; decision-support quality. AI support: Use AI to summarize readiness blockers and test whether the decision-support packet is clear to a reviewer.',
  1,
  '180 minutes',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Pharm
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-005-L4' LIMIT 1),
  'B.Pharm',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Pharm Pharmaceutical Biotechnology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-005-L4' LIMIT 1),
  'M.Pharm Pharmaceutical Biotechnology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Biotechnology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-005-L4' LIMIT 1),
  'B.Sc Biotechnology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Sc Biotechnology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-005-L4' LIMIT 1),
  'M.Sc Biotechnology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech Biotechnology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-005-L4' LIMIT 1),
  'B.Tech Biotechnology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Vaccine Lot QC, Temperature-Excursion and Cold-Chain Release Packet Control - - Readiness Packet and Decision Support
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Vaccine Lot QC, Temperature-Excursion and Cold-Chain Release Packet Control - - Readiness Packet and Decision Support',
  'COURSE-CAP-006-L4',
  'A readiness review for Vaccine Lot QC, Temperature-Excursion and Cold-Chain Release Packet Control - is blocked. The pack has 22 evidence items, but 1 acceptance criterion is missing, 2 source references are unresolved, and the reviewer cannot close the decision-support pack. Course objective: Map Vaccine Lot QC, Temperature-Excursion and Cold-Chain Release Packet Control - evidence against acceptance criteria; show readiness gaps; prepare a decision-support packet; document reviewer blockers. Learner outcome: Learner can build a Vaccine Lot QC, Temperature-Excursion and Cold-Chain Release Packet Control - readiness packet that supports review when acceptance criteria or source evidence are incomplete.',
  '12 hours',
  'Active',
  'Pharma / Biotech / MedTech',
  'technical',
  '["Map Vaccine Lot QC, Temperature-Excursion and Cold-Chain Release Packet Control - evidence against acceptance criteria; show readiness gaps; prepare a decision-support packet; document reviewer blockers.","Learner can build a Vaccine Lot QC, Temperature-Excursion and Cold-Chain Release Packet Control - readiness packet that supports review when acceptance criteria or source evidence are incomplete.","Create Vaccine Lot QC, Temperature-Excursion and Cold-Chain Release Packet Control - readiness and decision-support packet","Assess evidence using: Acceptance-criteria coverage; readiness confidence; unresolved-source visibility; reviewer blocker explanation; decision-support quality."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L4: Readiness Packet and Decision Support - CAP-006
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-006-L4' LIMIT 1),
  'L4: Readiness Packet and Decision Support - CAP-006',
  'A review meeting is due in 24 hours. The Vaccine Lot QC, Temperature-Excursion and Cold-Chain Release Packet Control - readiness pack cannot be closed because one acceptance criterion is missing and 2 source records are unresolved. You prepare a decision-support packet that shows what is ready, what is blocked, who owns it, and what must happen next. Required data: Vaccine Lot QC, Temperature-Excursion and Cold-Chain Release Packet Control - readiness pack; 22 evidence items; 2 unresolved source references; 1 missing acceptance criterion; 1 reviewer hold comment; decision-support template.',
  1,
  '["Pharma / Biotech / MedTech","Biological Product, Vaccine and Biosimilar Operations","D-002","CAP-006","L4","Functional; Cognitive; Evidence; Communication; Compliance"]'::jsonb,
  '["Scenario Review","Evidence Check","Artifact Build","AI Coaching","Human Review","Retry and Improve","Portfolio Submission"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Vaccine Lot QC, Temperature-Excursion and Cold-Chain Release Packet Control - readiness and decision-support packet Practice
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-006-L4' LIMIT 1)
   AND title = 'L4: Readiness Packet and Decision Support - CAP-006' LIMIT 1),
  'Vaccine Lot QC, Temperature-Excursion and Cold-Chain Release Packet Control - readiness and decision-support packet Practice',
  'Complete the Vaccine Lot QC, Temperature-Excursion and Cold-Chain Release Packet Control - readiness and decision-support packet using the provided actuals and explain the evidence decision in simple workplace language.',
  'Workplace scenario: A review meeting is due in 24 hours. The Vaccine Lot QC, Temperature-Excursion and Cold-Chain Release Packet Control - readiness pack cannot be closed because one acceptance criterion is missing and 2 source records are unresolved. You prepare a decision-support packet that shows what is ready, what is blocked, who owns it, and what must happen next. Major concepts: Vaccine Lot QC, Temperature-Excursion and Cold-Chain Release Packet Control - readiness assessment; acceptance-criteria mapping; decision-support packet logic; blocker summary; reviewer hold resolution; evidence confidence rating. Artifact structure: Sections: readiness summary; acceptance-criteria map; unresolved source references; reviewer hold note; decision-support recommendation; next action. Evidence to assess: Acceptance-criteria coverage; readiness confidence; unresolved-source visibility; reviewer blocker explanation; decision-support quality. AI support: Use AI to summarize readiness blockers and test whether the decision-support packet is clear to a reviewer.',
  1,
  '180 minutes',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Pharm
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-006-L4' LIMIT 1),
  'B.Pharm',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Pharm Pharmaceutical Biotechnology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-006-L4' LIMIT 1),
  'M.Pharm Pharmaceutical Biotechnology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Biotechnology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-006-L4' LIMIT 1),
  'B.Sc Biotechnology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Sc Microbiology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-006-L4' LIMIT 1),
  'M.Sc Microbiology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Microbiology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-006-L4' LIMIT 1),
  'B.Sc Microbiology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Advanced Biopharma Evidence Inventory and Authority-Boundary Triage - Readiness Packet and Decision Support
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Advanced Biopharma Evidence Inventory and Authority-Boundary Triage - Readiness Packet and Decision Support',
  'COURSE-CAP-007-L4',
  'A readiness review for Advanced Biopharma Evidence Inventory and Authority-Boundary Triage is blocked. The pack has 22 evidence items, but 1 acceptance criterion is missing, 2 source references are unresolved, and the reviewer cannot close the decision-support pack. Course objective: Map Advanced Biopharma Evidence Inventory and Authority-Boundary Triage evidence against acceptance criteria; show readiness gaps; prepare a decision-support packet; document reviewer blockers. Learner outcome: Learner can build an Advanced Biopharma Evidence Inventory and Authority-Boundary Triage readiness packet that supports review when acceptance criteria or source evidence are incomplete.',
  '12 hours',
  'Active',
  'Pharma / Biotech / MedTech',
  'technical',
  '["Map Advanced Biopharma Evidence Inventory and Authority-Boundary Triage evidence against acceptance criteria; show readiness gaps; prepare a decision-support packet; document reviewer blockers.","Learner can build an Advanced Biopharma Evidence Inventory and Authority-Boundary Triage readiness packet that supports review when acceptance criteria or source evidence are incomplete.","Create Advanced Biopharma Evidence Inventory and Authority-Boundary Triage readiness and decision-support packet","Assess evidence using: Acceptance-criteria coverage; readiness confidence; unresolved-source visibility; reviewer blocker explanation; decision-support quality."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L4: Readiness Packet and Decision Support - CAP-007
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-007-L4' LIMIT 1),
  'L4: Readiness Packet and Decision Support - CAP-007',
  'A review meeting is due in 24 hours. The Advanced Biopharma Evidence Inventory and Authority-Boundary Triage readiness pack cannot be closed because one acceptance criterion is missing and 2 source records are unresolved. You prepare a decision-support packet that shows what is ready, what is blocked, who owns it, and what must happen next. Required data: Advanced Biopharma Evidence Inventory and Authority-Boundary Triage readiness pack; 22 evidence items; 2 unresolved source references; 1 missing acceptance criterion; 1 reviewer hold comment; decision-support template.',
  1,
  '["Pharma / Biotech / MedTech","Advanced Biopharma Evidence Inventory and Boundary Triage","D-002","CAP-007","L4","Functional; Cognitive; Evidence; Communication; Compliance"]'::jsonb,
  '["Scenario Review","Evidence Check","Artifact Build","AI Coaching","Human Review","Retry and Improve","Portfolio Submission"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Advanced Biopharma Evidence Inventory and Authority-Boundary Triage readiness and decision-support packet Practice
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-007-L4' LIMIT 1)
   AND title = 'L4: Readiness Packet and Decision Support - CAP-007' LIMIT 1),
  'Advanced Biopharma Evidence Inventory and Authority-Boundary Triage readiness and decision-support packet Practice',
  'Complete the Advanced Biopharma Evidence Inventory and Authority-Boundary Triage readiness and decision-support packet using the provided actuals and explain the evidence decision in simple workplace language.',
  'Workplace scenario: A review meeting is due in 24 hours. The Advanced Biopharma Evidence Inventory and Authority-Boundary Triage readiness pack cannot be closed because one acceptance criterion is missing and 2 source records are unresolved. You prepare a decision-support packet that shows what is ready, what is blocked, who owns it, and what must happen next. Major concepts: Advanced Biopharma Evidence Inventory and Authority-Boundary Triage readiness assessment; acceptance-criteria mapping; decision-support packet logic; blocker summary; reviewer hold resolution; evidence confidence rating. Artifact structure: Sections: readiness summary; acceptance-criteria map; unresolved source references; reviewer hold note; decision-support recommendation; next action. Evidence to assess: Acceptance-criteria coverage; readiness confidence; unresolved-source visibility; reviewer blocker explanation; decision-support quality. AI support: Use AI to summarize readiness blockers and test whether the decision-support packet is clear to a reviewer.',
  1,
  '180 minutes',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Pharm
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-007-L4' LIMIT 1),
  'B.Pharm',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Pharm Pharmaceutical Biotechnology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-007-L4' LIMIT 1),
  'M.Pharm Pharmaceutical Biotechnology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Biotechnology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-007-L4' LIMIT 1),
  'B.Sc Biotechnology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Sc Biotechnology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-007-L4' LIMIT 1),
  'M.Sc Biotechnology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech Biotechnology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-007-L4' LIMIT 1),
  'B.Tech Biotechnology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Clinical Trial Startup Records and Monitoring Action Evidence Control - Readiness Packet and Decision Support
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Clinical Trial Startup Records and Monitoring Action Evidence Control - Readiness Packet and Decision Support',
  'COURSE-CAP-008-L4',
  'A readiness review for Clinical Trial Startup Records and Monitoring Action Evidence Control is blocked. The pack has 22 evidence items, but 1 acceptance criterion is missing, 2 source references are unresolved, and the reviewer cannot close the decision-support pack. Course objective: Map Clinical Trial Startup Records and Monitoring Action Evidence Control evidence against acceptance criteria; show readiness gaps; prepare a decision-support packet; document reviewer blockers. Learner outcome: Learner can build a Clinical Trial Startup Records and Monitoring Action Evidence Control readiness packet that supports review when acceptance criteria or source evidence are incomplete.',
  '12 hours',
  'Active',
  'Pharma / Biotech / MedTech',
  'technical',
  '["Map Clinical Trial Startup Records and Monitoring Action Evidence Control evidence against acceptance criteria; show readiness gaps; prepare a decision-support packet; document reviewer blockers.","Learner can build a Clinical Trial Startup Records and Monitoring Action Evidence Control readiness packet that supports review when acceptance criteria or source evidence are incomplete.","Create Clinical Trial Startup Records and Monitoring Action Evidence Control readiness and decision-support packet","Assess evidence using: Acceptance-criteria coverage; readiness confidence; unresolved-source visibility; reviewer blocker explanation; decision-support quality."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L4: Readiness Packet and Decision Support - CAP-008
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-008-L4' LIMIT 1),
  'L4: Readiness Packet and Decision Support - CAP-008',
  'A review meeting is due in 24 hours. The Clinical Trial Startup Records and Monitoring Action Evidence Control readiness pack cannot be closed because one acceptance criterion is missing and 2 source records are unresolved. You prepare a decision-support packet that shows what is ready, what is blocked, who owns it, and what must happen next. Required data: Clinical Trial Startup Records and Monitoring Action Evidence Control readiness pack; 22 evidence items; 2 unresolved source references; 1 missing acceptance criterion; 1 reviewer hold comment; decision-support template.',
  1,
  '["Pharma / Biotech / MedTech","Clinical Operations and Trial Startup Support","D-003","CAP-008","L4","Functional; Cognitive; Evidence; Communication; Compliance"]'::jsonb,
  '["Scenario Review","Evidence Check","Artifact Build","AI Coaching","Human Review","Retry and Improve","Portfolio Submission"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Clinical Trial Startup Records and Monitoring Action Evidence Control readiness and decision-support packet Practice
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-008-L4' LIMIT 1)
   AND title = 'L4: Readiness Packet and Decision Support - CAP-008' LIMIT 1),
  'Clinical Trial Startup Records and Monitoring Action Evidence Control readiness and decision-support packet Practice',
  'Complete the Clinical Trial Startup Records and Monitoring Action Evidence Control readiness and decision-support packet using the provided actuals and explain the evidence decision in simple workplace language.',
  'Workplace scenario: A review meeting is due in 24 hours. The Clinical Trial Startup Records and Monitoring Action Evidence Control readiness pack cannot be closed because one acceptance criterion is missing and 2 source records are unresolved. You prepare a decision-support packet that shows what is ready, what is blocked, who owns it, and what must happen next. Major concepts: Clinical Trial Startup Records and Monitoring Action Evidence Control readiness assessment; acceptance-criteria mapping; decision-support packet logic; blocker summary; reviewer hold resolution; evidence confidence rating. Artifact structure: Sections: readiness summary; acceptance-criteria map; unresolved source references; reviewer hold note; decision-support recommendation; next action. Evidence to assess: Acceptance-criteria coverage; readiness confidence; unresolved-source visibility; reviewer blocker explanation; decision-support quality. AI support: Use AI to summarize readiness blockers and test whether the decision-support packet is clear to a reviewer.',
  1,
  '180 minutes',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Pharm
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-008-L4' LIMIT 1),
  'B.Pharm',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: Pharm.D
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-008-L4' LIMIT 1),
  'Pharm.D',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Clinical Research
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-008-L4' LIMIT 1),
  'B.Sc Clinical Research',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Sc Clinical Research
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-008-L4' LIMIT 1),
  'M.Sc Clinical Research',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Life Sciences
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-008-L4' LIMIT 1),
  'B.Sc Life Sciences',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Pharmacovigilance ICSR and Safety Evidence Handling - Readiness Packet and Decision Support
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Pharmacovigilance ICSR and Safety Evidence Handling - Readiness Packet and Decision Support',
  'COURSE-CAP-009-L4',
  'A readiness review for Pharmacovigilance ICSR and Safety Evidence Handling is blocked. The pack has 22 evidence items, but 1 acceptance criterion is missing, 2 source references are unresolved, and the reviewer cannot close the decision-support pack. Course objective: Map Pharmacovigilance ICSR and Safety Evidence Handling evidence against acceptance criteria; show readiness gaps; prepare a decision-support packet; document reviewer blockers. Learner outcome: Learner can build a Pharmacovigilance ICSR and Safety Evidence Handling readiness packet that supports review when acceptance criteria or source evidence are incomplete.',
  '12 hours',
  'Active',
  'Pharma / Biotech / MedTech',
  'technical',
  '["Map Pharmacovigilance ICSR and Safety Evidence Handling evidence against acceptance criteria; show readiness gaps; prepare a decision-support packet; document reviewer blockers.","Learner can build a Pharmacovigilance ICSR and Safety Evidence Handling readiness packet that supports review when acceptance criteria or source evidence are incomplete.","Create Pharmacovigilance ICSR and Safety Evidence Handling readiness and decision-support packet","Assess evidence using: Acceptance-criteria coverage; readiness confidence; unresolved-source visibility; reviewer blocker explanation; decision-support quality."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L4: Readiness Packet and Decision Support - CAP-009
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-009-L4' LIMIT 1),
  'L4: Readiness Packet and Decision Support - CAP-009',
  'A review meeting is due in 24 hours. The Pharmacovigilance ICSR and Safety Evidence Handling readiness pack cannot be closed because one acceptance criterion is missing and 2 source records are unresolved. You prepare a decision-support packet that shows what is ready, what is blocked, who owns it, and what must happen next. Required data: Pharmacovigilance ICSR and Safety Evidence Handling readiness pack; 22 evidence items; 2 unresolved source references; 1 missing acceptance criterion; 1 reviewer hold comment; decision-support template.',
  1,
  '["Pharma / Biotech / MedTech","Pharmacovigilance and Medical Safety Evidence Operations","D-003","CAP-009","L4","Functional; Cognitive; Evidence; Communication; Compliance"]'::jsonb,
  '["Scenario Review","Evidence Check","Artifact Build","AI Coaching","Human Review","Retry and Improve","Portfolio Submission"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Pharmacovigilance ICSR and Safety Evidence Handling readiness and decision-support packet Practice
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-009-L4' LIMIT 1)
   AND title = 'L4: Readiness Packet and Decision Support - CAP-009' LIMIT 1),
  'Pharmacovigilance ICSR and Safety Evidence Handling readiness and decision-support packet Practice',
  'Complete the Pharmacovigilance ICSR and Safety Evidence Handling readiness and decision-support packet using the provided actuals and explain the evidence decision in simple workplace language.',
  'Workplace scenario: A review meeting is due in 24 hours. The Pharmacovigilance ICSR and Safety Evidence Handling readiness pack cannot be closed because one acceptance criterion is missing and 2 source records are unresolved. You prepare a decision-support packet that shows what is ready, what is blocked, who owns it, and what must happen next. Major concepts: Pharmacovigilance ICSR and Safety Evidence Handling readiness assessment; acceptance-criteria mapping; decision-support packet logic; blocker summary; reviewer hold resolution; evidence confidence rating. Artifact structure: Sections: readiness summary; acceptance-criteria map; unresolved source references; reviewer hold note; decision-support recommendation; next action. Evidence to assess: Acceptance-criteria coverage; readiness confidence; unresolved-source visibility; reviewer blocker explanation; decision-support quality. AI support: Use AI to summarize readiness blockers and test whether the decision-support packet is clear to a reviewer.',
  1,
  '180 minutes',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Pharm
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-009-L4' LIMIT 1),
  'B.Pharm',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: Pharm.D
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-009-L4' LIMIT 1),
  'Pharm.D',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Pharm Pharmacology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-009-L4' LIMIT 1),
  'M.Pharm Pharmacology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Life Sciences
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-009-L4' LIMIT 1),
  'B.Sc Life Sciences',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Sc Pharmacology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-009-L4' LIMIT 1),
  'M.Sc Pharmacology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Clinical Dataset Mapping, Query Reconciliation and Data-Lock Packet Control - - Readiness Packet and Decision Support
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Clinical Dataset Mapping, Query Reconciliation and Data-Lock Packet Control - - Readiness Packet and Decision Support',
  'COURSE-CAP-010-L4',
  'A readiness review for Clinical Dataset Mapping, Query Reconciliation and Data-Lock Packet Control - is blocked. The pack has 22 evidence items, but 1 acceptance criterion is missing, 2 source references are unresolved, and the reviewer cannot close the decision-support pack. Course objective: Map Clinical Dataset Mapping, Query Reconciliation and Data-Lock Packet Control - evidence against acceptance criteria; show readiness gaps; prepare a decision-support packet; document reviewer blockers. Learner outcome: Learner can build a Clinical Dataset Mapping, Query Reconciliation and Data-Lock Packet Control - readiness packet that supports review when acceptance criteria or source evidence are incomplete.',
  '12 hours',
  'Active',
  'Pharma / Biotech / MedTech',
  'technical',
  '["Map Clinical Dataset Mapping, Query Reconciliation and Data-Lock Packet Control - evidence against acceptance criteria; show readiness gaps; prepare a decision-support packet; document reviewer blockers.","Learner can build a Clinical Dataset Mapping, Query Reconciliation and Data-Lock Packet Control - readiness packet that supports review when acceptance criteria or source evidence are incomplete.","Create Clinical Dataset Mapping, Query Reconciliation and Data-Lock Packet Control - readiness and decision-support packet","Assess evidence using: Acceptance-criteria coverage; readiness confidence; unresolved-source visibility; reviewer blocker explanation; decision-support quality."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L4: Readiness Packet and Decision Support - CAP-010
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-010-L4' LIMIT 1),
  'L4: Readiness Packet and Decision Support - CAP-010',
  'A review meeting is due in 24 hours. The Clinical Dataset Mapping, Query Reconciliation and Data-Lock Packet Control - readiness pack cannot be closed because one acceptance criterion is missing and 2 source records are unresolved. You prepare a decision-support packet that shows what is ready, what is blocked, who owns it, and what must happen next. Required data: Clinical Dataset Mapping, Query Reconciliation and Data-Lock Packet Control - readiness pack; 22 evidence items; 2 unresolved source references; 1 missing acceptance criterion; 1 reviewer hold comment; decision-support template.',
  1,
  '["Pharma / Biotech / MedTech","Clinical Documentation and Data Services Support","D-003","CAP-010","L4","Functional; Cognitive; Evidence; Communication; Compliance"]'::jsonb,
  '["Scenario Review","Evidence Check","Artifact Build","AI Coaching","Human Review","Retry and Improve","Portfolio Submission"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Clinical Dataset Mapping, Query Reconciliation and Data-Lock Packet Control - readiness and decision-support packet Practice
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-010-L4' LIMIT 1)
   AND title = 'L4: Readiness Packet and Decision Support - CAP-010' LIMIT 1),
  'Clinical Dataset Mapping, Query Reconciliation and Data-Lock Packet Control - readiness and decision-support packet Practice',
  'Complete the Clinical Dataset Mapping, Query Reconciliation and Data-Lock Packet Control - readiness and decision-support packet using the provided actuals and explain the evidence decision in simple workplace language.',
  'Workplace scenario: A review meeting is due in 24 hours. The Clinical Dataset Mapping, Query Reconciliation and Data-Lock Packet Control - readiness pack cannot be closed because one acceptance criterion is missing and 2 source records are unresolved. You prepare a decision-support packet that shows what is ready, what is blocked, who owns it, and what must happen next. Major concepts: Clinical Dataset Mapping, Query Reconciliation and Data-Lock Packet Control - readiness assessment; acceptance-criteria mapping; decision-support packet logic; blocker summary; reviewer hold resolution; evidence confidence rating. Artifact structure: Sections: readiness summary; acceptance-criteria map; unresolved source references; reviewer hold note; decision-support recommendation; next action. Evidence to assess: Acceptance-criteria coverage; readiness confidence; unresolved-source visibility; reviewer blocker explanation; decision-support quality. AI support: Use AI to summarize readiness blockers and test whether the decision-support packet is clear to a reviewer.',
  1,
  '180 minutes',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Pharm
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-010-L4' LIMIT 1),
  'B.Pharm',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Clinical Research
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-010-L4' LIMIT 1),
  'B.Sc Clinical Research',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Statistics
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-010-L4' LIMIT 1),
  'B.Sc Statistics',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Life Sciences
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-010-L4' LIMIT 1),
  'B.Sc Life Sciences',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Sc Clinical Data Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-010-L4' LIMIT 1),
  'M.Sc Clinical Data Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: NGS Run QC, Variant Calling and Genomics Reporting - Readiness Packet and Decision Support
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'NGS Run QC, Variant Calling and Genomics Reporting - Readiness Packet and Decision Support',
  'COURSE-CAP-011-L4',
  'A readiness review for NGS Run QC, Variant Calling and Genomics Reporting is blocked. The pack has 22 evidence items, but 1 acceptance criterion is missing, 2 source references are unresolved, and the reviewer cannot close the decision-support pack. Course objective: Map NGS Run QC, Variant Calling and Genomics Reporting evidence against acceptance criteria; show readiness gaps; prepare a decision-support packet; document reviewer blockers. Learner outcome: Learner can build an NGS Run QC, Variant Calling and Genomics Reporting readiness packet that supports review when acceptance criteria or source evidence are incomplete.',
  '12 hours',
  'Active',
  'Pharma / Biotech / MedTech',
  'technical',
  '["Map NGS Run QC, Variant Calling and Genomics Reporting evidence against acceptance criteria; show readiness gaps; prepare a decision-support packet; document reviewer blockers.","Learner can build an NGS Run QC, Variant Calling and Genomics Reporting readiness packet that supports review when acceptance criteria or source evidence are incomplete.","Create NGS Run QC, Variant Calling and Genomics Reporting readiness and decision-support packet","Assess evidence using: Acceptance-criteria coverage; readiness confidence; unresolved-source visibility; reviewer blocker explanation; decision-support quality."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L4: Readiness Packet and Decision Support - CAP-011
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-011-L4' LIMIT 1),
  'L4: Readiness Packet and Decision Support - CAP-011',
  'A review meeting is due in 24 hours. The NGS Run QC, Variant Calling and Genomics Reporting readiness pack cannot be closed because one acceptance criterion is missing and 2 source records are unresolved. You prepare a decision-support packet that shows what is ready, what is blocked, who owns it, and what must happen next. Required data: NGS Run QC, Variant Calling and Genomics Reporting readiness pack; 22 evidence items; 2 unresolved source references; 1 missing acceptance criterion; 1 reviewer hold comment; decision-support template.',
  1,
  '["Pharma / Biotech / MedTech","Bioinformatics and Genomics Analysis Services","D-004","CAP-011","L4","Functional; Cognitive; Evidence; Communication; Compliance"]'::jsonb,
  '["Scenario Review","Evidence Check","Artifact Build","AI Coaching","Human Review","Retry and Improve","Portfolio Submission"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: NGS Run QC, Variant Calling and Genomics Reporting readiness and decision-support packet Practice
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-011-L4' LIMIT 1)
   AND title = 'L4: Readiness Packet and Decision Support - CAP-011' LIMIT 1),
  'NGS Run QC, Variant Calling and Genomics Reporting readiness and decision-support packet Practice',
  'Complete the NGS Run QC, Variant Calling and Genomics Reporting readiness and decision-support packet using the provided actuals and explain the evidence decision in simple workplace language.',
  'Workplace scenario: A review meeting is due in 24 hours. The NGS Run QC, Variant Calling and Genomics Reporting readiness pack cannot be closed because one acceptance criterion is missing and 2 source records are unresolved. You prepare a decision-support packet that shows what is ready, what is blocked, who owns it, and what must happen next. Major concepts: NGS Run QC, Variant Calling and Genomics Reporting readiness assessment; acceptance-criteria mapping; decision-support packet logic; blocker summary; reviewer hold resolution; evidence confidence rating. Artifact structure: Sections: readiness summary; acceptance-criteria map; unresolved source references; reviewer hold note; decision-support recommendation; next action. Evidence to assess: Acceptance-criteria coverage; readiness confidence; unresolved-source visibility; reviewer blocker explanation; decision-support quality. AI support: Use AI to summarize readiness blockers and test whether the decision-support packet is clear to a reviewer.',
  1,
  '180 minutes',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Bioinformatics
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-011-L4' LIMIT 1),
  'B.Sc Bioinformatics',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Sc Bioinformatics
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-011-L4' LIMIT 1),
  'M.Sc Bioinformatics',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech Biotechnology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-011-L4' LIMIT 1),
  'B.Tech Biotechnology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Biotechnology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-011-L4' LIMIT 1),
  'B.Sc Biotechnology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Sc Genomics
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-011-L4' LIMIT 1),
  'M.Sc Genomics',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Bioservices Sample Result, Assay Run and Research Tool Lot Evidence Control - - Readiness Packet and Decision Support
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Bioservices Sample Result, Assay Run and Research Tool Lot Evidence Control - - Readiness Packet and Decision Support',
  'COURSE-CAP-012-L4',
  'A readiness review for Bioservices Sample Result, Assay Run and Research Tool Lot Evidence Control - is blocked. The pack has 22 evidence items, but 1 acceptance criterion is missing, 2 source references are unresolved, and the reviewer cannot close the decision-support pack. Course objective: Map Bioservices Sample Result, Assay Run and Research Tool Lot Evidence Control - evidence against acceptance criteria; show readiness gaps; prepare a decision-support packet; document reviewer blockers. Learner outcome: Learner can build a Bioservices Sample Result, Assay Run and Research Tool Lot Evidence Control - readiness packet that supports review when acceptance criteria or source evidence are incomplete.',
  '12 hours',
  'Active',
  'Pharma / Biotech / MedTech',
  'technical',
  '["Map Bioservices Sample Result, Assay Run and Research Tool Lot Evidence Control - evidence against acceptance criteria; show readiness gaps; prepare a decision-support packet; document reviewer blockers.","Learner can build a Bioservices Sample Result, Assay Run and Research Tool Lot Evidence Control - readiness packet that supports review when acceptance criteria or source evidence are incomplete.","Create Bioservices Sample Result, Assay Run and Research Tool Lot Evidence Control - readiness and decision-support packet","Assess evidence using: Acceptance-criteria coverage; readiness confidence; unresolved-source visibility; reviewer blocker explanation; decision-support quality."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L4: Readiness Packet and Decision Support - CAP-012
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-012-L4' LIMIT 1),
  'L4: Readiness Packet and Decision Support - CAP-012',
  'A review meeting is due in 24 hours. The Bioservices Sample Result, Assay Run and Research Tool Lot Evidence Control - readiness pack cannot be closed because one acceptance criterion is missing and 2 source records are unresolved. You prepare a decision-support packet that shows what is ready, what is blocked, who owns it, and what must happen next. Required data: Bioservices Sample Result, Assay Run and Research Tool Lot Evidence Control - readiness pack; 22 evidence items; 2 unresolved source references; 1 missing acceptance criterion; 1 reviewer hold comment; decision-support template.',
  1,
  '["Pharma / Biotech / MedTech","Wet-Lab Bioservices and Research Tool Support","D-004","CAP-012","L4","Functional; Cognitive; Evidence; Communication; Compliance"]'::jsonb,
  '["Scenario Review","Evidence Check","Artifact Build","AI Coaching","Human Review","Retry and Improve","Portfolio Submission"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Bioservices Sample Result, Assay Run and Research Tool Lot Evidence Control - readiness and decision-support packet Practice
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-012-L4' LIMIT 1)
   AND title = 'L4: Readiness Packet and Decision Support - CAP-012' LIMIT 1),
  'Bioservices Sample Result, Assay Run and Research Tool Lot Evidence Control - readiness and decision-support packet Practice',
  'Complete the Bioservices Sample Result, Assay Run and Research Tool Lot Evidence Control - readiness and decision-support packet using the provided actuals and explain the evidence decision in simple workplace language.',
  'Workplace scenario: A review meeting is due in 24 hours. The Bioservices Sample Result, Assay Run and Research Tool Lot Evidence Control - readiness pack cannot be closed because one acceptance criterion is missing and 2 source records are unresolved. You prepare a decision-support packet that shows what is ready, what is blocked, who owns it, and what must happen next. Major concepts: Bioservices Sample Result, Assay Run and Research Tool Lot Evidence Control - readiness assessment; acceptance-criteria mapping; decision-support packet logic; blocker summary; reviewer hold resolution; evidence confidence rating. Artifact structure: Sections: readiness summary; acceptance-criteria map; unresolved source references; reviewer hold note; decision-support recommendation; next action. Evidence to assess: Acceptance-criteria coverage; readiness confidence; unresolved-source visibility; reviewer blocker explanation; decision-support quality. AI support: Use AI to summarize readiness blockers and test whether the decision-support packet is clear to a reviewer.',
  1,
  '180 minutes',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Biotechnology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-012-L4' LIMIT 1),
  'B.Sc Biotechnology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Sc Biotechnology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-012-L4' LIMIT 1),
  'M.Sc Biotechnology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Microbiology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-012-L4' LIMIT 1),
  'B.Sc Microbiology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Sc Biochemistry
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-012-L4' LIMIT 1),
  'M.Sc Biochemistry',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Life Sciences
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-012-L4' LIMIT 1),
  'B.Sc Life Sciences',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Biofoundry DBTL Cycle Evidence Execution - Readiness Packet and Decision Support
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Biofoundry DBTL Cycle Evidence Execution - Readiness Packet and Decision Support',
  'COURSE-CAP-013-L4',
  'A readiness review for Biofoundry DBTL Cycle Evidence Execution is blocked. The pack has 22 evidence items, but 1 acceptance criterion is missing, 2 source references are unresolved, and the reviewer cannot close the decision-support pack. Course objective: Map Biofoundry DBTL Cycle Evidence Execution evidence against acceptance criteria; show readiness gaps; prepare a decision-support packet; document reviewer blockers. Learner outcome: Learner can build a Biofoundry DBTL Cycle Evidence Execution readiness packet that supports review when acceptance criteria or source evidence are incomplete.',
  '12 hours',
  'Active',
  'Pharma / Biotech / MedTech',
  'technical',
  '["Map Biofoundry DBTL Cycle Evidence Execution evidence against acceptance criteria; show readiness gaps; prepare a decision-support packet; document reviewer blockers.","Learner can build a Biofoundry DBTL Cycle Evidence Execution readiness packet that supports review when acceptance criteria or source evidence are incomplete.","Create Biofoundry DBTL Cycle Evidence Execution readiness and decision-support packet","Assess evidence using: Acceptance-criteria coverage; readiness confidence; unresolved-source visibility; reviewer blocker explanation; decision-support quality."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L4: Readiness Packet and Decision Support - CAP-013
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-013-L4' LIMIT 1),
  'L4: Readiness Packet and Decision Support - CAP-013',
  'A review meeting is due in 24 hours. The Biofoundry DBTL Cycle Evidence Execution readiness pack cannot be closed because one acceptance criterion is missing and 2 source records are unresolved. You prepare a decision-support packet that shows what is ready, what is blocked, who owns it, and what must happen next. Required data: Biofoundry DBTL Cycle Evidence Execution readiness pack; 22 evidence items; 2 unresolved source references; 1 missing acceptance criterion; 1 reviewer hold comment; decision-support template.',
  1,
  '["Pharma / Biotech / MedTech","Industrial Biomanufacturing and Biofoundry Operations","D-005","CAP-013","L4","Functional; Cognitive; Evidence; Communication; Compliance"]'::jsonb,
  '["Scenario Review","Evidence Check","Artifact Build","AI Coaching","Human Review","Retry and Improve","Portfolio Submission"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Biofoundry DBTL Cycle Evidence Execution readiness and decision-support packet Practice
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-013-L4' LIMIT 1)
   AND title = 'L4: Readiness Packet and Decision Support - CAP-013' LIMIT 1),
  'Biofoundry DBTL Cycle Evidence Execution readiness and decision-support packet Practice',
  'Complete the Biofoundry DBTL Cycle Evidence Execution readiness and decision-support packet using the provided actuals and explain the evidence decision in simple workplace language.',
  'Workplace scenario: A review meeting is due in 24 hours. The Biofoundry DBTL Cycle Evidence Execution readiness pack cannot be closed because one acceptance criterion is missing and 2 source records are unresolved. You prepare a decision-support packet that shows what is ready, what is blocked, who owns it, and what must happen next. Major concepts: Biofoundry DBTL Cycle Evidence Execution readiness assessment; acceptance-criteria mapping; decision-support packet logic; blocker summary; reviewer hold resolution; evidence confidence rating. Artifact structure: Sections: readiness summary; acceptance-criteria map; unresolved source references; reviewer hold note; decision-support recommendation; next action. Evidence to assess: Acceptance-criteria coverage; readiness confidence; unresolved-source visibility; reviewer blocker explanation; decision-support quality. AI support: Use AI to summarize readiness blockers and test whether the decision-support packet is clear to a reviewer.',
  1,
  '180 minutes',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech Biotechnology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-013-L4' LIMIT 1),
  'B.Tech Biotechnology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Tech Biotechnology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-013-L4' LIMIT 1),
  'M.Tech Biotechnology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Biotechnology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-013-L4' LIMIT 1),
  'B.Sc Biotechnology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Sc Synthetic Biology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-013-L4' LIMIT 1),
  'M.Sc Synthetic Biology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Sc Industrial Biotechnology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-013-L4' LIMIT 1),
  'M.Sc Industrial Biotechnology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Industrial Bioprocess Scale-Up and Product Evidence Handoff - Readiness Packet and Decision Support
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Industrial Bioprocess Scale-Up and Product Evidence Handoff - Readiness Packet and Decision Support',
  'COURSE-CAP-014-L4',
  'A readiness review for Industrial Bioprocess Scale-Up and Product Evidence Handoff is blocked. The pack has 22 evidence items, but 1 acceptance criterion is missing, 2 source references are unresolved, and the reviewer cannot close the decision-support pack. Course objective: Map Industrial Bioprocess Scale-Up and Product Evidence Handoff evidence against acceptance criteria; show readiness gaps; prepare a decision-support packet; document reviewer blockers. Learner outcome: Learner can build an Industrial Bioprocess Scale-Up and Product Evidence Handoff readiness packet that supports review when acceptance criteria or source evidence are incomplete.',
  '12 hours',
  'Active',
  'Pharma / Biotech / MedTech',
  'technical',
  '["Map Industrial Bioprocess Scale-Up and Product Evidence Handoff evidence against acceptance criteria; show readiness gaps; prepare a decision-support packet; document reviewer blockers.","Learner can build an Industrial Bioprocess Scale-Up and Product Evidence Handoff readiness packet that supports review when acceptance criteria or source evidence are incomplete.","Create Industrial Bioprocess Scale-Up and Product Evidence Handoff readiness and decision-support packet","Assess evidence using: Acceptance-criteria coverage; readiness confidence; unresolved-source visibility; reviewer blocker explanation; decision-support quality."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L4: Readiness Packet and Decision Support - CAP-014
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-014-L4' LIMIT 1),
  'L4: Readiness Packet and Decision Support - CAP-014',
  'A review meeting is due in 24 hours. The Industrial Bioprocess Scale-Up and Product Evidence Handoff readiness pack cannot be closed because one acceptance criterion is missing and 2 source records are unresolved. You prepare a decision-support packet that shows what is ready, what is blocked, who owns it, and what must happen next. Required data: Industrial Bioprocess Scale-Up and Product Evidence Handoff readiness pack; 22 evidence items; 2 unresolved source references; 1 missing acceptance criterion; 1 reviewer hold comment; decision-support template.',
  1,
  '["Pharma / Biotech / MedTech","Industrial Biomanufacturing and Biofoundry Operations","D-005","CAP-014","L4","Functional; Cognitive; Evidence; Communication; Compliance"]'::jsonb,
  '["Scenario Review","Evidence Check","Artifact Build","AI Coaching","Human Review","Retry and Improve","Portfolio Submission"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Industrial Bioprocess Scale-Up and Product Evidence Handoff readiness and decision-support packet Practice
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-014-L4' LIMIT 1)
   AND title = 'L4: Readiness Packet and Decision Support - CAP-014' LIMIT 1),
  'Industrial Bioprocess Scale-Up and Product Evidence Handoff readiness and decision-support packet Practice',
  'Complete the Industrial Bioprocess Scale-Up and Product Evidence Handoff readiness and decision-support packet using the provided actuals and explain the evidence decision in simple workplace language.',
  'Workplace scenario: A review meeting is due in 24 hours. The Industrial Bioprocess Scale-Up and Product Evidence Handoff readiness pack cannot be closed because one acceptance criterion is missing and 2 source records are unresolved. You prepare a decision-support packet that shows what is ready, what is blocked, who owns it, and what must happen next. Major concepts: Industrial Bioprocess Scale-Up and Product Evidence Handoff readiness assessment; acceptance-criteria mapping; decision-support packet logic; blocker summary; reviewer hold resolution; evidence confidence rating. Artifact structure: Sections: readiness summary; acceptance-criteria map; unresolved source references; reviewer hold note; decision-support recommendation; next action. Evidence to assess: Acceptance-criteria coverage; readiness confidence; unresolved-source visibility; reviewer blocker explanation; decision-support quality. AI support: Use AI to summarize readiness blockers and test whether the decision-support packet is clear to a reviewer.',
  1,
  '180 minutes',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech Biotechnology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-014-L4' LIMIT 1),
  'B.Tech Biotechnology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Tech Bioprocess Engineering
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-014-L4' LIMIT 1),
  'M.Tech Bioprocess Engineering',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Biotechnology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-014-L4' LIMIT 1),
  'B.Sc Biotechnology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Sc Industrial Biotechnology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-014-L4' LIMIT 1),
  'M.Sc Industrial Biotechnology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Pharm
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-014-L4' LIMIT 1),
  'B.Pharm',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Agri-Biotech Trait, Field Trial and Stewardship Evidence Packet Control - Readiness Packet and Decision Support
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Agri-Biotech Trait, Field Trial and Stewardship Evidence Packet Control - Readiness Packet and Decision Support',
  'COURSE-CAP-015-L4',
  'A readiness review for Agri-Biotech Trait, Field Trial and Stewardship Evidence Packet Control is blocked. The pack has 22 evidence items, but 1 acceptance criterion is missing, 2 source references are unresolved, and the reviewer cannot close the decision-support pack. Course objective: Map Agri-Biotech Trait, Field Trial and Stewardship Evidence Packet Control evidence against acceptance criteria; show readiness gaps; prepare a decision-support packet; document reviewer blockers. Learner outcome: Learner can build an Agri-Biotech Trait, Field Trial and Stewardship Evidence Packet Control readiness packet that supports review when acceptance criteria or source evidence are incomplete.',
  '12 hours',
  'Active',
  'Pharma / Biotech / MedTech',
  'technical',
  '["Map Agri-Biotech Trait, Field Trial and Stewardship Evidence Packet Control evidence against acceptance criteria; show readiness gaps; prepare a decision-support packet; document reviewer blockers.","Learner can build an Agri-Biotech Trait, Field Trial and Stewardship Evidence Packet Control readiness packet that supports review when acceptance criteria or source evidence are incomplete.","Create Agri-Biotech Trait, Field Trial and Stewardship Evidence Packet Control readiness and decision-support packet","Assess evidence using: Acceptance-criteria coverage; readiness confidence; unresolved-source visibility; reviewer blocker explanation; decision-support quality."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L4: Readiness Packet and Decision Support - CAP-015
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-015-L4' LIMIT 1),
  'L4: Readiness Packet and Decision Support - CAP-015',
  'A review meeting is due in 24 hours. The Agri-Biotech Trait, Field Trial and Stewardship Evidence Packet Control readiness pack cannot be closed because one acceptance criterion is missing and 2 source records are unresolved. You prepare a decision-support packet that shows what is ready, what is blocked, who owns it, and what must happen next. Required data: Agri-Biotech Trait, Field Trial and Stewardship Evidence Packet Control readiness pack; 22 evidence items; 2 unresolved source references; 1 missing acceptance criterion; 1 reviewer hold comment; decision-support template.',
  1,
  '["Pharma / Biotech / MedTech","Agri-Biotech and Seed Biotechnology Affairs","D-006","CAP-015","L4","Functional; Cognitive; Evidence; Communication; Compliance"]'::jsonb,
  '["Scenario Review","Evidence Check","Artifact Build","AI Coaching","Human Review","Retry and Improve","Portfolio Submission"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Agri-Biotech Trait, Field Trial and Stewardship Evidence Packet Control readiness and decision-support packet Practice
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-015-L4' LIMIT 1)
   AND title = 'L4: Readiness Packet and Decision Support - CAP-015' LIMIT 1),
  'Agri-Biotech Trait, Field Trial and Stewardship Evidence Packet Control readiness and decision-support packet Practice',
  'Complete the Agri-Biotech Trait, Field Trial and Stewardship Evidence Packet Control readiness and decision-support packet using the provided actuals and explain the evidence decision in simple workplace language.',
  'Workplace scenario: A review meeting is due in 24 hours. The Agri-Biotech Trait, Field Trial and Stewardship Evidence Packet Control readiness pack cannot be closed because one acceptance criterion is missing and 2 source records are unresolved. You prepare a decision-support packet that shows what is ready, what is blocked, who owns it, and what must happen next. Major concepts: Agri-Biotech Trait, Field Trial and Stewardship Evidence Packet Control readiness assessment; acceptance-criteria mapping; decision-support packet logic; blocker summary; reviewer hold resolution; evidence confidence rating. Artifact structure: Sections: readiness summary; acceptance-criteria map; unresolved source references; reviewer hold note; decision-support recommendation; next action. Evidence to assess: Acceptance-criteria coverage; readiness confidence; unresolved-source visibility; reviewer blocker explanation; decision-support quality. AI support: Use AI to summarize readiness blockers and test whether the decision-support packet is clear to a reviewer.',
  1,
  '180 minutes',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Agriculture
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-015-L4' LIMIT 1),
  'B.Sc Agriculture',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Sc Plant Biotechnology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-015-L4' LIMIT 1),
  'M.Sc Plant Biotechnology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Biotechnology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-015-L4' LIMIT 1),
  'B.Sc Biotechnology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Sc Genetics and Plant Breeding
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-015-L4' LIMIT 1),
  'M.Sc Genetics and Plant Breeding',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech Biotechnology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-015-L4' LIMIT 1),
  'B.Tech Biotechnology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Agri-Biotech License-to-Operate Evidence Coordination - Readiness Packet and Decision Support
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Agri-Biotech License-to-Operate Evidence Coordination - Readiness Packet and Decision Support',
  'COURSE-CAP-016-L4',
  'A readiness review for Agri-Biotech License-to-Operate Evidence Coordination is blocked. The pack has 22 evidence items, but 1 acceptance criterion is missing, 2 source references are unresolved, and the reviewer cannot close the decision-support pack. Course objective: Map Agri-Biotech License-to-Operate Evidence Coordination evidence against acceptance criteria; show readiness gaps; prepare a decision-support packet; document reviewer blockers. Learner outcome: Learner can build an Agri-Biotech License-to-Operate Evidence Coordination readiness packet that supports review when acceptance criteria or source evidence are incomplete.',
  '12 hours',
  'Active',
  'Pharma / Biotech / MedTech',
  'technical',
  '["Map Agri-Biotech License-to-Operate Evidence Coordination evidence against acceptance criteria; show readiness gaps; prepare a decision-support packet; document reviewer blockers.","Learner can build an Agri-Biotech License-to-Operate Evidence Coordination readiness packet that supports review when acceptance criteria or source evidence are incomplete.","Create Agri-Biotech License-to-Operate Evidence Coordination readiness and decision-support packet","Assess evidence using: Acceptance-criteria coverage; readiness confidence; unresolved-source visibility; reviewer blocker explanation; decision-support quality."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L4: Readiness Packet and Decision Support - CAP-016
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-016-L4' LIMIT 1),
  'L4: Readiness Packet and Decision Support - CAP-016',
  'A review meeting is due in 24 hours. The Agri-Biotech License-to-Operate Evidence Coordination readiness pack cannot be closed because one acceptance criterion is missing and 2 source records are unresolved. You prepare a decision-support packet that shows what is ready, what is blocked, who owns it, and what must happen next. Required data: Agri-Biotech License-to-Operate Evidence Coordination readiness pack; 22 evidence items; 2 unresolved source references; 1 missing acceptance criterion; 1 reviewer hold comment; decision-support template.',
  1,
  '["Pharma / Biotech / MedTech","Agri-Biotech and Seed Biotechnology Affairs","D-006","CAP-016","L4","Functional; Cognitive; Evidence; Communication; Compliance"]'::jsonb,
  '["Scenario Review","Evidence Check","Artifact Build","AI Coaching","Human Review","Retry and Improve","Portfolio Submission"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Agri-Biotech License-to-Operate Evidence Coordination readiness and decision-support packet Practice
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-016-L4' LIMIT 1)
   AND title = 'L4: Readiness Packet and Decision Support - CAP-016' LIMIT 1),
  'Agri-Biotech License-to-Operate Evidence Coordination readiness and decision-support packet Practice',
  'Complete the Agri-Biotech License-to-Operate Evidence Coordination readiness and decision-support packet using the provided actuals and explain the evidence decision in simple workplace language.',
  'Workplace scenario: A review meeting is due in 24 hours. The Agri-Biotech License-to-Operate Evidence Coordination readiness pack cannot be closed because one acceptance criterion is missing and 2 source records are unresolved. You prepare a decision-support packet that shows what is ready, what is blocked, who owns it, and what must happen next. Major concepts: Agri-Biotech License-to-Operate Evidence Coordination readiness assessment; acceptance-criteria mapping; decision-support packet logic; blocker summary; reviewer hold resolution; evidence confidence rating. Artifact structure: Sections: readiness summary; acceptance-criteria map; unresolved source references; reviewer hold note; decision-support recommendation; next action. Evidence to assess: Acceptance-criteria coverage; readiness confidence; unresolved-source visibility; reviewer blocker explanation; decision-support quality. AI support: Use AI to summarize readiness blockers and test whether the decision-support packet is clear to a reviewer.',
  1,
  '180 minutes',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Agriculture
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-016-L4' LIMIT 1),
  'B.Sc Agriculture',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Sc Agriculture Biotechnology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-016-L4' LIMIT 1),
  'M.Sc Agriculture Biotechnology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Biotechnology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-016-L4' LIMIT 1),
  'B.Sc Biotechnology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Sc Regulatory Affairs
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-016-L4' LIMIT 1),
  'M.Sc Regulatory Affairs',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech Biotechnology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-016-L4' LIMIT 1),
  'B.Tech Biotechnology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Medical Device Technical File, QMS and Post-Market Evidence Control - Readiness Packet and Decision Support
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Medical Device Technical File, QMS and Post-Market Evidence Control - Readiness Packet and Decision Support',
  'COURSE-CAP-017-L4',
  'A readiness review for Medical Device Technical File, QMS and Post-Market Evidence Control is blocked. The pack has 22 evidence items, but 1 acceptance criterion is missing, 2 source references are unresolved, and the reviewer cannot close the decision-support pack. Course objective: Map Medical Device Technical File, QMS and Post-Market Evidence Control evidence against acceptance criteria; show readiness gaps; prepare a decision-support packet; document reviewer blockers. Learner outcome: Learner can build a Medical Device Technical File, QMS and Post-Market Evidence Control readiness packet that supports review when acceptance criteria or source evidence are incomplete.',
  '12 hours',
  'Active',
  'Pharma / Biotech / MedTech',
  'technical',
  '["Map Medical Device Technical File, QMS and Post-Market Evidence Control evidence against acceptance criteria; show readiness gaps; prepare a decision-support packet; document reviewer blockers.","Learner can build a Medical Device Technical File, QMS and Post-Market Evidence Control readiness packet that supports review when acceptance criteria or source evidence are incomplete.","Create Medical Device Technical File, QMS and Post-Market Evidence Control readiness and decision-support packet","Assess evidence using: Acceptance-criteria coverage; readiness confidence; unresolved-source visibility; reviewer blocker explanation; decision-support quality."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L4: Readiness Packet and Decision Support - CAP-017
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-017-L4' LIMIT 1),
  'L4: Readiness Packet and Decision Support - CAP-017',
  'A review meeting is due in 24 hours. The Medical Device Technical File, QMS and Post-Market Evidence Control readiness pack cannot be closed because one acceptance criterion is missing and 2 source records are unresolved. You prepare a decision-support packet that shows what is ready, what is blocked, who owns it, and what must happen next. Required data: Medical Device Technical File, QMS and Post-Market Evidence Control readiness pack; 22 evidence items; 2 unresolved source references; 1 missing acceptance criterion; 1 reviewer hold comment; decision-support template.',
  1,
  '["Pharma / Biotech / MedTech","Medical Device Regulatory and Quality Operations","D-007","CAP-017","L4","Functional; Cognitive; Evidence; Communication; Compliance"]'::jsonb,
  '["Scenario Review","Evidence Check","Artifact Build","AI Coaching","Human Review","Retry and Improve","Portfolio Submission"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Medical Device Technical File, QMS and Post-Market Evidence Control readiness and decision-support packet Practice
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-017-L4' LIMIT 1)
   AND title = 'L4: Readiness Packet and Decision Support - CAP-017' LIMIT 1),
  'Medical Device Technical File, QMS and Post-Market Evidence Control readiness and decision-support packet Practice',
  'Complete the Medical Device Technical File, QMS and Post-Market Evidence Control readiness and decision-support packet using the provided actuals and explain the evidence decision in simple workplace language.',
  'Workplace scenario: A review meeting is due in 24 hours. The Medical Device Technical File, QMS and Post-Market Evidence Control readiness pack cannot be closed because one acceptance criterion is missing and 2 source records are unresolved. You prepare a decision-support packet that shows what is ready, what is blocked, who owns it, and what must happen next. Major concepts: Medical Device Technical File, QMS and Post-Market Evidence Control readiness assessment; acceptance-criteria mapping; decision-support packet logic; blocker summary; reviewer hold resolution; evidence confidence rating. Artifact structure: Sections: readiness summary; acceptance-criteria map; unresolved source references; reviewer hold note; decision-support recommendation; next action. Evidence to assess: Acceptance-criteria coverage; readiness confidence; unresolved-source visibility; reviewer blocker explanation; decision-support quality. AI support: Use AI to summarize readiness blockers and test whether the decision-support packet is clear to a reviewer.',
  1,
  '180 minutes',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Pharm
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-017-L4' LIMIT 1),
  'B.Pharm',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Pharm Regulatory Affairs
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-017-L4' LIMIT 1),
  'M.Pharm Regulatory Affairs',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech Biomedical Engineering
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-017-L4' LIMIT 1),
  'B.Tech Biomedical Engineering',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Life Sciences
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-017-L4' LIMIT 1),
  'B.Sc Life Sciences',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Sc Medical Technology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-017-L4' LIMIT 1),
  'M.Sc Medical Technology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Device QC Test Report and Biomedical Equipment Nonconformance Packet Control - Readiness Packet and Decision Support
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Device QC Test Report and Biomedical Equipment Nonconformance Packet Control - Readiness Packet and Decision Support',
  'COURSE-CAP-018A-L4',
  'A readiness review for Device QC Test Report and Biomedical Equipment Nonconformance Packet Control is blocked. The pack has 22 evidence items, but 1 acceptance criterion is missing, 2 source references are unresolved, and the reviewer cannot close the decision-support pack. Course objective: Map Device QC Test Report and Biomedical Equipment Nonconformance Packet Control evidence against acceptance criteria; show readiness gaps; prepare a decision-support packet; document reviewer blockers. Learner outcome: Learner can build a Device QC Test Report and Biomedical Equipment Nonconformance Packet Control readiness packet that supports review when acceptance criteria or source evidence are incomplete.',
  '12 hours',
  'Active',
  'Pharma / Biotech / MedTech',
  'technical',
  '["Map Device QC Test Report and Biomedical Equipment Nonconformance Packet Control evidence against acceptance criteria; show readiness gaps; prepare a decision-support packet; document reviewer blockers.","Learner can build a Device QC Test Report and Biomedical Equipment Nonconformance Packet Control readiness packet that supports review when acceptance criteria or source evidence are incomplete.","Create Device QC Test Report and Biomedical Equipment Nonconformance Packet Control readiness and decision-support packet","Assess evidence using: Acceptance-criteria coverage; readiness confidence; unresolved-source visibility; reviewer blocker explanation; decision-support quality."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L4: Readiness Packet and Decision Support - CAP-018A
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-018A-L4' LIMIT 1),
  'L4: Readiness Packet and Decision Support - CAP-018A',
  'A review meeting is due in 24 hours. The Device QC Test Report and Biomedical Equipment Nonconformance Packet Control readiness pack cannot be closed because one acceptance criterion is missing and 2 source records are unresolved. You prepare a decision-support packet that shows what is ready, what is blocked, who owns it, and what must happen next. Required data: Device QC Test Report and Biomedical Equipment Nonconformance Packet Control readiness pack; 22 evidence items; 2 unresolved source references; 1 missing acceptance criterion; 1 reviewer hold comment; decision-support template.',
  1,
  '["Pharma / Biotech / MedTech","Medical Device QC Testing and Biomedical Equipment Evidence","D-007","CAP-018A","L4","Functional; Cognitive; Evidence; Communication; Compliance"]'::jsonb,
  '["Scenario Review","Evidence Check","Artifact Build","AI Coaching","Human Review","Retry and Improve","Portfolio Submission"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Device QC Test Report and Biomedical Equipment Nonconformance Packet Control readiness and decision-support packet Practice
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-018A-L4' LIMIT 1)
   AND title = 'L4: Readiness Packet and Decision Support - CAP-018A' LIMIT 1),
  'Device QC Test Report and Biomedical Equipment Nonconformance Packet Control readiness and decision-support packet Practice',
  'Complete the Device QC Test Report and Biomedical Equipment Nonconformance Packet Control readiness and decision-support packet using the provided actuals and explain the evidence decision in simple workplace language.',
  'Workplace scenario: A review meeting is due in 24 hours. The Device QC Test Report and Biomedical Equipment Nonconformance Packet Control readiness pack cannot be closed because one acceptance criterion is missing and 2 source records are unresolved. You prepare a decision-support packet that shows what is ready, what is blocked, who owns it, and what must happen next. Major concepts: Device QC Test Report and Biomedical Equipment Nonconformance Packet Control readiness assessment; acceptance-criteria mapping; decision-support packet logic; blocker summary; reviewer hold resolution; evidence confidence rating. Artifact structure: Sections: readiness summary; acceptance-criteria map; unresolved source references; reviewer hold note; decision-support recommendation; next action. Evidence to assess: Acceptance-criteria coverage; readiness confidence; unresolved-source visibility; reviewer blocker explanation; decision-support quality. AI support: Use AI to summarize readiness blockers and test whether the decision-support packet is clear to a reviewer.',
  1,
  '180 minutes',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech Biomedical Engineering
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-018A-L4' LIMIT 1),
  'B.Tech Biomedical Engineering',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: Diploma Biomedical Engineering
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-018A-L4' LIMIT 1),
  'Diploma Biomedical Engineering',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Medical Laboratory Technology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-018A-L4' LIMIT 1),
  'B.Sc Medical Laboratory Technology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech Electronics and Instrumentation
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-018A-L4' LIMIT 1),
  'B.Tech Electronics and Instrumentation',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Physics
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-018A-L4' LIMIT 1),
  'B.Sc Physics',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: IVD Performance, Diagnostic Evidence and PMS Packet Control - Readiness Packet and Decision Support
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'IVD Performance, Diagnostic Evidence and PMS Packet Control - Readiness Packet and Decision Support',
  'COURSE-CAP-018B-L4',
  'A readiness review for IVD Performance, Diagnostic Evidence and PMS Packet Control is blocked. The pack has 22 evidence items, but 1 acceptance criterion is missing, 2 source references are unresolved, and the reviewer cannot close the decision-support pack. Course objective: Map IVD Performance, Diagnostic Evidence and PMS Packet Control evidence against acceptance criteria; show readiness gaps; prepare a decision-support packet; document reviewer blockers. Learner outcome: Learner can build an IVD Performance, Diagnostic Evidence and PMS Packet Control readiness packet that supports review when acceptance criteria or source evidence are incomplete.',
  '12 hours',
  'Active',
  'Pharma / Biotech / MedTech',
  'technical',
  '["Map IVD Performance, Diagnostic Evidence and PMS Packet Control evidence against acceptance criteria; show readiness gaps; prepare a decision-support packet; document reviewer blockers.","Learner can build an IVD Performance, Diagnostic Evidence and PMS Packet Control readiness packet that supports review when acceptance criteria or source evidence are incomplete.","Create IVD Performance, Diagnostic Evidence and PMS Packet Control readiness and decision-support packet","Assess evidence using: Acceptance-criteria coverage; readiness confidence; unresolved-source visibility; reviewer blocker explanation; decision-support quality."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L4: Readiness Packet and Decision Support - CAP-018B
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-018B-L4' LIMIT 1),
  'L4: Readiness Packet and Decision Support - CAP-018B',
  'A review meeting is due in 24 hours. The IVD Performance, Diagnostic Evidence and PMS Packet Control readiness pack cannot be closed because one acceptance criterion is missing and 2 source records are unresolved. You prepare a decision-support packet that shows what is ready, what is blocked, who owns it, and what must happen next. Required data: IVD Performance, Diagnostic Evidence and PMS Packet Control readiness pack; 22 evidence items; 2 unresolved source references; 1 missing acceptance criterion; 1 reviewer hold comment; decision-support template.',
  1,
  '["Pharma / Biotech / MedTech","IVD Regulatory and Performance Evaluation Operations","Medical Device Softwar","D-007","CAP-018B","L4","Functional; Cognitive; Evidence; Communication; Compliance"]'::jsonb,
  '["Scenario Review","Evidence Check","Artifact Build","AI Coaching","Human Review","Retry and Improve","Portfolio Submission"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: IVD Performance, Diagnostic Evidence and PMS Packet Control readiness and decision-support packet Practice
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-018B-L4' LIMIT 1)
   AND title = 'L4: Readiness Packet and Decision Support - CAP-018B' LIMIT 1),
  'IVD Performance, Diagnostic Evidence and PMS Packet Control readiness and decision-support packet Practice',
  'Complete the IVD Performance, Diagnostic Evidence and PMS Packet Control readiness and decision-support packet using the provided actuals and explain the evidence decision in simple workplace language.',
  'Workplace scenario: A review meeting is due in 24 hours. The IVD Performance, Diagnostic Evidence and PMS Packet Control readiness pack cannot be closed because one acceptance criterion is missing and 2 source records are unresolved. You prepare a decision-support packet that shows what is ready, what is blocked, who owns it, and what must happen next. Major concepts: IVD Performance, Diagnostic Evidence and PMS Packet Control readiness assessment; acceptance-criteria mapping; decision-support packet logic; blocker summary; reviewer hold resolution; evidence confidence rating. Artifact structure: Sections: readiness summary; acceptance-criteria map; unresolved source references; reviewer hold note; decision-support recommendation; next action. Evidence to assess: Acceptance-criteria coverage; readiness confidence; unresolved-source visibility; reviewer blocker explanation; decision-support quality. AI support: Use AI to summarize readiness blockers and test whether the decision-support packet is clear to a reviewer.',
  1,
  '180 minutes',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Medical Laboratory Technology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-018B-L4' LIMIT 1),
  'B.Sc Medical Laboratory Technology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Sc Clinical Biochemistry
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-018B-L4' LIMIT 1),
  'M.Sc Clinical Biochemistry',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Sc Microbiology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-018B-L4' LIMIT 1),
  'M.Sc Microbiology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech Biotechnology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-018B-L4' LIMIT 1),
  'B.Tech Biotechnology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Biotechnology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-018B-L4' LIMIT 1),
  'B.Sc Biotechnology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: SaMD Lifecycle, V&V and Cybersecurity Evidence Index Control - Readiness Packet and Decision Support
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'SaMD Lifecycle, V&V and Cybersecurity Evidence Index Control - Readiness Packet and Decision Support',
  'COURSE-CAP-018C-L4',
  'A readiness review for SaMD Lifecycle, V&V and Cybersecurity Evidence Index Control is blocked. The pack has 22 evidence items, but 1 acceptance criterion is missing, 2 source references are unresolved, and the reviewer cannot close the decision-support pack. Course objective: Map SaMD Lifecycle, V&V and Cybersecurity Evidence Index Control evidence against acceptance criteria; show readiness gaps; prepare a decision-support packet; document reviewer blockers. Learner outcome: Learner can build a SaMD Lifecycle, V&V and Cybersecurity Evidence Index Control readiness packet that supports review when acceptance criteria or source evidence are incomplete.',
  '12 hours',
  'Active',
  'Pharma / Biotech / MedTech',
  'technical',
  '["Map SaMD Lifecycle, V&V and Cybersecurity Evidence Index Control evidence against acceptance criteria; show readiness gaps; prepare a decision-support packet; document reviewer blockers.","Learner can build a SaMD Lifecycle, V&V and Cybersecurity Evidence Index Control readiness packet that supports review when acceptance criteria or source evidence are incomplete.","Create SaMD Lifecycle, V&V and Cybersecurity Evidence Index Control readiness and decision-support packet","Assess evidence using: Acceptance-criteria coverage; readiness confidence; unresolved-source visibility; reviewer blocker explanation; decision-support quality."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L4: Readiness Packet and Decision Support - CAP-018C
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-018C-L4' LIMIT 1),
  'L4: Readiness Packet and Decision Support - CAP-018C',
  'A review meeting is due in 24 hours. The SaMD Lifecycle, V&V and Cybersecurity Evidence Index Control readiness pack cannot be closed because one acceptance criterion is missing and 2 source records are unresolved. You prepare a decision-support packet that shows what is ready, what is blocked, who owns it, and what must happen next. Required data: SaMD Lifecycle, V&V and Cybersecurity Evidence Index Control readiness pack; 22 evidence items; 2 unresolved source references; 1 missing acceptance criterion; 1 reviewer hold comment; decision-support template.',
  1,
  '["Pharma / Biotech / MedTech","Medical Device Software QARA and Digital Product Evidence","D-007","CAP-018C","L4","Functional; Cognitive; Evidence; Communication; Compliance"]'::jsonb,
  '["Scenario Review","Evidence Check","Artifact Build","AI Coaching","Human Review","Retry and Improve","Portfolio Submission"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: SaMD Lifecycle, V&V and Cybersecurity Evidence Index Control readiness and decision-support packet Practice
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-018C-L4' LIMIT 1)
   AND title = 'L4: Readiness Packet and Decision Support - CAP-018C' LIMIT 1),
  'SaMD Lifecycle, V&V and Cybersecurity Evidence Index Control readiness and decision-support packet Practice',
  'Complete the SaMD Lifecycle, V&V and Cybersecurity Evidence Index Control readiness and decision-support packet using the provided actuals and explain the evidence decision in simple workplace language.',
  'Workplace scenario: A review meeting is due in 24 hours. The SaMD Lifecycle, V&V and Cybersecurity Evidence Index Control readiness pack cannot be closed because one acceptance criterion is missing and 2 source records are unresolved. You prepare a decision-support packet that shows what is ready, what is blocked, who owns it, and what must happen next. Major concepts: SaMD Lifecycle, V&V and Cybersecurity Evidence Index Control readiness assessment; acceptance-criteria mapping; decision-support packet logic; blocker summary; reviewer hold resolution; evidence confidence rating. Artifact structure: Sections: readiness summary; acceptance-criteria map; unresolved source references; reviewer hold note; decision-support recommendation; next action. Evidence to assess: Acceptance-criteria coverage; readiness confidence; unresolved-source visibility; reviewer blocker explanation; decision-support quality. AI support: Use AI to summarize readiness blockers and test whether the decision-support packet is clear to a reviewer.',
  1,
  '180 minutes',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech Biomedical Engineering
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-018C-L4' LIMIT 1),
  'B.Tech Biomedical Engineering',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech Computer Science
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-018C-L4' LIMIT 1),
  'B.Tech Computer Science',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech Information Technology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-018C-L4' LIMIT 1),
  'B.Tech Information Technology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Sc Health Informatics
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-018C-L4' LIMIT 1),
  'M.Sc Health Informatics',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Tech Medical Software Systems
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-018C-L4' LIMIT 1),
  'M.Tech Medical Software Systems',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: API Batch Quality Evidence Review - Recurring Risk and Governance Improvement
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'API Batch Quality Evidence Review - Recurring Risk and Governance Improvement',
  'COURSE-CAP-001-L5',
  'The same API Batch Quality Evidence Review evidence issue has appeared across 3 review cycles. There are 30 observations, 6 repeated gap types, and 4 unclear ownership handoffs. The learner must create a recurring-risk register and improvement standard. Course objective: Find repeated API Batch Quality Evidence Review evidence failures; group root causes; create a recurring-risk register; propose a control improvement. Learner outcome: Learner can analyze recurring API Batch Quality Evidence Review evidence issues and propose a governance improvement without claiming approval authority.',
  '14 hours',
  'Active',
  'Pharma / Biotech / MedTech',
  'technical',
  '["Find repeated API Batch Quality Evidence Review evidence failures; group root causes; create a recurring-risk register; propose a control improvement.","Learner can analyze recurring API Batch Quality Evidence Review evidence issues and propose a governance improvement without claiming approval authority.","Create API Batch Quality Evidence Review recurring-risk and improvement standard","Assess evidence using: Recurring-risk evidence; pattern grouping; root-cause clarity; governance practicality; improvement standard usefulness."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L5: Recurring Risk and Governance Improvement - CAP-001
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-001-L5' LIMIT 1),
  'L5: Recurring Risk and Governance Improvement - CAP-001',
  'During a monthly governance review, leaders notice that the same API Batch Quality Evidence Review problem keeps returning. You compare 3 review cycles, group 6 repeated gap types, identify 4 ownership handoff issues, and propose a simple evidence-control standard so the issue does not repeat. Required data: API Batch Quality Evidence Review review history across 3 cycles; 30 evidence observations; 6 repeated gap types; 4 owner handoff notes; 2 proposed control changes; improvement-register template.',
  1,
  '["Pharma / Biotech / MedTech","Small-Molecule Pharma Manufacturing and CMC Regulatory Operations","D-001","CAP-001","L5","Cognitive; Behavioural; Compliance; Evidence; AI/Digital"]'::jsonb,
  '["Scenario Review","Evidence Check","Artifact Build","AI Coaching","Human Review","Retry and Improve","Portfolio Submission"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: API Batch Quality Evidence Review recurring-risk and improvement standard Practice
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-001-L5' LIMIT 1)
   AND title = 'L5: Recurring Risk and Governance Improvement - CAP-001' LIMIT 1),
  'API Batch Quality Evidence Review recurring-risk and improvement standard Practice',
  'Complete the API Batch Quality Evidence Review recurring-risk and improvement standard using the provided actuals and explain the evidence decision in simple workplace language.',
  'Workplace scenario: During a monthly governance review, leaders notice that the same API Batch Quality Evidence Review problem keeps returning. You compare 3 review cycles, group 6 repeated gap types, identify 4 ownership handoff issues, and propose a simple evidence-control standard so the issue does not repeat. Major concepts: API Batch Quality Evidence Review governance review; recurring-risk pattern analysis across 3 cycles; control standard design; improvement register; audit-readiness logic; prevention of repeated evidence failure. Artifact structure: Sections: review-cycle comparison; repeated gap types; ownership handoff pattern; recurring-risk rating; proposed control standard; improvement action owner. Evidence to assess: Recurring-risk evidence; pattern grouping; root-cause clarity; governance practicality; improvement standard usefulness. AI support: Use AI to group recurring gaps and draft improvement wording, but validate the control standard with human review.',
  1,
  '210 minutes',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Pharm
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-001-L5' LIMIT 1),
  'B.Pharm',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Pharm Pharmaceutical Quality Assurance
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-001-L5' LIMIT 1),
  'M.Pharm Pharmaceutical Quality Assurance',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Pharm Pharmaceutics
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-001-L5' LIMIT 1),
  'M.Pharm Pharmaceutics',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Chemistry
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-001-L5' LIMIT 1),
  'B.Sc Chemistry',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Sc Pharmaceutical Chemistry
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-001-L5' LIMIT 1),
  'M.Sc Pharmaceutical Chemistry',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: API Deviation, OOS and CAPA Evidence Control - Recurring Risk and Governance Improvement
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'API Deviation, OOS and CAPA Evidence Control - Recurring Risk and Governance Improvement',
  'COURSE-CAP-002-L5',
  'The same API Deviation, OOS and CAPA Evidence Control evidence issue has appeared across 3 review cycles. There are 30 observations, 6 repeated gap types, and 4 unclear ownership handoffs. The learner must create a recurring-risk register and improvement standard. Course objective: Find repeated API Deviation, OOS and CAPA Evidence Control evidence failures; group root causes; create a recurring-risk register; propose a control improvement. Learner outcome: Learner can analyze recurring API Deviation, OOS and CAPA Evidence Control evidence issues and propose a governance improvement without claiming approval authority.',
  '14 hours',
  'Active',
  'Pharma / Biotech / MedTech',
  'technical',
  '["Find repeated API Deviation, OOS and CAPA Evidence Control evidence failures; group root causes; create a recurring-risk register; propose a control improvement.","Learner can analyze recurring API Deviation, OOS and CAPA Evidence Control evidence issues and propose a governance improvement without claiming approval authority.","Create API Deviation, OOS and CAPA Evidence Control recurring-risk and improvement standard","Assess evidence using: Recurring-risk evidence; pattern grouping; root-cause clarity; governance practicality; improvement standard usefulness."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L5: Recurring Risk and Governance Improvement - CAP-002
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-002-L5' LIMIT 1),
  'L5: Recurring Risk and Governance Improvement - CAP-002',
  'During a monthly governance review, leaders notice that the same API Deviation, OOS and CAPA Evidence Control problem keeps returning. You compare 3 review cycles, group 6 repeated gap types, identify 4 ownership handoff issues, and propose a simple evidence-control standard so the issue does not repeat. Required data: API Deviation, OOS and CAPA Evidence Control review history across 3 cycles; 30 evidence observations; 6 repeated gap types; 4 owner handoff notes; 2 proposed control changes; improvement-register template.',
  1,
  '["Pharma / Biotech / MedTech","Small-Molecule Pharma Manufacturing and CMC Regulatory Operations","Pharma GM","D-001","CAP-002","L5","Cognitive; Behavioural; Compliance; Evidence; AI/Digital"]'::jsonb,
  '["Scenario Review","Evidence Check","Artifact Build","AI Coaching","Human Review","Retry and Improve","Portfolio Submission"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: API Deviation, OOS and CAPA Evidence Control recurring-risk and improvement standard Practice
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-002-L5' LIMIT 1)
   AND title = 'L5: Recurring Risk and Governance Improvement - CAP-002' LIMIT 1),
  'API Deviation, OOS and CAPA Evidence Control recurring-risk and improvement standard Practice',
  'Complete the API Deviation, OOS and CAPA Evidence Control recurring-risk and improvement standard using the provided actuals and explain the evidence decision in simple workplace language.',
  'Workplace scenario: During a monthly governance review, leaders notice that the same API Deviation, OOS and CAPA Evidence Control problem keeps returning. You compare 3 review cycles, group 6 repeated gap types, identify 4 ownership handoff issues, and propose a simple evidence-control standard so the issue does not repeat. Major concepts: API Deviation, OOS and CAPA Evidence Control governance review; recurring-risk pattern analysis across 3 cycles; control standard design; improvement register; audit-readiness logic; prevention of repeated evidence failure. Artifact structure: Sections: review-cycle comparison; repeated gap types; ownership handoff pattern; recurring-risk rating; proposed control standard; improvement action owner. Evidence to assess: Recurring-risk evidence; pattern grouping; root-cause clarity; governance practicality; improvement standard usefulness. AI support: Use AI to group recurring gaps and draft improvement wording, but validate the control standard with human review.',
  1,
  '210 minutes',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Pharm
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-002-L5' LIMIT 1),
  'B.Pharm',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Pharm Pharmaceutical Quality Assurance
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-002-L5' LIMIT 1),
  'M.Pharm Pharmaceutical Quality Assurance',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Pharm Pharmaceutics
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-002-L5' LIMIT 1),
  'M.Pharm Pharmaceutics',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Chemistry
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-002-L5' LIMIT 1),
  'B.Sc Chemistry',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Sc Pharmaceutical Chemistry
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-002-L5' LIMIT 1),
  'M.Sc Pharmaceutical Chemistry',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Finished Dose BMR/BPR Packaging Variance and Release Packet Control - Recurring Risk and Governance Improvement
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Finished Dose BMR/BPR Packaging Variance and Release Packet Control - Recurring Risk and Governance Improvement',
  'COURSE-CAP-003-L5',
  'The same Finished Dose BMR/BPR Packaging Variance and Release Packet Control evidence issue has appeared across 3 review cycles. There are 30 observations, 6 repeated gap types, and 4 unclear ownership handoffs. The learner must create a recurring-risk register and improvement standard. Course objective: Find repeated Finished Dose BMR/BPR Packaging Variance and Release Packet Control evidence failures; group root causes; create a recurring-risk register; propose a control improvement. Learner outcome: Learner can analyze recurring Finished Dose BMR/BPR Packaging Variance and Release Packet Control evidence issues and propose a governance improvement without claiming approval authority.',
  '14 hours',
  'Active',
  'Pharma / Biotech / MedTech',
  'technical',
  '["Find repeated Finished Dose BMR/BPR Packaging Variance and Release Packet Control evidence failures; group root causes; create a recurring-risk register; propose a control improvement.","Learner can analyze recurring Finished Dose BMR/BPR Packaging Variance and Release Packet Control evidence issues and propose a governance improvement without claiming approval authority.","Create Finished Dose BMR/BPR Packaging Variance and Release Packet Control recurring-risk and improvement standard","Assess evidence using: Recurring-risk evidence; pattern grouping; root-cause clarity; governance practicality; improvement standard usefulness."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L5: Recurring Risk and Governance Improvement - CAP-003
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-003-L5' LIMIT 1),
  'L5: Recurring Risk and Governance Improvement - CAP-003',
  'During a monthly governance review, leaders notice that the same Finished Dose BMR/BPR Packaging Variance and Release Packet Control problem keeps returning. You compare 3 review cycles, group 6 repeated gap types, identify 4 ownership handoff issues, and propose a simple evidence-control standard so the issue does not repeat. Required data: Finished Dose BMR/BPR Packaging Variance and Release Packet Control review history across 3 cycles; 30 evidence observations; 6 repeated gap types; 4 owner handoff notes; 2 proposed control changes; improvement-register template.',
  1,
  '["Pharma / Biotech / MedTech","Small-Molecule Pharma Manufacturing and CMC Regulatory Operations","Pharma GM","D-001","CAP-003","L5","Cognitive; Behavioural; Compliance; Evidence; AI/Digital"]'::jsonb,
  '["Scenario Review","Evidence Check","Artifact Build","AI Coaching","Human Review","Retry and Improve","Portfolio Submission"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Finished Dose BMR/BPR Packaging Variance and Release Packet Control recurring-risk and improvement standard Practice
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-003-L5' LIMIT 1)
   AND title = 'L5: Recurring Risk and Governance Improvement - CAP-003' LIMIT 1),
  'Finished Dose BMR/BPR Packaging Variance and Release Packet Control recurring-risk and improvement standard Practice',
  'Complete the Finished Dose BMR/BPR Packaging Variance and Release Packet Control recurring-risk and improvement standard using the provided actuals and explain the evidence decision in simple workplace language.',
  'Workplace scenario: During a monthly governance review, leaders notice that the same Finished Dose BMR/BPR Packaging Variance and Release Packet Control problem keeps returning. You compare 3 review cycles, group 6 repeated gap types, identify 4 ownership handoff issues, and propose a simple evidence-control standard so the issue does not repeat. Major concepts: Finished Dose BMR/BPR Packaging Variance and Release Packet Control governance review; recurring-risk pattern analysis across 3 cycles; control standard design; improvement register; audit-readiness logic; prevention of repeated evidence failure. Artifact structure: Sections: review-cycle comparison; repeated gap types; ownership handoff pattern; recurring-risk rating; proposed control standard; improvement action owner. Evidence to assess: Recurring-risk evidence; pattern grouping; root-cause clarity; governance practicality; improvement standard usefulness. AI support: Use AI to group recurring gaps and draft improvement wording, but validate the control standard with human review.',
  1,
  '210 minutes',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Pharm
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-003-L5' LIMIT 1),
  'B.Pharm',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Pharm Pharmaceutical Quality Assurance
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-003-L5' LIMIT 1),
  'M.Pharm Pharmaceutical Quality Assurance',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Pharm Pharmaceutics
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-003-L5' LIMIT 1),
  'M.Pharm Pharmaceutics',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Chemistry
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-003-L5' LIMIT 1),
  'B.Sc Chemistry',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Sc Pharmaceutical Chemistry
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-003-L5' LIMIT 1),
  'M.Sc Pharmaceutical Chemistry',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Stability Study Follow-Up and Change-Control Impact Packet Control - Recurring Risk and Governance Improvement
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Stability Study Follow-Up and Change-Control Impact Packet Control - Recurring Risk and Governance Improvement',
  'COURSE-CAP-004-L5',
  'The same Stability Study Follow-Up and Change-Control Impact Packet Control evidence issue has appeared across 3 review cycles. There are 30 observations, 6 repeated gap types, and 4 unclear ownership handoffs. The learner must create a recurring-risk register and improvement standard. Course objective: Find repeated Stability Study Follow-Up and Change-Control Impact Packet Control evidence failures; group root causes; create a recurring-risk register; propose a control improvement. Learner outcome: Learner can analyze recurring Stability Study Follow-Up and Change-Control Impact Packet Control evidence issues and propose a governance improvement without claiming approval authority.',
  '14 hours',
  'Active',
  'Pharma / Biotech / MedTech',
  'technical',
  '["Find repeated Stability Study Follow-Up and Change-Control Impact Packet Control evidence failures; group root causes; create a recurring-risk register; propose a control improvement.","Learner can analyze recurring Stability Study Follow-Up and Change-Control Impact Packet Control evidence issues and propose a governance improvement without claiming approval authority.","Create Stability Study Follow-Up and Change-Control Impact Packet Control recurring-risk and improvement standard","Assess evidence using: Recurring-risk evidence; pattern grouping; root-cause clarity; governance practicality; improvement standard usefulness."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L5: Recurring Risk and Governance Improvement - CAP-004
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-004-L5' LIMIT 1),
  'L5: Recurring Risk and Governance Improvement - CAP-004',
  'During a monthly governance review, leaders notice that the same Stability Study Follow-Up and Change-Control Impact Packet Control problem keeps returning. You compare 3 review cycles, group 6 repeated gap types, identify 4 ownership handoff issues, and propose a simple evidence-control standard so the issue does not repeat. Required data: Stability Study Follow-Up and Change-Control Impact Packet Control review history across 3 cycles; 30 evidence observations; 6 repeated gap types; 4 owner handoff notes; 2 proposed control changes; improvement-register template.',
  1,
  '["Pharma / Biotech / MedTech","Small-Molecule Pharma Manufacturing and CMC Regulatory Operations","Pharma GM","D-001","CAP-004","L5","Cognitive; Behavioural; Compliance; Evidence; AI/Digital"]'::jsonb,
  '["Scenario Review","Evidence Check","Artifact Build","AI Coaching","Human Review","Retry and Improve","Portfolio Submission"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Stability Study Follow-Up and Change-Control Impact Packet Control recurring-risk and improvement standard Practice
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-004-L5' LIMIT 1)
   AND title = 'L5: Recurring Risk and Governance Improvement - CAP-004' LIMIT 1),
  'Stability Study Follow-Up and Change-Control Impact Packet Control recurring-risk and improvement standard Practice',
  'Complete the Stability Study Follow-Up and Change-Control Impact Packet Control recurring-risk and improvement standard using the provided actuals and explain the evidence decision in simple workplace language.',
  'Workplace scenario: During a monthly governance review, leaders notice that the same Stability Study Follow-Up and Change-Control Impact Packet Control problem keeps returning. You compare 3 review cycles, group 6 repeated gap types, identify 4 ownership handoff issues, and propose a simple evidence-control standard so the issue does not repeat. Major concepts: Stability Study Follow-Up and Change-Control Impact Packet Control governance review; recurring-risk pattern analysis across 3 cycles; control standard design; improvement register; audit-readiness logic; prevention of repeated evidence failure. Artifact structure: Sections: review-cycle comparison; repeated gap types; ownership handoff pattern; recurring-risk rating; proposed control standard; improvement action owner. Evidence to assess: Recurring-risk evidence; pattern grouping; root-cause clarity; governance practicality; improvement standard usefulness. AI support: Use AI to group recurring gaps and draft improvement wording, but validate the control standard with human review.',
  1,
  '210 minutes',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Pharm
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-004-L5' LIMIT 1),
  'B.Pharm',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Pharm Pharmaceutical Quality Assurance
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-004-L5' LIMIT 1),
  'M.Pharm Pharmaceutical Quality Assurance',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Pharm Pharmaceutics
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-004-L5' LIMIT 1),
  'M.Pharm Pharmaceutics',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Chemistry
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-004-L5' LIMIT 1),
  'B.Sc Chemistry',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Sc Pharmaceutical Chemistry
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-004-L5' LIMIT 1),
  'M.Sc Pharmaceutical Chemistry',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Biological Product Batch and Comparability Evidence Control - Recurring Risk and Governance Improvement
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Biological Product Batch and Comparability Evidence Control - Recurring Risk and Governance Improvement',
  'COURSE-CAP-005-L5',
  'The same Biological Product Batch and Comparability Evidence Control evidence issue has appeared across 3 review cycles. There are 30 observations, 6 repeated gap types, and 4 unclear ownership handoffs. The learner must create a recurring-risk register and improvement standard. Course objective: Find repeated Biological Product Batch and Comparability Evidence Control evidence failures; group root causes; create a recurring-risk register; propose a control improvement. Learner outcome: Learner can analyze recurring Biological Product Batch and Comparability Evidence Control evidence issues and propose a governance improvement without claiming approval authority.',
  '14 hours',
  'Active',
  'Pharma / Biotech / MedTech',
  'technical',
  '["Find repeated Biological Product Batch and Comparability Evidence Control evidence failures; group root causes; create a recurring-risk register; propose a control improvement.","Learner can analyze recurring Biological Product Batch and Comparability Evidence Control evidence issues and propose a governance improvement without claiming approval authority.","Create Biological Product Batch and Comparability Evidence Control recurring-risk and improvement standard","Assess evidence using: Recurring-risk evidence; pattern grouping; root-cause clarity; governance practicality; improvement standard usefulness."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L5: Recurring Risk and Governance Improvement - CAP-005
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-005-L5' LIMIT 1),
  'L5: Recurring Risk and Governance Improvement - CAP-005',
  'During a monthly governance review, leaders notice that the same Biological Product Batch and Comparability Evidence Control problem keeps returning. You compare 3 review cycles, group 6 repeated gap types, identify 4 ownership handoff issues, and propose a simple evidence-control standard so the issue does not repeat. Required data: Biological Product Batch and Comparability Evidence Control review history across 3 cycles; 30 evidence observations; 6 repeated gap types; 4 owner handoff notes; 2 proposed control changes; improvement-register template.',
  1,
  '["Pharma / Biotech / MedTech","Biological Product, Vaccine and Biosimilar Operations","D-002","CAP-005","L5","Cognitive; Behavioural; Compliance; Evidence; AI/Digital"]'::jsonb,
  '["Scenario Review","Evidence Check","Artifact Build","AI Coaching","Human Review","Retry and Improve","Portfolio Submission"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Biological Product Batch and Comparability Evidence Control recurring-risk and improvement standard Practice
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-005-L5' LIMIT 1)
   AND title = 'L5: Recurring Risk and Governance Improvement - CAP-005' LIMIT 1),
  'Biological Product Batch and Comparability Evidence Control recurring-risk and improvement standard Practice',
  'Complete the Biological Product Batch and Comparability Evidence Control recurring-risk and improvement standard using the provided actuals and explain the evidence decision in simple workplace language.',
  'Workplace scenario: During a monthly governance review, leaders notice that the same Biological Product Batch and Comparability Evidence Control problem keeps returning. You compare 3 review cycles, group 6 repeated gap types, identify 4 ownership handoff issues, and propose a simple evidence-control standard so the issue does not repeat. Major concepts: Biological Product Batch and Comparability Evidence Control governance review; recurring-risk pattern analysis across 3 cycles; control standard design; improvement register; audit-readiness logic; prevention of repeated evidence failure. Artifact structure: Sections: review-cycle comparison; repeated gap types; ownership handoff pattern; recurring-risk rating; proposed control standard; improvement action owner. Evidence to assess: Recurring-risk evidence; pattern grouping; root-cause clarity; governance practicality; improvement standard usefulness. AI support: Use AI to group recurring gaps and draft improvement wording, but validate the control standard with human review.',
  1,
  '210 minutes',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Pharm
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-005-L5' LIMIT 1),
  'B.Pharm',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Pharm Pharmaceutical Biotechnology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-005-L5' LIMIT 1),
  'M.Pharm Pharmaceutical Biotechnology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Biotechnology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-005-L5' LIMIT 1),
  'B.Sc Biotechnology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Sc Biotechnology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-005-L5' LIMIT 1),
  'M.Sc Biotechnology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech Biotechnology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-005-L5' LIMIT 1),
  'B.Tech Biotechnology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Vaccine Lot QC, Temperature-Excursion and Cold-Chain Release Packet Control - - Recurring Risk and Governance Improvement
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Vaccine Lot QC, Temperature-Excursion and Cold-Chain Release Packet Control - - Recurring Risk and Governance Improvement',
  'COURSE-CAP-006-L5',
  'The same Vaccine Lot QC, Temperature-Excursion and Cold-Chain Release Packet Control - evidence issue has appeared across 3 review cycles. There are 30 observations, 6 repeated gap types, and 4 unclear ownership handoffs. The learner must create a recurring-risk register and improvement standard. Course objective: Find repeated Vaccine Lot QC, Temperature-Excursion and Cold-Chain Release Packet Control - evidence failures; group root causes; create a recurring-risk register; propose a control improvement. Learner outcome: Learner can analyze recurring Vaccine Lot QC, Temperature-Excursion and Cold-Chain Release Packet Control - evidence issues and propose a governance improvement without claiming approval authority.',
  '14 hours',
  'Active',
  'Pharma / Biotech / MedTech',
  'technical',
  '["Find repeated Vaccine Lot QC, Temperature-Excursion and Cold-Chain Release Packet Control - evidence failures; group root causes; create a recurring-risk register; propose a control improvement.","Learner can analyze recurring Vaccine Lot QC, Temperature-Excursion and Cold-Chain Release Packet Control - evidence issues and propose a governance improvement without claiming approval authority.","Create Vaccine Lot QC, Temperature-Excursion and Cold-Chain Release Packet Control - recurring-risk and improvement standard","Assess evidence using: Recurring-risk evidence; pattern grouping; root-cause clarity; governance practicality; improvement standard usefulness."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L5: Recurring Risk and Governance Improvement - CAP-006
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-006-L5' LIMIT 1),
  'L5: Recurring Risk and Governance Improvement - CAP-006',
  'During a monthly governance review, leaders notice that the same Vaccine Lot QC, Temperature-Excursion and Cold-Chain Release Packet Control - problem keeps returning. You compare 3 review cycles, group 6 repeated gap types, identify 4 ownership handoff issues, and propose a simple evidence-control standard so the issue does not repeat. Required data: Vaccine Lot QC, Temperature-Excursion and Cold-Chain Release Packet Control - review history across 3 cycles; 30 evidence observations; 6 repeated gap types; 4 owner handoff notes; 2 proposed control changes; improvement-register template.',
  1,
  '["Pharma / Biotech / MedTech","Biological Product, Vaccine and Biosimilar Operations","D-002","CAP-006","L5","Cognitive; Behavioural; Compliance; Evidence; AI/Digital"]'::jsonb,
  '["Scenario Review","Evidence Check","Artifact Build","AI Coaching","Human Review","Retry and Improve","Portfolio Submission"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Vaccine Lot QC, Temperature-Excursion and Cold-Chain Release Packet Control - recurring-risk and improvement standard Practice
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-006-L5' LIMIT 1)
   AND title = 'L5: Recurring Risk and Governance Improvement - CAP-006' LIMIT 1),
  'Vaccine Lot QC, Temperature-Excursion and Cold-Chain Release Packet Control - recurring-risk and improvement standard Practice',
  'Complete the Vaccine Lot QC, Temperature-Excursion and Cold-Chain Release Packet Control - recurring-risk and improvement standard using the provided actuals and explain the evidence decision in simple workplace language.',
  'Workplace scenario: During a monthly governance review, leaders notice that the same Vaccine Lot QC, Temperature-Excursion and Cold-Chain Release Packet Control - problem keeps returning. You compare 3 review cycles, group 6 repeated gap types, identify 4 ownership handoff issues, and propose a simple evidence-control standard so the issue does not repeat. Major concepts: Vaccine Lot QC, Temperature-Excursion and Cold-Chain Release Packet Control - governance review; recurring-risk pattern analysis across 3 cycles; control standard design; improvement register; audit-readiness logic; prevention of repeated evidence failure. Artifact structure: Sections: review-cycle comparison; repeated gap types; ownership handoff pattern; recurring-risk rating; proposed control standard; improvement action owner. Evidence to assess: Recurring-risk evidence; pattern grouping; root-cause clarity; governance practicality; improvement standard usefulness. AI support: Use AI to group recurring gaps and draft improvement wording, but validate the control standard with human review.',
  1,
  '210 minutes',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Pharm
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-006-L5' LIMIT 1),
  'B.Pharm',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Pharm Pharmaceutical Biotechnology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-006-L5' LIMIT 1),
  'M.Pharm Pharmaceutical Biotechnology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Biotechnology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-006-L5' LIMIT 1),
  'B.Sc Biotechnology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Sc Microbiology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-006-L5' LIMIT 1),
  'M.Sc Microbiology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Microbiology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-006-L5' LIMIT 1),
  'B.Sc Microbiology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Advanced Biopharma Evidence Inventory and Authority-Boundary Triage - Recurring Risk and Governance Improvement
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Advanced Biopharma Evidence Inventory and Authority-Boundary Triage - Recurring Risk and Governance Improvement',
  'COURSE-CAP-007-L5',
  'The same Advanced Biopharma Evidence Inventory and Authority-Boundary Triage evidence issue has appeared across 3 review cycles. There are 30 observations, 6 repeated gap types, and 4 unclear ownership handoffs. The learner must create a recurring-risk register and improvement standard. Course objective: Find repeated Advanced Biopharma Evidence Inventory and Authority-Boundary Triage evidence failures; group root causes; create a recurring-risk register; propose a control improvement. Learner outcome: Learner can analyze recurring Advanced Biopharma Evidence Inventory and Authority-Boundary Triage evidence issues and propose a governance improvement without claiming approval authority.',
  '14 hours',
  'Active',
  'Pharma / Biotech / MedTech',
  'technical',
  '["Find repeated Advanced Biopharma Evidence Inventory and Authority-Boundary Triage evidence failures; group root causes; create a recurring-risk register; propose a control improvement.","Learner can analyze recurring Advanced Biopharma Evidence Inventory and Authority-Boundary Triage evidence issues and propose a governance improvement without claiming approval authority.","Create Advanced Biopharma Evidence Inventory and Authority-Boundary Triage recurring-risk and improvement standard","Assess evidence using: Recurring-risk evidence; pattern grouping; root-cause clarity; governance practicality; improvement standard usefulness."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L5: Recurring Risk and Governance Improvement - CAP-007
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-007-L5' LIMIT 1),
  'L5: Recurring Risk and Governance Improvement - CAP-007',
  'During a monthly governance review, leaders notice that the same Advanced Biopharma Evidence Inventory and Authority-Boundary Triage problem keeps returning. You compare 3 review cycles, group 6 repeated gap types, identify 4 ownership handoff issues, and propose a simple evidence-control standard so the issue does not repeat. Required data: Advanced Biopharma Evidence Inventory and Authority-Boundary Triage review history across 3 cycles; 30 evidence observations; 6 repeated gap types; 4 owner handoff notes; 2 proposed control changes; improvement-register template.',
  1,
  '["Pharma / Biotech / MedTech","Advanced Biopharma Evidence Inventory and Boundary Triage","D-002","CAP-007","L5","Cognitive; Behavioural; Compliance; Evidence; AI/Digital"]'::jsonb,
  '["Scenario Review","Evidence Check","Artifact Build","AI Coaching","Human Review","Retry and Improve","Portfolio Submission"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Advanced Biopharma Evidence Inventory and Authority-Boundary Triage recurring-risk and improvement standard Practice
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-007-L5' LIMIT 1)
   AND title = 'L5: Recurring Risk and Governance Improvement - CAP-007' LIMIT 1),
  'Advanced Biopharma Evidence Inventory and Authority-Boundary Triage recurring-risk and improvement standard Practice',
  'Complete the Advanced Biopharma Evidence Inventory and Authority-Boundary Triage recurring-risk and improvement standard using the provided actuals and explain the evidence decision in simple workplace language.',
  'Workplace scenario: During a monthly governance review, leaders notice that the same Advanced Biopharma Evidence Inventory and Authority-Boundary Triage problem keeps returning. You compare 3 review cycles, group 6 repeated gap types, identify 4 ownership handoff issues, and propose a simple evidence-control standard so the issue does not repeat. Major concepts: Advanced Biopharma Evidence Inventory and Authority-Boundary Triage governance review; recurring-risk pattern analysis across 3 cycles; control standard design; improvement register; audit-readiness logic; prevention of repeated evidence failure. Artifact structure: Sections: review-cycle comparison; repeated gap types; ownership handoff pattern; recurring-risk rating; proposed control standard; improvement action owner. Evidence to assess: Recurring-risk evidence; pattern grouping; root-cause clarity; governance practicality; improvement standard usefulness. AI support: Use AI to group recurring gaps and draft improvement wording, but validate the control standard with human review.',
  1,
  '210 minutes',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Pharm
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-007-L5' LIMIT 1),
  'B.Pharm',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Pharm Pharmaceutical Biotechnology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-007-L5' LIMIT 1),
  'M.Pharm Pharmaceutical Biotechnology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Biotechnology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-007-L5' LIMIT 1),
  'B.Sc Biotechnology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Sc Biotechnology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-007-L5' LIMIT 1),
  'M.Sc Biotechnology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech Biotechnology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-007-L5' LIMIT 1),
  'B.Tech Biotechnology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Clinical Trial Startup Records and Monitoring Action Evidence Control - Recurring Risk and Governance Improvement
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Clinical Trial Startup Records and Monitoring Action Evidence Control - Recurring Risk and Governance Improvement',
  'COURSE-CAP-008-L5',
  'The same Clinical Trial Startup Records and Monitoring Action Evidence Control evidence issue has appeared across 3 review cycles. There are 30 observations, 6 repeated gap types, and 4 unclear ownership handoffs. The learner must create a recurring-risk register and improvement standard. Course objective: Find repeated Clinical Trial Startup Records and Monitoring Action Evidence Control evidence failures; group root causes; create a recurring-risk register; propose a control improvement. Learner outcome: Learner can analyze recurring Clinical Trial Startup Records and Monitoring Action Evidence Control evidence issues and propose a governance improvement without claiming approval authority.',
  '14 hours',
  'Active',
  'Pharma / Biotech / MedTech',
  'technical',
  '["Find repeated Clinical Trial Startup Records and Monitoring Action Evidence Control evidence failures; group root causes; create a recurring-risk register; propose a control improvement.","Learner can analyze recurring Clinical Trial Startup Records and Monitoring Action Evidence Control evidence issues and propose a governance improvement without claiming approval authority.","Create Clinical Trial Startup Records and Monitoring Action Evidence Control recurring-risk and improvement standard","Assess evidence using: Recurring-risk evidence; pattern grouping; root-cause clarity; governance practicality; improvement standard usefulness."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L5: Recurring Risk and Governance Improvement - CAP-008
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-008-L5' LIMIT 1),
  'L5: Recurring Risk and Governance Improvement - CAP-008',
  'During a monthly governance review, leaders notice that the same Clinical Trial Startup Records and Monitoring Action Evidence Control problem keeps returning. You compare 3 review cycles, group 6 repeated gap types, identify 4 ownership handoff issues, and propose a simple evidence-control standard so the issue does not repeat. Required data: Clinical Trial Startup Records and Monitoring Action Evidence Control review history across 3 cycles; 30 evidence observations; 6 repeated gap types; 4 owner handoff notes; 2 proposed control changes; improvement-register template.',
  1,
  '["Pharma / Biotech / MedTech","Clinical Operations and Trial Startup Support","D-003","CAP-008","L5","Cognitive; Behavioural; Compliance; Evidence; AI/Digital"]'::jsonb,
  '["Scenario Review","Evidence Check","Artifact Build","AI Coaching","Human Review","Retry and Improve","Portfolio Submission"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Clinical Trial Startup Records and Monitoring Action Evidence Control recurring-risk and improvement standard Practice
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-008-L5' LIMIT 1)
   AND title = 'L5: Recurring Risk and Governance Improvement - CAP-008' LIMIT 1),
  'Clinical Trial Startup Records and Monitoring Action Evidence Control recurring-risk and improvement standard Practice',
  'Complete the Clinical Trial Startup Records and Monitoring Action Evidence Control recurring-risk and improvement standard using the provided actuals and explain the evidence decision in simple workplace language.',
  'Workplace scenario: During a monthly governance review, leaders notice that the same Clinical Trial Startup Records and Monitoring Action Evidence Control problem keeps returning. You compare 3 review cycles, group 6 repeated gap types, identify 4 ownership handoff issues, and propose a simple evidence-control standard so the issue does not repeat. Major concepts: Clinical Trial Startup Records and Monitoring Action Evidence Control governance review; recurring-risk pattern analysis across 3 cycles; control standard design; improvement register; audit-readiness logic; prevention of repeated evidence failure. Artifact structure: Sections: review-cycle comparison; repeated gap types; ownership handoff pattern; recurring-risk rating; proposed control standard; improvement action owner. Evidence to assess: Recurring-risk evidence; pattern grouping; root-cause clarity; governance practicality; improvement standard usefulness. AI support: Use AI to group recurring gaps and draft improvement wording, but validate the control standard with human review.',
  1,
  '210 minutes',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Pharm
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-008-L5' LIMIT 1),
  'B.Pharm',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: Pharm.D
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-008-L5' LIMIT 1),
  'Pharm.D',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Clinical Research
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-008-L5' LIMIT 1),
  'B.Sc Clinical Research',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Sc Clinical Research
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-008-L5' LIMIT 1),
  'M.Sc Clinical Research',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Life Sciences
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-008-L5' LIMIT 1),
  'B.Sc Life Sciences',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Pharmacovigilance ICSR and Safety Evidence Handling - Recurring Risk and Governance Improvement
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Pharmacovigilance ICSR and Safety Evidence Handling - Recurring Risk and Governance Improvement',
  'COURSE-CAP-009-L5',
  'The same Pharmacovigilance ICSR and Safety Evidence Handling evidence issue has appeared across 3 review cycles. There are 30 observations, 6 repeated gap types, and 4 unclear ownership handoffs. The learner must create a recurring-risk register and improvement standard. Course objective: Find repeated Pharmacovigilance ICSR and Safety Evidence Handling evidence failures; group root causes; create a recurring-risk register; propose a control improvement. Learner outcome: Learner can analyze recurring Pharmacovigilance ICSR and Safety Evidence Handling evidence issues and propose a governance improvement without claiming approval authority.',
  '14 hours',
  'Active',
  'Pharma / Biotech / MedTech',
  'technical',
  '["Find repeated Pharmacovigilance ICSR and Safety Evidence Handling evidence failures; group root causes; create a recurring-risk register; propose a control improvement.","Learner can analyze recurring Pharmacovigilance ICSR and Safety Evidence Handling evidence issues and propose a governance improvement without claiming approval authority.","Create Pharmacovigilance ICSR and Safety Evidence Handling recurring-risk and improvement standard","Assess evidence using: Recurring-risk evidence; pattern grouping; root-cause clarity; governance practicality; improvement standard usefulness."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L5: Recurring Risk and Governance Improvement - CAP-009
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-009-L5' LIMIT 1),
  'L5: Recurring Risk and Governance Improvement - CAP-009',
  'During a monthly governance review, leaders notice that the same Pharmacovigilance ICSR and Safety Evidence Handling problem keeps returning. You compare 3 review cycles, group 6 repeated gap types, identify 4 ownership handoff issues, and propose a simple evidence-control standard so the issue does not repeat. Required data: Pharmacovigilance ICSR and Safety Evidence Handling review history across 3 cycles; 30 evidence observations; 6 repeated gap types; 4 owner handoff notes; 2 proposed control changes; improvement-register template.',
  1,
  '["Pharma / Biotech / MedTech","Pharmacovigilance and Medical Safety Evidence Operations","D-003","CAP-009","L5","Cognitive; Behavioural; Compliance; Evidence; AI/Digital"]'::jsonb,
  '["Scenario Review","Evidence Check","Artifact Build","AI Coaching","Human Review","Retry and Improve","Portfolio Submission"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Pharmacovigilance ICSR and Safety Evidence Handling recurring-risk and improvement standard Practice
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-009-L5' LIMIT 1)
   AND title = 'L5: Recurring Risk and Governance Improvement - CAP-009' LIMIT 1),
  'Pharmacovigilance ICSR and Safety Evidence Handling recurring-risk and improvement standard Practice',
  'Complete the Pharmacovigilance ICSR and Safety Evidence Handling recurring-risk and improvement standard using the provided actuals and explain the evidence decision in simple workplace language.',
  'Workplace scenario: During a monthly governance review, leaders notice that the same Pharmacovigilance ICSR and Safety Evidence Handling problem keeps returning. You compare 3 review cycles, group 6 repeated gap types, identify 4 ownership handoff issues, and propose a simple evidence-control standard so the issue does not repeat. Major concepts: Pharmacovigilance ICSR and Safety Evidence Handling governance review; recurring-risk pattern analysis across 3 cycles; control standard design; improvement register; audit-readiness logic; prevention of repeated evidence failure. Artifact structure: Sections: review-cycle comparison; repeated gap types; ownership handoff pattern; recurring-risk rating; proposed control standard; improvement action owner. Evidence to assess: Recurring-risk evidence; pattern grouping; root-cause clarity; governance practicality; improvement standard usefulness. AI support: Use AI to group recurring gaps and draft improvement wording, but validate the control standard with human review.',
  1,
  '210 minutes',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Pharm
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-009-L5' LIMIT 1),
  'B.Pharm',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: Pharm.D
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-009-L5' LIMIT 1),
  'Pharm.D',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Pharm Pharmacology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-009-L5' LIMIT 1),
  'M.Pharm Pharmacology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Life Sciences
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-009-L5' LIMIT 1),
  'B.Sc Life Sciences',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Sc Pharmacology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-009-L5' LIMIT 1),
  'M.Sc Pharmacology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Clinical Dataset Mapping, Query Reconciliation and Data-Lock Packet Control - - Recurring Risk and Governance Improvement
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Clinical Dataset Mapping, Query Reconciliation and Data-Lock Packet Control - - Recurring Risk and Governance Improvement',
  'COURSE-CAP-010-L5',
  'The same Clinical Dataset Mapping, Query Reconciliation and Data-Lock Packet Control - evidence issue has appeared across 3 review cycles. There are 30 observations, 6 repeated gap types, and 4 unclear ownership handoffs. The learner must create a recurring-risk register and improvement standard. Course objective: Find repeated Clinical Dataset Mapping, Query Reconciliation and Data-Lock Packet Control - evidence failures; group root causes; create a recurring-risk register; propose a control improvement. Learner outcome: Learner can analyze recurring Clinical Dataset Mapping, Query Reconciliation and Data-Lock Packet Control - evidence issues and propose a governance improvement without claiming approval authority.',
  '14 hours',
  'Active',
  'Pharma / Biotech / MedTech',
  'technical',
  '["Find repeated Clinical Dataset Mapping, Query Reconciliation and Data-Lock Packet Control - evidence failures; group root causes; create a recurring-risk register; propose a control improvement.","Learner can analyze recurring Clinical Dataset Mapping, Query Reconciliation and Data-Lock Packet Control - evidence issues and propose a governance improvement without claiming approval authority.","Create Clinical Dataset Mapping, Query Reconciliation and Data-Lock Packet Control - recurring-risk and improvement standard","Assess evidence using: Recurring-risk evidence; pattern grouping; root-cause clarity; governance practicality; improvement standard usefulness."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L5: Recurring Risk and Governance Improvement - CAP-010
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-010-L5' LIMIT 1),
  'L5: Recurring Risk and Governance Improvement - CAP-010',
  'During a monthly governance review, leaders notice that the same Clinical Dataset Mapping, Query Reconciliation and Data-Lock Packet Control - problem keeps returning. You compare 3 review cycles, group 6 repeated gap types, identify 4 ownership handoff issues, and propose a simple evidence-control standard so the issue does not repeat. Required data: Clinical Dataset Mapping, Query Reconciliation and Data-Lock Packet Control - review history across 3 cycles; 30 evidence observations; 6 repeated gap types; 4 owner handoff notes; 2 proposed control changes; improvement-register template.',
  1,
  '["Pharma / Biotech / MedTech","Clinical Documentation and Data Services Support","D-003","CAP-010","L5","Cognitive; Behavioural; Compliance; Evidence; AI/Digital"]'::jsonb,
  '["Scenario Review","Evidence Check","Artifact Build","AI Coaching","Human Review","Retry and Improve","Portfolio Submission"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Clinical Dataset Mapping, Query Reconciliation and Data-Lock Packet Control - recurring-risk and improvement standard Practice
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-010-L5' LIMIT 1)
   AND title = 'L5: Recurring Risk and Governance Improvement - CAP-010' LIMIT 1),
  'Clinical Dataset Mapping, Query Reconciliation and Data-Lock Packet Control - recurring-risk and improvement standard Practice',
  'Complete the Clinical Dataset Mapping, Query Reconciliation and Data-Lock Packet Control - recurring-risk and improvement standard using the provided actuals and explain the evidence decision in simple workplace language.',
  'Workplace scenario: During a monthly governance review, leaders notice that the same Clinical Dataset Mapping, Query Reconciliation and Data-Lock Packet Control - problem keeps returning. You compare 3 review cycles, group 6 repeated gap types, identify 4 ownership handoff issues, and propose a simple evidence-control standard so the issue does not repeat. Major concepts: Clinical Dataset Mapping, Query Reconciliation and Data-Lock Packet Control - governance review; recurring-risk pattern analysis across 3 cycles; control standard design; improvement register; audit-readiness logic; prevention of repeated evidence failure. Artifact structure: Sections: review-cycle comparison; repeated gap types; ownership handoff pattern; recurring-risk rating; proposed control standard; improvement action owner. Evidence to assess: Recurring-risk evidence; pattern grouping; root-cause clarity; governance practicality; improvement standard usefulness. AI support: Use AI to group recurring gaps and draft improvement wording, but validate the control standard with human review.',
  1,
  '210 minutes',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Pharm
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-010-L5' LIMIT 1),
  'B.Pharm',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Clinical Research
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-010-L5' LIMIT 1),
  'B.Sc Clinical Research',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Statistics
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-010-L5' LIMIT 1),
  'B.Sc Statistics',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Life Sciences
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-010-L5' LIMIT 1),
  'B.Sc Life Sciences',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Sc Clinical Data Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-010-L5' LIMIT 1),
  'M.Sc Clinical Data Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: NGS Run QC, Variant Calling and Genomics Reporting - Recurring Risk and Governance Improvement
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'NGS Run QC, Variant Calling and Genomics Reporting - Recurring Risk and Governance Improvement',
  'COURSE-CAP-011-L5',
  'The same NGS Run QC, Variant Calling and Genomics Reporting evidence issue has appeared across 3 review cycles. There are 30 observations, 6 repeated gap types, and 4 unclear ownership handoffs. The learner must create a recurring-risk register and improvement standard. Course objective: Find repeated NGS Run QC, Variant Calling and Genomics Reporting evidence failures; group root causes; create a recurring-risk register; propose a control improvement. Learner outcome: Learner can analyze recurring NGS Run QC, Variant Calling and Genomics Reporting evidence issues and propose a governance improvement without claiming approval authority.',
  '14 hours',
  'Active',
  'Pharma / Biotech / MedTech',
  'technical',
  '["Find repeated NGS Run QC, Variant Calling and Genomics Reporting evidence failures; group root causes; create a recurring-risk register; propose a control improvement.","Learner can analyze recurring NGS Run QC, Variant Calling and Genomics Reporting evidence issues and propose a governance improvement without claiming approval authority.","Create NGS Run QC, Variant Calling and Genomics Reporting recurring-risk and improvement standard","Assess evidence using: Recurring-risk evidence; pattern grouping; root-cause clarity; governance practicality; improvement standard usefulness."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L5: Recurring Risk and Governance Improvement - CAP-011
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-011-L5' LIMIT 1),
  'L5: Recurring Risk and Governance Improvement - CAP-011',
  'During a monthly governance review, leaders notice that the same NGS Run QC, Variant Calling and Genomics Reporting problem keeps returning. You compare 3 review cycles, group 6 repeated gap types, identify 4 ownership handoff issues, and propose a simple evidence-control standard so the issue does not repeat. Required data: NGS Run QC, Variant Calling and Genomics Reporting review history across 3 cycles; 30 evidence observations; 6 repeated gap types; 4 owner handoff notes; 2 proposed control changes; improvement-register template.',
  1,
  '["Pharma / Biotech / MedTech","Bioinformatics and Genomics Analysis Services","D-004","CAP-011","L5","Cognitive; Behavioural; Compliance; Evidence; AI/Digital"]'::jsonb,
  '["Scenario Review","Evidence Check","Artifact Build","AI Coaching","Human Review","Retry and Improve","Portfolio Submission"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: NGS Run QC, Variant Calling and Genomics Reporting recurring-risk and improvement standard Practice
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-011-L5' LIMIT 1)
   AND title = 'L5: Recurring Risk and Governance Improvement - CAP-011' LIMIT 1),
  'NGS Run QC, Variant Calling and Genomics Reporting recurring-risk and improvement standard Practice',
  'Complete the NGS Run QC, Variant Calling and Genomics Reporting recurring-risk and improvement standard using the provided actuals and explain the evidence decision in simple workplace language.',
  'Workplace scenario: During a monthly governance review, leaders notice that the same NGS Run QC, Variant Calling and Genomics Reporting problem keeps returning. You compare 3 review cycles, group 6 repeated gap types, identify 4 ownership handoff issues, and propose a simple evidence-control standard so the issue does not repeat. Major concepts: NGS Run QC, Variant Calling and Genomics Reporting governance review; recurring-risk pattern analysis across 3 cycles; control standard design; improvement register; audit-readiness logic; prevention of repeated evidence failure. Artifact structure: Sections: review-cycle comparison; repeated gap types; ownership handoff pattern; recurring-risk rating; proposed control standard; improvement action owner. Evidence to assess: Recurring-risk evidence; pattern grouping; root-cause clarity; governance practicality; improvement standard usefulness. AI support: Use AI to group recurring gaps and draft improvement wording, but validate the control standard with human review.',
  1,
  '210 minutes',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Bioinformatics
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-011-L5' LIMIT 1),
  'B.Sc Bioinformatics',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Sc Bioinformatics
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-011-L5' LIMIT 1),
  'M.Sc Bioinformatics',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech Biotechnology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-011-L5' LIMIT 1),
  'B.Tech Biotechnology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Biotechnology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-011-L5' LIMIT 1),
  'B.Sc Biotechnology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Sc Genomics
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-011-L5' LIMIT 1),
  'M.Sc Genomics',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Bioservices Sample Result, Assay Run and Research Tool Lot Evidence Control - - Recurring Risk and Governance Improvement
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Bioservices Sample Result, Assay Run and Research Tool Lot Evidence Control - - Recurring Risk and Governance Improvement',
  'COURSE-CAP-012-L5',
  'The same Bioservices Sample Result, Assay Run and Research Tool Lot Evidence Control - evidence issue has appeared across 3 review cycles. There are 30 observations, 6 repeated gap types, and 4 unclear ownership handoffs. The learner must create a recurring-risk register and improvement standard. Course objective: Find repeated Bioservices Sample Result, Assay Run and Research Tool Lot Evidence Control - evidence failures; group root causes; create a recurring-risk register; propose a control improvement. Learner outcome: Learner can analyze recurring Bioservices Sample Result, Assay Run and Research Tool Lot Evidence Control - evidence issues and propose a governance improvement without claiming approval authority.',
  '14 hours',
  'Active',
  'Pharma / Biotech / MedTech',
  'technical',
  '["Find repeated Bioservices Sample Result, Assay Run and Research Tool Lot Evidence Control - evidence failures; group root causes; create a recurring-risk register; propose a control improvement.","Learner can analyze recurring Bioservices Sample Result, Assay Run and Research Tool Lot Evidence Control - evidence issues and propose a governance improvement without claiming approval authority.","Create Bioservices Sample Result, Assay Run and Research Tool Lot Evidence Control - recurring-risk and improvement standard","Assess evidence using: Recurring-risk evidence; pattern grouping; root-cause clarity; governance practicality; improvement standard usefulness."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L5: Recurring Risk and Governance Improvement - CAP-012
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-012-L5' LIMIT 1),
  'L5: Recurring Risk and Governance Improvement - CAP-012',
  'During a monthly governance review, leaders notice that the same Bioservices Sample Result, Assay Run and Research Tool Lot Evidence Control - problem keeps returning. You compare 3 review cycles, group 6 repeated gap types, identify 4 ownership handoff issues, and propose a simple evidence-control standard so the issue does not repeat. Required data: Bioservices Sample Result, Assay Run and Research Tool Lot Evidence Control - review history across 3 cycles; 30 evidence observations; 6 repeated gap types; 4 owner handoff notes; 2 proposed control changes; improvement-register template.',
  1,
  '["Pharma / Biotech / MedTech","Wet-Lab Bioservices and Research Tool Support","D-004","CAP-012","L5","Cognitive; Behavioural; Compliance; Evidence; AI/Digital"]'::jsonb,
  '["Scenario Review","Evidence Check","Artifact Build","AI Coaching","Human Review","Retry and Improve","Portfolio Submission"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Bioservices Sample Result, Assay Run and Research Tool Lot Evidence Control - recurring-risk and improvement standard Practice
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-012-L5' LIMIT 1)
   AND title = 'L5: Recurring Risk and Governance Improvement - CAP-012' LIMIT 1),
  'Bioservices Sample Result, Assay Run and Research Tool Lot Evidence Control - recurring-risk and improvement standard Practice',
  'Complete the Bioservices Sample Result, Assay Run and Research Tool Lot Evidence Control - recurring-risk and improvement standard using the provided actuals and explain the evidence decision in simple workplace language.',
  'Workplace scenario: During a monthly governance review, leaders notice that the same Bioservices Sample Result, Assay Run and Research Tool Lot Evidence Control - problem keeps returning. You compare 3 review cycles, group 6 repeated gap types, identify 4 ownership handoff issues, and propose a simple evidence-control standard so the issue does not repeat. Major concepts: Bioservices Sample Result, Assay Run and Research Tool Lot Evidence Control - governance review; recurring-risk pattern analysis across 3 cycles; control standard design; improvement register; audit-readiness logic; prevention of repeated evidence failure. Artifact structure: Sections: review-cycle comparison; repeated gap types; ownership handoff pattern; recurring-risk rating; proposed control standard; improvement action owner. Evidence to assess: Recurring-risk evidence; pattern grouping; root-cause clarity; governance practicality; improvement standard usefulness. AI support: Use AI to group recurring gaps and draft improvement wording, but validate the control standard with human review.',
  1,
  '210 minutes',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Biotechnology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-012-L5' LIMIT 1),
  'B.Sc Biotechnology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Sc Biotechnology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-012-L5' LIMIT 1),
  'M.Sc Biotechnology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Microbiology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-012-L5' LIMIT 1),
  'B.Sc Microbiology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Sc Biochemistry
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-012-L5' LIMIT 1),
  'M.Sc Biochemistry',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Life Sciences
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-012-L5' LIMIT 1),
  'B.Sc Life Sciences',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Biofoundry DBTL Cycle Evidence Execution - Recurring Risk and Governance Improvement
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Biofoundry DBTL Cycle Evidence Execution - Recurring Risk and Governance Improvement',
  'COURSE-CAP-013-L5',
  'The same Biofoundry DBTL Cycle Evidence Execution evidence issue has appeared across 3 review cycles. There are 30 observations, 6 repeated gap types, and 4 unclear ownership handoffs. The learner must create a recurring-risk register and improvement standard. Course objective: Find repeated Biofoundry DBTL Cycle Evidence Execution evidence failures; group root causes; create a recurring-risk register; propose a control improvement. Learner outcome: Learner can analyze recurring Biofoundry DBTL Cycle Evidence Execution evidence issues and propose a governance improvement without claiming approval authority.',
  '14 hours',
  'Active',
  'Pharma / Biotech / MedTech',
  'technical',
  '["Find repeated Biofoundry DBTL Cycle Evidence Execution evidence failures; group root causes; create a recurring-risk register; propose a control improvement.","Learner can analyze recurring Biofoundry DBTL Cycle Evidence Execution evidence issues and propose a governance improvement without claiming approval authority.","Create Biofoundry DBTL Cycle Evidence Execution recurring-risk and improvement standard","Assess evidence using: Recurring-risk evidence; pattern grouping; root-cause clarity; governance practicality; improvement standard usefulness."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L5: Recurring Risk and Governance Improvement - CAP-013
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-013-L5' LIMIT 1),
  'L5: Recurring Risk and Governance Improvement - CAP-013',
  'During a monthly governance review, leaders notice that the same Biofoundry DBTL Cycle Evidence Execution problem keeps returning. You compare 3 review cycles, group 6 repeated gap types, identify 4 ownership handoff issues, and propose a simple evidence-control standard so the issue does not repeat. Required data: Biofoundry DBTL Cycle Evidence Execution review history across 3 cycles; 30 evidence observations; 6 repeated gap types; 4 owner handoff notes; 2 proposed control changes; improvement-register template.',
  1,
  '["Pharma / Biotech / MedTech","Industrial Biomanufacturing and Biofoundry Operations","D-005","CAP-013","L5","Cognitive; Behavioural; Compliance; Evidence; AI/Digital"]'::jsonb,
  '["Scenario Review","Evidence Check","Artifact Build","AI Coaching","Human Review","Retry and Improve","Portfolio Submission"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Biofoundry DBTL Cycle Evidence Execution recurring-risk and improvement standard Practice
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-013-L5' LIMIT 1)
   AND title = 'L5: Recurring Risk and Governance Improvement - CAP-013' LIMIT 1),
  'Biofoundry DBTL Cycle Evidence Execution recurring-risk and improvement standard Practice',
  'Complete the Biofoundry DBTL Cycle Evidence Execution recurring-risk and improvement standard using the provided actuals and explain the evidence decision in simple workplace language.',
  'Workplace scenario: During a monthly governance review, leaders notice that the same Biofoundry DBTL Cycle Evidence Execution problem keeps returning. You compare 3 review cycles, group 6 repeated gap types, identify 4 ownership handoff issues, and propose a simple evidence-control standard so the issue does not repeat. Major concepts: Biofoundry DBTL Cycle Evidence Execution governance review; recurring-risk pattern analysis across 3 cycles; control standard design; improvement register; audit-readiness logic; prevention of repeated evidence failure. Artifact structure: Sections: review-cycle comparison; repeated gap types; ownership handoff pattern; recurring-risk rating; proposed control standard; improvement action owner. Evidence to assess: Recurring-risk evidence; pattern grouping; root-cause clarity; governance practicality; improvement standard usefulness. AI support: Use AI to group recurring gaps and draft improvement wording, but validate the control standard with human review.',
  1,
  '210 minutes',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech Biotechnology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-013-L5' LIMIT 1),
  'B.Tech Biotechnology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Tech Biotechnology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-013-L5' LIMIT 1),
  'M.Tech Biotechnology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Biotechnology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-013-L5' LIMIT 1),
  'B.Sc Biotechnology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Sc Synthetic Biology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-013-L5' LIMIT 1),
  'M.Sc Synthetic Biology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Sc Industrial Biotechnology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-013-L5' LIMIT 1),
  'M.Sc Industrial Biotechnology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Industrial Bioprocess Scale-Up and Product Evidence Handoff - Recurring Risk and Governance Improvement
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Industrial Bioprocess Scale-Up and Product Evidence Handoff - Recurring Risk and Governance Improvement',
  'COURSE-CAP-014-L5',
  'The same Industrial Bioprocess Scale-Up and Product Evidence Handoff evidence issue has appeared across 3 review cycles. There are 30 observations, 6 repeated gap types, and 4 unclear ownership handoffs. The learner must create a recurring-risk register and improvement standard. Course objective: Find repeated Industrial Bioprocess Scale-Up and Product Evidence Handoff evidence failures; group root causes; create a recurring-risk register; propose a control improvement. Learner outcome: Learner can analyze recurring Industrial Bioprocess Scale-Up and Product Evidence Handoff evidence issues and propose a governance improvement without claiming approval authority.',
  '14 hours',
  'Active',
  'Pharma / Biotech / MedTech',
  'technical',
  '["Find repeated Industrial Bioprocess Scale-Up and Product Evidence Handoff evidence failures; group root causes; create a recurring-risk register; propose a control improvement.","Learner can analyze recurring Industrial Bioprocess Scale-Up and Product Evidence Handoff evidence issues and propose a governance improvement without claiming approval authority.","Create Industrial Bioprocess Scale-Up and Product Evidence Handoff recurring-risk and improvement standard","Assess evidence using: Recurring-risk evidence; pattern grouping; root-cause clarity; governance practicality; improvement standard usefulness."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L5: Recurring Risk and Governance Improvement - CAP-014
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-014-L5' LIMIT 1),
  'L5: Recurring Risk and Governance Improvement - CAP-014',
  'During a monthly governance review, leaders notice that the same Industrial Bioprocess Scale-Up and Product Evidence Handoff problem keeps returning. You compare 3 review cycles, group 6 repeated gap types, identify 4 ownership handoff issues, and propose a simple evidence-control standard so the issue does not repeat. Required data: Industrial Bioprocess Scale-Up and Product Evidence Handoff review history across 3 cycles; 30 evidence observations; 6 repeated gap types; 4 owner handoff notes; 2 proposed control changes; improvement-register template.',
  1,
  '["Pharma / Biotech / MedTech","Industrial Biomanufacturing and Biofoundry Operations","D-005","CAP-014","L5","Cognitive; Behavioural; Compliance; Evidence; AI/Digital"]'::jsonb,
  '["Scenario Review","Evidence Check","Artifact Build","AI Coaching","Human Review","Retry and Improve","Portfolio Submission"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Industrial Bioprocess Scale-Up and Product Evidence Handoff recurring-risk and improvement standard Practice
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-014-L5' LIMIT 1)
   AND title = 'L5: Recurring Risk and Governance Improvement - CAP-014' LIMIT 1),
  'Industrial Bioprocess Scale-Up and Product Evidence Handoff recurring-risk and improvement standard Practice',
  'Complete the Industrial Bioprocess Scale-Up and Product Evidence Handoff recurring-risk and improvement standard using the provided actuals and explain the evidence decision in simple workplace language.',
  'Workplace scenario: During a monthly governance review, leaders notice that the same Industrial Bioprocess Scale-Up and Product Evidence Handoff problem keeps returning. You compare 3 review cycles, group 6 repeated gap types, identify 4 ownership handoff issues, and propose a simple evidence-control standard so the issue does not repeat. Major concepts: Industrial Bioprocess Scale-Up and Product Evidence Handoff governance review; recurring-risk pattern analysis across 3 cycles; control standard design; improvement register; audit-readiness logic; prevention of repeated evidence failure. Artifact structure: Sections: review-cycle comparison; repeated gap types; ownership handoff pattern; recurring-risk rating; proposed control standard; improvement action owner. Evidence to assess: Recurring-risk evidence; pattern grouping; root-cause clarity; governance practicality; improvement standard usefulness. AI support: Use AI to group recurring gaps and draft improvement wording, but validate the control standard with human review.',
  1,
  '210 minutes',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech Biotechnology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-014-L5' LIMIT 1),
  'B.Tech Biotechnology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Tech Bioprocess Engineering
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-014-L5' LIMIT 1),
  'M.Tech Bioprocess Engineering',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Biotechnology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-014-L5' LIMIT 1),
  'B.Sc Biotechnology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Sc Industrial Biotechnology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-014-L5' LIMIT 1),
  'M.Sc Industrial Biotechnology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Pharm
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-014-L5' LIMIT 1),
  'B.Pharm',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Agri-Biotech Trait, Field Trial and Stewardship Evidence Packet Control - Recurring Risk and Governance Improvement
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Agri-Biotech Trait, Field Trial and Stewardship Evidence Packet Control - Recurring Risk and Governance Improvement',
  'COURSE-CAP-015-L5',
  'The same Agri-Biotech Trait, Field Trial and Stewardship Evidence Packet Control evidence issue has appeared across 3 review cycles. There are 30 observations, 6 repeated gap types, and 4 unclear ownership handoffs. The learner must create a recurring-risk register and improvement standard. Course objective: Find repeated Agri-Biotech Trait, Field Trial and Stewardship Evidence Packet Control evidence failures; group root causes; create a recurring-risk register; propose a control improvement. Learner outcome: Learner can analyze recurring Agri-Biotech Trait, Field Trial and Stewardship Evidence Packet Control evidence issues and propose a governance improvement without claiming approval authority.',
  '14 hours',
  'Active',
  'Pharma / Biotech / MedTech',
  'technical',
  '["Find repeated Agri-Biotech Trait, Field Trial and Stewardship Evidence Packet Control evidence failures; group root causes; create a recurring-risk register; propose a control improvement.","Learner can analyze recurring Agri-Biotech Trait, Field Trial and Stewardship Evidence Packet Control evidence issues and propose a governance improvement without claiming approval authority.","Create Agri-Biotech Trait, Field Trial and Stewardship Evidence Packet Control recurring-risk and improvement standard","Assess evidence using: Recurring-risk evidence; pattern grouping; root-cause clarity; governance practicality; improvement standard usefulness."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L5: Recurring Risk and Governance Improvement - CAP-015
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-015-L5' LIMIT 1),
  'L5: Recurring Risk and Governance Improvement - CAP-015',
  'During a monthly governance review, leaders notice that the same Agri-Biotech Trait, Field Trial and Stewardship Evidence Packet Control problem keeps returning. You compare 3 review cycles, group 6 repeated gap types, identify 4 ownership handoff issues, and propose a simple evidence-control standard so the issue does not repeat. Required data: Agri-Biotech Trait, Field Trial and Stewardship Evidence Packet Control review history across 3 cycles; 30 evidence observations; 6 repeated gap types; 4 owner handoff notes; 2 proposed control changes; improvement-register template.',
  1,
  '["Pharma / Biotech / MedTech","Agri-Biotech and Seed Biotechnology Affairs","D-006","CAP-015","L5","Cognitive; Behavioural; Compliance; Evidence; AI/Digital"]'::jsonb,
  '["Scenario Review","Evidence Check","Artifact Build","AI Coaching","Human Review","Retry and Improve","Portfolio Submission"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Agri-Biotech Trait, Field Trial and Stewardship Evidence Packet Control recurring-risk and improvement standard Practice
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-015-L5' LIMIT 1)
   AND title = 'L5: Recurring Risk and Governance Improvement - CAP-015' LIMIT 1),
  'Agri-Biotech Trait, Field Trial and Stewardship Evidence Packet Control recurring-risk and improvement standard Practice',
  'Complete the Agri-Biotech Trait, Field Trial and Stewardship Evidence Packet Control recurring-risk and improvement standard using the provided actuals and explain the evidence decision in simple workplace language.',
  'Workplace scenario: During a monthly governance review, leaders notice that the same Agri-Biotech Trait, Field Trial and Stewardship Evidence Packet Control problem keeps returning. You compare 3 review cycles, group 6 repeated gap types, identify 4 ownership handoff issues, and propose a simple evidence-control standard so the issue does not repeat. Major concepts: Agri-Biotech Trait, Field Trial and Stewardship Evidence Packet Control governance review; recurring-risk pattern analysis across 3 cycles; control standard design; improvement register; audit-readiness logic; prevention of repeated evidence failure. Artifact structure: Sections: review-cycle comparison; repeated gap types; ownership handoff pattern; recurring-risk rating; proposed control standard; improvement action owner. Evidence to assess: Recurring-risk evidence; pattern grouping; root-cause clarity; governance practicality; improvement standard usefulness. AI support: Use AI to group recurring gaps and draft improvement wording, but validate the control standard with human review.',
  1,
  '210 minutes',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Agriculture
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-015-L5' LIMIT 1),
  'B.Sc Agriculture',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Sc Plant Biotechnology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-015-L5' LIMIT 1),
  'M.Sc Plant Biotechnology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Biotechnology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-015-L5' LIMIT 1),
  'B.Sc Biotechnology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Sc Genetics and Plant Breeding
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-015-L5' LIMIT 1),
  'M.Sc Genetics and Plant Breeding',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech Biotechnology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-015-L5' LIMIT 1),
  'B.Tech Biotechnology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Agri-Biotech License-to-Operate Evidence Coordination - Recurring Risk and Governance Improvement
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Agri-Biotech License-to-Operate Evidence Coordination - Recurring Risk and Governance Improvement',
  'COURSE-CAP-016-L5',
  'The same Agri-Biotech License-to-Operate Evidence Coordination evidence issue has appeared across 3 review cycles. There are 30 observations, 6 repeated gap types, and 4 unclear ownership handoffs. The learner must create a recurring-risk register and improvement standard. Course objective: Find repeated Agri-Biotech License-to-Operate Evidence Coordination evidence failures; group root causes; create a recurring-risk register; propose a control improvement. Learner outcome: Learner can analyze recurring Agri-Biotech License-to-Operate Evidence Coordination evidence issues and propose a governance improvement without claiming approval authority.',
  '14 hours',
  'Active',
  'Pharma / Biotech / MedTech',
  'technical',
  '["Find repeated Agri-Biotech License-to-Operate Evidence Coordination evidence failures; group root causes; create a recurring-risk register; propose a control improvement.","Learner can analyze recurring Agri-Biotech License-to-Operate Evidence Coordination evidence issues and propose a governance improvement without claiming approval authority.","Create Agri-Biotech License-to-Operate Evidence Coordination recurring-risk and improvement standard","Assess evidence using: Recurring-risk evidence; pattern grouping; root-cause clarity; governance practicality; improvement standard usefulness."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L5: Recurring Risk and Governance Improvement - CAP-016
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-016-L5' LIMIT 1),
  'L5: Recurring Risk and Governance Improvement - CAP-016',
  'During a monthly governance review, leaders notice that the same Agri-Biotech License-to-Operate Evidence Coordination problem keeps returning. You compare 3 review cycles, group 6 repeated gap types, identify 4 ownership handoff issues, and propose a simple evidence-control standard so the issue does not repeat. Required data: Agri-Biotech License-to-Operate Evidence Coordination review history across 3 cycles; 30 evidence observations; 6 repeated gap types; 4 owner handoff notes; 2 proposed control changes; improvement-register template.',
  1,
  '["Pharma / Biotech / MedTech","Agri-Biotech and Seed Biotechnology Affairs","D-006","CAP-016","L5","Cognitive; Behavioural; Compliance; Evidence; AI/Digital"]'::jsonb,
  '["Scenario Review","Evidence Check","Artifact Build","AI Coaching","Human Review","Retry and Improve","Portfolio Submission"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Agri-Biotech License-to-Operate Evidence Coordination recurring-risk and improvement standard Practice
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-016-L5' LIMIT 1)
   AND title = 'L5: Recurring Risk and Governance Improvement - CAP-016' LIMIT 1),
  'Agri-Biotech License-to-Operate Evidence Coordination recurring-risk and improvement standard Practice',
  'Complete the Agri-Biotech License-to-Operate Evidence Coordination recurring-risk and improvement standard using the provided actuals and explain the evidence decision in simple workplace language.',
  'Workplace scenario: During a monthly governance review, leaders notice that the same Agri-Biotech License-to-Operate Evidence Coordination problem keeps returning. You compare 3 review cycles, group 6 repeated gap types, identify 4 ownership handoff issues, and propose a simple evidence-control standard so the issue does not repeat. Major concepts: Agri-Biotech License-to-Operate Evidence Coordination governance review; recurring-risk pattern analysis across 3 cycles; control standard design; improvement register; audit-readiness logic; prevention of repeated evidence failure. Artifact structure: Sections: review-cycle comparison; repeated gap types; ownership handoff pattern; recurring-risk rating; proposed control standard; improvement action owner. Evidence to assess: Recurring-risk evidence; pattern grouping; root-cause clarity; governance practicality; improvement standard usefulness. AI support: Use AI to group recurring gaps and draft improvement wording, but validate the control standard with human review.',
  1,
  '210 minutes',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Agriculture
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-016-L5' LIMIT 1),
  'B.Sc Agriculture',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Sc Agriculture Biotechnology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-016-L5' LIMIT 1),
  'M.Sc Agriculture Biotechnology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Biotechnology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-016-L5' LIMIT 1),
  'B.Sc Biotechnology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Sc Regulatory Affairs
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-016-L5' LIMIT 1),
  'M.Sc Regulatory Affairs',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech Biotechnology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-016-L5' LIMIT 1),
  'B.Tech Biotechnology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Medical Device Technical File, QMS and Post-Market Evidence Control - Recurring Risk and Governance Improvement
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Medical Device Technical File, QMS and Post-Market Evidence Control - Recurring Risk and Governance Improvement',
  'COURSE-CAP-017-L5',
  'The same Medical Device Technical File, QMS and Post-Market Evidence Control evidence issue has appeared across 3 review cycles. There are 30 observations, 6 repeated gap types, and 4 unclear ownership handoffs. The learner must create a recurring-risk register and improvement standard. Course objective: Find repeated Medical Device Technical File, QMS and Post-Market Evidence Control evidence failures; group root causes; create a recurring-risk register; propose a control improvement. Learner outcome: Learner can analyze recurring Medical Device Technical File, QMS and Post-Market Evidence Control evidence issues and propose a governance improvement without claiming approval authority.',
  '14 hours',
  'Active',
  'Pharma / Biotech / MedTech',
  'technical',
  '["Find repeated Medical Device Technical File, QMS and Post-Market Evidence Control evidence failures; group root causes; create a recurring-risk register; propose a control improvement.","Learner can analyze recurring Medical Device Technical File, QMS and Post-Market Evidence Control evidence issues and propose a governance improvement without claiming approval authority.","Create Medical Device Technical File, QMS and Post-Market Evidence Control recurring-risk and improvement standard","Assess evidence using: Recurring-risk evidence; pattern grouping; root-cause clarity; governance practicality; improvement standard usefulness."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L5: Recurring Risk and Governance Improvement - CAP-017
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-017-L5' LIMIT 1),
  'L5: Recurring Risk and Governance Improvement - CAP-017',
  'During a monthly governance review, leaders notice that the same Medical Device Technical File, QMS and Post-Market Evidence Control problem keeps returning. You compare 3 review cycles, group 6 repeated gap types, identify 4 ownership handoff issues, and propose a simple evidence-control standard so the issue does not repeat. Required data: Medical Device Technical File, QMS and Post-Market Evidence Control review history across 3 cycles; 30 evidence observations; 6 repeated gap types; 4 owner handoff notes; 2 proposed control changes; improvement-register template.',
  1,
  '["Pharma / Biotech / MedTech","Medical Device Regulatory and Quality Operations","D-007","CAP-017","L5","Cognitive; Behavioural; Compliance; Evidence; AI/Digital"]'::jsonb,
  '["Scenario Review","Evidence Check","Artifact Build","AI Coaching","Human Review","Retry and Improve","Portfolio Submission"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Medical Device Technical File, QMS and Post-Market Evidence Control recurring-risk and improvement standard Practice
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-017-L5' LIMIT 1)
   AND title = 'L5: Recurring Risk and Governance Improvement - CAP-017' LIMIT 1),
  'Medical Device Technical File, QMS and Post-Market Evidence Control recurring-risk and improvement standard Practice',
  'Complete the Medical Device Technical File, QMS and Post-Market Evidence Control recurring-risk and improvement standard using the provided actuals and explain the evidence decision in simple workplace language.',
  'Workplace scenario: During a monthly governance review, leaders notice that the same Medical Device Technical File, QMS and Post-Market Evidence Control problem keeps returning. You compare 3 review cycles, group 6 repeated gap types, identify 4 ownership handoff issues, and propose a simple evidence-control standard so the issue does not repeat. Major concepts: Medical Device Technical File, QMS and Post-Market Evidence Control governance review; recurring-risk pattern analysis across 3 cycles; control standard design; improvement register; audit-readiness logic; prevention of repeated evidence failure. Artifact structure: Sections: review-cycle comparison; repeated gap types; ownership handoff pattern; recurring-risk rating; proposed control standard; improvement action owner. Evidence to assess: Recurring-risk evidence; pattern grouping; root-cause clarity; governance practicality; improvement standard usefulness. AI support: Use AI to group recurring gaps and draft improvement wording, but validate the control standard with human review.',
  1,
  '210 minutes',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Pharm
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-017-L5' LIMIT 1),
  'B.Pharm',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Pharm Regulatory Affairs
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-017-L5' LIMIT 1),
  'M.Pharm Regulatory Affairs',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech Biomedical Engineering
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-017-L5' LIMIT 1),
  'B.Tech Biomedical Engineering',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Life Sciences
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-017-L5' LIMIT 1),
  'B.Sc Life Sciences',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Sc Medical Technology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-017-L5' LIMIT 1),
  'M.Sc Medical Technology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Device QC Test Report and Biomedical Equipment Nonconformance Packet Control - Recurring Risk and Governance Improvement
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Device QC Test Report and Biomedical Equipment Nonconformance Packet Control - Recurring Risk and Governance Improvement',
  'COURSE-CAP-018A-L5',
  'The same Device QC Test Report and Biomedical Equipment Nonconformance Packet Control evidence issue has appeared across 3 review cycles. There are 30 observations, 6 repeated gap types, and 4 unclear ownership handoffs. The learner must create a recurring-risk register and improvement standard. Course objective: Find repeated Device QC Test Report and Biomedical Equipment Nonconformance Packet Control evidence failures; group root causes; create a recurring-risk register; propose a control improvement. Learner outcome: Learner can analyze recurring Device QC Test Report and Biomedical Equipment Nonconformance Packet Control evidence issues and propose a governance improvement without claiming approval authority.',
  '14 hours',
  'Active',
  'Pharma / Biotech / MedTech',
  'technical',
  '["Find repeated Device QC Test Report and Biomedical Equipment Nonconformance Packet Control evidence failures; group root causes; create a recurring-risk register; propose a control improvement.","Learner can analyze recurring Device QC Test Report and Biomedical Equipment Nonconformance Packet Control evidence issues and propose a governance improvement without claiming approval authority.","Create Device QC Test Report and Biomedical Equipment Nonconformance Packet Control recurring-risk and improvement standard","Assess evidence using: Recurring-risk evidence; pattern grouping; root-cause clarity; governance practicality; improvement standard usefulness."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L5: Recurring Risk and Governance Improvement - CAP-018A
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-018A-L5' LIMIT 1),
  'L5: Recurring Risk and Governance Improvement - CAP-018A',
  'During a monthly governance review, leaders notice that the same Device QC Test Report and Biomedical Equipment Nonconformance Packet Control problem keeps returning. You compare 3 review cycles, group 6 repeated gap types, identify 4 ownership handoff issues, and propose a simple evidence-control standard so the issue does not repeat. Required data: Device QC Test Report and Biomedical Equipment Nonconformance Packet Control review history across 3 cycles; 30 evidence observations; 6 repeated gap types; 4 owner handoff notes; 2 proposed control changes; improvement-register template.',
  1,
  '["Pharma / Biotech / MedTech","Medical Device QC Testing and Biomedical Equipment Evidence","D-007","CAP-018A","L5","Cognitive; Behavioural; Compliance; Evidence; AI/Digital"]'::jsonb,
  '["Scenario Review","Evidence Check","Artifact Build","AI Coaching","Human Review","Retry and Improve","Portfolio Submission"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Device QC Test Report and Biomedical Equipment Nonconformance Packet Control recurring-risk and improvement standard Practice
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-018A-L5' LIMIT 1)
   AND title = 'L5: Recurring Risk and Governance Improvement - CAP-018A' LIMIT 1),
  'Device QC Test Report and Biomedical Equipment Nonconformance Packet Control recurring-risk and improvement standard Practice',
  'Complete the Device QC Test Report and Biomedical Equipment Nonconformance Packet Control recurring-risk and improvement standard using the provided actuals and explain the evidence decision in simple workplace language.',
  'Workplace scenario: During a monthly governance review, leaders notice that the same Device QC Test Report and Biomedical Equipment Nonconformance Packet Control problem keeps returning. You compare 3 review cycles, group 6 repeated gap types, identify 4 ownership handoff issues, and propose a simple evidence-control standard so the issue does not repeat. Major concepts: Device QC Test Report and Biomedical Equipment Nonconformance Packet Control governance review; recurring-risk pattern analysis across 3 cycles; control standard design; improvement register; audit-readiness logic; prevention of repeated evidence failure. Artifact structure: Sections: review-cycle comparison; repeated gap types; ownership handoff pattern; recurring-risk rating; proposed control standard; improvement action owner. Evidence to assess: Recurring-risk evidence; pattern grouping; root-cause clarity; governance practicality; improvement standard usefulness. AI support: Use AI to group recurring gaps and draft improvement wording, but validate the control standard with human review.',
  1,
  '210 minutes',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech Biomedical Engineering
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-018A-L5' LIMIT 1),
  'B.Tech Biomedical Engineering',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: Diploma Biomedical Engineering
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-018A-L5' LIMIT 1),
  'Diploma Biomedical Engineering',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Medical Laboratory Technology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-018A-L5' LIMIT 1),
  'B.Sc Medical Laboratory Technology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech Electronics and Instrumentation
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-018A-L5' LIMIT 1),
  'B.Tech Electronics and Instrumentation',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Physics
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-018A-L5' LIMIT 1),
  'B.Sc Physics',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: IVD Performance, Diagnostic Evidence and PMS Packet Control - Recurring Risk and Governance Improvement
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'IVD Performance, Diagnostic Evidence and PMS Packet Control - Recurring Risk and Governance Improvement',
  'COURSE-CAP-018B-L5',
  'The same IVD Performance, Diagnostic Evidence and PMS Packet Control evidence issue has appeared across 3 review cycles. There are 30 observations, 6 repeated gap types, and 4 unclear ownership handoffs. The learner must create a recurring-risk register and improvement standard. Course objective: Find repeated IVD Performance, Diagnostic Evidence and PMS Packet Control evidence failures; group root causes; create a recurring-risk register; propose a control improvement. Learner outcome: Learner can analyze recurring IVD Performance, Diagnostic Evidence and PMS Packet Control evidence issues and propose a governance improvement without claiming approval authority.',
  '14 hours',
  'Active',
  'Pharma / Biotech / MedTech',
  'technical',
  '["Find repeated IVD Performance, Diagnostic Evidence and PMS Packet Control evidence failures; group root causes; create a recurring-risk register; propose a control improvement.","Learner can analyze recurring IVD Performance, Diagnostic Evidence and PMS Packet Control evidence issues and propose a governance improvement without claiming approval authority.","Create IVD Performance, Diagnostic Evidence and PMS Packet Control recurring-risk and improvement standard","Assess evidence using: Recurring-risk evidence; pattern grouping; root-cause clarity; governance practicality; improvement standard usefulness."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L5: Recurring Risk and Governance Improvement - CAP-018B
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-018B-L5' LIMIT 1),
  'L5: Recurring Risk and Governance Improvement - CAP-018B',
  'During a monthly governance review, leaders notice that the same IVD Performance, Diagnostic Evidence and PMS Packet Control problem keeps returning. You compare 3 review cycles, group 6 repeated gap types, identify 4 ownership handoff issues, and propose a simple evidence-control standard so the issue does not repeat. Required data: IVD Performance, Diagnostic Evidence and PMS Packet Control review history across 3 cycles; 30 evidence observations; 6 repeated gap types; 4 owner handoff notes; 2 proposed control changes; improvement-register template.',
  1,
  '["Pharma / Biotech / MedTech","IVD Regulatory and Performance Evaluation Operations","Medical Device Softwar","D-007","CAP-018B","L5","Cognitive; Behavioural; Compliance; Evidence; AI/Digital"]'::jsonb,
  '["Scenario Review","Evidence Check","Artifact Build","AI Coaching","Human Review","Retry and Improve","Portfolio Submission"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: IVD Performance, Diagnostic Evidence and PMS Packet Control recurring-risk and improvement standard Practice
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-018B-L5' LIMIT 1)
   AND title = 'L5: Recurring Risk and Governance Improvement - CAP-018B' LIMIT 1),
  'IVD Performance, Diagnostic Evidence and PMS Packet Control recurring-risk and improvement standard Practice',
  'Complete the IVD Performance, Diagnostic Evidence and PMS Packet Control recurring-risk and improvement standard using the provided actuals and explain the evidence decision in simple workplace language.',
  'Workplace scenario: During a monthly governance review, leaders notice that the same IVD Performance, Diagnostic Evidence and PMS Packet Control problem keeps returning. You compare 3 review cycles, group 6 repeated gap types, identify 4 ownership handoff issues, and propose a simple evidence-control standard so the issue does not repeat. Major concepts: IVD Performance, Diagnostic Evidence and PMS Packet Control governance review; recurring-risk pattern analysis across 3 cycles; control standard design; improvement register; audit-readiness logic; prevention of repeated evidence failure. Artifact structure: Sections: review-cycle comparison; repeated gap types; ownership handoff pattern; recurring-risk rating; proposed control standard; improvement action owner. Evidence to assess: Recurring-risk evidence; pattern grouping; root-cause clarity; governance practicality; improvement standard usefulness. AI support: Use AI to group recurring gaps and draft improvement wording, but validate the control standard with human review.',
  1,
  '210 minutes',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Medical Laboratory Technology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-018B-L5' LIMIT 1),
  'B.Sc Medical Laboratory Technology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Sc Clinical Biochemistry
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-018B-L5' LIMIT 1),
  'M.Sc Clinical Biochemistry',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Sc Microbiology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-018B-L5' LIMIT 1),
  'M.Sc Microbiology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech Biotechnology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-018B-L5' LIMIT 1),
  'B.Tech Biotechnology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Biotechnology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-018B-L5' LIMIT 1),
  'B.Sc Biotechnology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: SaMD Lifecycle, V&V and Cybersecurity Evidence Index Control - Recurring Risk and Governance Improvement
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'SaMD Lifecycle, V&V and Cybersecurity Evidence Index Control - Recurring Risk and Governance Improvement',
  'COURSE-CAP-018C-L5',
  'The same SaMD Lifecycle, V&V and Cybersecurity Evidence Index Control evidence issue has appeared across 3 review cycles. There are 30 observations, 6 repeated gap types, and 4 unclear ownership handoffs. The learner must create a recurring-risk register and improvement standard. Course objective: Find repeated SaMD Lifecycle, V&V and Cybersecurity Evidence Index Control evidence failures; group root causes; create a recurring-risk register; propose a control improvement. Learner outcome: Learner can analyze recurring SaMD Lifecycle, V&V and Cybersecurity Evidence Index Control evidence issues and propose a governance improvement without claiming approval authority.',
  '14 hours',
  'Active',
  'Pharma / Biotech / MedTech',
  'technical',
  '["Find repeated SaMD Lifecycle, V&V and Cybersecurity Evidence Index Control evidence failures; group root causes; create a recurring-risk register; propose a control improvement.","Learner can analyze recurring SaMD Lifecycle, V&V and Cybersecurity Evidence Index Control evidence issues and propose a governance improvement without claiming approval authority.","Create SaMD Lifecycle, V&V and Cybersecurity Evidence Index Control recurring-risk and improvement standard","Assess evidence using: Recurring-risk evidence; pattern grouping; root-cause clarity; governance practicality; improvement standard usefulness."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L5: Recurring Risk and Governance Improvement - CAP-018C
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-018C-L5' LIMIT 1),
  'L5: Recurring Risk and Governance Improvement - CAP-018C',
  'During a monthly governance review, leaders notice that the same SaMD Lifecycle, V&V and Cybersecurity Evidence Index Control problem keeps returning. You compare 3 review cycles, group 6 repeated gap types, identify 4 ownership handoff issues, and propose a simple evidence-control standard so the issue does not repeat. Required data: SaMD Lifecycle, V&V and Cybersecurity Evidence Index Control review history across 3 cycles; 30 evidence observations; 6 repeated gap types; 4 owner handoff notes; 2 proposed control changes; improvement-register template.',
  1,
  '["Pharma / Biotech / MedTech","Medical Device Software QARA and Digital Product Evidence","D-007","CAP-018C","L5","Cognitive; Behavioural; Compliance; Evidence; AI/Digital"]'::jsonb,
  '["Scenario Review","Evidence Check","Artifact Build","AI Coaching","Human Review","Retry and Improve","Portfolio Submission"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: SaMD Lifecycle, V&V and Cybersecurity Evidence Index Control recurring-risk and improvement standard Practice
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-018C-L5' LIMIT 1)
   AND title = 'L5: Recurring Risk and Governance Improvement - CAP-018C' LIMIT 1),
  'SaMD Lifecycle, V&V and Cybersecurity Evidence Index Control recurring-risk and improvement standard Practice',
  'Complete the SaMD Lifecycle, V&V and Cybersecurity Evidence Index Control recurring-risk and improvement standard using the provided actuals and explain the evidence decision in simple workplace language.',
  'Workplace scenario: During a monthly governance review, leaders notice that the same SaMD Lifecycle, V&V and Cybersecurity Evidence Index Control problem keeps returning. You compare 3 review cycles, group 6 repeated gap types, identify 4 ownership handoff issues, and propose a simple evidence-control standard so the issue does not repeat. Major concepts: SaMD Lifecycle, V&V and Cybersecurity Evidence Index Control governance review; recurring-risk pattern analysis across 3 cycles; control standard design; improvement register; audit-readiness logic; prevention of repeated evidence failure. Artifact structure: Sections: review-cycle comparison; repeated gap types; ownership handoff pattern; recurring-risk rating; proposed control standard; improvement action owner. Evidence to assess: Recurring-risk evidence; pattern grouping; root-cause clarity; governance practicality; improvement standard usefulness. AI support: Use AI to group recurring gaps and draft improvement wording, but validate the control standard with human review.',
  1,
  '210 minutes',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech Biomedical Engineering
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-018C-L5' LIMIT 1),
  'B.Tech Biomedical Engineering',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech Computer Science
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-018C-L5' LIMIT 1),
  'B.Tech Computer Science',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech Information Technology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-018C-L5' LIMIT 1),
  'B.Tech Information Technology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Sc Health Informatics
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-018C-L5' LIMIT 1),
  'M.Sc Health Informatics',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Tech Medical Software Systems
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-018C-L5' LIMIT 1),
  'M.Tech Medical Software Systems',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Requisition Intake Evidence: Guided Practice
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Requisition Intake Evidence: Guided Practice',
  'IND-S5-C-001',
  'Learner can complete guided check with supervisor review for Requisition Intake & Approval and produce a reviewer-ready Requisition Intake Evidence Pack with clear evidence and handoff logic. Workplace scenario: A talent acquisition coordinator is handling 13 requisition intake and approval check records in ATS requisition tracker, budget approval mail, headcount tracker and job-description template. The file is messy: 4 records have missing budget code, 3 have replacement-versus-new-hire status not marked, 2 have approval mail attached without approver name, and some cases also show role justification copied from an old request. The team needs a safe first check same working day so the reviewer does not waste time on incomplete evidence. The learner must check required inputs, mark missing items, prepare a supervised draft, and request reviewer guidance, then prepare a Requisition Intake Evidence Pack, and clearly mark which items are ready, returned, blocked, or escalated. If handled poorly, the requisition may be opened without approval evidence or returned late after recruiter capacity is already planned. Artifact proof: Requisition Intake Evidence Pack. Competency taxonomy: Functional; Technical; Behavioural; Cognitive; Evidence.',
  '8 hours',
  'Active',
  'Talent Acquisition & Recruitment Services',
  'technical',
  '["Learner can complete guided check with supervisor review for Requisition Intake & Approval and produce a reviewer-ready Requisition Intake Evidence Pack with clear evidence and handoff logic.","Create a reviewer-ready Requisition Intake Evidence Pack.","Use source data to resolve the skill gap: Learner must convert requisition intake and approval check knowledge into a usable Requisition Intake Evidence Pack: check manager headcount request, budget or approval trail, role justification, job-details checklist, identify missing or conflicting records, explain the level boundary, and create a reviewer-ready handoff.","Explain evidence and consequence through the Requisition Intake Evidence Pack."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: Module 1: Requisition Intake Evidence Pack Workplace Build
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-001' LIMIT 1),
  'Module 1: Requisition Intake Evidence Pack Workplace Build',
  'Trigger: A talent acquisition coordinator receives 13 requisition intake and approval check records in ATS requisition tracker, budget approval mail, headcount tracker and job-description template; 4 show missing budget code, 3 show replacement-versus-new-hire status not marked, and 2 show approval mail attached without approver name. Pressure: The team needs a safe first check same working day so the reviewer does not waste time on incomplete evidence. Actuals: Volume: 13 records/cases. Issue count 1: 4 with missing budget code. Issue count 2: 3 with replacement-versus-new-hire status not marked. Issue count 3: 2 with approval mail attached without approver name. Systems/documents: ATS requisition tracker, budget approval mail, headcount tracker and job-description template. Decision needed: ready, return, block, or escalate. Time pressure: same working day.',
  1,
  '["HR & Workforce Services","Talent Acquisition & Recruitment Services","Recruitment & Talent Acquisition Specialists; Structured Hiring & Recruitment Operations Specialists","HR Specialist; Recruiter; HR Recruiter; Talent Acquisition Specialist; Candidate Screening Specialist","IND-CAP-01","Requisition Intake Evidence Pack","Functional","Technical","Behavioural","Cognitive","Evidence"]'::jsonb,
  '["Start with the live trigger: 13 records arrive, 9 have visible issues, and a stakeholder needs an answer same working day.","Learner studies the actual data points: manager headcount request, budget or approval trail, role justification, job-details checklist, missing-input log, policy flags, recruiter handoff note; then highlights missing fields, conflicts, late inputs, and owner gaps.","Teach the artifact logic: what each section means, which evidence is mandatory, what numbers must reconcile, and what the learner is allowed to decide at L1.","Learner completes the Requisition Intake Evidence Pack using the case numbers, source references, exception labels, owner notes, and a clear ready/return/block/escalate recommendation.","Learner uses AI only for checklist prompts, concept reminders, and rubric self-checks. AI must not invent records, calculate unsupported numbers, approve decisions, or replace the learner''s judgement.","Learner reflects on what changed at L1: volume, exception complexity, stakeholder pressure, authority boundary, and evidence quality compared with the previous level."]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Requisition Intake Evidence: Guided Practice: Data, Concepts and Artifact Evidence
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-001' LIMIT 1)
   AND title = 'Module 1: Requisition Intake Evidence Pack Workplace Build' LIMIT 1),
  'Requisition Intake Evidence: Guided Practice: Data, Concepts and Artifact Evidence',
  'Learner confusion: Students may understand the HR term but may not know how to read 13 messy records, compare source fields, quantify exceptions, choose proceed/return/escalate, or write the evidence trail in simple reviewer language. Root-cause focus: Investigate whether the real cause is missing source data, wrong effective date, unclear owner, system mismatch, late submission, policy/control risk, or weak handoff evidence in ATS requisition tracker, budget approval mail, headcount tracker and job-description template.',
  'Problem: A talent acquisition coordinator is handling 13 requisition intake and approval check records in ATS requisition tracker, budget approval mail, headcount tracker and job-description template. The file is messy: 4 records have missing budget code, 3 have replacement-versus-new-hire status not marked, 2 have approval mail attached without approver name, and some cases also show role justification copied from an old request. The team needs a safe first check same working day so the reviewer does not waste time on incomplete evidence. The learner must check required inputs, mark missing items, prepare a supervised draft, and request reviewer guidance, then prepare a Requisition Intake Evidence Pack, and clearly mark which items are ready, returned, blocked, or escalated. If handled poorly, the requisition may be opened without approval evidence or returned late after recruiter capacity is already planned. Actuals: Volume: 13 records/cases. Issue count 1: 4 with missing budget code. Issue count 2: 3 with replacement-versus-new-hire status not marked. Issue count 3: 2 with approval mail attached without approver name. Systems/documents: ATS requisition tracker, budget approval mail, headcount tracker and job-description template. Decision needed: ready, return, block, or escalate. Time pressure: same working day. Major concepts: requisition intake control - needed to complete and defend the Requisition Intake Evidence Pack; headcount approval trail - needed to complete and defend the Requisition Intake Evidence Pack; budget code validation - needed to complete and defend the Requisition Intake Evidence Pack; new-hire versus replacement classification - needed to complete and defend the Requisition Intake Evidence Pack; mandatory job-detail fields - needed to complete and defend the Requisition Intake Evidence Pack; policy flagging - needed to complete and defend the Requisition Intake Evidence Pack; missing-input log - needed to complete and defend the Requisition Intake Evidence Pack; recruiter handoff standard - needed to complete and defend the Requisition Intake Evidence Pack Concept-to-artifact link: These concepts are not theory-only. They tell the learner what to check inside the Requisition Intake Evidence Pack: source data, missing fields, exception rules, owner notes, decision status, handoff logic, and reviewer evidence. Required data: To solve the artifact, learner needs: manager headcount request, budget or approval trail, role justification, job-details checklist, missing-input log, policy flags, recruiter handoff note; system screenshots or exports from ATS requisition tracker, budget approval mail, headcount tracker and job-description template; policy or checklist rule used; stakeholder request; deadline/cut-off; prior status if available; reviewer or owner name; evidence of any unresolved exception. Artifact structure: Requisition Intake Evidence Pack must contain: case or employee/candidate/worker identifier; source document reference; required data fields (manager headcount request, budget or approval trail, role justification, job-details checklist, missing-input log, policy flags, recruiter handoff note); missing or conflicting item log; numeric issue count; exception category; owner/action note; proceed/return/block/escalate status; reviewer handoff note; closure or follow-up date. How to read artifact: Read the artifact as the learner''s final workplace proof. First check the identifiers and source documents, then the required fields, then the issue count and exception category, then the decision status, and finally whether the handoff note gives a reviewer enough evidence to act. Evidence fields: Assess whether the Requisition Intake Evidence Pack uses the right source data, includes all required fields, counts and labels the 9 issue records correctly, separates normal items from exceptions, gives a clear decision reason, respects the L1 authority boundary, and provides a usable reviewer handoff. AI coach boundary: AI can ask: Which source proves this field? Which 4 records are blocked? What is the decision reason? What evidence is still missing? AI can summarize checklist gaps and suggest clearer wording, but cannot create missing data, approve the case, override policy, or make the final HR/payroll/compliance decision. Traceability: Industry: HR & Workforce Services.|Domain: Talent Acquisition & Recruitment Services.|Role: HR Specialist; Recruiter; HR Recruiter; Talent Acquisition Specialist; Candidate Screening Specialist.|Capability_ID: IND-CAP-01.|Level: L1.|Course_ID: IND-S5-C-001.|Artifact: Requisition Intake Evidence Pack.|Source Sheet: L1_COURSE_PATTERN.',
  1,
  '8 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BBA Human Resource Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-001' LIMIT 1),
  'BBA Human Resource Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MBA Human Resource Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-001' LIMIT 1),
  'MBA Human Resource Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PGDM Human Resource Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-001' LIMIT 1),
  'PGDM Human Resource Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BA Psychology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-001' LIMIT 1),
  'BA Psychology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MSW Human Resource Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-001' LIMIT 1),
  'MSW Human Resource Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Candidate Screening: Guided Practice
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Candidate Screening: Guided Practice',
  'IND-S5-C-006',
  'Learner can complete guided check with supervisor review for Candidate Screening & Interview Readiness and produce a reviewer-ready Candidate Screening Matrix with clear evidence and handoff logic. Workplace scenario: A recruiter is handling 14 candidate screening and interview-readiness check records in ATS candidate pool, approved requisition, resume files, screening notes and interview calendar. The file is messy: 5 records have profiles missing notice period, 2 have shift availability not stated, 1 have CRM or domain experience not evidenced, and some cases also show salary expectation above range. The team needs a safe first check same working day so the reviewer does not waste time on incomplete evidence. The learner must check required inputs, mark missing items, prepare a supervised draft, and request reviewer guidance, then prepare a Candidate Screening Matrix, and clearly mark which items are ready, returned, blocked, or escalated. If handled poorly, interviewers may spend time on unsuitable candidates or strong candidates may be missed. Artifact proof: Candidate Screening Matrix. Competency taxonomy: Functional; Technical; Behavioural; Domain; Evidence.',
  '8 hours',
  'Active',
  'Talent Acquisition & Recruitment Services',
  'technical',
  '["Learner can complete guided check with supervisor review for Candidate Screening & Interview Readiness and produce a reviewer-ready Candidate Screening Matrix with clear evidence and handoff logic.","Create a reviewer-ready Candidate Screening Matrix.","Use source data to resolve the skill gap: Learner must convert candidate screening and interview-readiness check knowledge into a usable Candidate Screening Matrix: check requisition criteria, eligibility/knockout check, shortlisted/rejected rationale, missing-candidate-data log, identify missing or conflicting records, explain the level boundary, and create a reviewer-ready handoff.","Explain evidence and consequence through the Candidate Screening Matrix."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: Module 1: Candidate Screening Matrix Workplace Build
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-006' LIMIT 1),
  'Module 1: Candidate Screening Matrix Workplace Build',
  'Trigger: A recruiter receives 14 candidate screening and interview-readiness check records in ATS candidate pool, approved requisition, resume files, screening notes and interview calendar; 5 show profiles missing notice period, 2 show shift availability not stated, and 1 show CRM or domain experience not evidenced. Pressure: The team needs a safe first check same working day so the reviewer does not waste time on incomplete evidence. Actuals: Volume: 14 records/cases. Issue count 1: 5 with profiles missing notice period. Issue count 2: 2 with shift availability not stated. Issue count 3: 1 with CRM or domain experience not evidenced. Systems/documents: ATS candidate pool, approved requisition, resume files, screening notes and interview calendar. Decision needed: ready, return, block, or escalate. Time pressure: same working day.',
  1,
  '["HR & Workforce Services","Talent Acquisition & Recruitment Services","Recruitment & Talent Acquisition Specialists; Structured Hiring & Recruitment Operations Specialists","HR Specialist; Recruiter; HR Recruiter; Talent Acquisition Specialist; Candidate Screening Specialist","IND-CAP-02","Candidate Screening Matrix","Functional","Technical","Behavioural","Domain","Evidence"]'::jsonb,
  '["Start with the live trigger: 14 records arrive, 8 have visible issues, and a stakeholder needs an answer same working day.","Learner studies the actual data points: requisition criteria, eligibility/knockout check, shortlisted/rejected rationale, missing-candidate-data log, interview-readiness recommendation; then highlights missing fields, conflicts, late inputs, and owner gaps.","Teach the artifact logic: what each section means, which evidence is mandatory, what numbers must reconcile, and what the learner is allowed to decide at L1.","Learner completes the Candidate Screening Matrix using the case numbers, source references, exception labels, owner notes, and a clear ready/return/block/escalate recommendation.","Learner uses AI only for checklist prompts, concept reminders, and rubric self-checks. AI must not invent records, calculate unsupported numbers, approve decisions, or replace the learner''s judgement.","Learner reflects on what changed at L1: volume, exception complexity, stakeholder pressure, authority boundary, and evidence quality compared with the previous level."]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Candidate Screening: Guided Practice: Data, Concepts and Artifact Evidence
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-006' LIMIT 1)
   AND title = 'Module 1: Candidate Screening Matrix Workplace Build' LIMIT 1),
  'Candidate Screening: Guided Practice: Data, Concepts and Artifact Evidence',
  'Learner confusion: Students may understand the HR term but may not know how to read 14 messy records, compare source fields, quantify exceptions, choose proceed/return/escalate, or write the evidence trail in simple reviewer language. Root-cause focus: Investigate whether the real cause is missing source data, wrong effective date, unclear owner, system mismatch, late submission, policy/control risk, or weak handoff evidence in ATS candidate pool, approved requisition, resume files, screening notes and interview calendar.',
  'Problem: A recruiter is handling 14 candidate screening and interview-readiness check records in ATS candidate pool, approved requisition, resume files, screening notes and interview calendar. The file is messy: 5 records have profiles missing notice period, 2 have shift availability not stated, 1 have CRM or domain experience not evidenced, and some cases also show salary expectation above range. The team needs a safe first check same working day so the reviewer does not waste time on incomplete evidence. The learner must check required inputs, mark missing items, prepare a supervised draft, and request reviewer guidance, then prepare a Candidate Screening Matrix, and clearly mark which items are ready, returned, blocked, or escalated. If handled poorly, interviewers may spend time on unsuitable candidates or strong candidates may be missed. Actuals: Volume: 14 records/cases. Issue count 1: 5 with profiles missing notice period. Issue count 2: 2 with shift availability not stated. Issue count 3: 1 with CRM or domain experience not evidenced. Systems/documents: ATS candidate pool, approved requisition, resume files, screening notes and interview calendar. Decision needed: ready, return, block, or escalate. Time pressure: same working day. Major concepts: must-have versus good-to-have criteria - needed to complete and defend the Candidate Screening Matrix; candidate evidence matching - needed to complete and defend the Candidate Screening Matrix; screening matrix logic - needed to complete and defend the Candidate Screening Matrix; notice-period validation - needed to complete and defend the Candidate Screening Matrix; salary-range fit - needed to complete and defend the Candidate Screening Matrix; shift and location fit - needed to complete and defend the Candidate Screening Matrix; interview-readiness decision - needed to complete and defend the Candidate Screening Matrix; shortlist documentation - needed to complete and defend the Candidate Screening Matrix Concept-to-artifact link: These concepts are not theory-only. They tell the learner what to check inside the Candidate Screening Matrix: source data, missing fields, exception rules, owner notes, decision status, handoff logic, and reviewer evidence. Required data: To solve the artifact, learner needs: requisition criteria, eligibility/knockout check, shortlisted/rejected rationale, missing-candidate-data log, interview-readiness recommendation; system screenshots or exports from ATS candidate pool, approved requisition, resume files, screening notes and interview calendar; policy or checklist rule used; stakeholder request; deadline/cut-off; prior status if available; reviewer or owner name; evidence of any unresolved exception. Artifact structure: Candidate Screening Matrix must contain: case or employee/candidate/worker identifier; source document reference; required data fields (requisition criteria, eligibility/knockout check, shortlisted/rejected rationale, missing-candidate-data log, interview-readiness recommendation); missing or conflicting item log; numeric issue count; exception category; owner/action note; proceed/return/block/escalate status; reviewer handoff note; closure or follow-up date. How to read artifact: Read the artifact as the learner''s final workplace proof. First check the identifiers and source documents, then the required fields, then the issue count and exception category, then the decision status, and finally whether the handoff note gives a reviewer enough evidence to act. Evidence fields: Assess whether the Candidate Screening Matrix uses the right source data, includes all required fields, counts and labels the 8 issue records correctly, separates normal items from exceptions, gives a clear decision reason, respects the L1 authority boundary, and provides a usable reviewer handoff. AI coach boundary: AI can ask: Which source proves this field? Which 5 records are blocked? What is the decision reason? What evidence is still missing? AI can summarize checklist gaps and suggest clearer wording, but cannot create missing data, approve the case, override policy, or make the final HR/payroll/compliance decision. Traceability: Industry: HR & Workforce Services.|Domain: Talent Acquisition & Recruitment Services.|Role: HR Specialist; Recruiter; HR Recruiter; Talent Acquisition Specialist; Candidate Screening Specialist.|Capability_ID: IND-CAP-02.|Level: L1.|Course_ID: IND-S5-C-006.|Artifact: Candidate Screening Matrix.|Source Sheet: L1_COURSE_PATTERN.',
  1,
  '8 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BBA Human Resource Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-006' LIMIT 1),
  'BBA Human Resource Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MBA Human Resource Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-006' LIMIT 1),
  'MBA Human Resource Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PGDM Human Resource Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-006' LIMIT 1),
  'PGDM Human Resource Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BA Psychology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-006' LIMIT 1),
  'BA Psychology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MSW Human Resource Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-006' LIMIT 1),
  'MSW Human Resource Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Interview Evaluation Evidence: Guided Practice
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Interview Evaluation Evidence: Guided Practice',
  'IND-S5-C-011',
  'Learner can complete guided check with supervisor review for Interview Coordination & Scorecard Evidence and produce a reviewer-ready Interview Evaluation Evidence Pack with clear evidence and handoff logic. Workplace scenario: A recruitment coordinator is handling 15 interview evaluation and decision evidence closure records in ATS interview workflow, interviewer scorecards, candidate feedback notes, panel calendar and decision tracker. The file is messy: 3 records have scorecards submitted late, 3 have interviewers using different rating language, 2 have candidate feedback missing for one round, and some cases also show decision summary not aligned to evidence. The team needs a safe first check same working day so the reviewer does not waste time on incomplete evidence. The learner must check required inputs, mark missing items, prepare a supervised draft, and request reviewer guidance, then prepare a Interview Evaluation Evidence Pack, and clearly mark which items are ready, returned, blocked, or escalated. If handled poorly, the selection decision may look biased, unclear, or unsupported during later review. Artifact proof: Interview Evaluation Evidence Pack. Competency taxonomy: Functional; Technical; Behavioural; Domain; Evidence.',
  '8 hours',
  'Active',
  'Talent Acquisition & Recruitment Services',
  'soft',
  '["Learner can complete guided check with supervisor review for Interview Coordination & Scorecard Evidence and produce a reviewer-ready Interview Evaluation Evidence Pack with clear evidence and handoff logic.","Create a reviewer-ready Interview Evaluation Evidence Pack.","Use source data to resolve the skill gap: Learner must convert interview evaluation and decision evidence closure knowledge into a usable Interview Evaluation Evidence Pack: check interview plan, interviewer availability, competency questions, scorecard entries, identify missing or conflicting records, explain the level boundary, and create a reviewer-ready handoff.","Explain evidence and consequence through the Interview Evaluation Evidence Pack."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: Module 1: Interview Evaluation Evidence Pack Workplace Build
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-011' LIMIT 1),
  'Module 1: Interview Evaluation Evidence Pack Workplace Build',
  'Trigger: A recruitment coordinator receives 15 interview evaluation and decision evidence closure records in ATS interview workflow, interviewer scorecards, candidate feedback notes, panel calendar and decision tracker; 3 show scorecards submitted late, 3 show interviewers using different rating language, and 2 show candidate feedback missing for one round. Pressure: The team needs a safe first check same working day so the reviewer does not waste time on incomplete evidence. Actuals: Volume: 15 records/cases. Issue count 1: 3 with scorecards submitted late. Issue count 2: 3 with interviewers using different rating language. Issue count 3: 2 with candidate feedback missing for one round. Systems/documents: ATS interview workflow, interviewer scorecards, candidate feedback notes, panel calendar and decision tracker. Decision needed: ready, return, block, or escalate. Time pressure: same working day.',
  1,
  '["HR & Workforce Services","Talent Acquisition & Recruitment Services","Recruitment & Talent Acquisition Specialists; Structured Hiring & Recruitment Operations Specialists","HR Specialist; Recruiter; HR Recruiter; Talent Acquisition Specialist; Candidate Screening Specialist","IND-CAP-03","Interview Evaluation Evidence Pack","Functional","Technical","Behavioural","Domain","Evidence"]'::jsonb,
  '["Start with the live trigger: 15 records arrive, 8 have visible issues, and a stakeholder needs an answer same working day.","Learner studies the actual data points: interview plan, interviewer availability, competency questions, scorecard entries, candidate feedback note, selection decision summary; then highlights missing fields, conflicts, late inputs, and owner gaps.","Teach the artifact logic: what each section means, which evidence is mandatory, what numbers must reconcile, and what the learner is allowed to decide at L1.","Learner completes the Interview Evaluation Evidence Pack using the case numbers, source references, exception labels, owner notes, and a clear ready/return/block/escalate recommendation.","Learner uses AI only for checklist prompts, concept reminders, and rubric self-checks. AI must not invent records, calculate unsupported numbers, approve decisions, or replace the learner''s judgement.","Learner reflects on what changed at L1: volume, exception complexity, stakeholder pressure, authority boundary, and evidence quality compared with the previous level."]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Interview Evaluation Evidence: Guided Practice: Data, Concepts and Artifact Evidence
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-011' LIMIT 1)
   AND title = 'Module 1: Interview Evaluation Evidence Pack Workplace Build' LIMIT 1),
  'Interview Evaluation Evidence: Guided Practice: Data, Concepts and Artifact Evidence',
  'Learner confusion: Students may understand the HR term but may not know how to read 15 messy records, compare source fields, quantify exceptions, choose proceed/return/escalate, or write the evidence trail in simple reviewer language. Root-cause focus: Investigate whether the real cause is missing source data, wrong effective date, unclear owner, system mismatch, late submission, policy/control risk, or weak handoff evidence in ATS interview workflow, interviewer scorecards, candidate feedback notes, panel calendar and decision tracker.',
  'Problem: A recruitment coordinator is handling 15 interview evaluation and decision evidence closure records in ATS interview workflow, interviewer scorecards, candidate feedback notes, panel calendar and decision tracker. The file is messy: 3 records have scorecards submitted late, 3 have interviewers using different rating language, 2 have candidate feedback missing for one round, and some cases also show decision summary not aligned to evidence. The team needs a safe first check same working day so the reviewer does not waste time on incomplete evidence. The learner must check required inputs, mark missing items, prepare a supervised draft, and request reviewer guidance, then prepare a Interview Evaluation Evidence Pack, and clearly mark which items are ready, returned, blocked, or escalated. If handled poorly, the selection decision may look biased, unclear, or unsupported during later review. Actuals: Volume: 15 records/cases. Issue count 1: 3 with scorecards submitted late. Issue count 2: 3 with interviewers using different rating language. Issue count 3: 2 with candidate feedback missing for one round. Systems/documents: ATS interview workflow, interviewer scorecards, candidate feedback notes, panel calendar and decision tracker. Decision needed: ready, return, block, or escalate. Time pressure: same working day. Major concepts: structured interview evidence - needed to complete and defend the Interview Evaluation Evidence Pack; scorecard completeness - needed to complete and defend the Interview Evaluation Evidence Pack; rating calibration - needed to complete and defend the Interview Evaluation Evidence Pack; decision-summary logic - needed to complete and defend the Interview Evaluation Evidence Pack; feedback traceability - needed to complete and defend the Interview Evaluation Evidence Pack; interviewer accountability - needed to complete and defend the Interview Evaluation Evidence Pack; candidate-stage closure - needed to complete and defend the Interview Evaluation Evidence Pack; fair-selection evidence - needed to complete and defend the Interview Evaluation Evidence Pack Concept-to-artifact link: These concepts are not theory-only. They tell the learner what to check inside the Interview Evaluation Evidence Pack: source data, missing fields, exception rules, owner notes, decision status, handoff logic, and reviewer evidence. Required data: To solve the artifact, learner needs: interview plan, interviewer availability, competency questions, scorecard entries, candidate feedback note, selection decision summary; system screenshots or exports from ATS interview workflow, interviewer scorecards, candidate feedback notes, panel calendar and decision tracker; policy or checklist rule used; stakeholder request; deadline/cut-off; prior status if available; reviewer or owner name; evidence of any unresolved exception. Artifact structure: Interview Evaluation Evidence Pack must contain: case or employee/candidate/worker identifier; source document reference; required data fields (interview plan, interviewer availability, competency questions, scorecard entries, candidate feedback note, selection decision summary); missing or conflicting item log; numeric issue count; exception category; owner/action note; proceed/return/block/escalate status; reviewer handoff note; closure or follow-up date. How to read artifact: Read the artifact as the learner''s final workplace proof. First check the identifiers and source documents, then the required fields, then the issue count and exception category, then the decision status, and finally whether the handoff note gives a reviewer enough evidence to act. Evidence fields: Assess whether the Interview Evaluation Evidence Pack uses the right source data, includes all required fields, counts and labels the 8 issue records correctly, separates normal items from exceptions, gives a clear decision reason, respects the L1 authority boundary, and provides a usable reviewer handoff. AI coach boundary: AI can ask: Which source proves this field? Which 3 records are blocked? What is the decision reason? What evidence is still missing? AI can summarize checklist gaps and suggest clearer wording, but cannot create missing data, approve the case, override policy, or make the final HR/payroll/compliance decision. Traceability: Industry: HR & Workforce Services.|Domain: Talent Acquisition & Recruitment Services.|Role: HR Specialist; Recruiter; HR Recruiter; Talent Acquisition Specialist; Candidate Screening Specialist.|Capability_ID: IND-CAP-03.|Level: L1.|Course_ID: IND-S5-C-011.|Artifact: Interview Evaluation Evidence Pack.|Source Sheet: L1_COURSE_PATTERN.',
  1,
  '8 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BBA Human Resource Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-011' LIMIT 1),
  'BBA Human Resource Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MBA Human Resource Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-011' LIMIT 1),
  'MBA Human Resource Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PGDM Human Resource Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-011' LIMIT 1),
  'PGDM Human Resource Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BA Psychology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-011' LIMIT 1),
  'BA Psychology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MSW Human Resource Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-011' LIMIT 1),
  'MSW Human Resource Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Offer Handoff & Hiring Closure: Guided Practice
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Offer Handoff & Hiring Closure: Guided Practice',
  'IND-S5-C-016',
  'Learner can complete guided check with supervisor review for Offer Approval Handoff & Hiring Closure and produce a reviewer-ready Offer Handoff & Hiring Closure Pack with clear evidence and handoff logic. Workplace scenario: A talent acquisition specialist is handling 16 offer handoff and hiring closure records in ATS offer workflow, compensation approval sheet, joining document checklist and HR operations handoff tracker. The file is messy: 4 records have compensation approval pending, 2 have joining date changed after offer draft, 1 have background verification status unclear, and some cases also show HR ops handoff missing document owner. The team needs a safe first check same working day so the reviewer does not waste time on incomplete evidence. The learner must check required inputs, mark missing items, prepare a supervised draft, and request reviewer guidance, then prepare a Offer Handoff & Hiring Closure Pack, and clearly mark which items are ready, returned, blocked, or escalated. If handled poorly, offer release may be delayed, joining data may be wrong, or HR operations may receive an incomplete handoff. Artifact proof: Offer Handoff & Hiring Closure Pack. Competency taxonomy: Functional; Technical; Behavioural; Domain; Evidence.',
  '8 hours',
  'Active',
  'Talent Acquisition & Recruitment Services',
  'technical',
  '["Learner can complete guided check with supervisor review for Offer Approval Handoff & Hiring Closure and produce a reviewer-ready Offer Handoff & Hiring Closure Pack with clear evidence and handoff logic.","Create a reviewer-ready Offer Handoff & Hiring Closure Pack.","Use source data to resolve the skill gap: Learner must convert offer handoff and hiring closure knowledge into a usable Offer Handoff & Hiring Closure Pack: check finalist decision record, compensation-range check, approval trail, offer-draft handoff, identify missing or conflicting records, explain the level boundary, and create a reviewer-ready handoff.","Explain evidence and consequence through the Offer Handoff & Hiring Closure Pack."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: Module 1: Offer Handoff & Hiring Closure Pack Workplace Build
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-016' LIMIT 1),
  'Module 1: Offer Handoff & Hiring Closure Pack Workplace Build',
  'Trigger: A talent acquisition specialist receives 16 offer handoff and hiring closure records in ATS offer workflow, compensation approval sheet, joining document checklist and HR operations handoff tracker; 4 show compensation approval pending, 2 show joining date changed after offer draft, and 1 show background verification status unclear. Pressure: The team needs a safe first check same working day so the reviewer does not waste time on incomplete evidence. Actuals: Volume: 16 records/cases. Issue count 1: 4 with compensation approval pending. Issue count 2: 2 with joining date changed after offer draft. Issue count 3: 1 with background verification status unclear. Systems/documents: ATS offer workflow, compensation approval sheet, joining document checklist and HR operations handoff tracker. Decision needed: ready, return, block, or escalate. Time pressure: same working day.',
  1,
  '["HR & Workforce Services","Talent Acquisition & Recruitment Services","Recruitment & Talent Acquisition Specialists; Structured Hiring & Recruitment Operations Specialists","HR Specialist; Recruiter; HR Recruiter; Talent Acquisition Specialist; Candidate Screening Specialist","IND-CAP-04","Offer Handoff & Hiring Closure Pack","Functional","Technical","Behavioural","Domain","Evidence"]'::jsonb,
  '["Start with the live trigger: 16 records arrive, 7 have visible issues, and a stakeholder needs an answer same working day.","Learner studies the actual data points: finalist decision record, compensation-range check, approval trail, offer-draft handoff, acceptance/decline status, hiring outcome closure note; then highlights missing fields, conflicts, late inputs, and owner gaps.","Teach the artifact logic: what each section means, which evidence is mandatory, what numbers must reconcile, and what the learner is allowed to decide at L1.","Learner completes the Offer Handoff & Hiring Closure Pack using the case numbers, source references, exception labels, owner notes, and a clear ready/return/block/escalate recommendation.","Learner uses AI only for checklist prompts, concept reminders, and rubric self-checks. AI must not invent records, calculate unsupported numbers, approve decisions, or replace the learner''s judgement.","Learner reflects on what changed at L1: volume, exception complexity, stakeholder pressure, authority boundary, and evidence quality compared with the previous level."]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Offer Handoff & Hiring Closure: Guided Practice: Data, Concepts and Artifact Evidence
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-016' LIMIT 1)
   AND title = 'Module 1: Offer Handoff & Hiring Closure Pack Workplace Build' LIMIT 1),
  'Offer Handoff & Hiring Closure: Guided Practice: Data, Concepts and Artifact Evidence',
  'Learner confusion: Students may understand the HR term but may not know how to read 16 messy records, compare source fields, quantify exceptions, choose proceed/return/escalate, or write the evidence trail in simple reviewer language. Root-cause focus: Investigate whether the real cause is missing source data, wrong effective date, unclear owner, system mismatch, late submission, policy/control risk, or weak handoff evidence in ATS offer workflow, compensation approval sheet, joining document checklist and HR operations handoff tracker.',
  'Problem: A talent acquisition specialist is handling 16 offer handoff and hiring closure records in ATS offer workflow, compensation approval sheet, joining document checklist and HR operations handoff tracker. The file is messy: 4 records have compensation approval pending, 2 have joining date changed after offer draft, 1 have background verification status unclear, and some cases also show HR ops handoff missing document owner. The team needs a safe first check same working day so the reviewer does not waste time on incomplete evidence. The learner must check required inputs, mark missing items, prepare a supervised draft, and request reviewer guidance, then prepare a Offer Handoff & Hiring Closure Pack, and clearly mark which items are ready, returned, blocked, or escalated. If handled poorly, offer release may be delayed, joining data may be wrong, or HR operations may receive an incomplete handoff. Actuals: Volume: 16 records/cases. Issue count 1: 4 with compensation approval pending. Issue count 2: 2 with joining date changed after offer draft. Issue count 3: 1 with background verification status unclear. Systems/documents: ATS offer workflow, compensation approval sheet, joining document checklist and HR operations handoff tracker. Decision needed: ready, return, block, or escalate. Time pressure: same working day. Major concepts: offer approval control - needed to complete and defend the Offer Handoff & Hiring Closure Pack; compensation fit check - needed to complete and defend the Offer Handoff & Hiring Closure Pack; joining-date dependency - needed to complete and defend the Offer Handoff & Hiring Closure Pack; document owner mapping - needed to complete and defend the Offer Handoff & Hiring Closure Pack; background check dependency - needed to complete and defend the Offer Handoff & Hiring Closure Pack; offer-to-joining handoff - needed to complete and defend the Offer Handoff & Hiring Closure Pack; closure evidence - needed to complete and defend the Offer Handoff & Hiring Closure Pack; candidate communication trail - needed to complete and defend the Offer Handoff & Hiring Closure Pack Concept-to-artifact link: These concepts are not theory-only. They tell the learner what to check inside the Offer Handoff & Hiring Closure Pack: source data, missing fields, exception rules, owner notes, decision status, handoff logic, and reviewer evidence. Required data: To solve the artifact, learner needs: finalist decision record, compensation-range check, approval trail, offer-draft handoff, acceptance/decline status, hiring outcome closure note; system screenshots or exports from ATS offer workflow, compensation approval sheet, joining document checklist and HR operations handoff tracker; policy or checklist rule used; stakeholder request; deadline/cut-off; prior status if available; reviewer or owner name; evidence of any unresolved exception. Artifact structure: Offer Handoff & Hiring Closure Pack must contain: case or employee/candidate/worker identifier; source document reference; required data fields (finalist decision record, compensation-range check, approval trail, offer-draft handoff, acceptance/decline status, hiring outcome closure note); missing or conflicting item log; numeric issue count; exception category; owner/action note; proceed/return/block/escalate status; reviewer handoff note; closure or follow-up date. How to read artifact: Read the artifact as the learner''s final workplace proof. First check the identifiers and source documents, then the required fields, then the issue count and exception category, then the decision status, and finally whether the handoff note gives a reviewer enough evidence to act. Evidence fields: Assess whether the Offer Handoff & Hiring Closure Pack uses the right source data, includes all required fields, counts and labels the 7 issue records correctly, separates normal items from exceptions, gives a clear decision reason, respects the L1 authority boundary, and provides a usable reviewer handoff. AI coach boundary: AI can ask: Which source proves this field? Which 4 records are blocked? What is the decision reason? What evidence is still missing? AI can summarize checklist gaps and suggest clearer wording, but cannot create missing data, approve the case, override policy, or make the final HR/payroll/compliance decision. Traceability: Industry: HR & Workforce Services.|Domain: Talent Acquisition & Recruitment Services.|Role: HR Specialist; Recruiter; HR Recruiter; Talent Acquisition Specialist; Candidate Screening Specialist.|Capability_ID: IND-CAP-04.|Level: L1.|Course_ID: IND-S5-C-016.|Artifact: Offer Handoff & Hiring Closure Pack.|Source Sheet: L1_COURSE_PATTERN.',
  1,
  '8 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BBA Human Resource Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-016' LIMIT 1),
  'BBA Human Resource Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MBA Human Resource Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-016' LIMIT 1),
  'MBA Human Resource Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PGDM Human Resource Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-016' LIMIT 1),
  'PGDM Human Resource Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BA Psychology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-016' LIMIT 1),
  'BA Psychology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MSW Human Resource Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-016' LIMIT 1),
  'MSW Human Resource Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Staffing Deployment Confirmation: Guided Practice
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Staffing Deployment Confirmation: Guided Practice',
  'IND-S5-C-021',
  'Learner can complete guided check with supervisor review for Staffing Order Fulfilment and produce a reviewer-ready Staffing Deployment Confirmation Tracker with clear evidence and handoff logic. Workplace scenario: A staffing fulfillment coordinator is handling 12 temporary staffing deployment confirmation records in staffing order tracker, client requirement sheet, worker availability roster and deployment confirmation log. The file is messy: 5 records have worker availability changed, 3 have client shift pattern unclear, 2 have joining location differs from order, and some cases also show ID or compliance document still pending. The team needs a safe first check same working day so the reviewer does not waste time on incomplete evidence. The learner must check required inputs, mark missing items, prepare a supervised draft, and request reviewer guidance, then prepare a Staffing Deployment Confirmation Tracker, and clearly mark which items are ready, returned, blocked, or escalated. If handled poorly, the wrong worker may be deployed, the client roster may fail, or the worker may arrive without valid clearance. Artifact proof: Staffing Deployment Confirmation Tracker. Competency taxonomy: Functional; Technical; Behavioural; Cognitive; Evidence.',
  '8 hours',
  'Active',
  'Staffing Operations',
  'technical',
  '["Learner can complete guided check with supervisor review for Staffing Order Fulfilment and produce a reviewer-ready Staffing Deployment Confirmation Tracker with clear evidence and handoff logic.","Create a reviewer-ready Staffing Deployment Confirmation Tracker.","Use source data to resolve the skill gap: Learner must convert temporary staffing deployment confirmation knowledge into a usable Staffing Deployment Confirmation Tracker: check staffing order, worker availability, client assignment details, onboarding/shift instructions, identify missing or conflicting records, explain the level boundary, and create a reviewer-ready handoff.","Explain evidence and consequence through the Staffing Deployment Confirmation Tracker."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: Module 1: Staffing Deployment Confirmation Tracker Workplace Build
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-021' LIMIT 1),
  'Module 1: Staffing Deployment Confirmation Tracker Workplace Build',
  'Trigger: A staffing fulfillment coordinator receives 12 temporary staffing deployment confirmation records in staffing order tracker, client requirement sheet, worker availability roster and deployment confirmation log; 5 show worker availability changed, 3 show client shift pattern unclear, and 2 show joining location differs from order. Pressure: The team needs a safe first check same working day so the reviewer does not waste time on incomplete evidence. Actuals: Volume: 12 records/cases. Issue count 1: 5 with worker availability changed. Issue count 2: 3 with client shift pattern unclear. Issue count 3: 2 with joining location differs from order. Systems/documents: staffing order tracker, client requirement sheet, worker availability roster and deployment confirmation log. Decision needed: ready, return, block, or escalate. Time pressure: same working day.',
  1,
  '["HR & Workforce Services","Staffing Operations","Staffing & Workforce Fulfillment Coordinators; Employer-of-Record & Global Employment Operations Specialists","Staffing Consultant; Workforce Fulfillment Coordinator; Managed HR Service Specialist; Recruitment Coordinator; EOR Operations Specialist","IND-CAP-05","Staffing Deployment Confirmation Tracker","Functional","Technical","Behavioural","Cognitive","Evidence"]'::jsonb,
  '["Start with the live trigger: 12 records arrive, 10 have visible issues, and a stakeholder needs an answer same working day.","Learner studies the actual data points: staffing order, worker availability, client assignment details, onboarding/shift instructions, first-shift confirmation, issue log; then highlights missing fields, conflicts, late inputs, and owner gaps.","Teach the artifact logic: what each section means, which evidence is mandatory, what numbers must reconcile, and what the learner is allowed to decide at L1.","Learner completes the Staffing Deployment Confirmation Tracker using the case numbers, source references, exception labels, owner notes, and a clear ready/return/block/escalate recommendation.","Learner uses AI only for checklist prompts, concept reminders, and rubric self-checks. AI must not invent records, calculate unsupported numbers, approve decisions, or replace the learner''s judgement.","Learner reflects on what changed at L1: volume, exception complexity, stakeholder pressure, authority boundary, and evidence quality compared with the previous level."]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Staffing Deployment Confirmation: Guided Practice: Data, Concepts and Artifact Evidence
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-021' LIMIT 1)
   AND title = 'Module 1: Staffing Deployment Confirmation Tracker Workplace Build' LIMIT 1),
  'Staffing Deployment Confirmation: Guided Practice: Data, Concepts and Artifact Evidence',
  'Learner confusion: Students may understand the HR term but may not know how to read 12 messy records, compare source fields, quantify exceptions, choose proceed/return/escalate, or write the evidence trail in simple reviewer language. Root-cause focus: Investigate whether the real cause is missing source data, wrong effective date, unclear owner, system mismatch, late submission, policy/control risk, or weak handoff evidence in staffing order tracker, client requirement sheet, worker availability roster and deployment confirmation log.',
  'Problem: A staffing fulfillment coordinator is handling 12 temporary staffing deployment confirmation records in staffing order tracker, client requirement sheet, worker availability roster and deployment confirmation log. The file is messy: 5 records have worker availability changed, 3 have client shift pattern unclear, 2 have joining location differs from order, and some cases also show ID or compliance document still pending. The team needs a safe first check same working day so the reviewer does not waste time on incomplete evidence. The learner must check required inputs, mark missing items, prepare a supervised draft, and request reviewer guidance, then prepare a Staffing Deployment Confirmation Tracker, and clearly mark which items are ready, returned, blocked, or escalated. If handled poorly, the wrong worker may be deployed, the client roster may fail, or the worker may arrive without valid clearance. Actuals: Volume: 12 records/cases. Issue count 1: 5 with worker availability changed. Issue count 2: 3 with client shift pattern unclear. Issue count 3: 2 with joining location differs from order. Systems/documents: staffing order tracker, client requirement sheet, worker availability roster and deployment confirmation log. Decision needed: ready, return, block, or escalate. Time pressure: same working day. Major concepts: staffing order fulfilment - needed to complete and defend the Staffing Deployment Confirmation Tracker; worker availability confirmation - needed to complete and defend the Staffing Deployment Confirmation Tracker; shift and location matching - needed to complete and defend the Staffing Deployment Confirmation Tracker; deployment readiness control - needed to complete and defend the Staffing Deployment Confirmation Tracker; client confirmation trail - needed to complete and defend the Staffing Deployment Confirmation Tracker; worker document dependency - needed to complete and defend the Staffing Deployment Confirmation Tracker; roster lock timing - needed to complete and defend the Staffing Deployment Confirmation Tracker; handoff accountability - needed to complete and defend the Staffing Deployment Confirmation Tracker Concept-to-artifact link: These concepts are not theory-only. They tell the learner what to check inside the Staffing Deployment Confirmation Tracker: source data, missing fields, exception rules, owner notes, decision status, handoff logic, and reviewer evidence. Required data: To solve the artifact, learner needs: staffing order, worker availability, client assignment details, onboarding/shift instructions, first-shift confirmation, issue log; system screenshots or exports from staffing order tracker, client requirement sheet, worker availability roster and deployment confirmation log; policy or checklist rule used; stakeholder request; deadline/cut-off; prior status if available; reviewer or owner name; evidence of any unresolved exception. Artifact structure: Staffing Deployment Confirmation Tracker must contain: case or employee/candidate/worker identifier; source document reference; required data fields (staffing order, worker availability, client assignment details, onboarding/shift instructions, first-shift confirmation, issue log); missing or conflicting item log; numeric issue count; exception category; owner/action note; proceed/return/block/escalate status; reviewer handoff note; closure or follow-up date. How to read artifact: Read the artifact as the learner''s final workplace proof. First check the identifiers and source documents, then the required fields, then the issue count and exception category, then the decision status, and finally whether the handoff note gives a reviewer enough evidence to act. Evidence fields: Assess whether the Staffing Deployment Confirmation Tracker uses the right source data, includes all required fields, counts and labels the 10 issue records correctly, separates normal items from exceptions, gives a clear decision reason, respects the L1 authority boundary, and provides a usable reviewer handoff. AI coach boundary: AI can ask: Which source proves this field? Which 5 records are blocked? What is the decision reason? What evidence is still missing? AI can summarize checklist gaps and suggest clearer wording, but cannot create missing data, approve the case, override policy, or make the final HR/payroll/compliance decision. Traceability: Industry: HR & Workforce Services.|Domain: Staffing Operations.|Role: Staffing Consultant; Workforce Fulfillment Coordinator; Managed HR Service Specialist; Recruitment Coordinator; EOR Operations Specialist.|Capability_ID: IND-CAP-05.|Level: L1.|Course_ID: IND-S5-C-021.|Artifact: Staffing Deployment Confirmation Tracker.|Source Sheet: L1_COURSE_PATTERN.',
  1,
  '8 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BBA Human Resource Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-021' LIMIT 1),
  'BBA Human Resource Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MBA Human Resource Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-021' LIMIT 1),
  'MBA Human Resource Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PGDM Human Resource Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-021' LIMIT 1),
  'PGDM Human Resource Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Com
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-021' LIMIT 1),
  'B.Com',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BA Industrial Relations
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-021' LIMIT 1),
  'BA Industrial Relations',
  NOW()
) ON CONFLICT DO NOTHING;

COMMIT;

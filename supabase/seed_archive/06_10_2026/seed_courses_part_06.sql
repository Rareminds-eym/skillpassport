-- ============================================
-- COURSE SEED — part 06 of 10
-- Courses 251–300 of 485
-- Paste this whole file into the Supabase SQL editor and Run.
-- Safe to re-run (ON CONFLICT DO NOTHING). Run parts in order.
-- ============================================

BEGIN;

-- Insert Course: Vaccine Lot QC, Temperature-Excursion and Cold-Chain Release Packet Control - - Evidence Gap Recognition
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Vaccine Lot QC, Temperature-Excursion and Cold-Chain Release Packet Control - - Evidence Gap Recognition',
  'COURSE-CAP-006-L1',
  'A learner receives 1 Vaccine Lot QC, Temperature-Excursion and Cold-Chain Release Packet Control - record pack with 8 required fields. Three fields are blank, 2 source IDs are weak, and 1 owner note is unclear. The problem is to find what is missing before the record is used for review. Course objective: Recognize the required evidence fields for Vaccine Lot QC, Temperature-Excursion and Cold-Chain Release Packet Control -; identify 3 missing/unclear items; record source IDs; explain what must be escalated. Learner outcome: Learner can inspect a Vaccine Lot QC, Temperature-Excursion and Cold-Chain Release Packet Control - record and produce a checklist showing missing fields, weak source IDs, and role-boundary doubts.',
  '6 hours',
  'Active',
  'Pharma / Biotech / MedTech',
  'technical',
  '["Recognize the required evidence fields for Vaccine Lot QC, Temperature-Excursion and Cold-Chain Release Packet Control -; identify 3 missing/unclear items; record source IDs; explain what must be escalated.","Learner can inspect a Vaccine Lot QC, Temperature-Excursion and Cold-Chain Release Packet Control - record and produce a checklist showing missing fields, weak source IDs, and role-boundary doubts.","Create Vaccine Lot QC, Temperature-Excursion and Cold-Chain Release Packet Control - completeness checklist","Assess evidence using: Field completeness; correct source IDs; clear missing-data notes; correct escalation flag; no approval claim."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L1: Evidence Gap Recognition - CAP-006
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-006-L1' LIMIT 1),
  'L1: Evidence Gap Recognition - CAP-006',
  'You are supporting a workplace evidence review. Your manager gives you one Vaccine Lot QC, Temperature-Excursion and Cold-Chain Release Packet Control - file and asks you to check whether it is complete. You must not approve the file. You must mark the 3 blank fields, list the 2 weak source IDs, and explain which 1 role-boundary point needs clarification. Required data: Sample Vaccine Lot QC, Temperature-Excursion and Cold-Chain Release Packet Control - source record; 8 required fields list; 3 intentionally missing entries; 2 source-ID references; 1 role-boundary note; blank checklist template.',
  1,
  '["Pharma / Biotech / MedTech","Biological Product, Vaccine and Biosimilar Operations","D-002","CAP-006","L1","Domain; Evidence; Cognitive; Compliance"]'::jsonb,
  '["Scenario Review","Evidence Check","Artifact Build","AI Coaching","Human Review","Retry and Improve","Portfolio Submission"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Vaccine Lot QC, Temperature-Excursion and Cold-Chain Release Packet Control - completeness checklist Practice
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-006-L1' LIMIT 1)
   AND title = 'L1: Evidence Gap Recognition - CAP-006' LIMIT 1),
  'Vaccine Lot QC, Temperature-Excursion and Cold-Chain Release Packet Control - completeness checklist Practice',
  'Complete the Vaccine Lot QC, Temperature-Excursion and Cold-Chain Release Packet Control - completeness checklist using the provided actuals and explain the evidence decision in simple workplace language.',
  'Workplace scenario: You are supporting a workplace evidence review. Your manager gives you one Vaccine Lot QC, Temperature-Excursion and Cold-Chain Release Packet Control - file and asks you to check whether it is complete. You must not approve the file. You must mark the 3 blank fields, list the 2 weak source IDs, and explain which 1 role-boundary point needs clarification. Major concepts: Vaccine Lot QC, Temperature-Excursion and Cold-Chain Release Packet Control - evidence completeness; 8-field checklist logic; source-ID traceability; missing-data marking; ALCOA-style documentation thinking; role boundary between checking and approving. Artifact structure: Sections: record summary; required field list; missing-field table; source-ID table; role-boundary note; escalation flag. Evidence to assess: Field completeness; correct source IDs; clear missing-data notes; correct escalation flag; no approval claim. AI support: Use AI to ask checklist questions only. Do not let AI invent missing data or approve the record.',
  1,
  '90 minutes',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Pharm
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-006-L1' LIMIT 1),
  'B.Pharm',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Pharm Pharmaceutical Biotechnology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-006-L1' LIMIT 1),
  'M.Pharm Pharmaceutical Biotechnology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Biotechnology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-006-L1' LIMIT 1),
  'B.Sc Biotechnology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Sc Microbiology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-006-L1' LIMIT 1),
  'M.Sc Microbiology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Microbiology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-006-L1' LIMIT 1),
  'B.Sc Microbiology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Advanced Biopharma Evidence Inventory and Authority-Boundary Triage - Evidence Gap Recognition
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Advanced Biopharma Evidence Inventory and Authority-Boundary Triage - Evidence Gap Recognition',
  'COURSE-CAP-007-L1',
  'A learner receives 1 Advanced Biopharma Evidence Inventory and Authority-Boundary Triage record pack with 8 required fields. Three fields are blank, 2 source IDs are weak, and 1 owner note is unclear. The problem is to find what is missing before the record is used for review. Course objective: Recognize the required evidence fields for Advanced Biopharma Evidence Inventory and Authority-Boundary Triage; identify 3 missing/unclear items; record source IDs; explain what must be escalated. Learner outcome: Learner can inspect an Advanced Biopharma Evidence Inventory and Authority-Boundary Triage record and produce a checklist showing missing fields, weak source IDs, and role-boundary doubts.',
  '6 hours',
  'Active',
  'Pharma / Biotech / MedTech',
  'technical',
  '["Recognize the required evidence fields for Advanced Biopharma Evidence Inventory and Authority-Boundary Triage; identify 3 missing/unclear items; record source IDs; explain what must be escalated.","Learner can inspect an Advanced Biopharma Evidence Inventory and Authority-Boundary Triage record and produce a checklist showing missing fields, weak source IDs, and role-boundary doubts.","Create Advanced Biopharma Evidence Inventory and Authority-Boundary Triage completeness checklist","Assess evidence using: Field completeness; correct source IDs; clear missing-data notes; correct escalation flag; no approval claim."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L1: Evidence Gap Recognition - CAP-007
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-007-L1' LIMIT 1),
  'L1: Evidence Gap Recognition - CAP-007',
  'You are supporting a workplace evidence review. Your manager gives you one Advanced Biopharma Evidence Inventory and Authority-Boundary Triage file and asks you to check whether it is complete. You must not approve the file. You must mark the 3 blank fields, list the 2 weak source IDs, and explain which 1 role-boundary point needs clarification. Required data: Sample Advanced Biopharma Evidence Inventory and Authority-Boundary Triage source record; 8 required fields list; 3 intentionally missing entries; 2 source-ID references; 1 role-boundary note; blank checklist template.',
  1,
  '["Pharma / Biotech / MedTech","Advanced Biopharma Evidence Inventory and Boundary Triage","D-002","CAP-007","L1","Domain; Evidence; Cognitive; Compliance"]'::jsonb,
  '["Scenario Review","Evidence Check","Artifact Build","AI Coaching","Human Review","Retry and Improve","Portfolio Submission"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Advanced Biopharma Evidence Inventory and Authority-Boundary Triage completeness checklist Practice
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-007-L1' LIMIT 1)
   AND title = 'L1: Evidence Gap Recognition - CAP-007' LIMIT 1),
  'Advanced Biopharma Evidence Inventory and Authority-Boundary Triage completeness checklist Practice',
  'Complete the Advanced Biopharma Evidence Inventory and Authority-Boundary Triage completeness checklist using the provided actuals and explain the evidence decision in simple workplace language.',
  'Workplace scenario: You are supporting a workplace evidence review. Your manager gives you one Advanced Biopharma Evidence Inventory and Authority-Boundary Triage file and asks you to check whether it is complete. You must not approve the file. You must mark the 3 blank fields, list the 2 weak source IDs, and explain which 1 role-boundary point needs clarification. Major concepts: Advanced Biopharma Evidence Inventory and Authority-Boundary Triage evidence completeness; 8-field checklist logic; source-ID traceability; missing-data marking; ALCOA-style documentation thinking; role boundary between checking and approving. Artifact structure: Sections: record summary; required field list; missing-field table; source-ID table; role-boundary note; escalation flag. Evidence to assess: Field completeness; correct source IDs; clear missing-data notes; correct escalation flag; no approval claim. AI support: Use AI to ask checklist questions only. Do not let AI invent missing data or approve the record.',
  1,
  '90 minutes',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Pharm
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-007-L1' LIMIT 1),
  'B.Pharm',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Pharm Pharmaceutical Biotechnology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-007-L1' LIMIT 1),
  'M.Pharm Pharmaceutical Biotechnology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Biotechnology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-007-L1' LIMIT 1),
  'B.Sc Biotechnology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Sc Biotechnology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-007-L1' LIMIT 1),
  'M.Sc Biotechnology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech Biotechnology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-007-L1' LIMIT 1),
  'B.Tech Biotechnology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Clinical Trial Startup Records and Monitoring Action Evidence Control - Evidence Gap Recognition
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Clinical Trial Startup Records and Monitoring Action Evidence Control - Evidence Gap Recognition',
  'COURSE-CAP-008-L1',
  'A learner receives 1 Clinical Trial Startup Records and Monitoring Action Evidence Control record pack with 8 required fields. Three fields are blank, 2 source IDs are weak, and 1 owner note is unclear. The problem is to find what is missing before the record is used for review. Course objective: Recognize the required evidence fields for Clinical Trial Startup Records and Monitoring Action Evidence Control; identify 3 missing/unclear items; record source IDs; explain what must be escalated. Learner outcome: Learner can inspect a Clinical Trial Startup Records and Monitoring Action Evidence Control record and produce a checklist showing missing fields, weak source IDs, and role-boundary doubts.',
  '6 hours',
  'Active',
  'Pharma / Biotech / MedTech',
  'technical',
  '["Recognize the required evidence fields for Clinical Trial Startup Records and Monitoring Action Evidence Control; identify 3 missing/unclear items; record source IDs; explain what must be escalated.","Learner can inspect a Clinical Trial Startup Records and Monitoring Action Evidence Control record and produce a checklist showing missing fields, weak source IDs, and role-boundary doubts.","Create Clinical Trial Startup Records and Monitoring Action Evidence Control completeness checklist","Assess evidence using: Field completeness; correct source IDs; clear missing-data notes; correct escalation flag; no approval claim."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L1: Evidence Gap Recognition - CAP-008
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-008-L1' LIMIT 1),
  'L1: Evidence Gap Recognition - CAP-008',
  'You are supporting a workplace evidence review. Your manager gives you one Clinical Trial Startup Records and Monitoring Action Evidence Control file and asks you to check whether it is complete. You must not approve the file. You must mark the 3 blank fields, list the 2 weak source IDs, and explain which 1 role-boundary point needs clarification. Required data: Sample Clinical Trial Startup Records and Monitoring Action Evidence Control source record; 8 required fields list; 3 intentionally missing entries; 2 source-ID references; 1 role-boundary note; blank checklist template.',
  1,
  '["Pharma / Biotech / MedTech","Clinical Operations and Trial Startup Support","D-003","CAP-008","L1","Domain; Evidence; Cognitive; Compliance"]'::jsonb,
  '["Scenario Review","Evidence Check","Artifact Build","AI Coaching","Human Review","Retry and Improve","Portfolio Submission"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Clinical Trial Startup Records and Monitoring Action Evidence Control completeness checklist Practice
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-008-L1' LIMIT 1)
   AND title = 'L1: Evidence Gap Recognition - CAP-008' LIMIT 1),
  'Clinical Trial Startup Records and Monitoring Action Evidence Control completeness checklist Practice',
  'Complete the Clinical Trial Startup Records and Monitoring Action Evidence Control completeness checklist using the provided actuals and explain the evidence decision in simple workplace language.',
  'Workplace scenario: You are supporting a workplace evidence review. Your manager gives you one Clinical Trial Startup Records and Monitoring Action Evidence Control file and asks you to check whether it is complete. You must not approve the file. You must mark the 3 blank fields, list the 2 weak source IDs, and explain which 1 role-boundary point needs clarification. Major concepts: Clinical Trial Startup Records and Monitoring Action Evidence Control evidence completeness; 8-field checklist logic; source-ID traceability; missing-data marking; ALCOA-style documentation thinking; role boundary between checking and approving. Artifact structure: Sections: record summary; required field list; missing-field table; source-ID table; role-boundary note; escalation flag. Evidence to assess: Field completeness; correct source IDs; clear missing-data notes; correct escalation flag; no approval claim. AI support: Use AI to ask checklist questions only. Do not let AI invent missing data or approve the record.',
  1,
  '90 minutes',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Pharm
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-008-L1' LIMIT 1),
  'B.Pharm',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: Pharm.D
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-008-L1' LIMIT 1),
  'Pharm.D',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Clinical Research
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-008-L1' LIMIT 1),
  'B.Sc Clinical Research',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Sc Clinical Research
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-008-L1' LIMIT 1),
  'M.Sc Clinical Research',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Life Sciences
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-008-L1' LIMIT 1),
  'B.Sc Life Sciences',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Pharmacovigilance ICSR and Safety Evidence Handling - Evidence Gap Recognition
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Pharmacovigilance ICSR and Safety Evidence Handling - Evidence Gap Recognition',
  'COURSE-CAP-009-L1',
  'A learner receives 1 Pharmacovigilance ICSR and Safety Evidence Handling record pack with 8 required fields. Three fields are blank, 2 source IDs are weak, and 1 owner note is unclear. The problem is to find what is missing before the record is used for review. Course objective: Recognize the required evidence fields for Pharmacovigilance ICSR and Safety Evidence Handling; identify 3 missing/unclear items; record source IDs; explain what must be escalated. Learner outcome: Learner can inspect a Pharmacovigilance ICSR and Safety Evidence Handling record and produce a checklist showing missing fields, weak source IDs, and role-boundary doubts.',
  '6 hours',
  'Active',
  'Pharma / Biotech / MedTech',
  'technical',
  '["Recognize the required evidence fields for Pharmacovigilance ICSR and Safety Evidence Handling; identify 3 missing/unclear items; record source IDs; explain what must be escalated.","Learner can inspect a Pharmacovigilance ICSR and Safety Evidence Handling record and produce a checklist showing missing fields, weak source IDs, and role-boundary doubts.","Create Pharmacovigilance ICSR and Safety Evidence Handling completeness checklist","Assess evidence using: Field completeness; correct source IDs; clear missing-data notes; correct escalation flag; no approval claim."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L1: Evidence Gap Recognition - CAP-009
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-009-L1' LIMIT 1),
  'L1: Evidence Gap Recognition - CAP-009',
  'You are supporting a workplace evidence review. Your manager gives you one Pharmacovigilance ICSR and Safety Evidence Handling file and asks you to check whether it is complete. You must not approve the file. You must mark the 3 blank fields, list the 2 weak source IDs, and explain which 1 role-boundary point needs clarification. Required data: Sample Pharmacovigilance ICSR and Safety Evidence Handling source record; 8 required fields list; 3 intentionally missing entries; 2 source-ID references; 1 role-boundary note; blank checklist template.',
  1,
  '["Pharma / Biotech / MedTech","Pharmacovigilance and Medical Safety Evidence Operations","D-003","CAP-009","L1","Domain; Evidence; Cognitive; Compliance"]'::jsonb,
  '["Scenario Review","Evidence Check","Artifact Build","AI Coaching","Human Review","Retry and Improve","Portfolio Submission"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Pharmacovigilance ICSR and Safety Evidence Handling completeness checklist Practice
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-009-L1' LIMIT 1)
   AND title = 'L1: Evidence Gap Recognition - CAP-009' LIMIT 1),
  'Pharmacovigilance ICSR and Safety Evidence Handling completeness checklist Practice',
  'Complete the Pharmacovigilance ICSR and Safety Evidence Handling completeness checklist using the provided actuals and explain the evidence decision in simple workplace language.',
  'Workplace scenario: You are supporting a workplace evidence review. Your manager gives you one Pharmacovigilance ICSR and Safety Evidence Handling file and asks you to check whether it is complete. You must not approve the file. You must mark the 3 blank fields, list the 2 weak source IDs, and explain which 1 role-boundary point needs clarification. Major concepts: Pharmacovigilance ICSR and Safety Evidence Handling evidence completeness; 8-field checklist logic; source-ID traceability; missing-data marking; ALCOA-style documentation thinking; role boundary between checking and approving. Artifact structure: Sections: record summary; required field list; missing-field table; source-ID table; role-boundary note; escalation flag. Evidence to assess: Field completeness; correct source IDs; clear missing-data notes; correct escalation flag; no approval claim. AI support: Use AI to ask checklist questions only. Do not let AI invent missing data or approve the record.',
  1,
  '90 minutes',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Pharm
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-009-L1' LIMIT 1),
  'B.Pharm',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: Pharm.D
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-009-L1' LIMIT 1),
  'Pharm.D',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Pharm Pharmacology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-009-L1' LIMIT 1),
  'M.Pharm Pharmacology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Life Sciences
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-009-L1' LIMIT 1),
  'B.Sc Life Sciences',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Sc Pharmacology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-009-L1' LIMIT 1),
  'M.Sc Pharmacology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Clinical Dataset Mapping, Query Reconciliation and Data-Lock Packet Control - - Evidence Gap Recognition
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Clinical Dataset Mapping, Query Reconciliation and Data-Lock Packet Control - - Evidence Gap Recognition',
  'COURSE-CAP-010-L1',
  'A learner receives 1 Clinical Dataset Mapping, Query Reconciliation and Data-Lock Packet Control - record pack with 8 required fields. Three fields are blank, 2 source IDs are weak, and 1 owner note is unclear. The problem is to find what is missing before the record is used for review. Course objective: Recognize the required evidence fields for Clinical Dataset Mapping, Query Reconciliation and Data-Lock Packet Control -; identify 3 missing/unclear items; record source IDs; explain what must be escalated. Learner outcome: Learner can inspect a Clinical Dataset Mapping, Query Reconciliation and Data-Lock Packet Control - record and produce a checklist showing missing fields, weak source IDs, and role-boundary doubts.',
  '6 hours',
  'Active',
  'Pharma / Biotech / MedTech',
  'technical',
  '["Recognize the required evidence fields for Clinical Dataset Mapping, Query Reconciliation and Data-Lock Packet Control -; identify 3 missing/unclear items; record source IDs; explain what must be escalated.","Learner can inspect a Clinical Dataset Mapping, Query Reconciliation and Data-Lock Packet Control - record and produce a checklist showing missing fields, weak source IDs, and role-boundary doubts.","Create Clinical Dataset Mapping, Query Reconciliation and Data-Lock Packet Control - completeness checklist","Assess evidence using: Field completeness; correct source IDs; clear missing-data notes; correct escalation flag; no approval claim."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L1: Evidence Gap Recognition - CAP-010
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-010-L1' LIMIT 1),
  'L1: Evidence Gap Recognition - CAP-010',
  'You are supporting a workplace evidence review. Your manager gives you one Clinical Dataset Mapping, Query Reconciliation and Data-Lock Packet Control - file and asks you to check whether it is complete. You must not approve the file. You must mark the 3 blank fields, list the 2 weak source IDs, and explain which 1 role-boundary point needs clarification. Required data: Sample Clinical Dataset Mapping, Query Reconciliation and Data-Lock Packet Control - source record; 8 required fields list; 3 intentionally missing entries; 2 source-ID references; 1 role-boundary note; blank checklist template.',
  1,
  '["Pharma / Biotech / MedTech","Clinical Documentation and Data Services Support","D-003","CAP-010","L1","Domain; Evidence; Cognitive; Compliance"]'::jsonb,
  '["Scenario Review","Evidence Check","Artifact Build","AI Coaching","Human Review","Retry and Improve","Portfolio Submission"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Clinical Dataset Mapping, Query Reconciliation and Data-Lock Packet Control - completeness checklist Practice
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-010-L1' LIMIT 1)
   AND title = 'L1: Evidence Gap Recognition - CAP-010' LIMIT 1),
  'Clinical Dataset Mapping, Query Reconciliation and Data-Lock Packet Control - completeness checklist Practice',
  'Complete the Clinical Dataset Mapping, Query Reconciliation and Data-Lock Packet Control - completeness checklist using the provided actuals and explain the evidence decision in simple workplace language.',
  'Workplace scenario: You are supporting a workplace evidence review. Your manager gives you one Clinical Dataset Mapping, Query Reconciliation and Data-Lock Packet Control - file and asks you to check whether it is complete. You must not approve the file. You must mark the 3 blank fields, list the 2 weak source IDs, and explain which 1 role-boundary point needs clarification. Major concepts: Clinical Dataset Mapping, Query Reconciliation and Data-Lock Packet Control - evidence completeness; 8-field checklist logic; source-ID traceability; missing-data marking; ALCOA-style documentation thinking; role boundary between checking and approving. Artifact structure: Sections: record summary; required field list; missing-field table; source-ID table; role-boundary note; escalation flag. Evidence to assess: Field completeness; correct source IDs; clear missing-data notes; correct escalation flag; no approval claim. AI support: Use AI to ask checklist questions only. Do not let AI invent missing data or approve the record.',
  1,
  '90 minutes',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Pharm
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-010-L1' LIMIT 1),
  'B.Pharm',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Clinical Research
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-010-L1' LIMIT 1),
  'B.Sc Clinical Research',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Statistics
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-010-L1' LIMIT 1),
  'B.Sc Statistics',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Life Sciences
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-010-L1' LIMIT 1),
  'B.Sc Life Sciences',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Sc Clinical Data Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-010-L1' LIMIT 1),
  'M.Sc Clinical Data Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: NGS Run QC, Variant Calling and Genomics Reporting - Evidence Gap Recognition
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'NGS Run QC, Variant Calling and Genomics Reporting - Evidence Gap Recognition',
  'COURSE-CAP-011-L1',
  'A learner receives 1 NGS Run QC, Variant Calling and Genomics Reporting record pack with 8 required fields. Three fields are blank, 2 source IDs are weak, and 1 owner note is unclear. The problem is to find what is missing before the record is used for review. Course objective: Recognize the required evidence fields for NGS Run QC, Variant Calling and Genomics Reporting; identify 3 missing/unclear items; record source IDs; explain what must be escalated. Learner outcome: Learner can inspect an NGS Run QC, Variant Calling and Genomics Reporting record and produce a checklist showing missing fields, weak source IDs, and role-boundary doubts.',
  '6 hours',
  'Active',
  'Pharma / Biotech / MedTech',
  'technical',
  '["Recognize the required evidence fields for NGS Run QC, Variant Calling and Genomics Reporting; identify 3 missing/unclear items; record source IDs; explain what must be escalated.","Learner can inspect an NGS Run QC, Variant Calling and Genomics Reporting record and produce a checklist showing missing fields, weak source IDs, and role-boundary doubts.","Create NGS Run QC, Variant Calling and Genomics Reporting completeness checklist","Assess evidence using: Field completeness; correct source IDs; clear missing-data notes; correct escalation flag; no approval claim."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L1: Evidence Gap Recognition - CAP-011
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-011-L1' LIMIT 1),
  'L1: Evidence Gap Recognition - CAP-011',
  'You are supporting a workplace evidence review. Your manager gives you one NGS Run QC, Variant Calling and Genomics Reporting file and asks you to check whether it is complete. You must not approve the file. You must mark the 3 blank fields, list the 2 weak source IDs, and explain which 1 role-boundary point needs clarification. Required data: Sample NGS Run QC, Variant Calling and Genomics Reporting source record; 8 required fields list; 3 intentionally missing entries; 2 source-ID references; 1 role-boundary note; blank checklist template.',
  1,
  '["Pharma / Biotech / MedTech","Bioinformatics and Genomics Analysis Services","D-004","CAP-011","L1","Domain; Evidence; Cognitive; Compliance"]'::jsonb,
  '["Scenario Review","Evidence Check","Artifact Build","AI Coaching","Human Review","Retry and Improve","Portfolio Submission"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: NGS Run QC, Variant Calling and Genomics Reporting completeness checklist Practice
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-011-L1' LIMIT 1)
   AND title = 'L1: Evidence Gap Recognition - CAP-011' LIMIT 1),
  'NGS Run QC, Variant Calling and Genomics Reporting completeness checklist Practice',
  'Complete the NGS Run QC, Variant Calling and Genomics Reporting completeness checklist using the provided actuals and explain the evidence decision in simple workplace language.',
  'Workplace scenario: You are supporting a workplace evidence review. Your manager gives you one NGS Run QC, Variant Calling and Genomics Reporting file and asks you to check whether it is complete. You must not approve the file. You must mark the 3 blank fields, list the 2 weak source IDs, and explain which 1 role-boundary point needs clarification. Major concepts: NGS Run QC, Variant Calling and Genomics Reporting evidence completeness; 8-field checklist logic; source-ID traceability; missing-data marking; ALCOA-style documentation thinking; role boundary between checking and approving. Artifact structure: Sections: record summary; required field list; missing-field table; source-ID table; role-boundary note; escalation flag. Evidence to assess: Field completeness; correct source IDs; clear missing-data notes; correct escalation flag; no approval claim. AI support: Use AI to ask checklist questions only. Do not let AI invent missing data or approve the record.',
  1,
  '90 minutes',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Bioinformatics
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-011-L1' LIMIT 1),
  'B.Sc Bioinformatics',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Sc Bioinformatics
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-011-L1' LIMIT 1),
  'M.Sc Bioinformatics',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech Biotechnology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-011-L1' LIMIT 1),
  'B.Tech Biotechnology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Biotechnology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-011-L1' LIMIT 1),
  'B.Sc Biotechnology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Sc Genomics
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-011-L1' LIMIT 1),
  'M.Sc Genomics',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Bioservices Sample Result, Assay Run and Research Tool Lot Evidence Control - - Evidence Gap Recognition
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Bioservices Sample Result, Assay Run and Research Tool Lot Evidence Control - - Evidence Gap Recognition',
  'COURSE-CAP-012-L1',
  'A learner receives 1 Bioservices Sample Result, Assay Run and Research Tool Lot Evidence Control - record pack with 8 required fields. Three fields are blank, 2 source IDs are weak, and 1 owner note is unclear. The problem is to find what is missing before the record is used for review. Course objective: Recognize the required evidence fields for Bioservices Sample Result, Assay Run and Research Tool Lot Evidence Control -; identify 3 missing/unclear items; record source IDs; explain what must be escalated. Learner outcome: Learner can inspect a Bioservices Sample Result, Assay Run and Research Tool Lot Evidence Control - record and produce a checklist showing missing fields, weak source IDs, and role-boundary doubts.',
  '6 hours',
  'Active',
  'Pharma / Biotech / MedTech',
  'technical',
  '["Recognize the required evidence fields for Bioservices Sample Result, Assay Run and Research Tool Lot Evidence Control -; identify 3 missing/unclear items; record source IDs; explain what must be escalated.","Learner can inspect a Bioservices Sample Result, Assay Run and Research Tool Lot Evidence Control - record and produce a checklist showing missing fields, weak source IDs, and role-boundary doubts.","Create Bioservices Sample Result, Assay Run and Research Tool Lot Evidence Control - completeness checklist","Assess evidence using: Field completeness; correct source IDs; clear missing-data notes; correct escalation flag; no approval claim."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L1: Evidence Gap Recognition - CAP-012
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-012-L1' LIMIT 1),
  'L1: Evidence Gap Recognition - CAP-012',
  'You are supporting a workplace evidence review. Your manager gives you one Bioservices Sample Result, Assay Run and Research Tool Lot Evidence Control - file and asks you to check whether it is complete. You must not approve the file. You must mark the 3 blank fields, list the 2 weak source IDs, and explain which 1 role-boundary point needs clarification. Required data: Sample Bioservices Sample Result, Assay Run and Research Tool Lot Evidence Control - source record; 8 required fields list; 3 intentionally missing entries; 2 source-ID references; 1 role-boundary note; blank checklist template.',
  1,
  '["Pharma / Biotech / MedTech","Wet-Lab Bioservices and Research Tool Support","D-004","CAP-012","L1","Domain; Evidence; Cognitive; Compliance"]'::jsonb,
  '["Scenario Review","Evidence Check","Artifact Build","AI Coaching","Human Review","Retry and Improve","Portfolio Submission"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Bioservices Sample Result, Assay Run and Research Tool Lot Evidence Control - completeness checklist Practice
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-012-L1' LIMIT 1)
   AND title = 'L1: Evidence Gap Recognition - CAP-012' LIMIT 1),
  'Bioservices Sample Result, Assay Run and Research Tool Lot Evidence Control - completeness checklist Practice',
  'Complete the Bioservices Sample Result, Assay Run and Research Tool Lot Evidence Control - completeness checklist using the provided actuals and explain the evidence decision in simple workplace language.',
  'Workplace scenario: You are supporting a workplace evidence review. Your manager gives you one Bioservices Sample Result, Assay Run and Research Tool Lot Evidence Control - file and asks you to check whether it is complete. You must not approve the file. You must mark the 3 blank fields, list the 2 weak source IDs, and explain which 1 role-boundary point needs clarification. Major concepts: Bioservices Sample Result, Assay Run and Research Tool Lot Evidence Control - evidence completeness; 8-field checklist logic; source-ID traceability; missing-data marking; ALCOA-style documentation thinking; role boundary between checking and approving. Artifact structure: Sections: record summary; required field list; missing-field table; source-ID table; role-boundary note; escalation flag. Evidence to assess: Field completeness; correct source IDs; clear missing-data notes; correct escalation flag; no approval claim. AI support: Use AI to ask checklist questions only. Do not let AI invent missing data or approve the record.',
  1,
  '90 minutes',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Biotechnology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-012-L1' LIMIT 1),
  'B.Sc Biotechnology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Sc Biotechnology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-012-L1' LIMIT 1),
  'M.Sc Biotechnology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Microbiology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-012-L1' LIMIT 1),
  'B.Sc Microbiology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Sc Biochemistry
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-012-L1' LIMIT 1),
  'M.Sc Biochemistry',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Life Sciences
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-012-L1' LIMIT 1),
  'B.Sc Life Sciences',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Biofoundry DBTL Cycle Evidence Execution - Evidence Gap Recognition
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Biofoundry DBTL Cycle Evidence Execution - Evidence Gap Recognition',
  'COURSE-CAP-013-L1',
  'A learner receives 1 Biofoundry DBTL Cycle Evidence Execution record pack with 8 required fields. Three fields are blank, 2 source IDs are weak, and 1 owner note is unclear. The problem is to find what is missing before the record is used for review. Course objective: Recognize the required evidence fields for Biofoundry DBTL Cycle Evidence Execution; identify 3 missing/unclear items; record source IDs; explain what must be escalated. Learner outcome: Learner can inspect a Biofoundry DBTL Cycle Evidence Execution record and produce a checklist showing missing fields, weak source IDs, and role-boundary doubts.',
  '6 hours',
  'Active',
  'Pharma / Biotech / MedTech',
  'technical',
  '["Recognize the required evidence fields for Biofoundry DBTL Cycle Evidence Execution; identify 3 missing/unclear items; record source IDs; explain what must be escalated.","Learner can inspect a Biofoundry DBTL Cycle Evidence Execution record and produce a checklist showing missing fields, weak source IDs, and role-boundary doubts.","Create Biofoundry DBTL Cycle Evidence Execution completeness checklist","Assess evidence using: Field completeness; correct source IDs; clear missing-data notes; correct escalation flag; no approval claim."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L1: Evidence Gap Recognition - CAP-013
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-013-L1' LIMIT 1),
  'L1: Evidence Gap Recognition - CAP-013',
  'You are supporting a workplace evidence review. Your manager gives you one Biofoundry DBTL Cycle Evidence Execution file and asks you to check whether it is complete. You must not approve the file. You must mark the 3 blank fields, list the 2 weak source IDs, and explain which 1 role-boundary point needs clarification. Required data: Sample Biofoundry DBTL Cycle Evidence Execution source record; 8 required fields list; 3 intentionally missing entries; 2 source-ID references; 1 role-boundary note; blank checklist template.',
  1,
  '["Pharma / Biotech / MedTech","Industrial Biomanufacturing and Biofoundry Operations","D-005","CAP-013","L1","Domain; Evidence; Cognitive; Compliance"]'::jsonb,
  '["Scenario Review","Evidence Check","Artifact Build","AI Coaching","Human Review","Retry and Improve","Portfolio Submission"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Biofoundry DBTL Cycle Evidence Execution completeness checklist Practice
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-013-L1' LIMIT 1)
   AND title = 'L1: Evidence Gap Recognition - CAP-013' LIMIT 1),
  'Biofoundry DBTL Cycle Evidence Execution completeness checklist Practice',
  'Complete the Biofoundry DBTL Cycle Evidence Execution completeness checklist using the provided actuals and explain the evidence decision in simple workplace language.',
  'Workplace scenario: You are supporting a workplace evidence review. Your manager gives you one Biofoundry DBTL Cycle Evidence Execution file and asks you to check whether it is complete. You must not approve the file. You must mark the 3 blank fields, list the 2 weak source IDs, and explain which 1 role-boundary point needs clarification. Major concepts: Biofoundry DBTL Cycle Evidence Execution evidence completeness; 8-field checklist logic; source-ID traceability; missing-data marking; ALCOA-style documentation thinking; role boundary between checking and approving. Artifact structure: Sections: record summary; required field list; missing-field table; source-ID table; role-boundary note; escalation flag. Evidence to assess: Field completeness; correct source IDs; clear missing-data notes; correct escalation flag; no approval claim. AI support: Use AI to ask checklist questions only. Do not let AI invent missing data or approve the record.',
  1,
  '90 minutes',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech Biotechnology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-013-L1' LIMIT 1),
  'B.Tech Biotechnology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Tech Biotechnology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-013-L1' LIMIT 1),
  'M.Tech Biotechnology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Biotechnology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-013-L1' LIMIT 1),
  'B.Sc Biotechnology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Sc Synthetic Biology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-013-L1' LIMIT 1),
  'M.Sc Synthetic Biology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Sc Industrial Biotechnology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-013-L1' LIMIT 1),
  'M.Sc Industrial Biotechnology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Industrial Bioprocess Scale-Up and Product Evidence Handoff - Evidence Gap Recognition
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Industrial Bioprocess Scale-Up and Product Evidence Handoff - Evidence Gap Recognition',
  'COURSE-CAP-014-L1',
  'A learner receives 1 Industrial Bioprocess Scale-Up and Product Evidence Handoff record pack with 8 required fields. Three fields are blank, 2 source IDs are weak, and 1 owner note is unclear. The problem is to find what is missing before the record is used for review. Course objective: Recognize the required evidence fields for Industrial Bioprocess Scale-Up and Product Evidence Handoff; identify 3 missing/unclear items; record source IDs; explain what must be escalated. Learner outcome: Learner can inspect an Industrial Bioprocess Scale-Up and Product Evidence Handoff record and produce a checklist showing missing fields, weak source IDs, and role-boundary doubts.',
  '6 hours',
  'Active',
  'Pharma / Biotech / MedTech',
  'technical',
  '["Recognize the required evidence fields for Industrial Bioprocess Scale-Up and Product Evidence Handoff; identify 3 missing/unclear items; record source IDs; explain what must be escalated.","Learner can inspect an Industrial Bioprocess Scale-Up and Product Evidence Handoff record and produce a checklist showing missing fields, weak source IDs, and role-boundary doubts.","Create Industrial Bioprocess Scale-Up and Product Evidence Handoff completeness checklist","Assess evidence using: Field completeness; correct source IDs; clear missing-data notes; correct escalation flag; no approval claim."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L1: Evidence Gap Recognition - CAP-014
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-014-L1' LIMIT 1),
  'L1: Evidence Gap Recognition - CAP-014',
  'You are supporting a workplace evidence review. Your manager gives you one Industrial Bioprocess Scale-Up and Product Evidence Handoff file and asks you to check whether it is complete. You must not approve the file. You must mark the 3 blank fields, list the 2 weak source IDs, and explain which 1 role-boundary point needs clarification. Required data: Sample Industrial Bioprocess Scale-Up and Product Evidence Handoff source record; 8 required fields list; 3 intentionally missing entries; 2 source-ID references; 1 role-boundary note; blank checklist template.',
  1,
  '["Pharma / Biotech / MedTech","Industrial Biomanufacturing and Biofoundry Operations","D-005","CAP-014","L1","Domain; Evidence; Cognitive; Compliance"]'::jsonb,
  '["Scenario Review","Evidence Check","Artifact Build","AI Coaching","Human Review","Retry and Improve","Portfolio Submission"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Industrial Bioprocess Scale-Up and Product Evidence Handoff completeness checklist Practice
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-014-L1' LIMIT 1)
   AND title = 'L1: Evidence Gap Recognition - CAP-014' LIMIT 1),
  'Industrial Bioprocess Scale-Up and Product Evidence Handoff completeness checklist Practice',
  'Complete the Industrial Bioprocess Scale-Up and Product Evidence Handoff completeness checklist using the provided actuals and explain the evidence decision in simple workplace language.',
  'Workplace scenario: You are supporting a workplace evidence review. Your manager gives you one Industrial Bioprocess Scale-Up and Product Evidence Handoff file and asks you to check whether it is complete. You must not approve the file. You must mark the 3 blank fields, list the 2 weak source IDs, and explain which 1 role-boundary point needs clarification. Major concepts: Industrial Bioprocess Scale-Up and Product Evidence Handoff evidence completeness; 8-field checklist logic; source-ID traceability; missing-data marking; ALCOA-style documentation thinking; role boundary between checking and approving. Artifact structure: Sections: record summary; required field list; missing-field table; source-ID table; role-boundary note; escalation flag. Evidence to assess: Field completeness; correct source IDs; clear missing-data notes; correct escalation flag; no approval claim. AI support: Use AI to ask checklist questions only. Do not let AI invent missing data or approve the record.',
  1,
  '90 minutes',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech Biotechnology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-014-L1' LIMIT 1),
  'B.Tech Biotechnology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Tech Bioprocess Engineering
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-014-L1' LIMIT 1),
  'M.Tech Bioprocess Engineering',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Biotechnology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-014-L1' LIMIT 1),
  'B.Sc Biotechnology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Sc Industrial Biotechnology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-014-L1' LIMIT 1),
  'M.Sc Industrial Biotechnology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Pharm
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-014-L1' LIMIT 1),
  'B.Pharm',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Agri-Biotech Trait, Field Trial and Stewardship Evidence Packet Control - Evidence Gap Recognition
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Agri-Biotech Trait, Field Trial and Stewardship Evidence Packet Control - Evidence Gap Recognition',
  'COURSE-CAP-015-L1',
  'A learner receives 1 Agri-Biotech Trait, Field Trial and Stewardship Evidence Packet Control record pack with 8 required fields. Three fields are blank, 2 source IDs are weak, and 1 owner note is unclear. The problem is to find what is missing before the record is used for review. Course objective: Recognize the required evidence fields for Agri-Biotech Trait, Field Trial and Stewardship Evidence Packet Control; identify 3 missing/unclear items; record source IDs; explain what must be escalated. Learner outcome: Learner can inspect an Agri-Biotech Trait, Field Trial and Stewardship Evidence Packet Control record and produce a checklist showing missing fields, weak source IDs, and role-boundary doubts.',
  '6 hours',
  'Active',
  'Pharma / Biotech / MedTech',
  'technical',
  '["Recognize the required evidence fields for Agri-Biotech Trait, Field Trial and Stewardship Evidence Packet Control; identify 3 missing/unclear items; record source IDs; explain what must be escalated.","Learner can inspect an Agri-Biotech Trait, Field Trial and Stewardship Evidence Packet Control record and produce a checklist showing missing fields, weak source IDs, and role-boundary doubts.","Create Agri-Biotech Trait, Field Trial and Stewardship Evidence Packet Control completeness checklist","Assess evidence using: Field completeness; correct source IDs; clear missing-data notes; correct escalation flag; no approval claim."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L1: Evidence Gap Recognition - CAP-015
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-015-L1' LIMIT 1),
  'L1: Evidence Gap Recognition - CAP-015',
  'You are supporting a workplace evidence review. Your manager gives you one Agri-Biotech Trait, Field Trial and Stewardship Evidence Packet Control file and asks you to check whether it is complete. You must not approve the file. You must mark the 3 blank fields, list the 2 weak source IDs, and explain which 1 role-boundary point needs clarification. Required data: Sample Agri-Biotech Trait, Field Trial and Stewardship Evidence Packet Control source record; 8 required fields list; 3 intentionally missing entries; 2 source-ID references; 1 role-boundary note; blank checklist template.',
  1,
  '["Pharma / Biotech / MedTech","Agri-Biotech and Seed Biotechnology Affairs","D-006","CAP-015","L1","Domain; Evidence; Cognitive; Compliance"]'::jsonb,
  '["Scenario Review","Evidence Check","Artifact Build","AI Coaching","Human Review","Retry and Improve","Portfolio Submission"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Agri-Biotech Trait, Field Trial and Stewardship Evidence Packet Control completeness checklist Practice
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-015-L1' LIMIT 1)
   AND title = 'L1: Evidence Gap Recognition - CAP-015' LIMIT 1),
  'Agri-Biotech Trait, Field Trial and Stewardship Evidence Packet Control completeness checklist Practice',
  'Complete the Agri-Biotech Trait, Field Trial and Stewardship Evidence Packet Control completeness checklist using the provided actuals and explain the evidence decision in simple workplace language.',
  'Workplace scenario: You are supporting a workplace evidence review. Your manager gives you one Agri-Biotech Trait, Field Trial and Stewardship Evidence Packet Control file and asks you to check whether it is complete. You must not approve the file. You must mark the 3 blank fields, list the 2 weak source IDs, and explain which 1 role-boundary point needs clarification. Major concepts: Agri-Biotech Trait, Field Trial and Stewardship Evidence Packet Control evidence completeness; 8-field checklist logic; source-ID traceability; missing-data marking; ALCOA-style documentation thinking; role boundary between checking and approving. Artifact structure: Sections: record summary; required field list; missing-field table; source-ID table; role-boundary note; escalation flag. Evidence to assess: Field completeness; correct source IDs; clear missing-data notes; correct escalation flag; no approval claim. AI support: Use AI to ask checklist questions only. Do not let AI invent missing data or approve the record.',
  1,
  '90 minutes',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Agriculture
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-015-L1' LIMIT 1),
  'B.Sc Agriculture',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Sc Plant Biotechnology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-015-L1' LIMIT 1),
  'M.Sc Plant Biotechnology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Biotechnology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-015-L1' LIMIT 1),
  'B.Sc Biotechnology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Sc Genetics and Plant Breeding
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-015-L1' LIMIT 1),
  'M.Sc Genetics and Plant Breeding',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech Biotechnology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-015-L1' LIMIT 1),
  'B.Tech Biotechnology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Agri-Biotech License-to-Operate Evidence Coordination - Evidence Gap Recognition
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Agri-Biotech License-to-Operate Evidence Coordination - Evidence Gap Recognition',
  'COURSE-CAP-016-L1',
  'A learner receives 1 Agri-Biotech License-to-Operate Evidence Coordination record pack with 8 required fields. Three fields are blank, 2 source IDs are weak, and 1 owner note is unclear. The problem is to find what is missing before the record is used for review. Course objective: Recognize the required evidence fields for Agri-Biotech License-to-Operate Evidence Coordination; identify 3 missing/unclear items; record source IDs; explain what must be escalated. Learner outcome: Learner can inspect an Agri-Biotech License-to-Operate Evidence Coordination record and produce a checklist showing missing fields, weak source IDs, and role-boundary doubts.',
  '6 hours',
  'Active',
  'Pharma / Biotech / MedTech',
  'technical',
  '["Recognize the required evidence fields for Agri-Biotech License-to-Operate Evidence Coordination; identify 3 missing/unclear items; record source IDs; explain what must be escalated.","Learner can inspect an Agri-Biotech License-to-Operate Evidence Coordination record and produce a checklist showing missing fields, weak source IDs, and role-boundary doubts.","Create Agri-Biotech License-to-Operate Evidence Coordination completeness checklist","Assess evidence using: Field completeness; correct source IDs; clear missing-data notes; correct escalation flag; no approval claim."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L1: Evidence Gap Recognition - CAP-016
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-016-L1' LIMIT 1),
  'L1: Evidence Gap Recognition - CAP-016',
  'You are supporting a workplace evidence review. Your manager gives you one Agri-Biotech License-to-Operate Evidence Coordination file and asks you to check whether it is complete. You must not approve the file. You must mark the 3 blank fields, list the 2 weak source IDs, and explain which 1 role-boundary point needs clarification. Required data: Sample Agri-Biotech License-to-Operate Evidence Coordination source record; 8 required fields list; 3 intentionally missing entries; 2 source-ID references; 1 role-boundary note; blank checklist template.',
  1,
  '["Pharma / Biotech / MedTech","Agri-Biotech and Seed Biotechnology Affairs","D-006","CAP-016","L1","Domain; Evidence; Cognitive; Compliance"]'::jsonb,
  '["Scenario Review","Evidence Check","Artifact Build","AI Coaching","Human Review","Retry and Improve","Portfolio Submission"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Agri-Biotech License-to-Operate Evidence Coordination completeness checklist Practice
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-016-L1' LIMIT 1)
   AND title = 'L1: Evidence Gap Recognition - CAP-016' LIMIT 1),
  'Agri-Biotech License-to-Operate Evidence Coordination completeness checklist Practice',
  'Complete the Agri-Biotech License-to-Operate Evidence Coordination completeness checklist using the provided actuals and explain the evidence decision in simple workplace language.',
  'Workplace scenario: You are supporting a workplace evidence review. Your manager gives you one Agri-Biotech License-to-Operate Evidence Coordination file and asks you to check whether it is complete. You must not approve the file. You must mark the 3 blank fields, list the 2 weak source IDs, and explain which 1 role-boundary point needs clarification. Major concepts: Agri-Biotech License-to-Operate Evidence Coordination evidence completeness; 8-field checklist logic; source-ID traceability; missing-data marking; ALCOA-style documentation thinking; role boundary between checking and approving. Artifact structure: Sections: record summary; required field list; missing-field table; source-ID table; role-boundary note; escalation flag. Evidence to assess: Field completeness; correct source IDs; clear missing-data notes; correct escalation flag; no approval claim. AI support: Use AI to ask checklist questions only. Do not let AI invent missing data or approve the record.',
  1,
  '90 minutes',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Agriculture
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-016-L1' LIMIT 1),
  'B.Sc Agriculture',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Sc Agriculture Biotechnology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-016-L1' LIMIT 1),
  'M.Sc Agriculture Biotechnology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Biotechnology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-016-L1' LIMIT 1),
  'B.Sc Biotechnology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Sc Regulatory Affairs
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-016-L1' LIMIT 1),
  'M.Sc Regulatory Affairs',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech Biotechnology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-016-L1' LIMIT 1),
  'B.Tech Biotechnology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Medical Device Technical File, QMS and Post-Market Evidence Control - Evidence Gap Recognition
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Medical Device Technical File, QMS and Post-Market Evidence Control - Evidence Gap Recognition',
  'COURSE-CAP-017-L1',
  'A learner receives 1 Medical Device Technical File, QMS and Post-Market Evidence Control record pack with 8 required fields. Three fields are blank, 2 source IDs are weak, and 1 owner note is unclear. The problem is to find what is missing before the record is used for review. Course objective: Recognize the required evidence fields for Medical Device Technical File, QMS and Post-Market Evidence Control; identify 3 missing/unclear items; record source IDs; explain what must be escalated. Learner outcome: Learner can inspect a Medical Device Technical File, QMS and Post-Market Evidence Control record and produce a checklist showing missing fields, weak source IDs, and role-boundary doubts.',
  '6 hours',
  'Active',
  'Pharma / Biotech / MedTech',
  'technical',
  '["Recognize the required evidence fields for Medical Device Technical File, QMS and Post-Market Evidence Control; identify 3 missing/unclear items; record source IDs; explain what must be escalated.","Learner can inspect a Medical Device Technical File, QMS and Post-Market Evidence Control record and produce a checklist showing missing fields, weak source IDs, and role-boundary doubts.","Create Medical Device Technical File, QMS and Post-Market Evidence Control completeness checklist","Assess evidence using: Field completeness; correct source IDs; clear missing-data notes; correct escalation flag; no approval claim."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L1: Evidence Gap Recognition - CAP-017
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-017-L1' LIMIT 1),
  'L1: Evidence Gap Recognition - CAP-017',
  'You are supporting a workplace evidence review. Your manager gives you one Medical Device Technical File, QMS and Post-Market Evidence Control file and asks you to check whether it is complete. You must not approve the file. You must mark the 3 blank fields, list the 2 weak source IDs, and explain which 1 role-boundary point needs clarification. Required data: Sample Medical Device Technical File, QMS and Post-Market Evidence Control source record; 8 required fields list; 3 intentionally missing entries; 2 source-ID references; 1 role-boundary note; blank checklist template.',
  1,
  '["Pharma / Biotech / MedTech","Medical Device Regulatory and Quality Operations","D-007","CAP-017","L1","Domain; Evidence; Cognitive; Compliance"]'::jsonb,
  '["Scenario Review","Evidence Check","Artifact Build","AI Coaching","Human Review","Retry and Improve","Portfolio Submission"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Medical Device Technical File, QMS and Post-Market Evidence Control completeness checklist Practice
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-017-L1' LIMIT 1)
   AND title = 'L1: Evidence Gap Recognition - CAP-017' LIMIT 1),
  'Medical Device Technical File, QMS and Post-Market Evidence Control completeness checklist Practice',
  'Complete the Medical Device Technical File, QMS and Post-Market Evidence Control completeness checklist using the provided actuals and explain the evidence decision in simple workplace language.',
  'Workplace scenario: You are supporting a workplace evidence review. Your manager gives you one Medical Device Technical File, QMS and Post-Market Evidence Control file and asks you to check whether it is complete. You must not approve the file. You must mark the 3 blank fields, list the 2 weak source IDs, and explain which 1 role-boundary point needs clarification. Major concepts: Medical Device Technical File, QMS and Post-Market Evidence Control evidence completeness; 8-field checklist logic; source-ID traceability; missing-data marking; ALCOA-style documentation thinking; role boundary between checking and approving. Artifact structure: Sections: record summary; required field list; missing-field table; source-ID table; role-boundary note; escalation flag. Evidence to assess: Field completeness; correct source IDs; clear missing-data notes; correct escalation flag; no approval claim. AI support: Use AI to ask checklist questions only. Do not let AI invent missing data or approve the record.',
  1,
  '90 minutes',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Pharm
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-017-L1' LIMIT 1),
  'B.Pharm',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Pharm Regulatory Affairs
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-017-L1' LIMIT 1),
  'M.Pharm Regulatory Affairs',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech Biomedical Engineering
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-017-L1' LIMIT 1),
  'B.Tech Biomedical Engineering',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Life Sciences
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-017-L1' LIMIT 1),
  'B.Sc Life Sciences',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Sc Medical Technology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-017-L1' LIMIT 1),
  'M.Sc Medical Technology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Device QC Test Report and Biomedical Equipment Nonconformance Packet Control - Evidence Gap Recognition
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Device QC Test Report and Biomedical Equipment Nonconformance Packet Control - Evidence Gap Recognition',
  'COURSE-CAP-018A-L1',
  'A learner receives 1 Device QC Test Report and Biomedical Equipment Nonconformance Packet Control record pack with 8 required fields. Three fields are blank, 2 source IDs are weak, and 1 owner note is unclear. The problem is to find what is missing before the record is used for review. Course objective: Recognize the required evidence fields for Device QC Test Report and Biomedical Equipment Nonconformance Packet Control; identify 3 missing/unclear items; record source IDs; explain what must be escalated. Learner outcome: Learner can inspect a Device QC Test Report and Biomedical Equipment Nonconformance Packet Control record and produce a checklist showing missing fields, weak source IDs, and role-boundary doubts.',
  '6 hours',
  'Active',
  'Pharma / Biotech / MedTech',
  'technical',
  '["Recognize the required evidence fields for Device QC Test Report and Biomedical Equipment Nonconformance Packet Control; identify 3 missing/unclear items; record source IDs; explain what must be escalated.","Learner can inspect a Device QC Test Report and Biomedical Equipment Nonconformance Packet Control record and produce a checklist showing missing fields, weak source IDs, and role-boundary doubts.","Create Device QC Test Report and Biomedical Equipment Nonconformance Packet Control completeness checklist","Assess evidence using: Field completeness; correct source IDs; clear missing-data notes; correct escalation flag; no approval claim."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L1: Evidence Gap Recognition - CAP-018A
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-018A-L1' LIMIT 1),
  'L1: Evidence Gap Recognition - CAP-018A',
  'You are supporting a workplace evidence review. Your manager gives you one Device QC Test Report and Biomedical Equipment Nonconformance Packet Control file and asks you to check whether it is complete. You must not approve the file. You must mark the 3 blank fields, list the 2 weak source IDs, and explain which 1 role-boundary point needs clarification. Required data: Sample Device QC Test Report and Biomedical Equipment Nonconformance Packet Control source record; 8 required fields list; 3 intentionally missing entries; 2 source-ID references; 1 role-boundary note; blank checklist template.',
  1,
  '["Pharma / Biotech / MedTech","Medical Device QC Testing and Biomedical Equipment Evidence","D-007","CAP-018A","L1","Domain; Evidence; Cognitive; Compliance"]'::jsonb,
  '["Scenario Review","Evidence Check","Artifact Build","AI Coaching","Human Review","Retry and Improve","Portfolio Submission"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Device QC Test Report and Biomedical Equipment Nonconformance Packet Control completeness checklist Practice
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-018A-L1' LIMIT 1)
   AND title = 'L1: Evidence Gap Recognition - CAP-018A' LIMIT 1),
  'Device QC Test Report and Biomedical Equipment Nonconformance Packet Control completeness checklist Practice',
  'Complete the Device QC Test Report and Biomedical Equipment Nonconformance Packet Control completeness checklist using the provided actuals and explain the evidence decision in simple workplace language.',
  'Workplace scenario: You are supporting a workplace evidence review. Your manager gives you one Device QC Test Report and Biomedical Equipment Nonconformance Packet Control file and asks you to check whether it is complete. You must not approve the file. You must mark the 3 blank fields, list the 2 weak source IDs, and explain which 1 role-boundary point needs clarification. Major concepts: Device QC Test Report and Biomedical Equipment Nonconformance Packet Control evidence completeness; 8-field checklist logic; source-ID traceability; missing-data marking; ALCOA-style documentation thinking; role boundary between checking and approving. Artifact structure: Sections: record summary; required field list; missing-field table; source-ID table; role-boundary note; escalation flag. Evidence to assess: Field completeness; correct source IDs; clear missing-data notes; correct escalation flag; no approval claim. AI support: Use AI to ask checklist questions only. Do not let AI invent missing data or approve the record.',
  1,
  '90 minutes',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech Biomedical Engineering
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-018A-L1' LIMIT 1),
  'B.Tech Biomedical Engineering',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: Diploma Biomedical Engineering
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-018A-L1' LIMIT 1),
  'Diploma Biomedical Engineering',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Medical Laboratory Technology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-018A-L1' LIMIT 1),
  'B.Sc Medical Laboratory Technology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech Electronics and Instrumentation
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-018A-L1' LIMIT 1),
  'B.Tech Electronics and Instrumentation',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Physics
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-018A-L1' LIMIT 1),
  'B.Sc Physics',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: IVD Performance, Diagnostic Evidence and PMS Packet Control - Evidence Gap Recognition
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'IVD Performance, Diagnostic Evidence and PMS Packet Control - Evidence Gap Recognition',
  'COURSE-CAP-018B-L1',
  'A learner receives 1 IVD Performance, Diagnostic Evidence and PMS Packet Control record pack with 8 required fields. Three fields are blank, 2 source IDs are weak, and 1 owner note is unclear. The problem is to find what is missing before the record is used for review. Course objective: Recognize the required evidence fields for IVD Performance, Diagnostic Evidence and PMS Packet Control; identify 3 missing/unclear items; record source IDs; explain what must be escalated. Learner outcome: Learner can inspect an IVD Performance, Diagnostic Evidence and PMS Packet Control record and produce a checklist showing missing fields, weak source IDs, and role-boundary doubts.',
  '6 hours',
  'Active',
  'Pharma / Biotech / MedTech',
  'technical',
  '["Recognize the required evidence fields for IVD Performance, Diagnostic Evidence and PMS Packet Control; identify 3 missing/unclear items; record source IDs; explain what must be escalated.","Learner can inspect an IVD Performance, Diagnostic Evidence and PMS Packet Control record and produce a checklist showing missing fields, weak source IDs, and role-boundary doubts.","Create IVD Performance, Diagnostic Evidence and PMS Packet Control completeness checklist","Assess evidence using: Field completeness; correct source IDs; clear missing-data notes; correct escalation flag; no approval claim."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L1: Evidence Gap Recognition - CAP-018B
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-018B-L1' LIMIT 1),
  'L1: Evidence Gap Recognition - CAP-018B',
  'You are supporting a workplace evidence review. Your manager gives you one IVD Performance, Diagnostic Evidence and PMS Packet Control file and asks you to check whether it is complete. You must not approve the file. You must mark the 3 blank fields, list the 2 weak source IDs, and explain which 1 role-boundary point needs clarification. Required data: Sample IVD Performance, Diagnostic Evidence and PMS Packet Control source record; 8 required fields list; 3 intentionally missing entries; 2 source-ID references; 1 role-boundary note; blank checklist template.',
  1,
  '["Pharma / Biotech / MedTech","IVD Regulatory and Performance Evaluation Operations","Medical Device Softwar","D-007","CAP-018B","L1","Domain; Evidence; Cognitive; Compliance"]'::jsonb,
  '["Scenario Review","Evidence Check","Artifact Build","AI Coaching","Human Review","Retry and Improve","Portfolio Submission"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: IVD Performance, Diagnostic Evidence and PMS Packet Control completeness checklist Practice
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-018B-L1' LIMIT 1)
   AND title = 'L1: Evidence Gap Recognition - CAP-018B' LIMIT 1),
  'IVD Performance, Diagnostic Evidence and PMS Packet Control completeness checklist Practice',
  'Complete the IVD Performance, Diagnostic Evidence and PMS Packet Control completeness checklist using the provided actuals and explain the evidence decision in simple workplace language.',
  'Workplace scenario: You are supporting a workplace evidence review. Your manager gives you one IVD Performance, Diagnostic Evidence and PMS Packet Control file and asks you to check whether it is complete. You must not approve the file. You must mark the 3 blank fields, list the 2 weak source IDs, and explain which 1 role-boundary point needs clarification. Major concepts: IVD Performance, Diagnostic Evidence and PMS Packet Control evidence completeness; 8-field checklist logic; source-ID traceability; missing-data marking; ALCOA-style documentation thinking; role boundary between checking and approving. Artifact structure: Sections: record summary; required field list; missing-field table; source-ID table; role-boundary note; escalation flag. Evidence to assess: Field completeness; correct source IDs; clear missing-data notes; correct escalation flag; no approval claim. AI support: Use AI to ask checklist questions only. Do not let AI invent missing data or approve the record.',
  1,
  '90 minutes',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Medical Laboratory Technology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-018B-L1' LIMIT 1),
  'B.Sc Medical Laboratory Technology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Sc Clinical Biochemistry
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-018B-L1' LIMIT 1),
  'M.Sc Clinical Biochemistry',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Sc Microbiology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-018B-L1' LIMIT 1),
  'M.Sc Microbiology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech Biotechnology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-018B-L1' LIMIT 1),
  'B.Tech Biotechnology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Biotechnology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-018B-L1' LIMIT 1),
  'B.Sc Biotechnology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: SaMD Lifecycle, V&V and Cybersecurity Evidence Index Control - Evidence Gap Recognition
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'SaMD Lifecycle, V&V and Cybersecurity Evidence Index Control - Evidence Gap Recognition',
  'COURSE-CAP-018C-L1',
  'A learner receives 1 SaMD Lifecycle, V&V and Cybersecurity Evidence Index Control record pack with 8 required fields. Three fields are blank, 2 source IDs are weak, and 1 owner note is unclear. The problem is to find what is missing before the record is used for review. Course objective: Recognize the required evidence fields for SaMD Lifecycle, V&V and Cybersecurity Evidence Index Control; identify 3 missing/unclear items; record source IDs; explain what must be escalated. Learner outcome: Learner can inspect a SaMD Lifecycle, V&V and Cybersecurity Evidence Index Control record and produce a checklist showing missing fields, weak source IDs, and role-boundary doubts.',
  '6 hours',
  'Active',
  'Pharma / Biotech / MedTech',
  'technical',
  '["Recognize the required evidence fields for SaMD Lifecycle, V&V and Cybersecurity Evidence Index Control; identify 3 missing/unclear items; record source IDs; explain what must be escalated.","Learner can inspect a SaMD Lifecycle, V&V and Cybersecurity Evidence Index Control record and produce a checklist showing missing fields, weak source IDs, and role-boundary doubts.","Create SaMD Lifecycle, V&V and Cybersecurity Evidence Index Control completeness checklist","Assess evidence using: Field completeness; correct source IDs; clear missing-data notes; correct escalation flag; no approval claim."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L1: Evidence Gap Recognition - CAP-018C
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-018C-L1' LIMIT 1),
  'L1: Evidence Gap Recognition - CAP-018C',
  'You are supporting a workplace evidence review. Your manager gives you one SaMD Lifecycle, V&V and Cybersecurity Evidence Index Control file and asks you to check whether it is complete. You must not approve the file. You must mark the 3 blank fields, list the 2 weak source IDs, and explain which 1 role-boundary point needs clarification. Required data: Sample SaMD Lifecycle, V&V and Cybersecurity Evidence Index Control source record; 8 required fields list; 3 intentionally missing entries; 2 source-ID references; 1 role-boundary note; blank checklist template.',
  1,
  '["Pharma / Biotech / MedTech","Medical Device Software QARA and Digital Product Evidence","D-007","CAP-018C","L1","Domain; Evidence; Cognitive; Compliance"]'::jsonb,
  '["Scenario Review","Evidence Check","Artifact Build","AI Coaching","Human Review","Retry and Improve","Portfolio Submission"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: SaMD Lifecycle, V&V and Cybersecurity Evidence Index Control completeness checklist Practice
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-018C-L1' LIMIT 1)
   AND title = 'L1: Evidence Gap Recognition - CAP-018C' LIMIT 1),
  'SaMD Lifecycle, V&V and Cybersecurity Evidence Index Control completeness checklist Practice',
  'Complete the SaMD Lifecycle, V&V and Cybersecurity Evidence Index Control completeness checklist using the provided actuals and explain the evidence decision in simple workplace language.',
  'Workplace scenario: You are supporting a workplace evidence review. Your manager gives you one SaMD Lifecycle, V&V and Cybersecurity Evidence Index Control file and asks you to check whether it is complete. You must not approve the file. You must mark the 3 blank fields, list the 2 weak source IDs, and explain which 1 role-boundary point needs clarification. Major concepts: SaMD Lifecycle, V&V and Cybersecurity Evidence Index Control evidence completeness; 8-field checklist logic; source-ID traceability; missing-data marking; ALCOA-style documentation thinking; role boundary between checking and approving. Artifact structure: Sections: record summary; required field list; missing-field table; source-ID table; role-boundary note; escalation flag. Evidence to assess: Field completeness; correct source IDs; clear missing-data notes; correct escalation flag; no approval claim. AI support: Use AI to ask checklist questions only. Do not let AI invent missing data or approve the record.',
  1,
  '90 minutes',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech Biomedical Engineering
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-018C-L1' LIMIT 1),
  'B.Tech Biomedical Engineering',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech Computer Science
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-018C-L1' LIMIT 1),
  'B.Tech Computer Science',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech Information Technology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-018C-L1' LIMIT 1),
  'B.Tech Information Technology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Sc Health Informatics
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-018C-L1' LIMIT 1),
  'M.Sc Health Informatics',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Tech Medical Software Systems
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-018C-L1' LIMIT 1),
  'M.Tech Medical Software Systems',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: API Batch Quality Evidence Review - Tracker Review and Query Control
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'API Batch Quality Evidence Review - Tracker Review and Query Control',
  'COURSE-CAP-001-L2',
  'A team is updating an API Batch Quality Evidence Review tracker with 18 entries from 12 source records. Four entries do not match the source, 3 owner comments are unclear, and 2 queries are still open before the tracker can move forward. Course objective: Compare API Batch Quality Evidence Review tracker rows with source data; correct status notes; write owner queries; separate resolved and unresolved items. Learner outcome: Learner can reconcile an API Batch Quality Evidence Review tracker against source records, raise clear queries, and keep unresolved items visible.',
  '8 hours',
  'Active',
  'Pharma / Biotech / MedTech',
  'technical',
  '["Compare API Batch Quality Evidence Review tracker rows with source data; correct status notes; write owner queries; separate resolved and unresolved items.","Learner can reconcile an API Batch Quality Evidence Review tracker against source records, raise clear queries, and keep unresolved items visible.","Create API Batch Quality Evidence Review tracker and query list","Assess evidence using: Tracker accuracy; mismatch classification; query clarity; owner assignment; due-date visibility; unresolved-item control."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L2: Tracker Review and Query Control - CAP-001
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-001-L2' LIMIT 1),
  'L2: Tracker Review and Query Control - CAP-001',
  'You are given a working tracker for API Batch Quality Evidence Review. The tracker has 18 rows, but not all rows match the source records. You compare each row with the 12 source records, update status notes, write 2 clear queries, and keep unresolved items visible for the next reviewer. Required data: API Batch Quality Evidence Review tracker with 18 line items; 12 source records; 4 mismatch examples; 3 owner comments; 2 open queries; due-date and status columns.',
  1,
  '["Pharma / Biotech / MedTech","Small-Molecule Pharma Manufacturing and CMC Regulatory Operations","D-001","CAP-001","L2","Functional; Evidence; Communication; Domain"]'::jsonb,
  '["Scenario Review","Evidence Check","Artifact Build","AI Coaching","Human Review","Retry and Improve","Portfolio Submission"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: API Batch Quality Evidence Review tracker and query list Practice
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-001-L2' LIMIT 1)
   AND title = 'L2: Tracker Review and Query Control - CAP-001' LIMIT 1),
  'API Batch Quality Evidence Review tracker and query list Practice',
  'Complete the API Batch Quality Evidence Review tracker and query list using the provided actuals and explain the evidence decision in simple workplace language.',
  'Workplace scenario: You are given a working tracker for API Batch Quality Evidence Review. The tracker has 18 rows, but not all rows match the source records. You compare each row with the 12 source records, update status notes, write 2 clear queries, and keep unresolved items visible for the next reviewer. Major concepts: API Batch Quality Evidence Review tracker reconciliation; row-level status control across 18 entries; query writing; mismatch classification; owner follow-up; aging and due-date visibility. Artifact structure: Sections: tracker row ID; source record ID; expected value; observed value; mismatch reason; query owner; due date; status. Evidence to assess: Tracker accuracy; mismatch classification; query clarity; owner assignment; due-date visibility; unresolved-item control. AI support: Use AI to test query wording, find unclear status language, and check whether every mismatch has an owner.',
  1,
  '120 minutes',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Pharm
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-001-L2' LIMIT 1),
  'B.Pharm',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Pharm Pharmaceutical Quality Assurance
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-001-L2' LIMIT 1),
  'M.Pharm Pharmaceutical Quality Assurance',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Pharm Pharmaceutics
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-001-L2' LIMIT 1),
  'M.Pharm Pharmaceutics',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Chemistry
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-001-L2' LIMIT 1),
  'B.Sc Chemistry',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Sc Pharmaceutical Chemistry
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-001-L2' LIMIT 1),
  'M.Sc Pharmaceutical Chemistry',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: API Deviation, OOS and CAPA Evidence Control - Tracker Review and Query Control
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'API Deviation, OOS and CAPA Evidence Control - Tracker Review and Query Control',
  'COURSE-CAP-002-L2',
  'A team is updating an API Deviation, OOS and CAPA Evidence Control tracker with 18 entries from 12 source records. Four entries do not match the source, 3 owner comments are unclear, and 2 queries are still open before the tracker can move forward. Course objective: Compare API Deviation, OOS and CAPA Evidence Control tracker rows with source data; correct status notes; write owner queries; separate resolved and unresolved items. Learner outcome: Learner can reconcile an API Deviation, OOS and CAPA Evidence Control tracker against source records, raise clear queries, and keep unresolved items visible.',
  '8 hours',
  'Active',
  'Pharma / Biotech / MedTech',
  'technical',
  '["Compare API Deviation, OOS and CAPA Evidence Control tracker rows with source data; correct status notes; write owner queries; separate resolved and unresolved items.","Learner can reconcile an API Deviation, OOS and CAPA Evidence Control tracker against source records, raise clear queries, and keep unresolved items visible.","Create API Deviation, OOS and CAPA Evidence Control tracker and query list","Assess evidence using: Tracker accuracy; mismatch classification; query clarity; owner assignment; due-date visibility; unresolved-item control."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L2: Tracker Review and Query Control - CAP-002
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-002-L2' LIMIT 1),
  'L2: Tracker Review and Query Control - CAP-002',
  'You are given a working tracker for API Deviation, OOS and CAPA Evidence Control. The tracker has 18 rows, but not all rows match the source records. You compare each row with the 12 source records, update status notes, write 2 clear queries, and keep unresolved items visible for the next reviewer. Required data: API Deviation, OOS and CAPA Evidence Control tracker with 18 line items; 12 source records; 4 mismatch examples; 3 owner comments; 2 open queries; due-date and status columns.',
  1,
  '["Pharma / Biotech / MedTech","Small-Molecule Pharma Manufacturing and CMC Regulatory Operations","Pharma GM","D-001","CAP-002","L2","Functional; Evidence; Communication; Domain"]'::jsonb,
  '["Scenario Review","Evidence Check","Artifact Build","AI Coaching","Human Review","Retry and Improve","Portfolio Submission"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: API Deviation, OOS and CAPA Evidence Control tracker and query list Practice
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-002-L2' LIMIT 1)
   AND title = 'L2: Tracker Review and Query Control - CAP-002' LIMIT 1),
  'API Deviation, OOS and CAPA Evidence Control tracker and query list Practice',
  'Complete the API Deviation, OOS and CAPA Evidence Control tracker and query list using the provided actuals and explain the evidence decision in simple workplace language.',
  'Workplace scenario: You are given a working tracker for API Deviation, OOS and CAPA Evidence Control. The tracker has 18 rows, but not all rows match the source records. You compare each row with the 12 source records, update status notes, write 2 clear queries, and keep unresolved items visible for the next reviewer. Major concepts: API Deviation, OOS and CAPA Evidence Control tracker reconciliation; row-level status control across 18 entries; query writing; mismatch classification; owner follow-up; aging and due-date visibility. Artifact structure: Sections: tracker row ID; source record ID; expected value; observed value; mismatch reason; query owner; due date; status. Evidence to assess: Tracker accuracy; mismatch classification; query clarity; owner assignment; due-date visibility; unresolved-item control. AI support: Use AI to test query wording, find unclear status language, and check whether every mismatch has an owner.',
  1,
  '120 minutes',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Pharm
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-002-L2' LIMIT 1),
  'B.Pharm',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Pharm Pharmaceutical Quality Assurance
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-002-L2' LIMIT 1),
  'M.Pharm Pharmaceutical Quality Assurance',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Pharm Pharmaceutics
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-002-L2' LIMIT 1),
  'M.Pharm Pharmaceutics',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Chemistry
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-002-L2' LIMIT 1),
  'B.Sc Chemistry',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Sc Pharmaceutical Chemistry
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-002-L2' LIMIT 1),
  'M.Sc Pharmaceutical Chemistry',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Finished Dose BMR/BPR Packaging Variance and Release Packet Control - Tracker Review and Query Control
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Finished Dose BMR/BPR Packaging Variance and Release Packet Control - Tracker Review and Query Control',
  'COURSE-CAP-003-L2',
  'A team is updating a Finished Dose BMR/BPR Packaging Variance and Release Packet Control tracker with 18 entries from 12 source records. Four entries do not match the source, 3 owner comments are unclear, and 2 queries are still open before the tracker can move forward. Course objective: Compare Finished Dose BMR/BPR Packaging Variance and Release Packet Control tracker rows with source data; correct status notes; write owner queries; separate resolved and unresolved items. Learner outcome: Learner can reconcile a Finished Dose BMR/BPR Packaging Variance and Release Packet Control tracker against source records, raise clear queries, and keep unresolved items visible.',
  '8 hours',
  'Active',
  'Pharma / Biotech / MedTech',
  'technical',
  '["Compare Finished Dose BMR/BPR Packaging Variance and Release Packet Control tracker rows with source data; correct status notes; write owner queries; separate resolved and unresolved items.","Learner can reconcile a Finished Dose BMR/BPR Packaging Variance and Release Packet Control tracker against source records, raise clear queries, and keep unresolved items visible.","Create Finished Dose BMR/BPR Packaging Variance and Release Packet Control tracker and query list","Assess evidence using: Tracker accuracy; mismatch classification; query clarity; owner assignment; due-date visibility; unresolved-item control."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L2: Tracker Review and Query Control - CAP-003
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-003-L2' LIMIT 1),
  'L2: Tracker Review and Query Control - CAP-003',
  'You are given a working tracker for Finished Dose BMR/BPR Packaging Variance and Release Packet Control. The tracker has 18 rows, but not all rows match the source records. You compare each row with the 12 source records, update status notes, write 2 clear queries, and keep unresolved items visible for the next reviewer. Required data: Finished Dose BMR/BPR Packaging Variance and Release Packet Control tracker with 18 line items; 12 source records; 4 mismatch examples; 3 owner comments; 2 open queries; due-date and status columns.',
  1,
  '["Pharma / Biotech / MedTech","Small-Molecule Pharma Manufacturing and CMC Regulatory Operations","Pharma GM","D-001","CAP-003","L2","Functional; Evidence; Communication; Domain"]'::jsonb,
  '["Scenario Review","Evidence Check","Artifact Build","AI Coaching","Human Review","Retry and Improve","Portfolio Submission"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Finished Dose BMR/BPR Packaging Variance and Release Packet Control tracker and query list Practice
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-003-L2' LIMIT 1)
   AND title = 'L2: Tracker Review and Query Control - CAP-003' LIMIT 1),
  'Finished Dose BMR/BPR Packaging Variance and Release Packet Control tracker and query list Practice',
  'Complete the Finished Dose BMR/BPR Packaging Variance and Release Packet Control tracker and query list using the provided actuals and explain the evidence decision in simple workplace language.',
  'Workplace scenario: You are given a working tracker for Finished Dose BMR/BPR Packaging Variance and Release Packet Control. The tracker has 18 rows, but not all rows match the source records. You compare each row with the 12 source records, update status notes, write 2 clear queries, and keep unresolved items visible for the next reviewer. Major concepts: Finished Dose BMR/BPR Packaging Variance and Release Packet Control tracker reconciliation; row-level status control across 18 entries; query writing; mismatch classification; owner follow-up; aging and due-date visibility. Artifact structure: Sections: tracker row ID; source record ID; expected value; observed value; mismatch reason; query owner; due date; status. Evidence to assess: Tracker accuracy; mismatch classification; query clarity; owner assignment; due-date visibility; unresolved-item control. AI support: Use AI to test query wording, find unclear status language, and check whether every mismatch has an owner.',
  1,
  '120 minutes',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Pharm
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-003-L2' LIMIT 1),
  'B.Pharm',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Pharm Pharmaceutical Quality Assurance
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-003-L2' LIMIT 1),
  'M.Pharm Pharmaceutical Quality Assurance',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Pharm Pharmaceutics
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-003-L2' LIMIT 1),
  'M.Pharm Pharmaceutics',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Chemistry
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-003-L2' LIMIT 1),
  'B.Sc Chemistry',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Sc Pharmaceutical Chemistry
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-003-L2' LIMIT 1),
  'M.Sc Pharmaceutical Chemistry',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Stability Study Follow-Up and Change-Control Impact Packet Control - Tracker Review and Query Control
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Stability Study Follow-Up and Change-Control Impact Packet Control - Tracker Review and Query Control',
  'COURSE-CAP-004-L2',
  'A team is updating a Stability Study Follow-Up and Change-Control Impact Packet Control tracker with 18 entries from 12 source records. Four entries do not match the source, 3 owner comments are unclear, and 2 queries are still open before the tracker can move forward. Course objective: Compare Stability Study Follow-Up and Change-Control Impact Packet Control tracker rows with source data; correct status notes; write owner queries; separate resolved and unresolved items. Learner outcome: Learner can reconcile a Stability Study Follow-Up and Change-Control Impact Packet Control tracker against source records, raise clear queries, and keep unresolved items visible.',
  '8 hours',
  'Active',
  'Pharma / Biotech / MedTech',
  'technical',
  '["Compare Stability Study Follow-Up and Change-Control Impact Packet Control tracker rows with source data; correct status notes; write owner queries; separate resolved and unresolved items.","Learner can reconcile a Stability Study Follow-Up and Change-Control Impact Packet Control tracker against source records, raise clear queries, and keep unresolved items visible.","Create Stability Study Follow-Up and Change-Control Impact Packet Control tracker and query list","Assess evidence using: Tracker accuracy; mismatch classification; query clarity; owner assignment; due-date visibility; unresolved-item control."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L2: Tracker Review and Query Control - CAP-004
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-004-L2' LIMIT 1),
  'L2: Tracker Review and Query Control - CAP-004',
  'You are given a working tracker for Stability Study Follow-Up and Change-Control Impact Packet Control. The tracker has 18 rows, but not all rows match the source records. You compare each row with the 12 source records, update status notes, write 2 clear queries, and keep unresolved items visible for the next reviewer. Required data: Stability Study Follow-Up and Change-Control Impact Packet Control tracker with 18 line items; 12 source records; 4 mismatch examples; 3 owner comments; 2 open queries; due-date and status columns.',
  1,
  '["Pharma / Biotech / MedTech","Small-Molecule Pharma Manufacturing and CMC Regulatory Operations","Pharma GM","D-001","CAP-004","L2","Functional; Evidence; Communication; Domain"]'::jsonb,
  '["Scenario Review","Evidence Check","Artifact Build","AI Coaching","Human Review","Retry and Improve","Portfolio Submission"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Stability Study Follow-Up and Change-Control Impact Packet Control tracker and query list Practice
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-004-L2' LIMIT 1)
   AND title = 'L2: Tracker Review and Query Control - CAP-004' LIMIT 1),
  'Stability Study Follow-Up and Change-Control Impact Packet Control tracker and query list Practice',
  'Complete the Stability Study Follow-Up and Change-Control Impact Packet Control tracker and query list using the provided actuals and explain the evidence decision in simple workplace language.',
  'Workplace scenario: You are given a working tracker for Stability Study Follow-Up and Change-Control Impact Packet Control. The tracker has 18 rows, but not all rows match the source records. You compare each row with the 12 source records, update status notes, write 2 clear queries, and keep unresolved items visible for the next reviewer. Major concepts: Stability Study Follow-Up and Change-Control Impact Packet Control tracker reconciliation; row-level status control across 18 entries; query writing; mismatch classification; owner follow-up; aging and due-date visibility. Artifact structure: Sections: tracker row ID; source record ID; expected value; observed value; mismatch reason; query owner; due date; status. Evidence to assess: Tracker accuracy; mismatch classification; query clarity; owner assignment; due-date visibility; unresolved-item control. AI support: Use AI to test query wording, find unclear status language, and check whether every mismatch has an owner.',
  1,
  '120 minutes',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Pharm
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-004-L2' LIMIT 1),
  'B.Pharm',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Pharm Pharmaceutical Quality Assurance
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-004-L2' LIMIT 1),
  'M.Pharm Pharmaceutical Quality Assurance',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Pharm Pharmaceutics
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-004-L2' LIMIT 1),
  'M.Pharm Pharmaceutics',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Chemistry
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-004-L2' LIMIT 1),
  'B.Sc Chemistry',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Sc Pharmaceutical Chemistry
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-004-L2' LIMIT 1),
  'M.Sc Pharmaceutical Chemistry',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Biological Product Batch and Comparability Evidence Control - Tracker Review and Query Control
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Biological Product Batch and Comparability Evidence Control - Tracker Review and Query Control',
  'COURSE-CAP-005-L2',
  'A team is updating a Biological Product Batch and Comparability Evidence Control tracker with 18 entries from 12 source records. Four entries do not match the source, 3 owner comments are unclear, and 2 queries are still open before the tracker can move forward. Course objective: Compare Biological Product Batch and Comparability Evidence Control tracker rows with source data; correct status notes; write owner queries; separate resolved and unresolved items. Learner outcome: Learner can reconcile a Biological Product Batch and Comparability Evidence Control tracker against source records, raise clear queries, and keep unresolved items visible.',
  '8 hours',
  'Active',
  'Pharma / Biotech / MedTech',
  'technical',
  '["Compare Biological Product Batch and Comparability Evidence Control tracker rows with source data; correct status notes; write owner queries; separate resolved and unresolved items.","Learner can reconcile a Biological Product Batch and Comparability Evidence Control tracker against source records, raise clear queries, and keep unresolved items visible.","Create Biological Product Batch and Comparability Evidence Control tracker and query list","Assess evidence using: Tracker accuracy; mismatch classification; query clarity; owner assignment; due-date visibility; unresolved-item control."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L2: Tracker Review and Query Control - CAP-005
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-005-L2' LIMIT 1),
  'L2: Tracker Review and Query Control - CAP-005',
  'You are given a working tracker for Biological Product Batch and Comparability Evidence Control. The tracker has 18 rows, but not all rows match the source records. You compare each row with the 12 source records, update status notes, write 2 clear queries, and keep unresolved items visible for the next reviewer. Required data: Biological Product Batch and Comparability Evidence Control tracker with 18 line items; 12 source records; 4 mismatch examples; 3 owner comments; 2 open queries; due-date and status columns.',
  1,
  '["Pharma / Biotech / MedTech","Biological Product, Vaccine and Biosimilar Operations","D-002","CAP-005","L2","Functional; Evidence; Communication; Domain"]'::jsonb,
  '["Scenario Review","Evidence Check","Artifact Build","AI Coaching","Human Review","Retry and Improve","Portfolio Submission"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Biological Product Batch and Comparability Evidence Control tracker and query list Practice
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-005-L2' LIMIT 1)
   AND title = 'L2: Tracker Review and Query Control - CAP-005' LIMIT 1),
  'Biological Product Batch and Comparability Evidence Control tracker and query list Practice',
  'Complete the Biological Product Batch and Comparability Evidence Control tracker and query list using the provided actuals and explain the evidence decision in simple workplace language.',
  'Workplace scenario: You are given a working tracker for Biological Product Batch and Comparability Evidence Control. The tracker has 18 rows, but not all rows match the source records. You compare each row with the 12 source records, update status notes, write 2 clear queries, and keep unresolved items visible for the next reviewer. Major concepts: Biological Product Batch and Comparability Evidence Control tracker reconciliation; row-level status control across 18 entries; query writing; mismatch classification; owner follow-up; aging and due-date visibility. Artifact structure: Sections: tracker row ID; source record ID; expected value; observed value; mismatch reason; query owner; due date; status. Evidence to assess: Tracker accuracy; mismatch classification; query clarity; owner assignment; due-date visibility; unresolved-item control. AI support: Use AI to test query wording, find unclear status language, and check whether every mismatch has an owner.',
  1,
  '120 minutes',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Pharm
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-005-L2' LIMIT 1),
  'B.Pharm',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Pharm Pharmaceutical Biotechnology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-005-L2' LIMIT 1),
  'M.Pharm Pharmaceutical Biotechnology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Biotechnology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-005-L2' LIMIT 1),
  'B.Sc Biotechnology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Sc Biotechnology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-005-L2' LIMIT 1),
  'M.Sc Biotechnology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech Biotechnology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-005-L2' LIMIT 1),
  'B.Tech Biotechnology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Vaccine Lot QC, Temperature-Excursion and Cold-Chain Release Packet Control - - Tracker Review and Query Control
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Vaccine Lot QC, Temperature-Excursion and Cold-Chain Release Packet Control - - Tracker Review and Query Control',
  'COURSE-CAP-006-L2',
  'A team is updating a Vaccine Lot QC, Temperature-Excursion and Cold-Chain Release Packet Control - tracker with 18 entries from 12 source records. Four entries do not match the source, 3 owner comments are unclear, and 2 queries are still open before the tracker can move forward. Course objective: Compare Vaccine Lot QC, Temperature-Excursion and Cold-Chain Release Packet Control - tracker rows with source data; correct status notes; write owner queries; separate resolved and unresolved items. Learner outcome: Learner can reconcile a Vaccine Lot QC, Temperature-Excursion and Cold-Chain Release Packet Control - tracker against source records, raise clear queries, and keep unresolved items visible.',
  '8 hours',
  'Active',
  'Pharma / Biotech / MedTech',
  'technical',
  '["Compare Vaccine Lot QC, Temperature-Excursion and Cold-Chain Release Packet Control - tracker rows with source data; correct status notes; write owner queries; separate resolved and unresolved items.","Learner can reconcile a Vaccine Lot QC, Temperature-Excursion and Cold-Chain Release Packet Control - tracker against source records, raise clear queries, and keep unresolved items visible.","Create Vaccine Lot QC, Temperature-Excursion and Cold-Chain Release Packet Control - tracker and query list","Assess evidence using: Tracker accuracy; mismatch classification; query clarity; owner assignment; due-date visibility; unresolved-item control."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L2: Tracker Review and Query Control - CAP-006
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-006-L2' LIMIT 1),
  'L2: Tracker Review and Query Control - CAP-006',
  'You are given a working tracker for Vaccine Lot QC, Temperature-Excursion and Cold-Chain Release Packet Control -. The tracker has 18 rows, but not all rows match the source records. You compare each row with the 12 source records, update status notes, write 2 clear queries, and keep unresolved items visible for the next reviewer. Required data: Vaccine Lot QC, Temperature-Excursion and Cold-Chain Release Packet Control - tracker with 18 line items; 12 source records; 4 mismatch examples; 3 owner comments; 2 open queries; due-date and status columns.',
  1,
  '["Pharma / Biotech / MedTech","Biological Product, Vaccine and Biosimilar Operations","D-002","CAP-006","L2","Functional; Evidence; Communication; Domain"]'::jsonb,
  '["Scenario Review","Evidence Check","Artifact Build","AI Coaching","Human Review","Retry and Improve","Portfolio Submission"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Vaccine Lot QC, Temperature-Excursion and Cold-Chain Release Packet Control - tracker and query list Practice
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-006-L2' LIMIT 1)
   AND title = 'L2: Tracker Review and Query Control - CAP-006' LIMIT 1),
  'Vaccine Lot QC, Temperature-Excursion and Cold-Chain Release Packet Control - tracker and query list Practice',
  'Complete the Vaccine Lot QC, Temperature-Excursion and Cold-Chain Release Packet Control - tracker and query list using the provided actuals and explain the evidence decision in simple workplace language.',
  'Workplace scenario: You are given a working tracker for Vaccine Lot QC, Temperature-Excursion and Cold-Chain Release Packet Control -. The tracker has 18 rows, but not all rows match the source records. You compare each row with the 12 source records, update status notes, write 2 clear queries, and keep unresolved items visible for the next reviewer. Major concepts: Vaccine Lot QC, Temperature-Excursion and Cold-Chain Release Packet Control - tracker reconciliation; row-level status control across 18 entries; query writing; mismatch classification; owner follow-up; aging and due-date visibility. Artifact structure: Sections: tracker row ID; source record ID; expected value; observed value; mismatch reason; query owner; due date; status. Evidence to assess: Tracker accuracy; mismatch classification; query clarity; owner assignment; due-date visibility; unresolved-item control. AI support: Use AI to test query wording, find unclear status language, and check whether every mismatch has an owner.',
  1,
  '120 minutes',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Pharm
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-006-L2' LIMIT 1),
  'B.Pharm',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Pharm Pharmaceutical Biotechnology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-006-L2' LIMIT 1),
  'M.Pharm Pharmaceutical Biotechnology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Biotechnology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-006-L2' LIMIT 1),
  'B.Sc Biotechnology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Sc Microbiology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-006-L2' LIMIT 1),
  'M.Sc Microbiology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Microbiology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-006-L2' LIMIT 1),
  'B.Sc Microbiology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Advanced Biopharma Evidence Inventory and Authority-Boundary Triage - Tracker Review and Query Control
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Advanced Biopharma Evidence Inventory and Authority-Boundary Triage - Tracker Review and Query Control',
  'COURSE-CAP-007-L2',
  'A team is updating an Advanced Biopharma Evidence Inventory and Authority-Boundary Triage tracker with 18 entries from 12 source records. Four entries do not match the source, 3 owner comments are unclear, and 2 queries are still open before the tracker can move forward. Course objective: Compare Advanced Biopharma Evidence Inventory and Authority-Boundary Triage tracker rows with source data; correct status notes; write owner queries; separate resolved and unresolved items. Learner outcome: Learner can reconcile an Advanced Biopharma Evidence Inventory and Authority-Boundary Triage tracker against source records, raise clear queries, and keep unresolved items visible.',
  '8 hours',
  'Active',
  'Pharma / Biotech / MedTech',
  'technical',
  '["Compare Advanced Biopharma Evidence Inventory and Authority-Boundary Triage tracker rows with source data; correct status notes; write owner queries; separate resolved and unresolved items.","Learner can reconcile an Advanced Biopharma Evidence Inventory and Authority-Boundary Triage tracker against source records, raise clear queries, and keep unresolved items visible.","Create Advanced Biopharma Evidence Inventory and Authority-Boundary Triage tracker and query list","Assess evidence using: Tracker accuracy; mismatch classification; query clarity; owner assignment; due-date visibility; unresolved-item control."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L2: Tracker Review and Query Control - CAP-007
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-007-L2' LIMIT 1),
  'L2: Tracker Review and Query Control - CAP-007',
  'You are given a working tracker for Advanced Biopharma Evidence Inventory and Authority-Boundary Triage. The tracker has 18 rows, but not all rows match the source records. You compare each row with the 12 source records, update status notes, write 2 clear queries, and keep unresolved items visible for the next reviewer. Required data: Advanced Biopharma Evidence Inventory and Authority-Boundary Triage tracker with 18 line items; 12 source records; 4 mismatch examples; 3 owner comments; 2 open queries; due-date and status columns.',
  1,
  '["Pharma / Biotech / MedTech","Advanced Biopharma Evidence Inventory and Boundary Triage","D-002","CAP-007","L2","Functional; Evidence; Communication; Domain"]'::jsonb,
  '["Scenario Review","Evidence Check","Artifact Build","AI Coaching","Human Review","Retry and Improve","Portfolio Submission"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Advanced Biopharma Evidence Inventory and Authority-Boundary Triage tracker and query list Practice
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-007-L2' LIMIT 1)
   AND title = 'L2: Tracker Review and Query Control - CAP-007' LIMIT 1),
  'Advanced Biopharma Evidence Inventory and Authority-Boundary Triage tracker and query list Practice',
  'Complete the Advanced Biopharma Evidence Inventory and Authority-Boundary Triage tracker and query list using the provided actuals and explain the evidence decision in simple workplace language.',
  'Workplace scenario: You are given a working tracker for Advanced Biopharma Evidence Inventory and Authority-Boundary Triage. The tracker has 18 rows, but not all rows match the source records. You compare each row with the 12 source records, update status notes, write 2 clear queries, and keep unresolved items visible for the next reviewer. Major concepts: Advanced Biopharma Evidence Inventory and Authority-Boundary Triage tracker reconciliation; row-level status control across 18 entries; query writing; mismatch classification; owner follow-up; aging and due-date visibility. Artifact structure: Sections: tracker row ID; source record ID; expected value; observed value; mismatch reason; query owner; due date; status. Evidence to assess: Tracker accuracy; mismatch classification; query clarity; owner assignment; due-date visibility; unresolved-item control. AI support: Use AI to test query wording, find unclear status language, and check whether every mismatch has an owner.',
  1,
  '120 minutes',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Pharm
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-007-L2' LIMIT 1),
  'B.Pharm',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Pharm Pharmaceutical Biotechnology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-007-L2' LIMIT 1),
  'M.Pharm Pharmaceutical Biotechnology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Biotechnology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-007-L2' LIMIT 1),
  'B.Sc Biotechnology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Sc Biotechnology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-007-L2' LIMIT 1),
  'M.Sc Biotechnology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech Biotechnology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-007-L2' LIMIT 1),
  'B.Tech Biotechnology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Clinical Trial Startup Records and Monitoring Action Evidence Control - Tracker Review and Query Control
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Clinical Trial Startup Records and Monitoring Action Evidence Control - Tracker Review and Query Control',
  'COURSE-CAP-008-L2',
  'A team is updating a Clinical Trial Startup Records and Monitoring Action Evidence Control tracker with 18 entries from 12 source records. Four entries do not match the source, 3 owner comments are unclear, and 2 queries are still open before the tracker can move forward. Course objective: Compare Clinical Trial Startup Records and Monitoring Action Evidence Control tracker rows with source data; correct status notes; write owner queries; separate resolved and unresolved items. Learner outcome: Learner can reconcile a Clinical Trial Startup Records and Monitoring Action Evidence Control tracker against source records, raise clear queries, and keep unresolved items visible.',
  '8 hours',
  'Active',
  'Pharma / Biotech / MedTech',
  'technical',
  '["Compare Clinical Trial Startup Records and Monitoring Action Evidence Control tracker rows with source data; correct status notes; write owner queries; separate resolved and unresolved items.","Learner can reconcile a Clinical Trial Startup Records and Monitoring Action Evidence Control tracker against source records, raise clear queries, and keep unresolved items visible.","Create Clinical Trial Startup Records and Monitoring Action Evidence Control tracker and query list","Assess evidence using: Tracker accuracy; mismatch classification; query clarity; owner assignment; due-date visibility; unresolved-item control."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L2: Tracker Review and Query Control - CAP-008
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-008-L2' LIMIT 1),
  'L2: Tracker Review and Query Control - CAP-008',
  'You are given a working tracker for Clinical Trial Startup Records and Monitoring Action Evidence Control. The tracker has 18 rows, but not all rows match the source records. You compare each row with the 12 source records, update status notes, write 2 clear queries, and keep unresolved items visible for the next reviewer. Required data: Clinical Trial Startup Records and Monitoring Action Evidence Control tracker with 18 line items; 12 source records; 4 mismatch examples; 3 owner comments; 2 open queries; due-date and status columns.',
  1,
  '["Pharma / Biotech / MedTech","Clinical Operations and Trial Startup Support","D-003","CAP-008","L2","Functional; Evidence; Communication; Domain"]'::jsonb,
  '["Scenario Review","Evidence Check","Artifact Build","AI Coaching","Human Review","Retry and Improve","Portfolio Submission"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Clinical Trial Startup Records and Monitoring Action Evidence Control tracker and query list Practice
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-008-L2' LIMIT 1)
   AND title = 'L2: Tracker Review and Query Control - CAP-008' LIMIT 1),
  'Clinical Trial Startup Records and Monitoring Action Evidence Control tracker and query list Practice',
  'Complete the Clinical Trial Startup Records and Monitoring Action Evidence Control tracker and query list using the provided actuals and explain the evidence decision in simple workplace language.',
  'Workplace scenario: You are given a working tracker for Clinical Trial Startup Records and Monitoring Action Evidence Control. The tracker has 18 rows, but not all rows match the source records. You compare each row with the 12 source records, update status notes, write 2 clear queries, and keep unresolved items visible for the next reviewer. Major concepts: Clinical Trial Startup Records and Monitoring Action Evidence Control tracker reconciliation; row-level status control across 18 entries; query writing; mismatch classification; owner follow-up; aging and due-date visibility. Artifact structure: Sections: tracker row ID; source record ID; expected value; observed value; mismatch reason; query owner; due date; status. Evidence to assess: Tracker accuracy; mismatch classification; query clarity; owner assignment; due-date visibility; unresolved-item control. AI support: Use AI to test query wording, find unclear status language, and check whether every mismatch has an owner.',
  1,
  '120 minutes',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Pharm
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-008-L2' LIMIT 1),
  'B.Pharm',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: Pharm.D
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-008-L2' LIMIT 1),
  'Pharm.D',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Clinical Research
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-008-L2' LIMIT 1),
  'B.Sc Clinical Research',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Sc Clinical Research
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-008-L2' LIMIT 1),
  'M.Sc Clinical Research',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Life Sciences
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-008-L2' LIMIT 1),
  'B.Sc Life Sciences',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Pharmacovigilance ICSR and Safety Evidence Handling - Tracker Review and Query Control
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Pharmacovigilance ICSR and Safety Evidence Handling - Tracker Review and Query Control',
  'COURSE-CAP-009-L2',
  'A team is updating a Pharmacovigilance ICSR and Safety Evidence Handling tracker with 18 entries from 12 source records. Four entries do not match the source, 3 owner comments are unclear, and 2 queries are still open before the tracker can move forward. Course objective: Compare Pharmacovigilance ICSR and Safety Evidence Handling tracker rows with source data; correct status notes; write owner queries; separate resolved and unresolved items. Learner outcome: Learner can reconcile a Pharmacovigilance ICSR and Safety Evidence Handling tracker against source records, raise clear queries, and keep unresolved items visible.',
  '8 hours',
  'Active',
  'Pharma / Biotech / MedTech',
  'technical',
  '["Compare Pharmacovigilance ICSR and Safety Evidence Handling tracker rows with source data; correct status notes; write owner queries; separate resolved and unresolved items.","Learner can reconcile a Pharmacovigilance ICSR and Safety Evidence Handling tracker against source records, raise clear queries, and keep unresolved items visible.","Create Pharmacovigilance ICSR and Safety Evidence Handling tracker and query list","Assess evidence using: Tracker accuracy; mismatch classification; query clarity; owner assignment; due-date visibility; unresolved-item control."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L2: Tracker Review and Query Control - CAP-009
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-009-L2' LIMIT 1),
  'L2: Tracker Review and Query Control - CAP-009',
  'You are given a working tracker for Pharmacovigilance ICSR and Safety Evidence Handling. The tracker has 18 rows, but not all rows match the source records. You compare each row with the 12 source records, update status notes, write 2 clear queries, and keep unresolved items visible for the next reviewer. Required data: Pharmacovigilance ICSR and Safety Evidence Handling tracker with 18 line items; 12 source records; 4 mismatch examples; 3 owner comments; 2 open queries; due-date and status columns.',
  1,
  '["Pharma / Biotech / MedTech","Pharmacovigilance and Medical Safety Evidence Operations","D-003","CAP-009","L2","Functional; Evidence; Communication; Domain"]'::jsonb,
  '["Scenario Review","Evidence Check","Artifact Build","AI Coaching","Human Review","Retry and Improve","Portfolio Submission"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Pharmacovigilance ICSR and Safety Evidence Handling tracker and query list Practice
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-009-L2' LIMIT 1)
   AND title = 'L2: Tracker Review and Query Control - CAP-009' LIMIT 1),
  'Pharmacovigilance ICSR and Safety Evidence Handling tracker and query list Practice',
  'Complete the Pharmacovigilance ICSR and Safety Evidence Handling tracker and query list using the provided actuals and explain the evidence decision in simple workplace language.',
  'Workplace scenario: You are given a working tracker for Pharmacovigilance ICSR and Safety Evidence Handling. The tracker has 18 rows, but not all rows match the source records. You compare each row with the 12 source records, update status notes, write 2 clear queries, and keep unresolved items visible for the next reviewer. Major concepts: Pharmacovigilance ICSR and Safety Evidence Handling tracker reconciliation; row-level status control across 18 entries; query writing; mismatch classification; owner follow-up; aging and due-date visibility. Artifact structure: Sections: tracker row ID; source record ID; expected value; observed value; mismatch reason; query owner; due date; status. Evidence to assess: Tracker accuracy; mismatch classification; query clarity; owner assignment; due-date visibility; unresolved-item control. AI support: Use AI to test query wording, find unclear status language, and check whether every mismatch has an owner.',
  1,
  '120 minutes',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Pharm
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-009-L2' LIMIT 1),
  'B.Pharm',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: Pharm.D
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-009-L2' LIMIT 1),
  'Pharm.D',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Pharm Pharmacology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-009-L2' LIMIT 1),
  'M.Pharm Pharmacology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Life Sciences
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-009-L2' LIMIT 1),
  'B.Sc Life Sciences',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Sc Pharmacology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-009-L2' LIMIT 1),
  'M.Sc Pharmacology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Clinical Dataset Mapping, Query Reconciliation and Data-Lock Packet Control - - Tracker Review and Query Control
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Clinical Dataset Mapping, Query Reconciliation and Data-Lock Packet Control - - Tracker Review and Query Control',
  'COURSE-CAP-010-L2',
  'A team is updating a Clinical Dataset Mapping, Query Reconciliation and Data-Lock Packet Control - tracker with 18 entries from 12 source records. Four entries do not match the source, 3 owner comments are unclear, and 2 queries are still open before the tracker can move forward. Course objective: Compare Clinical Dataset Mapping, Query Reconciliation and Data-Lock Packet Control - tracker rows with source data; correct status notes; write owner queries; separate resolved and unresolved items. Learner outcome: Learner can reconcile a Clinical Dataset Mapping, Query Reconciliation and Data-Lock Packet Control - tracker against source records, raise clear queries, and keep unresolved items visible.',
  '8 hours',
  'Active',
  'Pharma / Biotech / MedTech',
  'technical',
  '["Compare Clinical Dataset Mapping, Query Reconciliation and Data-Lock Packet Control - tracker rows with source data; correct status notes; write owner queries; separate resolved and unresolved items.","Learner can reconcile a Clinical Dataset Mapping, Query Reconciliation and Data-Lock Packet Control - tracker against source records, raise clear queries, and keep unresolved items visible.","Create Clinical Dataset Mapping, Query Reconciliation and Data-Lock Packet Control - tracker and query list","Assess evidence using: Tracker accuracy; mismatch classification; query clarity; owner assignment; due-date visibility; unresolved-item control."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L2: Tracker Review and Query Control - CAP-010
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-010-L2' LIMIT 1),
  'L2: Tracker Review and Query Control - CAP-010',
  'You are given a working tracker for Clinical Dataset Mapping, Query Reconciliation and Data-Lock Packet Control -. The tracker has 18 rows, but not all rows match the source records. You compare each row with the 12 source records, update status notes, write 2 clear queries, and keep unresolved items visible for the next reviewer. Required data: Clinical Dataset Mapping, Query Reconciliation and Data-Lock Packet Control - tracker with 18 line items; 12 source records; 4 mismatch examples; 3 owner comments; 2 open queries; due-date and status columns.',
  1,
  '["Pharma / Biotech / MedTech","Clinical Documentation and Data Services Support","D-003","CAP-010","L2","Functional; Evidence; Communication; Domain"]'::jsonb,
  '["Scenario Review","Evidence Check","Artifact Build","AI Coaching","Human Review","Retry and Improve","Portfolio Submission"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Clinical Dataset Mapping, Query Reconciliation and Data-Lock Packet Control - tracker and query list Practice
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-010-L2' LIMIT 1)
   AND title = 'L2: Tracker Review and Query Control - CAP-010' LIMIT 1),
  'Clinical Dataset Mapping, Query Reconciliation and Data-Lock Packet Control - tracker and query list Practice',
  'Complete the Clinical Dataset Mapping, Query Reconciliation and Data-Lock Packet Control - tracker and query list using the provided actuals and explain the evidence decision in simple workplace language.',
  'Workplace scenario: You are given a working tracker for Clinical Dataset Mapping, Query Reconciliation and Data-Lock Packet Control -. The tracker has 18 rows, but not all rows match the source records. You compare each row with the 12 source records, update status notes, write 2 clear queries, and keep unresolved items visible for the next reviewer. Major concepts: Clinical Dataset Mapping, Query Reconciliation and Data-Lock Packet Control - tracker reconciliation; row-level status control across 18 entries; query writing; mismatch classification; owner follow-up; aging and due-date visibility. Artifact structure: Sections: tracker row ID; source record ID; expected value; observed value; mismatch reason; query owner; due date; status. Evidence to assess: Tracker accuracy; mismatch classification; query clarity; owner assignment; due-date visibility; unresolved-item control. AI support: Use AI to test query wording, find unclear status language, and check whether every mismatch has an owner.',
  1,
  '120 minutes',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Pharm
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-010-L2' LIMIT 1),
  'B.Pharm',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Clinical Research
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-010-L2' LIMIT 1),
  'B.Sc Clinical Research',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Statistics
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-010-L2' LIMIT 1),
  'B.Sc Statistics',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Life Sciences
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-010-L2' LIMIT 1),
  'B.Sc Life Sciences',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Sc Clinical Data Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-010-L2' LIMIT 1),
  'M.Sc Clinical Data Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: NGS Run QC, Variant Calling and Genomics Reporting - Tracker Review and Query Control
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'NGS Run QC, Variant Calling and Genomics Reporting - Tracker Review and Query Control',
  'COURSE-CAP-011-L2',
  'A team is updating an NGS Run QC, Variant Calling and Genomics Reporting tracker with 18 entries from 12 source records. Four entries do not match the source, 3 owner comments are unclear, and 2 queries are still open before the tracker can move forward. Course objective: Compare NGS Run QC, Variant Calling and Genomics Reporting tracker rows with source data; correct status notes; write owner queries; separate resolved and unresolved items. Learner outcome: Learner can reconcile an NGS Run QC, Variant Calling and Genomics Reporting tracker against source records, raise clear queries, and keep unresolved items visible.',
  '8 hours',
  'Active',
  'Pharma / Biotech / MedTech',
  'technical',
  '["Compare NGS Run QC, Variant Calling and Genomics Reporting tracker rows with source data; correct status notes; write owner queries; separate resolved and unresolved items.","Learner can reconcile an NGS Run QC, Variant Calling and Genomics Reporting tracker against source records, raise clear queries, and keep unresolved items visible.","Create NGS Run QC, Variant Calling and Genomics Reporting tracker and query list","Assess evidence using: Tracker accuracy; mismatch classification; query clarity; owner assignment; due-date visibility; unresolved-item control."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L2: Tracker Review and Query Control - CAP-011
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-011-L2' LIMIT 1),
  'L2: Tracker Review and Query Control - CAP-011',
  'You are given a working tracker for NGS Run QC, Variant Calling and Genomics Reporting. The tracker has 18 rows, but not all rows match the source records. You compare each row with the 12 source records, update status notes, write 2 clear queries, and keep unresolved items visible for the next reviewer. Required data: NGS Run QC, Variant Calling and Genomics Reporting tracker with 18 line items; 12 source records; 4 mismatch examples; 3 owner comments; 2 open queries; due-date and status columns.',
  1,
  '["Pharma / Biotech / MedTech","Bioinformatics and Genomics Analysis Services","D-004","CAP-011","L2","Functional; Evidence; Communication; Domain"]'::jsonb,
  '["Scenario Review","Evidence Check","Artifact Build","AI Coaching","Human Review","Retry and Improve","Portfolio Submission"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: NGS Run QC, Variant Calling and Genomics Reporting tracker and query list Practice
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-011-L2' LIMIT 1)
   AND title = 'L2: Tracker Review and Query Control - CAP-011' LIMIT 1),
  'NGS Run QC, Variant Calling and Genomics Reporting tracker and query list Practice',
  'Complete the NGS Run QC, Variant Calling and Genomics Reporting tracker and query list using the provided actuals and explain the evidence decision in simple workplace language.',
  'Workplace scenario: You are given a working tracker for NGS Run QC, Variant Calling and Genomics Reporting. The tracker has 18 rows, but not all rows match the source records. You compare each row with the 12 source records, update status notes, write 2 clear queries, and keep unresolved items visible for the next reviewer. Major concepts: NGS Run QC, Variant Calling and Genomics Reporting tracker reconciliation; row-level status control across 18 entries; query writing; mismatch classification; owner follow-up; aging and due-date visibility. Artifact structure: Sections: tracker row ID; source record ID; expected value; observed value; mismatch reason; query owner; due date; status. Evidence to assess: Tracker accuracy; mismatch classification; query clarity; owner assignment; due-date visibility; unresolved-item control. AI support: Use AI to test query wording, find unclear status language, and check whether every mismatch has an owner.',
  1,
  '120 minutes',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Bioinformatics
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-011-L2' LIMIT 1),
  'B.Sc Bioinformatics',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Sc Bioinformatics
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-011-L2' LIMIT 1),
  'M.Sc Bioinformatics',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech Biotechnology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-011-L2' LIMIT 1),
  'B.Tech Biotechnology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Biotechnology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-011-L2' LIMIT 1),
  'B.Sc Biotechnology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Sc Genomics
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-011-L2' LIMIT 1),
  'M.Sc Genomics',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Bioservices Sample Result, Assay Run and Research Tool Lot Evidence Control - - Tracker Review and Query Control
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Bioservices Sample Result, Assay Run and Research Tool Lot Evidence Control - - Tracker Review and Query Control',
  'COURSE-CAP-012-L2',
  'A team is updating a Bioservices Sample Result, Assay Run and Research Tool Lot Evidence Control - tracker with 18 entries from 12 source records. Four entries do not match the source, 3 owner comments are unclear, and 2 queries are still open before the tracker can move forward. Course objective: Compare Bioservices Sample Result, Assay Run and Research Tool Lot Evidence Control - tracker rows with source data; correct status notes; write owner queries; separate resolved and unresolved items. Learner outcome: Learner can reconcile a Bioservices Sample Result, Assay Run and Research Tool Lot Evidence Control - tracker against source records, raise clear queries, and keep unresolved items visible.',
  '8 hours',
  'Active',
  'Pharma / Biotech / MedTech',
  'technical',
  '["Compare Bioservices Sample Result, Assay Run and Research Tool Lot Evidence Control - tracker rows with source data; correct status notes; write owner queries; separate resolved and unresolved items.","Learner can reconcile a Bioservices Sample Result, Assay Run and Research Tool Lot Evidence Control - tracker against source records, raise clear queries, and keep unresolved items visible.","Create Bioservices Sample Result, Assay Run and Research Tool Lot Evidence Control - tracker and query list","Assess evidence using: Tracker accuracy; mismatch classification; query clarity; owner assignment; due-date visibility; unresolved-item control."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L2: Tracker Review and Query Control - CAP-012
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-012-L2' LIMIT 1),
  'L2: Tracker Review and Query Control - CAP-012',
  'You are given a working tracker for Bioservices Sample Result, Assay Run and Research Tool Lot Evidence Control -. The tracker has 18 rows, but not all rows match the source records. You compare each row with the 12 source records, update status notes, write 2 clear queries, and keep unresolved items visible for the next reviewer. Required data: Bioservices Sample Result, Assay Run and Research Tool Lot Evidence Control - tracker with 18 line items; 12 source records; 4 mismatch examples; 3 owner comments; 2 open queries; due-date and status columns.',
  1,
  '["Pharma / Biotech / MedTech","Wet-Lab Bioservices and Research Tool Support","D-004","CAP-012","L2","Functional; Evidence; Communication; Domain"]'::jsonb,
  '["Scenario Review","Evidence Check","Artifact Build","AI Coaching","Human Review","Retry and Improve","Portfolio Submission"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Bioservices Sample Result, Assay Run and Research Tool Lot Evidence Control - tracker and query list Practice
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-012-L2' LIMIT 1)
   AND title = 'L2: Tracker Review and Query Control - CAP-012' LIMIT 1),
  'Bioservices Sample Result, Assay Run and Research Tool Lot Evidence Control - tracker and query list Practice',
  'Complete the Bioservices Sample Result, Assay Run and Research Tool Lot Evidence Control - tracker and query list using the provided actuals and explain the evidence decision in simple workplace language.',
  'Workplace scenario: You are given a working tracker for Bioservices Sample Result, Assay Run and Research Tool Lot Evidence Control -. The tracker has 18 rows, but not all rows match the source records. You compare each row with the 12 source records, update status notes, write 2 clear queries, and keep unresolved items visible for the next reviewer. Major concepts: Bioservices Sample Result, Assay Run and Research Tool Lot Evidence Control - tracker reconciliation; row-level status control across 18 entries; query writing; mismatch classification; owner follow-up; aging and due-date visibility. Artifact structure: Sections: tracker row ID; source record ID; expected value; observed value; mismatch reason; query owner; due date; status. Evidence to assess: Tracker accuracy; mismatch classification; query clarity; owner assignment; due-date visibility; unresolved-item control. AI support: Use AI to test query wording, find unclear status language, and check whether every mismatch has an owner.',
  1,
  '120 minutes',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Biotechnology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-012-L2' LIMIT 1),
  'B.Sc Biotechnology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Sc Biotechnology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-012-L2' LIMIT 1),
  'M.Sc Biotechnology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Microbiology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-012-L2' LIMIT 1),
  'B.Sc Microbiology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Sc Biochemistry
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-012-L2' LIMIT 1),
  'M.Sc Biochemistry',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Life Sciences
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-012-L2' LIMIT 1),
  'B.Sc Life Sciences',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Biofoundry DBTL Cycle Evidence Execution - Tracker Review and Query Control
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Biofoundry DBTL Cycle Evidence Execution - Tracker Review and Query Control',
  'COURSE-CAP-013-L2',
  'A team is updating a Biofoundry DBTL Cycle Evidence Execution tracker with 18 entries from 12 source records. Four entries do not match the source, 3 owner comments are unclear, and 2 queries are still open before the tracker can move forward. Course objective: Compare Biofoundry DBTL Cycle Evidence Execution tracker rows with source data; correct status notes; write owner queries; separate resolved and unresolved items. Learner outcome: Learner can reconcile a Biofoundry DBTL Cycle Evidence Execution tracker against source records, raise clear queries, and keep unresolved items visible.',
  '8 hours',
  'Active',
  'Pharma / Biotech / MedTech',
  'technical',
  '["Compare Biofoundry DBTL Cycle Evidence Execution tracker rows with source data; correct status notes; write owner queries; separate resolved and unresolved items.","Learner can reconcile a Biofoundry DBTL Cycle Evidence Execution tracker against source records, raise clear queries, and keep unresolved items visible.","Create Biofoundry DBTL Cycle Evidence Execution tracker and query list","Assess evidence using: Tracker accuracy; mismatch classification; query clarity; owner assignment; due-date visibility; unresolved-item control."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L2: Tracker Review and Query Control - CAP-013
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-013-L2' LIMIT 1),
  'L2: Tracker Review and Query Control - CAP-013',
  'You are given a working tracker for Biofoundry DBTL Cycle Evidence Execution. The tracker has 18 rows, but not all rows match the source records. You compare each row with the 12 source records, update status notes, write 2 clear queries, and keep unresolved items visible for the next reviewer. Required data: Biofoundry DBTL Cycle Evidence Execution tracker with 18 line items; 12 source records; 4 mismatch examples; 3 owner comments; 2 open queries; due-date and status columns.',
  1,
  '["Pharma / Biotech / MedTech","Industrial Biomanufacturing and Biofoundry Operations","D-005","CAP-013","L2","Functional; Evidence; Communication; Domain"]'::jsonb,
  '["Scenario Review","Evidence Check","Artifact Build","AI Coaching","Human Review","Retry and Improve","Portfolio Submission"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Biofoundry DBTL Cycle Evidence Execution tracker and query list Practice
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-013-L2' LIMIT 1)
   AND title = 'L2: Tracker Review and Query Control - CAP-013' LIMIT 1),
  'Biofoundry DBTL Cycle Evidence Execution tracker and query list Practice',
  'Complete the Biofoundry DBTL Cycle Evidence Execution tracker and query list using the provided actuals and explain the evidence decision in simple workplace language.',
  'Workplace scenario: You are given a working tracker for Biofoundry DBTL Cycle Evidence Execution. The tracker has 18 rows, but not all rows match the source records. You compare each row with the 12 source records, update status notes, write 2 clear queries, and keep unresolved items visible for the next reviewer. Major concepts: Biofoundry DBTL Cycle Evidence Execution tracker reconciliation; row-level status control across 18 entries; query writing; mismatch classification; owner follow-up; aging and due-date visibility. Artifact structure: Sections: tracker row ID; source record ID; expected value; observed value; mismatch reason; query owner; due date; status. Evidence to assess: Tracker accuracy; mismatch classification; query clarity; owner assignment; due-date visibility; unresolved-item control. AI support: Use AI to test query wording, find unclear status language, and check whether every mismatch has an owner.',
  1,
  '120 minutes',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech Biotechnology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-013-L2' LIMIT 1),
  'B.Tech Biotechnology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Tech Biotechnology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-013-L2' LIMIT 1),
  'M.Tech Biotechnology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Biotechnology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-013-L2' LIMIT 1),
  'B.Sc Biotechnology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Sc Synthetic Biology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-013-L2' LIMIT 1),
  'M.Sc Synthetic Biology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Sc Industrial Biotechnology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-013-L2' LIMIT 1),
  'M.Sc Industrial Biotechnology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Industrial Bioprocess Scale-Up and Product Evidence Handoff - Tracker Review and Query Control
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Industrial Bioprocess Scale-Up and Product Evidence Handoff - Tracker Review and Query Control',
  'COURSE-CAP-014-L2',
  'A team is updating an Industrial Bioprocess Scale-Up and Product Evidence Handoff tracker with 18 entries from 12 source records. Four entries do not match the source, 3 owner comments are unclear, and 2 queries are still open before the tracker can move forward. Course objective: Compare Industrial Bioprocess Scale-Up and Product Evidence Handoff tracker rows with source data; correct status notes; write owner queries; separate resolved and unresolved items. Learner outcome: Learner can reconcile an Industrial Bioprocess Scale-Up and Product Evidence Handoff tracker against source records, raise clear queries, and keep unresolved items visible.',
  '8 hours',
  'Active',
  'Pharma / Biotech / MedTech',
  'technical',
  '["Compare Industrial Bioprocess Scale-Up and Product Evidence Handoff tracker rows with source data; correct status notes; write owner queries; separate resolved and unresolved items.","Learner can reconcile an Industrial Bioprocess Scale-Up and Product Evidence Handoff tracker against source records, raise clear queries, and keep unresolved items visible.","Create Industrial Bioprocess Scale-Up and Product Evidence Handoff tracker and query list","Assess evidence using: Tracker accuracy; mismatch classification; query clarity; owner assignment; due-date visibility; unresolved-item control."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L2: Tracker Review and Query Control - CAP-014
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-014-L2' LIMIT 1),
  'L2: Tracker Review and Query Control - CAP-014',
  'You are given a working tracker for Industrial Bioprocess Scale-Up and Product Evidence Handoff. The tracker has 18 rows, but not all rows match the source records. You compare each row with the 12 source records, update status notes, write 2 clear queries, and keep unresolved items visible for the next reviewer. Required data: Industrial Bioprocess Scale-Up and Product Evidence Handoff tracker with 18 line items; 12 source records; 4 mismatch examples; 3 owner comments; 2 open queries; due-date and status columns.',
  1,
  '["Pharma / Biotech / MedTech","Industrial Biomanufacturing and Biofoundry Operations","D-005","CAP-014","L2","Functional; Evidence; Communication; Domain"]'::jsonb,
  '["Scenario Review","Evidence Check","Artifact Build","AI Coaching","Human Review","Retry and Improve","Portfolio Submission"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Industrial Bioprocess Scale-Up and Product Evidence Handoff tracker and query list Practice
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-014-L2' LIMIT 1)
   AND title = 'L2: Tracker Review and Query Control - CAP-014' LIMIT 1),
  'Industrial Bioprocess Scale-Up and Product Evidence Handoff tracker and query list Practice',
  'Complete the Industrial Bioprocess Scale-Up and Product Evidence Handoff tracker and query list using the provided actuals and explain the evidence decision in simple workplace language.',
  'Workplace scenario: You are given a working tracker for Industrial Bioprocess Scale-Up and Product Evidence Handoff. The tracker has 18 rows, but not all rows match the source records. You compare each row with the 12 source records, update status notes, write 2 clear queries, and keep unresolved items visible for the next reviewer. Major concepts: Industrial Bioprocess Scale-Up and Product Evidence Handoff tracker reconciliation; row-level status control across 18 entries; query writing; mismatch classification; owner follow-up; aging and due-date visibility. Artifact structure: Sections: tracker row ID; source record ID; expected value; observed value; mismatch reason; query owner; due date; status. Evidence to assess: Tracker accuracy; mismatch classification; query clarity; owner assignment; due-date visibility; unresolved-item control. AI support: Use AI to test query wording, find unclear status language, and check whether every mismatch has an owner.',
  1,
  '120 minutes',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech Biotechnology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-014-L2' LIMIT 1),
  'B.Tech Biotechnology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Tech Bioprocess Engineering
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-014-L2' LIMIT 1),
  'M.Tech Bioprocess Engineering',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Biotechnology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-014-L2' LIMIT 1),
  'B.Sc Biotechnology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Sc Industrial Biotechnology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-014-L2' LIMIT 1),
  'M.Sc Industrial Biotechnology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Pharm
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-014-L2' LIMIT 1),
  'B.Pharm',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Agri-Biotech Trait, Field Trial and Stewardship Evidence Packet Control - Tracker Review and Query Control
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Agri-Biotech Trait, Field Trial and Stewardship Evidence Packet Control - Tracker Review and Query Control',
  'COURSE-CAP-015-L2',
  'A team is updating an Agri-Biotech Trait, Field Trial and Stewardship Evidence Packet Control tracker with 18 entries from 12 source records. Four entries do not match the source, 3 owner comments are unclear, and 2 queries are still open before the tracker can move forward. Course objective: Compare Agri-Biotech Trait, Field Trial and Stewardship Evidence Packet Control tracker rows with source data; correct status notes; write owner queries; separate resolved and unresolved items. Learner outcome: Learner can reconcile an Agri-Biotech Trait, Field Trial and Stewardship Evidence Packet Control tracker against source records, raise clear queries, and keep unresolved items visible.',
  '8 hours',
  'Active',
  'Pharma / Biotech / MedTech',
  'technical',
  '["Compare Agri-Biotech Trait, Field Trial and Stewardship Evidence Packet Control tracker rows with source data; correct status notes; write owner queries; separate resolved and unresolved items.","Learner can reconcile an Agri-Biotech Trait, Field Trial and Stewardship Evidence Packet Control tracker against source records, raise clear queries, and keep unresolved items visible.","Create Agri-Biotech Trait, Field Trial and Stewardship Evidence Packet Control tracker and query list","Assess evidence using: Tracker accuracy; mismatch classification; query clarity; owner assignment; due-date visibility; unresolved-item control."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L2: Tracker Review and Query Control - CAP-015
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-015-L2' LIMIT 1),
  'L2: Tracker Review and Query Control - CAP-015',
  'You are given a working tracker for Agri-Biotech Trait, Field Trial and Stewardship Evidence Packet Control. The tracker has 18 rows, but not all rows match the source records. You compare each row with the 12 source records, update status notes, write 2 clear queries, and keep unresolved items visible for the next reviewer. Required data: Agri-Biotech Trait, Field Trial and Stewardship Evidence Packet Control tracker with 18 line items; 12 source records; 4 mismatch examples; 3 owner comments; 2 open queries; due-date and status columns.',
  1,
  '["Pharma / Biotech / MedTech","Agri-Biotech and Seed Biotechnology Affairs","D-006","CAP-015","L2","Functional; Evidence; Communication; Domain"]'::jsonb,
  '["Scenario Review","Evidence Check","Artifact Build","AI Coaching","Human Review","Retry and Improve","Portfolio Submission"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Agri-Biotech Trait, Field Trial and Stewardship Evidence Packet Control tracker and query list Practice
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-015-L2' LIMIT 1)
   AND title = 'L2: Tracker Review and Query Control - CAP-015' LIMIT 1),
  'Agri-Biotech Trait, Field Trial and Stewardship Evidence Packet Control tracker and query list Practice',
  'Complete the Agri-Biotech Trait, Field Trial and Stewardship Evidence Packet Control tracker and query list using the provided actuals and explain the evidence decision in simple workplace language.',
  'Workplace scenario: You are given a working tracker for Agri-Biotech Trait, Field Trial and Stewardship Evidence Packet Control. The tracker has 18 rows, but not all rows match the source records. You compare each row with the 12 source records, update status notes, write 2 clear queries, and keep unresolved items visible for the next reviewer. Major concepts: Agri-Biotech Trait, Field Trial and Stewardship Evidence Packet Control tracker reconciliation; row-level status control across 18 entries; query writing; mismatch classification; owner follow-up; aging and due-date visibility. Artifact structure: Sections: tracker row ID; source record ID; expected value; observed value; mismatch reason; query owner; due date; status. Evidence to assess: Tracker accuracy; mismatch classification; query clarity; owner assignment; due-date visibility; unresolved-item control. AI support: Use AI to test query wording, find unclear status language, and check whether every mismatch has an owner.',
  1,
  '120 minutes',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Agriculture
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-015-L2' LIMIT 1),
  'B.Sc Agriculture',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Sc Plant Biotechnology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-015-L2' LIMIT 1),
  'M.Sc Plant Biotechnology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Biotechnology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-015-L2' LIMIT 1),
  'B.Sc Biotechnology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Sc Genetics and Plant Breeding
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-015-L2' LIMIT 1),
  'M.Sc Genetics and Plant Breeding',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech Biotechnology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-015-L2' LIMIT 1),
  'B.Tech Biotechnology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Agri-Biotech License-to-Operate Evidence Coordination - Tracker Review and Query Control
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Agri-Biotech License-to-Operate Evidence Coordination - Tracker Review and Query Control',
  'COURSE-CAP-016-L2',
  'A team is updating an Agri-Biotech License-to-Operate Evidence Coordination tracker with 18 entries from 12 source records. Four entries do not match the source, 3 owner comments are unclear, and 2 queries are still open before the tracker can move forward. Course objective: Compare Agri-Biotech License-to-Operate Evidence Coordination tracker rows with source data; correct status notes; write owner queries; separate resolved and unresolved items. Learner outcome: Learner can reconcile an Agri-Biotech License-to-Operate Evidence Coordination tracker against source records, raise clear queries, and keep unresolved items visible.',
  '8 hours',
  'Active',
  'Pharma / Biotech / MedTech',
  'technical',
  '["Compare Agri-Biotech License-to-Operate Evidence Coordination tracker rows with source data; correct status notes; write owner queries; separate resolved and unresolved items.","Learner can reconcile an Agri-Biotech License-to-Operate Evidence Coordination tracker against source records, raise clear queries, and keep unresolved items visible.","Create Agri-Biotech License-to-Operate Evidence Coordination tracker and query list","Assess evidence using: Tracker accuracy; mismatch classification; query clarity; owner assignment; due-date visibility; unresolved-item control."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L2: Tracker Review and Query Control - CAP-016
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-016-L2' LIMIT 1),
  'L2: Tracker Review and Query Control - CAP-016',
  'You are given a working tracker for Agri-Biotech License-to-Operate Evidence Coordination. The tracker has 18 rows, but not all rows match the source records. You compare each row with the 12 source records, update status notes, write 2 clear queries, and keep unresolved items visible for the next reviewer. Required data: Agri-Biotech License-to-Operate Evidence Coordination tracker with 18 line items; 12 source records; 4 mismatch examples; 3 owner comments; 2 open queries; due-date and status columns.',
  1,
  '["Pharma / Biotech / MedTech","Agri-Biotech and Seed Biotechnology Affairs","D-006","CAP-016","L2","Functional; Evidence; Communication; Domain"]'::jsonb,
  '["Scenario Review","Evidence Check","Artifact Build","AI Coaching","Human Review","Retry and Improve","Portfolio Submission"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Agri-Biotech License-to-Operate Evidence Coordination tracker and query list Practice
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-016-L2' LIMIT 1)
   AND title = 'L2: Tracker Review and Query Control - CAP-016' LIMIT 1),
  'Agri-Biotech License-to-Operate Evidence Coordination tracker and query list Practice',
  'Complete the Agri-Biotech License-to-Operate Evidence Coordination tracker and query list using the provided actuals and explain the evidence decision in simple workplace language.',
  'Workplace scenario: You are given a working tracker for Agri-Biotech License-to-Operate Evidence Coordination. The tracker has 18 rows, but not all rows match the source records. You compare each row with the 12 source records, update status notes, write 2 clear queries, and keep unresolved items visible for the next reviewer. Major concepts: Agri-Biotech License-to-Operate Evidence Coordination tracker reconciliation; row-level status control across 18 entries; query writing; mismatch classification; owner follow-up; aging and due-date visibility. Artifact structure: Sections: tracker row ID; source record ID; expected value; observed value; mismatch reason; query owner; due date; status. Evidence to assess: Tracker accuracy; mismatch classification; query clarity; owner assignment; due-date visibility; unresolved-item control. AI support: Use AI to test query wording, find unclear status language, and check whether every mismatch has an owner.',
  1,
  '120 minutes',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Agriculture
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-016-L2' LIMIT 1),
  'B.Sc Agriculture',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Sc Agriculture Biotechnology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-016-L2' LIMIT 1),
  'M.Sc Agriculture Biotechnology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Biotechnology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-016-L2' LIMIT 1),
  'B.Sc Biotechnology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Sc Regulatory Affairs
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-016-L2' LIMIT 1),
  'M.Sc Regulatory Affairs',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech Biotechnology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-016-L2' LIMIT 1),
  'B.Tech Biotechnology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Medical Device Technical File, QMS and Post-Market Evidence Control - Tracker Review and Query Control
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Medical Device Technical File, QMS and Post-Market Evidence Control - Tracker Review and Query Control',
  'COURSE-CAP-017-L2',
  'A team is updating a Medical Device Technical File, QMS and Post-Market Evidence Control tracker with 18 entries from 12 source records. Four entries do not match the source, 3 owner comments are unclear, and 2 queries are still open before the tracker can move forward. Course objective: Compare Medical Device Technical File, QMS and Post-Market Evidence Control tracker rows with source data; correct status notes; write owner queries; separate resolved and unresolved items. Learner outcome: Learner can reconcile a Medical Device Technical File, QMS and Post-Market Evidence Control tracker against source records, raise clear queries, and keep unresolved items visible.',
  '8 hours',
  'Active',
  'Pharma / Biotech / MedTech',
  'technical',
  '["Compare Medical Device Technical File, QMS and Post-Market Evidence Control tracker rows with source data; correct status notes; write owner queries; separate resolved and unresolved items.","Learner can reconcile a Medical Device Technical File, QMS and Post-Market Evidence Control tracker against source records, raise clear queries, and keep unresolved items visible.","Create Medical Device Technical File, QMS and Post-Market Evidence Control tracker and query list","Assess evidence using: Tracker accuracy; mismatch classification; query clarity; owner assignment; due-date visibility; unresolved-item control."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L2: Tracker Review and Query Control - CAP-017
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-017-L2' LIMIT 1),
  'L2: Tracker Review and Query Control - CAP-017',
  'You are given a working tracker for Medical Device Technical File, QMS and Post-Market Evidence Control. The tracker has 18 rows, but not all rows match the source records. You compare each row with the 12 source records, update status notes, write 2 clear queries, and keep unresolved items visible for the next reviewer. Required data: Medical Device Technical File, QMS and Post-Market Evidence Control tracker with 18 line items; 12 source records; 4 mismatch examples; 3 owner comments; 2 open queries; due-date and status columns.',
  1,
  '["Pharma / Biotech / MedTech","Medical Device Regulatory and Quality Operations","D-007","CAP-017","L2","Functional; Evidence; Communication; Domain"]'::jsonb,
  '["Scenario Review","Evidence Check","Artifact Build","AI Coaching","Human Review","Retry and Improve","Portfolio Submission"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Medical Device Technical File, QMS and Post-Market Evidence Control tracker and query list Practice
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-017-L2' LIMIT 1)
   AND title = 'L2: Tracker Review and Query Control - CAP-017' LIMIT 1),
  'Medical Device Technical File, QMS and Post-Market Evidence Control tracker and query list Practice',
  'Complete the Medical Device Technical File, QMS and Post-Market Evidence Control tracker and query list using the provided actuals and explain the evidence decision in simple workplace language.',
  'Workplace scenario: You are given a working tracker for Medical Device Technical File, QMS and Post-Market Evidence Control. The tracker has 18 rows, but not all rows match the source records. You compare each row with the 12 source records, update status notes, write 2 clear queries, and keep unresolved items visible for the next reviewer. Major concepts: Medical Device Technical File, QMS and Post-Market Evidence Control tracker reconciliation; row-level status control across 18 entries; query writing; mismatch classification; owner follow-up; aging and due-date visibility. Artifact structure: Sections: tracker row ID; source record ID; expected value; observed value; mismatch reason; query owner; due date; status. Evidence to assess: Tracker accuracy; mismatch classification; query clarity; owner assignment; due-date visibility; unresolved-item control. AI support: Use AI to test query wording, find unclear status language, and check whether every mismatch has an owner.',
  1,
  '120 minutes',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Pharm
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-017-L2' LIMIT 1),
  'B.Pharm',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Pharm Regulatory Affairs
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-017-L2' LIMIT 1),
  'M.Pharm Regulatory Affairs',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech Biomedical Engineering
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-017-L2' LIMIT 1),
  'B.Tech Biomedical Engineering',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Life Sciences
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-017-L2' LIMIT 1),
  'B.Sc Life Sciences',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Sc Medical Technology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-017-L2' LIMIT 1),
  'M.Sc Medical Technology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Device QC Test Report and Biomedical Equipment Nonconformance Packet Control - Tracker Review and Query Control
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Device QC Test Report and Biomedical Equipment Nonconformance Packet Control - Tracker Review and Query Control',
  'COURSE-CAP-018A-L2',
  'A team is updating a Device QC Test Report and Biomedical Equipment Nonconformance Packet Control tracker with 18 entries from 12 source records. Four entries do not match the source, 3 owner comments are unclear, and 2 queries are still open before the tracker can move forward. Course objective: Compare Device QC Test Report and Biomedical Equipment Nonconformance Packet Control tracker rows with source data; correct status notes; write owner queries; separate resolved and unresolved items. Learner outcome: Learner can reconcile a Device QC Test Report and Biomedical Equipment Nonconformance Packet Control tracker against source records, raise clear queries, and keep unresolved items visible.',
  '8 hours',
  'Active',
  'Pharma / Biotech / MedTech',
  'technical',
  '["Compare Device QC Test Report and Biomedical Equipment Nonconformance Packet Control tracker rows with source data; correct status notes; write owner queries; separate resolved and unresolved items.","Learner can reconcile a Device QC Test Report and Biomedical Equipment Nonconformance Packet Control tracker against source records, raise clear queries, and keep unresolved items visible.","Create Device QC Test Report and Biomedical Equipment Nonconformance Packet Control tracker and query list","Assess evidence using: Tracker accuracy; mismatch classification; query clarity; owner assignment; due-date visibility; unresolved-item control."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L2: Tracker Review and Query Control - CAP-018A
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-018A-L2' LIMIT 1),
  'L2: Tracker Review and Query Control - CAP-018A',
  'You are given a working tracker for Device QC Test Report and Biomedical Equipment Nonconformance Packet Control. The tracker has 18 rows, but not all rows match the source records. You compare each row with the 12 source records, update status notes, write 2 clear queries, and keep unresolved items visible for the next reviewer. Required data: Device QC Test Report and Biomedical Equipment Nonconformance Packet Control tracker with 18 line items; 12 source records; 4 mismatch examples; 3 owner comments; 2 open queries; due-date and status columns.',
  1,
  '["Pharma / Biotech / MedTech","Medical Device QC Testing and Biomedical Equipment Evidence","D-007","CAP-018A","L2","Functional; Evidence; Communication; Domain"]'::jsonb,
  '["Scenario Review","Evidence Check","Artifact Build","AI Coaching","Human Review","Retry and Improve","Portfolio Submission"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Device QC Test Report and Biomedical Equipment Nonconformance Packet Control tracker and query list Practice
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-018A-L2' LIMIT 1)
   AND title = 'L2: Tracker Review and Query Control - CAP-018A' LIMIT 1),
  'Device QC Test Report and Biomedical Equipment Nonconformance Packet Control tracker and query list Practice',
  'Complete the Device QC Test Report and Biomedical Equipment Nonconformance Packet Control tracker and query list using the provided actuals and explain the evidence decision in simple workplace language.',
  'Workplace scenario: You are given a working tracker for Device QC Test Report and Biomedical Equipment Nonconformance Packet Control. The tracker has 18 rows, but not all rows match the source records. You compare each row with the 12 source records, update status notes, write 2 clear queries, and keep unresolved items visible for the next reviewer. Major concepts: Device QC Test Report and Biomedical Equipment Nonconformance Packet Control tracker reconciliation; row-level status control across 18 entries; query writing; mismatch classification; owner follow-up; aging and due-date visibility. Artifact structure: Sections: tracker row ID; source record ID; expected value; observed value; mismatch reason; query owner; due date; status. Evidence to assess: Tracker accuracy; mismatch classification; query clarity; owner assignment; due-date visibility; unresolved-item control. AI support: Use AI to test query wording, find unclear status language, and check whether every mismatch has an owner.',
  1,
  '120 minutes',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech Biomedical Engineering
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-018A-L2' LIMIT 1),
  'B.Tech Biomedical Engineering',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: Diploma Biomedical Engineering
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-018A-L2' LIMIT 1),
  'Diploma Biomedical Engineering',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Medical Laboratory Technology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-018A-L2' LIMIT 1),
  'B.Sc Medical Laboratory Technology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech Electronics and Instrumentation
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-018A-L2' LIMIT 1),
  'B.Tech Electronics and Instrumentation',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Physics
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-018A-L2' LIMIT 1),
  'B.Sc Physics',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: IVD Performance, Diagnostic Evidence and PMS Packet Control - Tracker Review and Query Control
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'IVD Performance, Diagnostic Evidence and PMS Packet Control - Tracker Review and Query Control',
  'COURSE-CAP-018B-L2',
  'A team is updating an IVD Performance, Diagnostic Evidence and PMS Packet Control tracker with 18 entries from 12 source records. Four entries do not match the source, 3 owner comments are unclear, and 2 queries are still open before the tracker can move forward. Course objective: Compare IVD Performance, Diagnostic Evidence and PMS Packet Control tracker rows with source data; correct status notes; write owner queries; separate resolved and unresolved items. Learner outcome: Learner can reconcile an IVD Performance, Diagnostic Evidence and PMS Packet Control tracker against source records, raise clear queries, and keep unresolved items visible.',
  '8 hours',
  'Active',
  'Pharma / Biotech / MedTech',
  'technical',
  '["Compare IVD Performance, Diagnostic Evidence and PMS Packet Control tracker rows with source data; correct status notes; write owner queries; separate resolved and unresolved items.","Learner can reconcile an IVD Performance, Diagnostic Evidence and PMS Packet Control tracker against source records, raise clear queries, and keep unresolved items visible.","Create IVD Performance, Diagnostic Evidence and PMS Packet Control tracker and query list","Assess evidence using: Tracker accuracy; mismatch classification; query clarity; owner assignment; due-date visibility; unresolved-item control."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L2: Tracker Review and Query Control - CAP-018B
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-018B-L2' LIMIT 1),
  'L2: Tracker Review and Query Control - CAP-018B',
  'You are given a working tracker for IVD Performance, Diagnostic Evidence and PMS Packet Control. The tracker has 18 rows, but not all rows match the source records. You compare each row with the 12 source records, update status notes, write 2 clear queries, and keep unresolved items visible for the next reviewer. Required data: IVD Performance, Diagnostic Evidence and PMS Packet Control tracker with 18 line items; 12 source records; 4 mismatch examples; 3 owner comments; 2 open queries; due-date and status columns.',
  1,
  '["Pharma / Biotech / MedTech","IVD Regulatory and Performance Evaluation Operations","Medical Device Softwar","D-007","CAP-018B","L2","Functional; Evidence; Communication; Domain"]'::jsonb,
  '["Scenario Review","Evidence Check","Artifact Build","AI Coaching","Human Review","Retry and Improve","Portfolio Submission"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: IVD Performance, Diagnostic Evidence and PMS Packet Control tracker and query list Practice
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-018B-L2' LIMIT 1)
   AND title = 'L2: Tracker Review and Query Control - CAP-018B' LIMIT 1),
  'IVD Performance, Diagnostic Evidence and PMS Packet Control tracker and query list Practice',
  'Complete the IVD Performance, Diagnostic Evidence and PMS Packet Control tracker and query list using the provided actuals and explain the evidence decision in simple workplace language.',
  'Workplace scenario: You are given a working tracker for IVD Performance, Diagnostic Evidence and PMS Packet Control. The tracker has 18 rows, but not all rows match the source records. You compare each row with the 12 source records, update status notes, write 2 clear queries, and keep unresolved items visible for the next reviewer. Major concepts: IVD Performance, Diagnostic Evidence and PMS Packet Control tracker reconciliation; row-level status control across 18 entries; query writing; mismatch classification; owner follow-up; aging and due-date visibility. Artifact structure: Sections: tracker row ID; source record ID; expected value; observed value; mismatch reason; query owner; due date; status. Evidence to assess: Tracker accuracy; mismatch classification; query clarity; owner assignment; due-date visibility; unresolved-item control. AI support: Use AI to test query wording, find unclear status language, and check whether every mismatch has an owner.',
  1,
  '120 minutes',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Medical Laboratory Technology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-018B-L2' LIMIT 1),
  'B.Sc Medical Laboratory Technology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Sc Clinical Biochemistry
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-018B-L2' LIMIT 1),
  'M.Sc Clinical Biochemistry',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Sc Microbiology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-018B-L2' LIMIT 1),
  'M.Sc Microbiology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech Biotechnology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-018B-L2' LIMIT 1),
  'B.Tech Biotechnology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Biotechnology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-018B-L2' LIMIT 1),
  'B.Sc Biotechnology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: SaMD Lifecycle, V&V and Cybersecurity Evidence Index Control - Tracker Review and Query Control
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'SaMD Lifecycle, V&V and Cybersecurity Evidence Index Control - Tracker Review and Query Control',
  'COURSE-CAP-018C-L2',
  'A team is updating a SaMD Lifecycle, V&V and Cybersecurity Evidence Index Control tracker with 18 entries from 12 source records. Four entries do not match the source, 3 owner comments are unclear, and 2 queries are still open before the tracker can move forward. Course objective: Compare SaMD Lifecycle, V&V and Cybersecurity Evidence Index Control tracker rows with source data; correct status notes; write owner queries; separate resolved and unresolved items. Learner outcome: Learner can reconcile a SaMD Lifecycle, V&V and Cybersecurity Evidence Index Control tracker against source records, raise clear queries, and keep unresolved items visible.',
  '8 hours',
  'Active',
  'Pharma / Biotech / MedTech',
  'technical',
  '["Compare SaMD Lifecycle, V&V and Cybersecurity Evidence Index Control tracker rows with source data; correct status notes; write owner queries; separate resolved and unresolved items.","Learner can reconcile a SaMD Lifecycle, V&V and Cybersecurity Evidence Index Control tracker against source records, raise clear queries, and keep unresolved items visible.","Create SaMD Lifecycle, V&V and Cybersecurity Evidence Index Control tracker and query list","Assess evidence using: Tracker accuracy; mismatch classification; query clarity; owner assignment; due-date visibility; unresolved-item control."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L2: Tracker Review and Query Control - CAP-018C
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-018C-L2' LIMIT 1),
  'L2: Tracker Review and Query Control - CAP-018C',
  'You are given a working tracker for SaMD Lifecycle, V&V and Cybersecurity Evidence Index Control. The tracker has 18 rows, but not all rows match the source records. You compare each row with the 12 source records, update status notes, write 2 clear queries, and keep unresolved items visible for the next reviewer. Required data: SaMD Lifecycle, V&V and Cybersecurity Evidence Index Control tracker with 18 line items; 12 source records; 4 mismatch examples; 3 owner comments; 2 open queries; due-date and status columns.',
  1,
  '["Pharma / Biotech / MedTech","Medical Device Software QARA and Digital Product Evidence","D-007","CAP-018C","L2","Functional; Evidence; Communication; Domain"]'::jsonb,
  '["Scenario Review","Evidence Check","Artifact Build","AI Coaching","Human Review","Retry and Improve","Portfolio Submission"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: SaMD Lifecycle, V&V and Cybersecurity Evidence Index Control tracker and query list Practice
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-018C-L2' LIMIT 1)
   AND title = 'L2: Tracker Review and Query Control - CAP-018C' LIMIT 1),
  'SaMD Lifecycle, V&V and Cybersecurity Evidence Index Control tracker and query list Practice',
  'Complete the SaMD Lifecycle, V&V and Cybersecurity Evidence Index Control tracker and query list using the provided actuals and explain the evidence decision in simple workplace language.',
  'Workplace scenario: You are given a working tracker for SaMD Lifecycle, V&V and Cybersecurity Evidence Index Control. The tracker has 18 rows, but not all rows match the source records. You compare each row with the 12 source records, update status notes, write 2 clear queries, and keep unresolved items visible for the next reviewer. Major concepts: SaMD Lifecycle, V&V and Cybersecurity Evidence Index Control tracker reconciliation; row-level status control across 18 entries; query writing; mismatch classification; owner follow-up; aging and due-date visibility. Artifact structure: Sections: tracker row ID; source record ID; expected value; observed value; mismatch reason; query owner; due date; status. Evidence to assess: Tracker accuracy; mismatch classification; query clarity; owner assignment; due-date visibility; unresolved-item control. AI support: Use AI to test query wording, find unclear status language, and check whether every mismatch has an owner.',
  1,
  '120 minutes',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech Biomedical Engineering
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-018C-L2' LIMIT 1),
  'B.Tech Biomedical Engineering',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech Computer Science
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-018C-L2' LIMIT 1),
  'B.Tech Computer Science',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech Information Technology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-018C-L2' LIMIT 1),
  'B.Tech Information Technology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Sc Health Informatics
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-018C-L2' LIMIT 1),
  'M.Sc Health Informatics',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Tech Medical Software Systems
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-018C-L2' LIMIT 1),
  'M.Tech Medical Software Systems',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: API Batch Quality Evidence Review - Exception Escalation and Blocker Handling
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'API Batch Quality Evidence Review - Exception Escalation and Blocker Handling',
  'COURSE-CAP-001-L3',
  'An exception appears in the API Batch Quality Evidence Review evidence flow. Out of 16 evidence entries, 5 attachments are weak or missing, 2 blockers remain unresolved, and the learner must decide what needs escalation without taking approval authority. Course objective: Classify API Batch Quality Evidence Review exceptions by priority; identify blockers; build an escalation packet; state authority limits clearly. Learner outcome: Learner can classify API Batch Quality Evidence Review exceptions, separate missing evidence from risk blockers, and prepare an escalation packet.',
  '10 hours',
  'Active',
  'Pharma / Biotech / MedTech',
  'technical',
  '["Classify API Batch Quality Evidence Review exceptions by priority; identify blockers; build an escalation packet; state authority limits clearly.","Learner can classify API Batch Quality Evidence Review exceptions, separate missing evidence from risk blockers, and prepare an escalation packet.","Create API Batch Quality Evidence Review exception escalation packet","Assess evidence using: Exception priority; blocker clarity; attachment gap evidence; escalation logic; role-boundary discipline."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L3: Exception Escalation and Blocker Handling - CAP-001
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-001-L3' LIMIT 1),
  'L3: Exception Escalation and Blocker Handling - CAP-001',
  'A problem has moved beyond routine checking. The API Batch Quality Evidence Review evidence pack has missing attachments and a possible timeline risk. You sort 16 evidence entries into clean, unclear, missing, and escalation-needed groups, then prepare a packet that explains the 2 blockers. Required data: API Batch Quality Evidence Review exception case file; 16 evidence entries; 5 missing or weak attachments; 3 priority labels; 2 unresolved blockers; escalation-note template.',
  1,
  '["Pharma / Biotech / MedTech","Small-Molecule Pharma Manufacturing and CMC Regulatory Operations","D-001","CAP-001","L3","Cognitive; Behavioural; Compliance; Evidence; Communication"]'::jsonb,
  '["Scenario Review","Evidence Check","Artifact Build","AI Coaching","Human Review","Retry and Improve","Portfolio Submission"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: API Batch Quality Evidence Review exception escalation packet Practice
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-001-L3' LIMIT 1)
   AND title = 'L3: Exception Escalation and Blocker Handling - CAP-001' LIMIT 1),
  'API Batch Quality Evidence Review exception escalation packet Practice',
  'Complete the API Batch Quality Evidence Review exception escalation packet using the provided actuals and explain the evidence decision in simple workplace language.',
  'Workplace scenario: A problem has moved beyond routine checking. The API Batch Quality Evidence Review evidence pack has missing attachments and a possible timeline risk. You sort 16 evidence entries into clean, unclear, missing, and escalation-needed groups, then prepare a packet that explains the 2 blockers. Major concepts: API Batch Quality Evidence Review exception triage; blocker classification; evidence sufficiency; risk-priority sorting; escalation note structure; authority-safe handoff. Artifact structure: Sections: exception summary; affected evidence items; missing attachments; risk priority; blocker owner; escalation recommendation; authority limit. Evidence to assess: Exception priority; blocker clarity; attachment gap evidence; escalation logic; role-boundary discipline. AI support: Use AI to challenge escalation logic and role-boundary wording, not to decide final risk or approval.',
  1,
  '150 minutes',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Pharm
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-001-L3' LIMIT 1),
  'B.Pharm',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Pharm Pharmaceutical Quality Assurance
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-001-L3' LIMIT 1),
  'M.Pharm Pharmaceutical Quality Assurance',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Pharm Pharmaceutics
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-001-L3' LIMIT 1),
  'M.Pharm Pharmaceutics',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Chemistry
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-001-L3' LIMIT 1),
  'B.Sc Chemistry',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Sc Pharmaceutical Chemistry
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-001-L3' LIMIT 1),
  'M.Sc Pharmaceutical Chemistry',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: API Deviation, OOS and CAPA Evidence Control - Exception Escalation and Blocker Handling
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'API Deviation, OOS and CAPA Evidence Control - Exception Escalation and Blocker Handling',
  'COURSE-CAP-002-L3',
  'An exception appears in the API Deviation, OOS and CAPA Evidence Control evidence flow. Out of 16 evidence entries, 5 attachments are weak or missing, 2 blockers remain unresolved, and the learner must decide what needs escalation without taking approval authority. Course objective: Classify API Deviation, OOS and CAPA Evidence Control exceptions by priority; identify blockers; build an escalation packet; state authority limits clearly. Learner outcome: Learner can classify API Deviation, OOS and CAPA Evidence Control exceptions, separate missing evidence from risk blockers, and prepare an escalation packet.',
  '10 hours',
  'Active',
  'Pharma / Biotech / MedTech',
  'technical',
  '["Classify API Deviation, OOS and CAPA Evidence Control exceptions by priority; identify blockers; build an escalation packet; state authority limits clearly.","Learner can classify API Deviation, OOS and CAPA Evidence Control exceptions, separate missing evidence from risk blockers, and prepare an escalation packet.","Create API Deviation, OOS and CAPA Evidence Control exception escalation packet","Assess evidence using: Exception priority; blocker clarity; attachment gap evidence; escalation logic; role-boundary discipline."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L3: Exception Escalation and Blocker Handling - CAP-002
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-002-L3' LIMIT 1),
  'L3: Exception Escalation and Blocker Handling - CAP-002',
  'A problem has moved beyond routine checking. The API Deviation, OOS and CAPA Evidence Control evidence pack has missing attachments and a possible timeline risk. You sort 16 evidence entries into clean, unclear, missing, and escalation-needed groups, then prepare a packet that explains the 2 blockers. Required data: API Deviation, OOS and CAPA Evidence Control exception case file; 16 evidence entries; 5 missing or weak attachments; 3 priority labels; 2 unresolved blockers; escalation-note template.',
  1,
  '["Pharma / Biotech / MedTech","Small-Molecule Pharma Manufacturing and CMC Regulatory Operations","Pharma GM","D-001","CAP-002","L3","Cognitive; Behavioural; Compliance; Evidence; Communication"]'::jsonb,
  '["Scenario Review","Evidence Check","Artifact Build","AI Coaching","Human Review","Retry and Improve","Portfolio Submission"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: API Deviation, OOS and CAPA Evidence Control exception escalation packet Practice
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-002-L3' LIMIT 1)
   AND title = 'L3: Exception Escalation and Blocker Handling - CAP-002' LIMIT 1),
  'API Deviation, OOS and CAPA Evidence Control exception escalation packet Practice',
  'Complete the API Deviation, OOS and CAPA Evidence Control exception escalation packet using the provided actuals and explain the evidence decision in simple workplace language.',
  'Workplace scenario: A problem has moved beyond routine checking. The API Deviation, OOS and CAPA Evidence Control evidence pack has missing attachments and a possible timeline risk. You sort 16 evidence entries into clean, unclear, missing, and escalation-needed groups, then prepare a packet that explains the 2 blockers. Major concepts: API Deviation, OOS and CAPA Evidence Control exception triage; blocker classification; evidence sufficiency; risk-priority sorting; escalation note structure; authority-safe handoff. Artifact structure: Sections: exception summary; affected evidence items; missing attachments; risk priority; blocker owner; escalation recommendation; authority limit. Evidence to assess: Exception priority; blocker clarity; attachment gap evidence; escalation logic; role-boundary discipline. AI support: Use AI to challenge escalation logic and role-boundary wording, not to decide final risk or approval.',
  1,
  '150 minutes',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Pharm
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-002-L3' LIMIT 1),
  'B.Pharm',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Pharm Pharmaceutical Quality Assurance
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-002-L3' LIMIT 1),
  'M.Pharm Pharmaceutical Quality Assurance',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Pharm Pharmaceutics
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-002-L3' LIMIT 1),
  'M.Pharm Pharmaceutics',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Chemistry
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-002-L3' LIMIT 1),
  'B.Sc Chemistry',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Sc Pharmaceutical Chemistry
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-002-L3' LIMIT 1),
  'M.Sc Pharmaceutical Chemistry',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Finished Dose BMR/BPR Packaging Variance and Release Packet Control - Exception Escalation and Blocker Handling
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Finished Dose BMR/BPR Packaging Variance and Release Packet Control - Exception Escalation and Blocker Handling',
  'COURSE-CAP-003-L3',
  'An exception appears in the Finished Dose BMR/BPR Packaging Variance and Release Packet Control evidence flow. Out of 16 evidence entries, 5 attachments are weak or missing, 2 blockers remain unresolved, and the learner must decide what needs escalation without taking approval authority. Course objective: Classify Finished Dose BMR/BPR Packaging Variance and Release Packet Control exceptions by priority; identify blockers; build an escalation packet; state authority limits clearly. Learner outcome: Learner can classify Finished Dose BMR/BPR Packaging Variance and Release Packet Control exceptions, separate missing evidence from risk blockers, and prepare an escalation packet.',
  '10 hours',
  'Active',
  'Pharma / Biotech / MedTech',
  'technical',
  '["Classify Finished Dose BMR/BPR Packaging Variance and Release Packet Control exceptions by priority; identify blockers; build an escalation packet; state authority limits clearly.","Learner can classify Finished Dose BMR/BPR Packaging Variance and Release Packet Control exceptions, separate missing evidence from risk blockers, and prepare an escalation packet.","Create Finished Dose BMR/BPR Packaging Variance and Release Packet Control exception escalation packet","Assess evidence using: Exception priority; blocker clarity; attachment gap evidence; escalation logic; role-boundary discipline."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L3: Exception Escalation and Blocker Handling - CAP-003
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-003-L3' LIMIT 1),
  'L3: Exception Escalation and Blocker Handling - CAP-003',
  'A problem has moved beyond routine checking. The Finished Dose BMR/BPR Packaging Variance and Release Packet Control evidence pack has missing attachments and a possible timeline risk. You sort 16 evidence entries into clean, unclear, missing, and escalation-needed groups, then prepare a packet that explains the 2 blockers. Required data: Finished Dose BMR/BPR Packaging Variance and Release Packet Control exception case file; 16 evidence entries; 5 missing or weak attachments; 3 priority labels; 2 unresolved blockers; escalation-note template.',
  1,
  '["Pharma / Biotech / MedTech","Small-Molecule Pharma Manufacturing and CMC Regulatory Operations","Pharma GM","D-001","CAP-003","L3","Cognitive; Behavioural; Compliance; Evidence; Communication"]'::jsonb,
  '["Scenario Review","Evidence Check","Artifact Build","AI Coaching","Human Review","Retry and Improve","Portfolio Submission"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Finished Dose BMR/BPR Packaging Variance and Release Packet Control exception escalation packet Practice
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-003-L3' LIMIT 1)
   AND title = 'L3: Exception Escalation and Blocker Handling - CAP-003' LIMIT 1),
  'Finished Dose BMR/BPR Packaging Variance and Release Packet Control exception escalation packet Practice',
  'Complete the Finished Dose BMR/BPR Packaging Variance and Release Packet Control exception escalation packet using the provided actuals and explain the evidence decision in simple workplace language.',
  'Workplace scenario: A problem has moved beyond routine checking. The Finished Dose BMR/BPR Packaging Variance and Release Packet Control evidence pack has missing attachments and a possible timeline risk. You sort 16 evidence entries into clean, unclear, missing, and escalation-needed groups, then prepare a packet that explains the 2 blockers. Major concepts: Finished Dose BMR/BPR Packaging Variance and Release Packet Control exception triage; blocker classification; evidence sufficiency; risk-priority sorting; escalation note structure; authority-safe handoff. Artifact structure: Sections: exception summary; affected evidence items; missing attachments; risk priority; blocker owner; escalation recommendation; authority limit. Evidence to assess: Exception priority; blocker clarity; attachment gap evidence; escalation logic; role-boundary discipline. AI support: Use AI to challenge escalation logic and role-boundary wording, not to decide final risk or approval.',
  1,
  '150 minutes',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Pharm
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-003-L3' LIMIT 1),
  'B.Pharm',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Pharm Pharmaceutical Quality Assurance
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-003-L3' LIMIT 1),
  'M.Pharm Pharmaceutical Quality Assurance',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Pharm Pharmaceutics
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-003-L3' LIMIT 1),
  'M.Pharm Pharmaceutics',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Chemistry
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-003-L3' LIMIT 1),
  'B.Sc Chemistry',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Sc Pharmaceutical Chemistry
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-003-L3' LIMIT 1),
  'M.Sc Pharmaceutical Chemistry',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Stability Study Follow-Up and Change-Control Impact Packet Control - Exception Escalation and Blocker Handling
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Stability Study Follow-Up and Change-Control Impact Packet Control - Exception Escalation and Blocker Handling',
  'COURSE-CAP-004-L3',
  'An exception appears in the Stability Study Follow-Up and Change-Control Impact Packet Control evidence flow. Out of 16 evidence entries, 5 attachments are weak or missing, 2 blockers remain unresolved, and the learner must decide what needs escalation without taking approval authority. Course objective: Classify Stability Study Follow-Up and Change-Control Impact Packet Control exceptions by priority; identify blockers; build an escalation packet; state authority limits clearly. Learner outcome: Learner can classify Stability Study Follow-Up and Change-Control Impact Packet Control exceptions, separate missing evidence from risk blockers, and prepare an escalation packet.',
  '10 hours',
  'Active',
  'Pharma / Biotech / MedTech',
  'technical',
  '["Classify Stability Study Follow-Up and Change-Control Impact Packet Control exceptions by priority; identify blockers; build an escalation packet; state authority limits clearly.","Learner can classify Stability Study Follow-Up and Change-Control Impact Packet Control exceptions, separate missing evidence from risk blockers, and prepare an escalation packet.","Create Stability Study Follow-Up and Change-Control Impact Packet Control exception escalation packet","Assess evidence using: Exception priority; blocker clarity; attachment gap evidence; escalation logic; role-boundary discipline."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L3: Exception Escalation and Blocker Handling - CAP-004
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-004-L3' LIMIT 1),
  'L3: Exception Escalation and Blocker Handling - CAP-004',
  'A problem has moved beyond routine checking. The Stability Study Follow-Up and Change-Control Impact Packet Control evidence pack has missing attachments and a possible timeline risk. You sort 16 evidence entries into clean, unclear, missing, and escalation-needed groups, then prepare a packet that explains the 2 blockers. Required data: Stability Study Follow-Up and Change-Control Impact Packet Control exception case file; 16 evidence entries; 5 missing or weak attachments; 3 priority labels; 2 unresolved blockers; escalation-note template.',
  1,
  '["Pharma / Biotech / MedTech","Small-Molecule Pharma Manufacturing and CMC Regulatory Operations","Pharma GM","D-001","CAP-004","L3","Cognitive; Behavioural; Compliance; Evidence; Communication"]'::jsonb,
  '["Scenario Review","Evidence Check","Artifact Build","AI Coaching","Human Review","Retry and Improve","Portfolio Submission"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Stability Study Follow-Up and Change-Control Impact Packet Control exception escalation packet Practice
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-004-L3' LIMIT 1)
   AND title = 'L3: Exception Escalation and Blocker Handling - CAP-004' LIMIT 1),
  'Stability Study Follow-Up and Change-Control Impact Packet Control exception escalation packet Practice',
  'Complete the Stability Study Follow-Up and Change-Control Impact Packet Control exception escalation packet using the provided actuals and explain the evidence decision in simple workplace language.',
  'Workplace scenario: A problem has moved beyond routine checking. The Stability Study Follow-Up and Change-Control Impact Packet Control evidence pack has missing attachments and a possible timeline risk. You sort 16 evidence entries into clean, unclear, missing, and escalation-needed groups, then prepare a packet that explains the 2 blockers. Major concepts: Stability Study Follow-Up and Change-Control Impact Packet Control exception triage; blocker classification; evidence sufficiency; risk-priority sorting; escalation note structure; authority-safe handoff. Artifact structure: Sections: exception summary; affected evidence items; missing attachments; risk priority; blocker owner; escalation recommendation; authority limit. Evidence to assess: Exception priority; blocker clarity; attachment gap evidence; escalation logic; role-boundary discipline. AI support: Use AI to challenge escalation logic and role-boundary wording, not to decide final risk or approval.',
  1,
  '150 minutes',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Pharm
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-004-L3' LIMIT 1),
  'B.Pharm',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Pharm Pharmaceutical Quality Assurance
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-004-L3' LIMIT 1),
  'M.Pharm Pharmaceutical Quality Assurance',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Pharm Pharmaceutics
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-004-L3' LIMIT 1),
  'M.Pharm Pharmaceutics',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Chemistry
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-004-L3' LIMIT 1),
  'B.Sc Chemistry',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Sc Pharmaceutical Chemistry
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-004-L3' LIMIT 1),
  'M.Sc Pharmaceutical Chemistry',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Biological Product Batch and Comparability Evidence Control - Exception Escalation and Blocker Handling
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Biological Product Batch and Comparability Evidence Control - Exception Escalation and Blocker Handling',
  'COURSE-CAP-005-L3',
  'An exception appears in the Biological Product Batch and Comparability Evidence Control evidence flow. Out of 16 evidence entries, 5 attachments are weak or missing, 2 blockers remain unresolved, and the learner must decide what needs escalation without taking approval authority. Course objective: Classify Biological Product Batch and Comparability Evidence Control exceptions by priority; identify blockers; build an escalation packet; state authority limits clearly. Learner outcome: Learner can classify Biological Product Batch and Comparability Evidence Control exceptions, separate missing evidence from risk blockers, and prepare an escalation packet.',
  '10 hours',
  'Active',
  'Pharma / Biotech / MedTech',
  'technical',
  '["Classify Biological Product Batch and Comparability Evidence Control exceptions by priority; identify blockers; build an escalation packet; state authority limits clearly.","Learner can classify Biological Product Batch and Comparability Evidence Control exceptions, separate missing evidence from risk blockers, and prepare an escalation packet.","Create Biological Product Batch and Comparability Evidence Control exception escalation packet","Assess evidence using: Exception priority; blocker clarity; attachment gap evidence; escalation logic; role-boundary discipline."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L3: Exception Escalation and Blocker Handling - CAP-005
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-005-L3' LIMIT 1),
  'L3: Exception Escalation and Blocker Handling - CAP-005',
  'A problem has moved beyond routine checking. The Biological Product Batch and Comparability Evidence Control evidence pack has missing attachments and a possible timeline risk. You sort 16 evidence entries into clean, unclear, missing, and escalation-needed groups, then prepare a packet that explains the 2 blockers. Required data: Biological Product Batch and Comparability Evidence Control exception case file; 16 evidence entries; 5 missing or weak attachments; 3 priority labels; 2 unresolved blockers; escalation-note template.',
  1,
  '["Pharma / Biotech / MedTech","Biological Product, Vaccine and Biosimilar Operations","D-002","CAP-005","L3","Cognitive; Behavioural; Compliance; Evidence; Communication"]'::jsonb,
  '["Scenario Review","Evidence Check","Artifact Build","AI Coaching","Human Review","Retry and Improve","Portfolio Submission"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Biological Product Batch and Comparability Evidence Control exception escalation packet Practice
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-005-L3' LIMIT 1)
   AND title = 'L3: Exception Escalation and Blocker Handling - CAP-005' LIMIT 1),
  'Biological Product Batch and Comparability Evidence Control exception escalation packet Practice',
  'Complete the Biological Product Batch and Comparability Evidence Control exception escalation packet using the provided actuals and explain the evidence decision in simple workplace language.',
  'Workplace scenario: A problem has moved beyond routine checking. The Biological Product Batch and Comparability Evidence Control evidence pack has missing attachments and a possible timeline risk. You sort 16 evidence entries into clean, unclear, missing, and escalation-needed groups, then prepare a packet that explains the 2 blockers. Major concepts: Biological Product Batch and Comparability Evidence Control exception triage; blocker classification; evidence sufficiency; risk-priority sorting; escalation note structure; authority-safe handoff. Artifact structure: Sections: exception summary; affected evidence items; missing attachments; risk priority; blocker owner; escalation recommendation; authority limit. Evidence to assess: Exception priority; blocker clarity; attachment gap evidence; escalation logic; role-boundary discipline. AI support: Use AI to challenge escalation logic and role-boundary wording, not to decide final risk or approval.',
  1,
  '150 minutes',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Pharm
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-005-L3' LIMIT 1),
  'B.Pharm',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Pharm Pharmaceutical Biotechnology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-005-L3' LIMIT 1),
  'M.Pharm Pharmaceutical Biotechnology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Biotechnology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-005-L3' LIMIT 1),
  'B.Sc Biotechnology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Sc Biotechnology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-005-L3' LIMIT 1),
  'M.Sc Biotechnology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech Biotechnology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-005-L3' LIMIT 1),
  'B.Tech Biotechnology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Vaccine Lot QC, Temperature-Excursion and Cold-Chain Release Packet Control - - Exception Escalation and Blocker Handling
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Vaccine Lot QC, Temperature-Excursion and Cold-Chain Release Packet Control - - Exception Escalation and Blocker Handling',
  'COURSE-CAP-006-L3',
  'An exception appears in the Vaccine Lot QC, Temperature-Excursion and Cold-Chain Release Packet Control - evidence flow. Out of 16 evidence entries, 5 attachments are weak or missing, 2 blockers remain unresolved, and the learner must decide what needs escalation without taking approval authority. Course objective: Classify Vaccine Lot QC, Temperature-Excursion and Cold-Chain Release Packet Control - exceptions by priority; identify blockers; build an escalation packet; state authority limits clearly. Learner outcome: Learner can classify Vaccine Lot QC, Temperature-Excursion and Cold-Chain Release Packet Control - exceptions, separate missing evidence from risk blockers, and prepare an escalation packet.',
  '10 hours',
  'Active',
  'Pharma / Biotech / MedTech',
  'technical',
  '["Classify Vaccine Lot QC, Temperature-Excursion and Cold-Chain Release Packet Control - exceptions by priority; identify blockers; build an escalation packet; state authority limits clearly.","Learner can classify Vaccine Lot QC, Temperature-Excursion and Cold-Chain Release Packet Control - exceptions, separate missing evidence from risk blockers, and prepare an escalation packet.","Create Vaccine Lot QC, Temperature-Excursion and Cold-Chain Release Packet Control - exception escalation packet","Assess evidence using: Exception priority; blocker clarity; attachment gap evidence; escalation logic; role-boundary discipline."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L3: Exception Escalation and Blocker Handling - CAP-006
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-006-L3' LIMIT 1),
  'L3: Exception Escalation and Blocker Handling - CAP-006',
  'A problem has moved beyond routine checking. The Vaccine Lot QC, Temperature-Excursion and Cold-Chain Release Packet Control - evidence pack has missing attachments and a possible timeline risk. You sort 16 evidence entries into clean, unclear, missing, and escalation-needed groups, then prepare a packet that explains the 2 blockers. Required data: Vaccine Lot QC, Temperature-Excursion and Cold-Chain Release Packet Control - exception case file; 16 evidence entries; 5 missing or weak attachments; 3 priority labels; 2 unresolved blockers; escalation-note template.',
  1,
  '["Pharma / Biotech / MedTech","Biological Product, Vaccine and Biosimilar Operations","D-002","CAP-006","L3","Cognitive; Behavioural; Compliance; Evidence; Communication"]'::jsonb,
  '["Scenario Review","Evidence Check","Artifact Build","AI Coaching","Human Review","Retry and Improve","Portfolio Submission"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Vaccine Lot QC, Temperature-Excursion and Cold-Chain Release Packet Control - exception escalation packet Practice
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-006-L3' LIMIT 1)
   AND title = 'L3: Exception Escalation and Blocker Handling - CAP-006' LIMIT 1),
  'Vaccine Lot QC, Temperature-Excursion and Cold-Chain Release Packet Control - exception escalation packet Practice',
  'Complete the Vaccine Lot QC, Temperature-Excursion and Cold-Chain Release Packet Control - exception escalation packet using the provided actuals and explain the evidence decision in simple workplace language.',
  'Workplace scenario: A problem has moved beyond routine checking. The Vaccine Lot QC, Temperature-Excursion and Cold-Chain Release Packet Control - evidence pack has missing attachments and a possible timeline risk. You sort 16 evidence entries into clean, unclear, missing, and escalation-needed groups, then prepare a packet that explains the 2 blockers. Major concepts: Vaccine Lot QC, Temperature-Excursion and Cold-Chain Release Packet Control - exception triage; blocker classification; evidence sufficiency; risk-priority sorting; escalation note structure; authority-safe handoff. Artifact structure: Sections: exception summary; affected evidence items; missing attachments; risk priority; blocker owner; escalation recommendation; authority limit. Evidence to assess: Exception priority; blocker clarity; attachment gap evidence; escalation logic; role-boundary discipline. AI support: Use AI to challenge escalation logic and role-boundary wording, not to decide final risk or approval.',
  1,
  '150 minutes',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Pharm
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-006-L3' LIMIT 1),
  'B.Pharm',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Pharm Pharmaceutical Biotechnology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-006-L3' LIMIT 1),
  'M.Pharm Pharmaceutical Biotechnology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Biotechnology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-006-L3' LIMIT 1),
  'B.Sc Biotechnology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Sc Microbiology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-006-L3' LIMIT 1),
  'M.Sc Microbiology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Microbiology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-006-L3' LIMIT 1),
  'B.Sc Microbiology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Advanced Biopharma Evidence Inventory and Authority-Boundary Triage - Exception Escalation and Blocker Handling
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Advanced Biopharma Evidence Inventory and Authority-Boundary Triage - Exception Escalation and Blocker Handling',
  'COURSE-CAP-007-L3',
  'An exception appears in the Advanced Biopharma Evidence Inventory and Authority-Boundary Triage evidence flow. Out of 16 evidence entries, 5 attachments are weak or missing, 2 blockers remain unresolved, and the learner must decide what needs escalation without taking approval authority. Course objective: Classify Advanced Biopharma Evidence Inventory and Authority-Boundary Triage exceptions by priority; identify blockers; build an escalation packet; state authority limits clearly. Learner outcome: Learner can classify Advanced Biopharma Evidence Inventory and Authority-Boundary Triage exceptions, separate missing evidence from risk blockers, and prepare an escalation packet.',
  '10 hours',
  'Active',
  'Pharma / Biotech / MedTech',
  'technical',
  '["Classify Advanced Biopharma Evidence Inventory and Authority-Boundary Triage exceptions by priority; identify blockers; build an escalation packet; state authority limits clearly.","Learner can classify Advanced Biopharma Evidence Inventory and Authority-Boundary Triage exceptions, separate missing evidence from risk blockers, and prepare an escalation packet.","Create Advanced Biopharma Evidence Inventory and Authority-Boundary Triage exception escalation packet","Assess evidence using: Exception priority; blocker clarity; attachment gap evidence; escalation logic; role-boundary discipline."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L3: Exception Escalation and Blocker Handling - CAP-007
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-007-L3' LIMIT 1),
  'L3: Exception Escalation and Blocker Handling - CAP-007',
  'A problem has moved beyond routine checking. The Advanced Biopharma Evidence Inventory and Authority-Boundary Triage evidence pack has missing attachments and a possible timeline risk. You sort 16 evidence entries into clean, unclear, missing, and escalation-needed groups, then prepare a packet that explains the 2 blockers. Required data: Advanced Biopharma Evidence Inventory and Authority-Boundary Triage exception case file; 16 evidence entries; 5 missing or weak attachments; 3 priority labels; 2 unresolved blockers; escalation-note template.',
  1,
  '["Pharma / Biotech / MedTech","Advanced Biopharma Evidence Inventory and Boundary Triage","D-002","CAP-007","L3","Cognitive; Behavioural; Compliance; Evidence; Communication"]'::jsonb,
  '["Scenario Review","Evidence Check","Artifact Build","AI Coaching","Human Review","Retry and Improve","Portfolio Submission"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Advanced Biopharma Evidence Inventory and Authority-Boundary Triage exception escalation packet Practice
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-007-L3' LIMIT 1)
   AND title = 'L3: Exception Escalation and Blocker Handling - CAP-007' LIMIT 1),
  'Advanced Biopharma Evidence Inventory and Authority-Boundary Triage exception escalation packet Practice',
  'Complete the Advanced Biopharma Evidence Inventory and Authority-Boundary Triage exception escalation packet using the provided actuals and explain the evidence decision in simple workplace language.',
  'Workplace scenario: A problem has moved beyond routine checking. The Advanced Biopharma Evidence Inventory and Authority-Boundary Triage evidence pack has missing attachments and a possible timeline risk. You sort 16 evidence entries into clean, unclear, missing, and escalation-needed groups, then prepare a packet that explains the 2 blockers. Major concepts: Advanced Biopharma Evidence Inventory and Authority-Boundary Triage exception triage; blocker classification; evidence sufficiency; risk-priority sorting; escalation note structure; authority-safe handoff. Artifact structure: Sections: exception summary; affected evidence items; missing attachments; risk priority; blocker owner; escalation recommendation; authority limit. Evidence to assess: Exception priority; blocker clarity; attachment gap evidence; escalation logic; role-boundary discipline. AI support: Use AI to challenge escalation logic and role-boundary wording, not to decide final risk or approval.',
  1,
  '150 minutes',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Pharm
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-007-L3' LIMIT 1),
  'B.Pharm',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Pharm Pharmaceutical Biotechnology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-007-L3' LIMIT 1),
  'M.Pharm Pharmaceutical Biotechnology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Biotechnology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-007-L3' LIMIT 1),
  'B.Sc Biotechnology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Sc Biotechnology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-007-L3' LIMIT 1),
  'M.Sc Biotechnology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech Biotechnology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-007-L3' LIMIT 1),
  'B.Tech Biotechnology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Clinical Trial Startup Records and Monitoring Action Evidence Control - Exception Escalation and Blocker Handling
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Clinical Trial Startup Records and Monitoring Action Evidence Control - Exception Escalation and Blocker Handling',
  'COURSE-CAP-008-L3',
  'An exception appears in the Clinical Trial Startup Records and Monitoring Action Evidence Control evidence flow. Out of 16 evidence entries, 5 attachments are weak or missing, 2 blockers remain unresolved, and the learner must decide what needs escalation without taking approval authority. Course objective: Classify Clinical Trial Startup Records and Monitoring Action Evidence Control exceptions by priority; identify blockers; build an escalation packet; state authority limits clearly. Learner outcome: Learner can classify Clinical Trial Startup Records and Monitoring Action Evidence Control exceptions, separate missing evidence from risk blockers, and prepare an escalation packet.',
  '10 hours',
  'Active',
  'Pharma / Biotech / MedTech',
  'technical',
  '["Classify Clinical Trial Startup Records and Monitoring Action Evidence Control exceptions by priority; identify blockers; build an escalation packet; state authority limits clearly.","Learner can classify Clinical Trial Startup Records and Monitoring Action Evidence Control exceptions, separate missing evidence from risk blockers, and prepare an escalation packet.","Create Clinical Trial Startup Records and Monitoring Action Evidence Control exception escalation packet","Assess evidence using: Exception priority; blocker clarity; attachment gap evidence; escalation logic; role-boundary discipline."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L3: Exception Escalation and Blocker Handling - CAP-008
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-008-L3' LIMIT 1),
  'L3: Exception Escalation and Blocker Handling - CAP-008',
  'A problem has moved beyond routine checking. The Clinical Trial Startup Records and Monitoring Action Evidence Control evidence pack has missing attachments and a possible timeline risk. You sort 16 evidence entries into clean, unclear, missing, and escalation-needed groups, then prepare a packet that explains the 2 blockers. Required data: Clinical Trial Startup Records and Monitoring Action Evidence Control exception case file; 16 evidence entries; 5 missing or weak attachments; 3 priority labels; 2 unresolved blockers; escalation-note template.',
  1,
  '["Pharma / Biotech / MedTech","Clinical Operations and Trial Startup Support","D-003","CAP-008","L3","Cognitive; Behavioural; Compliance; Evidence; Communication"]'::jsonb,
  '["Scenario Review","Evidence Check","Artifact Build","AI Coaching","Human Review","Retry and Improve","Portfolio Submission"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Clinical Trial Startup Records and Monitoring Action Evidence Control exception escalation packet Practice
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-008-L3' LIMIT 1)
   AND title = 'L3: Exception Escalation and Blocker Handling - CAP-008' LIMIT 1),
  'Clinical Trial Startup Records and Monitoring Action Evidence Control exception escalation packet Practice',
  'Complete the Clinical Trial Startup Records and Monitoring Action Evidence Control exception escalation packet using the provided actuals and explain the evidence decision in simple workplace language.',
  'Workplace scenario: A problem has moved beyond routine checking. The Clinical Trial Startup Records and Monitoring Action Evidence Control evidence pack has missing attachments and a possible timeline risk. You sort 16 evidence entries into clean, unclear, missing, and escalation-needed groups, then prepare a packet that explains the 2 blockers. Major concepts: Clinical Trial Startup Records and Monitoring Action Evidence Control exception triage; blocker classification; evidence sufficiency; risk-priority sorting; escalation note structure; authority-safe handoff. Artifact structure: Sections: exception summary; affected evidence items; missing attachments; risk priority; blocker owner; escalation recommendation; authority limit. Evidence to assess: Exception priority; blocker clarity; attachment gap evidence; escalation logic; role-boundary discipline. AI support: Use AI to challenge escalation logic and role-boundary wording, not to decide final risk or approval.',
  1,
  '150 minutes',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Pharm
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-008-L3' LIMIT 1),
  'B.Pharm',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: Pharm.D
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-008-L3' LIMIT 1),
  'Pharm.D',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Clinical Research
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-008-L3' LIMIT 1),
  'B.Sc Clinical Research',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Sc Clinical Research
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-008-L3' LIMIT 1),
  'M.Sc Clinical Research',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Life Sciences
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-008-L3' LIMIT 1),
  'B.Sc Life Sciences',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Pharmacovigilance ICSR and Safety Evidence Handling - Exception Escalation and Blocker Handling
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Pharmacovigilance ICSR and Safety Evidence Handling - Exception Escalation and Blocker Handling',
  'COURSE-CAP-009-L3',
  'An exception appears in the Pharmacovigilance ICSR and Safety Evidence Handling evidence flow. Out of 16 evidence entries, 5 attachments are weak or missing, 2 blockers remain unresolved, and the learner must decide what needs escalation without taking approval authority. Course objective: Classify Pharmacovigilance ICSR and Safety Evidence Handling exceptions by priority; identify blockers; build an escalation packet; state authority limits clearly. Learner outcome: Learner can classify Pharmacovigilance ICSR and Safety Evidence Handling exceptions, separate missing evidence from risk blockers, and prepare an escalation packet.',
  '10 hours',
  'Active',
  'Pharma / Biotech / MedTech',
  'technical',
  '["Classify Pharmacovigilance ICSR and Safety Evidence Handling exceptions by priority; identify blockers; build an escalation packet; state authority limits clearly.","Learner can classify Pharmacovigilance ICSR and Safety Evidence Handling exceptions, separate missing evidence from risk blockers, and prepare an escalation packet.","Create Pharmacovigilance ICSR and Safety Evidence Handling exception escalation packet","Assess evidence using: Exception priority; blocker clarity; attachment gap evidence; escalation logic; role-boundary discipline."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L3: Exception Escalation and Blocker Handling - CAP-009
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-009-L3' LIMIT 1),
  'L3: Exception Escalation and Blocker Handling - CAP-009',
  'A problem has moved beyond routine checking. The Pharmacovigilance ICSR and Safety Evidence Handling evidence pack has missing attachments and a possible timeline risk. You sort 16 evidence entries into clean, unclear, missing, and escalation-needed groups, then prepare a packet that explains the 2 blockers. Required data: Pharmacovigilance ICSR and Safety Evidence Handling exception case file; 16 evidence entries; 5 missing or weak attachments; 3 priority labels; 2 unresolved blockers; escalation-note template.',
  1,
  '["Pharma / Biotech / MedTech","Pharmacovigilance and Medical Safety Evidence Operations","D-003","CAP-009","L3","Cognitive; Behavioural; Compliance; Evidence; Communication"]'::jsonb,
  '["Scenario Review","Evidence Check","Artifact Build","AI Coaching","Human Review","Retry and Improve","Portfolio Submission"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Pharmacovigilance ICSR and Safety Evidence Handling exception escalation packet Practice
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-009-L3' LIMIT 1)
   AND title = 'L3: Exception Escalation and Blocker Handling - CAP-009' LIMIT 1),
  'Pharmacovigilance ICSR and Safety Evidence Handling exception escalation packet Practice',
  'Complete the Pharmacovigilance ICSR and Safety Evidence Handling exception escalation packet using the provided actuals and explain the evidence decision in simple workplace language.',
  'Workplace scenario: A problem has moved beyond routine checking. The Pharmacovigilance ICSR and Safety Evidence Handling evidence pack has missing attachments and a possible timeline risk. You sort 16 evidence entries into clean, unclear, missing, and escalation-needed groups, then prepare a packet that explains the 2 blockers. Major concepts: Pharmacovigilance ICSR and Safety Evidence Handling exception triage; blocker classification; evidence sufficiency; risk-priority sorting; escalation note structure; authority-safe handoff. Artifact structure: Sections: exception summary; affected evidence items; missing attachments; risk priority; blocker owner; escalation recommendation; authority limit. Evidence to assess: Exception priority; blocker clarity; attachment gap evidence; escalation logic; role-boundary discipline. AI support: Use AI to challenge escalation logic and role-boundary wording, not to decide final risk or approval.',
  1,
  '150 minutes',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Pharm
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-009-L3' LIMIT 1),
  'B.Pharm',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: Pharm.D
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-009-L3' LIMIT 1),
  'Pharm.D',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Pharm Pharmacology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-009-L3' LIMIT 1),
  'M.Pharm Pharmacology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Life Sciences
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-009-L3' LIMIT 1),
  'B.Sc Life Sciences',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Sc Pharmacology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-009-L3' LIMIT 1),
  'M.Sc Pharmacology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Clinical Dataset Mapping, Query Reconciliation and Data-Lock Packet Control - - Exception Escalation and Blocker Handling
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Clinical Dataset Mapping, Query Reconciliation and Data-Lock Packet Control - - Exception Escalation and Blocker Handling',
  'COURSE-CAP-010-L3',
  'An exception appears in the Clinical Dataset Mapping, Query Reconciliation and Data-Lock Packet Control - evidence flow. Out of 16 evidence entries, 5 attachments are weak or missing, 2 blockers remain unresolved, and the learner must decide what needs escalation without taking approval authority. Course objective: Classify Clinical Dataset Mapping, Query Reconciliation and Data-Lock Packet Control - exceptions by priority; identify blockers; build an escalation packet; state authority limits clearly. Learner outcome: Learner can classify Clinical Dataset Mapping, Query Reconciliation and Data-Lock Packet Control - exceptions, separate missing evidence from risk blockers, and prepare an escalation packet.',
  '10 hours',
  'Active',
  'Pharma / Biotech / MedTech',
  'technical',
  '["Classify Clinical Dataset Mapping, Query Reconciliation and Data-Lock Packet Control - exceptions by priority; identify blockers; build an escalation packet; state authority limits clearly.","Learner can classify Clinical Dataset Mapping, Query Reconciliation and Data-Lock Packet Control - exceptions, separate missing evidence from risk blockers, and prepare an escalation packet.","Create Clinical Dataset Mapping, Query Reconciliation and Data-Lock Packet Control - exception escalation packet","Assess evidence using: Exception priority; blocker clarity; attachment gap evidence; escalation logic; role-boundary discipline."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L3: Exception Escalation and Blocker Handling - CAP-010
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-010-L3' LIMIT 1),
  'L3: Exception Escalation and Blocker Handling - CAP-010',
  'A problem has moved beyond routine checking. The Clinical Dataset Mapping, Query Reconciliation and Data-Lock Packet Control - evidence pack has missing attachments and a possible timeline risk. You sort 16 evidence entries into clean, unclear, missing, and escalation-needed groups, then prepare a packet that explains the 2 blockers. Required data: Clinical Dataset Mapping, Query Reconciliation and Data-Lock Packet Control - exception case file; 16 evidence entries; 5 missing or weak attachments; 3 priority labels; 2 unresolved blockers; escalation-note template.',
  1,
  '["Pharma / Biotech / MedTech","Clinical Documentation and Data Services Support","D-003","CAP-010","L3","Cognitive; Behavioural; Compliance; Evidence; Communication"]'::jsonb,
  '["Scenario Review","Evidence Check","Artifact Build","AI Coaching","Human Review","Retry and Improve","Portfolio Submission"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Clinical Dataset Mapping, Query Reconciliation and Data-Lock Packet Control - exception escalation packet Practice
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-010-L3' LIMIT 1)
   AND title = 'L3: Exception Escalation and Blocker Handling - CAP-010' LIMIT 1),
  'Clinical Dataset Mapping, Query Reconciliation and Data-Lock Packet Control - exception escalation packet Practice',
  'Complete the Clinical Dataset Mapping, Query Reconciliation and Data-Lock Packet Control - exception escalation packet using the provided actuals and explain the evidence decision in simple workplace language.',
  'Workplace scenario: A problem has moved beyond routine checking. The Clinical Dataset Mapping, Query Reconciliation and Data-Lock Packet Control - evidence pack has missing attachments and a possible timeline risk. You sort 16 evidence entries into clean, unclear, missing, and escalation-needed groups, then prepare a packet that explains the 2 blockers. Major concepts: Clinical Dataset Mapping, Query Reconciliation and Data-Lock Packet Control - exception triage; blocker classification; evidence sufficiency; risk-priority sorting; escalation note structure; authority-safe handoff. Artifact structure: Sections: exception summary; affected evidence items; missing attachments; risk priority; blocker owner; escalation recommendation; authority limit. Evidence to assess: Exception priority; blocker clarity; attachment gap evidence; escalation logic; role-boundary discipline. AI support: Use AI to challenge escalation logic and role-boundary wording, not to decide final risk or approval.',
  1,
  '150 minutes',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Pharm
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-010-L3' LIMIT 1),
  'B.Pharm',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Clinical Research
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-010-L3' LIMIT 1),
  'B.Sc Clinical Research',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Statistics
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-010-L3' LIMIT 1),
  'B.Sc Statistics',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Life Sciences
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-010-L3' LIMIT 1),
  'B.Sc Life Sciences',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Sc Clinical Data Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-010-L3' LIMIT 1),
  'M.Sc Clinical Data Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: NGS Run QC, Variant Calling and Genomics Reporting - Exception Escalation and Blocker Handling
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'NGS Run QC, Variant Calling and Genomics Reporting - Exception Escalation and Blocker Handling',
  'COURSE-CAP-011-L3',
  'An exception appears in the NGS Run QC, Variant Calling and Genomics Reporting evidence flow. Out of 16 evidence entries, 5 attachments are weak or missing, 2 blockers remain unresolved, and the learner must decide what needs escalation without taking approval authority. Course objective: Classify NGS Run QC, Variant Calling and Genomics Reporting exceptions by priority; identify blockers; build an escalation packet; state authority limits clearly. Learner outcome: Learner can classify NGS Run QC, Variant Calling and Genomics Reporting exceptions, separate missing evidence from risk blockers, and prepare an escalation packet.',
  '10 hours',
  'Active',
  'Pharma / Biotech / MedTech',
  'technical',
  '["Classify NGS Run QC, Variant Calling and Genomics Reporting exceptions by priority; identify blockers; build an escalation packet; state authority limits clearly.","Learner can classify NGS Run QC, Variant Calling and Genomics Reporting exceptions, separate missing evidence from risk blockers, and prepare an escalation packet.","Create NGS Run QC, Variant Calling and Genomics Reporting exception escalation packet","Assess evidence using: Exception priority; blocker clarity; attachment gap evidence; escalation logic; role-boundary discipline."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L3: Exception Escalation and Blocker Handling - CAP-011
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-011-L3' LIMIT 1),
  'L3: Exception Escalation and Blocker Handling - CAP-011',
  'A problem has moved beyond routine checking. The NGS Run QC, Variant Calling and Genomics Reporting evidence pack has missing attachments and a possible timeline risk. You sort 16 evidence entries into clean, unclear, missing, and escalation-needed groups, then prepare a packet that explains the 2 blockers. Required data: NGS Run QC, Variant Calling and Genomics Reporting exception case file; 16 evidence entries; 5 missing or weak attachments; 3 priority labels; 2 unresolved blockers; escalation-note template.',
  1,
  '["Pharma / Biotech / MedTech","Bioinformatics and Genomics Analysis Services","D-004","CAP-011","L3","Cognitive; Behavioural; Compliance; Evidence; Communication"]'::jsonb,
  '["Scenario Review","Evidence Check","Artifact Build","AI Coaching","Human Review","Retry and Improve","Portfolio Submission"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: NGS Run QC, Variant Calling and Genomics Reporting exception escalation packet Practice
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-011-L3' LIMIT 1)
   AND title = 'L3: Exception Escalation and Blocker Handling - CAP-011' LIMIT 1),
  'NGS Run QC, Variant Calling and Genomics Reporting exception escalation packet Practice',
  'Complete the NGS Run QC, Variant Calling and Genomics Reporting exception escalation packet using the provided actuals and explain the evidence decision in simple workplace language.',
  'Workplace scenario: A problem has moved beyond routine checking. The NGS Run QC, Variant Calling and Genomics Reporting evidence pack has missing attachments and a possible timeline risk. You sort 16 evidence entries into clean, unclear, missing, and escalation-needed groups, then prepare a packet that explains the 2 blockers. Major concepts: NGS Run QC, Variant Calling and Genomics Reporting exception triage; blocker classification; evidence sufficiency; risk-priority sorting; escalation note structure; authority-safe handoff. Artifact structure: Sections: exception summary; affected evidence items; missing attachments; risk priority; blocker owner; escalation recommendation; authority limit. Evidence to assess: Exception priority; blocker clarity; attachment gap evidence; escalation logic; role-boundary discipline. AI support: Use AI to challenge escalation logic and role-boundary wording, not to decide final risk or approval.',
  1,
  '150 minutes',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Bioinformatics
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-011-L3' LIMIT 1),
  'B.Sc Bioinformatics',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Sc Bioinformatics
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-011-L3' LIMIT 1),
  'M.Sc Bioinformatics',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech Biotechnology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-011-L3' LIMIT 1),
  'B.Tech Biotechnology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Biotechnology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-011-L3' LIMIT 1),
  'B.Sc Biotechnology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Sc Genomics
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-011-L3' LIMIT 1),
  'M.Sc Genomics',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Bioservices Sample Result, Assay Run and Research Tool Lot Evidence Control - - Exception Escalation and Blocker Handling
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Bioservices Sample Result, Assay Run and Research Tool Lot Evidence Control - - Exception Escalation and Blocker Handling',
  'COURSE-CAP-012-L3',
  'An exception appears in the Bioservices Sample Result, Assay Run and Research Tool Lot Evidence Control - evidence flow. Out of 16 evidence entries, 5 attachments are weak or missing, 2 blockers remain unresolved, and the learner must decide what needs escalation without taking approval authority. Course objective: Classify Bioservices Sample Result, Assay Run and Research Tool Lot Evidence Control - exceptions by priority; identify blockers; build an escalation packet; state authority limits clearly. Learner outcome: Learner can classify Bioservices Sample Result, Assay Run and Research Tool Lot Evidence Control - exceptions, separate missing evidence from risk blockers, and prepare an escalation packet.',
  '10 hours',
  'Active',
  'Pharma / Biotech / MedTech',
  'technical',
  '["Classify Bioservices Sample Result, Assay Run and Research Tool Lot Evidence Control - exceptions by priority; identify blockers; build an escalation packet; state authority limits clearly.","Learner can classify Bioservices Sample Result, Assay Run and Research Tool Lot Evidence Control - exceptions, separate missing evidence from risk blockers, and prepare an escalation packet.","Create Bioservices Sample Result, Assay Run and Research Tool Lot Evidence Control - exception escalation packet","Assess evidence using: Exception priority; blocker clarity; attachment gap evidence; escalation logic; role-boundary discipline."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L3: Exception Escalation and Blocker Handling - CAP-012
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-012-L3' LIMIT 1),
  'L3: Exception Escalation and Blocker Handling - CAP-012',
  'A problem has moved beyond routine checking. The Bioservices Sample Result, Assay Run and Research Tool Lot Evidence Control - evidence pack has missing attachments and a possible timeline risk. You sort 16 evidence entries into clean, unclear, missing, and escalation-needed groups, then prepare a packet that explains the 2 blockers. Required data: Bioservices Sample Result, Assay Run and Research Tool Lot Evidence Control - exception case file; 16 evidence entries; 5 missing or weak attachments; 3 priority labels; 2 unresolved blockers; escalation-note template.',
  1,
  '["Pharma / Biotech / MedTech","Wet-Lab Bioservices and Research Tool Support","D-004","CAP-012","L3","Cognitive; Behavioural; Compliance; Evidence; Communication"]'::jsonb,
  '["Scenario Review","Evidence Check","Artifact Build","AI Coaching","Human Review","Retry and Improve","Portfolio Submission"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Bioservices Sample Result, Assay Run and Research Tool Lot Evidence Control - exception escalation packet Practice
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-012-L3' LIMIT 1)
   AND title = 'L3: Exception Escalation and Blocker Handling - CAP-012' LIMIT 1),
  'Bioservices Sample Result, Assay Run and Research Tool Lot Evidence Control - exception escalation packet Practice',
  'Complete the Bioservices Sample Result, Assay Run and Research Tool Lot Evidence Control - exception escalation packet using the provided actuals and explain the evidence decision in simple workplace language.',
  'Workplace scenario: A problem has moved beyond routine checking. The Bioservices Sample Result, Assay Run and Research Tool Lot Evidence Control - evidence pack has missing attachments and a possible timeline risk. You sort 16 evidence entries into clean, unclear, missing, and escalation-needed groups, then prepare a packet that explains the 2 blockers. Major concepts: Bioservices Sample Result, Assay Run and Research Tool Lot Evidence Control - exception triage; blocker classification; evidence sufficiency; risk-priority sorting; escalation note structure; authority-safe handoff. Artifact structure: Sections: exception summary; affected evidence items; missing attachments; risk priority; blocker owner; escalation recommendation; authority limit. Evidence to assess: Exception priority; blocker clarity; attachment gap evidence; escalation logic; role-boundary discipline. AI support: Use AI to challenge escalation logic and role-boundary wording, not to decide final risk or approval.',
  1,
  '150 minutes',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Biotechnology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-012-L3' LIMIT 1),
  'B.Sc Biotechnology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Sc Biotechnology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-012-L3' LIMIT 1),
  'M.Sc Biotechnology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Microbiology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-012-L3' LIMIT 1),
  'B.Sc Microbiology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Sc Biochemistry
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-012-L3' LIMIT 1),
  'M.Sc Biochemistry',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Life Sciences
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-012-L3' LIMIT 1),
  'B.Sc Life Sciences',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Biofoundry DBTL Cycle Evidence Execution - Exception Escalation and Blocker Handling
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Biofoundry DBTL Cycle Evidence Execution - Exception Escalation and Blocker Handling',
  'COURSE-CAP-013-L3',
  'An exception appears in the Biofoundry DBTL Cycle Evidence Execution evidence flow. Out of 16 evidence entries, 5 attachments are weak or missing, 2 blockers remain unresolved, and the learner must decide what needs escalation without taking approval authority. Course objective: Classify Biofoundry DBTL Cycle Evidence Execution exceptions by priority; identify blockers; build an escalation packet; state authority limits clearly. Learner outcome: Learner can classify Biofoundry DBTL Cycle Evidence Execution exceptions, separate missing evidence from risk blockers, and prepare an escalation packet.',
  '10 hours',
  'Active',
  'Pharma / Biotech / MedTech',
  'technical',
  '["Classify Biofoundry DBTL Cycle Evidence Execution exceptions by priority; identify blockers; build an escalation packet; state authority limits clearly.","Learner can classify Biofoundry DBTL Cycle Evidence Execution exceptions, separate missing evidence from risk blockers, and prepare an escalation packet.","Create Biofoundry DBTL Cycle Evidence Execution exception escalation packet","Assess evidence using: Exception priority; blocker clarity; attachment gap evidence; escalation logic; role-boundary discipline."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L3: Exception Escalation and Blocker Handling - CAP-013
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-013-L3' LIMIT 1),
  'L3: Exception Escalation and Blocker Handling - CAP-013',
  'A problem has moved beyond routine checking. The Biofoundry DBTL Cycle Evidence Execution evidence pack has missing attachments and a possible timeline risk. You sort 16 evidence entries into clean, unclear, missing, and escalation-needed groups, then prepare a packet that explains the 2 blockers. Required data: Biofoundry DBTL Cycle Evidence Execution exception case file; 16 evidence entries; 5 missing or weak attachments; 3 priority labels; 2 unresolved blockers; escalation-note template.',
  1,
  '["Pharma / Biotech / MedTech","Industrial Biomanufacturing and Biofoundry Operations","D-005","CAP-013","L3","Cognitive; Behavioural; Compliance; Evidence; Communication"]'::jsonb,
  '["Scenario Review","Evidence Check","Artifact Build","AI Coaching","Human Review","Retry and Improve","Portfolio Submission"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Biofoundry DBTL Cycle Evidence Execution exception escalation packet Practice
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-013-L3' LIMIT 1)
   AND title = 'L3: Exception Escalation and Blocker Handling - CAP-013' LIMIT 1),
  'Biofoundry DBTL Cycle Evidence Execution exception escalation packet Practice',
  'Complete the Biofoundry DBTL Cycle Evidence Execution exception escalation packet using the provided actuals and explain the evidence decision in simple workplace language.',
  'Workplace scenario: A problem has moved beyond routine checking. The Biofoundry DBTL Cycle Evidence Execution evidence pack has missing attachments and a possible timeline risk. You sort 16 evidence entries into clean, unclear, missing, and escalation-needed groups, then prepare a packet that explains the 2 blockers. Major concepts: Biofoundry DBTL Cycle Evidence Execution exception triage; blocker classification; evidence sufficiency; risk-priority sorting; escalation note structure; authority-safe handoff. Artifact structure: Sections: exception summary; affected evidence items; missing attachments; risk priority; blocker owner; escalation recommendation; authority limit. Evidence to assess: Exception priority; blocker clarity; attachment gap evidence; escalation logic; role-boundary discipline. AI support: Use AI to challenge escalation logic and role-boundary wording, not to decide final risk or approval.',
  1,
  '150 minutes',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech Biotechnology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-013-L3' LIMIT 1),
  'B.Tech Biotechnology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Tech Biotechnology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-013-L3' LIMIT 1),
  'M.Tech Biotechnology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Biotechnology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-013-L3' LIMIT 1),
  'B.Sc Biotechnology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Sc Synthetic Biology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-013-L3' LIMIT 1),
  'M.Sc Synthetic Biology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Sc Industrial Biotechnology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-013-L3' LIMIT 1),
  'M.Sc Industrial Biotechnology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Industrial Bioprocess Scale-Up and Product Evidence Handoff - Exception Escalation and Blocker Handling
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Industrial Bioprocess Scale-Up and Product Evidence Handoff - Exception Escalation and Blocker Handling',
  'COURSE-CAP-014-L3',
  'An exception appears in the Industrial Bioprocess Scale-Up and Product Evidence Handoff evidence flow. Out of 16 evidence entries, 5 attachments are weak or missing, 2 blockers remain unresolved, and the learner must decide what needs escalation without taking approval authority. Course objective: Classify Industrial Bioprocess Scale-Up and Product Evidence Handoff exceptions by priority; identify blockers; build an escalation packet; state authority limits clearly. Learner outcome: Learner can classify Industrial Bioprocess Scale-Up and Product Evidence Handoff exceptions, separate missing evidence from risk blockers, and prepare an escalation packet.',
  '10 hours',
  'Active',
  'Pharma / Biotech / MedTech',
  'technical',
  '["Classify Industrial Bioprocess Scale-Up and Product Evidence Handoff exceptions by priority; identify blockers; build an escalation packet; state authority limits clearly.","Learner can classify Industrial Bioprocess Scale-Up and Product Evidence Handoff exceptions, separate missing evidence from risk blockers, and prepare an escalation packet.","Create Industrial Bioprocess Scale-Up and Product Evidence Handoff exception escalation packet","Assess evidence using: Exception priority; blocker clarity; attachment gap evidence; escalation logic; role-boundary discipline."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L3: Exception Escalation and Blocker Handling - CAP-014
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-014-L3' LIMIT 1),
  'L3: Exception Escalation and Blocker Handling - CAP-014',
  'A problem has moved beyond routine checking. The Industrial Bioprocess Scale-Up and Product Evidence Handoff evidence pack has missing attachments and a possible timeline risk. You sort 16 evidence entries into clean, unclear, missing, and escalation-needed groups, then prepare a packet that explains the 2 blockers. Required data: Industrial Bioprocess Scale-Up and Product Evidence Handoff exception case file; 16 evidence entries; 5 missing or weak attachments; 3 priority labels; 2 unresolved blockers; escalation-note template.',
  1,
  '["Pharma / Biotech / MedTech","Industrial Biomanufacturing and Biofoundry Operations","D-005","CAP-014","L3","Cognitive; Behavioural; Compliance; Evidence; Communication"]'::jsonb,
  '["Scenario Review","Evidence Check","Artifact Build","AI Coaching","Human Review","Retry and Improve","Portfolio Submission"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Industrial Bioprocess Scale-Up and Product Evidence Handoff exception escalation packet Practice
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-014-L3' LIMIT 1)
   AND title = 'L3: Exception Escalation and Blocker Handling - CAP-014' LIMIT 1),
  'Industrial Bioprocess Scale-Up and Product Evidence Handoff exception escalation packet Practice',
  'Complete the Industrial Bioprocess Scale-Up and Product Evidence Handoff exception escalation packet using the provided actuals and explain the evidence decision in simple workplace language.',
  'Workplace scenario: A problem has moved beyond routine checking. The Industrial Bioprocess Scale-Up and Product Evidence Handoff evidence pack has missing attachments and a possible timeline risk. You sort 16 evidence entries into clean, unclear, missing, and escalation-needed groups, then prepare a packet that explains the 2 blockers. Major concepts: Industrial Bioprocess Scale-Up and Product Evidence Handoff exception triage; blocker classification; evidence sufficiency; risk-priority sorting; escalation note structure; authority-safe handoff. Artifact structure: Sections: exception summary; affected evidence items; missing attachments; risk priority; blocker owner; escalation recommendation; authority limit. Evidence to assess: Exception priority; blocker clarity; attachment gap evidence; escalation logic; role-boundary discipline. AI support: Use AI to challenge escalation logic and role-boundary wording, not to decide final risk or approval.',
  1,
  '150 minutes',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech Biotechnology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-014-L3' LIMIT 1),
  'B.Tech Biotechnology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Tech Bioprocess Engineering
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-014-L3' LIMIT 1),
  'M.Tech Bioprocess Engineering',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Biotechnology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-014-L3' LIMIT 1),
  'B.Sc Biotechnology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Sc Industrial Biotechnology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-014-L3' LIMIT 1),
  'M.Sc Industrial Biotechnology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Pharm
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-014-L3' LIMIT 1),
  'B.Pharm',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Agri-Biotech Trait, Field Trial and Stewardship Evidence Packet Control - Exception Escalation and Blocker Handling
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Agri-Biotech Trait, Field Trial and Stewardship Evidence Packet Control - Exception Escalation and Blocker Handling',
  'COURSE-CAP-015-L3',
  'An exception appears in the Agri-Biotech Trait, Field Trial and Stewardship Evidence Packet Control evidence flow. Out of 16 evidence entries, 5 attachments are weak or missing, 2 blockers remain unresolved, and the learner must decide what needs escalation without taking approval authority. Course objective: Classify Agri-Biotech Trait, Field Trial and Stewardship Evidence Packet Control exceptions by priority; identify blockers; build an escalation packet; state authority limits clearly. Learner outcome: Learner can classify Agri-Biotech Trait, Field Trial and Stewardship Evidence Packet Control exceptions, separate missing evidence from risk blockers, and prepare an escalation packet.',
  '10 hours',
  'Active',
  'Pharma / Biotech / MedTech',
  'technical',
  '["Classify Agri-Biotech Trait, Field Trial and Stewardship Evidence Packet Control exceptions by priority; identify blockers; build an escalation packet; state authority limits clearly.","Learner can classify Agri-Biotech Trait, Field Trial and Stewardship Evidence Packet Control exceptions, separate missing evidence from risk blockers, and prepare an escalation packet.","Create Agri-Biotech Trait, Field Trial and Stewardship Evidence Packet Control exception escalation packet","Assess evidence using: Exception priority; blocker clarity; attachment gap evidence; escalation logic; role-boundary discipline."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L3: Exception Escalation and Blocker Handling - CAP-015
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-015-L3' LIMIT 1),
  'L3: Exception Escalation and Blocker Handling - CAP-015',
  'A problem has moved beyond routine checking. The Agri-Biotech Trait, Field Trial and Stewardship Evidence Packet Control evidence pack has missing attachments and a possible timeline risk. You sort 16 evidence entries into clean, unclear, missing, and escalation-needed groups, then prepare a packet that explains the 2 blockers. Required data: Agri-Biotech Trait, Field Trial and Stewardship Evidence Packet Control exception case file; 16 evidence entries; 5 missing or weak attachments; 3 priority labels; 2 unresolved blockers; escalation-note template.',
  1,
  '["Pharma / Biotech / MedTech","Agri-Biotech and Seed Biotechnology Affairs","D-006","CAP-015","L3","Cognitive; Behavioural; Compliance; Evidence; Communication"]'::jsonb,
  '["Scenario Review","Evidence Check","Artifact Build","AI Coaching","Human Review","Retry and Improve","Portfolio Submission"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Agri-Biotech Trait, Field Trial and Stewardship Evidence Packet Control exception escalation packet Practice
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-015-L3' LIMIT 1)
   AND title = 'L3: Exception Escalation and Blocker Handling - CAP-015' LIMIT 1),
  'Agri-Biotech Trait, Field Trial and Stewardship Evidence Packet Control exception escalation packet Practice',
  'Complete the Agri-Biotech Trait, Field Trial and Stewardship Evidence Packet Control exception escalation packet using the provided actuals and explain the evidence decision in simple workplace language.',
  'Workplace scenario: A problem has moved beyond routine checking. The Agri-Biotech Trait, Field Trial and Stewardship Evidence Packet Control evidence pack has missing attachments and a possible timeline risk. You sort 16 evidence entries into clean, unclear, missing, and escalation-needed groups, then prepare a packet that explains the 2 blockers. Major concepts: Agri-Biotech Trait, Field Trial and Stewardship Evidence Packet Control exception triage; blocker classification; evidence sufficiency; risk-priority sorting; escalation note structure; authority-safe handoff. Artifact structure: Sections: exception summary; affected evidence items; missing attachments; risk priority; blocker owner; escalation recommendation; authority limit. Evidence to assess: Exception priority; blocker clarity; attachment gap evidence; escalation logic; role-boundary discipline. AI support: Use AI to challenge escalation logic and role-boundary wording, not to decide final risk or approval.',
  1,
  '150 minutes',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Agriculture
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-015-L3' LIMIT 1),
  'B.Sc Agriculture',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Sc Plant Biotechnology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-015-L3' LIMIT 1),
  'M.Sc Plant Biotechnology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Biotechnology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-015-L3' LIMIT 1),
  'B.Sc Biotechnology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Sc Genetics and Plant Breeding
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-015-L3' LIMIT 1),
  'M.Sc Genetics and Plant Breeding',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech Biotechnology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-CAP-015-L3' LIMIT 1),
  'B.Tech Biotechnology',
  NOW()
) ON CONFLICT DO NOTHING;

COMMIT;

-- ============================================
-- COURSE SEED — part 08 of 10
-- Courses 351–400 of 485
-- Paste this whole file into the Supabase SQL editor and Run.
-- Safe to re-run (ON CONFLICT DO NOTHING). Run parts in order.
-- ============================================

BEGIN;

-- Insert Course: Temporary Assignment Change Decision: Guided Practice
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Temporary Assignment Change Decision: Guided Practice',
  'IND-S5-C-026',
  'Learner can complete guided check with supervisor review for Temporary Assignment Extension, Replacement, Or Closure and produce a reviewer-ready Temporary Assignment Change Decision Log with clear evidence and handoff logic. Workplace scenario: A staffing consultant is handling 13 temporary assignment change decision records in assignment tracker, client change request, worker contract terms and payroll impact sheet. The file is messy: 3 records have assignment extension not approved, 2 have rate change not reflected, 1 have worker availability conflicts with new shift, and some cases also show client change request lacks effective date. The team needs a safe first check same working day so the reviewer does not waste time on incomplete evidence. The learner must check required inputs, mark missing items, prepare a supervised draft, and request reviewer guidance, then prepare a Temporary Assignment Change Decision Log, and clearly mark which items are ready, returned, blocked, or escalated. If handled poorly, worker pay, client billing, or assignment legality may become incorrect. Artifact proof: Temporary Assignment Change Decision Log. Competency taxonomy: Functional; Technical; Behavioural; Cognitive; Evidence.',
  '8 hours',
  'Active',
  'Staffing Operations',
  'technical',
  '["Learner can complete guided check with supervisor review for Temporary Assignment Extension, Replacement, Or Closure and produce a reviewer-ready Temporary Assignment Change Decision Log with clear evidence and handoff logic.","Create a reviewer-ready Temporary Assignment Change Decision Log.","Use source data to resolve the skill gap: Learner must convert temporary assignment change decision knowledge into a usable Temporary Assignment Change Decision Log: check extension/replacement/closure request, client approval, worker availability, rate/date changes, identify missing or conflicting records, explain the level boundary, and create a reviewer-ready handoff.","Explain evidence and consequence through the Temporary Assignment Change Decision Log."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: Module 1: Temporary Assignment Change Decision Log Workplace Build
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-026' LIMIT 1),
  'Module 1: Temporary Assignment Change Decision Log Workplace Build',
  'Trigger: A staffing consultant receives 13 temporary assignment change decision records in assignment tracker, client change request, worker contract terms and payroll impact sheet; 3 show assignment extension not approved, 2 show rate change not reflected, and 1 show worker availability conflicts with new shift. Pressure: The team needs a safe first check same working day so the reviewer does not waste time on incomplete evidence. Actuals: Volume: 13 records/cases. Issue count 1: 3 with assignment extension not approved. Issue count 2: 2 with rate change not reflected. Issue count 3: 1 with worker availability conflicts with new shift. Systems/documents: assignment tracker, client change request, worker contract terms and payroll impact sheet. Decision needed: ready, return, block, or escalate. Time pressure: same working day.',
  1,
  '["HR & Workforce Services","Staffing Operations","Staffing & Workforce Fulfillment Coordinators; Employer-of-Record & Global Employment Operations Specialists","Staffing Consultant; Workforce Fulfillment Coordinator; Managed HR Service Specialist; Recruitment Coordinator; EOR Operations Specialist","IND-CAP-06","Temporary Assignment Change Decision Log","Functional","Technical","Behavioural","Cognitive","Evidence"]'::jsonb,
  '["Start with the live trigger: 13 records arrive, 6 have visible issues, and a stakeholder needs an answer same working day.","Learner studies the actual data points: extension/replacement/closure request, client approval, worker availability, rate/date changes, impact note, closure or continuation decision; then highlights missing fields, conflicts, late inputs, and owner gaps.","Teach the artifact logic: what each section means, which evidence is mandatory, what numbers must reconcile, and what the learner is allowed to decide at L1.","Learner completes the Temporary Assignment Change Decision Log using the case numbers, source references, exception labels, owner notes, and a clear ready/return/block/escalate recommendation.","Learner uses AI only for checklist prompts, concept reminders, and rubric self-checks. AI must not invent records, calculate unsupported numbers, approve decisions, or replace the learner''s judgement.","Learner reflects on what changed at L1: volume, exception complexity, stakeholder pressure, authority boundary, and evidence quality compared with the previous level."]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Temporary Assignment Change Decision: Guided Practice: Data, Concepts and Artifact Evidence
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-026' LIMIT 1)
   AND title = 'Module 1: Temporary Assignment Change Decision Log Workplace Build' LIMIT 1),
  'Temporary Assignment Change Decision: Guided Practice: Data, Concepts and Artifact Evidence',
  'Learner confusion: Students may understand the HR term but may not know how to read 13 messy records, compare source fields, quantify exceptions, choose proceed/return/escalate, or write the evidence trail in simple reviewer language. Root-cause focus: Investigate whether the real cause is missing source data, wrong effective date, unclear owner, system mismatch, late submission, policy/control risk, or weak handoff evidence in assignment tracker, client change request, worker contract terms and payroll impact sheet.',
  'Problem: A staffing consultant is handling 13 temporary assignment change decision records in assignment tracker, client change request, worker contract terms and payroll impact sheet. The file is messy: 3 records have assignment extension not approved, 2 have rate change not reflected, 1 have worker availability conflicts with new shift, and some cases also show client change request lacks effective date. The team needs a safe first check same working day so the reviewer does not waste time on incomplete evidence. The learner must check required inputs, mark missing items, prepare a supervised draft, and request reviewer guidance, then prepare a Temporary Assignment Change Decision Log, and clearly mark which items are ready, returned, blocked, or escalated. If handled poorly, worker pay, client billing, or assignment legality may become incorrect. Actuals: Volume: 13 records/cases. Issue count 1: 3 with assignment extension not approved. Issue count 2: 2 with rate change not reflected. Issue count 3: 1 with worker availability conflicts with new shift. Systems/documents: assignment tracker, client change request, worker contract terms and payroll impact sheet. Decision needed: ready, return, block, or escalate. Time pressure: same working day. Major concepts: assignment change control - needed to complete and defend the Temporary Assignment Change Decision Log; effective-date logic - needed to complete and defend the Temporary Assignment Change Decision Log; rate and billing dependency - needed to complete and defend the Temporary Assignment Change Decision Log; worker availability impact - needed to complete and defend the Temporary Assignment Change Decision Log; contract boundary - needed to complete and defend the Temporary Assignment Change Decision Log; client approval evidence - needed to complete and defend the Temporary Assignment Change Decision Log; payroll handoff - needed to complete and defend the Temporary Assignment Change Decision Log; change decision log - needed to complete and defend the Temporary Assignment Change Decision Log Concept-to-artifact link: These concepts are not theory-only. They tell the learner what to check inside the Temporary Assignment Change Decision Log: source data, missing fields, exception rules, owner notes, decision status, handoff logic, and reviewer evidence. Required data: To solve the artifact, learner needs: extension/replacement/closure request, client approval, worker availability, rate/date changes, impact note, closure or continuation decision; system screenshots or exports from assignment tracker, client change request, worker contract terms and payroll impact sheet; policy or checklist rule used; stakeholder request; deadline/cut-off; prior status if available; reviewer or owner name; evidence of any unresolved exception. Artifact structure: Temporary Assignment Change Decision Log must contain: case or employee/candidate/worker identifier; source document reference; required data fields (extension/replacement/closure request, client approval, worker availability, rate/date changes, impact note, closure or continuation decision); missing or conflicting item log; numeric issue count; exception category; owner/action note; proceed/return/block/escalate status; reviewer handoff note; closure or follow-up date. How to read artifact: Read the artifact as the learner''s final workplace proof. First check the identifiers and source documents, then the required fields, then the issue count and exception category, then the decision status, and finally whether the handoff note gives a reviewer enough evidence to act. Evidence fields: Assess whether the Temporary Assignment Change Decision Log uses the right source data, includes all required fields, counts and labels the 6 issue records correctly, separates normal items from exceptions, gives a clear decision reason, respects the L1 authority boundary, and provides a usable reviewer handoff. AI coach boundary: AI can ask: Which source proves this field? Which 3 records are blocked? What is the decision reason? What evidence is still missing? AI can summarize checklist gaps and suggest clearer wording, but cannot create missing data, approve the case, override policy, or make the final HR/payroll/compliance decision. Traceability: Industry: HR & Workforce Services.|Domain: Staffing Operations.|Role: Staffing Consultant; Workforce Fulfillment Coordinator; Managed HR Service Specialist; Recruitment Coordinator; EOR Operations Specialist.|Capability_ID: IND-CAP-06.|Level: L1.|Course_ID: IND-S5-C-026.|Artifact: Temporary Assignment Change Decision Log.|Source Sheet: L1_COURSE_PATTERN.',
  1,
  '8 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BBA Human Resource Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-026' LIMIT 1),
  'BBA Human Resource Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MBA Human Resource Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-026' LIMIT 1),
  'MBA Human Resource Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PGDM Human Resource Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-026' LIMIT 1),
  'PGDM Human Resource Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Com
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-026' LIMIT 1),
  'B.Com',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BA Industrial Relations
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-026' LIMIT 1),
  'BA Industrial Relations',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: EOR Worker Setup Compliance: Guided Practice
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'EOR Worker Setup Compliance: Guided Practice',
  'IND-S5-C-031',
  'Learner can complete guided check with supervisor review for Administer Eor Worker Setup From Country and produce a reviewer-ready EOR Worker Setup Compliance Pack with clear evidence and handoff logic. Workplace scenario: An EOR operations associate is handling 14 EOR worker setup compliance check records in EOR onboarding portal, country compliance checklist, worker profile, contract template and right-to-work records. The file is messy: 4 records have country-specific document missing, 3 have contract template not matched to worker location, 2 have tax identifier incomplete, and some cases also show right-to-work evidence uploaded in the wrong section. The team needs a safe first check same working day so the reviewer does not waste time on incomplete evidence. The learner must check required inputs, mark missing items, prepare a supervised draft, and request reviewer guidance, then prepare a EOR Worker Setup Compliance Pack, and clearly mark which items are ready, returned, blocked, or escalated. If handled poorly, the worker may be set up in the wrong legal configuration or onboarding may breach local requirements. Artifact proof: EOR Worker Setup Compliance Pack. Competency taxonomy: Functional; Technical; Behavioural; Cognitive; Evidence.',
  '8 hours',
  'Active',
  'EOR & Global Employment Services',
  'technical',
  '["Learner can complete guided check with supervisor review for Administer Eor Worker Setup From Country and produce a reviewer-ready EOR Worker Setup Compliance Pack with clear evidence and handoff logic.","Create a reviewer-ready EOR Worker Setup Compliance Pack.","Use source data to resolve the skill gap: Learner must convert EOR worker setup compliance check knowledge into a usable EOR Worker Setup Compliance Pack: check country eligibility checks, worker profile, contract/onboarding documents, local compliance checklist, identify missing or conflicting records, explain the level boundary, and create a reviewer-ready handoff.","Explain evidence and consequence through the EOR Worker Setup Compliance Pack."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: Module 1: EOR Worker Setup Compliance Pack Workplace Build
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-031' LIMIT 1),
  'Module 1: EOR Worker Setup Compliance Pack Workplace Build',
  'Trigger: An EOR operations associate receives 14 EOR worker setup compliance check records in EOR onboarding portal, country compliance checklist, worker profile, contract template and right-to-work records; 4 show country-specific document missing, 3 show contract template not matched to worker location, and 2 show tax identifier incomplete. Pressure: The team needs a safe first check same working day so the reviewer does not waste time on incomplete evidence. Actuals: Volume: 14 records/cases. Issue count 1: 4 with country-specific document missing. Issue count 2: 3 with contract template not matched to worker location. Issue count 3: 2 with tax identifier incomplete. Systems/documents: EOR onboarding portal, country compliance checklist, worker profile, contract template and right-to-work records. Decision needed: ready, return, block, or escalate. Time pressure: same working day.',
  1,
  '["HR & Workforce Services","EOR & Global Employment Services","Staffing & Workforce Fulfillment Coordinators; Employer-of-Record & Global Employment Operations Specialists","Staffing Consultant; Workforce Fulfillment Coordinator; Managed HR Service Specialist; Recruitment Coordinator; EOR Operations Specialist","IND-CAP-07","EOR Worker Setup Compliance Pack","Functional","Technical","Behavioural","Cognitive","Evidence"]'::jsonb,
  '["Start with the live trigger: 14 records arrive, 9 have visible issues, and a stakeholder needs an answer same working day.","Learner studies the actual data points: country eligibility checks, worker profile, contract/onboarding documents, local compliance checklist, onboarding completion evidence, escalation notes; then highlights missing fields, conflicts, late inputs, and owner gaps.","Teach the artifact logic: what each section means, which evidence is mandatory, what numbers must reconcile, and what the learner is allowed to decide at L1.","Learner completes the EOR Worker Setup Compliance Pack using the case numbers, source references, exception labels, owner notes, and a clear ready/return/block/escalate recommendation.","Learner uses AI only for checklist prompts, concept reminders, and rubric self-checks. AI must not invent records, calculate unsupported numbers, approve decisions, or replace the learner''s judgement.","Learner reflects on what changed at L1: volume, exception complexity, stakeholder pressure, authority boundary, and evidence quality compared with the previous level."]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: EOR Worker Setup Compliance: Guided Practice: Data, Concepts and Artifact Evidence
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-031' LIMIT 1)
   AND title = 'Module 1: EOR Worker Setup Compliance Pack Workplace Build' LIMIT 1),
  'EOR Worker Setup Compliance: Guided Practice: Data, Concepts and Artifact Evidence',
  'Learner confusion: Students may understand the HR term but may not know how to read 14 messy records, compare source fields, quantify exceptions, choose proceed/return/escalate, or write the evidence trail in simple reviewer language. Root-cause focus: Investigate whether the real cause is missing source data, wrong effective date, unclear owner, system mismatch, late submission, policy/control risk, or weak handoff evidence in EOR onboarding portal, country compliance checklist, worker profile, contract template and right-to-work records.',
  'Problem: An EOR operations associate is handling 14 EOR worker setup compliance check records in EOR onboarding portal, country compliance checklist, worker profile, contract template and right-to-work records. The file is messy: 4 records have country-specific document missing, 3 have contract template not matched to worker location, 2 have tax identifier incomplete, and some cases also show right-to-work evidence uploaded in the wrong section. The team needs a safe first check same working day so the reviewer does not waste time on incomplete evidence. The learner must check required inputs, mark missing items, prepare a supervised draft, and request reviewer guidance, then prepare a EOR Worker Setup Compliance Pack, and clearly mark which items are ready, returned, blocked, or escalated. If handled poorly, the worker may be set up in the wrong legal configuration or onboarding may breach local requirements. Actuals: Volume: 14 records/cases. Issue count 1: 4 with country-specific document missing. Issue count 2: 3 with contract template not matched to worker location. Issue count 3: 2 with tax identifier incomplete. Systems/documents: EOR onboarding portal, country compliance checklist, worker profile, contract template and right-to-work records. Decision needed: ready, return, block, or escalate. Time pressure: same working day. Major concepts: EOR worker setup - needed to complete and defend the EOR Worker Setup Compliance Pack; country compliance dependency - needed to complete and defend the EOR Worker Setup Compliance Pack; right-to-work evidence - needed to complete and defend the EOR Worker Setup Compliance Pack; contract-template matching - needed to complete and defend the EOR Worker Setup Compliance Pack; tax identifier validation - needed to complete and defend the EOR Worker Setup Compliance Pack; client-worker data boundary - needed to complete and defend the EOR Worker Setup Compliance Pack; onboarding cut-off control - needed to complete and defend the EOR Worker Setup Compliance Pack; compliance pack completion - needed to complete and defend the EOR Worker Setup Compliance Pack Concept-to-artifact link: These concepts are not theory-only. They tell the learner what to check inside the EOR Worker Setup Compliance Pack: source data, missing fields, exception rules, owner notes, decision status, handoff logic, and reviewer evidence. Required data: To solve the artifact, learner needs: country eligibility checks, worker profile, contract/onboarding documents, local compliance checklist, onboarding completion evidence, escalation notes; system screenshots or exports from EOR onboarding portal, country compliance checklist, worker profile, contract template and right-to-work records; policy or checklist rule used; stakeholder request; deadline/cut-off; prior status if available; reviewer or owner name; evidence of any unresolved exception. Artifact structure: EOR Worker Setup Compliance Pack must contain: case or employee/candidate/worker identifier; source document reference; required data fields (country eligibility checks, worker profile, contract/onboarding documents, local compliance checklist, onboarding completion evidence, escalation notes); missing or conflicting item log; numeric issue count; exception category; owner/action note; proceed/return/block/escalate status; reviewer handoff note; closure or follow-up date. How to read artifact: Read the artifact as the learner''s final workplace proof. First check the identifiers and source documents, then the required fields, then the issue count and exception category, then the decision status, and finally whether the handoff note gives a reviewer enough evidence to act. Evidence fields: Assess whether the EOR Worker Setup Compliance Pack uses the right source data, includes all required fields, counts and labels the 9 issue records correctly, separates normal items from exceptions, gives a clear decision reason, respects the L1 authority boundary, and provides a usable reviewer handoff. AI coach boundary: AI can ask: Which source proves this field? Which 4 records are blocked? What is the decision reason? What evidence is still missing? AI can summarize checklist gaps and suggest clearer wording, but cannot create missing data, approve the case, override policy, or make the final HR/payroll/compliance decision. Traceability: Industry: HR & Workforce Services.|Domain: EOR & Global Employment Services.|Role: Staffing Consultant; Workforce Fulfillment Coordinator; Managed HR Service Specialist; Recruitment Coordinator; EOR Operations Specialist.|Capability_ID: IND-CAP-07.|Level: L1.|Course_ID: IND-S5-C-031.|Artifact: EOR Worker Setup Compliance Pack.|Source Sheet: L1_COURSE_PATTERN.',
  1,
  '8 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BBA Human Resource Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-031' LIMIT 1),
  'BBA Human Resource Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MBA Human Resource Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-031' LIMIT 1),
  'MBA Human Resource Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Com
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-031' LIMIT 1),
  'B.Com',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Com
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-031' LIMIT 1),
  'M.Com',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: LLB / BA LLB Labour and Employment Law
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-031' LIMIT 1),
  'LLB / BA LLB Labour and Employment Law',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PGDM International Business
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-031' LIMIT 1),
  'PGDM International Business',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: EOR Payroll & Benefits Change Control: Guided Practice
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'EOR Payroll & Benefits Change Control: Guided Practice',
  'IND-S5-C-036',
  'Learner can complete guided check with supervisor review for EOR Payroll and Benefit Changes and produce a reviewer-ready EOR Payroll & Benefits Change Control Log with clear evidence and handoff logic. Workplace scenario: An EOR payroll coordinator is handling 15 EOR payroll and benefits change control records in EOR payroll platform, benefit election file, country payroll calendar and client change approval log. The file is messy: 5 records have benefit change submitted after cut-off, 2 have salary change lacks client approval, 1 have allowance amount differs from contract, and some cases also show country payroll calendar has earlier deadline. The team needs a safe first check same working day so the reviewer does not waste time on incomplete evidence. The learner must check required inputs, mark missing items, prepare a supervised draft, and request reviewer guidance, then prepare a EOR Payroll & Benefits Change Control Log, and clearly mark which items are ready, returned, blocked, or escalated. If handled poorly, the worker may be paid incorrectly or the client may face correction costs in a foreign payroll cycle. Artifact proof: EOR Payroll & Benefits Change Control Log. Competency taxonomy: Functional; Technical; Behavioural; Cognitive; Evidence.',
  '8 hours',
  'Active',
  'EOR & Global Employment Services',
  'technical',
  '["Learner can complete guided check with supervisor review for EOR Payroll and Benefit Changes and produce a reviewer-ready EOR Payroll & Benefits Change Control Log with clear evidence and handoff logic.","Create a reviewer-ready EOR Payroll & Benefits Change Control Log.","Use source data to resolve the skill gap: Learner must convert EOR payroll and benefits change control knowledge into a usable EOR Payroll & Benefits Change Control Log: check country-specific payroll change request, benefit-change evidence, effective dates, local compliance flags, identify missing or conflicting records, explain the level boundary, and create a reviewer-ready handoff.","Explain evidence and consequence through the EOR Payroll & Benefits Change Control Log."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: Module 1: EOR Payroll & Benefits Change Control Log Workplace Build
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-036' LIMIT 1),
  'Module 1: EOR Payroll & Benefits Change Control Log Workplace Build',
  'Trigger: An EOR payroll coordinator receives 15 EOR payroll and benefits change control records in EOR payroll platform, benefit election file, country payroll calendar and client change approval log; 5 show benefit change submitted after cut-off, 2 show salary change lacks client approval, and 1 show allowance amount differs from contract. Pressure: The team needs a safe first check same working day so the reviewer does not waste time on incomplete evidence. Actuals: Volume: 15 records/cases. Issue count 1: 5 with benefit change submitted after cut-off. Issue count 2: 2 with salary change lacks client approval. Issue count 3: 1 with allowance amount differs from contract. Systems/documents: EOR payroll platform, benefit election file, country payroll calendar and client change approval log. Decision needed: ready, return, block, or escalate. Time pressure: same working day.',
  1,
  '["HR & Workforce Services","EOR & Global Employment Services","Staffing & Workforce Fulfillment Coordinators; Employer-of-Record & Global Employment Operations Specialists","Staffing Consultant; Workforce Fulfillment Coordinator; Managed HR Service Specialist; Recruitment Coordinator; EOR Operations Specialist","IND-CAP-08","EOR Payroll & Benefits Change Control Log","Functional","Technical","Behavioural","Cognitive","Evidence"]'::jsonb,
  '["Start with the live trigger: 15 records arrive, 8 have visible issues, and a stakeholder needs an answer same working day.","Learner studies the actual data points: country-specific payroll change request, benefit-change evidence, effective dates, local compliance flags, payroll handoff note, approval trail; then highlights missing fields, conflicts, late inputs, and owner gaps.","Teach the artifact logic: what each section means, which evidence is mandatory, what numbers must reconcile, and what the learner is allowed to decide at L1.","Learner completes the EOR Payroll & Benefits Change Control Log using the case numbers, source references, exception labels, owner notes, and a clear ready/return/block/escalate recommendation.","Learner uses AI only for checklist prompts, concept reminders, and rubric self-checks. AI must not invent records, calculate unsupported numbers, approve decisions, or replace the learner''s judgement.","Learner reflects on what changed at L1: volume, exception complexity, stakeholder pressure, authority boundary, and evidence quality compared with the previous level."]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: EOR Payroll & Benefits Change Control: Guided Practice: Data, Concepts and Artifact Evidence
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-036' LIMIT 1)
   AND title = 'Module 1: EOR Payroll & Benefits Change Control Log Workplace Build' LIMIT 1),
  'EOR Payroll & Benefits Change Control: Guided Practice: Data, Concepts and Artifact Evidence',
  'Learner confusion: Students may understand the HR term but may not know how to read 15 messy records, compare source fields, quantify exceptions, choose proceed/return/escalate, or write the evidence trail in simple reviewer language. Root-cause focus: Investigate whether the real cause is missing source data, wrong effective date, unclear owner, system mismatch, late submission, policy/control risk, or weak handoff evidence in EOR payroll platform, benefit election file, country payroll calendar and client change approval log.',
  'Problem: An EOR payroll coordinator is handling 15 EOR payroll and benefits change control records in EOR payroll platform, benefit election file, country payroll calendar and client change approval log. The file is messy: 5 records have benefit change submitted after cut-off, 2 have salary change lacks client approval, 1 have allowance amount differs from contract, and some cases also show country payroll calendar has earlier deadline. The team needs a safe first check same working day so the reviewer does not waste time on incomplete evidence. The learner must check required inputs, mark missing items, prepare a supervised draft, and request reviewer guidance, then prepare a EOR Payroll & Benefits Change Control Log, and clearly mark which items are ready, returned, blocked, or escalated. If handled poorly, the worker may be paid incorrectly or the client may face correction costs in a foreign payroll cycle. Actuals: Volume: 15 records/cases. Issue count 1: 5 with benefit change submitted after cut-off. Issue count 2: 2 with salary change lacks client approval. Issue count 3: 1 with allowance amount differs from contract. Systems/documents: EOR payroll platform, benefit election file, country payroll calendar and client change approval log. Decision needed: ready, return, block, or escalate. Time pressure: same working day. Major concepts: EOR payroll change control - needed to complete and defend the EOR Payroll & Benefits Change Control Log; benefit election validation - needed to complete and defend the EOR Payroll & Benefits Change Control Log; country payroll cut-off - needed to complete and defend the EOR Payroll & Benefits Change Control Log; client approval evidence - needed to complete and defend the EOR Payroll & Benefits Change Control Log; allowance and contract matching - needed to complete and defend the EOR Payroll & Benefits Change Control Log; effective-date handling - needed to complete and defend the EOR Payroll & Benefits Change Control Log; change log ownership - needed to complete and defend the EOR Payroll & Benefits Change Control Log; payroll correction risk - needed to complete and defend the EOR Payroll & Benefits Change Control Log Concept-to-artifact link: These concepts are not theory-only. They tell the learner what to check inside the EOR Payroll & Benefits Change Control Log: source data, missing fields, exception rules, owner notes, decision status, handoff logic, and reviewer evidence. Required data: To solve the artifact, learner needs: country-specific payroll change request, benefit-change evidence, effective dates, local compliance flags, payroll handoff note, approval trail; system screenshots or exports from EOR payroll platform, benefit election file, country payroll calendar and client change approval log; policy or checklist rule used; stakeholder request; deadline/cut-off; prior status if available; reviewer or owner name; evidence of any unresolved exception. Artifact structure: EOR Payroll & Benefits Change Control Log must contain: case or employee/candidate/worker identifier; source document reference; required data fields (country-specific payroll change request, benefit-change evidence, effective dates, local compliance flags, payroll handoff note, approval trail); missing or conflicting item log; numeric issue count; exception category; owner/action note; proceed/return/block/escalate status; reviewer handoff note; closure or follow-up date. How to read artifact: Read the artifact as the learner''s final workplace proof. First check the identifiers and source documents, then the required fields, then the issue count and exception category, then the decision status, and finally whether the handoff note gives a reviewer enough evidence to act. Evidence fields: Assess whether the EOR Payroll & Benefits Change Control Log uses the right source data, includes all required fields, counts and labels the 8 issue records correctly, separates normal items from exceptions, gives a clear decision reason, respects the L1 authority boundary, and provides a usable reviewer handoff. AI coach boundary: AI can ask: Which source proves this field? Which 5 records are blocked? What is the decision reason? What evidence is still missing? AI can summarize checklist gaps and suggest clearer wording, but cannot create missing data, approve the case, override policy, or make the final HR/payroll/compliance decision. Traceability: Industry: HR & Workforce Services.|Domain: EOR & Global Employment Services.|Role: Staffing Consultant; Workforce Fulfillment Coordinator; Managed HR Service Specialist; Recruitment Coordinator; EOR Operations Specialist.|Capability_ID: IND-CAP-08.|Level: L1.|Course_ID: IND-S5-C-036.|Artifact: EOR Payroll & Benefits Change Control Log.|Source Sheet: L1_COURSE_PATTERN.',
  1,
  '8 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BBA Human Resource Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-036' LIMIT 1),
  'BBA Human Resource Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MBA Human Resource Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-036' LIMIT 1),
  'MBA Human Resource Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Com
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-036' LIMIT 1),
  'B.Com',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Com
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-036' LIMIT 1),
  'M.Com',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: LLB / BA LLB Labour and Employment Law
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-036' LIMIT 1),
  'LLB / BA LLB Labour and Employment Law',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PGDM International Business
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-036' LIMIT 1),
  'PGDM International Business',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Payroll Input Validation: Guided Practice
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Payroll Input Validation: Guided Practice',
  'IND-S5-C-041',
  'Learner can complete guided check with supervisor review for Payroll Input Validation and produce a reviewer-ready Payroll Input Validation Register with clear evidence and handoff logic. Workplace scenario: A payroll analyst is handling 16 payroll input validation before payroll lock records in payroll system, attendance file, leave tracker, compensation change sheet and benefits deduction file. The file is messy: 3 records have late salary revisions, 3 have unpaid leave mismatches, 2 have benefit deduction updates without approval, and some cases also show new-joiner bank details incomplete. The team needs a safe first check same working day so the reviewer does not waste time on incomplete evidence. The learner must check required inputs, mark missing items, prepare a supervised draft, and request reviewer guidance, then prepare a Payroll Input Validation Register, and clearly mark which items are ready, returned, blocked, or escalated. If handled poorly, employees may receive incorrect salary or the payroll release may be delayed. Artifact proof: Payroll Input Validation Register. Competency taxonomy: Functional; Technical; Behavioural; Cognitive; Evidence.',
  '8 hours',
  'Active',
  'Payroll, Benefits & Compliance Operations',
  'technical',
  '["Learner can complete guided check with supervisor review for Payroll Input Validation and produce a reviewer-ready Payroll Input Validation Register with clear evidence and handoff logic.","Create a reviewer-ready Payroll Input Validation Register.","Use source data to resolve the skill gap: Learner must convert payroll input validation before payroll lock knowledge into a usable Payroll Input Validation Register: check attendance/leave data, salary revision inputs, deduction and benefit changes, variance flags, identify missing or conflicting records, explain the level boundary, and create a reviewer-ready handoff.","Explain evidence and consequence through the Payroll Input Validation Register."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: Module 1: Payroll Input Validation Register Workplace Build
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-041' LIMIT 1),
  'Module 1: Payroll Input Validation Register Workplace Build',
  'Trigger: A payroll analyst receives 16 payroll input validation before payroll lock records in payroll system, attendance file, leave tracker, compensation change sheet and benefits deduction file; 3 show late salary revisions, 3 show unpaid leave mismatches, and 2 show benefit deduction updates without approval. Pressure: The team needs a safe first check same working day so the reviewer does not waste time on incomplete evidence. Actuals: Volume: 16 records/cases. Issue count 1: 3 with late salary revisions. Issue count 2: 3 with unpaid leave mismatches. Issue count 3: 2 with benefit deduction updates without approval. Systems/documents: payroll system, attendance file, leave tracker, compensation change sheet and benefits deduction file. Decision needed: ready, return, block, or escalate. Time pressure: same working day.',
  1,
  '["HR & Workforce Services","Payroll, Benefits & Compliance Operations","Payroll Operations Specialists; Statutory Payroll & Workforce Compliance Specialists; Compensation, Rewards & Benefits Analysts","Payroll Specialist; Payroll Operations Specialist; Payroll Coordinator; Payroll Compliance Specialist; Statutory Compliance Specialist","IND-CAP-09","Payroll Input Validation Register","Functional","Technical","Behavioural","Cognitive","Evidence"]'::jsonb,
  '["Start with the live trigger: 16 records arrive, 8 have visible issues, and a stakeholder needs an answer same working day.","Learner studies the actual data points: attendance/leave data, salary revision inputs, deduction and benefit changes, variance flags, reviewer approval note, release-readiness checklist; then highlights missing fields, conflicts, late inputs, and owner gaps.","Teach the artifact logic: what each section means, which evidence is mandatory, what numbers must reconcile, and what the learner is allowed to decide at L1.","Learner completes the Payroll Input Validation Register using the case numbers, source references, exception labels, owner notes, and a clear ready/return/block/escalate recommendation.","Learner uses AI only for checklist prompts, concept reminders, and rubric self-checks. AI must not invent records, calculate unsupported numbers, approve decisions, or replace the learner''s judgement.","Learner reflects on what changed at L1: volume, exception complexity, stakeholder pressure, authority boundary, and evidence quality compared with the previous level."]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Payroll Input Validation: Guided Practice: Data, Concepts and Artifact Evidence
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-041' LIMIT 1)
   AND title = 'Module 1: Payroll Input Validation Register Workplace Build' LIMIT 1),
  'Payroll Input Validation: Guided Practice: Data, Concepts and Artifact Evidence',
  'Learner confusion: Students may understand the HR term but may not know how to read 16 messy records, compare source fields, quantify exceptions, choose proceed/return/escalate, or write the evidence trail in simple reviewer language. Root-cause focus: Investigate whether the real cause is missing source data, wrong effective date, unclear owner, system mismatch, late submission, policy/control risk, or weak handoff evidence in payroll system, attendance file, leave tracker, compensation change sheet and benefits deduction file.',
  'Problem: A payroll analyst is handling 16 payroll input validation before payroll lock records in payroll system, attendance file, leave tracker, compensation change sheet and benefits deduction file. The file is messy: 3 records have late salary revisions, 3 have unpaid leave mismatches, 2 have benefit deduction updates without approval, and some cases also show new-joiner bank details incomplete. The team needs a safe first check same working day so the reviewer does not waste time on incomplete evidence. The learner must check required inputs, mark missing items, prepare a supervised draft, and request reviewer guidance, then prepare a Payroll Input Validation Register, and clearly mark which items are ready, returned, blocked, or escalated. If handled poorly, employees may receive incorrect salary or the payroll release may be delayed. Actuals: Volume: 16 records/cases. Issue count 1: 3 with late salary revisions. Issue count 2: 3 with unpaid leave mismatches. Issue count 3: 2 with benefit deduction updates without approval. Systems/documents: payroll system, attendance file, leave tracker, compensation change sheet and benefits deduction file. Decision needed: ready, return, block, or escalate. Time pressure: same working day. Major concepts: payroll lock timeline - needed to complete and defend the Payroll Input Validation Register; source-input dependency - needed to complete and defend the Payroll Input Validation Register; salary revision effective date - needed to complete and defend the Payroll Input Validation Register; unpaid leave adjustment - needed to complete and defend the Payroll Input Validation Register; benefit deduction validation - needed to complete and defend the Payroll Input Validation Register; bank-detail control - needed to complete and defend the Payroll Input Validation Register; normal variance versus release-blocking exception - needed to complete and defend the Payroll Input Validation Register; reviewer approval trail - needed to complete and defend the Payroll Input Validation Register Concept-to-artifact link: These concepts are not theory-only. They tell the learner what to check inside the Payroll Input Validation Register: source data, missing fields, exception rules, owner notes, decision status, handoff logic, and reviewer evidence. Required data: To solve the artifact, learner needs: attendance/leave data, salary revision inputs, deduction and benefit changes, variance flags, reviewer approval note, release-readiness checklist; system screenshots or exports from payroll system, attendance file, leave tracker, compensation change sheet and benefits deduction file; policy or checklist rule used; stakeholder request; deadline/cut-off; prior status if available; reviewer or owner name; evidence of any unresolved exception. Artifact structure: Payroll Input Validation Register must contain: case or employee/candidate/worker identifier; source document reference; required data fields (attendance/leave data, salary revision inputs, deduction and benefit changes, variance flags, reviewer approval note, release-readiness checklist); missing or conflicting item log; numeric issue count; exception category; owner/action note; proceed/return/block/escalate status; reviewer handoff note; closure or follow-up date. How to read artifact: Read the artifact as the learner''s final workplace proof. First check the identifiers and source documents, then the required fields, then the issue count and exception category, then the decision status, and finally whether the handoff note gives a reviewer enough evidence to act. Evidence fields: Assess whether the Payroll Input Validation Register uses the right source data, includes all required fields, counts and labels the 8 issue records correctly, separates normal items from exceptions, gives a clear decision reason, respects the L1 authority boundary, and provides a usable reviewer handoff. AI coach boundary: AI can ask: Which source proves this field? Which 3 records are blocked? What is the decision reason? What evidence is still missing? AI can summarize checklist gaps and suggest clearer wording, but cannot create missing data, approve the case, override policy, or make the final HR/payroll/compliance decision. Traceability: Industry: HR & Workforce Services.|Domain: Payroll, Benefits & Compliance Operations.|Role: Payroll Specialist; Payroll Operations Specialist; Payroll Coordinator; Payroll Compliance Specialist; Statutory Compliance Specialist.|Capability_ID: IND-CAP-09.|Level: L1.|Course_ID: IND-S5-C-041.|Artifact: Payroll Input Validation Register.|Source Sheet: L1_COURSE_PATTERN.',
  1,
  '8 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Com
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-041' LIMIT 1),
  'B.Com',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Com
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-041' LIMIT 1),
  'M.Com',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BBA Human Resource Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-041' LIMIT 1),
  'BBA Human Resource Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MBA Human Resource Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-041' LIMIT 1),
  'MBA Human Resource Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PGDM Payroll and Statutory Compliance
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-041' LIMIT 1),
  'PGDM Payroll and Statutory Compliance',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: LLB / BA LLB Labour and Employment Law
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-041' LIMIT 1),
  'LLB / BA LLB Labour and Employment Law',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Payroll Variance Reconciliation: Guided Practice
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Payroll Variance Reconciliation: Guided Practice',
  'IND-S5-C-046',
  'Learner can complete guided check with supervisor review for Correct Payroll Exceptions Through Variance Diagnosis, and produce a reviewer-ready Payroll Variance Reconciliation Log with clear evidence and handoff logic. Workplace scenario: A payroll operations specialist is handling 12 payroll variance reconciliation records in payroll output register, previous-cycle payroll report, attendance exceptions, salary change register and finance variance threshold sheet. The file is messy: 4 records have net pay variance above threshold, 2 have retro adjustment not explained, 1 have deduction difference without source note, and some cases also show terminated employee still appearing in output. The team needs a safe first check same working day so the reviewer does not waste time on incomplete evidence. The learner must check required inputs, mark missing items, prepare a supervised draft, and request reviewer guidance, then prepare a Payroll Variance Reconciliation Log, and clearly mark which items are ready, returned, blocked, or escalated. If handled poorly, unexplained variances may pass into payment or valid payments may be blocked unnecessarily. Artifact proof: Payroll Variance Reconciliation Log. Competency taxonomy: Functional; Technical; Behavioural; Cognitive; Evidence.',
  '8 hours',
  'Active',
  'Payroll, Benefits & Compliance Operations',
  'technical',
  '["Learner can complete guided check with supervisor review for Correct Payroll Exceptions Through Variance Diagnosis, and produce a reviewer-ready Payroll Variance Reconciliation Log with clear evidence and handoff logic.","Create a reviewer-ready Payroll Variance Reconciliation Log.","Use source data to resolve the skill gap: Learner must convert payroll variance reconciliation knowledge into a usable Payroll Variance Reconciliation Log: check exception list, variance reason, recalculation evidence, corrected input source, identify missing or conflicting records, explain the level boundary, and create a reviewer-ready handoff.","Explain evidence and consequence through the Payroll Variance Reconciliation Log."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: Module 1: Payroll Variance Reconciliation Log Workplace Build
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-046' LIMIT 1),
  'Module 1: Payroll Variance Reconciliation Log Workplace Build',
  'Trigger: A payroll operations specialist receives 12 payroll variance reconciliation records in payroll output register, previous-cycle payroll report, attendance exceptions, salary change register and finance variance threshold sheet; 4 show net pay variance above threshold, 2 show retro adjustment not explained, and 1 show deduction difference without source note. Pressure: The team needs a safe first check same working day so the reviewer does not waste time on incomplete evidence. Actuals: Volume: 12 records/cases. Issue count 1: 4 with net pay variance above threshold. Issue count 2: 2 with retro adjustment not explained. Issue count 3: 1 with deduction difference without source note. Systems/documents: payroll output register, previous-cycle payroll report, attendance exceptions, salary change register and finance variance threshold sheet. Decision needed: ready, return, block, or escalate. Time pressure: same working day.',
  1,
  '["HR & Workforce Services","Payroll, Benefits & Compliance Operations","Payroll Operations Specialists; Statutory Payroll & Workforce Compliance Specialists; Compensation, Rewards & Benefits Analysts","Payroll Specialist; Payroll Operations Specialist; Payroll Coordinator; Payroll Compliance Specialist; Statutory Compliance Specialist","IND-CAP-10","Payroll Variance Reconciliation Log","Functional","Technical","Behavioural","Cognitive","Evidence"]'::jsonb,
  '["Start with the live trigger: 12 records arrive, 7 have visible issues, and a stakeholder needs an answer same working day.","Learner studies the actual data points: exception list, variance reason, recalculation evidence, corrected input source, approver decision, payroll release action; then highlights missing fields, conflicts, late inputs, and owner gaps.","Teach the artifact logic: what each section means, which evidence is mandatory, what numbers must reconcile, and what the learner is allowed to decide at L1.","Learner completes the Payroll Variance Reconciliation Log using the case numbers, source references, exception labels, owner notes, and a clear ready/return/block/escalate recommendation.","Learner uses AI only for checklist prompts, concept reminders, and rubric self-checks. AI must not invent records, calculate unsupported numbers, approve decisions, or replace the learner''s judgement.","Learner reflects on what changed at L1: volume, exception complexity, stakeholder pressure, authority boundary, and evidence quality compared with the previous level."]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Payroll Variance Reconciliation: Guided Practice: Data, Concepts and Artifact Evidence
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-046' LIMIT 1)
   AND title = 'Module 1: Payroll Variance Reconciliation Log Workplace Build' LIMIT 1),
  'Payroll Variance Reconciliation: Guided Practice: Data, Concepts and Artifact Evidence',
  'Learner confusion: Students may understand the HR term but may not know how to read 12 messy records, compare source fields, quantify exceptions, choose proceed/return/escalate, or write the evidence trail in simple reviewer language. Root-cause focus: Investigate whether the real cause is missing source data, wrong effective date, unclear owner, system mismatch, late submission, policy/control risk, or weak handoff evidence in payroll output register, previous-cycle payroll report, attendance exceptions, salary change register and finance variance threshold sheet.',
  'Problem: A payroll operations specialist is handling 12 payroll variance reconciliation records in payroll output register, previous-cycle payroll report, attendance exceptions, salary change register and finance variance threshold sheet. The file is messy: 4 records have net pay variance above threshold, 2 have retro adjustment not explained, 1 have deduction difference without source note, and some cases also show terminated employee still appearing in output. The team needs a safe first check same working day so the reviewer does not waste time on incomplete evidence. The learner must check required inputs, mark missing items, prepare a supervised draft, and request reviewer guidance, then prepare a Payroll Variance Reconciliation Log, and clearly mark which items are ready, returned, blocked, or escalated. If handled poorly, unexplained variances may pass into payment or valid payments may be blocked unnecessarily. Actuals: Volume: 12 records/cases. Issue count 1: 4 with net pay variance above threshold. Issue count 2: 2 with retro adjustment not explained. Issue count 3: 1 with deduction difference without source note. Systems/documents: payroll output register, previous-cycle payroll report, attendance exceptions, salary change register and finance variance threshold sheet. Decision needed: ready, return, block, or escalate. Time pressure: same working day. Major concepts: payroll variance threshold - needed to complete and defend the Payroll Variance Reconciliation Log; gross-to-net comparison - needed to complete and defend the Payroll Variance Reconciliation Log; retro adjustment logic - needed to complete and defend the Payroll Variance Reconciliation Log; deduction reconciliation - needed to complete and defend the Payroll Variance Reconciliation Log; termination impact - needed to complete and defend the Payroll Variance Reconciliation Log; variance reason coding - needed to complete and defend the Payroll Variance Reconciliation Log; finance approval evidence - needed to complete and defend the Payroll Variance Reconciliation Log; reconciliation log quality - needed to complete and defend the Payroll Variance Reconciliation Log Concept-to-artifact link: These concepts are not theory-only. They tell the learner what to check inside the Payroll Variance Reconciliation Log: source data, missing fields, exception rules, owner notes, decision status, handoff logic, and reviewer evidence. Required data: To solve the artifact, learner needs: exception list, variance reason, recalculation evidence, corrected input source, approver decision, payroll release action; system screenshots or exports from payroll output register, previous-cycle payroll report, attendance exceptions, salary change register and finance variance threshold sheet; policy or checklist rule used; stakeholder request; deadline/cut-off; prior status if available; reviewer or owner name; evidence of any unresolved exception. Artifact structure: Payroll Variance Reconciliation Log must contain: case or employee/candidate/worker identifier; source document reference; required data fields (exception list, variance reason, recalculation evidence, corrected input source, approver decision, payroll release action); missing or conflicting item log; numeric issue count; exception category; owner/action note; proceed/return/block/escalate status; reviewer handoff note; closure or follow-up date. How to read artifact: Read the artifact as the learner''s final workplace proof. First check the identifiers and source documents, then the required fields, then the issue count and exception category, then the decision status, and finally whether the handoff note gives a reviewer enough evidence to act. Evidence fields: Assess whether the Payroll Variance Reconciliation Log uses the right source data, includes all required fields, counts and labels the 7 issue records correctly, separates normal items from exceptions, gives a clear decision reason, respects the L1 authority boundary, and provides a usable reviewer handoff. AI coach boundary: AI can ask: Which source proves this field? Which 4 records are blocked? What is the decision reason? What evidence is still missing? AI can summarize checklist gaps and suggest clearer wording, but cannot create missing data, approve the case, override policy, or make the final HR/payroll/compliance decision. Traceability: Industry: HR & Workforce Services.|Domain: Payroll, Benefits & Compliance Operations.|Role: Payroll Specialist; Payroll Operations Specialist; Payroll Coordinator; Payroll Compliance Specialist; Statutory Compliance Specialist.|Capability_ID: IND-CAP-10.|Level: L1.|Course_ID: IND-S5-C-046.|Artifact: Payroll Variance Reconciliation Log.|Source Sheet: L1_COURSE_PATTERN.',
  1,
  '8 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Com
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-046' LIMIT 1),
  'B.Com',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Com
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-046' LIMIT 1),
  'M.Com',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BBA Human Resource Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-046' LIMIT 1),
  'BBA Human Resource Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MBA Human Resource Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-046' LIMIT 1),
  'MBA Human Resource Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PGDM Payroll and Statutory Compliance
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-046' LIMIT 1),
  'PGDM Payroll and Statutory Compliance',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: LLB / BA LLB Labour and Employment Law
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-046' LIMIT 1),
  'LLB / BA LLB Labour and Employment Law',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Benefits Eligibility Audit: Guided Practice
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Benefits Eligibility Audit: Guided Practice',
  'IND-S5-C-051',
  'Learner can complete guided check with supervisor review for Benefits Eligibility Review and produce a reviewer-ready Benefits Eligibility Audit Sheet with clear evidence and handoff logic. Workplace scenario: A benefits operations analyst is handling 13 benefits eligibility audit records in benefits administration portal, employee master data, policy eligibility matrix and payroll deduction file. The file is messy: 5 records have employee class not updated, 3 have dependent proof missing, 2 have benefit start date conflicts with joining date, and some cases also show deduction file does not match election record. The team needs a safe first check same working day so the reviewer does not waste time on incomplete evidence. The learner must check required inputs, mark missing items, prepare a supervised draft, and request reviewer guidance, then prepare a Benefits Eligibility Audit Sheet, and clearly mark which items are ready, returned, blocked, or escalated. If handled poorly, employees may receive wrong coverage or incorrect deductions may enter payroll. Artifact proof: Benefits Eligibility Audit Sheet. Competency taxonomy: Functional; Technical; Behavioural; Domain; Evidence.',
  '8 hours',
  'Active',
  'Payroll, Benefits & Compliance Operations',
  'technical',
  '["Learner can complete guided check with supervisor review for Benefits Eligibility Review and produce a reviewer-ready Benefits Eligibility Audit Sheet with clear evidence and handoff logic.","Create a reviewer-ready Benefits Eligibility Audit Sheet.","Use source data to resolve the skill gap: Learner must convert benefits eligibility audit knowledge into a usable Benefits Eligibility Audit Sheet: check lifecycle event, plan eligibility rules, enrollment/change evidence, dependent/supporting documents, identify missing or conflicting records, explain the level boundary, and create a reviewer-ready handoff.","Explain evidence and consequence through the Benefits Eligibility Audit Sheet."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: Module 1: Benefits Eligibility Audit Sheet Workplace Build
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-051' LIMIT 1),
  'Module 1: Benefits Eligibility Audit Sheet Workplace Build',
  'Trigger: A benefits operations analyst receives 13 benefits eligibility audit records in benefits administration portal, employee master data, policy eligibility matrix and payroll deduction file; 5 show employee class not updated, 3 show dependent proof missing, and 2 show benefit start date conflicts with joining date. Pressure: The team needs a safe first check same working day so the reviewer does not waste time on incomplete evidence. Actuals: Volume: 13 records/cases. Issue count 1: 5 with employee class not updated. Issue count 2: 3 with dependent proof missing. Issue count 3: 2 with benefit start date conflicts with joining date. Systems/documents: benefits administration portal, employee master data, policy eligibility matrix and payroll deduction file. Decision needed: ready, return, block, or escalate. Time pressure: same working day.',
  1,
  '["HR & Workforce Services","Payroll, Benefits & Compliance Operations","Payroll Operations Specialists; Statutory Payroll & Workforce Compliance Specialists; Compensation, Rewards & Benefits Analysts","Payroll Specialist; Payroll Operations Specialist; Payroll Coordinator; Payroll Compliance Specialist; Statutory Compliance Specialist","IND-CAP-11","Benefits Eligibility Audit Sheet","Functional","Technical","Behavioural","Domain","Evidence"]'::jsonb,
  '["Start with the live trigger: 13 records arrive, 10 have visible issues, and a stakeholder needs an answer same working day.","Learner studies the actual data points: lifecycle event, plan eligibility rules, enrollment/change evidence, dependent/supporting documents, exception flags, employee/vendor handoff note; then highlights missing fields, conflicts, late inputs, and owner gaps.","Teach the artifact logic: what each section means, which evidence is mandatory, what numbers must reconcile, and what the learner is allowed to decide at L1.","Learner completes the Benefits Eligibility Audit Sheet using the case numbers, source references, exception labels, owner notes, and a clear ready/return/block/escalate recommendation.","Learner uses AI only for checklist prompts, concept reminders, and rubric self-checks. AI must not invent records, calculate unsupported numbers, approve decisions, or replace the learner''s judgement.","Learner reflects on what changed at L1: volume, exception complexity, stakeholder pressure, authority boundary, and evidence quality compared with the previous level."]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Benefits Eligibility Audit: Guided Practice: Data, Concepts and Artifact Evidence
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-051' LIMIT 1)
   AND title = 'Module 1: Benefits Eligibility Audit Sheet Workplace Build' LIMIT 1),
  'Benefits Eligibility Audit: Guided Practice: Data, Concepts and Artifact Evidence',
  'Learner confusion: Students may understand the HR term but may not know how to read 13 messy records, compare source fields, quantify exceptions, choose proceed/return/escalate, or write the evidence trail in simple reviewer language. Root-cause focus: Investigate whether the real cause is missing source data, wrong effective date, unclear owner, system mismatch, late submission, policy/control risk, or weak handoff evidence in benefits administration portal, employee master data, policy eligibility matrix and payroll deduction file.',
  'Problem: A benefits operations analyst is handling 13 benefits eligibility audit records in benefits administration portal, employee master data, policy eligibility matrix and payroll deduction file. The file is messy: 5 records have employee class not updated, 3 have dependent proof missing, 2 have benefit start date conflicts with joining date, and some cases also show deduction file does not match election record. The team needs a safe first check same working day so the reviewer does not waste time on incomplete evidence. The learner must check required inputs, mark missing items, prepare a supervised draft, and request reviewer guidance, then prepare a Benefits Eligibility Audit Sheet, and clearly mark which items are ready, returned, blocked, or escalated. If handled poorly, employees may receive wrong coverage or incorrect deductions may enter payroll. Actuals: Volume: 13 records/cases. Issue count 1: 5 with employee class not updated. Issue count 2: 3 with dependent proof missing. Issue count 3: 2 with benefit start date conflicts with joining date. Systems/documents: benefits administration portal, employee master data, policy eligibility matrix and payroll deduction file. Decision needed: ready, return, block, or escalate. Time pressure: same working day. Major concepts: benefits eligibility rules - needed to complete and defend the Benefits Eligibility Audit Sheet; employee class dependency - needed to complete and defend the Benefits Eligibility Audit Sheet; dependent verification - needed to complete and defend the Benefits Eligibility Audit Sheet; effective-date alignment - needed to complete and defend the Benefits Eligibility Audit Sheet; election versus deduction matching - needed to complete and defend the Benefits Eligibility Audit Sheet; coverage start control - needed to complete and defend the Benefits Eligibility Audit Sheet; exception flagging - needed to complete and defend the Benefits Eligibility Audit Sheet; benefits audit evidence - needed to complete and defend the Benefits Eligibility Audit Sheet Concept-to-artifact link: These concepts are not theory-only. They tell the learner what to check inside the Benefits Eligibility Audit Sheet: source data, missing fields, exception rules, owner notes, decision status, handoff logic, and reviewer evidence. Required data: To solve the artifact, learner needs: lifecycle event, plan eligibility rules, enrollment/change evidence, dependent/supporting documents, exception flags, employee/vendor handoff note; system screenshots or exports from benefits administration portal, employee master data, policy eligibility matrix and payroll deduction file; policy or checklist rule used; stakeholder request; deadline/cut-off; prior status if available; reviewer or owner name; evidence of any unresolved exception. Artifact structure: Benefits Eligibility Audit Sheet must contain: case or employee/candidate/worker identifier; source document reference; required data fields (lifecycle event, plan eligibility rules, enrollment/change evidence, dependent/supporting documents, exception flags, employee/vendor handoff note); missing or conflicting item log; numeric issue count; exception category; owner/action note; proceed/return/block/escalate status; reviewer handoff note; closure or follow-up date. How to read artifact: Read the artifact as the learner''s final workplace proof. First check the identifiers and source documents, then the required fields, then the issue count and exception category, then the decision status, and finally whether the handoff note gives a reviewer enough evidence to act. Evidence fields: Assess whether the Benefits Eligibility Audit Sheet uses the right source data, includes all required fields, counts and labels the 10 issue records correctly, separates normal items from exceptions, gives a clear decision reason, respects the L1 authority boundary, and provides a usable reviewer handoff. AI coach boundary: AI can ask: Which source proves this field? Which 5 records are blocked? What is the decision reason? What evidence is still missing? AI can summarize checklist gaps and suggest clearer wording, but cannot create missing data, approve the case, override policy, or make the final HR/payroll/compliance decision. Traceability: Industry: HR & Workforce Services.|Domain: Payroll, Benefits & Compliance Operations.|Role: Payroll Specialist; Payroll Operations Specialist; Payroll Coordinator; Payroll Compliance Specialist; Statutory Compliance Specialist.|Capability_ID: IND-CAP-11.|Level: L1.|Course_ID: IND-S5-C-051.|Artifact: Benefits Eligibility Audit Sheet.|Source Sheet: L1_COURSE_PATTERN.',
  1,
  '8 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Com
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-051' LIMIT 1),
  'B.Com',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Com
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-051' LIMIT 1),
  'M.Com',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BBA Human Resource Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-051' LIMIT 1),
  'BBA Human Resource Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MBA Human Resource Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-051' LIMIT 1),
  'MBA Human Resource Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PGDM Payroll and Statutory Compliance
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-051' LIMIT 1),
  'PGDM Payroll and Statutory Compliance',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: LLB / BA LLB Labour and Employment Law
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-051' LIMIT 1),
  'LLB / BA LLB Labour and Employment Law',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Statutory Contribution Filing Working: Guided Practice
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Statutory Contribution Filing Working: Guided Practice',
  'IND-S5-C-056',
  'Learner can complete guided check with supervisor review for Statutory Contribution Filing and produce a reviewer-ready Statutory Contribution Filing Working Paper with clear evidence and handoff logic. Workplace scenario: A statutory compliance specialist is handling 14 statutory contribution filing preparation records in payroll register, wage-base calculation sheet, statutory portal draft, employee ID records and finance payment evidence. The file is messy: 3 records have wage base mismatch, 2 have employee statutory ID missing, 1 have arrear amount not separated, and some cases also show portal total not matching payroll register. The team needs a safe first check same working day so the reviewer does not waste time on incomplete evidence. The learner must check required inputs, mark missing items, prepare a supervised draft, and request reviewer guidance, then prepare a Statutory Contribution Filing Working Paper, and clearly mark which items are ready, returned, blocked, or escalated. If handled poorly, the organization may submit incorrect contributions, miss filing deadlines, or face correction penalties. Artifact proof: Statutory Contribution Filing Working Paper. Competency taxonomy: Functional; Technical; Behavioural; Cognitive; Evidence.',
  '8 hours',
  'Active',
  'Payroll, Benefits & Compliance Operations',
  'technical',
  '["Learner can complete guided check with supervisor review for Statutory Contribution Filing and produce a reviewer-ready Statutory Contribution Filing Working Paper with clear evidence and handoff logic.","Create a reviewer-ready Statutory Contribution Filing Working Paper.","Use source data to resolve the skill gap: Learner must convert statutory contribution filing preparation knowledge into a usable Statutory Contribution Filing Working Paper: check wage-base calculation, contribution rates, employee/employer amounts, filing period, identify missing or conflicting records, explain the level boundary, and create a reviewer-ready handoff.","Explain evidence and consequence through the Statutory Contribution Filing Working Paper."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: Module 1: Statutory Contribution Filing Working Paper Workplace Build
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-056' LIMIT 1),
  'Module 1: Statutory Contribution Filing Working Paper Workplace Build',
  'Trigger: A statutory compliance specialist receives 14 statutory contribution filing preparation records in payroll register, wage-base calculation sheet, statutory portal draft, employee ID records and finance payment evidence; 3 show wage base mismatch, 2 show employee statutory ID missing, and 1 show arrear amount not separated. Pressure: The team needs a safe first check same working day so the reviewer does not waste time on incomplete evidence. Actuals: Volume: 14 records/cases. Issue count 1: 3 with wage base mismatch. Issue count 2: 2 with employee statutory ID missing. Issue count 3: 1 with arrear amount not separated. Systems/documents: payroll register, wage-base calculation sheet, statutory portal draft, employee ID records and finance payment evidence. Decision needed: ready, return, block, or escalate. Time pressure: same working day.',
  1,
  '["HR & Workforce Services","Payroll, Benefits & Compliance Operations","Payroll Operations Specialists; Statutory Payroll & Workforce Compliance Specialists; Compensation, Rewards & Benefits Analysts","Payroll Specialist; Payroll Operations Specialist; Payroll Coordinator; Payroll Compliance Specialist; Statutory Compliance Specialist","IND-CAP-12","Statutory Contribution Filing Working Paper","Functional","Technical","Behavioural","Cognitive","Evidence"]'::jsonb,
  '["Start with the live trigger: 14 records arrive, 6 have visible issues, and a stakeholder needs an answer same working day.","Learner studies the actual data points: wage-base calculation, contribution rates, employee/employer amounts, filing period, variance checks, approval and submission evidence; then highlights missing fields, conflicts, late inputs, and owner gaps.","Teach the artifact logic: what each section means, which evidence is mandatory, what numbers must reconcile, and what the learner is allowed to decide at L1.","Learner completes the Statutory Contribution Filing Working Paper using the case numbers, source references, exception labels, owner notes, and a clear ready/return/block/escalate recommendation.","Learner uses AI only for checklist prompts, concept reminders, and rubric self-checks. AI must not invent records, calculate unsupported numbers, approve decisions, or replace the learner''s judgement.","Learner reflects on what changed at L1: volume, exception complexity, stakeholder pressure, authority boundary, and evidence quality compared with the previous level."]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Statutory Contribution Filing Working: Guided Practice: Data, Concepts and Artifact Evidence
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-056' LIMIT 1)
   AND title = 'Module 1: Statutory Contribution Filing Working Paper Workplace Build' LIMIT 1),
  'Statutory Contribution Filing Working: Guided Practice: Data, Concepts and Artifact Evidence',
  'Learner confusion: Students may understand the HR term but may not know how to read 14 messy records, compare source fields, quantify exceptions, choose proceed/return/escalate, or write the evidence trail in simple reviewer language. Root-cause focus: Investigate whether the real cause is missing source data, wrong effective date, unclear owner, system mismatch, late submission, policy/control risk, or weak handoff evidence in payroll register, wage-base calculation sheet, statutory portal draft, employee ID records and finance payment evidence.',
  'Problem: A statutory compliance specialist is handling 14 statutory contribution filing preparation records in payroll register, wage-base calculation sheet, statutory portal draft, employee ID records and finance payment evidence. The file is messy: 3 records have wage base mismatch, 2 have employee statutory ID missing, 1 have arrear amount not separated, and some cases also show portal total not matching payroll register. The team needs a safe first check same working day so the reviewer does not waste time on incomplete evidence. The learner must check required inputs, mark missing items, prepare a supervised draft, and request reviewer guidance, then prepare a Statutory Contribution Filing Working Paper, and clearly mark which items are ready, returned, blocked, or escalated. If handled poorly, the organization may submit incorrect contributions, miss filing deadlines, or face correction penalties. Actuals: Volume: 14 records/cases. Issue count 1: 3 with wage base mismatch. Issue count 2: 2 with employee statutory ID missing. Issue count 3: 1 with arrear amount not separated. Systems/documents: payroll register, wage-base calculation sheet, statutory portal draft, employee ID records and finance payment evidence. Decision needed: ready, return, block, or escalate. Time pressure: same working day. Major concepts: statutory wage-base logic - needed to complete and defend the Statutory Contribution Filing Working Paper; employee contribution eligibility - needed to complete and defend the Statutory Contribution Filing Working Paper; employer contribution calculation - needed to complete and defend the Statutory Contribution Filing Working Paper; arrear segregation - needed to complete and defend the Statutory Contribution Filing Working Paper; filing cut-off control - needed to complete and defend the Statutory Contribution Filing Working Paper; portal-total reconciliation - needed to complete and defend the Statutory Contribution Filing Working Paper; payment evidence trail - needed to complete and defend the Statutory Contribution Filing Working Paper; statutory working-paper review - needed to complete and defend the Statutory Contribution Filing Working Paper Concept-to-artifact link: These concepts are not theory-only. They tell the learner what to check inside the Statutory Contribution Filing Working Paper: source data, missing fields, exception rules, owner notes, decision status, handoff logic, and reviewer evidence. Required data: To solve the artifact, learner needs: wage-base calculation, contribution rates, employee/employer amounts, filing period, variance checks, approval and submission evidence; system screenshots or exports from payroll register, wage-base calculation sheet, statutory portal draft, employee ID records and finance payment evidence; policy or checklist rule used; stakeholder request; deadline/cut-off; prior status if available; reviewer or owner name; evidence of any unresolved exception. Artifact structure: Statutory Contribution Filing Working Paper must contain: case or employee/candidate/worker identifier; source document reference; required data fields (wage-base calculation, contribution rates, employee/employer amounts, filing period, variance checks, approval and submission evidence); missing or conflicting item log; numeric issue count; exception category; owner/action note; proceed/return/block/escalate status; reviewer handoff note; closure or follow-up date. How to read artifact: Read the artifact as the learner''s final workplace proof. First check the identifiers and source documents, then the required fields, then the issue count and exception category, then the decision status, and finally whether the handoff note gives a reviewer enough evidence to act. Evidence fields: Assess whether the Statutory Contribution Filing Working Paper uses the right source data, includes all required fields, counts and labels the 6 issue records correctly, separates normal items from exceptions, gives a clear decision reason, respects the L1 authority boundary, and provides a usable reviewer handoff. AI coach boundary: AI can ask: Which source proves this field? Which 3 records are blocked? What is the decision reason? What evidence is still missing? AI can summarize checklist gaps and suggest clearer wording, but cannot create missing data, approve the case, override policy, or make the final HR/payroll/compliance decision. Traceability: Industry: HR & Workforce Services.|Domain: Payroll, Benefits & Compliance Operations.|Role: Payroll Specialist; Payroll Operations Specialist; Payroll Coordinator; Payroll Compliance Specialist; Statutory Compliance Specialist.|Capability_ID: IND-CAP-12.|Level: L1.|Course_ID: IND-S5-C-056.|Artifact: Statutory Contribution Filing Working Paper.|Source Sheet: L1_COURSE_PATTERN.',
  1,
  '8 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Com
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-056' LIMIT 1),
  'B.Com',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Com
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-056' LIMIT 1),
  'M.Com',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BBA Human Resource Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-056' LIMIT 1),
  'BBA Human Resource Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MBA Human Resource Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-056' LIMIT 1),
  'MBA Human Resource Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PGDM Payroll and Statutory Compliance
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-056' LIMIT 1),
  'PGDM Payroll and Statutory Compliance',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: LLB / BA LLB Labour and Employment Law
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-056' LIMIT 1),
  'LLB / BA LLB Labour and Employment Law',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: HRIS Master Data Change Evidence: Guided Practice
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'HRIS Master Data Change Evidence: Guided Practice',
  'IND-S5-C-061',
  'Learner can complete guided check with supervisor review for Employee Master Data Change Control and produce a reviewer-ready HRIS Master Data Change Evidence Pack with clear evidence and handoff logic. Workplace scenario: An HR operations associate is handling 15 HRIS master data change validation records in HRIS master-data screen, employee change request form, approval mail, org structure file and document repository. The file is messy: 4 records have effective date not supported, 3 have manager code mismatched, 2 have grade change approved in mail but not in form, and some cases also show location update missing document proof. The team needs a safe first check same working day so the reviewer does not waste time on incomplete evidence. The learner must check required inputs, mark missing items, prepare a supervised draft, and request reviewer guidance, then prepare a HRIS Master Data Change Evidence Pack, and clearly mark which items are ready, returned, blocked, or escalated. If handled poorly, payroll, access, reporting, or manager hierarchy may become wrong across systems. Artifact proof: HRIS Master Data Change Evidence Pack. Competency taxonomy: Functional; Technical; Behavioural; Domain; Evidence.',
  '8 hours',
  'Active',
  'HR Operations & HRIS Services',
  'technical',
  '["Learner can complete guided check with supervisor review for Employee Master Data Change Control and produce a reviewer-ready HRIS Master Data Change Evidence Pack with clear evidence and handoff logic.","Create a reviewer-ready HRIS Master Data Change Evidence Pack.","Use source data to resolve the skill gap: Learner must convert HRIS master data change validation knowledge into a usable HRIS Master Data Change Evidence Pack: check change request, source document, field-level before/after values, downstream impact checklist, identify missing or conflicting records, explain the level boundary, and create a reviewer-ready handoff.","Explain evidence and consequence through the HRIS Master Data Change Evidence Pack."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: Module 1: HRIS Master Data Change Evidence Pack Workplace Build
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-061' LIMIT 1),
  'Module 1: HRIS Master Data Change Evidence Pack Workplace Build',
  'Trigger: An HR operations associate receives 15 HRIS master data change validation records in HRIS master-data screen, employee change request form, approval mail, org structure file and document repository; 4 show effective date not supported, 3 show manager code mismatched, and 2 show grade change approved in mail but not in form. Pressure: The team needs a safe first check same working day so the reviewer does not waste time on incomplete evidence. Actuals: Volume: 15 records/cases. Issue count 1: 4 with effective date not supported. Issue count 2: 3 with manager code mismatched. Issue count 3: 2 with grade change approved in mail but not in form. Systems/documents: HRIS master-data screen, employee change request form, approval mail, org structure file and document repository. Decision needed: ready, return, block, or escalate. Time pressure: same working day.',
  1,
  '["HR & Workforce Services","HR Operations & HRIS Services","HR Operations & Employee Lifecycle Specialists; People Systems, HRIS & Service Delivery Specialists","HR Operations Specialist; HR Specialist; Employee Lifecycle Specialist; Offboarding Specialist; HRIS Specialist","IND-CAP-13","HRIS Master Data Change Evidence Pack","Functional","Technical","Behavioural","Domain","Evidence"]'::jsonb,
  '["Start with the live trigger: 15 records arrive, 9 have visible issues, and a stakeholder needs an answer same working day.","Learner studies the actual data points: change request, source document, field-level before/after values, downstream impact checklist, approval trail, audit-note closure; then highlights missing fields, conflicts, late inputs, and owner gaps.","Teach the artifact logic: what each section means, which evidence is mandatory, what numbers must reconcile, and what the learner is allowed to decide at L1.","Learner completes the HRIS Master Data Change Evidence Pack using the case numbers, source references, exception labels, owner notes, and a clear ready/return/block/escalate recommendation.","Learner uses AI only for checklist prompts, concept reminders, and rubric self-checks. AI must not invent records, calculate unsupported numbers, approve decisions, or replace the learner''s judgement.","Learner reflects on what changed at L1: volume, exception complexity, stakeholder pressure, authority boundary, and evidence quality compared with the previous level."]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: HRIS Master Data Change Evidence: Guided Practice: Data, Concepts and Artifact Evidence
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-061' LIMIT 1)
   AND title = 'Module 1: HRIS Master Data Change Evidence Pack Workplace Build' LIMIT 1),
  'HRIS Master Data Change Evidence: Guided Practice: Data, Concepts and Artifact Evidence',
  'Learner confusion: Students may understand the HR term but may not know how to read 15 messy records, compare source fields, quantify exceptions, choose proceed/return/escalate, or write the evidence trail in simple reviewer language. Root-cause focus: Investigate whether the real cause is missing source data, wrong effective date, unclear owner, system mismatch, late submission, policy/control risk, or weak handoff evidence in HRIS master-data screen, employee change request form, approval mail, org structure file and document repository.',
  'Problem: An HR operations associate is handling 15 HRIS master data change validation records in HRIS master-data screen, employee change request form, approval mail, org structure file and document repository. The file is messy: 4 records have effective date not supported, 3 have manager code mismatched, 2 have grade change approved in mail but not in form, and some cases also show location update missing document proof. The team needs a safe first check same working day so the reviewer does not waste time on incomplete evidence. The learner must check required inputs, mark missing items, prepare a supervised draft, and request reviewer guidance, then prepare a HRIS Master Data Change Evidence Pack, and clearly mark which items are ready, returned, blocked, or escalated. If handled poorly, payroll, access, reporting, or manager hierarchy may become wrong across systems. Actuals: Volume: 15 records/cases. Issue count 1: 4 with effective date not supported. Issue count 2: 3 with manager code mismatched. Issue count 3: 2 with grade change approved in mail but not in form. Systems/documents: HRIS master-data screen, employee change request form, approval mail, org structure file and document repository. Decision needed: ready, return, block, or escalate. Time pressure: same working day. Major concepts: HRIS master data control - needed to complete and defend the HRIS Master Data Change Evidence Pack; effective-date validation - needed to complete and defend the HRIS Master Data Change Evidence Pack; approval-source matching - needed to complete and defend the HRIS Master Data Change Evidence Pack; manager and org code dependency - needed to complete and defend the HRIS Master Data Change Evidence Pack; location and grade change rules - needed to complete and defend the HRIS Master Data Change Evidence Pack; data-change evidence pack - needed to complete and defend the HRIS Master Data Change Evidence Pack; downstream impact check - needed to complete and defend the HRIS Master Data Change Evidence Pack; change closure documentation - needed to complete and defend the HRIS Master Data Change Evidence Pack Concept-to-artifact link: These concepts are not theory-only. They tell the learner what to check inside the HRIS Master Data Change Evidence Pack: source data, missing fields, exception rules, owner notes, decision status, handoff logic, and reviewer evidence. Required data: To solve the artifact, learner needs: change request, source document, field-level before/after values, downstream impact checklist, approval trail, audit-note closure; system screenshots or exports from HRIS master-data screen, employee change request form, approval mail, org structure file and document repository; policy or checklist rule used; stakeholder request; deadline/cut-off; prior status if available; reviewer or owner name; evidence of any unresolved exception. Artifact structure: HRIS Master Data Change Evidence Pack must contain: case or employee/candidate/worker identifier; source document reference; required data fields (change request, source document, field-level before/after values, downstream impact checklist, approval trail, audit-note closure); missing or conflicting item log; numeric issue count; exception category; owner/action note; proceed/return/block/escalate status; reviewer handoff note; closure or follow-up date. How to read artifact: Read the artifact as the learner''s final workplace proof. First check the identifiers and source documents, then the required fields, then the issue count and exception category, then the decision status, and finally whether the handoff note gives a reviewer enough evidence to act. Evidence fields: Assess whether the HRIS Master Data Change Evidence Pack uses the right source data, includes all required fields, counts and labels the 9 issue records correctly, separates normal items from exceptions, gives a clear decision reason, respects the L1 authority boundary, and provides a usable reviewer handoff. AI coach boundary: AI can ask: Which source proves this field? Which 4 records are blocked? What is the decision reason? What evidence is still missing? AI can summarize checklist gaps and suggest clearer wording, but cannot create missing data, approve the case, override policy, or make the final HR/payroll/compliance decision. Traceability: Industry: HR & Workforce Services.|Domain: HR Operations & HRIS Services.|Role: HR Operations Specialist; HR Specialist; Employee Lifecycle Specialist; Offboarding Specialist; HRIS Specialist.|Capability_ID: IND-CAP-13.|Level: L1.|Course_ID: IND-S5-C-061.|Artifact: HRIS Master Data Change Evidence Pack.|Source Sheet: L1_COURSE_PATTERN.',
  1,
  '8 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BBA Human Resource Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-061' LIMIT 1),
  'BBA Human Resource Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MBA Human Resource Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-061' LIMIT 1),
  'MBA Human Resource Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BCA
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-061' LIMIT 1),
  'BCA',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Information Technology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-061' LIMIT 1),
  'B.Sc Information Technology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BBA Business Analytics
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-061' LIMIT 1),
  'BBA Business Analytics',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PGDM HR Analytics
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-061' LIMIT 1),
  'PGDM HR Analytics',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Joiner-Mover-Leaver Closure: Guided Practice
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Joiner-Mover-Leaver Closure: Guided Practice',
  'IND-S5-C-066',
  'Learner can complete guided check with supervisor review for Administer Joiner-Mover-Leaver Checklists Through Service-Owner Closure and produce a reviewer-ready Joiner-Mover-Leaver Closure Checklist with clear evidence and handoff logic. Workplace scenario: An employee lifecycle coordinator is handling 16 joiner-mover-leaver closure records in JML tracker, HRIS, IT access list, payroll handoff sheet and document checklist. The file is messy: 5 records have joining document pending, 2 have mover access change not confirmed, 1 have leaver clearance not signed, and some cases also show payroll stop or start date unclear. The team needs a safe first check same working day so the reviewer does not waste time on incomplete evidence. The learner must check required inputs, mark missing items, prepare a supervised draft, and request reviewer guidance, then prepare a Joiner-Mover-Leaver Closure Checklist, and clearly mark which items are ready, returned, blocked, or escalated. If handled poorly, new joiners may not be ready, movers may keep wrong access, or leavers may remain active in systems. Artifact proof: Joiner-Mover-Leaver Closure Checklist. Competency taxonomy: Functional; Technical; Behavioural; Cognitive; Evidence.',
  '8 hours',
  'Active',
  'HR & Workforce Services',
  'technical',
  '["Learner can complete guided check with supervisor review for Administer Joiner-Mover-Leaver Checklists Through Service-Owner Closure and produce a reviewer-ready Joiner-Mover-Leaver Closure Checklist with clear evidence and handoff logic.","Create a reviewer-ready Joiner-Mover-Leaver Closure Checklist.","Use source data to resolve the skill gap: Learner must convert joiner-mover-leaver closure knowledge into a usable Joiner-Mover-Leaver Closure Checklist: check lifecycle trigger, service-owner tasks, access/equipment/payroll dependencies, status tracker, identify missing or conflicting records, explain the level boundary, and create a reviewer-ready handoff.","Explain evidence and consequence through the Joiner-Mover-Leaver Closure Checklist."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: Module 1: Joiner-Mover-Leaver Closure Checklist Workplace Build
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-066' LIMIT 1),
  'Module 1: Joiner-Mover-Leaver Closure Checklist Workplace Build',
  'Trigger: An employee lifecycle coordinator receives 16 joiner-mover-leaver closure records in JML tracker, HRIS, IT access list, payroll handoff sheet and document checklist; 5 show joining document pending, 2 show mover access change not confirmed, and 1 show leaver clearance not signed. Pressure: The team needs a safe first check same working day so the reviewer does not waste time on incomplete evidence. Actuals: Volume: 16 records/cases. Issue count 1: 5 with joining document pending. Issue count 2: 2 with mover access change not confirmed. Issue count 3: 1 with leaver clearance not signed. Systems/documents: JML tracker, HRIS, IT access list, payroll handoff sheet and document checklist. Decision needed: ready, return, block, or escalate. Time pressure: same working day.',
  1,
  '["HR & Workforce Services","HR & Workforce Services","HR Operations & Employee Lifecycle Specialists; People Systems, HRIS & Service Delivery Specialists","HR Operations Specialist; HR Specialist; Employee Lifecycle Specialist; Offboarding Specialist; HRIS Specialist","IND-CAP-14","Joiner-Mover-Leaver Closure Checklist","Functional","Technical","Behavioural","Cognitive","Evidence"]'::jsonb,
  '["Start with the live trigger: 16 records arrive, 8 have visible issues, and a stakeholder needs an answer same working day.","Learner studies the actual data points: lifecycle trigger, service-owner tasks, access/equipment/payroll dependencies, status tracker, blocker log, closure confirmation; then highlights missing fields, conflicts, late inputs, and owner gaps.","Teach the artifact logic: what each section means, which evidence is mandatory, what numbers must reconcile, and what the learner is allowed to decide at L1.","Learner completes the Joiner-Mover-Leaver Closure Checklist using the case numbers, source references, exception labels, owner notes, and a clear ready/return/block/escalate recommendation.","Learner uses AI only for checklist prompts, concept reminders, and rubric self-checks. AI must not invent records, calculate unsupported numbers, approve decisions, or replace the learner''s judgement.","Learner reflects on what changed at L1: volume, exception complexity, stakeholder pressure, authority boundary, and evidence quality compared with the previous level."]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Joiner-Mover-Leaver Closure: Guided Practice: Data, Concepts and Artifact Evidence
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-066' LIMIT 1)
   AND title = 'Module 1: Joiner-Mover-Leaver Closure Checklist Workplace Build' LIMIT 1),
  'Joiner-Mover-Leaver Closure: Guided Practice: Data, Concepts and Artifact Evidence',
  'Learner confusion: Students may understand the HR term but may not know how to read 16 messy records, compare source fields, quantify exceptions, choose proceed/return/escalate, or write the evidence trail in simple reviewer language. Root-cause focus: Investigate whether the real cause is missing source data, wrong effective date, unclear owner, system mismatch, late submission, policy/control risk, or weak handoff evidence in JML tracker, HRIS, IT access list, payroll handoff sheet and document checklist.',
  'Problem: An employee lifecycle coordinator is handling 16 joiner-mover-leaver closure records in JML tracker, HRIS, IT access list, payroll handoff sheet and document checklist. The file is messy: 5 records have joining document pending, 2 have mover access change not confirmed, 1 have leaver clearance not signed, and some cases also show payroll stop or start date unclear. The team needs a safe first check same working day so the reviewer does not waste time on incomplete evidence. The learner must check required inputs, mark missing items, prepare a supervised draft, and request reviewer guidance, then prepare a Joiner-Mover-Leaver Closure Checklist, and clearly mark which items are ready, returned, blocked, or escalated. If handled poorly, new joiners may not be ready, movers may keep wrong access, or leavers may remain active in systems. Actuals: Volume: 16 records/cases. Issue count 1: 5 with joining document pending. Issue count 2: 2 with mover access change not confirmed. Issue count 3: 1 with leaver clearance not signed. Systems/documents: JML tracker, HRIS, IT access list, payroll handoff sheet and document checklist. Decision needed: ready, return, block, or escalate. Time pressure: same working day. Major concepts: joiner-mover-leaver workflow - needed to complete and defend the Joiner-Mover-Leaver Closure Checklist; lifecycle trigger control - needed to complete and defend the Joiner-Mover-Leaver Closure Checklist; access and payroll dependency - needed to complete and defend the Joiner-Mover-Leaver Closure Checklist; document checklist logic - needed to complete and defend the Joiner-Mover-Leaver Closure Checklist; start-stop date validation - needed to complete and defend the Joiner-Mover-Leaver Closure Checklist; handoff ownership - needed to complete and defend the Joiner-Mover-Leaver Closure Checklist; closure status coding - needed to complete and defend the Joiner-Mover-Leaver Closure Checklist; audit-ready JML evidence - needed to complete and defend the Joiner-Mover-Leaver Closure Checklist Concept-to-artifact link: These concepts are not theory-only. They tell the learner what to check inside the Joiner-Mover-Leaver Closure Checklist: source data, missing fields, exception rules, owner notes, decision status, handoff logic, and reviewer evidence. Required data: To solve the artifact, learner needs: lifecycle trigger, service-owner tasks, access/equipment/payroll dependencies, status tracker, blocker log, closure confirmation; system screenshots or exports from JML tracker, HRIS, IT access list, payroll handoff sheet and document checklist; policy or checklist rule used; stakeholder request; deadline/cut-off; prior status if available; reviewer or owner name; evidence of any unresolved exception. Artifact structure: Joiner-Mover-Leaver Closure Checklist must contain: case or employee/candidate/worker identifier; source document reference; required data fields (lifecycle trigger, service-owner tasks, access/equipment/payroll dependencies, status tracker, blocker log, closure confirmation); missing or conflicting item log; numeric issue count; exception category; owner/action note; proceed/return/block/escalate status; reviewer handoff note; closure or follow-up date. How to read artifact: Read the artifact as the learner''s final workplace proof. First check the identifiers and source documents, then the required fields, then the issue count and exception category, then the decision status, and finally whether the handoff note gives a reviewer enough evidence to act. Evidence fields: Assess whether the Joiner-Mover-Leaver Closure Checklist uses the right source data, includes all required fields, counts and labels the 8 issue records correctly, separates normal items from exceptions, gives a clear decision reason, respects the L1 authority boundary, and provides a usable reviewer handoff. AI coach boundary: AI can ask: Which source proves this field? Which 5 records are blocked? What is the decision reason? What evidence is still missing? AI can summarize checklist gaps and suggest clearer wording, but cannot create missing data, approve the case, override policy, or make the final HR/payroll/compliance decision. Traceability: Industry: HR & Workforce Services.|Domain: HR & Workforce Services.|Role: HR Operations Specialist; HR Specialist; Employee Lifecycle Specialist; Offboarding Specialist; HRIS Specialist.|Capability_ID: IND-CAP-14.|Level: L1.|Course_ID: IND-S5-C-066.|Artifact: Joiner-Mover-Leaver Closure Checklist.|Source Sheet: L1_COURSE_PATTERN.',
  1,
  '8 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BBA Human Resource Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-066' LIMIT 1),
  'BBA Human Resource Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MBA Human Resource Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-066' LIMIT 1),
  'MBA Human Resource Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PGDM Human Resource Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-066' LIMIT 1),
  'PGDM Human Resource Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Com
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-066' LIMIT 1),
  'B.Com',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BCA / B.Sc Information Technology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-066' LIMIT 1),
  'BCA / B.Sc Information Technology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: HR Service Case Resolution: Guided Practice
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'HR Service Case Resolution: Guided Practice',
  'IND-S5-C-071',
  'Learner can complete guided check with supervisor review for HR Service Case Resolution and produce a reviewer-ready HR Service Case Resolution Note with clear evidence and handoff logic. Workplace scenario: An HR service desk analyst is handling 12 HR service case resolution records in HR service ticketing tool, policy knowledge base, employee query history and SLA dashboard. The file is messy: 3 records have employee query has incomplete facts, 3 have policy article does not match employee category, 2 have SLA timer is close to breach, and some cases also show previous response gave unclear guidance. The team needs a safe first check same working day so the reviewer does not waste time on incomplete evidence. The learner must check required inputs, mark missing items, prepare a supervised draft, and request reviewer guidance, then prepare a HR Service Case Resolution Note, and clearly mark which items are ready, returned, blocked, or escalated. If handled poorly, the case may breach SLA, provide wrong guidance, or reopen because the answer is incomplete. Artifact proof: HR Service Case Resolution Note. Competency taxonomy: Functional; Technical; Behavioural; Cognitive; Evidence.',
  '8 hours',
  'Active',
  'HR Operations & HRIS Services',
  'soft',
  '["Learner can complete guided check with supervisor review for HR Service Case Resolution and produce a reviewer-ready HR Service Case Resolution Note with clear evidence and handoff logic.","Create a reviewer-ready HR Service Case Resolution Note.","Use source data to resolve the skill gap: Learner must convert HR service case resolution knowledge into a usable HR Service Case Resolution Note: check employee query, policy reference, service-level timeline, action taken, identify missing or conflicting records, explain the level boundary, and create a reviewer-ready handoff.","Explain evidence and consequence through the HR Service Case Resolution Note."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: Module 1: HR Service Case Resolution Note Workplace Build
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-071' LIMIT 1),
  'Module 1: HR Service Case Resolution Note Workplace Build',
  'Trigger: An HR service desk analyst receives 12 HR service case resolution records in HR service ticketing tool, policy knowledge base, employee query history and SLA dashboard; 3 show employee query has incomplete facts, 3 show policy article does not match employee category, and 2 show SLA timer is close to breach. Pressure: The team needs a safe first check same working day so the reviewer does not waste time on incomplete evidence. Actuals: Volume: 12 records/cases. Issue count 1: 3 with employee query has incomplete facts. Issue count 2: 3 with policy article does not match employee category. Issue count 3: 2 with SLA timer is close to breach. Systems/documents: HR service ticketing tool, policy knowledge base, employee query history and SLA dashboard. Decision needed: ready, return, block, or escalate. Time pressure: same working day.',
  1,
  '["HR & Workforce Services","HR Operations & HRIS Services","HR Operations & Employee Lifecycle Specialists; People Systems, HRIS & Service Delivery Specialists","HR Operations Specialist; HR Specialist; Employee Lifecycle Specialist; Offboarding Specialist; HRIS Specialist","IND-CAP-15","HR Service Case Resolution Note","Functional","Technical","Behavioural","Cognitive","Evidence"]'::jsonb,
  '["Start with the live trigger: 12 records arrive, 8 have visible issues, and a stakeholder needs an answer same working day.","Learner studies the actual data points: employee query, policy reference, service-level timeline, action taken, escalation decision, employee response and closure proof; then highlights missing fields, conflicts, late inputs, and owner gaps.","Teach the artifact logic: what each section means, which evidence is mandatory, what numbers must reconcile, and what the learner is allowed to decide at L1.","Learner completes the HR Service Case Resolution Note using the case numbers, source references, exception labels, owner notes, and a clear ready/return/block/escalate recommendation.","Learner uses AI only for checklist prompts, concept reminders, and rubric self-checks. AI must not invent records, calculate unsupported numbers, approve decisions, or replace the learner''s judgement.","Learner reflects on what changed at L1: volume, exception complexity, stakeholder pressure, authority boundary, and evidence quality compared with the previous level."]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: HR Service Case Resolution: Guided Practice: Data, Concepts and Artifact Evidence
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-071' LIMIT 1)
   AND title = 'Module 1: HR Service Case Resolution Note Workplace Build' LIMIT 1),
  'HR Service Case Resolution: Guided Practice: Data, Concepts and Artifact Evidence',
  'Learner confusion: Students may understand the HR term but may not know how to read 12 messy records, compare source fields, quantify exceptions, choose proceed/return/escalate, or write the evidence trail in simple reviewer language. Root-cause focus: Investigate whether the real cause is missing source data, wrong effective date, unclear owner, system mismatch, late submission, policy/control risk, or weak handoff evidence in HR service ticketing tool, policy knowledge base, employee query history and SLA dashboard.',
  'Problem: An HR service desk analyst is handling 12 HR service case resolution records in HR service ticketing tool, policy knowledge base, employee query history and SLA dashboard. The file is messy: 3 records have employee query has incomplete facts, 3 have policy article does not match employee category, 2 have SLA timer is close to breach, and some cases also show previous response gave unclear guidance. The team needs a safe first check same working day so the reviewer does not waste time on incomplete evidence. The learner must check required inputs, mark missing items, prepare a supervised draft, and request reviewer guidance, then prepare a HR Service Case Resolution Note, and clearly mark which items are ready, returned, blocked, or escalated. If handled poorly, the case may breach SLA, provide wrong guidance, or reopen because the answer is incomplete. Actuals: Volume: 12 records/cases. Issue count 1: 3 with employee query has incomplete facts. Issue count 2: 3 with policy article does not match employee category. Issue count 3: 2 with SLA timer is close to breach. Systems/documents: HR service ticketing tool, policy knowledge base, employee query history and SLA dashboard. Decision needed: ready, return, block, or escalate. Time pressure: same working day. Major concepts: HR service case triage - needed to complete and defend the HR Service Case Resolution Note; SLA clock logic - needed to complete and defend the HR Service Case Resolution Note; policy matching - needed to complete and defend the HR Service Case Resolution Note; employee-category dependency - needed to complete and defend the HR Service Case Resolution Note; case-note quality - needed to complete and defend the HR Service Case Resolution Note; resolution versus escalation decision - needed to complete and defend the HR Service Case Resolution Note; reopen prevention - needed to complete and defend the HR Service Case Resolution Note; service evidence trail - needed to complete and defend the HR Service Case Resolution Note Concept-to-artifact link: These concepts are not theory-only. They tell the learner what to check inside the HR Service Case Resolution Note: source data, missing fields, exception rules, owner notes, decision status, handoff logic, and reviewer evidence. Required data: To solve the artifact, learner needs: employee query, policy reference, service-level timeline, action taken, escalation decision, employee response and closure proof; system screenshots or exports from HR service ticketing tool, policy knowledge base, employee query history and SLA dashboard; policy or checklist rule used; stakeholder request; deadline/cut-off; prior status if available; reviewer or owner name; evidence of any unresolved exception. Artifact structure: HR Service Case Resolution Note must contain: case or employee/candidate/worker identifier; source document reference; required data fields (employee query, policy reference, service-level timeline, action taken, escalation decision, employee response and closure proof); missing or conflicting item log; numeric issue count; exception category; owner/action note; proceed/return/block/escalate status; reviewer handoff note; closure or follow-up date. How to read artifact: Read the artifact as the learner''s final workplace proof. First check the identifiers and source documents, then the required fields, then the issue count and exception category, then the decision status, and finally whether the handoff note gives a reviewer enough evidence to act. Evidence fields: Assess whether the HR Service Case Resolution Note uses the right source data, includes all required fields, counts and labels the 8 issue records correctly, separates normal items from exceptions, gives a clear decision reason, respects the L1 authority boundary, and provides a usable reviewer handoff. AI coach boundary: AI can ask: Which source proves this field? Which 3 records are blocked? What is the decision reason? What evidence is still missing? AI can summarize checklist gaps and suggest clearer wording, but cannot create missing data, approve the case, override policy, or make the final HR/payroll/compliance decision. Traceability: Industry: HR & Workforce Services.|Domain: HR Operations & HRIS Services.|Role: HR Operations Specialist; HR Specialist; Employee Lifecycle Specialist; Offboarding Specialist; HRIS Specialist.|Capability_ID: IND-CAP-15.|Level: L1.|Course_ID: IND-S5-C-071.|Artifact: HR Service Case Resolution Note.|Source Sheet: L1_COURSE_PATTERN.',
  1,
  '8 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BBA Human Resource Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-071' LIMIT 1),
  'BBA Human Resource Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MBA Human Resource Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-071' LIMIT 1),
  'MBA Human Resource Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BCA
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-071' LIMIT 1),
  'BCA',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Information Technology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-071' LIMIT 1),
  'B.Sc Information Technology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BBA Business Analytics
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-071' LIMIT 1),
  'BBA Business Analytics',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PGDM HR Analytics
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-071' LIMIT 1),
  'PGDM HR Analytics',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: ATS-HRIS Field Mapping Reconciliation: Guided Practice
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'ATS-HRIS Field Mapping Reconciliation: Guided Practice',
  'IND-S5-C-076',
  'Learner can complete guided check with supervisor review for ATS-HRIS Data Sync and produce a reviewer-ready ATS-HRIS Field Mapping Reconciliation Sheet with clear evidence and handoff logic. Workplace scenario: An HRIS analyst is handling 13 ATS-HRIS field mapping reconciliation records in ATS export, HRIS import template, integration error report and field-mapping sheet. The file is messy: 4 records have candidate ID not matching employee ID, 2 have job code mapped to wrong HRIS field, 1 have start date format rejected, and some cases also show department code missing from source. The team needs a safe first check same working day so the reviewer does not waste time on incomplete evidence. The learner must check required inputs, mark missing items, prepare a supervised draft, and request reviewer guidance, then prepare a ATS-HRIS Field Mapping Reconciliation Sheet, and clearly mark which items are ready, returned, blocked, or escalated. If handled poorly, employee records may be created incorrectly or onboarding and payroll downstream tasks may fail. Artifact proof: ATS-HRIS Field Mapping Reconciliation Sheet. Competency taxonomy: Functional; Technical; Behavioural; Cognitive; Evidence.',
  '8 hours',
  'Active',
  'HR Operations & HRIS Services',
  'technical',
  '["Learner can complete guided check with supervisor review for ATS-HRIS Data Sync and produce a reviewer-ready ATS-HRIS Field Mapping Reconciliation Sheet with clear evidence and handoff logic.","Create a reviewer-ready ATS-HRIS Field Mapping Reconciliation Sheet.","Use source data to resolve the skill gap: Learner must convert ATS-HRIS field mapping reconciliation knowledge into a usable ATS-HRIS Field Mapping Reconciliation Sheet: check source/target field map, failed records, mismatch reason, correction action, identify missing or conflicting records, explain the level boundary, and create a reviewer-ready handoff.","Explain evidence and consequence through the ATS-HRIS Field Mapping Reconciliation Sheet."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: Module 1: ATS-HRIS Field Mapping Reconciliation Sheet Workplace Build
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-076' LIMIT 1),
  'Module 1: ATS-HRIS Field Mapping Reconciliation Sheet Workplace Build',
  'Trigger: An HRIS analyst receives 13 ATS-HRIS field mapping reconciliation records in ATS export, HRIS import template, integration error report and field-mapping sheet; 4 show candidate ID not matching employee ID, 2 show job code mapped to wrong HRIS field, and 1 show start date format rejected. Pressure: The team needs a safe first check same working day so the reviewer does not waste time on incomplete evidence. Actuals: Volume: 13 records/cases. Issue count 1: 4 with candidate ID not matching employee ID. Issue count 2: 2 with job code mapped to wrong HRIS field. Issue count 3: 1 with start date format rejected. Systems/documents: ATS export, HRIS import template, integration error report and field-mapping sheet. Decision needed: ready, return, block, or escalate. Time pressure: same working day.',
  1,
  '["HR & Workforce Services","HR Operations & HRIS Services","HR Operations & Employee Lifecycle Specialists; People Systems, HRIS & Service Delivery Specialists","HR Operations Specialist; HR Specialist; Employee Lifecycle Specialist; Offboarding Specialist; HRIS Specialist","IND-CAP-16","ATS-HRIS Field Mapping Reconciliation Sheet","Functional","Technical","Behavioural","Cognitive","Evidence"]'::jsonb,
  '["Start with the live trigger: 13 records arrive, 7 have visible issues, and a stakeholder needs an answer same working day.","Learner studies the actual data points: source/target field map, failed records, mismatch reason, correction action, sync retest result, downstream control note; then highlights missing fields, conflicts, late inputs, and owner gaps.","Teach the artifact logic: what each section means, which evidence is mandatory, what numbers must reconcile, and what the learner is allowed to decide at L1.","Learner completes the ATS-HRIS Field Mapping Reconciliation Sheet using the case numbers, source references, exception labels, owner notes, and a clear ready/return/block/escalate recommendation.","Learner uses AI only for checklist prompts, concept reminders, and rubric self-checks. AI must not invent records, calculate unsupported numbers, approve decisions, or replace the learner''s judgement.","Learner reflects on what changed at L1: volume, exception complexity, stakeholder pressure, authority boundary, and evidence quality compared with the previous level."]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: ATS-HRIS Field Mapping Reconciliation: Guided Practice: Data, Concepts and Artifact Evidence
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-076' LIMIT 1)
   AND title = 'Module 1: ATS-HRIS Field Mapping Reconciliation Sheet Workplace Build' LIMIT 1),
  'ATS-HRIS Field Mapping Reconciliation: Guided Practice: Data, Concepts and Artifact Evidence',
  'Learner confusion: Students may understand the HR term but may not know how to read 13 messy records, compare source fields, quantify exceptions, choose proceed/return/escalate, or write the evidence trail in simple reviewer language. Root-cause focus: Investigate whether the real cause is missing source data, wrong effective date, unclear owner, system mismatch, late submission, policy/control risk, or weak handoff evidence in ATS export, HRIS import template, integration error report and field-mapping sheet.',
  'Problem: An HRIS analyst is handling 13 ATS-HRIS field mapping reconciliation records in ATS export, HRIS import template, integration error report and field-mapping sheet. The file is messy: 4 records have candidate ID not matching employee ID, 2 have job code mapped to wrong HRIS field, 1 have start date format rejected, and some cases also show department code missing from source. The team needs a safe first check same working day so the reviewer does not waste time on incomplete evidence. The learner must check required inputs, mark missing items, prepare a supervised draft, and request reviewer guidance, then prepare a ATS-HRIS Field Mapping Reconciliation Sheet, and clearly mark which items are ready, returned, blocked, or escalated. If handled poorly, employee records may be created incorrectly or onboarding and payroll downstream tasks may fail. Actuals: Volume: 13 records/cases. Issue count 1: 4 with candidate ID not matching employee ID. Issue count 2: 2 with job code mapped to wrong HRIS field. Issue count 3: 1 with start date format rejected. Systems/documents: ATS export, HRIS import template, integration error report and field-mapping sheet. Decision needed: ready, return, block, or escalate. Time pressure: same working day. Major concepts: ATS-HRIS integration flow - needed to complete and defend the ATS-HRIS Field Mapping Reconciliation Sheet; field mapping - needed to complete and defend the ATS-HRIS Field Mapping Reconciliation Sheet; unique identifier matching - needed to complete and defend the ATS-HRIS Field Mapping Reconciliation Sheet; data type and format validation - needed to complete and defend the ATS-HRIS Field Mapping Reconciliation Sheet; job and department code control - needed to complete and defend the ATS-HRIS Field Mapping Reconciliation Sheet; import error classification - needed to complete and defend the ATS-HRIS Field Mapping Reconciliation Sheet; reconciliation evidence - needed to complete and defend the ATS-HRIS Field Mapping Reconciliation Sheet; sync quality gate - needed to complete and defend the ATS-HRIS Field Mapping Reconciliation Sheet Concept-to-artifact link: These concepts are not theory-only. They tell the learner what to check inside the ATS-HRIS Field Mapping Reconciliation Sheet: source data, missing fields, exception rules, owner notes, decision status, handoff logic, and reviewer evidence. Required data: To solve the artifact, learner needs: source/target field map, failed records, mismatch reason, correction action, sync retest result, downstream control note; system screenshots or exports from ATS export, HRIS import template, integration error report and field-mapping sheet; policy or checklist rule used; stakeholder request; deadline/cut-off; prior status if available; reviewer or owner name; evidence of any unresolved exception. Artifact structure: ATS-HRIS Field Mapping Reconciliation Sheet must contain: case or employee/candidate/worker identifier; source document reference; required data fields (source/target field map, failed records, mismatch reason, correction action, sync retest result, downstream control note); missing or conflicting item log; numeric issue count; exception category; owner/action note; proceed/return/block/escalate status; reviewer handoff note; closure or follow-up date. How to read artifact: Read the artifact as the learner''s final workplace proof. First check the identifiers and source documents, then the required fields, then the issue count and exception category, then the decision status, and finally whether the handoff note gives a reviewer enough evidence to act. Evidence fields: Assess whether the ATS-HRIS Field Mapping Reconciliation Sheet uses the right source data, includes all required fields, counts and labels the 7 issue records correctly, separates normal items from exceptions, gives a clear decision reason, respects the L1 authority boundary, and provides a usable reviewer handoff. AI coach boundary: AI can ask: Which source proves this field? Which 4 records are blocked? What is the decision reason? What evidence is still missing? AI can summarize checklist gaps and suggest clearer wording, but cannot create missing data, approve the case, override policy, or make the final HR/payroll/compliance decision. Traceability: Industry: HR & Workforce Services.|Domain: HR Operations & HRIS Services.|Role: HR Operations Specialist; HR Specialist; Employee Lifecycle Specialist; Offboarding Specialist; HRIS Specialist.|Capability_ID: IND-CAP-16.|Level: L1.|Course_ID: IND-S5-C-076.|Artifact: ATS-HRIS Field Mapping Reconciliation Sheet.|Source Sheet: L1_COURSE_PATTERN.',
  1,
  '8 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BBA Human Resource Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-076' LIMIT 1),
  'BBA Human Resource Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MBA Human Resource Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-076' LIMIT 1),
  'MBA Human Resource Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BCA
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-076' LIMIT 1),
  'BCA',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Information Technology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-076' LIMIT 1),
  'B.Sc Information Technology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BBA Business Analytics
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-076' LIMIT 1),
  'BBA Business Analytics',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PGDM HR Analytics
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-076' LIMIT 1),
  'PGDM HR Analytics',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: People Advisory Risk Action: Guided Practice
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'People Advisory Risk Action: Guided Practice',
  'IND-S5-C-081',
  'Learner can complete guided check with supervisor review for Translate Manager People-Advisory Requests Into Risk-Aware and produce a reviewer-ready People Advisory Risk Action Plan with clear evidence and handoff logic. Workplace scenario: A people advisory consultant is handling 14 people advisory risk action planning records in manager case notes, HR policy guide, employee history, performance notes and risk tracker. The file is messy: 5 records have manager request is vague, 3 have employee history has repeated concerns, 2 have policy route is unclear, and some cases also show risk level not documented. The team needs a safe first check same working day so the reviewer does not waste time on incomplete evidence. The learner must check required inputs, mark missing items, prepare a supervised draft, and request reviewer guidance, then prepare a People Advisory Risk Action Plan, and clearly mark which items are ready, returned, blocked, or escalated. If handled poorly, the advice may create employee relations risk, inconsistent manager action, or weak documentation. Artifact proof: People Advisory Risk Action Plan. Competency taxonomy: Functional; Technical; Behavioural; Cognitive; Evidence.',
  '8 hours',
  'Active',
  'HR & Workforce Services',
  'soft',
  '["Learner can complete guided check with supervisor review for Translate Manager People-Advisory Requests Into Risk-Aware and produce a reviewer-ready People Advisory Risk Action Plan with clear evidence and handoff logic.","Create a reviewer-ready People Advisory Risk Action Plan.","Use source data to resolve the skill gap: Learner must convert people advisory risk action planning knowledge into a usable People Advisory Risk Action Plan: check manager request, policy context, employee impact, risk classification, identify missing or conflicting records, explain the level boundary, and create a reviewer-ready handoff.","Explain evidence and consequence through the People Advisory Risk Action Plan."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: Module 1: People Advisory Risk Action Plan Workplace Build
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-081' LIMIT 1),
  'Module 1: People Advisory Risk Action Plan Workplace Build',
  'Trigger: A people advisory consultant receives 14 people advisory risk action planning records in manager case notes, HR policy guide, employee history, performance notes and risk tracker; 5 show manager request is vague, 3 show employee history has repeated concerns, and 2 show policy route is unclear. Pressure: The team needs a safe first check same working day so the reviewer does not waste time on incomplete evidence. Actuals: Volume: 14 records/cases. Issue count 1: 5 with manager request is vague. Issue count 2: 3 with employee history has repeated concerns. Issue count 3: 2 with policy route is unclear. Systems/documents: manager case notes, HR policy guide, employee history, performance notes and risk tracker. Decision needed: ready, return, block, or escalate. Time pressure: same working day.',
  1,
  '["HR & Workforce Services","HR & Workforce Services","HR Business Partners & People Advisory Consultants; Workforce Planning Analysts & Consultants","HR Business Partner; HR Consultant; People Advisory Consultant; HR Specialist; Workforce Planning Analyst","IND-CAP-17","People Advisory Risk Action Plan","Functional","Technical","Behavioural","Cognitive","Evidence"]'::jsonb,
  '["Start with the live trigger: 14 records arrive, 10 have visible issues, and a stakeholder needs an answer same working day.","Learner studies the actual data points: manager request, policy context, employee impact, risk classification, recommended actions, communication and escalation plan; then highlights missing fields, conflicts, late inputs, and owner gaps.","Teach the artifact logic: what each section means, which evidence is mandatory, what numbers must reconcile, and what the learner is allowed to decide at L1.","Learner completes the People Advisory Risk Action Plan using the case numbers, source references, exception labels, owner notes, and a clear ready/return/block/escalate recommendation.","Learner uses AI only for checklist prompts, concept reminders, and rubric self-checks. AI must not invent records, calculate unsupported numbers, approve decisions, or replace the learner''s judgement.","Learner reflects on what changed at L1: volume, exception complexity, stakeholder pressure, authority boundary, and evidence quality compared with the previous level."]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: People Advisory Risk Action: Guided Practice: Data, Concepts and Artifact Evidence
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-081' LIMIT 1)
   AND title = 'Module 1: People Advisory Risk Action Plan Workplace Build' LIMIT 1),
  'People Advisory Risk Action: Guided Practice: Data, Concepts and Artifact Evidence',
  'Learner confusion: Students may understand the HR term but may not know how to read 14 messy records, compare source fields, quantify exceptions, choose proceed/return/escalate, or write the evidence trail in simple reviewer language. Root-cause focus: Investigate whether the real cause is missing source data, wrong effective date, unclear owner, system mismatch, late submission, policy/control risk, or weak handoff evidence in manager case notes, HR policy guide, employee history, performance notes and risk tracker.',
  'Problem: A people advisory consultant is handling 14 people advisory risk action planning records in manager case notes, HR policy guide, employee history, performance notes and risk tracker. The file is messy: 5 records have manager request is vague, 3 have employee history has repeated concerns, 2 have policy route is unclear, and some cases also show risk level not documented. The team needs a safe first check same working day so the reviewer does not waste time on incomplete evidence. The learner must check required inputs, mark missing items, prepare a supervised draft, and request reviewer guidance, then prepare a People Advisory Risk Action Plan, and clearly mark which items are ready, returned, blocked, or escalated. If handled poorly, the advice may create employee relations risk, inconsistent manager action, or weak documentation. Actuals: Volume: 14 records/cases. Issue count 1: 5 with manager request is vague. Issue count 2: 3 with employee history has repeated concerns. Issue count 3: 2 with policy route is unclear. Systems/documents: manager case notes, HR policy guide, employee history, performance notes and risk tracker. Decision needed: ready, return, block, or escalate. Time pressure: same working day. Major concepts: people advisory intake - needed to complete and defend the People Advisory Risk Action Plan; risk classification - needed to complete and defend the People Advisory Risk Action Plan; policy route selection - needed to complete and defend the People Advisory Risk Action Plan; manager guidance boundary - needed to complete and defend the People Advisory Risk Action Plan; employee history review - needed to complete and defend the People Advisory Risk Action Plan; action option comparison - needed to complete and defend the People Advisory Risk Action Plan; documentation standard - needed to complete and defend the People Advisory Risk Action Plan; escalation trigger - needed to complete and defend the People Advisory Risk Action Plan Concept-to-artifact link: These concepts are not theory-only. They tell the learner what to check inside the People Advisory Risk Action Plan: source data, missing fields, exception rules, owner notes, decision status, handoff logic, and reviewer evidence. Required data: To solve the artifact, learner needs: manager request, policy context, employee impact, risk classification, recommended actions, communication and escalation plan; system screenshots or exports from manager case notes, HR policy guide, employee history, performance notes and risk tracker; policy or checklist rule used; stakeholder request; deadline/cut-off; prior status if available; reviewer or owner name; evidence of any unresolved exception. Artifact structure: People Advisory Risk Action Plan must contain: case or employee/candidate/worker identifier; source document reference; required data fields (manager request, policy context, employee impact, risk classification, recommended actions, communication and escalation plan); missing or conflicting item log; numeric issue count; exception category; owner/action note; proceed/return/block/escalate status; reviewer handoff note; closure or follow-up date. How to read artifact: Read the artifact as the learner''s final workplace proof. First check the identifiers and source documents, then the required fields, then the issue count and exception category, then the decision status, and finally whether the handoff note gives a reviewer enough evidence to act. Evidence fields: Assess whether the People Advisory Risk Action Plan uses the right source data, includes all required fields, counts and labels the 10 issue records correctly, separates normal items from exceptions, gives a clear decision reason, respects the L1 authority boundary, and provides a usable reviewer handoff. AI coach boundary: AI can ask: Which source proves this field? Which 5 records are blocked? What is the decision reason? What evidence is still missing? AI can summarize checklist gaps and suggest clearer wording, but cannot create missing data, approve the case, override policy, or make the final HR/payroll/compliance decision. Traceability: Industry: HR & Workforce Services.|Domain: HR & Workforce Services.|Role: HR Business Partner; HR Consultant; People Advisory Consultant; HR Specialist; Workforce Planning Analyst.|Capability_ID: IND-CAP-17.|Level: L1.|Course_ID: IND-S5-C-081.|Artifact: People Advisory Risk Action Plan.|Source Sheet: L1_COURSE_PATTERN.',
  1,
  '8 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MBA Human Resource Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-081' LIMIT 1),
  'MBA Human Resource Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PGDM Human Resource Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-081' LIMIT 1),
  'PGDM Human Resource Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MA Organisational Psychology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-081' LIMIT 1),
  'MA Organisational Psychology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MSW Human Resource Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-081' LIMIT 1),
  'MSW Human Resource Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BBA Human Resource Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-081' LIMIT 1),
  'BBA Human Resource Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Organization Change Impact & Communication Map: Guided Practice
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Organization Change Impact & Communication Map: Guided Practice',
  'IND-S5-C-086',
  'Learner can complete guided check with supervisor review for Organization Change Impact and produce a reviewer-ready Organization Change Impact & Communication Map with clear evidence and handoff logic. Workplace scenario: An organization change coordinator is handling 15 change impact and communication mapping records in org design change list, stakeholder map, role impact sheet and communication plan tracker. The file is messy: 3 records have affected teams not fully listed, 2 have role impact unclear, 1 have communication owner missing, and some cases also show change date conflicts with payroll or system cut-off. The team needs a safe first check same working day so the reviewer does not waste time on incomplete evidence. The learner must check required inputs, mark missing items, prepare a supervised draft, and request reviewer guidance, then prepare a Organization Change Impact & Communication Map, and clearly mark which items are ready, returned, blocked, or escalated. If handled poorly, employees may receive confusing messages or critical HR and system actions may be missed. Artifact proof: Organization Change Impact & Communication Map. Competency taxonomy: Functional; Technical; Behavioural; Cognitive; Evidence.',
  '8 hours',
  'Active',
  'People Advisory & Organisation Change',
  'soft',
  '["Learner can complete guided check with supervisor review for Organization Change Impact and produce a reviewer-ready Organization Change Impact & Communication Map with clear evidence and handoff logic.","Create a reviewer-ready Organization Change Impact & Communication Map.","Use source data to resolve the skill gap: Learner must convert change impact and communication mapping knowledge into a usable Organization Change Impact & Communication Map: check change summary, affected groups, people risks, message plan, identify missing or conflicting records, explain the level boundary, and create a reviewer-ready handoff.","Explain evidence and consequence through the Organization Change Impact & Communication Map."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: Module 1: Organization Change Impact & Communication Map Workplace Build
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-086' LIMIT 1),
  'Module 1: Organization Change Impact & Communication Map Workplace Build',
  'Trigger: An organization change coordinator receives 15 change impact and communication mapping records in org design change list, stakeholder map, role impact sheet and communication plan tracker; 3 show affected teams not fully listed, 2 show role impact unclear, and 1 show communication owner missing. Pressure: The team needs a safe first check same working day so the reviewer does not waste time on incomplete evidence. Actuals: Volume: 15 records/cases. Issue count 1: 3 with affected teams not fully listed. Issue count 2: 2 with role impact unclear. Issue count 3: 1 with communication owner missing. Systems/documents: org design change list, stakeholder map, role impact sheet and communication plan tracker. Decision needed: ready, return, block, or escalate. Time pressure: same working day.',
  1,
  '["HR & Workforce Services","People Advisory & Organisation Change","HR Business Partners & People Advisory Consultants; Workforce Planning Analysts & Consultants","HR Business Partner; HR Consultant; People Advisory Consultant; HR Specialist; Workforce Planning Analyst","IND-CAP-18","Organization Change Impact & Communication Map","Functional","Technical","Behavioural","Cognitive","Evidence"]'::jsonb,
  '["Start with the live trigger: 15 records arrive, 6 have visible issues, and a stakeholder needs an answer same working day.","Learner studies the actual data points: change summary, affected groups, people risks, message plan, stakeholder questions, escalation risks, action follow-up log; then highlights missing fields, conflicts, late inputs, and owner gaps.","Teach the artifact logic: what each section means, which evidence is mandatory, what numbers must reconcile, and what the learner is allowed to decide at L1.","Learner completes the Organization Change Impact & Communication Map using the case numbers, source references, exception labels, owner notes, and a clear ready/return/block/escalate recommendation.","Learner uses AI only for checklist prompts, concept reminders, and rubric self-checks. AI must not invent records, calculate unsupported numbers, approve decisions, or replace the learner''s judgement.","Learner reflects on what changed at L1: volume, exception complexity, stakeholder pressure, authority boundary, and evidence quality compared with the previous level."]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Organization Change Impact & Communication Map: Guided Practice: Data, Concepts and Artifact Evidence
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-086' LIMIT 1)
   AND title = 'Module 1: Organization Change Impact & Communication Map Workplace Build' LIMIT 1),
  'Organization Change Impact & Communication Map: Guided Practice: Data, Concepts and Artifact Evidence',
  'Learner confusion: Students may understand the HR term but may not know how to read 15 messy records, compare source fields, quantify exceptions, choose proceed/return/escalate, or write the evidence trail in simple reviewer language. Root-cause focus: Investigate whether the real cause is missing source data, wrong effective date, unclear owner, system mismatch, late submission, policy/control risk, or weak handoff evidence in org design change list, stakeholder map, role impact sheet and communication plan tracker.',
  'Problem: An organization change coordinator is handling 15 change impact and communication mapping records in org design change list, stakeholder map, role impact sheet and communication plan tracker. The file is messy: 3 records have affected teams not fully listed, 2 have role impact unclear, 1 have communication owner missing, and some cases also show change date conflicts with payroll or system cut-off. The team needs a safe first check same working day so the reviewer does not waste time on incomplete evidence. The learner must check required inputs, mark missing items, prepare a supervised draft, and request reviewer guidance, then prepare a Organization Change Impact & Communication Map, and clearly mark which items are ready, returned, blocked, or escalated. If handled poorly, employees may receive confusing messages or critical HR and system actions may be missed. Actuals: Volume: 15 records/cases. Issue count 1: 3 with affected teams not fully listed. Issue count 2: 2 with role impact unclear. Issue count 3: 1 with communication owner missing. Systems/documents: org design change list, stakeholder map, role impact sheet and communication plan tracker. Decision needed: ready, return, block, or escalate. Time pressure: same working day. Major concepts: change impact analysis - needed to complete and defend the Organization Change Impact & Communication Map; stakeholder mapping - needed to complete and defend the Organization Change Impact & Communication Map; role impact classification - needed to complete and defend the Organization Change Impact & Communication Map; communication sequencing - needed to complete and defend the Organization Change Impact & Communication Map; HR action dependency - needed to complete and defend the Organization Change Impact & Communication Map; cut-off date planning - needed to complete and defend the Organization Change Impact & Communication Map; owner assignment - needed to complete and defend the Organization Change Impact & Communication Map; change evidence map - needed to complete and defend the Organization Change Impact & Communication Map Concept-to-artifact link: These concepts are not theory-only. They tell the learner what to check inside the Organization Change Impact & Communication Map: source data, missing fields, exception rules, owner notes, decision status, handoff logic, and reviewer evidence. Required data: To solve the artifact, learner needs: change summary, affected groups, people risks, message plan, stakeholder questions, escalation risks, action follow-up log; system screenshots or exports from org design change list, stakeholder map, role impact sheet and communication plan tracker; policy or checklist rule used; stakeholder request; deadline/cut-off; prior status if available; reviewer or owner name; evidence of any unresolved exception. Artifact structure: Organization Change Impact & Communication Map must contain: case or employee/candidate/worker identifier; source document reference; required data fields (change summary, affected groups, people risks, message plan, stakeholder questions, escalation risks, action follow-up log); missing or conflicting item log; numeric issue count; exception category; owner/action note; proceed/return/block/escalate status; reviewer handoff note; closure or follow-up date. How to read artifact: Read the artifact as the learner''s final workplace proof. First check the identifiers and source documents, then the required fields, then the issue count and exception category, then the decision status, and finally whether the handoff note gives a reviewer enough evidence to act. Evidence fields: Assess whether the Organization Change Impact & Communication Map uses the right source data, includes all required fields, counts and labels the 6 issue records correctly, separates normal items from exceptions, gives a clear decision reason, respects the L1 authority boundary, and provides a usable reviewer handoff. AI coach boundary: AI can ask: Which source proves this field? Which 3 records are blocked? What is the decision reason? What evidence is still missing? AI can summarize checklist gaps and suggest clearer wording, but cannot create missing data, approve the case, override policy, or make the final HR/payroll/compliance decision. Traceability: Industry: HR & Workforce Services.|Domain: People Advisory & Organisation Change.|Role: HR Business Partner; HR Consultant; People Advisory Consultant; HR Specialist; Workforce Planning Analyst.|Capability_ID: IND-CAP-18.|Level: L1.|Course_ID: IND-S5-C-086.|Artifact: Organization Change Impact & Communication Map.|Source Sheet: L1_COURSE_PATTERN.',
  1,
  '8 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MBA Human Resource Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-086' LIMIT 1),
  'MBA Human Resource Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PGDM Organisation Development
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-086' LIMIT 1),
  'PGDM Organisation Development',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MA Organisational Psychology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-086' LIMIT 1),
  'MA Organisational Psychology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MSW Human Resource Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-086' LIMIT 1),
  'MSW Human Resource Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BBA Human Resource Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-086' LIMIT 1),
  'BBA Human Resource Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Workforce Gap: Guided Practice
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Workforce Gap: Guided Practice',
  'IND-S5-C-091',
  'Learner can complete guided check with supervisor review for Workforce Gap Planning and produce a reviewer-ready Workforce Gap Register with clear evidence and handoff logic. Workplace scenario: A workforce planning analyst is handling 16 workforce gap register preparation records in headcount plan, vacancy report, skills inventory, attrition data and demand forecast sheet. The file is messy: 4 records have forecast demand changed, 3 have vacancy list has stale roles, 2 have skills inventory is incomplete, and some cases also show attrition risk not linked to team capacity. The team needs a safe first check same working day so the reviewer does not waste time on incomplete evidence. The learner must check required inputs, mark missing items, prepare a supervised draft, and request reviewer guidance, then prepare a Workforce Gap Register, and clearly mark which items are ready, returned, blocked, or escalated. If handled poorly, hiring, redeployment, or training decisions may target the wrong workforce gap. Artifact proof: Workforce Gap Register. Competency taxonomy: Functional; Technical; Behavioural; Cognitive; Evidence.',
  '8 hours',
  'Active',
  'Workforce Planning & Learning Operations',
  'technical',
  '["Learner can complete guided check with supervisor review for Workforce Gap Planning and produce a reviewer-ready Workforce Gap Register with clear evidence and handoff logic.","Create a reviewer-ready Workforce Gap Register.","Use source data to resolve the skill gap: Learner must convert workforce gap register preparation knowledge into a usable Workforce Gap Register: check demand forecast, current headcount, capacity assumptions, gap calculation, identify missing or conflicting records, explain the level boundary, and create a reviewer-ready handoff.","Explain evidence and consequence through the Workforce Gap Register."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: Module 1: Workforce Gap Register Workplace Build
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-091' LIMIT 1),
  'Module 1: Workforce Gap Register Workplace Build',
  'Trigger: A workforce planning analyst receives 16 workforce gap register preparation records in headcount plan, vacancy report, skills inventory, attrition data and demand forecast sheet; 4 show forecast demand changed, 3 show vacancy list has stale roles, and 2 show skills inventory is incomplete. Pressure: The team needs a safe first check same working day so the reviewer does not waste time on incomplete evidence. Actuals: Volume: 16 records/cases. Issue count 1: 4 with forecast demand changed. Issue count 2: 3 with vacancy list has stale roles. Issue count 3: 2 with skills inventory is incomplete. Systems/documents: headcount plan, vacancy report, skills inventory, attrition data and demand forecast sheet. Decision needed: ready, return, block, or escalate. Time pressure: same working day.',
  1,
  '["HR & Workforce Services","Workforce Planning & Learning Operations","HR Business Partners & People Advisory Consultants; Workforce Planning Analysts & Consultants","HR Business Partner; HR Consultant; People Advisory Consultant; HR Specialist; Workforce Planning Analyst","IND-CAP-19","Workforce Gap Register","Functional","Technical","Behavioural","Cognitive","Evidence"]'::jsonb,
  '["Start with the live trigger: 16 records arrive, 9 have visible issues, and a stakeholder needs an answer same working day.","Learner studies the actual data points: demand forecast, current headcount, capacity assumptions, gap calculation, risk notes, hiring/redeployment recommendation; then highlights missing fields, conflicts, late inputs, and owner gaps.","Teach the artifact logic: what each section means, which evidence is mandatory, what numbers must reconcile, and what the learner is allowed to decide at L1.","Learner completes the Workforce Gap Register using the case numbers, source references, exception labels, owner notes, and a clear ready/return/block/escalate recommendation.","Learner uses AI only for checklist prompts, concept reminders, and rubric self-checks. AI must not invent records, calculate unsupported numbers, approve decisions, or replace the learner''s judgement.","Learner reflects on what changed at L1: volume, exception complexity, stakeholder pressure, authority boundary, and evidence quality compared with the previous level."]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workforce Gap: Guided Practice: Data, Concepts and Artifact Evidence
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-091' LIMIT 1)
   AND title = 'Module 1: Workforce Gap Register Workplace Build' LIMIT 1),
  'Workforce Gap: Guided Practice: Data, Concepts and Artifact Evidence',
  'Learner confusion: Students may understand the HR term but may not know how to read 16 messy records, compare source fields, quantify exceptions, choose proceed/return/escalate, or write the evidence trail in simple reviewer language. Root-cause focus: Investigate whether the real cause is missing source data, wrong effective date, unclear owner, system mismatch, late submission, policy/control risk, or weak handoff evidence in headcount plan, vacancy report, skills inventory, attrition data and demand forecast sheet.',
  'Problem: A workforce planning analyst is handling 16 workforce gap register preparation records in headcount plan, vacancy report, skills inventory, attrition data and demand forecast sheet. The file is messy: 4 records have forecast demand changed, 3 have vacancy list has stale roles, 2 have skills inventory is incomplete, and some cases also show attrition risk not linked to team capacity. The team needs a safe first check same working day so the reviewer does not waste time on incomplete evidence. The learner must check required inputs, mark missing items, prepare a supervised draft, and request reviewer guidance, then prepare a Workforce Gap Register, and clearly mark which items are ready, returned, blocked, or escalated. If handled poorly, hiring, redeployment, or training decisions may target the wrong workforce gap. Actuals: Volume: 16 records/cases. Issue count 1: 4 with forecast demand changed. Issue count 2: 3 with vacancy list has stale roles. Issue count 3: 2 with skills inventory is incomplete. Systems/documents: headcount plan, vacancy report, skills inventory, attrition data and demand forecast sheet. Decision needed: ready, return, block, or escalate. Time pressure: same working day. Major concepts: workforce supply-demand gap - needed to complete and defend the Workforce Gap Register; headcount plan versus actuals - needed to complete and defend the Workforce Gap Register; vacancy aging - needed to complete and defend the Workforce Gap Register; skills inventory quality - needed to complete and defend the Workforce Gap Register; attrition risk signal - needed to complete and defend the Workforce Gap Register; capacity prioritization - needed to complete and defend the Workforce Gap Register; gap severity rating - needed to complete and defend the Workforce Gap Register; workforce register evidence - needed to complete and defend the Workforce Gap Register Concept-to-artifact link: These concepts are not theory-only. They tell the learner what to check inside the Workforce Gap Register: source data, missing fields, exception rules, owner notes, decision status, handoff logic, and reviewer evidence. Required data: To solve the artifact, learner needs: demand forecast, current headcount, capacity assumptions, gap calculation, risk notes, hiring/redeployment recommendation; system screenshots or exports from headcount plan, vacancy report, skills inventory, attrition data and demand forecast sheet; policy or checklist rule used; stakeholder request; deadline/cut-off; prior status if available; reviewer or owner name; evidence of any unresolved exception. Artifact structure: Workforce Gap Register must contain: case or employee/candidate/worker identifier; source document reference; required data fields (demand forecast, current headcount, capacity assumptions, gap calculation, risk notes, hiring/redeployment recommendation); missing or conflicting item log; numeric issue count; exception category; owner/action note; proceed/return/block/escalate status; reviewer handoff note; closure or follow-up date. How to read artifact: Read the artifact as the learner''s final workplace proof. First check the identifiers and source documents, then the required fields, then the issue count and exception category, then the decision status, and finally whether the handoff note gives a reviewer enough evidence to act. Evidence fields: Assess whether the Workforce Gap Register uses the right source data, includes all required fields, counts and labels the 9 issue records correctly, separates normal items from exceptions, gives a clear decision reason, respects the L1 authority boundary, and provides a usable reviewer handoff. AI coach boundary: AI can ask: Which source proves this field? Which 4 records are blocked? What is the decision reason? What evidence is still missing? AI can summarize checklist gaps and suggest clearer wording, but cannot create missing data, approve the case, override policy, or make the final HR/payroll/compliance decision. Traceability: Industry: HR & Workforce Services.|Domain: Workforce Planning & Learning Operations.|Role: HR Business Partner; HR Consultant; People Advisory Consultant; HR Specialist; Workforce Planning Analyst.|Capability_ID: IND-CAP-19.|Level: L1.|Course_ID: IND-S5-C-091.|Artifact: Workforce Gap Register.|Source Sheet: L1_COURSE_PATTERN.',
  1,
  '8 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MBA Human Resource Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-091' LIMIT 1),
  'MBA Human Resource Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PGDM Human Resource Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-091' LIMIT 1),
  'PGDM Human Resource Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BBA Business Analytics
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-091' LIMIT 1),
  'BBA Business Analytics',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BA Economics
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-091' LIMIT 1),
  'BA Economics',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Statistics
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-091' LIMIT 1),
  'B.Sc Statistics',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PGDM Workforce Planning and Analytics
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-091' LIMIT 1),
  'PGDM Workforce Planning and Analytics',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Workforce Scenario Action Handoff: Guided Practice
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Workforce Scenario Action Handoff: Guided Practice',
  'IND-S5-C-096',
  'Learner can complete guided check with supervisor review for Translate Workforce Scenarios Into Accountable People-Action and produce a reviewer-ready Workforce Scenario Action Handoff Plan with clear evidence and handoff logic. Workplace scenario: A workforce planning analyst is handling 12 workforce scenario action handoff records in scenario model, people action tracker, redeployment list, hiring plan and learning plan. The file is messy: 5 records have scenario assumptions differ, 2 have cost impact not clear, 1 have redeployment owner missing, and some cases also show training action not linked to skills gap. The team needs a safe first check same working day so the reviewer does not waste time on incomplete evidence. The learner must check required inputs, mark missing items, prepare a supervised draft, and request reviewer guidance, then prepare a Workforce Scenario Action Handoff Plan, and clearly mark which items are ready, returned, blocked, or escalated. If handled poorly, the selected scenario may not turn into practical hiring, redeployment, or learning actions. Artifact proof: Workforce Scenario Action Handoff Plan. Competency taxonomy: Functional; Technical; Behavioural; Cognitive; Evidence.',
  '8 hours',
  'Active',
  'HR & Workforce Services',
  'soft',
  '["Learner can complete guided check with supervisor review for Translate Workforce Scenarios Into Accountable People-Action and produce a reviewer-ready Workforce Scenario Action Handoff Plan with clear evidence and handoff logic.","Create a reviewer-ready Workforce Scenario Action Handoff Plan.","Use source data to resolve the skill gap: Learner must convert workforce scenario action handoff knowledge into a usable Workforce Scenario Action Handoff Plan: check scenario assumptions, action owners, staffing/skill implications, priority decisions, identify missing or conflicting records, explain the level boundary, and create a reviewer-ready handoff.","Explain evidence and consequence through the Workforce Scenario Action Handoff Plan."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: Module 1: Workforce Scenario Action Handoff Plan Workplace Build
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-096' LIMIT 1),
  'Module 1: Workforce Scenario Action Handoff Plan Workplace Build',
  'Trigger: A workforce planning analyst receives 12 workforce scenario action handoff records in scenario model, people action tracker, redeployment list, hiring plan and learning plan; 5 show scenario assumptions differ, 2 show cost impact not clear, and 1 show redeployment owner missing. Pressure: The team needs a safe first check same working day so the reviewer does not waste time on incomplete evidence. Actuals: Volume: 12 records/cases. Issue count 1: 5 with scenario assumptions differ. Issue count 2: 2 with cost impact not clear. Issue count 3: 1 with redeployment owner missing. Systems/documents: scenario model, people action tracker, redeployment list, hiring plan and learning plan. Decision needed: ready, return, block, or escalate. Time pressure: same working day.',
  1,
  '["HR & Workforce Services","HR & Workforce Services","HR Business Partners & People Advisory Consultants; Workforce Planning Analysts & Consultants","HR Business Partner; HR Consultant; People Advisory Consultant; HR Specialist; Workforce Planning Analyst","IND-CAP-20","Workforce Scenario Action Handoff Plan","Functional","Technical","Behavioural","Cognitive","Evidence"]'::jsonb,
  '["Start with the live trigger: 12 records arrive, 8 have visible issues, and a stakeholder needs an answer same working day.","Learner studies the actual data points: scenario assumptions, action owners, staffing/skill implications, priority decisions, timeline, accountability tracker; then highlights missing fields, conflicts, late inputs, and owner gaps.","Teach the artifact logic: what each section means, which evidence is mandatory, what numbers must reconcile, and what the learner is allowed to decide at L1.","Learner completes the Workforce Scenario Action Handoff Plan using the case numbers, source references, exception labels, owner notes, and a clear ready/return/block/escalate recommendation.","Learner uses AI only for checklist prompts, concept reminders, and rubric self-checks. AI must not invent records, calculate unsupported numbers, approve decisions, or replace the learner''s judgement.","Learner reflects on what changed at L1: volume, exception complexity, stakeholder pressure, authority boundary, and evidence quality compared with the previous level."]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workforce Scenario Action Handoff: Guided Practice: Data, Concepts and Artifact Evidence
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-096' LIMIT 1)
   AND title = 'Module 1: Workforce Scenario Action Handoff Plan Workplace Build' LIMIT 1),
  'Workforce Scenario Action Handoff: Guided Practice: Data, Concepts and Artifact Evidence',
  'Learner confusion: Students may understand the HR term but may not know how to read 12 messy records, compare source fields, quantify exceptions, choose proceed/return/escalate, or write the evidence trail in simple reviewer language. Root-cause focus: Investigate whether the real cause is missing source data, wrong effective date, unclear owner, system mismatch, late submission, policy/control risk, or weak handoff evidence in scenario model, people action tracker, redeployment list, hiring plan and learning plan.',
  'Problem: A workforce planning analyst is handling 12 workforce scenario action handoff records in scenario model, people action tracker, redeployment list, hiring plan and learning plan. The file is messy: 5 records have scenario assumptions differ, 2 have cost impact not clear, 1 have redeployment owner missing, and some cases also show training action not linked to skills gap. The team needs a safe first check same working day so the reviewer does not waste time on incomplete evidence. The learner must check required inputs, mark missing items, prepare a supervised draft, and request reviewer guidance, then prepare a Workforce Scenario Action Handoff Plan, and clearly mark which items are ready, returned, blocked, or escalated. If handled poorly, the selected scenario may not turn into practical hiring, redeployment, or learning actions. Actuals: Volume: 12 records/cases. Issue count 1: 5 with scenario assumptions differ. Issue count 2: 2 with cost impact not clear. Issue count 3: 1 with redeployment owner missing. Systems/documents: scenario model, people action tracker, redeployment list, hiring plan and learning plan. Decision needed: ready, return, block, or escalate. Time pressure: same working day. Major concepts: workforce scenario comparison - needed to complete and defend the Workforce Scenario Action Handoff Plan; assumption validation - needed to complete and defend the Workforce Scenario Action Handoff Plan; people-action mapping - needed to complete and defend the Workforce Scenario Action Handoff Plan; cost and capacity impact - needed to complete and defend the Workforce Scenario Action Handoff Plan; redeployment logic - needed to complete and defend the Workforce Scenario Action Handoff Plan; learning action dependency - needed to complete and defend the Workforce Scenario Action Handoff Plan; handoff owner control - needed to complete and defend the Workforce Scenario Action Handoff Plan; scenario decision evidence - needed to complete and defend the Workforce Scenario Action Handoff Plan Concept-to-artifact link: These concepts are not theory-only. They tell the learner what to check inside the Workforce Scenario Action Handoff Plan: source data, missing fields, exception rules, owner notes, decision status, handoff logic, and reviewer evidence. Required data: To solve the artifact, learner needs: scenario assumptions, action owners, staffing/skill implications, priority decisions, timeline, accountability tracker; system screenshots or exports from scenario model, people action tracker, redeployment list, hiring plan and learning plan; policy or checklist rule used; stakeholder request; deadline/cut-off; prior status if available; reviewer or owner name; evidence of any unresolved exception. Artifact structure: Workforce Scenario Action Handoff Plan must contain: case or employee/candidate/worker identifier; source document reference; required data fields (scenario assumptions, action owners, staffing/skill implications, priority decisions, timeline, accountability tracker); missing or conflicting item log; numeric issue count; exception category; owner/action note; proceed/return/block/escalate status; reviewer handoff note; closure or follow-up date. How to read artifact: Read the artifact as the learner''s final workplace proof. First check the identifiers and source documents, then the required fields, then the issue count and exception category, then the decision status, and finally whether the handoff note gives a reviewer enough evidence to act. Evidence fields: Assess whether the Workforce Scenario Action Handoff Plan uses the right source data, includes all required fields, counts and labels the 8 issue records correctly, separates normal items from exceptions, gives a clear decision reason, respects the L1 authority boundary, and provides a usable reviewer handoff. AI coach boundary: AI can ask: Which source proves this field? Which 5 records are blocked? What is the decision reason? What evidence is still missing? AI can summarize checklist gaps and suggest clearer wording, but cannot create missing data, approve the case, override policy, or make the final HR/payroll/compliance decision. Traceability: Industry: HR & Workforce Services.|Domain: HR & Workforce Services.|Role: HR Business Partner; HR Consultant; People Advisory Consultant; HR Specialist; Workforce Planning Analyst.|Capability_ID: IND-CAP-20.|Level: L1.|Course_ID: IND-S5-C-096.|Artifact: Workforce Scenario Action Handoff Plan.|Source Sheet: L1_COURSE_PATTERN.',
  1,
  '8 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MBA Human Resource Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-096' LIMIT 1),
  'MBA Human Resource Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PGDM Human Resource Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-096' LIMIT 1),
  'PGDM Human Resource Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BBA Business Analytics
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-096' LIMIT 1),
  'BBA Business Analytics',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BA Economics
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-096' LIMIT 1),
  'BA Economics',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Statistics
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-096' LIMIT 1),
  'B.Sc Statistics',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PGDM Workforce Planning and Analytics
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-096' LIMIT 1),
  'PGDM Workforce Planning and Analytics',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Training Needs Analysis: Guided Practice
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Training Needs Analysis: Guided Practice',
  'IND-S5-C-101',
  'Learner can complete guided check with supervisor review for Training Needs Analysis and produce a reviewer-ready Training Needs Analysis Brief with clear evidence and handoff logic. Workplace scenario: An L&D analyst is handling 13 training needs analysis records in performance data, manager skill-gap inputs, employee role list, LMS history and business priority notes. The file is messy: 3 records have manager inputs are broad, 3 have performance issues are mixed with training needs, 2 have LMS completion history is incomplete, and some cases also show priority roles are not ranked. The team needs a safe first check same working day so the reviewer does not waste time on incomplete evidence. The learner must check required inputs, mark missing items, prepare a supervised draft, and request reviewer guidance, then prepare a Training Needs Analysis Brief, and clearly mark which items are ready, returned, blocked, or escalated. If handled poorly, training may be built for the wrong problem or miss the roles with highest need. Artifact proof: Training Needs Analysis Brief. Competency taxonomy: Functional; Technical; Behavioural; Cognitive; Evidence.',
  '8 hours',
  'Active',
  'Workforce Planning & Learning Operations',
  'technical',
  '["Learner can complete guided check with supervisor review for Training Needs Analysis and produce a reviewer-ready Training Needs Analysis Brief with clear evidence and handoff logic.","Create a reviewer-ready Training Needs Analysis Brief.","Use source data to resolve the skill gap: Learner must convert training needs analysis knowledge into a usable Training Needs Analysis Brief: check performance/capability evidence, audience group, priority gap, learning objective, identify missing or conflicting records, explain the level boundary, and create a reviewer-ready handoff.","Explain evidence and consequence through the Training Needs Analysis Brief."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: Module 1: Training Needs Analysis Brief Workplace Build
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-101' LIMIT 1),
  'Module 1: Training Needs Analysis Brief Workplace Build',
  'Trigger: An L&D analyst receives 13 training needs analysis records in performance data, manager skill-gap inputs, employee role list, LMS history and business priority notes; 3 show manager inputs are broad, 3 show performance issues are mixed with training needs, and 2 show LMS completion history is incomplete. Pressure: The team needs a safe first check same working day so the reviewer does not waste time on incomplete evidence. Actuals: Volume: 13 records/cases. Issue count 1: 3 with manager inputs are broad. Issue count 2: 3 with performance issues are mixed with training needs. Issue count 3: 2 with LMS completion history is incomplete. Systems/documents: performance data, manager skill-gap inputs, employee role list, LMS history and business priority notes. Decision needed: ready, return, block, or escalate. Time pressure: same working day.',
  1,
  '["HR & Workforce Services","Workforce Planning & Learning Operations","Learning & Instructional Design Specialists; Performance Management Specialists; Employee Engagement & Experience Consultants","Learning and Development Specialist; Instructional Designer; Training Needs Analyst; Performance Management Specialist; HR Specialist","IND-CAP-21","Training Needs Analysis Brief","Functional","Technical","Behavioural","Cognitive","Evidence"]'::jsonb,
  '["Start with the live trigger: 13 records arrive, 8 have visible issues, and a stakeholder needs an answer same working day.","Learner studies the actual data points: performance/capability evidence, audience group, priority gap, learning objective, recommended intervention, success measure; then highlights missing fields, conflicts, late inputs, and owner gaps.","Teach the artifact logic: what each section means, which evidence is mandatory, what numbers must reconcile, and what the learner is allowed to decide at L1.","Learner completes the Training Needs Analysis Brief using the case numbers, source references, exception labels, owner notes, and a clear ready/return/block/escalate recommendation.","Learner uses AI only for checklist prompts, concept reminders, and rubric self-checks. AI must not invent records, calculate unsupported numbers, approve decisions, or replace the learner''s judgement.","Learner reflects on what changed at L1: volume, exception complexity, stakeholder pressure, authority boundary, and evidence quality compared with the previous level."]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Training Needs Analysis: Guided Practice: Data, Concepts and Artifact Evidence
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-101' LIMIT 1)
   AND title = 'Module 1: Training Needs Analysis Brief Workplace Build' LIMIT 1),
  'Training Needs Analysis: Guided Practice: Data, Concepts and Artifact Evidence',
  'Learner confusion: Students may understand the HR term but may not know how to read 13 messy records, compare source fields, quantify exceptions, choose proceed/return/escalate, or write the evidence trail in simple reviewer language. Root-cause focus: Investigate whether the real cause is missing source data, wrong effective date, unclear owner, system mismatch, late submission, policy/control risk, or weak handoff evidence in performance data, manager skill-gap inputs, employee role list, LMS history and business priority notes.',
  'Problem: An L&D analyst is handling 13 training needs analysis records in performance data, manager skill-gap inputs, employee role list, LMS history and business priority notes. The file is messy: 3 records have manager inputs are broad, 3 have performance issues are mixed with training needs, 2 have LMS completion history is incomplete, and some cases also show priority roles are not ranked. The team needs a safe first check same working day so the reviewer does not waste time on incomplete evidence. The learner must check required inputs, mark missing items, prepare a supervised draft, and request reviewer guidance, then prepare a Training Needs Analysis Brief, and clearly mark which items are ready, returned, blocked, or escalated. If handled poorly, training may be built for the wrong problem or miss the roles with highest need. Actuals: Volume: 13 records/cases. Issue count 1: 3 with manager inputs are broad. Issue count 2: 3 with performance issues are mixed with training needs. Issue count 3: 2 with LMS completion history is incomplete. Systems/documents: performance data, manager skill-gap inputs, employee role list, LMS history and business priority notes. Decision needed: ready, return, block, or escalate. Time pressure: same working day. Major concepts: training needs analysis - needed to complete and defend the Training Needs Analysis Brief; performance issue versus learning gap - needed to complete and defend the Training Needs Analysis Brief; role priority mapping - needed to complete and defend the Training Needs Analysis Brief; skills gap evidence - needed to complete and defend the Training Needs Analysis Brief; manager input validation - needed to complete and defend the Training Needs Analysis Brief; LMS history use - needed to complete and defend the Training Needs Analysis Brief; learning need ranking - needed to complete and defend the Training Needs Analysis Brief; TNA brief quality - needed to complete and defend the Training Needs Analysis Brief Concept-to-artifact link: These concepts are not theory-only. They tell the learner what to check inside the Training Needs Analysis Brief: source data, missing fields, exception rules, owner notes, decision status, handoff logic, and reviewer evidence. Required data: To solve the artifact, learner needs: performance/capability evidence, audience group, priority gap, learning objective, recommended intervention, success measure; system screenshots or exports from performance data, manager skill-gap inputs, employee role list, LMS history and business priority notes; policy or checklist rule used; stakeholder request; deadline/cut-off; prior status if available; reviewer or owner name; evidence of any unresolved exception. Artifact structure: Training Needs Analysis Brief must contain: case or employee/candidate/worker identifier; source document reference; required data fields (performance/capability evidence, audience group, priority gap, learning objective, recommended intervention, success measure); missing or conflicting item log; numeric issue count; exception category; owner/action note; proceed/return/block/escalate status; reviewer handoff note; closure or follow-up date. How to read artifact: Read the artifact as the learner''s final workplace proof. First check the identifiers and source documents, then the required fields, then the issue count and exception category, then the decision status, and finally whether the handoff note gives a reviewer enough evidence to act. Evidence fields: Assess whether the Training Needs Analysis Brief uses the right source data, includes all required fields, counts and labels the 8 issue records correctly, separates normal items from exceptions, gives a clear decision reason, respects the L1 authority boundary, and provides a usable reviewer handoff. AI coach boundary: AI can ask: Which source proves this field? Which 3 records are blocked? What is the decision reason? What evidence is still missing? AI can summarize checklist gaps and suggest clearer wording, but cannot create missing data, approve the case, override policy, or make the final HR/payroll/compliance decision. Traceability: Industry: HR & Workforce Services.|Domain: Workforce Planning & Learning Operations.|Role: Learning and Development Specialist; Instructional Designer; Training Needs Analyst; Performance Management Specialist; HR Specialist.|Capability_ID: IND-CAP-21.|Level: L1.|Course_ID: IND-S5-C-101.|Artifact: Training Needs Analysis Brief.|Source Sheet: L1_COURSE_PATTERN.',
  1,
  '8 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Ed / M.Ed
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-101' LIMIT 1),
  'B.Ed / M.Ed',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MA Education
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-101' LIMIT 1),
  'MA Education',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BBA Human Resource Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-101' LIMIT 1),
  'BBA Human Resource Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MBA Human Resource Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-101' LIMIT 1),
  'MBA Human Resource Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PG Diploma Instructional Design
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-101' LIMIT 1),
  'PG Diploma Instructional Design',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BCA / B.Sc Information Technology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-101' LIMIT 1),
  'BCA / B.Sc Information Technology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: LMS Program Setup QA: Guided Practice
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'LMS Program Setup QA: Guided Practice',
  'IND-S5-C-106',
  'Learner can complete guided check with supervisor review for LMS Program Setup QA and produce a reviewer-ready LMS Program Setup QA Checklist with clear evidence and handoff logic. Workplace scenario: An L&D coordinator is handling 14 LMS program setup quality check records in LMS course shell, enrollment file, session calendar, learning objectives and completion rule settings. The file is messy: 4 records have learner group file has duplicates, 2 have completion rule not aligned to assessment, 1 have session date conflicts with calendar, and some cases also show course objective missing from the LMS description. The team needs a safe first check same working day so the reviewer does not waste time on incomplete evidence. The learner must check required inputs, mark missing items, prepare a supervised draft, and request reviewer guidance, then prepare a LMS Program Setup QA Checklist, and clearly mark which items are ready, returned, blocked, or escalated. If handled poorly, learners may be enrolled incorrectly, completion may not track, or the program may launch with wrong settings. Artifact proof: LMS Program Setup QA Checklist. Competency taxonomy: Functional; Technical; Behavioural; Cognitive; Evidence.',
  '8 hours',
  'Active',
  'Workforce Planning & Learning Operations',
  'technical',
  '["Learner can complete guided check with supervisor review for LMS Program Setup QA and produce a reviewer-ready LMS Program Setup QA Checklist with clear evidence and handoff logic.","Create a reviewer-ready LMS Program Setup QA Checklist.","Use source data to resolve the skill gap: Learner must convert LMS program setup quality check knowledge into a usable LMS Program Setup QA Checklist: check course setup fields, audience assignment, completion rules, notification settings, identify missing or conflicting records, explain the level boundary, and create a reviewer-ready handoff.","Explain evidence and consequence through the LMS Program Setup QA Checklist."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: Module 1: LMS Program Setup QA Checklist Workplace Build
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-106' LIMIT 1),
  'Module 1: LMS Program Setup QA Checklist Workplace Build',
  'Trigger: An L&D coordinator receives 14 LMS program setup quality check records in LMS course shell, enrollment file, session calendar, learning objectives and completion rule settings; 4 show learner group file has duplicates, 2 show completion rule not aligned to assessment, and 1 show session date conflicts with calendar. Pressure: The team needs a safe first check same working day so the reviewer does not waste time on incomplete evidence. Actuals: Volume: 14 records/cases. Issue count 1: 4 with learner group file has duplicates. Issue count 2: 2 with completion rule not aligned to assessment. Issue count 3: 1 with session date conflicts with calendar. Systems/documents: LMS course shell, enrollment file, session calendar, learning objectives and completion rule settings. Decision needed: ready, return, block, or escalate. Time pressure: same working day.',
  1,
  '["HR & Workforce Services","Workforce Planning & Learning Operations","Learning & Instructional Design Specialists; Performance Management Specialists; Employee Engagement & Experience Consultants","Learning and Development Specialist; Instructional Designer; Training Needs Analyst; Performance Management Specialist; HR Specialist","IND-CAP-22","LMS Program Setup QA Checklist","Functional","Technical","Behavioural","Cognitive","Evidence"]'::jsonb,
  '["Start with the live trigger: 14 records arrive, 7 have visible issues, and a stakeholder needs an answer same working day.","Learner studies the actual data points: course setup fields, audience assignment, completion rules, notification settings, test learner record, completion/export evidence; then highlights missing fields, conflicts, late inputs, and owner gaps.","Teach the artifact logic: what each section means, which evidence is mandatory, what numbers must reconcile, and what the learner is allowed to decide at L1.","Learner completes the LMS Program Setup QA Checklist using the case numbers, source references, exception labels, owner notes, and a clear ready/return/block/escalate recommendation.","Learner uses AI only for checklist prompts, concept reminders, and rubric self-checks. AI must not invent records, calculate unsupported numbers, approve decisions, or replace the learner''s judgement.","Learner reflects on what changed at L1: volume, exception complexity, stakeholder pressure, authority boundary, and evidence quality compared with the previous level."]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: LMS Program Setup QA: Guided Practice: Data, Concepts and Artifact Evidence
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-106' LIMIT 1)
   AND title = 'Module 1: LMS Program Setup QA Checklist Workplace Build' LIMIT 1),
  'LMS Program Setup QA: Guided Practice: Data, Concepts and Artifact Evidence',
  'Learner confusion: Students may understand the HR term but may not know how to read 14 messy records, compare source fields, quantify exceptions, choose proceed/return/escalate, or write the evidence trail in simple reviewer language. Root-cause focus: Investigate whether the real cause is missing source data, wrong effective date, unclear owner, system mismatch, late submission, policy/control risk, or weak handoff evidence in LMS course shell, enrollment file, session calendar, learning objectives and completion rule settings.',
  'Problem: An L&D coordinator is handling 14 LMS program setup quality check records in LMS course shell, enrollment file, session calendar, learning objectives and completion rule settings. The file is messy: 4 records have learner group file has duplicates, 2 have completion rule not aligned to assessment, 1 have session date conflicts with calendar, and some cases also show course objective missing from the LMS description. The team needs a safe first check same working day so the reviewer does not waste time on incomplete evidence. The learner must check required inputs, mark missing items, prepare a supervised draft, and request reviewer guidance, then prepare a LMS Program Setup QA Checklist, and clearly mark which items are ready, returned, blocked, or escalated. If handled poorly, learners may be enrolled incorrectly, completion may not track, or the program may launch with wrong settings. Actuals: Volume: 14 records/cases. Issue count 1: 4 with learner group file has duplicates. Issue count 2: 2 with completion rule not aligned to assessment. Issue count 3: 1 with session date conflicts with calendar. Systems/documents: LMS course shell, enrollment file, session calendar, learning objectives and completion rule settings. Decision needed: ready, return, block, or escalate. Time pressure: same working day. Major concepts: LMS program setup - needed to complete and defend the LMS Program Setup QA Checklist; enrollment file validation - needed to complete and defend the LMS Program Setup QA Checklist; completion rule logic - needed to complete and defend the LMS Program Setup QA Checklist; assessment alignment - needed to complete and defend the LMS Program Setup QA Checklist; session calendar control - needed to complete and defend the LMS Program Setup QA Checklist; learner group mapping - needed to complete and defend the LMS Program Setup QA Checklist; launch QA checklist - needed to complete and defend the LMS Program Setup QA Checklist; learning record accuracy - needed to complete and defend the LMS Program Setup QA Checklist Concept-to-artifact link: These concepts are not theory-only. They tell the learner what to check inside the LMS Program Setup QA Checklist: source data, missing fields, exception rules, owner notes, decision status, handoff logic, and reviewer evidence. Required data: To solve the artifact, learner needs: course setup fields, audience assignment, completion rules, notification settings, test learner record, completion/export evidence; system screenshots or exports from LMS course shell, enrollment file, session calendar, learning objectives and completion rule settings; policy or checklist rule used; stakeholder request; deadline/cut-off; prior status if available; reviewer or owner name; evidence of any unresolved exception. Artifact structure: LMS Program Setup QA Checklist must contain: case or employee/candidate/worker identifier; source document reference; required data fields (course setup fields, audience assignment, completion rules, notification settings, test learner record, completion/export evidence); missing or conflicting item log; numeric issue count; exception category; owner/action note; proceed/return/block/escalate status; reviewer handoff note; closure or follow-up date. How to read artifact: Read the artifact as the learner''s final workplace proof. First check the identifiers and source documents, then the required fields, then the issue count and exception category, then the decision status, and finally whether the handoff note gives a reviewer enough evidence to act. Evidence fields: Assess whether the LMS Program Setup QA Checklist uses the right source data, includes all required fields, counts and labels the 7 issue records correctly, separates normal items from exceptions, gives a clear decision reason, respects the L1 authority boundary, and provides a usable reviewer handoff. AI coach boundary: AI can ask: Which source proves this field? Which 4 records are blocked? What is the decision reason? What evidence is still missing? AI can summarize checklist gaps and suggest clearer wording, but cannot create missing data, approve the case, override policy, or make the final HR/payroll/compliance decision. Traceability: Industry: HR & Workforce Services.|Domain: Workforce Planning & Learning Operations.|Role: Learning and Development Specialist; Instructional Designer; Training Needs Analyst; Performance Management Specialist; HR Specialist.|Capability_ID: IND-CAP-22.|Level: L1.|Course_ID: IND-S5-C-106.|Artifact: LMS Program Setup QA Checklist.|Source Sheet: L1_COURSE_PATTERN.',
  1,
  '8 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Ed / M.Ed
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-106' LIMIT 1),
  'B.Ed / M.Ed',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MA Education
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-106' LIMIT 1),
  'MA Education',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BBA Human Resource Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-106' LIMIT 1),
  'BBA Human Resource Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MBA Human Resource Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-106' LIMIT 1),
  'MBA Human Resource Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PG Diploma Instructional Design
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-106' LIMIT 1),
  'PG Diploma Instructional Design',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BCA / B.Sc Information Technology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-106' LIMIT 1),
  'BCA / B.Sc Information Technology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Performance Cycle Readiness: Guided Practice
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Performance Cycle Readiness: Guided Practice',
  'IND-S5-C-111',
  'Learner can complete guided check with supervisor review for Performance Cycle Readiness and produce a reviewer-ready Performance Cycle Readiness Tracker with clear evidence and handoff logic. Workplace scenario: A performance operations coordinator is handling 15 performance cycle readiness tracking records in performance management system, employee eligibility file, manager hierarchy list and cycle calendar. The file is messy: 5 records have eligible employee list differs from HRIS, 3 have manager hierarchy not updated, 2 have goal-setting window is close, and some cases also show calibration owner missing. The team needs a safe first check same working day so the reviewer does not waste time on incomplete evidence. The learner must check required inputs, mark missing items, prepare a supervised draft, and request reviewer guidance, then prepare a Performance Cycle Readiness Tracker, and clearly mark which items are ready, returned, blocked, or escalated. If handled poorly, employees may be excluded, managers may not see the right team, or the cycle may launch with readiness gaps. Artifact proof: Performance Cycle Readiness Tracker. Competency taxonomy: Functional; Technical; Behavioural; Domain; Evidence.',
  '8 hours',
  'Active',
  'Performance & Engagement Operations',
  'soft',
  '["Learner can complete guided check with supervisor review for Performance Cycle Readiness and produce a reviewer-ready Performance Cycle Readiness Tracker with clear evidence and handoff logic.","Create a reviewer-ready Performance Cycle Readiness Tracker.","Use source data to resolve the skill gap: Learner must convert performance cycle readiness tracking knowledge into a usable Performance Cycle Readiness Tracker: check cycle calendar, review population, form/status checks, manager reminders, identify missing or conflicting records, explain the level boundary, and create a reviewer-ready handoff.","Explain evidence and consequence through the Performance Cycle Readiness Tracker."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: Module 1: Performance Cycle Readiness Tracker Workplace Build
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-111' LIMIT 1),
  'Module 1: Performance Cycle Readiness Tracker Workplace Build',
  'Trigger: A performance operations coordinator receives 15 performance cycle readiness tracking records in performance management system, employee eligibility file, manager hierarchy list and cycle calendar; 5 show eligible employee list differs from HRIS, 3 show manager hierarchy not updated, and 2 show goal-setting window is close. Pressure: The team needs a safe first check same working day so the reviewer does not waste time on incomplete evidence. Actuals: Volume: 15 records/cases. Issue count 1: 5 with eligible employee list differs from HRIS. Issue count 2: 3 with manager hierarchy not updated. Issue count 3: 2 with goal-setting window is close. Systems/documents: performance management system, employee eligibility file, manager hierarchy list and cycle calendar. Decision needed: ready, return, block, or escalate. Time pressure: same working day.',
  1,
  '["HR & Workforce Services","Performance & Engagement Operations","Learning & Instructional Design Specialists; Performance Management Specialists; Employee Engagement & Experience Consultants","Learning and Development Specialist; Instructional Designer; Training Needs Analyst; Performance Management Specialist; HR Specialist","IND-CAP-23","Performance Cycle Readiness Tracker","Functional","Technical","Behavioural","Domain","Evidence"]'::jsonb,
  '["Start with the live trigger: 15 records arrive, 10 have visible issues, and a stakeholder needs an answer same working day.","Learner studies the actual data points: cycle calendar, review population, form/status checks, manager reminders, completion exceptions, closure evidence; then highlights missing fields, conflicts, late inputs, and owner gaps.","Teach the artifact logic: what each section means, which evidence is mandatory, what numbers must reconcile, and what the learner is allowed to decide at L1.","Learner completes the Performance Cycle Readiness Tracker using the case numbers, source references, exception labels, owner notes, and a clear ready/return/block/escalate recommendation.","Learner uses AI only for checklist prompts, concept reminders, and rubric self-checks. AI must not invent records, calculate unsupported numbers, approve decisions, or replace the learner''s judgement.","Learner reflects on what changed at L1: volume, exception complexity, stakeholder pressure, authority boundary, and evidence quality compared with the previous level."]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Performance Cycle Readiness: Guided Practice: Data, Concepts and Artifact Evidence
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-111' LIMIT 1)
   AND title = 'Module 1: Performance Cycle Readiness Tracker Workplace Build' LIMIT 1),
  'Performance Cycle Readiness: Guided Practice: Data, Concepts and Artifact Evidence',
  'Learner confusion: Students may understand the HR term but may not know how to read 15 messy records, compare source fields, quantify exceptions, choose proceed/return/escalate, or write the evidence trail in simple reviewer language. Root-cause focus: Investigate whether the real cause is missing source data, wrong effective date, unclear owner, system mismatch, late submission, policy/control risk, or weak handoff evidence in performance management system, employee eligibility file, manager hierarchy list and cycle calendar.',
  'Problem: A performance operations coordinator is handling 15 performance cycle readiness tracking records in performance management system, employee eligibility file, manager hierarchy list and cycle calendar. The file is messy: 5 records have eligible employee list differs from HRIS, 3 have manager hierarchy not updated, 2 have goal-setting window is close, and some cases also show calibration owner missing. The team needs a safe first check same working day so the reviewer does not waste time on incomplete evidence. The learner must check required inputs, mark missing items, prepare a supervised draft, and request reviewer guidance, then prepare a Performance Cycle Readiness Tracker, and clearly mark which items are ready, returned, blocked, or escalated. If handled poorly, employees may be excluded, managers may not see the right team, or the cycle may launch with readiness gaps. Actuals: Volume: 15 records/cases. Issue count 1: 5 with eligible employee list differs from HRIS. Issue count 2: 3 with manager hierarchy not updated. Issue count 3: 2 with goal-setting window is close. Systems/documents: performance management system, employee eligibility file, manager hierarchy list and cycle calendar. Decision needed: ready, return, block, or escalate. Time pressure: same working day. Major concepts: performance cycle readiness - needed to complete and defend the Performance Cycle Readiness Tracker; eligibility rule - needed to complete and defend the Performance Cycle Readiness Tracker; manager hierarchy dependency - needed to complete and defend the Performance Cycle Readiness Tracker; goal-setting window - needed to complete and defend the Performance Cycle Readiness Tracker; calibration ownership - needed to complete and defend the Performance Cycle Readiness Tracker; cycle communication readiness - needed to complete and defend the Performance Cycle Readiness Tracker; readiness tracker status - needed to complete and defend the Performance Cycle Readiness Tracker; launch risk control - needed to complete and defend the Performance Cycle Readiness Tracker Concept-to-artifact link: These concepts are not theory-only. They tell the learner what to check inside the Performance Cycle Readiness Tracker: source data, missing fields, exception rules, owner notes, decision status, handoff logic, and reviewer evidence. Required data: To solve the artifact, learner needs: cycle calendar, review population, form/status checks, manager reminders, completion exceptions, closure evidence; system screenshots or exports from performance management system, employee eligibility file, manager hierarchy list and cycle calendar; policy or checklist rule used; stakeholder request; deadline/cut-off; prior status if available; reviewer or owner name; evidence of any unresolved exception. Artifact structure: Performance Cycle Readiness Tracker must contain: case or employee/candidate/worker identifier; source document reference; required data fields (cycle calendar, review population, form/status checks, manager reminders, completion exceptions, closure evidence); missing or conflicting item log; numeric issue count; exception category; owner/action note; proceed/return/block/escalate status; reviewer handoff note; closure or follow-up date. How to read artifact: Read the artifact as the learner''s final workplace proof. First check the identifiers and source documents, then the required fields, then the issue count and exception category, then the decision status, and finally whether the handoff note gives a reviewer enough evidence to act. Evidence fields: Assess whether the Performance Cycle Readiness Tracker uses the right source data, includes all required fields, counts and labels the 10 issue records correctly, separates normal items from exceptions, gives a clear decision reason, respects the L1 authority boundary, and provides a usable reviewer handoff. AI coach boundary: AI can ask: Which source proves this field? Which 5 records are blocked? What is the decision reason? What evidence is still missing? AI can summarize checklist gaps and suggest clearer wording, but cannot create missing data, approve the case, override policy, or make the final HR/payroll/compliance decision. Traceability: Industry: HR & Workforce Services.|Domain: Performance & Engagement Operations.|Role: Learning and Development Specialist; Instructional Designer; Training Needs Analyst; Performance Management Specialist; HR Specialist.|Capability_ID: IND-CAP-23.|Level: L1.|Course_ID: IND-S5-C-111.|Artifact: Performance Cycle Readiness Tracker.|Source Sheet: L1_COURSE_PATTERN.',
  1,
  '8 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BBA Human Resource Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-111' LIMIT 1),
  'BBA Human Resource Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MBA Human Resource Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-111' LIMIT 1),
  'MBA Human Resource Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MA Organisational Psychology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-111' LIMIT 1),
  'MA Organisational Psychology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MSW Human Resource Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-111' LIMIT 1),
  'MSW Human Resource Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BBA Business Analytics
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-111' LIMIT 1),
  'BBA Business Analytics',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Engagement Survey Action Follow-up: Guided Practice
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Engagement Survey Action Follow-up: Guided Practice',
  'IND-S5-C-116',
  'Learner can complete guided check with supervisor review for Engagement Survey Action Follow-up and produce a reviewer-ready Engagement Survey Action Follow-up Log with clear evidence and handoff logic. Workplace scenario: An engagement operations analyst is handling 16 engagement survey action follow-up records in engagement survey dashboard, team action plan tracker, manager comments and follow-up status log. The file is messy: 3 records have low-score themes not linked to actions, 2 have manager owner missing, 1 have action due date overdue, and some cases also show employee comment theme not summarized. The team needs a safe first check same working day so the reviewer does not waste time on incomplete evidence. The learner must check required inputs, mark missing items, prepare a supervised draft, and request reviewer guidance, then prepare a Engagement Survey Action Follow-up Log, and clearly mark which items are ready, returned, blocked, or escalated. If handled poorly, employees may lose trust in the survey process and repeated issues may remain unresolved. Artifact proof: Engagement Survey Action Follow-up Log. Competency taxonomy: Functional; Technical; Behavioural; Cognitive; Evidence.',
  '8 hours',
  'Active',
  'Performance & Engagement Operations',
  'soft',
  '["Learner can complete guided check with supervisor review for Engagement Survey Action Follow-up and produce a reviewer-ready Engagement Survey Action Follow-up Log with clear evidence and handoff logic.","Create a reviewer-ready Engagement Survey Action Follow-up Log.","Use source data to resolve the skill gap: Learner must convert engagement survey action follow-up knowledge into a usable Engagement Survey Action Follow-up Log: check survey insight, team/theme priority, manager action, owner/date, identify missing or conflicting records, explain the level boundary, and create a reviewer-ready handoff.","Explain evidence and consequence through the Engagement Survey Action Follow-up Log."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: Module 1: Engagement Survey Action Follow-up Log Workplace Build
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-116' LIMIT 1),
  'Module 1: Engagement Survey Action Follow-up Log Workplace Build',
  'Trigger: An engagement operations analyst receives 16 engagement survey action follow-up records in engagement survey dashboard, team action plan tracker, manager comments and follow-up status log; 3 show low-score themes not linked to actions, 2 show manager owner missing, and 1 show action due date overdue. Pressure: The team needs a safe first check same working day so the reviewer does not waste time on incomplete evidence. Actuals: Volume: 16 records/cases. Issue count 1: 3 with low-score themes not linked to actions. Issue count 2: 2 with manager owner missing. Issue count 3: 1 with action due date overdue. Systems/documents: engagement survey dashboard, team action plan tracker, manager comments and follow-up status log. Decision needed: ready, return, block, or escalate. Time pressure: same working day.',
  1,
  '["HR & Workforce Services","Performance & Engagement Operations","Learning & Instructional Design Specialists; Performance Management Specialists; Employee Engagement & Experience Consultants","Learning and Development Specialist; Instructional Designer; Training Needs Analyst; Performance Management Specialist; HR Specialist","IND-CAP-24","Engagement Survey Action Follow-up Log","Functional","Technical","Behavioural","Cognitive","Evidence"]'::jsonb,
  '["Start with the live trigger: 16 records arrive, 6 have visible issues, and a stakeholder needs an answer same working day.","Learner studies the actual data points: survey insight, team/theme priority, manager action, owner/date, employee feedback signal, progress and closure evidence; then highlights missing fields, conflicts, late inputs, and owner gaps.","Teach the artifact logic: what each section means, which evidence is mandatory, what numbers must reconcile, and what the learner is allowed to decide at L1.","Learner completes the Engagement Survey Action Follow-up Log using the case numbers, source references, exception labels, owner notes, and a clear ready/return/block/escalate recommendation.","Learner uses AI only for checklist prompts, concept reminders, and rubric self-checks. AI must not invent records, calculate unsupported numbers, approve decisions, or replace the learner''s judgement.","Learner reflects on what changed at L1: volume, exception complexity, stakeholder pressure, authority boundary, and evidence quality compared with the previous level."]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Engagement Survey Action Follow-up: Guided Practice: Data, Concepts and Artifact Evidence
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-116' LIMIT 1)
   AND title = 'Module 1: Engagement Survey Action Follow-up Log Workplace Build' LIMIT 1),
  'Engagement Survey Action Follow-up: Guided Practice: Data, Concepts and Artifact Evidence',
  'Learner confusion: Students may understand the HR term but may not know how to read 16 messy records, compare source fields, quantify exceptions, choose proceed/return/escalate, or write the evidence trail in simple reviewer language. Root-cause focus: Investigate whether the real cause is missing source data, wrong effective date, unclear owner, system mismatch, late submission, policy/control risk, or weak handoff evidence in engagement survey dashboard, team action plan tracker, manager comments and follow-up status log.',
  'Problem: An engagement operations analyst is handling 16 engagement survey action follow-up records in engagement survey dashboard, team action plan tracker, manager comments and follow-up status log. The file is messy: 3 records have low-score themes not linked to actions, 2 have manager owner missing, 1 have action due date overdue, and some cases also show employee comment theme not summarized. The team needs a safe first check same working day so the reviewer does not waste time on incomplete evidence. The learner must check required inputs, mark missing items, prepare a supervised draft, and request reviewer guidance, then prepare a Engagement Survey Action Follow-up Log, and clearly mark which items are ready, returned, blocked, or escalated. If handled poorly, employees may lose trust in the survey process and repeated issues may remain unresolved. Actuals: Volume: 16 records/cases. Issue count 1: 3 with low-score themes not linked to actions. Issue count 2: 2 with manager owner missing. Issue count 3: 1 with action due date overdue. Systems/documents: engagement survey dashboard, team action plan tracker, manager comments and follow-up status log. Decision needed: ready, return, block, or escalate. Time pressure: same working day. Major concepts: engagement survey interpretation - needed to complete and defend the Engagement Survey Action Follow-up Log; theme-to-action mapping - needed to complete and defend the Engagement Survey Action Follow-up Log; manager action ownership - needed to complete and defend the Engagement Survey Action Follow-up Log; due-date follow-up - needed to complete and defend the Engagement Survey Action Follow-up Log; employee comment summarization - needed to complete and defend the Engagement Survey Action Follow-up Log; action status evidence - needed to complete and defend the Engagement Survey Action Follow-up Log; trust and confidentiality boundary - needed to complete and defend the Engagement Survey Action Follow-up Log; follow-up log quality - needed to complete and defend the Engagement Survey Action Follow-up Log Concept-to-artifact link: These concepts are not theory-only. They tell the learner what to check inside the Engagement Survey Action Follow-up Log: source data, missing fields, exception rules, owner notes, decision status, handoff logic, and reviewer evidence. Required data: To solve the artifact, learner needs: survey insight, team/theme priority, manager action, owner/date, employee feedback signal, progress and closure evidence; system screenshots or exports from engagement survey dashboard, team action plan tracker, manager comments and follow-up status log; policy or checklist rule used; stakeholder request; deadline/cut-off; prior status if available; reviewer or owner name; evidence of any unresolved exception. Artifact structure: Engagement Survey Action Follow-up Log must contain: case or employee/candidate/worker identifier; source document reference; required data fields (survey insight, team/theme priority, manager action, owner/date, employee feedback signal, progress and closure evidence); missing or conflicting item log; numeric issue count; exception category; owner/action note; proceed/return/block/escalate status; reviewer handoff note; closure or follow-up date. How to read artifact: Read the artifact as the learner''s final workplace proof. First check the identifiers and source documents, then the required fields, then the issue count and exception category, then the decision status, and finally whether the handoff note gives a reviewer enough evidence to act. Evidence fields: Assess whether the Engagement Survey Action Follow-up Log uses the right source data, includes all required fields, counts and labels the 6 issue records correctly, separates normal items from exceptions, gives a clear decision reason, respects the L1 authority boundary, and provides a usable reviewer handoff. AI coach boundary: AI can ask: Which source proves this field? Which 3 records are blocked? What is the decision reason? What evidence is still missing? AI can summarize checklist gaps and suggest clearer wording, but cannot create missing data, approve the case, override policy, or make the final HR/payroll/compliance decision. Traceability: Industry: HR & Workforce Services.|Domain: Performance & Engagement Operations.|Role: Learning and Development Specialist; Instructional Designer; Training Needs Analyst; Performance Management Specialist; HR Specialist.|Capability_ID: IND-CAP-24.|Level: L1.|Course_ID: IND-S5-C-116.|Artifact: Engagement Survey Action Follow-up Log.|Source Sheet: L1_COURSE_PATTERN.',
  1,
  '8 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BBA Human Resource Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-116' LIMIT 1),
  'BBA Human Resource Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MBA Human Resource Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-116' LIMIT 1),
  'MBA Human Resource Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MA Organisational Psychology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-116' LIMIT 1),
  'MA Organisational Psychology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MSW Human Resource Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-116' LIMIT 1),
  'MSW Human Resource Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BBA Business Analytics
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-116' LIMIT 1),
  'BBA Business Analytics',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Grievance Case Resolution: Guided Practice
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Grievance Case Resolution: Guided Practice',
  'IND-S5-C-121',
  'Learner can complete guided check with supervisor review for Employee Grievance Handling and produce a reviewer-ready Grievance Case Resolution File with clear evidence and handoff logic. Workplace scenario: An employee relations specialist is handling 12 employee grievance resolution file preparation records in grievance intake form, employee statement, manager response, policy guide and ER case tracker. The file is messy: 4 records have dates in statements do not match, 3 have retaliation concern is hinted but not classified, 2 have manager response lacks evidence, and some cases also show closure expectation is unclear. The team needs a safe first check same working day so the reviewer does not waste time on incomplete evidence. The learner must check required inputs, mark missing items, prepare a supervised draft, and request reviewer guidance, then prepare a Grievance Case Resolution File, and clearly mark which items are ready, returned, blocked, or escalated. If handled poorly, the grievance may be mishandled, escalation risk may be missed, or the closure note may be challenged. Artifact proof: Grievance Case Resolution File. Competency taxonomy: Functional; Technical; Behavioural; Domain; Evidence.',
  '8 hours',
  'Active',
  'Employee Relations & Workplace Investigations',
  'soft',
  '["Learner can complete guided check with supervisor review for Employee Grievance Handling and produce a reviewer-ready Grievance Case Resolution File with clear evidence and handoff logic.","Create a reviewer-ready Grievance Case Resolution File.","Use source data to resolve the skill gap: Learner must convert employee grievance resolution file preparation knowledge into a usable Grievance Case Resolution File: check complaint intake, severity classification, retaliation/sensitivity risk check, policy evidence, identify missing or conflicting records, explain the level boundary, and create a reviewer-ready handoff.","Explain evidence and consequence through the Grievance Case Resolution File."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: Module 1: Grievance Case Resolution File Workplace Build
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-121' LIMIT 1),
  'Module 1: Grievance Case Resolution File Workplace Build',
  'Trigger: An employee relations specialist receives 12 employee grievance resolution file preparation records in grievance intake form, employee statement, manager response, policy guide and ER case tracker; 4 show dates in statements do not match, 3 show retaliation concern is hinted but not classified, and 2 show manager response lacks evidence. Pressure: The team needs a safe first check same working day so the reviewer does not waste time on incomplete evidence. Actuals: Volume: 12 records/cases. Issue count 1: 4 with dates in statements do not match. Issue count 2: 3 with retaliation concern is hinted but not classified. Issue count 3: 2 with manager response lacks evidence. Systems/documents: grievance intake form, employee statement, manager response, policy guide and ER case tracker. Decision needed: ready, return, block, or escalate. Time pressure: same working day.',
  1,
  '["HR & Workforce Services","Employee Relations & Workplace Investigations","Employee Relations & Grievance Specialists; Workplace Investigation & Screening Risk Specialists; Offboarding, Transition & Outplacement Specialists","Employee Relations Specialist; Labor Relations Specialist; Grievance Officer; HR Specialist; Workplace Investigator","IND-CAP-25","Grievance Case Resolution File","Functional","Technical","Behavioural","Domain","Evidence"]'::jsonb,
  '["Start with the live trigger: 12 records arrive, 9 have visible issues, and a stakeholder needs an answer same working day.","Learner studies the actual data points: complaint intake, severity classification, retaliation/sensitivity risk check, policy evidence, manager/employee response notes, closure outcome and follow-up control; then highlights missing fields, conflicts, late inputs, and owner gaps.","Teach the artifact logic: what each section means, which evidence is mandatory, what numbers must reconcile, and what the learner is allowed to decide at L1.","Learner completes the Grievance Case Resolution File using the case numbers, source references, exception labels, owner notes, and a clear ready/return/block/escalate recommendation.","Learner uses AI only for checklist prompts, concept reminders, and rubric self-checks. AI must not invent records, calculate unsupported numbers, approve decisions, or replace the learner''s judgement.","Learner reflects on what changed at L1: volume, exception complexity, stakeholder pressure, authority boundary, and evidence quality compared with the previous level."]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Grievance Case Resolution: Guided Practice: Data, Concepts and Artifact Evidence
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-121' LIMIT 1)
   AND title = 'Module 1: Grievance Case Resolution File Workplace Build' LIMIT 1),
  'Grievance Case Resolution: Guided Practice: Data, Concepts and Artifact Evidence',
  'Learner confusion: Students may understand the HR term but may not know how to read 12 messy records, compare source fields, quantify exceptions, choose proceed/return/escalate, or write the evidence trail in simple reviewer language. Root-cause focus: Investigate whether the real cause is missing source data, wrong effective date, unclear owner, system mismatch, late submission, policy/control risk, or weak handoff evidence in grievance intake form, employee statement, manager response, policy guide and ER case tracker.',
  'Problem: An employee relations specialist is handling 12 employee grievance resolution file preparation records in grievance intake form, employee statement, manager response, policy guide and ER case tracker. The file is messy: 4 records have dates in statements do not match, 3 have retaliation concern is hinted but not classified, 2 have manager response lacks evidence, and some cases also show closure expectation is unclear. The team needs a safe first check same working day so the reviewer does not waste time on incomplete evidence. The learner must check required inputs, mark missing items, prepare a supervised draft, and request reviewer guidance, then prepare a Grievance Case Resolution File, and clearly mark which items are ready, returned, blocked, or escalated. If handled poorly, the grievance may be mishandled, escalation risk may be missed, or the closure note may be challenged. Actuals: Volume: 12 records/cases. Issue count 1: 4 with dates in statements do not match. Issue count 2: 3 with retaliation concern is hinted but not classified. Issue count 3: 2 with manager response lacks evidence. Systems/documents: grievance intake form, employee statement, manager response, policy guide and ER case tracker. Decision needed: ready, return, block, or escalate. Time pressure: same working day. Major concepts: grievance intake classification - needed to complete and defend the Grievance Case Resolution File; severity rating - needed to complete and defend the Grievance Case Resolution File; retaliation risk signal - needed to complete and defend the Grievance Case Resolution File; statement evidence review - needed to complete and defend the Grievance Case Resolution File; manager response check - needed to complete and defend the Grievance Case Resolution File; policy route selection - needed to complete and defend the Grievance Case Resolution File; case closure note - needed to complete and defend the Grievance Case Resolution File; confidential ER evidence control - needed to complete and defend the Grievance Case Resolution File Concept-to-artifact link: These concepts are not theory-only. They tell the learner what to check inside the Grievance Case Resolution File: source data, missing fields, exception rules, owner notes, decision status, handoff logic, and reviewer evidence. Required data: To solve the artifact, learner needs: complaint intake, severity classification, retaliation/sensitivity risk check, policy evidence, manager/employee response notes, closure outcome and follow-up control; system screenshots or exports from grievance intake form, employee statement, manager response, policy guide and ER case tracker; policy or checklist rule used; stakeholder request; deadline/cut-off; prior status if available; reviewer or owner name; evidence of any unresolved exception. Artifact structure: Grievance Case Resolution File must contain: case or employee/candidate/worker identifier; source document reference; required data fields (complaint intake, severity classification, retaliation/sensitivity risk check, policy evidence, manager/employee response notes, closure outcome and follow-up control); missing or conflicting item log; numeric issue count; exception category; owner/action note; proceed/return/block/escalate status; reviewer handoff note; closure or follow-up date. How to read artifact: Read the artifact as the learner''s final workplace proof. First check the identifiers and source documents, then the required fields, then the issue count and exception category, then the decision status, and finally whether the handoff note gives a reviewer enough evidence to act. Evidence fields: Assess whether the Grievance Case Resolution File uses the right source data, includes all required fields, counts and labels the 9 issue records correctly, separates normal items from exceptions, gives a clear decision reason, respects the L1 authority boundary, and provides a usable reviewer handoff. AI coach boundary: AI can ask: Which source proves this field? Which 4 records are blocked? What is the decision reason? What evidence is still missing? AI can summarize checklist gaps and suggest clearer wording, but cannot create missing data, approve the case, override policy, or make the final HR/payroll/compliance decision. Traceability: Industry: HR & Workforce Services.|Domain: Employee Relations & Workplace Investigations.|Role: Employee Relations Specialist; Labor Relations Specialist; Grievance Officer; HR Specialist; Workplace Investigator.|Capability_ID: IND-CAP-25.|Level: L1.|Course_ID: IND-S5-C-121.|Artifact: Grievance Case Resolution File.|Source Sheet: L1_COURSE_PATTERN.',
  1,
  '8 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: LLB / BA LLB Labour and Employment Law
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-121' LIMIT 1),
  'LLB / BA LLB Labour and Employment Law',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MBA Human Resource Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-121' LIMIT 1),
  'MBA Human Resource Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MSW Human Resource Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-121' LIMIT 1),
  'MSW Human Resource Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MA Industrial Relations
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-121' LIMIT 1),
  'MA Industrial Relations',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BA Psychology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-121' LIMIT 1),
  'BA Psychology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Workplace Investigation Evidence Control: Guided Practice
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Workplace Investigation Evidence Control: Guided Practice',
  'IND-S5-C-126',
  'Learner can complete guided check with supervisor review for Workplace Investigation Evidence Control and produce a reviewer-ready Workplace Investigation Evidence Control Log with clear evidence and handoff logic. Workplace scenario: A workplace investigator is handling 13 workplace investigation evidence control records in investigation case file, allegation summary, witness log, document evidence folder and corrective action tracker. The file is messy: 5 records have allegation scope is broad, 2 have witness notes conflict, 1 have evidence files are not dated, and some cases also show corrective action owner not recorded. The team needs a safe first check same working day so the reviewer does not waste time on incomplete evidence. The learner must check required inputs, mark missing items, prepare a supervised draft, and request reviewer guidance, then prepare a Workplace Investigation Evidence Control Log, and clearly mark which items are ready, returned, blocked, or escalated. If handled poorly, the investigation may lose credibility, miss key evidence, or fail to support corrective action. Artifact proof: Workplace Investigation Evidence Control Log. Competency taxonomy: Functional; Technical; Behavioural; Domain; Evidence.',
  '8 hours',
  'Active',
  'Employee Relations & Workplace Investigations',
  'soft',
  '["Learner can complete guided check with supervisor review for Workplace Investigation Evidence Control and produce a reviewer-ready Workplace Investigation Evidence Control Log with clear evidence and handoff logic.","Create a reviewer-ready Workplace Investigation Evidence Control Log.","Use source data to resolve the skill gap: Learner must convert workplace investigation evidence control knowledge into a usable Workplace Investigation Evidence Control Log: check allegation framing, witness/evidence register, chronology, confidentiality controls, identify missing or conflicting records, explain the level boundary, and create a reviewer-ready handoff.","Explain evidence and consequence through the Workplace Investigation Evidence Control Log."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: Module 1: Workplace Investigation Evidence Control Log Workplace Build
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-126' LIMIT 1),
  'Module 1: Workplace Investigation Evidence Control Log Workplace Build',
  'Trigger: A workplace investigator receives 13 workplace investigation evidence control records in investigation case file, allegation summary, witness log, document evidence folder and corrective action tracker; 5 show allegation scope is broad, 2 show witness notes conflict, and 1 show evidence files are not dated. Pressure: The team needs a safe first check same working day so the reviewer does not waste time on incomplete evidence. Actuals: Volume: 13 records/cases. Issue count 1: 5 with allegation scope is broad. Issue count 2: 2 with witness notes conflict. Issue count 3: 1 with evidence files are not dated. Systems/documents: investigation case file, allegation summary, witness log, document evidence folder and corrective action tracker. Decision needed: ready, return, block, or escalate. Time pressure: same working day.',
  1,
  '["HR & Workforce Services","Employee Relations & Workplace Investigations","Employee Relations & Grievance Specialists; Workplace Investigation & Screening Risk Specialists; Offboarding, Transition & Outplacement Specialists","Employee Relations Specialist; Labor Relations Specialist; Grievance Officer; HR Specialist; Workplace Investigator","IND-CAP-26","Workplace Investigation Evidence Control Log","Functional","Technical","Behavioural","Domain","Evidence"]'::jsonb,
  '["Start with the live trigger: 13 records arrive, 8 have visible issues, and a stakeholder needs an answer same working day.","Learner studies the actual data points: allegation framing, witness/evidence register, chronology, confidentiality controls, finding summary, corrective-action handoff; then highlights missing fields, conflicts, late inputs, and owner gaps.","Teach the artifact logic: what each section means, which evidence is mandatory, what numbers must reconcile, and what the learner is allowed to decide at L1.","Learner completes the Workplace Investigation Evidence Control Log using the case numbers, source references, exception labels, owner notes, and a clear ready/return/block/escalate recommendation.","Learner uses AI only for checklist prompts, concept reminders, and rubric self-checks. AI must not invent records, calculate unsupported numbers, approve decisions, or replace the learner''s judgement.","Learner reflects on what changed at L1: volume, exception complexity, stakeholder pressure, authority boundary, and evidence quality compared with the previous level."]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Investigation Evidence Control: Guided Practice: Data, Concepts and Artifact Evidence
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-126' LIMIT 1)
   AND title = 'Module 1: Workplace Investigation Evidence Control Log Workplace Build' LIMIT 1),
  'Workplace Investigation Evidence Control: Guided Practice: Data, Concepts and Artifact Evidence',
  'Learner confusion: Students may understand the HR term but may not know how to read 13 messy records, compare source fields, quantify exceptions, choose proceed/return/escalate, or write the evidence trail in simple reviewer language. Root-cause focus: Investigate whether the real cause is missing source data, wrong effective date, unclear owner, system mismatch, late submission, policy/control risk, or weak handoff evidence in investigation case file, allegation summary, witness log, document evidence folder and corrective action tracker.',
  'Problem: A workplace investigator is handling 13 workplace investigation evidence control records in investigation case file, allegation summary, witness log, document evidence folder and corrective action tracker. The file is messy: 5 records have allegation scope is broad, 2 have witness notes conflict, 1 have evidence files are not dated, and some cases also show corrective action owner not recorded. The team needs a safe first check same working day so the reviewer does not waste time on incomplete evidence. The learner must check required inputs, mark missing items, prepare a supervised draft, and request reviewer guidance, then prepare a Workplace Investigation Evidence Control Log, and clearly mark which items are ready, returned, blocked, or escalated. If handled poorly, the investigation may lose credibility, miss key evidence, or fail to support corrective action. Actuals: Volume: 13 records/cases. Issue count 1: 5 with allegation scope is broad. Issue count 2: 2 with witness notes conflict. Issue count 3: 1 with evidence files are not dated. Systems/documents: investigation case file, allegation summary, witness log, document evidence folder and corrective action tracker. Decision needed: ready, return, block, or escalate. Time pressure: same working day. Major concepts: investigation scope framing - needed to complete and defend the Workplace Investigation Evidence Control Log; evidence chain of custody - needed to complete and defend the Workplace Investigation Evidence Control Log; witness log control - needed to complete and defend the Workplace Investigation Evidence Control Log; chronology building - needed to complete and defend the Workplace Investigation Evidence Control Log; finding support evidence - needed to complete and defend the Workplace Investigation Evidence Control Log; confidential access control - needed to complete and defend the Workplace Investigation Evidence Control Log; corrective action handoff - needed to complete and defend the Workplace Investigation Evidence Control Log; investigation evidence log standard - needed to complete and defend the Workplace Investigation Evidence Control Log Concept-to-artifact link: These concepts are not theory-only. They tell the learner what to check inside the Workplace Investigation Evidence Control Log: source data, missing fields, exception rules, owner notes, decision status, handoff logic, and reviewer evidence. Required data: To solve the artifact, learner needs: allegation framing, witness/evidence register, chronology, confidentiality controls, finding summary, corrective-action handoff; system screenshots or exports from investigation case file, allegation summary, witness log, document evidence folder and corrective action tracker; policy or checklist rule used; stakeholder request; deadline/cut-off; prior status if available; reviewer or owner name; evidence of any unresolved exception. Artifact structure: Workplace Investigation Evidence Control Log must contain: case or employee/candidate/worker identifier; source document reference; required data fields (allegation framing, witness/evidence register, chronology, confidentiality controls, finding summary, corrective-action handoff); missing or conflicting item log; numeric issue count; exception category; owner/action note; proceed/return/block/escalate status; reviewer handoff note; closure or follow-up date. How to read artifact: Read the artifact as the learner''s final workplace proof. First check the identifiers and source documents, then the required fields, then the issue count and exception category, then the decision status, and finally whether the handoff note gives a reviewer enough evidence to act. Evidence fields: Assess whether the Workplace Investigation Evidence Control Log uses the right source data, includes all required fields, counts and labels the 8 issue records correctly, separates normal items from exceptions, gives a clear decision reason, respects the L1 authority boundary, and provides a usable reviewer handoff. AI coach boundary: AI can ask: Which source proves this field? Which 5 records are blocked? What is the decision reason? What evidence is still missing? AI can summarize checklist gaps and suggest clearer wording, but cannot create missing data, approve the case, override policy, or make the final HR/payroll/compliance decision. Traceability: Industry: HR & Workforce Services.|Domain: Employee Relations & Workplace Investigations.|Role: Employee Relations Specialist; Labor Relations Specialist; Grievance Officer; HR Specialist; Workplace Investigator.|Capability_ID: IND-CAP-26.|Level: L1.|Course_ID: IND-S5-C-126.|Artifact: Workplace Investigation Evidence Control Log.|Source Sheet: L1_COURSE_PATTERN.',
  1,
  '8 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: LLB / BA LLB Labour and Employment Law
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-126' LIMIT 1),
  'LLB / BA LLB Labour and Employment Law',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MBA Human Resource Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-126' LIMIT 1),
  'MBA Human Resource Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MSW Human Resource Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-126' LIMIT 1),
  'MSW Human Resource Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MA Industrial Relations
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-126' LIMIT 1),
  'MA Industrial Relations',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BA Psychology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-126' LIMIT 1),
  'BA Psychology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Background Verification Adjudication: Guided Practice
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Background Verification Adjudication: Guided Practice',
  'IND-S5-C-131',
  'Learner can complete guided check with supervisor review for Complete Background Screening Decisions Using Consent, and produce a reviewer-ready Background Verification Adjudication Note with clear evidence and handoff logic. Workplace scenario: A background verification specialist is handling 14 background verification adjudication note preparation records in BGV vendor report, candidate declaration, hiring policy, exception tracker and recruiter communication log. The file is messy: 3 records have vendor report has an address mismatch, 3 have education verification is pending, 2 have candidate declaration differs from report, and some cases also show policy treatment of the exception is unclear. The team needs a safe first check same working day so the reviewer does not waste time on incomplete evidence. The learner must check required inputs, mark missing items, prepare a supervised draft, and request reviewer guidance, then prepare a Background Verification Adjudication Note, and clearly mark which items are ready, returned, blocked, or escalated. If handled poorly, the organization may hire without resolving a risk or wrongly block a candidate without fair evidence. Artifact proof: Background Verification Adjudication Note. Competency taxonomy: Functional; Technical; Behavioural; Cognitive; Evidence.',
  '8 hours',
  'Active',
  'HR & Workforce Services',
  'technical',
  '["Learner can complete guided check with supervisor review for Complete Background Screening Decisions Using Consent, and produce a reviewer-ready Background Verification Adjudication Note with clear evidence and handoff logic.","Create a reviewer-ready Background Verification Adjudication Note.","Use source data to resolve the skill gap: Learner must convert background verification adjudication note preparation knowledge into a usable Background Verification Adjudication Note: check candidate consent, verification results, discrepancy classification, adjudication matrix, identify missing or conflicting records, explain the level boundary, and create a reviewer-ready handoff.","Explain evidence and consequence through the Background Verification Adjudication Note."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: Module 1: Background Verification Adjudication Note Workplace Build
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-131' LIMIT 1),
  'Module 1: Background Verification Adjudication Note Workplace Build',
  'Trigger: A background verification specialist receives 14 background verification adjudication note preparation records in BGV vendor report, candidate declaration, hiring policy, exception tracker and recruiter communication log; 3 show vendor report has an address mismatch, 3 show education verification is pending, and 2 show candidate declaration differs from report. Pressure: The team needs a safe first check same working day so the reviewer does not waste time on incomplete evidence. Actuals: Volume: 14 records/cases. Issue count 1: 3 with vendor report has an address mismatch. Issue count 2: 3 with education verification is pending. Issue count 3: 2 with candidate declaration differs from report. Systems/documents: BGV vendor report, candidate declaration, hiring policy, exception tracker and recruiter communication log. Decision needed: ready, return, block, or escalate. Time pressure: same working day.',
  1,
  '["HR & Workforce Services","HR & Workforce Services","Employee Relations & Grievance Specialists; Workplace Investigation & Screening Risk Specialists; Offboarding, Transition & Outplacement Specialists","Employee Relations Specialist; Labor Relations Specialist; Grievance Officer; HR Specialist; Workplace Investigator","IND-CAP-27","Background Verification Adjudication Note","Functional","Technical","Behavioural","Cognitive","Evidence"]'::jsonb,
  '["Start with the live trigger: 14 records arrive, 8 have visible issues, and a stakeholder needs an answer same working day.","Learner studies the actual data points: candidate consent, verification results, discrepancy classification, adjudication matrix, adverse-action flag, decision and communication evidence; then highlights missing fields, conflicts, late inputs, and owner gaps.","Teach the artifact logic: what each section means, which evidence is mandatory, what numbers must reconcile, and what the learner is allowed to decide at L1.","Learner completes the Background Verification Adjudication Note using the case numbers, source references, exception labels, owner notes, and a clear ready/return/block/escalate recommendation.","Learner uses AI only for checklist prompts, concept reminders, and rubric self-checks. AI must not invent records, calculate unsupported numbers, approve decisions, or replace the learner''s judgement.","Learner reflects on what changed at L1: volume, exception complexity, stakeholder pressure, authority boundary, and evidence quality compared with the previous level."]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Background Verification Adjudication: Guided Practice: Data, Concepts and Artifact Evidence
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-131' LIMIT 1)
   AND title = 'Module 1: Background Verification Adjudication Note Workplace Build' LIMIT 1),
  'Background Verification Adjudication: Guided Practice: Data, Concepts and Artifact Evidence',
  'Learner confusion: Students may understand the HR term but may not know how to read 14 messy records, compare source fields, quantify exceptions, choose proceed/return/escalate, or write the evidence trail in simple reviewer language. Root-cause focus: Investigate whether the real cause is missing source data, wrong effective date, unclear owner, system mismatch, late submission, policy/control risk, or weak handoff evidence in BGV vendor report, candidate declaration, hiring policy, exception tracker and recruiter communication log.',
  'Problem: A background verification specialist is handling 14 background verification adjudication note preparation records in BGV vendor report, candidate declaration, hiring policy, exception tracker and recruiter communication log. The file is messy: 3 records have vendor report has an address mismatch, 3 have education verification is pending, 2 have candidate declaration differs from report, and some cases also show policy treatment of the exception is unclear. The team needs a safe first check same working day so the reviewer does not waste time on incomplete evidence. The learner must check required inputs, mark missing items, prepare a supervised draft, and request reviewer guidance, then prepare a Background Verification Adjudication Note, and clearly mark which items are ready, returned, blocked, or escalated. If handled poorly, the organization may hire without resolving a risk or wrongly block a candidate without fair evidence. Actuals: Volume: 14 records/cases. Issue count 1: 3 with vendor report has an address mismatch. Issue count 2: 3 with education verification is pending. Issue count 3: 2 with candidate declaration differs from report. Systems/documents: BGV vendor report, candidate declaration, hiring policy, exception tracker and recruiter communication log. Decision needed: ready, return, block, or escalate. Time pressure: same working day. Major concepts: background verification status - needed to complete and defend the Background Verification Adjudication Note; exception classification - needed to complete and defend the Background Verification Adjudication Note; candidate declaration comparison - needed to complete and defend the Background Verification Adjudication Note; policy adjudication rule - needed to complete and defend the Background Verification Adjudication Note; vendor report evidence - needed to complete and defend the Background Verification Adjudication Note; proceed-pause-escalate logic - needed to complete and defend the Background Verification Adjudication Note; fairness and confidentiality - needed to complete and defend the Background Verification Adjudication Note; adjudication note quality - needed to complete and defend the Background Verification Adjudication Note Concept-to-artifact link: These concepts are not theory-only. They tell the learner what to check inside the Background Verification Adjudication Note: source data, missing fields, exception rules, owner notes, decision status, handoff logic, and reviewer evidence. Required data: To solve the artifact, learner needs: candidate consent, verification results, discrepancy classification, adjudication matrix, adverse-action flag, decision and communication evidence; system screenshots or exports from BGV vendor report, candidate declaration, hiring policy, exception tracker and recruiter communication log; policy or checklist rule used; stakeholder request; deadline/cut-off; prior status if available; reviewer or owner name; evidence of any unresolved exception. Artifact structure: Background Verification Adjudication Note must contain: case or employee/candidate/worker identifier; source document reference; required data fields (candidate consent, verification results, discrepancy classification, adjudication matrix, adverse-action flag, decision and communication evidence); missing or conflicting item log; numeric issue count; exception category; owner/action note; proceed/return/block/escalate status; reviewer handoff note; closure or follow-up date. How to read artifact: Read the artifact as the learner''s final workplace proof. First check the identifiers and source documents, then the required fields, then the issue count and exception category, then the decision status, and finally whether the handoff note gives a reviewer enough evidence to act. Evidence fields: Assess whether the Background Verification Adjudication Note uses the right source data, includes all required fields, counts and labels the 8 issue records correctly, separates normal items from exceptions, gives a clear decision reason, respects the L1 authority boundary, and provides a usable reviewer handoff. AI coach boundary: AI can ask: Which source proves this field? Which 3 records are blocked? What is the decision reason? What evidence is still missing? AI can summarize checklist gaps and suggest clearer wording, but cannot create missing data, approve the case, override policy, or make the final HR/payroll/compliance decision. Traceability: Industry: HR & Workforce Services.|Domain: HR & Workforce Services.|Role: Employee Relations Specialist; Labor Relations Specialist; Grievance Officer; HR Specialist; Workplace Investigator.|Capability_ID: IND-CAP-27.|Level: L1.|Course_ID: IND-S5-C-131.|Artifact: Background Verification Adjudication Note.|Source Sheet: L1_COURSE_PATTERN.',
  1,
  '8 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BBA Human Resource Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-131' LIMIT 1),
  'BBA Human Resource Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MBA Human Resource Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-131' LIMIT 1),
  'MBA Human Resource Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Com
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-131' LIMIT 1),
  'B.Com',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: LLB / BA LLB Labour and Employment Law
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-131' LIMIT 1),
  'LLB / BA LLB Labour and Employment Law',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PGDM Compliance Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-131' LIMIT 1),
  'PGDM Compliance Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Exit Clearance & Payroll Handoff: Guided Practice
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Exit Clearance & Payroll Handoff: Guided Practice',
  'IND-S5-C-136',
  'Learner can complete guided check with supervisor review for Exit Clearance and Payroll Handoff and produce a reviewer-ready Exit Clearance & Payroll Handoff Pack with clear evidence and handoff logic. Workplace scenario: An offboarding coordinator is handling 15 exit clearance and payroll handoff records in exit workflow tracker, asset clearance list, final settlement inputs, payroll stop sheet and manager confirmation. The file is messy: 4 records have asset clearance pending, 2 have last working day changed, 1 have leave encashment input missing, and some cases also show payroll stop date not confirmed. The team needs a safe first check same working day so the reviewer does not waste time on incomplete evidence. The learner must check required inputs, mark missing items, prepare a supervised draft, and request reviewer guidance, then prepare a Exit Clearance & Payroll Handoff Pack, and clearly mark which items are ready, returned, blocked, or escalated. If handled poorly, the leaver may be overpaid, access may remain active, or final settlement may be delayed. Artifact proof: Exit Clearance & Payroll Handoff Pack. Competency taxonomy: Functional; Technical; Behavioural; Domain; Evidence.',
  '8 hours',
  'Active',
  'Payroll, Benefits & Compliance Operations',
  'technical',
  '["Learner can complete guided check with supervisor review for Exit Clearance and Payroll Handoff and produce a reviewer-ready Exit Clearance & Payroll Handoff Pack with clear evidence and handoff logic.","Create a reviewer-ready Exit Clearance & Payroll Handoff Pack.","Use source data to resolve the skill gap: Learner must convert exit clearance and payroll handoff knowledge into a usable Exit Clearance & Payroll Handoff Pack: check resignation/termination trigger, notice and transition details, access/asset clearance, payroll recovery or payout handoff, identify missing or conflicting records, explain the level boundary, and create a reviewer-ready handoff.","Explain evidence and consequence through the Exit Clearance & Payroll Handoff Pack."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: Module 1: Exit Clearance & Payroll Handoff Pack Workplace Build
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-136' LIMIT 1),
  'Module 1: Exit Clearance & Payroll Handoff Pack Workplace Build',
  'Trigger: An offboarding coordinator receives 15 exit clearance and payroll handoff records in exit workflow tracker, asset clearance list, final settlement inputs, payroll stop sheet and manager confirmation; 4 show asset clearance pending, 2 show last working day changed, and 1 show leave encashment input missing. Pressure: The team needs a safe first check same working day so the reviewer does not waste time on incomplete evidence. Actuals: Volume: 15 records/cases. Issue count 1: 4 with asset clearance pending. Issue count 2: 2 with last working day changed. Issue count 3: 1 with leave encashment input missing. Systems/documents: exit workflow tracker, asset clearance list, final settlement inputs, payroll stop sheet and manager confirmation. Decision needed: ready, return, block, or escalate. Time pressure: same working day.',
  1,
  '["HR & Workforce Services","Payroll, Benefits & Compliance Operations","Employee Relations & Grievance Specialists; Workplace Investigation & Screening Risk Specialists; Offboarding, Transition & Outplacement Specialists","Employee Relations Specialist; Labor Relations Specialist; Grievance Officer; HR Specialist; Workplace Investigator","IND-CAP-28","Exit Clearance & Payroll Handoff Pack","Functional","Technical","Behavioural","Domain","Evidence"]'::jsonb,
  '["Start with the live trigger: 15 records arrive, 7 have visible issues, and a stakeholder needs an answer same working day.","Learner studies the actual data points: resignation/termination trigger, notice and transition details, access/asset clearance, payroll recovery or payout handoff, knowledge-transfer status, closure confirmation; then highlights missing fields, conflicts, late inputs, and owner gaps.","Teach the artifact logic: what each section means, which evidence is mandatory, what numbers must reconcile, and what the learner is allowed to decide at L1.","Learner completes the Exit Clearance & Payroll Handoff Pack using the case numbers, source references, exception labels, owner notes, and a clear ready/return/block/escalate recommendation.","Learner uses AI only for checklist prompts, concept reminders, and rubric self-checks. AI must not invent records, calculate unsupported numbers, approve decisions, or replace the learner''s judgement.","Learner reflects on what changed at L1: volume, exception complexity, stakeholder pressure, authority boundary, and evidence quality compared with the previous level."]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Exit Clearance & Payroll Handoff: Guided Practice: Data, Concepts and Artifact Evidence
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-136' LIMIT 1)
   AND title = 'Module 1: Exit Clearance & Payroll Handoff Pack Workplace Build' LIMIT 1),
  'Exit Clearance & Payroll Handoff: Guided Practice: Data, Concepts and Artifact Evidence',
  'Learner confusion: Students may understand the HR term but may not know how to read 15 messy records, compare source fields, quantify exceptions, choose proceed/return/escalate, or write the evidence trail in simple reviewer language. Root-cause focus: Investigate whether the real cause is missing source data, wrong effective date, unclear owner, system mismatch, late submission, policy/control risk, or weak handoff evidence in exit workflow tracker, asset clearance list, final settlement inputs, payroll stop sheet and manager confirmation.',
  'Problem: An offboarding coordinator is handling 15 exit clearance and payroll handoff records in exit workflow tracker, asset clearance list, final settlement inputs, payroll stop sheet and manager confirmation. The file is messy: 4 records have asset clearance pending, 2 have last working day changed, 1 have leave encashment input missing, and some cases also show payroll stop date not confirmed. The team needs a safe first check same working day so the reviewer does not waste time on incomplete evidence. The learner must check required inputs, mark missing items, prepare a supervised draft, and request reviewer guidance, then prepare a Exit Clearance & Payroll Handoff Pack, and clearly mark which items are ready, returned, blocked, or escalated. If handled poorly, the leaver may be overpaid, access may remain active, or final settlement may be delayed. Actuals: Volume: 15 records/cases. Issue count 1: 4 with asset clearance pending. Issue count 2: 2 with last working day changed. Issue count 3: 1 with leave encashment input missing. Systems/documents: exit workflow tracker, asset clearance list, final settlement inputs, payroll stop sheet and manager confirmation. Decision needed: ready, return, block, or escalate. Time pressure: same working day. Major concepts: exit workflow control - needed to complete and defend the Exit Clearance & Payroll Handoff Pack; last working day validation - needed to complete and defend the Exit Clearance & Payroll Handoff Pack; asset and access clearance - needed to complete and defend the Exit Clearance & Payroll Handoff Pack; final settlement input dependency - needed to complete and defend the Exit Clearance & Payroll Handoff Pack; payroll stop timing - needed to complete and defend the Exit Clearance & Payroll Handoff Pack; manager confirmation evidence - needed to complete and defend the Exit Clearance & Payroll Handoff Pack; handoff pack completion - needed to complete and defend the Exit Clearance & Payroll Handoff Pack; offboarding closure risk - needed to complete and defend the Exit Clearance & Payroll Handoff Pack Concept-to-artifact link: These concepts are not theory-only. They tell the learner what to check inside the Exit Clearance & Payroll Handoff Pack: source data, missing fields, exception rules, owner notes, decision status, handoff logic, and reviewer evidence. Required data: To solve the artifact, learner needs: resignation/termination trigger, notice and transition details, access/asset clearance, payroll recovery or payout handoff, knowledge-transfer status, closure confirmation; system screenshots or exports from exit workflow tracker, asset clearance list, final settlement inputs, payroll stop sheet and manager confirmation; policy or checklist rule used; stakeholder request; deadline/cut-off; prior status if available; reviewer or owner name; evidence of any unresolved exception. Artifact structure: Exit Clearance & Payroll Handoff Pack must contain: case or employee/candidate/worker identifier; source document reference; required data fields (resignation/termination trigger, notice and transition details, access/asset clearance, payroll recovery or payout handoff, knowledge-transfer status, closure confirmation); missing or conflicting item log; numeric issue count; exception category; owner/action note; proceed/return/block/escalate status; reviewer handoff note; closure or follow-up date. How to read artifact: Read the artifact as the learner''s final workplace proof. First check the identifiers and source documents, then the required fields, then the issue count and exception category, then the decision status, and finally whether the handoff note gives a reviewer enough evidence to act. Evidence fields: Assess whether the Exit Clearance & Payroll Handoff Pack uses the right source data, includes all required fields, counts and labels the 7 issue records correctly, separates normal items from exceptions, gives a clear decision reason, respects the L1 authority boundary, and provides a usable reviewer handoff. AI coach boundary: AI can ask: Which source proves this field? Which 4 records are blocked? What is the decision reason? What evidence is still missing? AI can summarize checklist gaps and suggest clearer wording, but cannot create missing data, approve the case, override policy, or make the final HR/payroll/compliance decision. Traceability: Industry: HR & Workforce Services.|Domain: Payroll, Benefits & Compliance Operations.|Role: Employee Relations Specialist; Labor Relations Specialist; Grievance Officer; HR Specialist; Workplace Investigator.|Capability_ID: IND-CAP-28.|Level: L1.|Course_ID: IND-S5-C-136.|Artifact: Exit Clearance & Payroll Handoff Pack.|Source Sheet: L1_COURSE_PATTERN.',
  1,
  '8 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Com
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-136' LIMIT 1),
  'B.Com',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Com
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-136' LIMIT 1),
  'M.Com',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BBA Human Resource Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-136' LIMIT 1),
  'BBA Human Resource Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MBA Human Resource Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-136' LIMIT 1),
  'MBA Human Resource Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PGDM Payroll and Statutory Compliance
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-136' LIMIT 1),
  'PGDM Payroll and Statutory Compliance',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: LLB / BA LLB Labour and Employment Law
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-136' LIMIT 1),
  'LLB / BA LLB Labour and Employment Law',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Requisition Intake Evidence: Routine Execution
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Requisition Intake Evidence: Routine Execution',
  'IND-S5-C-002',
  'Learner can complete routine execution with clean handoff for Requisition Intake & Approval and produce a reviewer-ready Requisition Intake Evidence Pack with clear evidence and handoff logic. Workplace scenario: A talent acquisition coordinator is handling 29 requisition intake and approval check records in ATS requisition tracker, budget approval mail, headcount tracker and job-description template. The file is messy: 7 records have missing budget code, 5 have replacement-versus-new-hire status not marked, 3 have approval mail attached without approver name, and some cases also show role justification copied from an old request. The team needs a clean routine handoff before the daily cut-off because downstream work cannot start until the artifact is usable. The learner must complete the standard workflow, update statuses, prepare the artifact, and send a clean handoff without needing step-by-step guidance, prepare a Requisition Intake Evidence Pack, and clearly mark which items are ready, returned, blocked, or escalated. If handled poorly, the requisition may be opened without approval evidence or returned late after recruiter capacity is already planned. Artifact proof: Requisition Intake Evidence Pack. Competency taxonomy: Functional; Technical; Behavioural; Cognitive; Evidence.',
  '10 hours',
  'Active',
  'Talent Acquisition & Recruitment Services',
  'technical',
  '["Learner can complete routine execution with clean handoff for Requisition Intake & Approval and produce a reviewer-ready Requisition Intake Evidence Pack with clear evidence and handoff logic.","Create a reviewer-ready Requisition Intake Evidence Pack.","Use source data to resolve the skill gap: Learner must convert requisition intake and approval check knowledge into a usable Requisition Intake Evidence Pack: check manager headcount request, budget or approval trail, role justification, job-details checklist, identify missing or conflicting records, explain the level boundary, and create a reviewer-ready handoff.","Explain evidence and consequence through the Requisition Intake Evidence Pack."]'::jsonb,
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
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-002' LIMIT 1),
  'Module 1: Requisition Intake Evidence Pack Workplace Build',
  'Trigger: A talent acquisition coordinator receives 29 requisition intake and approval check records in ATS requisition tracker, budget approval mail, headcount tracker and job-description template; 7 show missing budget code, 5 show replacement-versus-new-hire status not marked, and 3 show approval mail attached without approver name. Pressure: The team needs a clean routine handoff before the daily cut-off because downstream work cannot start until the artifact is usable. Actuals: Volume: 29 records/cases. Issue count 1: 7 with missing budget code. Issue count 2: 5 with replacement-versus-new-hire status not marked. Issue count 3: 3 with approval mail attached without approver name. Systems/documents: ATS requisition tracker, budget approval mail, headcount tracker and job-description template. Decision needed: ready, return, block, or escalate. Time pressure: before the daily cut-off.',
  1,
  '["HR & Workforce Services","Talent Acquisition & Recruitment Services","Recruitment & Talent Acquisition Specialists; Structured Hiring & Recruitment Operations Specialists","HR Specialist; Recruiter; HR Recruiter; Talent Acquisition Specialist; Candidate Screening Specialist","IND-CAP-01","Requisition Intake Evidence Pack","Functional","Technical","Behavioural","Cognitive","Evidence"]'::jsonb,
  '["Start with the live trigger: 29 records arrive, 15 have visible issues, and a stakeholder needs an answer before the daily cut-off.","Learner studies the actual data points: manager headcount request, budget or approval trail, role justification, job-details checklist, missing-input log, policy flags, recruiter handoff note; then highlights missing fields, conflicts, late inputs, and owner gaps.","Teach the artifact logic: what each section means, which evidence is mandatory, what numbers must reconcile, and what the learner is allowed to decide at L2.","Learner completes the Requisition Intake Evidence Pack using the case numbers, source references, exception labels, owner notes, and a clear ready/return/block/escalate recommendation.","Learner uses AI only for checklist prompts, concept reminders, and rubric self-checks. AI must not invent records, calculate unsupported numbers, approve decisions, or replace the learner''s judgement.","Learner reflects on what changed at L2: volume, exception complexity, stakeholder pressure, authority boundary, and evidence quality compared with the previous level."]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Requisition Intake Evidence: Routine Execution: Data, Concepts and Artifact Evidence
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-002' LIMIT 1)
   AND title = 'Module 1: Requisition Intake Evidence Pack Workplace Build' LIMIT 1),
  'Requisition Intake Evidence: Routine Execution: Data, Concepts and Artifact Evidence',
  'Learner confusion: Students may understand the HR term but may not know how to read 29 messy records, compare source fields, quantify exceptions, choose proceed/return/escalate, or write the evidence trail in simple reviewer language. Root-cause focus: Investigate whether the real cause is missing source data, wrong effective date, unclear owner, system mismatch, late submission, policy/control risk, or weak handoff evidence in ATS requisition tracker, budget approval mail, headcount tracker and job-description template.',
  'Problem: A talent acquisition coordinator is handling 29 requisition intake and approval check records in ATS requisition tracker, budget approval mail, headcount tracker and job-description template. The file is messy: 7 records have missing budget code, 5 have replacement-versus-new-hire status not marked, 3 have approval mail attached without approver name, and some cases also show role justification copied from an old request. The team needs a clean routine handoff before the daily cut-off because downstream work cannot start until the artifact is usable. The learner must complete the standard workflow, update statuses, prepare the artifact, and send a clean handoff without needing step-by-step guidance, prepare a Requisition Intake Evidence Pack, and clearly mark which items are ready, returned, blocked, or escalated. If handled poorly, the requisition may be opened without approval evidence or returned late after recruiter capacity is already planned. Actuals: Volume: 29 records/cases. Issue count 1: 7 with missing budget code. Issue count 2: 5 with replacement-versus-new-hire status not marked. Issue count 3: 3 with approval mail attached without approver name. Systems/documents: ATS requisition tracker, budget approval mail, headcount tracker and job-description template. Decision needed: ready, return, block, or escalate. Time pressure: before the daily cut-off. Major concepts: requisition intake control - needed to complete and defend the Requisition Intake Evidence Pack; headcount approval trail - needed to complete and defend the Requisition Intake Evidence Pack; budget code validation - needed to complete and defend the Requisition Intake Evidence Pack; new-hire versus replacement classification - needed to complete and defend the Requisition Intake Evidence Pack; mandatory job-detail fields - needed to complete and defend the Requisition Intake Evidence Pack; policy flagging - needed to complete and defend the Requisition Intake Evidence Pack; missing-input log - needed to complete and defend the Requisition Intake Evidence Pack; recruiter handoff standard - needed to complete and defend the Requisition Intake Evidence Pack Concept-to-artifact link: These concepts are not theory-only. They tell the learner what to check inside the Requisition Intake Evidence Pack: source data, missing fields, exception rules, owner notes, decision status, handoff logic, and reviewer evidence. Required data: To solve the artifact, learner needs: manager headcount request, budget or approval trail, role justification, job-details checklist, missing-input log, policy flags, recruiter handoff note; system screenshots or exports from ATS requisition tracker, budget approval mail, headcount tracker and job-description template; policy or checklist rule used; stakeholder request; deadline/cut-off; prior status if available; reviewer or owner name; evidence of any unresolved exception. Artifact structure: Requisition Intake Evidence Pack must contain: case or employee/candidate/worker identifier; source document reference; required data fields (manager headcount request, budget or approval trail, role justification, job-details checklist, missing-input log, policy flags, recruiter handoff note); missing or conflicting item log; numeric issue count; exception category; owner/action note; proceed/return/block/escalate status; reviewer handoff note; closure or follow-up date. How to read artifact: Read the artifact as the learner''s final workplace proof. First check the identifiers and source documents, then the required fields, then the issue count and exception category, then the decision status, and finally whether the handoff note gives a reviewer enough evidence to act. Evidence fields: Assess whether the Requisition Intake Evidence Pack uses the right source data, includes all required fields, counts and labels the 15 issue records correctly, separates normal items from exceptions, gives a clear decision reason, respects the L2 authority boundary, and provides a usable reviewer handoff. AI coach boundary: AI can ask: Which source proves this field? Which 7 records are blocked? What is the decision reason? What evidence is still missing? AI can summarize checklist gaps and suggest clearer wording, but cannot create missing data, approve the case, override policy, or make the final HR/payroll/compliance decision. Traceability: Industry: HR & Workforce Services.|Domain: Talent Acquisition & Recruitment Services.|Role: HR Specialist; Recruiter; HR Recruiter; Talent Acquisition Specialist; Candidate Screening Specialist.|Capability_ID: IND-CAP-01.|Level: L2.|Course_ID: IND-S5-C-002.|Artifact: Requisition Intake Evidence Pack.|Source Sheet: L2_COURSE_PATTERN.',
  1,
  '10 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BBA Human Resource Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-002' LIMIT 1),
  'BBA Human Resource Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MBA Human Resource Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-002' LIMIT 1),
  'MBA Human Resource Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PGDM Human Resource Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-002' LIMIT 1),
  'PGDM Human Resource Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BA Psychology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-002' LIMIT 1),
  'BA Psychology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MSW Human Resource Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-002' LIMIT 1),
  'MSW Human Resource Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Candidate Screening: Routine Execution
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Candidate Screening: Routine Execution',
  'IND-S5-C-007',
  'Learner can complete routine execution with clean handoff for Candidate Screening & Interview Readiness and produce a reviewer-ready Candidate Screening Matrix with clear evidence and handoff logic. Workplace scenario: A recruiter is handling 30 candidate screening and interview-readiness check records in ATS candidate pool, approved requisition, resume files, screening notes and interview calendar. The file is messy: 8 records have profiles missing notice period, 6 have shift availability not stated, 2 have CRM or domain experience not evidenced, and some cases also show salary expectation above range. The team needs a clean routine handoff before the daily cut-off because downstream work cannot start until the artifact is usable. The learner must complete the standard workflow, update statuses, prepare the artifact, and send a clean handoff without needing step-by-step guidance, prepare a Candidate Screening Matrix, and clearly mark which items are ready, returned, blocked, or escalated. If handled poorly, interviewers may spend time on unsuitable candidates or strong candidates may be missed. Artifact proof: Candidate Screening Matrix. Competency taxonomy: Functional; Technical; Behavioural; Domain; Evidence.',
  '10 hours',
  'Active',
  'Talent Acquisition & Recruitment Services',
  'technical',
  '["Learner can complete routine execution with clean handoff for Candidate Screening & Interview Readiness and produce a reviewer-ready Candidate Screening Matrix with clear evidence and handoff logic.","Create a reviewer-ready Candidate Screening Matrix.","Use source data to resolve the skill gap: Learner must convert candidate screening and interview-readiness check knowledge into a usable Candidate Screening Matrix: check requisition criteria, eligibility/knockout check, shortlisted/rejected rationale, missing-candidate-data log, identify missing or conflicting records, explain the level boundary, and create a reviewer-ready handoff.","Explain evidence and consequence through the Candidate Screening Matrix."]'::jsonb,
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
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-007' LIMIT 1),
  'Module 1: Candidate Screening Matrix Workplace Build',
  'Trigger: A recruiter receives 30 candidate screening and interview-readiness check records in ATS candidate pool, approved requisition, resume files, screening notes and interview calendar; 8 show profiles missing notice period, 6 show shift availability not stated, and 2 show CRM or domain experience not evidenced. Pressure: The team needs a clean routine handoff before the daily cut-off because downstream work cannot start until the artifact is usable. Actuals: Volume: 30 records/cases. Issue count 1: 8 with profiles missing notice period. Issue count 2: 6 with shift availability not stated. Issue count 3: 2 with CRM or domain experience not evidenced. Systems/documents: ATS candidate pool, approved requisition, resume files, screening notes and interview calendar. Decision needed: ready, return, block, or escalate. Time pressure: before the daily cut-off.',
  1,
  '["HR & Workforce Services","Talent Acquisition & Recruitment Services","Recruitment & Talent Acquisition Specialists; Structured Hiring & Recruitment Operations Specialists","HR Specialist; Recruiter; HR Recruiter; Talent Acquisition Specialist; Candidate Screening Specialist","IND-CAP-02","Candidate Screening Matrix","Functional","Technical","Behavioural","Domain","Evidence"]'::jsonb,
  '["Start with the live trigger: 30 records arrive, 16 have visible issues, and a stakeholder needs an answer before the daily cut-off.","Learner studies the actual data points: requisition criteria, eligibility/knockout check, shortlisted/rejected rationale, missing-candidate-data log, interview-readiness recommendation; then highlights missing fields, conflicts, late inputs, and owner gaps.","Teach the artifact logic: what each section means, which evidence is mandatory, what numbers must reconcile, and what the learner is allowed to decide at L2.","Learner completes the Candidate Screening Matrix using the case numbers, source references, exception labels, owner notes, and a clear ready/return/block/escalate recommendation.","Learner uses AI only for checklist prompts, concept reminders, and rubric self-checks. AI must not invent records, calculate unsupported numbers, approve decisions, or replace the learner''s judgement.","Learner reflects on what changed at L2: volume, exception complexity, stakeholder pressure, authority boundary, and evidence quality compared with the previous level."]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Candidate Screening: Routine Execution: Data, Concepts and Artifact Evidence
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-007' LIMIT 1)
   AND title = 'Module 1: Candidate Screening Matrix Workplace Build' LIMIT 1),
  'Candidate Screening: Routine Execution: Data, Concepts and Artifact Evidence',
  'Learner confusion: Students may understand the HR term but may not know how to read 30 messy records, compare source fields, quantify exceptions, choose proceed/return/escalate, or write the evidence trail in simple reviewer language. Root-cause focus: Investigate whether the real cause is missing source data, wrong effective date, unclear owner, system mismatch, late submission, policy/control risk, or weak handoff evidence in ATS candidate pool, approved requisition, resume files, screening notes and interview calendar.',
  'Problem: A recruiter is handling 30 candidate screening and interview-readiness check records in ATS candidate pool, approved requisition, resume files, screening notes and interview calendar. The file is messy: 8 records have profiles missing notice period, 6 have shift availability not stated, 2 have CRM or domain experience not evidenced, and some cases also show salary expectation above range. The team needs a clean routine handoff before the daily cut-off because downstream work cannot start until the artifact is usable. The learner must complete the standard workflow, update statuses, prepare the artifact, and send a clean handoff without needing step-by-step guidance, prepare a Candidate Screening Matrix, and clearly mark which items are ready, returned, blocked, or escalated. If handled poorly, interviewers may spend time on unsuitable candidates or strong candidates may be missed. Actuals: Volume: 30 records/cases. Issue count 1: 8 with profiles missing notice period. Issue count 2: 6 with shift availability not stated. Issue count 3: 2 with CRM or domain experience not evidenced. Systems/documents: ATS candidate pool, approved requisition, resume files, screening notes and interview calendar. Decision needed: ready, return, block, or escalate. Time pressure: before the daily cut-off. Major concepts: must-have versus good-to-have criteria - needed to complete and defend the Candidate Screening Matrix; candidate evidence matching - needed to complete and defend the Candidate Screening Matrix; screening matrix logic - needed to complete and defend the Candidate Screening Matrix; notice-period validation - needed to complete and defend the Candidate Screening Matrix; salary-range fit - needed to complete and defend the Candidate Screening Matrix; shift and location fit - needed to complete and defend the Candidate Screening Matrix; interview-readiness decision - needed to complete and defend the Candidate Screening Matrix; shortlist documentation - needed to complete and defend the Candidate Screening Matrix Concept-to-artifact link: These concepts are not theory-only. They tell the learner what to check inside the Candidate Screening Matrix: source data, missing fields, exception rules, owner notes, decision status, handoff logic, and reviewer evidence. Required data: To solve the artifact, learner needs: requisition criteria, eligibility/knockout check, shortlisted/rejected rationale, missing-candidate-data log, interview-readiness recommendation; system screenshots or exports from ATS candidate pool, approved requisition, resume files, screening notes and interview calendar; policy or checklist rule used; stakeholder request; deadline/cut-off; prior status if available; reviewer or owner name; evidence of any unresolved exception. Artifact structure: Candidate Screening Matrix must contain: case or employee/candidate/worker identifier; source document reference; required data fields (requisition criteria, eligibility/knockout check, shortlisted/rejected rationale, missing-candidate-data log, interview-readiness recommendation); missing or conflicting item log; numeric issue count; exception category; owner/action note; proceed/return/block/escalate status; reviewer handoff note; closure or follow-up date. How to read artifact: Read the artifact as the learner''s final workplace proof. First check the identifiers and source documents, then the required fields, then the issue count and exception category, then the decision status, and finally whether the handoff note gives a reviewer enough evidence to act. Evidence fields: Assess whether the Candidate Screening Matrix uses the right source data, includes all required fields, counts and labels the 16 issue records correctly, separates normal items from exceptions, gives a clear decision reason, respects the L2 authority boundary, and provides a usable reviewer handoff. AI coach boundary: AI can ask: Which source proves this field? Which 8 records are blocked? What is the decision reason? What evidence is still missing? AI can summarize checklist gaps and suggest clearer wording, but cannot create missing data, approve the case, override policy, or make the final HR/payroll/compliance decision. Traceability: Industry: HR & Workforce Services.|Domain: Talent Acquisition & Recruitment Services.|Role: HR Specialist; Recruiter; HR Recruiter; Talent Acquisition Specialist; Candidate Screening Specialist.|Capability_ID: IND-CAP-02.|Level: L2.|Course_ID: IND-S5-C-007.|Artifact: Candidate Screening Matrix.|Source Sheet: L2_COURSE_PATTERN.',
  1,
  '10 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BBA Human Resource Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-007' LIMIT 1),
  'BBA Human Resource Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MBA Human Resource Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-007' LIMIT 1),
  'MBA Human Resource Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PGDM Human Resource Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-007' LIMIT 1),
  'PGDM Human Resource Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BA Psychology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-007' LIMIT 1),
  'BA Psychology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MSW Human Resource Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-007' LIMIT 1),
  'MSW Human Resource Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Interview Evaluation Evidence: Routine Execution
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Interview Evaluation Evidence: Routine Execution',
  'IND-S5-C-012',
  'Learner can complete routine execution with clean handoff for Interview Coordination & Scorecard Evidence and produce a reviewer-ready Interview Evaluation Evidence Pack with clear evidence and handoff logic. Workplace scenario: A recruitment coordinator is handling 31 interview evaluation and decision evidence closure records in ATS interview workflow, interviewer scorecards, candidate feedback notes, panel calendar and decision tracker. The file is messy: 9 records have scorecards submitted late, 4 have interviewers using different rating language, 3 have candidate feedback missing for one round, and some cases also show decision summary not aligned to evidence. The team needs a clean routine handoff before the daily cut-off because downstream work cannot start until the artifact is usable. The learner must complete the standard workflow, update statuses, prepare the artifact, and send a clean handoff without needing step-by-step guidance, prepare a Interview Evaluation Evidence Pack, and clearly mark which items are ready, returned, blocked, or escalated. If handled poorly, the selection decision may look biased, unclear, or unsupported during later review. Artifact proof: Interview Evaluation Evidence Pack. Competency taxonomy: Functional; Technical; Behavioural; Domain; Evidence.',
  '10 hours',
  'Active',
  'Talent Acquisition & Recruitment Services',
  'soft',
  '["Learner can complete routine execution with clean handoff for Interview Coordination & Scorecard Evidence and produce a reviewer-ready Interview Evaluation Evidence Pack with clear evidence and handoff logic.","Create a reviewer-ready Interview Evaluation Evidence Pack.","Use source data to resolve the skill gap: Learner must convert interview evaluation and decision evidence closure knowledge into a usable Interview Evaluation Evidence Pack: check interview plan, interviewer availability, competency questions, scorecard entries, identify missing or conflicting records, explain the level boundary, and create a reviewer-ready handoff.","Explain evidence and consequence through the Interview Evaluation Evidence Pack."]'::jsonb,
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
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-012' LIMIT 1),
  'Module 1: Interview Evaluation Evidence Pack Workplace Build',
  'Trigger: A recruitment coordinator receives 31 interview evaluation and decision evidence closure records in ATS interview workflow, interviewer scorecards, candidate feedback notes, panel calendar and decision tracker; 9 show scorecards submitted late, 4 show interviewers using different rating language, and 3 show candidate feedback missing for one round. Pressure: The team needs a clean routine handoff before the daily cut-off because downstream work cannot start until the artifact is usable. Actuals: Volume: 31 records/cases. Issue count 1: 9 with scorecards submitted late. Issue count 2: 4 with interviewers using different rating language. Issue count 3: 3 with candidate feedback missing for one round. Systems/documents: ATS interview workflow, interviewer scorecards, candidate feedback notes, panel calendar and decision tracker. Decision needed: ready, return, block, or escalate. Time pressure: before the daily cut-off.',
  1,
  '["HR & Workforce Services","Talent Acquisition & Recruitment Services","Recruitment & Talent Acquisition Specialists; Structured Hiring & Recruitment Operations Specialists","HR Specialist; Recruiter; HR Recruiter; Talent Acquisition Specialist; Candidate Screening Specialist","IND-CAP-03","Interview Evaluation Evidence Pack","Functional","Technical","Behavioural","Domain","Evidence"]'::jsonb,
  '["Start with the live trigger: 31 records arrive, 16 have visible issues, and a stakeholder needs an answer before the daily cut-off.","Learner studies the actual data points: interview plan, interviewer availability, competency questions, scorecard entries, candidate feedback note, selection decision summary; then highlights missing fields, conflicts, late inputs, and owner gaps.","Teach the artifact logic: what each section means, which evidence is mandatory, what numbers must reconcile, and what the learner is allowed to decide at L2.","Learner completes the Interview Evaluation Evidence Pack using the case numbers, source references, exception labels, owner notes, and a clear ready/return/block/escalate recommendation.","Learner uses AI only for checklist prompts, concept reminders, and rubric self-checks. AI must not invent records, calculate unsupported numbers, approve decisions, or replace the learner''s judgement.","Learner reflects on what changed at L2: volume, exception complexity, stakeholder pressure, authority boundary, and evidence quality compared with the previous level."]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Interview Evaluation Evidence: Routine Execution: Data, Concepts and Artifact Evidence
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-012' LIMIT 1)
   AND title = 'Module 1: Interview Evaluation Evidence Pack Workplace Build' LIMIT 1),
  'Interview Evaluation Evidence: Routine Execution: Data, Concepts and Artifact Evidence',
  'Learner confusion: Students may understand the HR term but may not know how to read 31 messy records, compare source fields, quantify exceptions, choose proceed/return/escalate, or write the evidence trail in simple reviewer language. Root-cause focus: Investigate whether the real cause is missing source data, wrong effective date, unclear owner, system mismatch, late submission, policy/control risk, or weak handoff evidence in ATS interview workflow, interviewer scorecards, candidate feedback notes, panel calendar and decision tracker.',
  'Problem: A recruitment coordinator is handling 31 interview evaluation and decision evidence closure records in ATS interview workflow, interviewer scorecards, candidate feedback notes, panel calendar and decision tracker. The file is messy: 9 records have scorecards submitted late, 4 have interviewers using different rating language, 3 have candidate feedback missing for one round, and some cases also show decision summary not aligned to evidence. The team needs a clean routine handoff before the daily cut-off because downstream work cannot start until the artifact is usable. The learner must complete the standard workflow, update statuses, prepare the artifact, and send a clean handoff without needing step-by-step guidance, prepare a Interview Evaluation Evidence Pack, and clearly mark which items are ready, returned, blocked, or escalated. If handled poorly, the selection decision may look biased, unclear, or unsupported during later review. Actuals: Volume: 31 records/cases. Issue count 1: 9 with scorecards submitted late. Issue count 2: 4 with interviewers using different rating language. Issue count 3: 3 with candidate feedback missing for one round. Systems/documents: ATS interview workflow, interviewer scorecards, candidate feedback notes, panel calendar and decision tracker. Decision needed: ready, return, block, or escalate. Time pressure: before the daily cut-off. Major concepts: structured interview evidence - needed to complete and defend the Interview Evaluation Evidence Pack; scorecard completeness - needed to complete and defend the Interview Evaluation Evidence Pack; rating calibration - needed to complete and defend the Interview Evaluation Evidence Pack; decision-summary logic - needed to complete and defend the Interview Evaluation Evidence Pack; feedback traceability - needed to complete and defend the Interview Evaluation Evidence Pack; interviewer accountability - needed to complete and defend the Interview Evaluation Evidence Pack; candidate-stage closure - needed to complete and defend the Interview Evaluation Evidence Pack; fair-selection evidence - needed to complete and defend the Interview Evaluation Evidence Pack Concept-to-artifact link: These concepts are not theory-only. They tell the learner what to check inside the Interview Evaluation Evidence Pack: source data, missing fields, exception rules, owner notes, decision status, handoff logic, and reviewer evidence. Required data: To solve the artifact, learner needs: interview plan, interviewer availability, competency questions, scorecard entries, candidate feedback note, selection decision summary; system screenshots or exports from ATS interview workflow, interviewer scorecards, candidate feedback notes, panel calendar and decision tracker; policy or checklist rule used; stakeholder request; deadline/cut-off; prior status if available; reviewer or owner name; evidence of any unresolved exception. Artifact structure: Interview Evaluation Evidence Pack must contain: case or employee/candidate/worker identifier; source document reference; required data fields (interview plan, interviewer availability, competency questions, scorecard entries, candidate feedback note, selection decision summary); missing or conflicting item log; numeric issue count; exception category; owner/action note; proceed/return/block/escalate status; reviewer handoff note; closure or follow-up date. How to read artifact: Read the artifact as the learner''s final workplace proof. First check the identifiers and source documents, then the required fields, then the issue count and exception category, then the decision status, and finally whether the handoff note gives a reviewer enough evidence to act. Evidence fields: Assess whether the Interview Evaluation Evidence Pack uses the right source data, includes all required fields, counts and labels the 16 issue records correctly, separates normal items from exceptions, gives a clear decision reason, respects the L2 authority boundary, and provides a usable reviewer handoff. AI coach boundary: AI can ask: Which source proves this field? Which 9 records are blocked? What is the decision reason? What evidence is still missing? AI can summarize checklist gaps and suggest clearer wording, but cannot create missing data, approve the case, override policy, or make the final HR/payroll/compliance decision. Traceability: Industry: HR & Workforce Services.|Domain: Talent Acquisition & Recruitment Services.|Role: HR Specialist; Recruiter; HR Recruiter; Talent Acquisition Specialist; Candidate Screening Specialist.|Capability_ID: IND-CAP-03.|Level: L2.|Course_ID: IND-S5-C-012.|Artifact: Interview Evaluation Evidence Pack.|Source Sheet: L2_COURSE_PATTERN.',
  1,
  '10 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BBA Human Resource Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-012' LIMIT 1),
  'BBA Human Resource Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MBA Human Resource Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-012' LIMIT 1),
  'MBA Human Resource Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PGDM Human Resource Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-012' LIMIT 1),
  'PGDM Human Resource Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BA Psychology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-012' LIMIT 1),
  'BA Psychology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MSW Human Resource Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-012' LIMIT 1),
  'MSW Human Resource Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Offer Handoff & Hiring Closure: Routine Execution
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Offer Handoff & Hiring Closure: Routine Execution',
  'IND-S5-C-017',
  'Learner can complete routine execution with clean handoff for Offer Approval Handoff & Hiring Closure and produce a reviewer-ready Offer Handoff & Hiring Closure Pack with clear evidence and handoff logic. Workplace scenario: A talent acquisition specialist is handling 32 offer handoff and hiring closure records in ATS offer workflow, compensation approval sheet, joining document checklist and HR operations handoff tracker. The file is messy: 6 records have compensation approval pending, 5 have joining date changed after offer draft, 2 have background verification status unclear, and some cases also show HR ops handoff missing document owner. The team needs a clean routine handoff before the daily cut-off because downstream work cannot start until the artifact is usable. The learner must complete the standard workflow, update statuses, prepare the artifact, and send a clean handoff without needing step-by-step guidance, prepare a Offer Handoff & Hiring Closure Pack, and clearly mark which items are ready, returned, blocked, or escalated. If handled poorly, offer release may be delayed, joining data may be wrong, or HR operations may receive an incomplete handoff. Artifact proof: Offer Handoff & Hiring Closure Pack. Competency taxonomy: Functional; Technical; Behavioural; Domain; Evidence.',
  '10 hours',
  'Active',
  'Talent Acquisition & Recruitment Services',
  'technical',
  '["Learner can complete routine execution with clean handoff for Offer Approval Handoff & Hiring Closure and produce a reviewer-ready Offer Handoff & Hiring Closure Pack with clear evidence and handoff logic.","Create a reviewer-ready Offer Handoff & Hiring Closure Pack.","Use source data to resolve the skill gap: Learner must convert offer handoff and hiring closure knowledge into a usable Offer Handoff & Hiring Closure Pack: check finalist decision record, compensation-range check, approval trail, offer-draft handoff, identify missing or conflicting records, explain the level boundary, and create a reviewer-ready handoff.","Explain evidence and consequence through the Offer Handoff & Hiring Closure Pack."]'::jsonb,
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
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-017' LIMIT 1),
  'Module 1: Offer Handoff & Hiring Closure Pack Workplace Build',
  'Trigger: A talent acquisition specialist receives 32 offer handoff and hiring closure records in ATS offer workflow, compensation approval sheet, joining document checklist and HR operations handoff tracker; 6 show compensation approval pending, 5 show joining date changed after offer draft, and 2 show background verification status unclear. Pressure: The team needs a clean routine handoff before the daily cut-off because downstream work cannot start until the artifact is usable. Actuals: Volume: 32 records/cases. Issue count 1: 6 with compensation approval pending. Issue count 2: 5 with joining date changed after offer draft. Issue count 3: 2 with background verification status unclear. Systems/documents: ATS offer workflow, compensation approval sheet, joining document checklist and HR operations handoff tracker. Decision needed: ready, return, block, or escalate. Time pressure: before the daily cut-off.',
  1,
  '["HR & Workforce Services","Talent Acquisition & Recruitment Services","Recruitment & Talent Acquisition Specialists; Structured Hiring & Recruitment Operations Specialists","HR Specialist; Recruiter; HR Recruiter; Talent Acquisition Specialist; Candidate Screening Specialist","IND-CAP-04","Offer Handoff & Hiring Closure Pack","Functional","Technical","Behavioural","Domain","Evidence"]'::jsonb,
  '["Start with the live trigger: 32 records arrive, 13 have visible issues, and a stakeholder needs an answer before the daily cut-off.","Learner studies the actual data points: finalist decision record, compensation-range check, approval trail, offer-draft handoff, acceptance/decline status, hiring outcome closure note; then highlights missing fields, conflicts, late inputs, and owner gaps.","Teach the artifact logic: what each section means, which evidence is mandatory, what numbers must reconcile, and what the learner is allowed to decide at L2.","Learner completes the Offer Handoff & Hiring Closure Pack using the case numbers, source references, exception labels, owner notes, and a clear ready/return/block/escalate recommendation.","Learner uses AI only for checklist prompts, concept reminders, and rubric self-checks. AI must not invent records, calculate unsupported numbers, approve decisions, or replace the learner''s judgement.","Learner reflects on what changed at L2: volume, exception complexity, stakeholder pressure, authority boundary, and evidence quality compared with the previous level."]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Offer Handoff & Hiring Closure: Routine Execution: Data, Concepts and Artifact Evidence
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-017' LIMIT 1)
   AND title = 'Module 1: Offer Handoff & Hiring Closure Pack Workplace Build' LIMIT 1),
  'Offer Handoff & Hiring Closure: Routine Execution: Data, Concepts and Artifact Evidence',
  'Learner confusion: Students may understand the HR term but may not know how to read 32 messy records, compare source fields, quantify exceptions, choose proceed/return/escalate, or write the evidence trail in simple reviewer language. Root-cause focus: Investigate whether the real cause is missing source data, wrong effective date, unclear owner, system mismatch, late submission, policy/control risk, or weak handoff evidence in ATS offer workflow, compensation approval sheet, joining document checklist and HR operations handoff tracker.',
  'Problem: A talent acquisition specialist is handling 32 offer handoff and hiring closure records in ATS offer workflow, compensation approval sheet, joining document checklist and HR operations handoff tracker. The file is messy: 6 records have compensation approval pending, 5 have joining date changed after offer draft, 2 have background verification status unclear, and some cases also show HR ops handoff missing document owner. The team needs a clean routine handoff before the daily cut-off because downstream work cannot start until the artifact is usable. The learner must complete the standard workflow, update statuses, prepare the artifact, and send a clean handoff without needing step-by-step guidance, prepare a Offer Handoff & Hiring Closure Pack, and clearly mark which items are ready, returned, blocked, or escalated. If handled poorly, offer release may be delayed, joining data may be wrong, or HR operations may receive an incomplete handoff. Actuals: Volume: 32 records/cases. Issue count 1: 6 with compensation approval pending. Issue count 2: 5 with joining date changed after offer draft. Issue count 3: 2 with background verification status unclear. Systems/documents: ATS offer workflow, compensation approval sheet, joining document checklist and HR operations handoff tracker. Decision needed: ready, return, block, or escalate. Time pressure: before the daily cut-off. Major concepts: offer approval control - needed to complete and defend the Offer Handoff & Hiring Closure Pack; compensation fit check - needed to complete and defend the Offer Handoff & Hiring Closure Pack; joining-date dependency - needed to complete and defend the Offer Handoff & Hiring Closure Pack; document owner mapping - needed to complete and defend the Offer Handoff & Hiring Closure Pack; background check dependency - needed to complete and defend the Offer Handoff & Hiring Closure Pack; offer-to-joining handoff - needed to complete and defend the Offer Handoff & Hiring Closure Pack; closure evidence - needed to complete and defend the Offer Handoff & Hiring Closure Pack; candidate communication trail - needed to complete and defend the Offer Handoff & Hiring Closure Pack Concept-to-artifact link: These concepts are not theory-only. They tell the learner what to check inside the Offer Handoff & Hiring Closure Pack: source data, missing fields, exception rules, owner notes, decision status, handoff logic, and reviewer evidence. Required data: To solve the artifact, learner needs: finalist decision record, compensation-range check, approval trail, offer-draft handoff, acceptance/decline status, hiring outcome closure note; system screenshots or exports from ATS offer workflow, compensation approval sheet, joining document checklist and HR operations handoff tracker; policy or checklist rule used; stakeholder request; deadline/cut-off; prior status if available; reviewer or owner name; evidence of any unresolved exception. Artifact structure: Offer Handoff & Hiring Closure Pack must contain: case or employee/candidate/worker identifier; source document reference; required data fields (finalist decision record, compensation-range check, approval trail, offer-draft handoff, acceptance/decline status, hiring outcome closure note); missing or conflicting item log; numeric issue count; exception category; owner/action note; proceed/return/block/escalate status; reviewer handoff note; closure or follow-up date. How to read artifact: Read the artifact as the learner''s final workplace proof. First check the identifiers and source documents, then the required fields, then the issue count and exception category, then the decision status, and finally whether the handoff note gives a reviewer enough evidence to act. Evidence fields: Assess whether the Offer Handoff & Hiring Closure Pack uses the right source data, includes all required fields, counts and labels the 13 issue records correctly, separates normal items from exceptions, gives a clear decision reason, respects the L2 authority boundary, and provides a usable reviewer handoff. AI coach boundary: AI can ask: Which source proves this field? Which 6 records are blocked? What is the decision reason? What evidence is still missing? AI can summarize checklist gaps and suggest clearer wording, but cannot create missing data, approve the case, override policy, or make the final HR/payroll/compliance decision. Traceability: Industry: HR & Workforce Services.|Domain: Talent Acquisition & Recruitment Services.|Role: HR Specialist; Recruiter; HR Recruiter; Talent Acquisition Specialist; Candidate Screening Specialist.|Capability_ID: IND-CAP-04.|Level: L2.|Course_ID: IND-S5-C-017.|Artifact: Offer Handoff & Hiring Closure Pack.|Source Sheet: L2_COURSE_PATTERN.',
  1,
  '10 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BBA Human Resource Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-017' LIMIT 1),
  'BBA Human Resource Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MBA Human Resource Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-017' LIMIT 1),
  'MBA Human Resource Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PGDM Human Resource Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-017' LIMIT 1),
  'PGDM Human Resource Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BA Psychology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-017' LIMIT 1),
  'BA Psychology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MSW Human Resource Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-017' LIMIT 1),
  'MSW Human Resource Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Staffing Deployment Confirmation: Routine Execution
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Staffing Deployment Confirmation: Routine Execution',
  'IND-S5-C-022',
  'Learner can complete routine execution with clean handoff for Staffing Order Fulfilment and produce a reviewer-ready Staffing Deployment Confirmation Tracker with clear evidence and handoff logic. Workplace scenario: A staffing fulfillment coordinator is handling 33 temporary staffing deployment confirmation records in staffing order tracker, client requirement sheet, worker availability roster and deployment confirmation log. The file is messy: 7 records have worker availability changed, 6 have client shift pattern unclear, 3 have joining location differs from order, and some cases also show ID or compliance document still pending. The team needs a clean routine handoff before the daily cut-off because downstream work cannot start until the artifact is usable. The learner must complete the standard workflow, update statuses, prepare the artifact, and send a clean handoff without needing step-by-step guidance, prepare a Staffing Deployment Confirmation Tracker, and clearly mark which items are ready, returned, blocked, or escalated. If handled poorly, the wrong worker may be deployed, the client roster may fail, or the worker may arrive without valid clearance. Artifact proof: Staffing Deployment Confirmation Tracker. Competency taxonomy: Functional; Technical; Behavioural; Cognitive; Evidence.',
  '10 hours',
  'Active',
  'Staffing Operations',
  'technical',
  '["Learner can complete routine execution with clean handoff for Staffing Order Fulfilment and produce a reviewer-ready Staffing Deployment Confirmation Tracker with clear evidence and handoff logic.","Create a reviewer-ready Staffing Deployment Confirmation Tracker.","Use source data to resolve the skill gap: Learner must convert temporary staffing deployment confirmation knowledge into a usable Staffing Deployment Confirmation Tracker: check staffing order, worker availability, client assignment details, onboarding/shift instructions, identify missing or conflicting records, explain the level boundary, and create a reviewer-ready handoff.","Explain evidence and consequence through the Staffing Deployment Confirmation Tracker."]'::jsonb,
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
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-022' LIMIT 1),
  'Module 1: Staffing Deployment Confirmation Tracker Workplace Build',
  'Trigger: A staffing fulfillment coordinator receives 33 temporary staffing deployment confirmation records in staffing order tracker, client requirement sheet, worker availability roster and deployment confirmation log; 7 show worker availability changed, 6 show client shift pattern unclear, and 3 show joining location differs from order. Pressure: The team needs a clean routine handoff before the daily cut-off because downstream work cannot start until the artifact is usable. Actuals: Volume: 33 records/cases. Issue count 1: 7 with worker availability changed. Issue count 2: 6 with client shift pattern unclear. Issue count 3: 3 with joining location differs from order. Systems/documents: staffing order tracker, client requirement sheet, worker availability roster and deployment confirmation log. Decision needed: ready, return, block, or escalate. Time pressure: before the daily cut-off.',
  1,
  '["HR & Workforce Services","Staffing Operations","Staffing & Workforce Fulfillment Coordinators; Employer-of-Record & Global Employment Operations Specialists","Staffing Consultant; Workforce Fulfillment Coordinator; Managed HR Service Specialist; Recruitment Coordinator; EOR Operations Specialist","IND-CAP-05","Staffing Deployment Confirmation Tracker","Functional","Technical","Behavioural","Cognitive","Evidence"]'::jsonb,
  '["Start with the live trigger: 33 records arrive, 16 have visible issues, and a stakeholder needs an answer before the daily cut-off.","Learner studies the actual data points: staffing order, worker availability, client assignment details, onboarding/shift instructions, first-shift confirmation, issue log; then highlights missing fields, conflicts, late inputs, and owner gaps.","Teach the artifact logic: what each section means, which evidence is mandatory, what numbers must reconcile, and what the learner is allowed to decide at L2.","Learner completes the Staffing Deployment Confirmation Tracker using the case numbers, source references, exception labels, owner notes, and a clear ready/return/block/escalate recommendation.","Learner uses AI only for checklist prompts, concept reminders, and rubric self-checks. AI must not invent records, calculate unsupported numbers, approve decisions, or replace the learner''s judgement.","Learner reflects on what changed at L2: volume, exception complexity, stakeholder pressure, authority boundary, and evidence quality compared with the previous level."]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Staffing Deployment Confirmation: Routine Execution: Data, Concepts and Artifact Evidence
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-022' LIMIT 1)
   AND title = 'Module 1: Staffing Deployment Confirmation Tracker Workplace Build' LIMIT 1),
  'Staffing Deployment Confirmation: Routine Execution: Data, Concepts and Artifact Evidence',
  'Learner confusion: Students may understand the HR term but may not know how to read 33 messy records, compare source fields, quantify exceptions, choose proceed/return/escalate, or write the evidence trail in simple reviewer language. Root-cause focus: Investigate whether the real cause is missing source data, wrong effective date, unclear owner, system mismatch, late submission, policy/control risk, or weak handoff evidence in staffing order tracker, client requirement sheet, worker availability roster and deployment confirmation log.',
  'Problem: A staffing fulfillment coordinator is handling 33 temporary staffing deployment confirmation records in staffing order tracker, client requirement sheet, worker availability roster and deployment confirmation log. The file is messy: 7 records have worker availability changed, 6 have client shift pattern unclear, 3 have joining location differs from order, and some cases also show ID or compliance document still pending. The team needs a clean routine handoff before the daily cut-off because downstream work cannot start until the artifact is usable. The learner must complete the standard workflow, update statuses, prepare the artifact, and send a clean handoff without needing step-by-step guidance, prepare a Staffing Deployment Confirmation Tracker, and clearly mark which items are ready, returned, blocked, or escalated. If handled poorly, the wrong worker may be deployed, the client roster may fail, or the worker may arrive without valid clearance. Actuals: Volume: 33 records/cases. Issue count 1: 7 with worker availability changed. Issue count 2: 6 with client shift pattern unclear. Issue count 3: 3 with joining location differs from order. Systems/documents: staffing order tracker, client requirement sheet, worker availability roster and deployment confirmation log. Decision needed: ready, return, block, or escalate. Time pressure: before the daily cut-off. Major concepts: staffing order fulfilment - needed to complete and defend the Staffing Deployment Confirmation Tracker; worker availability confirmation - needed to complete and defend the Staffing Deployment Confirmation Tracker; shift and location matching - needed to complete and defend the Staffing Deployment Confirmation Tracker; deployment readiness control - needed to complete and defend the Staffing Deployment Confirmation Tracker; client confirmation trail - needed to complete and defend the Staffing Deployment Confirmation Tracker; worker document dependency - needed to complete and defend the Staffing Deployment Confirmation Tracker; roster lock timing - needed to complete and defend the Staffing Deployment Confirmation Tracker; handoff accountability - needed to complete and defend the Staffing Deployment Confirmation Tracker Concept-to-artifact link: These concepts are not theory-only. They tell the learner what to check inside the Staffing Deployment Confirmation Tracker: source data, missing fields, exception rules, owner notes, decision status, handoff logic, and reviewer evidence. Required data: To solve the artifact, learner needs: staffing order, worker availability, client assignment details, onboarding/shift instructions, first-shift confirmation, issue log; system screenshots or exports from staffing order tracker, client requirement sheet, worker availability roster and deployment confirmation log; policy or checklist rule used; stakeholder request; deadline/cut-off; prior status if available; reviewer or owner name; evidence of any unresolved exception. Artifact structure: Staffing Deployment Confirmation Tracker must contain: case or employee/candidate/worker identifier; source document reference; required data fields (staffing order, worker availability, client assignment details, onboarding/shift instructions, first-shift confirmation, issue log); missing or conflicting item log; numeric issue count; exception category; owner/action note; proceed/return/block/escalate status; reviewer handoff note; closure or follow-up date. How to read artifact: Read the artifact as the learner''s final workplace proof. First check the identifiers and source documents, then the required fields, then the issue count and exception category, then the decision status, and finally whether the handoff note gives a reviewer enough evidence to act. Evidence fields: Assess whether the Staffing Deployment Confirmation Tracker uses the right source data, includes all required fields, counts and labels the 16 issue records correctly, separates normal items from exceptions, gives a clear decision reason, respects the L2 authority boundary, and provides a usable reviewer handoff. AI coach boundary: AI can ask: Which source proves this field? Which 7 records are blocked? What is the decision reason? What evidence is still missing? AI can summarize checklist gaps and suggest clearer wording, but cannot create missing data, approve the case, override policy, or make the final HR/payroll/compliance decision. Traceability: Industry: HR & Workforce Services.|Domain: Staffing Operations.|Role: Staffing Consultant; Workforce Fulfillment Coordinator; Managed HR Service Specialist; Recruitment Coordinator; EOR Operations Specialist.|Capability_ID: IND-CAP-05.|Level: L2.|Course_ID: IND-S5-C-022.|Artifact: Staffing Deployment Confirmation Tracker.|Source Sheet: L2_COURSE_PATTERN.',
  1,
  '10 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BBA Human Resource Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-022' LIMIT 1),
  'BBA Human Resource Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MBA Human Resource Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-022' LIMIT 1),
  'MBA Human Resource Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PGDM Human Resource Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-022' LIMIT 1),
  'PGDM Human Resource Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Com
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-022' LIMIT 1),
  'B.Com',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BA Industrial Relations
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-022' LIMIT 1),
  'BA Industrial Relations',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Temporary Assignment Change Decision: Routine Execution
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Temporary Assignment Change Decision: Routine Execution',
  'IND-S5-C-027',
  'Learner can complete routine execution with clean handoff for Temporary Assignment Extension, Replacement, Or Closure and produce a reviewer-ready Temporary Assignment Change Decision Log with clear evidence and handoff logic. Workplace scenario: A staffing consultant is handling 34 temporary assignment change decision records in assignment tracker, client change request, worker contract terms and payroll impact sheet. The file is messy: 8 records have assignment extension not approved, 4 have rate change not reflected, 2 have worker availability conflicts with new shift, and some cases also show client change request lacks effective date. The team needs a clean routine handoff before the daily cut-off because downstream work cannot start until the artifact is usable. The learner must complete the standard workflow, update statuses, prepare the artifact, and send a clean handoff without needing step-by-step guidance, prepare a Temporary Assignment Change Decision Log, and clearly mark which items are ready, returned, blocked, or escalated. If handled poorly, worker pay, client billing, or assignment legality may become incorrect. Artifact proof: Temporary Assignment Change Decision Log. Competency taxonomy: Functional; Technical; Behavioural; Cognitive; Evidence.',
  '10 hours',
  'Active',
  'Staffing Operations',
  'technical',
  '["Learner can complete routine execution with clean handoff for Temporary Assignment Extension, Replacement, Or Closure and produce a reviewer-ready Temporary Assignment Change Decision Log with clear evidence and handoff logic.","Create a reviewer-ready Temporary Assignment Change Decision Log.","Use source data to resolve the skill gap: Learner must convert temporary assignment change decision knowledge into a usable Temporary Assignment Change Decision Log: check extension/replacement/closure request, client approval, worker availability, rate/date changes, identify missing or conflicting records, explain the level boundary, and create a reviewer-ready handoff.","Explain evidence and consequence through the Temporary Assignment Change Decision Log."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: Module 1: Temporary Assignment Change Decision Log Workplace Build
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-027' LIMIT 1),
  'Module 1: Temporary Assignment Change Decision Log Workplace Build',
  'Trigger: A staffing consultant receives 34 temporary assignment change decision records in assignment tracker, client change request, worker contract terms and payroll impact sheet; 8 show assignment extension not approved, 4 show rate change not reflected, and 2 show worker availability conflicts with new shift. Pressure: The team needs a clean routine handoff before the daily cut-off because downstream work cannot start until the artifact is usable. Actuals: Volume: 34 records/cases. Issue count 1: 8 with assignment extension not approved. Issue count 2: 4 with rate change not reflected. Issue count 3: 2 with worker availability conflicts with new shift. Systems/documents: assignment tracker, client change request, worker contract terms and payroll impact sheet. Decision needed: ready, return, block, or escalate. Time pressure: before the daily cut-off.',
  1,
  '["HR & Workforce Services","Staffing Operations","Staffing & Workforce Fulfillment Coordinators; Employer-of-Record & Global Employment Operations Specialists","Staffing Consultant; Workforce Fulfillment Coordinator; Managed HR Service Specialist; Recruitment Coordinator; EOR Operations Specialist","IND-CAP-06","Temporary Assignment Change Decision Log","Functional","Technical","Behavioural","Cognitive","Evidence"]'::jsonb,
  '["Start with the live trigger: 34 records arrive, 14 have visible issues, and a stakeholder needs an answer before the daily cut-off.","Learner studies the actual data points: extension/replacement/closure request, client approval, worker availability, rate/date changes, impact note, closure or continuation decision; then highlights missing fields, conflicts, late inputs, and owner gaps.","Teach the artifact logic: what each section means, which evidence is mandatory, what numbers must reconcile, and what the learner is allowed to decide at L2.","Learner completes the Temporary Assignment Change Decision Log using the case numbers, source references, exception labels, owner notes, and a clear ready/return/block/escalate recommendation.","Learner uses AI only for checklist prompts, concept reminders, and rubric self-checks. AI must not invent records, calculate unsupported numbers, approve decisions, or replace the learner''s judgement.","Learner reflects on what changed at L2: volume, exception complexity, stakeholder pressure, authority boundary, and evidence quality compared with the previous level."]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Temporary Assignment Change Decision: Routine Execution: Data, Concepts and Artifact Evidence
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-027' LIMIT 1)
   AND title = 'Module 1: Temporary Assignment Change Decision Log Workplace Build' LIMIT 1),
  'Temporary Assignment Change Decision: Routine Execution: Data, Concepts and Artifact Evidence',
  'Learner confusion: Students may understand the HR term but may not know how to read 34 messy records, compare source fields, quantify exceptions, choose proceed/return/escalate, or write the evidence trail in simple reviewer language. Root-cause focus: Investigate whether the real cause is missing source data, wrong effective date, unclear owner, system mismatch, late submission, policy/control risk, or weak handoff evidence in assignment tracker, client change request, worker contract terms and payroll impact sheet.',
  'Problem: A staffing consultant is handling 34 temporary assignment change decision records in assignment tracker, client change request, worker contract terms and payroll impact sheet. The file is messy: 8 records have assignment extension not approved, 4 have rate change not reflected, 2 have worker availability conflicts with new shift, and some cases also show client change request lacks effective date. The team needs a clean routine handoff before the daily cut-off because downstream work cannot start until the artifact is usable. The learner must complete the standard workflow, update statuses, prepare the artifact, and send a clean handoff without needing step-by-step guidance, prepare a Temporary Assignment Change Decision Log, and clearly mark which items are ready, returned, blocked, or escalated. If handled poorly, worker pay, client billing, or assignment legality may become incorrect. Actuals: Volume: 34 records/cases. Issue count 1: 8 with assignment extension not approved. Issue count 2: 4 with rate change not reflected. Issue count 3: 2 with worker availability conflicts with new shift. Systems/documents: assignment tracker, client change request, worker contract terms and payroll impact sheet. Decision needed: ready, return, block, or escalate. Time pressure: before the daily cut-off. Major concepts: assignment change control - needed to complete and defend the Temporary Assignment Change Decision Log; effective-date logic - needed to complete and defend the Temporary Assignment Change Decision Log; rate and billing dependency - needed to complete and defend the Temporary Assignment Change Decision Log; worker availability impact - needed to complete and defend the Temporary Assignment Change Decision Log; contract boundary - needed to complete and defend the Temporary Assignment Change Decision Log; client approval evidence - needed to complete and defend the Temporary Assignment Change Decision Log; payroll handoff - needed to complete and defend the Temporary Assignment Change Decision Log; change decision log - needed to complete and defend the Temporary Assignment Change Decision Log Concept-to-artifact link: These concepts are not theory-only. They tell the learner what to check inside the Temporary Assignment Change Decision Log: source data, missing fields, exception rules, owner notes, decision status, handoff logic, and reviewer evidence. Required data: To solve the artifact, learner needs: extension/replacement/closure request, client approval, worker availability, rate/date changes, impact note, closure or continuation decision; system screenshots or exports from assignment tracker, client change request, worker contract terms and payroll impact sheet; policy or checklist rule used; stakeholder request; deadline/cut-off; prior status if available; reviewer or owner name; evidence of any unresolved exception. Artifact structure: Temporary Assignment Change Decision Log must contain: case or employee/candidate/worker identifier; source document reference; required data fields (extension/replacement/closure request, client approval, worker availability, rate/date changes, impact note, closure or continuation decision); missing or conflicting item log; numeric issue count; exception category; owner/action note; proceed/return/block/escalate status; reviewer handoff note; closure or follow-up date. How to read artifact: Read the artifact as the learner''s final workplace proof. First check the identifiers and source documents, then the required fields, then the issue count and exception category, then the decision status, and finally whether the handoff note gives a reviewer enough evidence to act. Evidence fields: Assess whether the Temporary Assignment Change Decision Log uses the right source data, includes all required fields, counts and labels the 14 issue records correctly, separates normal items from exceptions, gives a clear decision reason, respects the L2 authority boundary, and provides a usable reviewer handoff. AI coach boundary: AI can ask: Which source proves this field? Which 8 records are blocked? What is the decision reason? What evidence is still missing? AI can summarize checklist gaps and suggest clearer wording, but cannot create missing data, approve the case, override policy, or make the final HR/payroll/compliance decision. Traceability: Industry: HR & Workforce Services.|Domain: Staffing Operations.|Role: Staffing Consultant; Workforce Fulfillment Coordinator; Managed HR Service Specialist; Recruitment Coordinator; EOR Operations Specialist.|Capability_ID: IND-CAP-06.|Level: L2.|Course_ID: IND-S5-C-027.|Artifact: Temporary Assignment Change Decision Log.|Source Sheet: L2_COURSE_PATTERN.',
  1,
  '10 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BBA Human Resource Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-027' LIMIT 1),
  'BBA Human Resource Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MBA Human Resource Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-027' LIMIT 1),
  'MBA Human Resource Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PGDM Human Resource Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-027' LIMIT 1),
  'PGDM Human Resource Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Com
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-027' LIMIT 1),
  'B.Com',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BA Industrial Relations
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-027' LIMIT 1),
  'BA Industrial Relations',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: EOR Worker Setup Compliance: Routine Execution
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'EOR Worker Setup Compliance: Routine Execution',
  'IND-S5-C-032',
  'Learner can complete routine execution with clean handoff for Administer Eor Worker Setup From Country and produce a reviewer-ready EOR Worker Setup Compliance Pack with clear evidence and handoff logic. Workplace scenario: An EOR operations associate is handling 35 EOR worker setup compliance check records in EOR onboarding portal, country compliance checklist, worker profile, contract template and right-to-work records. The file is messy: 9 records have country-specific document missing, 5 have contract template not matched to worker location, 3 have tax identifier incomplete, and some cases also show right-to-work evidence uploaded in the wrong section. The team needs a clean routine handoff before the daily cut-off because downstream work cannot start until the artifact is usable. The learner must complete the standard workflow, update statuses, prepare the artifact, and send a clean handoff without needing step-by-step guidance, prepare a EOR Worker Setup Compliance Pack, and clearly mark which items are ready, returned, blocked, or escalated. If handled poorly, the worker may be set up in the wrong legal configuration or onboarding may breach local requirements. Artifact proof: EOR Worker Setup Compliance Pack. Competency taxonomy: Functional; Technical; Behavioural; Cognitive; Evidence.',
  '10 hours',
  'Active',
  'EOR & Global Employment Services',
  'technical',
  '["Learner can complete routine execution with clean handoff for Administer Eor Worker Setup From Country and produce a reviewer-ready EOR Worker Setup Compliance Pack with clear evidence and handoff logic.","Create a reviewer-ready EOR Worker Setup Compliance Pack.","Use source data to resolve the skill gap: Learner must convert EOR worker setup compliance check knowledge into a usable EOR Worker Setup Compliance Pack: check country eligibility checks, worker profile, contract/onboarding documents, local compliance checklist, identify missing or conflicting records, explain the level boundary, and create a reviewer-ready handoff.","Explain evidence and consequence through the EOR Worker Setup Compliance Pack."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: Module 1: EOR Worker Setup Compliance Pack Workplace Build
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-032' LIMIT 1),
  'Module 1: EOR Worker Setup Compliance Pack Workplace Build',
  'Trigger: An EOR operations associate receives 35 EOR worker setup compliance check records in EOR onboarding portal, country compliance checklist, worker profile, contract template and right-to-work records; 9 show country-specific document missing, 5 show contract template not matched to worker location, and 3 show tax identifier incomplete. Pressure: The team needs a clean routine handoff before the daily cut-off because downstream work cannot start until the artifact is usable. Actuals: Volume: 35 records/cases. Issue count 1: 9 with country-specific document missing. Issue count 2: 5 with contract template not matched to worker location. Issue count 3: 3 with tax identifier incomplete. Systems/documents: EOR onboarding portal, country compliance checklist, worker profile, contract template and right-to-work records. Decision needed: ready, return, block, or escalate. Time pressure: before the daily cut-off.',
  1,
  '["HR & Workforce Services","EOR & Global Employment Services","Staffing & Workforce Fulfillment Coordinators; Employer-of-Record & Global Employment Operations Specialists","Staffing Consultant; Workforce Fulfillment Coordinator; Managed HR Service Specialist; Recruitment Coordinator; EOR Operations Specialist","IND-CAP-07","EOR Worker Setup Compliance Pack","Functional","Technical","Behavioural","Cognitive","Evidence"]'::jsonb,
  '["Start with the live trigger: 35 records arrive, 17 have visible issues, and a stakeholder needs an answer before the daily cut-off.","Learner studies the actual data points: country eligibility checks, worker profile, contract/onboarding documents, local compliance checklist, onboarding completion evidence, escalation notes; then highlights missing fields, conflicts, late inputs, and owner gaps.","Teach the artifact logic: what each section means, which evidence is mandatory, what numbers must reconcile, and what the learner is allowed to decide at L2.","Learner completes the EOR Worker Setup Compliance Pack using the case numbers, source references, exception labels, owner notes, and a clear ready/return/block/escalate recommendation.","Learner uses AI only for checklist prompts, concept reminders, and rubric self-checks. AI must not invent records, calculate unsupported numbers, approve decisions, or replace the learner''s judgement.","Learner reflects on what changed at L2: volume, exception complexity, stakeholder pressure, authority boundary, and evidence quality compared with the previous level."]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: EOR Worker Setup Compliance: Routine Execution: Data, Concepts and Artifact Evidence
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-032' LIMIT 1)
   AND title = 'Module 1: EOR Worker Setup Compliance Pack Workplace Build' LIMIT 1),
  'EOR Worker Setup Compliance: Routine Execution: Data, Concepts and Artifact Evidence',
  'Learner confusion: Students may understand the HR term but may not know how to read 35 messy records, compare source fields, quantify exceptions, choose proceed/return/escalate, or write the evidence trail in simple reviewer language. Root-cause focus: Investigate whether the real cause is missing source data, wrong effective date, unclear owner, system mismatch, late submission, policy/control risk, or weak handoff evidence in EOR onboarding portal, country compliance checklist, worker profile, contract template and right-to-work records.',
  'Problem: An EOR operations associate is handling 35 EOR worker setup compliance check records in EOR onboarding portal, country compliance checklist, worker profile, contract template and right-to-work records. The file is messy: 9 records have country-specific document missing, 5 have contract template not matched to worker location, 3 have tax identifier incomplete, and some cases also show right-to-work evidence uploaded in the wrong section. The team needs a clean routine handoff before the daily cut-off because downstream work cannot start until the artifact is usable. The learner must complete the standard workflow, update statuses, prepare the artifact, and send a clean handoff without needing step-by-step guidance, prepare a EOR Worker Setup Compliance Pack, and clearly mark which items are ready, returned, blocked, or escalated. If handled poorly, the worker may be set up in the wrong legal configuration or onboarding may breach local requirements. Actuals: Volume: 35 records/cases. Issue count 1: 9 with country-specific document missing. Issue count 2: 5 with contract template not matched to worker location. Issue count 3: 3 with tax identifier incomplete. Systems/documents: EOR onboarding portal, country compliance checklist, worker profile, contract template and right-to-work records. Decision needed: ready, return, block, or escalate. Time pressure: before the daily cut-off. Major concepts: EOR worker setup - needed to complete and defend the EOR Worker Setup Compliance Pack; country compliance dependency - needed to complete and defend the EOR Worker Setup Compliance Pack; right-to-work evidence - needed to complete and defend the EOR Worker Setup Compliance Pack; contract-template matching - needed to complete and defend the EOR Worker Setup Compliance Pack; tax identifier validation - needed to complete and defend the EOR Worker Setup Compliance Pack; client-worker data boundary - needed to complete and defend the EOR Worker Setup Compliance Pack; onboarding cut-off control - needed to complete and defend the EOR Worker Setup Compliance Pack; compliance pack completion - needed to complete and defend the EOR Worker Setup Compliance Pack Concept-to-artifact link: These concepts are not theory-only. They tell the learner what to check inside the EOR Worker Setup Compliance Pack: source data, missing fields, exception rules, owner notes, decision status, handoff logic, and reviewer evidence. Required data: To solve the artifact, learner needs: country eligibility checks, worker profile, contract/onboarding documents, local compliance checklist, onboarding completion evidence, escalation notes; system screenshots or exports from EOR onboarding portal, country compliance checklist, worker profile, contract template and right-to-work records; policy or checklist rule used; stakeholder request; deadline/cut-off; prior status if available; reviewer or owner name; evidence of any unresolved exception. Artifact structure: EOR Worker Setup Compliance Pack must contain: case or employee/candidate/worker identifier; source document reference; required data fields (country eligibility checks, worker profile, contract/onboarding documents, local compliance checklist, onboarding completion evidence, escalation notes); missing or conflicting item log; numeric issue count; exception category; owner/action note; proceed/return/block/escalate status; reviewer handoff note; closure or follow-up date. How to read artifact: Read the artifact as the learner''s final workplace proof. First check the identifiers and source documents, then the required fields, then the issue count and exception category, then the decision status, and finally whether the handoff note gives a reviewer enough evidence to act. Evidence fields: Assess whether the EOR Worker Setup Compliance Pack uses the right source data, includes all required fields, counts and labels the 17 issue records correctly, separates normal items from exceptions, gives a clear decision reason, respects the L2 authority boundary, and provides a usable reviewer handoff. AI coach boundary: AI can ask: Which source proves this field? Which 9 records are blocked? What is the decision reason? What evidence is still missing? AI can summarize checklist gaps and suggest clearer wording, but cannot create missing data, approve the case, override policy, or make the final HR/payroll/compliance decision. Traceability: Industry: HR & Workforce Services.|Domain: EOR & Global Employment Services.|Role: Staffing Consultant; Workforce Fulfillment Coordinator; Managed HR Service Specialist; Recruitment Coordinator; EOR Operations Specialist.|Capability_ID: IND-CAP-07.|Level: L2.|Course_ID: IND-S5-C-032.|Artifact: EOR Worker Setup Compliance Pack.|Source Sheet: L2_COURSE_PATTERN.',
  1,
  '10 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BBA Human Resource Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-032' LIMIT 1),
  'BBA Human Resource Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MBA Human Resource Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-032' LIMIT 1),
  'MBA Human Resource Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Com
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-032' LIMIT 1),
  'B.Com',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Com
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-032' LIMIT 1),
  'M.Com',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: LLB / BA LLB Labour and Employment Law
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-032' LIMIT 1),
  'LLB / BA LLB Labour and Employment Law',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PGDM International Business
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-032' LIMIT 1),
  'PGDM International Business',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: EOR Payroll & Benefits Change Control: Routine Execution
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'EOR Payroll & Benefits Change Control: Routine Execution',
  'IND-S5-C-037',
  'Learner can complete routine execution with clean handoff for EOR Payroll and Benefit Changes and produce a reviewer-ready EOR Payroll & Benefits Change Control Log with clear evidence and handoff logic. Workplace scenario: An EOR payroll coordinator is handling 36 EOR payroll and benefits change control records in EOR payroll platform, benefit election file, country payroll calendar and client change approval log. The file is messy: 6 records have benefit change submitted after cut-off, 6 have salary change lacks client approval, 2 have allowance amount differs from contract, and some cases also show country payroll calendar has earlier deadline. The team needs a clean routine handoff before the daily cut-off because downstream work cannot start until the artifact is usable. The learner must complete the standard workflow, update statuses, prepare the artifact, and send a clean handoff without needing step-by-step guidance, prepare a EOR Payroll & Benefits Change Control Log, and clearly mark which items are ready, returned, blocked, or escalated. If handled poorly, the worker may be paid incorrectly or the client may face correction costs in a foreign payroll cycle. Artifact proof: EOR Payroll & Benefits Change Control Log. Competency taxonomy: Functional; Technical; Behavioural; Cognitive; Evidence.',
  '10 hours',
  'Active',
  'EOR & Global Employment Services',
  'technical',
  '["Learner can complete routine execution with clean handoff for EOR Payroll and Benefit Changes and produce a reviewer-ready EOR Payroll & Benefits Change Control Log with clear evidence and handoff logic.","Create a reviewer-ready EOR Payroll & Benefits Change Control Log.","Use source data to resolve the skill gap: Learner must convert EOR payroll and benefits change control knowledge into a usable EOR Payroll & Benefits Change Control Log: check country-specific payroll change request, benefit-change evidence, effective dates, local compliance flags, identify missing or conflicting records, explain the level boundary, and create a reviewer-ready handoff.","Explain evidence and consequence through the EOR Payroll & Benefits Change Control Log."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: Module 1: EOR Payroll & Benefits Change Control Log Workplace Build
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-037' LIMIT 1),
  'Module 1: EOR Payroll & Benefits Change Control Log Workplace Build',
  'Trigger: An EOR payroll coordinator receives 36 EOR payroll and benefits change control records in EOR payroll platform, benefit election file, country payroll calendar and client change approval log; 6 show benefit change submitted after cut-off, 6 show salary change lacks client approval, and 2 show allowance amount differs from contract. Pressure: The team needs a clean routine handoff before the daily cut-off because downstream work cannot start until the artifact is usable. Actuals: Volume: 36 records/cases. Issue count 1: 6 with benefit change submitted after cut-off. Issue count 2: 6 with salary change lacks client approval. Issue count 3: 2 with allowance amount differs from contract. Systems/documents: EOR payroll platform, benefit election file, country payroll calendar and client change approval log. Decision needed: ready, return, block, or escalate. Time pressure: before the daily cut-off.',
  1,
  '["HR & Workforce Services","EOR & Global Employment Services","Staffing & Workforce Fulfillment Coordinators; Employer-of-Record & Global Employment Operations Specialists","Staffing Consultant; Workforce Fulfillment Coordinator; Managed HR Service Specialist; Recruitment Coordinator; EOR Operations Specialist","IND-CAP-08","EOR Payroll & Benefits Change Control Log","Functional","Technical","Behavioural","Cognitive","Evidence"]'::jsonb,
  '["Start with the live trigger: 36 records arrive, 14 have visible issues, and a stakeholder needs an answer before the daily cut-off.","Learner studies the actual data points: country-specific payroll change request, benefit-change evidence, effective dates, local compliance flags, payroll handoff note, approval trail; then highlights missing fields, conflicts, late inputs, and owner gaps.","Teach the artifact logic: what each section means, which evidence is mandatory, what numbers must reconcile, and what the learner is allowed to decide at L2.","Learner completes the EOR Payroll & Benefits Change Control Log using the case numbers, source references, exception labels, owner notes, and a clear ready/return/block/escalate recommendation.","Learner uses AI only for checklist prompts, concept reminders, and rubric self-checks. AI must not invent records, calculate unsupported numbers, approve decisions, or replace the learner''s judgement.","Learner reflects on what changed at L2: volume, exception complexity, stakeholder pressure, authority boundary, and evidence quality compared with the previous level."]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: EOR Payroll & Benefits Change Control: Routine Execution: Data, Concepts and Artifact Evidence
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-037' LIMIT 1)
   AND title = 'Module 1: EOR Payroll & Benefits Change Control Log Workplace Build' LIMIT 1),
  'EOR Payroll & Benefits Change Control: Routine Execution: Data, Concepts and Artifact Evidence',
  'Learner confusion: Students may understand the HR term but may not know how to read 36 messy records, compare source fields, quantify exceptions, choose proceed/return/escalate, or write the evidence trail in simple reviewer language. Root-cause focus: Investigate whether the real cause is missing source data, wrong effective date, unclear owner, system mismatch, late submission, policy/control risk, or weak handoff evidence in EOR payroll platform, benefit election file, country payroll calendar and client change approval log.',
  'Problem: An EOR payroll coordinator is handling 36 EOR payroll and benefits change control records in EOR payroll platform, benefit election file, country payroll calendar and client change approval log. The file is messy: 6 records have benefit change submitted after cut-off, 6 have salary change lacks client approval, 2 have allowance amount differs from contract, and some cases also show country payroll calendar has earlier deadline. The team needs a clean routine handoff before the daily cut-off because downstream work cannot start until the artifact is usable. The learner must complete the standard workflow, update statuses, prepare the artifact, and send a clean handoff without needing step-by-step guidance, prepare a EOR Payroll & Benefits Change Control Log, and clearly mark which items are ready, returned, blocked, or escalated. If handled poorly, the worker may be paid incorrectly or the client may face correction costs in a foreign payroll cycle. Actuals: Volume: 36 records/cases. Issue count 1: 6 with benefit change submitted after cut-off. Issue count 2: 6 with salary change lacks client approval. Issue count 3: 2 with allowance amount differs from contract. Systems/documents: EOR payroll platform, benefit election file, country payroll calendar and client change approval log. Decision needed: ready, return, block, or escalate. Time pressure: before the daily cut-off. Major concepts: EOR payroll change control - needed to complete and defend the EOR Payroll & Benefits Change Control Log; benefit election validation - needed to complete and defend the EOR Payroll & Benefits Change Control Log; country payroll cut-off - needed to complete and defend the EOR Payroll & Benefits Change Control Log; client approval evidence - needed to complete and defend the EOR Payroll & Benefits Change Control Log; allowance and contract matching - needed to complete and defend the EOR Payroll & Benefits Change Control Log; effective-date handling - needed to complete and defend the EOR Payroll & Benefits Change Control Log; change log ownership - needed to complete and defend the EOR Payroll & Benefits Change Control Log; payroll correction risk - needed to complete and defend the EOR Payroll & Benefits Change Control Log Concept-to-artifact link: These concepts are not theory-only. They tell the learner what to check inside the EOR Payroll & Benefits Change Control Log: source data, missing fields, exception rules, owner notes, decision status, handoff logic, and reviewer evidence. Required data: To solve the artifact, learner needs: country-specific payroll change request, benefit-change evidence, effective dates, local compliance flags, payroll handoff note, approval trail; system screenshots or exports from EOR payroll platform, benefit election file, country payroll calendar and client change approval log; policy or checklist rule used; stakeholder request; deadline/cut-off; prior status if available; reviewer or owner name; evidence of any unresolved exception. Artifact structure: EOR Payroll & Benefits Change Control Log must contain: case or employee/candidate/worker identifier; source document reference; required data fields (country-specific payroll change request, benefit-change evidence, effective dates, local compliance flags, payroll handoff note, approval trail); missing or conflicting item log; numeric issue count; exception category; owner/action note; proceed/return/block/escalate status; reviewer handoff note; closure or follow-up date. How to read artifact: Read the artifact as the learner''s final workplace proof. First check the identifiers and source documents, then the required fields, then the issue count and exception category, then the decision status, and finally whether the handoff note gives a reviewer enough evidence to act. Evidence fields: Assess whether the EOR Payroll & Benefits Change Control Log uses the right source data, includes all required fields, counts and labels the 14 issue records correctly, separates normal items from exceptions, gives a clear decision reason, respects the L2 authority boundary, and provides a usable reviewer handoff. AI coach boundary: AI can ask: Which source proves this field? Which 6 records are blocked? What is the decision reason? What evidence is still missing? AI can summarize checklist gaps and suggest clearer wording, but cannot create missing data, approve the case, override policy, or make the final HR/payroll/compliance decision. Traceability: Industry: HR & Workforce Services.|Domain: EOR & Global Employment Services.|Role: Staffing Consultant; Workforce Fulfillment Coordinator; Managed HR Service Specialist; Recruitment Coordinator; EOR Operations Specialist.|Capability_ID: IND-CAP-08.|Level: L2.|Course_ID: IND-S5-C-037.|Artifact: EOR Payroll & Benefits Change Control Log.|Source Sheet: L2_COURSE_PATTERN.',
  1,
  '10 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BBA Human Resource Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-037' LIMIT 1),
  'BBA Human Resource Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MBA Human Resource Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-037' LIMIT 1),
  'MBA Human Resource Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Com
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-037' LIMIT 1),
  'B.Com',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Com
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-037' LIMIT 1),
  'M.Com',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: LLB / BA LLB Labour and Employment Law
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-037' LIMIT 1),
  'LLB / BA LLB Labour and Employment Law',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PGDM International Business
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-037' LIMIT 1),
  'PGDM International Business',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Payroll Input Validation: Routine Execution
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Payroll Input Validation: Routine Execution',
  'IND-S5-C-042',
  'Learner can complete routine execution with clean handoff for Payroll Input Validation and produce a reviewer-ready Payroll Input Validation Register with clear evidence and handoff logic. Workplace scenario: A payroll analyst is handling 28 payroll input validation before payroll lock records in payroll system, attendance file, leave tracker, compensation change sheet and benefits deduction file. The file is messy: 7 records have late salary revisions, 4 have unpaid leave mismatches, 3 have benefit deduction updates without approval, and some cases also show new-joiner bank details incomplete. The team needs a clean routine handoff before the daily cut-off because downstream work cannot start until the artifact is usable. The learner must complete the standard workflow, update statuses, prepare the artifact, and send a clean handoff without needing step-by-step guidance, prepare a Payroll Input Validation Register, and clearly mark which items are ready, returned, blocked, or escalated. If handled poorly, employees may receive incorrect salary or the payroll release may be delayed. Artifact proof: Payroll Input Validation Register. Competency taxonomy: Functional; Technical; Behavioural; Cognitive; Evidence.',
  '10 hours',
  'Active',
  'Payroll, Benefits & Compliance Operations',
  'technical',
  '["Learner can complete routine execution with clean handoff for Payroll Input Validation and produce a reviewer-ready Payroll Input Validation Register with clear evidence and handoff logic.","Create a reviewer-ready Payroll Input Validation Register.","Use source data to resolve the skill gap: Learner must convert payroll input validation before payroll lock knowledge into a usable Payroll Input Validation Register: check attendance/leave data, salary revision inputs, deduction and benefit changes, variance flags, identify missing or conflicting records, explain the level boundary, and create a reviewer-ready handoff.","Explain evidence and consequence through the Payroll Input Validation Register."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: Module 1: Payroll Input Validation Register Workplace Build
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-042' LIMIT 1),
  'Module 1: Payroll Input Validation Register Workplace Build',
  'Trigger: A payroll analyst receives 28 payroll input validation before payroll lock records in payroll system, attendance file, leave tracker, compensation change sheet and benefits deduction file; 7 show late salary revisions, 4 show unpaid leave mismatches, and 3 show benefit deduction updates without approval. Pressure: The team needs a clean routine handoff before the daily cut-off because downstream work cannot start until the artifact is usable. Actuals: Volume: 28 records/cases. Issue count 1: 7 with late salary revisions. Issue count 2: 4 with unpaid leave mismatches. Issue count 3: 3 with benefit deduction updates without approval. Systems/documents: payroll system, attendance file, leave tracker, compensation change sheet and benefits deduction file. Decision needed: ready, return, block, or escalate. Time pressure: before the daily cut-off.',
  1,
  '["HR & Workforce Services","Payroll, Benefits & Compliance Operations","Payroll Operations Specialists; Statutory Payroll & Workforce Compliance Specialists; Compensation, Rewards & Benefits Analysts","Payroll Specialist; Payroll Operations Specialist; Payroll Coordinator; Payroll Compliance Specialist; Statutory Compliance Specialist","IND-CAP-09","Payroll Input Validation Register","Functional","Technical","Behavioural","Cognitive","Evidence"]'::jsonb,
  '["Start with the live trigger: 28 records arrive, 14 have visible issues, and a stakeholder needs an answer before the daily cut-off.","Learner studies the actual data points: attendance/leave data, salary revision inputs, deduction and benefit changes, variance flags, reviewer approval note, release-readiness checklist; then highlights missing fields, conflicts, late inputs, and owner gaps.","Teach the artifact logic: what each section means, which evidence is mandatory, what numbers must reconcile, and what the learner is allowed to decide at L2.","Learner completes the Payroll Input Validation Register using the case numbers, source references, exception labels, owner notes, and a clear ready/return/block/escalate recommendation.","Learner uses AI only for checklist prompts, concept reminders, and rubric self-checks. AI must not invent records, calculate unsupported numbers, approve decisions, or replace the learner''s judgement.","Learner reflects on what changed at L2: volume, exception complexity, stakeholder pressure, authority boundary, and evidence quality compared with the previous level."]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Payroll Input Validation: Routine Execution: Data, Concepts and Artifact Evidence
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-042' LIMIT 1)
   AND title = 'Module 1: Payroll Input Validation Register Workplace Build' LIMIT 1),
  'Payroll Input Validation: Routine Execution: Data, Concepts and Artifact Evidence',
  'Learner confusion: Students may understand the HR term but may not know how to read 28 messy records, compare source fields, quantify exceptions, choose proceed/return/escalate, or write the evidence trail in simple reviewer language. Root-cause focus: Investigate whether the real cause is missing source data, wrong effective date, unclear owner, system mismatch, late submission, policy/control risk, or weak handoff evidence in payroll system, attendance file, leave tracker, compensation change sheet and benefits deduction file.',
  'Problem: A payroll analyst is handling 28 payroll input validation before payroll lock records in payroll system, attendance file, leave tracker, compensation change sheet and benefits deduction file. The file is messy: 7 records have late salary revisions, 4 have unpaid leave mismatches, 3 have benefit deduction updates without approval, and some cases also show new-joiner bank details incomplete. The team needs a clean routine handoff before the daily cut-off because downstream work cannot start until the artifact is usable. The learner must complete the standard workflow, update statuses, prepare the artifact, and send a clean handoff without needing step-by-step guidance, prepare a Payroll Input Validation Register, and clearly mark which items are ready, returned, blocked, or escalated. If handled poorly, employees may receive incorrect salary or the payroll release may be delayed. Actuals: Volume: 28 records/cases. Issue count 1: 7 with late salary revisions. Issue count 2: 4 with unpaid leave mismatches. Issue count 3: 3 with benefit deduction updates without approval. Systems/documents: payroll system, attendance file, leave tracker, compensation change sheet and benefits deduction file. Decision needed: ready, return, block, or escalate. Time pressure: before the daily cut-off. Major concepts: payroll lock timeline - needed to complete and defend the Payroll Input Validation Register; source-input dependency - needed to complete and defend the Payroll Input Validation Register; salary revision effective date - needed to complete and defend the Payroll Input Validation Register; unpaid leave adjustment - needed to complete and defend the Payroll Input Validation Register; benefit deduction validation - needed to complete and defend the Payroll Input Validation Register; bank-detail control - needed to complete and defend the Payroll Input Validation Register; normal variance versus release-blocking exception - needed to complete and defend the Payroll Input Validation Register; reviewer approval trail - needed to complete and defend the Payroll Input Validation Register Concept-to-artifact link: These concepts are not theory-only. They tell the learner what to check inside the Payroll Input Validation Register: source data, missing fields, exception rules, owner notes, decision status, handoff logic, and reviewer evidence. Required data: To solve the artifact, learner needs: attendance/leave data, salary revision inputs, deduction and benefit changes, variance flags, reviewer approval note, release-readiness checklist; system screenshots or exports from payroll system, attendance file, leave tracker, compensation change sheet and benefits deduction file; policy or checklist rule used; stakeholder request; deadline/cut-off; prior status if available; reviewer or owner name; evidence of any unresolved exception. Artifact structure: Payroll Input Validation Register must contain: case or employee/candidate/worker identifier; source document reference; required data fields (attendance/leave data, salary revision inputs, deduction and benefit changes, variance flags, reviewer approval note, release-readiness checklist); missing or conflicting item log; numeric issue count; exception category; owner/action note; proceed/return/block/escalate status; reviewer handoff note; closure or follow-up date. How to read artifact: Read the artifact as the learner''s final workplace proof. First check the identifiers and source documents, then the required fields, then the issue count and exception category, then the decision status, and finally whether the handoff note gives a reviewer enough evidence to act. Evidence fields: Assess whether the Payroll Input Validation Register uses the right source data, includes all required fields, counts and labels the 14 issue records correctly, separates normal items from exceptions, gives a clear decision reason, respects the L2 authority boundary, and provides a usable reviewer handoff. AI coach boundary: AI can ask: Which source proves this field? Which 7 records are blocked? What is the decision reason? What evidence is still missing? AI can summarize checklist gaps and suggest clearer wording, but cannot create missing data, approve the case, override policy, or make the final HR/payroll/compliance decision. Traceability: Industry: HR & Workforce Services.|Domain: Payroll, Benefits & Compliance Operations.|Role: Payroll Specialist; Payroll Operations Specialist; Payroll Coordinator; Payroll Compliance Specialist; Statutory Compliance Specialist.|Capability_ID: IND-CAP-09.|Level: L2.|Course_ID: IND-S5-C-042.|Artifact: Payroll Input Validation Register.|Source Sheet: L2_COURSE_PATTERN.',
  1,
  '10 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Com
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-042' LIMIT 1),
  'B.Com',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Com
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-042' LIMIT 1),
  'M.Com',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BBA Human Resource Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-042' LIMIT 1),
  'BBA Human Resource Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MBA Human Resource Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-042' LIMIT 1),
  'MBA Human Resource Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PGDM Payroll and Statutory Compliance
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-042' LIMIT 1),
  'PGDM Payroll and Statutory Compliance',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: LLB / BA LLB Labour and Employment Law
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-042' LIMIT 1),
  'LLB / BA LLB Labour and Employment Law',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Payroll Variance Reconciliation: Routine Execution
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Payroll Variance Reconciliation: Routine Execution',
  'IND-S5-C-047',
  'Learner can complete routine execution with clean handoff for Correct Payroll Exceptions Through Variance Diagnosis, and produce a reviewer-ready Payroll Variance Reconciliation Log with clear evidence and handoff logic. Workplace scenario: A payroll operations specialist is handling 29 payroll variance reconciliation records in payroll output register, previous-cycle payroll report, attendance exceptions, salary change register and finance variance threshold sheet. The file is messy: 8 records have net pay variance above threshold, 5 have retro adjustment not explained, 2 have deduction difference without source note, and some cases also show terminated employee still appearing in output. The team needs a clean routine handoff before the daily cut-off because downstream work cannot start until the artifact is usable. The learner must complete the standard workflow, update statuses, prepare the artifact, and send a clean handoff without needing step-by-step guidance, prepare a Payroll Variance Reconciliation Log, and clearly mark which items are ready, returned, blocked, or escalated. If handled poorly, unexplained variances may pass into payment or valid payments may be blocked unnecessarily. Artifact proof: Payroll Variance Reconciliation Log. Competency taxonomy: Functional; Technical; Behavioural; Cognitive; Evidence.',
  '10 hours',
  'Active',
  'Payroll, Benefits & Compliance Operations',
  'technical',
  '["Learner can complete routine execution with clean handoff for Correct Payroll Exceptions Through Variance Diagnosis, and produce a reviewer-ready Payroll Variance Reconciliation Log with clear evidence and handoff logic.","Create a reviewer-ready Payroll Variance Reconciliation Log.","Use source data to resolve the skill gap: Learner must convert payroll variance reconciliation knowledge into a usable Payroll Variance Reconciliation Log: check exception list, variance reason, recalculation evidence, corrected input source, identify missing or conflicting records, explain the level boundary, and create a reviewer-ready handoff.","Explain evidence and consequence through the Payroll Variance Reconciliation Log."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: Module 1: Payroll Variance Reconciliation Log Workplace Build
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-047' LIMIT 1),
  'Module 1: Payroll Variance Reconciliation Log Workplace Build',
  'Trigger: A payroll operations specialist receives 29 payroll variance reconciliation records in payroll output register, previous-cycle payroll report, attendance exceptions, salary change register and finance variance threshold sheet; 8 show net pay variance above threshold, 5 show retro adjustment not explained, and 2 show deduction difference without source note. Pressure: The team needs a clean routine handoff before the daily cut-off because downstream work cannot start until the artifact is usable. Actuals: Volume: 29 records/cases. Issue count 1: 8 with net pay variance above threshold. Issue count 2: 5 with retro adjustment not explained. Issue count 3: 2 with deduction difference without source note. Systems/documents: payroll output register, previous-cycle payroll report, attendance exceptions, salary change register and finance variance threshold sheet. Decision needed: ready, return, block, or escalate. Time pressure: before the daily cut-off.',
  1,
  '["HR & Workforce Services","Payroll, Benefits & Compliance Operations","Payroll Operations Specialists; Statutory Payroll & Workforce Compliance Specialists; Compensation, Rewards & Benefits Analysts","Payroll Specialist; Payroll Operations Specialist; Payroll Coordinator; Payroll Compliance Specialist; Statutory Compliance Specialist","IND-CAP-10","Payroll Variance Reconciliation Log","Functional","Technical","Behavioural","Cognitive","Evidence"]'::jsonb,
  '["Start with the live trigger: 29 records arrive, 15 have visible issues, and a stakeholder needs an answer before the daily cut-off.","Learner studies the actual data points: exception list, variance reason, recalculation evidence, corrected input source, approver decision, payroll release action; then highlights missing fields, conflicts, late inputs, and owner gaps.","Teach the artifact logic: what each section means, which evidence is mandatory, what numbers must reconcile, and what the learner is allowed to decide at L2.","Learner completes the Payroll Variance Reconciliation Log using the case numbers, source references, exception labels, owner notes, and a clear ready/return/block/escalate recommendation.","Learner uses AI only for checklist prompts, concept reminders, and rubric self-checks. AI must not invent records, calculate unsupported numbers, approve decisions, or replace the learner''s judgement.","Learner reflects on what changed at L2: volume, exception complexity, stakeholder pressure, authority boundary, and evidence quality compared with the previous level."]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Payroll Variance Reconciliation: Routine Execution: Data, Concepts and Artifact Evidence
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-047' LIMIT 1)
   AND title = 'Module 1: Payroll Variance Reconciliation Log Workplace Build' LIMIT 1),
  'Payroll Variance Reconciliation: Routine Execution: Data, Concepts and Artifact Evidence',
  'Learner confusion: Students may understand the HR term but may not know how to read 29 messy records, compare source fields, quantify exceptions, choose proceed/return/escalate, or write the evidence trail in simple reviewer language. Root-cause focus: Investigate whether the real cause is missing source data, wrong effective date, unclear owner, system mismatch, late submission, policy/control risk, or weak handoff evidence in payroll output register, previous-cycle payroll report, attendance exceptions, salary change register and finance variance threshold sheet.',
  'Problem: A payroll operations specialist is handling 29 payroll variance reconciliation records in payroll output register, previous-cycle payroll report, attendance exceptions, salary change register and finance variance threshold sheet. The file is messy: 8 records have net pay variance above threshold, 5 have retro adjustment not explained, 2 have deduction difference without source note, and some cases also show terminated employee still appearing in output. The team needs a clean routine handoff before the daily cut-off because downstream work cannot start until the artifact is usable. The learner must complete the standard workflow, update statuses, prepare the artifact, and send a clean handoff without needing step-by-step guidance, prepare a Payroll Variance Reconciliation Log, and clearly mark which items are ready, returned, blocked, or escalated. If handled poorly, unexplained variances may pass into payment or valid payments may be blocked unnecessarily. Actuals: Volume: 29 records/cases. Issue count 1: 8 with net pay variance above threshold. Issue count 2: 5 with retro adjustment not explained. Issue count 3: 2 with deduction difference without source note. Systems/documents: payroll output register, previous-cycle payroll report, attendance exceptions, salary change register and finance variance threshold sheet. Decision needed: ready, return, block, or escalate. Time pressure: before the daily cut-off. Major concepts: payroll variance threshold - needed to complete and defend the Payroll Variance Reconciliation Log; gross-to-net comparison - needed to complete and defend the Payroll Variance Reconciliation Log; retro adjustment logic - needed to complete and defend the Payroll Variance Reconciliation Log; deduction reconciliation - needed to complete and defend the Payroll Variance Reconciliation Log; termination impact - needed to complete and defend the Payroll Variance Reconciliation Log; variance reason coding - needed to complete and defend the Payroll Variance Reconciliation Log; finance approval evidence - needed to complete and defend the Payroll Variance Reconciliation Log; reconciliation log quality - needed to complete and defend the Payroll Variance Reconciliation Log Concept-to-artifact link: These concepts are not theory-only. They tell the learner what to check inside the Payroll Variance Reconciliation Log: source data, missing fields, exception rules, owner notes, decision status, handoff logic, and reviewer evidence. Required data: To solve the artifact, learner needs: exception list, variance reason, recalculation evidence, corrected input source, approver decision, payroll release action; system screenshots or exports from payroll output register, previous-cycle payroll report, attendance exceptions, salary change register and finance variance threshold sheet; policy or checklist rule used; stakeholder request; deadline/cut-off; prior status if available; reviewer or owner name; evidence of any unresolved exception. Artifact structure: Payroll Variance Reconciliation Log must contain: case or employee/candidate/worker identifier; source document reference; required data fields (exception list, variance reason, recalculation evidence, corrected input source, approver decision, payroll release action); missing or conflicting item log; numeric issue count; exception category; owner/action note; proceed/return/block/escalate status; reviewer handoff note; closure or follow-up date. How to read artifact: Read the artifact as the learner''s final workplace proof. First check the identifiers and source documents, then the required fields, then the issue count and exception category, then the decision status, and finally whether the handoff note gives a reviewer enough evidence to act. Evidence fields: Assess whether the Payroll Variance Reconciliation Log uses the right source data, includes all required fields, counts and labels the 15 issue records correctly, separates normal items from exceptions, gives a clear decision reason, respects the L2 authority boundary, and provides a usable reviewer handoff. AI coach boundary: AI can ask: Which source proves this field? Which 8 records are blocked? What is the decision reason? What evidence is still missing? AI can summarize checklist gaps and suggest clearer wording, but cannot create missing data, approve the case, override policy, or make the final HR/payroll/compliance decision. Traceability: Industry: HR & Workforce Services.|Domain: Payroll, Benefits & Compliance Operations.|Role: Payroll Specialist; Payroll Operations Specialist; Payroll Coordinator; Payroll Compliance Specialist; Statutory Compliance Specialist.|Capability_ID: IND-CAP-10.|Level: L2.|Course_ID: IND-S5-C-047.|Artifact: Payroll Variance Reconciliation Log.|Source Sheet: L2_COURSE_PATTERN.',
  1,
  '10 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Com
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-047' LIMIT 1),
  'B.Com',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Com
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-047' LIMIT 1),
  'M.Com',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BBA Human Resource Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-047' LIMIT 1),
  'BBA Human Resource Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MBA Human Resource Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-047' LIMIT 1),
  'MBA Human Resource Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PGDM Payroll and Statutory Compliance
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-047' LIMIT 1),
  'PGDM Payroll and Statutory Compliance',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: LLB / BA LLB Labour and Employment Law
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-047' LIMIT 1),
  'LLB / BA LLB Labour and Employment Law',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Benefits Eligibility Audit: Routine Execution
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Benefits Eligibility Audit: Routine Execution',
  'IND-S5-C-052',
  'Learner can complete routine execution with clean handoff for Benefits Eligibility Review and produce a reviewer-ready Benefits Eligibility Audit Sheet with clear evidence and handoff logic. Workplace scenario: A benefits operations analyst is handling 30 benefits eligibility audit records in benefits administration portal, employee master data, policy eligibility matrix and payroll deduction file. The file is messy: 9 records have employee class not updated, 6 have dependent proof missing, 3 have benefit start date conflicts with joining date, and some cases also show deduction file does not match election record. The team needs a clean routine handoff before the daily cut-off because downstream work cannot start until the artifact is usable. The learner must complete the standard workflow, update statuses, prepare the artifact, and send a clean handoff without needing step-by-step guidance, prepare a Benefits Eligibility Audit Sheet, and clearly mark which items are ready, returned, blocked, or escalated. If handled poorly, employees may receive wrong coverage or incorrect deductions may enter payroll. Artifact proof: Benefits Eligibility Audit Sheet. Competency taxonomy: Functional; Technical; Behavioural; Domain; Evidence.',
  '10 hours',
  'Active',
  'Payroll, Benefits & Compliance Operations',
  'technical',
  '["Learner can complete routine execution with clean handoff for Benefits Eligibility Review and produce a reviewer-ready Benefits Eligibility Audit Sheet with clear evidence and handoff logic.","Create a reviewer-ready Benefits Eligibility Audit Sheet.","Use source data to resolve the skill gap: Learner must convert benefits eligibility audit knowledge into a usable Benefits Eligibility Audit Sheet: check lifecycle event, plan eligibility rules, enrollment/change evidence, dependent/supporting documents, identify missing or conflicting records, explain the level boundary, and create a reviewer-ready handoff.","Explain evidence and consequence through the Benefits Eligibility Audit Sheet."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: Module 1: Benefits Eligibility Audit Sheet Workplace Build
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-052' LIMIT 1),
  'Module 1: Benefits Eligibility Audit Sheet Workplace Build',
  'Trigger: A benefits operations analyst receives 30 benefits eligibility audit records in benefits administration portal, employee master data, policy eligibility matrix and payroll deduction file; 9 show employee class not updated, 6 show dependent proof missing, and 3 show benefit start date conflicts with joining date. Pressure: The team needs a clean routine handoff before the daily cut-off because downstream work cannot start until the artifact is usable. Actuals: Volume: 30 records/cases. Issue count 1: 9 with employee class not updated. Issue count 2: 6 with dependent proof missing. Issue count 3: 3 with benefit start date conflicts with joining date. Systems/documents: benefits administration portal, employee master data, policy eligibility matrix and payroll deduction file. Decision needed: ready, return, block, or escalate. Time pressure: before the daily cut-off.',
  1,
  '["HR & Workforce Services","Payroll, Benefits & Compliance Operations","Payroll Operations Specialists; Statutory Payroll & Workforce Compliance Specialists; Compensation, Rewards & Benefits Analysts","Payroll Specialist; Payroll Operations Specialist; Payroll Coordinator; Payroll Compliance Specialist; Statutory Compliance Specialist","IND-CAP-11","Benefits Eligibility Audit Sheet","Functional","Technical","Behavioural","Domain","Evidence"]'::jsonb,
  '["Start with the live trigger: 30 records arrive, 18 have visible issues, and a stakeholder needs an answer before the daily cut-off.","Learner studies the actual data points: lifecycle event, plan eligibility rules, enrollment/change evidence, dependent/supporting documents, exception flags, employee/vendor handoff note; then highlights missing fields, conflicts, late inputs, and owner gaps.","Teach the artifact logic: what each section means, which evidence is mandatory, what numbers must reconcile, and what the learner is allowed to decide at L2.","Learner completes the Benefits Eligibility Audit Sheet using the case numbers, source references, exception labels, owner notes, and a clear ready/return/block/escalate recommendation.","Learner uses AI only for checklist prompts, concept reminders, and rubric self-checks. AI must not invent records, calculate unsupported numbers, approve decisions, or replace the learner''s judgement.","Learner reflects on what changed at L2: volume, exception complexity, stakeholder pressure, authority boundary, and evidence quality compared with the previous level."]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Benefits Eligibility Audit: Routine Execution: Data, Concepts and Artifact Evidence
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-052' LIMIT 1)
   AND title = 'Module 1: Benefits Eligibility Audit Sheet Workplace Build' LIMIT 1),
  'Benefits Eligibility Audit: Routine Execution: Data, Concepts and Artifact Evidence',
  'Learner confusion: Students may understand the HR term but may not know how to read 30 messy records, compare source fields, quantify exceptions, choose proceed/return/escalate, or write the evidence trail in simple reviewer language. Root-cause focus: Investigate whether the real cause is missing source data, wrong effective date, unclear owner, system mismatch, late submission, policy/control risk, or weak handoff evidence in benefits administration portal, employee master data, policy eligibility matrix and payroll deduction file.',
  'Problem: A benefits operations analyst is handling 30 benefits eligibility audit records in benefits administration portal, employee master data, policy eligibility matrix and payroll deduction file. The file is messy: 9 records have employee class not updated, 6 have dependent proof missing, 3 have benefit start date conflicts with joining date, and some cases also show deduction file does not match election record. The team needs a clean routine handoff before the daily cut-off because downstream work cannot start until the artifact is usable. The learner must complete the standard workflow, update statuses, prepare the artifact, and send a clean handoff without needing step-by-step guidance, prepare a Benefits Eligibility Audit Sheet, and clearly mark which items are ready, returned, blocked, or escalated. If handled poorly, employees may receive wrong coverage or incorrect deductions may enter payroll. Actuals: Volume: 30 records/cases. Issue count 1: 9 with employee class not updated. Issue count 2: 6 with dependent proof missing. Issue count 3: 3 with benefit start date conflicts with joining date. Systems/documents: benefits administration portal, employee master data, policy eligibility matrix and payroll deduction file. Decision needed: ready, return, block, or escalate. Time pressure: before the daily cut-off. Major concepts: benefits eligibility rules - needed to complete and defend the Benefits Eligibility Audit Sheet; employee class dependency - needed to complete and defend the Benefits Eligibility Audit Sheet; dependent verification - needed to complete and defend the Benefits Eligibility Audit Sheet; effective-date alignment - needed to complete and defend the Benefits Eligibility Audit Sheet; election versus deduction matching - needed to complete and defend the Benefits Eligibility Audit Sheet; coverage start control - needed to complete and defend the Benefits Eligibility Audit Sheet; exception flagging - needed to complete and defend the Benefits Eligibility Audit Sheet; benefits audit evidence - needed to complete and defend the Benefits Eligibility Audit Sheet Concept-to-artifact link: These concepts are not theory-only. They tell the learner what to check inside the Benefits Eligibility Audit Sheet: source data, missing fields, exception rules, owner notes, decision status, handoff logic, and reviewer evidence. Required data: To solve the artifact, learner needs: lifecycle event, plan eligibility rules, enrollment/change evidence, dependent/supporting documents, exception flags, employee/vendor handoff note; system screenshots or exports from benefits administration portal, employee master data, policy eligibility matrix and payroll deduction file; policy or checklist rule used; stakeholder request; deadline/cut-off; prior status if available; reviewer or owner name; evidence of any unresolved exception. Artifact structure: Benefits Eligibility Audit Sheet must contain: case or employee/candidate/worker identifier; source document reference; required data fields (lifecycle event, plan eligibility rules, enrollment/change evidence, dependent/supporting documents, exception flags, employee/vendor handoff note); missing or conflicting item log; numeric issue count; exception category; owner/action note; proceed/return/block/escalate status; reviewer handoff note; closure or follow-up date. How to read artifact: Read the artifact as the learner''s final workplace proof. First check the identifiers and source documents, then the required fields, then the issue count and exception category, then the decision status, and finally whether the handoff note gives a reviewer enough evidence to act. Evidence fields: Assess whether the Benefits Eligibility Audit Sheet uses the right source data, includes all required fields, counts and labels the 18 issue records correctly, separates normal items from exceptions, gives a clear decision reason, respects the L2 authority boundary, and provides a usable reviewer handoff. AI coach boundary: AI can ask: Which source proves this field? Which 9 records are blocked? What is the decision reason? What evidence is still missing? AI can summarize checklist gaps and suggest clearer wording, but cannot create missing data, approve the case, override policy, or make the final HR/payroll/compliance decision. Traceability: Industry: HR & Workforce Services.|Domain: Payroll, Benefits & Compliance Operations.|Role: Payroll Specialist; Payroll Operations Specialist; Payroll Coordinator; Payroll Compliance Specialist; Statutory Compliance Specialist.|Capability_ID: IND-CAP-11.|Level: L2.|Course_ID: IND-S5-C-052.|Artifact: Benefits Eligibility Audit Sheet.|Source Sheet: L2_COURSE_PATTERN.',
  1,
  '10 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Com
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-052' LIMIT 1),
  'B.Com',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Com
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-052' LIMIT 1),
  'M.Com',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BBA Human Resource Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-052' LIMIT 1),
  'BBA Human Resource Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MBA Human Resource Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-052' LIMIT 1),
  'MBA Human Resource Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PGDM Payroll and Statutory Compliance
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-052' LIMIT 1),
  'PGDM Payroll and Statutory Compliance',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: LLB / BA LLB Labour and Employment Law
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-052' LIMIT 1),
  'LLB / BA LLB Labour and Employment Law',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Statutory Contribution Filing Working: Routine Execution
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Statutory Contribution Filing Working: Routine Execution',
  'IND-S5-C-057',
  'Learner can complete routine execution with clean handoff for Statutory Contribution Filing and produce a reviewer-ready Statutory Contribution Filing Working Paper with clear evidence and handoff logic. Workplace scenario: A statutory compliance specialist is handling 31 statutory contribution filing preparation records in payroll register, wage-base calculation sheet, statutory portal draft, employee ID records and finance payment evidence. The file is messy: 6 records have wage base mismatch, 4 have employee statutory ID missing, 2 have arrear amount not separated, and some cases also show portal total not matching payroll register. The team needs a clean routine handoff before the daily cut-off because downstream work cannot start until the artifact is usable. The learner must complete the standard workflow, update statuses, prepare the artifact, and send a clean handoff without needing step-by-step guidance, prepare a Statutory Contribution Filing Working Paper, and clearly mark which items are ready, returned, blocked, or escalated. If handled poorly, the organization may submit incorrect contributions, miss filing deadlines, or face correction penalties. Artifact proof: Statutory Contribution Filing Working Paper. Competency taxonomy: Functional; Technical; Behavioural; Cognitive; Evidence.',
  '10 hours',
  'Active',
  'Payroll, Benefits & Compliance Operations',
  'technical',
  '["Learner can complete routine execution with clean handoff for Statutory Contribution Filing and produce a reviewer-ready Statutory Contribution Filing Working Paper with clear evidence and handoff logic.","Create a reviewer-ready Statutory Contribution Filing Working Paper.","Use source data to resolve the skill gap: Learner must convert statutory contribution filing preparation knowledge into a usable Statutory Contribution Filing Working Paper: check wage-base calculation, contribution rates, employee/employer amounts, filing period, identify missing or conflicting records, explain the level boundary, and create a reviewer-ready handoff.","Explain evidence and consequence through the Statutory Contribution Filing Working Paper."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: Module 1: Statutory Contribution Filing Working Paper Workplace Build
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-057' LIMIT 1),
  'Module 1: Statutory Contribution Filing Working Paper Workplace Build',
  'Trigger: A statutory compliance specialist receives 31 statutory contribution filing preparation records in payroll register, wage-base calculation sheet, statutory portal draft, employee ID records and finance payment evidence; 6 show wage base mismatch, 4 show employee statutory ID missing, and 2 show arrear amount not separated. Pressure: The team needs a clean routine handoff before the daily cut-off because downstream work cannot start until the artifact is usable. Actuals: Volume: 31 records/cases. Issue count 1: 6 with wage base mismatch. Issue count 2: 4 with employee statutory ID missing. Issue count 3: 2 with arrear amount not separated. Systems/documents: payroll register, wage-base calculation sheet, statutory portal draft, employee ID records and finance payment evidence. Decision needed: ready, return, block, or escalate. Time pressure: before the daily cut-off.',
  1,
  '["HR & Workforce Services","Payroll, Benefits & Compliance Operations","Payroll Operations Specialists; Statutory Payroll & Workforce Compliance Specialists; Compensation, Rewards & Benefits Analysts","Payroll Specialist; Payroll Operations Specialist; Payroll Coordinator; Payroll Compliance Specialist; Statutory Compliance Specialist","IND-CAP-12","Statutory Contribution Filing Working Paper","Functional","Technical","Behavioural","Cognitive","Evidence"]'::jsonb,
  '["Start with the live trigger: 31 records arrive, 12 have visible issues, and a stakeholder needs an answer before the daily cut-off.","Learner studies the actual data points: wage-base calculation, contribution rates, employee/employer amounts, filing period, variance checks, approval and submission evidence; then highlights missing fields, conflicts, late inputs, and owner gaps.","Teach the artifact logic: what each section means, which evidence is mandatory, what numbers must reconcile, and what the learner is allowed to decide at L2.","Learner completes the Statutory Contribution Filing Working Paper using the case numbers, source references, exception labels, owner notes, and a clear ready/return/block/escalate recommendation.","Learner uses AI only for checklist prompts, concept reminders, and rubric self-checks. AI must not invent records, calculate unsupported numbers, approve decisions, or replace the learner''s judgement.","Learner reflects on what changed at L2: volume, exception complexity, stakeholder pressure, authority boundary, and evidence quality compared with the previous level."]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Statutory Contribution Filing Working: Routine Execution: Data, Concepts and Artifact Evidence
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-057' LIMIT 1)
   AND title = 'Module 1: Statutory Contribution Filing Working Paper Workplace Build' LIMIT 1),
  'Statutory Contribution Filing Working: Routine Execution: Data, Concepts and Artifact Evidence',
  'Learner confusion: Students may understand the HR term but may not know how to read 31 messy records, compare source fields, quantify exceptions, choose proceed/return/escalate, or write the evidence trail in simple reviewer language. Root-cause focus: Investigate whether the real cause is missing source data, wrong effective date, unclear owner, system mismatch, late submission, policy/control risk, or weak handoff evidence in payroll register, wage-base calculation sheet, statutory portal draft, employee ID records and finance payment evidence.',
  'Problem: A statutory compliance specialist is handling 31 statutory contribution filing preparation records in payroll register, wage-base calculation sheet, statutory portal draft, employee ID records and finance payment evidence. The file is messy: 6 records have wage base mismatch, 4 have employee statutory ID missing, 2 have arrear amount not separated, and some cases also show portal total not matching payroll register. The team needs a clean routine handoff before the daily cut-off because downstream work cannot start until the artifact is usable. The learner must complete the standard workflow, update statuses, prepare the artifact, and send a clean handoff without needing step-by-step guidance, prepare a Statutory Contribution Filing Working Paper, and clearly mark which items are ready, returned, blocked, or escalated. If handled poorly, the organization may submit incorrect contributions, miss filing deadlines, or face correction penalties. Actuals: Volume: 31 records/cases. Issue count 1: 6 with wage base mismatch. Issue count 2: 4 with employee statutory ID missing. Issue count 3: 2 with arrear amount not separated. Systems/documents: payroll register, wage-base calculation sheet, statutory portal draft, employee ID records and finance payment evidence. Decision needed: ready, return, block, or escalate. Time pressure: before the daily cut-off. Major concepts: statutory wage-base logic - needed to complete and defend the Statutory Contribution Filing Working Paper; employee contribution eligibility - needed to complete and defend the Statutory Contribution Filing Working Paper; employer contribution calculation - needed to complete and defend the Statutory Contribution Filing Working Paper; arrear segregation - needed to complete and defend the Statutory Contribution Filing Working Paper; filing cut-off control - needed to complete and defend the Statutory Contribution Filing Working Paper; portal-total reconciliation - needed to complete and defend the Statutory Contribution Filing Working Paper; payment evidence trail - needed to complete and defend the Statutory Contribution Filing Working Paper; statutory working-paper review - needed to complete and defend the Statutory Contribution Filing Working Paper Concept-to-artifact link: These concepts are not theory-only. They tell the learner what to check inside the Statutory Contribution Filing Working Paper: source data, missing fields, exception rules, owner notes, decision status, handoff logic, and reviewer evidence. Required data: To solve the artifact, learner needs: wage-base calculation, contribution rates, employee/employer amounts, filing period, variance checks, approval and submission evidence; system screenshots or exports from payroll register, wage-base calculation sheet, statutory portal draft, employee ID records and finance payment evidence; policy or checklist rule used; stakeholder request; deadline/cut-off; prior status if available; reviewer or owner name; evidence of any unresolved exception. Artifact structure: Statutory Contribution Filing Working Paper must contain: case or employee/candidate/worker identifier; source document reference; required data fields (wage-base calculation, contribution rates, employee/employer amounts, filing period, variance checks, approval and submission evidence); missing or conflicting item log; numeric issue count; exception category; owner/action note; proceed/return/block/escalate status; reviewer handoff note; closure or follow-up date. How to read artifact: Read the artifact as the learner''s final workplace proof. First check the identifiers and source documents, then the required fields, then the issue count and exception category, then the decision status, and finally whether the handoff note gives a reviewer enough evidence to act. Evidence fields: Assess whether the Statutory Contribution Filing Working Paper uses the right source data, includes all required fields, counts and labels the 12 issue records correctly, separates normal items from exceptions, gives a clear decision reason, respects the L2 authority boundary, and provides a usable reviewer handoff. AI coach boundary: AI can ask: Which source proves this field? Which 6 records are blocked? What is the decision reason? What evidence is still missing? AI can summarize checklist gaps and suggest clearer wording, but cannot create missing data, approve the case, override policy, or make the final HR/payroll/compliance decision. Traceability: Industry: HR & Workforce Services.|Domain: Payroll, Benefits & Compliance Operations.|Role: Payroll Specialist; Payroll Operations Specialist; Payroll Coordinator; Payroll Compliance Specialist; Statutory Compliance Specialist.|Capability_ID: IND-CAP-12.|Level: L2.|Course_ID: IND-S5-C-057.|Artifact: Statutory Contribution Filing Working Paper.|Source Sheet: L2_COURSE_PATTERN.',
  1,
  '10 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Com
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-057' LIMIT 1),
  'B.Com',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Com
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-057' LIMIT 1),
  'M.Com',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BBA Human Resource Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-057' LIMIT 1),
  'BBA Human Resource Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MBA Human Resource Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-057' LIMIT 1),
  'MBA Human Resource Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PGDM Payroll and Statutory Compliance
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-057' LIMIT 1),
  'PGDM Payroll and Statutory Compliance',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: LLB / BA LLB Labour and Employment Law
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-057' LIMIT 1),
  'LLB / BA LLB Labour and Employment Law',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: HRIS Master Data Change Evidence: Routine Execution
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'HRIS Master Data Change Evidence: Routine Execution',
  'IND-S5-C-062',
  'Learner can complete routine execution with clean handoff for Employee Master Data Change Control and produce a reviewer-ready HRIS Master Data Change Evidence Pack with clear evidence and handoff logic. Workplace scenario: An HR operations associate is handling 32 HRIS master data change validation records in HRIS master-data screen, employee change request form, approval mail, org structure file and document repository. The file is messy: 7 records have effective date not supported, 5 have manager code mismatched, 3 have grade change approved in mail but not in form, and some cases also show location update missing document proof. The team needs a clean routine handoff before the daily cut-off because downstream work cannot start until the artifact is usable. The learner must complete the standard workflow, update statuses, prepare the artifact, and send a clean handoff without needing step-by-step guidance, prepare a HRIS Master Data Change Evidence Pack, and clearly mark which items are ready, returned, blocked, or escalated. If handled poorly, payroll, access, reporting, or manager hierarchy may become wrong across systems. Artifact proof: HRIS Master Data Change Evidence Pack. Competency taxonomy: Functional; Technical; Behavioural; Domain; Evidence.',
  '10 hours',
  'Active',
  'HR Operations & HRIS Services',
  'technical',
  '["Learner can complete routine execution with clean handoff for Employee Master Data Change Control and produce a reviewer-ready HRIS Master Data Change Evidence Pack with clear evidence and handoff logic.","Create a reviewer-ready HRIS Master Data Change Evidence Pack.","Use source data to resolve the skill gap: Learner must convert HRIS master data change validation knowledge into a usable HRIS Master Data Change Evidence Pack: check change request, source document, field-level before/after values, downstream impact checklist, identify missing or conflicting records, explain the level boundary, and create a reviewer-ready handoff.","Explain evidence and consequence through the HRIS Master Data Change Evidence Pack."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: Module 1: HRIS Master Data Change Evidence Pack Workplace Build
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-062' LIMIT 1),
  'Module 1: HRIS Master Data Change Evidence Pack Workplace Build',
  'Trigger: An HR operations associate receives 32 HRIS master data change validation records in HRIS master-data screen, employee change request form, approval mail, org structure file and document repository; 7 show effective date not supported, 5 show manager code mismatched, and 3 show grade change approved in mail but not in form. Pressure: The team needs a clean routine handoff before the daily cut-off because downstream work cannot start until the artifact is usable. Actuals: Volume: 32 records/cases. Issue count 1: 7 with effective date not supported. Issue count 2: 5 with manager code mismatched. Issue count 3: 3 with grade change approved in mail but not in form. Systems/documents: HRIS master-data screen, employee change request form, approval mail, org structure file and document repository. Decision needed: ready, return, block, or escalate. Time pressure: before the daily cut-off.',
  1,
  '["HR & Workforce Services","HR Operations & HRIS Services","HR Operations & Employee Lifecycle Specialists; People Systems, HRIS & Service Delivery Specialists","HR Operations Specialist; HR Specialist; Employee Lifecycle Specialist; Offboarding Specialist; HRIS Specialist","IND-CAP-13","HRIS Master Data Change Evidence Pack","Functional","Technical","Behavioural","Domain","Evidence"]'::jsonb,
  '["Start with the live trigger: 32 records arrive, 15 have visible issues, and a stakeholder needs an answer before the daily cut-off.","Learner studies the actual data points: change request, source document, field-level before/after values, downstream impact checklist, approval trail, audit-note closure; then highlights missing fields, conflicts, late inputs, and owner gaps.","Teach the artifact logic: what each section means, which evidence is mandatory, what numbers must reconcile, and what the learner is allowed to decide at L2.","Learner completes the HRIS Master Data Change Evidence Pack using the case numbers, source references, exception labels, owner notes, and a clear ready/return/block/escalate recommendation.","Learner uses AI only for checklist prompts, concept reminders, and rubric self-checks. AI must not invent records, calculate unsupported numbers, approve decisions, or replace the learner''s judgement.","Learner reflects on what changed at L2: volume, exception complexity, stakeholder pressure, authority boundary, and evidence quality compared with the previous level."]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: HRIS Master Data Change Evidence: Routine Execution: Data, Concepts and Artifact Evidence
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-062' LIMIT 1)
   AND title = 'Module 1: HRIS Master Data Change Evidence Pack Workplace Build' LIMIT 1),
  'HRIS Master Data Change Evidence: Routine Execution: Data, Concepts and Artifact Evidence',
  'Learner confusion: Students may understand the HR term but may not know how to read 32 messy records, compare source fields, quantify exceptions, choose proceed/return/escalate, or write the evidence trail in simple reviewer language. Root-cause focus: Investigate whether the real cause is missing source data, wrong effective date, unclear owner, system mismatch, late submission, policy/control risk, or weak handoff evidence in HRIS master-data screen, employee change request form, approval mail, org structure file and document repository.',
  'Problem: An HR operations associate is handling 32 HRIS master data change validation records in HRIS master-data screen, employee change request form, approval mail, org structure file and document repository. The file is messy: 7 records have effective date not supported, 5 have manager code mismatched, 3 have grade change approved in mail but not in form, and some cases also show location update missing document proof. The team needs a clean routine handoff before the daily cut-off because downstream work cannot start until the artifact is usable. The learner must complete the standard workflow, update statuses, prepare the artifact, and send a clean handoff without needing step-by-step guidance, prepare a HRIS Master Data Change Evidence Pack, and clearly mark which items are ready, returned, blocked, or escalated. If handled poorly, payroll, access, reporting, or manager hierarchy may become wrong across systems. Actuals: Volume: 32 records/cases. Issue count 1: 7 with effective date not supported. Issue count 2: 5 with manager code mismatched. Issue count 3: 3 with grade change approved in mail but not in form. Systems/documents: HRIS master-data screen, employee change request form, approval mail, org structure file and document repository. Decision needed: ready, return, block, or escalate. Time pressure: before the daily cut-off. Major concepts: HRIS master data control - needed to complete and defend the HRIS Master Data Change Evidence Pack; effective-date validation - needed to complete and defend the HRIS Master Data Change Evidence Pack; approval-source matching - needed to complete and defend the HRIS Master Data Change Evidence Pack; manager and org code dependency - needed to complete and defend the HRIS Master Data Change Evidence Pack; location and grade change rules - needed to complete and defend the HRIS Master Data Change Evidence Pack; data-change evidence pack - needed to complete and defend the HRIS Master Data Change Evidence Pack; downstream impact check - needed to complete and defend the HRIS Master Data Change Evidence Pack; change closure documentation - needed to complete and defend the HRIS Master Data Change Evidence Pack Concept-to-artifact link: These concepts are not theory-only. They tell the learner what to check inside the HRIS Master Data Change Evidence Pack: source data, missing fields, exception rules, owner notes, decision status, handoff logic, and reviewer evidence. Required data: To solve the artifact, learner needs: change request, source document, field-level before/after values, downstream impact checklist, approval trail, audit-note closure; system screenshots or exports from HRIS master-data screen, employee change request form, approval mail, org structure file and document repository; policy or checklist rule used; stakeholder request; deadline/cut-off; prior status if available; reviewer or owner name; evidence of any unresolved exception. Artifact structure: HRIS Master Data Change Evidence Pack must contain: case or employee/candidate/worker identifier; source document reference; required data fields (change request, source document, field-level before/after values, downstream impact checklist, approval trail, audit-note closure); missing or conflicting item log; numeric issue count; exception category; owner/action note; proceed/return/block/escalate status; reviewer handoff note; closure or follow-up date. How to read artifact: Read the artifact as the learner''s final workplace proof. First check the identifiers and source documents, then the required fields, then the issue count and exception category, then the decision status, and finally whether the handoff note gives a reviewer enough evidence to act. Evidence fields: Assess whether the HRIS Master Data Change Evidence Pack uses the right source data, includes all required fields, counts and labels the 15 issue records correctly, separates normal items from exceptions, gives a clear decision reason, respects the L2 authority boundary, and provides a usable reviewer handoff. AI coach boundary: AI can ask: Which source proves this field? Which 7 records are blocked? What is the decision reason? What evidence is still missing? AI can summarize checklist gaps and suggest clearer wording, but cannot create missing data, approve the case, override policy, or make the final HR/payroll/compliance decision. Traceability: Industry: HR & Workforce Services.|Domain: HR Operations & HRIS Services.|Role: HR Operations Specialist; HR Specialist; Employee Lifecycle Specialist; Offboarding Specialist; HRIS Specialist.|Capability_ID: IND-CAP-13.|Level: L2.|Course_ID: IND-S5-C-062.|Artifact: HRIS Master Data Change Evidence Pack.|Source Sheet: L2_COURSE_PATTERN.',
  1,
  '10 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BBA Human Resource Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-062' LIMIT 1),
  'BBA Human Resource Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MBA Human Resource Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-062' LIMIT 1),
  'MBA Human Resource Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BCA
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-062' LIMIT 1),
  'BCA',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Information Technology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-062' LIMIT 1),
  'B.Sc Information Technology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BBA Business Analytics
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-062' LIMIT 1),
  'BBA Business Analytics',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PGDM HR Analytics
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-062' LIMIT 1),
  'PGDM HR Analytics',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Joiner-Mover-Leaver Closure: Routine Execution
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Joiner-Mover-Leaver Closure: Routine Execution',
  'IND-S5-C-067',
  'Learner can complete routine execution with clean handoff for Administer Joiner-Mover-Leaver Checklists Through Service-Owner Closure and produce a reviewer-ready Joiner-Mover-Leaver Closure Checklist with clear evidence and handoff logic. Workplace scenario: An employee lifecycle coordinator is handling 33 joiner-mover-leaver closure records in JML tracker, HRIS, IT access list, payroll handoff sheet and document checklist. The file is messy: 8 records have joining document pending, 6 have mover access change not confirmed, 2 have leaver clearance not signed, and some cases also show payroll stop or start date unclear. The team needs a clean routine handoff before the daily cut-off because downstream work cannot start until the artifact is usable. The learner must complete the standard workflow, update statuses, prepare the artifact, and send a clean handoff without needing step-by-step guidance, prepare a Joiner-Mover-Leaver Closure Checklist, and clearly mark which items are ready, returned, blocked, or escalated. If handled poorly, new joiners may not be ready, movers may keep wrong access, or leavers may remain active in systems. Artifact proof: Joiner-Mover-Leaver Closure Checklist. Competency taxonomy: Functional; Technical; Behavioural; Cognitive; Evidence.',
  '10 hours',
  'Active',
  'HR & Workforce Services',
  'technical',
  '["Learner can complete routine execution with clean handoff for Administer Joiner-Mover-Leaver Checklists Through Service-Owner Closure and produce a reviewer-ready Joiner-Mover-Leaver Closure Checklist with clear evidence and handoff logic.","Create a reviewer-ready Joiner-Mover-Leaver Closure Checklist.","Use source data to resolve the skill gap: Learner must convert joiner-mover-leaver closure knowledge into a usable Joiner-Mover-Leaver Closure Checklist: check lifecycle trigger, service-owner tasks, access/equipment/payroll dependencies, status tracker, identify missing or conflicting records, explain the level boundary, and create a reviewer-ready handoff.","Explain evidence and consequence through the Joiner-Mover-Leaver Closure Checklist."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: Module 1: Joiner-Mover-Leaver Closure Checklist Workplace Build
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-067' LIMIT 1),
  'Module 1: Joiner-Mover-Leaver Closure Checklist Workplace Build',
  'Trigger: An employee lifecycle coordinator receives 33 joiner-mover-leaver closure records in JML tracker, HRIS, IT access list, payroll handoff sheet and document checklist; 8 show joining document pending, 6 show mover access change not confirmed, and 2 show leaver clearance not signed. Pressure: The team needs a clean routine handoff before the daily cut-off because downstream work cannot start until the artifact is usable. Actuals: Volume: 33 records/cases. Issue count 1: 8 with joining document pending. Issue count 2: 6 with mover access change not confirmed. Issue count 3: 2 with leaver clearance not signed. Systems/documents: JML tracker, HRIS, IT access list, payroll handoff sheet and document checklist. Decision needed: ready, return, block, or escalate. Time pressure: before the daily cut-off.',
  1,
  '["HR & Workforce Services","HR & Workforce Services","HR Operations & Employee Lifecycle Specialists; People Systems, HRIS & Service Delivery Specialists","HR Operations Specialist; HR Specialist; Employee Lifecycle Specialist; Offboarding Specialist; HRIS Specialist","IND-CAP-14","Joiner-Mover-Leaver Closure Checklist","Functional","Technical","Behavioural","Cognitive","Evidence"]'::jsonb,
  '["Start with the live trigger: 33 records arrive, 16 have visible issues, and a stakeholder needs an answer before the daily cut-off.","Learner studies the actual data points: lifecycle trigger, service-owner tasks, access/equipment/payroll dependencies, status tracker, blocker log, closure confirmation; then highlights missing fields, conflicts, late inputs, and owner gaps.","Teach the artifact logic: what each section means, which evidence is mandatory, what numbers must reconcile, and what the learner is allowed to decide at L2.","Learner completes the Joiner-Mover-Leaver Closure Checklist using the case numbers, source references, exception labels, owner notes, and a clear ready/return/block/escalate recommendation.","Learner uses AI only for checklist prompts, concept reminders, and rubric self-checks. AI must not invent records, calculate unsupported numbers, approve decisions, or replace the learner''s judgement.","Learner reflects on what changed at L2: volume, exception complexity, stakeholder pressure, authority boundary, and evidence quality compared with the previous level."]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Joiner-Mover-Leaver Closure: Routine Execution: Data, Concepts and Artifact Evidence
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-067' LIMIT 1)
   AND title = 'Module 1: Joiner-Mover-Leaver Closure Checklist Workplace Build' LIMIT 1),
  'Joiner-Mover-Leaver Closure: Routine Execution: Data, Concepts and Artifact Evidence',
  'Learner confusion: Students may understand the HR term but may not know how to read 33 messy records, compare source fields, quantify exceptions, choose proceed/return/escalate, or write the evidence trail in simple reviewer language. Root-cause focus: Investigate whether the real cause is missing source data, wrong effective date, unclear owner, system mismatch, late submission, policy/control risk, or weak handoff evidence in JML tracker, HRIS, IT access list, payroll handoff sheet and document checklist.',
  'Problem: An employee lifecycle coordinator is handling 33 joiner-mover-leaver closure records in JML tracker, HRIS, IT access list, payroll handoff sheet and document checklist. The file is messy: 8 records have joining document pending, 6 have mover access change not confirmed, 2 have leaver clearance not signed, and some cases also show payroll stop or start date unclear. The team needs a clean routine handoff before the daily cut-off because downstream work cannot start until the artifact is usable. The learner must complete the standard workflow, update statuses, prepare the artifact, and send a clean handoff without needing step-by-step guidance, prepare a Joiner-Mover-Leaver Closure Checklist, and clearly mark which items are ready, returned, blocked, or escalated. If handled poorly, new joiners may not be ready, movers may keep wrong access, or leavers may remain active in systems. Actuals: Volume: 33 records/cases. Issue count 1: 8 with joining document pending. Issue count 2: 6 with mover access change not confirmed. Issue count 3: 2 with leaver clearance not signed. Systems/documents: JML tracker, HRIS, IT access list, payroll handoff sheet and document checklist. Decision needed: ready, return, block, or escalate. Time pressure: before the daily cut-off. Major concepts: joiner-mover-leaver workflow - needed to complete and defend the Joiner-Mover-Leaver Closure Checklist; lifecycle trigger control - needed to complete and defend the Joiner-Mover-Leaver Closure Checklist; access and payroll dependency - needed to complete and defend the Joiner-Mover-Leaver Closure Checklist; document checklist logic - needed to complete and defend the Joiner-Mover-Leaver Closure Checklist; start-stop date validation - needed to complete and defend the Joiner-Mover-Leaver Closure Checklist; handoff ownership - needed to complete and defend the Joiner-Mover-Leaver Closure Checklist; closure status coding - needed to complete and defend the Joiner-Mover-Leaver Closure Checklist; audit-ready JML evidence - needed to complete and defend the Joiner-Mover-Leaver Closure Checklist Concept-to-artifact link: These concepts are not theory-only. They tell the learner what to check inside the Joiner-Mover-Leaver Closure Checklist: source data, missing fields, exception rules, owner notes, decision status, handoff logic, and reviewer evidence. Required data: To solve the artifact, learner needs: lifecycle trigger, service-owner tasks, access/equipment/payroll dependencies, status tracker, blocker log, closure confirmation; system screenshots or exports from JML tracker, HRIS, IT access list, payroll handoff sheet and document checklist; policy or checklist rule used; stakeholder request; deadline/cut-off; prior status if available; reviewer or owner name; evidence of any unresolved exception. Artifact structure: Joiner-Mover-Leaver Closure Checklist must contain: case or employee/candidate/worker identifier; source document reference; required data fields (lifecycle trigger, service-owner tasks, access/equipment/payroll dependencies, status tracker, blocker log, closure confirmation); missing or conflicting item log; numeric issue count; exception category; owner/action note; proceed/return/block/escalate status; reviewer handoff note; closure or follow-up date. How to read artifact: Read the artifact as the learner''s final workplace proof. First check the identifiers and source documents, then the required fields, then the issue count and exception category, then the decision status, and finally whether the handoff note gives a reviewer enough evidence to act. Evidence fields: Assess whether the Joiner-Mover-Leaver Closure Checklist uses the right source data, includes all required fields, counts and labels the 16 issue records correctly, separates normal items from exceptions, gives a clear decision reason, respects the L2 authority boundary, and provides a usable reviewer handoff. AI coach boundary: AI can ask: Which source proves this field? Which 8 records are blocked? What is the decision reason? What evidence is still missing? AI can summarize checklist gaps and suggest clearer wording, but cannot create missing data, approve the case, override policy, or make the final HR/payroll/compliance decision. Traceability: Industry: HR & Workforce Services.|Domain: HR & Workforce Services.|Role: HR Operations Specialist; HR Specialist; Employee Lifecycle Specialist; Offboarding Specialist; HRIS Specialist.|Capability_ID: IND-CAP-14.|Level: L2.|Course_ID: IND-S5-C-067.|Artifact: Joiner-Mover-Leaver Closure Checklist.|Source Sheet: L2_COURSE_PATTERN.',
  1,
  '10 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BBA Human Resource Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-067' LIMIT 1),
  'BBA Human Resource Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MBA Human Resource Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-067' LIMIT 1),
  'MBA Human Resource Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PGDM Human Resource Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-067' LIMIT 1),
  'PGDM Human Resource Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Com
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-067' LIMIT 1),
  'B.Com',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BCA / B.Sc Information Technology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-067' LIMIT 1),
  'BCA / B.Sc Information Technology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: HR Service Case Resolution: Routine Execution
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'HR Service Case Resolution: Routine Execution',
  'IND-S5-C-072',
  'Learner can complete routine execution with clean handoff for HR Service Case Resolution and produce a reviewer-ready HR Service Case Resolution Note with clear evidence and handoff logic. Workplace scenario: An HR service desk analyst is handling 34 HR service case resolution records in HR service ticketing tool, policy knowledge base, employee query history and SLA dashboard. The file is messy: 9 records have employee query has incomplete facts, 4 have policy article does not match employee category, 3 have SLA timer is close to breach, and some cases also show previous response gave unclear guidance. The team needs a clean routine handoff before the daily cut-off because downstream work cannot start until the artifact is usable. The learner must complete the standard workflow, update statuses, prepare the artifact, and send a clean handoff without needing step-by-step guidance, prepare a HR Service Case Resolution Note, and clearly mark which items are ready, returned, blocked, or escalated. If handled poorly, the case may breach SLA, provide wrong guidance, or reopen because the answer is incomplete. Artifact proof: HR Service Case Resolution Note. Competency taxonomy: Functional; Technical; Behavioural; Cognitive; Evidence.',
  '10 hours',
  'Active',
  'HR Operations & HRIS Services',
  'soft',
  '["Learner can complete routine execution with clean handoff for HR Service Case Resolution and produce a reviewer-ready HR Service Case Resolution Note with clear evidence and handoff logic.","Create a reviewer-ready HR Service Case Resolution Note.","Use source data to resolve the skill gap: Learner must convert HR service case resolution knowledge into a usable HR Service Case Resolution Note: check employee query, policy reference, service-level timeline, action taken, identify missing or conflicting records, explain the level boundary, and create a reviewer-ready handoff.","Explain evidence and consequence through the HR Service Case Resolution Note."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: Module 1: HR Service Case Resolution Note Workplace Build
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-072' LIMIT 1),
  'Module 1: HR Service Case Resolution Note Workplace Build',
  'Trigger: An HR service desk analyst receives 34 HR service case resolution records in HR service ticketing tool, policy knowledge base, employee query history and SLA dashboard; 9 show employee query has incomplete facts, 4 show policy article does not match employee category, and 3 show SLA timer is close to breach. Pressure: The team needs a clean routine handoff before the daily cut-off because downstream work cannot start until the artifact is usable. Actuals: Volume: 34 records/cases. Issue count 1: 9 with employee query has incomplete facts. Issue count 2: 4 with policy article does not match employee category. Issue count 3: 3 with SLA timer is close to breach. Systems/documents: HR service ticketing tool, policy knowledge base, employee query history and SLA dashboard. Decision needed: ready, return, block, or escalate. Time pressure: before the daily cut-off.',
  1,
  '["HR & Workforce Services","HR Operations & HRIS Services","HR Operations & Employee Lifecycle Specialists; People Systems, HRIS & Service Delivery Specialists","HR Operations Specialist; HR Specialist; Employee Lifecycle Specialist; Offboarding Specialist; HRIS Specialist","IND-CAP-15","HR Service Case Resolution Note","Functional","Technical","Behavioural","Cognitive","Evidence"]'::jsonb,
  '["Start with the live trigger: 34 records arrive, 16 have visible issues, and a stakeholder needs an answer before the daily cut-off.","Learner studies the actual data points: employee query, policy reference, service-level timeline, action taken, escalation decision, employee response and closure proof; then highlights missing fields, conflicts, late inputs, and owner gaps.","Teach the artifact logic: what each section means, which evidence is mandatory, what numbers must reconcile, and what the learner is allowed to decide at L2.","Learner completes the HR Service Case Resolution Note using the case numbers, source references, exception labels, owner notes, and a clear ready/return/block/escalate recommendation.","Learner uses AI only for checklist prompts, concept reminders, and rubric self-checks. AI must not invent records, calculate unsupported numbers, approve decisions, or replace the learner''s judgement.","Learner reflects on what changed at L2: volume, exception complexity, stakeholder pressure, authority boundary, and evidence quality compared with the previous level."]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: HR Service Case Resolution: Routine Execution: Data, Concepts and Artifact Evidence
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-072' LIMIT 1)
   AND title = 'Module 1: HR Service Case Resolution Note Workplace Build' LIMIT 1),
  'HR Service Case Resolution: Routine Execution: Data, Concepts and Artifact Evidence',
  'Learner confusion: Students may understand the HR term but may not know how to read 34 messy records, compare source fields, quantify exceptions, choose proceed/return/escalate, or write the evidence trail in simple reviewer language. Root-cause focus: Investigate whether the real cause is missing source data, wrong effective date, unclear owner, system mismatch, late submission, policy/control risk, or weak handoff evidence in HR service ticketing tool, policy knowledge base, employee query history and SLA dashboard.',
  'Problem: An HR service desk analyst is handling 34 HR service case resolution records in HR service ticketing tool, policy knowledge base, employee query history and SLA dashboard. The file is messy: 9 records have employee query has incomplete facts, 4 have policy article does not match employee category, 3 have SLA timer is close to breach, and some cases also show previous response gave unclear guidance. The team needs a clean routine handoff before the daily cut-off because downstream work cannot start until the artifact is usable. The learner must complete the standard workflow, update statuses, prepare the artifact, and send a clean handoff without needing step-by-step guidance, prepare a HR Service Case Resolution Note, and clearly mark which items are ready, returned, blocked, or escalated. If handled poorly, the case may breach SLA, provide wrong guidance, or reopen because the answer is incomplete. Actuals: Volume: 34 records/cases. Issue count 1: 9 with employee query has incomplete facts. Issue count 2: 4 with policy article does not match employee category. Issue count 3: 3 with SLA timer is close to breach. Systems/documents: HR service ticketing tool, policy knowledge base, employee query history and SLA dashboard. Decision needed: ready, return, block, or escalate. Time pressure: before the daily cut-off. Major concepts: HR service case triage - needed to complete and defend the HR Service Case Resolution Note; SLA clock logic - needed to complete and defend the HR Service Case Resolution Note; policy matching - needed to complete and defend the HR Service Case Resolution Note; employee-category dependency - needed to complete and defend the HR Service Case Resolution Note; case-note quality - needed to complete and defend the HR Service Case Resolution Note; resolution versus escalation decision - needed to complete and defend the HR Service Case Resolution Note; reopen prevention - needed to complete and defend the HR Service Case Resolution Note; service evidence trail - needed to complete and defend the HR Service Case Resolution Note Concept-to-artifact link: These concepts are not theory-only. They tell the learner what to check inside the HR Service Case Resolution Note: source data, missing fields, exception rules, owner notes, decision status, handoff logic, and reviewer evidence. Required data: To solve the artifact, learner needs: employee query, policy reference, service-level timeline, action taken, escalation decision, employee response and closure proof; system screenshots or exports from HR service ticketing tool, policy knowledge base, employee query history and SLA dashboard; policy or checklist rule used; stakeholder request; deadline/cut-off; prior status if available; reviewer or owner name; evidence of any unresolved exception. Artifact structure: HR Service Case Resolution Note must contain: case or employee/candidate/worker identifier; source document reference; required data fields (employee query, policy reference, service-level timeline, action taken, escalation decision, employee response and closure proof); missing or conflicting item log; numeric issue count; exception category; owner/action note; proceed/return/block/escalate status; reviewer handoff note; closure or follow-up date. How to read artifact: Read the artifact as the learner''s final workplace proof. First check the identifiers and source documents, then the required fields, then the issue count and exception category, then the decision status, and finally whether the handoff note gives a reviewer enough evidence to act. Evidence fields: Assess whether the HR Service Case Resolution Note uses the right source data, includes all required fields, counts and labels the 16 issue records correctly, separates normal items from exceptions, gives a clear decision reason, respects the L2 authority boundary, and provides a usable reviewer handoff. AI coach boundary: AI can ask: Which source proves this field? Which 9 records are blocked? What is the decision reason? What evidence is still missing? AI can summarize checklist gaps and suggest clearer wording, but cannot create missing data, approve the case, override policy, or make the final HR/payroll/compliance decision. Traceability: Industry: HR & Workforce Services.|Domain: HR Operations & HRIS Services.|Role: HR Operations Specialist; HR Specialist; Employee Lifecycle Specialist; Offboarding Specialist; HRIS Specialist.|Capability_ID: IND-CAP-15.|Level: L2.|Course_ID: IND-S5-C-072.|Artifact: HR Service Case Resolution Note.|Source Sheet: L2_COURSE_PATTERN.',
  1,
  '10 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BBA Human Resource Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-072' LIMIT 1),
  'BBA Human Resource Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MBA Human Resource Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-072' LIMIT 1),
  'MBA Human Resource Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BCA
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-072' LIMIT 1),
  'BCA',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Information Technology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-072' LIMIT 1),
  'B.Sc Information Technology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BBA Business Analytics
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-072' LIMIT 1),
  'BBA Business Analytics',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PGDM HR Analytics
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-072' LIMIT 1),
  'PGDM HR Analytics',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: ATS-HRIS Field Mapping Reconciliation: Routine Execution
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'ATS-HRIS Field Mapping Reconciliation: Routine Execution',
  'IND-S5-C-077',
  'Learner can complete routine execution with clean handoff for ATS-HRIS Data Sync and produce a reviewer-ready ATS-HRIS Field Mapping Reconciliation Sheet with clear evidence and handoff logic. Workplace scenario: An HRIS analyst is handling 35 ATS-HRIS field mapping reconciliation records in ATS export, HRIS import template, integration error report and field-mapping sheet. The file is messy: 6 records have candidate ID not matching employee ID, 5 have job code mapped to wrong HRIS field, 2 have start date format rejected, and some cases also show department code missing from source. The team needs a clean routine handoff before the daily cut-off because downstream work cannot start until the artifact is usable. The learner must complete the standard workflow, update statuses, prepare the artifact, and send a clean handoff without needing step-by-step guidance, prepare a ATS-HRIS Field Mapping Reconciliation Sheet, and clearly mark which items are ready, returned, blocked, or escalated. If handled poorly, employee records may be created incorrectly or onboarding and payroll downstream tasks may fail. Artifact proof: ATS-HRIS Field Mapping Reconciliation Sheet. Competency taxonomy: Functional; Technical; Behavioural; Cognitive; Evidence.',
  '10 hours',
  'Active',
  'HR Operations & HRIS Services',
  'technical',
  '["Learner can complete routine execution with clean handoff for ATS-HRIS Data Sync and produce a reviewer-ready ATS-HRIS Field Mapping Reconciliation Sheet with clear evidence and handoff logic.","Create a reviewer-ready ATS-HRIS Field Mapping Reconciliation Sheet.","Use source data to resolve the skill gap: Learner must convert ATS-HRIS field mapping reconciliation knowledge into a usable ATS-HRIS Field Mapping Reconciliation Sheet: check source/target field map, failed records, mismatch reason, correction action, identify missing or conflicting records, explain the level boundary, and create a reviewer-ready handoff.","Explain evidence and consequence through the ATS-HRIS Field Mapping Reconciliation Sheet."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: Module 1: ATS-HRIS Field Mapping Reconciliation Sheet Workplace Build
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-077' LIMIT 1),
  'Module 1: ATS-HRIS Field Mapping Reconciliation Sheet Workplace Build',
  'Trigger: An HRIS analyst receives 35 ATS-HRIS field mapping reconciliation records in ATS export, HRIS import template, integration error report and field-mapping sheet; 6 show candidate ID not matching employee ID, 5 show job code mapped to wrong HRIS field, and 2 show start date format rejected. Pressure: The team needs a clean routine handoff before the daily cut-off because downstream work cannot start until the artifact is usable. Actuals: Volume: 35 records/cases. Issue count 1: 6 with candidate ID not matching employee ID. Issue count 2: 5 with job code mapped to wrong HRIS field. Issue count 3: 2 with start date format rejected. Systems/documents: ATS export, HRIS import template, integration error report and field-mapping sheet. Decision needed: ready, return, block, or escalate. Time pressure: before the daily cut-off.',
  1,
  '["HR & Workforce Services","HR Operations & HRIS Services","HR Operations & Employee Lifecycle Specialists; People Systems, HRIS & Service Delivery Specialists","HR Operations Specialist; HR Specialist; Employee Lifecycle Specialist; Offboarding Specialist; HRIS Specialist","IND-CAP-16","ATS-HRIS Field Mapping Reconciliation Sheet","Functional","Technical","Behavioural","Cognitive","Evidence"]'::jsonb,
  '["Start with the live trigger: 35 records arrive, 13 have visible issues, and a stakeholder needs an answer before the daily cut-off.","Learner studies the actual data points: source/target field map, failed records, mismatch reason, correction action, sync retest result, downstream control note; then highlights missing fields, conflicts, late inputs, and owner gaps.","Teach the artifact logic: what each section means, which evidence is mandatory, what numbers must reconcile, and what the learner is allowed to decide at L2.","Learner completes the ATS-HRIS Field Mapping Reconciliation Sheet using the case numbers, source references, exception labels, owner notes, and a clear ready/return/block/escalate recommendation.","Learner uses AI only for checklist prompts, concept reminders, and rubric self-checks. AI must not invent records, calculate unsupported numbers, approve decisions, or replace the learner''s judgement.","Learner reflects on what changed at L2: volume, exception complexity, stakeholder pressure, authority boundary, and evidence quality compared with the previous level."]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: ATS-HRIS Field Mapping Reconciliation: Routine Execution: Data, Concepts and Artifact Evidence
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-077' LIMIT 1)
   AND title = 'Module 1: ATS-HRIS Field Mapping Reconciliation Sheet Workplace Build' LIMIT 1),
  'ATS-HRIS Field Mapping Reconciliation: Routine Execution: Data, Concepts and Artifact Evidence',
  'Learner confusion: Students may understand the HR term but may not know how to read 35 messy records, compare source fields, quantify exceptions, choose proceed/return/escalate, or write the evidence trail in simple reviewer language. Root-cause focus: Investigate whether the real cause is missing source data, wrong effective date, unclear owner, system mismatch, late submission, policy/control risk, or weak handoff evidence in ATS export, HRIS import template, integration error report and field-mapping sheet.',
  'Problem: An HRIS analyst is handling 35 ATS-HRIS field mapping reconciliation records in ATS export, HRIS import template, integration error report and field-mapping sheet. The file is messy: 6 records have candidate ID not matching employee ID, 5 have job code mapped to wrong HRIS field, 2 have start date format rejected, and some cases also show department code missing from source. The team needs a clean routine handoff before the daily cut-off because downstream work cannot start until the artifact is usable. The learner must complete the standard workflow, update statuses, prepare the artifact, and send a clean handoff without needing step-by-step guidance, prepare a ATS-HRIS Field Mapping Reconciliation Sheet, and clearly mark which items are ready, returned, blocked, or escalated. If handled poorly, employee records may be created incorrectly or onboarding and payroll downstream tasks may fail. Actuals: Volume: 35 records/cases. Issue count 1: 6 with candidate ID not matching employee ID. Issue count 2: 5 with job code mapped to wrong HRIS field. Issue count 3: 2 with start date format rejected. Systems/documents: ATS export, HRIS import template, integration error report and field-mapping sheet. Decision needed: ready, return, block, or escalate. Time pressure: before the daily cut-off. Major concepts: ATS-HRIS integration flow - needed to complete and defend the ATS-HRIS Field Mapping Reconciliation Sheet; field mapping - needed to complete and defend the ATS-HRIS Field Mapping Reconciliation Sheet; unique identifier matching - needed to complete and defend the ATS-HRIS Field Mapping Reconciliation Sheet; data type and format validation - needed to complete and defend the ATS-HRIS Field Mapping Reconciliation Sheet; job and department code control - needed to complete and defend the ATS-HRIS Field Mapping Reconciliation Sheet; import error classification - needed to complete and defend the ATS-HRIS Field Mapping Reconciliation Sheet; reconciliation evidence - needed to complete and defend the ATS-HRIS Field Mapping Reconciliation Sheet; sync quality gate - needed to complete and defend the ATS-HRIS Field Mapping Reconciliation Sheet Concept-to-artifact link: These concepts are not theory-only. They tell the learner what to check inside the ATS-HRIS Field Mapping Reconciliation Sheet: source data, missing fields, exception rules, owner notes, decision status, handoff logic, and reviewer evidence. Required data: To solve the artifact, learner needs: source/target field map, failed records, mismatch reason, correction action, sync retest result, downstream control note; system screenshots or exports from ATS export, HRIS import template, integration error report and field-mapping sheet; policy or checklist rule used; stakeholder request; deadline/cut-off; prior status if available; reviewer or owner name; evidence of any unresolved exception. Artifact structure: ATS-HRIS Field Mapping Reconciliation Sheet must contain: case or employee/candidate/worker identifier; source document reference; required data fields (source/target field map, failed records, mismatch reason, correction action, sync retest result, downstream control note); missing or conflicting item log; numeric issue count; exception category; owner/action note; proceed/return/block/escalate status; reviewer handoff note; closure or follow-up date. How to read artifact: Read the artifact as the learner''s final workplace proof. First check the identifiers and source documents, then the required fields, then the issue count and exception category, then the decision status, and finally whether the handoff note gives a reviewer enough evidence to act. Evidence fields: Assess whether the ATS-HRIS Field Mapping Reconciliation Sheet uses the right source data, includes all required fields, counts and labels the 13 issue records correctly, separates normal items from exceptions, gives a clear decision reason, respects the L2 authority boundary, and provides a usable reviewer handoff. AI coach boundary: AI can ask: Which source proves this field? Which 6 records are blocked? What is the decision reason? What evidence is still missing? AI can summarize checklist gaps and suggest clearer wording, but cannot create missing data, approve the case, override policy, or make the final HR/payroll/compliance decision. Traceability: Industry: HR & Workforce Services.|Domain: HR Operations & HRIS Services.|Role: HR Operations Specialist; HR Specialist; Employee Lifecycle Specialist; Offboarding Specialist; HRIS Specialist.|Capability_ID: IND-CAP-16.|Level: L2.|Course_ID: IND-S5-C-077.|Artifact: ATS-HRIS Field Mapping Reconciliation Sheet.|Source Sheet: L2_COURSE_PATTERN.',
  1,
  '10 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BBA Human Resource Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-077' LIMIT 1),
  'BBA Human Resource Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MBA Human Resource Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-077' LIMIT 1),
  'MBA Human Resource Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BCA
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-077' LIMIT 1),
  'BCA',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Information Technology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-077' LIMIT 1),
  'B.Sc Information Technology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BBA Business Analytics
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-077' LIMIT 1),
  'BBA Business Analytics',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PGDM HR Analytics
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-077' LIMIT 1),
  'PGDM HR Analytics',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: People Advisory Risk Action: Routine Execution
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'People Advisory Risk Action: Routine Execution',
  'IND-S5-C-082',
  'Learner can complete routine execution with clean handoff for Translate Manager People-Advisory Requests Into Risk-Aware and produce a reviewer-ready People Advisory Risk Action Plan with clear evidence and handoff logic. Workplace scenario: A people advisory consultant is handling 36 people advisory risk action planning records in manager case notes, HR policy guide, employee history, performance notes and risk tracker. The file is messy: 7 records have manager request is vague, 6 have employee history has repeated concerns, 3 have policy route is unclear, and some cases also show risk level not documented. The team needs a clean routine handoff before the daily cut-off because downstream work cannot start until the artifact is usable. The learner must complete the standard workflow, update statuses, prepare the artifact, and send a clean handoff without needing step-by-step guidance, prepare a People Advisory Risk Action Plan, and clearly mark which items are ready, returned, blocked, or escalated. If handled poorly, the advice may create employee relations risk, inconsistent manager action, or weak documentation. Artifact proof: People Advisory Risk Action Plan. Competency taxonomy: Functional; Technical; Behavioural; Cognitive; Evidence.',
  '10 hours',
  'Active',
  'HR & Workforce Services',
  'soft',
  '["Learner can complete routine execution with clean handoff for Translate Manager People-Advisory Requests Into Risk-Aware and produce a reviewer-ready People Advisory Risk Action Plan with clear evidence and handoff logic.","Create a reviewer-ready People Advisory Risk Action Plan.","Use source data to resolve the skill gap: Learner must convert people advisory risk action planning knowledge into a usable People Advisory Risk Action Plan: check manager request, policy context, employee impact, risk classification, identify missing or conflicting records, explain the level boundary, and create a reviewer-ready handoff.","Explain evidence and consequence through the People Advisory Risk Action Plan."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: Module 1: People Advisory Risk Action Plan Workplace Build
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-082' LIMIT 1),
  'Module 1: People Advisory Risk Action Plan Workplace Build',
  'Trigger: A people advisory consultant receives 36 people advisory risk action planning records in manager case notes, HR policy guide, employee history, performance notes and risk tracker; 7 show manager request is vague, 6 show employee history has repeated concerns, and 3 show policy route is unclear. Pressure: The team needs a clean routine handoff before the daily cut-off because downstream work cannot start until the artifact is usable. Actuals: Volume: 36 records/cases. Issue count 1: 7 with manager request is vague. Issue count 2: 6 with employee history has repeated concerns. Issue count 3: 3 with policy route is unclear. Systems/documents: manager case notes, HR policy guide, employee history, performance notes and risk tracker. Decision needed: ready, return, block, or escalate. Time pressure: before the daily cut-off.',
  1,
  '["HR & Workforce Services","HR & Workforce Services","HR Business Partners & People Advisory Consultants; Workforce Planning Analysts & Consultants","HR Business Partner; HR Consultant; People Advisory Consultant; HR Specialist; Workforce Planning Analyst","IND-CAP-17","People Advisory Risk Action Plan","Functional","Technical","Behavioural","Cognitive","Evidence"]'::jsonb,
  '["Start with the live trigger: 36 records arrive, 16 have visible issues, and a stakeholder needs an answer before the daily cut-off.","Learner studies the actual data points: manager request, policy context, employee impact, risk classification, recommended actions, communication and escalation plan; then highlights missing fields, conflicts, late inputs, and owner gaps.","Teach the artifact logic: what each section means, which evidence is mandatory, what numbers must reconcile, and what the learner is allowed to decide at L2.","Learner completes the People Advisory Risk Action Plan using the case numbers, source references, exception labels, owner notes, and a clear ready/return/block/escalate recommendation.","Learner uses AI only for checklist prompts, concept reminders, and rubric self-checks. AI must not invent records, calculate unsupported numbers, approve decisions, or replace the learner''s judgement.","Learner reflects on what changed at L2: volume, exception complexity, stakeholder pressure, authority boundary, and evidence quality compared with the previous level."]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: People Advisory Risk Action: Routine Execution: Data, Concepts and Artifact Evidence
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-082' LIMIT 1)
   AND title = 'Module 1: People Advisory Risk Action Plan Workplace Build' LIMIT 1),
  'People Advisory Risk Action: Routine Execution: Data, Concepts and Artifact Evidence',
  'Learner confusion: Students may understand the HR term but may not know how to read 36 messy records, compare source fields, quantify exceptions, choose proceed/return/escalate, or write the evidence trail in simple reviewer language. Root-cause focus: Investigate whether the real cause is missing source data, wrong effective date, unclear owner, system mismatch, late submission, policy/control risk, or weak handoff evidence in manager case notes, HR policy guide, employee history, performance notes and risk tracker.',
  'Problem: A people advisory consultant is handling 36 people advisory risk action planning records in manager case notes, HR policy guide, employee history, performance notes and risk tracker. The file is messy: 7 records have manager request is vague, 6 have employee history has repeated concerns, 3 have policy route is unclear, and some cases also show risk level not documented. The team needs a clean routine handoff before the daily cut-off because downstream work cannot start until the artifact is usable. The learner must complete the standard workflow, update statuses, prepare the artifact, and send a clean handoff without needing step-by-step guidance, prepare a People Advisory Risk Action Plan, and clearly mark which items are ready, returned, blocked, or escalated. If handled poorly, the advice may create employee relations risk, inconsistent manager action, or weak documentation. Actuals: Volume: 36 records/cases. Issue count 1: 7 with manager request is vague. Issue count 2: 6 with employee history has repeated concerns. Issue count 3: 3 with policy route is unclear. Systems/documents: manager case notes, HR policy guide, employee history, performance notes and risk tracker. Decision needed: ready, return, block, or escalate. Time pressure: before the daily cut-off. Major concepts: people advisory intake - needed to complete and defend the People Advisory Risk Action Plan; risk classification - needed to complete and defend the People Advisory Risk Action Plan; policy route selection - needed to complete and defend the People Advisory Risk Action Plan; manager guidance boundary - needed to complete and defend the People Advisory Risk Action Plan; employee history review - needed to complete and defend the People Advisory Risk Action Plan; action option comparison - needed to complete and defend the People Advisory Risk Action Plan; documentation standard - needed to complete and defend the People Advisory Risk Action Plan; escalation trigger - needed to complete and defend the People Advisory Risk Action Plan Concept-to-artifact link: These concepts are not theory-only. They tell the learner what to check inside the People Advisory Risk Action Plan: source data, missing fields, exception rules, owner notes, decision status, handoff logic, and reviewer evidence. Required data: To solve the artifact, learner needs: manager request, policy context, employee impact, risk classification, recommended actions, communication and escalation plan; system screenshots or exports from manager case notes, HR policy guide, employee history, performance notes and risk tracker; policy or checklist rule used; stakeholder request; deadline/cut-off; prior status if available; reviewer or owner name; evidence of any unresolved exception. Artifact structure: People Advisory Risk Action Plan must contain: case or employee/candidate/worker identifier; source document reference; required data fields (manager request, policy context, employee impact, risk classification, recommended actions, communication and escalation plan); missing or conflicting item log; numeric issue count; exception category; owner/action note; proceed/return/block/escalate status; reviewer handoff note; closure or follow-up date. How to read artifact: Read the artifact as the learner''s final workplace proof. First check the identifiers and source documents, then the required fields, then the issue count and exception category, then the decision status, and finally whether the handoff note gives a reviewer enough evidence to act. Evidence fields: Assess whether the People Advisory Risk Action Plan uses the right source data, includes all required fields, counts and labels the 16 issue records correctly, separates normal items from exceptions, gives a clear decision reason, respects the L2 authority boundary, and provides a usable reviewer handoff. AI coach boundary: AI can ask: Which source proves this field? Which 7 records are blocked? What is the decision reason? What evidence is still missing? AI can summarize checklist gaps and suggest clearer wording, but cannot create missing data, approve the case, override policy, or make the final HR/payroll/compliance decision. Traceability: Industry: HR & Workforce Services.|Domain: HR & Workforce Services.|Role: HR Business Partner; HR Consultant; People Advisory Consultant; HR Specialist; Workforce Planning Analyst.|Capability_ID: IND-CAP-17.|Level: L2.|Course_ID: IND-S5-C-082.|Artifact: People Advisory Risk Action Plan.|Source Sheet: L2_COURSE_PATTERN.',
  1,
  '10 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MBA Human Resource Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-082' LIMIT 1),
  'MBA Human Resource Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PGDM Human Resource Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-082' LIMIT 1),
  'PGDM Human Resource Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MA Organisational Psychology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-082' LIMIT 1),
  'MA Organisational Psychology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MSW Human Resource Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-082' LIMIT 1),
  'MSW Human Resource Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BBA Human Resource Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-082' LIMIT 1),
  'BBA Human Resource Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Organization Change Impact & Communication Map: Routine Execution
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Organization Change Impact & Communication Map: Routine Execution',
  'IND-S5-C-087',
  'Learner can complete routine execution with clean handoff for Organization Change Impact and produce a reviewer-ready Organization Change Impact & Communication Map with clear evidence and handoff logic. Workplace scenario: An organization change coordinator is handling 28 change impact and communication mapping records in org design change list, stakeholder map, role impact sheet and communication plan tracker. The file is messy: 8 records have affected teams not fully listed, 4 have role impact unclear, 2 have communication owner missing, and some cases also show change date conflicts with payroll or system cut-off. The team needs a clean routine handoff before the daily cut-off because downstream work cannot start until the artifact is usable. The learner must complete the standard workflow, update statuses, prepare the artifact, and send a clean handoff without needing step-by-step guidance, prepare a Organization Change Impact & Communication Map, and clearly mark which items are ready, returned, blocked, or escalated. If handled poorly, employees may receive confusing messages or critical HR and system actions may be missed. Artifact proof: Organization Change Impact & Communication Map. Competency taxonomy: Functional; Technical; Behavioural; Cognitive; Evidence.',
  '10 hours',
  'Active',
  'People Advisory & Organisation Change',
  'soft',
  '["Learner can complete routine execution with clean handoff for Organization Change Impact and produce a reviewer-ready Organization Change Impact & Communication Map with clear evidence and handoff logic.","Create a reviewer-ready Organization Change Impact & Communication Map.","Use source data to resolve the skill gap: Learner must convert change impact and communication mapping knowledge into a usable Organization Change Impact & Communication Map: check change summary, affected groups, people risks, message plan, identify missing or conflicting records, explain the level boundary, and create a reviewer-ready handoff.","Explain evidence and consequence through the Organization Change Impact & Communication Map."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: Module 1: Organization Change Impact & Communication Map Workplace Build
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-087' LIMIT 1),
  'Module 1: Organization Change Impact & Communication Map Workplace Build',
  'Trigger: An organization change coordinator receives 28 change impact and communication mapping records in org design change list, stakeholder map, role impact sheet and communication plan tracker; 8 show affected teams not fully listed, 4 show role impact unclear, and 2 show communication owner missing. Pressure: The team needs a clean routine handoff before the daily cut-off because downstream work cannot start until the artifact is usable. Actuals: Volume: 28 records/cases. Issue count 1: 8 with affected teams not fully listed. Issue count 2: 4 with role impact unclear. Issue count 3: 2 with communication owner missing. Systems/documents: org design change list, stakeholder map, role impact sheet and communication plan tracker. Decision needed: ready, return, block, or escalate. Time pressure: before the daily cut-off.',
  1,
  '["HR & Workforce Services","People Advisory & Organisation Change","HR Business Partners & People Advisory Consultants; Workforce Planning Analysts & Consultants","HR Business Partner; HR Consultant; People Advisory Consultant; HR Specialist; Workforce Planning Analyst","IND-CAP-18","Organization Change Impact & Communication Map","Functional","Technical","Behavioural","Cognitive","Evidence"]'::jsonb,
  '["Start with the live trigger: 28 records arrive, 14 have visible issues, and a stakeholder needs an answer before the daily cut-off.","Learner studies the actual data points: change summary, affected groups, people risks, message plan, stakeholder questions, escalation risks, action follow-up log; then highlights missing fields, conflicts, late inputs, and owner gaps.","Teach the artifact logic: what each section means, which evidence is mandatory, what numbers must reconcile, and what the learner is allowed to decide at L2.","Learner completes the Organization Change Impact & Communication Map using the case numbers, source references, exception labels, owner notes, and a clear ready/return/block/escalate recommendation.","Learner uses AI only for checklist prompts, concept reminders, and rubric self-checks. AI must not invent records, calculate unsupported numbers, approve decisions, or replace the learner''s judgement.","Learner reflects on what changed at L2: volume, exception complexity, stakeholder pressure, authority boundary, and evidence quality compared with the previous level."]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Organization Change Impact & Communication Map: Routine Execution: Data, Concepts and Artifact Evidence
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-087' LIMIT 1)
   AND title = 'Module 1: Organization Change Impact & Communication Map Workplace Build' LIMIT 1),
  'Organization Change Impact & Communication Map: Routine Execution: Data, Concepts and Artifact Evidence',
  'Learner confusion: Students may understand the HR term but may not know how to read 28 messy records, compare source fields, quantify exceptions, choose proceed/return/escalate, or write the evidence trail in simple reviewer language. Root-cause focus: Investigate whether the real cause is missing source data, wrong effective date, unclear owner, system mismatch, late submission, policy/control risk, or weak handoff evidence in org design change list, stakeholder map, role impact sheet and communication plan tracker.',
  'Problem: An organization change coordinator is handling 28 change impact and communication mapping records in org design change list, stakeholder map, role impact sheet and communication plan tracker. The file is messy: 8 records have affected teams not fully listed, 4 have role impact unclear, 2 have communication owner missing, and some cases also show change date conflicts with payroll or system cut-off. The team needs a clean routine handoff before the daily cut-off because downstream work cannot start until the artifact is usable. The learner must complete the standard workflow, update statuses, prepare the artifact, and send a clean handoff without needing step-by-step guidance, prepare a Organization Change Impact & Communication Map, and clearly mark which items are ready, returned, blocked, or escalated. If handled poorly, employees may receive confusing messages or critical HR and system actions may be missed. Actuals: Volume: 28 records/cases. Issue count 1: 8 with affected teams not fully listed. Issue count 2: 4 with role impact unclear. Issue count 3: 2 with communication owner missing. Systems/documents: org design change list, stakeholder map, role impact sheet and communication plan tracker. Decision needed: ready, return, block, or escalate. Time pressure: before the daily cut-off. Major concepts: change impact analysis - needed to complete and defend the Organization Change Impact & Communication Map; stakeholder mapping - needed to complete and defend the Organization Change Impact & Communication Map; role impact classification - needed to complete and defend the Organization Change Impact & Communication Map; communication sequencing - needed to complete and defend the Organization Change Impact & Communication Map; HR action dependency - needed to complete and defend the Organization Change Impact & Communication Map; cut-off date planning - needed to complete and defend the Organization Change Impact & Communication Map; owner assignment - needed to complete and defend the Organization Change Impact & Communication Map; change evidence map - needed to complete and defend the Organization Change Impact & Communication Map Concept-to-artifact link: These concepts are not theory-only. They tell the learner what to check inside the Organization Change Impact & Communication Map: source data, missing fields, exception rules, owner notes, decision status, handoff logic, and reviewer evidence. Required data: To solve the artifact, learner needs: change summary, affected groups, people risks, message plan, stakeholder questions, escalation risks, action follow-up log; system screenshots or exports from org design change list, stakeholder map, role impact sheet and communication plan tracker; policy or checklist rule used; stakeholder request; deadline/cut-off; prior status if available; reviewer or owner name; evidence of any unresolved exception. Artifact structure: Organization Change Impact & Communication Map must contain: case or employee/candidate/worker identifier; source document reference; required data fields (change summary, affected groups, people risks, message plan, stakeholder questions, escalation risks, action follow-up log); missing or conflicting item log; numeric issue count; exception category; owner/action note; proceed/return/block/escalate status; reviewer handoff note; closure or follow-up date. How to read artifact: Read the artifact as the learner''s final workplace proof. First check the identifiers and source documents, then the required fields, then the issue count and exception category, then the decision status, and finally whether the handoff note gives a reviewer enough evidence to act. Evidence fields: Assess whether the Organization Change Impact & Communication Map uses the right source data, includes all required fields, counts and labels the 14 issue records correctly, separates normal items from exceptions, gives a clear decision reason, respects the L2 authority boundary, and provides a usable reviewer handoff. AI coach boundary: AI can ask: Which source proves this field? Which 8 records are blocked? What is the decision reason? What evidence is still missing? AI can summarize checklist gaps and suggest clearer wording, but cannot create missing data, approve the case, override policy, or make the final HR/payroll/compliance decision. Traceability: Industry: HR & Workforce Services.|Domain: People Advisory & Organisation Change.|Role: HR Business Partner; HR Consultant; People Advisory Consultant; HR Specialist; Workforce Planning Analyst.|Capability_ID: IND-CAP-18.|Level: L2.|Course_ID: IND-S5-C-087.|Artifact: Organization Change Impact & Communication Map.|Source Sheet: L2_COURSE_PATTERN.',
  1,
  '10 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MBA Human Resource Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-087' LIMIT 1),
  'MBA Human Resource Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PGDM Organisation Development
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-087' LIMIT 1),
  'PGDM Organisation Development',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MA Organisational Psychology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-087' LIMIT 1),
  'MA Organisational Psychology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MSW Human Resource Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-087' LIMIT 1),
  'MSW Human Resource Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BBA Human Resource Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-087' LIMIT 1),
  'BBA Human Resource Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Workforce Gap: Routine Execution
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Workforce Gap: Routine Execution',
  'IND-S5-C-092',
  'Learner can complete routine execution with clean handoff for Workforce Gap Planning and produce a reviewer-ready Workforce Gap Register with clear evidence and handoff logic. Workplace scenario: A workforce planning analyst is handling 29 workforce gap register preparation records in headcount plan, vacancy report, skills inventory, attrition data and demand forecast sheet. The file is messy: 9 records have forecast demand changed, 5 have vacancy list has stale roles, 3 have skills inventory is incomplete, and some cases also show attrition risk not linked to team capacity. The team needs a clean routine handoff before the daily cut-off because downstream work cannot start until the artifact is usable. The learner must complete the standard workflow, update statuses, prepare the artifact, and send a clean handoff without needing step-by-step guidance, prepare a Workforce Gap Register, and clearly mark which items are ready, returned, blocked, or escalated. If handled poorly, hiring, redeployment, or training decisions may target the wrong workforce gap. Artifact proof: Workforce Gap Register. Competency taxonomy: Functional; Technical; Behavioural; Cognitive; Evidence.',
  '10 hours',
  'Active',
  'Workforce Planning & Learning Operations',
  'technical',
  '["Learner can complete routine execution with clean handoff for Workforce Gap Planning and produce a reviewer-ready Workforce Gap Register with clear evidence and handoff logic.","Create a reviewer-ready Workforce Gap Register.","Use source data to resolve the skill gap: Learner must convert workforce gap register preparation knowledge into a usable Workforce Gap Register: check demand forecast, current headcount, capacity assumptions, gap calculation, identify missing or conflicting records, explain the level boundary, and create a reviewer-ready handoff.","Explain evidence and consequence through the Workforce Gap Register."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: Module 1: Workforce Gap Register Workplace Build
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-092' LIMIT 1),
  'Module 1: Workforce Gap Register Workplace Build',
  'Trigger: A workforce planning analyst receives 29 workforce gap register preparation records in headcount plan, vacancy report, skills inventory, attrition data and demand forecast sheet; 9 show forecast demand changed, 5 show vacancy list has stale roles, and 3 show skills inventory is incomplete. Pressure: The team needs a clean routine handoff before the daily cut-off because downstream work cannot start until the artifact is usable. Actuals: Volume: 29 records/cases. Issue count 1: 9 with forecast demand changed. Issue count 2: 5 with vacancy list has stale roles. Issue count 3: 3 with skills inventory is incomplete. Systems/documents: headcount plan, vacancy report, skills inventory, attrition data and demand forecast sheet. Decision needed: ready, return, block, or escalate. Time pressure: before the daily cut-off.',
  1,
  '["HR & Workforce Services","Workforce Planning & Learning Operations","HR Business Partners & People Advisory Consultants; Workforce Planning Analysts & Consultants","HR Business Partner; HR Consultant; People Advisory Consultant; HR Specialist; Workforce Planning Analyst","IND-CAP-19","Workforce Gap Register","Functional","Technical","Behavioural","Cognitive","Evidence"]'::jsonb,
  '["Start with the live trigger: 29 records arrive, 17 have visible issues, and a stakeholder needs an answer before the daily cut-off.","Learner studies the actual data points: demand forecast, current headcount, capacity assumptions, gap calculation, risk notes, hiring/redeployment recommendation; then highlights missing fields, conflicts, late inputs, and owner gaps.","Teach the artifact logic: what each section means, which evidence is mandatory, what numbers must reconcile, and what the learner is allowed to decide at L2.","Learner completes the Workforce Gap Register using the case numbers, source references, exception labels, owner notes, and a clear ready/return/block/escalate recommendation.","Learner uses AI only for checklist prompts, concept reminders, and rubric self-checks. AI must not invent records, calculate unsupported numbers, approve decisions, or replace the learner''s judgement.","Learner reflects on what changed at L2: volume, exception complexity, stakeholder pressure, authority boundary, and evidence quality compared with the previous level."]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workforce Gap: Routine Execution: Data, Concepts and Artifact Evidence
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-092' LIMIT 1)
   AND title = 'Module 1: Workforce Gap Register Workplace Build' LIMIT 1),
  'Workforce Gap: Routine Execution: Data, Concepts and Artifact Evidence',
  'Learner confusion: Students may understand the HR term but may not know how to read 29 messy records, compare source fields, quantify exceptions, choose proceed/return/escalate, or write the evidence trail in simple reviewer language. Root-cause focus: Investigate whether the real cause is missing source data, wrong effective date, unclear owner, system mismatch, late submission, policy/control risk, or weak handoff evidence in headcount plan, vacancy report, skills inventory, attrition data and demand forecast sheet.',
  'Problem: A workforce planning analyst is handling 29 workforce gap register preparation records in headcount plan, vacancy report, skills inventory, attrition data and demand forecast sheet. The file is messy: 9 records have forecast demand changed, 5 have vacancy list has stale roles, 3 have skills inventory is incomplete, and some cases also show attrition risk not linked to team capacity. The team needs a clean routine handoff before the daily cut-off because downstream work cannot start until the artifact is usable. The learner must complete the standard workflow, update statuses, prepare the artifact, and send a clean handoff without needing step-by-step guidance, prepare a Workforce Gap Register, and clearly mark which items are ready, returned, blocked, or escalated. If handled poorly, hiring, redeployment, or training decisions may target the wrong workforce gap. Actuals: Volume: 29 records/cases. Issue count 1: 9 with forecast demand changed. Issue count 2: 5 with vacancy list has stale roles. Issue count 3: 3 with skills inventory is incomplete. Systems/documents: headcount plan, vacancy report, skills inventory, attrition data and demand forecast sheet. Decision needed: ready, return, block, or escalate. Time pressure: before the daily cut-off. Major concepts: workforce supply-demand gap - needed to complete and defend the Workforce Gap Register; headcount plan versus actuals - needed to complete and defend the Workforce Gap Register; vacancy aging - needed to complete and defend the Workforce Gap Register; skills inventory quality - needed to complete and defend the Workforce Gap Register; attrition risk signal - needed to complete and defend the Workforce Gap Register; capacity prioritization - needed to complete and defend the Workforce Gap Register; gap severity rating - needed to complete and defend the Workforce Gap Register; workforce register evidence - needed to complete and defend the Workforce Gap Register Concept-to-artifact link: These concepts are not theory-only. They tell the learner what to check inside the Workforce Gap Register: source data, missing fields, exception rules, owner notes, decision status, handoff logic, and reviewer evidence. Required data: To solve the artifact, learner needs: demand forecast, current headcount, capacity assumptions, gap calculation, risk notes, hiring/redeployment recommendation; system screenshots or exports from headcount plan, vacancy report, skills inventory, attrition data and demand forecast sheet; policy or checklist rule used; stakeholder request; deadline/cut-off; prior status if available; reviewer or owner name; evidence of any unresolved exception. Artifact structure: Workforce Gap Register must contain: case or employee/candidate/worker identifier; source document reference; required data fields (demand forecast, current headcount, capacity assumptions, gap calculation, risk notes, hiring/redeployment recommendation); missing or conflicting item log; numeric issue count; exception category; owner/action note; proceed/return/block/escalate status; reviewer handoff note; closure or follow-up date. How to read artifact: Read the artifact as the learner''s final workplace proof. First check the identifiers and source documents, then the required fields, then the issue count and exception category, then the decision status, and finally whether the handoff note gives a reviewer enough evidence to act. Evidence fields: Assess whether the Workforce Gap Register uses the right source data, includes all required fields, counts and labels the 17 issue records correctly, separates normal items from exceptions, gives a clear decision reason, respects the L2 authority boundary, and provides a usable reviewer handoff. AI coach boundary: AI can ask: Which source proves this field? Which 9 records are blocked? What is the decision reason? What evidence is still missing? AI can summarize checklist gaps and suggest clearer wording, but cannot create missing data, approve the case, override policy, or make the final HR/payroll/compliance decision. Traceability: Industry: HR & Workforce Services.|Domain: Workforce Planning & Learning Operations.|Role: HR Business Partner; HR Consultant; People Advisory Consultant; HR Specialist; Workforce Planning Analyst.|Capability_ID: IND-CAP-19.|Level: L2.|Course_ID: IND-S5-C-092.|Artifact: Workforce Gap Register.|Source Sheet: L2_COURSE_PATTERN.',
  1,
  '10 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MBA Human Resource Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-092' LIMIT 1),
  'MBA Human Resource Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PGDM Human Resource Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-092' LIMIT 1),
  'PGDM Human Resource Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BBA Business Analytics
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-092' LIMIT 1),
  'BBA Business Analytics',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BA Economics
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-092' LIMIT 1),
  'BA Economics',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Statistics
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-092' LIMIT 1),
  'B.Sc Statistics',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PGDM Workforce Planning and Analytics
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-092' LIMIT 1),
  'PGDM Workforce Planning and Analytics',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Workforce Scenario Action Handoff: Routine Execution
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Workforce Scenario Action Handoff: Routine Execution',
  'IND-S5-C-097',
  'Learner can complete routine execution with clean handoff for Translate Workforce Scenarios Into Accountable People-Action and produce a reviewer-ready Workforce Scenario Action Handoff Plan with clear evidence and handoff logic. Workplace scenario: A workforce planning analyst is handling 30 workforce scenario action handoff records in scenario model, people action tracker, redeployment list, hiring plan and learning plan. The file is messy: 6 records have scenario assumptions differ, 6 have cost impact not clear, 2 have redeployment owner missing, and some cases also show training action not linked to skills gap. The team needs a clean routine handoff before the daily cut-off because downstream work cannot start until the artifact is usable. The learner must complete the standard workflow, update statuses, prepare the artifact, and send a clean handoff without needing step-by-step guidance, prepare a Workforce Scenario Action Handoff Plan, and clearly mark which items are ready, returned, blocked, or escalated. If handled poorly, the selected scenario may not turn into practical hiring, redeployment, or learning actions. Artifact proof: Workforce Scenario Action Handoff Plan. Competency taxonomy: Functional; Technical; Behavioural; Cognitive; Evidence.',
  '10 hours',
  'Active',
  'HR & Workforce Services',
  'soft',
  '["Learner can complete routine execution with clean handoff for Translate Workforce Scenarios Into Accountable People-Action and produce a reviewer-ready Workforce Scenario Action Handoff Plan with clear evidence and handoff logic.","Create a reviewer-ready Workforce Scenario Action Handoff Plan.","Use source data to resolve the skill gap: Learner must convert workforce scenario action handoff knowledge into a usable Workforce Scenario Action Handoff Plan: check scenario assumptions, action owners, staffing/skill implications, priority decisions, identify missing or conflicting records, explain the level boundary, and create a reviewer-ready handoff.","Explain evidence and consequence through the Workforce Scenario Action Handoff Plan."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: Module 1: Workforce Scenario Action Handoff Plan Workplace Build
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-097' LIMIT 1),
  'Module 1: Workforce Scenario Action Handoff Plan Workplace Build',
  'Trigger: A workforce planning analyst receives 30 workforce scenario action handoff records in scenario model, people action tracker, redeployment list, hiring plan and learning plan; 6 show scenario assumptions differ, 6 show cost impact not clear, and 2 show redeployment owner missing. Pressure: The team needs a clean routine handoff before the daily cut-off because downstream work cannot start until the artifact is usable. Actuals: Volume: 30 records/cases. Issue count 1: 6 with scenario assumptions differ. Issue count 2: 6 with cost impact not clear. Issue count 3: 2 with redeployment owner missing. Systems/documents: scenario model, people action tracker, redeployment list, hiring plan and learning plan. Decision needed: ready, return, block, or escalate. Time pressure: before the daily cut-off.',
  1,
  '["HR & Workforce Services","HR & Workforce Services","HR Business Partners & People Advisory Consultants; Workforce Planning Analysts & Consultants","HR Business Partner; HR Consultant; People Advisory Consultant; HR Specialist; Workforce Planning Analyst","IND-CAP-20","Workforce Scenario Action Handoff Plan","Functional","Technical","Behavioural","Cognitive","Evidence"]'::jsonb,
  '["Start with the live trigger: 30 records arrive, 14 have visible issues, and a stakeholder needs an answer before the daily cut-off.","Learner studies the actual data points: scenario assumptions, action owners, staffing/skill implications, priority decisions, timeline, accountability tracker; then highlights missing fields, conflicts, late inputs, and owner gaps.","Teach the artifact logic: what each section means, which evidence is mandatory, what numbers must reconcile, and what the learner is allowed to decide at L2.","Learner completes the Workforce Scenario Action Handoff Plan using the case numbers, source references, exception labels, owner notes, and a clear ready/return/block/escalate recommendation.","Learner uses AI only for checklist prompts, concept reminders, and rubric self-checks. AI must not invent records, calculate unsupported numbers, approve decisions, or replace the learner''s judgement.","Learner reflects on what changed at L2: volume, exception complexity, stakeholder pressure, authority boundary, and evidence quality compared with the previous level."]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workforce Scenario Action Handoff: Routine Execution: Data, Concepts and Artifact Evidence
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-097' LIMIT 1)
   AND title = 'Module 1: Workforce Scenario Action Handoff Plan Workplace Build' LIMIT 1),
  'Workforce Scenario Action Handoff: Routine Execution: Data, Concepts and Artifact Evidence',
  'Learner confusion: Students may understand the HR term but may not know how to read 30 messy records, compare source fields, quantify exceptions, choose proceed/return/escalate, or write the evidence trail in simple reviewer language. Root-cause focus: Investigate whether the real cause is missing source data, wrong effective date, unclear owner, system mismatch, late submission, policy/control risk, or weak handoff evidence in scenario model, people action tracker, redeployment list, hiring plan and learning plan.',
  'Problem: A workforce planning analyst is handling 30 workforce scenario action handoff records in scenario model, people action tracker, redeployment list, hiring plan and learning plan. The file is messy: 6 records have scenario assumptions differ, 6 have cost impact not clear, 2 have redeployment owner missing, and some cases also show training action not linked to skills gap. The team needs a clean routine handoff before the daily cut-off because downstream work cannot start until the artifact is usable. The learner must complete the standard workflow, update statuses, prepare the artifact, and send a clean handoff without needing step-by-step guidance, prepare a Workforce Scenario Action Handoff Plan, and clearly mark which items are ready, returned, blocked, or escalated. If handled poorly, the selected scenario may not turn into practical hiring, redeployment, or learning actions. Actuals: Volume: 30 records/cases. Issue count 1: 6 with scenario assumptions differ. Issue count 2: 6 with cost impact not clear. Issue count 3: 2 with redeployment owner missing. Systems/documents: scenario model, people action tracker, redeployment list, hiring plan and learning plan. Decision needed: ready, return, block, or escalate. Time pressure: before the daily cut-off. Major concepts: workforce scenario comparison - needed to complete and defend the Workforce Scenario Action Handoff Plan; assumption validation - needed to complete and defend the Workforce Scenario Action Handoff Plan; people-action mapping - needed to complete and defend the Workforce Scenario Action Handoff Plan; cost and capacity impact - needed to complete and defend the Workforce Scenario Action Handoff Plan; redeployment logic - needed to complete and defend the Workforce Scenario Action Handoff Plan; learning action dependency - needed to complete and defend the Workforce Scenario Action Handoff Plan; handoff owner control - needed to complete and defend the Workforce Scenario Action Handoff Plan; scenario decision evidence - needed to complete and defend the Workforce Scenario Action Handoff Plan Concept-to-artifact link: These concepts are not theory-only. They tell the learner what to check inside the Workforce Scenario Action Handoff Plan: source data, missing fields, exception rules, owner notes, decision status, handoff logic, and reviewer evidence. Required data: To solve the artifact, learner needs: scenario assumptions, action owners, staffing/skill implications, priority decisions, timeline, accountability tracker; system screenshots or exports from scenario model, people action tracker, redeployment list, hiring plan and learning plan; policy or checklist rule used; stakeholder request; deadline/cut-off; prior status if available; reviewer or owner name; evidence of any unresolved exception. Artifact structure: Workforce Scenario Action Handoff Plan must contain: case or employee/candidate/worker identifier; source document reference; required data fields (scenario assumptions, action owners, staffing/skill implications, priority decisions, timeline, accountability tracker); missing or conflicting item log; numeric issue count; exception category; owner/action note; proceed/return/block/escalate status; reviewer handoff note; closure or follow-up date. How to read artifact: Read the artifact as the learner''s final workplace proof. First check the identifiers and source documents, then the required fields, then the issue count and exception category, then the decision status, and finally whether the handoff note gives a reviewer enough evidence to act. Evidence fields: Assess whether the Workforce Scenario Action Handoff Plan uses the right source data, includes all required fields, counts and labels the 14 issue records correctly, separates normal items from exceptions, gives a clear decision reason, respects the L2 authority boundary, and provides a usable reviewer handoff. AI coach boundary: AI can ask: Which source proves this field? Which 6 records are blocked? What is the decision reason? What evidence is still missing? AI can summarize checklist gaps and suggest clearer wording, but cannot create missing data, approve the case, override policy, or make the final HR/payroll/compliance decision. Traceability: Industry: HR & Workforce Services.|Domain: HR & Workforce Services.|Role: HR Business Partner; HR Consultant; People Advisory Consultant; HR Specialist; Workforce Planning Analyst.|Capability_ID: IND-CAP-20.|Level: L2.|Course_ID: IND-S5-C-097.|Artifact: Workforce Scenario Action Handoff Plan.|Source Sheet: L2_COURSE_PATTERN.',
  1,
  '10 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MBA Human Resource Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-097' LIMIT 1),
  'MBA Human Resource Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PGDM Human Resource Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-097' LIMIT 1),
  'PGDM Human Resource Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BBA Business Analytics
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-097' LIMIT 1),
  'BBA Business Analytics',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BA Economics
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-097' LIMIT 1),
  'BA Economics',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Statistics
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-097' LIMIT 1),
  'B.Sc Statistics',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PGDM Workforce Planning and Analytics
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-097' LIMIT 1),
  'PGDM Workforce Planning and Analytics',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Training Needs Analysis: Routine Execution
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Training Needs Analysis: Routine Execution',
  'IND-S5-C-102',
  'Learner can complete routine execution with clean handoff for Training Needs Analysis and produce a reviewer-ready Training Needs Analysis Brief with clear evidence and handoff logic. Workplace scenario: An L&D analyst is handling 31 training needs analysis records in performance data, manager skill-gap inputs, employee role list, LMS history and business priority notes. The file is messy: 7 records have manager inputs are broad, 4 have performance issues are mixed with training needs, 3 have LMS completion history is incomplete, and some cases also show priority roles are not ranked. The team needs a clean routine handoff before the daily cut-off because downstream work cannot start until the artifact is usable. The learner must complete the standard workflow, update statuses, prepare the artifact, and send a clean handoff without needing step-by-step guidance, prepare a Training Needs Analysis Brief, and clearly mark which items are ready, returned, blocked, or escalated. If handled poorly, training may be built for the wrong problem or miss the roles with highest need. Artifact proof: Training Needs Analysis Brief. Competency taxonomy: Functional; Technical; Behavioural; Cognitive; Evidence.',
  '10 hours',
  'Active',
  'Workforce Planning & Learning Operations',
  'technical',
  '["Learner can complete routine execution with clean handoff for Training Needs Analysis and produce a reviewer-ready Training Needs Analysis Brief with clear evidence and handoff logic.","Create a reviewer-ready Training Needs Analysis Brief.","Use source data to resolve the skill gap: Learner must convert training needs analysis knowledge into a usable Training Needs Analysis Brief: check performance/capability evidence, audience group, priority gap, learning objective, identify missing or conflicting records, explain the level boundary, and create a reviewer-ready handoff.","Explain evidence and consequence through the Training Needs Analysis Brief."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: Module 1: Training Needs Analysis Brief Workplace Build
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-102' LIMIT 1),
  'Module 1: Training Needs Analysis Brief Workplace Build',
  'Trigger: An L&D analyst receives 31 training needs analysis records in performance data, manager skill-gap inputs, employee role list, LMS history and business priority notes; 7 show manager inputs are broad, 4 show performance issues are mixed with training needs, and 3 show LMS completion history is incomplete. Pressure: The team needs a clean routine handoff before the daily cut-off because downstream work cannot start until the artifact is usable. Actuals: Volume: 31 records/cases. Issue count 1: 7 with manager inputs are broad. Issue count 2: 4 with performance issues are mixed with training needs. Issue count 3: 3 with LMS completion history is incomplete. Systems/documents: performance data, manager skill-gap inputs, employee role list, LMS history and business priority notes. Decision needed: ready, return, block, or escalate. Time pressure: before the daily cut-off.',
  1,
  '["HR & Workforce Services","Workforce Planning & Learning Operations","Learning & Instructional Design Specialists; Performance Management Specialists; Employee Engagement & Experience Consultants","Learning and Development Specialist; Instructional Designer; Training Needs Analyst; Performance Management Specialist; HR Specialist","IND-CAP-21","Training Needs Analysis Brief","Functional","Technical","Behavioural","Cognitive","Evidence"]'::jsonb,
  '["Start with the live trigger: 31 records arrive, 14 have visible issues, and a stakeholder needs an answer before the daily cut-off.","Learner studies the actual data points: performance/capability evidence, audience group, priority gap, learning objective, recommended intervention, success measure; then highlights missing fields, conflicts, late inputs, and owner gaps.","Teach the artifact logic: what each section means, which evidence is mandatory, what numbers must reconcile, and what the learner is allowed to decide at L2.","Learner completes the Training Needs Analysis Brief using the case numbers, source references, exception labels, owner notes, and a clear ready/return/block/escalate recommendation.","Learner uses AI only for checklist prompts, concept reminders, and rubric self-checks. AI must not invent records, calculate unsupported numbers, approve decisions, or replace the learner''s judgement.","Learner reflects on what changed at L2: volume, exception complexity, stakeholder pressure, authority boundary, and evidence quality compared with the previous level."]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Training Needs Analysis: Routine Execution: Data, Concepts and Artifact Evidence
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-102' LIMIT 1)
   AND title = 'Module 1: Training Needs Analysis Brief Workplace Build' LIMIT 1),
  'Training Needs Analysis: Routine Execution: Data, Concepts and Artifact Evidence',
  'Learner confusion: Students may understand the HR term but may not know how to read 31 messy records, compare source fields, quantify exceptions, choose proceed/return/escalate, or write the evidence trail in simple reviewer language. Root-cause focus: Investigate whether the real cause is missing source data, wrong effective date, unclear owner, system mismatch, late submission, policy/control risk, or weak handoff evidence in performance data, manager skill-gap inputs, employee role list, LMS history and business priority notes.',
  'Problem: An L&D analyst is handling 31 training needs analysis records in performance data, manager skill-gap inputs, employee role list, LMS history and business priority notes. The file is messy: 7 records have manager inputs are broad, 4 have performance issues are mixed with training needs, 3 have LMS completion history is incomplete, and some cases also show priority roles are not ranked. The team needs a clean routine handoff before the daily cut-off because downstream work cannot start until the artifact is usable. The learner must complete the standard workflow, update statuses, prepare the artifact, and send a clean handoff without needing step-by-step guidance, prepare a Training Needs Analysis Brief, and clearly mark which items are ready, returned, blocked, or escalated. If handled poorly, training may be built for the wrong problem or miss the roles with highest need. Actuals: Volume: 31 records/cases. Issue count 1: 7 with manager inputs are broad. Issue count 2: 4 with performance issues are mixed with training needs. Issue count 3: 3 with LMS completion history is incomplete. Systems/documents: performance data, manager skill-gap inputs, employee role list, LMS history and business priority notes. Decision needed: ready, return, block, or escalate. Time pressure: before the daily cut-off. Major concepts: training needs analysis - needed to complete and defend the Training Needs Analysis Brief; performance issue versus learning gap - needed to complete and defend the Training Needs Analysis Brief; role priority mapping - needed to complete and defend the Training Needs Analysis Brief; skills gap evidence - needed to complete and defend the Training Needs Analysis Brief; manager input validation - needed to complete and defend the Training Needs Analysis Brief; LMS history use - needed to complete and defend the Training Needs Analysis Brief; learning need ranking - needed to complete and defend the Training Needs Analysis Brief; TNA brief quality - needed to complete and defend the Training Needs Analysis Brief Concept-to-artifact link: These concepts are not theory-only. They tell the learner what to check inside the Training Needs Analysis Brief: source data, missing fields, exception rules, owner notes, decision status, handoff logic, and reviewer evidence. Required data: To solve the artifact, learner needs: performance/capability evidence, audience group, priority gap, learning objective, recommended intervention, success measure; system screenshots or exports from performance data, manager skill-gap inputs, employee role list, LMS history and business priority notes; policy or checklist rule used; stakeholder request; deadline/cut-off; prior status if available; reviewer or owner name; evidence of any unresolved exception. Artifact structure: Training Needs Analysis Brief must contain: case or employee/candidate/worker identifier; source document reference; required data fields (performance/capability evidence, audience group, priority gap, learning objective, recommended intervention, success measure); missing or conflicting item log; numeric issue count; exception category; owner/action note; proceed/return/block/escalate status; reviewer handoff note; closure or follow-up date. How to read artifact: Read the artifact as the learner''s final workplace proof. First check the identifiers and source documents, then the required fields, then the issue count and exception category, then the decision status, and finally whether the handoff note gives a reviewer enough evidence to act. Evidence fields: Assess whether the Training Needs Analysis Brief uses the right source data, includes all required fields, counts and labels the 14 issue records correctly, separates normal items from exceptions, gives a clear decision reason, respects the L2 authority boundary, and provides a usable reviewer handoff. AI coach boundary: AI can ask: Which source proves this field? Which 7 records are blocked? What is the decision reason? What evidence is still missing? AI can summarize checklist gaps and suggest clearer wording, but cannot create missing data, approve the case, override policy, or make the final HR/payroll/compliance decision. Traceability: Industry: HR & Workforce Services.|Domain: Workforce Planning & Learning Operations.|Role: Learning and Development Specialist; Instructional Designer; Training Needs Analyst; Performance Management Specialist; HR Specialist.|Capability_ID: IND-CAP-21.|Level: L2.|Course_ID: IND-S5-C-102.|Artifact: Training Needs Analysis Brief.|Source Sheet: L2_COURSE_PATTERN.',
  1,
  '10 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Ed / M.Ed
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-102' LIMIT 1),
  'B.Ed / M.Ed',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MA Education
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-102' LIMIT 1),
  'MA Education',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BBA Human Resource Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-102' LIMIT 1),
  'BBA Human Resource Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MBA Human Resource Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-102' LIMIT 1),
  'MBA Human Resource Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PG Diploma Instructional Design
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-102' LIMIT 1),
  'PG Diploma Instructional Design',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BCA / B.Sc Information Technology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-102' LIMIT 1),
  'BCA / B.Sc Information Technology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: LMS Program Setup QA: Routine Execution
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'LMS Program Setup QA: Routine Execution',
  'IND-S5-C-107',
  'Learner can complete routine execution with clean handoff for LMS Program Setup QA and produce a reviewer-ready LMS Program Setup QA Checklist with clear evidence and handoff logic. Workplace scenario: An L&D coordinator is handling 32 LMS program setup quality check records in LMS course shell, enrollment file, session calendar, learning objectives and completion rule settings. The file is messy: 8 records have learner group file has duplicates, 5 have completion rule not aligned to assessment, 2 have session date conflicts with calendar, and some cases also show course objective missing from the LMS description. The team needs a clean routine handoff before the daily cut-off because downstream work cannot start until the artifact is usable. The learner must complete the standard workflow, update statuses, prepare the artifact, and send a clean handoff without needing step-by-step guidance, prepare a LMS Program Setup QA Checklist, and clearly mark which items are ready, returned, blocked, or escalated. If handled poorly, learners may be enrolled incorrectly, completion may not track, or the program may launch with wrong settings. Artifact proof: LMS Program Setup QA Checklist. Competency taxonomy: Functional; Technical; Behavioural; Cognitive; Evidence.',
  '10 hours',
  'Active',
  'Workforce Planning & Learning Operations',
  'technical',
  '["Learner can complete routine execution with clean handoff for LMS Program Setup QA and produce a reviewer-ready LMS Program Setup QA Checklist with clear evidence and handoff logic.","Create a reviewer-ready LMS Program Setup QA Checklist.","Use source data to resolve the skill gap: Learner must convert LMS program setup quality check knowledge into a usable LMS Program Setup QA Checklist: check course setup fields, audience assignment, completion rules, notification settings, identify missing or conflicting records, explain the level boundary, and create a reviewer-ready handoff.","Explain evidence and consequence through the LMS Program Setup QA Checklist."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: Module 1: LMS Program Setup QA Checklist Workplace Build
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-107' LIMIT 1),
  'Module 1: LMS Program Setup QA Checklist Workplace Build',
  'Trigger: An L&D coordinator receives 32 LMS program setup quality check records in LMS course shell, enrollment file, session calendar, learning objectives and completion rule settings; 8 show learner group file has duplicates, 5 show completion rule not aligned to assessment, and 2 show session date conflicts with calendar. Pressure: The team needs a clean routine handoff before the daily cut-off because downstream work cannot start until the artifact is usable. Actuals: Volume: 32 records/cases. Issue count 1: 8 with learner group file has duplicates. Issue count 2: 5 with completion rule not aligned to assessment. Issue count 3: 2 with session date conflicts with calendar. Systems/documents: LMS course shell, enrollment file, session calendar, learning objectives and completion rule settings. Decision needed: ready, return, block, or escalate. Time pressure: before the daily cut-off.',
  1,
  '["HR & Workforce Services","Workforce Planning & Learning Operations","Learning & Instructional Design Specialists; Performance Management Specialists; Employee Engagement & Experience Consultants","Learning and Development Specialist; Instructional Designer; Training Needs Analyst; Performance Management Specialist; HR Specialist","IND-CAP-22","LMS Program Setup QA Checklist","Functional","Technical","Behavioural","Cognitive","Evidence"]'::jsonb,
  '["Start with the live trigger: 32 records arrive, 15 have visible issues, and a stakeholder needs an answer before the daily cut-off.","Learner studies the actual data points: course setup fields, audience assignment, completion rules, notification settings, test learner record, completion/export evidence; then highlights missing fields, conflicts, late inputs, and owner gaps.","Teach the artifact logic: what each section means, which evidence is mandatory, what numbers must reconcile, and what the learner is allowed to decide at L2.","Learner completes the LMS Program Setup QA Checklist using the case numbers, source references, exception labels, owner notes, and a clear ready/return/block/escalate recommendation.","Learner uses AI only for checklist prompts, concept reminders, and rubric self-checks. AI must not invent records, calculate unsupported numbers, approve decisions, or replace the learner''s judgement.","Learner reflects on what changed at L2: volume, exception complexity, stakeholder pressure, authority boundary, and evidence quality compared with the previous level."]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: LMS Program Setup QA: Routine Execution: Data, Concepts and Artifact Evidence
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-107' LIMIT 1)
   AND title = 'Module 1: LMS Program Setup QA Checklist Workplace Build' LIMIT 1),
  'LMS Program Setup QA: Routine Execution: Data, Concepts and Artifact Evidence',
  'Learner confusion: Students may understand the HR term but may not know how to read 32 messy records, compare source fields, quantify exceptions, choose proceed/return/escalate, or write the evidence trail in simple reviewer language. Root-cause focus: Investigate whether the real cause is missing source data, wrong effective date, unclear owner, system mismatch, late submission, policy/control risk, or weak handoff evidence in LMS course shell, enrollment file, session calendar, learning objectives and completion rule settings.',
  'Problem: An L&D coordinator is handling 32 LMS program setup quality check records in LMS course shell, enrollment file, session calendar, learning objectives and completion rule settings. The file is messy: 8 records have learner group file has duplicates, 5 have completion rule not aligned to assessment, 2 have session date conflicts with calendar, and some cases also show course objective missing from the LMS description. The team needs a clean routine handoff before the daily cut-off because downstream work cannot start until the artifact is usable. The learner must complete the standard workflow, update statuses, prepare the artifact, and send a clean handoff without needing step-by-step guidance, prepare a LMS Program Setup QA Checklist, and clearly mark which items are ready, returned, blocked, or escalated. If handled poorly, learners may be enrolled incorrectly, completion may not track, or the program may launch with wrong settings. Actuals: Volume: 32 records/cases. Issue count 1: 8 with learner group file has duplicates. Issue count 2: 5 with completion rule not aligned to assessment. Issue count 3: 2 with session date conflicts with calendar. Systems/documents: LMS course shell, enrollment file, session calendar, learning objectives and completion rule settings. Decision needed: ready, return, block, or escalate. Time pressure: before the daily cut-off. Major concepts: LMS program setup - needed to complete and defend the LMS Program Setup QA Checklist; enrollment file validation - needed to complete and defend the LMS Program Setup QA Checklist; completion rule logic - needed to complete and defend the LMS Program Setup QA Checklist; assessment alignment - needed to complete and defend the LMS Program Setup QA Checklist; session calendar control - needed to complete and defend the LMS Program Setup QA Checklist; learner group mapping - needed to complete and defend the LMS Program Setup QA Checklist; launch QA checklist - needed to complete and defend the LMS Program Setup QA Checklist; learning record accuracy - needed to complete and defend the LMS Program Setup QA Checklist Concept-to-artifact link: These concepts are not theory-only. They tell the learner what to check inside the LMS Program Setup QA Checklist: source data, missing fields, exception rules, owner notes, decision status, handoff logic, and reviewer evidence. Required data: To solve the artifact, learner needs: course setup fields, audience assignment, completion rules, notification settings, test learner record, completion/export evidence; system screenshots or exports from LMS course shell, enrollment file, session calendar, learning objectives and completion rule settings; policy or checklist rule used; stakeholder request; deadline/cut-off; prior status if available; reviewer or owner name; evidence of any unresolved exception. Artifact structure: LMS Program Setup QA Checklist must contain: case or employee/candidate/worker identifier; source document reference; required data fields (course setup fields, audience assignment, completion rules, notification settings, test learner record, completion/export evidence); missing or conflicting item log; numeric issue count; exception category; owner/action note; proceed/return/block/escalate status; reviewer handoff note; closure or follow-up date. How to read artifact: Read the artifact as the learner''s final workplace proof. First check the identifiers and source documents, then the required fields, then the issue count and exception category, then the decision status, and finally whether the handoff note gives a reviewer enough evidence to act. Evidence fields: Assess whether the LMS Program Setup QA Checklist uses the right source data, includes all required fields, counts and labels the 15 issue records correctly, separates normal items from exceptions, gives a clear decision reason, respects the L2 authority boundary, and provides a usable reviewer handoff. AI coach boundary: AI can ask: Which source proves this field? Which 8 records are blocked? What is the decision reason? What evidence is still missing? AI can summarize checklist gaps and suggest clearer wording, but cannot create missing data, approve the case, override policy, or make the final HR/payroll/compliance decision. Traceability: Industry: HR & Workforce Services.|Domain: Workforce Planning & Learning Operations.|Role: Learning and Development Specialist; Instructional Designer; Training Needs Analyst; Performance Management Specialist; HR Specialist.|Capability_ID: IND-CAP-22.|Level: L2.|Course_ID: IND-S5-C-107.|Artifact: LMS Program Setup QA Checklist.|Source Sheet: L2_COURSE_PATTERN.',
  1,
  '10 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Ed / M.Ed
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-107' LIMIT 1),
  'B.Ed / M.Ed',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MA Education
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-107' LIMIT 1),
  'MA Education',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BBA Human Resource Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-107' LIMIT 1),
  'BBA Human Resource Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MBA Human Resource Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-107' LIMIT 1),
  'MBA Human Resource Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PG Diploma Instructional Design
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-107' LIMIT 1),
  'PG Diploma Instructional Design',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BCA / B.Sc Information Technology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-107' LIMIT 1),
  'BCA / B.Sc Information Technology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Performance Cycle Readiness: Routine Execution
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Performance Cycle Readiness: Routine Execution',
  'IND-S5-C-112',
  'Learner can complete routine execution with clean handoff for Performance Cycle Readiness and produce a reviewer-ready Performance Cycle Readiness Tracker with clear evidence and handoff logic. Workplace scenario: A performance operations coordinator is handling 33 performance cycle readiness tracking records in performance management system, employee eligibility file, manager hierarchy list and cycle calendar. The file is messy: 9 records have eligible employee list differs from HRIS, 6 have manager hierarchy not updated, 3 have goal-setting window is close, and some cases also show calibration owner missing. The team needs a clean routine handoff before the daily cut-off because downstream work cannot start until the artifact is usable. The learner must complete the standard workflow, update statuses, prepare the artifact, and send a clean handoff without needing step-by-step guidance, prepare a Performance Cycle Readiness Tracker, and clearly mark which items are ready, returned, blocked, or escalated. If handled poorly, employees may be excluded, managers may not see the right team, or the cycle may launch with readiness gaps. Artifact proof: Performance Cycle Readiness Tracker. Competency taxonomy: Functional; Technical; Behavioural; Domain; Evidence.',
  '10 hours',
  'Active',
  'Performance & Engagement Operations',
  'soft',
  '["Learner can complete routine execution with clean handoff for Performance Cycle Readiness and produce a reviewer-ready Performance Cycle Readiness Tracker with clear evidence and handoff logic.","Create a reviewer-ready Performance Cycle Readiness Tracker.","Use source data to resolve the skill gap: Learner must convert performance cycle readiness tracking knowledge into a usable Performance Cycle Readiness Tracker: check cycle calendar, review population, form/status checks, manager reminders, identify missing or conflicting records, explain the level boundary, and create a reviewer-ready handoff.","Explain evidence and consequence through the Performance Cycle Readiness Tracker."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: Module 1: Performance Cycle Readiness Tracker Workplace Build
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-112' LIMIT 1),
  'Module 1: Performance Cycle Readiness Tracker Workplace Build',
  'Trigger: A performance operations coordinator receives 33 performance cycle readiness tracking records in performance management system, employee eligibility file, manager hierarchy list and cycle calendar; 9 show eligible employee list differs from HRIS, 6 show manager hierarchy not updated, and 3 show goal-setting window is close. Pressure: The team needs a clean routine handoff before the daily cut-off because downstream work cannot start until the artifact is usable. Actuals: Volume: 33 records/cases. Issue count 1: 9 with eligible employee list differs from HRIS. Issue count 2: 6 with manager hierarchy not updated. Issue count 3: 3 with goal-setting window is close. Systems/documents: performance management system, employee eligibility file, manager hierarchy list and cycle calendar. Decision needed: ready, return, block, or escalate. Time pressure: before the daily cut-off.',
  1,
  '["HR & Workforce Services","Performance & Engagement Operations","Learning & Instructional Design Specialists; Performance Management Specialists; Employee Engagement & Experience Consultants","Learning and Development Specialist; Instructional Designer; Training Needs Analyst; Performance Management Specialist; HR Specialist","IND-CAP-23","Performance Cycle Readiness Tracker","Functional","Technical","Behavioural","Domain","Evidence"]'::jsonb,
  '["Start with the live trigger: 33 records arrive, 18 have visible issues, and a stakeholder needs an answer before the daily cut-off.","Learner studies the actual data points: cycle calendar, review population, form/status checks, manager reminders, completion exceptions, closure evidence; then highlights missing fields, conflicts, late inputs, and owner gaps.","Teach the artifact logic: what each section means, which evidence is mandatory, what numbers must reconcile, and what the learner is allowed to decide at L2.","Learner completes the Performance Cycle Readiness Tracker using the case numbers, source references, exception labels, owner notes, and a clear ready/return/block/escalate recommendation.","Learner uses AI only for checklist prompts, concept reminders, and rubric self-checks. AI must not invent records, calculate unsupported numbers, approve decisions, or replace the learner''s judgement.","Learner reflects on what changed at L2: volume, exception complexity, stakeholder pressure, authority boundary, and evidence quality compared with the previous level."]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Performance Cycle Readiness: Routine Execution: Data, Concepts and Artifact Evidence
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-112' LIMIT 1)
   AND title = 'Module 1: Performance Cycle Readiness Tracker Workplace Build' LIMIT 1),
  'Performance Cycle Readiness: Routine Execution: Data, Concepts and Artifact Evidence',
  'Learner confusion: Students may understand the HR term but may not know how to read 33 messy records, compare source fields, quantify exceptions, choose proceed/return/escalate, or write the evidence trail in simple reviewer language. Root-cause focus: Investigate whether the real cause is missing source data, wrong effective date, unclear owner, system mismatch, late submission, policy/control risk, or weak handoff evidence in performance management system, employee eligibility file, manager hierarchy list and cycle calendar.',
  'Problem: A performance operations coordinator is handling 33 performance cycle readiness tracking records in performance management system, employee eligibility file, manager hierarchy list and cycle calendar. The file is messy: 9 records have eligible employee list differs from HRIS, 6 have manager hierarchy not updated, 3 have goal-setting window is close, and some cases also show calibration owner missing. The team needs a clean routine handoff before the daily cut-off because downstream work cannot start until the artifact is usable. The learner must complete the standard workflow, update statuses, prepare the artifact, and send a clean handoff without needing step-by-step guidance, prepare a Performance Cycle Readiness Tracker, and clearly mark which items are ready, returned, blocked, or escalated. If handled poorly, employees may be excluded, managers may not see the right team, or the cycle may launch with readiness gaps. Actuals: Volume: 33 records/cases. Issue count 1: 9 with eligible employee list differs from HRIS. Issue count 2: 6 with manager hierarchy not updated. Issue count 3: 3 with goal-setting window is close. Systems/documents: performance management system, employee eligibility file, manager hierarchy list and cycle calendar. Decision needed: ready, return, block, or escalate. Time pressure: before the daily cut-off. Major concepts: performance cycle readiness - needed to complete and defend the Performance Cycle Readiness Tracker; eligibility rule - needed to complete and defend the Performance Cycle Readiness Tracker; manager hierarchy dependency - needed to complete and defend the Performance Cycle Readiness Tracker; goal-setting window - needed to complete and defend the Performance Cycle Readiness Tracker; calibration ownership - needed to complete and defend the Performance Cycle Readiness Tracker; cycle communication readiness - needed to complete and defend the Performance Cycle Readiness Tracker; readiness tracker status - needed to complete and defend the Performance Cycle Readiness Tracker; launch risk control - needed to complete and defend the Performance Cycle Readiness Tracker Concept-to-artifact link: These concepts are not theory-only. They tell the learner what to check inside the Performance Cycle Readiness Tracker: source data, missing fields, exception rules, owner notes, decision status, handoff logic, and reviewer evidence. Required data: To solve the artifact, learner needs: cycle calendar, review population, form/status checks, manager reminders, completion exceptions, closure evidence; system screenshots or exports from performance management system, employee eligibility file, manager hierarchy list and cycle calendar; policy or checklist rule used; stakeholder request; deadline/cut-off; prior status if available; reviewer or owner name; evidence of any unresolved exception. Artifact structure: Performance Cycle Readiness Tracker must contain: case or employee/candidate/worker identifier; source document reference; required data fields (cycle calendar, review population, form/status checks, manager reminders, completion exceptions, closure evidence); missing or conflicting item log; numeric issue count; exception category; owner/action note; proceed/return/block/escalate status; reviewer handoff note; closure or follow-up date. How to read artifact: Read the artifact as the learner''s final workplace proof. First check the identifiers and source documents, then the required fields, then the issue count and exception category, then the decision status, and finally whether the handoff note gives a reviewer enough evidence to act. Evidence fields: Assess whether the Performance Cycle Readiness Tracker uses the right source data, includes all required fields, counts and labels the 18 issue records correctly, separates normal items from exceptions, gives a clear decision reason, respects the L2 authority boundary, and provides a usable reviewer handoff. AI coach boundary: AI can ask: Which source proves this field? Which 9 records are blocked? What is the decision reason? What evidence is still missing? AI can summarize checklist gaps and suggest clearer wording, but cannot create missing data, approve the case, override policy, or make the final HR/payroll/compliance decision. Traceability: Industry: HR & Workforce Services.|Domain: Performance & Engagement Operations.|Role: Learning and Development Specialist; Instructional Designer; Training Needs Analyst; Performance Management Specialist; HR Specialist.|Capability_ID: IND-CAP-23.|Level: L2.|Course_ID: IND-S5-C-112.|Artifact: Performance Cycle Readiness Tracker.|Source Sheet: L2_COURSE_PATTERN.',
  1,
  '10 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BBA Human Resource Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-112' LIMIT 1),
  'BBA Human Resource Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MBA Human Resource Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-112' LIMIT 1),
  'MBA Human Resource Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MA Organisational Psychology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-112' LIMIT 1),
  'MA Organisational Psychology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MSW Human Resource Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-112' LIMIT 1),
  'MSW Human Resource Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BBA Business Analytics
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-112' LIMIT 1),
  'BBA Business Analytics',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Engagement Survey Action Follow-up: Routine Execution
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Engagement Survey Action Follow-up: Routine Execution',
  'IND-S5-C-117',
  'Learner can complete routine execution with clean handoff for Engagement Survey Action Follow-up and produce a reviewer-ready Engagement Survey Action Follow-up Log with clear evidence and handoff logic. Workplace scenario: An engagement operations analyst is handling 34 engagement survey action follow-up records in engagement survey dashboard, team action plan tracker, manager comments and follow-up status log. The file is messy: 6 records have low-score themes not linked to actions, 4 have manager owner missing, 2 have action due date overdue, and some cases also show employee comment theme not summarized. The team needs a clean routine handoff before the daily cut-off because downstream work cannot start until the artifact is usable. The learner must complete the standard workflow, update statuses, prepare the artifact, and send a clean handoff without needing step-by-step guidance, prepare a Engagement Survey Action Follow-up Log, and clearly mark which items are ready, returned, blocked, or escalated. If handled poorly, employees may lose trust in the survey process and repeated issues may remain unresolved. Artifact proof: Engagement Survey Action Follow-up Log. Competency taxonomy: Functional; Technical; Behavioural; Cognitive; Evidence.',
  '10 hours',
  'Active',
  'Performance & Engagement Operations',
  'soft',
  '["Learner can complete routine execution with clean handoff for Engagement Survey Action Follow-up and produce a reviewer-ready Engagement Survey Action Follow-up Log with clear evidence and handoff logic.","Create a reviewer-ready Engagement Survey Action Follow-up Log.","Use source data to resolve the skill gap: Learner must convert engagement survey action follow-up knowledge into a usable Engagement Survey Action Follow-up Log: check survey insight, team/theme priority, manager action, owner/date, identify missing or conflicting records, explain the level boundary, and create a reviewer-ready handoff.","Explain evidence and consequence through the Engagement Survey Action Follow-up Log."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: Module 1: Engagement Survey Action Follow-up Log Workplace Build
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-117' LIMIT 1),
  'Module 1: Engagement Survey Action Follow-up Log Workplace Build',
  'Trigger: An engagement operations analyst receives 34 engagement survey action follow-up records in engagement survey dashboard, team action plan tracker, manager comments and follow-up status log; 6 show low-score themes not linked to actions, 4 show manager owner missing, and 2 show action due date overdue. Pressure: The team needs a clean routine handoff before the daily cut-off because downstream work cannot start until the artifact is usable. Actuals: Volume: 34 records/cases. Issue count 1: 6 with low-score themes not linked to actions. Issue count 2: 4 with manager owner missing. Issue count 3: 2 with action due date overdue. Systems/documents: engagement survey dashboard, team action plan tracker, manager comments and follow-up status log. Decision needed: ready, return, block, or escalate. Time pressure: before the daily cut-off.',
  1,
  '["HR & Workforce Services","Performance & Engagement Operations","Learning & Instructional Design Specialists; Performance Management Specialists; Employee Engagement & Experience Consultants","Learning and Development Specialist; Instructional Designer; Training Needs Analyst; Performance Management Specialist; HR Specialist","IND-CAP-24","Engagement Survey Action Follow-up Log","Functional","Technical","Behavioural","Cognitive","Evidence"]'::jsonb,
  '["Start with the live trigger: 34 records arrive, 12 have visible issues, and a stakeholder needs an answer before the daily cut-off.","Learner studies the actual data points: survey insight, team/theme priority, manager action, owner/date, employee feedback signal, progress and closure evidence; then highlights missing fields, conflicts, late inputs, and owner gaps.","Teach the artifact logic: what each section means, which evidence is mandatory, what numbers must reconcile, and what the learner is allowed to decide at L2.","Learner completes the Engagement Survey Action Follow-up Log using the case numbers, source references, exception labels, owner notes, and a clear ready/return/block/escalate recommendation.","Learner uses AI only for checklist prompts, concept reminders, and rubric self-checks. AI must not invent records, calculate unsupported numbers, approve decisions, or replace the learner''s judgement.","Learner reflects on what changed at L2: volume, exception complexity, stakeholder pressure, authority boundary, and evidence quality compared with the previous level."]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Engagement Survey Action Follow-up: Routine Execution: Data, Concepts and Artifact Evidence
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-117' LIMIT 1)
   AND title = 'Module 1: Engagement Survey Action Follow-up Log Workplace Build' LIMIT 1),
  'Engagement Survey Action Follow-up: Routine Execution: Data, Concepts and Artifact Evidence',
  'Learner confusion: Students may understand the HR term but may not know how to read 34 messy records, compare source fields, quantify exceptions, choose proceed/return/escalate, or write the evidence trail in simple reviewer language. Root-cause focus: Investigate whether the real cause is missing source data, wrong effective date, unclear owner, system mismatch, late submission, policy/control risk, or weak handoff evidence in engagement survey dashboard, team action plan tracker, manager comments and follow-up status log.',
  'Problem: An engagement operations analyst is handling 34 engagement survey action follow-up records in engagement survey dashboard, team action plan tracker, manager comments and follow-up status log. The file is messy: 6 records have low-score themes not linked to actions, 4 have manager owner missing, 2 have action due date overdue, and some cases also show employee comment theme not summarized. The team needs a clean routine handoff before the daily cut-off because downstream work cannot start until the artifact is usable. The learner must complete the standard workflow, update statuses, prepare the artifact, and send a clean handoff without needing step-by-step guidance, prepare a Engagement Survey Action Follow-up Log, and clearly mark which items are ready, returned, blocked, or escalated. If handled poorly, employees may lose trust in the survey process and repeated issues may remain unresolved. Actuals: Volume: 34 records/cases. Issue count 1: 6 with low-score themes not linked to actions. Issue count 2: 4 with manager owner missing. Issue count 3: 2 with action due date overdue. Systems/documents: engagement survey dashboard, team action plan tracker, manager comments and follow-up status log. Decision needed: ready, return, block, or escalate. Time pressure: before the daily cut-off. Major concepts: engagement survey interpretation - needed to complete and defend the Engagement Survey Action Follow-up Log; theme-to-action mapping - needed to complete and defend the Engagement Survey Action Follow-up Log; manager action ownership - needed to complete and defend the Engagement Survey Action Follow-up Log; due-date follow-up - needed to complete and defend the Engagement Survey Action Follow-up Log; employee comment summarization - needed to complete and defend the Engagement Survey Action Follow-up Log; action status evidence - needed to complete and defend the Engagement Survey Action Follow-up Log; trust and confidentiality boundary - needed to complete and defend the Engagement Survey Action Follow-up Log; follow-up log quality - needed to complete and defend the Engagement Survey Action Follow-up Log Concept-to-artifact link: These concepts are not theory-only. They tell the learner what to check inside the Engagement Survey Action Follow-up Log: source data, missing fields, exception rules, owner notes, decision status, handoff logic, and reviewer evidence. Required data: To solve the artifact, learner needs: survey insight, team/theme priority, manager action, owner/date, employee feedback signal, progress and closure evidence; system screenshots or exports from engagement survey dashboard, team action plan tracker, manager comments and follow-up status log; policy or checklist rule used; stakeholder request; deadline/cut-off; prior status if available; reviewer or owner name; evidence of any unresolved exception. Artifact structure: Engagement Survey Action Follow-up Log must contain: case or employee/candidate/worker identifier; source document reference; required data fields (survey insight, team/theme priority, manager action, owner/date, employee feedback signal, progress and closure evidence); missing or conflicting item log; numeric issue count; exception category; owner/action note; proceed/return/block/escalate status; reviewer handoff note; closure or follow-up date. How to read artifact: Read the artifact as the learner''s final workplace proof. First check the identifiers and source documents, then the required fields, then the issue count and exception category, then the decision status, and finally whether the handoff note gives a reviewer enough evidence to act. Evidence fields: Assess whether the Engagement Survey Action Follow-up Log uses the right source data, includes all required fields, counts and labels the 12 issue records correctly, separates normal items from exceptions, gives a clear decision reason, respects the L2 authority boundary, and provides a usable reviewer handoff. AI coach boundary: AI can ask: Which source proves this field? Which 6 records are blocked? What is the decision reason? What evidence is still missing? AI can summarize checklist gaps and suggest clearer wording, but cannot create missing data, approve the case, override policy, or make the final HR/payroll/compliance decision. Traceability: Industry: HR & Workforce Services.|Domain: Performance & Engagement Operations.|Role: Learning and Development Specialist; Instructional Designer; Training Needs Analyst; Performance Management Specialist; HR Specialist.|Capability_ID: IND-CAP-24.|Level: L2.|Course_ID: IND-S5-C-117.|Artifact: Engagement Survey Action Follow-up Log.|Source Sheet: L2_COURSE_PATTERN.',
  1,
  '10 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BBA Human Resource Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-117' LIMIT 1),
  'BBA Human Resource Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MBA Human Resource Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-117' LIMIT 1),
  'MBA Human Resource Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MA Organisational Psychology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-117' LIMIT 1),
  'MA Organisational Psychology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MSW Human Resource Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-117' LIMIT 1),
  'MSW Human Resource Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BBA Business Analytics
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-117' LIMIT 1),
  'BBA Business Analytics',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Grievance Case Resolution: Routine Execution
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Grievance Case Resolution: Routine Execution',
  'IND-S5-C-122',
  'Learner can complete routine execution with clean handoff for Employee Grievance Handling and produce a reviewer-ready Grievance Case Resolution File with clear evidence and handoff logic. Workplace scenario: An employee relations specialist is handling 35 employee grievance resolution file preparation records in grievance intake form, employee statement, manager response, policy guide and ER case tracker. The file is messy: 7 records have dates in statements do not match, 5 have retaliation concern is hinted but not classified, 3 have manager response lacks evidence, and some cases also show closure expectation is unclear. The team needs a clean routine handoff before the daily cut-off because downstream work cannot start until the artifact is usable. The learner must complete the standard workflow, update statuses, prepare the artifact, and send a clean handoff without needing step-by-step guidance, prepare a Grievance Case Resolution File, and clearly mark which items are ready, returned, blocked, or escalated. If handled poorly, the grievance may be mishandled, escalation risk may be missed, or the closure note may be challenged. Artifact proof: Grievance Case Resolution File. Competency taxonomy: Functional; Technical; Behavioural; Domain; Evidence.',
  '10 hours',
  'Active',
  'Employee Relations & Workplace Investigations',
  'soft',
  '["Learner can complete routine execution with clean handoff for Employee Grievance Handling and produce a reviewer-ready Grievance Case Resolution File with clear evidence and handoff logic.","Create a reviewer-ready Grievance Case Resolution File.","Use source data to resolve the skill gap: Learner must convert employee grievance resolution file preparation knowledge into a usable Grievance Case Resolution File: check complaint intake, severity classification, retaliation/sensitivity risk check, policy evidence, identify missing or conflicting records, explain the level boundary, and create a reviewer-ready handoff.","Explain evidence and consequence through the Grievance Case Resolution File."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: Module 1: Grievance Case Resolution File Workplace Build
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-122' LIMIT 1),
  'Module 1: Grievance Case Resolution File Workplace Build',
  'Trigger: An employee relations specialist receives 35 employee grievance resolution file preparation records in grievance intake form, employee statement, manager response, policy guide and ER case tracker; 7 show dates in statements do not match, 5 show retaliation concern is hinted but not classified, and 3 show manager response lacks evidence. Pressure: The team needs a clean routine handoff before the daily cut-off because downstream work cannot start until the artifact is usable. Actuals: Volume: 35 records/cases. Issue count 1: 7 with dates in statements do not match. Issue count 2: 5 with retaliation concern is hinted but not classified. Issue count 3: 3 with manager response lacks evidence. Systems/documents: grievance intake form, employee statement, manager response, policy guide and ER case tracker. Decision needed: ready, return, block, or escalate. Time pressure: before the daily cut-off.',
  1,
  '["HR & Workforce Services","Employee Relations & Workplace Investigations","Employee Relations & Grievance Specialists; Workplace Investigation & Screening Risk Specialists; Offboarding, Transition & Outplacement Specialists","Employee Relations Specialist; Labor Relations Specialist; Grievance Officer; HR Specialist; Workplace Investigator","IND-CAP-25","Grievance Case Resolution File","Functional","Technical","Behavioural","Domain","Evidence"]'::jsonb,
  '["Start with the live trigger: 35 records arrive, 15 have visible issues, and a stakeholder needs an answer before the daily cut-off.","Learner studies the actual data points: complaint intake, severity classification, retaliation/sensitivity risk check, policy evidence, manager/employee response notes, closure outcome and follow-up control; then highlights missing fields, conflicts, late inputs, and owner gaps.","Teach the artifact logic: what each section means, which evidence is mandatory, what numbers must reconcile, and what the learner is allowed to decide at L2.","Learner completes the Grievance Case Resolution File using the case numbers, source references, exception labels, owner notes, and a clear ready/return/block/escalate recommendation.","Learner uses AI only for checklist prompts, concept reminders, and rubric self-checks. AI must not invent records, calculate unsupported numbers, approve decisions, or replace the learner''s judgement.","Learner reflects on what changed at L2: volume, exception complexity, stakeholder pressure, authority boundary, and evidence quality compared with the previous level."]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Grievance Case Resolution: Routine Execution: Data, Concepts and Artifact Evidence
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-122' LIMIT 1)
   AND title = 'Module 1: Grievance Case Resolution File Workplace Build' LIMIT 1),
  'Grievance Case Resolution: Routine Execution: Data, Concepts and Artifact Evidence',
  'Learner confusion: Students may understand the HR term but may not know how to read 35 messy records, compare source fields, quantify exceptions, choose proceed/return/escalate, or write the evidence trail in simple reviewer language. Root-cause focus: Investigate whether the real cause is missing source data, wrong effective date, unclear owner, system mismatch, late submission, policy/control risk, or weak handoff evidence in grievance intake form, employee statement, manager response, policy guide and ER case tracker.',
  'Problem: An employee relations specialist is handling 35 employee grievance resolution file preparation records in grievance intake form, employee statement, manager response, policy guide and ER case tracker. The file is messy: 7 records have dates in statements do not match, 5 have retaliation concern is hinted but not classified, 3 have manager response lacks evidence, and some cases also show closure expectation is unclear. The team needs a clean routine handoff before the daily cut-off because downstream work cannot start until the artifact is usable. The learner must complete the standard workflow, update statuses, prepare the artifact, and send a clean handoff without needing step-by-step guidance, prepare a Grievance Case Resolution File, and clearly mark which items are ready, returned, blocked, or escalated. If handled poorly, the grievance may be mishandled, escalation risk may be missed, or the closure note may be challenged. Actuals: Volume: 35 records/cases. Issue count 1: 7 with dates in statements do not match. Issue count 2: 5 with retaliation concern is hinted but not classified. Issue count 3: 3 with manager response lacks evidence. Systems/documents: grievance intake form, employee statement, manager response, policy guide and ER case tracker. Decision needed: ready, return, block, or escalate. Time pressure: before the daily cut-off. Major concepts: grievance intake classification - needed to complete and defend the Grievance Case Resolution File; severity rating - needed to complete and defend the Grievance Case Resolution File; retaliation risk signal - needed to complete and defend the Grievance Case Resolution File; statement evidence review - needed to complete and defend the Grievance Case Resolution File; manager response check - needed to complete and defend the Grievance Case Resolution File; policy route selection - needed to complete and defend the Grievance Case Resolution File; case closure note - needed to complete and defend the Grievance Case Resolution File; confidential ER evidence control - needed to complete and defend the Grievance Case Resolution File Concept-to-artifact link: These concepts are not theory-only. They tell the learner what to check inside the Grievance Case Resolution File: source data, missing fields, exception rules, owner notes, decision status, handoff logic, and reviewer evidence. Required data: To solve the artifact, learner needs: complaint intake, severity classification, retaliation/sensitivity risk check, policy evidence, manager/employee response notes, closure outcome and follow-up control; system screenshots or exports from grievance intake form, employee statement, manager response, policy guide and ER case tracker; policy or checklist rule used; stakeholder request; deadline/cut-off; prior status if available; reviewer or owner name; evidence of any unresolved exception. Artifact structure: Grievance Case Resolution File must contain: case or employee/candidate/worker identifier; source document reference; required data fields (complaint intake, severity classification, retaliation/sensitivity risk check, policy evidence, manager/employee response notes, closure outcome and follow-up control); missing or conflicting item log; numeric issue count; exception category; owner/action note; proceed/return/block/escalate status; reviewer handoff note; closure or follow-up date. How to read artifact: Read the artifact as the learner''s final workplace proof. First check the identifiers and source documents, then the required fields, then the issue count and exception category, then the decision status, and finally whether the handoff note gives a reviewer enough evidence to act. Evidence fields: Assess whether the Grievance Case Resolution File uses the right source data, includes all required fields, counts and labels the 15 issue records correctly, separates normal items from exceptions, gives a clear decision reason, respects the L2 authority boundary, and provides a usable reviewer handoff. AI coach boundary: AI can ask: Which source proves this field? Which 7 records are blocked? What is the decision reason? What evidence is still missing? AI can summarize checklist gaps and suggest clearer wording, but cannot create missing data, approve the case, override policy, or make the final HR/payroll/compliance decision. Traceability: Industry: HR & Workforce Services.|Domain: Employee Relations & Workplace Investigations.|Role: Employee Relations Specialist; Labor Relations Specialist; Grievance Officer; HR Specialist; Workplace Investigator.|Capability_ID: IND-CAP-25.|Level: L2.|Course_ID: IND-S5-C-122.|Artifact: Grievance Case Resolution File.|Source Sheet: L2_COURSE_PATTERN.',
  1,
  '10 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: LLB / BA LLB Labour and Employment Law
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-122' LIMIT 1),
  'LLB / BA LLB Labour and Employment Law',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MBA Human Resource Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-122' LIMIT 1),
  'MBA Human Resource Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MSW Human Resource Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-122' LIMIT 1),
  'MSW Human Resource Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MA Industrial Relations
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-122' LIMIT 1),
  'MA Industrial Relations',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BA Psychology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-122' LIMIT 1),
  'BA Psychology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Workplace Investigation Evidence Control: Routine Execution
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Workplace Investigation Evidence Control: Routine Execution',
  'IND-S5-C-127',
  'Learner can complete routine execution with clean handoff for Workplace Investigation Evidence Control and produce a reviewer-ready Workplace Investigation Evidence Control Log with clear evidence and handoff logic. Workplace scenario: A workplace investigator is handling 36 workplace investigation evidence control records in investigation case file, allegation summary, witness log, document evidence folder and corrective action tracker. The file is messy: 8 records have allegation scope is broad, 6 have witness notes conflict, 2 have evidence files are not dated, and some cases also show corrective action owner not recorded. The team needs a clean routine handoff before the daily cut-off because downstream work cannot start until the artifact is usable. The learner must complete the standard workflow, update statuses, prepare the artifact, and send a clean handoff without needing step-by-step guidance, prepare a Workplace Investigation Evidence Control Log, and clearly mark which items are ready, returned, blocked, or escalated. If handled poorly, the investigation may lose credibility, miss key evidence, or fail to support corrective action. Artifact proof: Workplace Investigation Evidence Control Log. Competency taxonomy: Functional; Technical; Behavioural; Domain; Evidence.',
  '10 hours',
  'Active',
  'Employee Relations & Workplace Investigations',
  'soft',
  '["Learner can complete routine execution with clean handoff for Workplace Investigation Evidence Control and produce a reviewer-ready Workplace Investigation Evidence Control Log with clear evidence and handoff logic.","Create a reviewer-ready Workplace Investigation Evidence Control Log.","Use source data to resolve the skill gap: Learner must convert workplace investigation evidence control knowledge into a usable Workplace Investigation Evidence Control Log: check allegation framing, witness/evidence register, chronology, confidentiality controls, identify missing or conflicting records, explain the level boundary, and create a reviewer-ready handoff.","Explain evidence and consequence through the Workplace Investigation Evidence Control Log."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: Module 1: Workplace Investigation Evidence Control Log Workplace Build
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-127' LIMIT 1),
  'Module 1: Workplace Investigation Evidence Control Log Workplace Build',
  'Trigger: A workplace investigator receives 36 workplace investigation evidence control records in investigation case file, allegation summary, witness log, document evidence folder and corrective action tracker; 8 show allegation scope is broad, 6 show witness notes conflict, and 2 show evidence files are not dated. Pressure: The team needs a clean routine handoff before the daily cut-off because downstream work cannot start until the artifact is usable. Actuals: Volume: 36 records/cases. Issue count 1: 8 with allegation scope is broad. Issue count 2: 6 with witness notes conflict. Issue count 3: 2 with evidence files are not dated. Systems/documents: investigation case file, allegation summary, witness log, document evidence folder and corrective action tracker. Decision needed: ready, return, block, or escalate. Time pressure: before the daily cut-off.',
  1,
  '["HR & Workforce Services","Employee Relations & Workplace Investigations","Employee Relations & Grievance Specialists; Workplace Investigation & Screening Risk Specialists; Offboarding, Transition & Outplacement Specialists","Employee Relations Specialist; Labor Relations Specialist; Grievance Officer; HR Specialist; Workplace Investigator","IND-CAP-26","Workplace Investigation Evidence Control Log","Functional","Technical","Behavioural","Domain","Evidence"]'::jsonb,
  '["Start with the live trigger: 36 records arrive, 16 have visible issues, and a stakeholder needs an answer before the daily cut-off.","Learner studies the actual data points: allegation framing, witness/evidence register, chronology, confidentiality controls, finding summary, corrective-action handoff; then highlights missing fields, conflicts, late inputs, and owner gaps.","Teach the artifact logic: what each section means, which evidence is mandatory, what numbers must reconcile, and what the learner is allowed to decide at L2.","Learner completes the Workplace Investigation Evidence Control Log using the case numbers, source references, exception labels, owner notes, and a clear ready/return/block/escalate recommendation.","Learner uses AI only for checklist prompts, concept reminders, and rubric self-checks. AI must not invent records, calculate unsupported numbers, approve decisions, or replace the learner''s judgement.","Learner reflects on what changed at L2: volume, exception complexity, stakeholder pressure, authority boundary, and evidence quality compared with the previous level."]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Investigation Evidence Control: Routine Execution: Data, Concepts and Artifact Evidence
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-127' LIMIT 1)
   AND title = 'Module 1: Workplace Investigation Evidence Control Log Workplace Build' LIMIT 1),
  'Workplace Investigation Evidence Control: Routine Execution: Data, Concepts and Artifact Evidence',
  'Learner confusion: Students may understand the HR term but may not know how to read 36 messy records, compare source fields, quantify exceptions, choose proceed/return/escalate, or write the evidence trail in simple reviewer language. Root-cause focus: Investigate whether the real cause is missing source data, wrong effective date, unclear owner, system mismatch, late submission, policy/control risk, or weak handoff evidence in investigation case file, allegation summary, witness log, document evidence folder and corrective action tracker.',
  'Problem: A workplace investigator is handling 36 workplace investigation evidence control records in investigation case file, allegation summary, witness log, document evidence folder and corrective action tracker. The file is messy: 8 records have allegation scope is broad, 6 have witness notes conflict, 2 have evidence files are not dated, and some cases also show corrective action owner not recorded. The team needs a clean routine handoff before the daily cut-off because downstream work cannot start until the artifact is usable. The learner must complete the standard workflow, update statuses, prepare the artifact, and send a clean handoff without needing step-by-step guidance, prepare a Workplace Investigation Evidence Control Log, and clearly mark which items are ready, returned, blocked, or escalated. If handled poorly, the investigation may lose credibility, miss key evidence, or fail to support corrective action. Actuals: Volume: 36 records/cases. Issue count 1: 8 with allegation scope is broad. Issue count 2: 6 with witness notes conflict. Issue count 3: 2 with evidence files are not dated. Systems/documents: investigation case file, allegation summary, witness log, document evidence folder and corrective action tracker. Decision needed: ready, return, block, or escalate. Time pressure: before the daily cut-off. Major concepts: investigation scope framing - needed to complete and defend the Workplace Investigation Evidence Control Log; evidence chain of custody - needed to complete and defend the Workplace Investigation Evidence Control Log; witness log control - needed to complete and defend the Workplace Investigation Evidence Control Log; chronology building - needed to complete and defend the Workplace Investigation Evidence Control Log; finding support evidence - needed to complete and defend the Workplace Investigation Evidence Control Log; confidential access control - needed to complete and defend the Workplace Investigation Evidence Control Log; corrective action handoff - needed to complete and defend the Workplace Investigation Evidence Control Log; investigation evidence log standard - needed to complete and defend the Workplace Investigation Evidence Control Log Concept-to-artifact link: These concepts are not theory-only. They tell the learner what to check inside the Workplace Investigation Evidence Control Log: source data, missing fields, exception rules, owner notes, decision status, handoff logic, and reviewer evidence. Required data: To solve the artifact, learner needs: allegation framing, witness/evidence register, chronology, confidentiality controls, finding summary, corrective-action handoff; system screenshots or exports from investigation case file, allegation summary, witness log, document evidence folder and corrective action tracker; policy or checklist rule used; stakeholder request; deadline/cut-off; prior status if available; reviewer or owner name; evidence of any unresolved exception. Artifact structure: Workplace Investigation Evidence Control Log must contain: case or employee/candidate/worker identifier; source document reference; required data fields (allegation framing, witness/evidence register, chronology, confidentiality controls, finding summary, corrective-action handoff); missing or conflicting item log; numeric issue count; exception category; owner/action note; proceed/return/block/escalate status; reviewer handoff note; closure or follow-up date. How to read artifact: Read the artifact as the learner''s final workplace proof. First check the identifiers and source documents, then the required fields, then the issue count and exception category, then the decision status, and finally whether the handoff note gives a reviewer enough evidence to act. Evidence fields: Assess whether the Workplace Investigation Evidence Control Log uses the right source data, includes all required fields, counts and labels the 16 issue records correctly, separates normal items from exceptions, gives a clear decision reason, respects the L2 authority boundary, and provides a usable reviewer handoff. AI coach boundary: AI can ask: Which source proves this field? Which 8 records are blocked? What is the decision reason? What evidence is still missing? AI can summarize checklist gaps and suggest clearer wording, but cannot create missing data, approve the case, override policy, or make the final HR/payroll/compliance decision. Traceability: Industry: HR & Workforce Services.|Domain: Employee Relations & Workplace Investigations.|Role: Employee Relations Specialist; Labor Relations Specialist; Grievance Officer; HR Specialist; Workplace Investigator.|Capability_ID: IND-CAP-26.|Level: L2.|Course_ID: IND-S5-C-127.|Artifact: Workplace Investigation Evidence Control Log.|Source Sheet: L2_COURSE_PATTERN.',
  1,
  '10 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: LLB / BA LLB Labour and Employment Law
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-127' LIMIT 1),
  'LLB / BA LLB Labour and Employment Law',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MBA Human Resource Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-127' LIMIT 1),
  'MBA Human Resource Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MSW Human Resource Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-127' LIMIT 1),
  'MSW Human Resource Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MA Industrial Relations
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-127' LIMIT 1),
  'MA Industrial Relations',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BA Psychology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-127' LIMIT 1),
  'BA Psychology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Background Verification Adjudication: Routine Execution
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Background Verification Adjudication: Routine Execution',
  'IND-S5-C-132',
  'Learner can complete routine execution with clean handoff for Complete Background Screening Decisions Using Consent, and produce a reviewer-ready Background Verification Adjudication Note with clear evidence and handoff logic. Workplace scenario: A background verification specialist is handling 28 background verification adjudication note preparation records in BGV vendor report, candidate declaration, hiring policy, exception tracker and recruiter communication log. The file is messy: 9 records have vendor report has an address mismatch, 4 have education verification is pending, 3 have candidate declaration differs from report, and some cases also show policy treatment of the exception is unclear. The team needs a clean routine handoff before the daily cut-off because downstream work cannot start until the artifact is usable. The learner must complete the standard workflow, update statuses, prepare the artifact, and send a clean handoff without needing step-by-step guidance, prepare a Background Verification Adjudication Note, and clearly mark which items are ready, returned, blocked, or escalated. If handled poorly, the organization may hire without resolving a risk or wrongly block a candidate without fair evidence. Artifact proof: Background Verification Adjudication Note. Competency taxonomy: Functional; Technical; Behavioural; Cognitive; Evidence.',
  '10 hours',
  'Active',
  'HR & Workforce Services',
  'technical',
  '["Learner can complete routine execution with clean handoff for Complete Background Screening Decisions Using Consent, and produce a reviewer-ready Background Verification Adjudication Note with clear evidence and handoff logic.","Create a reviewer-ready Background Verification Adjudication Note.","Use source data to resolve the skill gap: Learner must convert background verification adjudication note preparation knowledge into a usable Background Verification Adjudication Note: check candidate consent, verification results, discrepancy classification, adjudication matrix, identify missing or conflicting records, explain the level boundary, and create a reviewer-ready handoff.","Explain evidence and consequence through the Background Verification Adjudication Note."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: Module 1: Background Verification Adjudication Note Workplace Build
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-132' LIMIT 1),
  'Module 1: Background Verification Adjudication Note Workplace Build',
  'Trigger: A background verification specialist receives 28 background verification adjudication note preparation records in BGV vendor report, candidate declaration, hiring policy, exception tracker and recruiter communication log; 9 show vendor report has an address mismatch, 4 show education verification is pending, and 3 show candidate declaration differs from report. Pressure: The team needs a clean routine handoff before the daily cut-off because downstream work cannot start until the artifact is usable. Actuals: Volume: 28 records/cases. Issue count 1: 9 with vendor report has an address mismatch. Issue count 2: 4 with education verification is pending. Issue count 3: 3 with candidate declaration differs from report. Systems/documents: BGV vendor report, candidate declaration, hiring policy, exception tracker and recruiter communication log. Decision needed: ready, return, block, or escalate. Time pressure: before the daily cut-off.',
  1,
  '["HR & Workforce Services","HR & Workforce Services","Employee Relations & Grievance Specialists; Workplace Investigation & Screening Risk Specialists; Offboarding, Transition & Outplacement Specialists","Employee Relations Specialist; Labor Relations Specialist; Grievance Officer; HR Specialist; Workplace Investigator","IND-CAP-27","Background Verification Adjudication Note","Functional","Technical","Behavioural","Cognitive","Evidence"]'::jsonb,
  '["Start with the live trigger: 28 records arrive, 16 have visible issues, and a stakeholder needs an answer before the daily cut-off.","Learner studies the actual data points: candidate consent, verification results, discrepancy classification, adjudication matrix, adverse-action flag, decision and communication evidence; then highlights missing fields, conflicts, late inputs, and owner gaps.","Teach the artifact logic: what each section means, which evidence is mandatory, what numbers must reconcile, and what the learner is allowed to decide at L2.","Learner completes the Background Verification Adjudication Note using the case numbers, source references, exception labels, owner notes, and a clear ready/return/block/escalate recommendation.","Learner uses AI only for checklist prompts, concept reminders, and rubric self-checks. AI must not invent records, calculate unsupported numbers, approve decisions, or replace the learner''s judgement.","Learner reflects on what changed at L2: volume, exception complexity, stakeholder pressure, authority boundary, and evidence quality compared with the previous level."]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Background Verification Adjudication: Routine Execution: Data, Concepts and Artifact Evidence
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-132' LIMIT 1)
   AND title = 'Module 1: Background Verification Adjudication Note Workplace Build' LIMIT 1),
  'Background Verification Adjudication: Routine Execution: Data, Concepts and Artifact Evidence',
  'Learner confusion: Students may understand the HR term but may not know how to read 28 messy records, compare source fields, quantify exceptions, choose proceed/return/escalate, or write the evidence trail in simple reviewer language. Root-cause focus: Investigate whether the real cause is missing source data, wrong effective date, unclear owner, system mismatch, late submission, policy/control risk, or weak handoff evidence in BGV vendor report, candidate declaration, hiring policy, exception tracker and recruiter communication log.',
  'Problem: A background verification specialist is handling 28 background verification adjudication note preparation records in BGV vendor report, candidate declaration, hiring policy, exception tracker and recruiter communication log. The file is messy: 9 records have vendor report has an address mismatch, 4 have education verification is pending, 3 have candidate declaration differs from report, and some cases also show policy treatment of the exception is unclear. The team needs a clean routine handoff before the daily cut-off because downstream work cannot start until the artifact is usable. The learner must complete the standard workflow, update statuses, prepare the artifact, and send a clean handoff without needing step-by-step guidance, prepare a Background Verification Adjudication Note, and clearly mark which items are ready, returned, blocked, or escalated. If handled poorly, the organization may hire without resolving a risk or wrongly block a candidate without fair evidence. Actuals: Volume: 28 records/cases. Issue count 1: 9 with vendor report has an address mismatch. Issue count 2: 4 with education verification is pending. Issue count 3: 3 with candidate declaration differs from report. Systems/documents: BGV vendor report, candidate declaration, hiring policy, exception tracker and recruiter communication log. Decision needed: ready, return, block, or escalate. Time pressure: before the daily cut-off. Major concepts: background verification status - needed to complete and defend the Background Verification Adjudication Note; exception classification - needed to complete and defend the Background Verification Adjudication Note; candidate declaration comparison - needed to complete and defend the Background Verification Adjudication Note; policy adjudication rule - needed to complete and defend the Background Verification Adjudication Note; vendor report evidence - needed to complete and defend the Background Verification Adjudication Note; proceed-pause-escalate logic - needed to complete and defend the Background Verification Adjudication Note; fairness and confidentiality - needed to complete and defend the Background Verification Adjudication Note; adjudication note quality - needed to complete and defend the Background Verification Adjudication Note Concept-to-artifact link: These concepts are not theory-only. They tell the learner what to check inside the Background Verification Adjudication Note: source data, missing fields, exception rules, owner notes, decision status, handoff logic, and reviewer evidence. Required data: To solve the artifact, learner needs: candidate consent, verification results, discrepancy classification, adjudication matrix, adverse-action flag, decision and communication evidence; system screenshots or exports from BGV vendor report, candidate declaration, hiring policy, exception tracker and recruiter communication log; policy or checklist rule used; stakeholder request; deadline/cut-off; prior status if available; reviewer or owner name; evidence of any unresolved exception. Artifact structure: Background Verification Adjudication Note must contain: case or employee/candidate/worker identifier; source document reference; required data fields (candidate consent, verification results, discrepancy classification, adjudication matrix, adverse-action flag, decision and communication evidence); missing or conflicting item log; numeric issue count; exception category; owner/action note; proceed/return/block/escalate status; reviewer handoff note; closure or follow-up date. How to read artifact: Read the artifact as the learner''s final workplace proof. First check the identifiers and source documents, then the required fields, then the issue count and exception category, then the decision status, and finally whether the handoff note gives a reviewer enough evidence to act. Evidence fields: Assess whether the Background Verification Adjudication Note uses the right source data, includes all required fields, counts and labels the 16 issue records correctly, separates normal items from exceptions, gives a clear decision reason, respects the L2 authority boundary, and provides a usable reviewer handoff. AI coach boundary: AI can ask: Which source proves this field? Which 9 records are blocked? What is the decision reason? What evidence is still missing? AI can summarize checklist gaps and suggest clearer wording, but cannot create missing data, approve the case, override policy, or make the final HR/payroll/compliance decision. Traceability: Industry: HR & Workforce Services.|Domain: HR & Workforce Services.|Role: Employee Relations Specialist; Labor Relations Specialist; Grievance Officer; HR Specialist; Workplace Investigator.|Capability_ID: IND-CAP-27.|Level: L2.|Course_ID: IND-S5-C-132.|Artifact: Background Verification Adjudication Note.|Source Sheet: L2_COURSE_PATTERN.',
  1,
  '10 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BBA Human Resource Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-132' LIMIT 1),
  'BBA Human Resource Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MBA Human Resource Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-132' LIMIT 1),
  'MBA Human Resource Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Com
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-132' LIMIT 1),
  'B.Com',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: LLB / BA LLB Labour and Employment Law
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-132' LIMIT 1),
  'LLB / BA LLB Labour and Employment Law',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PGDM Compliance Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'IND-S5-C-132' LIMIT 1),
  'PGDM Compliance Management',
  NOW()
) ON CONFLICT DO NOTHING;

COMMIT;

-- ============================================
-- COURSE SEED — part 04 of 10
-- Courses 151–200 of 485
-- Paste this whole file into the Supabase SQL editor and Run.
-- Safe to re-run (ON CONFLICT DO NOTHING). Run parts in order.
-- ============================================

BEGIN;

-- Insert Course: Rubric Evaluation Review Workflow Build, Conflict Handling & Final Release
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Rubric Evaluation Review Workflow Build, Conflict Handling & Final Release',
  'COURSE-L2-087',
  'Learner can complete the workflow, resolve routine conflicts, and release the output for apply rubrics and score reviews to produce fair, evidence-based learner evaluation decisions and submit a workplace-ready L2 Rubric Evaluation Review Execution Release Pack. Workplace scenario: A evaluation moderation team must complete and release the rubric evaluation review sheet for 45 submitted artifacts from 3 sections by the end of the day. The same inputs now have routine conflicts: evaluators are scoring differently, feedback quality varies, and borderline cases are unclear. The learner must update the tracker, resolve normal mismatches, record decisions, and release a clean rubric evaluation work pack. Learner artifact: L2 Rubric Evaluation Review Execution Release Pack. Required data: rubric, learner artifacts, evaluator scores, feedback comments, moderation notes, sample answers. Evidence: Assess whether routine conflicts were resolved correctly, statuses were updated, decisions were traceable, and the release pack can be used without extra explanation.',
  '12 hours',
  'Active',
  'Assessment, Certification & Credentialing',
  'technical',
  '["Triggered when an independent routine execution task needs a real workplace artifact, not a theory answer.","Demonstrates independent routine execution by producing and defending the L2 Rubric Evaluation Review Execution Release Pack.","Learner can complete the workflow, resolve routine conflicts, and release the output for apply rubrics and score reviews to produce fair, evidence-based learner evaluation decisions and submit a workplace-ready L2 Rubric Evaluation Review Execution Release Pack."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: Module 1: Rubric Evaluation Review Workflow Build, Conflict Handling & Final Release Workplace Artifact Build
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-087' LIMIT 1),
  'Module 1: Rubric Evaluation Review Workflow Build, Conflict Handling & Final Release Workplace Artifact Build',
  'Triggered when an independent routine execution task needs a real workplace artifact, not a theory answer. The learner studies the case, reviews the required data, identifies the gap, creates the artifact, and checks it against evidence fields.',
  1,
  '["Education & Skilling","Assessment, Certification & Credentialing","IND-CAP-18","L2","Rubric interpretation","Evidence-based scoring","Inter-rater consistency","Feedback quality","Moderation decision"]'::jsonb,
  '["Engage","Explore","Explain","Express","Empower","Evolve","Artifact Build","Evidence Review","AI-Coached Retry"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Case: Rubric Evaluation Review Workflow Build, Conflict Handling & Final Release
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-087' LIMIT 1)
   AND title = 'Module 1: Rubric Evaluation Review Workflow Build, Conflict Handling & Final Release Workplace Artifact Build' LIMIT 1),
  'Workplace Case: Rubric Evaluation Review Workflow Build, Conflict Handling & Final Release',
  'A evaluation moderation team must complete and release the rubric evaluation review sheet for 45 submitted artifacts from 3 sections by the end of the day. The same inputs now have routine conflicts: evaluators are scoring differently, feedback quality varies, and borderline cases are unclear. The learner must update the tracker, resolve normal mismatches, record decisions, and release a clean rubric evaluation work pack. The learner must solve the problem using the given data and produce the required workplace artifact.',
  'Workplace problem: A evaluation moderation team must complete and release the rubric evaluation review sheet for 45 submitted artifacts from 3 sections by the end of the day. The same inputs now have routine conflicts: evaluators are scoring differently, feedback quality varies, and borderline cases are unclear. The learner must update the tracker, resolve normal mismatches, record decisions, and release a clean rubric evaluation work pack. Pressure points: Release pressure: the work must be completed, not only checked. Learner must manage routine mismatches in rubric, learner artifacts, evaluator scores, feedback comments, moderation notes, sample answers while keeping status updates clear and on time. Root cause focus: Find whether delay or error comes from workflow sequencing, routine conflict handling, unclear status update, or missing release approval. Major concepts: Rubric interpretation; Evidence-based scoring; Inter-rater consistency; Feedback quality; Moderation decision; Borderline case handling; Workflow sequencing; Routine conflict resolution; Release control. Level focus: workflow execution and release. Required data: rubric, learner artifacts, evaluator scores, feedback comments, moderation notes, sample answers Learner activity flow: Engage - Start with the case: 45 submitted artifacts from 3 sections and the visible pain point — evaluators are scoring differently, feedback quality varies, and borderline cases are unclear. Learner identifies who is affected and what could go wrong if the work is delayed or wrong. Explore - Learner studies the source data: rubric, learner artifacts, evaluator scores, feedback comments, moderation notes, sample answers. They mark trusted records, missing fields, conflicting entries, and items that need confirmation before using them in the artifact. Explain - Teach the main logic in simple terms: Rubric interpretation; Evidence-based scoring; Inter-rater consistency; Feedback quality; Moderation decision; Borderline case handling; Workflow sequencing; Routine conflict resolution; Release control. Level focus: workflow execution and release. Show how rules, evidence, decisions, and handoff notes connect in this workplace task. Express - Learner produces the L2 Rubric Evaluation Review Execution Release Pack using the case data, writes decisions in plain English, and shows evidence for each important field instead of giving only a theory answer. Empower - Learner uses AI only as a coach: ask for missing-field checks, clarity prompts, risk questions, and retry suggestions. AI should not create the final artifact for the learner. Evolve - Learner notes what would become harder at L3: more records, more conflicts, less guidance, stronger evidence expectations, and higher decision responsibility. Artifact to submit: L2 Rubric Evaluation Review Execution Release Pack. L2 Rubric Evaluation Review Execution Release Pack should contain: work tracker; resolved routine conflicts; updated status fields; release checklist; decision note; final handoff confirmation. Required source data: rubric, learner artifacts, evaluator scores, feedback comments, moderation notes, sample answers. Evidence fields: Assess whether routine conflicts were resolved correctly, statuses were updated, decisions were traceable, and the release pack can be used without extra explanation. AI support: AI coach can ask: What source proves this? Which field is missing? What is the risk if this is wrong? Who owns the next action? Learner must answer using the case data, not guesses.',
  1,
  '12 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Ed - Assessment Practice
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-087' LIMIT 1),
  'B.Ed - Assessment Practice',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Ed - Evaluation Studies
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-087' LIMIT 1),
  'M.Ed - Evaluation Studies',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MA Education
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-087' LIMIT 1),
  'MA Education',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PG Diploma Assessment and Rubrics
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-087' LIMIT 1),
  'PG Diploma Assessment and Rubrics',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PG Diploma Coaching Evaluation
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-087' LIMIT 1),
  'PG Diploma Coaching Evaluation',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Credential Issuance Workflow Build, Conflict Handling & Final Release
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Credential Issuance Workflow Build, Conflict Handling & Final Release',
  'COURSE-L2-092',
  'Learner can complete the workflow, resolve routine conflicts, and release the output for issue credentials through eligibility, assessment completion, and certification record verification and submit a workplace-ready L2 Credential Issuance Execution Release Pack. Workplace scenario: A certification office must complete and release the credential issuance verification file for 138 learners marked complete by the end of the day. The same inputs now have routine conflicts: identity details, assessment completion, payment status, and approval records do not match for 19 learners. The learner must update the tracker, resolve normal mismatches, record decisions, and release a clean credential issuance work pack. Learner artifact: L2 Credential Issuance Execution Release Pack. Required data: completion report, assessment result sheet, learner ID records, payment/status file, approval list, certificate template. Evidence: Assess whether routine conflicts were resolved correctly, statuses were updated, decisions were traceable, and the release pack can be used without extra explanation.',
  '12 hours',
  'Active',
  'Assessment, Certification & Credentialing',
  'technical',
  '["Triggered when an independent routine execution task needs a real workplace artifact, not a theory answer.","Demonstrates independent routine execution by producing and defending the L2 Credential Issuance Execution Release Pack.","Learner can complete the workflow, resolve routine conflicts, and release the output for issue credentials through eligibility, assessment completion, and certification record verification and submit a workplace-ready L2 Credential Issuance Execution Release Pack."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: Module 1: Credential Issuance Workflow Build, Conflict Handling & Final Release Workplace Artifact Build
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-092' LIMIT 1),
  'Module 1: Credential Issuance Workflow Build, Conflict Handling & Final Release Workplace Artifact Build',
  'Triggered when an independent routine execution task needs a real workplace artifact, not a theory answer. The learner studies the case, reviews the required data, identifies the gap, creates the artifact, and checks it against evidence fields.',
  1,
  '["Education & Skilling","Assessment, Certification & Credentialing","IND-CAP-19","L2","Credential eligibility","Completion verification","Identity data matching","Certificate data control","Approval workflow"]'::jsonb,
  '["Engage","Explore","Explain","Express","Empower","Evolve","Artifact Build","Evidence Review","AI-Coached Retry"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Case: Credential Issuance Workflow Build, Conflict Handling & Final Release
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-092' LIMIT 1)
   AND title = 'Module 1: Credential Issuance Workflow Build, Conflict Handling & Final Release Workplace Artifact Build' LIMIT 1),
  'Workplace Case: Credential Issuance Workflow Build, Conflict Handling & Final Release',
  'A certification office must complete and release the credential issuance verification file for 138 learners marked complete by the end of the day. The same inputs now have routine conflicts: identity details, assessment completion, payment status, and approval records do not match for 19 learners. The learner must update the tracker, resolve normal mismatches, record decisions, and release a clean credential issuance work pack. The learner must solve the problem using the given data and produce the required workplace artifact.',
  'Workplace problem: A certification office must complete and release the credential issuance verification file for 138 learners marked complete by the end of the day. The same inputs now have routine conflicts: identity details, assessment completion, payment status, and approval records do not match for 19 learners. The learner must update the tracker, resolve normal mismatches, record decisions, and release a clean credential issuance work pack. Pressure points: Release pressure: the work must be completed, not only checked. Learner must manage routine mismatches in completion report, assessment result sheet, learner ID records, payment/status file, approval list, certificate template while keeping status updates clear and on time. Root cause focus: Find whether delay or error comes from workflow sequencing, routine conflict handling, unclear status update, or missing release approval. Major concepts: Credential eligibility; Completion verification; Identity data matching; Certificate data control; Approval workflow; Issuance audit trail; Workflow sequencing; Routine conflict resolution; Release control. Level focus: workflow execution and release. Required data: completion report, assessment result sheet, learner ID records, payment/status file, approval list, certificate template Learner activity flow: Engage - Start with the case: 138 learners marked complete and the visible pain point — identity details, assessment completion, payment status, and approval records do not match for 19 learners. Learner identifies who is affected and what could go wrong if the work is delayed or wrong. Explore - Learner studies the source data: completion report, assessment result sheet, learner ID records, payment/status file, approval list, certificate template. They mark trusted records, missing fields, conflicting entries, and items that need confirmation before using them in the artifact. Explain - Teach the main logic in simple terms: Credential eligibility; Completion verification; Identity data matching; Certificate data control; Approval workflow; Issuance audit trail; Workflow sequencing; Routine conflict resolution; Release control. Level focus: workflow execution and release. Show how rules, evidence, decisions, and handoff notes connect in this workplace task. Express - Learner produces the L2 Credential Issuance Execution Release Pack using the case data, writes decisions in plain English, and shows evidence for each important field instead of giving only a theory answer. Empower - Learner uses AI only as a coach: ask for missing-field checks, clarity prompts, risk questions, and retry suggestions. AI should not create the final artifact for the learner. Evolve - Learner notes what would become harder at L3: more records, more conflicts, less guidance, stronger evidence expectations, and higher decision responsibility. Artifact to submit: L2 Credential Issuance Execution Release Pack. L2 Credential Issuance Execution Release Pack should contain: work tracker; resolved routine conflicts; updated status fields; release checklist; decision note; final handoff confirmation. Required source data: completion report, assessment result sheet, learner ID records, payment/status file, approval list, certificate template. Evidence fields: Assess whether routine conflicts were resolved correctly, statuses were updated, decisions were traceable, and the release pack can be used without extra explanation. AI support: AI coach can ask: What source proves this? Which field is missing? What is the risk if this is wrong? Who owns the next action? Learner must answer using the case data, not guesses.',
  1,
  '12 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BBA Education Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-092' LIMIT 1),
  'BBA Education Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Com - Academic Operations
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-092' LIMIT 1),
  'B.Com - Academic Operations',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BA Public Administration
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-092' LIMIT 1),
  'BA Public Administration',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PG Diploma Certification Operations
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-092' LIMIT 1),
  'PG Diploma Certification Operations',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MBA Education Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-092' LIMIT 1),
  'MBA Education Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Exam Operations Control Workflow Build, Conflict Handling & Final Release
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Exam Operations Control Workflow Build, Conflict Handling & Final Release',
  'COURSE-L2-097',
  'Learner can complete the workflow, resolve routine conflicts, and release the output for control exam operations through scheduling, candidate readiness, invigilation, and exception handling and submit a workplace-ready L2 Exam Operations Control Execution Release Pack. Workplace scenario: A exam cell must complete and release the exam operations control file for 420 candidates across 8 rooms by the end of the day. The same inputs now have routine conflicts: seat plan, invigilator duty, question-paper packets, access needs, and incident rules are not fully aligned. The learner must update the tracker, resolve normal mismatches, record decisions, and release a clean exam operations work pack. Learner artifact: L2 Exam Operations Control Execution Release Pack. Required data: candidate list, room plan, invigilator roster, question-paper packet list, access accommodation list, incident format. Evidence: Assess whether routine conflicts were resolved correctly, statuses were updated, decisions were traceable, and the release pack can be used without extra explanation.',
  '12 hours',
  'Active',
  'Assessment, Certification & Credentialing',
  'technical',
  '["Triggered when an independent routine execution task needs a real workplace artifact, not a theory answer.","Demonstrates independent routine execution by producing and defending the L2 Exam Operations Control Execution Release Pack.","Learner can complete the workflow, resolve routine conflicts, and release the output for control exam operations through scheduling, candidate readiness, invigilation, and exception handling and submit a workplace-ready L2 Exam Operations Control Execution Release Pack."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: Module 1: Exam Operations Control Workflow Build, Conflict Handling & Final Release Workplace Artifact Build
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-097' LIMIT 1),
  'Module 1: Exam Operations Control Workflow Build, Conflict Handling & Final Release Workplace Artifact Build',
  'Triggered when an independent routine execution task needs a real workplace artifact, not a theory answer. The learner studies the case, reviews the required data, identifies the gap, creates the artifact, and checks it against evidence fields.',
  1,
  '["Education & Skilling","Assessment, Certification & Credentialing","IND-CAP-20","L2","Exam logistics control","Seating and room allocation","Invigilator duty mapping","Confidential material control","Incident reporting"]'::jsonb,
  '["Engage","Explore","Explain","Express","Empower","Evolve","Artifact Build","Evidence Review","AI-Coached Retry"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Case: Exam Operations Control Workflow Build, Conflict Handling & Final Release
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-097' LIMIT 1)
   AND title = 'Module 1: Exam Operations Control Workflow Build, Conflict Handling & Final Release Workplace Artifact Build' LIMIT 1),
  'Workplace Case: Exam Operations Control Workflow Build, Conflict Handling & Final Release',
  'A exam cell must complete and release the exam operations control file for 420 candidates across 8 rooms by the end of the day. The same inputs now have routine conflicts: seat plan, invigilator duty, question-paper packets, access needs, and incident rules are not fully aligned. The learner must update the tracker, resolve normal mismatches, record decisions, and release a clean exam operations work pack. The learner must solve the problem using the given data and produce the required workplace artifact.',
  'Workplace problem: A exam cell must complete and release the exam operations control file for 420 candidates across 8 rooms by the end of the day. The same inputs now have routine conflicts: seat plan, invigilator duty, question-paper packets, access needs, and incident rules are not fully aligned. The learner must update the tracker, resolve normal mismatches, record decisions, and release a clean exam operations work pack. Pressure points: Release pressure: the work must be completed, not only checked. Learner must manage routine mismatches in candidate list, room plan, invigilator roster, question-paper packet list, access accommodation list, incident format while keeping status updates clear and on time. Root cause focus: Find whether delay or error comes from workflow sequencing, routine conflict handling, unclear status update, or missing release approval. Major concepts: Exam logistics control; Seating and room allocation; Invigilator duty mapping; Confidential material control; Incident reporting; Compliance checklist; Workflow sequencing; Routine conflict resolution; Release control. Level focus: workflow execution and release. Required data: candidate list, room plan, invigilator roster, question-paper packet list, access accommodation list, incident format Learner activity flow: Engage - Start with the case: 420 candidates across 8 rooms and the visible pain point — seat plan, invigilator duty, question-paper packets, access needs, and incident rules are not fully aligned. Learner identifies who is affected and what could go wrong if the work is delayed or wrong. Explore - Learner studies the source data: candidate list, room plan, invigilator roster, question-paper packet list, access accommodation list, incident format. They mark trusted records, missing fields, conflicting entries, and items that need confirmation before using them in the artifact. Explain - Teach the main logic in simple terms: Exam logistics control; Seating and room allocation; Invigilator duty mapping; Confidential material control; Incident reporting; Compliance checklist; Workflow sequencing; Routine conflict resolution; Release control. Level focus: workflow execution and release. Show how rules, evidence, decisions, and handoff notes connect in this workplace task. Express - Learner produces the L2 Exam Operations Control Execution Release Pack using the case data, writes decisions in plain English, and shows evidence for each important field instead of giving only a theory answer. Empower - Learner uses AI only as a coach: ask for missing-field checks, clarity prompts, risk questions, and retry suggestions. AI should not create the final artifact for the learner. Evolve - Learner notes what would become harder at L3: more records, more conflicts, less guidance, stronger evidence expectations, and higher decision responsibility. Artifact to submit: L2 Exam Operations Control Execution Release Pack. L2 Exam Operations Control Execution Release Pack should contain: work tracker; resolved routine conflicts; updated status fields; release checklist; decision note; final handoff confirmation. Required source data: candidate list, room plan, invigilator roster, question-paper packet list, access accommodation list, incident format. Evidence fields: Assess whether routine conflicts were resolved correctly, statuses were updated, decisions were traceable, and the release pack can be used without extra explanation. AI support: AI coach can ask: What source proves this? Which field is missing? What is the risk if this is wrong? Who owns the next action? Learner must answer using the case data, not guesses.',
  1,
  '12 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Ed - Exam Operations
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-097' LIMIT 1),
  'B.Ed - Exam Operations',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BBA Education Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-097' LIMIT 1),
  'BBA Education Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BA Public Administration
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-097' LIMIT 1),
  'BA Public Administration',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PG Diploma Exam Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-097' LIMIT 1),
  'PG Diploma Exam Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Ed - Assessment Administration
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-097' LIMIT 1),
  'M.Ed - Assessment Administration',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Learner Support Planning Workflow Build, Conflict Handling & Final Release
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Learner Support Planning Workflow Build, Conflict Handling & Final Release',
  'COURSE-L2-102',
  'Learner can complete the workflow, resolve routine conflicts, and release the output for create learner support plans from accessibility, referral, and progress evidence and submit a workplace-ready L2 Learner Support Planning Execution Release Pack. Workplace scenario: A inclusive learning support team must complete and release the learner support plan for 58 learners flagged for support by the end of the day. The same inputs now have routine conflicts: support needs, accommodation requests, guardian notes, teacher observations, and resource availability are incomplete. The learner must update the tracker, resolve normal mismatches, record decisions, and release a clean learner support planning work pack. Learner artifact: L2 Learner Support Planning Execution Release Pack. Required data: learner profile, accommodation request, teacher observation, support history, resource list, meeting notes. Evidence: Assess whether routine conflicts were resolved correctly, statuses were updated, decisions were traceable, and the release pack can be used without extra explanation.',
  '12 hours',
  'Active',
  'Learner Support, Guidance & Coaching Services',
  'soft',
  '["Triggered when an independent routine execution task needs a real workplace artifact, not a theory answer.","Demonstrates independent routine execution by producing and defending the L2 Learner Support Planning Execution Release Pack.","Learner can complete the workflow, resolve routine conflicts, and release the output for create learner support plans from accessibility, referral, and progress evidence and submit a workplace-ready L2 Learner Support Planning Execution Release Pack."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: Module 1: Learner Support Planning Workflow Build, Conflict Handling & Final Release Workplace Artifact Build
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-102' LIMIT 1),
  'Module 1: Learner Support Planning Workflow Build, Conflict Handling & Final Release Workplace Artifact Build',
  'Triggered when an independent routine execution task needs a real workplace artifact, not a theory answer. The learner studies the case, reviews the required data, identifies the gap, creates the artifact, and checks it against evidence fields.',
  1,
  '["Education & Skilling","Learner Support, Guidance & Coaching Services","IND-CAP-21","L2","Inclusive support planning","Accommodation mapping","Learner profile interpretation","Stakeholder coordination","Support action plan"]'::jsonb,
  '["Engage","Explore","Explain","Express","Empower","Evolve","Artifact Build","Evidence Review","AI-Coached Retry"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Case: Learner Support Planning Workflow Build, Conflict Handling & Final Release
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-102' LIMIT 1)
   AND title = 'Module 1: Learner Support Planning Workflow Build, Conflict Handling & Final Release Workplace Artifact Build' LIMIT 1),
  'Workplace Case: Learner Support Planning Workflow Build, Conflict Handling & Final Release',
  'A inclusive learning support team must complete and release the learner support plan for 58 learners flagged for support by the end of the day. The same inputs now have routine conflicts: support needs, accommodation requests, guardian notes, teacher observations, and resource availability are incomplete. The learner must update the tracker, resolve normal mismatches, record decisions, and release a clean learner support planning work pack. The learner must solve the problem using the given data and produce the required workplace artifact.',
  'Workplace problem: A inclusive learning support team must complete and release the learner support plan for 58 learners flagged for support by the end of the day. The same inputs now have routine conflicts: support needs, accommodation requests, guardian notes, teacher observations, and resource availability are incomplete. The learner must update the tracker, resolve normal mismatches, record decisions, and release a clean learner support planning work pack. Pressure points: Release pressure: the work must be completed, not only checked. Learner must manage routine mismatches in learner profile, accommodation request, teacher observation, support history, resource list, meeting notes while keeping status updates clear and on time. Root cause focus: Find whether delay or error comes from workflow sequencing, routine conflict handling, unclear status update, or missing release approval. Major concepts: Inclusive support planning; Accommodation mapping; Learner profile interpretation; Stakeholder coordination; Support action plan; Review timeline; Workflow sequencing; Routine conflict resolution; Release control. Level focus: workflow execution and release. Required data: learner profile, accommodation request, teacher observation, support history, resource list, meeting notes Learner activity flow: Engage - Start with the case: 58 learners flagged for support and the visible pain point — support needs, accommodation requests, guardian notes, teacher observations, and resource availability are incomplete. Learner identifies who is affected and what could go wrong if the work is delayed or wrong. Explore - Learner studies the source data: learner profile, accommodation request, teacher observation, support history, resource list, meeting notes. They mark trusted records, missing fields, conflicting entries, and items that need confirmation before using them in the artifact. Explain - Teach the main logic in simple terms: Inclusive support planning; Accommodation mapping; Learner profile interpretation; Stakeholder coordination; Support action plan; Review timeline; Workflow sequencing; Routine conflict resolution; Release control. Level focus: workflow execution and release. Show how rules, evidence, decisions, and handoff notes connect in this workplace task. Express - Learner produces the L2 Learner Support Planning Execution Release Pack using the case data, writes decisions in plain English, and shows evidence for each important field instead of giving only a theory answer. Empower - Learner uses AI only as a coach: ask for missing-field checks, clarity prompts, risk questions, and retry suggestions. AI should not create the final artifact for the learner. Evolve - Learner notes what would become harder at L3: more records, more conflicts, less guidance, stronger evidence expectations, and higher decision responsibility. Artifact to submit: L2 Learner Support Planning Execution Release Pack. L2 Learner Support Planning Execution Release Pack should contain: work tracker; resolved routine conflicts; updated status fields; release checklist; decision note; final handoff confirmation. Required source data: learner profile, accommodation request, teacher observation, support history, resource list, meeting notes. Evidence fields: Assess whether routine conflicts were resolved correctly, statuses were updated, decisions were traceable, and the release pack can be used without extra explanation. AI support: AI coach can ask: What source proves this? Which field is missing? What is the risk if this is wrong? Who owns the next action? Learner must answer using the case data, not guesses.',
  1,
  '12 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Ed Special Education
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-102' LIMIT 1),
  'B.Ed Special Education',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Ed Special Education
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-102' LIMIT 1),
  'M.Ed Special Education',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BA Psychology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-102' LIMIT 1),
  'BA Psychology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MA Psychology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-102' LIMIT 1),
  'MA Psychology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MSW - Student Support Services
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-102' LIMIT 1),
  'MSW - Student Support Services',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Remedial Intervention Cycle Workflow Build, Conflict Handling & Final Release
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Remedial Intervention Cycle Workflow Build, Conflict Handling & Final Release',
  'COURSE-L2-107',
  'Learner can complete the workflow, resolve routine conflicts, and release the output for run remedial intervention cycles using learning-gap diagnosis, practice evidence, and progress review and submit a workplace-ready L2 Remedial Intervention Cycle Execution Release Pack. Workplace scenario: An academic recovery team must complete and release the remedial intervention cycle plan for 73 learners below benchmark after unit test by the end of the day. The same inputs now have routine conflicts: diagnostic causes, remedial groups, practice tasks, teacher availability, and retest dates are not planned. The learner must update the tracker, resolve normal mismatches, record decisions, and release a clean remedial intervention work pack. Learner artifact: L2 Remedial Intervention Cycle Execution Release Pack. Required data: unit-test scores, error analysis, attendance record, learner groups, teacher roster, remedial material list, retest plan. Evidence: Assess whether routine conflicts were resolved correctly, statuses were updated, decisions were traceable, and the release pack can be used without extra explanation.',
  '12 hours',
  'Active',
  'Learner Support, Guidance & Coaching Services',
  'soft',
  '["Triggered when an independent routine execution task needs a real workplace artifact, not a theory answer.","Demonstrates independent routine execution by producing and defending the L2 Remedial Intervention Cycle Execution Release Pack.","Learner can complete the workflow, resolve routine conflicts, and release the output for run remedial intervention cycles using learning-gap diagnosis, practice evidence, and progress review and submit a workplace-ready L2 Remedial Intervention Cycle Execution Release Pack."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: Module 1: Remedial Intervention Cycle Workflow Build, Conflict Handling & Final Release Workplace Artifact Build
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-107' LIMIT 1),
  'Module 1: Remedial Intervention Cycle Workflow Build, Conflict Handling & Final Release Workplace Artifact Build',
  'Triggered when an independent routine execution task needs a real workplace artifact, not a theory answer. The learner studies the case, reviews the required data, identifies the gap, creates the artifact, and checks it against evidence fields.',
  1,
  '["Education & Skilling","Learner Support, Guidance & Coaching Services","IND-CAP-22","L2","Diagnostic error analysis","Remedial grouping","Intervention planning","Practice evidence","Retest scheduling"]'::jsonb,
  '["Engage","Explore","Explain","Express","Empower","Evolve","Artifact Build","Evidence Review","AI-Coached Retry"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Case: Remedial Intervention Cycle Workflow Build, Conflict Handling & Final Release
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-107' LIMIT 1)
   AND title = 'Module 1: Remedial Intervention Cycle Workflow Build, Conflict Handling & Final Release Workplace Artifact Build' LIMIT 1),
  'Workplace Case: Remedial Intervention Cycle Workflow Build, Conflict Handling & Final Release',
  'An academic recovery team must complete and release the remedial intervention cycle plan for 73 learners below benchmark after unit test by the end of the day. The same inputs now have routine conflicts: diagnostic causes, remedial groups, practice tasks, teacher availability, and retest dates are not planned. The learner must update the tracker, resolve normal mismatches, record decisions, and release a clean remedial intervention work pack. The learner must solve the problem using the given data and produce the required workplace artifact.',
  'Workplace problem: An academic recovery team must complete and release the remedial intervention cycle plan for 73 learners below benchmark after unit test by the end of the day. The same inputs now have routine conflicts: diagnostic causes, remedial groups, practice tasks, teacher availability, and retest dates are not planned. The learner must update the tracker, resolve normal mismatches, record decisions, and release a clean remedial intervention work pack. Pressure points: Release pressure: the work must be completed, not only checked. Learner must manage routine mismatches in unit-test scores, error analysis, attendance record, learner groups, teacher roster, remedial material list, retest plan while keeping status updates clear and on time. Root cause focus: Find whether delay or error comes from workflow sequencing, routine conflict handling, unclear status update, or missing release approval. Major concepts: Diagnostic error analysis; Remedial grouping; Intervention planning; Practice evidence; Retest scheduling; Progress monitoring; Workflow sequencing; Routine conflict resolution; Release control. Level focus: workflow execution and release. Required data: unit-test scores, error analysis, attendance record, learner groups, teacher roster, remedial material list, retest plan Learner activity flow: Engage - Start with the case: 73 learners below benchmark after unit test and the visible pain point — diagnostic causes, remedial groups, practice tasks, teacher availability, and retest dates are not planned. Learner identifies who is affected and what could go wrong if the work is delayed or wrong. Explore - Learner studies the source data: unit-test scores, error analysis, attendance record, learner groups, teacher roster, remedial material list, retest plan. They mark trusted records, missing fields, conflicting entries, and items that need confirmation before using them in the artifact. Explain - Teach the main logic in simple terms: Diagnostic error analysis; Remedial grouping; Intervention planning; Practice evidence; Retest scheduling; Progress monitoring; Workflow sequencing; Routine conflict resolution; Release control. Level focus: workflow execution and release. Show how rules, evidence, decisions, and handoff notes connect in this workplace task. Express - Learner produces the L2 Remedial Intervention Cycle Execution Release Pack using the case data, writes decisions in plain English, and shows evidence for each important field instead of giving only a theory answer. Empower - Learner uses AI only as a coach: ask for missing-field checks, clarity prompts, risk questions, and retry suggestions. AI should not create the final artifact for the learner. Evolve - Learner notes what would become harder at L3: more records, more conflicts, less guidance, stronger evidence expectations, and higher decision responsibility. Artifact to submit: L2 Remedial Intervention Cycle Execution Release Pack. L2 Remedial Intervention Cycle Execution Release Pack should contain: work tracker; resolved routine conflicts; updated status fields; release checklist; decision note; final handoff confirmation. Required source data: unit-test scores, error analysis, attendance record, learner groups, teacher roster, remedial material list, retest plan. Evidence fields: Assess whether routine conflicts were resolved correctly, statuses were updated, decisions were traceable, and the release pack can be used without extra explanation. AI support: AI coach can ask: What source proves this? Which field is missing? What is the risk if this is wrong? Who owns the next action? Learner must answer using the case data, not guesses.',
  1,
  '12 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Ed Special Education
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-107' LIMIT 1),
  'B.Ed Special Education',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Ed - Remedial Education
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-107' LIMIT 1),
  'B.Ed - Remedial Education',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BA Psychology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-107' LIMIT 1),
  'BA Psychology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MA Education
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-107' LIMIT 1),
  'MA Education',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PG Diploma Remedial Intervention
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-107' LIMIT 1),
  'PG Diploma Remedial Intervention',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Career Guidance Action Planning Workflow Build, Conflict Handling & Final Release
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Career Guidance Action Planning Workflow Build, Conflict Handling & Final Release',
  'COURSE-L2-112',
  'Learner can complete the workflow, resolve routine conflicts, and release the output for convert learner profiles and market evidence into career guidance action plans and submit a workplace-ready L2 Career Guidance Action Planning Execution Release Pack. Workplace scenario: A career guidance cell must complete and release the career guidance action plan for 120 final-year learners by the end of the day. The same inputs now have routine conflicts: career interests, aptitude data, course marks, family constraints, and local job options point in different directions. The learner must update the tracker, resolve normal mismatches, record decisions, and release a clean career guidance planning work pack. Learner artifact: L2 Career Guidance Action Planning Execution Release Pack. Required data: interest form, aptitude results, academic scores, learner constraints, job/education options, counselling notes. Evidence: Assess whether routine conflicts were resolved correctly, statuses were updated, decisions were traceable, and the release pack can be used without extra explanation.',
  '12 hours',
  'Active',
  'Education & Skilling',
  'soft',
  '["Triggered when an independent routine execution task needs a real workplace artifact, not a theory answer.","Demonstrates independent routine execution by producing and defending the L2 Career Guidance Action Planning Execution Release Pack.","Learner can complete the workflow, resolve routine conflicts, and release the output for convert learner profiles and market evidence into career guidance action plans and submit a workplace-ready L2 Career Guidance Action Planning Execution Release Pack."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: Module 1: Career Guidance Action Planning Workflow Build, Conflict Handling & Final Release Workplace Artifact Build
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-112' LIMIT 1),
  'Module 1: Career Guidance Action Planning Workflow Build, Conflict Handling & Final Release Workplace Artifact Build',
  'Triggered when an independent routine execution task needs a real workplace artifact, not a theory answer. The learner studies the case, reviews the required data, identifies the gap, creates the artifact, and checks it against evidence fields.',
  1,
  '["Education & Skilling","IND-CAP-23","L2","Career interest interpretation","Aptitude and evidence use","Option comparison","Constraint-aware guidance","Action planning"]'::jsonb,
  '["Engage","Explore","Explain","Express","Empower","Evolve","Artifact Build","Evidence Review","AI-Coached Retry"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Case: Career Guidance Action Planning Workflow Build, Conflict Handling & Final Release
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-112' LIMIT 1)
   AND title = 'Module 1: Career Guidance Action Planning Workflow Build, Conflict Handling & Final Release Workplace Artifact Build' LIMIT 1),
  'Workplace Case: Career Guidance Action Planning Workflow Build, Conflict Handling & Final Release',
  'A career guidance cell must complete and release the career guidance action plan for 120 final-year learners by the end of the day. The same inputs now have routine conflicts: career interests, aptitude data, course marks, family constraints, and local job options point in different directions. The learner must update the tracker, resolve normal mismatches, record decisions, and release a clean career guidance planning work pack. The learner must solve the problem using the given data and produce the required workplace artifact.',
  'Workplace problem: A career guidance cell must complete and release the career guidance action plan for 120 final-year learners by the end of the day. The same inputs now have routine conflicts: career interests, aptitude data, course marks, family constraints, and local job options point in different directions. The learner must update the tracker, resolve normal mismatches, record decisions, and release a clean career guidance planning work pack. Pressure points: Release pressure: the work must be completed, not only checked. Learner must manage routine mismatches in interest form, aptitude results, academic scores, learner constraints, job/education options, counselling notes while keeping status updates clear and on time. Root cause focus: Find whether delay or error comes from workflow sequencing, routine conflict handling, unclear status update, or missing release approval. Major concepts: Career interest interpretation; Aptitude and evidence use; Option comparison; Constraint-aware guidance; Action planning; Referral and follow-up; Workflow sequencing; Routine conflict resolution; Release control. Level focus: workflow execution and release. Required data: interest form, aptitude results, academic scores, learner constraints, job/education options, counselling notes Learner activity flow: Engage - Start with the case: 120 final-year learners and the visible pain point — career interests, aptitude data, course marks, family constraints, and local job options point in different directions. Learner identifies who is affected and what could go wrong if the work is delayed or wrong. Explore - Learner studies the source data: interest form, aptitude results, academic scores, learner constraints, job/education options, counselling notes. They mark trusted records, missing fields, conflicting entries, and items that need confirmation before using them in the artifact. Explain - Teach the main logic in simple terms: Career interest interpretation; Aptitude and evidence use; Option comparison; Constraint-aware guidance; Action planning; Referral and follow-up; Workflow sequencing; Routine conflict resolution; Release control. Level focus: workflow execution and release. Show how rules, evidence, decisions, and handoff notes connect in this workplace task. Express - Learner produces the L2 Career Guidance Action Planning Execution Release Pack using the case data, writes decisions in plain English, and shows evidence for each important field instead of giving only a theory answer. Empower - Learner uses AI only as a coach: ask for missing-field checks, clarity prompts, risk questions, and retry suggestions. AI should not create the final artifact for the learner. Evolve - Learner notes what would become harder at L3: more records, more conflicts, less guidance, stronger evidence expectations, and higher decision responsibility. Artifact to submit: L2 Career Guidance Action Planning Execution Release Pack. L2 Career Guidance Action Planning Execution Release Pack should contain: work tracker; resolved routine conflicts; updated status fields; release checklist; decision note; final handoff confirmation. Required source data: interest form, aptitude results, academic scores, learner constraints, job/education options, counselling notes. Evidence fields: Assess whether routine conflicts were resolved correctly, statuses were updated, decisions were traceable, and the release pack can be used without extra explanation. AI support: AI coach can ask: What source proves this? Which field is missing? What is the risk if this is wrong? Who owns the next action? Learner must answer using the case data, not guesses.',
  1,
  '12 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BA Psychology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-112' LIMIT 1),
  'BA Psychology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MA Counselling Psychology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-112' LIMIT 1),
  'MA Counselling Psychology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BBA HR
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-112' LIMIT 1),
  'BBA HR',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MBA HR
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-112' LIMIT 1),
  'MBA HR',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PG Diploma Career Guidance and Counselling
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-112' LIMIT 1),
  'PG Diploma Career Guidance and Counselling',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Coaching Progress Management Workflow Build, Conflict Handling & Final Release
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Coaching Progress Management Workflow Build, Conflict Handling & Final Release',
  'COURSE-L2-117',
  'Learner can complete the workflow, resolve routine conflicts, and release the output for manage language or performance coaching progress through diagnostic evidence, practice cycles, and feedback records and submit a workplace-ready L2 Coaching Progress Management Execution Release Pack. Workplace scenario: A coaching program team must complete and release the coaching progress tracker for 36 learners in a 6-week coaching cycle by the end of the day. The same inputs now have routine conflicts: practice logs, coach feedback, attendance, improvement targets, and learner reflections are inconsistent. The learner must update the tracker, resolve normal mismatches, record decisions, and release a clean coaching progress management work pack. Learner artifact: L2 Coaching Progress Management Execution Release Pack. Required data: practice log, coach feedback, attendance, performance target, reflection notes, review dates. Evidence: Assess whether routine conflicts were resolved correctly, statuses were updated, decisions were traceable, and the release pack can be used without extra explanation.',
  '12 hours',
  'Active',
  'Education & Skilling',
  'soft',
  '["Triggered when an independent routine execution task needs a real workplace artifact, not a theory answer.","Demonstrates independent routine execution by producing and defending the L2 Coaching Progress Management Execution Release Pack.","Learner can complete the workflow, resolve routine conflicts, and release the output for manage language or performance coaching progress through diagnostic evidence, practice cycles, and feedback records and submit a workplace-ready L2 Coaching Progress Management Execution Release Pack."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: Module 1: Coaching Progress Management Workflow Build, Conflict Handling & Final Release Workplace Artifact Build
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-117' LIMIT 1),
  'Module 1: Coaching Progress Management Workflow Build, Conflict Handling & Final Release Workplace Artifact Build',
  'Triggered when an independent routine execution task needs a real workplace artifact, not a theory answer. The learner studies the case, reviews the required data, identifies the gap, creates the artifact, and checks it against evidence fields.',
  1,
  '["Education & Skilling","IND-CAP-24","L2","Coaching goal setting","Practice evidence tracking","Feedback loop","Progress review","Motivation support"]'::jsonb,
  '["Engage","Explore","Explain","Express","Empower","Evolve","Artifact Build","Evidence Review","AI-Coached Retry"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Case: Coaching Progress Management Workflow Build, Conflict Handling & Final Release
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-117' LIMIT 1)
   AND title = 'Module 1: Coaching Progress Management Workflow Build, Conflict Handling & Final Release Workplace Artifact Build' LIMIT 1),
  'Workplace Case: Coaching Progress Management Workflow Build, Conflict Handling & Final Release',
  'A coaching program team must complete and release the coaching progress tracker for 36 learners in a 6-week coaching cycle by the end of the day. The same inputs now have routine conflicts: practice logs, coach feedback, attendance, improvement targets, and learner reflections are inconsistent. The learner must update the tracker, resolve normal mismatches, record decisions, and release a clean coaching progress management work pack. The learner must solve the problem using the given data and produce the required workplace artifact.',
  'Workplace problem: A coaching program team must complete and release the coaching progress tracker for 36 learners in a 6-week coaching cycle by the end of the day. The same inputs now have routine conflicts: practice logs, coach feedback, attendance, improvement targets, and learner reflections are inconsistent. The learner must update the tracker, resolve normal mismatches, record decisions, and release a clean coaching progress management work pack. Pressure points: Release pressure: the work must be completed, not only checked. Learner must manage routine mismatches in practice log, coach feedback, attendance, performance target, reflection notes, review dates while keeping status updates clear and on time. Root cause focus: Find whether delay or error comes from workflow sequencing, routine conflict handling, unclear status update, or missing release approval. Major concepts: Coaching goal setting; Practice evidence tracking; Feedback loop; Progress review; Motivation support; Next-step planning; Workflow sequencing; Routine conflict resolution; Release control. Level focus: workflow execution and release. Required data: practice log, coach feedback, attendance, performance target, reflection notes, review dates Learner activity flow: Engage - Start with the case: 36 learners in a 6-week coaching cycle and the visible pain point — practice logs, coach feedback, attendance, improvement targets, and learner reflections are inconsistent. Learner identifies who is affected and what could go wrong if the work is delayed or wrong. Explore - Learner studies the source data: practice log, coach feedback, attendance, performance target, reflection notes, review dates. They mark trusted records, missing fields, conflicting entries, and items that need confirmation before using them in the artifact. Explain - Teach the main logic in simple terms: Coaching goal setting; Practice evidence tracking; Feedback loop; Progress review; Motivation support; Next-step planning; Workflow sequencing; Routine conflict resolution; Release control. Level focus: workflow execution and release. Show how rules, evidence, decisions, and handoff notes connect in this workplace task. Express - Learner produces the L2 Coaching Progress Management Execution Release Pack using the case data, writes decisions in plain English, and shows evidence for each important field instead of giving only a theory answer. Empower - Learner uses AI only as a coach: ask for missing-field checks, clarity prompts, risk questions, and retry suggestions. AI should not create the final artifact for the learner. Evolve - Learner notes what would become harder at L3: more records, more conflicts, less guidance, stronger evidence expectations, and higher decision responsibility. Artifact to submit: L2 Coaching Progress Management Execution Release Pack. L2 Coaching Progress Management Execution Release Pack should contain: work tracker; resolved routine conflicts; updated status fields; release checklist; decision note; final handoff confirmation. Required source data: practice log, coach feedback, attendance, performance target, reflection notes, review dates. Evidence fields: Assess whether routine conflicts were resolved correctly, statuses were updated, decisions were traceable, and the release pack can be used without extra explanation. AI support: AI coach can ask: What source proves this? Which field is missing? What is the risk if this is wrong? Who owns the next action? Learner must answer using the case data, not guesses.',
  1,
  '12 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BA English and Communication
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-117' LIMIT 1),
  'BA English and Communication',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.P.Ed
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-117' LIMIT 1),
  'B.P.Ed',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BFA Performing Arts
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-117' LIMIT 1),
  'BFA Performing Arts',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Ed - Coaching Support
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-117' LIMIT 1),
  'B.Ed - Coaching Support',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PG Diploma Coaching and Mentoring
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-117' LIMIT 1),
  'PG Diploma Coaching and Mentoring',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Admissions Operations Workflow Build, Conflict Handling & Final Release
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Admissions Operations Workflow Build, Conflict Handling & Final Release',
  'COURSE-L2-122',
  'Learner can complete the workflow, resolve routine conflicts, and release the output for complete admissions operations through document verification, enrollment coding, and record activation and submit a workplace-ready L2 Admissions Operations Execution Release Pack. Workplace scenario: An admissions office must complete and release the admissions operations tracker for 520 applicants for 180 seats by the end of the day. The same inputs now have routine conflicts: application status, document checks, fee records, category rules, and communication logs are not synchronized. The learner must update the tracker, resolve normal mismatches, record decisions, and release a clean admissions operations work pack. Learner artifact: L2 Admissions Operations Execution Release Pack. Required data: application forms, document checklist, fee report, category rules, merit/selection list, communication log. Evidence: Assess whether routine conflicts were resolved correctly, statuses were updated, decisions were traceable, and the release pack can be used without extra explanation.',
  '12 hours',
  'Active',
  'Education & Skilling',
  'technical',
  '["Triggered when an independent routine execution task needs a real workplace artifact, not a theory answer.","Demonstrates independent routine execution by producing and defending the L2 Admissions Operations Execution Release Pack.","Learner can complete the workflow, resolve routine conflicts, and release the output for complete admissions operations through document verification, enrollment coding, and record activation and submit a workplace-ready L2 Admissions Operations Execution Release Pack."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: Module 1: Admissions Operations Workflow Build, Conflict Handling & Final Release Workplace Artifact Build
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-122' LIMIT 1),
  'Module 1: Admissions Operations Workflow Build, Conflict Handling & Final Release Workplace Artifact Build',
  'Triggered when an independent routine execution task needs a real workplace artifact, not a theory answer. The learner studies the case, reviews the required data, identifies the gap, creates the artifact, and checks it against evidence fields.',
  1,
  '["Education & Skilling","IND-CAP-25","L2","Admissions workflow","Document and fee verification","Selection rule application","Status communication","Exception tagging"]'::jsonb,
  '["Engage","Explore","Explain","Express","Empower","Evolve","Artifact Build","Evidence Review","AI-Coached Retry"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Case: Admissions Operations Workflow Build, Conflict Handling & Final Release
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-122' LIMIT 1)
   AND title = 'Module 1: Admissions Operations Workflow Build, Conflict Handling & Final Release Workplace Artifact Build' LIMIT 1),
  'Workplace Case: Admissions Operations Workflow Build, Conflict Handling & Final Release',
  'An admissions office must complete and release the admissions operations tracker for 520 applicants for 180 seats by the end of the day. The same inputs now have routine conflicts: application status, document checks, fee records, category rules, and communication logs are not synchronized. The learner must update the tracker, resolve normal mismatches, record decisions, and release a clean admissions operations work pack. The learner must solve the problem using the given data and produce the required workplace artifact.',
  'Workplace problem: An admissions office must complete and release the admissions operations tracker for 520 applicants for 180 seats by the end of the day. The same inputs now have routine conflicts: application status, document checks, fee records, category rules, and communication logs are not synchronized. The learner must update the tracker, resolve normal mismatches, record decisions, and release a clean admissions operations work pack. Pressure points: Release pressure: the work must be completed, not only checked. Learner must manage routine mismatches in application forms, document checklist, fee report, category rules, merit/selection list, communication log while keeping status updates clear and on time. Root cause focus: Find whether delay or error comes from workflow sequencing, routine conflict handling, unclear status update, or missing release approval. Major concepts: Admissions workflow; Document and fee verification; Selection rule application; Status communication; Exception tagging; Admissions audit trail; Workflow sequencing; Routine conflict resolution; Release control. Level focus: workflow execution and release. Required data: application forms, document checklist, fee report, category rules, merit/selection list, communication log Learner activity flow: Engage - Start with the case: 520 applicants for 180 seats and the visible pain point — application status, document checks, fee records, category rules, and communication logs are not synchronized. Learner identifies who is affected and what could go wrong if the work is delayed or wrong. Explore - Learner studies the source data: application forms, document checklist, fee report, category rules, merit/selection list, communication log. They mark trusted records, missing fields, conflicting entries, and items that need confirmation before using them in the artifact. Explain - Teach the main logic in simple terms: Admissions workflow; Document and fee verification; Selection rule application; Status communication; Exception tagging; Admissions audit trail; Workflow sequencing; Routine conflict resolution; Release control. Level focus: workflow execution and release. Show how rules, evidence, decisions, and handoff notes connect in this workplace task. Express - Learner produces the L2 Admissions Operations Execution Release Pack using the case data, writes decisions in plain English, and shows evidence for each important field instead of giving only a theory answer. Empower - Learner uses AI only as a coach: ask for missing-field checks, clarity prompts, risk questions, and retry suggestions. AI should not create the final artifact for the learner. Evolve - Learner notes what would become harder at L3: more records, more conflicts, less guidance, stronger evidence expectations, and higher decision responsibility. Artifact to submit: L2 Admissions Operations Execution Release Pack. L2 Admissions Operations Execution Release Pack should contain: work tracker; resolved routine conflicts; updated status fields; release checklist; decision note; final handoff confirmation. Required source data: application forms, document checklist, fee report, category rules, merit/selection list, communication log. Evidence fields: Assess whether routine conflicts were resolved correctly, statuses were updated, decisions were traceable, and the release pack can be used without extra explanation. AI support: AI coach can ask: What source proves this? Which field is missing? What is the risk if this is wrong? Who owns the next action? Learner must answer using the case data, not guesses.',
  1,
  '12 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BBA Education Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-122' LIMIT 1),
  'BBA Education Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Com - Admissions Operations
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-122' LIMIT 1),
  'B.Com - Admissions Operations',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BA Public Administration
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-122' LIMIT 1),
  'BA Public Administration',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MBA Education Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-122' LIMIT 1),
  'MBA Education Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PG Diploma Admission Counselling
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-122' LIMIT 1),
  'PG Diploma Admission Counselling',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Education MIS Reporting Workflow Build, Conflict Handling & Final Release
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Education MIS Reporting Workflow Build, Conflict Handling & Final Release',
  'COURSE-L2-127',
  'Learner can complete the workflow, resolve routine conflicts, and release the output for produce institution-level education MIS reports through institution-code, learner-record, and data-quality controls and submit a workplace-ready L2 Education MIS Reporting Execution Release Pack. Workplace scenario: An institution reporting team must complete and release the education MIS report pack for 12 departments reporting monthly data by the end of the day. The same inputs now have routine conflicts: enrollment, attendance, assessment, dropout, and placement numbers do not reconcile before submission. The learner must update the tracker, resolve normal mismatches, record decisions, and release a clean education MIS reporting work pack. Learner artifact: L2 Education MIS Reporting Execution Release Pack. Required data: department data files, ERP exports, attendance summaries, assessment results, dropout records, placement tracker. Evidence: Assess whether routine conflicts were resolved correctly, statuses were updated, decisions were traceable, and the release pack can be used without extra explanation.',
  '12 hours',
  'Active',
  'Education & Skilling',
  'technical',
  '["Triggered when an independent routine execution task needs a real workplace artifact, not a theory answer.","Demonstrates independent routine execution by producing and defending the L2 Education MIS Reporting Execution Release Pack.","Learner can complete the workflow, resolve routine conflicts, and release the output for produce institution-level education MIS reports through institution-code, learner-record, and data-quality controls and submit a workplace-ready L2 Education MIS Reporting Execution Release Pack."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: Module 1: Education MIS Reporting Workflow Build, Conflict Handling & Final Release Workplace Artifact Build
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-127' LIMIT 1),
  'Module 1: Education MIS Reporting Workflow Build, Conflict Handling & Final Release Workplace Artifact Build',
  'Triggered when an independent routine execution task needs a real workplace artifact, not a theory answer. The learner studies the case, reviews the required data, identifies the gap, creates the artifact, and checks it against evidence fields.',
  1,
  '["Education & Skilling","IND-CAP-26","L2","MIS data validation","Indicator definition","Reconciliation logic","Dashboard readiness","Exception notes"]'::jsonb,
  '["Engage","Explore","Explain","Express","Empower","Evolve","Artifact Build","Evidence Review","AI-Coached Retry"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Case: Education MIS Reporting Workflow Build, Conflict Handling & Final Release
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-127' LIMIT 1)
   AND title = 'Module 1: Education MIS Reporting Workflow Build, Conflict Handling & Final Release Workplace Artifact Build' LIMIT 1),
  'Workplace Case: Education MIS Reporting Workflow Build, Conflict Handling & Final Release',
  'An institution reporting team must complete and release the education MIS report pack for 12 departments reporting monthly data by the end of the day. The same inputs now have routine conflicts: enrollment, attendance, assessment, dropout, and placement numbers do not reconcile before submission. The learner must update the tracker, resolve normal mismatches, record decisions, and release a clean education MIS reporting work pack. The learner must solve the problem using the given data and produce the required workplace artifact.',
  'Workplace problem: An institution reporting team must complete and release the education MIS report pack for 12 departments reporting monthly data by the end of the day. The same inputs now have routine conflicts: enrollment, attendance, assessment, dropout, and placement numbers do not reconcile before submission. The learner must update the tracker, resolve normal mismatches, record decisions, and release a clean education MIS reporting work pack. Pressure points: Release pressure: the work must be completed, not only checked. Learner must manage routine mismatches in department data files, ERP exports, attendance summaries, assessment results, dropout records, placement tracker while keeping status updates clear and on time. Root cause focus: Find whether delay or error comes from workflow sequencing, routine conflict handling, unclear status update, or missing release approval. Major concepts: MIS data validation; Indicator definition; Reconciliation logic; Dashboard readiness; Exception notes; Submission control; Workflow sequencing; Routine conflict resolution; Release control. Level focus: workflow execution and release. Required data: department data files, ERP exports, attendance summaries, assessment results, dropout records, placement tracker Learner activity flow: Engage - Start with the case: 12 departments reporting monthly data and the visible pain point — enrollment, attendance, assessment, dropout, and placement numbers do not reconcile before submission. Learner identifies who is affected and what could go wrong if the work is delayed or wrong. Explore - Learner studies the source data: department data files, ERP exports, attendance summaries, assessment results, dropout records, placement tracker. They mark trusted records, missing fields, conflicting entries, and items that need confirmation before using them in the artifact. Explain - Teach the main logic in simple terms: MIS data validation; Indicator definition; Reconciliation logic; Dashboard readiness; Exception notes; Submission control; Workflow sequencing; Routine conflict resolution; Release control. Level focus: workflow execution and release. Show how rules, evidence, decisions, and handoff notes connect in this workplace task. Express - Learner produces the L2 Education MIS Reporting Execution Release Pack using the case data, writes decisions in plain English, and shows evidence for each important field instead of giving only a theory answer. Empower - Learner uses AI only as a coach: ask for missing-field checks, clarity prompts, risk questions, and retry suggestions. AI should not create the final artifact for the learner. Evolve - Learner notes what would become harder at L3: more records, more conflicts, less guidance, stronger evidence expectations, and higher decision responsibility. Artifact to submit: L2 Education MIS Reporting Execution Release Pack. L2 Education MIS Reporting Execution Release Pack should contain: work tracker; resolved routine conflicts; updated status fields; release checklist; decision note; final handoff confirmation. Required source data: department data files, ERP exports, attendance summaries, assessment results, dropout records, placement tracker. Evidence fields: Assess whether routine conflicts were resolved correctly, statuses were updated, decisions were traceable, and the release pack can be used without extra explanation. AI support: AI coach can ask: What source proves this? Which field is missing? What is the risk if this is wrong? Who owns the next action? Learner must answer using the case data, not guesses.',
  1,
  '12 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BCA
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-127' LIMIT 1),
  'BCA',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc IT
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-127' LIMIT 1),
  'B.Sc IT',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Com - Data Reporting
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-127' LIMIT 1),
  'B.Com - Data Reporting',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BBA Business Analytics
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-127' LIMIT 1),
  'BBA Business Analytics',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PG Diploma Education Data Analytics
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-127' LIMIT 1),
  'PG Diploma Education Data Analytics',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Government/NGO Program Tracking Workflow Build, Conflict Handling & Final Release
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Government/NGO Program Tracking Workflow Build, Conflict Handling & Final Release',
  'COURSE-L2-132',
  'Learner can complete the workflow, resolve routine conflicts, and release the output for track government or ngo education programs through beneficiary, activity, utilization, and outcome evidence and submit a workplace-ready L2 Government/NGO Program Tracking Execution Release Pack. Workplace scenario: A NGO education program team must complete and release the program tracking report for 18 centres and 2,400 beneficiaries by the end of the day. The same inputs now have routine conflicts: attendance, activity evidence, budget use, outcome data, and donor reporting formats are incomplete. The learner must update the tracker, resolve normal mismatches, record decisions, and release a clean government/ngo program tracking work pack. Learner artifact: L2 Government/NGO Program Tracking Execution Release Pack. Required data: centre reports, attendance registers, activity photos/logs, budget sheet, outcome tracker, donor format. Evidence: Assess whether routine conflicts were resolved correctly, statuses were updated, decisions were traceable, and the release pack can be used without extra explanation.',
  '12 hours',
  'Active',
  'Education & Skilling',
  'technical',
  '["Triggered when an independent routine execution task needs a real workplace artifact, not a theory answer.","Demonstrates independent routine execution by producing and defending the L2 Government/NGO Program Tracking Execution Release Pack.","Learner can complete the workflow, resolve routine conflicts, and release the output for track government or ngo education programs through beneficiary, activity, utilization, and outcome evidence and submit a workplace-ready L2 Government/NGO Program Tracking Execution Release Pack."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: Module 1: Government/NGO Program Tracking Workflow Build, Conflict Handling & Final Release Workplace Artifact Build
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-132' LIMIT 1),
  'Module 1: Government/NGO Program Tracking Workflow Build, Conflict Handling & Final Release Workplace Artifact Build',
  'Triggered when an independent routine execution task needs a real workplace artifact, not a theory answer. The learner studies the case, reviews the required data, identifies the gap, creates the artifact, and checks it against evidence fields.',
  1,
  '["Education & Skilling","IND-CAP-27","L2","Program monitoring","Beneficiary data tracking","Activity evidence control","Budget-output linkage","Donor report structure"]'::jsonb,
  '["Engage","Explore","Explain","Express","Empower","Evolve","Artifact Build","Evidence Review","AI-Coached Retry"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Case: Government/NGO Program Tracking Workflow Build, Conflict Handling & Final Release
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-132' LIMIT 1)
   AND title = 'Module 1: Government/NGO Program Tracking Workflow Build, Conflict Handling & Final Release Workplace Artifact Build' LIMIT 1),
  'Workplace Case: Government/NGO Program Tracking Workflow Build, Conflict Handling & Final Release',
  'A NGO education program team must complete and release the program tracking report for 18 centres and 2,400 beneficiaries by the end of the day. The same inputs now have routine conflicts: attendance, activity evidence, budget use, outcome data, and donor reporting formats are incomplete. The learner must update the tracker, resolve normal mismatches, record decisions, and release a clean government/ngo program tracking work pack. The learner must solve the problem using the given data and produce the required workplace artifact.',
  'Workplace problem: A NGO education program team must complete and release the program tracking report for 18 centres and 2,400 beneficiaries by the end of the day. The same inputs now have routine conflicts: attendance, activity evidence, budget use, outcome data, and donor reporting formats are incomplete. The learner must update the tracker, resolve normal mismatches, record decisions, and release a clean government/ngo program tracking work pack. Pressure points: Release pressure: the work must be completed, not only checked. Learner must manage routine mismatches in centre reports, attendance registers, activity photos/logs, budget sheet, outcome tracker, donor format while keeping status updates clear and on time. Root cause focus: Find whether delay or error comes from workflow sequencing, routine conflict handling, unclear status update, or missing release approval. Major concepts: Program monitoring; Beneficiary data tracking; Activity evidence control; Budget-output linkage; Donor report structure; Risk and variance note; Workflow sequencing; Routine conflict resolution; Release control. Level focus: workflow execution and release. Required data: centre reports, attendance registers, activity photos/logs, budget sheet, outcome tracker, donor format Learner activity flow: Engage - Start with the case: 18 centres and 2,400 beneficiaries and the visible pain point — attendance, activity evidence, budget use, outcome data, and donor reporting formats are incomplete. Learner identifies who is affected and what could go wrong if the work is delayed or wrong. Explore - Learner studies the source data: centre reports, attendance registers, activity photos/logs, budget sheet, outcome tracker, donor format. They mark trusted records, missing fields, conflicting entries, and items that need confirmation before using them in the artifact. Explain - Teach the main logic in simple terms: Program monitoring; Beneficiary data tracking; Activity evidence control; Budget-output linkage; Donor report structure; Risk and variance note; Workflow sequencing; Routine conflict resolution; Release control. Level focus: workflow execution and release. Show how rules, evidence, decisions, and handoff notes connect in this workplace task. Express - Learner produces the L2 Government/NGO Program Tracking Execution Release Pack using the case data, writes decisions in plain English, and shows evidence for each important field instead of giving only a theory answer. Empower - Learner uses AI only as a coach: ask for missing-field checks, clarity prompts, risk questions, and retry suggestions. AI should not create the final artifact for the learner. Evolve - Learner notes what would become harder at L3: more records, more conflicts, less guidance, stronger evidence expectations, and higher decision responsibility. Artifact to submit: L2 Government/NGO Program Tracking Execution Release Pack. L2 Government/NGO Program Tracking Execution Release Pack should contain: work tracker; resolved routine conflicts; updated status fields; release checklist; decision note; final handoff confirmation. Required source data: centre reports, attendance registers, activity photos/logs, budget sheet, outcome tracker, donor format. Evidence fields: Assess whether routine conflicts were resolved correctly, statuses were updated, decisions were traceable, and the release pack can be used without extra explanation. AI support: AI coach can ask: What source proves this? Which field is missing? What is the risk if this is wrong? Who owns the next action? Learner must answer using the case data, not guesses.',
  1,
  '12 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BSW - Community Development
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-132' LIMIT 1),
  'BSW - Community Development',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MSW - Education Programs
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-132' LIMIT 1),
  'MSW - Education Programs',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BA Public Administration
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-132' LIMIT 1),
  'BA Public Administration',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MA Development Studies
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-132' LIMIT 1),
  'MA Development Studies',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PG Diploma NGO Program Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-132' LIMIT 1),
  'PG Diploma NGO Program Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Research Publishing Coordination Workflow Build, Conflict Handling & Final Release
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Research Publishing Coordination Workflow Build, Conflict Handling & Final Release',
  'COURSE-L2-137',
  'Learner can complete the workflow, resolve routine conflicts, and release the output for research and academic publishing cycles through study evidence, review workflow, and publication records and submit a workplace-ready L2 Research Publishing Coordination Execution Release Pack. Workplace scenario: A research office must complete and release the research publishing tracker for 22 manuscripts in review cycle by the end of the day. The same inputs now have routine conflicts: ethics approval, reviewer comments, author revisions, plagiarism checks, and publication status are scattered. The learner must update the tracker, resolve normal mismatches, record decisions, and release a clean research publishing coordination work pack. Learner artifact: L2 Research Publishing Coordination Execution Release Pack. Required data: manuscript tracker, ethics approval, reviewer comments, revision files, plagiarism report, publication status log. Evidence: Assess whether routine conflicts were resolved correctly, statuses were updated, decisions were traceable, and the release pack can be used without extra explanation.',
  '12 hours',
  'Active',
  'Education & Skilling',
  'technical',
  '["Triggered when an independent routine execution task needs a real workplace artifact, not a theory answer.","Demonstrates independent routine execution by producing and defending the L2 Research Publishing Coordination Execution Release Pack.","Learner can complete the workflow, resolve routine conflicts, and release the output for research and academic publishing cycles through study evidence, review workflow, and publication records and submit a workplace-ready L2 Research Publishing Coordination Execution Release Pack."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: Module 1: Research Publishing Coordination Workflow Build, Conflict Handling & Final Release Workplace Artifact Build
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-137' LIMIT 1),
  'Module 1: Research Publishing Coordination Workflow Build, Conflict Handling & Final Release Workplace Artifact Build',
  'Triggered when an independent routine execution task needs a real workplace artifact, not a theory answer. The learner studies the case, reviews the required data, identifies the gap, creates the artifact, and checks it against evidence fields.',
  1,
  '["Education & Skilling","IND-CAP-28","L2","Research workflow tracking","Ethics and compliance check","Peer-review status control","Revision evidence","Publication record management"]'::jsonb,
  '["Engage","Explore","Explain","Express","Empower","Evolve","Artifact Build","Evidence Review","AI-Coached Retry"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Case: Research Publishing Coordination Workflow Build, Conflict Handling & Final Release
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-137' LIMIT 1)
   AND title = 'Module 1: Research Publishing Coordination Workflow Build, Conflict Handling & Final Release Workplace Artifact Build' LIMIT 1),
  'Workplace Case: Research Publishing Coordination Workflow Build, Conflict Handling & Final Release',
  'A research office must complete and release the research publishing tracker for 22 manuscripts in review cycle by the end of the day. The same inputs now have routine conflicts: ethics approval, reviewer comments, author revisions, plagiarism checks, and publication status are scattered. The learner must update the tracker, resolve normal mismatches, record decisions, and release a clean research publishing coordination work pack. The learner must solve the problem using the given data and produce the required workplace artifact.',
  'Workplace problem: A research office must complete and release the research publishing tracker for 22 manuscripts in review cycle by the end of the day. The same inputs now have routine conflicts: ethics approval, reviewer comments, author revisions, plagiarism checks, and publication status are scattered. The learner must update the tracker, resolve normal mismatches, record decisions, and release a clean research publishing coordination work pack. Pressure points: Release pressure: the work must be completed, not only checked. Learner must manage routine mismatches in manuscript tracker, ethics approval, reviewer comments, revision files, plagiarism report, publication status log while keeping status updates clear and on time. Root cause focus: Find whether delay or error comes from workflow sequencing, routine conflict handling, unclear status update, or missing release approval. Major concepts: Research workflow tracking; Ethics and compliance check; Peer-review status control; Revision evidence; Publication record management; Author communication; Workflow sequencing; Routine conflict resolution; Release control. Level focus: workflow execution and release. Required data: manuscript tracker, ethics approval, reviewer comments, revision files, plagiarism report, publication status log Learner activity flow: Engage - Start with the case: 22 manuscripts in review cycle and the visible pain point — ethics approval, reviewer comments, author revisions, plagiarism checks, and publication status are scattered. Learner identifies who is affected and what could go wrong if the work is delayed or wrong. Explore - Learner studies the source data: manuscript tracker, ethics approval, reviewer comments, revision files, plagiarism report, publication status log. They mark trusted records, missing fields, conflicting entries, and items that need confirmation before using them in the artifact. Explain - Teach the main logic in simple terms: Research workflow tracking; Ethics and compliance check; Peer-review status control; Revision evidence; Publication record management; Author communication; Workflow sequencing; Routine conflict resolution; Release control. Level focus: workflow execution and release. Show how rules, evidence, decisions, and handoff notes connect in this workplace task. Express - Learner produces the L2 Research Publishing Coordination Execution Release Pack using the case data, writes decisions in plain English, and shows evidence for each important field instead of giving only a theory answer. Empower - Learner uses AI only as a coach: ask for missing-field checks, clarity prompts, risk questions, and retry suggestions. AI should not create the final artifact for the learner. Evolve - Learner notes what would become harder at L3: more records, more conflicts, less guidance, stronger evidence expectations, and higher decision responsibility. Artifact to submit: L2 Research Publishing Coordination Execution Release Pack. L2 Research Publishing Coordination Execution Release Pack should contain: work tracker; resolved routine conflicts; updated status fields; release checklist; decision note; final handoff confirmation. Required source data: manuscript tracker, ethics approval, reviewer comments, revision files, plagiarism report, publication status log. Evidence fields: Assess whether routine conflicts were resolved correctly, statuses were updated, decisions were traceable, and the release pack can be used without extra explanation. AI support: AI coach can ask: What source proves this? Which field is missing? What is the risk if this is wrong? Who owns the next action? Learner must answer using the case data, not guesses.',
  1,
  '12 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BA Education
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-137' LIMIT 1),
  'BA Education',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MA Education
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-137' LIMIT 1),
  'MA Education',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Ed Research Methods
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-137' LIMIT 1),
  'M.Ed Research Methods',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PG Diploma Research Methodology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-137' LIMIT 1),
  'PG Diploma Research Methodology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PhD Coursework - Education Research
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-137' LIMIT 1),
  'PhD Coursework - Education Research',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Cohort Scheduling Exception Diagnosis, Routing & Escalation Log
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Cohort Scheduling Exception Diagnosis, Routing & Escalation Log',
  'COURSE-L3-003',
  'Learner can diagnose exceptions, select the right route, and document escalation logic for cohort session schedules from calendar, facilitator, learner, and resource constraints and submit a workplace-ready L3 Cohort Scheduling Exception Resolution Log. Workplace scenario: A training centre has an exception queue linked to cohort scheduling for 240 learners across 3 batches. Several cases cannot be completed because two facilitators are unavailable, one lab is double-booked, 18 learners were added late, and a holiday was missed. The learner must diagnose the cause, separate data errors from policy exceptions, route each case, and prepare an escalation log with reasons. Learner artifact: L3 Cohort Scheduling Exception Resolution Log. Required data: academic calendar, facilitator roster, room/lab tracker, batch list, holiday calendar, session duration rules, approval notes. Evidence: Assess whether each exception has a clear cause, evidence, routing decision, escalation owner, and closure or follow-up status.',
  '15 hours',
  'Active',
  'Formal Education & Lifelong Learning Delivery',
  'technical',
  '["Triggered when an exception diagnosis and escalation task needs a real workplace artifact, not a theory answer.","Demonstrates exception diagnosis and escalation by producing and defending the L3 Cohort Scheduling Exception Resolution Log.","Learner can diagnose exceptions, select the right route, and document escalation logic for cohort session schedules from calendar, facilitator, learner, and resource constraints and submit a workplace-ready L3 Cohort Scheduling Exception Resolution Log."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: Module 1: Cohort Scheduling Exception Diagnosis, Routing & Escalation Log Workplace Artifact Build
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-003' LIMIT 1),
  'Module 1: Cohort Scheduling Exception Diagnosis, Routing & Escalation Log Workplace Artifact Build',
  'Triggered when an exception diagnosis and escalation task needs a real workplace artifact, not a theory answer. The learner studies the case, reviews the required data, identifies the gap, creates the artifact, and checks it against evidence fields.',
  1,
  '["Education & Skilling","Formal Education & Lifelong Learning Delivery","IND-CAP-01","L3","Academic calendar logic","Batch-wise timetable sequencing","Facilitator availability check","Room and resource constraint mapping","Conflict log and priority rules"]'::jsonb,
  '["Engage","Explore","Explain","Express","Empower","Evolve","Artifact Build","Evidence Review","AI-Coached Retry"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Case: Cohort Scheduling Exception Diagnosis, Routing & Escalation Log
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-003' LIMIT 1)
   AND title = 'Module 1: Cohort Scheduling Exception Diagnosis, Routing & Escalation Log Workplace Artifact Build' LIMIT 1),
  'Workplace Case: Cohort Scheduling Exception Diagnosis, Routing & Escalation Log',
  'A training centre has an exception queue linked to cohort scheduling for 240 learners across 3 batches. Several cases cannot be completed because two facilitators are unavailable, one lab is double-booked, 18 learners were added late, and a holiday was missed. The learner must diagnose the cause, separate data errors from policy exceptions, route each case, and prepare an escalation log with reasons. The learner must solve the problem using the given data and produce the required workplace artifact.',
  'Workplace problem: A training centre has an exception queue linked to cohort scheduling for 240 learners across 3 batches. Several cases cannot be completed because two facilitators are unavailable, one lab is double-booked, 18 learners were added late, and a holiday was missed. The learner must diagnose the cause, separate data errors from policy exceptions, route each case, and prepare an escalation log with reasons. Pressure points: Exception pressure: some cases are blocked, learners or staff are waiting, and wrong routing can delay resolution. Learner must show why each case is a data issue, rule issue, owner issue, or escalation issue. Root cause focus: Classify the blocker as data mismatch, learner/staff eligibility issue, rule exception, system limitation, or approval dependency. Major concepts: Academic calendar logic; Batch-wise timetable sequencing; Facilitator availability check; Room and resource constraint mapping; Conflict log and priority rules; Schedule release handoff; Exception classification; Escalation threshold; Decision justification. Level focus: exception handling and escalation. Required data: academic calendar, facilitator roster, room/lab tracker, batch list, holiday calendar, session duration rules, approval notes Learner activity flow: Engage - Start with the case: 240 learners across 3 batches and the visible pain point — two facilitators are unavailable, one lab is double-booked, 18 learners were added late, and a holiday was missed. Learner identifies who is affected and what could go wrong if the work is delayed or wrong. Explore - Learner studies the source data: academic calendar, facilitator roster, room/lab tracker, batch list, holiday calendar, session duration rules, approval notes. They mark trusted records, missing fields, conflicting entries, and items that need confirmation before using them in the artifact. Explain - Teach the main logic in simple terms: Academic calendar logic; Batch-wise timetable sequencing; Facilitator availability check; Room and resource constraint mapping; Conflict log and priority rules; Schedule release handoff; Exception classification; Escalation threshold; Decision justification. Level focus: exception handling and escalation. Show how rules, evidence, decisions, and handoff notes connect in this workplace task. Express - Learner produces the L3 Cohort Scheduling Exception Resolution Log using the case data, writes decisions in plain English, and shows evidence for each important field instead of giving only a theory answer. Empower - Learner uses AI only as a coach: ask for missing-field checks, clarity prompts, risk questions, and retry suggestions. AI should not create the final artifact for the learner. Evolve - Learner notes what would become harder at L4: more records, more conflicts, less guidance, stronger evidence expectations, and higher decision responsibility. Artifact to submit: L3 Cohort Scheduling Exception Resolution Log. L3 Cohort Scheduling Exception Resolution Log should contain: exception register; case classification; evidence summary; routing decision; escalation reason; closure or follow-up status. Required source data: academic calendar, facilitator roster, room/lab tracker, batch list, holiday calendar, session duration rules, approval notes. Evidence fields: Assess whether each exception has a clear cause, evidence, routing decision, escalation owner, and closure or follow-up status. AI support: AI coach can ask: What source proves this? Which field is missing? What is the risk if this is wrong? Who owns the next action? Learner must answer using the case data, not guesses.',
  1,
  '15 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Ed - School Education
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-003' LIMIT 1),
  'B.Ed - School Education',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Ed - Education Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-003' LIMIT 1),
  'M.Ed - Education Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BA Education
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-003' LIMIT 1),
  'BA Education',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BBA Education Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-003' LIMIT 1),
  'BBA Education Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PG Diploma Education Administration
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-003' LIMIT 1),
  'PG Diploma Education Administration',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Learner Progression Exception Diagnosis, Routing & Escalation Log
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Learner Progression Exception Diagnosis, Routing & Escalation Log',
  'COURSE-L3-008',
  'Learner can diagnose exceptions, select the right route, and document escalation logic for learner progression decisions using attendance, assessment, and participation evidence and submit a workplace-ready L3 Learner Progression Exception Resolution Log. Workplace scenario: A program office has an exception queue linked to learner progression for 126 learners at module-end review. Several cases cannot be completed because attendance, assessment marks, project submissions, and remedial records do not match for 31 learners. The learner must diagnose the cause, separate data errors from policy exceptions, route each case, and prepare an escalation log with reasons. Learner artifact: L3 Learner Progression Exception Resolution Log. Required data: attendance sheet, assessment scores, project submission tracker, remediation log, progression criteria, mentor comments. Evidence: Assess whether each exception has a clear cause, evidence, routing decision, escalation owner, and closure or follow-up status.',
  '15 hours',
  'Active',
  'Formal Education & Lifelong Learning Delivery',
  'technical',
  '["Triggered when an exception diagnosis and escalation task needs a real workplace artifact, not a theory answer.","Demonstrates exception diagnosis and escalation by producing and defending the L3 Learner Progression Exception Resolution Log.","Learner can diagnose exceptions, select the right route, and document escalation logic for learner progression decisions using attendance, assessment, and participation evidence and submit a workplace-ready L3 Learner Progression Exception Resolution Log."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: Module 1: Learner Progression Exception Diagnosis, Routing & Escalation Log Workplace Artifact Build
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-008' LIMIT 1),
  'Module 1: Learner Progression Exception Diagnosis, Routing & Escalation Log Workplace Artifact Build',
  'Triggered when an exception diagnosis and escalation task needs a real workplace artifact, not a theory answer. The learner studies the case, reviews the required data, identifies the gap, creates the artifact, and checks it against evidence fields.',
  1,
  '["Education & Skilling","Formal Education & Lifelong Learning Delivery","IND-CAP-02","L3","Progression rule interpretation","Evidence-based learner routing","Attendance and assessment thresholds","Remediation decision logic","Status tagging"]'::jsonb,
  '["Engage","Explore","Explain","Express","Empower","Evolve","Artifact Build","Evidence Review","AI-Coached Retry"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Case: Learner Progression Exception Diagnosis, Routing & Escalation Log
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-008' LIMIT 1)
   AND title = 'Module 1: Learner Progression Exception Diagnosis, Routing & Escalation Log Workplace Artifact Build' LIMIT 1),
  'Workplace Case: Learner Progression Exception Diagnosis, Routing & Escalation Log',
  'A program office has an exception queue linked to learner progression for 126 learners at module-end review. Several cases cannot be completed because attendance, assessment marks, project submissions, and remedial records do not match for 31 learners. The learner must diagnose the cause, separate data errors from policy exceptions, route each case, and prepare an escalation log with reasons. The learner must solve the problem using the given data and produce the required workplace artifact.',
  'Workplace problem: A program office has an exception queue linked to learner progression for 126 learners at module-end review. Several cases cannot be completed because attendance, assessment marks, project submissions, and remedial records do not match for 31 learners. The learner must diagnose the cause, separate data errors from policy exceptions, route each case, and prepare an escalation log with reasons. Pressure points: Exception pressure: some cases are blocked, learners or staff are waiting, and wrong routing can delay resolution. Learner must show why each case is a data issue, rule issue, owner issue, or escalation issue. Root cause focus: Classify the blocker as data mismatch, learner/staff eligibility issue, rule exception, system limitation, or approval dependency. Major concepts: Progression rule interpretation; Evidence-based learner routing; Attendance and assessment thresholds; Remediation decision logic; Status tagging; Learner handoff note; Exception classification; Escalation threshold; Decision justification. Level focus: exception handling and escalation. Required data: attendance sheet, assessment scores, project submission tracker, remediation log, progression criteria, mentor comments Learner activity flow: Engage - Start with the case: 126 learners at module-end review and the visible pain point — attendance, assessment marks, project submissions, and remedial records do not match for 31 learners. Learner identifies who is affected and what could go wrong if the work is delayed or wrong. Explore - Learner studies the source data: attendance sheet, assessment scores, project submission tracker, remediation log, progression criteria, mentor comments. They mark trusted records, missing fields, conflicting entries, and items that need confirmation before using them in the artifact. Explain - Teach the main logic in simple terms: Progression rule interpretation; Evidence-based learner routing; Attendance and assessment thresholds; Remediation decision logic; Status tagging; Learner handoff note; Exception classification; Escalation threshold; Decision justification. Level focus: exception handling and escalation. Show how rules, evidence, decisions, and handoff notes connect in this workplace task. Express - Learner produces the L3 Learner Progression Exception Resolution Log using the case data, writes decisions in plain English, and shows evidence for each important field instead of giving only a theory answer. Empower - Learner uses AI only as a coach: ask for missing-field checks, clarity prompts, risk questions, and retry suggestions. AI should not create the final artifact for the learner. Evolve - Learner notes what would become harder at L4: more records, more conflicts, less guidance, stronger evidence expectations, and higher decision responsibility. Artifact to submit: L3 Learner Progression Exception Resolution Log. L3 Learner Progression Exception Resolution Log should contain: exception register; case classification; evidence summary; routing decision; escalation reason; closure or follow-up status. Required source data: attendance sheet, assessment scores, project submission tracker, remediation log, progression criteria, mentor comments. Evidence fields: Assess whether each exception has a clear cause, evidence, routing decision, escalation owner, and closure or follow-up status. AI support: AI coach can ask: What source proves this? Which field is missing? What is the risk if this is wrong? Who owns the next action? Learner must answer using the case data, not guesses.',
  1,
  '15 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Ed - School Education
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-008' LIMIT 1),
  'B.Ed - School Education',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Ed - Education Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-008' LIMIT 1),
  'M.Ed - Education Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BA Education
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-008' LIMIT 1),
  'BA Education',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MA Education
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-008' LIMIT 1),
  'MA Education',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Voc Education Operations
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-008' LIMIT 1),
  'B.Voc Education Operations',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Academic Record Activation Exception Diagnosis, Routing & Escalation Log
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Academic Record Activation Exception Diagnosis, Routing & Escalation Log',
  'COURSE-L3-013',
  'Learner can diagnose exceptions, select the right route, and document escalation logic for learner academic records through eligibility, program-rule, and enrollment verification and submit a workplace-ready L3 Academic Record Activation Exception Resolution Log. Workplace scenario: An admissions desk has an exception queue linked to academic record activation for 180 admitted learners before orientation. Several cases cannot be completed because 24 eligibility documents are missing, 11 program codes are wrong, and fee-status updates are not synced in the ERP. The learner must diagnose the cause, separate data errors from policy exceptions, route each case, and prepare an escalation log with reasons. Learner artifact: L3 Academic Record Activation Exception Resolution Log. Required data: eligibility documents, program rules, enrollment forms, ID proof, fee-status sheet, ERP fields, approval trail. Evidence: Assess whether each exception has a clear cause, evidence, routing decision, escalation owner, and closure or follow-up status.',
  '15 hours',
  'Active',
  'Formal Education & Lifelong Learning Delivery',
  'technical',
  '["Triggered when an exception diagnosis and escalation task needs a real workplace artifact, not a theory answer.","Demonstrates exception diagnosis and escalation by producing and defending the L3 Academic Record Activation Exception Resolution Log.","Learner can diagnose exceptions, select the right route, and document escalation logic for learner academic records through eligibility, program-rule, and enrollment verification and submit a workplace-ready L3 Academic Record Activation Exception Resolution Log."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: Module 1: Academic Record Activation Exception Diagnosis, Routing & Escalation Log Workplace Artifact Build
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-013' LIMIT 1),
  'Module 1: Academic Record Activation Exception Diagnosis, Routing & Escalation Log Workplace Artifact Build',
  'Triggered when an exception diagnosis and escalation task needs a real workplace artifact, not a theory answer. The learner studies the case, reviews the required data, identifies the gap, creates the artifact, and checks it against evidence fields.',
  1,
  '["Education & Skilling","Formal Education & Lifelong Learning Delivery","IND-CAP-03","L3","Eligibility verification","Program-rule mapping","Enrollment status control","ERP field accuracy","Missing-document tracking"]'::jsonb,
  '["Engage","Explore","Explain","Express","Empower","Evolve","Artifact Build","Evidence Review","AI-Coached Retry"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Case: Academic Record Activation Exception Diagnosis, Routing & Escalation Log
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-013' LIMIT 1)
   AND title = 'Module 1: Academic Record Activation Exception Diagnosis, Routing & Escalation Log Workplace Artifact Build' LIMIT 1),
  'Workplace Case: Academic Record Activation Exception Diagnosis, Routing & Escalation Log',
  'An admissions desk has an exception queue linked to academic record activation for 180 admitted learners before orientation. Several cases cannot be completed because 24 eligibility documents are missing, 11 program codes are wrong, and fee-status updates are not synced in the ERP. The learner must diagnose the cause, separate data errors from policy exceptions, route each case, and prepare an escalation log with reasons. The learner must solve the problem using the given data and produce the required workplace artifact.',
  'Workplace problem: An admissions desk has an exception queue linked to academic record activation for 180 admitted learners before orientation. Several cases cannot be completed because 24 eligibility documents are missing, 11 program codes are wrong, and fee-status updates are not synced in the ERP. The learner must diagnose the cause, separate data errors from policy exceptions, route each case, and prepare an escalation log with reasons. Pressure points: Exception pressure: some cases are blocked, learners or staff are waiting, and wrong routing can delay resolution. Learner must show why each case is a data issue, rule issue, owner issue, or escalation issue. Root cause focus: Classify the blocker as data mismatch, learner/staff eligibility issue, rule exception, system limitation, or approval dependency. Major concepts: Eligibility verification; Program-rule mapping; Enrollment status control; ERP field accuracy; Missing-document tracking; Activation approval handoff; Exception classification; Escalation threshold; Decision justification. Level focus: exception handling and escalation. Required data: eligibility documents, program rules, enrollment forms, ID proof, fee-status sheet, ERP fields, approval trail Learner activity flow: Engage - Start with the case: 180 admitted learners before orientation and the visible pain point — 24 eligibility documents are missing, 11 program codes are wrong, and fee-status updates are not synced in the ERP. Learner identifies who is affected and what could go wrong if the work is delayed or wrong. Explore - Learner studies the source data: eligibility documents, program rules, enrollment forms, ID proof, fee-status sheet, ERP fields, approval trail. They mark trusted records, missing fields, conflicting entries, and items that need confirmation before using them in the artifact. Explain - Teach the main logic in simple terms: Eligibility verification; Program-rule mapping; Enrollment status control; ERP field accuracy; Missing-document tracking; Activation approval handoff; Exception classification; Escalation threshold; Decision justification. Level focus: exception handling and escalation. Show how rules, evidence, decisions, and handoff notes connect in this workplace task. Express - Learner produces the L3 Academic Record Activation Exception Resolution Log using the case data, writes decisions in plain English, and shows evidence for each important field instead of giving only a theory answer. Empower - Learner uses AI only as a coach: ask for missing-field checks, clarity prompts, risk questions, and retry suggestions. AI should not create the final artifact for the learner. Evolve - Learner notes what would become harder at L4: more records, more conflicts, less guidance, stronger evidence expectations, and higher decision responsibility. Artifact to submit: L3 Academic Record Activation Exception Resolution Log. L3 Academic Record Activation Exception Resolution Log should contain: exception register; case classification; evidence summary; routing decision; escalation reason; closure or follow-up status. Required source data: eligibility documents, program rules, enrollment forms, ID proof, fee-status sheet, ERP fields, approval trail. Evidence fields: Assess whether each exception has a clear cause, evidence, routing decision, escalation owner, and closure or follow-up status. AI support: AI coach can ask: What source proves this? Which field is missing? What is the risk if this is wrong? Who owns the next action? Learner must answer using the case data, not guesses.',
  1,
  '15 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BBA Education Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-013' LIMIT 1),
  'BBA Education Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Com - Education Administration
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-013' LIMIT 1),
  'B.Com - Education Administration',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BA Public Administration
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-013' LIMIT 1),
  'BA Public Administration',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MBA Education Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-013' LIMIT 1),
  'MBA Education Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PG Diploma Higher Education Administration
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-013' LIMIT 1),
  'PG Diploma Higher Education Administration',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Adult Learner Pathway Exception Diagnosis, Routing & Escalation Log
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Adult Learner Pathway Exception Diagnosis, Routing & Escalation Log',
  'COURSE-L3-018',
  'Learner can diagnose exceptions, select the right route, and document escalation logic for adult learner pathways from goals, prior learning, access constraints, and progress evidence and submit a workplace-ready L3 Adult Learner Pathway Exception Resolution Log. Workplace scenario: A lifelong learning centre has an exception queue linked to adult learner pathway for 64 working adult learners. Several cases cannot be completed because learners have mixed prior learning, different shift timings, low device access, and unclear career goals. The learner must diagnose the cause, separate data errors from policy exceptions, route each case, and prepare an escalation log with reasons. Learner artifact: L3 Adult Learner Pathway Exception Resolution Log. Required data: learner goal form, prior learning proof, schedule constraints, device/access survey, language comfort data, course options. Evidence: Assess whether each exception has a clear cause, evidence, routing decision, escalation owner, and closure or follow-up status.',
  '15 hours',
  'Active',
  'Formal Education & Lifelong Learning Delivery',
  'soft',
  '["Triggered when an exception diagnosis and escalation task needs a real workplace artifact, not a theory answer.","Demonstrates exception diagnosis and escalation by producing and defending the L3 Adult Learner Pathway Exception Resolution Log.","Learner can diagnose exceptions, select the right route, and document escalation logic for adult learner pathways from goals, prior learning, access constraints, and progress evidence and submit a workplace-ready L3 Adult Learner Pathway Exception Resolution Log."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: Module 1: Adult Learner Pathway Exception Diagnosis, Routing & Escalation Log Workplace Artifact Build
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-018' LIMIT 1),
  'Module 1: Adult Learner Pathway Exception Diagnosis, Routing & Escalation Log Workplace Artifact Build',
  'Triggered when an exception diagnosis and escalation task needs a real workplace artifact, not a theory answer. The learner studies the case, reviews the required data, identifies the gap, creates the artifact, and checks it against evidence fields.',
  1,
  '["Education & Skilling","Formal Education & Lifelong Learning Delivery","IND-CAP-04","L3","Recognition of prior learning","Flexible pathway planning","Access constraint mapping","Adult motivation factors","Goal-to-course alignment"]'::jsonb,
  '["Engage","Explore","Explain","Express","Empower","Evolve","Artifact Build","Evidence Review","AI-Coached Retry"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Case: Adult Learner Pathway Exception Diagnosis, Routing & Escalation Log
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-018' LIMIT 1)
   AND title = 'Module 1: Adult Learner Pathway Exception Diagnosis, Routing & Escalation Log Workplace Artifact Build' LIMIT 1),
  'Workplace Case: Adult Learner Pathway Exception Diagnosis, Routing & Escalation Log',
  'A lifelong learning centre has an exception queue linked to adult learner pathway for 64 working adult learners. Several cases cannot be completed because learners have mixed prior learning, different shift timings, low device access, and unclear career goals. The learner must diagnose the cause, separate data errors from policy exceptions, route each case, and prepare an escalation log with reasons. The learner must solve the problem using the given data and produce the required workplace artifact.',
  'Workplace problem: A lifelong learning centre has an exception queue linked to adult learner pathway for 64 working adult learners. Several cases cannot be completed because learners have mixed prior learning, different shift timings, low device access, and unclear career goals. The learner must diagnose the cause, separate data errors from policy exceptions, route each case, and prepare an escalation log with reasons. Pressure points: Exception pressure: some cases are blocked, learners or staff are waiting, and wrong routing can delay resolution. Learner must show why each case is a data issue, rule issue, owner issue, or escalation issue. Root cause focus: Classify the blocker as data mismatch, learner/staff eligibility issue, rule exception, system limitation, or approval dependency. Major concepts: Recognition of prior learning; Flexible pathway planning; Access constraint mapping; Adult motivation factors; Goal-to-course alignment; Support routing; Exception classification; Escalation threshold; Decision justification. Level focus: exception handling and escalation. Required data: learner goal form, prior learning proof, schedule constraints, device/access survey, language comfort data, course options Learner activity flow: Engage - Start with the case: 64 working adult learners and the visible pain point — learners have mixed prior learning, different shift timings, low device access, and unclear career goals. Learner identifies who is affected and what could go wrong if the work is delayed or wrong. Explore - Learner studies the source data: learner goal form, prior learning proof, schedule constraints, device/access survey, language comfort data, course options. They mark trusted records, missing fields, conflicting entries, and items that need confirmation before using them in the artifact. Explain - Teach the main logic in simple terms: Recognition of prior learning; Flexible pathway planning; Access constraint mapping; Adult motivation factors; Goal-to-course alignment; Support routing; Exception classification; Escalation threshold; Decision justification. Level focus: exception handling and escalation. Show how rules, evidence, decisions, and handoff notes connect in this workplace task. Express - Learner produces the L3 Adult Learner Pathway Exception Resolution Log using the case data, writes decisions in plain English, and shows evidence for each important field instead of giving only a theory answer. Empower - Learner uses AI only as a coach: ask for missing-field checks, clarity prompts, risk questions, and retry suggestions. AI should not create the final artifact for the learner. Evolve - Learner notes what would become harder at L4: more records, more conflicts, less guidance, stronger evidence expectations, and higher decision responsibility. Artifact to submit: L3 Adult Learner Pathway Exception Resolution Log. L3 Adult Learner Pathway Exception Resolution Log should contain: exception register; case classification; evidence summary; routing decision; escalation reason; closure or follow-up status. Required source data: learner goal form, prior learning proof, schedule constraints, device/access survey, language comfort data, course options. Evidence fields: Assess whether each exception has a clear cause, evidence, routing decision, escalation owner, and closure or follow-up status. AI support: AI coach can ask: What source proves this? Which field is missing? What is the risk if this is wrong? Who owns the next action? Learner must answer using the case data, not guesses.',
  1,
  '15 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BA Education
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-018' LIMIT 1),
  'BA Education',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MA Adult Education
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-018' LIMIT 1),
  'MA Adult Education',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BSW - Community Education
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-018' LIMIT 1),
  'BSW - Community Education',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Voc Skill Development
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-018' LIMIT 1),
  'B.Voc Skill Development',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PG Diploma Lifelong Learning
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-018' LIMIT 1),
  'PG Diploma Lifelong Learning',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Curriculum Mapping Exception Diagnosis, Routing & Escalation Log
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Curriculum Mapping Exception Diagnosis, Routing & Escalation Log',
  'COURSE-L3-023',
  'Learner can diagnose exceptions, select the right route, and document escalation logic for translate standards and role outcomes into curriculum maps, learning sequences, and alignment boundaries and submit a workplace-ready L3 Curriculum Mapping Exception Resolution Log. Workplace scenario: An academic department has an exception queue linked to curriculum mapping for 6 modules and 42 lesson activities. Several cases cannot be completed because learning outcomes, activities, assessments, and workplace evidence do not clearly connect. The learner must diagnose the cause, separate data errors from policy exceptions, route each case, and prepare an escalation log with reasons. Learner artifact: L3 Curriculum Mapping Exception Resolution Log. Required data: syllabus, module outcomes, activity list, assessment plan, competency requirements, evidence expectations. Evidence: Assess whether each exception has a clear cause, evidence, routing decision, escalation owner, and closure or follow-up status.',
  '15 hours',
  'Active',
  'Curriculum, Pedagogy & Learning Design',
  'technical',
  '["Triggered when an exception diagnosis and escalation task needs a real workplace artifact, not a theory answer.","Demonstrates exception diagnosis and escalation by producing and defending the L3 Curriculum Mapping Exception Resolution Log.","Learner can diagnose exceptions, select the right route, and document escalation logic for translate standards and role outcomes into curriculum maps, learning sequences, and alignment boundaries and submit a workplace-ready L3 Curriculum Mapping Exception Resolution Log."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: Module 1: Curriculum Mapping Exception Diagnosis, Routing & Escalation Log Workplace Artifact Build
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-023' LIMIT 1),
  'Module 1: Curriculum Mapping Exception Diagnosis, Routing & Escalation Log Workplace Artifact Build',
  'Triggered when an exception diagnosis and escalation task needs a real workplace artifact, not a theory answer. The learner studies the case, reviews the required data, identifies the gap, creates the artifact, and checks it against evidence fields.',
  1,
  '["Education & Skilling","Curriculum, Pedagogy & Learning Design","IND-CAP-05","L3","Outcome mapping","Constructive alignment","Competency-to-activity link","Assessment coverage check","Gap identification"]'::jsonb,
  '["Engage","Explore","Explain","Express","Empower","Evolve","Artifact Build","Evidence Review","AI-Coached Retry"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Case: Curriculum Mapping Exception Diagnosis, Routing & Escalation Log
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-023' LIMIT 1)
   AND title = 'Module 1: Curriculum Mapping Exception Diagnosis, Routing & Escalation Log Workplace Artifact Build' LIMIT 1),
  'Workplace Case: Curriculum Mapping Exception Diagnosis, Routing & Escalation Log',
  'An academic department has an exception queue linked to curriculum mapping for 6 modules and 42 lesson activities. Several cases cannot be completed because learning outcomes, activities, assessments, and workplace evidence do not clearly connect. The learner must diagnose the cause, separate data errors from policy exceptions, route each case, and prepare an escalation log with reasons. The learner must solve the problem using the given data and produce the required workplace artifact.',
  'Workplace problem: An academic department has an exception queue linked to curriculum mapping for 6 modules and 42 lesson activities. Several cases cannot be completed because learning outcomes, activities, assessments, and workplace evidence do not clearly connect. The learner must diagnose the cause, separate data errors from policy exceptions, route each case, and prepare an escalation log with reasons. Pressure points: Exception pressure: some cases are blocked, learners or staff are waiting, and wrong routing can delay resolution. Learner must show why each case is a data issue, rule issue, owner issue, or escalation issue. Root cause focus: Classify the blocker as data mismatch, learner/staff eligibility issue, rule exception, system limitation, or approval dependency. Major concepts: Outcome mapping; Constructive alignment; Competency-to-activity link; Assessment coverage check; Gap identification; Curriculum evidence map; Exception classification; Escalation threshold; Decision justification. Level focus: exception handling and escalation. Required data: syllabus, module outcomes, activity list, assessment plan, competency requirements, evidence expectations Learner activity flow: Engage - Start with the case: 6 modules and 42 lesson activities and the visible pain point — learning outcomes, activities, assessments, and workplace evidence do not clearly connect. Learner identifies who is affected and what could go wrong if the work is delayed or wrong. Explore - Learner studies the source data: syllabus, module outcomes, activity list, assessment plan, competency requirements, evidence expectations. They mark trusted records, missing fields, conflicting entries, and items that need confirmation before using them in the artifact. Explain - Teach the main logic in simple terms: Outcome mapping; Constructive alignment; Competency-to-activity link; Assessment coverage check; Gap identification; Curriculum evidence map; Exception classification; Escalation threshold; Decision justification. Level focus: exception handling and escalation. Show how rules, evidence, decisions, and handoff notes connect in this workplace task. Express - Learner produces the L3 Curriculum Mapping Exception Resolution Log using the case data, writes decisions in plain English, and shows evidence for each important field instead of giving only a theory answer. Empower - Learner uses AI only as a coach: ask for missing-field checks, clarity prompts, risk questions, and retry suggestions. AI should not create the final artifact for the learner. Evolve - Learner notes what would become harder at L4: more records, more conflicts, less guidance, stronger evidence expectations, and higher decision responsibility. Artifact to submit: L3 Curriculum Mapping Exception Resolution Log. L3 Curriculum Mapping Exception Resolution Log should contain: exception register; case classification; evidence summary; routing decision; escalation reason; closure or follow-up status. Required source data: syllabus, module outcomes, activity list, assessment plan, competency requirements, evidence expectations. Evidence fields: Assess whether each exception has a clear cause, evidence, routing decision, escalation owner, and closure or follow-up status. AI support: AI coach can ask: What source proves this? Which field is missing? What is the risk if this is wrong? Who owns the next action? Learner must answer using the case data, not guesses.',
  1,
  '15 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Ed - Curriculum Studies
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-023' LIMIT 1),
  'B.Ed - Curriculum Studies',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Ed - Curriculum and Instruction
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-023' LIMIT 1),
  'M.Ed - Curriculum and Instruction',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BA Education
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-023' LIMIT 1),
  'BA Education',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MA Education
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-023' LIMIT 1),
  'MA Education',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PG Diploma Instructional Design
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-023' LIMIT 1),
  'PG Diploma Instructional Design',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: e-learning Content Release Exception Diagnosis, Routing & Escalation Log
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'e-learning Content Release Exception Diagnosis, Routing & Escalation Log',
  'COURSE-L3-028',
  'Learner can diagnose exceptions, select the right route, and document escalation logic for release e-learning content through storyboard, asset, accessibility, and qa controls and submit a workplace-ready L3 e-learning Content Release Exception Resolution Log. Workplace scenario: A online course team has an exception queue linked to e-learning content release for 38 digital learning assets for a 4-week course. Several cases cannot be completed because video links, captions, quiz rules, file versions, and mobile previews are inconsistent before launch. The learner must diagnose the cause, separate data errors from policy exceptions, route each case, and prepare an escalation log with reasons. Learner artifact: L3 e-learning Content Release Exception Resolution Log. Required data: content inventory, LMS upload list, video links, caption files, quiz settings, version tracker, QA checklist. Evidence: Assess whether each exception has a clear cause, evidence, routing decision, escalation owner, and closure or follow-up status.',
  '15 hours',
  'Active',
  'Curriculum, Pedagogy & Learning Design',
  'technical',
  '["Triggered when an exception diagnosis and escalation task needs a real workplace artifact, not a theory answer.","Demonstrates exception diagnosis and escalation by producing and defending the L3 e-Learning Content Release Exception Resolution Log.","Learner can diagnose exceptions, select the right route, and document escalation logic for release e-learning content through storyboard, asset, accessibility, and qa controls and submit a workplace-ready L3 e-Learning Content Release Exception Resolution Log."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: Module 1: e-learning Content Release Exception Diagnosis, Routing & Escalation Log Workplace Artifact Build
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-028' LIMIT 1),
  'Module 1: e-learning Content Release Exception Diagnosis, Routing & Escalation Log Workplace Artifact Build',
  'Triggered when an exception diagnosis and escalation task needs a real workplace artifact, not a theory answer. The learner studies the case, reviews the required data, identifies the gap, creates the artifact, and checks it against evidence fields.',
  1,
  '["Education & Skilling","Curriculum, Pedagogy & Learning Design","IND-CAP-06","L3","Digital asset readiness","Version control","Accessibility check","LMS content sequencing","Quiz rule validation"]'::jsonb,
  '["Engage","Explore","Explain","Express","Empower","Evolve","Artifact Build","Evidence Review","AI-Coached Retry"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Case: e-learning Content Release Exception Diagnosis, Routing & Escalation Log
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-028' LIMIT 1)
   AND title = 'Module 1: e-learning Content Release Exception Diagnosis, Routing & Escalation Log Workplace Artifact Build' LIMIT 1),
  'Workplace Case: e-learning Content Release Exception Diagnosis, Routing & Escalation Log',
  'A online course team has an exception queue linked to e-learning content release for 38 digital learning assets for a 4-week course. Several cases cannot be completed because video links, captions, quiz rules, file versions, and mobile previews are inconsistent before launch. The learner must diagnose the cause, separate data errors from policy exceptions, route each case, and prepare an escalation log with reasons. The learner must solve the problem using the given data and produce the required workplace artifact.',
  'Workplace problem: A online course team has an exception queue linked to e-learning content release for 38 digital learning assets for a 4-week course. Several cases cannot be completed because video links, captions, quiz rules, file versions, and mobile previews are inconsistent before launch. The learner must diagnose the cause, separate data errors from policy exceptions, route each case, and prepare an escalation log with reasons. Pressure points: Exception pressure: some cases are blocked, learners or staff are waiting, and wrong routing can delay resolution. Learner must show why each case is a data issue, rule issue, owner issue, or escalation issue. Root cause focus: Classify the blocker as data mismatch, learner/staff eligibility issue, rule exception, system limitation, or approval dependency. Major concepts: Digital asset readiness; Version control; Accessibility check; LMS content sequencing; Quiz rule validation; Release sign-off; Exception classification; Escalation threshold; Decision justification. Level focus: exception handling and escalation. Required data: content inventory, LMS upload list, video links, caption files, quiz settings, version tracker, QA checklist Learner activity flow: Engage - Start with the case: 38 digital learning assets for a 4-week course and the visible pain point — video links, captions, quiz rules, file versions, and mobile previews are inconsistent before launch. Learner identifies who is affected and what could go wrong if the work is delayed or wrong. Explore - Learner studies the source data: content inventory, LMS upload list, video links, caption files, quiz settings, version tracker, QA checklist. They mark trusted records, missing fields, conflicting entries, and items that need confirmation before using them in the artifact. Explain - Teach the main logic in simple terms: Digital asset readiness; Version control; Accessibility check; LMS content sequencing; Quiz rule validation; Release sign-off; Exception classification; Escalation threshold; Decision justification. Level focus: exception handling and escalation. Show how rules, evidence, decisions, and handoff notes connect in this workplace task. Express - Learner produces the L3 e-learning Content Release Exception Resolution Log using the case data, writes decisions in plain English, and shows evidence for each important field instead of giving only a theory answer. Empower - Learner uses AI only as a coach: ask for missing-field checks, clarity prompts, risk questions, and retry suggestions. AI should not create the final artifact for the learner. Evolve - Learner notes what would become harder at L4: more records, more conflicts, less guidance, stronger evidence expectations, and higher decision responsibility. Artifact to submit: L3 e-learning Content Release Exception Resolution Log. L3 e-learning Content Release Exception Resolution Log should contain: exception register; case classification; evidence summary; routing decision; escalation reason; closure or follow-up status. Required source data: content inventory, LMS upload list, video links, caption files, quiz settings, version tracker, QA checklist. Evidence fields: Assess whether each exception has a clear cause, evidence, routing decision, escalation owner, and closure or follow-up status. AI support: AI coach can ask: What source proves this? Which field is missing? What is the risk if this is wrong? Who owns the next action? Learner must answer using the case data, not guesses.',
  1,
  '15 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Ed - Digital Pedagogy
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-028' LIMIT 1),
  'B.Ed - Digital Pedagogy',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Ed - Educational Technology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-028' LIMIT 1),
  'M.Ed - Educational Technology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BCA
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-028' LIMIT 1),
  'BCA',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc IT
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-028' LIMIT 1),
  'B.Sc IT',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PG Diploma Instructional Design
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-028' LIMIT 1),
  'PG Diploma Instructional Design',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Teacher Development Exception Diagnosis, Routing & Escalation Log
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Teacher Development Exception Diagnosis, Routing & Escalation Log',
  'COURSE-L3-033',
  'Learner can diagnose exceptions, select the right route, and document escalation logic for and facilitate teacher development interventions linked to classroom practice gaps and submit a workplace-ready L3 Teacher Development Exception Resolution Log. Workplace scenario: A faculty development cell has an exception queue linked to teacher development for 32 teachers attending a classroom strategy workshop. Several cases cannot be completed because teacher needs, session objectives, practice activities, and feedback tools are not aligned. The learner must diagnose the cause, separate data errors from policy exceptions, route each case, and prepare an escalation log with reasons. Learner artifact: L3 Teacher Development Exception Resolution Log. Required data: teacher needs survey, observation notes, session agenda, practice task sheet, feedback form, attendance list. Evidence: Assess whether each exception has a clear cause, evidence, routing decision, escalation owner, and closure or follow-up status.',
  '15 hours',
  'Active',
  'Curriculum, Pedagogy & Learning Design',
  'soft',
  '["Triggered when an exception diagnosis and escalation task needs a real workplace artifact, not a theory answer.","Demonstrates exception diagnosis and escalation by producing and defending the L3 Teacher Development Exception Resolution Log.","Learner can diagnose exceptions, select the right route, and document escalation logic for and facilitate teacher development interventions linked to classroom practice gaps and submit a workplace-ready L3 Teacher Development Exception Resolution Log."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: Module 1: Teacher Development Exception Diagnosis, Routing & Escalation Log Workplace Artifact Build
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-033' LIMIT 1),
  'Module 1: Teacher Development Exception Diagnosis, Routing & Escalation Log Workplace Artifact Build',
  'Triggered when an exception diagnosis and escalation task needs a real workplace artifact, not a theory answer. The learner studies the case, reviews the required data, identifies the gap, creates the artifact, and checks it against evidence fields.',
  1,
  '["Education & Skilling","Curriculum, Pedagogy & Learning Design","IND-CAP-07","L3","Teacher needs analysis","Training objective design","Practice-based facilitation","Observation evidence","Feedback loop"]'::jsonb,
  '["Engage","Explore","Explain","Express","Empower","Evolve","Artifact Build","Evidence Review","AI-Coached Retry"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Case: Teacher Development Exception Diagnosis, Routing & Escalation Log
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-033' LIMIT 1)
   AND title = 'Module 1: Teacher Development Exception Diagnosis, Routing & Escalation Log Workplace Artifact Build' LIMIT 1),
  'Workplace Case: Teacher Development Exception Diagnosis, Routing & Escalation Log',
  'A faculty development cell has an exception queue linked to teacher development for 32 teachers attending a classroom strategy workshop. Several cases cannot be completed because teacher needs, session objectives, practice activities, and feedback tools are not aligned. The learner must diagnose the cause, separate data errors from policy exceptions, route each case, and prepare an escalation log with reasons. The learner must solve the problem using the given data and produce the required workplace artifact.',
  'Workplace problem: A faculty development cell has an exception queue linked to teacher development for 32 teachers attending a classroom strategy workshop. Several cases cannot be completed because teacher needs, session objectives, practice activities, and feedback tools are not aligned. The learner must diagnose the cause, separate data errors from policy exceptions, route each case, and prepare an escalation log with reasons. Pressure points: Exception pressure: some cases are blocked, learners or staff are waiting, and wrong routing can delay resolution. Learner must show why each case is a data issue, rule issue, owner issue, or escalation issue. Root cause focus: Classify the blocker as data mismatch, learner/staff eligibility issue, rule exception, system limitation, or approval dependency. Major concepts: Teacher needs analysis; Training objective design; Practice-based facilitation; Observation evidence; Feedback loop; Follow-up coaching; Exception classification; Escalation threshold; Decision justification. Level focus: exception handling and escalation. Required data: teacher needs survey, observation notes, session agenda, practice task sheet, feedback form, attendance list Learner activity flow: Engage - Start with the case: 32 teachers attending a classroom strategy workshop and the visible pain point — teacher needs, session objectives, practice activities, and feedback tools are not aligned. Learner identifies who is affected and what could go wrong if the work is delayed or wrong. Explore - Learner studies the source data: teacher needs survey, observation notes, session agenda, practice task sheet, feedback form, attendance list. They mark trusted records, missing fields, conflicting entries, and items that need confirmation before using them in the artifact. Explain - Teach the main logic in simple terms: Teacher needs analysis; Training objective design; Practice-based facilitation; Observation evidence; Feedback loop; Follow-up coaching; Exception classification; Escalation threshold; Decision justification. Level focus: exception handling and escalation. Show how rules, evidence, decisions, and handoff notes connect in this workplace task. Express - Learner produces the L3 Teacher Development Exception Resolution Log using the case data, writes decisions in plain English, and shows evidence for each important field instead of giving only a theory answer. Empower - Learner uses AI only as a coach: ask for missing-field checks, clarity prompts, risk questions, and retry suggestions. AI should not create the final artifact for the learner. Evolve - Learner notes what would become harder at L4: more records, more conflicts, less guidance, stronger evidence expectations, and higher decision responsibility. Artifact to submit: L3 Teacher Development Exception Resolution Log. L3 Teacher Development Exception Resolution Log should contain: exception register; case classification; evidence summary; routing decision; escalation reason; closure or follow-up status. Required source data: teacher needs survey, observation notes, session agenda, practice task sheet, feedback form, attendance list. Evidence fields: Assess whether each exception has a clear cause, evidence, routing decision, escalation owner, and closure or follow-up status. AI support: AI coach can ask: What source proves this? Which field is missing? What is the risk if this is wrong? Who owns the next action? Learner must answer using the case data, not guesses.',
  1,
  '15 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Ed - Teacher Education
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-033' LIMIT 1),
  'B.Ed - Teacher Education',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Ed - Teacher Development
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-033' LIMIT 1),
  'M.Ed - Teacher Development',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MA Education
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-033' LIMIT 1),
  'MA Education',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PG Diploma Faculty Development
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-033' LIMIT 1),
  'PG Diploma Faculty Development',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PG Diploma Educational Leadership
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-033' LIMIT 1),
  'PG Diploma Educational Leadership',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: STEAM Maker-Lab Project Cycle Exception Diagnosis, Routing & Escalation Log
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'STEAM Maker-Lab Project Cycle Exception Diagnosis, Routing & Escalation Log',
  'COURSE-L3-038',
  'Learner can diagnose exceptions, select the right route, and document escalation logic for convert steam project goals into safe, resourced maker-lab learning cycles and submit a workplace-ready L3 STEAM Maker-Lab Project Cycle Exception Resolution Log. Workplace scenario: A school maker lab has an exception queue linked to steam maker-lab project for 5 project teams using 3 shared lab zones. Several cases cannot be completed because materials, safety rules, mentor time, and project milestones are unclear before the lab cycle starts. The learner must diagnose the cause, separate data errors from policy exceptions, route each case, and prepare an escalation log with reasons. Learner artifact: L3 STEAM Maker-Lab Project Cycle Exception Resolution Log. Required data: project brief, material list, safety checklist, lab schedule, mentor roster, team list, milestone tracker. Evidence: Assess whether each exception has a clear cause, evidence, routing decision, escalation owner, and closure or follow-up status.',
  '15 hours',
  'Active',
  'Curriculum, Pedagogy & Learning Design',
  'technical',
  '["Triggered when an exception diagnosis and escalation task needs a real workplace artifact, not a theory answer.","Demonstrates exception diagnosis and escalation by producing and defending the L3 STEAM Maker-Lab Project Cycle Exception Resolution Log.","Learner can diagnose exceptions, select the right route, and document escalation logic for convert steam project goals into safe, resourced maker-lab learning cycles and submit a workplace-ready L3 STEAM Maker-Lab Project Cycle Exception Resolution Log."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: Module 1: STEAM Maker-Lab Project Cycle Exception Diagnosis, Routing & Escalation Log Workplace Artifact Build
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-038' LIMIT 1),
  'Module 1: STEAM Maker-Lab Project Cycle Exception Diagnosis, Routing & Escalation Log Workplace Artifact Build',
  'Triggered when an exception diagnosis and escalation task needs a real workplace artifact, not a theory answer. The learner studies the case, reviews the required data, identifies the gap, creates the artifact, and checks it against evidence fields.',
  1,
  '["Education & Skilling","Curriculum, Pedagogy & Learning Design","IND-CAP-08","L3","Project cycle planning","Lab safety control","Material readiness","Mentor scheduling","Milestone tracking"]'::jsonb,
  '["Engage","Explore","Explain","Express","Empower","Evolve","Artifact Build","Evidence Review","AI-Coached Retry"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Case: STEAM Maker-Lab Project Cycle Exception Diagnosis, Routing & Escalation Log
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-038' LIMIT 1)
   AND title = 'Module 1: STEAM Maker-Lab Project Cycle Exception Diagnosis, Routing & Escalation Log Workplace Artifact Build' LIMIT 1),
  'Workplace Case: STEAM Maker-Lab Project Cycle Exception Diagnosis, Routing & Escalation Log',
  'A school maker lab has an exception queue linked to steam maker-lab project for 5 project teams using 3 shared lab zones. Several cases cannot be completed because materials, safety rules, mentor time, and project milestones are unclear before the lab cycle starts. The learner must diagnose the cause, separate data errors from policy exceptions, route each case, and prepare an escalation log with reasons. The learner must solve the problem using the given data and produce the required workplace artifact.',
  'Workplace problem: A school maker lab has an exception queue linked to steam maker-lab project for 5 project teams using 3 shared lab zones. Several cases cannot be completed because materials, safety rules, mentor time, and project milestones are unclear before the lab cycle starts. The learner must diagnose the cause, separate data errors from policy exceptions, route each case, and prepare an escalation log with reasons. Pressure points: Exception pressure: some cases are blocked, learners or staff are waiting, and wrong routing can delay resolution. Learner must show why each case is a data issue, rule issue, owner issue, or escalation issue. Root cause focus: Classify the blocker as data mismatch, learner/staff eligibility issue, rule exception, system limitation, or approval dependency. Major concepts: Project cycle planning; Lab safety control; Material readiness; Mentor scheduling; Milestone tracking; Student collaboration evidence; Exception classification; Escalation threshold; Decision justification. Level focus: exception handling and escalation. Required data: project brief, material list, safety checklist, lab schedule, mentor roster, team list, milestone tracker Learner activity flow: Engage - Start with the case: 5 project teams using 3 shared lab zones and the visible pain point — materials, safety rules, mentor time, and project milestones are unclear before the lab cycle starts. Learner identifies who is affected and what could go wrong if the work is delayed or wrong. Explore - Learner studies the source data: project brief, material list, safety checklist, lab schedule, mentor roster, team list, milestone tracker. They mark trusted records, missing fields, conflicting entries, and items that need confirmation before using them in the artifact. Explain - Teach the main logic in simple terms: Project cycle planning; Lab safety control; Material readiness; Mentor scheduling; Milestone tracking; Student collaboration evidence; Exception classification; Escalation threshold; Decision justification. Level focus: exception handling and escalation. Show how rules, evidence, decisions, and handoff notes connect in this workplace task. Express - Learner produces the L3 STEAM Maker-Lab Project Cycle Exception Resolution Log using the case data, writes decisions in plain English, and shows evidence for each important field instead of giving only a theory answer. Empower - Learner uses AI only as a coach: ask for missing-field checks, clarity prompts, risk questions, and retry suggestions. AI should not create the final artifact for the learner. Evolve - Learner notes what would become harder at L4: more records, more conflicts, less guidance, stronger evidence expectations, and higher decision responsibility. Artifact to submit: L3 STEAM Maker-Lab Project Cycle Exception Resolution Log. L3 STEAM Maker-Lab Project Cycle Exception Resolution Log should contain: exception register; case classification; evidence summary; routing decision; escalation reason; closure or follow-up status. Required source data: project brief, material list, safety checklist, lab schedule, mentor roster, team list, milestone tracker. Evidence fields: Assess whether each exception has a clear cause, evidence, routing decision, escalation owner, and closure or follow-up status. AI support: AI coach can ask: What source proves this? Which field is missing? What is the risk if this is wrong? Who owns the next action? Learner must answer using the case data, not guesses.',
  1,
  '15 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Ed - Science Education
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-038' LIMIT 1),
  'B.Ed - Science Education',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Science Education
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-038' LIMIT 1),
  'B.Sc Science Education',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech - STEM Education Support
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-038' LIMIT 1),
  'B.Tech - STEM Education Support',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Voc Maker-Lab Facilitation
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-038' LIMIT 1),
  'B.Voc Maker-Lab Facilitation',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PG Diploma Experiential Learning
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-038' LIMIT 1),
  'PG Diploma Experiential Learning',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Vocational Batch Alignment Exception Diagnosis, Routing & Escalation Log
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Vocational Batch Alignment Exception Diagnosis, Routing & Escalation Log',
  'COURSE-L3-043',
  'Learner can diagnose exceptions, select the right route, and document escalation logic for align vocational batches to qualification packs, trainer readiness, and assessment requirements and submit a workplace-ready L3 Vocational Batch Alignment Exception Resolution Log. Workplace scenario: A skill training centre has an exception queue linked to vocational batch alignment for 92 learners in a job-role batch. Several cases cannot be completed because qualification-pack outcomes, trainer availability, tools, practice hours, and assessment windows do not match. The learner must diagnose the cause, separate data errors from policy exceptions, route each case, and prepare an escalation log with reasons. Learner artifact: L3 Vocational Batch Alignment Exception Resolution Log. Required data: qualification pack, trainer roster, equipment list, batch profile, practice-hour plan, assessment schedule. Evidence: Assess whether each exception has a clear cause, evidence, routing decision, escalation owner, and closure or follow-up status.',
  '15 hours',
  'Active',
  'Skilling, Employability & Work-Integrated Learning',
  'technical',
  '["Triggered when an exception diagnosis and escalation task needs a real workplace artifact, not a theory answer.","Demonstrates exception diagnosis and escalation by producing and defending the L3 Vocational Batch Alignment Exception Resolution Log.","Learner can diagnose exceptions, select the right route, and document escalation logic for align vocational batches to qualification packs, trainer readiness, and assessment requirements and submit a workplace-ready L3 Vocational Batch Alignment Exception Resolution Log."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: Module 1: Vocational Batch Alignment Exception Diagnosis, Routing & Escalation Log Workplace Artifact Build
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-043' LIMIT 1),
  'Module 1: Vocational Batch Alignment Exception Diagnosis, Routing & Escalation Log Workplace Artifact Build',
  'Triggered when an exception diagnosis and escalation task needs a real workplace artifact, not a theory answer. The learner studies the case, reviews the required data, identifies the gap, creates the artifact, and checks it against evidence fields.',
  1,
  '["Education & Skilling","Skilling, Employability & Work-Integrated Learning","IND-CAP-09","L3","Qualification-pack interpretation","Batch-to-outcome mapping","Trainer readiness","Equipment and practice-hour planning","Assessment requirement check"]'::jsonb,
  '["Engage","Explore","Explain","Express","Empower","Evolve","Artifact Build","Evidence Review","AI-Coached Retry"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Case: Vocational Batch Alignment Exception Diagnosis, Routing & Escalation Log
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-043' LIMIT 1)
   AND title = 'Module 1: Vocational Batch Alignment Exception Diagnosis, Routing & Escalation Log Workplace Artifact Build' LIMIT 1),
  'Workplace Case: Vocational Batch Alignment Exception Diagnosis, Routing & Escalation Log',
  'A skill training centre has an exception queue linked to vocational batch alignment for 92 learners in a job-role batch. Several cases cannot be completed because qualification-pack outcomes, trainer availability, tools, practice hours, and assessment windows do not match. The learner must diagnose the cause, separate data errors from policy exceptions, route each case, and prepare an escalation log with reasons. The learner must solve the problem using the given data and produce the required workplace artifact.',
  'Workplace problem: A skill training centre has an exception queue linked to vocational batch alignment for 92 learners in a job-role batch. Several cases cannot be completed because qualification-pack outcomes, trainer availability, tools, practice hours, and assessment windows do not match. The learner must diagnose the cause, separate data errors from policy exceptions, route each case, and prepare an escalation log with reasons. Pressure points: Exception pressure: some cases are blocked, learners or staff are waiting, and wrong routing can delay resolution. Learner must show why each case is a data issue, rule issue, owner issue, or escalation issue. Root cause focus: Classify the blocker as data mismatch, learner/staff eligibility issue, rule exception, system limitation, or approval dependency. Major concepts: Qualification-pack interpretation; Batch-to-outcome mapping; Trainer readiness; Equipment and practice-hour planning; Assessment requirement check; Compliance handoff; Exception classification; Escalation threshold; Decision justification. Level focus: exception handling and escalation. Required data: qualification pack, trainer roster, equipment list, batch profile, practice-hour plan, assessment schedule Learner activity flow: Engage - Start with the case: 92 learners in a job-role batch and the visible pain point — qualification-pack outcomes, trainer availability, tools, practice hours, and assessment windows do not match. Learner identifies who is affected and what could go wrong if the work is delayed or wrong. Explore - Learner studies the source data: qualification pack, trainer roster, equipment list, batch profile, practice-hour plan, assessment schedule. They mark trusted records, missing fields, conflicting entries, and items that need confirmation before using them in the artifact. Explain - Teach the main logic in simple terms: Qualification-pack interpretation; Batch-to-outcome mapping; Trainer readiness; Equipment and practice-hour planning; Assessment requirement check; Compliance handoff; Exception classification; Escalation threshold; Decision justification. Level focus: exception handling and escalation. Show how rules, evidence, decisions, and handoff notes connect in this workplace task. Express - Learner produces the L3 Vocational Batch Alignment Exception Resolution Log using the case data, writes decisions in plain English, and shows evidence for each important field instead of giving only a theory answer. Empower - Learner uses AI only as a coach: ask for missing-field checks, clarity prompts, risk questions, and retry suggestions. AI should not create the final artifact for the learner. Evolve - Learner notes what would become harder at L4: more records, more conflicts, less guidance, stronger evidence expectations, and higher decision responsibility. Artifact to submit: L3 Vocational Batch Alignment Exception Resolution Log. L3 Vocational Batch Alignment Exception Resolution Log should contain: exception register; case classification; evidence summary; routing decision; escalation reason; closure or follow-up status. Required source data: qualification pack, trainer roster, equipment list, batch profile, practice-hour plan, assessment schedule. Evidence fields: Assess whether each exception has a clear cause, evidence, routing decision, escalation owner, and closure or follow-up status. AI support: AI coach can ask: What source proves this? Which field is missing? What is the risk if this is wrong? Who owns the next action? Learner must answer using the case data, not guesses.',
  1,
  '15 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Voc - Vocational Education
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-043' LIMIT 1),
  'B.Voc - Vocational Education',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: Diploma in Vocational Training
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-043' LIMIT 1),
  'Diploma in Vocational Training',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BBA Skill Development
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-043' LIMIT 1),
  'BBA Skill Development',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PG Diploma Skill Development
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-043' LIMIT 1),
  'PG Diploma Skill Development',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MBA HR and Training
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-043' LIMIT 1),
  'MBA HR and Training',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Skilling Delivery & Placement Readiness Exception Diagnosis, Routing & Escalation Log
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Skilling Delivery & Placement Readiness Exception Diagnosis, Routing & Escalation Log',
  'COURSE-L3-048',
  'Learner can diagnose exceptions, select the right route, and document escalation logic for monitor skilling delivery and placement readiness through attendance, practice, and employability evidence and submit a workplace-ready L3 Skilling Delivery & Placement Readiness Exception Resolution Log. Workplace scenario: A employability cell has an exception queue linked to placement readiness for 115 learners before employer interviews. Several cases cannot be completed because resume status, mock interview scores, attendance, skill gaps, and employer criteria are scattered. The learner must diagnose the cause, separate data errors from policy exceptions, route each case, and prepare an escalation log with reasons. Learner artifact: L3 Skilling Delivery & Placement Readiness Exception Resolution Log. Required data: learner profile, resume tracker, mock interview scores, attendance, employer criteria, skill-gap notes. Evidence: Assess whether each exception has a clear cause, evidence, routing decision, escalation owner, and closure or follow-up status.',
  '15 hours',
  'Active',
  'Skilling, Employability & Work-Integrated Learning',
  'technical',
  '["Triggered when an exception diagnosis and escalation task needs a real workplace artifact, not a theory answer.","Demonstrates exception diagnosis and escalation by producing and defending the L3 Skilling Delivery & Placement Readiness Exception Resolution Log.","Learner can diagnose exceptions, select the right route, and document escalation logic for monitor skilling delivery and placement readiness through attendance, practice, and employability evidence and submit a workplace-ready L3 Skilling Delivery & Placement Readiness Exception Resolution Log."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: Module 1: Skilling Delivery & Placement Readiness Exception Diagnosis, Routing & Escalation Log Workplace Artifact Build
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-048' LIMIT 1),
  'Module 1: Skilling Delivery & Placement Readiness Exception Diagnosis, Routing & Escalation Log Workplace Artifact Build',
  'Triggered when an exception diagnosis and escalation task needs a real workplace artifact, not a theory answer. The learner studies the case, reviews the required data, identifies the gap, creates the artifact, and checks it against evidence fields.',
  1,
  '["Education & Skilling","Skilling, Employability & Work-Integrated Learning","IND-CAP-10","L3","Employability readiness indicators","Employer criteria matching","Resume and interview evidence","Readiness scoring","Shortlist logic"]'::jsonb,
  '["Engage","Explore","Explain","Express","Empower","Evolve","Artifact Build","Evidence Review","AI-Coached Retry"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Case: Skilling Delivery & Placement Readiness Exception Diagnosis, Routing & Escalation Log
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-048' LIMIT 1)
   AND title = 'Module 1: Skilling Delivery & Placement Readiness Exception Diagnosis, Routing & Escalation Log Workplace Artifact Build' LIMIT 1),
  'Workplace Case: Skilling Delivery & Placement Readiness Exception Diagnosis, Routing & Escalation Log',
  'A employability cell has an exception queue linked to placement readiness for 115 learners before employer interviews. Several cases cannot be completed because resume status, mock interview scores, attendance, skill gaps, and employer criteria are scattered. The learner must diagnose the cause, separate data errors from policy exceptions, route each case, and prepare an escalation log with reasons. The learner must solve the problem using the given data and produce the required workplace artifact.',
  'Workplace problem: A employability cell has an exception queue linked to placement readiness for 115 learners before employer interviews. Several cases cannot be completed because resume status, mock interview scores, attendance, skill gaps, and employer criteria are scattered. The learner must diagnose the cause, separate data errors from policy exceptions, route each case, and prepare an escalation log with reasons. Pressure points: Exception pressure: some cases are blocked, learners or staff are waiting, and wrong routing can delay resolution. Learner must show why each case is a data issue, rule issue, owner issue, or escalation issue. Root cause focus: Classify the blocker as data mismatch, learner/staff eligibility issue, rule exception, system limitation, or approval dependency. Major concepts: Employability readiness indicators; Employer criteria matching; Resume and interview evidence; Readiness scoring; Shortlist logic; Placement handoff; Exception classification; Escalation threshold; Decision justification. Level focus: exception handling and escalation. Required data: learner profile, resume tracker, mock interview scores, attendance, employer criteria, skill-gap notes Learner activity flow: Engage - Start with the case: 115 learners before employer interviews and the visible pain point — resume status, mock interview scores, attendance, skill gaps, and employer criteria are scattered. Learner identifies who is affected and what could go wrong if the work is delayed or wrong. Explore - Learner studies the source data: learner profile, resume tracker, mock interview scores, attendance, employer criteria, skill-gap notes. They mark trusted records, missing fields, conflicting entries, and items that need confirmation before using them in the artifact. Explain - Teach the main logic in simple terms: Employability readiness indicators; Employer criteria matching; Resume and interview evidence; Readiness scoring; Shortlist logic; Placement handoff; Exception classification; Escalation threshold; Decision justification. Level focus: exception handling and escalation. Show how rules, evidence, decisions, and handoff notes connect in this workplace task. Express - Learner produces the L3 Skilling Delivery & Placement Readiness Exception Resolution Log using the case data, writes decisions in plain English, and shows evidence for each important field instead of giving only a theory answer. Empower - Learner uses AI only as a coach: ask for missing-field checks, clarity prompts, risk questions, and retry suggestions. AI should not create the final artifact for the learner. Evolve - Learner notes what would become harder at L4: more records, more conflicts, less guidance, stronger evidence expectations, and higher decision responsibility. Artifact to submit: L3 Skilling Delivery & Placement Readiness Exception Resolution Log. L3 Skilling Delivery & Placement Readiness Exception Resolution Log should contain: exception register; case classification; evidence summary; routing decision; escalation reason; closure or follow-up status. Required source data: learner profile, resume tracker, mock interview scores, attendance, employer criteria, skill-gap notes. Evidence fields: Assess whether each exception has a clear cause, evidence, routing decision, escalation owner, and closure or follow-up status. AI support: AI coach can ask: What source proves this? Which field is missing? What is the risk if this is wrong? Who owns the next action? Learner must answer using the case data, not guesses.',
  1,
  '15 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Voc - Skill Development
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-048' LIMIT 1),
  'B.Voc - Skill Development',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BBA Training and Placement
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-048' LIMIT 1),
  'BBA Training and Placement',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MBA HR
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-048' LIMIT 1),
  'MBA HR',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PG Diploma Employability Training
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-048' LIMIT 1),
  'PG Diploma Employability Training',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MSW - Livelihood Programs
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-048' LIMIT 1),
  'MSW - Livelihood Programs',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Internship & Apprenticeship Matching Exception Diagnosis, Routing & Escalation Log
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Internship & Apprenticeship Matching Exception Diagnosis, Routing & Escalation Log',
  'COURSE-L3-053',
  'Learner can diagnose exceptions, select the right route, and document escalation logic for match learners to internship and apprenticeship opportunities using eligibility, employer, and learning-plan evidence and submit a workplace-ready L3 Internship & Apprenticeship Matching Exception Resolution Log. Workplace scenario: A internship office has an exception queue linked to internship matching for 86 eligible learners and 27 employer slots. Several cases cannot be completed because locations, stipend rules, joining dates, skill requirements, and eligibility conditions conflict. The learner must diagnose the cause, separate data errors from policy exceptions, route each case, and prepare an escalation log with reasons. Learner artifact: L3 Internship & Apprenticeship Matching Exception Resolution Log. Required data: learner preference form, employer slot list, eligibility rules, location constraints, stipend details, joining deadlines. Evidence: Assess whether each exception has a clear cause, evidence, routing decision, escalation owner, and closure or follow-up status.',
  '15 hours',
  'Active',
  'Skilling, Employability & Work-Integrated Learning',
  'technical',
  '["Triggered when an exception diagnosis and escalation task needs a real workplace artifact, not a theory answer.","Demonstrates exception diagnosis and escalation by producing and defending the L3 Internship & Apprenticeship Matching Exception Resolution Log.","Learner can diagnose exceptions, select the right route, and document escalation logic for match learners to internship and apprenticeship opportunities using eligibility, employer, and learning-plan evidence and submit a workplace-ready L3 Internship & Apprenticeship Matching Exception Resolution Log."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: Module 1: Internship & Apprenticeship Matching Exception Diagnosis, Routing & Escalation Log Workplace Artifact Build
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-053' LIMIT 1),
  'Module 1: Internship & Apprenticeship Matching Exception Diagnosis, Routing & Escalation Log Workplace Artifact Build',
  'Triggered when an exception diagnosis and escalation task needs a real workplace artifact, not a theory answer. The learner studies the case, reviews the required data, identifies the gap, creates the artifact, and checks it against evidence fields.',
  1,
  '["Education & Skilling","Skilling, Employability & Work-Integrated Learning","IND-CAP-11","L3","Eligibility matching","Employer requirement mapping","Learner preference handling","Constraint-based shortlisting","Justification note"]'::jsonb,
  '["Engage","Explore","Explain","Express","Empower","Evolve","Artifact Build","Evidence Review","AI-Coached Retry"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Case: Internship & Apprenticeship Matching Exception Diagnosis, Routing & Escalation Log
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-053' LIMIT 1)
   AND title = 'Module 1: Internship & Apprenticeship Matching Exception Diagnosis, Routing & Escalation Log Workplace Artifact Build' LIMIT 1),
  'Workplace Case: Internship & Apprenticeship Matching Exception Diagnosis, Routing & Escalation Log',
  'A internship office has an exception queue linked to internship matching for 86 eligible learners and 27 employer slots. Several cases cannot be completed because locations, stipend rules, joining dates, skill requirements, and eligibility conditions conflict. The learner must diagnose the cause, separate data errors from policy exceptions, route each case, and prepare an escalation log with reasons. The learner must solve the problem using the given data and produce the required workplace artifact.',
  'Workplace problem: A internship office has an exception queue linked to internship matching for 86 eligible learners and 27 employer slots. Several cases cannot be completed because locations, stipend rules, joining dates, skill requirements, and eligibility conditions conflict. The learner must diagnose the cause, separate data errors from policy exceptions, route each case, and prepare an escalation log with reasons. Pressure points: Exception pressure: some cases are blocked, learners or staff are waiting, and wrong routing can delay resolution. Learner must show why each case is a data issue, rule issue, owner issue, or escalation issue. Root cause focus: Classify the blocker as data mismatch, learner/staff eligibility issue, rule exception, system limitation, or approval dependency. Major concepts: Eligibility matching; Employer requirement mapping; Learner preference handling; Constraint-based shortlisting; Justification note; Joining risk tracking; Exception classification; Escalation threshold; Decision justification. Level focus: exception handling and escalation. Required data: learner preference form, employer slot list, eligibility rules, location constraints, stipend details, joining deadlines Learner activity flow: Engage - Start with the case: 86 eligible learners and 27 employer slots and the visible pain point — locations, stipend rules, joining dates, skill requirements, and eligibility conditions conflict. Learner identifies who is affected and what could go wrong if the work is delayed or wrong. Explore - Learner studies the source data: learner preference form, employer slot list, eligibility rules, location constraints, stipend details, joining deadlines. They mark trusted records, missing fields, conflicting entries, and items that need confirmation before using them in the artifact. Explain - Teach the main logic in simple terms: Eligibility matching; Employer requirement mapping; Learner preference handling; Constraint-based shortlisting; Justification note; Joining risk tracking; Exception classification; Escalation threshold; Decision justification. Level focus: exception handling and escalation. Show how rules, evidence, decisions, and handoff notes connect in this workplace task. Express - Learner produces the L3 Internship & Apprenticeship Matching Exception Resolution Log using the case data, writes decisions in plain English, and shows evidence for each important field instead of giving only a theory answer. Empower - Learner uses AI only as a coach: ask for missing-field checks, clarity prompts, risk questions, and retry suggestions. AI should not create the final artifact for the learner. Evolve - Learner notes what would become harder at L4: more records, more conflicts, less guidance, stronger evidence expectations, and higher decision responsibility. Artifact to submit: L3 Internship & Apprenticeship Matching Exception Resolution Log. L3 Internship & Apprenticeship Matching Exception Resolution Log should contain: exception register; case classification; evidence summary; routing decision; escalation reason; closure or follow-up status. Required source data: learner preference form, employer slot list, eligibility rules, location constraints, stipend details, joining deadlines. Evidence fields: Assess whether each exception has a clear cause, evidence, routing decision, escalation owner, and closure or follow-up status. AI support: AI coach can ask: What source proves this? Which field is missing? What is the risk if this is wrong? Who owns the next action? Learner must answer using the case data, not guesses.',
  1,
  '15 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Voc - Work Integrated Learning
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-053' LIMIT 1),
  'B.Voc - Work Integrated Learning',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BBA HR
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-053' LIMIT 1),
  'BBA HR',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MBA HR
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-053' LIMIT 1),
  'MBA HR',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PG Diploma Apprenticeship Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-053' LIMIT 1),
  'PG Diploma Apprenticeship Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PG Diploma Internship Coordination
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-053' LIMIT 1),
  'PG Diploma Internship Coordination',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Corporate L&D Needs Transfer Exception Diagnosis, Routing & Escalation Log
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Corporate L&D Needs Transfer Exception Diagnosis, Routing & Escalation Log',
  'COURSE-L3-058',
  'Learner can diagnose exceptions, select the right route, and document escalation logic for diagnose corporate learning needs and track transfer evidence against business performance objectives and submit a workplace-ready L3 Corporate L&D Needs Transfer Exception Resolution Log. Workplace scenario: A corporate learning team has an exception queue linked to corporate l&d needs transfer for 4 departments and 210 employees. Several cases cannot be completed because manager requests, performance gaps, business priorities, and training expectations are mixed together. The learner must diagnose the cause, separate data errors from policy exceptions, route each case, and prepare an escalation log with reasons. Learner artifact: L3 Corporate L&D Needs Transfer Exception Resolution Log. Required data: manager request forms, performance data, business priority notes, learner profile, budget constraints, timeline. Evidence: Assess whether each exception has a clear cause, evidence, routing decision, escalation owner, and closure or follow-up status.',
  '15 hours',
  'Active',
  'Skilling, Employability & Work-Integrated Learning',
  'soft',
  '["Triggered when an exception diagnosis and escalation task needs a real workplace artifact, not a theory answer.","Demonstrates exception diagnosis and escalation by producing and defending the L3 Corporate L&D Needs Transfer Exception Resolution Log.","Learner can diagnose exceptions, select the right route, and document escalation logic for diagnose corporate learning needs and track transfer evidence against business performance objectives and submit a workplace-ready L3 Corporate L&D Needs Transfer Exception Resolution Log."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: Module 1: Corporate L&D Needs Transfer Exception Diagnosis, Routing & Escalation Log Workplace Artifact Build
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-058' LIMIT 1),
  'Module 1: Corporate L&D Needs Transfer Exception Diagnosis, Routing & Escalation Log Workplace Artifact Build',
  'Triggered when an exception diagnosis and escalation task needs a real workplace artifact, not a theory answer. The learner studies the case, reviews the required data, identifies the gap, creates the artifact, and checks it against evidence fields.',
  1,
  '["Education & Skilling","Skilling, Employability & Work-Integrated Learning","IND-CAP-12","L3","Needs analysis","Business-to-learning translation","Stakeholder requirement capture","Performance gap framing","Training priority matrix"]'::jsonb,
  '["Engage","Explore","Explain","Express","Empower","Evolve","Artifact Build","Evidence Review","AI-Coached Retry"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Case: Corporate L&D Needs Transfer Exception Diagnosis, Routing & Escalation Log
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-058' LIMIT 1)
   AND title = 'Module 1: Corporate L&D Needs Transfer Exception Diagnosis, Routing & Escalation Log Workplace Artifact Build' LIMIT 1),
  'Workplace Case: Corporate L&D Needs Transfer Exception Diagnosis, Routing & Escalation Log',
  'A corporate learning team has an exception queue linked to corporate l&d needs transfer for 4 departments and 210 employees. Several cases cannot be completed because manager requests, performance gaps, business priorities, and training expectations are mixed together. The learner must diagnose the cause, separate data errors from policy exceptions, route each case, and prepare an escalation log with reasons. The learner must solve the problem using the given data and produce the required workplace artifact.',
  'Workplace problem: A corporate learning team has an exception queue linked to corporate l&d needs transfer for 4 departments and 210 employees. Several cases cannot be completed because manager requests, performance gaps, business priorities, and training expectations are mixed together. The learner must diagnose the cause, separate data errors from policy exceptions, route each case, and prepare an escalation log with reasons. Pressure points: Exception pressure: some cases are blocked, learners or staff are waiting, and wrong routing can delay resolution. Learner must show why each case is a data issue, rule issue, owner issue, or escalation issue. Root cause focus: Classify the blocker as data mismatch, learner/staff eligibility issue, rule exception, system limitation, or approval dependency. Major concepts: Needs analysis; Business-to-learning translation; Stakeholder requirement capture; Performance gap framing; Training priority matrix; L&D handoff; Exception classification; Escalation threshold; Decision justification. Level focus: exception handling and escalation. Required data: manager request forms, performance data, business priority notes, learner profile, budget constraints, timeline Learner activity flow: Engage - Start with the case: 4 departments and 210 employees and the visible pain point — manager requests, performance gaps, business priorities, and training expectations are mixed together. Learner identifies who is affected and what could go wrong if the work is delayed or wrong. Explore - Learner studies the source data: manager request forms, performance data, business priority notes, learner profile, budget constraints, timeline. They mark trusted records, missing fields, conflicting entries, and items that need confirmation before using them in the artifact. Explain - Teach the main logic in simple terms: Needs analysis; Business-to-learning translation; Stakeholder requirement capture; Performance gap framing; Training priority matrix; L&D handoff; Exception classification; Escalation threshold; Decision justification. Level focus: exception handling and escalation. Show how rules, evidence, decisions, and handoff notes connect in this workplace task. Express - Learner produces the L3 Corporate L&D Needs Transfer Exception Resolution Log using the case data, writes decisions in plain English, and shows evidence for each important field instead of giving only a theory answer. Empower - Learner uses AI only as a coach: ask for missing-field checks, clarity prompts, risk questions, and retry suggestions. AI should not create the final artifact for the learner. Evolve - Learner notes what would become harder at L4: more records, more conflicts, less guidance, stronger evidence expectations, and higher decision responsibility. Artifact to submit: L3 Corporate L&D Needs Transfer Exception Resolution Log. L3 Corporate L&D Needs Transfer Exception Resolution Log should contain: exception register; case classification; evidence summary; routing decision; escalation reason; closure or follow-up status. Required source data: manager request forms, performance data, business priority notes, learner profile, budget constraints, timeline. Evidence fields: Assess whether each exception has a clear cause, evidence, routing decision, escalation owner, and closure or follow-up status. AI support: AI coach can ask: What source proves this? Which field is missing? What is the risk if this is wrong? Who owns the next action? Learner must answer using the case data, not guesses.',
  1,
  '15 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BBA HR
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-058' LIMIT 1),
  'BBA HR',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MBA HR and L&D
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-058' LIMIT 1),
  'MBA HR and L&D',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PG Diploma Learning and Development
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-058' LIMIT 1),
  'PG Diploma Learning and Development',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MA Human Resource Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-058' LIMIT 1),
  'MA Human Resource Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Voc Corporate Training
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-058' LIMIT 1),
  'B.Voc Corporate Training',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: LMS Course Shell Launch Exception Diagnosis, Routing & Escalation Log
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'LMS Course Shell Launch Exception Diagnosis, Routing & Escalation Log',
  'COURSE-L3-063',
  'Learner can diagnose exceptions, select the right route, and document escalation logic for configure lms course shells, enrollment rules, permissions, and completion controls for launch readiness and submit a workplace-ready L3 LMS Course Shell Launch Exception Resolution Log. Workplace scenario: A digital skilling platform has an exception queue linked to lms course shell launch for 3 batches and 240 learners. Several cases cannot be completed because module sequence, completion rules, facilitator permissions, and certificate trigger are incomplete. The learner must diagnose the cause, separate data errors from policy exceptions, route each case, and prepare an escalation log with reasons. Learner artifact: L3 LMS Course Shell Launch Exception Resolution Log. Required data: course outline, LMS shell settings, user roles, completion rules, certificate settings, batch enrollment list. Evidence: Assess whether each exception has a clear cause, evidence, routing decision, escalation owner, and closure or follow-up status.',
  '15 hours',
  'Active',
  'Digital Learning Platforms & Distributed Learning Operations',
  'technical',
  '["Triggered when an exception diagnosis and escalation task needs a real workplace artifact, not a theory answer.","Demonstrates exception diagnosis and escalation by producing and defending the L3 LMS Course Shell Launch Exception Resolution Log.","Learner can diagnose exceptions, select the right route, and document escalation logic for configure lms course shells, enrollment rules, permissions, and completion controls for launch readiness and submit a workplace-ready L3 LMS Course Shell Launch Exception Resolution Log."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: Module 1: LMS Course Shell Launch Exception Diagnosis, Routing & Escalation Log Workplace Artifact Build
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-063' LIMIT 1),
  'Module 1: LMS Course Shell Launch Exception Diagnosis, Routing & Escalation Log Workplace Artifact Build',
  'Triggered when an exception diagnosis and escalation task needs a real workplace artifact, not a theory answer. The learner studies the case, reviews the required data, identifies the gap, creates the artifact, and checks it against evidence fields.',
  1,
  '["Education & Skilling","Digital Learning Platforms & Distributed Learning Operations","IND-CAP-13","L3","LMS course architecture","Enrollment and role permissions","Completion rule setup","Certificate trigger logic","Launch readiness testing"]'::jsonb,
  '["Engage","Explore","Explain","Express","Empower","Evolve","Artifact Build","Evidence Review","AI-Coached Retry"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Case: LMS Course Shell Launch Exception Diagnosis, Routing & Escalation Log
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-063' LIMIT 1)
   AND title = 'Module 1: LMS Course Shell Launch Exception Diagnosis, Routing & Escalation Log Workplace Artifact Build' LIMIT 1),
  'Workplace Case: LMS Course Shell Launch Exception Diagnosis, Routing & Escalation Log',
  'A digital skilling platform has an exception queue linked to lms course shell launch for 3 batches and 240 learners. Several cases cannot be completed because module sequence, completion rules, facilitator permissions, and certificate trigger are incomplete. The learner must diagnose the cause, separate data errors from policy exceptions, route each case, and prepare an escalation log with reasons. The learner must solve the problem using the given data and produce the required workplace artifact.',
  'Workplace problem: A digital skilling platform has an exception queue linked to lms course shell launch for 3 batches and 240 learners. Several cases cannot be completed because module sequence, completion rules, facilitator permissions, and certificate trigger are incomplete. The learner must diagnose the cause, separate data errors from policy exceptions, route each case, and prepare an escalation log with reasons. Pressure points: Exception pressure: some cases are blocked, learners or staff are waiting, and wrong routing can delay resolution. Learner must show why each case is a data issue, rule issue, owner issue, or escalation issue. Root cause focus: Classify the blocker as data mismatch, learner/staff eligibility issue, rule exception, system limitation, or approval dependency. Major concepts: LMS course architecture; Enrollment and role permissions; Completion rule setup; Certificate trigger logic; Launch readiness testing; Learner access validation; Exception classification; Escalation threshold; Decision justification. Level focus: exception handling and escalation. Required data: course outline, LMS shell settings, user roles, completion rules, certificate settings, batch enrollment list Learner activity flow: Engage - Start with the case: 3 batches and 240 learners and the visible pain point — module sequence, completion rules, facilitator permissions, and certificate trigger are incomplete. Learner identifies who is affected and what could go wrong if the work is delayed or wrong. Explore - Learner studies the source data: course outline, LMS shell settings, user roles, completion rules, certificate settings, batch enrollment list. They mark trusted records, missing fields, conflicting entries, and items that need confirmation before using them in the artifact. Explain - Teach the main logic in simple terms: LMS course architecture; Enrollment and role permissions; Completion rule setup; Certificate trigger logic; Launch readiness testing; Learner access validation; Exception classification; Escalation threshold; Decision justification. Level focus: exception handling and escalation. Show how rules, evidence, decisions, and handoff notes connect in this workplace task. Express - Learner produces the L3 LMS Course Shell Launch Exception Resolution Log using the case data, writes decisions in plain English, and shows evidence for each important field instead of giving only a theory answer. Empower - Learner uses AI only as a coach: ask for missing-field checks, clarity prompts, risk questions, and retry suggestions. AI should not create the final artifact for the learner. Evolve - Learner notes what would become harder at L4: more records, more conflicts, less guidance, stronger evidence expectations, and higher decision responsibility. Artifact to submit: L3 LMS Course Shell Launch Exception Resolution Log. L3 LMS Course Shell Launch Exception Resolution Log should contain: exception register; case classification; evidence summary; routing decision; escalation reason; closure or follow-up status. Required source data: course outline, LMS shell settings, user roles, completion rules, certificate settings, batch enrollment list. Evidence fields: Assess whether each exception has a clear cause, evidence, routing decision, escalation owner, and closure or follow-up status. AI support: AI coach can ask: What source proves this? Which field is missing? What is the risk if this is wrong? Who owns the next action? Learner must answer using the case data, not guesses.',
  1,
  '15 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BCA
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-063' LIMIT 1),
  'BCA',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc IT
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-063' LIMIT 1),
  'B.Sc IT',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Ed - Educational Technology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-063' LIMIT 1),
  'B.Ed - Educational Technology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Ed - Educational Technology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-063' LIMIT 1),
  'M.Ed - Educational Technology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PG Diploma LMS Administration
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-063' LIMIT 1),
  'PG Diploma LMS Administration',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Digital Learner Engagement Nudge Exception Diagnosis, Routing & Escalation Log
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Digital Learner Engagement Nudge Exception Diagnosis, Routing & Escalation Log',
  'COURSE-L3-068',
  'Learner can diagnose exceptions, select the right route, and document escalation logic for monitor digital learner activity and trigger timely nudges from platform engagement evidence and submit a workplace-ready L3 Digital Learner Engagement Nudge Exception Resolution Log. Workplace scenario: A online learning support desk has an exception queue linked to digital engagement nudge for 312 active learners in week 2. Several cases cannot be completed because 96 learners have low logins, 48 have missed quizzes, and support messages are not targeted. The learner must diagnose the cause, separate data errors from policy exceptions, route each case, and prepare an escalation log with reasons. Learner artifact: L3 Digital Learner Engagement Nudge Exception Resolution Log. Required data: login analytics, quiz completion, video watch data, support tickets, learner segments, nudge templates. Evidence: Assess whether each exception has a clear cause, evidence, routing decision, escalation owner, and closure or follow-up status.',
  '15 hours',
  'Active',
  'Digital Learning Platforms & Distributed Learning Operations',
  'soft',
  '["Triggered when an exception diagnosis and escalation task needs a real workplace artifact, not a theory answer.","Demonstrates exception diagnosis and escalation by producing and defending the L3 Digital Learner Engagement Nudge Exception Resolution Log.","Learner can diagnose exceptions, select the right route, and document escalation logic for monitor digital learner activity and trigger timely nudges from platform engagement evidence and submit a workplace-ready L3 Digital Learner Engagement Nudge Exception Resolution Log."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: Module 1: Digital Learner Engagement Nudge Exception Diagnosis, Routing & Escalation Log Workplace Artifact Build
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-068' LIMIT 1),
  'Module 1: Digital Learner Engagement Nudge Exception Diagnosis, Routing & Escalation Log Workplace Artifact Build',
  'Triggered when an exception diagnosis and escalation task needs a real workplace artifact, not a theory answer. The learner studies the case, reviews the required data, identifies the gap, creates the artifact, and checks it against evidence fields.',
  1,
  '["Education & Skilling","Digital Learning Platforms & Distributed Learning Operations","IND-CAP-14","L3","Engagement analytics","Learner segmentation","Nudge design","Risk indicator reading","Message timing"]'::jsonb,
  '["Engage","Explore","Explain","Express","Empower","Evolve","Artifact Build","Evidence Review","AI-Coached Retry"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Case: Digital Learner Engagement Nudge Exception Diagnosis, Routing & Escalation Log
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-068' LIMIT 1)
   AND title = 'Module 1: Digital Learner Engagement Nudge Exception Diagnosis, Routing & Escalation Log Workplace Artifact Build' LIMIT 1),
  'Workplace Case: Digital Learner Engagement Nudge Exception Diagnosis, Routing & Escalation Log',
  'A online learning support desk has an exception queue linked to digital engagement nudge for 312 active learners in week 2. Several cases cannot be completed because 96 learners have low logins, 48 have missed quizzes, and support messages are not targeted. The learner must diagnose the cause, separate data errors from policy exceptions, route each case, and prepare an escalation log with reasons. The learner must solve the problem using the given data and produce the required workplace artifact.',
  'Workplace problem: A online learning support desk has an exception queue linked to digital engagement nudge for 312 active learners in week 2. Several cases cannot be completed because 96 learners have low logins, 48 have missed quizzes, and support messages are not targeted. The learner must diagnose the cause, separate data errors from policy exceptions, route each case, and prepare an escalation log with reasons. Pressure points: Exception pressure: some cases are blocked, learners or staff are waiting, and wrong routing can delay resolution. Learner must show why each case is a data issue, rule issue, owner issue, or escalation issue. Root cause focus: Classify the blocker as data mismatch, learner/staff eligibility issue, rule exception, system limitation, or approval dependency. Major concepts: Engagement analytics; Learner segmentation; Nudge design; Risk indicator reading; Message timing; Follow-up tracking; Exception classification; Escalation threshold; Decision justification. Level focus: exception handling and escalation. Required data: login analytics, quiz completion, video watch data, support tickets, learner segments, nudge templates Learner activity flow: Engage - Start with the case: 312 active learners in week 2 and the visible pain point — 96 learners have low logins, 48 have missed quizzes, and support messages are not targeted. Learner identifies who is affected and what could go wrong if the work is delayed or wrong. Explore - Learner studies the source data: login analytics, quiz completion, video watch data, support tickets, learner segments, nudge templates. They mark trusted records, missing fields, conflicting entries, and items that need confirmation before using them in the artifact. Explain - Teach the main logic in simple terms: Engagement analytics; Learner segmentation; Nudge design; Risk indicator reading; Message timing; Follow-up tracking; Exception classification; Escalation threshold; Decision justification. Level focus: exception handling and escalation. Show how rules, evidence, decisions, and handoff notes connect in this workplace task. Express - Learner produces the L3 Digital Learner Engagement Nudge Exception Resolution Log using the case data, writes decisions in plain English, and shows evidence for each important field instead of giving only a theory answer. Empower - Learner uses AI only as a coach: ask for missing-field checks, clarity prompts, risk questions, and retry suggestions. AI should not create the final artifact for the learner. Evolve - Learner notes what would become harder at L4: more records, more conflicts, less guidance, stronger evidence expectations, and higher decision responsibility. Artifact to submit: L3 Digital Learner Engagement Nudge Exception Resolution Log. L3 Digital Learner Engagement Nudge Exception Resolution Log should contain: exception register; case classification; evidence summary; routing decision; escalation reason; closure or follow-up status. Required source data: login analytics, quiz completion, video watch data, support tickets, learner segments, nudge templates. Evidence fields: Assess whether each exception has a clear cause, evidence, routing decision, escalation owner, and closure or follow-up status. AI support: AI coach can ask: What source proves this? Which field is missing? What is the risk if this is wrong? Who owns the next action? Learner must answer using the case data, not guesses.',
  1,
  '15 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BCA
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-068' LIMIT 1),
  'BCA',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc IT
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-068' LIMIT 1),
  'B.Sc IT',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BA Communication
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-068' LIMIT 1),
  'BA Communication',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Ed - Digital Learning
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-068' LIMIT 1),
  'B.Ed - Digital Learning',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PG Diploma Digital Learning Engagement
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-068' LIMIT 1),
  'PG Diploma Digital Learning Engagement',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Remote Cohort Facilitation Control Exception Diagnosis, Routing & Escalation Log
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Remote Cohort Facilitation Control Exception Diagnosis, Routing & Escalation Log',
  'COURSE-L3-073',
  'Learner can diagnose exceptions, select the right route, and document escalation logic for control remote cohort facilitation through session access, participation, and digital delivery evidence and submit a workplace-ready L3 Remote Cohort Facilitation Control Exception Resolution Log. Workplace scenario: A distance learning team has an exception queue linked to remote cohort facilitation for 4 online cohorts across 2 time zones. Several cases cannot be completed because attendance, breakout activities, facilitator notes, and learner questions are not captured consistently. The learner must diagnose the cause, separate data errors from policy exceptions, route each case, and prepare an escalation log with reasons. Learner artifact: L3 Remote Cohort Facilitation Control Exception Resolution Log. Required data: online session roster, attendance export, chat/Q&A log, breakout task evidence, facilitator notes, issue log. Evidence: Assess whether each exception has a clear cause, evidence, routing decision, escalation owner, and closure or follow-up status.',
  '15 hours',
  'Active',
  'Digital Learning Platforms & Distributed Learning Operations',
  'soft',
  '["Triggered when an exception diagnosis and escalation task needs a real workplace artifact, not a theory answer.","Demonstrates exception diagnosis and escalation by producing and defending the L3 Remote Cohort Facilitation Control Exception Resolution Log.","Learner can diagnose exceptions, select the right route, and document escalation logic for control remote cohort facilitation through session access, participation, and digital delivery evidence and submit a workplace-ready L3 Remote Cohort Facilitation Control Exception Resolution Log."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: Module 1: Remote Cohort Facilitation Control Exception Diagnosis, Routing & Escalation Log Workplace Artifact Build
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-073' LIMIT 1),
  'Module 1: Remote Cohort Facilitation Control Exception Diagnosis, Routing & Escalation Log Workplace Artifact Build',
  'Triggered when an exception diagnosis and escalation task needs a real workplace artifact, not a theory answer. The learner studies the case, reviews the required data, identifies the gap, creates the artifact, and checks it against evidence fields.',
  1,
  '["Education & Skilling","Digital Learning Platforms & Distributed Learning Operations","IND-CAP-15","L3","Remote facilitation control","Attendance and participation capture","Breakout evidence tracking","Live issue handling","Session closure note"]'::jsonb,
  '["Engage","Explore","Explain","Express","Empower","Evolve","Artifact Build","Evidence Review","AI-Coached Retry"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Case: Remote Cohort Facilitation Control Exception Diagnosis, Routing & Escalation Log
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-073' LIMIT 1)
   AND title = 'Module 1: Remote Cohort Facilitation Control Exception Diagnosis, Routing & Escalation Log Workplace Artifact Build' LIMIT 1),
  'Workplace Case: Remote Cohort Facilitation Control Exception Diagnosis, Routing & Escalation Log',
  'A distance learning team has an exception queue linked to remote cohort facilitation for 4 online cohorts across 2 time zones. Several cases cannot be completed because attendance, breakout activities, facilitator notes, and learner questions are not captured consistently. The learner must diagnose the cause, separate data errors from policy exceptions, route each case, and prepare an escalation log with reasons. The learner must solve the problem using the given data and produce the required workplace artifact.',
  'Workplace problem: A distance learning team has an exception queue linked to remote cohort facilitation for 4 online cohorts across 2 time zones. Several cases cannot be completed because attendance, breakout activities, facilitator notes, and learner questions are not captured consistently. The learner must diagnose the cause, separate data errors from policy exceptions, route each case, and prepare an escalation log with reasons. Pressure points: Exception pressure: some cases are blocked, learners or staff are waiting, and wrong routing can delay resolution. Learner must show why each case is a data issue, rule issue, owner issue, or escalation issue. Root cause focus: Classify the blocker as data mismatch, learner/staff eligibility issue, rule exception, system limitation, or approval dependency. Major concepts: Remote facilitation control; Attendance and participation capture; Breakout evidence tracking; Live issue handling; Session closure note; Cohort follow-up; Exception classification; Escalation threshold; Decision justification. Level focus: exception handling and escalation. Required data: online session roster, attendance export, chat/Q&A log, breakout task evidence, facilitator notes, issue log Learner activity flow: Engage - Start with the case: 4 online cohorts across 2 time zones and the visible pain point — attendance, breakout activities, facilitator notes, and learner questions are not captured consistently. Learner identifies who is affected and what could go wrong if the work is delayed or wrong. Explore - Learner studies the source data: online session roster, attendance export, chat/Q&A log, breakout task evidence, facilitator notes, issue log. They mark trusted records, missing fields, conflicting entries, and items that need confirmation before using them in the artifact. Explain - Teach the main logic in simple terms: Remote facilitation control; Attendance and participation capture; Breakout evidence tracking; Live issue handling; Session closure note; Cohort follow-up; Exception classification; Escalation threshold; Decision justification. Level focus: exception handling and escalation. Show how rules, evidence, decisions, and handoff notes connect in this workplace task. Express - Learner produces the L3 Remote Cohort Facilitation Control Exception Resolution Log using the case data, writes decisions in plain English, and shows evidence for each important field instead of giving only a theory answer. Empower - Learner uses AI only as a coach: ask for missing-field checks, clarity prompts, risk questions, and retry suggestions. AI should not create the final artifact for the learner. Evolve - Learner notes what would become harder at L4: more records, more conflicts, less guidance, stronger evidence expectations, and higher decision responsibility. Artifact to submit: L3 Remote Cohort Facilitation Control Exception Resolution Log. L3 Remote Cohort Facilitation Control Exception Resolution Log should contain: exception register; case classification; evidence summary; routing decision; escalation reason; closure or follow-up status. Required source data: online session roster, attendance export, chat/Q&A log, breakout task evidence, facilitator notes, issue log. Evidence fields: Assess whether each exception has a clear cause, evidence, routing decision, escalation owner, and closure or follow-up status. AI support: AI coach can ask: What source proves this? Which field is missing? What is the risk if this is wrong? Who owns the next action? Learner must answer using the case data, not guesses.',
  1,
  '15 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Ed - Online Teaching
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-073' LIMIT 1),
  'B.Ed - Online Teaching',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Ed - Educational Technology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-073' LIMIT 1),
  'M.Ed - Educational Technology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BA Education
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-073' LIMIT 1),
  'BA Education',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PG Diploma Online and Distance Learning
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-073' LIMIT 1),
  'PG Diploma Online and Distance Learning',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PG Diploma Virtual Facilitation
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-073' LIMIT 1),
  'PG Diploma Virtual Facilitation',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Tutoring Support Routing Exception Diagnosis, Routing & Escalation Log
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Tutoring Support Routing Exception Diagnosis, Routing & Escalation Log',
  'COURSE-L3-078',
  'Learner can diagnose exceptions, select the right route, and document escalation logic for tutoring support requests using academic need, availability, and intervention-fit evidence and submit a workplace-ready L3 Tutoring Support Routing Exception Resolution Log. Workplace scenario: An academic support centre has an exception queue linked to tutoring support routing for 74 learners requesting support. Several cases cannot be completed because some learners need concept help, some need language support, and some have attendance or confidence issues. The learner must diagnose the cause, separate data errors from policy exceptions, route each case, and prepare an escalation log with reasons. Learner artifact: L3 Tutoring Support Routing Exception Resolution Log. Required data: support request form, diagnostic quiz, attendance record, tutor availability, learner notes, priority rules. Evidence: Assess whether each exception has a clear cause, evidence, routing decision, escalation owner, and closure or follow-up status.',
  '15 hours',
  'Active',
  'Digital Learning Platforms & Distributed Learning Operations',
  'soft',
  '["Triggered when an exception diagnosis and escalation task needs a real workplace artifact, not a theory answer.","Demonstrates exception diagnosis and escalation by producing and defending the L3 Tutoring Support Routing Exception Resolution Log.","Learner can diagnose exceptions, select the right route, and document escalation logic for tutoring support requests using academic need, availability, and intervention-fit evidence and submit a workplace-ready L3 Tutoring Support Routing Exception Resolution Log."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: Module 1: Tutoring Support Routing Exception Diagnosis, Routing & Escalation Log Workplace Artifact Build
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-078' LIMIT 1),
  'Module 1: Tutoring Support Routing Exception Diagnosis, Routing & Escalation Log Workplace Artifact Build',
  'Triggered when an exception diagnosis and escalation task needs a real workplace artifact, not a theory answer. The learner studies the case, reviews the required data, identifies the gap, creates the artifact, and checks it against evidence fields.',
  1,
  '["Education & Skilling","Digital Learning Platforms & Distributed Learning Operations","IND-CAP-16","L3","Support need classification","Diagnostic evidence reading","Tutor matching","Priority routing","Support session planning"]'::jsonb,
  '["Engage","Explore","Explain","Express","Empower","Evolve","Artifact Build","Evidence Review","AI-Coached Retry"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Case: Tutoring Support Routing Exception Diagnosis, Routing & Escalation Log
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-078' LIMIT 1)
   AND title = 'Module 1: Tutoring Support Routing Exception Diagnosis, Routing & Escalation Log Workplace Artifact Build' LIMIT 1),
  'Workplace Case: Tutoring Support Routing Exception Diagnosis, Routing & Escalation Log',
  'An academic support centre has an exception queue linked to tutoring support routing for 74 learners requesting support. Several cases cannot be completed because some learners need concept help, some need language support, and some have attendance or confidence issues. The learner must diagnose the cause, separate data errors from policy exceptions, route each case, and prepare an escalation log with reasons. The learner must solve the problem using the given data and produce the required workplace artifact.',
  'Workplace problem: An academic support centre has an exception queue linked to tutoring support routing for 74 learners requesting support. Several cases cannot be completed because some learners need concept help, some need language support, and some have attendance or confidence issues. The learner must diagnose the cause, separate data errors from policy exceptions, route each case, and prepare an escalation log with reasons. Pressure points: Exception pressure: some cases are blocked, learners or staff are waiting, and wrong routing can delay resolution. Learner must show why each case is a data issue, rule issue, owner issue, or escalation issue. Root cause focus: Classify the blocker as data mismatch, learner/staff eligibility issue, rule exception, system limitation, or approval dependency. Major concepts: Support need classification; Diagnostic evidence reading; Tutor matching; Priority routing; Support session planning; Progress follow-up; Exception classification; Escalation threshold; Decision justification. Level focus: exception handling and escalation. Required data: support request form, diagnostic quiz, attendance record, tutor availability, learner notes, priority rules Learner activity flow: Engage - Start with the case: 74 learners requesting support and the visible pain point — some learners need concept help, some need language support, and some have attendance or confidence issues. Learner identifies who is affected and what could go wrong if the work is delayed or wrong. Explore - Learner studies the source data: support request form, diagnostic quiz, attendance record, tutor availability, learner notes, priority rules. They mark trusted records, missing fields, conflicting entries, and items that need confirmation before using them in the artifact. Explain - Teach the main logic in simple terms: Support need classification; Diagnostic evidence reading; Tutor matching; Priority routing; Support session planning; Progress follow-up; Exception classification; Escalation threshold; Decision justification. Level focus: exception handling and escalation. Show how rules, evidence, decisions, and handoff notes connect in this workplace task. Express - Learner produces the L3 Tutoring Support Routing Exception Resolution Log using the case data, writes decisions in plain English, and shows evidence for each important field instead of giving only a theory answer. Empower - Learner uses AI only as a coach: ask for missing-field checks, clarity prompts, risk questions, and retry suggestions. AI should not create the final artifact for the learner. Evolve - Learner notes what would become harder at L4: more records, more conflicts, less guidance, stronger evidence expectations, and higher decision responsibility. Artifact to submit: L3 Tutoring Support Routing Exception Resolution Log. L3 Tutoring Support Routing Exception Resolution Log should contain: exception register; case classification; evidence summary; routing decision; escalation reason; closure or follow-up status. Required source data: support request form, diagnostic quiz, attendance record, tutor availability, learner notes, priority rules. Evidence fields: Assess whether each exception has a clear cause, evidence, routing decision, escalation owner, and closure or follow-up status. AI support: AI coach can ask: What source proves this? Which field is missing? What is the risk if this is wrong? Who owns the next action? Learner must answer using the case data, not guesses.',
  1,
  '15 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Ed - Subject Tutoring
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-078' LIMIT 1),
  'B.Ed - Subject Tutoring',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BA Education
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-078' LIMIT 1),
  'BA Education',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Education
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-078' LIMIT 1),
  'B.Sc Education',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PG Diploma Tutoring and Coaching
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-078' LIMIT 1),
  'PG Diploma Tutoring and Coaching',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PG Diploma Inclusive Learning Support
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-078' LIMIT 1),
  'PG Diploma Inclusive Learning Support',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Assessment Blueprinting Exception Diagnosis, Routing & Escalation Log
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Assessment Blueprinting Exception Diagnosis, Routing & Escalation Log',
  'COURSE-L3-083',
  'Learner can diagnose exceptions, select the right route, and document escalation logic for build assessment blueprints and items aligned to competency level, evidence standard, and validity requirements and submit a workplace-ready L3 Assessment Blueprinting Exception Resolution Log. Workplace scenario: An assessment design team has an exception queue linked to assessment blueprinting for 60 questions across 5 outcomes. Several cases cannot be completed because items do not match competency levels, evidence requirements, marks, or difficulty balance. The learner must diagnose the cause, separate data errors from policy exceptions, route each case, and prepare an escalation log with reasons. Learner artifact: L3 Assessment Blueprinting Exception Resolution Log. Required data: learning outcomes, item bank, marks table, difficulty tags, competency map, rubric draft. Evidence: Assess whether each exception has a clear cause, evidence, routing decision, escalation owner, and closure or follow-up status.',
  '15 hours',
  'Active',
  'Assessment, Certification & Credentialing',
  'technical',
  '["Triggered when an exception diagnosis and escalation task needs a real workplace artifact, not a theory answer.","Demonstrates exception diagnosis and escalation by producing and defending the L3 Assessment Blueprinting Exception Resolution Log.","Learner can diagnose exceptions, select the right route, and document escalation logic for build assessment blueprints and items aligned to competency level, evidence standard, and validity requirements and submit a workplace-ready L3 Assessment Blueprinting Exception Resolution Log."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: Module 1: Assessment Blueprinting Exception Diagnosis, Routing & Escalation Log Workplace Artifact Build
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-083' LIMIT 1),
  'Module 1: Assessment Blueprinting Exception Diagnosis, Routing & Escalation Log Workplace Artifact Build',
  'Triggered when an exception diagnosis and escalation task needs a real workplace artifact, not a theory answer. The learner studies the case, reviews the required data, identifies the gap, creates the artifact, and checks it against evidence fields.',
  1,
  '["Education & Skilling","Assessment, Certification & Credentialing","IND-CAP-17","L3","Assessment blueprinting","Outcome-item alignment","Difficulty distribution","Marks weighting","Evidence validity"]'::jsonb,
  '["Engage","Explore","Explain","Express","Empower","Evolve","Artifact Build","Evidence Review","AI-Coached Retry"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Case: Assessment Blueprinting Exception Diagnosis, Routing & Escalation Log
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-083' LIMIT 1)
   AND title = 'Module 1: Assessment Blueprinting Exception Diagnosis, Routing & Escalation Log Workplace Artifact Build' LIMIT 1),
  'Workplace Case: Assessment Blueprinting Exception Diagnosis, Routing & Escalation Log',
  'An assessment design team has an exception queue linked to assessment blueprinting for 60 questions across 5 outcomes. Several cases cannot be completed because items do not match competency levels, evidence requirements, marks, or difficulty balance. The learner must diagnose the cause, separate data errors from policy exceptions, route each case, and prepare an escalation log with reasons. The learner must solve the problem using the given data and produce the required workplace artifact.',
  'Workplace problem: An assessment design team has an exception queue linked to assessment blueprinting for 60 questions across 5 outcomes. Several cases cannot be completed because items do not match competency levels, evidence requirements, marks, or difficulty balance. The learner must diagnose the cause, separate data errors from policy exceptions, route each case, and prepare an escalation log with reasons. Pressure points: Exception pressure: some cases are blocked, learners or staff are waiting, and wrong routing can delay resolution. Learner must show why each case is a data issue, rule issue, owner issue, or escalation issue. Root cause focus: Classify the blocker as data mismatch, learner/staff eligibility issue, rule exception, system limitation, or approval dependency. Major concepts: Assessment blueprinting; Outcome-item alignment; Difficulty distribution; Marks weighting; Evidence validity; Rubric linkage; Exception classification; Escalation threshold; Decision justification. Level focus: exception handling and escalation. Required data: learning outcomes, item bank, marks table, difficulty tags, competency map, rubric draft Learner activity flow: Engage - Start with the case: 60 questions across 5 outcomes and the visible pain point — items do not match competency levels, evidence requirements, marks, or difficulty balance. Learner identifies who is affected and what could go wrong if the work is delayed or wrong. Explore - Learner studies the source data: learning outcomes, item bank, marks table, difficulty tags, competency map, rubric draft. They mark trusted records, missing fields, conflicting entries, and items that need confirmation before using them in the artifact. Explain - Teach the main logic in simple terms: Assessment blueprinting; Outcome-item alignment; Difficulty distribution; Marks weighting; Evidence validity; Rubric linkage; Exception classification; Escalation threshold; Decision justification. Level focus: exception handling and escalation. Show how rules, evidence, decisions, and handoff notes connect in this workplace task. Express - Learner produces the L3 Assessment Blueprinting Exception Resolution Log using the case data, writes decisions in plain English, and shows evidence for each important field instead of giving only a theory answer. Empower - Learner uses AI only as a coach: ask for missing-field checks, clarity prompts, risk questions, and retry suggestions. AI should not create the final artifact for the learner. Evolve - Learner notes what would become harder at L4: more records, more conflicts, less guidance, stronger evidence expectations, and higher decision responsibility. Artifact to submit: L3 Assessment Blueprinting Exception Resolution Log. L3 Assessment Blueprinting Exception Resolution Log should contain: exception register; case classification; evidence summary; routing decision; escalation reason; closure or follow-up status. Required source data: learning outcomes, item bank, marks table, difficulty tags, competency map, rubric draft. Evidence fields: Assess whether each exception has a clear cause, evidence, routing decision, escalation owner, and closure or follow-up status. AI support: AI coach can ask: What source proves this? Which field is missing? What is the risk if this is wrong? Who owns the next action? Learner must answer using the case data, not guesses.',
  1,
  '15 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Ed - Assessment Design
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-083' LIMIT 1),
  'B.Ed - Assessment Design',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Ed - Assessment and Evaluation
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-083' LIMIT 1),
  'M.Ed - Assessment and Evaluation',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MA Education
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-083' LIMIT 1),
  'MA Education',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PG Diploma Educational Assessment
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-083' LIMIT 1),
  'PG Diploma Educational Assessment',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PG Diploma Instructional Design
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-083' LIMIT 1),
  'PG Diploma Instructional Design',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Rubric Evaluation Review Exception Diagnosis, Routing & Escalation Log
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Rubric Evaluation Review Exception Diagnosis, Routing & Escalation Log',
  'COURSE-L3-088',
  'Learner can diagnose exceptions, select the right route, and document escalation logic for apply rubrics and score reviews to produce fair, evidence-based learner evaluation decisions and submit a workplace-ready L3 Rubric Evaluation Review Exception Resolution Log. Workplace scenario: A evaluation moderation team has an exception queue linked to rubric evaluation for 45 submitted artifacts from 3 sections. Several cases cannot be completed because evaluators are scoring differently, feedback quality varies, and borderline cases are unclear. The learner must diagnose the cause, separate data errors from policy exceptions, route each case, and prepare an escalation log with reasons. Learner artifact: L3 Rubric Evaluation Review Exception Resolution Log. Required data: rubric, learner artifacts, evaluator scores, feedback comments, moderation notes, sample answers. Evidence: Assess whether each exception has a clear cause, evidence, routing decision, escalation owner, and closure or follow-up status.',
  '15 hours',
  'Active',
  'Assessment, Certification & Credentialing',
  'technical',
  '["Triggered when an exception diagnosis and escalation task needs a real workplace artifact, not a theory answer.","Demonstrates exception diagnosis and escalation by producing and defending the L3 Rubric Evaluation Review Exception Resolution Log.","Learner can diagnose exceptions, select the right route, and document escalation logic for apply rubrics and score reviews to produce fair, evidence-based learner evaluation decisions and submit a workplace-ready L3 Rubric Evaluation Review Exception Resolution Log."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: Module 1: Rubric Evaluation Review Exception Diagnosis, Routing & Escalation Log Workplace Artifact Build
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-088' LIMIT 1),
  'Module 1: Rubric Evaluation Review Exception Diagnosis, Routing & Escalation Log Workplace Artifact Build',
  'Triggered when an exception diagnosis and escalation task needs a real workplace artifact, not a theory answer. The learner studies the case, reviews the required data, identifies the gap, creates the artifact, and checks it against evidence fields.',
  1,
  '["Education & Skilling","Assessment, Certification & Credentialing","IND-CAP-18","L3","Rubric interpretation","Evidence-based scoring","Inter-rater consistency","Feedback quality","Moderation decision"]'::jsonb,
  '["Engage","Explore","Explain","Express","Empower","Evolve","Artifact Build","Evidence Review","AI-Coached Retry"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Case: Rubric Evaluation Review Exception Diagnosis, Routing & Escalation Log
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-088' LIMIT 1)
   AND title = 'Module 1: Rubric Evaluation Review Exception Diagnosis, Routing & Escalation Log Workplace Artifact Build' LIMIT 1),
  'Workplace Case: Rubric Evaluation Review Exception Diagnosis, Routing & Escalation Log',
  'A evaluation moderation team has an exception queue linked to rubric evaluation for 45 submitted artifacts from 3 sections. Several cases cannot be completed because evaluators are scoring differently, feedback quality varies, and borderline cases are unclear. The learner must diagnose the cause, separate data errors from policy exceptions, route each case, and prepare an escalation log with reasons. The learner must solve the problem using the given data and produce the required workplace artifact.',
  'Workplace problem: A evaluation moderation team has an exception queue linked to rubric evaluation for 45 submitted artifacts from 3 sections. Several cases cannot be completed because evaluators are scoring differently, feedback quality varies, and borderline cases are unclear. The learner must diagnose the cause, separate data errors from policy exceptions, route each case, and prepare an escalation log with reasons. Pressure points: Exception pressure: some cases are blocked, learners or staff are waiting, and wrong routing can delay resolution. Learner must show why each case is a data issue, rule issue, owner issue, or escalation issue. Root cause focus: Classify the blocker as data mismatch, learner/staff eligibility issue, rule exception, system limitation, or approval dependency. Major concepts: Rubric interpretation; Evidence-based scoring; Inter-rater consistency; Feedback quality; Moderation decision; Borderline case handling; Exception classification; Escalation threshold; Decision justification. Level focus: exception handling and escalation. Required data: rubric, learner artifacts, evaluator scores, feedback comments, moderation notes, sample answers Learner activity flow: Engage - Start with the case: 45 submitted artifacts from 3 sections and the visible pain point — evaluators are scoring differently, feedback quality varies, and borderline cases are unclear. Learner identifies who is affected and what could go wrong if the work is delayed or wrong. Explore - Learner studies the source data: rubric, learner artifacts, evaluator scores, feedback comments, moderation notes, sample answers. They mark trusted records, missing fields, conflicting entries, and items that need confirmation before using them in the artifact. Explain - Teach the main logic in simple terms: Rubric interpretation; Evidence-based scoring; Inter-rater consistency; Feedback quality; Moderation decision; Borderline case handling; Exception classification; Escalation threshold; Decision justification. Level focus: exception handling and escalation. Show how rules, evidence, decisions, and handoff notes connect in this workplace task. Express - Learner produces the L3 Rubric Evaluation Review Exception Resolution Log using the case data, writes decisions in plain English, and shows evidence for each important field instead of giving only a theory answer. Empower - Learner uses AI only as a coach: ask for missing-field checks, clarity prompts, risk questions, and retry suggestions. AI should not create the final artifact for the learner. Evolve - Learner notes what would become harder at L4: more records, more conflicts, less guidance, stronger evidence expectations, and higher decision responsibility. Artifact to submit: L3 Rubric Evaluation Review Exception Resolution Log. L3 Rubric Evaluation Review Exception Resolution Log should contain: exception register; case classification; evidence summary; routing decision; escalation reason; closure or follow-up status. Required source data: rubric, learner artifacts, evaluator scores, feedback comments, moderation notes, sample answers. Evidence fields: Assess whether each exception has a clear cause, evidence, routing decision, escalation owner, and closure or follow-up status. AI support: AI coach can ask: What source proves this? Which field is missing? What is the risk if this is wrong? Who owns the next action? Learner must answer using the case data, not guesses.',
  1,
  '15 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Ed - Assessment Practice
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-088' LIMIT 1),
  'B.Ed - Assessment Practice',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Ed - Evaluation Studies
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-088' LIMIT 1),
  'M.Ed - Evaluation Studies',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MA Education
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-088' LIMIT 1),
  'MA Education',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PG Diploma Assessment and Rubrics
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-088' LIMIT 1),
  'PG Diploma Assessment and Rubrics',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PG Diploma Coaching Evaluation
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-088' LIMIT 1),
  'PG Diploma Coaching Evaluation',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Credential Issuance Exception Diagnosis, Routing & Escalation Log
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Credential Issuance Exception Diagnosis, Routing & Escalation Log',
  'COURSE-L3-093',
  'Learner can diagnose exceptions, select the right route, and document escalation logic for issue credentials through eligibility, assessment completion, and certification record verification and submit a workplace-ready L3 Credential Issuance Exception Resolution Log. Workplace scenario: A certification office has an exception queue linked to credential issuance for 138 learners marked complete. Several cases cannot be completed because identity details, assessment completion, payment status, and approval records do not match for 19 learners. The learner must diagnose the cause, separate data errors from policy exceptions, route each case, and prepare an escalation log with reasons. Learner artifact: L3 Credential Issuance Exception Resolution Log. Required data: completion report, assessment result sheet, learner ID records, payment/status file, approval list, certificate template. Evidence: Assess whether each exception has a clear cause, evidence, routing decision, escalation owner, and closure or follow-up status.',
  '15 hours',
  'Active',
  'Assessment, Certification & Credentialing',
  'technical',
  '["Triggered when an exception diagnosis and escalation task needs a real workplace artifact, not a theory answer.","Demonstrates exception diagnosis and escalation by producing and defending the L3 Credential Issuance Exception Resolution Log.","Learner can diagnose exceptions, select the right route, and document escalation logic for issue credentials through eligibility, assessment completion, and certification record verification and submit a workplace-ready L3 Credential Issuance Exception Resolution Log."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: Module 1: Credential Issuance Exception Diagnosis, Routing & Escalation Log Workplace Artifact Build
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-093' LIMIT 1),
  'Module 1: Credential Issuance Exception Diagnosis, Routing & Escalation Log Workplace Artifact Build',
  'Triggered when an exception diagnosis and escalation task needs a real workplace artifact, not a theory answer. The learner studies the case, reviews the required data, identifies the gap, creates the artifact, and checks it against evidence fields.',
  1,
  '["Education & Skilling","Assessment, Certification & Credentialing","IND-CAP-19","L3","Credential eligibility","Completion verification","Identity data matching","Certificate data control","Approval workflow"]'::jsonb,
  '["Engage","Explore","Explain","Express","Empower","Evolve","Artifact Build","Evidence Review","AI-Coached Retry"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Case: Credential Issuance Exception Diagnosis, Routing & Escalation Log
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-093' LIMIT 1)
   AND title = 'Module 1: Credential Issuance Exception Diagnosis, Routing & Escalation Log Workplace Artifact Build' LIMIT 1),
  'Workplace Case: Credential Issuance Exception Diagnosis, Routing & Escalation Log',
  'A certification office has an exception queue linked to credential issuance for 138 learners marked complete. Several cases cannot be completed because identity details, assessment completion, payment status, and approval records do not match for 19 learners. The learner must diagnose the cause, separate data errors from policy exceptions, route each case, and prepare an escalation log with reasons. The learner must solve the problem using the given data and produce the required workplace artifact.',
  'Workplace problem: A certification office has an exception queue linked to credential issuance for 138 learners marked complete. Several cases cannot be completed because identity details, assessment completion, payment status, and approval records do not match for 19 learners. The learner must diagnose the cause, separate data errors from policy exceptions, route each case, and prepare an escalation log with reasons. Pressure points: Exception pressure: some cases are blocked, learners or staff are waiting, and wrong routing can delay resolution. Learner must show why each case is a data issue, rule issue, owner issue, or escalation issue. Root cause focus: Classify the blocker as data mismatch, learner/staff eligibility issue, rule exception, system limitation, or approval dependency. Major concepts: Credential eligibility; Completion verification; Identity data matching; Certificate data control; Approval workflow; Issuance audit trail; Exception classification; Escalation threshold; Decision justification. Level focus: exception handling and escalation. Required data: completion report, assessment result sheet, learner ID records, payment/status file, approval list, certificate template Learner activity flow: Engage - Start with the case: 138 learners marked complete and the visible pain point — identity details, assessment completion, payment status, and approval records do not match for 19 learners. Learner identifies who is affected and what could go wrong if the work is delayed or wrong. Explore - Learner studies the source data: completion report, assessment result sheet, learner ID records, payment/status file, approval list, certificate template. They mark trusted records, missing fields, conflicting entries, and items that need confirmation before using them in the artifact. Explain - Teach the main logic in simple terms: Credential eligibility; Completion verification; Identity data matching; Certificate data control; Approval workflow; Issuance audit trail; Exception classification; Escalation threshold; Decision justification. Level focus: exception handling and escalation. Show how rules, evidence, decisions, and handoff notes connect in this workplace task. Express - Learner produces the L3 Credential Issuance Exception Resolution Log using the case data, writes decisions in plain English, and shows evidence for each important field instead of giving only a theory answer. Empower - Learner uses AI only as a coach: ask for missing-field checks, clarity prompts, risk questions, and retry suggestions. AI should not create the final artifact for the learner. Evolve - Learner notes what would become harder at L4: more records, more conflicts, less guidance, stronger evidence expectations, and higher decision responsibility. Artifact to submit: L3 Credential Issuance Exception Resolution Log. L3 Credential Issuance Exception Resolution Log should contain: exception register; case classification; evidence summary; routing decision; escalation reason; closure or follow-up status. Required source data: completion report, assessment result sheet, learner ID records, payment/status file, approval list, certificate template. Evidence fields: Assess whether each exception has a clear cause, evidence, routing decision, escalation owner, and closure or follow-up status. AI support: AI coach can ask: What source proves this? Which field is missing? What is the risk if this is wrong? Who owns the next action? Learner must answer using the case data, not guesses.',
  1,
  '15 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BBA Education Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-093' LIMIT 1),
  'BBA Education Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Com - Academic Operations
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-093' LIMIT 1),
  'B.Com - Academic Operations',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BA Public Administration
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-093' LIMIT 1),
  'BA Public Administration',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PG Diploma Certification Operations
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-093' LIMIT 1),
  'PG Diploma Certification Operations',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MBA Education Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-093' LIMIT 1),
  'MBA Education Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Exam Operations Control Exception Diagnosis, Routing & Escalation Log
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Exam Operations Control Exception Diagnosis, Routing & Escalation Log',
  'COURSE-L3-098',
  'Learner can diagnose exceptions, select the right route, and document escalation logic for control exam operations through scheduling, candidate readiness, invigilation, and exception handling and submit a workplace-ready L3 Exam Operations Control Exception Resolution Log. Workplace scenario: A exam cell has an exception queue linked to exam operations for 420 candidates across 8 rooms. Several cases cannot be completed because seat plan, invigilator duty, question-paper packets, access needs, and incident rules are not fully aligned. The learner must diagnose the cause, separate data errors from policy exceptions, route each case, and prepare an escalation log with reasons. Learner artifact: L3 Exam Operations Control Exception Resolution Log. Required data: candidate list, room plan, invigilator roster, question-paper packet list, access accommodation list, incident format. Evidence: Assess whether each exception has a clear cause, evidence, routing decision, escalation owner, and closure or follow-up status.',
  '15 hours',
  'Active',
  'Assessment, Certification & Credentialing',
  'technical',
  '["Triggered when an exception diagnosis and escalation task needs a real workplace artifact, not a theory answer.","Demonstrates exception diagnosis and escalation by producing and defending the L3 Exam Operations Control Exception Resolution Log.","Learner can diagnose exceptions, select the right route, and document escalation logic for control exam operations through scheduling, candidate readiness, invigilation, and exception handling and submit a workplace-ready L3 Exam Operations Control Exception Resolution Log."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: Module 1: Exam Operations Control Exception Diagnosis, Routing & Escalation Log Workplace Artifact Build
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-098' LIMIT 1),
  'Module 1: Exam Operations Control Exception Diagnosis, Routing & Escalation Log Workplace Artifact Build',
  'Triggered when an exception diagnosis and escalation task needs a real workplace artifact, not a theory answer. The learner studies the case, reviews the required data, identifies the gap, creates the artifact, and checks it against evidence fields.',
  1,
  '["Education & Skilling","Assessment, Certification & Credentialing","IND-CAP-20","L3","Exam logistics control","Seating and room allocation","Invigilator duty mapping","Confidential material control","Incident reporting"]'::jsonb,
  '["Engage","Explore","Explain","Express","Empower","Evolve","Artifact Build","Evidence Review","AI-Coached Retry"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Case: Exam Operations Control Exception Diagnosis, Routing & Escalation Log
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-098' LIMIT 1)
   AND title = 'Module 1: Exam Operations Control Exception Diagnosis, Routing & Escalation Log Workplace Artifact Build' LIMIT 1),
  'Workplace Case: Exam Operations Control Exception Diagnosis, Routing & Escalation Log',
  'A exam cell has an exception queue linked to exam operations for 420 candidates across 8 rooms. Several cases cannot be completed because seat plan, invigilator duty, question-paper packets, access needs, and incident rules are not fully aligned. The learner must diagnose the cause, separate data errors from policy exceptions, route each case, and prepare an escalation log with reasons. The learner must solve the problem using the given data and produce the required workplace artifact.',
  'Workplace problem: A exam cell has an exception queue linked to exam operations for 420 candidates across 8 rooms. Several cases cannot be completed because seat plan, invigilator duty, question-paper packets, access needs, and incident rules are not fully aligned. The learner must diagnose the cause, separate data errors from policy exceptions, route each case, and prepare an escalation log with reasons. Pressure points: Exception pressure: some cases are blocked, learners or staff are waiting, and wrong routing can delay resolution. Learner must show why each case is a data issue, rule issue, owner issue, or escalation issue. Root cause focus: Classify the blocker as data mismatch, learner/staff eligibility issue, rule exception, system limitation, or approval dependency. Major concepts: Exam logistics control; Seating and room allocation; Invigilator duty mapping; Confidential material control; Incident reporting; Compliance checklist; Exception classification; Escalation threshold; Decision justification. Level focus: exception handling and escalation. Required data: candidate list, room plan, invigilator roster, question-paper packet list, access accommodation list, incident format Learner activity flow: Engage - Start with the case: 420 candidates across 8 rooms and the visible pain point — seat plan, invigilator duty, question-paper packets, access needs, and incident rules are not fully aligned. Learner identifies who is affected and what could go wrong if the work is delayed or wrong. Explore - Learner studies the source data: candidate list, room plan, invigilator roster, question-paper packet list, access accommodation list, incident format. They mark trusted records, missing fields, conflicting entries, and items that need confirmation before using them in the artifact. Explain - Teach the main logic in simple terms: Exam logistics control; Seating and room allocation; Invigilator duty mapping; Confidential material control; Incident reporting; Compliance checklist; Exception classification; Escalation threshold; Decision justification. Level focus: exception handling and escalation. Show how rules, evidence, decisions, and handoff notes connect in this workplace task. Express - Learner produces the L3 Exam Operations Control Exception Resolution Log using the case data, writes decisions in plain English, and shows evidence for each important field instead of giving only a theory answer. Empower - Learner uses AI only as a coach: ask for missing-field checks, clarity prompts, risk questions, and retry suggestions. AI should not create the final artifact for the learner. Evolve - Learner notes what would become harder at L4: more records, more conflicts, less guidance, stronger evidence expectations, and higher decision responsibility. Artifact to submit: L3 Exam Operations Control Exception Resolution Log. L3 Exam Operations Control Exception Resolution Log should contain: exception register; case classification; evidence summary; routing decision; escalation reason; closure or follow-up status. Required source data: candidate list, room plan, invigilator roster, question-paper packet list, access accommodation list, incident format. Evidence fields: Assess whether each exception has a clear cause, evidence, routing decision, escalation owner, and closure or follow-up status. AI support: AI coach can ask: What source proves this? Which field is missing? What is the risk if this is wrong? Who owns the next action? Learner must answer using the case data, not guesses.',
  1,
  '15 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Ed - Exam Operations
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-098' LIMIT 1),
  'B.Ed - Exam Operations',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BBA Education Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-098' LIMIT 1),
  'BBA Education Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BA Public Administration
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-098' LIMIT 1),
  'BA Public Administration',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PG Diploma Exam Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-098' LIMIT 1),
  'PG Diploma Exam Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Ed - Assessment Administration
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-098' LIMIT 1),
  'M.Ed - Assessment Administration',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Learner Support Planning Exception Diagnosis, Routing & Escalation Log
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Learner Support Planning Exception Diagnosis, Routing & Escalation Log',
  'COURSE-L3-103',
  'Learner can diagnose exceptions, select the right route, and document escalation logic for create learner support plans from accessibility, referral, and progress evidence and submit a workplace-ready L3 Learner Support Planning Exception Resolution Log. Workplace scenario: A inclusive learning support team has an exception queue linked to learner support planning for 58 learners flagged for support. Several cases cannot be completed because support needs, accommodation requests, guardian notes, teacher observations, and resource availability are incomplete. The learner must diagnose the cause, separate data errors from policy exceptions, route each case, and prepare an escalation log with reasons. Learner artifact: L3 Learner Support Planning Exception Resolution Log. Required data: learner profile, accommodation request, teacher observation, support history, resource list, meeting notes. Evidence: Assess whether each exception has a clear cause, evidence, routing decision, escalation owner, and closure or follow-up status.',
  '15 hours',
  'Active',
  'Learner Support, Guidance & Coaching Services',
  'soft',
  '["Triggered when an exception diagnosis and escalation task needs a real workplace artifact, not a theory answer.","Demonstrates exception diagnosis and escalation by producing and defending the L3 Learner Support Planning Exception Resolution Log.","Learner can diagnose exceptions, select the right route, and document escalation logic for create learner support plans from accessibility, referral, and progress evidence and submit a workplace-ready L3 Learner Support Planning Exception Resolution Log."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: Module 1: Learner Support Planning Exception Diagnosis, Routing & Escalation Log Workplace Artifact Build
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-103' LIMIT 1),
  'Module 1: Learner Support Planning Exception Diagnosis, Routing & Escalation Log Workplace Artifact Build',
  'Triggered when an exception diagnosis and escalation task needs a real workplace artifact, not a theory answer. The learner studies the case, reviews the required data, identifies the gap, creates the artifact, and checks it against evidence fields.',
  1,
  '["Education & Skilling","Learner Support, Guidance & Coaching Services","IND-CAP-21","L3","Inclusive support planning","Accommodation mapping","Learner profile interpretation","Stakeholder coordination","Support action plan"]'::jsonb,
  '["Engage","Explore","Explain","Express","Empower","Evolve","Artifact Build","Evidence Review","AI-Coached Retry"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Case: Learner Support Planning Exception Diagnosis, Routing & Escalation Log
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-103' LIMIT 1)
   AND title = 'Module 1: Learner Support Planning Exception Diagnosis, Routing & Escalation Log Workplace Artifact Build' LIMIT 1),
  'Workplace Case: Learner Support Planning Exception Diagnosis, Routing & Escalation Log',
  'A inclusive learning support team has an exception queue linked to learner support planning for 58 learners flagged for support. Several cases cannot be completed because support needs, accommodation requests, guardian notes, teacher observations, and resource availability are incomplete. The learner must diagnose the cause, separate data errors from policy exceptions, route each case, and prepare an escalation log with reasons. The learner must solve the problem using the given data and produce the required workplace artifact.',
  'Workplace problem: A inclusive learning support team has an exception queue linked to learner support planning for 58 learners flagged for support. Several cases cannot be completed because support needs, accommodation requests, guardian notes, teacher observations, and resource availability are incomplete. The learner must diagnose the cause, separate data errors from policy exceptions, route each case, and prepare an escalation log with reasons. Pressure points: Exception pressure: some cases are blocked, learners or staff are waiting, and wrong routing can delay resolution. Learner must show why each case is a data issue, rule issue, owner issue, or escalation issue. Root cause focus: Classify the blocker as data mismatch, learner/staff eligibility issue, rule exception, system limitation, or approval dependency. Major concepts: Inclusive support planning; Accommodation mapping; Learner profile interpretation; Stakeholder coordination; Support action plan; Review timeline; Exception classification; Escalation threshold; Decision justification. Level focus: exception handling and escalation. Required data: learner profile, accommodation request, teacher observation, support history, resource list, meeting notes Learner activity flow: Engage - Start with the case: 58 learners flagged for support and the visible pain point — support needs, accommodation requests, guardian notes, teacher observations, and resource availability are incomplete. Learner identifies who is affected and what could go wrong if the work is delayed or wrong. Explore - Learner studies the source data: learner profile, accommodation request, teacher observation, support history, resource list, meeting notes. They mark trusted records, missing fields, conflicting entries, and items that need confirmation before using them in the artifact. Explain - Teach the main logic in simple terms: Inclusive support planning; Accommodation mapping; Learner profile interpretation; Stakeholder coordination; Support action plan; Review timeline; Exception classification; Escalation threshold; Decision justification. Level focus: exception handling and escalation. Show how rules, evidence, decisions, and handoff notes connect in this workplace task. Express - Learner produces the L3 Learner Support Planning Exception Resolution Log using the case data, writes decisions in plain English, and shows evidence for each important field instead of giving only a theory answer. Empower - Learner uses AI only as a coach: ask for missing-field checks, clarity prompts, risk questions, and retry suggestions. AI should not create the final artifact for the learner. Evolve - Learner notes what would become harder at L4: more records, more conflicts, less guidance, stronger evidence expectations, and higher decision responsibility. Artifact to submit: L3 Learner Support Planning Exception Resolution Log. L3 Learner Support Planning Exception Resolution Log should contain: exception register; case classification; evidence summary; routing decision; escalation reason; closure or follow-up status. Required source data: learner profile, accommodation request, teacher observation, support history, resource list, meeting notes. Evidence fields: Assess whether each exception has a clear cause, evidence, routing decision, escalation owner, and closure or follow-up status. AI support: AI coach can ask: What source proves this? Which field is missing? What is the risk if this is wrong? Who owns the next action? Learner must answer using the case data, not guesses.',
  1,
  '15 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Ed Special Education
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-103' LIMIT 1),
  'B.Ed Special Education',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Ed Special Education
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-103' LIMIT 1),
  'M.Ed Special Education',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BA Psychology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-103' LIMIT 1),
  'BA Psychology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MA Psychology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-103' LIMIT 1),
  'MA Psychology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MSW - Student Support Services
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-103' LIMIT 1),
  'MSW - Student Support Services',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Remedial Intervention Cycle Exception Diagnosis, Routing & Escalation Log
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Remedial Intervention Cycle Exception Diagnosis, Routing & Escalation Log',
  'COURSE-L3-108',
  'Learner can diagnose exceptions, select the right route, and document escalation logic for run remedial intervention cycles using learning-gap diagnosis, practice evidence, and progress review and submit a workplace-ready L3 Remedial Intervention Cycle Exception Resolution Log. Workplace scenario: An academic recovery team has an exception queue linked to remedial intervention for 73 learners below benchmark after unit test. Several cases cannot be completed because diagnostic causes, remedial groups, practice tasks, teacher availability, and retest dates are not planned. The learner must diagnose the cause, separate data errors from policy exceptions, route each case, and prepare an escalation log with reasons. Learner artifact: L3 Remedial Intervention Cycle Exception Resolution Log. Required data: unit-test scores, error analysis, attendance record, learner groups, teacher roster, remedial material list, retest plan. Evidence: Assess whether each exception has a clear cause, evidence, routing decision, escalation owner, and closure or follow-up status.',
  '15 hours',
  'Active',
  'Learner Support, Guidance & Coaching Services',
  'soft',
  '["Triggered when an exception diagnosis and escalation task needs a real workplace artifact, not a theory answer.","Demonstrates exception diagnosis and escalation by producing and defending the L3 Remedial Intervention Cycle Exception Resolution Log.","Learner can diagnose exceptions, select the right route, and document escalation logic for run remedial intervention cycles using learning-gap diagnosis, practice evidence, and progress review and submit a workplace-ready L3 Remedial Intervention Cycle Exception Resolution Log."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: Module 1: Remedial Intervention Cycle Exception Diagnosis, Routing & Escalation Log Workplace Artifact Build
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-108' LIMIT 1),
  'Module 1: Remedial Intervention Cycle Exception Diagnosis, Routing & Escalation Log Workplace Artifact Build',
  'Triggered when an exception diagnosis and escalation task needs a real workplace artifact, not a theory answer. The learner studies the case, reviews the required data, identifies the gap, creates the artifact, and checks it against evidence fields.',
  1,
  '["Education & Skilling","Learner Support, Guidance & Coaching Services","IND-CAP-22","L3","Diagnostic error analysis","Remedial grouping","Intervention planning","Practice evidence","Retest scheduling"]'::jsonb,
  '["Engage","Explore","Explain","Express","Empower","Evolve","Artifact Build","Evidence Review","AI-Coached Retry"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Case: Remedial Intervention Cycle Exception Diagnosis, Routing & Escalation Log
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-108' LIMIT 1)
   AND title = 'Module 1: Remedial Intervention Cycle Exception Diagnosis, Routing & Escalation Log Workplace Artifact Build' LIMIT 1),
  'Workplace Case: Remedial Intervention Cycle Exception Diagnosis, Routing & Escalation Log',
  'An academic recovery team has an exception queue linked to remedial intervention for 73 learners below benchmark after unit test. Several cases cannot be completed because diagnostic causes, remedial groups, practice tasks, teacher availability, and retest dates are not planned. The learner must diagnose the cause, separate data errors from policy exceptions, route each case, and prepare an escalation log with reasons. The learner must solve the problem using the given data and produce the required workplace artifact.',
  'Workplace problem: An academic recovery team has an exception queue linked to remedial intervention for 73 learners below benchmark after unit test. Several cases cannot be completed because diagnostic causes, remedial groups, practice tasks, teacher availability, and retest dates are not planned. The learner must diagnose the cause, separate data errors from policy exceptions, route each case, and prepare an escalation log with reasons. Pressure points: Exception pressure: some cases are blocked, learners or staff are waiting, and wrong routing can delay resolution. Learner must show why each case is a data issue, rule issue, owner issue, or escalation issue. Root cause focus: Classify the blocker as data mismatch, learner/staff eligibility issue, rule exception, system limitation, or approval dependency. Major concepts: Diagnostic error analysis; Remedial grouping; Intervention planning; Practice evidence; Retest scheduling; Progress monitoring; Exception classification; Escalation threshold; Decision justification. Level focus: exception handling and escalation. Required data: unit-test scores, error analysis, attendance record, learner groups, teacher roster, remedial material list, retest plan Learner activity flow: Engage - Start with the case: 73 learners below benchmark after unit test and the visible pain point — diagnostic causes, remedial groups, practice tasks, teacher availability, and retest dates are not planned. Learner identifies who is affected and what could go wrong if the work is delayed or wrong. Explore - Learner studies the source data: unit-test scores, error analysis, attendance record, learner groups, teacher roster, remedial material list, retest plan. They mark trusted records, missing fields, conflicting entries, and items that need confirmation before using them in the artifact. Explain - Teach the main logic in simple terms: Diagnostic error analysis; Remedial grouping; Intervention planning; Practice evidence; Retest scheduling; Progress monitoring; Exception classification; Escalation threshold; Decision justification. Level focus: exception handling and escalation. Show how rules, evidence, decisions, and handoff notes connect in this workplace task. Express - Learner produces the L3 Remedial Intervention Cycle Exception Resolution Log using the case data, writes decisions in plain English, and shows evidence for each important field instead of giving only a theory answer. Empower - Learner uses AI only as a coach: ask for missing-field checks, clarity prompts, risk questions, and retry suggestions. AI should not create the final artifact for the learner. Evolve - Learner notes what would become harder at L4: more records, more conflicts, less guidance, stronger evidence expectations, and higher decision responsibility. Artifact to submit: L3 Remedial Intervention Cycle Exception Resolution Log. L3 Remedial Intervention Cycle Exception Resolution Log should contain: exception register; case classification; evidence summary; routing decision; escalation reason; closure or follow-up status. Required source data: unit-test scores, error analysis, attendance record, learner groups, teacher roster, remedial material list, retest plan. Evidence fields: Assess whether each exception has a clear cause, evidence, routing decision, escalation owner, and closure or follow-up status. AI support: AI coach can ask: What source proves this? Which field is missing? What is the risk if this is wrong? Who owns the next action? Learner must answer using the case data, not guesses.',
  1,
  '15 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Ed Special Education
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-108' LIMIT 1),
  'B.Ed Special Education',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Ed - Remedial Education
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-108' LIMIT 1),
  'B.Ed - Remedial Education',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BA Psychology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-108' LIMIT 1),
  'BA Psychology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MA Education
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-108' LIMIT 1),
  'MA Education',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PG Diploma Remedial Intervention
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-108' LIMIT 1),
  'PG Diploma Remedial Intervention',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Career Guidance Action Planning Exception Diagnosis, Routing & Escalation Log
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Career Guidance Action Planning Exception Diagnosis, Routing & Escalation Log',
  'COURSE-L3-113',
  'Learner can diagnose exceptions, select the right route, and document escalation logic for convert learner profiles and market evidence into career guidance action plans and submit a workplace-ready L3 Career Guidance Action Planning Exception Resolution Log. Workplace scenario: A career guidance cell has an exception queue linked to career guidance planning for 120 final-year learners. Several cases cannot be completed because career interests, aptitude data, course marks, family constraints, and local job options point in different directions. The learner must diagnose the cause, separate data errors from policy exceptions, route each case, and prepare an escalation log with reasons. Learner artifact: L3 Career Guidance Action Planning Exception Resolution Log. Required data: interest form, aptitude results, academic scores, learner constraints, job/education options, counselling notes. Evidence: Assess whether each exception has a clear cause, evidence, routing decision, escalation owner, and closure or follow-up status.',
  '15 hours',
  'Active',
  'Education & Skilling',
  'soft',
  '["Triggered when an exception diagnosis and escalation task needs a real workplace artifact, not a theory answer.","Demonstrates exception diagnosis and escalation by producing and defending the L3 Career Guidance Action Planning Exception Resolution Log.","Learner can diagnose exceptions, select the right route, and document escalation logic for convert learner profiles and market evidence into career guidance action plans and submit a workplace-ready L3 Career Guidance Action Planning Exception Resolution Log."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: Module 1: Career Guidance Action Planning Exception Diagnosis, Routing & Escalation Log Workplace Artifact Build
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-113' LIMIT 1),
  'Module 1: Career Guidance Action Planning Exception Diagnosis, Routing & Escalation Log Workplace Artifact Build',
  'Triggered when an exception diagnosis and escalation task needs a real workplace artifact, not a theory answer. The learner studies the case, reviews the required data, identifies the gap, creates the artifact, and checks it against evidence fields.',
  1,
  '["Education & Skilling","IND-CAP-23","L3","Career interest interpretation","Aptitude and evidence use","Option comparison","Constraint-aware guidance","Action planning"]'::jsonb,
  '["Engage","Explore","Explain","Express","Empower","Evolve","Artifact Build","Evidence Review","AI-Coached Retry"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Case: Career Guidance Action Planning Exception Diagnosis, Routing & Escalation Log
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-113' LIMIT 1)
   AND title = 'Module 1: Career Guidance Action Planning Exception Diagnosis, Routing & Escalation Log Workplace Artifact Build' LIMIT 1),
  'Workplace Case: Career Guidance Action Planning Exception Diagnosis, Routing & Escalation Log',
  'A career guidance cell has an exception queue linked to career guidance planning for 120 final-year learners. Several cases cannot be completed because career interests, aptitude data, course marks, family constraints, and local job options point in different directions. The learner must diagnose the cause, separate data errors from policy exceptions, route each case, and prepare an escalation log with reasons. The learner must solve the problem using the given data and produce the required workplace artifact.',
  'Workplace problem: A career guidance cell has an exception queue linked to career guidance planning for 120 final-year learners. Several cases cannot be completed because career interests, aptitude data, course marks, family constraints, and local job options point in different directions. The learner must diagnose the cause, separate data errors from policy exceptions, route each case, and prepare an escalation log with reasons. Pressure points: Exception pressure: some cases are blocked, learners or staff are waiting, and wrong routing can delay resolution. Learner must show why each case is a data issue, rule issue, owner issue, or escalation issue. Root cause focus: Classify the blocker as data mismatch, learner/staff eligibility issue, rule exception, system limitation, or approval dependency. Major concepts: Career interest interpretation; Aptitude and evidence use; Option comparison; Constraint-aware guidance; Action planning; Referral and follow-up; Exception classification; Escalation threshold; Decision justification. Level focus: exception handling and escalation. Required data: interest form, aptitude results, academic scores, learner constraints, job/education options, counselling notes Learner activity flow: Engage - Start with the case: 120 final-year learners and the visible pain point — career interests, aptitude data, course marks, family constraints, and local job options point in different directions. Learner identifies who is affected and what could go wrong if the work is delayed or wrong. Explore - Learner studies the source data: interest form, aptitude results, academic scores, learner constraints, job/education options, counselling notes. They mark trusted records, missing fields, conflicting entries, and items that need confirmation before using them in the artifact. Explain - Teach the main logic in simple terms: Career interest interpretation; Aptitude and evidence use; Option comparison; Constraint-aware guidance; Action planning; Referral and follow-up; Exception classification; Escalation threshold; Decision justification. Level focus: exception handling and escalation. Show how rules, evidence, decisions, and handoff notes connect in this workplace task. Express - Learner produces the L3 Career Guidance Action Planning Exception Resolution Log using the case data, writes decisions in plain English, and shows evidence for each important field instead of giving only a theory answer. Empower - Learner uses AI only as a coach: ask for missing-field checks, clarity prompts, risk questions, and retry suggestions. AI should not create the final artifact for the learner. Evolve - Learner notes what would become harder at L4: more records, more conflicts, less guidance, stronger evidence expectations, and higher decision responsibility. Artifact to submit: L3 Career Guidance Action Planning Exception Resolution Log. L3 Career Guidance Action Planning Exception Resolution Log should contain: exception register; case classification; evidence summary; routing decision; escalation reason; closure or follow-up status. Required source data: interest form, aptitude results, academic scores, learner constraints, job/education options, counselling notes. Evidence fields: Assess whether each exception has a clear cause, evidence, routing decision, escalation owner, and closure or follow-up status. AI support: AI coach can ask: What source proves this? Which field is missing? What is the risk if this is wrong? Who owns the next action? Learner must answer using the case data, not guesses.',
  1,
  '15 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BA Psychology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-113' LIMIT 1),
  'BA Psychology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MA Counselling Psychology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-113' LIMIT 1),
  'MA Counselling Psychology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BBA HR
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-113' LIMIT 1),
  'BBA HR',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MBA HR
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-113' LIMIT 1),
  'MBA HR',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PG Diploma Career Guidance and Counselling
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-113' LIMIT 1),
  'PG Diploma Career Guidance and Counselling',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Coaching Progress Management Exception Diagnosis, Routing & Escalation Log
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Coaching Progress Management Exception Diagnosis, Routing & Escalation Log',
  'COURSE-L3-118',
  'Learner can diagnose exceptions, select the right route, and document escalation logic for manage language or performance coaching progress through diagnostic evidence, practice cycles, and feedback records and submit a workplace-ready L3 Coaching Progress Management Exception Resolution Log. Workplace scenario: A coaching program team has an exception queue linked to coaching progress management for 36 learners in a 6-week coaching cycle. Several cases cannot be completed because practice logs, coach feedback, attendance, improvement targets, and learner reflections are inconsistent. The learner must diagnose the cause, separate data errors from policy exceptions, route each case, and prepare an escalation log with reasons. Learner artifact: L3 Coaching Progress Management Exception Resolution Log. Required data: practice log, coach feedback, attendance, performance target, reflection notes, review dates. Evidence: Assess whether each exception has a clear cause, evidence, routing decision, escalation owner, and closure or follow-up status.',
  '15 hours',
  'Active',
  'Education & Skilling',
  'soft',
  '["Triggered when an exception diagnosis and escalation task needs a real workplace artifact, not a theory answer.","Demonstrates exception diagnosis and escalation by producing and defending the L3 Coaching Progress Management Exception Resolution Log.","Learner can diagnose exceptions, select the right route, and document escalation logic for manage language or performance coaching progress through diagnostic evidence, practice cycles, and feedback records and submit a workplace-ready L3 Coaching Progress Management Exception Resolution Log."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: Module 1: Coaching Progress Management Exception Diagnosis, Routing & Escalation Log Workplace Artifact Build
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-118' LIMIT 1),
  'Module 1: Coaching Progress Management Exception Diagnosis, Routing & Escalation Log Workplace Artifact Build',
  'Triggered when an exception diagnosis and escalation task needs a real workplace artifact, not a theory answer. The learner studies the case, reviews the required data, identifies the gap, creates the artifact, and checks it against evidence fields.',
  1,
  '["Education & Skilling","IND-CAP-24","L3","Coaching goal setting","Practice evidence tracking","Feedback loop","Progress review","Motivation support"]'::jsonb,
  '["Engage","Explore","Explain","Express","Empower","Evolve","Artifact Build","Evidence Review","AI-Coached Retry"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Case: Coaching Progress Management Exception Diagnosis, Routing & Escalation Log
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-118' LIMIT 1)
   AND title = 'Module 1: Coaching Progress Management Exception Diagnosis, Routing & Escalation Log Workplace Artifact Build' LIMIT 1),
  'Workplace Case: Coaching Progress Management Exception Diagnosis, Routing & Escalation Log',
  'A coaching program team has an exception queue linked to coaching progress management for 36 learners in a 6-week coaching cycle. Several cases cannot be completed because practice logs, coach feedback, attendance, improvement targets, and learner reflections are inconsistent. The learner must diagnose the cause, separate data errors from policy exceptions, route each case, and prepare an escalation log with reasons. The learner must solve the problem using the given data and produce the required workplace artifact.',
  'Workplace problem: A coaching program team has an exception queue linked to coaching progress management for 36 learners in a 6-week coaching cycle. Several cases cannot be completed because practice logs, coach feedback, attendance, improvement targets, and learner reflections are inconsistent. The learner must diagnose the cause, separate data errors from policy exceptions, route each case, and prepare an escalation log with reasons. Pressure points: Exception pressure: some cases are blocked, learners or staff are waiting, and wrong routing can delay resolution. Learner must show why each case is a data issue, rule issue, owner issue, or escalation issue. Root cause focus: Classify the blocker as data mismatch, learner/staff eligibility issue, rule exception, system limitation, or approval dependency. Major concepts: Coaching goal setting; Practice evidence tracking; Feedback loop; Progress review; Motivation support; Next-step planning; Exception classification; Escalation threshold; Decision justification. Level focus: exception handling and escalation. Required data: practice log, coach feedback, attendance, performance target, reflection notes, review dates Learner activity flow: Engage - Start with the case: 36 learners in a 6-week coaching cycle and the visible pain point — practice logs, coach feedback, attendance, improvement targets, and learner reflections are inconsistent. Learner identifies who is affected and what could go wrong if the work is delayed or wrong. Explore - Learner studies the source data: practice log, coach feedback, attendance, performance target, reflection notes, review dates. They mark trusted records, missing fields, conflicting entries, and items that need confirmation before using them in the artifact. Explain - Teach the main logic in simple terms: Coaching goal setting; Practice evidence tracking; Feedback loop; Progress review; Motivation support; Next-step planning; Exception classification; Escalation threshold; Decision justification. Level focus: exception handling and escalation. Show how rules, evidence, decisions, and handoff notes connect in this workplace task. Express - Learner produces the L3 Coaching Progress Management Exception Resolution Log using the case data, writes decisions in plain English, and shows evidence for each important field instead of giving only a theory answer. Empower - Learner uses AI only as a coach: ask for missing-field checks, clarity prompts, risk questions, and retry suggestions. AI should not create the final artifact for the learner. Evolve - Learner notes what would become harder at L4: more records, more conflicts, less guidance, stronger evidence expectations, and higher decision responsibility. Artifact to submit: L3 Coaching Progress Management Exception Resolution Log. L3 Coaching Progress Management Exception Resolution Log should contain: exception register; case classification; evidence summary; routing decision; escalation reason; closure or follow-up status. Required source data: practice log, coach feedback, attendance, performance target, reflection notes, review dates. Evidence fields: Assess whether each exception has a clear cause, evidence, routing decision, escalation owner, and closure or follow-up status. AI support: AI coach can ask: What source proves this? Which field is missing? What is the risk if this is wrong? Who owns the next action? Learner must answer using the case data, not guesses.',
  1,
  '15 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BA English and Communication
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-118' LIMIT 1),
  'BA English and Communication',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.P.Ed
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-118' LIMIT 1),
  'B.P.Ed',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BFA Performing Arts
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-118' LIMIT 1),
  'BFA Performing Arts',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Ed - Coaching Support
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-118' LIMIT 1),
  'B.Ed - Coaching Support',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PG Diploma Coaching and Mentoring
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-118' LIMIT 1),
  'PG Diploma Coaching and Mentoring',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Admissions Operations Exception Diagnosis, Routing & Escalation Log
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Admissions Operations Exception Diagnosis, Routing & Escalation Log',
  'COURSE-L3-123',
  'Learner can diagnose exceptions, select the right route, and document escalation logic for complete admissions operations through document verification, enrollment coding, and record activation and submit a workplace-ready L3 Admissions Operations Exception Resolution Log. Workplace scenario: An admissions office has an exception queue linked to admissions operations for 520 applicants for 180 seats. Several cases cannot be completed because application status, document checks, fee records, category rules, and communication logs are not synchronized. The learner must diagnose the cause, separate data errors from policy exceptions, route each case, and prepare an escalation log with reasons. Learner artifact: L3 Admissions Operations Exception Resolution Log. Required data: application forms, document checklist, fee report, category rules, merit/selection list, communication log. Evidence: Assess whether each exception has a clear cause, evidence, routing decision, escalation owner, and closure or follow-up status.',
  '15 hours',
  'Active',
  'Education & Skilling',
  'technical',
  '["Triggered when an exception diagnosis and escalation task needs a real workplace artifact, not a theory answer.","Demonstrates exception diagnosis and escalation by producing and defending the L3 Admissions Operations Exception Resolution Log.","Learner can diagnose exceptions, select the right route, and document escalation logic for complete admissions operations through document verification, enrollment coding, and record activation and submit a workplace-ready L3 Admissions Operations Exception Resolution Log."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: Module 1: Admissions Operations Exception Diagnosis, Routing & Escalation Log Workplace Artifact Build
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-123' LIMIT 1),
  'Module 1: Admissions Operations Exception Diagnosis, Routing & Escalation Log Workplace Artifact Build',
  'Triggered when an exception diagnosis and escalation task needs a real workplace artifact, not a theory answer. The learner studies the case, reviews the required data, identifies the gap, creates the artifact, and checks it against evidence fields.',
  1,
  '["Education & Skilling","IND-CAP-25","L3","Admissions workflow","Document and fee verification","Selection rule application","Status communication","Exception tagging"]'::jsonb,
  '["Engage","Explore","Explain","Express","Empower","Evolve","Artifact Build","Evidence Review","AI-Coached Retry"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Case: Admissions Operations Exception Diagnosis, Routing & Escalation Log
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-123' LIMIT 1)
   AND title = 'Module 1: Admissions Operations Exception Diagnosis, Routing & Escalation Log Workplace Artifact Build' LIMIT 1),
  'Workplace Case: Admissions Operations Exception Diagnosis, Routing & Escalation Log',
  'An admissions office has an exception queue linked to admissions operations for 520 applicants for 180 seats. Several cases cannot be completed because application status, document checks, fee records, category rules, and communication logs are not synchronized. The learner must diagnose the cause, separate data errors from policy exceptions, route each case, and prepare an escalation log with reasons. The learner must solve the problem using the given data and produce the required workplace artifact.',
  'Workplace problem: An admissions office has an exception queue linked to admissions operations for 520 applicants for 180 seats. Several cases cannot be completed because application status, document checks, fee records, category rules, and communication logs are not synchronized. The learner must diagnose the cause, separate data errors from policy exceptions, route each case, and prepare an escalation log with reasons. Pressure points: Exception pressure: some cases are blocked, learners or staff are waiting, and wrong routing can delay resolution. Learner must show why each case is a data issue, rule issue, owner issue, or escalation issue. Root cause focus: Classify the blocker as data mismatch, learner/staff eligibility issue, rule exception, system limitation, or approval dependency. Major concepts: Admissions workflow; Document and fee verification; Selection rule application; Status communication; Exception tagging; Admissions audit trail; Exception classification; Escalation threshold; Decision justification. Level focus: exception handling and escalation. Required data: application forms, document checklist, fee report, category rules, merit/selection list, communication log Learner activity flow: Engage - Start with the case: 520 applicants for 180 seats and the visible pain point — application status, document checks, fee records, category rules, and communication logs are not synchronized. Learner identifies who is affected and what could go wrong if the work is delayed or wrong. Explore - Learner studies the source data: application forms, document checklist, fee report, category rules, merit/selection list, communication log. They mark trusted records, missing fields, conflicting entries, and items that need confirmation before using them in the artifact. Explain - Teach the main logic in simple terms: Admissions workflow; Document and fee verification; Selection rule application; Status communication; Exception tagging; Admissions audit trail; Exception classification; Escalation threshold; Decision justification. Level focus: exception handling and escalation. Show how rules, evidence, decisions, and handoff notes connect in this workplace task. Express - Learner produces the L3 Admissions Operations Exception Resolution Log using the case data, writes decisions in plain English, and shows evidence for each important field instead of giving only a theory answer. Empower - Learner uses AI only as a coach: ask for missing-field checks, clarity prompts, risk questions, and retry suggestions. AI should not create the final artifact for the learner. Evolve - Learner notes what would become harder at L4: more records, more conflicts, less guidance, stronger evidence expectations, and higher decision responsibility. Artifact to submit: L3 Admissions Operations Exception Resolution Log. L3 Admissions Operations Exception Resolution Log should contain: exception register; case classification; evidence summary; routing decision; escalation reason; closure or follow-up status. Required source data: application forms, document checklist, fee report, category rules, merit/selection list, communication log. Evidence fields: Assess whether each exception has a clear cause, evidence, routing decision, escalation owner, and closure or follow-up status. AI support: AI coach can ask: What source proves this? Which field is missing? What is the risk if this is wrong? Who owns the next action? Learner must answer using the case data, not guesses.',
  1,
  '15 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BBA Education Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-123' LIMIT 1),
  'BBA Education Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Com - Admissions Operations
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-123' LIMIT 1),
  'B.Com - Admissions Operations',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BA Public Administration
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-123' LIMIT 1),
  'BA Public Administration',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MBA Education Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-123' LIMIT 1),
  'MBA Education Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PG Diploma Admission Counselling
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-123' LIMIT 1),
  'PG Diploma Admission Counselling',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Education MIS Reporting Exception Diagnosis, Routing & Escalation Log
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Education MIS Reporting Exception Diagnosis, Routing & Escalation Log',
  'COURSE-L3-128',
  'Learner can diagnose exceptions, select the right route, and document escalation logic for produce institution-level education MIS reports through institution-code, learner-record, and data-quality controls and submit a workplace-ready L3 Education MIS Reporting Exception Resolution Log. Workplace scenario: An institution reporting team has an exception queue linked to education MIS reporting for 12 departments reporting monthly data. Several cases cannot be completed because enrollment, attendance, assessment, dropout, and placement numbers do not reconcile before submission. The learner must diagnose the cause, separate data errors from policy exceptions, route each case, and prepare an escalation log with reasons. Learner artifact: L3 Education MIS Reporting Exception Resolution Log. Required data: department data files, ERP exports, attendance summaries, assessment results, dropout records, placement tracker. Evidence: Assess whether each exception has a clear cause, evidence, routing decision, escalation owner, and closure or follow-up status.',
  '15 hours',
  'Active',
  'Education & Skilling',
  'technical',
  '["Triggered when an exception diagnosis and escalation task needs a real workplace artifact, not a theory answer.","Demonstrates exception diagnosis and escalation by producing and defending the L3 Education MIS Reporting Exception Resolution Log.","Learner can diagnose exceptions, select the right route, and document escalation logic for produce institution-level education MIS reports through institution-code, learner-record, and data-quality controls and submit a workplace-ready L3 Education MIS Reporting Exception Resolution Log."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: Module 1: Education MIS Reporting Exception Diagnosis, Routing & Escalation Log Workplace Artifact Build
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-128' LIMIT 1),
  'Module 1: Education MIS Reporting Exception Diagnosis, Routing & Escalation Log Workplace Artifact Build',
  'Triggered when an exception diagnosis and escalation task needs a real workplace artifact, not a theory answer. The learner studies the case, reviews the required data, identifies the gap, creates the artifact, and checks it against evidence fields.',
  1,
  '["Education & Skilling","IND-CAP-26","L3","MIS data validation","Indicator definition","Reconciliation logic","Dashboard readiness","Exception notes"]'::jsonb,
  '["Engage","Explore","Explain","Express","Empower","Evolve","Artifact Build","Evidence Review","AI-Coached Retry"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Case: Education MIS Reporting Exception Diagnosis, Routing & Escalation Log
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-128' LIMIT 1)
   AND title = 'Module 1: Education MIS Reporting Exception Diagnosis, Routing & Escalation Log Workplace Artifact Build' LIMIT 1),
  'Workplace Case: Education MIS Reporting Exception Diagnosis, Routing & Escalation Log',
  'An institution reporting team has an exception queue linked to education MIS reporting for 12 departments reporting monthly data. Several cases cannot be completed because enrollment, attendance, assessment, dropout, and placement numbers do not reconcile before submission. The learner must diagnose the cause, separate data errors from policy exceptions, route each case, and prepare an escalation log with reasons. The learner must solve the problem using the given data and produce the required workplace artifact.',
  'Workplace problem: An institution reporting team has an exception queue linked to education MIS reporting for 12 departments reporting monthly data. Several cases cannot be completed because enrollment, attendance, assessment, dropout, and placement numbers do not reconcile before submission. The learner must diagnose the cause, separate data errors from policy exceptions, route each case, and prepare an escalation log with reasons. Pressure points: Exception pressure: some cases are blocked, learners or staff are waiting, and wrong routing can delay resolution. Learner must show why each case is a data issue, rule issue, owner issue, or escalation issue. Root cause focus: Classify the blocker as data mismatch, learner/staff eligibility issue, rule exception, system limitation, or approval dependency. Major concepts: MIS data validation; Indicator definition; Reconciliation logic; Dashboard readiness; Exception notes; Submission control; Exception classification; Escalation threshold; Decision justification. Level focus: exception handling and escalation. Required data: department data files, ERP exports, attendance summaries, assessment results, dropout records, placement tracker Learner activity flow: Engage - Start with the case: 12 departments reporting monthly data and the visible pain point — enrollment, attendance, assessment, dropout, and placement numbers do not reconcile before submission. Learner identifies who is affected and what could go wrong if the work is delayed or wrong. Explore - Learner studies the source data: department data files, ERP exports, attendance summaries, assessment results, dropout records, placement tracker. They mark trusted records, missing fields, conflicting entries, and items that need confirmation before using them in the artifact. Explain - Teach the main logic in simple terms: MIS data validation; Indicator definition; Reconciliation logic; Dashboard readiness; Exception notes; Submission control; Exception classification; Escalation threshold; Decision justification. Level focus: exception handling and escalation. Show how rules, evidence, decisions, and handoff notes connect in this workplace task. Express - Learner produces the L3 Education MIS Reporting Exception Resolution Log using the case data, writes decisions in plain English, and shows evidence for each important field instead of giving only a theory answer. Empower - Learner uses AI only as a coach: ask for missing-field checks, clarity prompts, risk questions, and retry suggestions. AI should not create the final artifact for the learner. Evolve - Learner notes what would become harder at L4: more records, more conflicts, less guidance, stronger evidence expectations, and higher decision responsibility. Artifact to submit: L3 Education MIS Reporting Exception Resolution Log. L3 Education MIS Reporting Exception Resolution Log should contain: exception register; case classification; evidence summary; routing decision; escalation reason; closure or follow-up status. Required source data: department data files, ERP exports, attendance summaries, assessment results, dropout records, placement tracker. Evidence fields: Assess whether each exception has a clear cause, evidence, routing decision, escalation owner, and closure or follow-up status. AI support: AI coach can ask: What source proves this? Which field is missing? What is the risk if this is wrong? Who owns the next action? Learner must answer using the case data, not guesses.',
  1,
  '15 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BCA
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-128' LIMIT 1),
  'BCA',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc IT
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-128' LIMIT 1),
  'B.Sc IT',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Com - Data Reporting
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-128' LIMIT 1),
  'B.Com - Data Reporting',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BBA Business Analytics
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-128' LIMIT 1),
  'BBA Business Analytics',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PG Diploma Education Data Analytics
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-128' LIMIT 1),
  'PG Diploma Education Data Analytics',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Government/NGO Program Tracking Exception Diagnosis, Routing & Escalation Log
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Government/NGO Program Tracking Exception Diagnosis, Routing & Escalation Log',
  'COURSE-L3-133',
  'Learner can diagnose exceptions, select the right route, and document escalation logic for track government or ngo education programs through beneficiary, activity, utilization, and outcome evidence and submit a workplace-ready L3 Government/NGO Program Tracking Exception Resolution Log. Workplace scenario: A NGO education program team has an exception queue linked to government/ngo program tracking for 18 centres and 2,400 beneficiaries. Several cases cannot be completed because attendance, activity evidence, budget use, outcome data, and donor reporting formats are incomplete. The learner must diagnose the cause, separate data errors from policy exceptions, route each case, and prepare an escalation log with reasons. Learner artifact: L3 Government/NGO Program Tracking Exception Resolution Log. Required data: centre reports, attendance registers, activity photos/logs, budget sheet, outcome tracker, donor format. Evidence: Assess whether each exception has a clear cause, evidence, routing decision, escalation owner, and closure or follow-up status.',
  '15 hours',
  'Active',
  'Education & Skilling',
  'technical',
  '["Triggered when an exception diagnosis and escalation task needs a real workplace artifact, not a theory answer.","Demonstrates exception diagnosis and escalation by producing and defending the L3 Government/NGO Program Tracking Exception Resolution Log.","Learner can diagnose exceptions, select the right route, and document escalation logic for track government or ngo education programs through beneficiary, activity, utilization, and outcome evidence and submit a workplace-ready L3 Government/NGO Program Tracking Exception Resolution Log."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: Module 1: Government/NGO Program Tracking Exception Diagnosis, Routing & Escalation Log Workplace Artifact Build
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-133' LIMIT 1),
  'Module 1: Government/NGO Program Tracking Exception Diagnosis, Routing & Escalation Log Workplace Artifact Build',
  'Triggered when an exception diagnosis and escalation task needs a real workplace artifact, not a theory answer. The learner studies the case, reviews the required data, identifies the gap, creates the artifact, and checks it against evidence fields.',
  1,
  '["Education & Skilling","IND-CAP-27","L3","Program monitoring","Beneficiary data tracking","Activity evidence control","Budget-output linkage","Donor report structure"]'::jsonb,
  '["Engage","Explore","Explain","Express","Empower","Evolve","Artifact Build","Evidence Review","AI-Coached Retry"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Case: Government/NGO Program Tracking Exception Diagnosis, Routing & Escalation Log
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-133' LIMIT 1)
   AND title = 'Module 1: Government/NGO Program Tracking Exception Diagnosis, Routing & Escalation Log Workplace Artifact Build' LIMIT 1),
  'Workplace Case: Government/NGO Program Tracking Exception Diagnosis, Routing & Escalation Log',
  'A NGO education program team has an exception queue linked to government/ngo program tracking for 18 centres and 2,400 beneficiaries. Several cases cannot be completed because attendance, activity evidence, budget use, outcome data, and donor reporting formats are incomplete. The learner must diagnose the cause, separate data errors from policy exceptions, route each case, and prepare an escalation log with reasons. The learner must solve the problem using the given data and produce the required workplace artifact.',
  'Workplace problem: A NGO education program team has an exception queue linked to government/ngo program tracking for 18 centres and 2,400 beneficiaries. Several cases cannot be completed because attendance, activity evidence, budget use, outcome data, and donor reporting formats are incomplete. The learner must diagnose the cause, separate data errors from policy exceptions, route each case, and prepare an escalation log with reasons. Pressure points: Exception pressure: some cases are blocked, learners or staff are waiting, and wrong routing can delay resolution. Learner must show why each case is a data issue, rule issue, owner issue, or escalation issue. Root cause focus: Classify the blocker as data mismatch, learner/staff eligibility issue, rule exception, system limitation, or approval dependency. Major concepts: Program monitoring; Beneficiary data tracking; Activity evidence control; Budget-output linkage; Donor report structure; Risk and variance note; Exception classification; Escalation threshold; Decision justification. Level focus: exception handling and escalation. Required data: centre reports, attendance registers, activity photos/logs, budget sheet, outcome tracker, donor format Learner activity flow: Engage - Start with the case: 18 centres and 2,400 beneficiaries and the visible pain point — attendance, activity evidence, budget use, outcome data, and donor reporting formats are incomplete. Learner identifies who is affected and what could go wrong if the work is delayed or wrong. Explore - Learner studies the source data: centre reports, attendance registers, activity photos/logs, budget sheet, outcome tracker, donor format. They mark trusted records, missing fields, conflicting entries, and items that need confirmation before using them in the artifact. Explain - Teach the main logic in simple terms: Program monitoring; Beneficiary data tracking; Activity evidence control; Budget-output linkage; Donor report structure; Risk and variance note; Exception classification; Escalation threshold; Decision justification. Level focus: exception handling and escalation. Show how rules, evidence, decisions, and handoff notes connect in this workplace task. Express - Learner produces the L3 Government/NGO Program Tracking Exception Resolution Log using the case data, writes decisions in plain English, and shows evidence for each important field instead of giving only a theory answer. Empower - Learner uses AI only as a coach: ask for missing-field checks, clarity prompts, risk questions, and retry suggestions. AI should not create the final artifact for the learner. Evolve - Learner notes what would become harder at L4: more records, more conflicts, less guidance, stronger evidence expectations, and higher decision responsibility. Artifact to submit: L3 Government/NGO Program Tracking Exception Resolution Log. L3 Government/NGO Program Tracking Exception Resolution Log should contain: exception register; case classification; evidence summary; routing decision; escalation reason; closure or follow-up status. Required source data: centre reports, attendance registers, activity photos/logs, budget sheet, outcome tracker, donor format. Evidence fields: Assess whether each exception has a clear cause, evidence, routing decision, escalation owner, and closure or follow-up status. AI support: AI coach can ask: What source proves this? Which field is missing? What is the risk if this is wrong? Who owns the next action? Learner must answer using the case data, not guesses.',
  1,
  '15 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BSW - Community Development
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-133' LIMIT 1),
  'BSW - Community Development',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MSW - Education Programs
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-133' LIMIT 1),
  'MSW - Education Programs',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BA Public Administration
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-133' LIMIT 1),
  'BA Public Administration',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MA Development Studies
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-133' LIMIT 1),
  'MA Development Studies',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PG Diploma NGO Program Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-133' LIMIT 1),
  'PG Diploma NGO Program Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Research Publishing Coordination Exception Diagnosis, Routing & Escalation Log
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Research Publishing Coordination Exception Diagnosis, Routing & Escalation Log',
  'COURSE-L3-138',
  'Learner can diagnose exceptions, select the right route, and document escalation logic for research and academic publishing cycles through study evidence, review workflow, and publication records and submit a workplace-ready L3 Research Publishing Coordination Exception Resolution Log. Workplace scenario: A research office has an exception queue linked to research publishing coordination for 22 manuscripts in review cycle. Several cases cannot be completed because ethics approval, reviewer comments, author revisions, plagiarism checks, and publication status are scattered. The learner must diagnose the cause, separate data errors from policy exceptions, route each case, and prepare an escalation log with reasons. Learner artifact: L3 Research Publishing Coordination Exception Resolution Log. Required data: manuscript tracker, ethics approval, reviewer comments, revision files, plagiarism report, publication status log. Evidence: Assess whether each exception has a clear cause, evidence, routing decision, escalation owner, and closure or follow-up status.',
  '15 hours',
  'Active',
  'Education & Skilling',
  'technical',
  '["Triggered when an exception diagnosis and escalation task needs a real workplace artifact, not a theory answer.","Demonstrates exception diagnosis and escalation by producing and defending the L3 Research Publishing Coordination Exception Resolution Log.","Learner can diagnose exceptions, select the right route, and document escalation logic for research and academic publishing cycles through study evidence, review workflow, and publication records and submit a workplace-ready L3 Research Publishing Coordination Exception Resolution Log."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: Module 1: Research Publishing Coordination Exception Diagnosis, Routing & Escalation Log Workplace Artifact Build
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-138' LIMIT 1),
  'Module 1: Research Publishing Coordination Exception Diagnosis, Routing & Escalation Log Workplace Artifact Build',
  'Triggered when an exception diagnosis and escalation task needs a real workplace artifact, not a theory answer. The learner studies the case, reviews the required data, identifies the gap, creates the artifact, and checks it against evidence fields.',
  1,
  '["Education & Skilling","IND-CAP-28","L3","Research workflow tracking","Ethics and compliance check","Peer-review status control","Revision evidence","Publication record management"]'::jsonb,
  '["Engage","Explore","Explain","Express","Empower","Evolve","Artifact Build","Evidence Review","AI-Coached Retry"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Case: Research Publishing Coordination Exception Diagnosis, Routing & Escalation Log
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-138' LIMIT 1)
   AND title = 'Module 1: Research Publishing Coordination Exception Diagnosis, Routing & Escalation Log Workplace Artifact Build' LIMIT 1),
  'Workplace Case: Research Publishing Coordination Exception Diagnosis, Routing & Escalation Log',
  'A research office has an exception queue linked to research publishing coordination for 22 manuscripts in review cycle. Several cases cannot be completed because ethics approval, reviewer comments, author revisions, plagiarism checks, and publication status are scattered. The learner must diagnose the cause, separate data errors from policy exceptions, route each case, and prepare an escalation log with reasons. The learner must solve the problem using the given data and produce the required workplace artifact.',
  'Workplace problem: A research office has an exception queue linked to research publishing coordination for 22 manuscripts in review cycle. Several cases cannot be completed because ethics approval, reviewer comments, author revisions, plagiarism checks, and publication status are scattered. The learner must diagnose the cause, separate data errors from policy exceptions, route each case, and prepare an escalation log with reasons. Pressure points: Exception pressure: some cases are blocked, learners or staff are waiting, and wrong routing can delay resolution. Learner must show why each case is a data issue, rule issue, owner issue, or escalation issue. Root cause focus: Classify the blocker as data mismatch, learner/staff eligibility issue, rule exception, system limitation, or approval dependency. Major concepts: Research workflow tracking; Ethics and compliance check; Peer-review status control; Revision evidence; Publication record management; Author communication; Exception classification; Escalation threshold; Decision justification. Level focus: exception handling and escalation. Required data: manuscript tracker, ethics approval, reviewer comments, revision files, plagiarism report, publication status log Learner activity flow: Engage - Start with the case: 22 manuscripts in review cycle and the visible pain point — ethics approval, reviewer comments, author revisions, plagiarism checks, and publication status are scattered. Learner identifies who is affected and what could go wrong if the work is delayed or wrong. Explore - Learner studies the source data: manuscript tracker, ethics approval, reviewer comments, revision files, plagiarism report, publication status log. They mark trusted records, missing fields, conflicting entries, and items that need confirmation before using them in the artifact. Explain - Teach the main logic in simple terms: Research workflow tracking; Ethics and compliance check; Peer-review status control; Revision evidence; Publication record management; Author communication; Exception classification; Escalation threshold; Decision justification. Level focus: exception handling and escalation. Show how rules, evidence, decisions, and handoff notes connect in this workplace task. Express - Learner produces the L3 Research Publishing Coordination Exception Resolution Log using the case data, writes decisions in plain English, and shows evidence for each important field instead of giving only a theory answer. Empower - Learner uses AI only as a coach: ask for missing-field checks, clarity prompts, risk questions, and retry suggestions. AI should not create the final artifact for the learner. Evolve - Learner notes what would become harder at L4: more records, more conflicts, less guidance, stronger evidence expectations, and higher decision responsibility. Artifact to submit: L3 Research Publishing Coordination Exception Resolution Log. L3 Research Publishing Coordination Exception Resolution Log should contain: exception register; case classification; evidence summary; routing decision; escalation reason; closure or follow-up status. Required source data: manuscript tracker, ethics approval, reviewer comments, revision files, plagiarism report, publication status log. Evidence fields: Assess whether each exception has a clear cause, evidence, routing decision, escalation owner, and closure or follow-up status. AI support: AI coach can ask: What source proves this? Which field is missing? What is the risk if this is wrong? Who owns the next action? Learner must answer using the case data, not guesses.',
  1,
  '15 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BA Education
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-138' LIMIT 1),
  'BA Education',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MA Education
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-138' LIMIT 1),
  'MA Education',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Ed Research Methods
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-138' LIMIT 1),
  'M.Ed Research Methods',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PG Diploma Research Methodology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-138' LIMIT 1),
  'PG Diploma Research Methodology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PhD Coursework - Education Research
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L3-138' LIMIT 1),
  'PhD Coursework - Education Research',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Cohort Scheduling Quality Review, Coaching & Handoff Improvement
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Cohort Scheduling Quality Review, Coaching & Handoff Improvement',
  'COURSE-L4-004',
  'Learner can review quality, coach others, and improve the handoff process for cohort session schedules from calendar, facilitator, learner, and resource constraints and submit a workplace-ready L4 Cohort Scheduling Quality Review & Coaching Note. Workplace scenario: A team has already completed cohort scheduling work for 240 learners across 3 batches, but the supervisor sees repeated mistakes: two facilitators are unavailable, one lab is double-booked, 18 learners were added late, and a holiday was missed. The learner must review sampled outputs, identify quality gaps, write coaching notes, and improve the handoff standard for the team. Learner artifact: L4 Cohort Scheduling Quality Review & Coaching Note. Required data: academic calendar, facilitator roster, room/lab tracker, batch list, holiday calendar, session duration rules, approval notes. Evidence: Assess whether review comments are specific, coaching is practical, error patterns are named, and the improved handoff reduces repeat mistakes.',
  '20 hours',
  'Active',
  'Formal Education & Lifelong Learning Delivery',
  'technical',
  '["Triggered when a quality review and team improvement task needs a real workplace artifact, not a theory answer.","Demonstrates quality review and team improvement by producing and defending the L4 Cohort Scheduling Quality Review & Coaching Note.","Learner can review quality, coach others, and improve the handoff process for cohort session schedules from calendar, facilitator, learner, and resource constraints and submit a workplace-ready L4 Cohort Scheduling Quality Review & Coaching Note."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: Module 1: Cohort Scheduling Quality Review, Coaching & Handoff Improvement Workplace Artifact Build
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-004' LIMIT 1),
  'Module 1: Cohort Scheduling Quality Review, Coaching & Handoff Improvement Workplace Artifact Build',
  'Triggered when a quality review and team improvement task needs a real workplace artifact, not a theory answer. The learner studies the case, reviews the required data, identifies the gap, creates the artifact, and checks it against evidence fields.',
  1,
  '["Education & Skilling","Formal Education & Lifelong Learning Delivery","IND-CAP-01","L4","Academic calendar logic","Batch-wise timetable sequencing","Facilitator availability check","Room and resource constraint mapping","Conflict log and priority rules"]'::jsonb,
  '["Engage","Explore","Explain","Express","Empower","Evolve","Artifact Build","Evidence Review","AI-Coached Retry"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Case: Cohort Scheduling Quality Review, Coaching & Handoff Improvement
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-004' LIMIT 1)
   AND title = 'Module 1: Cohort Scheduling Quality Review, Coaching & Handoff Improvement Workplace Artifact Build' LIMIT 1),
  'Workplace Case: Cohort Scheduling Quality Review, Coaching & Handoff Improvement',
  'A team has already completed cohort scheduling work for 240 learners across 3 batches, but the supervisor sees repeated mistakes: two facilitators are unavailable, one lab is double-booked, 18 learners were added late, and a holiday was missed. The learner must review sampled outputs, identify quality gaps, write coaching notes, and improve the handoff standard for the team. The learner must solve the problem using the given data and produce the required workplace artifact.',
  'Workplace problem: A team has already completed cohort scheduling work for 240 learners across 3 batches, but the supervisor sees repeated mistakes: two facilitators are unavailable, one lab is double-booked, 18 learners were added late, and a holiday was missed. The learner must review sampled outputs, identify quality gaps, write coaching notes, and improve the handoff standard for the team. Pressure points: Quality pressure: team members are repeating similar mistakes. Learner must detect error patterns, give usable coaching, and improve the next handoff without blaming individuals. Root cause focus: Identify repeated error types, weak review habits, unclear team instructions, missing examples, or lack of coaching follow-up. Major concepts: Academic calendar logic; Batch-wise timetable sequencing; Facilitator availability check; Room and resource constraint mapping; Conflict log and priority rules; Schedule release handoff; Quality sampling; Coaching evidence; Process improvement loop. Level focus: quality review and coaching. Required data: academic calendar, facilitator roster, room/lab tracker, batch list, holiday calendar, session duration rules, approval notes Learner activity flow: Engage - Start with the case: 240 learners across 3 batches and the visible pain point — two facilitators are unavailable, one lab is double-booked, 18 learners were added late, and a holiday was missed. Learner identifies who is affected and what could go wrong if the work is delayed or wrong. Explore - Learner studies the source data: academic calendar, facilitator roster, room/lab tracker, batch list, holiday calendar, session duration rules, approval notes. They mark trusted records, missing fields, conflicting entries, and items that need confirmation before using them in the artifact. Explain - Teach the main logic in simple terms: Academic calendar logic; Batch-wise timetable sequencing; Facilitator availability check; Room and resource constraint mapping; Conflict log and priority rules; Schedule release handoff; Quality sampling; Coaching evidence; Process improvement loop. Level focus: quality review and coaching. Show how rules, evidence, decisions, and handoff notes connect in this workplace task. Express - Learner produces the L4 Cohort Scheduling Quality Review & Coaching Note using the case data, writes decisions in plain English, and shows evidence for each important field instead of giving only a theory answer. Empower - Learner uses AI only as a coach: ask for missing-field checks, clarity prompts, risk questions, and retry suggestions. AI should not create the final artifact for the learner. Evolve - Learner notes what would become harder at L5: more records, more conflicts, less guidance, stronger evidence expectations, and higher decision responsibility. Artifact to submit: L4 Cohort Scheduling Quality Review & Coaching Note. L4 Cohort Scheduling Quality Review & Coaching Note should contain: sample reviewed; quality error log; coaching observation; corrective example; handoff improvement note; follow-up action. Required source data: academic calendar, facilitator roster, room/lab tracker, batch list, holiday calendar, session duration rules, approval notes. Evidence fields: Assess whether review comments are specific, coaching is practical, error patterns are named, and the improved handoff reduces repeat mistakes. AI support: AI coach can ask: What source proves this? Which field is missing? What is the risk if this is wrong? Who owns the next action? Learner must answer using the case data, not guesses.',
  1,
  '20 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Ed - School Education
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-004' LIMIT 1),
  'B.Ed - School Education',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Ed - Education Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-004' LIMIT 1),
  'M.Ed - Education Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BA Education
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-004' LIMIT 1),
  'BA Education',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BBA Education Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-004' LIMIT 1),
  'BBA Education Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PG Diploma Education Administration
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-004' LIMIT 1),
  'PG Diploma Education Administration',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Learner Progression Quality Review, Coaching & Handoff Improvement
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Learner Progression Quality Review, Coaching & Handoff Improvement',
  'COURSE-L4-009',
  'Learner can review quality, coach others, and improve the handoff process for learner progression decisions using attendance, assessment, and participation evidence and submit a workplace-ready L4 Learner Progression Quality Review & Coaching Note. Workplace scenario: A team has already completed learner progression work for 126 learners at module-end review, but the supervisor sees repeated mistakes: attendance, assessment marks, project submissions, and remedial records do not match for 31 learners. The learner must review sampled outputs, identify quality gaps, write coaching notes, and improve the handoff standard for the team. Learner artifact: L4 Learner Progression Quality Review & Coaching Note. Required data: attendance sheet, assessment scores, project submission tracker, remediation log, progression criteria, mentor comments. Evidence: Assess whether review comments are specific, coaching is practical, error patterns are named, and the improved handoff reduces repeat mistakes.',
  '20 hours',
  'Active',
  'Formal Education & Lifelong Learning Delivery',
  'technical',
  '["Triggered when a quality review and team improvement task needs a real workplace artifact, not a theory answer.","Demonstrates quality review and team improvement by producing and defending the L4 Learner Progression Quality Review & Coaching Note.","Learner can review quality, coach others, and improve the handoff process for learner progression decisions using attendance, assessment, and participation evidence and submit a workplace-ready L4 Learner Progression Quality Review & Coaching Note."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: Module 1: Learner Progression Quality Review, Coaching & Handoff Improvement Workplace Artifact Build
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-009' LIMIT 1),
  'Module 1: Learner Progression Quality Review, Coaching & Handoff Improvement Workplace Artifact Build',
  'Triggered when a quality review and team improvement task needs a real workplace artifact, not a theory answer. The learner studies the case, reviews the required data, identifies the gap, creates the artifact, and checks it against evidence fields.',
  1,
  '["Education & Skilling","Formal Education & Lifelong Learning Delivery","IND-CAP-02","L4","Progression rule interpretation","Evidence-based learner routing","Attendance and assessment thresholds","Remediation decision logic","Status tagging"]'::jsonb,
  '["Engage","Explore","Explain","Express","Empower","Evolve","Artifact Build","Evidence Review","AI-Coached Retry"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Case: Learner Progression Quality Review, Coaching & Handoff Improvement
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-009' LIMIT 1)
   AND title = 'Module 1: Learner Progression Quality Review, Coaching & Handoff Improvement Workplace Artifact Build' LIMIT 1),
  'Workplace Case: Learner Progression Quality Review, Coaching & Handoff Improvement',
  'A team has already completed learner progression work for 126 learners at module-end review, but the supervisor sees repeated mistakes: attendance, assessment marks, project submissions, and remedial records do not match for 31 learners. The learner must review sampled outputs, identify quality gaps, write coaching notes, and improve the handoff standard for the team. The learner must solve the problem using the given data and produce the required workplace artifact.',
  'Workplace problem: A team has already completed learner progression work for 126 learners at module-end review, but the supervisor sees repeated mistakes: attendance, assessment marks, project submissions, and remedial records do not match for 31 learners. The learner must review sampled outputs, identify quality gaps, write coaching notes, and improve the handoff standard for the team. Pressure points: Quality pressure: team members are repeating similar mistakes. Learner must detect error patterns, give usable coaching, and improve the next handoff without blaming individuals. Root cause focus: Identify repeated error types, weak review habits, unclear team instructions, missing examples, or lack of coaching follow-up. Major concepts: Progression rule interpretation; Evidence-based learner routing; Attendance and assessment thresholds; Remediation decision logic; Status tagging; Learner handoff note; Quality sampling; Coaching evidence; Process improvement loop. Level focus: quality review and coaching. Required data: attendance sheet, assessment scores, project submission tracker, remediation log, progression criteria, mentor comments Learner activity flow: Engage - Start with the case: 126 learners at module-end review and the visible pain point — attendance, assessment marks, project submissions, and remedial records do not match for 31 learners. Learner identifies who is affected and what could go wrong if the work is delayed or wrong. Explore - Learner studies the source data: attendance sheet, assessment scores, project submission tracker, remediation log, progression criteria, mentor comments. They mark trusted records, missing fields, conflicting entries, and items that need confirmation before using them in the artifact. Explain - Teach the main logic in simple terms: Progression rule interpretation; Evidence-based learner routing; Attendance and assessment thresholds; Remediation decision logic; Status tagging; Learner handoff note; Quality sampling; Coaching evidence; Process improvement loop. Level focus: quality review and coaching. Show how rules, evidence, decisions, and handoff notes connect in this workplace task. Express - Learner produces the L4 Learner Progression Quality Review & Coaching Note using the case data, writes decisions in plain English, and shows evidence for each important field instead of giving only a theory answer. Empower - Learner uses AI only as a coach: ask for missing-field checks, clarity prompts, risk questions, and retry suggestions. AI should not create the final artifact for the learner. Evolve - Learner notes what would become harder at L5: more records, more conflicts, less guidance, stronger evidence expectations, and higher decision responsibility. Artifact to submit: L4 Learner Progression Quality Review & Coaching Note. L4 Learner Progression Quality Review & Coaching Note should contain: sample reviewed; quality error log; coaching observation; corrective example; handoff improvement note; follow-up action. Required source data: attendance sheet, assessment scores, project submission tracker, remediation log, progression criteria, mentor comments. Evidence fields: Assess whether review comments are specific, coaching is practical, error patterns are named, and the improved handoff reduces repeat mistakes. AI support: AI coach can ask: What source proves this? Which field is missing? What is the risk if this is wrong? Who owns the next action? Learner must answer using the case data, not guesses.',
  1,
  '20 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Ed - School Education
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-009' LIMIT 1),
  'B.Ed - School Education',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Ed - Education Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-009' LIMIT 1),
  'M.Ed - Education Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BA Education
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-009' LIMIT 1),
  'BA Education',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MA Education
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-009' LIMIT 1),
  'MA Education',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Voc Education Operations
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-009' LIMIT 1),
  'B.Voc Education Operations',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Academic Record Activation Quality Review, Coaching & Handoff Improvement
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Academic Record Activation Quality Review, Coaching & Handoff Improvement',
  'COURSE-L4-014',
  'Learner can review quality, coach others, and improve the handoff process for learner academic records through eligibility, program-rule, and enrollment verification and submit a workplace-ready L4 Academic Record Activation Quality Review & Coaching Note. Workplace scenario: A team has already completed academic record activation work for 180 admitted learners before orientation, but the supervisor sees repeated mistakes: 24 eligibility documents are missing, 11 program codes are wrong, and fee-status updates are not synced in the ERP. The learner must review sampled outputs, identify quality gaps, write coaching notes, and improve the handoff standard for the team. Learner artifact: L4 Academic Record Activation Quality Review & Coaching Note. Required data: eligibility documents, program rules, enrollment forms, ID proof, fee-status sheet, ERP fields, approval trail. Evidence: Assess whether review comments are specific, coaching is practical, error patterns are named, and the improved handoff reduces repeat mistakes.',
  '20 hours',
  'Active',
  'Formal Education & Lifelong Learning Delivery',
  'technical',
  '["Triggered when a quality review and team improvement task needs a real workplace artifact, not a theory answer.","Demonstrates quality review and team improvement by producing and defending the L4 Academic Record Activation Quality Review & Coaching Note.","Learner can review quality, coach others, and improve the handoff process for learner academic records through eligibility, program-rule, and enrollment verification and submit a workplace-ready L4 Academic Record Activation Quality Review & Coaching Note."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: Module 1: Academic Record Activation Quality Review, Coaching & Handoff Improvement Workplace Artifact Build
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-014' LIMIT 1),
  'Module 1: Academic Record Activation Quality Review, Coaching & Handoff Improvement Workplace Artifact Build',
  'Triggered when a quality review and team improvement task needs a real workplace artifact, not a theory answer. The learner studies the case, reviews the required data, identifies the gap, creates the artifact, and checks it against evidence fields.',
  1,
  '["Education & Skilling","Formal Education & Lifelong Learning Delivery","IND-CAP-03","L4","Eligibility verification","Program-rule mapping","Enrollment status control","ERP field accuracy","Missing-document tracking"]'::jsonb,
  '["Engage","Explore","Explain","Express","Empower","Evolve","Artifact Build","Evidence Review","AI-Coached Retry"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Case: Academic Record Activation Quality Review, Coaching & Handoff Improvement
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-014' LIMIT 1)
   AND title = 'Module 1: Academic Record Activation Quality Review, Coaching & Handoff Improvement Workplace Artifact Build' LIMIT 1),
  'Workplace Case: Academic Record Activation Quality Review, Coaching & Handoff Improvement',
  'A team has already completed academic record activation work for 180 admitted learners before orientation, but the supervisor sees repeated mistakes: 24 eligibility documents are missing, 11 program codes are wrong, and fee-status updates are not synced in the ERP. The learner must review sampled outputs, identify quality gaps, write coaching notes, and improve the handoff standard for the team. The learner must solve the problem using the given data and produce the required workplace artifact.',
  'Workplace problem: A team has already completed academic record activation work for 180 admitted learners before orientation, but the supervisor sees repeated mistakes: 24 eligibility documents are missing, 11 program codes are wrong, and fee-status updates are not synced in the ERP. The learner must review sampled outputs, identify quality gaps, write coaching notes, and improve the handoff standard for the team. Pressure points: Quality pressure: team members are repeating similar mistakes. Learner must detect error patterns, give usable coaching, and improve the next handoff without blaming individuals. Root cause focus: Identify repeated error types, weak review habits, unclear team instructions, missing examples, or lack of coaching follow-up. Major concepts: Eligibility verification; Program-rule mapping; Enrollment status control; ERP field accuracy; Missing-document tracking; Activation approval handoff; Quality sampling; Coaching evidence; Process improvement loop. Level focus: quality review and coaching. Required data: eligibility documents, program rules, enrollment forms, ID proof, fee-status sheet, ERP fields, approval trail Learner activity flow: Engage - Start with the case: 180 admitted learners before orientation and the visible pain point — 24 eligibility documents are missing, 11 program codes are wrong, and fee-status updates are not synced in the ERP. Learner identifies who is affected and what could go wrong if the work is delayed or wrong. Explore - Learner studies the source data: eligibility documents, program rules, enrollment forms, ID proof, fee-status sheet, ERP fields, approval trail. They mark trusted records, missing fields, conflicting entries, and items that need confirmation before using them in the artifact. Explain - Teach the main logic in simple terms: Eligibility verification; Program-rule mapping; Enrollment status control; ERP field accuracy; Missing-document tracking; Activation approval handoff; Quality sampling; Coaching evidence; Process improvement loop. Level focus: quality review and coaching. Show how rules, evidence, decisions, and handoff notes connect in this workplace task. Express - Learner produces the L4 Academic Record Activation Quality Review & Coaching Note using the case data, writes decisions in plain English, and shows evidence for each important field instead of giving only a theory answer. Empower - Learner uses AI only as a coach: ask for missing-field checks, clarity prompts, risk questions, and retry suggestions. AI should not create the final artifact for the learner. Evolve - Learner notes what would become harder at L5: more records, more conflicts, less guidance, stronger evidence expectations, and higher decision responsibility. Artifact to submit: L4 Academic Record Activation Quality Review & Coaching Note. L4 Academic Record Activation Quality Review & Coaching Note should contain: sample reviewed; quality error log; coaching observation; corrective example; handoff improvement note; follow-up action. Required source data: eligibility documents, program rules, enrollment forms, ID proof, fee-status sheet, ERP fields, approval trail. Evidence fields: Assess whether review comments are specific, coaching is practical, error patterns are named, and the improved handoff reduces repeat mistakes. AI support: AI coach can ask: What source proves this? Which field is missing? What is the risk if this is wrong? Who owns the next action? Learner must answer using the case data, not guesses.',
  1,
  '20 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BBA Education Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-014' LIMIT 1),
  'BBA Education Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Com - Education Administration
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-014' LIMIT 1),
  'B.Com - Education Administration',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BA Public Administration
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-014' LIMIT 1),
  'BA Public Administration',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MBA Education Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-014' LIMIT 1),
  'MBA Education Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PG Diploma Higher Education Administration
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-014' LIMIT 1),
  'PG Diploma Higher Education Administration',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Adult Learner Pathway Quality Review, Coaching & Handoff Improvement
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Adult Learner Pathway Quality Review, Coaching & Handoff Improvement',
  'COURSE-L4-019',
  'Learner can review quality, coach others, and improve the handoff process for adult learner pathways from goals, prior learning, access constraints, and progress evidence and submit a workplace-ready L4 Adult Learner Pathway Quality Review & Coaching Note. Workplace scenario: A team has already completed adult learner pathway work for 64 working adult learners, but the supervisor sees repeated mistakes: learners have mixed prior learning, different shift timings, low device access, and unclear career goals. The learner must review sampled outputs, identify quality gaps, write coaching notes, and improve the handoff standard for the team. Learner artifact: L4 Adult Learner Pathway Quality Review & Coaching Note. Required data: learner goal form, prior learning proof, schedule constraints, device/access survey, language comfort data, course options. Evidence: Assess whether review comments are specific, coaching is practical, error patterns are named, and the improved handoff reduces repeat mistakes.',
  '20 hours',
  'Active',
  'Formal Education & Lifelong Learning Delivery',
  'soft',
  '["Triggered when a quality review and team improvement task needs a real workplace artifact, not a theory answer.","Demonstrates quality review and team improvement by producing and defending the L4 Adult Learner Pathway Quality Review & Coaching Note.","Learner can review quality, coach others, and improve the handoff process for adult learner pathways from goals, prior learning, access constraints, and progress evidence and submit a workplace-ready L4 Adult Learner Pathway Quality Review & Coaching Note."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: Module 1: Adult Learner Pathway Quality Review, Coaching & Handoff Improvement Workplace Artifact Build
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-019' LIMIT 1),
  'Module 1: Adult Learner Pathway Quality Review, Coaching & Handoff Improvement Workplace Artifact Build',
  'Triggered when a quality review and team improvement task needs a real workplace artifact, not a theory answer. The learner studies the case, reviews the required data, identifies the gap, creates the artifact, and checks it against evidence fields.',
  1,
  '["Education & Skilling","Formal Education & Lifelong Learning Delivery","IND-CAP-04","L4","Recognition of prior learning","Flexible pathway planning","Access constraint mapping","Adult motivation factors","Goal-to-course alignment"]'::jsonb,
  '["Engage","Explore","Explain","Express","Empower","Evolve","Artifact Build","Evidence Review","AI-Coached Retry"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Case: Adult Learner Pathway Quality Review, Coaching & Handoff Improvement
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-019' LIMIT 1)
   AND title = 'Module 1: Adult Learner Pathway Quality Review, Coaching & Handoff Improvement Workplace Artifact Build' LIMIT 1),
  'Workplace Case: Adult Learner Pathway Quality Review, Coaching & Handoff Improvement',
  'A team has already completed adult learner pathway work for 64 working adult learners, but the supervisor sees repeated mistakes: learners have mixed prior learning, different shift timings, low device access, and unclear career goals. The learner must review sampled outputs, identify quality gaps, write coaching notes, and improve the handoff standard for the team. The learner must solve the problem using the given data and produce the required workplace artifact.',
  'Workplace problem: A team has already completed adult learner pathway work for 64 working adult learners, but the supervisor sees repeated mistakes: learners have mixed prior learning, different shift timings, low device access, and unclear career goals. The learner must review sampled outputs, identify quality gaps, write coaching notes, and improve the handoff standard for the team. Pressure points: Quality pressure: team members are repeating similar mistakes. Learner must detect error patterns, give usable coaching, and improve the next handoff without blaming individuals. Root cause focus: Identify repeated error types, weak review habits, unclear team instructions, missing examples, or lack of coaching follow-up. Major concepts: Recognition of prior learning; Flexible pathway planning; Access constraint mapping; Adult motivation factors; Goal-to-course alignment; Support routing; Quality sampling; Coaching evidence; Process improvement loop. Level focus: quality review and coaching. Required data: learner goal form, prior learning proof, schedule constraints, device/access survey, language comfort data, course options Learner activity flow: Engage - Start with the case: 64 working adult learners and the visible pain point — learners have mixed prior learning, different shift timings, low device access, and unclear career goals. Learner identifies who is affected and what could go wrong if the work is delayed or wrong. Explore - Learner studies the source data: learner goal form, prior learning proof, schedule constraints, device/access survey, language comfort data, course options. They mark trusted records, missing fields, conflicting entries, and items that need confirmation before using them in the artifact. Explain - Teach the main logic in simple terms: Recognition of prior learning; Flexible pathway planning; Access constraint mapping; Adult motivation factors; Goal-to-course alignment; Support routing; Quality sampling; Coaching evidence; Process improvement loop. Level focus: quality review and coaching. Show how rules, evidence, decisions, and handoff notes connect in this workplace task. Express - Learner produces the L4 Adult Learner Pathway Quality Review & Coaching Note using the case data, writes decisions in plain English, and shows evidence for each important field instead of giving only a theory answer. Empower - Learner uses AI only as a coach: ask for missing-field checks, clarity prompts, risk questions, and retry suggestions. AI should not create the final artifact for the learner. Evolve - Learner notes what would become harder at L5: more records, more conflicts, less guidance, stronger evidence expectations, and higher decision responsibility. Artifact to submit: L4 Adult Learner Pathway Quality Review & Coaching Note. L4 Adult Learner Pathway Quality Review & Coaching Note should contain: sample reviewed; quality error log; coaching observation; corrective example; handoff improvement note; follow-up action. Required source data: learner goal form, prior learning proof, schedule constraints, device/access survey, language comfort data, course options. Evidence fields: Assess whether review comments are specific, coaching is practical, error patterns are named, and the improved handoff reduces repeat mistakes. AI support: AI coach can ask: What source proves this? Which field is missing? What is the risk if this is wrong? Who owns the next action? Learner must answer using the case data, not guesses.',
  1,
  '20 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BA Education
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-019' LIMIT 1),
  'BA Education',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MA Adult Education
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-019' LIMIT 1),
  'MA Adult Education',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BSW - Community Education
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-019' LIMIT 1),
  'BSW - Community Education',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Voc Skill Development
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-019' LIMIT 1),
  'B.Voc Skill Development',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PG Diploma Lifelong Learning
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-019' LIMIT 1),
  'PG Diploma Lifelong Learning',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Curriculum Mapping Quality Review, Coaching & Handoff Improvement
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Curriculum Mapping Quality Review, Coaching & Handoff Improvement',
  'COURSE-L4-024',
  'Learner can review quality, coach others, and improve the handoff process for translate standards and role outcomes into curriculum maps, learning sequences, and alignment boundaries and submit a workplace-ready L4 Curriculum Mapping Quality Review & Coaching Note. Workplace scenario: A team has already completed curriculum mapping work for 6 modules and 42 lesson activities, but the supervisor sees repeated mistakes: learning outcomes, activities, assessments, and workplace evidence do not clearly connect. The learner must review sampled outputs, identify quality gaps, write coaching notes, and improve the handoff standard for the team. Learner artifact: L4 Curriculum Mapping Quality Review & Coaching Note. Required data: syllabus, module outcomes, activity list, assessment plan, competency requirements, evidence expectations. Evidence: Assess whether review comments are specific, coaching is practical, error patterns are named, and the improved handoff reduces repeat mistakes.',
  '20 hours',
  'Active',
  'Curriculum, Pedagogy & Learning Design',
  'technical',
  '["Triggered when a quality review and team improvement task needs a real workplace artifact, not a theory answer.","Demonstrates quality review and team improvement by producing and defending the L4 Curriculum Mapping Quality Review & Coaching Note.","Learner can review quality, coach others, and improve the handoff process for translate standards and role outcomes into curriculum maps, learning sequences, and alignment boundaries and submit a workplace-ready L4 Curriculum Mapping Quality Review & Coaching Note."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: Module 1: Curriculum Mapping Quality Review, Coaching & Handoff Improvement Workplace Artifact Build
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-024' LIMIT 1),
  'Module 1: Curriculum Mapping Quality Review, Coaching & Handoff Improvement Workplace Artifact Build',
  'Triggered when a quality review and team improvement task needs a real workplace artifact, not a theory answer. The learner studies the case, reviews the required data, identifies the gap, creates the artifact, and checks it against evidence fields.',
  1,
  '["Education & Skilling","Curriculum, Pedagogy & Learning Design","IND-CAP-05","L4","Outcome mapping","Constructive alignment","Competency-to-activity link","Assessment coverage check","Gap identification"]'::jsonb,
  '["Engage","Explore","Explain","Express","Empower","Evolve","Artifact Build","Evidence Review","AI-Coached Retry"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Case: Curriculum Mapping Quality Review, Coaching & Handoff Improvement
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-024' LIMIT 1)
   AND title = 'Module 1: Curriculum Mapping Quality Review, Coaching & Handoff Improvement Workplace Artifact Build' LIMIT 1),
  'Workplace Case: Curriculum Mapping Quality Review, Coaching & Handoff Improvement',
  'A team has already completed curriculum mapping work for 6 modules and 42 lesson activities, but the supervisor sees repeated mistakes: learning outcomes, activities, assessments, and workplace evidence do not clearly connect. The learner must review sampled outputs, identify quality gaps, write coaching notes, and improve the handoff standard for the team. The learner must solve the problem using the given data and produce the required workplace artifact.',
  'Workplace problem: A team has already completed curriculum mapping work for 6 modules and 42 lesson activities, but the supervisor sees repeated mistakes: learning outcomes, activities, assessments, and workplace evidence do not clearly connect. The learner must review sampled outputs, identify quality gaps, write coaching notes, and improve the handoff standard for the team. Pressure points: Quality pressure: team members are repeating similar mistakes. Learner must detect error patterns, give usable coaching, and improve the next handoff without blaming individuals. Root cause focus: Identify repeated error types, weak review habits, unclear team instructions, missing examples, or lack of coaching follow-up. Major concepts: Outcome mapping; Constructive alignment; Competency-to-activity link; Assessment coverage check; Gap identification; Curriculum evidence map; Quality sampling; Coaching evidence; Process improvement loop. Level focus: quality review and coaching. Required data: syllabus, module outcomes, activity list, assessment plan, competency requirements, evidence expectations Learner activity flow: Engage - Start with the case: 6 modules and 42 lesson activities and the visible pain point — learning outcomes, activities, assessments, and workplace evidence do not clearly connect. Learner identifies who is affected and what could go wrong if the work is delayed or wrong. Explore - Learner studies the source data: syllabus, module outcomes, activity list, assessment plan, competency requirements, evidence expectations. They mark trusted records, missing fields, conflicting entries, and items that need confirmation before using them in the artifact. Explain - Teach the main logic in simple terms: Outcome mapping; Constructive alignment; Competency-to-activity link; Assessment coverage check; Gap identification; Curriculum evidence map; Quality sampling; Coaching evidence; Process improvement loop. Level focus: quality review and coaching. Show how rules, evidence, decisions, and handoff notes connect in this workplace task. Express - Learner produces the L4 Curriculum Mapping Quality Review & Coaching Note using the case data, writes decisions in plain English, and shows evidence for each important field instead of giving only a theory answer. Empower - Learner uses AI only as a coach: ask for missing-field checks, clarity prompts, risk questions, and retry suggestions. AI should not create the final artifact for the learner. Evolve - Learner notes what would become harder at L5: more records, more conflicts, less guidance, stronger evidence expectations, and higher decision responsibility. Artifact to submit: L4 Curriculum Mapping Quality Review & Coaching Note. L4 Curriculum Mapping Quality Review & Coaching Note should contain: sample reviewed; quality error log; coaching observation; corrective example; handoff improvement note; follow-up action. Required source data: syllabus, module outcomes, activity list, assessment plan, competency requirements, evidence expectations. Evidence fields: Assess whether review comments are specific, coaching is practical, error patterns are named, and the improved handoff reduces repeat mistakes. AI support: AI coach can ask: What source proves this? Which field is missing? What is the risk if this is wrong? Who owns the next action? Learner must answer using the case data, not guesses.',
  1,
  '20 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Ed - Curriculum Studies
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-024' LIMIT 1),
  'B.Ed - Curriculum Studies',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Ed - Curriculum and Instruction
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-024' LIMIT 1),
  'M.Ed - Curriculum and Instruction',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BA Education
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-024' LIMIT 1),
  'BA Education',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MA Education
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-024' LIMIT 1),
  'MA Education',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PG Diploma Instructional Design
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-024' LIMIT 1),
  'PG Diploma Instructional Design',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: e-learning Content Release Quality Review, Coaching & Handoff Improvement
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'e-learning Content Release Quality Review, Coaching & Handoff Improvement',
  'COURSE-L4-029',
  'Learner can review quality, coach others, and improve the handoff process for release e-learning content through storyboard, asset, accessibility, and qa controls and submit a workplace-ready L4 e-learning Content Release Quality Review & Coaching Note. Workplace scenario: A team has already completed e-learning content release work for 38 digital learning assets for a 4-week course, but the supervisor sees repeated mistakes: video links, captions, quiz rules, file versions, and mobile previews are inconsistent before launch. The learner must review sampled outputs, identify quality gaps, write coaching notes, and improve the handoff standard for the team. Learner artifact: L4 e-learning Content Release Quality Review & Coaching Note. Required data: content inventory, LMS upload list, video links, caption files, quiz settings, version tracker, QA checklist. Evidence: Assess whether review comments are specific, coaching is practical, error patterns are named, and the improved handoff reduces repeat mistakes.',
  '20 hours',
  'Active',
  'Curriculum, Pedagogy & Learning Design',
  'technical',
  '["Triggered when a quality review and team improvement task needs a real workplace artifact, not a theory answer.","Demonstrates quality review and team improvement by producing and defending the L4 e-Learning Content Release Quality Review & Coaching Note.","Learner can review quality, coach others, and improve the handoff process for release e-learning content through storyboard, asset, accessibility, and qa controls and submit a workplace-ready L4 e-Learning Content Release Quality Review & Coaching Note."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: Module 1: e-learning Content Release Quality Review, Coaching & Handoff Improvement Workplace Artifact Build
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-029' LIMIT 1),
  'Module 1: e-learning Content Release Quality Review, Coaching & Handoff Improvement Workplace Artifact Build',
  'Triggered when a quality review and team improvement task needs a real workplace artifact, not a theory answer. The learner studies the case, reviews the required data, identifies the gap, creates the artifact, and checks it against evidence fields.',
  1,
  '["Education & Skilling","Curriculum, Pedagogy & Learning Design","IND-CAP-06","L4","Digital asset readiness","Version control","Accessibility check","LMS content sequencing","Quiz rule validation"]'::jsonb,
  '["Engage","Explore","Explain","Express","Empower","Evolve","Artifact Build","Evidence Review","AI-Coached Retry"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Case: e-learning Content Release Quality Review, Coaching & Handoff Improvement
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-029' LIMIT 1)
   AND title = 'Module 1: e-learning Content Release Quality Review, Coaching & Handoff Improvement Workplace Artifact Build' LIMIT 1),
  'Workplace Case: e-learning Content Release Quality Review, Coaching & Handoff Improvement',
  'A team has already completed e-learning content release work for 38 digital learning assets for a 4-week course, but the supervisor sees repeated mistakes: video links, captions, quiz rules, file versions, and mobile previews are inconsistent before launch. The learner must review sampled outputs, identify quality gaps, write coaching notes, and improve the handoff standard for the team. The learner must solve the problem using the given data and produce the required workplace artifact.',
  'Workplace problem: A team has already completed e-learning content release work for 38 digital learning assets for a 4-week course, but the supervisor sees repeated mistakes: video links, captions, quiz rules, file versions, and mobile previews are inconsistent before launch. The learner must review sampled outputs, identify quality gaps, write coaching notes, and improve the handoff standard for the team. Pressure points: Quality pressure: team members are repeating similar mistakes. Learner must detect error patterns, give usable coaching, and improve the next handoff without blaming individuals. Root cause focus: Identify repeated error types, weak review habits, unclear team instructions, missing examples, or lack of coaching follow-up. Major concepts: Digital asset readiness; Version control; Accessibility check; LMS content sequencing; Quiz rule validation; Release sign-off; Quality sampling; Coaching evidence; Process improvement loop. Level focus: quality review and coaching. Required data: content inventory, LMS upload list, video links, caption files, quiz settings, version tracker, QA checklist Learner activity flow: Engage - Start with the case: 38 digital learning assets for a 4-week course and the visible pain point — video links, captions, quiz rules, file versions, and mobile previews are inconsistent before launch. Learner identifies who is affected and what could go wrong if the work is delayed or wrong. Explore - Learner studies the source data: content inventory, LMS upload list, video links, caption files, quiz settings, version tracker, QA checklist. They mark trusted records, missing fields, conflicting entries, and items that need confirmation before using them in the artifact. Explain - Teach the main logic in simple terms: Digital asset readiness; Version control; Accessibility check; LMS content sequencing; Quiz rule validation; Release sign-off; Quality sampling; Coaching evidence; Process improvement loop. Level focus: quality review and coaching. Show how rules, evidence, decisions, and handoff notes connect in this workplace task. Express - Learner produces the L4 e-learning Content Release Quality Review & Coaching Note using the case data, writes decisions in plain English, and shows evidence for each important field instead of giving only a theory answer. Empower - Learner uses AI only as a coach: ask for missing-field checks, clarity prompts, risk questions, and retry suggestions. AI should not create the final artifact for the learner. Evolve - Learner notes what would become harder at L5: more records, more conflicts, less guidance, stronger evidence expectations, and higher decision responsibility. Artifact to submit: L4 e-learning Content Release Quality Review & Coaching Note. L4 e-learning Content Release Quality Review & Coaching Note should contain: sample reviewed; quality error log; coaching observation; corrective example; handoff improvement note; follow-up action. Required source data: content inventory, LMS upload list, video links, caption files, quiz settings, version tracker, QA checklist. Evidence fields: Assess whether review comments are specific, coaching is practical, error patterns are named, and the improved handoff reduces repeat mistakes. AI support: AI coach can ask: What source proves this? Which field is missing? What is the risk if this is wrong? Who owns the next action? Learner must answer using the case data, not guesses.',
  1,
  '20 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Ed - Digital Pedagogy
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-029' LIMIT 1),
  'B.Ed - Digital Pedagogy',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Ed - Educational Technology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-029' LIMIT 1),
  'M.Ed - Educational Technology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BCA
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-029' LIMIT 1),
  'BCA',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc IT
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-029' LIMIT 1),
  'B.Sc IT',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PG Diploma Instructional Design
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-029' LIMIT 1),
  'PG Diploma Instructional Design',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Teacher Development Quality Review, Coaching & Handoff Improvement
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Teacher Development Quality Review, Coaching & Handoff Improvement',
  'COURSE-L4-034',
  'Learner can review quality, coach others, and improve the handoff process for and facilitate teacher development interventions linked to classroom practice gaps and submit a workplace-ready L4 Teacher Development Quality Review & Coaching Note. Workplace scenario: A team has already completed teacher development work for 32 teachers attending a classroom strategy workshop, but the supervisor sees repeated mistakes: teacher needs, session objectives, practice activities, and feedback tools are not aligned. The learner must review sampled outputs, identify quality gaps, write coaching notes, and improve the handoff standard for the team. Learner artifact: L4 Teacher Development Quality Review & Coaching Note. Required data: teacher needs survey, observation notes, session agenda, practice task sheet, feedback form, attendance list. Evidence: Assess whether review comments are specific, coaching is practical, error patterns are named, and the improved handoff reduces repeat mistakes.',
  '20 hours',
  'Active',
  'Curriculum, Pedagogy & Learning Design',
  'soft',
  '["Triggered when a quality review and team improvement task needs a real workplace artifact, not a theory answer.","Demonstrates quality review and team improvement by producing and defending the L4 Teacher Development Quality Review & Coaching Note.","Learner can review quality, coach others, and improve the handoff process for and facilitate teacher development interventions linked to classroom practice gaps and submit a workplace-ready L4 Teacher Development Quality Review & Coaching Note."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: Module 1: Teacher Development Quality Review, Coaching & Handoff Improvement Workplace Artifact Build
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-034' LIMIT 1),
  'Module 1: Teacher Development Quality Review, Coaching & Handoff Improvement Workplace Artifact Build',
  'Triggered when a quality review and team improvement task needs a real workplace artifact, not a theory answer. The learner studies the case, reviews the required data, identifies the gap, creates the artifact, and checks it against evidence fields.',
  1,
  '["Education & Skilling","Curriculum, Pedagogy & Learning Design","IND-CAP-07","L4","Teacher needs analysis","Training objective design","Practice-based facilitation","Observation evidence","Feedback loop"]'::jsonb,
  '["Engage","Explore","Explain","Express","Empower","Evolve","Artifact Build","Evidence Review","AI-Coached Retry"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Case: Teacher Development Quality Review, Coaching & Handoff Improvement
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-034' LIMIT 1)
   AND title = 'Module 1: Teacher Development Quality Review, Coaching & Handoff Improvement Workplace Artifact Build' LIMIT 1),
  'Workplace Case: Teacher Development Quality Review, Coaching & Handoff Improvement',
  'A team has already completed teacher development work for 32 teachers attending a classroom strategy workshop, but the supervisor sees repeated mistakes: teacher needs, session objectives, practice activities, and feedback tools are not aligned. The learner must review sampled outputs, identify quality gaps, write coaching notes, and improve the handoff standard for the team. The learner must solve the problem using the given data and produce the required workplace artifact.',
  'Workplace problem: A team has already completed teacher development work for 32 teachers attending a classroom strategy workshop, but the supervisor sees repeated mistakes: teacher needs, session objectives, practice activities, and feedback tools are not aligned. The learner must review sampled outputs, identify quality gaps, write coaching notes, and improve the handoff standard for the team. Pressure points: Quality pressure: team members are repeating similar mistakes. Learner must detect error patterns, give usable coaching, and improve the next handoff without blaming individuals. Root cause focus: Identify repeated error types, weak review habits, unclear team instructions, missing examples, or lack of coaching follow-up. Major concepts: Teacher needs analysis; Training objective design; Practice-based facilitation; Observation evidence; Feedback loop; Follow-up coaching; Quality sampling; Coaching evidence; Process improvement loop. Level focus: quality review and coaching. Required data: teacher needs survey, observation notes, session agenda, practice task sheet, feedback form, attendance list Learner activity flow: Engage - Start with the case: 32 teachers attending a classroom strategy workshop and the visible pain point — teacher needs, session objectives, practice activities, and feedback tools are not aligned. Learner identifies who is affected and what could go wrong if the work is delayed or wrong. Explore - Learner studies the source data: teacher needs survey, observation notes, session agenda, practice task sheet, feedback form, attendance list. They mark trusted records, missing fields, conflicting entries, and items that need confirmation before using them in the artifact. Explain - Teach the main logic in simple terms: Teacher needs analysis; Training objective design; Practice-based facilitation; Observation evidence; Feedback loop; Follow-up coaching; Quality sampling; Coaching evidence; Process improvement loop. Level focus: quality review and coaching. Show how rules, evidence, decisions, and handoff notes connect in this workplace task. Express - Learner produces the L4 Teacher Development Quality Review & Coaching Note using the case data, writes decisions in plain English, and shows evidence for each important field instead of giving only a theory answer. Empower - Learner uses AI only as a coach: ask for missing-field checks, clarity prompts, risk questions, and retry suggestions. AI should not create the final artifact for the learner. Evolve - Learner notes what would become harder at L5: more records, more conflicts, less guidance, stronger evidence expectations, and higher decision responsibility. Artifact to submit: L4 Teacher Development Quality Review & Coaching Note. L4 Teacher Development Quality Review & Coaching Note should contain: sample reviewed; quality error log; coaching observation; corrective example; handoff improvement note; follow-up action. Required source data: teacher needs survey, observation notes, session agenda, practice task sheet, feedback form, attendance list. Evidence fields: Assess whether review comments are specific, coaching is practical, error patterns are named, and the improved handoff reduces repeat mistakes. AI support: AI coach can ask: What source proves this? Which field is missing? What is the risk if this is wrong? Who owns the next action? Learner must answer using the case data, not guesses.',
  1,
  '20 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Ed - Teacher Education
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-034' LIMIT 1),
  'B.Ed - Teacher Education',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Ed - Teacher Development
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-034' LIMIT 1),
  'M.Ed - Teacher Development',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MA Education
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-034' LIMIT 1),
  'MA Education',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PG Diploma Faculty Development
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-034' LIMIT 1),
  'PG Diploma Faculty Development',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PG Diploma Educational Leadership
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-034' LIMIT 1),
  'PG Diploma Educational Leadership',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: STEAM Maker-Lab Project Cycle Quality Review, Coaching & Handoff Improvement
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'STEAM Maker-Lab Project Cycle Quality Review, Coaching & Handoff Improvement',
  'COURSE-L4-039',
  'Learner can review quality, coach others, and improve the handoff process for convert steam project goals into safe, resourced maker-lab learning cycles and submit a workplace-ready L4 STEAM Maker-Lab Project Cycle Quality Review & Coaching Note. Workplace scenario: A team has already completed steam maker-lab project work for 5 project teams using 3 shared lab zones, but the supervisor sees repeated mistakes: materials, safety rules, mentor time, and project milestones are unclear before the lab cycle starts. The learner must review sampled outputs, identify quality gaps, write coaching notes, and improve the handoff standard for the team. Learner artifact: L4 STEAM Maker-Lab Project Cycle Quality Review & Coaching Note. Required data: project brief, material list, safety checklist, lab schedule, mentor roster, team list, milestone tracker. Evidence: Assess whether review comments are specific, coaching is practical, error patterns are named, and the improved handoff reduces repeat mistakes.',
  '20 hours',
  'Active',
  'Curriculum, Pedagogy & Learning Design',
  'technical',
  '["Triggered when a quality review and team improvement task needs a real workplace artifact, not a theory answer.","Demonstrates quality review and team improvement by producing and defending the L4 STEAM Maker-Lab Project Cycle Quality Review & Coaching Note.","Learner can review quality, coach others, and improve the handoff process for convert steam project goals into safe, resourced maker-lab learning cycles and submit a workplace-ready L4 STEAM Maker-Lab Project Cycle Quality Review & Coaching Note."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: Module 1: STEAM Maker-Lab Project Cycle Quality Review, Coaching & Handoff Improvement Workplace Artifact Build
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-039' LIMIT 1),
  'Module 1: STEAM Maker-Lab Project Cycle Quality Review, Coaching & Handoff Improvement Workplace Artifact Build',
  'Triggered when a quality review and team improvement task needs a real workplace artifact, not a theory answer. The learner studies the case, reviews the required data, identifies the gap, creates the artifact, and checks it against evidence fields.',
  1,
  '["Education & Skilling","Curriculum, Pedagogy & Learning Design","IND-CAP-08","L4","Project cycle planning","Lab safety control","Material readiness","Mentor scheduling","Milestone tracking"]'::jsonb,
  '["Engage","Explore","Explain","Express","Empower","Evolve","Artifact Build","Evidence Review","AI-Coached Retry"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Case: STEAM Maker-Lab Project Cycle Quality Review, Coaching & Handoff Improvement
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-039' LIMIT 1)
   AND title = 'Module 1: STEAM Maker-Lab Project Cycle Quality Review, Coaching & Handoff Improvement Workplace Artifact Build' LIMIT 1),
  'Workplace Case: STEAM Maker-Lab Project Cycle Quality Review, Coaching & Handoff Improvement',
  'A team has already completed steam maker-lab project work for 5 project teams using 3 shared lab zones, but the supervisor sees repeated mistakes: materials, safety rules, mentor time, and project milestones are unclear before the lab cycle starts. The learner must review sampled outputs, identify quality gaps, write coaching notes, and improve the handoff standard for the team. The learner must solve the problem using the given data and produce the required workplace artifact.',
  'Workplace problem: A team has already completed steam maker-lab project work for 5 project teams using 3 shared lab zones, but the supervisor sees repeated mistakes: materials, safety rules, mentor time, and project milestones are unclear before the lab cycle starts. The learner must review sampled outputs, identify quality gaps, write coaching notes, and improve the handoff standard for the team. Pressure points: Quality pressure: team members are repeating similar mistakes. Learner must detect error patterns, give usable coaching, and improve the next handoff without blaming individuals. Root cause focus: Identify repeated error types, weak review habits, unclear team instructions, missing examples, or lack of coaching follow-up. Major concepts: Project cycle planning; Lab safety control; Material readiness; Mentor scheduling; Milestone tracking; Student collaboration evidence; Quality sampling; Coaching evidence; Process improvement loop. Level focus: quality review and coaching. Required data: project brief, material list, safety checklist, lab schedule, mentor roster, team list, milestone tracker Learner activity flow: Engage - Start with the case: 5 project teams using 3 shared lab zones and the visible pain point — materials, safety rules, mentor time, and project milestones are unclear before the lab cycle starts. Learner identifies who is affected and what could go wrong if the work is delayed or wrong. Explore - Learner studies the source data: project brief, material list, safety checklist, lab schedule, mentor roster, team list, milestone tracker. They mark trusted records, missing fields, conflicting entries, and items that need confirmation before using them in the artifact. Explain - Teach the main logic in simple terms: Project cycle planning; Lab safety control; Material readiness; Mentor scheduling; Milestone tracking; Student collaboration evidence; Quality sampling; Coaching evidence; Process improvement loop. Level focus: quality review and coaching. Show how rules, evidence, decisions, and handoff notes connect in this workplace task. Express - Learner produces the L4 STEAM Maker-Lab Project Cycle Quality Review & Coaching Note using the case data, writes decisions in plain English, and shows evidence for each important field instead of giving only a theory answer. Empower - Learner uses AI only as a coach: ask for missing-field checks, clarity prompts, risk questions, and retry suggestions. AI should not create the final artifact for the learner. Evolve - Learner notes what would become harder at L5: more records, more conflicts, less guidance, stronger evidence expectations, and higher decision responsibility. Artifact to submit: L4 STEAM Maker-Lab Project Cycle Quality Review & Coaching Note. L4 STEAM Maker-Lab Project Cycle Quality Review & Coaching Note should contain: sample reviewed; quality error log; coaching observation; corrective example; handoff improvement note; follow-up action. Required source data: project brief, material list, safety checklist, lab schedule, mentor roster, team list, milestone tracker. Evidence fields: Assess whether review comments are specific, coaching is practical, error patterns are named, and the improved handoff reduces repeat mistakes. AI support: AI coach can ask: What source proves this? Which field is missing? What is the risk if this is wrong? Who owns the next action? Learner must answer using the case data, not guesses.',
  1,
  '20 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Ed - Science Education
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-039' LIMIT 1),
  'B.Ed - Science Education',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Science Education
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-039' LIMIT 1),
  'B.Sc Science Education',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech - STEM Education Support
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-039' LIMIT 1),
  'B.Tech - STEM Education Support',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Voc Maker-Lab Facilitation
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-039' LIMIT 1),
  'B.Voc Maker-Lab Facilitation',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PG Diploma Experiential Learning
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-039' LIMIT 1),
  'PG Diploma Experiential Learning',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Vocational Batch Alignment Quality Review, Coaching & Handoff Improvement
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Vocational Batch Alignment Quality Review, Coaching & Handoff Improvement',
  'COURSE-L4-044',
  'Learner can review quality, coach others, and improve the handoff process for align vocational batches to qualification packs, trainer readiness, and assessment requirements and submit a workplace-ready L4 Vocational Batch Alignment Quality Review & Coaching Note. Workplace scenario: A team has already completed vocational batch alignment work for 92 learners in a job-role batch, but the supervisor sees repeated mistakes: qualification-pack outcomes, trainer availability, tools, practice hours, and assessment windows do not match. The learner must review sampled outputs, identify quality gaps, write coaching notes, and improve the handoff standard for the team. Learner artifact: L4 Vocational Batch Alignment Quality Review & Coaching Note. Required data: qualification pack, trainer roster, equipment list, batch profile, practice-hour plan, assessment schedule. Evidence: Assess whether review comments are specific, coaching is practical, error patterns are named, and the improved handoff reduces repeat mistakes.',
  '20 hours',
  'Active',
  'Skilling, Employability & Work-Integrated Learning',
  'technical',
  '["Triggered when a quality review and team improvement task needs a real workplace artifact, not a theory answer.","Demonstrates quality review and team improvement by producing and defending the L4 Vocational Batch Alignment Quality Review & Coaching Note.","Learner can review quality, coach others, and improve the handoff process for align vocational batches to qualification packs, trainer readiness, and assessment requirements and submit a workplace-ready L4 Vocational Batch Alignment Quality Review & Coaching Note."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: Module 1: Vocational Batch Alignment Quality Review, Coaching & Handoff Improvement Workplace Artifact Build
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-044' LIMIT 1),
  'Module 1: Vocational Batch Alignment Quality Review, Coaching & Handoff Improvement Workplace Artifact Build',
  'Triggered when a quality review and team improvement task needs a real workplace artifact, not a theory answer. The learner studies the case, reviews the required data, identifies the gap, creates the artifact, and checks it against evidence fields.',
  1,
  '["Education & Skilling","Skilling, Employability & Work-Integrated Learning","IND-CAP-09","L4","Qualification-pack interpretation","Batch-to-outcome mapping","Trainer readiness","Equipment and practice-hour planning","Assessment requirement check"]'::jsonb,
  '["Engage","Explore","Explain","Express","Empower","Evolve","Artifact Build","Evidence Review","AI-Coached Retry"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Case: Vocational Batch Alignment Quality Review, Coaching & Handoff Improvement
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-044' LIMIT 1)
   AND title = 'Module 1: Vocational Batch Alignment Quality Review, Coaching & Handoff Improvement Workplace Artifact Build' LIMIT 1),
  'Workplace Case: Vocational Batch Alignment Quality Review, Coaching & Handoff Improvement',
  'A team has already completed vocational batch alignment work for 92 learners in a job-role batch, but the supervisor sees repeated mistakes: qualification-pack outcomes, trainer availability, tools, practice hours, and assessment windows do not match. The learner must review sampled outputs, identify quality gaps, write coaching notes, and improve the handoff standard for the team. The learner must solve the problem using the given data and produce the required workplace artifact.',
  'Workplace problem: A team has already completed vocational batch alignment work for 92 learners in a job-role batch, but the supervisor sees repeated mistakes: qualification-pack outcomes, trainer availability, tools, practice hours, and assessment windows do not match. The learner must review sampled outputs, identify quality gaps, write coaching notes, and improve the handoff standard for the team. Pressure points: Quality pressure: team members are repeating similar mistakes. Learner must detect error patterns, give usable coaching, and improve the next handoff without blaming individuals. Root cause focus: Identify repeated error types, weak review habits, unclear team instructions, missing examples, or lack of coaching follow-up. Major concepts: Qualification-pack interpretation; Batch-to-outcome mapping; Trainer readiness; Equipment and practice-hour planning; Assessment requirement check; Compliance handoff; Quality sampling; Coaching evidence; Process improvement loop. Level focus: quality review and coaching. Required data: qualification pack, trainer roster, equipment list, batch profile, practice-hour plan, assessment schedule Learner activity flow: Engage - Start with the case: 92 learners in a job-role batch and the visible pain point — qualification-pack outcomes, trainer availability, tools, practice hours, and assessment windows do not match. Learner identifies who is affected and what could go wrong if the work is delayed or wrong. Explore - Learner studies the source data: qualification pack, trainer roster, equipment list, batch profile, practice-hour plan, assessment schedule. They mark trusted records, missing fields, conflicting entries, and items that need confirmation before using them in the artifact. Explain - Teach the main logic in simple terms: Qualification-pack interpretation; Batch-to-outcome mapping; Trainer readiness; Equipment and practice-hour planning; Assessment requirement check; Compliance handoff; Quality sampling; Coaching evidence; Process improvement loop. Level focus: quality review and coaching. Show how rules, evidence, decisions, and handoff notes connect in this workplace task. Express - Learner produces the L4 Vocational Batch Alignment Quality Review & Coaching Note using the case data, writes decisions in plain English, and shows evidence for each important field instead of giving only a theory answer. Empower - Learner uses AI only as a coach: ask for missing-field checks, clarity prompts, risk questions, and retry suggestions. AI should not create the final artifact for the learner. Evolve - Learner notes what would become harder at L5: more records, more conflicts, less guidance, stronger evidence expectations, and higher decision responsibility. Artifact to submit: L4 Vocational Batch Alignment Quality Review & Coaching Note. L4 Vocational Batch Alignment Quality Review & Coaching Note should contain: sample reviewed; quality error log; coaching observation; corrective example; handoff improvement note; follow-up action. Required source data: qualification pack, trainer roster, equipment list, batch profile, practice-hour plan, assessment schedule. Evidence fields: Assess whether review comments are specific, coaching is practical, error patterns are named, and the improved handoff reduces repeat mistakes. AI support: AI coach can ask: What source proves this? Which field is missing? What is the risk if this is wrong? Who owns the next action? Learner must answer using the case data, not guesses.',
  1,
  '20 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Voc - Vocational Education
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-044' LIMIT 1),
  'B.Voc - Vocational Education',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: Diploma in Vocational Training
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-044' LIMIT 1),
  'Diploma in Vocational Training',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BBA Skill Development
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-044' LIMIT 1),
  'BBA Skill Development',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PG Diploma Skill Development
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-044' LIMIT 1),
  'PG Diploma Skill Development',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MBA HR and Training
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-044' LIMIT 1),
  'MBA HR and Training',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Skilling Delivery & Placement Readiness Quality Review, Coaching & Handoff Improvement
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Skilling Delivery & Placement Readiness Quality Review, Coaching & Handoff Improvement',
  'COURSE-L4-049',
  'Learner can review quality, coach others, and improve the handoff process for monitor skilling delivery and placement readiness through attendance, practice, and employability evidence and submit a workplace-ready L4 Skilling Delivery & Placement Readiness Quality Review & Coaching Note. Workplace scenario: A team has already completed placement readiness work for 115 learners before employer interviews, but the supervisor sees repeated mistakes: resume status, mock interview scores, attendance, skill gaps, and employer criteria are scattered. The learner must review sampled outputs, identify quality gaps, write coaching notes, and improve the handoff standard for the team. Learner artifact: L4 Skilling Delivery & Placement Readiness Quality Review & Coaching Note. Required data: learner profile, resume tracker, mock interview scores, attendance, employer criteria, skill-gap notes. Evidence: Assess whether review comments are specific, coaching is practical, error patterns are named, and the improved handoff reduces repeat mistakes.',
  '20 hours',
  'Active',
  'Skilling, Employability & Work-Integrated Learning',
  'technical',
  '["Triggered when a quality review and team improvement task needs a real workplace artifact, not a theory answer.","Demonstrates quality review and team improvement by producing and defending the L4 Skilling Delivery & Placement Readiness Quality Review & Coaching Note.","Learner can review quality, coach others, and improve the handoff process for monitor skilling delivery and placement readiness through attendance, practice, and employability evidence and submit a workplace-ready L4 Skilling Delivery & Placement Readiness Quality Review & Coaching Note."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: Module 1: Skilling Delivery & Placement Readiness Quality Review, Coaching & Handoff Improvement Workplace Artifact Build
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-049' LIMIT 1),
  'Module 1: Skilling Delivery & Placement Readiness Quality Review, Coaching & Handoff Improvement Workplace Artifact Build',
  'Triggered when a quality review and team improvement task needs a real workplace artifact, not a theory answer. The learner studies the case, reviews the required data, identifies the gap, creates the artifact, and checks it against evidence fields.',
  1,
  '["Education & Skilling","Skilling, Employability & Work-Integrated Learning","IND-CAP-10","L4","Employability readiness indicators","Employer criteria matching","Resume and interview evidence","Readiness scoring","Shortlist logic"]'::jsonb,
  '["Engage","Explore","Explain","Express","Empower","Evolve","Artifact Build","Evidence Review","AI-Coached Retry"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Case: Skilling Delivery & Placement Readiness Quality Review, Coaching & Handoff Improvement
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-049' LIMIT 1)
   AND title = 'Module 1: Skilling Delivery & Placement Readiness Quality Review, Coaching & Handoff Improvement Workplace Artifact Build' LIMIT 1),
  'Workplace Case: Skilling Delivery & Placement Readiness Quality Review, Coaching & Handoff Improvement',
  'A team has already completed placement readiness work for 115 learners before employer interviews, but the supervisor sees repeated mistakes: resume status, mock interview scores, attendance, skill gaps, and employer criteria are scattered. The learner must review sampled outputs, identify quality gaps, write coaching notes, and improve the handoff standard for the team. The learner must solve the problem using the given data and produce the required workplace artifact.',
  'Workplace problem: A team has already completed placement readiness work for 115 learners before employer interviews, but the supervisor sees repeated mistakes: resume status, mock interview scores, attendance, skill gaps, and employer criteria are scattered. The learner must review sampled outputs, identify quality gaps, write coaching notes, and improve the handoff standard for the team. Pressure points: Quality pressure: team members are repeating similar mistakes. Learner must detect error patterns, give usable coaching, and improve the next handoff without blaming individuals. Root cause focus: Identify repeated error types, weak review habits, unclear team instructions, missing examples, or lack of coaching follow-up. Major concepts: Employability readiness indicators; Employer criteria matching; Resume and interview evidence; Readiness scoring; Shortlist logic; Placement handoff; Quality sampling; Coaching evidence; Process improvement loop. Level focus: quality review and coaching. Required data: learner profile, resume tracker, mock interview scores, attendance, employer criteria, skill-gap notes Learner activity flow: Engage - Start with the case: 115 learners before employer interviews and the visible pain point — resume status, mock interview scores, attendance, skill gaps, and employer criteria are scattered. Learner identifies who is affected and what could go wrong if the work is delayed or wrong. Explore - Learner studies the source data: learner profile, resume tracker, mock interview scores, attendance, employer criteria, skill-gap notes. They mark trusted records, missing fields, conflicting entries, and items that need confirmation before using them in the artifact. Explain - Teach the main logic in simple terms: Employability readiness indicators; Employer criteria matching; Resume and interview evidence; Readiness scoring; Shortlist logic; Placement handoff; Quality sampling; Coaching evidence; Process improvement loop. Level focus: quality review and coaching. Show how rules, evidence, decisions, and handoff notes connect in this workplace task. Express - Learner produces the L4 Skilling Delivery & Placement Readiness Quality Review & Coaching Note using the case data, writes decisions in plain English, and shows evidence for each important field instead of giving only a theory answer. Empower - Learner uses AI only as a coach: ask for missing-field checks, clarity prompts, risk questions, and retry suggestions. AI should not create the final artifact for the learner. Evolve - Learner notes what would become harder at L5: more records, more conflicts, less guidance, stronger evidence expectations, and higher decision responsibility. Artifact to submit: L4 Skilling Delivery & Placement Readiness Quality Review & Coaching Note. L4 Skilling Delivery & Placement Readiness Quality Review & Coaching Note should contain: sample reviewed; quality error log; coaching observation; corrective example; handoff improvement note; follow-up action. Required source data: learner profile, resume tracker, mock interview scores, attendance, employer criteria, skill-gap notes. Evidence fields: Assess whether review comments are specific, coaching is practical, error patterns are named, and the improved handoff reduces repeat mistakes. AI support: AI coach can ask: What source proves this? Which field is missing? What is the risk if this is wrong? Who owns the next action? Learner must answer using the case data, not guesses.',
  1,
  '20 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Voc - Skill Development
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-049' LIMIT 1),
  'B.Voc - Skill Development',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BBA Training and Placement
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-049' LIMIT 1),
  'BBA Training and Placement',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MBA HR
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-049' LIMIT 1),
  'MBA HR',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PG Diploma Employability Training
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-049' LIMIT 1),
  'PG Diploma Employability Training',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MSW - Livelihood Programs
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-049' LIMIT 1),
  'MSW - Livelihood Programs',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Internship & Apprenticeship Matching Quality Review, Coaching & Handoff Improvement
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Internship & Apprenticeship Matching Quality Review, Coaching & Handoff Improvement',
  'COURSE-L4-054',
  'Learner can review quality, coach others, and improve the handoff process for match learners to internship and apprenticeship opportunities using eligibility, employer, and learning-plan evidence and submit a workplace-ready L4 Internship & Apprenticeship Matching Quality Review & Coaching Note. Workplace scenario: A team has already completed internship matching work for 86 eligible learners and 27 employer slots, but the supervisor sees repeated mistakes: locations, stipend rules, joining dates, skill requirements, and eligibility conditions conflict. The learner must review sampled outputs, identify quality gaps, write coaching notes, and improve the handoff standard for the team. Learner artifact: L4 Internship & Apprenticeship Matching Quality Review & Coaching Note. Required data: learner preference form, employer slot list, eligibility rules, location constraints, stipend details, joining deadlines. Evidence: Assess whether review comments are specific, coaching is practical, error patterns are named, and the improved handoff reduces repeat mistakes.',
  '20 hours',
  'Active',
  'Skilling, Employability & Work-Integrated Learning',
  'technical',
  '["Triggered when a quality review and team improvement task needs a real workplace artifact, not a theory answer.","Demonstrates quality review and team improvement by producing and defending the L4 Internship & Apprenticeship Matching Quality Review & Coaching Note.","Learner can review quality, coach others, and improve the handoff process for match learners to internship and apprenticeship opportunities using eligibility, employer, and learning-plan evidence and submit a workplace-ready L4 Internship & Apprenticeship Matching Quality Review & Coaching Note."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: Module 1: Internship & Apprenticeship Matching Quality Review, Coaching & Handoff Improvement Workplace Artifact Build
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-054' LIMIT 1),
  'Module 1: Internship & Apprenticeship Matching Quality Review, Coaching & Handoff Improvement Workplace Artifact Build',
  'Triggered when a quality review and team improvement task needs a real workplace artifact, not a theory answer. The learner studies the case, reviews the required data, identifies the gap, creates the artifact, and checks it against evidence fields.',
  1,
  '["Education & Skilling","Skilling, Employability & Work-Integrated Learning","IND-CAP-11","L4","Eligibility matching","Employer requirement mapping","Learner preference handling","Constraint-based shortlisting","Justification note"]'::jsonb,
  '["Engage","Explore","Explain","Express","Empower","Evolve","Artifact Build","Evidence Review","AI-Coached Retry"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Case: Internship & Apprenticeship Matching Quality Review, Coaching & Handoff Improvement
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-054' LIMIT 1)
   AND title = 'Module 1: Internship & Apprenticeship Matching Quality Review, Coaching & Handoff Improvement Workplace Artifact Build' LIMIT 1),
  'Workplace Case: Internship & Apprenticeship Matching Quality Review, Coaching & Handoff Improvement',
  'A team has already completed internship matching work for 86 eligible learners and 27 employer slots, but the supervisor sees repeated mistakes: locations, stipend rules, joining dates, skill requirements, and eligibility conditions conflict. The learner must review sampled outputs, identify quality gaps, write coaching notes, and improve the handoff standard for the team. The learner must solve the problem using the given data and produce the required workplace artifact.',
  'Workplace problem: A team has already completed internship matching work for 86 eligible learners and 27 employer slots, but the supervisor sees repeated mistakes: locations, stipend rules, joining dates, skill requirements, and eligibility conditions conflict. The learner must review sampled outputs, identify quality gaps, write coaching notes, and improve the handoff standard for the team. Pressure points: Quality pressure: team members are repeating similar mistakes. Learner must detect error patterns, give usable coaching, and improve the next handoff without blaming individuals. Root cause focus: Identify repeated error types, weak review habits, unclear team instructions, missing examples, or lack of coaching follow-up. Major concepts: Eligibility matching; Employer requirement mapping; Learner preference handling; Constraint-based shortlisting; Justification note; Joining risk tracking; Quality sampling; Coaching evidence; Process improvement loop. Level focus: quality review and coaching. Required data: learner preference form, employer slot list, eligibility rules, location constraints, stipend details, joining deadlines Learner activity flow: Engage - Start with the case: 86 eligible learners and 27 employer slots and the visible pain point — locations, stipend rules, joining dates, skill requirements, and eligibility conditions conflict. Learner identifies who is affected and what could go wrong if the work is delayed or wrong. Explore - Learner studies the source data: learner preference form, employer slot list, eligibility rules, location constraints, stipend details, joining deadlines. They mark trusted records, missing fields, conflicting entries, and items that need confirmation before using them in the artifact. Explain - Teach the main logic in simple terms: Eligibility matching; Employer requirement mapping; Learner preference handling; Constraint-based shortlisting; Justification note; Joining risk tracking; Quality sampling; Coaching evidence; Process improvement loop. Level focus: quality review and coaching. Show how rules, evidence, decisions, and handoff notes connect in this workplace task. Express - Learner produces the L4 Internship & Apprenticeship Matching Quality Review & Coaching Note using the case data, writes decisions in plain English, and shows evidence for each important field instead of giving only a theory answer. Empower - Learner uses AI only as a coach: ask for missing-field checks, clarity prompts, risk questions, and retry suggestions. AI should not create the final artifact for the learner. Evolve - Learner notes what would become harder at L5: more records, more conflicts, less guidance, stronger evidence expectations, and higher decision responsibility. Artifact to submit: L4 Internship & Apprenticeship Matching Quality Review & Coaching Note. L4 Internship & Apprenticeship Matching Quality Review & Coaching Note should contain: sample reviewed; quality error log; coaching observation; corrective example; handoff improvement note; follow-up action. Required source data: learner preference form, employer slot list, eligibility rules, location constraints, stipend details, joining deadlines. Evidence fields: Assess whether review comments are specific, coaching is practical, error patterns are named, and the improved handoff reduces repeat mistakes. AI support: AI coach can ask: What source proves this? Which field is missing? What is the risk if this is wrong? Who owns the next action? Learner must answer using the case data, not guesses.',
  1,
  '20 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Voc - Work Integrated Learning
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-054' LIMIT 1),
  'B.Voc - Work Integrated Learning',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BBA HR
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-054' LIMIT 1),
  'BBA HR',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MBA HR
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-054' LIMIT 1),
  'MBA HR',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PG Diploma Apprenticeship Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-054' LIMIT 1),
  'PG Diploma Apprenticeship Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PG Diploma Internship Coordination
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L4-054' LIMIT 1),
  'PG Diploma Internship Coordination',
  NOW()
) ON CONFLICT DO NOTHING;

COMMIT;

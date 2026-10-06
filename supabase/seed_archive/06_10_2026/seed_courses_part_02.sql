-- ============================================
-- COURSE SEED — part 02 of 10
-- Courses 51–100 of 485
-- Paste this whole file into the Supabase SQL editor and Run.
-- Safe to re-run (ON CONFLICT DO NOTHING). Run parts in order.
-- ============================================

BEGIN;

-- Insert Course: Diagnose a Production Exception in NLP and LLM Evaluation
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Diagnose a Production Exception in NLP and LLM Evaluation',
  'CRS-IND-CL-043',
  'By the end of this course, the learner can diagnose an exception in NLP and LLM Evaluation by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact. Workplace problem: An exception case is raised during customer-support ticket routing release because an LLM extraction feature shows conflicting evidence around structured-output errors and label-schema mismatch. The expected volume is 24,530 prompts, but only 22,940 prompts are usable, creating a 6.5% variance against the control expectation. 12.4% of outputs fail the required JSON schema and refund-intent labels are confused with complaint-intent. The accepted rule is: JSON validity must exceed 98% and critical label errors below 1%. The learner receives prompt set, LLM evaluation result table, label schema definition, failure examples, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the NLP/LLM Evaluation Failure Analysis Pack. The learner must compare possible causes, select the most likely root cause, and prepare an escalation-ready artifact. Artifact: NLP/LLM Evaluation Failure Analysis Pack - Exception Diagnosis Pack.',
  '12 hours',
  'Active',
  'Machine Learning, Deep Learning & NLP Engineering; AI Product & GenAI Application Development',
  'technical',
  '["By the end of this course, the learner can diagnose an exception in NLP and LLM Evaluation by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact","Learner demonstrates NLP and LLM Evaluation by interpreting real-looking numbers, comparing evidence from prompt set and LLM evaluation result table, and producing a decision-ready artifact","Proves the learner can perform exception diagnosis work in NLP and LLM Evaluation with numeric evidence, workplace documents, and a reviewer-ready artifact. Status: Demo Ready"]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L3 Module: NLP and LLM Evaluation Workplace Mission
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-043' LIMIT 1),
  'L3 Module: NLP and LLM Evaluation Workplace Mission',
  'Industry requirement: Teams responsible for an LLM extraction feature need learners who can use numeric evidence, threshold rules, and workplace documents to make reliable decisions during customer-support ticket routing release, not only explain NLP and LLM Evaluation theoretically. Gap addressed: Academic learning may cover the concepts behind NLP and LLM Evaluation, but it usually does not make learners practice with prompt set, LLM evaluation result table, label schema definition, numeric variance, threshold decisions, and role handoff artifacts. Trigger: two evidence sources disagree and the normal checklist cannot close the case: 22,940 of 24,530 prompts passed the check, variance 6.5%, with signal ''structured-output errors and label-schema mismatch''.',
  1,
  '["Data & AI","Machine Learning, Deep Learning & NLP Engineering","AI Product & GenAI Application Development","NLP and LLM Evaluation","Primary: Evidence. Supporting: Technical, Functional, Domain","structured-output validation","label-schema compliance","confusion matrix review","prompt failure pattern","downstream routing risk","expected 24,530 vs actual 22,940 prompts","6.5% variance interpretation","threshold rule: JSON validity must exceed 98% and critical label errors below 1%","exception hypothesis testing","severity classification"]'::jsonb,
  '["Engage: Learner receives a exception diagnosis case: customer-support ticket routing release is at risk because only 22,940 of 24,530 prompts passed the control and structured-output errors and label-schema mismatch is visible","Explore: Learner reviews prompt set, LLM evaluation result table, label schema definition, failure examples, routing product requirement, highlights the fields that prove the issue, and notes which values cross the threshold","Explain: Learner studies structured-output validation, label-schema compliance, confusion matrix review, prompt failure pattern and learns how these concepts explain the business risk, not just the technical error","Express: Learner prepares the NLP/LLM Evaluation Failure Analysis Pack with issue summary, numeric evidence, root-cause hypothesis, decision, and handoff note","Empower: Learner must justify the most likely cause and escalation path for customer-support ticket routing release","Evolve: Learner writes what evidence would be needed next time to separate the competing root causes faster"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Scenario: NLP/LLM Evaluation Failure Analysis Pack - Exception Diagnosis Pack
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-043' LIMIT 1)
   AND title = 'L3 Module: NLP and LLM Evaluation Workplace Mission' LIMIT 1),
  'Workplace Scenario: NLP/LLM Evaluation Failure Analysis Pack - Exception Diagnosis Pack',
  'An exception case is raised during customer-support ticket routing release because an LLM extraction feature shows conflicting evidence around structured-output errors and label-schema mismatch. The expected volume is 24,530 prompts, but only 22,940 prompts are usable, creating a 6.5% variance against the control expectation. 12.4% of outputs fail the required JSON schema and refund-intent labels are confused with complaint-intent. The accepted rule is: JSON validity must exceed 98% and critical label errors below 1%. The learner receives prompt set, LLM evaluation result table, label schema definition, failure examples, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the NLP/LLM Evaluation Failure Analysis Pack. The learner must compare possible causes, select the most likely root cause, and prepare an escalation-ready artifact. Pressure points: Customer-support ticket routing release is time-sensitive; variance is 6.5% against the rule; 12.4% of outputs fail the required JSON schema and refund-intent labels are confused with complaint-intent; the evidence is conflicting, the business owner is asking for a decision, and escalation must be justified.',
  'Course trigger: two evidence sources disagree and the normal checklist cannot close the case: 22,940 of 24,530 prompts passed the check, variance 6.5%, with signal ''structured-output errors and label-schema mismatch''.
Problem statement: An exception case is raised during customer-support ticket routing release because an LLM extraction feature shows conflicting evidence around structured-output errors and label-schema mismatch. The expected volume is 24,530 prompts, but only 22,940 prompts are usable, creating a 6.5% variance against the control expectation. 12.4% of outputs fail the required JSON schema and refund-intent labels are confused with complaint-intent. The accepted rule is: JSON validity must exceed 98% and critical label errors below 1%. The learner receives prompt set, LLM evaluation result table, label schema definition, failure examples, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the NLP/LLM Evaluation Failure Analysis Pack. The learner must compare possible causes, select the most likely root cause, and prepare an escalation-ready artifact.
Major concepts: structured-output validation; label-schema compliance; confusion matrix review; prompt failure pattern; downstream routing risk; expected 24,530 vs actual 22,940 prompts; 6.5% variance interpretation; threshold rule: JSON validity must exceed 98% and critical label errors below 1%; exception hypothesis testing; severity classification.
Root-cause focus: Test competing hypotheses and choose between: ambiguous labels, prompt instruction weakness, schema constraint failure, retrieval context noise, or unsupported edge cases. Evidence must come from prompt set, LLM evaluation result table, label schema definition.
Required data: prompt set; LLM evaluation result table; label schema definition; failure examples; routing product requirement; conflicting evidence extract; exception escalation policy
Artifact: NLP/LLM Evaluation Failure Analysis Pack - Exception Diagnosis Pack
Artifact structure: case summary; expected vs actual numbers; threshold rule; evidence table from prompt set, LLM evaluation result table, label schema definition; root-cause hypothesis; decision/action; risk note; role handoff.
Evidence fields to assess: captures expected 24,530 and actual 22,940 prompts; calculates or explains 6.5% variance; uses threshold rule correctly (JSON validity must exceed 98% and critical label errors below 1%); cites at least three input documents; links evidence to root-cause hypothesis; states clear release/hold/correct/escalate decision.
AI support tips: Use AI as a coach to ask evidence-checking questions, explain unfamiliar terms, compare possible root causes, and improve clarity. Do not use AI to invent numbers or make the decision without citing the provided documents.',
  1,
  '12 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech CSE - AI & Machine Learning Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-043' LIMIT 1),
  'B.Tech CSE - AI & Machine Learning Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech AI & Data Science - ML Engineering Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-043' LIMIT 1),
  'B.Tech AI & Data Science - ML Engineering Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Tech AI / Machine Learning Engineering
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-043' LIMIT 1),
  'M.Tech AI / Machine Learning Engineering',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Sc AI & Machine Learning
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-043' LIMIT 1),
  'M.Sc AI & Machine Learning',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MCA - AI / ML Application Development
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-043' LIMIT 1),
  'MCA - AI / ML Application Development',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech CSE - AI Product Engineering Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-043' LIMIT 1),
  'B.Tech CSE - AI Product Engineering Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Diagnose a Production Exception in Canary Model Release Operation
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Diagnose a Production Exception in Canary Model Release Operation',
  'CRS-IND-CL-048',
  'By the end of this course, the learner can diagnose an exception in Canary Model Release Operation by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact. Workplace problem: An exception case is raised during fraud model production rollout because a canary model release shows conflicting evidence around canary traffic metrics breach release guardrail. The expected volume is 147,100 transactions, but only 131,300 transactions are usable, creating a 10.7% variance against the control expectation. Canary false positives increased by 3.7 points and p95 latency moved from 180 ms to 310 ms. The accepted rule is: canary false-positive increase must stay below 2 points. The learner receives release checklist, canary metric dashboard, rollback decision log, model version registry, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Canary Model Release Decision Record. The learner must compare possible causes, select the most likely root cause, and prepare an escalation-ready artifact. Artifact: Canary Model Release Decision Record - Exception Diagnosis Pack.',
  '12 hours',
  'Active',
  'MLOps & AI Platform Operations',
  'technical',
  '["By the end of this course, the learner can diagnose an exception in Canary Model Release Operation by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact","Learner demonstrates Canary Model Release Operation by interpreting real-looking numbers, comparing evidence from release checklist and canary metric dashboard, and producing a decision-ready artifact","Proves the learner can perform exception diagnosis work in Canary Model Release Operation with numeric evidence, workplace documents, and a reviewer-ready artifact. Status: Demo Ready"]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L3 Module: Canary Model Release Operation Workplace Mission
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-048' LIMIT 1),
  'L3 Module: Canary Model Release Operation Workplace Mission',
  'Industry requirement: Teams responsible for a canary model release need learners who can use numeric evidence, threshold rules, and workplace documents to make reliable decisions during fraud model production rollout, not only explain Canary Model Release Operation theoretically. Gap addressed: Academic learning may cover the concepts behind Canary Model Release Operation, but it usually does not make learners practice with release checklist, canary metric dashboard, rollback decision log, numeric variance, threshold decisions, and role handoff artifacts. Trigger: two evidence sources disagree and the normal checklist cannot close the case: 131,300 of 147,100 transactions passed the check, variance 10.7%, with signal ''canary traffic metrics breach release guardrail''.',
  1,
  '["Data & AI","MLOps & AI Platform Operations","Canary Model Release Operation","Primary: Evidence. Supporting: Technical, Functional, Domain","canary traffic split","release guardrails","rollback threshold","latency monitoring","model version control","expected 147,100 vs actual 131,300 transactions","10.7% variance interpretation","threshold rule: canary false-positive increase must stay below 2 points","exception hypothesis testing","severity classification"]'::jsonb,
  '["Engage: Learner receives a exception diagnosis case: fraud model production rollout is at risk because only 131,300 of 147,100 transactions passed the control and canary traffic metrics breach release guardrail is visible","Explore: Learner reviews release checklist, canary metric dashboard, rollback decision log, model version registry, incident communication draft, highlights the fields that prove the issue, and notes which values cross the threshold","Explain: Learner studies canary traffic split, release guardrails, rollback threshold, latency monitoring and learns how these concepts explain the business risk, not just the technical error","Express: Learner prepares the Canary Model Release Decision Record with issue summary, numeric evidence, root-cause hypothesis, decision, and handoff note","Empower: Learner must justify the most likely cause and escalation path for fraud model production rollout","Evolve: Learner writes what evidence would be needed next time to separate the competing root causes faster"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Scenario: Canary Model Release Decision Record - Exception Diagnosis Pack
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-048' LIMIT 1)
   AND title = 'L3 Module: Canary Model Release Operation Workplace Mission' LIMIT 1),
  'Workplace Scenario: Canary Model Release Decision Record - Exception Diagnosis Pack',
  'An exception case is raised during fraud model production rollout because a canary model release shows conflicting evidence around canary traffic metrics breach release guardrail. The expected volume is 147,100 transactions, but only 131,300 transactions are usable, creating a 10.7% variance against the control expectation. Canary false positives increased by 3.7 points and p95 latency moved from 180 ms to 310 ms. The accepted rule is: canary false-positive increase must stay below 2 points. The learner receives release checklist, canary metric dashboard, rollback decision log, model version registry, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Canary Model Release Decision Record. The learner must compare possible causes, select the most likely root cause, and prepare an escalation-ready artifact. Pressure points: Fraud model production rollout is time-sensitive; variance is 10.7% against the rule; canary false positives increased by 3.7 points and p95 latency moved from 180 ms to 310 ms; the evidence is conflicting, the business owner is asking for a decision, and escalation must be justified.',
  'Course trigger: two evidence sources disagree and the normal checklist cannot close the case: 131,300 of 147,100 transactions passed the check, variance 10.7%, with signal ''canary traffic metrics breach release guardrail''.
Problem statement: An exception case is raised during fraud model production rollout because a canary model release shows conflicting evidence around canary traffic metrics breach release guardrail. The expected volume is 147,100 transactions, but only 131,300 transactions are usable, creating a 10.7% variance against the control expectation. Canary false positives increased by 3.7 points and p95 latency moved from 180 ms to 310 ms. The accepted rule is: canary false-positive increase must stay below 2 points. The learner receives release checklist, canary metric dashboard, rollback decision log, model version registry, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Canary Model Release Decision Record. The learner must compare possible causes, select the most likely root cause, and prepare an escalation-ready artifact.
Major concepts: canary traffic split; release guardrails; rollback threshold; latency monitoring; model version control; expected 147,100 vs actual 131,300 transactions; 10.7% variance interpretation; threshold rule: canary false-positive increase must stay below 2 points; exception hypothesis testing; severity classification.
Root-cause focus: Test competing hypotheses and choose between: model threshold mismatch, feature parity issue, latency regression, bad canary split, or rollback criteria not met. Evidence must come from release checklist, canary metric dashboard, rollback decision log.
Required data: release checklist; canary metric dashboard; rollback decision log; model version registry; incident communication draft; conflicting evidence extract; exception escalation policy
Artifact: Canary Model Release Decision Record - Exception Diagnosis Pack
Artifact structure: case summary; expected vs actual numbers; threshold rule; evidence table from release checklist, canary metric dashboard, rollback decision log; root-cause hypothesis; decision/action; risk note; role handoff.
Evidence fields to assess: captures expected 147,100 and actual 131,300 transactions; calculates or explains 10.7% variance; uses threshold rule correctly (canary false-positive increase must stay below 2 points); cites at least three input documents; links evidence to root-cause hypothesis; states clear release/hold/correct/escalate decision.
AI support tips: Use AI as a coach to ask evidence-checking questions, explain unfamiliar terms, compare possible root causes, and improve clarity. Do not use AI to invent numbers or make the decision without citing the provided documents.',
  1,
  '12 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech CSE - AI & Machine Learning Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-048' LIMIT 1),
  'B.Tech CSE - AI & Machine Learning Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech AI & Data Science - ML Engineering Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-048' LIMIT 1),
  'B.Tech AI & Data Science - ML Engineering Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Tech AI / Machine Learning Engineering
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-048' LIMIT 1),
  'M.Tech AI / Machine Learning Engineering',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Sc AI & Machine Learning
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-048' LIMIT 1),
  'M.Sc AI & Machine Learning',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MCA - AI / ML Application Development
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-048' LIMIT 1),
  'MCA - AI / ML Application Development',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech CSE - Cloud AI / MLOps Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-048' LIMIT 1),
  'B.Tech CSE - Cloud AI / MLOps Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Diagnose a Production Exception in Model Drift Response
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Diagnose a Production Exception in Model Drift Response',
  'CRS-IND-CL-053',
  'By the end of this course, the learner can diagnose an exception in Model Drift Response by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact. Workplace problem: An exception case is raised during monthly drift alert review because a production credit-risk model shows conflicting evidence around feature-skew and segment-level performance drift. The expected volume is 233,470 predictions, but only 205,040 predictions are usable, creating a 12.2% variance against the control expectation. Income_band PSI is 0.31 and AUC for new-to-credit users dropped from 0.78 to 0.71. The accepted rule is: PSI above 0.20 or AUC drop above 3 points requires triage. The learner receives drift alert log, feature-skew diagnostic sheet, production prediction sample, threshold decision record, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Model Drift Response Triage Pack. The learner must compare possible causes, select the most likely root cause, and prepare an escalation-ready artifact. Artifact: Model Drift Response Triage Pack - Exception Diagnosis Pack.',
  '12 hours',
  'Active',
  'MLOps & AI Platform Operations; Data Platform Engineering',
  'technical',
  '["By the end of this course, the learner can diagnose an exception in Model Drift Response by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact","Learner demonstrates Model Drift Response by interpreting real-looking numbers, comparing evidence from drift alert log and feature-skew diagnostic sheet, and producing a decision-ready artifact","Proves the learner can perform exception diagnosis work in Model Drift Response with numeric evidence, workplace documents, and a reviewer-ready artifact. Status: Pilot Ready — Evidence Strengthening Needed"]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L3 Module: Model Drift Response Workplace Mission
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-053' LIMIT 1),
  'L3 Module: Model Drift Response Workplace Mission',
  'Industry requirement: Teams responsible for a production credit-risk model need learners who can use numeric evidence, threshold rules, and workplace documents to make reliable decisions during monthly drift alert review, not only explain Model Drift Response theoretically. Gap addressed: Academic learning may cover the concepts behind Model Drift Response, but it usually does not make learners practice with drift alert log, feature-skew diagnostic sheet, production prediction sample, numeric variance, threshold decisions, and role handoff artifacts. Trigger: two evidence sources disagree and the normal checklist cannot close the case: 205,040 of 233,470 predictions passed the check, variance 12.2%, with signal ''feature-skew and segment-level performance drift''.',
  1,
  '["Data & AI","MLOps & AI Platform Operations","Data Platform Engineering","Model Drift Response","Primary: Evidence. Supporting: Technical, Functional, Domain","population stability index","segment-level drift","feature-skew evidence","AUC degradation","retrain versus monitor decision","expected 233,470 vs actual 205,040 predictions","12.2% variance interpretation","threshold rule: PSI above 0.20 or AUC drop above 3 points requires triage","exception hypothesis testing","severity classification"]'::jsonb,
  '["Engage: Learner receives a exception diagnosis case: monthly drift alert review is at risk because only 205,040 of 233,470 predictions passed the control and feature-skew and segment-level performance drift is visible","Explore: Learner reviews drift alert log, feature-skew diagnostic sheet, production prediction sample, threshold decision record, previous retraining note, highlights the fields that prove the issue, and notes which values cross the threshold","Explain: Learner studies population stability index, segment-level drift, feature-skew evidence, AUC degradation and learns how these concepts explain the business risk, not just the technical error","Express: Learner prepares the Model Drift Response Triage Pack with issue summary, numeric evidence, root-cause hypothesis, decision, and handoff note","Empower: Learner must justify the most likely cause and escalation path for monthly drift alert review","Evolve: Learner writes what evidence would be needed next time to separate the competing root causes faster"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Scenario: Model Drift Response Triage Pack - Exception Diagnosis Pack
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-053' LIMIT 1)
   AND title = 'L3 Module: Model Drift Response Workplace Mission' LIMIT 1),
  'Workplace Scenario: Model Drift Response Triage Pack - Exception Diagnosis Pack',
  'An exception case is raised during monthly drift alert review because a production credit-risk model shows conflicting evidence around feature-skew and segment-level performance drift. The expected volume is 233,470 predictions, but only 205,040 predictions are usable, creating a 12.2% variance against the control expectation. Income_band PSI is 0.31 and AUC for new-to-credit users dropped from 0.78 to 0.71. The accepted rule is: PSI above 0.20 or AUC drop above 3 points requires triage. The learner receives drift alert log, feature-skew diagnostic sheet, production prediction sample, threshold decision record, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Model Drift Response Triage Pack. The learner must compare possible causes, select the most likely root cause, and prepare an escalation-ready artifact. Pressure points: Monthly drift alert review is time-sensitive; variance is 12.2% against the rule; income_band PSI is 0.31 and AUC for new-to-credit users dropped from 0.78 to 0.71; the evidence is conflicting, the business owner is asking for a decision, and escalation must be justified.',
  'Course trigger: two evidence sources disagree and the normal checklist cannot close the case: 205,040 of 233,470 predictions passed the check, variance 12.2%, with signal ''feature-skew and segment-level performance drift''.
Problem statement: An exception case is raised during monthly drift alert review because a production credit-risk model shows conflicting evidence around feature-skew and segment-level performance drift. The expected volume is 233,470 predictions, but only 205,040 predictions are usable, creating a 12.2% variance against the control expectation. Income_band PSI is 0.31 and AUC for new-to-credit users dropped from 0.78 to 0.71. The accepted rule is: PSI above 0.20 or AUC drop above 3 points requires triage. The learner receives drift alert log, feature-skew diagnostic sheet, production prediction sample, threshold decision record, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Model Drift Response Triage Pack. The learner must compare possible causes, select the most likely root cause, and prepare an escalation-ready artifact.
Major concepts: population stability index; segment-level drift; feature-skew evidence; AUC degradation; retrain versus monitor decision; expected 233,470 vs actual 205,040 predictions; 12.2% variance interpretation; threshold rule: PSI above 0.20 or AUC drop above 3 points requires triage; exception hypothesis testing; severity classification.
Root-cause focus: Test competing hypotheses and choose between: population shift, feature pipeline change, model degradation, threshold misconfiguration, or seasonal behavior change. Evidence must come from drift alert log, feature-skew diagnostic sheet, production prediction sample.
Required data: drift alert log; feature-skew diagnostic sheet; production prediction sample; threshold decision record; previous retraining note; conflicting evidence extract; exception escalation policy
Artifact: Model Drift Response Triage Pack - Exception Diagnosis Pack
Artifact structure: case summary; expected vs actual numbers; threshold rule; evidence table from drift alert log, feature-skew diagnostic sheet, production prediction sample; root-cause hypothesis; decision/action; risk note; role handoff.
Evidence fields to assess: captures expected 233,470 and actual 205,040 predictions; calculates or explains 12.2% variance; uses threshold rule correctly (PSI above 0.20 or AUC drop above 3 points requires triage); cites at least three input documents; links evidence to root-cause hypothesis; states clear release/hold/correct/escalate decision.
AI support tips: Use AI as a coach to ask evidence-checking questions, explain unfamiliar terms, compare possible root causes, and improve clarity. Do not use AI to invent numbers or make the decision without citing the provided documents.',
  1,
  '12 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech CSE - Data Engineering Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-053' LIMIT 1),
  'B.Tech CSE - Data Engineering Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech AI & Data Science - Data Platform Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-053' LIMIT 1),
  'B.Tech AI & Data Science - Data Platform Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Data Science - Data Engineering Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-053' LIMIT 1),
  'B.Sc Data Science - Data Engineering Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MCA - Data Engineering / Cloud Data Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-053' LIMIT 1),
  'MCA - Data Engineering / Cloud Data Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Tech Data Engineering / Big Data Systems
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-053' LIMIT 1),
  'M.Tech Data Engineering / Big Data Systems',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech CSE - AI & Machine Learning Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-053' LIMIT 1),
  'B.Tech CSE - AI & Machine Learning Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Diagnose a Production Exception in Edge AI Anomaly Actioning
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Diagnose a Production Exception in Edge AI Anomaly Actioning',
  'CRS-IND-CL-058',
  'By the end of this course, the learner can diagnose an exception in Edge AI Anomaly Actioning by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact. Workplace problem: An exception case is raised during factory anomaly alert response because an edge AI predictive-maintenance device shows conflicting evidence around device inference anomaly and sensor packet loss. The expected volume is 112,840 readings, but only 101,680 readings are usable, creating a 9.9% variance against the control expectation. Motor vibration anomaly score reached 0.91 while 6.5% of temperature packets were missing. The accepted rule is: packet loss above 4% or anomaly score above 0.82 requires action. The learner receives edge device alert log, sensor packet summary, local inference score sheet, maintenance history note, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Edge AI Anomaly Action Record. The learner must compare possible causes, select the most likely root cause, and prepare an escalation-ready artifact. Artifact: Edge AI Anomaly Action Record - Exception Diagnosis Pack.',
  '12 hours',
  'Active',
  'Cloud, Edge, IoT & Autonomous AI Systems',
  'technical',
  '["By the end of this course, the learner can diagnose an exception in Edge AI Anomaly Actioning by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact","Learner demonstrates Edge AI Anomaly Actioning by interpreting real-looking numbers, comparing evidence from edge device alert log and sensor packet summary, and producing a decision-ready artifact","Proves the learner can perform exception diagnosis work in Edge AI Anomaly Actioning with numeric evidence, workplace documents, and a reviewer-ready artifact. Status: Pilot Ready — Evidence Strengthening Needed"]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L3 Module: Edge AI Anomaly Actioning Workplace Mission
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-058' LIMIT 1),
  'L3 Module: Edge AI Anomaly Actioning Workplace Mission',
  'Industry requirement: Teams responsible for an edge AI predictive-maintenance device need learners who can use numeric evidence, threshold rules, and workplace documents to make reliable decisions during factory anomaly alert response, not only explain Edge AI Anomaly Actioning theoretically. Gap addressed: Academic learning may cover the concepts behind Edge AI Anomaly Actioning, but it usually does not make learners practice with edge device alert log, sensor packet summary, local inference score sheet, numeric variance, threshold decisions, and role handoff artifacts. Trigger: two evidence sources disagree and the normal checklist cannot close the case: 101,680 of 112,840 readings passed the check, variance 9.9%, with signal ''device inference anomaly and sensor packet loss''.',
  1,
  '["Data & AI","Cloud, Edge, IoT & Autonomous AI Systems","Edge AI Anomaly Actioning","Primary: Evidence. Supporting: Technical, Functional, Domain","edge inference score","sensor packet loss","local-versus-cloud decision","field maintenance escalation","false alert control","expected 112,840 vs actual 101,680 readings","9.9% variance interpretation","threshold rule: packet loss above 4% or anomaly score above 0.82 requires action","exception hypothesis testing","severity classification"]'::jsonb,
  '["Engage: Learner receives a exception diagnosis case: factory anomaly alert response is at risk because only 101,680 of 112,840 readings passed the control and device inference anomaly and sensor packet loss is visible","Explore: Learner reviews edge device alert log, sensor packet summary, local inference score sheet, maintenance history note, field action ticket, highlights the fields that prove the issue, and notes which values cross the threshold","Explain: Learner studies edge inference score, sensor packet loss, local-versus-cloud decision, field maintenance escalation and learns how these concepts explain the business risk, not just the technical error","Express: Learner prepares the Edge AI Anomaly Action Record with issue summary, numeric evidence, root-cause hypothesis, decision, and handoff note","Empower: Learner must justify the most likely cause and escalation path for factory anomaly alert response","Evolve: Learner writes what evidence would be needed next time to separate the competing root causes faster"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Scenario: Edge AI Anomaly Action Record - Exception Diagnosis Pack
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-058' LIMIT 1)
   AND title = 'L3 Module: Edge AI Anomaly Actioning Workplace Mission' LIMIT 1),
  'Workplace Scenario: Edge AI Anomaly Action Record - Exception Diagnosis Pack',
  'An exception case is raised during factory anomaly alert response because an edge AI predictive-maintenance device shows conflicting evidence around device inference anomaly and sensor packet loss. The expected volume is 112,840 readings, but only 101,680 readings are usable, creating a 9.9% variance against the control expectation. Motor vibration anomaly score reached 0.91 while 6.5% of temperature packets were missing. The accepted rule is: packet loss above 4% or anomaly score above 0.82 requires action. The learner receives edge device alert log, sensor packet summary, local inference score sheet, maintenance history note, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Edge AI Anomaly Action Record. The learner must compare possible causes, select the most likely root cause, and prepare an escalation-ready artifact. Pressure points: Factory anomaly alert response is time-sensitive; variance is 9.9% against the rule; motor vibration anomaly score reached 0.91 while 6.5% of temperature packets were missing; the evidence is conflicting, the business owner is asking for a decision, and escalation must be justified.',
  'Course trigger: two evidence sources disagree and the normal checklist cannot close the case: 101,680 of 112,840 readings passed the check, variance 9.9%, with signal ''device inference anomaly and sensor packet loss''.
Problem statement: An exception case is raised during factory anomaly alert response because an edge AI predictive-maintenance device shows conflicting evidence around device inference anomaly and sensor packet loss. The expected volume is 112,840 readings, but only 101,680 readings are usable, creating a 9.9% variance against the control expectation. Motor vibration anomaly score reached 0.91 while 6.5% of temperature packets were missing. The accepted rule is: packet loss above 4% or anomaly score above 0.82 requires action. The learner receives edge device alert log, sensor packet summary, local inference score sheet, maintenance history note, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Edge AI Anomaly Action Record. The learner must compare possible causes, select the most likely root cause, and prepare an escalation-ready artifact.
Major concepts: edge inference score; sensor packet loss; local-versus-cloud decision; field maintenance escalation; false alert control; expected 112,840 vs actual 101,680 readings; 9.9% variance interpretation; threshold rule: packet loss above 4% or anomaly score above 0.82 requires action; exception hypothesis testing; severity classification.
Root-cause focus: Test competing hypotheses and choose between: sensor failure, model edge-version mismatch, device network loss, actual equipment anomaly, or threshold calibration issue. Evidence must come from edge device alert log, sensor packet summary, local inference score sheet.
Required data: edge device alert log; sensor packet summary; local inference score sheet; maintenance history note; field action ticket; conflicting evidence extract; exception escalation policy
Artifact: Edge AI Anomaly Action Record - Exception Diagnosis Pack
Artifact structure: case summary; expected vs actual numbers; threshold rule; evidence table from edge device alert log, sensor packet summary, local inference score sheet; root-cause hypothesis; decision/action; risk note; role handoff.
Evidence fields to assess: captures expected 112,840 and actual 101,680 readings; calculates or explains 9.9% variance; uses threshold rule correctly (packet loss above 4% or anomaly score above 0.82 requires action); cites at least three input documents; links evidence to root-cause hypothesis; states clear release/hold/correct/escalate decision.
AI support tips: Use AI as a coach to ask evidence-checking questions, explain unfamiliar terms, compare possible root causes, and improve clarity. Do not use AI to invent numbers or make the decision without citing the provided documents.',
  1,
  '12 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech CSE - Data Engineering Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-058' LIMIT 1),
  'B.Tech CSE - Data Engineering Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech AI & Data Science - Data Platform Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-058' LIMIT 1),
  'B.Tech AI & Data Science - Data Platform Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Data Science - Data Engineering Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-058' LIMIT 1),
  'B.Sc Data Science - Data Engineering Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MCA - Data Engineering / Cloud Data Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-058' LIMIT 1),
  'MCA - Data Engineering / Cloud Data Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Tech Data Engineering / Big Data Systems
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-058' LIMIT 1),
  'M.Tech Data Engineering / Big Data Systems',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech AI & Data Science - Applied Industry AI Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-058' LIMIT 1),
  'B.Tech AI & Data Science - Applied Industry AI Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Diagnose a Production Exception in Data Governance Control Maintenance
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Diagnose a Production Exception in Data Governance Control Maintenance',
  'CRS-IND-CL-063',
  'By the end of this course, the learner can diagnose an exception in Data Governance Control Maintenance by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact. Workplace problem: An exception case is raised during privacy and lineage control review because a governed customer data asset shows conflicting evidence around unmapped downstream report and missing data-owner approval. The expected volume is 26,630 attributes, but only 24,882 attributes are usable, creating a 6.6% variance against the control expectation. 37 attributes lack sensitivity tags and 8 downstream reports are missing from lineage. The accepted rule is: critical attributes must have 100% owner, lineage, and policy tagging. The learner receives data asset inventory, lineage extract, policy tag register, owner approval sheet, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Data Governance Control Maintenance Log. The learner must compare possible causes, select the most likely root cause, and prepare an escalation-ready artifact. Artifact: Data Governance Control Maintenance Log - Exception Diagnosis Pack.',
  '12 hours',
  'Active',
  'Data Governance & Stewardship',
  'technical',
  '["By the end of this course, the learner can diagnose an exception in Data Governance Control Maintenance by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact","Learner demonstrates Data Governance Control Maintenance by interpreting real-looking numbers, comparing evidence from data asset inventory and lineage extract, and producing a decision-ready artifact","Proves the learner can perform exception diagnosis work in Data Governance Control Maintenance with numeric evidence, workplace documents, and a reviewer-ready artifact. Status: Demo Ready"]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L3 Module: Data Governance Control Maintenance Workplace Mission
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-063' LIMIT 1),
  'L3 Module: Data Governance Control Maintenance Workplace Mission',
  'Industry requirement: Teams responsible for a governed customer data asset need learners who can use numeric evidence, threshold rules, and workplace documents to make reliable decisions during privacy and lineage control review, not only explain Data Governance Control Maintenance theoretically. Gap addressed: Academic learning may cover the concepts behind Data Governance Control Maintenance, but it usually does not make learners practice with data asset inventory, lineage extract, policy tag register, numeric variance, threshold decisions, and role handoff artifacts. Trigger: two evidence sources disagree and the normal checklist cannot close the case: 24,882 of 26,630 attributes passed the check, variance 6.6%, with signal ''unmapped downstream report and missing data-owner approval''.',
  1,
  '["Data & AI","Data Governance & Stewardship","Data Governance Control Maintenance","Primary: Compliance. Supporting: Evidence, Technical, Communication","data ownership","lineage completeness","policy tagging","sensitive data classification","governance control evidence","expected 26,630 vs actual 24,882 attributes","6.6% variance interpretation","threshold rule: critical attributes must have 100% owner, lineage, and policy tagging","exception hypothesis testing","severity classification"]'::jsonb,
  '["Engage: Learner receives a exception diagnosis case: privacy and lineage control review is at risk because only 24,882 of 26,630 attributes passed the control and unmapped downstream report and missing data-owner approval is visible","Explore: Learner reviews data asset inventory, lineage extract, policy tag register, owner approval sheet, downstream report list, highlights the fields that prove the issue, and notes which values cross the threshold","Explain: Learner studies data ownership, lineage completeness, policy tagging, sensitive data classification and learns how these concepts explain the business risk, not just the technical error","Express: Learner prepares the Data Governance Control Maintenance Log with issue summary, numeric evidence, root-cause hypothesis, decision, and handoff note","Empower: Learner must justify the most likely cause and escalation path for privacy and lineage control review","Evolve: Learner writes what evidence would be needed next time to separate the competing root causes faster"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Scenario: Data Governance Control Maintenance Log - Exception Diagnosis Pack
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-063' LIMIT 1)
   AND title = 'L3 Module: Data Governance Control Maintenance Workplace Mission' LIMIT 1),
  'Workplace Scenario: Data Governance Control Maintenance Log - Exception Diagnosis Pack',
  'An exception case is raised during privacy and lineage control review because a governed customer data asset shows conflicting evidence around unmapped downstream report and missing data-owner approval. The expected volume is 26,630 attributes, but only 24,882 attributes are usable, creating a 6.6% variance against the control expectation. 37 attributes lack sensitivity tags and 8 downstream reports are missing from lineage. The accepted rule is: critical attributes must have 100% owner, lineage, and policy tagging. The learner receives data asset inventory, lineage extract, policy tag register, owner approval sheet, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Data Governance Control Maintenance Log. The learner must compare possible causes, select the most likely root cause, and prepare an escalation-ready artifact. Pressure points: Privacy and lineage control review is time-sensitive; variance is 6.6% against the rule; 37 attributes lack sensitivity tags and 8 downstream reports are missing from lineage; the evidence is conflicting, the business owner is asking for a decision, and escalation must be justified.',
  'Course trigger: two evidence sources disagree and the normal checklist cannot close the case: 24,882 of 26,630 attributes passed the check, variance 6.6%, with signal ''unmapped downstream report and missing data-owner approval''.
Problem statement: An exception case is raised during privacy and lineage control review because a governed customer data asset shows conflicting evidence around unmapped downstream report and missing data-owner approval. The expected volume is 26,630 attributes, but only 24,882 attributes are usable, creating a 6.6% variance against the control expectation. 37 attributes lack sensitivity tags and 8 downstream reports are missing from lineage. The accepted rule is: critical attributes must have 100% owner, lineage, and policy tagging. The learner receives data asset inventory, lineage extract, policy tag register, owner approval sheet, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Data Governance Control Maintenance Log. The learner must compare possible causes, select the most likely root cause, and prepare an escalation-ready artifact.
Major concepts: data ownership; lineage completeness; policy tagging; sensitive data classification; governance control evidence; expected 26,630 vs actual 24,882 attributes; 6.6% variance interpretation; threshold rule: critical attributes must have 100% owner, lineage, and policy tagging; exception hypothesis testing; severity classification.
Root-cause focus: Test competing hypotheses and choose between: missing data-owner mapping, stale lineage, untagged sensitive attribute, policy exception, or unregistered report dependency. Evidence must come from data asset inventory, lineage extract, policy tag register.
Required data: data asset inventory; lineage extract; policy tag register; owner approval sheet; downstream report list; conflicting evidence extract; exception escalation policy
Artifact: Data Governance Control Maintenance Log - Exception Diagnosis Pack
Artifact structure: case summary; expected vs actual numbers; threshold rule; evidence table from data asset inventory, lineage extract, policy tag register; root-cause hypothesis; decision/action; risk note; role handoff.
Evidence fields to assess: captures expected 26,630 and actual 24,882 attributes; calculates or explains 6.6% variance; uses threshold rule correctly (critical attributes must have 100% owner, lineage, and policy tagging); cites at least three input documents; links evidence to root-cause hypothesis; states clear release/hold/correct/escalate decision.
AI support tips: Use AI as a coach to ask evidence-checking questions, explain unfamiliar terms, compare possible root causes, and improve clarity. Do not use AI to invent numbers or make the decision without citing the provided documents.',
  1,
  '12 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech AI & Data Science - Responsible AI Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-063' LIMIT 1),
  'B.Tech AI & Data Science - Responsible AI Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech CSE - AI Security / Governance Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-063' LIMIT 1),
  'B.Tech CSE - AI Security / Governance Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MBA Business Analytics - AI Risk & Governance Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-063' LIMIT 1),
  'MBA Business Analytics - AI Risk & Governance Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: LL.B / Tech Law - Data Privacy & AI Governance Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-063' LIMIT 1),
  'LL.B / Tech Law - Data Privacy & AI Governance Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PG Certificate - Responsible AI, Risk & Compliance
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-063' LIMIT 1),
  'PG Certificate - Responsible AI, Risk & Compliance',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech CSE / Data Science - Data Governance Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-063' LIMIT 1),
  'B.Tech CSE / Data Science - Data Governance Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Diagnose a Production Exception in Responsible AI Deployment Approval
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Diagnose a Production Exception in Responsible AI Deployment Approval',
  'CRS-IND-CL-068',
  'By the end of this course, the learner can diagnose an exception in Responsible AI Deployment Approval by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact. Workplace problem: An exception case is raised during loan-assistant chatbot approval because a responsible AI deployment request shows conflicting evidence around incomplete risk control evidence before deployment. The expected volume is 27,628 checks, but only 25,797 checks are usable, creating a 6.6% variance against the control expectation. Fairness test evidence is missing for 2 protected segments and human-review fallback is not signed off. The accepted rule is: all high-risk controls must be approved before deployment. The learner receives AI use-case registration, risk assessment form, fairness test summary, human fallback design, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Responsible AI Deployment Approval Dossier. The learner must compare possible causes, select the most likely root cause, and prepare an escalation-ready artifact. Artifact: Responsible AI Deployment Approval Dossier - Exception Diagnosis Pack.',
  '12 hours',
  'Active',
  'Responsible AI, Risk, Privacy & Security',
  'technical',
  '["By the end of this course, the learner can diagnose an exception in Responsible AI Deployment Approval by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact","Learner demonstrates Responsible AI Deployment Approval by interpreting real-looking numbers, comparing evidence from AI use-case registration and risk assessment form, and producing a decision-ready artifact","Proves the learner can perform exception diagnosis work in Responsible AI Deployment Approval with numeric evidence, workplace documents, and a reviewer-ready artifact. Status: Demo Ready"]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L3 Module: Responsible AI Deployment Approval Workplace Mission
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-068' LIMIT 1),
  'L3 Module: Responsible AI Deployment Approval Workplace Mission',
  'Industry requirement: Teams responsible for a responsible AI deployment request need learners who can use numeric evidence, threshold rules, and workplace documents to make reliable decisions during loan-assistant chatbot approval, not only explain Responsible AI Deployment Approval theoretically. Gap addressed: Academic learning may cover the concepts behind Responsible AI Deployment Approval, but it usually does not make learners practice with AI use-case registration, risk assessment form, fairness test summary, numeric variance, threshold decisions, and role handoff artifacts. Trigger: two evidence sources disagree and the normal checklist cannot close the case: 25,797 of 27,628 checks passed the check, variance 6.6%, with signal ''incomplete risk control evidence before deployment''.',
  1,
  '["Data & AI","Responsible AI, Risk, Privacy & Security","Responsible AI Deployment Approval","Primary: Compliance. Supporting: Evidence, Technical, Communication","AI use-case risk tier","fairness evidence","human oversight control","deployment approval gate","responsible AI audit trail","expected 27,628 vs actual 25,797 checks","6.6% variance interpretation","threshold rule: all high-risk controls must be approved before deployment","exception hypothesis testing","severity classification"]'::jsonb,
  '["Engage: Learner receives a exception diagnosis case: loan-assistant chatbot approval is at risk because only 25,797 of 27,628 checks passed the control and incomplete risk control evidence before deployment is visible","Explore: Learner reviews AI use-case registration, risk assessment form, fairness test summary, human fallback design, deployment approval checklist, highlights the fields that prove the issue, and notes which values cross the threshold","Explain: Learner studies AI use-case risk tier, fairness evidence, human oversight control, deployment approval gate and learns how these concepts explain the business risk, not just the technical error","Express: Learner prepares the Responsible AI Deployment Approval Dossier with issue summary, numeric evidence, root-cause hypothesis, decision, and handoff note","Empower: Learner must justify the most likely cause and escalation path for loan-assistant chatbot approval","Evolve: Learner writes what evidence would be needed next time to separate the competing root causes faster"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Scenario: Responsible AI Deployment Approval Dossier - Exception Diagnosis Pack
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-068' LIMIT 1)
   AND title = 'L3 Module: Responsible AI Deployment Approval Workplace Mission' LIMIT 1),
  'Workplace Scenario: Responsible AI Deployment Approval Dossier - Exception Diagnosis Pack',
  'An exception case is raised during loan-assistant chatbot approval because a responsible AI deployment request shows conflicting evidence around incomplete risk control evidence before deployment. The expected volume is 27,628 checks, but only 25,797 checks are usable, creating a 6.6% variance against the control expectation. Fairness test evidence is missing for 2 protected segments and human-review fallback is not signed off. The accepted rule is: all high-risk controls must be approved before deployment. The learner receives AI use-case registration, risk assessment form, fairness test summary, human fallback design, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Responsible AI Deployment Approval Dossier. The learner must compare possible causes, select the most likely root cause, and prepare an escalation-ready artifact. Pressure points: Loan-assistant chatbot approval is time-sensitive; variance is 6.6% against the rule; fairness test evidence is missing for 2 protected segments and human-review fallback is not signed off; the evidence is conflicting, the business owner is asking for a decision, and escalation must be justified.',
  'Course trigger: two evidence sources disagree and the normal checklist cannot close the case: 25,797 of 27,628 checks passed the check, variance 6.6%, with signal ''incomplete risk control evidence before deployment''.
Problem statement: An exception case is raised during loan-assistant chatbot approval because a responsible AI deployment request shows conflicting evidence around incomplete risk control evidence before deployment. The expected volume is 27,628 checks, but only 25,797 checks are usable, creating a 6.6% variance against the control expectation. Fairness test evidence is missing for 2 protected segments and human-review fallback is not signed off. The accepted rule is: all high-risk controls must be approved before deployment. The learner receives AI use-case registration, risk assessment form, fairness test summary, human fallback design, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Responsible AI Deployment Approval Dossier. The learner must compare possible causes, select the most likely root cause, and prepare an escalation-ready artifact.
Major concepts: AI use-case risk tier; fairness evidence; human oversight control; deployment approval gate; responsible AI audit trail; expected 27,628 vs actual 25,797 checks; 6.6% variance interpretation; threshold rule: all high-risk controls must be approved before deployment; exception hypothesis testing; severity classification.
Root-cause focus: Test competing hypotheses and choose between: missing fairness evidence, unclear human oversight, privacy risk gap, unapproved fallback, or incomplete model documentation. Evidence must come from AI use-case registration, risk assessment form, fairness test summary.
Required data: AI use-case registration; risk assessment form; fairness test summary; human fallback design; deployment approval checklist; conflicting evidence extract; exception escalation policy
Artifact: Responsible AI Deployment Approval Dossier - Exception Diagnosis Pack
Artifact structure: case summary; expected vs actual numbers; threshold rule; evidence table from AI use-case registration, risk assessment form, fairness test summary; root-cause hypothesis; decision/action; risk note; role handoff.
Evidence fields to assess: captures expected 27,628 and actual 25,797 checks; calculates or explains 6.6% variance; uses threshold rule correctly (all high-risk controls must be approved before deployment); cites at least three input documents; links evidence to root-cause hypothesis; states clear release/hold/correct/escalate decision.
AI support tips: Use AI as a coach to ask evidence-checking questions, explain unfamiliar terms, compare possible root causes, and improve clarity. Do not use AI to invent numbers or make the decision without citing the provided documents.',
  1,
  '12 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech AI & Data Science - Responsible AI Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-068' LIMIT 1),
  'B.Tech AI & Data Science - Responsible AI Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech CSE - AI Security / Governance Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-068' LIMIT 1),
  'B.Tech CSE - AI Security / Governance Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MBA Business Analytics - AI Risk & Governance Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-068' LIMIT 1),
  'MBA Business Analytics - AI Risk & Governance Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: LL.B / Tech Law - Data Privacy & AI Governance Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-068' LIMIT 1),
  'LL.B / Tech Law - Data Privacy & AI Governance Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PG Certificate - Responsible AI, Risk & Compliance
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-068' LIMIT 1),
  'PG Certificate - Responsible AI, Risk & Compliance',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Diagnose a Production Exception in AI Security Abuse-Path Testing
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Diagnose a Production Exception in AI Security Abuse-Path Testing',
  'CRS-IND-CL-073',
  'By the end of this course, the learner can diagnose an exception in AI Security Abuse-Path Testing by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact. Workplace problem: An exception case is raised during AI security abuse-path test because a GenAI knowledge assistant shows conflicting evidence around prompt-injection and retrieval data exposure risk. The expected volume is 29,190 tests, but only 27,204 tests are usable, creating a 6.8% variance against the control expectation. 9 prompt-injection tests reveal restricted policy snippets and 14 retrieval responses cite unapproved documents. The accepted rule is: critical abuse paths must have 0 data-exposure passes. The learner receives abuse-path test script, prompt-injection result log, retrieval access-control matrix, sensitive response examples, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the AI Security Abuse-Path Test Report. The learner must compare possible causes, select the most likely root cause, and prepare an escalation-ready artifact. Artifact: AI Security Abuse-Path Test Report - Exception Diagnosis Pack.',
  '12 hours',
  'Active',
  'Responsible AI, Risk, Privacy & Security',
  'technical',
  '["By the end of this course, the learner can diagnose an exception in AI Security Abuse-Path Testing by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact","Learner demonstrates AI Security Abuse-Path Testing by interpreting real-looking numbers, comparing evidence from abuse-path test script and prompt-injection result log, and producing a decision-ready artifact","Proves the learner can perform exception diagnosis work in AI Security Abuse-Path Testing with numeric evidence, workplace documents, and a reviewer-ready artifact. Status: Pilot Ready — Evidence Strengthening Needed"]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L3 Module: AI Security Abuse-Path Testing Workplace Mission
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-073' LIMIT 1),
  'L3 Module: AI Security Abuse-Path Testing Workplace Mission',
  'Industry requirement: Teams responsible for a GenAI knowledge assistant need learners who can use numeric evidence, threshold rules, and workplace documents to make reliable decisions during AI security abuse-path test, not only explain AI Security Abuse-Path Testing theoretically. Gap addressed: Academic learning may cover the concepts behind AI Security Abuse-Path Testing, but it usually does not make learners practice with abuse-path test script, prompt-injection result log, retrieval access-control matrix, numeric variance, threshold decisions, and role handoff artifacts. Trigger: two evidence sources disagree and the normal checklist cannot close the case: 27,204 of 29,190 tests passed the check, variance 6.8%, with signal ''prompt-injection and retrieval data exposure risk''.',
  1,
  '["Data & AI","Responsible AI, Risk, Privacy & Security","AI Security Abuse-Path Testing","Primary: Compliance. Supporting: Evidence, Technical, Communication","prompt-injection pattern","retrieval access control","data exposure severity","red-team evidence","mitigation decision","expected 29,190 vs actual 27,204 tests","6.8% variance interpretation","threshold rule: critical abuse paths must have 0 data-exposure passes","exception hypothesis testing","severity classification"]'::jsonb,
  '["Engage: Learner receives a exception diagnosis case: AI security abuse-path test is at risk because only 27,204 of 29,190 tests passed the control and prompt-injection and retrieval data exposure risk is visible","Explore: Learner reviews abuse-path test script, prompt-injection result log, retrieval access-control matrix, sensitive response examples, security triage ticket, highlights the fields that prove the issue, and notes which values cross the threshold","Explain: Learner studies prompt-injection pattern, retrieval access control, data exposure severity, red-team evidence and learns how these concepts explain the business risk, not just the technical error","Express: Learner prepares the AI Security Abuse-Path Test Report with issue summary, numeric evidence, root-cause hypothesis, decision, and handoff note","Empower: Learner must justify the most likely cause and escalation path for AI security abuse-path test","Evolve: Learner writes what evidence would be needed next time to separate the competing root causes faster"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Scenario: AI Security Abuse-Path Test Report - Exception Diagnosis Pack
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-073' LIMIT 1)
   AND title = 'L3 Module: AI Security Abuse-Path Testing Workplace Mission' LIMIT 1),
  'Workplace Scenario: AI Security Abuse-Path Test Report - Exception Diagnosis Pack',
  'An exception case is raised during AI security abuse-path test because a GenAI knowledge assistant shows conflicting evidence around prompt-injection and retrieval data exposure risk. The expected volume is 29,190 tests, but only 27,204 tests are usable, creating a 6.8% variance against the control expectation. 9 prompt-injection tests reveal restricted policy snippets and 14 retrieval responses cite unapproved documents. The accepted rule is: critical abuse paths must have 0 data-exposure passes. The learner receives abuse-path test script, prompt-injection result log, retrieval access-control matrix, sensitive response examples, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the AI Security Abuse-Path Test Report. The learner must compare possible causes, select the most likely root cause, and prepare an escalation-ready artifact. Pressure points: Ai security abuse-path test is time-sensitive; variance is 6.8% against the rule; 9 prompt-injection tests reveal restricted policy snippets and 14 retrieval responses cite unapproved documents; the evidence is conflicting, the business owner is asking for a decision, and escalation must be justified.',
  'Course trigger: two evidence sources disagree and the normal checklist cannot close the case: 27,204 of 29,190 tests passed the check, variance 6.8%, with signal ''prompt-injection and retrieval data exposure risk''.
Problem statement: An exception case is raised during AI security abuse-path test because a GenAI knowledge assistant shows conflicting evidence around prompt-injection and retrieval data exposure risk. The expected volume is 29,190 tests, but only 27,204 tests are usable, creating a 6.8% variance against the control expectation. 9 prompt-injection tests reveal restricted policy snippets and 14 retrieval responses cite unapproved documents. The accepted rule is: critical abuse paths must have 0 data-exposure passes. The learner receives abuse-path test script, prompt-injection result log, retrieval access-control matrix, sensitive response examples, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the AI Security Abuse-Path Test Report. The learner must compare possible causes, select the most likely root cause, and prepare an escalation-ready artifact.
Major concepts: prompt-injection pattern; retrieval access control; data exposure severity; red-team evidence; mitigation decision; expected 29,190 vs actual 27,204 tests; 6.8% variance interpretation; threshold rule: critical abuse paths must have 0 data-exposure passes; exception hypothesis testing; severity classification.
Root-cause focus: Test competing hypotheses and choose between: weak system prompt boundary, retrieval permission leak, unsafe tool call, sensitive context exposure, or missing refusal test. Evidence must come from abuse-path test script, prompt-injection result log, retrieval access-control matrix.
Required data: abuse-path test script; prompt-injection result log; retrieval access-control matrix; sensitive response examples; security triage ticket; conflicting evidence extract; exception escalation policy
Artifact: AI Security Abuse-Path Test Report - Exception Diagnosis Pack
Artifact structure: case summary; expected vs actual numbers; threshold rule; evidence table from abuse-path test script, prompt-injection result log, retrieval access-control matrix; root-cause hypothesis; decision/action; risk note; role handoff.
Evidence fields to assess: captures expected 29,190 and actual 27,204 tests; calculates or explains 6.8% variance; uses threshold rule correctly (critical abuse paths must have 0 data-exposure passes); cites at least three input documents; links evidence to root-cause hypothesis; states clear release/hold/correct/escalate decision.
AI support tips: Use AI as a coach to ask evidence-checking questions, explain unfamiliar terms, compare possible root causes, and improve clarity. Do not use AI to invent numbers or make the decision without citing the provided documents.',
  1,
  '12 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech AI & Data Science - Responsible AI Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-073' LIMIT 1),
  'B.Tech AI & Data Science - Responsible AI Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech CSE - AI Security / Governance Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-073' LIMIT 1),
  'B.Tech CSE - AI Security / Governance Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MBA Business Analytics - AI Risk & Governance Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-073' LIMIT 1),
  'MBA Business Analytics - AI Risk & Governance Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: LL.B / Tech Law - Data Privacy & AI Governance Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-073' LIMIT 1),
  'LL.B / Tech Law - Data Privacy & AI Governance Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PG Certificate - Responsible AI, Risk & Compliance
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-073' LIMIT 1),
  'PG Certificate - Responsible AI, Risk & Compliance',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Diagnose a Production Exception in GenAI Feature Specification
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Diagnose a Production Exception in GenAI Feature Specification',
  'CRS-IND-CL-078',
  'By the end of this course, the learner can diagnose an exception in GenAI Feature Specification by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact. Workplace problem: An exception case is raised during support-agent copilot specification because a GenAI product feature shows conflicting evidence around unclear feature scope and missing acceptance criteria. The expected volume is 30,354 stories, but only 28,266 stories are usable, creating a 6.9% variance against the control expectation. 6 stories allow auto-send without human confirmation and 5 lack hallucination-control criteria. The accepted rule is: all high-priority stories need measurable acceptance criteria and risk notes. The learner receives product requirement brief, conversation journey map, acceptance criteria draft, risk-control checklist, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the GenAI Feature Specification Pack. The learner must compare possible causes, select the most likely root cause, and prepare an escalation-ready artifact. Artifact: GenAI Feature Specification Pack - Exception Diagnosis Pack.',
  '12 hours',
  'Active',
  'AI Product & GenAI Application Development',
  'technical',
  '["By the end of this course, the learner can diagnose an exception in GenAI Feature Specification by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact","Learner demonstrates GenAI Feature Specification by interpreting real-looking numbers, comparing evidence from product requirement brief and conversation journey map, and producing a decision-ready artifact","Proves the learner can perform exception diagnosis work in GenAI Feature Specification with numeric evidence, workplace documents, and a reviewer-ready artifact. Status: Demo Ready"]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L3 Module: GenAI Feature Specification Workplace Mission
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-078' LIMIT 1),
  'L3 Module: GenAI Feature Specification Workplace Mission',
  'Industry requirement: Teams responsible for a GenAI product feature need learners who can use numeric evidence, threshold rules, and workplace documents to make reliable decisions during support-agent copilot specification, not only explain GenAI Feature Specification theoretically. Gap addressed: Academic learning may cover the concepts behind GenAI Feature Specification, but it usually does not make learners practice with product requirement brief, conversation journey map, acceptance criteria draft, numeric variance, threshold decisions, and role handoff artifacts. Trigger: two evidence sources disagree and the normal checklist cannot close the case: 28,266 of 30,354 stories passed the check, variance 6.9%, with signal ''unclear feature scope and missing acceptance criteria''.',
  1,
  '["Data & AI","AI Product & GenAI Application Development","GenAI Feature Specification","Primary: Functional. Supporting: Cognitive, Communication, AI/Digital","GenAI feature boundary","human-in-the-loop acceptance","hallucination control","prompt workflow requirement","success metric definition","expected 30,354 vs actual 28,266 stories","6.9% variance interpretation","threshold rule: all high-priority stories need measurable acceptance criteria and risk notes","exception hypothesis testing","severity classification"]'::jsonb,
  '["Engage: Learner receives a exception diagnosis case: support-agent copilot specification is at risk because only 28,266 of 30,354 stories passed the control and unclear feature scope and missing acceptance criteria is visible","Explore: Learner reviews product requirement brief, conversation journey map, acceptance criteria draft, risk-control checklist, stakeholder feedback notes, highlights the fields that prove the issue, and notes which values cross the threshold","Explain: Learner studies GenAI feature boundary, human-in-the-loop acceptance, hallucination control, prompt workflow requirement and learns how these concepts explain the business risk, not just the technical error","Express: Learner prepares the GenAI Feature Specification Pack with issue summary, numeric evidence, root-cause hypothesis, decision, and handoff note","Empower: Learner must justify the most likely cause and escalation path for support-agent copilot specification","Evolve: Learner writes what evidence would be needed next time to separate the competing root causes faster"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Scenario: GenAI Feature Specification Pack - Exception Diagnosis Pack
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-078' LIMIT 1)
   AND title = 'L3 Module: GenAI Feature Specification Workplace Mission' LIMIT 1),
  'Workplace Scenario: GenAI Feature Specification Pack - Exception Diagnosis Pack',
  'An exception case is raised during support-agent copilot specification because a GenAI product feature shows conflicting evidence around unclear feature scope and missing acceptance criteria. The expected volume is 30,354 stories, but only 28,266 stories are usable, creating a 6.9% variance against the control expectation. 6 stories allow auto-send without human confirmation and 5 lack hallucination-control criteria. The accepted rule is: all high-priority stories need measurable acceptance criteria and risk notes. The learner receives product requirement brief, conversation journey map, acceptance criteria draft, risk-control checklist, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the GenAI Feature Specification Pack. The learner must compare possible causes, select the most likely root cause, and prepare an escalation-ready artifact. Pressure points: Support-agent copilot specification is time-sensitive; variance is 6.9% against the rule; 6 stories allow auto-send without human confirmation and 5 lack hallucination-control criteria; the evidence is conflicting, the business owner is asking for a decision, and escalation must be justified.',
  'Course trigger: two evidence sources disagree and the normal checklist cannot close the case: 28,266 of 30,354 stories passed the check, variance 6.9%, with signal ''unclear feature scope and missing acceptance criteria''.
Problem statement: An exception case is raised during support-agent copilot specification because a GenAI product feature shows conflicting evidence around unclear feature scope and missing acceptance criteria. The expected volume is 30,354 stories, but only 28,266 stories are usable, creating a 6.9% variance against the control expectation. 6 stories allow auto-send without human confirmation and 5 lack hallucination-control criteria. The accepted rule is: all high-priority stories need measurable acceptance criteria and risk notes. The learner receives product requirement brief, conversation journey map, acceptance criteria draft, risk-control checklist, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the GenAI Feature Specification Pack. The learner must compare possible causes, select the most likely root cause, and prepare an escalation-ready artifact.
Major concepts: GenAI feature boundary; human-in-the-loop acceptance; hallucination control; prompt workflow requirement; success metric definition; expected 30,354 vs actual 28,266 stories; 6.9% variance interpretation; threshold rule: all high-priority stories need measurable acceptance criteria and risk notes; exception hypothesis testing; severity classification.
Root-cause focus: Test competing hypotheses and choose between: unclear user workflow, missing acceptance criteria, unsafe automation boundary, hallucination-control gap, or unmeasured success metric. Evidence must come from product requirement brief, conversation journey map, acceptance criteria draft.
Required data: product requirement brief; conversation journey map; acceptance criteria draft; risk-control checklist; stakeholder feedback notes; conflicting evidence extract; exception escalation policy
Artifact: GenAI Feature Specification Pack - Exception Diagnosis Pack
Artifact structure: case summary; expected vs actual numbers; threshold rule; evidence table from product requirement brief, conversation journey map, acceptance criteria draft; root-cause hypothesis; decision/action; risk note; role handoff.
Evidence fields to assess: captures expected 30,354 and actual 28,266 stories; calculates or explains 6.9% variance; uses threshold rule correctly (all high-priority stories need measurable acceptance criteria and risk notes); cites at least three input documents; links evidence to root-cause hypothesis; states clear release/hold/correct/escalate decision.
AI support tips: Use AI as a coach to ask evidence-checking questions, explain unfamiliar terms, compare possible root causes, and improve clarity. Do not use AI to invent numbers or make the decision without citing the provided documents.',
  1,
  '12 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech CSE - AI & Machine Learning Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-078' LIMIT 1),
  'B.Tech CSE - AI & Machine Learning Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech AI & Data Science - ML Engineering Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-078' LIMIT 1),
  'B.Tech AI & Data Science - ML Engineering Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Tech AI / Machine Learning Engineering
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-078' LIMIT 1),
  'M.Tech AI / Machine Learning Engineering',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Sc AI & Machine Learning
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-078' LIMIT 1),
  'M.Sc AI & Machine Learning',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MCA - AI / ML Application Development
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-078' LIMIT 1),
  'MCA - AI / ML Application Development',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech CSE - AI Product Engineering Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-078' LIMIT 1),
  'B.Tech CSE - AI Product Engineering Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Diagnose a Production Exception in Human-AI Workflow Validation
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Diagnose a Production Exception in Human-AI Workflow Validation',
  'CRS-IND-CL-083',
  'By the end of this course, the learner can diagnose an exception in Human-AI Workflow Validation by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact. Workplace problem: An exception case is raised during claims processing copilot validation because a human-AI workflow shows conflicting evidence around user overrides and trust failures in assisted decisions. The expected volume is 37,290 suggestions, but only 34,390 suggestions are usable, creating a 7.8% variance against the control expectation. Adjusters reject 18% of suggestions and 23 comments cite missing evidence in the AI explanation. The accepted rule is: unexplained override rate above 12% requires workflow review. The learner receives user edit log, AI suggestion sample, override reason summary, workflow step map, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Human-AI Workflow Validation Report. The learner must compare possible causes, select the most likely root cause, and prepare an escalation-ready artifact. Artifact: Human-AI Workflow Validation Report - Exception Diagnosis Pack.',
  '12 hours',
  'Active',
  'AI Product & GenAI Application Development',
  'technical',
  '["By the end of this course, the learner can diagnose an exception in Human-AI Workflow Validation by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact","Learner demonstrates Human-AI Workflow Validation by interpreting real-looking numbers, comparing evidence from user edit log and AI suggestion sample, and producing a decision-ready artifact","Proves the learner can perform exception diagnosis work in Human-AI Workflow Validation with numeric evidence, workplace documents, and a reviewer-ready artifact. Status: Demo Ready"]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L3 Module: Human-AI Workflow Validation Workplace Mission
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-083' LIMIT 1),
  'L3 Module: Human-AI Workflow Validation Workplace Mission',
  'Industry requirement: Teams responsible for a human-AI workflow need learners who can use numeric evidence, threshold rules, and workplace documents to make reliable decisions during claims processing copilot validation, not only explain Human-AI Workflow Validation theoretically. Gap addressed: Academic learning may cover the concepts behind Human-AI Workflow Validation, but it usually does not make learners practice with user edit log, AI suggestion sample, override reason summary, numeric variance, threshold decisions, and role handoff artifacts. Trigger: two evidence sources disagree and the normal checklist cannot close the case: 34,390 of 37,290 suggestions passed the check, variance 7.8%, with signal ''user overrides and trust failures in assisted decisions''.',
  1,
  '["Data & AI","AI Product & GenAI Application Development","Human-AI Workflow Validation","Primary: Functional. Supporting: Cognitive, Communication, AI/Digital","human override pattern","trust signal analysis","AI explanation quality","workflow friction point","human-in-the-loop validation","expected 37,290 vs actual 34,390 suggestions","7.8% variance interpretation","threshold rule: unexplained override rate above 12% requires workflow review","exception hypothesis testing","severity classification"]'::jsonb,
  '["Engage: Learner receives a exception diagnosis case: claims processing copilot validation is at risk because only 34,390 of 37,290 suggestions passed the control and user overrides and trust failures in assisted decisions is visible","Explore: Learner reviews user edit log, AI suggestion sample, override reason summary, workflow step map, trust feedback notes, highlights the fields that prove the issue, and notes which values cross the threshold","Explain: Learner studies human override pattern, trust signal analysis, AI explanation quality, workflow friction point and learns how these concepts explain the business risk, not just the technical error","Express: Learner prepares the Human-AI Workflow Validation Report with issue summary, numeric evidence, root-cause hypothesis, decision, and handoff note","Empower: Learner must justify the most likely cause and escalation path for claims processing copilot validation","Evolve: Learner writes what evidence would be needed next time to separate the competing root causes faster"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Scenario: Human-AI Workflow Validation Report - Exception Diagnosis Pack
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-083' LIMIT 1)
   AND title = 'L3 Module: Human-AI Workflow Validation Workplace Mission' LIMIT 1),
  'Workplace Scenario: Human-AI Workflow Validation Report - Exception Diagnosis Pack',
  'An exception case is raised during claims processing copilot validation because a human-AI workflow shows conflicting evidence around user overrides and trust failures in assisted decisions. The expected volume is 37,290 suggestions, but only 34,390 suggestions are usable, creating a 7.8% variance against the control expectation. Adjusters reject 18% of suggestions and 23 comments cite missing evidence in the AI explanation. The accepted rule is: unexplained override rate above 12% requires workflow review. The learner receives user edit log, AI suggestion sample, override reason summary, workflow step map, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Human-AI Workflow Validation Report. The learner must compare possible causes, select the most likely root cause, and prepare an escalation-ready artifact. Pressure points: Claims processing copilot validation is time-sensitive; variance is 7.8% against the rule; adjusters reject 18% of suggestions and 23 comments cite missing evidence in the AI explanation; the evidence is conflicting, the business owner is asking for a decision, and escalation must be justified.',
  'Course trigger: two evidence sources disagree and the normal checklist cannot close the case: 34,390 of 37,290 suggestions passed the check, variance 7.8%, with signal ''user overrides and trust failures in assisted decisions''.
Problem statement: An exception case is raised during claims processing copilot validation because a human-AI workflow shows conflicting evidence around user overrides and trust failures in assisted decisions. The expected volume is 37,290 suggestions, but only 34,390 suggestions are usable, creating a 7.8% variance against the control expectation. Adjusters reject 18% of suggestions and 23 comments cite missing evidence in the AI explanation. The accepted rule is: unexplained override rate above 12% requires workflow review. The learner receives user edit log, AI suggestion sample, override reason summary, workflow step map, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Human-AI Workflow Validation Report. The learner must compare possible causes, select the most likely root cause, and prepare an escalation-ready artifact.
Major concepts: human override pattern; trust signal analysis; AI explanation quality; workflow friction point; human-in-the-loop validation; expected 37,290 vs actual 34,390 suggestions; 7.8% variance interpretation; threshold rule: unexplained override rate above 12% requires workflow review; exception hypothesis testing; severity classification.
Root-cause focus: Test competing hypotheses and choose between: AI suggestion lacks evidence, workflow step mismatch, unclear confidence signal, bad handoff timing, or user trust gap. Evidence must come from user edit log, AI suggestion sample, override reason summary.
Required data: user edit log; AI suggestion sample; override reason summary; workflow step map; trust feedback notes; conflicting evidence extract; exception escalation policy
Artifact: Human-AI Workflow Validation Report - Exception Diagnosis Pack
Artifact structure: case summary; expected vs actual numbers; threshold rule; evidence table from user edit log, AI suggestion sample, override reason summary; root-cause hypothesis; decision/action; risk note; role handoff.
Evidence fields to assess: captures expected 37,290 and actual 34,390 suggestions; calculates or explains 7.8% variance; uses threshold rule correctly (unexplained override rate above 12% requires workflow review); cites at least three input documents; links evidence to root-cause hypothesis; states clear release/hold/correct/escalate decision.
AI support tips: Use AI as a coach to ask evidence-checking questions, explain unfamiliar terms, compare possible root causes, and improve clarity. Do not use AI to invent numbers or make the decision without citing the provided documents.',
  1,
  '12 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech CSE - AI & Machine Learning Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-083' LIMIT 1),
  'B.Tech CSE - AI & Machine Learning Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech AI & Data Science - ML Engineering Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-083' LIMIT 1),
  'B.Tech AI & Data Science - ML Engineering Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Tech AI / Machine Learning Engineering
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-083' LIMIT 1),
  'M.Tech AI / Machine Learning Engineering',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Sc AI & Machine Learning
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-083' LIMIT 1),
  'M.Sc AI & Machine Learning',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MCA - AI / ML Application Development
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-083' LIMIT 1),
  'MCA - AI / ML Application Development',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech CSE - AI Product Engineering Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-083' LIMIT 1),
  'B.Tech CSE - AI Product Engineering Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Diagnose a Production Exception in Applied Industry AI Configuration
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Diagnose a Production Exception in Applied Industry AI Configuration',
  'CRS-IND-CL-088',
  'By the end of this course, the learner can diagnose an exception in Applied Industry AI Configuration by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact. Workplace problem: An exception case is raised during healthcare triage model configuration because an applied industry AI solution shows conflicting evidence around vertical workflow mismatch and weak local configuration. The expected volume is 33,146 rules, but only 30,793 rules are usable, creating a 7.1% variance against the control expectation. Triage priority rules misclassify 7 high-risk cases and local escalation SLA is missing for night shifts. The accepted rule is: critical workflow rules must match domain protocol before pilot. The learner receives vertical workflow requirement, configuration rule sheet, domain protocol extract, pilot case sample, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Applied Industry AI Configuration Review. The learner must compare possible causes, select the most likely root cause, and prepare an escalation-ready artifact. Artifact: Applied Industry AI Configuration Review - Exception Diagnosis Pack.',
  '12 hours',
  'Active',
  'Applied Industry AI Solutions; Computer Vision & Multimodal AI Engineering',
  'technical',
  '["By the end of this course, the learner can diagnose an exception in Applied Industry AI Configuration by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact","Learner demonstrates Applied Industry AI Configuration by interpreting real-looking numbers, comparing evidence from vertical workflow requirement and configuration rule sheet, and producing a decision-ready artifact","Proves the learner can perform exception diagnosis work in Applied Industry AI Configuration with numeric evidence, workplace documents, and a reviewer-ready artifact. Status: Demo Ready"]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L3 Module: Applied Industry AI Configuration Workplace Mission
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-088' LIMIT 1),
  'L3 Module: Applied Industry AI Configuration Workplace Mission',
  'Industry requirement: Teams responsible for an applied industry AI solution need learners who can use numeric evidence, threshold rules, and workplace documents to make reliable decisions during healthcare triage model configuration, not only explain Applied Industry AI Configuration theoretically. Gap addressed: Academic learning may cover the concepts behind Applied Industry AI Configuration, but it usually does not make learners practice with vertical workflow requirement, configuration rule sheet, domain protocol extract, numeric variance, threshold decisions, and role handoff artifacts. Trigger: two evidence sources disagree and the normal checklist cannot close the case: 30,793 of 33,146 rules passed the check, variance 7.1%, with signal ''vertical workflow mismatch and weak local configuration''.',
  1,
  '["Data & AI","Applied Industry AI Solutions","Computer Vision & Multimodal AI Engineering","Applied Industry AI Configuration","Primary: Evidence. Supporting: Technical, Functional, Domain","vertical AI configuration","domain protocol mapping","local workflow adaptation","pilot validation evidence","configuration risk","expected 33,146 vs actual 30,793 rules","7.1% variance interpretation","threshold rule: critical workflow rules must match domain protocol before pilot","exception hypothesis testing","severity classification"]'::jsonb,
  '["Engage: Learner receives a exception diagnosis case: healthcare triage model configuration is at risk because only 30,793 of 33,146 rules passed the control and vertical workflow mismatch and weak local configuration is visible","Explore: Learner reviews vertical workflow requirement, configuration rule sheet, domain protocol extract, pilot case sample, stakeholder validation note, highlights the fields that prove the issue, and notes which values cross the threshold","Explain: Learner studies vertical AI configuration, domain protocol mapping, local workflow adaptation, pilot validation evidence and learns how these concepts explain the business risk, not just the technical error","Express: Learner prepares the Applied Industry AI Configuration Review with issue summary, numeric evidence, root-cause hypothesis, decision, and handoff note","Empower: Learner must justify the most likely cause and escalation path for healthcare triage model configuration","Evolve: Learner writes what evidence would be needed next time to separate the competing root causes faster"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Scenario: Applied Industry AI Configuration Review - Exception Diagnosis Pack
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-088' LIMIT 1)
   AND title = 'L3 Module: Applied Industry AI Configuration Workplace Mission' LIMIT 1),
  'Workplace Scenario: Applied Industry AI Configuration Review - Exception Diagnosis Pack',
  'An exception case is raised during healthcare triage model configuration because an applied industry AI solution shows conflicting evidence around vertical workflow mismatch and weak local configuration. The expected volume is 33,146 rules, but only 30,793 rules are usable, creating a 7.1% variance against the control expectation. Triage priority rules misclassify 7 high-risk cases and local escalation SLA is missing for night shifts. The accepted rule is: critical workflow rules must match domain protocol before pilot. The learner receives vertical workflow requirement, configuration rule sheet, domain protocol extract, pilot case sample, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Applied Industry AI Configuration Review. The learner must compare possible causes, select the most likely root cause, and prepare an escalation-ready artifact. Pressure points: Healthcare triage model configuration is time-sensitive; variance is 7.1% against the rule; triage priority rules misclassify 7 high-risk cases and local escalation SLA is missing for night shifts; the evidence is conflicting, the business owner is asking for a decision, and escalation must be justified.',
  'Course trigger: two evidence sources disagree and the normal checklist cannot close the case: 30,793 of 33,146 rules passed the check, variance 7.1%, with signal ''vertical workflow mismatch and weak local configuration''.
Problem statement: An exception case is raised during healthcare triage model configuration because an applied industry AI solution shows conflicting evidence around vertical workflow mismatch and weak local configuration. The expected volume is 33,146 rules, but only 30,793 rules are usable, creating a 7.1% variance against the control expectation. Triage priority rules misclassify 7 high-risk cases and local escalation SLA is missing for night shifts. The accepted rule is: critical workflow rules must match domain protocol before pilot. The learner receives vertical workflow requirement, configuration rule sheet, domain protocol extract, pilot case sample, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Applied Industry AI Configuration Review. The learner must compare possible causes, select the most likely root cause, and prepare an escalation-ready artifact.
Major concepts: vertical AI configuration; domain protocol mapping; local workflow adaptation; pilot validation evidence; configuration risk; expected 33,146 vs actual 30,793 rules; 7.1% variance interpretation; threshold rule: critical workflow rules must match domain protocol before pilot; exception hypothesis testing; severity classification.
Root-cause focus: Test competing hypotheses and choose between: wrong domain rule, local workflow mismatch, missing escalation path, insufficient pilot evidence, or unsupported edge case. Evidence must come from vertical workflow requirement, configuration rule sheet, domain protocol extract.
Required data: vertical workflow requirement; configuration rule sheet; domain protocol extract; pilot case sample; stakeholder validation note; conflicting evidence extract; exception escalation policy
Artifact: Applied Industry AI Configuration Review - Exception Diagnosis Pack
Artifact structure: case summary; expected vs actual numbers; threshold rule; evidence table from vertical workflow requirement, configuration rule sheet, domain protocol extract; root-cause hypothesis; decision/action; risk note; role handoff.
Evidence fields to assess: captures expected 33,146 and actual 30,793 rules; calculates or explains 7.1% variance; uses threshold rule correctly (critical workflow rules must match domain protocol before pilot); cites at least three input documents; links evidence to root-cause hypothesis; states clear release/hold/correct/escalate decision.
AI support tips: Use AI as a coach to ask evidence-checking questions, explain unfamiliar terms, compare possible root causes, and improve clarity. Do not use AI to invent numbers or make the decision without citing the provided documents.',
  1,
  '12 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech CSE - AI Product Engineering Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-088' LIMIT 1),
  'B.Tech CSE - AI Product Engineering Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech AI & Data Science - GenAI Application Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-088' LIMIT 1),
  'B.Tech AI & Data Science - GenAI Application Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MCA - AI Application Development Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-088' LIMIT 1),
  'MCA - AI Application Development Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MBA Product Management / Business Analytics - AI Product Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-088' LIMIT 1),
  'MBA Product Management / Business Analytics - AI Product Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PG Certificate - GenAI Product & Application Design
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-088' LIMIT 1),
  'PG Certificate - GenAI Product & Application Design',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech AI & Data Science - Applied Industry AI Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-088' LIMIT 1),
  'B.Tech AI & Data Science - Applied Industry AI Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Diagnose a Production Exception in Enterprise AI Adoption Roadmap Design
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Diagnose a Production Exception in Enterprise AI Adoption Roadmap Design',
  'CRS-IND-CL-093',
  'By the end of this course, the learner can diagnose an exception in Enterprise AI Adoption Roadmap Design by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact. Workplace problem: An exception case is raised during business-unit AI portfolio planning because an enterprise AI adoption roadmap shows conflicting evidence around unprioritized initiatives with unclear feasibility and risk. The expected volume is 34,472 initiatives, but only 31,985 initiatives are usable, creating a 7.2% variance against the control expectation. 11 initiatives have high claimed value but no data-owner confirmation or adoption dependency map. The accepted rule is: phase-one initiatives must show value, feasibility, data readiness, and risk control. The learner receives AI initiative inventory, value-feasibility scoring sheet, data readiness checklist, risk dependency map, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Enterprise AI Adoption Roadmap Decision Pack. The learner must compare possible causes, select the most likely root cause, and prepare an escalation-ready artifact. Artifact: Enterprise AI Adoption Roadmap Decision Pack - Exception Diagnosis Pack.',
  '12 hours',
  'Active',
  'AI Adoption, Transformation, and Stakeholder Enablement',
  'technical',
  '["By the end of this course, the learner can diagnose an exception in Enterprise AI Adoption Roadmap Design by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact","Learner demonstrates Enterprise AI Adoption Roadmap Design by interpreting real-looking numbers, comparing evidence from AI initiative inventory and value-feasibility scoring sheet, and producing a decision-ready artifact","Proves the learner can perform exception diagnosis work in Enterprise AI Adoption Roadmap Design with numeric evidence, workplace documents, and a reviewer-ready artifact. Status: Demo Ready"]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L3 Module: Enterprise AI Adoption Roadmap Design Workplace Mission
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-093' LIMIT 1),
  'L3 Module: Enterprise AI Adoption Roadmap Design Workplace Mission',
  'Industry requirement: Teams responsible for an enterprise AI adoption roadmap need learners who can use numeric evidence, threshold rules, and workplace documents to make reliable decisions during business-unit AI portfolio planning, not only explain Enterprise AI Adoption Roadmap Design theoretically. Gap addressed: Academic learning may cover the concepts behind Enterprise AI Adoption Roadmap Design, but it usually does not make learners practice with AI initiative inventory, value-feasibility scoring sheet, data readiness checklist, numeric variance, threshold decisions, and role handoff artifacts. Trigger: two evidence sources disagree and the normal checklist cannot close the case: 31,985 of 34,472 initiatives passed the check, variance 7.2%, with signal ''unprioritized initiatives with unclear feasibility and risk''.',
  1,
  '["Data & AI","AI Consulting & Transformation","AI Adoption, Transformation, and Stakeholder Enablement","Enterprise AI Adoption Roadmap Design","Primary: Functional. Supporting: Cognitive, Communication, AI/Digital","AI use-case prioritization","value-feasibility scoring","data readiness dependency","adoption risk","roadmap phasing","expected 34,472 vs actual 31,985 initiatives","7.2% variance interpretation","threshold rule: phase-one initiatives must show value, feasibility, data readiness, and risk control","exception hypothesis testing","severity classification"]'::jsonb,
  '["Engage: Learner receives a exception diagnosis case: business-unit AI portfolio planning is at risk because only 31,985 of 34,472 initiatives passed the control and unprioritized initiatives with unclear feasibility and risk is visible","Explore: Learner reviews AI initiative inventory, value-feasibility scoring sheet, data readiness checklist, risk dependency map, stakeholder prioritization notes, highlights the fields that prove the issue, and notes which values cross the threshold","Explain: Learner studies AI use-case prioritization, value-feasibility scoring, data readiness dependency, adoption risk and learns how these concepts explain the business risk, not just the technical error","Express: Learner prepares the Enterprise AI Adoption Roadmap Decision Pack with issue summary, numeric evidence, root-cause hypothesis, decision, and handoff note","Empower: Learner must justify the most likely cause and escalation path for business-unit AI portfolio planning","Evolve: Learner writes what evidence would be needed next time to separate the competing root causes faster"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Scenario: Enterprise AI Adoption Roadmap Decision Pack - Exception Diagnosis Pack
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-093' LIMIT 1)
   AND title = 'L3 Module: Enterprise AI Adoption Roadmap Design Workplace Mission' LIMIT 1),
  'Workplace Scenario: Enterprise AI Adoption Roadmap Decision Pack - Exception Diagnosis Pack',
  'An exception case is raised during business-unit AI portfolio planning because an enterprise AI adoption roadmap shows conflicting evidence around unprioritized initiatives with unclear feasibility and risk. The expected volume is 34,472 initiatives, but only 31,985 initiatives are usable, creating a 7.2% variance against the control expectation. 11 initiatives have high claimed value but no data-owner confirmation or adoption dependency map. The accepted rule is: phase-one initiatives must show value, feasibility, data readiness, and risk control. The learner receives AI initiative inventory, value-feasibility scoring sheet, data readiness checklist, risk dependency map, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Enterprise AI Adoption Roadmap Decision Pack. The learner must compare possible causes, select the most likely root cause, and prepare an escalation-ready artifact. Pressure points: Business-unit ai portfolio planning is time-sensitive; variance is 7.2% against the rule; 11 initiatives have high claimed value but no data-owner confirmation or adoption dependency map; the evidence is conflicting, the business owner is asking for a decision, and escalation must be justified.',
  'Course trigger: two evidence sources disagree and the normal checklist cannot close the case: 31,985 of 34,472 initiatives passed the check, variance 7.2%, with signal ''unprioritized initiatives with unclear feasibility and risk''.
Problem statement: An exception case is raised during business-unit AI portfolio planning because an enterprise AI adoption roadmap shows conflicting evidence around unprioritized initiatives with unclear feasibility and risk. The expected volume is 34,472 initiatives, but only 31,985 initiatives are usable, creating a 7.2% variance against the control expectation. 11 initiatives have high claimed value but no data-owner confirmation or adoption dependency map. The accepted rule is: phase-one initiatives must show value, feasibility, data readiness, and risk control. The learner receives AI initiative inventory, value-feasibility scoring sheet, data readiness checklist, risk dependency map, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Enterprise AI Adoption Roadmap Decision Pack. The learner must compare possible causes, select the most likely root cause, and prepare an escalation-ready artifact.
Major concepts: AI use-case prioritization; value-feasibility scoring; data readiness dependency; adoption risk; roadmap phasing; expected 34,472 vs actual 31,985 initiatives; 7.2% variance interpretation; threshold rule: phase-one initiatives must show value, feasibility, data readiness, and risk control; exception hypothesis testing; severity classification.
Root-cause focus: Test competing hypotheses and choose between: inflated business value, weak data readiness, missing sponsor, unplanned change-management effort, or unmapped risk dependency. Evidence must come from AI initiative inventory, value-feasibility scoring sheet, data readiness checklist.
Required data: AI initiative inventory; value-feasibility scoring sheet; data readiness checklist; risk dependency map; stakeholder prioritization notes; conflicting evidence extract; exception escalation policy
Artifact: Enterprise AI Adoption Roadmap Decision Pack - Exception Diagnosis Pack
Artifact structure: case summary; expected vs actual numbers; threshold rule; evidence table from AI initiative inventory, value-feasibility scoring sheet, data readiness checklist; root-cause hypothesis; decision/action; risk note; role handoff.
Evidence fields to assess: captures expected 34,472 and actual 31,985 initiatives; calculates or explains 7.2% variance; uses threshold rule correctly (phase-one initiatives must show value, feasibility, data readiness, and risk control); cites at least three input documents; links evidence to root-cause hypothesis; states clear release/hold/correct/escalate decision.
AI support tips: Use AI as a coach to ask evidence-checking questions, explain unfamiliar terms, compare possible root causes, and improve clarity. Do not use AI to invent numbers or make the decision without citing the provided documents.',
  1,
  '12 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MBA Business Analytics - AI Transformation Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-093' LIMIT 1),
  'MBA Business Analytics - AI Transformation Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BBA Business Analytics - AI Adoption Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-093' LIMIT 1),
  'BBA Business Analytics - AI Adoption Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech AI & Data Science - AI Consulting Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-093' LIMIT 1),
  'B.Tech AI & Data Science - AI Consulting Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PG Certificate - AI Strategy & Transformation
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-093' LIMIT 1),
  'PG Certificate - AI Strategy & Transformation',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: Executive Program - AI Adoption & Change Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-093' LIMIT 1),
  'Executive Program - AI Adoption & Change Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Diagnose a Production Exception in AI Training Data Quality Control
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Diagnose a Production Exception in AI Training Data Quality Control',
  'CRS-IND-CL-098',
  'By the end of this course, the learner can diagnose an exception in AI Training Data Quality Control by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact. Workplace problem: An exception case is raised during dataset release quality gate because an AI training data labeling operation shows conflicting evidence around label disagreement and quality-control failure. The expected volume is 111,800 records, but only 99,800 records are usable, creating a 10.7% variance against the control expectation. Inter-annotator agreement is 84% for safety labels and 1,260 records have unresolved adjudication. The accepted rule is: critical label agreement must exceed 92% before release. The learner receives labeling guideline, annotator disagreement report, gold-standard sample, adjudication queue, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the AI Training Data Quality Control Pack. The learner must compare possible causes, select the most likely root cause, and prepare an escalation-ready artifact. Artifact: AI Training Data Quality Control Pack - Exception Diagnosis Pack.',
  '12 hours',
  'Active',
  'Synthetic Data, Labeling & Semantic Operations',
  'technical',
  '["By the end of this course, the learner can diagnose an exception in AI Training Data Quality Control by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact","Learner demonstrates AI Training Data Quality Control by interpreting real-looking numbers, comparing evidence from labeling guideline and annotator disagreement report, and producing a decision-ready artifact","Proves the learner can perform exception diagnosis work in AI Training Data Quality Control with numeric evidence, workplace documents, and a reviewer-ready artifact. Status: Pilot Ready — Evidence Strengthening Needed"]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L3 Module: AI Training Data Quality Control Workplace Mission
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-098' LIMIT 1),
  'L3 Module: AI Training Data Quality Control Workplace Mission',
  'Industry requirement: Teams responsible for an AI training data labeling operation need learners who can use numeric evidence, threshold rules, and workplace documents to make reliable decisions during dataset release quality gate, not only explain AI Training Data Quality Control theoretically. Gap addressed: Academic learning may cover the concepts behind AI Training Data Quality Control, but it usually does not make learners practice with labeling guideline, annotator disagreement report, gold-standard sample, numeric variance, threshold decisions, and role handoff artifacts. Trigger: two evidence sources disagree and the normal checklist cannot close the case: 99,800 of 111,800 records passed the check, variance 10.7%, with signal ''label disagreement and quality-control failure''.',
  1,
  '["Data & AI","Synthetic Data, Labeling & Semantic Operations","AI Training Data Quality Control","Primary: Evidence. Supporting: Domain, Technical, AI/Digital","inter-annotator agreement","gold-standard validation","label adjudication","dataset release threshold","annotation quality audit","expected 111,800 vs actual 99,800 records","10.7% variance interpretation","threshold rule: critical label agreement must exceed 92% before release","exception hypothesis testing","severity classification"]'::jsonb,
  '["Engage: Learner receives a exception diagnosis case: dataset release quality gate is at risk because only 99,800 of 111,800 records passed the control and label disagreement and quality-control failure is visible","Explore: Learner reviews labeling guideline, annotator disagreement report, gold-standard sample, adjudication queue, dataset release checklist, highlights the fields that prove the issue, and notes which values cross the threshold","Explain: Learner studies inter-annotator agreement, gold-standard validation, label adjudication, dataset release threshold and learns how these concepts explain the business risk, not just the technical error","Express: Learner prepares the AI Training Data Quality Control Pack with issue summary, numeric evidence, root-cause hypothesis, decision, and handoff note","Empower: Learner must justify the most likely cause and escalation path for dataset release quality gate","Evolve: Learner writes what evidence would be needed next time to separate the competing root causes faster"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Scenario: AI Training Data Quality Control Pack - Exception Diagnosis Pack
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-098' LIMIT 1)
   AND title = 'L3 Module: AI Training Data Quality Control Workplace Mission' LIMIT 1),
  'Workplace Scenario: AI Training Data Quality Control Pack - Exception Diagnosis Pack',
  'An exception case is raised during dataset release quality gate because an AI training data labeling operation shows conflicting evidence around label disagreement and quality-control failure. The expected volume is 111,800 records, but only 99,800 records are usable, creating a 10.7% variance against the control expectation. Inter-annotator agreement is 84% for safety labels and 1,260 records have unresolved adjudication. The accepted rule is: critical label agreement must exceed 92% before release. The learner receives labeling guideline, annotator disagreement report, gold-standard sample, adjudication queue, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the AI Training Data Quality Control Pack. The learner must compare possible causes, select the most likely root cause, and prepare an escalation-ready artifact. Pressure points: Dataset release quality gate is time-sensitive; variance is 10.7% against the rule; inter-annotator agreement is 84% for safety labels and 1,260 records have unresolved adjudication; the evidence is conflicting, the business owner is asking for a decision, and escalation must be justified.',
  'Course trigger: two evidence sources disagree and the normal checklist cannot close the case: 99,800 of 111,800 records passed the check, variance 10.7%, with signal ''label disagreement and quality-control failure''.
Problem statement: An exception case is raised during dataset release quality gate because an AI training data labeling operation shows conflicting evidence around label disagreement and quality-control failure. The expected volume is 111,800 records, but only 99,800 records are usable, creating a 10.7% variance against the control expectation. Inter-annotator agreement is 84% for safety labels and 1,260 records have unresolved adjudication. The accepted rule is: critical label agreement must exceed 92% before release. The learner receives labeling guideline, annotator disagreement report, gold-standard sample, adjudication queue, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the AI Training Data Quality Control Pack. The learner must compare possible causes, select the most likely root cause, and prepare an escalation-ready artifact.
Major concepts: inter-annotator agreement; gold-standard validation; label adjudication; dataset release threshold; annotation quality audit; expected 111,800 vs actual 99,800 records; 10.7% variance interpretation; threshold rule: critical label agreement must exceed 92% before release; exception hypothesis testing; severity classification.
Root-cause focus: Test competing hypotheses and choose between: ambiguous labeling rule, annotator training gap, weak gold-standard sample, unresolved adjudication, or class imbalance. Evidence must come from labeling guideline, annotator disagreement report, gold-standard sample.
Required data: labeling guideline; annotator disagreement report; gold-standard sample; adjudication queue; dataset release checklist; conflicting evidence extract; exception escalation policy
Artifact: AI Training Data Quality Control Pack - Exception Diagnosis Pack
Artifact structure: case summary; expected vs actual numbers; threshold rule; evidence table from labeling guideline, annotator disagreement report, gold-standard sample; root-cause hypothesis; decision/action; risk note; role handoff.
Evidence fields to assess: captures expected 111,800 and actual 99,800 records; calculates or explains 10.7% variance; uses threshold rule correctly (critical label agreement must exceed 92% before release); cites at least three input documents; links evidence to root-cause hypothesis; states clear release/hold/correct/escalate decision.
AI support tips: Use AI as a coach to ask evidence-checking questions, explain unfamiliar terms, compare possible root causes, and improve clarity. Do not use AI to invent numbers or make the decision without citing the provided documents.',
  1,
  '12 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech CSE - Data Engineering Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-098' LIMIT 1),
  'B.Tech CSE - Data Engineering Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech AI & Data Science - Data Platform Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-098' LIMIT 1),
  'B.Tech AI & Data Science - Data Platform Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Data Science - Data Engineering Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-098' LIMIT 1),
  'B.Sc Data Science - Data Engineering Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MCA - Data Engineering / Cloud Data Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-098' LIMIT 1),
  'MCA - Data Engineering / Cloud Data Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Tech Data Engineering / Big Data Systems
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-098' LIMIT 1),
  'M.Tech Data Engineering / Big Data Systems',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Data Science - Data Operations Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-098' LIMIT 1),
  'B.Sc Data Science - Data Operations Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Diagnose a Production Exception in Semantic Knowledge Graph Validation
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Diagnose a Production Exception in Semantic Knowledge Graph Validation',
  'CRS-IND-CL-103',
  'By the end of this course, the learner can diagnose an exception in Semantic Knowledge Graph Validation by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact. Workplace problem: An exception case is raised during entity-relation validation before search rollout because a semantic knowledge graph shows conflicting evidence around duplicate entities and invalid relationships. The expected volume is 352,170 triples, but only 307,440 triples are usable, creating a 12.7% variance against the control expectation. 4,800 customer entities are duplicated and 2.9% of supplier-to-product edges violate ontology rules. The accepted rule is: critical relation errors must remain below 1% before rollout. The learner receives ontology rule sheet, entity resolution sample, relationship validation report, SPARQL error extract, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Semantic Knowledge Graph Validation Pack. The learner must compare possible causes, select the most likely root cause, and prepare an escalation-ready artifact. Artifact: Semantic Knowledge Graph Validation Pack - Exception Diagnosis Pack.',
  '12 hours',
  'Active',
  'Synthetic Data, Labeling & Semantic Operations',
  'technical',
  '["By the end of this course, the learner can diagnose an exception in Semantic Knowledge Graph Validation by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact","Learner demonstrates Semantic Knowledge Graph Validation by interpreting real-looking numbers, comparing evidence from ontology rule sheet and entity resolution sample, and producing a decision-ready artifact","Proves the learner can perform exception diagnosis work in Semantic Knowledge Graph Validation with numeric evidence, workplace documents, and a reviewer-ready artifact. Status: Pilot Ready — Evidence Strengthening Needed"]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L3 Module: Semantic Knowledge Graph Validation Workplace Mission
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-103' LIMIT 1),
  'L3 Module: Semantic Knowledge Graph Validation Workplace Mission',
  'Industry requirement: Teams responsible for a semantic knowledge graph need learners who can use numeric evidence, threshold rules, and workplace documents to make reliable decisions during entity-relation validation before search rollout, not only explain Semantic Knowledge Graph Validation theoretically. Gap addressed: Academic learning may cover the concepts behind Semantic Knowledge Graph Validation, but it usually does not make learners practice with ontology rule sheet, entity resolution sample, relationship validation report, numeric variance, threshold decisions, and role handoff artifacts. Trigger: two evidence sources disagree and the normal checklist cannot close the case: 307,440 of 352,170 triples passed the check, variance 12.7%, with signal ''duplicate entities and invalid relationships''.',
  1,
  '["Data & AI","Synthetic Data, Labeling & Semantic Operations","Semantic Knowledge Graph Validation","Primary: Evidence. Supporting: Domain, Technical, AI/Digital","entity resolution","ontology constraint","relationship validation","graph quality rule","semantic search impact","expected 352,170 vs actual 307,440 triples","12.7% variance interpretation","threshold rule: critical relation errors must remain below 1% before rollout","exception hypothesis testing","severity classification"]'::jsonb,
  '["Engage: Learner receives a exception diagnosis case: entity-relation validation before search rollout is at risk because only 307,440 of 352,170 triples passed the control and duplicate entities and invalid relationships is visible","Explore: Learner reviews ontology rule sheet, entity resolution sample, relationship validation report, SPARQL error extract, search relevance issue log, highlights the fields that prove the issue, and notes which values cross the threshold","Explain: Learner studies entity resolution, ontology constraint, relationship validation, graph quality rule and learns how these concepts explain the business risk, not just the technical error","Express: Learner prepares the Semantic Knowledge Graph Validation Pack with issue summary, numeric evidence, root-cause hypothesis, decision, and handoff note","Empower: Learner must justify the most likely cause and escalation path for entity-relation validation before search rollout","Evolve: Learner writes what evidence would be needed next time to separate the competing root causes faster"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Scenario: Semantic Knowledge Graph Validation Pack - Exception Diagnosis Pack
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-103' LIMIT 1)
   AND title = 'L3 Module: Semantic Knowledge Graph Validation Workplace Mission' LIMIT 1),
  'Workplace Scenario: Semantic Knowledge Graph Validation Pack - Exception Diagnosis Pack',
  'An exception case is raised during entity-relation validation before search rollout because a semantic knowledge graph shows conflicting evidence around duplicate entities and invalid relationships. The expected volume is 352,170 triples, but only 307,440 triples are usable, creating a 12.7% variance against the control expectation. 4,800 customer entities are duplicated and 2.9% of supplier-to-product edges violate ontology rules. The accepted rule is: critical relation errors must remain below 1% before rollout. The learner receives ontology rule sheet, entity resolution sample, relationship validation report, SPARQL error extract, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Semantic Knowledge Graph Validation Pack. The learner must compare possible causes, select the most likely root cause, and prepare an escalation-ready artifact. Pressure points: Entity-relation validation before search rollout is time-sensitive; variance is 12.7% against the rule; 4,800 customer entities are duplicated and 2.9% of supplier-to-product edges violate ontology rules; the evidence is conflicting, the business owner is asking for a decision, and escalation must be justified.',
  'Course trigger: two evidence sources disagree and the normal checklist cannot close the case: 307,440 of 352,170 triples passed the check, variance 12.7%, with signal ''duplicate entities and invalid relationships''.
Problem statement: An exception case is raised during entity-relation validation before search rollout because a semantic knowledge graph shows conflicting evidence around duplicate entities and invalid relationships. The expected volume is 352,170 triples, but only 307,440 triples are usable, creating a 12.7% variance against the control expectation. 4,800 customer entities are duplicated and 2.9% of supplier-to-product edges violate ontology rules. The accepted rule is: critical relation errors must remain below 1% before rollout. The learner receives ontology rule sheet, entity resolution sample, relationship validation report, SPARQL error extract, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Semantic Knowledge Graph Validation Pack. The learner must compare possible causes, select the most likely root cause, and prepare an escalation-ready artifact.
Major concepts: entity resolution; ontology constraint; relationship validation; graph quality rule; semantic search impact; expected 352,170 vs actual 307,440 triples; 12.7% variance interpretation; threshold rule: critical relation errors must remain below 1% before rollout; exception hypothesis testing; severity classification.
Root-cause focus: Test competing hypotheses and choose between: entity duplication, wrong relationship type, ontology constraint violation, stale source mapping, or weak synonym handling. Evidence must come from ontology rule sheet, entity resolution sample, relationship validation report.
Required data: ontology rule sheet; entity resolution sample; relationship validation report; SPARQL error extract; search relevance issue log; conflicting evidence extract; exception escalation policy
Artifact: Semantic Knowledge Graph Validation Pack - Exception Diagnosis Pack
Artifact structure: case summary; expected vs actual numbers; threshold rule; evidence table from ontology rule sheet, entity resolution sample, relationship validation report; root-cause hypothesis; decision/action; risk note; role handoff.
Evidence fields to assess: captures expected 352,170 and actual 307,440 triples; calculates or explains 12.7% variance; uses threshold rule correctly (critical relation errors must remain below 1% before rollout); cites at least three input documents; links evidence to root-cause hypothesis; states clear release/hold/correct/escalate decision.
AI support tips: Use AI as a coach to ask evidence-checking questions, explain unfamiliar terms, compare possible root causes, and improve clarity. Do not use AI to invent numbers or make the decision without citing the provided documents.',
  1,
  '12 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech CSE - Data Engineering Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-103' LIMIT 1),
  'B.Tech CSE - Data Engineering Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech AI & Data Science - Data Platform Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-103' LIMIT 1),
  'B.Tech AI & Data Science - Data Platform Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Data Science - Data Engineering Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-103' LIMIT 1),
  'B.Sc Data Science - Data Engineering Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MCA - Data Engineering / Cloud Data Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-103' LIMIT 1),
  'MCA - Data Engineering / Cloud Data Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Tech Data Engineering / Big Data Systems
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-103' LIMIT 1),
  'M.Tech Data Engineering / Big Data Systems',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Data Science - Data Operations Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-103' LIMIT 1),
  'B.Sc Data Science - Data Operations Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Improve the Lakehouse Pipeline Controls Workflow Using Evidence
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Improve the Lakehouse Pipeline Controls Workflow Using Evidence',
  'CRS-IND-CL-004',
  'By the end of this course, the learner can improve a recurring workflow in Lakehouse Pipeline Controls by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact. Workplace problem: An improvement review finds that daily revenue dashboard refresh has repeated failures over the last 4 cycles, mainly linked to bronze-to-silver load variance and a schema warning. The expected volume is 109,970 records, but only 92,840 records are usable, creating a 15.6% variance against the control expectation. The `discount_code` field is missing in 14% of rows and `customer_region` has a new APAC-South value. The accepted rule is: record variance must stay under 1.5%. The learner receives pipeline failure log, source file profile, schema comparison sheet, record completeness report, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Lakehouse Pipeline Control Exception Note. The learner must study the trend, identify the control weakness, and propose a workflow improvement with before/after evidence. Artifact: Lakehouse Pipeline Control Exception Note - Improvement Proposal.',
  '14 hours',
  'Active',
  'Data Engineering & Lakehouse Operations',
  'technical',
  '["By the end of this course, the learner can improve a recurring workflow in Lakehouse Pipeline Controls by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact","Learner demonstrates Lakehouse Pipeline Controls by interpreting real-looking numbers, comparing evidence from pipeline failure log and source file profile, and producing a decision-ready artifact","Proves the learner can perform workflow improvement work in Lakehouse Pipeline Controls with numeric evidence, workplace documents, and a reviewer-ready artifact. Status: Demo Ready"]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L4 Module: Lakehouse Pipeline Controls Workplace Mission
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-004' LIMIT 1),
  'L4 Module: Lakehouse Pipeline Controls Workplace Mission',
  'Industry requirement: Teams responsible for a retail sales lakehouse pipeline need learners who can use numeric evidence, threshold rules, and workplace documents to make reliable decisions during daily revenue dashboard refresh, not only explain Lakehouse Pipeline Controls theoretically. Gap addressed: Academic learning may cover the concepts behind Lakehouse Pipeline Controls, but it usually does not make learners practice with pipeline failure log, source file profile, schema comparison sheet, numeric variance, threshold decisions, and role handoff artifacts. Trigger: the same issue has repeated across at least 3 recent runs or reviews: 92,840 of 109,970 records passed the check, variance 15.6%, with signal ''bronze-to-silver load variance and a schema warning''.',
  1,
  '["Data & AI","Data Platform Engineering","Data Engineering & Lakehouse Operations","Lakehouse Pipeline Controls","Primary: Evidence. Supporting: Technical, Functional, Domain, Behavioural","expected vs actual record-count variance","schema version mismatch","source-to-bronze reconciliation","bronze-to-silver completeness check","dashboard release hold decision","expected 109,970 vs actual 92,840 records","15.6% variance interpretation","threshold rule: record variance must stay under 1.5%","trend evidence","control redesign","before/after comparison"]'::jsonb,
  '["Engage: Learner receives a workflow improvement case: daily revenue dashboard refresh is at risk because only 92,840 of 109,970 records passed the control and bronze-to-silver load variance and a schema warning is visible","Explore: Learner reviews pipeline failure log, source file profile, schema comparison sheet, record completeness report, dashboard refresh note, highlights the fields that prove the issue, and notes which values cross the threshold","Explain: Learner studies expected vs actual record-count variance, schema version mismatch, source-to-bronze reconciliation, bronze-to-silver completeness check and learns how these concepts explain the business risk, not just the technical error","Express: Learner prepares the Lakehouse Pipeline Control Exception Note with issue summary, numeric evidence, root-cause hypothesis, decision, and handoff note","Empower: Learner must propose a control change that reduces recurrence for daily revenue dashboard refresh","Evolve: Learner defines a before/after measure to prove the workflow improvement reduced repeat failures"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Scenario: Lakehouse Pipeline Control Exception Note - Improvement Proposal
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-004' LIMIT 1)
   AND title = 'L4 Module: Lakehouse Pipeline Controls Workplace Mission' LIMIT 1),
  'Workplace Scenario: Lakehouse Pipeline Control Exception Note - Improvement Proposal',
  'An improvement review finds that daily revenue dashboard refresh has repeated failures over the last 4 cycles, mainly linked to bronze-to-silver load variance and a schema warning. The expected volume is 109,970 records, but only 92,840 records are usable, creating a 15.6% variance against the control expectation. The `discount_code` field is missing in 14% of rows and `customer_region` has a new APAC-South value. The accepted rule is: record variance must stay under 1.5%. The learner receives pipeline failure log, source file profile, schema comparison sheet, record completeness report, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Lakehouse Pipeline Control Exception Note. The learner must study the trend, identify the control weakness, and propose a workflow improvement with before/after evidence. Pressure points: Daily revenue dashboard refresh is time-sensitive; variance is 15.6% against the rule; the `discount_code` field is missing in 14% of rows and `customer_region` has a new APAC-South value; the issue is recurring, rework hours are increasing, and the team needs a preventive control.',
  'Course trigger: the same issue has repeated across at least 3 recent runs or reviews: 92,840 of 109,970 records passed the check, variance 15.6%, with signal ''bronze-to-silver load variance and a schema warning''.
Problem statement: An improvement review finds that daily revenue dashboard refresh has repeated failures over the last 4 cycles, mainly linked to bronze-to-silver load variance and a schema warning. The expected volume is 109,970 records, but only 92,840 records are usable, creating a 15.6% variance against the control expectation. The `discount_code` field is missing in 14% of rows and `customer_region` has a new APAC-South value. The accepted rule is: record variance must stay under 1.5%. The learner receives pipeline failure log, source file profile, schema comparison sheet, record completeness report, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Lakehouse Pipeline Control Exception Note. The learner must study the trend, identify the control weakness, and propose a workflow improvement with before/after evidence.
Major concepts: expected vs actual record-count variance; schema version mismatch; source-to-bronze reconciliation; bronze-to-silver completeness check; dashboard release hold decision; expected 109,970 vs actual 92,840 records; 15.6% variance interpretation; threshold rule: record variance must stay under 1.5%; trend evidence; control redesign; before/after comparison.
Root-cause focus: Find which repeated process weakness is causing: source extract cut-off, schema drift, failed ingestion batch, transformation join loss, or late-arriving partition. Evidence must come from pipeline failure log, source file profile, schema comparison sheet.
Required data: pipeline failure log; source file profile; schema comparison sheet; record completeness report; dashboard refresh note; 4-cycle trend summary; rework-hours log; current workflow map
Artifact: Lakehouse Pipeline Control Exception Note - Improvement Proposal
Artifact structure: case summary; expected vs actual numbers; threshold rule; evidence table from pipeline failure log, source file profile, schema comparison sheet; root-cause hypothesis; decision/action; risk note; role handoff; recurring trend evidence; proposed process change; before/after success metric.
Evidence fields to assess: captures expected 109,970 and actual 92,840 records; calculates or explains 15.6% variance; uses threshold rule correctly (record variance must stay under 1.5%); cites at least three input documents; links evidence to root-cause hypothesis; states clear release/hold/correct/escalate decision; defines measurable improvement target; shows before/after control logic.
AI support tips: Use AI as a coach to ask evidence-checking questions, explain unfamiliar terms, compare possible root causes, and improve clarity. Do not use AI to invent numbers or make the decision without citing the provided documents.',
  1,
  '14 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech CSE - Data Engineering Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-004' LIMIT 1),
  'B.Tech CSE - Data Engineering Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech AI & Data Science - Data Platform Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-004' LIMIT 1),
  'B.Tech AI & Data Science - Data Platform Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Data Science - Data Engineering Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-004' LIMIT 1),
  'B.Sc Data Science - Data Engineering Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MCA - Data Engineering / Cloud Data Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-004' LIMIT 1),
  'MCA - Data Engineering / Cloud Data Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Tech Data Engineering / Big Data Systems
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-004' LIMIT 1),
  'M.Tech Data Engineering / Big Data Systems',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Improve the Gold Data Product Publishing Workflow Using Evidence
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Improve the Gold Data Product Publishing Workflow Using Evidence',
  'CRS-IND-CL-009',
  'By the end of this course, the learner can improve a recurring workflow in Gold Data Product Publishing by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact. Workplace problem: An improvement review finds that monthly margin KPI publication has repeated failures over the last 4 cycles, mainly linked to metric grain mismatch and duplicate account totals. The expected volume is 58,140 rows, but only 53,880 rows are usable, creating a 7.3% variance against the control expectation. The `net_margin_pct` measure differs by 2.8 points between semantic layer and finance workbook. The accepted rule is: KPI variance must be below 0.5% before certification. The learner receives KPI definition note, gold table grain mapping, semantic measure validation sheet, finance reconciliation extract, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Gold Data Product Publishing Sign-off Pack. The learner must study the trend, identify the control weakness, and propose a workflow improvement with before/after evidence. Artifact: Gold Data Product Publishing Sign-off Pack - Improvement Proposal.',
  '14 hours',
  'Active',
  'Data Platform Engineering; BI & Reporting Analytics',
  'technical',
  '["By the end of this course, the learner can improve a recurring workflow in Gold Data Product Publishing by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact","Learner demonstrates Gold Data Product Publishing by interpreting real-looking numbers, comparing evidence from KPI definition note and gold table grain mapping, and producing a decision-ready artifact","Proves the learner can perform workflow improvement work in Gold Data Product Publishing with numeric evidence, workplace documents, and a reviewer-ready artifact. Status: Demo Ready"]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L4 Module: Gold Data Product Publishing Workplace Mission
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-009' LIMIT 1),
  'L4 Module: Gold Data Product Publishing Workplace Mission',
  'Industry requirement: Teams responsible for a finance gold data product need learners who can use numeric evidence, threshold rules, and workplace documents to make reliable decisions during monthly margin KPI publication, not only explain Gold Data Product Publishing theoretically. Gap addressed: Academic learning may cover the concepts behind Gold Data Product Publishing, but it usually does not make learners practice with KPI definition note, gold table grain mapping, semantic measure validation sheet, numeric variance, threshold decisions, and role handoff artifacts. Trigger: the same issue has repeated across at least 3 recent runs or reviews: 53,880 of 58,140 rows passed the check, variance 7.3%, with signal ''metric grain mismatch and duplicate account totals''.',
  1,
  '["Data & AI","Data Platform Engineering","BI & Reporting Analytics","Gold Data Product Publishing","Primary: Evidence. Supporting: Technical, Functional, Domain, Behavioural","metric grain control","semantic measure validation","consumer-ready data product certification","KPI definition sign-off","duplicate total reconciliation","expected 58,140 vs actual 53,880 rows","7.3% variance interpretation","threshold rule: KPI variance must be below 0.5% before certification","trend evidence","control redesign","before/after comparison"]'::jsonb,
  '["Engage: Learner receives a workflow improvement case: monthly margin KPI publication is at risk because only 53,880 of 58,140 rows passed the control and metric grain mismatch and duplicate account totals is visible","Explore: Learner reviews KPI definition note, gold table grain mapping, semantic measure validation sheet, finance reconciliation extract, consumer sign-off request, highlights the fields that prove the issue, and notes which values cross the threshold","Explain: Learner studies metric grain control, semantic measure validation, consumer-ready data product certification, KPI definition sign-off and learns how these concepts explain the business risk, not just the technical error","Express: Learner prepares the Gold Data Product Publishing Sign-off Pack with issue summary, numeric evidence, root-cause hypothesis, decision, and handoff note","Empower: Learner must propose a control change that reduces recurrence for monthly margin KPI publication","Evolve: Learner defines a before/after measure to prove the workflow improvement reduced repeat failures"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Scenario: Gold Data Product Publishing Sign-off Pack - Improvement Proposal
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-009' LIMIT 1)
   AND title = 'L4 Module: Gold Data Product Publishing Workplace Mission' LIMIT 1),
  'Workplace Scenario: Gold Data Product Publishing Sign-off Pack - Improvement Proposal',
  'An improvement review finds that monthly margin KPI publication has repeated failures over the last 4 cycles, mainly linked to metric grain mismatch and duplicate account totals. The expected volume is 58,140 rows, but only 53,880 rows are usable, creating a 7.3% variance against the control expectation. The `net_margin_pct` measure differs by 2.8 points between semantic layer and finance workbook. The accepted rule is: KPI variance must be below 0.5% before certification. The learner receives KPI definition note, gold table grain mapping, semantic measure validation sheet, finance reconciliation extract, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Gold Data Product Publishing Sign-off Pack. The learner must study the trend, identify the control weakness, and propose a workflow improvement with before/after evidence. Pressure points: Monthly margin kpi publication is time-sensitive; variance is 7.3% against the rule; the `net_margin_pct` measure differs by 2.8 points between semantic layer and finance workbook; the issue is recurring, rework hours are increasing, and the team needs a preventive control.',
  'Course trigger: the same issue has repeated across at least 3 recent runs or reviews: 53,880 of 58,140 rows passed the check, variance 7.3%, with signal ''metric grain mismatch and duplicate account totals''.
Problem statement: An improvement review finds that monthly margin KPI publication has repeated failures over the last 4 cycles, mainly linked to metric grain mismatch and duplicate account totals. The expected volume is 58,140 rows, but only 53,880 rows are usable, creating a 7.3% variance against the control expectation. The `net_margin_pct` measure differs by 2.8 points between semantic layer and finance workbook. The accepted rule is: KPI variance must be below 0.5% before certification. The learner receives KPI definition note, gold table grain mapping, semantic measure validation sheet, finance reconciliation extract, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Gold Data Product Publishing Sign-off Pack. The learner must study the trend, identify the control weakness, and propose a workflow improvement with before/after evidence.
Major concepts: metric grain control; semantic measure validation; consumer-ready data product certification; KPI definition sign-off; duplicate total reconciliation; expected 58,140 vs actual 53,880 rows; 7.3% variance interpretation; threshold rule: KPI variance must be below 0.5% before certification; trend evidence; control redesign; before/after comparison.
Root-cause focus: Find which repeated process weakness is causing: wrong aggregation grain, duplicate account mapping, stale semantic measure, incorrect filter context, or unapproved KPI definition. Evidence must come from KPI definition note, gold table grain mapping, semantic measure validation sheet.
Required data: KPI definition note; gold table grain mapping; semantic measure validation sheet; finance reconciliation extract; consumer sign-off request; 4-cycle trend summary; rework-hours log; current workflow map
Artifact: Gold Data Product Publishing Sign-off Pack - Improvement Proposal
Artifact structure: case summary; expected vs actual numbers; threshold rule; evidence table from KPI definition note, gold table grain mapping, semantic measure validation sheet; root-cause hypothesis; decision/action; risk note; role handoff; recurring trend evidence; proposed process change; before/after success metric.
Evidence fields to assess: captures expected 58,140 and actual 53,880 rows; calculates or explains 7.3% variance; uses threshold rule correctly (KPI variance must be below 0.5% before certification); cites at least three input documents; links evidence to root-cause hypothesis; states clear release/hold/correct/escalate decision; defines measurable improvement target; shows before/after control logic.
AI support tips: Use AI as a coach to ask evidence-checking questions, explain unfamiliar terms, compare possible root causes, and improve clarity. Do not use AI to invent numbers or make the decision without citing the provided documents.',
  1,
  '14 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech CSE - Data Engineering Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-009' LIMIT 1),
  'B.Tech CSE - Data Engineering Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech AI & Data Science - Data Platform Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-009' LIMIT 1),
  'B.Tech AI & Data Science - Data Platform Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Data Science - Data Engineering Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-009' LIMIT 1),
  'B.Sc Data Science - Data Engineering Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MCA - Data Engineering / Cloud Data Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-009' LIMIT 1),
  'MCA - Data Engineering / Cloud Data Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Tech Data Engineering / Big Data Systems
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-009' LIMIT 1),
  'M.Tech Data Engineering / Big Data Systems',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Data Science - BI & Analytics Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-009' LIMIT 1),
  'B.Sc Data Science - BI & Analytics Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Improve the Streaming Contract Stabilization Workflow Using Evidence
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Improve the Streaming Contract Stabilization Workflow Using Evidence',
  'CRS-IND-CL-014',
  'By the end of this course, the learner can improve a recurring workflow in Streaming Contract Stabilization by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact. Workplace problem: An improvement review finds that real-time personalization feed has repeated failures over the last 4 cycles, mainly linked to stream contract violations and late event spikes. The expected volume is 196,710 events, but only 168,195 events are usable, creating a 14.5% variance against the control expectation. 7.6% of events arrive after the 5-minute SLA and the `session_id` type changed from string to integer. The accepted rule is: contract violations must remain below 0.8%. The learner receives stream contract spec, Kafka topic error log, late-arrival summary, schema registry diff, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Streaming Contract Stabilization Report. The learner must study the trend, identify the control weakness, and propose a workflow improvement with before/after evidence. Artifact: Streaming Contract Stabilization Report - Improvement Proposal.',
  '14 hours',
  'Active',
  'Data Engineering & Lakehouse Operations',
  'technical',
  '["By the end of this course, the learner can improve a recurring workflow in Streaming Contract Stabilization by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact","Learner demonstrates Streaming Contract Stabilization by interpreting real-looking numbers, comparing evidence from stream contract spec and Kafka topic error log, and producing a decision-ready artifact","Proves the learner can perform workflow improvement work in Streaming Contract Stabilization with numeric evidence, workplace documents, and a reviewer-ready artifact. Status: Demo Ready"]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L4 Module: Streaming Contract Stabilization Workplace Mission
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-014' LIMIT 1),
  'L4 Module: Streaming Contract Stabilization Workplace Mission',
  'Industry requirement: Teams responsible for a streaming customer-event contract need learners who can use numeric evidence, threshold rules, and workplace documents to make reliable decisions during real-time personalization feed, not only explain Streaming Contract Stabilization theoretically. Gap addressed: Academic learning may cover the concepts behind Streaming Contract Stabilization, but it usually does not make learners practice with stream contract spec, Kafka topic error log, late-arrival summary, numeric variance, threshold decisions, and role handoff artifacts. Trigger: the same issue has repeated across at least 3 recent runs or reviews: 168,195 of 196,710 events passed the check, variance 14.5%, with signal ''stream contract violations and late event spikes''.',
  1,
  '["Data & AI","Data Platform Engineering","Data Engineering & Lakehouse Operations","Streaming Contract Stabilization","Primary: Evidence. Supporting: Technical, Functional, Domain, Behavioural","stream schema contract","late-arrival window","consumer compatibility","event-time vs processing-time","contract test evidence","expected 196,710 vs actual 168,195 events","14.5% variance interpretation","threshold rule: contract violations must remain below 0.8%","trend evidence","control redesign","before/after comparison"]'::jsonb,
  '["Engage: Learner receives a workflow improvement case: real-time personalization feed is at risk because only 168,195 of 196,710 events passed the control and stream contract violations and late event spikes is visible","Explore: Learner reviews stream contract spec, Kafka topic error log, late-arrival summary, schema registry diff, consumer failure ticket, highlights the fields that prove the issue, and notes which values cross the threshold","Explain: Learner studies stream schema contract, late-arrival window, consumer compatibility, event-time vs processing-time and learns how these concepts explain the business risk, not just the technical error","Express: Learner prepares the Streaming Contract Stabilization Report with issue summary, numeric evidence, root-cause hypothesis, decision, and handoff note","Empower: Learner must propose a control change that reduces recurrence for real-time personalization feed","Evolve: Learner defines a before/after measure to prove the workflow improvement reduced repeat failures"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Scenario: Streaming Contract Stabilization Report - Improvement Proposal
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-014' LIMIT 1)
   AND title = 'L4 Module: Streaming Contract Stabilization Workplace Mission' LIMIT 1),
  'Workplace Scenario: Streaming Contract Stabilization Report - Improvement Proposal',
  'An improvement review finds that real-time personalization feed has repeated failures over the last 4 cycles, mainly linked to stream contract violations and late event spikes. The expected volume is 196,710 events, but only 168,195 events are usable, creating a 14.5% variance against the control expectation. 7.6% of events arrive after the 5-minute SLA and the `session_id` type changed from string to integer. The accepted rule is: contract violations must remain below 0.8%. The learner receives stream contract spec, Kafka topic error log, late-arrival summary, schema registry diff, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Streaming Contract Stabilization Report. The learner must study the trend, identify the control weakness, and propose a workflow improvement with before/after evidence. Pressure points: Real-time personalization feed is time-sensitive; variance is 14.5% against the rule; 7.6% of events arrive after the 5-minute SLA and the `session_id` type changed from string to integer; the issue is recurring, rework hours are increasing, and the team needs a preventive control.',
  'Course trigger: the same issue has repeated across at least 3 recent runs or reviews: 168,195 of 196,710 events passed the check, variance 14.5%, with signal ''stream contract violations and late event spikes''.
Problem statement: An improvement review finds that real-time personalization feed has repeated failures over the last 4 cycles, mainly linked to stream contract violations and late event spikes. The expected volume is 196,710 events, but only 168,195 events are usable, creating a 14.5% variance against the control expectation. 7.6% of events arrive after the 5-minute SLA and the `session_id` type changed from string to integer. The accepted rule is: contract violations must remain below 0.8%. The learner receives stream contract spec, Kafka topic error log, late-arrival summary, schema registry diff, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Streaming Contract Stabilization Report. The learner must study the trend, identify the control weakness, and propose a workflow improvement with before/after evidence.
Major concepts: stream schema contract; late-arrival window; consumer compatibility; event-time vs processing-time; contract test evidence; expected 196,710 vs actual 168,195 events; 14.5% variance interpretation; threshold rule: contract violations must remain below 0.8%; trend evidence; control redesign; before/after comparison.
Root-cause focus: Find which repeated process weakness is causing: producer schema change, late event window, consumer deserialization failure, partition lag, or missing contract test. Evidence must come from stream contract spec, Kafka topic error log, late-arrival summary.
Required data: stream contract spec; Kafka topic error log; late-arrival summary; schema registry diff; consumer failure ticket; 4-cycle trend summary; rework-hours log; current workflow map
Artifact: Streaming Contract Stabilization Report - Improvement Proposal
Artifact structure: case summary; expected vs actual numbers; threshold rule; evidence table from stream contract spec, Kafka topic error log, late-arrival summary; root-cause hypothesis; decision/action; risk note; role handoff; recurring trend evidence; proposed process change; before/after success metric.
Evidence fields to assess: captures expected 196,710 and actual 168,195 events; calculates or explains 14.5% variance; uses threshold rule correctly (contract violations must remain below 0.8%); cites at least three input documents; links evidence to root-cause hypothesis; states clear release/hold/correct/escalate decision; defines measurable improvement target; shows before/after control logic.
AI support tips: Use AI as a coach to ask evidence-checking questions, explain unfamiliar terms, compare possible root causes, and improve clarity. Do not use AI to invent numbers or make the decision without citing the provided documents.',
  1,
  '14 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech CSE - Data Engineering Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-014' LIMIT 1),
  'B.Tech CSE - Data Engineering Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech AI & Data Science - Data Platform Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-014' LIMIT 1),
  'B.Tech AI & Data Science - Data Platform Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Data Science - Data Engineering Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-014' LIMIT 1),
  'B.Sc Data Science - Data Engineering Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MCA - Data Engineering / Cloud Data Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-014' LIMIT 1),
  'MCA - Data Engineering / Cloud Data Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Tech Data Engineering / Big Data Systems
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-014' LIMIT 1),
  'M.Tech Data Engineering / Big Data Systems',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Improve the BI Asset Certification Workflow Using Evidence
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Improve the BI Asset Certification Workflow Using Evidence',
  'CRS-IND-CL-019',
  'By the end of this course, the learner can improve a recurring workflow in BI Asset Certification by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact. Workplace problem: An improvement review finds that executive sales performance review has repeated failures over the last 4 cycles, mainly linked to uncertified dataset use and mismatched dashboard totals. The expected volume is 18,134 tiles, but only 17,602 tiles are usable, creating a 2.9% variance against the control expectation. Regional sales total is 6.4% higher in the dashboard than the approved semantic model. The accepted rule is: 100% of executive tiles must use certified sources. The learner receives dashboard dependency list, certified dataset register, semantic model measure sheet, data refresh history, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the BI Asset Certification Review Sheet. The learner must study the trend, identify the control weakness, and propose a workflow improvement with before/after evidence. Artifact: BI Asset Certification Review Sheet - Improvement Proposal.',
  '14 hours',
  'Active',
  'BI & Reporting Analytics',
  'technical',
  '["By the end of this course, the learner can improve a recurring workflow in BI Asset Certification by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact","Learner demonstrates BI Asset Certification by interpreting real-looking numbers, comparing evidence from dashboard dependency list and certified dataset register, and producing a decision-ready artifact","Proves the learner can perform workflow improvement work in BI Asset Certification with numeric evidence, workplace documents, and a reviewer-ready artifact. Status: Demo Ready"]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L4 Module: BI Asset Certification Workplace Mission
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-019' LIMIT 1),
  'L4 Module: BI Asset Certification Workplace Mission',
  'Industry requirement: Teams responsible for a certified BI reporting asset need learners who can use numeric evidence, threshold rules, and workplace documents to make reliable decisions during executive sales performance review, not only explain BI Asset Certification theoretically. Gap addressed: Academic learning may cover the concepts behind BI Asset Certification, but it usually does not make learners practice with dashboard dependency list, certified dataset register, semantic model measure sheet, numeric variance, threshold decisions, and role handoff artifacts. Trigger: the same issue has repeated across at least 3 recent runs or reviews: 17,602 of 18,134 tiles passed the check, variance 2.9%, with signal ''uncertified dataset use and mismatched dashboard totals''.',
  1,
  '["Data & AI","BI & Reporting Analytics","BI Asset Certification","Primary: Evidence. Supporting: Technical, Functional, Domain, Behavioural","certified BI asset control","semantic model dependency","measure lineage","refresh reliability","executive reporting risk","expected 18,134 vs actual 17,602 tiles","2.9% variance interpretation","threshold rule: 100% of executive tiles must use certified sources","trend evidence","control redesign","before/after comparison"]'::jsonb,
  '["Engage: Learner receives a workflow improvement case: executive sales performance review is at risk because only 17,602 of 18,134 tiles passed the control and uncertified dataset use and mismatched dashboard totals is visible","Explore: Learner reviews dashboard dependency list, certified dataset register, semantic model measure sheet, data refresh history, business owner approval note, highlights the fields that prove the issue, and notes which values cross the threshold","Explain: Learner studies certified BI asset control, semantic model dependency, measure lineage, refresh reliability and learns how these concepts explain the business risk, not just the technical error","Express: Learner prepares the BI Asset Certification Review Sheet with issue summary, numeric evidence, root-cause hypothesis, decision, and handoff note","Empower: Learner must propose a control change that reduces recurrence for executive sales performance review","Evolve: Learner defines a before/after measure to prove the workflow improvement reduced repeat failures"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Scenario: BI Asset Certification Review Sheet - Improvement Proposal
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-019' LIMIT 1)
   AND title = 'L4 Module: BI Asset Certification Workplace Mission' LIMIT 1),
  'Workplace Scenario: BI Asset Certification Review Sheet - Improvement Proposal',
  'An improvement review finds that executive sales performance review has repeated failures over the last 4 cycles, mainly linked to uncertified dataset use and mismatched dashboard totals. The expected volume is 18,134 tiles, but only 17,602 tiles are usable, creating a 2.9% variance against the control expectation. Regional sales total is 6.4% higher in the dashboard than the approved semantic model. The accepted rule is: 100% of executive tiles must use certified sources. The learner receives dashboard dependency list, certified dataset register, semantic model measure sheet, data refresh history, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the BI Asset Certification Review Sheet. The learner must study the trend, identify the control weakness, and propose a workflow improvement with before/after evidence. Pressure points: Executive sales performance review is time-sensitive; variance is 2.9% against the rule; regional sales total is 6.4% higher in the dashboard than the approved semantic model; the issue is recurring, rework hours are increasing, and the team needs a preventive control.',
  'Course trigger: the same issue has repeated across at least 3 recent runs or reviews: 17,602 of 18,134 tiles passed the check, variance 2.9%, with signal ''uncertified dataset use and mismatched dashboard totals''.
Problem statement: An improvement review finds that executive sales performance review has repeated failures over the last 4 cycles, mainly linked to uncertified dataset use and mismatched dashboard totals. The expected volume is 18,134 tiles, but only 17,602 tiles are usable, creating a 2.9% variance against the control expectation. Regional sales total is 6.4% higher in the dashboard than the approved semantic model. The accepted rule is: 100% of executive tiles must use certified sources. The learner receives dashboard dependency list, certified dataset register, semantic model measure sheet, data refresh history, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the BI Asset Certification Review Sheet. The learner must study the trend, identify the control weakness, and propose a workflow improvement with before/after evidence.
Major concepts: certified BI asset control; semantic model dependency; measure lineage; refresh reliability; executive reporting risk; expected 18,134 vs actual 17,602 tiles; 2.9% variance interpretation; threshold rule: 100% of executive tiles must use certified sources; trend evidence; control redesign; before/after comparison.
Root-cause focus: Find which repeated process weakness is causing: uncertified table usage, measure definition drift, refresh failure, manual filter override, or missing owner approval. Evidence must come from dashboard dependency list, certified dataset register, semantic model measure sheet.
Required data: dashboard dependency list; certified dataset register; semantic model measure sheet; data refresh history; business owner approval note; 4-cycle trend summary; rework-hours log; current workflow map
Artifact: BI Asset Certification Review Sheet - Improvement Proposal
Artifact structure: case summary; expected vs actual numbers; threshold rule; evidence table from dashboard dependency list, certified dataset register, semantic model measure sheet; root-cause hypothesis; decision/action; risk note; role handoff; recurring trend evidence; proposed process change; before/after success metric.
Evidence fields to assess: captures expected 18,134 and actual 17,602 tiles; calculates or explains 2.9% variance; uses threshold rule correctly (100% of executive tiles must use certified sources); cites at least three input documents; links evidence to root-cause hypothesis; states clear release/hold/correct/escalate decision; defines measurable improvement target; shows before/after control logic.
AI support tips: Use AI as a coach to ask evidence-checking questions, explain unfamiliar terms, compare possible root causes, and improve clarity. Do not use AI to invent numbers or make the decision without citing the provided documents.',
  1,
  '14 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Data Science - BI & Analytics Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-019' LIMIT 1),
  'B.Sc Data Science - BI & Analytics Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BBA Business Analytics - BI Reporting Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-019' LIMIT 1),
  'BBA Business Analytics - BI Reporting Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Com Analytics - Management Reporting Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-019' LIMIT 1),
  'B.Com Analytics - Management Reporting Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MBA Business Analytics - Decision Reporting Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-019' LIMIT 1),
  'MBA Business Analytics - Decision Reporting Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech CSE - Data Analytics Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-019' LIMIT 1),
  'B.Tech CSE - Data Analytics Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Improve the Decision Recommendation Production Workflow Using Evidence
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Improve the Decision Recommendation Production Workflow Using Evidence',
  'CRS-IND-CL-024',
  'By the end of this course, the learner can improve a recurring workflow in Decision Recommendation Production by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact. Workplace problem: An improvement review finds that warehouse staffing recommendation has repeated failures over the last 4 cycles, mainly linked to optimization output conflicts with capacity and cost constraints. The expected volume is 19,770 recommendations, but only 19,061 recommendations are usable, creating a 3.6% variance against the control expectation. Recommended overtime cost exceeds budget by ₹4.8 lakh and misses 11 high-priority fulfillment slots. The accepted rule is: recommendation constraint breaches must stay below 2%. The learner receives optimization scenario file, constraint register, cost-benefit worksheet, service-level target sheet, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Decision Recommendation Justification Note. The learner must study the trend, identify the control weakness, and propose a workflow improvement with before/after evidence. Artifact: Decision Recommendation Justification Note - Improvement Proposal.',
  '14 hours',
  'Active',
  'Decision Optimization & Business Insight',
  'technical',
  '["By the end of this course, the learner can improve a recurring workflow in Decision Recommendation Production by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact","Learner demonstrates Decision Recommendation Production by interpreting real-looking numbers, comparing evidence from optimization scenario file and constraint register, and producing a decision-ready artifact","Proves the learner can perform workflow improvement work in Decision Recommendation Production with numeric evidence, workplace documents, and a reviewer-ready artifact. Status: Demo Ready"]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L4 Module: Decision Recommendation Production Workplace Mission
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-024' LIMIT 1),
  'L4 Module: Decision Recommendation Production Workplace Mission',
  'Industry requirement: Teams responsible for an operations decision recommendation model need learners who can use numeric evidence, threshold rules, and workplace documents to make reliable decisions during warehouse staffing recommendation, not only explain Decision Recommendation Production theoretically. Gap addressed: Academic learning may cover the concepts behind Decision Recommendation Production, but it usually does not make learners practice with optimization scenario file, constraint register, cost-benefit worksheet, numeric variance, threshold decisions, and role handoff artifacts. Trigger: the same issue has repeated across at least 3 recent runs or reviews: 19,061 of 19,770 recommendations passed the check, variance 3.6%, with signal ''optimization output conflicts with capacity and cost constraints''.',
  1,
  '["Data & AI","Decision Optimization & Business Insight","Decision Recommendation Production","Primary: Evidence. Supporting: Technical, Functional, Domain, Behavioural","constraint feasibility","objective function trade-off","scenario comparison","cost-service impact","decision recommendation evidence","expected 19,770 vs actual 19,061 recommendations","3.6% variance interpretation","threshold rule: recommendation constraint breaches must stay below 2%","trend evidence","control redesign","before/after comparison"]'::jsonb,
  '["Engage: Learner receives a workflow improvement case: warehouse staffing recommendation is at risk because only 19,061 of 19,770 recommendations passed the control and optimization output conflicts with capacity and cost constraints is visible","Explore: Learner reviews optimization scenario file, constraint register, cost-benefit worksheet, service-level target sheet, manager decision request, highlights the fields that prove the issue, and notes which values cross the threshold","Explain: Learner studies constraint feasibility, objective function trade-off, scenario comparison, cost-service impact and learns how these concepts explain the business risk, not just the technical error","Express: Learner prepares the Decision Recommendation Justification Note with issue summary, numeric evidence, root-cause hypothesis, decision, and handoff note","Empower: Learner must propose a control change that reduces recurrence for warehouse staffing recommendation","Evolve: Learner defines a before/after measure to prove the workflow improvement reduced repeat failures"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Scenario: Decision Recommendation Justification Note - Improvement Proposal
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-024' LIMIT 1)
   AND title = 'L4 Module: Decision Recommendation Production Workplace Mission' LIMIT 1),
  'Workplace Scenario: Decision Recommendation Justification Note - Improvement Proposal',
  'An improvement review finds that warehouse staffing recommendation has repeated failures over the last 4 cycles, mainly linked to optimization output conflicts with capacity and cost constraints. The expected volume is 19,770 recommendations, but only 19,061 recommendations are usable, creating a 3.6% variance against the control expectation. Recommended overtime cost exceeds budget by ₹4.8 lakh and misses 11 high-priority fulfillment slots. The accepted rule is: recommendation constraint breaches must stay below 2%. The learner receives optimization scenario file, constraint register, cost-benefit worksheet, service-level target sheet, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Decision Recommendation Justification Note. The learner must study the trend, identify the control weakness, and propose a workflow improvement with before/after evidence. Pressure points: Warehouse staffing recommendation is time-sensitive; variance is 3.6% against the rule; recommended overtime cost exceeds budget by ₹4.8 lakh and misses 11 high-priority fulfillment slots; the issue is recurring, rework hours are increasing, and the team needs a preventive control.',
  'Course trigger: the same issue has repeated across at least 3 recent runs or reviews: 19,061 of 19,770 recommendations passed the check, variance 3.6%, with signal ''optimization output conflicts with capacity and cost constraints''.
Problem statement: An improvement review finds that warehouse staffing recommendation has repeated failures over the last 4 cycles, mainly linked to optimization output conflicts with capacity and cost constraints. The expected volume is 19,770 recommendations, but only 19,061 recommendations are usable, creating a 3.6% variance against the control expectation. Recommended overtime cost exceeds budget by ₹4.8 lakh and misses 11 high-priority fulfillment slots. The accepted rule is: recommendation constraint breaches must stay below 2%. The learner receives optimization scenario file, constraint register, cost-benefit worksheet, service-level target sheet, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Decision Recommendation Justification Note. The learner must study the trend, identify the control weakness, and propose a workflow improvement with before/after evidence.
Major concepts: constraint feasibility; objective function trade-off; scenario comparison; cost-service impact; decision recommendation evidence; expected 19,770 vs actual 19,061 recommendations; 3.6% variance interpretation; threshold rule: recommendation constraint breaches must stay below 2%; trend evidence; control redesign; before/after comparison.
Root-cause focus: Find which repeated process weakness is causing: missing constraint, wrong objective weight, outdated cost parameter, service-level trade-off, or infeasible scenario. Evidence must come from optimization scenario file, constraint register, cost-benefit worksheet.
Required data: optimization scenario file; constraint register; cost-benefit worksheet; service-level target sheet; manager decision request; 4-cycle trend summary; rework-hours log; current workflow map
Artifact: Decision Recommendation Justification Note - Improvement Proposal
Artifact structure: case summary; expected vs actual numbers; threshold rule; evidence table from optimization scenario file, constraint register, cost-benefit worksheet; root-cause hypothesis; decision/action; risk note; role handoff; recurring trend evidence; proposed process change; before/after success metric.
Evidence fields to assess: captures expected 19,770 and actual 19,061 recommendations; calculates or explains 3.6% variance; uses threshold rule correctly (recommendation constraint breaches must stay below 2%); cites at least three input documents; links evidence to root-cause hypothesis; states clear release/hold/correct/escalate decision; defines measurable improvement target; shows before/after control logic.
AI support tips: Use AI as a coach to ask evidence-checking questions, explain unfamiliar terms, compare possible root causes, and improve clarity. Do not use AI to invent numbers or make the decision without citing the provided documents.',
  1,
  '14 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Statistics / Data Science - Decision Analytics Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-024' LIMIT 1),
  'B.Sc Statistics / Data Science - Decision Analytics Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech Industrial Engineering / Operations Analytics Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-024' LIMIT 1),
  'B.Tech Industrial Engineering / Operations Analytics Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BBA Business Analytics - Decision Intelligence Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-024' LIMIT 1),
  'BBA Business Analytics - Decision Intelligence Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MBA Business Analytics - Optimization & Strategy Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-024' LIMIT 1),
  'MBA Business Analytics - Optimization & Strategy Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Sc Data Science - Optimization Analytics
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-024' LIMIT 1),
  'M.Sc Data Science - Optimization Analytics',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Data Science - Applied Modeling Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-024' LIMIT 1),
  'B.Sc Data Science - Applied Modeling Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Improve the Leakage-Safe Feature Dataset Build Workflow Using Evidence
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Improve the Leakage-Safe Feature Dataset Build Workflow Using Evidence',
  'CRS-IND-CL-029',
  'By the end of this course, the learner can improve a recurring workflow in Leakage-Safe Feature Dataset Build by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact. Workplace problem: An improvement review finds that model training cut-off review has repeated failures over the last 4 cycles, mainly linked to feature leakage risk and event-window mismatch. The expected volume is 270,820 rows, but only 231,290 rows are usable, creating a 14.6% variance against the control expectation. 18 features are populated after the churn label date and 9.2% of rows use future transactions. The accepted rule is: post-outcome features must be 0 before training release. The learner receives label definition sheet, feature lineage map, event-window extract, training data sample, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Leakage-Safe Feature Dataset Review Pack. The learner must study the trend, identify the control weakness, and propose a workflow improvement with before/after evidence. Artifact: Leakage-Safe Feature Dataset Review Pack - Improvement Proposal.',
  '14 hours',
  'Active',
  'Data Science & Statistical Modeling; Machine Learning, Deep Learning & NLP Engineering',
  'technical',
  '["By the end of this course, the learner can improve a recurring workflow in Leakage-Safe Feature Dataset Build by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact","Learner demonstrates Leakage-Safe Feature Dataset Build by interpreting real-looking numbers, comparing evidence from label definition sheet and feature lineage map, and producing a decision-ready artifact","Proves the learner can perform workflow improvement work in Leakage-Safe Feature Dataset Build with numeric evidence, workplace documents, and a reviewer-ready artifact. Status: Demo Ready"]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L4 Module: Leakage-Safe Feature Dataset Build Workplace Mission
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-029' LIMIT 1),
  'L4 Module: Leakage-Safe Feature Dataset Build Workplace Mission',
  'Industry requirement: Teams responsible for a churn prediction feature dataset need learners who can use numeric evidence, threshold rules, and workplace documents to make reliable decisions during model training cut-off review, not only explain Leakage-Safe Feature Dataset Build theoretically. Gap addressed: Academic learning may cover the concepts behind Leakage-Safe Feature Dataset Build, but it usually does not make learners practice with label definition sheet, feature lineage map, event-window extract, numeric variance, threshold decisions, and role handoff artifacts. Trigger: the same issue has repeated across at least 3 recent runs or reviews: 231,290 of 270,820 rows passed the check, variance 14.6%, with signal ''feature leakage risk and event-window mismatch''.',
  1,
  '["Data & AI","Data Science & Statistical Modeling","Machine Learning, Deep Learning & NLP Engineering","Leakage-Safe Feature Dataset Build","Primary: Evidence. Supporting: Technical, Functional, Domain, Behavioural","prediction target timing","feature availability cut-off","target leakage detection","event-window alignment","training data release control","expected 270,820 vs actual 231,290 rows","14.6% variance interpretation","threshold rule: post-outcome features must be 0 before training release","trend evidence","control redesign","before/after comparison"]'::jsonb,
  '["Engage: Learner receives a workflow improvement case: model training cut-off review is at risk because only 231,290 of 270,820 rows passed the control and feature leakage risk and event-window mismatch is visible","Explore: Learner reviews label definition sheet, feature lineage map, event-window extract, training data sample, leakage review checklist, highlights the fields that prove the issue, and notes which values cross the threshold","Explain: Learner studies prediction target timing, feature availability cut-off, target leakage detection, event-window alignment and learns how these concepts explain the business risk, not just the technical error","Express: Learner prepares the Leakage-Safe Feature Dataset Review Pack with issue summary, numeric evidence, root-cause hypothesis, decision, and handoff note","Empower: Learner must propose a control change that reduces recurrence for model training cut-off review","Evolve: Learner defines a before/after measure to prove the workflow improvement reduced repeat failures"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Scenario: Leakage-Safe Feature Dataset Review Pack - Improvement Proposal
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-029' LIMIT 1)
   AND title = 'L4 Module: Leakage-Safe Feature Dataset Build Workplace Mission' LIMIT 1),
  'Workplace Scenario: Leakage-Safe Feature Dataset Review Pack - Improvement Proposal',
  'An improvement review finds that model training cut-off review has repeated failures over the last 4 cycles, mainly linked to feature leakage risk and event-window mismatch. The expected volume is 270,820 rows, but only 231,290 rows are usable, creating a 14.6% variance against the control expectation. 18 features are populated after the churn label date and 9.2% of rows use future transactions. The accepted rule is: post-outcome features must be 0 before training release. The learner receives label definition sheet, feature lineage map, event-window extract, training data sample, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Leakage-Safe Feature Dataset Review Pack. The learner must study the trend, identify the control weakness, and propose a workflow improvement with before/after evidence. Pressure points: Model training cut-off review is time-sensitive; variance is 14.6% against the rule; 18 features are populated after the churn label date and 9.2% of rows use future transactions; the issue is recurring, rework hours are increasing, and the team needs a preventive control.',
  'Course trigger: the same issue has repeated across at least 3 recent runs or reviews: 231,290 of 270,820 rows passed the check, variance 14.6%, with signal ''feature leakage risk and event-window mismatch''.
Problem statement: An improvement review finds that model training cut-off review has repeated failures over the last 4 cycles, mainly linked to feature leakage risk and event-window mismatch. The expected volume is 270,820 rows, but only 231,290 rows are usable, creating a 14.6% variance against the control expectation. 18 features are populated after the churn label date and 9.2% of rows use future transactions. The accepted rule is: post-outcome features must be 0 before training release. The learner receives label definition sheet, feature lineage map, event-window extract, training data sample, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Leakage-Safe Feature Dataset Review Pack. The learner must study the trend, identify the control weakness, and propose a workflow improvement with before/after evidence.
Major concepts: prediction target timing; feature availability cut-off; target leakage detection; event-window alignment; training data release control; expected 270,820 vs actual 231,290 rows; 14.6% variance interpretation; threshold rule: post-outcome features must be 0 before training release; trend evidence; control redesign; before/after comparison.
Root-cause focus: Find which repeated process weakness is causing: future-dated transaction feature, wrong label cut-off, late feature backfill, target leakage, or unverified event window. Evidence must come from label definition sheet, feature lineage map, event-window extract.
Required data: label definition sheet; feature lineage map; event-window extract; training data sample; leakage review checklist; 4-cycle trend summary; rework-hours log; current workflow map
Artifact: Leakage-Safe Feature Dataset Review Pack - Improvement Proposal
Artifact structure: case summary; expected vs actual numbers; threshold rule; evidence table from label definition sheet, feature lineage map, event-window extract; root-cause hypothesis; decision/action; risk note; role handoff; recurring trend evidence; proposed process change; before/after success metric.
Evidence fields to assess: captures expected 270,820 and actual 231,290 rows; calculates or explains 14.6% variance; uses threshold rule correctly (post-outcome features must be 0 before training release); cites at least three input documents; links evidence to root-cause hypothesis; states clear release/hold/correct/escalate decision; defines measurable improvement target; shows before/after control logic.
AI support tips: Use AI as a coach to ask evidence-checking questions, explain unfamiliar terms, compare possible root causes, and improve clarity. Do not use AI to invent numbers or make the decision without citing the provided documents.',
  1,
  '14 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Data Science - Applied Modeling Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-029' LIMIT 1),
  'B.Sc Data Science - Applied Modeling Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Statistics - Data Science Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-029' LIMIT 1),
  'B.Sc Statistics - Data Science Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech AI & Data Science - Modeling Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-029' LIMIT 1),
  'B.Tech AI & Data Science - Modeling Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Sc Data Science - Applied Analytics Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-029' LIMIT 1),
  'M.Sc Data Science - Applied Analytics Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MCA - Data Science Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-029' LIMIT 1),
  'MCA - Data Science Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech CSE - AI & Machine Learning Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-029' LIMIT 1),
  'B.Tech CSE - AI & Machine Learning Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Improve the Experiment and Cohort Evaluation Workflow Using Evidence
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Improve the Experiment and Cohort Evaluation Workflow Using Evidence',
  'CRS-IND-CL-034',
  'By the end of this course, the learner can improve a recurring workflow in Experiment and Cohort Evaluation by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact. Workplace problem: An improvement review finds that pricing-page change decision has repeated failures over the last 4 cycles, mainly linked to cohort imbalance and weak significance evidence. The expected volume is 86,190 users, but only 75,530 users are usable, creating a 12.4% variance against the control expectation. Control has 52.8% of traffic instead of 50% and conversion lift is only 0.7% with p=0.09. The accepted rule is: minimum detectable effect and sample ratio mismatch must be within tolerance. The learner receives experiment design note, cohort assignment report, conversion result table, validity checklist, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Experiment Validity and Decision Evidence Pack. The learner must study the trend, identify the control weakness, and propose a workflow improvement with before/after evidence. Artifact: Experiment Validity and Decision Evidence Pack - Improvement Proposal.',
  '14 hours',
  'Active',
  'Data Science & Statistical Modeling',
  'technical',
  '["By the end of this course, the learner can improve a recurring workflow in Experiment and Cohort Evaluation by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact","Learner demonstrates Experiment and Cohort Evaluation by interpreting real-looking numbers, comparing evidence from experiment design note and cohort assignment report, and producing a decision-ready artifact","Proves the learner can perform workflow improvement work in Experiment and Cohort Evaluation with numeric evidence, workplace documents, and a reviewer-ready artifact. Status: Demo Ready"]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L4 Module: Experiment and Cohort Evaluation Workplace Mission
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-034' LIMIT 1),
  'L4 Module: Experiment and Cohort Evaluation Workplace Mission',
  'Industry requirement: Teams responsible for an A/B experiment result need learners who can use numeric evidence, threshold rules, and workplace documents to make reliable decisions during pricing-page change decision, not only explain Experiment and Cohort Evaluation theoretically. Gap addressed: Academic learning may cover the concepts behind Experiment and Cohort Evaluation, but it usually does not make learners practice with experiment design note, cohort assignment report, conversion result table, numeric variance, threshold decisions, and role handoff artifacts. Trigger: the same issue has repeated across at least 3 recent runs or reviews: 75,530 of 86,190 users passed the check, variance 12.4%, with signal ''cohort imbalance and weak significance evidence''.',
  1,
  '["Data & AI","Data Science & Statistical Modeling","Experiment and Cohort Evaluation","Primary: Evidence. Supporting: Technical, Functional, Domain, Behavioural","sample-ratio mismatch","statistical power","confidence interval","cohort validity","decision threshold","expected 86,190 vs actual 75,530 users","12.4% variance interpretation","threshold rule: minimum detectable effect and sample ratio mismatch must be within tolerance","trend evidence","control redesign","before/after comparison"]'::jsonb,
  '["Engage: Learner receives a workflow improvement case: pricing-page change decision is at risk because only 75,530 of 86,190 users passed the control and cohort imbalance and weak significance evidence is visible","Explore: Learner reviews experiment design note, cohort assignment report, conversion result table, validity checklist, product decision memo, highlights the fields that prove the issue, and notes which values cross the threshold","Explain: Learner studies sample-ratio mismatch, statistical power, confidence interval, cohort validity and learns how these concepts explain the business risk, not just the technical error","Express: Learner prepares the Experiment Validity and Decision Evidence Pack with issue summary, numeric evidence, root-cause hypothesis, decision, and handoff note","Empower: Learner must propose a control change that reduces recurrence for pricing-page change decision","Evolve: Learner defines a before/after measure to prove the workflow improvement reduced repeat failures"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Scenario: Experiment Validity and Decision Evidence Pack - Improvement Proposal
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-034' LIMIT 1)
   AND title = 'L4 Module: Experiment and Cohort Evaluation Workplace Mission' LIMIT 1),
  'Workplace Scenario: Experiment Validity and Decision Evidence Pack - Improvement Proposal',
  'An improvement review finds that pricing-page change decision has repeated failures over the last 4 cycles, mainly linked to cohort imbalance and weak significance evidence. The expected volume is 86,190 users, but only 75,530 users are usable, creating a 12.4% variance against the control expectation. Control has 52.8% of traffic instead of 50% and conversion lift is only 0.7% with p=0.09. The accepted rule is: minimum detectable effect and sample ratio mismatch must be within tolerance. The learner receives experiment design note, cohort assignment report, conversion result table, validity checklist, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Experiment Validity and Decision Evidence Pack. The learner must study the trend, identify the control weakness, and propose a workflow improvement with before/after evidence. Pressure points: Pricing-page change decision is time-sensitive; variance is 12.4% against the rule; control has 52.8% of traffic instead of 50% and conversion lift is only 0.7% with p=0.09; the issue is recurring, rework hours are increasing, and the team needs a preventive control.',
  'Course trigger: the same issue has repeated across at least 3 recent runs or reviews: 75,530 of 86,190 users passed the check, variance 12.4%, with signal ''cohort imbalance and weak significance evidence''.
Problem statement: An improvement review finds that pricing-page change decision has repeated failures over the last 4 cycles, mainly linked to cohort imbalance and weak significance evidence. The expected volume is 86,190 users, but only 75,530 users are usable, creating a 12.4% variance against the control expectation. Control has 52.8% of traffic instead of 50% and conversion lift is only 0.7% with p=0.09. The accepted rule is: minimum detectable effect and sample ratio mismatch must be within tolerance. The learner receives experiment design note, cohort assignment report, conversion result table, validity checklist, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Experiment Validity and Decision Evidence Pack. The learner must study the trend, identify the control weakness, and propose a workflow improvement with before/after evidence.
Major concepts: sample-ratio mismatch; statistical power; confidence interval; cohort validity; decision threshold; expected 86,190 vs actual 75,530 users; 12.4% variance interpretation; threshold rule: minimum detectable effect and sample ratio mismatch must be within tolerance; trend evidence; control redesign; before/after comparison.
Root-cause focus: Find which repeated process weakness is causing: sample-ratio mismatch, underpowered test, instrumentation gap, segment imbalance, or premature decision. Evidence must come from experiment design note, cohort assignment report, conversion result table.
Required data: experiment design note; cohort assignment report; conversion result table; validity checklist; product decision memo; 4-cycle trend summary; rework-hours log; current workflow map
Artifact: Experiment Validity and Decision Evidence Pack - Improvement Proposal
Artifact structure: case summary; expected vs actual numbers; threshold rule; evidence table from experiment design note, cohort assignment report, conversion result table; root-cause hypothesis; decision/action; risk note; role handoff; recurring trend evidence; proposed process change; before/after success metric.
Evidence fields to assess: captures expected 86,190 and actual 75,530 users; calculates or explains 12.4% variance; uses threshold rule correctly (minimum detectable effect and sample ratio mismatch must be within tolerance); cites at least three input documents; links evidence to root-cause hypothesis; states clear release/hold/correct/escalate decision; defines measurable improvement target; shows before/after control logic.
AI support tips: Use AI as a coach to ask evidence-checking questions, explain unfamiliar terms, compare possible root causes, and improve clarity. Do not use AI to invent numbers or make the decision without citing the provided documents.',
  1,
  '14 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Data Science - Applied Modeling Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-034' LIMIT 1),
  'B.Sc Data Science - Applied Modeling Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Statistics - Data Science Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-034' LIMIT 1),
  'B.Sc Statistics - Data Science Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech AI & Data Science - Modeling Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-034' LIMIT 1),
  'B.Tech AI & Data Science - Modeling Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Sc Data Science - Applied Analytics Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-034' LIMIT 1),
  'M.Sc Data Science - Applied Analytics Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MCA - Data Science Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-034' LIMIT 1),
  'MCA - Data Science Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Improve the Deep Learning Candidate Packaging Workflow Using Evidence
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Improve the Deep Learning Candidate Packaging Workflow Using Evidence',
  'CRS-IND-CL-039',
  'By the end of this course, the learner can improve a recurring workflow in Deep Learning Candidate Packaging by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact. Workplace problem: An improvement review finds that computer vision defect-detection release review has repeated failures over the last 4 cycles, mainly linked to training metric improvement but validation instability. The expected volume is 75,560 images, but only 66,770 images are usable, creating a 11.6% variance against the control expectation. Training F1 is 0.93 but validation F1 drops to 0.81 on low-light images. The accepted rule is: validation F1 must be above 0.86 and train-val gap below 5 points. The learner receives training run log, checkpoint metric table, validation error slice report, model card draft, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Deep Learning Candidate Packaging Review. The learner must study the trend, identify the control weakness, and propose a workflow improvement with before/after evidence. Artifact: Deep Learning Candidate Packaging Review - Improvement Proposal.',
  '14 hours',
  'Active',
  'Machine Learning, Deep Learning & NLP Engineering',
  'technical',
  '["By the end of this course, the learner can improve a recurring workflow in Deep Learning Candidate Packaging by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact","Learner demonstrates Deep Learning Candidate Packaging by interpreting real-looking numbers, comparing evidence from training run log and checkpoint metric table, and producing a decision-ready artifact","Proves the learner can perform workflow improvement work in Deep Learning Candidate Packaging with numeric evidence, workplace documents, and a reviewer-ready artifact. Status: Demo Ready"]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L4 Module: Deep Learning Candidate Packaging Workplace Mission
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-039' LIMIT 1),
  'L4 Module: Deep Learning Candidate Packaging Workplace Mission',
  'Industry requirement: Teams responsible for a deep learning model candidate need learners who can use numeric evidence, threshold rules, and workplace documents to make reliable decisions during computer vision defect-detection release review, not only explain Deep Learning Candidate Packaging theoretically. Gap addressed: Academic learning may cover the concepts behind Deep Learning Candidate Packaging, but it usually does not make learners practice with training run log, checkpoint metric table, validation error slice report, numeric variance, threshold decisions, and role handoff artifacts. Trigger: the same issue has repeated across at least 3 recent runs or reviews: 66,770 of 75,560 images passed the check, variance 11.6%, with signal ''training metric improvement but validation instability''.',
  1,
  '["Data & AI","Machine Learning, Deep Learning & NLP Engineering","Deep Learning Candidate Packaging","Primary: Evidence. Supporting: Technical, Functional, Domain, Behavioural","train-validation gap","checkpoint comparison","error slice analysis","model card evidence","release candidate packaging","expected 75,560 vs actual 66,770 images","11.6% variance interpretation","threshold rule: validation F1 must be above 0.86 and train-val gap below 5 points","trend evidence","control redesign","before/after comparison"]'::jsonb,
  '["Engage: Learner receives a workflow improvement case: computer vision defect-detection release review is at risk because only 66,770 of 75,560 images passed the control and training metric improvement but validation instability is visible","Explore: Learner reviews training run log, checkpoint metric table, validation error slice report, model card draft, release candidate request, highlights the fields that prove the issue, and notes which values cross the threshold","Explain: Learner studies train-validation gap, checkpoint comparison, error slice analysis, model card evidence and learns how these concepts explain the business risk, not just the technical error","Express: Learner prepares the Deep Learning Candidate Packaging Review with issue summary, numeric evidence, root-cause hypothesis, decision, and handoff note","Empower: Learner must propose a control change that reduces recurrence for computer vision defect-detection release review","Evolve: Learner defines a before/after measure to prove the workflow improvement reduced repeat failures"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Scenario: Deep Learning Candidate Packaging Review - Improvement Proposal
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-039' LIMIT 1)
   AND title = 'L4 Module: Deep Learning Candidate Packaging Workplace Mission' LIMIT 1),
  'Workplace Scenario: Deep Learning Candidate Packaging Review - Improvement Proposal',
  'An improvement review finds that computer vision defect-detection release review has repeated failures over the last 4 cycles, mainly linked to training metric improvement but validation instability. The expected volume is 75,560 images, but only 66,770 images are usable, creating a 11.6% variance against the control expectation. Training F1 is 0.93 but validation F1 drops to 0.81 on low-light images. The accepted rule is: validation F1 must be above 0.86 and train-val gap below 5 points. The learner receives training run log, checkpoint metric table, validation error slice report, model card draft, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Deep Learning Candidate Packaging Review. The learner must study the trend, identify the control weakness, and propose a workflow improvement with before/after evidence. Pressure points: Computer vision defect-detection release review is time-sensitive; variance is 11.6% against the rule; training F1 is 0.93 but validation F1 drops to 0.81 on low-light images; the issue is recurring, rework hours are increasing, and the team needs a preventive control.',
  'Course trigger: the same issue has repeated across at least 3 recent runs or reviews: 66,770 of 75,560 images passed the check, variance 11.6%, with signal ''training metric improvement but validation instability''.
Problem statement: An improvement review finds that computer vision defect-detection release review has repeated failures over the last 4 cycles, mainly linked to training metric improvement but validation instability. The expected volume is 75,560 images, but only 66,770 images are usable, creating a 11.6% variance against the control expectation. Training F1 is 0.93 but validation F1 drops to 0.81 on low-light images. The accepted rule is: validation F1 must be above 0.86 and train-val gap below 5 points. The learner receives training run log, checkpoint metric table, validation error slice report, model card draft, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Deep Learning Candidate Packaging Review. The learner must study the trend, identify the control weakness, and propose a workflow improvement with before/after evidence.
Major concepts: train-validation gap; checkpoint comparison; error slice analysis; model card evidence; release candidate packaging; expected 75,560 vs actual 66,770 images; 11.6% variance interpretation; threshold rule: validation F1 must be above 0.86 and train-val gap below 5 points; trend evidence; control redesign; before/after comparison.
Root-cause focus: Find which repeated process weakness is causing: overfitting, class imbalance, data augmentation mismatch, checkpoint selection error, or weak slice performance. Evidence must come from training run log, checkpoint metric table, validation error slice report.
Required data: training run log; checkpoint metric table; validation error slice report; model card draft; release candidate request; 4-cycle trend summary; rework-hours log; current workflow map
Artifact: Deep Learning Candidate Packaging Review - Improvement Proposal
Artifact structure: case summary; expected vs actual numbers; threshold rule; evidence table from training run log, checkpoint metric table, validation error slice report; root-cause hypothesis; decision/action; risk note; role handoff; recurring trend evidence; proposed process change; before/after success metric.
Evidence fields to assess: captures expected 75,560 and actual 66,770 images; calculates or explains 11.6% variance; uses threshold rule correctly (validation F1 must be above 0.86 and train-val gap below 5 points); cites at least three input documents; links evidence to root-cause hypothesis; states clear release/hold/correct/escalate decision; defines measurable improvement target; shows before/after control logic.
AI support tips: Use AI as a coach to ask evidence-checking questions, explain unfamiliar terms, compare possible root causes, and improve clarity. Do not use AI to invent numbers or make the decision without citing the provided documents.',
  1,
  '14 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech CSE - AI & Machine Learning Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-039' LIMIT 1),
  'B.Tech CSE - AI & Machine Learning Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech AI & Data Science - ML Engineering Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-039' LIMIT 1),
  'B.Tech AI & Data Science - ML Engineering Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Tech AI / Machine Learning Engineering
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-039' LIMIT 1),
  'M.Tech AI / Machine Learning Engineering',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Sc AI & Machine Learning
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-039' LIMIT 1),
  'M.Sc AI & Machine Learning',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MCA - AI / ML Application Development
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-039' LIMIT 1),
  'MCA - AI / ML Application Development',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Improve the NLP and LLM Evaluation Workflow Using Evidence
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Improve the NLP and LLM Evaluation Workflow Using Evidence',
  'CRS-IND-CL-044',
  'By the end of this course, the learner can improve a recurring workflow in NLP and LLM Evaluation by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact. Workplace problem: An improvement review finds that customer-support ticket routing release has repeated failures over the last 4 cycles, mainly linked to structured-output errors and label-schema mismatch. The expected volume is 28,730 prompts, but only 27,035 prompts are usable, creating a 5.9% variance against the control expectation. 12.4% of outputs fail the required JSON schema and refund-intent labels are confused with complaint-intent. The accepted rule is: JSON validity must exceed 98% and critical label errors below 1%. The learner receives prompt set, LLM evaluation result table, label schema definition, failure examples, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the NLP/LLM Evaluation Failure Analysis Pack. The learner must study the trend, identify the control weakness, and propose a workflow improvement with before/after evidence. Artifact: NLP/LLM Evaluation Failure Analysis Pack - Improvement Proposal.',
  '14 hours',
  'Active',
  'Machine Learning, Deep Learning & NLP Engineering; AI Product & GenAI Application Development',
  'technical',
  '["By the end of this course, the learner can improve a recurring workflow in NLP and LLM Evaluation by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact","Learner demonstrates NLP and LLM Evaluation by interpreting real-looking numbers, comparing evidence from prompt set and LLM evaluation result table, and producing a decision-ready artifact","Proves the learner can perform workflow improvement work in NLP and LLM Evaluation with numeric evidence, workplace documents, and a reviewer-ready artifact. Status: Demo Ready"]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L4 Module: NLP and LLM Evaluation Workplace Mission
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-044' LIMIT 1),
  'L4 Module: NLP and LLM Evaluation Workplace Mission',
  'Industry requirement: Teams responsible for an LLM extraction feature need learners who can use numeric evidence, threshold rules, and workplace documents to make reliable decisions during customer-support ticket routing release, not only explain NLP and LLM Evaluation theoretically. Gap addressed: Academic learning may cover the concepts behind NLP and LLM Evaluation, but it usually does not make learners practice with prompt set, LLM evaluation result table, label schema definition, numeric variance, threshold decisions, and role handoff artifacts. Trigger: the same issue has repeated across at least 3 recent runs or reviews: 27,035 of 28,730 prompts passed the check, variance 5.9%, with signal ''structured-output errors and label-schema mismatch''.',
  1,
  '["Data & AI","Machine Learning, Deep Learning & NLP Engineering","AI Product & GenAI Application Development","NLP and LLM Evaluation","Primary: Evidence. Supporting: Technical, Functional, Domain, Behavioural","structured-output validation","label-schema compliance","confusion matrix review","prompt failure pattern","downstream routing risk","expected 28,730 vs actual 27,035 prompts","5.9% variance interpretation","threshold rule: JSON validity must exceed 98% and critical label errors below 1%","trend evidence","control redesign","before/after comparison"]'::jsonb,
  '["Engage: Learner receives a workflow improvement case: customer-support ticket routing release is at risk because only 27,035 of 28,730 prompts passed the control and structured-output errors and label-schema mismatch is visible","Explore: Learner reviews prompt set, LLM evaluation result table, label schema definition, failure examples, routing product requirement, highlights the fields that prove the issue, and notes which values cross the threshold","Explain: Learner studies structured-output validation, label-schema compliance, confusion matrix review, prompt failure pattern and learns how these concepts explain the business risk, not just the technical error","Express: Learner prepares the NLP/LLM Evaluation Failure Analysis Pack with issue summary, numeric evidence, root-cause hypothesis, decision, and handoff note","Empower: Learner must propose a control change that reduces recurrence for customer-support ticket routing release","Evolve: Learner defines a before/after measure to prove the workflow improvement reduced repeat failures"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Scenario: NLP/LLM Evaluation Failure Analysis Pack - Improvement Proposal
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-044' LIMIT 1)
   AND title = 'L4 Module: NLP and LLM Evaluation Workplace Mission' LIMIT 1),
  'Workplace Scenario: NLP/LLM Evaluation Failure Analysis Pack - Improvement Proposal',
  'An improvement review finds that customer-support ticket routing release has repeated failures over the last 4 cycles, mainly linked to structured-output errors and label-schema mismatch. The expected volume is 28,730 prompts, but only 27,035 prompts are usable, creating a 5.9% variance against the control expectation. 12.4% of outputs fail the required JSON schema and refund-intent labels are confused with complaint-intent. The accepted rule is: JSON validity must exceed 98% and critical label errors below 1%. The learner receives prompt set, LLM evaluation result table, label schema definition, failure examples, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the NLP/LLM Evaluation Failure Analysis Pack. The learner must study the trend, identify the control weakness, and propose a workflow improvement with before/after evidence. Pressure points: Customer-support ticket routing release is time-sensitive; variance is 5.9% against the rule; 12.4% of outputs fail the required JSON schema and refund-intent labels are confused with complaint-intent; the issue is recurring, rework hours are increasing, and the team needs a preventive control.',
  'Course trigger: the same issue has repeated across at least 3 recent runs or reviews: 27,035 of 28,730 prompts passed the check, variance 5.9%, with signal ''structured-output errors and label-schema mismatch''.
Problem statement: An improvement review finds that customer-support ticket routing release has repeated failures over the last 4 cycles, mainly linked to structured-output errors and label-schema mismatch. The expected volume is 28,730 prompts, but only 27,035 prompts are usable, creating a 5.9% variance against the control expectation. 12.4% of outputs fail the required JSON schema and refund-intent labels are confused with complaint-intent. The accepted rule is: JSON validity must exceed 98% and critical label errors below 1%. The learner receives prompt set, LLM evaluation result table, label schema definition, failure examples, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the NLP/LLM Evaluation Failure Analysis Pack. The learner must study the trend, identify the control weakness, and propose a workflow improvement with before/after evidence.
Major concepts: structured-output validation; label-schema compliance; confusion matrix review; prompt failure pattern; downstream routing risk; expected 28,730 vs actual 27,035 prompts; 5.9% variance interpretation; threshold rule: JSON validity must exceed 98% and critical label errors below 1%; trend evidence; control redesign; before/after comparison.
Root-cause focus: Find which repeated process weakness is causing: ambiguous labels, prompt instruction weakness, schema constraint failure, retrieval context noise, or unsupported edge cases. Evidence must come from prompt set, LLM evaluation result table, label schema definition.
Required data: prompt set; LLM evaluation result table; label schema definition; failure examples; routing product requirement; 4-cycle trend summary; rework-hours log; current workflow map
Artifact: NLP/LLM Evaluation Failure Analysis Pack - Improvement Proposal
Artifact structure: case summary; expected vs actual numbers; threshold rule; evidence table from prompt set, LLM evaluation result table, label schema definition; root-cause hypothesis; decision/action; risk note; role handoff; recurring trend evidence; proposed process change; before/after success metric.
Evidence fields to assess: captures expected 28,730 and actual 27,035 prompts; calculates or explains 5.9% variance; uses threshold rule correctly (JSON validity must exceed 98% and critical label errors below 1%); cites at least three input documents; links evidence to root-cause hypothesis; states clear release/hold/correct/escalate decision; defines measurable improvement target; shows before/after control logic.
AI support tips: Use AI as a coach to ask evidence-checking questions, explain unfamiliar terms, compare possible root causes, and improve clarity. Do not use AI to invent numbers or make the decision without citing the provided documents.',
  1,
  '14 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech CSE - AI & Machine Learning Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-044' LIMIT 1),
  'B.Tech CSE - AI & Machine Learning Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech AI & Data Science - ML Engineering Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-044' LIMIT 1),
  'B.Tech AI & Data Science - ML Engineering Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Tech AI / Machine Learning Engineering
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-044' LIMIT 1),
  'M.Tech AI / Machine Learning Engineering',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Sc AI & Machine Learning
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-044' LIMIT 1),
  'M.Sc AI & Machine Learning',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MCA - AI / ML Application Development
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-044' LIMIT 1),
  'MCA - AI / ML Application Development',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech CSE - AI Product Engineering Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-044' LIMIT 1),
  'B.Tech CSE - AI Product Engineering Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Improve the Canary Model Release Operation Workflow Using Evidence
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Improve the Canary Model Release Operation Workflow Using Evidence',
  'CRS-IND-CL-049',
  'By the end of this course, the learner can improve a recurring workflow in Canary Model Release Operation by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact. Workplace problem: An improvement review finds that fraud model production rollout has repeated failures over the last 4 cycles, mainly linked to canary traffic metrics breach release guardrail. The expected volume is 151,300 transactions, but only 131,875 transactions are usable, creating a 12.8% variance against the control expectation. Canary false positives increased by 3.7 points and p95 latency moved from 180 ms to 310 ms. The accepted rule is: canary false-positive increase must stay below 2 points. The learner receives release checklist, canary metric dashboard, rollback decision log, model version registry, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Canary Model Release Decision Record. The learner must study the trend, identify the control weakness, and propose a workflow improvement with before/after evidence. Artifact: Canary Model Release Decision Record - Improvement Proposal.',
  '14 hours',
  'Active',
  'MLOps & AI Platform Operations',
  'technical',
  '["By the end of this course, the learner can improve a recurring workflow in Canary Model Release Operation by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact","Learner demonstrates Canary Model Release Operation by interpreting real-looking numbers, comparing evidence from release checklist and canary metric dashboard, and producing a decision-ready artifact","Proves the learner can perform workflow improvement work in Canary Model Release Operation with numeric evidence, workplace documents, and a reviewer-ready artifact. Status: Demo Ready"]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L4 Module: Canary Model Release Operation Workplace Mission
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-049' LIMIT 1),
  'L4 Module: Canary Model Release Operation Workplace Mission',
  'Industry requirement: Teams responsible for a canary model release need learners who can use numeric evidence, threshold rules, and workplace documents to make reliable decisions during fraud model production rollout, not only explain Canary Model Release Operation theoretically. Gap addressed: Academic learning may cover the concepts behind Canary Model Release Operation, but it usually does not make learners practice with release checklist, canary metric dashboard, rollback decision log, numeric variance, threshold decisions, and role handoff artifacts. Trigger: the same issue has repeated across at least 3 recent runs or reviews: 131,875 of 151,300 transactions passed the check, variance 12.8%, with signal ''canary traffic metrics breach release guardrail''.',
  1,
  '["Data & AI","MLOps & AI Platform Operations","Canary Model Release Operation","Primary: Evidence. Supporting: Technical, Functional, Domain, Behavioural","canary traffic split","release guardrails","rollback threshold","latency monitoring","model version control","expected 151,300 vs actual 131,875 transactions","12.8% variance interpretation","threshold rule: canary false-positive increase must stay below 2 points","trend evidence","control redesign","before/after comparison"]'::jsonb,
  '["Engage: Learner receives a workflow improvement case: fraud model production rollout is at risk because only 131,875 of 151,300 transactions passed the control and canary traffic metrics breach release guardrail is visible","Explore: Learner reviews release checklist, canary metric dashboard, rollback decision log, model version registry, incident communication draft, highlights the fields that prove the issue, and notes which values cross the threshold","Explain: Learner studies canary traffic split, release guardrails, rollback threshold, latency monitoring and learns how these concepts explain the business risk, not just the technical error","Express: Learner prepares the Canary Model Release Decision Record with issue summary, numeric evidence, root-cause hypothesis, decision, and handoff note","Empower: Learner must propose a control change that reduces recurrence for fraud model production rollout","Evolve: Learner defines a before/after measure to prove the workflow improvement reduced repeat failures"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Scenario: Canary Model Release Decision Record - Improvement Proposal
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-049' LIMIT 1)
   AND title = 'L4 Module: Canary Model Release Operation Workplace Mission' LIMIT 1),
  'Workplace Scenario: Canary Model Release Decision Record - Improvement Proposal',
  'An improvement review finds that fraud model production rollout has repeated failures over the last 4 cycles, mainly linked to canary traffic metrics breach release guardrail. The expected volume is 151,300 transactions, but only 131,875 transactions are usable, creating a 12.8% variance against the control expectation. Canary false positives increased by 3.7 points and p95 latency moved from 180 ms to 310 ms. The accepted rule is: canary false-positive increase must stay below 2 points. The learner receives release checklist, canary metric dashboard, rollback decision log, model version registry, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Canary Model Release Decision Record. The learner must study the trend, identify the control weakness, and propose a workflow improvement with before/after evidence. Pressure points: Fraud model production rollout is time-sensitive; variance is 12.8% against the rule; canary false positives increased by 3.7 points and p95 latency moved from 180 ms to 310 ms; the issue is recurring, rework hours are increasing, and the team needs a preventive control.',
  'Course trigger: the same issue has repeated across at least 3 recent runs or reviews: 131,875 of 151,300 transactions passed the check, variance 12.8%, with signal ''canary traffic metrics breach release guardrail''.
Problem statement: An improvement review finds that fraud model production rollout has repeated failures over the last 4 cycles, mainly linked to canary traffic metrics breach release guardrail. The expected volume is 151,300 transactions, but only 131,875 transactions are usable, creating a 12.8% variance against the control expectation. Canary false positives increased by 3.7 points and p95 latency moved from 180 ms to 310 ms. The accepted rule is: canary false-positive increase must stay below 2 points. The learner receives release checklist, canary metric dashboard, rollback decision log, model version registry, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Canary Model Release Decision Record. The learner must study the trend, identify the control weakness, and propose a workflow improvement with before/after evidence.
Major concepts: canary traffic split; release guardrails; rollback threshold; latency monitoring; model version control; expected 151,300 vs actual 131,875 transactions; 12.8% variance interpretation; threshold rule: canary false-positive increase must stay below 2 points; trend evidence; control redesign; before/after comparison.
Root-cause focus: Find which repeated process weakness is causing: model threshold mismatch, feature parity issue, latency regression, bad canary split, or rollback criteria not met. Evidence must come from release checklist, canary metric dashboard, rollback decision log.
Required data: release checklist; canary metric dashboard; rollback decision log; model version registry; incident communication draft; 4-cycle trend summary; rework-hours log; current workflow map
Artifact: Canary Model Release Decision Record - Improvement Proposal
Artifact structure: case summary; expected vs actual numbers; threshold rule; evidence table from release checklist, canary metric dashboard, rollback decision log; root-cause hypothesis; decision/action; risk note; role handoff; recurring trend evidence; proposed process change; before/after success metric.
Evidence fields to assess: captures expected 151,300 and actual 131,875 transactions; calculates or explains 12.8% variance; uses threshold rule correctly (canary false-positive increase must stay below 2 points); cites at least three input documents; links evidence to root-cause hypothesis; states clear release/hold/correct/escalate decision; defines measurable improvement target; shows before/after control logic.
AI support tips: Use AI as a coach to ask evidence-checking questions, explain unfamiliar terms, compare possible root causes, and improve clarity. Do not use AI to invent numbers or make the decision without citing the provided documents.',
  1,
  '14 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech CSE - AI & Machine Learning Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-049' LIMIT 1),
  'B.Tech CSE - AI & Machine Learning Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech AI & Data Science - ML Engineering Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-049' LIMIT 1),
  'B.Tech AI & Data Science - ML Engineering Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Tech AI / Machine Learning Engineering
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-049' LIMIT 1),
  'M.Tech AI / Machine Learning Engineering',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Sc AI & Machine Learning
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-049' LIMIT 1),
  'M.Sc AI & Machine Learning',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MCA - AI / ML Application Development
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-049' LIMIT 1),
  'MCA - AI / ML Application Development',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech CSE - Cloud AI / MLOps Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-049' LIMIT 1),
  'B.Tech CSE - Cloud AI / MLOps Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Improve the Model Drift Response Workflow Using Evidence
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Improve the Model Drift Response Workflow Using Evidence',
  'CRS-IND-CL-054',
  'By the end of this course, the learner can improve a recurring workflow in Model Drift Response by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact. Workplace problem: An improvement review finds that monthly drift alert review has repeated failures over the last 4 cycles, mainly linked to feature-skew and segment-level performance drift. The expected volume is 237,670 predictions, but only 202,490 predictions are usable, creating a 14.8% variance against the control expectation. Income_band PSI is 0.31 and AUC for new-to-credit users dropped from 0.78 to 0.71. The accepted rule is: PSI above 0.20 or AUC drop above 3 points requires triage. The learner receives drift alert log, feature-skew diagnostic sheet, production prediction sample, threshold decision record, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Model Drift Response Triage Pack. The learner must study the trend, identify the control weakness, and propose a workflow improvement with before/after evidence. Artifact: Model Drift Response Triage Pack - Improvement Proposal.',
  '14 hours',
  'Active',
  'MLOps & AI Platform Operations; Data Platform Engineering',
  'technical',
  '["By the end of this course, the learner can improve a recurring workflow in Model Drift Response by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact","Learner demonstrates Model Drift Response by interpreting real-looking numbers, comparing evidence from drift alert log and feature-skew diagnostic sheet, and producing a decision-ready artifact","Proves the learner can perform workflow improvement work in Model Drift Response with numeric evidence, workplace documents, and a reviewer-ready artifact. Status: Pilot Ready — Evidence Strengthening Needed"]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L4 Module: Model Drift Response Workplace Mission
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-054' LIMIT 1),
  'L4 Module: Model Drift Response Workplace Mission',
  'Industry requirement: Teams responsible for a production credit-risk model need learners who can use numeric evidence, threshold rules, and workplace documents to make reliable decisions during monthly drift alert review, not only explain Model Drift Response theoretically. Gap addressed: Academic learning may cover the concepts behind Model Drift Response, but it usually does not make learners practice with drift alert log, feature-skew diagnostic sheet, production prediction sample, numeric variance, threshold decisions, and role handoff artifacts. Trigger: the same issue has repeated across at least 3 recent runs or reviews: 202,490 of 237,670 predictions passed the check, variance 14.8%, with signal ''feature-skew and segment-level performance drift''.',
  1,
  '["Data & AI","MLOps & AI Platform Operations","Data Platform Engineering","Model Drift Response","Primary: Evidence. Supporting: Technical, Functional, Domain, Behavioural","population stability index","segment-level drift","feature-skew evidence","AUC degradation","retrain versus monitor decision","expected 237,670 vs actual 202,490 predictions","14.8% variance interpretation","threshold rule: PSI above 0.20 or AUC drop above 3 points requires triage","trend evidence","control redesign","before/after comparison"]'::jsonb,
  '["Engage: Learner receives a workflow improvement case: monthly drift alert review is at risk because only 202,490 of 237,670 predictions passed the control and feature-skew and segment-level performance drift is visible","Explore: Learner reviews drift alert log, feature-skew diagnostic sheet, production prediction sample, threshold decision record, previous retraining note, highlights the fields that prove the issue, and notes which values cross the threshold","Explain: Learner studies population stability index, segment-level drift, feature-skew evidence, AUC degradation and learns how these concepts explain the business risk, not just the technical error","Express: Learner prepares the Model Drift Response Triage Pack with issue summary, numeric evidence, root-cause hypothesis, decision, and handoff note","Empower: Learner must propose a control change that reduces recurrence for monthly drift alert review","Evolve: Learner defines a before/after measure to prove the workflow improvement reduced repeat failures"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Scenario: Model Drift Response Triage Pack - Improvement Proposal
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-054' LIMIT 1)
   AND title = 'L4 Module: Model Drift Response Workplace Mission' LIMIT 1),
  'Workplace Scenario: Model Drift Response Triage Pack - Improvement Proposal',
  'An improvement review finds that monthly drift alert review has repeated failures over the last 4 cycles, mainly linked to feature-skew and segment-level performance drift. The expected volume is 237,670 predictions, but only 202,490 predictions are usable, creating a 14.8% variance against the control expectation. Income_band PSI is 0.31 and AUC for new-to-credit users dropped from 0.78 to 0.71. The accepted rule is: PSI above 0.20 or AUC drop above 3 points requires triage. The learner receives drift alert log, feature-skew diagnostic sheet, production prediction sample, threshold decision record, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Model Drift Response Triage Pack. The learner must study the trend, identify the control weakness, and propose a workflow improvement with before/after evidence. Pressure points: Monthly drift alert review is time-sensitive; variance is 14.8% against the rule; income_band PSI is 0.31 and AUC for new-to-credit users dropped from 0.78 to 0.71; the issue is recurring, rework hours are increasing, and the team needs a preventive control.',
  'Course trigger: the same issue has repeated across at least 3 recent runs or reviews: 202,490 of 237,670 predictions passed the check, variance 14.8%, with signal ''feature-skew and segment-level performance drift''.
Problem statement: An improvement review finds that monthly drift alert review has repeated failures over the last 4 cycles, mainly linked to feature-skew and segment-level performance drift. The expected volume is 237,670 predictions, but only 202,490 predictions are usable, creating a 14.8% variance against the control expectation. Income_band PSI is 0.31 and AUC for new-to-credit users dropped from 0.78 to 0.71. The accepted rule is: PSI above 0.20 or AUC drop above 3 points requires triage. The learner receives drift alert log, feature-skew diagnostic sheet, production prediction sample, threshold decision record, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Model Drift Response Triage Pack. The learner must study the trend, identify the control weakness, and propose a workflow improvement with before/after evidence.
Major concepts: population stability index; segment-level drift; feature-skew evidence; AUC degradation; retrain versus monitor decision; expected 237,670 vs actual 202,490 predictions; 14.8% variance interpretation; threshold rule: PSI above 0.20 or AUC drop above 3 points requires triage; trend evidence; control redesign; before/after comparison.
Root-cause focus: Find which repeated process weakness is causing: population shift, feature pipeline change, model degradation, threshold misconfiguration, or seasonal behavior change. Evidence must come from drift alert log, feature-skew diagnostic sheet, production prediction sample.
Required data: drift alert log; feature-skew diagnostic sheet; production prediction sample; threshold decision record; previous retraining note; 4-cycle trend summary; rework-hours log; current workflow map
Artifact: Model Drift Response Triage Pack - Improvement Proposal
Artifact structure: case summary; expected vs actual numbers; threshold rule; evidence table from drift alert log, feature-skew diagnostic sheet, production prediction sample; root-cause hypothesis; decision/action; risk note; role handoff; recurring trend evidence; proposed process change; before/after success metric.
Evidence fields to assess: captures expected 237,670 and actual 202,490 predictions; calculates or explains 14.8% variance; uses threshold rule correctly (PSI above 0.20 or AUC drop above 3 points requires triage); cites at least three input documents; links evidence to root-cause hypothesis; states clear release/hold/correct/escalate decision; defines measurable improvement target; shows before/after control logic.
AI support tips: Use AI as a coach to ask evidence-checking questions, explain unfamiliar terms, compare possible root causes, and improve clarity. Do not use AI to invent numbers or make the decision without citing the provided documents.',
  1,
  '14 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech CSE - Data Engineering Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-054' LIMIT 1),
  'B.Tech CSE - Data Engineering Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech AI & Data Science - Data Platform Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-054' LIMIT 1),
  'B.Tech AI & Data Science - Data Platform Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Data Science - Data Engineering Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-054' LIMIT 1),
  'B.Sc Data Science - Data Engineering Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MCA - Data Engineering / Cloud Data Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-054' LIMIT 1),
  'MCA - Data Engineering / Cloud Data Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Tech Data Engineering / Big Data Systems
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-054' LIMIT 1),
  'M.Tech Data Engineering / Big Data Systems',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech CSE - AI & Machine Learning Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-054' LIMIT 1),
  'B.Tech CSE - AI & Machine Learning Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Improve the Edge AI Anomaly Actioning Workflow Using Evidence
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Improve the Edge AI Anomaly Actioning Workflow Using Evidence',
  'CRS-IND-CL-059',
  'By the end of this course, the learner can improve a recurring workflow in Edge AI Anomaly Actioning by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact. Workplace problem: An improvement review finds that factory anomaly alert response has repeated failures over the last 4 cycles, mainly linked to device inference anomaly and sensor packet loss. The expected volume is 117,040 readings, but only 103,480 readings are usable, creating a 11.6% variance against the control expectation. Motor vibration anomaly score reached 0.91 while 6.5% of temperature packets were missing. The accepted rule is: packet loss above 4% or anomaly score above 0.82 requires action. The learner receives edge device alert log, sensor packet summary, local inference score sheet, maintenance history note, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Edge AI Anomaly Action Record. The learner must study the trend, identify the control weakness, and propose a workflow improvement with before/after evidence. Artifact: Edge AI Anomaly Action Record - Improvement Proposal.',
  '14 hours',
  'Active',
  'Cloud, Edge, IoT & Autonomous AI Systems',
  'technical',
  '["By the end of this course, the learner can improve a recurring workflow in Edge AI Anomaly Actioning by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact","Learner demonstrates Edge AI Anomaly Actioning by interpreting real-looking numbers, comparing evidence from edge device alert log and sensor packet summary, and producing a decision-ready artifact","Proves the learner can perform workflow improvement work in Edge AI Anomaly Actioning with numeric evidence, workplace documents, and a reviewer-ready artifact. Status: Pilot Ready — Evidence Strengthening Needed"]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L4 Module: Edge AI Anomaly Actioning Workplace Mission
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-059' LIMIT 1),
  'L4 Module: Edge AI Anomaly Actioning Workplace Mission',
  'Industry requirement: Teams responsible for an edge AI predictive-maintenance device need learners who can use numeric evidence, threshold rules, and workplace documents to make reliable decisions during factory anomaly alert response, not only explain Edge AI Anomaly Actioning theoretically. Gap addressed: Academic learning may cover the concepts behind Edge AI Anomaly Actioning, but it usually does not make learners practice with edge device alert log, sensor packet summary, local inference score sheet, numeric variance, threshold decisions, and role handoff artifacts. Trigger: the same issue has repeated across at least 3 recent runs or reviews: 103,480 of 117,040 readings passed the check, variance 11.6%, with signal ''device inference anomaly and sensor packet loss''.',
  1,
  '["Data & AI","Cloud, Edge, IoT & Autonomous AI Systems","Edge AI Anomaly Actioning","Primary: Evidence. Supporting: Technical, Functional, Domain, Behavioural","edge inference score","sensor packet loss","local-versus-cloud decision","field maintenance escalation","false alert control","expected 117,040 vs actual 103,480 readings","11.6% variance interpretation","threshold rule: packet loss above 4% or anomaly score above 0.82 requires action","trend evidence","control redesign","before/after comparison"]'::jsonb,
  '["Engage: Learner receives a workflow improvement case: factory anomaly alert response is at risk because only 103,480 of 117,040 readings passed the control and device inference anomaly and sensor packet loss is visible","Explore: Learner reviews edge device alert log, sensor packet summary, local inference score sheet, maintenance history note, field action ticket, highlights the fields that prove the issue, and notes which values cross the threshold","Explain: Learner studies edge inference score, sensor packet loss, local-versus-cloud decision, field maintenance escalation and learns how these concepts explain the business risk, not just the technical error","Express: Learner prepares the Edge AI Anomaly Action Record with issue summary, numeric evidence, root-cause hypothesis, decision, and handoff note","Empower: Learner must propose a control change that reduces recurrence for factory anomaly alert response","Evolve: Learner defines a before/after measure to prove the workflow improvement reduced repeat failures"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Scenario: Edge AI Anomaly Action Record - Improvement Proposal
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-059' LIMIT 1)
   AND title = 'L4 Module: Edge AI Anomaly Actioning Workplace Mission' LIMIT 1),
  'Workplace Scenario: Edge AI Anomaly Action Record - Improvement Proposal',
  'An improvement review finds that factory anomaly alert response has repeated failures over the last 4 cycles, mainly linked to device inference anomaly and sensor packet loss. The expected volume is 117,040 readings, but only 103,480 readings are usable, creating a 11.6% variance against the control expectation. Motor vibration anomaly score reached 0.91 while 6.5% of temperature packets were missing. The accepted rule is: packet loss above 4% or anomaly score above 0.82 requires action. The learner receives edge device alert log, sensor packet summary, local inference score sheet, maintenance history note, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Edge AI Anomaly Action Record. The learner must study the trend, identify the control weakness, and propose a workflow improvement with before/after evidence. Pressure points: Factory anomaly alert response is time-sensitive; variance is 11.6% against the rule; motor vibration anomaly score reached 0.91 while 6.5% of temperature packets were missing; the issue is recurring, rework hours are increasing, and the team needs a preventive control.',
  'Course trigger: the same issue has repeated across at least 3 recent runs or reviews: 103,480 of 117,040 readings passed the check, variance 11.6%, with signal ''device inference anomaly and sensor packet loss''.
Problem statement: An improvement review finds that factory anomaly alert response has repeated failures over the last 4 cycles, mainly linked to device inference anomaly and sensor packet loss. The expected volume is 117,040 readings, but only 103,480 readings are usable, creating a 11.6% variance against the control expectation. Motor vibration anomaly score reached 0.91 while 6.5% of temperature packets were missing. The accepted rule is: packet loss above 4% or anomaly score above 0.82 requires action. The learner receives edge device alert log, sensor packet summary, local inference score sheet, maintenance history note, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Edge AI Anomaly Action Record. The learner must study the trend, identify the control weakness, and propose a workflow improvement with before/after evidence.
Major concepts: edge inference score; sensor packet loss; local-versus-cloud decision; field maintenance escalation; false alert control; expected 117,040 vs actual 103,480 readings; 11.6% variance interpretation; threshold rule: packet loss above 4% or anomaly score above 0.82 requires action; trend evidence; control redesign; before/after comparison.
Root-cause focus: Find which repeated process weakness is causing: sensor failure, model edge-version mismatch, device network loss, actual equipment anomaly, or threshold calibration issue. Evidence must come from edge device alert log, sensor packet summary, local inference score sheet.
Required data: edge device alert log; sensor packet summary; local inference score sheet; maintenance history note; field action ticket; 4-cycle trend summary; rework-hours log; current workflow map
Artifact: Edge AI Anomaly Action Record - Improvement Proposal
Artifact structure: case summary; expected vs actual numbers; threshold rule; evidence table from edge device alert log, sensor packet summary, local inference score sheet; root-cause hypothesis; decision/action; risk note; role handoff; recurring trend evidence; proposed process change; before/after success metric.
Evidence fields to assess: captures expected 117,040 and actual 103,480 readings; calculates or explains 11.6% variance; uses threshold rule correctly (packet loss above 4% or anomaly score above 0.82 requires action); cites at least three input documents; links evidence to root-cause hypothesis; states clear release/hold/correct/escalate decision; defines measurable improvement target; shows before/after control logic.
AI support tips: Use AI as a coach to ask evidence-checking questions, explain unfamiliar terms, compare possible root causes, and improve clarity. Do not use AI to invent numbers or make the decision without citing the provided documents.',
  1,
  '14 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech CSE - Data Engineering Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-059' LIMIT 1),
  'B.Tech CSE - Data Engineering Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech AI & Data Science - Data Platform Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-059' LIMIT 1),
  'B.Tech AI & Data Science - Data Platform Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Data Science - Data Engineering Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-059' LIMIT 1),
  'B.Sc Data Science - Data Engineering Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MCA - Data Engineering / Cloud Data Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-059' LIMIT 1),
  'MCA - Data Engineering / Cloud Data Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Tech Data Engineering / Big Data Systems
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-059' LIMIT 1),
  'M.Tech Data Engineering / Big Data Systems',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech AI & Data Science - Applied Industry AI Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-059' LIMIT 1),
  'B.Tech AI & Data Science - Applied Industry AI Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Improve the Data Governance Control Maintenance Workflow Using Evidence
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Improve the Data Governance Control Maintenance Workflow Using Evidence',
  'CRS-IND-CL-064',
  'By the end of this course, the learner can improve a recurring workflow in Data Governance Control Maintenance by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact. Workplace problem: An improvement review finds that privacy and lineage control review has repeated failures over the last 4 cycles, mainly linked to unmapped downstream report and missing data-owner approval. The expected volume is 30,830 attributes, but only 29,067 attributes are usable, creating a 5.7% variance against the control expectation. 37 attributes lack sensitivity tags and 8 downstream reports are missing from lineage. The accepted rule is: critical attributes must have 100% owner, lineage, and policy tagging. The learner receives data asset inventory, lineage extract, policy tag register, owner approval sheet, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Data Governance Control Maintenance Log. The learner must study the trend, identify the control weakness, and propose a workflow improvement with before/after evidence. Artifact: Data Governance Control Maintenance Log - Improvement Proposal.',
  '14 hours',
  'Active',
  'Data Governance & Stewardship',
  'technical',
  '["By the end of this course, the learner can improve a recurring workflow in Data Governance Control Maintenance by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact","Learner demonstrates Data Governance Control Maintenance by interpreting real-looking numbers, comparing evidence from data asset inventory and lineage extract, and producing a decision-ready artifact","Proves the learner can perform workflow improvement work in Data Governance Control Maintenance with numeric evidence, workplace documents, and a reviewer-ready artifact. Status: Demo Ready"]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L4 Module: Data Governance Control Maintenance Workplace Mission
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-064' LIMIT 1),
  'L4 Module: Data Governance Control Maintenance Workplace Mission',
  'Industry requirement: Teams responsible for a governed customer data asset need learners who can use numeric evidence, threshold rules, and workplace documents to make reliable decisions during privacy and lineage control review, not only explain Data Governance Control Maintenance theoretically. Gap addressed: Academic learning may cover the concepts behind Data Governance Control Maintenance, but it usually does not make learners practice with data asset inventory, lineage extract, policy tag register, numeric variance, threshold decisions, and role handoff artifacts. Trigger: the same issue has repeated across at least 3 recent runs or reviews: 29,067 of 30,830 attributes passed the check, variance 5.7%, with signal ''unmapped downstream report and missing data-owner approval''.',
  1,
  '["Data & AI","Data Governance & Stewardship","Data Governance Control Maintenance","Primary: Compliance. Supporting: Evidence, Technical, Communication, Behavioural","data ownership","lineage completeness","policy tagging","sensitive data classification","governance control evidence","expected 30,830 vs actual 29,067 attributes","5.7% variance interpretation","threshold rule: critical attributes must have 100% owner, lineage, and policy tagging","trend evidence","control redesign","before/after comparison"]'::jsonb,
  '["Engage: Learner receives a workflow improvement case: privacy and lineage control review is at risk because only 29,067 of 30,830 attributes passed the control and unmapped downstream report and missing data-owner approval is visible","Explore: Learner reviews data asset inventory, lineage extract, policy tag register, owner approval sheet, downstream report list, highlights the fields that prove the issue, and notes which values cross the threshold","Explain: Learner studies data ownership, lineage completeness, policy tagging, sensitive data classification and learns how these concepts explain the business risk, not just the technical error","Express: Learner prepares the Data Governance Control Maintenance Log with issue summary, numeric evidence, root-cause hypothesis, decision, and handoff note","Empower: Learner must propose a control change that reduces recurrence for privacy and lineage control review","Evolve: Learner defines a before/after measure to prove the workflow improvement reduced repeat failures"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Scenario: Data Governance Control Maintenance Log - Improvement Proposal
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-064' LIMIT 1)
   AND title = 'L4 Module: Data Governance Control Maintenance Workplace Mission' LIMIT 1),
  'Workplace Scenario: Data Governance Control Maintenance Log - Improvement Proposal',
  'An improvement review finds that privacy and lineage control review has repeated failures over the last 4 cycles, mainly linked to unmapped downstream report and missing data-owner approval. The expected volume is 30,830 attributes, but only 29,067 attributes are usable, creating a 5.7% variance against the control expectation. 37 attributes lack sensitivity tags and 8 downstream reports are missing from lineage. The accepted rule is: critical attributes must have 100% owner, lineage, and policy tagging. The learner receives data asset inventory, lineage extract, policy tag register, owner approval sheet, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Data Governance Control Maintenance Log. The learner must study the trend, identify the control weakness, and propose a workflow improvement with before/after evidence. Pressure points: Privacy and lineage control review is time-sensitive; variance is 5.7% against the rule; 37 attributes lack sensitivity tags and 8 downstream reports are missing from lineage; the issue is recurring, rework hours are increasing, and the team needs a preventive control.',
  'Course trigger: the same issue has repeated across at least 3 recent runs or reviews: 29,067 of 30,830 attributes passed the check, variance 5.7%, with signal ''unmapped downstream report and missing data-owner approval''.
Problem statement: An improvement review finds that privacy and lineage control review has repeated failures over the last 4 cycles, mainly linked to unmapped downstream report and missing data-owner approval. The expected volume is 30,830 attributes, but only 29,067 attributes are usable, creating a 5.7% variance against the control expectation. 37 attributes lack sensitivity tags and 8 downstream reports are missing from lineage. The accepted rule is: critical attributes must have 100% owner, lineage, and policy tagging. The learner receives data asset inventory, lineage extract, policy tag register, owner approval sheet, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Data Governance Control Maintenance Log. The learner must study the trend, identify the control weakness, and propose a workflow improvement with before/after evidence.
Major concepts: data ownership; lineage completeness; policy tagging; sensitive data classification; governance control evidence; expected 30,830 vs actual 29,067 attributes; 5.7% variance interpretation; threshold rule: critical attributes must have 100% owner, lineage, and policy tagging; trend evidence; control redesign; before/after comparison.
Root-cause focus: Find which repeated process weakness is causing: missing data-owner mapping, stale lineage, untagged sensitive attribute, policy exception, or unregistered report dependency. Evidence must come from data asset inventory, lineage extract, policy tag register.
Required data: data asset inventory; lineage extract; policy tag register; owner approval sheet; downstream report list; 4-cycle trend summary; rework-hours log; current workflow map
Artifact: Data Governance Control Maintenance Log - Improvement Proposal
Artifact structure: case summary; expected vs actual numbers; threshold rule; evidence table from data asset inventory, lineage extract, policy tag register; root-cause hypothesis; decision/action; risk note; role handoff; recurring trend evidence; proposed process change; before/after success metric.
Evidence fields to assess: captures expected 30,830 and actual 29,067 attributes; calculates or explains 5.7% variance; uses threshold rule correctly (critical attributes must have 100% owner, lineage, and policy tagging); cites at least three input documents; links evidence to root-cause hypothesis; states clear release/hold/correct/escalate decision; defines measurable improvement target; shows before/after control logic.
AI support tips: Use AI as a coach to ask evidence-checking questions, explain unfamiliar terms, compare possible root causes, and improve clarity. Do not use AI to invent numbers or make the decision without citing the provided documents.',
  1,
  '14 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech AI & Data Science - Responsible AI Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-064' LIMIT 1),
  'B.Tech AI & Data Science - Responsible AI Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech CSE - AI Security / Governance Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-064' LIMIT 1),
  'B.Tech CSE - AI Security / Governance Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MBA Business Analytics - AI Risk & Governance Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-064' LIMIT 1),
  'MBA Business Analytics - AI Risk & Governance Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: LL.B / Tech Law - Data Privacy & AI Governance Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-064' LIMIT 1),
  'LL.B / Tech Law - Data Privacy & AI Governance Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PG Certificate - Responsible AI, Risk & Compliance
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-064' LIMIT 1),
  'PG Certificate - Responsible AI, Risk & Compliance',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech CSE / Data Science - Data Governance Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-064' LIMIT 1),
  'B.Tech CSE / Data Science - Data Governance Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Improve the Responsible AI Deployment Approval Workflow Using Evidence
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Improve the Responsible AI Deployment Approval Workflow Using Evidence',
  'CRS-IND-CL-069',
  'By the end of this course, the learner can improve a recurring workflow in Responsible AI Deployment Approval by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact. Workplace problem: An improvement review finds that loan-assistant chatbot approval has repeated failures over the last 4 cycles, mainly linked to incomplete risk control evidence before deployment. The expected volume is 31,828 checks, but only 29,994 checks are usable, creating a 5.8% variance against the control expectation. Fairness test evidence is missing for 2 protected segments and human-review fallback is not signed off. The accepted rule is: all high-risk controls must be approved before deployment. The learner receives AI use-case registration, risk assessment form, fairness test summary, human fallback design, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Responsible AI Deployment Approval Dossier. The learner must study the trend, identify the control weakness, and propose a workflow improvement with before/after evidence. Artifact: Responsible AI Deployment Approval Dossier - Improvement Proposal.',
  '14 hours',
  'Active',
  'Responsible AI, Risk, Privacy & Security',
  'technical',
  '["By the end of this course, the learner can improve a recurring workflow in Responsible AI Deployment Approval by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact","Learner demonstrates Responsible AI Deployment Approval by interpreting real-looking numbers, comparing evidence from AI use-case registration and risk assessment form, and producing a decision-ready artifact","Proves the learner can perform workflow improvement work in Responsible AI Deployment Approval with numeric evidence, workplace documents, and a reviewer-ready artifact. Status: Demo Ready"]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L4 Module: Responsible AI Deployment Approval Workplace Mission
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-069' LIMIT 1),
  'L4 Module: Responsible AI Deployment Approval Workplace Mission',
  'Industry requirement: Teams responsible for a responsible AI deployment request need learners who can use numeric evidence, threshold rules, and workplace documents to make reliable decisions during loan-assistant chatbot approval, not only explain Responsible AI Deployment Approval theoretically. Gap addressed: Academic learning may cover the concepts behind Responsible AI Deployment Approval, but it usually does not make learners practice with AI use-case registration, risk assessment form, fairness test summary, numeric variance, threshold decisions, and role handoff artifacts. Trigger: the same issue has repeated across at least 3 recent runs or reviews: 29,994 of 31,828 checks passed the check, variance 5.8%, with signal ''incomplete risk control evidence before deployment''.',
  1,
  '["Data & AI","Responsible AI, Risk, Privacy & Security","Responsible AI Deployment Approval","Primary: Compliance. Supporting: Evidence, Technical, Communication, Behavioural","AI use-case risk tier","fairness evidence","human oversight control","deployment approval gate","responsible AI audit trail","expected 31,828 vs actual 29,994 checks","5.8% variance interpretation","threshold rule: all high-risk controls must be approved before deployment","trend evidence","control redesign","before/after comparison"]'::jsonb,
  '["Engage: Learner receives a workflow improvement case: loan-assistant chatbot approval is at risk because only 29,994 of 31,828 checks passed the control and incomplete risk control evidence before deployment is visible","Explore: Learner reviews AI use-case registration, risk assessment form, fairness test summary, human fallback design, deployment approval checklist, highlights the fields that prove the issue, and notes which values cross the threshold","Explain: Learner studies AI use-case risk tier, fairness evidence, human oversight control, deployment approval gate and learns how these concepts explain the business risk, not just the technical error","Express: Learner prepares the Responsible AI Deployment Approval Dossier with issue summary, numeric evidence, root-cause hypothesis, decision, and handoff note","Empower: Learner must propose a control change that reduces recurrence for loan-assistant chatbot approval","Evolve: Learner defines a before/after measure to prove the workflow improvement reduced repeat failures"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Scenario: Responsible AI Deployment Approval Dossier - Improvement Proposal
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-069' LIMIT 1)
   AND title = 'L4 Module: Responsible AI Deployment Approval Workplace Mission' LIMIT 1),
  'Workplace Scenario: Responsible AI Deployment Approval Dossier - Improvement Proposal',
  'An improvement review finds that loan-assistant chatbot approval has repeated failures over the last 4 cycles, mainly linked to incomplete risk control evidence before deployment. The expected volume is 31,828 checks, but only 29,994 checks are usable, creating a 5.8% variance against the control expectation. Fairness test evidence is missing for 2 protected segments and human-review fallback is not signed off. The accepted rule is: all high-risk controls must be approved before deployment. The learner receives AI use-case registration, risk assessment form, fairness test summary, human fallback design, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Responsible AI Deployment Approval Dossier. The learner must study the trend, identify the control weakness, and propose a workflow improvement with before/after evidence. Pressure points: Loan-assistant chatbot approval is time-sensitive; variance is 5.8% against the rule; fairness test evidence is missing for 2 protected segments and human-review fallback is not signed off; the issue is recurring, rework hours are increasing, and the team needs a preventive control.',
  'Course trigger: the same issue has repeated across at least 3 recent runs or reviews: 29,994 of 31,828 checks passed the check, variance 5.8%, with signal ''incomplete risk control evidence before deployment''.
Problem statement: An improvement review finds that loan-assistant chatbot approval has repeated failures over the last 4 cycles, mainly linked to incomplete risk control evidence before deployment. The expected volume is 31,828 checks, but only 29,994 checks are usable, creating a 5.8% variance against the control expectation. Fairness test evidence is missing for 2 protected segments and human-review fallback is not signed off. The accepted rule is: all high-risk controls must be approved before deployment. The learner receives AI use-case registration, risk assessment form, fairness test summary, human fallback design, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Responsible AI Deployment Approval Dossier. The learner must study the trend, identify the control weakness, and propose a workflow improvement with before/after evidence.
Major concepts: AI use-case risk tier; fairness evidence; human oversight control; deployment approval gate; responsible AI audit trail; expected 31,828 vs actual 29,994 checks; 5.8% variance interpretation; threshold rule: all high-risk controls must be approved before deployment; trend evidence; control redesign; before/after comparison.
Root-cause focus: Find which repeated process weakness is causing: missing fairness evidence, unclear human oversight, privacy risk gap, unapproved fallback, or incomplete model documentation. Evidence must come from AI use-case registration, risk assessment form, fairness test summary.
Required data: AI use-case registration; risk assessment form; fairness test summary; human fallback design; deployment approval checklist; 4-cycle trend summary; rework-hours log; current workflow map
Artifact: Responsible AI Deployment Approval Dossier - Improvement Proposal
Artifact structure: case summary; expected vs actual numbers; threshold rule; evidence table from AI use-case registration, risk assessment form, fairness test summary; root-cause hypothesis; decision/action; risk note; role handoff; recurring trend evidence; proposed process change; before/after success metric.
Evidence fields to assess: captures expected 31,828 and actual 29,994 checks; calculates or explains 5.8% variance; uses threshold rule correctly (all high-risk controls must be approved before deployment); cites at least three input documents; links evidence to root-cause hypothesis; states clear release/hold/correct/escalate decision; defines measurable improvement target; shows before/after control logic.
AI support tips: Use AI as a coach to ask evidence-checking questions, explain unfamiliar terms, compare possible root causes, and improve clarity. Do not use AI to invent numbers or make the decision without citing the provided documents.',
  1,
  '14 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech AI & Data Science - Responsible AI Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-069' LIMIT 1),
  'B.Tech AI & Data Science - Responsible AI Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech CSE - AI Security / Governance Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-069' LIMIT 1),
  'B.Tech CSE - AI Security / Governance Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MBA Business Analytics - AI Risk & Governance Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-069' LIMIT 1),
  'MBA Business Analytics - AI Risk & Governance Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: LL.B / Tech Law - Data Privacy & AI Governance Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-069' LIMIT 1),
  'LL.B / Tech Law - Data Privacy & AI Governance Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PG Certificate - Responsible AI, Risk & Compliance
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-069' LIMIT 1),
  'PG Certificate - Responsible AI, Risk & Compliance',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Improve the AI Security Abuse-Path Testing Workflow Using Evidence
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Improve the AI Security Abuse-Path Testing Workflow Using Evidence',
  'CRS-IND-CL-074',
  'By the end of this course, the learner can improve a recurring workflow in AI Security Abuse-Path Testing by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact. Workplace problem: An improvement review finds that AI security abuse-path test has repeated failures over the last 4 cycles, mainly linked to prompt-injection and retrieval data exposure risk. The expected volume is 33,390 tests, but only 31,395 tests are usable, creating a 6.0% variance against the control expectation. 9 prompt-injection tests reveal restricted policy snippets and 14 retrieval responses cite unapproved documents. The accepted rule is: critical abuse paths must have 0 data-exposure passes. The learner receives abuse-path test script, prompt-injection result log, retrieval access-control matrix, sensitive response examples, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the AI Security Abuse-Path Test Report. The learner must study the trend, identify the control weakness, and propose a workflow improvement with before/after evidence. Artifact: AI Security Abuse-Path Test Report - Improvement Proposal.',
  '14 hours',
  'Active',
  'Responsible AI, Risk, Privacy & Security',
  'technical',
  '["By the end of this course, the learner can improve a recurring workflow in AI Security Abuse-Path Testing by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact","Learner demonstrates AI Security Abuse-Path Testing by interpreting real-looking numbers, comparing evidence from abuse-path test script and prompt-injection result log, and producing a decision-ready artifact","Proves the learner can perform workflow improvement work in AI Security Abuse-Path Testing with numeric evidence, workplace documents, and a reviewer-ready artifact. Status: Pilot Ready — Evidence Strengthening Needed"]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L4 Module: AI Security Abuse-Path Testing Workplace Mission
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-074' LIMIT 1),
  'L4 Module: AI Security Abuse-Path Testing Workplace Mission',
  'Industry requirement: Teams responsible for a GenAI knowledge assistant need learners who can use numeric evidence, threshold rules, and workplace documents to make reliable decisions during AI security abuse-path test, not only explain AI Security Abuse-Path Testing theoretically. Gap addressed: Academic learning may cover the concepts behind AI Security Abuse-Path Testing, but it usually does not make learners practice with abuse-path test script, prompt-injection result log, retrieval access-control matrix, numeric variance, threshold decisions, and role handoff artifacts. Trigger: the same issue has repeated across at least 3 recent runs or reviews: 31,395 of 33,390 tests passed the check, variance 6.0%, with signal ''prompt-injection and retrieval data exposure risk''.',
  1,
  '["Data & AI","Responsible AI, Risk, Privacy & Security","AI Security Abuse-Path Testing","Primary: Compliance. Supporting: Evidence, Technical, Communication, Behavioural","prompt-injection pattern","retrieval access control","data exposure severity","red-team evidence","mitigation decision","expected 33,390 vs actual 31,395 tests","6.0% variance interpretation","threshold rule: critical abuse paths must have 0 data-exposure passes","trend evidence","control redesign","before/after comparison"]'::jsonb,
  '["Engage: Learner receives a workflow improvement case: AI security abuse-path test is at risk because only 31,395 of 33,390 tests passed the control and prompt-injection and retrieval data exposure risk is visible","Explore: Learner reviews abuse-path test script, prompt-injection result log, retrieval access-control matrix, sensitive response examples, security triage ticket, highlights the fields that prove the issue, and notes which values cross the threshold","Explain: Learner studies prompt-injection pattern, retrieval access control, data exposure severity, red-team evidence and learns how these concepts explain the business risk, not just the technical error","Express: Learner prepares the AI Security Abuse-Path Test Report with issue summary, numeric evidence, root-cause hypothesis, decision, and handoff note","Empower: Learner must propose a control change that reduces recurrence for AI security abuse-path test","Evolve: Learner defines a before/after measure to prove the workflow improvement reduced repeat failures"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Scenario: AI Security Abuse-Path Test Report - Improvement Proposal
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-074' LIMIT 1)
   AND title = 'L4 Module: AI Security Abuse-Path Testing Workplace Mission' LIMIT 1),
  'Workplace Scenario: AI Security Abuse-Path Test Report - Improvement Proposal',
  'An improvement review finds that AI security abuse-path test has repeated failures over the last 4 cycles, mainly linked to prompt-injection and retrieval data exposure risk. The expected volume is 33,390 tests, but only 31,395 tests are usable, creating a 6.0% variance against the control expectation. 9 prompt-injection tests reveal restricted policy snippets and 14 retrieval responses cite unapproved documents. The accepted rule is: critical abuse paths must have 0 data-exposure passes. The learner receives abuse-path test script, prompt-injection result log, retrieval access-control matrix, sensitive response examples, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the AI Security Abuse-Path Test Report. The learner must study the trend, identify the control weakness, and propose a workflow improvement with before/after evidence. Pressure points: Ai security abuse-path test is time-sensitive; variance is 6.0% against the rule; 9 prompt-injection tests reveal restricted policy snippets and 14 retrieval responses cite unapproved documents; the issue is recurring, rework hours are increasing, and the team needs a preventive control.',
  'Course trigger: the same issue has repeated across at least 3 recent runs or reviews: 31,395 of 33,390 tests passed the check, variance 6.0%, with signal ''prompt-injection and retrieval data exposure risk''.
Problem statement: An improvement review finds that AI security abuse-path test has repeated failures over the last 4 cycles, mainly linked to prompt-injection and retrieval data exposure risk. The expected volume is 33,390 tests, but only 31,395 tests are usable, creating a 6.0% variance against the control expectation. 9 prompt-injection tests reveal restricted policy snippets and 14 retrieval responses cite unapproved documents. The accepted rule is: critical abuse paths must have 0 data-exposure passes. The learner receives abuse-path test script, prompt-injection result log, retrieval access-control matrix, sensitive response examples, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the AI Security Abuse-Path Test Report. The learner must study the trend, identify the control weakness, and propose a workflow improvement with before/after evidence.
Major concepts: prompt-injection pattern; retrieval access control; data exposure severity; red-team evidence; mitigation decision; expected 33,390 vs actual 31,395 tests; 6.0% variance interpretation; threshold rule: critical abuse paths must have 0 data-exposure passes; trend evidence; control redesign; before/after comparison.
Root-cause focus: Find which repeated process weakness is causing: weak system prompt boundary, retrieval permission leak, unsafe tool call, sensitive context exposure, or missing refusal test. Evidence must come from abuse-path test script, prompt-injection result log, retrieval access-control matrix.
Required data: abuse-path test script; prompt-injection result log; retrieval access-control matrix; sensitive response examples; security triage ticket; 4-cycle trend summary; rework-hours log; current workflow map
Artifact: AI Security Abuse-Path Test Report - Improvement Proposal
Artifact structure: case summary; expected vs actual numbers; threshold rule; evidence table from abuse-path test script, prompt-injection result log, retrieval access-control matrix; root-cause hypothesis; decision/action; risk note; role handoff; recurring trend evidence; proposed process change; before/after success metric.
Evidence fields to assess: captures expected 33,390 and actual 31,395 tests; calculates or explains 6.0% variance; uses threshold rule correctly (critical abuse paths must have 0 data-exposure passes); cites at least three input documents; links evidence to root-cause hypothesis; states clear release/hold/correct/escalate decision; defines measurable improvement target; shows before/after control logic.
AI support tips: Use AI as a coach to ask evidence-checking questions, explain unfamiliar terms, compare possible root causes, and improve clarity. Do not use AI to invent numbers or make the decision without citing the provided documents.',
  1,
  '14 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech AI & Data Science - Responsible AI Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-074' LIMIT 1),
  'B.Tech AI & Data Science - Responsible AI Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech CSE - AI Security / Governance Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-074' LIMIT 1),
  'B.Tech CSE - AI Security / Governance Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MBA Business Analytics - AI Risk & Governance Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-074' LIMIT 1),
  'MBA Business Analytics - AI Risk & Governance Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: LL.B / Tech Law - Data Privacy & AI Governance Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-074' LIMIT 1),
  'LL.B / Tech Law - Data Privacy & AI Governance Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PG Certificate - Responsible AI, Risk & Compliance
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-074' LIMIT 1),
  'PG Certificate - Responsible AI, Risk & Compliance',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Improve the GenAI Feature Specification Workflow Using Evidence
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Improve the GenAI Feature Specification Workflow Using Evidence',
  'CRS-IND-CL-079',
  'By the end of this course, the learner can improve a recurring workflow in GenAI Feature Specification by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact. Workplace problem: An improvement review finds that support-agent copilot specification has repeated failures over the last 4 cycles, mainly linked to unclear feature scope and missing acceptance criteria. The expected volume is 34,554 stories, but only 32,464 stories are usable, creating a 6.0% variance against the control expectation. 6 stories allow auto-send without human confirmation and 5 lack hallucination-control criteria. The accepted rule is: all high-priority stories need measurable acceptance criteria and risk notes. The learner receives product requirement brief, conversation journey map, acceptance criteria draft, risk-control checklist, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the GenAI Feature Specification Pack. The learner must study the trend, identify the control weakness, and propose a workflow improvement with before/after evidence. Artifact: GenAI Feature Specification Pack - Improvement Proposal.',
  '14 hours',
  'Active',
  'AI Product & GenAI Application Development',
  'technical',
  '["By the end of this course, the learner can improve a recurring workflow in GenAI Feature Specification by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact","Learner demonstrates GenAI Feature Specification by interpreting real-looking numbers, comparing evidence from product requirement brief and conversation journey map, and producing a decision-ready artifact","Proves the learner can perform workflow improvement work in GenAI Feature Specification with numeric evidence, workplace documents, and a reviewer-ready artifact. Status: Demo Ready"]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L4 Module: GenAI Feature Specification Workplace Mission
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-079' LIMIT 1),
  'L4 Module: GenAI Feature Specification Workplace Mission',
  'Industry requirement: Teams responsible for a GenAI product feature need learners who can use numeric evidence, threshold rules, and workplace documents to make reliable decisions during support-agent copilot specification, not only explain GenAI Feature Specification theoretically. Gap addressed: Academic learning may cover the concepts behind GenAI Feature Specification, but it usually does not make learners practice with product requirement brief, conversation journey map, acceptance criteria draft, numeric variance, threshold decisions, and role handoff artifacts. Trigger: the same issue has repeated across at least 3 recent runs or reviews: 32,464 of 34,554 stories passed the check, variance 6.0%, with signal ''unclear feature scope and missing acceptance criteria''.',
  1,
  '["Data & AI","AI Product & GenAI Application Development","GenAI Feature Specification","Primary: Functional. Supporting: Cognitive, Communication, AI/Digital, Behavioural","GenAI feature boundary","human-in-the-loop acceptance","hallucination control","prompt workflow requirement","success metric definition","expected 34,554 vs actual 32,464 stories","6.0% variance interpretation","threshold rule: all high-priority stories need measurable acceptance criteria and risk notes","trend evidence","control redesign","before/after comparison"]'::jsonb,
  '["Engage: Learner receives a workflow improvement case: support-agent copilot specification is at risk because only 32,464 of 34,554 stories passed the control and unclear feature scope and missing acceptance criteria is visible","Explore: Learner reviews product requirement brief, conversation journey map, acceptance criteria draft, risk-control checklist, stakeholder feedback notes, highlights the fields that prove the issue, and notes which values cross the threshold","Explain: Learner studies GenAI feature boundary, human-in-the-loop acceptance, hallucination control, prompt workflow requirement and learns how these concepts explain the business risk, not just the technical error","Express: Learner prepares the GenAI Feature Specification Pack with issue summary, numeric evidence, root-cause hypothesis, decision, and handoff note","Empower: Learner must propose a control change that reduces recurrence for support-agent copilot specification","Evolve: Learner defines a before/after measure to prove the workflow improvement reduced repeat failures"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Scenario: GenAI Feature Specification Pack - Improvement Proposal
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-079' LIMIT 1)
   AND title = 'L4 Module: GenAI Feature Specification Workplace Mission' LIMIT 1),
  'Workplace Scenario: GenAI Feature Specification Pack - Improvement Proposal',
  'An improvement review finds that support-agent copilot specification has repeated failures over the last 4 cycles, mainly linked to unclear feature scope and missing acceptance criteria. The expected volume is 34,554 stories, but only 32,464 stories are usable, creating a 6.0% variance against the control expectation. 6 stories allow auto-send without human confirmation and 5 lack hallucination-control criteria. The accepted rule is: all high-priority stories need measurable acceptance criteria and risk notes. The learner receives product requirement brief, conversation journey map, acceptance criteria draft, risk-control checklist, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the GenAI Feature Specification Pack. The learner must study the trend, identify the control weakness, and propose a workflow improvement with before/after evidence. Pressure points: Support-agent copilot specification is time-sensitive; variance is 6.0% against the rule; 6 stories allow auto-send without human confirmation and 5 lack hallucination-control criteria; the issue is recurring, rework hours are increasing, and the team needs a preventive control.',
  'Course trigger: the same issue has repeated across at least 3 recent runs or reviews: 32,464 of 34,554 stories passed the check, variance 6.0%, with signal ''unclear feature scope and missing acceptance criteria''.
Problem statement: An improvement review finds that support-agent copilot specification has repeated failures over the last 4 cycles, mainly linked to unclear feature scope and missing acceptance criteria. The expected volume is 34,554 stories, but only 32,464 stories are usable, creating a 6.0% variance against the control expectation. 6 stories allow auto-send without human confirmation and 5 lack hallucination-control criteria. The accepted rule is: all high-priority stories need measurable acceptance criteria and risk notes. The learner receives product requirement brief, conversation journey map, acceptance criteria draft, risk-control checklist, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the GenAI Feature Specification Pack. The learner must study the trend, identify the control weakness, and propose a workflow improvement with before/after evidence.
Major concepts: GenAI feature boundary; human-in-the-loop acceptance; hallucination control; prompt workflow requirement; success metric definition; expected 34,554 vs actual 32,464 stories; 6.0% variance interpretation; threshold rule: all high-priority stories need measurable acceptance criteria and risk notes; trend evidence; control redesign; before/after comparison.
Root-cause focus: Find which repeated process weakness is causing: unclear user workflow, missing acceptance criteria, unsafe automation boundary, hallucination-control gap, or unmeasured success metric. Evidence must come from product requirement brief, conversation journey map, acceptance criteria draft.
Required data: product requirement brief; conversation journey map; acceptance criteria draft; risk-control checklist; stakeholder feedback notes; 4-cycle trend summary; rework-hours log; current workflow map
Artifact: GenAI Feature Specification Pack - Improvement Proposal
Artifact structure: case summary; expected vs actual numbers; threshold rule; evidence table from product requirement brief, conversation journey map, acceptance criteria draft; root-cause hypothesis; decision/action; risk note; role handoff; recurring trend evidence; proposed process change; before/after success metric.
Evidence fields to assess: captures expected 34,554 and actual 32,464 stories; calculates or explains 6.0% variance; uses threshold rule correctly (all high-priority stories need measurable acceptance criteria and risk notes); cites at least three input documents; links evidence to root-cause hypothesis; states clear release/hold/correct/escalate decision; defines measurable improvement target; shows before/after control logic.
AI support tips: Use AI as a coach to ask evidence-checking questions, explain unfamiliar terms, compare possible root causes, and improve clarity. Do not use AI to invent numbers or make the decision without citing the provided documents.',
  1,
  '14 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech CSE - AI & Machine Learning Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-079' LIMIT 1),
  'B.Tech CSE - AI & Machine Learning Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech AI & Data Science - ML Engineering Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-079' LIMIT 1),
  'B.Tech AI & Data Science - ML Engineering Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Tech AI / Machine Learning Engineering
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-079' LIMIT 1),
  'M.Tech AI / Machine Learning Engineering',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Sc AI & Machine Learning
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-079' LIMIT 1),
  'M.Sc AI & Machine Learning',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MCA - AI / ML Application Development
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-079' LIMIT 1),
  'MCA - AI / ML Application Development',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech CSE - AI Product Engineering Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-079' LIMIT 1),
  'B.Tech CSE - AI Product Engineering Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Improve the Human-AI Workflow Validation Workflow Using Evidence
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Improve the Human-AI Workflow Validation Workflow Using Evidence',
  'CRS-IND-CL-084',
  'By the end of this course, the learner can improve a recurring workflow in Human-AI Workflow Validation by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact. Workplace problem: An improvement review finds that claims processing copilot validation has repeated failures over the last 4 cycles, mainly linked to user overrides and trust failures in assisted decisions. The expected volume is 41,490 suggestions, but only 38,417 suggestions are usable, creating a 7.4% variance against the control expectation. Adjusters reject 18% of suggestions and 23 comments cite missing evidence in the AI explanation. The accepted rule is: unexplained override rate above 12% requires workflow review. The learner receives user edit log, AI suggestion sample, override reason summary, workflow step map, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Human-AI Workflow Validation Report. The learner must study the trend, identify the control weakness, and propose a workflow improvement with before/after evidence. Artifact: Human-AI Workflow Validation Report - Improvement Proposal.',
  '14 hours',
  'Active',
  'AI Product & GenAI Application Development',
  'technical',
  '["By the end of this course, the learner can improve a recurring workflow in Human-AI Workflow Validation by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact","Learner demonstrates Human-AI Workflow Validation by interpreting real-looking numbers, comparing evidence from user edit log and AI suggestion sample, and producing a decision-ready artifact","Proves the learner can perform workflow improvement work in Human-AI Workflow Validation with numeric evidence, workplace documents, and a reviewer-ready artifact. Status: Demo Ready"]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L4 Module: Human-AI Workflow Validation Workplace Mission
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-084' LIMIT 1),
  'L4 Module: Human-AI Workflow Validation Workplace Mission',
  'Industry requirement: Teams responsible for a human-AI workflow need learners who can use numeric evidence, threshold rules, and workplace documents to make reliable decisions during claims processing copilot validation, not only explain Human-AI Workflow Validation theoretically. Gap addressed: Academic learning may cover the concepts behind Human-AI Workflow Validation, but it usually does not make learners practice with user edit log, AI suggestion sample, override reason summary, numeric variance, threshold decisions, and role handoff artifacts. Trigger: the same issue has repeated across at least 3 recent runs or reviews: 38,417 of 41,490 suggestions passed the check, variance 7.4%, with signal ''user overrides and trust failures in assisted decisions''.',
  1,
  '["Data & AI","AI Product & GenAI Application Development","Human-AI Workflow Validation","Primary: Functional. Supporting: Cognitive, Communication, AI/Digital, Behavioural","human override pattern","trust signal analysis","AI explanation quality","workflow friction point","human-in-the-loop validation","expected 41,490 vs actual 38,417 suggestions","7.4% variance interpretation","threshold rule: unexplained override rate above 12% requires workflow review","trend evidence","control redesign","before/after comparison"]'::jsonb,
  '["Engage: Learner receives a workflow improvement case: claims processing copilot validation is at risk because only 38,417 of 41,490 suggestions passed the control and user overrides and trust failures in assisted decisions is visible","Explore: Learner reviews user edit log, AI suggestion sample, override reason summary, workflow step map, trust feedback notes, highlights the fields that prove the issue, and notes which values cross the threshold","Explain: Learner studies human override pattern, trust signal analysis, AI explanation quality, workflow friction point and learns how these concepts explain the business risk, not just the technical error","Express: Learner prepares the Human-AI Workflow Validation Report with issue summary, numeric evidence, root-cause hypothesis, decision, and handoff note","Empower: Learner must propose a control change that reduces recurrence for claims processing copilot validation","Evolve: Learner defines a before/after measure to prove the workflow improvement reduced repeat failures"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Scenario: Human-AI Workflow Validation Report - Improvement Proposal
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-084' LIMIT 1)
   AND title = 'L4 Module: Human-AI Workflow Validation Workplace Mission' LIMIT 1),
  'Workplace Scenario: Human-AI Workflow Validation Report - Improvement Proposal',
  'An improvement review finds that claims processing copilot validation has repeated failures over the last 4 cycles, mainly linked to user overrides and trust failures in assisted decisions. The expected volume is 41,490 suggestions, but only 38,417 suggestions are usable, creating a 7.4% variance against the control expectation. Adjusters reject 18% of suggestions and 23 comments cite missing evidence in the AI explanation. The accepted rule is: unexplained override rate above 12% requires workflow review. The learner receives user edit log, AI suggestion sample, override reason summary, workflow step map, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Human-AI Workflow Validation Report. The learner must study the trend, identify the control weakness, and propose a workflow improvement with before/after evidence. Pressure points: Claims processing copilot validation is time-sensitive; variance is 7.4% against the rule; adjusters reject 18% of suggestions and 23 comments cite missing evidence in the AI explanation; the issue is recurring, rework hours are increasing, and the team needs a preventive control.',
  'Course trigger: the same issue has repeated across at least 3 recent runs or reviews: 38,417 of 41,490 suggestions passed the check, variance 7.4%, with signal ''user overrides and trust failures in assisted decisions''.
Problem statement: An improvement review finds that claims processing copilot validation has repeated failures over the last 4 cycles, mainly linked to user overrides and trust failures in assisted decisions. The expected volume is 41,490 suggestions, but only 38,417 suggestions are usable, creating a 7.4% variance against the control expectation. Adjusters reject 18% of suggestions and 23 comments cite missing evidence in the AI explanation. The accepted rule is: unexplained override rate above 12% requires workflow review. The learner receives user edit log, AI suggestion sample, override reason summary, workflow step map, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Human-AI Workflow Validation Report. The learner must study the trend, identify the control weakness, and propose a workflow improvement with before/after evidence.
Major concepts: human override pattern; trust signal analysis; AI explanation quality; workflow friction point; human-in-the-loop validation; expected 41,490 vs actual 38,417 suggestions; 7.4% variance interpretation; threshold rule: unexplained override rate above 12% requires workflow review; trend evidence; control redesign; before/after comparison.
Root-cause focus: Find which repeated process weakness is causing: AI suggestion lacks evidence, workflow step mismatch, unclear confidence signal, bad handoff timing, or user trust gap. Evidence must come from user edit log, AI suggestion sample, override reason summary.
Required data: user edit log; AI suggestion sample; override reason summary; workflow step map; trust feedback notes; 4-cycle trend summary; rework-hours log; current workflow map
Artifact: Human-AI Workflow Validation Report - Improvement Proposal
Artifact structure: case summary; expected vs actual numbers; threshold rule; evidence table from user edit log, AI suggestion sample, override reason summary; root-cause hypothesis; decision/action; risk note; role handoff; recurring trend evidence; proposed process change; before/after success metric.
Evidence fields to assess: captures expected 41,490 and actual 38,417 suggestions; calculates or explains 7.4% variance; uses threshold rule correctly (unexplained override rate above 12% requires workflow review); cites at least three input documents; links evidence to root-cause hypothesis; states clear release/hold/correct/escalate decision; defines measurable improvement target; shows before/after control logic.
AI support tips: Use AI as a coach to ask evidence-checking questions, explain unfamiliar terms, compare possible root causes, and improve clarity. Do not use AI to invent numbers or make the decision without citing the provided documents.',
  1,
  '14 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech CSE - AI & Machine Learning Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-084' LIMIT 1),
  'B.Tech CSE - AI & Machine Learning Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech AI & Data Science - ML Engineering Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-084' LIMIT 1),
  'B.Tech AI & Data Science - ML Engineering Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Tech AI / Machine Learning Engineering
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-084' LIMIT 1),
  'M.Tech AI / Machine Learning Engineering',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Sc AI & Machine Learning
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-084' LIMIT 1),
  'M.Sc AI & Machine Learning',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MCA - AI / ML Application Development
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-084' LIMIT 1),
  'MCA - AI / ML Application Development',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech CSE - AI Product Engineering Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-084' LIMIT 1),
  'B.Tech CSE - AI Product Engineering Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Improve the Applied Industry AI Configuration Workflow Using Evidence
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Improve the Applied Industry AI Configuration Workflow Using Evidence',
  'CRS-IND-CL-089',
  'By the end of this course, the learner can improve a recurring workflow in Applied Industry AI Configuration by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact. Workplace problem: An improvement review finds that healthcare triage model configuration has repeated failures over the last 4 cycles, mainly linked to vertical workflow mismatch and weak local configuration. The expected volume is 37,346 rules, but only 34,989 rules are usable, creating a 6.3% variance against the control expectation. Triage priority rules misclassify 7 high-risk cases and local escalation SLA is missing for night shifts. The accepted rule is: critical workflow rules must match domain protocol before pilot. The learner receives vertical workflow requirement, configuration rule sheet, domain protocol extract, pilot case sample, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Applied Industry AI Configuration Review. The learner must study the trend, identify the control weakness, and propose a workflow improvement with before/after evidence. Artifact: Applied Industry AI Configuration Review - Improvement Proposal.',
  '14 hours',
  'Active',
  'Applied Industry AI Solutions; Computer Vision & Multimodal AI Engineering',
  'technical',
  '["By the end of this course, the learner can improve a recurring workflow in Applied Industry AI Configuration by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact","Learner demonstrates Applied Industry AI Configuration by interpreting real-looking numbers, comparing evidence from vertical workflow requirement and configuration rule sheet, and producing a decision-ready artifact","Proves the learner can perform workflow improvement work in Applied Industry AI Configuration with numeric evidence, workplace documents, and a reviewer-ready artifact. Status: Demo Ready"]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L4 Module: Applied Industry AI Configuration Workplace Mission
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-089' LIMIT 1),
  'L4 Module: Applied Industry AI Configuration Workplace Mission',
  'Industry requirement: Teams responsible for an applied industry AI solution need learners who can use numeric evidence, threshold rules, and workplace documents to make reliable decisions during healthcare triage model configuration, not only explain Applied Industry AI Configuration theoretically. Gap addressed: Academic learning may cover the concepts behind Applied Industry AI Configuration, but it usually does not make learners practice with vertical workflow requirement, configuration rule sheet, domain protocol extract, numeric variance, threshold decisions, and role handoff artifacts. Trigger: the same issue has repeated across at least 3 recent runs or reviews: 34,989 of 37,346 rules passed the check, variance 6.3%, with signal ''vertical workflow mismatch and weak local configuration''.',
  1,
  '["Data & AI","Applied Industry AI Solutions","Computer Vision & Multimodal AI Engineering","Applied Industry AI Configuration","Primary: Evidence. Supporting: Technical, Functional, Domain, Behavioural","vertical AI configuration","domain protocol mapping","local workflow adaptation","pilot validation evidence","configuration risk","expected 37,346 vs actual 34,989 rules","6.3% variance interpretation","threshold rule: critical workflow rules must match domain protocol before pilot","trend evidence","control redesign","before/after comparison"]'::jsonb,
  '["Engage: Learner receives a workflow improvement case: healthcare triage model configuration is at risk because only 34,989 of 37,346 rules passed the control and vertical workflow mismatch and weak local configuration is visible","Explore: Learner reviews vertical workflow requirement, configuration rule sheet, domain protocol extract, pilot case sample, stakeholder validation note, highlights the fields that prove the issue, and notes which values cross the threshold","Explain: Learner studies vertical AI configuration, domain protocol mapping, local workflow adaptation, pilot validation evidence and learns how these concepts explain the business risk, not just the technical error","Express: Learner prepares the Applied Industry AI Configuration Review with issue summary, numeric evidence, root-cause hypothesis, decision, and handoff note","Empower: Learner must propose a control change that reduces recurrence for healthcare triage model configuration","Evolve: Learner defines a before/after measure to prove the workflow improvement reduced repeat failures"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Scenario: Applied Industry AI Configuration Review - Improvement Proposal
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-089' LIMIT 1)
   AND title = 'L4 Module: Applied Industry AI Configuration Workplace Mission' LIMIT 1),
  'Workplace Scenario: Applied Industry AI Configuration Review - Improvement Proposal',
  'An improvement review finds that healthcare triage model configuration has repeated failures over the last 4 cycles, mainly linked to vertical workflow mismatch and weak local configuration. The expected volume is 37,346 rules, but only 34,989 rules are usable, creating a 6.3% variance against the control expectation. Triage priority rules misclassify 7 high-risk cases and local escalation SLA is missing for night shifts. The accepted rule is: critical workflow rules must match domain protocol before pilot. The learner receives vertical workflow requirement, configuration rule sheet, domain protocol extract, pilot case sample, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Applied Industry AI Configuration Review. The learner must study the trend, identify the control weakness, and propose a workflow improvement with before/after evidence. Pressure points: Healthcare triage model configuration is time-sensitive; variance is 6.3% against the rule; triage priority rules misclassify 7 high-risk cases and local escalation SLA is missing for night shifts; the issue is recurring, rework hours are increasing, and the team needs a preventive control.',
  'Course trigger: the same issue has repeated across at least 3 recent runs or reviews: 34,989 of 37,346 rules passed the check, variance 6.3%, with signal ''vertical workflow mismatch and weak local configuration''.
Problem statement: An improvement review finds that healthcare triage model configuration has repeated failures over the last 4 cycles, mainly linked to vertical workflow mismatch and weak local configuration. The expected volume is 37,346 rules, but only 34,989 rules are usable, creating a 6.3% variance against the control expectation. Triage priority rules misclassify 7 high-risk cases and local escalation SLA is missing for night shifts. The accepted rule is: critical workflow rules must match domain protocol before pilot. The learner receives vertical workflow requirement, configuration rule sheet, domain protocol extract, pilot case sample, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Applied Industry AI Configuration Review. The learner must study the trend, identify the control weakness, and propose a workflow improvement with before/after evidence.
Major concepts: vertical AI configuration; domain protocol mapping; local workflow adaptation; pilot validation evidence; configuration risk; expected 37,346 vs actual 34,989 rules; 6.3% variance interpretation; threshold rule: critical workflow rules must match domain protocol before pilot; trend evidence; control redesign; before/after comparison.
Root-cause focus: Find which repeated process weakness is causing: wrong domain rule, local workflow mismatch, missing escalation path, insufficient pilot evidence, or unsupported edge case. Evidence must come from vertical workflow requirement, configuration rule sheet, domain protocol extract.
Required data: vertical workflow requirement; configuration rule sheet; domain protocol extract; pilot case sample; stakeholder validation note; 4-cycle trend summary; rework-hours log; current workflow map
Artifact: Applied Industry AI Configuration Review - Improvement Proposal
Artifact structure: case summary; expected vs actual numbers; threshold rule; evidence table from vertical workflow requirement, configuration rule sheet, domain protocol extract; root-cause hypothesis; decision/action; risk note; role handoff; recurring trend evidence; proposed process change; before/after success metric.
Evidence fields to assess: captures expected 37,346 and actual 34,989 rules; calculates or explains 6.3% variance; uses threshold rule correctly (critical workflow rules must match domain protocol before pilot); cites at least three input documents; links evidence to root-cause hypothesis; states clear release/hold/correct/escalate decision; defines measurable improvement target; shows before/after control logic.
AI support tips: Use AI as a coach to ask evidence-checking questions, explain unfamiliar terms, compare possible root causes, and improve clarity. Do not use AI to invent numbers or make the decision without citing the provided documents.',
  1,
  '14 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech CSE - AI Product Engineering Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-089' LIMIT 1),
  'B.Tech CSE - AI Product Engineering Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech AI & Data Science - GenAI Application Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-089' LIMIT 1),
  'B.Tech AI & Data Science - GenAI Application Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MCA - AI Application Development Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-089' LIMIT 1),
  'MCA - AI Application Development Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MBA Product Management / Business Analytics - AI Product Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-089' LIMIT 1),
  'MBA Product Management / Business Analytics - AI Product Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PG Certificate - GenAI Product & Application Design
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-089' LIMIT 1),
  'PG Certificate - GenAI Product & Application Design',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech AI & Data Science - Applied Industry AI Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-089' LIMIT 1),
  'B.Tech AI & Data Science - Applied Industry AI Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Improve the Enterprise AI Adoption Roadmap Design Workflow Using Evidence
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Improve the Enterprise AI Adoption Roadmap Design Workflow Using Evidence',
  'CRS-IND-CL-094',
  'By the end of this course, the learner can improve a recurring workflow in Enterprise AI Adoption Roadmap Design by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact. Workplace problem: An improvement review finds that business-unit AI portfolio planning has repeated failures over the last 4 cycles, mainly linked to unprioritized initiatives with unclear feasibility and risk. The expected volume is 38,672 initiatives, but only 36,180 initiatives are usable, creating a 6.4% variance against the control expectation. 11 initiatives have high claimed value but no data-owner confirmation or adoption dependency map. The accepted rule is: phase-one initiatives must show value, feasibility, data readiness, and risk control. The learner receives AI initiative inventory, value-feasibility scoring sheet, data readiness checklist, risk dependency map, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Enterprise AI Adoption Roadmap Decision Pack. The learner must study the trend, identify the control weakness, and propose a workflow improvement with before/after evidence. Artifact: Enterprise AI Adoption Roadmap Decision Pack - Improvement Proposal.',
  '14 hours',
  'Active',
  'AI Adoption, Transformation, and Stakeholder Enablement',
  'technical',
  '["By the end of this course, the learner can improve a recurring workflow in Enterprise AI Adoption Roadmap Design by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact","Learner demonstrates Enterprise AI Adoption Roadmap Design by interpreting real-looking numbers, comparing evidence from AI initiative inventory and value-feasibility scoring sheet, and producing a decision-ready artifact","Proves the learner can perform workflow improvement work in Enterprise AI Adoption Roadmap Design with numeric evidence, workplace documents, and a reviewer-ready artifact. Status: Demo Ready"]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L4 Module: Enterprise AI Adoption Roadmap Design Workplace Mission
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-094' LIMIT 1),
  'L4 Module: Enterprise AI Adoption Roadmap Design Workplace Mission',
  'Industry requirement: Teams responsible for an enterprise AI adoption roadmap need learners who can use numeric evidence, threshold rules, and workplace documents to make reliable decisions during business-unit AI portfolio planning, not only explain Enterprise AI Adoption Roadmap Design theoretically. Gap addressed: Academic learning may cover the concepts behind Enterprise AI Adoption Roadmap Design, but it usually does not make learners practice with AI initiative inventory, value-feasibility scoring sheet, data readiness checklist, numeric variance, threshold decisions, and role handoff artifacts. Trigger: the same issue has repeated across at least 3 recent runs or reviews: 36,180 of 38,672 initiatives passed the check, variance 6.4%, with signal ''unprioritized initiatives with unclear feasibility and risk''.',
  1,
  '["Data & AI","AI Consulting & Transformation","AI Adoption, Transformation, and Stakeholder Enablement","Enterprise AI Adoption Roadmap Design","Primary: Functional. Supporting: Cognitive, Communication, AI/Digital, Behavioural","AI use-case prioritization","value-feasibility scoring","data readiness dependency","adoption risk","roadmap phasing","expected 38,672 vs actual 36,180 initiatives","6.4% variance interpretation","threshold rule: phase-one initiatives must show value, feasibility, data readiness, and risk control","trend evidence","control redesign","before/after comparison"]'::jsonb,
  '["Engage: Learner receives a workflow improvement case: business-unit AI portfolio planning is at risk because only 36,180 of 38,672 initiatives passed the control and unprioritized initiatives with unclear feasibility and risk is visible","Explore: Learner reviews AI initiative inventory, value-feasibility scoring sheet, data readiness checklist, risk dependency map, stakeholder prioritization notes, highlights the fields that prove the issue, and notes which values cross the threshold","Explain: Learner studies AI use-case prioritization, value-feasibility scoring, data readiness dependency, adoption risk and learns how these concepts explain the business risk, not just the technical error","Express: Learner prepares the Enterprise AI Adoption Roadmap Decision Pack with issue summary, numeric evidence, root-cause hypothesis, decision, and handoff note","Empower: Learner must propose a control change that reduces recurrence for business-unit AI portfolio planning","Evolve: Learner defines a before/after measure to prove the workflow improvement reduced repeat failures"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Scenario: Enterprise AI Adoption Roadmap Decision Pack - Improvement Proposal
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-094' LIMIT 1)
   AND title = 'L4 Module: Enterprise AI Adoption Roadmap Design Workplace Mission' LIMIT 1),
  'Workplace Scenario: Enterprise AI Adoption Roadmap Decision Pack - Improvement Proposal',
  'An improvement review finds that business-unit AI portfolio planning has repeated failures over the last 4 cycles, mainly linked to unprioritized initiatives with unclear feasibility and risk. The expected volume is 38,672 initiatives, but only 36,180 initiatives are usable, creating a 6.4% variance against the control expectation. 11 initiatives have high claimed value but no data-owner confirmation or adoption dependency map. The accepted rule is: phase-one initiatives must show value, feasibility, data readiness, and risk control. The learner receives AI initiative inventory, value-feasibility scoring sheet, data readiness checklist, risk dependency map, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Enterprise AI Adoption Roadmap Decision Pack. The learner must study the trend, identify the control weakness, and propose a workflow improvement with before/after evidence. Pressure points: Business-unit ai portfolio planning is time-sensitive; variance is 6.4% against the rule; 11 initiatives have high claimed value but no data-owner confirmation or adoption dependency map; the issue is recurring, rework hours are increasing, and the team needs a preventive control.',
  'Course trigger: the same issue has repeated across at least 3 recent runs or reviews: 36,180 of 38,672 initiatives passed the check, variance 6.4%, with signal ''unprioritized initiatives with unclear feasibility and risk''.
Problem statement: An improvement review finds that business-unit AI portfolio planning has repeated failures over the last 4 cycles, mainly linked to unprioritized initiatives with unclear feasibility and risk. The expected volume is 38,672 initiatives, but only 36,180 initiatives are usable, creating a 6.4% variance against the control expectation. 11 initiatives have high claimed value but no data-owner confirmation or adoption dependency map. The accepted rule is: phase-one initiatives must show value, feasibility, data readiness, and risk control. The learner receives AI initiative inventory, value-feasibility scoring sheet, data readiness checklist, risk dependency map, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Enterprise AI Adoption Roadmap Decision Pack. The learner must study the trend, identify the control weakness, and propose a workflow improvement with before/after evidence.
Major concepts: AI use-case prioritization; value-feasibility scoring; data readiness dependency; adoption risk; roadmap phasing; expected 38,672 vs actual 36,180 initiatives; 6.4% variance interpretation; threshold rule: phase-one initiatives must show value, feasibility, data readiness, and risk control; trend evidence; control redesign; before/after comparison.
Root-cause focus: Find which repeated process weakness is causing: inflated business value, weak data readiness, missing sponsor, unplanned change-management effort, or unmapped risk dependency. Evidence must come from AI initiative inventory, value-feasibility scoring sheet, data readiness checklist.
Required data: AI initiative inventory; value-feasibility scoring sheet; data readiness checklist; risk dependency map; stakeholder prioritization notes; 4-cycle trend summary; rework-hours log; current workflow map
Artifact: Enterprise AI Adoption Roadmap Decision Pack - Improvement Proposal
Artifact structure: case summary; expected vs actual numbers; threshold rule; evidence table from AI initiative inventory, value-feasibility scoring sheet, data readiness checklist; root-cause hypothesis; decision/action; risk note; role handoff; recurring trend evidence; proposed process change; before/after success metric.
Evidence fields to assess: captures expected 38,672 and actual 36,180 initiatives; calculates or explains 6.4% variance; uses threshold rule correctly (phase-one initiatives must show value, feasibility, data readiness, and risk control); cites at least three input documents; links evidence to root-cause hypothesis; states clear release/hold/correct/escalate decision; defines measurable improvement target; shows before/after control logic.
AI support tips: Use AI as a coach to ask evidence-checking questions, explain unfamiliar terms, compare possible root causes, and improve clarity. Do not use AI to invent numbers or make the decision without citing the provided documents.',
  1,
  '14 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MBA Business Analytics - AI Transformation Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-094' LIMIT 1),
  'MBA Business Analytics - AI Transformation Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BBA Business Analytics - AI Adoption Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-094' LIMIT 1),
  'BBA Business Analytics - AI Adoption Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech AI & Data Science - AI Consulting Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-094' LIMIT 1),
  'B.Tech AI & Data Science - AI Consulting Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PG Certificate - AI Strategy & Transformation
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-094' LIMIT 1),
  'PG Certificate - AI Strategy & Transformation',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: Executive Program - AI Adoption & Change Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-094' LIMIT 1),
  'Executive Program - AI Adoption & Change Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Improve the AI Training Data Quality Control Workflow Using Evidence
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Improve the AI Training Data Quality Control Workflow Using Evidence',
  'CRS-IND-CL-099',
  'By the end of this course, the learner can improve a recurring workflow in AI Training Data Quality Control by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact. Workplace problem: An improvement review finds that dataset release quality gate has repeated failures over the last 4 cycles, mainly linked to label disagreement and quality-control failure. The expected volume is 116,000 records, but only 101,650 records are usable, creating a 12.4% variance against the control expectation. Inter-annotator agreement is 84% for safety labels and 1,260 records have unresolved adjudication. The accepted rule is: critical label agreement must exceed 92% before release. The learner receives labeling guideline, annotator disagreement report, gold-standard sample, adjudication queue, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the AI Training Data Quality Control Pack. The learner must study the trend, identify the control weakness, and propose a workflow improvement with before/after evidence. Artifact: AI Training Data Quality Control Pack - Improvement Proposal.',
  '14 hours',
  'Active',
  'Synthetic Data, Labeling & Semantic Operations',
  'technical',
  '["By the end of this course, the learner can improve a recurring workflow in AI Training Data Quality Control by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact","Learner demonstrates AI Training Data Quality Control by interpreting real-looking numbers, comparing evidence from labeling guideline and annotator disagreement report, and producing a decision-ready artifact","Proves the learner can perform workflow improvement work in AI Training Data Quality Control with numeric evidence, workplace documents, and a reviewer-ready artifact. Status: Pilot Ready — Evidence Strengthening Needed"]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L4 Module: AI Training Data Quality Control Workplace Mission
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-099' LIMIT 1),
  'L4 Module: AI Training Data Quality Control Workplace Mission',
  'Industry requirement: Teams responsible for an AI training data labeling operation need learners who can use numeric evidence, threshold rules, and workplace documents to make reliable decisions during dataset release quality gate, not only explain AI Training Data Quality Control theoretically. Gap addressed: Academic learning may cover the concepts behind AI Training Data Quality Control, but it usually does not make learners practice with labeling guideline, annotator disagreement report, gold-standard sample, numeric variance, threshold decisions, and role handoff artifacts. Trigger: the same issue has repeated across at least 3 recent runs or reviews: 101,650 of 116,000 records passed the check, variance 12.4%, with signal ''label disagreement and quality-control failure''.',
  1,
  '["Data & AI","Synthetic Data, Labeling & Semantic Operations","AI Training Data Quality Control","Primary: Evidence. Supporting: Domain, Technical, AI/Digital, Behavioural","inter-annotator agreement","gold-standard validation","label adjudication","dataset release threshold","annotation quality audit","expected 116,000 vs actual 101,650 records","12.4% variance interpretation","threshold rule: critical label agreement must exceed 92% before release","trend evidence","control redesign","before/after comparison"]'::jsonb,
  '["Engage: Learner receives a workflow improvement case: dataset release quality gate is at risk because only 101,650 of 116,000 records passed the control and label disagreement and quality-control failure is visible","Explore: Learner reviews labeling guideline, annotator disagreement report, gold-standard sample, adjudication queue, dataset release checklist, highlights the fields that prove the issue, and notes which values cross the threshold","Explain: Learner studies inter-annotator agreement, gold-standard validation, label adjudication, dataset release threshold and learns how these concepts explain the business risk, not just the technical error","Express: Learner prepares the AI Training Data Quality Control Pack with issue summary, numeric evidence, root-cause hypothesis, decision, and handoff note","Empower: Learner must propose a control change that reduces recurrence for dataset release quality gate","Evolve: Learner defines a before/after measure to prove the workflow improvement reduced repeat failures"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Scenario: AI Training Data Quality Control Pack - Improvement Proposal
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-099' LIMIT 1)
   AND title = 'L4 Module: AI Training Data Quality Control Workplace Mission' LIMIT 1),
  'Workplace Scenario: AI Training Data Quality Control Pack - Improvement Proposal',
  'An improvement review finds that dataset release quality gate has repeated failures over the last 4 cycles, mainly linked to label disagreement and quality-control failure. The expected volume is 116,000 records, but only 101,650 records are usable, creating a 12.4% variance against the control expectation. Inter-annotator agreement is 84% for safety labels and 1,260 records have unresolved adjudication. The accepted rule is: critical label agreement must exceed 92% before release. The learner receives labeling guideline, annotator disagreement report, gold-standard sample, adjudication queue, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the AI Training Data Quality Control Pack. The learner must study the trend, identify the control weakness, and propose a workflow improvement with before/after evidence. Pressure points: Dataset release quality gate is time-sensitive; variance is 12.4% against the rule; inter-annotator agreement is 84% for safety labels and 1,260 records have unresolved adjudication; the issue is recurring, rework hours are increasing, and the team needs a preventive control.',
  'Course trigger: the same issue has repeated across at least 3 recent runs or reviews: 101,650 of 116,000 records passed the check, variance 12.4%, with signal ''label disagreement and quality-control failure''.
Problem statement: An improvement review finds that dataset release quality gate has repeated failures over the last 4 cycles, mainly linked to label disagreement and quality-control failure. The expected volume is 116,000 records, but only 101,650 records are usable, creating a 12.4% variance against the control expectation. Inter-annotator agreement is 84% for safety labels and 1,260 records have unresolved adjudication. The accepted rule is: critical label agreement must exceed 92% before release. The learner receives labeling guideline, annotator disagreement report, gold-standard sample, adjudication queue, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the AI Training Data Quality Control Pack. The learner must study the trend, identify the control weakness, and propose a workflow improvement with before/after evidence.
Major concepts: inter-annotator agreement; gold-standard validation; label adjudication; dataset release threshold; annotation quality audit; expected 116,000 vs actual 101,650 records; 12.4% variance interpretation; threshold rule: critical label agreement must exceed 92% before release; trend evidence; control redesign; before/after comparison.
Root-cause focus: Find which repeated process weakness is causing: ambiguous labeling rule, annotator training gap, weak gold-standard sample, unresolved adjudication, or class imbalance. Evidence must come from labeling guideline, annotator disagreement report, gold-standard sample.
Required data: labeling guideline; annotator disagreement report; gold-standard sample; adjudication queue; dataset release checklist; 4-cycle trend summary; rework-hours log; current workflow map
Artifact: AI Training Data Quality Control Pack - Improvement Proposal
Artifact structure: case summary; expected vs actual numbers; threshold rule; evidence table from labeling guideline, annotator disagreement report, gold-standard sample; root-cause hypothesis; decision/action; risk note; role handoff; recurring trend evidence; proposed process change; before/after success metric.
Evidence fields to assess: captures expected 116,000 and actual 101,650 records; calculates or explains 12.4% variance; uses threshold rule correctly (critical label agreement must exceed 92% before release); cites at least three input documents; links evidence to root-cause hypothesis; states clear release/hold/correct/escalate decision; defines measurable improvement target; shows before/after control logic.
AI support tips: Use AI as a coach to ask evidence-checking questions, explain unfamiliar terms, compare possible root causes, and improve clarity. Do not use AI to invent numbers or make the decision without citing the provided documents.',
  1,
  '14 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech CSE - Data Engineering Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-099' LIMIT 1),
  'B.Tech CSE - Data Engineering Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech AI & Data Science - Data Platform Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-099' LIMIT 1),
  'B.Tech AI & Data Science - Data Platform Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Data Science - Data Engineering Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-099' LIMIT 1),
  'B.Sc Data Science - Data Engineering Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MCA - Data Engineering / Cloud Data Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-099' LIMIT 1),
  'MCA - Data Engineering / Cloud Data Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Tech Data Engineering / Big Data Systems
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-099' LIMIT 1),
  'M.Tech Data Engineering / Big Data Systems',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Data Science - Data Operations Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-099' LIMIT 1),
  'B.Sc Data Science - Data Operations Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Improve the Semantic Knowledge Graph Validation Workflow Using Evidence
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Improve the Semantic Knowledge Graph Validation Workflow Using Evidence',
  'CRS-IND-CL-104',
  'By the end of this course, the learner can improve a recurring workflow in Semantic Knowledge Graph Validation by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact. Workplace problem: An improvement review finds that entity-relation validation before search rollout has repeated failures over the last 4 cycles, mainly linked to duplicate entities and invalid relationships. The expected volume is 356,370 triples, but only 301,140 triples are usable, creating a 15.5% variance against the control expectation. 4,800 customer entities are duplicated and 2.9% of supplier-to-product edges violate ontology rules. The accepted rule is: critical relation errors must remain below 1% before rollout. The learner receives ontology rule sheet, entity resolution sample, relationship validation report, SPARQL error extract, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Semantic Knowledge Graph Validation Pack. The learner must study the trend, identify the control weakness, and propose a workflow improvement with before/after evidence. Artifact: Semantic Knowledge Graph Validation Pack - Improvement Proposal.',
  '14 hours',
  'Active',
  'Synthetic Data, Labeling & Semantic Operations',
  'technical',
  '["By the end of this course, the learner can improve a recurring workflow in Semantic Knowledge Graph Validation by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact","Learner demonstrates Semantic Knowledge Graph Validation by interpreting real-looking numbers, comparing evidence from ontology rule sheet and entity resolution sample, and producing a decision-ready artifact","Proves the learner can perform workflow improvement work in Semantic Knowledge Graph Validation with numeric evidence, workplace documents, and a reviewer-ready artifact. Status: Pilot Ready — Evidence Strengthening Needed"]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L4 Module: Semantic Knowledge Graph Validation Workplace Mission
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-104' LIMIT 1),
  'L4 Module: Semantic Knowledge Graph Validation Workplace Mission',
  'Industry requirement: Teams responsible for a semantic knowledge graph need learners who can use numeric evidence, threshold rules, and workplace documents to make reliable decisions during entity-relation validation before search rollout, not only explain Semantic Knowledge Graph Validation theoretically. Gap addressed: Academic learning may cover the concepts behind Semantic Knowledge Graph Validation, but it usually does not make learners practice with ontology rule sheet, entity resolution sample, relationship validation report, numeric variance, threshold decisions, and role handoff artifacts. Trigger: the same issue has repeated across at least 3 recent runs or reviews: 301,140 of 356,370 triples passed the check, variance 15.5%, with signal ''duplicate entities and invalid relationships''.',
  1,
  '["Data & AI","Synthetic Data, Labeling & Semantic Operations","Semantic Knowledge Graph Validation","Primary: Evidence. Supporting: Domain, Technical, AI/Digital, Behavioural","entity resolution","ontology constraint","relationship validation","graph quality rule","semantic search impact","expected 356,370 vs actual 301,140 triples","15.5% variance interpretation","threshold rule: critical relation errors must remain below 1% before rollout","trend evidence","control redesign","before/after comparison"]'::jsonb,
  '["Engage: Learner receives a workflow improvement case: entity-relation validation before search rollout is at risk because only 301,140 of 356,370 triples passed the control and duplicate entities and invalid relationships is visible","Explore: Learner reviews ontology rule sheet, entity resolution sample, relationship validation report, SPARQL error extract, search relevance issue log, highlights the fields that prove the issue, and notes which values cross the threshold","Explain: Learner studies entity resolution, ontology constraint, relationship validation, graph quality rule and learns how these concepts explain the business risk, not just the technical error","Express: Learner prepares the Semantic Knowledge Graph Validation Pack with issue summary, numeric evidence, root-cause hypothesis, decision, and handoff note","Empower: Learner must propose a control change that reduces recurrence for entity-relation validation before search rollout","Evolve: Learner defines a before/after measure to prove the workflow improvement reduced repeat failures"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Scenario: Semantic Knowledge Graph Validation Pack - Improvement Proposal
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-104' LIMIT 1)
   AND title = 'L4 Module: Semantic Knowledge Graph Validation Workplace Mission' LIMIT 1),
  'Workplace Scenario: Semantic Knowledge Graph Validation Pack - Improvement Proposal',
  'An improvement review finds that entity-relation validation before search rollout has repeated failures over the last 4 cycles, mainly linked to duplicate entities and invalid relationships. The expected volume is 356,370 triples, but only 301,140 triples are usable, creating a 15.5% variance against the control expectation. 4,800 customer entities are duplicated and 2.9% of supplier-to-product edges violate ontology rules. The accepted rule is: critical relation errors must remain below 1% before rollout. The learner receives ontology rule sheet, entity resolution sample, relationship validation report, SPARQL error extract, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Semantic Knowledge Graph Validation Pack. The learner must study the trend, identify the control weakness, and propose a workflow improvement with before/after evidence. Pressure points: Entity-relation validation before search rollout is time-sensitive; variance is 15.5% against the rule; 4,800 customer entities are duplicated and 2.9% of supplier-to-product edges violate ontology rules; the issue is recurring, rework hours are increasing, and the team needs a preventive control.',
  'Course trigger: the same issue has repeated across at least 3 recent runs or reviews: 301,140 of 356,370 triples passed the check, variance 15.5%, with signal ''duplicate entities and invalid relationships''.
Problem statement: An improvement review finds that entity-relation validation before search rollout has repeated failures over the last 4 cycles, mainly linked to duplicate entities and invalid relationships. The expected volume is 356,370 triples, but only 301,140 triples are usable, creating a 15.5% variance against the control expectation. 4,800 customer entities are duplicated and 2.9% of supplier-to-product edges violate ontology rules. The accepted rule is: critical relation errors must remain below 1% before rollout. The learner receives ontology rule sheet, entity resolution sample, relationship validation report, SPARQL error extract, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Semantic Knowledge Graph Validation Pack. The learner must study the trend, identify the control weakness, and propose a workflow improvement with before/after evidence.
Major concepts: entity resolution; ontology constraint; relationship validation; graph quality rule; semantic search impact; expected 356,370 vs actual 301,140 triples; 15.5% variance interpretation; threshold rule: critical relation errors must remain below 1% before rollout; trend evidence; control redesign; before/after comparison.
Root-cause focus: Find which repeated process weakness is causing: entity duplication, wrong relationship type, ontology constraint violation, stale source mapping, or weak synonym handling. Evidence must come from ontology rule sheet, entity resolution sample, relationship validation report.
Required data: ontology rule sheet; entity resolution sample; relationship validation report; SPARQL error extract; search relevance issue log; 4-cycle trend summary; rework-hours log; current workflow map
Artifact: Semantic Knowledge Graph Validation Pack - Improvement Proposal
Artifact structure: case summary; expected vs actual numbers; threshold rule; evidence table from ontology rule sheet, entity resolution sample, relationship validation report; root-cause hypothesis; decision/action; risk note; role handoff; recurring trend evidence; proposed process change; before/after success metric.
Evidence fields to assess: captures expected 356,370 and actual 301,140 triples; calculates or explains 15.5% variance; uses threshold rule correctly (critical relation errors must remain below 1% before rollout); cites at least three input documents; links evidence to root-cause hypothesis; states clear release/hold/correct/escalate decision; defines measurable improvement target; shows before/after control logic.
AI support tips: Use AI as a coach to ask evidence-checking questions, explain unfamiliar terms, compare possible root causes, and improve clarity. Do not use AI to invent numbers or make the decision without citing the provided documents.',
  1,
  '14 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech CSE - Data Engineering Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-104' LIMIT 1),
  'B.Tech CSE - Data Engineering Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech AI & Data Science - Data Platform Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-104' LIMIT 1),
  'B.Tech AI & Data Science - Data Platform Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Data Science - Data Engineering Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-104' LIMIT 1),
  'B.Sc Data Science - Data Engineering Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MCA - Data Engineering / Cloud Data Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-104' LIMIT 1),
  'MCA - Data Engineering / Cloud Data Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Tech Data Engineering / Big Data Systems
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-104' LIMIT 1),
  'M.Tech Data Engineering / Big Data Systems',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Data Science - Data Operations Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-104' LIMIT 1),
  'B.Sc Data Science - Data Operations Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Set Review Standards for Lakehouse Pipeline Controls
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Set Review Standards for Lakehouse Pipeline Controls',
  'CRS-IND-CL-005',
  'By the end of this course, the learner can set measurable standards for Lakehouse Pipeline Controls by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact. Workplace problem: A standards review is called because multiple teams handle daily revenue dashboard refresh differently when a retail sales lakehouse pipeline shows bronze-to-silver load variance and a schema warning. The expected volume is 114,170 records, but only 93,640 records are usable, creating a 18.0% variance against the control expectation. The `discount_code` field is missing in 14% of rows and `customer_region` has a new APAC-South value. The accepted rule is: record variance must stay under 1.5%. The learner receives pipeline failure log, source file profile, schema comparison sheet, record completeness report, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Lakehouse Pipeline Control Exception Note. The learner must define review rules, evidence standards, escalation thresholds, and coaching notes for future cases. Artifact: Lakehouse Pipeline Control Exception Note - Standards and Review Pack.',
  '16 hours',
  'Active',
  'Data Engineering & Lakehouse Operations',
  'technical',
  '["By the end of this course, the learner can set measurable standards for Lakehouse Pipeline Controls by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact","Learner demonstrates Lakehouse Pipeline Controls by interpreting real-looking numbers, comparing evidence from pipeline failure log and source file profile, and producing a decision-ready artifact","Proves the learner can perform standards and governance work in Lakehouse Pipeline Controls with numeric evidence, workplace documents, and a reviewer-ready artifact. Status: Demo Ready"]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L5 Module: Lakehouse Pipeline Controls Workplace Mission
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-005' LIMIT 1),
  'L5 Module: Lakehouse Pipeline Controls Workplace Mission',
  'Industry requirement: Teams responsible for a retail sales lakehouse pipeline need learners who can use numeric evidence, threshold rules, and workplace documents to make reliable decisions during daily revenue dashboard refresh, not only explain Lakehouse Pipeline Controls theoretically. Gap addressed: Academic learning may cover the concepts behind Lakehouse Pipeline Controls, but it usually does not make learners practice with pipeline failure log, source file profile, schema comparison sheet, numeric variance, threshold decisions, and role handoff artifacts. Trigger: leaders need a standard rule so different teams stop making inconsistent decisions: 93,640 of 114,170 records passed the check, variance 18.0%, with signal ''bronze-to-silver load variance and a schema warning''.',
  1,
  '["Data & AI","Data Platform Engineering","Data Engineering & Lakehouse Operations","Lakehouse Pipeline Controls","Primary: Evidence. Supporting: Technical, Functional, Domain, Behavioural","expected vs actual record-count variance","schema version mismatch","source-to-bronze reconciliation","bronze-to-silver completeness check","dashboard release hold decision","expected 114,170 vs actual 93,640 records","18.0% variance interpretation","threshold rule: record variance must stay under 1.5%","review standard definition","auditability","coaching rule"]'::jsonb,
  '["Engage: Learner receives a standards and governance case: daily revenue dashboard refresh is at risk because only 93,640 of 114,170 records passed the control and bronze-to-silver load variance and a schema warning is visible","Explore: Learner reviews pipeline failure log, source file profile, schema comparison sheet, record completeness report, dashboard refresh note, highlights the fields that prove the issue, and notes which values cross the threshold","Explain: Learner studies expected vs actual record-count variance, schema version mismatch, source-to-bronze reconciliation, bronze-to-silver completeness check and learns how these concepts explain the business risk, not just the technical error","Express: Learner prepares the Lakehouse Pipeline Control Exception Note with issue summary, numeric evidence, root-cause hypothesis, decision, and handoff note","Empower: Learner must define standards, thresholds, and reviewer responsibilities for daily revenue dashboard refresh","Evolve: Learner creates a coaching note so another reviewer can apply the standard consistently"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Scenario: Lakehouse Pipeline Control Exception Note - Standards and Review Pack
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-005' LIMIT 1)
   AND title = 'L5 Module: Lakehouse Pipeline Controls Workplace Mission' LIMIT 1),
  'Workplace Scenario: Lakehouse Pipeline Control Exception Note - Standards and Review Pack',
  'A standards review is called because multiple teams handle daily revenue dashboard refresh differently when a retail sales lakehouse pipeline shows bronze-to-silver load variance and a schema warning. The expected volume is 114,170 records, but only 93,640 records are usable, creating a 18.0% variance against the control expectation. The `discount_code` field is missing in 14% of rows and `customer_region` has a new APAC-South value. The accepted rule is: record variance must stay under 1.5%. The learner receives pipeline failure log, source file profile, schema comparison sheet, record completeness report, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Lakehouse Pipeline Control Exception Note. The learner must define review rules, evidence standards, escalation thresholds, and coaching notes for future cases. Pressure points: Daily revenue dashboard refresh is time-sensitive; variance is 18.0% against the rule; the `discount_code` field is missing in 14% of rows and `customer_region` has a new APAC-South value; multiple teams need a common standard, audit trace, and coaching rule for future decisions.',
  'Course trigger: leaders need a standard rule so different teams stop making inconsistent decisions: 93,640 of 114,170 records passed the check, variance 18.0%, with signal ''bronze-to-silver load variance and a schema warning''.
Problem statement: A standards review is called because multiple teams handle daily revenue dashboard refresh differently when a retail sales lakehouse pipeline shows bronze-to-silver load variance and a schema warning. The expected volume is 114,170 records, but only 93,640 records are usable, creating a 18.0% variance against the control expectation. The `discount_code` field is missing in 14% of rows and `customer_region` has a new APAC-South value. The accepted rule is: record variance must stay under 1.5%. The learner receives pipeline failure log, source file profile, schema comparison sheet, record completeness report, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Lakehouse Pipeline Control Exception Note. The learner must define review rules, evidence standards, escalation thresholds, and coaching notes for future cases.
Major concepts: expected vs actual record-count variance; schema version mismatch; source-to-bronze reconciliation; bronze-to-silver completeness check; dashboard release hold decision; expected 114,170 vs actual 93,640 records; 18.0% variance interpretation; threshold rule: record variance must stay under 1.5%; review standard definition; auditability; coaching rule.
Root-cause focus: Define standards that distinguish: source extract cut-off, schema drift, failed ingestion batch, transformation join loss, or late-arriving partition. Evidence must come from pipeline failure log, source file profile, schema comparison sheet.
Required data: pipeline failure log; source file profile; schema comparison sheet; record completeness report; dashboard refresh note; audit observation summary; cross-team decision examples; standard template draft
Artifact: Lakehouse Pipeline Control Exception Note - Standards and Review Pack
Artifact structure: case summary; expected vs actual numbers; threshold rule; evidence table from pipeline failure log, source file profile, schema comparison sheet; root-cause hypothesis; decision/action; risk note; role handoff; standard operating rule; reviewer checklist; escalation matrix; coaching note; audit evidence requirement.
Evidence fields to assess: captures expected 114,170 and actual 93,640 records; calculates or explains 18.0% variance; uses threshold rule correctly (record variance must stay under 1.5%); cites at least three input documents; links evidence to root-cause hypothesis; states clear release/hold/correct/escalate decision; defines standard review rule; creates audit-ready reviewer criteria.
AI support tips: Use AI as a coach to ask evidence-checking questions, explain unfamiliar terms, compare possible root causes, and improve clarity. Do not use AI to invent numbers or make the decision without citing the provided documents.',
  1,
  '16 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech CSE - Data Engineering Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-005' LIMIT 1),
  'B.Tech CSE - Data Engineering Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech AI & Data Science - Data Platform Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-005' LIMIT 1),
  'B.Tech AI & Data Science - Data Platform Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Data Science - Data Engineering Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-005' LIMIT 1),
  'B.Sc Data Science - Data Engineering Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MCA - Data Engineering / Cloud Data Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-005' LIMIT 1),
  'MCA - Data Engineering / Cloud Data Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Tech Data Engineering / Big Data Systems
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-005' LIMIT 1),
  'M.Tech Data Engineering / Big Data Systems',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Set Review Standards for Gold Data Product Publishing
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Set Review Standards for Gold Data Product Publishing',
  'CRS-IND-CL-010',
  'By the end of this course, the learner can set measurable standards for Gold Data Product Publishing by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact. Workplace problem: A standards review is called because multiple teams handle monthly margin KPI publication differently when a finance gold data product shows metric grain mismatch and duplicate account totals. The expected volume is 62,340 rows, but only 57,280 rows are usable, creating a 8.1% variance against the control expectation. The `net_margin_pct` measure differs by 2.8 points between semantic layer and finance workbook. The accepted rule is: KPI variance must be below 0.5% before certification. The learner receives KPI definition note, gold table grain mapping, semantic measure validation sheet, finance reconciliation extract, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Gold Data Product Publishing Sign-off Pack. The learner must define review rules, evidence standards, escalation thresholds, and coaching notes for future cases. Artifact: Gold Data Product Publishing Sign-off Pack - Standards and Review Pack.',
  '16 hours',
  'Active',
  'Data Platform Engineering; BI & Reporting Analytics',
  'technical',
  '["By the end of this course, the learner can set measurable standards for Gold Data Product Publishing by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact","Learner demonstrates Gold Data Product Publishing by interpreting real-looking numbers, comparing evidence from KPI definition note and gold table grain mapping, and producing a decision-ready artifact","Proves the learner can perform standards and governance work in Gold Data Product Publishing with numeric evidence, workplace documents, and a reviewer-ready artifact. Status: Demo Ready"]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L5 Module: Gold Data Product Publishing Workplace Mission
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-010' LIMIT 1),
  'L5 Module: Gold Data Product Publishing Workplace Mission',
  'Industry requirement: Teams responsible for a finance gold data product need learners who can use numeric evidence, threshold rules, and workplace documents to make reliable decisions during monthly margin KPI publication, not only explain Gold Data Product Publishing theoretically. Gap addressed: Academic learning may cover the concepts behind Gold Data Product Publishing, but it usually does not make learners practice with KPI definition note, gold table grain mapping, semantic measure validation sheet, numeric variance, threshold decisions, and role handoff artifacts. Trigger: leaders need a standard rule so different teams stop making inconsistent decisions: 57,280 of 62,340 rows passed the check, variance 8.1%, with signal ''metric grain mismatch and duplicate account totals''.',
  1,
  '["Data & AI","Data Platform Engineering","BI & Reporting Analytics","Gold Data Product Publishing","Primary: Evidence. Supporting: Technical, Functional, Domain, Behavioural","metric grain control","semantic measure validation","consumer-ready data product certification","KPI definition sign-off","duplicate total reconciliation","expected 62,340 vs actual 57,280 rows","8.1% variance interpretation","threshold rule: KPI variance must be below 0.5% before certification","review standard definition","auditability","coaching rule"]'::jsonb,
  '["Engage: Learner receives a standards and governance case: monthly margin KPI publication is at risk because only 57,280 of 62,340 rows passed the control and metric grain mismatch and duplicate account totals is visible","Explore: Learner reviews KPI definition note, gold table grain mapping, semantic measure validation sheet, finance reconciliation extract, consumer sign-off request, highlights the fields that prove the issue, and notes which values cross the threshold","Explain: Learner studies metric grain control, semantic measure validation, consumer-ready data product certification, KPI definition sign-off and learns how these concepts explain the business risk, not just the technical error","Express: Learner prepares the Gold Data Product Publishing Sign-off Pack with issue summary, numeric evidence, root-cause hypothesis, decision, and handoff note","Empower: Learner must define standards, thresholds, and reviewer responsibilities for monthly margin KPI publication","Evolve: Learner creates a coaching note so another reviewer can apply the standard consistently"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Scenario: Gold Data Product Publishing Sign-off Pack - Standards and Review Pack
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-010' LIMIT 1)
   AND title = 'L5 Module: Gold Data Product Publishing Workplace Mission' LIMIT 1),
  'Workplace Scenario: Gold Data Product Publishing Sign-off Pack - Standards and Review Pack',
  'A standards review is called because multiple teams handle monthly margin KPI publication differently when a finance gold data product shows metric grain mismatch and duplicate account totals. The expected volume is 62,340 rows, but only 57,280 rows are usable, creating a 8.1% variance against the control expectation. The `net_margin_pct` measure differs by 2.8 points between semantic layer and finance workbook. The accepted rule is: KPI variance must be below 0.5% before certification. The learner receives KPI definition note, gold table grain mapping, semantic measure validation sheet, finance reconciliation extract, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Gold Data Product Publishing Sign-off Pack. The learner must define review rules, evidence standards, escalation thresholds, and coaching notes for future cases. Pressure points: Monthly margin kpi publication is time-sensitive; variance is 8.1% against the rule; the `net_margin_pct` measure differs by 2.8 points between semantic layer and finance workbook; multiple teams need a common standard, audit trace, and coaching rule for future decisions.',
  'Course trigger: leaders need a standard rule so different teams stop making inconsistent decisions: 57,280 of 62,340 rows passed the check, variance 8.1%, with signal ''metric grain mismatch and duplicate account totals''.
Problem statement: A standards review is called because multiple teams handle monthly margin KPI publication differently when a finance gold data product shows metric grain mismatch and duplicate account totals. The expected volume is 62,340 rows, but only 57,280 rows are usable, creating a 8.1% variance against the control expectation. The `net_margin_pct` measure differs by 2.8 points between semantic layer and finance workbook. The accepted rule is: KPI variance must be below 0.5% before certification. The learner receives KPI definition note, gold table grain mapping, semantic measure validation sheet, finance reconciliation extract, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Gold Data Product Publishing Sign-off Pack. The learner must define review rules, evidence standards, escalation thresholds, and coaching notes for future cases.
Major concepts: metric grain control; semantic measure validation; consumer-ready data product certification; KPI definition sign-off; duplicate total reconciliation; expected 62,340 vs actual 57,280 rows; 8.1% variance interpretation; threshold rule: KPI variance must be below 0.5% before certification; review standard definition; auditability; coaching rule.
Root-cause focus: Define standards that distinguish: wrong aggregation grain, duplicate account mapping, stale semantic measure, incorrect filter context, or unapproved KPI definition. Evidence must come from KPI definition note, gold table grain mapping, semantic measure validation sheet.
Required data: KPI definition note; gold table grain mapping; semantic measure validation sheet; finance reconciliation extract; consumer sign-off request; audit observation summary; cross-team decision examples; standard template draft
Artifact: Gold Data Product Publishing Sign-off Pack - Standards and Review Pack
Artifact structure: case summary; expected vs actual numbers; threshold rule; evidence table from KPI definition note, gold table grain mapping, semantic measure validation sheet; root-cause hypothesis; decision/action; risk note; role handoff; standard operating rule; reviewer checklist; escalation matrix; coaching note; audit evidence requirement.
Evidence fields to assess: captures expected 62,340 and actual 57,280 rows; calculates or explains 8.1% variance; uses threshold rule correctly (KPI variance must be below 0.5% before certification); cites at least three input documents; links evidence to root-cause hypothesis; states clear release/hold/correct/escalate decision; defines standard review rule; creates audit-ready reviewer criteria.
AI support tips: Use AI as a coach to ask evidence-checking questions, explain unfamiliar terms, compare possible root causes, and improve clarity. Do not use AI to invent numbers or make the decision without citing the provided documents.',
  1,
  '16 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech CSE - Data Engineering Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-010' LIMIT 1),
  'B.Tech CSE - Data Engineering Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech AI & Data Science - Data Platform Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-010' LIMIT 1),
  'B.Tech AI & Data Science - Data Platform Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Data Science - Data Engineering Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-010' LIMIT 1),
  'B.Sc Data Science - Data Engineering Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MCA - Data Engineering / Cloud Data Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-010' LIMIT 1),
  'MCA - Data Engineering / Cloud Data Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Tech Data Engineering / Big Data Systems
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-010' LIMIT 1),
  'M.Tech Data Engineering / Big Data Systems',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Data Science - BI & Analytics Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-010' LIMIT 1),
  'B.Sc Data Science - BI & Analytics Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Set Review Standards for Streaming Contract Stabilization
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Set Review Standards for Streaming Contract Stabilization',
  'CRS-IND-CL-015',
  'By the end of this course, the learner can set measurable standards for Streaming Contract Stabilization by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact. Workplace problem: A standards review is called because multiple teams handle real-time personalization feed differently when a streaming customer-event contract shows stream contract violations and late event spikes. The expected volume is 200,910 events, but only 166,770 events are usable, creating a 17.0% variance against the control expectation. 7.6% of events arrive after the 5-minute SLA and the `session_id` type changed from string to integer. The accepted rule is: contract violations must remain below 0.8%. The learner receives stream contract spec, Kafka topic error log, late-arrival summary, schema registry diff, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Streaming Contract Stabilization Report. The learner must define review rules, evidence standards, escalation thresholds, and coaching notes for future cases. Artifact: Streaming Contract Stabilization Report - Standards and Review Pack.',
  '16 hours',
  'Active',
  'Data Engineering & Lakehouse Operations',
  'technical',
  '["By the end of this course, the learner can set measurable standards for Streaming Contract Stabilization by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact","Learner demonstrates Streaming Contract Stabilization by interpreting real-looking numbers, comparing evidence from stream contract spec and Kafka topic error log, and producing a decision-ready artifact","Proves the learner can perform standards and governance work in Streaming Contract Stabilization with numeric evidence, workplace documents, and a reviewer-ready artifact. Status: Demo Ready"]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L5 Module: Streaming Contract Stabilization Workplace Mission
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-015' LIMIT 1),
  'L5 Module: Streaming Contract Stabilization Workplace Mission',
  'Industry requirement: Teams responsible for a streaming customer-event contract need learners who can use numeric evidence, threshold rules, and workplace documents to make reliable decisions during real-time personalization feed, not only explain Streaming Contract Stabilization theoretically. Gap addressed: Academic learning may cover the concepts behind Streaming Contract Stabilization, but it usually does not make learners practice with stream contract spec, Kafka topic error log, late-arrival summary, numeric variance, threshold decisions, and role handoff artifacts. Trigger: leaders need a standard rule so different teams stop making inconsistent decisions: 166,770 of 200,910 events passed the check, variance 17.0%, with signal ''stream contract violations and late event spikes''.',
  1,
  '["Data & AI","Data Platform Engineering","Data Engineering & Lakehouse Operations","Streaming Contract Stabilization","Primary: Evidence. Supporting: Technical, Functional, Domain, Behavioural","stream schema contract","late-arrival window","consumer compatibility","event-time vs processing-time","contract test evidence","expected 200,910 vs actual 166,770 events","17.0% variance interpretation","threshold rule: contract violations must remain below 0.8%","review standard definition","auditability","coaching rule"]'::jsonb,
  '["Engage: Learner receives a standards and governance case: real-time personalization feed is at risk because only 166,770 of 200,910 events passed the control and stream contract violations and late event spikes is visible","Explore: Learner reviews stream contract spec, Kafka topic error log, late-arrival summary, schema registry diff, consumer failure ticket, highlights the fields that prove the issue, and notes which values cross the threshold","Explain: Learner studies stream schema contract, late-arrival window, consumer compatibility, event-time vs processing-time and learns how these concepts explain the business risk, not just the technical error","Express: Learner prepares the Streaming Contract Stabilization Report with issue summary, numeric evidence, root-cause hypothesis, decision, and handoff note","Empower: Learner must define standards, thresholds, and reviewer responsibilities for real-time personalization feed","Evolve: Learner creates a coaching note so another reviewer can apply the standard consistently"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Scenario: Streaming Contract Stabilization Report - Standards and Review Pack
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-015' LIMIT 1)
   AND title = 'L5 Module: Streaming Contract Stabilization Workplace Mission' LIMIT 1),
  'Workplace Scenario: Streaming Contract Stabilization Report - Standards and Review Pack',
  'A standards review is called because multiple teams handle real-time personalization feed differently when a streaming customer-event contract shows stream contract violations and late event spikes. The expected volume is 200,910 events, but only 166,770 events are usable, creating a 17.0% variance against the control expectation. 7.6% of events arrive after the 5-minute SLA and the `session_id` type changed from string to integer. The accepted rule is: contract violations must remain below 0.8%. The learner receives stream contract spec, Kafka topic error log, late-arrival summary, schema registry diff, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Streaming Contract Stabilization Report. The learner must define review rules, evidence standards, escalation thresholds, and coaching notes for future cases. Pressure points: Real-time personalization feed is time-sensitive; variance is 17.0% against the rule; 7.6% of events arrive after the 5-minute SLA and the `session_id` type changed from string to integer; multiple teams need a common standard, audit trace, and coaching rule for future decisions.',
  'Course trigger: leaders need a standard rule so different teams stop making inconsistent decisions: 166,770 of 200,910 events passed the check, variance 17.0%, with signal ''stream contract violations and late event spikes''.
Problem statement: A standards review is called because multiple teams handle real-time personalization feed differently when a streaming customer-event contract shows stream contract violations and late event spikes. The expected volume is 200,910 events, but only 166,770 events are usable, creating a 17.0% variance against the control expectation. 7.6% of events arrive after the 5-minute SLA and the `session_id` type changed from string to integer. The accepted rule is: contract violations must remain below 0.8%. The learner receives stream contract spec, Kafka topic error log, late-arrival summary, schema registry diff, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Streaming Contract Stabilization Report. The learner must define review rules, evidence standards, escalation thresholds, and coaching notes for future cases.
Major concepts: stream schema contract; late-arrival window; consumer compatibility; event-time vs processing-time; contract test evidence; expected 200,910 vs actual 166,770 events; 17.0% variance interpretation; threshold rule: contract violations must remain below 0.8%; review standard definition; auditability; coaching rule.
Root-cause focus: Define standards that distinguish: producer schema change, late event window, consumer deserialization failure, partition lag, or missing contract test. Evidence must come from stream contract spec, Kafka topic error log, late-arrival summary.
Required data: stream contract spec; Kafka topic error log; late-arrival summary; schema registry diff; consumer failure ticket; audit observation summary; cross-team decision examples; standard template draft
Artifact: Streaming Contract Stabilization Report - Standards and Review Pack
Artifact structure: case summary; expected vs actual numbers; threshold rule; evidence table from stream contract spec, Kafka topic error log, late-arrival summary; root-cause hypothesis; decision/action; risk note; role handoff; standard operating rule; reviewer checklist; escalation matrix; coaching note; audit evidence requirement.
Evidence fields to assess: captures expected 200,910 and actual 166,770 events; calculates or explains 17.0% variance; uses threshold rule correctly (contract violations must remain below 0.8%); cites at least three input documents; links evidence to root-cause hypothesis; states clear release/hold/correct/escalate decision; defines standard review rule; creates audit-ready reviewer criteria.
AI support tips: Use AI as a coach to ask evidence-checking questions, explain unfamiliar terms, compare possible root causes, and improve clarity. Do not use AI to invent numbers or make the decision without citing the provided documents.',
  1,
  '16 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech CSE - Data Engineering Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-015' LIMIT 1),
  'B.Tech CSE - Data Engineering Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech AI & Data Science - Data Platform Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-015' LIMIT 1),
  'B.Tech AI & Data Science - Data Platform Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Data Science - Data Engineering Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-015' LIMIT 1),
  'B.Sc Data Science - Data Engineering Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MCA - Data Engineering / Cloud Data Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-015' LIMIT 1),
  'MCA - Data Engineering / Cloud Data Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Tech Data Engineering / Big Data Systems
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-015' LIMIT 1),
  'M.Tech Data Engineering / Big Data Systems',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Set Review Standards for BI Asset Certification
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Set Review Standards for BI Asset Certification',
  'CRS-IND-CL-020',
  'By the end of this course, the learner can set measurable standards for BI Asset Certification by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact. Workplace problem: A standards review is called because multiple teams handle executive sales performance review differently when a certified BI reporting asset shows uncertified dataset use and mismatched dashboard totals. The expected volume is 22,334 tiles, but only 21,800 tiles are usable, creating a 2.4% variance against the control expectation. Regional sales total is 6.4% higher in the dashboard than the approved semantic model. The accepted rule is: 100% of executive tiles must use certified sources. The learner receives dashboard dependency list, certified dataset register, semantic model measure sheet, data refresh history, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the BI Asset Certification Review Sheet. The learner must define review rules, evidence standards, escalation thresholds, and coaching notes for future cases. Artifact: BI Asset Certification Review Sheet - Standards and Review Pack.',
  '16 hours',
  'Active',
  'BI & Reporting Analytics',
  'technical',
  '["By the end of this course, the learner can set measurable standards for BI Asset Certification by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact","Learner demonstrates BI Asset Certification by interpreting real-looking numbers, comparing evidence from dashboard dependency list and certified dataset register, and producing a decision-ready artifact","Proves the learner can perform standards and governance work in BI Asset Certification with numeric evidence, workplace documents, and a reviewer-ready artifact. Status: Demo Ready"]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L5 Module: BI Asset Certification Workplace Mission
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-020' LIMIT 1),
  'L5 Module: BI Asset Certification Workplace Mission',
  'Industry requirement: Teams responsible for a certified BI reporting asset need learners who can use numeric evidence, threshold rules, and workplace documents to make reliable decisions during executive sales performance review, not only explain BI Asset Certification theoretically. Gap addressed: Academic learning may cover the concepts behind BI Asset Certification, but it usually does not make learners practice with dashboard dependency list, certified dataset register, semantic model measure sheet, numeric variance, threshold decisions, and role handoff artifacts. Trigger: leaders need a standard rule so different teams stop making inconsistent decisions: 21,800 of 22,334 tiles passed the check, variance 2.4%, with signal ''uncertified dataset use and mismatched dashboard totals''.',
  1,
  '["Data & AI","BI & Reporting Analytics","BI Asset Certification","Primary: Evidence. Supporting: Technical, Functional, Domain, Behavioural","certified BI asset control","semantic model dependency","measure lineage","refresh reliability","executive reporting risk","expected 22,334 vs actual 21,800 tiles","2.4% variance interpretation","threshold rule: 100% of executive tiles must use certified sources","review standard definition","auditability","coaching rule"]'::jsonb,
  '["Engage: Learner receives a standards and governance case: executive sales performance review is at risk because only 21,800 of 22,334 tiles passed the control and uncertified dataset use and mismatched dashboard totals is visible","Explore: Learner reviews dashboard dependency list, certified dataset register, semantic model measure sheet, data refresh history, business owner approval note, highlights the fields that prove the issue, and notes which values cross the threshold","Explain: Learner studies certified BI asset control, semantic model dependency, measure lineage, refresh reliability and learns how these concepts explain the business risk, not just the technical error","Express: Learner prepares the BI Asset Certification Review Sheet with issue summary, numeric evidence, root-cause hypothesis, decision, and handoff note","Empower: Learner must define standards, thresholds, and reviewer responsibilities for executive sales performance review","Evolve: Learner creates a coaching note so another reviewer can apply the standard consistently"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Scenario: BI Asset Certification Review Sheet - Standards and Review Pack
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-020' LIMIT 1)
   AND title = 'L5 Module: BI Asset Certification Workplace Mission' LIMIT 1),
  'Workplace Scenario: BI Asset Certification Review Sheet - Standards and Review Pack',
  'A standards review is called because multiple teams handle executive sales performance review differently when a certified BI reporting asset shows uncertified dataset use and mismatched dashboard totals. The expected volume is 22,334 tiles, but only 21,800 tiles are usable, creating a 2.4% variance against the control expectation. Regional sales total is 6.4% higher in the dashboard than the approved semantic model. The accepted rule is: 100% of executive tiles must use certified sources. The learner receives dashboard dependency list, certified dataset register, semantic model measure sheet, data refresh history, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the BI Asset Certification Review Sheet. The learner must define review rules, evidence standards, escalation thresholds, and coaching notes for future cases. Pressure points: Executive sales performance review is time-sensitive; variance is 2.4% against the rule; regional sales total is 6.4% higher in the dashboard than the approved semantic model; multiple teams need a common standard, audit trace, and coaching rule for future decisions.',
  'Course trigger: leaders need a standard rule so different teams stop making inconsistent decisions: 21,800 of 22,334 tiles passed the check, variance 2.4%, with signal ''uncertified dataset use and mismatched dashboard totals''.
Problem statement: A standards review is called because multiple teams handle executive sales performance review differently when a certified BI reporting asset shows uncertified dataset use and mismatched dashboard totals. The expected volume is 22,334 tiles, but only 21,800 tiles are usable, creating a 2.4% variance against the control expectation. Regional sales total is 6.4% higher in the dashboard than the approved semantic model. The accepted rule is: 100% of executive tiles must use certified sources. The learner receives dashboard dependency list, certified dataset register, semantic model measure sheet, data refresh history, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the BI Asset Certification Review Sheet. The learner must define review rules, evidence standards, escalation thresholds, and coaching notes for future cases.
Major concepts: certified BI asset control; semantic model dependency; measure lineage; refresh reliability; executive reporting risk; expected 22,334 vs actual 21,800 tiles; 2.4% variance interpretation; threshold rule: 100% of executive tiles must use certified sources; review standard definition; auditability; coaching rule.
Root-cause focus: Define standards that distinguish: uncertified table usage, measure definition drift, refresh failure, manual filter override, or missing owner approval. Evidence must come from dashboard dependency list, certified dataset register, semantic model measure sheet.
Required data: dashboard dependency list; certified dataset register; semantic model measure sheet; data refresh history; business owner approval note; audit observation summary; cross-team decision examples; standard template draft
Artifact: BI Asset Certification Review Sheet - Standards and Review Pack
Artifact structure: case summary; expected vs actual numbers; threshold rule; evidence table from dashboard dependency list, certified dataset register, semantic model measure sheet; root-cause hypothesis; decision/action; risk note; role handoff; standard operating rule; reviewer checklist; escalation matrix; coaching note; audit evidence requirement.
Evidence fields to assess: captures expected 22,334 and actual 21,800 tiles; calculates or explains 2.4% variance; uses threshold rule correctly (100% of executive tiles must use certified sources); cites at least three input documents; links evidence to root-cause hypothesis; states clear release/hold/correct/escalate decision; defines standard review rule; creates audit-ready reviewer criteria.
AI support tips: Use AI as a coach to ask evidence-checking questions, explain unfamiliar terms, compare possible root causes, and improve clarity. Do not use AI to invent numbers or make the decision without citing the provided documents.',
  1,
  '16 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Data Science - BI & Analytics Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-020' LIMIT 1),
  'B.Sc Data Science - BI & Analytics Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BBA Business Analytics - BI Reporting Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-020' LIMIT 1),
  'BBA Business Analytics - BI Reporting Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Com Analytics - Management Reporting Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-020' LIMIT 1),
  'B.Com Analytics - Management Reporting Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MBA Business Analytics - Decision Reporting Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-020' LIMIT 1),
  'MBA Business Analytics - Decision Reporting Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech CSE - Data Analytics Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-020' LIMIT 1),
  'B.Tech CSE - Data Analytics Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Set Review Standards for Decision Recommendation Production
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Set Review Standards for Decision Recommendation Production',
  'CRS-IND-CL-025',
  'By the end of this course, the learner can set measurable standards for Decision Recommendation Production by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact. Workplace problem: A standards review is called because multiple teams handle warehouse staffing recommendation differently when an operations decision recommendation model shows optimization output conflicts with capacity and cost constraints. The expected volume is 23,970 recommendations, but only 23,249 recommendations are usable, creating a 3.0% variance against the control expectation. Recommended overtime cost exceeds budget by ₹4.8 lakh and misses 11 high-priority fulfillment slots. The accepted rule is: recommendation constraint breaches must stay below 2%. The learner receives optimization scenario file, constraint register, cost-benefit worksheet, service-level target sheet, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Decision Recommendation Justification Note. The learner must define review rules, evidence standards, escalation thresholds, and coaching notes for future cases. Artifact: Decision Recommendation Justification Note - Standards and Review Pack.',
  '16 hours',
  'Active',
  'Decision Optimization & Business Insight',
  'technical',
  '["By the end of this course, the learner can set measurable standards for Decision Recommendation Production by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact","Learner demonstrates Decision Recommendation Production by interpreting real-looking numbers, comparing evidence from optimization scenario file and constraint register, and producing a decision-ready artifact","Proves the learner can perform standards and governance work in Decision Recommendation Production with numeric evidence, workplace documents, and a reviewer-ready artifact. Status: Demo Ready"]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L5 Module: Decision Recommendation Production Workplace Mission
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-025' LIMIT 1),
  'L5 Module: Decision Recommendation Production Workplace Mission',
  'Industry requirement: Teams responsible for an operations decision recommendation model need learners who can use numeric evidence, threshold rules, and workplace documents to make reliable decisions during warehouse staffing recommendation, not only explain Decision Recommendation Production theoretically. Gap addressed: Academic learning may cover the concepts behind Decision Recommendation Production, but it usually does not make learners practice with optimization scenario file, constraint register, cost-benefit worksheet, numeric variance, threshold decisions, and role handoff artifacts. Trigger: leaders need a standard rule so different teams stop making inconsistent decisions: 23,249 of 23,970 recommendations passed the check, variance 3.0%, with signal ''optimization output conflicts with capacity and cost constraints''.',
  1,
  '["Data & AI","Decision Optimization & Business Insight","Decision Recommendation Production","Primary: Evidence. Supporting: Technical, Functional, Domain, Behavioural","constraint feasibility","objective function trade-off","scenario comparison","cost-service impact","decision recommendation evidence","expected 23,970 vs actual 23,249 recommendations","3.0% variance interpretation","threshold rule: recommendation constraint breaches must stay below 2%","review standard definition","auditability","coaching rule"]'::jsonb,
  '["Engage: Learner receives a standards and governance case: warehouse staffing recommendation is at risk because only 23,249 of 23,970 recommendations passed the control and optimization output conflicts with capacity and cost constraints is visible","Explore: Learner reviews optimization scenario file, constraint register, cost-benefit worksheet, service-level target sheet, manager decision request, highlights the fields that prove the issue, and notes which values cross the threshold","Explain: Learner studies constraint feasibility, objective function trade-off, scenario comparison, cost-service impact and learns how these concepts explain the business risk, not just the technical error","Express: Learner prepares the Decision Recommendation Justification Note with issue summary, numeric evidence, root-cause hypothesis, decision, and handoff note","Empower: Learner must define standards, thresholds, and reviewer responsibilities for warehouse staffing recommendation","Evolve: Learner creates a coaching note so another reviewer can apply the standard consistently"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Scenario: Decision Recommendation Justification Note - Standards and Review Pack
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-025' LIMIT 1)
   AND title = 'L5 Module: Decision Recommendation Production Workplace Mission' LIMIT 1),
  'Workplace Scenario: Decision Recommendation Justification Note - Standards and Review Pack',
  'A standards review is called because multiple teams handle warehouse staffing recommendation differently when an operations decision recommendation model shows optimization output conflicts with capacity and cost constraints. The expected volume is 23,970 recommendations, but only 23,249 recommendations are usable, creating a 3.0% variance against the control expectation. Recommended overtime cost exceeds budget by ₹4.8 lakh and misses 11 high-priority fulfillment slots. The accepted rule is: recommendation constraint breaches must stay below 2%. The learner receives optimization scenario file, constraint register, cost-benefit worksheet, service-level target sheet, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Decision Recommendation Justification Note. The learner must define review rules, evidence standards, escalation thresholds, and coaching notes for future cases. Pressure points: Warehouse staffing recommendation is time-sensitive; variance is 3.0% against the rule; recommended overtime cost exceeds budget by ₹4.8 lakh and misses 11 high-priority fulfillment slots; multiple teams need a common standard, audit trace, and coaching rule for future decisions.',
  'Course trigger: leaders need a standard rule so different teams stop making inconsistent decisions: 23,249 of 23,970 recommendations passed the check, variance 3.0%, with signal ''optimization output conflicts with capacity and cost constraints''.
Problem statement: A standards review is called because multiple teams handle warehouse staffing recommendation differently when an operations decision recommendation model shows optimization output conflicts with capacity and cost constraints. The expected volume is 23,970 recommendations, but only 23,249 recommendations are usable, creating a 3.0% variance against the control expectation. Recommended overtime cost exceeds budget by ₹4.8 lakh and misses 11 high-priority fulfillment slots. The accepted rule is: recommendation constraint breaches must stay below 2%. The learner receives optimization scenario file, constraint register, cost-benefit worksheet, service-level target sheet, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Decision Recommendation Justification Note. The learner must define review rules, evidence standards, escalation thresholds, and coaching notes for future cases.
Major concepts: constraint feasibility; objective function trade-off; scenario comparison; cost-service impact; decision recommendation evidence; expected 23,970 vs actual 23,249 recommendations; 3.0% variance interpretation; threshold rule: recommendation constraint breaches must stay below 2%; review standard definition; auditability; coaching rule.
Root-cause focus: Define standards that distinguish: missing constraint, wrong objective weight, outdated cost parameter, service-level trade-off, or infeasible scenario. Evidence must come from optimization scenario file, constraint register, cost-benefit worksheet.
Required data: optimization scenario file; constraint register; cost-benefit worksheet; service-level target sheet; manager decision request; audit observation summary; cross-team decision examples; standard template draft
Artifact: Decision Recommendation Justification Note - Standards and Review Pack
Artifact structure: case summary; expected vs actual numbers; threshold rule; evidence table from optimization scenario file, constraint register, cost-benefit worksheet; root-cause hypothesis; decision/action; risk note; role handoff; standard operating rule; reviewer checklist; escalation matrix; coaching note; audit evidence requirement.
Evidence fields to assess: captures expected 23,970 and actual 23,249 recommendations; calculates or explains 3.0% variance; uses threshold rule correctly (recommendation constraint breaches must stay below 2%); cites at least three input documents; links evidence to root-cause hypothesis; states clear release/hold/correct/escalate decision; defines standard review rule; creates audit-ready reviewer criteria.
AI support tips: Use AI as a coach to ask evidence-checking questions, explain unfamiliar terms, compare possible root causes, and improve clarity. Do not use AI to invent numbers or make the decision without citing the provided documents.',
  1,
  '16 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Statistics / Data Science - Decision Analytics Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-025' LIMIT 1),
  'B.Sc Statistics / Data Science - Decision Analytics Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech Industrial Engineering / Operations Analytics Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-025' LIMIT 1),
  'B.Tech Industrial Engineering / Operations Analytics Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BBA Business Analytics - Decision Intelligence Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-025' LIMIT 1),
  'BBA Business Analytics - Decision Intelligence Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MBA Business Analytics - Optimization & Strategy Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-025' LIMIT 1),
  'MBA Business Analytics - Optimization & Strategy Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Sc Data Science - Optimization Analytics
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-025' LIMIT 1),
  'M.Sc Data Science - Optimization Analytics',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Data Science - Applied Modeling Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-025' LIMIT 1),
  'B.Sc Data Science - Applied Modeling Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Set Review Standards for Leakage-Safe Feature Dataset Build
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Set Review Standards for Leakage-Safe Feature Dataset Build',
  'CRS-IND-CL-030',
  'By the end of this course, the learner can set measurable standards for Leakage-Safe Feature Dataset Build by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact. Workplace problem: A standards review is called because multiple teams handle model training cut-off review differently when a churn prediction feature dataset shows feature leakage risk and event-window mismatch. The expected volume is 275,020 rows, but only 227,740 rows are usable, creating a 17.2% variance against the control expectation. 18 features are populated after the churn label date and 9.2% of rows use future transactions. The accepted rule is: post-outcome features must be 0 before training release. The learner receives label definition sheet, feature lineage map, event-window extract, training data sample, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Leakage-Safe Feature Dataset Review Pack. The learner must define review rules, evidence standards, escalation thresholds, and coaching notes for future cases. Artifact: Leakage-Safe Feature Dataset Review Pack - Standards and Review Pack.',
  '16 hours',
  'Active',
  'Data Science & Statistical Modeling; Machine Learning, Deep Learning & NLP Engineering',
  'technical',
  '["By the end of this course, the learner can set measurable standards for Leakage-Safe Feature Dataset Build by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact","Learner demonstrates Leakage-Safe Feature Dataset Build by interpreting real-looking numbers, comparing evidence from label definition sheet and feature lineage map, and producing a decision-ready artifact","Proves the learner can perform standards and governance work in Leakage-Safe Feature Dataset Build with numeric evidence, workplace documents, and a reviewer-ready artifact. Status: Demo Ready"]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L5 Module: Leakage-Safe Feature Dataset Build Workplace Mission
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-030' LIMIT 1),
  'L5 Module: Leakage-Safe Feature Dataset Build Workplace Mission',
  'Industry requirement: Teams responsible for a churn prediction feature dataset need learners who can use numeric evidence, threshold rules, and workplace documents to make reliable decisions during model training cut-off review, not only explain Leakage-Safe Feature Dataset Build theoretically. Gap addressed: Academic learning may cover the concepts behind Leakage-Safe Feature Dataset Build, but it usually does not make learners practice with label definition sheet, feature lineage map, event-window extract, numeric variance, threshold decisions, and role handoff artifacts. Trigger: leaders need a standard rule so different teams stop making inconsistent decisions: 227,740 of 275,020 rows passed the check, variance 17.2%, with signal ''feature leakage risk and event-window mismatch''.',
  1,
  '["Data & AI","Data Science & Statistical Modeling","Machine Learning, Deep Learning & NLP Engineering","Leakage-Safe Feature Dataset Build","Primary: Evidence. Supporting: Technical, Functional, Domain, Behavioural","prediction target timing","feature availability cut-off","target leakage detection","event-window alignment","training data release control","expected 275,020 vs actual 227,740 rows","17.2% variance interpretation","threshold rule: post-outcome features must be 0 before training release","review standard definition","auditability","coaching rule"]'::jsonb,
  '["Engage: Learner receives a standards and governance case: model training cut-off review is at risk because only 227,740 of 275,020 rows passed the control and feature leakage risk and event-window mismatch is visible","Explore: Learner reviews label definition sheet, feature lineage map, event-window extract, training data sample, leakage review checklist, highlights the fields that prove the issue, and notes which values cross the threshold","Explain: Learner studies prediction target timing, feature availability cut-off, target leakage detection, event-window alignment and learns how these concepts explain the business risk, not just the technical error","Express: Learner prepares the Leakage-Safe Feature Dataset Review Pack with issue summary, numeric evidence, root-cause hypothesis, decision, and handoff note","Empower: Learner must define standards, thresholds, and reviewer responsibilities for model training cut-off review","Evolve: Learner creates a coaching note so another reviewer can apply the standard consistently"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Scenario: Leakage-Safe Feature Dataset Review Pack - Standards and Review Pack
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-030' LIMIT 1)
   AND title = 'L5 Module: Leakage-Safe Feature Dataset Build Workplace Mission' LIMIT 1),
  'Workplace Scenario: Leakage-Safe Feature Dataset Review Pack - Standards and Review Pack',
  'A standards review is called because multiple teams handle model training cut-off review differently when a churn prediction feature dataset shows feature leakage risk and event-window mismatch. The expected volume is 275,020 rows, but only 227,740 rows are usable, creating a 17.2% variance against the control expectation. 18 features are populated after the churn label date and 9.2% of rows use future transactions. The accepted rule is: post-outcome features must be 0 before training release. The learner receives label definition sheet, feature lineage map, event-window extract, training data sample, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Leakage-Safe Feature Dataset Review Pack. The learner must define review rules, evidence standards, escalation thresholds, and coaching notes for future cases. Pressure points: Model training cut-off review is time-sensitive; variance is 17.2% against the rule; 18 features are populated after the churn label date and 9.2% of rows use future transactions; multiple teams need a common standard, audit trace, and coaching rule for future decisions.',
  'Course trigger: leaders need a standard rule so different teams stop making inconsistent decisions: 227,740 of 275,020 rows passed the check, variance 17.2%, with signal ''feature leakage risk and event-window mismatch''.
Problem statement: A standards review is called because multiple teams handle model training cut-off review differently when a churn prediction feature dataset shows feature leakage risk and event-window mismatch. The expected volume is 275,020 rows, but only 227,740 rows are usable, creating a 17.2% variance against the control expectation. 18 features are populated after the churn label date and 9.2% of rows use future transactions. The accepted rule is: post-outcome features must be 0 before training release. The learner receives label definition sheet, feature lineage map, event-window extract, training data sample, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Leakage-Safe Feature Dataset Review Pack. The learner must define review rules, evidence standards, escalation thresholds, and coaching notes for future cases.
Major concepts: prediction target timing; feature availability cut-off; target leakage detection; event-window alignment; training data release control; expected 275,020 vs actual 227,740 rows; 17.2% variance interpretation; threshold rule: post-outcome features must be 0 before training release; review standard definition; auditability; coaching rule.
Root-cause focus: Define standards that distinguish: future-dated transaction feature, wrong label cut-off, late feature backfill, target leakage, or unverified event window. Evidence must come from label definition sheet, feature lineage map, event-window extract.
Required data: label definition sheet; feature lineage map; event-window extract; training data sample; leakage review checklist; audit observation summary; cross-team decision examples; standard template draft
Artifact: Leakage-Safe Feature Dataset Review Pack - Standards and Review Pack
Artifact structure: case summary; expected vs actual numbers; threshold rule; evidence table from label definition sheet, feature lineage map, event-window extract; root-cause hypothesis; decision/action; risk note; role handoff; standard operating rule; reviewer checklist; escalation matrix; coaching note; audit evidence requirement.
Evidence fields to assess: captures expected 275,020 and actual 227,740 rows; calculates or explains 17.2% variance; uses threshold rule correctly (post-outcome features must be 0 before training release); cites at least three input documents; links evidence to root-cause hypothesis; states clear release/hold/correct/escalate decision; defines standard review rule; creates audit-ready reviewer criteria.
AI support tips: Use AI as a coach to ask evidence-checking questions, explain unfamiliar terms, compare possible root causes, and improve clarity. Do not use AI to invent numbers or make the decision without citing the provided documents.',
  1,
  '16 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Data Science - Applied Modeling Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-030' LIMIT 1),
  'B.Sc Data Science - Applied Modeling Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Statistics - Data Science Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-030' LIMIT 1),
  'B.Sc Statistics - Data Science Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech AI & Data Science - Modeling Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-030' LIMIT 1),
  'B.Tech AI & Data Science - Modeling Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Sc Data Science - Applied Analytics Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-030' LIMIT 1),
  'M.Sc Data Science - Applied Analytics Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MCA - Data Science Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-030' LIMIT 1),
  'MCA - Data Science Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech CSE - AI & Machine Learning Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-030' LIMIT 1),
  'B.Tech CSE - AI & Machine Learning Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Set Review Standards for Experiment and Cohort Evaluation
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Set Review Standards for Experiment and Cohort Evaluation',
  'CRS-IND-CL-035',
  'By the end of this course, the learner can set measurable standards for Experiment and Cohort Evaluation by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact. Workplace problem: A standards review is called because multiple teams handle pricing-page change decision differently when an A/B experiment result shows cohort imbalance and weak significance evidence. The expected volume is 90,390 users, but only 77,780 users are usable, creating a 14.0% variance against the control expectation. Control has 52.8% of traffic instead of 50% and conversion lift is only 0.7% with p=0.09. The accepted rule is: minimum detectable effect and sample ratio mismatch must be within tolerance. The learner receives experiment design note, cohort assignment report, conversion result table, validity checklist, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Experiment Validity and Decision Evidence Pack. The learner must define review rules, evidence standards, escalation thresholds, and coaching notes for future cases. Artifact: Experiment Validity and Decision Evidence Pack - Standards and Review Pack.',
  '16 hours',
  'Active',
  'Data Science & Statistical Modeling',
  'technical',
  '["By the end of this course, the learner can set measurable standards for Experiment and Cohort Evaluation by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact","Learner demonstrates Experiment and Cohort Evaluation by interpreting real-looking numbers, comparing evidence from experiment design note and cohort assignment report, and producing a decision-ready artifact","Proves the learner can perform standards and governance work in Experiment and Cohort Evaluation with numeric evidence, workplace documents, and a reviewer-ready artifact. Status: Demo Ready"]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L5 Module: Experiment and Cohort Evaluation Workplace Mission
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-035' LIMIT 1),
  'L5 Module: Experiment and Cohort Evaluation Workplace Mission',
  'Industry requirement: Teams responsible for an A/B experiment result need learners who can use numeric evidence, threshold rules, and workplace documents to make reliable decisions during pricing-page change decision, not only explain Experiment and Cohort Evaluation theoretically. Gap addressed: Academic learning may cover the concepts behind Experiment and Cohort Evaluation, but it usually does not make learners practice with experiment design note, cohort assignment report, conversion result table, numeric variance, threshold decisions, and role handoff artifacts. Trigger: leaders need a standard rule so different teams stop making inconsistent decisions: 77,780 of 90,390 users passed the check, variance 14.0%, with signal ''cohort imbalance and weak significance evidence''.',
  1,
  '["Data & AI","Data Science & Statistical Modeling","Experiment and Cohort Evaluation","Primary: Evidence. Supporting: Technical, Functional, Domain, Behavioural","sample-ratio mismatch","statistical power","confidence interval","cohort validity","decision threshold","expected 90,390 vs actual 77,780 users","14.0% variance interpretation","threshold rule: minimum detectable effect and sample ratio mismatch must be within tolerance","review standard definition","auditability","coaching rule"]'::jsonb,
  '["Engage: Learner receives a standards and governance case: pricing-page change decision is at risk because only 77,780 of 90,390 users passed the control and cohort imbalance and weak significance evidence is visible","Explore: Learner reviews experiment design note, cohort assignment report, conversion result table, validity checklist, product decision memo, highlights the fields that prove the issue, and notes which values cross the threshold","Explain: Learner studies sample-ratio mismatch, statistical power, confidence interval, cohort validity and learns how these concepts explain the business risk, not just the technical error","Express: Learner prepares the Experiment Validity and Decision Evidence Pack with issue summary, numeric evidence, root-cause hypothesis, decision, and handoff note","Empower: Learner must define standards, thresholds, and reviewer responsibilities for pricing-page change decision","Evolve: Learner creates a coaching note so another reviewer can apply the standard consistently"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Scenario: Experiment Validity and Decision Evidence Pack - Standards and Review Pack
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-035' LIMIT 1)
   AND title = 'L5 Module: Experiment and Cohort Evaluation Workplace Mission' LIMIT 1),
  'Workplace Scenario: Experiment Validity and Decision Evidence Pack - Standards and Review Pack',
  'A standards review is called because multiple teams handle pricing-page change decision differently when an A/B experiment result shows cohort imbalance and weak significance evidence. The expected volume is 90,390 users, but only 77,780 users are usable, creating a 14.0% variance against the control expectation. Control has 52.8% of traffic instead of 50% and conversion lift is only 0.7% with p=0.09. The accepted rule is: minimum detectable effect and sample ratio mismatch must be within tolerance. The learner receives experiment design note, cohort assignment report, conversion result table, validity checklist, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Experiment Validity and Decision Evidence Pack. The learner must define review rules, evidence standards, escalation thresholds, and coaching notes for future cases. Pressure points: Pricing-page change decision is time-sensitive; variance is 14.0% against the rule; control has 52.8% of traffic instead of 50% and conversion lift is only 0.7% with p=0.09; multiple teams need a common standard, audit trace, and coaching rule for future decisions.',
  'Course trigger: leaders need a standard rule so different teams stop making inconsistent decisions: 77,780 of 90,390 users passed the check, variance 14.0%, with signal ''cohort imbalance and weak significance evidence''.
Problem statement: A standards review is called because multiple teams handle pricing-page change decision differently when an A/B experiment result shows cohort imbalance and weak significance evidence. The expected volume is 90,390 users, but only 77,780 users are usable, creating a 14.0% variance against the control expectation. Control has 52.8% of traffic instead of 50% and conversion lift is only 0.7% with p=0.09. The accepted rule is: minimum detectable effect and sample ratio mismatch must be within tolerance. The learner receives experiment design note, cohort assignment report, conversion result table, validity checklist, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Experiment Validity and Decision Evidence Pack. The learner must define review rules, evidence standards, escalation thresholds, and coaching notes for future cases.
Major concepts: sample-ratio mismatch; statistical power; confidence interval; cohort validity; decision threshold; expected 90,390 vs actual 77,780 users; 14.0% variance interpretation; threshold rule: minimum detectable effect and sample ratio mismatch must be within tolerance; review standard definition; auditability; coaching rule.
Root-cause focus: Define standards that distinguish: sample-ratio mismatch, underpowered test, instrumentation gap, segment imbalance, or premature decision. Evidence must come from experiment design note, cohort assignment report, conversion result table.
Required data: experiment design note; cohort assignment report; conversion result table; validity checklist; product decision memo; audit observation summary; cross-team decision examples; standard template draft
Artifact: Experiment Validity and Decision Evidence Pack - Standards and Review Pack
Artifact structure: case summary; expected vs actual numbers; threshold rule; evidence table from experiment design note, cohort assignment report, conversion result table; root-cause hypothesis; decision/action; risk note; role handoff; standard operating rule; reviewer checklist; escalation matrix; coaching note; audit evidence requirement.
Evidence fields to assess: captures expected 90,390 and actual 77,780 users; calculates or explains 14.0% variance; uses threshold rule correctly (minimum detectable effect and sample ratio mismatch must be within tolerance); cites at least three input documents; links evidence to root-cause hypothesis; states clear release/hold/correct/escalate decision; defines standard review rule; creates audit-ready reviewer criteria.
AI support tips: Use AI as a coach to ask evidence-checking questions, explain unfamiliar terms, compare possible root causes, and improve clarity. Do not use AI to invent numbers or make the decision without citing the provided documents.',
  1,
  '16 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Data Science - Applied Modeling Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-035' LIMIT 1),
  'B.Sc Data Science - Applied Modeling Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Statistics - Data Science Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-035' LIMIT 1),
  'B.Sc Statistics - Data Science Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech AI & Data Science - Modeling Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-035' LIMIT 1),
  'B.Tech AI & Data Science - Modeling Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Sc Data Science - Applied Analytics Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-035' LIMIT 1),
  'M.Sc Data Science - Applied Analytics Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MCA - Data Science Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-035' LIMIT 1),
  'MCA - Data Science Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Set Review Standards for Deep Learning Candidate Packaging
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Set Review Standards for Deep Learning Candidate Packaging',
  'CRS-IND-CL-040',
  'By the end of this course, the learner can set measurable standards for Deep Learning Candidate Packaging by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact. Workplace problem: A standards review is called because multiple teams handle computer vision defect-detection release review differently when a deep learning model candidate shows training metric improvement but validation instability. The expected volume is 79,760 images, but only 69,420 images are usable, creating a 13.0% variance against the control expectation. Training F1 is 0.93 but validation F1 drops to 0.81 on low-light images. The accepted rule is: validation F1 must be above 0.86 and train-val gap below 5 points. The learner receives training run log, checkpoint metric table, validation error slice report, model card draft, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Deep Learning Candidate Packaging Review. The learner must define review rules, evidence standards, escalation thresholds, and coaching notes for future cases. Artifact: Deep Learning Candidate Packaging Review - Standards and Review Pack.',
  '16 hours',
  'Active',
  'Machine Learning, Deep Learning & NLP Engineering',
  'technical',
  '["By the end of this course, the learner can set measurable standards for Deep Learning Candidate Packaging by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact","Learner demonstrates Deep Learning Candidate Packaging by interpreting real-looking numbers, comparing evidence from training run log and checkpoint metric table, and producing a decision-ready artifact","Proves the learner can perform standards and governance work in Deep Learning Candidate Packaging with numeric evidence, workplace documents, and a reviewer-ready artifact. Status: Demo Ready"]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L5 Module: Deep Learning Candidate Packaging Workplace Mission
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-040' LIMIT 1),
  'L5 Module: Deep Learning Candidate Packaging Workplace Mission',
  'Industry requirement: Teams responsible for a deep learning model candidate need learners who can use numeric evidence, threshold rules, and workplace documents to make reliable decisions during computer vision defect-detection release review, not only explain Deep Learning Candidate Packaging theoretically. Gap addressed: Academic learning may cover the concepts behind Deep Learning Candidate Packaging, but it usually does not make learners practice with training run log, checkpoint metric table, validation error slice report, numeric variance, threshold decisions, and role handoff artifacts. Trigger: leaders need a standard rule so different teams stop making inconsistent decisions: 69,420 of 79,760 images passed the check, variance 13.0%, with signal ''training metric improvement but validation instability''.',
  1,
  '["Data & AI","Machine Learning, Deep Learning & NLP Engineering","Deep Learning Candidate Packaging","Primary: Evidence. Supporting: Technical, Functional, Domain, Behavioural","train-validation gap","checkpoint comparison","error slice analysis","model card evidence","release candidate packaging","expected 79,760 vs actual 69,420 images","13.0% variance interpretation","threshold rule: validation F1 must be above 0.86 and train-val gap below 5 points","review standard definition","auditability","coaching rule"]'::jsonb,
  '["Engage: Learner receives a standards and governance case: computer vision defect-detection release review is at risk because only 69,420 of 79,760 images passed the control and training metric improvement but validation instability is visible","Explore: Learner reviews training run log, checkpoint metric table, validation error slice report, model card draft, release candidate request, highlights the fields that prove the issue, and notes which values cross the threshold","Explain: Learner studies train-validation gap, checkpoint comparison, error slice analysis, model card evidence and learns how these concepts explain the business risk, not just the technical error","Express: Learner prepares the Deep Learning Candidate Packaging Review with issue summary, numeric evidence, root-cause hypothesis, decision, and handoff note","Empower: Learner must define standards, thresholds, and reviewer responsibilities for computer vision defect-detection release review","Evolve: Learner creates a coaching note so another reviewer can apply the standard consistently"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Scenario: Deep Learning Candidate Packaging Review - Standards and Review Pack
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-040' LIMIT 1)
   AND title = 'L5 Module: Deep Learning Candidate Packaging Workplace Mission' LIMIT 1),
  'Workplace Scenario: Deep Learning Candidate Packaging Review - Standards and Review Pack',
  'A standards review is called because multiple teams handle computer vision defect-detection release review differently when a deep learning model candidate shows training metric improvement but validation instability. The expected volume is 79,760 images, but only 69,420 images are usable, creating a 13.0% variance against the control expectation. Training F1 is 0.93 but validation F1 drops to 0.81 on low-light images. The accepted rule is: validation F1 must be above 0.86 and train-val gap below 5 points. The learner receives training run log, checkpoint metric table, validation error slice report, model card draft, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Deep Learning Candidate Packaging Review. The learner must define review rules, evidence standards, escalation thresholds, and coaching notes for future cases. Pressure points: Computer vision defect-detection release review is time-sensitive; variance is 13.0% against the rule; training F1 is 0.93 but validation F1 drops to 0.81 on low-light images; multiple teams need a common standard, audit trace, and coaching rule for future decisions.',
  'Course trigger: leaders need a standard rule so different teams stop making inconsistent decisions: 69,420 of 79,760 images passed the check, variance 13.0%, with signal ''training metric improvement but validation instability''.
Problem statement: A standards review is called because multiple teams handle computer vision defect-detection release review differently when a deep learning model candidate shows training metric improvement but validation instability. The expected volume is 79,760 images, but only 69,420 images are usable, creating a 13.0% variance against the control expectation. Training F1 is 0.93 but validation F1 drops to 0.81 on low-light images. The accepted rule is: validation F1 must be above 0.86 and train-val gap below 5 points. The learner receives training run log, checkpoint metric table, validation error slice report, model card draft, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Deep Learning Candidate Packaging Review. The learner must define review rules, evidence standards, escalation thresholds, and coaching notes for future cases.
Major concepts: train-validation gap; checkpoint comparison; error slice analysis; model card evidence; release candidate packaging; expected 79,760 vs actual 69,420 images; 13.0% variance interpretation; threshold rule: validation F1 must be above 0.86 and train-val gap below 5 points; review standard definition; auditability; coaching rule.
Root-cause focus: Define standards that distinguish: overfitting, class imbalance, data augmentation mismatch, checkpoint selection error, or weak slice performance. Evidence must come from training run log, checkpoint metric table, validation error slice report.
Required data: training run log; checkpoint metric table; validation error slice report; model card draft; release candidate request; audit observation summary; cross-team decision examples; standard template draft
Artifact: Deep Learning Candidate Packaging Review - Standards and Review Pack
Artifact structure: case summary; expected vs actual numbers; threshold rule; evidence table from training run log, checkpoint metric table, validation error slice report; root-cause hypothesis; decision/action; risk note; role handoff; standard operating rule; reviewer checklist; escalation matrix; coaching note; audit evidence requirement.
Evidence fields to assess: captures expected 79,760 and actual 69,420 images; calculates or explains 13.0% variance; uses threshold rule correctly (validation F1 must be above 0.86 and train-val gap below 5 points); cites at least three input documents; links evidence to root-cause hypothesis; states clear release/hold/correct/escalate decision; defines standard review rule; creates audit-ready reviewer criteria.
AI support tips: Use AI as a coach to ask evidence-checking questions, explain unfamiliar terms, compare possible root causes, and improve clarity. Do not use AI to invent numbers or make the decision without citing the provided documents.',
  1,
  '16 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech CSE - AI & Machine Learning Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-040' LIMIT 1),
  'B.Tech CSE - AI & Machine Learning Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech AI & Data Science - ML Engineering Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-040' LIMIT 1),
  'B.Tech AI & Data Science - ML Engineering Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Tech AI / Machine Learning Engineering
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-040' LIMIT 1),
  'M.Tech AI / Machine Learning Engineering',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Sc AI & Machine Learning
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-040' LIMIT 1),
  'M.Sc AI & Machine Learning',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MCA - AI / ML Application Development
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-040' LIMIT 1),
  'MCA - AI / ML Application Development',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Set Review Standards for NLP and LLM Evaluation
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Set Review Standards for NLP and LLM Evaluation',
  'CRS-IND-CL-045',
  'By the end of this course, the learner can set measurable standards for NLP and LLM Evaluation by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact. Workplace problem: A standards review is called because multiple teams handle customer-support ticket routing release differently when an LLM extraction feature shows structured-output errors and label-schema mismatch. The expected volume is 32,930 prompts, but only 31,130 prompts are usable, creating a 5.5% variance against the control expectation. 12.4% of outputs fail the required JSON schema and refund-intent labels are confused with complaint-intent. The accepted rule is: JSON validity must exceed 98% and critical label errors below 1%. The learner receives prompt set, LLM evaluation result table, label schema definition, failure examples, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the NLP/LLM Evaluation Failure Analysis Pack. The learner must define review rules, evidence standards, escalation thresholds, and coaching notes for future cases. Artifact: NLP/LLM Evaluation Failure Analysis Pack - Standards and Review Pack.',
  '16 hours',
  'Active',
  'Machine Learning, Deep Learning & NLP Engineering; AI Product & GenAI Application Development',
  'technical',
  '["By the end of this course, the learner can set measurable standards for NLP and LLM Evaluation by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact","Learner demonstrates NLP and LLM Evaluation by interpreting real-looking numbers, comparing evidence from prompt set and LLM evaluation result table, and producing a decision-ready artifact","Proves the learner can perform standards and governance work in NLP and LLM Evaluation with numeric evidence, workplace documents, and a reviewer-ready artifact. Status: Demo Ready"]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L5 Module: NLP and LLM Evaluation Workplace Mission
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-045' LIMIT 1),
  'L5 Module: NLP and LLM Evaluation Workplace Mission',
  'Industry requirement: Teams responsible for an LLM extraction feature need learners who can use numeric evidence, threshold rules, and workplace documents to make reliable decisions during customer-support ticket routing release, not only explain NLP and LLM Evaluation theoretically. Gap addressed: Academic learning may cover the concepts behind NLP and LLM Evaluation, but it usually does not make learners practice with prompt set, LLM evaluation result table, label schema definition, numeric variance, threshold decisions, and role handoff artifacts. Trigger: leaders need a standard rule so different teams stop making inconsistent decisions: 31,130 of 32,930 prompts passed the check, variance 5.5%, with signal ''structured-output errors and label-schema mismatch''.',
  1,
  '["Data & AI","Machine Learning, Deep Learning & NLP Engineering","AI Product & GenAI Application Development","NLP and LLM Evaluation","Primary: Evidence. Supporting: Technical, Functional, Domain, Behavioural","structured-output validation","label-schema compliance","confusion matrix review","prompt failure pattern","downstream routing risk","expected 32,930 vs actual 31,130 prompts","5.5% variance interpretation","threshold rule: JSON validity must exceed 98% and critical label errors below 1%","review standard definition","auditability","coaching rule"]'::jsonb,
  '["Engage: Learner receives a standards and governance case: customer-support ticket routing release is at risk because only 31,130 of 32,930 prompts passed the control and structured-output errors and label-schema mismatch is visible","Explore: Learner reviews prompt set, LLM evaluation result table, label schema definition, failure examples, routing product requirement, highlights the fields that prove the issue, and notes which values cross the threshold","Explain: Learner studies structured-output validation, label-schema compliance, confusion matrix review, prompt failure pattern and learns how these concepts explain the business risk, not just the technical error","Express: Learner prepares the NLP/LLM Evaluation Failure Analysis Pack with issue summary, numeric evidence, root-cause hypothesis, decision, and handoff note","Empower: Learner must define standards, thresholds, and reviewer responsibilities for customer-support ticket routing release","Evolve: Learner creates a coaching note so another reviewer can apply the standard consistently"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Scenario: NLP/LLM Evaluation Failure Analysis Pack - Standards and Review Pack
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-045' LIMIT 1)
   AND title = 'L5 Module: NLP and LLM Evaluation Workplace Mission' LIMIT 1),
  'Workplace Scenario: NLP/LLM Evaluation Failure Analysis Pack - Standards and Review Pack',
  'A standards review is called because multiple teams handle customer-support ticket routing release differently when an LLM extraction feature shows structured-output errors and label-schema mismatch. The expected volume is 32,930 prompts, but only 31,130 prompts are usable, creating a 5.5% variance against the control expectation. 12.4% of outputs fail the required JSON schema and refund-intent labels are confused with complaint-intent. The accepted rule is: JSON validity must exceed 98% and critical label errors below 1%. The learner receives prompt set, LLM evaluation result table, label schema definition, failure examples, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the NLP/LLM Evaluation Failure Analysis Pack. The learner must define review rules, evidence standards, escalation thresholds, and coaching notes for future cases. Pressure points: Customer-support ticket routing release is time-sensitive; variance is 5.5% against the rule; 12.4% of outputs fail the required JSON schema and refund-intent labels are confused with complaint-intent; multiple teams need a common standard, audit trace, and coaching rule for future decisions.',
  'Course trigger: leaders need a standard rule so different teams stop making inconsistent decisions: 31,130 of 32,930 prompts passed the check, variance 5.5%, with signal ''structured-output errors and label-schema mismatch''.
Problem statement: A standards review is called because multiple teams handle customer-support ticket routing release differently when an LLM extraction feature shows structured-output errors and label-schema mismatch. The expected volume is 32,930 prompts, but only 31,130 prompts are usable, creating a 5.5% variance against the control expectation. 12.4% of outputs fail the required JSON schema and refund-intent labels are confused with complaint-intent. The accepted rule is: JSON validity must exceed 98% and critical label errors below 1%. The learner receives prompt set, LLM evaluation result table, label schema definition, failure examples, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the NLP/LLM Evaluation Failure Analysis Pack. The learner must define review rules, evidence standards, escalation thresholds, and coaching notes for future cases.
Major concepts: structured-output validation; label-schema compliance; confusion matrix review; prompt failure pattern; downstream routing risk; expected 32,930 vs actual 31,130 prompts; 5.5% variance interpretation; threshold rule: JSON validity must exceed 98% and critical label errors below 1%; review standard definition; auditability; coaching rule.
Root-cause focus: Define standards that distinguish: ambiguous labels, prompt instruction weakness, schema constraint failure, retrieval context noise, or unsupported edge cases. Evidence must come from prompt set, LLM evaluation result table, label schema definition.
Required data: prompt set; LLM evaluation result table; label schema definition; failure examples; routing product requirement; audit observation summary; cross-team decision examples; standard template draft
Artifact: NLP/LLM Evaluation Failure Analysis Pack - Standards and Review Pack
Artifact structure: case summary; expected vs actual numbers; threshold rule; evidence table from prompt set, LLM evaluation result table, label schema definition; root-cause hypothesis; decision/action; risk note; role handoff; standard operating rule; reviewer checklist; escalation matrix; coaching note; audit evidence requirement.
Evidence fields to assess: captures expected 32,930 and actual 31,130 prompts; calculates or explains 5.5% variance; uses threshold rule correctly (JSON validity must exceed 98% and critical label errors below 1%); cites at least three input documents; links evidence to root-cause hypothesis; states clear release/hold/correct/escalate decision; defines standard review rule; creates audit-ready reviewer criteria.
AI support tips: Use AI as a coach to ask evidence-checking questions, explain unfamiliar terms, compare possible root causes, and improve clarity. Do not use AI to invent numbers or make the decision without citing the provided documents.',
  1,
  '16 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech CSE - AI & Machine Learning Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-045' LIMIT 1),
  'B.Tech CSE - AI & Machine Learning Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech AI & Data Science - ML Engineering Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-045' LIMIT 1),
  'B.Tech AI & Data Science - ML Engineering Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Tech AI / Machine Learning Engineering
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-045' LIMIT 1),
  'M.Tech AI / Machine Learning Engineering',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Sc AI & Machine Learning
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-045' LIMIT 1),
  'M.Sc AI & Machine Learning',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MCA - AI / ML Application Development
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-045' LIMIT 1),
  'MCA - AI / ML Application Development',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech CSE - AI Product Engineering Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-045' LIMIT 1),
  'B.Tech CSE - AI Product Engineering Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Set Review Standards for Canary Model Release Operation
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Set Review Standards for Canary Model Release Operation',
  'CRS-IND-CL-050',
  'By the end of this course, the learner can set measurable standards for Canary Model Release Operation by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact. Workplace problem: A standards review is called because multiple teams handle fraud model production rollout differently when a canary model release shows canary traffic metrics breach release guardrail. The expected volume is 155,500 transactions, but only 132,450 transactions are usable, creating a 14.8% variance against the control expectation. Canary false positives increased by 3.7 points and p95 latency moved from 180 ms to 310 ms. The accepted rule is: canary false-positive increase must stay below 2 points. The learner receives release checklist, canary metric dashboard, rollback decision log, model version registry, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Canary Model Release Decision Record. The learner must define review rules, evidence standards, escalation thresholds, and coaching notes for future cases. Artifact: Canary Model Release Decision Record - Standards and Review Pack.',
  '16 hours',
  'Active',
  'MLOps & AI Platform Operations',
  'technical',
  '["By the end of this course, the learner can set measurable standards for Canary Model Release Operation by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact","Learner demonstrates Canary Model Release Operation by interpreting real-looking numbers, comparing evidence from release checklist and canary metric dashboard, and producing a decision-ready artifact","Proves the learner can perform standards and governance work in Canary Model Release Operation with numeric evidence, workplace documents, and a reviewer-ready artifact. Status: Demo Ready"]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L5 Module: Canary Model Release Operation Workplace Mission
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-050' LIMIT 1),
  'L5 Module: Canary Model Release Operation Workplace Mission',
  'Industry requirement: Teams responsible for a canary model release need learners who can use numeric evidence, threshold rules, and workplace documents to make reliable decisions during fraud model production rollout, not only explain Canary Model Release Operation theoretically. Gap addressed: Academic learning may cover the concepts behind Canary Model Release Operation, but it usually does not make learners practice with release checklist, canary metric dashboard, rollback decision log, numeric variance, threshold decisions, and role handoff artifacts. Trigger: leaders need a standard rule so different teams stop making inconsistent decisions: 132,450 of 155,500 transactions passed the check, variance 14.8%, with signal ''canary traffic metrics breach release guardrail''.',
  1,
  '["Data & AI","MLOps & AI Platform Operations","Canary Model Release Operation","Primary: Evidence. Supporting: Technical, Functional, Domain, Behavioural","canary traffic split","release guardrails","rollback threshold","latency monitoring","model version control","expected 155,500 vs actual 132,450 transactions","14.8% variance interpretation","threshold rule: canary false-positive increase must stay below 2 points","review standard definition","auditability","coaching rule"]'::jsonb,
  '["Engage: Learner receives a standards and governance case: fraud model production rollout is at risk because only 132,450 of 155,500 transactions passed the control and canary traffic metrics breach release guardrail is visible","Explore: Learner reviews release checklist, canary metric dashboard, rollback decision log, model version registry, incident communication draft, highlights the fields that prove the issue, and notes which values cross the threshold","Explain: Learner studies canary traffic split, release guardrails, rollback threshold, latency monitoring and learns how these concepts explain the business risk, not just the technical error","Express: Learner prepares the Canary Model Release Decision Record with issue summary, numeric evidence, root-cause hypothesis, decision, and handoff note","Empower: Learner must define standards, thresholds, and reviewer responsibilities for fraud model production rollout","Evolve: Learner creates a coaching note so another reviewer can apply the standard consistently"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Scenario: Canary Model Release Decision Record - Standards and Review Pack
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-050' LIMIT 1)
   AND title = 'L5 Module: Canary Model Release Operation Workplace Mission' LIMIT 1),
  'Workplace Scenario: Canary Model Release Decision Record - Standards and Review Pack',
  'A standards review is called because multiple teams handle fraud model production rollout differently when a canary model release shows canary traffic metrics breach release guardrail. The expected volume is 155,500 transactions, but only 132,450 transactions are usable, creating a 14.8% variance against the control expectation. Canary false positives increased by 3.7 points and p95 latency moved from 180 ms to 310 ms. The accepted rule is: canary false-positive increase must stay below 2 points. The learner receives release checklist, canary metric dashboard, rollback decision log, model version registry, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Canary Model Release Decision Record. The learner must define review rules, evidence standards, escalation thresholds, and coaching notes for future cases. Pressure points: Fraud model production rollout is time-sensitive; variance is 14.8% against the rule; canary false positives increased by 3.7 points and p95 latency moved from 180 ms to 310 ms; multiple teams need a common standard, audit trace, and coaching rule for future decisions.',
  'Course trigger: leaders need a standard rule so different teams stop making inconsistent decisions: 132,450 of 155,500 transactions passed the check, variance 14.8%, with signal ''canary traffic metrics breach release guardrail''.
Problem statement: A standards review is called because multiple teams handle fraud model production rollout differently when a canary model release shows canary traffic metrics breach release guardrail. The expected volume is 155,500 transactions, but only 132,450 transactions are usable, creating a 14.8% variance against the control expectation. Canary false positives increased by 3.7 points and p95 latency moved from 180 ms to 310 ms. The accepted rule is: canary false-positive increase must stay below 2 points. The learner receives release checklist, canary metric dashboard, rollback decision log, model version registry, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Canary Model Release Decision Record. The learner must define review rules, evidence standards, escalation thresholds, and coaching notes for future cases.
Major concepts: canary traffic split; release guardrails; rollback threshold; latency monitoring; model version control; expected 155,500 vs actual 132,450 transactions; 14.8% variance interpretation; threshold rule: canary false-positive increase must stay below 2 points; review standard definition; auditability; coaching rule.
Root-cause focus: Define standards that distinguish: model threshold mismatch, feature parity issue, latency regression, bad canary split, or rollback criteria not met. Evidence must come from release checklist, canary metric dashboard, rollback decision log.
Required data: release checklist; canary metric dashboard; rollback decision log; model version registry; incident communication draft; audit observation summary; cross-team decision examples; standard template draft
Artifact: Canary Model Release Decision Record - Standards and Review Pack
Artifact structure: case summary; expected vs actual numbers; threshold rule; evidence table from release checklist, canary metric dashboard, rollback decision log; root-cause hypothesis; decision/action; risk note; role handoff; standard operating rule; reviewer checklist; escalation matrix; coaching note; audit evidence requirement.
Evidence fields to assess: captures expected 155,500 and actual 132,450 transactions; calculates or explains 14.8% variance; uses threshold rule correctly (canary false-positive increase must stay below 2 points); cites at least three input documents; links evidence to root-cause hypothesis; states clear release/hold/correct/escalate decision; defines standard review rule; creates audit-ready reviewer criteria.
AI support tips: Use AI as a coach to ask evidence-checking questions, explain unfamiliar terms, compare possible root causes, and improve clarity. Do not use AI to invent numbers or make the decision without citing the provided documents.',
  1,
  '16 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech CSE - AI & Machine Learning Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-050' LIMIT 1),
  'B.Tech CSE - AI & Machine Learning Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech AI & Data Science - ML Engineering Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-050' LIMIT 1),
  'B.Tech AI & Data Science - ML Engineering Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Tech AI / Machine Learning Engineering
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-050' LIMIT 1),
  'M.Tech AI / Machine Learning Engineering',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Sc AI & Machine Learning
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-050' LIMIT 1),
  'M.Sc AI & Machine Learning',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MCA - AI / ML Application Development
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-050' LIMIT 1),
  'MCA - AI / ML Application Development',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech CSE - Cloud AI / MLOps Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-050' LIMIT 1),
  'B.Tech CSE - Cloud AI / MLOps Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Set Review Standards for Model Drift Response
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Set Review Standards for Model Drift Response',
  'CRS-IND-CL-055',
  'By the end of this course, the learner can set measurable standards for Model Drift Response by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact. Workplace problem: A standards review is called because multiple teams handle monthly drift alert review differently when a production credit-risk model shows feature-skew and segment-level performance drift. The expected volume is 241,870 predictions, but only 199,940 predictions are usable, creating a 17.3% variance against the control expectation. Income_band PSI is 0.31 and AUC for new-to-credit users dropped from 0.78 to 0.71. The accepted rule is: PSI above 0.20 or AUC drop above 3 points requires triage. The learner receives drift alert log, feature-skew diagnostic sheet, production prediction sample, threshold decision record, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Model Drift Response Triage Pack. The learner must define review rules, evidence standards, escalation thresholds, and coaching notes for future cases. Artifact: Model Drift Response Triage Pack - Standards and Review Pack.',
  '16 hours',
  'Active',
  'MLOps & AI Platform Operations; Data Platform Engineering',
  'technical',
  '["By the end of this course, the learner can set measurable standards for Model Drift Response by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact","Learner demonstrates Model Drift Response by interpreting real-looking numbers, comparing evidence from drift alert log and feature-skew diagnostic sheet, and producing a decision-ready artifact","Proves the learner can perform standards and governance work in Model Drift Response with numeric evidence, workplace documents, and a reviewer-ready artifact. Status: Pilot Ready — Evidence Strengthening Needed"]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L5 Module: Model Drift Response Workplace Mission
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-055' LIMIT 1),
  'L5 Module: Model Drift Response Workplace Mission',
  'Industry requirement: Teams responsible for a production credit-risk model need learners who can use numeric evidence, threshold rules, and workplace documents to make reliable decisions during monthly drift alert review, not only explain Model Drift Response theoretically. Gap addressed: Academic learning may cover the concepts behind Model Drift Response, but it usually does not make learners practice with drift alert log, feature-skew diagnostic sheet, production prediction sample, numeric variance, threshold decisions, and role handoff artifacts. Trigger: leaders need a standard rule so different teams stop making inconsistent decisions: 199,940 of 241,870 predictions passed the check, variance 17.3%, with signal ''feature-skew and segment-level performance drift''.',
  1,
  '["Data & AI","MLOps & AI Platform Operations","Data Platform Engineering","Model Drift Response","Primary: Evidence. Supporting: Technical, Functional, Domain, Behavioural","population stability index","segment-level drift","feature-skew evidence","AUC degradation","retrain versus monitor decision","expected 241,870 vs actual 199,940 predictions","17.3% variance interpretation","threshold rule: PSI above 0.20 or AUC drop above 3 points requires triage","review standard definition","auditability","coaching rule"]'::jsonb,
  '["Engage: Learner receives a standards and governance case: monthly drift alert review is at risk because only 199,940 of 241,870 predictions passed the control and feature-skew and segment-level performance drift is visible","Explore: Learner reviews drift alert log, feature-skew diagnostic sheet, production prediction sample, threshold decision record, previous retraining note, highlights the fields that prove the issue, and notes which values cross the threshold","Explain: Learner studies population stability index, segment-level drift, feature-skew evidence, AUC degradation and learns how these concepts explain the business risk, not just the technical error","Express: Learner prepares the Model Drift Response Triage Pack with issue summary, numeric evidence, root-cause hypothesis, decision, and handoff note","Empower: Learner must define standards, thresholds, and reviewer responsibilities for monthly drift alert review","Evolve: Learner creates a coaching note so another reviewer can apply the standard consistently"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Scenario: Model Drift Response Triage Pack - Standards and Review Pack
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-055' LIMIT 1)
   AND title = 'L5 Module: Model Drift Response Workplace Mission' LIMIT 1),
  'Workplace Scenario: Model Drift Response Triage Pack - Standards and Review Pack',
  'A standards review is called because multiple teams handle monthly drift alert review differently when a production credit-risk model shows feature-skew and segment-level performance drift. The expected volume is 241,870 predictions, but only 199,940 predictions are usable, creating a 17.3% variance against the control expectation. Income_band PSI is 0.31 and AUC for new-to-credit users dropped from 0.78 to 0.71. The accepted rule is: PSI above 0.20 or AUC drop above 3 points requires triage. The learner receives drift alert log, feature-skew diagnostic sheet, production prediction sample, threshold decision record, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Model Drift Response Triage Pack. The learner must define review rules, evidence standards, escalation thresholds, and coaching notes for future cases. Pressure points: Monthly drift alert review is time-sensitive; variance is 17.3% against the rule; income_band PSI is 0.31 and AUC for new-to-credit users dropped from 0.78 to 0.71; multiple teams need a common standard, audit trace, and coaching rule for future decisions.',
  'Course trigger: leaders need a standard rule so different teams stop making inconsistent decisions: 199,940 of 241,870 predictions passed the check, variance 17.3%, with signal ''feature-skew and segment-level performance drift''.
Problem statement: A standards review is called because multiple teams handle monthly drift alert review differently when a production credit-risk model shows feature-skew and segment-level performance drift. The expected volume is 241,870 predictions, but only 199,940 predictions are usable, creating a 17.3% variance against the control expectation. Income_band PSI is 0.31 and AUC for new-to-credit users dropped from 0.78 to 0.71. The accepted rule is: PSI above 0.20 or AUC drop above 3 points requires triage. The learner receives drift alert log, feature-skew diagnostic sheet, production prediction sample, threshold decision record, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Model Drift Response Triage Pack. The learner must define review rules, evidence standards, escalation thresholds, and coaching notes for future cases.
Major concepts: population stability index; segment-level drift; feature-skew evidence; AUC degradation; retrain versus monitor decision; expected 241,870 vs actual 199,940 predictions; 17.3% variance interpretation; threshold rule: PSI above 0.20 or AUC drop above 3 points requires triage; review standard definition; auditability; coaching rule.
Root-cause focus: Define standards that distinguish: population shift, feature pipeline change, model degradation, threshold misconfiguration, or seasonal behavior change. Evidence must come from drift alert log, feature-skew diagnostic sheet, production prediction sample.
Required data: drift alert log; feature-skew diagnostic sheet; production prediction sample; threshold decision record; previous retraining note; audit observation summary; cross-team decision examples; standard template draft
Artifact: Model Drift Response Triage Pack - Standards and Review Pack
Artifact structure: case summary; expected vs actual numbers; threshold rule; evidence table from drift alert log, feature-skew diagnostic sheet, production prediction sample; root-cause hypothesis; decision/action; risk note; role handoff; standard operating rule; reviewer checklist; escalation matrix; coaching note; audit evidence requirement.
Evidence fields to assess: captures expected 241,870 and actual 199,940 predictions; calculates or explains 17.3% variance; uses threshold rule correctly (PSI above 0.20 or AUC drop above 3 points requires triage); cites at least three input documents; links evidence to root-cause hypothesis; states clear release/hold/correct/escalate decision; defines standard review rule; creates audit-ready reviewer criteria.
AI support tips: Use AI as a coach to ask evidence-checking questions, explain unfamiliar terms, compare possible root causes, and improve clarity. Do not use AI to invent numbers or make the decision without citing the provided documents.',
  1,
  '16 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech CSE - Data Engineering Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-055' LIMIT 1),
  'B.Tech CSE - Data Engineering Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech AI & Data Science - Data Platform Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-055' LIMIT 1),
  'B.Tech AI & Data Science - Data Platform Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Data Science - Data Engineering Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-055' LIMIT 1),
  'B.Sc Data Science - Data Engineering Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MCA - Data Engineering / Cloud Data Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-055' LIMIT 1),
  'MCA - Data Engineering / Cloud Data Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Tech Data Engineering / Big Data Systems
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-055' LIMIT 1),
  'M.Tech Data Engineering / Big Data Systems',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech CSE - AI & Machine Learning Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-055' LIMIT 1),
  'B.Tech CSE - AI & Machine Learning Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Set Review Standards for Edge AI Anomaly Actioning
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Set Review Standards for Edge AI Anomaly Actioning',
  'CRS-IND-CL-060',
  'By the end of this course, the learner can set measurable standards for Edge AI Anomaly Actioning by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact. Workplace problem: A standards review is called because multiple teams handle factory anomaly alert response differently when an edge AI predictive-maintenance device shows device inference anomaly and sensor packet loss. The expected volume is 121,240 readings, but only 105,280 readings are usable, creating a 13.2% variance against the control expectation. Motor vibration anomaly score reached 0.91 while 6.5% of temperature packets were missing. The accepted rule is: packet loss above 4% or anomaly score above 0.82 requires action. The learner receives edge device alert log, sensor packet summary, local inference score sheet, maintenance history note, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Edge AI Anomaly Action Record. The learner must define review rules, evidence standards, escalation thresholds, and coaching notes for future cases. Artifact: Edge AI Anomaly Action Record - Standards and Review Pack.',
  '16 hours',
  'Active',
  'Cloud, Edge, IoT & Autonomous AI Systems',
  'technical',
  '["By the end of this course, the learner can set measurable standards for Edge AI Anomaly Actioning by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact","Learner demonstrates Edge AI Anomaly Actioning by interpreting real-looking numbers, comparing evidence from edge device alert log and sensor packet summary, and producing a decision-ready artifact","Proves the learner can perform standards and governance work in Edge AI Anomaly Actioning with numeric evidence, workplace documents, and a reviewer-ready artifact. Status: Pilot Ready — Evidence Strengthening Needed"]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L5 Module: Edge AI Anomaly Actioning Workplace Mission
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-060' LIMIT 1),
  'L5 Module: Edge AI Anomaly Actioning Workplace Mission',
  'Industry requirement: Teams responsible for an edge AI predictive-maintenance device need learners who can use numeric evidence, threshold rules, and workplace documents to make reliable decisions during factory anomaly alert response, not only explain Edge AI Anomaly Actioning theoretically. Gap addressed: Academic learning may cover the concepts behind Edge AI Anomaly Actioning, but it usually does not make learners practice with edge device alert log, sensor packet summary, local inference score sheet, numeric variance, threshold decisions, and role handoff artifacts. Trigger: leaders need a standard rule so different teams stop making inconsistent decisions: 105,280 of 121,240 readings passed the check, variance 13.2%, with signal ''device inference anomaly and sensor packet loss''.',
  1,
  '["Data & AI","Cloud, Edge, IoT & Autonomous AI Systems","Edge AI Anomaly Actioning","Primary: Evidence. Supporting: Technical, Functional, Domain, Behavioural","edge inference score","sensor packet loss","local-versus-cloud decision","field maintenance escalation","false alert control","expected 121,240 vs actual 105,280 readings","13.2% variance interpretation","threshold rule: packet loss above 4% or anomaly score above 0.82 requires action","review standard definition","auditability","coaching rule"]'::jsonb,
  '["Engage: Learner receives a standards and governance case: factory anomaly alert response is at risk because only 105,280 of 121,240 readings passed the control and device inference anomaly and sensor packet loss is visible","Explore: Learner reviews edge device alert log, sensor packet summary, local inference score sheet, maintenance history note, field action ticket, highlights the fields that prove the issue, and notes which values cross the threshold","Explain: Learner studies edge inference score, sensor packet loss, local-versus-cloud decision, field maintenance escalation and learns how these concepts explain the business risk, not just the technical error","Express: Learner prepares the Edge AI Anomaly Action Record with issue summary, numeric evidence, root-cause hypothesis, decision, and handoff note","Empower: Learner must define standards, thresholds, and reviewer responsibilities for factory anomaly alert response","Evolve: Learner creates a coaching note so another reviewer can apply the standard consistently"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Scenario: Edge AI Anomaly Action Record - Standards and Review Pack
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-060' LIMIT 1)
   AND title = 'L5 Module: Edge AI Anomaly Actioning Workplace Mission' LIMIT 1),
  'Workplace Scenario: Edge AI Anomaly Action Record - Standards and Review Pack',
  'A standards review is called because multiple teams handle factory anomaly alert response differently when an edge AI predictive-maintenance device shows device inference anomaly and sensor packet loss. The expected volume is 121,240 readings, but only 105,280 readings are usable, creating a 13.2% variance against the control expectation. Motor vibration anomaly score reached 0.91 while 6.5% of temperature packets were missing. The accepted rule is: packet loss above 4% or anomaly score above 0.82 requires action. The learner receives edge device alert log, sensor packet summary, local inference score sheet, maintenance history note, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Edge AI Anomaly Action Record. The learner must define review rules, evidence standards, escalation thresholds, and coaching notes for future cases. Pressure points: Factory anomaly alert response is time-sensitive; variance is 13.2% against the rule; motor vibration anomaly score reached 0.91 while 6.5% of temperature packets were missing; multiple teams need a common standard, audit trace, and coaching rule for future decisions.',
  'Course trigger: leaders need a standard rule so different teams stop making inconsistent decisions: 105,280 of 121,240 readings passed the check, variance 13.2%, with signal ''device inference anomaly and sensor packet loss''.
Problem statement: A standards review is called because multiple teams handle factory anomaly alert response differently when an edge AI predictive-maintenance device shows device inference anomaly and sensor packet loss. The expected volume is 121,240 readings, but only 105,280 readings are usable, creating a 13.2% variance against the control expectation. Motor vibration anomaly score reached 0.91 while 6.5% of temperature packets were missing. The accepted rule is: packet loss above 4% or anomaly score above 0.82 requires action. The learner receives edge device alert log, sensor packet summary, local inference score sheet, maintenance history note, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Edge AI Anomaly Action Record. The learner must define review rules, evidence standards, escalation thresholds, and coaching notes for future cases.
Major concepts: edge inference score; sensor packet loss; local-versus-cloud decision; field maintenance escalation; false alert control; expected 121,240 vs actual 105,280 readings; 13.2% variance interpretation; threshold rule: packet loss above 4% or anomaly score above 0.82 requires action; review standard definition; auditability; coaching rule.
Root-cause focus: Define standards that distinguish: sensor failure, model edge-version mismatch, device network loss, actual equipment anomaly, or threshold calibration issue. Evidence must come from edge device alert log, sensor packet summary, local inference score sheet.
Required data: edge device alert log; sensor packet summary; local inference score sheet; maintenance history note; field action ticket; audit observation summary; cross-team decision examples; standard template draft
Artifact: Edge AI Anomaly Action Record - Standards and Review Pack
Artifact structure: case summary; expected vs actual numbers; threshold rule; evidence table from edge device alert log, sensor packet summary, local inference score sheet; root-cause hypothesis; decision/action; risk note; role handoff; standard operating rule; reviewer checklist; escalation matrix; coaching note; audit evidence requirement.
Evidence fields to assess: captures expected 121,240 and actual 105,280 readings; calculates or explains 13.2% variance; uses threshold rule correctly (packet loss above 4% or anomaly score above 0.82 requires action); cites at least three input documents; links evidence to root-cause hypothesis; states clear release/hold/correct/escalate decision; defines standard review rule; creates audit-ready reviewer criteria.
AI support tips: Use AI as a coach to ask evidence-checking questions, explain unfamiliar terms, compare possible root causes, and improve clarity. Do not use AI to invent numbers or make the decision without citing the provided documents.',
  1,
  '16 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech CSE - Data Engineering Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-060' LIMIT 1),
  'B.Tech CSE - Data Engineering Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech AI & Data Science - Data Platform Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-060' LIMIT 1),
  'B.Tech AI & Data Science - Data Platform Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Data Science - Data Engineering Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-060' LIMIT 1),
  'B.Sc Data Science - Data Engineering Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MCA - Data Engineering / Cloud Data Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-060' LIMIT 1),
  'MCA - Data Engineering / Cloud Data Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Tech Data Engineering / Big Data Systems
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-060' LIMIT 1),
  'M.Tech Data Engineering / Big Data Systems',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech AI & Data Science - Applied Industry AI Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-060' LIMIT 1),
  'B.Tech AI & Data Science - Applied Industry AI Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Set Review Standards for Data Governance Control Maintenance
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Set Review Standards for Data Governance Control Maintenance',
  'CRS-IND-CL-065',
  'By the end of this course, the learner can set measurable standards for Data Governance Control Maintenance by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact. Workplace problem: A standards review is called because multiple teams handle privacy and lineage control review differently when a governed customer data asset shows unmapped downstream report and missing data-owner approval. The expected volume is 35,030 attributes, but only 33,253 attributes are usable, creating a 5.1% variance against the control expectation. 37 attributes lack sensitivity tags and 8 downstream reports are missing from lineage. The accepted rule is: critical attributes must have 100% owner, lineage, and policy tagging. The learner receives data asset inventory, lineage extract, policy tag register, owner approval sheet, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Data Governance Control Maintenance Log. The learner must define review rules, evidence standards, escalation thresholds, and coaching notes for future cases. Artifact: Data Governance Control Maintenance Log - Standards and Review Pack.',
  '16 hours',
  'Active',
  'Data Governance & Stewardship',
  'technical',
  '["By the end of this course, the learner can set measurable standards for Data Governance Control Maintenance by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact","Learner demonstrates Data Governance Control Maintenance by interpreting real-looking numbers, comparing evidence from data asset inventory and lineage extract, and producing a decision-ready artifact","Proves the learner can perform standards and governance work in Data Governance Control Maintenance with numeric evidence, workplace documents, and a reviewer-ready artifact. Status: Demo Ready"]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L5 Module: Data Governance Control Maintenance Workplace Mission
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-065' LIMIT 1),
  'L5 Module: Data Governance Control Maintenance Workplace Mission',
  'Industry requirement: Teams responsible for a governed customer data asset need learners who can use numeric evidence, threshold rules, and workplace documents to make reliable decisions during privacy and lineage control review, not only explain Data Governance Control Maintenance theoretically. Gap addressed: Academic learning may cover the concepts behind Data Governance Control Maintenance, but it usually does not make learners practice with data asset inventory, lineage extract, policy tag register, numeric variance, threshold decisions, and role handoff artifacts. Trigger: leaders need a standard rule so different teams stop making inconsistent decisions: 33,253 of 35,030 attributes passed the check, variance 5.1%, with signal ''unmapped downstream report and missing data-owner approval''.',
  1,
  '["Data & AI","Data Governance & Stewardship","Data Governance Control Maintenance","Primary: Compliance. Supporting: Evidence, Technical, Communication, Behavioural","data ownership","lineage completeness","policy tagging","sensitive data classification","governance control evidence","expected 35,030 vs actual 33,253 attributes","5.1% variance interpretation","threshold rule: critical attributes must have 100% owner, lineage, and policy tagging","review standard definition","auditability","coaching rule"]'::jsonb,
  '["Engage: Learner receives a standards and governance case: privacy and lineage control review is at risk because only 33,253 of 35,030 attributes passed the control and unmapped downstream report and missing data-owner approval is visible","Explore: Learner reviews data asset inventory, lineage extract, policy tag register, owner approval sheet, downstream report list, highlights the fields that prove the issue, and notes which values cross the threshold","Explain: Learner studies data ownership, lineage completeness, policy tagging, sensitive data classification and learns how these concepts explain the business risk, not just the technical error","Express: Learner prepares the Data Governance Control Maintenance Log with issue summary, numeric evidence, root-cause hypothesis, decision, and handoff note","Empower: Learner must define standards, thresholds, and reviewer responsibilities for privacy and lineage control review","Evolve: Learner creates a coaching note so another reviewer can apply the standard consistently"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Scenario: Data Governance Control Maintenance Log - Standards and Review Pack
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-065' LIMIT 1)
   AND title = 'L5 Module: Data Governance Control Maintenance Workplace Mission' LIMIT 1),
  'Workplace Scenario: Data Governance Control Maintenance Log - Standards and Review Pack',
  'A standards review is called because multiple teams handle privacy and lineage control review differently when a governed customer data asset shows unmapped downstream report and missing data-owner approval. The expected volume is 35,030 attributes, but only 33,253 attributes are usable, creating a 5.1% variance against the control expectation. 37 attributes lack sensitivity tags and 8 downstream reports are missing from lineage. The accepted rule is: critical attributes must have 100% owner, lineage, and policy tagging. The learner receives data asset inventory, lineage extract, policy tag register, owner approval sheet, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Data Governance Control Maintenance Log. The learner must define review rules, evidence standards, escalation thresholds, and coaching notes for future cases. Pressure points: Privacy and lineage control review is time-sensitive; variance is 5.1% against the rule; 37 attributes lack sensitivity tags and 8 downstream reports are missing from lineage; multiple teams need a common standard, audit trace, and coaching rule for future decisions.',
  'Course trigger: leaders need a standard rule so different teams stop making inconsistent decisions: 33,253 of 35,030 attributes passed the check, variance 5.1%, with signal ''unmapped downstream report and missing data-owner approval''.
Problem statement: A standards review is called because multiple teams handle privacy and lineage control review differently when a governed customer data asset shows unmapped downstream report and missing data-owner approval. The expected volume is 35,030 attributes, but only 33,253 attributes are usable, creating a 5.1% variance against the control expectation. 37 attributes lack sensitivity tags and 8 downstream reports are missing from lineage. The accepted rule is: critical attributes must have 100% owner, lineage, and policy tagging. The learner receives data asset inventory, lineage extract, policy tag register, owner approval sheet, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Data Governance Control Maintenance Log. The learner must define review rules, evidence standards, escalation thresholds, and coaching notes for future cases.
Major concepts: data ownership; lineage completeness; policy tagging; sensitive data classification; governance control evidence; expected 35,030 vs actual 33,253 attributes; 5.1% variance interpretation; threshold rule: critical attributes must have 100% owner, lineage, and policy tagging; review standard definition; auditability; coaching rule.
Root-cause focus: Define standards that distinguish: missing data-owner mapping, stale lineage, untagged sensitive attribute, policy exception, or unregistered report dependency. Evidence must come from data asset inventory, lineage extract, policy tag register.
Required data: data asset inventory; lineage extract; policy tag register; owner approval sheet; downstream report list; audit observation summary; cross-team decision examples; standard template draft
Artifact: Data Governance Control Maintenance Log - Standards and Review Pack
Artifact structure: case summary; expected vs actual numbers; threshold rule; evidence table from data asset inventory, lineage extract, policy tag register; root-cause hypothesis; decision/action; risk note; role handoff; standard operating rule; reviewer checklist; escalation matrix; coaching note; audit evidence requirement.
Evidence fields to assess: captures expected 35,030 and actual 33,253 attributes; calculates or explains 5.1% variance; uses threshold rule correctly (critical attributes must have 100% owner, lineage, and policy tagging); cites at least three input documents; links evidence to root-cause hypothesis; states clear release/hold/correct/escalate decision; defines standard review rule; creates audit-ready reviewer criteria.
AI support tips: Use AI as a coach to ask evidence-checking questions, explain unfamiliar terms, compare possible root causes, and improve clarity. Do not use AI to invent numbers or make the decision without citing the provided documents.',
  1,
  '16 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech AI & Data Science - Responsible AI Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-065' LIMIT 1),
  'B.Tech AI & Data Science - Responsible AI Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech CSE - AI Security / Governance Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-065' LIMIT 1),
  'B.Tech CSE - AI Security / Governance Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MBA Business Analytics - AI Risk & Governance Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-065' LIMIT 1),
  'MBA Business Analytics - AI Risk & Governance Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: LL.B / Tech Law - Data Privacy & AI Governance Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-065' LIMIT 1),
  'LL.B / Tech Law - Data Privacy & AI Governance Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PG Certificate - Responsible AI, Risk & Compliance
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-065' LIMIT 1),
  'PG Certificate - Responsible AI, Risk & Compliance',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech CSE / Data Science - Data Governance Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-065' LIMIT 1),
  'B.Tech CSE / Data Science - Data Governance Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Set Review Standards for Responsible AI Deployment Approval
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Set Review Standards for Responsible AI Deployment Approval',
  'CRS-IND-CL-070',
  'By the end of this course, the learner can set measurable standards for Responsible AI Deployment Approval by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact. Workplace problem: A standards review is called because multiple teams handle loan-assistant chatbot approval differently when a responsible AI deployment request shows incomplete risk control evidence before deployment. The expected volume is 36,028 checks, but only 34,191 checks are usable, creating a 5.1% variance against the control expectation. Fairness test evidence is missing for 2 protected segments and human-review fallback is not signed off. The accepted rule is: all high-risk controls must be approved before deployment. The learner receives AI use-case registration, risk assessment form, fairness test summary, human fallback design, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Responsible AI Deployment Approval Dossier. The learner must define review rules, evidence standards, escalation thresholds, and coaching notes for future cases. Artifact: Responsible AI Deployment Approval Dossier - Standards and Review Pack.',
  '16 hours',
  'Active',
  'Responsible AI, Risk, Privacy & Security',
  'technical',
  '["By the end of this course, the learner can set measurable standards for Responsible AI Deployment Approval by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact","Learner demonstrates Responsible AI Deployment Approval by interpreting real-looking numbers, comparing evidence from AI use-case registration and risk assessment form, and producing a decision-ready artifact","Proves the learner can perform standards and governance work in Responsible AI Deployment Approval with numeric evidence, workplace documents, and a reviewer-ready artifact. Status: Demo Ready"]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L5 Module: Responsible AI Deployment Approval Workplace Mission
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-070' LIMIT 1),
  'L5 Module: Responsible AI Deployment Approval Workplace Mission',
  'Industry requirement: Teams responsible for a responsible AI deployment request need learners who can use numeric evidence, threshold rules, and workplace documents to make reliable decisions during loan-assistant chatbot approval, not only explain Responsible AI Deployment Approval theoretically. Gap addressed: Academic learning may cover the concepts behind Responsible AI Deployment Approval, but it usually does not make learners practice with AI use-case registration, risk assessment form, fairness test summary, numeric variance, threshold decisions, and role handoff artifacts. Trigger: leaders need a standard rule so different teams stop making inconsistent decisions: 34,191 of 36,028 checks passed the check, variance 5.1%, with signal ''incomplete risk control evidence before deployment''.',
  1,
  '["Data & AI","Responsible AI, Risk, Privacy & Security","Responsible AI Deployment Approval","Primary: Compliance. Supporting: Evidence, Technical, Communication, Behavioural","AI use-case risk tier","fairness evidence","human oversight control","deployment approval gate","responsible AI audit trail","expected 36,028 vs actual 34,191 checks","5.1% variance interpretation","threshold rule: all high-risk controls must be approved before deployment","review standard definition","auditability","coaching rule"]'::jsonb,
  '["Engage: Learner receives a standards and governance case: loan-assistant chatbot approval is at risk because only 34,191 of 36,028 checks passed the control and incomplete risk control evidence before deployment is visible","Explore: Learner reviews AI use-case registration, risk assessment form, fairness test summary, human fallback design, deployment approval checklist, highlights the fields that prove the issue, and notes which values cross the threshold","Explain: Learner studies AI use-case risk tier, fairness evidence, human oversight control, deployment approval gate and learns how these concepts explain the business risk, not just the technical error","Express: Learner prepares the Responsible AI Deployment Approval Dossier with issue summary, numeric evidence, root-cause hypothesis, decision, and handoff note","Empower: Learner must define standards, thresholds, and reviewer responsibilities for loan-assistant chatbot approval","Evolve: Learner creates a coaching note so another reviewer can apply the standard consistently"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Scenario: Responsible AI Deployment Approval Dossier - Standards and Review Pack
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-070' LIMIT 1)
   AND title = 'L5 Module: Responsible AI Deployment Approval Workplace Mission' LIMIT 1),
  'Workplace Scenario: Responsible AI Deployment Approval Dossier - Standards and Review Pack',
  'A standards review is called because multiple teams handle loan-assistant chatbot approval differently when a responsible AI deployment request shows incomplete risk control evidence before deployment. The expected volume is 36,028 checks, but only 34,191 checks are usable, creating a 5.1% variance against the control expectation. Fairness test evidence is missing for 2 protected segments and human-review fallback is not signed off. The accepted rule is: all high-risk controls must be approved before deployment. The learner receives AI use-case registration, risk assessment form, fairness test summary, human fallback design, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Responsible AI Deployment Approval Dossier. The learner must define review rules, evidence standards, escalation thresholds, and coaching notes for future cases. Pressure points: Loan-assistant chatbot approval is time-sensitive; variance is 5.1% against the rule; fairness test evidence is missing for 2 protected segments and human-review fallback is not signed off; multiple teams need a common standard, audit trace, and coaching rule for future decisions.',
  'Course trigger: leaders need a standard rule so different teams stop making inconsistent decisions: 34,191 of 36,028 checks passed the check, variance 5.1%, with signal ''incomplete risk control evidence before deployment''.
Problem statement: A standards review is called because multiple teams handle loan-assistant chatbot approval differently when a responsible AI deployment request shows incomplete risk control evidence before deployment. The expected volume is 36,028 checks, but only 34,191 checks are usable, creating a 5.1% variance against the control expectation. Fairness test evidence is missing for 2 protected segments and human-review fallback is not signed off. The accepted rule is: all high-risk controls must be approved before deployment. The learner receives AI use-case registration, risk assessment form, fairness test summary, human fallback design, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Responsible AI Deployment Approval Dossier. The learner must define review rules, evidence standards, escalation thresholds, and coaching notes for future cases.
Major concepts: AI use-case risk tier; fairness evidence; human oversight control; deployment approval gate; responsible AI audit trail; expected 36,028 vs actual 34,191 checks; 5.1% variance interpretation; threshold rule: all high-risk controls must be approved before deployment; review standard definition; auditability; coaching rule.
Root-cause focus: Define standards that distinguish: missing fairness evidence, unclear human oversight, privacy risk gap, unapproved fallback, or incomplete model documentation. Evidence must come from AI use-case registration, risk assessment form, fairness test summary.
Required data: AI use-case registration; risk assessment form; fairness test summary; human fallback design; deployment approval checklist; audit observation summary; cross-team decision examples; standard template draft
Artifact: Responsible AI Deployment Approval Dossier - Standards and Review Pack
Artifact structure: case summary; expected vs actual numbers; threshold rule; evidence table from AI use-case registration, risk assessment form, fairness test summary; root-cause hypothesis; decision/action; risk note; role handoff; standard operating rule; reviewer checklist; escalation matrix; coaching note; audit evidence requirement.
Evidence fields to assess: captures expected 36,028 and actual 34,191 checks; calculates or explains 5.1% variance; uses threshold rule correctly (all high-risk controls must be approved before deployment); cites at least three input documents; links evidence to root-cause hypothesis; states clear release/hold/correct/escalate decision; defines standard review rule; creates audit-ready reviewer criteria.
AI support tips: Use AI as a coach to ask evidence-checking questions, explain unfamiliar terms, compare possible root causes, and improve clarity. Do not use AI to invent numbers or make the decision without citing the provided documents.',
  1,
  '16 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech AI & Data Science - Responsible AI Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-070' LIMIT 1),
  'B.Tech AI & Data Science - Responsible AI Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech CSE - AI Security / Governance Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-070' LIMIT 1),
  'B.Tech CSE - AI Security / Governance Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MBA Business Analytics - AI Risk & Governance Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-070' LIMIT 1),
  'MBA Business Analytics - AI Risk & Governance Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: LL.B / Tech Law - Data Privacy & AI Governance Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-070' LIMIT 1),
  'LL.B / Tech Law - Data Privacy & AI Governance Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PG Certificate - Responsible AI, Risk & Compliance
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-070' LIMIT 1),
  'PG Certificate - Responsible AI, Risk & Compliance',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Set Review Standards for AI Security Abuse-Path Testing
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Set Review Standards for AI Security Abuse-Path Testing',
  'CRS-IND-CL-075',
  'By the end of this course, the learner can set measurable standards for AI Security Abuse-Path Testing by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact. Workplace problem: A standards review is called because multiple teams handle AI security abuse-path test differently when a GenAI knowledge assistant shows prompt-injection and retrieval data exposure risk. The expected volume is 37,590 tests, but only 35,586 tests are usable, creating a 5.3% variance against the control expectation. 9 prompt-injection tests reveal restricted policy snippets and 14 retrieval responses cite unapproved documents. The accepted rule is: critical abuse paths must have 0 data-exposure passes. The learner receives abuse-path test script, prompt-injection result log, retrieval access-control matrix, sensitive response examples, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the AI Security Abuse-Path Test Report. The learner must define review rules, evidence standards, escalation thresholds, and coaching notes for future cases. Artifact: AI Security Abuse-Path Test Report - Standards and Review Pack.',
  '16 hours',
  'Active',
  'Responsible AI, Risk, Privacy & Security',
  'technical',
  '["By the end of this course, the learner can set measurable standards for AI Security Abuse-Path Testing by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact","Learner demonstrates AI Security Abuse-Path Testing by interpreting real-looking numbers, comparing evidence from abuse-path test script and prompt-injection result log, and producing a decision-ready artifact","Proves the learner can perform standards and governance work in AI Security Abuse-Path Testing with numeric evidence, workplace documents, and a reviewer-ready artifact. Status: Pilot Ready — Evidence Strengthening Needed"]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L5 Module: AI Security Abuse-Path Testing Workplace Mission
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-075' LIMIT 1),
  'L5 Module: AI Security Abuse-Path Testing Workplace Mission',
  'Industry requirement: Teams responsible for a GenAI knowledge assistant need learners who can use numeric evidence, threshold rules, and workplace documents to make reliable decisions during AI security abuse-path test, not only explain AI Security Abuse-Path Testing theoretically. Gap addressed: Academic learning may cover the concepts behind AI Security Abuse-Path Testing, but it usually does not make learners practice with abuse-path test script, prompt-injection result log, retrieval access-control matrix, numeric variance, threshold decisions, and role handoff artifacts. Trigger: leaders need a standard rule so different teams stop making inconsistent decisions: 35,586 of 37,590 tests passed the check, variance 5.3%, with signal ''prompt-injection and retrieval data exposure risk''.',
  1,
  '["Data & AI","Responsible AI, Risk, Privacy & Security","AI Security Abuse-Path Testing","Primary: Compliance. Supporting: Evidence, Technical, Communication, Behavioural","prompt-injection pattern","retrieval access control","data exposure severity","red-team evidence","mitigation decision","expected 37,590 vs actual 35,586 tests","5.3% variance interpretation","threshold rule: critical abuse paths must have 0 data-exposure passes","review standard definition","auditability","coaching rule"]'::jsonb,
  '["Engage: Learner receives a standards and governance case: AI security abuse-path test is at risk because only 35,586 of 37,590 tests passed the control and prompt-injection and retrieval data exposure risk is visible","Explore: Learner reviews abuse-path test script, prompt-injection result log, retrieval access-control matrix, sensitive response examples, security triage ticket, highlights the fields that prove the issue, and notes which values cross the threshold","Explain: Learner studies prompt-injection pattern, retrieval access control, data exposure severity, red-team evidence and learns how these concepts explain the business risk, not just the technical error","Express: Learner prepares the AI Security Abuse-Path Test Report with issue summary, numeric evidence, root-cause hypothesis, decision, and handoff note","Empower: Learner must define standards, thresholds, and reviewer responsibilities for AI security abuse-path test","Evolve: Learner creates a coaching note so another reviewer can apply the standard consistently"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Scenario: AI Security Abuse-Path Test Report - Standards and Review Pack
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-075' LIMIT 1)
   AND title = 'L5 Module: AI Security Abuse-Path Testing Workplace Mission' LIMIT 1),
  'Workplace Scenario: AI Security Abuse-Path Test Report - Standards and Review Pack',
  'A standards review is called because multiple teams handle AI security abuse-path test differently when a GenAI knowledge assistant shows prompt-injection and retrieval data exposure risk. The expected volume is 37,590 tests, but only 35,586 tests are usable, creating a 5.3% variance against the control expectation. 9 prompt-injection tests reveal restricted policy snippets and 14 retrieval responses cite unapproved documents. The accepted rule is: critical abuse paths must have 0 data-exposure passes. The learner receives abuse-path test script, prompt-injection result log, retrieval access-control matrix, sensitive response examples, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the AI Security Abuse-Path Test Report. The learner must define review rules, evidence standards, escalation thresholds, and coaching notes for future cases. Pressure points: Ai security abuse-path test is time-sensitive; variance is 5.3% against the rule; 9 prompt-injection tests reveal restricted policy snippets and 14 retrieval responses cite unapproved documents; multiple teams need a common standard, audit trace, and coaching rule for future decisions.',
  'Course trigger: leaders need a standard rule so different teams stop making inconsistent decisions: 35,586 of 37,590 tests passed the check, variance 5.3%, with signal ''prompt-injection and retrieval data exposure risk''.
Problem statement: A standards review is called because multiple teams handle AI security abuse-path test differently when a GenAI knowledge assistant shows prompt-injection and retrieval data exposure risk. The expected volume is 37,590 tests, but only 35,586 tests are usable, creating a 5.3% variance against the control expectation. 9 prompt-injection tests reveal restricted policy snippets and 14 retrieval responses cite unapproved documents. The accepted rule is: critical abuse paths must have 0 data-exposure passes. The learner receives abuse-path test script, prompt-injection result log, retrieval access-control matrix, sensitive response examples, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the AI Security Abuse-Path Test Report. The learner must define review rules, evidence standards, escalation thresholds, and coaching notes for future cases.
Major concepts: prompt-injection pattern; retrieval access control; data exposure severity; red-team evidence; mitigation decision; expected 37,590 vs actual 35,586 tests; 5.3% variance interpretation; threshold rule: critical abuse paths must have 0 data-exposure passes; review standard definition; auditability; coaching rule.
Root-cause focus: Define standards that distinguish: weak system prompt boundary, retrieval permission leak, unsafe tool call, sensitive context exposure, or missing refusal test. Evidence must come from abuse-path test script, prompt-injection result log, retrieval access-control matrix.
Required data: abuse-path test script; prompt-injection result log; retrieval access-control matrix; sensitive response examples; security triage ticket; audit observation summary; cross-team decision examples; standard template draft
Artifact: AI Security Abuse-Path Test Report - Standards and Review Pack
Artifact structure: case summary; expected vs actual numbers; threshold rule; evidence table from abuse-path test script, prompt-injection result log, retrieval access-control matrix; root-cause hypothesis; decision/action; risk note; role handoff; standard operating rule; reviewer checklist; escalation matrix; coaching note; audit evidence requirement.
Evidence fields to assess: captures expected 37,590 and actual 35,586 tests; calculates or explains 5.3% variance; uses threshold rule correctly (critical abuse paths must have 0 data-exposure passes); cites at least three input documents; links evidence to root-cause hypothesis; states clear release/hold/correct/escalate decision; defines standard review rule; creates audit-ready reviewer criteria.
AI support tips: Use AI as a coach to ask evidence-checking questions, explain unfamiliar terms, compare possible root causes, and improve clarity. Do not use AI to invent numbers or make the decision without citing the provided documents.',
  1,
  '16 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech AI & Data Science - Responsible AI Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-075' LIMIT 1),
  'B.Tech AI & Data Science - Responsible AI Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech CSE - AI Security / Governance Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-075' LIMIT 1),
  'B.Tech CSE - AI Security / Governance Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MBA Business Analytics - AI Risk & Governance Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-075' LIMIT 1),
  'MBA Business Analytics - AI Risk & Governance Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: LL.B / Tech Law - Data Privacy & AI Governance Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-075' LIMIT 1),
  'LL.B / Tech Law - Data Privacy & AI Governance Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PG Certificate - Responsible AI, Risk & Compliance
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-075' LIMIT 1),
  'PG Certificate - Responsible AI, Risk & Compliance',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Set Review Standards for GenAI Feature Specification
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Set Review Standards for GenAI Feature Specification',
  'CRS-IND-CL-080',
  'By the end of this course, the learner can set measurable standards for GenAI Feature Specification by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact. Workplace problem: A standards review is called because multiple teams handle support-agent copilot specification differently when a GenAI product feature shows unclear feature scope and missing acceptance criteria. The expected volume is 38,754 stories, but only 36,662 stories are usable, creating a 5.4% variance against the control expectation. 6 stories allow auto-send without human confirmation and 5 lack hallucination-control criteria. The accepted rule is: all high-priority stories need measurable acceptance criteria and risk notes. The learner receives product requirement brief, conversation journey map, acceptance criteria draft, risk-control checklist, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the GenAI Feature Specification Pack. The learner must define review rules, evidence standards, escalation thresholds, and coaching notes for future cases. Artifact: GenAI Feature Specification Pack - Standards and Review Pack.',
  '16 hours',
  'Active',
  'AI Product & GenAI Application Development',
  'technical',
  '["By the end of this course, the learner can set measurable standards for GenAI Feature Specification by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact","Learner demonstrates GenAI Feature Specification by interpreting real-looking numbers, comparing evidence from product requirement brief and conversation journey map, and producing a decision-ready artifact","Proves the learner can perform standards and governance work in GenAI Feature Specification with numeric evidence, workplace documents, and a reviewer-ready artifact. Status: Demo Ready"]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L5 Module: GenAI Feature Specification Workplace Mission
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-080' LIMIT 1),
  'L5 Module: GenAI Feature Specification Workplace Mission',
  'Industry requirement: Teams responsible for a GenAI product feature need learners who can use numeric evidence, threshold rules, and workplace documents to make reliable decisions during support-agent copilot specification, not only explain GenAI Feature Specification theoretically. Gap addressed: Academic learning may cover the concepts behind GenAI Feature Specification, but it usually does not make learners practice with product requirement brief, conversation journey map, acceptance criteria draft, numeric variance, threshold decisions, and role handoff artifacts. Trigger: leaders need a standard rule so different teams stop making inconsistent decisions: 36,662 of 38,754 stories passed the check, variance 5.4%, with signal ''unclear feature scope and missing acceptance criteria''.',
  1,
  '["Data & AI","AI Product & GenAI Application Development","GenAI Feature Specification","Primary: Functional. Supporting: Cognitive, Communication, AI/Digital, Behavioural","GenAI feature boundary","human-in-the-loop acceptance","hallucination control","prompt workflow requirement","success metric definition","expected 38,754 vs actual 36,662 stories","5.4% variance interpretation","threshold rule: all high-priority stories need measurable acceptance criteria and risk notes","review standard definition","auditability","coaching rule"]'::jsonb,
  '["Engage: Learner receives a standards and governance case: support-agent copilot specification is at risk because only 36,662 of 38,754 stories passed the control and unclear feature scope and missing acceptance criteria is visible","Explore: Learner reviews product requirement brief, conversation journey map, acceptance criteria draft, risk-control checklist, stakeholder feedback notes, highlights the fields that prove the issue, and notes which values cross the threshold","Explain: Learner studies GenAI feature boundary, human-in-the-loop acceptance, hallucination control, prompt workflow requirement and learns how these concepts explain the business risk, not just the technical error","Express: Learner prepares the GenAI Feature Specification Pack with issue summary, numeric evidence, root-cause hypothesis, decision, and handoff note","Empower: Learner must define standards, thresholds, and reviewer responsibilities for support-agent copilot specification","Evolve: Learner creates a coaching note so another reviewer can apply the standard consistently"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Scenario: GenAI Feature Specification Pack - Standards and Review Pack
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-080' LIMIT 1)
   AND title = 'L5 Module: GenAI Feature Specification Workplace Mission' LIMIT 1),
  'Workplace Scenario: GenAI Feature Specification Pack - Standards and Review Pack',
  'A standards review is called because multiple teams handle support-agent copilot specification differently when a GenAI product feature shows unclear feature scope and missing acceptance criteria. The expected volume is 38,754 stories, but only 36,662 stories are usable, creating a 5.4% variance against the control expectation. 6 stories allow auto-send without human confirmation and 5 lack hallucination-control criteria. The accepted rule is: all high-priority stories need measurable acceptance criteria and risk notes. The learner receives product requirement brief, conversation journey map, acceptance criteria draft, risk-control checklist, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the GenAI Feature Specification Pack. The learner must define review rules, evidence standards, escalation thresholds, and coaching notes for future cases. Pressure points: Support-agent copilot specification is time-sensitive; variance is 5.4% against the rule; 6 stories allow auto-send without human confirmation and 5 lack hallucination-control criteria; multiple teams need a common standard, audit trace, and coaching rule for future decisions.',
  'Course trigger: leaders need a standard rule so different teams stop making inconsistent decisions: 36,662 of 38,754 stories passed the check, variance 5.4%, with signal ''unclear feature scope and missing acceptance criteria''.
Problem statement: A standards review is called because multiple teams handle support-agent copilot specification differently when a GenAI product feature shows unclear feature scope and missing acceptance criteria. The expected volume is 38,754 stories, but only 36,662 stories are usable, creating a 5.4% variance against the control expectation. 6 stories allow auto-send without human confirmation and 5 lack hallucination-control criteria. The accepted rule is: all high-priority stories need measurable acceptance criteria and risk notes. The learner receives product requirement brief, conversation journey map, acceptance criteria draft, risk-control checklist, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the GenAI Feature Specification Pack. The learner must define review rules, evidence standards, escalation thresholds, and coaching notes for future cases.
Major concepts: GenAI feature boundary; human-in-the-loop acceptance; hallucination control; prompt workflow requirement; success metric definition; expected 38,754 vs actual 36,662 stories; 5.4% variance interpretation; threshold rule: all high-priority stories need measurable acceptance criteria and risk notes; review standard definition; auditability; coaching rule.
Root-cause focus: Define standards that distinguish: unclear user workflow, missing acceptance criteria, unsafe automation boundary, hallucination-control gap, or unmeasured success metric. Evidence must come from product requirement brief, conversation journey map, acceptance criteria draft.
Required data: product requirement brief; conversation journey map; acceptance criteria draft; risk-control checklist; stakeholder feedback notes; audit observation summary; cross-team decision examples; standard template draft
Artifact: GenAI Feature Specification Pack - Standards and Review Pack
Artifact structure: case summary; expected vs actual numbers; threshold rule; evidence table from product requirement brief, conversation journey map, acceptance criteria draft; root-cause hypothesis; decision/action; risk note; role handoff; standard operating rule; reviewer checklist; escalation matrix; coaching note; audit evidence requirement.
Evidence fields to assess: captures expected 38,754 and actual 36,662 stories; calculates or explains 5.4% variance; uses threshold rule correctly (all high-priority stories need measurable acceptance criteria and risk notes); cites at least three input documents; links evidence to root-cause hypothesis; states clear release/hold/correct/escalate decision; defines standard review rule; creates audit-ready reviewer criteria.
AI support tips: Use AI as a coach to ask evidence-checking questions, explain unfamiliar terms, compare possible root causes, and improve clarity. Do not use AI to invent numbers or make the decision without citing the provided documents.',
  1,
  '16 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech CSE - AI & Machine Learning Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-080' LIMIT 1),
  'B.Tech CSE - AI & Machine Learning Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech AI & Data Science - ML Engineering Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-080' LIMIT 1),
  'B.Tech AI & Data Science - ML Engineering Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Tech AI / Machine Learning Engineering
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-080' LIMIT 1),
  'M.Tech AI / Machine Learning Engineering',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Sc AI & Machine Learning
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-080' LIMIT 1),
  'M.Sc AI & Machine Learning',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MCA - AI / ML Application Development
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-080' LIMIT 1),
  'MCA - AI / ML Application Development',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech CSE - AI Product Engineering Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-080' LIMIT 1),
  'B.Tech CSE - AI Product Engineering Track',
  NOW()
) ON CONFLICT DO NOTHING;

COMMIT;

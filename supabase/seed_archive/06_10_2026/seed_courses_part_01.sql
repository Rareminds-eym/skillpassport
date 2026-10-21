-- ============================================
-- COURSE SEED — part 01 of 10
-- Courses 1–50 of 485
-- Paste this whole file into the Supabase SQL editor and Run.
-- Safe to re-run (ON CONFLICT DO NOTHING). Run parts in order.
-- ============================================

BEGIN;

-- Insert Course: Review Lakehouse Pipeline Controls Evidence with a Guided Checklist
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Review Lakehouse Pipeline Controls Evidence with a Guided Checklist',
  'CRS-IND-CL-001',
  'By the end of this course, the learner can review guided evidence for Lakehouse Pipeline Controls by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact. Workplace problem: During a guided training simulation for daily revenue dashboard refresh, a retail sales lakehouse pipeline shows bronze-to-silver load variance and a schema warning. The expected volume is 97,370 records, but only 89,760 records are usable, creating a 7.8% variance against the control expectation. The `discount_code` field is missing in 14% of rows and `customer_region` has a new APAC-South value. The accepted rule is: record variance must stay under 1.5%. The learner receives pipeline failure log, source file profile, schema comparison sheet, record completeness report, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Lakehouse Pipeline Control Exception Note. The learner follows a checklist to identify the visible issue, mark the risk level, and prepare the first evidence note. Artifact: Lakehouse Pipeline Control Exception Note - Guided Evidence Note.',
  '8  hours',
  'Active',
  'Data Engineering & Lakehouse Operations',
  'technical',
  '["By the end of this course, the learner can review guided evidence for Lakehouse Pipeline Controls by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact","Learner demonstrates Lakehouse Pipeline Controls by interpreting real-looking numbers, comparing evidence from pipeline failure log and source file profile, and producing a decision-ready artifact","Proves the learner can perform guided checklist work in Lakehouse Pipeline Controls with numeric evidence, workplace documents, and a reviewer-ready artifact. Status: Demo Ready"]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L1 Module: Lakehouse Pipeline Controls Workplace Mission
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-001' LIMIT 1),
  'L1 Module: Lakehouse Pipeline Controls Workplace Mission',
  'Industry requirement: Teams responsible for a retail sales lakehouse pipeline need learners who can use numeric evidence, threshold rules, and workplace documents to make reliable decisions during daily revenue dashboard refresh, not only explain Lakehouse Pipeline Controls theoretically. Gap addressed: Academic learning may cover the concepts behind Lakehouse Pipeline Controls, but it usually does not make learners practice with pipeline failure log, source file profile, schema comparison sheet, numeric variance, threshold decisions, and role handoff artifacts. Trigger: supervisor flags the issue as a guided practice case: 89,760 of 97,370 records passed the check, variance 7.8%, with signal ''bronze-to-silver load variance and a schema warning''.',
  1,
  '["Data & AI","Data Platform Engineering","Data Engineering & Lakehouse Operations","Lakehouse Pipeline Controls","Primary: Evidence. Supporting: Technical, Functional, Domain","expected vs actual record-count variance","schema version mismatch","source-to-bronze reconciliation","bronze-to-silver completeness check","dashboard release hold decision","expected 97,370 vs actual 89,760 records","7.8% variance interpretation","threshold rule: record variance must stay under 1.5%","checklist-based issue recognition","basic threshold reading"]'::jsonb,
  '["Engage: Learner receives a guided checklist case: daily revenue dashboard refresh is at risk because only 89,760 of 97,370 records passed the control and bronze-to-silver load variance and a schema warning is visible","Explore: Learner reviews pipeline failure log, source file profile, schema comparison sheet, record completeness report, dashboard refresh note, highlights the fields that prove the issue, and notes which values cross the threshold","Explain: Learner studies expected vs actual record-count variance, schema version mismatch, source-to-bronze reconciliation, bronze-to-silver completeness check and learns how these concepts explain the business risk, not just the technical error","Express: Learner prepares the Lakehouse Pipeline Control Exception Note with issue summary, numeric evidence, root-cause hypothesis, decision, and handoff note","Empower: Learner must recommend supervisor review with a clear checklist finding for daily revenue dashboard refresh","Evolve: Learner adds one missed checklist question that would catch the same bronze-to-silver load variance and a schema warning earlier"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Scenario: Lakehouse Pipeline Control Exception Note - Guided Evidence Note
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-001' LIMIT 1)
   AND title = 'L1 Module: Lakehouse Pipeline Controls Workplace Mission' LIMIT 1),
  'Workplace Scenario: Lakehouse Pipeline Control Exception Note - Guided Evidence Note',
  'During a guided training simulation for daily revenue dashboard refresh, a retail sales lakehouse pipeline shows bronze-to-silver load variance and a schema warning. The expected volume is 97,370 records, but only 89,760 records are usable, creating a 7.8% variance against the control expectation. The `discount_code` field is missing in 14% of rows and `customer_region` has a new APAC-South value. The accepted rule is: record variance must stay under 1.5%. The learner receives pipeline failure log, source file profile, schema comparison sheet, record completeness report, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Lakehouse Pipeline Control Exception Note. The learner follows a checklist to identify the visible issue, mark the risk level, and prepare the first evidence note. Pressure points: Daily revenue dashboard refresh is time-sensitive; variance is 7.8% against the rule; the `discount_code` field is missing in 14% of rows and `customer_region` has a new APAC-South value; learner has limited autonomy and must avoid over-escalating a simple issue.',
  'Course trigger: supervisor flags the issue as a guided practice case: 89,760 of 97,370 records passed the check, variance 7.8%, with signal ''bronze-to-silver load variance and a schema warning''.
Problem statement: During a guided training simulation for daily revenue dashboard refresh, a retail sales lakehouse pipeline shows bronze-to-silver load variance and a schema warning. The expected volume is 97,370 records, but only 89,760 records are usable, creating a 7.8% variance against the control expectation. The `discount_code` field is missing in 14% of rows and `customer_region` has a new APAC-South value. The accepted rule is: record variance must stay under 1.5%. The learner receives pipeline failure log, source file profile, schema comparison sheet, record completeness report, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Lakehouse Pipeline Control Exception Note. The learner follows a checklist to identify the visible issue, mark the risk level, and prepare the first evidence note.
Major concepts: expected vs actual record-count variance; schema version mismatch; source-to-bronze reconciliation; bronze-to-silver completeness check; dashboard release hold decision; expected 97,370 vs actual 89,760 records; 7.8% variance interpretation; threshold rule: record variance must stay under 1.5%; checklist-based issue recognition; basic threshold reading.
Root-cause focus: Use the checklist to identify whether the visible issue points to: source extract cut-off, schema drift, failed ingestion batch, transformation join loss, or late-arriving partition. Evidence must come from pipeline failure log, source file profile, schema comparison sheet.
Required data: pipeline failure log; source file profile; schema comparison sheet; record completeness report; dashboard refresh note; guided checklist; sample completed reference note
Artifact: Lakehouse Pipeline Control Exception Note - Guided Evidence Note
Artifact structure: case summary; expected vs actual numbers; threshold rule; evidence table from pipeline failure log, source file profile, schema comparison sheet; root-cause hypothesis; decision/action; risk note; role handoff.
Evidence fields to assess: captures expected 97,370 and actual 89,760 records; calculates or explains 7.8% variance; uses threshold rule correctly (record variance must stay under 1.5%); cites at least three input documents; links evidence to root-cause hypothesis; states clear release/hold/correct/escalate decision.
AI support tips: Use AI as a coach to ask evidence-checking questions, explain unfamiliar terms, compare possible root causes, and improve clarity. Do not use AI to invent numbers or make the decision without citing the provided documents.',
  1,
  '8  hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech CSE - Data Engineering Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-001' LIMIT 1),
  'B.Tech CSE - Data Engineering Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech AI & Data Science - Data Platform Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-001' LIMIT 1),
  'B.Tech AI & Data Science - Data Platform Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Data Science - Data Engineering Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-001' LIMIT 1),
  'B.Sc Data Science - Data Engineering Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MCA - Data Engineering / Cloud Data Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-001' LIMIT 1),
  'MCA - Data Engineering / Cloud Data Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Tech Data Engineering / Big Data Systems
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-001' LIMIT 1),
  'M.Tech Data Engineering / Big Data Systems',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Review Gold Data Product Publishing Evidence with a Guided Checklist
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Review Gold Data Product Publishing Evidence with a Guided Checklist',
  'CRS-IND-CL-006',
  'By the end of this course, the learner can review guided evidence for Gold Data Product Publishing by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact. Workplace problem: During a guided training simulation for monthly margin KPI publication, a finance gold data product shows metric grain mismatch and duplicate account totals. The expected volume is 45,540 rows, but only 43,520 rows are usable, creating a 4.4% variance against the control expectation. The `net_margin_pct` measure differs by 2.8 points between semantic layer and finance workbook. The accepted rule is: KPI variance must be below 0.5% before certification. The learner receives KPI definition note, gold table grain mapping, semantic measure validation sheet, finance reconciliation extract, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Gold Data Product Publishing Sign-off Pack. The learner follows a checklist to identify the visible issue, mark the risk level, and prepare the first evidence note. Artifact: Gold Data Product Publishing Sign-off Pack - Guided Evidence Note.',
  '8  hours',
  'Active',
  'Data Engineering & Lakehouse Operations',
  'technical',
  '["By the end of this course, the learner can review guided evidence for Gold Data Product Publishing by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact","Learner demonstrates Gold Data Product Publishing by interpreting real-looking numbers, comparing evidence from KPI definition note and gold table grain mapping, and producing a decision-ready artifact","Proves the learner can perform guided checklist work in Gold Data Product Publishing with numeric evidence, workplace documents, and a reviewer-ready artifact. Status: Demo Ready"]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L1 Module: Gold Data Product Publishing Workplace Mission
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-006' LIMIT 1),
  'L1 Module: Gold Data Product Publishing Workplace Mission',
  'Industry requirement: Teams responsible for a finance gold data product need learners who can use numeric evidence, threshold rules, and workplace documents to make reliable decisions during monthly margin KPI publication, not only explain Gold Data Product Publishing theoretically. Gap addressed: Academic learning may cover the concepts behind Gold Data Product Publishing, but it usually does not make learners practice with KPI definition note, gold table grain mapping, semantic measure validation sheet, numeric variance, threshold decisions, and role handoff artifacts. Trigger: supervisor flags the issue as a guided practice case: 43,520 of 45,540 rows passed the check, variance 4.4%, with signal ''metric grain mismatch and duplicate account totals''.',
  1,
  '["Data & AI","Data Platform Engineering","Data Engineering & Lakehouse Operations","Gold Data Product Publishing","Primary: Evidence. Supporting: Technical, Functional, Domain","metric grain control","semantic measure validation","consumer-ready data product certification","KPI definition sign-off","duplicate total reconciliation","expected 45,540 vs actual 43,520 rows","4.4% variance interpretation","threshold rule: KPI variance must be below 0.5% before certification","checklist-based issue recognition","basic threshold reading"]'::jsonb,
  '["Engage: Learner receives a guided checklist case: monthly margin KPI publication is at risk because only 43,520 of 45,540 rows passed the control and metric grain mismatch and duplicate account totals is visible","Explore: Learner reviews KPI definition note, gold table grain mapping, semantic measure validation sheet, finance reconciliation extract, consumer sign-off request, highlights the fields that prove the issue, and notes which values cross the threshold","Explain: Learner studies metric grain control, semantic measure validation, consumer-ready data product certification, KPI definition sign-off and learns how these concepts explain the business risk, not just the technical error","Express: Learner prepares the Gold Data Product Publishing Sign-off Pack with issue summary, numeric evidence, root-cause hypothesis, decision, and handoff note","Empower: Learner must recommend supervisor review with a clear checklist finding for monthly margin KPI publication","Evolve: Learner adds one missed checklist question that would catch the same metric grain mismatch and duplicate account totals earlier"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Scenario: Gold Data Product Publishing Sign-off Pack - Guided Evidence Note
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-006' LIMIT 1)
   AND title = 'L1 Module: Gold Data Product Publishing Workplace Mission' LIMIT 1),
  'Workplace Scenario: Gold Data Product Publishing Sign-off Pack - Guided Evidence Note',
  'During a guided training simulation for monthly margin KPI publication, a finance gold data product shows metric grain mismatch and duplicate account totals. The expected volume is 45,540 rows, but only 43,520 rows are usable, creating a 4.4% variance against the control expectation. The `net_margin_pct` measure differs by 2.8 points between semantic layer and finance workbook. The accepted rule is: KPI variance must be below 0.5% before certification. The learner receives KPI definition note, gold table grain mapping, semantic measure validation sheet, finance reconciliation extract, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Gold Data Product Publishing Sign-off Pack. The learner follows a checklist to identify the visible issue, mark the risk level, and prepare the first evidence note. Pressure points: Monthly margin kpi publication is time-sensitive; variance is 4.4% against the rule; the `net_margin_pct` measure differs by 2.8 points between semantic layer and finance workbook; learner has limited autonomy and must avoid over-escalating a simple issue.',
  'Course trigger: supervisor flags the issue as a guided practice case: 43,520 of 45,540 rows passed the check, variance 4.4%, with signal ''metric grain mismatch and duplicate account totals''.
Problem statement: During a guided training simulation for monthly margin KPI publication, a finance gold data product shows metric grain mismatch and duplicate account totals. The expected volume is 45,540 rows, but only 43,520 rows are usable, creating a 4.4% variance against the control expectation. The `net_margin_pct` measure differs by 2.8 points between semantic layer and finance workbook. The accepted rule is: KPI variance must be below 0.5% before certification. The learner receives KPI definition note, gold table grain mapping, semantic measure validation sheet, finance reconciliation extract, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Gold Data Product Publishing Sign-off Pack. The learner follows a checklist to identify the visible issue, mark the risk level, and prepare the first evidence note.
Major concepts: metric grain control; semantic measure validation; consumer-ready data product certification; KPI definition sign-off; duplicate total reconciliation; expected 45,540 vs actual 43,520 rows; 4.4% variance interpretation; threshold rule: KPI variance must be below 0.5% before certification; checklist-based issue recognition; basic threshold reading.
Root-cause focus: Use the checklist to identify whether the visible issue points to: wrong aggregation grain, duplicate account mapping, stale semantic measure, incorrect filter context, or unapproved KPI definition. Evidence must come from KPI definition note, gold table grain mapping, semantic measure validation sheet.
Required data: KPI definition note; gold table grain mapping; semantic measure validation sheet; finance reconciliation extract; consumer sign-off request; guided checklist; sample completed reference note
Artifact: Gold Data Product Publishing Sign-off Pack - Guided Evidence Note
Artifact structure: case summary; expected vs actual numbers; threshold rule; evidence table from KPI definition note, gold table grain mapping, semantic measure validation sheet; root-cause hypothesis; decision/action; risk note; role handoff.
Evidence fields to assess: captures expected 45,540 and actual 43,520 rows; calculates or explains 4.4% variance; uses threshold rule correctly (KPI variance must be below 0.5% before certification); cites at least three input documents; links evidence to root-cause hypothesis; states clear release/hold/correct/escalate decision.
AI support tips: Use AI as a coach to ask evidence-checking questions, explain unfamiliar terms, compare possible root causes, and improve clarity. Do not use AI to invent numbers or make the decision without citing the provided documents.',
  1,
  '8  hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech CSE - Data Engineering Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-006' LIMIT 1),
  'B.Tech CSE - Data Engineering Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech AI & Data Science - Data Platform Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-006' LIMIT 1),
  'B.Tech AI & Data Science - Data Platform Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Data Science - Data Engineering Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-006' LIMIT 1),
  'B.Sc Data Science - Data Engineering Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MCA - Data Engineering / Cloud Data Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-006' LIMIT 1),
  'MCA - Data Engineering / Cloud Data Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Tech Data Engineering / Big Data Systems
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-006' LIMIT 1),
  'M.Tech Data Engineering / Big Data Systems',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Review Streaming Contract Stabilization Evidence with a Guided Checklist
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Review Streaming Contract Stabilization Evidence with a Guided Checklist',
  'CRS-IND-CL-011',
  'By the end of this course, the learner can review guided evidence for Streaming Contract Stabilization by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact. Workplace problem: During a guided training simulation for real-time personalization feed, a streaming customer-event contract shows stream contract violations and late event spikes. The expected volume is 184,110 events, but only 171,345 events are usable, creating a 6.9% variance against the control expectation. 7.6% of events arrive after the 5-minute SLA and the `session_id` type changed from string to integer. The accepted rule is: contract violations must remain below 0.8%. The learner receives stream contract spec, Kafka topic error log, late-arrival summary, schema registry diff, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Streaming Contract Stabilization Report. The learner follows a checklist to identify the visible issue, mark the risk level, and prepare the first evidence note. Artifact: Streaming Contract Stabilization Report - Guided Evidence Note.',
  '8  hours',
  'Active',
  'Data Engineering & Lakehouse Operations',
  'technical',
  '["By the end of this course, the learner can review guided evidence for Streaming Contract Stabilization by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact","Learner demonstrates Streaming Contract Stabilization by interpreting real-looking numbers, comparing evidence from stream contract spec and Kafka topic error log, and producing a decision-ready artifact","Proves the learner can perform guided checklist work in Streaming Contract Stabilization with numeric evidence, workplace documents, and a reviewer-ready artifact. Status: Demo Ready"]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L1 Module: Streaming Contract Stabilization Workplace Mission
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-011' LIMIT 1),
  'L1 Module: Streaming Contract Stabilization Workplace Mission',
  'Industry requirement: Teams responsible for a streaming customer-event contract need learners who can use numeric evidence, threshold rules, and workplace documents to make reliable decisions during real-time personalization feed, not only explain Streaming Contract Stabilization theoretically. Gap addressed: Academic learning may cover the concepts behind Streaming Contract Stabilization, but it usually does not make learners practice with stream contract spec, Kafka topic error log, late-arrival summary, numeric variance, threshold decisions, and role handoff artifacts. Trigger: supervisor flags the issue as a guided practice case: 171,345 of 184,110 events passed the check, variance 6.9%, with signal ''stream contract violations and late event spikes''.',
  1,
  '["Data & AI","Data Platform Engineering","Data Engineering & Lakehouse Operations","Streaming Contract Stabilization","Primary: Evidence. Supporting: Technical, Functional, Domain","stream schema contract","late-arrival window","consumer compatibility","event-time vs processing-time","contract test evidence","expected 184,110 vs actual 171,345 events","6.9% variance interpretation","threshold rule: contract violations must remain below 0.8%","checklist-based issue recognition","basic threshold reading"]'::jsonb,
  '["Engage: Learner receives a guided checklist case: real-time personalization feed is at risk because only 171,345 of 184,110 events passed the control and stream contract violations and late event spikes is visible","Explore: Learner reviews stream contract spec, Kafka topic error log, late-arrival summary, schema registry diff, consumer failure ticket, highlights the fields that prove the issue, and notes which values cross the threshold","Explain: Learner studies stream schema contract, late-arrival window, consumer compatibility, event-time vs processing-time and learns how these concepts explain the business risk, not just the technical error","Express: Learner prepares the Streaming Contract Stabilization Report with issue summary, numeric evidence, root-cause hypothesis, decision, and handoff note","Empower: Learner must recommend supervisor review with a clear checklist finding for real-time personalization feed","Evolve: Learner adds one missed checklist question that would catch the same stream contract violations and late event spikes earlier"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Scenario: Streaming Contract Stabilization Report - Guided Evidence Note
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-011' LIMIT 1)
   AND title = 'L1 Module: Streaming Contract Stabilization Workplace Mission' LIMIT 1),
  'Workplace Scenario: Streaming Contract Stabilization Report - Guided Evidence Note',
  'During a guided training simulation for real-time personalization feed, a streaming customer-event contract shows stream contract violations and late event spikes. The expected volume is 184,110 events, but only 171,345 events are usable, creating a 6.9% variance against the control expectation. 7.6% of events arrive after the 5-minute SLA and the `session_id` type changed from string to integer. The accepted rule is: contract violations must remain below 0.8%. The learner receives stream contract spec, Kafka topic error log, late-arrival summary, schema registry diff, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Streaming Contract Stabilization Report. The learner follows a checklist to identify the visible issue, mark the risk level, and prepare the first evidence note. Pressure points: Real-time personalization feed is time-sensitive; variance is 6.9% against the rule; 7.6% of events arrive after the 5-minute SLA and the `session_id` type changed from string to integer; learner has limited autonomy and must avoid over-escalating a simple issue.',
  'Course trigger: supervisor flags the issue as a guided practice case: 171,345 of 184,110 events passed the check, variance 6.9%, with signal ''stream contract violations and late event spikes''.
Problem statement: During a guided training simulation for real-time personalization feed, a streaming customer-event contract shows stream contract violations and late event spikes. The expected volume is 184,110 events, but only 171,345 events are usable, creating a 6.9% variance against the control expectation. 7.6% of events arrive after the 5-minute SLA and the `session_id` type changed from string to integer. The accepted rule is: contract violations must remain below 0.8%. The learner receives stream contract spec, Kafka topic error log, late-arrival summary, schema registry diff, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Streaming Contract Stabilization Report. The learner follows a checklist to identify the visible issue, mark the risk level, and prepare the first evidence note.
Major concepts: stream schema contract; late-arrival window; consumer compatibility; event-time vs processing-time; contract test evidence; expected 184,110 vs actual 171,345 events; 6.9% variance interpretation; threshold rule: contract violations must remain below 0.8%; checklist-based issue recognition; basic threshold reading.
Root-cause focus: Use the checklist to identify whether the visible issue points to: producer schema change, late event window, consumer deserialization failure, partition lag, or missing contract test. Evidence must come from stream contract spec, Kafka topic error log, late-arrival summary.
Required data: stream contract spec; Kafka topic error log; late-arrival summary; schema registry diff; consumer failure ticket; guided checklist; sample completed reference note
Artifact: Streaming Contract Stabilization Report - Guided Evidence Note
Artifact structure: case summary; expected vs actual numbers; threshold rule; evidence table from stream contract spec, Kafka topic error log, late-arrival summary; root-cause hypothesis; decision/action; risk note; role handoff.
Evidence fields to assess: captures expected 184,110 and actual 171,345 events; calculates or explains 6.9% variance; uses threshold rule correctly (contract violations must remain below 0.8%); cites at least three input documents; links evidence to root-cause hypothesis; states clear release/hold/correct/escalate decision.
AI support tips: Use AI as a coach to ask evidence-checking questions, explain unfamiliar terms, compare possible root causes, and improve clarity. Do not use AI to invent numbers or make the decision without citing the provided documents.',
  1,
  '8  hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech CSE - Data Engineering Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-011' LIMIT 1),
  'B.Tech CSE - Data Engineering Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech AI & Data Science - Data Platform Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-011' LIMIT 1),
  'B.Tech AI & Data Science - Data Platform Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Data Science - Data Engineering Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-011' LIMIT 1),
  'B.Sc Data Science - Data Engineering Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MCA - Data Engineering / Cloud Data Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-011' LIMIT 1),
  'MCA - Data Engineering / Cloud Data Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Tech Data Engineering / Big Data Systems
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-011' LIMIT 1),
  'M.Tech Data Engineering / Big Data Systems',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Review BI Asset Certification Evidence with a Guided Checklist
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Review BI Asset Certification Evidence with a Guided Checklist',
  'CRS-IND-CL-016',
  'By the end of this course, the learner can review guided evidence for BI Asset Certification by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact. Workplace problem: During a guided training simulation for executive sales performance review, a certified BI reporting asset shows uncertified dataset use and mismatched dashboard totals. The expected volume is 5,534 tiles, but only 5,009 tiles are usable, creating a 9.5% variance against the control expectation. Regional sales total is 6.4% higher in the dashboard than the approved semantic model. The accepted rule is: 100% of executive tiles must use certified sources. The learner receives dashboard dependency list, certified dataset register, semantic model measure sheet, data refresh history, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the BI Asset Certification Review Sheet. The learner follows a checklist to identify the visible issue, mark the risk level, and prepare the first evidence note. Artifact: BI Asset Certification Review Sheet - Guided Evidence Note.',
  '8  hours',
  'Active',
  'BI & Reporting Analytics',
  'technical',
  '["By the end of this course, the learner can review guided evidence for BI Asset Certification by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact","Learner demonstrates BI Asset Certification by interpreting real-looking numbers, comparing evidence from dashboard dependency list and certified dataset register, and producing a decision-ready artifact","Proves the learner can perform guided checklist work in BI Asset Certification with numeric evidence, workplace documents, and a reviewer-ready artifact. Status: Demo Ready"]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L1 Module: BI Asset Certification Workplace Mission
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-016' LIMIT 1),
  'L1 Module: BI Asset Certification Workplace Mission',
  'Industry requirement: Teams responsible for a certified BI reporting asset need learners who can use numeric evidence, threshold rules, and workplace documents to make reliable decisions during executive sales performance review, not only explain BI Asset Certification theoretically. Gap addressed: Academic learning may cover the concepts behind BI Asset Certification, but it usually does not make learners practice with dashboard dependency list, certified dataset register, semantic model measure sheet, numeric variance, threshold decisions, and role handoff artifacts. Trigger: supervisor flags the issue as a guided practice case: 5,009 of 5,534 tiles passed the check, variance 9.5%, with signal ''uncertified dataset use and mismatched dashboard totals''.',
  1,
  '["Data & AI","BI & Reporting Analytics","BI Asset Certification","Primary: Evidence. Supporting: Technical, Functional, Domain","certified BI asset control","semantic model dependency","measure lineage","refresh reliability","executive reporting risk","expected 5,534 vs actual 5,009 tiles","9.5% variance interpretation","threshold rule: 100% of executive tiles must use certified sources","checklist-based issue recognition","basic threshold reading"]'::jsonb,
  '["Engage: Learner receives a guided checklist case: executive sales performance review is at risk because only 5,009 of 5,534 tiles passed the control and uncertified dataset use and mismatched dashboard totals is visible","Explore: Learner reviews dashboard dependency list, certified dataset register, semantic model measure sheet, data refresh history, business owner approval note, highlights the fields that prove the issue, and notes which values cross the threshold","Explain: Learner studies certified BI asset control, semantic model dependency, measure lineage, refresh reliability and learns how these concepts explain the business risk, not just the technical error","Express: Learner prepares the BI Asset Certification Review Sheet with issue summary, numeric evidence, root-cause hypothesis, decision, and handoff note","Empower: Learner must recommend supervisor review with a clear checklist finding for executive sales performance review","Evolve: Learner adds one missed checklist question that would catch the same uncertified dataset use and mismatched dashboard totals earlier"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Scenario: BI Asset Certification Review Sheet - Guided Evidence Note
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-016' LIMIT 1)
   AND title = 'L1 Module: BI Asset Certification Workplace Mission' LIMIT 1),
  'Workplace Scenario: BI Asset Certification Review Sheet - Guided Evidence Note',
  'During a guided training simulation for executive sales performance review, a certified BI reporting asset shows uncertified dataset use and mismatched dashboard totals. The expected volume is 5,534 tiles, but only 5,009 tiles are usable, creating a 9.5% variance against the control expectation. Regional sales total is 6.4% higher in the dashboard than the approved semantic model. The accepted rule is: 100% of executive tiles must use certified sources. The learner receives dashboard dependency list, certified dataset register, semantic model measure sheet, data refresh history, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the BI Asset Certification Review Sheet. The learner follows a checklist to identify the visible issue, mark the risk level, and prepare the first evidence note. Pressure points: Executive sales performance review is time-sensitive; variance is 9.5% against the rule; regional sales total is 6.4% higher in the dashboard than the approved semantic model; learner has limited autonomy and must avoid over-escalating a simple issue.',
  'Course trigger: supervisor flags the issue as a guided practice case: 5,009 of 5,534 tiles passed the check, variance 9.5%, with signal ''uncertified dataset use and mismatched dashboard totals''.
Problem statement: During a guided training simulation for executive sales performance review, a certified BI reporting asset shows uncertified dataset use and mismatched dashboard totals. The expected volume is 5,534 tiles, but only 5,009 tiles are usable, creating a 9.5% variance against the control expectation. Regional sales total is 6.4% higher in the dashboard than the approved semantic model. The accepted rule is: 100% of executive tiles must use certified sources. The learner receives dashboard dependency list, certified dataset register, semantic model measure sheet, data refresh history, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the BI Asset Certification Review Sheet. The learner follows a checklist to identify the visible issue, mark the risk level, and prepare the first evidence note.
Major concepts: certified BI asset control; semantic model dependency; measure lineage; refresh reliability; executive reporting risk; expected 5,534 vs actual 5,009 tiles; 9.5% variance interpretation; threshold rule: 100% of executive tiles must use certified sources; checklist-based issue recognition; basic threshold reading.
Root-cause focus: Use the checklist to identify whether the visible issue points to: uncertified table usage, measure definition drift, refresh failure, manual filter override, or missing owner approval. Evidence must come from dashboard dependency list, certified dataset register, semantic model measure sheet.
Required data: dashboard dependency list; certified dataset register; semantic model measure sheet; data refresh history; business owner approval note; guided checklist; sample completed reference note
Artifact: BI Asset Certification Review Sheet - Guided Evidence Note
Artifact structure: case summary; expected vs actual numbers; threshold rule; evidence table from dashboard dependency list, certified dataset register, semantic model measure sheet; root-cause hypothesis; decision/action; risk note; role handoff.
Evidence fields to assess: captures expected 5,534 and actual 5,009 tiles; calculates or explains 9.5% variance; uses threshold rule correctly (100% of executive tiles must use certified sources); cites at least three input documents; links evidence to root-cause hypothesis; states clear release/hold/correct/escalate decision.
AI support tips: Use AI as a coach to ask evidence-checking questions, explain unfamiliar terms, compare possible root causes, and improve clarity. Do not use AI to invent numbers or make the decision without citing the provided documents.',
  1,
  '8  hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Data Science - BI & Analytics Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-016' LIMIT 1),
  'B.Sc Data Science - BI & Analytics Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BBA Business Analytics - BI Reporting Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-016' LIMIT 1),
  'BBA Business Analytics - BI Reporting Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Com Analytics - Management Reporting Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-016' LIMIT 1),
  'B.Com Analytics - Management Reporting Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MBA Business Analytics - Decision Reporting Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-016' LIMIT 1),
  'MBA Business Analytics - Decision Reporting Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech CSE - Data Analytics Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-016' LIMIT 1),
  'B.Tech CSE - Data Analytics Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Review Decision Recommendation Production Evidence with a Guided Checklist
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Review Decision Recommendation Production Evidence with a Guided Checklist',
  'CRS-IND-CL-021',
  'By the end of this course, the learner can review guided evidence for Decision Recommendation Production by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact. Workplace problem: During a guided training simulation for warehouse staffing recommendation, an operations decision recommendation model shows optimization output conflicts with capacity and cost constraints. The expected volume is 7,170 recommendations, but only 6,494 recommendations are usable, creating a 9.4% variance against the control expectation. Recommended overtime cost exceeds budget by ₹4.8 lakh and misses 11 high-priority fulfillment slots. The accepted rule is: recommendation constraint breaches must stay below 2%. The learner receives optimization scenario file, constraint register, cost-benefit worksheet, service-level target sheet, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Decision Recommendation Justification Note. The learner follows a checklist to identify the visible issue, mark the risk level, and prepare the first evidence note. Artifact: Decision Recommendation Justification Note - Guided Evidence Note.',
  '8  hours',
  'Active',
  'Decision Optimization & Business Insight',
  'technical',
  '["By the end of this course, the learner can review guided evidence for Decision Recommendation Production by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact","Learner demonstrates Decision Recommendation Production by interpreting real-looking numbers, comparing evidence from optimization scenario file and constraint register, and producing a decision-ready artifact","Proves the learner can perform guided checklist work in Decision Recommendation Production with numeric evidence, workplace documents, and a reviewer-ready artifact. Status: Demo Ready"]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L1 Module: Decision Recommendation Production Workplace Mission
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-021' LIMIT 1),
  'L1 Module: Decision Recommendation Production Workplace Mission',
  'Industry requirement: Teams responsible for an operations decision recommendation model need learners who can use numeric evidence, threshold rules, and workplace documents to make reliable decisions during warehouse staffing recommendation, not only explain Decision Recommendation Production theoretically. Gap addressed: Academic learning may cover the concepts behind Decision Recommendation Production, but it usually does not make learners practice with optimization scenario file, constraint register, cost-benefit worksheet, numeric variance, threshold decisions, and role handoff artifacts. Trigger: supervisor flags the issue as a guided practice case: 6,494 of 7,170 recommendations passed the check, variance 9.4%, with signal ''optimization output conflicts with capacity and cost constraints''.',
  1,
  '["Data & AI","Decision Optimization & Business Insight","Decision Recommendation Production","Primary: Evidence. Supporting: Technical, Functional, Domain","constraint feasibility","objective function trade-off","scenario comparison","cost-service impact","decision recommendation evidence","expected 7,170 vs actual 6,494 recommendations","9.4% variance interpretation","threshold rule: recommendation constraint breaches must stay below 2%","checklist-based issue recognition","basic threshold reading"]'::jsonb,
  '["Engage: Learner receives a guided checklist case: warehouse staffing recommendation is at risk because only 6,494 of 7,170 recommendations passed the control and optimization output conflicts with capacity and cost constraints is visible","Explore: Learner reviews optimization scenario file, constraint register, cost-benefit worksheet, service-level target sheet, manager decision request, highlights the fields that prove the issue, and notes which values cross the threshold","Explain: Learner studies constraint feasibility, objective function trade-off, scenario comparison, cost-service impact and learns how these concepts explain the business risk, not just the technical error","Express: Learner prepares the Decision Recommendation Justification Note with issue summary, numeric evidence, root-cause hypothesis, decision, and handoff note","Empower: Learner must recommend supervisor review with a clear checklist finding for warehouse staffing recommendation","Evolve: Learner adds one missed checklist question that would catch the same optimization output conflicts with capacity and cost constraints earlier"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Scenario: Decision Recommendation Justification Note - Guided Evidence Note
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-021' LIMIT 1)
   AND title = 'L1 Module: Decision Recommendation Production Workplace Mission' LIMIT 1),
  'Workplace Scenario: Decision Recommendation Justification Note - Guided Evidence Note',
  'During a guided training simulation for warehouse staffing recommendation, an operations decision recommendation model shows optimization output conflicts with capacity and cost constraints. The expected volume is 7,170 recommendations, but only 6,494 recommendations are usable, creating a 9.4% variance against the control expectation. Recommended overtime cost exceeds budget by ₹4.8 lakh and misses 11 high-priority fulfillment slots. The accepted rule is: recommendation constraint breaches must stay below 2%. The learner receives optimization scenario file, constraint register, cost-benefit worksheet, service-level target sheet, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Decision Recommendation Justification Note. The learner follows a checklist to identify the visible issue, mark the risk level, and prepare the first evidence note. Pressure points: Warehouse staffing recommendation is time-sensitive; variance is 9.4% against the rule; recommended overtime cost exceeds budget by ₹4.8 lakh and misses 11 high-priority fulfillment slots; learner has limited autonomy and must avoid over-escalating a simple issue.',
  'Course trigger: supervisor flags the issue as a guided practice case: 6,494 of 7,170 recommendations passed the check, variance 9.4%, with signal ''optimization output conflicts with capacity and cost constraints''.
Problem statement: During a guided training simulation for warehouse staffing recommendation, an operations decision recommendation model shows optimization output conflicts with capacity and cost constraints. The expected volume is 7,170 recommendations, but only 6,494 recommendations are usable, creating a 9.4% variance against the control expectation. Recommended overtime cost exceeds budget by ₹4.8 lakh and misses 11 high-priority fulfillment slots. The accepted rule is: recommendation constraint breaches must stay below 2%. The learner receives optimization scenario file, constraint register, cost-benefit worksheet, service-level target sheet, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Decision Recommendation Justification Note. The learner follows a checklist to identify the visible issue, mark the risk level, and prepare the first evidence note.
Major concepts: constraint feasibility; objective function trade-off; scenario comparison; cost-service impact; decision recommendation evidence; expected 7,170 vs actual 6,494 recommendations; 9.4% variance interpretation; threshold rule: recommendation constraint breaches must stay below 2%; checklist-based issue recognition; basic threshold reading.
Root-cause focus: Use the checklist to identify whether the visible issue points to: missing constraint, wrong objective weight, outdated cost parameter, service-level trade-off, or infeasible scenario. Evidence must come from optimization scenario file, constraint register, cost-benefit worksheet.
Required data: optimization scenario file; constraint register; cost-benefit worksheet; service-level target sheet; manager decision request; guided checklist; sample completed reference note
Artifact: Decision Recommendation Justification Note - Guided Evidence Note
Artifact structure: case summary; expected vs actual numbers; threshold rule; evidence table from optimization scenario file, constraint register, cost-benefit worksheet; root-cause hypothesis; decision/action; risk note; role handoff.
Evidence fields to assess: captures expected 7,170 and actual 6,494 recommendations; calculates or explains 9.4% variance; uses threshold rule correctly (recommendation constraint breaches must stay below 2%); cites at least three input documents; links evidence to root-cause hypothesis; states clear release/hold/correct/escalate decision.
AI support tips: Use AI as a coach to ask evidence-checking questions, explain unfamiliar terms, compare possible root causes, and improve clarity. Do not use AI to invent numbers or make the decision without citing the provided documents.',
  1,
  '8  hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Statistics / Data Science - Decision Analytics Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-021' LIMIT 1),
  'B.Sc Statistics / Data Science - Decision Analytics Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech Industrial Engineering / Operations Analytics Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-021' LIMIT 1),
  'B.Tech Industrial Engineering / Operations Analytics Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BBA Business Analytics - Decision Intelligence Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-021' LIMIT 1),
  'BBA Business Analytics - Decision Intelligence Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MBA Business Analytics - Optimization & Strategy Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-021' LIMIT 1),
  'MBA Business Analytics - Optimization & Strategy Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Sc Data Science - Optimization Analytics
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-021' LIMIT 1),
  'M.Sc Data Science - Optimization Analytics',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Data Science - Applied Modeling Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-021' LIMIT 1),
  'B.Sc Data Science - Applied Modeling Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Review Leakage-Safe Feature Dataset Build Evidence with a Guided Checklist
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Review Leakage-Safe Feature Dataset Build Evidence with a Guided Checklist',
  'CRS-IND-CL-026',
  'By the end of this course, the learner can review guided evidence for Leakage-Safe Feature Dataset Build by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact. Workplace problem: During a guided training simulation for model training cut-off review, a churn prediction feature dataset shows feature leakage risk and event-window mismatch. The expected volume is 258,220 rows, but only 240,390 rows are usable, creating a 6.9% variance against the control expectation. 18 features are populated after the churn label date and 9.2% of rows use future transactions. The accepted rule is: post-outcome features must be 0 before training release. The learner receives label definition sheet, feature lineage map, event-window extract, training data sample, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Leakage-Safe Feature Dataset Review Pack. The learner follows a checklist to identify the visible issue, mark the risk level, and prepare the first evidence note. Artifact: Leakage-Safe Feature Dataset Review Pack - Guided Evidence Note.',
  '8  hours',
  'Active',
  'Data Science & Statistical Modeling',
  'technical',
  '["By the end of this course, the learner can review guided evidence for Leakage-Safe Feature Dataset Build by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact","Learner demonstrates Leakage-Safe Feature Dataset Build by interpreting real-looking numbers, comparing evidence from label definition sheet and feature lineage map, and producing a decision-ready artifact","Proves the learner can perform guided checklist work in Leakage-Safe Feature Dataset Build with numeric evidence, workplace documents, and a reviewer-ready artifact. Status: Demo Ready"]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L1 Module: Leakage-Safe Feature Dataset Build Workplace Mission
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-026' LIMIT 1),
  'L1 Module: Leakage-Safe Feature Dataset Build Workplace Mission',
  'Industry requirement: Teams responsible for a churn prediction feature dataset need learners who can use numeric evidence, threshold rules, and workplace documents to make reliable decisions during model training cut-off review, not only explain Leakage-Safe Feature Dataset Build theoretically. Gap addressed: Academic learning may cover the concepts behind Leakage-Safe Feature Dataset Build, but it usually does not make learners practice with label definition sheet, feature lineage map, event-window extract, numeric variance, threshold decisions, and role handoff artifacts. Trigger: supervisor flags the issue as a guided practice case: 240,390 of 258,220 rows passed the check, variance 6.9%, with signal ''feature leakage risk and event-window mismatch''.',
  1,
  '["Data & AI","Data Science & Statistical Modeling","Leakage-Safe Feature Dataset Build","Primary: Evidence. Supporting: Technical, Functional, Domain","prediction target timing","feature availability cut-off","target leakage detection","event-window alignment","training data release control","expected 258,220 vs actual 240,390 rows","6.9% variance interpretation","threshold rule: post-outcome features must be 0 before training release","checklist-based issue recognition","basic threshold reading"]'::jsonb,
  '["Engage: Learner receives a guided checklist case: model training cut-off review is at risk because only 240,390 of 258,220 rows passed the control and feature leakage risk and event-window mismatch is visible","Explore: Learner reviews label definition sheet, feature lineage map, event-window extract, training data sample, leakage review checklist, highlights the fields that prove the issue, and notes which values cross the threshold","Explain: Learner studies prediction target timing, feature availability cut-off, target leakage detection, event-window alignment and learns how these concepts explain the business risk, not just the technical error","Express: Learner prepares the Leakage-Safe Feature Dataset Review Pack with issue summary, numeric evidence, root-cause hypothesis, decision, and handoff note","Empower: Learner must recommend supervisor review with a clear checklist finding for model training cut-off review","Evolve: Learner adds one missed checklist question that would catch the same feature leakage risk and event-window mismatch earlier"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Scenario: Leakage-Safe Feature Dataset Review Pack - Guided Evidence Note
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-026' LIMIT 1)
   AND title = 'L1 Module: Leakage-Safe Feature Dataset Build Workplace Mission' LIMIT 1),
  'Workplace Scenario: Leakage-Safe Feature Dataset Review Pack - Guided Evidence Note',
  'During a guided training simulation for model training cut-off review, a churn prediction feature dataset shows feature leakage risk and event-window mismatch. The expected volume is 258,220 rows, but only 240,390 rows are usable, creating a 6.9% variance against the control expectation. 18 features are populated after the churn label date and 9.2% of rows use future transactions. The accepted rule is: post-outcome features must be 0 before training release. The learner receives label definition sheet, feature lineage map, event-window extract, training data sample, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Leakage-Safe Feature Dataset Review Pack. The learner follows a checklist to identify the visible issue, mark the risk level, and prepare the first evidence note. Pressure points: Model training cut-off review is time-sensitive; variance is 6.9% against the rule; 18 features are populated after the churn label date and 9.2% of rows use future transactions; learner has limited autonomy and must avoid over-escalating a simple issue.',
  'Course trigger: supervisor flags the issue as a guided practice case: 240,390 of 258,220 rows passed the check, variance 6.9%, with signal ''feature leakage risk and event-window mismatch''.
Problem statement: During a guided training simulation for model training cut-off review, a churn prediction feature dataset shows feature leakage risk and event-window mismatch. The expected volume is 258,220 rows, but only 240,390 rows are usable, creating a 6.9% variance against the control expectation. 18 features are populated after the churn label date and 9.2% of rows use future transactions. The accepted rule is: post-outcome features must be 0 before training release. The learner receives label definition sheet, feature lineage map, event-window extract, training data sample, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Leakage-Safe Feature Dataset Review Pack. The learner follows a checklist to identify the visible issue, mark the risk level, and prepare the first evidence note.
Major concepts: prediction target timing; feature availability cut-off; target leakage detection; event-window alignment; training data release control; expected 258,220 vs actual 240,390 rows; 6.9% variance interpretation; threshold rule: post-outcome features must be 0 before training release; checklist-based issue recognition; basic threshold reading.
Root-cause focus: Use the checklist to identify whether the visible issue points to: future-dated transaction feature, wrong label cut-off, late feature backfill, target leakage, or unverified event window. Evidence must come from label definition sheet, feature lineage map, event-window extract.
Required data: label definition sheet; feature lineage map; event-window extract; training data sample; leakage review checklist; guided checklist; sample completed reference note
Artifact: Leakage-Safe Feature Dataset Review Pack - Guided Evidence Note
Artifact structure: case summary; expected vs actual numbers; threshold rule; evidence table from label definition sheet, feature lineage map, event-window extract; root-cause hypothesis; decision/action; risk note; role handoff.
Evidence fields to assess: captures expected 258,220 and actual 240,390 rows; calculates or explains 6.9% variance; uses threshold rule correctly (post-outcome features must be 0 before training release); cites at least three input documents; links evidence to root-cause hypothesis; states clear release/hold/correct/escalate decision.
AI support tips: Use AI as a coach to ask evidence-checking questions, explain unfamiliar terms, compare possible root causes, and improve clarity. Do not use AI to invent numbers or make the decision without citing the provided documents.',
  1,
  '8  hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Data Science - Applied Modeling Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-026' LIMIT 1),
  'B.Sc Data Science - Applied Modeling Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Statistics - Data Science Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-026' LIMIT 1),
  'B.Sc Statistics - Data Science Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech AI & Data Science - Modeling Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-026' LIMIT 1),
  'B.Tech AI & Data Science - Modeling Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Sc Data Science - Applied Analytics Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-026' LIMIT 1),
  'M.Sc Data Science - Applied Analytics Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MCA - Data Science Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-026' LIMIT 1),
  'MCA - Data Science Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Review Experiment and Cohort Evaluation Evidence with a Guided Checklist
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Review Experiment and Cohort Evaluation Evidence with a Guided Checklist',
  'CRS-IND-CL-031',
  'By the end of this course, the learner can review guided evidence for Experiment and Cohort Evaluation by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact. Workplace problem: During a guided training simulation for pricing-page change decision, an A/B experiment result shows cohort imbalance and weak significance evidence. The expected volume is 73,590 users, but only 68,390 users are usable, creating a 7.1% variance against the control expectation. Control has 52.8% of traffic instead of 50% and conversion lift is only 0.7% with p=0.09. The accepted rule is: minimum detectable effect and sample ratio mismatch must be within tolerance. The learner receives experiment design note, cohort assignment report, conversion result table, validity checklist, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Experiment Validity and Decision Evidence Pack. The learner follows a checklist to identify the visible issue, mark the risk level, and prepare the first evidence note. Artifact: Experiment Validity and Decision Evidence Pack - Guided Evidence Note.',
  '8  hours',
  'Active',
  'Data Science & Statistical Modeling',
  'technical',
  '["By the end of this course, the learner can review guided evidence for Experiment and Cohort Evaluation by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact","Learner demonstrates Experiment and Cohort Evaluation by interpreting real-looking numbers, comparing evidence from experiment design note and cohort assignment report, and producing a decision-ready artifact","Proves the learner can perform guided checklist work in Experiment and Cohort Evaluation with numeric evidence, workplace documents, and a reviewer-ready artifact. Status: Demo Ready"]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L1 Module: Experiment and Cohort Evaluation Workplace Mission
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-031' LIMIT 1),
  'L1 Module: Experiment and Cohort Evaluation Workplace Mission',
  'Industry requirement: Teams responsible for an A/B experiment result need learners who can use numeric evidence, threshold rules, and workplace documents to make reliable decisions during pricing-page change decision, not only explain Experiment and Cohort Evaluation theoretically. Gap addressed: Academic learning may cover the concepts behind Experiment and Cohort Evaluation, but it usually does not make learners practice with experiment design note, cohort assignment report, conversion result table, numeric variance, threshold decisions, and role handoff artifacts. Trigger: supervisor flags the issue as a guided practice case: 68,390 of 73,590 users passed the check, variance 7.1%, with signal ''cohort imbalance and weak significance evidence''.',
  1,
  '["Data & AI","Data Science & Statistical Modeling","Experiment and Cohort Evaluation","Primary: Evidence. Supporting: Technical, Functional, Domain","sample-ratio mismatch","statistical power","confidence interval","cohort validity","decision threshold","expected 73,590 vs actual 68,390 users","7.1% variance interpretation","threshold rule: minimum detectable effect and sample ratio mismatch must be within tolerance","checklist-based issue recognition","basic threshold reading"]'::jsonb,
  '["Engage: Learner receives a guided checklist case: pricing-page change decision is at risk because only 68,390 of 73,590 users passed the control and cohort imbalance and weak significance evidence is visible","Explore: Learner reviews experiment design note, cohort assignment report, conversion result table, validity checklist, product decision memo, highlights the fields that prove the issue, and notes which values cross the threshold","Explain: Learner studies sample-ratio mismatch, statistical power, confidence interval, cohort validity and learns how these concepts explain the business risk, not just the technical error","Express: Learner prepares the Experiment Validity and Decision Evidence Pack with issue summary, numeric evidence, root-cause hypothesis, decision, and handoff note","Empower: Learner must recommend supervisor review with a clear checklist finding for pricing-page change decision","Evolve: Learner adds one missed checklist question that would catch the same cohort imbalance and weak significance evidence earlier"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Scenario: Experiment Validity and Decision Evidence Pack - Guided Evidence Note
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-031' LIMIT 1)
   AND title = 'L1 Module: Experiment and Cohort Evaluation Workplace Mission' LIMIT 1),
  'Workplace Scenario: Experiment Validity and Decision Evidence Pack - Guided Evidence Note',
  'During a guided training simulation for pricing-page change decision, an A/B experiment result shows cohort imbalance and weak significance evidence. The expected volume is 73,590 users, but only 68,390 users are usable, creating a 7.1% variance against the control expectation. Control has 52.8% of traffic instead of 50% and conversion lift is only 0.7% with p=0.09. The accepted rule is: minimum detectable effect and sample ratio mismatch must be within tolerance. The learner receives experiment design note, cohort assignment report, conversion result table, validity checklist, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Experiment Validity and Decision Evidence Pack. The learner follows a checklist to identify the visible issue, mark the risk level, and prepare the first evidence note. Pressure points: Pricing-page change decision is time-sensitive; variance is 7.1% against the rule; control has 52.8% of traffic instead of 50% and conversion lift is only 0.7% with p=0.09; learner has limited autonomy and must avoid over-escalating a simple issue.',
  'Course trigger: supervisor flags the issue as a guided practice case: 68,390 of 73,590 users passed the check, variance 7.1%, with signal ''cohort imbalance and weak significance evidence''.
Problem statement: During a guided training simulation for pricing-page change decision, an A/B experiment result shows cohort imbalance and weak significance evidence. The expected volume is 73,590 users, but only 68,390 users are usable, creating a 7.1% variance against the control expectation. Control has 52.8% of traffic instead of 50% and conversion lift is only 0.7% with p=0.09. The accepted rule is: minimum detectable effect and sample ratio mismatch must be within tolerance. The learner receives experiment design note, cohort assignment report, conversion result table, validity checklist, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Experiment Validity and Decision Evidence Pack. The learner follows a checklist to identify the visible issue, mark the risk level, and prepare the first evidence note.
Major concepts: sample-ratio mismatch; statistical power; confidence interval; cohort validity; decision threshold; expected 73,590 vs actual 68,390 users; 7.1% variance interpretation; threshold rule: minimum detectable effect and sample ratio mismatch must be within tolerance; checklist-based issue recognition; basic threshold reading.
Root-cause focus: Use the checklist to identify whether the visible issue points to: sample-ratio mismatch, underpowered test, instrumentation gap, segment imbalance, or premature decision. Evidence must come from experiment design note, cohort assignment report, conversion result table.
Required data: experiment design note; cohort assignment report; conversion result table; validity checklist; product decision memo; guided checklist; sample completed reference note
Artifact: Experiment Validity and Decision Evidence Pack - Guided Evidence Note
Artifact structure: case summary; expected vs actual numbers; threshold rule; evidence table from experiment design note, cohort assignment report, conversion result table; root-cause hypothesis; decision/action; risk note; role handoff.
Evidence fields to assess: captures expected 73,590 and actual 68,390 users; calculates or explains 7.1% variance; uses threshold rule correctly (minimum detectable effect and sample ratio mismatch must be within tolerance); cites at least three input documents; links evidence to root-cause hypothesis; states clear release/hold/correct/escalate decision.
AI support tips: Use AI as a coach to ask evidence-checking questions, explain unfamiliar terms, compare possible root causes, and improve clarity. Do not use AI to invent numbers or make the decision without citing the provided documents.',
  1,
  '8  hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Data Science - Applied Modeling Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-031' LIMIT 1),
  'B.Sc Data Science - Applied Modeling Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Statistics - Data Science Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-031' LIMIT 1),
  'B.Sc Statistics - Data Science Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech AI & Data Science - Modeling Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-031' LIMIT 1),
  'B.Tech AI & Data Science - Modeling Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Sc Data Science - Applied Analytics Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-031' LIMIT 1),
  'M.Sc Data Science - Applied Analytics Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MCA - Data Science Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-031' LIMIT 1),
  'MCA - Data Science Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Review Deep Learning Candidate Packaging Evidence with a Guided Checklist
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Review Deep Learning Candidate Packaging Evidence with a Guided Checklist',
  'CRS-IND-CL-036',
  'By the end of this course, the learner can review guided evidence for Deep Learning Candidate Packaging by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact. Workplace problem: During a guided training simulation for computer vision defect-detection release review, a deep learning model candidate shows training metric improvement but validation instability. The expected volume is 62,960 images, but only 58,510 images are usable, creating a 7.1% variance against the control expectation. Training F1 is 0.93 but validation F1 drops to 0.81 on low-light images. The accepted rule is: validation F1 must be above 0.86 and train-val gap below 5 points. The learner receives training run log, checkpoint metric table, validation error slice report, model card draft, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Deep Learning Candidate Packaging Review. The learner follows a checklist to identify the visible issue, mark the risk level, and prepare the first evidence note. Artifact: Deep Learning Candidate Packaging Review - Guided Evidence Note.',
  '8  hours',
  'Active',
  'Machine Learning, Deep Learning & NLP Engineering',
  'technical',
  '["By the end of this course, the learner can review guided evidence for Deep Learning Candidate Packaging by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact","Learner demonstrates Deep Learning Candidate Packaging by interpreting real-looking numbers, comparing evidence from training run log and checkpoint metric table, and producing a decision-ready artifact","Proves the learner can perform guided checklist work in Deep Learning Candidate Packaging with numeric evidence, workplace documents, and a reviewer-ready artifact. Status: Demo Ready"]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L1 Module: Deep Learning Candidate Packaging Workplace Mission
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-036' LIMIT 1),
  'L1 Module: Deep Learning Candidate Packaging Workplace Mission',
  'Industry requirement: Teams responsible for a deep learning model candidate need learners who can use numeric evidence, threshold rules, and workplace documents to make reliable decisions during computer vision defect-detection release review, not only explain Deep Learning Candidate Packaging theoretically. Gap addressed: Academic learning may cover the concepts behind Deep Learning Candidate Packaging, but it usually does not make learners practice with training run log, checkpoint metric table, validation error slice report, numeric variance, threshold decisions, and role handoff artifacts. Trigger: supervisor flags the issue as a guided practice case: 58,510 of 62,960 images passed the check, variance 7.1%, with signal ''training metric improvement but validation instability''.',
  1,
  '["Data & AI","Machine Learning, Deep Learning & NLP Engineering","Deep Learning Candidate Packaging","Primary: Evidence. Supporting: Technical, Functional, Domain","train-validation gap","checkpoint comparison","error slice analysis","model card evidence","release candidate packaging","expected 62,960 vs actual 58,510 images","7.1% variance interpretation","threshold rule: validation F1 must be above 0.86 and train-val gap below 5 points","checklist-based issue recognition","basic threshold reading"]'::jsonb,
  '["Engage: Learner receives a guided checklist case: computer vision defect-detection release review is at risk because only 58,510 of 62,960 images passed the control and training metric improvement but validation instability is visible","Explore: Learner reviews training run log, checkpoint metric table, validation error slice report, model card draft, release candidate request, highlights the fields that prove the issue, and notes which values cross the threshold","Explain: Learner studies train-validation gap, checkpoint comparison, error slice analysis, model card evidence and learns how these concepts explain the business risk, not just the technical error","Express: Learner prepares the Deep Learning Candidate Packaging Review with issue summary, numeric evidence, root-cause hypothesis, decision, and handoff note","Empower: Learner must recommend supervisor review with a clear checklist finding for computer vision defect-detection release review","Evolve: Learner adds one missed checklist question that would catch the same training metric improvement but validation instability earlier"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Scenario: Deep Learning Candidate Packaging Review - Guided Evidence Note
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-036' LIMIT 1)
   AND title = 'L1 Module: Deep Learning Candidate Packaging Workplace Mission' LIMIT 1),
  'Workplace Scenario: Deep Learning Candidate Packaging Review - Guided Evidence Note',
  'During a guided training simulation for computer vision defect-detection release review, a deep learning model candidate shows training metric improvement but validation instability. The expected volume is 62,960 images, but only 58,510 images are usable, creating a 7.1% variance against the control expectation. Training F1 is 0.93 but validation F1 drops to 0.81 on low-light images. The accepted rule is: validation F1 must be above 0.86 and train-val gap below 5 points. The learner receives training run log, checkpoint metric table, validation error slice report, model card draft, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Deep Learning Candidate Packaging Review. The learner follows a checklist to identify the visible issue, mark the risk level, and prepare the first evidence note. Pressure points: Computer vision defect-detection release review is time-sensitive; variance is 7.1% against the rule; training F1 is 0.93 but validation F1 drops to 0.81 on low-light images; learner has limited autonomy and must avoid over-escalating a simple issue.',
  'Course trigger: supervisor flags the issue as a guided practice case: 58,510 of 62,960 images passed the check, variance 7.1%, with signal ''training metric improvement but validation instability''.
Problem statement: During a guided training simulation for computer vision defect-detection release review, a deep learning model candidate shows training metric improvement but validation instability. The expected volume is 62,960 images, but only 58,510 images are usable, creating a 7.1% variance against the control expectation. Training F1 is 0.93 but validation F1 drops to 0.81 on low-light images. The accepted rule is: validation F1 must be above 0.86 and train-val gap below 5 points. The learner receives training run log, checkpoint metric table, validation error slice report, model card draft, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Deep Learning Candidate Packaging Review. The learner follows a checklist to identify the visible issue, mark the risk level, and prepare the first evidence note.
Major concepts: train-validation gap; checkpoint comparison; error slice analysis; model card evidence; release candidate packaging; expected 62,960 vs actual 58,510 images; 7.1% variance interpretation; threshold rule: validation F1 must be above 0.86 and train-val gap below 5 points; checklist-based issue recognition; basic threshold reading.
Root-cause focus: Use the checklist to identify whether the visible issue points to: overfitting, class imbalance, data augmentation mismatch, checkpoint selection error, or weak slice performance. Evidence must come from training run log, checkpoint metric table, validation error slice report.
Required data: training run log; checkpoint metric table; validation error slice report; model card draft; release candidate request; guided checklist; sample completed reference note
Artifact: Deep Learning Candidate Packaging Review - Guided Evidence Note
Artifact structure: case summary; expected vs actual numbers; threshold rule; evidence table from training run log, checkpoint metric table, validation error slice report; root-cause hypothesis; decision/action; risk note; role handoff.
Evidence fields to assess: captures expected 62,960 and actual 58,510 images; calculates or explains 7.1% variance; uses threshold rule correctly (validation F1 must be above 0.86 and train-val gap below 5 points); cites at least three input documents; links evidence to root-cause hypothesis; states clear release/hold/correct/escalate decision.
AI support tips: Use AI as a coach to ask evidence-checking questions, explain unfamiliar terms, compare possible root causes, and improve clarity. Do not use AI to invent numbers or make the decision without citing the provided documents.',
  1,
  '8  hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech CSE - AI & Machine Learning Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-036' LIMIT 1),
  'B.Tech CSE - AI & Machine Learning Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech AI & Data Science - ML Engineering Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-036' LIMIT 1),
  'B.Tech AI & Data Science - ML Engineering Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Tech AI / Machine Learning Engineering
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-036' LIMIT 1),
  'M.Tech AI / Machine Learning Engineering',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Sc AI & Machine Learning
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-036' LIMIT 1),
  'M.Sc AI & Machine Learning',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MCA - AI / ML Application Development
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-036' LIMIT 1),
  'MCA - AI / ML Application Development',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Review NLP and LLM Evaluation Evidence with a Guided Checklist
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Review NLP and LLM Evaluation Evidence with a Guided Checklist',
  'CRS-IND-CL-041',
  'By the end of this course, the learner can review guided evidence for NLP and LLM Evaluation by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact. Workplace problem: During a guided training simulation for customer-support ticket routing release, an LLM extraction feature shows structured-output errors and label-schema mismatch. The expected volume is 16,130 prompts, but only 14,729 prompts are usable, creating a 8.7% variance against the control expectation. 12.4% of outputs fail the required JSON schema and refund-intent labels are confused with complaint-intent. The accepted rule is: JSON validity must exceed 98% and critical label errors below 1%. The learner receives prompt set, LLM evaluation result table, label schema definition, failure examples, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the NLP/LLM Evaluation Failure Analysis Pack. The learner follows a checklist to identify the visible issue, mark the risk level, and prepare the first evidence note. Artifact: NLP/LLM Evaluation Failure Analysis Pack - Guided Evidence Note.',
  '8  hours',
  'Active',
  'Machine Learning, Deep Learning & NLP Engineering',
  'technical',
  '["By the end of this course, the learner can review guided evidence for NLP and LLM Evaluation by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact","Learner demonstrates NLP and LLM Evaluation by interpreting real-looking numbers, comparing evidence from prompt set and LLM evaluation result table, and producing a decision-ready artifact","Proves the learner can perform guided checklist work in NLP and LLM Evaluation with numeric evidence, workplace documents, and a reviewer-ready artifact. Status: Demo Ready"]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L1 Module: NLP and LLM Evaluation Workplace Mission
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-041' LIMIT 1),
  'L1 Module: NLP and LLM Evaluation Workplace Mission',
  'Industry requirement: Teams responsible for an LLM extraction feature need learners who can use numeric evidence, threshold rules, and workplace documents to make reliable decisions during customer-support ticket routing release, not only explain NLP and LLM Evaluation theoretically. Gap addressed: Academic learning may cover the concepts behind NLP and LLM Evaluation, but it usually does not make learners practice with prompt set, LLM evaluation result table, label schema definition, numeric variance, threshold decisions, and role handoff artifacts. Trigger: supervisor flags the issue as a guided practice case: 14,729 of 16,130 prompts passed the check, variance 8.7%, with signal ''structured-output errors and label-schema mismatch''.',
  1,
  '["Data & AI","Machine Learning, Deep Learning & NLP Engineering","NLP and LLM Evaluation","Primary: Evidence. Supporting: Technical, Functional, Domain","structured-output validation","label-schema compliance","confusion matrix review","prompt failure pattern","downstream routing risk","expected 16,130 vs actual 14,729 prompts","8.7% variance interpretation","threshold rule: JSON validity must exceed 98% and critical label errors below 1%","checklist-based issue recognition","basic threshold reading"]'::jsonb,
  '["Engage: Learner receives a guided checklist case: customer-support ticket routing release is at risk because only 14,729 of 16,130 prompts passed the control and structured-output errors and label-schema mismatch is visible","Explore: Learner reviews prompt set, LLM evaluation result table, label schema definition, failure examples, routing product requirement, highlights the fields that prove the issue, and notes which values cross the threshold","Explain: Learner studies structured-output validation, label-schema compliance, confusion matrix review, prompt failure pattern and learns how these concepts explain the business risk, not just the technical error","Express: Learner prepares the NLP/LLM Evaluation Failure Analysis Pack with issue summary, numeric evidence, root-cause hypothesis, decision, and handoff note","Empower: Learner must recommend supervisor review with a clear checklist finding for customer-support ticket routing release","Evolve: Learner adds one missed checklist question that would catch the same structured-output errors and label-schema mismatch earlier"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Scenario: NLP/LLM Evaluation Failure Analysis Pack - Guided Evidence Note
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-041' LIMIT 1)
   AND title = 'L1 Module: NLP and LLM Evaluation Workplace Mission' LIMIT 1),
  'Workplace Scenario: NLP/LLM Evaluation Failure Analysis Pack - Guided Evidence Note',
  'During a guided training simulation for customer-support ticket routing release, an LLM extraction feature shows structured-output errors and label-schema mismatch. The expected volume is 16,130 prompts, but only 14,729 prompts are usable, creating a 8.7% variance against the control expectation. 12.4% of outputs fail the required JSON schema and refund-intent labels are confused with complaint-intent. The accepted rule is: JSON validity must exceed 98% and critical label errors below 1%. The learner receives prompt set, LLM evaluation result table, label schema definition, failure examples, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the NLP/LLM Evaluation Failure Analysis Pack. The learner follows a checklist to identify the visible issue, mark the risk level, and prepare the first evidence note. Pressure points: Customer-support ticket routing release is time-sensitive; variance is 8.7% against the rule; 12.4% of outputs fail the required JSON schema and refund-intent labels are confused with complaint-intent; learner has limited autonomy and must avoid over-escalating a simple issue.',
  'Course trigger: supervisor flags the issue as a guided practice case: 14,729 of 16,130 prompts passed the check, variance 8.7%, with signal ''structured-output errors and label-schema mismatch''.
Problem statement: During a guided training simulation for customer-support ticket routing release, an LLM extraction feature shows structured-output errors and label-schema mismatch. The expected volume is 16,130 prompts, but only 14,729 prompts are usable, creating a 8.7% variance against the control expectation. 12.4% of outputs fail the required JSON schema and refund-intent labels are confused with complaint-intent. The accepted rule is: JSON validity must exceed 98% and critical label errors below 1%. The learner receives prompt set, LLM evaluation result table, label schema definition, failure examples, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the NLP/LLM Evaluation Failure Analysis Pack. The learner follows a checklist to identify the visible issue, mark the risk level, and prepare the first evidence note.
Major concepts: structured-output validation; label-schema compliance; confusion matrix review; prompt failure pattern; downstream routing risk; expected 16,130 vs actual 14,729 prompts; 8.7% variance interpretation; threshold rule: JSON validity must exceed 98% and critical label errors below 1%; checklist-based issue recognition; basic threshold reading.
Root-cause focus: Use the checklist to identify whether the visible issue points to: ambiguous labels, prompt instruction weakness, schema constraint failure, retrieval context noise, or unsupported edge cases. Evidence must come from prompt set, LLM evaluation result table, label schema definition.
Required data: prompt set; LLM evaluation result table; label schema definition; failure examples; routing product requirement; guided checklist; sample completed reference note
Artifact: NLP/LLM Evaluation Failure Analysis Pack - Guided Evidence Note
Artifact structure: case summary; expected vs actual numbers; threshold rule; evidence table from prompt set, LLM evaluation result table, label schema definition; root-cause hypothesis; decision/action; risk note; role handoff.
Evidence fields to assess: captures expected 16,130 and actual 14,729 prompts; calculates or explains 8.7% variance; uses threshold rule correctly (JSON validity must exceed 98% and critical label errors below 1%); cites at least three input documents; links evidence to root-cause hypothesis; states clear release/hold/correct/escalate decision.
AI support tips: Use AI as a coach to ask evidence-checking questions, explain unfamiliar terms, compare possible root causes, and improve clarity. Do not use AI to invent numbers or make the decision without citing the provided documents.',
  1,
  '8  hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech CSE - AI & Machine Learning Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-041' LIMIT 1),
  'B.Tech CSE - AI & Machine Learning Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech AI & Data Science - ML Engineering Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-041' LIMIT 1),
  'B.Tech AI & Data Science - ML Engineering Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Tech AI / Machine Learning Engineering
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-041' LIMIT 1),
  'M.Tech AI / Machine Learning Engineering',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Sc AI & Machine Learning
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-041' LIMIT 1),
  'M.Sc AI & Machine Learning',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MCA - AI / ML Application Development
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-041' LIMIT 1),
  'MCA - AI / ML Application Development',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Review Canary Model Release Operation Evidence with a Guided Checklist
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Review Canary Model Release Operation Evidence with a Guided Checklist',
  'CRS-IND-CL-046',
  'By the end of this course, the learner can review guided evidence for Canary Model Release Operation by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact. Workplace problem: During a guided training simulation for fraud model production rollout, a canary model release shows canary traffic metrics breach release guardrail. The expected volume is 138,700 transactions, but only 129,425 transactions are usable, creating a 6.7% variance against the control expectation. Canary false positives increased by 3.7 points and p95 latency moved from 180 ms to 310 ms. The accepted rule is: canary false-positive increase must stay below 2 points. The learner receives release checklist, canary metric dashboard, rollback decision log, model version registry, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Canary Model Release Decision Record. The learner follows a checklist to identify the visible issue, mark the risk level, and prepare the first evidence note. Artifact: Canary Model Release Decision Record - Guided Evidence Note.',
  '8  hours',
  'Active',
  'MLOps & AI Platform Operations',
  'technical',
  '["By the end of this course, the learner can review guided evidence for Canary Model Release Operation by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact","Learner demonstrates Canary Model Release Operation by interpreting real-looking numbers, comparing evidence from release checklist and canary metric dashboard, and producing a decision-ready artifact","Proves the learner can perform guided checklist work in Canary Model Release Operation with numeric evidence, workplace documents, and a reviewer-ready artifact. Status: Demo Ready"]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L1 Module: Canary Model Release Operation Workplace Mission
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-046' LIMIT 1),
  'L1 Module: Canary Model Release Operation Workplace Mission',
  'Industry requirement: Teams responsible for a canary model release need learners who can use numeric evidence, threshold rules, and workplace documents to make reliable decisions during fraud model production rollout, not only explain Canary Model Release Operation theoretically. Gap addressed: Academic learning may cover the concepts behind Canary Model Release Operation, but it usually does not make learners practice with release checklist, canary metric dashboard, rollback decision log, numeric variance, threshold decisions, and role handoff artifacts. Trigger: supervisor flags the issue as a guided practice case: 129,425 of 138,700 transactions passed the check, variance 6.7%, with signal ''canary traffic metrics breach release guardrail''.',
  1,
  '["Data & AI","MLOps & AI Platform Operations","Canary Model Release Operation","Primary: Evidence. Supporting: Technical, Functional, Domain","canary traffic split","release guardrails","rollback threshold","latency monitoring","model version control","expected 138,700 vs actual 129,425 transactions","6.7% variance interpretation","threshold rule: canary false-positive increase must stay below 2 points","checklist-based issue recognition","basic threshold reading"]'::jsonb,
  '["Engage: Learner receives a guided checklist case: fraud model production rollout is at risk because only 129,425 of 138,700 transactions passed the control and canary traffic metrics breach release guardrail is visible","Explore: Learner reviews release checklist, canary metric dashboard, rollback decision log, model version registry, incident communication draft, highlights the fields that prove the issue, and notes which values cross the threshold","Explain: Learner studies canary traffic split, release guardrails, rollback threshold, latency monitoring and learns how these concepts explain the business risk, not just the technical error","Express: Learner prepares the Canary Model Release Decision Record with issue summary, numeric evidence, root-cause hypothesis, decision, and handoff note","Empower: Learner must recommend supervisor review with a clear checklist finding for fraud model production rollout","Evolve: Learner adds one missed checklist question that would catch the same canary traffic metrics breach release guardrail earlier"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Scenario: Canary Model Release Decision Record - Guided Evidence Note
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-046' LIMIT 1)
   AND title = 'L1 Module: Canary Model Release Operation Workplace Mission' LIMIT 1),
  'Workplace Scenario: Canary Model Release Decision Record - Guided Evidence Note',
  'During a guided training simulation for fraud model production rollout, a canary model release shows canary traffic metrics breach release guardrail. The expected volume is 138,700 transactions, but only 129,425 transactions are usable, creating a 6.7% variance against the control expectation. Canary false positives increased by 3.7 points and p95 latency moved from 180 ms to 310 ms. The accepted rule is: canary false-positive increase must stay below 2 points. The learner receives release checklist, canary metric dashboard, rollback decision log, model version registry, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Canary Model Release Decision Record. The learner follows a checklist to identify the visible issue, mark the risk level, and prepare the first evidence note. Pressure points: Fraud model production rollout is time-sensitive; variance is 6.7% against the rule; canary false positives increased by 3.7 points and p95 latency moved from 180 ms to 310 ms; learner has limited autonomy and must avoid over-escalating a simple issue.',
  'Course trigger: supervisor flags the issue as a guided practice case: 129,425 of 138,700 transactions passed the check, variance 6.7%, with signal ''canary traffic metrics breach release guardrail''.
Problem statement: During a guided training simulation for fraud model production rollout, a canary model release shows canary traffic metrics breach release guardrail. The expected volume is 138,700 transactions, but only 129,425 transactions are usable, creating a 6.7% variance against the control expectation. Canary false positives increased by 3.7 points and p95 latency moved from 180 ms to 310 ms. The accepted rule is: canary false-positive increase must stay below 2 points. The learner receives release checklist, canary metric dashboard, rollback decision log, model version registry, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Canary Model Release Decision Record. The learner follows a checklist to identify the visible issue, mark the risk level, and prepare the first evidence note.
Major concepts: canary traffic split; release guardrails; rollback threshold; latency monitoring; model version control; expected 138,700 vs actual 129,425 transactions; 6.7% variance interpretation; threshold rule: canary false-positive increase must stay below 2 points; checklist-based issue recognition; basic threshold reading.
Root-cause focus: Use the checklist to identify whether the visible issue points to: model threshold mismatch, feature parity issue, latency regression, bad canary split, or rollback criteria not met. Evidence must come from release checklist, canary metric dashboard, rollback decision log.
Required data: release checklist; canary metric dashboard; rollback decision log; model version registry; incident communication draft; guided checklist; sample completed reference note
Artifact: Canary Model Release Decision Record - Guided Evidence Note
Artifact structure: case summary; expected vs actual numbers; threshold rule; evidence table from release checklist, canary metric dashboard, rollback decision log; root-cause hypothesis; decision/action; risk note; role handoff.
Evidence fields to assess: captures expected 138,700 and actual 129,425 transactions; calculates or explains 6.7% variance; uses threshold rule correctly (canary false-positive increase must stay below 2 points); cites at least three input documents; links evidence to root-cause hypothesis; states clear release/hold/correct/escalate decision.
AI support tips: Use AI as a coach to ask evidence-checking questions, explain unfamiliar terms, compare possible root causes, and improve clarity. Do not use AI to invent numbers or make the decision without citing the provided documents.',
  1,
  '8  hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech CSE - AI & Machine Learning Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-046' LIMIT 1),
  'B.Tech CSE - AI & Machine Learning Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech AI & Data Science - ML Engineering Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-046' LIMIT 1),
  'B.Tech AI & Data Science - ML Engineering Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Tech AI / Machine Learning Engineering
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-046' LIMIT 1),
  'M.Tech AI / Machine Learning Engineering',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Sc AI & Machine Learning
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-046' LIMIT 1),
  'M.Sc AI & Machine Learning',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MCA - AI / ML Application Development
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-046' LIMIT 1),
  'MCA - AI / ML Application Development',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech CSE - Cloud AI / MLOps Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-046' LIMIT 1),
  'B.Tech CSE - Cloud AI / MLOps Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Review Model Drift Response Evidence with a Guided Checklist
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Review Model Drift Response Evidence with a Guided Checklist',
  'CRS-IND-CL-051',
  'By the end of this course, the learner can review guided evidence for Model Drift Response by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact. Workplace problem: During a guided training simulation for monthly drift alert review, a production credit-risk model shows feature-skew and segment-level performance drift. The expected volume is 225,070 predictions, but only 208,790 predictions are usable, creating a 7.2% variance against the control expectation. Income_band PSI is 0.31 and AUC for new-to-credit users dropped from 0.78 to 0.71. The accepted rule is: PSI above 0.20 or AUC drop above 3 points requires triage. The learner receives drift alert log, feature-skew diagnostic sheet, production prediction sample, threshold decision record, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Model Drift Response Triage Pack. The learner follows a checklist to identify the visible issue, mark the risk level, and prepare the first evidence note. Artifact: Model Drift Response Triage Pack - Guided Evidence Note.',
  '8  hours',
  'Active',
  'MLOps & AI Platform Operations',
  'technical',
  '["By the end of this course, the learner can review guided evidence for Model Drift Response by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact","Learner demonstrates Model Drift Response by interpreting real-looking numbers, comparing evidence from drift alert log and feature-skew diagnostic sheet, and producing a decision-ready artifact","Proves the learner can perform guided checklist work in Model Drift Response with numeric evidence, workplace documents, and a reviewer-ready artifact. Status: Pilot Ready — Evidence Strengthening Needed"]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L1 Module: Model Drift Response Workplace Mission
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-051' LIMIT 1),
  'L1 Module: Model Drift Response Workplace Mission',
  'Industry requirement: Teams responsible for a production credit-risk model need learners who can use numeric evidence, threshold rules, and workplace documents to make reliable decisions during monthly drift alert review, not only explain Model Drift Response theoretically. Gap addressed: Academic learning may cover the concepts behind Model Drift Response, but it usually does not make learners practice with drift alert log, feature-skew diagnostic sheet, production prediction sample, numeric variance, threshold decisions, and role handoff artifacts. Trigger: supervisor flags the issue as a guided practice case: 208,790 of 225,070 predictions passed the check, variance 7.2%, with signal ''feature-skew and segment-level performance drift''.',
  1,
  '["Data & AI","MLOps & AI Platform Operations","Model Drift Response","Primary: Evidence. Supporting: Technical, Functional, Domain","population stability index","segment-level drift","feature-skew evidence","AUC degradation","retrain versus monitor decision","expected 225,070 vs actual 208,790 predictions","7.2% variance interpretation","threshold rule: PSI above 0.20 or AUC drop above 3 points requires triage","checklist-based issue recognition","basic threshold reading"]'::jsonb,
  '["Engage: Learner receives a guided checklist case: monthly drift alert review is at risk because only 208,790 of 225,070 predictions passed the control and feature-skew and segment-level performance drift is visible","Explore: Learner reviews drift alert log, feature-skew diagnostic sheet, production prediction sample, threshold decision record, previous retraining note, highlights the fields that prove the issue, and notes which values cross the threshold","Explain: Learner studies population stability index, segment-level drift, feature-skew evidence, AUC degradation and learns how these concepts explain the business risk, not just the technical error","Express: Learner prepares the Model Drift Response Triage Pack with issue summary, numeric evidence, root-cause hypothesis, decision, and handoff note","Empower: Learner must recommend supervisor review with a clear checklist finding for monthly drift alert review","Evolve: Learner adds one missed checklist question that would catch the same feature-skew and segment-level performance drift earlier"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Scenario: Model Drift Response Triage Pack - Guided Evidence Note
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-051' LIMIT 1)
   AND title = 'L1 Module: Model Drift Response Workplace Mission' LIMIT 1),
  'Workplace Scenario: Model Drift Response Triage Pack - Guided Evidence Note',
  'During a guided training simulation for monthly drift alert review, a production credit-risk model shows feature-skew and segment-level performance drift. The expected volume is 225,070 predictions, but only 208,790 predictions are usable, creating a 7.2% variance against the control expectation. Income_band PSI is 0.31 and AUC for new-to-credit users dropped from 0.78 to 0.71. The accepted rule is: PSI above 0.20 or AUC drop above 3 points requires triage. The learner receives drift alert log, feature-skew diagnostic sheet, production prediction sample, threshold decision record, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Model Drift Response Triage Pack. The learner follows a checklist to identify the visible issue, mark the risk level, and prepare the first evidence note. Pressure points: Monthly drift alert review is time-sensitive; variance is 7.2% against the rule; income_band PSI is 0.31 and AUC for new-to-credit users dropped from 0.78 to 0.71; learner has limited autonomy and must avoid over-escalating a simple issue.',
  'Course trigger: supervisor flags the issue as a guided practice case: 208,790 of 225,070 predictions passed the check, variance 7.2%, with signal ''feature-skew and segment-level performance drift''.
Problem statement: During a guided training simulation for monthly drift alert review, a production credit-risk model shows feature-skew and segment-level performance drift. The expected volume is 225,070 predictions, but only 208,790 predictions are usable, creating a 7.2% variance against the control expectation. Income_band PSI is 0.31 and AUC for new-to-credit users dropped from 0.78 to 0.71. The accepted rule is: PSI above 0.20 or AUC drop above 3 points requires triage. The learner receives drift alert log, feature-skew diagnostic sheet, production prediction sample, threshold decision record, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Model Drift Response Triage Pack. The learner follows a checklist to identify the visible issue, mark the risk level, and prepare the first evidence note.
Major concepts: population stability index; segment-level drift; feature-skew evidence; AUC degradation; retrain versus monitor decision; expected 225,070 vs actual 208,790 predictions; 7.2% variance interpretation; threshold rule: PSI above 0.20 or AUC drop above 3 points requires triage; checklist-based issue recognition; basic threshold reading.
Root-cause focus: Use the checklist to identify whether the visible issue points to: population shift, feature pipeline change, model degradation, threshold misconfiguration, or seasonal behavior change. Evidence must come from drift alert log, feature-skew diagnostic sheet, production prediction sample.
Required data: drift alert log; feature-skew diagnostic sheet; production prediction sample; threshold decision record; previous retraining note; guided checklist; sample completed reference note
Artifact: Model Drift Response Triage Pack - Guided Evidence Note
Artifact structure: case summary; expected vs actual numbers; threshold rule; evidence table from drift alert log, feature-skew diagnostic sheet, production prediction sample; root-cause hypothesis; decision/action; risk note; role handoff.
Evidence fields to assess: captures expected 225,070 and actual 208,790 predictions; calculates or explains 7.2% variance; uses threshold rule correctly (PSI above 0.20 or AUC drop above 3 points requires triage); cites at least three input documents; links evidence to root-cause hypothesis; states clear release/hold/correct/escalate decision.
AI support tips: Use AI as a coach to ask evidence-checking questions, explain unfamiliar terms, compare possible root causes, and improve clarity. Do not use AI to invent numbers or make the decision without citing the provided documents.',
  1,
  '8  hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech CSE - AI & Machine Learning Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-051' LIMIT 1),
  'B.Tech CSE - AI & Machine Learning Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech AI & Data Science - ML Engineering Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-051' LIMIT 1),
  'B.Tech AI & Data Science - ML Engineering Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Tech AI / Machine Learning Engineering
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-051' LIMIT 1),
  'M.Tech AI / Machine Learning Engineering',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Sc AI & Machine Learning
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-051' LIMIT 1),
  'M.Sc AI & Machine Learning',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MCA - AI / ML Application Development
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-051' LIMIT 1),
  'MCA - AI / ML Application Development',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech CSE - Cloud AI / MLOps Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-051' LIMIT 1),
  'B.Tech CSE - Cloud AI / MLOps Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Review Edge AI Anomaly Actioning Evidence with a Guided Checklist
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Review Edge AI Anomaly Actioning Evidence with a Guided Checklist',
  'CRS-IND-CL-056',
  'By the end of this course, the learner can review guided evidence for Edge AI Anomaly Actioning by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact. Workplace problem: During a guided training simulation for factory anomaly alert response, an edge AI predictive-maintenance device shows device inference anomaly and sensor packet loss. The expected volume is 104,440 readings, but only 97,600 readings are usable, creating a 6.5% variance against the control expectation. Motor vibration anomaly score reached 0.91 while 6.5% of temperature packets were missing. The accepted rule is: packet loss above 4% or anomaly score above 0.82 requires action. The learner receives edge device alert log, sensor packet summary, local inference score sheet, maintenance history note, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Edge AI Anomaly Action Record. The learner follows a checklist to identify the visible issue, mark the risk level, and prepare the first evidence note. Artifact: Edge AI Anomaly Action Record - Guided Evidence Note.',
  '8  hours',
  'Active',
  'Cloud, Edge, IoT & Autonomous AI Systems',
  'technical',
  '["By the end of this course, the learner can review guided evidence for Edge AI Anomaly Actioning by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact","Learner demonstrates Edge AI Anomaly Actioning by interpreting real-looking numbers, comparing evidence from edge device alert log and sensor packet summary, and producing a decision-ready artifact","Proves the learner can perform guided checklist work in Edge AI Anomaly Actioning with numeric evidence, workplace documents, and a reviewer-ready artifact. Status: Pilot Ready — Evidence Strengthening Needed"]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L1 Module: Edge AI Anomaly Actioning Workplace Mission
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-056' LIMIT 1),
  'L1 Module: Edge AI Anomaly Actioning Workplace Mission',
  'Industry requirement: Teams responsible for an edge AI predictive-maintenance device need learners who can use numeric evidence, threshold rules, and workplace documents to make reliable decisions during factory anomaly alert response, not only explain Edge AI Anomaly Actioning theoretically. Gap addressed: Academic learning may cover the concepts behind Edge AI Anomaly Actioning, but it usually does not make learners practice with edge device alert log, sensor packet summary, local inference score sheet, numeric variance, threshold decisions, and role handoff artifacts. Trigger: supervisor flags the issue as a guided practice case: 97,600 of 104,440 readings passed the check, variance 6.5%, with signal ''device inference anomaly and sensor packet loss''.',
  1,
  '["Data & AI","Cloud, Edge, IoT & Autonomous AI Systems","Edge AI Anomaly Actioning","Primary: Evidence. Supporting: Technical, Functional, Domain","edge inference score","sensor packet loss","local-versus-cloud decision","field maintenance escalation","false alert control","expected 104,440 vs actual 97,600 readings","6.5% variance interpretation","threshold rule: packet loss above 4% or anomaly score above 0.82 requires action","checklist-based issue recognition","basic threshold reading"]'::jsonb,
  '["Engage: Learner receives a guided checklist case: factory anomaly alert response is at risk because only 97,600 of 104,440 readings passed the control and device inference anomaly and sensor packet loss is visible","Explore: Learner reviews edge device alert log, sensor packet summary, local inference score sheet, maintenance history note, field action ticket, highlights the fields that prove the issue, and notes which values cross the threshold","Explain: Learner studies edge inference score, sensor packet loss, local-versus-cloud decision, field maintenance escalation and learns how these concepts explain the business risk, not just the technical error","Express: Learner prepares the Edge AI Anomaly Action Record with issue summary, numeric evidence, root-cause hypothesis, decision, and handoff note","Empower: Learner must recommend supervisor review with a clear checklist finding for factory anomaly alert response","Evolve: Learner adds one missed checklist question that would catch the same device inference anomaly and sensor packet loss earlier"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Scenario: Edge AI Anomaly Action Record - Guided Evidence Note
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-056' LIMIT 1)
   AND title = 'L1 Module: Edge AI Anomaly Actioning Workplace Mission' LIMIT 1),
  'Workplace Scenario: Edge AI Anomaly Action Record - Guided Evidence Note',
  'During a guided training simulation for factory anomaly alert response, an edge AI predictive-maintenance device shows device inference anomaly and sensor packet loss. The expected volume is 104,440 readings, but only 97,600 readings are usable, creating a 6.5% variance against the control expectation. Motor vibration anomaly score reached 0.91 while 6.5% of temperature packets were missing. The accepted rule is: packet loss above 4% or anomaly score above 0.82 requires action. The learner receives edge device alert log, sensor packet summary, local inference score sheet, maintenance history note, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Edge AI Anomaly Action Record. The learner follows a checklist to identify the visible issue, mark the risk level, and prepare the first evidence note. Pressure points: Factory anomaly alert response is time-sensitive; variance is 6.5% against the rule; motor vibration anomaly score reached 0.91 while 6.5% of temperature packets were missing; learner has limited autonomy and must avoid over-escalating a simple issue.',
  'Course trigger: supervisor flags the issue as a guided practice case: 97,600 of 104,440 readings passed the check, variance 6.5%, with signal ''device inference anomaly and sensor packet loss''.
Problem statement: During a guided training simulation for factory anomaly alert response, an edge AI predictive-maintenance device shows device inference anomaly and sensor packet loss. The expected volume is 104,440 readings, but only 97,600 readings are usable, creating a 6.5% variance against the control expectation. Motor vibration anomaly score reached 0.91 while 6.5% of temperature packets were missing. The accepted rule is: packet loss above 4% or anomaly score above 0.82 requires action. The learner receives edge device alert log, sensor packet summary, local inference score sheet, maintenance history note, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Edge AI Anomaly Action Record. The learner follows a checklist to identify the visible issue, mark the risk level, and prepare the first evidence note.
Major concepts: edge inference score; sensor packet loss; local-versus-cloud decision; field maintenance escalation; false alert control; expected 104,440 vs actual 97,600 readings; 6.5% variance interpretation; threshold rule: packet loss above 4% or anomaly score above 0.82 requires action; checklist-based issue recognition; basic threshold reading.
Root-cause focus: Use the checklist to identify whether the visible issue points to: sensor failure, model edge-version mismatch, device network loss, actual equipment anomaly, or threshold calibration issue. Evidence must come from edge device alert log, sensor packet summary, local inference score sheet.
Required data: edge device alert log; sensor packet summary; local inference score sheet; maintenance history note; field action ticket; guided checklist; sample completed reference note
Artifact: Edge AI Anomaly Action Record - Guided Evidence Note
Artifact structure: case summary; expected vs actual numbers; threshold rule; evidence table from edge device alert log, sensor packet summary, local inference score sheet; root-cause hypothesis; decision/action; risk note; role handoff.
Evidence fields to assess: captures expected 104,440 and actual 97,600 readings; calculates or explains 6.5% variance; uses threshold rule correctly (packet loss above 4% or anomaly score above 0.82 requires action); cites at least three input documents; links evidence to root-cause hypothesis; states clear release/hold/correct/escalate decision.
AI support tips: Use AI as a coach to ask evidence-checking questions, explain unfamiliar terms, compare possible root causes, and improve clarity. Do not use AI to invent numbers or make the decision without citing the provided documents.',
  1,
  '8  hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech CSE - Data Engineering Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-056' LIMIT 1),
  'B.Tech CSE - Data Engineering Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech AI & Data Science - Data Platform Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-056' LIMIT 1),
  'B.Tech AI & Data Science - Data Platform Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Data Science - Data Engineering Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-056' LIMIT 1),
  'B.Sc Data Science - Data Engineering Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MCA - Data Engineering / Cloud Data Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-056' LIMIT 1),
  'MCA - Data Engineering / Cloud Data Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Tech Data Engineering / Big Data Systems
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-056' LIMIT 1),
  'M.Tech Data Engineering / Big Data Systems',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech AI & Data Science - Applied Industry AI Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-056' LIMIT 1),
  'B.Tech AI & Data Science - Applied Industry AI Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Review Data Governance Control Maintenance Evidence with a Guided Checklist
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Review Data Governance Control Maintenance Evidence with a Guided Checklist',
  'CRS-IND-CL-061',
  'By the end of this course, the learner can review guided evidence for Data Governance Control Maintenance by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact. Workplace problem: During a guided training simulation for privacy and lineage control review, a governed customer data asset shows unmapped downstream report and missing data-owner approval. The expected volume is 18,230 attributes, but only 16,508 attributes are usable, creating a 9.4% variance against the control expectation. 37 attributes lack sensitivity tags and 8 downstream reports are missing from lineage. The accepted rule is: critical attributes must have 100% owner, lineage, and policy tagging. The learner receives data asset inventory, lineage extract, policy tag register, owner approval sheet, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Data Governance Control Maintenance Log. The learner follows a checklist to identify the visible issue, mark the risk level, and prepare the first evidence note. Artifact: Data Governance Control Maintenance Log - Guided Evidence Note.',
  '8  hours',
  'Active',
  'Data Governance & Stewardship',
  'technical',
  '["By the end of this course, the learner can review guided evidence for Data Governance Control Maintenance by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact","Learner demonstrates Data Governance Control Maintenance by interpreting real-looking numbers, comparing evidence from data asset inventory and lineage extract, and producing a decision-ready artifact","Proves the learner can perform guided checklist work in Data Governance Control Maintenance with numeric evidence, workplace documents, and a reviewer-ready artifact. Status: Demo Ready"]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L1 Module: Data Governance Control Maintenance Workplace Mission
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-061' LIMIT 1),
  'L1 Module: Data Governance Control Maintenance Workplace Mission',
  'Industry requirement: Teams responsible for a governed customer data asset need learners who can use numeric evidence, threshold rules, and workplace documents to make reliable decisions during privacy and lineage control review, not only explain Data Governance Control Maintenance theoretically. Gap addressed: Academic learning may cover the concepts behind Data Governance Control Maintenance, but it usually does not make learners practice with data asset inventory, lineage extract, policy tag register, numeric variance, threshold decisions, and role handoff artifacts. Trigger: supervisor flags the issue as a guided practice case: 16,508 of 18,230 attributes passed the check, variance 9.4%, with signal ''unmapped downstream report and missing data-owner approval''.',
  1,
  '["Data & AI","Data Governance & Stewardship","Data Governance Control Maintenance","Primary: Compliance. Supporting: Evidence, Technical, Communication","data ownership","lineage completeness","policy tagging","sensitive data classification","governance control evidence","expected 18,230 vs actual 16,508 attributes","9.4% variance interpretation","threshold rule: critical attributes must have 100% owner, lineage, and policy tagging","checklist-based issue recognition","basic threshold reading"]'::jsonb,
  '["Engage: Learner receives a guided checklist case: privacy and lineage control review is at risk because only 16,508 of 18,230 attributes passed the control and unmapped downstream report and missing data-owner approval is visible","Explore: Learner reviews data asset inventory, lineage extract, policy tag register, owner approval sheet, downstream report list, highlights the fields that prove the issue, and notes which values cross the threshold","Explain: Learner studies data ownership, lineage completeness, policy tagging, sensitive data classification and learns how these concepts explain the business risk, not just the technical error","Express: Learner prepares the Data Governance Control Maintenance Log with issue summary, numeric evidence, root-cause hypothesis, decision, and handoff note","Empower: Learner must recommend supervisor review with a clear checklist finding for privacy and lineage control review","Evolve: Learner adds one missed checklist question that would catch the same unmapped downstream report and missing data-owner approval earlier"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Scenario: Data Governance Control Maintenance Log - Guided Evidence Note
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-061' LIMIT 1)
   AND title = 'L1 Module: Data Governance Control Maintenance Workplace Mission' LIMIT 1),
  'Workplace Scenario: Data Governance Control Maintenance Log - Guided Evidence Note',
  'During a guided training simulation for privacy and lineage control review, a governed customer data asset shows unmapped downstream report and missing data-owner approval. The expected volume is 18,230 attributes, but only 16,508 attributes are usable, creating a 9.4% variance against the control expectation. 37 attributes lack sensitivity tags and 8 downstream reports are missing from lineage. The accepted rule is: critical attributes must have 100% owner, lineage, and policy tagging. The learner receives data asset inventory, lineage extract, policy tag register, owner approval sheet, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Data Governance Control Maintenance Log. The learner follows a checklist to identify the visible issue, mark the risk level, and prepare the first evidence note. Pressure points: Privacy and lineage control review is time-sensitive; variance is 9.4% against the rule; 37 attributes lack sensitivity tags and 8 downstream reports are missing from lineage; learner has limited autonomy and must avoid over-escalating a simple issue.',
  'Course trigger: supervisor flags the issue as a guided practice case: 16,508 of 18,230 attributes passed the check, variance 9.4%, with signal ''unmapped downstream report and missing data-owner approval''.
Problem statement: During a guided training simulation for privacy and lineage control review, a governed customer data asset shows unmapped downstream report and missing data-owner approval. The expected volume is 18,230 attributes, but only 16,508 attributes are usable, creating a 9.4% variance against the control expectation. 37 attributes lack sensitivity tags and 8 downstream reports are missing from lineage. The accepted rule is: critical attributes must have 100% owner, lineage, and policy tagging. The learner receives data asset inventory, lineage extract, policy tag register, owner approval sheet, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Data Governance Control Maintenance Log. The learner follows a checklist to identify the visible issue, mark the risk level, and prepare the first evidence note.
Major concepts: data ownership; lineage completeness; policy tagging; sensitive data classification; governance control evidence; expected 18,230 vs actual 16,508 attributes; 9.4% variance interpretation; threshold rule: critical attributes must have 100% owner, lineage, and policy tagging; checklist-based issue recognition; basic threshold reading.
Root-cause focus: Use the checklist to identify whether the visible issue points to: missing data-owner mapping, stale lineage, untagged sensitive attribute, policy exception, or unregistered report dependency. Evidence must come from data asset inventory, lineage extract, policy tag register.
Required data: data asset inventory; lineage extract; policy tag register; owner approval sheet; downstream report list; guided checklist; sample completed reference note
Artifact: Data Governance Control Maintenance Log - Guided Evidence Note
Artifact structure: case summary; expected vs actual numbers; threshold rule; evidence table from data asset inventory, lineage extract, policy tag register; root-cause hypothesis; decision/action; risk note; role handoff.
Evidence fields to assess: captures expected 18,230 and actual 16,508 attributes; calculates or explains 9.4% variance; uses threshold rule correctly (critical attributes must have 100% owner, lineage, and policy tagging); cites at least three input documents; links evidence to root-cause hypothesis; states clear release/hold/correct/escalate decision.
AI support tips: Use AI as a coach to ask evidence-checking questions, explain unfamiliar terms, compare possible root causes, and improve clarity. Do not use AI to invent numbers or make the decision without citing the provided documents.',
  1,
  '8  hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech AI & Data Science - Responsible AI Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-061' LIMIT 1),
  'B.Tech AI & Data Science - Responsible AI Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech CSE - AI Security / Governance Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-061' LIMIT 1),
  'B.Tech CSE - AI Security / Governance Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MBA Business Analytics - AI Risk & Governance Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-061' LIMIT 1),
  'MBA Business Analytics - AI Risk & Governance Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: LL.B / Tech Law - Data Privacy & AI Governance Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-061' LIMIT 1),
  'LL.B / Tech Law - Data Privacy & AI Governance Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PG Certificate - Responsible AI, Risk & Compliance
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-061' LIMIT 1),
  'PG Certificate - Responsible AI, Risk & Compliance',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech CSE / Data Science - Data Governance Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-061' LIMIT 1),
  'B.Tech CSE / Data Science - Data Governance Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Review Responsible AI Deployment Approval Evidence with a Guided Checklist
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Review Responsible AI Deployment Approval Evidence with a Guided Checklist',
  'CRS-IND-CL-066',
  'By the end of this course, the learner can review guided evidence for Responsible AI Deployment Approval by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact. Workplace problem: During a guided training simulation for loan-assistant chatbot approval, a responsible AI deployment request shows incomplete risk control evidence before deployment. The expected volume is 19,228 checks, but only 17,401 checks are usable, creating a 9.5% variance against the control expectation. Fairness test evidence is missing for 2 protected segments and human-review fallback is not signed off. The accepted rule is: all high-risk controls must be approved before deployment. The learner receives AI use-case registration, risk assessment form, fairness test summary, human fallback design, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Responsible AI Deployment Approval Dossier. The learner follows a checklist to identify the visible issue, mark the risk level, and prepare the first evidence note. Artifact: Responsible AI Deployment Approval Dossier - Guided Evidence Note.',
  '8  hours',
  'Active',
  'Responsible AI, Risk, Privacy & Security',
  'technical',
  '["By the end of this course, the learner can review guided evidence for Responsible AI Deployment Approval by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact","Learner demonstrates Responsible AI Deployment Approval by interpreting real-looking numbers, comparing evidence from AI use-case registration and risk assessment form, and producing a decision-ready artifact","Proves the learner can perform guided checklist work in Responsible AI Deployment Approval with numeric evidence, workplace documents, and a reviewer-ready artifact. Status: Demo Ready"]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L1 Module: Responsible AI Deployment Approval Workplace Mission
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-066' LIMIT 1),
  'L1 Module: Responsible AI Deployment Approval Workplace Mission',
  'Industry requirement: Teams responsible for a responsible AI deployment request need learners who can use numeric evidence, threshold rules, and workplace documents to make reliable decisions during loan-assistant chatbot approval, not only explain Responsible AI Deployment Approval theoretically. Gap addressed: Academic learning may cover the concepts behind Responsible AI Deployment Approval, but it usually does not make learners practice with AI use-case registration, risk assessment form, fairness test summary, numeric variance, threshold decisions, and role handoff artifacts. Trigger: supervisor flags the issue as a guided practice case: 17,401 of 19,228 checks passed the check, variance 9.5%, with signal ''incomplete risk control evidence before deployment''.',
  1,
  '["Data & AI","Responsible AI, Risk, Privacy & Security","Responsible AI Deployment Approval","Primary: Compliance. Supporting: Evidence, Technical, Communication","AI use-case risk tier","fairness evidence","human oversight control","deployment approval gate","responsible AI audit trail","expected 19,228 vs actual 17,401 checks","9.5% variance interpretation","threshold rule: all high-risk controls must be approved before deployment","checklist-based issue recognition","basic threshold reading"]'::jsonb,
  '["Engage: Learner receives a guided checklist case: loan-assistant chatbot approval is at risk because only 17,401 of 19,228 checks passed the control and incomplete risk control evidence before deployment is visible","Explore: Learner reviews AI use-case registration, risk assessment form, fairness test summary, human fallback design, deployment approval checklist, highlights the fields that prove the issue, and notes which values cross the threshold","Explain: Learner studies AI use-case risk tier, fairness evidence, human oversight control, deployment approval gate and learns how these concepts explain the business risk, not just the technical error","Express: Learner prepares the Responsible AI Deployment Approval Dossier with issue summary, numeric evidence, root-cause hypothesis, decision, and handoff note","Empower: Learner must recommend supervisor review with a clear checklist finding for loan-assistant chatbot approval","Evolve: Learner adds one missed checklist question that would catch the same incomplete risk control evidence before deployment earlier"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Scenario: Responsible AI Deployment Approval Dossier - Guided Evidence Note
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-066' LIMIT 1)
   AND title = 'L1 Module: Responsible AI Deployment Approval Workplace Mission' LIMIT 1),
  'Workplace Scenario: Responsible AI Deployment Approval Dossier - Guided Evidence Note',
  'During a guided training simulation for loan-assistant chatbot approval, a responsible AI deployment request shows incomplete risk control evidence before deployment. The expected volume is 19,228 checks, but only 17,401 checks are usable, creating a 9.5% variance against the control expectation. Fairness test evidence is missing for 2 protected segments and human-review fallback is not signed off. The accepted rule is: all high-risk controls must be approved before deployment. The learner receives AI use-case registration, risk assessment form, fairness test summary, human fallback design, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Responsible AI Deployment Approval Dossier. The learner follows a checklist to identify the visible issue, mark the risk level, and prepare the first evidence note. Pressure points: Loan-assistant chatbot approval is time-sensitive; variance is 9.5% against the rule; fairness test evidence is missing for 2 protected segments and human-review fallback is not signed off; learner has limited autonomy and must avoid over-escalating a simple issue.',
  'Course trigger: supervisor flags the issue as a guided practice case: 17,401 of 19,228 checks passed the check, variance 9.5%, with signal ''incomplete risk control evidence before deployment''.
Problem statement: During a guided training simulation for loan-assistant chatbot approval, a responsible AI deployment request shows incomplete risk control evidence before deployment. The expected volume is 19,228 checks, but only 17,401 checks are usable, creating a 9.5% variance against the control expectation. Fairness test evidence is missing for 2 protected segments and human-review fallback is not signed off. The accepted rule is: all high-risk controls must be approved before deployment. The learner receives AI use-case registration, risk assessment form, fairness test summary, human fallback design, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Responsible AI Deployment Approval Dossier. The learner follows a checklist to identify the visible issue, mark the risk level, and prepare the first evidence note.
Major concepts: AI use-case risk tier; fairness evidence; human oversight control; deployment approval gate; responsible AI audit trail; expected 19,228 vs actual 17,401 checks; 9.5% variance interpretation; threshold rule: all high-risk controls must be approved before deployment; checklist-based issue recognition; basic threshold reading.
Root-cause focus: Use the checklist to identify whether the visible issue points to: missing fairness evidence, unclear human oversight, privacy risk gap, unapproved fallback, or incomplete model documentation. Evidence must come from AI use-case registration, risk assessment form, fairness test summary.
Required data: AI use-case registration; risk assessment form; fairness test summary; human fallback design; deployment approval checklist; guided checklist; sample completed reference note
Artifact: Responsible AI Deployment Approval Dossier - Guided Evidence Note
Artifact structure: case summary; expected vs actual numbers; threshold rule; evidence table from AI use-case registration, risk assessment form, fairness test summary; root-cause hypothesis; decision/action; risk note; role handoff.
Evidence fields to assess: captures expected 19,228 and actual 17,401 checks; calculates or explains 9.5% variance; uses threshold rule correctly (all high-risk controls must be approved before deployment); cites at least three input documents; links evidence to root-cause hypothesis; states clear release/hold/correct/escalate decision.
AI support tips: Use AI as a coach to ask evidence-checking questions, explain unfamiliar terms, compare possible root causes, and improve clarity. Do not use AI to invent numbers or make the decision without citing the provided documents.',
  1,
  '8  hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech AI & Data Science - Responsible AI Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-066' LIMIT 1),
  'B.Tech AI & Data Science - Responsible AI Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech CSE - AI Security / Governance Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-066' LIMIT 1),
  'B.Tech CSE - AI Security / Governance Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MBA Business Analytics - AI Risk & Governance Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-066' LIMIT 1),
  'MBA Business Analytics - AI Risk & Governance Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: LL.B / Tech Law - Data Privacy & AI Governance Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-066' LIMIT 1),
  'LL.B / Tech Law - Data Privacy & AI Governance Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PG Certificate - Responsible AI, Risk & Compliance
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-066' LIMIT 1),
  'PG Certificate - Responsible AI, Risk & Compliance',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Review AI Security Abuse-Path Testing Evidence with a Guided Checklist
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Review AI Security Abuse-Path Testing Evidence with a Guided Checklist',
  'CRS-IND-CL-071',
  'By the end of this course, the learner can review guided evidence for AI Security Abuse-Path Testing by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact. Workplace problem: During a guided training simulation for AI security abuse-path test, a GenAI knowledge assistant shows prompt-injection and retrieval data exposure risk. The expected volume is 20,790 tests, but only 18,820 tests are usable, creating a 9.5% variance against the control expectation. 9 prompt-injection tests reveal restricted policy snippets and 14 retrieval responses cite unapproved documents. The accepted rule is: critical abuse paths must have 0 data-exposure passes. The learner receives abuse-path test script, prompt-injection result log, retrieval access-control matrix, sensitive response examples, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the AI Security Abuse-Path Test Report. The learner follows a checklist to identify the visible issue, mark the risk level, and prepare the first evidence note. Artifact: AI Security Abuse-Path Test Report - Guided Evidence Note.',
  '8  hours',
  'Active',
  'Responsible AI, Risk, Privacy & Security',
  'technical',
  '["By the end of this course, the learner can review guided evidence for AI Security Abuse-Path Testing by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact","Learner demonstrates AI Security Abuse-Path Testing by interpreting real-looking numbers, comparing evidence from abuse-path test script and prompt-injection result log, and producing a decision-ready artifact","Proves the learner can perform guided checklist work in AI Security Abuse-Path Testing with numeric evidence, workplace documents, and a reviewer-ready artifact. Status: Pilot Ready — Evidence Strengthening Needed"]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L1 Module: AI Security Abuse-Path Testing Workplace Mission
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-071' LIMIT 1),
  'L1 Module: AI Security Abuse-Path Testing Workplace Mission',
  'Industry requirement: Teams responsible for a GenAI knowledge assistant need learners who can use numeric evidence, threshold rules, and workplace documents to make reliable decisions during AI security abuse-path test, not only explain AI Security Abuse-Path Testing theoretically. Gap addressed: Academic learning may cover the concepts behind AI Security Abuse-Path Testing, but it usually does not make learners practice with abuse-path test script, prompt-injection result log, retrieval access-control matrix, numeric variance, threshold decisions, and role handoff artifacts. Trigger: supervisor flags the issue as a guided practice case: 18,820 of 20,790 tests passed the check, variance 9.5%, with signal ''prompt-injection and retrieval data exposure risk''.',
  1,
  '["Data & AI","Responsible AI, Risk, Privacy & Security","AI Security Abuse-Path Testing","Primary: Compliance. Supporting: Evidence, Technical, Communication","prompt-injection pattern","retrieval access control","data exposure severity","red-team evidence","mitigation decision","expected 20,790 vs actual 18,820 tests","9.5% variance interpretation","threshold rule: critical abuse paths must have 0 data-exposure passes","checklist-based issue recognition","basic threshold reading"]'::jsonb,
  '["Engage: Learner receives a guided checklist case: AI security abuse-path test is at risk because only 18,820 of 20,790 tests passed the control and prompt-injection and retrieval data exposure risk is visible","Explore: Learner reviews abuse-path test script, prompt-injection result log, retrieval access-control matrix, sensitive response examples, security triage ticket, highlights the fields that prove the issue, and notes which values cross the threshold","Explain: Learner studies prompt-injection pattern, retrieval access control, data exposure severity, red-team evidence and learns how these concepts explain the business risk, not just the technical error","Express: Learner prepares the AI Security Abuse-Path Test Report with issue summary, numeric evidence, root-cause hypothesis, decision, and handoff note","Empower: Learner must recommend supervisor review with a clear checklist finding for AI security abuse-path test","Evolve: Learner adds one missed checklist question that would catch the same prompt-injection and retrieval data exposure risk earlier"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Scenario: AI Security Abuse-Path Test Report - Guided Evidence Note
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-071' LIMIT 1)
   AND title = 'L1 Module: AI Security Abuse-Path Testing Workplace Mission' LIMIT 1),
  'Workplace Scenario: AI Security Abuse-Path Test Report - Guided Evidence Note',
  'During a guided training simulation for AI security abuse-path test, a GenAI knowledge assistant shows prompt-injection and retrieval data exposure risk. The expected volume is 20,790 tests, but only 18,820 tests are usable, creating a 9.5% variance against the control expectation. 9 prompt-injection tests reveal restricted policy snippets and 14 retrieval responses cite unapproved documents. The accepted rule is: critical abuse paths must have 0 data-exposure passes. The learner receives abuse-path test script, prompt-injection result log, retrieval access-control matrix, sensitive response examples, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the AI Security Abuse-Path Test Report. The learner follows a checklist to identify the visible issue, mark the risk level, and prepare the first evidence note. Pressure points: Ai security abuse-path test is time-sensitive; variance is 9.5% against the rule; 9 prompt-injection tests reveal restricted policy snippets and 14 retrieval responses cite unapproved documents; learner has limited autonomy and must avoid over-escalating a simple issue.',
  'Course trigger: supervisor flags the issue as a guided practice case: 18,820 of 20,790 tests passed the check, variance 9.5%, with signal ''prompt-injection and retrieval data exposure risk''.
Problem statement: During a guided training simulation for AI security abuse-path test, a GenAI knowledge assistant shows prompt-injection and retrieval data exposure risk. The expected volume is 20,790 tests, but only 18,820 tests are usable, creating a 9.5% variance against the control expectation. 9 prompt-injection tests reveal restricted policy snippets and 14 retrieval responses cite unapproved documents. The accepted rule is: critical abuse paths must have 0 data-exposure passes. The learner receives abuse-path test script, prompt-injection result log, retrieval access-control matrix, sensitive response examples, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the AI Security Abuse-Path Test Report. The learner follows a checklist to identify the visible issue, mark the risk level, and prepare the first evidence note.
Major concepts: prompt-injection pattern; retrieval access control; data exposure severity; red-team evidence; mitigation decision; expected 20,790 vs actual 18,820 tests; 9.5% variance interpretation; threshold rule: critical abuse paths must have 0 data-exposure passes; checklist-based issue recognition; basic threshold reading.
Root-cause focus: Use the checklist to identify whether the visible issue points to: weak system prompt boundary, retrieval permission leak, unsafe tool call, sensitive context exposure, or missing refusal test. Evidence must come from abuse-path test script, prompt-injection result log, retrieval access-control matrix.
Required data: abuse-path test script; prompt-injection result log; retrieval access-control matrix; sensitive response examples; security triage ticket; guided checklist; sample completed reference note
Artifact: AI Security Abuse-Path Test Report - Guided Evidence Note
Artifact structure: case summary; expected vs actual numbers; threshold rule; evidence table from abuse-path test script, prompt-injection result log, retrieval access-control matrix; root-cause hypothesis; decision/action; risk note; role handoff.
Evidence fields to assess: captures expected 20,790 and actual 18,820 tests; calculates or explains 9.5% variance; uses threshold rule correctly (critical abuse paths must have 0 data-exposure passes); cites at least three input documents; links evidence to root-cause hypothesis; states clear release/hold/correct/escalate decision.
AI support tips: Use AI as a coach to ask evidence-checking questions, explain unfamiliar terms, compare possible root causes, and improve clarity. Do not use AI to invent numbers or make the decision without citing the provided documents.',
  1,
  '8  hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech AI & Data Science - Responsible AI Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-071' LIMIT 1),
  'B.Tech AI & Data Science - Responsible AI Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech CSE - AI Security / Governance Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-071' LIMIT 1),
  'B.Tech CSE - AI Security / Governance Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MBA Business Analytics - AI Risk & Governance Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-071' LIMIT 1),
  'MBA Business Analytics - AI Risk & Governance Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: LL.B / Tech Law - Data Privacy & AI Governance Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-071' LIMIT 1),
  'LL.B / Tech Law - Data Privacy & AI Governance Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PG Certificate - Responsible AI, Risk & Compliance
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-071' LIMIT 1),
  'PG Certificate - Responsible AI, Risk & Compliance',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Review GenAI Feature Specification Evidence with a Guided Checklist
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Review GenAI Feature Specification Evidence with a Guided Checklist',
  'CRS-IND-CL-076',
  'By the end of this course, the learner can review guided evidence for GenAI Feature Specification by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact. Workplace problem: During a guided training simulation for support-agent copilot specification, a GenAI product feature shows unclear feature scope and missing acceptance criteria. The expected volume is 21,954 stories, but only 19,869 stories are usable, creating a 9.5% variance against the control expectation. 6 stories allow auto-send without human confirmation and 5 lack hallucination-control criteria. The accepted rule is: all high-priority stories need measurable acceptance criteria and risk notes. The learner receives product requirement brief, conversation journey map, acceptance criteria draft, risk-control checklist, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the GenAI Feature Specification Pack. The learner follows a checklist to identify the visible issue, mark the risk level, and prepare the first evidence note. Artifact: GenAI Feature Specification Pack - Guided Evidence Note.',
  '8  hours',
  'Active',
  'AI Product & GenAI Application Development',
  'technical',
  '["By the end of this course, the learner can review guided evidence for GenAI Feature Specification by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact","Learner demonstrates GenAI Feature Specification by interpreting real-looking numbers, comparing evidence from product requirement brief and conversation journey map, and producing a decision-ready artifact","Proves the learner can perform guided checklist work in GenAI Feature Specification with numeric evidence, workplace documents, and a reviewer-ready artifact. Status: Demo Ready"]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L1 Module: GenAI Feature Specification Workplace Mission
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-076' LIMIT 1),
  'L1 Module: GenAI Feature Specification Workplace Mission',
  'Industry requirement: Teams responsible for a GenAI product feature need learners who can use numeric evidence, threshold rules, and workplace documents to make reliable decisions during support-agent copilot specification, not only explain GenAI Feature Specification theoretically. Gap addressed: Academic learning may cover the concepts behind GenAI Feature Specification, but it usually does not make learners practice with product requirement brief, conversation journey map, acceptance criteria draft, numeric variance, threshold decisions, and role handoff artifacts. Trigger: supervisor flags the issue as a guided practice case: 19,869 of 21,954 stories passed the check, variance 9.5%, with signal ''unclear feature scope and missing acceptance criteria''.',
  1,
  '["Data & AI","AI Product & GenAI Application Development","GenAI Feature Specification","Primary: Functional. Supporting: Cognitive, Communication, AI/Digital","GenAI feature boundary","human-in-the-loop acceptance","hallucination control","prompt workflow requirement","success metric definition","expected 21,954 vs actual 19,869 stories","9.5% variance interpretation","threshold rule: all high-priority stories need measurable acceptance criteria and risk notes","checklist-based issue recognition","basic threshold reading"]'::jsonb,
  '["Engage: Learner receives a guided checklist case: support-agent copilot specification is at risk because only 19,869 of 21,954 stories passed the control and unclear feature scope and missing acceptance criteria is visible","Explore: Learner reviews product requirement brief, conversation journey map, acceptance criteria draft, risk-control checklist, stakeholder feedback notes, highlights the fields that prove the issue, and notes which values cross the threshold","Explain: Learner studies GenAI feature boundary, human-in-the-loop acceptance, hallucination control, prompt workflow requirement and learns how these concepts explain the business risk, not just the technical error","Express: Learner prepares the GenAI Feature Specification Pack with issue summary, numeric evidence, root-cause hypothesis, decision, and handoff note","Empower: Learner must recommend supervisor review with a clear checklist finding for support-agent copilot specification","Evolve: Learner adds one missed checklist question that would catch the same unclear feature scope and missing acceptance criteria earlier"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Scenario: GenAI Feature Specification Pack - Guided Evidence Note
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-076' LIMIT 1)
   AND title = 'L1 Module: GenAI Feature Specification Workplace Mission' LIMIT 1),
  'Workplace Scenario: GenAI Feature Specification Pack - Guided Evidence Note',
  'During a guided training simulation for support-agent copilot specification, a GenAI product feature shows unclear feature scope and missing acceptance criteria. The expected volume is 21,954 stories, but only 19,869 stories are usable, creating a 9.5% variance against the control expectation. 6 stories allow auto-send without human confirmation and 5 lack hallucination-control criteria. The accepted rule is: all high-priority stories need measurable acceptance criteria and risk notes. The learner receives product requirement brief, conversation journey map, acceptance criteria draft, risk-control checklist, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the GenAI Feature Specification Pack. The learner follows a checklist to identify the visible issue, mark the risk level, and prepare the first evidence note. Pressure points: Support-agent copilot specification is time-sensitive; variance is 9.5% against the rule; 6 stories allow auto-send without human confirmation and 5 lack hallucination-control criteria; learner has limited autonomy and must avoid over-escalating a simple issue.',
  'Course trigger: supervisor flags the issue as a guided practice case: 19,869 of 21,954 stories passed the check, variance 9.5%, with signal ''unclear feature scope and missing acceptance criteria''.
Problem statement: During a guided training simulation for support-agent copilot specification, a GenAI product feature shows unclear feature scope and missing acceptance criteria. The expected volume is 21,954 stories, but only 19,869 stories are usable, creating a 9.5% variance against the control expectation. 6 stories allow auto-send without human confirmation and 5 lack hallucination-control criteria. The accepted rule is: all high-priority stories need measurable acceptance criteria and risk notes. The learner receives product requirement brief, conversation journey map, acceptance criteria draft, risk-control checklist, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the GenAI Feature Specification Pack. The learner follows a checklist to identify the visible issue, mark the risk level, and prepare the first evidence note.
Major concepts: GenAI feature boundary; human-in-the-loop acceptance; hallucination control; prompt workflow requirement; success metric definition; expected 21,954 vs actual 19,869 stories; 9.5% variance interpretation; threshold rule: all high-priority stories need measurable acceptance criteria and risk notes; checklist-based issue recognition; basic threshold reading.
Root-cause focus: Use the checklist to identify whether the visible issue points to: unclear user workflow, missing acceptance criteria, unsafe automation boundary, hallucination-control gap, or unmeasured success metric. Evidence must come from product requirement brief, conversation journey map, acceptance criteria draft.
Required data: product requirement brief; conversation journey map; acceptance criteria draft; risk-control checklist; stakeholder feedback notes; guided checklist; sample completed reference note
Artifact: GenAI Feature Specification Pack - Guided Evidence Note
Artifact structure: case summary; expected vs actual numbers; threshold rule; evidence table from product requirement brief, conversation journey map, acceptance criteria draft; root-cause hypothesis; decision/action; risk note; role handoff.
Evidence fields to assess: captures expected 21,954 and actual 19,869 stories; calculates or explains 9.5% variance; uses threshold rule correctly (all high-priority stories need measurable acceptance criteria and risk notes); cites at least three input documents; links evidence to root-cause hypothesis; states clear release/hold/correct/escalate decision.
AI support tips: Use AI as a coach to ask evidence-checking questions, explain unfamiliar terms, compare possible root causes, and improve clarity. Do not use AI to invent numbers or make the decision without citing the provided documents.',
  1,
  '8  hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech CSE - AI & Machine Learning Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-076' LIMIT 1),
  'B.Tech CSE - AI & Machine Learning Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech AI & Data Science - ML Engineering Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-076' LIMIT 1),
  'B.Tech AI & Data Science - ML Engineering Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Tech AI / Machine Learning Engineering
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-076' LIMIT 1),
  'M.Tech AI / Machine Learning Engineering',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Sc AI & Machine Learning
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-076' LIMIT 1),
  'M.Sc AI & Machine Learning',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MCA - AI / ML Application Development
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-076' LIMIT 1),
  'MCA - AI / ML Application Development',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech CSE - AI Product Engineering Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-076' LIMIT 1),
  'B.Tech CSE - AI Product Engineering Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Review Human-AI Workflow Validation Evidence with a Guided Checklist
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Review Human-AI Workflow Validation Evidence with a Guided Checklist',
  'CRS-IND-CL-081',
  'By the end of this course, the learner can review guided evidence for Human-AI Workflow Validation by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact. Workplace problem: During a guided training simulation for claims processing copilot validation, a human-AI workflow shows user overrides and trust failures in assisted decisions. The expected volume is 28,890 suggestions, but only 26,300 suggestions are usable, creating a 9.0% variance against the control expectation. Adjusters reject 18% of suggestions and 23 comments cite missing evidence in the AI explanation. The accepted rule is: unexplained override rate above 12% requires workflow review. The learner receives user edit log, AI suggestion sample, override reason summary, workflow step map, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Human-AI Workflow Validation Report. The learner follows a checklist to identify the visible issue, mark the risk level, and prepare the first evidence note. Artifact: Human-AI Workflow Validation Report - Guided Evidence Note.',
  '8  hours',
  'Active',
  'AI Product & GenAI Application Development',
  'technical',
  '["By the end of this course, the learner can review guided evidence for Human-AI Workflow Validation by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact","Learner demonstrates Human-AI Workflow Validation by interpreting real-looking numbers, comparing evidence from user edit log and AI suggestion sample, and producing a decision-ready artifact","Proves the learner can perform guided checklist work in Human-AI Workflow Validation with numeric evidence, workplace documents, and a reviewer-ready artifact. Status: Demo Ready"]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L1 Module: Human-AI Workflow Validation Workplace Mission
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-081' LIMIT 1),
  'L1 Module: Human-AI Workflow Validation Workplace Mission',
  'Industry requirement: Teams responsible for a human-AI workflow need learners who can use numeric evidence, threshold rules, and workplace documents to make reliable decisions during claims processing copilot validation, not only explain Human-AI Workflow Validation theoretically. Gap addressed: Academic learning may cover the concepts behind Human-AI Workflow Validation, but it usually does not make learners practice with user edit log, AI suggestion sample, override reason summary, numeric variance, threshold decisions, and role handoff artifacts. Trigger: supervisor flags the issue as a guided practice case: 26,300 of 28,890 suggestions passed the check, variance 9.0%, with signal ''user overrides and trust failures in assisted decisions''.',
  1,
  '["Data & AI","AI Product & GenAI Application Development","Human-AI Workflow Validation","Primary: Functional. Supporting: Cognitive, Communication, AI/Digital","human override pattern","trust signal analysis","AI explanation quality","workflow friction point","human-in-the-loop validation","expected 28,890 vs actual 26,300 suggestions","9.0% variance interpretation","threshold rule: unexplained override rate above 12% requires workflow review","checklist-based issue recognition","basic threshold reading"]'::jsonb,
  '["Engage: Learner receives a guided checklist case: claims processing copilot validation is at risk because only 26,300 of 28,890 suggestions passed the control and user overrides and trust failures in assisted decisions is visible","Explore: Learner reviews user edit log, AI suggestion sample, override reason summary, workflow step map, trust feedback notes, highlights the fields that prove the issue, and notes which values cross the threshold","Explain: Learner studies human override pattern, trust signal analysis, AI explanation quality, workflow friction point and learns how these concepts explain the business risk, not just the technical error","Express: Learner prepares the Human-AI Workflow Validation Report with issue summary, numeric evidence, root-cause hypothesis, decision, and handoff note","Empower: Learner must recommend supervisor review with a clear checklist finding for claims processing copilot validation","Evolve: Learner adds one missed checklist question that would catch the same user overrides and trust failures in assisted decisions earlier"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Scenario: Human-AI Workflow Validation Report - Guided Evidence Note
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-081' LIMIT 1)
   AND title = 'L1 Module: Human-AI Workflow Validation Workplace Mission' LIMIT 1),
  'Workplace Scenario: Human-AI Workflow Validation Report - Guided Evidence Note',
  'During a guided training simulation for claims processing copilot validation, a human-AI workflow shows user overrides and trust failures in assisted decisions. The expected volume is 28,890 suggestions, but only 26,300 suggestions are usable, creating a 9.0% variance against the control expectation. Adjusters reject 18% of suggestions and 23 comments cite missing evidence in the AI explanation. The accepted rule is: unexplained override rate above 12% requires workflow review. The learner receives user edit log, AI suggestion sample, override reason summary, workflow step map, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Human-AI Workflow Validation Report. The learner follows a checklist to identify the visible issue, mark the risk level, and prepare the first evidence note. Pressure points: Claims processing copilot validation is time-sensitive; variance is 9.0% against the rule; adjusters reject 18% of suggestions and 23 comments cite missing evidence in the AI explanation; learner has limited autonomy and must avoid over-escalating a simple issue.',
  'Course trigger: supervisor flags the issue as a guided practice case: 26,300 of 28,890 suggestions passed the check, variance 9.0%, with signal ''user overrides and trust failures in assisted decisions''.
Problem statement: During a guided training simulation for claims processing copilot validation, a human-AI workflow shows user overrides and trust failures in assisted decisions. The expected volume is 28,890 suggestions, but only 26,300 suggestions are usable, creating a 9.0% variance against the control expectation. Adjusters reject 18% of suggestions and 23 comments cite missing evidence in the AI explanation. The accepted rule is: unexplained override rate above 12% requires workflow review. The learner receives user edit log, AI suggestion sample, override reason summary, workflow step map, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Human-AI Workflow Validation Report. The learner follows a checklist to identify the visible issue, mark the risk level, and prepare the first evidence note.
Major concepts: human override pattern; trust signal analysis; AI explanation quality; workflow friction point; human-in-the-loop validation; expected 28,890 vs actual 26,300 suggestions; 9.0% variance interpretation; threshold rule: unexplained override rate above 12% requires workflow review; checklist-based issue recognition; basic threshold reading.
Root-cause focus: Use the checklist to identify whether the visible issue points to: AI suggestion lacks evidence, workflow step mismatch, unclear confidence signal, bad handoff timing, or user trust gap. Evidence must come from user edit log, AI suggestion sample, override reason summary.
Required data: user edit log; AI suggestion sample; override reason summary; workflow step map; trust feedback notes; guided checklist; sample completed reference note
Artifact: Human-AI Workflow Validation Report - Guided Evidence Note
Artifact structure: case summary; expected vs actual numbers; threshold rule; evidence table from user edit log, AI suggestion sample, override reason summary; root-cause hypothesis; decision/action; risk note; role handoff.
Evidence fields to assess: captures expected 28,890 and actual 26,300 suggestions; calculates or explains 9.0% variance; uses threshold rule correctly (unexplained override rate above 12% requires workflow review); cites at least three input documents; links evidence to root-cause hypothesis; states clear release/hold/correct/escalate decision.
AI support tips: Use AI as a coach to ask evidence-checking questions, explain unfamiliar terms, compare possible root causes, and improve clarity. Do not use AI to invent numbers or make the decision without citing the provided documents.',
  1,
  '8  hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech CSE - AI & Machine Learning Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-081' LIMIT 1),
  'B.Tech CSE - AI & Machine Learning Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech AI & Data Science - ML Engineering Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-081' LIMIT 1),
  'B.Tech AI & Data Science - ML Engineering Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Tech AI / Machine Learning Engineering
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-081' LIMIT 1),
  'M.Tech AI / Machine Learning Engineering',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Sc AI & Machine Learning
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-081' LIMIT 1),
  'M.Sc AI & Machine Learning',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MCA - AI / ML Application Development
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-081' LIMIT 1),
  'MCA - AI / ML Application Development',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech CSE - AI Product Engineering Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-081' LIMIT 1),
  'B.Tech CSE - AI Product Engineering Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Review Applied Industry AI Configuration Evidence with a Guided Checklist
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Review Applied Industry AI Configuration Evidence with a Guided Checklist',
  'CRS-IND-CL-086',
  'By the end of this course, the learner can review guided evidence for Applied Industry AI Configuration by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact. Workplace problem: During a guided training simulation for healthcare triage model configuration, an applied industry AI solution shows vertical workflow mismatch and weak local configuration. The expected volume is 24,746 rules, but only 22,398 rules are usable, creating a 9.5% variance against the control expectation. Triage priority rules misclassify 7 high-risk cases and local escalation SLA is missing for night shifts. The accepted rule is: critical workflow rules must match domain protocol before pilot. The learner receives vertical workflow requirement, configuration rule sheet, domain protocol extract, pilot case sample, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Applied Industry AI Configuration Review. The learner follows a checklist to identify the visible issue, mark the risk level, and prepare the first evidence note. Artifact: Applied Industry AI Configuration Review - Guided Evidence Note.',
  '8  hours',
  'Active',
  'Applied Industry AI Solutions; Computer Vision & Multimodal AI Engineering',
  'technical',
  '["By the end of this course, the learner can review guided evidence for Applied Industry AI Configuration by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact","Learner demonstrates Applied Industry AI Configuration by interpreting real-looking numbers, comparing evidence from vertical workflow requirement and configuration rule sheet, and producing a decision-ready artifact","Proves the learner can perform guided checklist work in Applied Industry AI Configuration with numeric evidence, workplace documents, and a reviewer-ready artifact. Status: Demo Ready"]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L1 Module: Applied Industry AI Configuration Workplace Mission
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-086' LIMIT 1),
  'L1 Module: Applied Industry AI Configuration Workplace Mission',
  'Industry requirement: Teams responsible for an applied industry AI solution need learners who can use numeric evidence, threshold rules, and workplace documents to make reliable decisions during healthcare triage model configuration, not only explain Applied Industry AI Configuration theoretically. Gap addressed: Academic learning may cover the concepts behind Applied Industry AI Configuration, but it usually does not make learners practice with vertical workflow requirement, configuration rule sheet, domain protocol extract, numeric variance, threshold decisions, and role handoff artifacts. Trigger: supervisor flags the issue as a guided practice case: 22,398 of 24,746 rules passed the check, variance 9.5%, with signal ''vertical workflow mismatch and weak local configuration''.',
  1,
  '["Data & AI","Applied Industry AI Solutions","Computer Vision & Multimodal AI Engineering","Applied Industry AI Configuration","Primary: Evidence. Supporting: Technical, Functional, Domain","vertical AI configuration","domain protocol mapping","local workflow adaptation","pilot validation evidence","configuration risk","expected 24,746 vs actual 22,398 rules","9.5% variance interpretation","threshold rule: critical workflow rules must match domain protocol before pilot","checklist-based issue recognition","basic threshold reading"]'::jsonb,
  '["Engage: Learner receives a guided checklist case: healthcare triage model configuration is at risk because only 22,398 of 24,746 rules passed the control and vertical workflow mismatch and weak local configuration is visible","Explore: Learner reviews vertical workflow requirement, configuration rule sheet, domain protocol extract, pilot case sample, stakeholder validation note, highlights the fields that prove the issue, and notes which values cross the threshold","Explain: Learner studies vertical AI configuration, domain protocol mapping, local workflow adaptation, pilot validation evidence and learns how these concepts explain the business risk, not just the technical error","Express: Learner prepares the Applied Industry AI Configuration Review with issue summary, numeric evidence, root-cause hypothesis, decision, and handoff note","Empower: Learner must recommend supervisor review with a clear checklist finding for healthcare triage model configuration","Evolve: Learner adds one missed checklist question that would catch the same vertical workflow mismatch and weak local configuration earlier"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Scenario: Applied Industry AI Configuration Review - Guided Evidence Note
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-086' LIMIT 1)
   AND title = 'L1 Module: Applied Industry AI Configuration Workplace Mission' LIMIT 1),
  'Workplace Scenario: Applied Industry AI Configuration Review - Guided Evidence Note',
  'During a guided training simulation for healthcare triage model configuration, an applied industry AI solution shows vertical workflow mismatch and weak local configuration. The expected volume is 24,746 rules, but only 22,398 rules are usable, creating a 9.5% variance against the control expectation. Triage priority rules misclassify 7 high-risk cases and local escalation SLA is missing for night shifts. The accepted rule is: critical workflow rules must match domain protocol before pilot. The learner receives vertical workflow requirement, configuration rule sheet, domain protocol extract, pilot case sample, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Applied Industry AI Configuration Review. The learner follows a checklist to identify the visible issue, mark the risk level, and prepare the first evidence note. Pressure points: Healthcare triage model configuration is time-sensitive; variance is 9.5% against the rule; triage priority rules misclassify 7 high-risk cases and local escalation SLA is missing for night shifts; learner has limited autonomy and must avoid over-escalating a simple issue.',
  'Course trigger: supervisor flags the issue as a guided practice case: 22,398 of 24,746 rules passed the check, variance 9.5%, with signal ''vertical workflow mismatch and weak local configuration''.
Problem statement: During a guided training simulation for healthcare triage model configuration, an applied industry AI solution shows vertical workflow mismatch and weak local configuration. The expected volume is 24,746 rules, but only 22,398 rules are usable, creating a 9.5% variance against the control expectation. Triage priority rules misclassify 7 high-risk cases and local escalation SLA is missing for night shifts. The accepted rule is: critical workflow rules must match domain protocol before pilot. The learner receives vertical workflow requirement, configuration rule sheet, domain protocol extract, pilot case sample, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Applied Industry AI Configuration Review. The learner follows a checklist to identify the visible issue, mark the risk level, and prepare the first evidence note.
Major concepts: vertical AI configuration; domain protocol mapping; local workflow adaptation; pilot validation evidence; configuration risk; expected 24,746 vs actual 22,398 rules; 9.5% variance interpretation; threshold rule: critical workflow rules must match domain protocol before pilot; checklist-based issue recognition; basic threshold reading.
Root-cause focus: Use the checklist to identify whether the visible issue points to: wrong domain rule, local workflow mismatch, missing escalation path, insufficient pilot evidence, or unsupported edge case. Evidence must come from vertical workflow requirement, configuration rule sheet, domain protocol extract.
Required data: vertical workflow requirement; configuration rule sheet; domain protocol extract; pilot case sample; stakeholder validation note; guided checklist; sample completed reference note
Artifact: Applied Industry AI Configuration Review - Guided Evidence Note
Artifact structure: case summary; expected vs actual numbers; threshold rule; evidence table from vertical workflow requirement, configuration rule sheet, domain protocol extract; root-cause hypothesis; decision/action; risk note; role handoff.
Evidence fields to assess: captures expected 24,746 and actual 22,398 rules; calculates or explains 9.5% variance; uses threshold rule correctly (critical workflow rules must match domain protocol before pilot); cites at least three input documents; links evidence to root-cause hypothesis; states clear release/hold/correct/escalate decision.
AI support tips: Use AI as a coach to ask evidence-checking questions, explain unfamiliar terms, compare possible root causes, and improve clarity. Do not use AI to invent numbers or make the decision without citing the provided documents.',
  1,
  '8  hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech CSE - AI Product Engineering Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-086' LIMIT 1),
  'B.Tech CSE - AI Product Engineering Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech AI & Data Science - GenAI Application Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-086' LIMIT 1),
  'B.Tech AI & Data Science - GenAI Application Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MCA - AI Application Development Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-086' LIMIT 1),
  'MCA - AI Application Development Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MBA Product Management / Business Analytics - AI Product Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-086' LIMIT 1),
  'MBA Product Management / Business Analytics - AI Product Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PG Certificate - GenAI Product & Application Design
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-086' LIMIT 1),
  'PG Certificate - GenAI Product & Application Design',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech AI & Data Science - Applied Industry AI Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-086' LIMIT 1),
  'B.Tech AI & Data Science - Applied Industry AI Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Review Enterprise AI Adoption Roadmap Design Evidence with a Guided Checklist
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Review Enterprise AI Adoption Roadmap Design Evidence with a Guided Checklist',
  'CRS-IND-CL-091',
  'By the end of this course, the learner can review guided evidence for Enterprise AI Adoption Roadmap Design by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact. Workplace problem: During a guided training simulation for business-unit AI portfolio planning, an enterprise AI adoption roadmap shows unprioritized initiatives with unclear feasibility and risk. The expected volume is 26,072 initiatives, but only 23,592 initiatives are usable, creating a 9.5% variance against the control expectation. 11 initiatives have high claimed value but no data-owner confirmation or adoption dependency map. The accepted rule is: phase-one initiatives must show value, feasibility, data readiness, and risk control. The learner receives AI initiative inventory, value-feasibility scoring sheet, data readiness checklist, risk dependency map, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Enterprise AI Adoption Roadmap Decision Pack. The learner follows a checklist to identify the visible issue, mark the risk level, and prepare the first evidence note. Artifact: Enterprise AI Adoption Roadmap Decision Pack - Guided Evidence Note.',
  '8  hours',
  'Active',
  'AI Adoption, Transformation, and Stakeholder Enablement',
  'technical',
  '["By the end of this course, the learner can review guided evidence for Enterprise AI Adoption Roadmap Design by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact","Learner demonstrates Enterprise AI Adoption Roadmap Design by interpreting real-looking numbers, comparing evidence from AI initiative inventory and value-feasibility scoring sheet, and producing a decision-ready artifact","Proves the learner can perform guided checklist work in Enterprise AI Adoption Roadmap Design with numeric evidence, workplace documents, and a reviewer-ready artifact. Status: Demo Ready"]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L1 Module: Enterprise AI Adoption Roadmap Design Workplace Mission
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-091' LIMIT 1),
  'L1 Module: Enterprise AI Adoption Roadmap Design Workplace Mission',
  'Industry requirement: Teams responsible for an enterprise AI adoption roadmap need learners who can use numeric evidence, threshold rules, and workplace documents to make reliable decisions during business-unit AI portfolio planning, not only explain Enterprise AI Adoption Roadmap Design theoretically. Gap addressed: Academic learning may cover the concepts behind Enterprise AI Adoption Roadmap Design, but it usually does not make learners practice with AI initiative inventory, value-feasibility scoring sheet, data readiness checklist, numeric variance, threshold decisions, and role handoff artifacts. Trigger: supervisor flags the issue as a guided practice case: 23,592 of 26,072 initiatives passed the check, variance 9.5%, with signal ''unprioritized initiatives with unclear feasibility and risk''.',
  1,
  '["Data & AI","AI Consulting & Transformation","AI Adoption, Transformation, and Stakeholder Enablement","Enterprise AI Adoption Roadmap Design","Primary: Functional. Supporting: Cognitive, Communication, AI/Digital","AI use-case prioritization","value-feasibility scoring","data readiness dependency","adoption risk","roadmap phasing","expected 26,072 vs actual 23,592 initiatives","9.5% variance interpretation","threshold rule: phase-one initiatives must show value, feasibility, data readiness, and risk control","checklist-based issue recognition","basic threshold reading"]'::jsonb,
  '["Engage: Learner receives a guided checklist case: business-unit AI portfolio planning is at risk because only 23,592 of 26,072 initiatives passed the control and unprioritized initiatives with unclear feasibility and risk is visible","Explore: Learner reviews AI initiative inventory, value-feasibility scoring sheet, data readiness checklist, risk dependency map, stakeholder prioritization notes, highlights the fields that prove the issue, and notes which values cross the threshold","Explain: Learner studies AI use-case prioritization, value-feasibility scoring, data readiness dependency, adoption risk and learns how these concepts explain the business risk, not just the technical error","Express: Learner prepares the Enterprise AI Adoption Roadmap Decision Pack with issue summary, numeric evidence, root-cause hypothesis, decision, and handoff note","Empower: Learner must recommend supervisor review with a clear checklist finding for business-unit AI portfolio planning","Evolve: Learner adds one missed checklist question that would catch the same unprioritized initiatives with unclear feasibility and risk earlier"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Scenario: Enterprise AI Adoption Roadmap Decision Pack - Guided Evidence Note
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-091' LIMIT 1)
   AND title = 'L1 Module: Enterprise AI Adoption Roadmap Design Workplace Mission' LIMIT 1),
  'Workplace Scenario: Enterprise AI Adoption Roadmap Decision Pack - Guided Evidence Note',
  'During a guided training simulation for business-unit AI portfolio planning, an enterprise AI adoption roadmap shows unprioritized initiatives with unclear feasibility and risk. The expected volume is 26,072 initiatives, but only 23,592 initiatives are usable, creating a 9.5% variance against the control expectation. 11 initiatives have high claimed value but no data-owner confirmation or adoption dependency map. The accepted rule is: phase-one initiatives must show value, feasibility, data readiness, and risk control. The learner receives AI initiative inventory, value-feasibility scoring sheet, data readiness checklist, risk dependency map, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Enterprise AI Adoption Roadmap Decision Pack. The learner follows a checklist to identify the visible issue, mark the risk level, and prepare the first evidence note. Pressure points: Business-unit ai portfolio planning is time-sensitive; variance is 9.5% against the rule; 11 initiatives have high claimed value but no data-owner confirmation or adoption dependency map; learner has limited autonomy and must avoid over-escalating a simple issue.',
  'Course trigger: supervisor flags the issue as a guided practice case: 23,592 of 26,072 initiatives passed the check, variance 9.5%, with signal ''unprioritized initiatives with unclear feasibility and risk''.
Problem statement: During a guided training simulation for business-unit AI portfolio planning, an enterprise AI adoption roadmap shows unprioritized initiatives with unclear feasibility and risk. The expected volume is 26,072 initiatives, but only 23,592 initiatives are usable, creating a 9.5% variance against the control expectation. 11 initiatives have high claimed value but no data-owner confirmation or adoption dependency map. The accepted rule is: phase-one initiatives must show value, feasibility, data readiness, and risk control. The learner receives AI initiative inventory, value-feasibility scoring sheet, data readiness checklist, risk dependency map, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Enterprise AI Adoption Roadmap Decision Pack. The learner follows a checklist to identify the visible issue, mark the risk level, and prepare the first evidence note.
Major concepts: AI use-case prioritization; value-feasibility scoring; data readiness dependency; adoption risk; roadmap phasing; expected 26,072 vs actual 23,592 initiatives; 9.5% variance interpretation; threshold rule: phase-one initiatives must show value, feasibility, data readiness, and risk control; checklist-based issue recognition; basic threshold reading.
Root-cause focus: Use the checklist to identify whether the visible issue points to: inflated business value, weak data readiness, missing sponsor, unplanned change-management effort, or unmapped risk dependency. Evidence must come from AI initiative inventory, value-feasibility scoring sheet, data readiness checklist.
Required data: AI initiative inventory; value-feasibility scoring sheet; data readiness checklist; risk dependency map; stakeholder prioritization notes; guided checklist; sample completed reference note
Artifact: Enterprise AI Adoption Roadmap Decision Pack - Guided Evidence Note
Artifact structure: case summary; expected vs actual numbers; threshold rule; evidence table from AI initiative inventory, value-feasibility scoring sheet, data readiness checklist; root-cause hypothesis; decision/action; risk note; role handoff.
Evidence fields to assess: captures expected 26,072 and actual 23,592 initiatives; calculates or explains 9.5% variance; uses threshold rule correctly (phase-one initiatives must show value, feasibility, data readiness, and risk control); cites at least three input documents; links evidence to root-cause hypothesis; states clear release/hold/correct/escalate decision.
AI support tips: Use AI as a coach to ask evidence-checking questions, explain unfamiliar terms, compare possible root causes, and improve clarity. Do not use AI to invent numbers or make the decision without citing the provided documents.',
  1,
  '8  hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MBA Business Analytics - AI Transformation Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-091' LIMIT 1),
  'MBA Business Analytics - AI Transformation Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BBA Business Analytics - AI Adoption Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-091' LIMIT 1),
  'BBA Business Analytics - AI Adoption Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech AI & Data Science - AI Consulting Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-091' LIMIT 1),
  'B.Tech AI & Data Science - AI Consulting Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PG Certificate - AI Strategy & Transformation
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-091' LIMIT 1),
  'PG Certificate - AI Strategy & Transformation',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: Executive Program - AI Adoption & Change Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-091' LIMIT 1),
  'Executive Program - AI Adoption & Change Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Review AI Training Data Quality Control Evidence with a Guided Checklist
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Review AI Training Data Quality Control Evidence with a Guided Checklist',
  'CRS-IND-CL-096',
  'By the end of this course, the learner can review guided evidence for AI Training Data Quality Control by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact. Workplace problem: During a guided training simulation for dataset release quality gate, an AI training data labeling operation shows label disagreement and quality-control failure. The expected volume is 103,400 records, but only 95,630 records are usable, creating a 7.5% variance against the control expectation. Inter-annotator agreement is 84% for safety labels and 1,260 records have unresolved adjudication. The accepted rule is: critical label agreement must exceed 92% before release. The learner receives labeling guideline, annotator disagreement report, gold-standard sample, adjudication queue, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the AI Training Data Quality Control Pack. The learner follows a checklist to identify the visible issue, mark the risk level, and prepare the first evidence note. Artifact: AI Training Data Quality Control Pack - Guided Evidence Note.',
  '8  hours',
  'Active',
  'Synthetic Data, Labeling & Semantic Operations',
  'technical',
  '["By the end of this course, the learner can review guided evidence for AI Training Data Quality Control by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact","Learner demonstrates AI Training Data Quality Control by interpreting real-looking numbers, comparing evidence from labeling guideline and annotator disagreement report, and producing a decision-ready artifact","Proves the learner can perform guided checklist work in AI Training Data Quality Control with numeric evidence, workplace documents, and a reviewer-ready artifact. Status: Pilot Ready — Evidence Strengthening Needed"]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L1 Module: AI Training Data Quality Control Workplace Mission
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-096' LIMIT 1),
  'L1 Module: AI Training Data Quality Control Workplace Mission',
  'Industry requirement: Teams responsible for an AI training data labeling operation need learners who can use numeric evidence, threshold rules, and workplace documents to make reliable decisions during dataset release quality gate, not only explain AI Training Data Quality Control theoretically. Gap addressed: Academic learning may cover the concepts behind AI Training Data Quality Control, but it usually does not make learners practice with labeling guideline, annotator disagreement report, gold-standard sample, numeric variance, threshold decisions, and role handoff artifacts. Trigger: supervisor flags the issue as a guided practice case: 95,630 of 103,400 records passed the check, variance 7.5%, with signal ''label disagreement and quality-control failure''.',
  1,
  '["Data & AI","Synthetic Data, Labeling & Semantic Operations","AI Training Data Quality Control","Primary: Evidence. Supporting: Domain, Technical, AI/Digital","inter-annotator agreement","gold-standard validation","label adjudication","dataset release threshold","annotation quality audit","expected 103,400 vs actual 95,630 records","7.5% variance interpretation","threshold rule: critical label agreement must exceed 92% before release","checklist-based issue recognition","basic threshold reading"]'::jsonb,
  '["Engage: Learner receives a guided checklist case: dataset release quality gate is at risk because only 95,630 of 103,400 records passed the control and label disagreement and quality-control failure is visible","Explore: Learner reviews labeling guideline, annotator disagreement report, gold-standard sample, adjudication queue, dataset release checklist, highlights the fields that prove the issue, and notes which values cross the threshold","Explain: Learner studies inter-annotator agreement, gold-standard validation, label adjudication, dataset release threshold and learns how these concepts explain the business risk, not just the technical error","Express: Learner prepares the AI Training Data Quality Control Pack with issue summary, numeric evidence, root-cause hypothesis, decision, and handoff note","Empower: Learner must recommend supervisor review with a clear checklist finding for dataset release quality gate","Evolve: Learner adds one missed checklist question that would catch the same label disagreement and quality-control failure earlier"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Scenario: AI Training Data Quality Control Pack - Guided Evidence Note
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-096' LIMIT 1)
   AND title = 'L1 Module: AI Training Data Quality Control Workplace Mission' LIMIT 1),
  'Workplace Scenario: AI Training Data Quality Control Pack - Guided Evidence Note',
  'During a guided training simulation for dataset release quality gate, an AI training data labeling operation shows label disagreement and quality-control failure. The expected volume is 103,400 records, but only 95,630 records are usable, creating a 7.5% variance against the control expectation. Inter-annotator agreement is 84% for safety labels and 1,260 records have unresolved adjudication. The accepted rule is: critical label agreement must exceed 92% before release. The learner receives labeling guideline, annotator disagreement report, gold-standard sample, adjudication queue, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the AI Training Data Quality Control Pack. The learner follows a checklist to identify the visible issue, mark the risk level, and prepare the first evidence note. Pressure points: Dataset release quality gate is time-sensitive; variance is 7.5% against the rule; inter-annotator agreement is 84% for safety labels and 1,260 records have unresolved adjudication; learner has limited autonomy and must avoid over-escalating a simple issue.',
  'Course trigger: supervisor flags the issue as a guided practice case: 95,630 of 103,400 records passed the check, variance 7.5%, with signal ''label disagreement and quality-control failure''.
Problem statement: During a guided training simulation for dataset release quality gate, an AI training data labeling operation shows label disagreement and quality-control failure. The expected volume is 103,400 records, but only 95,630 records are usable, creating a 7.5% variance against the control expectation. Inter-annotator agreement is 84% for safety labels and 1,260 records have unresolved adjudication. The accepted rule is: critical label agreement must exceed 92% before release. The learner receives labeling guideline, annotator disagreement report, gold-standard sample, adjudication queue, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the AI Training Data Quality Control Pack. The learner follows a checklist to identify the visible issue, mark the risk level, and prepare the first evidence note.
Major concepts: inter-annotator agreement; gold-standard validation; label adjudication; dataset release threshold; annotation quality audit; expected 103,400 vs actual 95,630 records; 7.5% variance interpretation; threshold rule: critical label agreement must exceed 92% before release; checklist-based issue recognition; basic threshold reading.
Root-cause focus: Use the checklist to identify whether the visible issue points to: ambiguous labeling rule, annotator training gap, weak gold-standard sample, unresolved adjudication, or class imbalance. Evidence must come from labeling guideline, annotator disagreement report, gold-standard sample.
Required data: labeling guideline; annotator disagreement report; gold-standard sample; adjudication queue; dataset release checklist; guided checklist; sample completed reference note
Artifact: AI Training Data Quality Control Pack - Guided Evidence Note
Artifact structure: case summary; expected vs actual numbers; threshold rule; evidence table from labeling guideline, annotator disagreement report, gold-standard sample; root-cause hypothesis; decision/action; risk note; role handoff.
Evidence fields to assess: captures expected 103,400 and actual 95,630 records; calculates or explains 7.5% variance; uses threshold rule correctly (critical label agreement must exceed 92% before release); cites at least three input documents; links evidence to root-cause hypothesis; states clear release/hold/correct/escalate decision.
AI support tips: Use AI as a coach to ask evidence-checking questions, explain unfamiliar terms, compare possible root causes, and improve clarity. Do not use AI to invent numbers or make the decision without citing the provided documents.',
  1,
  '8  hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech CSE - Data Engineering Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-096' LIMIT 1),
  'B.Tech CSE - Data Engineering Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech AI & Data Science - Data Platform Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-096' LIMIT 1),
  'B.Tech AI & Data Science - Data Platform Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Data Science - Data Engineering Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-096' LIMIT 1),
  'B.Sc Data Science - Data Engineering Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MCA - Data Engineering / Cloud Data Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-096' LIMIT 1),
  'MCA - Data Engineering / Cloud Data Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Tech Data Engineering / Big Data Systems
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-096' LIMIT 1),
  'M.Tech Data Engineering / Big Data Systems',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Data Science - Data Operations Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-096' LIMIT 1),
  'B.Sc Data Science - Data Operations Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Review Semantic Knowledge Graph Validation Evidence with a Guided Checklist
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Review Semantic Knowledge Graph Validation Evidence with a Guided Checklist',
  'CRS-IND-CL-101',
  'By the end of this course, the learner can review guided evidence for Semantic Knowledge Graph Validation by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact. Workplace problem: During a guided training simulation for entity-relation validation before search rollout, a semantic knowledge graph shows duplicate entities and invalid relationships. The expected volume is 343,770 triples, but only 317,940 triples are usable, creating a 7.5% variance against the control expectation. 4,800 customer entities are duplicated and 2.9% of supplier-to-product edges violate ontology rules. The accepted rule is: critical relation errors must remain below 1% before rollout. The learner receives ontology rule sheet, entity resolution sample, relationship validation report, SPARQL error extract, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Semantic Knowledge Graph Validation Pack. The learner follows a checklist to identify the visible issue, mark the risk level, and prepare the first evidence note. Artifact: Semantic Knowledge Graph Validation Pack - Guided Evidence Note.',
  '8  hours',
  'Active',
  'Synthetic Data, Labeling & Semantic Operations',
  'technical',
  '["By the end of this course, the learner can review guided evidence for Semantic Knowledge Graph Validation by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact","Learner demonstrates Semantic Knowledge Graph Validation by interpreting real-looking numbers, comparing evidence from ontology rule sheet and entity resolution sample, and producing a decision-ready artifact","Proves the learner can perform guided checklist work in Semantic Knowledge Graph Validation with numeric evidence, workplace documents, and a reviewer-ready artifact. Status: Pilot Ready — Evidence Strengthening Needed"]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L1 Module: Semantic Knowledge Graph Validation Workplace Mission
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-101' LIMIT 1),
  'L1 Module: Semantic Knowledge Graph Validation Workplace Mission',
  'Industry requirement: Teams responsible for a semantic knowledge graph need learners who can use numeric evidence, threshold rules, and workplace documents to make reliable decisions during entity-relation validation before search rollout, not only explain Semantic Knowledge Graph Validation theoretically. Gap addressed: Academic learning may cover the concepts behind Semantic Knowledge Graph Validation, but it usually does not make learners practice with ontology rule sheet, entity resolution sample, relationship validation report, numeric variance, threshold decisions, and role handoff artifacts. Trigger: supervisor flags the issue as a guided practice case: 317,940 of 343,770 triples passed the check, variance 7.5%, with signal ''duplicate entities and invalid relationships''.',
  1,
  '["Data & AI","Synthetic Data, Labeling & Semantic Operations","Semantic Knowledge Graph Validation","Primary: Evidence. Supporting: Domain, Technical, AI/Digital","entity resolution","ontology constraint","relationship validation","graph quality rule","semantic search impact","expected 343,770 vs actual 317,940 triples","7.5% variance interpretation","threshold rule: critical relation errors must remain below 1% before rollout","checklist-based issue recognition","basic threshold reading"]'::jsonb,
  '["Engage: Learner receives a guided checklist case: entity-relation validation before search rollout is at risk because only 317,940 of 343,770 triples passed the control and duplicate entities and invalid relationships is visible","Explore: Learner reviews ontology rule sheet, entity resolution sample, relationship validation report, SPARQL error extract, search relevance issue log, highlights the fields that prove the issue, and notes which values cross the threshold","Explain: Learner studies entity resolution, ontology constraint, relationship validation, graph quality rule and learns how these concepts explain the business risk, not just the technical error","Express: Learner prepares the Semantic Knowledge Graph Validation Pack with issue summary, numeric evidence, root-cause hypothesis, decision, and handoff note","Empower: Learner must recommend supervisor review with a clear checklist finding for entity-relation validation before search rollout","Evolve: Learner adds one missed checklist question that would catch the same duplicate entities and invalid relationships earlier"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Scenario: Semantic Knowledge Graph Validation Pack - Guided Evidence Note
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-101' LIMIT 1)
   AND title = 'L1 Module: Semantic Knowledge Graph Validation Workplace Mission' LIMIT 1),
  'Workplace Scenario: Semantic Knowledge Graph Validation Pack - Guided Evidence Note',
  'During a guided training simulation for entity-relation validation before search rollout, a semantic knowledge graph shows duplicate entities and invalid relationships. The expected volume is 343,770 triples, but only 317,940 triples are usable, creating a 7.5% variance against the control expectation. 4,800 customer entities are duplicated and 2.9% of supplier-to-product edges violate ontology rules. The accepted rule is: critical relation errors must remain below 1% before rollout. The learner receives ontology rule sheet, entity resolution sample, relationship validation report, SPARQL error extract, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Semantic Knowledge Graph Validation Pack. The learner follows a checklist to identify the visible issue, mark the risk level, and prepare the first evidence note. Pressure points: Entity-relation validation before search rollout is time-sensitive; variance is 7.5% against the rule; 4,800 customer entities are duplicated and 2.9% of supplier-to-product edges violate ontology rules; learner has limited autonomy and must avoid over-escalating a simple issue.',
  'Course trigger: supervisor flags the issue as a guided practice case: 317,940 of 343,770 triples passed the check, variance 7.5%, with signal ''duplicate entities and invalid relationships''.
Problem statement: During a guided training simulation for entity-relation validation before search rollout, a semantic knowledge graph shows duplicate entities and invalid relationships. The expected volume is 343,770 triples, but only 317,940 triples are usable, creating a 7.5% variance against the control expectation. 4,800 customer entities are duplicated and 2.9% of supplier-to-product edges violate ontology rules. The accepted rule is: critical relation errors must remain below 1% before rollout. The learner receives ontology rule sheet, entity resolution sample, relationship validation report, SPARQL error extract, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Semantic Knowledge Graph Validation Pack. The learner follows a checklist to identify the visible issue, mark the risk level, and prepare the first evidence note.
Major concepts: entity resolution; ontology constraint; relationship validation; graph quality rule; semantic search impact; expected 343,770 vs actual 317,940 triples; 7.5% variance interpretation; threshold rule: critical relation errors must remain below 1% before rollout; checklist-based issue recognition; basic threshold reading.
Root-cause focus: Use the checklist to identify whether the visible issue points to: entity duplication, wrong relationship type, ontology constraint violation, stale source mapping, or weak synonym handling. Evidence must come from ontology rule sheet, entity resolution sample, relationship validation report.
Required data: ontology rule sheet; entity resolution sample; relationship validation report; SPARQL error extract; search relevance issue log; guided checklist; sample completed reference note
Artifact: Semantic Knowledge Graph Validation Pack - Guided Evidence Note
Artifact structure: case summary; expected vs actual numbers; threshold rule; evidence table from ontology rule sheet, entity resolution sample, relationship validation report; root-cause hypothesis; decision/action; risk note; role handoff.
Evidence fields to assess: captures expected 343,770 and actual 317,940 triples; calculates or explains 7.5% variance; uses threshold rule correctly (critical relation errors must remain below 1% before rollout); cites at least three input documents; links evidence to root-cause hypothesis; states clear release/hold/correct/escalate decision.
AI support tips: Use AI as a coach to ask evidence-checking questions, explain unfamiliar terms, compare possible root causes, and improve clarity. Do not use AI to invent numbers or make the decision without citing the provided documents.',
  1,
  '8  hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech CSE - Data Engineering Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-101' LIMIT 1),
  'B.Tech CSE - Data Engineering Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech AI & Data Science - Data Platform Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-101' LIMIT 1),
  'B.Tech AI & Data Science - Data Platform Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Data Science - Data Engineering Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-101' LIMIT 1),
  'B.Sc Data Science - Data Engineering Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MCA - Data Engineering / Cloud Data Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-101' LIMIT 1),
  'MCA - Data Engineering / Cloud Data Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Tech Data Engineering / Big Data Systems
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-101' LIMIT 1),
  'M.Tech Data Engineering / Big Data Systems',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Data Science - Data Operations Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-101' LIMIT 1),
  'B.Sc Data Science - Data Operations Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Complete a Routine Lakehouse Pipeline Controls Workplace Case
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Complete a Routine Lakehouse Pipeline Controls Workplace Case',
  'CRS-IND-CL-002',
  'By the end of this course, the learner can complete a routine case in Lakehouse Pipeline Controls by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact. Workplace problem: A routine work request arrives for daily revenue dashboard refresh, and a retail sales lakehouse pipeline shows bronze-to-silver load variance and a schema warning. The expected volume is 101,570 records, but only 91,240 records are usable, creating a 10.2% variance against the control expectation. The `discount_code` field is missing in 14% of rows and `customer_region` has a new APAC-South value. The accepted rule is: record variance must stay under 1.5%. The learner receives pipeline failure log, source file profile, schema comparison sheet, record completeness report, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Lakehouse Pipeline Control Exception Note. The learner must independently reconcile the supplied records, decide whether the case is acceptable, and document the action. Artifact: Lakehouse Pipeline Control Exception Note - Routine Work Record.',
  '10 hours',
  'Active',
  'Data Engineering & Lakehouse Operations',
  'technical',
  '["By the end of this course, the learner can complete a routine case in Lakehouse Pipeline Controls by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact","Learner demonstrates Lakehouse Pipeline Controls by interpreting real-looking numbers, comparing evidence from pipeline failure log and source file profile, and producing a decision-ready artifact","Proves the learner can perform routine execution work in Lakehouse Pipeline Controls with numeric evidence, workplace documents, and a reviewer-ready artifact. Status: Demo Ready"]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L2 Module: Lakehouse Pipeline Controls Workplace Mission
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-002' LIMIT 1),
  'L2 Module: Lakehouse Pipeline Controls Workplace Mission',
  'Industry requirement: Teams responsible for a retail sales lakehouse pipeline need learners who can use numeric evidence, threshold rules, and workplace documents to make reliable decisions during daily revenue dashboard refresh, not only explain Lakehouse Pipeline Controls theoretically. Gap addressed: Academic learning may cover the concepts behind Lakehouse Pipeline Controls, but it usually does not make learners practice with pipeline failure log, source file profile, schema comparison sheet, numeric variance, threshold decisions, and role handoff artifacts. Trigger: team assigns the learner a routine work request before sign-off: 91,240 of 101,570 records passed the check, variance 10.2%, with signal ''bronze-to-silver load variance and a schema warning''.',
  1,
  '["Data & AI","Data Platform Engineering","Data Engineering & Lakehouse Operations","Lakehouse Pipeline Controls","Primary: Evidence. Supporting: Technical, Functional, Domain","expected vs actual record-count variance","schema version mismatch","source-to-bronze reconciliation","bronze-to-silver completeness check","dashboard release hold decision","expected 101,570 vs actual 91,240 records","10.2% variance interpretation","threshold rule: record variance must stay under 1.5%","routine evidence reconciliation","release/hold action logic"]'::jsonb,
  '["Engage: Learner receives a routine execution case: daily revenue dashboard refresh is at risk because only 91,240 of 101,570 records passed the control and bronze-to-silver load variance and a schema warning is visible","Explore: Learner reviews pipeline failure log, source file profile, schema comparison sheet, record completeness report, dashboard refresh note, highlights the fields that prove the issue, and notes which values cross the threshold","Explain: Learner studies expected vs actual record-count variance, schema version mismatch, source-to-bronze reconciliation, bronze-to-silver completeness check and learns how these concepts explain the business risk, not just the technical error","Express: Learner prepares the Lakehouse Pipeline Control Exception Note with issue summary, numeric evidence, root-cause hypothesis, decision, and handoff note","Empower: Learner must select release, hold, correct, or escalate with evidence for daily revenue dashboard refresh","Evolve: Learner records one improvement to make routine daily revenue dashboard refresh handling faster and clearer"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Scenario: Lakehouse Pipeline Control Exception Note - Routine Work Record
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-002' LIMIT 1)
   AND title = 'L2 Module: Lakehouse Pipeline Controls Workplace Mission' LIMIT 1),
  'Workplace Scenario: Lakehouse Pipeline Control Exception Note - Routine Work Record',
  'A routine work request arrives for daily revenue dashboard refresh, and a retail sales lakehouse pipeline shows bronze-to-silver load variance and a schema warning. The expected volume is 101,570 records, but only 91,240 records are usable, creating a 10.2% variance against the control expectation. The `discount_code` field is missing in 14% of rows and `customer_region` has a new APAC-South value. The accepted rule is: record variance must stay under 1.5%. The learner receives pipeline failure log, source file profile, schema comparison sheet, record completeness report, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Lakehouse Pipeline Control Exception Note. The learner must independently reconcile the supplied records, decide whether the case is acceptable, and document the action. Pressure points: Daily revenue dashboard refresh is time-sensitive; variance is 10.2% against the rule; the `discount_code` field is missing in 14% of rows and `customer_region` has a new APAC-South value; routine sign-off is waiting and a wrong decision can block downstream users.',
  'Course trigger: team assigns the learner a routine work request before sign-off: 91,240 of 101,570 records passed the check, variance 10.2%, with signal ''bronze-to-silver load variance and a schema warning''.
Problem statement: A routine work request arrives for daily revenue dashboard refresh, and a retail sales lakehouse pipeline shows bronze-to-silver load variance and a schema warning. The expected volume is 101,570 records, but only 91,240 records are usable, creating a 10.2% variance against the control expectation. The `discount_code` field is missing in 14% of rows and `customer_region` has a new APAC-South value. The accepted rule is: record variance must stay under 1.5%. The learner receives pipeline failure log, source file profile, schema comparison sheet, record completeness report, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Lakehouse Pipeline Control Exception Note. The learner must independently reconcile the supplied records, decide whether the case is acceptable, and document the action.
Major concepts: expected vs actual record-count variance; schema version mismatch; source-to-bronze reconciliation; bronze-to-silver completeness check; dashboard release hold decision; expected 101,570 vs actual 91,240 records; 10.2% variance interpretation; threshold rule: record variance must stay under 1.5%; routine evidence reconciliation; release/hold action logic.
Root-cause focus: Compare the routine evidence to decide whether the likely cause is: source extract cut-off, schema drift, failed ingestion batch, transformation join loss, or late-arriving partition. Evidence must come from pipeline failure log, source file profile, schema comparison sheet.
Required data: pipeline failure log; source file profile; schema comparison sheet; record completeness report; dashboard refresh note; work request brief; approval deadline note
Artifact: Lakehouse Pipeline Control Exception Note - Routine Work Record
Artifact structure: case summary; expected vs actual numbers; threshold rule; evidence table from pipeline failure log, source file profile, schema comparison sheet; root-cause hypothesis; decision/action; risk note; role handoff.
Evidence fields to assess: captures expected 101,570 and actual 91,240 records; calculates or explains 10.2% variance; uses threshold rule correctly (record variance must stay under 1.5%); cites at least three input documents; links evidence to root-cause hypothesis; states clear release/hold/correct/escalate decision.
AI support tips: Use AI as a coach to ask evidence-checking questions, explain unfamiliar terms, compare possible root causes, and improve clarity. Do not use AI to invent numbers or make the decision without citing the provided documents.',
  1,
  '10 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech CSE - Data Engineering Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-002' LIMIT 1),
  'B.Tech CSE - Data Engineering Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech AI & Data Science - Data Platform Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-002' LIMIT 1),
  'B.Tech AI & Data Science - Data Platform Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Data Science - Data Engineering Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-002' LIMIT 1),
  'B.Sc Data Science - Data Engineering Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MCA - Data Engineering / Cloud Data Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-002' LIMIT 1),
  'MCA - Data Engineering / Cloud Data Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Tech Data Engineering / Big Data Systems
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-002' LIMIT 1),
  'M.Tech Data Engineering / Big Data Systems',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Complete a Routine Gold Data Product Publishing Workplace Case
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Complete a Routine Gold Data Product Publishing Workplace Case',
  'CRS-IND-CL-007',
  'By the end of this course, the learner can complete a routine case in Gold Data Product Publishing by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact. Workplace problem: A routine work request arrives for monthly margin KPI publication, and a finance gold data product shows metric grain mismatch and duplicate account totals. The expected volume is 49,740 rows, but only 47,080 rows are usable, creating a 5.3% variance against the control expectation. The `net_margin_pct` measure differs by 2.8 points between semantic layer and finance workbook. The accepted rule is: KPI variance must be below 0.5% before certification. The learner receives KPI definition note, gold table grain mapping, semantic measure validation sheet, finance reconciliation extract, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Gold Data Product Publishing Sign-off Pack. The learner must independently reconcile the supplied records, decide whether the case is acceptable, and document the action. Artifact: Gold Data Product Publishing Sign-off Pack - Routine Work Record.',
  '10 hours',
  'Active',
  'Data Engineering & Lakehouse Operations',
  'technical',
  '["By the end of this course, the learner can complete a routine case in Gold Data Product Publishing by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact","Learner demonstrates Gold Data Product Publishing by interpreting real-looking numbers, comparing evidence from KPI definition note and gold table grain mapping, and producing a decision-ready artifact","Proves the learner can perform routine execution work in Gold Data Product Publishing with numeric evidence, workplace documents, and a reviewer-ready artifact. Status: Demo Ready"]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L2 Module: Gold Data Product Publishing Workplace Mission
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-007' LIMIT 1),
  'L2 Module: Gold Data Product Publishing Workplace Mission',
  'Industry requirement: Teams responsible for a finance gold data product need learners who can use numeric evidence, threshold rules, and workplace documents to make reliable decisions during monthly margin KPI publication, not only explain Gold Data Product Publishing theoretically. Gap addressed: Academic learning may cover the concepts behind Gold Data Product Publishing, but it usually does not make learners practice with KPI definition note, gold table grain mapping, semantic measure validation sheet, numeric variance, threshold decisions, and role handoff artifacts. Trigger: team assigns the learner a routine work request before sign-off: 47,080 of 49,740 rows passed the check, variance 5.3%, with signal ''metric grain mismatch and duplicate account totals''.',
  1,
  '["Data & AI","Data Platform Engineering","Data Engineering & Lakehouse Operations","Gold Data Product Publishing","Primary: Evidence. Supporting: Technical, Functional, Domain","metric grain control","semantic measure validation","consumer-ready data product certification","KPI definition sign-off","duplicate total reconciliation","expected 49,740 vs actual 47,080 rows","5.3% variance interpretation","threshold rule: KPI variance must be below 0.5% before certification","routine evidence reconciliation","release/hold action logic"]'::jsonb,
  '["Engage: Learner receives a routine execution case: monthly margin KPI publication is at risk because only 47,080 of 49,740 rows passed the control and metric grain mismatch and duplicate account totals is visible","Explore: Learner reviews KPI definition note, gold table grain mapping, semantic measure validation sheet, finance reconciliation extract, consumer sign-off request, highlights the fields that prove the issue, and notes which values cross the threshold","Explain: Learner studies metric grain control, semantic measure validation, consumer-ready data product certification, KPI definition sign-off and learns how these concepts explain the business risk, not just the technical error","Express: Learner prepares the Gold Data Product Publishing Sign-off Pack with issue summary, numeric evidence, root-cause hypothesis, decision, and handoff note","Empower: Learner must select release, hold, correct, or escalate with evidence for monthly margin KPI publication","Evolve: Learner records one improvement to make routine monthly margin KPI publication handling faster and clearer"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Scenario: Gold Data Product Publishing Sign-off Pack - Routine Work Record
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-007' LIMIT 1)
   AND title = 'L2 Module: Gold Data Product Publishing Workplace Mission' LIMIT 1),
  'Workplace Scenario: Gold Data Product Publishing Sign-off Pack - Routine Work Record',
  'A routine work request arrives for monthly margin KPI publication, and a finance gold data product shows metric grain mismatch and duplicate account totals. The expected volume is 49,740 rows, but only 47,080 rows are usable, creating a 5.3% variance against the control expectation. The `net_margin_pct` measure differs by 2.8 points between semantic layer and finance workbook. The accepted rule is: KPI variance must be below 0.5% before certification. The learner receives KPI definition note, gold table grain mapping, semantic measure validation sheet, finance reconciliation extract, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Gold Data Product Publishing Sign-off Pack. The learner must independently reconcile the supplied records, decide whether the case is acceptable, and document the action. Pressure points: Monthly margin kpi publication is time-sensitive; variance is 5.3% against the rule; the `net_margin_pct` measure differs by 2.8 points between semantic layer and finance workbook; routine sign-off is waiting and a wrong decision can block downstream users.',
  'Course trigger: team assigns the learner a routine work request before sign-off: 47,080 of 49,740 rows passed the check, variance 5.3%, with signal ''metric grain mismatch and duplicate account totals''.
Problem statement: A routine work request arrives for monthly margin KPI publication, and a finance gold data product shows metric grain mismatch and duplicate account totals. The expected volume is 49,740 rows, but only 47,080 rows are usable, creating a 5.3% variance against the control expectation. The `net_margin_pct` measure differs by 2.8 points between semantic layer and finance workbook. The accepted rule is: KPI variance must be below 0.5% before certification. The learner receives KPI definition note, gold table grain mapping, semantic measure validation sheet, finance reconciliation extract, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Gold Data Product Publishing Sign-off Pack. The learner must independently reconcile the supplied records, decide whether the case is acceptable, and document the action.
Major concepts: metric grain control; semantic measure validation; consumer-ready data product certification; KPI definition sign-off; duplicate total reconciliation; expected 49,740 vs actual 47,080 rows; 5.3% variance interpretation; threshold rule: KPI variance must be below 0.5% before certification; routine evidence reconciliation; release/hold action logic.
Root-cause focus: Compare the routine evidence to decide whether the likely cause is: wrong aggregation grain, duplicate account mapping, stale semantic measure, incorrect filter context, or unapproved KPI definition. Evidence must come from KPI definition note, gold table grain mapping, semantic measure validation sheet.
Required data: KPI definition note; gold table grain mapping; semantic measure validation sheet; finance reconciliation extract; consumer sign-off request; work request brief; approval deadline note
Artifact: Gold Data Product Publishing Sign-off Pack - Routine Work Record
Artifact structure: case summary; expected vs actual numbers; threshold rule; evidence table from KPI definition note, gold table grain mapping, semantic measure validation sheet; root-cause hypothesis; decision/action; risk note; role handoff.
Evidence fields to assess: captures expected 49,740 and actual 47,080 rows; calculates or explains 5.3% variance; uses threshold rule correctly (KPI variance must be below 0.5% before certification); cites at least three input documents; links evidence to root-cause hypothesis; states clear release/hold/correct/escalate decision.
AI support tips: Use AI as a coach to ask evidence-checking questions, explain unfamiliar terms, compare possible root causes, and improve clarity. Do not use AI to invent numbers or make the decision without citing the provided documents.',
  1,
  '10 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech CSE - Data Engineering Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-007' LIMIT 1),
  'B.Tech CSE - Data Engineering Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech AI & Data Science - Data Platform Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-007' LIMIT 1),
  'B.Tech AI & Data Science - Data Platform Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Data Science - Data Engineering Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-007' LIMIT 1),
  'B.Sc Data Science - Data Engineering Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MCA - Data Engineering / Cloud Data Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-007' LIMIT 1),
  'MCA - Data Engineering / Cloud Data Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Tech Data Engineering / Big Data Systems
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-007' LIMIT 1),
  'M.Tech Data Engineering / Big Data Systems',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Complete a Routine Streaming Contract Stabilization Workplace Case
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Complete a Routine Streaming Contract Stabilization Workplace Case',
  'CRS-IND-CL-012',
  'By the end of this course, the learner can complete a routine case in Streaming Contract Stabilization by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact. Workplace problem: A routine work request arrives for real-time personalization feed, and a streaming customer-event contract shows stream contract violations and late event spikes. The expected volume is 188,310 events, but only 171,045 events are usable, creating a 9.2% variance against the control expectation. 7.6% of events arrive after the 5-minute SLA and the `session_id` type changed from string to integer. The accepted rule is: contract violations must remain below 0.8%. The learner receives stream contract spec, Kafka topic error log, late-arrival summary, schema registry diff, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Streaming Contract Stabilization Report. The learner must independently reconcile the supplied records, decide whether the case is acceptable, and document the action. Artifact: Streaming Contract Stabilization Report - Routine Work Record.',
  '10 hours',
  'Active',
  'Data Engineering & Lakehouse Operations',
  'technical',
  '["By the end of this course, the learner can complete a routine case in Streaming Contract Stabilization by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact","Learner demonstrates Streaming Contract Stabilization by interpreting real-looking numbers, comparing evidence from stream contract spec and Kafka topic error log, and producing a decision-ready artifact","Proves the learner can perform routine execution work in Streaming Contract Stabilization with numeric evidence, workplace documents, and a reviewer-ready artifact. Status: Demo Ready"]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L2 Module: Streaming Contract Stabilization Workplace Mission
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-012' LIMIT 1),
  'L2 Module: Streaming Contract Stabilization Workplace Mission',
  'Industry requirement: Teams responsible for a streaming customer-event contract need learners who can use numeric evidence, threshold rules, and workplace documents to make reliable decisions during real-time personalization feed, not only explain Streaming Contract Stabilization theoretically. Gap addressed: Academic learning may cover the concepts behind Streaming Contract Stabilization, but it usually does not make learners practice with stream contract spec, Kafka topic error log, late-arrival summary, numeric variance, threshold decisions, and role handoff artifacts. Trigger: team assigns the learner a routine work request before sign-off: 171,045 of 188,310 events passed the check, variance 9.2%, with signal ''stream contract violations and late event spikes''.',
  1,
  '["Data & AI","Data Platform Engineering","Data Engineering & Lakehouse Operations","Streaming Contract Stabilization","Primary: Evidence. Supporting: Technical, Functional, Domain","stream schema contract","late-arrival window","consumer compatibility","event-time vs processing-time","contract test evidence","expected 188,310 vs actual 171,045 events","9.2% variance interpretation","threshold rule: contract violations must remain below 0.8%","routine evidence reconciliation","release/hold action logic"]'::jsonb,
  '["Engage: Learner receives a routine execution case: real-time personalization feed is at risk because only 171,045 of 188,310 events passed the control and stream contract violations and late event spikes is visible","Explore: Learner reviews stream contract spec, Kafka topic error log, late-arrival summary, schema registry diff, consumer failure ticket, highlights the fields that prove the issue, and notes which values cross the threshold","Explain: Learner studies stream schema contract, late-arrival window, consumer compatibility, event-time vs processing-time and learns how these concepts explain the business risk, not just the technical error","Express: Learner prepares the Streaming Contract Stabilization Report with issue summary, numeric evidence, root-cause hypothesis, decision, and handoff note","Empower: Learner must select release, hold, correct, or escalate with evidence for real-time personalization feed","Evolve: Learner records one improvement to make routine real-time personalization feed handling faster and clearer"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Scenario: Streaming Contract Stabilization Report - Routine Work Record
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-012' LIMIT 1)
   AND title = 'L2 Module: Streaming Contract Stabilization Workplace Mission' LIMIT 1),
  'Workplace Scenario: Streaming Contract Stabilization Report - Routine Work Record',
  'A routine work request arrives for real-time personalization feed, and a streaming customer-event contract shows stream contract violations and late event spikes. The expected volume is 188,310 events, but only 171,045 events are usable, creating a 9.2% variance against the control expectation. 7.6% of events arrive after the 5-minute SLA and the `session_id` type changed from string to integer. The accepted rule is: contract violations must remain below 0.8%. The learner receives stream contract spec, Kafka topic error log, late-arrival summary, schema registry diff, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Streaming Contract Stabilization Report. The learner must independently reconcile the supplied records, decide whether the case is acceptable, and document the action. Pressure points: Real-time personalization feed is time-sensitive; variance is 9.2% against the rule; 7.6% of events arrive after the 5-minute SLA and the `session_id` type changed from string to integer; routine sign-off is waiting and a wrong decision can block downstream users.',
  'Course trigger: team assigns the learner a routine work request before sign-off: 171,045 of 188,310 events passed the check, variance 9.2%, with signal ''stream contract violations and late event spikes''.
Problem statement: A routine work request arrives for real-time personalization feed, and a streaming customer-event contract shows stream contract violations and late event spikes. The expected volume is 188,310 events, but only 171,045 events are usable, creating a 9.2% variance against the control expectation. 7.6% of events arrive after the 5-minute SLA and the `session_id` type changed from string to integer. The accepted rule is: contract violations must remain below 0.8%. The learner receives stream contract spec, Kafka topic error log, late-arrival summary, schema registry diff, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Streaming Contract Stabilization Report. The learner must independently reconcile the supplied records, decide whether the case is acceptable, and document the action.
Major concepts: stream schema contract; late-arrival window; consumer compatibility; event-time vs processing-time; contract test evidence; expected 188,310 vs actual 171,045 events; 9.2% variance interpretation; threshold rule: contract violations must remain below 0.8%; routine evidence reconciliation; release/hold action logic.
Root-cause focus: Compare the routine evidence to decide whether the likely cause is: producer schema change, late event window, consumer deserialization failure, partition lag, or missing contract test. Evidence must come from stream contract spec, Kafka topic error log, late-arrival summary.
Required data: stream contract spec; Kafka topic error log; late-arrival summary; schema registry diff; consumer failure ticket; work request brief; approval deadline note
Artifact: Streaming Contract Stabilization Report - Routine Work Record
Artifact structure: case summary; expected vs actual numbers; threshold rule; evidence table from stream contract spec, Kafka topic error log, late-arrival summary; root-cause hypothesis; decision/action; risk note; role handoff.
Evidence fields to assess: captures expected 188,310 and actual 171,045 events; calculates or explains 9.2% variance; uses threshold rule correctly (contract violations must remain below 0.8%); cites at least three input documents; links evidence to root-cause hypothesis; states clear release/hold/correct/escalate decision.
AI support tips: Use AI as a coach to ask evidence-checking questions, explain unfamiliar terms, compare possible root causes, and improve clarity. Do not use AI to invent numbers or make the decision without citing the provided documents.',
  1,
  '10 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech CSE - Data Engineering Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-012' LIMIT 1),
  'B.Tech CSE - Data Engineering Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech AI & Data Science - Data Platform Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-012' LIMIT 1),
  'B.Tech AI & Data Science - Data Platform Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Data Science - Data Engineering Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-012' LIMIT 1),
  'B.Sc Data Science - Data Engineering Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MCA - Data Engineering / Cloud Data Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-012' LIMIT 1),
  'MCA - Data Engineering / Cloud Data Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Tech Data Engineering / Big Data Systems
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-012' LIMIT 1),
  'M.Tech Data Engineering / Big Data Systems',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Complete a Routine BI Asset Certification Workplace Case
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Complete a Routine BI Asset Certification Workplace Case',
  'CRS-IND-CL-017',
  'By the end of this course, the learner can complete a routine case in BI Asset Certification by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact. Workplace problem: A routine work request arrives for executive sales performance review, and a certified BI reporting asset shows uncertified dataset use and mismatched dashboard totals. The expected volume is 9,734 tiles, but only 9,207 tiles are usable, creating a 5.4% variance against the control expectation. Regional sales total is 6.4% higher in the dashboard than the approved semantic model. The accepted rule is: 100% of executive tiles must use certified sources. The learner receives dashboard dependency list, certified dataset register, semantic model measure sheet, data refresh history, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the BI Asset Certification Review Sheet. The learner must independently reconcile the supplied records, decide whether the case is acceptable, and document the action. Artifact: BI Asset Certification Review Sheet - Routine Work Record.',
  '10 hours',
  'Active',
  'BI & Reporting Analytics',
  'technical',
  '["By the end of this course, the learner can complete a routine case in BI Asset Certification by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact","Learner demonstrates BI Asset Certification by interpreting real-looking numbers, comparing evidence from dashboard dependency list and certified dataset register, and producing a decision-ready artifact","Proves the learner can perform routine execution work in BI Asset Certification with numeric evidence, workplace documents, and a reviewer-ready artifact. Status: Demo Ready"]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L2 Module: BI Asset Certification Workplace Mission
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-017' LIMIT 1),
  'L2 Module: BI Asset Certification Workplace Mission',
  'Industry requirement: Teams responsible for a certified BI reporting asset need learners who can use numeric evidence, threshold rules, and workplace documents to make reliable decisions during executive sales performance review, not only explain BI Asset Certification theoretically. Gap addressed: Academic learning may cover the concepts behind BI Asset Certification, but it usually does not make learners practice with dashboard dependency list, certified dataset register, semantic model measure sheet, numeric variance, threshold decisions, and role handoff artifacts. Trigger: team assigns the learner a routine work request before sign-off: 9,207 of 9,734 tiles passed the check, variance 5.4%, with signal ''uncertified dataset use and mismatched dashboard totals''.',
  1,
  '["Data & AI","BI & Reporting Analytics","BI Asset Certification","Primary: Evidence. Supporting: Technical, Functional, Domain","certified BI asset control","semantic model dependency","measure lineage","refresh reliability","executive reporting risk","expected 9,734 vs actual 9,207 tiles","5.4% variance interpretation","threshold rule: 100% of executive tiles must use certified sources","routine evidence reconciliation","release/hold action logic"]'::jsonb,
  '["Engage: Learner receives a routine execution case: executive sales performance review is at risk because only 9,207 of 9,734 tiles passed the control and uncertified dataset use and mismatched dashboard totals is visible","Explore: Learner reviews dashboard dependency list, certified dataset register, semantic model measure sheet, data refresh history, business owner approval note, highlights the fields that prove the issue, and notes which values cross the threshold","Explain: Learner studies certified BI asset control, semantic model dependency, measure lineage, refresh reliability and learns how these concepts explain the business risk, not just the technical error","Express: Learner prepares the BI Asset Certification Review Sheet with issue summary, numeric evidence, root-cause hypothesis, decision, and handoff note","Empower: Learner must select release, hold, correct, or escalate with evidence for executive sales performance review","Evolve: Learner records one improvement to make routine executive sales performance review handling faster and clearer"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Scenario: BI Asset Certification Review Sheet - Routine Work Record
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-017' LIMIT 1)
   AND title = 'L2 Module: BI Asset Certification Workplace Mission' LIMIT 1),
  'Workplace Scenario: BI Asset Certification Review Sheet - Routine Work Record',
  'A routine work request arrives for executive sales performance review, and a certified BI reporting asset shows uncertified dataset use and mismatched dashboard totals. The expected volume is 9,734 tiles, but only 9,207 tiles are usable, creating a 5.4% variance against the control expectation. Regional sales total is 6.4% higher in the dashboard than the approved semantic model. The accepted rule is: 100% of executive tiles must use certified sources. The learner receives dashboard dependency list, certified dataset register, semantic model measure sheet, data refresh history, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the BI Asset Certification Review Sheet. The learner must independently reconcile the supplied records, decide whether the case is acceptable, and document the action. Pressure points: Executive sales performance review is time-sensitive; variance is 5.4% against the rule; regional sales total is 6.4% higher in the dashboard than the approved semantic model; routine sign-off is waiting and a wrong decision can block downstream users.',
  'Course trigger: team assigns the learner a routine work request before sign-off: 9,207 of 9,734 tiles passed the check, variance 5.4%, with signal ''uncertified dataset use and mismatched dashboard totals''.
Problem statement: A routine work request arrives for executive sales performance review, and a certified BI reporting asset shows uncertified dataset use and mismatched dashboard totals. The expected volume is 9,734 tiles, but only 9,207 tiles are usable, creating a 5.4% variance against the control expectation. Regional sales total is 6.4% higher in the dashboard than the approved semantic model. The accepted rule is: 100% of executive tiles must use certified sources. The learner receives dashboard dependency list, certified dataset register, semantic model measure sheet, data refresh history, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the BI Asset Certification Review Sheet. The learner must independently reconcile the supplied records, decide whether the case is acceptable, and document the action.
Major concepts: certified BI asset control; semantic model dependency; measure lineage; refresh reliability; executive reporting risk; expected 9,734 vs actual 9,207 tiles; 5.4% variance interpretation; threshold rule: 100% of executive tiles must use certified sources; routine evidence reconciliation; release/hold action logic.
Root-cause focus: Compare the routine evidence to decide whether the likely cause is: uncertified table usage, measure definition drift, refresh failure, manual filter override, or missing owner approval. Evidence must come from dashboard dependency list, certified dataset register, semantic model measure sheet.
Required data: dashboard dependency list; certified dataset register; semantic model measure sheet; data refresh history; business owner approval note; work request brief; approval deadline note
Artifact: BI Asset Certification Review Sheet - Routine Work Record
Artifact structure: case summary; expected vs actual numbers; threshold rule; evidence table from dashboard dependency list, certified dataset register, semantic model measure sheet; root-cause hypothesis; decision/action; risk note; role handoff.
Evidence fields to assess: captures expected 9,734 and actual 9,207 tiles; calculates or explains 5.4% variance; uses threshold rule correctly (100% of executive tiles must use certified sources); cites at least three input documents; links evidence to root-cause hypothesis; states clear release/hold/correct/escalate decision.
AI support tips: Use AI as a coach to ask evidence-checking questions, explain unfamiliar terms, compare possible root causes, and improve clarity. Do not use AI to invent numbers or make the decision without citing the provided documents.',
  1,
  '10 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Data Science - BI & Analytics Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-017' LIMIT 1),
  'B.Sc Data Science - BI & Analytics Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BBA Business Analytics - BI Reporting Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-017' LIMIT 1),
  'BBA Business Analytics - BI Reporting Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Com Analytics - Management Reporting Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-017' LIMIT 1),
  'B.Com Analytics - Management Reporting Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MBA Business Analytics - Decision Reporting Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-017' LIMIT 1),
  'MBA Business Analytics - Decision Reporting Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech CSE - Data Analytics Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-017' LIMIT 1),
  'B.Tech CSE - Data Analytics Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Complete a Routine Decision Recommendation Production Workplace Case
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Complete a Routine Decision Recommendation Production Workplace Case',
  'CRS-IND-CL-022',
  'By the end of this course, the learner can complete a routine case in Decision Recommendation Production by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact. Workplace problem: A routine work request arrives for warehouse staffing recommendation, and an operations decision recommendation model shows optimization output conflicts with capacity and cost constraints. The expected volume is 11,370 recommendations, but only 10,684 recommendations are usable, creating a 6.0% variance against the control expectation. Recommended overtime cost exceeds budget by ₹4.8 lakh and misses 11 high-priority fulfillment slots. The accepted rule is: recommendation constraint breaches must stay below 2%. The learner receives optimization scenario file, constraint register, cost-benefit worksheet, service-level target sheet, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Decision Recommendation Justification Note. The learner must independently reconcile the supplied records, decide whether the case is acceptable, and document the action. Artifact: Decision Recommendation Justification Note - Routine Work Record.',
  '10 hours',
  'Active',
  'Decision Optimization & Business Insight',
  'technical',
  '["By the end of this course, the learner can complete a routine case in Decision Recommendation Production by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact","Learner demonstrates Decision Recommendation Production by interpreting real-looking numbers, comparing evidence from optimization scenario file and constraint register, and producing a decision-ready artifact","Proves the learner can perform routine execution work in Decision Recommendation Production with numeric evidence, workplace documents, and a reviewer-ready artifact. Status: Demo Ready"]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L2 Module: Decision Recommendation Production Workplace Mission
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-022' LIMIT 1),
  'L2 Module: Decision Recommendation Production Workplace Mission',
  'Industry requirement: Teams responsible for an operations decision recommendation model need learners who can use numeric evidence, threshold rules, and workplace documents to make reliable decisions during warehouse staffing recommendation, not only explain Decision Recommendation Production theoretically. Gap addressed: Academic learning may cover the concepts behind Decision Recommendation Production, but it usually does not make learners practice with optimization scenario file, constraint register, cost-benefit worksheet, numeric variance, threshold decisions, and role handoff artifacts. Trigger: team assigns the learner a routine work request before sign-off: 10,684 of 11,370 recommendations passed the check, variance 6.0%, with signal ''optimization output conflicts with capacity and cost constraints''.',
  1,
  '["Data & AI","Decision Optimization & Business Insight","Decision Recommendation Production","Primary: Evidence. Supporting: Technical, Functional, Domain","constraint feasibility","objective function trade-off","scenario comparison","cost-service impact","decision recommendation evidence","expected 11,370 vs actual 10,684 recommendations","6.0% variance interpretation","threshold rule: recommendation constraint breaches must stay below 2%","routine evidence reconciliation","release/hold action logic"]'::jsonb,
  '["Engage: Learner receives a routine execution case: warehouse staffing recommendation is at risk because only 10,684 of 11,370 recommendations passed the control and optimization output conflicts with capacity and cost constraints is visible","Explore: Learner reviews optimization scenario file, constraint register, cost-benefit worksheet, service-level target sheet, manager decision request, highlights the fields that prove the issue, and notes which values cross the threshold","Explain: Learner studies constraint feasibility, objective function trade-off, scenario comparison, cost-service impact and learns how these concepts explain the business risk, not just the technical error","Express: Learner prepares the Decision Recommendation Justification Note with issue summary, numeric evidence, root-cause hypothesis, decision, and handoff note","Empower: Learner must select release, hold, correct, or escalate with evidence for warehouse staffing recommendation","Evolve: Learner records one improvement to make routine warehouse staffing recommendation handling faster and clearer"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Scenario: Decision Recommendation Justification Note - Routine Work Record
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-022' LIMIT 1)
   AND title = 'L2 Module: Decision Recommendation Production Workplace Mission' LIMIT 1),
  'Workplace Scenario: Decision Recommendation Justification Note - Routine Work Record',
  'A routine work request arrives for warehouse staffing recommendation, and an operations decision recommendation model shows optimization output conflicts with capacity and cost constraints. The expected volume is 11,370 recommendations, but only 10,684 recommendations are usable, creating a 6.0% variance against the control expectation. Recommended overtime cost exceeds budget by ₹4.8 lakh and misses 11 high-priority fulfillment slots. The accepted rule is: recommendation constraint breaches must stay below 2%. The learner receives optimization scenario file, constraint register, cost-benefit worksheet, service-level target sheet, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Decision Recommendation Justification Note. The learner must independently reconcile the supplied records, decide whether the case is acceptable, and document the action. Pressure points: Warehouse staffing recommendation is time-sensitive; variance is 6.0% against the rule; recommended overtime cost exceeds budget by ₹4.8 lakh and misses 11 high-priority fulfillment slots; routine sign-off is waiting and a wrong decision can block downstream users.',
  'Course trigger: team assigns the learner a routine work request before sign-off: 10,684 of 11,370 recommendations passed the check, variance 6.0%, with signal ''optimization output conflicts with capacity and cost constraints''.
Problem statement: A routine work request arrives for warehouse staffing recommendation, and an operations decision recommendation model shows optimization output conflicts with capacity and cost constraints. The expected volume is 11,370 recommendations, but only 10,684 recommendations are usable, creating a 6.0% variance against the control expectation. Recommended overtime cost exceeds budget by ₹4.8 lakh and misses 11 high-priority fulfillment slots. The accepted rule is: recommendation constraint breaches must stay below 2%. The learner receives optimization scenario file, constraint register, cost-benefit worksheet, service-level target sheet, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Decision Recommendation Justification Note. The learner must independently reconcile the supplied records, decide whether the case is acceptable, and document the action.
Major concepts: constraint feasibility; objective function trade-off; scenario comparison; cost-service impact; decision recommendation evidence; expected 11,370 vs actual 10,684 recommendations; 6.0% variance interpretation; threshold rule: recommendation constraint breaches must stay below 2%; routine evidence reconciliation; release/hold action logic.
Root-cause focus: Compare the routine evidence to decide whether the likely cause is: missing constraint, wrong objective weight, outdated cost parameter, service-level trade-off, or infeasible scenario. Evidence must come from optimization scenario file, constraint register, cost-benefit worksheet.
Required data: optimization scenario file; constraint register; cost-benefit worksheet; service-level target sheet; manager decision request; work request brief; approval deadline note
Artifact: Decision Recommendation Justification Note - Routine Work Record
Artifact structure: case summary; expected vs actual numbers; threshold rule; evidence table from optimization scenario file, constraint register, cost-benefit worksheet; root-cause hypothesis; decision/action; risk note; role handoff.
Evidence fields to assess: captures expected 11,370 and actual 10,684 recommendations; calculates or explains 6.0% variance; uses threshold rule correctly (recommendation constraint breaches must stay below 2%); cites at least three input documents; links evidence to root-cause hypothesis; states clear release/hold/correct/escalate decision.
AI support tips: Use AI as a coach to ask evidence-checking questions, explain unfamiliar terms, compare possible root causes, and improve clarity. Do not use AI to invent numbers or make the decision without citing the provided documents.',
  1,
  '10 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Statistics / Data Science - Decision Analytics Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-022' LIMIT 1),
  'B.Sc Statistics / Data Science - Decision Analytics Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech Industrial Engineering / Operations Analytics Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-022' LIMIT 1),
  'B.Tech Industrial Engineering / Operations Analytics Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BBA Business Analytics - Decision Intelligence Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-022' LIMIT 1),
  'BBA Business Analytics - Decision Intelligence Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MBA Business Analytics - Optimization & Strategy Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-022' LIMIT 1),
  'MBA Business Analytics - Optimization & Strategy Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Sc Data Science - Optimization Analytics
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-022' LIMIT 1),
  'M.Sc Data Science - Optimization Analytics',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Data Science - Applied Modeling Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-022' LIMIT 1),
  'B.Sc Data Science - Applied Modeling Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Complete a Routine Leakage-Safe Feature Dataset Build Workplace Case
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Complete a Routine Leakage-Safe Feature Dataset Build Workplace Case',
  'CRS-IND-CL-027',
  'By the end of this course, the learner can complete a routine case in Leakage-Safe Feature Dataset Build by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact. Workplace problem: A routine work request arrives for model training cut-off review, and a churn prediction feature dataset shows feature leakage risk and event-window mismatch. The expected volume is 262,420 rows, but only 238,390 rows are usable, creating a 9.2% variance against the control expectation. 18 features are populated after the churn label date and 9.2% of rows use future transactions. The accepted rule is: post-outcome features must be 0 before training release. The learner receives label definition sheet, feature lineage map, event-window extract, training data sample, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Leakage-Safe Feature Dataset Review Pack. The learner must independently reconcile the supplied records, decide whether the case is acceptable, and document the action. Artifact: Leakage-Safe Feature Dataset Review Pack - Routine Work Record.',
  '10 hours',
  'Active',
  'Data Science & Statistical Modeling',
  'technical',
  '["By the end of this course, the learner can complete a routine case in Leakage-Safe Feature Dataset Build by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact","Learner demonstrates Leakage-Safe Feature Dataset Build by interpreting real-looking numbers, comparing evidence from label definition sheet and feature lineage map, and producing a decision-ready artifact","Proves the learner can perform routine execution work in Leakage-Safe Feature Dataset Build with numeric evidence, workplace documents, and a reviewer-ready artifact. Status: Demo Ready"]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L2 Module: Leakage-Safe Feature Dataset Build Workplace Mission
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-027' LIMIT 1),
  'L2 Module: Leakage-Safe Feature Dataset Build Workplace Mission',
  'Industry requirement: Teams responsible for a churn prediction feature dataset need learners who can use numeric evidence, threshold rules, and workplace documents to make reliable decisions during model training cut-off review, not only explain Leakage-Safe Feature Dataset Build theoretically. Gap addressed: Academic learning may cover the concepts behind Leakage-Safe Feature Dataset Build, but it usually does not make learners practice with label definition sheet, feature lineage map, event-window extract, numeric variance, threshold decisions, and role handoff artifacts. Trigger: team assigns the learner a routine work request before sign-off: 238,390 of 262,420 rows passed the check, variance 9.2%, with signal ''feature leakage risk and event-window mismatch''.',
  1,
  '["Data & AI","Data Science & Statistical Modeling","Leakage-Safe Feature Dataset Build","Primary: Evidence. Supporting: Technical, Functional, Domain","prediction target timing","feature availability cut-off","target leakage detection","event-window alignment","training data release control","expected 262,420 vs actual 238,390 rows","9.2% variance interpretation","threshold rule: post-outcome features must be 0 before training release","routine evidence reconciliation","release/hold action logic"]'::jsonb,
  '["Engage: Learner receives a routine execution case: model training cut-off review is at risk because only 238,390 of 262,420 rows passed the control and feature leakage risk and event-window mismatch is visible","Explore: Learner reviews label definition sheet, feature lineage map, event-window extract, training data sample, leakage review checklist, highlights the fields that prove the issue, and notes which values cross the threshold","Explain: Learner studies prediction target timing, feature availability cut-off, target leakage detection, event-window alignment and learns how these concepts explain the business risk, not just the technical error","Express: Learner prepares the Leakage-Safe Feature Dataset Review Pack with issue summary, numeric evidence, root-cause hypothesis, decision, and handoff note","Empower: Learner must select release, hold, correct, or escalate with evidence for model training cut-off review","Evolve: Learner records one improvement to make routine model training cut-off review handling faster and clearer"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Scenario: Leakage-Safe Feature Dataset Review Pack - Routine Work Record
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-027' LIMIT 1)
   AND title = 'L2 Module: Leakage-Safe Feature Dataset Build Workplace Mission' LIMIT 1),
  'Workplace Scenario: Leakage-Safe Feature Dataset Review Pack - Routine Work Record',
  'A routine work request arrives for model training cut-off review, and a churn prediction feature dataset shows feature leakage risk and event-window mismatch. The expected volume is 262,420 rows, but only 238,390 rows are usable, creating a 9.2% variance against the control expectation. 18 features are populated after the churn label date and 9.2% of rows use future transactions. The accepted rule is: post-outcome features must be 0 before training release. The learner receives label definition sheet, feature lineage map, event-window extract, training data sample, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Leakage-Safe Feature Dataset Review Pack. The learner must independently reconcile the supplied records, decide whether the case is acceptable, and document the action. Pressure points: Model training cut-off review is time-sensitive; variance is 9.2% against the rule; 18 features are populated after the churn label date and 9.2% of rows use future transactions; routine sign-off is waiting and a wrong decision can block downstream users.',
  'Course trigger: team assigns the learner a routine work request before sign-off: 238,390 of 262,420 rows passed the check, variance 9.2%, with signal ''feature leakage risk and event-window mismatch''.
Problem statement: A routine work request arrives for model training cut-off review, and a churn prediction feature dataset shows feature leakage risk and event-window mismatch. The expected volume is 262,420 rows, but only 238,390 rows are usable, creating a 9.2% variance against the control expectation. 18 features are populated after the churn label date and 9.2% of rows use future transactions. The accepted rule is: post-outcome features must be 0 before training release. The learner receives label definition sheet, feature lineage map, event-window extract, training data sample, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Leakage-Safe Feature Dataset Review Pack. The learner must independently reconcile the supplied records, decide whether the case is acceptable, and document the action.
Major concepts: prediction target timing; feature availability cut-off; target leakage detection; event-window alignment; training data release control; expected 262,420 vs actual 238,390 rows; 9.2% variance interpretation; threshold rule: post-outcome features must be 0 before training release; routine evidence reconciliation; release/hold action logic.
Root-cause focus: Compare the routine evidence to decide whether the likely cause is: future-dated transaction feature, wrong label cut-off, late feature backfill, target leakage, or unverified event window. Evidence must come from label definition sheet, feature lineage map, event-window extract.
Required data: label definition sheet; feature lineage map; event-window extract; training data sample; leakage review checklist; work request brief; approval deadline note
Artifact: Leakage-Safe Feature Dataset Review Pack - Routine Work Record
Artifact structure: case summary; expected vs actual numbers; threshold rule; evidence table from label definition sheet, feature lineage map, event-window extract; root-cause hypothesis; decision/action; risk note; role handoff.
Evidence fields to assess: captures expected 262,420 and actual 238,390 rows; calculates or explains 9.2% variance; uses threshold rule correctly (post-outcome features must be 0 before training release); cites at least three input documents; links evidence to root-cause hypothesis; states clear release/hold/correct/escalate decision.
AI support tips: Use AI as a coach to ask evidence-checking questions, explain unfamiliar terms, compare possible root causes, and improve clarity. Do not use AI to invent numbers or make the decision without citing the provided documents.',
  1,
  '10 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Data Science - Applied Modeling Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-027' LIMIT 1),
  'B.Sc Data Science - Applied Modeling Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Statistics - Data Science Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-027' LIMIT 1),
  'B.Sc Statistics - Data Science Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech AI & Data Science - Modeling Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-027' LIMIT 1),
  'B.Tech AI & Data Science - Modeling Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Sc Data Science - Applied Analytics Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-027' LIMIT 1),
  'M.Sc Data Science - Applied Analytics Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MCA - Data Science Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-027' LIMIT 1),
  'MCA - Data Science Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Complete a Routine Experiment and Cohort Evaluation Workplace Case
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Complete a Routine Experiment and Cohort Evaluation Workplace Case',
  'CRS-IND-CL-032',
  'By the end of this course, the learner can complete a routine case in Experiment and Cohort Evaluation by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact. Workplace problem: A routine work request arrives for pricing-page change decision, and an A/B experiment result shows cohort imbalance and weak significance evidence. The expected volume is 77,790 users, but only 71,030 users are usable, creating a 8.7% variance against the control expectation. Control has 52.8% of traffic instead of 50% and conversion lift is only 0.7% with p=0.09. The accepted rule is: minimum detectable effect and sample ratio mismatch must be within tolerance. The learner receives experiment design note, cohort assignment report, conversion result table, validity checklist, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Experiment Validity and Decision Evidence Pack. The learner must independently reconcile the supplied records, decide whether the case is acceptable, and document the action. Artifact: Experiment Validity and Decision Evidence Pack - Routine Work Record.',
  '10 hours',
  'Active',
  'Data Science & Statistical Modeling',
  'technical',
  '["By the end of this course, the learner can complete a routine case in Experiment and Cohort Evaluation by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact","Learner demonstrates Experiment and Cohort Evaluation by interpreting real-looking numbers, comparing evidence from experiment design note and cohort assignment report, and producing a decision-ready artifact","Proves the learner can perform routine execution work in Experiment and Cohort Evaluation with numeric evidence, workplace documents, and a reviewer-ready artifact. Status: Demo Ready"]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L2 Module: Experiment and Cohort Evaluation Workplace Mission
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-032' LIMIT 1),
  'L2 Module: Experiment and Cohort Evaluation Workplace Mission',
  'Industry requirement: Teams responsible for an A/B experiment result need learners who can use numeric evidence, threshold rules, and workplace documents to make reliable decisions during pricing-page change decision, not only explain Experiment and Cohort Evaluation theoretically. Gap addressed: Academic learning may cover the concepts behind Experiment and Cohort Evaluation, but it usually does not make learners practice with experiment design note, cohort assignment report, conversion result table, numeric variance, threshold decisions, and role handoff artifacts. Trigger: team assigns the learner a routine work request before sign-off: 71,030 of 77,790 users passed the check, variance 8.7%, with signal ''cohort imbalance and weak significance evidence''.',
  1,
  '["Data & AI","Data Science & Statistical Modeling","Experiment and Cohort Evaluation","Primary: Evidence. Supporting: Technical, Functional, Domain","sample-ratio mismatch","statistical power","confidence interval","cohort validity","decision threshold","expected 77,790 vs actual 71,030 users","8.7% variance interpretation","threshold rule: minimum detectable effect and sample ratio mismatch must be within tolerance","routine evidence reconciliation","release/hold action logic"]'::jsonb,
  '["Engage: Learner receives a routine execution case: pricing-page change decision is at risk because only 71,030 of 77,790 users passed the control and cohort imbalance and weak significance evidence is visible","Explore: Learner reviews experiment design note, cohort assignment report, conversion result table, validity checklist, product decision memo, highlights the fields that prove the issue, and notes which values cross the threshold","Explain: Learner studies sample-ratio mismatch, statistical power, confidence interval, cohort validity and learns how these concepts explain the business risk, not just the technical error","Express: Learner prepares the Experiment Validity and Decision Evidence Pack with issue summary, numeric evidence, root-cause hypothesis, decision, and handoff note","Empower: Learner must select release, hold, correct, or escalate with evidence for pricing-page change decision","Evolve: Learner records one improvement to make routine pricing-page change decision handling faster and clearer"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Scenario: Experiment Validity and Decision Evidence Pack - Routine Work Record
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-032' LIMIT 1)
   AND title = 'L2 Module: Experiment and Cohort Evaluation Workplace Mission' LIMIT 1),
  'Workplace Scenario: Experiment Validity and Decision Evidence Pack - Routine Work Record',
  'A routine work request arrives for pricing-page change decision, and an A/B experiment result shows cohort imbalance and weak significance evidence. The expected volume is 77,790 users, but only 71,030 users are usable, creating a 8.7% variance against the control expectation. Control has 52.8% of traffic instead of 50% and conversion lift is only 0.7% with p=0.09. The accepted rule is: minimum detectable effect and sample ratio mismatch must be within tolerance. The learner receives experiment design note, cohort assignment report, conversion result table, validity checklist, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Experiment Validity and Decision Evidence Pack. The learner must independently reconcile the supplied records, decide whether the case is acceptable, and document the action. Pressure points: Pricing-page change decision is time-sensitive; variance is 8.7% against the rule; control has 52.8% of traffic instead of 50% and conversion lift is only 0.7% with p=0.09; routine sign-off is waiting and a wrong decision can block downstream users.',
  'Course trigger: team assigns the learner a routine work request before sign-off: 71,030 of 77,790 users passed the check, variance 8.7%, with signal ''cohort imbalance and weak significance evidence''.
Problem statement: A routine work request arrives for pricing-page change decision, and an A/B experiment result shows cohort imbalance and weak significance evidence. The expected volume is 77,790 users, but only 71,030 users are usable, creating a 8.7% variance against the control expectation. Control has 52.8% of traffic instead of 50% and conversion lift is only 0.7% with p=0.09. The accepted rule is: minimum detectable effect and sample ratio mismatch must be within tolerance. The learner receives experiment design note, cohort assignment report, conversion result table, validity checklist, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Experiment Validity and Decision Evidence Pack. The learner must independently reconcile the supplied records, decide whether the case is acceptable, and document the action.
Major concepts: sample-ratio mismatch; statistical power; confidence interval; cohort validity; decision threshold; expected 77,790 vs actual 71,030 users; 8.7% variance interpretation; threshold rule: minimum detectable effect and sample ratio mismatch must be within tolerance; routine evidence reconciliation; release/hold action logic.
Root-cause focus: Compare the routine evidence to decide whether the likely cause is: sample-ratio mismatch, underpowered test, instrumentation gap, segment imbalance, or premature decision. Evidence must come from experiment design note, cohort assignment report, conversion result table.
Required data: experiment design note; cohort assignment report; conversion result table; validity checklist; product decision memo; work request brief; approval deadline note
Artifact: Experiment Validity and Decision Evidence Pack - Routine Work Record
Artifact structure: case summary; expected vs actual numbers; threshold rule; evidence table from experiment design note, cohort assignment report, conversion result table; root-cause hypothesis; decision/action; risk note; role handoff.
Evidence fields to assess: captures expected 77,790 and actual 71,030 users; calculates or explains 8.7% variance; uses threshold rule correctly (minimum detectable effect and sample ratio mismatch must be within tolerance); cites at least three input documents; links evidence to root-cause hypothesis; states clear release/hold/correct/escalate decision.
AI support tips: Use AI as a coach to ask evidence-checking questions, explain unfamiliar terms, compare possible root causes, and improve clarity. Do not use AI to invent numbers or make the decision without citing the provided documents.',
  1,
  '10 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Data Science - Applied Modeling Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-032' LIMIT 1),
  'B.Sc Data Science - Applied Modeling Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Statistics - Data Science Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-032' LIMIT 1),
  'B.Sc Statistics - Data Science Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech AI & Data Science - Modeling Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-032' LIMIT 1),
  'B.Tech AI & Data Science - Modeling Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Sc Data Science - Applied Analytics Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-032' LIMIT 1),
  'M.Sc Data Science - Applied Analytics Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MCA - Data Science Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-032' LIMIT 1),
  'MCA - Data Science Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Complete a Routine Deep Learning Candidate Packaging Workplace Case
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Complete a Routine Deep Learning Candidate Packaging Workplace Case',
  'CRS-IND-CL-037',
  'By the end of this course, the learner can complete a routine case in Deep Learning Candidate Packaging by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact. Workplace problem: A routine work request arrives for computer vision defect-detection release review, and a deep learning model candidate shows training metric improvement but validation instability. The expected volume is 67,160 images, but only 61,470 images are usable, creating a 8.5% variance against the control expectation. Training F1 is 0.93 but validation F1 drops to 0.81 on low-light images. The accepted rule is: validation F1 must be above 0.86 and train-val gap below 5 points. The learner receives training run log, checkpoint metric table, validation error slice report, model card draft, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Deep Learning Candidate Packaging Review. The learner must independently reconcile the supplied records, decide whether the case is acceptable, and document the action. Artifact: Deep Learning Candidate Packaging Review - Routine Work Record.',
  '10 hours',
  'Active',
  'Machine Learning, Deep Learning & NLP Engineering',
  'technical',
  '["By the end of this course, the learner can complete a routine case in Deep Learning Candidate Packaging by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact","Learner demonstrates Deep Learning Candidate Packaging by interpreting real-looking numbers, comparing evidence from training run log and checkpoint metric table, and producing a decision-ready artifact","Proves the learner can perform routine execution work in Deep Learning Candidate Packaging with numeric evidence, workplace documents, and a reviewer-ready artifact. Status: Demo Ready"]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L2 Module: Deep Learning Candidate Packaging Workplace Mission
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-037' LIMIT 1),
  'L2 Module: Deep Learning Candidate Packaging Workplace Mission',
  'Industry requirement: Teams responsible for a deep learning model candidate need learners who can use numeric evidence, threshold rules, and workplace documents to make reliable decisions during computer vision defect-detection release review, not only explain Deep Learning Candidate Packaging theoretically. Gap addressed: Academic learning may cover the concepts behind Deep Learning Candidate Packaging, but it usually does not make learners practice with training run log, checkpoint metric table, validation error slice report, numeric variance, threshold decisions, and role handoff artifacts. Trigger: team assigns the learner a routine work request before sign-off: 61,470 of 67,160 images passed the check, variance 8.5%, with signal ''training metric improvement but validation instability''.',
  1,
  '["Data & AI","Machine Learning, Deep Learning & NLP Engineering","Deep Learning Candidate Packaging","Primary: Evidence. Supporting: Technical, Functional, Domain","train-validation gap","checkpoint comparison","error slice analysis","model card evidence","release candidate packaging","expected 67,160 vs actual 61,470 images","8.5% variance interpretation","threshold rule: validation F1 must be above 0.86 and train-val gap below 5 points","routine evidence reconciliation","release/hold action logic"]'::jsonb,
  '["Engage: Learner receives a routine execution case: computer vision defect-detection release review is at risk because only 61,470 of 67,160 images passed the control and training metric improvement but validation instability is visible","Explore: Learner reviews training run log, checkpoint metric table, validation error slice report, model card draft, release candidate request, highlights the fields that prove the issue, and notes which values cross the threshold","Explain: Learner studies train-validation gap, checkpoint comparison, error slice analysis, model card evidence and learns how these concepts explain the business risk, not just the technical error","Express: Learner prepares the Deep Learning Candidate Packaging Review with issue summary, numeric evidence, root-cause hypothesis, decision, and handoff note","Empower: Learner must select release, hold, correct, or escalate with evidence for computer vision defect-detection release review","Evolve: Learner records one improvement to make routine computer vision defect-detection release review handling faster and clearer"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Scenario: Deep Learning Candidate Packaging Review - Routine Work Record
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-037' LIMIT 1)
   AND title = 'L2 Module: Deep Learning Candidate Packaging Workplace Mission' LIMIT 1),
  'Workplace Scenario: Deep Learning Candidate Packaging Review - Routine Work Record',
  'A routine work request arrives for computer vision defect-detection release review, and a deep learning model candidate shows training metric improvement but validation instability. The expected volume is 67,160 images, but only 61,470 images are usable, creating a 8.5% variance against the control expectation. Training F1 is 0.93 but validation F1 drops to 0.81 on low-light images. The accepted rule is: validation F1 must be above 0.86 and train-val gap below 5 points. The learner receives training run log, checkpoint metric table, validation error slice report, model card draft, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Deep Learning Candidate Packaging Review. The learner must independently reconcile the supplied records, decide whether the case is acceptable, and document the action. Pressure points: Computer vision defect-detection release review is time-sensitive; variance is 8.5% against the rule; training F1 is 0.93 but validation F1 drops to 0.81 on low-light images; routine sign-off is waiting and a wrong decision can block downstream users.',
  'Course trigger: team assigns the learner a routine work request before sign-off: 61,470 of 67,160 images passed the check, variance 8.5%, with signal ''training metric improvement but validation instability''.
Problem statement: A routine work request arrives for computer vision defect-detection release review, and a deep learning model candidate shows training metric improvement but validation instability. The expected volume is 67,160 images, but only 61,470 images are usable, creating a 8.5% variance against the control expectation. Training F1 is 0.93 but validation F1 drops to 0.81 on low-light images. The accepted rule is: validation F1 must be above 0.86 and train-val gap below 5 points. The learner receives training run log, checkpoint metric table, validation error slice report, model card draft, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Deep Learning Candidate Packaging Review. The learner must independently reconcile the supplied records, decide whether the case is acceptable, and document the action.
Major concepts: train-validation gap; checkpoint comparison; error slice analysis; model card evidence; release candidate packaging; expected 67,160 vs actual 61,470 images; 8.5% variance interpretation; threshold rule: validation F1 must be above 0.86 and train-val gap below 5 points; routine evidence reconciliation; release/hold action logic.
Root-cause focus: Compare the routine evidence to decide whether the likely cause is: overfitting, class imbalance, data augmentation mismatch, checkpoint selection error, or weak slice performance. Evidence must come from training run log, checkpoint metric table, validation error slice report.
Required data: training run log; checkpoint metric table; validation error slice report; model card draft; release candidate request; work request brief; approval deadline note
Artifact: Deep Learning Candidate Packaging Review - Routine Work Record
Artifact structure: case summary; expected vs actual numbers; threshold rule; evidence table from training run log, checkpoint metric table, validation error slice report; root-cause hypothesis; decision/action; risk note; role handoff.
Evidence fields to assess: captures expected 67,160 and actual 61,470 images; calculates or explains 8.5% variance; uses threshold rule correctly (validation F1 must be above 0.86 and train-val gap below 5 points); cites at least three input documents; links evidence to root-cause hypothesis; states clear release/hold/correct/escalate decision.
AI support tips: Use AI as a coach to ask evidence-checking questions, explain unfamiliar terms, compare possible root causes, and improve clarity. Do not use AI to invent numbers or make the decision without citing the provided documents.',
  1,
  '10 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech CSE - AI & Machine Learning Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-037' LIMIT 1),
  'B.Tech CSE - AI & Machine Learning Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech AI & Data Science - ML Engineering Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-037' LIMIT 1),
  'B.Tech AI & Data Science - ML Engineering Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Tech AI / Machine Learning Engineering
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-037' LIMIT 1),
  'M.Tech AI / Machine Learning Engineering',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Sc AI & Machine Learning
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-037' LIMIT 1),
  'M.Sc AI & Machine Learning',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MCA - AI / ML Application Development
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-037' LIMIT 1),
  'MCA - AI / ML Application Development',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Complete a Routine NLP and LLM Evaluation Workplace Case
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Complete a Routine NLP and LLM Evaluation Workplace Case',
  'CRS-IND-CL-042',
  'By the end of this course, the learner can complete a routine case in NLP and LLM Evaluation by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact. Workplace problem: A routine work request arrives for customer-support ticket routing release, and an LLM extraction feature shows structured-output errors and label-schema mismatch. The expected volume is 20,330 prompts, but only 18,845 prompts are usable, creating a 7.3% variance against the control expectation. 12.4% of outputs fail the required JSON schema and refund-intent labels are confused with complaint-intent. The accepted rule is: JSON validity must exceed 98% and critical label errors below 1%. The learner receives prompt set, LLM evaluation result table, label schema definition, failure examples, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the NLP/LLM Evaluation Failure Analysis Pack. The learner must independently reconcile the supplied records, decide whether the case is acceptable, and document the action. Artifact: NLP/LLM Evaluation Failure Analysis Pack - Routine Work Record.',
  '10 hours',
  'Active',
  'Machine Learning, Deep Learning & NLP Engineering',
  'technical',
  '["By the end of this course, the learner can complete a routine case in NLP and LLM Evaluation by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact","Learner demonstrates NLP and LLM Evaluation by interpreting real-looking numbers, comparing evidence from prompt set and LLM evaluation result table, and producing a decision-ready artifact","Proves the learner can perform routine execution work in NLP and LLM Evaluation with numeric evidence, workplace documents, and a reviewer-ready artifact. Status: Demo Ready"]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L2 Module: NLP and LLM Evaluation Workplace Mission
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-042' LIMIT 1),
  'L2 Module: NLP and LLM Evaluation Workplace Mission',
  'Industry requirement: Teams responsible for an LLM extraction feature need learners who can use numeric evidence, threshold rules, and workplace documents to make reliable decisions during customer-support ticket routing release, not only explain NLP and LLM Evaluation theoretically. Gap addressed: Academic learning may cover the concepts behind NLP and LLM Evaluation, but it usually does not make learners practice with prompt set, LLM evaluation result table, label schema definition, numeric variance, threshold decisions, and role handoff artifacts. Trigger: team assigns the learner a routine work request before sign-off: 18,845 of 20,330 prompts passed the check, variance 7.3%, with signal ''structured-output errors and label-schema mismatch''.',
  1,
  '["Data & AI","Machine Learning, Deep Learning & NLP Engineering","NLP and LLM Evaluation","Primary: Evidence. Supporting: Technical, Functional, Domain","structured-output validation","label-schema compliance","confusion matrix review","prompt failure pattern","downstream routing risk","expected 20,330 vs actual 18,845 prompts","7.3% variance interpretation","threshold rule: JSON validity must exceed 98% and critical label errors below 1%","routine evidence reconciliation","release/hold action logic"]'::jsonb,
  '["Engage: Learner receives a routine execution case: customer-support ticket routing release is at risk because only 18,845 of 20,330 prompts passed the control and structured-output errors and label-schema mismatch is visible","Explore: Learner reviews prompt set, LLM evaluation result table, label schema definition, failure examples, routing product requirement, highlights the fields that prove the issue, and notes which values cross the threshold","Explain: Learner studies structured-output validation, label-schema compliance, confusion matrix review, prompt failure pattern and learns how these concepts explain the business risk, not just the technical error","Express: Learner prepares the NLP/LLM Evaluation Failure Analysis Pack with issue summary, numeric evidence, root-cause hypothesis, decision, and handoff note","Empower: Learner must select release, hold, correct, or escalate with evidence for customer-support ticket routing release","Evolve: Learner records one improvement to make routine customer-support ticket routing release handling faster and clearer"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Scenario: NLP/LLM Evaluation Failure Analysis Pack - Routine Work Record
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-042' LIMIT 1)
   AND title = 'L2 Module: NLP and LLM Evaluation Workplace Mission' LIMIT 1),
  'Workplace Scenario: NLP/LLM Evaluation Failure Analysis Pack - Routine Work Record',
  'A routine work request arrives for customer-support ticket routing release, and an LLM extraction feature shows structured-output errors and label-schema mismatch. The expected volume is 20,330 prompts, but only 18,845 prompts are usable, creating a 7.3% variance against the control expectation. 12.4% of outputs fail the required JSON schema and refund-intent labels are confused with complaint-intent. The accepted rule is: JSON validity must exceed 98% and critical label errors below 1%. The learner receives prompt set, LLM evaluation result table, label schema definition, failure examples, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the NLP/LLM Evaluation Failure Analysis Pack. The learner must independently reconcile the supplied records, decide whether the case is acceptable, and document the action. Pressure points: Customer-support ticket routing release is time-sensitive; variance is 7.3% against the rule; 12.4% of outputs fail the required JSON schema and refund-intent labels are confused with complaint-intent; routine sign-off is waiting and a wrong decision can block downstream users.',
  'Course trigger: team assigns the learner a routine work request before sign-off: 18,845 of 20,330 prompts passed the check, variance 7.3%, with signal ''structured-output errors and label-schema mismatch''.
Problem statement: A routine work request arrives for customer-support ticket routing release, and an LLM extraction feature shows structured-output errors and label-schema mismatch. The expected volume is 20,330 prompts, but only 18,845 prompts are usable, creating a 7.3% variance against the control expectation. 12.4% of outputs fail the required JSON schema and refund-intent labels are confused with complaint-intent. The accepted rule is: JSON validity must exceed 98% and critical label errors below 1%. The learner receives prompt set, LLM evaluation result table, label schema definition, failure examples, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the NLP/LLM Evaluation Failure Analysis Pack. The learner must independently reconcile the supplied records, decide whether the case is acceptable, and document the action.
Major concepts: structured-output validation; label-schema compliance; confusion matrix review; prompt failure pattern; downstream routing risk; expected 20,330 vs actual 18,845 prompts; 7.3% variance interpretation; threshold rule: JSON validity must exceed 98% and critical label errors below 1%; routine evidence reconciliation; release/hold action logic.
Root-cause focus: Compare the routine evidence to decide whether the likely cause is: ambiguous labels, prompt instruction weakness, schema constraint failure, retrieval context noise, or unsupported edge cases. Evidence must come from prompt set, LLM evaluation result table, label schema definition.
Required data: prompt set; LLM evaluation result table; label schema definition; failure examples; routing product requirement; work request brief; approval deadline note
Artifact: NLP/LLM Evaluation Failure Analysis Pack - Routine Work Record
Artifact structure: case summary; expected vs actual numbers; threshold rule; evidence table from prompt set, LLM evaluation result table, label schema definition; root-cause hypothesis; decision/action; risk note; role handoff.
Evidence fields to assess: captures expected 20,330 and actual 18,845 prompts; calculates or explains 7.3% variance; uses threshold rule correctly (JSON validity must exceed 98% and critical label errors below 1%); cites at least three input documents; links evidence to root-cause hypothesis; states clear release/hold/correct/escalate decision.
AI support tips: Use AI as a coach to ask evidence-checking questions, explain unfamiliar terms, compare possible root causes, and improve clarity. Do not use AI to invent numbers or make the decision without citing the provided documents.',
  1,
  '10 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech CSE - AI & Machine Learning Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-042' LIMIT 1),
  'B.Tech CSE - AI & Machine Learning Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech AI & Data Science - ML Engineering Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-042' LIMIT 1),
  'B.Tech AI & Data Science - ML Engineering Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Tech AI / Machine Learning Engineering
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-042' LIMIT 1),
  'M.Tech AI / Machine Learning Engineering',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Sc AI & Machine Learning
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-042' LIMIT 1),
  'M.Sc AI & Machine Learning',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MCA - AI / ML Application Development
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-042' LIMIT 1),
  'MCA - AI / ML Application Development',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Complete a Routine Canary Model Release Operation Workplace Case
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Complete a Routine Canary Model Release Operation Workplace Case',
  'CRS-IND-CL-047',
  'By the end of this course, the learner can complete a routine case in Canary Model Release Operation by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact. Workplace problem: A routine work request arrives for fraud model production rollout, and a canary model release shows canary traffic metrics breach release guardrail. The expected volume is 142,900 transactions, but only 130,725 transactions are usable, creating a 8.5% variance against the control expectation. Canary false positives increased by 3.7 points and p95 latency moved from 180 ms to 310 ms. The accepted rule is: canary false-positive increase must stay below 2 points. The learner receives release checklist, canary metric dashboard, rollback decision log, model version registry, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Canary Model Release Decision Record. The learner must independently reconcile the supplied records, decide whether the case is acceptable, and document the action. Artifact: Canary Model Release Decision Record - Routine Work Record.',
  '10 hours',
  'Active',
  'MLOps & AI Platform Operations',
  'technical',
  '["By the end of this course, the learner can complete a routine case in Canary Model Release Operation by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact","Learner demonstrates Canary Model Release Operation by interpreting real-looking numbers, comparing evidence from release checklist and canary metric dashboard, and producing a decision-ready artifact","Proves the learner can perform routine execution work in Canary Model Release Operation with numeric evidence, workplace documents, and a reviewer-ready artifact. Status: Demo Ready"]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L2 Module: Canary Model Release Operation Workplace Mission
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-047' LIMIT 1),
  'L2 Module: Canary Model Release Operation Workplace Mission',
  'Industry requirement: Teams responsible for a canary model release need learners who can use numeric evidence, threshold rules, and workplace documents to make reliable decisions during fraud model production rollout, not only explain Canary Model Release Operation theoretically. Gap addressed: Academic learning may cover the concepts behind Canary Model Release Operation, but it usually does not make learners practice with release checklist, canary metric dashboard, rollback decision log, numeric variance, threshold decisions, and role handoff artifacts. Trigger: team assigns the learner a routine work request before sign-off: 130,725 of 142,900 transactions passed the check, variance 8.5%, with signal ''canary traffic metrics breach release guardrail''.',
  1,
  '["Data & AI","MLOps & AI Platform Operations","Canary Model Release Operation","Primary: Evidence. Supporting: Technical, Functional, Domain","canary traffic split","release guardrails","rollback threshold","latency monitoring","model version control","expected 142,900 vs actual 130,725 transactions","8.5% variance interpretation","threshold rule: canary false-positive increase must stay below 2 points","routine evidence reconciliation","release/hold action logic"]'::jsonb,
  '["Engage: Learner receives a routine execution case: fraud model production rollout is at risk because only 130,725 of 142,900 transactions passed the control and canary traffic metrics breach release guardrail is visible","Explore: Learner reviews release checklist, canary metric dashboard, rollback decision log, model version registry, incident communication draft, highlights the fields that prove the issue, and notes which values cross the threshold","Explain: Learner studies canary traffic split, release guardrails, rollback threshold, latency monitoring and learns how these concepts explain the business risk, not just the technical error","Express: Learner prepares the Canary Model Release Decision Record with issue summary, numeric evidence, root-cause hypothesis, decision, and handoff note","Empower: Learner must select release, hold, correct, or escalate with evidence for fraud model production rollout","Evolve: Learner records one improvement to make routine fraud model production rollout handling faster and clearer"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Scenario: Canary Model Release Decision Record - Routine Work Record
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-047' LIMIT 1)
   AND title = 'L2 Module: Canary Model Release Operation Workplace Mission' LIMIT 1),
  'Workplace Scenario: Canary Model Release Decision Record - Routine Work Record',
  'A routine work request arrives for fraud model production rollout, and a canary model release shows canary traffic metrics breach release guardrail. The expected volume is 142,900 transactions, but only 130,725 transactions are usable, creating a 8.5% variance against the control expectation. Canary false positives increased by 3.7 points and p95 latency moved from 180 ms to 310 ms. The accepted rule is: canary false-positive increase must stay below 2 points. The learner receives release checklist, canary metric dashboard, rollback decision log, model version registry, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Canary Model Release Decision Record. The learner must independently reconcile the supplied records, decide whether the case is acceptable, and document the action. Pressure points: Fraud model production rollout is time-sensitive; variance is 8.5% against the rule; canary false positives increased by 3.7 points and p95 latency moved from 180 ms to 310 ms; routine sign-off is waiting and a wrong decision can block downstream users.',
  'Course trigger: team assigns the learner a routine work request before sign-off: 130,725 of 142,900 transactions passed the check, variance 8.5%, with signal ''canary traffic metrics breach release guardrail''.
Problem statement: A routine work request arrives for fraud model production rollout, and a canary model release shows canary traffic metrics breach release guardrail. The expected volume is 142,900 transactions, but only 130,725 transactions are usable, creating a 8.5% variance against the control expectation. Canary false positives increased by 3.7 points and p95 latency moved from 180 ms to 310 ms. The accepted rule is: canary false-positive increase must stay below 2 points. The learner receives release checklist, canary metric dashboard, rollback decision log, model version registry, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Canary Model Release Decision Record. The learner must independently reconcile the supplied records, decide whether the case is acceptable, and document the action.
Major concepts: canary traffic split; release guardrails; rollback threshold; latency monitoring; model version control; expected 142,900 vs actual 130,725 transactions; 8.5% variance interpretation; threshold rule: canary false-positive increase must stay below 2 points; routine evidence reconciliation; release/hold action logic.
Root-cause focus: Compare the routine evidence to decide whether the likely cause is: model threshold mismatch, feature parity issue, latency regression, bad canary split, or rollback criteria not met. Evidence must come from release checklist, canary metric dashboard, rollback decision log.
Required data: release checklist; canary metric dashboard; rollback decision log; model version registry; incident communication draft; work request brief; approval deadline note
Artifact: Canary Model Release Decision Record - Routine Work Record
Artifact structure: case summary; expected vs actual numbers; threshold rule; evidence table from release checklist, canary metric dashboard, rollback decision log; root-cause hypothesis; decision/action; risk note; role handoff.
Evidence fields to assess: captures expected 142,900 and actual 130,725 transactions; calculates or explains 8.5% variance; uses threshold rule correctly (canary false-positive increase must stay below 2 points); cites at least three input documents; links evidence to root-cause hypothesis; states clear release/hold/correct/escalate decision.
AI support tips: Use AI as a coach to ask evidence-checking questions, explain unfamiliar terms, compare possible root causes, and improve clarity. Do not use AI to invent numbers or make the decision without citing the provided documents.',
  1,
  '10 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech CSE - AI & Machine Learning Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-047' LIMIT 1),
  'B.Tech CSE - AI & Machine Learning Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech AI & Data Science - ML Engineering Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-047' LIMIT 1),
  'B.Tech AI & Data Science - ML Engineering Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Tech AI / Machine Learning Engineering
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-047' LIMIT 1),
  'M.Tech AI / Machine Learning Engineering',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Sc AI & Machine Learning
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-047' LIMIT 1),
  'M.Sc AI & Machine Learning',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MCA - AI / ML Application Development
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-047' LIMIT 1),
  'MCA - AI / ML Application Development',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech CSE - Cloud AI / MLOps Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-047' LIMIT 1),
  'B.Tech CSE - Cloud AI / MLOps Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Complete a Routine Model Drift Response Workplace Case
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Complete a Routine Model Drift Response Workplace Case',
  'CRS-IND-CL-052',
  'By the end of this course, the learner can complete a routine case in Model Drift Response by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact. Workplace problem: A routine work request arrives for monthly drift alert review, and a production credit-risk model shows feature-skew and segment-level performance drift. The expected volume is 229,270 predictions, but only 207,590 predictions are usable, creating a 9.5% variance against the control expectation. Income_band PSI is 0.31 and AUC for new-to-credit users dropped from 0.78 to 0.71. The accepted rule is: PSI above 0.20 or AUC drop above 3 points requires triage. The learner receives drift alert log, feature-skew diagnostic sheet, production prediction sample, threshold decision record, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Model Drift Response Triage Pack. The learner must independently reconcile the supplied records, decide whether the case is acceptable, and document the action. Artifact: Model Drift Response Triage Pack - Routine Work Record.',
  '10 hours',
  'Active',
  'MLOps & AI Platform Operations',
  'technical',
  '["By the end of this course, the learner can complete a routine case in Model Drift Response by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact","Learner demonstrates Model Drift Response by interpreting real-looking numbers, comparing evidence from drift alert log and feature-skew diagnostic sheet, and producing a decision-ready artifact","Proves the learner can perform routine execution work in Model Drift Response with numeric evidence, workplace documents, and a reviewer-ready artifact. Status: Pilot Ready — Evidence Strengthening Needed"]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L2 Module: Model Drift Response Workplace Mission
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-052' LIMIT 1),
  'L2 Module: Model Drift Response Workplace Mission',
  'Industry requirement: Teams responsible for a production credit-risk model need learners who can use numeric evidence, threshold rules, and workplace documents to make reliable decisions during monthly drift alert review, not only explain Model Drift Response theoretically. Gap addressed: Academic learning may cover the concepts behind Model Drift Response, but it usually does not make learners practice with drift alert log, feature-skew diagnostic sheet, production prediction sample, numeric variance, threshold decisions, and role handoff artifacts. Trigger: team assigns the learner a routine work request before sign-off: 207,590 of 229,270 predictions passed the check, variance 9.5%, with signal ''feature-skew and segment-level performance drift''.',
  1,
  '["Data & AI","MLOps & AI Platform Operations","Model Drift Response","Primary: Evidence. Supporting: Technical, Functional, Domain","population stability index","segment-level drift","feature-skew evidence","AUC degradation","retrain versus monitor decision","expected 229,270 vs actual 207,590 predictions","9.5% variance interpretation","threshold rule: PSI above 0.20 or AUC drop above 3 points requires triage","routine evidence reconciliation","release/hold action logic"]'::jsonb,
  '["Engage: Learner receives a routine execution case: monthly drift alert review is at risk because only 207,590 of 229,270 predictions passed the control and feature-skew and segment-level performance drift is visible","Explore: Learner reviews drift alert log, feature-skew diagnostic sheet, production prediction sample, threshold decision record, previous retraining note, highlights the fields that prove the issue, and notes which values cross the threshold","Explain: Learner studies population stability index, segment-level drift, feature-skew evidence, AUC degradation and learns how these concepts explain the business risk, not just the technical error","Express: Learner prepares the Model Drift Response Triage Pack with issue summary, numeric evidence, root-cause hypothesis, decision, and handoff note","Empower: Learner must select release, hold, correct, or escalate with evidence for monthly drift alert review","Evolve: Learner records one improvement to make routine monthly drift alert review handling faster and clearer"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Scenario: Model Drift Response Triage Pack - Routine Work Record
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-052' LIMIT 1)
   AND title = 'L2 Module: Model Drift Response Workplace Mission' LIMIT 1),
  'Workplace Scenario: Model Drift Response Triage Pack - Routine Work Record',
  'A routine work request arrives for monthly drift alert review, and a production credit-risk model shows feature-skew and segment-level performance drift. The expected volume is 229,270 predictions, but only 207,590 predictions are usable, creating a 9.5% variance against the control expectation. Income_band PSI is 0.31 and AUC for new-to-credit users dropped from 0.78 to 0.71. The accepted rule is: PSI above 0.20 or AUC drop above 3 points requires triage. The learner receives drift alert log, feature-skew diagnostic sheet, production prediction sample, threshold decision record, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Model Drift Response Triage Pack. The learner must independently reconcile the supplied records, decide whether the case is acceptable, and document the action. Pressure points: Monthly drift alert review is time-sensitive; variance is 9.5% against the rule; income_band PSI is 0.31 and AUC for new-to-credit users dropped from 0.78 to 0.71; routine sign-off is waiting and a wrong decision can block downstream users.',
  'Course trigger: team assigns the learner a routine work request before sign-off: 207,590 of 229,270 predictions passed the check, variance 9.5%, with signal ''feature-skew and segment-level performance drift''.
Problem statement: A routine work request arrives for monthly drift alert review, and a production credit-risk model shows feature-skew and segment-level performance drift. The expected volume is 229,270 predictions, but only 207,590 predictions are usable, creating a 9.5% variance against the control expectation. Income_band PSI is 0.31 and AUC for new-to-credit users dropped from 0.78 to 0.71. The accepted rule is: PSI above 0.20 or AUC drop above 3 points requires triage. The learner receives drift alert log, feature-skew diagnostic sheet, production prediction sample, threshold decision record, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Model Drift Response Triage Pack. The learner must independently reconcile the supplied records, decide whether the case is acceptable, and document the action.
Major concepts: population stability index; segment-level drift; feature-skew evidence; AUC degradation; retrain versus monitor decision; expected 229,270 vs actual 207,590 predictions; 9.5% variance interpretation; threshold rule: PSI above 0.20 or AUC drop above 3 points requires triage; routine evidence reconciliation; release/hold action logic.
Root-cause focus: Compare the routine evidence to decide whether the likely cause is: population shift, feature pipeline change, model degradation, threshold misconfiguration, or seasonal behavior change. Evidence must come from drift alert log, feature-skew diagnostic sheet, production prediction sample.
Required data: drift alert log; feature-skew diagnostic sheet; production prediction sample; threshold decision record; previous retraining note; work request brief; approval deadline note
Artifact: Model Drift Response Triage Pack - Routine Work Record
Artifact structure: case summary; expected vs actual numbers; threshold rule; evidence table from drift alert log, feature-skew diagnostic sheet, production prediction sample; root-cause hypothesis; decision/action; risk note; role handoff.
Evidence fields to assess: captures expected 229,270 and actual 207,590 predictions; calculates or explains 9.5% variance; uses threshold rule correctly (PSI above 0.20 or AUC drop above 3 points requires triage); cites at least three input documents; links evidence to root-cause hypothesis; states clear release/hold/correct/escalate decision.
AI support tips: Use AI as a coach to ask evidence-checking questions, explain unfamiliar terms, compare possible root causes, and improve clarity. Do not use AI to invent numbers or make the decision without citing the provided documents.',
  1,
  '10 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech CSE - AI & Machine Learning Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-052' LIMIT 1),
  'B.Tech CSE - AI & Machine Learning Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech AI & Data Science - ML Engineering Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-052' LIMIT 1),
  'B.Tech AI & Data Science - ML Engineering Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Tech AI / Machine Learning Engineering
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-052' LIMIT 1),
  'M.Tech AI / Machine Learning Engineering',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Sc AI & Machine Learning
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-052' LIMIT 1),
  'M.Sc AI & Machine Learning',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MCA - AI / ML Application Development
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-052' LIMIT 1),
  'MCA - AI / ML Application Development',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech CSE - Cloud AI / MLOps Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-052' LIMIT 1),
  'B.Tech CSE - Cloud AI / MLOps Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Complete a Routine Edge AI Anomaly Actioning Workplace Case
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Complete a Routine Edge AI Anomaly Actioning Workplace Case',
  'CRS-IND-CL-057',
  'By the end of this course, the learner can complete a routine case in Edge AI Anomaly Actioning by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact. Workplace problem: A routine work request arrives for factory anomaly alert response, and an edge AI predictive-maintenance device shows device inference anomaly and sensor packet loss. The expected volume is 108,640 readings, but only 99,880 readings are usable, creating a 8.1% variance against the control expectation. Motor vibration anomaly score reached 0.91 while 6.5% of temperature packets were missing. The accepted rule is: packet loss above 4% or anomaly score above 0.82 requires action. The learner receives edge device alert log, sensor packet summary, local inference score sheet, maintenance history note, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Edge AI Anomaly Action Record. The learner must independently reconcile the supplied records, decide whether the case is acceptable, and document the action. Artifact: Edge AI Anomaly Action Record - Routine Work Record.',
  '10 hours',
  'Active',
  'Cloud, Edge, IoT & Autonomous AI Systems',
  'technical',
  '["By the end of this course, the learner can complete a routine case in Edge AI Anomaly Actioning by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact","Learner demonstrates Edge AI Anomaly Actioning by interpreting real-looking numbers, comparing evidence from edge device alert log and sensor packet summary, and producing a decision-ready artifact","Proves the learner can perform routine execution work in Edge AI Anomaly Actioning with numeric evidence, workplace documents, and a reviewer-ready artifact. Status: Pilot Ready — Evidence Strengthening Needed"]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L2 Module: Edge AI Anomaly Actioning Workplace Mission
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-057' LIMIT 1),
  'L2 Module: Edge AI Anomaly Actioning Workplace Mission',
  'Industry requirement: Teams responsible for an edge AI predictive-maintenance device need learners who can use numeric evidence, threshold rules, and workplace documents to make reliable decisions during factory anomaly alert response, not only explain Edge AI Anomaly Actioning theoretically. Gap addressed: Academic learning may cover the concepts behind Edge AI Anomaly Actioning, but it usually does not make learners practice with edge device alert log, sensor packet summary, local inference score sheet, numeric variance, threshold decisions, and role handoff artifacts. Trigger: team assigns the learner a routine work request before sign-off: 99,880 of 108,640 readings passed the check, variance 8.1%, with signal ''device inference anomaly and sensor packet loss''.',
  1,
  '["Data & AI","Cloud, Edge, IoT & Autonomous AI Systems","Edge AI Anomaly Actioning","Primary: Evidence. Supporting: Technical, Functional, Domain","edge inference score","sensor packet loss","local-versus-cloud decision","field maintenance escalation","false alert control","expected 108,640 vs actual 99,880 readings","8.1% variance interpretation","threshold rule: packet loss above 4% or anomaly score above 0.82 requires action","routine evidence reconciliation","release/hold action logic"]'::jsonb,
  '["Engage: Learner receives a routine execution case: factory anomaly alert response is at risk because only 99,880 of 108,640 readings passed the control and device inference anomaly and sensor packet loss is visible","Explore: Learner reviews edge device alert log, sensor packet summary, local inference score sheet, maintenance history note, field action ticket, highlights the fields that prove the issue, and notes which values cross the threshold","Explain: Learner studies edge inference score, sensor packet loss, local-versus-cloud decision, field maintenance escalation and learns how these concepts explain the business risk, not just the technical error","Express: Learner prepares the Edge AI Anomaly Action Record with issue summary, numeric evidence, root-cause hypothesis, decision, and handoff note","Empower: Learner must select release, hold, correct, or escalate with evidence for factory anomaly alert response","Evolve: Learner records one improvement to make routine factory anomaly alert response handling faster and clearer"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Scenario: Edge AI Anomaly Action Record - Routine Work Record
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-057' LIMIT 1)
   AND title = 'L2 Module: Edge AI Anomaly Actioning Workplace Mission' LIMIT 1),
  'Workplace Scenario: Edge AI Anomaly Action Record - Routine Work Record',
  'A routine work request arrives for factory anomaly alert response, and an edge AI predictive-maintenance device shows device inference anomaly and sensor packet loss. The expected volume is 108,640 readings, but only 99,880 readings are usable, creating a 8.1% variance against the control expectation. Motor vibration anomaly score reached 0.91 while 6.5% of temperature packets were missing. The accepted rule is: packet loss above 4% or anomaly score above 0.82 requires action. The learner receives edge device alert log, sensor packet summary, local inference score sheet, maintenance history note, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Edge AI Anomaly Action Record. The learner must independently reconcile the supplied records, decide whether the case is acceptable, and document the action. Pressure points: Factory anomaly alert response is time-sensitive; variance is 8.1% against the rule; motor vibration anomaly score reached 0.91 while 6.5% of temperature packets were missing; routine sign-off is waiting and a wrong decision can block downstream users.',
  'Course trigger: team assigns the learner a routine work request before sign-off: 99,880 of 108,640 readings passed the check, variance 8.1%, with signal ''device inference anomaly and sensor packet loss''.
Problem statement: A routine work request arrives for factory anomaly alert response, and an edge AI predictive-maintenance device shows device inference anomaly and sensor packet loss. The expected volume is 108,640 readings, but only 99,880 readings are usable, creating a 8.1% variance against the control expectation. Motor vibration anomaly score reached 0.91 while 6.5% of temperature packets were missing. The accepted rule is: packet loss above 4% or anomaly score above 0.82 requires action. The learner receives edge device alert log, sensor packet summary, local inference score sheet, maintenance history note, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Edge AI Anomaly Action Record. The learner must independently reconcile the supplied records, decide whether the case is acceptable, and document the action.
Major concepts: edge inference score; sensor packet loss; local-versus-cloud decision; field maintenance escalation; false alert control; expected 108,640 vs actual 99,880 readings; 8.1% variance interpretation; threshold rule: packet loss above 4% or anomaly score above 0.82 requires action; routine evidence reconciliation; release/hold action logic.
Root-cause focus: Compare the routine evidence to decide whether the likely cause is: sensor failure, model edge-version mismatch, device network loss, actual equipment anomaly, or threshold calibration issue. Evidence must come from edge device alert log, sensor packet summary, local inference score sheet.
Required data: edge device alert log; sensor packet summary; local inference score sheet; maintenance history note; field action ticket; work request brief; approval deadline note
Artifact: Edge AI Anomaly Action Record - Routine Work Record
Artifact structure: case summary; expected vs actual numbers; threshold rule; evidence table from edge device alert log, sensor packet summary, local inference score sheet; root-cause hypothesis; decision/action; risk note; role handoff.
Evidence fields to assess: captures expected 108,640 and actual 99,880 readings; calculates or explains 8.1% variance; uses threshold rule correctly (packet loss above 4% or anomaly score above 0.82 requires action); cites at least three input documents; links evidence to root-cause hypothesis; states clear release/hold/correct/escalate decision.
AI support tips: Use AI as a coach to ask evidence-checking questions, explain unfamiliar terms, compare possible root causes, and improve clarity. Do not use AI to invent numbers or make the decision without citing the provided documents.',
  1,
  '10 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech CSE - Data Engineering Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-057' LIMIT 1),
  'B.Tech CSE - Data Engineering Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech AI & Data Science - Data Platform Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-057' LIMIT 1),
  'B.Tech AI & Data Science - Data Platform Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Data Science - Data Engineering Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-057' LIMIT 1),
  'B.Sc Data Science - Data Engineering Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MCA - Data Engineering / Cloud Data Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-057' LIMIT 1),
  'MCA - Data Engineering / Cloud Data Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Tech Data Engineering / Big Data Systems
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-057' LIMIT 1),
  'M.Tech Data Engineering / Big Data Systems',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech AI & Data Science - Applied Industry AI Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-057' LIMIT 1),
  'B.Tech AI & Data Science - Applied Industry AI Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Complete a Routine Data Governance Control Maintenance Workplace Case
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Complete a Routine Data Governance Control Maintenance Workplace Case',
  'CRS-IND-CL-062',
  'By the end of this course, the learner can complete a routine case in Data Governance Control Maintenance by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact. Workplace problem: A routine work request arrives for privacy and lineage control review, and a governed customer data asset shows unmapped downstream report and missing data-owner approval. The expected volume is 22,430 attributes, but only 20,696 attributes are usable, creating a 7.7% variance against the control expectation. 37 attributes lack sensitivity tags and 8 downstream reports are missing from lineage. The accepted rule is: critical attributes must have 100% owner, lineage, and policy tagging. The learner receives data asset inventory, lineage extract, policy tag register, owner approval sheet, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Data Governance Control Maintenance Log. The learner must independently reconcile the supplied records, decide whether the case is acceptable, and document the action. Artifact: Data Governance Control Maintenance Log - Routine Work Record.',
  '10 hours',
  'Active',
  'Data Governance & Stewardship',
  'technical',
  '["By the end of this course, the learner can complete a routine case in Data Governance Control Maintenance by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact","Learner demonstrates Data Governance Control Maintenance by interpreting real-looking numbers, comparing evidence from data asset inventory and lineage extract, and producing a decision-ready artifact","Proves the learner can perform routine execution work in Data Governance Control Maintenance with numeric evidence, workplace documents, and a reviewer-ready artifact. Status: Demo Ready"]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L2 Module: Data Governance Control Maintenance Workplace Mission
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-062' LIMIT 1),
  'L2 Module: Data Governance Control Maintenance Workplace Mission',
  'Industry requirement: Teams responsible for a governed customer data asset need learners who can use numeric evidence, threshold rules, and workplace documents to make reliable decisions during privacy and lineage control review, not only explain Data Governance Control Maintenance theoretically. Gap addressed: Academic learning may cover the concepts behind Data Governance Control Maintenance, but it usually does not make learners practice with data asset inventory, lineage extract, policy tag register, numeric variance, threshold decisions, and role handoff artifacts. Trigger: team assigns the learner a routine work request before sign-off: 20,696 of 22,430 attributes passed the check, variance 7.7%, with signal ''unmapped downstream report and missing data-owner approval''.',
  1,
  '["Data & AI","Data Governance & Stewardship","Data Governance Control Maintenance","Primary: Compliance. Supporting: Evidence, Technical, Communication","data ownership","lineage completeness","policy tagging","sensitive data classification","governance control evidence","expected 22,430 vs actual 20,696 attributes","7.7% variance interpretation","threshold rule: critical attributes must have 100% owner, lineage, and policy tagging","routine evidence reconciliation","release/hold action logic"]'::jsonb,
  '["Engage: Learner receives a routine execution case: privacy and lineage control review is at risk because only 20,696 of 22,430 attributes passed the control and unmapped downstream report and missing data-owner approval is visible","Explore: Learner reviews data asset inventory, lineage extract, policy tag register, owner approval sheet, downstream report list, highlights the fields that prove the issue, and notes which values cross the threshold","Explain: Learner studies data ownership, lineage completeness, policy tagging, sensitive data classification and learns how these concepts explain the business risk, not just the technical error","Express: Learner prepares the Data Governance Control Maintenance Log with issue summary, numeric evidence, root-cause hypothesis, decision, and handoff note","Empower: Learner must select release, hold, correct, or escalate with evidence for privacy and lineage control review","Evolve: Learner records one improvement to make routine privacy and lineage control review handling faster and clearer"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Scenario: Data Governance Control Maintenance Log - Routine Work Record
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-062' LIMIT 1)
   AND title = 'L2 Module: Data Governance Control Maintenance Workplace Mission' LIMIT 1),
  'Workplace Scenario: Data Governance Control Maintenance Log - Routine Work Record',
  'A routine work request arrives for privacy and lineage control review, and a governed customer data asset shows unmapped downstream report and missing data-owner approval. The expected volume is 22,430 attributes, but only 20,696 attributes are usable, creating a 7.7% variance against the control expectation. 37 attributes lack sensitivity tags and 8 downstream reports are missing from lineage. The accepted rule is: critical attributes must have 100% owner, lineage, and policy tagging. The learner receives data asset inventory, lineage extract, policy tag register, owner approval sheet, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Data Governance Control Maintenance Log. The learner must independently reconcile the supplied records, decide whether the case is acceptable, and document the action. Pressure points: Privacy and lineage control review is time-sensitive; variance is 7.7% against the rule; 37 attributes lack sensitivity tags and 8 downstream reports are missing from lineage; routine sign-off is waiting and a wrong decision can block downstream users.',
  'Course trigger: team assigns the learner a routine work request before sign-off: 20,696 of 22,430 attributes passed the check, variance 7.7%, with signal ''unmapped downstream report and missing data-owner approval''.
Problem statement: A routine work request arrives for privacy and lineage control review, and a governed customer data asset shows unmapped downstream report and missing data-owner approval. The expected volume is 22,430 attributes, but only 20,696 attributes are usable, creating a 7.7% variance against the control expectation. 37 attributes lack sensitivity tags and 8 downstream reports are missing from lineage. The accepted rule is: critical attributes must have 100% owner, lineage, and policy tagging. The learner receives data asset inventory, lineage extract, policy tag register, owner approval sheet, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Data Governance Control Maintenance Log. The learner must independently reconcile the supplied records, decide whether the case is acceptable, and document the action.
Major concepts: data ownership; lineage completeness; policy tagging; sensitive data classification; governance control evidence; expected 22,430 vs actual 20,696 attributes; 7.7% variance interpretation; threshold rule: critical attributes must have 100% owner, lineage, and policy tagging; routine evidence reconciliation; release/hold action logic.
Root-cause focus: Compare the routine evidence to decide whether the likely cause is: missing data-owner mapping, stale lineage, untagged sensitive attribute, policy exception, or unregistered report dependency. Evidence must come from data asset inventory, lineage extract, policy tag register.
Required data: data asset inventory; lineage extract; policy tag register; owner approval sheet; downstream report list; work request brief; approval deadline note
Artifact: Data Governance Control Maintenance Log - Routine Work Record
Artifact structure: case summary; expected vs actual numbers; threshold rule; evidence table from data asset inventory, lineage extract, policy tag register; root-cause hypothesis; decision/action; risk note; role handoff.
Evidence fields to assess: captures expected 22,430 and actual 20,696 attributes; calculates or explains 7.7% variance; uses threshold rule correctly (critical attributes must have 100% owner, lineage, and policy tagging); cites at least three input documents; links evidence to root-cause hypothesis; states clear release/hold/correct/escalate decision.
AI support tips: Use AI as a coach to ask evidence-checking questions, explain unfamiliar terms, compare possible root causes, and improve clarity. Do not use AI to invent numbers or make the decision without citing the provided documents.',
  1,
  '10 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech AI & Data Science - Responsible AI Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-062' LIMIT 1),
  'B.Tech AI & Data Science - Responsible AI Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech CSE - AI Security / Governance Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-062' LIMIT 1),
  'B.Tech CSE - AI Security / Governance Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MBA Business Analytics - AI Risk & Governance Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-062' LIMIT 1),
  'MBA Business Analytics - AI Risk & Governance Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: LL.B / Tech Law - Data Privacy & AI Governance Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-062' LIMIT 1),
  'LL.B / Tech Law - Data Privacy & AI Governance Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PG Certificate - Responsible AI, Risk & Compliance
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-062' LIMIT 1),
  'PG Certificate - Responsible AI, Risk & Compliance',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech CSE / Data Science - Data Governance Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-062' LIMIT 1),
  'B.Tech CSE / Data Science - Data Governance Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Complete a Routine Responsible AI Deployment Approval Workplace Case
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Complete a Routine Responsible AI Deployment Approval Workplace Case',
  'CRS-IND-CL-067',
  'By the end of this course, the learner can complete a routine case in Responsible AI Deployment Approval by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact. Workplace problem: A routine work request arrives for loan-assistant chatbot approval, and a responsible AI deployment request shows incomplete risk control evidence before deployment. The expected volume is 23,428 checks, but only 21,599 checks are usable, creating a 7.8% variance against the control expectation. Fairness test evidence is missing for 2 protected segments and human-review fallback is not signed off. The accepted rule is: all high-risk controls must be approved before deployment. The learner receives AI use-case registration, risk assessment form, fairness test summary, human fallback design, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Responsible AI Deployment Approval Dossier. The learner must independently reconcile the supplied records, decide whether the case is acceptable, and document the action. Artifact: Responsible AI Deployment Approval Dossier - Routine Work Record.',
  '10 hours',
  'Active',
  'Responsible AI, Risk, Privacy & Security',
  'technical',
  '["By the end of this course, the learner can complete a routine case in Responsible AI Deployment Approval by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact","Learner demonstrates Responsible AI Deployment Approval by interpreting real-looking numbers, comparing evidence from AI use-case registration and risk assessment form, and producing a decision-ready artifact","Proves the learner can perform routine execution work in Responsible AI Deployment Approval with numeric evidence, workplace documents, and a reviewer-ready artifact. Status: Demo Ready"]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L2 Module: Responsible AI Deployment Approval Workplace Mission
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-067' LIMIT 1),
  'L2 Module: Responsible AI Deployment Approval Workplace Mission',
  'Industry requirement: Teams responsible for a responsible AI deployment request need learners who can use numeric evidence, threshold rules, and workplace documents to make reliable decisions during loan-assistant chatbot approval, not only explain Responsible AI Deployment Approval theoretically. Gap addressed: Academic learning may cover the concepts behind Responsible AI Deployment Approval, but it usually does not make learners practice with AI use-case registration, risk assessment form, fairness test summary, numeric variance, threshold decisions, and role handoff artifacts. Trigger: team assigns the learner a routine work request before sign-off: 21,599 of 23,428 checks passed the check, variance 7.8%, with signal ''incomplete risk control evidence before deployment''.',
  1,
  '["Data & AI","Responsible AI, Risk, Privacy & Security","Responsible AI Deployment Approval","Primary: Compliance. Supporting: Evidence, Technical, Communication","AI use-case risk tier","fairness evidence","human oversight control","deployment approval gate","responsible AI audit trail","expected 23,428 vs actual 21,599 checks","7.8% variance interpretation","threshold rule: all high-risk controls must be approved before deployment","routine evidence reconciliation","release/hold action logic"]'::jsonb,
  '["Engage: Learner receives a routine execution case: loan-assistant chatbot approval is at risk because only 21,599 of 23,428 checks passed the control and incomplete risk control evidence before deployment is visible","Explore: Learner reviews AI use-case registration, risk assessment form, fairness test summary, human fallback design, deployment approval checklist, highlights the fields that prove the issue, and notes which values cross the threshold","Explain: Learner studies AI use-case risk tier, fairness evidence, human oversight control, deployment approval gate and learns how these concepts explain the business risk, not just the technical error","Express: Learner prepares the Responsible AI Deployment Approval Dossier with issue summary, numeric evidence, root-cause hypothesis, decision, and handoff note","Empower: Learner must select release, hold, correct, or escalate with evidence for loan-assistant chatbot approval","Evolve: Learner records one improvement to make routine loan-assistant chatbot approval handling faster and clearer"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Scenario: Responsible AI Deployment Approval Dossier - Routine Work Record
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-067' LIMIT 1)
   AND title = 'L2 Module: Responsible AI Deployment Approval Workplace Mission' LIMIT 1),
  'Workplace Scenario: Responsible AI Deployment Approval Dossier - Routine Work Record',
  'A routine work request arrives for loan-assistant chatbot approval, and a responsible AI deployment request shows incomplete risk control evidence before deployment. The expected volume is 23,428 checks, but only 21,599 checks are usable, creating a 7.8% variance against the control expectation. Fairness test evidence is missing for 2 protected segments and human-review fallback is not signed off. The accepted rule is: all high-risk controls must be approved before deployment. The learner receives AI use-case registration, risk assessment form, fairness test summary, human fallback design, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Responsible AI Deployment Approval Dossier. The learner must independently reconcile the supplied records, decide whether the case is acceptable, and document the action. Pressure points: Loan-assistant chatbot approval is time-sensitive; variance is 7.8% against the rule; fairness test evidence is missing for 2 protected segments and human-review fallback is not signed off; routine sign-off is waiting and a wrong decision can block downstream users.',
  'Course trigger: team assigns the learner a routine work request before sign-off: 21,599 of 23,428 checks passed the check, variance 7.8%, with signal ''incomplete risk control evidence before deployment''.
Problem statement: A routine work request arrives for loan-assistant chatbot approval, and a responsible AI deployment request shows incomplete risk control evidence before deployment. The expected volume is 23,428 checks, but only 21,599 checks are usable, creating a 7.8% variance against the control expectation. Fairness test evidence is missing for 2 protected segments and human-review fallback is not signed off. The accepted rule is: all high-risk controls must be approved before deployment. The learner receives AI use-case registration, risk assessment form, fairness test summary, human fallback design, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Responsible AI Deployment Approval Dossier. The learner must independently reconcile the supplied records, decide whether the case is acceptable, and document the action.
Major concepts: AI use-case risk tier; fairness evidence; human oversight control; deployment approval gate; responsible AI audit trail; expected 23,428 vs actual 21,599 checks; 7.8% variance interpretation; threshold rule: all high-risk controls must be approved before deployment; routine evidence reconciliation; release/hold action logic.
Root-cause focus: Compare the routine evidence to decide whether the likely cause is: missing fairness evidence, unclear human oversight, privacy risk gap, unapproved fallback, or incomplete model documentation. Evidence must come from AI use-case registration, risk assessment form, fairness test summary.
Required data: AI use-case registration; risk assessment form; fairness test summary; human fallback design; deployment approval checklist; work request brief; approval deadline note
Artifact: Responsible AI Deployment Approval Dossier - Routine Work Record
Artifact structure: case summary; expected vs actual numbers; threshold rule; evidence table from AI use-case registration, risk assessment form, fairness test summary; root-cause hypothesis; decision/action; risk note; role handoff.
Evidence fields to assess: captures expected 23,428 and actual 21,599 checks; calculates or explains 7.8% variance; uses threshold rule correctly (all high-risk controls must be approved before deployment); cites at least three input documents; links evidence to root-cause hypothesis; states clear release/hold/correct/escalate decision.
AI support tips: Use AI as a coach to ask evidence-checking questions, explain unfamiliar terms, compare possible root causes, and improve clarity. Do not use AI to invent numbers or make the decision without citing the provided documents.',
  1,
  '10 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech AI & Data Science - Responsible AI Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-067' LIMIT 1),
  'B.Tech AI & Data Science - Responsible AI Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech CSE - AI Security / Governance Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-067' LIMIT 1),
  'B.Tech CSE - AI Security / Governance Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MBA Business Analytics - AI Risk & Governance Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-067' LIMIT 1),
  'MBA Business Analytics - AI Risk & Governance Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: LL.B / Tech Law - Data Privacy & AI Governance Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-067' LIMIT 1),
  'LL.B / Tech Law - Data Privacy & AI Governance Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PG Certificate - Responsible AI, Risk & Compliance
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-067' LIMIT 1),
  'PG Certificate - Responsible AI, Risk & Compliance',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Complete a Routine AI Security Abuse-Path Testing Workplace Case
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Complete a Routine AI Security Abuse-Path Testing Workplace Case',
  'CRS-IND-CL-072',
  'By the end of this course, the learner can complete a routine case in AI Security Abuse-Path Testing by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact. Workplace problem: A routine work request arrives for AI security abuse-path test, and a GenAI knowledge assistant shows prompt-injection and retrieval data exposure risk. The expected volume is 24,990 tests, but only 23,013 tests are usable, creating a 7.9% variance against the control expectation. 9 prompt-injection tests reveal restricted policy snippets and 14 retrieval responses cite unapproved documents. The accepted rule is: critical abuse paths must have 0 data-exposure passes. The learner receives abuse-path test script, prompt-injection result log, retrieval access-control matrix, sensitive response examples, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the AI Security Abuse-Path Test Report. The learner must independently reconcile the supplied records, decide whether the case is acceptable, and document the action. Artifact: AI Security Abuse-Path Test Report - Routine Work Record.',
  '10 hours',
  'Active',
  'Responsible AI, Risk, Privacy & Security',
  'technical',
  '["By the end of this course, the learner can complete a routine case in AI Security Abuse-Path Testing by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact","Learner demonstrates AI Security Abuse-Path Testing by interpreting real-looking numbers, comparing evidence from abuse-path test script and prompt-injection result log, and producing a decision-ready artifact","Proves the learner can perform routine execution work in AI Security Abuse-Path Testing with numeric evidence, workplace documents, and a reviewer-ready artifact. Status: Pilot Ready — Evidence Strengthening Needed"]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L2 Module: AI Security Abuse-Path Testing Workplace Mission
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-072' LIMIT 1),
  'L2 Module: AI Security Abuse-Path Testing Workplace Mission',
  'Industry requirement: Teams responsible for a GenAI knowledge assistant need learners who can use numeric evidence, threshold rules, and workplace documents to make reliable decisions during AI security abuse-path test, not only explain AI Security Abuse-Path Testing theoretically. Gap addressed: Academic learning may cover the concepts behind AI Security Abuse-Path Testing, but it usually does not make learners practice with abuse-path test script, prompt-injection result log, retrieval access-control matrix, numeric variance, threshold decisions, and role handoff artifacts. Trigger: team assigns the learner a routine work request before sign-off: 23,013 of 24,990 tests passed the check, variance 7.9%, with signal ''prompt-injection and retrieval data exposure risk''.',
  1,
  '["Data & AI","Responsible AI, Risk, Privacy & Security","AI Security Abuse-Path Testing","Primary: Compliance. Supporting: Evidence, Technical, Communication","prompt-injection pattern","retrieval access control","data exposure severity","red-team evidence","mitigation decision","expected 24,990 vs actual 23,013 tests","7.9% variance interpretation","threshold rule: critical abuse paths must have 0 data-exposure passes","routine evidence reconciliation","release/hold action logic"]'::jsonb,
  '["Engage: Learner receives a routine execution case: AI security abuse-path test is at risk because only 23,013 of 24,990 tests passed the control and prompt-injection and retrieval data exposure risk is visible","Explore: Learner reviews abuse-path test script, prompt-injection result log, retrieval access-control matrix, sensitive response examples, security triage ticket, highlights the fields that prove the issue, and notes which values cross the threshold","Explain: Learner studies prompt-injection pattern, retrieval access control, data exposure severity, red-team evidence and learns how these concepts explain the business risk, not just the technical error","Express: Learner prepares the AI Security Abuse-Path Test Report with issue summary, numeric evidence, root-cause hypothesis, decision, and handoff note","Empower: Learner must select release, hold, correct, or escalate with evidence for AI security abuse-path test","Evolve: Learner records one improvement to make routine AI security abuse-path test handling faster and clearer"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Scenario: AI Security Abuse-Path Test Report - Routine Work Record
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-072' LIMIT 1)
   AND title = 'L2 Module: AI Security Abuse-Path Testing Workplace Mission' LIMIT 1),
  'Workplace Scenario: AI Security Abuse-Path Test Report - Routine Work Record',
  'A routine work request arrives for AI security abuse-path test, and a GenAI knowledge assistant shows prompt-injection and retrieval data exposure risk. The expected volume is 24,990 tests, but only 23,013 tests are usable, creating a 7.9% variance against the control expectation. 9 prompt-injection tests reveal restricted policy snippets and 14 retrieval responses cite unapproved documents. The accepted rule is: critical abuse paths must have 0 data-exposure passes. The learner receives abuse-path test script, prompt-injection result log, retrieval access-control matrix, sensitive response examples, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the AI Security Abuse-Path Test Report. The learner must independently reconcile the supplied records, decide whether the case is acceptable, and document the action. Pressure points: Ai security abuse-path test is time-sensitive; variance is 7.9% against the rule; 9 prompt-injection tests reveal restricted policy snippets and 14 retrieval responses cite unapproved documents; routine sign-off is waiting and a wrong decision can block downstream users.',
  'Course trigger: team assigns the learner a routine work request before sign-off: 23,013 of 24,990 tests passed the check, variance 7.9%, with signal ''prompt-injection and retrieval data exposure risk''.
Problem statement: A routine work request arrives for AI security abuse-path test, and a GenAI knowledge assistant shows prompt-injection and retrieval data exposure risk. The expected volume is 24,990 tests, but only 23,013 tests are usable, creating a 7.9% variance against the control expectation. 9 prompt-injection tests reveal restricted policy snippets and 14 retrieval responses cite unapproved documents. The accepted rule is: critical abuse paths must have 0 data-exposure passes. The learner receives abuse-path test script, prompt-injection result log, retrieval access-control matrix, sensitive response examples, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the AI Security Abuse-Path Test Report. The learner must independently reconcile the supplied records, decide whether the case is acceptable, and document the action.
Major concepts: prompt-injection pattern; retrieval access control; data exposure severity; red-team evidence; mitigation decision; expected 24,990 vs actual 23,013 tests; 7.9% variance interpretation; threshold rule: critical abuse paths must have 0 data-exposure passes; routine evidence reconciliation; release/hold action logic.
Root-cause focus: Compare the routine evidence to decide whether the likely cause is: weak system prompt boundary, retrieval permission leak, unsafe tool call, sensitive context exposure, or missing refusal test. Evidence must come from abuse-path test script, prompt-injection result log, retrieval access-control matrix.
Required data: abuse-path test script; prompt-injection result log; retrieval access-control matrix; sensitive response examples; security triage ticket; work request brief; approval deadline note
Artifact: AI Security Abuse-Path Test Report - Routine Work Record
Artifact structure: case summary; expected vs actual numbers; threshold rule; evidence table from abuse-path test script, prompt-injection result log, retrieval access-control matrix; root-cause hypothesis; decision/action; risk note; role handoff.
Evidence fields to assess: captures expected 24,990 and actual 23,013 tests; calculates or explains 7.9% variance; uses threshold rule correctly (critical abuse paths must have 0 data-exposure passes); cites at least three input documents; links evidence to root-cause hypothesis; states clear release/hold/correct/escalate decision.
AI support tips: Use AI as a coach to ask evidence-checking questions, explain unfamiliar terms, compare possible root causes, and improve clarity. Do not use AI to invent numbers or make the decision without citing the provided documents.',
  1,
  '10 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech AI & Data Science - Responsible AI Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-072' LIMIT 1),
  'B.Tech AI & Data Science - Responsible AI Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech CSE - AI Security / Governance Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-072' LIMIT 1),
  'B.Tech CSE - AI Security / Governance Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MBA Business Analytics - AI Risk & Governance Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-072' LIMIT 1),
  'MBA Business Analytics - AI Risk & Governance Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: LL.B / Tech Law - Data Privacy & AI Governance Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-072' LIMIT 1),
  'LL.B / Tech Law - Data Privacy & AI Governance Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PG Certificate - Responsible AI, Risk & Compliance
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-072' LIMIT 1),
  'PG Certificate - Responsible AI, Risk & Compliance',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Complete a Routine GenAI Feature Specification Workplace Case
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Complete a Routine GenAI Feature Specification Workplace Case',
  'CRS-IND-CL-077',
  'By the end of this course, the learner can complete a routine case in GenAI Feature Specification by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact. Workplace problem: A routine work request arrives for support-agent copilot specification, and a GenAI product feature shows unclear feature scope and missing acceptance criteria. The expected volume is 26,154 stories, but only 24,068 stories are usable, creating a 8.0% variance against the control expectation. 6 stories allow auto-send without human confirmation and 5 lack hallucination-control criteria. The accepted rule is: all high-priority stories need measurable acceptance criteria and risk notes. The learner receives product requirement brief, conversation journey map, acceptance criteria draft, risk-control checklist, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the GenAI Feature Specification Pack. The learner must independently reconcile the supplied records, decide whether the case is acceptable, and document the action. Artifact: GenAI Feature Specification Pack - Routine Work Record.',
  '10 hours',
  'Active',
  'AI Product & GenAI Application Development',
  'technical',
  '["By the end of this course, the learner can complete a routine case in GenAI Feature Specification by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact","Learner demonstrates GenAI Feature Specification by interpreting real-looking numbers, comparing evidence from product requirement brief and conversation journey map, and producing a decision-ready artifact","Proves the learner can perform routine execution work in GenAI Feature Specification with numeric evidence, workplace documents, and a reviewer-ready artifact. Status: Demo Ready"]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L2 Module: GenAI Feature Specification Workplace Mission
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-077' LIMIT 1),
  'L2 Module: GenAI Feature Specification Workplace Mission',
  'Industry requirement: Teams responsible for a GenAI product feature need learners who can use numeric evidence, threshold rules, and workplace documents to make reliable decisions during support-agent copilot specification, not only explain GenAI Feature Specification theoretically. Gap addressed: Academic learning may cover the concepts behind GenAI Feature Specification, but it usually does not make learners practice with product requirement brief, conversation journey map, acceptance criteria draft, numeric variance, threshold decisions, and role handoff artifacts. Trigger: team assigns the learner a routine work request before sign-off: 24,068 of 26,154 stories passed the check, variance 8.0%, with signal ''unclear feature scope and missing acceptance criteria''.',
  1,
  '["Data & AI","AI Product & GenAI Application Development","GenAI Feature Specification","Primary: Functional. Supporting: Cognitive, Communication, AI/Digital","GenAI feature boundary","human-in-the-loop acceptance","hallucination control","prompt workflow requirement","success metric definition","expected 26,154 vs actual 24,068 stories","8.0% variance interpretation","threshold rule: all high-priority stories need measurable acceptance criteria and risk notes","routine evidence reconciliation","release/hold action logic"]'::jsonb,
  '["Engage: Learner receives a routine execution case: support-agent copilot specification is at risk because only 24,068 of 26,154 stories passed the control and unclear feature scope and missing acceptance criteria is visible","Explore: Learner reviews product requirement brief, conversation journey map, acceptance criteria draft, risk-control checklist, stakeholder feedback notes, highlights the fields that prove the issue, and notes which values cross the threshold","Explain: Learner studies GenAI feature boundary, human-in-the-loop acceptance, hallucination control, prompt workflow requirement and learns how these concepts explain the business risk, not just the technical error","Express: Learner prepares the GenAI Feature Specification Pack with issue summary, numeric evidence, root-cause hypothesis, decision, and handoff note","Empower: Learner must select release, hold, correct, or escalate with evidence for support-agent copilot specification","Evolve: Learner records one improvement to make routine support-agent copilot specification handling faster and clearer"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Scenario: GenAI Feature Specification Pack - Routine Work Record
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-077' LIMIT 1)
   AND title = 'L2 Module: GenAI Feature Specification Workplace Mission' LIMIT 1),
  'Workplace Scenario: GenAI Feature Specification Pack - Routine Work Record',
  'A routine work request arrives for support-agent copilot specification, and a GenAI product feature shows unclear feature scope and missing acceptance criteria. The expected volume is 26,154 stories, but only 24,068 stories are usable, creating a 8.0% variance against the control expectation. 6 stories allow auto-send without human confirmation and 5 lack hallucination-control criteria. The accepted rule is: all high-priority stories need measurable acceptance criteria and risk notes. The learner receives product requirement brief, conversation journey map, acceptance criteria draft, risk-control checklist, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the GenAI Feature Specification Pack. The learner must independently reconcile the supplied records, decide whether the case is acceptable, and document the action. Pressure points: Support-agent copilot specification is time-sensitive; variance is 8.0% against the rule; 6 stories allow auto-send without human confirmation and 5 lack hallucination-control criteria; routine sign-off is waiting and a wrong decision can block downstream users.',
  'Course trigger: team assigns the learner a routine work request before sign-off: 24,068 of 26,154 stories passed the check, variance 8.0%, with signal ''unclear feature scope and missing acceptance criteria''.
Problem statement: A routine work request arrives for support-agent copilot specification, and a GenAI product feature shows unclear feature scope and missing acceptance criteria. The expected volume is 26,154 stories, but only 24,068 stories are usable, creating a 8.0% variance against the control expectation. 6 stories allow auto-send without human confirmation and 5 lack hallucination-control criteria. The accepted rule is: all high-priority stories need measurable acceptance criteria and risk notes. The learner receives product requirement brief, conversation journey map, acceptance criteria draft, risk-control checklist, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the GenAI Feature Specification Pack. The learner must independently reconcile the supplied records, decide whether the case is acceptable, and document the action.
Major concepts: GenAI feature boundary; human-in-the-loop acceptance; hallucination control; prompt workflow requirement; success metric definition; expected 26,154 vs actual 24,068 stories; 8.0% variance interpretation; threshold rule: all high-priority stories need measurable acceptance criteria and risk notes; routine evidence reconciliation; release/hold action logic.
Root-cause focus: Compare the routine evidence to decide whether the likely cause is: unclear user workflow, missing acceptance criteria, unsafe automation boundary, hallucination-control gap, or unmeasured success metric. Evidence must come from product requirement brief, conversation journey map, acceptance criteria draft.
Required data: product requirement brief; conversation journey map; acceptance criteria draft; risk-control checklist; stakeholder feedback notes; work request brief; approval deadline note
Artifact: GenAI Feature Specification Pack - Routine Work Record
Artifact structure: case summary; expected vs actual numbers; threshold rule; evidence table from product requirement brief, conversation journey map, acceptance criteria draft; root-cause hypothesis; decision/action; risk note; role handoff.
Evidence fields to assess: captures expected 26,154 and actual 24,068 stories; calculates or explains 8.0% variance; uses threshold rule correctly (all high-priority stories need measurable acceptance criteria and risk notes); cites at least three input documents; links evidence to root-cause hypothesis; states clear release/hold/correct/escalate decision.
AI support tips: Use AI as a coach to ask evidence-checking questions, explain unfamiliar terms, compare possible root causes, and improve clarity. Do not use AI to invent numbers or make the decision without citing the provided documents.',
  1,
  '10 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech CSE - AI & Machine Learning Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-077' LIMIT 1),
  'B.Tech CSE - AI & Machine Learning Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech AI & Data Science - ML Engineering Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-077' LIMIT 1),
  'B.Tech AI & Data Science - ML Engineering Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Tech AI / Machine Learning Engineering
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-077' LIMIT 1),
  'M.Tech AI / Machine Learning Engineering',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Sc AI & Machine Learning
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-077' LIMIT 1),
  'M.Sc AI & Machine Learning',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MCA - AI / ML Application Development
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-077' LIMIT 1),
  'MCA - AI / ML Application Development',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech CSE - AI Product Engineering Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-077' LIMIT 1),
  'B.Tech CSE - AI Product Engineering Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Complete a Routine Human-AI Workflow Validation Workplace Case
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Complete a Routine Human-AI Workflow Validation Workplace Case',
  'CRS-IND-CL-082',
  'By the end of this course, the learner can complete a routine case in Human-AI Workflow Validation by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact. Workplace problem: A routine work request arrives for claims processing copilot validation, and a human-AI workflow shows user overrides and trust failures in assisted decisions. The expected volume is 33,090 suggestions, but only 30,362 suggestions are usable, creating a 8.2% variance against the control expectation. Adjusters reject 18% of suggestions and 23 comments cite missing evidence in the AI explanation. The accepted rule is: unexplained override rate above 12% requires workflow review. The learner receives user edit log, AI suggestion sample, override reason summary, workflow step map, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Human-AI Workflow Validation Report. The learner must independently reconcile the supplied records, decide whether the case is acceptable, and document the action. Artifact: Human-AI Workflow Validation Report - Routine Work Record.',
  '10 hours',
  'Active',
  'AI Product & GenAI Application Development',
  'technical',
  '["By the end of this course, the learner can complete a routine case in Human-AI Workflow Validation by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact","Learner demonstrates Human-AI Workflow Validation by interpreting real-looking numbers, comparing evidence from user edit log and AI suggestion sample, and producing a decision-ready artifact","Proves the learner can perform routine execution work in Human-AI Workflow Validation with numeric evidence, workplace documents, and a reviewer-ready artifact. Status: Demo Ready"]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L2 Module: Human-AI Workflow Validation Workplace Mission
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-082' LIMIT 1),
  'L2 Module: Human-AI Workflow Validation Workplace Mission',
  'Industry requirement: Teams responsible for a human-AI workflow need learners who can use numeric evidence, threshold rules, and workplace documents to make reliable decisions during claims processing copilot validation, not only explain Human-AI Workflow Validation theoretically. Gap addressed: Academic learning may cover the concepts behind Human-AI Workflow Validation, but it usually does not make learners practice with user edit log, AI suggestion sample, override reason summary, numeric variance, threshold decisions, and role handoff artifacts. Trigger: team assigns the learner a routine work request before sign-off: 30,362 of 33,090 suggestions passed the check, variance 8.2%, with signal ''user overrides and trust failures in assisted decisions''.',
  1,
  '["Data & AI","AI Product & GenAI Application Development","Human-AI Workflow Validation","Primary: Functional. Supporting: Cognitive, Communication, AI/Digital","human override pattern","trust signal analysis","AI explanation quality","workflow friction point","human-in-the-loop validation","expected 33,090 vs actual 30,362 suggestions","8.2% variance interpretation","threshold rule: unexplained override rate above 12% requires workflow review","routine evidence reconciliation","release/hold action logic"]'::jsonb,
  '["Engage: Learner receives a routine execution case: claims processing copilot validation is at risk because only 30,362 of 33,090 suggestions passed the control and user overrides and trust failures in assisted decisions is visible","Explore: Learner reviews user edit log, AI suggestion sample, override reason summary, workflow step map, trust feedback notes, highlights the fields that prove the issue, and notes which values cross the threshold","Explain: Learner studies human override pattern, trust signal analysis, AI explanation quality, workflow friction point and learns how these concepts explain the business risk, not just the technical error","Express: Learner prepares the Human-AI Workflow Validation Report with issue summary, numeric evidence, root-cause hypothesis, decision, and handoff note","Empower: Learner must select release, hold, correct, or escalate with evidence for claims processing copilot validation","Evolve: Learner records one improvement to make routine claims processing copilot validation handling faster and clearer"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Scenario: Human-AI Workflow Validation Report - Routine Work Record
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-082' LIMIT 1)
   AND title = 'L2 Module: Human-AI Workflow Validation Workplace Mission' LIMIT 1),
  'Workplace Scenario: Human-AI Workflow Validation Report - Routine Work Record',
  'A routine work request arrives for claims processing copilot validation, and a human-AI workflow shows user overrides and trust failures in assisted decisions. The expected volume is 33,090 suggestions, but only 30,362 suggestions are usable, creating a 8.2% variance against the control expectation. Adjusters reject 18% of suggestions and 23 comments cite missing evidence in the AI explanation. The accepted rule is: unexplained override rate above 12% requires workflow review. The learner receives user edit log, AI suggestion sample, override reason summary, workflow step map, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Human-AI Workflow Validation Report. The learner must independently reconcile the supplied records, decide whether the case is acceptable, and document the action. Pressure points: Claims processing copilot validation is time-sensitive; variance is 8.2% against the rule; adjusters reject 18% of suggestions and 23 comments cite missing evidence in the AI explanation; routine sign-off is waiting and a wrong decision can block downstream users.',
  'Course trigger: team assigns the learner a routine work request before sign-off: 30,362 of 33,090 suggestions passed the check, variance 8.2%, with signal ''user overrides and trust failures in assisted decisions''.
Problem statement: A routine work request arrives for claims processing copilot validation, and a human-AI workflow shows user overrides and trust failures in assisted decisions. The expected volume is 33,090 suggestions, but only 30,362 suggestions are usable, creating a 8.2% variance against the control expectation. Adjusters reject 18% of suggestions and 23 comments cite missing evidence in the AI explanation. The accepted rule is: unexplained override rate above 12% requires workflow review. The learner receives user edit log, AI suggestion sample, override reason summary, workflow step map, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Human-AI Workflow Validation Report. The learner must independently reconcile the supplied records, decide whether the case is acceptable, and document the action.
Major concepts: human override pattern; trust signal analysis; AI explanation quality; workflow friction point; human-in-the-loop validation; expected 33,090 vs actual 30,362 suggestions; 8.2% variance interpretation; threshold rule: unexplained override rate above 12% requires workflow review; routine evidence reconciliation; release/hold action logic.
Root-cause focus: Compare the routine evidence to decide whether the likely cause is: AI suggestion lacks evidence, workflow step mismatch, unclear confidence signal, bad handoff timing, or user trust gap. Evidence must come from user edit log, AI suggestion sample, override reason summary.
Required data: user edit log; AI suggestion sample; override reason summary; workflow step map; trust feedback notes; work request brief; approval deadline note
Artifact: Human-AI Workflow Validation Report - Routine Work Record
Artifact structure: case summary; expected vs actual numbers; threshold rule; evidence table from user edit log, AI suggestion sample, override reason summary; root-cause hypothesis; decision/action; risk note; role handoff.
Evidence fields to assess: captures expected 33,090 and actual 30,362 suggestions; calculates or explains 8.2% variance; uses threshold rule correctly (unexplained override rate above 12% requires workflow review); cites at least three input documents; links evidence to root-cause hypothesis; states clear release/hold/correct/escalate decision.
AI support tips: Use AI as a coach to ask evidence-checking questions, explain unfamiliar terms, compare possible root causes, and improve clarity. Do not use AI to invent numbers or make the decision without citing the provided documents.',
  1,
  '10 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech CSE - AI & Machine Learning Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-082' LIMIT 1),
  'B.Tech CSE - AI & Machine Learning Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech AI & Data Science - ML Engineering Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-082' LIMIT 1),
  'B.Tech AI & Data Science - ML Engineering Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Tech AI / Machine Learning Engineering
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-082' LIMIT 1),
  'M.Tech AI / Machine Learning Engineering',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Sc AI & Machine Learning
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-082' LIMIT 1),
  'M.Sc AI & Machine Learning',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MCA - AI / ML Application Development
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-082' LIMIT 1),
  'MCA - AI / ML Application Development',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech CSE - AI Product Engineering Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-082' LIMIT 1),
  'B.Tech CSE - AI Product Engineering Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Complete a Routine Applied Industry AI Configuration Workplace Case
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Complete a Routine Applied Industry AI Configuration Workplace Case',
  'CRS-IND-CL-087',
  'By the end of this course, the learner can complete a routine case in Applied Industry AI Configuration by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact. Workplace problem: A routine work request arrives for healthcare triage model configuration, and an applied industry AI solution shows vertical workflow mismatch and weak local configuration. The expected volume is 28,946 rules, but only 26,596 rules are usable, creating a 8.1% variance against the control expectation. Triage priority rules misclassify 7 high-risk cases and local escalation SLA is missing for night shifts. The accepted rule is: critical workflow rules must match domain protocol before pilot. The learner receives vertical workflow requirement, configuration rule sheet, domain protocol extract, pilot case sample, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Applied Industry AI Configuration Review. The learner must independently reconcile the supplied records, decide whether the case is acceptable, and document the action. Artifact: Applied Industry AI Configuration Review - Routine Work Record.',
  '10 hours',
  'Active',
  'Applied Industry AI Solutions; Computer Vision & Multimodal AI Engineering',
  'technical',
  '["By the end of this course, the learner can complete a routine case in Applied Industry AI Configuration by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact","Learner demonstrates Applied Industry AI Configuration by interpreting real-looking numbers, comparing evidence from vertical workflow requirement and configuration rule sheet, and producing a decision-ready artifact","Proves the learner can perform routine execution work in Applied Industry AI Configuration with numeric evidence, workplace documents, and a reviewer-ready artifact. Status: Demo Ready"]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L2 Module: Applied Industry AI Configuration Workplace Mission
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-087' LIMIT 1),
  'L2 Module: Applied Industry AI Configuration Workplace Mission',
  'Industry requirement: Teams responsible for an applied industry AI solution need learners who can use numeric evidence, threshold rules, and workplace documents to make reliable decisions during healthcare triage model configuration, not only explain Applied Industry AI Configuration theoretically. Gap addressed: Academic learning may cover the concepts behind Applied Industry AI Configuration, but it usually does not make learners practice with vertical workflow requirement, configuration rule sheet, domain protocol extract, numeric variance, threshold decisions, and role handoff artifacts. Trigger: team assigns the learner a routine work request before sign-off: 26,596 of 28,946 rules passed the check, variance 8.1%, with signal ''vertical workflow mismatch and weak local configuration''.',
  1,
  '["Data & AI","Applied Industry AI Solutions","Computer Vision & Multimodal AI Engineering","Applied Industry AI Configuration","Primary: Evidence. Supporting: Technical, Functional, Domain","vertical AI configuration","domain protocol mapping","local workflow adaptation","pilot validation evidence","configuration risk","expected 28,946 vs actual 26,596 rules","8.1% variance interpretation","threshold rule: critical workflow rules must match domain protocol before pilot","routine evidence reconciliation","release/hold action logic"]'::jsonb,
  '["Engage: Learner receives a routine execution case: healthcare triage model configuration is at risk because only 26,596 of 28,946 rules passed the control and vertical workflow mismatch and weak local configuration is visible","Explore: Learner reviews vertical workflow requirement, configuration rule sheet, domain protocol extract, pilot case sample, stakeholder validation note, highlights the fields that prove the issue, and notes which values cross the threshold","Explain: Learner studies vertical AI configuration, domain protocol mapping, local workflow adaptation, pilot validation evidence and learns how these concepts explain the business risk, not just the technical error","Express: Learner prepares the Applied Industry AI Configuration Review with issue summary, numeric evidence, root-cause hypothesis, decision, and handoff note","Empower: Learner must select release, hold, correct, or escalate with evidence for healthcare triage model configuration","Evolve: Learner records one improvement to make routine healthcare triage model configuration handling faster and clearer"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Scenario: Applied Industry AI Configuration Review - Routine Work Record
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-087' LIMIT 1)
   AND title = 'L2 Module: Applied Industry AI Configuration Workplace Mission' LIMIT 1),
  'Workplace Scenario: Applied Industry AI Configuration Review - Routine Work Record',
  'A routine work request arrives for healthcare triage model configuration, and an applied industry AI solution shows vertical workflow mismatch and weak local configuration. The expected volume is 28,946 rules, but only 26,596 rules are usable, creating a 8.1% variance against the control expectation. Triage priority rules misclassify 7 high-risk cases and local escalation SLA is missing for night shifts. The accepted rule is: critical workflow rules must match domain protocol before pilot. The learner receives vertical workflow requirement, configuration rule sheet, domain protocol extract, pilot case sample, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Applied Industry AI Configuration Review. The learner must independently reconcile the supplied records, decide whether the case is acceptable, and document the action. Pressure points: Healthcare triage model configuration is time-sensitive; variance is 8.1% against the rule; triage priority rules misclassify 7 high-risk cases and local escalation SLA is missing for night shifts; routine sign-off is waiting and a wrong decision can block downstream users.',
  'Course trigger: team assigns the learner a routine work request before sign-off: 26,596 of 28,946 rules passed the check, variance 8.1%, with signal ''vertical workflow mismatch and weak local configuration''.
Problem statement: A routine work request arrives for healthcare triage model configuration, and an applied industry AI solution shows vertical workflow mismatch and weak local configuration. The expected volume is 28,946 rules, but only 26,596 rules are usable, creating a 8.1% variance against the control expectation. Triage priority rules misclassify 7 high-risk cases and local escalation SLA is missing for night shifts. The accepted rule is: critical workflow rules must match domain protocol before pilot. The learner receives vertical workflow requirement, configuration rule sheet, domain protocol extract, pilot case sample, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Applied Industry AI Configuration Review. The learner must independently reconcile the supplied records, decide whether the case is acceptable, and document the action.
Major concepts: vertical AI configuration; domain protocol mapping; local workflow adaptation; pilot validation evidence; configuration risk; expected 28,946 vs actual 26,596 rules; 8.1% variance interpretation; threshold rule: critical workflow rules must match domain protocol before pilot; routine evidence reconciliation; release/hold action logic.
Root-cause focus: Compare the routine evidence to decide whether the likely cause is: wrong domain rule, local workflow mismatch, missing escalation path, insufficient pilot evidence, or unsupported edge case. Evidence must come from vertical workflow requirement, configuration rule sheet, domain protocol extract.
Required data: vertical workflow requirement; configuration rule sheet; domain protocol extract; pilot case sample; stakeholder validation note; work request brief; approval deadline note
Artifact: Applied Industry AI Configuration Review - Routine Work Record
Artifact structure: case summary; expected vs actual numbers; threshold rule; evidence table from vertical workflow requirement, configuration rule sheet, domain protocol extract; root-cause hypothesis; decision/action; risk note; role handoff.
Evidence fields to assess: captures expected 28,946 and actual 26,596 rules; calculates or explains 8.1% variance; uses threshold rule correctly (critical workflow rules must match domain protocol before pilot); cites at least three input documents; links evidence to root-cause hypothesis; states clear release/hold/correct/escalate decision.
AI support tips: Use AI as a coach to ask evidence-checking questions, explain unfamiliar terms, compare possible root causes, and improve clarity. Do not use AI to invent numbers or make the decision without citing the provided documents.',
  1,
  '10 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech CSE - AI Product Engineering Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-087' LIMIT 1),
  'B.Tech CSE - AI Product Engineering Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech AI & Data Science - GenAI Application Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-087' LIMIT 1),
  'B.Tech AI & Data Science - GenAI Application Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MCA - AI Application Development Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-087' LIMIT 1),
  'MCA - AI Application Development Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MBA Product Management / Business Analytics - AI Product Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-087' LIMIT 1),
  'MBA Product Management / Business Analytics - AI Product Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PG Certificate - GenAI Product & Application Design
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-087' LIMIT 1),
  'PG Certificate - GenAI Product & Application Design',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech AI & Data Science - Applied Industry AI Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-087' LIMIT 1),
  'B.Tech AI & Data Science - Applied Industry AI Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Complete a Routine Enterprise AI Adoption Roadmap Design Workplace Case
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Complete a Routine Enterprise AI Adoption Roadmap Design Workplace Case',
  'CRS-IND-CL-092',
  'By the end of this course, the learner can complete a routine case in Enterprise AI Adoption Roadmap Design by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact. Workplace problem: A routine work request arrives for business-unit AI portfolio planning, and an enterprise AI adoption roadmap shows unprioritized initiatives with unclear feasibility and risk. The expected volume is 30,272 initiatives, but only 27,789 initiatives are usable, creating a 8.2% variance against the control expectation. 11 initiatives have high claimed value but no data-owner confirmation or adoption dependency map. The accepted rule is: phase-one initiatives must show value, feasibility, data readiness, and risk control. The learner receives AI initiative inventory, value-feasibility scoring sheet, data readiness checklist, risk dependency map, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Enterprise AI Adoption Roadmap Decision Pack. The learner must independently reconcile the supplied records, decide whether the case is acceptable, and document the action. Artifact: Enterprise AI Adoption Roadmap Decision Pack - Routine Work Record.',
  '10 hours',
  'Active',
  'AI Adoption, Transformation, and Stakeholder Enablement',
  'technical',
  '["By the end of this course, the learner can complete a routine case in Enterprise AI Adoption Roadmap Design by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact","Learner demonstrates Enterprise AI Adoption Roadmap Design by interpreting real-looking numbers, comparing evidence from AI initiative inventory and value-feasibility scoring sheet, and producing a decision-ready artifact","Proves the learner can perform routine execution work in Enterprise AI Adoption Roadmap Design with numeric evidence, workplace documents, and a reviewer-ready artifact. Status: Demo Ready"]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L2 Module: Enterprise AI Adoption Roadmap Design Workplace Mission
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-092' LIMIT 1),
  'L2 Module: Enterprise AI Adoption Roadmap Design Workplace Mission',
  'Industry requirement: Teams responsible for an enterprise AI adoption roadmap need learners who can use numeric evidence, threshold rules, and workplace documents to make reliable decisions during business-unit AI portfolio planning, not only explain Enterprise AI Adoption Roadmap Design theoretically. Gap addressed: Academic learning may cover the concepts behind Enterprise AI Adoption Roadmap Design, but it usually does not make learners practice with AI initiative inventory, value-feasibility scoring sheet, data readiness checklist, numeric variance, threshold decisions, and role handoff artifacts. Trigger: team assigns the learner a routine work request before sign-off: 27,789 of 30,272 initiatives passed the check, variance 8.2%, with signal ''unprioritized initiatives with unclear feasibility and risk''.',
  1,
  '["Data & AI","AI Consulting & Transformation","AI Adoption, Transformation, and Stakeholder Enablement","Enterprise AI Adoption Roadmap Design","Primary: Functional. Supporting: Cognitive, Communication, AI/Digital","AI use-case prioritization","value-feasibility scoring","data readiness dependency","adoption risk","roadmap phasing","expected 30,272 vs actual 27,789 initiatives","8.2% variance interpretation","threshold rule: phase-one initiatives must show value, feasibility, data readiness, and risk control","routine evidence reconciliation","release/hold action logic"]'::jsonb,
  '["Engage: Learner receives a routine execution case: business-unit AI portfolio planning is at risk because only 27,789 of 30,272 initiatives passed the control and unprioritized initiatives with unclear feasibility and risk is visible","Explore: Learner reviews AI initiative inventory, value-feasibility scoring sheet, data readiness checklist, risk dependency map, stakeholder prioritization notes, highlights the fields that prove the issue, and notes which values cross the threshold","Explain: Learner studies AI use-case prioritization, value-feasibility scoring, data readiness dependency, adoption risk and learns how these concepts explain the business risk, not just the technical error","Express: Learner prepares the Enterprise AI Adoption Roadmap Decision Pack with issue summary, numeric evidence, root-cause hypothesis, decision, and handoff note","Empower: Learner must select release, hold, correct, or escalate with evidence for business-unit AI portfolio planning","Evolve: Learner records one improvement to make routine business-unit AI portfolio planning handling faster and clearer"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Scenario: Enterprise AI Adoption Roadmap Decision Pack - Routine Work Record
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-092' LIMIT 1)
   AND title = 'L2 Module: Enterprise AI Adoption Roadmap Design Workplace Mission' LIMIT 1),
  'Workplace Scenario: Enterprise AI Adoption Roadmap Decision Pack - Routine Work Record',
  'A routine work request arrives for business-unit AI portfolio planning, and an enterprise AI adoption roadmap shows unprioritized initiatives with unclear feasibility and risk. The expected volume is 30,272 initiatives, but only 27,789 initiatives are usable, creating a 8.2% variance against the control expectation. 11 initiatives have high claimed value but no data-owner confirmation or adoption dependency map. The accepted rule is: phase-one initiatives must show value, feasibility, data readiness, and risk control. The learner receives AI initiative inventory, value-feasibility scoring sheet, data readiness checklist, risk dependency map, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Enterprise AI Adoption Roadmap Decision Pack. The learner must independently reconcile the supplied records, decide whether the case is acceptable, and document the action. Pressure points: Business-unit ai portfolio planning is time-sensitive; variance is 8.2% against the rule; 11 initiatives have high claimed value but no data-owner confirmation or adoption dependency map; routine sign-off is waiting and a wrong decision can block downstream users.',
  'Course trigger: team assigns the learner a routine work request before sign-off: 27,789 of 30,272 initiatives passed the check, variance 8.2%, with signal ''unprioritized initiatives with unclear feasibility and risk''.
Problem statement: A routine work request arrives for business-unit AI portfolio planning, and an enterprise AI adoption roadmap shows unprioritized initiatives with unclear feasibility and risk. The expected volume is 30,272 initiatives, but only 27,789 initiatives are usable, creating a 8.2% variance against the control expectation. 11 initiatives have high claimed value but no data-owner confirmation or adoption dependency map. The accepted rule is: phase-one initiatives must show value, feasibility, data readiness, and risk control. The learner receives AI initiative inventory, value-feasibility scoring sheet, data readiness checklist, risk dependency map, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Enterprise AI Adoption Roadmap Decision Pack. The learner must independently reconcile the supplied records, decide whether the case is acceptable, and document the action.
Major concepts: AI use-case prioritization; value-feasibility scoring; data readiness dependency; adoption risk; roadmap phasing; expected 30,272 vs actual 27,789 initiatives; 8.2% variance interpretation; threshold rule: phase-one initiatives must show value, feasibility, data readiness, and risk control; routine evidence reconciliation; release/hold action logic.
Root-cause focus: Compare the routine evidence to decide whether the likely cause is: inflated business value, weak data readiness, missing sponsor, unplanned change-management effort, or unmapped risk dependency. Evidence must come from AI initiative inventory, value-feasibility scoring sheet, data readiness checklist.
Required data: AI initiative inventory; value-feasibility scoring sheet; data readiness checklist; risk dependency map; stakeholder prioritization notes; work request brief; approval deadline note
Artifact: Enterprise AI Adoption Roadmap Decision Pack - Routine Work Record
Artifact structure: case summary; expected vs actual numbers; threshold rule; evidence table from AI initiative inventory, value-feasibility scoring sheet, data readiness checklist; root-cause hypothesis; decision/action; risk note; role handoff.
Evidence fields to assess: captures expected 30,272 and actual 27,789 initiatives; calculates or explains 8.2% variance; uses threshold rule correctly (phase-one initiatives must show value, feasibility, data readiness, and risk control); cites at least three input documents; links evidence to root-cause hypothesis; states clear release/hold/correct/escalate decision.
AI support tips: Use AI as a coach to ask evidence-checking questions, explain unfamiliar terms, compare possible root causes, and improve clarity. Do not use AI to invent numbers or make the decision without citing the provided documents.',
  1,
  '10 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MBA Business Analytics - AI Transformation Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-092' LIMIT 1),
  'MBA Business Analytics - AI Transformation Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BBA Business Analytics - AI Adoption Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-092' LIMIT 1),
  'BBA Business Analytics - AI Adoption Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech AI & Data Science - AI Consulting Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-092' LIMIT 1),
  'B.Tech AI & Data Science - AI Consulting Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PG Certificate - AI Strategy & Transformation
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-092' LIMIT 1),
  'PG Certificate - AI Strategy & Transformation',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: Executive Program - AI Adoption & Change Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-092' LIMIT 1),
  'Executive Program - AI Adoption & Change Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Complete a Routine AI Training Data Quality Control Workplace Case
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Complete a Routine AI Training Data Quality Control Workplace Case',
  'CRS-IND-CL-097',
  'By the end of this course, the learner can complete a routine case in AI Training Data Quality Control by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact. Workplace problem: A routine work request arrives for dataset release quality gate, and an AI training data labeling operation shows label disagreement and quality-control failure. The expected volume is 107,600 records, but only 97,950 records are usable, creating a 9.0% variance against the control expectation. Inter-annotator agreement is 84% for safety labels and 1,260 records have unresolved adjudication. The accepted rule is: critical label agreement must exceed 92% before release. The learner receives labeling guideline, annotator disagreement report, gold-standard sample, adjudication queue, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the AI Training Data Quality Control Pack. The learner must independently reconcile the supplied records, decide whether the case is acceptable, and document the action. Artifact: AI Training Data Quality Control Pack - Routine Work Record.',
  '10 hours',
  'Active',
  'Synthetic Data, Labeling & Semantic Operations',
  'technical',
  '["By the end of this course, the learner can complete a routine case in AI Training Data Quality Control by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact","Learner demonstrates AI Training Data Quality Control by interpreting real-looking numbers, comparing evidence from labeling guideline and annotator disagreement report, and producing a decision-ready artifact","Proves the learner can perform routine execution work in AI Training Data Quality Control with numeric evidence, workplace documents, and a reviewer-ready artifact. Status: Pilot Ready — Evidence Strengthening Needed"]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L2 Module: AI Training Data Quality Control Workplace Mission
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-097' LIMIT 1),
  'L2 Module: AI Training Data Quality Control Workplace Mission',
  'Industry requirement: Teams responsible for an AI training data labeling operation need learners who can use numeric evidence, threshold rules, and workplace documents to make reliable decisions during dataset release quality gate, not only explain AI Training Data Quality Control theoretically. Gap addressed: Academic learning may cover the concepts behind AI Training Data Quality Control, but it usually does not make learners practice with labeling guideline, annotator disagreement report, gold-standard sample, numeric variance, threshold decisions, and role handoff artifacts. Trigger: team assigns the learner a routine work request before sign-off: 97,950 of 107,600 records passed the check, variance 9.0%, with signal ''label disagreement and quality-control failure''.',
  1,
  '["Data & AI","Synthetic Data, Labeling & Semantic Operations","AI Training Data Quality Control","Primary: Evidence. Supporting: Domain, Technical, AI/Digital","inter-annotator agreement","gold-standard validation","label adjudication","dataset release threshold","annotation quality audit","expected 107,600 vs actual 97,950 records","9.0% variance interpretation","threshold rule: critical label agreement must exceed 92% before release","routine evidence reconciliation","release/hold action logic"]'::jsonb,
  '["Engage: Learner receives a routine execution case: dataset release quality gate is at risk because only 97,950 of 107,600 records passed the control and label disagreement and quality-control failure is visible","Explore: Learner reviews labeling guideline, annotator disagreement report, gold-standard sample, adjudication queue, dataset release checklist, highlights the fields that prove the issue, and notes which values cross the threshold","Explain: Learner studies inter-annotator agreement, gold-standard validation, label adjudication, dataset release threshold and learns how these concepts explain the business risk, not just the technical error","Express: Learner prepares the AI Training Data Quality Control Pack with issue summary, numeric evidence, root-cause hypothesis, decision, and handoff note","Empower: Learner must select release, hold, correct, or escalate with evidence for dataset release quality gate","Evolve: Learner records one improvement to make routine dataset release quality gate handling faster and clearer"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Scenario: AI Training Data Quality Control Pack - Routine Work Record
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-097' LIMIT 1)
   AND title = 'L2 Module: AI Training Data Quality Control Workplace Mission' LIMIT 1),
  'Workplace Scenario: AI Training Data Quality Control Pack - Routine Work Record',
  'A routine work request arrives for dataset release quality gate, and an AI training data labeling operation shows label disagreement and quality-control failure. The expected volume is 107,600 records, but only 97,950 records are usable, creating a 9.0% variance against the control expectation. Inter-annotator agreement is 84% for safety labels and 1,260 records have unresolved adjudication. The accepted rule is: critical label agreement must exceed 92% before release. The learner receives labeling guideline, annotator disagreement report, gold-standard sample, adjudication queue, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the AI Training Data Quality Control Pack. The learner must independently reconcile the supplied records, decide whether the case is acceptable, and document the action. Pressure points: Dataset release quality gate is time-sensitive; variance is 9.0% against the rule; inter-annotator agreement is 84% for safety labels and 1,260 records have unresolved adjudication; routine sign-off is waiting and a wrong decision can block downstream users.',
  'Course trigger: team assigns the learner a routine work request before sign-off: 97,950 of 107,600 records passed the check, variance 9.0%, with signal ''label disagreement and quality-control failure''.
Problem statement: A routine work request arrives for dataset release quality gate, and an AI training data labeling operation shows label disagreement and quality-control failure. The expected volume is 107,600 records, but only 97,950 records are usable, creating a 9.0% variance against the control expectation. Inter-annotator agreement is 84% for safety labels and 1,260 records have unresolved adjudication. The accepted rule is: critical label agreement must exceed 92% before release. The learner receives labeling guideline, annotator disagreement report, gold-standard sample, adjudication queue, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the AI Training Data Quality Control Pack. The learner must independently reconcile the supplied records, decide whether the case is acceptable, and document the action.
Major concepts: inter-annotator agreement; gold-standard validation; label adjudication; dataset release threshold; annotation quality audit; expected 107,600 vs actual 97,950 records; 9.0% variance interpretation; threshold rule: critical label agreement must exceed 92% before release; routine evidence reconciliation; release/hold action logic.
Root-cause focus: Compare the routine evidence to decide whether the likely cause is: ambiguous labeling rule, annotator training gap, weak gold-standard sample, unresolved adjudication, or class imbalance. Evidence must come from labeling guideline, annotator disagreement report, gold-standard sample.
Required data: labeling guideline; annotator disagreement report; gold-standard sample; adjudication queue; dataset release checklist; work request brief; approval deadline note
Artifact: AI Training Data Quality Control Pack - Routine Work Record
Artifact structure: case summary; expected vs actual numbers; threshold rule; evidence table from labeling guideline, annotator disagreement report, gold-standard sample; root-cause hypothesis; decision/action; risk note; role handoff.
Evidence fields to assess: captures expected 107,600 and actual 97,950 records; calculates or explains 9.0% variance; uses threshold rule correctly (critical label agreement must exceed 92% before release); cites at least three input documents; links evidence to root-cause hypothesis; states clear release/hold/correct/escalate decision.
AI support tips: Use AI as a coach to ask evidence-checking questions, explain unfamiliar terms, compare possible root causes, and improve clarity. Do not use AI to invent numbers or make the decision without citing the provided documents.',
  1,
  '10 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech CSE - Data Engineering Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-097' LIMIT 1),
  'B.Tech CSE - Data Engineering Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech AI & Data Science - Data Platform Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-097' LIMIT 1),
  'B.Tech AI & Data Science - Data Platform Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Data Science - Data Engineering Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-097' LIMIT 1),
  'B.Sc Data Science - Data Engineering Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MCA - Data Engineering / Cloud Data Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-097' LIMIT 1),
  'MCA - Data Engineering / Cloud Data Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Tech Data Engineering / Big Data Systems
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-097' LIMIT 1),
  'M.Tech Data Engineering / Big Data Systems',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Data Science - Data Operations Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-097' LIMIT 1),
  'B.Sc Data Science - Data Operations Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Complete a Routine Semantic Knowledge Graph Validation Workplace Case
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Complete a Routine Semantic Knowledge Graph Validation Workplace Case',
  'CRS-IND-CL-102',
  'By the end of this course, the learner can complete a routine case in Semantic Knowledge Graph Validation by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact. Workplace problem: A routine work request arrives for entity-relation validation before search rollout, and a semantic knowledge graph shows duplicate entities and invalid relationships. The expected volume is 347,970 triples, but only 313,740 triples are usable, creating a 9.8% variance against the control expectation. 4,800 customer entities are duplicated and 2.9% of supplier-to-product edges violate ontology rules. The accepted rule is: critical relation errors must remain below 1% before rollout. The learner receives ontology rule sheet, entity resolution sample, relationship validation report, SPARQL error extract, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Semantic Knowledge Graph Validation Pack. The learner must independently reconcile the supplied records, decide whether the case is acceptable, and document the action. Artifact: Semantic Knowledge Graph Validation Pack - Routine Work Record.',
  '10 hours',
  'Active',
  'Synthetic Data, Labeling & Semantic Operations',
  'technical',
  '["By the end of this course, the learner can complete a routine case in Semantic Knowledge Graph Validation by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact","Learner demonstrates Semantic Knowledge Graph Validation by interpreting real-looking numbers, comparing evidence from ontology rule sheet and entity resolution sample, and producing a decision-ready artifact","Proves the learner can perform routine execution work in Semantic Knowledge Graph Validation with numeric evidence, workplace documents, and a reviewer-ready artifact. Status: Pilot Ready — Evidence Strengthening Needed"]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L2 Module: Semantic Knowledge Graph Validation Workplace Mission
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-102' LIMIT 1),
  'L2 Module: Semantic Knowledge Graph Validation Workplace Mission',
  'Industry requirement: Teams responsible for a semantic knowledge graph need learners who can use numeric evidence, threshold rules, and workplace documents to make reliable decisions during entity-relation validation before search rollout, not only explain Semantic Knowledge Graph Validation theoretically. Gap addressed: Academic learning may cover the concepts behind Semantic Knowledge Graph Validation, but it usually does not make learners practice with ontology rule sheet, entity resolution sample, relationship validation report, numeric variance, threshold decisions, and role handoff artifacts. Trigger: team assigns the learner a routine work request before sign-off: 313,740 of 347,970 triples passed the check, variance 9.8%, with signal ''duplicate entities and invalid relationships''.',
  1,
  '["Data & AI","Synthetic Data, Labeling & Semantic Operations","Semantic Knowledge Graph Validation","Primary: Evidence. Supporting: Domain, Technical, AI/Digital","entity resolution","ontology constraint","relationship validation","graph quality rule","semantic search impact","expected 347,970 vs actual 313,740 triples","9.8% variance interpretation","threshold rule: critical relation errors must remain below 1% before rollout","routine evidence reconciliation","release/hold action logic"]'::jsonb,
  '["Engage: Learner receives a routine execution case: entity-relation validation before search rollout is at risk because only 313,740 of 347,970 triples passed the control and duplicate entities and invalid relationships is visible","Explore: Learner reviews ontology rule sheet, entity resolution sample, relationship validation report, SPARQL error extract, search relevance issue log, highlights the fields that prove the issue, and notes which values cross the threshold","Explain: Learner studies entity resolution, ontology constraint, relationship validation, graph quality rule and learns how these concepts explain the business risk, not just the technical error","Express: Learner prepares the Semantic Knowledge Graph Validation Pack with issue summary, numeric evidence, root-cause hypothesis, decision, and handoff note","Empower: Learner must select release, hold, correct, or escalate with evidence for entity-relation validation before search rollout","Evolve: Learner records one improvement to make routine entity-relation validation before search rollout handling faster and clearer"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Scenario: Semantic Knowledge Graph Validation Pack - Routine Work Record
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-102' LIMIT 1)
   AND title = 'L2 Module: Semantic Knowledge Graph Validation Workplace Mission' LIMIT 1),
  'Workplace Scenario: Semantic Knowledge Graph Validation Pack - Routine Work Record',
  'A routine work request arrives for entity-relation validation before search rollout, and a semantic knowledge graph shows duplicate entities and invalid relationships. The expected volume is 347,970 triples, but only 313,740 triples are usable, creating a 9.8% variance against the control expectation. 4,800 customer entities are duplicated and 2.9% of supplier-to-product edges violate ontology rules. The accepted rule is: critical relation errors must remain below 1% before rollout. The learner receives ontology rule sheet, entity resolution sample, relationship validation report, SPARQL error extract, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Semantic Knowledge Graph Validation Pack. The learner must independently reconcile the supplied records, decide whether the case is acceptable, and document the action. Pressure points: Entity-relation validation before search rollout is time-sensitive; variance is 9.8% against the rule; 4,800 customer entities are duplicated and 2.9% of supplier-to-product edges violate ontology rules; routine sign-off is waiting and a wrong decision can block downstream users.',
  'Course trigger: team assigns the learner a routine work request before sign-off: 313,740 of 347,970 triples passed the check, variance 9.8%, with signal ''duplicate entities and invalid relationships''.
Problem statement: A routine work request arrives for entity-relation validation before search rollout, and a semantic knowledge graph shows duplicate entities and invalid relationships. The expected volume is 347,970 triples, but only 313,740 triples are usable, creating a 9.8% variance against the control expectation. 4,800 customer entities are duplicated and 2.9% of supplier-to-product edges violate ontology rules. The accepted rule is: critical relation errors must remain below 1% before rollout. The learner receives ontology rule sheet, entity resolution sample, relationship validation report, SPARQL error extract, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Semantic Knowledge Graph Validation Pack. The learner must independently reconcile the supplied records, decide whether the case is acceptable, and document the action.
Major concepts: entity resolution; ontology constraint; relationship validation; graph quality rule; semantic search impact; expected 347,970 vs actual 313,740 triples; 9.8% variance interpretation; threshold rule: critical relation errors must remain below 1% before rollout; routine evidence reconciliation; release/hold action logic.
Root-cause focus: Compare the routine evidence to decide whether the likely cause is: entity duplication, wrong relationship type, ontology constraint violation, stale source mapping, or weak synonym handling. Evidence must come from ontology rule sheet, entity resolution sample, relationship validation report.
Required data: ontology rule sheet; entity resolution sample; relationship validation report; SPARQL error extract; search relevance issue log; work request brief; approval deadline note
Artifact: Semantic Knowledge Graph Validation Pack - Routine Work Record
Artifact structure: case summary; expected vs actual numbers; threshold rule; evidence table from ontology rule sheet, entity resolution sample, relationship validation report; root-cause hypothesis; decision/action; risk note; role handoff.
Evidence fields to assess: captures expected 347,970 and actual 313,740 triples; calculates or explains 9.8% variance; uses threshold rule correctly (critical relation errors must remain below 1% before rollout); cites at least three input documents; links evidence to root-cause hypothesis; states clear release/hold/correct/escalate decision.
AI support tips: Use AI as a coach to ask evidence-checking questions, explain unfamiliar terms, compare possible root causes, and improve clarity. Do not use AI to invent numbers or make the decision without citing the provided documents.',
  1,
  '10 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech CSE - Data Engineering Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-102' LIMIT 1),
  'B.Tech CSE - Data Engineering Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech AI & Data Science - Data Platform Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-102' LIMIT 1),
  'B.Tech AI & Data Science - Data Platform Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Data Science - Data Engineering Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-102' LIMIT 1),
  'B.Sc Data Science - Data Engineering Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MCA - Data Engineering / Cloud Data Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-102' LIMIT 1),
  'MCA - Data Engineering / Cloud Data Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Tech Data Engineering / Big Data Systems
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-102' LIMIT 1),
  'M.Tech Data Engineering / Big Data Systems',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Data Science - Data Operations Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-102' LIMIT 1),
  'B.Sc Data Science - Data Operations Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Diagnose a Production Exception in Lakehouse Pipeline Controls
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Diagnose a Production Exception in Lakehouse Pipeline Controls',
  'CRS-IND-CL-003',
  'By the end of this course, the learner can diagnose an exception in Lakehouse Pipeline Controls by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact. Workplace problem: An exception case is raised during daily revenue dashboard refresh because a retail sales lakehouse pipeline shows conflicting evidence around bronze-to-silver load variance and a schema warning. The expected volume is 105,770 records, but only 92,040 records are usable, creating a 13.0% variance against the control expectation. The `discount_code` field is missing in 14% of rows and `customer_region` has a new APAC-South value. The accepted rule is: record variance must stay under 1.5%. The learner receives pipeline failure log, source file profile, schema comparison sheet, record completeness report, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Lakehouse Pipeline Control Exception Note. The learner must compare possible causes, select the most likely root cause, and prepare an escalation-ready artifact. Artifact: Lakehouse Pipeline Control Exception Note - Exception Diagnosis Pack.',
  '12 hours',
  'Active',
  'Data Engineering & Lakehouse Operations',
  'technical',
  '["By the end of this course, the learner can diagnose an exception in Lakehouse Pipeline Controls by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact","Learner demonstrates Lakehouse Pipeline Controls by interpreting real-looking numbers, comparing evidence from pipeline failure log and source file profile, and producing a decision-ready artifact","Proves the learner can perform exception diagnosis work in Lakehouse Pipeline Controls with numeric evidence, workplace documents, and a reviewer-ready artifact. Status: Demo Ready"]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L3 Module: Lakehouse Pipeline Controls Workplace Mission
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-003' LIMIT 1),
  'L3 Module: Lakehouse Pipeline Controls Workplace Mission',
  'Industry requirement: Teams responsible for a retail sales lakehouse pipeline need learners who can use numeric evidence, threshold rules, and workplace documents to make reliable decisions during daily revenue dashboard refresh, not only explain Lakehouse Pipeline Controls theoretically. Gap addressed: Academic learning may cover the concepts behind Lakehouse Pipeline Controls, but it usually does not make learners practice with pipeline failure log, source file profile, schema comparison sheet, numeric variance, threshold decisions, and role handoff artifacts. Trigger: two evidence sources disagree and the normal checklist cannot close the case: 92,040 of 105,770 records passed the check, variance 13.0%, with signal ''bronze-to-silver load variance and a schema warning''.',
  1,
  '["Data & AI","Data Platform Engineering","Data Engineering & Lakehouse Operations","Lakehouse Pipeline Controls","Primary: Evidence. Supporting: Technical, Functional, Domain","expected vs actual record-count variance","schema version mismatch","source-to-bronze reconciliation","bronze-to-silver completeness check","dashboard release hold decision","expected 105,770 vs actual 92,040 records","13.0% variance interpretation","threshold rule: record variance must stay under 1.5%","exception hypothesis testing","severity classification"]'::jsonb,
  '["Engage: Learner receives a exception diagnosis case: daily revenue dashboard refresh is at risk because only 92,040 of 105,770 records passed the control and bronze-to-silver load variance and a schema warning is visible","Explore: Learner reviews pipeline failure log, source file profile, schema comparison sheet, record completeness report, dashboard refresh note, highlights the fields that prove the issue, and notes which values cross the threshold","Explain: Learner studies expected vs actual record-count variance, schema version mismatch, source-to-bronze reconciliation, bronze-to-silver completeness check and learns how these concepts explain the business risk, not just the technical error","Express: Learner prepares the Lakehouse Pipeline Control Exception Note with issue summary, numeric evidence, root-cause hypothesis, decision, and handoff note","Empower: Learner must justify the most likely cause and escalation path for daily revenue dashboard refresh","Evolve: Learner writes what evidence would be needed next time to separate the competing root causes faster"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Scenario: Lakehouse Pipeline Control Exception Note - Exception Diagnosis Pack
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-003' LIMIT 1)
   AND title = 'L3 Module: Lakehouse Pipeline Controls Workplace Mission' LIMIT 1),
  'Workplace Scenario: Lakehouse Pipeline Control Exception Note - Exception Diagnosis Pack',
  'An exception case is raised during daily revenue dashboard refresh because a retail sales lakehouse pipeline shows conflicting evidence around bronze-to-silver load variance and a schema warning. The expected volume is 105,770 records, but only 92,040 records are usable, creating a 13.0% variance against the control expectation. The `discount_code` field is missing in 14% of rows and `customer_region` has a new APAC-South value. The accepted rule is: record variance must stay under 1.5%. The learner receives pipeline failure log, source file profile, schema comparison sheet, record completeness report, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Lakehouse Pipeline Control Exception Note. The learner must compare possible causes, select the most likely root cause, and prepare an escalation-ready artifact. Pressure points: Daily revenue dashboard refresh is time-sensitive; variance is 13.0% against the rule; the `discount_code` field is missing in 14% of rows and `customer_region` has a new APAC-South value; the evidence is conflicting, the business owner is asking for a decision, and escalation must be justified.',
  'Course trigger: two evidence sources disagree and the normal checklist cannot close the case: 92,040 of 105,770 records passed the check, variance 13.0%, with signal ''bronze-to-silver load variance and a schema warning''.
Problem statement: An exception case is raised during daily revenue dashboard refresh because a retail sales lakehouse pipeline shows conflicting evidence around bronze-to-silver load variance and a schema warning. The expected volume is 105,770 records, but only 92,040 records are usable, creating a 13.0% variance against the control expectation. The `discount_code` field is missing in 14% of rows and `customer_region` has a new APAC-South value. The accepted rule is: record variance must stay under 1.5%. The learner receives pipeline failure log, source file profile, schema comparison sheet, record completeness report, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Lakehouse Pipeline Control Exception Note. The learner must compare possible causes, select the most likely root cause, and prepare an escalation-ready artifact.
Major concepts: expected vs actual record-count variance; schema version mismatch; source-to-bronze reconciliation; bronze-to-silver completeness check; dashboard release hold decision; expected 105,770 vs actual 92,040 records; 13.0% variance interpretation; threshold rule: record variance must stay under 1.5%; exception hypothesis testing; severity classification.
Root-cause focus: Test competing hypotheses and choose between: source extract cut-off, schema drift, failed ingestion batch, transformation join loss, or late-arriving partition. Evidence must come from pipeline failure log, source file profile, schema comparison sheet.
Required data: pipeline failure log; source file profile; schema comparison sheet; record completeness report; dashboard refresh note; conflicting evidence extract; exception escalation policy
Artifact: Lakehouse Pipeline Control Exception Note - Exception Diagnosis Pack
Artifact structure: case summary; expected vs actual numbers; threshold rule; evidence table from pipeline failure log, source file profile, schema comparison sheet; root-cause hypothesis; decision/action; risk note; role handoff.
Evidence fields to assess: captures expected 105,770 and actual 92,040 records; calculates or explains 13.0% variance; uses threshold rule correctly (record variance must stay under 1.5%); cites at least three input documents; links evidence to root-cause hypothesis; states clear release/hold/correct/escalate decision.
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
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-003' LIMIT 1),
  'B.Tech CSE - Data Engineering Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech AI & Data Science - Data Platform Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-003' LIMIT 1),
  'B.Tech AI & Data Science - Data Platform Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Data Science - Data Engineering Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-003' LIMIT 1),
  'B.Sc Data Science - Data Engineering Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MCA - Data Engineering / Cloud Data Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-003' LIMIT 1),
  'MCA - Data Engineering / Cloud Data Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Tech Data Engineering / Big Data Systems
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-003' LIMIT 1),
  'M.Tech Data Engineering / Big Data Systems',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Diagnose a Production Exception in Gold Data Product Publishing
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Diagnose a Production Exception in Gold Data Product Publishing',
  'CRS-IND-CL-008',
  'By the end of this course, the learner can diagnose an exception in Gold Data Product Publishing by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact. Workplace problem: An exception case is raised during monthly margin KPI publication because a finance gold data product shows conflicting evidence around metric grain mismatch and duplicate account totals. The expected volume is 53,940 rows, but only 50,480 rows are usable, creating a 6.4% variance against the control expectation. The `net_margin_pct` measure differs by 2.8 points between semantic layer and finance workbook. The accepted rule is: KPI variance must be below 0.5% before certification. The learner receives KPI definition note, gold table grain mapping, semantic measure validation sheet, finance reconciliation extract, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Gold Data Product Publishing Sign-off Pack. The learner must compare possible causes, select the most likely root cause, and prepare an escalation-ready artifact. Artifact: Gold Data Product Publishing Sign-off Pack - Exception Diagnosis Pack.',
  '12 hours',
  'Active',
  'Data Platform Engineering; BI & Reporting Analytics',
  'technical',
  '["By the end of this course, the learner can diagnose an exception in Gold Data Product Publishing by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact","Learner demonstrates Gold Data Product Publishing by interpreting real-looking numbers, comparing evidence from KPI definition note and gold table grain mapping, and producing a decision-ready artifact","Proves the learner can perform exception diagnosis work in Gold Data Product Publishing with numeric evidence, workplace documents, and a reviewer-ready artifact. Status: Demo Ready"]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L3 Module: Gold Data Product Publishing Workplace Mission
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-008' LIMIT 1),
  'L3 Module: Gold Data Product Publishing Workplace Mission',
  'Industry requirement: Teams responsible for a finance gold data product need learners who can use numeric evidence, threshold rules, and workplace documents to make reliable decisions during monthly margin KPI publication, not only explain Gold Data Product Publishing theoretically. Gap addressed: Academic learning may cover the concepts behind Gold Data Product Publishing, but it usually does not make learners practice with KPI definition note, gold table grain mapping, semantic measure validation sheet, numeric variance, threshold decisions, and role handoff artifacts. Trigger: two evidence sources disagree and the normal checklist cannot close the case: 50,480 of 53,940 rows passed the check, variance 6.4%, with signal ''metric grain mismatch and duplicate account totals''.',
  1,
  '["Data & AI","Data Platform Engineering","BI & Reporting Analytics","Gold Data Product Publishing","Primary: Evidence. Supporting: Technical, Functional, Domain","metric grain control","semantic measure validation","consumer-ready data product certification","KPI definition sign-off","duplicate total reconciliation","expected 53,940 vs actual 50,480 rows","6.4% variance interpretation","threshold rule: KPI variance must be below 0.5% before certification","exception hypothesis testing","severity classification"]'::jsonb,
  '["Engage: Learner receives a exception diagnosis case: monthly margin KPI publication is at risk because only 50,480 of 53,940 rows passed the control and metric grain mismatch and duplicate account totals is visible","Explore: Learner reviews KPI definition note, gold table grain mapping, semantic measure validation sheet, finance reconciliation extract, consumer sign-off request, highlights the fields that prove the issue, and notes which values cross the threshold","Explain: Learner studies metric grain control, semantic measure validation, consumer-ready data product certification, KPI definition sign-off and learns how these concepts explain the business risk, not just the technical error","Express: Learner prepares the Gold Data Product Publishing Sign-off Pack with issue summary, numeric evidence, root-cause hypothesis, decision, and handoff note","Empower: Learner must justify the most likely cause and escalation path for monthly margin KPI publication","Evolve: Learner writes what evidence would be needed next time to separate the competing root causes faster"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Scenario: Gold Data Product Publishing Sign-off Pack - Exception Diagnosis Pack
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-008' LIMIT 1)
   AND title = 'L3 Module: Gold Data Product Publishing Workplace Mission' LIMIT 1),
  'Workplace Scenario: Gold Data Product Publishing Sign-off Pack - Exception Diagnosis Pack',
  'An exception case is raised during monthly margin KPI publication because a finance gold data product shows conflicting evidence around metric grain mismatch and duplicate account totals. The expected volume is 53,940 rows, but only 50,480 rows are usable, creating a 6.4% variance against the control expectation. The `net_margin_pct` measure differs by 2.8 points between semantic layer and finance workbook. The accepted rule is: KPI variance must be below 0.5% before certification. The learner receives KPI definition note, gold table grain mapping, semantic measure validation sheet, finance reconciliation extract, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Gold Data Product Publishing Sign-off Pack. The learner must compare possible causes, select the most likely root cause, and prepare an escalation-ready artifact. Pressure points: Monthly margin kpi publication is time-sensitive; variance is 6.4% against the rule; the `net_margin_pct` measure differs by 2.8 points between semantic layer and finance workbook; the evidence is conflicting, the business owner is asking for a decision, and escalation must be justified.',
  'Course trigger: two evidence sources disagree and the normal checklist cannot close the case: 50,480 of 53,940 rows passed the check, variance 6.4%, with signal ''metric grain mismatch and duplicate account totals''.
Problem statement: An exception case is raised during monthly margin KPI publication because a finance gold data product shows conflicting evidence around metric grain mismatch and duplicate account totals. The expected volume is 53,940 rows, but only 50,480 rows are usable, creating a 6.4% variance against the control expectation. The `net_margin_pct` measure differs by 2.8 points between semantic layer and finance workbook. The accepted rule is: KPI variance must be below 0.5% before certification. The learner receives KPI definition note, gold table grain mapping, semantic measure validation sheet, finance reconciliation extract, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Gold Data Product Publishing Sign-off Pack. The learner must compare possible causes, select the most likely root cause, and prepare an escalation-ready artifact.
Major concepts: metric grain control; semantic measure validation; consumer-ready data product certification; KPI definition sign-off; duplicate total reconciliation; expected 53,940 vs actual 50,480 rows; 6.4% variance interpretation; threshold rule: KPI variance must be below 0.5% before certification; exception hypothesis testing; severity classification.
Root-cause focus: Test competing hypotheses and choose between: wrong aggregation grain, duplicate account mapping, stale semantic measure, incorrect filter context, or unapproved KPI definition. Evidence must come from KPI definition note, gold table grain mapping, semantic measure validation sheet.
Required data: KPI definition note; gold table grain mapping; semantic measure validation sheet; finance reconciliation extract; consumer sign-off request; conflicting evidence extract; exception escalation policy
Artifact: Gold Data Product Publishing Sign-off Pack - Exception Diagnosis Pack
Artifact structure: case summary; expected vs actual numbers; threshold rule; evidence table from KPI definition note, gold table grain mapping, semantic measure validation sheet; root-cause hypothesis; decision/action; risk note; role handoff.
Evidence fields to assess: captures expected 53,940 and actual 50,480 rows; calculates or explains 6.4% variance; uses threshold rule correctly (KPI variance must be below 0.5% before certification); cites at least three input documents; links evidence to root-cause hypothesis; states clear release/hold/correct/escalate decision.
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
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-008' LIMIT 1),
  'B.Tech CSE - Data Engineering Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech AI & Data Science - Data Platform Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-008' LIMIT 1),
  'B.Tech AI & Data Science - Data Platform Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Data Science - Data Engineering Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-008' LIMIT 1),
  'B.Sc Data Science - Data Engineering Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MCA - Data Engineering / Cloud Data Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-008' LIMIT 1),
  'MCA - Data Engineering / Cloud Data Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Tech Data Engineering / Big Data Systems
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-008' LIMIT 1),
  'M.Tech Data Engineering / Big Data Systems',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Data Science - BI & Analytics Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-008' LIMIT 1),
  'B.Sc Data Science - BI & Analytics Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Diagnose a Production Exception in Streaming Contract Stabilization
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Diagnose a Production Exception in Streaming Contract Stabilization',
  'CRS-IND-CL-013',
  'By the end of this course, the learner can diagnose an exception in Streaming Contract Stabilization by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact. Workplace problem: An exception case is raised during real-time personalization feed because a streaming customer-event contract shows conflicting evidence around stream contract violations and late event spikes. The expected volume is 192,510 events, but only 169,620 events are usable, creating a 11.9% variance against the control expectation. 7.6% of events arrive after the 5-minute SLA and the `session_id` type changed from string to integer. The accepted rule is: contract violations must remain below 0.8%. The learner receives stream contract spec, Kafka topic error log, late-arrival summary, schema registry diff, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Streaming Contract Stabilization Report. The learner must compare possible causes, select the most likely root cause, and prepare an escalation-ready artifact. Artifact: Streaming Contract Stabilization Report - Exception Diagnosis Pack.',
  '12 hours',
  'Active',
  'Data Engineering & Lakehouse Operations',
  'technical',
  '["By the end of this course, the learner can diagnose an exception in Streaming Contract Stabilization by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact","Learner demonstrates Streaming Contract Stabilization by interpreting real-looking numbers, comparing evidence from stream contract spec and Kafka topic error log, and producing a decision-ready artifact","Proves the learner can perform exception diagnosis work in Streaming Contract Stabilization with numeric evidence, workplace documents, and a reviewer-ready artifact. Status: Demo Ready"]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L3 Module: Streaming Contract Stabilization Workplace Mission
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-013' LIMIT 1),
  'L3 Module: Streaming Contract Stabilization Workplace Mission',
  'Industry requirement: Teams responsible for a streaming customer-event contract need learners who can use numeric evidence, threshold rules, and workplace documents to make reliable decisions during real-time personalization feed, not only explain Streaming Contract Stabilization theoretically. Gap addressed: Academic learning may cover the concepts behind Streaming Contract Stabilization, but it usually does not make learners practice with stream contract spec, Kafka topic error log, late-arrival summary, numeric variance, threshold decisions, and role handoff artifacts. Trigger: two evidence sources disagree and the normal checklist cannot close the case: 169,620 of 192,510 events passed the check, variance 11.9%, with signal ''stream contract violations and late event spikes''.',
  1,
  '["Data & AI","Data Platform Engineering","Data Engineering & Lakehouse Operations","Streaming Contract Stabilization","Primary: Evidence. Supporting: Technical, Functional, Domain","stream schema contract","late-arrival window","consumer compatibility","event-time vs processing-time","contract test evidence","expected 192,510 vs actual 169,620 events","11.9% variance interpretation","threshold rule: contract violations must remain below 0.8%","exception hypothesis testing","severity classification"]'::jsonb,
  '["Engage: Learner receives a exception diagnosis case: real-time personalization feed is at risk because only 169,620 of 192,510 events passed the control and stream contract violations and late event spikes is visible","Explore: Learner reviews stream contract spec, Kafka topic error log, late-arrival summary, schema registry diff, consumer failure ticket, highlights the fields that prove the issue, and notes which values cross the threshold","Explain: Learner studies stream schema contract, late-arrival window, consumer compatibility, event-time vs processing-time and learns how these concepts explain the business risk, not just the technical error","Express: Learner prepares the Streaming Contract Stabilization Report with issue summary, numeric evidence, root-cause hypothesis, decision, and handoff note","Empower: Learner must justify the most likely cause and escalation path for real-time personalization feed","Evolve: Learner writes what evidence would be needed next time to separate the competing root causes faster"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Scenario: Streaming Contract Stabilization Report - Exception Diagnosis Pack
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-013' LIMIT 1)
   AND title = 'L3 Module: Streaming Contract Stabilization Workplace Mission' LIMIT 1),
  'Workplace Scenario: Streaming Contract Stabilization Report - Exception Diagnosis Pack',
  'An exception case is raised during real-time personalization feed because a streaming customer-event contract shows conflicting evidence around stream contract violations and late event spikes. The expected volume is 192,510 events, but only 169,620 events are usable, creating a 11.9% variance against the control expectation. 7.6% of events arrive after the 5-minute SLA and the `session_id` type changed from string to integer. The accepted rule is: contract violations must remain below 0.8%. The learner receives stream contract spec, Kafka topic error log, late-arrival summary, schema registry diff, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Streaming Contract Stabilization Report. The learner must compare possible causes, select the most likely root cause, and prepare an escalation-ready artifact. Pressure points: Real-time personalization feed is time-sensitive; variance is 11.9% against the rule; 7.6% of events arrive after the 5-minute SLA and the `session_id` type changed from string to integer; the evidence is conflicting, the business owner is asking for a decision, and escalation must be justified.',
  'Course trigger: two evidence sources disagree and the normal checklist cannot close the case: 169,620 of 192,510 events passed the check, variance 11.9%, with signal ''stream contract violations and late event spikes''.
Problem statement: An exception case is raised during real-time personalization feed because a streaming customer-event contract shows conflicting evidence around stream contract violations and late event spikes. The expected volume is 192,510 events, but only 169,620 events are usable, creating a 11.9% variance against the control expectation. 7.6% of events arrive after the 5-minute SLA and the `session_id` type changed from string to integer. The accepted rule is: contract violations must remain below 0.8%. The learner receives stream contract spec, Kafka topic error log, late-arrival summary, schema registry diff, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Streaming Contract Stabilization Report. The learner must compare possible causes, select the most likely root cause, and prepare an escalation-ready artifact.
Major concepts: stream schema contract; late-arrival window; consumer compatibility; event-time vs processing-time; contract test evidence; expected 192,510 vs actual 169,620 events; 11.9% variance interpretation; threshold rule: contract violations must remain below 0.8%; exception hypothesis testing; severity classification.
Root-cause focus: Test competing hypotheses and choose between: producer schema change, late event window, consumer deserialization failure, partition lag, or missing contract test. Evidence must come from stream contract spec, Kafka topic error log, late-arrival summary.
Required data: stream contract spec; Kafka topic error log; late-arrival summary; schema registry diff; consumer failure ticket; conflicting evidence extract; exception escalation policy
Artifact: Streaming Contract Stabilization Report - Exception Diagnosis Pack
Artifact structure: case summary; expected vs actual numbers; threshold rule; evidence table from stream contract spec, Kafka topic error log, late-arrival summary; root-cause hypothesis; decision/action; risk note; role handoff.
Evidence fields to assess: captures expected 192,510 and actual 169,620 events; calculates or explains 11.9% variance; uses threshold rule correctly (contract violations must remain below 0.8%); cites at least three input documents; links evidence to root-cause hypothesis; states clear release/hold/correct/escalate decision.
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
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-013' LIMIT 1),
  'B.Tech CSE - Data Engineering Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech AI & Data Science - Data Platform Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-013' LIMIT 1),
  'B.Tech AI & Data Science - Data Platform Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Data Science - Data Engineering Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-013' LIMIT 1),
  'B.Sc Data Science - Data Engineering Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MCA - Data Engineering / Cloud Data Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-013' LIMIT 1),
  'MCA - Data Engineering / Cloud Data Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Tech Data Engineering / Big Data Systems
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-013' LIMIT 1),
  'M.Tech Data Engineering / Big Data Systems',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Diagnose a Production Exception in BI Asset Certification
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Diagnose a Production Exception in BI Asset Certification',
  'CRS-IND-CL-018',
  'By the end of this course, the learner can diagnose an exception in BI Asset Certification by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact. Workplace problem: An exception case is raised during executive sales performance review because a certified BI reporting asset shows conflicting evidence around uncertified dataset use and mismatched dashboard totals. The expected volume is 13,934 tiles, but only 13,405 tiles are usable, creating a 3.8% variance against the control expectation. Regional sales total is 6.4% higher in the dashboard than the approved semantic model. The accepted rule is: 100% of executive tiles must use certified sources. The learner receives dashboard dependency list, certified dataset register, semantic model measure sheet, data refresh history, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the BI Asset Certification Review Sheet. The learner must compare possible causes, select the most likely root cause, and prepare an escalation-ready artifact. Artifact: BI Asset Certification Review Sheet - Exception Diagnosis Pack.',
  '12 hours',
  'Active',
  'BI & Reporting Analytics',
  'technical',
  '["By the end of this course, the learner can diagnose an exception in BI Asset Certification by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact","Learner demonstrates BI Asset Certification by interpreting real-looking numbers, comparing evidence from dashboard dependency list and certified dataset register, and producing a decision-ready artifact","Proves the learner can perform exception diagnosis work in BI Asset Certification with numeric evidence, workplace documents, and a reviewer-ready artifact. Status: Demo Ready"]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L3 Module: BI Asset Certification Workplace Mission
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-018' LIMIT 1),
  'L3 Module: BI Asset Certification Workplace Mission',
  'Industry requirement: Teams responsible for a certified BI reporting asset need learners who can use numeric evidence, threshold rules, and workplace documents to make reliable decisions during executive sales performance review, not only explain BI Asset Certification theoretically. Gap addressed: Academic learning may cover the concepts behind BI Asset Certification, but it usually does not make learners practice with dashboard dependency list, certified dataset register, semantic model measure sheet, numeric variance, threshold decisions, and role handoff artifacts. Trigger: two evidence sources disagree and the normal checklist cannot close the case: 13,405 of 13,934 tiles passed the check, variance 3.8%, with signal ''uncertified dataset use and mismatched dashboard totals''.',
  1,
  '["Data & AI","BI & Reporting Analytics","BI Asset Certification","Primary: Evidence. Supporting: Technical, Functional, Domain","certified BI asset control","semantic model dependency","measure lineage","refresh reliability","executive reporting risk","expected 13,934 vs actual 13,405 tiles","3.8% variance interpretation","threshold rule: 100% of executive tiles must use certified sources","exception hypothesis testing","severity classification"]'::jsonb,
  '["Engage: Learner receives a exception diagnosis case: executive sales performance review is at risk because only 13,405 of 13,934 tiles passed the control and uncertified dataset use and mismatched dashboard totals is visible","Explore: Learner reviews dashboard dependency list, certified dataset register, semantic model measure sheet, data refresh history, business owner approval note, highlights the fields that prove the issue, and notes which values cross the threshold","Explain: Learner studies certified BI asset control, semantic model dependency, measure lineage, refresh reliability and learns how these concepts explain the business risk, not just the technical error","Express: Learner prepares the BI Asset Certification Review Sheet with issue summary, numeric evidence, root-cause hypothesis, decision, and handoff note","Empower: Learner must justify the most likely cause and escalation path for executive sales performance review","Evolve: Learner writes what evidence would be needed next time to separate the competing root causes faster"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Scenario: BI Asset Certification Review Sheet - Exception Diagnosis Pack
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-018' LIMIT 1)
   AND title = 'L3 Module: BI Asset Certification Workplace Mission' LIMIT 1),
  'Workplace Scenario: BI Asset Certification Review Sheet - Exception Diagnosis Pack',
  'An exception case is raised during executive sales performance review because a certified BI reporting asset shows conflicting evidence around uncertified dataset use and mismatched dashboard totals. The expected volume is 13,934 tiles, but only 13,405 tiles are usable, creating a 3.8% variance against the control expectation. Regional sales total is 6.4% higher in the dashboard than the approved semantic model. The accepted rule is: 100% of executive tiles must use certified sources. The learner receives dashboard dependency list, certified dataset register, semantic model measure sheet, data refresh history, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the BI Asset Certification Review Sheet. The learner must compare possible causes, select the most likely root cause, and prepare an escalation-ready artifact. Pressure points: Executive sales performance review is time-sensitive; variance is 3.8% against the rule; regional sales total is 6.4% higher in the dashboard than the approved semantic model; the evidence is conflicting, the business owner is asking for a decision, and escalation must be justified.',
  'Course trigger: two evidence sources disagree and the normal checklist cannot close the case: 13,405 of 13,934 tiles passed the check, variance 3.8%, with signal ''uncertified dataset use and mismatched dashboard totals''.
Problem statement: An exception case is raised during executive sales performance review because a certified BI reporting asset shows conflicting evidence around uncertified dataset use and mismatched dashboard totals. The expected volume is 13,934 tiles, but only 13,405 tiles are usable, creating a 3.8% variance against the control expectation. Regional sales total is 6.4% higher in the dashboard than the approved semantic model. The accepted rule is: 100% of executive tiles must use certified sources. The learner receives dashboard dependency list, certified dataset register, semantic model measure sheet, data refresh history, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the BI Asset Certification Review Sheet. The learner must compare possible causes, select the most likely root cause, and prepare an escalation-ready artifact.
Major concepts: certified BI asset control; semantic model dependency; measure lineage; refresh reliability; executive reporting risk; expected 13,934 vs actual 13,405 tiles; 3.8% variance interpretation; threshold rule: 100% of executive tiles must use certified sources; exception hypothesis testing; severity classification.
Root-cause focus: Test competing hypotheses and choose between: uncertified table usage, measure definition drift, refresh failure, manual filter override, or missing owner approval. Evidence must come from dashboard dependency list, certified dataset register, semantic model measure sheet.
Required data: dashboard dependency list; certified dataset register; semantic model measure sheet; data refresh history; business owner approval note; conflicting evidence extract; exception escalation policy
Artifact: BI Asset Certification Review Sheet - Exception Diagnosis Pack
Artifact structure: case summary; expected vs actual numbers; threshold rule; evidence table from dashboard dependency list, certified dataset register, semantic model measure sheet; root-cause hypothesis; decision/action; risk note; role handoff.
Evidence fields to assess: captures expected 13,934 and actual 13,405 tiles; calculates or explains 3.8% variance; uses threshold rule correctly (100% of executive tiles must use certified sources); cites at least three input documents; links evidence to root-cause hypothesis; states clear release/hold/correct/escalate decision.
AI support tips: Use AI as a coach to ask evidence-checking questions, explain unfamiliar terms, compare possible root causes, and improve clarity. Do not use AI to invent numbers or make the decision without citing the provided documents.',
  1,
  '12 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Data Science - BI & Analytics Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-018' LIMIT 1),
  'B.Sc Data Science - BI & Analytics Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BBA Business Analytics - BI Reporting Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-018' LIMIT 1),
  'BBA Business Analytics - BI Reporting Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Com Analytics - Management Reporting Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-018' LIMIT 1),
  'B.Com Analytics - Management Reporting Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MBA Business Analytics - Decision Reporting Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-018' LIMIT 1),
  'MBA Business Analytics - Decision Reporting Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech CSE - Data Analytics Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-018' LIMIT 1),
  'B.Tech CSE - Data Analytics Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Diagnose a Production Exception in Decision Recommendation Production
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Diagnose a Production Exception in Decision Recommendation Production',
  'CRS-IND-CL-023',
  'By the end of this course, the learner can diagnose an exception in Decision Recommendation Production by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact. Workplace problem: An exception case is raised during warehouse staffing recommendation because an operations decision recommendation model shows conflicting evidence around optimization output conflicts with capacity and cost constraints. The expected volume is 15,570 recommendations, but only 14,873 recommendations are usable, creating a 4.5% variance against the control expectation. Recommended overtime cost exceeds budget by ₹4.8 lakh and misses 11 high-priority fulfillment slots. The accepted rule is: recommendation constraint breaches must stay below 2%. The learner receives optimization scenario file, constraint register, cost-benefit worksheet, service-level target sheet, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Decision Recommendation Justification Note. The learner must compare possible causes, select the most likely root cause, and prepare an escalation-ready artifact. Artifact: Decision Recommendation Justification Note - Exception Diagnosis Pack.',
  '12 hours',
  'Active',
  'Decision Optimization & Business Insight',
  'technical',
  '["By the end of this course, the learner can diagnose an exception in Decision Recommendation Production by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact","Learner demonstrates Decision Recommendation Production by interpreting real-looking numbers, comparing evidence from optimization scenario file and constraint register, and producing a decision-ready artifact","Proves the learner can perform exception diagnosis work in Decision Recommendation Production with numeric evidence, workplace documents, and a reviewer-ready artifact. Status: Demo Ready"]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L3 Module: Decision Recommendation Production Workplace Mission
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-023' LIMIT 1),
  'L3 Module: Decision Recommendation Production Workplace Mission',
  'Industry requirement: Teams responsible for an operations decision recommendation model need learners who can use numeric evidence, threshold rules, and workplace documents to make reliable decisions during warehouse staffing recommendation, not only explain Decision Recommendation Production theoretically. Gap addressed: Academic learning may cover the concepts behind Decision Recommendation Production, but it usually does not make learners practice with optimization scenario file, constraint register, cost-benefit worksheet, numeric variance, threshold decisions, and role handoff artifacts. Trigger: two evidence sources disagree and the normal checklist cannot close the case: 14,873 of 15,570 recommendations passed the check, variance 4.5%, with signal ''optimization output conflicts with capacity and cost constraints''.',
  1,
  '["Data & AI","Decision Optimization & Business Insight","Decision Recommendation Production","Primary: Evidence. Supporting: Technical, Functional, Domain","constraint feasibility","objective function trade-off","scenario comparison","cost-service impact","decision recommendation evidence","expected 15,570 vs actual 14,873 recommendations","4.5% variance interpretation","threshold rule: recommendation constraint breaches must stay below 2%","exception hypothesis testing","severity classification"]'::jsonb,
  '["Engage: Learner receives a exception diagnosis case: warehouse staffing recommendation is at risk because only 14,873 of 15,570 recommendations passed the control and optimization output conflicts with capacity and cost constraints is visible","Explore: Learner reviews optimization scenario file, constraint register, cost-benefit worksheet, service-level target sheet, manager decision request, highlights the fields that prove the issue, and notes which values cross the threshold","Explain: Learner studies constraint feasibility, objective function trade-off, scenario comparison, cost-service impact and learns how these concepts explain the business risk, not just the technical error","Express: Learner prepares the Decision Recommendation Justification Note with issue summary, numeric evidence, root-cause hypothesis, decision, and handoff note","Empower: Learner must justify the most likely cause and escalation path for warehouse staffing recommendation","Evolve: Learner writes what evidence would be needed next time to separate the competing root causes faster"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Scenario: Decision Recommendation Justification Note - Exception Diagnosis Pack
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-023' LIMIT 1)
   AND title = 'L3 Module: Decision Recommendation Production Workplace Mission' LIMIT 1),
  'Workplace Scenario: Decision Recommendation Justification Note - Exception Diagnosis Pack',
  'An exception case is raised during warehouse staffing recommendation because an operations decision recommendation model shows conflicting evidence around optimization output conflicts with capacity and cost constraints. The expected volume is 15,570 recommendations, but only 14,873 recommendations are usable, creating a 4.5% variance against the control expectation. Recommended overtime cost exceeds budget by ₹4.8 lakh and misses 11 high-priority fulfillment slots. The accepted rule is: recommendation constraint breaches must stay below 2%. The learner receives optimization scenario file, constraint register, cost-benefit worksheet, service-level target sheet, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Decision Recommendation Justification Note. The learner must compare possible causes, select the most likely root cause, and prepare an escalation-ready artifact. Pressure points: Warehouse staffing recommendation is time-sensitive; variance is 4.5% against the rule; recommended overtime cost exceeds budget by ₹4.8 lakh and misses 11 high-priority fulfillment slots; the evidence is conflicting, the business owner is asking for a decision, and escalation must be justified.',
  'Course trigger: two evidence sources disagree and the normal checklist cannot close the case: 14,873 of 15,570 recommendations passed the check, variance 4.5%, with signal ''optimization output conflicts with capacity and cost constraints''.
Problem statement: An exception case is raised during warehouse staffing recommendation because an operations decision recommendation model shows conflicting evidence around optimization output conflicts with capacity and cost constraints. The expected volume is 15,570 recommendations, but only 14,873 recommendations are usable, creating a 4.5% variance against the control expectation. Recommended overtime cost exceeds budget by ₹4.8 lakh and misses 11 high-priority fulfillment slots. The accepted rule is: recommendation constraint breaches must stay below 2%. The learner receives optimization scenario file, constraint register, cost-benefit worksheet, service-level target sheet, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Decision Recommendation Justification Note. The learner must compare possible causes, select the most likely root cause, and prepare an escalation-ready artifact.
Major concepts: constraint feasibility; objective function trade-off; scenario comparison; cost-service impact; decision recommendation evidence; expected 15,570 vs actual 14,873 recommendations; 4.5% variance interpretation; threshold rule: recommendation constraint breaches must stay below 2%; exception hypothesis testing; severity classification.
Root-cause focus: Test competing hypotheses and choose between: missing constraint, wrong objective weight, outdated cost parameter, service-level trade-off, or infeasible scenario. Evidence must come from optimization scenario file, constraint register, cost-benefit worksheet.
Required data: optimization scenario file; constraint register; cost-benefit worksheet; service-level target sheet; manager decision request; conflicting evidence extract; exception escalation policy
Artifact: Decision Recommendation Justification Note - Exception Diagnosis Pack
Artifact structure: case summary; expected vs actual numbers; threshold rule; evidence table from optimization scenario file, constraint register, cost-benefit worksheet; root-cause hypothesis; decision/action; risk note; role handoff.
Evidence fields to assess: captures expected 15,570 and actual 14,873 recommendations; calculates or explains 4.5% variance; uses threshold rule correctly (recommendation constraint breaches must stay below 2%); cites at least three input documents; links evidence to root-cause hypothesis; states clear release/hold/correct/escalate decision.
AI support tips: Use AI as a coach to ask evidence-checking questions, explain unfamiliar terms, compare possible root causes, and improve clarity. Do not use AI to invent numbers or make the decision without citing the provided documents.',
  1,
  '12 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Statistics / Data Science - Decision Analytics Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-023' LIMIT 1),
  'B.Sc Statistics / Data Science - Decision Analytics Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech Industrial Engineering / Operations Analytics Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-023' LIMIT 1),
  'B.Tech Industrial Engineering / Operations Analytics Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BBA Business Analytics - Decision Intelligence Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-023' LIMIT 1),
  'BBA Business Analytics - Decision Intelligence Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MBA Business Analytics - Optimization & Strategy Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-023' LIMIT 1),
  'MBA Business Analytics - Optimization & Strategy Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Sc Data Science - Optimization Analytics
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-023' LIMIT 1),
  'M.Sc Data Science - Optimization Analytics',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Data Science - Applied Modeling Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-023' LIMIT 1),
  'B.Sc Data Science - Applied Modeling Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Diagnose a Production Exception in Leakage-Safe Feature Dataset Build
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Diagnose a Production Exception in Leakage-Safe Feature Dataset Build',
  'CRS-IND-CL-028',
  'By the end of this course, the learner can diagnose an exception in Leakage-Safe Feature Dataset Build by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact. Workplace problem: An exception case is raised during model training cut-off review because a churn prediction feature dataset shows conflicting evidence around feature leakage risk and event-window mismatch. The expected volume is 266,620 rows, but only 234,840 rows are usable, creating a 11.9% variance against the control expectation. 18 features are populated after the churn label date and 9.2% of rows use future transactions. The accepted rule is: post-outcome features must be 0 before training release. The learner receives label definition sheet, feature lineage map, event-window extract, training data sample, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Leakage-Safe Feature Dataset Review Pack. The learner must compare possible causes, select the most likely root cause, and prepare an escalation-ready artifact. Artifact: Leakage-Safe Feature Dataset Review Pack - Exception Diagnosis Pack.',
  '12 hours',
  'Active',
  'Data Science & Statistical Modeling; Machine Learning, Deep Learning & NLP Engineering',
  'technical',
  '["By the end of this course, the learner can diagnose an exception in Leakage-Safe Feature Dataset Build by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact","Learner demonstrates Leakage-Safe Feature Dataset Build by interpreting real-looking numbers, comparing evidence from label definition sheet and feature lineage map, and producing a decision-ready artifact","Proves the learner can perform exception diagnosis work in Leakage-Safe Feature Dataset Build with numeric evidence, workplace documents, and a reviewer-ready artifact. Status: Demo Ready"]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L3 Module: Leakage-Safe Feature Dataset Build Workplace Mission
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-028' LIMIT 1),
  'L3 Module: Leakage-Safe Feature Dataset Build Workplace Mission',
  'Industry requirement: Teams responsible for a churn prediction feature dataset need learners who can use numeric evidence, threshold rules, and workplace documents to make reliable decisions during model training cut-off review, not only explain Leakage-Safe Feature Dataset Build theoretically. Gap addressed: Academic learning may cover the concepts behind Leakage-Safe Feature Dataset Build, but it usually does not make learners practice with label definition sheet, feature lineage map, event-window extract, numeric variance, threshold decisions, and role handoff artifacts. Trigger: two evidence sources disagree and the normal checklist cannot close the case: 234,840 of 266,620 rows passed the check, variance 11.9%, with signal ''feature leakage risk and event-window mismatch''.',
  1,
  '["Data & AI","Data Science & Statistical Modeling","Machine Learning, Deep Learning & NLP Engineering","Leakage-Safe Feature Dataset Build","Primary: Evidence. Supporting: Technical, Functional, Domain","prediction target timing","feature availability cut-off","target leakage detection","event-window alignment","training data release control","expected 266,620 vs actual 234,840 rows","11.9% variance interpretation","threshold rule: post-outcome features must be 0 before training release","exception hypothesis testing","severity classification"]'::jsonb,
  '["Engage: Learner receives a exception diagnosis case: model training cut-off review is at risk because only 234,840 of 266,620 rows passed the control and feature leakage risk and event-window mismatch is visible","Explore: Learner reviews label definition sheet, feature lineage map, event-window extract, training data sample, leakage review checklist, highlights the fields that prove the issue, and notes which values cross the threshold","Explain: Learner studies prediction target timing, feature availability cut-off, target leakage detection, event-window alignment and learns how these concepts explain the business risk, not just the technical error","Express: Learner prepares the Leakage-Safe Feature Dataset Review Pack with issue summary, numeric evidence, root-cause hypothesis, decision, and handoff note","Empower: Learner must justify the most likely cause and escalation path for model training cut-off review","Evolve: Learner writes what evidence would be needed next time to separate the competing root causes faster"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Scenario: Leakage-Safe Feature Dataset Review Pack - Exception Diagnosis Pack
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-028' LIMIT 1)
   AND title = 'L3 Module: Leakage-Safe Feature Dataset Build Workplace Mission' LIMIT 1),
  'Workplace Scenario: Leakage-Safe Feature Dataset Review Pack - Exception Diagnosis Pack',
  'An exception case is raised during model training cut-off review because a churn prediction feature dataset shows conflicting evidence around feature leakage risk and event-window mismatch. The expected volume is 266,620 rows, but only 234,840 rows are usable, creating a 11.9% variance against the control expectation. 18 features are populated after the churn label date and 9.2% of rows use future transactions. The accepted rule is: post-outcome features must be 0 before training release. The learner receives label definition sheet, feature lineage map, event-window extract, training data sample, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Leakage-Safe Feature Dataset Review Pack. The learner must compare possible causes, select the most likely root cause, and prepare an escalation-ready artifact. Pressure points: Model training cut-off review is time-sensitive; variance is 11.9% against the rule; 18 features are populated after the churn label date and 9.2% of rows use future transactions; the evidence is conflicting, the business owner is asking for a decision, and escalation must be justified.',
  'Course trigger: two evidence sources disagree and the normal checklist cannot close the case: 234,840 of 266,620 rows passed the check, variance 11.9%, with signal ''feature leakage risk and event-window mismatch''.
Problem statement: An exception case is raised during model training cut-off review because a churn prediction feature dataset shows conflicting evidence around feature leakage risk and event-window mismatch. The expected volume is 266,620 rows, but only 234,840 rows are usable, creating a 11.9% variance against the control expectation. 18 features are populated after the churn label date and 9.2% of rows use future transactions. The accepted rule is: post-outcome features must be 0 before training release. The learner receives label definition sheet, feature lineage map, event-window extract, training data sample, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Leakage-Safe Feature Dataset Review Pack. The learner must compare possible causes, select the most likely root cause, and prepare an escalation-ready artifact.
Major concepts: prediction target timing; feature availability cut-off; target leakage detection; event-window alignment; training data release control; expected 266,620 vs actual 234,840 rows; 11.9% variance interpretation; threshold rule: post-outcome features must be 0 before training release; exception hypothesis testing; severity classification.
Root-cause focus: Test competing hypotheses and choose between: future-dated transaction feature, wrong label cut-off, late feature backfill, target leakage, or unverified event window. Evidence must come from label definition sheet, feature lineage map, event-window extract.
Required data: label definition sheet; feature lineage map; event-window extract; training data sample; leakage review checklist; conflicting evidence extract; exception escalation policy
Artifact: Leakage-Safe Feature Dataset Review Pack - Exception Diagnosis Pack
Artifact structure: case summary; expected vs actual numbers; threshold rule; evidence table from label definition sheet, feature lineage map, event-window extract; root-cause hypothesis; decision/action; risk note; role handoff.
Evidence fields to assess: captures expected 266,620 and actual 234,840 rows; calculates or explains 11.9% variance; uses threshold rule correctly (post-outcome features must be 0 before training release); cites at least three input documents; links evidence to root-cause hypothesis; states clear release/hold/correct/escalate decision.
AI support tips: Use AI as a coach to ask evidence-checking questions, explain unfamiliar terms, compare possible root causes, and improve clarity. Do not use AI to invent numbers or make the decision without citing the provided documents.',
  1,
  '12 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Data Science - Applied Modeling Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-028' LIMIT 1),
  'B.Sc Data Science - Applied Modeling Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Statistics - Data Science Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-028' LIMIT 1),
  'B.Sc Statistics - Data Science Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech AI & Data Science - Modeling Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-028' LIMIT 1),
  'B.Tech AI & Data Science - Modeling Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Sc Data Science - Applied Analytics Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-028' LIMIT 1),
  'M.Sc Data Science - Applied Analytics Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MCA - Data Science Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-028' LIMIT 1),
  'MCA - Data Science Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech CSE - AI & Machine Learning Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-028' LIMIT 1),
  'B.Tech CSE - AI & Machine Learning Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Diagnose a Production Exception in Experiment and Cohort Evaluation
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Diagnose a Production Exception in Experiment and Cohort Evaluation',
  'CRS-IND-CL-033',
  'By the end of this course, the learner can diagnose an exception in Experiment and Cohort Evaluation by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact. Workplace problem: An exception case is raised during pricing-page change decision because an A/B experiment result shows conflicting evidence around cohort imbalance and weak significance evidence. The expected volume is 81,990 users, but only 73,280 users are usable, creating a 10.6% variance against the control expectation. Control has 52.8% of traffic instead of 50% and conversion lift is only 0.7% with p=0.09. The accepted rule is: minimum detectable effect and sample ratio mismatch must be within tolerance. The learner receives experiment design note, cohort assignment report, conversion result table, validity checklist, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Experiment Validity and Decision Evidence Pack. The learner must compare possible causes, select the most likely root cause, and prepare an escalation-ready artifact. Artifact: Experiment Validity and Decision Evidence Pack - Exception Diagnosis Pack.',
  '12 hours',
  'Active',
  'Data Science & Statistical Modeling',
  'technical',
  '["By the end of this course, the learner can diagnose an exception in Experiment and Cohort Evaluation by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact","Learner demonstrates Experiment and Cohort Evaluation by interpreting real-looking numbers, comparing evidence from experiment design note and cohort assignment report, and producing a decision-ready artifact","Proves the learner can perform exception diagnosis work in Experiment and Cohort Evaluation with numeric evidence, workplace documents, and a reviewer-ready artifact. Status: Demo Ready"]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L3 Module: Experiment and Cohort Evaluation Workplace Mission
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-033' LIMIT 1),
  'L3 Module: Experiment and Cohort Evaluation Workplace Mission',
  'Industry requirement: Teams responsible for an A/B experiment result need learners who can use numeric evidence, threshold rules, and workplace documents to make reliable decisions during pricing-page change decision, not only explain Experiment and Cohort Evaluation theoretically. Gap addressed: Academic learning may cover the concepts behind Experiment and Cohort Evaluation, but it usually does not make learners practice with experiment design note, cohort assignment report, conversion result table, numeric variance, threshold decisions, and role handoff artifacts. Trigger: two evidence sources disagree and the normal checklist cannot close the case: 73,280 of 81,990 users passed the check, variance 10.6%, with signal ''cohort imbalance and weak significance evidence''.',
  1,
  '["Data & AI","Data Science & Statistical Modeling","Experiment and Cohort Evaluation","Primary: Evidence. Supporting: Technical, Functional, Domain","sample-ratio mismatch","statistical power","confidence interval","cohort validity","decision threshold","expected 81,990 vs actual 73,280 users","10.6% variance interpretation","threshold rule: minimum detectable effect and sample ratio mismatch must be within tolerance","exception hypothesis testing","severity classification"]'::jsonb,
  '["Engage: Learner receives a exception diagnosis case: pricing-page change decision is at risk because only 73,280 of 81,990 users passed the control and cohort imbalance and weak significance evidence is visible","Explore: Learner reviews experiment design note, cohort assignment report, conversion result table, validity checklist, product decision memo, highlights the fields that prove the issue, and notes which values cross the threshold","Explain: Learner studies sample-ratio mismatch, statistical power, confidence interval, cohort validity and learns how these concepts explain the business risk, not just the technical error","Express: Learner prepares the Experiment Validity and Decision Evidence Pack with issue summary, numeric evidence, root-cause hypothesis, decision, and handoff note","Empower: Learner must justify the most likely cause and escalation path for pricing-page change decision","Evolve: Learner writes what evidence would be needed next time to separate the competing root causes faster"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Scenario: Experiment Validity and Decision Evidence Pack - Exception Diagnosis Pack
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-033' LIMIT 1)
   AND title = 'L3 Module: Experiment and Cohort Evaluation Workplace Mission' LIMIT 1),
  'Workplace Scenario: Experiment Validity and Decision Evidence Pack - Exception Diagnosis Pack',
  'An exception case is raised during pricing-page change decision because an A/B experiment result shows conflicting evidence around cohort imbalance and weak significance evidence. The expected volume is 81,990 users, but only 73,280 users are usable, creating a 10.6% variance against the control expectation. Control has 52.8% of traffic instead of 50% and conversion lift is only 0.7% with p=0.09. The accepted rule is: minimum detectable effect and sample ratio mismatch must be within tolerance. The learner receives experiment design note, cohort assignment report, conversion result table, validity checklist, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Experiment Validity and Decision Evidence Pack. The learner must compare possible causes, select the most likely root cause, and prepare an escalation-ready artifact. Pressure points: Pricing-page change decision is time-sensitive; variance is 10.6% against the rule; control has 52.8% of traffic instead of 50% and conversion lift is only 0.7% with p=0.09; the evidence is conflicting, the business owner is asking for a decision, and escalation must be justified.',
  'Course trigger: two evidence sources disagree and the normal checklist cannot close the case: 73,280 of 81,990 users passed the check, variance 10.6%, with signal ''cohort imbalance and weak significance evidence''.
Problem statement: An exception case is raised during pricing-page change decision because an A/B experiment result shows conflicting evidence around cohort imbalance and weak significance evidence. The expected volume is 81,990 users, but only 73,280 users are usable, creating a 10.6% variance against the control expectation. Control has 52.8% of traffic instead of 50% and conversion lift is only 0.7% with p=0.09. The accepted rule is: minimum detectable effect and sample ratio mismatch must be within tolerance. The learner receives experiment design note, cohort assignment report, conversion result table, validity checklist, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Experiment Validity and Decision Evidence Pack. The learner must compare possible causes, select the most likely root cause, and prepare an escalation-ready artifact.
Major concepts: sample-ratio mismatch; statistical power; confidence interval; cohort validity; decision threshold; expected 81,990 vs actual 73,280 users; 10.6% variance interpretation; threshold rule: minimum detectable effect and sample ratio mismatch must be within tolerance; exception hypothesis testing; severity classification.
Root-cause focus: Test competing hypotheses and choose between: sample-ratio mismatch, underpowered test, instrumentation gap, segment imbalance, or premature decision. Evidence must come from experiment design note, cohort assignment report, conversion result table.
Required data: experiment design note; cohort assignment report; conversion result table; validity checklist; product decision memo; conflicting evidence extract; exception escalation policy
Artifact: Experiment Validity and Decision Evidence Pack - Exception Diagnosis Pack
Artifact structure: case summary; expected vs actual numbers; threshold rule; evidence table from experiment design note, cohort assignment report, conversion result table; root-cause hypothesis; decision/action; risk note; role handoff.
Evidence fields to assess: captures expected 81,990 and actual 73,280 users; calculates or explains 10.6% variance; uses threshold rule correctly (minimum detectable effect and sample ratio mismatch must be within tolerance); cites at least three input documents; links evidence to root-cause hypothesis; states clear release/hold/correct/escalate decision.
AI support tips: Use AI as a coach to ask evidence-checking questions, explain unfamiliar terms, compare possible root causes, and improve clarity. Do not use AI to invent numbers or make the decision without citing the provided documents.',
  1,
  '12 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Data Science - Applied Modeling Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-033' LIMIT 1),
  'B.Sc Data Science - Applied Modeling Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Statistics - Data Science Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-033' LIMIT 1),
  'B.Sc Statistics - Data Science Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech AI & Data Science - Modeling Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-033' LIMIT 1),
  'B.Tech AI & Data Science - Modeling Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Sc Data Science - Applied Analytics Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-033' LIMIT 1),
  'M.Sc Data Science - Applied Analytics Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MCA - Data Science Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-033' LIMIT 1),
  'MCA - Data Science Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Diagnose a Production Exception in Deep Learning Candidate Packaging
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Diagnose a Production Exception in Deep Learning Candidate Packaging',
  'CRS-IND-CL-038',
  'By the end of this course, the learner can diagnose an exception in Deep Learning Candidate Packaging by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact. Workplace problem: An exception case is raised during computer vision defect-detection release review because a deep learning model candidate shows conflicting evidence around training metric improvement but validation instability. The expected volume is 71,360 images, but only 64,120 images are usable, creating a 10.1% variance against the control expectation. Training F1 is 0.93 but validation F1 drops to 0.81 on low-light images. The accepted rule is: validation F1 must be above 0.86 and train-val gap below 5 points. The learner receives training run log, checkpoint metric table, validation error slice report, model card draft, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Deep Learning Candidate Packaging Review. The learner must compare possible causes, select the most likely root cause, and prepare an escalation-ready artifact. Artifact: Deep Learning Candidate Packaging Review - Exception Diagnosis Pack.',
  '12 hours',
  'Active',
  'Machine Learning, Deep Learning & NLP Engineering',
  'technical',
  '["By the end of this course, the learner can diagnose an exception in Deep Learning Candidate Packaging by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact","Learner demonstrates Deep Learning Candidate Packaging by interpreting real-looking numbers, comparing evidence from training run log and checkpoint metric table, and producing a decision-ready artifact","Proves the learner can perform exception diagnosis work in Deep Learning Candidate Packaging with numeric evidence, workplace documents, and a reviewer-ready artifact. Status: Demo Ready"]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L3 Module: Deep Learning Candidate Packaging Workplace Mission
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-038' LIMIT 1),
  'L3 Module: Deep Learning Candidate Packaging Workplace Mission',
  'Industry requirement: Teams responsible for a deep learning model candidate need learners who can use numeric evidence, threshold rules, and workplace documents to make reliable decisions during computer vision defect-detection release review, not only explain Deep Learning Candidate Packaging theoretically. Gap addressed: Academic learning may cover the concepts behind Deep Learning Candidate Packaging, but it usually does not make learners practice with training run log, checkpoint metric table, validation error slice report, numeric variance, threshold decisions, and role handoff artifacts. Trigger: two evidence sources disagree and the normal checklist cannot close the case: 64,120 of 71,360 images passed the check, variance 10.1%, with signal ''training metric improvement but validation instability''.',
  1,
  '["Data & AI","Machine Learning, Deep Learning & NLP Engineering","Deep Learning Candidate Packaging","Primary: Evidence. Supporting: Technical, Functional, Domain","train-validation gap","checkpoint comparison","error slice analysis","model card evidence","release candidate packaging","expected 71,360 vs actual 64,120 images","10.1% variance interpretation","threshold rule: validation F1 must be above 0.86 and train-val gap below 5 points","exception hypothesis testing","severity classification"]'::jsonb,
  '["Engage: Learner receives a exception diagnosis case: computer vision defect-detection release review is at risk because only 64,120 of 71,360 images passed the control and training metric improvement but validation instability is visible","Explore: Learner reviews training run log, checkpoint metric table, validation error slice report, model card draft, release candidate request, highlights the fields that prove the issue, and notes which values cross the threshold","Explain: Learner studies train-validation gap, checkpoint comparison, error slice analysis, model card evidence and learns how these concepts explain the business risk, not just the technical error","Express: Learner prepares the Deep Learning Candidate Packaging Review with issue summary, numeric evidence, root-cause hypothesis, decision, and handoff note","Empower: Learner must justify the most likely cause and escalation path for computer vision defect-detection release review","Evolve: Learner writes what evidence would be needed next time to separate the competing root causes faster"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Scenario: Deep Learning Candidate Packaging Review - Exception Diagnosis Pack
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-038' LIMIT 1)
   AND title = 'L3 Module: Deep Learning Candidate Packaging Workplace Mission' LIMIT 1),
  'Workplace Scenario: Deep Learning Candidate Packaging Review - Exception Diagnosis Pack',
  'An exception case is raised during computer vision defect-detection release review because a deep learning model candidate shows conflicting evidence around training metric improvement but validation instability. The expected volume is 71,360 images, but only 64,120 images are usable, creating a 10.1% variance against the control expectation. Training F1 is 0.93 but validation F1 drops to 0.81 on low-light images. The accepted rule is: validation F1 must be above 0.86 and train-val gap below 5 points. The learner receives training run log, checkpoint metric table, validation error slice report, model card draft, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Deep Learning Candidate Packaging Review. The learner must compare possible causes, select the most likely root cause, and prepare an escalation-ready artifact. Pressure points: Computer vision defect-detection release review is time-sensitive; variance is 10.1% against the rule; training F1 is 0.93 but validation F1 drops to 0.81 on low-light images; the evidence is conflicting, the business owner is asking for a decision, and escalation must be justified.',
  'Course trigger: two evidence sources disagree and the normal checklist cannot close the case: 64,120 of 71,360 images passed the check, variance 10.1%, with signal ''training metric improvement but validation instability''.
Problem statement: An exception case is raised during computer vision defect-detection release review because a deep learning model candidate shows conflicting evidence around training metric improvement but validation instability. The expected volume is 71,360 images, but only 64,120 images are usable, creating a 10.1% variance against the control expectation. Training F1 is 0.93 but validation F1 drops to 0.81 on low-light images. The accepted rule is: validation F1 must be above 0.86 and train-val gap below 5 points. The learner receives training run log, checkpoint metric table, validation error slice report, model card draft, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Deep Learning Candidate Packaging Review. The learner must compare possible causes, select the most likely root cause, and prepare an escalation-ready artifact.
Major concepts: train-validation gap; checkpoint comparison; error slice analysis; model card evidence; release candidate packaging; expected 71,360 vs actual 64,120 images; 10.1% variance interpretation; threshold rule: validation F1 must be above 0.86 and train-val gap below 5 points; exception hypothesis testing; severity classification.
Root-cause focus: Test competing hypotheses and choose between: overfitting, class imbalance, data augmentation mismatch, checkpoint selection error, or weak slice performance. Evidence must come from training run log, checkpoint metric table, validation error slice report.
Required data: training run log; checkpoint metric table; validation error slice report; model card draft; release candidate request; conflicting evidence extract; exception escalation policy
Artifact: Deep Learning Candidate Packaging Review - Exception Diagnosis Pack
Artifact structure: case summary; expected vs actual numbers; threshold rule; evidence table from training run log, checkpoint metric table, validation error slice report; root-cause hypothesis; decision/action; risk note; role handoff.
Evidence fields to assess: captures expected 71,360 and actual 64,120 images; calculates or explains 10.1% variance; uses threshold rule correctly (validation F1 must be above 0.86 and train-val gap below 5 points); cites at least three input documents; links evidence to root-cause hypothesis; states clear release/hold/correct/escalate decision.
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
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-038' LIMIT 1),
  'B.Tech CSE - AI & Machine Learning Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech AI & Data Science - ML Engineering Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-038' LIMIT 1),
  'B.Tech AI & Data Science - ML Engineering Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Tech AI / Machine Learning Engineering
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-038' LIMIT 1),
  'M.Tech AI / Machine Learning Engineering',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Sc AI & Machine Learning
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-038' LIMIT 1),
  'M.Sc AI & Machine Learning',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MCA - AI / ML Application Development
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-038' LIMIT 1),
  'MCA - AI / ML Application Development',
  NOW()
) ON CONFLICT DO NOTHING;

COMMIT;

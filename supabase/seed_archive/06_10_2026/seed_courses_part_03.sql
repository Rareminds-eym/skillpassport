-- ============================================
-- COURSE SEED — part 03 of 10
-- Courses 101–150 of 485
-- Paste this whole file into the Supabase SQL editor and Run.
-- Safe to re-run (ON CONFLICT DO NOTHING). Run parts in order.
-- ============================================

BEGIN;

-- Insert Course: Set Review Standards for Human-AI Workflow Validation
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Set Review Standards for Human-AI Workflow Validation',
  'CRS-IND-CL-085',
  'By the end of this course, the learner can set measurable standards for Human-AI Workflow Validation by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact. Workplace problem: A standards review is called because multiple teams handle claims processing copilot validation differently when a human-AI workflow shows user overrides and trust failures in assisted decisions. The expected volume is 45,690 suggestions, but only 42,445 suggestions are usable, creating a 7.1% variance against the control expectation. Adjusters reject 18% of suggestions and 23 comments cite missing evidence in the AI explanation. The accepted rule is: unexplained override rate above 12% requires workflow review. The learner receives user edit log, AI suggestion sample, override reason summary, workflow step map, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Human-AI Workflow Validation Report. The learner must define review rules, evidence standards, escalation thresholds, and coaching notes for future cases. Artifact: Human-AI Workflow Validation Report - Standards and Review Pack.',
  '16 hours',
  'Active',
  'AI Product & GenAI Application Development',
  'technical',
  '["By the end of this course, the learner can set measurable standards for Human-AI Workflow Validation by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact","Learner demonstrates Human-AI Workflow Validation by interpreting real-looking numbers, comparing evidence from user edit log and AI suggestion sample, and producing a decision-ready artifact","Proves the learner can perform standards and governance work in Human-AI Workflow Validation with numeric evidence, workplace documents, and a reviewer-ready artifact. Status: Demo Ready"]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L5 Module: Human-AI Workflow Validation Workplace Mission
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-085' LIMIT 1),
  'L5 Module: Human-AI Workflow Validation Workplace Mission',
  'Industry requirement: Teams responsible for a human-AI workflow need learners who can use numeric evidence, threshold rules, and workplace documents to make reliable decisions during claims processing copilot validation, not only explain Human-AI Workflow Validation theoretically. Gap addressed: Academic learning may cover the concepts behind Human-AI Workflow Validation, but it usually does not make learners practice with user edit log, AI suggestion sample, override reason summary, numeric variance, threshold decisions, and role handoff artifacts. Trigger: leaders need a standard rule so different teams stop making inconsistent decisions: 42,445 of 45,690 suggestions passed the check, variance 7.1%, with signal ''user overrides and trust failures in assisted decisions''.',
  1,
  '["Data & AI","AI Product & GenAI Application Development","Human-AI Workflow Validation","Primary: Functional. Supporting: Cognitive, Communication, AI/Digital, Behavioural","human override pattern","trust signal analysis","AI explanation quality","workflow friction point","human-in-the-loop validation","expected 45,690 vs actual 42,445 suggestions","7.1% variance interpretation","threshold rule: unexplained override rate above 12% requires workflow review","review standard definition","auditability","coaching rule"]'::jsonb,
  '["Engage: Learner receives a standards and governance case: claims processing copilot validation is at risk because only 42,445 of 45,690 suggestions passed the control and user overrides and trust failures in assisted decisions is visible","Explore: Learner reviews user edit log, AI suggestion sample, override reason summary, workflow step map, trust feedback notes, highlights the fields that prove the issue, and notes which values cross the threshold","Explain: Learner studies human override pattern, trust signal analysis, AI explanation quality, workflow friction point and learns how these concepts explain the business risk, not just the technical error","Express: Learner prepares the Human-AI Workflow Validation Report with issue summary, numeric evidence, root-cause hypothesis, decision, and handoff note","Empower: Learner must define standards, thresholds, and reviewer responsibilities for claims processing copilot validation","Evolve: Learner creates a coaching note so another reviewer can apply the standard consistently"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Scenario: Human-AI Workflow Validation Report - Standards and Review Pack
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-085' LIMIT 1)
   AND title = 'L5 Module: Human-AI Workflow Validation Workplace Mission' LIMIT 1),
  'Workplace Scenario: Human-AI Workflow Validation Report - Standards and Review Pack',
  'A standards review is called because multiple teams handle claims processing copilot validation differently when a human-AI workflow shows user overrides and trust failures in assisted decisions. The expected volume is 45,690 suggestions, but only 42,445 suggestions are usable, creating a 7.1% variance against the control expectation. Adjusters reject 18% of suggestions and 23 comments cite missing evidence in the AI explanation. The accepted rule is: unexplained override rate above 12% requires workflow review. The learner receives user edit log, AI suggestion sample, override reason summary, workflow step map, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Human-AI Workflow Validation Report. The learner must define review rules, evidence standards, escalation thresholds, and coaching notes for future cases. Pressure points: Claims processing copilot validation is time-sensitive; variance is 7.1% against the rule; adjusters reject 18% of suggestions and 23 comments cite missing evidence in the AI explanation; multiple teams need a common standard, audit trace, and coaching rule for future decisions.',
  'Course trigger: leaders need a standard rule so different teams stop making inconsistent decisions: 42,445 of 45,690 suggestions passed the check, variance 7.1%, with signal ''user overrides and trust failures in assisted decisions''.
Problem statement: A standards review is called because multiple teams handle claims processing copilot validation differently when a human-AI workflow shows user overrides and trust failures in assisted decisions. The expected volume is 45,690 suggestions, but only 42,445 suggestions are usable, creating a 7.1% variance against the control expectation. Adjusters reject 18% of suggestions and 23 comments cite missing evidence in the AI explanation. The accepted rule is: unexplained override rate above 12% requires workflow review. The learner receives user edit log, AI suggestion sample, override reason summary, workflow step map, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Human-AI Workflow Validation Report. The learner must define review rules, evidence standards, escalation thresholds, and coaching notes for future cases.
Major concepts: human override pattern; trust signal analysis; AI explanation quality; workflow friction point; human-in-the-loop validation; expected 45,690 vs actual 42,445 suggestions; 7.1% variance interpretation; threshold rule: unexplained override rate above 12% requires workflow review; review standard definition; auditability; coaching rule.
Root-cause focus: Define standards that distinguish: AI suggestion lacks evidence, workflow step mismatch, unclear confidence signal, bad handoff timing, or user trust gap. Evidence must come from user edit log, AI suggestion sample, override reason summary.
Required data: user edit log; AI suggestion sample; override reason summary; workflow step map; trust feedback notes; audit observation summary; cross-team decision examples; standard template draft
Artifact: Human-AI Workflow Validation Report - Standards and Review Pack
Artifact structure: case summary; expected vs actual numbers; threshold rule; evidence table from user edit log, AI suggestion sample, override reason summary; root-cause hypothesis; decision/action; risk note; role handoff; standard operating rule; reviewer checklist; escalation matrix; coaching note; audit evidence requirement.
Evidence fields to assess: captures expected 45,690 and actual 42,445 suggestions; calculates or explains 7.1% variance; uses threshold rule correctly (unexplained override rate above 12% requires workflow review); cites at least three input documents; links evidence to root-cause hypothesis; states clear release/hold/correct/escalate decision; defines standard review rule; creates audit-ready reviewer criteria.
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
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-085' LIMIT 1),
  'B.Tech CSE - AI & Machine Learning Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech AI & Data Science - ML Engineering Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-085' LIMIT 1),
  'B.Tech AI & Data Science - ML Engineering Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Tech AI / Machine Learning Engineering
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-085' LIMIT 1),
  'M.Tech AI / Machine Learning Engineering',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Sc AI & Machine Learning
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-085' LIMIT 1),
  'M.Sc AI & Machine Learning',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MCA - AI / ML Application Development
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-085' LIMIT 1),
  'MCA - AI / ML Application Development',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech CSE - AI Product Engineering Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-085' LIMIT 1),
  'B.Tech CSE - AI Product Engineering Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Set Review Standards for Applied Industry AI Configuration
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Set Review Standards for Applied Industry AI Configuration',
  'CRS-IND-CL-090',
  'By the end of this course, the learner can set measurable standards for Applied Industry AI Configuration by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact. Workplace problem: A standards review is called because multiple teams handle healthcare triage model configuration differently when an applied industry AI solution shows vertical workflow mismatch and weak local configuration. The expected volume is 41,546 rules, but only 39,186 rules are usable, creating a 5.7% variance against the control expectation. Triage priority rules misclassify 7 high-risk cases and local escalation SLA is missing for night shifts. The accepted rule is: critical workflow rules must match domain protocol before pilot. The learner receives vertical workflow requirement, configuration rule sheet, domain protocol extract, pilot case sample, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Applied Industry AI Configuration Review. The learner must define review rules, evidence standards, escalation thresholds, and coaching notes for future cases. Artifact: Applied Industry AI Configuration Review - Standards and Review Pack.',
  '16 hours',
  'Active',
  'Applied Industry AI Solutions; Computer Vision & Multimodal AI Engineering',
  'technical',
  '["By the end of this course, the learner can set measurable standards for Applied Industry AI Configuration by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact","Learner demonstrates Applied Industry AI Configuration by interpreting real-looking numbers, comparing evidence from vertical workflow requirement and configuration rule sheet, and producing a decision-ready artifact","Proves the learner can perform standards and governance work in Applied Industry AI Configuration with numeric evidence, workplace documents, and a reviewer-ready artifact. Status: Demo Ready"]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L5 Module: Applied Industry AI Configuration Workplace Mission
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-090' LIMIT 1),
  'L5 Module: Applied Industry AI Configuration Workplace Mission',
  'Industry requirement: Teams responsible for an applied industry AI solution need learners who can use numeric evidence, threshold rules, and workplace documents to make reliable decisions during healthcare triage model configuration, not only explain Applied Industry AI Configuration theoretically. Gap addressed: Academic learning may cover the concepts behind Applied Industry AI Configuration, but it usually does not make learners practice with vertical workflow requirement, configuration rule sheet, domain protocol extract, numeric variance, threshold decisions, and role handoff artifacts. Trigger: leaders need a standard rule so different teams stop making inconsistent decisions: 39,186 of 41,546 rules passed the check, variance 5.7%, with signal ''vertical workflow mismatch and weak local configuration''.',
  1,
  '["Data & AI","Applied Industry AI Solutions","Computer Vision & Multimodal AI Engineering","Applied Industry AI Configuration","Primary: Evidence. Supporting: Technical, Functional, Domain, Behavioural","vertical AI configuration","domain protocol mapping","local workflow adaptation","pilot validation evidence","configuration risk","expected 41,546 vs actual 39,186 rules","5.7% variance interpretation","threshold rule: critical workflow rules must match domain protocol before pilot","review standard definition","auditability","coaching rule"]'::jsonb,
  '["Engage: Learner receives a standards and governance case: healthcare triage model configuration is at risk because only 39,186 of 41,546 rules passed the control and vertical workflow mismatch and weak local configuration is visible","Explore: Learner reviews vertical workflow requirement, configuration rule sheet, domain protocol extract, pilot case sample, stakeholder validation note, highlights the fields that prove the issue, and notes which values cross the threshold","Explain: Learner studies vertical AI configuration, domain protocol mapping, local workflow adaptation, pilot validation evidence and learns how these concepts explain the business risk, not just the technical error","Express: Learner prepares the Applied Industry AI Configuration Review with issue summary, numeric evidence, root-cause hypothesis, decision, and handoff note","Empower: Learner must define standards, thresholds, and reviewer responsibilities for healthcare triage model configuration","Evolve: Learner creates a coaching note so another reviewer can apply the standard consistently"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Scenario: Applied Industry AI Configuration Review - Standards and Review Pack
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-090' LIMIT 1)
   AND title = 'L5 Module: Applied Industry AI Configuration Workplace Mission' LIMIT 1),
  'Workplace Scenario: Applied Industry AI Configuration Review - Standards and Review Pack',
  'A standards review is called because multiple teams handle healthcare triage model configuration differently when an applied industry AI solution shows vertical workflow mismatch and weak local configuration. The expected volume is 41,546 rules, but only 39,186 rules are usable, creating a 5.7% variance against the control expectation. Triage priority rules misclassify 7 high-risk cases and local escalation SLA is missing for night shifts. The accepted rule is: critical workflow rules must match domain protocol before pilot. The learner receives vertical workflow requirement, configuration rule sheet, domain protocol extract, pilot case sample, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Applied Industry AI Configuration Review. The learner must define review rules, evidence standards, escalation thresholds, and coaching notes for future cases. Pressure points: Healthcare triage model configuration is time-sensitive; variance is 5.7% against the rule; triage priority rules misclassify 7 high-risk cases and local escalation SLA is missing for night shifts; multiple teams need a common standard, audit trace, and coaching rule for future decisions.',
  'Course trigger: leaders need a standard rule so different teams stop making inconsistent decisions: 39,186 of 41,546 rules passed the check, variance 5.7%, with signal ''vertical workflow mismatch and weak local configuration''.
Problem statement: A standards review is called because multiple teams handle healthcare triage model configuration differently when an applied industry AI solution shows vertical workflow mismatch and weak local configuration. The expected volume is 41,546 rules, but only 39,186 rules are usable, creating a 5.7% variance against the control expectation. Triage priority rules misclassify 7 high-risk cases and local escalation SLA is missing for night shifts. The accepted rule is: critical workflow rules must match domain protocol before pilot. The learner receives vertical workflow requirement, configuration rule sheet, domain protocol extract, pilot case sample, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Applied Industry AI Configuration Review. The learner must define review rules, evidence standards, escalation thresholds, and coaching notes for future cases.
Major concepts: vertical AI configuration; domain protocol mapping; local workflow adaptation; pilot validation evidence; configuration risk; expected 41,546 vs actual 39,186 rules; 5.7% variance interpretation; threshold rule: critical workflow rules must match domain protocol before pilot; review standard definition; auditability; coaching rule.
Root-cause focus: Define standards that distinguish: wrong domain rule, local workflow mismatch, missing escalation path, insufficient pilot evidence, or unsupported edge case. Evidence must come from vertical workflow requirement, configuration rule sheet, domain protocol extract.
Required data: vertical workflow requirement; configuration rule sheet; domain protocol extract; pilot case sample; stakeholder validation note; audit observation summary; cross-team decision examples; standard template draft
Artifact: Applied Industry AI Configuration Review - Standards and Review Pack
Artifact structure: case summary; expected vs actual numbers; threshold rule; evidence table from vertical workflow requirement, configuration rule sheet, domain protocol extract; root-cause hypothesis; decision/action; risk note; role handoff; standard operating rule; reviewer checklist; escalation matrix; coaching note; audit evidence requirement.
Evidence fields to assess: captures expected 41,546 and actual 39,186 rules; calculates or explains 5.7% variance; uses threshold rule correctly (critical workflow rules must match domain protocol before pilot); cites at least three input documents; links evidence to root-cause hypothesis; states clear release/hold/correct/escalate decision; defines standard review rule; creates audit-ready reviewer criteria.
AI support tips: Use AI as a coach to ask evidence-checking questions, explain unfamiliar terms, compare possible root causes, and improve clarity. Do not use AI to invent numbers or make the decision without citing the provided documents.',
  1,
  '16 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech CSE - AI Product Engineering Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-090' LIMIT 1),
  'B.Tech CSE - AI Product Engineering Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech AI & Data Science - GenAI Application Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-090' LIMIT 1),
  'B.Tech AI & Data Science - GenAI Application Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MCA - AI Application Development Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-090' LIMIT 1),
  'MCA - AI Application Development Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MBA Product Management / Business Analytics - AI Product Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-090' LIMIT 1),
  'MBA Product Management / Business Analytics - AI Product Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PG Certificate - GenAI Product & Application Design
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-090' LIMIT 1),
  'PG Certificate - GenAI Product & Application Design',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech AI & Data Science - Applied Industry AI Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-090' LIMIT 1),
  'B.Tech AI & Data Science - Applied Industry AI Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Set Review Standards for Enterprise AI Adoption Roadmap Design
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Set Review Standards for Enterprise AI Adoption Roadmap Design',
  'CRS-IND-CL-095',
  'By the end of this course, the learner can set measurable standards for Enterprise AI Adoption Roadmap Design by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact. Workplace problem: A standards review is called because multiple teams handle business-unit AI portfolio planning differently when an enterprise AI adoption roadmap shows unprioritized initiatives with unclear feasibility and risk. The expected volume is 42,872 initiatives, but only 40,376 initiatives are usable, creating a 5.8% variance against the control expectation. 11 initiatives have high claimed value but no data-owner confirmation or adoption dependency map. The accepted rule is: phase-one initiatives must show value, feasibility, data readiness, and risk control. The learner receives AI initiative inventory, value-feasibility scoring sheet, data readiness checklist, risk dependency map, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Enterprise AI Adoption Roadmap Decision Pack. The learner must define review rules, evidence standards, escalation thresholds, and coaching notes for future cases. Artifact: Enterprise AI Adoption Roadmap Decision Pack - Standards and Review Pack.',
  '16 hours',
  'Active',
  'AI Adoption, Transformation, and Stakeholder Enablement',
  'technical',
  '["By the end of this course, the learner can set measurable standards for Enterprise AI Adoption Roadmap Design by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact","Learner demonstrates Enterprise AI Adoption Roadmap Design by interpreting real-looking numbers, comparing evidence from AI initiative inventory and value-feasibility scoring sheet, and producing a decision-ready artifact","Proves the learner can perform standards and governance work in Enterprise AI Adoption Roadmap Design with numeric evidence, workplace documents, and a reviewer-ready artifact. Status: Demo Ready"]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L5 Module: Enterprise AI Adoption Roadmap Design Workplace Mission
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-095' LIMIT 1),
  'L5 Module: Enterprise AI Adoption Roadmap Design Workplace Mission',
  'Industry requirement: Teams responsible for an enterprise AI adoption roadmap need learners who can use numeric evidence, threshold rules, and workplace documents to make reliable decisions during business-unit AI portfolio planning, not only explain Enterprise AI Adoption Roadmap Design theoretically. Gap addressed: Academic learning may cover the concepts behind Enterprise AI Adoption Roadmap Design, but it usually does not make learners practice with AI initiative inventory, value-feasibility scoring sheet, data readiness checklist, numeric variance, threshold decisions, and role handoff artifacts. Trigger: leaders need a standard rule so different teams stop making inconsistent decisions: 40,376 of 42,872 initiatives passed the check, variance 5.8%, with signal ''unprioritized initiatives with unclear feasibility and risk''.',
  1,
  '["Data & AI","AI Consulting & Transformation","AI Adoption, Transformation, and Stakeholder Enablement","Enterprise AI Adoption Roadmap Design","Primary: Functional. Supporting: Cognitive, Communication, AI/Digital, Behavioural","AI use-case prioritization","value-feasibility scoring","data readiness dependency","adoption risk","roadmap phasing","expected 42,872 vs actual 40,376 initiatives","5.8% variance interpretation","threshold rule: phase-one initiatives must show value, feasibility, data readiness, and risk control","review standard definition","auditability","coaching rule"]'::jsonb,
  '["Engage: Learner receives a standards and governance case: business-unit AI portfolio planning is at risk because only 40,376 of 42,872 initiatives passed the control and unprioritized initiatives with unclear feasibility and risk is visible","Explore: Learner reviews AI initiative inventory, value-feasibility scoring sheet, data readiness checklist, risk dependency map, stakeholder prioritization notes, highlights the fields that prove the issue, and notes which values cross the threshold","Explain: Learner studies AI use-case prioritization, value-feasibility scoring, data readiness dependency, adoption risk and learns how these concepts explain the business risk, not just the technical error","Express: Learner prepares the Enterprise AI Adoption Roadmap Decision Pack with issue summary, numeric evidence, root-cause hypothesis, decision, and handoff note","Empower: Learner must define standards, thresholds, and reviewer responsibilities for business-unit AI portfolio planning","Evolve: Learner creates a coaching note so another reviewer can apply the standard consistently"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Scenario: Enterprise AI Adoption Roadmap Decision Pack - Standards and Review Pack
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-095' LIMIT 1)
   AND title = 'L5 Module: Enterprise AI Adoption Roadmap Design Workplace Mission' LIMIT 1),
  'Workplace Scenario: Enterprise AI Adoption Roadmap Decision Pack - Standards and Review Pack',
  'A standards review is called because multiple teams handle business-unit AI portfolio planning differently when an enterprise AI adoption roadmap shows unprioritized initiatives with unclear feasibility and risk. The expected volume is 42,872 initiatives, but only 40,376 initiatives are usable, creating a 5.8% variance against the control expectation. 11 initiatives have high claimed value but no data-owner confirmation or adoption dependency map. The accepted rule is: phase-one initiatives must show value, feasibility, data readiness, and risk control. The learner receives AI initiative inventory, value-feasibility scoring sheet, data readiness checklist, risk dependency map, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Enterprise AI Adoption Roadmap Decision Pack. The learner must define review rules, evidence standards, escalation thresholds, and coaching notes for future cases. Pressure points: Business-unit ai portfolio planning is time-sensitive; variance is 5.8% against the rule; 11 initiatives have high claimed value but no data-owner confirmation or adoption dependency map; multiple teams need a common standard, audit trace, and coaching rule for future decisions.',
  'Course trigger: leaders need a standard rule so different teams stop making inconsistent decisions: 40,376 of 42,872 initiatives passed the check, variance 5.8%, with signal ''unprioritized initiatives with unclear feasibility and risk''.
Problem statement: A standards review is called because multiple teams handle business-unit AI portfolio planning differently when an enterprise AI adoption roadmap shows unprioritized initiatives with unclear feasibility and risk. The expected volume is 42,872 initiatives, but only 40,376 initiatives are usable, creating a 5.8% variance against the control expectation. 11 initiatives have high claimed value but no data-owner confirmation or adoption dependency map. The accepted rule is: phase-one initiatives must show value, feasibility, data readiness, and risk control. The learner receives AI initiative inventory, value-feasibility scoring sheet, data readiness checklist, risk dependency map, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Enterprise AI Adoption Roadmap Decision Pack. The learner must define review rules, evidence standards, escalation thresholds, and coaching notes for future cases.
Major concepts: AI use-case prioritization; value-feasibility scoring; data readiness dependency; adoption risk; roadmap phasing; expected 42,872 vs actual 40,376 initiatives; 5.8% variance interpretation; threshold rule: phase-one initiatives must show value, feasibility, data readiness, and risk control; review standard definition; auditability; coaching rule.
Root-cause focus: Define standards that distinguish: inflated business value, weak data readiness, missing sponsor, unplanned change-management effort, or unmapped risk dependency. Evidence must come from AI initiative inventory, value-feasibility scoring sheet, data readiness checklist.
Required data: AI initiative inventory; value-feasibility scoring sheet; data readiness checklist; risk dependency map; stakeholder prioritization notes; audit observation summary; cross-team decision examples; standard template draft
Artifact: Enterprise AI Adoption Roadmap Decision Pack - Standards and Review Pack
Artifact structure: case summary; expected vs actual numbers; threshold rule; evidence table from AI initiative inventory, value-feasibility scoring sheet, data readiness checklist; root-cause hypothesis; decision/action; risk note; role handoff; standard operating rule; reviewer checklist; escalation matrix; coaching note; audit evidence requirement.
Evidence fields to assess: captures expected 42,872 and actual 40,376 initiatives; calculates or explains 5.8% variance; uses threshold rule correctly (phase-one initiatives must show value, feasibility, data readiness, and risk control); cites at least three input documents; links evidence to root-cause hypothesis; states clear release/hold/correct/escalate decision; defines standard review rule; creates audit-ready reviewer criteria.
AI support tips: Use AI as a coach to ask evidence-checking questions, explain unfamiliar terms, compare possible root causes, and improve clarity. Do not use AI to invent numbers or make the decision without citing the provided documents.',
  1,
  '16 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MBA Business Analytics - AI Transformation Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-095' LIMIT 1),
  'MBA Business Analytics - AI Transformation Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BBA Business Analytics - AI Adoption Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-095' LIMIT 1),
  'BBA Business Analytics - AI Adoption Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech AI & Data Science - AI Consulting Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-095' LIMIT 1),
  'B.Tech AI & Data Science - AI Consulting Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PG Certificate - AI Strategy & Transformation
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-095' LIMIT 1),
  'PG Certificate - AI Strategy & Transformation',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: Executive Program - AI Adoption & Change Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-095' LIMIT 1),
  'Executive Program - AI Adoption & Change Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Set Review Standards for AI Training Data Quality Control
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Set Review Standards for AI Training Data Quality Control',
  'CRS-IND-CL-100',
  'By the end of this course, the learner can set measurable standards for AI Training Data Quality Control by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact. Workplace problem: A standards review is called because multiple teams handle dataset release quality gate differently when an AI training data labeling operation shows label disagreement and quality-control failure. The expected volume is 120,200 records, but only 103,500 records are usable, creating a 13.9% variance against the control expectation. Inter-annotator agreement is 84% for safety labels and 1,260 records have unresolved adjudication. The accepted rule is: critical label agreement must exceed 92% before release. The learner receives labeling guideline, annotator disagreement report, gold-standard sample, adjudication queue, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the AI Training Data Quality Control Pack. The learner must define review rules, evidence standards, escalation thresholds, and coaching notes for future cases. Artifact: AI Training Data Quality Control Pack - Standards and Review Pack.',
  '16 hours',
  'Active',
  'Synthetic Data, Labeling & Semantic Operations',
  'technical',
  '["By the end of this course, the learner can set measurable standards for AI Training Data Quality Control by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact","Learner demonstrates AI Training Data Quality Control by interpreting real-looking numbers, comparing evidence from labeling guideline and annotator disagreement report, and producing a decision-ready artifact","Proves the learner can perform standards and governance work in AI Training Data Quality Control with numeric evidence, workplace documents, and a reviewer-ready artifact. Status: Pilot Ready — Evidence Strengthening Needed"]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L5 Module: AI Training Data Quality Control Workplace Mission
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-100' LIMIT 1),
  'L5 Module: AI Training Data Quality Control Workplace Mission',
  'Industry requirement: Teams responsible for an AI training data labeling operation need learners who can use numeric evidence, threshold rules, and workplace documents to make reliable decisions during dataset release quality gate, not only explain AI Training Data Quality Control theoretically. Gap addressed: Academic learning may cover the concepts behind AI Training Data Quality Control, but it usually does not make learners practice with labeling guideline, annotator disagreement report, gold-standard sample, numeric variance, threshold decisions, and role handoff artifacts. Trigger: leaders need a standard rule so different teams stop making inconsistent decisions: 103,500 of 120,200 records passed the check, variance 13.9%, with signal ''label disagreement and quality-control failure''.',
  1,
  '["Data & AI","Synthetic Data, Labeling & Semantic Operations","AI Training Data Quality Control","Primary: Evidence. Supporting: Domain, Technical, AI/Digital, Behavioural","inter-annotator agreement","gold-standard validation","label adjudication","dataset release threshold","annotation quality audit","expected 120,200 vs actual 103,500 records","13.9% variance interpretation","threshold rule: critical label agreement must exceed 92% before release","review standard definition","auditability","coaching rule"]'::jsonb,
  '["Engage: Learner receives a standards and governance case: dataset release quality gate is at risk because only 103,500 of 120,200 records passed the control and label disagreement and quality-control failure is visible","Explore: Learner reviews labeling guideline, annotator disagreement report, gold-standard sample, adjudication queue, dataset release checklist, highlights the fields that prove the issue, and notes which values cross the threshold","Explain: Learner studies inter-annotator agreement, gold-standard validation, label adjudication, dataset release threshold and learns how these concepts explain the business risk, not just the technical error","Express: Learner prepares the AI Training Data Quality Control Pack with issue summary, numeric evidence, root-cause hypothesis, decision, and handoff note","Empower: Learner must define standards, thresholds, and reviewer responsibilities for dataset release quality gate","Evolve: Learner creates a coaching note so another reviewer can apply the standard consistently"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Scenario: AI Training Data Quality Control Pack - Standards and Review Pack
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-100' LIMIT 1)
   AND title = 'L5 Module: AI Training Data Quality Control Workplace Mission' LIMIT 1),
  'Workplace Scenario: AI Training Data Quality Control Pack - Standards and Review Pack',
  'A standards review is called because multiple teams handle dataset release quality gate differently when an AI training data labeling operation shows label disagreement and quality-control failure. The expected volume is 120,200 records, but only 103,500 records are usable, creating a 13.9% variance against the control expectation. Inter-annotator agreement is 84% for safety labels and 1,260 records have unresolved adjudication. The accepted rule is: critical label agreement must exceed 92% before release. The learner receives labeling guideline, annotator disagreement report, gold-standard sample, adjudication queue, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the AI Training Data Quality Control Pack. The learner must define review rules, evidence standards, escalation thresholds, and coaching notes for future cases. Pressure points: Dataset release quality gate is time-sensitive; variance is 13.9% against the rule; inter-annotator agreement is 84% for safety labels and 1,260 records have unresolved adjudication; multiple teams need a common standard, audit trace, and coaching rule for future decisions.',
  'Course trigger: leaders need a standard rule so different teams stop making inconsistent decisions: 103,500 of 120,200 records passed the check, variance 13.9%, with signal ''label disagreement and quality-control failure''.
Problem statement: A standards review is called because multiple teams handle dataset release quality gate differently when an AI training data labeling operation shows label disagreement and quality-control failure. The expected volume is 120,200 records, but only 103,500 records are usable, creating a 13.9% variance against the control expectation. Inter-annotator agreement is 84% for safety labels and 1,260 records have unresolved adjudication. The accepted rule is: critical label agreement must exceed 92% before release. The learner receives labeling guideline, annotator disagreement report, gold-standard sample, adjudication queue, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the AI Training Data Quality Control Pack. The learner must define review rules, evidence standards, escalation thresholds, and coaching notes for future cases.
Major concepts: inter-annotator agreement; gold-standard validation; label adjudication; dataset release threshold; annotation quality audit; expected 120,200 vs actual 103,500 records; 13.9% variance interpretation; threshold rule: critical label agreement must exceed 92% before release; review standard definition; auditability; coaching rule.
Root-cause focus: Define standards that distinguish: ambiguous labeling rule, annotator training gap, weak gold-standard sample, unresolved adjudication, or class imbalance. Evidence must come from labeling guideline, annotator disagreement report, gold-standard sample.
Required data: labeling guideline; annotator disagreement report; gold-standard sample; adjudication queue; dataset release checklist; audit observation summary; cross-team decision examples; standard template draft
Artifact: AI Training Data Quality Control Pack - Standards and Review Pack
Artifact structure: case summary; expected vs actual numbers; threshold rule; evidence table from labeling guideline, annotator disagreement report, gold-standard sample; root-cause hypothesis; decision/action; risk note; role handoff; standard operating rule; reviewer checklist; escalation matrix; coaching note; audit evidence requirement.
Evidence fields to assess: captures expected 120,200 and actual 103,500 records; calculates or explains 13.9% variance; uses threshold rule correctly (critical label agreement must exceed 92% before release); cites at least three input documents; links evidence to root-cause hypothesis; states clear release/hold/correct/escalate decision; defines standard review rule; creates audit-ready reviewer criteria.
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
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-100' LIMIT 1),
  'B.Tech CSE - Data Engineering Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech AI & Data Science - Data Platform Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-100' LIMIT 1),
  'B.Tech AI & Data Science - Data Platform Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Data Science - Data Engineering Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-100' LIMIT 1),
  'B.Sc Data Science - Data Engineering Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MCA - Data Engineering / Cloud Data Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-100' LIMIT 1),
  'MCA - Data Engineering / Cloud Data Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Tech Data Engineering / Big Data Systems
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-100' LIMIT 1),
  'M.Tech Data Engineering / Big Data Systems',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Data Science - Data Operations Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-100' LIMIT 1),
  'B.Sc Data Science - Data Operations Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Set Review Standards for Semantic Knowledge Graph Validation
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Set Review Standards for Semantic Knowledge Graph Validation',
  'CRS-IND-CL-105',
  'By the end of this course, the learner can set measurable standards for Semantic Knowledge Graph Validation by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact. Workplace problem: A standards review is called because multiple teams handle entity-relation validation before search rollout differently when a semantic knowledge graph shows duplicate entities and invalid relationships. The expected volume is 360,570 triples, but only 294,840 triples are usable, creating a 18.2% variance against the control expectation. 4,800 customer entities are duplicated and 2.9% of supplier-to-product edges violate ontology rules. The accepted rule is: critical relation errors must remain below 1% before rollout. The learner receives ontology rule sheet, entity resolution sample, relationship validation report, SPARQL error extract, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Semantic Knowledge Graph Validation Pack. The learner must define review rules, evidence standards, escalation thresholds, and coaching notes for future cases. Artifact: Semantic Knowledge Graph Validation Pack - Standards and Review Pack.',
  '16 hours',
  'Active',
  'Synthetic Data, Labeling & Semantic Operations',
  'technical',
  '["By the end of this course, the learner can set measurable standards for Semantic Knowledge Graph Validation by using actual workplace inputs, numeric evidence, threshold rules, and an industry-ready artifact","Learner demonstrates Semantic Knowledge Graph Validation by interpreting real-looking numbers, comparing evidence from ontology rule sheet and entity resolution sample, and producing a decision-ready artifact","Proves the learner can perform standards and governance work in Semantic Knowledge Graph Validation with numeric evidence, workplace documents, and a reviewer-ready artifact. Status: Pilot Ready — Evidence Strengthening Needed"]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: L5 Module: Semantic Knowledge Graph Validation Workplace Mission
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-105' LIMIT 1),
  'L5 Module: Semantic Knowledge Graph Validation Workplace Mission',
  'Industry requirement: Teams responsible for a semantic knowledge graph need learners who can use numeric evidence, threshold rules, and workplace documents to make reliable decisions during entity-relation validation before search rollout, not only explain Semantic Knowledge Graph Validation theoretically. Gap addressed: Academic learning may cover the concepts behind Semantic Knowledge Graph Validation, but it usually does not make learners practice with ontology rule sheet, entity resolution sample, relationship validation report, numeric variance, threshold decisions, and role handoff artifacts. Trigger: leaders need a standard rule so different teams stop making inconsistent decisions: 294,840 of 360,570 triples passed the check, variance 18.2%, with signal ''duplicate entities and invalid relationships''.',
  1,
  '["Data & AI","Synthetic Data, Labeling & Semantic Operations","Semantic Knowledge Graph Validation","Primary: Evidence. Supporting: Domain, Technical, AI/Digital, Behavioural","entity resolution","ontology constraint","relationship validation","graph quality rule","semantic search impact","expected 360,570 vs actual 294,840 triples","18.2% variance interpretation","threshold rule: critical relation errors must remain below 1% before rollout","review standard definition","auditability","coaching rule"]'::jsonb,
  '["Engage: Learner receives a standards and governance case: entity-relation validation before search rollout is at risk because only 294,840 of 360,570 triples passed the control and duplicate entities and invalid relationships is visible","Explore: Learner reviews ontology rule sheet, entity resolution sample, relationship validation report, SPARQL error extract, search relevance issue log, highlights the fields that prove the issue, and notes which values cross the threshold","Explain: Learner studies entity resolution, ontology constraint, relationship validation, graph quality rule and learns how these concepts explain the business risk, not just the technical error","Express: Learner prepares the Semantic Knowledge Graph Validation Pack with issue summary, numeric evidence, root-cause hypothesis, decision, and handoff note","Empower: Learner must define standards, thresholds, and reviewer responsibilities for entity-relation validation before search rollout","Evolve: Learner creates a coaching note so another reviewer can apply the standard consistently"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Scenario: Semantic Knowledge Graph Validation Pack - Standards and Review Pack
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-105' LIMIT 1)
   AND title = 'L5 Module: Semantic Knowledge Graph Validation Workplace Mission' LIMIT 1),
  'Workplace Scenario: Semantic Knowledge Graph Validation Pack - Standards and Review Pack',
  'A standards review is called because multiple teams handle entity-relation validation before search rollout differently when a semantic knowledge graph shows duplicate entities and invalid relationships. The expected volume is 360,570 triples, but only 294,840 triples are usable, creating a 18.2% variance against the control expectation. 4,800 customer entities are duplicated and 2.9% of supplier-to-product edges violate ontology rules. The accepted rule is: critical relation errors must remain below 1% before rollout. The learner receives ontology rule sheet, entity resolution sample, relationship validation report, SPARQL error extract, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Semantic Knowledge Graph Validation Pack. The learner must define review rules, evidence standards, escalation thresholds, and coaching notes for future cases. Pressure points: Entity-relation validation before search rollout is time-sensitive; variance is 18.2% against the rule; 4,800 customer entities are duplicated and 2.9% of supplier-to-product edges violate ontology rules; multiple teams need a common standard, audit trace, and coaching rule for future decisions.',
  'Course trigger: leaders need a standard rule so different teams stop making inconsistent decisions: 294,840 of 360,570 triples passed the check, variance 18.2%, with signal ''duplicate entities and invalid relationships''.
Problem statement: A standards review is called because multiple teams handle entity-relation validation before search rollout differently when a semantic knowledge graph shows duplicate entities and invalid relationships. The expected volume is 360,570 triples, but only 294,840 triples are usable, creating a 18.2% variance against the control expectation. 4,800 customer entities are duplicated and 2.9% of supplier-to-product edges violate ontology rules. The accepted rule is: critical relation errors must remain below 1% before rollout. The learner receives ontology rule sheet, entity resolution sample, relationship validation report, SPARQL error extract, compares the evidence against the rule, decides whether to release, hold, correct, escalate, or redesign the workflow, and produces the Semantic Knowledge Graph Validation Pack. The learner must define review rules, evidence standards, escalation thresholds, and coaching notes for future cases.
Major concepts: entity resolution; ontology constraint; relationship validation; graph quality rule; semantic search impact; expected 360,570 vs actual 294,840 triples; 18.2% variance interpretation; threshold rule: critical relation errors must remain below 1% before rollout; review standard definition; auditability; coaching rule.
Root-cause focus: Define standards that distinguish: entity duplication, wrong relationship type, ontology constraint violation, stale source mapping, or weak synonym handling. Evidence must come from ontology rule sheet, entity resolution sample, relationship validation report.
Required data: ontology rule sheet; entity resolution sample; relationship validation report; SPARQL error extract; search relevance issue log; audit observation summary; cross-team decision examples; standard template draft
Artifact: Semantic Knowledge Graph Validation Pack - Standards and Review Pack
Artifact structure: case summary; expected vs actual numbers; threshold rule; evidence table from ontology rule sheet, entity resolution sample, relationship validation report; root-cause hypothesis; decision/action; risk note; role handoff; standard operating rule; reviewer checklist; escalation matrix; coaching note; audit evidence requirement.
Evidence fields to assess: captures expected 360,570 and actual 294,840 triples; calculates or explains 18.2% variance; uses threshold rule correctly (critical relation errors must remain below 1% before rollout); cites at least three input documents; links evidence to root-cause hypothesis; states clear release/hold/correct/escalate decision; defines standard review rule; creates audit-ready reviewer criteria.
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
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-105' LIMIT 1),
  'B.Tech CSE - Data Engineering Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech AI & Data Science - Data Platform Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-105' LIMIT 1),
  'B.Tech AI & Data Science - Data Platform Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Data Science - Data Engineering Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-105' LIMIT 1),
  'B.Sc Data Science - Data Engineering Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MCA - Data Engineering / Cloud Data Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-105' LIMIT 1),
  'MCA - Data Engineering / Cloud Data Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Tech Data Engineering / Big Data Systems
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-105' LIMIT 1),
  'M.Tech Data Engineering / Big Data Systems',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Data Science - Data Operations Track
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'CRS-IND-CL-105' LIMIT 1),
  'B.Sc Data Science - Data Operations Track',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Cohort Scheduling Intake & Readiness Checklist
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Cohort Scheduling Intake & Readiness Checklist',
  'COURSE-L1-001',
  'Learner can identify inputs, check completeness, and create a safe handoff draft for cohort session schedules from calendar, facilitator, learner, and resource constraints and submit a workplace-ready L1 Cohort Scheduling Intake Checklist. Workplace scenario: A training centre is preparing a weekly cohort timetable for 240 learners across 3 batches. The issue is that two facilitators are unavailable, one lab is double-booked, 18 learners were added late, and a holiday was missed. The learner must check and organise the given records, mark what is complete or missing, and create a handoff-ready cohort scheduling checklist before work moves to the next person. Learner artifact: L1 Cohort Scheduling Intake Checklist. Required data: academic calendar, facilitator roster, room/lab tracker, batch list, holiday calendar, session duration rules, approval notes. Evidence: Assess whether the learner captured the right data sources, identified missing or conflicting items, avoided assumptions, and created a handoff that another team member can use.',
  '8 hours',
  'Active',
  'Formal Education & Lifelong Learning Delivery',
  'technical',
  '["Triggered when a guided intake and readiness task needs a real workplace artifact, not a theory answer.","Demonstrates guided intake and readiness by producing and defending the L1 Cohort Scheduling Intake Checklist.","Learner can identify inputs, check completeness, and create a safe handoff draft for cohort session schedules from calendar, facilitator, learner, and resource constraints and submit a workplace-ready L1 Cohort Scheduling Intake Checklist."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: Module 1: Cohort Scheduling Intake & Readiness Checklist Workplace Artifact Build
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-001' LIMIT 1),
  'Module 1: Cohort Scheduling Intake & Readiness Checklist Workplace Artifact Build',
  'Triggered when a guided intake and readiness task needs a real workplace artifact, not a theory answer. The learner studies the case, reviews the required data, identifies the gap, creates the artifact, and checks it against evidence fields.',
  1,
  '["Education & Skilling","Formal Education & Lifelong Learning Delivery","IND-CAP-01","L1","Academic calendar logic","Batch-wise timetable sequencing","Facilitator availability check","Room and resource constraint mapping","Conflict log and priority rules"]'::jsonb,
  '["Engage","Explore","Explain","Express","Empower","Evolve","Artifact Build","Evidence Review","AI-Coached Retry"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Case: Cohort Scheduling Intake & Readiness Checklist
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-001' LIMIT 1)
   AND title = 'Module 1: Cohort Scheduling Intake & Readiness Checklist Workplace Artifact Build' LIMIT 1),
  'Workplace Case: Cohort Scheduling Intake & Readiness Checklist',
  'A training centre is preparing a weekly cohort timetable for 240 learners across 3 batches. The issue is that two facilitators are unavailable, one lab is double-booked, 18 learners were added late, and a holiday was missed. The learner must check and organise the given records, mark what is complete or missing, and create a handoff-ready cohort scheduling checklist before work moves to the next person. The learner must solve the problem using the given data and produce the required workplace artifact.',
  'Workplace problem: A training centre is preparing a weekly cohort timetable for 240 learners across 3 batches. The issue is that two facilitators are unavailable, one lab is double-booked, 18 learners were added late, and a holiday was missed. The learner must check and organise the given records, mark what is complete or missing, and create a handoff-ready cohort scheduling checklist before work moves to the next person. Pressure points: Deadline pressure: first handoff is due before the next operating step. Data pressure: academic calendar, facilitator roster, room/lab tracker, batch list, holiday calendar, session duration rules, approval notes. Risk: if one input is accepted without checking, the next team may act on wrong or incomplete information. Root cause focus: Check whether the failure comes from missing source data, unclear ownership, outdated records, misunderstood rule, or incomplete handoff format. Major concepts: Academic calendar logic; Batch-wise timetable sequencing; Facilitator availability check; Room and resource constraint mapping; Conflict log and priority rules; Schedule release handoff; Source-of-truth check; Completeness vs correctness; Safe handoff. Level focus: intake and readiness. Required data: academic calendar, facilitator roster, room/lab tracker, batch list, holiday calendar, session duration rules, approval notes Learner activity flow: Engage - Start with the case: 240 learners across 3 batches and the visible pain point — two facilitators are unavailable, one lab is double-booked, 18 learners were added late, and a holiday was missed. Learner identifies who is affected and what could go wrong if the work is delayed or wrong. Explore - Learner studies the source data: academic calendar, facilitator roster, room/lab tracker, batch list, holiday calendar, session duration rules, approval notes. They mark trusted records, missing fields, conflicting entries, and items that need confirmation before using them in the artifact. Explain - Teach the main logic in simple terms: Academic calendar logic; Batch-wise timetable sequencing; Facilitator availability check; Room and resource constraint mapping; Conflict log and priority rules; Schedule release handoff; Source-of-truth check; Completeness vs correctness; Safe handoff. Level focus: intake and readiness. Show how rules, evidence, decisions, and handoff notes connect in this workplace task. Express - Learner produces the L1 Cohort Scheduling Intake Checklist using the case data, writes decisions in plain English, and shows evidence for each important field instead of giving only a theory answer. Empower - Learner uses AI only as a coach: ask for missing-field checks, clarity prompts, risk questions, and retry suggestions. AI should not create the final artifact for the learner. Evolve - Learner notes what would become harder at L2: more records, more conflicts, less guidance, stronger evidence expectations, and higher decision responsibility. Artifact to submit: L1 Cohort Scheduling Intake Checklist. L1 Cohort Scheduling Intake Checklist should contain: case details; source data checklist; missing-item log; first-pass validation marks; risk notes; handoff owner and date. Required source data: academic calendar, facilitator roster, room/lab tracker, batch list, holiday calendar, session duration rules, approval notes. Evidence fields: Assess whether the learner captured the right data sources, identified missing or conflicting items, avoided assumptions, and created a handoff that another team member can use. AI support: AI coach can ask: What source proves this? Which field is missing? What is the risk if this is wrong? Who owns the next action? Learner must answer using the case data, not guesses.',
  1,
  '8 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Ed - School Education
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-001' LIMIT 1),
  'B.Ed - School Education',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Ed - Education Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-001' LIMIT 1),
  'M.Ed - Education Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BA Education
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-001' LIMIT 1),
  'BA Education',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BBA Education Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-001' LIMIT 1),
  'BBA Education Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PG Diploma Education Administration
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-001' LIMIT 1),
  'PG Diploma Education Administration',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Learner Progression Intake & Readiness Checklist
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Learner Progression Intake & Readiness Checklist',
  'COURSE-L1-006',
  'Learner can identify inputs, check completeness, and create a safe handoff draft for learner progression decisions using attendance, assessment, and participation evidence and submit a workplace-ready L1 Learner Progression Intake Checklist. Workplace scenario: A program office is preparing a progression decision list for 126 learners at module-end review. The issue is that attendance, assessment marks, project submissions, and remedial records do not match for 31 learners. The learner must check and organise the given records, mark what is complete or missing, and create a handoff-ready learner progression checklist before work moves to the next person. Learner artifact: L1 Learner Progression Intake Checklist. Required data: attendance sheet, assessment scores, project submission tracker, remediation log, progression criteria, mentor comments. Evidence: Assess whether the learner captured the right data sources, identified missing or conflicting items, avoided assumptions, and created a handoff that another team member can use.',
  '8 hours',
  'Active',
  'Formal Education & Lifelong Learning Delivery',
  'technical',
  '["Triggered when a guided intake and readiness task needs a real workplace artifact, not a theory answer.","Demonstrates guided intake and readiness by producing and defending the L1 Learner Progression Intake Checklist.","Learner can identify inputs, check completeness, and create a safe handoff draft for learner progression decisions using attendance, assessment, and participation evidence and submit a workplace-ready L1 Learner Progression Intake Checklist."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: Module 1: Learner Progression Intake & Readiness Checklist Workplace Artifact Build
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-006' LIMIT 1),
  'Module 1: Learner Progression Intake & Readiness Checklist Workplace Artifact Build',
  'Triggered when a guided intake and readiness task needs a real workplace artifact, not a theory answer. The learner studies the case, reviews the required data, identifies the gap, creates the artifact, and checks it against evidence fields.',
  1,
  '["Education & Skilling","Formal Education & Lifelong Learning Delivery","IND-CAP-02","L1","Progression rule interpretation","Evidence-based learner routing","Attendance and assessment thresholds","Remediation decision logic","Status tagging"]'::jsonb,
  '["Engage","Explore","Explain","Express","Empower","Evolve","Artifact Build","Evidence Review","AI-Coached Retry"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Case: Learner Progression Intake & Readiness Checklist
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-006' LIMIT 1)
   AND title = 'Module 1: Learner Progression Intake & Readiness Checklist Workplace Artifact Build' LIMIT 1),
  'Workplace Case: Learner Progression Intake & Readiness Checklist',
  'A program office is preparing a progression decision list for 126 learners at module-end review. The issue is that attendance, assessment marks, project submissions, and remedial records do not match for 31 learners. The learner must check and organise the given records, mark what is complete or missing, and create a handoff-ready learner progression checklist before work moves to the next person. The learner must solve the problem using the given data and produce the required workplace artifact.',
  'Workplace problem: A program office is preparing a progression decision list for 126 learners at module-end review. The issue is that attendance, assessment marks, project submissions, and remedial records do not match for 31 learners. The learner must check and organise the given records, mark what is complete or missing, and create a handoff-ready learner progression checklist before work moves to the next person. Pressure points: Deadline pressure: first handoff is due before the next operating step. Data pressure: attendance sheet, assessment scores, project submission tracker, remediation log, progression criteria, mentor comments. Risk: if one input is accepted without checking, the next team may act on wrong or incomplete information. Root cause focus: Check whether the failure comes from missing source data, unclear ownership, outdated records, misunderstood rule, or incomplete handoff format. Major concepts: Progression rule interpretation; Evidence-based learner routing; Attendance and assessment thresholds; Remediation decision logic; Status tagging; Learner handoff note; Source-of-truth check; Completeness vs correctness; Safe handoff. Level focus: intake and readiness. Required data: attendance sheet, assessment scores, project submission tracker, remediation log, progression criteria, mentor comments Learner activity flow: Engage - Start with the case: 126 learners at module-end review and the visible pain point — attendance, assessment marks, project submissions, and remedial records do not match for 31 learners. Learner identifies who is affected and what could go wrong if the work is delayed or wrong. Explore - Learner studies the source data: attendance sheet, assessment scores, project submission tracker, remediation log, progression criteria, mentor comments. They mark trusted records, missing fields, conflicting entries, and items that need confirmation before using them in the artifact. Explain - Teach the main logic in simple terms: Progression rule interpretation; Evidence-based learner routing; Attendance and assessment thresholds; Remediation decision logic; Status tagging; Learner handoff note; Source-of-truth check; Completeness vs correctness; Safe handoff. Level focus: intake and readiness. Show how rules, evidence, decisions, and handoff notes connect in this workplace task. Express - Learner produces the L1 Learner Progression Intake Checklist using the case data, writes decisions in plain English, and shows evidence for each important field instead of giving only a theory answer. Empower - Learner uses AI only as a coach: ask for missing-field checks, clarity prompts, risk questions, and retry suggestions. AI should not create the final artifact for the learner. Evolve - Learner notes what would become harder at L2: more records, more conflicts, less guidance, stronger evidence expectations, and higher decision responsibility. Artifact to submit: L1 Learner Progression Intake Checklist. L1 Learner Progression Intake Checklist should contain: case details; source data checklist; missing-item log; first-pass validation marks; risk notes; handoff owner and date. Required source data: attendance sheet, assessment scores, project submission tracker, remediation log, progression criteria, mentor comments. Evidence fields: Assess whether the learner captured the right data sources, identified missing or conflicting items, avoided assumptions, and created a handoff that another team member can use. AI support: AI coach can ask: What source proves this? Which field is missing? What is the risk if this is wrong? Who owns the next action? Learner must answer using the case data, not guesses.',
  1,
  '8 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Ed - School Education
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-006' LIMIT 1),
  'B.Ed - School Education',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Ed - Education Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-006' LIMIT 1),
  'M.Ed - Education Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BA Education
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-006' LIMIT 1),
  'BA Education',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MA Education
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-006' LIMIT 1),
  'MA Education',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Voc Education Operations
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-006' LIMIT 1),
  'B.Voc Education Operations',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Academic Record Activation Intake & Readiness Checklist
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Academic Record Activation Intake & Readiness Checklist',
  'COURSE-L1-011',
  'Learner can identify inputs, check completeness, and create a safe handoff draft for learner academic records through eligibility, program-rule, and enrollment verification and submit a workplace-ready L1 Academic Record Activation Intake Checklist. Workplace scenario: An admissions desk is preparing an academic record activation file for 180 admitted learners before orientation. The issue is that 24 eligibility documents are missing, 11 program codes are wrong, and fee-status updates are not synced in the ERP. The learner must check and organise the given records, mark what is complete or missing, and create a handoff-ready academic record activation checklist before work moves to the next person. Learner artifact: L1 Academic Record Activation Intake Checklist. Required data: eligibility documents, program rules, enrollment forms, ID proof, fee-status sheet, ERP fields, approval trail. Evidence: Assess whether the learner captured the right data sources, identified missing or conflicting items, avoided assumptions, and created a handoff that another team member can use.',
  '8 hours',
  'Active',
  'Formal Education & Lifelong Learning Delivery',
  'technical',
  '["Triggered when a guided intake and readiness task needs a real workplace artifact, not a theory answer.","Demonstrates guided intake and readiness by producing and defending the L1 Academic Record Activation Intake Checklist.","Learner can identify inputs, check completeness, and create a safe handoff draft for learner academic records through eligibility, program-rule, and enrollment verification and submit a workplace-ready L1 Academic Record Activation Intake Checklist."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: Module 1: Academic Record Activation Intake & Readiness Checklist Workplace Artifact Build
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-011' LIMIT 1),
  'Module 1: Academic Record Activation Intake & Readiness Checklist Workplace Artifact Build',
  'Triggered when a guided intake and readiness task needs a real workplace artifact, not a theory answer. The learner studies the case, reviews the required data, identifies the gap, creates the artifact, and checks it against evidence fields.',
  1,
  '["Education & Skilling","Formal Education & Lifelong Learning Delivery","IND-CAP-03","L1","Eligibility verification","Program-rule mapping","Enrollment status control","ERP field accuracy","Missing-document tracking"]'::jsonb,
  '["Engage","Explore","Explain","Express","Empower","Evolve","Artifact Build","Evidence Review","AI-Coached Retry"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Case: Academic Record Activation Intake & Readiness Checklist
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-011' LIMIT 1)
   AND title = 'Module 1: Academic Record Activation Intake & Readiness Checklist Workplace Artifact Build' LIMIT 1),
  'Workplace Case: Academic Record Activation Intake & Readiness Checklist',
  'An admissions desk is preparing an academic record activation file for 180 admitted learners before orientation. The issue is that 24 eligibility documents are missing, 11 program codes are wrong, and fee-status updates are not synced in the ERP. The learner must check and organise the given records, mark what is complete or missing, and create a handoff-ready academic record activation checklist before work moves to the next person. The learner must solve the problem using the given data and produce the required workplace artifact.',
  'Workplace problem: An admissions desk is preparing an academic record activation file for 180 admitted learners before orientation. The issue is that 24 eligibility documents are missing, 11 program codes are wrong, and fee-status updates are not synced in the ERP. The learner must check and organise the given records, mark what is complete or missing, and create a handoff-ready academic record activation checklist before work moves to the next person. Pressure points: Deadline pressure: first handoff is due before the next operating step. Data pressure: eligibility documents, program rules, enrollment forms, ID proof, fee-status sheet, ERP fields, approval trail. Risk: if one input is accepted without checking, the next team may act on wrong or incomplete information. Root cause focus: Check whether the failure comes from missing source data, unclear ownership, outdated records, misunderstood rule, or incomplete handoff format. Major concepts: Eligibility verification; Program-rule mapping; Enrollment status control; ERP field accuracy; Missing-document tracking; Activation approval handoff; Source-of-truth check; Completeness vs correctness; Safe handoff. Level focus: intake and readiness. Required data: eligibility documents, program rules, enrollment forms, ID proof, fee-status sheet, ERP fields, approval trail Learner activity flow: Engage - Start with the case: 180 admitted learners before orientation and the visible pain point — 24 eligibility documents are missing, 11 program codes are wrong, and fee-status updates are not synced in the ERP. Learner identifies who is affected and what could go wrong if the work is delayed or wrong. Explore - Learner studies the source data: eligibility documents, program rules, enrollment forms, ID proof, fee-status sheet, ERP fields, approval trail. They mark trusted records, missing fields, conflicting entries, and items that need confirmation before using them in the artifact. Explain - Teach the main logic in simple terms: Eligibility verification; Program-rule mapping; Enrollment status control; ERP field accuracy; Missing-document tracking; Activation approval handoff; Source-of-truth check; Completeness vs correctness; Safe handoff. Level focus: intake and readiness. Show how rules, evidence, decisions, and handoff notes connect in this workplace task. Express - Learner produces the L1 Academic Record Activation Intake Checklist using the case data, writes decisions in plain English, and shows evidence for each important field instead of giving only a theory answer. Empower - Learner uses AI only as a coach: ask for missing-field checks, clarity prompts, risk questions, and retry suggestions. AI should not create the final artifact for the learner. Evolve - Learner notes what would become harder at L2: more records, more conflicts, less guidance, stronger evidence expectations, and higher decision responsibility. Artifact to submit: L1 Academic Record Activation Intake Checklist. L1 Academic Record Activation Intake Checklist should contain: case details; source data checklist; missing-item log; first-pass validation marks; risk notes; handoff owner and date. Required source data: eligibility documents, program rules, enrollment forms, ID proof, fee-status sheet, ERP fields, approval trail. Evidence fields: Assess whether the learner captured the right data sources, identified missing or conflicting items, avoided assumptions, and created a handoff that another team member can use. AI support: AI coach can ask: What source proves this? Which field is missing? What is the risk if this is wrong? Who owns the next action? Learner must answer using the case data, not guesses.',
  1,
  '8 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BBA Education Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-011' LIMIT 1),
  'BBA Education Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Com - Education Administration
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-011' LIMIT 1),
  'B.Com - Education Administration',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BA Public Administration
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-011' LIMIT 1),
  'BA Public Administration',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MBA Education Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-011' LIMIT 1),
  'MBA Education Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PG Diploma Higher Education Administration
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-011' LIMIT 1),
  'PG Diploma Higher Education Administration',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Adult Learner Pathway Intake & Readiness Checklist
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Adult Learner Pathway Intake & Readiness Checklist',
  'COURSE-L1-016',
  'Learner can identify inputs, check completeness, and create a safe handoff draft for adult learner pathways from goals, prior learning, access constraints, and progress evidence and submit a workplace-ready L1 Adult Learner Pathway Intake Checklist. Workplace scenario: A lifelong learning centre is preparing an adult learner pathway plan for 64 working adult learners. The issue is that learners have mixed prior learning, different shift timings, low device access, and unclear career goals. The learner must check and organise the given records, mark what is complete or missing, and create a handoff-ready adult learner pathway checklist before work moves to the next person. Learner artifact: L1 Adult Learner Pathway Intake Checklist. Required data: learner goal form, prior learning proof, schedule constraints, device/access survey, language comfort data, course options. Evidence: Assess whether the learner captured the right data sources, identified missing or conflicting items, avoided assumptions, and created a handoff that another team member can use.',
  '8 hours',
  'Active',
  'Formal Education & Lifelong Learning Delivery',
  'soft',
  '["Triggered when a guided intake and readiness task needs a real workplace artifact, not a theory answer.","Demonstrates guided intake and readiness by producing and defending the L1 Adult Learner Pathway Intake Checklist.","Learner can identify inputs, check completeness, and create a safe handoff draft for adult learner pathways from goals, prior learning, access constraints, and progress evidence and submit a workplace-ready L1 Adult Learner Pathway Intake Checklist."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: Module 1: Adult Learner Pathway Intake & Readiness Checklist Workplace Artifact Build
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-016' LIMIT 1),
  'Module 1: Adult Learner Pathway Intake & Readiness Checklist Workplace Artifact Build',
  'Triggered when a guided intake and readiness task needs a real workplace artifact, not a theory answer. The learner studies the case, reviews the required data, identifies the gap, creates the artifact, and checks it against evidence fields.',
  1,
  '["Education & Skilling","Formal Education & Lifelong Learning Delivery","IND-CAP-04","L1","Recognition of prior learning","Flexible pathway planning","Access constraint mapping","Adult motivation factors","Goal-to-course alignment"]'::jsonb,
  '["Engage","Explore","Explain","Express","Empower","Evolve","Artifact Build","Evidence Review","AI-Coached Retry"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Case: Adult Learner Pathway Intake & Readiness Checklist
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-016' LIMIT 1)
   AND title = 'Module 1: Adult Learner Pathway Intake & Readiness Checklist Workplace Artifact Build' LIMIT 1),
  'Workplace Case: Adult Learner Pathway Intake & Readiness Checklist',
  'A lifelong learning centre is preparing an adult learner pathway plan for 64 working adult learners. The issue is that learners have mixed prior learning, different shift timings, low device access, and unclear career goals. The learner must check and organise the given records, mark what is complete or missing, and create a handoff-ready adult learner pathway checklist before work moves to the next person. The learner must solve the problem using the given data and produce the required workplace artifact.',
  'Workplace problem: A lifelong learning centre is preparing an adult learner pathway plan for 64 working adult learners. The issue is that learners have mixed prior learning, different shift timings, low device access, and unclear career goals. The learner must check and organise the given records, mark what is complete or missing, and create a handoff-ready adult learner pathway checklist before work moves to the next person. Pressure points: Deadline pressure: first handoff is due before the next operating step. Data pressure: learner goal form, prior learning proof, schedule constraints, device/access survey, language comfort data, course options. Risk: if one input is accepted without checking, the next team may act on wrong or incomplete information. Root cause focus: Check whether the failure comes from missing source data, unclear ownership, outdated records, misunderstood rule, or incomplete handoff format. Major concepts: Recognition of prior learning; Flexible pathway planning; Access constraint mapping; Adult motivation factors; Goal-to-course alignment; Support routing; Source-of-truth check; Completeness vs correctness; Safe handoff. Level focus: intake and readiness. Required data: learner goal form, prior learning proof, schedule constraints, device/access survey, language comfort data, course options Learner activity flow: Engage - Start with the case: 64 working adult learners and the visible pain point — learners have mixed prior learning, different shift timings, low device access, and unclear career goals. Learner identifies who is affected and what could go wrong if the work is delayed or wrong. Explore - Learner studies the source data: learner goal form, prior learning proof, schedule constraints, device/access survey, language comfort data, course options. They mark trusted records, missing fields, conflicting entries, and items that need confirmation before using them in the artifact. Explain - Teach the main logic in simple terms: Recognition of prior learning; Flexible pathway planning; Access constraint mapping; Adult motivation factors; Goal-to-course alignment; Support routing; Source-of-truth check; Completeness vs correctness; Safe handoff. Level focus: intake and readiness. Show how rules, evidence, decisions, and handoff notes connect in this workplace task. Express - Learner produces the L1 Adult Learner Pathway Intake Checklist using the case data, writes decisions in plain English, and shows evidence for each important field instead of giving only a theory answer. Empower - Learner uses AI only as a coach: ask for missing-field checks, clarity prompts, risk questions, and retry suggestions. AI should not create the final artifact for the learner. Evolve - Learner notes what would become harder at L2: more records, more conflicts, less guidance, stronger evidence expectations, and higher decision responsibility. Artifact to submit: L1 Adult Learner Pathway Intake Checklist. L1 Adult Learner Pathway Intake Checklist should contain: case details; source data checklist; missing-item log; first-pass validation marks; risk notes; handoff owner and date. Required source data: learner goal form, prior learning proof, schedule constraints, device/access survey, language comfort data, course options. Evidence fields: Assess whether the learner captured the right data sources, identified missing or conflicting items, avoided assumptions, and created a handoff that another team member can use. AI support: AI coach can ask: What source proves this? Which field is missing? What is the risk if this is wrong? Who owns the next action? Learner must answer using the case data, not guesses.',
  1,
  '8 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BA Education
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-016' LIMIT 1),
  'BA Education',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MA Adult Education
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-016' LIMIT 1),
  'MA Adult Education',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BSW - Community Education
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-016' LIMIT 1),
  'BSW - Community Education',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Voc Skill Development
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-016' LIMIT 1),
  'B.Voc Skill Development',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PG Diploma Lifelong Learning
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-016' LIMIT 1),
  'PG Diploma Lifelong Learning',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Curriculum Mapping Intake & Readiness Checklist
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Curriculum Mapping Intake & Readiness Checklist',
  'COURSE-L1-021',
  'Learner can identify inputs, check completeness, and create a safe handoff draft for translate standards and role outcomes into curriculum maps, learning sequences, and alignment boundaries and submit a workplace-ready L1 Curriculum Mapping Intake Checklist. Workplace scenario: An academic department is preparing a curriculum outcome alignment map for 6 modules and 42 lesson activities. The issue is that learning outcomes, activities, assessments, and workplace evidence do not clearly connect. The learner must check and organise the given records, mark what is complete or missing, and create a handoff-ready curriculum mapping checklist before work moves to the next person. Learner artifact: L1 Curriculum Mapping Intake Checklist. Required data: syllabus, module outcomes, activity list, assessment plan, competency requirements, evidence expectations. Evidence: Assess whether the learner captured the right data sources, identified missing or conflicting items, avoided assumptions, and created a handoff that another team member can use.',
  '8 hours',
  'Active',
  'Curriculum, Pedagogy & Learning Design',
  'technical',
  '["Triggered when a guided intake and readiness task needs a real workplace artifact, not a theory answer.","Demonstrates guided intake and readiness by producing and defending the L1 Curriculum Mapping Intake Checklist.","Learner can identify inputs, check completeness, and create a safe handoff draft for translate standards and role outcomes into curriculum maps, learning sequences, and alignment boundaries and submit a workplace-ready L1 Curriculum Mapping Intake Checklist."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: Module 1: Curriculum Mapping Intake & Readiness Checklist Workplace Artifact Build
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-021' LIMIT 1),
  'Module 1: Curriculum Mapping Intake & Readiness Checklist Workplace Artifact Build',
  'Triggered when a guided intake and readiness task needs a real workplace artifact, not a theory answer. The learner studies the case, reviews the required data, identifies the gap, creates the artifact, and checks it against evidence fields.',
  1,
  '["Education & Skilling","Curriculum, Pedagogy & Learning Design","IND-CAP-05","L1","Outcome mapping","Constructive alignment","Competency-to-activity link","Assessment coverage check","Gap identification"]'::jsonb,
  '["Engage","Explore","Explain","Express","Empower","Evolve","Artifact Build","Evidence Review","AI-Coached Retry"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Case: Curriculum Mapping Intake & Readiness Checklist
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-021' LIMIT 1)
   AND title = 'Module 1: Curriculum Mapping Intake & Readiness Checklist Workplace Artifact Build' LIMIT 1),
  'Workplace Case: Curriculum Mapping Intake & Readiness Checklist',
  'An academic department is preparing a curriculum outcome alignment map for 6 modules and 42 lesson activities. The issue is that learning outcomes, activities, assessments, and workplace evidence do not clearly connect. The learner must check and organise the given records, mark what is complete or missing, and create a handoff-ready curriculum mapping checklist before work moves to the next person. The learner must solve the problem using the given data and produce the required workplace artifact.',
  'Workplace problem: An academic department is preparing a curriculum outcome alignment map for 6 modules and 42 lesson activities. The issue is that learning outcomes, activities, assessments, and workplace evidence do not clearly connect. The learner must check and organise the given records, mark what is complete or missing, and create a handoff-ready curriculum mapping checklist before work moves to the next person. Pressure points: Deadline pressure: first handoff is due before the next operating step. Data pressure: syllabus, module outcomes, activity list, assessment plan, competency requirements, evidence expectations. Risk: if one input is accepted without checking, the next team may act on wrong or incomplete information. Root cause focus: Check whether the failure comes from missing source data, unclear ownership, outdated records, misunderstood rule, or incomplete handoff format. Major concepts: Outcome mapping; Constructive alignment; Competency-to-activity link; Assessment coverage check; Gap identification; Curriculum evidence map; Source-of-truth check; Completeness vs correctness; Safe handoff. Level focus: intake and readiness. Required data: syllabus, module outcomes, activity list, assessment plan, competency requirements, evidence expectations Learner activity flow: Engage - Start with the case: 6 modules and 42 lesson activities and the visible pain point — learning outcomes, activities, assessments, and workplace evidence do not clearly connect. Learner identifies who is affected and what could go wrong if the work is delayed or wrong. Explore - Learner studies the source data: syllabus, module outcomes, activity list, assessment plan, competency requirements, evidence expectations. They mark trusted records, missing fields, conflicting entries, and items that need confirmation before using them in the artifact. Explain - Teach the main logic in simple terms: Outcome mapping; Constructive alignment; Competency-to-activity link; Assessment coverage check; Gap identification; Curriculum evidence map; Source-of-truth check; Completeness vs correctness; Safe handoff. Level focus: intake and readiness. Show how rules, evidence, decisions, and handoff notes connect in this workplace task. Express - Learner produces the L1 Curriculum Mapping Intake Checklist using the case data, writes decisions in plain English, and shows evidence for each important field instead of giving only a theory answer. Empower - Learner uses AI only as a coach: ask for missing-field checks, clarity prompts, risk questions, and retry suggestions. AI should not create the final artifact for the learner. Evolve - Learner notes what would become harder at L2: more records, more conflicts, less guidance, stronger evidence expectations, and higher decision responsibility. Artifact to submit: L1 Curriculum Mapping Intake Checklist. L1 Curriculum Mapping Intake Checklist should contain: case details; source data checklist; missing-item log; first-pass validation marks; risk notes; handoff owner and date. Required source data: syllabus, module outcomes, activity list, assessment plan, competency requirements, evidence expectations. Evidence fields: Assess whether the learner captured the right data sources, identified missing or conflicting items, avoided assumptions, and created a handoff that another team member can use. AI support: AI coach can ask: What source proves this? Which field is missing? What is the risk if this is wrong? Who owns the next action? Learner must answer using the case data, not guesses.',
  1,
  '8 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Ed - Curriculum Studies
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-021' LIMIT 1),
  'B.Ed - Curriculum Studies',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Ed - Curriculum and Instruction
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-021' LIMIT 1),
  'M.Ed - Curriculum and Instruction',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BA Education
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-021' LIMIT 1),
  'BA Education',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MA Education
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-021' LIMIT 1),
  'MA Education',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PG Diploma Instructional Design
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-021' LIMIT 1),
  'PG Diploma Instructional Design',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: e-learning Content Release Intake & Readiness Checklist
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'e-learning Content Release Intake & Readiness Checklist',
  'COURSE-L1-026',
  'Learner can identify inputs, check completeness, and create a safe handoff draft for release e-learning content through storyboard, asset, accessibility, and qa controls and submit a workplace-ready L1 e-learning Content Release Intake Checklist. Workplace scenario: A online course team is preparing a digital content release checklist for 38 digital learning assets for a 4-week course. The issue is that video links, captions, quiz rules, file versions, and mobile previews are inconsistent before launch. The learner must check and organise the given records, mark what is complete or missing, and create a handoff-ready e-learning content release checklist before work moves to the next person. Learner artifact: L1 e-learning Content Release Intake Checklist. Required data: content inventory, LMS upload list, video links, caption files, quiz settings, version tracker, QA checklist. Evidence: Assess whether the learner captured the right data sources, identified missing or conflicting items, avoided assumptions, and created a handoff that another team member can use.',
  '8 hours',
  'Active',
  'Curriculum, Pedagogy & Learning Design',
  'technical',
  '["Triggered when a guided intake and readiness task needs a real workplace artifact, not a theory answer.","Demonstrates guided intake and readiness by producing and defending the L1 e-Learning Content Release Intake Checklist.","Learner can identify inputs, check completeness, and create a safe handoff draft for release e-learning content through storyboard, asset, accessibility, and qa controls and submit a workplace-ready L1 e-Learning Content Release Intake Checklist."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: Module 1: e-learning Content Release Intake & Readiness Checklist Workplace Artifact Build
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-026' LIMIT 1),
  'Module 1: e-learning Content Release Intake & Readiness Checklist Workplace Artifact Build',
  'Triggered when a guided intake and readiness task needs a real workplace artifact, not a theory answer. The learner studies the case, reviews the required data, identifies the gap, creates the artifact, and checks it against evidence fields.',
  1,
  '["Education & Skilling","Curriculum, Pedagogy & Learning Design","IND-CAP-06","L1","Digital asset readiness","Version control","Accessibility check","LMS content sequencing","Quiz rule validation"]'::jsonb,
  '["Engage","Explore","Explain","Express","Empower","Evolve","Artifact Build","Evidence Review","AI-Coached Retry"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Case: e-learning Content Release Intake & Readiness Checklist
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-026' LIMIT 1)
   AND title = 'Module 1: e-learning Content Release Intake & Readiness Checklist Workplace Artifact Build' LIMIT 1),
  'Workplace Case: e-learning Content Release Intake & Readiness Checklist',
  'A online course team is preparing a digital content release checklist for 38 digital learning assets for a 4-week course. The issue is that video links, captions, quiz rules, file versions, and mobile previews are inconsistent before launch. The learner must check and organise the given records, mark what is complete or missing, and create a handoff-ready e-learning content release checklist before work moves to the next person. The learner must solve the problem using the given data and produce the required workplace artifact.',
  'Workplace problem: A online course team is preparing a digital content release checklist for 38 digital learning assets for a 4-week course. The issue is that video links, captions, quiz rules, file versions, and mobile previews are inconsistent before launch. The learner must check and organise the given records, mark what is complete or missing, and create a handoff-ready e-learning content release checklist before work moves to the next person. Pressure points: Deadline pressure: first handoff is due before the next operating step. Data pressure: content inventory, LMS upload list, video links, caption files, quiz settings, version tracker, QA checklist. Risk: if one input is accepted without checking, the next team may act on wrong or incomplete information. Root cause focus: Check whether the failure comes from missing source data, unclear ownership, outdated records, misunderstood rule, or incomplete handoff format. Major concepts: Digital asset readiness; Version control; Accessibility check; LMS content sequencing; Quiz rule validation; Release sign-off; Source-of-truth check; Completeness vs correctness; Safe handoff. Level focus: intake and readiness. Required data: content inventory, LMS upload list, video links, caption files, quiz settings, version tracker, QA checklist Learner activity flow: Engage - Start with the case: 38 digital learning assets for a 4-week course and the visible pain point — video links, captions, quiz rules, file versions, and mobile previews are inconsistent before launch. Learner identifies who is affected and what could go wrong if the work is delayed or wrong. Explore - Learner studies the source data: content inventory, LMS upload list, video links, caption files, quiz settings, version tracker, QA checklist. They mark trusted records, missing fields, conflicting entries, and items that need confirmation before using them in the artifact. Explain - Teach the main logic in simple terms: Digital asset readiness; Version control; Accessibility check; LMS content sequencing; Quiz rule validation; Release sign-off; Source-of-truth check; Completeness vs correctness; Safe handoff. Level focus: intake and readiness. Show how rules, evidence, decisions, and handoff notes connect in this workplace task. Express - Learner produces the L1 e-learning Content Release Intake Checklist using the case data, writes decisions in plain English, and shows evidence for each important field instead of giving only a theory answer. Empower - Learner uses AI only as a coach: ask for missing-field checks, clarity prompts, risk questions, and retry suggestions. AI should not create the final artifact for the learner. Evolve - Learner notes what would become harder at L2: more records, more conflicts, less guidance, stronger evidence expectations, and higher decision responsibility. Artifact to submit: L1 e-learning Content Release Intake Checklist. L1 e-learning Content Release Intake Checklist should contain: case details; source data checklist; missing-item log; first-pass validation marks; risk notes; handoff owner and date. Required source data: content inventory, LMS upload list, video links, caption files, quiz settings, version tracker, QA checklist. Evidence fields: Assess whether the learner captured the right data sources, identified missing or conflicting items, avoided assumptions, and created a handoff that another team member can use. AI support: AI coach can ask: What source proves this? Which field is missing? What is the risk if this is wrong? Who owns the next action? Learner must answer using the case data, not guesses.',
  1,
  '8 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Ed - Digital Pedagogy
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-026' LIMIT 1),
  'B.Ed - Digital Pedagogy',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Ed - Educational Technology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-026' LIMIT 1),
  'M.Ed - Educational Technology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BCA
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-026' LIMIT 1),
  'BCA',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc IT
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-026' LIMIT 1),
  'B.Sc IT',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PG Diploma Instructional Design
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-026' LIMIT 1),
  'PG Diploma Instructional Design',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Teacher Development Intake & Readiness Checklist
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Teacher Development Intake & Readiness Checklist',
  'COURSE-L1-031',
  'Learner can identify inputs, check completeness, and create a safe handoff draft for and facilitate teacher development interventions linked to classroom practice gaps and submit a workplace-ready L1 Teacher Development Intake Checklist. Workplace scenario: A faculty development cell is preparing a teacher development session plan for 32 teachers attending a classroom strategy workshop. The issue is that teacher needs, session objectives, practice activities, and feedback tools are not aligned. The learner must check and organise the given records, mark what is complete or missing, and create a handoff-ready teacher development checklist before work moves to the next person. Learner artifact: L1 Teacher Development Intake Checklist. Required data: teacher needs survey, observation notes, session agenda, practice task sheet, feedback form, attendance list. Evidence: Assess whether the learner captured the right data sources, identified missing or conflicting items, avoided assumptions, and created a handoff that another team member can use.',
  '8 hours',
  'Active',
  'Curriculum, Pedagogy & Learning Design',
  'soft',
  '["Triggered when a guided intake and readiness task needs a real workplace artifact, not a theory answer.","Demonstrates guided intake and readiness by producing and defending the L1 Teacher Development Intake Checklist.","Learner can identify inputs, check completeness, and create a safe handoff draft for and facilitate teacher development interventions linked to classroom practice gaps and submit a workplace-ready L1 Teacher Development Intake Checklist."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: Module 1: Teacher Development Intake & Readiness Checklist Workplace Artifact Build
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-031' LIMIT 1),
  'Module 1: Teacher Development Intake & Readiness Checklist Workplace Artifact Build',
  'Triggered when a guided intake and readiness task needs a real workplace artifact, not a theory answer. The learner studies the case, reviews the required data, identifies the gap, creates the artifact, and checks it against evidence fields.',
  1,
  '["Education & Skilling","Curriculum, Pedagogy & Learning Design","IND-CAP-07","L1","Teacher needs analysis","Training objective design","Practice-based facilitation","Observation evidence","Feedback loop"]'::jsonb,
  '["Engage","Explore","Explain","Express","Empower","Evolve","Artifact Build","Evidence Review","AI-Coached Retry"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Case: Teacher Development Intake & Readiness Checklist
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-031' LIMIT 1)
   AND title = 'Module 1: Teacher Development Intake & Readiness Checklist Workplace Artifact Build' LIMIT 1),
  'Workplace Case: Teacher Development Intake & Readiness Checklist',
  'A faculty development cell is preparing a teacher development session plan for 32 teachers attending a classroom strategy workshop. The issue is that teacher needs, session objectives, practice activities, and feedback tools are not aligned. The learner must check and organise the given records, mark what is complete or missing, and create a handoff-ready teacher development checklist before work moves to the next person. The learner must solve the problem using the given data and produce the required workplace artifact.',
  'Workplace problem: A faculty development cell is preparing a teacher development session plan for 32 teachers attending a classroom strategy workshop. The issue is that teacher needs, session objectives, practice activities, and feedback tools are not aligned. The learner must check and organise the given records, mark what is complete or missing, and create a handoff-ready teacher development checklist before work moves to the next person. Pressure points: Deadline pressure: first handoff is due before the next operating step. Data pressure: teacher needs survey, observation notes, session agenda, practice task sheet, feedback form, attendance list. Risk: if one input is accepted without checking, the next team may act on wrong or incomplete information. Root cause focus: Check whether the failure comes from missing source data, unclear ownership, outdated records, misunderstood rule, or incomplete handoff format. Major concepts: Teacher needs analysis; Training objective design; Practice-based facilitation; Observation evidence; Feedback loop; Follow-up coaching; Source-of-truth check; Completeness vs correctness; Safe handoff. Level focus: intake and readiness. Required data: teacher needs survey, observation notes, session agenda, practice task sheet, feedback form, attendance list Learner activity flow: Engage - Start with the case: 32 teachers attending a classroom strategy workshop and the visible pain point — teacher needs, session objectives, practice activities, and feedback tools are not aligned. Learner identifies who is affected and what could go wrong if the work is delayed or wrong. Explore - Learner studies the source data: teacher needs survey, observation notes, session agenda, practice task sheet, feedback form, attendance list. They mark trusted records, missing fields, conflicting entries, and items that need confirmation before using them in the artifact. Explain - Teach the main logic in simple terms: Teacher needs analysis; Training objective design; Practice-based facilitation; Observation evidence; Feedback loop; Follow-up coaching; Source-of-truth check; Completeness vs correctness; Safe handoff. Level focus: intake and readiness. Show how rules, evidence, decisions, and handoff notes connect in this workplace task. Express - Learner produces the L1 Teacher Development Intake Checklist using the case data, writes decisions in plain English, and shows evidence for each important field instead of giving only a theory answer. Empower - Learner uses AI only as a coach: ask for missing-field checks, clarity prompts, risk questions, and retry suggestions. AI should not create the final artifact for the learner. Evolve - Learner notes what would become harder at L2: more records, more conflicts, less guidance, stronger evidence expectations, and higher decision responsibility. Artifact to submit: L1 Teacher Development Intake Checklist. L1 Teacher Development Intake Checklist should contain: case details; source data checklist; missing-item log; first-pass validation marks; risk notes; handoff owner and date. Required source data: teacher needs survey, observation notes, session agenda, practice task sheet, feedback form, attendance list. Evidence fields: Assess whether the learner captured the right data sources, identified missing or conflicting items, avoided assumptions, and created a handoff that another team member can use. AI support: AI coach can ask: What source proves this? Which field is missing? What is the risk if this is wrong? Who owns the next action? Learner must answer using the case data, not guesses.',
  1,
  '8 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Ed - Teacher Education
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-031' LIMIT 1),
  'B.Ed - Teacher Education',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Ed - Teacher Development
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-031' LIMIT 1),
  'M.Ed - Teacher Development',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MA Education
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-031' LIMIT 1),
  'MA Education',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PG Diploma Faculty Development
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-031' LIMIT 1),
  'PG Diploma Faculty Development',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PG Diploma Educational Leadership
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-031' LIMIT 1),
  'PG Diploma Educational Leadership',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: STEAM Maker-Lab Project Cycle Intake & Readiness Checklist
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'STEAM Maker-Lab Project Cycle Intake & Readiness Checklist',
  'COURSE-L1-036',
  'Learner can identify inputs, check completeness, and create a safe handoff draft for convert steam project goals into safe, resourced maker-lab learning cycles and submit a workplace-ready L1 STEAM Maker-Lab Project Cycle Intake Checklist. Workplace scenario: A school maker lab is preparing a STEAM project readiness file for 5 project teams using 3 shared lab zones. The issue is that materials, safety rules, mentor time, and project milestones are unclear before the lab cycle starts. The learner must check and organise the given records, mark what is complete or missing, and create a handoff-ready steam maker-lab project checklist before work moves to the next person. Learner artifact: L1 STEAM Maker-Lab Project Cycle Intake Checklist. Required data: project brief, material list, safety checklist, lab schedule, mentor roster, team list, milestone tracker. Evidence: Assess whether the learner captured the right data sources, identified missing or conflicting items, avoided assumptions, and created a handoff that another team member can use.',
  '8 hours',
  'Active',
  'Curriculum, Pedagogy & Learning Design',
  'technical',
  '["Triggered when a guided intake and readiness task needs a real workplace artifact, not a theory answer.","Demonstrates guided intake and readiness by producing and defending the L1 STEAM Maker-Lab Project Cycle Intake Checklist.","Learner can identify inputs, check completeness, and create a safe handoff draft for convert steam project goals into safe, resourced maker-lab learning cycles and submit a workplace-ready L1 STEAM Maker-Lab Project Cycle Intake Checklist."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: Module 1: STEAM Maker-Lab Project Cycle Intake & Readiness Checklist Workplace Artifact Build
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-036' LIMIT 1),
  'Module 1: STEAM Maker-Lab Project Cycle Intake & Readiness Checklist Workplace Artifact Build',
  'Triggered when a guided intake and readiness task needs a real workplace artifact, not a theory answer. The learner studies the case, reviews the required data, identifies the gap, creates the artifact, and checks it against evidence fields.',
  1,
  '["Education & Skilling","Curriculum, Pedagogy & Learning Design","IND-CAP-08","L1","Project cycle planning","Lab safety control","Material readiness","Mentor scheduling","Milestone tracking"]'::jsonb,
  '["Engage","Explore","Explain","Express","Empower","Evolve","Artifact Build","Evidence Review","AI-Coached Retry"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Case: STEAM Maker-Lab Project Cycle Intake & Readiness Checklist
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-036' LIMIT 1)
   AND title = 'Module 1: STEAM Maker-Lab Project Cycle Intake & Readiness Checklist Workplace Artifact Build' LIMIT 1),
  'Workplace Case: STEAM Maker-Lab Project Cycle Intake & Readiness Checklist',
  'A school maker lab is preparing a STEAM project readiness file for 5 project teams using 3 shared lab zones. The issue is that materials, safety rules, mentor time, and project milestones are unclear before the lab cycle starts. The learner must check and organise the given records, mark what is complete or missing, and create a handoff-ready steam maker-lab project checklist before work moves to the next person. The learner must solve the problem using the given data and produce the required workplace artifact.',
  'Workplace problem: A school maker lab is preparing a STEAM project readiness file for 5 project teams using 3 shared lab zones. The issue is that materials, safety rules, mentor time, and project milestones are unclear before the lab cycle starts. The learner must check and organise the given records, mark what is complete or missing, and create a handoff-ready steam maker-lab project checklist before work moves to the next person. Pressure points: Deadline pressure: first handoff is due before the next operating step. Data pressure: project brief, material list, safety checklist, lab schedule, mentor roster, team list, milestone tracker. Risk: if one input is accepted without checking, the next team may act on wrong or incomplete information. Root cause focus: Check whether the failure comes from missing source data, unclear ownership, outdated records, misunderstood rule, or incomplete handoff format. Major concepts: Project cycle planning; Lab safety control; Material readiness; Mentor scheduling; Milestone tracking; Student collaboration evidence; Source-of-truth check; Completeness vs correctness; Safe handoff. Level focus: intake and readiness. Required data: project brief, material list, safety checklist, lab schedule, mentor roster, team list, milestone tracker Learner activity flow: Engage - Start with the case: 5 project teams using 3 shared lab zones and the visible pain point — materials, safety rules, mentor time, and project milestones are unclear before the lab cycle starts. Learner identifies who is affected and what could go wrong if the work is delayed or wrong. Explore - Learner studies the source data: project brief, material list, safety checklist, lab schedule, mentor roster, team list, milestone tracker. They mark trusted records, missing fields, conflicting entries, and items that need confirmation before using them in the artifact. Explain - Teach the main logic in simple terms: Project cycle planning; Lab safety control; Material readiness; Mentor scheduling; Milestone tracking; Student collaboration evidence; Source-of-truth check; Completeness vs correctness; Safe handoff. Level focus: intake and readiness. Show how rules, evidence, decisions, and handoff notes connect in this workplace task. Express - Learner produces the L1 STEAM Maker-Lab Project Cycle Intake Checklist using the case data, writes decisions in plain English, and shows evidence for each important field instead of giving only a theory answer. Empower - Learner uses AI only as a coach: ask for missing-field checks, clarity prompts, risk questions, and retry suggestions. AI should not create the final artifact for the learner. Evolve - Learner notes what would become harder at L2: more records, more conflicts, less guidance, stronger evidence expectations, and higher decision responsibility. Artifact to submit: L1 STEAM Maker-Lab Project Cycle Intake Checklist. L1 STEAM Maker-Lab Project Cycle Intake Checklist should contain: case details; source data checklist; missing-item log; first-pass validation marks; risk notes; handoff owner and date. Required source data: project brief, material list, safety checklist, lab schedule, mentor roster, team list, milestone tracker. Evidence fields: Assess whether the learner captured the right data sources, identified missing or conflicting items, avoided assumptions, and created a handoff that another team member can use. AI support: AI coach can ask: What source proves this? Which field is missing? What is the risk if this is wrong? Who owns the next action? Learner must answer using the case data, not guesses.',
  1,
  '8 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Ed - Science Education
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-036' LIMIT 1),
  'B.Ed - Science Education',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Science Education
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-036' LIMIT 1),
  'B.Sc Science Education',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech - STEM Education Support
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-036' LIMIT 1),
  'B.Tech - STEM Education Support',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Voc Maker-Lab Facilitation
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-036' LIMIT 1),
  'B.Voc Maker-Lab Facilitation',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PG Diploma Experiential Learning
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-036' LIMIT 1),
  'PG Diploma Experiential Learning',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Vocational Batch Alignment Intake & Readiness Checklist
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Vocational Batch Alignment Intake & Readiness Checklist',
  'COURSE-L1-041',
  'Learner can identify inputs, check completeness, and create a safe handoff draft for align vocational batches to qualification packs, trainer readiness, and assessment requirements and submit a workplace-ready L1 Vocational Batch Alignment Intake Checklist. Workplace scenario: A skill training centre is preparing a vocational batch alignment file for 92 learners in a job-role batch. The issue is that qualification-pack outcomes, trainer availability, tools, practice hours, and assessment windows do not match. The learner must check and organise the given records, mark what is complete or missing, and create a handoff-ready vocational batch alignment checklist before work moves to the next person. Learner artifact: L1 Vocational Batch Alignment Intake Checklist. Required data: qualification pack, trainer roster, equipment list, batch profile, practice-hour plan, assessment schedule. Evidence: Assess whether the learner captured the right data sources, identified missing or conflicting items, avoided assumptions, and created a handoff that another team member can use.',
  '8 hours',
  'Active',
  'Skilling, Employability & Work-Integrated Learning',
  'technical',
  '["Triggered when a guided intake and readiness task needs a real workplace artifact, not a theory answer.","Demonstrates guided intake and readiness by producing and defending the L1 Vocational Batch Alignment Intake Checklist.","Learner can identify inputs, check completeness, and create a safe handoff draft for align vocational batches to qualification packs, trainer readiness, and assessment requirements and submit a workplace-ready L1 Vocational Batch Alignment Intake Checklist."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: Module 1: Vocational Batch Alignment Intake & Readiness Checklist Workplace Artifact Build
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-041' LIMIT 1),
  'Module 1: Vocational Batch Alignment Intake & Readiness Checklist Workplace Artifact Build',
  'Triggered when a guided intake and readiness task needs a real workplace artifact, not a theory answer. The learner studies the case, reviews the required data, identifies the gap, creates the artifact, and checks it against evidence fields.',
  1,
  '["Education & Skilling","Skilling, Employability & Work-Integrated Learning","IND-CAP-09","L1","Qualification-pack interpretation","Batch-to-outcome mapping","Trainer readiness","Equipment and practice-hour planning","Assessment requirement check"]'::jsonb,
  '["Engage","Explore","Explain","Express","Empower","Evolve","Artifact Build","Evidence Review","AI-Coached Retry"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Case: Vocational Batch Alignment Intake & Readiness Checklist
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-041' LIMIT 1)
   AND title = 'Module 1: Vocational Batch Alignment Intake & Readiness Checklist Workplace Artifact Build' LIMIT 1),
  'Workplace Case: Vocational Batch Alignment Intake & Readiness Checklist',
  'A skill training centre is preparing a vocational batch alignment file for 92 learners in a job-role batch. The issue is that qualification-pack outcomes, trainer availability, tools, practice hours, and assessment windows do not match. The learner must check and organise the given records, mark what is complete or missing, and create a handoff-ready vocational batch alignment checklist before work moves to the next person. The learner must solve the problem using the given data and produce the required workplace artifact.',
  'Workplace problem: A skill training centre is preparing a vocational batch alignment file for 92 learners in a job-role batch. The issue is that qualification-pack outcomes, trainer availability, tools, practice hours, and assessment windows do not match. The learner must check and organise the given records, mark what is complete or missing, and create a handoff-ready vocational batch alignment checklist before work moves to the next person. Pressure points: Deadline pressure: first handoff is due before the next operating step. Data pressure: qualification pack, trainer roster, equipment list, batch profile, practice-hour plan, assessment schedule. Risk: if one input is accepted without checking, the next team may act on wrong or incomplete information. Root cause focus: Check whether the failure comes from missing source data, unclear ownership, outdated records, misunderstood rule, or incomplete handoff format. Major concepts: Qualification-pack interpretation; Batch-to-outcome mapping; Trainer readiness; Equipment and practice-hour planning; Assessment requirement check; Compliance handoff; Source-of-truth check; Completeness vs correctness; Safe handoff. Level focus: intake and readiness. Required data: qualification pack, trainer roster, equipment list, batch profile, practice-hour plan, assessment schedule Learner activity flow: Engage - Start with the case: 92 learners in a job-role batch and the visible pain point — qualification-pack outcomes, trainer availability, tools, practice hours, and assessment windows do not match. Learner identifies who is affected and what could go wrong if the work is delayed or wrong. Explore - Learner studies the source data: qualification pack, trainer roster, equipment list, batch profile, practice-hour plan, assessment schedule. They mark trusted records, missing fields, conflicting entries, and items that need confirmation before using them in the artifact. Explain - Teach the main logic in simple terms: Qualification-pack interpretation; Batch-to-outcome mapping; Trainer readiness; Equipment and practice-hour planning; Assessment requirement check; Compliance handoff; Source-of-truth check; Completeness vs correctness; Safe handoff. Level focus: intake and readiness. Show how rules, evidence, decisions, and handoff notes connect in this workplace task. Express - Learner produces the L1 Vocational Batch Alignment Intake Checklist using the case data, writes decisions in plain English, and shows evidence for each important field instead of giving only a theory answer. Empower - Learner uses AI only as a coach: ask for missing-field checks, clarity prompts, risk questions, and retry suggestions. AI should not create the final artifact for the learner. Evolve - Learner notes what would become harder at L2: more records, more conflicts, less guidance, stronger evidence expectations, and higher decision responsibility. Artifact to submit: L1 Vocational Batch Alignment Intake Checklist. L1 Vocational Batch Alignment Intake Checklist should contain: case details; source data checklist; missing-item log; first-pass validation marks; risk notes; handoff owner and date. Required source data: qualification pack, trainer roster, equipment list, batch profile, practice-hour plan, assessment schedule. Evidence fields: Assess whether the learner captured the right data sources, identified missing or conflicting items, avoided assumptions, and created a handoff that another team member can use. AI support: AI coach can ask: What source proves this? Which field is missing? What is the risk if this is wrong? Who owns the next action? Learner must answer using the case data, not guesses.',
  1,
  '8 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Voc - Vocational Education
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-041' LIMIT 1),
  'B.Voc - Vocational Education',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: Diploma in Vocational Training
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-041' LIMIT 1),
  'Diploma in Vocational Training',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BBA Skill Development
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-041' LIMIT 1),
  'BBA Skill Development',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PG Diploma Skill Development
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-041' LIMIT 1),
  'PG Diploma Skill Development',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MBA HR and Training
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-041' LIMIT 1),
  'MBA HR and Training',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Skilling Delivery & Placement Readiness Intake & Readiness Checklist
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Skilling Delivery & Placement Readiness Intake & Readiness Checklist',
  'COURSE-L1-046',
  'Learner can identify inputs, check completeness, and create a safe handoff draft for monitor skilling delivery and placement readiness through attendance, practice, and employability evidence and submit a workplace-ready L1 Skilling Delivery & Placement Readiness Intake Checklist. Workplace scenario: A employability cell is preparing a placement readiness tracker for 115 learners before employer interviews. The issue is that resume status, mock interview scores, attendance, skill gaps, and employer criteria are scattered. The learner must check and organise the given records, mark what is complete or missing, and create a handoff-ready placement readiness checklist before work moves to the next person. Learner artifact: L1 Skilling Delivery & Placement Readiness Intake Checklist. Required data: learner profile, resume tracker, mock interview scores, attendance, employer criteria, skill-gap notes. Evidence: Assess whether the learner captured the right data sources, identified missing or conflicting items, avoided assumptions, and created a handoff that another team member can use.',
  '8 hours',
  'Active',
  'Skilling, Employability & Work-Integrated Learning',
  'technical',
  '["Triggered when a guided intake and readiness task needs a real workplace artifact, not a theory answer.","Demonstrates guided intake and readiness by producing and defending the L1 Skilling Delivery & Placement Readiness Intake Checklist.","Learner can identify inputs, check completeness, and create a safe handoff draft for monitor skilling delivery and placement readiness through attendance, practice, and employability evidence and submit a workplace-ready L1 Skilling Delivery & Placement Readiness Intake Checklist."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: Module 1: Skilling Delivery & Placement Readiness Intake & Readiness Checklist Workplace Artifact Build
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-046' LIMIT 1),
  'Module 1: Skilling Delivery & Placement Readiness Intake & Readiness Checklist Workplace Artifact Build',
  'Triggered when a guided intake and readiness task needs a real workplace artifact, not a theory answer. The learner studies the case, reviews the required data, identifies the gap, creates the artifact, and checks it against evidence fields.',
  1,
  '["Education & Skilling","Skilling, Employability & Work-Integrated Learning","IND-CAP-10","L1","Employability readiness indicators","Employer criteria matching","Resume and interview evidence","Readiness scoring","Shortlist logic"]'::jsonb,
  '["Engage","Explore","Explain","Express","Empower","Evolve","Artifact Build","Evidence Review","AI-Coached Retry"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Case: Skilling Delivery & Placement Readiness Intake & Readiness Checklist
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-046' LIMIT 1)
   AND title = 'Module 1: Skilling Delivery & Placement Readiness Intake & Readiness Checklist Workplace Artifact Build' LIMIT 1),
  'Workplace Case: Skilling Delivery & Placement Readiness Intake & Readiness Checklist',
  'A employability cell is preparing a placement readiness tracker for 115 learners before employer interviews. The issue is that resume status, mock interview scores, attendance, skill gaps, and employer criteria are scattered. The learner must check and organise the given records, mark what is complete or missing, and create a handoff-ready placement readiness checklist before work moves to the next person. The learner must solve the problem using the given data and produce the required workplace artifact.',
  'Workplace problem: A employability cell is preparing a placement readiness tracker for 115 learners before employer interviews. The issue is that resume status, mock interview scores, attendance, skill gaps, and employer criteria are scattered. The learner must check and organise the given records, mark what is complete or missing, and create a handoff-ready placement readiness checklist before work moves to the next person. Pressure points: Deadline pressure: first handoff is due before the next operating step. Data pressure: learner profile, resume tracker, mock interview scores, attendance, employer criteria, skill-gap notes. Risk: if one input is accepted without checking, the next team may act on wrong or incomplete information. Root cause focus: Check whether the failure comes from missing source data, unclear ownership, outdated records, misunderstood rule, or incomplete handoff format. Major concepts: Employability readiness indicators; Employer criteria matching; Resume and interview evidence; Readiness scoring; Shortlist logic; Placement handoff; Source-of-truth check; Completeness vs correctness; Safe handoff. Level focus: intake and readiness. Required data: learner profile, resume tracker, mock interview scores, attendance, employer criteria, skill-gap notes Learner activity flow: Engage - Start with the case: 115 learners before employer interviews and the visible pain point — resume status, mock interview scores, attendance, skill gaps, and employer criteria are scattered. Learner identifies who is affected and what could go wrong if the work is delayed or wrong. Explore - Learner studies the source data: learner profile, resume tracker, mock interview scores, attendance, employer criteria, skill-gap notes. They mark trusted records, missing fields, conflicting entries, and items that need confirmation before using them in the artifact. Explain - Teach the main logic in simple terms: Employability readiness indicators; Employer criteria matching; Resume and interview evidence; Readiness scoring; Shortlist logic; Placement handoff; Source-of-truth check; Completeness vs correctness; Safe handoff. Level focus: intake and readiness. Show how rules, evidence, decisions, and handoff notes connect in this workplace task. Express - Learner produces the L1 Skilling Delivery & Placement Readiness Intake Checklist using the case data, writes decisions in plain English, and shows evidence for each important field instead of giving only a theory answer. Empower - Learner uses AI only as a coach: ask for missing-field checks, clarity prompts, risk questions, and retry suggestions. AI should not create the final artifact for the learner. Evolve - Learner notes what would become harder at L2: more records, more conflicts, less guidance, stronger evidence expectations, and higher decision responsibility. Artifact to submit: L1 Skilling Delivery & Placement Readiness Intake Checklist. L1 Skilling Delivery & Placement Readiness Intake Checklist should contain: case details; source data checklist; missing-item log; first-pass validation marks; risk notes; handoff owner and date. Required source data: learner profile, resume tracker, mock interview scores, attendance, employer criteria, skill-gap notes. Evidence fields: Assess whether the learner captured the right data sources, identified missing or conflicting items, avoided assumptions, and created a handoff that another team member can use. AI support: AI coach can ask: What source proves this? Which field is missing? What is the risk if this is wrong? Who owns the next action? Learner must answer using the case data, not guesses.',
  1,
  '8 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Voc - Skill Development
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-046' LIMIT 1),
  'B.Voc - Skill Development',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BBA Training and Placement
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-046' LIMIT 1),
  'BBA Training and Placement',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MBA HR
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-046' LIMIT 1),
  'MBA HR',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PG Diploma Employability Training
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-046' LIMIT 1),
  'PG Diploma Employability Training',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MSW - Livelihood Programs
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-046' LIMIT 1),
  'MSW - Livelihood Programs',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Internship & Apprenticeship Matching Intake & Readiness Checklist
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Internship & Apprenticeship Matching Intake & Readiness Checklist',
  'COURSE-L1-051',
  'Learner can identify inputs, check completeness, and create a safe handoff draft for match learners to internship and apprenticeship opportunities using eligibility, employer, and learning-plan evidence and submit a workplace-ready L1 Internship & Apprenticeship Matching Intake Checklist. Workplace scenario: A internship office is preparing a internship matching shortlist for 86 eligible learners and 27 employer slots. The issue is that locations, stipend rules, joining dates, skill requirements, and eligibility conditions conflict. The learner must check and organise the given records, mark what is complete or missing, and create a handoff-ready internship matching checklist before work moves to the next person. Learner artifact: L1 Internship & Apprenticeship Matching Intake Checklist. Required data: learner preference form, employer slot list, eligibility rules, location constraints, stipend details, joining deadlines. Evidence: Assess whether the learner captured the right data sources, identified missing or conflicting items, avoided assumptions, and created a handoff that another team member can use.',
  '8 hours',
  'Active',
  'Skilling, Employability & Work-Integrated Learning',
  'technical',
  '["Triggered when a guided intake and readiness task needs a real workplace artifact, not a theory answer.","Demonstrates guided intake and readiness by producing and defending the L1 Internship & Apprenticeship Matching Intake Checklist.","Learner can identify inputs, check completeness, and create a safe handoff draft for match learners to internship and apprenticeship opportunities using eligibility, employer, and learning-plan evidence and submit a workplace-ready L1 Internship & Apprenticeship Matching Intake Checklist."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: Module 1: Internship & Apprenticeship Matching Intake & Readiness Checklist Workplace Artifact Build
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-051' LIMIT 1),
  'Module 1: Internship & Apprenticeship Matching Intake & Readiness Checklist Workplace Artifact Build',
  'Triggered when a guided intake and readiness task needs a real workplace artifact, not a theory answer. The learner studies the case, reviews the required data, identifies the gap, creates the artifact, and checks it against evidence fields.',
  1,
  '["Education & Skilling","Skilling, Employability & Work-Integrated Learning","IND-CAP-11","L1","Eligibility matching","Employer requirement mapping","Learner preference handling","Constraint-based shortlisting","Justification note"]'::jsonb,
  '["Engage","Explore","Explain","Express","Empower","Evolve","Artifact Build","Evidence Review","AI-Coached Retry"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Case: Internship & Apprenticeship Matching Intake & Readiness Checklist
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-051' LIMIT 1)
   AND title = 'Module 1: Internship & Apprenticeship Matching Intake & Readiness Checklist Workplace Artifact Build' LIMIT 1),
  'Workplace Case: Internship & Apprenticeship Matching Intake & Readiness Checklist',
  'A internship office is preparing a internship matching shortlist for 86 eligible learners and 27 employer slots. The issue is that locations, stipend rules, joining dates, skill requirements, and eligibility conditions conflict. The learner must check and organise the given records, mark what is complete or missing, and create a handoff-ready internship matching checklist before work moves to the next person. The learner must solve the problem using the given data and produce the required workplace artifact.',
  'Workplace problem: A internship office is preparing a internship matching shortlist for 86 eligible learners and 27 employer slots. The issue is that locations, stipend rules, joining dates, skill requirements, and eligibility conditions conflict. The learner must check and organise the given records, mark what is complete or missing, and create a handoff-ready internship matching checklist before work moves to the next person. Pressure points: Deadline pressure: first handoff is due before the next operating step. Data pressure: learner preference form, employer slot list, eligibility rules, location constraints, stipend details, joining deadlines. Risk: if one input is accepted without checking, the next team may act on wrong or incomplete information. Root cause focus: Check whether the failure comes from missing source data, unclear ownership, outdated records, misunderstood rule, or incomplete handoff format. Major concepts: Eligibility matching; Employer requirement mapping; Learner preference handling; Constraint-based shortlisting; Justification note; Joining risk tracking; Source-of-truth check; Completeness vs correctness; Safe handoff. Level focus: intake and readiness. Required data: learner preference form, employer slot list, eligibility rules, location constraints, stipend details, joining deadlines Learner activity flow: Engage - Start with the case: 86 eligible learners and 27 employer slots and the visible pain point — locations, stipend rules, joining dates, skill requirements, and eligibility conditions conflict. Learner identifies who is affected and what could go wrong if the work is delayed or wrong. Explore - Learner studies the source data: learner preference form, employer slot list, eligibility rules, location constraints, stipend details, joining deadlines. They mark trusted records, missing fields, conflicting entries, and items that need confirmation before using them in the artifact. Explain - Teach the main logic in simple terms: Eligibility matching; Employer requirement mapping; Learner preference handling; Constraint-based shortlisting; Justification note; Joining risk tracking; Source-of-truth check; Completeness vs correctness; Safe handoff. Level focus: intake and readiness. Show how rules, evidence, decisions, and handoff notes connect in this workplace task. Express - Learner produces the L1 Internship & Apprenticeship Matching Intake Checklist using the case data, writes decisions in plain English, and shows evidence for each important field instead of giving only a theory answer. Empower - Learner uses AI only as a coach: ask for missing-field checks, clarity prompts, risk questions, and retry suggestions. AI should not create the final artifact for the learner. Evolve - Learner notes what would become harder at L2: more records, more conflicts, less guidance, stronger evidence expectations, and higher decision responsibility. Artifact to submit: L1 Internship & Apprenticeship Matching Intake Checklist. L1 Internship & Apprenticeship Matching Intake Checklist should contain: case details; source data checklist; missing-item log; first-pass validation marks; risk notes; handoff owner and date. Required source data: learner preference form, employer slot list, eligibility rules, location constraints, stipend details, joining deadlines. Evidence fields: Assess whether the learner captured the right data sources, identified missing or conflicting items, avoided assumptions, and created a handoff that another team member can use. AI support: AI coach can ask: What source proves this? Which field is missing? What is the risk if this is wrong? Who owns the next action? Learner must answer using the case data, not guesses.',
  1,
  '8 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Voc - Work Integrated Learning
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-051' LIMIT 1),
  'B.Voc - Work Integrated Learning',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BBA HR
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-051' LIMIT 1),
  'BBA HR',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MBA HR
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-051' LIMIT 1),
  'MBA HR',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PG Diploma Apprenticeship Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-051' LIMIT 1),
  'PG Diploma Apprenticeship Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PG Diploma Internship Coordination
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-051' LIMIT 1),
  'PG Diploma Internship Coordination',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Corporate L&D Needs Transfer Intake & Readiness Checklist
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Corporate L&D Needs Transfer Intake & Readiness Checklist',
  'COURSE-L1-056',
  'Learner can identify inputs, check completeness, and create a safe handoff draft for diagnose corporate learning needs and track transfer evidence against business performance objectives and submit a workplace-ready L1 Corporate L&D Needs Transfer Intake Checklist. Workplace scenario: A corporate learning team is preparing a L&D needs transfer note for 4 departments and 210 employees. The issue is that manager requests, performance gaps, business priorities, and training expectations are mixed together. The learner must check and organise the given records, mark what is complete or missing, and create a handoff-ready corporate l&d needs transfer checklist before work moves to the next person. Learner artifact: L1 Corporate L&D Needs Transfer Intake Checklist. Required data: manager request forms, performance data, business priority notes, learner profile, budget constraints, timeline. Evidence: Assess whether the learner captured the right data sources, identified missing or conflicting items, avoided assumptions, and created a handoff that another team member can use.',
  '8 hours',
  'Active',
  'Skilling, Employability & Work-Integrated Learning',
  'soft',
  '["Triggered when a guided intake and readiness task needs a real workplace artifact, not a theory answer.","Demonstrates guided intake and readiness by producing and defending the L1 Corporate L&D Needs Transfer Intake Checklist.","Learner can identify inputs, check completeness, and create a safe handoff draft for diagnose corporate learning needs and track transfer evidence against business performance objectives and submit a workplace-ready L1 Corporate L&D Needs Transfer Intake Checklist."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: Module 1: Corporate L&D Needs Transfer Intake & Readiness Checklist Workplace Artifact Build
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-056' LIMIT 1),
  'Module 1: Corporate L&D Needs Transfer Intake & Readiness Checklist Workplace Artifact Build',
  'Triggered when a guided intake and readiness task needs a real workplace artifact, not a theory answer. The learner studies the case, reviews the required data, identifies the gap, creates the artifact, and checks it against evidence fields.',
  1,
  '["Education & Skilling","Skilling, Employability & Work-Integrated Learning","IND-CAP-12","L1","Needs analysis","Business-to-learning translation","Stakeholder requirement capture","Performance gap framing","Training priority matrix"]'::jsonb,
  '["Engage","Explore","Explain","Express","Empower","Evolve","Artifact Build","Evidence Review","AI-Coached Retry"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Case: Corporate L&D Needs Transfer Intake & Readiness Checklist
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-056' LIMIT 1)
   AND title = 'Module 1: Corporate L&D Needs Transfer Intake & Readiness Checklist Workplace Artifact Build' LIMIT 1),
  'Workplace Case: Corporate L&D Needs Transfer Intake & Readiness Checklist',
  'A corporate learning team is preparing a L&D needs transfer note for 4 departments and 210 employees. The issue is that manager requests, performance gaps, business priorities, and training expectations are mixed together. The learner must check and organise the given records, mark what is complete or missing, and create a handoff-ready corporate l&d needs transfer checklist before work moves to the next person. The learner must solve the problem using the given data and produce the required workplace artifact.',
  'Workplace problem: A corporate learning team is preparing a L&D needs transfer note for 4 departments and 210 employees. The issue is that manager requests, performance gaps, business priorities, and training expectations are mixed together. The learner must check and organise the given records, mark what is complete or missing, and create a handoff-ready corporate l&d needs transfer checklist before work moves to the next person. Pressure points: Deadline pressure: first handoff is due before the next operating step. Data pressure: manager request forms, performance data, business priority notes, learner profile, budget constraints, timeline. Risk: if one input is accepted without checking, the next team may act on wrong or incomplete information. Root cause focus: Check whether the failure comes from missing source data, unclear ownership, outdated records, misunderstood rule, or incomplete handoff format. Major concepts: Needs analysis; Business-to-learning translation; Stakeholder requirement capture; Performance gap framing; Training priority matrix; L&D handoff; Source-of-truth check; Completeness vs correctness; Safe handoff. Level focus: intake and readiness. Required data: manager request forms, performance data, business priority notes, learner profile, budget constraints, timeline Learner activity flow: Engage - Start with the case: 4 departments and 210 employees and the visible pain point — manager requests, performance gaps, business priorities, and training expectations are mixed together. Learner identifies who is affected and what could go wrong if the work is delayed or wrong. Explore - Learner studies the source data: manager request forms, performance data, business priority notes, learner profile, budget constraints, timeline. They mark trusted records, missing fields, conflicting entries, and items that need confirmation before using them in the artifact. Explain - Teach the main logic in simple terms: Needs analysis; Business-to-learning translation; Stakeholder requirement capture; Performance gap framing; Training priority matrix; L&D handoff; Source-of-truth check; Completeness vs correctness; Safe handoff. Level focus: intake and readiness. Show how rules, evidence, decisions, and handoff notes connect in this workplace task. Express - Learner produces the L1 Corporate L&D Needs Transfer Intake Checklist using the case data, writes decisions in plain English, and shows evidence for each important field instead of giving only a theory answer. Empower - Learner uses AI only as a coach: ask for missing-field checks, clarity prompts, risk questions, and retry suggestions. AI should not create the final artifact for the learner. Evolve - Learner notes what would become harder at L2: more records, more conflicts, less guidance, stronger evidence expectations, and higher decision responsibility. Artifact to submit: L1 Corporate L&D Needs Transfer Intake Checklist. L1 Corporate L&D Needs Transfer Intake Checklist should contain: case details; source data checklist; missing-item log; first-pass validation marks; risk notes; handoff owner and date. Required source data: manager request forms, performance data, business priority notes, learner profile, budget constraints, timeline. Evidence fields: Assess whether the learner captured the right data sources, identified missing or conflicting items, avoided assumptions, and created a handoff that another team member can use. AI support: AI coach can ask: What source proves this? Which field is missing? What is the risk if this is wrong? Who owns the next action? Learner must answer using the case data, not guesses.',
  1,
  '8 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BBA HR
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-056' LIMIT 1),
  'BBA HR',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MBA HR and L&D
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-056' LIMIT 1),
  'MBA HR and L&D',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PG Diploma Learning and Development
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-056' LIMIT 1),
  'PG Diploma Learning and Development',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MA Human Resource Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-056' LIMIT 1),
  'MA Human Resource Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Voc Corporate Training
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-056' LIMIT 1),
  'B.Voc Corporate Training',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: LMS Course Shell Launch Intake & Readiness Checklist
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'LMS Course Shell Launch Intake & Readiness Checklist',
  'COURSE-L1-061',
  'Learner can identify inputs, check completeness, and create a safe handoff draft for configure lms course shells, enrollment rules, permissions, and completion controls for launch readiness and submit a workplace-ready L1 LMS Course Shell Launch Intake Checklist. Workplace scenario: A digital skilling platform is preparing an LMS course shell launch checklist for 3 batches and 240 learners. The issue is that module sequence, completion rules, facilitator permissions, and certificate trigger are incomplete. The learner must check and organise the given records, mark what is complete or missing, and create a handoff-ready lms course shell launch checklist before work moves to the next person. Learner artifact: L1 LMS Course Shell Launch Intake Checklist. Required data: course outline, LMS shell settings, user roles, completion rules, certificate settings, batch enrollment list. Evidence: Assess whether the learner captured the right data sources, identified missing or conflicting items, avoided assumptions, and created a handoff that another team member can use.',
  '8 hours',
  'Active',
  'Digital Learning Platforms & Distributed Learning Operations',
  'technical',
  '["Triggered when a guided intake and readiness task needs a real workplace artifact, not a theory answer.","Demonstrates guided intake and readiness by producing and defending the L1 LMS Course Shell Launch Intake Checklist.","Learner can identify inputs, check completeness, and create a safe handoff draft for configure lms course shells, enrollment rules, permissions, and completion controls for launch readiness and submit a workplace-ready L1 LMS Course Shell Launch Intake Checklist."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: Module 1: LMS Course Shell Launch Intake & Readiness Checklist Workplace Artifact Build
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-061' LIMIT 1),
  'Module 1: LMS Course Shell Launch Intake & Readiness Checklist Workplace Artifact Build',
  'Triggered when a guided intake and readiness task needs a real workplace artifact, not a theory answer. The learner studies the case, reviews the required data, identifies the gap, creates the artifact, and checks it against evidence fields.',
  1,
  '["Education & Skilling","Digital Learning Platforms & Distributed Learning Operations","IND-CAP-13","L1","LMS course architecture","Enrollment and role permissions","Completion rule setup","Certificate trigger logic","Launch readiness testing"]'::jsonb,
  '["Engage","Explore","Explain","Express","Empower","Evolve","Artifact Build","Evidence Review","AI-Coached Retry"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Case: LMS Course Shell Launch Intake & Readiness Checklist
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-061' LIMIT 1)
   AND title = 'Module 1: LMS Course Shell Launch Intake & Readiness Checklist Workplace Artifact Build' LIMIT 1),
  'Workplace Case: LMS Course Shell Launch Intake & Readiness Checklist',
  'A digital skilling platform is preparing an LMS course shell launch checklist for 3 batches and 240 learners. The issue is that module sequence, completion rules, facilitator permissions, and certificate trigger are incomplete. The learner must check and organise the given records, mark what is complete or missing, and create a handoff-ready lms course shell launch checklist before work moves to the next person. The learner must solve the problem using the given data and produce the required workplace artifact.',
  'Workplace problem: A digital skilling platform is preparing an LMS course shell launch checklist for 3 batches and 240 learners. The issue is that module sequence, completion rules, facilitator permissions, and certificate trigger are incomplete. The learner must check and organise the given records, mark what is complete or missing, and create a handoff-ready lms course shell launch checklist before work moves to the next person. Pressure points: Deadline pressure: first handoff is due before the next operating step. Data pressure: course outline, LMS shell settings, user roles, completion rules, certificate settings, batch enrollment list. Risk: if one input is accepted without checking, the next team may act on wrong or incomplete information. Root cause focus: Check whether the failure comes from missing source data, unclear ownership, outdated records, misunderstood rule, or incomplete handoff format. Major concepts: LMS course architecture; Enrollment and role permissions; Completion rule setup; Certificate trigger logic; Launch readiness testing; Learner access validation; Source-of-truth check; Completeness vs correctness; Safe handoff. Level focus: intake and readiness. Required data: course outline, LMS shell settings, user roles, completion rules, certificate settings, batch enrollment list Learner activity flow: Engage - Start with the case: 3 batches and 240 learners and the visible pain point — module sequence, completion rules, facilitator permissions, and certificate trigger are incomplete. Learner identifies who is affected and what could go wrong if the work is delayed or wrong. Explore - Learner studies the source data: course outline, LMS shell settings, user roles, completion rules, certificate settings, batch enrollment list. They mark trusted records, missing fields, conflicting entries, and items that need confirmation before using them in the artifact. Explain - Teach the main logic in simple terms: LMS course architecture; Enrollment and role permissions; Completion rule setup; Certificate trigger logic; Launch readiness testing; Learner access validation; Source-of-truth check; Completeness vs correctness; Safe handoff. Level focus: intake and readiness. Show how rules, evidence, decisions, and handoff notes connect in this workplace task. Express - Learner produces the L1 LMS Course Shell Launch Intake Checklist using the case data, writes decisions in plain English, and shows evidence for each important field instead of giving only a theory answer. Empower - Learner uses AI only as a coach: ask for missing-field checks, clarity prompts, risk questions, and retry suggestions. AI should not create the final artifact for the learner. Evolve - Learner notes what would become harder at L2: more records, more conflicts, less guidance, stronger evidence expectations, and higher decision responsibility. Artifact to submit: L1 LMS Course Shell Launch Intake Checklist. L1 LMS Course Shell Launch Intake Checklist should contain: case details; source data checklist; missing-item log; first-pass validation marks; risk notes; handoff owner and date. Required source data: course outline, LMS shell settings, user roles, completion rules, certificate settings, batch enrollment list. Evidence fields: Assess whether the learner captured the right data sources, identified missing or conflicting items, avoided assumptions, and created a handoff that another team member can use. AI support: AI coach can ask: What source proves this? Which field is missing? What is the risk if this is wrong? Who owns the next action? Learner must answer using the case data, not guesses.',
  1,
  '8 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BCA
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-061' LIMIT 1),
  'BCA',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc IT
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-061' LIMIT 1),
  'B.Sc IT',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Ed - Educational Technology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-061' LIMIT 1),
  'B.Ed - Educational Technology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Ed - Educational Technology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-061' LIMIT 1),
  'M.Ed - Educational Technology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PG Diploma LMS Administration
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-061' LIMIT 1),
  'PG Diploma LMS Administration',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Digital Learner Engagement Nudge Intake & Readiness Checklist
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Digital Learner Engagement Nudge Intake & Readiness Checklist',
  'COURSE-L1-066',
  'Learner can identify inputs, check completeness, and create a safe handoff draft for monitor digital learner activity and trigger timely nudges from platform engagement evidence and submit a workplace-ready L1 Digital Learner Engagement Nudge Intake Checklist. Workplace scenario: A online learning support desk is preparing a learner engagement nudge plan for 312 active learners in week 2. The issue is that 96 learners have low logins, 48 have missed quizzes, and support messages are not targeted. The learner must check and organise the given records, mark what is complete or missing, and create a handoff-ready digital engagement nudge checklist before work moves to the next person. Learner artifact: L1 Digital Learner Engagement Nudge Intake Checklist. Required data: login analytics, quiz completion, video watch data, support tickets, learner segments, nudge templates. Evidence: Assess whether the learner captured the right data sources, identified missing or conflicting items, avoided assumptions, and created a handoff that another team member can use.',
  '8 hours',
  'Active',
  'Digital Learning Platforms & Distributed Learning Operations',
  'soft',
  '["Triggered when a guided intake and readiness task needs a real workplace artifact, not a theory answer.","Demonstrates guided intake and readiness by producing and defending the L1 Digital Learner Engagement Nudge Intake Checklist.","Learner can identify inputs, check completeness, and create a safe handoff draft for monitor digital learner activity and trigger timely nudges from platform engagement evidence and submit a workplace-ready L1 Digital Learner Engagement Nudge Intake Checklist."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: Module 1: Digital Learner Engagement Nudge Intake & Readiness Checklist Workplace Artifact Build
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-066' LIMIT 1),
  'Module 1: Digital Learner Engagement Nudge Intake & Readiness Checklist Workplace Artifact Build',
  'Triggered when a guided intake and readiness task needs a real workplace artifact, not a theory answer. The learner studies the case, reviews the required data, identifies the gap, creates the artifact, and checks it against evidence fields.',
  1,
  '["Education & Skilling","Digital Learning Platforms & Distributed Learning Operations","IND-CAP-14","L1","Engagement analytics","Learner segmentation","Nudge design","Risk indicator reading","Message timing"]'::jsonb,
  '["Engage","Explore","Explain","Express","Empower","Evolve","Artifact Build","Evidence Review","AI-Coached Retry"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Case: Digital Learner Engagement Nudge Intake & Readiness Checklist
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-066' LIMIT 1)
   AND title = 'Module 1: Digital Learner Engagement Nudge Intake & Readiness Checklist Workplace Artifact Build' LIMIT 1),
  'Workplace Case: Digital Learner Engagement Nudge Intake & Readiness Checklist',
  'A online learning support desk is preparing a learner engagement nudge plan for 312 active learners in week 2. The issue is that 96 learners have low logins, 48 have missed quizzes, and support messages are not targeted. The learner must check and organise the given records, mark what is complete or missing, and create a handoff-ready digital engagement nudge checklist before work moves to the next person. The learner must solve the problem using the given data and produce the required workplace artifact.',
  'Workplace problem: A online learning support desk is preparing a learner engagement nudge plan for 312 active learners in week 2. The issue is that 96 learners have low logins, 48 have missed quizzes, and support messages are not targeted. The learner must check and organise the given records, mark what is complete or missing, and create a handoff-ready digital engagement nudge checklist before work moves to the next person. Pressure points: Deadline pressure: first handoff is due before the next operating step. Data pressure: login analytics, quiz completion, video watch data, support tickets, learner segments, nudge templates. Risk: if one input is accepted without checking, the next team may act on wrong or incomplete information. Root cause focus: Check whether the failure comes from missing source data, unclear ownership, outdated records, misunderstood rule, or incomplete handoff format. Major concepts: Engagement analytics; Learner segmentation; Nudge design; Risk indicator reading; Message timing; Follow-up tracking; Source-of-truth check; Completeness vs correctness; Safe handoff. Level focus: intake and readiness. Required data: login analytics, quiz completion, video watch data, support tickets, learner segments, nudge templates Learner activity flow: Engage - Start with the case: 312 active learners in week 2 and the visible pain point — 96 learners have low logins, 48 have missed quizzes, and support messages are not targeted. Learner identifies who is affected and what could go wrong if the work is delayed or wrong. Explore - Learner studies the source data: login analytics, quiz completion, video watch data, support tickets, learner segments, nudge templates. They mark trusted records, missing fields, conflicting entries, and items that need confirmation before using them in the artifact. Explain - Teach the main logic in simple terms: Engagement analytics; Learner segmentation; Nudge design; Risk indicator reading; Message timing; Follow-up tracking; Source-of-truth check; Completeness vs correctness; Safe handoff. Level focus: intake and readiness. Show how rules, evidence, decisions, and handoff notes connect in this workplace task. Express - Learner produces the L1 Digital Learner Engagement Nudge Intake Checklist using the case data, writes decisions in plain English, and shows evidence for each important field instead of giving only a theory answer. Empower - Learner uses AI only as a coach: ask for missing-field checks, clarity prompts, risk questions, and retry suggestions. AI should not create the final artifact for the learner. Evolve - Learner notes what would become harder at L2: more records, more conflicts, less guidance, stronger evidence expectations, and higher decision responsibility. Artifact to submit: L1 Digital Learner Engagement Nudge Intake Checklist. L1 Digital Learner Engagement Nudge Intake Checklist should contain: case details; source data checklist; missing-item log; first-pass validation marks; risk notes; handoff owner and date. Required source data: login analytics, quiz completion, video watch data, support tickets, learner segments, nudge templates. Evidence fields: Assess whether the learner captured the right data sources, identified missing or conflicting items, avoided assumptions, and created a handoff that another team member can use. AI support: AI coach can ask: What source proves this? Which field is missing? What is the risk if this is wrong? Who owns the next action? Learner must answer using the case data, not guesses.',
  1,
  '8 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BCA
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-066' LIMIT 1),
  'BCA',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc IT
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-066' LIMIT 1),
  'B.Sc IT',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BA Communication
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-066' LIMIT 1),
  'BA Communication',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Ed - Digital Learning
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-066' LIMIT 1),
  'B.Ed - Digital Learning',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PG Diploma Digital Learning Engagement
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-066' LIMIT 1),
  'PG Diploma Digital Learning Engagement',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Remote Cohort Facilitation Control Intake & Readiness Checklist
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Remote Cohort Facilitation Control Intake & Readiness Checklist',
  'COURSE-L1-071',
  'Learner can identify inputs, check completeness, and create a safe handoff draft for control remote cohort facilitation through session access, participation, and digital delivery evidence and submit a workplace-ready L1 Remote Cohort Facilitation Control Intake Checklist. Workplace scenario: A distance learning team is preparing a remote cohort facilitation control sheet for 4 online cohorts across 2 time zones. The issue is that attendance, breakout activities, facilitator notes, and learner questions are not captured consistently. The learner must check and organise the given records, mark what is complete or missing, and create a handoff-ready remote cohort facilitation checklist before work moves to the next person. Learner artifact: L1 Remote Cohort Facilitation Control Intake Checklist. Required data: online session roster, attendance export, chat/Q&A log, breakout task evidence, facilitator notes, issue log. Evidence: Assess whether the learner captured the right data sources, identified missing or conflicting items, avoided assumptions, and created a handoff that another team member can use.',
  '8 hours',
  'Active',
  'Digital Learning Platforms & Distributed Learning Operations',
  'soft',
  '["Triggered when a guided intake and readiness task needs a real workplace artifact, not a theory answer.","Demonstrates guided intake and readiness by producing and defending the L1 Remote Cohort Facilitation Control Intake Checklist.","Learner can identify inputs, check completeness, and create a safe handoff draft for control remote cohort facilitation through session access, participation, and digital delivery evidence and submit a workplace-ready L1 Remote Cohort Facilitation Control Intake Checklist."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: Module 1: Remote Cohort Facilitation Control Intake & Readiness Checklist Workplace Artifact Build
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-071' LIMIT 1),
  'Module 1: Remote Cohort Facilitation Control Intake & Readiness Checklist Workplace Artifact Build',
  'Triggered when a guided intake and readiness task needs a real workplace artifact, not a theory answer. The learner studies the case, reviews the required data, identifies the gap, creates the artifact, and checks it against evidence fields.',
  1,
  '["Education & Skilling","Digital Learning Platforms & Distributed Learning Operations","IND-CAP-15","L1","Remote facilitation control","Attendance and participation capture","Breakout evidence tracking","Live issue handling","Session closure note"]'::jsonb,
  '["Engage","Explore","Explain","Express","Empower","Evolve","Artifact Build","Evidence Review","AI-Coached Retry"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Case: Remote Cohort Facilitation Control Intake & Readiness Checklist
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-071' LIMIT 1)
   AND title = 'Module 1: Remote Cohort Facilitation Control Intake & Readiness Checklist Workplace Artifact Build' LIMIT 1),
  'Workplace Case: Remote Cohort Facilitation Control Intake & Readiness Checklist',
  'A distance learning team is preparing a remote cohort facilitation control sheet for 4 online cohorts across 2 time zones. The issue is that attendance, breakout activities, facilitator notes, and learner questions are not captured consistently. The learner must check and organise the given records, mark what is complete or missing, and create a handoff-ready remote cohort facilitation checklist before work moves to the next person. The learner must solve the problem using the given data and produce the required workplace artifact.',
  'Workplace problem: A distance learning team is preparing a remote cohort facilitation control sheet for 4 online cohorts across 2 time zones. The issue is that attendance, breakout activities, facilitator notes, and learner questions are not captured consistently. The learner must check and organise the given records, mark what is complete or missing, and create a handoff-ready remote cohort facilitation checklist before work moves to the next person. Pressure points: Deadline pressure: first handoff is due before the next operating step. Data pressure: online session roster, attendance export, chat/Q&A log, breakout task evidence, facilitator notes, issue log. Risk: if one input is accepted without checking, the next team may act on wrong or incomplete information. Root cause focus: Check whether the failure comes from missing source data, unclear ownership, outdated records, misunderstood rule, or incomplete handoff format. Major concepts: Remote facilitation control; Attendance and participation capture; Breakout evidence tracking; Live issue handling; Session closure note; Cohort follow-up; Source-of-truth check; Completeness vs correctness; Safe handoff. Level focus: intake and readiness. Required data: online session roster, attendance export, chat/Q&A log, breakout task evidence, facilitator notes, issue log Learner activity flow: Engage - Start with the case: 4 online cohorts across 2 time zones and the visible pain point — attendance, breakout activities, facilitator notes, and learner questions are not captured consistently. Learner identifies who is affected and what could go wrong if the work is delayed or wrong. Explore - Learner studies the source data: online session roster, attendance export, chat/Q&A log, breakout task evidence, facilitator notes, issue log. They mark trusted records, missing fields, conflicting entries, and items that need confirmation before using them in the artifact. Explain - Teach the main logic in simple terms: Remote facilitation control; Attendance and participation capture; Breakout evidence tracking; Live issue handling; Session closure note; Cohort follow-up; Source-of-truth check; Completeness vs correctness; Safe handoff. Level focus: intake and readiness. Show how rules, evidence, decisions, and handoff notes connect in this workplace task. Express - Learner produces the L1 Remote Cohort Facilitation Control Intake Checklist using the case data, writes decisions in plain English, and shows evidence for each important field instead of giving only a theory answer. Empower - Learner uses AI only as a coach: ask for missing-field checks, clarity prompts, risk questions, and retry suggestions. AI should not create the final artifact for the learner. Evolve - Learner notes what would become harder at L2: more records, more conflicts, less guidance, stronger evidence expectations, and higher decision responsibility. Artifact to submit: L1 Remote Cohort Facilitation Control Intake Checklist. L1 Remote Cohort Facilitation Control Intake Checklist should contain: case details; source data checklist; missing-item log; first-pass validation marks; risk notes; handoff owner and date. Required source data: online session roster, attendance export, chat/Q&A log, breakout task evidence, facilitator notes, issue log. Evidence fields: Assess whether the learner captured the right data sources, identified missing or conflicting items, avoided assumptions, and created a handoff that another team member can use. AI support: AI coach can ask: What source proves this? Which field is missing? What is the risk if this is wrong? Who owns the next action? Learner must answer using the case data, not guesses.',
  1,
  '8 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Ed - Online Teaching
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-071' LIMIT 1),
  'B.Ed - Online Teaching',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Ed - Educational Technology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-071' LIMIT 1),
  'M.Ed - Educational Technology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BA Education
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-071' LIMIT 1),
  'BA Education',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PG Diploma Online and Distance Learning
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-071' LIMIT 1),
  'PG Diploma Online and Distance Learning',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PG Diploma Virtual Facilitation
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-071' LIMIT 1),
  'PG Diploma Virtual Facilitation',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Tutoring Support Routing Intake & Readiness Checklist
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Tutoring Support Routing Intake & Readiness Checklist',
  'COURSE-L1-076',
  'Learner can identify inputs, check completeness, and create a safe handoff draft for tutoring support requests using academic need, availability, and intervention-fit evidence and submit a workplace-ready L1 Tutoring Support Routing Intake Checklist. Workplace scenario: An academic support centre is preparing a tutoring support routing sheet for 74 learners requesting support. The issue is that some learners need concept help, some need language support, and some have attendance or confidence issues. The learner must check and organise the given records, mark what is complete or missing, and create a handoff-ready tutoring support routing checklist before work moves to the next person. Learner artifact: L1 Tutoring Support Routing Intake Checklist. Required data: support request form, diagnostic quiz, attendance record, tutor availability, learner notes, priority rules. Evidence: Assess whether the learner captured the right data sources, identified missing or conflicting items, avoided assumptions, and created a handoff that another team member can use.',
  '8 hours',
  'Active',
  'Digital Learning Platforms & Distributed Learning Operations',
  'soft',
  '["Triggered when a guided intake and readiness task needs a real workplace artifact, not a theory answer.","Demonstrates guided intake and readiness by producing and defending the L1 Tutoring Support Routing Intake Checklist.","Learner can identify inputs, check completeness, and create a safe handoff draft for tutoring support requests using academic need, availability, and intervention-fit evidence and submit a workplace-ready L1 Tutoring Support Routing Intake Checklist."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: Module 1: Tutoring Support Routing Intake & Readiness Checklist Workplace Artifact Build
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-076' LIMIT 1),
  'Module 1: Tutoring Support Routing Intake & Readiness Checklist Workplace Artifact Build',
  'Triggered when a guided intake and readiness task needs a real workplace artifact, not a theory answer. The learner studies the case, reviews the required data, identifies the gap, creates the artifact, and checks it against evidence fields.',
  1,
  '["Education & Skilling","Digital Learning Platforms & Distributed Learning Operations","IND-CAP-16","L1","Support need classification","Diagnostic evidence reading","Tutor matching","Priority routing","Support session planning"]'::jsonb,
  '["Engage","Explore","Explain","Express","Empower","Evolve","Artifact Build","Evidence Review","AI-Coached Retry"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Case: Tutoring Support Routing Intake & Readiness Checklist
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-076' LIMIT 1)
   AND title = 'Module 1: Tutoring Support Routing Intake & Readiness Checklist Workplace Artifact Build' LIMIT 1),
  'Workplace Case: Tutoring Support Routing Intake & Readiness Checklist',
  'An academic support centre is preparing a tutoring support routing sheet for 74 learners requesting support. The issue is that some learners need concept help, some need language support, and some have attendance or confidence issues. The learner must check and organise the given records, mark what is complete or missing, and create a handoff-ready tutoring support routing checklist before work moves to the next person. The learner must solve the problem using the given data and produce the required workplace artifact.',
  'Workplace problem: An academic support centre is preparing a tutoring support routing sheet for 74 learners requesting support. The issue is that some learners need concept help, some need language support, and some have attendance or confidence issues. The learner must check and organise the given records, mark what is complete or missing, and create a handoff-ready tutoring support routing checklist before work moves to the next person. Pressure points: Deadline pressure: first handoff is due before the next operating step. Data pressure: support request form, diagnostic quiz, attendance record, tutor availability, learner notes, priority rules. Risk: if one input is accepted without checking, the next team may act on wrong or incomplete information. Root cause focus: Check whether the failure comes from missing source data, unclear ownership, outdated records, misunderstood rule, or incomplete handoff format. Major concepts: Support need classification; Diagnostic evidence reading; Tutor matching; Priority routing; Support session planning; Progress follow-up; Source-of-truth check; Completeness vs correctness; Safe handoff. Level focus: intake and readiness. Required data: support request form, diagnostic quiz, attendance record, tutor availability, learner notes, priority rules Learner activity flow: Engage - Start with the case: 74 learners requesting support and the visible pain point — some learners need concept help, some need language support, and some have attendance or confidence issues. Learner identifies who is affected and what could go wrong if the work is delayed or wrong. Explore - Learner studies the source data: support request form, diagnostic quiz, attendance record, tutor availability, learner notes, priority rules. They mark trusted records, missing fields, conflicting entries, and items that need confirmation before using them in the artifact. Explain - Teach the main logic in simple terms: Support need classification; Diagnostic evidence reading; Tutor matching; Priority routing; Support session planning; Progress follow-up; Source-of-truth check; Completeness vs correctness; Safe handoff. Level focus: intake and readiness. Show how rules, evidence, decisions, and handoff notes connect in this workplace task. Express - Learner produces the L1 Tutoring Support Routing Intake Checklist using the case data, writes decisions in plain English, and shows evidence for each important field instead of giving only a theory answer. Empower - Learner uses AI only as a coach: ask for missing-field checks, clarity prompts, risk questions, and retry suggestions. AI should not create the final artifact for the learner. Evolve - Learner notes what would become harder at L2: more records, more conflicts, less guidance, stronger evidence expectations, and higher decision responsibility. Artifact to submit: L1 Tutoring Support Routing Intake Checklist. L1 Tutoring Support Routing Intake Checklist should contain: case details; source data checklist; missing-item log; first-pass validation marks; risk notes; handoff owner and date. Required source data: support request form, diagnostic quiz, attendance record, tutor availability, learner notes, priority rules. Evidence fields: Assess whether the learner captured the right data sources, identified missing or conflicting items, avoided assumptions, and created a handoff that another team member can use. AI support: AI coach can ask: What source proves this? Which field is missing? What is the risk if this is wrong? Who owns the next action? Learner must answer using the case data, not guesses.',
  1,
  '8 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Ed - Subject Tutoring
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-076' LIMIT 1),
  'B.Ed - Subject Tutoring',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BA Education
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-076' LIMIT 1),
  'BA Education',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Education
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-076' LIMIT 1),
  'B.Sc Education',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PG Diploma Tutoring and Coaching
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-076' LIMIT 1),
  'PG Diploma Tutoring and Coaching',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PG Diploma Inclusive Learning Support
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-076' LIMIT 1),
  'PG Diploma Inclusive Learning Support',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Assessment Blueprinting Intake & Readiness Checklist
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Assessment Blueprinting Intake & Readiness Checklist',
  'COURSE-L1-081',
  'Learner can identify inputs, check completeness, and create a safe handoff draft for build assessment blueprints and items aligned to competency level, evidence standard, and validity requirements and submit a workplace-ready L1 Assessment Blueprinting Intake Checklist. Workplace scenario: An assessment design team is preparing an assessment blueprint map for 60 questions across 5 outcomes. The issue is that items do not match competency levels, evidence requirements, marks, or difficulty balance. The learner must check and organise the given records, mark what is complete or missing, and create a handoff-ready assessment blueprinting checklist before work moves to the next person. Learner artifact: L1 Assessment Blueprinting Intake Checklist. Required data: learning outcomes, item bank, marks table, difficulty tags, competency map, rubric draft. Evidence: Assess whether the learner captured the right data sources, identified missing or conflicting items, avoided assumptions, and created a handoff that another team member can use.',
  '8 hours',
  'Active',
  'Assessment, Certification & Credentialing',
  'technical',
  '["Triggered when a guided intake and readiness task needs a real workplace artifact, not a theory answer.","Demonstrates guided intake and readiness by producing and defending the L1 Assessment Blueprinting Intake Checklist.","Learner can identify inputs, check completeness, and create a safe handoff draft for build assessment blueprints and items aligned to competency level, evidence standard, and validity requirements and submit a workplace-ready L1 Assessment Blueprinting Intake Checklist."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: Module 1: Assessment Blueprinting Intake & Readiness Checklist Workplace Artifact Build
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-081' LIMIT 1),
  'Module 1: Assessment Blueprinting Intake & Readiness Checklist Workplace Artifact Build',
  'Triggered when a guided intake and readiness task needs a real workplace artifact, not a theory answer. The learner studies the case, reviews the required data, identifies the gap, creates the artifact, and checks it against evidence fields.',
  1,
  '["Education & Skilling","Assessment, Certification & Credentialing","IND-CAP-17","L1","Assessment blueprinting","Outcome-item alignment","Difficulty distribution","Marks weighting","Evidence validity"]'::jsonb,
  '["Engage","Explore","Explain","Express","Empower","Evolve","Artifact Build","Evidence Review","AI-Coached Retry"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Case: Assessment Blueprinting Intake & Readiness Checklist
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-081' LIMIT 1)
   AND title = 'Module 1: Assessment Blueprinting Intake & Readiness Checklist Workplace Artifact Build' LIMIT 1),
  'Workplace Case: Assessment Blueprinting Intake & Readiness Checklist',
  'An assessment design team is preparing an assessment blueprint map for 60 questions across 5 outcomes. The issue is that items do not match competency levels, evidence requirements, marks, or difficulty balance. The learner must check and organise the given records, mark what is complete or missing, and create a handoff-ready assessment blueprinting checklist before work moves to the next person. The learner must solve the problem using the given data and produce the required workplace artifact.',
  'Workplace problem: An assessment design team is preparing an assessment blueprint map for 60 questions across 5 outcomes. The issue is that items do not match competency levels, evidence requirements, marks, or difficulty balance. The learner must check and organise the given records, mark what is complete or missing, and create a handoff-ready assessment blueprinting checklist before work moves to the next person. Pressure points: Deadline pressure: first handoff is due before the next operating step. Data pressure: learning outcomes, item bank, marks table, difficulty tags, competency map, rubric draft. Risk: if one input is accepted without checking, the next team may act on wrong or incomplete information. Root cause focus: Check whether the failure comes from missing source data, unclear ownership, outdated records, misunderstood rule, or incomplete handoff format. Major concepts: Assessment blueprinting; Outcome-item alignment; Difficulty distribution; Marks weighting; Evidence validity; Rubric linkage; Source-of-truth check; Completeness vs correctness; Safe handoff. Level focus: intake and readiness. Required data: learning outcomes, item bank, marks table, difficulty tags, competency map, rubric draft Learner activity flow: Engage - Start with the case: 60 questions across 5 outcomes and the visible pain point — items do not match competency levels, evidence requirements, marks, or difficulty balance. Learner identifies who is affected and what could go wrong if the work is delayed or wrong. Explore - Learner studies the source data: learning outcomes, item bank, marks table, difficulty tags, competency map, rubric draft. They mark trusted records, missing fields, conflicting entries, and items that need confirmation before using them in the artifact. Explain - Teach the main logic in simple terms: Assessment blueprinting; Outcome-item alignment; Difficulty distribution; Marks weighting; Evidence validity; Rubric linkage; Source-of-truth check; Completeness vs correctness; Safe handoff. Level focus: intake and readiness. Show how rules, evidence, decisions, and handoff notes connect in this workplace task. Express - Learner produces the L1 Assessment Blueprinting Intake Checklist using the case data, writes decisions in plain English, and shows evidence for each important field instead of giving only a theory answer. Empower - Learner uses AI only as a coach: ask for missing-field checks, clarity prompts, risk questions, and retry suggestions. AI should not create the final artifact for the learner. Evolve - Learner notes what would become harder at L2: more records, more conflicts, less guidance, stronger evidence expectations, and higher decision responsibility. Artifact to submit: L1 Assessment Blueprinting Intake Checklist. L1 Assessment Blueprinting Intake Checklist should contain: case details; source data checklist; missing-item log; first-pass validation marks; risk notes; handoff owner and date. Required source data: learning outcomes, item bank, marks table, difficulty tags, competency map, rubric draft. Evidence fields: Assess whether the learner captured the right data sources, identified missing or conflicting items, avoided assumptions, and created a handoff that another team member can use. AI support: AI coach can ask: What source proves this? Which field is missing? What is the risk if this is wrong? Who owns the next action? Learner must answer using the case data, not guesses.',
  1,
  '8 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Ed - Assessment Design
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-081' LIMIT 1),
  'B.Ed - Assessment Design',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Ed - Assessment and Evaluation
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-081' LIMIT 1),
  'M.Ed - Assessment and Evaluation',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MA Education
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-081' LIMIT 1),
  'MA Education',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PG Diploma Educational Assessment
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-081' LIMIT 1),
  'PG Diploma Educational Assessment',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PG Diploma Instructional Design
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-081' LIMIT 1),
  'PG Diploma Instructional Design',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Rubric Evaluation Review Intake & Readiness Checklist
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Rubric Evaluation Review Intake & Readiness Checklist',
  'COURSE-L1-086',
  'Learner can identify inputs, check completeness, and create a safe handoff draft for apply rubrics and score reviews to produce fair, evidence-based learner evaluation decisions and submit a workplace-ready L1 Rubric Evaluation Review Intake Checklist. Workplace scenario: A evaluation moderation team is preparing a rubric evaluation review sheet for 45 submitted artifacts from 3 sections. The issue is that evaluators are scoring differently, feedback quality varies, and borderline cases are unclear. The learner must check and organise the given records, mark what is complete or missing, and create a handoff-ready rubric evaluation checklist before work moves to the next person. Learner artifact: L1 Rubric Evaluation Review Intake Checklist. Required data: rubric, learner artifacts, evaluator scores, feedback comments, moderation notes, sample answers. Evidence: Assess whether the learner captured the right data sources, identified missing or conflicting items, avoided assumptions, and created a handoff that another team member can use.',
  '8 hours',
  'Active',
  'Assessment, Certification & Credentialing',
  'technical',
  '["Triggered when a guided intake and readiness task needs a real workplace artifact, not a theory answer.","Demonstrates guided intake and readiness by producing and defending the L1 Rubric Evaluation Review Intake Checklist.","Learner can identify inputs, check completeness, and create a safe handoff draft for apply rubrics and score reviews to produce fair, evidence-based learner evaluation decisions and submit a workplace-ready L1 Rubric Evaluation Review Intake Checklist."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: Module 1: Rubric Evaluation Review Intake & Readiness Checklist Workplace Artifact Build
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-086' LIMIT 1),
  'Module 1: Rubric Evaluation Review Intake & Readiness Checklist Workplace Artifact Build',
  'Triggered when a guided intake and readiness task needs a real workplace artifact, not a theory answer. The learner studies the case, reviews the required data, identifies the gap, creates the artifact, and checks it against evidence fields.',
  1,
  '["Education & Skilling","Assessment, Certification & Credentialing","IND-CAP-18","L1","Rubric interpretation","Evidence-based scoring","Inter-rater consistency","Feedback quality","Moderation decision"]'::jsonb,
  '["Engage","Explore","Explain","Express","Empower","Evolve","Artifact Build","Evidence Review","AI-Coached Retry"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Case: Rubric Evaluation Review Intake & Readiness Checklist
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-086' LIMIT 1)
   AND title = 'Module 1: Rubric Evaluation Review Intake & Readiness Checklist Workplace Artifact Build' LIMIT 1),
  'Workplace Case: Rubric Evaluation Review Intake & Readiness Checklist',
  'A evaluation moderation team is preparing a rubric evaluation review sheet for 45 submitted artifacts from 3 sections. The issue is that evaluators are scoring differently, feedback quality varies, and borderline cases are unclear. The learner must check and organise the given records, mark what is complete or missing, and create a handoff-ready rubric evaluation checklist before work moves to the next person. The learner must solve the problem using the given data and produce the required workplace artifact.',
  'Workplace problem: A evaluation moderation team is preparing a rubric evaluation review sheet for 45 submitted artifacts from 3 sections. The issue is that evaluators are scoring differently, feedback quality varies, and borderline cases are unclear. The learner must check and organise the given records, mark what is complete or missing, and create a handoff-ready rubric evaluation checklist before work moves to the next person. Pressure points: Deadline pressure: first handoff is due before the next operating step. Data pressure: rubric, learner artifacts, evaluator scores, feedback comments, moderation notes, sample answers. Risk: if one input is accepted without checking, the next team may act on wrong or incomplete information. Root cause focus: Check whether the failure comes from missing source data, unclear ownership, outdated records, misunderstood rule, or incomplete handoff format. Major concepts: Rubric interpretation; Evidence-based scoring; Inter-rater consistency; Feedback quality; Moderation decision; Borderline case handling; Source-of-truth check; Completeness vs correctness; Safe handoff. Level focus: intake and readiness. Required data: rubric, learner artifacts, evaluator scores, feedback comments, moderation notes, sample answers Learner activity flow: Engage - Start with the case: 45 submitted artifacts from 3 sections and the visible pain point — evaluators are scoring differently, feedback quality varies, and borderline cases are unclear. Learner identifies who is affected and what could go wrong if the work is delayed or wrong. Explore - Learner studies the source data: rubric, learner artifacts, evaluator scores, feedback comments, moderation notes, sample answers. They mark trusted records, missing fields, conflicting entries, and items that need confirmation before using them in the artifact. Explain - Teach the main logic in simple terms: Rubric interpretation; Evidence-based scoring; Inter-rater consistency; Feedback quality; Moderation decision; Borderline case handling; Source-of-truth check; Completeness vs correctness; Safe handoff. Level focus: intake and readiness. Show how rules, evidence, decisions, and handoff notes connect in this workplace task. Express - Learner produces the L1 Rubric Evaluation Review Intake Checklist using the case data, writes decisions in plain English, and shows evidence for each important field instead of giving only a theory answer. Empower - Learner uses AI only as a coach: ask for missing-field checks, clarity prompts, risk questions, and retry suggestions. AI should not create the final artifact for the learner. Evolve - Learner notes what would become harder at L2: more records, more conflicts, less guidance, stronger evidence expectations, and higher decision responsibility. Artifact to submit: L1 Rubric Evaluation Review Intake Checklist. L1 Rubric Evaluation Review Intake Checklist should contain: case details; source data checklist; missing-item log; first-pass validation marks; risk notes; handoff owner and date. Required source data: rubric, learner artifacts, evaluator scores, feedback comments, moderation notes, sample answers. Evidence fields: Assess whether the learner captured the right data sources, identified missing or conflicting items, avoided assumptions, and created a handoff that another team member can use. AI support: AI coach can ask: What source proves this? Which field is missing? What is the risk if this is wrong? Who owns the next action? Learner must answer using the case data, not guesses.',
  1,
  '8 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Ed - Assessment Practice
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-086' LIMIT 1),
  'B.Ed - Assessment Practice',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Ed - Evaluation Studies
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-086' LIMIT 1),
  'M.Ed - Evaluation Studies',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MA Education
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-086' LIMIT 1),
  'MA Education',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PG Diploma Assessment and Rubrics
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-086' LIMIT 1),
  'PG Diploma Assessment and Rubrics',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PG Diploma Coaching Evaluation
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-086' LIMIT 1),
  'PG Diploma Coaching Evaluation',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Credential Issuance Intake & Readiness Checklist
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Credential Issuance Intake & Readiness Checklist',
  'COURSE-L1-091',
  'Learner can identify inputs, check completeness, and create a safe handoff draft for issue credentials through eligibility, assessment completion, and certification record verification and submit a workplace-ready L1 Credential Issuance Intake Checklist. Workplace scenario: A certification office is preparing a credential issuance verification file for 138 learners marked complete. The issue is that identity details, assessment completion, payment status, and approval records do not match for 19 learners. The learner must check and organise the given records, mark what is complete or missing, and create a handoff-ready credential issuance checklist before work moves to the next person. Learner artifact: L1 Credential Issuance Intake Checklist. Required data: completion report, assessment result sheet, learner ID records, payment/status file, approval list, certificate template. Evidence: Assess whether the learner captured the right data sources, identified missing or conflicting items, avoided assumptions, and created a handoff that another team member can use.',
  '8 hours',
  'Active',
  'Assessment, Certification & Credentialing',
  'technical',
  '["Triggered when a guided intake and readiness task needs a real workplace artifact, not a theory answer.","Demonstrates guided intake and readiness by producing and defending the L1 Credential Issuance Intake Checklist.","Learner can identify inputs, check completeness, and create a safe handoff draft for issue credentials through eligibility, assessment completion, and certification record verification and submit a workplace-ready L1 Credential Issuance Intake Checklist."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: Module 1: Credential Issuance Intake & Readiness Checklist Workplace Artifact Build
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-091' LIMIT 1),
  'Module 1: Credential Issuance Intake & Readiness Checklist Workplace Artifact Build',
  'Triggered when a guided intake and readiness task needs a real workplace artifact, not a theory answer. The learner studies the case, reviews the required data, identifies the gap, creates the artifact, and checks it against evidence fields.',
  1,
  '["Education & Skilling","Assessment, Certification & Credentialing","IND-CAP-19","L1","Credential eligibility","Completion verification","Identity data matching","Certificate data control","Approval workflow"]'::jsonb,
  '["Engage","Explore","Explain","Express","Empower","Evolve","Artifact Build","Evidence Review","AI-Coached Retry"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Case: Credential Issuance Intake & Readiness Checklist
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-091' LIMIT 1)
   AND title = 'Module 1: Credential Issuance Intake & Readiness Checklist Workplace Artifact Build' LIMIT 1),
  'Workplace Case: Credential Issuance Intake & Readiness Checklist',
  'A certification office is preparing a credential issuance verification file for 138 learners marked complete. The issue is that identity details, assessment completion, payment status, and approval records do not match for 19 learners. The learner must check and organise the given records, mark what is complete or missing, and create a handoff-ready credential issuance checklist before work moves to the next person. The learner must solve the problem using the given data and produce the required workplace artifact.',
  'Workplace problem: A certification office is preparing a credential issuance verification file for 138 learners marked complete. The issue is that identity details, assessment completion, payment status, and approval records do not match for 19 learners. The learner must check and organise the given records, mark what is complete or missing, and create a handoff-ready credential issuance checklist before work moves to the next person. Pressure points: Deadline pressure: first handoff is due before the next operating step. Data pressure: completion report, assessment result sheet, learner ID records, payment/status file, approval list, certificate template. Risk: if one input is accepted without checking, the next team may act on wrong or incomplete information. Root cause focus: Check whether the failure comes from missing source data, unclear ownership, outdated records, misunderstood rule, or incomplete handoff format. Major concepts: Credential eligibility; Completion verification; Identity data matching; Certificate data control; Approval workflow; Issuance audit trail; Source-of-truth check; Completeness vs correctness; Safe handoff. Level focus: intake and readiness. Required data: completion report, assessment result sheet, learner ID records, payment/status file, approval list, certificate template Learner activity flow: Engage - Start with the case: 138 learners marked complete and the visible pain point — identity details, assessment completion, payment status, and approval records do not match for 19 learners. Learner identifies who is affected and what could go wrong if the work is delayed or wrong. Explore - Learner studies the source data: completion report, assessment result sheet, learner ID records, payment/status file, approval list, certificate template. They mark trusted records, missing fields, conflicting entries, and items that need confirmation before using them in the artifact. Explain - Teach the main logic in simple terms: Credential eligibility; Completion verification; Identity data matching; Certificate data control; Approval workflow; Issuance audit trail; Source-of-truth check; Completeness vs correctness; Safe handoff. Level focus: intake and readiness. Show how rules, evidence, decisions, and handoff notes connect in this workplace task. Express - Learner produces the L1 Credential Issuance Intake Checklist using the case data, writes decisions in plain English, and shows evidence for each important field instead of giving only a theory answer. Empower - Learner uses AI only as a coach: ask for missing-field checks, clarity prompts, risk questions, and retry suggestions. AI should not create the final artifact for the learner. Evolve - Learner notes what would become harder at L2: more records, more conflicts, less guidance, stronger evidence expectations, and higher decision responsibility. Artifact to submit: L1 Credential Issuance Intake Checklist. L1 Credential Issuance Intake Checklist should contain: case details; source data checklist; missing-item log; first-pass validation marks; risk notes; handoff owner and date. Required source data: completion report, assessment result sheet, learner ID records, payment/status file, approval list, certificate template. Evidence fields: Assess whether the learner captured the right data sources, identified missing or conflicting items, avoided assumptions, and created a handoff that another team member can use. AI support: AI coach can ask: What source proves this? Which field is missing? What is the risk if this is wrong? Who owns the next action? Learner must answer using the case data, not guesses.',
  1,
  '8 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BBA Education Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-091' LIMIT 1),
  'BBA Education Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Com - Academic Operations
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-091' LIMIT 1),
  'B.Com - Academic Operations',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BA Public Administration
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-091' LIMIT 1),
  'BA Public Administration',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PG Diploma Certification Operations
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-091' LIMIT 1),
  'PG Diploma Certification Operations',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MBA Education Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-091' LIMIT 1),
  'MBA Education Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Exam Operations Control Intake & Readiness Checklist
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Exam Operations Control Intake & Readiness Checklist',
  'COURSE-L1-096',
  'Learner can identify inputs, check completeness, and create a safe handoff draft for control exam operations through scheduling, candidate readiness, invigilation, and exception handling and submit a workplace-ready L1 Exam Operations Control Intake Checklist. Workplace scenario: A exam cell is preparing a exam operations control file for 420 candidates across 8 rooms. The issue is that seat plan, invigilator duty, question-paper packets, access needs, and incident rules are not fully aligned. The learner must check and organise the given records, mark what is complete or missing, and create a handoff-ready exam operations checklist before work moves to the next person. Learner artifact: L1 Exam Operations Control Intake Checklist. Required data: candidate list, room plan, invigilator roster, question-paper packet list, access accommodation list, incident format. Evidence: Assess whether the learner captured the right data sources, identified missing or conflicting items, avoided assumptions, and created a handoff that another team member can use.',
  '8 hours',
  'Active',
  'Assessment, Certification & Credentialing',
  'technical',
  '["Triggered when a guided intake and readiness task needs a real workplace artifact, not a theory answer.","Demonstrates guided intake and readiness by producing and defending the L1 Exam Operations Control Intake Checklist.","Learner can identify inputs, check completeness, and create a safe handoff draft for control exam operations through scheduling, candidate readiness, invigilation, and exception handling and submit a workplace-ready L1 Exam Operations Control Intake Checklist."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: Module 1: Exam Operations Control Intake & Readiness Checklist Workplace Artifact Build
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-096' LIMIT 1),
  'Module 1: Exam Operations Control Intake & Readiness Checklist Workplace Artifact Build',
  'Triggered when a guided intake and readiness task needs a real workplace artifact, not a theory answer. The learner studies the case, reviews the required data, identifies the gap, creates the artifact, and checks it against evidence fields.',
  1,
  '["Education & Skilling","Assessment, Certification & Credentialing","IND-CAP-20","L1","Exam logistics control","Seating and room allocation","Invigilator duty mapping","Confidential material control","Incident reporting"]'::jsonb,
  '["Engage","Explore","Explain","Express","Empower","Evolve","Artifact Build","Evidence Review","AI-Coached Retry"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Case: Exam Operations Control Intake & Readiness Checklist
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-096' LIMIT 1)
   AND title = 'Module 1: Exam Operations Control Intake & Readiness Checklist Workplace Artifact Build' LIMIT 1),
  'Workplace Case: Exam Operations Control Intake & Readiness Checklist',
  'A exam cell is preparing a exam operations control file for 420 candidates across 8 rooms. The issue is that seat plan, invigilator duty, question-paper packets, access needs, and incident rules are not fully aligned. The learner must check and organise the given records, mark what is complete or missing, and create a handoff-ready exam operations checklist before work moves to the next person. The learner must solve the problem using the given data and produce the required workplace artifact.',
  'Workplace problem: A exam cell is preparing a exam operations control file for 420 candidates across 8 rooms. The issue is that seat plan, invigilator duty, question-paper packets, access needs, and incident rules are not fully aligned. The learner must check and organise the given records, mark what is complete or missing, and create a handoff-ready exam operations checklist before work moves to the next person. Pressure points: Deadline pressure: first handoff is due before the next operating step. Data pressure: candidate list, room plan, invigilator roster, question-paper packet list, access accommodation list, incident format. Risk: if one input is accepted without checking, the next team may act on wrong or incomplete information. Root cause focus: Check whether the failure comes from missing source data, unclear ownership, outdated records, misunderstood rule, or incomplete handoff format. Major concepts: Exam logistics control; Seating and room allocation; Invigilator duty mapping; Confidential material control; Incident reporting; Compliance checklist; Source-of-truth check; Completeness vs correctness; Safe handoff. Level focus: intake and readiness. Required data: candidate list, room plan, invigilator roster, question-paper packet list, access accommodation list, incident format Learner activity flow: Engage - Start with the case: 420 candidates across 8 rooms and the visible pain point — seat plan, invigilator duty, question-paper packets, access needs, and incident rules are not fully aligned. Learner identifies who is affected and what could go wrong if the work is delayed or wrong. Explore - Learner studies the source data: candidate list, room plan, invigilator roster, question-paper packet list, access accommodation list, incident format. They mark trusted records, missing fields, conflicting entries, and items that need confirmation before using them in the artifact. Explain - Teach the main logic in simple terms: Exam logistics control; Seating and room allocation; Invigilator duty mapping; Confidential material control; Incident reporting; Compliance checklist; Source-of-truth check; Completeness vs correctness; Safe handoff. Level focus: intake and readiness. Show how rules, evidence, decisions, and handoff notes connect in this workplace task. Express - Learner produces the L1 Exam Operations Control Intake Checklist using the case data, writes decisions in plain English, and shows evidence for each important field instead of giving only a theory answer. Empower - Learner uses AI only as a coach: ask for missing-field checks, clarity prompts, risk questions, and retry suggestions. AI should not create the final artifact for the learner. Evolve - Learner notes what would become harder at L2: more records, more conflicts, less guidance, stronger evidence expectations, and higher decision responsibility. Artifact to submit: L1 Exam Operations Control Intake Checklist. L1 Exam Operations Control Intake Checklist should contain: case details; source data checklist; missing-item log; first-pass validation marks; risk notes; handoff owner and date. Required source data: candidate list, room plan, invigilator roster, question-paper packet list, access accommodation list, incident format. Evidence fields: Assess whether the learner captured the right data sources, identified missing or conflicting items, avoided assumptions, and created a handoff that another team member can use. AI support: AI coach can ask: What source proves this? Which field is missing? What is the risk if this is wrong? Who owns the next action? Learner must answer using the case data, not guesses.',
  1,
  '8 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Ed - Exam Operations
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-096' LIMIT 1),
  'B.Ed - Exam Operations',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BBA Education Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-096' LIMIT 1),
  'BBA Education Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BA Public Administration
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-096' LIMIT 1),
  'BA Public Administration',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PG Diploma Exam Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-096' LIMIT 1),
  'PG Diploma Exam Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Ed - Assessment Administration
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-096' LIMIT 1),
  'M.Ed - Assessment Administration',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Learner Support Planning Intake & Readiness Checklist
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Learner Support Planning Intake & Readiness Checklist',
  'COURSE-L1-101',
  'Learner can identify inputs, check completeness, and create a safe handoff draft for create learner support plans from accessibility, referral, and progress evidence and submit a workplace-ready L1 Learner Support Planning Intake Checklist. Workplace scenario: A inclusive learning support team is preparing a learner support plan for 58 learners flagged for support. The issue is that support needs, accommodation requests, guardian notes, teacher observations, and resource availability are incomplete. The learner must check and organise the given records, mark what is complete or missing, and create a handoff-ready learner support planning checklist before work moves to the next person. Learner artifact: L1 Learner Support Planning Intake Checklist. Required data: learner profile, accommodation request, teacher observation, support history, resource list, meeting notes. Evidence: Assess whether the learner captured the right data sources, identified missing or conflicting items, avoided assumptions, and created a handoff that another team member can use.',
  '8 hours',
  'Active',
  'Learner Support, Guidance & Coaching Services',
  'soft',
  '["Triggered when a guided intake and readiness task needs a real workplace artifact, not a theory answer.","Demonstrates guided intake and readiness by producing and defending the L1 Learner Support Planning Intake Checklist.","Learner can identify inputs, check completeness, and create a safe handoff draft for create learner support plans from accessibility, referral, and progress evidence and submit a workplace-ready L1 Learner Support Planning Intake Checklist."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: Module 1: Learner Support Planning Intake & Readiness Checklist Workplace Artifact Build
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-101' LIMIT 1),
  'Module 1: Learner Support Planning Intake & Readiness Checklist Workplace Artifact Build',
  'Triggered when a guided intake and readiness task needs a real workplace artifact, not a theory answer. The learner studies the case, reviews the required data, identifies the gap, creates the artifact, and checks it against evidence fields.',
  1,
  '["Education & Skilling","Learner Support, Guidance & Coaching Services","IND-CAP-21","L1","Inclusive support planning","Accommodation mapping","Learner profile interpretation","Stakeholder coordination","Support action plan"]'::jsonb,
  '["Engage","Explore","Explain","Express","Empower","Evolve","Artifact Build","Evidence Review","AI-Coached Retry"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Case: Learner Support Planning Intake & Readiness Checklist
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-101' LIMIT 1)
   AND title = 'Module 1: Learner Support Planning Intake & Readiness Checklist Workplace Artifact Build' LIMIT 1),
  'Workplace Case: Learner Support Planning Intake & Readiness Checklist',
  'A inclusive learning support team is preparing a learner support plan for 58 learners flagged for support. The issue is that support needs, accommodation requests, guardian notes, teacher observations, and resource availability are incomplete. The learner must check and organise the given records, mark what is complete or missing, and create a handoff-ready learner support planning checklist before work moves to the next person. The learner must solve the problem using the given data and produce the required workplace artifact.',
  'Workplace problem: A inclusive learning support team is preparing a learner support plan for 58 learners flagged for support. The issue is that support needs, accommodation requests, guardian notes, teacher observations, and resource availability are incomplete. The learner must check and organise the given records, mark what is complete or missing, and create a handoff-ready learner support planning checklist before work moves to the next person. Pressure points: Deadline pressure: first handoff is due before the next operating step. Data pressure: learner profile, accommodation request, teacher observation, support history, resource list, meeting notes. Risk: if one input is accepted without checking, the next team may act on wrong or incomplete information. Root cause focus: Check whether the failure comes from missing source data, unclear ownership, outdated records, misunderstood rule, or incomplete handoff format. Major concepts: Inclusive support planning; Accommodation mapping; Learner profile interpretation; Stakeholder coordination; Support action plan; Review timeline; Source-of-truth check; Completeness vs correctness; Safe handoff. Level focus: intake and readiness. Required data: learner profile, accommodation request, teacher observation, support history, resource list, meeting notes Learner activity flow: Engage - Start with the case: 58 learners flagged for support and the visible pain point — support needs, accommodation requests, guardian notes, teacher observations, and resource availability are incomplete. Learner identifies who is affected and what could go wrong if the work is delayed or wrong. Explore - Learner studies the source data: learner profile, accommodation request, teacher observation, support history, resource list, meeting notes. They mark trusted records, missing fields, conflicting entries, and items that need confirmation before using them in the artifact. Explain - Teach the main logic in simple terms: Inclusive support planning; Accommodation mapping; Learner profile interpretation; Stakeholder coordination; Support action plan; Review timeline; Source-of-truth check; Completeness vs correctness; Safe handoff. Level focus: intake and readiness. Show how rules, evidence, decisions, and handoff notes connect in this workplace task. Express - Learner produces the L1 Learner Support Planning Intake Checklist using the case data, writes decisions in plain English, and shows evidence for each important field instead of giving only a theory answer. Empower - Learner uses AI only as a coach: ask for missing-field checks, clarity prompts, risk questions, and retry suggestions. AI should not create the final artifact for the learner. Evolve - Learner notes what would become harder at L2: more records, more conflicts, less guidance, stronger evidence expectations, and higher decision responsibility. Artifact to submit: L1 Learner Support Planning Intake Checklist. L1 Learner Support Planning Intake Checklist should contain: case details; source data checklist; missing-item log; first-pass validation marks; risk notes; handoff owner and date. Required source data: learner profile, accommodation request, teacher observation, support history, resource list, meeting notes. Evidence fields: Assess whether the learner captured the right data sources, identified missing or conflicting items, avoided assumptions, and created a handoff that another team member can use. AI support: AI coach can ask: What source proves this? Which field is missing? What is the risk if this is wrong? Who owns the next action? Learner must answer using the case data, not guesses.',
  1,
  '8 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Ed Special Education
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-101' LIMIT 1),
  'B.Ed Special Education',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Ed Special Education
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-101' LIMIT 1),
  'M.Ed Special Education',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BA Psychology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-101' LIMIT 1),
  'BA Psychology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MA Psychology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-101' LIMIT 1),
  'MA Psychology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MSW - Student Support Services
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-101' LIMIT 1),
  'MSW - Student Support Services',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Remedial Intervention Cycle Intake & Readiness Checklist
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Remedial Intervention Cycle Intake & Readiness Checklist',
  'COURSE-L1-106',
  'Learner can identify inputs, check completeness, and create a safe handoff draft for run remedial intervention cycles using learning-gap diagnosis, practice evidence, and progress review and submit a workplace-ready L1 Remedial Intervention Cycle Intake Checklist. Workplace scenario: An academic recovery team is preparing a remedial intervention cycle plan for 73 learners below benchmark after unit test. The issue is that diagnostic causes, remedial groups, practice tasks, teacher availability, and retest dates are not planned. The learner must check and organise the given records, mark what is complete or missing, and create a handoff-ready remedial intervention checklist before work moves to the next person. Learner artifact: L1 Remedial Intervention Cycle Intake Checklist. Required data: unit-test scores, error analysis, attendance record, learner groups, teacher roster, remedial material list, retest plan. Evidence: Assess whether the learner captured the right data sources, identified missing or conflicting items, avoided assumptions, and created a handoff that another team member can use.',
  '8 hours',
  'Active',
  'Learner Support, Guidance & Coaching Services',
  'soft',
  '["Triggered when a guided intake and readiness task needs a real workplace artifact, not a theory answer.","Demonstrates guided intake and readiness by producing and defending the L1 Remedial Intervention Cycle Intake Checklist.","Learner can identify inputs, check completeness, and create a safe handoff draft for run remedial intervention cycles using learning-gap diagnosis, practice evidence, and progress review and submit a workplace-ready L1 Remedial Intervention Cycle Intake Checklist."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: Module 1: Remedial Intervention Cycle Intake & Readiness Checklist Workplace Artifact Build
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-106' LIMIT 1),
  'Module 1: Remedial Intervention Cycle Intake & Readiness Checklist Workplace Artifact Build',
  'Triggered when a guided intake and readiness task needs a real workplace artifact, not a theory answer. The learner studies the case, reviews the required data, identifies the gap, creates the artifact, and checks it against evidence fields.',
  1,
  '["Education & Skilling","Learner Support, Guidance & Coaching Services","IND-CAP-22","L1","Diagnostic error analysis","Remedial grouping","Intervention planning","Practice evidence","Retest scheduling"]'::jsonb,
  '["Engage","Explore","Explain","Express","Empower","Evolve","Artifact Build","Evidence Review","AI-Coached Retry"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Case: Remedial Intervention Cycle Intake & Readiness Checklist
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-106' LIMIT 1)
   AND title = 'Module 1: Remedial Intervention Cycle Intake & Readiness Checklist Workplace Artifact Build' LIMIT 1),
  'Workplace Case: Remedial Intervention Cycle Intake & Readiness Checklist',
  'An academic recovery team is preparing a remedial intervention cycle plan for 73 learners below benchmark after unit test. The issue is that diagnostic causes, remedial groups, practice tasks, teacher availability, and retest dates are not planned. The learner must check and organise the given records, mark what is complete or missing, and create a handoff-ready remedial intervention checklist before work moves to the next person. The learner must solve the problem using the given data and produce the required workplace artifact.',
  'Workplace problem: An academic recovery team is preparing a remedial intervention cycle plan for 73 learners below benchmark after unit test. The issue is that diagnostic causes, remedial groups, practice tasks, teacher availability, and retest dates are not planned. The learner must check and organise the given records, mark what is complete or missing, and create a handoff-ready remedial intervention checklist before work moves to the next person. Pressure points: Deadline pressure: first handoff is due before the next operating step. Data pressure: unit-test scores, error analysis, attendance record, learner groups, teacher roster, remedial material list, retest plan. Risk: if one input is accepted without checking, the next team may act on wrong or incomplete information. Root cause focus: Check whether the failure comes from missing source data, unclear ownership, outdated records, misunderstood rule, or incomplete handoff format. Major concepts: Diagnostic error analysis; Remedial grouping; Intervention planning; Practice evidence; Retest scheduling; Progress monitoring; Source-of-truth check; Completeness vs correctness; Safe handoff. Level focus: intake and readiness. Required data: unit-test scores, error analysis, attendance record, learner groups, teacher roster, remedial material list, retest plan Learner activity flow: Engage - Start with the case: 73 learners below benchmark after unit test and the visible pain point — diagnostic causes, remedial groups, practice tasks, teacher availability, and retest dates are not planned. Learner identifies who is affected and what could go wrong if the work is delayed or wrong. Explore - Learner studies the source data: unit-test scores, error analysis, attendance record, learner groups, teacher roster, remedial material list, retest plan. They mark trusted records, missing fields, conflicting entries, and items that need confirmation before using them in the artifact. Explain - Teach the main logic in simple terms: Diagnostic error analysis; Remedial grouping; Intervention planning; Practice evidence; Retest scheduling; Progress monitoring; Source-of-truth check; Completeness vs correctness; Safe handoff. Level focus: intake and readiness. Show how rules, evidence, decisions, and handoff notes connect in this workplace task. Express - Learner produces the L1 Remedial Intervention Cycle Intake Checklist using the case data, writes decisions in plain English, and shows evidence for each important field instead of giving only a theory answer. Empower - Learner uses AI only as a coach: ask for missing-field checks, clarity prompts, risk questions, and retry suggestions. AI should not create the final artifact for the learner. Evolve - Learner notes what would become harder at L2: more records, more conflicts, less guidance, stronger evidence expectations, and higher decision responsibility. Artifact to submit: L1 Remedial Intervention Cycle Intake Checklist. L1 Remedial Intervention Cycle Intake Checklist should contain: case details; source data checklist; missing-item log; first-pass validation marks; risk notes; handoff owner and date. Required source data: unit-test scores, error analysis, attendance record, learner groups, teacher roster, remedial material list, retest plan. Evidence fields: Assess whether the learner captured the right data sources, identified missing or conflicting items, avoided assumptions, and created a handoff that another team member can use. AI support: AI coach can ask: What source proves this? Which field is missing? What is the risk if this is wrong? Who owns the next action? Learner must answer using the case data, not guesses.',
  1,
  '8 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Ed Special Education
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-106' LIMIT 1),
  'B.Ed Special Education',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Ed - Remedial Education
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-106' LIMIT 1),
  'B.Ed - Remedial Education',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BA Psychology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-106' LIMIT 1),
  'BA Psychology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MA Education
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-106' LIMIT 1),
  'MA Education',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PG Diploma Remedial Intervention
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-106' LIMIT 1),
  'PG Diploma Remedial Intervention',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Career Guidance Action Planning Intake & Readiness Checklist
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Career Guidance Action Planning Intake & Readiness Checklist',
  'COURSE-L1-111',
  'Learner can identify inputs, check completeness, and create a safe handoff draft for convert learner profiles and market evidence into career guidance action plans and submit a workplace-ready L1 Career Guidance Action Planning Intake Checklist. Workplace scenario: A career guidance cell is preparing a career guidance action plan for 120 final-year learners. The issue is that career interests, aptitude data, course marks, family constraints, and local job options point in different directions. The learner must check and organise the given records, mark what is complete or missing, and create a handoff-ready career guidance planning checklist before work moves to the next person. Learner artifact: L1 Career Guidance Action Planning Intake Checklist. Required data: interest form, aptitude results, academic scores, learner constraints, job/education options, counselling notes. Evidence: Assess whether the learner captured the right data sources, identified missing or conflicting items, avoided assumptions, and created a handoff that another team member can use.',
  '8 hours',
  'Active',
  'Education & Skilling',
  'soft',
  '["Triggered when a guided intake and readiness task needs a real workplace artifact, not a theory answer.","Demonstrates guided intake and readiness by producing and defending the L1 Career Guidance Action Planning Intake Checklist.","Learner can identify inputs, check completeness, and create a safe handoff draft for convert learner profiles and market evidence into career guidance action plans and submit a workplace-ready L1 Career Guidance Action Planning Intake Checklist."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: Module 1: Career Guidance Action Planning Intake & Readiness Checklist Workplace Artifact Build
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-111' LIMIT 1),
  'Module 1: Career Guidance Action Planning Intake & Readiness Checklist Workplace Artifact Build',
  'Triggered when a guided intake and readiness task needs a real workplace artifact, not a theory answer. The learner studies the case, reviews the required data, identifies the gap, creates the artifact, and checks it against evidence fields.',
  1,
  '["Education & Skilling","IND-CAP-23","L1","Career interest interpretation","Aptitude and evidence use","Option comparison","Constraint-aware guidance","Action planning"]'::jsonb,
  '["Engage","Explore","Explain","Express","Empower","Evolve","Artifact Build","Evidence Review","AI-Coached Retry"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Case: Career Guidance Action Planning Intake & Readiness Checklist
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-111' LIMIT 1)
   AND title = 'Module 1: Career Guidance Action Planning Intake & Readiness Checklist Workplace Artifact Build' LIMIT 1),
  'Workplace Case: Career Guidance Action Planning Intake & Readiness Checklist',
  'A career guidance cell is preparing a career guidance action plan for 120 final-year learners. The issue is that career interests, aptitude data, course marks, family constraints, and local job options point in different directions. The learner must check and organise the given records, mark what is complete or missing, and create a handoff-ready career guidance planning checklist before work moves to the next person. The learner must solve the problem using the given data and produce the required workplace artifact.',
  'Workplace problem: A career guidance cell is preparing a career guidance action plan for 120 final-year learners. The issue is that career interests, aptitude data, course marks, family constraints, and local job options point in different directions. The learner must check and organise the given records, mark what is complete or missing, and create a handoff-ready career guidance planning checklist before work moves to the next person. Pressure points: Deadline pressure: first handoff is due before the next operating step. Data pressure: interest form, aptitude results, academic scores, learner constraints, job/education options, counselling notes. Risk: if one input is accepted without checking, the next team may act on wrong or incomplete information. Root cause focus: Check whether the failure comes from missing source data, unclear ownership, outdated records, misunderstood rule, or incomplete handoff format. Major concepts: Career interest interpretation; Aptitude and evidence use; Option comparison; Constraint-aware guidance; Action planning; Referral and follow-up; Source-of-truth check; Completeness vs correctness; Safe handoff. Level focus: intake and readiness. Required data: interest form, aptitude results, academic scores, learner constraints, job/education options, counselling notes Learner activity flow: Engage - Start with the case: 120 final-year learners and the visible pain point — career interests, aptitude data, course marks, family constraints, and local job options point in different directions. Learner identifies who is affected and what could go wrong if the work is delayed or wrong. Explore - Learner studies the source data: interest form, aptitude results, academic scores, learner constraints, job/education options, counselling notes. They mark trusted records, missing fields, conflicting entries, and items that need confirmation before using them in the artifact. Explain - Teach the main logic in simple terms: Career interest interpretation; Aptitude and evidence use; Option comparison; Constraint-aware guidance; Action planning; Referral and follow-up; Source-of-truth check; Completeness vs correctness; Safe handoff. Level focus: intake and readiness. Show how rules, evidence, decisions, and handoff notes connect in this workplace task. Express - Learner produces the L1 Career Guidance Action Planning Intake Checklist using the case data, writes decisions in plain English, and shows evidence for each important field instead of giving only a theory answer. Empower - Learner uses AI only as a coach: ask for missing-field checks, clarity prompts, risk questions, and retry suggestions. AI should not create the final artifact for the learner. Evolve - Learner notes what would become harder at L2: more records, more conflicts, less guidance, stronger evidence expectations, and higher decision responsibility. Artifact to submit: L1 Career Guidance Action Planning Intake Checklist. L1 Career Guidance Action Planning Intake Checklist should contain: case details; source data checklist; missing-item log; first-pass validation marks; risk notes; handoff owner and date. Required source data: interest form, aptitude results, academic scores, learner constraints, job/education options, counselling notes. Evidence fields: Assess whether the learner captured the right data sources, identified missing or conflicting items, avoided assumptions, and created a handoff that another team member can use. AI support: AI coach can ask: What source proves this? Which field is missing? What is the risk if this is wrong? Who owns the next action? Learner must answer using the case data, not guesses.',
  1,
  '8 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BA Psychology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-111' LIMIT 1),
  'BA Psychology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MA Counselling Psychology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-111' LIMIT 1),
  'MA Counselling Psychology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BBA HR
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-111' LIMIT 1),
  'BBA HR',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MBA HR
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-111' LIMIT 1),
  'MBA HR',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PG Diploma Career Guidance and Counselling
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-111' LIMIT 1),
  'PG Diploma Career Guidance and Counselling',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Coaching Progress Management Intake & Readiness Checklist
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Coaching Progress Management Intake & Readiness Checklist',
  'COURSE-L1-116',
  'Learner can identify inputs, check completeness, and create a safe handoff draft for manage language or performance coaching progress through diagnostic evidence, practice cycles, and feedback records and submit a workplace-ready L1 Coaching Progress Management Intake Checklist. Workplace scenario: A coaching program team is preparing a coaching progress tracker for 36 learners in a 6-week coaching cycle. The issue is that practice logs, coach feedback, attendance, improvement targets, and learner reflections are inconsistent. The learner must check and organise the given records, mark what is complete or missing, and create a handoff-ready coaching progress management checklist before work moves to the next person. Learner artifact: L1 Coaching Progress Management Intake Checklist. Required data: practice log, coach feedback, attendance, performance target, reflection notes, review dates. Evidence: Assess whether the learner captured the right data sources, identified missing or conflicting items, avoided assumptions, and created a handoff that another team member can use.',
  '8 hours',
  'Active',
  'Education & Skilling',
  'soft',
  '["Triggered when a guided intake and readiness task needs a real workplace artifact, not a theory answer.","Demonstrates guided intake and readiness by producing and defending the L1 Coaching Progress Management Intake Checklist.","Learner can identify inputs, check completeness, and create a safe handoff draft for manage language or performance coaching progress through diagnostic evidence, practice cycles, and feedback records and submit a workplace-ready L1 Coaching Progress Management Intake Checklist."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: Module 1: Coaching Progress Management Intake & Readiness Checklist Workplace Artifact Build
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-116' LIMIT 1),
  'Module 1: Coaching Progress Management Intake & Readiness Checklist Workplace Artifact Build',
  'Triggered when a guided intake and readiness task needs a real workplace artifact, not a theory answer. The learner studies the case, reviews the required data, identifies the gap, creates the artifact, and checks it against evidence fields.',
  1,
  '["Education & Skilling","IND-CAP-24","L1","Coaching goal setting","Practice evidence tracking","Feedback loop","Progress review","Motivation support"]'::jsonb,
  '["Engage","Explore","Explain","Express","Empower","Evolve","Artifact Build","Evidence Review","AI-Coached Retry"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Case: Coaching Progress Management Intake & Readiness Checklist
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-116' LIMIT 1)
   AND title = 'Module 1: Coaching Progress Management Intake & Readiness Checklist Workplace Artifact Build' LIMIT 1),
  'Workplace Case: Coaching Progress Management Intake & Readiness Checklist',
  'A coaching program team is preparing a coaching progress tracker for 36 learners in a 6-week coaching cycle. The issue is that practice logs, coach feedback, attendance, improvement targets, and learner reflections are inconsistent. The learner must check and organise the given records, mark what is complete or missing, and create a handoff-ready coaching progress management checklist before work moves to the next person. The learner must solve the problem using the given data and produce the required workplace artifact.',
  'Workplace problem: A coaching program team is preparing a coaching progress tracker for 36 learners in a 6-week coaching cycle. The issue is that practice logs, coach feedback, attendance, improvement targets, and learner reflections are inconsistent. The learner must check and organise the given records, mark what is complete or missing, and create a handoff-ready coaching progress management checklist before work moves to the next person. Pressure points: Deadline pressure: first handoff is due before the next operating step. Data pressure: practice log, coach feedback, attendance, performance target, reflection notes, review dates. Risk: if one input is accepted without checking, the next team may act on wrong or incomplete information. Root cause focus: Check whether the failure comes from missing source data, unclear ownership, outdated records, misunderstood rule, or incomplete handoff format. Major concepts: Coaching goal setting; Practice evidence tracking; Feedback loop; Progress review; Motivation support; Next-step planning; Source-of-truth check; Completeness vs correctness; Safe handoff. Level focus: intake and readiness. Required data: practice log, coach feedback, attendance, performance target, reflection notes, review dates Learner activity flow: Engage - Start with the case: 36 learners in a 6-week coaching cycle and the visible pain point — practice logs, coach feedback, attendance, improvement targets, and learner reflections are inconsistent. Learner identifies who is affected and what could go wrong if the work is delayed or wrong. Explore - Learner studies the source data: practice log, coach feedback, attendance, performance target, reflection notes, review dates. They mark trusted records, missing fields, conflicting entries, and items that need confirmation before using them in the artifact. Explain - Teach the main logic in simple terms: Coaching goal setting; Practice evidence tracking; Feedback loop; Progress review; Motivation support; Next-step planning; Source-of-truth check; Completeness vs correctness; Safe handoff. Level focus: intake and readiness. Show how rules, evidence, decisions, and handoff notes connect in this workplace task. Express - Learner produces the L1 Coaching Progress Management Intake Checklist using the case data, writes decisions in plain English, and shows evidence for each important field instead of giving only a theory answer. Empower - Learner uses AI only as a coach: ask for missing-field checks, clarity prompts, risk questions, and retry suggestions. AI should not create the final artifact for the learner. Evolve - Learner notes what would become harder at L2: more records, more conflicts, less guidance, stronger evidence expectations, and higher decision responsibility. Artifact to submit: L1 Coaching Progress Management Intake Checklist. L1 Coaching Progress Management Intake Checklist should contain: case details; source data checklist; missing-item log; first-pass validation marks; risk notes; handoff owner and date. Required source data: practice log, coach feedback, attendance, performance target, reflection notes, review dates. Evidence fields: Assess whether the learner captured the right data sources, identified missing or conflicting items, avoided assumptions, and created a handoff that another team member can use. AI support: AI coach can ask: What source proves this? Which field is missing? What is the risk if this is wrong? Who owns the next action? Learner must answer using the case data, not guesses.',
  1,
  '8 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BA English and Communication
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-116' LIMIT 1),
  'BA English and Communication',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.P.Ed
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-116' LIMIT 1),
  'B.P.Ed',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BFA Performing Arts
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-116' LIMIT 1),
  'BFA Performing Arts',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Ed - Coaching Support
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-116' LIMIT 1),
  'B.Ed - Coaching Support',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PG Diploma Coaching and Mentoring
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-116' LIMIT 1),
  'PG Diploma Coaching and Mentoring',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Admissions Operations Intake & Readiness Checklist
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Admissions Operations Intake & Readiness Checklist',
  'COURSE-L1-121',
  'Learner can identify inputs, check completeness, and create a safe handoff draft for complete admissions operations through document verification, enrollment coding, and record activation and submit a workplace-ready L1 Admissions Operations Intake Checklist. Workplace scenario: An admissions office is preparing an admissions operations tracker for 520 applicants for 180 seats. The issue is that application status, document checks, fee records, category rules, and communication logs are not synchronized. The learner must check and organise the given records, mark what is complete or missing, and create a handoff-ready admissions operations checklist before work moves to the next person. Learner artifact: L1 Admissions Operations Intake Checklist. Required data: application forms, document checklist, fee report, category rules, merit/selection list, communication log. Evidence: Assess whether the learner captured the right data sources, identified missing or conflicting items, avoided assumptions, and created a handoff that another team member can use.',
  '8 hours',
  'Active',
  'Education & Skilling',
  'technical',
  '["Triggered when a guided intake and readiness task needs a real workplace artifact, not a theory answer.","Demonstrates guided intake and readiness by producing and defending the L1 Admissions Operations Intake Checklist.","Learner can identify inputs, check completeness, and create a safe handoff draft for complete admissions operations through document verification, enrollment coding, and record activation and submit a workplace-ready L1 Admissions Operations Intake Checklist."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: Module 1: Admissions Operations Intake & Readiness Checklist Workplace Artifact Build
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-121' LIMIT 1),
  'Module 1: Admissions Operations Intake & Readiness Checklist Workplace Artifact Build',
  'Triggered when a guided intake and readiness task needs a real workplace artifact, not a theory answer. The learner studies the case, reviews the required data, identifies the gap, creates the artifact, and checks it against evidence fields.',
  1,
  '["Education & Skilling","IND-CAP-25","L1","Admissions workflow","Document and fee verification","Selection rule application","Status communication","Exception tagging"]'::jsonb,
  '["Engage","Explore","Explain","Express","Empower","Evolve","Artifact Build","Evidence Review","AI-Coached Retry"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Case: Admissions Operations Intake & Readiness Checklist
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-121' LIMIT 1)
   AND title = 'Module 1: Admissions Operations Intake & Readiness Checklist Workplace Artifact Build' LIMIT 1),
  'Workplace Case: Admissions Operations Intake & Readiness Checklist',
  'An admissions office is preparing an admissions operations tracker for 520 applicants for 180 seats. The issue is that application status, document checks, fee records, category rules, and communication logs are not synchronized. The learner must check and organise the given records, mark what is complete or missing, and create a handoff-ready admissions operations checklist before work moves to the next person. The learner must solve the problem using the given data and produce the required workplace artifact.',
  'Workplace problem: An admissions office is preparing an admissions operations tracker for 520 applicants for 180 seats. The issue is that application status, document checks, fee records, category rules, and communication logs are not synchronized. The learner must check and organise the given records, mark what is complete or missing, and create a handoff-ready admissions operations checklist before work moves to the next person. Pressure points: Deadline pressure: first handoff is due before the next operating step. Data pressure: application forms, document checklist, fee report, category rules, merit/selection list, communication log. Risk: if one input is accepted without checking, the next team may act on wrong or incomplete information. Root cause focus: Check whether the failure comes from missing source data, unclear ownership, outdated records, misunderstood rule, or incomplete handoff format. Major concepts: Admissions workflow; Document and fee verification; Selection rule application; Status communication; Exception tagging; Admissions audit trail; Source-of-truth check; Completeness vs correctness; Safe handoff. Level focus: intake and readiness. Required data: application forms, document checklist, fee report, category rules, merit/selection list, communication log Learner activity flow: Engage - Start with the case: 520 applicants for 180 seats and the visible pain point — application status, document checks, fee records, category rules, and communication logs are not synchronized. Learner identifies who is affected and what could go wrong if the work is delayed or wrong. Explore - Learner studies the source data: application forms, document checklist, fee report, category rules, merit/selection list, communication log. They mark trusted records, missing fields, conflicting entries, and items that need confirmation before using them in the artifact. Explain - Teach the main logic in simple terms: Admissions workflow; Document and fee verification; Selection rule application; Status communication; Exception tagging; Admissions audit trail; Source-of-truth check; Completeness vs correctness; Safe handoff. Level focus: intake and readiness. Show how rules, evidence, decisions, and handoff notes connect in this workplace task. Express - Learner produces the L1 Admissions Operations Intake Checklist using the case data, writes decisions in plain English, and shows evidence for each important field instead of giving only a theory answer. Empower - Learner uses AI only as a coach: ask for missing-field checks, clarity prompts, risk questions, and retry suggestions. AI should not create the final artifact for the learner. Evolve - Learner notes what would become harder at L2: more records, more conflicts, less guidance, stronger evidence expectations, and higher decision responsibility. Artifact to submit: L1 Admissions Operations Intake Checklist. L1 Admissions Operations Intake Checklist should contain: case details; source data checklist; missing-item log; first-pass validation marks; risk notes; handoff owner and date. Required source data: application forms, document checklist, fee report, category rules, merit/selection list, communication log. Evidence fields: Assess whether the learner captured the right data sources, identified missing or conflicting items, avoided assumptions, and created a handoff that another team member can use. AI support: AI coach can ask: What source proves this? Which field is missing? What is the risk if this is wrong? Who owns the next action? Learner must answer using the case data, not guesses.',
  1,
  '8 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BBA Education Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-121' LIMIT 1),
  'BBA Education Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Com - Admissions Operations
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-121' LIMIT 1),
  'B.Com - Admissions Operations',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BA Public Administration
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-121' LIMIT 1),
  'BA Public Administration',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MBA Education Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-121' LIMIT 1),
  'MBA Education Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PG Diploma Admission Counselling
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-121' LIMIT 1),
  'PG Diploma Admission Counselling',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Education MIS Reporting Intake & Readiness Checklist
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Education MIS Reporting Intake & Readiness Checklist',
  'COURSE-L1-126',
  'Learner can identify inputs, check completeness, and create a safe handoff draft for produce institution-level education MIS reports through institution-code, learner-record, and data-quality controls and submit a workplace-ready L1 Education MIS Reporting Intake Checklist. Workplace scenario: An institution reporting team is preparing an education MIS report pack for 12 departments reporting monthly data. The issue is that enrollment, attendance, assessment, dropout, and placement numbers do not reconcile before submission. The learner must check and organise the given records, mark what is complete or missing, and create a handoff-ready education MIS reporting checklist before work moves to the next person. Learner artifact: L1 Education MIS Reporting Intake Checklist. Required data: department data files, ERP exports, attendance summaries, assessment results, dropout records, placement tracker. Evidence: Assess whether the learner captured the right data sources, identified missing or conflicting items, avoided assumptions, and created a handoff that another team member can use.',
  '8 hours',
  'Active',
  'Education & Skilling',
  'technical',
  '["Triggered when a guided intake and readiness task needs a real workplace artifact, not a theory answer.","Demonstrates guided intake and readiness by producing and defending the L1 Education MIS Reporting Intake Checklist.","Learner can identify inputs, check completeness, and create a safe handoff draft for produce institution-level education MIS reports through institution-code, learner-record, and data-quality controls and submit a workplace-ready L1 Education MIS Reporting Intake Checklist."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: Module 1: Education MIS Reporting Intake & Readiness Checklist Workplace Artifact Build
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-126' LIMIT 1),
  'Module 1: Education MIS Reporting Intake & Readiness Checklist Workplace Artifact Build',
  'Triggered when a guided intake and readiness task needs a real workplace artifact, not a theory answer. The learner studies the case, reviews the required data, identifies the gap, creates the artifact, and checks it against evidence fields.',
  1,
  '["Education & Skilling","IND-CAP-26","L1","MIS data validation","Indicator definition","Reconciliation logic","Dashboard readiness","Exception notes"]'::jsonb,
  '["Engage","Explore","Explain","Express","Empower","Evolve","Artifact Build","Evidence Review","AI-Coached Retry"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Case: Education MIS Reporting Intake & Readiness Checklist
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-126' LIMIT 1)
   AND title = 'Module 1: Education MIS Reporting Intake & Readiness Checklist Workplace Artifact Build' LIMIT 1),
  'Workplace Case: Education MIS Reporting Intake & Readiness Checklist',
  'An institution reporting team is preparing an education MIS report pack for 12 departments reporting monthly data. The issue is that enrollment, attendance, assessment, dropout, and placement numbers do not reconcile before submission. The learner must check and organise the given records, mark what is complete or missing, and create a handoff-ready education MIS reporting checklist before work moves to the next person. The learner must solve the problem using the given data and produce the required workplace artifact.',
  'Workplace problem: An institution reporting team is preparing an education MIS report pack for 12 departments reporting monthly data. The issue is that enrollment, attendance, assessment, dropout, and placement numbers do not reconcile before submission. The learner must check and organise the given records, mark what is complete or missing, and create a handoff-ready education MIS reporting checklist before work moves to the next person. Pressure points: Deadline pressure: first handoff is due before the next operating step. Data pressure: department data files, ERP exports, attendance summaries, assessment results, dropout records, placement tracker. Risk: if one input is accepted without checking, the next team may act on wrong or incomplete information. Root cause focus: Check whether the failure comes from missing source data, unclear ownership, outdated records, misunderstood rule, or incomplete handoff format. Major concepts: MIS data validation; Indicator definition; Reconciliation logic; Dashboard readiness; Exception notes; Submission control; Source-of-truth check; Completeness vs correctness; Safe handoff. Level focus: intake and readiness. Required data: department data files, ERP exports, attendance summaries, assessment results, dropout records, placement tracker Learner activity flow: Engage - Start with the case: 12 departments reporting monthly data and the visible pain point — enrollment, attendance, assessment, dropout, and placement numbers do not reconcile before submission. Learner identifies who is affected and what could go wrong if the work is delayed or wrong. Explore - Learner studies the source data: department data files, ERP exports, attendance summaries, assessment results, dropout records, placement tracker. They mark trusted records, missing fields, conflicting entries, and items that need confirmation before using them in the artifact. Explain - Teach the main logic in simple terms: MIS data validation; Indicator definition; Reconciliation logic; Dashboard readiness; Exception notes; Submission control; Source-of-truth check; Completeness vs correctness; Safe handoff. Level focus: intake and readiness. Show how rules, evidence, decisions, and handoff notes connect in this workplace task. Express - Learner produces the L1 Education MIS Reporting Intake Checklist using the case data, writes decisions in plain English, and shows evidence for each important field instead of giving only a theory answer. Empower - Learner uses AI only as a coach: ask for missing-field checks, clarity prompts, risk questions, and retry suggestions. AI should not create the final artifact for the learner. Evolve - Learner notes what would become harder at L2: more records, more conflicts, less guidance, stronger evidence expectations, and higher decision responsibility. Artifact to submit: L1 Education MIS Reporting Intake Checklist. L1 Education MIS Reporting Intake Checklist should contain: case details; source data checklist; missing-item log; first-pass validation marks; risk notes; handoff owner and date. Required source data: department data files, ERP exports, attendance summaries, assessment results, dropout records, placement tracker. Evidence fields: Assess whether the learner captured the right data sources, identified missing or conflicting items, avoided assumptions, and created a handoff that another team member can use. AI support: AI coach can ask: What source proves this? Which field is missing? What is the risk if this is wrong? Who owns the next action? Learner must answer using the case data, not guesses.',
  1,
  '8 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BCA
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-126' LIMIT 1),
  'BCA',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc IT
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-126' LIMIT 1),
  'B.Sc IT',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Com - Data Reporting
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-126' LIMIT 1),
  'B.Com - Data Reporting',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BBA Business Analytics
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-126' LIMIT 1),
  'BBA Business Analytics',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PG Diploma Education Data Analytics
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-126' LIMIT 1),
  'PG Diploma Education Data Analytics',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Government/NGO Program Tracking Intake & Readiness Checklist
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Government/NGO Program Tracking Intake & Readiness Checklist',
  'COURSE-L1-131',
  'Learner can identify inputs, check completeness, and create a safe handoff draft for track government or ngo education programs through beneficiary, activity, utilization, and outcome evidence and submit a workplace-ready L1 Government/NGO Program Tracking Intake Checklist. Workplace scenario: A NGO education program team is preparing a program tracking report for 18 centres and 2,400 beneficiaries. The issue is that attendance, activity evidence, budget use, outcome data, and donor reporting formats are incomplete. The learner must check and organise the given records, mark what is complete or missing, and create a handoff-ready government/ngo program tracking checklist before work moves to the next person. Learner artifact: L1 Government/NGO Program Tracking Intake Checklist. Required data: centre reports, attendance registers, activity photos/logs, budget sheet, outcome tracker, donor format. Evidence: Assess whether the learner captured the right data sources, identified missing or conflicting items, avoided assumptions, and created a handoff that another team member can use.',
  '8 hours',
  'Active',
  'Education & Skilling',
  'technical',
  '["Triggered when a guided intake and readiness task needs a real workplace artifact, not a theory answer.","Demonstrates guided intake and readiness by producing and defending the L1 Government/NGO Program Tracking Intake Checklist.","Learner can identify inputs, check completeness, and create a safe handoff draft for track government or ngo education programs through beneficiary, activity, utilization, and outcome evidence and submit a workplace-ready L1 Government/NGO Program Tracking Intake Checklist."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: Module 1: Government/NGO Program Tracking Intake & Readiness Checklist Workplace Artifact Build
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-131' LIMIT 1),
  'Module 1: Government/NGO Program Tracking Intake & Readiness Checklist Workplace Artifact Build',
  'Triggered when a guided intake and readiness task needs a real workplace artifact, not a theory answer. The learner studies the case, reviews the required data, identifies the gap, creates the artifact, and checks it against evidence fields.',
  1,
  '["Education & Skilling","IND-CAP-27","L1","Program monitoring","Beneficiary data tracking","Activity evidence control","Budget-output linkage","Donor report structure"]'::jsonb,
  '["Engage","Explore","Explain","Express","Empower","Evolve","Artifact Build","Evidence Review","AI-Coached Retry"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Case: Government/NGO Program Tracking Intake & Readiness Checklist
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-131' LIMIT 1)
   AND title = 'Module 1: Government/NGO Program Tracking Intake & Readiness Checklist Workplace Artifact Build' LIMIT 1),
  'Workplace Case: Government/NGO Program Tracking Intake & Readiness Checklist',
  'A NGO education program team is preparing a program tracking report for 18 centres and 2,400 beneficiaries. The issue is that attendance, activity evidence, budget use, outcome data, and donor reporting formats are incomplete. The learner must check and organise the given records, mark what is complete or missing, and create a handoff-ready government/ngo program tracking checklist before work moves to the next person. The learner must solve the problem using the given data and produce the required workplace artifact.',
  'Workplace problem: A NGO education program team is preparing a program tracking report for 18 centres and 2,400 beneficiaries. The issue is that attendance, activity evidence, budget use, outcome data, and donor reporting formats are incomplete. The learner must check and organise the given records, mark what is complete or missing, and create a handoff-ready government/ngo program tracking checklist before work moves to the next person. Pressure points: Deadline pressure: first handoff is due before the next operating step. Data pressure: centre reports, attendance registers, activity photos/logs, budget sheet, outcome tracker, donor format. Risk: if one input is accepted without checking, the next team may act on wrong or incomplete information. Root cause focus: Check whether the failure comes from missing source data, unclear ownership, outdated records, misunderstood rule, or incomplete handoff format. Major concepts: Program monitoring; Beneficiary data tracking; Activity evidence control; Budget-output linkage; Donor report structure; Risk and variance note; Source-of-truth check; Completeness vs correctness; Safe handoff. Level focus: intake and readiness. Required data: centre reports, attendance registers, activity photos/logs, budget sheet, outcome tracker, donor format Learner activity flow: Engage - Start with the case: 18 centres and 2,400 beneficiaries and the visible pain point — attendance, activity evidence, budget use, outcome data, and donor reporting formats are incomplete. Learner identifies who is affected and what could go wrong if the work is delayed or wrong. Explore - Learner studies the source data: centre reports, attendance registers, activity photos/logs, budget sheet, outcome tracker, donor format. They mark trusted records, missing fields, conflicting entries, and items that need confirmation before using them in the artifact. Explain - Teach the main logic in simple terms: Program monitoring; Beneficiary data tracking; Activity evidence control; Budget-output linkage; Donor report structure; Risk and variance note; Source-of-truth check; Completeness vs correctness; Safe handoff. Level focus: intake and readiness. Show how rules, evidence, decisions, and handoff notes connect in this workplace task. Express - Learner produces the L1 Government/NGO Program Tracking Intake Checklist using the case data, writes decisions in plain English, and shows evidence for each important field instead of giving only a theory answer. Empower - Learner uses AI only as a coach: ask for missing-field checks, clarity prompts, risk questions, and retry suggestions. AI should not create the final artifact for the learner. Evolve - Learner notes what would become harder at L2: more records, more conflicts, less guidance, stronger evidence expectations, and higher decision responsibility. Artifact to submit: L1 Government/NGO Program Tracking Intake Checklist. L1 Government/NGO Program Tracking Intake Checklist should contain: case details; source data checklist; missing-item log; first-pass validation marks; risk notes; handoff owner and date. Required source data: centre reports, attendance registers, activity photos/logs, budget sheet, outcome tracker, donor format. Evidence fields: Assess whether the learner captured the right data sources, identified missing or conflicting items, avoided assumptions, and created a handoff that another team member can use. AI support: AI coach can ask: What source proves this? Which field is missing? What is the risk if this is wrong? Who owns the next action? Learner must answer using the case data, not guesses.',
  1,
  '8 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BSW - Community Development
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-131' LIMIT 1),
  'BSW - Community Development',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MSW - Education Programs
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-131' LIMIT 1),
  'MSW - Education Programs',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BA Public Administration
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-131' LIMIT 1),
  'BA Public Administration',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MA Development Studies
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-131' LIMIT 1),
  'MA Development Studies',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PG Diploma NGO Program Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-131' LIMIT 1),
  'PG Diploma NGO Program Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Research Publishing Coordination Intake & Readiness Checklist
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Research Publishing Coordination Intake & Readiness Checklist',
  'COURSE-L1-136',
  'Learner can identify inputs, check completeness, and create a safe handoff draft for research and academic publishing cycles through study evidence, review workflow, and publication records and submit a workplace-ready L1 Research Publishing Coordination Intake Checklist. Workplace scenario: A research office is preparing a research publishing tracker for 22 manuscripts in review cycle. The issue is that ethics approval, reviewer comments, author revisions, plagiarism checks, and publication status are scattered. The learner must check and organise the given records, mark what is complete or missing, and create a handoff-ready research publishing coordination checklist before work moves to the next person. Learner artifact: L1 Research Publishing Coordination Intake Checklist. Required data: manuscript tracker, ethics approval, reviewer comments, revision files, plagiarism report, publication status log. Evidence: Assess whether the learner captured the right data sources, identified missing or conflicting items, avoided assumptions, and created a handoff that another team member can use.',
  '8 hours',
  'Active',
  'Education & Skilling',
  'technical',
  '["Triggered when a guided intake and readiness task needs a real workplace artifact, not a theory answer.","Demonstrates guided intake and readiness by producing and defending the L1 Research Publishing Coordination Intake Checklist.","Learner can identify inputs, check completeness, and create a safe handoff draft for research and academic publishing cycles through study evidence, review workflow, and publication records and submit a workplace-ready L1 Research Publishing Coordination Intake Checklist."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: Module 1: Research Publishing Coordination Intake & Readiness Checklist Workplace Artifact Build
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-136' LIMIT 1),
  'Module 1: Research Publishing Coordination Intake & Readiness Checklist Workplace Artifact Build',
  'Triggered when a guided intake and readiness task needs a real workplace artifact, not a theory answer. The learner studies the case, reviews the required data, identifies the gap, creates the artifact, and checks it against evidence fields.',
  1,
  '["Education & Skilling","IND-CAP-28","L1","Research workflow tracking","Ethics and compliance check","Peer-review status control","Revision evidence","Publication record management"]'::jsonb,
  '["Engage","Explore","Explain","Express","Empower","Evolve","Artifact Build","Evidence Review","AI-Coached Retry"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Case: Research Publishing Coordination Intake & Readiness Checklist
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-136' LIMIT 1)
   AND title = 'Module 1: Research Publishing Coordination Intake & Readiness Checklist Workplace Artifact Build' LIMIT 1),
  'Workplace Case: Research Publishing Coordination Intake & Readiness Checklist',
  'A research office is preparing a research publishing tracker for 22 manuscripts in review cycle. The issue is that ethics approval, reviewer comments, author revisions, plagiarism checks, and publication status are scattered. The learner must check and organise the given records, mark what is complete or missing, and create a handoff-ready research publishing coordination checklist before work moves to the next person. The learner must solve the problem using the given data and produce the required workplace artifact.',
  'Workplace problem: A research office is preparing a research publishing tracker for 22 manuscripts in review cycle. The issue is that ethics approval, reviewer comments, author revisions, plagiarism checks, and publication status are scattered. The learner must check and organise the given records, mark what is complete or missing, and create a handoff-ready research publishing coordination checklist before work moves to the next person. Pressure points: Deadline pressure: first handoff is due before the next operating step. Data pressure: manuscript tracker, ethics approval, reviewer comments, revision files, plagiarism report, publication status log. Risk: if one input is accepted without checking, the next team may act on wrong or incomplete information. Root cause focus: Check whether the failure comes from missing source data, unclear ownership, outdated records, misunderstood rule, or incomplete handoff format. Major concepts: Research workflow tracking; Ethics and compliance check; Peer-review status control; Revision evidence; Publication record management; Author communication; Source-of-truth check; Completeness vs correctness; Safe handoff. Level focus: intake and readiness. Required data: manuscript tracker, ethics approval, reviewer comments, revision files, plagiarism report, publication status log Learner activity flow: Engage - Start with the case: 22 manuscripts in review cycle and the visible pain point — ethics approval, reviewer comments, author revisions, plagiarism checks, and publication status are scattered. Learner identifies who is affected and what could go wrong if the work is delayed or wrong. Explore - Learner studies the source data: manuscript tracker, ethics approval, reviewer comments, revision files, plagiarism report, publication status log. They mark trusted records, missing fields, conflicting entries, and items that need confirmation before using them in the artifact. Explain - Teach the main logic in simple terms: Research workflow tracking; Ethics and compliance check; Peer-review status control; Revision evidence; Publication record management; Author communication; Source-of-truth check; Completeness vs correctness; Safe handoff. Level focus: intake and readiness. Show how rules, evidence, decisions, and handoff notes connect in this workplace task. Express - Learner produces the L1 Research Publishing Coordination Intake Checklist using the case data, writes decisions in plain English, and shows evidence for each important field instead of giving only a theory answer. Empower - Learner uses AI only as a coach: ask for missing-field checks, clarity prompts, risk questions, and retry suggestions. AI should not create the final artifact for the learner. Evolve - Learner notes what would become harder at L2: more records, more conflicts, less guidance, stronger evidence expectations, and higher decision responsibility. Artifact to submit: L1 Research Publishing Coordination Intake Checklist. L1 Research Publishing Coordination Intake Checklist should contain: case details; source data checklist; missing-item log; first-pass validation marks; risk notes; handoff owner and date. Required source data: manuscript tracker, ethics approval, reviewer comments, revision files, plagiarism report, publication status log. Evidence fields: Assess whether the learner captured the right data sources, identified missing or conflicting items, avoided assumptions, and created a handoff that another team member can use. AI support: AI coach can ask: What source proves this? Which field is missing? What is the risk if this is wrong? Who owns the next action? Learner must answer using the case data, not guesses.',
  1,
  '8 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BA Education
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-136' LIMIT 1),
  'BA Education',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MA Education
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-136' LIMIT 1),
  'MA Education',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Ed Research Methods
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-136' LIMIT 1),
  'M.Ed Research Methods',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PG Diploma Research Methodology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-136' LIMIT 1),
  'PG Diploma Research Methodology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PhD Coursework - Education Research
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L1-136' LIMIT 1),
  'PhD Coursework - Education Research',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Cohort Scheduling Workflow Build, Conflict Handling & Final Release
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Cohort Scheduling Workflow Build, Conflict Handling & Final Release',
  'COURSE-L2-002',
  'Learner can complete the workflow, resolve routine conflicts, and release the output for cohort session schedules from calendar, facilitator, learner, and resource constraints and submit a workplace-ready L2 Cohort Scheduling Execution Release Pack. Workplace scenario: A training centre must complete and release the weekly cohort timetable for 240 learners across 3 batches by the end of the day. The same inputs now have routine conflicts: two facilitators are unavailable, one lab is double-booked, 18 learners were added late, and a holiday was missed. The learner must update the tracker, resolve normal mismatches, record decisions, and release a clean cohort scheduling work pack. Learner artifact: L2 Cohort Scheduling Execution Release Pack. Required data: academic calendar, facilitator roster, room/lab tracker, batch list, holiday calendar, session duration rules, approval notes. Evidence: Assess whether routine conflicts were resolved correctly, statuses were updated, decisions were traceable, and the release pack can be used without extra explanation.',
  '12 hours',
  'Active',
  'Formal Education & Lifelong Learning Delivery',
  'technical',
  '["Triggered when an independent routine execution task needs a real workplace artifact, not a theory answer.","Demonstrates independent routine execution by producing and defending the L2 Cohort Scheduling Execution Release Pack.","Learner can complete the workflow, resolve routine conflicts, and release the output for cohort session schedules from calendar, facilitator, learner, and resource constraints and submit a workplace-ready L2 Cohort Scheduling Execution Release Pack."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: Module 1: Cohort Scheduling Workflow Build, Conflict Handling & Final Release Workplace Artifact Build
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-002' LIMIT 1),
  'Module 1: Cohort Scheduling Workflow Build, Conflict Handling & Final Release Workplace Artifact Build',
  'Triggered when an independent routine execution task needs a real workplace artifact, not a theory answer. The learner studies the case, reviews the required data, identifies the gap, creates the artifact, and checks it against evidence fields.',
  1,
  '["Education & Skilling","Formal Education & Lifelong Learning Delivery","IND-CAP-01","L2","Academic calendar logic","Batch-wise timetable sequencing","Facilitator availability check","Room and resource constraint mapping","Conflict log and priority rules"]'::jsonb,
  '["Engage","Explore","Explain","Express","Empower","Evolve","Artifact Build","Evidence Review","AI-Coached Retry"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Case: Cohort Scheduling Workflow Build, Conflict Handling & Final Release
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-002' LIMIT 1)
   AND title = 'Module 1: Cohort Scheduling Workflow Build, Conflict Handling & Final Release Workplace Artifact Build' LIMIT 1),
  'Workplace Case: Cohort Scheduling Workflow Build, Conflict Handling & Final Release',
  'A training centre must complete and release the weekly cohort timetable for 240 learners across 3 batches by the end of the day. The same inputs now have routine conflicts: two facilitators are unavailable, one lab is double-booked, 18 learners were added late, and a holiday was missed. The learner must update the tracker, resolve normal mismatches, record decisions, and release a clean cohort scheduling work pack. The learner must solve the problem using the given data and produce the required workplace artifact.',
  'Workplace problem: A training centre must complete and release the weekly cohort timetable for 240 learners across 3 batches by the end of the day. The same inputs now have routine conflicts: two facilitators are unavailable, one lab is double-booked, 18 learners were added late, and a holiday was missed. The learner must update the tracker, resolve normal mismatches, record decisions, and release a clean cohort scheduling work pack. Pressure points: Release pressure: the work must be completed, not only checked. Learner must manage routine mismatches in academic calendar, facilitator roster, room/lab tracker, batch list, holiday calendar, session duration rules, approval notes while keeping status updates clear and on time. Root cause focus: Find whether delay or error comes from workflow sequencing, routine conflict handling, unclear status update, or missing release approval. Major concepts: Academic calendar logic; Batch-wise timetable sequencing; Facilitator availability check; Room and resource constraint mapping; Conflict log and priority rules; Schedule release handoff; Workflow sequencing; Routine conflict resolution; Release control. Level focus: workflow execution and release. Required data: academic calendar, facilitator roster, room/lab tracker, batch list, holiday calendar, session duration rules, approval notes Learner activity flow: Engage - Start with the case: 240 learners across 3 batches and the visible pain point — two facilitators are unavailable, one lab is double-booked, 18 learners were added late, and a holiday was missed. Learner identifies who is affected and what could go wrong if the work is delayed or wrong. Explore - Learner studies the source data: academic calendar, facilitator roster, room/lab tracker, batch list, holiday calendar, session duration rules, approval notes. They mark trusted records, missing fields, conflicting entries, and items that need confirmation before using them in the artifact. Explain - Teach the main logic in simple terms: Academic calendar logic; Batch-wise timetable sequencing; Facilitator availability check; Room and resource constraint mapping; Conflict log and priority rules; Schedule release handoff; Workflow sequencing; Routine conflict resolution; Release control. Level focus: workflow execution and release. Show how rules, evidence, decisions, and handoff notes connect in this workplace task. Express - Learner produces the L2 Cohort Scheduling Execution Release Pack using the case data, writes decisions in plain English, and shows evidence for each important field instead of giving only a theory answer. Empower - Learner uses AI only as a coach: ask for missing-field checks, clarity prompts, risk questions, and retry suggestions. AI should not create the final artifact for the learner. Evolve - Learner notes what would become harder at L3: more records, more conflicts, less guidance, stronger evidence expectations, and higher decision responsibility. Artifact to submit: L2 Cohort Scheduling Execution Release Pack. L2 Cohort Scheduling Execution Release Pack should contain: work tracker; resolved routine conflicts; updated status fields; release checklist; decision note; final handoff confirmation. Required source data: academic calendar, facilitator roster, room/lab tracker, batch list, holiday calendar, session duration rules, approval notes. Evidence fields: Assess whether routine conflicts were resolved correctly, statuses were updated, decisions were traceable, and the release pack can be used without extra explanation. AI support: AI coach can ask: What source proves this? Which field is missing? What is the risk if this is wrong? Who owns the next action? Learner must answer using the case data, not guesses.',
  1,
  '12 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Ed - School Education
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-002' LIMIT 1),
  'B.Ed - School Education',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Ed - Education Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-002' LIMIT 1),
  'M.Ed - Education Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BA Education
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-002' LIMIT 1),
  'BA Education',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BBA Education Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-002' LIMIT 1),
  'BBA Education Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PG Diploma Education Administration
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-002' LIMIT 1),
  'PG Diploma Education Administration',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Learner Progression Workflow Build, Conflict Handling & Final Release
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Learner Progression Workflow Build, Conflict Handling & Final Release',
  'COURSE-L2-007',
  'Learner can complete the workflow, resolve routine conflicts, and release the output for learner progression decisions using attendance, assessment, and participation evidence and submit a workplace-ready L2 Learner Progression Execution Release Pack. Workplace scenario: A program office must complete and release the progression decision list for 126 learners at module-end review by the end of the day. The same inputs now have routine conflicts: attendance, assessment marks, project submissions, and remedial records do not match for 31 learners. The learner must update the tracker, resolve normal mismatches, record decisions, and release a clean learner progression work pack. Learner artifact: L2 Learner Progression Execution Release Pack. Required data: attendance sheet, assessment scores, project submission tracker, remediation log, progression criteria, mentor comments. Evidence: Assess whether routine conflicts were resolved correctly, statuses were updated, decisions were traceable, and the release pack can be used without extra explanation.',
  '12 hours',
  'Active',
  'Formal Education & Lifelong Learning Delivery',
  'technical',
  '["Triggered when an independent routine execution task needs a real workplace artifact, not a theory answer.","Demonstrates independent routine execution by producing and defending the L2 Learner Progression Execution Release Pack.","Learner can complete the workflow, resolve routine conflicts, and release the output for learner progression decisions using attendance, assessment, and participation evidence and submit a workplace-ready L2 Learner Progression Execution Release Pack."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: Module 1: Learner Progression Workflow Build, Conflict Handling & Final Release Workplace Artifact Build
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-007' LIMIT 1),
  'Module 1: Learner Progression Workflow Build, Conflict Handling & Final Release Workplace Artifact Build',
  'Triggered when an independent routine execution task needs a real workplace artifact, not a theory answer. The learner studies the case, reviews the required data, identifies the gap, creates the artifact, and checks it against evidence fields.',
  1,
  '["Education & Skilling","Formal Education & Lifelong Learning Delivery","IND-CAP-02","L2","Progression rule interpretation","Evidence-based learner routing","Attendance and assessment thresholds","Remediation decision logic","Status tagging"]'::jsonb,
  '["Engage","Explore","Explain","Express","Empower","Evolve","Artifact Build","Evidence Review","AI-Coached Retry"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Case: Learner Progression Workflow Build, Conflict Handling & Final Release
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-007' LIMIT 1)
   AND title = 'Module 1: Learner Progression Workflow Build, Conflict Handling & Final Release Workplace Artifact Build' LIMIT 1),
  'Workplace Case: Learner Progression Workflow Build, Conflict Handling & Final Release',
  'A program office must complete and release the progression decision list for 126 learners at module-end review by the end of the day. The same inputs now have routine conflicts: attendance, assessment marks, project submissions, and remedial records do not match for 31 learners. The learner must update the tracker, resolve normal mismatches, record decisions, and release a clean learner progression work pack. The learner must solve the problem using the given data and produce the required workplace artifact.',
  'Workplace problem: A program office must complete and release the progression decision list for 126 learners at module-end review by the end of the day. The same inputs now have routine conflicts: attendance, assessment marks, project submissions, and remedial records do not match for 31 learners. The learner must update the tracker, resolve normal mismatches, record decisions, and release a clean learner progression work pack. Pressure points: Release pressure: the work must be completed, not only checked. Learner must manage routine mismatches in attendance sheet, assessment scores, project submission tracker, remediation log, progression criteria, mentor comments while keeping status updates clear and on time. Root cause focus: Find whether delay or error comes from workflow sequencing, routine conflict handling, unclear status update, or missing release approval. Major concepts: Progression rule interpretation; Evidence-based learner routing; Attendance and assessment thresholds; Remediation decision logic; Status tagging; Learner handoff note; Workflow sequencing; Routine conflict resolution; Release control. Level focus: workflow execution and release. Required data: attendance sheet, assessment scores, project submission tracker, remediation log, progression criteria, mentor comments Learner activity flow: Engage - Start with the case: 126 learners at module-end review and the visible pain point — attendance, assessment marks, project submissions, and remedial records do not match for 31 learners. Learner identifies who is affected and what could go wrong if the work is delayed or wrong. Explore - Learner studies the source data: attendance sheet, assessment scores, project submission tracker, remediation log, progression criteria, mentor comments. They mark trusted records, missing fields, conflicting entries, and items that need confirmation before using them in the artifact. Explain - Teach the main logic in simple terms: Progression rule interpretation; Evidence-based learner routing; Attendance and assessment thresholds; Remediation decision logic; Status tagging; Learner handoff note; Workflow sequencing; Routine conflict resolution; Release control. Level focus: workflow execution and release. Show how rules, evidence, decisions, and handoff notes connect in this workplace task. Express - Learner produces the L2 Learner Progression Execution Release Pack using the case data, writes decisions in plain English, and shows evidence for each important field instead of giving only a theory answer. Empower - Learner uses AI only as a coach: ask for missing-field checks, clarity prompts, risk questions, and retry suggestions. AI should not create the final artifact for the learner. Evolve - Learner notes what would become harder at L3: more records, more conflicts, less guidance, stronger evidence expectations, and higher decision responsibility. Artifact to submit: L2 Learner Progression Execution Release Pack. L2 Learner Progression Execution Release Pack should contain: work tracker; resolved routine conflicts; updated status fields; release checklist; decision note; final handoff confirmation. Required source data: attendance sheet, assessment scores, project submission tracker, remediation log, progression criteria, mentor comments. Evidence fields: Assess whether routine conflicts were resolved correctly, statuses were updated, decisions were traceable, and the release pack can be used without extra explanation. AI support: AI coach can ask: What source proves this? Which field is missing? What is the risk if this is wrong? Who owns the next action? Learner must answer using the case data, not guesses.',
  1,
  '12 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Ed - School Education
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-007' LIMIT 1),
  'B.Ed - School Education',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Ed - Education Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-007' LIMIT 1),
  'M.Ed - Education Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BA Education
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-007' LIMIT 1),
  'BA Education',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MA Education
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-007' LIMIT 1),
  'MA Education',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Voc Education Operations
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-007' LIMIT 1),
  'B.Voc Education Operations',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Academic Record Activation Workflow Build, Conflict Handling & Final Release
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Academic Record Activation Workflow Build, Conflict Handling & Final Release',
  'COURSE-L2-012',
  'Learner can complete the workflow, resolve routine conflicts, and release the output for learner academic records through eligibility, program-rule, and enrollment verification and submit a workplace-ready L2 Academic Record Activation Execution Release Pack. Workplace scenario: An admissions desk must complete and release the academic record activation file for 180 admitted learners before orientation by the end of the day. The same inputs now have routine conflicts: 24 eligibility documents are missing, 11 program codes are wrong, and fee-status updates are not synced in the ERP. The learner must update the tracker, resolve normal mismatches, record decisions, and release a clean academic record activation work pack. Learner artifact: L2 Academic Record Activation Execution Release Pack. Required data: eligibility documents, program rules, enrollment forms, ID proof, fee-status sheet, ERP fields, approval trail. Evidence: Assess whether routine conflicts were resolved correctly, statuses were updated, decisions were traceable, and the release pack can be used without extra explanation.',
  '12 hours',
  'Active',
  'Formal Education & Lifelong Learning Delivery',
  'technical',
  '["Triggered when an independent routine execution task needs a real workplace artifact, not a theory answer.","Demonstrates independent routine execution by producing and defending the L2 Academic Record Activation Execution Release Pack.","Learner can complete the workflow, resolve routine conflicts, and release the output for learner academic records through eligibility, program-rule, and enrollment verification and submit a workplace-ready L2 Academic Record Activation Execution Release Pack."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: Module 1: Academic Record Activation Workflow Build, Conflict Handling & Final Release Workplace Artifact Build
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-012' LIMIT 1),
  'Module 1: Academic Record Activation Workflow Build, Conflict Handling & Final Release Workplace Artifact Build',
  'Triggered when an independent routine execution task needs a real workplace artifact, not a theory answer. The learner studies the case, reviews the required data, identifies the gap, creates the artifact, and checks it against evidence fields.',
  1,
  '["Education & Skilling","Formal Education & Lifelong Learning Delivery","IND-CAP-03","L2","Eligibility verification","Program-rule mapping","Enrollment status control","ERP field accuracy","Missing-document tracking"]'::jsonb,
  '["Engage","Explore","Explain","Express","Empower","Evolve","Artifact Build","Evidence Review","AI-Coached Retry"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Case: Academic Record Activation Workflow Build, Conflict Handling & Final Release
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-012' LIMIT 1)
   AND title = 'Module 1: Academic Record Activation Workflow Build, Conflict Handling & Final Release Workplace Artifact Build' LIMIT 1),
  'Workplace Case: Academic Record Activation Workflow Build, Conflict Handling & Final Release',
  'An admissions desk must complete and release the academic record activation file for 180 admitted learners before orientation by the end of the day. The same inputs now have routine conflicts: 24 eligibility documents are missing, 11 program codes are wrong, and fee-status updates are not synced in the ERP. The learner must update the tracker, resolve normal mismatches, record decisions, and release a clean academic record activation work pack. The learner must solve the problem using the given data and produce the required workplace artifact.',
  'Workplace problem: An admissions desk must complete and release the academic record activation file for 180 admitted learners before orientation by the end of the day. The same inputs now have routine conflicts: 24 eligibility documents are missing, 11 program codes are wrong, and fee-status updates are not synced in the ERP. The learner must update the tracker, resolve normal mismatches, record decisions, and release a clean academic record activation work pack. Pressure points: Release pressure: the work must be completed, not only checked. Learner must manage routine mismatches in eligibility documents, program rules, enrollment forms, ID proof, fee-status sheet, ERP fields, approval trail while keeping status updates clear and on time. Root cause focus: Find whether delay or error comes from workflow sequencing, routine conflict handling, unclear status update, or missing release approval. Major concepts: Eligibility verification; Program-rule mapping; Enrollment status control; ERP field accuracy; Missing-document tracking; Activation approval handoff; Workflow sequencing; Routine conflict resolution; Release control. Level focus: workflow execution and release. Required data: eligibility documents, program rules, enrollment forms, ID proof, fee-status sheet, ERP fields, approval trail Learner activity flow: Engage - Start with the case: 180 admitted learners before orientation and the visible pain point — 24 eligibility documents are missing, 11 program codes are wrong, and fee-status updates are not synced in the ERP. Learner identifies who is affected and what could go wrong if the work is delayed or wrong. Explore - Learner studies the source data: eligibility documents, program rules, enrollment forms, ID proof, fee-status sheet, ERP fields, approval trail. They mark trusted records, missing fields, conflicting entries, and items that need confirmation before using them in the artifact. Explain - Teach the main logic in simple terms: Eligibility verification; Program-rule mapping; Enrollment status control; ERP field accuracy; Missing-document tracking; Activation approval handoff; Workflow sequencing; Routine conflict resolution; Release control. Level focus: workflow execution and release. Show how rules, evidence, decisions, and handoff notes connect in this workplace task. Express - Learner produces the L2 Academic Record Activation Execution Release Pack using the case data, writes decisions in plain English, and shows evidence for each important field instead of giving only a theory answer. Empower - Learner uses AI only as a coach: ask for missing-field checks, clarity prompts, risk questions, and retry suggestions. AI should not create the final artifact for the learner. Evolve - Learner notes what would become harder at L3: more records, more conflicts, less guidance, stronger evidence expectations, and higher decision responsibility. Artifact to submit: L2 Academic Record Activation Execution Release Pack. L2 Academic Record Activation Execution Release Pack should contain: work tracker; resolved routine conflicts; updated status fields; release checklist; decision note; final handoff confirmation. Required source data: eligibility documents, program rules, enrollment forms, ID proof, fee-status sheet, ERP fields, approval trail. Evidence fields: Assess whether routine conflicts were resolved correctly, statuses were updated, decisions were traceable, and the release pack can be used without extra explanation. AI support: AI coach can ask: What source proves this? Which field is missing? What is the risk if this is wrong? Who owns the next action? Learner must answer using the case data, not guesses.',
  1,
  '12 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BBA Education Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-012' LIMIT 1),
  'BBA Education Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Com - Education Administration
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-012' LIMIT 1),
  'B.Com - Education Administration',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BA Public Administration
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-012' LIMIT 1),
  'BA Public Administration',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MBA Education Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-012' LIMIT 1),
  'MBA Education Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PG Diploma Higher Education Administration
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-012' LIMIT 1),
  'PG Diploma Higher Education Administration',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Adult Learner Pathway Workflow Build, Conflict Handling & Final Release
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Adult Learner Pathway Workflow Build, Conflict Handling & Final Release',
  'COURSE-L2-017',
  'Learner can complete the workflow, resolve routine conflicts, and release the output for adult learner pathways from goals, prior learning, access constraints, and progress evidence and submit a workplace-ready L2 Adult Learner Pathway Execution Release Pack. Workplace scenario: A lifelong learning centre must complete and release the adult learner pathway plan for 64 working adult learners by the end of the day. The same inputs now have routine conflicts: learners have mixed prior learning, different shift timings, low device access, and unclear career goals. The learner must update the tracker, resolve normal mismatches, record decisions, and release a clean adult learner pathway work pack. Learner artifact: L2 Adult Learner Pathway Execution Release Pack. Required data: learner goal form, prior learning proof, schedule constraints, device/access survey, language comfort data, course options. Evidence: Assess whether routine conflicts were resolved correctly, statuses were updated, decisions were traceable, and the release pack can be used without extra explanation.',
  '12 hours',
  'Active',
  'Formal Education & Lifelong Learning Delivery',
  'soft',
  '["Triggered when an independent routine execution task needs a real workplace artifact, not a theory answer.","Demonstrates independent routine execution by producing and defending the L2 Adult Learner Pathway Execution Release Pack.","Learner can complete the workflow, resolve routine conflicts, and release the output for adult learner pathways from goals, prior learning, access constraints, and progress evidence and submit a workplace-ready L2 Adult Learner Pathway Execution Release Pack."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: Module 1: Adult Learner Pathway Workflow Build, Conflict Handling & Final Release Workplace Artifact Build
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-017' LIMIT 1),
  'Module 1: Adult Learner Pathway Workflow Build, Conflict Handling & Final Release Workplace Artifact Build',
  'Triggered when an independent routine execution task needs a real workplace artifact, not a theory answer. The learner studies the case, reviews the required data, identifies the gap, creates the artifact, and checks it against evidence fields.',
  1,
  '["Education & Skilling","Formal Education & Lifelong Learning Delivery","IND-CAP-04","L2","Recognition of prior learning","Flexible pathway planning","Access constraint mapping","Adult motivation factors","Goal-to-course alignment"]'::jsonb,
  '["Engage","Explore","Explain","Express","Empower","Evolve","Artifact Build","Evidence Review","AI-Coached Retry"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Case: Adult Learner Pathway Workflow Build, Conflict Handling & Final Release
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-017' LIMIT 1)
   AND title = 'Module 1: Adult Learner Pathway Workflow Build, Conflict Handling & Final Release Workplace Artifact Build' LIMIT 1),
  'Workplace Case: Adult Learner Pathway Workflow Build, Conflict Handling & Final Release',
  'A lifelong learning centre must complete and release the adult learner pathway plan for 64 working adult learners by the end of the day. The same inputs now have routine conflicts: learners have mixed prior learning, different shift timings, low device access, and unclear career goals. The learner must update the tracker, resolve normal mismatches, record decisions, and release a clean adult learner pathway work pack. The learner must solve the problem using the given data and produce the required workplace artifact.',
  'Workplace problem: A lifelong learning centre must complete and release the adult learner pathway plan for 64 working adult learners by the end of the day. The same inputs now have routine conflicts: learners have mixed prior learning, different shift timings, low device access, and unclear career goals. The learner must update the tracker, resolve normal mismatches, record decisions, and release a clean adult learner pathway work pack. Pressure points: Release pressure: the work must be completed, not only checked. Learner must manage routine mismatches in learner goal form, prior learning proof, schedule constraints, device/access survey, language comfort data, course options while keeping status updates clear and on time. Root cause focus: Find whether delay or error comes from workflow sequencing, routine conflict handling, unclear status update, or missing release approval. Major concepts: Recognition of prior learning; Flexible pathway planning; Access constraint mapping; Adult motivation factors; Goal-to-course alignment; Support routing; Workflow sequencing; Routine conflict resolution; Release control. Level focus: workflow execution and release. Required data: learner goal form, prior learning proof, schedule constraints, device/access survey, language comfort data, course options Learner activity flow: Engage - Start with the case: 64 working adult learners and the visible pain point — learners have mixed prior learning, different shift timings, low device access, and unclear career goals. Learner identifies who is affected and what could go wrong if the work is delayed or wrong. Explore - Learner studies the source data: learner goal form, prior learning proof, schedule constraints, device/access survey, language comfort data, course options. They mark trusted records, missing fields, conflicting entries, and items that need confirmation before using them in the artifact. Explain - Teach the main logic in simple terms: Recognition of prior learning; Flexible pathway planning; Access constraint mapping; Adult motivation factors; Goal-to-course alignment; Support routing; Workflow sequencing; Routine conflict resolution; Release control. Level focus: workflow execution and release. Show how rules, evidence, decisions, and handoff notes connect in this workplace task. Express - Learner produces the L2 Adult Learner Pathway Execution Release Pack using the case data, writes decisions in plain English, and shows evidence for each important field instead of giving only a theory answer. Empower - Learner uses AI only as a coach: ask for missing-field checks, clarity prompts, risk questions, and retry suggestions. AI should not create the final artifact for the learner. Evolve - Learner notes what would become harder at L3: more records, more conflicts, less guidance, stronger evidence expectations, and higher decision responsibility. Artifact to submit: L2 Adult Learner Pathway Execution Release Pack. L2 Adult Learner Pathway Execution Release Pack should contain: work tracker; resolved routine conflicts; updated status fields; release checklist; decision note; final handoff confirmation. Required source data: learner goal form, prior learning proof, schedule constraints, device/access survey, language comfort data, course options. Evidence fields: Assess whether routine conflicts were resolved correctly, statuses were updated, decisions were traceable, and the release pack can be used without extra explanation. AI support: AI coach can ask: What source proves this? Which field is missing? What is the risk if this is wrong? Who owns the next action? Learner must answer using the case data, not guesses.',
  1,
  '12 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BA Education
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-017' LIMIT 1),
  'BA Education',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MA Adult Education
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-017' LIMIT 1),
  'MA Adult Education',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BSW - Community Education
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-017' LIMIT 1),
  'BSW - Community Education',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Voc Skill Development
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-017' LIMIT 1),
  'B.Voc Skill Development',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PG Diploma Lifelong Learning
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-017' LIMIT 1),
  'PG Diploma Lifelong Learning',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Curriculum Mapping Workflow Build, Conflict Handling & Final Release
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Curriculum Mapping Workflow Build, Conflict Handling & Final Release',
  'COURSE-L2-022',
  'Learner can complete the workflow, resolve routine conflicts, and release the output for translate standards and role outcomes into curriculum maps, learning sequences, and alignment boundaries and submit a workplace-ready L2 Curriculum Mapping Execution Release Pack. Workplace scenario: An academic department must complete and release the curriculum outcome alignment map for 6 modules and 42 lesson activities by the end of the day. The same inputs now have routine conflicts: learning outcomes, activities, assessments, and workplace evidence do not clearly connect. The learner must update the tracker, resolve normal mismatches, record decisions, and release a clean curriculum mapping work pack. Learner artifact: L2 Curriculum Mapping Execution Release Pack. Required data: syllabus, module outcomes, activity list, assessment plan, competency requirements, evidence expectations. Evidence: Assess whether routine conflicts were resolved correctly, statuses were updated, decisions were traceable, and the release pack can be used without extra explanation.',
  '12 hours',
  'Active',
  'Curriculum, Pedagogy & Learning Design',
  'technical',
  '["Triggered when an independent routine execution task needs a real workplace artifact, not a theory answer.","Demonstrates independent routine execution by producing and defending the L2 Curriculum Mapping Execution Release Pack.","Learner can complete the workflow, resolve routine conflicts, and release the output for translate standards and role outcomes into curriculum maps, learning sequences, and alignment boundaries and submit a workplace-ready L2 Curriculum Mapping Execution Release Pack."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: Module 1: Curriculum Mapping Workflow Build, Conflict Handling & Final Release Workplace Artifact Build
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-022' LIMIT 1),
  'Module 1: Curriculum Mapping Workflow Build, Conflict Handling & Final Release Workplace Artifact Build',
  'Triggered when an independent routine execution task needs a real workplace artifact, not a theory answer. The learner studies the case, reviews the required data, identifies the gap, creates the artifact, and checks it against evidence fields.',
  1,
  '["Education & Skilling","Curriculum, Pedagogy & Learning Design","IND-CAP-05","L2","Outcome mapping","Constructive alignment","Competency-to-activity link","Assessment coverage check","Gap identification"]'::jsonb,
  '["Engage","Explore","Explain","Express","Empower","Evolve","Artifact Build","Evidence Review","AI-Coached Retry"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Case: Curriculum Mapping Workflow Build, Conflict Handling & Final Release
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-022' LIMIT 1)
   AND title = 'Module 1: Curriculum Mapping Workflow Build, Conflict Handling & Final Release Workplace Artifact Build' LIMIT 1),
  'Workplace Case: Curriculum Mapping Workflow Build, Conflict Handling & Final Release',
  'An academic department must complete and release the curriculum outcome alignment map for 6 modules and 42 lesson activities by the end of the day. The same inputs now have routine conflicts: learning outcomes, activities, assessments, and workplace evidence do not clearly connect. The learner must update the tracker, resolve normal mismatches, record decisions, and release a clean curriculum mapping work pack. The learner must solve the problem using the given data and produce the required workplace artifact.',
  'Workplace problem: An academic department must complete and release the curriculum outcome alignment map for 6 modules and 42 lesson activities by the end of the day. The same inputs now have routine conflicts: learning outcomes, activities, assessments, and workplace evidence do not clearly connect. The learner must update the tracker, resolve normal mismatches, record decisions, and release a clean curriculum mapping work pack. Pressure points: Release pressure: the work must be completed, not only checked. Learner must manage routine mismatches in syllabus, module outcomes, activity list, assessment plan, competency requirements, evidence expectations while keeping status updates clear and on time. Root cause focus: Find whether delay or error comes from workflow sequencing, routine conflict handling, unclear status update, or missing release approval. Major concepts: Outcome mapping; Constructive alignment; Competency-to-activity link; Assessment coverage check; Gap identification; Curriculum evidence map; Workflow sequencing; Routine conflict resolution; Release control. Level focus: workflow execution and release. Required data: syllabus, module outcomes, activity list, assessment plan, competency requirements, evidence expectations Learner activity flow: Engage - Start with the case: 6 modules and 42 lesson activities and the visible pain point — learning outcomes, activities, assessments, and workplace evidence do not clearly connect. Learner identifies who is affected and what could go wrong if the work is delayed or wrong. Explore - Learner studies the source data: syllabus, module outcomes, activity list, assessment plan, competency requirements, evidence expectations. They mark trusted records, missing fields, conflicting entries, and items that need confirmation before using them in the artifact. Explain - Teach the main logic in simple terms: Outcome mapping; Constructive alignment; Competency-to-activity link; Assessment coverage check; Gap identification; Curriculum evidence map; Workflow sequencing; Routine conflict resolution; Release control. Level focus: workflow execution and release. Show how rules, evidence, decisions, and handoff notes connect in this workplace task. Express - Learner produces the L2 Curriculum Mapping Execution Release Pack using the case data, writes decisions in plain English, and shows evidence for each important field instead of giving only a theory answer. Empower - Learner uses AI only as a coach: ask for missing-field checks, clarity prompts, risk questions, and retry suggestions. AI should not create the final artifact for the learner. Evolve - Learner notes what would become harder at L3: more records, more conflicts, less guidance, stronger evidence expectations, and higher decision responsibility. Artifact to submit: L2 Curriculum Mapping Execution Release Pack. L2 Curriculum Mapping Execution Release Pack should contain: work tracker; resolved routine conflicts; updated status fields; release checklist; decision note; final handoff confirmation. Required source data: syllabus, module outcomes, activity list, assessment plan, competency requirements, evidence expectations. Evidence fields: Assess whether routine conflicts were resolved correctly, statuses were updated, decisions were traceable, and the release pack can be used without extra explanation. AI support: AI coach can ask: What source proves this? Which field is missing? What is the risk if this is wrong? Who owns the next action? Learner must answer using the case data, not guesses.',
  1,
  '12 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Ed - Curriculum Studies
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-022' LIMIT 1),
  'B.Ed - Curriculum Studies',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Ed - Curriculum and Instruction
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-022' LIMIT 1),
  'M.Ed - Curriculum and Instruction',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BA Education
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-022' LIMIT 1),
  'BA Education',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MA Education
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-022' LIMIT 1),
  'MA Education',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PG Diploma Instructional Design
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-022' LIMIT 1),
  'PG Diploma Instructional Design',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: e-learning Content Release Workflow Build, Conflict Handling & Final Release
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'e-learning Content Release Workflow Build, Conflict Handling & Final Release',
  'COURSE-L2-027',
  'Learner can complete the workflow, resolve routine conflicts, and release the output for release e-learning content through storyboard, asset, accessibility, and qa controls and submit a workplace-ready L2 e-learning Content Release Execution Release Pack. Workplace scenario: A online course team must complete and release the digital content release checklist for 38 digital learning assets for a 4-week course by the end of the day. The same inputs now have routine conflicts: video links, captions, quiz rules, file versions, and mobile previews are inconsistent before launch. The learner must update the tracker, resolve normal mismatches, record decisions, and release a clean e-learning content release work pack. Learner artifact: L2 e-learning Content Release Execution Release Pack. Required data: content inventory, LMS upload list, video links, caption files, quiz settings, version tracker, QA checklist. Evidence: Assess whether routine conflicts were resolved correctly, statuses were updated, decisions were traceable, and the release pack can be used without extra explanation.',
  '12 hours',
  'Active',
  'Curriculum, Pedagogy & Learning Design',
  'technical',
  '["Triggered when an independent routine execution task needs a real workplace artifact, not a theory answer.","Demonstrates independent routine execution by producing and defending the L2 e-Learning Content Release Execution Release Pack.","Learner can complete the workflow, resolve routine conflicts, and release the output for release e-learning content through storyboard, asset, accessibility, and qa controls and submit a workplace-ready L2 e-Learning Content Release Execution Release Pack."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: Module 1: e-learning Content Release Workflow Build, Conflict Handling & Final Release Workplace Artifact Build
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-027' LIMIT 1),
  'Module 1: e-learning Content Release Workflow Build, Conflict Handling & Final Release Workplace Artifact Build',
  'Triggered when an independent routine execution task needs a real workplace artifact, not a theory answer. The learner studies the case, reviews the required data, identifies the gap, creates the artifact, and checks it against evidence fields.',
  1,
  '["Education & Skilling","Curriculum, Pedagogy & Learning Design","IND-CAP-06","L2","Digital asset readiness","Version control","Accessibility check","LMS content sequencing","Quiz rule validation"]'::jsonb,
  '["Engage","Explore","Explain","Express","Empower","Evolve","Artifact Build","Evidence Review","AI-Coached Retry"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Case: e-learning Content Release Workflow Build, Conflict Handling & Final Release
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-027' LIMIT 1)
   AND title = 'Module 1: e-learning Content Release Workflow Build, Conflict Handling & Final Release Workplace Artifact Build' LIMIT 1),
  'Workplace Case: e-learning Content Release Workflow Build, Conflict Handling & Final Release',
  'A online course team must complete and release the digital content release checklist for 38 digital learning assets for a 4-week course by the end of the day. The same inputs now have routine conflicts: video links, captions, quiz rules, file versions, and mobile previews are inconsistent before launch. The learner must update the tracker, resolve normal mismatches, record decisions, and release a clean e-learning content release work pack. The learner must solve the problem using the given data and produce the required workplace artifact.',
  'Workplace problem: A online course team must complete and release the digital content release checklist for 38 digital learning assets for a 4-week course by the end of the day. The same inputs now have routine conflicts: video links, captions, quiz rules, file versions, and mobile previews are inconsistent before launch. The learner must update the tracker, resolve normal mismatches, record decisions, and release a clean e-learning content release work pack. Pressure points: Release pressure: the work must be completed, not only checked. Learner must manage routine mismatches in content inventory, LMS upload list, video links, caption files, quiz settings, version tracker, QA checklist while keeping status updates clear and on time. Root cause focus: Find whether delay or error comes from workflow sequencing, routine conflict handling, unclear status update, or missing release approval. Major concepts: Digital asset readiness; Version control; Accessibility check; LMS content sequencing; Quiz rule validation; Release sign-off; Workflow sequencing; Routine conflict resolution; Release control. Level focus: workflow execution and release. Required data: content inventory, LMS upload list, video links, caption files, quiz settings, version tracker, QA checklist Learner activity flow: Engage - Start with the case: 38 digital learning assets for a 4-week course and the visible pain point — video links, captions, quiz rules, file versions, and mobile previews are inconsistent before launch. Learner identifies who is affected and what could go wrong if the work is delayed or wrong. Explore - Learner studies the source data: content inventory, LMS upload list, video links, caption files, quiz settings, version tracker, QA checklist. They mark trusted records, missing fields, conflicting entries, and items that need confirmation before using them in the artifact. Explain - Teach the main logic in simple terms: Digital asset readiness; Version control; Accessibility check; LMS content sequencing; Quiz rule validation; Release sign-off; Workflow sequencing; Routine conflict resolution; Release control. Level focus: workflow execution and release. Show how rules, evidence, decisions, and handoff notes connect in this workplace task. Express - Learner produces the L2 e-learning Content Release Execution Release Pack using the case data, writes decisions in plain English, and shows evidence for each important field instead of giving only a theory answer. Empower - Learner uses AI only as a coach: ask for missing-field checks, clarity prompts, risk questions, and retry suggestions. AI should not create the final artifact for the learner. Evolve - Learner notes what would become harder at L3: more records, more conflicts, less guidance, stronger evidence expectations, and higher decision responsibility. Artifact to submit: L2 e-learning Content Release Execution Release Pack. L2 e-learning Content Release Execution Release Pack should contain: work tracker; resolved routine conflicts; updated status fields; release checklist; decision note; final handoff confirmation. Required source data: content inventory, LMS upload list, video links, caption files, quiz settings, version tracker, QA checklist. Evidence fields: Assess whether routine conflicts were resolved correctly, statuses were updated, decisions were traceable, and the release pack can be used without extra explanation. AI support: AI coach can ask: What source proves this? Which field is missing? What is the risk if this is wrong? Who owns the next action? Learner must answer using the case data, not guesses.',
  1,
  '12 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Ed - Digital Pedagogy
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-027' LIMIT 1),
  'B.Ed - Digital Pedagogy',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Ed - Educational Technology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-027' LIMIT 1),
  'M.Ed - Educational Technology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BCA
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-027' LIMIT 1),
  'BCA',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc IT
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-027' LIMIT 1),
  'B.Sc IT',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PG Diploma Instructional Design
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-027' LIMIT 1),
  'PG Diploma Instructional Design',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Teacher Development Workflow Build, Conflict Handling & Final Release
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Teacher Development Workflow Build, Conflict Handling & Final Release',
  'COURSE-L2-032',
  'Learner can complete the workflow, resolve routine conflicts, and release the output for and facilitate teacher development interventions linked to classroom practice gaps and submit a workplace-ready L2 Teacher Development Execution Release Pack. Workplace scenario: A faculty development cell must complete and release the teacher development session plan for 32 teachers attending a classroom strategy workshop by the end of the day. The same inputs now have routine conflicts: teacher needs, session objectives, practice activities, and feedback tools are not aligned. The learner must update the tracker, resolve normal mismatches, record decisions, and release a clean teacher development work pack. Learner artifact: L2 Teacher Development Execution Release Pack. Required data: teacher needs survey, observation notes, session agenda, practice task sheet, feedback form, attendance list. Evidence: Assess whether routine conflicts were resolved correctly, statuses were updated, decisions were traceable, and the release pack can be used without extra explanation.',
  '12 hours',
  'Active',
  'Curriculum, Pedagogy & Learning Design',
  'soft',
  '["Triggered when an independent routine execution task needs a real workplace artifact, not a theory answer.","Demonstrates independent routine execution by producing and defending the L2 Teacher Development Execution Release Pack.","Learner can complete the workflow, resolve routine conflicts, and release the output for and facilitate teacher development interventions linked to classroom practice gaps and submit a workplace-ready L2 Teacher Development Execution Release Pack."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: Module 1: Teacher Development Workflow Build, Conflict Handling & Final Release Workplace Artifact Build
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-032' LIMIT 1),
  'Module 1: Teacher Development Workflow Build, Conflict Handling & Final Release Workplace Artifact Build',
  'Triggered when an independent routine execution task needs a real workplace artifact, not a theory answer. The learner studies the case, reviews the required data, identifies the gap, creates the artifact, and checks it against evidence fields.',
  1,
  '["Education & Skilling","Curriculum, Pedagogy & Learning Design","IND-CAP-07","L2","Teacher needs analysis","Training objective design","Practice-based facilitation","Observation evidence","Feedback loop"]'::jsonb,
  '["Engage","Explore","Explain","Express","Empower","Evolve","Artifact Build","Evidence Review","AI-Coached Retry"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Case: Teacher Development Workflow Build, Conflict Handling & Final Release
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-032' LIMIT 1)
   AND title = 'Module 1: Teacher Development Workflow Build, Conflict Handling & Final Release Workplace Artifact Build' LIMIT 1),
  'Workplace Case: Teacher Development Workflow Build, Conflict Handling & Final Release',
  'A faculty development cell must complete and release the teacher development session plan for 32 teachers attending a classroom strategy workshop by the end of the day. The same inputs now have routine conflicts: teacher needs, session objectives, practice activities, and feedback tools are not aligned. The learner must update the tracker, resolve normal mismatches, record decisions, and release a clean teacher development work pack. The learner must solve the problem using the given data and produce the required workplace artifact.',
  'Workplace problem: A faculty development cell must complete and release the teacher development session plan for 32 teachers attending a classroom strategy workshop by the end of the day. The same inputs now have routine conflicts: teacher needs, session objectives, practice activities, and feedback tools are not aligned. The learner must update the tracker, resolve normal mismatches, record decisions, and release a clean teacher development work pack. Pressure points: Release pressure: the work must be completed, not only checked. Learner must manage routine mismatches in teacher needs survey, observation notes, session agenda, practice task sheet, feedback form, attendance list while keeping status updates clear and on time. Root cause focus: Find whether delay or error comes from workflow sequencing, routine conflict handling, unclear status update, or missing release approval. Major concepts: Teacher needs analysis; Training objective design; Practice-based facilitation; Observation evidence; Feedback loop; Follow-up coaching; Workflow sequencing; Routine conflict resolution; Release control. Level focus: workflow execution and release. Required data: teacher needs survey, observation notes, session agenda, practice task sheet, feedback form, attendance list Learner activity flow: Engage - Start with the case: 32 teachers attending a classroom strategy workshop and the visible pain point — teacher needs, session objectives, practice activities, and feedback tools are not aligned. Learner identifies who is affected and what could go wrong if the work is delayed or wrong. Explore - Learner studies the source data: teacher needs survey, observation notes, session agenda, practice task sheet, feedback form, attendance list. They mark trusted records, missing fields, conflicting entries, and items that need confirmation before using them in the artifact. Explain - Teach the main logic in simple terms: Teacher needs analysis; Training objective design; Practice-based facilitation; Observation evidence; Feedback loop; Follow-up coaching; Workflow sequencing; Routine conflict resolution; Release control. Level focus: workflow execution and release. Show how rules, evidence, decisions, and handoff notes connect in this workplace task. Express - Learner produces the L2 Teacher Development Execution Release Pack using the case data, writes decisions in plain English, and shows evidence for each important field instead of giving only a theory answer. Empower - Learner uses AI only as a coach: ask for missing-field checks, clarity prompts, risk questions, and retry suggestions. AI should not create the final artifact for the learner. Evolve - Learner notes what would become harder at L3: more records, more conflicts, less guidance, stronger evidence expectations, and higher decision responsibility. Artifact to submit: L2 Teacher Development Execution Release Pack. L2 Teacher Development Execution Release Pack should contain: work tracker; resolved routine conflicts; updated status fields; release checklist; decision note; final handoff confirmation. Required source data: teacher needs survey, observation notes, session agenda, practice task sheet, feedback form, attendance list. Evidence fields: Assess whether routine conflicts were resolved correctly, statuses were updated, decisions were traceable, and the release pack can be used without extra explanation. AI support: AI coach can ask: What source proves this? Which field is missing? What is the risk if this is wrong? Who owns the next action? Learner must answer using the case data, not guesses.',
  1,
  '12 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Ed - Teacher Education
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-032' LIMIT 1),
  'B.Ed - Teacher Education',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Ed - Teacher Development
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-032' LIMIT 1),
  'M.Ed - Teacher Development',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MA Education
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-032' LIMIT 1),
  'MA Education',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PG Diploma Faculty Development
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-032' LIMIT 1),
  'PG Diploma Faculty Development',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PG Diploma Educational Leadership
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-032' LIMIT 1),
  'PG Diploma Educational Leadership',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: STEAM Maker-Lab Project Cycle Workflow Build, Conflict Handling & Final Release
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'STEAM Maker-Lab Project Cycle Workflow Build, Conflict Handling & Final Release',
  'COURSE-L2-037',
  'Learner can complete the workflow, resolve routine conflicts, and release the output for convert steam project goals into safe, resourced maker-lab learning cycles and submit a workplace-ready L2 STEAM Maker-Lab Project Cycle Execution Release Pack. Workplace scenario: A school maker lab must complete and release the STEAM project readiness file for 5 project teams using 3 shared lab zones by the end of the day. The same inputs now have routine conflicts: materials, safety rules, mentor time, and project milestones are unclear before the lab cycle starts. The learner must update the tracker, resolve normal mismatches, record decisions, and release a clean steam maker-lab project work pack. Learner artifact: L2 STEAM Maker-Lab Project Cycle Execution Release Pack. Required data: project brief, material list, safety checklist, lab schedule, mentor roster, team list, milestone tracker. Evidence: Assess whether routine conflicts were resolved correctly, statuses were updated, decisions were traceable, and the release pack can be used without extra explanation.',
  '12 hours',
  'Active',
  'Curriculum, Pedagogy & Learning Design',
  'technical',
  '["Triggered when an independent routine execution task needs a real workplace artifact, not a theory answer.","Demonstrates independent routine execution by producing and defending the L2 STEAM Maker-Lab Project Cycle Execution Release Pack.","Learner can complete the workflow, resolve routine conflicts, and release the output for convert steam project goals into safe, resourced maker-lab learning cycles and submit a workplace-ready L2 STEAM Maker-Lab Project Cycle Execution Release Pack."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: Module 1: STEAM Maker-Lab Project Cycle Workflow Build, Conflict Handling & Final Release Workplace Artifact Build
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-037' LIMIT 1),
  'Module 1: STEAM Maker-Lab Project Cycle Workflow Build, Conflict Handling & Final Release Workplace Artifact Build',
  'Triggered when an independent routine execution task needs a real workplace artifact, not a theory answer. The learner studies the case, reviews the required data, identifies the gap, creates the artifact, and checks it against evidence fields.',
  1,
  '["Education & Skilling","Curriculum, Pedagogy & Learning Design","IND-CAP-08","L2","Project cycle planning","Lab safety control","Material readiness","Mentor scheduling","Milestone tracking"]'::jsonb,
  '["Engage","Explore","Explain","Express","Empower","Evolve","Artifact Build","Evidence Review","AI-Coached Retry"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Case: STEAM Maker-Lab Project Cycle Workflow Build, Conflict Handling & Final Release
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-037' LIMIT 1)
   AND title = 'Module 1: STEAM Maker-Lab Project Cycle Workflow Build, Conflict Handling & Final Release Workplace Artifact Build' LIMIT 1),
  'Workplace Case: STEAM Maker-Lab Project Cycle Workflow Build, Conflict Handling & Final Release',
  'A school maker lab must complete and release the STEAM project readiness file for 5 project teams using 3 shared lab zones by the end of the day. The same inputs now have routine conflicts: materials, safety rules, mentor time, and project milestones are unclear before the lab cycle starts. The learner must update the tracker, resolve normal mismatches, record decisions, and release a clean steam maker-lab project work pack. The learner must solve the problem using the given data and produce the required workplace artifact.',
  'Workplace problem: A school maker lab must complete and release the STEAM project readiness file for 5 project teams using 3 shared lab zones by the end of the day. The same inputs now have routine conflicts: materials, safety rules, mentor time, and project milestones are unclear before the lab cycle starts. The learner must update the tracker, resolve normal mismatches, record decisions, and release a clean steam maker-lab project work pack. Pressure points: Release pressure: the work must be completed, not only checked. Learner must manage routine mismatches in project brief, material list, safety checklist, lab schedule, mentor roster, team list, milestone tracker while keeping status updates clear and on time. Root cause focus: Find whether delay or error comes from workflow sequencing, routine conflict handling, unclear status update, or missing release approval. Major concepts: Project cycle planning; Lab safety control; Material readiness; Mentor scheduling; Milestone tracking; Student collaboration evidence; Workflow sequencing; Routine conflict resolution; Release control. Level focus: workflow execution and release. Required data: project brief, material list, safety checklist, lab schedule, mentor roster, team list, milestone tracker Learner activity flow: Engage - Start with the case: 5 project teams using 3 shared lab zones and the visible pain point — materials, safety rules, mentor time, and project milestones are unclear before the lab cycle starts. Learner identifies who is affected and what could go wrong if the work is delayed or wrong. Explore - Learner studies the source data: project brief, material list, safety checklist, lab schedule, mentor roster, team list, milestone tracker. They mark trusted records, missing fields, conflicting entries, and items that need confirmation before using them in the artifact. Explain - Teach the main logic in simple terms: Project cycle planning; Lab safety control; Material readiness; Mentor scheduling; Milestone tracking; Student collaboration evidence; Workflow sequencing; Routine conflict resolution; Release control. Level focus: workflow execution and release. Show how rules, evidence, decisions, and handoff notes connect in this workplace task. Express - Learner produces the L2 STEAM Maker-Lab Project Cycle Execution Release Pack using the case data, writes decisions in plain English, and shows evidence for each important field instead of giving only a theory answer. Empower - Learner uses AI only as a coach: ask for missing-field checks, clarity prompts, risk questions, and retry suggestions. AI should not create the final artifact for the learner. Evolve - Learner notes what would become harder at L3: more records, more conflicts, less guidance, stronger evidence expectations, and higher decision responsibility. Artifact to submit: L2 STEAM Maker-Lab Project Cycle Execution Release Pack. L2 STEAM Maker-Lab Project Cycle Execution Release Pack should contain: work tracker; resolved routine conflicts; updated status fields; release checklist; decision note; final handoff confirmation. Required source data: project brief, material list, safety checklist, lab schedule, mentor roster, team list, milestone tracker. Evidence fields: Assess whether routine conflicts were resolved correctly, statuses were updated, decisions were traceable, and the release pack can be used without extra explanation. AI support: AI coach can ask: What source proves this? Which field is missing? What is the risk if this is wrong? Who owns the next action? Learner must answer using the case data, not guesses.',
  1,
  '12 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Ed - Science Education
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-037' LIMIT 1),
  'B.Ed - Science Education',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Science Education
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-037' LIMIT 1),
  'B.Sc Science Education',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Tech - STEM Education Support
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-037' LIMIT 1),
  'B.Tech - STEM Education Support',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Voc Maker-Lab Facilitation
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-037' LIMIT 1),
  'B.Voc Maker-Lab Facilitation',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PG Diploma Experiential Learning
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-037' LIMIT 1),
  'PG Diploma Experiential Learning',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Vocational Batch Alignment Workflow Build, Conflict Handling & Final Release
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Vocational Batch Alignment Workflow Build, Conflict Handling & Final Release',
  'COURSE-L2-042',
  'Learner can complete the workflow, resolve routine conflicts, and release the output for align vocational batches to qualification packs, trainer readiness, and assessment requirements and submit a workplace-ready L2 Vocational Batch Alignment Execution Release Pack. Workplace scenario: A skill training centre must complete and release the vocational batch alignment file for 92 learners in a job-role batch by the end of the day. The same inputs now have routine conflicts: qualification-pack outcomes, trainer availability, tools, practice hours, and assessment windows do not match. The learner must update the tracker, resolve normal mismatches, record decisions, and release a clean vocational batch alignment work pack. Learner artifact: L2 Vocational Batch Alignment Execution Release Pack. Required data: qualification pack, trainer roster, equipment list, batch profile, practice-hour plan, assessment schedule. Evidence: Assess whether routine conflicts were resolved correctly, statuses were updated, decisions were traceable, and the release pack can be used without extra explanation.',
  '12 hours',
  'Active',
  'Skilling, Employability & Work-Integrated Learning',
  'technical',
  '["Triggered when an independent routine execution task needs a real workplace artifact, not a theory answer.","Demonstrates independent routine execution by producing and defending the L2 Vocational Batch Alignment Execution Release Pack.","Learner can complete the workflow, resolve routine conflicts, and release the output for align vocational batches to qualification packs, trainer readiness, and assessment requirements and submit a workplace-ready L2 Vocational Batch Alignment Execution Release Pack."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: Module 1: Vocational Batch Alignment Workflow Build, Conflict Handling & Final Release Workplace Artifact Build
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-042' LIMIT 1),
  'Module 1: Vocational Batch Alignment Workflow Build, Conflict Handling & Final Release Workplace Artifact Build',
  'Triggered when an independent routine execution task needs a real workplace artifact, not a theory answer. The learner studies the case, reviews the required data, identifies the gap, creates the artifact, and checks it against evidence fields.',
  1,
  '["Education & Skilling","Skilling, Employability & Work-Integrated Learning","IND-CAP-09","L2","Qualification-pack interpretation","Batch-to-outcome mapping","Trainer readiness","Equipment and practice-hour planning","Assessment requirement check"]'::jsonb,
  '["Engage","Explore","Explain","Express","Empower","Evolve","Artifact Build","Evidence Review","AI-Coached Retry"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Case: Vocational Batch Alignment Workflow Build, Conflict Handling & Final Release
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-042' LIMIT 1)
   AND title = 'Module 1: Vocational Batch Alignment Workflow Build, Conflict Handling & Final Release Workplace Artifact Build' LIMIT 1),
  'Workplace Case: Vocational Batch Alignment Workflow Build, Conflict Handling & Final Release',
  'A skill training centre must complete and release the vocational batch alignment file for 92 learners in a job-role batch by the end of the day. The same inputs now have routine conflicts: qualification-pack outcomes, trainer availability, tools, practice hours, and assessment windows do not match. The learner must update the tracker, resolve normal mismatches, record decisions, and release a clean vocational batch alignment work pack. The learner must solve the problem using the given data and produce the required workplace artifact.',
  'Workplace problem: A skill training centre must complete and release the vocational batch alignment file for 92 learners in a job-role batch by the end of the day. The same inputs now have routine conflicts: qualification-pack outcomes, trainer availability, tools, practice hours, and assessment windows do not match. The learner must update the tracker, resolve normal mismatches, record decisions, and release a clean vocational batch alignment work pack. Pressure points: Release pressure: the work must be completed, not only checked. Learner must manage routine mismatches in qualification pack, trainer roster, equipment list, batch profile, practice-hour plan, assessment schedule while keeping status updates clear and on time. Root cause focus: Find whether delay or error comes from workflow sequencing, routine conflict handling, unclear status update, or missing release approval. Major concepts: Qualification-pack interpretation; Batch-to-outcome mapping; Trainer readiness; Equipment and practice-hour planning; Assessment requirement check; Compliance handoff; Workflow sequencing; Routine conflict resolution; Release control. Level focus: workflow execution and release. Required data: qualification pack, trainer roster, equipment list, batch profile, practice-hour plan, assessment schedule Learner activity flow: Engage - Start with the case: 92 learners in a job-role batch and the visible pain point — qualification-pack outcomes, trainer availability, tools, practice hours, and assessment windows do not match. Learner identifies who is affected and what could go wrong if the work is delayed or wrong. Explore - Learner studies the source data: qualification pack, trainer roster, equipment list, batch profile, practice-hour plan, assessment schedule. They mark trusted records, missing fields, conflicting entries, and items that need confirmation before using them in the artifact. Explain - Teach the main logic in simple terms: Qualification-pack interpretation; Batch-to-outcome mapping; Trainer readiness; Equipment and practice-hour planning; Assessment requirement check; Compliance handoff; Workflow sequencing; Routine conflict resolution; Release control. Level focus: workflow execution and release. Show how rules, evidence, decisions, and handoff notes connect in this workplace task. Express - Learner produces the L2 Vocational Batch Alignment Execution Release Pack using the case data, writes decisions in plain English, and shows evidence for each important field instead of giving only a theory answer. Empower - Learner uses AI only as a coach: ask for missing-field checks, clarity prompts, risk questions, and retry suggestions. AI should not create the final artifact for the learner. Evolve - Learner notes what would become harder at L3: more records, more conflicts, less guidance, stronger evidence expectations, and higher decision responsibility. Artifact to submit: L2 Vocational Batch Alignment Execution Release Pack. L2 Vocational Batch Alignment Execution Release Pack should contain: work tracker; resolved routine conflicts; updated status fields; release checklist; decision note; final handoff confirmation. Required source data: qualification pack, trainer roster, equipment list, batch profile, practice-hour plan, assessment schedule. Evidence fields: Assess whether routine conflicts were resolved correctly, statuses were updated, decisions were traceable, and the release pack can be used without extra explanation. AI support: AI coach can ask: What source proves this? Which field is missing? What is the risk if this is wrong? Who owns the next action? Learner must answer using the case data, not guesses.',
  1,
  '12 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Voc - Vocational Education
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-042' LIMIT 1),
  'B.Voc - Vocational Education',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: Diploma in Vocational Training
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-042' LIMIT 1),
  'Diploma in Vocational Training',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BBA Skill Development
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-042' LIMIT 1),
  'BBA Skill Development',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PG Diploma Skill Development
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-042' LIMIT 1),
  'PG Diploma Skill Development',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MBA HR and Training
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-042' LIMIT 1),
  'MBA HR and Training',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Skilling Delivery & Placement Readiness Workflow Build, Conflict Handling & Final Release
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Skilling Delivery & Placement Readiness Workflow Build, Conflict Handling & Final Release',
  'COURSE-L2-047',
  'Learner can complete the workflow, resolve routine conflicts, and release the output for monitor skilling delivery and placement readiness through attendance, practice, and employability evidence and submit a workplace-ready L2 Skilling Delivery & Placement Readiness Execution Release Pack. Workplace scenario: A employability cell must complete and release the placement readiness tracker for 115 learners before employer interviews by the end of the day. The same inputs now have routine conflicts: resume status, mock interview scores, attendance, skill gaps, and employer criteria are scattered. The learner must update the tracker, resolve normal mismatches, record decisions, and release a clean placement readiness work pack. Learner artifact: L2 Skilling Delivery & Placement Readiness Execution Release Pack. Required data: learner profile, resume tracker, mock interview scores, attendance, employer criteria, skill-gap notes. Evidence: Assess whether routine conflicts were resolved correctly, statuses were updated, decisions were traceable, and the release pack can be used without extra explanation.',
  '12 hours',
  'Active',
  'Skilling, Employability & Work-Integrated Learning',
  'technical',
  '["Triggered when an independent routine execution task needs a real workplace artifact, not a theory answer.","Demonstrates independent routine execution by producing and defending the L2 Skilling Delivery & Placement Readiness Execution Release Pack.","Learner can complete the workflow, resolve routine conflicts, and release the output for monitor skilling delivery and placement readiness through attendance, practice, and employability evidence and submit a workplace-ready L2 Skilling Delivery & Placement Readiness Execution Release Pack."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: Module 1: Skilling Delivery & Placement Readiness Workflow Build, Conflict Handling & Final Release Workplace Artifact Build
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-047' LIMIT 1),
  'Module 1: Skilling Delivery & Placement Readiness Workflow Build, Conflict Handling & Final Release Workplace Artifact Build',
  'Triggered when an independent routine execution task needs a real workplace artifact, not a theory answer. The learner studies the case, reviews the required data, identifies the gap, creates the artifact, and checks it against evidence fields.',
  1,
  '["Education & Skilling","Skilling, Employability & Work-Integrated Learning","IND-CAP-10","L2","Employability readiness indicators","Employer criteria matching","Resume and interview evidence","Readiness scoring","Shortlist logic"]'::jsonb,
  '["Engage","Explore","Explain","Express","Empower","Evolve","Artifact Build","Evidence Review","AI-Coached Retry"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Case: Skilling Delivery & Placement Readiness Workflow Build, Conflict Handling & Final Release
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-047' LIMIT 1)
   AND title = 'Module 1: Skilling Delivery & Placement Readiness Workflow Build, Conflict Handling & Final Release Workplace Artifact Build' LIMIT 1),
  'Workplace Case: Skilling Delivery & Placement Readiness Workflow Build, Conflict Handling & Final Release',
  'A employability cell must complete and release the placement readiness tracker for 115 learners before employer interviews by the end of the day. The same inputs now have routine conflicts: resume status, mock interview scores, attendance, skill gaps, and employer criteria are scattered. The learner must update the tracker, resolve normal mismatches, record decisions, and release a clean placement readiness work pack. The learner must solve the problem using the given data and produce the required workplace artifact.',
  'Workplace problem: A employability cell must complete and release the placement readiness tracker for 115 learners before employer interviews by the end of the day. The same inputs now have routine conflicts: resume status, mock interview scores, attendance, skill gaps, and employer criteria are scattered. The learner must update the tracker, resolve normal mismatches, record decisions, and release a clean placement readiness work pack. Pressure points: Release pressure: the work must be completed, not only checked. Learner must manage routine mismatches in learner profile, resume tracker, mock interview scores, attendance, employer criteria, skill-gap notes while keeping status updates clear and on time. Root cause focus: Find whether delay or error comes from workflow sequencing, routine conflict handling, unclear status update, or missing release approval. Major concepts: Employability readiness indicators; Employer criteria matching; Resume and interview evidence; Readiness scoring; Shortlist logic; Placement handoff; Workflow sequencing; Routine conflict resolution; Release control. Level focus: workflow execution and release. Required data: learner profile, resume tracker, mock interview scores, attendance, employer criteria, skill-gap notes Learner activity flow: Engage - Start with the case: 115 learners before employer interviews and the visible pain point — resume status, mock interview scores, attendance, skill gaps, and employer criteria are scattered. Learner identifies who is affected and what could go wrong if the work is delayed or wrong. Explore - Learner studies the source data: learner profile, resume tracker, mock interview scores, attendance, employer criteria, skill-gap notes. They mark trusted records, missing fields, conflicting entries, and items that need confirmation before using them in the artifact. Explain - Teach the main logic in simple terms: Employability readiness indicators; Employer criteria matching; Resume and interview evidence; Readiness scoring; Shortlist logic; Placement handoff; Workflow sequencing; Routine conflict resolution; Release control. Level focus: workflow execution and release. Show how rules, evidence, decisions, and handoff notes connect in this workplace task. Express - Learner produces the L2 Skilling Delivery & Placement Readiness Execution Release Pack using the case data, writes decisions in plain English, and shows evidence for each important field instead of giving only a theory answer. Empower - Learner uses AI only as a coach: ask for missing-field checks, clarity prompts, risk questions, and retry suggestions. AI should not create the final artifact for the learner. Evolve - Learner notes what would become harder at L3: more records, more conflicts, less guidance, stronger evidence expectations, and higher decision responsibility. Artifact to submit: L2 Skilling Delivery & Placement Readiness Execution Release Pack. L2 Skilling Delivery & Placement Readiness Execution Release Pack should contain: work tracker; resolved routine conflicts; updated status fields; release checklist; decision note; final handoff confirmation. Required source data: learner profile, resume tracker, mock interview scores, attendance, employer criteria, skill-gap notes. Evidence fields: Assess whether routine conflicts were resolved correctly, statuses were updated, decisions were traceable, and the release pack can be used without extra explanation. AI support: AI coach can ask: What source proves this? Which field is missing? What is the risk if this is wrong? Who owns the next action? Learner must answer using the case data, not guesses.',
  1,
  '12 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Voc - Skill Development
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-047' LIMIT 1),
  'B.Voc - Skill Development',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BBA Training and Placement
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-047' LIMIT 1),
  'BBA Training and Placement',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MBA HR
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-047' LIMIT 1),
  'MBA HR',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PG Diploma Employability Training
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-047' LIMIT 1),
  'PG Diploma Employability Training',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MSW - Livelihood Programs
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-047' LIMIT 1),
  'MSW - Livelihood Programs',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Internship & Apprenticeship Matching Workflow Build, Conflict Handling & Final Release
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Internship & Apprenticeship Matching Workflow Build, Conflict Handling & Final Release',
  'COURSE-L2-052',
  'Learner can complete the workflow, resolve routine conflicts, and release the output for match learners to internship and apprenticeship opportunities using eligibility, employer, and learning-plan evidence and submit a workplace-ready L2 Internship & Apprenticeship Matching Execution Release Pack. Workplace scenario: A internship office must complete and release the internship matching shortlist for 86 eligible learners and 27 employer slots by the end of the day. The same inputs now have routine conflicts: locations, stipend rules, joining dates, skill requirements, and eligibility conditions conflict. The learner must update the tracker, resolve normal mismatches, record decisions, and release a clean internship matching work pack. Learner artifact: L2 Internship & Apprenticeship Matching Execution Release Pack. Required data: learner preference form, employer slot list, eligibility rules, location constraints, stipend details, joining deadlines. Evidence: Assess whether routine conflicts were resolved correctly, statuses were updated, decisions were traceable, and the release pack can be used without extra explanation.',
  '12 hours',
  'Active',
  'Skilling, Employability & Work-Integrated Learning',
  'technical',
  '["Triggered when an independent routine execution task needs a real workplace artifact, not a theory answer.","Demonstrates independent routine execution by producing and defending the L2 Internship & Apprenticeship Matching Execution Release Pack.","Learner can complete the workflow, resolve routine conflicts, and release the output for match learners to internship and apprenticeship opportunities using eligibility, employer, and learning-plan evidence and submit a workplace-ready L2 Internship & Apprenticeship Matching Execution Release Pack."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: Module 1: Internship & Apprenticeship Matching Workflow Build, Conflict Handling & Final Release Workplace Artifact Build
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-052' LIMIT 1),
  'Module 1: Internship & Apprenticeship Matching Workflow Build, Conflict Handling & Final Release Workplace Artifact Build',
  'Triggered when an independent routine execution task needs a real workplace artifact, not a theory answer. The learner studies the case, reviews the required data, identifies the gap, creates the artifact, and checks it against evidence fields.',
  1,
  '["Education & Skilling","Skilling, Employability & Work-Integrated Learning","IND-CAP-11","L2","Eligibility matching","Employer requirement mapping","Learner preference handling","Constraint-based shortlisting","Justification note"]'::jsonb,
  '["Engage","Explore","Explain","Express","Empower","Evolve","Artifact Build","Evidence Review","AI-Coached Retry"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Case: Internship & Apprenticeship Matching Workflow Build, Conflict Handling & Final Release
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-052' LIMIT 1)
   AND title = 'Module 1: Internship & Apprenticeship Matching Workflow Build, Conflict Handling & Final Release Workplace Artifact Build' LIMIT 1),
  'Workplace Case: Internship & Apprenticeship Matching Workflow Build, Conflict Handling & Final Release',
  'A internship office must complete and release the internship matching shortlist for 86 eligible learners and 27 employer slots by the end of the day. The same inputs now have routine conflicts: locations, stipend rules, joining dates, skill requirements, and eligibility conditions conflict. The learner must update the tracker, resolve normal mismatches, record decisions, and release a clean internship matching work pack. The learner must solve the problem using the given data and produce the required workplace artifact.',
  'Workplace problem: A internship office must complete and release the internship matching shortlist for 86 eligible learners and 27 employer slots by the end of the day. The same inputs now have routine conflicts: locations, stipend rules, joining dates, skill requirements, and eligibility conditions conflict. The learner must update the tracker, resolve normal mismatches, record decisions, and release a clean internship matching work pack. Pressure points: Release pressure: the work must be completed, not only checked. Learner must manage routine mismatches in learner preference form, employer slot list, eligibility rules, location constraints, stipend details, joining deadlines while keeping status updates clear and on time. Root cause focus: Find whether delay or error comes from workflow sequencing, routine conflict handling, unclear status update, or missing release approval. Major concepts: Eligibility matching; Employer requirement mapping; Learner preference handling; Constraint-based shortlisting; Justification note; Joining risk tracking; Workflow sequencing; Routine conflict resolution; Release control. Level focus: workflow execution and release. Required data: learner preference form, employer slot list, eligibility rules, location constraints, stipend details, joining deadlines Learner activity flow: Engage - Start with the case: 86 eligible learners and 27 employer slots and the visible pain point — locations, stipend rules, joining dates, skill requirements, and eligibility conditions conflict. Learner identifies who is affected and what could go wrong if the work is delayed or wrong. Explore - Learner studies the source data: learner preference form, employer slot list, eligibility rules, location constraints, stipend details, joining deadlines. They mark trusted records, missing fields, conflicting entries, and items that need confirmation before using them in the artifact. Explain - Teach the main logic in simple terms: Eligibility matching; Employer requirement mapping; Learner preference handling; Constraint-based shortlisting; Justification note; Joining risk tracking; Workflow sequencing; Routine conflict resolution; Release control. Level focus: workflow execution and release. Show how rules, evidence, decisions, and handoff notes connect in this workplace task. Express - Learner produces the L2 Internship & Apprenticeship Matching Execution Release Pack using the case data, writes decisions in plain English, and shows evidence for each important field instead of giving only a theory answer. Empower - Learner uses AI only as a coach: ask for missing-field checks, clarity prompts, risk questions, and retry suggestions. AI should not create the final artifact for the learner. Evolve - Learner notes what would become harder at L3: more records, more conflicts, less guidance, stronger evidence expectations, and higher decision responsibility. Artifact to submit: L2 Internship & Apprenticeship Matching Execution Release Pack. L2 Internship & Apprenticeship Matching Execution Release Pack should contain: work tracker; resolved routine conflicts; updated status fields; release checklist; decision note; final handoff confirmation. Required source data: learner preference form, employer slot list, eligibility rules, location constraints, stipend details, joining deadlines. Evidence fields: Assess whether routine conflicts were resolved correctly, statuses were updated, decisions were traceable, and the release pack can be used without extra explanation. AI support: AI coach can ask: What source proves this? Which field is missing? What is the risk if this is wrong? Who owns the next action? Learner must answer using the case data, not guesses.',
  1,
  '12 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Voc - Work Integrated Learning
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-052' LIMIT 1),
  'B.Voc - Work Integrated Learning',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BBA HR
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-052' LIMIT 1),
  'BBA HR',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MBA HR
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-052' LIMIT 1),
  'MBA HR',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PG Diploma Apprenticeship Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-052' LIMIT 1),
  'PG Diploma Apprenticeship Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PG Diploma Internship Coordination
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-052' LIMIT 1),
  'PG Diploma Internship Coordination',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Corporate L&D Needs Transfer Workflow Build, Conflict Handling & Final Release
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Corporate L&D Needs Transfer Workflow Build, Conflict Handling & Final Release',
  'COURSE-L2-057',
  'Learner can complete the workflow, resolve routine conflicts, and release the output for diagnose corporate learning needs and track transfer evidence against business performance objectives and submit a workplace-ready L2 Corporate L&D Needs Transfer Execution Release Pack. Workplace scenario: A corporate learning team must complete and release the L&D needs transfer note for 4 departments and 210 employees by the end of the day. The same inputs now have routine conflicts: manager requests, performance gaps, business priorities, and training expectations are mixed together. The learner must update the tracker, resolve normal mismatches, record decisions, and release a clean corporate l&d needs transfer work pack. Learner artifact: L2 Corporate L&D Needs Transfer Execution Release Pack. Required data: manager request forms, performance data, business priority notes, learner profile, budget constraints, timeline. Evidence: Assess whether routine conflicts were resolved correctly, statuses were updated, decisions were traceable, and the release pack can be used without extra explanation.',
  '12 hours',
  'Active',
  'Skilling, Employability & Work-Integrated Learning',
  'soft',
  '["Triggered when an independent routine execution task needs a real workplace artifact, not a theory answer.","Demonstrates independent routine execution by producing and defending the L2 Corporate L&D Needs Transfer Execution Release Pack.","Learner can complete the workflow, resolve routine conflicts, and release the output for diagnose corporate learning needs and track transfer evidence against business performance objectives and submit a workplace-ready L2 Corporate L&D Needs Transfer Execution Release Pack."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: Module 1: Corporate L&D Needs Transfer Workflow Build, Conflict Handling & Final Release Workplace Artifact Build
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-057' LIMIT 1),
  'Module 1: Corporate L&D Needs Transfer Workflow Build, Conflict Handling & Final Release Workplace Artifact Build',
  'Triggered when an independent routine execution task needs a real workplace artifact, not a theory answer. The learner studies the case, reviews the required data, identifies the gap, creates the artifact, and checks it against evidence fields.',
  1,
  '["Education & Skilling","Skilling, Employability & Work-Integrated Learning","IND-CAP-12","L2","Needs analysis","Business-to-learning translation","Stakeholder requirement capture","Performance gap framing","Training priority matrix"]'::jsonb,
  '["Engage","Explore","Explain","Express","Empower","Evolve","Artifact Build","Evidence Review","AI-Coached Retry"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Case: Corporate L&D Needs Transfer Workflow Build, Conflict Handling & Final Release
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-057' LIMIT 1)
   AND title = 'Module 1: Corporate L&D Needs Transfer Workflow Build, Conflict Handling & Final Release Workplace Artifact Build' LIMIT 1),
  'Workplace Case: Corporate L&D Needs Transfer Workflow Build, Conflict Handling & Final Release',
  'A corporate learning team must complete and release the L&D needs transfer note for 4 departments and 210 employees by the end of the day. The same inputs now have routine conflicts: manager requests, performance gaps, business priorities, and training expectations are mixed together. The learner must update the tracker, resolve normal mismatches, record decisions, and release a clean corporate l&d needs transfer work pack. The learner must solve the problem using the given data and produce the required workplace artifact.',
  'Workplace problem: A corporate learning team must complete and release the L&D needs transfer note for 4 departments and 210 employees by the end of the day. The same inputs now have routine conflicts: manager requests, performance gaps, business priorities, and training expectations are mixed together. The learner must update the tracker, resolve normal mismatches, record decisions, and release a clean corporate l&d needs transfer work pack. Pressure points: Release pressure: the work must be completed, not only checked. Learner must manage routine mismatches in manager request forms, performance data, business priority notes, learner profile, budget constraints, timeline while keeping status updates clear and on time. Root cause focus: Find whether delay or error comes from workflow sequencing, routine conflict handling, unclear status update, or missing release approval. Major concepts: Needs analysis; Business-to-learning translation; Stakeholder requirement capture; Performance gap framing; Training priority matrix; L&D handoff; Workflow sequencing; Routine conflict resolution; Release control. Level focus: workflow execution and release. Required data: manager request forms, performance data, business priority notes, learner profile, budget constraints, timeline Learner activity flow: Engage - Start with the case: 4 departments and 210 employees and the visible pain point — manager requests, performance gaps, business priorities, and training expectations are mixed together. Learner identifies who is affected and what could go wrong if the work is delayed or wrong. Explore - Learner studies the source data: manager request forms, performance data, business priority notes, learner profile, budget constraints, timeline. They mark trusted records, missing fields, conflicting entries, and items that need confirmation before using them in the artifact. Explain - Teach the main logic in simple terms: Needs analysis; Business-to-learning translation; Stakeholder requirement capture; Performance gap framing; Training priority matrix; L&D handoff; Workflow sequencing; Routine conflict resolution; Release control. Level focus: workflow execution and release. Show how rules, evidence, decisions, and handoff notes connect in this workplace task. Express - Learner produces the L2 Corporate L&D Needs Transfer Execution Release Pack using the case data, writes decisions in plain English, and shows evidence for each important field instead of giving only a theory answer. Empower - Learner uses AI only as a coach: ask for missing-field checks, clarity prompts, risk questions, and retry suggestions. AI should not create the final artifact for the learner. Evolve - Learner notes what would become harder at L3: more records, more conflicts, less guidance, stronger evidence expectations, and higher decision responsibility. Artifact to submit: L2 Corporate L&D Needs Transfer Execution Release Pack. L2 Corporate L&D Needs Transfer Execution Release Pack should contain: work tracker; resolved routine conflicts; updated status fields; release checklist; decision note; final handoff confirmation. Required source data: manager request forms, performance data, business priority notes, learner profile, budget constraints, timeline. Evidence fields: Assess whether routine conflicts were resolved correctly, statuses were updated, decisions were traceable, and the release pack can be used without extra explanation. AI support: AI coach can ask: What source proves this? Which field is missing? What is the risk if this is wrong? Who owns the next action? Learner must answer using the case data, not guesses.',
  1,
  '12 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BBA HR
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-057' LIMIT 1),
  'BBA HR',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MBA HR and L&D
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-057' LIMIT 1),
  'MBA HR and L&D',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PG Diploma Learning and Development
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-057' LIMIT 1),
  'PG Diploma Learning and Development',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MA Human Resource Management
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-057' LIMIT 1),
  'MA Human Resource Management',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Voc Corporate Training
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-057' LIMIT 1),
  'B.Voc Corporate Training',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: LMS Course Shell Launch Workflow Build, Conflict Handling & Final Release
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'LMS Course Shell Launch Workflow Build, Conflict Handling & Final Release',
  'COURSE-L2-062',
  'Learner can complete the workflow, resolve routine conflicts, and release the output for configure lms course shells, enrollment rules, permissions, and completion controls for launch readiness and submit a workplace-ready L2 LMS Course Shell Launch Execution Release Pack. Workplace scenario: A digital skilling platform must complete and release the LMS course shell launch checklist for 3 batches and 240 learners by the end of the day. The same inputs now have routine conflicts: module sequence, completion rules, facilitator permissions, and certificate trigger are incomplete. The learner must update the tracker, resolve normal mismatches, record decisions, and release a clean lms course shell launch work pack. Learner artifact: L2 LMS Course Shell Launch Execution Release Pack. Required data: course outline, LMS shell settings, user roles, completion rules, certificate settings, batch enrollment list. Evidence: Assess whether routine conflicts were resolved correctly, statuses were updated, decisions were traceable, and the release pack can be used without extra explanation.',
  '12 hours',
  'Active',
  'Digital Learning Platforms & Distributed Learning Operations',
  'technical',
  '["Triggered when an independent routine execution task needs a real workplace artifact, not a theory answer.","Demonstrates independent routine execution by producing and defending the L2 LMS Course Shell Launch Execution Release Pack.","Learner can complete the workflow, resolve routine conflicts, and release the output for configure lms course shells, enrollment rules, permissions, and completion controls for launch readiness and submit a workplace-ready L2 LMS Course Shell Launch Execution Release Pack."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: Module 1: LMS Course Shell Launch Workflow Build, Conflict Handling & Final Release Workplace Artifact Build
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-062' LIMIT 1),
  'Module 1: LMS Course Shell Launch Workflow Build, Conflict Handling & Final Release Workplace Artifact Build',
  'Triggered when an independent routine execution task needs a real workplace artifact, not a theory answer. The learner studies the case, reviews the required data, identifies the gap, creates the artifact, and checks it against evidence fields.',
  1,
  '["Education & Skilling","Digital Learning Platforms & Distributed Learning Operations","IND-CAP-13","L2","LMS course architecture","Enrollment and role permissions","Completion rule setup","Certificate trigger logic","Launch readiness testing"]'::jsonb,
  '["Engage","Explore","Explain","Express","Empower","Evolve","Artifact Build","Evidence Review","AI-Coached Retry"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Case: LMS Course Shell Launch Workflow Build, Conflict Handling & Final Release
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-062' LIMIT 1)
   AND title = 'Module 1: LMS Course Shell Launch Workflow Build, Conflict Handling & Final Release Workplace Artifact Build' LIMIT 1),
  'Workplace Case: LMS Course Shell Launch Workflow Build, Conflict Handling & Final Release',
  'A digital skilling platform must complete and release the LMS course shell launch checklist for 3 batches and 240 learners by the end of the day. The same inputs now have routine conflicts: module sequence, completion rules, facilitator permissions, and certificate trigger are incomplete. The learner must update the tracker, resolve normal mismatches, record decisions, and release a clean lms course shell launch work pack. The learner must solve the problem using the given data and produce the required workplace artifact.',
  'Workplace problem: A digital skilling platform must complete and release the LMS course shell launch checklist for 3 batches and 240 learners by the end of the day. The same inputs now have routine conflicts: module sequence, completion rules, facilitator permissions, and certificate trigger are incomplete. The learner must update the tracker, resolve normal mismatches, record decisions, and release a clean lms course shell launch work pack. Pressure points: Release pressure: the work must be completed, not only checked. Learner must manage routine mismatches in course outline, LMS shell settings, user roles, completion rules, certificate settings, batch enrollment list while keeping status updates clear and on time. Root cause focus: Find whether delay or error comes from workflow sequencing, routine conflict handling, unclear status update, or missing release approval. Major concepts: LMS course architecture; Enrollment and role permissions; Completion rule setup; Certificate trigger logic; Launch readiness testing; Learner access validation; Workflow sequencing; Routine conflict resolution; Release control. Level focus: workflow execution and release. Required data: course outline, LMS shell settings, user roles, completion rules, certificate settings, batch enrollment list Learner activity flow: Engage - Start with the case: 3 batches and 240 learners and the visible pain point — module sequence, completion rules, facilitator permissions, and certificate trigger are incomplete. Learner identifies who is affected and what could go wrong if the work is delayed or wrong. Explore - Learner studies the source data: course outline, LMS shell settings, user roles, completion rules, certificate settings, batch enrollment list. They mark trusted records, missing fields, conflicting entries, and items that need confirmation before using them in the artifact. Explain - Teach the main logic in simple terms: LMS course architecture; Enrollment and role permissions; Completion rule setup; Certificate trigger logic; Launch readiness testing; Learner access validation; Workflow sequencing; Routine conflict resolution; Release control. Level focus: workflow execution and release. Show how rules, evidence, decisions, and handoff notes connect in this workplace task. Express - Learner produces the L2 LMS Course Shell Launch Execution Release Pack using the case data, writes decisions in plain English, and shows evidence for each important field instead of giving only a theory answer. Empower - Learner uses AI only as a coach: ask for missing-field checks, clarity prompts, risk questions, and retry suggestions. AI should not create the final artifact for the learner. Evolve - Learner notes what would become harder at L3: more records, more conflicts, less guidance, stronger evidence expectations, and higher decision responsibility. Artifact to submit: L2 LMS Course Shell Launch Execution Release Pack. L2 LMS Course Shell Launch Execution Release Pack should contain: work tracker; resolved routine conflicts; updated status fields; release checklist; decision note; final handoff confirmation. Required source data: course outline, LMS shell settings, user roles, completion rules, certificate settings, batch enrollment list. Evidence fields: Assess whether routine conflicts were resolved correctly, statuses were updated, decisions were traceable, and the release pack can be used without extra explanation. AI support: AI coach can ask: What source proves this? Which field is missing? What is the risk if this is wrong? Who owns the next action? Learner must answer using the case data, not guesses.',
  1,
  '12 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BCA
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-062' LIMIT 1),
  'BCA',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc IT
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-062' LIMIT 1),
  'B.Sc IT',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Ed - Educational Technology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-062' LIMIT 1),
  'B.Ed - Educational Technology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Ed - Educational Technology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-062' LIMIT 1),
  'M.Ed - Educational Technology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PG Diploma LMS Administration
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-062' LIMIT 1),
  'PG Diploma LMS Administration',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Digital Learner Engagement Nudge Workflow Build, Conflict Handling & Final Release
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Digital Learner Engagement Nudge Workflow Build, Conflict Handling & Final Release',
  'COURSE-L2-067',
  'Learner can complete the workflow, resolve routine conflicts, and release the output for monitor digital learner activity and trigger timely nudges from platform engagement evidence and submit a workplace-ready L2 Digital Learner Engagement Nudge Execution Release Pack. Workplace scenario: A online learning support desk must complete and release the learner engagement nudge plan for 312 active learners in week 2 by the end of the day. The same inputs now have routine conflicts: 96 learners have low logins, 48 have missed quizzes, and support messages are not targeted. The learner must update the tracker, resolve normal mismatches, record decisions, and release a clean digital engagement nudge work pack. Learner artifact: L2 Digital Learner Engagement Nudge Execution Release Pack. Required data: login analytics, quiz completion, video watch data, support tickets, learner segments, nudge templates. Evidence: Assess whether routine conflicts were resolved correctly, statuses were updated, decisions were traceable, and the release pack can be used without extra explanation.',
  '12 hours',
  'Active',
  'Digital Learning Platforms & Distributed Learning Operations',
  'soft',
  '["Triggered when an independent routine execution task needs a real workplace artifact, not a theory answer.","Demonstrates independent routine execution by producing and defending the L2 Digital Learner Engagement Nudge Execution Release Pack.","Learner can complete the workflow, resolve routine conflicts, and release the output for monitor digital learner activity and trigger timely nudges from platform engagement evidence and submit a workplace-ready L2 Digital Learner Engagement Nudge Execution Release Pack."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: Module 1: Digital Learner Engagement Nudge Workflow Build, Conflict Handling & Final Release Workplace Artifact Build
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-067' LIMIT 1),
  'Module 1: Digital Learner Engagement Nudge Workflow Build, Conflict Handling & Final Release Workplace Artifact Build',
  'Triggered when an independent routine execution task needs a real workplace artifact, not a theory answer. The learner studies the case, reviews the required data, identifies the gap, creates the artifact, and checks it against evidence fields.',
  1,
  '["Education & Skilling","Digital Learning Platforms & Distributed Learning Operations","IND-CAP-14","L2","Engagement analytics","Learner segmentation","Nudge design","Risk indicator reading","Message timing"]'::jsonb,
  '["Engage","Explore","Explain","Express","Empower","Evolve","Artifact Build","Evidence Review","AI-Coached Retry"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Case: Digital Learner Engagement Nudge Workflow Build, Conflict Handling & Final Release
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-067' LIMIT 1)
   AND title = 'Module 1: Digital Learner Engagement Nudge Workflow Build, Conflict Handling & Final Release Workplace Artifact Build' LIMIT 1),
  'Workplace Case: Digital Learner Engagement Nudge Workflow Build, Conflict Handling & Final Release',
  'A online learning support desk must complete and release the learner engagement nudge plan for 312 active learners in week 2 by the end of the day. The same inputs now have routine conflicts: 96 learners have low logins, 48 have missed quizzes, and support messages are not targeted. The learner must update the tracker, resolve normal mismatches, record decisions, and release a clean digital engagement nudge work pack. The learner must solve the problem using the given data and produce the required workplace artifact.',
  'Workplace problem: A online learning support desk must complete and release the learner engagement nudge plan for 312 active learners in week 2 by the end of the day. The same inputs now have routine conflicts: 96 learners have low logins, 48 have missed quizzes, and support messages are not targeted. The learner must update the tracker, resolve normal mismatches, record decisions, and release a clean digital engagement nudge work pack. Pressure points: Release pressure: the work must be completed, not only checked. Learner must manage routine mismatches in login analytics, quiz completion, video watch data, support tickets, learner segments, nudge templates while keeping status updates clear and on time. Root cause focus: Find whether delay or error comes from workflow sequencing, routine conflict handling, unclear status update, or missing release approval. Major concepts: Engagement analytics; Learner segmentation; Nudge design; Risk indicator reading; Message timing; Follow-up tracking; Workflow sequencing; Routine conflict resolution; Release control. Level focus: workflow execution and release. Required data: login analytics, quiz completion, video watch data, support tickets, learner segments, nudge templates Learner activity flow: Engage - Start with the case: 312 active learners in week 2 and the visible pain point — 96 learners have low logins, 48 have missed quizzes, and support messages are not targeted. Learner identifies who is affected and what could go wrong if the work is delayed or wrong. Explore - Learner studies the source data: login analytics, quiz completion, video watch data, support tickets, learner segments, nudge templates. They mark trusted records, missing fields, conflicting entries, and items that need confirmation before using them in the artifact. Explain - Teach the main logic in simple terms: Engagement analytics; Learner segmentation; Nudge design; Risk indicator reading; Message timing; Follow-up tracking; Workflow sequencing; Routine conflict resolution; Release control. Level focus: workflow execution and release. Show how rules, evidence, decisions, and handoff notes connect in this workplace task. Express - Learner produces the L2 Digital Learner Engagement Nudge Execution Release Pack using the case data, writes decisions in plain English, and shows evidence for each important field instead of giving only a theory answer. Empower - Learner uses AI only as a coach: ask for missing-field checks, clarity prompts, risk questions, and retry suggestions. AI should not create the final artifact for the learner. Evolve - Learner notes what would become harder at L3: more records, more conflicts, less guidance, stronger evidence expectations, and higher decision responsibility. Artifact to submit: L2 Digital Learner Engagement Nudge Execution Release Pack. L2 Digital Learner Engagement Nudge Execution Release Pack should contain: work tracker; resolved routine conflicts; updated status fields; release checklist; decision note; final handoff confirmation. Required source data: login analytics, quiz completion, video watch data, support tickets, learner segments, nudge templates. Evidence fields: Assess whether routine conflicts were resolved correctly, statuses were updated, decisions were traceable, and the release pack can be used without extra explanation. AI support: AI coach can ask: What source proves this? Which field is missing? What is the risk if this is wrong? Who owns the next action? Learner must answer using the case data, not guesses.',
  1,
  '12 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BCA
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-067' LIMIT 1),
  'BCA',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc IT
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-067' LIMIT 1),
  'B.Sc IT',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BA Communication
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-067' LIMIT 1),
  'BA Communication',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Ed - Digital Learning
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-067' LIMIT 1),
  'B.Ed - Digital Learning',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PG Diploma Digital Learning Engagement
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-067' LIMIT 1),
  'PG Diploma Digital Learning Engagement',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Remote Cohort Facilitation Control Workflow Build, Conflict Handling & Final Release
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Remote Cohort Facilitation Control Workflow Build, Conflict Handling & Final Release',
  'COURSE-L2-072',
  'Learner can complete the workflow, resolve routine conflicts, and release the output for control remote cohort facilitation through session access, participation, and digital delivery evidence and submit a workplace-ready L2 Remote Cohort Facilitation Control Execution Release Pack. Workplace scenario: A distance learning team must complete and release the remote cohort facilitation control sheet for 4 online cohorts across 2 time zones by the end of the day. The same inputs now have routine conflicts: attendance, breakout activities, facilitator notes, and learner questions are not captured consistently. The learner must update the tracker, resolve normal mismatches, record decisions, and release a clean remote cohort facilitation work pack. Learner artifact: L2 Remote Cohort Facilitation Control Execution Release Pack. Required data: online session roster, attendance export, chat/Q&A log, breakout task evidence, facilitator notes, issue log. Evidence: Assess whether routine conflicts were resolved correctly, statuses were updated, decisions were traceable, and the release pack can be used without extra explanation.',
  '12 hours',
  'Active',
  'Digital Learning Platforms & Distributed Learning Operations',
  'soft',
  '["Triggered when an independent routine execution task needs a real workplace artifact, not a theory answer.","Demonstrates independent routine execution by producing and defending the L2 Remote Cohort Facilitation Control Execution Release Pack.","Learner can complete the workflow, resolve routine conflicts, and release the output for control remote cohort facilitation through session access, participation, and digital delivery evidence and submit a workplace-ready L2 Remote Cohort Facilitation Control Execution Release Pack."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: Module 1: Remote Cohort Facilitation Control Workflow Build, Conflict Handling & Final Release Workplace Artifact Build
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-072' LIMIT 1),
  'Module 1: Remote Cohort Facilitation Control Workflow Build, Conflict Handling & Final Release Workplace Artifact Build',
  'Triggered when an independent routine execution task needs a real workplace artifact, not a theory answer. The learner studies the case, reviews the required data, identifies the gap, creates the artifact, and checks it against evidence fields.',
  1,
  '["Education & Skilling","Digital Learning Platforms & Distributed Learning Operations","IND-CAP-15","L2","Remote facilitation control","Attendance and participation capture","Breakout evidence tracking","Live issue handling","Session closure note"]'::jsonb,
  '["Engage","Explore","Explain","Express","Empower","Evolve","Artifact Build","Evidence Review","AI-Coached Retry"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Case: Remote Cohort Facilitation Control Workflow Build, Conflict Handling & Final Release
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-072' LIMIT 1)
   AND title = 'Module 1: Remote Cohort Facilitation Control Workflow Build, Conflict Handling & Final Release Workplace Artifact Build' LIMIT 1),
  'Workplace Case: Remote Cohort Facilitation Control Workflow Build, Conflict Handling & Final Release',
  'A distance learning team must complete and release the remote cohort facilitation control sheet for 4 online cohorts across 2 time zones by the end of the day. The same inputs now have routine conflicts: attendance, breakout activities, facilitator notes, and learner questions are not captured consistently. The learner must update the tracker, resolve normal mismatches, record decisions, and release a clean remote cohort facilitation work pack. The learner must solve the problem using the given data and produce the required workplace artifact.',
  'Workplace problem: A distance learning team must complete and release the remote cohort facilitation control sheet for 4 online cohorts across 2 time zones by the end of the day. The same inputs now have routine conflicts: attendance, breakout activities, facilitator notes, and learner questions are not captured consistently. The learner must update the tracker, resolve normal mismatches, record decisions, and release a clean remote cohort facilitation work pack. Pressure points: Release pressure: the work must be completed, not only checked. Learner must manage routine mismatches in online session roster, attendance export, chat/Q&A log, breakout task evidence, facilitator notes, issue log while keeping status updates clear and on time. Root cause focus: Find whether delay or error comes from workflow sequencing, routine conflict handling, unclear status update, or missing release approval. Major concepts: Remote facilitation control; Attendance and participation capture; Breakout evidence tracking; Live issue handling; Session closure note; Cohort follow-up; Workflow sequencing; Routine conflict resolution; Release control. Level focus: workflow execution and release. Required data: online session roster, attendance export, chat/Q&A log, breakout task evidence, facilitator notes, issue log Learner activity flow: Engage - Start with the case: 4 online cohorts across 2 time zones and the visible pain point — attendance, breakout activities, facilitator notes, and learner questions are not captured consistently. Learner identifies who is affected and what could go wrong if the work is delayed or wrong. Explore - Learner studies the source data: online session roster, attendance export, chat/Q&A log, breakout task evidence, facilitator notes, issue log. They mark trusted records, missing fields, conflicting entries, and items that need confirmation before using them in the artifact. Explain - Teach the main logic in simple terms: Remote facilitation control; Attendance and participation capture; Breakout evidence tracking; Live issue handling; Session closure note; Cohort follow-up; Workflow sequencing; Routine conflict resolution; Release control. Level focus: workflow execution and release. Show how rules, evidence, decisions, and handoff notes connect in this workplace task. Express - Learner produces the L2 Remote Cohort Facilitation Control Execution Release Pack using the case data, writes decisions in plain English, and shows evidence for each important field instead of giving only a theory answer. Empower - Learner uses AI only as a coach: ask for missing-field checks, clarity prompts, risk questions, and retry suggestions. AI should not create the final artifact for the learner. Evolve - Learner notes what would become harder at L3: more records, more conflicts, less guidance, stronger evidence expectations, and higher decision responsibility. Artifact to submit: L2 Remote Cohort Facilitation Control Execution Release Pack. L2 Remote Cohort Facilitation Control Execution Release Pack should contain: work tracker; resolved routine conflicts; updated status fields; release checklist; decision note; final handoff confirmation. Required source data: online session roster, attendance export, chat/Q&A log, breakout task evidence, facilitator notes, issue log. Evidence fields: Assess whether routine conflicts were resolved correctly, statuses were updated, decisions were traceable, and the release pack can be used without extra explanation. AI support: AI coach can ask: What source proves this? Which field is missing? What is the risk if this is wrong? Who owns the next action? Learner must answer using the case data, not guesses.',
  1,
  '12 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Ed - Online Teaching
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-072' LIMIT 1),
  'B.Ed - Online Teaching',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Ed - Educational Technology
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-072' LIMIT 1),
  'M.Ed - Educational Technology',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BA Education
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-072' LIMIT 1),
  'BA Education',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PG Diploma Online and Distance Learning
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-072' LIMIT 1),
  'PG Diploma Online and Distance Learning',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PG Diploma Virtual Facilitation
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-072' LIMIT 1),
  'PG Diploma Virtual Facilitation',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Tutoring Support Routing Workflow Build, Conflict Handling & Final Release
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Tutoring Support Routing Workflow Build, Conflict Handling & Final Release',
  'COURSE-L2-077',
  'Learner can complete the workflow, resolve routine conflicts, and release the output for tutoring support requests using academic need, availability, and intervention-fit evidence and submit a workplace-ready L2 Tutoring Support Routing Execution Release Pack. Workplace scenario: An academic support centre must complete and release the tutoring support routing sheet for 74 learners requesting support by the end of the day. The same inputs now have routine conflicts: some learners need concept help, some need language support, and some have attendance or confidence issues. The learner must update the tracker, resolve normal mismatches, record decisions, and release a clean tutoring support routing work pack. Learner artifact: L2 Tutoring Support Routing Execution Release Pack. Required data: support request form, diagnostic quiz, attendance record, tutor availability, learner notes, priority rules. Evidence: Assess whether routine conflicts were resolved correctly, statuses were updated, decisions were traceable, and the release pack can be used without extra explanation.',
  '12 hours',
  'Active',
  'Digital Learning Platforms & Distributed Learning Operations',
  'soft',
  '["Triggered when an independent routine execution task needs a real workplace artifact, not a theory answer.","Demonstrates independent routine execution by producing and defending the L2 Tutoring Support Routing Execution Release Pack.","Learner can complete the workflow, resolve routine conflicts, and release the output for tutoring support requests using academic need, availability, and intervention-fit evidence and submit a workplace-ready L2 Tutoring Support Routing Execution Release Pack."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: Module 1: Tutoring Support Routing Workflow Build, Conflict Handling & Final Release Workplace Artifact Build
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-077' LIMIT 1),
  'Module 1: Tutoring Support Routing Workflow Build, Conflict Handling & Final Release Workplace Artifact Build',
  'Triggered when an independent routine execution task needs a real workplace artifact, not a theory answer. The learner studies the case, reviews the required data, identifies the gap, creates the artifact, and checks it against evidence fields.',
  1,
  '["Education & Skilling","Digital Learning Platforms & Distributed Learning Operations","IND-CAP-16","L2","Support need classification","Diagnostic evidence reading","Tutor matching","Priority routing","Support session planning"]'::jsonb,
  '["Engage","Explore","Explain","Express","Empower","Evolve","Artifact Build","Evidence Review","AI-Coached Retry"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Case: Tutoring Support Routing Workflow Build, Conflict Handling & Final Release
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-077' LIMIT 1)
   AND title = 'Module 1: Tutoring Support Routing Workflow Build, Conflict Handling & Final Release Workplace Artifact Build' LIMIT 1),
  'Workplace Case: Tutoring Support Routing Workflow Build, Conflict Handling & Final Release',
  'An academic support centre must complete and release the tutoring support routing sheet for 74 learners requesting support by the end of the day. The same inputs now have routine conflicts: some learners need concept help, some need language support, and some have attendance or confidence issues. The learner must update the tracker, resolve normal mismatches, record decisions, and release a clean tutoring support routing work pack. The learner must solve the problem using the given data and produce the required workplace artifact.',
  'Workplace problem: An academic support centre must complete and release the tutoring support routing sheet for 74 learners requesting support by the end of the day. The same inputs now have routine conflicts: some learners need concept help, some need language support, and some have attendance or confidence issues. The learner must update the tracker, resolve normal mismatches, record decisions, and release a clean tutoring support routing work pack. Pressure points: Release pressure: the work must be completed, not only checked. Learner must manage routine mismatches in support request form, diagnostic quiz, attendance record, tutor availability, learner notes, priority rules while keeping status updates clear and on time. Root cause focus: Find whether delay or error comes from workflow sequencing, routine conflict handling, unclear status update, or missing release approval. Major concepts: Support need classification; Diagnostic evidence reading; Tutor matching; Priority routing; Support session planning; Progress follow-up; Workflow sequencing; Routine conflict resolution; Release control. Level focus: workflow execution and release. Required data: support request form, diagnostic quiz, attendance record, tutor availability, learner notes, priority rules Learner activity flow: Engage - Start with the case: 74 learners requesting support and the visible pain point — some learners need concept help, some need language support, and some have attendance or confidence issues. Learner identifies who is affected and what could go wrong if the work is delayed or wrong. Explore - Learner studies the source data: support request form, diagnostic quiz, attendance record, tutor availability, learner notes, priority rules. They mark trusted records, missing fields, conflicting entries, and items that need confirmation before using them in the artifact. Explain - Teach the main logic in simple terms: Support need classification; Diagnostic evidence reading; Tutor matching; Priority routing; Support session planning; Progress follow-up; Workflow sequencing; Routine conflict resolution; Release control. Level focus: workflow execution and release. Show how rules, evidence, decisions, and handoff notes connect in this workplace task. Express - Learner produces the L2 Tutoring Support Routing Execution Release Pack using the case data, writes decisions in plain English, and shows evidence for each important field instead of giving only a theory answer. Empower - Learner uses AI only as a coach: ask for missing-field checks, clarity prompts, risk questions, and retry suggestions. AI should not create the final artifact for the learner. Evolve - Learner notes what would become harder at L3: more records, more conflicts, less guidance, stronger evidence expectations, and higher decision responsibility. Artifact to submit: L2 Tutoring Support Routing Execution Release Pack. L2 Tutoring Support Routing Execution Release Pack should contain: work tracker; resolved routine conflicts; updated status fields; release checklist; decision note; final handoff confirmation. Required source data: support request form, diagnostic quiz, attendance record, tutor availability, learner notes, priority rules. Evidence fields: Assess whether routine conflicts were resolved correctly, statuses were updated, decisions were traceable, and the release pack can be used without extra explanation. AI support: AI coach can ask: What source proves this? Which field is missing? What is the risk if this is wrong? Who owns the next action? Learner must answer using the case data, not guesses.',
  1,
  '12 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Ed - Subject Tutoring
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-077' LIMIT 1),
  'B.Ed - Subject Tutoring',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: BA Education
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-077' LIMIT 1),
  'BA Education',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Sc Education
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-077' LIMIT 1),
  'B.Sc Education',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PG Diploma Tutoring and Coaching
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-077' LIMIT 1),
  'PG Diploma Tutoring and Coaching',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PG Diploma Inclusive Learning Support
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-077' LIMIT 1),
  'PG Diploma Inclusive Learning Support',
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Course: Assessment Blueprinting Workflow Build, Conflict Handling & Final Release
INSERT INTO public.courses (
  title, code, description, duration, status, 
  category, skill_type, target_outcomes, thumbnail,
  approval_status, classification, plan_type, created_at, updated_at, is_demo
) VALUES (
  'Assessment Blueprinting Workflow Build, Conflict Handling & Final Release',
  'COURSE-L2-082',
  'Learner can complete the workflow, resolve routine conflicts, and release the output for build assessment blueprints and items aligned to competency level, evidence standard, and validity requirements and submit a workplace-ready L2 Assessment Blueprinting Execution Release Pack. Workplace scenario: An assessment design team must complete and release the assessment blueprint map for 60 questions across 5 outcomes by the end of the day. The same inputs now have routine conflicts: items do not match competency levels, evidence requirements, marks, or difficulty balance. The learner must update the tracker, resolve normal mismatches, record decisions, and release a clean assessment blueprinting work pack. Learner artifact: L2 Assessment Blueprinting Execution Release Pack. Required data: learning outcomes, item bank, marks table, difficulty tags, competency map, rubric draft. Evidence: Assess whether routine conflicts were resolved correctly, statuses were updated, decisions were traceable, and the release pack can be used without extra explanation.',
  '12 hours',
  'Active',
  'Assessment, Certification & Credentialing',
  'technical',
  '["Triggered when an independent routine execution task needs a real workplace artifact, not a theory answer.","Demonstrates independent routine execution by producing and defending the L2 Assessment Blueprinting Execution Release Pack.","Learner can complete the workflow, resolve routine conflicts, and release the output for build assessment blueprints and items aligned to competency level, evidence standard, and validity requirements and submit a workplace-ready L2 Assessment Blueprinting Execution Release Pack."]'::jsonb,
  NULL,
  'pending',
  'college',
  'basic',
  NOW(),
  NOW(),
  true
) ON CONFLICT (code) DO NOTHING;

-- Insert Module: Module 1: Assessment Blueprinting Workflow Build, Conflict Handling & Final Release Workplace Artifact Build
INSERT INTO public.course_modules (
  course_id, title, description, order_index, 
  skill_tags, activities, created_at, updated_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-082' LIMIT 1),
  'Module 1: Assessment Blueprinting Workflow Build, Conflict Handling & Final Release Workplace Artifact Build',
  'Triggered when an independent routine execution task needs a real workplace artifact, not a theory answer. The learner studies the case, reviews the required data, identifies the gap, creates the artifact, and checks it against evidence fields.',
  1,
  '["Education & Skilling","Assessment, Certification & Credentialing","IND-CAP-17","L2","Assessment blueprinting","Outcome-item alignment","Difficulty distribution","Marks weighting","Evidence validity"]'::jsonb,
  '["Engage","Explore","Explain","Express","Empower","Evolve","Artifact Build","Evidence Review","AI-Coached Retry"]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Lesson: Workplace Case: Assessment Blueprinting Workflow Build, Conflict Handling & Final Release
INSERT INTO public.lessons (
  module_id, title, description, content, 
  order_index, duration, created_at, updated_at
) VALUES (
  (SELECT module_id FROM public.course_modules 
   WHERE course_id = (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-082' LIMIT 1)
   AND title = 'Module 1: Assessment Blueprinting Workflow Build, Conflict Handling & Final Release Workplace Artifact Build' LIMIT 1),
  'Workplace Case: Assessment Blueprinting Workflow Build, Conflict Handling & Final Release',
  'An assessment design team must complete and release the assessment blueprint map for 60 questions across 5 outcomes by the end of the day. The same inputs now have routine conflicts: items do not match competency levels, evidence requirements, marks, or difficulty balance. The learner must update the tracker, resolve normal mismatches, record decisions, and release a clean assessment blueprinting work pack. The learner must solve the problem using the given data and produce the required workplace artifact.',
  'Workplace problem: An assessment design team must complete and release the assessment blueprint map for 60 questions across 5 outcomes by the end of the day. The same inputs now have routine conflicts: items do not match competency levels, evidence requirements, marks, or difficulty balance. The learner must update the tracker, resolve normal mismatches, record decisions, and release a clean assessment blueprinting work pack. Pressure points: Release pressure: the work must be completed, not only checked. Learner must manage routine mismatches in learning outcomes, item bank, marks table, difficulty tags, competency map, rubric draft while keeping status updates clear and on time. Root cause focus: Find whether delay or error comes from workflow sequencing, routine conflict handling, unclear status update, or missing release approval. Major concepts: Assessment blueprinting; Outcome-item alignment; Difficulty distribution; Marks weighting; Evidence validity; Rubric linkage; Workflow sequencing; Routine conflict resolution; Release control. Level focus: workflow execution and release. Required data: learning outcomes, item bank, marks table, difficulty tags, competency map, rubric draft Learner activity flow: Engage - Start with the case: 60 questions across 5 outcomes and the visible pain point — items do not match competency levels, evidence requirements, marks, or difficulty balance. Learner identifies who is affected and what could go wrong if the work is delayed or wrong. Explore - Learner studies the source data: learning outcomes, item bank, marks table, difficulty tags, competency map, rubric draft. They mark trusted records, missing fields, conflicting entries, and items that need confirmation before using them in the artifact. Explain - Teach the main logic in simple terms: Assessment blueprinting; Outcome-item alignment; Difficulty distribution; Marks weighting; Evidence validity; Rubric linkage; Workflow sequencing; Routine conflict resolution; Release control. Level focus: workflow execution and release. Show how rules, evidence, decisions, and handoff notes connect in this workplace task. Express - Learner produces the L2 Assessment Blueprinting Execution Release Pack using the case data, writes decisions in plain English, and shows evidence for each important field instead of giving only a theory answer. Empower - Learner uses AI only as a coach: ask for missing-field checks, clarity prompts, risk questions, and retry suggestions. AI should not create the final artifact for the learner. Evolve - Learner notes what would become harder at L3: more records, more conflicts, less guidance, stronger evidence expectations, and higher decision responsibility. Artifact to submit: L2 Assessment Blueprinting Execution Release Pack. L2 Assessment Blueprinting Execution Release Pack should contain: work tracker; resolved routine conflicts; updated status fields; release checklist; decision note; final handoff confirmation. Required source data: learning outcomes, item bank, marks table, difficulty tags, competency map, rubric draft. Evidence fields: Assess whether routine conflicts were resolved correctly, statuses were updated, decisions were traceable, and the release pack can be used without extra explanation. AI support: AI coach can ask: What source proves this? Which field is missing? What is the risk if this is wrong? Who owns the next action? Learner must answer using the case data, not guesses.',
  1,
  '12 hours',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: B.Ed - Assessment Design
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-082' LIMIT 1),
  'B.Ed - Assessment Design',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: M.Ed - Assessment and Evaluation
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-082' LIMIT 1),
  'M.Ed - Assessment and Evaluation',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: MA Education
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-082' LIMIT 1),
  'MA Education',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PG Diploma Educational Assessment
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-082' LIMIT 1),
  'PG Diploma Educational Assessment',
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign to Class: PG Diploma Instructional Design
INSERT INTO public.course_classes (
  course_id, class_name, created_at
) VALUES (
  (SELECT course_id FROM public.courses WHERE code = 'COURSE-L2-082' LIMIT 1),
  'PG Diploma Instructional Design',
  NOW()
) ON CONFLICT DO NOTHING;

COMMIT;

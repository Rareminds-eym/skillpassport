-- Seed for SkillPassport App DB (production)
-- Adds grades and feedback for "Company Formation & Performance" task submissions
-- External Educator: Subashini Ramaswamy (subashini.r@rareminds.in)
-- Updates college_learner_assignments rows from 'submitted' to 'graded'
-- Safe and idempotent: Only updates rows that are in 'submitted' status
-- Grade Date: 2026-10-27 (after submission review)
--
-- GRADING STRUCTURE:
--   Total Points: 100
--   External Educator ID: 80670692-dfe0-533a-bcc3-c594eff43667
--   Status: 'submitted' → 'graded'
--
-- PRE-CHECK (read-only): Verify the task and submissions exist
--   SELECT assignment_id, title FROM public.college_assignments 
--   WHERE title = 'Company Formation & Performance' AND is_deleted = false;
--
--   SELECT COUNT(*) FROM public.college_learner_assignments cla
--   JOIN public.college_assignments ca ON cla.assignment_id = ca.assignment_id
--   WHERE ca.title = 'Company Formation & Performance' 
--   AND cla.status = 'submitted';

BEGIN;

-- Update learner assignments with grades and feedback
UPDATE public.college_learner_assignments cla
SET 
  status = 'graded',
  grade_received = v.grade,
  grade_percentage = v.grade_percentage,
  instructor_feedback = v.feedback,
  external_educator_graded_by = '80670692-dfe0-533a-bcc3-c594eff43667'::uuid,
  graded_by = NULL,  -- Ensure mutual exclusivity with external educator
  graded_date = v.graded_date,
  feedback_date = v.graded_date,
  completed_date = v.graded_date,
  updated_date = now()
FROM (VALUES
  -- Student: Abhishek K D
  -- Email: abhikdabhi@gmail.com
  -- Grade: 63/100 (63%)
  ('abhikdabhi@gmail.com'::text, 
   63.0::numeric, 
   63.0::numeric, 
   'The workbook contains useful evidence, but the decision handover is incomplete. Recommended decisions are missing or incomplete in the worksheet. KPIs and review measures are missing or incomplete. The required five-slide presentation was not linked. Stakeholder pack: Communication pack addresses 7/8 stakeholder audiences and identifies PF remediation steps. Replace 31 unresolved bracketed placeholders before any external use. Confirm statutory'::text, 
   '2026-10-27 15:06:00+00'::timestamptz),

  -- Student: Chaithra.N
  -- Email: narayannarayan0726@gmail.com
  -- Grade: 18/100 (18%)
  ('narayannarayan0726@gmail.com'::text, 
   18.0::numeric, 
   18.0::numeric, 
   'Most required assessment outputs are absent or incomplete. Attrition-risk flags are missing for many employees. Add departmental and gender-level headcount, salary and attrition summaries. Two HR charts and three actions are not evidenced.'::text, 
   '2026-10-27 15:06:00+00'::timestamptz),

  -- Student: Jeevitha V
  -- Email: jeevithav01@gmail.com
  -- Grade: 56/100 (56%)
  ('jeevithav01@gmail.com'::text, 
   56.0::numeric, 
   56.0::numeric, 
   'Working charts/data do not yet form a complete, justified management decision. Recommended decisions are missing or incomplete in the worksheet. KPIs and review measures are missing or incomplete. Final management decision summary is incomplete. Stakeholder pack: Communication pack addresses 6/8 stakeholder audiences and identifies PF remediation steps. Replace 74 unresolved bracketed placeholders before any external use. Confirm statutory'::text, 
   '2026-10-27 15:06:00+00'::timestamptz),

  -- Student: K H Ambuja
  -- Email: ambujakhgowda@gmail.com
  -- Grade: 59/100 (59%)
  ('ambujakhgowda@gmail.com'::text, 
   59.0::numeric, 
   59.0::numeric, 
   'Working charts/data do not yet form a complete, justified management decision. Only 3/5 evidence observations are completed. Recommended decisions are missing or incomplete in the worksheet. KPIs and review measures are missing or incomplete. Stakeholder pack: Communication pack addresses 8/8 stakeholder audiences and identifies PF remediation steps. Replace 106 unresolved bracketed placeholders before any external use.'::text, 
   '2026-10-27 15:06:00+00'::timestamptz),

  -- Student: Kantharaju R N
  -- Email: kantharajurn17@gmail.com
  -- Grade: 70/100 (70%)
  ('kantharajurn17@gmail.com'::text, 
   70.0::numeric, 
   70.0::numeric, 
   'The workbook contains useful evidence, but the decision handover is incomplete. Final management decision summary is incomplete. The required five-slide presentation was not linked.'::text, 
   '2026-10-27 15:06:00+00'::timestamptz),

  -- Student: Lohith K S
  -- Email: lohithks2003@gmail.com
  -- Grade: 44/100 (44%)
  ('lohithks2003@gmail.com'::text, 
   44.0::numeric, 
   44.0::numeric, 
   'Some Excel operations are completed, but major deliverables remain open. ROAS formula uses revenue per customer instead of total revenue; correct it. No separate cleaning/duplicate issue log was evidenced. Add a verified ₹10 lakh allocation with ROAS/CAC justification and one risk.'::text, 
   '2026-10-27 15:06:00+00'::timestamptz),

  -- Student: Lokesh gowda S
  -- Email: lokeshloki3497@gmail.com
  -- Grade: 31/100 (31%)
  ('lokeshloki3497@gmail.com'::text, 
   31.0::numeric, 
   31.0::numeric, 
   'Working charts/data do not yet form a complete, justified management decision. Only 0/5 evidence observations are completed. Recommended decisions are missing or incomplete in the worksheet. KPIs and review measures are missing or incomplete. Stakeholder pack: Communication pack addresses 8/8 stakeholder audiences and identifies PF remediation steps. Replace 32 unresolved bracketed placeholders before any external use. Confirm statutory'::text, 
   '2026-10-27 15:06:00+00'::timestamptz),

  -- Student: Manjushree T N
  -- Email: manjushreegowda778@gmail.com
  -- Grade: 66/100 (66%)
  ('manjushreegowda778@gmail.com'::text, 
   66.0::numeric, 
   66.0::numeric, 
   'The workbook contains useful evidence, but the decision handover is incomplete. Recommended decisions are missing or incomplete in the worksheet. KPIs and review measures are missing or incomplete. Final management decision summary is incomplete. Stakeholder pack: Communication pack addresses 8/8 stakeholder audiences and identifies PF remediation steps. Replace 102 unresolved bracketed placeholders before any external use.'::text, 
   '2026-10-27 15:06:00+00'::timestamptz),

  -- Student: Priyanka SY
  -- Email: priyankaammu663@gmail.com
  -- Grade: 75/100 (75%)
  ('priyankaammu663@gmail.com'::text, 
   75.0::numeric, 
   75.0::numeric, 
   'Social-enterprise café financial case includes working capital; connect the launch budget to measurable monthly trading assumptions. Team documents are shared; individual authorship is not confirmed.'::text, 
   '2026-10-27 15:06:00+00'::timestamptz),

  -- Student: Rakshitha M R
  -- Email: rakshithamr68@gmail.com
  -- Grade: 38/100 (38%)
  ('rakshithamr68@gmail.com'::text, 
   38.0::numeric, 
   38.0::numeric, 
   'Working charts/data do not yet form a complete, justified management decision. Only 3/5 evidence observations are completed. Recommended decisions are missing or incomplete in the worksheet. KPIs and review measures are missing or incomplete.'::text, 
   '2026-10-27 15:06:00+00'::timestamptz),

  -- Student: Sanjana Kumar Mestha
  -- Email: sanjanakumarmesthakumarmestha@gmail.com
  -- Grade: 97/100 (97%)
  ('sanjanakumarmesthakumarmestha@gmail.com'::text, 
   97.0::numeric, 
   97.0::numeric, 
   'Strong working HR assessment: employee cleaning, risk formulas, department summaries, dashboard charts and quality checks are present. Verify risk thresholds and dashboard labels before final submission.'::text, 
   '2026-10-27 15:06:00+00'::timestamptz),

  -- Student: Shwetha B
  -- Email: shwethag395@gmail.com
  -- Grade: 83/100 (83%)
  ('shwethag395@gmail.com'::text, 
   83.0::numeric, 
   83.0::numeric, 
   'Specific quantified observations and decision reasoning are shown. The required five-slide presentation was not linked.'::text, 
   '2026-10-27 15:06:00+00'::timestamptz),

  -- Student: Simritha S
  -- Email: simrithasuresh31@gmail.com
  -- Grade: 82/100 (82%)
  ('simrithasuresh31@gmail.com'::text, 
   82.0::numeric, 
   82.0::numeric, 
   'HR policy and role pack is comprehensive with social-impact measures; verify budget ownership and worker-support implementation costs. Team documents are shared; individual authorship is not confirmed.'::text, 
   '2026-10-27 15:06:00+00'::timestamptz),

  -- Student: Sinchana C T
  -- Email: sinchana2393@gmail.com
  -- Grade: 30/100 (30%)
  ('sinchana2393@gmail.com'::text, 
   30.0::numeric, 
   30.0::numeric, 
   'Some Excel operations are completed, but major deliverables remain open. No visible exception/cleaning log. Three-month base/upside/downside collection forecast is missing. Complete the dashboard with management KPIs.'::text, 
   '2026-10-27 15:06:00+00'::timestamptz),

  -- Student: Varun GB
  -- Email: varungb04@gmail.com
  -- Grade: 72/100 (72%)
  ('varungb04@gmail.com'::text, 
   72.0::numeric, 
   72.0::numeric, 
   'Pinnacle marketing activities are budgeted; strengthen the linked admission funnel and measurable month-by-month results. Team documents are shared; individual authorship is not confirmed.'::text, 
   '2026-10-27 15:06:00+00'::timestamptz),

  -- Student: Vidyashri Honnalingappa kasar
  -- Email: kasarvidyashree@gmail.com
  -- Grade: 54/100 (54%)
  ('kasarvidyashree@gmail.com'::text, 
   54.0::numeric, 
   54.0::numeric, 
   'Working charts/data do not yet form a complete, justified management decision. Only 3/5 evidence observations are completed. Final management decision summary is incomplete. The required five-slide presentation was not linked.'::text, 
   '2026-10-27 15:06:00+00'::timestamptz),

  -- Student: ABHISHEK ND
  -- Email: abhisheknd267@gmail.com
  -- Grade: 52/100 (52%)
  ('abhisheknd267@gmail.com'::text, 
   52.0::numeric, 
   52.0::numeric, 
   'HR recruitment, roles and policies are documented; strengthen salary/headcount reconciliation and measurable retention targets. Team documents are shared; individual authorship is not confirmed. Some Excel operations are completed, but major deliverables remain open. ROAS formula uses revenue per customer instead of total revenue; correct it. No separate cleaning/duplicate issue log was evidenced. Scale/Optimise/Pause classifications or decision thresholds are incomplete.'::text, 
   '2026-10-27 15:06:00+00'::timestamptz),

  -- Student: Anusha
  -- Email: sunanda.anusha@gmail.com
  -- Grade: 56/100 (56%)
  ('sunanda.anusha@gmail.com'::text, 
   56.0::numeric, 
   56.0::numeric, 
   'Home Bite onboarding and service flow is clear; add measured outlet baselines, process exceptions and evidence behind KPI targets. Team documents are shared; individual authorship is not confirmed. Some Excel operations are completed, but major deliverables remain open. No visible exception/cleaning log. Three-month base/upside/downside collection forecast is missing. The workbook contains useful evidence, but the decision handover is incomplete. Recommended decisions are missing or incomplete in the worksheet. KPIs and review measures are missing or incomplete. Final management decision summary is incomplete.'::text, 
   '2026-10-27 15:06:00+00'::timestamptz),

  -- Student: Bhavya M T
  -- Email: bhavyamt2907@gmail.com
  -- Grade: 45/100 (45%)
  ('bhavyamt2907@gmail.com'::text, 
   45.0::numeric, 
   45.0::numeric, 
   'Some Excel operations are completed, but major deliverables remain open. No visible exception/cleaning log. Three-month base/upside/downside collection forecast is missing. Complete the dashboard with management KPIs. The workbook contains useful evidence, but the decision handover is incomplete. Recommended decisions are missing or incomplete in the worksheet. KPIs and review measures are missing or incomplete. Final management decision summary is incomplete.'::text, 
   '2026-10-27 15:06:00+00'::timestamptz),

  -- Student: Bhumika H
  -- Email: bhumikabharath252@gmail.com
  -- Grade: 68.67/100 (68.67%)
  ('bhumikabharath252@gmail.com'::text, 
   68.67::numeric, 
   68.67::numeric, 
   'Operational budget and KPI responsibilities are described; link enrolment, batch capacity and parent-service data to control totals. Team documents are shared; individual authorship is not confirmed. Substantial working analysis is present. Document a specific missing-value and duplicate-order audit. Working charts/data do not yet form a complete, justified management decision. Only 4/5 evidence observations are completed. Recommended decisions are missing or incomplete in the worksheet. KPIs and review measures are missing or incomplete.'::text, 
   '2026-10-27 15:06:00+00'::timestamptz),

  -- Student: Chaithanya T R
  -- Email: chaithanyatr24@gmail.com
  -- Grade: 54.67/100 (54.67%)
  ('chaithanyatr24@gmail.com'::text, 
   54.67::numeric, 
   54.67::numeric, 
   'Most required assessment outputs are absent or incomplete. Attrition-risk flags are missing for many employees. Add departmental and gender-level headcount, salary and attrition summaries. Two HR charts and three actions are not evidenced. The workbook contains useful evidence, but the decision handover is incomplete. Final management decision summary is incomplete. The required five-slide presentation was not linked. Stakeholder pack: Communication pack addresses 6/8 stakeholder audiences and identifies PF remediation steps. Replace 80 unresolved bracketed placeholders before any external use. Confirm statutory Uncommon Cup concept and financial plan are presented; reconcile initial café investment with operating cash needs and social-impact targets. Team documents are shared; individual authorship is not confirmed.'::text, 
   '2026-10-27 15:06:00+00'::timestamptz),

  -- Student: Chaithra N
  -- Email: cchaithran698@gmail.com
  -- Grade: 83.5/100 (83.5%)
  ('cchaithran698@gmail.com'::text, 
   83.5::numeric, 
   83.5::numeric, 
   'Marketing documents include segments, persona and positioning; add channel-level acquisition cost tests and dated campaign milestones. Team documents are shared; individual authorship is not confirmed. Substantial working analysis is present. No separate cleaning/duplicate issue log was evidenced.'::text, 
   '2026-10-27 15:06:00+00'::timestamptz),

  -- Student: Chandana KS
  -- Email: chandanaks547@gmail.com
  -- Grade: 60.33/100 (60.33%)
  ('chandanaks547@gmail.com'::text, 
   60.33::numeric, 
   60.33::numeric, 
   'Analytics/operations team and ₹62,000 budget ceiling are defined; validate whether administration costs overlap other department budgets. Team documents are shared; individual authorship is not confirmed. Some Excel operations are completed, but major deliverables remain open. No visible exception/cleaning log. Three-month base/upside/downside collection forecast is missing. Working charts/data do not yet form a complete, justified management decision. Recommended decisions are missing or incomplete in the worksheet. KPIs and review measures are missing or incomplete. Final management decision summary is incomplete. Stakeholder pack: Communication pack addresses 7/8 stakeholder audiences and identifies PF remediation steps. Replace 119 unresolved bracketed placeholders before any external use. Confirm statutory'::text, 
   '2026-10-27 15:06:00+00'::timestamptz),

  -- Student: Chethan G
  -- Email: gowdachethu83@gmail.com
  -- Grade: 50/100 (50%)
  ('gowdachethu83@gmail.com'::text, 
   50.0::numeric, 
   50.0::numeric, 
   'Battery finance report specifies ₹3 crore and cash controls; connect expenditure categories to an auditable monthly model and sales forecast. Team documents are shared; individual authorship is not confirmed. Pricing and brand positioning fit the inclusive café idea; substantiate demand and conversion assumptions using customer evidence. Team documents are shared; individual authorship is not confirmed. Some Excel operations are completed, but major deliverables remain open. Expense calculation adds budget and actual expenses, overstating costs. No visible exception/cleaning log. Complete all five finance calculations, including collection gap. Working charts/data do not yet form a complete, justified management decision. Only 0/5 evidence observations are completed. Recommended decisions are missing or incomplete in the worksheet. KPIs and review measures are missing or incomplete.'::text, 
   '2026-10-27 15:06:00+00'::timestamptz),

  -- Student: D N Jeevitha
  -- Email: jeevithadn47@gmail.com
  -- Grade: 59.67/100 (59.67%)
  ('jeevithadn47@gmail.com'::text, 
   59.67::numeric, 
   59.67::numeric, 
   'Communication pack addresses 8/8 stakeholder audiences and identifies PF remediation steps. Replace 130 unresolved bracketed placeholders before any external use. Specify responsible owners, 84-month reconciliation and evidence of EPFO correction. HR structure and review procedures are present; make hiring priorities, staffing costs and KPI owners consistent across files. Team documents are shared; individual authorship is not confirmed. Most required assessment outputs are absent or incomplete. Missing documented duplicate/missing-value issue log. Attrition-risk flags are missing for many employees. Add departmental and gender-level headcount, salary and attrition summaries.'::text, 
   '2026-10-27 15:06:00+00'::timestamptz),

  -- Student: Deekshith
  -- Email: ddeekshith920@gmail.com
  -- Grade: 0/100 (0%)
  ('ddeekshith920@gmail.com'::text, 
   0.0::numeric, 
   0.0::numeric, 
   'The uploaded document has no assessable written content; resubmit the required communication pack.'::text, 
   '2026-10-27 15:06:00+00'::timestamptz),

  -- Student: Gagana.M
  -- Email: mgagana69@gmail.com
  -- Grade: 83/100 (83%)
  ('mgagana69@gmail.com'::text, 
   83.0::numeric, 
   83.0::numeric, 
   'Specific quantified observations and decision reasoning are shown. The required five-slide presentation was not linked.'::text, 
   '2026-10-27 15:06:00+00'::timestamptz),

  -- Student: Hariprasad nayak
  -- Email: hariprasadnayak77280@gmail.com
  -- Grade: 74.5/100 (74.5%)
  ('hariprasadnayak77280@gmail.com'::text, 
   74.5::numeric, 
   74.5::numeric, 
   'Customer onboarding covers process steps and ownership; add clear service-level targets and an evidence-based operating dashboard. Team documents are shared; individual authorship is not confirmed. Communication pack addresses 8/8 stakeholder audiences and identifies PF remediation steps. Replace 53 unresolved bracketed placeholders before any external use. Confirm statutory assumptions and legal wording with a qualified reviewer.'::text, 
   '2026-10-27 15:06:00+00'::timestamptz),

  -- Student: Harsha
  -- Email: harshaabhi56@gmail.com
  -- Grade: 5/100 (5%)
  ('harshaabhi56@gmail.com'::text, 
   5.0::numeric, 
   5.0::numeric, 
   'Most required assessment outputs are absent or incomplete. Missing documented duplicate/missing-value issue log. Attrition-risk flags are missing for many employees. Add departmental and gender-level headcount, salary and attrition summaries.'::text, 
   '2026-10-27 15:06:00+00'::timestamptz),

  -- Student: Hemanth L G
  -- Email: hemantahemanth79@gmail.com
  -- Grade: 69.5/100 (69.5%)
  ('hemantahemanth79@gmail.com'::text, 
   69.5::numeric, 
   69.5::numeric, 
   'E-Battery business pitch covers the six-month pilot; standardise E-Battery versus VoltEdge naming and verify capital-to-revenue assumptions. Team documents are shared; individual authorship is not confirmed. The workbook contains useful evidence, but the decision handover is incomplete. Recommended decisions are missing or incomplete in the worksheet. KPIs and review measures are missing or incomplete. Final management decision summary is incomplete. Stakeholder pack: Communication pack addresses 8/8 stakeholder audiences and identifies PF remediation steps. Confirm statutory assumptions and legal wording with a qualified reviewer.'::text, 
   '2026-10-27 15:06:00+00'::timestamptz),

  -- Student: Hemanth SJ
  -- Email: hemanthsj2003@gmail.com
  -- Grade: 77.5/100 (77.5%)
  ('hemanthsj2003@gmail.com'::text, 
   77.5::numeric, 
   77.5::numeric, 
   'Several calculations and/or summaries are present. No visible exception/cleaning log. Three-month base/upside/downside collection forecast is missing. Specific quantified observations and decision reasoning are shown. The required five-slide presentation was not linked.'::text, 
   '2026-10-27 15:06:00+00'::timestamptz),

  -- Student: Jayashree M
  -- Email: m.jayashree352@gmail.com
  -- Grade: 59.67/100 (59.67%)
  ('m.jayashree352@gmail.com'::text, 
   59.67::numeric, 
   59.67::numeric, 
   'Finance draft identifies fee streams and teacher payroll, but conversational draft text remains and scenario reconciliation is incomplete. Team documents are shared; individual authorship is not confirmed. Some Excel operations are completed, but major deliverables remain open. No visible exception/cleaning log. Three-month base/upside/downside collection forecast is missing. The workbook contains useful evidence, but the decision handover is incomplete. Recommended decisions are missing or incomplete in the worksheet. KPIs and review measures are missing or incomplete. Final management decision summary is incomplete. Stakeholder pack: Communication pack addresses 8/8 stakeholder audiences and identifies PF remediation steps. Replace 34 unresolved bracketed placeholders before any external use. Confirm statutory'::text, 
   '2026-10-27 15:06:00+00'::timestamptz),

  -- Student: Jhenkar A Gowda
  -- Email: jhenkaragowda212@gmail.com
  -- Grade: 56.33/100 (56.33%)
  ('jhenkaragowda212@gmail.com'::text, 
   56.33::numeric, 
   56.33::numeric, 
   'Heritage Weaves documentation covers HR, marketing and finance, but the initial budget/expenses workbook needs stronger arithmetic reconciliation and one consolidated presentation. Some Excel operations are completed, but major deliverables remain open. No visible exception/cleaning log. Three-month base/upside/downside collection forecast is missing. Complete the dashboard with management KPIs. The workbook contains useful evidence, but the decision handover is incomplete. Only 4/5 evidence observations are completed. Final management decision summary is incomplete. The required five-slide presentation was not linked. Stakeholder pack: Communication pack addresses 8/8 stakeholder audiences and identifies PF remediation steps. Replace 25 unresolved bracketed placeholders before any external use.'::text, 
   '2026-10-27 15:06:00+00'::timestamptz),

  -- Student: Mamatha S M
  -- Email: smmamatha910@gmail.com
  -- Grade: 74.33/100 (74.33%)
  ('smmamatha910@gmail.com'::text, 
   74.33::numeric, 
   74.33::numeric, 
   'Operations steps and quality controls are documented; convert the Home Bite KPI targets into a tracked, reconciled outlet dashboard. Team documents are shared; individual authorship is not confirmed. Several calculations and/or summaries are present. Document a specific missing-value and duplicate-order audit. Executive dashboard is incomplete or missing. The workbook contains useful evidence, but the decision handover is incomplete. The required five-slide presentation was not linked.'::text, 
   '2026-10-27 15:06:00+00'::timestamptz),

  -- Student: Nageshwari k
  -- Email: nageshwari1922@gmail.com
  -- Grade: 61.5/100 (61.5%)
  ('nageshwari1922@gmail.com'::text, 
   61.5::numeric, 
   61.5::numeric, 
   'Analytics processes and staffing are specified; test the ₹62,000 operations ceiling against shared HR and finance costs. Team documents are shared; individual authorship is not confirmed. Working charts/data do not yet form a complete, justified management decision. Only 4/5 evidence observations are completed. Recommended decisions are missing or incomplete in the worksheet. KPIs and review measures are missing or incomplete.'::text, 
   '2026-10-27 15:06:00+00'::timestamptz),

  -- Student: Pavan Kumar K L
  -- Email: ppavan50559@gmail.com
  -- Grade: 67.5/100 (67.5%)
  ('ppavan50559@gmail.com'::text, 
   67.5::numeric, 
   67.5::numeric, 
   'Marketing plan sets a ₹40,000 monthly cap; demonstrate student acquisition assumptions and the expected lead-to-admission conversion. Team documents are shared; individual authorship is not confirmed. The workbook contains useful evidence, but the decision handover is incomplete. Recommended decisions are missing or incomplete in the worksheet. KPIs and review measures are missing or incomplete. Final management decision summary is incomplete. Stakeholder pack: Communication pack addresses 8/8 stakeholder audiences and identifies PF remediation steps. Confirm statutory assumptions and legal wording with a qualified reviewer.'::text, 
   '2026-10-27 15:06:00+00'::timestamptz),

  -- Student: Rajesh I N
  -- Email: rajeshin2003@gmail.com
  -- Grade: 63.5/100 (63.5%)
  ('rajeshin2003@gmail.com'::text, 
   63.5::numeric, 
   63.5::numeric, 
   'Seven marketing deliverables give a focused student segment and measurable pilot funnel; validate CAC and order-growth assumptions with trial data. Team documents are shared; individual authorship is not confirmed. Some Excel operations are completed, but major deliverables remain open. ROAS formula uses revenue per customer instead of total revenue; correct it. No separate cleaning/duplicate issue log was evidenced. Add a verified ₹10 lakh allocation with ROAS/CAC justification and one risk.'::text, 
   '2026-10-27 15:06:00+00'::timestamptz),

  -- Student: Rajeshwari Hiremath
  -- Email: rajeshwarihiremath521@gmail.com
  -- Grade: 50.5/100 (50.5%)
  ('rajeshwarihiremath521@gmail.com'::text, 
   50.5::numeric, 
   50.5::numeric, 
   'Some Excel operations are completed, but major deliverables remain open. Expense calculation adds budget and actual expenses, overstating costs. No visible exception/cleaning log. Complete all five finance calculations, including collection gap. Working charts/data do not yet form a complete, justified management decision. Only 3/5 evidence observations are completed. Final management decision summary is incomplete. The required five-slide presentation was not linked.'::text, 
   '2026-10-27 15:06:00+00'::timestamptz),

  -- Student: Rakshith P S
  -- Email: rakshithps4477@gmail.com
  -- Grade: 66.5/100 (66.5%)
  ('rakshithps4477@gmail.com'::text, 
   66.5::numeric, 
   66.5::numeric, 
   'Marketing identifies EV OEM and fleet segments; test conversion, CAC and channel economics against the proposed budget. Team documents are shared; individual authorship is not confirmed. The workbook contains useful evidence, but the decision handover is incomplete. Recommended decisions are missing or incomplete in the worksheet. KPIs and review measures are missing or incomplete. Final management decision summary is incomplete.'::text, 
   '2026-10-27 15:06:00+00'::timestamptz),

  -- Student: Roopesh G C
  -- Email: roopeshgc2003@gmail.com
  -- Grade: 81/100 (81%)
  ('roopeshgc2003@gmail.com'::text, 
   81.0::numeric, 
   81.0::numeric, 
   'Café onboarding document provides workable stages; quantify conversion rates, waiting time and handling of service exceptions. Team documents are shared; individual authorship is not confirmed. Communication pack addresses 8/8 stakeholder audiences and identifies PF remediation steps. Replace 43 unresolved bracketed placeholders before any external use.'::text, 
   '2026-10-27 15:06:00+00'::timestamptz),

  -- Student: Sahana A
  -- Email: sahanaanandaiah@gmail.com
  -- Grade: 80/100 (80%)
  ('sahanaanandaiah@gmail.com'::text, 
   80.0::numeric, 
   80.0::numeric, 
   'NutriHarvest has detailed cross-functional plans and quantified expansion assumptions; substantiate demand, margins and the ₹100 crore capital allocation. The workbook contains useful evidence, but the decision handover is incomplete. Final management decision summary is incomplete. The required five-slide presentation was not linked. Stakeholder pack: Communication pack addresses 5/8 stakeholder audiences and identifies PF remediation steps. Replace 66 unresolved bracketed placeholders before any external use. Confirm statutory'::text, 
   '2026-10-27 15:06:00+00'::timestamptz),

  -- Student: Santhosh C P
  -- Email: santhoshgowda2102@gmail.com
  -- Grade: 54.5/100 (54.5%)
  ('santhoshgowda2102@gmail.com'::text, 
   54.5::numeric, 
   54.5::numeric, 
   'Café financial plan protects reserves and sets out expenses; add sensitivity checks for footfall, average bill and break-even. Team documents are shared; individual authorship is not confirmed. Some Excel operations are completed, but major deliverables remain open. No visible exception/cleaning log. Three-month base/upside/downside collection forecast is missing. Complete the dashboard with management KPIs.'::text, 
   '2026-10-27 15:06:00+00'::timestamptz),

  -- Student: Shivakumar
  -- Email: shivakumar07505@gmail.com
  -- Grade: 65.5/100 (65.5%)
  ('shivakumar07505@gmail.com'::text, 
   65.5::numeric, 
   65.5::numeric, 
   'Battery operations control points and customer data are described; add quantified acceptance criteria and traceable service KPIs. Team documents are shared; individual authorship is not confirmed. The workbook contains useful evidence, but the decision handover is incomplete. Recommended decisions are missing or incomplete in the worksheet. KPIs and review measures are missing or incomplete. Final management decision summary is incomplete.'::text, 
   '2026-10-27 15:06:00+00'::timestamptz),

  -- Student: Shobhitha R
  -- Email: shobithar91@gmail.com
  -- Grade: 55/100 (55%)
  ('shobithar91@gmail.com'::text, 
   55.0::numeric, 
   55.0::numeric, 
   'HR deliverables cover hiring and workplace policies; reconcile headcount/payroll figures and document evidence for proposed HR targets. Team documents are shared; individual authorship is not confirmed. Some Excel operations are completed, but major deliverables remain open. No visible exception/cleaning log. Three-month base/upside/downside collection forecast is missing. Working charts/data do not yet form a complete, justified management decision. Only 3/5 evidence observations are completed. Recommended decisions are missing or incomplete in the worksheet. KPIs and review measures are missing or incomplete.'::text, 
   '2026-10-27 15:06:00+00'::timestamptz),

  -- Student: Sumitha S
  -- Email: sumithasenthil0225@gmail.com
  -- Grade: 66.33/100 (66.33%)
  ('sumithasenthil0225@gmail.com'::text, 
   66.33::numeric, 
   66.33::numeric, 
   'Seven HR policies and the manpower plan cover staffing and compliance; verify payroll totals and statutory assumptions against the master budget. Team documents are shared; individual authorship is not confirmed. The workbook contains useful evidence, but the decision handover is incomplete. Final management decision summary is incomplete. The required five-slide presentation was not linked. Some Excel operations are completed, but major deliverables remain open. Missing documented duplicate/missing-value issue log. Attrition-risk flags are missing for many employees.'::text, 
   '2026-10-27 15:06:00+00'::timestamptz),

  -- Student: Teja Babu K P
  -- Email: tejuteja082@gmail.com
  -- Grade: 53.33/100 (53.33%)
  ('tejuteja082@gmail.com'::text, 
   53.33::numeric, 
   53.33::numeric, 
   'Pinnacle HR compliance templates are detailed; verify applicability to the coaching centre and cost every operating control. Team documents are shared; individual authorship is not confirmed. Most required assessment outputs are absent or incomplete. Missing documented duplicate/missing-value issue log. Attrition-risk flags are missing for many employees. Add departmental and gender-level headcount, salary and attrition summaries. The workbook contains useful evidence, but the decision handover is incomplete. Final management decision summary is incomplete. The required five-slide presentation was not linked. Stakeholder pack: Communication pack addresses 8/8 stakeholder audiences and identifies PF remediation steps. Replace 78 unresolved bracketed placeholders before any external use.'::text, 
   '2026-10-27 15:06:00+00'::timestamptz),

  -- Student: THANUJA A M
  -- Email: thanukrishna.am@gmail.com
  -- Grade: 56.67/100 (56.67%)
  ('thanukrishna.am@gmail.com'::text, 
   56.67::numeric, 
   56.67::numeric, 
   'Wide cross-functional café pack covers finance, marketing and operations; reconcile assumptions into one master decision sheet. Team documents are shared; individual authorship is not confirmed. Most required assessment outputs are absent or incomplete. Attrition-risk flags are missing for many employees. Add departmental and gender-level headcount, salary and attrition summaries. Two HR charts and three actions are not evidenced. The workbook contains useful evidence, but the decision handover is incomplete. Final management decision summary is incomplete. The required five-slide presentation was not linked. Stakeholder pack: Communication pack addresses 8/8 stakeholder audiences and identifies PF remediation steps. Replace 29 unresolved bracketed placeholders before any external use. Confirm statutory'::text, 
   '2026-10-27 15:06:00+00'::timestamptz),

  -- Student: Vaishnavi G
  -- Email: vaishnavigopinath03@gmail.com
  -- Grade: 65.33/100 (65.33%)
  ('vaishnavigopinath03@gmail.com'::text, 
   65.33::numeric, 
   65.33::numeric, 
   'Customer onboarding, service delivery and quality procedures are mapped; add measurable cycle times and exception/escalation data. Team documents are shared; individual authorship is not confirmed. Several calculations and/or summaries are present. Document a specific missing-value and duplicate-order audit. Executive dashboard is incomplete or missing. Working charts/data do not yet form a complete, justified management decision. Recommended decisions are missing or incomplete in the worksheet. KPIs and review measures are missing or incomplete. Final management decision summary is incomplete.'::text, 
   '2026-10-27 15:06:00+00'::timestamptz),

  -- Student: Varsha.J
  -- Email: varshajaishankar06@gmail.com
  -- Grade: 57.67/100 (57.67%)
  ('varshajaishankar06@gmail.com'::text, 
   57.67::numeric, 
   57.67::numeric, 
   'Company model and 43-slide Home Bite deck are coherent; reconcile the two shared planning workbooks with the financial assumptions. Team documents are shared; individual authorship is not confirmed. Some Excel operations are completed, but major deliverables remain open. Missing documented duplicate/missing-value issue log. Attrition-risk flags are missing for many employees. Working charts/data do not yet form a complete, justified management decision. Recommended decisions are missing or incomplete in the worksheet. KPIs and review measures are missing or incomplete. The required five-slide presentation was not linked.'::text, 
   '2026-10-27 15:06:00+00'::timestamptz),

  -- Student: Varshini NB
  -- Email: varshinivarshanb@gmail.com
  -- Grade: 55.33/100 (55.33%)
  ('varshinivarshanb@gmail.com'::text, 
   55.33::numeric, 
   55.33::numeric, 
   'Seven HR deliverables include inclusion-sensitive policies and a KPI scorecard; test staffing budgets and legal assumptions before use. Team documents are shared; individual authorship is not confirmed. Most required assessment outputs are absent or incomplete. Missing documented duplicate/missing-value issue log. Attrition-risk flags are missing for many employees. Add departmental and gender-level headcount, salary and attrition summaries. The workbook contains useful evidence, but the decision handover is incomplete. The required five-slide presentation was not linked.'::text, 
   '2026-10-27 15:06:00+00'::timestamptz),

  -- Student: Varshitha H S
  -- Email: varshithahs626@gmail.com
  -- Grade: 70/100 (70%)
  ('varshithahs626@gmail.com'::text, 
   70.0::numeric, 
   70.0::numeric, 
   'Reworked Heritage Weaves plans align pricing, unit cost and 36-person staffing; add an executive slide deck and verify projections against confirmed orders. Substantial working analysis is present. Document a specific missing-value and duplicate-order audit. Executive dashboard is incomplete or missing. Working charts/data do not yet form a complete, justified management decision. Recommended decisions are missing or incomplete in the worksheet. KPIs and review measures are missing or incomplete. Final management decision summary is incomplete.'::text, 
   '2026-10-27 15:06:00+00'::timestamptz),

  -- Student: Vinod H A
  -- Email: vinodvinu3123@gmail.com
  -- Grade: 43.67/100 (43.67%)
  ('vinodvinu3123@gmail.com'::text, 
   43.67::numeric, 
   43.67::numeric, 
   'Business concept and pitch are present; consolidate operating assumptions and verify annual fee-income versus staff cost. Team documents are shared; individual authorship is not confirmed. Some Excel operations are completed, but major deliverables remain open. No visible exception/cleaning log. Three-month base/upside/downside collection forecast is missing. Complete the dashboard with management KPIs. Working charts/data do not yet form a complete, justified management decision. Only 1/5 evidence observations are completed. Recommended decisions are missing or incomplete in the worksheet. KPIs and review measures are missing or incomplete.'::text, 
   '2026-10-27 15:06:00+00'::timestamptz),

  -- Student: Yamuna
  -- Email: yamunamanjunath123@gmail.com
  -- Grade: 59/100 (59%)
  ('yamunamanjunath123@gmail.com'::text, 
   59.0::numeric, 
   59.0::numeric, 
   'Finance plan addresses capital, cash control and approval limits; reconcile the six-month expenses and illustrate downside cash-flow sensitivity. Team documents are shared; individual authorship is not confirmed. Some Excel operations are completed, but major deliverables remain open. No visible exception/cleaning log. Three-month base/upside/downside collection forecast is missing. The workbook contains useful evidence, but the decision handover is incomplete. Recommended decisions are missing or incomplete in the worksheet. KPIs and review measures are missing or incomplete. Final management decision summary is incomplete.'::text, 
   '2026-10-27 15:06:00+00'::timestamptz),

  -- Student: Yeshashwini G
  -- Email: yashaswinigowda601@gmail.com
  -- Grade: 75/100 (75%)
  ('yashaswinigowda601@gmail.com'::text, 
   75.0::numeric, 
   75.0::numeric, 
   'Pinnacle proposal provides courses, fees and staffing; reconcile teacher costs, enrolment and full-year cash flow with the common model. Team documents are shared; individual authorship is not confirmed. The workbook contains useful evidence, but the decision handover is incomplete. Only 4/5 evidence observations are completed. The required five-slide presentation was not linked. Stakeholder pack: Communication pack addresses 8/8 stakeholder audiences and identifies PF remediation steps. Replace 200 unresolved bracketed placeholders before any external use.'::text, 
   '2026-10-27 15:06:00+00'::timestamptz)

) AS v(email, grade, grade_percentage, feedback, graded_date)
JOIN public.users u ON lower(u.email) = lower(v.email) AND u.role = 'learner' AND u."isActive" = true
JOIN public.college_assignments ca ON ca.title = 'Company Formation & Performance' AND ca.is_deleted = false
WHERE cla.learner_id = u.id 
  AND cla.assignment_id = ca.assignment_id
  AND cla.status = 'submitted';  -- Only update if still in submitted status

COMMIT;

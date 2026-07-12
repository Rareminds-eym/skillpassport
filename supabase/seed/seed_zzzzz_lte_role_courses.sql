-- Keep reset data aligned with the LTE client seed learning path.
WITH course_path AS (
  SELECT '[
    {"course_id":"crs-aiml-tel-l1","title":"Telemetry Evidence Readiness for AI/ML Anomaly Detection","description":"You validate whether telemetry evidence is ready for AI/ML anomaly detection, identify visible readiness gaps, separate AI/ML responsibility from software and embedded dependencies, and prepare an evidence-based readiness or escalation note.","level":"Beginner","duration":"18 hours","platform":"lte"},
    {"course_id":"crs-aiml-tel-l2","title":"Baseline Anomaly Detection Workflow for Telemetry Data","description":"You prepare a controlled beginner-level baseline anomaly workflow using validated telemetry fields, document field choices, handle remaining missing values through a simple stated rule, test baseline anomaly logic, review suspicious outputs, and communicate limitations without claiming a production model.","level":"Beginner","duration":"20 hours","platform":"lte"},
    {"course_id":"crs-aiml-tel-l3","title":"Real-Time AI/ML Integration for Telemetry","description":"You prepare a model integration-readiness plan by checking latency, input and output mapping, C++ and Qt handoff expectations, real-time and offline differences, model-output usability, and integration risks.","level":"Intermediate","duration":"20 hours","platform":"lte"},
    {"course_id":"crs-aiml-tel-l4","title":"Predictive Analytics and LLM Reporting for Telemetry","description":"You extend anomaly outputs into predictive insight and reporting workflows, validate automation boundaries, review LLM-generated summaries, and control risks around false insight, weak explanation, and decision misuse.","level":"Intermediate","duration":"21 hours","platform":"lte"},
    {"course_id":"crs-aiml-tel-l5","title":"End-to-End AI/ML Telemetry Decision-Support Validation","description":"You evaluate an end-to-end AI/ML telemetry decision-support workflow across data readiness, baseline modelling, integration handoff, reporting, governance, risk, and final stakeholder decision-readiness.","level":"Advanced","duration":"22 hours","platform":"lte"}
  ]'::jsonb AS courses
)
UPDATE public.personal_assessment_results AS result
SET
  platform_courses = course_path.courses,
  career_fit = jsonb_set(result.career_fit, '{clusters,0,specificRoles,0,recommendedCourses}', course_path.courses, true),
  gemini_results = jsonb_set(
    jsonb_set(result.gemini_results, '{careerFit,clusters,0,specificRoles,0,recommendedCourses}', course_path.courses, true),
    '{platformCourses}',
    course_path.courses,
    true
  )
FROM course_path
WHERE result.id IN (
  '7e749049-8e11-5f77-b993-1827dde01af6'::uuid,
  '9877083a-2fcc-58fc-ac59-78abb2407d5c'::uuid
)
AND result.career_fit #>> '{clusters,0,specificRoles,0,name}' = 'Junior AI/ML Telemetry Engineer';

-- Remove previously generated generic RAG recommendations so they cannot
-- override the seeded LTE course catalog for these assessment results.
DELETE FROM public.learner_course_recommendations
WHERE assessment_result_id IN (
  '7e749049-8e11-5f77-b993-1827dde01af6'::uuid,
  '9877083a-2fcc-58fc-ac59-78abb2407d5c'::uuid
);

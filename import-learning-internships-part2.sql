-- INT011: Weather Watch Intern
INSERT INTO public.opportunities (
  title, job_title, company_name, department, sector, exposure_type,
  total_hours, duration_days, what_youll_learn, what_youll_do,
  final_artifact_type, final_artifact_description, mentor_bio, requirements,
  safety_note, parent_role, cost_inr, employment_type, location, mode,
  is_active, recruiter_id, status, posted_date
) VALUES (
  'Weather Watch Intern: Local Forecast Lab',
  'Weather Watch Intern: Local Forecast Lab',
  'Science Program',
  'Science',
  'Science',
  'Mini Problem',
  6,
  10,
  'Weather variables; Recording data; Simple prediction patterns',
  'Track temp/cloud/rain daily; Plot a graph; Share 3 insights',
  'diary + slides',
  'Weather diary + 3-slide summary',
  'Science teacher / meteorology volunteer',
  '["None"]'::jsonb,
  'Observations from home/school only',
  'Consent only',
  0,
  'Internship',
  'Remote',
  'Remote',
  true,
  '902d03ef-71c0-4781-8e09-c2ef46511cbb',
  'published',
  NOW()
);

-- INT012: Young Lab Safety Intern
INSERT INTO public.opportunities (
  title, job_title, company_name, department, sector, exposure_type,
  total_hours, duration_weeks, what_youll_learn, what_youll_do,
  final_artifact_type, final_artifact_description, mentor_bio, requirements,
  safety_note, parent_role, cost_inr, employment_type, location, mode,
  is_active, recruiter_id, status, posted_date
) VALUES (
  'Young Lab Safety Intern',
  'Young Lab Safety Intern',
  'Science Program',
  'Science',
  'Science',
  'Shadow & See',
  3,
  NULL,
  'Lab layout and rules; Safety symbols; Why safety matters',
  'Shadow lab setup; Identify 8–10 safety items; Make a safety infographic',
  'infographic',
  'Lab safety infographic',
  'Lab assistant / science teacher',
  '["None"]'::jsonb,
  'No chemical handling',
  'Consent only',
  0,
  'Internship',
  'On-site',
  'In-person',
  true,
  '902d03ef-71c0-4781-8e09-c2ef46511cbb',
  'published',
  NOW()
);

-- INT013: Space Explorer Research Intern
INSERT INTO public.opportunities (
  title, job_title, company_name, department, sector, exposure_type,
  total_hours, duration_weeks, what_youll_learn, what_youll_do,
  final_artifact_type, final_artifact_description, mentor_bio, requirements,
  safety_note, parent_role, cost_inr, employment_type, location, mode,
  is_active, recruiter_id, status, posted_date
) VALUES (
  'Space Explorer Research Intern',
  'Space Explorer Research Intern',
  'Science Program',
  'Science',
  'Science',
  'Mini Problem',
  6.5,
  2,
  'How missions are planned; Scientific goals of space travel; Presenting research',
  'Pick one mission; Research goals/tools/results; Build a 3-slide explainer',
  'slides + reflection',
  'Slide explainer + reflection',
  'Astronomy educator / physics teacher',
  '["None"]'::jsonb,
  'Online research only',
  'Consent only',
  0,
  'Internship',
  'Remote',
  'Remote',
  true,
  '902d03ef-71c0-4781-8e09-c2ef46511cbb',
  'published',
  NOW()
);

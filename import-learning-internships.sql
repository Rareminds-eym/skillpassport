-- Import Learning Internships from school_student_learning_internships.xlsx
-- Recruiter ID: 902d03ef-71c0-4781-8e09-c2ef46511cbb

-- INT001: Clinic Flow Mapper
INSERT INTO public.opportunities (
  title, job_title, company_name, department, sector, exposure_type,
  total_hours, duration_weeks, schedule_note, what_youll_learn, what_youll_do,
  final_artifact_type, final_artifact_description, mentor_bio, requirements,
  safety_note, parent_role, cost_inr, cost_note, employment_type, location, mode,
  is_active, recruiter_id, status, posted_date
) VALUES (
  'Clinic Flow Mapper: How Care Moves',
  'Clinic Flow Mapper: How Care Moves',
  'Health & Life Sciences Program',
  'Health & Life Sciences',
  'Health & Life Sciences',
  'Shadow & See',
  3.5,
  NULL,
  'Single supervised visit',
  'How clinics organize patient care; Roles of staff in the care journey; Basics of systems thinking',
  'Observe reception→waiting→consultation flow; Ask 3–5 mentor-guided questions; Draft a simple flowchart',
  'flowchart + reflection',
  'Clinic process flowchart + 1-page reflection',
  'Clinic administrator / nurse educator',
  '["Comfort in medical settings"]'::jsonb,
  'Supervised at all times; no patient data accessed',
  'Consent + drop/pickup',
  0,
  'Travel if needed',
  'Internship',
  'On-site',
  'In-person',
  true,
  '902d03ef-71c0-4781-8e09-c2ef46511cbb',
  'published',
  NOW()
);

-- INT002: First-Aid Awareness Intern
INSERT INTO public.opportunities (
  title, job_title, company_name, department, sector, exposure_type,
  total_hours, duration_weeks, schedule_note, what_youll_learn, what_youll_do,
  final_artifact_type, final_artifact_description, mentor_bio, requirements,
  safety_note, parent_role, cost_inr, cost_note, employment_type, location, mode,
  is_active, recruiter_id, status, posted_date
) VALUES (
  'First-Aid Awareness Intern',
  'First-Aid Awareness Intern',
  'Health & Wellbeing Program',
  'Health & Wellbeing',
  'Health & Wellbeing',
  'Try a Task',
  7,
  2,
  '3–4 hrs/week',
  'Basic first-aid responses; When to seek adult help; Safety and prevention habits',
  'Attend 1 mentor session; Practice safe, non-medical demonstrations; Create awareness material for peers',
  'poster/video',
  'First-aid poster or 2-min awareness video',
  'First-aid trainer / school nurse',
  '["None"]'::jsonb,
  'No invasive procedures; simulation only',
  'Consent only',
  0,
  NULL,
  'Internship',
  'Hybrid',
  'Flexible',
  true,
  '902d03ef-71c0-4781-8e09-c2ef46511cbb',
  'published',
  NOW()
);

-- INT003: Nutrition Label Detective
INSERT INTO public.opportunities (
  title, job_title, company_name, department, sector, exposure_type,
  total_hours, duration_weeks, what_youll_learn, what_youll_do,
  final_artifact_type, final_artifact_description, mentor_bio, requirements,
  safety_note, parent_role, cost_inr, employment_type, location, mode,
  is_active, recruiter_id, status, posted_date
) VALUES (
  'Nutrition Label Detective: Smart Snacks',
  'Nutrition Label Detective: Smart Snacks',
  'Health & Life Skills Program',
  'Health & Life Skills',
  'Health & Life Skills',
  'Mini Problem',
  7,
  2,
  'Reading food labels; Sugar/fat/salt basics; Making healthier choices',
  'Collect labels of 8–10 snacks; Compare nutrients in a table; Design a ''best choices'' guide',
  'guide + reflection',
  'Snack comparison guide + reflection',
  'Nutrition educator / biology teacher',
  '["None"]'::jsonb,
  'No dieting advice; health-positive framing',
  'Help gather labels',
  0,
  'Internship',
  'Remote',
  'Remote',
  true,
  '902d03ef-71c0-4781-8e09-c2ef46511cbb',
  'published',
  NOW()
);

-- INT004: Mindfulness Buddy Intern
INSERT INTO public.opportunities (
  title, job_title, company_name, department, sector, exposure_type,
  total_hours, duration_weeks, what_youll_learn, what_youll_do,
  final_artifact_type, final_artifact_description, mentor_bio, requirements,
  safety_note, parent_role, cost_inr, employment_type, location, mode,
  is_active, recruiter_id, status, posted_date
) VALUES (
  'Mindfulness Buddy Intern: Calm Corner',
  'Mindfulness Buddy Intern: Calm Corner',
  'Wellbeing Program',
  'Wellbeing',
  'Wellbeing',
  'Community Impact',
  5.5,
  NULL,
  'Simple mindfulness tools; Supporting peers kindly; Building calm routines',
  'Learn 2–3 breathing/grounding exercises; Help run a 5-day calm corner; Collect peer feedback',
  'playbook + impact note',
  'Calm-corner playbook + impact note',
  'Counsellor / wellbeing coach',
  '["None"]'::jsonb,
  'Not therapy; referral to adults if needed',
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

-- INT005: Public Health Poster Designer
INSERT INTO public.opportunities (
  title, job_title, company_name, department, sector, exposure_type,
  total_hours, duration_weeks, what_youll_learn, what_youll_do,
  final_artifact_type, final_artifact_description, mentor_bio, requirements,
  safety_note, parent_role, cost_inr, employment_type, location, mode,
  is_active, recruiter_id, status, posted_date
) VALUES (
  'Public Health Poster Designer',
  'Public Health Poster Designer',
  'Health + Design Program',
  'Health + Design',
  'Health + Design',
  'Try a Task',
  5,
  1,
  'Turning health info into visuals; Clear messaging; Design basics',
  'Pick 1 health theme; Draft 2 poster variants; Revise with mentor feedback',
  'poster set',
  'Final poster set (print or digital)',
  'Public health staff / art teacher',
  '["None"]'::jsonb,
  'No fear-based messaging',
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

-- INT006: Eco Audit Intern
INSERT INTO public.opportunities (
  title, job_title, company_name, department, sector, exposure_type,
  total_hours, duration_weeks, what_youll_learn, what_youll_do,
  final_artifact_type, final_artifact_description, mentor_bio, requirements,
  safety_note, parent_role, cost_inr, employment_type, location, mode,
  is_active, recruiter_id, status, posted_date
) VALUES (
  'Eco Audit Intern: Waste & Water Detective',
  'Eco Audit Intern: Waste & Water Detective',
  'Environment & Sustainability Program',
  'Environment & Sustainability',
  'Environment & Sustainability',
  'Solve a Mini Problem',
  9,
  2,
  'Measuring waste/water use; Simple data charts; Practical eco actions',
  'Track waste/water for 5 days; Categorize + count; Make 2 graphs + 3 recommendations',
  'report + poster',
  'Eco audit report + awareness poster',
  'Sustainability educator / eco-club lead',
  '["None"]'::jsonb,
  'Safe household/school observations only',
  'Consent + help access bins if needed',
  0,
  'Internship',
  'Hybrid',
  'Flexible',
  true,
  '902d03ef-71c0-4781-8e09-c2ef46511cbb',
  'published',
  NOW()
);

-- INT007: Tree Census Intern
INSERT INTO public.opportunities (
  title, job_title, company_name, department, sector, exposure_type,
  total_hours, duration_weeks, what_youll_learn, what_youll_do,
  final_artifact_type, final_artifact_description, mentor_bio, requirements,
  safety_note, parent_role, cost_inr, employment_type, location, mode,
  is_active, recruiter_id, status, posted_date
) VALUES (
  'Tree Census Intern: Green Mapper',
  'Tree Census Intern: Green Mapper',
  'Environment Program',
  'Environment',
  'Environment',
  'Mini Problem',
  6.5,
  2,
  'Tree types & benefits; Counting/mapping basics; Community ecology',
  'Survey trees in a safe area; Record species/height estimates; Mark on a simple map',
  'map + infographic',
  'Tree census map + summary infographic',
  'Botanist volunteer / science teacher',
  '["None"]'::jsonb,
  'Surveys only in safe, adult-approved areas',
  'Approve survey route',
  0,
  'Internship',
  'On-site',
  'In-person',
  true,
  '902d03ef-71c0-4781-8e09-c2ef46511cbb',
  'published',
  NOW()
);

-- INT008: Plastic-Free Campaign Intern
INSERT INTO public.opportunities (
  title, job_title, company_name, department, sector, exposure_type,
  total_hours, duration_weeks, what_youll_learn, what_youll_do,
  final_artifact_type, final_artifact_description, mentor_bio, requirements,
  safety_note, parent_role, cost_inr, employment_type, location, mode,
  is_active, recruiter_id, status, posted_date
) VALUES (
  'Plastic-Free Campaign Intern',
  'Plastic-Free Campaign Intern',
  'Environment Program',
  'Environment',
  'Environment',
  'Community Impact',
  7,
  2,
  'Plastic impacts; Campaign planning; Communicating change',
  'Identify 3 plastic hotspots; Design campaign materials; Run a 1-week challenge',
  'campaign kit + report',
  'Campaign kit + impact report',
  'NGO staff / eco-club mentor',
  '["None"]'::jsonb,
  'No shaming; positive nudges only',
  'Consent only',
  0,
  'Internship',
  'Hybrid',
  'Flexible',
  true,
  '902d03ef-71c0-4781-8e09-c2ef46511cbb',
  'published',
  NOW()
);

-- INT009: School Garden Apprentice
INSERT INTO public.opportunities (
  title, job_title, company_name, department, sector, exposure_type,
  total_hours, duration_weeks, what_youll_learn, what_youll_do,
  final_artifact_type, final_artifact_description, mentor_bio, requirements,
  safety_note, parent_role, cost_inr, employment_type, location, mode,
  is_active, recruiter_id, status, posted_date
) VALUES (
  'School Garden Apprentice',
  'School Garden Apprentice',
  'Environment Program',
  'Environment',
  'Environment',
  'Try a Task',
  7,
  2,
  'Plant care basics; Composting and soil; Observing growth',
  'Assist in planting/watering; Track growth in a log; Create care cards for 5 plants',
  'handbook + log',
  'Plant-care handbook + growth log',
  'Garden coordinator / biology teacher',
  '["None"]'::jsonb,
  'Gloves/tools supervised',
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

-- INT010: Biodiversity Photo Scout
INSERT INTO public.opportunities (
  title, job_title, company_name, department, sector, exposure_type,
  total_hours, duration_weeks, what_youll_learn, what_youll_do,
  final_artifact_type, final_artifact_description, mentor_bio, requirements,
  safety_note, parent_role, cost_inr, employment_type, location, mode,
  is_active, recruiter_id, status, posted_date
) VALUES (
  'Biodiversity Photo Scout: Mini Field Guide',
  'Biodiversity Photo Scout: Mini Field Guide',
  'Environment + Media Program',
  'Environment + Media',
  'Environment + Media',
  'Try a Task',
  5.5,
  2,
  'Identifying local species; Ethical nature photography; Cataloging observations',
  'Photograph 10 local species; Note habitat/behavior; Assemble a mini guide',
  'field guide',
  'Digital/print mini field guide',
  'Naturalist / photography mentor',
  '["Phone camera ok"]'::jsonb,
  'No disturbing wildlife',
  'Approve locations',
  0,
  'Internship',
  'On-site',
  'In-person',
  true,
  '902d03ef-71c0-4781-8e09-c2ef46511cbb',
  'published',
  NOW()
);

-- Target database: SkillPassport. Offline demo fixture; not executed.
BEGIN;


INSERT INTO public.organizations (id,name,organization_type,is_active,approval_status,account_status)
VALUES ('e2dc7929-32e8-598e-89c8-9adb60aebcf0','Kaveri Institute of Engineering','college',true,'approved','active') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.programs (id,name,code,degree_level,status,metadata)
VALUES ('9ed508fd-3c2d-5e69-b43b-1032d7f859e1','B.Tech in Chemical Engineering','BTECH-ENV-CHEM-DEMO','Undergraduate','active','{"demo": true, "seedPackage": "arjun_environmental_engineering", "syntheticIdentity": true}'::jsonb) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.users (id,email,"organizationId","firstName","lastName",role,"isActive",metadata)
VALUES ('77feba55-cc92-5f00-9ff6-49df5ec581b3','arjun.srinivasan27@example.com','e2dc7929-32e8-598e-89c8-9adb60aebcf0','Arjun','Srinivasan','learner',true,'{"demo": true, "seedPackage": "arjun_environmental_engineering", "syntheticIdentity": true}'::jsonb) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.users_shadow (id,email,created_at,updated_at)
VALUES ('77feba55-cc92-5f00-9ff6-49df5ec581b3','arjun.srinivasan27@example.com',now(),now()) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.organization_members (user_id,organization_id,role,status,created_at,updated_at)
VALUES ('77feba55-cc92-5f00-9ff6-49df5ec581b3','e2dc7929-32e8-598e-89c8-9adb60aebcf0','member','active',now(),now()) ON CONFLICT (user_id,organization_id) DO NOTHING;
INSERT INTO public.learners (id,user_id,email,name,learner_type,college_id,college_school_name,program_id,course_name,branch_field,grade,semester,section,roll_number,approval_status,bio,metadata)
VALUES (coalesce((SELECT id FROM public.learners WHERE user_id='77feba55-cc92-5f00-9ff6-49df5ec581b3' AND email='arjun.srinivasan27@example.com'),'77feba55-cc92-5f00-9ff6-49df5ec581b3'::uuid),'77feba55-cc92-5f00-9ff6-49df5ec581b3','arjun.srinivasan27@example.com','Arjun Srinivasan','college_student','e2dc7929-32e8-598e-89c8-9adb60aebcf0','Kaveri Institute of Engineering','9ed508fd-3c2d-5e69-b43b-1032d7f859e1','B.Tech in Chemical Engineering','B.Tech in Chemical Engineering','UG',5,'A','KEI24EC027','approved',
'Third-year engineering learner interested in water-quality laboratory evidence, treatment processes and environmental monitoring.','{"demo": true, "seedPackage": "arjun_environmental_engineering", "syntheticIdentity": true}'::jsonb) ON CONFLICT (id) DO UPDATE SET email=EXCLUDED.email,name=EXCLUDED.name,learner_type=EXCLUDED.learner_type,college_id=EXCLUDED.college_id,college_school_name=EXCLUDED.college_school_name,program_id=EXCLUDED.program_id,course_name=EXCLUDED.course_name,branch_field=EXCLUDED.branch_field,grade=EXCLUDED.grade,semester=EXCLUDED.semester,section=EXCLUDED.section,roll_number=EXCLUDED.roll_number,approval_status=EXCLUDED.approval_status,bio=EXCLUDED.bio,metadata=EXCLUDED.metadata;
INSERT INTO public.education (id,learner_id,degree,department,university,year_of_passing,approval_status)
VALUES ('564e0f63-2e32-540c-9c7b-d56ad50f7cf9',(SELECT id FROM public.learners WHERE user_id='77feba55-cc92-5f00-9ff6-49df5ec581b3' AND email='arjun.srinivasan27@example.com'),'B.Tech in Chemical Engineering','Chemical Engineering','Kaveri Institute of Engineering','2028','approved') ON CONFLICT (id) DO NOTHING;


INSERT INTO public.skills (id,learner_id,name,type,level,description,verified,enabled,approval_status,proficiency_level) VALUES ('4a945ec8-b7fd-5b74-8826-e560e9b13f5b',(SELECT id FROM public.learners WHERE user_id='77feba55-cc92-5f00-9ff6-49df5ec581b3' AND email='arjun.srinivasan27@example.com'),'Water-quality data interpretation','technical',2,'Illustrative academic skill in a synthetic demo profile',false,true,'pending','Beginner') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.skills (id,learner_id,name,type,level,description,verified,enabled,approval_status,proficiency_level) VALUES ('31f52d5d-aa9d-55c8-b92a-7ce0328675db',(SELECT id FROM public.learners WHERE user_id='77feba55-cc92-5f00-9ff6-49df5ec581b3' AND email='arjun.srinivasan27@example.com'),'Spreadsheet data validation','technical',2,'Illustrative academic skill in a synthetic demo profile',false,true,'pending','Beginner') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.skills (id,learner_id,name,type,level,description,verified,enabled,approval_status,proficiency_level) VALUES ('0c54f157-29c6-5312-85ff-f0f24b2d40e5',(SELECT id FROM public.learners WHERE user_id='77feba55-cc92-5f00-9ff6-49df5ec581b3' AND email='arjun.srinivasan27@example.com'),'Treatment process fundamentals','technical',2,'Illustrative academic skill in a synthetic demo profile',false,true,'pending','Beginner') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.skills (id,learner_id,name,type,level,description,verified,enabled,approval_status,proficiency_level) VALUES ('52fafe50-0194-5389-b11f-e4be425d8f64',(SELECT id FROM public.learners WHERE user_id='77feba55-cc92-5f00-9ff6-49df5ec581b3' AND email='arjun.srinivasan27@example.com'),'Technical report writing','technical',2,'Illustrative academic skill in a synthetic demo profile',false,true,'pending','Beginner') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.projects (id,learner_id,title,description,start_date,end_date,tech_stack,approval_status,enabled,role)
VALUES ('85823697-a7a2-5928-befa-4687cfcdda5c',(SELECT id FROM public.learners WHERE user_id='77feba55-cc92-5f00-9ff6-49df5ec581b3' AND email='arjun.srinivasan27@example.com'),'Campus Water Quality Evidence Review (Demo)',
'Academic demonstration: validate a sample dataset, compare pH and dissolved oxygen, document evidence limitations and propose supervised follow-up monitoring.',
'2026-08-01','2026-10-15',ARRAY['Spreadsheets','Data validation','Water-quality interpretation'],'pending',true,'Student investigator') ON CONFLICT (id) DO NOTHING;

COMMIT;

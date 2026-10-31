-- LOCAL ONLY: synchronize existing Soundarya learners to the supplied production snapshot.
-- Source: learners_rows.csv, programs_rows.csv, departments_rows.csv, program_sections_rows.csv
-- exported/provided 2026-10-30. This is not a live production synchronization.
-- Do not run against production. Run after local organization, academic and learner seeds.
-- Copies exported academic fields exactly, including NULLs and incomplete mappings.
-- Does not insert learners, change identity/email, or modify attendance/licenses.
BEGIN;
-- Sync the two production departments; learners reach departments through programs.
-- Keep local audit ownership intact; do not copy production user references.
DO $department_guard$
BEGIN
 IF NOT EXISTS (SELECT 1 FROM public.organizations WHERE id='284c9ed9-cd13-584d-b5bc-e198866b917b'::uuid)
 THEN RAISE EXCEPTION 'Seed the local Soundarya organization first'; END IF;
 IF EXISTS (SELECT 1 FROM public.departments
 WHERE id IN ('6bf040f0-70d4-5b10-ae17-acde09b23d61'::uuid,'e61f768c-b51e-57c7-a600-96161edaf0bd'::uuid)
 AND (college_id IS DISTINCT FROM '284c9ed9-cd13-584d-b5bc-e198866b917b'::uuid OR school_id IS NOT NULL))
 THEN RAISE EXCEPTION 'Department ID belongs to another institution; reconcile locally first'; END IF;
END;
$department_guard$;
INSERT INTO public.departments (id, school_id, college_id, name, code, description, status, metadata) VALUES
 ('6bf040f0-70d4-5b10-ae17-acde09b23d61', NULL, '284c9ed9-cd13-584d-b5bc-e198866b917b', 'Department of Computer Applications', 'MCA', 'Master of Computer Applications department', 'active', '{"program": "Master of Computer Applications", "seeded_for": "Soundarya Institute of Management and Science", "short_name": "MCA"}'::jsonb),
 ('e61f768c-b51e-57c7-a600-96161edaf0bd', NULL, '284c9ed9-cd13-584d-b5bc-e198866b917b', 'Department of Business Administration', 'MBA', 'Master of Business Administration department', 'active', '{"program": "Master of Business Administration", "seeded_for": "Soundarya Institute of Management and Science", "short_name": "MBA"}'::jsonb)
ON CONFLICT (id) DO UPDATE SET
 school_id=EXCLUDED.school_id, college_id=EXCLUDED.college_id,
 name=EXCLUDED.name, code=EXCLUDED.code, description=EXCLUDED.description,
 status=EXCLUDED.status, metadata=EXCLUDED.metadata, updated_at=now();

CREATE TEMP TABLE soundarya_production_learner_snapshot (
 id uuid PRIMARY KEY, email text, college_id uuid, program_id uuid,
 semester integer, section text, program_section_id uuid, college_class_id uuid,
 specialization text, course_name text
) ON COMMIT DROP;
INSERT INTO soundarya_production_learner_snapshot VALUES
  ('001d6727-c673-40c8-8592-ff2665e35eaf', 'varshithahs626@gmail.com', '284c9ed9-cd13-584d-b5bc-e198866b917b', '25e1410b-bb26-40fe-abda-79a4a03925a0', '4', 'A', NULL, NULL, 'Business Analytics', 'Master of Business Administration'),
  ('02fa3520-3233-4ca6-a130-fb17ef66f8b7', 'rakshithps4477@gmail.com', '284c9ed9-cd13-584d-b5bc-e198866b917b', '908a00ad-5a12-477c-a4a5-518ca88f4b3a', '4', 'A', NULL, NULL, 'Marketing', 'Master of Business Administration'),
  ('03e32968-c238-4e59-9986-d7a9f618dc40', 'lavanya13142003@gmail.com', '284c9ed9-cd13-584d-b5bc-e198866b917b', '7a600558-ebc0-4084-8a6b-1e580bf2c385', '4', 'A', NULL, NULL, NULL, 'Master Of Computer Application'),
  ('08417faa-9518-4ec8-8c02-6b35d1a32444', 'm.jayashree352@gmail.com', '284c9ed9-cd13-584d-b5bc-e198866b917b', 'f9a7f695-5625-4a7b-a691-6aaa86308f1a', '4', 'A', NULL, NULL, 'Finance', 'Master of Business Administration'),
  ('102993cd-9a16-4e51-97b7-fb73f039bdfb', 'hemanthsj2003@gmail.com', '284c9ed9-cd13-584d-b5bc-e198866b917b', '908a00ad-5a12-477c-a4a5-518ca88f4b3a', '4', 'A', NULL, NULL, 'Marketing', 'Master of Business Administration'),
  ('106e8587-b7b3-5416-b40d-568288b0b0d5', '7858e5c2@dismail.top', '284c9ed9-cd13-584d-b5bc-e198866b917b', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
  ('11a57fb7-5da6-48af-a271-b42b95650590', 'abhikdabhi@gmail.com', '284c9ed9-cd13-584d-b5bc-e198866b917b', '908a00ad-5a12-477c-a4a5-518ca88f4b3a', '4', 'A', NULL, NULL, 'Marketing', 'Master of Business Administration'),
  ('1226f653-109d-5f8c-bba9-4e623b39ed64', 'varungb04@gmail.com', '284c9ed9-cd13-584d-b5bc-e198866b917b', '908a00ad-5a12-477c-a4a5-518ca88f4b3a', '4', 'A', NULL, NULL, 'Marketing', 'Master of Business Administration'),
  ('12dfa911-d489-4532-a219-efd474249edd', 'hemanthgowdaa755@gmail.com', '284c9ed9-cd13-584d-b5bc-e198866b917b', '908a00ad-5a12-477c-a4a5-518ca88f4b3a', '4', 'A', NULL, NULL, 'Marketing', NULL),
  ('1b737699-3612-4dd2-a918-ea731ff7967f', 'cchaithran698@gmail.com', '284c9ed9-cd13-584d-b5bc-e198866b917b', '908a00ad-5a12-477c-a4a5-518ca88f4b3a', '4', 'A', NULL, NULL, 'Marketing', 'Master of Business Administration'),
  ('1c37d8f0-dd0e-4880-a08a-0ae435ad9da3', 'varshinivarshanb@gmail.com', '284c9ed9-cd13-584d-b5bc-e198866b917b', '6fd1362b-614f-4b2a-b7f3-e774c0c56c24', '4', 'A', NULL, NULL, 'HR', NULL),
  ('1dba0d34-cfb4-4ca2-9cbd-992038687402', 'mgagana69@gmail.com', '284c9ed9-cd13-584d-b5bc-e198866b917b', '6fd1362b-614f-4b2a-b7f3-e774c0c56c24', '4', 'A', NULL, NULL, 'HR', NULL),
  ('1fd5f1f0-d353-5af3-86b0-cbdd5fdbc260', 'sinchana2393@gmail.com', '284c9ed9-cd13-584d-b5bc-e198866b917b', '6fd1362b-614f-4b2a-b7f3-e774c0c56c24', '4', 'A', NULL, NULL, 'HR', 'Master of Business Administration'),
  ('210f56f3-444e-415d-8413-6455e49282c9', 'manjushreegowda778@gmail.com', '284c9ed9-cd13-584d-b5bc-e198866b917b', NULL, NULL, NULL, NULL, NULL, 'Business Analytics', 'Master of Business Administration'),
  ('2e58e766-7c65-44c4-acd7-759830a1e004', 'priyankaammu663@gmail.com', '284c9ed9-cd13-584d-b5bc-e198866b917b', 'f9a7f695-5625-4a7b-a691-6aaa86308f1a', '4', 'A', NULL, NULL, 'Finance', NULL),
  ('3118a7eb-a9d4-4ae2-8520-8a5987adfc0b', 'jhenkaragowda212@gmail.com', '284c9ed9-cd13-584d-b5bc-e198866b917b', 'f9a7f695-5625-4a7b-a691-6aaa86308f1a', '4', 'A', NULL, NULL, 'Finance', 'Master of Business Administration'),
  ('345652d8-2852-4acb-9402-c4b5688a36df', 'nalinagowda40@gmail.com', '284c9ed9-cd13-584d-b5bc-e198866b917b', '7a600558-ebc0-4084-8a6b-1e580bf2c385', '4', 'A', NULL, NULL, NULL, 'Master Of Computer Application'),
  ('376652c3-0405-557d-9610-54c96740a56a', 'priyankapriyanka54295@gmail.com', '284c9ed9-cd13-584d-b5bc-e198866b917b', '6fd1362b-614f-4b2a-b7f3-e774c0c56c24', '4', 'A', NULL, NULL, 'HR', NULL),
  ('391618dd-a957-4559-9012-bffa0b41af04', 'hemu818hr@gmail.com', '284c9ed9-cd13-584d-b5bc-e198866b917b', '908a00ad-5a12-477c-a4a5-518ca88f4b3a', '4', 'A', NULL, NULL, 'Marketing', NULL),
  ('3b4b619c-c335-427b-a510-50f4a33ff689', 'abhijith22abhi22@gmail.com', '284c9ed9-cd13-584d-b5bc-e198866b917b', '7a600558-ebc0-4084-8a6b-1e580bf2c385', '4', 'A', NULL, NULL, 'Software development,Data analytics ', 'Master Of Computer Application'),
  ('4ac64293-46c6-4dcc-86b3-19371388abc6', 'varshajaishankar06@gmail.com', '284c9ed9-cd13-584d-b5bc-e198866b917b', '6fd1362b-614f-4b2a-b7f3-e774c0c56c24', '4', 'A', NULL, NULL, 'HR', 'Master of Business Administration'),
  ('4ad42074-7e9e-467e-90d7-d14b964fdb3e', 'ppavan50559@gmail.com', '284c9ed9-cd13-584d-b5bc-e198866b917b', '908a00ad-5a12-477c-a4a5-518ca88f4b3a', '4', 'A', NULL, NULL, 'Marketing', 'Master of Business Administration'),
  ('4ce5ccd1-3e80-42f7-ad72-b9691f1bc84b', 'tejuteja082@gmail.com', '284c9ed9-cd13-584d-b5bc-e198866b917b', '6fd1362b-614f-4b2a-b7f3-e774c0c56c24', '4', 'A', NULL, NULL, 'HR', 'Master of Business Administration'),
  ('523512cd-9c31-4ae9-8eeb-a1e839a99946', 'ddeekshith920@gmail.com', '284c9ed9-cd13-584d-b5bc-e198866b917b', 'f9a7f695-5625-4a7b-a691-6aaa86308f1a', '4', 'A', NULL, NULL, 'Finance', NULL),
  ('575dca84-0e7e-41fb-b69d-95a3800baa16', 'rakshithamr68@gmail.com', '284c9ed9-cd13-584d-b5bc-e198866b917b', 'f9a7f695-5625-4a7b-a691-6aaa86308f1a', '4', 'A', NULL, NULL, 'Finance', NULL),
  ('597faf14-c863-4e95-bb8e-d90a9e0c33ff', 'sumithasenthil0225@gmail.com', '284c9ed9-cd13-584d-b5bc-e198866b917b', '6fd1362b-614f-4b2a-b7f3-e774c0c56c24', '4', 'A', NULL, NULL, 'HR', 'Master of Business Administration'),
  ('5a6139c0-a028-476e-888c-d95a4961e7a8', 'hemantahemanth79@gmail.com', '284c9ed9-cd13-584d-b5bc-e198866b917b', '908a00ad-5a12-477c-a4a5-518ca88f4b3a', '4', 'A', NULL, NULL, 'Marketing', NULL),
  ('63be23ea-f522-4217-bf3f-98799c17dfae', 'narayannarayan0726@gmail.com', '284c9ed9-cd13-584d-b5bc-e198866b917b', '6fd1362b-614f-4b2a-b7f3-e774c0c56c24', '4', 'A', NULL, NULL, 'HR', NULL),
  ('645e412b-27c3-4b77-85a6-f8e89f337cf0', 'smmamatha910@gmail.com', '284c9ed9-cd13-584d-b5bc-e198866b917b', '25e1410b-bb26-40fe-abda-79a4a03925a0', '4', 'A', NULL, NULL, 'Business Analytics', 'Master of Business Administration'),
  ('65d94686-1d38-49c8-882f-887aeed08a5d', 'rajeshwarihiremath521@gmail.com', '284c9ed9-cd13-584d-b5bc-e198866b917b', 'f9a7f695-5625-4a7b-a691-6aaa86308f1a', '4', 'A', NULL, NULL, 'Finance', NULL),
  ('69b35ea7-3c06-488f-b360-32bc2c60e729', 'abhisheknd267@gmail.com', '284c9ed9-cd13-584d-b5bc-e198866b917b', '908a00ad-5a12-477c-a4a5-518ca88f4b3a', '4', 'A', NULL, NULL, 'Marketing', NULL),
  ('69cbb8d6-49f3-4609-8e93-73e3b012635d', 'shobithar91@gmail.com', '284c9ed9-cd13-584d-b5bc-e198866b917b', '6fd1362b-614f-4b2a-b7f3-e774c0c56c24', '4', 'A', NULL, NULL, 'HR', NULL),
  ('6a7e0f67-6d05-55c1-ab6f-6e64815dc22d', 'kantharajurn17@gmail.com', '284c9ed9-cd13-584d-b5bc-e198866b917b', '25e1410b-bb26-40fe-abda-79a4a03925a0', '4', 'A', NULL, NULL, 'Business Analytics', 'Master of Business Administration'),
  ('6cd17b2d-00f8-422c-9df6-bffebc8d90f9', 'gowdachethu83@gmail.com', '284c9ed9-cd13-584d-b5bc-e198866b917b', 'f9a7f695-5625-4a7b-a691-6aaa86308f1a', '4', 'A', NULL, NULL, 'Finance', 'Master of Business Administration'),
  ('71c61571-eec3-43d5-83f7-fc772b176b84', 'chettyleo19@gmail.com', '284c9ed9-cd13-584d-b5bc-e198866b917b', '7a600558-ebc0-4084-8a6b-1e580bf2c385', '4', 'A', NULL, NULL, NULL, 'Master Of Computer Application'),
  ('73481733-57b3-42d9-9e98-5f888df60da7', 'jeevithav01@gmail.com', '284c9ed9-cd13-584d-b5bc-e198866b917b', '25e1410b-bb26-40fe-abda-79a4a03925a0', '4', 'A', NULL, NULL, 'Business Analytics', 'Master of Business Administration'),
  ('78c3852d-ab85-4424-96c9-0a9c0f23188a', 'pradeepgeetha09@gmail.com', '284c9ed9-cd13-584d-b5bc-e198866b917b', '7a600558-ebc0-4084-8a6b-1e580bf2c385', '4', 'A', NULL, NULL, NULL, 'Master Of Computer Application'),
  ('78ee2603-c130-4c65-95ff-a577e23bec92', 'sunanda.anusha@gmail.com', '284c9ed9-cd13-584d-b5bc-e198866b917b', 'f9a7f695-5625-4a7b-a691-6aaa86308f1a', '4', 'A', NULL, NULL, 'Finance', 'Master of Business Administration'),
  ('7a2bcc9f-02b9-4ca9-8c28-271799f995ea', 'chaithanyatr24@gmail.com', '284c9ed9-cd13-584d-b5bc-e198866b917b', '6fd1362b-614f-4b2a-b7f3-e774c0c56c24', '4', 'A', NULL, NULL, 'HR', 'Master of Business Administration'),
  ('7eeb6170-c7b9-55d8-8d77-7a38e514efb2', 'hariprasadnayak77280@gmail.com', '284c9ed9-cd13-584d-b5bc-e198866b917b', '25e1410b-bb26-40fe-abda-79a4a03925a0', '4', 'A', NULL, NULL, 'Business Analytics', NULL),
  ('7f9a198d-84b8-48d7-9625-0d6cc5da3cc4', 'hcmanoj47@gmail.com', '284c9ed9-cd13-584d-b5bc-e198866b917b', '25e1410b-bb26-40fe-abda-79a4a03925a0', '4', 'A', NULL, NULL, 'Business Analytics', 'Master of Business Administration'),
  ('80bf7c76-5e3d-400f-819d-2ac5d6e69ce8', 'lokeshloki3497@gmail.com', '284c9ed9-cd13-584d-b5bc-e198866b917b', '908a00ad-5a12-477c-a4a5-518ca88f4b3a', '4', 'A', NULL, NULL, 'Marketing', NULL),
  ('8111a2a4-87a6-45b2-ae77-fa2655c7e9c2', 'yashaswinigowda601@gmail.com', '284c9ed9-cd13-584d-b5bc-e198866b917b', '25e1410b-bb26-40fe-abda-79a4a03925a0', '4', 'A', NULL, NULL, 'Business Analytics', 'Master of Business Administration'),
  ('83aa131a-f5ec-4511-93a9-9a24e6e7a800', 'bhumikabharath252@gmail.com', '284c9ed9-cd13-584d-b5bc-e198866b917b', '25e1410b-bb26-40fe-abda-79a4a03925a0', '4', 'A', NULL, NULL, 'Business Analytics', NULL),
  ('848e03d3-b173-4c3f-9459-e1129e899e2e', 'bhavyamt2907@gmail.com', '284c9ed9-cd13-584d-b5bc-e198866b917b', 'f9a7f695-5625-4a7b-a691-6aaa86308f1a', '4', 'A', NULL, NULL, 'Finance', 'Master of Business Administration'),
  ('84909bbf-220e-4bbc-ac9c-c08de152f913', 'rooparoopa5954@gmail.com', '284c9ed9-cd13-584d-b5bc-e198866b917b', '7a600558-ebc0-4084-8a6b-1e580bf2c385', '4', 'A', NULL, NULL, NULL, NULL),
  ('86564bf1-0ba3-40af-92a4-f3a690d97240', 'dakshdograg15@gmail.com', '284c9ed9-cd13-584d-b5bc-e198866b917b', '7a600558-ebc0-4084-8a6b-1e580bf2c385', '4', 'A', NULL, NULL, NULL, NULL),
  ('890c9c79-8289-4082-ada6-1b5a856e79d7', 'chandanaks547@gmail.com', '284c9ed9-cd13-584d-b5bc-e198866b917b', 'f9a7f695-5625-4a7b-a691-6aaa86308f1a', '4', 'A', NULL, NULL, 'Finance', 'Master of Business Administration'),
  ('894f6cc3-3a88-4d5f-be17-d94f655ff6d1', 'shwethag395@gmail.com', '284c9ed9-cd13-584d-b5bc-e198866b917b', '6fd1362b-614f-4b2a-b7f3-e774c0c56c24', '4', 'A', NULL, NULL, 'HR', NULL),
  ('8fda8ff3-3f1d-42cd-a687-5dae02ae9fa1', 'roopeshgc2003@gmail.com', '284c9ed9-cd13-584d-b5bc-e198866b917b', '25e1410b-bb26-40fe-abda-79a4a03925a0', '4', 'A', NULL, NULL, 'Business Analytics', NULL),
  ('955f932a-025d-4e47-ba43-1149c055eac7', 'hamsangowda3@gmail.com', '284c9ed9-cd13-584d-b5bc-e198866b917b', '7a600558-ebc0-4084-8a6b-1e580bf2c385', '4', 'A', NULL, NULL, NULL, NULL),
  ('9708cc21-ad52-5059-bc5d-18764367bb29', 'charuc250@gmail.com', '284c9ed9-cd13-584d-b5bc-e198866b917b', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
  ('97c7c027-ee73-5ba3-a2ff-39a7d6557637', 'yamunamanjunath123@gmail.com', '284c9ed9-cd13-584d-b5bc-e198866b917b', 'f9a7f695-5625-4a7b-a691-6aaa86308f1a', '4', 'A', NULL, NULL, 'Finance', 'Master of Business Administration'),
  ('9d372f1c-cc8f-4bde-9253-404fef298a42', 'thanukrishna.am@gmail.com', '284c9ed9-cd13-584d-b5bc-e198866b917b', '6fd1362b-614f-4b2a-b7f3-e774c0c56c24', '4', 'A', NULL, NULL, 'HR', 'Master of Business Administration'),
  ('a42bacdf-bcb3-441e-9a5c-2413f20616f1', 'simrithasuresh31@gmail.com', '284c9ed9-cd13-584d-b5bc-e198866b917b', '6fd1362b-614f-4b2a-b7f3-e774c0c56c24', '4', 'A', NULL, NULL, 'HR', 'Master of Business Administration'),
  ('b14f698b-b21a-4784-bad9-587a7b0575e3', 'vinodvinu3123@gmail.com', '284c9ed9-cd13-584d-b5bc-e198866b917b', '6fd1362b-614f-4b2a-b7f3-e774c0c56c24', '4', 'A', NULL, NULL, 'HR', 'Master of Business Administration'),
  ('b2cc00d9-c02d-4032-b2a8-55a1af4c62d0', 'shivakumar07505@gmail.com', '284c9ed9-cd13-584d-b5bc-e198866b917b', '908a00ad-5a12-477c-a4a5-518ca88f4b3a', '4', 'A', NULL, NULL, 'Marketing', 'Master of Business Administration'),
  ('b6bfa400-cbfd-4ba9-aafd-88072e531ca2', 'lohithks2003@gmail.com', '284c9ed9-cd13-584d-b5bc-e198866b917b', '908a00ad-5a12-477c-a4a5-518ca88f4b3a', '4', 'A', NULL, NULL, 'Marketing', NULL),
  ('b9035456-6df5-43cd-842a-21af2015df5a', 'kasarvidyashree@gmail.com', '284c9ed9-cd13-584d-b5bc-e198866b917b', 'f9a7f695-5625-4a7b-a691-6aaa86308f1a', '4', 'A', NULL, NULL, 'Finance', NULL),
  ('b9434c21-4339-46c3-923a-cea3233d6651', 'sevanthi752@gmail.com', '284c9ed9-cd13-584d-b5bc-e198866b917b', '7a600558-ebc0-4084-8a6b-1e580bf2c385', '4', 'A', NULL, NULL, NULL, NULL),
  ('b9d7d0c2-073b-409a-b484-2e8b2abadce4', 'jeevithadn47@gmail.com', '284c9ed9-cd13-584d-b5bc-e198866b917b', '6fd1362b-614f-4b2a-b7f3-e774c0c56c24', '4', 'A', NULL, NULL, 'HR', 'Master of Business Administration'),
  ('bb4b4de4-03fe-4200-b84f-461568391f07', 'lavlavanya6360@gmail.com', '284c9ed9-cd13-584d-b5bc-e198866b917b', '7a600558-ebc0-4084-8a6b-1e580bf2c385', '4', 'A', NULL, NULL, NULL, 'Master Of Computer Application'),
  ('bdf00726-215a-4134-a11d-a869930c59ee', 'harshilachu1@gmail.com', '284c9ed9-cd13-584d-b5bc-e198866b917b', '7a600558-ebc0-4084-8a6b-1e580bf2c385', '4', 'A', NULL, NULL, NULL, NULL),
  ('c0177005-7ce5-46fd-985a-52408ce8494f', 'vaishnavigopinath03@gmail.com', '284c9ed9-cd13-584d-b5bc-e198866b917b', '25e1410b-bb26-40fe-abda-79a4a03925a0', '4', 'A', NULL, NULL, 'Business Analytics', 'Master of Business Administration'),
  ('c6baed07-e92b-5e5f-8e68-fadd85eae5c9', 'harshaabhi56@gmail.com', '284c9ed9-cd13-584d-b5bc-e198866b917b', '6fd1362b-614f-4b2a-b7f3-e774c0c56c24', '4', 'A', NULL, NULL, 'HR', NULL),
  ('ce171a34-29de-5215-945e-95a5071f647b', 'santhoshgowda2102@gmail.com', '284c9ed9-cd13-584d-b5bc-e198866b917b', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
  ('d1406b86-0293-47e8-b2d5-4c98671f4b86', 'ambujakhgowda@gmail.com', '284c9ed9-cd13-584d-b5bc-e198866b917b', 'f9a7f695-5625-4a7b-a691-6aaa86308f1a', '4', 'A', NULL, NULL, 'Finance', 'Master of Business Administration'),
  ('d5127e9e-f2fb-4d36-86d7-0f2ff90050f3', 'akhilapinky1012@gmail.com', '284c9ed9-cd13-584d-b5bc-e198866b917b', '7a600558-ebc0-4084-8a6b-1e580bf2c385', '4', 'A', NULL, NULL, NULL, NULL),
  ('d6dd270c-9d52-4fb1-a74b-7a78474daf50', 'nageshwari1922@gmail.com', '284c9ed9-cd13-584d-b5bc-e198866b917b', NULL, NULL, NULL, NULL, NULL, 'Business Analytics', 'Master of Business Administration'),
  ('df630f8a-5f7e-4d05-a5f9-44dd5cb002a0', 'bhoomika19503@gmail.com', '284c9ed9-cd13-584d-b5bc-e198866b917b', '7a600558-ebc0-4084-8a6b-1e580bf2c385', '4', 'A', NULL, NULL, NULL, 'Master Of Computer Application'),
  ('e07adffb-1260-5c19-9b1d-26af96b291bd', 'sanjanakumarmesthakumarmestha@gmail.com', '284c9ed9-cd13-584d-b5bc-e198866b917b', '6fd1362b-614f-4b2a-b7f3-e774c0c56c24', '4', 'A', NULL, NULL, 'HR', NULL),
  ('e10a439c-1725-5301-944f-79bcec5cf169', 'likhib612@gmail.com', '284c9ed9-cd13-584d-b5bc-e198866b917b', '6fd1362b-614f-4b2a-b7f3-e774c0c56c24', '4', 'A', NULL, NULL, 'HR', NULL),
  ('e180eacc-144a-5129-8a43-37833d561941', 'sanjay299sanju@gmail.com', '284c9ed9-cd13-584d-b5bc-e198866b917b', '7a600558-ebc0-4084-8a6b-1e580bf2c385', '4', '4th', NULL, NULL, 'Computer application', 'Master Of Computer Application'),
  ('e309e516-1d55-4e12-a223-6a05b168025b', 'nayanaks1233@gmail.com', '284c9ed9-cd13-584d-b5bc-e198866b917b', '7a600558-ebc0-4084-8a6b-1e580bf2c385', '4', 'A', NULL, NULL, NULL, NULL),
  ('e79beba4-09e2-467c-a9a2-fbb73726bfe0', 'meghanamv347@gmail.com', '284c9ed9-cd13-584d-b5bc-e198866b917b', '7a600558-ebc0-4084-8a6b-1e580bf2c385', '4', 'A', NULL, NULL, NULL, 'Master Of Computer Application'),
  ('f37a38ff-ee5f-4836-93e6-6fdc10116ad8', 'rajeshin2003@gmail.com', '284c9ed9-cd13-584d-b5bc-e198866b917b', '908a00ad-5a12-477c-a4a5-518ca88f4b3a', '4', 'A', NULL, NULL, 'Marketing', 'Master of Business Administration'),
  ('f421e3d5-6ae0-4bd5-b930-7c22621c9dfe', 'sahanaanandaiah@gmail.com', '284c9ed9-cd13-584d-b5bc-e198866b917b', '25e1410b-bb26-40fe-abda-79a4a03925a0', '4', 'A', NULL, NULL, 'Business Analytics', 'Master of Business Administration');
CREATE TEMP TABLE soundarya_production_program_check (
 program_id uuid PRIMARY KEY, department_id uuid, college_id uuid
) ON COMMIT DROP;
INSERT INTO soundarya_production_program_check VALUES
  ('25e1410b-bb26-40fe-abda-79a4a03925a0', 'e61f768c-b51e-57c7-a600-96161edaf0bd', '284c9ed9-cd13-584d-b5bc-e198866b917b'),
  ('6fd1362b-614f-4b2a-b7f3-e774c0c56c24', 'e61f768c-b51e-57c7-a600-96161edaf0bd', '284c9ed9-cd13-584d-b5bc-e198866b917b'),
  ('7a600558-ebc0-4084-8a6b-1e580bf2c385', '6bf040f0-70d4-5b10-ae17-acde09b23d61', '284c9ed9-cd13-584d-b5bc-e198866b917b'),
  ('908a00ad-5a12-477c-a4a5-518ca88f4b3a', 'e61f768c-b51e-57c7-a600-96161edaf0bd', '284c9ed9-cd13-584d-b5bc-e198866b917b'),
  ('f9a7f695-5625-4a7b-a691-6aaa86308f1a', 'e61f768c-b51e-57c7-a600-96161edaf0bd', '284c9ed9-cd13-584d-b5bc-e198866b917b');
DO $sync$
DECLARE n integer;
BEGIN
 IF EXISTS (
  SELECT 1 FROM soundarya_production_program_check x
  LEFT JOIN public.programs p ON p.id=x.program_id
  LEFT JOIN public.departments d ON d.id=x.department_id
  WHERE p.id IS NULL OR p.department_id IS DISTINCT FROM x.department_id
     OR d.id IS NULL OR d.college_id IS DISTINCT FROM x.college_id
 ) THEN RAISE EXCEPTION 'Local production program/department IDs are missing or inconsistent; seed academic data first'; END IF;
 IF EXISTS (
  SELECT 1 FROM soundarya_production_learner_snapshot x
  LEFT JOIN public.learners l ON l.id=x.id
  WHERE l.id IS NULL OR lower(l.email) IS DISTINCT FROM lower(x.email)
    OR (l.college_id IS NOT NULL AND l.college_id<>x.college_id)
 ) THEN RAISE EXCEPTION 'Local learner IDs/emails are missing or belong to another college; seed/reconcile learner identities first'; END IF;
 IF EXISTS (
  SELECT 1 FROM soundarya_production_learner_snapshot x
  LEFT JOIN public.program_sections s ON s.id=x.program_section_id
  WHERE x.program_section_id IS NOT NULL AND
   (s.id IS NULL OR s.program_id IS DISTINCT FROM x.program_id
    OR s.semester IS DISTINCT FROM x.semester OR s.section IS DISTINCT FROM x.section)
 ) THEN RAISE EXCEPTION 'Local program section does not match production snapshot'; END IF;
 UPDATE public.learners l SET
  college_id=x.college_id, program_id=x.program_id, semester=x.semester,
  section=x.section, program_section_id=x.program_section_id,
  college_class_id=x.college_class_id, specialization=x.specialization,
  course_name=x.course_name, updated_at=now()
 FROM soundarya_production_learner_snapshot x
 WHERE l.id=x.id AND ROW(l.college_id,l.program_id,l.semester,l.section,
  l.program_section_id,l.college_class_id,l.specialization,l.course_name)
 IS DISTINCT FROM ROW(x.college_id,x.program_id,x.semester,x.section,
  x.program_section_id,x.college_class_id,x.specialization,x.course_name);
 GET DIAGNOSTICS n = ROW_COUNT;
 RAISE NOTICE 'Synchronized % local learner mappings to production snapshot (77 checked)', n;
END;
$sync$;
COMMIT;

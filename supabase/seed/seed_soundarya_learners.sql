-- Migration for SkillPassport App DB
-- Seeds 60 Soundarya learner accounts matching the SSO Auth DB migration.
-- Safe and idempotent (can be re-run safely).

BEGIN;

DO $seed_learners$
DECLARE
  v_org_id uuid := '284c9ed9-cd13-584d-b5bc-e198866b917b';
BEGIN

  -- 0. Ensure organization exists in public.organizations
  INSERT INTO public.organizations (id, name)
  VALUES (v_org_id, 'Soundarya Institute of Management and Science')
  ON CONFLICT (id) DO NOTHING;

  -- 1. Insert/Update public.users (SkillPassport schema)
  INSERT INTO public.users (
    id,
    email,
    "organizationId",
    "firstName",
    "lastName",
    phone,
    role,
    "isActive",
    metadata,
    "createdAt",
    "updatedAt"
  )
  SELECT
    v.id,
    v.email,
    v_org_id,
    v.user_metadata->>'firstName',
    v.user_metadata->>'lastName',
    v.user_metadata->>'contact_number',
    'learner',
    true,
    v.user_metadata,
    v.created_at,
    v.updated_at
  FROM (
    VALUES
      ('df630f8a-5f7e-4d05-a5f9-44dd5cb002a0'::uuid, 'bhoomika19503@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz, '{"role": "learner", "lastName": "D", "firstName": "Bhoomika", "contact_number": "7259750959"}'::jsonb),
      ('1b737699-3612-4dd2-a918-ea731ff7967f'::uuid, 'cchaithran698@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz, '{"role": "learner", "lastName": "N", "firstName": "Chaithra", "contact_number": "08861406830"}'::jsonb),
      ('d1406b86-0293-47e8-b2d5-4c98671f4b86'::uuid, 'ambujakhgowda@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz, '{"role": "learner", "lastName": "K H", "firstName": "Ambuja", "contact_number": "07259164127"}'::jsonb),
      ('9d372f1c-cc8f-4bde-9253-404fef298a42'::uuid, 'thanukrishna.am@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz, '{"role": "learner", "lastName": "A M", "firstName": "Thanuja", "contact_number": "8971617792"}'::jsonb),
      ('391618dd-a957-4559-9012-bffa0b41af04'::uuid, 'hemu818hr@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz, '{"role": "learner", "lastName": "H R", "firstName": "Hemanth", "contact_number": "8618074472"}'::jsonb),
      ('12dfa911-d489-4532-a219-efd474249edd'::uuid, 'hemanthgowdaa755@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz, '{"role": "learner", "lastName": "A", "firstName": "Hemanth", "contact_number": "7259473839"}'::jsonb),
      ('3118a7eb-a9d4-4ae2-8520-8a5987adfc0b'::uuid, 'jhenkaragowda212@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz, '{"role": "learner", "lastName": "A Gowda", "firstName": "Jhenkar", "contact_number": "7204328122"}'::jsonb),
      ('210f56f3-444e-415d-8413-6455e49282c9'::uuid, 'manjushreegowda778@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz, '{"role": "learner", "lastName": "T N", "firstName": "Manjushree", "contact_number": "9741728110"}'::jsonb),
      ('86564bf1-0ba3-40af-92a4-f3a690d97240'::uuid, 'dakshdograg15@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz, '{"role": "learner", "lastName": "Dogra", "firstName": "Daksh", "contact_number": "9041587334"}'::jsonb),
      ('1dba0d34-cfb4-4ca2-9cbd-992038687402'::uuid, 'mgagana69@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz, '{"role": "learner", "lastName": "", "firstName": "Gagana.m", "contact_number": "6361709321"}'::jsonb),
      ('65d94686-1d38-49c8-882f-887aeed08a5d'::uuid, 'rajeshwarihiremath521@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz, '{"role": "learner", "lastName": "Hiremath", "firstName": "Rajeshwari", "contact_number": "6366194317"}'::jsonb),
      ('4ac64293-46c6-4dcc-86b3-19371388abc6'::uuid, 'varshajaishankar06@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz, '{"role": "learner", "lastName": "", "firstName": "Varsha.J", "contact_number": "9187322030"}'::jsonb),
      ('4ce5ccd1-3e80-42f7-ad72-b9691f1bc84b'::uuid, 'tejuteja082@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz, '{"role": "learner", "lastName": "Babu K P", "firstName": "Teja", "contact_number": "6282652872"}'::jsonb),
      ('d6dd270c-9d52-4fb1-a74b-7a78474daf50'::uuid, 'nageshwari1922@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz, '{"role": "learner", "lastName": "k", "firstName": "Nageshwari", "contact_number": "9380465144"}'::jsonb),
      ('69b35ea7-3c06-488f-b360-32bc2c60e729'::uuid, 'abhisheknd267@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz, '{"role": "learner", "lastName": "nd", "firstName": "Abhishek", "contact_number": "7892915864"}'::jsonb),
      ('11a57fb7-5da6-48af-a271-b42b95650590'::uuid, 'abhikdabhi@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz, '{"role": "learner", "lastName": "K D", "firstName": "Abhishek", "contact_number": "9880216675"}'::jsonb),
      ('2e58e766-7c65-44c4-acd7-759830a1e004'::uuid, 'priyankaammu663@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz, '{"role": "learner", "lastName": "SY", "firstName": "Priyanka", "contact_number": "6363900653"}'::jsonb),
      ('7f9a198d-84b8-48d7-9625-0d6cc5da3cc4'::uuid, 'hcmanoj47@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz, '{"role": "learner", "lastName": "HC", "firstName": "Manoj", "contact_number": "8073992906"}'::jsonb),
      ('848e03d3-b173-4c3f-9459-e1129e899e2e'::uuid, 'bhavyamt2907@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz, '{"role": "learner", "lastName": "M T", "firstName": "Bhavya", "contact_number": "7975816304"}'::jsonb),
      ('7a2bcc9f-02b9-4ca9-8c28-271799f995ea'::uuid, 'chaithanyatr24@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz, '{"role": "learner", "lastName": "T R", "firstName": "Chaithanya", "contact_number": "9972706182"}'::jsonb),
      ('5a6139c0-a028-476e-888c-d95a4961e7a8'::uuid, 'hemantahemanth79@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz, '{"role": "learner", "lastName": "L G", "firstName": "Hemanth", "contact_number": "8123008621"}'::jsonb),
      ('78ee2603-c130-4c65-95ff-a577e23bec92'::uuid, 'sunanda.anusha@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz, '{"role": "learner", "lastName": "", "firstName": "Anusha", "contact_number": "6363902432"}'::jsonb),
      ('894f6cc3-3a88-4d5f-be17-d94f655ff6d1'::uuid, 'shwethag395@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz, '{"role": "learner", "lastName": "B", "firstName": "Shwetha", "contact_number": "9632256768"}'::jsonb),
      ('08417faa-9518-4ec8-8c02-6b35d1a32444'::uuid, 'm.jayashree352@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz, '{"role": "learner", "lastName": "M", "firstName": "Jayashree", "contact_number": "8050046883"}'::jsonb),
      ('b9035456-6df5-43cd-842a-21af2015df5a'::uuid, 'kasarvidyashree@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz, '{"role": "learner", "lastName": "Honnalingappa Kasar", "firstName": "Vidyashri", "contact_number": "8088458761"}'::jsonb),
      ('890c9c79-8289-4082-ada6-1b5a856e79d7'::uuid, 'chandanaks547@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz, '{"role": "learner", "lastName": "KS", "firstName": "Chandana", "contact_number": "6362462020"}'::jsonb),
      ('102993cd-9a16-4e51-97b7-fb73f039bdfb'::uuid, 'hemanthsj2003@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz, '{"role": "learner", "lastName": "SJ", "firstName": "Hemanth", "contact_number": "7899998236"}'::jsonb),
      ('b14f698b-b21a-4784-bad9-587a7b0575e3'::uuid, 'vinodvinu3123@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz, '{"role": "learner", "lastName": "H A", "firstName": "Vinod", "contact_number": "6362923578"}'::jsonb),
      ('f37a38ff-ee5f-4836-93e6-6fdc10116ad8'::uuid, 'rajeshin2003@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz, '{"role": "learner", "lastName": "I N", "firstName": "Rajesh", "contact_number": "9019522356"}'::jsonb),
      ('69cbb8d6-49f3-4609-8e93-73e3b012635d'::uuid, 'shobithar91@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz, '{"role": "learner", "lastName": "R", "firstName": "Shobhitha", "contact_number": "6360244924"}'::jsonb),
      ('575dca84-0e7e-41fb-b69d-95a3800baa16'::uuid, 'rakshithamr68@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz, '{"role": "learner", "lastName": "M R", "firstName": "Rakshitha", "contact_number": "07204615711"}'::jsonb),
      ('8fda8ff3-3f1d-42cd-a687-5dae02ae9fa1'::uuid, 'roopeshgc2003@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz, '{"role": "learner", "lastName": "G C", "firstName": "Roopesh", "contact_number": "7019288212"}'::jsonb),
      ('80bf7c76-5e3d-400f-819d-2ac5d6e69ce8'::uuid, 'lokeshloki3497@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz, '{"role": "learner", "lastName": "Gowda s", "firstName": "Lokesh", "contact_number": "8197509229"}'::jsonb),
      ('73481733-57b3-42d9-9e98-5f888df60da7'::uuid, 'jeevithav01@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz, '{"role": "learner", "lastName": "v", "firstName": "Jeevitha", "contact_number": "8296801201"}'::jsonb),
      ('c0177005-7ce5-46fd-985a-52408ce8494f'::uuid, 'vaishnavigopinath03@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz, '{"role": "learner", "lastName": "G", "firstName": "Vaishnavi", "contact_number": "8147480814"}'::jsonb),
      ('f421e3d5-6ae0-4bd5-b930-7c22621c9dfe'::uuid, 'sahanaanandaiah@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz, '{"role": "learner", "lastName": "A", "firstName": "Sahana", "contact_number": "7483124757"}'::jsonb),
      ('b9d7d0c2-073b-409a-b484-2e8b2abadce4'::uuid, 'jeevithadn47@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz, '{"role": "learner", "lastName": "D N", "firstName": "Jeevitha", "contact_number": "8088167833"}'::jsonb),
      ('645e412b-27c3-4b77-85a6-f8e89f337cf0'::uuid, 'smmamatha910@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz, '{"role": "learner", "lastName": "S M", "firstName": "Mamatha", "contact_number": "8431636683"}'::jsonb),
      ('4ad42074-7e9e-467e-90d7-d14b964fdb3e'::uuid, 'ppavan50559@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz, '{"role": "learner", "lastName": "Kumar K L", "firstName": "Pavan", "contact_number": "7483246826"}'::jsonb),
      ('9a4ee293-937f-4871-885b-661c348a7b61'::uuid, 'yamunanm8@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz, '{"role": "learner", "lastName": "", "firstName": "Yamuna", "contact_number": "9535388565"}'::jsonb),
      ('63be23ea-f522-4217-bf3f-98799c17dfae'::uuid, 'narayannarayan0726@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz, '{"role": "learner", "lastName": "", "firstName": "Chaithra.N", "contact_number": "8088325090"}'::jsonb),
      ('02fa3520-3233-4ca6-a130-fb17ef66f8b7'::uuid, 'rakshithps4477@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz, '{"role": "learner", "lastName": "P S", "firstName": "Rakshith", "contact_number": "8296564477"}'::jsonb),
      ('467fe998-2985-41dd-97eb-9f96a8330ee7'::uuid, 'ppavan50776@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz, '{"role": "learner", "lastName": "Kumar K L", "firstName": "Pavan", "contact_number": "7483246826"}'::jsonb),
      ('1c37d8f0-dd0e-4880-a08a-0ae435ad9da3'::uuid, 'varshinivarshanb@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz, '{"role": "learner", "lastName": "NB", "firstName": "Varshini", "contact_number": "9606010049"}'::jsonb),
      ('bb4b4de4-03fe-4200-b84f-461568391f07'::uuid, 'lavlavanya6360@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz, '{"role": "learner", "lastName": "B", "firstName": "Lavanya", "contact_number": "6360481817"}'::jsonb),
      ('03e32968-c238-4e59-9986-d7a9f618dc40'::uuid, 'lavanya13142003@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz, '{"role": "learner", "lastName": "P", "firstName": "Lavanya", "contact_number": "9964659168"}'::jsonb),
      ('b9434c21-4339-46c3-923a-cea3233d6651'::uuid, 'sevanthi752@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz, '{"role": "learner", "lastName": "M", "firstName": "Sevanthi", "contact_number": "7676840478"}'::jsonb),
      ('d5127e9e-f2fb-4d36-86d7-0f2ff90050f3'::uuid, 'akhilapinky1012@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz, '{"role": "learner", "lastName": "T", "firstName": "Akhila", "contact_number": "7975112280"}'::jsonb),
      ('71c61571-eec3-43d5-83f7-fc772b176b84'::uuid, 'chettyleo19@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz, '{"role": "learner", "lastName": "Chetty", "firstName": "Leo", "contact_number": "9321432950"}'::jsonb),
      ('e309e516-1d55-4e12-a223-6a05b168025b'::uuid, 'nayanaks1233@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz, '{"role": "learner", "lastName": "K S", "firstName": "Nayana", "contact_number": "6363992731"}'::jsonb),
      ('345652d8-2852-4acb-9402-c4b5688a36df'::uuid, 'nalinagowda40@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:10:03.386466+00'::timestamptz, '{"role": "learner", "lastName": "K", "firstName": "Nalina", "contact_number": "9743607378"}'::jsonb),
      ('6cd17b2d-00f8-422c-9df6-bffebc8d90f9'::uuid, 'gowdachethu83@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz, '{"role": "learner", "lastName": "G", "firstName": "Chethan", "contact_number": "9019256822"}'::jsonb),
      ('001d6727-c673-40c8-8592-ff2665e35eaf'::uuid, 'varshithahs626@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz, '{"role": "learner", "lastName": "H S", "firstName": "Varshitha", "contact_number": "9620569554"}'::jsonb),
      ('b6bfa400-cbfd-4ba9-aafd-88072e531ca2'::uuid, 'lohithks2003@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz, '{"role": "learner", "lastName": "K S", "firstName": "Lohith", "contact_number": "6363204145"}'::jsonb),
      ('b2cc00d9-c02d-4032-b2a8-55a1af4c62d0'::uuid, 'shivakumar07505@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz, '{"role": "learner", "lastName": "", "firstName": "Shivakumar", "contact_number": "9964890764"}'::jsonb),
      ('955f932a-025d-4e47-ba43-1149c055eac7'::uuid, 'hamsangowda3@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz, '{"role": "learner", "lastName": "keerthi N Gowda", "firstName": "Hamsa", "contact_number": "9886981788"}'::jsonb),
      ('e79beba4-09e2-467c-a9a2-fbb73726bfe0'::uuid, 'meghanamv347@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz, '{"role": "learner", "lastName": "M V", "firstName": "Meghana", "contact_number": "8867017688"}'::jsonb),
      ('78c3852d-ab85-4424-96c9-0a9c0f23188a'::uuid, 'pradeepgeetha09@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz, '{"role": "learner", "lastName": "Gari Pradeep", "firstName": "Govindaraju", "contact_number": "9980267244"}'::jsonb),
      ('84909bbf-220e-4bbc-ac9c-c08de152f913'::uuid, 'rooparoopa5954@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz, '{"role": "learner", "lastName": "B", "firstName": "Roopa", "contact_number": "7348992698"}'::jsonb),
      ('bdf00726-215a-4134-a11d-a869930c59ee'::uuid, 'harshilachu1@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz, '{"role": "learner", "lastName": "K", "firstName": "Harshil", "contact_number": "8089512323"}'::jsonb),
      ('3b4b619c-c335-427b-a510-50f4a33ff689'::uuid, 'abhijith22abhi22@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz, '{"role": "learner", "lastName": "P", "firstName": "Abhijith", "contact_number": "8086882805"}'::jsonb),
      ('8111a2a4-87a6-45b2-ae77-fa2655c7e9c2'::uuid, 'yashaswinigowda601@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz, '{"role": "learner", "lastName": "G", "firstName": "Yashaswini", "contact_number": "7829496930"}'::jsonb),
      ('83aa131a-f5ec-4511-93a9-9a24e6e7a800'::uuid, 'bhumikabharath252@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz, '{"role": "learner", "lastName": "H", "firstName": "Bhumika", "contact_number": "9741734130"}'::jsonb),
      ('97c7c027-ee73-5ba3-a2ff-39a7d6557637'::uuid, 'yamunamanjunath123@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz, '{"role": "learner", "lastName": "", "firstName": "Yamuna", "contact_number": ""}'::jsonb),
      ('106e8587-b7b3-5416-b40d-568288b0b0d5'::uuid, '7858e5c2@dismail.top', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz, '{"role": "learner", "lastName": "Pradeeep", "firstName": "Harikrishna", "contact_number": ""}'::jsonb),
      ('e07adffb-1260-5c19-9b1d-26af96b291bd'::uuid, 'sanjanakumarmesthakumarmestha@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz, '{"role": "learner", "lastName": "Kumar Mestha", "firstName": "Sanjana", "contact_number": ""}'::jsonb),
      ('1226f653-109d-5f8c-bba9-4e623b39ed64'::uuid, 'varungb04@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz, '{"role": "learner", "lastName": "GB", "firstName": "Varun", "contact_number": ""}'::jsonb),
      ('1fd5f1f0-d353-5af3-86b0-cbdd5fdbc260'::uuid, 'sinchana2393@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz, '{"role": "learner", "lastName": "", "firstName": "Sinchana", "contact_number": ""}'::jsonb),
      ('9708cc21-ad52-5059-bc5d-18764367bb29'::uuid, 'charuc250@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz, '{"role": "learner", "lastName": "H S", "firstName": "Charan", "contact_number": ""}'::jsonb),
      ('ce171a34-29de-5215-945e-95a5071f647b'::uuid, 'santhoshgowda2102@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz, '{"role": "learner", "lastName": "CP", "firstName": "Santhosh", "contact_number": ""}'::jsonb),
      ('6a7e0f67-6d05-55c1-ab6f-6e64815dc22d'::uuid, 'kantharajurn17@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz, '{"role": "learner", "lastName": "R N", "firstName": "Kantharaju", "contact_number": ""}'::jsonb),
      ('7eeb6170-c7b9-55d8-8d77-7a38e514efb2'::uuid, 'hariprasadnayak77280@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz, '{"role": "learner", "lastName": "nayak", "firstName": "Hariprasad", "contact_number": ""}'::jsonb)
  ) AS v(id, email, created_at, updated_at, user_metadata)
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    "organizationId" = EXCLUDED."organizationId",
    "firstName" = EXCLUDED."firstName",
    "lastName" = EXCLUDED."lastName",
    phone = EXCLUDED.phone,
    role = 'learner',
    "isActive" = true,
    metadata = EXCLUDED.metadata,
    "updatedAt" = NOW();

  -- 2. Insert into public.users_shadow
  INSERT INTO public.users_shadow (id, email, created_at, updated_at)
  SELECT
    v.id,
    v.email,
    v.created_at,
    v.updated_at
  FROM (
    VALUES
      ('df630f8a-5f7e-4d05-a5f9-44dd5cb002a0'::uuid, 'bhoomika19503@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz),
      ('1b737699-3612-4dd2-a918-ea731ff7967f'::uuid, 'cchaithran698@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz),
      ('d1406b86-0293-47e8-b2d5-4c98671f4b86'::uuid, 'ambujakhgowda@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz),
      ('9d372f1c-cc8f-4bde-9253-404fef298a42'::uuid, 'thanukrishna.am@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz),
      ('391618dd-a957-4559-9012-bffa0b41af04'::uuid, 'hemu818hr@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz),
      ('12dfa911-d489-4532-a219-efd474249edd'::uuid, 'hemanthgowdaa755@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz),
      ('3118a7eb-a9d4-4ae2-8520-8a5987adfc0b'::uuid, 'jhenkaragowda212@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz),
      ('210f56f3-444e-415d-8413-6455e49282c9'::uuid, 'manjushreegowda778@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz),
      ('86564bf1-0ba3-40af-92a4-f3a690d97240'::uuid, 'dakshdograg15@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz),
      ('1dba0d34-cfb4-4ca2-9cbd-992038687402'::uuid, 'mgagana69@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz),
      ('65d94686-1d38-49c8-882f-887aeed08a5d'::uuid, 'rajeshwarihiremath521@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz),
      ('4ac64293-46c6-4dcc-86b3-19371388abc6'::uuid, 'varshajaishankar06@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz),
      ('4ce5ccd1-3e80-42f7-ad72-b9691f1bc84b'::uuid, 'tejuteja082@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz),
      ('d6dd270c-9d52-4fb1-a74b-7a78474daf50'::uuid, 'nageshwari1922@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz),
      ('69b35ea7-3c06-488f-b360-32bc2c60e729'::uuid, 'abhisheknd267@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz),
      ('11a57fb7-5da6-48af-a271-b42b95650590'::uuid, 'abhikdabhi@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz),
      ('2e58e766-7c65-44c4-acd7-759830a1e004'::uuid, 'priyankaammu663@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz),
      ('7f9a198d-84b8-48d7-9625-0d6cc5da3cc4'::uuid, 'hcmanoj47@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz),
      ('848e03d3-b173-4c3f-9459-e1129e899e2e'::uuid, 'bhavyamt2907@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz),
      ('7a2bcc9f-02b9-4ca9-8c28-271799f995ea'::uuid, 'chaithanyatr24@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz),
      ('5a6139c0-a028-476e-888c-d95a4961e7a8'::uuid, 'hemantahemanth79@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz),
      ('78ee2603-c130-4c65-95ff-a577e23bec92'::uuid, 'sunanda.anusha@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz),
      ('894f6cc3-3a88-4d5f-be17-d94f655ff6d1'::uuid, 'shwethag395@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz),
      ('08417faa-9518-4ec8-8c02-6b35d1a32444'::uuid, 'm.jayashree352@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz),
      ('b9035456-6df5-43cd-842a-21af2015df5a'::uuid, 'kasarvidyashree@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz),
      ('890c9c79-8289-4082-ada6-1b5a856e79d7'::uuid, 'chandanaks547@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz),
      ('102993cd-9a16-4e51-97b7-fb73f039bdfb'::uuid, 'hemanthsj2003@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz),
      ('b14f698b-b21a-4784-bad9-587a7b0575e3'::uuid, 'vinodvinu3123@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz),
      ('f37a38ff-ee5f-4836-93e6-6fdc10116ad8'::uuid, 'rajeshin2003@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz),
      ('69cbb8d6-49f3-4609-8e93-73e3b012635d'::uuid, 'shobithar91@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz),
      ('575dca84-0e7e-41fb-b69d-95a3800baa16'::uuid, 'rakshithamr68@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz),
      ('8fda8ff3-3f1d-42cd-a687-5dae02ae9fa1'::uuid, 'roopeshgc2003@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz),
      ('80bf7c76-5e3d-400f-819d-2ac5d6e69ce8'::uuid, 'lokeshloki3497@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz),
      ('73481733-57b3-42d9-9e98-5f888df60da7'::uuid, 'jeevithav01@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz),
      ('c0177005-7ce5-46fd-985a-52408ce8494f'::uuid, 'vaishnavigopinath03@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz),
      ('f421e3d5-6ae0-4bd5-b930-7c22621c9dfe'::uuid, 'sahanaanandaiah@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz),
      ('b9d7d0c2-073b-409a-b484-2e8b2abadce4'::uuid, 'jeevithadn47@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz),
      ('645e412b-27c3-4b77-85a6-f8e89f337cf0'::uuid, 'smmamatha910@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz),
      ('4ad42074-7e9e-467e-90d7-d14b964fdb3e'::uuid, 'ppavan50559@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz),
      ('9a4ee293-937f-4871-885b-661c348a7b61'::uuid, 'yamunanm8@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz),
      ('63be23ea-f522-4217-bf3f-98799c17dfae'::uuid, 'narayannarayan0726@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz),
      ('02fa3520-3233-4ca6-a130-fb17ef66f8b7'::uuid, 'rakshithps4477@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz),
      ('467fe998-2985-41dd-97eb-9f96a8330ee7'::uuid, 'ppavan50776@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz),
      ('1c37d8f0-dd0e-4880-a08a-0ae435ad9da3'::uuid, 'varshinivarshanb@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz),
      ('bb4b4de4-03fe-4200-b84f-461568391f07'::uuid, 'lavlavanya6360@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz),
      ('03e32968-c238-4e59-9986-d7a9f618dc40'::uuid, 'lavanya13142003@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz),
      ('b9434c21-4339-46c3-923a-cea3233d6651'::uuid, 'sevanthi752@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz),
      ('d5127e9e-f2fb-4d36-86d7-0f2ff90050f3'::uuid, 'akhilapinky1012@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz),
      ('71c61571-eec3-43d5-83f7-fc772b176b84'::uuid, 'chettyleo19@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz),
      ('e309e516-1d55-4e12-a223-6a05b168025b'::uuid, 'nayanaks1233@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz),
      ('345652d8-2852-4acb-9402-c4b5688a36df'::uuid, 'nalinagowda40@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:10:03.386466+00'::timestamptz),
      ('6cd17b2d-00f8-422c-9df6-bffebc8d90f9'::uuid, 'gowdachethu83@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz),
      ('001d6727-c673-40c8-8592-ff2665e35eaf'::uuid, 'varshithahs626@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz),
      ('b6bfa400-cbfd-4ba9-aafd-88072e531ca2'::uuid, 'lohithks2003@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz),
      ('b2cc00d9-c02d-4032-b2a8-55a1af4c62d0'::uuid, 'shivakumar07505@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz),
      ('955f932a-025d-4e47-ba43-1149c055eac7'::uuid, 'hamsangowda3@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz),
      ('e79beba4-09e2-467c-a9a2-fbb73726bfe0'::uuid, 'meghanamv347@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz),
      ('78c3852d-ab85-4424-96c9-0a9c0f23188a'::uuid, 'pradeepgeetha09@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz),
      ('84909bbf-220e-4bbc-ac9c-c08de152f913'::uuid, 'rooparoopa5954@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz),
      ('bdf00726-215a-4134-a11d-a869930c59ee'::uuid, 'harshilachu1@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz),
      ('3b4b619c-c335-427b-a510-50f4a33ff689'::uuid, 'abhijith22abhi22@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz),
      ('8111a2a4-87a6-45b2-ae77-fa2655c7e9c2'::uuid, 'yashaswinigowda601@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz),
      ('83aa131a-f5ec-4511-93a9-9a24e6e7a800'::uuid, 'bhumikabharath252@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz)
  ) AS v(id, email, created_at, updated_at)
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = NOW();

  -- 3. Map every learner to Soundarya in the SkillPassport app DB.
  -- SSO memberships alone are not read by the college-admin learner APIs.
  INSERT INTO public.organization_members (
    user_id,
    organization_id,
    role,
    status,
    created_at,
    updated_at
  )
  SELECT
    u.id,
    v_org_id,
    'member',
    'active',
    NOW(),
    NOW()
  FROM public.users AS u
  WHERE u."organizationId" = v_org_id
    AND u.role = 'learner'
  ON CONFLICT (user_id, organization_id) DO UPDATE SET
    role = 'member',
    status = 'active',
    updated_at = NOW();

  -- 4. Insert/Update public.learners
  INSERT INTO public.learners (
    id,
    user_id,
    email,
    name,
    contact_number,
    college_id,
    learner_type,
    approval_status,
    metadata,
    created_at,
    updated_at
  )
  SELECT
    v.id,
    v.id,
    v.email,
    trim(concat(v.user_metadata->>'firstName', ' ', v.user_metadata->>'lastName')),
    v.user_metadata->>'contact_number',
    v_org_id,
    'college_student',
    'approved',
    v.user_metadata,
    v.created_at,
    v.updated_at
  FROM (
    VALUES
      ('df630f8a-5f7e-4d05-a5f9-44dd5cb002a0'::uuid, 'bhoomika19503@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz, '{"role": "learner", "lastName": "D", "firstName": "Bhoomika", "contact_number": "7259750959"}'::jsonb),
      ('1b737699-3612-4dd2-a918-ea731ff7967f'::uuid, 'cchaithran698@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz, '{"role": "learner", "lastName": "N", "firstName": "Chaithra", "contact_number": "08861406830"}'::jsonb),
      ('d1406b86-0293-47e8-b2d5-4c98671f4b86'::uuid, 'ambujakhgowda@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz, '{"role": "learner", "lastName": "K H", "firstName": "Ambuja", "contact_number": "07259164127"}'::jsonb),
      ('9d372f1c-cc8f-4bde-9253-404fef298a42'::uuid, 'thanukrishna.am@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz, '{"role": "learner", "lastName": "A M", "firstName": "Thanuja", "contact_number": "8971617792"}'::jsonb),
      ('391618dd-a957-4559-9012-bffa0b41af04'::uuid, 'hemu818hr@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz, '{"role": "learner", "lastName": "H R", "firstName": "Hemanth", "contact_number": "8618074472"}'::jsonb),
      ('12dfa911-d489-4532-a219-efd474249edd'::uuid, 'hemanthgowdaa755@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz, '{"role": "learner", "lastName": "A", "firstName": "Hemanth", "contact_number": "7259473839"}'::jsonb),
      ('3118a7eb-a9d4-4ae2-8520-8a5987adfc0b'::uuid, 'jhenkaragowda212@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz, '{"role": "learner", "lastName": "A Gowda", "firstName": "Jhenkar", "contact_number": "7204328122"}'::jsonb),
      ('210f56f3-444e-415d-8413-6455e49282c9'::uuid, 'manjushreegowda778@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz, '{"role": "learner", "lastName": "T N", "firstName": "Manjushree", "contact_number": "9741728110"}'::jsonb),
      ('86564bf1-0ba3-40af-92a4-f3a690d97240'::uuid, 'dakshdograg15@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz, '{"role": "learner", "lastName": "Dogra", "firstName": "Daksh", "contact_number": "9041587334"}'::jsonb),
      ('1dba0d34-cfb4-4ca2-9cbd-992038687402'::uuid, 'mgagana69@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz, '{"role": "learner", "lastName": "", "firstName": "Gagana.m", "contact_number": "6361709321"}'::jsonb),
      ('65d94686-1d38-49c8-882f-887aeed08a5d'::uuid, 'rajeshwarihiremath521@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz, '{"role": "learner", "lastName": "Hiremath", "firstName": "Rajeshwari", "contact_number": "6366194317"}'::jsonb),
      ('4ac64293-46c6-4dcc-86b3-19371388abc6'::uuid, 'varshajaishankar06@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz, '{"role": "learner", "lastName": "", "firstName": "Varsha.J", "contact_number": "9187322030"}'::jsonb),
      ('4ce5ccd1-3e80-42f7-ad72-b9691f1bc84b'::uuid, 'tejuteja082@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz, '{"role": "learner", "lastName": "Babu K P", "firstName": "Teja", "contact_number": "6282652872"}'::jsonb),
      ('d6dd270c-9d52-4fb1-a74b-7a78474daf50'::uuid, 'nageshwari1922@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz, '{"role": "learner", "lastName": "k", "firstName": "Nageshwari", "contact_number": "9380465144"}'::jsonb),
      ('69b35ea7-3c06-488f-b360-32bc2c60e729'::uuid, 'abhisheknd267@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz, '{"role": "learner", "lastName": "nd", "firstName": "Abhishek", "contact_number": "7892915864"}'::jsonb),
      ('11a57fb7-5da6-48af-a271-b42b95650590'::uuid, 'abhikdabhi@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz, '{"role": "learner", "lastName": "K D", "firstName": "Abhishek", "contact_number": "9880216675"}'::jsonb),
      ('2e58e766-7c65-44c4-acd7-759830a1e004'::uuid, 'priyankaammu663@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz, '{"role": "learner", "lastName": "SY", "firstName": "Priyanka", "contact_number": "6363900653"}'::jsonb),
      ('7f9a198d-84b8-48d7-9625-0d6cc5da3cc4'::uuid, 'hcmanoj47@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz, '{"role": "learner", "lastName": "HC", "firstName": "Manoj", "contact_number": "8073992906"}'::jsonb),
      ('848e03d3-b173-4c3f-9459-e1129e899e2e'::uuid, 'bhavyamt2907@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz, '{"role": "learner", "lastName": "M T", "firstName": "Bhavya", "contact_number": "7975816304"}'::jsonb),
      ('7a2bcc9f-02b9-4ca9-8c28-271799f995ea'::uuid, 'chaithanyatr24@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz, '{"role": "learner", "lastName": "T R", "firstName": "Chaithanya", "contact_number": "9972706182"}'::jsonb),
      ('5a6139c0-a028-476e-888c-d95a4961e7a8'::uuid, 'hemantahemanth79@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz, '{"role": "learner", "lastName": "L G", "firstName": "Hemanth", "contact_number": "8123008621"}'::jsonb),
      ('78ee2603-c130-4c65-95ff-a577e23bec92'::uuid, 'sunanda.anusha@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz, '{"role": "learner", "lastName": "", "firstName": "Anusha", "contact_number": "6363902432"}'::jsonb),
      ('894f6cc3-3a88-4d5f-be17-d94f655ff6d1'::uuid, 'shwethag395@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz, '{"role": "learner", "lastName": "B", "firstName": "Shwetha", "contact_number": "9632256768"}'::jsonb),
      ('08417faa-9518-4ec8-8c02-6b35d1a32444'::uuid, 'm.jayashree352@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz, '{"role": "learner", "lastName": "M", "firstName": "Jayashree", "contact_number": "8050046883"}'::jsonb),
      ('b9035456-6df5-43cd-842a-21af2015df5a'::uuid, 'kasarvidyashree@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz, '{"role": "learner", "lastName": "Honnalingappa Kasar", "firstName": "Vidyashri", "contact_number": "8088458761"}'::jsonb),
      ('890c9c79-8289-4082-ada6-1b5a856e79d7'::uuid, 'chandanaks547@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz, '{"role": "learner", "lastName": "KS", "firstName": "Chandana", "contact_number": "6362462020"}'::jsonb),
      ('102993cd-9a16-4e51-97b7-fb73f039bdfb'::uuid, 'hemanthsj2003@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz, '{"role": "learner", "lastName": "SJ", "firstName": "Hemanth", "contact_number": "7899998236"}'::jsonb),
      ('b14f698b-b21a-4784-bad9-587a7b0575e3'::uuid, 'vinodvinu3123@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz, '{"role": "learner", "lastName": "H A", "firstName": "Vinod", "contact_number": "6362923578"}'::jsonb),
      ('f37a38ff-ee5f-4836-93e6-6fdc10116ad8'::uuid, 'rajeshin2003@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz, '{"role": "learner", "lastName": "I N", "firstName": "Rajesh", "contact_number": "9019522356"}'::jsonb),
      ('69cbb8d6-49f3-4609-8e93-73e3b012635d'::uuid, 'shobithar91@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz, '{"role": "learner", "lastName": "R", "firstName": "Shobhitha", "contact_number": "6360244924"}'::jsonb),
      ('575dca84-0e7e-41fb-b69d-95a3800baa16'::uuid, 'rakshithamr68@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz, '{"role": "learner", "lastName": "M R", "firstName": "Rakshitha", "contact_number": "07204615711"}'::jsonb),
      ('8fda8ff3-3f1d-42cd-a687-5dae02ae9fa1'::uuid, 'roopeshgc2003@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz, '{"role": "learner", "lastName": "G C", "firstName": "Roopesh", "contact_number": "7019288212"}'::jsonb),
      ('80bf7c76-5e3d-400f-819d-2ac5d6e69ce8'::uuid, 'lokeshloki3497@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz, '{"role": "learner", "lastName": "Gowda s", "firstName": "Lokesh", "contact_number": "8197509229"}'::jsonb),
      ('73481733-57b3-42d9-9e98-5f888df60da7'::uuid, 'jeevithav01@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz, '{"role": "learner", "lastName": "v", "firstName": "Jeevitha", "contact_number": "8296801201"}'::jsonb),
      ('c0177005-7ce5-46fd-985a-52408ce8494f'::uuid, 'vaishnavigopinath03@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz, '{"role": "learner", "lastName": "G", "firstName": "Vaishnavi", "contact_number": "8147480814"}'::jsonb),
      ('f421e3d5-6ae0-4bd5-b930-7c22621c9dfe'::uuid, 'sahanaanandaiah@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz, '{"role": "learner", "lastName": "A", "firstName": "Sahana", "contact_number": "7483124757"}'::jsonb),
      ('b9d7d0c2-073b-409a-b484-2e8b2abadce4'::uuid, 'jeevithadn47@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz, '{"role": "learner", "lastName": "D N", "firstName": "Jeevitha", "contact_number": "8088167833"}'::jsonb),
      ('645e412b-27c3-4b77-85a6-f8e89f337cf0'::uuid, 'smmamatha910@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz, '{"role": "learner", "lastName": "S M", "firstName": "Mamatha", "contact_number": "8431636683"}'::jsonb),
      ('4ad42074-7e9e-467e-90d7-d14b964fdb3e'::uuid, 'ppavan50559@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz, '{"role": "learner", "lastName": "Kumar K L", "firstName": "Pavan", "contact_number": "7483246826"}'::jsonb),
      ('9a4ee293-937f-4871-885b-661c348a7b61'::uuid, 'yamunanm8@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz, '{"role": "learner", "lastName": "", "firstName": "Yamuna", "contact_number": "9535388565"}'::jsonb),
      ('63be23ea-f522-4217-bf3f-98799c17dfae'::uuid, 'narayannarayan0726@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz, '{"role": "learner", "lastName": "", "firstName": "Chaithra.N", "contact_number": "8088325090"}'::jsonb),
      ('02fa3520-3233-4ca6-a130-fb17ef66f8b7'::uuid, 'rakshithps4477@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz, '{"role": "learner", "lastName": "P S", "firstName": "Rakshith", "contact_number": "8296564477"}'::jsonb),
      ('467fe998-2985-41dd-97eb-9f96a8330ee7'::uuid, 'ppavan50776@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz, '{"role": "learner", "lastName": "Kumar K L", "firstName": "Pavan", "contact_number": "7483246826"}'::jsonb),
      ('1c37d8f0-dd0e-4880-a08a-0ae435ad9da3'::uuid, 'varshinivarshanb@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz, '{"role": "learner", "lastName": "NB", "firstName": "Varshini", "contact_number": "9606010049"}'::jsonb),
      ('bb4b4de4-03fe-4200-b84f-461568391f07'::uuid, 'lavlavanya6360@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz, '{"role": "learner", "lastName": "B", "firstName": "Lavanya", "contact_number": "6360481817"}'::jsonb),
      ('03e32968-c238-4e59-9986-d7a9f618dc40'::uuid, 'lavanya13142003@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz, '{"role": "learner", "lastName": "P", "firstName": "Lavanya", "contact_number": "9964659168"}'::jsonb),
      ('b9434c21-4339-46c3-923a-cea3233d6651'::uuid, 'sevanthi752@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz, '{"role": "learner", "lastName": "M", "firstName": "Sevanthi", "contact_number": "7676840478"}'::jsonb),
      ('d5127e9e-f2fb-4d36-86d7-0f2ff90050f3'::uuid, 'akhilapinky1012@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz, '{"role": "learner", "lastName": "T", "firstName": "Akhila", "contact_number": "7975112280"}'::jsonb),
      ('71c61571-eec3-43d5-83f7-fc772b176b84'::uuid, 'chettyleo19@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz, '{"role": "learner", "lastName": "Chetty", "firstName": "Leo", "contact_number": "9321432950"}'::jsonb),
      ('e309e516-1d55-4e12-a223-6a05b168025b'::uuid, 'nayanaks1233@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz, '{"role": "learner", "lastName": "K S", "firstName": "Nayana", "contact_number": "6363992731"}'::jsonb),
      ('345652d8-2852-4acb-9402-c4b5688a36df'::uuid, 'nalinagowda40@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:10:03.386466+00'::timestamptz, '{"role": "learner", "lastName": "K", "firstName": "Nalina", "contact_number": "9743607378"}'::jsonb),
      ('6cd17b2d-00f8-422c-9df6-bffebc8d90f9'::uuid, 'gowdachethu83@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz, '{"role": "learner", "lastName": "G", "firstName": "Chethan", "contact_number": "9019256822"}'::jsonb),
      ('001d6727-c673-40c8-8592-ff2665e35eaf'::uuid, 'varshithahs626@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz, '{"role": "learner", "lastName": "H S", "firstName": "Varshitha", "contact_number": "9620569554"}'::jsonb),
      ('b6bfa400-cbfd-4ba9-aafd-88072e531ca2'::uuid, 'lohithks2003@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz, '{"role": "learner", "lastName": "K S", "firstName": "Lohith", "contact_number": "6363204145"}'::jsonb),
      ('b2cc00d9-c02d-4032-b2a8-55a1af4c62d0'::uuid, 'shivakumar07505@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz, '{"role": "learner", "lastName": "", "firstName": "Shivakumar", "contact_number": "9964890764"}'::jsonb),
      ('955f932a-025d-4e47-ba43-1149c055eac7'::uuid, 'hamsangowda3@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz, '{"role": "learner", "lastName": "keerthi N Gowda", "firstName": "Hamsa", "contact_number": "9886981788"}'::jsonb),
      ('e79beba4-09e2-467c-a9a2-fbb73726bfe0'::uuid, 'meghanamv347@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz, '{"role": "learner", "lastName": "M V", "firstName": "Meghana", "contact_number": "8867017688"}'::jsonb),
      ('78c3852d-ab85-4424-96c9-0a9c0f23188a'::uuid, 'pradeepgeetha09@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz, '{"role": "learner", "lastName": "Gari Pradeep", "firstName": "Govindaraju", "contact_number": "9980267244"}'::jsonb),
      ('84909bbf-220e-4bbc-ac9c-c08de152f913'::uuid, 'rooparoopa5954@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz, '{"role": "learner", "lastName": "B", "firstName": "Roopa", "contact_number": "7348992698"}'::jsonb),
      ('bdf00726-215a-4134-a11d-a869930c59ee'::uuid, 'harshilachu1@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz, '{"role": "learner", "lastName": "K", "firstName": "Harshil", "contact_number": "8089512323"}'::jsonb),
      ('3b4b619c-c335-427b-a510-50f4a33ff689'::uuid, 'abhijith22abhi22@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz, '{"role": "learner", "lastName": "P", "firstName": "Abhijith", "contact_number": "8086882805"}'::jsonb),
      ('8111a2a4-87a6-45b2-ae77-fa2655c7e9c2'::uuid, 'yashaswinigowda601@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz, '{"role": "learner", "lastName": "G", "firstName": "Yashaswini", "contact_number": "7829496930"}'::jsonb),
      ('83aa131a-f5ec-4511-93a9-9a24e6e7a800'::uuid, 'bhumikabharath252@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz, '{"role": "learner", "lastName": "H", "firstName": "Bhumika", "contact_number": "9741734130"}'::jsonb),
      ('97c7c027-ee73-5ba3-a2ff-39a7d6557637'::uuid, 'yamunamanjunath123@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz, '{"role": "learner", "lastName": "", "firstName": "Yamuna", "contact_number": ""}'::jsonb),
      ('106e8587-b7b3-5416-b40d-568288b0b0d5'::uuid, '7858e5c2@dismail.top', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz, '{"role": "learner", "lastName": "Pradeeep", "firstName": "Harikrishna", "contact_number": ""}'::jsonb),
      ('e07adffb-1260-5c19-9b1d-26af96b291bd'::uuid, 'sanjanakumarmesthakumarmestha@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz, '{"role": "learner", "lastName": "Kumar Mestha", "firstName": "Sanjana", "contact_number": ""}'::jsonb),
      ('1226f653-109d-5f8c-bba9-4e623b39ed64'::uuid, 'varungb04@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz, '{"role": "learner", "lastName": "GB", "firstName": "Varun", "contact_number": ""}'::jsonb),
      ('1fd5f1f0-d353-5af3-86b0-cbdd5fdbc260'::uuid, 'sinchana2393@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz, '{"role": "learner", "lastName": "", "firstName": "Sinchana", "contact_number": ""}'::jsonb),
      ('9708cc21-ad52-5059-bc5d-18764367bb29'::uuid, 'charuc250@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz, '{"role": "learner", "lastName": "H S", "firstName": "Charan", "contact_number": ""}'::jsonb),
      ('ce171a34-29de-5215-945e-95a5071f647b'::uuid, 'santhoshgowda2102@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz, '{"role": "learner", "lastName": "CP", "firstName": "Santhosh", "contact_number": ""}'::jsonb),
      ('6a7e0f67-6d05-55c1-ab6f-6e64815dc22d'::uuid, 'kantharajurn17@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz, '{"role": "learner", "lastName": "R N", "firstName": "Kantharaju", "contact_number": ""}'::jsonb),
      ('7eeb6170-c7b9-55d8-8d77-7a38e514efb2'::uuid, 'hariprasadnayak77280@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz, '{"role": "learner", "lastName": "nayak", "firstName": "Hariprasad", "contact_number": ""}'::jsonb)
  ) AS v(id, email, created_at, updated_at, user_metadata)
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    contact_number = EXCLUDED.contact_number,
    college_id = v_org_id,
    learner_type = 'college_student',
    approval_status = 'approved',
    is_deleted = false,
    updated_at = NOW();

  -- 5. Allocate the organization's enterprise subscription to these learners.
  -- This makes payment/entitlement checks use the college plan instead of
  -- treating each learner as an individual subscriber.
  INSERT INTO public.license_pools (
    id,
    organization_subscription_id,
    organization_id,
    organization_type,
    pool_name,
    member_type,
    allocated_seats,
    auto_assign_new_members,
    assignment_criteria,
    is_active,
    created_by
  ) VALUES (
    '84f6a944-a23d-56d8-9823-1f4d8c8e39f8',
    'd3876903-b74e-55d7-910f-90907ea3e11f',
    v_org_id,
    'college',
    'Soundarya learners',
    'learner',
    5000,
    true,
    jsonb_build_object('role', 'learner', 'organization_id', v_org_id::text),
    true,
    '783d8431-a034-5369-ae47-3aca2c4ec618'
  )
  ON CONFLICT (id) DO UPDATE SET
    allocated_seats = EXCLUDED.allocated_seats,
    auto_assign_new_members = true,
    is_active = true,
    updated_at = NOW();

  INSERT INTO public.license_assignments (
    license_pool_id,
    organization_subscription_id,
    user_id,
    member_type,
    status,
    assigned_by
  )
  SELECT
    '84f6a944-a23d-56d8-9823-1f4d8c8e39f8',
    'd3876903-b74e-55d7-910f-90907ea3e11f',
    u.id,
    'learner',
    'active',
    '783d8431-a034-5369-ae47-3aca2c4ec618'
  FROM public.users AS u
  WHERE u."organizationId" = v_org_id
    AND u.role = 'learner'
  ON CONFLICT (user_id, organization_subscription_id)
    WHERE status = 'active'
  DO UPDATE SET
    license_pool_id = EXCLUDED.license_pool_id,
    member_type = 'learner',
    updated_at = NOW();

END;
$seed_learners$;

COMMIT;

-- Seed for SkillPassport App DB (production)
-- Updates learner submissions for MBA students who have submitted their tasks
-- Updates existing college_learner_assignments rows from 'todo' to 'submitted'
-- Safe and idempotent: Only updates rows that exist and aren't already submitted
-- Submission dates are calculated as ~1 week after task due dates
--
-- TASKS AND THEIR DUE DATES (from 20261023100700_seed_soundarya_mba_tasks.sql):
--   Student Assessments: Due: 2026-08-29, Submit: 2026-09-05
--   Pre-Counselling (Day 1): Due: 2026-08-31, Submit: 2026-09-07
--   Pre-Counselling (Day 2): Due: 2026-09-01, Submit: 2026-09-08
--   Video Resume (Day 1): Due: 2026-09-02, Submit: 2026-09-09
--   Video Resume (Day 2): Due: 2026-09-03, Submit: 2026-09-10
--   Company Formation & Performance (Subashini): Due: 2026-09-10, Submit: 2026-09-17
--   Power BI: Due: 2026-09-22, Submit: 2026-09-29
--   HR Bootcamp (Poornima): Due: 2026-09-25, Submit: 2026-10-02
--   Skill Ecosystem Orientation: Due: 2026-09-28, Submit: 2026-10-05
--
-- SUBMISSIONS SEEDED:
--   Power BI task: ALL 26 MBA students across all 4 streams ✅ COMPLETE
--   HR Placement Bootcamp: 12 HR students (Jeevitha D N, Sumitha S, Simritha S, Varshini NB, Harsha, Shwetha B, Gagana.m, Chaithanya T R, Varsha, Sanjana Kumar Mestha, Teja Babu K P, Thanuja A M) ✅
--   Company Formation & Performance: 109 submissions (Varsha.J, Anusha, Sumitha S, Rajesh I N, Yamuna, Mamatha S M, Jhenkar A Gowda, Varshitha H S, Sahana A, Hemanth L G, Chethan G, Vaishnavi G, ABHISHEK ND, Shivakumar, Rakshith P S, Shobhitha R, D N Jeevitha, Chaithanya T R, Chaithra N, Santhosh C P, Priyanka SY, Hariprasad nayak, Roopesh G C, Varshini NB, THANUJA A M, Simritha S, Yeshashwini G, Chandana KS, Teja Babu K P, Pavan Kumar K L, Varun GB, Jayashree M, Bhumika H, Nageshwari k, Vinod H A, Lohith K S, Chaithra.N, Harsha, Sanjana Kumar Mestha, Bhavya M T, Hemanth SJ, Rajeshwari Hiremath, Sinchana C T, Abhishek K D, Lokesh gowda S, Gagana.M, Shwetha B, Deekshith, K H Ambuja, Rakshitha M R, Vidyashri Honnalingappa kasar, Jeevitha V, Kantharaju R N, Manjushree T N) ✅
--   Marketing: 4 (Abhishek Nd, Shivakumar, Rakshith P S, CHAITHRA N)
--   Business Analytics: 7 (Bhumika BA, Varshitha HS, Vaishnavi G, JEEVITHA V, Mamatha S M, Roopesh G C)
--   Finance: 9 (Chethan G, Chandana KS, Yamuna, Jayashree M, Anusha, HEMANTH SJ, AMBUJA K H)
--   HR: 14 (Jeevitha D N, SUMITHA, Simritha S, VARSHINI NB, Harsha, Shwetha B, Gagana.m, Chaithanya T R, Varsha, Sanjana Kumar Mestha, Teja Babu K P, Thanuja A M)
--   Total submissions: 147 (26 Power BI + 12 HR Bootcamp + 109 Company Formation)
--
-- SUBMISSION TYPES: File submissions with JSONB metadata (Google Drive links)
--
-- PRE-CHECK (read-only): Verify tasks exist
--   SELECT assignment_id, title FROM public.college_assignments 
--   WHERE title IN (
--     'Data Cleaning, Formula and pivot table, Business dashboards, decision-making and analytical presentation',
--     'Human resourse placement Bootcamp',
--     'Company Formation & Performance'
--   )
--   AND is_deleted = false;

BEGIN;

-- Update learner submissions
UPDATE public.college_learner_assignments cla
SET 
  status = 'submitted',
  submission_type = 'file',
  submission_url = v.url,
  submission_files = v.files::jsonb,
  submission_date = v.submit_date,
  completed_date = v.submit_date,
  updated_date = now()
FROM (VALUES
  -- Power BI Task (Due: 2026-09-22, Submit: 2026-09-29)
  -- Email, Task Title, Submission URL, Submission Files JSON, Submit Date
  
  -- Batch 1: 5 students
  ('abhisheknd267@gmail.com'::text, 
   'Data Cleaning, Formula and pivot table, Business dashboards, decision-making and analytical presentation'::text, 
   'https://drive.google.com/file/d/1wByKReLhr7EJDOop_ISMNNOR_VbDzRiG/view'::text,
   '[{"url":"https://drive.google.com/file/d/1wByKReLhr7EJDOop_ISMNNOR_VbDzRiG/view","name":"Abhishek Nd Marketing ","size":64665,"type":"image/jpeg"},{"url":"https://drive.google.com/file/d/1SzBQp53yAw7JmmaAPBmX6VgTM8odJWMl/view","name":"Abhishek Nd Marketing ","size":64665,"type":"image/jpeg"},{"url":"https://drive.google.com/file/d/1FCBPadQcVf3cr1UJIcQMNk8_6fHkroj4/view","name":"Abhishek ND MARKETING sales dashboard.xlsx","size":195240,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}]'::text,
   '2026-09-29 14:00:00+00'::timestamptz),
   
  ('bhumikabharath252@gmail.com'::text, 
   'Data Cleaning, Formula and pivot table, Business dashboards, decision-making and analytical presentation'::text, 
   'https://drive.google.com/file/d/19yYESCn9ZfD57JL_8jS0J8T4zkVVUOuz/view'::text,
   '[{"url":"https://drive.google.com/file/d/19yYESCn9ZfD57JL_8jS0J8T4zkVVUOuz/view","name":"Bhumika BA","size":87542,"type":"image/jpeg"},{"url":"https://drive.google.com/file/d/1QAlOypuq6dscN6ReWjzDlHHr9y2Bo9r9/view","name":"Bhumika Business analytics-1.xlsx","size":82934,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}]'::text,
   '2026-09-29 14:30:00+00'::timestamptz),
   
  ('gowdachethu83@gmail.com'::text, 
   'Data Cleaning, Formula and pivot table, Business dashboards, decision-making and analytical presentation'::text, 
   'https://drive.google.com/file/d/1da175-jK1OhY7A9yvnP49GL7drYOZOwK/view'::text,
   '[{"url":"https://drive.google.com/file/d/1da175-jK1OhY7A9yvnP49GL7drYOZOwK/view","name":"Chethan G(finance)","size":100814,"type":"image/jpeg"},{"url":"https://drive.google.com/file/d/1hhTSwZIRDIAOzifYiNuFYtlzGAzLWUfV/view","name":"Chethan G (finance)","size":110641,"type":"image/jpeg"}]'::text,
   '2026-09-29 15:00:00+00'::timestamptz),
   
  ('rajeshin2003@gmail.com'::text, 
   'Data Cleaning, Formula and pivot table, Business dashboards, decision-making and analytical presentation'::text, 
   'https://drive.google.com/file/d/1Sd2kHj6nIIcZ60OfOiQcc0kbT-lauvkd/view'::text,
   '[{"url":"https://drive.google.com/file/d/1Sd2kHj6nIIcZ60OfOiQcc0kbT-lauvkd/view","name":"Rajesh I N ","size":18371,"type":"application/pdf"},{"url":"https://drive.google.com/file/d/1UFuGKQAMD3O48fCAX3i-OsbS8Fma0vEg/view","name":"Rajesh I N","size":64102,"type":"image/jpeg"}]'::text,
   '2026-09-29 15:30:00+00'::timestamptz),
   
  ('jeevithadn47@gmail.com'::text, 
   'Data Cleaning, Formula and pivot table, Business dashboards, decision-making and analytical presentation'::text, 
   'https://drive.google.com/file/d/1tcZLucv9KggnuO4LFjjsPYE1f-fuN5K7/view'::text,
   '[{"url":"https://drive.google.com/file/d/1tcZLucv9KggnuO4LFjjsPYE1f-fuN5K7/view","name":"Jeevitha D N (HR)","size":39260,"type":"image/png"},{"url":"https://drive.google.com/file/d/1QBD3m5PIlGxzLLVhcBHKesSq2YmioZuz/view","name":"Jeevitha D N (HR)","size":199703,"type":"image/png"}]'::text,
   '2026-09-29 16:00:00+00'::timestamptz),
   
  -- Batch 2: 6 students
  ('shivakumar07505@gmail.com'::text, 
   'Data Cleaning, Formula and pivot table, Business dashboards, decision-making and analytical presentation'::text, 
   'https://drive.google.com/file/d/1J1JvIKKVhofNR5eSgWDxQr0AUSDGxw3B/view'::text,
   '[{"url":"https://drive.google.com/file/d/1J1JvIKKVhofNR5eSgWDxQr0AUSDGxw3B/view","name":"shivakumar dashboard Marketing excel.xlsx","size":175442,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"},{"url":"https://drive.google.com/file/d/13vUPT6sXbeQpA-sqKYZwRlKH-CPj1J5X/view","name":"Shivakumar (Marketing)","size":56961,"type":"image/png"}]'::text,
   '2026-09-29 16:30:00+00'::timestamptz),
   
  ('rakshithps4477@gmail.com'::text, 
   'Data Cleaning, Formula and pivot table, Business dashboards, decision-making and analytical presentation'::text, 
   'https://drive.google.com/file/d/1ICmc3KG6mn8ENn4WtfPrBCwq3xMVQM7C/view'::text,
   '[{"url":"https://drive.google.com/file/d/1ICmc3KG6mn8ENn4WtfPrBCwq3xMVQM7C/view","name":"RAKSHITH DASHBOARD.xlsx (MARKETING)","size":172514,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"},{"url":"https://drive.google.com/file/d/1AvTvCm3-q1PHrwDk_cRMDfNm1JCPZJyf/view","name":"Rakshith P S(marketing)","size":44657,"type":"image/png"}]'::text,
   '2026-09-29 17:00:00+00'::timestamptz),
   
  ('sumithasenthil0225@gmail.com'::text, 
   'Data Cleaning, Formula and pivot table, Business dashboards, decision-making and analytical presentation'::text, 
   'https://drive.google.com/file/d/1koAdTgoKtvl78aH0hkYCQQrcdDjw6wA4/view'::text,
   '[{"url":"https://drive.google.com/file/d/1koAdTgoKtvl78aH0hkYCQQrcdDjw6wA4/view","name":"SUMITHA- HR","size":57933,"type":"image/png"}]'::text,
   '2026-09-29 17:30:00+00'::timestamptz),
   
  ('sahanaanandaiah@gmail.com'::text, 
   'Data Cleaning, Formula and pivot table, Business dashboards, decision-making and analytical presentation'::text, 
   'https://drive.google.com/drive/folders/1ZDmNZWxRFhnl9aS17WljNx2tjpqGbWV2'::text,
   '[{"url":"https://drive.google.com/file/d/1-Eo9CuSQJm1k4lrPwuokiz14_dEVKkOF/view","name":"Sahana A.png","size":86752,"type":"image/png"},{"url":"https://drive.google.com/file/d/13oX2R0yIq_CYvQlT6E7-R5BGxQgbPJvR/view","name":"Sahana A Sales Excel.xlsx","size":176366,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"},{"url":"https://drive.google.com/file/d/1GtFGmfLYc3i9T3-czC4MfaWy7LV1mXmx/view","name":"Screenshot 2026-09-23 155131.png","size":193701,"type":"image/png"}]'::text,
   '2026-09-29 18:00:00+00'::timestamptz),
   
  ('chandanaks547@gmail.com'::text, 
   'Data Cleaning, Formula and pivot table, Business dashboards, decision-making and analytical presentation'::text, 
   'https://drive.google.com/drive/folders/1v0ofXclNgNZ-LDJS-LnLO1Y5fZwRzp7Y'::text,
   '[{"url":"https://drive.google.com/file/d/11WDnC0D8y8zsNo_kAOQTfYIUD07TR-ZS/view","name":"Screenshot 2026-09-23 162132.png","size":39152,"type":"image/png"},{"url":"https://drive.google.com/file/d/1QIKqgedXpEmGuZl_IuOjt7Jmfr5LuYbh/view","name":"Screenshot 2026-09-23 161905.png","size":186206,"type":"image/png"},{"url":"https://drive.google.com/file/d/1kPQhuhD-kJyToUTvuPay6VkwVF3B1zkX/view","name":"Chandana KS_ Excel Dashboard RM.xlsx","size":186467,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}]'::text,
   '2026-09-29 18:30:00+00'::timestamptz),
   
  ('varshithahs626@gmail.com'::text, 
   'Data Cleaning, Formula and pivot table, Business dashboards, decision-making and analytical presentation'::text, 
   'https://drive.google.com/drive/folders/1YmruBjdxv5jr7VBmcl4G_R80cB5toXyQ'::text,
   '[{"url":"https://drive.google.com/file/d/1FUAU1DuX6LcnQJX3QyMdfvCZRqytKCku/view","name":"Varshitha HS - EXCEL.png","size":100732,"type":"image/png"},{"url":"https://drive.google.com/file/d/1ppLurKzJnefHlEROeXN5X1kbeRQGnskY/view","name":"Varshitha HS - EXCEL.xlsx","size":175066,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"},{"url":"https://drive.google.com/file/d/1cZbMB9-gj14qhi_b-GoozOu1Zd7J_Vsm/view","name":"Varshitha HS - POWER BI.png","size":96920,"type":"image/png"}]'::text,
   '2026-09-29 19:00:00+00'::timestamptz),
   
  -- Batch 3: 5 students
  ('yamunamanjunath123@gmail.com'::text, 
   'Data Cleaning, Formula and pivot table, Business dashboards, decision-making and analytical presentation'::text, 
   'https://drive.google.com/drive/folders/1yfnDZwv5qVT2DbRyMuDpLOQOP2IvNt7x'::text,
   '[{"url":"https://drive.google.com/file/d/14vtlzdPtzQRKzBLhQs9IesIH-rCvsMQQ/view","name":"Screenshot (2).png","size":300384,"type":"image/png"},{"url":"https://drive.google.com/file/d/1irXIhFTH6y2UDesZznlz_OnjEaKSS0l7/view","name":"YAMUNA (1).xlsx","size":176966,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}]'::text,
   '2026-09-29 19:30:00+00'::timestamptz),
   
  ('lohithks2003@gmail.com'::text, 
   'Data Cleaning, Formula and pivot table, Business dashboards, decision-making and analytical presentation'::text, 
   'https://drive.google.com/drive/folders/1OQo8nAO_Uq4kKXbxBFyFrroHMXiLZfAR'::text,
   '[{"url":"https://docs.google.com/spreadsheets/d/1p757R_ZcvEDwwX_kD0B0emW-l_WWKXIw4oWEiRhvQt4/edit","name":"Measuring Customer Satisfaction towards Products & Services offered by Jio Store Digital, Hesaraghatta Main Road(Reliance Retail Ltd.) (Responses)","size":8840,"type":"application/vnd.google-apps.spreadsheet"},{"url":"https://drive.google.com/file/d/1JtWSpmZS3GgVYnnNBzb6hr5KtvvOxl8n/view","name":"Lohith KS_Power BI Dashboard.png","size":57018,"type":"image/png"},{"url":"https://drive.google.com/file/d/17-ATiWtwZYdEQB5bWgkHm6YK1HblYcW_/view","name":"LOHITH K S_MARKETING_DASHBOARD.xlsx","size":188725,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}]'::text,
   '2026-09-29 20:00:00+00'::timestamptz),
   
  ('m.jayashree352@gmail.com'::text, 
   'Data Cleaning, Formula and pivot table, Business dashboards, decision-making and analytical presentation'::text, 
   'https://drive.google.com/drive/folders/10uviHZ6q0ETgntNKImsvFsOvHxP7sord'::text,
   '[{"url":"https://drive.google.com/file/d/1bkM6FqCuav5S1CTLSiaqw7M9Ee-VTqOk/view","name":"Screenshot 2026-09-23 160412.png","size":347690,"type":"image/png"},{"url":"https://drive.google.com/file/d/110z89Nlfu78J5RVQEK7vGxS8ckCXKFQa/view","name":"Screenshot 2026-09-23 155230.png","size":32286,"type":"image/png"},{"url":"https://drive.google.com/file/d/1eEqYPU-zN0avlh7BgjCzCYPa6fjyFBlx/view","name":"Jayashree M (Finance).xlsx","size":189797,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}]'::text,
   '2026-09-29 20:30:00+00'::timestamptz),
   
  ('sunanda.anusha@gmail.com'::text, 
   'Data Cleaning, Formula and pivot table, Business dashboards, decision-making and analytical presentation'::text, 
   'https://drive.google.com/drive/folders/1GdlIJ9TMyPr0CBECmmDyEQIml0Xhv3PK'::text,
   '[{"url":"https://drive.google.com/file/d/1F6FkEI-RviqghL_s11Yko6rZM27xrC5_/view","name":"Screenshot 2026-09-23 154713.png","size":54859,"type":"image/png"},{"url":"https://drive.google.com/file/d/1k6ka13EV0LaXjSxZ1HvJGG91WpJs7ZC8/view","name":"Anusha..xlsx","size":176966,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}]'::text,
   '2026-09-29 21:00:00+00'::timestamptz),
   
  ('vaishnavigopinath03@gmail.com'::text, 
   'Data Cleaning, Formula and pivot table, Business dashboards, decision-making and analytical presentation'::text, 
   'https://drive.google.com/drive/folders/1Ojx2hqEe_5Y5SYHFEdv-K8oMWSUFJ4bY'::text,
   '[{"url":"https://drive.google.com/file/d/1CuPzTXbO5X6aWzSbAePrCfKhTVPh-Kbv/view","name":"Vaishnavi G (Excel).png","size":95978,"type":"image/png"},{"url":"https://drive.google.com/file/d/1BjNrKX_NizOSJIRYNMS-nYKX5EScYXu3/view","name":"Vaishnavi G - EXCEL.xlsx","size":173100,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"},{"url":"https://drive.google.com/file/d/1-SYKJ1NmvROrF0XMOcolGzdmd-nM2rg7/view","name":"Vaishnavi G (PowerBi).png","size":76020,"type":"image/png"}]'::text,
   '2026-09-29 21:30:00+00'::timestamptz),
   
  -- Batch 4: 6 students
  ('hariprasadnayak77280@gmail.com'::text, 
   'Data Cleaning, Formula and pivot table, Business dashboards, decision-making and analytical presentation'::text, 
   'https://drive.google.com/drive/folders/1yMVir-Qu6JmmrjVtYBuvSc_Rf3bzlgq6'::text,
   '[{"url":"https://drive.google.com/file/d/1S-aHCfIdx65f8qxI98tiNS0Lp3cLRWUh/view","name":"hariprasad powerbi dashboard.PNG","size":113028,"type":"image/png"},{"url":"https://drive.google.com/file/d/1YiIk9fdVCy_4XdJgJ3tTYYEIQU91o8im/view","name":"2019 dataset with dashboard.xlsx","size":188526,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}]'::text,
   '2026-09-29 22:00:00+00'::timestamptz),
   
  ('hemanthsj2003@gmail.com'::text, 
   'Data Cleaning, Formula and pivot table, Business dashboards, decision-making and analytical presentation'::text, 
   'https://drive.google.com/drive/folders/1Lj9svEHe8FXzMQ_EhA_sOYHo9bJEehe_'::text,
   '[{"url":"https://drive.google.com/file/d/1NzyGII4J8YJ5KZvIr5cO1U8GDPsUxr-I/view","name":"Excel Finance dashboard.xlsx","size":78928,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"},{"url":"https://drive.google.com/file/d/1_AJpohogZRotqwioPctgTKcu3qycJesl/view","name":"POWER BI FINANCE DASH BOARD.pbix","size":82907,"type":"application/x-zip"},{"url":"https://drive.google.com/file/d/1_zH2JjOrGxARkZkatwpVqycjCC8zd4dz/view","name":"Screenshot 2026-09-23 154319.png","size":82387,"type":"image/png"},{"url":"https://drive.google.com/file/d/1Iz8QJvTdNPfzYKENm9ATI23UA2qF_Jwf/view","name":"Screenshot 2026-09-23 154223.png","size":163381,"type":"image/png"},{"url":"https://drive.google.com/file/d/1dzfHRHVg9duBt_nTZ6P4danjiL-2hg_q/view","name":"Sales dashboard.xlsx","size":172979,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}]'::text,
   '2026-09-29 22:30:00+00'::timestamptz),
   
  ('ambujakhgowda@gmail.com'::text, 
   'Data Cleaning, Formula and pivot table, Business dashboards, decision-making and analytical presentation'::text, 
   'https://drive.google.com/drive/folders/1wdTdPmcRISVlLaGAKXN2LXABLgFg5U-O'::text,
   '[{"url":"https://drive.google.com/file/d/1hoJ8h_-agYmS-MEOM-EvFLBxmx9TfFDk/view","name":"Screenshot 2026-09-23 160148.png","size":206526,"type":"image/png"},{"url":"https://drive.google.com/file/d/1CNQ-bNKK1AF7CC2_ukmzmkE3LmhdaexU/view","name":"Screenshot 2026-09-23 154811.png","size":81593,"type":"image/png"},{"url":"https://drive.google.com/file/d/1g1fdGtTrp16Pquzby_cuA7HLzjbdeEGq/view","name":"Screenshot 2026-09-23 154711.png","size":84792,"type":"image/png"}]'::text,
   '2026-09-29 23:00:00+00'::timestamptz),
   
  ('jeevithav01@gmail.com'::text, 
   'Data Cleaning, Formula and pivot table, Business dashboards, decision-making and analytical presentation'::text, 
   'https://drive.google.com/drive/folders/1dHxjEWSrIqahrY5N0b18yi77yLnkBER7'::text,
   '[{"url":"https://drive.google.com/file/d/1-_t6Dpc7F0nWKE6Y1mSrjslBv2Aey9EQ/view","name":"JEEVITHA V EXCEL DASHBOARD","size":42794,"type":"image/png"},{"url":"https://drive.google.com/file/d/1RNka-Ya55Sa1twnJ9IzYjMcgf1tGPc6y/view","name":"JEEVITHA V (BA) EXCEL DASHBOARD.xlsx","size":172492,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"},{"url":"https://drive.google.com/file/d/1LyPpVecrN1ATmhWMJyU8t-y40xgHfTLH/view","name":"JEEVITHA V POWER BI DASHBOARD","size":63162,"type":"image/png"}]'::text,
   '2026-09-29 23:30:00+00'::timestamptz),
   
  ('smmamatha910@gmail.com'::text, 
   'Data Cleaning, Formula and pivot table, Business dashboards, decision-making and analytical presentation'::text, 
   'https://drive.google.com/drive/folders/1H3YeqAdHLZ8kVK1DEud5CxmrHo1qHAdv'::text,
   '[{"url":"https://drive.google.com/file/d/1u8jp2UeUGhPUOXs1N6vegXUFuuJU_W3o/view","name":"Screenshot (2).png","size":475106,"type":"image/png"},{"url":"https://drive.google.com/file/d/1b57jAlp6TqO4gEsuUyrfGb-7ZTIUYv4n/view","name":"MAMATHA BUSINESS ANALYTICS.xlsx","size":183309,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}]'::text,
   '2026-09-30 00:00:00+00'::timestamptz),
   
  ('thanukrishna.am@gmail.com'::text, 
   'Data Cleaning, Formula and pivot table, Business dashboards, decision-making and analytical presentation'::text, 
   'https://drive.google.com/drive/folders/1SKtFp7aGlird2IWMJ2pyeToOmZGZUifc'::text,
   '[{"url":"https://drive.google.com/file/d/1phSRHp_tMCXfKqAvSdascMv03Qi2hhMi/view","name":"Thanuja A M_P03KU24M015051_Excel Power Query.xlsx","size":171695,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"},{"url":"https://drive.google.com/file/d/13o1VL7G-dL_3DO_znhAQ259GI7OiezxB/view","name":"Thanuja A M_HR DATA DASHBOARD.xlsx","size":88094,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"},{"url":"https://drive.google.com/file/d/1YC5N0kHYiqcKaoScE476vUCVIbhfvQfW/view","name":"Thanuja A M_Power BI Dashboard.png","size":95199,"type":"image/png"}]'::text,
   '2026-09-30 00:30:00+00'::timestamptz),
   
  -- Batch 5: Final 4 students (Power BI)
  ('roopeshgc2003@gmail.com'::text, 
   'Data Cleaning, Formula and pivot table, Business dashboards, decision-making and analytical presentation'::text, 
   'https://drive.google.com/drive/folders/10aVASWZthAaD8tUFi_duC5qk3D9knJET'::text,
   '[{"url":"https://drive.google.com/file/d/1kUGfq4FzD_6DuqrkmyT6P6xleYYOHBiN/view","name":"Screenshot 2026-09-23 154533.png","size":70350,"type":"image/png"},{"url":"https://drive.google.com/file/d/1F5oZHC6gCbk4BjFngEBBZE2hJiygWskj/view","name":"Screenshot 2026-09-23 154429.png","size":98693,"type":"image/png"},{"url":"https://drive.google.com/file/d/1dFwDbdjrWueSq0Dba0bpi8yD3d2IAS_i/view","name":"Screenshot 2026-09-23 154349.png","size":197379,"type":"image/png"},{"url":"https://drive.google.com/file/d/1RGQMliWdJXvlcR6KFrEhemZ6EnoLz1Wr/view","name":"Power BI Business Analytics.pbix","size":73203,"type":"application/x-zip"},{"url":"https://drive.google.com/file/d/1uCEUXoobHqEUfRLp1DuUKN3nsrqOA0RE/view","name":"Business analytics Dashboard.xlsx","size":98876,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"},{"url":"https://drive.google.com/file/d/1VEr0D73SG4rgkny2OXe5m4gqKeTsu25h/view","name":"Sales analytics Dashboard.xlsx","size":171696,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}]'::text,
   '2026-09-30 01:00:00+00'::timestamptz),
   
  ('ppavan50559@gmail.com'::text, 
   'Data Cleaning, Formula and pivot table, Business dashboards, decision-making and analytical presentation'::text, 
   'https://drive.google.com/drive/folders/1VCClpPTKde8w0eU4p9ZulNovOrlsozk6'::text,
   '[{"url":"https://drive.google.com/file/d/1nZXy5SN4N-WUFk3OCliMywjhwV1Okxtw/view","name":"IMG_20240829_124557.jpg","size":430898,"type":"image/jpeg"},{"url":"https://drive.google.com/file/d/12MHEJ3GXj0P4coBjQxAuxFegMf93L2u3/view","name":"IMG_20240829_124557.jpg","size":431106,"type":"image/jpeg"},{"url":"https://drive.google.com/file/d/1mz5HrzBmjE5-7qtMp-mHA_U4Xh3qsr2B/view","name":"PAVAN KUMAR P03KU24M015048.xlsx","size":95192,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"},{"url":"https://drive.google.com/file/d/1QMUlNZTvxjpAR9N009t2bzssZEQeCjKp/view","name":"PAVAN P03KU24M015048.xlsx","size":166458,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}]'::text,
   '2026-09-30 01:30:00+00'::timestamptz),
   
  ('cchaithran698@gmail.com'::text, 
   'Data Cleaning, Formula and pivot table, Business dashboards, decision-making and analytical presentation'::text, 
   'https://drive.google.com/drive/folders/1jYl9lfRrVaVxjORi55S1zQhKcN4zA_SR'::text,
   '[{"url":"https://drive.google.com/file/d/1jdhP2gf0d7avXTTQ5QDkcCOzPL1_s1Pt/view","name":"P03KU24M015049_CHAITHRA_SALES DATA 2019 .xlsx","size":168195,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"},{"url":"https://drive.google.com/file/d/1tC9osl48t079jBbtCTkF3PdpxB2JGG2s/view","name":"CHAITHRA_P03KU24M015049_MARKETING.xlsx","size":94501,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}]'::text,
   '2026-09-30 02:00:00+00'::timestamptz),
   
  ('chaithanyatr24@gmail.com'::text, 
   'Data Cleaning, Formula and pivot table, Business dashboards, decision-making and analytical presentation'::text, 
   'https://drive.google.com/drive/folders/1EN4qm1AKxawKrPCceiXQxXkz8nt5qT-q'::text,
   '[{"url":"https://drive.google.com/file/d/1LcqGkppv8QED34ewNd1e4AUFKYb4q-P4/view","name":"Chaithanya TR_P03KU24M015052_Excel Power Query.xlsx","size":174642,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"},{"url":"https://drive.google.com/file/d/1p9IT84Pd_Jb2EpxuUUMo6mYn0oLXiDDr/view","name":"Chaithanya TR_Power BI Dashboard.png","size":146673,"type":"image/png"}]'::text,
   '2026-09-30 02:30:00+00'::timestamptz),

  -- =========================================================================
  -- HR Stream Task: Human resourse placement Bootcamp (Educator: Poornima D U)
  -- Course: MBA-HR-L1-ONBOARDING | Due: 2026-09-25 | Submit: 2026-10-02
  -- 12 HR Students Total
  -- =========================================================================
  -- Batch 1: First 6 students
  ('jeevithadn47@gmail.com'::text,
   'Human resourse placement Bootcamp'::text,
   'https://drive.google.com/drive/folders/1CxJqb3mMgvFW5BIJR3G6b-6tKXxqJbA6'::text,
   '[{"url":"https://drive.google.com/file/d/1mWUi6aEUz4Y9xzmgF3_qS_uxDmdTOaeZ/view","name":"Jeevitha D N ATS Funnel Recruitment.xlsx","size":16630,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"},{"url":"https://drive.google.com/file/d/17R5iZB4WWneM_ZIfvdfoZiA5w_X4dAi3/view","name":"Jeevitha D N HR Metrics Student Practice1.xlsx","size":42288,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"},{"url":"https://drive.google.com/file/d/1pFcbTcfsW36m8bJ34IQFDGCT8Z6HnLT6/view","name":"Jeevitha DN RESUME.pdf","size":225512,"type":"application/pdf"}]'::text,
   '2026-10-02 14:00:00+00'::timestamptz),

  ('sumithasenthil0225@gmail.com'::text,
   'Human resourse placement Bootcamp'::text,
   'https://drive.google.com/drive/folders/1c_-QQLII3c8oeIgyj3w4QJ5oebKhA8xe'::text,
   '[{"url":"https://drive.google.com/file/d/1F_1u7WyJyz0VLAstyOrQ72jlWerjOm49/view","name":"MBA_HR_Metrics_Student_Practice- Sumitha.xlsx","size":42224,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"},{"url":"https://drive.google.com/file/d/1-kZblkgjAXLa3E_kad1azKHMCunZdy1d/view","name":"Sumitha_Senthil_Professional_Resume (1).docx","size":211016,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},{"url":"https://drive.google.com/file/d/1ofBkfLJZO4iKS6RkW5-0cPXGW5Oh7Tup/view","name":"Recruitment_Plan_Customer_Success_Executive - Sumitha.docx","size":40045,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},{"url":"https://drive.google.com/file/d/1gc0pkwKQK17zu1FF6BXsgVtHlQJRe9_p/view","name":"ATS_Funnel_Recruitment_Tracker_Sumitha.xlsx","size":16765,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}]'::text,
   '2026-10-02 14:30:00+00'::timestamptz),

  ('simrithasuresh31@gmail.com'::text,
   'Human resourse placement Bootcamp'::text,
   'https://drive.google.com/drive/folders/1Vxb3NxslJPYhUY-jG_HcJfQE2tpYh-_p'::text,
   '[{"url":"https://drive.google.com/file/d/1qck_5_QhONNZ9MgdNSkdsuXFTaT2Urc3/view","name":"Simritha S Recruitment_Case_Study_Answers.docx","size":45459,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},{"url":"https://drive.google.com/file/d/1_eeM25O9zcdv-6j5aXq_o5OSNJTfwO4D/view","name":"simritha S ATS_Funnel_Recruitment_Tracker_Students.xlsx","size":14034,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"},{"url":"https://drive.google.com/file/d/1XqykxuzjoAkp5Z2poeMs8mH0ly0cv9a3/view","name":"Sumitha_Senthil_Professional_Resume (1).docx","size":34037,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"}]'::text,
   '2026-10-02 15:00:00+00'::timestamptz),

  ('varshinivarshanb@gmail.com'::text,
   'Human resourse placement Bootcamp'::text,
   'https://drive.google.com/drive/folders/1BggsWNyXrhxGx3Kvl_r3ESISV1qy2lh2'::text,
   '[{"url":"https://drive.google.com/file/d/1KVg9nJkSyexxDHYkqC_7KwJdhfXRDR9Q/view","name":"Manager_Action_Lab_Answers VARSHINI NB.docx","size":17448,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},{"url":"https://drive.google.com/file/d/1bSSxQg7O1doUfjdzxdEzEcVwGWtfUVqX/view","name":"VARSHINI NB ACTIVITY 3.docx","size":21882,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},{"url":"https://drive.google.com/file/d/1nSoI0O1x-xh908oLMmZdGVLvoQA8JcZ1/view","name":"VARSHINI NB DETECTIVE DOC.docx","size":52012,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},{"url":"https://drive.google.com/file/d/1pxDyBrR2zgeGnf-wxs9SNQ3IrjJpgX2n/view","name":"varshini hr detective ","size":32585,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},{"url":"https://drive.google.com/file/d/1h068v_5wsOELFnO6P_6s8er5uTvv6Cby/view","name":" varshini recruitment case study","size":56469,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},{"url":"https://drive.google.com/file/d/19597ZI1S_r_OVx1lETmvgOrHtG181Xru/view","name":"VARSHINI RECRUITMENT CASE STUDY.docx","size":56190,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},{"url":"https://drive.google.com/file/d/1mWztl9qBvt7t_1ix0BwM6KRerMGa8ydz/view","name":"VARSHINI NB ACTIVITY 3.docx","size":21882,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},{"url":"https://drive.google.com/file/d/1vZuii07AFyNpGdnX-_zd3OfdXCZYDKtw/view","name":"VARSHINI NB DETECTIVE DOC.docx","size":52012,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},{"url":"https://drive.google.com/file/d/1HcW_9RmUbI7y7WuR8PLXaoP8nr1W7l4Q/view","name":"Manager_Action_Lab_Answers VARSHINI NB.docx","size":17448,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},{"url":"https://drive.google.com/file/d/1RIQD6wzCDDWtdzgISMdOa6RKCa62F_lZ/view","name":"VARSHINI RECRUITMENT CASE STUDY.docx","size":56190,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},{"url":"https://drive.google.com/file/d/1BG6ZVf4KDo4ULiWkTE3nHmuoi0CBkhVh/view","name":"ATS FREEE RESUME (1).docx","size":54079,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"}]'::text,
   '2026-10-02 15:30:00+00'::timestamptz),

  ('harshaabhi56@gmail.com'::text,
   'Human resourse placement Bootcamp'::text,
   'https://drive.google.com/drive/folders/1GA42O_2cN9SN1O7AKK4QE1eobtJOSfhB'::text,
   '[{"url":"https://drive.google.com/file/d/10C5SudZgz4xYspfR23QKFxfsHKGzietB/view","name":"Harsha_hr_Manager_Action_Lab_Case_Solution.docx","size":52044,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},{"url":"https://drive.google.com/file/d/1oZ1dx9IxliNQ21EogmsTAWfSH-tCSHSt/view","name":"Harsha_HR_POLICY INTERPRETATION CASE SOLUTION.docx","size":52411,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},{"url":"https://drive.google.com/file/d/12twLEPLvlJ_Ce-cBDESWPivh-Wp68Ysd/view","name":"harsha_RECRUITMENT CASE solution.docx","size":56209,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},{"url":"https://drive.google.com/file/d/1r9qx8czpqn-t1k7raAQDHTpDa8jPhu24/view","name":"Harsha_hr_Manager_Action_Lab_Case_Solution.docx","size":52044,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},{"url":"https://drive.google.com/file/d/1ob4e6jvZgHVP-ymyqwXTZNOY0mI-ZZ6B/view","name":"Harsha_HR_POLICY INTERPRETATION CASE SOLUTION.docx","size":52411,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"}]'::text,
   '2026-10-02 16:00:00+00'::timestamptz),

  ('shwethag395@gmail.com'::text,
   'Human resourse placement Bootcamp'::text,
   'https://drive.google.com/drive/folders/1AjkhTIBwZsGwVHlK9pGlT4xt2HqyINGp'::text,
   '[{"url":"https://drive.google.com/file/d/10LZg4T8EYifytg8wo9-i5M8nNiaCnjZA/view","name":"Shwetha HR_Detective.docx","size":27901,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},{"url":"https://drive.google.com/file/d/1CX4UFm9D_fkPL7jbOOH_Iv8OEuED1qbf/view","name":"Shwetha Activity 2.docx","size":16725,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},{"url":"https://drive.google.com/file/d/1nNs7Tejh84rqd2WwxfIli0xUVLWQkB_g/view","name":"Shwetha Activity 3.docx","size":19008,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},{"url":"https://drive.google.com/file/d/1bfG4gEXFspGhNbGOVEokLDAzYDuiX0-x/view","name":"Shwetha Activity 2.docx","size":16725,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},{"url":"https://drive.google.com/file/d/1s7HTQ20Ov7VopHrnKQB9aL3Pg2ZqUMod/view","name":"Shwetha HR_Detective.docx","size":27901,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},{"url":"https://drive.google.com/file/d/1lB7i4kpAkOsgPTjYPj1CSDLBBgsupfc8/view","name":"Shwetha RCH.docx","size":32585,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"}]'::text,
   '2026-10-02 16:30:00+00'::timestamptz),

  -- Batch 2: Next 6 students (Total 12 students for HR Placement Bootcamp)
  ('mgagana69@gmail.com'::text,
   'Human resourse placement Bootcamp'::text,
   'https://drive.google.com/drive/folders/1axL4s99YVAog6p8ZoKczuJf-4WL7-PpD'::text,
   '[{"url":"https://drive.google.com/file/d/1bEVpJNMbpdq3Y766secIFfJ9gd-hLvLS/view","name":"Activity 1- Policy Interpretion.docx","size":14516,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},{"url":"https://drive.google.com/file/d/1FxreemYokHBcqhnGvvkOI_BMJlg0olIi/view","name":"Activity 2- Manager Action Lab.docx","size":16053,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},{"url":"https://drive.google.com/file/d/1P3G2Omv_qULXYoF3vwrMWSXMr8RJqiuT/view","name":"Gagana.M Recruitment_Case_Assignment_Solution.docx","size":36261,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"}]'::text,
   '2026-10-02 17:00:00+00'::timestamptz),

  ('chaithanyatr24@gmail.com'::text,
   'Human resourse placement Bootcamp'::text,
   'https://drive.google.com/drive/folders/1zfQczsDhnA9R9c52zKuGcc8C-ShZo0LZ'::text,
   '[{"url":"https://drive.google.com/file/d/1Tn9NJKmbbe6d0TefglKEKcX5VpoKWZ2X/view","name":"Chaithanya T R_HR_Metrics_Student_Practice1.xlsx","size":20884,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"},{"url":"https://drive.google.com/file/d/115fTDixug0GVQUogCNLqvDfsUbRow_3t/view","name":"Chaithanya TR_Activity 2_ Manager Action Lab.docx","size":17266,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},{"url":"https://drive.google.com/file/d/1ZtaTniKHeLBBeu_8jgX5ofiXUA8WQ2mf/view","name":"Chaithanya TR_Activity 1_Policy Interpretion.docx","size":15306,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},{"url":"https://drive.google.com/file/d/1uCd0xbeaDD1lB4MFwtqTNLHleq6E1meL/view","name":"Chaithanya TR_ATS_Funnel_Recruitment_Tracker.xlsx","size":16721,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"},{"url":"https://drive.google.com/file/d/1A-ppd-R69tHTecHQMsr5ph3dKfNbemyg/view","name":"Chaithanya TR_ Recruitment_ Assignment_Customer_Success_Executive.docx","size":42793,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},{"url":"https://drive.google.com/file/d/16-1XfmpxeTmJ6zEKuZb9HoFxDdqaRLej/view","name":"Resume.pdf","size":139750,"type":"application/pdf"}]'::text,
   '2026-10-02 17:30:00+00'::timestamptz),

  ('varshajaishankar06@gmail.com'::text,
   'Human resourse placement Bootcamp'::text,
   'https://drive.google.com/drive/folders/19E380TG0YTDpsUROZ0dcp7bA34j_YgZv'::text,
   '[{"url":"https://drive.google.com/file/d/1N594kwWivp8_0NSRYbco8JGo5EDvyL0q/view","name":"Varsha. J MBA_HR_Metrics_Student_Practice1.xlsx","size":20497,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"},{"url":"https://drive.google.com/file/d/1E6tMPVHOvKGjTjiCqJEKdTSV6auN4RNO/view","name":"Varsha J Resume.pdf","size":73766,"type":"application/pdf"},{"url":"https://drive.google.com/file/d/1_K3Scw56dtOIVpUMJo3hcHa5COUF2D9_/view","name":"Varsha . J Activity 4- AI.docx","size":17804,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},{"url":"https://drive.google.com/file/d/1WxU7d5cV6T5Ca5IUTgFHVp7fEQZBSDT-/view","name":"Varsha . J Manager Action Lab.docx","size":17266,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},{"url":"https://drive.google.com/file/d/1hWHbeMHj2gNDQIKpVqjsKohnN44w23Cs/view","name":"Varsha. J _Policy Interpretion.docx","size":15306,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},{"url":"https://drive.google.com/file/d/165bfLgyUjkEALKZqCInmd0GzH6YfKANu/view","name":"Varsha Recruitment_Case_Study_Answers.docx","size":39177,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},{"url":"https://drive.google.com/file/d/1B_wYdSh04n_QBd0cimFfWLtc_XKIMHNz/view","name":"Varsha ATS_Funnel_Recruitment_Tracker_Students.xlsx","size":14034,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}]'::text,
   '2026-10-02 18:00:00+00'::timestamptz),

  ('sanjanakumarmesthakumarmestha@gmail.com'::text,
   'Human resourse placement Bootcamp'::text,
   'https://drive.google.com/drive/folders/1rELSxjMAB8yXik3B17sVE2KGkD_RuoSx'::text,
   '[{"url":"https://drive.google.com/file/d/1tmzyRIqmUlmY5AA8rXztYKSI2gJVoMBf/view","name":"sanjana kumar mestha MBA_HR_Metrics_Student_Practice1.xlsx","size":20497,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"},{"url":"https://drive.google.com/file/d/1CaJ1BZNKlj3FIs2foa0N1djQwKYyodob/view","name":"sanjana kumar mestha Recruitment_Case_Study_Answers.docx","size":46415,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},{"url":"https://drive.google.com/file/d/1R5UQxQqnj0cxFVkGQFxsAt66DgKCZQrD/view","name":"sanjana kumar mestha ATS_Funnel_Recruitment_Tracker_Students.xlsx","size":14034,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"},{"url":"https://drive.google.com/file/d/1TP_wL8oiJap07P-GnNXkt6UbtKkHiy2V/view","name":"sanjana kumar mestha Activity 4- AI.docx","size":17804,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},{"url":"https://drive.google.com/file/d/1tfwG0lz8zKfOYmsXzFf-n89AkI_NYvfJ/view","name":"sanjana kumar mestha activity 2 _ Manager Action Lab.docx","size":17266,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},{"url":"https://drive.google.com/file/d/1vR83XK-YO9g__X7c-KVNrEWmV3uI-k5E/view","name":"sanjana kumar mestha activity 1_Policy Interpretion.docx","size":15306,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},{"url":"https://drive.google.com/file/d/10cmvhNR94CECgJRuAbaBE1PDTE9y4O1j/view","name":"Business Analyst resume.pdf","size":128285,"type":"application/pdf"}]'::text,
   '2026-10-02 18:30:00+00'::timestamptz),

  ('tejuteja082@gmail.com'::text,
   'Human resourse placement Bootcamp'::text,
   'https://drive.google.com/drive/folders/1p05vPky2JxldAvUjUfw_jKFYutcs3kxa'::text,
   '[{"url":"https://drive.google.com/file/d/1uvJwuMbQx61Qt66eGj3eZxr-7spOUA5H/view","name":"Teja babu K P_MBA_HR_Metrics_Student_Practice1.xlsx","size":20497,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"},{"url":"https://drive.google.com/file/d/1ofGSzq-g4atv4sqHxyFlX9mQUWBoRgf9/view","name":"Teja Babu K P_Activity 4- AI.docx","size":14548,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},{"url":"https://drive.google.com/file/d/18uphsZEVAmjf_rpPuyq5sJNBE97ZCrct/view","name":"Teja Babu k P_Activity 2- Manager Action Lab.docx","size":17668,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},{"url":"https://drive.google.com/file/d/1hRZNBOHCyL1F07CGwtBafsz_iygazUM6/view","name":"Teja babu K P _Activity 1- Policy Interpretion.docx","size":14338,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},{"url":"https://drive.google.com/file/d/17mpsnrsfRQX0i3NaE4i0KdP2aZCof8Bg/view","name":"Teja Babu_Recruitment_Case_Assignment_.docx","size":54589,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},{"url":"https://drive.google.com/file/d/1GqKYc6RyqPkaHEhz80c1RRx7anDomEB0/view","name":"TEJA BABU K P _ ATS_Funnel_Recruitment_Tracker_Students.xlsx","size":15702,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"},{"url":"https://drive.google.com/file/d/1X2EZQvgxaWLO1NuuJP9E9_P7wX-heKxN/view","name":"TEJA BABU K P.pdf","size":132038,"type":"application/pdf"}]'::text,
   '2026-10-02 19:00:00+00'::timestamptz),

  ('thanukrishna.am@gmail.com'::text,
   'Human resourse placement Bootcamp'::text,
   'https://drive.google.com/drive/folders/1c4MQBeaqM9LAdDvYIrVYHDJS1aSCyfZK'::text,
   '[{"url":"https://drive.google.com/file/d/1FhW24rwLMrQjMTsBco-KJoXCRxbWraEy/view","name":"Thanuja A M_MBA_HR_Metrics_Student_Practice1.xlsx","size":40720,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"},{"url":"https://drive.google.com/file/d/1AJoT3it2rzNZrbmvGbKXEw_oGKxUsm-1/view","name":"Thanuja_AM_Resume.pdf","size":216729,"type":"application/pdf"},{"url":"https://drive.google.com/file/d/15nb7dJW5V3Hz7ocJ85RNGwKWMuES2q6o/view","name":"Thanuja A M_Activity 4- AI.docx","size":16513,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},{"url":"https://drive.google.com/file/d/1spiZ5vHW_cdGt2lFUUQz5LU4yt79b85B/view","name":"Thanuja A M_Activity 2- Manager Action Lab.docx","size":17668,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},{"url":"https://drive.google.com/file/d/1WYHKAJDddKpeytm2cxhpBZF9BY4B88Si/view","name":"Thanuja A M_Activity 1- Policy Interpretion.docx","size":16172,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},{"url":"https://drive.google.com/file/d/1-l3IeDRqy1fZJdBKG4bunFloUqKw2xnL/view","name":"Thanuja A M_Recruitment_Assignment.docx","size":41479,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},{"url":"https://drive.google.com/file/d/1iDNW6NDw4rGp1F0-elx6Vp5KM5aCdOq_/view","name":"Thanuja A M_ATS_Funnel_Recruitment_Tracker.xlsx","size":16751,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}]'::text,
   '2026-10-02 19:30:00+00'::timestamptz),

  -- =========================================================================
  -- Task: Company Formation & Performance (Educator: Subashini Ramaswamy)
  -- Course: VoltEdge_V18 | Due: 2026-09-10 | Submit: 2026-09-17
  -- 109 Submissions Total across Streams & Groups
  -- =========================================================================
  -- Batch 1: Varsha and Group (6 students across streams)
  ('varshajaishankar06@gmail.com'::text,
   'Company Formation & Performance'::text,
   'https://drive.google.com/drive/folders/1bs6PhHeKzm806DKypwRQru9Wi7wmMxUH'::text,
   '[{"url":"https://drive.google.com/file/d/1lxbowXXXDroqEn7rRtzXj740dPton-LB/view","name":"Final Homebite ppt.pptx","size":2351532,"type":"application/vnd.openxmlformats-officedocument.presentationml.presentation"},{"url":"https://drive.google.com/file/d/1H0VQuEN0w_RShxjM-MD9UikzFengUzoR/view","name":"Varsha and Group 2.xlsx","size":17113,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"},{"url":"https://drive.google.com/file/d/1o7_0Rh7bt2Pm7BBe3ppEZ2_iWUExJ9Tg/view","name":"Varsha and Group.xlsx","size":58867,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}]'::text,
   '2026-09-17 14:00:00+00'::timestamptz),

  ('sunanda.anusha@gmail.com'::text,
   'Company Formation & Performance'::text,
   'https://drive.google.com/drive/folders/1bs6PhHeKzm806DKypwRQru9Wi7wmMxUH'::text,
   '[{"url":"https://drive.google.com/file/d/1EBP2tKjQITPTwNBgiVVsxjxV9AdRjc6d/view","name":"BA DOCUMENT Final.docx","size":280947,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},{"url":"https://drive.google.com/file/d/1lxbowXXXDroqEn7rRtzXj740dPton-LB/view","name":"Final Homebite ppt.pptx","size":2351532,"type":"application/vnd.openxmlformats-officedocument.presentationml.presentation"},{"url":"https://drive.google.com/file/d/1H0VQuEN0w_RShxjM-MD9UikzFengUzoR/view","name":"Varsha and Group 2.xlsx","size":17113,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"},{"url":"https://drive.google.com/file/d/1o7_0Rh7bt2Pm7BBe3ppEZ2_iWUExJ9Tg/view","name":"Varsha and Group.xlsx","size":58867,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}]'::text,
   '2026-09-17 14:30:00+00'::timestamptz),

  ('sumithasenthil0225@gmail.com'::text,
   'Company Formation & Performance'::text,
   'https://drive.google.com/drive/folders/1bs6PhHeKzm806DKypwRQru9Wi7wmMxUH'::text,
   '[{"url":"https://drive.google.com/file/d/1uVsj6MfmRPrjOImMFijD7CrwX21GazMf/view","name":"generated_docs_HomeBite_HR_01_Manpower_Plan rewoked.pdf","size":33905,"type":"application/pdf"},{"url":"https://drive.google.com/file/d/1bXKtM4ff9m22Ry1h73AzOpzivElEyelW/view","name":"generated_docs_HomeBite_HR_02_Org_Structure reworked.pdf","size":27382,"type":"application/pdf"},{"url":"https://drive.google.com/file/d/13FTZGSi-rmpHBixJCl1GI-q37Cg-hFdb/view","name":"generated_docs_HomeBite_HR_03_Recruitment_Plan reworked.pdf","size":28299,"type":"application/pdf"},{"url":"https://drive.google.com/file/d/1OZUiLn7TP7otoIXm49XyZzafp8DL0Dhy/view","name":"generated_docs_HomeBite_HR_04_Attendance_Leave_Policy reworked.pdf","size":24939,"type":"application/pdf"},{"url":"https://drive.google.com/file/d/1pDtQoF5E-XcagRG360I6Cvqbyyg-c3bz/view","name":"generated_docs_HomeBite_HR_05_Code_of_Conduct Reworked.pdf","size":22807,"type":"application/pdf"},{"url":"https://drive.google.com/file/d/1RaCKqbyF9EYHEGZeCKb-HjK8hbV_G5ue/view","name":"generated_docs_HomeBite_HR_06_Performance_Review_Policy Reworked.pdf","size":24195,"type":"application/pdf"},{"url":"https://drive.google.com/file/d/12dOX97K05HHDS7WIxvgjUVtpVlr_45tv/view","name":"generated_docs_HomeBite_HR_07_KPI_Dashboard_Deliverables Reworked.pdf","size":27632,"type":"application/pdf"},{"url":"https://drive.google.com/file/d/1lxbowXXXDroqEn7rRtzXj740dPton-LB/view","name":"Final Homebite ppt.pptx","size":2351532,"type":"application/vnd.openxmlformats-officedocument.presentationml.presentation"},{"url":"https://drive.google.com/file/d/1H0VQuEN0w_RShxjM-MD9UikzFengUzoR/view","name":"Varsha and Group 2.xlsx","size":17113,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"},{"url":"https://drive.google.com/file/d/1o7_0Rh7bt2Pm7BBe3ppEZ2_iWUExJ9Tg/view","name":"Varsha and Group.xlsx","size":58867,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}]'::text,
   '2026-09-17 15:00:00+00'::timestamptz),

  ('rajeshin2003@gmail.com'::text,
   'Company Formation & Performance'::text,
   'https://drive.google.com/drive/folders/1bs6PhHeKzm806DKypwRQru9Wi7wmMxUH'::text,
   '[{"url":"https://drive.google.com/file/d/1WpJWxTWzMPSVc49QEYvE1q0DzTlmYTNr/view","name":"Home_Bite_Marketing_Reworked_7_KPIs.docx","size":38012,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},{"url":"https://drive.google.com/file/d/1GT6595oQdT9jtNMtPHC2ASLsbFFTRpU3/view","name":"Home_Bite_Marketing_Reworked_6_Sales_Process.docx","size":38027,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},{"url":"https://drive.google.com/file/d/1nb-eLtLYtuXpaHD03Pm_a2bWTxiiSyrv/view","name":"Home_Bite_Marketing_Reworked_5_Lead_Generation.docx","size":37939,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},{"url":"https://drive.google.com/file/d/11qovrjtZeNIwzm34iBJ3JI8UV0tdnEwk/view","name":"Home_Bite_Marketing_Reworked_4_Pricing.docx","size":37791,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},{"url":"https://drive.google.com/file/d/1Kp_OjDybJrUJQkwMfTv3IChp5lNdk-SQ/view","name":"Home_Bite_Marketing_Reworked_3_Positioning.docx","size":37696,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},{"url":"https://drive.google.com/file/d/10lD11RFG7aFJwUNaA6wiXUsjeY-HVY5p/view","name":"Home_Bite_Marketing_Reworked_2_Customer_Persona.docx","size":37868,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},{"url":"https://drive.google.com/file/d/1FrHu5v7h3kW2s1fqRj7Hf7J_tMjupc0O/view","name":"Home_Bite_Marketing_Reworked_1_Target_Customer (1).docx","size":38018,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},{"url":"https://drive.google.com/file/d/1lxbowXXXDroqEn7rRtzXj740dPton-LB/view","name":"Final Homebite ppt.pptx","size":2351532,"type":"application/vnd.openxmlformats-officedocument.presentationml.presentation"},{"url":"https://drive.google.com/file/d/1H0VQuEN0w_RShxjM-MD9UikzFengUzoR/view","name":"Varsha and Group 2.xlsx","size":17113,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"},{"url":"https://drive.google.com/file/d/1o7_0Rh7bt2Pm7BBe3ppEZ2_iWUExJ9Tg/view","name":"Varsha and Group.xlsx","size":58867,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}]'::text,
   '2026-09-17 15:30:00+00'::timestamptz),

  ('yamunamanjunath123@gmail.com'::text,
   'Company Formation & Performance'::text,
   'https://drive.google.com/drive/folders/1bs6PhHeKzm806DKypwRQru9Wi7wmMxUH'::text,
   '[{"url":"https://drive.google.com/file/d/1ZfAEF_K3RJqYxRkHegfVPG5jCqmBUPwl/view","name":"7_finance_document_REWORKED.docx","size":18545,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},{"url":"https://drive.google.com/file/d/1nasrBImSPOIp6HOUOBPZS7sOayAuWoc3/view","name":"6_finance_document_REWORKED.docx","size":16116,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},{"url":"https://drive.google.com/file/d/1L_5dOO8lzn1awMIS7i5AmFMXRwxDOEVk/view","name":"5_finance_document_REWORKED.docx","size":15940,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},{"url":"https://drive.google.com/file/d/1kjYqIX3IHmspVlkGo8Y2XrZ7OYmZPgmP/view","name":"4_finance_document_REWORKED.docx","size":18135,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},{"url":"https://drive.google.com/file/d/1PAnikNpFiFO5BpPCMX0bZRWKkjDQjVSU/view","name":"3_finance_document_REWORKED.docx","size":17306,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},{"url":"https://drive.google.com/file/d/1h19GNlv-6SWcXp-6CbaFTulbDctmoRHn/view","name":"2_finance_document_2_REWORKED.docx","size":17367,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},{"url":"https://drive.google.com/file/d/1g13pzqIVSFRpnDRBUNxMnowlxn56szkD/view","name":"1_finance_document_1_REWORKED.docx","size":17573,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},{"url":"https://drive.google.com/file/d/1lxbowXXXDroqEn7rRtzXj740dPton-LB/view","name":"Final Homebite ppt.pptx","size":2351532,"type":"application/vnd.openxmlformats-officedocument.presentationml.presentation"},{"url":"https://drive.google.com/file/d/1H0VQuEN0w_RShxjM-MD9UikzFengUzoR/view","name":"Varsha and Group 2.xlsx","size":17113,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"},{"url":"https://drive.google.com/file/d/1o7_0Rh7bt2Pm7BBe3ppEZ2_iWUExJ9Tg/view","name":"Varsha and Group.xlsx","size":58867,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}]'::text,
   '2026-09-17 16:00:00+00'::timestamptz),

  ('smmamatha910@gmail.com'::text,
   'Company Formation & Performance'::text,
   'https://drive.google.com/drive/folders/1bs6PhHeKzm806DKypwRQru9Wi7wmMxUH'::text,
   '[{"url":"https://drive.google.com/file/d/1EBP2tKjQITPTwNBgiVVsxjxV9AdRjc6d/view","name":"BA DOCUMENT Final.docx","size":280947,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},{"url":"https://drive.google.com/file/d/1lxbowXXXDroqEn7rRtzXj740dPton-LB/view","name":"Final Homebite ppt.pptx","size":2351532,"type":"application/vnd.openxmlformats-officedocument.presentationml.presentation"},{"url":"https://drive.google.com/file/d/1H0VQuEN0w_RShxjM-MD9UikzFengUzoR/view","name":"Varsha and Group 2.xlsx","size":17113,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"},{"url":"https://drive.google.com/file/d/1o7_0Rh7bt2Pm7BBe3ppEZ2_iWUExJ9Tg/view","name":"Varsha and Group.xlsx","size":58867,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}]'::text,
   '2026-09-17 16:30:00+00'::timestamptz),

  -- Batch 2: Next 6 students (Heritage Weaves, NutriHarvest, E-Battery Technologies)
  ('jhenkaragowda212@gmail.com'::text,
   'Company Formation & Performance'::text,
   'https://drive.google.com/drive/folders/1h6HJE7lSne9E0JfU9XBueDglq6QFbUrC'::text,
   '[{"url":"https://drive.google.com/file/d/1vE3dXNy_yWjJBvatPp5kEYVHCWGCJfIt/view","name":"Finance Data (1).xlsx","size":11689,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"},{"url":"https://drive.google.com/file/d/18MZBbzNike_AobA2zDDcw_9cIPDiGcYu/view","name":"Major_Company_Expenses.docx","size":37183,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},{"url":"https://drive.google.com/file/d/19e-PZ7S26XTZPB5k8ntMDwVfV3saX8Bl/view","name":"Approval_Limits_and_Procedure.docx","size":3932870,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},{"url":"https://drive.google.com/file/d/10hDQm_aazPUyfoOUtPxdae_Xkd668WyJ/view","name":"Cash_Control_Process_Textilef (1).docx","size":4474686,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},{"url":"https://drive.google.com/file/d/11OQDf7vObv7DnAHIv3OsmksTsTcgJcSn/view","name":"First_Three_Finance_KPIs_.docx","size":3931164,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},{"url":"https://drive.google.com/file/d/1On4ETM8idsmFw5pfH55_4dv0BNoRTvEv/view","name":"price and revenue assumptions (3).xlsx","size":11737,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"},{"url":"https://drive.google.com/file/d/1mLbNzos9S29P0SqVy-KL5wz4KV4GNqlg/view","name":"HR QUESTION.docx","size":70460,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},{"url":"https://drive.google.com/file/d/12b2JRiZI0UfyiqgwxKV-k2tydi9of4rO/view","name":"FIRST THREE HR KPIs.docx","size":83625,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},{"url":"https://drive.google.com/file/d/1f283G5fnvvWWf468Czyhu4AuFvMWTVu0/view","name":"PERFORMANCE REVIEW METHOD.docx","size":79542,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},{"url":"https://drive.google.com/file/d/1aPAJxS6xUprULGo6zs8kDi1DLpUfsVYP/view","name":"CODE OF CONDUCT.docx","size":79518,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},{"url":"https://drive.google.com/file/d/1AzfOe3kFICB7SUPDeIaGOc2Yk0lfNQns/view","name":"organisation structure HR.docx","size":1748517,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},{"url":"https://drive.google.com/file/d/12Hp3nu6_dA09l6aoRFq2J34dld4rT394/view","name":"ATTENDANCE AND LEAVE POLICY.docx","size":67608,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},{"url":"https://drive.google.com/file/d/19xPVxt1tytEydhQd0NyebCs_N_Mr-mhB/view","name":"first five role & JD.docx","size":138326,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},{"url":"https://drive.google.com/file/d/1X_EyCmMms1GV6rA6DN3rGNq6gncAfMJB/view","name":"Data Required (BA).docx","size":14881,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},{"url":"https://drive.google.com/file/d/1fF_NFzN_T5GMAFkmmxqP5IQR0wibaRs4/view","name":"Service Delivery Process (BA).docx","size":14203,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},{"url":"https://drive.google.com/file/d/14qVuFoyGr6iLsqv52m5_uoHvJDIXOTkL/view","name":"Quality control process (BA).docx","size":14699,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},{"url":"https://drive.google.com/file/d/1KsQfRycpmS3FRiRmPPH97eG8MLIkTCWN/view","name":"Escalation Process(BA).docx","size":15804,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},{"url":"https://drive.google.com/file/d/1CXYquIkRmPXG4NLOoafzXYZLATPi9M_u/view","name":"First Three Operations KPIs(BA).docx","size":14200,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},{"url":"https://drive.google.com/file/d/1-rZnZ3QikEH1932HWxxSeKr0xrNVTTja/view","name":"Customer onboarding process(BA).docx","size":27944,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},{"url":"https://drive.google.com/file/d/1RkyB98_2NCi2pXp7zO9UXneE-vxjzQVm/view","name":"HERITAGE WEAVES 8 PAGE marketing.docx","size":139847,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},{"url":"https://drive.google.com/file/d/1nFBpHUZdeMYi5A7TaeN7m2A65-_yfQdl/view","name":"HERITAGE WEAVES 7 PAGE marketing.docx","size":158870,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},{"url":"https://drive.google.com/file/d/120AAE6iDxPKOaoEikR0uwD8j2RA8YIvD/view","name":"HERITAGE WEAVES 6 PAGE marketing.docx","size":133687,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},{"url":"https://drive.google.com/file/d/12Q-C3QkGTBd5eneAMBePI9OLXh_cUSnB/view","name":"HERITAGE WEAVES 5 PAGE marketing.docx","size":249752,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},{"url":"https://drive.google.com/file/d/1EQ-DK0N24rhcbzDEIVoZMIjnLuBeTZbH/view","name":"HERITAGE WEAVES 4 PAGE marketing.docx","size":158348,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},{"url":"https://drive.google.com/file/d/1p_M13wZQBhkqLIqHu_3CCOvF8FOGFuvQ/view","name":"HERITAGE WEAVES 3 PAGE marketing.docx","size":163493,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},{"url":"https://drive.google.com/file/d/1-V2sMHB7KL_jHvSdZcfYQMOqq9jHVBYC/view","name":"HERITAGE WEAVES 2 PAGE marketing.docx","size":201676,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},{"url":"https://drive.google.com/file/d/1-ajFaFzKHQ8w1eyme0N3OyXc75vr_RCJ/view","name":"HERITAGE WEAVES 1 PAGE marketing.docx","size":229184,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"}]'::text,
   '2026-09-17 17:00:00+00'::timestamptz),

  ('varshithahs626@gmail.com'::text,
   'Company Formation & Performance'::text,
   'https://drive.google.com/drive/folders/1z-H4rWnlika3ts_f2HPNn2i_987Q8Fv9'::text,
   '[{"url":"https://drive.google.com/file/d/18VY8GxKcj14jQb0uuURo5ilaaSsBZ0AH/view","name":"Heritage_Weaves_HR_Plan_Reworked.docx","size":248587,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},{"url":"https://drive.google.com/file/d/1XuYaE8xzwxT7uNF8JNJQeqZQwKI2dpBu/view","name":"Heritage_Weaves_Marketing_Reworked.docx","size":16390,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},{"url":"https://drive.google.com/file/d/1lAEE1RZ9FlRnTxv67ZVh8o1iInjRYeCA/view","name":"Heritage_Weaves_Finance_Plan_Reworked.docx","size":27699,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},{"url":"https://drive.google.com/file/d/1IMMezxtLRZ5sdvGGgLrV0rtUFtaghugA/view","name":"Heritage_Weaves_6-Month_Finance_Plan_ Reworked.xlsx","size":35420,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"},{"url":"https://drive.google.com/file/d/1KqAIe7YZCP_YFnWhix0PmTCEuQtRH5Oq/view","name":"Heritage_Weaves_Dashboards Reworked.xlsx","size":41757,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"},{"url":"https://drive.google.com/file/d/1VCMYUWxloLjmGHIl-Sd0RnbUnOE_rRD2/view","name":"Heritage_Weaves_Operations_and_Analytics Reworked.docx","size":243291,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"}]'::text,
   '2026-09-17 17:30:00+00'::timestamptz),

  ('sahanaanandaiah@gmail.com'::text,
   'Company Formation & Performance'::text,
   'https://drive.google.com/drive/folders/1m_jct3fvuJ_xzcvsdGQQI9LHaDqJ6mHJ'::text,
   '[{"url":"https://drive.google.com/file/d/1o0yBcO6bnwWVovipVEaS6osUPfUbhXUM/view","name":"NutriHarvest_HR_Revised.docx","size":47888,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},{"url":"https://drive.google.com/file/d/1Dck6x3RIFSUfv9w8hYvgFkS_3lMbe9cs/view","name":"NutriHarvest_BA_IT_Revised.docx","size":42455,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},{"url":"https://drive.google.com/file/d/1u36IF3487NZgsXlB-ba7DsXERS2UwyOf/view","name":"NutriHarvest_Operations_Production_Revised.docx","size":43452,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},{"url":"https://drive.google.com/file/d/1V-1lXCEErJxs5S-p9O_uu6dk0VCGHJqo/view","name":"NutriHarvest_Distribution_Logistics_Revised.docx","size":43375,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},{"url":"https://drive.google.com/file/d/16BzIwBde427ijyWb-U3EyapSN9-YLS5t/view","name":"FINAL FINANCE PLAN 2027.pdf","size":208291,"type":"application/pdf"},{"url":"https://drive.google.com/file/d/1tRZJbNv7OGP7sYs7dFdN6ifbeXMnN2BZ/view","name":"nutriharvest-dashboard.html","size":34597,"type":"text/html"},{"url":"https://drive.google.com/file/d/1PB1PI0ZDS9u_sENqm7ioAtHlPYZRKOvt/view","name":"NutriHarvest_Marketing.docx","size":43962,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},{"url":"https://drive.google.com/file/d/1ik5n6axqAKSuiJ0LbmsnGfjzxzE-YuKn/view","name":"NutriHarvest_Strategy_Presentation.pptx","size":55728,"type":"application/vnd.openxmlformats-officedocument.presentationml.presentation"},{"url":"https://drive.google.com/file/d/1-IuCWfWVr1YMZ4FJ1klIJbKaYol4o1FK/view","name":"margin_dashboard_v2_products.html","size":6787,"type":"text/html"},{"url":"https://drive.google.com/file/d/1uyJut7E2Z-LUV3zJNjbgnu60lTMyrnfa/view","name":"Gross_Margin_Plan .docx","size":15234,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},{"url":"https://drive.google.com/file/d/1Vv-yD3gPMBXOVb_m-fvc-lETn0sP-DVX/view","name":"Contingency_Risk_Reserve_5Cr.docx","size":38107,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"}]'::text,
   '2026-09-17 18:00:00+00'::timestamptz),

  ('hemantahemanth79@gmail.com'::text,
   'Company Formation & Performance'::text,
   'https://drive.google.com/drive/folders/1BcNsbVwx3LXTXpIdg8oPI05lRw3nsAW2'::text,
   '[{"url":"https://drive.google.com/file/d/13zzc5N4N7RzzKZZrIB-06n-jX_NSSlUw/view","name":"E-Battery_Technologies_PPT.pptx","size":294987,"type":"application/vnd.openxmlformats-officedocument.presentationml.presentation"},{"url":"https://drive.google.com/file/d/1uZB7q88z7OZiSOf39lXrg_TzIqNIlSe1/view","name":"E-Battery company foundation.xlsx","size":11173,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"},{"url":"https://drive.google.com/file/d/1zcDv-AVUw7UhmOvm9SAWeiMY8-sUXf4x/view","name":"Company Foundation voltedge HEMANTH LG.xlsx","size":17621,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"},{"url":"https://drive.google.com/file/d/1794LftnENaOZB6JtVMlpQ6t27GRRvs-7/view","name":"Company Foundation hemanth L G.xlsx","size":102810,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}]'::text,
   '2026-09-17 18:30:00+00'::timestamptz),

  ('gowdachethu83@gmail.com'::text,
   'Company Formation & Performance'::text,
   'https://drive.google.com/drive/folders/1BcNsbVwx3LXTXpIdg8oPI05lRw3nsAW2'::text,
   '[{"url":"https://drive.google.com/file/d/13zzc5N4N7RzzKZZrIB-06n-jX_NSSlUw/view","name":"E-Battery_Technologies_PPT.pptx","size":294987,"type":"application/vnd.openxmlformats-officedocument.presentationml.presentation"},{"url":"https://drive.google.com/file/d/1uZB7q88z7OZiSOf39lXrg_TzIqNIlSe1/view","name":"E-Battery company foundation.xlsx","size":11173,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"},{"url":"https://drive.google.com/file/d/1ArL1mTUNH7Lk8L0StNtawPwiVG0cSyK8/view","name":"E-battery technology_Financial_Report.docx","size":28868,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},{"url":"https://drive.google.com/file/d/1zcDv-AVUw7UhmOvm9SAWeiMY8-sUXf4x/view","name":"Company Foundation voltedge HEMANTH LG.xlsx","size":17621,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"},{"url":"https://drive.google.com/file/d/1794LftnENaOZB6JtVMlpQ6t27GRRvs-7/view","name":"Company Foundation hemanth L G.xlsx","size":102810,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}]'::text,
   '2026-09-17 19:00:00+00'::timestamptz),

  ('vaishnavigopinath03@gmail.com'::text,
   'Company Formation & Performance'::text,
   'https://drive.google.com/drive/folders/1BcNsbVwx3LXTXpIdg8oPI05lRw3nsAW2'::text,
   '[{"url":"https://drive.google.com/file/d/13zzc5N4N7RzzKZZrIB-06n-jX_NSSlUw/view","name":"E-Battery_Technologies_PPT.pptx","size":294987,"type":"application/vnd.openxmlformats-officedocument.presentationml.presentation"},{"url":"https://drive.google.com/file/d/1uwVRshXpYw9rPh8LdUp_O8qzDISJg0Hc/view","name":"Customer_Onboarding_Process.docx","size":18999,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},{"url":"https://drive.google.com/file/d/1O10-LkiinmCAXTmXUa9Zw6UQZyn5xtg8/view","name":"Service_Delivery_Process.docx","size":18445,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},{"url":"https://drive.google.com/file/d/1bcIhaFcPx0xkS0ehFD7XY2M-mDO-qixn/view","name":"Data_Required.docx","size":18452,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},{"url":"https://drive.google.com/file/d/1uZB7q88z7OZiSOf39lXrg_TzIqNIlSe1/view","name":"E-Battery company foundation.xlsx","size":11173,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"},{"url":"https://drive.google.com/file/d/11x8-qGy36pKgTdFo_v1d6B-jvkVzMjYB/view","name":"Quality_Control_Procedure.docx","size":17756,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},{"url":"https://drive.google.com/file/d/17mMxhwUE1-_2FXpBazWMfxUp5fZOlywc/view","name":"First_Three_Operations_KPIs.docx","size":18036,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},{"url":"https://drive.google.com/file/d/1zcDv-AVUw7UhmOvm9SAWeiMY8-sUXf4x/view","name":"Company Foundation voltedge HEMANTH LG.xlsx","size":17621,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"},{"url":"https://drive.google.com/file/d/1794LftnENaOZB6JtVMlpQ6t27GRRvs-7/view","name":"Company Foundation hemanth L G.xlsx","size":102810,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}]'::text,
   '2026-09-17 19:30:00+00'::timestamptz),

  -- Batch 3: Next 6 students (E-Battery Technologies & Uncommon Cup)
  ('abhisheknd267@gmail.com'::text,
   'Company Formation & Performance'::text,
   'https://drive.google.com/drive/folders/1BcNsbVwx3LXTXpIdg8oPI05lRw3nsAW2'::text,
   '[{"url":"https://drive.google.com/file/d/13zzc5N4N7RzzKZZrIB-06n-jX_NSSlUw/view","name":"E-Battery_Technologies_PPT.pptx","size":294987,"type":"application/vnd.openxmlformats-officedocument.presentationml.presentation"},{"url":"https://drive.google.com/file/d/1JChsW7aKwhPNRolsUmqg959fXXnSCwSh/view","name":"3. Recruitment Process.docx","size":173390,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},{"url":"https://drive.google.com/file/d/1Op63aOlHtSgfy7Ms5kc8X9Z3ahbOXK6d/view","name":"2. organisation structure.docx","size":132582,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},{"url":"https://drive.google.com/file/d/1atMhNMNDrSmRqHo7lfl7diH0PdiqVPUH/view","name":"1. first five roles to hire.docx","size":28832,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},{"url":"https://drive.google.com/file/d/1MJm0pjvuTGiCtfusCNY1OwsbS9c9DUqe/view","name":"4. Attendance and Leave Policy.docx","size":24701,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},{"url":"https://drive.google.com/file/d/1utW_qiZNrkRWWGKsbxJIShMHeF7rDKWk/view","name":"6. Performance Review Method.docx","size":24005,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},{"url":"https://drive.google.com/file/d/1SZS9Q3GaXwga631-8zEUoxFVgD6m5P5z/view","name":"5. Code of Conduct.docx","size":23386,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},{"url":"https://drive.google.com/file/d/1ta-Z_dwphlBzbYBuw1YNcS2k_LXnQe6o/view","name":"7. First Three HR KPIs.docx","size":22945,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},{"url":"https://drive.google.com/file/d/1uZB7q88z7OZiSOf39lXrg_TzIqNIlSe1/view","name":"E-Battery company foundation.xlsx","size":11173,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"},{"url":"https://drive.google.com/file/d/1BQ_xKCDrNiuk29KrkPp-_7qjfn-eleW9/view","name":"E battery technologies marketing report.docx","size":33084,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},{"url":"https://drive.google.com/file/d/1zcDv-AVUw7UhmOvm9SAWeiMY8-sUXf4x/view","name":"Company Foundation voltedge HEMANTH LG.xlsx","size":17621,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"},{"url":"https://drive.google.com/file/d/1794LftnENaOZB6JtVMlpQ6t27GRRvs-7/view","name":"Company Foundation hemanth L G.xlsx","size":102810,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}]'::text,
   '2026-09-17 20:00:00+00'::timestamptz),

  ('shivakumar07505@gmail.com'::text,
   'Company Formation & Performance'::text,
   'https://drive.google.com/drive/folders/1BcNsbVwx3LXTXpIdg8oPI05lRw3nsAW2'::text,
   '[{"url":"https://drive.google.com/file/d/13zzc5N4N7RzzKZZrIB-06n-jX_NSSlUw/view","name":"E-Battery_Technologies_PPT.pptx","size":294987,"type":"application/vnd.openxmlformats-officedocument.presentationml.presentation"},{"url":"https://drive.google.com/file/d/1uwVRshXpYw9rPh8LdUp_O8qzDISJg0Hc/view","name":"Customer_Onboarding_Process.docx","size":18999,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},{"url":"https://drive.google.com/file/d/1O10-LkiinmCAXTmXUa9Zw6UQZyn5xtg8/view","name":"Service_Delivery_Process.docx","size":18445,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},{"url":"https://drive.google.com/file/d/1bcIhaFcPx0xkS0ehFD7XY2M-mDO-qixn/view","name":"Data_Required.docx","size":18452,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},{"url":"https://drive.google.com/file/d/1uZB7q88z7OZiSOf39lXrg_TzIqNIlSe1/view","name":"E-Battery company foundation.xlsx","size":11173,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"},{"url":"https://drive.google.com/file/d/11x8-qGy36pKgTdFo_v1d6B-jvkVzMjYB/view","name":"Quality_Control_Procedure.docx","size":17756,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},{"url":"https://drive.google.com/file/d/17mMxhwUE1-_2FXpBazWMfxUp5fZOlywc/view","name":"First_Three_Operations_KPIs.docx","size":18036,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},{"url":"https://drive.google.com/file/d/1ArL1mTUNH7Lk8L0StNtawPwiVG0cSyK8/view","name":"E-battery technology_Financial_Report.docx","size":28868,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},{"url":"https://drive.google.com/file/d/1zcDv-AVUw7UhmOvm9SAWeiMY8-sUXf4x/view","name":"Company Foundation voltedge HEMANTH LG.xlsx","size":17621,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"},{"url":"https://drive.google.com/file/d/1794LftnENaOZB6JtVMlpQ6t27GRRvs-7/view","name":"Company Foundation hemanth L G.xlsx","size":102810,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}]'::text,
   '2026-09-17 20:30:00+00'::timestamptz),

  ('rakshithps4477@gmail.com'::text,
   'Company Formation & Performance'::text,
   'https://drive.google.com/drive/folders/1BcNsbVwx3LXTXpIdg8oPI05lRw3nsAW2'::text,
   '[{"url":"https://drive.google.com/file/d/13zzc5N4N7RzzKZZrIB-06n-jX_NSSlUw/view","name":"E-Battery_Technologies_PPT.pptx","size":294987,"type":"application/vnd.openxmlformats-officedocument.presentationml.presentation"},{"url":"https://drive.google.com/file/d/1uZB7q88z7OZiSOf39lXrg_TzIqNIlSe1/view","name":"E-Battery company foundation.xlsx","size":11173,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"},{"url":"https://drive.google.com/file/d/1BQ_xKCDrNiuk29KrkPp-_7qjfn-eleW9/view","name":"E battery technologies marketing report.docx","size":33084,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},{"url":"https://drive.google.com/file/d/1zcDv-AVUw7UhmOvm9SAWeiMY8-sUXf4x/view","name":"Company Foundation voltedge HEMANTH LG.xlsx","size":17621,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"},{"url":"https://drive.google.com/file/d/1794LftnENaOZB6JtVMlpQ6t27GRRvs-7/view","name":"Company Foundation hemanth L G.xlsx","size":102810,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}]'::text,
   '2026-09-17 21:00:00+00'::timestamptz),

  ('shobithar91@gmail.com'::text,
   'Company Formation & Performance'::text,
   'https://drive.google.com/drive/folders/1BcNsbVwx3LXTXpIdg8oPI05lRw3nsAW2'::text,
   '[{"url":"https://drive.google.com/file/d/13zzc5N4N7RzzKZZrIB-06n-jX_NSSlUw/view","name":"E-Battery_Technologies_PPT.pptx","size":294987,"type":"application/vnd.openxmlformats-officedocument.presentationml.presentation"},{"url":"https://drive.google.com/file/d/1JChsW7aKwhPNRolsUmqg959fXXnSCwSh/view","name":"3. Recruitment Process.docx","size":173390,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},{"url":"https://drive.google.com/file/d/1Op63aOlHtSgfy7Ms5kc8X9Z3ahbOXK6d/view","name":"2. organisation structure.docx","size":132582,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},{"url":"https://drive.google.com/file/d/1atMhNMNDrSmRqHo7lfl7diH0PdiqVPUH/view","name":"1. first five roles to hire.docx","size":28832,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},{"url":"https://drive.google.com/file/d/1MJm0pjvuTGiCtfusCNY1OwsbS9c9DUqe/view","name":"4. Attendance and Leave Policy.docx","size":24701,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},{"url":"https://drive.google.com/file/d/1utW_qiZNrkRWWGKsbxJIShMHeF7rDKWk/view","name":"6. Performance Review Method.docx","size":24005,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},{"url":"https://drive.google.com/file/d/1SZS9Q3GaXwga631-8zEUoxFVgD6m5P5z/view","name":"5. Code of Conduct.docx","size":23386,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},{"url":"https://drive.google.com/file/d/1ta-Z_dwphlBzbYBuw1YNcS2k_LXnQe6o/view","name":"7. First Three HR KPIs.docx","size":22945,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},{"url":"https://drive.google.com/file/d/1uZB7q88z7OZiSOf39lXrg_TzIqNIlSe1/view","name":"E-Battery company foundation.xlsx","size":11173,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"},{"url":"https://drive.google.com/file/d/1zcDv-AVUw7UhmOvm9SAWeiMY8-sUXf4x/view","name":"Company Foundation voltedge HEMANTH LG.xlsx","size":17621,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"},{"url":"https://drive.google.com/file/d/1794LftnENaOZB6JtVMlpQ6t27GRRvs-7/view","name":"Company Foundation hemanth L G.xlsx","size":102810,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}]'::text,
   '2026-09-17 21:30:00+00'::timestamptz),

  ('jeevithadn47@gmail.com'::text,
   'Company Formation & Performance'::text,
   'https://drive.google.com/drive/folders/1BcNsbVwx3LXTXpIdg8oPI05lRw3nsAW2'::text,
   '[{"url":"https://drive.google.com/file/d/13zzc5N4N7RzzKZZrIB-06n-jX_NSSlUw/view","name":"E-Battery_Technologies_PPT.pptx","size":294987,"type":"application/vnd.openxmlformats-officedocument.presentationml.presentation"},{"url":"https://drive.google.com/file/d/1JChsW7aKwhPNRolsUmqg959fXXnSCwSh/view","name":"3. Recruitment Process.docx","size":173390,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},{"url":"https://drive.google.com/file/d/1Op63aOlHtSgfy7Ms5kc8X9Z3ahbOXK6d/view","name":"2. organisation structure.docx","size":132582,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},{"url":"https://drive.google.com/file/d/1atMhNMNDrSmRqHo7lfl7diH0PdiqVPUH/view","name":"1. first five roles to hire.docx","size":28832,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},{"url":"https://drive.google.com/file/d/1MJm0pjvuTGiCtfusCNY1OwsbS9c9DUqe/view","name":"4. Attendance and Leave Policy.docx","size":24701,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},{"url":"https://drive.google.com/file/d/1utW_qiZNrkRWWGKsbxJIShMHeF7rDKWk/view","name":"6. Performance Review Method.docx","size":24005,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},{"url":"https://drive.google.com/file/d/1SZS9Q3GaXwga631-8zEUoxFVgD6m5P5z/view","name":"5. Code of Conduct.docx","size":23386,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},{"url":"https://drive.google.com/file/d/1ta-Z_dwphlBzbYBuw1YNcS2k_LXnQe6o/view","name":"7. First Three HR KPIs.docx","size":22945,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},{"url":"https://drive.google.com/file/d/1uZB7q88z7OZiSOf39lXrg_TzIqNIlSe1/view","name":"E-Battery company foundation.xlsx","size":11173,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"},{"url":"https://drive.google.com/file/d/1zcDv-AVUw7UhmOvm9SAWeiMY8-sUXf4x/view","name":"Company Foundation voltedge HEMANTH LG.xlsx","size":17621,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"},{"url":"https://drive.google.com/file/d/1794LftnENaOZB6JtVMlpQ6t27GRRvs-7/view","name":"Company Foundation hemanth L G.xlsx","size":102810,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}]'::text,
   '2026-09-17 22:00:00+00'::timestamptz),

  ('chaithanyatr24@gmail.com'::text,
   'Company Formation & Performance'::text,
   'https://drive.google.com/drive/folders/1uQ2gMWpsFGEEI4332TKZFzGkbxYDkjq_'::text,
   '[{"url":"https://drive.google.com/file/d/1G8W8QEwdQ8cAZEt3eL35QrWzHVtLhb7x/view","name":"Uncommon_Cup_Presentation (1).pptx","size":184491,"type":"application/vnd.openxmlformats-officedocument.presentationml.presentation"},{"url":"https://drive.google.com/file/d/1u_8p3zDD-F0oKdLl2SmeSGMKxdWIUtgr/view","name":"Chaithanya & group (1).xlsx","size":19527,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"},{"url":"https://drive.google.com/file/d/1xDM1jF-BOFCq9Y-E2cs47It_fUWTMkFy/view","name":"Chaithanya & group.xlsx","size":58902,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}]'::text,
   '2026-09-17 22:30:00+00'::timestamptz),

  -- Batch 4: Next 10 students (Uncommon Cup & Pinnacle Coaching Centre)
  ('cchaithran698@gmail.com'::text,
   'Company Formation & Performance'::text,
   'https://drive.google.com/drive/folders/1uQ2gMWpsFGEEI4332TKZFzGkbxYDkjq_'::text,
   '[{"url":"https://drive.google.com/file/d/1G8W8QEwdQ8cAZEt3eL35QrWzHVtLhb7x/view","name":"Uncommon_Cup_Presentation (1).pptx","size":184491,"type":"application/vnd.openxmlformats-officedocument.presentationml.presentation"},{"url":"https://drive.google.com/file/d/19HBkV8YjLEj5Ua5njyb6Q9h8f0Uv80Do/view","name":"TARKET CUSTUMER.docx","size":188638,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},{"url":"https://drive.google.com/file/d/1ig5lEkU6fmPieOlN6riHiopY0BM4d2qT/view","name":"Pricing Strategy.docx","size":24113,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},{"url":"https://drive.google.com/file/d/1dxRIr9Pvs2fD5p7_RtwbJzfc22xNahxi/view","name":"Lead GENERATION.docx","size":28340,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},{"url":"https://drive.google.com/file/d/165GlzhyB84UvDHpTJdYihKZk6k08BrO3/view","name":"Key Performance Indicators.docx","size":24720,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},{"url":"https://drive.google.com/file/d/1KmxEoOUN-JkhCQpC7NtOgpjvD4F8s7xr/view","name":"Customer Persona.docx","size":27851,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},{"url":"https://drive.google.com/file/d/1zrsIJGZWZ9uGYLQ87WH0cBTitp9B2R-t/view","name":"Brand Positioning.docx","size":29950,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},{"url":"https://drive.google.com/file/d/1u_8p3zDD-F0oKdLl2SmeSGMKxdWIUtgr/view","name":"Chaithanya & group (1).xlsx","size":19527,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"},{"url":"https://drive.google.com/file/d/1xDM1jF-BOFCq9Y-E2cs47It_fUWTMkFy/view","name":"Chaithanya & group.xlsx","size":58902,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}]'::text,
   '2026-09-17 23:00:00+00'::timestamptz),

  ('gowdachethu83@gmail.com'::text,
   'Company Formation & Performance'::text,
   'https://drive.google.com/drive/folders/1uQ2gMWpsFGEEI4332TKZFzGkbxYDkjq_'::text,
   '[{"url":"https://drive.google.com/file/d/1G8W8QEwdQ8cAZEt3eL35QrWzHVtLhb7x/view","name":"Uncommon_Cup_Presentation (1).pptx","size":184491,"type":"application/vnd.openxmlformats-officedocument.presentationml.presentation"},{"url":"https://drive.google.com/file/d/19HBkV8YjLEj5Ua5njyb6Q9h8f0Uv80Do/view","name":"TARKET CUSTUMER.docx","size":188638,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},{"url":"https://drive.google.com/file/d/1ig5lEkU6fmPieOlN6riHiopY0BM4d2qT/view","name":"Pricing Strategy.docx","size":24113,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},{"url":"https://drive.google.com/file/d/1dxRIr9Pvs2fD5p7_RtwbJzfc22xNahxi/view","name":"Lead GENERATION.docx","size":28340,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},{"url":"https://drive.google.com/file/d/165GlzhyB84UvDHpTJdYihKZk6k08BrO3/view","name":"Key Performance Indicators.docx","size":24720,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},{"url":"https://drive.google.com/file/d/1KmxEoOUN-JkhCQpC7NtOgpjvD4F8s7xr/view","name":"Customer Persona.docx","size":27851,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},{"url":"https://drive.google.com/file/d/1zrsIJGZWZ9uGYLQ87WH0cBTitp9B2R-t/view","name":"Brand Positioning.docx","size":29950,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},{"url":"https://drive.google.com/file/d/1u_8p3zDD-F0oKdLl2SmeSGMKxdWIUtgr/view","name":"Chaithanya & group (1).xlsx","size":19527,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"},{"url":"https://drive.google.com/file/d/1xDM1jF-BOFCq9Y-E2cs47It_fUWTMkFy/view","name":"Chaithanya & group.xlsx","size":58902,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}]'::text,
   '2026-09-17 23:30:00+00'::timestamptz),

  ('santhoshgowda2102@gmail.com'::text,
   'Company Formation & Performance'::text,
   'https://drive.google.com/drive/folders/1uQ2gMWpsFGEEI4332TKZFzGkbxYDkjq_'::text,
   '[{"url":"https://drive.google.com/file/d/1G8W8QEwdQ8cAZEt3eL35QrWzHVtLhb7x/view","name":"Uncommon_Cup_Presentation (1).pptx","size":184491,"type":"application/vnd.openxmlformats-officedocument.presentationml.presentation"},{"url":"https://drive.google.com/file/d/1vmPQ_1udwePrvbidcY8Gplnh1BLdoY3f/view","name":"uncommon cup financial plan.docx","size":41926,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},{"url":"https://drive.google.com/file/d/1u_8p3zDD-F0oKdLl2SmeSGMKxdWIUtgr/view","name":"Chaithanya & group (1).xlsx","size":19527,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"},{"url":"https://drive.google.com/file/d/1xDM1jF-BOFCq9Y-E2cs47It_fUWTMkFy/view","name":"Chaithanya & group.xlsx","size":58902,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}]'::text,
   '2026-09-18 00:00:00+00'::timestamptz),

  ('priyankaammu663@gmail.com'::text,
   'Company Formation & Performance'::text,
   'https://drive.google.com/drive/folders/1uQ2gMWpsFGEEI4332TKZFzGkbxYDkjq_'::text,
   '[{"url":"https://drive.google.com/file/d/1G8W8QEwdQ8cAZEt3eL35QrWzHVtLhb7x/view","name":"Uncommon_Cup_Presentation (1).pptx","size":184491,"type":"application/vnd.openxmlformats-officedocument.presentationml.presentation"},{"url":"https://drive.google.com/file/d/1vmPQ_1udwePrvbidcY8Gplnh1BLdoY3f/view","name":"uncommon cup financial plan.docx","size":41926,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},{"url":"https://drive.google.com/file/d/1u_8p3zDD-F0oKdLl2SmeSGMKxdWIUtgr/view","name":"Chaithanya & group (1).xlsx","size":19527,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"},{"url":"https://drive.google.com/file/d/1xDM1jF-BOFCq9Y-E2cs47It_fUWTMkFy/view","name":"Chaithanya & group.xlsx","size":58902,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}]'::text,
   '2026-09-18 00:30:00+00'::timestamptz),

  ('hariprasadnayak77280@gmail.com'::text,
   'Company Formation & Performance'::text,
   'https://drive.google.com/drive/folders/1uQ2gMWpsFGEEI4332TKZFzGkbxYDkjq_'::text,
   '[{"url":"https://drive.google.com/file/d/1G8W8QEwdQ8cAZEt3eL35QrWzHVtLhb7x/view","name":"Uncommon_Cup_Presentation (1).pptx","size":184491,"type":"application/vnd.openxmlformats-officedocument.presentationml.presentation"},{"url":"https://drive.google.com/file/d/18a1E43royYi-ECFYSVBDJXxOXqJBlrgV/view","name":"Customer Onboarding Process.docx","size":31729,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},{"url":"https://drive.google.com/file/d/1u_8p3zDD-F0oKdLl2SmeSGMKxdWIUtgr/view","name":"Chaithanya & group (1).xlsx","size":19527,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"},{"url":"https://drive.google.com/file/d/1xDM1jF-BOFCq9Y-E2cs47It_fUWTMkFy/view","name":"Chaithanya & group.xlsx","size":58902,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}]'::text,
   '2026-09-18 01:00:00+00'::timestamptz),

  ('roopeshgc2003@gmail.com'::text,
   'Company Formation & Performance'::text,
   'https://drive.google.com/drive/folders/1uQ2gMWpsFGEEI4332TKZFzGkbxYDkjq_'::text,
   '[{"url":"https://drive.google.com/file/d/1G8W8QEwdQ8cAZEt3eL35QrWzHVtLhb7x/view","name":"Uncommon_Cup_Presentation (1).pptx","size":184491,"type":"application/vnd.openxmlformats-officedocument.presentationml.presentation"},{"url":"https://drive.google.com/file/d/18a1E43royYi-ECFYSVBDJXxOXqJBlrgV/view","name":"Customer Onboarding Process.docx","size":31729,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},{"url":"https://drive.google.com/file/d/1u_8p3zDD-F0oKdLl2SmeSGMKxdWIUtgr/view","name":"Chaithanya & group (1).xlsx","size":19527,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"},{"url":"https://drive.google.com/file/d/1xDM1jF-BOFCq9Y-E2cs47It_fUWTMkFy/view","name":"Chaithanya & group.xlsx","size":58902,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}]'::text,
   '2026-09-18 01:30:00+00'::timestamptz),

  ('varshinivarshanb@gmail.com'::text,
   'Company Formation & Performance'::text,
   'https://drive.google.com/drive/folders/1uQ2gMWpsFGEEI4332TKZFzGkbxYDkjq_'::text,
   '[{"url":"https://drive.google.com/file/d/1G8W8QEwdQ8cAZEt3eL35QrWzHVtLhb7x/view","name":"Uncommon_Cup_Presentation (1).pptx","size":184491,"type":"application/vnd.openxmlformats-officedocument.presentationml.presentation"},{"url":"https://drive.google.com/file/d/1Q2nPX4Fl7eD92CnGHrzIB4B9iqrJj-U9/view","name":"07_HR_KPI_Scorecard.docx","size":17255,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},{"url":"https://drive.google.com/file/d/1TJx0l3AwPdmlRs3SN-c6RQg9SWkt6giN/view","name":"06_Performance_Review_Method.docx","size":20888,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},{"url":"https://drive.google.com/file/d/126LHDU0dmrYGr3knZ9t0D0PLxgghIuEB/view","name":"05_Code_of_Conduct.docx","size":17672,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},{"url":"https://drive.google.com/file/d/1nMqi8Z_vY6GENehVDjxGe6YbiCMVUSqz/view","name":"04_Attendance_and_Leave_Policy.docx","size":19949,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},{"url":"https://drive.google.com/file/d/19889jnUVq_Zs0FJ79_YW-MtsjNGIrrEt/view","name":"03_Recruitment_Process.docx","size":18531,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},{"url":"https://drive.google.com/file/d/1UNLaOeJep_e9mZEXW9i41zHRLHy_ZuTO/view","name":"02_Organisation_Structure.docx","size":22060,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},{"url":"https://drive.google.com/file/d/1d25m2yMobq8YO-aJs1KN8Zpahl3dzHHf/view","name":"01_First_Five_Roles_Job_Descriptions.docx","size":20654,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},{"url":"https://drive.google.com/file/d/1u_8p3zDD-F0oKdLl2SmeSGMKxdWIUtgr/view","name":"Chaithanya & group (1).xlsx","size":19527,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"},{"url":"https://drive.google.com/file/d/1xDM1jF-BOFCq9Y-E2cs47It_fUWTMkFy/view","name":"Chaithanya & group.xlsx","size":58902,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}]'::text,
   '2026-09-18 02:00:00+00'::timestamptz),

  ('thanukrishna.am@gmail.com'::text,
   'Company Formation & Performance'::text,
   'https://drive.google.com/drive/folders/1uQ2gMWpsFGEEI4332TKZFzGkbxYDkjq_'::text,
   '[{"url":"https://drive.google.com/file/d/1G8W8QEwdQ8cAZEt3eL35QrWzHVtLhb7x/view","name":"Uncommon_Cup_Presentation (1).pptx","size":184491,"type":"application/vnd.openxmlformats-officedocument.presentationml.presentation"},{"url":"https://drive.google.com/file/d/1vmPQ_1udwePrvbidcY8Gplnh1BLdoY3f/view","name":"uncommon cup financial plan.docx","size":41926,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},{"url":"https://drive.google.com/file/d/18a1E43royYi-ECFYSVBDJXxOXqJBlrgV/view","name":"Customer Onboarding Process.docx","size":31729,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},{"url":"https://drive.google.com/file/d/19HBkV8YjLEj5Ua5njyb6Q9h8f0Uv80Do/view","name":"TARKET CUSTUMER.docx","size":188638,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},{"url":"https://drive.google.com/file/d/1ig5lEkU6fmPieOlN6riHiopY0BM4d2qT/view","name":"Pricing Strategy.docx","size":24113,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},{"url":"https://drive.google.com/file/d/1dxRIr9Pvs2fD5p7_RtwbJzfc22xNahxi/view","name":"Lead GENERATION.docx","size":28340,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},{"url":"https://drive.google.com/file/d/165GlzhyB84UvDHpTJdYihKZk6k08BrO3/view","name":"Key Performance Indicators.docx","size":24720,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},{"url":"https://drive.google.com/file/d/1KmxEoOUN-JkhCQpC7NtOgpjvD4F8s7xr/view","name":"Customer Persona.docx","size":27851,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},{"url":"https://drive.google.com/file/d/1zrsIJGZWZ9uGYLQ87WH0cBTitp9B2R-t/view","name":"Brand Positioning.docx","size":29950,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},{"url":"https://drive.google.com/file/d/1Q2nPX4Fl7eD92CnGHrzIB4B9iqrJj-U9/view","name":"07_HR_KPI_Scorecard.docx","size":17255,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},{"url":"https://drive.google.com/file/d/1TJx0l3AwPdmlRs3SN-c6RQg9SWkt6giN/view","name":"06_Performance_Review_Method.docx","size":20888,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},{"url":"https://drive.google.com/file/d/126LHDU0dmrYGr3knZ9t0D0PLxgghIuEB/view","name":"05_Code_of_Conduct.docx","size":17672,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},{"url":"https://drive.google.com/file/d/1nMqi8Z_vY6GENehVDjxGe6YbiCMVUSqz/view","name":"04_Attendance_and_Leave_Policy.docx","size":19949,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},{"url":"https://drive.google.com/file/d/19889jnUVq_Zs0FJ79_YW-MtsjNGIrrEt/view","name":"03_Recruitment_Process.docx","size":18531,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},{"url":"https://drive.google.com/file/d/1UNLaOeJep_e9mZEXW9i41zHRLHy_ZuTO/view","name":"02_Organisation_Structure.docx","size":22060,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},{"url":"https://drive.google.com/file/d/1d25m2yMobq8YO-aJs1KN8Zpahl3dzHHf/view","name":"01_First_Five_Roles_Job_Descriptions.docx","size":20654,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},{"url":"https://drive.google.com/file/d/1u_8p3zDD-F0oKdLl2SmeSGMKxdWIUtgr/view","name":"Chaithanya & group (1).xlsx","size":19527,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"},{"url":"https://drive.google.com/file/d/1xDM1jF-BOFCq9Y-E2cs47It_fUWTMkFy/view","name":"Chaithanya & group.xlsx","size":58902,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}]'::text,
   '2026-09-18 02:30:00+00'::timestamptz),

  ('simrithasuresh31@gmail.com'::text,
   'Company Formation & Performance'::text,
   'https://drive.google.com/drive/folders/1uQ2gMWpsFGEEI4332TKZFzGkbxYDkjq_'::text,
   '[{"url":"https://drive.google.com/file/d/1G8W8QEwdQ8cAZEt3eL35QrWzHVtLhb7x/view","name":"Uncommon_Cup_Presentation (1).pptx","size":184491,"type":"application/vnd.openxmlformats-officedocument.presentationml.presentation"},{"url":"https://drive.google.com/file/d/1Q2nPX4Fl7eD92CnGHrzIB4B9iqrJj-U9/view","name":"07_HR_KPI_Scorecard.docx","size":17255,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},{"url":"https://drive.google.com/file/d/1TJx0l3AwPdmlRs3SN-c6RQg9SWkt6giN/view","name":"06_Performance_Review_Method.docx","size":20888,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},{"url":"https://drive.google.com/file/d/126LHDU0dmrYGr3knZ9t0D0PLxgghIuEB/view","name":"05_Code_of_Conduct.docx","size":17672,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},{"url":"https://drive.google.com/file/d/1nMqi8Z_vY6GENehVDjxGe6YbiCMVUSqz/view","name":"04_Attendance_and_Leave_Policy.docx","size":19949,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},{"url":"https://drive.google.com/file/d/19889jnUVq_Zs0FJ79_YW-MtsjNGIrrEt/view","name":"03_Recruitment_Process.docx","size":18531,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},{"url":"https://drive.google.com/file/d/1UNLaOeJep_e9mZEXW9i41zHRLHy_ZuTO/view","name":"02_Organisation_Structure.docx","size":22060,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},{"url":"https://drive.google.com/file/d/1d25m2yMobq8YO-aJs1KN8Zpahl3dzHHf/view","name":"01_First_Five_Roles_Job_Descriptions.docx","size":20654,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},{"url":"https://drive.google.com/file/d/1u_8p3zDD-F0oKdLl2SmeSGMKxdWIUtgr/view","name":"Chaithanya & group (1).xlsx","size":19527,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"},{"url":"https://drive.google.com/file/d/1xDM1jF-BOFCq9Y-E2cs47It_fUWTMkFy/view","name":"Chaithanya & group.xlsx","size":58902,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}]'::text,
   '2026-09-18 03:00:00+00'::timestamptz),

  ('yashaswinigowda601@gmail.com'::text,
   'Company Formation & Performance'::text,
   'https://drive.google.com/drive/folders/1Gt1yntcYQ8G0mGhgCT3hS1_iX2s_3X3P'::text,
   '[{"url":"https://drive.google.com/file/d/1jS2TMMew-wEyvxisojkF8PtRzo2FUJWb/view","name":"yashaswini.xlsx","size":61639,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"},{"url":"https://drive.google.com/file/d/1-d5_tZoaVpS02Qc9PnLTCrUX1kzfL3Dy/view","name":"Pinnacle_Coaching_Centre_MBA_Presentation.pptx","size":475049,"type":"application/vnd.openxmlformats-officedocument.presentationml.presentation"},{"url":"https://drive.google.com/file/d/10b4S6603bcMM2boBXy8hxJk5gFpmZejg/view","name":"Pinnacle_Coaching_Centre_MBA_Presentation.pptx","size":585608,"type":"application/vnd.openxmlformats-officedocument.presentationml.presentation"},{"url":"https://drive.google.com/file/d/1PlEpbNuZpJ297hKFCnGnRFp35ezpbNO4/view","name":"yashaswini learning centre.xlsx","size":106013,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"},{"url":"https://docs.google.com/spreadsheets/d/1kITrI8H7MliY_FNel80PP8-ZuTN-pJMXMNuu0cdsZj0/edit","name":"yashaswini","size":7314,"type":"application/vnd.google-apps.spreadsheet"}]'::text,
   '2026-09-18 03:30:00+00'::timestamptz),

  -- Batch 5: Next 10 students (Pinnacle Coaching Centre & Marketing Assignments)
  ('chandanaks547@gmail.com'::text,
   'Company Formation & Performance'::text,
   'https://drive.google.com/drive/folders/1Gt1yntcYQ8G0mGhgCT3hS1_iX2s_3X3P'::text,
   '[{"url":"https://drive.google.com/file/d/1jS2TMMew-wEyvxisojkF8PtRzo2FUJWb/view","name":"yashaswini.xlsx","size":61639,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"},{"url":"https://drive.google.com/file/d/1-d5_tZoaVpS02Qc9PnLTCrUX1kzfL3Dy/view","name":"Pinnacle_Coaching_Centre_MBA_Presentation.pptx","size":475049,"type":"application/vnd.openxmlformats-officedocument.presentationml.presentation"},{"url":"https://drive.google.com/file/d/19E8bXO-0qcU9FSZzyG2CiO2xGu9xwmYs/view","name":"Pinnacle_Analytics_Operations_Rework_and_Supporting_Document.docx","size":41678,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},{"url":"https://drive.google.com/file/d/1RTvp35dvHwmkVseTAqJEyE_xO3y5dx8r/view","name":"Pinnacle_Analytics_Operations_Dashboard.pdf","size":30862,"type":"application/pdf"},{"url":"https://drive.google.com/file/d/10b4S6603bcMM2boBXy8hxJk5gFpmZejg/view","name":"Pinnacle_Coaching_Centre_MBA_Presentation.pptx","size":585608,"type":"application/vnd.openxmlformats-officedocument.presentationml.presentation"},{"url":"https://drive.google.com/file/d/1PlEpbNuZpJ297hKFCnGnRFp35ezpbNO4/view","name":"yashaswini learning centre.xlsx","size":106013,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"},{"url":"https://docs.google.com/spreadsheets/d/1kITrI8H7MliY_FNel80PP8-ZuTN-pJMXMNuu0cdsZj0/edit","name":"yashaswini","size":7314,"type":"application/vnd.google-apps.spreadsheet"}]'::text,
   '2026-09-18 04:00:00+00'::timestamptz),

  ('tejuteja082@gmail.com'::text,
   'Company Formation & Performance'::text,
   'https://drive.google.com/drive/folders/1Gt1yntcYQ8G0mGhgCT3hS1_iX2s_3X3P'::text,
   '[{"url":"https://drive.google.com/file/d/1jS2TMMew-wEyvxisojkF8PtRzo2FUJWb/view","name":"yashaswini.xlsx","size":61639,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"},{"url":"https://drive.google.com/file/d/1-d5_tZoaVpS02Qc9PnLTCrUX1kzfL3Dy/view","name":"Pinnacle_Coaching_Centre_MBA_Presentation.pptx","size":475049,"type":"application/vnd.openxmlformats-officedocument.presentationml.presentation"},{"url":"https://drive.google.com/file/d/1ywHZ1d9luTG86AMlBcu6f53D6LqXio-n/view","name":"05_HR_Safety_and_Compliance_Plan.docx","size":256853,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},{"url":"https://drive.google.com/file/d/1PyG8-kIavqSqzd_kCC7wGYPH_slxKtmF/view","name":"05a_HR_Compliance_Annexures_and_Templates.docx","size":173605,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},{"url":"https://drive.google.com/file/d/10b4S6603bcMM2boBXy8hxJk5gFpmZejg/view","name":"Pinnacle_Coaching_Centre_MBA_Presentation.pptx","size":585608,"type":"application/vnd.openxmlformats-officedocument.presentationml.presentation"},{"url":"https://drive.google.com/file/d/1PlEpbNuZpJ297hKFCnGnRFp35ezpbNO4/view","name":"yashaswini learning centre.xlsx","size":106013,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"},{"url":"https://docs.google.com/spreadsheets/d/1kITrI8H7MliY_FNel80PP8-ZuTN-pJMXMNuu0cdsZj0/edit","name":"yashaswini","size":7314,"type":"application/vnd.google-apps.spreadsheet"}]'::text,
   '2026-09-18 04:30:00+00'::timestamptz),

  ('ppavan50776@gmail.com'::text,
   'Company Formation & Performance'::text,
   'https://drive.google.com/drive/folders/1Gt1yntcYQ8G0mGhgCT3hS1_iX2s_3X3P'::text,
   '[{"url":"https://drive.google.com/file/d/1jS2TMMew-wEyvxisojkF8PtRzo2FUJWb/view","name":"yashaswini.xlsx","size":61639,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"},{"url":"https://drive.google.com/file/d/1-d5_tZoaVpS02Qc9PnLTCrUX1kzfL3Dy/view","name":"Pinnacle_Coaching_Centre_MBA_Presentation.pptx","size":475049,"type":"application/vnd.openxmlformats-officedocument.presentationml.presentation"},{"url":"https://drive.google.com/file/d/1EVoh2HHqhjThDcw6sZ7Zn0xVLoaNmG4D/view","name":"01_Reworked_Marketing_Department_Plan.docx","size":42005,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},{"url":"https://drive.google.com/file/d/1g6D_7kVUf6OQRn0YGpur5uNtefecFQo9/view","name":"02_Marketing_Department_Supporting_Document.docx","size":39860,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},{"url":"https://drive.google.com/file/d/10b4S6603bcMM2boBXy8hxJk5gFpmZejg/view","name":"Pinnacle_Coaching_Centre_MBA_Presentation.pptx","size":585608,"type":"application/vnd.openxmlformats-officedocument.presentationml.presentation"},{"url":"https://drive.google.com/file/d/1PlEpbNuZpJ297hKFCnGnRFp35ezpbNO4/view","name":"yashaswini learning centre.xlsx","size":106013,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"},{"url":"https://docs.google.com/spreadsheets/d/1kITrI8H7MliY_FNel80PP8-ZuTN-pJMXMNuu0cdsZj0/edit","name":"yashaswini","size":7314,"type":"application/vnd.google-apps.spreadsheet"}]'::text,
   '2026-09-18 05:00:00+00'::timestamptz),

  ('varungb04@gmail.com'::text,
   'Company Formation & Performance'::text,
   'https://drive.google.com/drive/folders/1Gt1yntcYQ8G0mGhgCT3hS1_iX2s_3X3P'::text,
   '[{"url":"https://drive.google.com/file/d/1jS2TMMew-wEyvxisojkF8PtRzo2FUJWb/view","name":"yashaswini.xlsx","size":61639,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"},{"url":"https://drive.google.com/file/d/1-d5_tZoaVpS02Qc9PnLTCrUX1kzfL3Dy/view","name":"Pinnacle_Coaching_Centre_MBA_Presentation.pptx","size":475049,"type":"application/vnd.openxmlformats-officedocument.presentationml.presentation"},{"url":"https://drive.google.com/file/d/1EVoh2HHqhjThDcw6sZ7Zn0xVLoaNmG4D/view","name":"01_Reworked_Marketing_Department_Plan.docx","size":42005,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},{"url":"https://drive.google.com/file/d/1g6D_7kVUf6OQRn0YGpur5uNtefecFQo9/view","name":"02_Marketing_Department_Supporting_Document.docx","size":39860,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},{"url":"https://drive.google.com/file/d/10b4S6603bcMM2boBXy8hxJk5gFpmZejg/view","name":"Pinnacle_Coaching_Centre_MBA_Presentation.pptx","size":585608,"type":"application/vnd.openxmlformats-officedocument.presentationml.presentation"},{"url":"https://drive.google.com/file/d/1PlEpbNuZpJ297hKFCnGnRFp35ezpbNO4/view","name":"yashaswini learning centre.xlsx","size":106013,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"},{"url":"https://docs.google.com/spreadsheets/d/1kITrI8H7MliY_FNel80PP8-ZuTN-pJMXMNuu0cdsZj0/edit","name":"yashaswini","size":7314,"type":"application/vnd.google-apps.spreadsheet"}]'::text,
   '2026-09-18 05:30:00+00'::timestamptz),

  ('m.jayashree352@gmail.com'::text,
   'Company Formation & Performance'::text,
   'https://drive.google.com/drive/folders/1Gt1yntcYQ8G0mGhgCT3hS1_iX2s_3X3P'::text,
   '[{"url":"https://drive.google.com/file/d/1jS2TMMew-wEyvxisojkF8PtRzo2FUJWb/view","name":"yashaswini.xlsx","size":61639,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"},{"url":"https://drive.google.com/file/d/1-d5_tZoaVpS02Qc9PnLTCrUX1kzfL3Dy/view","name":"Pinnacle_Coaching_Centre_MBA_Presentation.pptx","size":475049,"type":"application/vnd.openxmlformats-officedocument.presentationml.presentation"},{"url":"https://drive.google.com/file/d/1L8x1urscgg5PhA_DgHLGsHylEqIZqLFN/view","name":"Excel_sheet_with_Marketing_Plan.xlsx","size":40564,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"},{"url":"https://drive.google.com/file/d/1b6urlKE5vSm9q-IQYCa5YYETA9pi5kFx/view","name":"Finance Pinnacle.docx","size":24011,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},{"url":"https://drive.google.com/file/d/10b4S6603bcMM2boBXy8hxJk5gFpmZejg/view","name":"Pinnacle_Coaching_Centre_MBA_Presentation.pptx","size":585608,"type":"application/vnd.openxmlformats-officedocument.presentationml.presentation"},{"url":"https://drive.google.com/file/d/1PlEpbNuZpJ297hKFCnGnRFp35ezpbNO4/view","name":"yashaswini learning centre.xlsx","size":106013,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"},{"url":"https://docs.google.com/spreadsheets/d/1kITrI8H7MliY_FNel80PP8-ZuTN-pJMXMNuu0cdsZj0/edit","name":"yashaswini","size":7314,"type":"application/vnd.google-apps.spreadsheet"}]'::text,
   '2026-09-18 06:00:00+00'::timestamptz),

  ('bhumikabharath252@gmail.com'::text,
   'Company Formation & Performance'::text,
   'https://drive.google.com/drive/folders/1Gt1yntcYQ8G0mGhgCT3hS1_iX2s_3X3P'::text,
   '[{"url":"https://drive.google.com/file/d/1jS2TMMew-wEyvxisojkF8PtRzo2FUJWb/view","name":"yashaswini.xlsx","size":61639,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"},{"url":"https://drive.google.com/file/d/1-d5_tZoaVpS02Qc9PnLTCrUX1kzfL3Dy/view","name":"Pinnacle_Coaching_Centre_MBA_Presentation.pptx","size":475049,"type":"application/vnd.openxmlformats-officedocument.presentationml.presentation"},{"url":"https://drive.google.com/file/d/19E8bXO-0qcU9FSZzyG2CiO2xGu9xwmYs/view","name":"Pinnacle_Analytics_Operations_Rework_and_Supporting_Document.docx","size":41678,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},{"url":"https://drive.google.com/file/d/1RTvp35dvHwmkVseTAqJEyE_xO3y5dx8r/view","name":"Pinnacle_Analytics_Operations_Dashboard.pdf","size":30862,"type":"application/pdf"},{"url":"https://drive.google.com/file/d/10b4S6603bcMM2boBXy8hxJk5gFpmZejg/view","name":"Pinnacle_Coaching_Centre_MBA_Presentation.pptx","size":585608,"type":"application/vnd.openxmlformats-officedocument.presentationml.presentation"},{"url":"https://drive.google.com/file/d/1PlEpbNuZpJ297hKFCnGnRFp35ezpbNO4/view","name":"yashaswini learning centre.xlsx","size":106013,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"},{"url":"https://docs.google.com/spreadsheets/d/1kITrI8H7MliY_FNel80PP8-ZuTN-pJMXMNuu0cdsZj0/edit","name":"yashaswini","size":7314,"type":"application/vnd.google-apps.spreadsheet"}]'::text,
   '2026-09-18 06:30:00+00'::timestamptz),

  ('nageshwari1922@gmail.com'::text,
   'Company Formation & Performance'::text,
   'https://drive.google.com/drive/folders/1Gt1yntcYQ8G0mGhgCT3hS1_iX2s_3X3P'::text,
   '[{"url":"https://drive.google.com/file/d/1jS2TMMew-wEyvxisojkF8PtRzo2FUJWb/view","name":"yashaswini.xlsx","size":61639,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"},{"url":"https://drive.google.com/file/d/1-d5_tZoaVpS02Qc9PnLTCrUX1kzfL3Dy/view","name":"Pinnacle_Coaching_Centre_MBA_Presentation.pptx","size":475049,"type":"application/vnd.openxmlformats-officedocument.presentationml.presentation"},{"url":"https://drive.google.com/file/d/19E8bXO-0qcU9FSZzyG2CiO2xGu9xwmYs/view","name":"Pinnacle_Analytics_Operations_Rework_and_Supporting_Document.docx","size":41678,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},{"url":"https://drive.google.com/file/d/1RTvp35dvHwmkVseTAqJEyE_xO3y5dx8r/view","name":"Pinnacle_Analytics_Operations_Dashboard.pdf","size":30862,"type":"application/pdf"},{"url":"https://drive.google.com/file/d/10b4S6603bcMM2boBXy8hxJk5gFpmZejg/view","name":"Pinnacle_Coaching_Centre_MBA_Presentation.pptx","size":585608,"type":"application/vnd.openxmlformats-officedocument.presentationml.presentation"},{"url":"https://drive.google.com/file/d/1PlEpbNuZpJ297hKFCnGnRFp35ezpbNO4/view","name":"yashaswini learning centre.xlsx","size":106013,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"},{"url":"https://docs.google.com/spreadsheets/d/1kITrI8H7MliY_FNel80PP8-ZuTN-pJMXMNuu0cdsZj0/edit","name":"yashaswini","size":7314,"type":"application/vnd.google-apps.spreadsheet"}]'::text,
   '2026-09-18 07:00:00+00'::timestamptz),

  ('vinodvinu3123@gmail.com'::text,
   'Company Formation & Performance'::text,
   'https://drive.google.com/drive/folders/1Gt1yntcYQ8G0mGhgCT3hS1_iX2s_3X3P'::text,
   '[{"url":"https://drive.google.com/file/d/1jS2TMMew-wEyvxisojkF8PtRzo2FUJWb/view","name":"yashaswini.xlsx","size":61639,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"},{"url":"https://drive.google.com/file/d/1-d5_tZoaVpS02Qc9PnLTCrUX1kzfL3Dy/view","name":"Pinnacle_Coaching_Centre_MBA_Presentation.pptx","size":475049,"type":"application/vnd.openxmlformats-officedocument.presentationml.presentation"},{"url":"https://drive.google.com/file/d/10b4S6603bcMM2boBXy8hxJk5gFpmZejg/view","name":"Pinnacle_Coaching_Centre_MBA_Presentation.pptx","size":585608,"type":"application/vnd.openxmlformats-officedocument.presentationml.presentation"},{"url":"https://drive.google.com/file/d/1PlEpbNuZpJ297hKFCnGnRFp35ezpbNO4/view","name":"yashaswini learning centre.xlsx","size":106013,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"},{"url":"https://docs.google.com/spreadsheets/d/1kITrI8H7MliY_FNel80PP8-ZuTN-pJMXMNuu0cdsZj0/edit","name":"yashaswini","size":7314,"type":"application/vnd.google-apps.spreadsheet"}]'::text,
   '2026-09-18 07:30:00+00'::timestamptz),

  ('abhisheknd267@gmail.com'::text,
   'Company Formation & Performance'::text,
   'https://drive.google.com/drive/folders/1z7XZ_MTliaChgNtyYTTo6wu3kMaCMLKS'::text,
   '[{"url":"https://drive.google.com/file/d/1GQqan2t_Rk4MSWxdzYZ2436baZaqpSTJ/view","name":"P03KU24M015033 ABHISHEK ND MARKETING.xlsx","size":267289,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}]'::text,
   '2026-09-18 08:00:00+00'::timestamptz),

  ('cchaithran698@gmail.com'::text,
   'Company Formation & Performance'::text,
   'https://drive.google.com/drive/folders/1z7XZ_MTliaChgNtyYTTo6wu3kMaCMLKS'::text,
   '[{"url":"https://drive.google.com/file/d/1nVhGS9YH5FY__KYo2WL-MvZ2mUj9k4wx/view","name":"P03KU24MO15049_ CHAITHRA N _Marketing_Assignment 2.xlsx","size":39986,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}]'::text,
   '2026-09-18 08:30:00+00'::timestamptz),

  -- Batch 6: Next 10 students (Marketing & HR Assessments)
  ('lohithks2003@gmail.com'::text,
   'Company Formation & Performance'::text,
   'https://drive.google.com/drive/folders/1z7XZ_MTliaChgNtyYTTo6wu3kMaCMLKS'::text,
   '[{"url":"https://drive.google.com/file/d/1frpMnWanp8tJpL-IQY-rob38Vl4Ri4_K/view","name":"P03KU14M015059_LOHITH K S_MARKETING_ASSESSMENT.xlsx","size":45050,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}]'::text,
   '2026-09-18 09:00:00+00'::timestamptz),

  ('rajeshin2003@gmail.com'::text,
   'Company Formation & Performance'::text,
   'https://drive.google.com/drive/folders/1z7XZ_MTliaChgNtyYTTo6wu3kMaCMLKS'::text,
   '[{"url":"https://drive.google.com/file/d/11lSlRxVfBKfbC_rPDKaLkS5sw8hL7kzS/view","name":"P03KU24M015056 RAJESH I N MARKETING ASSESSMENT ","size":43335,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}]'::text,
   '2026-09-18 09:30:00+00'::timestamptz),

  ('chaithanyatr24@gmail.com'::text,
   'Company Formation & Performance'::text,
   'https://drive.google.com/drive/folders/1rnYjCS3Z-PVqwdFgtH4Ttdf4XgWiGlpi'::text,
   '[{"url":"https://drive.google.com/file/d/1mSoukwDjn_qSF7348zDy3Zspr-ub6AJk/view","name":"P03KU24M015052_CHAITHANYA TR_HR_Excel_Assignment.xlsx","size":29157,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}]'::text,
   '2026-09-18 10:00:00+00'::timestamptz),

  ('narayannarayan0726@gmail.com'::text,
   'Company Formation & Performance'::text,
   'https://drive.google.com/drive/folders/1rnYjCS3Z-PVqwdFgtH4Ttdf4XgWiGlpi'::text,
   '[{"url":"https://drive.google.com/file/d/1n6BWaEdkIsZsD8vH_2KUBlMXGLm08LcW/view","name":"P03KU24M015057_Chaithra.N_HR_EXCEL_ASSIGNMENT.xlsx","size":29152,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}]'::text,
   '2026-09-18 10:30:00+00'::timestamptz),

  ('jeevithadn47@gmail.com'::text,
   'Company Formation & Performance'::text,
   'https://drive.google.com/drive/folders/1rnYjCS3Z-PVqwdFgtH4Ttdf4XgWiGlpi'::text,
   '[{"url":"https://drive.google.com/file/d/1yhYNjn9ejVz_BIWkhlHYLG58v6xHbAXY/view","name":"P03KU24M015044 HR Jeevitha D N.xlsx","size":62855,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}]'::text,
   '2026-09-18 11:00:00+00'::timestamptz),

  ('harshaabhi56@gmail.com'::text,
   'Company Formation & Performance'::text,
   'https://drive.google.com/drive/folders/1rnYjCS3Z-PVqwdFgtH4Ttdf4XgWiGlpi'::text,
   '[{"url":"https://drive.google.com/file/d/12ESZAyae1CS11xRIGWmTrW7qKoPRgpRa/view","name":"P03KU24M015012_HARSHA_ MBA_Assesment.xlsx","size":23004,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}]'::text,
   '2026-09-18 11:30:00+00'::timestamptz),

  ('sanjanakumarmesthakumarmestha@gmail.com'::text,
   'Company Formation & Performance'::text,
   'https://drive.google.com/drive/folders/1rnYjCS3Z-PVqwdFgtH4Ttdf4XgWiGlpi'::text,
   '[{"url":"https://drive.google.com/file/d/1X3ch9-HZX-SdXTY_RwU4sgat6aRnPJZm/view","name":"MBA_HR_P03KU24M015071_Sanjana Kumar Mestha_Assignment.xlsx","size":54096,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}]'::text,
   '2026-09-18 12:00:00+00'::timestamptz),

  ('sumithasenthil0225@gmail.com'::text,
   'Company Formation & Performance'::text,
   'https://drive.google.com/drive/folders/1rnYjCS3Z-PVqwdFgtH4Ttdf4XgWiGlpi'::text,
   '[{"url":"https://drive.google.com/file/d/1lQoSozNqdplWnpnq9IG6yfvrxk6ewRkD/view","name":"MBA_HR_Excel _Assessment_ Sumitha_ P03KU24M015079.xlsx","size":57445,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}]'::text,
   '2026-09-18 12:30:00+00'::timestamptz),

  ('tejuteja082@gmail.com'::text,
   'Company Formation & Performance'::text,
   'https://drive.google.com/drive/folders/1rnYjCS3Z-PVqwdFgtH4Ttdf4XgWiGlpi'::text,
   '[{"url":"https://drive.google.com/file/d/1su54eHUBe2FJ4T1LGTf-6BqW0cwSfMWg/view","name":"P03KU24M015075 _MBA_HR_Excel_Assignment_Student Teja Babu K P.xlsx","size":21559,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}]'::text,
   '2026-09-18 13:00:00+00'::timestamptz),

  ('thanukrishna.am@gmail.com'::text,
   'Company Formation & Performance'::text,
   'https://drive.google.com/drive/folders/1rnYjCS3Z-PVqwdFgtH4Ttdf4XgWiGlpi'::text,
   '[{"url":"https://drive.google.com/file/d/1jDSfcAutcn9eZrGLbPcpSUnjmAwEm3OZ/view","name":"P03KU24M015051_THANUJA AM_HR_Excel_Assignment.xlsx","size":32366,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}]'::text,
   '2026-09-18 13:30:00+00'::timestamptz),

  -- Batch 7: Next 10 students (HR & Finance Assessments)
  ('varshajaishankar06@gmail.com'::text,
   'Company Formation & Performance'::text,
   'https://drive.google.com/drive/folders/1rnYjCS3Z-PVqwdFgtH4Ttdf4XgWiGlpi'::text,
   '[{"url":"https://drive.google.com/file/d/1hOst7dpTx_BzRylgoF-ybcvc110FBFyV/view","name":"P03KU24M015026 _Varsha.J_ HR_Assessment.xlsx","size":52082,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}]'::text,
   '2026-09-18 14:00:00+00'::timestamptz),

  ('varshinivarshanb@gmail.com'::text,
   'Company Formation & Performance'::text,
   'https://drive.google.com/drive/folders/1rnYjCS3Z-PVqwdFgtH4Ttdf4XgWiGlpi'::text,
   '[{"url":"https://drive.google.com/file/d/1nQHGCQ_pGrSdNNMUVFF2C9I9ZHYqur26/view","name":"P03KU24M015050 Varshini NB MBA ASSESSMENT EXCEL.xlsx","size":21932,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}]'::text,
   '2026-09-18 14:30:00+00'::timestamptz),

  ('sunanda.anusha@gmail.com'::text,
   'Company Formation & Performance'::text,
   'https://drive.google.com/drive/folders/1bAxACCIu_R6fdGPu_Ub3zhxJtgUhQcCI'::text,
   '[{"url":"https://drive.google.com/file/d/1Ug5v-oA4f8QnLQabKSwGWK039HPAPLTL/view","name":"Anusha (P03KU24M015018)Finance.xlsx","size":42408,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}]'::text,
   '2026-09-18 15:00:00+00'::timestamptz),

  ('bhavyamt2907@gmail.com'::text,
   'Company Formation & Performance'::text,
   'https://drive.google.com/drive/folders/1bAxACCIu_R6fdGPu_Ub3zhxJtgUhQcCI'::text,
   '[{"url":"https://drive.google.com/file/d/1UNPHQ7lvDmef7vLF18s7VRE2ZfmUPy8o/view","name":"bhavyamt.xlsx","size":108012,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"},{"url":"https://drive.google.com/file/d/1f6_pij2sqCNhXcL_1BnFXZ1GLyxfjOIR/view","name":"P03KU24M015084_BHAVYAMT_FIN_PREASSESSMENT1.xlsx","size":45264,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}]'::text,
   '2026-09-18 15:30:00+00'::timestamptz),

  ('chandanaks547@gmail.com'::text,
   'Company Formation & Performance'::text,
   'https://drive.google.com/drive/folders/1bAxACCIu_R6fdGPu_Ub3zhxJtgUhQcCI'::text,
   '[{"url":"https://drive.google.com/file/d/1gqvF-xIR7JdvnEJpJ2LNBLKhyQoFcm5p/view","name":"P03KU24M015005_CHANDANA_FINANCE_MBA_Finance_Excel_Assignment.xlsx","size":35634,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}]'::text,
   '2026-09-18 16:00:00+00'::timestamptz),

  ('gowdachethu83@gmail.com'::text,
   'Company Formation & Performance'::text,
   'https://drive.google.com/drive/folders/1bAxACCIu_R6fdGPu_Ub3zhxJtgUhQcCI'::text,
   '[{"url":"https://drive.google.com/file/d/1UPXLWi3XmSRiN3J_0iyLmeTAlw0zK1-T/view","name":"P03KU24M015022_Chethan G_FIN_Assesment.xlsx","size":50436,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}]'::text,
   '2026-09-18 16:30:00+00'::timestamptz),

  ('hemanthsj2003@gmail.com'::text,
   'Company Formation & Performance'::text,
   'https://drive.google.com/drive/folders/1bAxACCIu_R6fdGPu_Ub3zhxJtgUhQcCI'::text,
   '[{"url":"https://drive.google.com/file/d/1yvuVrxhAgO8euaelGSELsJ_WJQ0rHCsC/view","name":"P03KU24M015065 HEMANTH SJ (finance and marketing) assessment.xlsx","size":60807,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}]'::text,
   '2026-09-18 17:00:00+00'::timestamptz),

  ('m.jayashree352@gmail.com'::text,
   'Company Formation & Performance'::text,
   'https://drive.google.com/drive/folders/1bAxACCIu_R6fdGPu_Ub3zhxJtgUhQcCI'::text,
   '[{"url":"https://drive.google.com/file/d/1Bg5XPHAJuCpAyAkNxHcCZp__Tuc1A1WF/view","name":"P03KU24M015004, Jayashree M FINANCE.xlsx","size":34895,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}]'::text,
   '2026-09-18 17:30:00+00'::timestamptz),

  ('jhenkaragowda212@gmail.com'::text,
   'Company Formation & Performance'::text,
   'https://drive.google.com/drive/folders/1bAxACCIu_R6fdGPu_Ub3zhxJtgUhQcCI'::text,
   '[{"url":"https://drive.google.com/file/d/1AlOuPYQrwMWQogx20P4XEHVyzqw5zYuD/view","name":"P03KU24M015053_ JHENKAR A GOWDA _FINANCE_ EXCEL ASSEMENT.xlsx","size":43507,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}]'::text,
   '2026-09-18 18:00:00+00'::timestamptz),

  ('rajeshwarihiremath521@gmail.com'::text,
   'Company Formation & Performance'::text,
   'https://drive.google.com/drive/folders/1bAxACCIu_R6fdGPu_Ub3zhxJtgUhQcCI'::text,
   '[{"url":"https://drive.google.com/file/d/15R9XN4LJlON6tT37XOzCV1AvfuufQaHE/view","name":"P03KU24M015024_Rajeshwari Hiremath_FIN_Assesment.xlsx","size":50436,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"},{"url":"https://drive.google.com/file/d/1bV1lapI06u7uMhpAEHYri3ozMz075dhb/view","name":"P03KU24M015024_RajeshwariHiremath_FIN_Assesment.xlsx","size":50270,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}]'::text,
   '2026-09-18 18:30:00+00'::timestamptz),

  -- Batch 8: Next 10 students (Finance, BA & Marketing Assessments)
  ('santhoshgowda2102@gmail.com'::text,
   'Company Formation & Performance'::text,
   'https://drive.google.com/drive/folders/1bAxACCIu_R6fdGPu_Ub3zhxJtgUhQcCI'::text,
   '[{"url":"https://drive.google.com/file/d/1ljCu6TwmdrBMDrKbHZuQEeyB4JRihUc2/view","name":"Santhosh C P P03KU24M015058 MBA_Finance_Excel_Assignment.xlsx","size":32880,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}]'::text,
   '2026-09-18 19:00:00+00'::timestamptz),

  ('shobithar91@gmail.com'::text,
   'Company Formation & Performance'::text,
   'https://drive.google.com/drive/folders/1bAxACCIu_R6fdGPu_Ub3zhxJtgUhQcCI'::text,
   '[{"url":"https://drive.google.com/file/d/1kq6o-Lh176K2x6sjk6omCetHOsdI_SRJ/view","name":"Shobhitha R P03KU24M015042.xlsx","size":38040,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}]'::text,
   '2026-09-18 19:30:00+00'::timestamptz),

  ('sinchana2393@gmail.com'::text,
   'Company Formation & Performance'::text,
   'https://drive.google.com/drive/folders/1bAxACCIu_R6fdGPu_Ub3zhxJtgUhQcCI'::text,
   '[{"url":"https://drive.google.com/file/d/1N6NDOw5mCUqxR1dSF22KFT12yf5bjJcS/view","name":"Sinchana_MBA_Finance_Excel_Assignment_Student (1).xlsx","size":22641,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}]'::text,
   '2026-09-18 20:00:00+00'::timestamptz),

  ('vinodvinu3123@gmail.com'::text,
   'Company Formation & Performance'::text,
   'https://drive.google.com/drive/folders/1bAxACCIu_R6fdGPu_Ub3zhxJtgUhQcCI'::text,
   '[{"url":"https://drive.google.com/file/d/148ovZPU5g7Rk7PehbpgC1_8HueNZK4nL/view","name":"P03KU24M015054_Vinod h a_FIN_PREASSESSMENT1.xlsx","size":31571,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}]'::text,
   '2026-09-18 20:30:00+00'::timestamptz),

  ('yamunamanjunath123@gmail.com'::text,
   'Company Formation & Performance'::text,
   'https://drive.google.com/drive/folders/1bAxACCIu_R6fdGPu_Ub3zhxJtgUhQcCI'::text,
   '[{"url":"https://drive.google.com/file/d/1luFf6zB6VCYpViyNAgQvCnv4HKyOdaOu/view","name":"P03KU24M015007,Yamuna, FINANCE.xlsx","size":42424,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}]'::text,
   '2026-09-18 21:00:00+00'::timestamptz),

  ('bhumikabharath252@gmail.com'::text,
   'Company Formation & Performance'::text,
   'https://drive.google.com/drive/folders/1TyKCDBN1rxzDpjawIXQjN-KObyKUuwlb'::text,
   '[{"url":"https://drive.google.com/file/d/1CEa3Rk5xMBkjH8pqAZHolvCM5swd9JDw/view","name":"P03KU24M015011_Bhumika_H_BA_asessment.xlsx","size":45981,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}]'::text,
   '2026-09-18 21:30:00+00'::timestamptz),

  ('smmamatha910@gmail.com'::text,
   'Company Formation & Performance'::text,
   'https://drive.google.com/drive/folders/1TyKCDBN1rxzDpjawIXQjN-KObyKUuwlb'::text,
   '[{"url":"https://drive.google.com/file/d/1Zjpf-vlnu4aAcjvWT4JgL8H-B561-TXK/view","name":"Mamatha smP03KU24M015035.xlsx","size":183461,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}]'::text,
   '2026-09-18 22:00:00+00'::timestamptz),

  ('vaishnavigopinath03@gmail.com'::text,
   'Company Formation & Performance'::text,
   'https://drive.google.com/drive/folders/1TyKCDBN1rxzDpjawIXQjN-KObyKUuwlb'::text,
   '[{"url":"https://drive.google.com/file/d/1StCRJmSglNFPo67f7tkorSZJrJk3fIGU/view","name":"Vaishnavi G_P03KU24M015031.xlsx","size":71212,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}]'::text,
   '2026-09-18 22:30:00+00'::timestamptz),

  ('varshithahs626@gmail.com'::text,
   'Company Formation & Performance'::text,
   'https://drive.google.com/drive/folders/1TyKCDBN1rxzDpjawIXQjN-KObyKUuwlb'::text,
   '[{"url":"https://drive.google.com/file/d/1L05DXxwlnc-iO4XXo1JZIOR6je85BxyX/view","name":"Varshitha HS_P03KU24M015032.xlsx","size":60398,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}]'::text,
   '2026-09-18 23:00:00+00'::timestamptz),

  ('abhikdabhi@gmail.com'::text,
   'Company Formation & Performance'::text,
   'https://drive.google.com/drive/folders/1Q8Cp-aDc4ReO2DBl23XeGY-ROMBZIAtA'::text,
   '[{"url":"https://drive.google.com/file/d/1U55DjhhIWl0Mxv0-28HTSY8O9bnm4EVJ/view","name":"Abhishek kd. Marketing.xlsx","size":103577,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"},{"url":"https://docs.google.com/document/d/1eoWl3J45oJQWs9Us4iVqDwqY5z0thG_OUPjVg2JZtxQ/edit","name":"Abhishek kd ","size":16367,"type":"application/vnd.google-apps.document"}]'::text,
   '2026-09-18 23:30:00+00'::timestamptz),

  -- Batch 9: Next 10 students (Marketing & HR Assessments)
  ('gowdachethu83@gmail.com'::text,
   'Company Formation & Performance'::text,
   'https://drive.google.com/drive/folders/1Q8Cp-aDc4ReO2DBl23XeGY-ROMBZIAtA'::text,
   '[{"url":"https://drive.google.com/file/d/1lgzddy2Rb3WfOcgGjdik3TxipnHLWQCh/view","name":"chethan (Marketing).xlsx","size":98627,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}]'::text,
   '2026-09-19 09:00:00+00'::timestamptz),

  ('hemantahemanth79@gmail.com'::text,
   'Company Formation & Performance'::text,
   'https://drive.google.com/drive/folders/1Q8Cp-aDc4ReO2DBl23XeGY-ROMBZIAtA'::text,
   '[{"url":"https://drive.google.com/file/d/1EuS2bnT2EUjEe-pLd7MCtxfrpCb8EY1T/view","name":"marketing hemanth L G.xlsx","size":114766,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"},{"url":"https://docs.google.com/document/d/1kM_QxnAYdG7_61RqP8bPj3zYqCtt8VVWbRpxnHvhkcs/edit","name":"Hemanth L G","size":10555,"type":"application/vnd.google-apps.document"}]'::text,
   '2026-09-19 09:30:00+00'::timestamptz),

  ('lokeshloki3497@gmail.com'::text,
   'Company Formation & Performance'::text,
   'https://drive.google.com/drive/folders/1Q8Cp-aDc4ReO2DBl23XeGY-ROMBZIAtA'::text,
   '[{"url":"https://drive.google.com/file/d/1cGY12TSJSrphssFisc-sYGvDTQkk7bkV/view","name":"lokesh s gowda ( marketing).xlsx","size":98634,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"},{"url":"https://drive.google.com/file/d/1VRCDseXYBe8pylZYEAHS0eQ4zOMhG1Jv/view","name":"lokesh document.docx","size":24583,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"}]'::text,
   '2026-09-19 10:00:00+00'::timestamptz),

  ('ppavan50776@gmail.com'::text,
   'Company Formation & Performance'::text,
   'https://drive.google.com/drive/folders/1Q8Cp-aDc4ReO2DBl23XeGY-ROMBZIAtA'::text,
   '[{"url":"https://drive.google.com/file/d/1JBn5MG7DVOloxcyatX1ak8UlJJ8kmUVr/view","name":"pavan.xlsx","size":119440,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"},{"url":"https://docs.google.com/document/d/1DhboPI_djbySaQKDgUgvZYMqQLtCAeIZ2YcfFWikgBE/edit","name":"PAVAN KUMAR K L","size":7955,"type":"application/vnd.google-apps.document"}]'::text,
   '2026-09-19 10:30:00+00'::timestamptz),

  ('rakshithps4477@gmail.com'::text,
   'Company Formation & Performance'::text,
   'https://drive.google.com/drive/folders/1Q8Cp-aDc4ReO2DBl23XeGY-ROMBZIAtA'::text,
   '[{"url":"https://drive.google.com/file/d/1D8lTStvYSv58DNwrMuYnyLj2S9Xwiw3v/view","name":"Rakshith P S.xlsx","size":113711,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"},{"url":"https://docs.google.com/document/d/1DTPFYSYxilF2kZNd-dEGzj0mBUjmH4huuBN86zT58L4/edit","name":"Rakshith P S","size":13532,"type":"application/vnd.google-apps.document"}]'::text,
   '2026-09-19 11:00:00+00'::timestamptz),

  ('shivakumar07505@gmail.com'::text,
   'Company Formation & Performance'::text,
   'https://drive.google.com/drive/folders/1Q8Cp-aDc4ReO2DBl23XeGY-ROMBZIAtA'::text,
   '[{"url":"https://drive.google.com/file/d/16-OZWP4e9XXg4_2YKMtaeDvRRB5qC8o9/view","name":"Shivakumar.xlsx","size":103380,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}]'::text,
   '2026-09-19 11:30:00+00'::timestamptz),

  ('chaithanyatr24@gmail.com'::text,
   'Company Formation & Performance'::text,
   'https://drive.google.com/drive/folders/1sHPlV1JLDL2oJXbRFRL-nuOGJmNl0j4g'::text,
   '[{"url":"https://drive.google.com/file/d/1oSZgs184LcS3soi7-BdbcDLB61i56AJi/view","name":"CHAITHANYA T R Student Workbook.xlsx","size":93311,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"},{"url":"https://docs.google.com/document/d/1AU5UQLIFC2Q7Pix-_5mv8iGkIYCosuEBy0ZjvbiNPYY/edit","name":"Chaithanya T R ","size":17447,"type":"application/vnd.google-apps.document"}]'::text,
   '2026-09-19 12:00:00+00'::timestamptz),

  ('jeevithadn47@gmail.com'::text,
   'Company Formation & Performance'::text,
   'https://drive.google.com/drive/folders/1sHPlV1JLDL2oJXbRFRL-nuOGJmNl0j4g'::text,
   '[{"url":"https://docs.google.com/document/d/1Rz-zteHptn35mvECUw0msK3EruT1wsXpE57kHckHWJs/edit","name":"Jeevitha D N","size":11562,"type":"application/vnd.google-apps.document"}]'::text,
   '2026-09-19 12:30:00+00'::timestamptz),

  ('mgagana69@gmail.com'::text,
   'Company Formation & Performance'::text,
   'https://drive.google.com/drive/folders/1sHPlV1JLDL2oJXbRFRL-nuOGJmNl0j4g'::text,
   '[{"url":"https://drive.google.com/file/d/196wqg2UkIvSlKv5sdAbBRzCQvZbSawvW/view","name":"M Gagana.xlsx","size":88072,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"},{"url":"https://drive.google.com/file/d/1aYyQR_2z7a-mVjWjvzNZ80Zh0nQypuMx/view","name":"Gagana M 1.xlsx","size":88025,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}]'::text,
   '2026-09-19 13:00:00+00'::timestamptz),

  ('shwethag395@gmail.com'::text,
   'Company Formation & Performance'::text,
   'https://drive.google.com/drive/folders/1sHPlV1JLDL2oJXbRFRL-nuOGJmNl0j4g'::text,
   '[{"url":"https://drive.google.com/file/d/1MP1-YgpGSg0JkApBgkcfCaTFoZEiK2bt/view","name":"B Shwetha.xlsx","size":88159,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"},{"url":"https://drive.google.com/file/d/1_AT7OiGlKrAUJJD_1We0pg20Qa2apIZZ/view","name":"Shwetha ME.xlsx","size":88078,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}]'::text,
   '2026-09-19 13:30:00+00'::timestamptz),

  -- Batch 10: Next 10 students (HR & Finance Student Workbooks)
  ('sumithasenthil0225@gmail.com'::text,
   'Company Formation & Performance'::text,
   'https://drive.google.com/drive/folders/1sHPlV1JLDL2oJXbRFRL-nuOGJmNl0j4g'::text,
   '[{"url":"https://drive.google.com/file/d/1y-Ehyb-xc4XKZV5FQU1VtusoWewu-4b_/view","name":"Sumitha S- Student Workbook .xlsx","size":93643,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}]'::text,
   '2026-09-19 14:00:00+00'::timestamptz),

  ('tejuteja082@gmail.com'::text,
   'Company Formation & Performance'::text,
   'https://drive.google.com/drive/folders/1sHPlV1JLDL2oJXbRFRL-nuOGJmNl0j4g'::text,
   '[{"url":"https://drive.google.com/file/d/13dLTpyXUJs5UOqN9uCcb50Gc-B5Esp8m/view","name":"Teja Babu K P _Student workbook.xlsx","size":86980,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"},{"url":"https://docs.google.com/document/d/1nzkMbBV-HTM-5zJPA0CNJ5N49KVYzNqqYTRcDwBYhEQ/edit","name":"Teja Babu K P","size":19302,"type":"application/vnd.google-apps.document"}]'::text,
   '2026-09-19 14:30:00+00'::timestamptz),

  ('thanukrishna.am@gmail.com'::text,
   'Company Formation & Performance'::text,
   'https://drive.google.com/drive/folders/1sHPlV1JLDL2oJXbRFRL-nuOGJmNl0j4g'::text,
   '[{"url":"https://drive.google.com/file/d/1KPncRkLscBtzebcZsU9fbrQZrN_iRLot/view","name":"Thanuja A M Student workbook.xlsx","size":93485,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"},{"url":"https://docs.google.com/document/d/10pu5DoeLzNsX7mWSMzSCGVP079NfpoQSowfVg88AL-E/edit","name":"THANUJA A M","size":16813,"type":"application/vnd.google-apps.document"}]'::text,
   '2026-09-19 15:00:00+00'::timestamptz),

  ('varshajaishankar06@gmail.com'::text,
   'Company Formation & Performance'::text,
   'https://drive.google.com/drive/folders/1sHPlV1JLDL2oJXbRFRL-nuOGJmNl0j4g'::text,
   '[{"url":"https://drive.google.com/file/d/122SeyMYXaDZNKcAHALpVtj4XmaI0tkkl/view","name":"Varsha Dashboard Student workbook.xlsx","size":85024,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"},{"url":"https://drive.google.com/file/d/1dC4Ew5yHw1hzYMAVsREjekyjgUOmL7UN/view","name":"Varsha Student workbook.xlsx","size":84408,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"},{"url":"https://docs.google.com/document/d/1EYfVd5ygTcGBx-x3I9Qud2kTgxnmv-P-qS3KoNPmxv4/edit","name":"Varsha. J ","size":15897,"type":"application/vnd.google-apps.document"}]'::text,
   '2026-09-19 15:30:00+00'::timestamptz),

  ('varshinivarshanb@gmail.com'::text,
   'Company Formation & Performance'::text,
   'https://drive.google.com/drive/folders/1sHPlV1JLDL2oJXbRFRL-nuOGJmNl0j4g'::text,
   '[{"url":"https://drive.google.com/file/d/1HzW0A64gg3I2Wn6HXBdiuG5aTCNiCqM5/view","name":"varshini NB DASHBOARD.xlsx","size":86485,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}]'::text,
   '2026-09-19 16:00:00+00'::timestamptz),

  ('sunanda.anusha@gmail.com'::text,
   'Company Formation & Performance'::text,
   'https://drive.google.com/drive/folders/13ZB-k_5aFuBntIGVrjnodM26lo9uWCRY'::text,
   '[{"url":"https://drive.google.com/file/d/1hKz6yMOxgaTMHQf7Bll7WxkN6spzTlaC/view","name":"ANUSHA FINANCE workbook 01.xlsx","size":151876,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"},{"url":"https://drive.google.com/file/d/1nUeFfasiYVu9Fqb_hoMNXfoDDezapIyJ/view","name":"ANUSHA FINANCE workbook.xlsx","size":149400,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"},{"url":"https://drive.google.com/file/d/1sVfQJOL6nRqmynd4Tut_5tdlR-flh8Vk/view","name":"Anusha","size":3118693,"type":"application/vnd.oasis.opendocument.text"}]'::text,
   '2026-09-19 16:30:00+00'::timestamptz),

  ('bhavyamt2907@gmail.com'::text,
   'Company Formation & Performance'::text,
   'https://drive.google.com/drive/folders/13ZB-k_5aFuBntIGVrjnodM26lo9uWCRY'::text,
   '[{"url":"https://drive.google.com/file/d/16_w3M5iw_Q-GIhR_vZZhpOWiUepWAF66/view","name":"bhavyamt.xlsx","size":125313,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"},{"url":"https://drive.google.com/file/d/1v_SuZ95_mXVot9ZbmSHClsKCaLneNsd9/view","name":"bhavyamt pf","size":3114666,"type":"application/vnd.oasis.opendocument.text"}]'::text,
   '2026-09-19 17:00:00+00'::timestamptz),

  ('chandanaks547@gmail.com'::text,
   'Company Formation & Performance'::text,
   'https://drive.google.com/drive/folders/13ZB-k_5aFuBntIGVrjnodM26lo9uWCRY'::text,
   '[{"url":"https://drive.google.com/file/d/1xg2rEOEug-AtLwtmJpDUmmdYoao0_KPb/view","name":"Chandana.KS.xlsx","size":119752,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"},{"url":"https://docs.google.com/document/d/1ZccnLNGSKaxixyExbyamQI-wTt7wvp3Ur1iUV2ZCiS8/edit","name":"Chandana KS","size":22961,"type":"application/vnd.google-apps.document"}]'::text,
   '2026-09-19 17:30:00+00'::timestamptz),

  ('ddeekshith920@gmail.com'::text,
   'Company Formation & Performance'::text,
   'https://drive.google.com/drive/folders/13ZB-k_5aFuBntIGVrjnodM26lo9uWCRY'::text,
   '[{"url":"https://drive.google.com/file/d/1lOfP5nIPhK8062LcEoTdmXYqlmGhtTgD/view","name":"Deekshith .docx","size":6480,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"}]'::text,
   '2026-09-19 18:00:00+00'::timestamptz),

  ('hemanthsj2003@gmail.com'::text,
   'Company Formation & Performance'::text,
   'https://drive.google.com/drive/folders/13ZB-k_5aFuBntIGVrjnodM26lo9uWCRY'::text,
   '[{"url":"https://drive.google.com/file/d/15rHiOO5pWKjtT0y6pQIWGWHhrB0Va-FV/view","name":"Hemanth SJ.xlsx","size":108258,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}]'::text,
   '2026-09-19 18:30:00+00'::timestamptz),

  -- Batch 11: Next 10 students (Finance & BA Student Workbooks)
  ('m.jayashree352@gmail.com'::text,
   'Company Formation & Performance'::text,
   'https://drive.google.com/drive/folders/13ZB-k_5aFuBntIGVrjnodM26lo9uWCRY'::text,
   '[{"url":"https://drive.google.com/file/d/18vjJBcXpTyjebwkAuQfuKJPknXjKgHhF/view","name":"Jayashree..M.xlsx","size":173899,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"},{"url":"https://docs.google.com/document/d/1EyDlY7iABXYiQUhY6pbu394ccdS-HzD_KKMzL1rcqvU/edit","name":"Jayashree M","size":30933,"type":"application/vnd.google-apps.document"}]'::text,
   '2026-09-19 19:00:00+00'::timestamptz),

  ('jhenkaragowda212@gmail.com'::text,
   'Company Formation & Performance'::text,
   'https://drive.google.com/drive/folders/13ZB-k_5aFuBntIGVrjnodM26lo9uWCRY'::text,
   '[{"url":"https://drive.google.com/file/d/1ANrb7TSpdTxNmk_JSey0gwdWsgNlmh_H/view","name":"Student workbook of jhenkar excel.xlsx","size":114605,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"},{"url":"https://drive.google.com/file/d/1VbWVrmwtCRiO3FTKlJ4D3DRC9XFtZD4j/view","name":"Jhenkar (1).odt","size":3118031,"type":"application/vnd.oasis.opendocument.text"}]'::text,
   '2026-09-19 19:30:00+00'::timestamptz),

  ('ambujakhgowda@gmail.com'::text,
   'Company Formation & Performance'::text,
   'https://drive.google.com/drive/folders/13ZB-k_5aFuBntIGVrjnodM26lo9uWCRY'::text,
   '[{"url":"https://drive.google.com/file/d/1rEQZeYevzmKHhSVkmasdyRSFrWMXhtA9/view","name":"Ambuja K H 5008.docx","size":10491,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},{"url":"https://drive.google.com/file/d/1fj2vUeZDAGHbRIzEFi_NYijpVnhqzI_h/view","name":"Ambuja K H FINANCE-1.xlsx","size":91388,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"},{"url":"https://drive.google.com/file/d/1nmy4NADJqPlaptwkeG6STNJdaVPY4qcE/view","name":"Ambuja K H FINANCE.xlsx","size":134668,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"},{"url":"https://docs.google.com/document/d/136NDtb88eBJ0f0JaZkz14doDJ0PPDaenbGWshyNdA0Y/edit","name":"Ambuja K H","size":18946,"type":"application/vnd.google-apps.document"}]'::text,
   '2026-09-19 20:00:00+00'::timestamptz),

  ('rajeshwarihiremath521@gmail.com'::text,
   'Company Formation & Performance'::text,
   'https://drive.google.com/drive/folders/13ZB-k_5aFuBntIGVrjnodM26lo9uWCRY'::text,
   '[{"url":"https://drive.google.com/file/d/1DrY9TgN9dQgx2GyM3LYTU-g2U47t5mL1/view","name":"Rajeshwari Hiremath.xlsx","size":70234,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}]'::text,
   '2026-09-19 20:30:00+00'::timestamptz),

  ('rakshithamr68@gmail.com'::text,
   'Company Formation & Performance'::text,
   'https://drive.google.com/drive/folders/13ZB-k_5aFuBntIGVrjnodM26lo9uWCRY'::text,
   '[{"url":"https://drive.google.com/file/d/1lZEf8bzRxw0O55FSslksCUaxI_h3ombE/view","name":"Rakshitha M R.xlsx","size":136382,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}]'::text,
   '2026-09-19 21:00:00+00'::timestamptz),

  ('shobithar91@gmail.com'::text,
   'Company Formation & Performance'::text,
   'https://drive.google.com/drive/folders/13ZB-k_5aFuBntIGVrjnodM26lo9uWCRY'::text,
   '[{"url":"https://drive.google.com/file/d/1cQuMyL47PvpRHubqA09bpDPMKiDgeKWw/view","name":"Shobhitha R.xlsx","size":157875,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}]'::text,
   '2026-09-19 21:30:00+00'::timestamptz),

  ('kasarvidyashree@gmail.com'::text,
   'Company Formation & Performance'::text,
   'https://drive.google.com/drive/folders/13ZB-k_5aFuBntIGVrjnodM26lo9uWCRY'::text,
   '[{"url":"https://drive.google.com/file/d/1dLF15QvhBRU4qt9mDlAgThufgQ_5Lqm-/view","name":"Vidyashri HK.....xlsx","size":69116,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"},{"url":"https://drive.google.com/file/d/1dFp_3FkoAgsWy7fTiO8P5AOuxNJas-o6/view","name":"Vidyashri HK ","size":107358,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}]'::text,
   '2026-09-19 22:00:00+00'::timestamptz),

  ('vinodvinu3123@gmail.com'::text,
   'Company Formation & Performance'::text,
   'https://drive.google.com/drive/folders/13ZB-k_5aFuBntIGVrjnodM26lo9uWCRY'::text,
   '[{"url":"https://drive.google.com/file/d/1mFdRs45Sj2eHBUwFGjMR9mCpCqa1pUkr/view","name":"VINOD H A.xlsx","size":143320,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"},{"url":"https://drive.google.com/file/d/1OXnsj8_s8vbgERugYBibW-cQ2mnL9Cic/view","name":"Vinod H A .odt","size":3114756,"type":"application/vnd.oasis.opendocument.text"}]'::text,
   '2026-09-19 22:30:00+00'::timestamptz),

  ('yamunamanjunath123@gmail.com'::text,
   'Company Formation & Performance'::text,
   'https://drive.google.com/drive/folders/13ZB-k_5aFuBntIGVrjnodM26lo9uWCRY'::text,
   '[{"url":"https://drive.google.com/file/d/1DnGewq4L-o_kpeHcbTr7eEoK659sXTwr/view","name":"yamuna finance workbook.xlsx","size":171071,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"},{"url":"https://drive.google.com/file/d/18HhuCENHwticheNv8L4caHb13K_xhNT_/view","name":"yamuna","size":3119521,"type":"application/vnd.oasis.opendocument.text"}]'::text,
   '2026-09-19 23:00:00+00'::timestamptz),

  ('bhumikabharath252@gmail.com'::text,
   'Company Formation & Performance'::text,
   'https://drive.google.com/drive/folders/1ug5uvBj9R0Af_6SJJv69OkyLTZGHo5BA'::text,
   '[{"url":"https://drive.google.com/file/d/1IsZyxb7DavTpBk4phISXA398bMpqtZHY/view","name":"Student_workbook Bhumika H.xlsx","size":89392,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}]'::text,
   '2026-09-19 23:30:00+00'::timestamptz),

  -- Batch 12: Next 11 students (BA Student Workbooks)
  ('hariprasadnayak77280@gmail.com'::text,
   'Company Formation & Performance'::text,
   'https://drive.google.com/drive/folders/1ug5uvBj9R0Af_6SJJv69OkyLTZGHo5BA'::text,
   '[{"url":"https://drive.google.com/file/d/1g1UKoEGXsRkDoAMxGubrTuFcAhrSbaAC/view","name":"Hariprasad_Nayak pf file.docx","size":41359,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"}]'::text,
   '2026-09-20 09:00:00+00'::timestamptz),

  ('jeevithav01@gmail.com'::text,
   'Company Formation & Performance'::text,
   'https://drive.google.com/drive/folders/1ug5uvBj9R0Af_6SJJv69OkyLTZGHo5BA'::text,
   '[{"url":"https://drive.google.com/file/d/1kKN2vW56wOLbjl-XqbVGHTRim_bh1Vsr/view","name":"Jeevitha V.xlsx","size":109040,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"},{"url":"https://docs.google.com/document/d/1A6T7qeH6AR8ldL2qUO01toqFuSeKTtVAbqyzj2GJP6s/edit","name":"Jeevitha V","size":19165,"type":"application/vnd.google-apps.document"}]'::text,
   '2026-09-20 09:30:00+00'::timestamptz),

  ('kantharajurn17@gmail.com'::text,
   'Company Formation & Performance'::text,
   'https://drive.google.com/drive/folders/1ug5uvBj9R0Af_6SJJv69OkyLTZGHo5BA'::text,
   '[{"url":"https://drive.google.com/file/d/1pAnW-7sgRk4sXiY_kvtNRpKeCgd1EJmb/view","name":"Kantharaju R N.xlsx","size":97408,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}]'::text,
   '2026-09-20 10:00:00+00'::timestamptz),

  ('smmamatha910@gmail.com'::text,
   'Company Formation & Performance'::text,
   'https://drive.google.com/drive/folders/1ug5uvBj9R0Af_6SJJv69OkyLTZGHo5BA'::text,
   '[{"url":"https://drive.google.com/file/d/1smht85P7-_AL1oJEPQgYYog1GGlyLCNN/view","name":"MAMATHA sm.xlsx","size":95336,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"},{"url":"https://docs.google.com/document/d/17Xih_RhkCtGEy1yy_UqfZOIjjULiJOLbFwe9fNahPwc/edit","name":"Mamatha S M","size":18823,"type":"application/vnd.google-apps.document"}]'::text,
   '2026-09-20 10:30:00+00'::timestamptz),

  ('manjushreegowda778@gmail.com'::text,
   'Company Formation & Performance'::text,
   'https://drive.google.com/drive/folders/1ug5uvBj9R0Af_6SJJv69OkyLTZGHo5BA'::text,
   '[{"url":"https://drive.google.com/file/d/1cTWqNbNSXed_Ia6cvn0x8InfTCqOmtmq/view","name":" manjushree.xlsx","size":109762,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"},{"url":"https://docs.google.com/document/d/1jwnvhfIeaOsvoZBydAyUn-Lcuctzgt25DSlfEVqxNOI/edit","name":"Manjushree T N ","size":14831,"type":"application/vnd.google-apps.document"}]'::text,
   '2026-09-20 11:00:00+00'::timestamptz),

  ('nageshwari1922@gmail.com'::text,
   'Company Formation & Performance'::text,
   'https://drive.google.com/drive/folders/1ug5uvBj9R0Af_6SJJv69OkyLTZGHo5BA'::text,
   '[{"url":"https://drive.google.com/file/d/1bivBWNlKYRiiPPKZXxsjTutliMeM6MJB/view","name":"Nageshwari k.xlsx","size":93205,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"},{"url":"https://docs.google.com/document/d/1lxql9bQS-2AZOoINsCObXaTKsa_EACvyEsvvIcI92Hk/edit","name":"Nageshwari k","size":14893,"type":"application/vnd.google-apps.document"}]'::text,
   '2026-09-20 11:30:00+00'::timestamptz),

  ('roopeshgc2003@gmail.com'::text,
   'Company Formation & Performance'::text,
   'https://drive.google.com/drive/folders/1ug5uvBj9R0Af_6SJJv69OkyLTZGHo5BA'::text,
   '[{"url":"https://drive.google.com/file/d/1YqHe8g2et3s6hORRSbwgxtHUIG1cWmem/view","name":"Roopesh G C.docx","size":43153,"type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"}]'::text,
   '2026-09-20 12:00:00+00'::timestamptz),

  ('sahanaanandaiah@gmail.com'::text,
   'Company Formation & Performance'::text,
   'https://drive.google.com/drive/folders/1ug5uvBj9R0Af_6SJJv69OkyLTZGHo5BA'::text,
   '[{"url":"https://drive.google.com/file/d/12veQmr3lIOZkxxO6dpjLhKuXYPQJqPPZ/view","name":"Sahana A reg.xlsx","size":113613,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"},{"url":"https://docs.google.com/document/d/1WGqWUgsvuyPZNGoL1G4Y7g0KCD7Kv96b01yG-hoixU0/edit","name":"Sahana A","size":35897,"type":"application/vnd.google-apps.document"}]'::text,
   '2026-09-20 12:30:00+00'::timestamptz),

  ('vaishnavigopinath03@gmail.com'::text,
   'Company Formation & Performance'::text,
   'https://drive.google.com/drive/folders/1ug5uvBj9R0Af_6SJJv69OkyLTZGHo5BA'::text,
   '[{"url":"https://drive.google.com/file/d/1U6bX0Ghv2sLySzWYhvqp5W4mhKqZmQUC/view","name":"Vaishnavi G.xlsx","size":99021,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"},{"url":"https://docs.google.com/document/d/1K2vK43iRvzcCrcEsOloq9-3FfGtJgGHwbEmxDon85oU/edit","name":"Vaishnavi G","size":15817,"type":"application/vnd.google-apps.document"}]'::text,
   '2026-09-20 13:00:00+00'::timestamptz),

  ('varshithahs626@gmail.com'::text,
   'Company Formation & Performance'::text,
   'https://drive.google.com/drive/folders/1ug5uvBj9R0Af_6SJJv69OkyLTZGHo5BA'::text,
   '[{"url":"https://drive.google.com/file/d/16QXX8SwpvD9nv-8M6tGHpTKwPSdrUI9F/view","name":"Varshitha HS.xlsx","size":99441,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}]'::text,
   '2026-09-20 13:30:00+00'::timestamptz),

  ('yashaswinigowda601@gmail.com'::text,
   'Company Formation & Performance'::text,
   'https://drive.google.com/drive/folders/1ug5uvBj9R0Af_6SJJv69OkyLTZGHo5BA'::text,
   '[{"url":"https://drive.google.com/file/d/1_OIi80VWEk1bX8plRn6rY4ZKJlo3dDMP/view","name":"Yashaswini G final work book.xlsx","size":95340,"type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"},{"url":"https://docs.google.com/document/d/1-LYOJ_rxy8uTFgXQG7veuIAUr3zJ3qOw32z-49PVzPw/edit","name":"Yashaswini G","size":15336,"type":"application/vnd.google-apps.document"}]'::text,
   '2026-09-20 14:00:00+00'::timestamptz)
) AS v(email, task_title, url, files, submit_date)
JOIN public.users u ON lower(u.email) = lower(v.email) AND u.role = 'learner' AND u."isActive" = true
JOIN public.college_assignments ca ON ca.title = v.task_title AND ca.is_deleted = false
WHERE cla.learner_id = u.id 
  AND cla.assignment_id = ca.assignment_id
  AND cla.status IN ('todo', 'in-progress');  -- Only update if not already submitted

COMMIT;

-- Generated from:
--   Excel: C:\Users\Vishal\Downloads\Student Profile and Portfolio registartion.xlsx
--   Seed: supabase\seed\college
-- Sheet: Students registration
-- Purpose: update only learner_context.programName on the latest college assessment attempt.
-- Safe behavior: updates only the latest personal_assessment_attempts row per learner email.
-- Review first, then run in Supabase SQL Editor.

WITH specialization_updates (
  email,
  program_name
) AS (
  VALUES
    ('abhikdabhi@gmail.com', 'Master of Business Administration - Marketing and Finance'),
    ('abhisheknd267@gmail.com', 'Master of Business Administration - Marketing'),
    ('akhilapinky1012@gmail.com', 'Master of Computer Applications'),
    ('ambujakhgowda@gmail.com', 'Master of Business Administration - Finance'),
    ('bhavyamt2907@gmail.com', 'Master of Business Administration - Finance'),
    ('bhoomika19503@gmail.com', 'Master of Computer Applications'),
    ('bhumikabharath252@gmail.com', 'Master of Business Administration - Business Analytics'),
    ('cchaithran698@gmail.com', 'Master of Business Administration - Marketing'),
    ('chaithanyatr24@gmail.com', 'Master of Business Administration - HR'),
    ('chandanaks547@gmail.com', 'Master of Business Administration - Finance'),
    ('charuc250@gmail.com', 'Master of Business Administration'),
    ('chethuchethan781@gmail.com', 'Master of Business Administration - Marketing'),
    ('chettyleo19@gmail.com', 'Master of Computer Applications'),
    ('dakshdograg15@gmail.com', 'Master of Computer Applications'),
    ('ddeekshith920@gmail.com', 'Master of Business Administration - Finance'),
    ('gaganaks029@gmail.com', 'Master of Business Administration - HR'),
    ('gowdachethu83@gmail.com', 'Master of Business Administration - Finance and Business Analytics'),
    ('hamsangowda3@gmail.com', 'Master of Computer Applications'),
    ('hariprasadnayak77280@gmail.com', 'Master of Business Administration - Business Analytics'),
    ('harshaabhi56@gmail.com', 'Master of Business Administration - HR'),
    ('hcmanoj47@gmail.com', 'Master of Business Administration - Business Analytics'),
    ('hemantahemanth79@gmail.com', 'Master of Business Administration - Marketing'),
    ('hemanthgowdaa755@gmail.com', 'Master of Business Administration - Marketing and Finance'),
    ('hemanthsj2003@gmail.com', 'Master of Business Administration - Marketing and Finance'),
    ('hemu818hr@gmail.com', 'Master of Business Administration - Marketing and Finance'),
    ('jeevithadn47@gmail.com', 'Master of Business Administration - HR and Finance'),
    ('jeevithav01@gmail.com', 'Master of Business Administration - Business Analytics'),
    ('jhenkaragowda212@gmail.com', 'Master of Business Administration - Finance'),
    ('kantharajurn17@gmail.com', 'Master of Business Administration - Business Analytics'),
    ('kasarvidyashree@gmail.com', 'Master of Business Administration - Finance'),
    ('lavanya13142003@gmail.com', 'Master of Computer Applications'),
    ('lavlavanya6360@gmail.com', 'Master of Computer Applications'),
    ('likhib612@gmail.com', 'Master of Business Administration - HR'),
    ('lohithks2003@gmail.com', 'Master of Business Administration - Marketing'),
    ('lokeshloki3497@gmail.com', 'Master of Business Administration - Marketing'),
    ('m.jayashree352@gmail.com', 'Master of Business Administration - Finance'),
    ('manjushreegowda778@gmail.com', 'Master of Business Administration'),
    ('meghanamv347@gmail.com', 'Master of Computer Applications'),
    ('mgagana69@gmail.com', 'Master of Business Administration - HR and Finance'),
    ('nageshwari1922@gmail.com', 'Master of Business Administration'),
    ('nageshwarik219@gmail.com', 'Master of Business Administration - Business Analytics'),
    ('nalinagowda40@gmail.com', 'Master of Computer Applications'),
    ('narayannarayan0726@gmail.com', 'Master of Business Administration - HR'),
    ('nayanaks1233@gmail.com', 'Master of Computer Applications'),
    ('ppavan50559@gmail.com', 'Master of Business Administration - Marketing and Finance'),
    ('ppavan50776@gmail.com', 'Master of Business Administration'),
    ('pradeepgeetha09@gmail.com', 'Master of Computer Applications'),
    ('priyankaammu663@gmail.com', 'Master of Business Administration - Finance'),
    ('priyankapriyanka54295@gmail.com', 'Master of Business Administration - HR and Finance'),
    ('rajeshin2003@gmail.com', 'Master of Business Administration - Marketing'),
    ('rajeshwarihiremath521@gmail.com', 'Master of Business Administration - Finance'),
    ('rakshithamr68@gmail.com', 'Master of Business Administration'),
    ('rakshithps4477@gmail.com', 'Master of Business Administration - Marketing'),
    ('roopeshgc2003@gmail.com', 'Master of Business Administration - Business Analytics'),
    ('sahanaanandaiah@gmail.com', 'Master of Business Administration - Business Analytics'),
    ('sanjanakumarmesthakumarmestha@gmail.com', 'Master of Business Administration - HR and Business Analytics'),
    ('santhoshsanthu00121@gmail.com', 'Master of Business Administration - Finance'),
    ('sevanthi752@gmail.com', 'Master of Computer Applications'),
    ('shivaganesh2046@gmail.com', 'Master of Business Administration - Marketing'),
    ('shivakumar07505@gmail.com', 'Master of Business Administration - Marketing and Finance'),
    ('shobithar91@gmail.com', 'Master of Business Administration - HR and Finance'),
    ('shwethag395@gmail.com', 'Master of Business Administration - HR and Finance'),
    ('simrithasuresh31@gmail.com', 'Master of Business Administration - HR'),
    ('sinchana2393@gmail.com', 'Master of Business Administration - HR and Finance'),
    ('smmamatha910@gmail.com', 'Master of Business Administration - Business Analytics'),
    ('sumithasenthil0225@gmail.com', 'Master of Business Administration - HR'),
    ('sunanda.anusha@gmail.com', 'Master of Business Administration - Finance'),
    ('tejuteja082@gmail.com', 'Master of Business Administration - HR and Business Analytics'),
    ('thanukrishna.am@gmail.com', 'Master of Business Administration - HR'),
    ('vaishnavigopinath03@gmail.com', 'Master of Business Administration - Business Analytics'),
    ('varshajaishankar06@gmail.com', 'Master of Business Administration - HR and Finance'),
    ('varshinivarshanb@gmail.com', 'Master of Business Administration - HR'),
    ('varshithahs626@gmail.com', 'Master of Business Administration - Business Analytics'),
    ('varungb04@gmail.com', 'Master of Business Administration - Marketing and Finance'),
    ('vinodvinu3123@gmail.com', 'Master of Business Administration - HR and Finance'),
    ('yamunamanjunath123@gmail.com', 'Master of Business Administration - Finance'),
    ('yashaswinigowda601@gmail.com', 'Master of Business Administration - Business Analytics')
),
latest_attempt AS (
  SELECT DISTINCT ON (lower(l.email))
    paa.id,
    lower(l.email) AS email
  FROM personal_assessment_attempts paa
  JOIN learners l ON l.id = paa.learner_id
  JOIN specialization_updates su ON su.email = lower(l.email)
  WHERE lower(COALESCE(paa.stream_id, '')) IN ('mba', 'mca')
     OR lower(COALESCE(paa.learner_context->>'migrationSource', '')) = 'google_forms'
  ORDER BY lower(l.email), paa.started_at DESC NULLS LAST, paa.created_at DESC NULLS LAST
)
UPDATE personal_assessment_attempts paa
SET learner_context = jsonb_set(
    COALESCE(paa.learner_context, '{}'::jsonb),
    '{programName}',
    to_jsonb(su.program_name),
    true
  ),
  updated_at = now()
FROM latest_attempt la
JOIN specialization_updates su ON su.email = la.email
WHERE paa.id = la.id
RETURNING
  paa.id,
  su.email,
  paa.stream_id,
  paa.learner_context->>'programName' AS program_name,
  paa.learner_context->>'programCode' AS program_code,
  paa.learner_context->>'selectedStream' AS selected_stream;

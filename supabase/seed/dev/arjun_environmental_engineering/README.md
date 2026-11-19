# Arjun Srinivasan - college demo (development only)

Account: arjun.srinivasan27@example.com. Program: B.Tech in Chemical Engineering.
College: Kaveri Institute of Engineering. Third year, semester 5.

Apply the numbered SkillPassport SQL files in order to the SkillPassport database.
The existing SSO 00 account seed is separate and requires a separately supplied
bcrypt hash. Do not execute SkillPassport SQL against SSO or LTE.

The account user_id and learners.id can differ. Seeds 01, 04, 05, 06, 07 and 08
resolve the actual learner ID from the account user_id and email. Seed 03 resolves
it by email. Existing learner IDs and account passwords are retained.

Files:
- 01: learner, college, program and initial profile records.
- 02: assessment role catalog and existing-context dependencies.
- 03: completed assessment attempt and copied demonstration aptitude data.
- 04: assessment result.
- 05: full personal profile, 3 education records, 14 skills, 4 projects,
  4 certificates, 2 experience records, 4 trainings and 3 achievements.
- 06: role explanations.
- 07: summary.
- 08: final Chemical Engineering specialization and Track B roles.

The profile fixture is approved for local dashboard display. Verification flags
remain false; certificate records do not assert independently verified credentials.
These are synthetic demo records; the copied answers do not represent an actual
assessment administered to Arjun. No generated certificate files are supplied.

Assessment tracks:
- A: Water Quality Laboratory Assistant; Water Treatment Operations Assistant;
  Environmental Compliance Support Associate.
- B: Industrial Wastewater Treatment Engineer; Membrane Technology Engineer;
  Water Process Optimization Engineer.
- C: Environmental Monitoring Analyst; Compliance Support Officer; Field Technician.

SkillPassport role_family_roles.id is the assessment occupationId. LTE must mirror
that exact ID in roles.id to serve capabilities. LTE content is maintained in its
separate River Mission seeds; this package does not publish or import LTE content.

Corrected profile and assessment seeds were applied to the local database.
No production database writes or browser/login tests were performed.

Apply `09_role_salaries.sql` after the assessment and all role-alignment seeds. It adds sourced Indian annual salary ranges to all nine role options and mirrors them into gemini_results.careerFit. Per-role salaryEvidence records the source, experience band and pay basis; specialist titles use explicitly marked closest-role benchmarks. These are indicative ranges, including experienced-role benchmarks where noted, not guaranteed starting offers. Checked 18 November 2026. School and production records are excluded.

For Arjun's local Opportunities repair, apply sso-worker/supabase/seed/dev/arjun_environmental_engineering/10_job_matching_access.sql first, then this package's 10_job_matching_access.sql. These append ai_job_matching only to his existing active Premium subscription and its cache, preserving price and expiry. Apply 11_chemical_technical_skills.sql after the profile to add six beginner Chemical Engineering skills. The skill inserts avoid duplicate names and retain unverified status; approval is solely for local demo display. No login/API/browser tests or production database changes. Nested packages still require explicit execution until the reset workflow includes them.

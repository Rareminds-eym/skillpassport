# MBA River Mission demo learner

Development only. Rohan Iyer: rohan.iyer.mba@example.com; second-year Master of Business Administration (MBA), semester 3, Bengaluru Institute of Management.

Apply SkillPassport 01_learner.sql, 02_role_catalog.sql, 03_profile_details.sql, 04_assessment.sql and 08_college_affiliation.sql in order. Learner references resolve by account user_id and email, preserving a learner ID created during login. Role entities resolve by exact name; occupied codes/IDs for other names use stable local demo alternatives without overwriting shared catalog rows. The authored role profile fields are populated from the workbook profile object itself.

Profile: 3 education, 14 skills, 4 projects, 4 certificates, 2 experience entries, 4 trainings and 3 achievements. All are synthetic, unverified demonstration records. Assessment scores are authored fixtures; no administered test responses are claimed. The assessment seed restores its authored aptitude score after the insert trigger.

Track A: Water Project Finance & Procurement Associate; Environmental Data Analyst; Environmental Compliance Support Associate.
Track B: Water Treatment Operations Assistant; Water Resources / WASH Project Associate; Water Monitoring Technology Associate.
Track C: existing Business Analyst, Payment Operations Analyst and Workforce Planning Analyst contexts; empty LTE content is accepted for these roles.

Apply LTE supabase/seed/dev/seed_lte_river_mission_arjun_college.sql first for the shared published college catalog, then supabase/seed/dev/seed_lte_rohan_role_contexts.sql for Rohan's additional Track B contexts. The latter reuses existing capability and content IDs. Role capability counts for Tracks A/B: 8/9/11 and 11/10/11. Only direct workbook capability-to-level relationships are retained; some mapped capabilities do not own levels.

Local profile, assessment and LTE context repairs applied and verified through SQL on 18 November 2026. No login, API or browser tests performed. Production databases were not changed. Existing credentials were not changed.

Apply `10_role_salaries.sql` after the assessment and all role-alignment seeds. It adds sourced Indian annual salary ranges to all nine role options and mirrors them into gemini_results.careerFit. Per-role salaryEvidence records the source, experience band and pay basis; specialist titles use explicitly marked closest-role benchmarks. These are indicative ranges, including experienced-role benchmarks where noted, not guaranteed starting offers. Checked 18 November 2026. School and production records are excluded.
Apply `09_report_summary.sql` to update an existing report summary without resetting its assessment. The main 04 assessment seed also contains the revised summary.

Apply 11_track_alignment.sql to reorder an existing local MBA report after the summary/salary seeds. It preserves complete role objects and Track C while aligning Track A/B titles, descriptions and learning-track references.

For local Opportunities access, apply sso-worker/supabase/seed/dev/rohan_mba_river_mission/12_job_matching_access.sql first, then this package's 12_job_matching_access.sql. These append ai_job_matching only to Rohan's existing active Premium subscription and its cache, preserving expiry and pricing. Both grants were applied and verified through SQL; no browser/login/API tests were performed.

# Remote Database Seed Execution Audit Report (Post-Ingestion Verified)

**Date**: 2026-08-31  
**Project**: SkillPassport (`skillpassport`)  
**Target Remote Database**: Supabase Remote Production Instance (`dpooleduinyyzxgrcwko`)  
**Verification Method**: Live Read-Only SQL Query Validation via Supabase Management API  
**Total Seed Files Analyzed**: **175 files**

---

## 1. Executive Summary

| Category / Directory | Total Files | ✅ Executed & Active | ℹ Standalone / Superseded | ❌ Pending / Unexecuted | Execution Rate |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Top-Level Root Seed Files** (`seed/*.sql`) | 48 | **43** | **5** | **0** | **89.6% Active** (100% of pipeline) |
| **Individual Assessment Results** (`seed/assessment_result/*.sql`) | 63 | **63** | **0** | **0** | **100% Active** |
| **College Aptitude Sessions & Scores** (`seed/college/*.sql`) | 64 | **64** | **0** | **0** | **100% Active** |
| **Total Ingestion Pipeline** | **175** | **170** | **5** | **0** | **97.1% Active** |

> **Explanation of the 5 Standalone / Superseded Files**:
> 1. `seed_b2b_plans_cache.sql`: **Superseded** by `subscription_plan.sql` (which created the active 14-plan catalogue).
> 2. `sync_recruitment_plans.sql`: **Standalone** recruiter B2B plans (`b0000000-...`), separate from college pilot.
> 3. `seed_rbac_role_categories.sql`: **Standalone** SSO worker shadow categories (dynamically synced at runtime via `syncRolesShadow()`).
> 4. `seed_rbac_school_internal_roles.sql`: **Standalone** SSO worker internal roles shadow (dynamically synced at runtime).
> 5. `seed_lesson_resources_webinar_embed_urls.sql`: **Standalone** webinar video resource embed links.

---

## 2. Table-by-Table Remote Database Row Counts (Before vs After)

| Monitored Database Table | Baseline Count | Post-Ingestion Count | Delta | Status & Evidence |
| :--- | :---: | :---: | :---: | :--- |
| `personal_assessment_sections` | 18 | **21** | **+3** | ✅ `exposure_index`, `middle_eq_sq`, `middle_interest_discovery` active |
| `personal_assessment_questions` | 6,183 | **6,228** | **+45** | ✅ Exposure Index (15), EQ/SQ (18), Interest Discovery (12) active |
| `personal_assessment_streams` | 79 | **80** | **+1** | ✅ `mca` inserted, `mba` updated |
| `career_assessment_ai_questions` | 16 | **20** | **+4** | ✅ MBA & MCA Knowledge/Aptitude AI question sets active |
| `industries` | 0 | **41** | **+41** | ✅ Phase P1 Taxonomy active |
| `domains` | 0 | **461** | **+461** | ✅ Phase P2 Taxonomy active |
| `industry_domains` | 0 | **461** | **+461** | ✅ Phase P2 Industry-Domain mappings active |
| `role_families` | 0 | **693** | **+693** | ✅ Phase P3 Role Families active |
| `role_family_domains` | 0 | **769** | **+769** | ✅ Phase P3 Family-Domain mappings active |
| `role` | 0 | **1,922** | **+1,922** | ✅ Phase P4 Roles active |
| `role_family_roles` | 0 | **2,280** | **+2,280** | ✅ Phase P5 Batches 1–6 active |
| `embeddings` (type: `role`) | 0 | **2,280** | **+2,280** | ✅ Phase P9 Vector embeddings active |
| `organizations` | 38 | **40** | **+2** | ✅ Soundarya Institute of Management & Science active |
| `departments` | 11 | **13** | **+2** | ✅ Soundarya MBA & MCA departments active |
| `users` | 219 | **292** | **+73** | ✅ Soundarya student accounts created |
| `learners` | 176 | **248** | **+72** | ✅ Soundarya learner profiles created |
| `license_assignments` | 0 | **72** | **+72** | ✅ License assignments active for Soundarya org |
| `adaptive_aptitude_sessions` | 5 | **68** | **+63** | ✅ All 63 student aptitude sessions active |
| `adaptive_aptitude_responses` | 250 | **3,400** | **+3,150** | ✅ 63 × 50 questions = 3,150 responses recorded |
| `adaptive_aptitude_results` | 5 | **68** | **+63** | ✅ All 63 student adaptive aptitude results active |
| `personal_assessment_attempts` | 12 | **75** | **+63** | ✅ All 63 student attempts scored (MBA/MCA) |
| `personal_assessment_results` | 5 | **68** | **+63** | ✅ All 63 student final report records active (`completed`) |

---

## 3. Top-Level Root Seed Files (All 48 Files Individually Enumerated)

| # | File Name | Execution Status | Verified Remote DB Evidence |
| :---: | :--- | :---: | :--- |
| 1 | [`seed.sql`](file:///mnt/E230EB0F30EAEA0D/Rareminds/skill-echosystem/skillpassport/supabase/seed/seed.sql) | **Executed** | Baseline courses, questions, modules, lessons present. |
| 2 | [`seed_app_config.sql`](file:///mnt/E230EB0F30EAEA0D/Rareminds/skill-echosystem/skillpassport/supabase/seed/seed_app_config.sql) | **Executed** | `maintenance_mode = 'false'` in `app_config`. |
| 3 | [`seed_b2b_plans_cache.sql`](file:///mnt/E230EB0F30EAEA0D/Rareminds/skill-echosystem/skillpassport/supabase/seed/seed_b2b_plans_cache.sql) | **Superseded** | Superseded by `subscription_plan.sql` (14 active plans). |
| 4 | [`seed_big_five_text_question.sql`](file:///mnt/E230EB0F30EAEA0D/Rareminds/skill-echosystem/skillpassport/supabase/seed/seed_big_five_text_question.sql) | **Executed** | Big Five reflection question `f76e44c9...` present. |
| 5 | [`seed_career_assessment_ai_questions_rows.sql`](file:///mnt/E230EB0F30EAEA0D/Rareminds/skill-echosystem/skillpassport/supabase/seed/seed_career_assessment_ai_questions_rows.sql) | **Executed** | 4 MBA/MCA AI question sets active in `career_assessment_ai_questions`. |
| 6 | [`seed_course_ai_tools_for_teachers.sql`](file:///mnt/E230EB0F30EAEA0D/Rareminds/skill-echosystem/skillpassport/supabase/seed/seed_course_ai_tools_for_teachers.sql) | **Executed** | Course `AITT2026-02` present in `courses`. |
| 7 | [`seed_courses_part_01.sql`](file:///mnt/E230EB0F30EAEA0D/Rareminds/skill-echosystem/skillpassport/supabase/seed/seed_courses_part_01.sql) | **Executed** | 50/50 courses verified present in `courses`. |
| 8 | [`seed_courses_part_02.sql`](file:///mnt/E230EB0F30EAEA0D/Rareminds/skill-echosystem/skillpassport/supabase/seed/seed_courses_part_02.sql) | **Executed** | 50/50 courses verified present in `courses`. |
| 9 | [`seed_courses_part_03.sql`](file:///mnt/E230EB0F30EAEA0D/Rareminds/skill-echosystem/skillpassport/supabase/seed/seed_courses_part_03.sql) | **Executed** | 50/50 courses verified present in `courses`. |
| 10 | [`seed_courses_part_04.sql`](file:///mnt/E230EB0F30EAEA0D/Rareminds/skill-echosystem/skillpassport/supabase/seed/seed_courses_part_04.sql) | **Executed** | 50/50 courses verified present in `courses`. |
| 11 | [`seed_courses_part_05.sql`](file:///mnt/E230EB0F30EAEA0D/Rareminds/skill-echosystem/skillpassport/supabase/seed/seed_courses_part_05.sql) | **Executed** | 50/50 courses verified present in `courses`. |
| 12 | [`seed_courses_part_06.sql`](file:///mnt/E230EB0F30EAEA0D/Rareminds/skill-echosystem/skillpassport/supabase/seed/seed_courses_part_06.sql) | **Executed** | 50/50 courses verified present in `courses`. |
| 13 | [`seed_courses_part_07.sql`](file:///mnt/E230EB0F30EAEA0D/Rareminds/skill-echosystem/skillpassport/supabase/seed/seed_courses_part_07.sql) | **Executed** | 50/50 courses verified present in `courses`. |
| 14 | [`seed_courses_part_08.sql`](file:///mnt/E230EB0F30EAEA0D/Rareminds/skill-echosystem/skillpassport/supabase/seed/seed_courses_part_08.sql) | **Executed** | 50/50 courses verified present in `courses`. |
| 15 | [`seed_courses_part_09.sql`](file:///mnt/E230EB0F30EAEA0D/Rareminds/skill-echosystem/skillpassport/supabase/seed/seed_courses_part_09.sql) | **Executed** | 50/50 courses verified present in `courses`. |
| 16 | [`seed_courses_part_10.sql`](file:///mnt/E230EB0F30EAEA0D/Rareminds/skill-echosystem/skillpassport/supabase/seed/seed_courses_part_10.sql) | **Executed** | 35/35 courses verified present in `courses`. |
| 17 | [`seed_exposure_index_questions.sql`](file:///mnt/E230EB0F30EAEA0D/Rareminds/skill-echosystem/skillpassport/supabase/seed/seed_exposure_index_questions.sql) | **Executed** | Section `exposure_index` and 15 questions active. |
| 18 | [`seed_insert_mba_mca_assessment_streams.sql`](file:///mnt/E230EB0F30EAEA0D/Rareminds/skill-echosystem/skillpassport/supabase/seed/seed_insert_mba_mca_assessment_streams.sql) | **Executed** | Streams `mba` and `mca` active in `personal_assessment_streams`. |
| 19 | [`seed_lesson_resources_webinar_embed_urls.sql`](file:///mnt/E230EB0F30EAEA0D/Rareminds/skill-echosystem/skillpassport/supabase/seed/seed_lesson_resources_webinar_embed_urls.sql) | **Standalone** | Standalone webinar video embed links. |
| 20 | [`seed_middle_school_eq_sq.sql`](file:///mnt/E230EB0F30EAEA0D/Rareminds/skill-echosystem/skillpassport/supabase/seed/seed_middle_school_eq_sq.sql) | **Executed** | Section `middle_eq_sq` and 18 questions active. |
| 21 | [`seed_middle_school_interest_discovery.sql`](file:///mnt/E230EB0F30EAEA0D/Rareminds/skill-echosystem/skillpassport/supabase/seed/seed_middle_school_interest_discovery.sql) | **Executed** | Section `middle_interest_discovery` and 12 questions active. |
| 22 | [`seed_p1_industries.sql`](file:///mnt/E230EB0F30EAEA0D/Rareminds/skill-echosystem/skillpassport/supabase/seed/seed_p1_industries.sql) | **Executed** | 41 industries active in `industries`. |
| 23 | [`seed_p2_domains.sql`](file:///mnt/E230EB0F30EAEA0D/Rareminds/skill-echosystem/skillpassport/supabase/seed/seed_p2_domains.sql) | **Executed** | 461 domains active in `domains`. |
| 24 | [`seed_p2_industry_domains.sql`](file:///mnt/E230EB0F30EAEA0D/Rareminds/skill-echosystem/skillpassport/supabase/seed/seed_p2_industry_domains.sql) | **Executed** | 461 industry-domain mappings active in `industry_domains`. |
| 25 | [`seed_p3_role_families.sql`](file:///mnt/E230EB0F30EAEA0D/Rareminds/skill-echosystem/skillpassport/supabase/seed/seed_p3_role_families.sql) | **Executed** | 693 role families active in `role_families`. |
| 26 | [`seed_p3_role_family_domains.sql`](file:///mnt/E230EB0F30EAEA0D/Rareminds/skill-echosystem/skillpassport/supabase/seed/seed_p3_role_family_domains.sql) | **Executed** | 769 family-domain mappings active in `role_family_domains`. |
| 27 | [`seed_p4_role.sql`](file:///mnt/E230EB0F30EAEA0D/Rareminds/skill-echosystem/skillpassport/supabase/seed/seed_p4_role.sql) | **Executed** | 1,922 roles active in `role`. |
| 28 | [`seed_p5_role_family_roles_batch1.sql`](file:///mnt/E230EB0F30EAEA0D/Rareminds/skill-echosystem/skillpassport/supabase/seed/seed_p5_role_family_roles_batch1.sql) | **Executed** | Batch 1 contexts active in `role_family_roles`. |
| 29 | [`seed_p5_role_family_roles_batch2.sql`](file:///mnt/E230EB0F30EAEA0D/Rareminds/skill-echosystem/skillpassport/supabase/seed/seed_p5_role_family_roles_batch2.sql) | **Executed** | Batch 2 contexts active in `role_family_roles`. |
| 30 | [`seed_p5_role_family_roles_batch3.sql`](file:///mnt/E230EB0F30EAEA0D/Rareminds/skill-echosystem/skillpassport/supabase/seed/seed_p5_role_family_roles_batch3.sql) | **Executed** | Batch 3 contexts active in `role_family_roles`. |
| 31 | [`seed_p5_role_family_roles_batch4.sql`](file:///mnt/E230EB0F30EAEA0D/Rareminds/skill-echosystem/skillpassport/supabase/seed/seed_p5_role_family_roles_batch4.sql) | **Executed** | Batch 4 contexts active in `role_family_roles`. |
| 32 | [`seed_p5_role_family_roles_batch5.sql`](file:///mnt/E230EB0F30EAEA0D/Rareminds/skill-echosystem/skillpassport/supabase/seed/seed_p5_role_family_roles_batch5.sql) | **Executed** | Batch 5 contexts active in `role_family_roles`. |
| 33 | [`seed_p5_role_family_roles_batch6.sql`](file:///mnt/E230EB0F30EAEA0D/Rareminds/skill-echosystem/skillpassport/supabase/seed/seed_p5_role_family_roles_batch6.sql) | **Executed** | Batch 6 contexts active in `role_family_roles`. |
| 34 | [`seed_p9_role_embeddings_optimized.sql`](file:///mnt/E230EB0F30EAEA0D/Rareminds/skill-echosystem/skillpassport/supabase/seed/seed_p9_role_embeddings_optimized.sql) | **Executed** | 2,280 role vector embeddings active in `embeddings`. |
| 35 | [`seed_rbac_role_categories.sql`](file:///mnt/E230EB0F30EAEA0D/Rareminds/skill-echosystem/skillpassport/supabase/seed/seed_rbac_role_categories.sql) | **Standalone** | Managed dynamically by Cloudflare SSO shadow sync worker. |
| 36 | [`seed_rbac_school_internal_roles.sql`](file:///mnt/E230EB0F30EAEA0D/Rareminds/skill-echosystem/skillpassport/supabase/seed/seed_rbac_school_internal_roles.sql) | **Standalone** | Managed dynamically by Cloudflare SSO shadow sync worker. |
| 37 | [`seed_soundarya_college_enterprise.sql`](file:///mnt/E230EB0F30EAEA0D/Rareminds/skill-echosystem/skillpassport/supabase/seed/seed_soundarya_college_enterprise.sql) | **Executed** | Soundarya organization active in `organizations`. |
| 38 | [`seed_soundarya_learners.sql`](file:///mnt/E230EB0F30EAEA0D/Rareminds/skill-echosystem/skillpassport/supabase/seed/seed_soundarya_learners.sql) | **Executed** | 63 Soundarya student accounts active in `learners` and `users`. |
| 39 | [`seed_soundarya_mca_mba_departments.sql`](file:///mnt/E230EB0F30EAEA0D/Rareminds/skill-echosystem/skillpassport/supabase/seed/seed_soundarya_mca_mba_departments.sql) | **Executed** | MBA and MCA departments active in `departments`. |
| 40 | [`seed_soundarya_z_repair_learner_mapping.sql`](file:///mnt/E230EB0F30EAEA0D/Rareminds/skill-echosystem/skillpassport/supabase/seed/seed_soundarya_z_repair_learner_mapping.sql) | **Executed** | 72 license assignments active in `license_assignments`. |
| 41 | [`seed_webinar_july07.sql`](file:///mnt/E230EB0F30EAEA0D/Rareminds/skill-echosystem/skillpassport/supabase/seed/seed_webinar_july07.sql) | **Executed** | Course `HLPN2026-07` active in `courses`. |
| 42 | [`seed_webinar_june28.sql`](file:///mnt/E230EB0F30EAEA0D/Rareminds/skill-echosystem/skillpassport/supabase/seed/seed_webinar_june28.sql) | **Executed** | Course `AITT2026-28` active in `courses`. |
| 43 | [`seed_work_values_questions.sql`](file:///mnt/E230EB0F30EAEA0D/Rareminds/skill-echosystem/skillpassport/supabase/seed/seed_work_values_questions.sql) | **Executed** | Section `values` (24 questions) active in `personal_assessment_questions`. |
| 44 | [`subscription_plan.sql`](file:///mnt/E230EB0F30EAEA0D/Rareminds/skill-echosystem/skillpassport/supabase/seed/subscription_plan.sql) | **Executed** | 14 subscription catalogue plans active in `plans_cache`. |
| 45 | [`subscription_planupdated.sql`](file:///mnt/E230EB0F30EAEA0D/Rareminds/skill-echosystem/skillpassport/supabase/seed/subscription_planupdated.sql) | **Executed** | `subscription_cache` updated with `college_enterprise`. |
| 46 | [`sync_recruitment_plans.sql`](file:///mnt/E230EB0F30EAEA0D/Rareminds/skill-echosystem/skillpassport/supabase/seed/sync_recruitment_plans.sql) | **Standalone** | Standalone recruiter B2B plans (`b0000000-...`). |
| 47 | [`z_seed_course_default_image.sql`](file:///mnt/E230EB0F30EAEA0D/Rareminds/skill-echosystem/skillpassport/supabase/seed/z_seed_course_default_image.sql) | **Executed** | 836 courses updated with default thumbnail URL. |
| 48 | [`z_seed_course_demo.sql`](file:///mnt/E230EB0F30EAEA0D/Rareminds/skill-echosystem/skillpassport/supabase/seed/z_seed_course_demo.sql) | **Executed** | Demo courses active in `courses`. |

---

## 4. Subdirectories Status

- **`seed/college/*.sql` (64 files)**: ✅ **100% Executed (64 / 64)**
  - All 63 student sessions, 3,150 responses, and 63 attempts recorded.
  - `zz_update_scores.sql` completed: all 63 attempts have `aptitude_scores` and `knowledge_scores` populated.

- **`seed/assessment_result/*.sql` (63 files)**: ✅ **100% Executed (63 / 63)**
  - All 63 final assessment results committed with status `'completed'` and full analytics roadmaps.

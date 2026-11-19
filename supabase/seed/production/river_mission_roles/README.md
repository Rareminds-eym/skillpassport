# River Mission production role catalog

**All 17 real embeddings generated. No SQL executed against any database.**

## Scope

- Eight school roles selected by the LTE workbook role_capability_sequence (RMR-ROLE-01 through 08). Full assessment profiles come from the SkillPassport student-pathways workbook.
- Nine college roles from SkillPassport_River_Mission_Roles_Completed.xlsx.
- Required hierarchy only: industries, domains, role_families, industry_domains, role_family_domains, role, role_family_roles.
- No learner accounts, assessment results, LTE roles/capabilities/course content or course mappings. This package alone does not fix LTE content routing.

## Files and execution order

1. 01_school_roles.sql ? school role catalog and missing hierarchy dependencies.
2. 02_college_roles.sql ? college role catalog and missing hierarchy dependencies.
3. 03_role_embeddings.sql ? 17 real Gemini embeddings. Resolves actual production role-context IDs and validates profiles before insertion.
4. 04_verify_roles.sql ? read-only SELECT for context profiles and embedding presence/dimensions.

Execute each role file in the SkillPassport database. Each runs in its own transaction. Existing identities are resolved by code or name. Ambiguous identities raise an exception. Existing context IDs are retained; exact existing profiles are left unchanged. Different or inactive existing profiles raise an exception and roll back that file; review that conflict rather than overriding it blindly. New contexts use stable UUIDs. No existing role data is deleted.

Role contexts contain descriptions, evidence, RIASEC and rationale, degree eligibility, aptitude_profile, big_five_profile, work_values_profile, aptitude_assessment, big5_assessment and work_values_assessment. Source scores are role demands, not learner results.

## Embeddings

Configured application model: google/gemini-embedding-2-preview, 1536 dimensions, RETRIEVAL_DOCUMENT (search_document). Production query embeddings must use the same model; dimensions alone do not establish compatibility. Production configuration was not inspected.
The script reads the configured OpenRouter key without printing it, sends only these role documents, and writes actual vectors to 03_role_embeddings.sql. It never connects to or writes to Supabase. Embedding SQL resolves the actual production context ID and checks that the stored profile matches its input before writing entity_type=role embeddings.

## Included roles

| Group | Code | Role |
|---|---|---|
| School | RMR-ROLE-01 | Water Quality Tester |
| School | RMR-ROLE-02 | Water Cleaning Engineer |
| School | RMR-ROLE-03 | River Protection Expert |
| School | RMR-ROLE-04 | Rain & Flood Expert |
| School | RMR-ROLE-05 | Water Plant Operator |
| School | RMR-ROLE-06 | Water Safety Officer |
| School | RMR-ROLE-07 | Water Project Manager |
| School | RMR-ROLE-08 | Community Water Helper |
| College | WAT_RF01_DR01 | Water Quality Field Assistant |
| College | WAT_RF02_DR01 | Water Quality Laboratory Assistant |
| College | WAT_RF03_DR01 | Environmental Data Analyst |
| College | WAT_RF04_DR01 | Water Treatment Operations Assistant |
| College | WAT_RF05_DR01 | Environmental Compliance Support Associate |
| College | WAT_RF06_DR01 | Water Resources / WASH Project Associate |
| College | WAT_RF07_DR01 | Water Project Finance & Procurement Associate |
| College | WAT_RF08_DR01 | Water Monitoring Technology Associate |
| College | WAT_RF09_DR01 | Environmental Communication Associate |

Validation performed: source completeness, RIASEC, score ranges, all six JSON profiles, unique role codes and SQL table scope. No SQL execution, login or browser tests were performed.

## LTE role mapping package

The separate LTE production package is `lte/supabase/seed/production/river_mission_roles`. After importing the SkillPassport roles, run `05_export_lte_role_ids.sql` here to export their actual context UUIDs. Supply that JSON to the LTE seed as described in its README. This prevents assuming development or proposed UUIDs match production. LTE content linking remains a separate unresolved source-schema issue.

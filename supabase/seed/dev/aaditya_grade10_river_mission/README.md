# Grade 10 River Mission learner (development only)

Aaditya Raman (`aaditya.raman10@example.com`), Grade 10, section A, Cambridge School.
Recommended stream: Science - PCMB. Roll number 11423027 is a sample eight-digit
board-style number, not a CBSE-issued identity.

Track A uses the requested assessment roles:
- Water Plant Designer: RMR-ROLE-09.
- River Protection Planner: RMR-ROLE-15.
- Water Project Manager: RMR-ROLE-07, four workbook capabilities.

Water Plant Designer and River Protection Planner are existing SkillPassport
role contexts, but are absent from the current LTE workbook. Restoring their
assessment names/IDs does not create LTE capability or course mappings.

Track B: Agricultural Scientist, Food Technologist, Food Quality Analyst.
Track C: Forensic Scientist, Crime Lab Analyst.
Tracks B and C are local demonstration roles; this package does not invent LTE content for them.

For a new fixture, create the SSO/account records with the existing 00 and 01
seeds first. For an existing account, retain its current learner ID. The corrected
03 assessment and 08 profile seeds resolve that ID from user_id and email.
Apply SkillPassport 02, 03, 08, 12, then 13. Seed 12 adds the five exact school
workbook roles missing from the original nine-role demo catalog. Seed 13 resolves
the actual active role contexts and writes both specificOptions.occupationId and
clusters.occupationIds. It does not assume proposed UUIDs are installed IDs.

For job matching, apply SSO's 14_job_matching_access.sql first, then SkillPassport's
matching 14 file. These are local demo subscription grants; no billing changes.
The SSO 00 account template still requires a separately supplied bcrypt hash.

LTE roles.id must equal SkillPassport role_family_roles.id. Export the actual
school context IDs after loading the SkillPassport catalog, then regenerate via
lte_seed_py/excel_to_lte_seed.py --river-mission --reuse-verified-r2
--role-contexts <export.json>. Apply the generated school SQL to LTE only.
The local export cache is ignored at lte_seed_py/.temp/river-mission/
local-school-role-contexts.json. Production needs its own verified context export.

The current school workbook contains 26 capabilities, 5 levels, 21 modules,
126 six-E stages/decks and 21 workbook templates. Original IDs and direct foreign
keys are preserved. Role-mapped module capabilities have no direct level rows;
module metadata is not treated as a foreign-key relationship. The generated LTE
seeds publish all school/college levels, modules and e-content as requested.
Capability cards can appear without levels;
this does not mean those capabilities have playable courses.

Resources use the existing resources/capabilities/<code>/levels/<level>/modules-<n>/
R2 folder layout. No schema or application lookup changes are introduced.

Assessment scores and fit percentages are authored demo values, not an
administered assessment. Profile certificates are unverified school participation
records; no generated PDF, SVG or portfolio attachments are supplied.

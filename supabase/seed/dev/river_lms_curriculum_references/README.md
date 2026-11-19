# River LMS curriculum references (local only)

Apply 01_lms_river_courses.sql to SkillPassport, then 02_lte_curriculum_course_links.sql to LTE.
The school LTE package aaditya_grade10_river_mission (04 through 07) must be applied first for school links.
The existing college River package must exist for college foundation links.
This package preserves the exported course/module/lesson/resource IDs and imports only River courses.
Unknown staff/school IDs are not invented. Existing columns absent from the CSV are preserved on rerun.
Local approval is set to approved and classification is inferred from the course grade for catalog display.
Source course duration is retained; its unit was not included in the export.
This CSV has exactly 1,000 rows and may be truncated; it is not a complete production backup.
Quizzes, skills and resource binaries were not exported and are not synthesized.
Related course references are stored in modules_content.curriculum_reference.lms_courses.
Existing curriculum content is retained. Links use the configured SkillPassport frontend URL,
open /learner/courses/:courseId/learn in a new tab, and use the existing login/access flow.
College links are prerequisite/foundation school courses, not engineering qualification content.
Presentation resources retain their exported URLs; no LMS resource upload to R2 was performed.

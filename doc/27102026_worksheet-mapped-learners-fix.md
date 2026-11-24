# Worksheet assignments: mapped learners and generated content

Date: 27 October 2026.

- Organization selection removed. Server derives one active college/school from educator profiles plus active organization membership. Ambiguous or missing profiles fail closed.
- Eligible college learners require active organization membership and an active program mapped through program_sections.faculty_id, college_course_mappings.faculty_id or active external organization staff assignments. Program ownership is verified through its department's college. Section restrictions and date ranges on external staff mappings are honored. School recipients use educator class assignments for the current class academic year.
- The same mapping check runs in the publication transaction. Passing another organization ID or learner ID from the browser does not widen access. The old unscoped publication function is not callable by the service role.
- Removed the learner-content and private-answer textareas. The modal previews the generated student section read-only and submits only difficulty/recipient selections. The server retrieves authoritative saved content and answers, ignoring client content overrides.
- New generation instructions require explicit student/private boundaries and prohibit marking correct answers in student questions. Answer keys are stored only in ai_worksheet_solutions. Existing unstructured worksheets must be regenerated once; they are not automatically split using unsafe heading guesses.
- Publish enables after valid title, selected recipients, completed loading and review confirmation; it no longer requires manually filling one content textarea per difficulty.
- The local Soundarya educator mapping resolves to eight eligible learners in one program.

Migration: supabase/migrations/20261027090000_scope_ai_worksheet_recipients.sql. Applied locally; deploy it after the original worksheet migration in other environments. Do not reapply the old migration after this corrective migration, as its original function definition predates mapping enforcement.

Validation includes scoped API tests, generated-content separation tests, educator modal tests, generation regressions and rollback-only SQL tests for valid mapped publication, same-college unmapped rejection, transaction rollback and function privileges.

## Modal and learner loading correction

Worksheet readiness no longer controls learner loading. The learner picker calls its authenticated mapping endpoint independently, including when an old worksheet cannot be safely separated. Source reads for old worksheets return educator-only preview metadata plus assignmentReady=false and an explanatory warning; publication still rejects unsafe content. Actual source/network failures also leave the mapped learner list visible, with separate retry/error states.

The modal now has explicit compact typography, a responsive two-column preview/learner layout, searchable checkbox rows, difficulty counts, optional instruction/deadline fields and a fixed footer. Oversized global heading styles are overridden locally. Existing organization and mapping security rules remain in force.

## Existing worksheet publication correction

Previously generated fill-in-the-blank worksheets can now be prepared without regeneration when their saved configuration and question count match the numbered blank questions and a distinct Answer Key/Solutions section can be identified. The private section is excluded from student content. Inline answers, ambiguous formats, mismatched counts and malformed boundaries still block publication. All three difficulty sections in the current saved Time Management worksheet were verified against this parser without changing database records.

Learners selected in another difficulty are no longer disabled: clicking their checkbox in the current difficulty moves them there, preserving one assignment per learner. Review confirmation resets after recipient changes and enables when source preparation succeeds.

## Learner PDF downloads

Course Tutor assignments now show a Download PDF action per worksheet. The learner interface does not open worksheet content or a document preview and no longer offers Word exports in this flow. Clicking download first verifies the current learner/course assignment through the existing authenticated endpoint, then generates a PDF containing student questions and assignment instructions. Private solutions remain excluded. Failed authorization or PDF generation reports an error and permits retry; concurrent repeated clicks are blocked.

## Internal worksheet comments

Worksheet framing comments (STUDENT_WORKSHEET, PRIVATE_SOLUTIONS and END_WORKSHEET) are now removed at presentation boundaries in both tutor interfaces, clipboard copies, PDF rendering and shared Word parsing. Escaped or code-wrapped markers and partial streaming tokens are handled. Stored source content retains its delimiters, and server-side assignment splitting normalizes known quoted/escaped delimiters before checking their order and uniqueness. Generation instructions explicitly require literal comments without code fences. Ordinary code examples are preserved.

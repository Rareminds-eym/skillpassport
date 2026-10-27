# AI worksheet assignment implementation

Implemented 26 October 2026 in SkillPassport. The approved simplified schema supersedes the five-table proposal in the earlier plan.

## Implemented flow

1. Generate a new worksheet in the course AI Facilitator. Each selected difficulty retains its own completed content and the configured question count. Failed and stopped generations cannot be assigned.
2. A completed saved worksheet shows Assign beside Export. Existing conversations without difficulty metadata need regeneration.
3. Assign opens an accessible modal. Choose an organization from the authenticated educator's active memberships. Learner search is paginated and restricted to active members of that organization.
4. Select a difficulty, review its generated material, enter the learner-facing questions and private answer key separately, and choose recipients. Each learner may receive one difficulty per publication.
5. Review the recipient counts and confirm the questions do not contain private answers. Add instructions and an optional deadline. Publish creates all worksheets and recipients in one transaction with retry idempotency.
6. Learners open the course AI Tutor and click the small assignments icon beside History. A view inside the same tutor panel lists only worksheets assigned to that learner for the current course, matching the History navigation pattern. Each worksheet provides a direct Download PDF action; learner content is not displayed inline or in a preview modal. The back button returns to the tutor conversation. No AI worksheet section in My Class is rendered.

## Three new tables

- `ai_worksheet_sets`: one row per difficulty, with organization, educator, course/lesson, completed source message, reviewed content, generation configuration, instructions, deadline, publication status and timestamps. A generation_group_id groups the rows from one publication.
- `ai_worksheet_solutions`: private educator answer key, separated from student content.
- `ai_worksheet_recipients`: learner profile IDs, worksheet IDs, assigned timestamp and first-open timestamp.

The enum values are beginner/intermediate/advanced and draft/generating/ready/published/failed/stopped/archived. Current publication creates frozen published rows; no content update endpoint is exposed.

## API and authorization

Authenticated `POST /api/ai-tutor/worksheets` actions: source, learners, publish, list, open. Identity comes from withAuth. The server verifies the educator's stored role and active organization membership; the SQL transaction revalidates ownership, source variant and each learner's active membership. Learner list/open require an explicit courseId and filter by it server-side, check recipient ownership and current organization membership, exclude all solution data, and only return published worksheets.

Conversation list/detail reads now also filter by the signed-in owner's user ID so another user cannot read the original educator material containing answer keys. Conversation deletion verifies ownership before touching feedback.

## Local setup and validation

Migration: `supabase/migrations/20261026173000_ai_worksheet_assignments.sql`, applied to the local SkillPassport Docker database. It is repeat-safe and reloads the REST schema cache. Browser roles have no direct table privileges; authenticated Pages handlers use the service client.

The rollback-only integration script `supabase/tests/ai-worksheet-publication.sql` verifies atomic publication, idempotent retry, private solution separation, and rejection/rollback of cross-organization recipients. The actual local REST learner membership and recipient relationships were also verified.

## Scope and practical limits

- Learner-facing content and solutions are explicitly separated during educator review. Generation currently returns prose, so automatic question/answer extraction is not assumed safe. This version requires the educator to paste reviewed questions into the student-content field.
- Same-organization educator membership grants recipient selection in this flow. Class-only teaching restrictions are not added in this version. Learner search shows names and short IDs for disambiguation.
- Worksheets are delivered/read/downloaded, with no submission, automatic grading or completion claims. Existing class assignments remain separate.
- New tables are migrated locally only; other environments need the migration before rollout. No production deployment or Git push was performed.
- Repository-wide TypeScript checking reports existing errors across the application; focused tests and lint are the validation for this change. Browser interaction against a logged-in session has not been performed.

## Verification audit

The follow-up audit corrected export failure reporting, reset stale dialog recipients/approval on reopening, rejected reuse of a publication ID with changed content, and added learner list pagination (25 deliveries per page, filtering active organizations before pagination).

Validation: 41 focused tests across 11 test files passed. Production-file lint completed with zero errors; useExport retains six existing warnings. Local rollback-only SQL checks verify separate beginner/advanced recipients, exact retry idempotency, changed-request rejection, cross-organization rollback, private solution privileges and worksheet survival after chat deletion. The updated migration was applied to the local Docker database. These checks do not constitute a logged-in browser or visual PDF/Word layout review.

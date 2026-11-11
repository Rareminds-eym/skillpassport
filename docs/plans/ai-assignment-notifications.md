# AI assignment notifications

Implemented and applied to local SkillPassport on 11 November 2026. No remote deployment.

## Events

| Event | Recipient | Type |
| --- | --- | --- |
| Allocation inserted | Learner user ID | assignment_assigned |
| Allocation batch committed | Assigning educator | assignment_allocation_complete |
| Submission committed | Learner user ID | assignment_submission_received |
| Submission committed | Assigning educator | assignment_submitted |
| Result transitions to released | Learner user ID | assignment_evaluated |

Database triggers persist events atomically in `notifications`. Unique event keys prevent duplicate allocation, submission, and result alerts. Allocation summaries aggregate by assignment, educator, and transaction. Mirrored school/college tasks do not emit additional events. No educator result alert or historical backfill.

Added nullable metadata, event_key, and read_at columns to the existing table. The last column fixes the existing notification API's mark-read writes. Metadata holds navigation references, not submitted answers or marks.

The existing realtime queue publishes committed rows after allocation, submission, and evaluation retries. Delivery is best effort; visible clients also poll persisted notifications every 30 seconds. Repeated realtime events are deduplicated by notification ID.

## Files

- [Notification migration](../../supabase/migrations/20270219021500_ai_assignment_notifications.sql): columns, event-key index and transactional triggers.
- [Realtime helper](../../functions/api/ai-tutor/utils/assignment-notifications.ts): broadcasts committed notification rows without failing primary actions.
- [Allocation and evaluation retry handler](../../functions/api/ai-tutor/handlers/saved-materials.ts): invokes realtime delivery.
- [Submission handler](../../functions/api/ai-tutor/handlers/assignment-submission.ts): broadcasts submission and result events.
- [Notification hook](../../src/features/notifications/model/useNotifications.ts): typed references, deduplication and polling fallback.
- [Navigation helper](../../src/features/notifications/model/assignmentNotificationTarget.ts): validates IDs and constructs role-specific local routes.
- [Notification public API](../../src/features/notifications/index.ts): exports navigation helper.
- [Learner notification panel](../../src/widgets/learner-dashboard/ui/NotificationPanel.tsx): icons, course filters and assignment/result navigation.
- [Educator notification panel](../../src/features/educator/ui/NotificationPanel.tsx): assignment summaries, filters and open action.
- [AI panel](../../src/features/ai-tutor/ui/AITutorPanel.tsx): opens assignments from notification navigation.
- [Saved assignment workspace](../../src/features/ai-tutor/ui/SavedMaterialWorkspace.tsx): opens educator overview/detail and learner result dialogs.
- [Realtime helper tests](../../functions/api/ai-tutor/utils/__tests__/assignment-notifications.test.ts).
- [Navigation tests](../../src/features/notifications/model/__tests__/assignmentNotificationTarget.test.ts).
- [Notification hook tests](../../src/features/notifications/model/__tests__/useNotifications.test.ts).
- [Educator panel tests](../../src/features/educator/ui/__tests__/NotificationPanel.test.tsx).
- [Learner panel tests](../../src/widgets/learner-dashboard/ui/__tests__/NotificationPanel.test.tsx).
- [Workspace tests](../../src/features/ai-tutor/ui/__tests__/SavedMaterialWorkspace.test.tsx).
- [Database integration runner](../../scripts/test-saved-assignments-db.mjs): dedicated disposable database; verifies both school/college flows, five event types, batch counts, idempotency, failed/stale evaluations and actual auto-release RPC.

## Validation

- Focused Vitest suites passed, including handlers, full saved-assignment flow, realtime recovery, panels and direct result navigation.
- Isolated PostgreSQL integration tests passed.
- Local migration history records version 20270219021500; all three notification triggers exist.
- Before/after local counts preserved: 24 allocations, 2 submissions, 2 results, 63 notifications.
- Vite returned HTTP 200 for all four edited panels; git diff whitespace checks passed.
- Full application typecheck was stopped without completing; no clean full-project typecheck is claimed.
- Browser rendering and live authenticated multi-user delivery were not visually verified. No browser-control tool was available.

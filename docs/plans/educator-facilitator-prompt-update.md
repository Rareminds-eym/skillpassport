# Educator facilitator prompt update

Implemented locally on 17 November 2026 from the supplied functional specification and 12-system-prompt document. This phase adopts the six educator prompts only.

## Behavior

- PLAN owns lesson-plan generation, including both outline and final passes.
- CREATE owns worksheet generation and each selected difficulty variant.
- EXPLORE owns inquiry and discovery, including short guided discussion questions.
- ADAPT recommends support changes. Its chat output offers **Create worksheet from adjustments**, opening the existing worksheet settings card with an explicit removable brief.
- GUIDE reviews authorized selected submissions and existing evaluation evidence. It does not change scores or add a manual release requirement.
- SOLVE owns diagnostic questions, staged intervention and verification for a particular obstacle.

The prompt composer adds the common foundation and exactly one educator persona to each applicable generation request. Existing templates, selected settings, course retrieval and document protocols remain in use. Concrete generation tasks choose their operational owner even when the conversation's preferred persona is pinned differently. Selected submission guidance is always GUIDE.

Prompt version `educator-facilitators-2026-11-17-v1` participates in material request fingerprints. Previously saved artifacts remain accessible; new requests do not reuse materials produced under the previous prompt version.

The ordinary learner tutor prompt, assignment allocation, submission validation, evaluation, automatic release, notifications and exports are unchanged. Prompt selection now checks the existing exact educator-role category instead of a role substring. No database migration or content re-embedding is required.

## Files

- [Prompt registry](../../functions/api/ai-tutor/utils/facilitator-prompts.ts): shared foundation, six educator prompts, operation ownership and version. The document's feedback-approval language was adapted to the existing automatic-release service.
- [Conversation router](../../functions/api/ai-tutor/utils/teaching-conversation.ts): preserves persona identifiers, distinguishes support/review/inquiry from worksheet production, and resolves generation ownership.
- [Context composer](../../functions/api/ai-tutor/utils/course-context.ts): builds educator prompts around existing chat and task templates; learner prompt text remains unchanged.
- [Chat handler](../../functions/api/ai-tutor/handlers/ai-tutor-chat.ts): applies the composer to chat, worksheet variants, and both lesson-plan passes; keeps selected-submission guidance with GUIDE.
- [Material fingerprints](../../functions/api/ai-tutor/utils/saved-materials.ts): incorporates prompt version into cache identity.
- [Facilitator configuration](../../src/features/ai-tutor/config/facilitators.ts): responsibilities, starter prompts and ADAPT's recommendation action.
- [Tutor panel](../../src/features/ai-tutor/ui/AITutorPanel.tsx): preserves selection cards and adds the explicit, removable ADAPT-to-CREATE brief.
- [Prompt registry tests](../../functions/api/ai-tutor/utils/__tests__/facilitator-prompts.test.ts).
- [Routing tests](../../functions/api/ai-tutor/utils/__tests__/teaching-conversation.test.ts).
- [Prompt composition tests](../../functions/api/ai-tutor/utils/__tests__/teaching-level-prompts.test.ts).
- [Cache tests](../../functions/api/ai-tutor/utils/__tests__/saved-materials.test.ts).
- [Handler tests](../../functions/api/ai-tutor/handlers/__tests__/ai-tutor-chat.test.ts).
- [Panel tests](../../src/features/ai-tutor/ui/__tests__/AITutorPanel.test.tsx).

## Validation

Focused tests cover payload composition, educator/learner separation, selected settings, both lesson-plan passes, difficulty variants, GUIDE evidence, cache versions and explicit support handoff. Existing assignment/submission/evaluation and worksheet-card suites were also run.

The prompt registry and conversation router pass targeted TypeScript checks; the backend handler bundles successfully. Full-project typechecking is not claimed. Tests use mocked provider responses; live AI output quality and browser visuals were not verified. No browser-control tool was available, and the local Vite server was not running. No commit, push, deployment, database change or provider call was performed for this update.

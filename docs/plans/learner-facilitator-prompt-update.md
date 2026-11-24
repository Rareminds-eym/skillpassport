# Learner facilitator selector and prompts

## Issue
The six educator personas were available in the selector, but learners had a generic course tutor. The approved specification also defines six learner personas.

## Logic
Reuse the existing FacilitatorHub, role previews, hover menu, focus behavior and shared tokens. Learners see learner-specific descriptions, examples and suggested chat actions for PLAN, CREATE, EXPLORE, ADAPT, GUIDE and SOLVE. The panel header is consistently AI Facilitators. Existing educator worksheet and lesson-plan settings remain educator-only.

The client sends the selected mode on each chat turn and restores it from conversation messages. The backend validates the identifier and uses verified account roles to choose the separate learner prompt registry; selecting the same role identifier cannot select its educator prompt. Learner requests bypass educator material-command routing. Learner auto mode defaults to EXPLORE. Explicit educator generation configurations and educator submission evidence remain forbidden to learners. Course evidence retrieval keeps its existing authorization checks.

GUIDE currently explains feedback supplied in the chat; it does not fetch saved released results. This limit is stated in the prompt, role description and starter. Practice is informal chat content, not an official assigned worksheet. No new tools or automatic handoffs are claimed.

## Files
- [Learner system prompts](../../functions/api/ai-tutor/utils/learner-facilitator-prompts.ts): six approved learner prompts and learner access foundation.
- [Course prompt composition](../../functions/api/ai-tutor/utils/course-context.ts): selects the learner registry for non-educator chat.
- [Chat handler](../../functions/api/ai-tutor/handlers/ai-tutor-chat.ts): separates learner routing, preserves educator authorization and saves persona metadata.
- [Role configuration](../../src/features/ai-tutor/config/facilitators.ts): learner descriptions, examples and chat starters.
- [Shared hub](../../src/features/ai-tutor/ui/FacilitatorHub.tsx): accepts audience and roles while reusing the existing design.
- [Tutor panel](../../src/features/ai-tutor/ui/AITutorPanel.tsx): learner role entry points, preview actions and educator-only generation buttons.
- [Chat state](../../src/features/ai-tutor/model/useTutorChat.ts): sends learner mode on initial and edited messages.
- [Prompt tests](../../functions/api/ai-tutor/utils/__tests__/learner-facilitator-prompts.test.ts): all six learner prompts, authorized context and access foundation.
- [Handler tests](../../functions/api/ai-tutor/handlers/__tests__/ai-tutor-chat.test.ts): all six learner roles, educator evidence denial and educator regressions.
- [Panel tests](../../src/features/ai-tutor/ui/__tests__/AITutorPanel.test.tsx): learner selection and hidden educator generation controls.
- [Hub tests](../../src/features/ai-tutor/ui/__tests__/FacilitatorHub.test.tsx): shared previews and learner-specific actions.
- [State tests](../../src/features/ai-tutor/model/__tests__/useTutorChat.test.ts): sends learner selection, restores persona and resets new conversations.

## Validation
The six-suite regression run passed 97 tests. Additional all-role preview and learner conversation-restoration checks passed 26 tests (including overlapping reruns). The learner prompt module TypeScript check, backend bundle and git diff whitespace check passed. Full application typechecking was stopped after several minutes without producing output; a full-project typecheck pass is not claimed. No live model calls or desktop/mobile browser visual review were performed; browser tools are unavailable. No database migration, deployment or data change is required. Existing uncommitted educator prompt work was preserved.

## Animated learner welcome
Learners also use the shared FacilitatorWelcome and TutorOrb animation, including pointer/caret following and the existing reduced-motion CSS. Plan, Create, Guide and Solve welcome shortcuts prepare learner chat prompts; the shared selector still exposes all six roles.
- [Shared welcome](../../src/features/ai-tutor/ui/FacilitatorWelcome.tsx): learner copy with the existing animated orb and layout.
- [Panel integration](../../src/features/ai-tutor/ui/AITutorPanel.tsx): shared welcome for both audiences and role-specific actions.
- [Panel regression tests](../../src/features/ai-tutor/ui/__tests__/AITutorPanel.test.tsx): animated learner welcome, selector access and four chat-only shortcuts.
Browser visual verification remains unavailable.

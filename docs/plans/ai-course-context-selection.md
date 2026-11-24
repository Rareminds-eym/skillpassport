# Request-based course evidence

## Scope
Course knowledge comes exclusively from current ready AI analysis records and their chunks. Course hierarchy supplies names, ordering and authorization only. Persona, conversation and verified submission evidence remain separate.

## Implementation
1. Resolve task and lesson/course scope from explicit scope, current request and recent user turns. Full summaries and broad generation use coverage; focused questions use semantic relevance.
2. Authorize before reading evidence. Rank targeted candidates with query context, diversify selected passages and add neighboring chunks from the same current analysis.
3. For coverage, page through every scoped current source and chunk, report missing lesson/resource indexes, and synthesize all passages in bounded batches. Recursively combine batch notes without silently discarding later content. Oversized scopes fail explicitly rather than claiming complete coverage.
4. Reuse one evidence result across chat, worksheet variants and both lesson-plan passes. Preserve citations and extraction limitations. Abort/time out auxiliary model calls and reject truncated summaries.
5. Remove raw lesson/resource/video text from metadata context queries and prompts. Remove live resource enrichment from chat; retain the helper because the storage extraction API still calls it, and update its formatter tests. Remove two-chunks-per-lesson retrieval and first-character truncation.
6. Validate routing, end-of-document coverage, scope/access, neighboring chunks, missing indexes, cancellation, batching and existing generation/persona workflows. No live AI calls during verification.

## Operational limits
Coverage is bounded to 100 sources and 2000 chunks per request; larger requests must narrow scope. Budgeted evidence uses 24000-character map batches and 48000-character final evidence; summaries preserve source IDs but are lossy abstractions, not verbatim full-document context. Indexed evidence is always enabled. Missing ready sources are reported explicitly; no live extraction fallback is used.

## Validation results

Implemented locally. Initial regression run: 137 tests across 18 files passed. After refining topic selection and adding the neighboring-passage case: 44 tests across the changed context/chat suites passed. Backend handler bundling passed. Targeted TypeScript checking reports an existing `functions/lib/supabase.ts` PagesEnv typing error for `VITE_SUPABASE_ANON_KEY`; no new pipeline errors were reported. No live AI request or browser verification was performed. The indexing feature flag was removed; indexed evidence is always used. Deployment is still required for remote environments.

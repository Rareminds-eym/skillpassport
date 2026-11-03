# Course content indexing and retrieval

Current scope: indexing course resources, storing embeddings, and supplying retrieved evidence to the existing course chat. New material libraries, online submissions, grading and dashboards are deferred.

## Data flow

1. Run the local `course:index` script with a course UUID. The server-side importer discovers only that course's lessons and resources.
2. Existing extraction/chunking code processes lesson bodies, stored video transcripts, and supported files. The script imports the embedding-worker's existing provider code directly; no separate scheduled Worker or local Worker server is needed for indexing.
3. Gemini embedding-2-preview produces independent 1,536-dimensional document vectors. Complete source versions are activated atomically in Supabase.
4. Chat checks course access, generates a query vector through the existing embedding service, and retrieves course-scoped passages. GPT-4o mini receives those passages alongside conversation history and the facilitator persona. Saved citations appear under Course sources.
5. Resource edits invalidate stale evidence. Run the script again after changing course content. `--force` also rebuilds unchanged files and retries failed records. No automated background indexing or UI enqueue buttons remain.

## Exactly two new tables

- `course_resource_analysis`: source identity, fingerprint, extracted text, version, processing enum, model/dimensions, retry state, lease and error details.
- `course_content_chunks`: analysis reference, chunk number, text, source location and `vector(1536)` embedding.

The migration enables RLS and limits table/RPC access to the backend service role. Server authorization scopes retrieval to the requested course. Source-change triggers invalidate stale evidence; the local script creates replacement versions. Reprocessing handles files replaced at unchanged URLs.

## Supported sources and limits

- Lesson text and completed stored video transcripts are indexed directly.
- PDF extraction processes two pages per request, with a 100-page limit. PPTX and DOCX preserve extracted XML text and add model-derived visual evidence.
- Supported direct audio/video files use the existing bounded resource analyzer. A stored transcript is preferable: this does not add a full-length transcription service, private Drive/YouTube connectors, or legacy DOC/PPT conversion. Convert legacy files to DOCX/PPTX first.
- Downloads are limited to 20 MiB, allowlisted HTTPS hosts, and no redirects. Unreadable sources fail rather than silently becoming successful empty indexes. Model extraction is not a guarantee of complete transcription or visual accuracy.
- Retrieval uses exact course-scoped vector ranking in Supabase; Cloudflare AI Search and Vectorize are not used.

## Local setup and activation

No production migration or deployment has been performed. Apply `supabase/migrations/20261103090000_course_content_index.sql` in a staging Supabase database with pgvector in `extensions` first. This migration is still unshipped; it now uses a course-scoped claim RPC and backend-only import identity. If you previously applied its earlier development version, reset only your disposable test schema or prepare an explicit upgrade before using this version.

Inside `skillpassport/`, create `.env.course-index` (ignored by Git):

```dotenv
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-server-only-key
OPENROUTER_API_KEY=your-provider-key
AI_RESOURCE_ALLOWED_HOSTS=your-resource-host.example
# Optional: CLOUDFLARE_R2_PUBLIC_URL=https://your-resource-host.example
```

The sibling `embedding-worker/` repository must be present: the script reuses `src/providers.ts`. Credentials stay local and are never passed as CLI arguments. The script writes to the database selected by `SUPABASE_URL`, which may be remote even though the command runs on your PC.

```powershell
npm run course:index -- --course-id 810e01c6-d4ec-4ba0-86bf-5f9d43d564c2
# Optional: choose a different environment file or reprocess unchanged/failed sources
npm run course:index -- --course-id 810e01c6-d4ec-4ba0-86bf-5f9d43d564c2 --env-file .env.course-index --force
```

No educator/user ID is needed; this is a trusted service-role import. The script only claims the selected course. Unchanged ready sources are reused; failed or actively leased sources cause an incomplete exit instead of false success. The two tables retain extracted text, source references, processing status and vectors.

After a successful import, deploy Pages with its existing embedding service binding and set `COURSE_INDEX_ENABLED=true`. The checked-in default is false. The separate course-processing Worker has been removed. Existing embedding-worker remains necessary for chat query vectors.

Verification: local CLI argument/orchestration/provider tests, course-scoped database checks (`node scripts/test-course-ai-db.mjs` against the dedicated disposable test container), resource analysis and chat tests. No actual course has been imported because a target course/database was not supplied for execution.

## Deferred work checkpoint

The full pre-scope-reduction implementation is preserved in the Skillpassport stash named `course-ai-full-flow-checkpoint-before-indexing-only-2026-11-03`, commit `f433664417975b1fc960b62ca7a5715ed263d24e`. It includes the indexing checkpoint as well as deferred assessment work. Restore deferred files/hunks selectively after this flow is complete; blindly popping it would reapply older indexing versions. The embedding-worker changes remain active because they belong to this scope.

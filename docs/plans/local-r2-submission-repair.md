# Local R2 submission storage repair

## Issue
GUIDE could not read an existing submission because two development startup commands used different persistence directories and bucket names. `pages:dev` used `../sp-dash-2/.wrangler/state` and `skill-echosystem`, while `pages:start` used the default project-local directory and `R2_BUCKET` as its bucket name. The failing DOCX was present in the latter store, with 37,846 bytes, below the 5 MiB limit.

## Logic
Both Pages startup commands now explicitly use the existing `pages:dev` store and `R2_BUCKET=skill-echosystem`. This retains the current development runtime's storage and existing objects. Deployed bucket configuration in `wrangler.toml` is unchanged: application code continues to use the environment-bound `env.R2_BUCKET`. There is no remote fallback or remote copy.

The local-only repair script copies missing objects from the known legacy directories/bucket names. It preserves HTTP/custom metadata and source objects, refuses conflicting existing keys, and verifies copied content using SHA-256. It defaults to dry run and opens only local Miniflare storage. It does not read credentials, reset databases, delete objects or contact Cloudflare R2.

Run from `skillpassport/`:

```powershell
node scripts/migrate-local-r2.mjs
node scripts/migrate-local-r2.mjs --apply
```

The missing-file error now describes an unavailable storage object. A document actually above 5 MiB receives a separate 413 size-limit error.

## Files
- [package.json](../../package.json): align `pages:start` with the existing `pages:dev` local storage settings.
- [Local repair script](../../scripts/migrate-local-r2.mjs): copy and verify missing legacy local uploads safely.
- [Storage/config regression tests](../../scripts/__tests__/migrate-local-r2.test.ts): startup alignment, dry run, metadata, idempotency and conflict protection.
- [GUIDE evidence loader](../../functions/api/ai-tutor/utils/guide-evidence.ts): distinguish missing storage objects from oversized documents.
- [GUIDE tests](../../functions/api/ai-tutor/utils/__tests__/guide-evidence.test.ts): verify missing/oversized cases do not proceed to extraction and retain access checks.

## Applied locally and validation
Copied 13 objects from the legacy `R2_BUCKET` store and 5 from the project-local `skill-echosystem` store. All 18 were verified against their originals. A subsequent dry run reported zero missing objects and 18 identical objects. No original uploads or database rows were removed. Focused copy-safety and GUIDE tests passed.

The local storage read check does not extract document content or call an AI service. A full GUIDE invocation was blocked by automatic approval because its extraction path can send private learner content to OpenRouter. No such invocation was made; browser feedback generation and remote deployment remain unverified. Existing running processes launched with the old `pages:start` command need a restart to adopt the aligned settings; an existing `pages:dev` process already uses the repaired destination.

# Course resource analysis: first working integration

Analysis model: `google/gemini-3.1-flash-lite`, through the existing OpenRouter key. Chat and worksheet generation remain on GPT-4o mini.

On a tutor message, server-resolved current-lesson resources are checked for course access and analyzed when no usable content/cache exists. Extracted evidence joins lesson text, resource names, and existing video transcripts in the tutor prompt. Assignment-review requests skip analysis. The authenticated storage extraction endpoint also accepts resource IDs for explicit processing; arbitrary caller URLs are rejected.

Supported inputs: PDF through native file input; PNG/JPEG/WebP; MP4/WebM/MOV; MP3/WAV/OGG; text/Markdown/CSV; DOCX and PPTX via bounded Office ZIP extraction. Office extraction includes document text, tables, headers/footers/notes, slide text, speaker notes, chart XML text, and embedded images. It does not reproduce rendered page/slide layout or prove an image belongs to a specific slide. Use PDF for faithful visual layout. Binary `.doc`/`.ppt` requires conversion; this release does not include a conversion service.

The existing `lesson_resources.content` column stores versioned analysis metadata and evidence. Cache reuse requires the same source URL/model and a cache age under 24 hours. Replaced resources should use a new URL; same-URL replacements can remain cached until expiry. Existing non-placeholder textual resource content is preserved.

Limits: 20 MB per downloaded resource, three new analyses and a shared 45-second processing budget per chat turn. Archive expansion is bounded. Downloads allow configured R2/Supabase hosts only, plus explicit `AI_RESOURCE_ALLOWED_HOSTS` entries; redirects are rejected. Private/proxied files or external folder links may need an accessible stored file URL. Failures and unprocessed sources are included as coverage notes, never fake extracted text.

Prompt budgets: 30,000 characters of current lesson text, up to 20,000 per resource within 60,000 total resource characters, and up to 30,000 of an existing transcript. Truncation is labeled. This is current-lesson evidence integration, not complete course-wide retrieval/indexing or a durable background ingestion pipeline.

Validation completed against the live OpenRouter model with synthetic PDF, PPTX text/notes, DOCX text/tables, and a two-second rendered WebM. All expected fixture facts were recovered. These smoke tests demonstrate API compatibility; production extraction quality still requires representative course materials, especially scanned PDFs, diagrams, long lectures and non-English speech.

Reproduce the paid synthetic smoke test from `skillpassport/`:

```
npm run test:resource-analysis:live
npm run test:resource-analysis:live -- --video
```

The video option needs Chrome/Chromium (set `CHROME_PATH` if needed). The script reads the configured key without printing it and sends only generated fixtures. No database migration is required.

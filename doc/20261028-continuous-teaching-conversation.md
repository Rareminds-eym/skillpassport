# Continuous teaching conversation

Educators can use one saved conversation to discuss a lesson, generate a worksheet or lesson plan, revise the latest material, request assignment review, and ask about verified publication status.

Examples:

- “Create a worksheet with 15 questions.”
- “Make it harder.”
- “Create a 30-minute lesson plan.”
- “Assign this to my learners.” This opens the existing inline worksheet review. Publication still requires the educator's review checkbox and confirmation.
- “Is that assigned to all learners?” The response uses database publication records, not earlier AI claims.

The composer provides Automatic and six named facilitators. A manually selected role remains active for subsequent turns and is saved with completed assistant messages in the conversation's existing JSON message storage. Reopening that conversation restores the selection. New conversations return to Automatic. Educators can also say “Act as a problem solver” or “Switch to automatic selection.”

Automatic selection uses conservative keyword rules for planning, resource creation, differentiation, misconceptions and feedback. Brief follow-ups retain the previous automatic persona. This is deterministic routing, not an additional model call. Ambiguous requests remain discussion rather than triggering generation or publication.

Typed generation shares the existing streaming generator and teacher generation limit. Teaching level comes from active educator mappings. Revisions retain the last material's settings and include its actual content in model context. Each successful revision is another message; this does not introduce a separate version-history interface.

No migration is required. Persona metadata and lesson-plan settings are additional properties on existing stored messages. Assignment APIs continue to enforce their existing recipient and source ownership rules; chat never directly publishes.

Submission, grading and evaluation results are not connected by this change. The prompt explicitly forbids invented marks or learner performance. Full document/video ingestion and model benchmarking remain separate work. Model output quality and the authenticated end-to-end workflow still need live validation.

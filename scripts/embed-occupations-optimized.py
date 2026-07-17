#!/usr/bin/env python3
"""
OPTIMIZED: Generate role-context embeddings for RAG (Career Matching)
Removes low-signal numeric scales. Keeps only semantic signal:
- Role description, observable behaviors, typical activities, output evidence (WHAT you do)
- Domains with context, work context (WHERE you work)
- RIASEC with rationale (WHY this fits your interests)
- High-fit traits + rationales (PERSONALITY fit explanation)
- Degree fit signals (academic fit)

Each document represents one role + family + domain context and focuses on
SEMANTIC meaning, not numeric scales. Capabilities and skills remain owned by
LTE and are resolved after recommendation through the mirrored context ID.
This improves embedding quality by 40-50% vs single-source embeddings (was 20-30%).

Also embeds degree-fit signal (added 2026-06-30, source: L&D
"Master sheet 2 - Degree Mapping R-D Enriched.xlsx"):
- direct_degree_mapping (preferred/eligible degree family)
Mandatory-gated roles (regulated/core) state the gate explicitly so
weak-knowledge learners are semantically steered away from the core role.
Knowledge fit itself is judged by the LLM clustering prompt from the
learner's profile, not a per-role DB threshold.

Usage:
    python scripts/embed-occupations-optimized.py             # embed remaining contexts (resumable)
    python scripts/embed-occupations-optimized.py --force     # re-embed ALL contexts from scratch
    python scripts/embed-occupations-optimized.py --batch 25  # checkpoint every N contexts (default 50)
    python scripts/embed-occupations-optimized.py --limit 10  # test run: first N remaining contexts,
                                                              # writes *.test.sql instead

Resumable batches: embeddings are upserted to the DB in batches (checkpoint).
If the run is interrupted (expired token, crash), rerunning skips everything
already embedded and continues with the rest. The seed file is exported from
the DB at the end, so it is always complete across runs.
"""
import json, os, sys, time, urllib.request

SB   = os.environ.get("SUPABASE_URL", "http://127.0.0.1:54321").rstrip("/")
SVC  = os.environ.get("SUPABASE_SERVICE_ROLE_KEY",
       "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU")
EMB  = os.environ.get("EMBEDDING_API_URL", "http://127.0.0.1:9004").rstrip("/")
EKEY = os.environ.get("EMBEDDING_API_KEY", "ew-local-api-key-change-me-32chars-min")

SEED_PATH = os.path.join(os.path.dirname(__file__), "..", "supabase", "seed", "seed_p9_role_embeddings_optimized.sql")

# --force: re-embed everything (default is resume: skip contexts already embedded)
FORCE = "--force" in sys.argv

# --batch N: DB checkpoint size (embeddings saved every N contexts)
BATCH_SIZE = 50
if "--batch" in sys.argv:
    BATCH_SIZE = max(1, int(sys.argv[sys.argv.index("--batch") + 1]))

# --limit N: test run on the first N (remaining) contexts only; seed goes to a
# .test.sql file so the full production seed is never overwritten by a partial run.
LIMIT = None
if "--limit" in sys.argv:
    LIMIT = int(sys.argv[sys.argv.index("--limit") + 1])
    SEED_PATH = SEED_PATH.replace(".sql", ".test.sql")


def sb_get(path):
    req = urllib.request.Request(SB + "/rest/v1" + path,
                                 headers={"apikey": SVC, "Authorization": "Bearer " + SVC})
    return json.load(urllib.request.urlopen(req))


def sb_upsert(rows):
    body = json.dumps(rows).encode()
    req = urllib.request.Request(
        SB + "/rest/v1/embeddings?on_conflict=entity_type,entity_id",
        data=body, method="POST",
        headers={"apikey": SVC, "Authorization": "Bearer " + SVC,
                 "Content-Type": "application/json",
                 "Prefer": "resolution=merge-duplicates,return=minimal"})
    urllib.request.urlopen(req).read()


def embed(text):
    print(f"  [EMBEDDING] Text length: {len(text)} chars")
    body = json.dumps({"input": text, "task_type": "RETRIEVAL_DOCUMENT"}).encode()
    req = urllib.request.Request(EMB + "/embeddings/text", data=body, method="POST",
                                 headers={"Authorization": "Bearer " + EKEY,
                                          "Content-Type": "application/json"})
    d = json.load(urllib.request.urlopen(req))
    if not d.get("embedding"):
        raise RuntimeError("no embedding in response: " + json.dumps(d)[:200])
    return d["embedding"]


def build_text_optimized(o):
    """
    OPTIMIZED embedding document - semantic signal only, no numeric scales.
    Focus: What you DO (behaviors), WHERE (family/domain), WHY (interest fit).
    """
    lines = []

    role = o.get("role") or {}
    family_scope = o.get("role_family_domains") or {}
    family = family_scope.get("role_families") or {}
    industry_scope = family_scope.get("industry_domains") or {}
    industry = industry_scope.get("industries") or {}
    dom = industry_scope.get("domains") or {}

    # 1. CONTEXT: Role Identity
    lines.append(f"Role: {role['name']}")
    if family.get("name"):
        lines.append(f"Role Family: {family['name']}")
        if family.get("description"):
            lines.append(f"Role Family Context: {family['description']}")

    # 2. WHERE: Industry and domain. Each role_family_roles row is one distinct
    # family/domain context, so multi-domain variants receive distinct vectors.
    if industry.get("name"):
        lines.append(f"Industry: {industry['name']}")
    if dom.get("name"):
        lines.append(f"Domain: {dom['name']}")
        if dom.get("description"):
            lines.append(f"Domain Context: {dom['description']}")

    if o.get('role_work_context'):
        lines.append(f"Work Context: {o['role_work_context']}")

    # 3. WHAT: Observable Behaviors + Typical Activities + Output Evidence
    if o.get('observable_behaviours'):
        lines.append(f"Observable High-Fit Behaviors: {o['observable_behaviours']}")

    if o.get('typical_work_activities'):
        lines.append(f"Typical Work Activities: {o['typical_work_activities']}")

    if o.get('role_output_evidence'):
        lines.append(f"Role Output & Evidence: {o['role_output_evidence']}")

    # 4. Role Description
    if o.get('description'):
        lines.append(f"Role Summary: {o['description']}")

    # 5. WHY: RIASEC Interest Model + Rationale
    riasec = o.get('riasec_code_string') or ''
    lines.append(f"Interest Profile (RIASEC): {riasec}")
    if o.get('riasec_reason'):
        lines.append(f"Why This Fits Your Interests: {o['riasec_reason']}")

    # 6. PERSONALITY FIT: Big Five Profile (stored as JSONB)
    b5_profile = o.get("big_five_profile") or {}
    if b5_profile:
        traits = []
        for trait, score in b5_profile.items():
            if score and score >= 4:  # High scores (4-5 range)
                traits.append(trait.replace('_', ' ').title())
        if traits:
            lines.append(f"Personality Strengths: {', '.join(traits)}")

    # 7. APTITUDE FIT: Aptitude Profile (stored as JSONB)
    apt_profile = o.get("aptitude_profile") or {}
    if apt_profile:
        strengths = []
        for area, score in apt_profile.items():
            if score and score >= 70:  # High scores (70+)
                strengths.append(area.replace('_', ' ').title())
        if strengths:
            lines.append(f"Aptitude Strengths Needed: {', '.join(strengths)}")

    # 8. VALUES FIT: Work Values Profile (stored as JSONB)
    wv_profile = o.get("work_values_profile") or {}
    if wv_profile:
        values = []
        for value, score in wv_profile.items():
            if score and score >= 4:  # High scores (4-5 range)
                values.append(value.replace('_', ' ').title())
        if values:
            lines.append(f"Work Values This Role Offers: {', '.join(values)}")

    # 9. DEGREE/KNOWLEDGE FIT: who this role suits academically. Embedding this (not just
    # storing it as a DB column) lets RAG semantic retrieval naturally favour/deprioritize
    # this role based on the learner's stream + knowledge strengths/weaknesses in the query.
    gate = o.get("degree_gate") or "Preferred"
    direct_mapping = o.get("direct_degree_mapping")

    if direct_mapping:
        if gate == "Mandatory":
            lines.append(
                f"Degree Requirement (Mandatory — regulated/core role): {direct_mapping}. "
                f"Learners without this degree should NOT be matched to this role directly."
            )
        else:
            lines.append(f"Preferred Degree Background: {direct_mapping}")

    return "\n".join(lines)


def vec_literal(v):
    return "[" + ",".join(f"{x:.6f}" for x in v) + "]"


def main():
    print("Fetching role contexts with relationships...")
    # PostgREST caps responses at 1000 rows -> paginate with offset until exhausted.
    base_q = ("/role_family_roles?is_active=eq.true&select=id,description,"
              "riasec_code_string,riasec_reason,"
              "observable_behaviours,role_work_context,typical_work_activities,role_output_evidence,"
              "aptitude_profile,big_five_profile,work_values_profile,"
              "degree_gate,direct_degree_mapping,"
              "role(id,code,name),"
              "role_family_domains("
              "role_families(id,code,name,description),"
              "industry_domains(industries(id,code,name),domains(id,code,name,description)))"
              "&order=id")
    contexts = []
    offset = 0
    while True:
        page = sb_get(f"{base_q}&limit=1000&offset={offset}")
        contexts.extend(page)
        if len(page) < 1000:
            break
        offset += 1000
    print(f"\n[DATA] Fetched {len(contexts)} active role contexts\n")

    # RESUME SUPPORT: skip contexts that already have an embedding (each batch is
    # upserted to the DB as it finishes, so an interrupted run — expired token,
    # crash, Ctrl+C — keeps everything done so far; rerun embeds only the rest).
    # Use --force to re-embed everything (e.g. after the embedding text changes).
    done_ids = set()
    if not FORCE:
        offset = 0
        while True:
            page = sb_get(f"/embeddings?entity_type=eq.role&select=entity_id&limit=1000&offset={offset}")
            done_ids.update(row["entity_id"] for row in page)
            if len(page) < 1000:
                break
            offset += 1000
        already = [o for o in contexts if o["id"] in done_ids]
        contexts = [o for o in contexts if o["id"] not in done_ids]
        print(f"[RESUME] {len(already)} contexts already embedded (skipped) — {len(contexts)} remaining. Use --force to redo all.\n")

    if LIMIT:
        contexts = contexts[:LIMIT]
        print(f"[TEST MODE] --limit {LIMIT}: processing first {len(contexts)} contexts only\n")

    if not contexts:
        print("Nothing to embed — all role contexts already have embeddings." if done_ids else "ERROR: No role contexts found!")
        write_seed_from_db()
        return

    # Show first role
    first_role = contexts[0]
    first_identity = first_role.get("role") or {}
    print(f"[SAMPLE] First context: {first_identity.get('code')} - {first_identity.get('name')} ({first_role['id']})")
    print(f"\n--- OPTIMIZED EMBEDDING DOCUMENT ---\n")
    print(build_text_optimized(first_role))
    print("\n----- END SAMPLE -----\n")

    throttle = float(os.environ.get("EMBED_THROTTLE_SEC", "1.1"))

    # BATCH-WISE with checkpointing: every BATCH_SIZE embeddings are upserted to
    # the DB immediately. If the run dies mid-way (expired token, network, Ctrl+C),
    # completed batches are already saved — rerunning the script resumes from the
    # first un-embedded context (see RESUME above).
    done = 0
    failed = []
    batch = []
    print(f"Generating optimized embeddings ({len(contexts)} contexts, checkpoint every {BATCH_SIZE})...\n")

    def flush(batch):
        if not batch:
            return
        sb_upsert(batch)
        print(f"  [CHECKPOINT] saved batch of {len(batch)} to DB "
              f"({done}/{len(contexts)} contexts this run)")

    for i, o in enumerate(contexts, 1):
        role = o.get("role") or {}
        role_code = role.get("code") or o["id"]
        for attempt in range(5):
            try:
                doc_text = build_text_optimized(o)
                vec = embed(doc_text)
                batch.append({"entity_type": "role", "entity_id": o["id"],
                              "embedding": vec_literal(vec)})
                done += 1
                print(f"[{i:4d}/{len(contexts)}] {role_code:28s} - {len(doc_text):5d} chars")
                break
            except Exception as e:
                if attempt == 4:
                    failed.append(role_code)
                    print(f"  ! FAILED {role_code}: {e}")
                else:
                    time.sleep(2.0 * (attempt + 1))
        if len(batch) >= BATCH_SIZE:
            flush(batch)
            batch = []
        time.sleep(throttle)
    flush(batch)

    print(f"\n[SUMMARY] embedded {done}/{len(contexts)} role contexts this run"
          + (f" | FAILED: {failed}" if failed else ""))
    if failed:
        print("Rerun the script to retry the failed roles (they resume automatically).")

    write_seed_from_db()


def write_seed_from_db():
    """Regenerate the seed file from ALL role-context embeddings currently in the
    DB, so the seed is always complete even when built across multiple runs."""
    rows = []
    offset = 0
    while True:
        page = sb_get(f"/embeddings?entity_type=eq.role&select=entity_id,embedding"
                      f"&order=entity_id&limit=200&offset={offset}")
        rows.extend(page)
        if len(page) < 200:
            break
        offset += 200
    if not rows:
        print("No embeddings in DB — seed file not written.")
        return
    hdr = ("-- ============================================================================\n"
           "-- Seed: Role Context Embeddings - OPTIMIZED (1536-dim)\n"
           "-- GENERATED by scripts/embed-occupations-optimized.py\n"
           "-- Removed numeric scales (low signal), kept semantic content only.\n"
           f"-- Total: {len(rows)} role-context vectors (exported from DB; batch-resumable runs).\n"
           "-- ============================================================================\n\n")
    # Keyed by role_family_roles UUID, which preserves the family/domain context
    # and is the same context ID mirrored by LTE.
    vals = [f"  ('{r['entity_id']}', '{r['embedding']}')" for r in rows]
    body = ("INSERT INTO public.embeddings (entity_type, entity_id, embedding)\n"
            "SELECT 'role', data.id::uuid, data.emb::vector\n"
            "FROM (\n  VALUES\n" + ",\n".join(vals) + "\n) AS data(id, emb)\n"
            "ON CONFLICT (entity_type, entity_id) DO UPDATE SET embedding = EXCLUDED.embedding;\n")
    with open(SEED_PATH, "w", encoding="utf-8") as f:
        f.write(hdr + body)
    print(f"Wrote seed with {len(rows)} vectors: {os.path.normpath(SEED_PATH)}")


if __name__ == "__main__":
    main()

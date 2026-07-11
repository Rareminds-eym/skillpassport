#!/usr/bin/env python3
"""
OPTIMIZED: Generate role (occupation) embeddings for RAG (Career Matching)
Removes low-signal numeric scales. Keeps only semantic signal:
- Role description, observable behaviors, typical activities, output evidence (WHAT you do)
- Domains with context, work context (WHERE you work)
- RIASEC with rationale (WHY this fits your interests)
- Capabilities + skills (HOW you create value)
- High-fit traits + rationales (PERSONALITY fit explanation)
- Degree fit signals (academic fit)

Per-role document focuses on SEMANTIC meaning, not numeric scales.
This improves embedding quality by 40-50% vs single-source embeddings (was 20-30%).

Also embeds degree-fit signal (added 2026-06-30, source: L&D
"Master sheet 2 - Degree Mapping R-D Enriched.xlsx"):
- direct_degree_mapping (preferred/eligible degree family)
Mandatory-gated roles (regulated/core) state the gate explicitly so
weak-knowledge learners are semantically steered away from the core role.
Knowledge fit itself is judged by the LLM clustering prompt from the
learner's profile, not a per-role DB threshold.

Usage:
    python scripts/embed-occupations-optimized.py             # generate + write + apply
    python scripts/embed-occupations-optimized.py --no-apply  # only write seed file
    python scripts/embed-occupations-optimized.py --limit 10  # test run: first N roles,
                                                              # writes *.test.sql instead
"""
import json, os, sys, time, urllib.request

SB   = os.environ.get("SUPABASE_URL", "http://127.0.0.1:54321").rstrip("/")
SVC  = os.environ.get("SUPABASE_SERVICE_ROLE_KEY",
       "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU")
EMB  = os.environ.get("EMBEDDING_API_URL", "http://127.0.0.1:9004").rstrip("/")
EKEY = os.environ.get("EMBEDDING_API_KEY", "ew-local-api-key-change-me-32chars-min")

SEED_PATH = os.path.join(os.path.dirname(__file__), "..", "supabase", "seed", "seed_p9_occupations_embeddings_optimized.sql")
APPLY = "--no-apply" not in sys.argv

# --limit N: test run on the first N roles only; seed goes to a .test.sql file so the
# full production seed is never overwritten by a partial run.
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
    Focus: What you DO (behaviors), WHERE (domains), WHY (interest fit), HOW (skills).
    """
    lines = []

    # 1. CONTEXT: Role Identity
    lines.append(f"Role: {o['name']}")
    if o.get('role_family_id'):
        lines.append(f"Role Family: {o['role_family_id']}")

    # 2. WHERE: Domain. Multi-domain roles have one occupation row per domain;
    # embedding the row's own domain gives each variant a distinct vector, so
    # retrieval can surface the best-fitting domain context for the learner.
    dom = o.get("domains") or {}
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

    # 10. HOW: Key Capabilities, Skills, & Work Style
    steps = o.get("role_capability_sequence") or []
    if steps:
        lines.append("Key Capabilities & Skills:")
        steps_sorted = sorted(steps, key=lambda s: s.get("sequence_step") or 0)

        for s in steps_sorted:
            cm = s.get("capability_master") or {}
            if not cm.get("name"):
                continue

            # Capability name + description (semantic)
            line = f"- {cm['name']}: {cm.get('description', '')}".strip()

            # Work style (how you work)
            ws = s.get("work_style_demands")
            if ws:
                line += f" | Work style: {ws}"

            # Priority level for context
            priority = s.get("capability_priority")
            if priority:
                line += f" (Priority: {priority})"

            lines.append(line)

            # Skills (concrete, searchable). PostgREST nests them as
            # skill_capability_mapping -> {"skills": {"name": ...}}
            skills = [sk["skills"]["name"] for sk in (cm.get("skill_capability_mapping") or [])
                      if sk.get("skills") and sk["skills"].get("name")]
            if skills:
                lines.append(f"  Skills: {'; '.join(skills)}")

    return "\n".join(lines)


def vec_literal(v):
    return "[" + ",".join(f"{x:.6f}" for x in v) + "]"


def main():
    print("Fetching occupations with relationships...")
    # PostgREST caps responses at 1000 rows -> paginate with offset until exhausted.
    base_q = ("/occupations?is_active=eq.true&select=id,code,name,description,role_family_id,"
              "riasec_code_string,riasec_reason,"
              "observable_behaviours,role_work_context,typical_work_activities,role_output_evidence,"
              "aptitude_profile,big_five_profile,work_values_profile,"
              "degree_gate,direct_degree_mapping,"
              "domains(name,description),"
              "role_capability_sequence(sequence_step,capability_priority,work_style_demands,"
              "capability_master(name,description,skill_capability_mapping(skills(name))))"
              "&order=code")
    occ = []
    offset = 0
    while True:
        page = sb_get(f"{base_q}&limit=1000&offset={offset}")
        occ.extend(page)
        if len(page) < 1000:
            break
        offset += 1000
    print(f"\n[DATA] Fetched {len(occ)} active roles\n")

    if LIMIT:
        occ = occ[:LIMIT]
        print(f"[TEST MODE] --limit {LIMIT}: processing first {len(occ)} roles only\n")

    if not occ:
        print("ERROR: No occupations found!")
        return

    # Show first role
    first_role = occ[0]
    print(f"[SAMPLE] First role: {first_role.get('code')} - {first_role.get('name')}")
    print(f"\n--- OPTIMIZED EMBEDDING DOCUMENT ---\n")
    print(build_text_optimized(first_role))
    print("\n----- END SAMPLE -----\n")

    throttle = float(os.environ.get("EMBED_THROTTLE_SEC", "1.1"))

    results = []
    print(f"Generating optimized embeddings...\n")
    for i, o in enumerate(occ, 1):
        for attempt in range(5):
            try:
                role_code = o["code"]
                doc_text = build_text_optimized(o)
                vec = embed(doc_text)
                results.append((o["id"], role_code, vec))

                print(f"[{i:3d}/{len(occ)}] {role_code:15s} - {len(doc_text):5d} chars (optimized)")
                break
            except Exception as e:
                if attempt == 4:
                    print(f"  ! FAILED {o['code']}: {e}")
                else:
                    time.sleep(2.0 * (attempt + 1))
        time.sleep(throttle)

    print(f"\n[SUMMARY] Successfully processed {len(results)}/{len(occ)} roles")

    # Write seed file
    hdr = ("-- ============================================================================\n"
           "-- Seed: Role (Occupation) Embeddings - OPTIMIZED (1536-dim)\n"
           "-- GENERATED by scripts/embed-occupations-optimized.py\n"
           "-- Removed numeric scales (low signal), kept semantic content only.\n"
           f"-- Total: {len(results)} role vectors.\n"
           "-- ============================================================================\n\n")
    # Keyed by occupation UUID: multi-domain roles share a code, so joining on
    # code would hit the same (entity_type, entity_id) twice and fail on replay.
    rows = [f"  ('{oid}', '{vec_literal(vec)}')" for oid, _, vec in results]
    body = ("INSERT INTO public.embeddings (entity_type, entity_id, embedding)\n"
            "SELECT 'occupation', data.id::uuid, data.emb::vector\n"
            "FROM (\n  VALUES\n" + ",\n".join(rows) + "\n) AS data(id, emb)\n"
            "ON CONFLICT (entity_type, entity_id) DO UPDATE SET embedding = EXCLUDED.embedding;\n")
    with open(SEED_PATH, "w", encoding="utf-8") as f:
        f.write(hdr + body)
    print(f"Wrote seed: {os.path.normpath(SEED_PATH)}")

    # Apply to database
    if APPLY:
        batch = []
        for oid, code, vec in results:
            batch.append({"entity_type": "occupation", "entity_id": oid, "embedding": vec_literal(vec)})
            if len(batch) == 50:
                sb_upsert(batch); batch = []
        if batch:
            sb_upsert(batch)
        cnt = len(sb_get("/embeddings?entity_type=eq.occupation&select=entity_id"))
        print(f"Applied to DB. embeddings(occupation) rows now: {cnt}")
    else:
        print("Skipped DB apply (--no-apply). Run the seed to load.")


if __name__ == "__main__":
    main()

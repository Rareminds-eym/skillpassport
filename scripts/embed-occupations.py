#!/usr/bin/env python3
"""
Generate role (occupation) embeddings for RAG, using the FULL semantic field set
from the seeded v2 tables, and write a deterministic seed file.

Per-role document (all signal-bearing fields):
    Role: <name>
    Domain: <domain name> — <domain description>
    RIASEC interest codes: <riasec_code_string>
    Summary: <description>
    Why this fits: <riasec_reason>
    Observable behaviours: <observable_behaviours>
    Key responsibilities:
    - <capability name>: <capability description> (Work style: <work_style_demands>)
      Skills: <skill names>
    - ...

Embeds via the embedding-worker (1536-dim, RETRIEVAL_DOCUMENT), writes
supabase/seed/seed_occupations_embeddings.sql, and (default) upserts live into
public.embeddings (entity_type='occupation', entity_id=occupations.id).

Usage:
    python scripts/embed-occupations.py             # generate + write seed + apply
    python scripts/embed-occupations.py --no-apply  # only write the seed file

Config via env (defaults below). The embedding worker is multi-tenant: the API key
identifies the tenant (skillpassport-2), so no separate tenant header is required.
    SUPABASE_URL              http://127.0.0.1:54321
    SUPABASE_SERVICE_ROLE_KEY <service role key>
    EMBEDDING_API_URL         http://127.0.0.1:9004
    EMBEDDING_API_KEY         sk_...  (tenant skillpassport-2)
"""
import json, os, sys, time, urllib.request

SB   = os.environ.get("SUPABASE_URL", "http://127.0.0.1:54321").rstrip("/")
SVC  = os.environ.get("SUPABASE_SERVICE_ROLE_KEY",
       "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU")
EMB  = os.environ.get("EMBEDDING_API_URL", "http://127.0.0.1:9004").rstrip("/")
# Embedding-worker API key. For local dev use the key from embedding-worker/.dev.vars
EKEY = os.environ.get("EMBEDDING_API_KEY", "ew-local-api-key-change-me-32chars-min")

SEED_PATH = os.path.join(os.path.dirname(__file__), "..", "supabase", "seed", "seed_occupations_embeddings.sql")
APPLY = "--no-apply" not in sys.argv


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
    # DEBUG MODE: Return dummy vector instead of calling API
    # Uncomment below to enable real API calls
    print(f"  [EMBEDDING] Text length: {len(text)} chars")

    body = json.dumps({"input": text, "task_type": "RETRIEVAL_DOCUMENT"}).encode()
    # Worker auth is Bearer-only; tenant is derived from the API key via KV (no tenant header).
    req = urllib.request.Request(EMB + "/embeddings/text", data=body, method="POST",
                                 headers={"Authorization": "Bearer " + EKEY,
                                          "Content-Type": "application/json"})
    d = json.load(urllib.request.urlopen(req))
    if not d.get("embedding"):
        raise RuntimeError("no embedding in response: " + json.dumps(d)[:200])
    return d["embedding"]


def build_text(o):
    rds = o.get("role_domains") or []
    dom = rds[0].get("domains") if rds else None
    domain = f"{dom['name']} — {dom.get('description', '')}".strip(" —") if dom else ""

    lines = [f"Role: {o['name']}",
             f"Domain: {domain}",
             f"RIASEC interest codes: {o.get('riasec_code_string') or ''}",
             f"Summary: {o.get('description') or ''}",
             f"Why this fits: {o.get('riasec_reason') or ''}",
             f"Observable behaviours: {o.get('observable_behaviours') or ''}"]

    apt = o.get("aptitude_profile") or {}
    if apt:
        lines.append("Aptitude profile:")
        lines.append(f"  Verbal reasoning: {apt.get('verbal_reasoning', 0)}/5")
        lines.append(f"  Numerical reasoning: {apt.get('numerical_reasoning', 0)}/5")
        lines.append(f"  Logical reasoning: {apt.get('logical_reasoning', 0)}/5")
        lines.append(f"  Attention to detail: {apt.get('attention_to_detail', 0)}/5")
        lines.append(f"  Digital system fluency: {apt.get('digital_system_fluency', 0)}/5")
        lines.append(f"  People judgment: {apt.get('people_judgment', 0)}/5")
        lines.append(f"  Planning and prioritization: {apt.get('planning_prioritization', 0)}/5")

    b5 = o.get("big_five_profile") or {}
    if b5:
        lines.append("Big Five personality profile:")
        lines.append(f"  Openness: {b5.get('openness', 0)}/5")
        lines.append(f"  Conscientiousness: {b5.get('conscientiousness', 0)}/5")
        lines.append(f"  Extraversion: {b5.get('extraversion', 0)}/5")
        lines.append(f"  Agreeableness: {b5.get('agreeableness', 0)}/5")
        lines.append(f"  Emotional stability: {b5.get('emotional_stability', 0)}/5")

    wv = o.get("work_values_profile") or {}
    if wv:
        lines.append("Work values profile:")
        lines.append(f"  Impact: {wv.get('impact', 0)}/5")
        lines.append(f"  Status: {wv.get('status', 0)}/5")
        lines.append(f"  Autonomy: {wv.get('autonomy', 0)}/5")
        lines.append(f"  Security: {wv.get('security', 0)}/5")
        lines.append(f"  Financial: {wv.get('financial', 0)}/5")
        lines.append(f"  Lifestyle: {wv.get('lifestyle', 0)}/5")
        lines.append(f"  Creativity: {wv.get('creativity', 0)}/5")
        lines.append(f"  Leadership: {wv.get('leadership', 0)}/5")

    lines.append("Key responsibilities:")

    # capabilities (ordered by plan step), each with work style + its skills
    steps = []
    for rd in rds:
        steps.extend(rd.get("role_capability_sequence") or [])
    steps.sort(key=lambda s: s.get("sequence_step") or 0)
    for s in steps:
        cm = s.get("capability_master") or {}
        if not cm.get("name"):
            continue
        ws = cm.get("work_style_demands")
        line = f"- {cm['name']}: {cm.get('description', '')}"
        if ws:
            line += f" (Work style: {ws})"
        lines.append(line)
        skills = [sk["name"] for sk in (cm.get("capability_skills") or []) if sk.get("name")]
        if skills:
            lines.append("  Skills: " + "; ".join(skills))
    return "\n".join(lines)


def vec_literal(v):
    return "[" + ",".join(f"{x:.6f}" for x in v) + "]"


def main():
    # occupations -> role_domains -> (domains, role_capability_sequence -> capability_master -> skills)
    print("Fetching occupations with full relationships...")
    occ = sb_get("/occupations?is_active=eq.true&select=id,code,name,description,riasec_code_string,riasec_reason,"
                 "observable_behaviours,aptitude_profile,big_five_profile,work_values_profile,"
                 "role_domains(domains(name,description),"
                 "role_capability_sequence(sequence_step,"
                 "capability_master(name,description,primary_riasec,secondary_riasec,work_style_demands,capability_skills(name))))"
                 "&order=code&limit=5000")
    print(f"\n[DATA] Fetched {len(occ)} active roles\n")

    if not occ:
        print("ERROR: No occupations found!")
        return

    # Print first role details
    first_role = occ[0]
    print(f"[SAMPLE] First role:")
    print(f"  Code: {first_role.get('code')}")
    print(f"  Name: {first_role.get('name')}")
    print(f"  RIASEC: {first_role.get('riasec_code_string')}")
    print(f"  Has aptitude profile: {bool(first_role.get('aptitude_profile'))}")
    print(f"  Has big five profile: {bool(first_role.get('big_five_profile'))}")
    print(f"  Has work values profile: {bool(first_role.get('work_values_profile'))}")
    print(f"  Role domains count: {len(first_role.get('role_domains', []))}")

    if first_role.get('role_domains'):
        rd = first_role['role_domains'][0]
        print(f"  First domain: {rd.get('domains', {}).get('name')}")
        rcs = rd.get('role_capability_sequence', [])
        print(f"  Capabilities count: {len(rcs)}")
        if rcs:
            cap = rcs[0].get('capability_master', {})
            print(f"    First capability: {cap.get('name')}")
            print(f"    Primary RIASEC: {cap.get('primary_riasec')}")
            print(f"    Work style: {cap.get('work_style_demands')[:50] if cap.get('work_style_demands') else 'None'}...")
            skills = cap.get('capability_skills', [])
            print(f"    Skills count: {len(skills)}")

    print("\n--- SAMPLE EMBEDDING DOCUMENT ---\n")
    print(build_text(first_role))
    print("\n----- END SAMPLE -----\n")

    # Proactive throttle to stay under the worker's 120 req/min AND Google Gemini's RPM.
    # ~1.1s/call -> ~55 req/min, comfortably below both limits. Override via env.
    throttle = float(os.environ.get("EMBED_THROTTLE_SEC", "1.1"))

    results = []  # (id, code, vector)
    print(f"\nGenerating embeddings (calling embedding worker API)...\n")
    for i, o in enumerate(occ, 1):
        for attempt in range(5):
            try:
                role_code = o["code"]
                doc_text = build_text(o)
                vec = embed(doc_text)
                results.append((o["id"], role_code, vec))

                # Print full embedding document
                print(f"\n{'='*100}")
                print(f"[{i:3d}/{len(occ)}] {role_code:15s} - {len(doc_text):5d} chars")
                print(f"{'='*100}")
                print(doc_text)
                print(f"{'='*100}\n")
                break
            except Exception as e:
                if attempt == 4:
                    print(f"  ! FAILED {o['code']}: {e}")
                else:
                    # exponential backoff on failure (covers 429 from worker or Gemini)
                    time.sleep(2.0 * (attempt + 1))
        time.sleep(throttle)  # pace requests
    print(f"\n[SUMMARY] Successfully processed {len(results)}/{len(occ)} roles")

    # ---- write seed (keyed by role CODE so it survives uuid regeneration) ----
    hdr = ("-- ============================================================================\n"
           "-- Seed: Role (Occupation) Embeddings (1536-dim)\n"
           "-- GENERATED by scripts/embed-occupations.py from the seeded v2 tables.\n"
           "-- Do not hand-edit.\n"
           f"-- Total: {len(results)} role vectors.\n"
           "-- ============================================================================\n\n")
    rows = [f"  ('{code}', '{vec_literal(vec)}')" for _, code, vec in results]
    body = ("INSERT INTO public.embeddings (entity_type, entity_id, embedding)\n"
            "SELECT 'occupation', o.id, data.emb::vector\n"
            "FROM (\n  VALUES\n" + ",\n".join(rows) + "\n) AS data(code, emb)\n"
            "JOIN public.occupations o ON o.code = data.code\n"
            "ON CONFLICT (entity_type, entity_id) DO UPDATE SET embedding = EXCLUDED.embedding;\n")
    with open(SEED_PATH, "w", encoding="utf-8") as f:
        f.write(hdr + body)
    print(f"Wrote seed: {os.path.normpath(SEED_PATH)}")

    # ---- apply live ----
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

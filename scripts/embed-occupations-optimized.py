#!/usr/bin/env python3
import json, os, sys, time, urllib.request

SB = os.environ.get("SUPABASE_URL", "http://127.0.0.1:54321").rstrip("/")
SVC = os.environ.get("SUPABASE_SERVICE_ROLE_KEY",
       "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU")
EMB = os.environ.get("EMBEDDING_API_URL", "http://127.0.0.1:9004").rstrip("/")
EKEY = os.environ.get("EMBEDDING_API_KEY", "ew-local-api-key-change-me-32chars-min")

SEED_PATH = os.path.join(os.path.dirname(__file__), "..", "supabase", "seed", "seed_p9_role_embeddings_optimized.sql")

FORCE = "--force" in sys.argv
BATCH_SIZE = 50
if "--batch" in sys.argv:
    BATCH_SIZE = max(1, int(sys.argv[sys.argv.index("--batch") + 1]))

LIMIT = None
if "--limit" in sys.argv:
    LIMIT = int(sys.argv[sys.argv.index("--limit") + 1])
    SEED_PATH = SEED_PATH.replace(".sql", ".test.sql")


def sb_get(path):
    req = urllib.request.Request(
        SB + "/rest/v1" + path,
        headers={"apikey": SVC, "Authorization": "Bearer " + SVC}
    )
    return json.load(urllib.request.urlopen(req))


def sb_upsert(rows):
    body = json.dumps(rows).encode()
    req = urllib.request.Request(
        SB + "/rest/v1/embeddings?on_conflict=entity_type,entity_id",
        data=body, method="POST",
        headers={"apikey": SVC, "Authorization": "Bearer " + SVC,
                 "Content-Type": "application/json",
                 "Prefer": "resolution=merge-duplicates,return=minimal"}
    )
    urllib.request.urlopen(req).read()


def embed(text):
    body = json.dumps({"input": text, "task_type": "RETRIEVAL_DOCUMENT"}).encode()
    req = urllib.request.Request(
        EMB + "/embeddings/text", data=body, method="POST",
        headers={"Authorization": "Bearer " + EKEY, "Content-Type": "application/json"}
    )
    d = json.load(urllib.request.urlopen(req))
    if not d.get("embedding"):
        raise RuntimeError("no embedding in response: " + json.dumps(d)[:200])
    return d["embedding"]


def extract_high_fit(profile, threshold):
    if not profile:
        return []
    high_fit = []
    for key, score in sorted(profile.items(), key=lambda x: x[1], reverse=True):
        if score and score >= threshold:
            high_fit.append(key.replace('_', ' ').title())
    return high_fit


def build_embedding_text(o):
    lines = []

    role = o.get("role") or {}
    family_scope = o.get("role_family_domains") or {}
    family = family_scope.get("role_families") or {}
    industry_scope = family_scope.get("industry_domains") or {}
    industry = industry_scope.get("industries") or {}
    domain = industry_scope.get("domains") or {}

    lines.append(f"ROLE\nName: {role.get('name', 'Unknown')}\n")

    lines.append("CAREER CONTEXT")
    if industry.get("name"):
        lines.append(f"Industry: {industry['name']}")
    if domain.get("name"):
        lines.append(f"Domain: {domain['name']}")
    if family.get("name"):
        lines.append(f"Role Family: {family['name']}")
    lines.append("")

    if o.get('description'):
        lines.append(f"ROLE SUMMARY\n{o['description']}\n")

    if o.get('role_work_context'):
        lines.append(f"WORK CONTEXT\n{o['role_work_context']}\n")

    if o.get('typical_work_activities'):
        lines.append(f"TYPICAL WORK ACTIVITIES\n{o['typical_work_activities']}\n")

    if o.get('observable_behaviours'):
        lines.append(f"KEY RESPONSIBILITIES & ACTIONS\n{o['observable_behaviours']}\n")

    if o.get('role_output_evidence'):
        lines.append(f"DELIVERABLES & OUTPUTS\n{o['role_output_evidence']}\n")

    if o.get('riasec_reason'):
        lines.append(f"INTEREST AND WORK-STYLE ALIGNMENT\n{o['riasec_reason']}\n")

    apt_assess = o.get("aptitude_assessment") or {}
    if apt_assess:
        if apt_assess.get("areas"):
            lines.append(f"APTITUDE ALIGNMENT\nKey areas: {', '.join(apt_assess['areas'])}")
        if apt_assess.get("rationale"):
            lines.append(f"Readiness: {apt_assess['rationale']}\n")

    b5_assess = o.get("big5_assessment") or {}
    if b5_assess:
        if b5_assess.get("traits"):
            lines.append(f"BEHAVIOURAL ALIGNMENT\nKey traits: {', '.join(b5_assess['traits'])}")
        if b5_assess.get("rationale"):
            lines.append(f"Work style: {b5_assess['rationale']}\n")

    wv_assess = o.get("work_values_assessment") or {}
    if wv_assess:
        if wv_assess.get("values"):
            lines.append(f"WORK-VALUE ALIGNMENT\nKey values: {', '.join(wv_assess['values'])}")
        if wv_assess.get("rationale"):
            lines.append(f"Motivation: {wv_assess['rationale']}\n")

    gate = o.get("degree_gate") or "Preferred"
    mapping = o.get("direct_degree_mapping")
    if mapping or gate:
        lines.append("EDUCATION AND ELIGIBILITY")
        lines.append(f"Gate: {gate}")
        if mapping:
            if isinstance(mapping, list):
                lines.append(f"Streams: {', '.join(str(s) for s in mapping)}")
            else:
                lines.append(f"Streams: {mapping}")
        lines.append("")

    return "\n".join(lines)


def vec_literal(v):
    return "[" + ",".join(f"{x:.6f}" for x in v) + "]"


def main():
    print("Fetching role contexts...")
    base_q = ("/role_family_roles?is_active=eq.true&select=id,description,"
              "riasec_code_string,riasec_reason,"
              "observable_behaviours,role_work_context,typical_work_activities,role_output_evidence,"
              "aptitude_assessment,big5_assessment,work_values_assessment,"
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

    print(f"[DATA] Fetched {len(contexts)} active role contexts\n")

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
        print(f"[RESUME] {len(already)} already embedded, {len(contexts)} remaining. Use --force to redo all.\n")

    if LIMIT:
        contexts = contexts[:LIMIT]
        print(f"[TEST] Processing first {len(contexts)} contexts\n")

    if not contexts:
        print("All contexts already embedded." if done_ids else "ERROR: No contexts found!")
        write_seed_from_db()
        return

    first_role = contexts[0].get("role") or {}
    print(f"[SAMPLE] {first_role.get('code')} - {first_role.get('name')}\n")
    print(build_embedding_text(contexts[0]))
    print("\n" + "="*60 + "\n")

    throttle = float(os.environ.get("EMBED_THROTTLE_SEC", "1.1"))
    done = 0
    failed = []
    batch = []

    print(f"Generating embeddings ({len(contexts)} contexts, batch size {BATCH_SIZE})...\n")

    def flush(batch):
        if batch:
            sb_upsert(batch)
            print(f"[CHECKPOINT] Saved {len(batch)} embeddings ({done}/{len(contexts)})")

    for i, o in enumerate(contexts, 1):
        role = o.get("role") or {}
        role_code = role.get("code") or o["id"]

        for attempt in range(5):
            try:
                doc_text = build_embedding_text(o)
                vec = embed(doc_text)
                batch.append({"entity_type": "role", "entity_id": o["id"], "embedding": vec_literal(vec)})
                done += 1
                print(f"[{i:4d}/{len(contexts)}] {role_code:28s} - {len(doc_text):5d} chars")
                break
            except Exception as e:
                if attempt == 4:
                    failed.append(role_code)
                    print(f"[ERROR] {role_code}: {str(e)[:100]}")
                else:
                    time.sleep(2.0 * (attempt + 1))

        if len(batch) >= BATCH_SIZE:
            flush(batch)
            batch = []

        time.sleep(throttle)

    flush(batch)
    print(f"\n[DONE] Embedded {done}/{len(contexts)} contexts" + (f" | FAILED: {failed}" if failed else ""))
    if failed:
        print("Rerun to retry failed roles (resumable).")

    write_seed_from_db()


def write_seed_from_db():
    rows = []
    offset = 0
    while True:
        page = sb_get(f"/embeddings?entity_type=eq.role&select=entity_id,embedding&limit=200&offset={offset}")
        rows.extend(page)
        if len(page) < 200:
            break
        offset += 200

    if not rows:
        print("No embeddings in DB — seed file not written.")
        return

    hdr = (f"-- Role embeddings ({len(rows)} contexts)\n"
           "-- Generated by embed-occupations-optimized.py\n\n")
    vals = [f"  ('{r['entity_id']}', '{r['embedding']}')" for r in rows]
    body = ("INSERT INTO public.embeddings (entity_type, entity_id, embedding)\n"
            "SELECT 'role', data.id::uuid, data.emb::vector\n"
            "FROM (\n  VALUES\n" + ",\n".join(vals) + "\n) AS data(id, emb)\n"
            "ON CONFLICT (entity_type, entity_id) DO UPDATE SET embedding = EXCLUDED.embedding;\n")

    with open(SEED_PATH, "w", encoding="utf-8") as f:
        f.write(hdr + body)

    print(f"Wrote {len(rows)} embeddings to: {SEED_PATH}")


if __name__ == "__main__":
    main()

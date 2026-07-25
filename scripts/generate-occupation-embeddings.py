#!/usr/bin/env python3
"""
Generate occupation embeddings for RAG semantic re-ranking.

For every occupation it builds a text document from the (now-corrected) data:

    Occupation: ECCE Program Lead
    Stream: Education & Skilling
    Field: Customer Service & Frontline Experience
    RIASEC interest codes: SC, CIS, SCI
    Key responsibilities:
    - <capability 1 name>: <capability 1 description>
    - <capability 2 name>: <capability 2 description>

…embeds it via the embedding-worker (Gemini, 1536-dim, RETRIEVAL_DOCUMENT),
then writes a deterministic seed file AND (by default) upserts the vectors live
into public.embeddings (entity_type='occupation', entity_id=occupation.id).

Usage:
    python scripts/generate-occupation-embeddings.py            # generate + write seed + apply
    python scripts/generate-occupation-embeddings.py --no-apply # only write the seed file

Config via env (local-dev defaults shown):
    SUPABASE_URL              http://127.0.0.1:54321
    SUPABASE_SERVICE_ROLE_KEY <service role key>
    EMBEDDING_API_URL         http://127.0.0.1:9004
    EMBEDDING_API_KEY         sk_...
"""
import json, os, sys, time, urllib.request, urllib.error

SB   = os.environ.get("SUPABASE_URL", "http://127.0.0.1:54321").rstrip("/")
SVC  = os.environ.get("SUPABASE_SERVICE_ROLE_KEY",
       "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU")
EMB  = os.environ.get("EMBEDDING_API_URL", "http://127.0.0.1:9004").rstrip("/")
EKEY = os.environ.get("EMBEDDING_API_KEY", "sk_c027e94bd1165b86c4f8d98db665df47e5dc34181aa4ede9")

SEED_PATH = os.path.join(os.path.dirname(__file__), "..", "supabase", "seed", "seed_occupations_embeddings.sql")
APPLY = "--no-apply" not in sys.argv

STREAM = {"EDU": "Education & Skilling", "HTT": "Hospitality, Travel & Tourism", "HR": "HR & Workforce Services"}


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
    body = json.dumps({"input": text, "task_type": "RETRIEVAL_DOCUMENT"}).encode()
    req = urllib.request.Request(EMB + "/embeddings/text", data=body, method="POST",
                                 headers={"Authorization": "Bearer " + EKEY,
                                          "Content-Type": "application/json"})
    d = json.load(urllib.request.urlopen(req))
    if not d.get("embedding"):
        raise RuntimeError("no embedding in response: " + json.dumps(d)[:200])
    return d["embedding"]


def build_text(o):
    prefix = o["code"].split("-")[1] if "-" in o["code"] else ""
    stream = STREAM.get(prefix, "")
    ctx = o.get("occupations_context") or []
    domain = ctx[0]["domains"]["name"] if ctx and ctx[0].get("domains") else ""
    codes = ", ".join(sorted({r["profile_code"] for r in (o.get("riasec_profiles") or [])}))
    lines = [f"Occupation: {o['name']}",
             f"Stream: {stream}",
             f"Field: {domain}",
             f"RIASEC interest codes: {codes}",
             "Key responsibilities:"]
    for c in (o.get("occupations_capabilities_master") or []):
        cm = c.get("capabilities_master") or {}
        if cm.get("name"):
            lines.append(f"- {cm['name']}: {cm.get('description', '')}")
    return "\n".join(lines)


def vec_literal(v):
    return "[" + ",".join(f"{x:.6f}" for x in v) + "]"


def main():
    occ = sb_get("/occupations?select=id,code,name,"
                 "riasec_profiles(profile_code),"
                 "occupations_context(domains(name)),"
                 "occupations_capabilities_master(capabilities_master(name,description))"
                 "&order=code&limit=5000")
    print(f"Fetched {len(occ)} occupations. Embedding via {EMB} ...")
    print("\n--- sample document ---\n" + build_text(occ[0]) + "\n-----------------------\n")

    results = []  # (id, code, vector)
    for i, o in enumerate(occ, 1):
        for attempt in range(3):
            try:
                results.append((o["id"], o["code"], embed(build_text(o))))
                break
            except Exception as e:
                if attempt == 2:
                    print(f"  ! FAILED {o['code']}: {e}")
                else:
                    time.sleep(1.5)
        if i % 25 == 0:
            print(f"  {i}/{len(occ)} embedded")

    print(f"Embedded {len(results)}/{len(occ)}")

    # ---- write seed ----
    hdr = ("-- ============================================================================\n"
           "-- Seed: Occupation Embeddings (1536-dim, gemini-embedding-2-preview)\n"
           "-- GENERATED by scripts/generate-occupation-embeddings.py from the corrected\n"
           "-- occupations + domains + capabilities. Do not hand-edit.\n"
           f"-- Total: {len(results)} occupation vectors.\n"
           "-- ============================================================================\n\n")
    # Seed keys by occupation CODE (stable), NOT id (uuid regenerates on db reset),
    # resolving o.id via JOIN so it survives reseeds.
    rows = []
    for oid, code, vec in results:
        rows.append(f"  ('{code}', '{vec_literal(vec)}')")
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
        print("Skipped DB apply (--no-apply). Run `supabase db reset` or the seed to load.")


if __name__ == "__main__":
    main()

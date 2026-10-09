import { describe, expect, it, vi, beforeEach } from "vitest";
import { handleGetCareerCredits } from "../handlers/credits.js";

vi.mock("../../../lib/supabase.js", () => ({
  createSupabaseAdminClient: vi.fn(),
}));

import { createSupabaseAdminClient } from "../../../lib/supabase.js";

const PRODUCT = "prod-uuid-1";

function get(url: string): Request {
  return new Request(`https://pages.local/api/career/credits${url}`, { method: "GET" });
}

function chainable(result: { data: unknown; error: unknown }) {
  const chain: Record<string, (...args: unknown[]) => unknown> = {};
  chain.select = () => chain;
  chain.eq = () => chain;
  chain.maybeSingle = async () => result;
  chain.upsert = async () => ({ data: null, error: null });
  return chain;
}

function supabaseFake(cacheRow: unknown, upserted: unknown[] = []) {
  return {
    from: (table: string) => {
      if (table === "user_ai_credit_accounts_cache" && (cacheRow === "ROWS")) {
        return chainable({ data: null, error: null });
      }
      if (table === "user_ai_credit_accounts_cache") {
        const chain = chainable({ data: cacheRow, error: null });
        const origUpsert = chain.upsert;
        chain.upsert = async (row: unknown) => {
          upserted.push(row);
          return origUpsert(row);
        };
        return chain;
      }
      return chainable({ data: null, error: null });
    },
  };
}

const ssoBalance = (overrides: Record<string, unknown> = {}) => ({
  ok: true as const,
  account_id: "acct-1",
  granted_credits: "30",
  spent_credits: "5",
  remaining_credits: "25",
  revision: 3,
  active_operation_id: null,
  has_pending_cost: false,
  ...overrides,
});

describe("GET /career/credits", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("serves the cached balance without touching SSO", async () => {
    let ssoCalls = 0;
    vi.mocked(createSupabaseAdminClient).mockReturnValue(supabaseFake({
      id: "acct-1", user_id: "u-1", product_id: PRODUCT, scope: "career_ai",
      granted_credits: "30", spent_credits: "5", revision: 2,
      updated_at: "t", synced_at: "t",
    }) as never);
    const env = {
      CREDIT_PRODUCT_UUID: PRODUCT,
      SSO_SERVICE: { getCareerCredits: async () => { ssoCalls += 1; return ssoBalance(); } },
    } as never;
    const res = await handleGetCareerCredits(get(""), env, "u-1");
    expect(res.status).toBe(200);
    const body = (await res.json()) as { data: Record<string, unknown> };
    expect(body.data).toMatchObject({ granted_credits: "30", spent_credits: "5", remaining_credits: "25", fresh: false });
    expect(ssoCalls).toBe(0);
  });

  it("refreshes canonically and revision-gates the cache", async () => {
    const upserted: unknown[] = [];
    vi.mocked(createSupabaseAdminClient).mockReturnValue(supabaseFake(null, upserted) as never);
    const env = {
      CREDIT_PRODUCT_UUID: PRODUCT,
      SSO_SERVICE: { getCareerCredits: async () => ssoBalance() },
    } as never;
    const res = await handleGetCareerCredits(get("?refresh=1"), env, "u-1");
    expect(res.status).toBe(200);
    const body = (await res.json()) as { data: Record<string, unknown> };
    expect(body.data).toMatchObject({ fresh: true, revision: 3, has_pending_cost: false });
    expect(upserted).toHaveLength(1);
    expect(upserted[0]).toMatchObject({ id: "acct-1", revision: 3 });
  });

  it("never reports outage as exhaustion", async () => {
    vi.mocked(createSupabaseAdminClient).mockReturnValue(supabaseFake(null) as never);
    const down = {
      CREDIT_PRODUCT_UUID: PRODUCT,
      SSO_SERVICE: { getCareerCredits: async () => { throw new Error("socket hang up"); } },
    } as never;
    const res = await handleGetCareerCredits(get("?refresh=1"), down, "u-1");
    expect(res.status).toBe(503);
    expect(await res.text()).toContain("UNAVAILABLE");
    const missing = { CREDIT_PRODUCT_UUID: PRODUCT } as never;
    const res2 = await handleGetCareerCredits(get("?refresh=1"), missing, "u-1");
    expect(res2.status).toBe(503);
  });

  it("fails closed without product config", async () => {
    const res = await handleGetCareerCredits(get(""), {} as never, "u-1");
    expect(res.status).toBe(500);
  });
});

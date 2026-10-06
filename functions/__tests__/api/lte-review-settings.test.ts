import { beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({
  query: vi.fn(),
  queryOne: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
}));
const orgs = vi.hoisted(() => ({ value: null as unknown }));
const scopes = vi.hoisted(() => ({ value: null as unknown }));

vi.mock("../../lib/auth", () => ({
  withAuth: (handler: unknown) => handler,
  getContextUser: () => ({ id: "00000000-0000-4000-8000-000000000001" }),
}));
vi.mock("../../lib/response", () => ({
  apiSuccess: (data: unknown) => Response.json({ success: true, data }),
  apiError: (status: number, code: string) =>
    Response.json({ success: false, error: { code } }, { status }),
}));
vi.mock("../../lib/lte/review-admin", () => ({
  adminOrganizationsFor: vi.fn(async () => orgs.value),
  adminScopesFor: vi.fn(async () => scopes.value),
}));
vi.mock("../../api/internal/lte/v1/readonly-db", () => ({ createReadOnlyDb: () => db }));
vi.mock("../../api/internal/lte/v1/write-db", () => ({
  createWriteDb: () => db,
  WriteDbError: class WriteDbError extends Error {
    constructor(
      message: string,
      readonly status: number,
      readonly code?: string,
    ) {
      super(message);
    }
  },
}));

import { WriteDbError } from "../../api/internal/lte/v1/write-db";
import { onRequestGet, onRequestPut } from "../../api/lte-review-settings";

const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const SCHOOL = id(3);
const COLLEGE = id(2);
const call = (handler: unknown, init?: { method?: string; body?: unknown }) =>
  (handler as (c: unknown) => Promise<Response>)({
    // No environment flag is required for this endpoint.
    env: {},
    request: new Request("https://example.test/api/lte-review-settings", {
      method: init?.method ?? "GET",
      body: init?.body === undefined ? undefined : JSON.stringify(init.body),
    }),
  });
const put = (body: unknown) => call(onRequestPut, { method: "PUT", body });

describe("lte-review-settings (one choice per organization)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    orgs.value = [
      { organizationId: SCHOOL, orgType: "school", name: "Soundarya School" },
      { organizationId: COLLEGE, orgType: "college", name: "Soundarya College" },
    ];
    scopes.value = [{ scopeId: id(5), scopeType: "school_class", organizationId: SCHOOL, name: "5A" }];
    db.query.mockResolvedValue([]);
    db.queryOne.mockResolvedValue(null);
  });

  it("lists the organizations the caller administers, defaulting to AI-first", async () => {
    const body = (await (await call(onRequestGet)).json()) as {
      data: { organizations: Array<Record<string, unknown>>; scopes: unknown[] };
    };
    expect(body.data.organizations).toEqual([
      { organizationId: SCHOOL, orgType: "school", name: "Soundarya School", evaluationMode: "ai_first" },
      { organizationId: COLLEGE, orgType: "college", name: "Soundarya College", evaluationMode: "ai_first" },
    ]);
    // Classes/programs are only listed so reviewers can be chosen per one.
    expect(body.data.scopes).toEqual([{ scopeId: id(5), scopeType: "school_class", name: "5A" }]);
  });

  it("shows a saved human-only choice", async () => {
    db.query.mockResolvedValue([
      { id: id(90), organization_id: SCHOOL, evaluation_mode: "human_only" },
    ]);
    const body = (await (await call(onRequestGet)).json()) as {
      data: { organizations: Array<{ organizationId: string; evaluationMode: string }> };
    };
    expect(body.data.organizations.find((o) => o.organizationId === SCHOOL)?.evaluationMode).toBe(
      "human_only",
    );
    expect(body.data.organizations.find((o) => o.organizationId === COLLEGE)?.evaluationMode).toBe(
      "ai_first",
    );
  });

  it("rejects a caller without an administrator role", async () => {
    orgs.value = Response.json({ success: false }, { status: 403 });
    expect((await call(onRequestGet)).status).toBe(403);
    expect((await put({ organizationId: SCHOOL, evaluationMode: "human_only" })).status).toBe(403);
  });

  it("creates the organization's row the first time", async () => {
    const response = await put({ organizationId: SCHOOL, evaluationMode: "human_only" });
    expect(response.status).toBe(200);
    expect(db.insert).toHaveBeenCalledWith(
      "lte_review_org_settings",
      expect.objectContaining({
        organization_id: SCHOOL,
        evaluation_mode: "human_only",
        updated_by: id(1),
      }),
    );
  });

  it("updates the existing row and can switch back to AI-first", async () => {
    db.queryOne.mockResolvedValue({ id: id(90), organization_id: SCHOOL, evaluation_mode: "human_only" });
    const response = await put({ organizationId: SCHOOL, evaluationMode: "ai_first" });
    expect(response.status).toBe(200);
    expect(db.update).toHaveBeenCalledWith(
      "lte_review_org_settings",
      id(90),
      expect.objectContaining({ evaluation_mode: "ai_first" }),
    );
    expect(db.insert).not.toHaveBeenCalled();
  });

  it("applies the choice when a concurrent admin created the row first", async () => {
    db.insert.mockRejectedValue(new WriteDbError("duplicate", 409, "23505"));
    db.queryOne
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: id(91), organization_id: SCHOOL, evaluation_mode: "ai_first" });
    expect((await put({ organizationId: SCHOOL, evaluationMode: "human_only" })).status).toBe(200);
    expect(db.update).toHaveBeenCalledWith(
      "lte_review_org_settings",
      id(91),
      expect.objectContaining({ evaluation_mode: "human_only" }),
    );
  });

  it("returns a generic 503 (no internals) when the database write fails", async () => {
    db.insert.mockRejectedValue(new Error("connection reset: secret-host"));
    const response = await put({ organizationId: SCHOOL, evaluationMode: "human_only" });
    expect(response.status).toBe(503);
    expect(JSON.stringify(await response.json())).not.toContain("secret-host");
  });

  it("does not reveal or modify an organization the caller does not administer", async () => {
    const response = await put({ organizationId: id(77), evaluationMode: "human_only" });
    expect(response.status).toBe(404);
    expect(db.insert).not.toHaveBeenCalled();
    expect(db.update).not.toHaveBeenCalled();
  });

  it("rejects unknown fields, invalid modes and class/program-level attempts", async () => {
    for (const body of [
      { organizationId: SCHOOL, evaluationMode: "nope" },
      { organizationId: SCHOOL, evaluationMode: "ai_first", enabled: false },
      { scopeId: id(5), scopeType: "school_class", evaluationMode: "human_only" },
    ]) {
      expect((await put(body)).status).toBe(400);
    }
    expect(db.insert).not.toHaveBeenCalled();
  });
});

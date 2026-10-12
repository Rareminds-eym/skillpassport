import { beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({
  query: vi.fn(),
  queryOne: vi.fn(),
  insert: vi.fn(),
  remove: vi.fn(),
}));
const scopesResult = vi.hoisted(() => ({ value: null as unknown }));
const teaching = vi.hoisted(() => ({ ids: [] as string[] | null }));

vi.mock("../../lib/auth", () => ({
  withAuth: (handler: unknown) => handler,
  getContextUser: () => ({ id: "00000000-0000-4000-8000-000000000001" }),
}));
vi.mock("../../lib/response", () => ({
  apiSuccess: (data: unknown) => Response.json({ success: true, data }),
  apiError: (status: number, code: string) =>
    Response.json({ success: false, error: { code } }, { status }),
}));
vi.mock("../../api/internal/lte/v1/actions/review-admin-scopes", () => ({
  handleReviewAdminScopes: vi.fn(async () => scopesResult.value),
}));
vi.mock("../../api/internal/lte/v1/actions/review-scope", () => ({
  schoolCandidates: vi.fn(async () => teaching.ids),
  collegeCandidates: vi.fn(async () => teaching.ids),
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
import {
  onRequestDelete,
  onRequestGet,
  onRequestPost,
} from "../../api/lte-review-scope-reviewers";

const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const CLASS = id(5);
const ORG = id(3);
const adminScopes = {
  ok: true,
  data: [{ scopeId: CLASS, scopeType: "school_class", organizationId: ORG, name: "Class 5" }],
};
const call = (
  handler: unknown,
  opts: { method?: string; query?: string; body?: unknown } = {},
) =>
  (handler as (c: unknown) => Promise<Response>)({
    env: {},
    request: new Request(`https://example.test/api/lte-review-scope-reviewers${opts.query ?? ""}`, {
      method: opts.method ?? "GET",
      body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
    }),
  });
const educatorRow = (n: number, first = "Ed") => ({
  user_id: id(n),
  first_name: first,
  last_name: String(n),
  email: `e${n}@example.test`,
});
const q = `?scopeId=${CLASS}&scopeType=school_class`;

describe("lte-review-scope-reviewers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    scopesResult.value = adminScopes;
    teaching.ids = [];
    db.query.mockResolvedValue([]);
    db.queryOne.mockResolvedValue(null);
  });

  it("lists every active educator of the organization and flags teaching/designated ones", async () => {
    teaching.ids = [id(10)];
    db.query.mockImplementation(async (path: string) => {
      if (path.startsWith("school_educators?")) return [educatorRow(10), educatorRow(11), educatorRow(12)];
      if (path.startsWith("lte_review_scope_reviewers?"))
        return [{ id: id(90), reviewer_user_id: id(11) }];
      return [];
    });
    const body = (await (await call(onRequestGet, { query: q })).json()) as {
      data: { teachingCount: number; designatedCount: number; educators: Array<Record<string, unknown>> };
    };
    expect(body.data.teachingCount).toBe(1);
    expect(body.data.designatedCount).toBe(1);
    expect(body.data.educators).toEqual([
      expect.objectContaining({ userId: id(10), teaching: true, designated: false }),
      expect.objectContaining({ userId: id(11), teaching: false, designated: true }),
      expect.objectContaining({ userId: id(12), teaching: false, designated: false }),
    ]);
    // Educators are listed only from the administrator's own organization.
    expect(db.query).toHaveBeenCalledWith(expect.stringContaining(`school_id=eq.${ORG}&account_status=eq.active`));
  });

  it("does not count a stale designation of someone no longer an active educator", async () => {
    db.query.mockImplementation(async (path: string) => {
      if (path.startsWith("school_educators?")) return [educatorRow(10)];
      if (path.startsWith("lte_review_scope_reviewers?"))
        return [{ id: id(90), reviewer_user_id: id(99) }];
      return [];
    });
    const body = (await (await call(onRequestGet, { query: q })).json()) as {
      data: { designatedCount: number };
    };
    expect(body.data.designatedCount).toBe(0);
  });

  it("404s for a scope the caller does not administer, on every method", async () => {
    const other = `?scopeId=${id(77)}&scopeType=school_class`;
    expect((await call(onRequestGet, { query: other })).status).toBe(404);
    expect(
      (await call(onRequestPost, {
        method: "POST",
        body: { scopeId: id(77), scopeType: "school_class", reviewerId: id(10) },
      })).status,
    ).toBe(404);
    expect(
      (await call(onRequestDelete, { method: "DELETE", query: `${other}&reviewerId=${id(10)}` })).status,
    ).toBe(404);
    expect(db.insert).not.toHaveBeenCalled();
    expect(db.remove).not.toHaveBeenCalled();
  });

  it("403s a caller without an administrator role", async () => {
    scopesResult.value = { ok: false, error: { code: "FORBIDDEN", message: "inactive" } };
    expect((await call(onRequestGet, { query: q })).status).toBe(403);
  });

  it("designates an active educator of the same organization", async () => {
    db.query.mockImplementation(async (path: string) =>
      path.startsWith("school_educators?") ? [educatorRow(10)] : [],
    );
    const res = await call(onRequestPost, {
      method: "POST",
      body: { scopeId: CLASS, scopeType: "school_class", reviewerId: id(10) },
    });
    expect(res.status).toBe(200);
    expect(db.insert).toHaveBeenCalledWith("lte_review_scope_reviewers", {
      school_class_id: CLASS,
      reviewer_user_id: id(10),
      created_by: id(1),
    });
    // Eligibility was checked against the admin's organization, narrowed to this educator.
    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining(`school_id=eq.${ORG}&account_status=eq.active&user_id=in.(${id(10)})`),
    );
  });

  it("rejects someone who is not an active educator of the organization", async () => {
    db.query.mockResolvedValue([]); // not returned by the organization-scoped lookup
    const res = await call(onRequestPost, {
      method: "POST",
      body: { scopeId: CLASS, scopeType: "school_class", reviewerId: id(55) },
    });
    expect(res.status).toBe(400);
    expect(db.insert).not.toHaveBeenCalled();
  });

  it("is idempotent when the educator is already designated", async () => {
    db.query.mockImplementation(async (path: string) =>
      path.startsWith("school_educators?")
        ? [educatorRow(10)]
        : [{ id: id(90), reviewer_user_id: id(10) }],
    );
    const res = await call(onRequestPost, {
      method: "POST",
      body: { scopeId: CLASS, scopeType: "school_class", reviewerId: id(10) },
    });
    expect(res.status).toBe(200);
    expect(db.insert).not.toHaveBeenCalled();
  });

  it("treats a concurrent duplicate insert as success", async () => {
    db.query.mockImplementation(async (path: string) =>
      path.startsWith("school_educators?") ? [educatorRow(10)] : [],
    );
    db.insert.mockRejectedValue(new WriteDbError("dup", 409, "23505"));
    expect(
      (await call(onRequestPost, {
        method: "POST",
        body: { scopeId: CLASS, scopeType: "school_class", reviewerId: id(10) },
      })).status,
    ).toBe(200);
  });

  it("caps the number of designated reviewers per scope", async () => {
    db.query.mockImplementation(async (path: string) =>
      path.startsWith("school_educators?")
        ? [educatorRow(10)]
        : Array.from({ length: 50 }, (_, i) => ({ id: id(200 + i), reviewer_user_id: id(300 + i) })),
    );
    const res = await call(onRequestPost, {
      method: "POST",
      body: { scopeId: CLASS, scopeType: "school_class", reviewerId: id(10) },
    });
    expect(res.status).toBe(400);
    expect(db.insert).not.toHaveBeenCalled();
  });

  it("rejects unknown fields", async () => {
    const res = await call(onRequestPost, {
      method: "POST",
      body: { scopeId: CLASS, scopeType: "school_class", reviewerId: id(10), organizationId: id(99) },
    });
    expect(res.status).toBe(400);
  });

  it("removes a designation, and is a no-op when none exists", async () => {
    db.queryOne.mockResolvedValueOnce({ id: id(90), reviewer_user_id: id(10) });
    expect(
      (await call(onRequestDelete, { method: "DELETE", query: `${q}&reviewerId=${id(10)}` })).status,
    ).toBe(200);
    expect(db.remove).toHaveBeenCalledWith("lte_review_scope_reviewers", id(90));
    db.remove.mockClear();
    expect(
      (await call(onRequestDelete, { method: "DELETE", query: `${q}&reviewerId=${id(10)}` })).status,
    ).toBe(200);
    expect(db.remove).not.toHaveBeenCalled();
  });

  it("returns a generic 503 when the database fails", async () => {
    db.query.mockRejectedValue(new Error("connection reset: secret-host"));
    const res = await call(onRequestGet, { query: q });
    expect(res.status).toBe(503);
    expect(JSON.stringify(await res.json())).not.toContain("secret-host");
  });
});

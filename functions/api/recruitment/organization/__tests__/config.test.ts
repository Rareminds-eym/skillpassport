// @vitest-environment node
import { beforeEach, it, expect, vi } from "vitest";
import { onRequestGet, onRequestPut } from "../config";
const mocks = vi.hoisted(() => ({ access: vi.fn(), from: vi.fn() }));
vi.mock("../../../../lib/auth", () => ({
  withAuth: (handler: unknown) => handler,
  getContextUser: (context: any) => ({
    ...context.data.user,
    id: context.data.user.sub,
  }),
}));
vi.mock("../../../../lib/supabase", () => ({
  getServiceClient: () => ({ from: mocks.from }),
}));
vi.mock("../../../../lib/permissions", () => ({
  verifyOrgAccess: mocks.access,
  PERMISSIONS: { MANAGE_TEAM: "manage_team" },
}));
let chain: any;
beforeEach(() => {
  vi.clearAllMocks();
  chain = {};
  for (const name of ["select", "eq", "upsert"])
    chain[name] = vi.fn().mockReturnValue(chain);
  chain.single = vi
    .fn()
    .mockResolvedValue({ data: { organization_id: "org-a" }, error: null });
  mocks.from.mockReturnValue(chain);
  mocks.access.mockResolvedValue({ allowed: true });
});
const context = (body?: unknown) =>
  ({
    request: new Request(
      "http://localhost/api/recruitment/organization/config?org_id=org-a",
      body ? { method: "PUT", body: JSON.stringify(body) } : {},
    ),
    env: {},
    data: { user: { sub: "admin-a" } },
  }) as any;
it("uses the authenticated user id and a defined administrator permission for writes", async () => {
  const response = await onRequestPut(
    context({ org_id: "org-a", career_page_enabled: true }),
  );
  expect(response.status).toBe(200);
  expect(mocks.access).toHaveBeenCalledWith(
    expect.anything(),
    "admin-a",
    "org-a",
    "manage_team",
  );
  expect(chain.upsert).toHaveBeenCalledWith(
    expect.objectContaining({
      organization_id: "org-a",
      career_page_enabled: true,
    }),
    { onConflict: "organization_id" },
  );
});
it("rejects a non-admin before writing configuration", async () => {
  mocks.access.mockResolvedValue({
    allowed: false,
    error: new Response(null, { status: 403 }),
  });
  expect(
    (
      await onRequestPut(
        context({ org_id: "org-a", career_page_enabled: true }),
      )
    ).status,
  ).toBe(403);
  expect(chain.upsert).not.toHaveBeenCalled();
});
it("returns documented defaults for an organization without saved configuration", async () => {
  chain.single.mockResolvedValue({ data: null, error: { code: "PGRST116" } });
  const response = await onRequestGet(context());
  expect(response.status).toBe(200);
  expect((await response.json()).exists).toBe(false);
  expect(chain.eq).toHaveBeenCalledWith("organization_id", "org-a");
});
it("rejects malformed workflow records before persistence", async () => {
  expect(
    (
      await onRequestPut(
        context({
          org_id: "org-a",
          default_hiring_workflow: [{ stage: "interview" }],
        }),
      )
    ).status,
  ).toBe(400);
  expect(chain.upsert).not.toHaveBeenCalled();
});

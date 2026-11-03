// @vitest-environment node
import { beforeEach, describe, it, expect, vi } from "vitest";
import { onRequest } from "../projects";
const mocks = vi.hoisted(() => ({
  scope: vi.fn(),
  from: vi.fn(),
  remove: vi.fn(),
  rpc: vi.fn(),
}));
vi.mock("../../../lib/auth", () => ({
  withAuth: (handler: unknown) => handler,
  getContextUser: () => ({ id: "viewer" }),
}));
vi.mock("../../../lib/supabase", () => ({
  getServiceClient: () => ({ from: mocks.from, rpc: mocks.rpc }),
}));
vi.mock("../../../lib/recruitment-scope", () => ({
  recruitmentScope: mocks.scope,
  RecruitmentAccessError: class extends Error {},
}));
const projectId = "11111111-1111-4111-8111-111111111111",
  recordId = "22222222-2222-4222-8222-222222222222";
const request = (body: unknown) =>
  onRequest({
    request: new Request("http://localhost/api/recruiter/projects", {
      method: "POST",
      body: JSON.stringify(body),
    }),
    env: {},
  });
beforeEach(() => {
  vi.clearAllMocks();
  mocks.scope.mockImplementation(async (_db, _user, permission) => {
    if (permission !== "view_candidates")
      throw new Error("Viewer cannot mutate");
    return { orgId: "own-org" };
  });
  mocks.from.mockImplementation((table: string) => {
    const chain: any = {};
    for (const name of ["select", "eq"])
      chain[name] = vi.fn().mockReturnValue(chain);
    chain.delete = mocks.remove.mockReturnValue(chain);
    chain.maybeSingle = vi
      .fn()
      .mockResolvedValue({
        data:
          table === "recruitment_projects"
            ? { id: projectId, organization_id: "own-org", status: "draft" }
            : { id: recordId, status: "submitted" },
        error: null,
      });
    chain.then = (resolve: any) =>
      Promise.resolve({ error: null }).then(resolve);
    return chain;
  });
});
describe("Project action dispatch rejects aliases before authorizing records", () => {
  it.each([
    "arbitrary-delete",
    "proposal-extra-delete",
    "milestone-extra-delete",
  ])("rejects %s without deleting with viewer access", async (action) => {
    const response = await request({ action, projectId, id: recordId });
    expect(response.status).toBe(400);
    expect(mocks.remove).not.toHaveBeenCalled();
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it.each([null, {}, { action: 42 }, { action: null }])(
    "returns a validation error for malformed dispatch input %#",
    async (body) => {
      expect((await request(body)).status).toBe(400);
      expect(mocks.remove).not.toHaveBeenCalled();
    },
  );
});

// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { handleCatalogue } from "../../../../../api/internal/lte/v1/actions/catalogue";
import { handleLearningTrack } from "../../../../../api/internal/lte/v1/actions/learning-track";
import type { GatewayContext } from "../../../../../api/internal/lte/v1/types";
vi.mock("../../../../../api/internal/lte/v1/actions/learning-track", () => ({
  handleLearningTrack: vi.fn(),
}));
const user = "11111111-1111-4111-8111-111111111111";
const role = "22222222-2222-4222-8222-222222222222";
const ctx = {
  userId: user,
  env: {
    SP_DASH_CATALOG_URL: "https://catalogue.example",
    LTE_CATALOG_SYNC_SECRET: "a-test-secret-that-is-at-least-32-characters",
  },
} as GatewayContext;
beforeEach(() => vi.resetAllMocks());
afterEach(() => vi.unstubAllGlobals());
describe("catalogue gateway authorization", () => {
  it("rejects another learner before reading assessments", async () => {
    const result = await handleCatalogue(ctx, {
      userId: role,
      roleIds: [role],
    });
    expect(result).toMatchObject({ ok: false, error: { code: "FORBIDDEN" } });
    expect(handleLearningTrack).not.toHaveBeenCalled();
  });
  it("rejects roles outside the learner assessment", async () => {
    vi.mocked(handleLearningTrack).mockResolvedValue({
      ok: true,
      data: { found: true, tracks: [{ roleId: user }] },
    });
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    expect(
      await handleCatalogue(ctx, { userId: user, roleIds: [role] }),
    ).toMatchObject({ ok: false, error: { code: "FORBIDDEN" } });
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it("serves catalogue data through SkillPassport for recommended roles", async () => {
    vi.mocked(handleLearningTrack).mockResolvedValue({
      ok: true,
      data: { found: true, tracks: [{ roleId: role }] },
    });
    const payload = { version: 1, tables: { roles: [{ id: role }] } };
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify(payload)));
    vi.stubGlobal("fetch", fetchMock);
    expect(
      await handleCatalogue(ctx, { userId: user, roleIds: [role] }),
    ).toEqual({ ok: true, data: payload });
    expect(fetchMock.mock.calls[0][1].headers["x-lte-signature"]).toMatch(
      /^[a-f0-9]{64}$/,
    );
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({
      roleIds: [role],
    });
  });
});

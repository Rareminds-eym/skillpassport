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
    LTE_INTERNAL_SECRET: "a-test-secret-that-is-at-least-32-characters",
  },
} as GatewayContext;
beforeEach(() => vi.resetAllMocks());
afterEach(() => vi.unstubAllGlobals());
describe("catalogue gateway authorization", () => {
  it.each(['qa', 'production', 'development', undefined])('uses only the configured URL for %s', async ENVIRONMENT => {
    vi.mocked(handleLearningTrack).mockResolvedValue({ ok: true, data: { tracks: [{ roleId: role }] } });
    const fetchMock = vi.fn().mockResolvedValue(Response.json({ tracks: [] }));
    vi.stubGlobal('fetch', fetchMock);
    const configured = { ...ctx, env: { ...ctx.env, ENVIRONMENT } };
    expect(await handleCatalogue(configured, { userId: user, roleIds: [role] })).toMatchObject({ ok: true });
    expect(fetchMock.mock.calls[0][0].href).toBe(new URL('/api/internal/lte/catalog', ctx.env.SP_DASH_CATALOG_URL).href);
  });
  it.each(['qa', 'production', 'development', undefined])('reports a missing URL for %s without fetching another source', async ENVIRONMENT => {
    vi.mocked(handleLearningTrack).mockResolvedValue({ ok: true, data: { tracks: [{ roleId: role }] } });
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const missing = { ...ctx, env: { ...ctx.env, ENVIRONMENT, SP_DASH_CATALOG_URL: undefined } };
    expect(await handleCatalogue(missing, { userId: user, roleIds: [role] })).toMatchObject({ ok: false, error: { code: 'CATALOGUE_UNAVAILABLE' } });
    expect(fetchMock).not.toHaveBeenCalled();
  });
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

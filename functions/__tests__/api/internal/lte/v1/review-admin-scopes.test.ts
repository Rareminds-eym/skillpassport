import { describe, expect, it, vi } from "vitest";
import { handleReviewAdminScopes } from "../../../../../api/internal/lte/v1/actions/review-admin-scopes";
import type { GatewayContext } from "../../../../../api/internal/lte/v1/types";

const id = (n: number) =>
  `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
function fixture(memberships: unknown[]) {
  const query = vi.fn(async (path: string) => {
    if (path.startsWith("departments?"))
      return [{ id: id(4), college_id: id(2) }];
    if (path.startsWith("programs?"))
      return [{ id: id(5), department_id: id(4), name: "Program" }];
    if (path.startsWith("school_classes?"))
      return [
        {
          id: id(6),
          school_id: id(3),
          name: "Class",
          academic_year: "2026-27",
        },
      ];
    throw new Error(path);
  });
  const ctx = {
    userId: id(1),
    db: { query },
    env: {
      SSO_SERVICE: {
        getUserById: vi
          .fn()
          .mockResolvedValue({ is_blocked: false, is_email_verified: true }),
        getUserMemberships: vi.fn().mockResolvedValue({ memberships }),
      },
    },
  } as unknown as GatewayContext;
  return { ctx, query };
}
describe("institution administrator role authority", () => {
  it("accepts college and school admin roles after the educator role", async () => {
    const { ctx, query } = fixture([
      {
        org_id: id(2),
        status: "active",
        role: "educator",
        roles: ["educator", "college_admin"],
      },
      {
        org_id: id(3),
        status: "active",
        role: "educator",
        roles: ["educator", "school_admin"],
      },
    ]);
    expect(await handleReviewAdminScopes(ctx, {})).toMatchObject({
      ok: true,
      data: [
        { scopeId: id(5), organizationId: id(2) },
        { scopeId: id(6), organizationId: id(3) },
      ],
    });
    expect(query.mock.calls[0][0]).toContain(`college_id=in.(${id(2)})`);
    expect(query.mock.calls[2][0]).toContain(`school_id=in.(${id(3)})`);
  });
  it("rejects inactive memberships and does not merge roles between institutions", async () => {
    const { ctx, query } = fixture([
      {
        org_id: id(2),
        status: "suspended",
        role: "college_admin",
        roles: ["college_admin"],
      },
      {
        org_id: id(3),
        status: "active",
        role: "educator",
        roles: ["educator"],
      },
    ]);
    expect(await handleReviewAdminScopes(ctx, {})).toEqual({
      ok: true,
      data: [],
    });
    expect(query).not.toHaveBeenCalled();
  });
  it("supports the legacy single-role response during consumer-first rollout", async () => {
    const { ctx } = fixture([
      { org_id: id(2), status: "active", role: "college_admin" },
    ]);
    expect(await handleReviewAdminScopes(ctx, {})).toMatchObject({
      ok: true,
      data: [{ scopeId: id(5) }],
    });
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";
import { handleReviewEvent } from "../../../../../api/internal/lte/v1/actions/review-event";
import type { GatewayContext } from "../../../../../api/internal/lte/v1/types";
const mocks = vi.hoisted(() => ({ rpc: vi.fn(), email: vi.fn() }));
vi.mock("../../../../../lib/supabase", () => ({ getServiceClient: () => ({ rpc: mocks.rpc }) }));
vi.mock("../../../../../lib/realtime", () => ({ notifyRealtime: vi.fn() }));
vi.mock("../../../../../api/internal/lte/v1/actions/review-email", () => ({ deliverReviewEmail: mocks.email }));
const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const event = { schemaVersion: 1, eventId: id(1), occurredAt: "2026-10-06T00:00:00Z", reviewId: id(2), submissionId: id(3), assignmentVersion: 1, learnerId: id(4), reviewerId: id(5), scopeId: null, scopeType: null, decision: "pass", score: 80 };
const ctx = { userId: id(4), env: {} } as GatewayContext;
describe("null-scope review events", () => {
 beforeEach(() => { vi.clearAllMocks(); mocks.rpc.mockResolvedValue({ data: { evidenceRecorded: true }, error: null }); });
 it("persists institution-wide reviewed evidence", async () => {
  expect(await handleReviewEvent(ctx, { type: "lte.artifact_reviewed_pass", event })).toEqual({ ok: true, data: { evidenceRecorded: true } });
  expect(mocks.rpc).toHaveBeenCalledWith("apply_lte_review_event", { p_actor: id(4), p_type: "lte.artifact_reviewed_pass", p_payload: event });
 });
 it.each([{ scopeId: id(6) }, { scopeType: "school_class" }, { learnerId: id(9) }])("rejects an inconsistent scope or subject %j", async overrides => {
  expect((await handleReviewEvent(ctx, { type: "lte.artifact_reviewed_pass", event: { ...event, ...overrides } })).ok).toBe(false);
  expect(mocks.rpc).not.toHaveBeenCalled();
 });
});

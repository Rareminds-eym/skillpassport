// @vitest-environment node
import { beforeEach, describe, it, expect, vi } from "vitest";
import { onRequest } from "../pipeline-actions";
const mocks = vi.hoisted(() => ({
  from: vi.fn(),
  rpc: vi.fn(),
  scope: vi.fn(),
  send: vi.fn(),
  access: vi.fn(),
  contact: vi.fn(),
}));
vi.mock("../../../lib/auth", () => ({
  withAuth: (handler: unknown) => handler,
  getContextUser: () => ({ id: "actor" }),
}));
vi.mock("../../../lib/supabase", () => ({
  getServiceClient: () => ({ from: mocks.from, rpc: mocks.rpc }),
}));
vi.mock("../../../lib/recruitment-scope", () => ({
  recruitmentScope: mocks.scope,
  RecruitmentAccessError: class extends Error {},
}));
vi.mock("../../../lib/emailService", () => ({ sendEmail: mocks.send }));
vi.mock("../../../shared/lib/subscription-access", () => ({ requireSubscriptionAccess: mocks.access,
  readRecruiterContactPermissions: mocks.contact }));
const candidateId = "11111111-1111-4111-8111-111111111111",
  requestKey = "22222222-2222-4222-8222-222222222222",
  learnerId = "33333333-3333-4333-8333-333333333333",
  learnerUserId = "44444444-4444-4444-8444-444444444444";
let rows: any[], submissions: any[], candidates: any[];
const chains: any = {};
function chain(table: string) {
  const q: any = {};
  for (const method of ["select", "eq", "in", "or", "insert", "update", "single"])
    q[method] = vi.fn().mockReturnValue(q);
  q.then = (resolve: any) =>
    Promise.resolve(
      table === "pipeline_candidates"
        ? { data: rows, error: null }
        : table === "zoho_recruiter_learners" ? { data: candidates, error: null }
        : submissions.shift(),
    ).then(resolve);
  chains[table] = q;
  return q;
}
const request = (
  body: any,
  env: any = { EMAIL_SERVICE: { sendEmail: vi.fn() } },
) =>
  onRequest({
    request: new Request("http://localhost/api/recruiter/pipeline-actions", {
      method: "POST",
      body: JSON.stringify(body),
    }),
    env,
  });
beforeEach(() => {
  vi.clearAllMocks();
  mocks.scope.mockResolvedValue({ orgId: "org", memberIds: ["actor"] });
  mocks.access.mockResolvedValue({ current: { access: "full" } });
  mocks.contact.mockResolvedValue(new Map([[learnerId, { email: true }]]));
  candidates = [{ id: learnerId, user_id: learnerUserId, email: "current@example.test" }];
  rows = [
    {
      id: candidateId,
      learner_id: learnerId,
      candidate_name: "Candidate",
      candidate_email: "fixture@example.test",
    },
  ];
  submissions = [{ data: { id: "submission" }, error: null }, { error: null }];
  mocks.from.mockImplementation(chain);
  mocks.rpc.mockResolvedValue({ data: { count: 1 }, error: null });
  mocks.send.mockResolvedValue({ success: true, messageId: "provider-id" });
});
describe("Pipeline operations", () => {
  it("authorizes every selected record before assignment or email", async () => {
    rows = [];
    expect(
      (
        await request({
          action: "email",
          ids: [candidateId],
          requestKey,
          subject: "Subject",
          message: "Message",
        })
      ).status,
    ).toBe(403);
    expect(mocks.send).not.toHaveBeenCalled();
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it("uses the atomic operation with the authenticated organization and actor", async () => {
    expect(
      (
        await request({
          action: "reject",
          ids: [candidateId],
          reason: "Screening outcome",
        })
      ).status,
    ).toBe(200);
    expect(mocks.rpc).toHaveBeenCalledWith(
      "recruitment_pipeline_operation",
      expect.objectContaining({
        p_org: "org",
        p_actor: "actor",
        p_ids: [candidateId],
        p_action: "reject",
      }),
    );
  });
  it("does not claim email success when the provider is unavailable", async () => {
    expect(
      (
        await request(
          {
            action: "email",
            ids: [candidateId],
            requestKey,
            subject: "Subject",
            message: "Message",
          },
          {},
        )
      ).status,
    ).toBe(503);
    expect(mocks.send).not.toHaveBeenCalled();
    expect(mocks.from).not.toHaveBeenCalledWith(
      "recruitment_email_submissions",
    );
  });
  it("escapes message HTML and records provider submission rather than delivery", async () => {
    const response = await request({
      action: "email",
      ids: [candidateId],
      requestKey,
      subject: "Subject",
      message: "<script>test</script>",
    });
    expect(response.status).toBe(200);
    expect(mocks.send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "current@example.test",
        html: expect.stringContaining("&lt;script&gt;"),
      }),
      expect.anything(),
    );
    expect(await response.json()).toMatchObject({ data: { results: [{ state: "submitted" }] } });
    expect(chains.recruitment_email_submissions.update).toHaveBeenCalledWith({
      state: "submitted",
      provider_message_id: "provider-id",
    });
  });
  it("marks uncertain outcomes without automatically resending", async () => {
    mocks.send.mockRejectedValue(new Error("Connection interrupted"));
    const response = await request({
      action: "email",
      ids: [candidateId],
      requestKey,
      subject: "Subject",
      message: "Message",
    });
    expect(await response.json()).toMatchObject({ data: { results: [{ state: "unknown" }] } });
    expect(mocks.send).toHaveBeenCalledOnce();
  });
  it("does not resend a previously submitted idempotency key", async () => {
    submissions = [
      { error: { code: "23505" } },
      { data: { state: "submitted" }, error: null },
    ];
    const response = await request({
      action: "email",
      ids: [candidateId],
      requestKey,
      subject: "Subject",
      message: "Message",
    });
    expect(await response.json()).toMatchObject({ data: { results: [{ state: "submitted" }] } });
    expect(mocks.send).not.toHaveBeenCalled();
  });
  it("rejects an invalid recipient before any delivery or claim", async () => {
    candidates[0].email = "invalid";
    expect(
      (
        await request({
          action: "email",
          ids: [candidateId],
          requestKey,
          subject: "Subject",
          message: "Message",
        })
      ).status,
    ).toBe(503);
    expect(mocks.send).not.toHaveBeenCalled();
  });
  it.each(["assign", "reject", "email"])("denies %s before resource queries when the lifecycle denies writes", async action => {
    mocks.access.mockResolvedValue(Response.json({ error: "Denied" }, { status: 403 }));
    expect((await request({ action, ids: [candidateId] })).status).toBe(403);
    expect(mocks.access).toHaveBeenCalledWith(expect.objectContaining({ mode: "write", actorId: "actor", subject: { kind: "organization", id: "org" } }));
    expect(mocks.from).not.toHaveBeenCalled(); expect(mocks.rpc).not.toHaveBeenCalled(); expect(mocks.send).not.toHaveBeenCalled();
  });
  it("keeps members a read operation during retained read-only access", async () => {
    submissions = [{ data: [], error: null }];
    expect((await request({ action: "members" })).status).toBe(200);
    expect(mocks.access).toHaveBeenCalledWith(expect.objectContaining({ mode: "read" }));
  });
  it.each(["missing", "revoked", "ambiguous", "unavailable", "invalid_reference"])("blocks %s consent before a claim or delivery", async defect => {
    if (defect === "missing") candidates = [];
    if (defect === "revoked") mocks.contact.mockResolvedValue(new Map([[learnerId, { email: false }]]));
    if (defect === "ambiguous") candidates.push({ id: learnerUserId, user_id: learnerId, email: "other@example.test" });
    if (defect === "unavailable") mocks.contact.mockResolvedValue(Response.json({ error: "Unavailable" }, { status: 503 }));
    if (defect === "invalid_reference") rows[0].learner_id = "forged";
    expect((await request({ action: "email", ids: [candidateId], requestKey, subject: "Subject", message: "Message" })).status)
      .toBe(defect === "unavailable" ? 503 : 403);
    expect(mocks.send).not.toHaveBeenCalled(); expect(mocks.from).not.toHaveBeenCalledWith("recruitment_email_submissions");
  });
  it("resolves a user alias through the canonical candidate and ignores cached pipeline email", async () => {
    rows[0].learner_id = learnerUserId; rows[0].candidate_email = "stale@example.test";
    expect((await request({ action: "email", ids: [candidateId], requestKey, subject: "Subject", message: "Message" })).status).toBe(200);
    expect(mocks.send).toHaveBeenCalledWith(expect.objectContaining({ to: "current@example.test" }), expect.anything());
  });
});

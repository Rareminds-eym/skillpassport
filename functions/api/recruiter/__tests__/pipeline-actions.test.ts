// @vitest-environment node
import { beforeEach, describe, it, expect, vi } from "vitest";
import { onRequest } from "../pipeline-actions";
const mocks = vi.hoisted(() => ({
  from: vi.fn(),
  rpc: vi.fn(),
  scope: vi.fn(),
  send: vi.fn(),
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
const candidateId = "11111111-1111-4111-8111-111111111111",
  requestKey = "22222222-2222-4222-8222-222222222222";
let rows: any[], submissions: any[];
const chains: any = {};
function chain(table: string) {
  const q: any = {};
  for (const method of ["select", "eq", "in", "insert", "update", "single"])
    q[method] = vi.fn().mockReturnValue(q);
  q.then = (resolve: any) =>
    Promise.resolve(
      table === "pipeline_candidates"
        ? { data: rows, error: null }
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
  rows = [
    {
      id: candidateId,
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
        to: "fixture@example.test",
        html: expect.stringContaining("&lt;script&gt;"),
      }),
      expect.anything(),
    );
    expect((await response.json()).data.results[0].state).toBe("submitted");
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
    expect((await response.json()).data.results[0].state).toBe("unknown");
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
    expect((await response.json()).data.results[0].state).toBe("submitted");
    expect(mocks.send).not.toHaveBeenCalled();
  });
  it("rejects an invalid recipient before any delivery or claim", async () => {
    rows[0].candidate_email = "invalid";
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
    ).toBe(400);
    expect(mocks.send).not.toHaveBeenCalled();
  });
});

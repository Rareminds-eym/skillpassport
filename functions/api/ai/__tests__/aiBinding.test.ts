import { describe, expect, it } from "vitest";
import { getAiWorker, rpcErrorToHttpStatus, toAiHttpError } from "../lib/aiBinding.js";
import { issueExecutionAssertion } from "../lib/assertion.js";

describe("aiBinding", () => {
  it("throws a 503-mapped error when the binding is missing", () => {
    expect(() => getAiWorker({})).toThrowError(/AI_SERVICE binding is not configured/);
    try {
      getAiWorker({});
      expect.unreachable();
    } catch (error) {
      expect(rpcErrorToHttpStatus(error)).toBe(503);
    }
  });

  it("returns the configured stub untouched (no caching layer)", () => {
    const stub = { careerTalentStrategist: async () => ({}) } as never;
    expect(getAiWorker({ AI_SERVICE: stub } as never)).toBe(stub);
  });

  it("maps worker codes to HTTP statuses", () => {
    const cases: Array<[string, number]> = [
      ["INVALID_INPUT: x", 400],
      ["UNAUTHORIZED: x", 401],
      ["FEATURE_ACCESS_DENIED: x", 403],
      ["RATE_LIMIT_EXCEEDED: x", 429],
      ["BUDGET_EXCEEDED: x", 429],
      ["IDEMPOTENCY_CONFLICT: x", 409],
      ["DEPENDENCY_UNAVAILABLE: x", 502],
      ["DOWNSTREAM_TIMEOUT: x", 504],
      ["INVALID_MODEL_OUTPUT: x", 502],
      ["INTERNAL_ERROR: x", 500],
      ["something else entirely", 500],
    ];
    for (const [message, status] of cases) {
      expect(rpcErrorToHttpStatus(new Error(message))).toBe(status);
    }
    const mapped = toAiHttpError(new Error("BUDGET_EXCEEDED: cap"));
    expect(mapped.status).toBe(429);
    expect(mapped.body.error.code).toBe("BUDGET_EXCEEDED");
    expect(mapped.body.error.retryable).toBe(true);
    expect(toAiHttpError(new Error("INTERNAL_ERROR: x")).body.error.retryable).toBe(false);
  });
});

describe("issueExecutionAssertion", () => {
  const secret = "pages-test-secret-min-32-chars-00!";

  it("mints v1 three-part tokens deterministically", async () => {
    const claims = {
      issuer: "skillpassport" as const,
      action: "careerTalentStrategist.chat",
      userId: "u-1",
      product: "skillpassport",
      entitlements: ["career_ai"],
    };
    const a = await issueExecutionAssertion(secret, claims, 1000);
    const b = await issueExecutionAssertion(secret, claims, 1000);
    expect(a).toBe(b);
    expect(a.split(".")).toHaveLength(3);
    expect(a.startsWith("v1.")).toBe(true);
    const other = await issueExecutionAssertion(`${secret}DIFFERENT____________`, claims, 1000);
    expect(other).not.toBe(a);
  });

  it("rejects short secrets before minting", async () => {
    await expect(
      issueExecutionAssertion("short", {
        issuer: "skillpassport",
        action: "x",
        userId: "u",
        product: "skillpassport",
        entitlements: [],
      }),
    ).rejects.toThrowError(/at least 32/);
  });
});

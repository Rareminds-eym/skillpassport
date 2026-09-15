import { describe, expect, it } from "vitest";
import {
  handleGetExecutionStatus,
  handleCancelExecution,
} from "../handlers/executions.js";

const SECRET = "test-secret-32-chars-minimum-!!!!";
const USER = "user-123";
const EXEC = "exec-abc";

interface Body {
  success: boolean;
  data?: unknown;
  error?: { code?: string; message?: string };
}

async function bodyOf(res: Response): Promise<Body> {
  return (await res.json()) as Body;
}

function req(): Request {
  return new Request("https://pages.local/api/ai/executions/exec-abc");
}

function okStatus(state = "completed") {
  return {
    ok: true as const,
    data: { state, executionId: EXEC },
    requestId: "r-1",
    traceId: "t-1",
  };
}

function errStatus(code: string) {
  return {
    ok: false as const,
    error: { code, message: `${code} happened`, requestId: "r-1", retryable: false },
  };
}

describe("ai executions adapter", () => {
  it("GET returns the worker status payload untouched", async () => {
    let calls = 0;
    let seen: unknown;
    const getExecutionStatus = async (r: unknown) => {
      calls += 1;
      seen = r;
      return okStatus();
    };
    const env = { AI_SERVICE: { getExecutionStatus }, AI_ASSERT_SECRET: SECRET };
    const res = await handleGetExecutionStatus(req(), env as never, USER, EXEC, {
      checkEntitlement: async () => true,
    });
    expect(res.status).toBe(200);
    const body = await bodyOf(res);
    expect(body.success).toBe(true);
    expect(body.data).toEqual({ state: "completed", executionId: EXEC });
    expect(calls).toBe(1);
    const call = seen as {
      input: unknown;
      actor: unknown;
      executionAssertion: unknown;
    };
    expect(call.input).toEqual({ executionId: EXEC });
    expect(call.actor).toEqual({ actorId: USER, product: "skillpassport" });
    expect(typeof call.executionAssertion).toBe("string");
  });

  it("denies before minting when unentitled (worker never called)", async () => {
    let calls = 0;
    const getExecutionStatus = async () => {
      calls += 1;
      return okStatus();
    };
    const env = { AI_SERVICE: { getExecutionStatus }, AI_ASSERT_SECRET: SECRET };
    const res = await handleGetExecutionStatus(req(), env as never, USER, EXEC, {
      checkEntitlement: async () => false,
    });
    expect(res.status).toBe(403);
    expect(calls).toBe(0);
  });

  it("rejects missing and overlong execution ids without touching the worker", async () => {
    let calls = 0;
    const getExecutionStatus = async () => {
      calls += 1;
      return okStatus();
    };
    const env = { AI_SERVICE: { getExecutionStatus }, AI_ASSERT_SECRET: SECRET };
    const ports = { checkEntitlement: async () => true };
    for (const id of ["", "x".repeat(129)]) {
      const res = await handleGetExecutionStatus(req(), env as never, USER, id, ports);
      expect(res.status).toBe(400);
    }
    expect(calls).toBe(0);
  });

  it("maps a missing binding to 503", async () => {
    const res = await handleGetExecutionStatus(req(), {} as never, USER, EXEC, {
      checkEntitlement: async () => true,
    });
    expect(res.status).toBe(503);
  });

  it("maps a missing secret to 500 without calling the worker", async () => {
    let calls = 0;
    const getExecutionStatus = async () => {
      calls += 1;
      return okStatus();
    };
    const env = { AI_SERVICE: { getExecutionStatus } };
    const res = await handleGetExecutionStatus(req(), env as never, USER, EXEC, {
      checkEntitlement: async () => true,
    });
    expect(res.status).toBe(500);
    expect(calls).toBe(0);
  });

  it("maps worker UNAUTHORIZED to 401 on cancel", async () => {
    const cancelExecution = async () => errStatus("UNAUTHORIZED");
    const env = { AI_SERVICE: { cancelExecution }, AI_ASSERT_SECRET: SECRET };
    const res = await handleCancelExecution(req(), env as never, USER, EXEC, {
      checkEntitlement: async () => true,
    });
    expect(res.status).toBe(401);
    const body = await bodyOf(res);
    expect(body.error?.code).toBe("UNAUTHORIZED");
  });

  it("cancel returns completed state on success with a cancel operation id", async () => {
    let seen: unknown;
    const cancelExecution = async (r: unknown) => {
      seen = r;
      return okStatus("cancelled");
    };
    const env = { AI_SERVICE: { cancelExecution }, AI_ASSERT_SECRET: SECRET };
    const res = await handleCancelExecution(req(), env as never, USER, EXEC, {
      checkEntitlement: async () => true,
    });
    expect(res.status).toBe(200);
    const call = seen as { operationId: unknown };
    expect(call.operationId).toBe(`cx-${EXEC}`);
  });
});

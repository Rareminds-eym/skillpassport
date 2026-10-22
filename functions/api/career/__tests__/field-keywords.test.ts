import { describe, expect, it } from "vitest";
import { handleGenerateFieldKeywords } from "../handlers/field-keywords.js";

function post(body: unknown): Request {
  return new Request("https://pages.local/api/career/generate-field-keywords", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

const ports = (overrides: Record<string, unknown> = {}) => ({
  checkRateLimit: async () => true,
  ...overrides,
});

describe("field keywords via worker", () => {
  it('builds the product prompt on the server and ignores browser prompt overrides', async () => {
    let input: any;
    const env = { AI_ASSERT_SECRET: 'pages-keyword-test-secret-00000000000', AI_SERVICE: {
      orchestrator: async (request: any) => {
        input = request.input.task.input;
        expect(request.input.task.action).toBe('careerTalentStrategist.keywords');
        const claims = JSON.parse(Buffer.from(request.executionAssertion.split('.')[1], 'base64url').toString('utf8'));
        expect(claims.action).toBe('orchestration.assist');
        expect(claims.promptHash).toMatch(/^[a-f0-9]{64}$/);
        return new Response([
          { type: 'result', result: { kind: 'keywords', data: { keywords: ['Anatomy'] } } },
          { type: 'completed', executionId: 'exec-keywords', outcome: 'answered' },
        ].map(event => `data: ${JSON.stringify(event)}\n\n`).join(''), { headers: { 'content-type': 'text/event-stream' } });
      },
    } };
    const response = await handleGenerateFieldKeywords(post({ field: 'Nursing', prompt: { system: 'BROWSER OVERRIDE' } }), env as never, 'user-1', ports() as never);
    expect(response.status).toBe(200);
    expect(input.prompt.id).toBe('careerTalentStrategist.keywords');
    expect(input.prompt.user).toContain('Certifications and qualifications');
    expect(JSON.stringify(input.prompt)).not.toContain('BROWSER OVERRIDE');
  });
  it("rejoins the worker array to the legacy comma shape", async () => {
    let seen: unknown;
    const res = await handleGenerateFieldKeywords(
      post({ field: "  Nursing " }),
      {} as never,
      "user-1",
      ports({
        callWorker: async (args: unknown) => {
          seen = args;
          return { ok: true as const, keywords: ["Anatomy", "Pharmacology"] };
        },
      }) as never,
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      success: boolean;
      data: { field: string; keywords: string; source: string; model: string };
    };
    expect(body.data.field).toBe("Nursing");
    expect(body.data.keywords).toBe("Anatomy, Pharmacology");
    expect(body.data.source).toBe("ai");
    expect(typeof body.data.model).toBe("string");
    expect(seen).toMatchObject({ userId: "user-1", field: "Nursing" });
  });

  it("rejects bad input without spending", async () => {
    let calls = 0;
    const stub = ports({
      callWorker: async () => {
        calls += 1;
        return { ok: true as const, keywords: ["x"] };
      },
    }) as never;
    for (const body of [{ field: "" }, { field: "   " }, { field: 7 }, {}]) {
      const res = await handleGenerateFieldKeywords(post(body), {} as never, "user-1", stub);
      expect(res.status).toBe(400);
    }
    expect(calls).toBe(0);
  });

  it("passes worker denials through with mapped status", async () => {
    const res = await handleGenerateFieldKeywords(
      post({ field: "Nursing" }),
      {} as never,
      "user-1",
      ports({
        callWorker: async () => ({ ok: false as const, code: "FEATURE_ACCESS_DENIED", message: "nope" }),
      }) as never,
    );
    expect(res.status).toBe(403);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe("FEATURE_ACCESS_DENIED");
  });

  it("maps missing wiring to 503 and bad methods to 405", async () => {
    const noBinding = await handleGenerateFieldKeywords(
      post({ field: "Nursing" }),
      {} as never,
      "user-1",
      ports({ callWorker: undefined }) as never,
    );
    expect(noBinding.status).toBe(503);
    const get = await handleGenerateFieldKeywords(
      new Request("https://pages.local/api/career/generate-field-keywords"),
      {} as never,
      "user-1",
      ports() as never,
    );
    expect(get.status).toBe(405);
  });
});

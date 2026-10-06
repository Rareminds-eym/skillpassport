import { describe, expect, it } from "vitest";
import {
  callCloudflareWithRetry,
  getCloudflareConfig,
  CLOUDFLARE_MODELS,
} from "../ai-config.js";
import { CF_FALLBACK_MODEL, CF_PRIMARY_MODEL } from "../cloudflare-ai.js";
import { generateMiddleSchoolReports } from "../../assessment/services/core/report-generator.js";

describe("cloudflare shared seam", () => {
  it("returns null (never throws) when the binding is absent", () => {
    expect(getCloudflareConfig({})).toBeNull();
    expect(getCloudflareConfig(undefined)).toBeNull();
    expect(getCloudflareConfig({ AI: {} })).toBeNull();
    expect(getCloudflareConfig({ OPENROUTER_API_KEY: "legacy" })).toBeNull();
  });

  it("resolves binding and gateway id without reading secrets", () => {
    const ai = { run: async () => ({}) };
    const config = getCloudflareConfig({ AI: ai, AI_GATEWAY_ID: "gw-9", OPENROUTER_API_KEY: "legacy" });
    expect(config?.ai).toBe(ai);
    expect(config?.gatewayId).toBe("gw-9");
  });

  it("throws a clear configuration error without the binding", async () => {
    await expect(callCloudflareWithRetry({}, [{ role: "user", content: "hi" }])).rejects.toThrowError(
      /Cloudflare AI binding is not configured/,
    );
  });

  it("calls GLM first and advances to Nemotron on retryable failure", async () => {
    const attempted: string[] = [];
    const seenGateways: unknown[] = [];
    const ai = {
      run: async (model: string, _inputs: unknown, options: unknown) => {
        attempted.push(model);
        seenGateways.push(options);
        if (model === CF_PRIMARY_MODEL) {
          return { error: { message: "overloaded" } };
        }
        return { response: "recovered", usage: { prompt_tokens: 2, completion_tokens: 1 } };
      },
    };
    const text = await callCloudflareWithRetry(
      { AI: ai, AI_GATEWAY_ID: "gw-1" },
      [{ role: "user", content: "hi" }],
      { maxTokens: 50, temperature: 0 },
    );
    expect(text).toBe("recovered");
    expect(attempted).toEqual([CF_PRIMARY_MODEL, CF_FALLBACK_MODEL]);
    expect(seenGateways[0]).toEqual({ gateway: { id: "gw-1", skipCache: true } });
    expect(CLOUDFLARE_MODELS).toEqual([CF_PRIMARY_MODEL, CF_FALLBACK_MODEL]);
  });
});

describe("report generator non-fatal semantics", () => {
  it("returns null without the binding instead of throwing", async () => {
    await expect(generateMiddleSchoolReports({}, "Asha", "8", "School", {})).resolves.toBeNull();
  });
});

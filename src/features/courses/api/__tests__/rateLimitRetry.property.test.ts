/**
 * Property-Based Test: Rate Limit Retry
 * **Feature: rag-course-recommendations, Property 10: Rate Limit Retry**
 * **Validates: Requirements 6.1**
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as fc from "fast-check";
import { generateEmbedding, generateBatchEmbeddings } from "../embeddingService";
import { ssoClient } from "@/shared/api/ssoClient";

const MAX_RETRIES = 4;
const EMBEDDING_DIMENSION = 768;

const nonEmptyTextArbitrary = fc.string({ minLength: 10, maxLength: 50 }).filter(s => s.trim().length >= 10);
const rateLimitFailuresArbitrary = fc.integer({ min: 0, max: 2 });

const createTestEmbedding = (text: string): number[] => {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = ((hash << 5) - hash) + text.charCodeAt(i);
    hash = hash & hash;
  }
  const embedding: number[] = [];
  let seed = Math.abs(hash);
  for (let i = 0; i < EMBEDDING_DIMENSION; i++) {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    embedding.push((seed / 0x7fffffff) * 2 - 1);
  }
  return embedding;
};

const createRateLimitResponse = () => ({
  ok: false,
  status: 429,
  statusText: "Too Many Requests",
  clone: function() { return this; },
  json: async () => ({ error: { code: 429, status: "RESOURCE_EXHAUSTED", message: "Rate limit exceeded" } })
});

const createSuccessResponse = (text: string) => ({
  ok: true,
  status: 200,
  statusText: "OK",
  clone: function() { return this; },
  json: async () => ({ embedding: { values: createTestEmbedding(text) } })
});

const createBatchSuccessResponse = (texts: string[]) => ({
  ok: true,
  status: 200,
  statusText: "OK",
  clone: function() { return this; },
  json: async () => ({ embeddings: texts.map(t => ({ values: createTestEmbedding(t) })) })
});

describe("Property 10: Rate Limit Retry", () => {
  let mockSsoFetch: ReturnType<typeof vi.fn>;
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(ssoClient, 'getAccessToken').mockReturnValue('mock-token');
  });
  afterEach(() => { vi.restoreAllMocks(); });

  it("should retry and succeed when rate limited", async () => {
    await fc.assert(fc.asyncProperty(nonEmptyTextArbitrary, rateLimitFailuresArbitrary, async (text, numFailures) => {
      let callCount = 0;
      mockSsoFetch = vi.fn().mockImplementation(async (_url: string, options: RequestInit) => {
        callCount++;
        if (callCount <= numFailures) return createRateLimitResponse();
        const body = JSON.parse(options.body as string);
        return createSuccessResponse(body.text || body.content?.parts?.[0]?.text || "");
      });
      vi.spyOn(ssoClient, 'fetch').mockImplementation(mockSsoFetch as any);

      const embedding = await generateEmbedding(text);
      expect(mockSsoFetch).toHaveBeenCalledTimes(numFailures + 1);
      expect(embedding).toHaveLength(EMBEDDING_DIMENSION);
      expect(embedding.every((v: number) => typeof v === "number" && !isNaN(v))).toBe(true);
    }), { numRuns: 10 });
  }, 120000);

  it("should fail gracefully after max retries", async () => {
    await fc.assert(fc.asyncProperty(nonEmptyTextArbitrary, async (text) => {
      mockSsoFetch = vi.fn().mockImplementation(async () => createRateLimitResponse());
      vi.spyOn(ssoClient, 'fetch').mockImplementation(mockSsoFetch as any);

      let threwError = false, errorMessage = "";
      try { await generateEmbedding(text); } catch (e: any) { threwError = true; errorMessage = e.message || ""; }
      expect(threwError).toBe(true);
      expect(errorMessage.toLowerCase()).toContain("rate limit");
      expect(mockSsoFetch).toHaveBeenCalledTimes(MAX_RETRIES + 1);
    }), { numRuns: 5 });
  }, 120000);

  it("should handle batch rate limiting", async () => {
    await fc.assert(fc.asyncProperty(fc.array(nonEmptyTextArbitrary, { minLength: 1, maxLength: 3 }), fc.integer({ min: 0, max: 1 }), async (texts, numFailures) => {
      let callCount = 0;
      mockSsoFetch = vi.fn().mockImplementation(async (_url: string, options: RequestInit) => {
        callCount++;
        if (callCount <= numFailures) return createRateLimitResponse();
        const body = JSON.parse(options.body as string);
        return createBatchSuccessResponse(body.requests?.map((r: any) => r.content?.parts?.[0]?.text || "") || []);
      });
      vi.spyOn(ssoClient, 'fetch').mockImplementation(mockSsoFetch as any);

      const embeddings = await generateBatchEmbeddings(texts);
      expect(mockSsoFetch).toHaveBeenCalledTimes(numFailures + 1);
      expect(embeddings).toHaveLength(texts.length);
      embeddings.forEach((emb: number[]) => expect(emb).toHaveLength(EMBEDDING_DIMENSION));
    }), { numRuns: 10 });
  }, 120000);

  it("should handle RESOURCE_EXHAUSTED status", async () => {
    await fc.assert(fc.asyncProperty(nonEmptyTextArbitrary, async (text) => {
      let callCount = 0;
      mockSsoFetch = vi.fn().mockImplementation(async (_url: string, options: RequestInit) => {
        callCount++;
        if (callCount === 1) return { ok: false, status: 429, statusText: "Too Many Requests", clone: function() { return this; }, json: async () => ({ error: { status: "RESOURCE_EXHAUSTED" } }) };
        const body = JSON.parse(options.body as string);
        return createSuccessResponse(body.text || body.content?.parts?.[0]?.text || "");
      });
      vi.spyOn(ssoClient, 'fetch').mockImplementation(mockSsoFetch as any);

      const embedding = await generateEmbedding(text);
      expect(mockSsoFetch).toHaveBeenCalledTimes(2);
      expect(embedding).toHaveLength(EMBEDDING_DIMENSION);
    }), { numRuns: 10 });
  }, 120000);

  it("should succeed immediately without rate limiting", async () => {
    await fc.assert(fc.asyncProperty(nonEmptyTextArbitrary, async (text) => {
      mockSsoFetch = vi.fn().mockImplementation(async (_url: string, options: RequestInit) => {
        const body = JSON.parse(options.body as string);
        return createSuccessResponse(body.text || body.content?.parts?.[0]?.text || "");
      });
      vi.spyOn(ssoClient, 'fetch').mockImplementation(mockSsoFetch as any);

      const embedding = await generateEmbedding(text);
      expect(mockSsoFetch).toHaveBeenCalledTimes(1);
      expect(embedding).toHaveLength(EMBEDDING_DIMENSION);
    }), { numRuns: 20 });
  }, 60000);
});
